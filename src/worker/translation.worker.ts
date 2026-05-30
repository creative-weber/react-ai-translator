type WorkerRequest =
  | {
      type?: 'translate';
      id: string;
      text: string;
      from: string;
      to: string;
      /** Terms that must not be translated (e.g. company names, proper nouns). */
      protectedTerms?: string[];
    }
  | {
      type: 'warmup';
      from: string;
      to: string;
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
// In-flight promise cache: prevents duplicate pipeline() calls for the same model
const pipelineLoadingCache = new Map<string, Promise<TranslateFn>>();
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

/**
 * Load a pipeline exactly once per model name. Concurrent callers share the
 * same in-flight promise so only one download ever starts for a given model.
 */
function loadPipeline(
  modelName: string,
  progressCallback?: (info: { status: string; loaded?: number; total?: number }) => void,
): Promise<TranslateFn> {
  if (pipelineCache.has(modelName)) {
    console.log(`[Worker] loadPipeline: cache hit for "${modelName}", returning immediately.`);
    return Promise.resolve(pipelineCache.get(modelName)!);
  }
  if (!pipelineLoadingCache.has(modelName)) {
    console.log(`[Worker] loadPipeline: no in-flight load for "${modelName}", starting new download.`);
    const promise = getTransformersModule().then(({ pipeline }) =>
      pipeline('translation', modelName, {
        progress_callback: progressCallback,
      })
    ).then(translator => {
      const fn = translator as unknown as TranslateFn;
      pipelineCache.set(modelName, fn);
      pipelineLoadingCache.delete(modelName);
      console.log(`[Worker] loadPipeline: download complete, "${modelName}" moved to pipelineCache.`);
      return fn;
    }).catch(err => {
      pipelineLoadingCache.delete(modelName);
      console.error(`[Worker] loadPipeline: download failed for "${modelName}", removing from pipelineLoadingCache.`, err);
      throw err;
    });
    pipelineLoadingCache.set(modelName, promise);
  } else {
    console.log(`[Worker] loadPipeline: in-flight load already exists for "${modelName}", attaching to existing promise.`);
  }
  return pipelineLoadingCache.get(modelName)!;
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const data = event.data;

  // Warm-up: pre-load the pipeline for a language pair without translating
  if (data.type === 'warmup') {
    const { from, to } = data;
    if (from === to) return;
    const modelName = `Xenova/opus-mt-${from}-${to}`;
    if (pipelineCache.has(modelName) || pipelineLoadingCache.has(modelName)) {
      console.log(`[Worker] Warm-up skipped for "${modelName}" — already cached or loading.`);
      return;
    }
    console.log(`[Worker] Warming up model: ${modelName}`);
    try {
      await loadPipeline(modelName);
      console.log(`[Worker] Warm-up complete: ${modelName}`);
    } catch (err) {
      console.warn(`[Worker] Warm-up failed for ${modelName}:`, err);
    }
    return;
  }

  const { id, text, from, to, protectedTerms = [] } = data;
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
    await getTransformersModule();
    console.log('[Worker] Transformers.js module ready.');

    self.postMessage({ id, status: 'loading', model: modelName } satisfies WorkerResponse);

    if (!pipelineCache.has(modelName)) {
      console.log(`[Worker] Pipeline not cached — downloading/loading model: ${modelName}`);
      await loadPipeline(modelName, (info: { status: string; loaded?: number; total?: number }) => {
        console.log(`[Worker] Progress callback:`, info);
        if (info.status === 'progress' && info.loaded !== undefined && info.total !== undefined) {
          self.postMessage({
            id,
            status: 'progress',
            loaded: info.loaded,
            total: info.total,
          } satisfies WorkerResponse);
        }
      });
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
