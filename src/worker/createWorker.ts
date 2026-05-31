/**
 * Inline worker factory.
 *
 * Vite's `?worker&inline` query embeds the worker bundle as a base64 blob URL
 * at build time, so consumers need zero extra bundler configuration.
 *
 * Usage:
 *   import { createTranslationWorker } from './worker/createWorker';
 *   const worker = createTranslationWorker();
 */

// the query suffix is not valid TypeScript but is processed by Vite's bundler.
import TranslationWorkerConstructor from './translation.worker?worker&inline';

export function createTranslationWorker(): Worker {
  return new TranslationWorkerConstructor() as Worker;
}
