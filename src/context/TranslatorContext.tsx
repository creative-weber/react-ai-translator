/**
 * TranslatorContext.tsx
 *
 * Phase 4 — Context & Provider
 *
 * Provides a React context that wraps `usePageTranslator` and automatically
 * injects the <FloatingTranslatorButton> via a React portal into document.body.
 *
 * Usage:
 *
 *   // main.tsx / App.tsx
 *   import { AITranslatorProvider } from 'react-ai-translator';
 *
 *   <AITranslatorProvider>
 *     <App />
 *   </AITranslatorProvider>
 *
 * Then anywhere in the tree:
 *
 *   import { useAITranslator } from 'react-ai-translator';
 *
 *   const { translatePage, revertPage, status, currentLanguage } = useAITranslator();
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type PropsWithChildren,
} from 'react';
import ReactDOM from 'react-dom';
import { usePageTranslator } from '../hooks/usePageTranslator';
import { FloatingTranslatorButton } from '../components/FloatingTranslatorButton';
import type { UsePageTranslatorReturn } from '../hooks/usePageTranslator';
import type { ButtonPosition } from '../components/FloatingTranslatorButton';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

/**
 * The value exposed by the AI Translator context.
 * Consumers get the full `UsePageTranslatorReturn` plus any extra helpers.
 */
export type AITranslatorContextValue = UsePageTranslatorReturn;

const AITranslatorContext = createContext<AITranslatorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface AITranslatorProviderProps {
  /**
   * Where to place the floating button.
   * @default 'bottom-right'
   */
  position?: ButtonPosition;

  /**
   * Set to `false` to suppress the automatic floating button.
   * Useful when you want to place <FloatingTranslatorButton> manually.
   * @default true
   */
  showFloatingButton?: boolean;

  /** Optional source language passed to every translatePage() call. */
  fromLang?: string;

  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AITranslatorProvider({
  position = 'bottom-right',
  showFloatingButton = true,
  fromLang = 'en',
  children,
}: PropsWithChildren<AITranslatorProviderProps>) {
  const translator = usePageTranslator();
  const { translatePage, revertPage, status, modelProgress, currentLanguage, dispose } =
    translator;

  // Dispose the worker when the provider unmounts
  const disposeRef = useRef(dispose);
  disposeRef.current = dispose;
  useEffect(() => () => disposeRef.current(), []);

  // Stable callbacks for the FloatingTranslatorButton
  const handleTranslate = React.useCallback(
    (langCode: string) => translatePage(langCode, fromLang),
    [translatePage, fromLang]
  );

  return (
    <AITranslatorContext.Provider value={translator}>
      {children}
      {showFloatingButton &&
        ReactDOM.createPortal(
          <FloatingTranslatorButton
            status={status}
            modelProgress={modelProgress}
            currentLanguage={currentLanguage}
            onTranslate={handleTranslate}
            onRevert={revertPage}
            position={position}
          />,
          document.body
        )}
    </AITranslatorContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the AI translator state and controls from any component inside
 * `<AITranslatorProvider>`.
 *
 * Throws if called outside of a provider — this catches integration mistakes early.
 */
export function useAITranslator(): AITranslatorContextValue {
  const ctx = useContext(AITranslatorContext);
  if (!ctx) {
    throw new Error(
      '[react-ai-translator] useAITranslator() must be called inside <AITranslatorProvider>.'
    );
  }
  return ctx;
}
