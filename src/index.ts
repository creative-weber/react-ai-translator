/**
 * react-ai-translator
 *
 * Public package entry point.
 * Phase 1: languages, types, and worker factory.
 * Phase 2: DOM translation engine (domWalker, chunkText, usePageTranslator).
 * Phase 3: UI components (FloatingTranslatorButton, LanguagePicker, TranslationProgress).
 * Phase 4: Context & Provider (AITranslatorProvider, useAITranslator).
 */

// Language data
export { LANGUAGES, getLangLabel, getLangFlag } from './languages';

// Types
export type { Language, WorkerResponse } from './types';

// Worker factory (inline-bundled, no consumer bundler config needed)
export { createTranslationWorker } from './worker/createWorker';

// Phase 2 — DOM translation engine
export {
  collectTextNodes,
  applyTranslations,
  revertTranslations,
} from './utils/domWalker';
export type { TextNodeEntry } from './utils/domWalker';

export { chunkTexts, mergeChunkResults } from './utils/chunkText';
export type { TextItem, Chunk } from './utils/chunkText';

export { usePageTranslator } from './hooks/usePageTranslator';

// Phase 3 — UI components
export { FloatingTranslatorButton } from './components/FloatingTranslatorButton';
export type {
  FloatingTranslatorButtonProps,
  ButtonPosition,
} from './components/FloatingTranslatorButton';
export { LanguagePicker } from './components/LanguagePicker';
export type { LanguagePickerProps } from './components/LanguagePicker';
export { TranslationProgress } from './components/TranslationProgress';
export type { TranslationProgressProps } from './components/TranslationProgress';
export type { TranslatorStatus, PageTranslatorState, UsePageTranslatorReturn } from './hooks/usePageTranslator';

// Phase 4 — Context & Provider
export { AITranslatorProvider, useAITranslator } from './context/TranslatorContext';
export type {
  AITranslatorContextValue,
  AITranslatorProviderProps,
} from './context/TranslatorContext';
