/**
 * Phase4Demo.tsx
 *
 * Demonstrates Phase 4 — Context & Provider:
 *   - AITranslatorProvider  (wraps children; injects FloatingTranslatorButton)
 *   - useAITranslator()     (programmatic access to translate / revert / status)
 *
 * The demo has three sections:
 *   1. Provider + auto-injected button — the recommended zero-config usage.
 *   2. Programmatic control — buttons that call translatePage / revertPage via
 *      useAITranslator() from a deep child component.
 *   3. Context value inspector — shows live state values from the context.
 */

import React, { useRef } from 'react';
import { AITranslatorProvider, useAITranslator } from './context/TranslatorContext';
import type { TranslatorStatus } from './hooks/usePageTranslator';

// ---------------------------------------------------------------------------
// Shared helpers
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
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>{subtitle}</p>
      )}
      {children}
    </section>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '28px 32px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sample article
// ---------------------------------------------------------------------------

function SampleArticle() {
  return (
    <article style={{ lineHeight: 1.8, color: '#1e293b' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>The Deep Ocean</h2>
      <p>
        More than <strong>80 percent</strong> of the ocean remains unexplored. Below
        1,000 metres lies the midnight zone — a world of perpetual darkness where
        pressure reaches hundreds of atmospheres.
      </p>
      <p>
        Bioluminescent creatures like the <em>anglerfish</em> and <em>firefly squid</em>{' '}
        produce their own light to hunt, communicate, and evade predators in the
        absolute dark.
      </p>
      <h3 style={{ color: '#1e40af' }}>Record Depths</h3>
      <ul>
        <li>Challenger Deep — 10,935 m (Mariana Trench)</li>
        <li>Horizon Deep — 10,823 m (Tonga Trench)</li>
        <li>Sirena Deep — 10,732 m (Mariana Trench)</li>
      </ul>
      <p>
        Scientists estimate that <em>two million</em> undiscovered species may inhabit
        the deep sea — more than in any other biome on Earth.
      </p>
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
          MARINE_SCIENCE
        </span>
      </p>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Programmatic control (deep child, uses useAITranslator)
// ---------------------------------------------------------------------------

const QUICK_LANGS = [
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
];

function ProgrammaticControls({ articleRef }: { articleRef: React.RefObject<HTMLDivElement | null> }) {
  const { translatePage, revertPage, status } = useAITranslator();
  const busy = status === 'loading-model' || status === 'translating';

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {QUICK_LANGS.map(({ code, label, flag }) => (
        <button
          key={code}
          disabled={busy}
          onClick={() => translatePage(code, 'en', articleRef.current ?? undefined)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: busy ? '#f1f5f9' : '#6366f1',
            color: busy ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            cursor: busy ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {flag} {label}
        </button>
      ))}
      <button
        disabled={status === 'idle' || busy}
        onClick={revertPage}
        style={{
          padding: '8px 16px',
          background: status === 'done' ? '#f8fafc' : '#f1f5f9',
          color: status === 'done' ? '#334155' : '#94a3b8',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          cursor: status === 'done' ? 'pointer' : 'not-allowed',
        }}
      >
        ↩ Revert
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — Context value inspector (live)
// ---------------------------------------------------------------------------

function ContextInspector() {
  const { status, modelProgress, currentLanguage, error } = useAITranslator();

  const rows: Array<{ key: string; value: React.ReactNode }> = [
    { key: 'status', value: <StatusPill status={status} progress={modelProgress} /> },
    { key: 'modelProgress', value: `${modelProgress}%` },
    {
      key: 'currentLanguage',
      value: currentLanguage ? (
        <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
          {currentLanguage}
        </code>
      ) : (
        <span style={{ color: '#94a3b8' }}>null</span>
      ),
    },
    {
      key: 'error',
      value: error ? (
        <span style={{ color: '#ef4444' }}>{error}</span>
      ) : (
        <span style={{ color: '#94a3b8' }}>null</span>
      ),
    },
  ];

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: 12,
        padding: '20px 24px',
        fontFamily: '"Fira Code", "Cascadia Code", monospace',
        fontSize: 13,
      }}
    >
      <div style={{ color: '#38bdf8', marginBottom: 12, fontWeight: 600 }}>
        {'// useAITranslator() — live context value'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {rows.map(({ key, value }) => (
            <tr key={key}>
              <td
                style={{
                  color: '#7dd3fc',
                  paddingRight: 24,
                  paddingBottom: 8,
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap',
                }}
              >
                {key}:
              </td>
              <td style={{ color: '#e2e8f0', paddingBottom: 8 }}>{value}</td>
            </tr>
          ))}
          <tr>
            <td style={{ color: '#7dd3fc', paddingRight: 24 }}>translatePage:</td>
            <td style={{ color: '#86efac' }}>ƒ (toLang, fromLang?, root?)</td>
          </tr>
          <tr>
            <td style={{ color: '#7dd3fc', paddingRight: 24 }}>revertPage:</td>
            <td style={{ color: '#86efac' }}>ƒ ()</td>
          </tr>
          <tr>
            <td style={{ color: '#7dd3fc' }}>dispose:</td>
            <td style={{ color: '#86efac' }}>ƒ ()</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider usage explainer
// ---------------------------------------------------------------------------

function CodeBlock({ code }: { code: string }) {
  return (
    <pre
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        borderRadius: 10,
        padding: '16px 20px',
        fontSize: 13,
        lineHeight: 1.7,
        overflowX: 'auto',
        margin: 0,
        fontFamily: '"Fira Code", "Cascadia Code", monospace',
      }}
    >
      <code>{code}</code>
    </pre>
  );
}

const PROVIDER_SNIPPET = `// main.tsx
import { AITranslatorProvider } from 'react-ai-translator';

<AITranslatorProvider position="bottom-right" fromLang="en">
  <App />
</AITranslatorProvider>`;

const HOOK_SNIPPET = `// AnyChild.tsx — anywhere inside the provider
import { useAITranslator } from 'react-ai-translator';

const { translatePage, revertPage, status, currentLanguage } = useAITranslator();

// Translate the whole page
translatePage('fr');

// Translate a specific DOM node only
translatePage('ja', 'en', ref.current);

// Revert to original
revertPage();`;

// ---------------------------------------------------------------------------
// Root demo — the entire page is wrapped in AITranslatorProvider
// ---------------------------------------------------------------------------

function DemoContent() {
  const articleRef = useRef<HTMLDivElement>(null);
  const { status, modelProgress } = useAITranslator();

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
          Phase 4 — Context &amp; Provider
        </h1>
        <p style={{ margin: 0, color: '#475569', fontSize: 15 }}>
          <code>AITranslatorProvider</code> · <code>useAITranslator()</code>
        </p>
      </div>

      {/* ── Section 1: Provider usage ──────────────────────────────────── */}
      <Section
        title="1 · Provider Setup"
        subtitle="Wrap your app once. The floating button is injected automatically."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <CodeBlock code={PROVIDER_SNIPPET} />
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
            The floating button in the <strong>bottom-right corner of this page</strong> is
            rendered by the <code>AITranslatorProvider</code> wrapping this entire demo — no
            extra component placement needed.
          </p>
        </div>
      </Section>

      {/* ── Section 2: Live programmatic control ──────────────────────── */}
      <Section
        title="2 · Programmatic Control via useAITranslator()"
        subtitle="These buttons live deep inside the provider tree. They call translatePage() and revertPage() directly — no props needed."
      >
        <Card>
          {/* Status bar */}
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
          </div>

          {/* Controls */}
          <div style={{ marginBottom: 24 }}>
            <ProgrammaticControls articleRef={articleRef} />
          </div>

          {/* Scoped article */}
          <div ref={articleRef}>
            <SampleArticle />
          </div>
        </Card>

        <div style={{ marginTop: 16 }}>
          <CodeBlock code={HOOK_SNIPPET} />
        </div>
      </Section>

      {/* ── Section 3: Context inspector ───────────────────────────────── */}
      <Section
        title="3 · Live Context Value"
        subtitle="Real-time state from useAITranslator(). Interact with the floating button or the controls above to see it update."
      >
        <ContextInspector />
      </Section>

      {/* ── Section 4: Props reference ─────────────────────────────────── */}
      <Section
        title="4 · AITranslatorProvider Props"
        subtitle="All props are optional."
      >
        <Card>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Prop', 'Type', 'Default', 'Description'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '0 16px 10px 0',
                      color: '#64748b',
                      fontWeight: 600,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['position', '"bottom-right" | "bottom-left" | "top-right" | "top-left"', '"bottom-right"', 'Where the floating button appears'],
                ['showFloatingButton', 'boolean', 'true', 'Set false to suppress auto-injected button'],
                ['fromLang', 'string', '"en"', 'Source language for all translatePage() calls'],
                ['children', 'ReactNode', '—', 'Your app'],
              ].map(([prop, type, def, desc]) => (
                <tr key={prop} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px 10px 0' }}>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                      {prop}
                    </code>
                  </td>
                  <td style={{ padding: '10px 16px 10px 0', color: '#7c3aed', fontFamily: 'monospace', fontSize: 12 }}>
                    {type}
                  </td>
                  <td style={{ padding: '10px 16px 10px 0', color: '#0369a1', fontFamily: 'monospace', fontSize: 12 }}>
                    {def}
                  </td>
                  <td style={{ padding: '10px 0', color: '#475569' }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported demo — wraps DemoContent in the provider
// ---------------------------------------------------------------------------

export function Phase4Demo() {
  return (
    <AITranslatorProvider position="bottom-right" fromLang="en">
      <DemoContent />
    </AITranslatorProvider>
  );
}
