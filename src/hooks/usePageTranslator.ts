/**
 * usePageTranslator.ts
 *
 * Orchestrates the full page-translation pipeline:
 *   1. Walk the DOM → collect visible text nodes
 *   2. Chunk the strings into batches
 *   3. Send each chunk to the translation worker
 *   4. Patch translated text back onto the DOM nodes in-place
 *   5. Provide a revert() to restore original content
 *
 * The hook manages a single persistent Worker instance for the lifetime of the
 * component that owns it.  Call `dispose()` when the component unmounts.
 */

import { useCallback, useRef, useState } from 'react';
import { createTranslationWorker } from '../worker/createWorker';
import type { WorkerResponse } from '../types';
import {
  collectTextNodes,
  applyTranslations,
  revertTranslations,
  type TextNodeEntry,
} from '../utils/domWalker';
import { chunkTexts, mergeChunkResults } from '../utils/chunkText';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type TranslatorStatus =
  | 'idle'
  | 'loading-model'
  | 'translating'
  | 'done'
  | 'error';

export interface PageTranslatorState {
  status: TranslatorStatus;
  /** Model download progress 0-100, relevant during 'loading-model'. */
  modelProgress: number;
  /** The language code currently applied to the page, or null if reverted. */
  currentLanguage: string | null;
  error: string | null;
}

export interface UsePageTranslatorReturn extends PageTranslatorState {
  translatePage: (toLang: string, fromLang?: string, root?: Node) => Promise<void>;
  revertPage: () => void;
  dispose: () => void;
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------

export function usePageTranslator(): UsePageTranslatorReturn {
  const workerRef = useRef<Worker | null>(null);
  const entriesRef = useRef<TextNodeEntry[]>([]);

  const [status, setStatus] = useState<TranslatorStatus>('idle');
  const [modelProgress, setModelProgress] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Lazily create the shared worker (one instance per hook mount). */
  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      workerRef.current = createTranslationWorker();
    }
    return workerRef.current;
  }, []);

  /**
   * Send one string to the worker and return a Promise<string>.
   * Reports loading / progress events through the status setters.
   */
  const translateOne = useCallback(
    (text: string, from: string, to: string, jobId: string): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        const worker = getWorker();

        const handler = (event: MessageEvent<WorkerResponse>) => {
          const msg = event.data;
          if (msg.id !== jobId) return;

          if (msg.status === 'loading') {
            setStatus('loading-model');
            setModelProgress(0);
          } else if (msg.status === 'progress') {
            const pct = msg.total > 0 ? Math.round((msg.loaded / msg.total) * 100) : 0;
            setModelProgress(pct);
          } else if (msg.status === 'done') {
            worker.removeEventListener('message', handler);
            resolve(msg.result);
          } else if (msg.status === 'error') {
            worker.removeEventListener('message', handler);
            reject(new Error(msg.error));
          }
        };

        worker.addEventListener('message', handler);
        worker.postMessage({ id: jobId, text, from, to });
      });
    },
    [getWorker]
  );

  /**
   * Translate the entire page to `toLang`.
   * @param toLang   BCP-47 language code (e.g. 'fr', 'de').
   * @param fromLang Source language code (defaults to 'en').
   */
  const translatePage = useCallback(
    async (toLang: string, fromLang = 'en', root?: Node) => {
      // Reset any previous error
      setError(null);
      setStatus('loading-model');
      setModelProgress(0);

      try {
        // If the page was previously translated, start from the original text.
        if (entriesRef.current.length > 0) {
          revertTranslations(entriesRef.current);
        }

        // Collect fresh text nodes (handles SPAs where the DOM may have changed)
        const entries = collectTextNodes(root ?? document.body);
        entriesRef.current = entries;

        if (entries.length === 0) {
          setStatus('done');
          setCurrentLanguage(toLang);
          return;
        }

        const texts = entries.map(e => e.originalText);
        const chunks = chunkTexts(texts);

        setStatus('translating');

        const resultMap = new Map<number, string>();

        // Process chunks sequentially to avoid flooding the worker.
        // (The worker itself is single-threaded; parallel posting would queue anyway.)
        for (const chunk of chunks) {
          const chunkResults = await Promise.all(
            chunk.items.map(item =>
              translateOne(
                item.text,
                fromLang,
                toLang,
                `page-${item.index}-${Date.now()}`
              ).then(result => ({ index: item.index, result }))
            )
          );

          chunkResults.forEach(({ index, result }) => {
            resultMap.set(index, result);
          });
        }

        const translations = mergeChunkResults(texts.length, resultMap);
        applyTranslations(entries, translations);

        setStatus('done');
        setCurrentLanguage(toLang);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus('error');
      }
    },
    [translateOne]
  );

  /** Restore all text nodes to their original content. */
  const revertPage = useCallback(() => {
    if (entriesRef.current.length > 0) {
      revertTranslations(entriesRef.current);
      entriesRef.current = [];
    }
    setStatus('idle');
    setCurrentLanguage(null);
    setError(null);
    setModelProgress(0);
  }, []);

  /** Terminate the worker and clean up. Call this on component unmount. */
  const dispose = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  return {
    status,
    modelProgress,
    currentLanguage,
    error,
    translatePage,
    revertPage,
    dispose,
  };
}
