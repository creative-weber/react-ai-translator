/**
 * LanguagePicker.tsx
 *
 * A searchable modal that lets the user pick a target language.
 * All styles are inline — no CSS leaks into the consumer's stylesheet.
 *
 * Props:
 *   onSelect(code)  — called when a language is chosen
 *   onClose()       — called when the modal is dismissed without choosing
 *   currentLang     — highlight the currently active language (if any)
 */

import React, { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../languages';

export interface LanguagePickerProps {
  onSelect: (code: string) => void;
  onClose: () => void;
  currentLang?: string | null;
}

export function LanguagePicker({ onSelect, onClose, currentLang }: LanguagePickerProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the search input as soon as the picker mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = query.trim()
    ? LANGUAGES.filter(l =>
        l.label.toLowerCase().includes(query.toLowerCase()) ||
        l.code.toLowerCase().includes(query.toLowerCase())
      )
    : LANGUAGES;

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: '0 20px 90px 0',
      }}
    >
      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose a language"
        style={{
          width: 280,
          background: '#1e1e2e',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: 'rait-slide-up 0.2s ease',
        }}
      >
        {/* Keyframe injection (idempotent) */}
        <style>{`
          @keyframes rait-slide-up {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              Choose Language
            </span>
            <button
              onClick={onClose}
              aria-label="Close language picker"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search languages"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              padding: '7px 10px',
              outline: 'none',
            }}
          />
        </div>

        {/* Language list */}
        <ul
          role="listbox"
          aria-label="Languages"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '6px 0',
            overflowY: 'auto',
            maxHeight: 300,
          }}
        >
          {filtered.length === 0 && (
            <li
              style={{
                padding: '20px 16px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              No languages found
            </li>
          )}
          {filtered.map(lang => {
            const isActive = lang.code === currentLang;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => onSelect(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: '#fff',
                  fontSize: 14,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e =>
                  !isActive &&
                  ((e.currentTarget as HTMLLIElement).style.background =
                    'rgba(255,255,255,0.07)')
                }
                onMouseLeave={e =>
                  !isActive &&
                  ((e.currentTarget as HTMLLIElement).style.background = 'transparent')
                }
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {isActive && (
                  <span style={{ color: '#818cf8', fontSize: 12 }}>✓</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
