/**
 * Phase3Demo.tsx
 *
 * Demonstrates the three Phase 3 UI components:
 *   - FloatingTranslatorButton  (5 states + position prop)
 *   - LanguagePicker            (searchable language modal)
 *   - TranslationProgress       (progress bar 0-100 %)
 *
 * The demo has two sections:
 *   1. Live demo — FloatingTranslatorButton wired to usePageTranslator; only
 *      the sample article div is translated so the controls stay readable.
 *   2. Component showcase — every visual state rendered statically so
 *      designers / reviewers can check them without triggering real inference.
 */

import React, { useRef, useState } from 'react';
import { usePageTranslator } from './hooks/usePageTranslator';
import { FloatingTranslatorButton } from './components/FloatingTranslatorButton';
import { LanguagePicker } from './components/LanguagePicker';
import { TranslationProgress } from './components/TranslationProgress';
import { getLangFlag } from './languages';
import type { TranslatorStatus } from './hooks/usePageTranslator';

// ---------------------------------------------------------------------------
// Sample article (scoped translation target)
// ---------------------------------------------------------------------------
function SampleArticle() {
  return (
    <article style={{ lineHeight: 1.8, color: '#1e293b' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>The Northern Lights</h2>
      <p>
        The <strong>aurora borealis</strong>, or northern lights, is one of
        nature's most breathtaking spectacles. Shimmering curtains of green,
        purple, and red light dance across the night sky in polar regions.
      </p>
      <p>
        The phenomenon occurs when charged particles from the sun collide with
        gases in Earth's atmosphere. Different gases produce different colours —{' '}
        <em>oxygen</em> creates the familiar green glow, while nitrogen produces
        blue and purple hues.
      </p>
      <h3 style={{ color: '#1e40af' }}>Best Viewing Locations</h3>
      <ul>
        <li>Tromsø, Norway — inside the auroral oval</li>
        <li>Fairbanks, Alaska — clear, dark skies</li>
        <li>Abisko, Sweden — low precipitation microclimate</li>
        <li>Reykjavik, Iceland — accessible from the city</li>
      </ul>
      <p>
        The best time to observe the aurora is during the <em>equinoxes</em> in
        March and September, when geomagnetic activity peaks and nights are long.
      </p>
      {/* Badge intentionally excluded from translation */}
      <p style={{ marginTop: 12 }}>
        Category:{' '}
        <span
          data-no-translate
          style={{
            background: '#e0f2fe',
            border: '1px solid #38bdf8',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#0369a1',
          }}
        >
          NATURAL_PHENOMENA
        </span>
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 4px',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<TranslatorStatus, string> = {
  idle: '#94a3b8',
  'loading-model': '#f59e0b',
  translating: '#3b82f6',
  done: '#22c55e',
  error: '#ef4444',
};

function StatusPill({ status, progress }: { status: TranslatorStatus; progress: number }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: color + '22',
        border: `1px solid ${color}55`,
        borderRadius: 99,
        padding: '3px 12px',
        fontSize: 13,
        fontWeight: 600,
        color,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {status}
      {status === 'loading-model' && ` — ${progress}%`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Static button showcase card — renders the button in a contained box
// by wrapping it in a position:relative container with overflow:hidden.
// ---------------------------------------------------------------------------
function ButtonCard({
  label,
  description,
  status,
  progress = 0,
  currentLanguage = null,
}: {
  label: string;
  description: string;
  status: TranslatorStatus;
  progress?: number;
  currentLanguage?: string | null;
}) {
  const isActive = status === 'loading-model' || status === 'translating';

  /* Replicate the button visuals inline — no portal, no fixed positioning */
  function ButtonVisual() {
    const bgColor =
      status === 'error' ? '#ef4444' : status === 'done' ? '#4f46e5' : '#6366f1';

    let inner: React.ReactNode;
    switch (status) {
      case 'loading-model':
        inner = (
          <>
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
            <TranslationProgress progress={progress} />
          </>
        );
        break;
      case 'translating':
        inner = (
          <span style={{ color: '#fff', fontSize: 22, animation: 'rait-pulse 1.2s ease-in-out infinite' }}>
            🌐
          </span>
        );
        break;
      case 'done':
        inner = <span style={{ fontSize: 26, lineHeight: 1 }}>{currentLanguage ? getLangFlag(currentLanguage) : '🌐'}</span>;
        break;
      case 'error':
        inner = <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>!</span>;
        break;
      default:
        inner = <span style={{ color: '#fff', fontSize: 24, lineHeight: 1 }}>🌐</span>;
    }

    return (
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: bgColor,
          boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: status === 'loading-model' ? '8px 10px' : 0,
          cursor: isActive ? 'default' : 'pointer',
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '20px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        textAlign: 'center',
        minWidth: 160,
      }}
    >
      <ButtonVisual />
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{description}</div>
      </div>
      <StatusPill status={status} progress={progress} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress bar showcase
// ---------------------------------------------------------------------------
function ProgressRow({ value }: { value: number }) {
  return (
    <div
      style={{
        background: '#6366f1',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: 240,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, width: 30, flexShrink: 0 }}>
        {value}%
      </span>
      <div style={{ flex: 1 }}>
        <TranslationProgress progress={value} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main demo
// ---------------------------------------------------------------------------
export function Phase3Demo() {
  // ── Live demo state ──────────────────────────────────────────────────────
  const articleRef = useRef<HTMLDivElement>(null);
  const { status, modelProgress, currentLanguage, translatePage, revertPage } =
    usePageTranslator();

  const handleTranslate = (code: string) => {
    translatePage(code, 'en', articleRef.current ?? undefined);
  };

  // ── Inline LanguagePicker preview ────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedLang, setPickedLang] = useState<string | null>(null);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 24px 120px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
          Phase 3 — UI Components
        </h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15 }}>
          <code>FloatingTranslatorButton</code> · <code>LanguagePicker</code> ·{' '}
          <code>TranslationProgress</code>
        </p>
      </div>

      {/* ── Section 1: Live Demo ─────────────────────────────────────────── */}
      <Section
        title="1 · Live Translation Demo"
        subtitle="Click the floating button (bottom-right) to pick a language and translate the article below. Only this article div is translated — controls stay readable."
      >
        {/* Article card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '28px 32px',
            position: 'relative',
          }}
        >
          {/* Status bar inside the card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <StatusPill status={status} progress={modelProgress} />
            {status === 'done' && (
              <button
                onClick={revertPage}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ↩ Revert
              </button>
            )}
          </div>

          {/* Scoped article */}
          <div ref={articleRef}>
            <SampleArticle />
          </div>
        </div>

        {/* The real floating button — wired to translatePage */}
        <FloatingTranslatorButton
          status={status}
          modelProgress={modelProgress}
          currentLanguage={currentLanguage}
          onTranslate={handleTranslate}
          onRevert={revertPage}
          position="bottom-right"
        />

        <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 12 }}>
          Tip: long-press or right-click the button to revert without opening the picker.
        </p>
      </Section>

      {/* ── Section 2: Button States ─────────────────────────────────────── */}
      <Section
        title="2 · FloatingTranslatorButton — All States"
        subtitle="Static snapshots showing each visual state. The buttons are non-interactive here."
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <ButtonCard
            label="Idle"
            description="Globe icon. Click to open language picker."
            status="idle"
          />
          <ButtonCard
            label="Loading model"
            description="Spinner + progress bar during model download."
            status="loading-model"
            progress={42}
          />
          <ButtonCard
            label="Translating"
            description="Pulsing globe while text is being replaced."
            status="translating"
          />
          <ButtonCard
            label="Done"
            description="Shows the flag of the active language."
            status="done"
            currentLanguage="fr"
          />
          <ButtonCard
            label="Error"
            description="Red ! badge. Click to retry."
            status="error"
          />
        </div>

        {/* Position variants note */}
        <div
          style={{
            marginTop: 20,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            fontSize: 13,
            color: '#475569',
          }}
        >
          <strong style={{ color: '#0f172a' }}>Position prop:</strong>{' '}
          <code>bottom-right</code> (default) · <code>bottom-left</code> ·{' '}
          <code>top-right</code> · <code>top-left</code>
        </div>
      </Section>

      {/* ── Section 3: LanguagePicker ────────────────────────────────────── */}
      <Section
        title="3 · LanguagePicker"
        subtitle="Searchable language modal rendered via React portal. Click the button below to open it."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setPickerOpen(true)}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🌐 Open LanguagePicker
          </button>
          {pickedLang && (
            <span style={{ fontSize: 14, color: '#475569' }}>
              Last selected:{' '}
              <strong style={{ color: '#0f172a' }}>{pickedLang}</strong>
            </span>
          )}
        </div>

        {pickerOpen && (
          <LanguagePicker
            currentLang={pickedLang}
            onSelect={code => {
              setPickedLang(code);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}

        <ul
          style={{
            marginTop: 16,
            color: '#64748b',
            fontSize: 13,
            lineHeight: 1.8,
            paddingLeft: 20,
          }}
        >
          <li>Live search filters by label or language code.</li>
          <li>Currently active language is highlighted with a checkmark.</li>
          <li>Click backdrop or press Escape to dismiss.</li>
        </ul>
      </Section>

      {/* ── Section 4: TranslationProgress ──────────────────────────────── */}
      <Section
        title="4 · TranslationProgress"
        subtitle="Slim progress bar rendered inside the button during model download. Shown here on a purple background to match the button context."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[0, 25, 50, 75, 100].map(v => (
            <ProgressRow key={v} value={v} />
          ))}
        </div>
        <p style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
          The bar transitions smoothly with <code>transition: width 0.2s ease</code> as
          the <code>modelProgress</code> value rises from 0 → 100.
        </p>
      </Section>
    </div>
  );
}
