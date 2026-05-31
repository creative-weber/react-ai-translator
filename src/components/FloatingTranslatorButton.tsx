/**
 * FloatingTranslatorButton.tsx
 *
 * A fixed-position button that drives the full translation UX:
 *
 *   idle          → globe icon  (click → open LanguagePicker)
 *   loading-model → spinner + TranslationProgress bar
 *   translating   → animated dots
 *   done          → current language flag  (click → open LanguagePicker again)
 *   error         → red ! icon  (click → open LanguagePicker to retry)
 *
 * Long-press (>600 ms) or right-click on a translated button → revert to original.
 *
 * All styles are inline — nothing leaks into the consumer's stylesheet.
 */

import React, { useCallback, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { LanguagePicker } from './LanguagePicker';
import { TranslationProgress } from './TranslationProgress';
import { getLangFlag } from '../languages';
import type { TranslatorStatus } from '../hooks/usePageTranslator';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ButtonPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface FloatingTranslatorButtonProps {
  status: TranslatorStatus;
  modelProgress: number;
  currentLanguage: string | null;
  onTranslate: (langCode: string) => void;
  onRevert: () => void;
  position?: ButtonPosition;
}

// --------------------------------------------------------------------------
// Position helpers
// --------------------------------------------------------------------------

function positionStyle(position: ButtonPosition): React.CSSProperties {
  const base: React.CSSProperties = { position: 'fixed', zIndex: 2147483647 };
  const offset = 20;
  switch (position) {
    case 'bottom-left':
      return { ...base, bottom: offset, left: offset };
    case 'top-right':
      return { ...base, top: offset, right: offset };
    case 'top-left':
      return { ...base, top: offset, left: offset };
    case 'bottom-right':
    default:
      return { ...base, bottom: offset, right: offset };
  }
}

// --------------------------------------------------------------------------
// Spinner (pure CSS, inline keyframes)
// --------------------------------------------------------------------------

const SPIN_KEYFRAMES = `
@keyframes rait-spin {
  to { transform: rotate(360deg); }
}
@keyframes rait-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
`;

// --------------------------------------------------------------------------
// Component
// --------------------------------------------------------------------------

export function FloatingTranslatorButton({
  status,
  modelProgress,
  currentLanguage,
  onTranslate,
  onRevert,
  position = 'bottom-right',
}: FloatingTranslatorButtonProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // Long-press detection for revert
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback(() => {
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      if (currentLanguage) onRevert();
    }, 600);
  }, [currentLanguage, onRevert]);

  const handlePointerUp = useCallback(() => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      // Short press → open picker (unless a translation is running)
      if (status === 'idle' || status === 'done' || status === 'error') {
        setPickerOpen(true);
      }
    }
  }, [status]);

  const handlePointerLeave = useCallback(() => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (currentLanguage) onRevert();
    },
    [currentLanguage, onRevert]
  );

  const handleSelect = useCallback(
    (code: string) => {
      setPickerOpen(false);
      onTranslate(code);
    },
    [onTranslate]
  );

  // ---------- Button visuals ----------

  const isActive = status === 'loading-model' || status === 'translating';

  const buttonStyle: React.CSSProperties = {
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: 'none',
    cursor: isActive ? 'default' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: status === 'loading-model' ? '8px 10px' : 0,
    background:
      status === 'error'
        ? '#ef4444'
        : status === 'done'
        ? '#4f46e5'
        : '#6366f1',
    boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
    transition: 'background 0.2s, transform 0.1s',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  // Determine inner content
  let content: React.ReactNode;
  switch (status) {
    case 'loading-model':
      content = (
        <>
          {/* Spinning ring */}
          <div
            style={{
              width: 22,
              height: 22,
              border: '2.5px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'rait-spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          <TranslationProgress progress={modelProgress} />
        </>
      );
      break;

    case 'translating':
      content = (
        <span
          style={{
            color: '#fff',
            fontSize: 22,
            animation: 'rait-pulse 1.2s ease-in-out infinite',
          }}
        >
          🌐
        </span>
      );
      break;

    case 'done':
      content = (
        <span style={{ fontSize: 26, lineHeight: 1 }}>
          {getLangFlag(currentLanguage ?? '')}
        </span>
      );
      break;

    case 'error':
      content = (
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>!</span>
      );
      break;

    case 'idle':
    default:
      content = (
        <span style={{ color: '#fff', fontSize: 24, lineHeight: 1 }}>🌐</span>
      );
  }

  const tooltip =
    status === 'idle'
      ? 'Translate page'
      : status === 'loading-model'
      ? 'Loading model…'
      : status === 'translating'
      ? 'Translating…'
      : status === 'done'
      ? `Translated to ${currentLanguage} — long-press to revert`
      : 'Translation error — click to retry';

  return (
    <>
      {/* Inject keyframes once */}
      <style>{SPIN_KEYFRAMES}</style>

      {/* Floating button */}
      <button
        style={{ ...positionStyle(position), ...buttonStyle }}
        aria-label={tooltip}
        title={tooltip}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={handleContextMenu}
      >
        {content}
      </button>

      {/* Language picker portal */}
      {pickerOpen &&
        ReactDOM.createPortal(
          <LanguagePicker
            currentLang={currentLanguage}
            onSelect={handleSelect}
            onClose={() => setPickerOpen(false)}
          />,
          document.body
        )}
    </>
  );
}
