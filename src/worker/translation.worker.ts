type WorkerRequest = {
  id: string;
  text: string;
  from: string;
  to: string;
  /** Terms that must not be translated (e.g. company names, proper nouns). */
  protectedTerms?: string[];
};

type WorkerResponse =
  | { id: string; status: 'loading'; model: string }
  | { id: string; status: 'progress'; loaded: number; total: number }
  | { id: string; status: 'done'; result: string }
  | { id: string; status: 'error'; error: string };

/**
 * Replace each protected term in `text` with an opaque uppercase token
 * (e.g. "Sunbelt Inc" → "XPROT0X") that the NMT model will copy verbatim
 * instead of translating.  Returns the masked text and a map for restoring.
 */
function maskProtectedTerms(text: string, terms: string[]): { masked: string; tokenMap: Map<string, string> } {
  const tokenMap = new Map<string, string>();
  let masked = text;
  terms.forEach((term, i) => {
    if (!term.trim()) return;
    const token = `XPROT${i}X`;
    // Case-insensitive, whole-word boundary match
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), token);
    tokenMap.set(token, term);
  });
  return { masked, tokenMap };
}

/** Restore the original terms from the token map. */
function unmaskProtectedTerms(text: string, tokenMap: Map<string, string>): string {
  let restored = text;
  tokenMap.forEach((original, token) => {
    restored = restored.replace(new RegExp(token, 'gi'), original);
  });
  return restored;
}



type TranslateFn = (text: string, opts?: Record<string, unknown>) => Promise<Array<{ translation_text: string }>>;

type TransformersModule = {
  pipeline: (
    task: string,
    model: string,
    opts?: { progress_callback?: (info: { status: string; loaded?: number; total?: number }) => void }
  ) => Promise<unknown>;
  env: {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
  };
};

// Cache loaded pipelines so repeat translations with the same pair are instant
const pipelineCache = new Map<string, TranslateFn>();
let transformersModulePromise: Promise<TransformersModule> | null = null;
const getTransformersModule = async (): Promise<TransformersModule> => {
  if (!transformersModulePromise) {
    transformersModulePromise = import('@xenova/transformers') as Promise<TransformersModule>;
  }

  const mod = await transformersModulePromise;

  // Always fetch from Hugging Face Hub; skip looking for local copies
  mod.env.allowLocalModels = false;

  // Use browser cache so the model is only downloaded once
  mod.env.useBrowserCache = true;

  return mod;
};

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, text, from, to, protectedTerms = [] } = event.data;
  console.log(`[Worker] ← message received [${id}]:`, { text, from, to, protectedTerms });

  if (from === to) {
    console.log(`[Worker] from === to ("${from}"), returning input unchanged.`);
    self.postMessage({ id, status: 'done', result: text } satisfies WorkerResponse);
    return;
  }

  // @xenova/transformers requires ONNX-converted models.
  // The Xenova org mirrors Helsinki-NLP OPUS-MT models in ONNX format.
  const modelName = `Xenova/opus-mt-${from}-${to}`;
  console.log(`[Worker] Model: ${modelName}`);

  try {
    console.log('[Worker] Loading Transformers.js module…');
    const { pipeline } = await getTransformersModule();
    console.log('[Worker] Transformers.js module ready.');

    self.postMessage({ id, status: 'loading', model: modelName } satisfies WorkerResponse);

    if (!pipelineCache.has(modelName)) {
      console.log(`[Worker] Pipeline not cached — downloading/loading model: ${modelName}`);
      const translator = await pipeline('translation', modelName, {
        progress_callback: (info: { status: string; loaded?: number; total?: number }) => {
          console.log(`[Worker] Progress callback:`, info);
          if (info.status === 'progress' && info.loaded !== undefined && info.total !== undefined) {
            self.postMessage({
              id,
              status: 'progress',
              loaded: info.loaded,
              total: info.total,
            } satisfies WorkerResponse);
          }
        },
      });
      pipelineCache.set(modelName, translator as unknown as TranslateFn);
      console.log(`[Worker] Pipeline cached for: ${modelName}`);
    } else {
      console.log(`[Worker] Pipeline cache hit for: ${modelName}`);
    }

    const translator = pipelineCache.get(modelName)!;

    // Mask protected terms so the model copies them verbatim
    const { masked, tokenMap } = maskProtectedTerms(text, protectedTerms);
    if (tokenMap.size > 0) {
      console.log(`[Worker] Masked ${tokenMap.size} protected term(s):`, Object.fromEntries(tokenMap));
    }

    console.log(`[Worker] Running inference on: "${masked}"`);
    const output = await translator(masked);
    console.log('[Worker] Raw inference output:', output);
    const rawResult = output.length > 0 ? output[0].translation_text : '';

    // Restore protected terms in the translated output
    const result = unmaskProtectedTerms(rawResult, tokenMap);
    if (tokenMap.size > 0) {
      console.log(`[Worker] Restored protected terms → "${result}"`);
    }

    console.log(`[Worker] → done [${id}]: "${result}"`);
    self.postMessage({ id, status: 'done', result } satisfies WorkerResponse);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : `No OPUS-MT model found for ${from} → ${to}. Try a different language pair.`;

    console.error(`[Worker] → error [${id}]:`, message, err);
    self.postMessage({ id, status: 'error', error: message } satisfies WorkerResponse);
  }
});
