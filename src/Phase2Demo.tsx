/**
 * Phase2Demo.tsx
 *
 * Demonstrates the three Phase 2 modules:
 *   - domWalker.ts   → collectTextNodes / applyTranslations / revertTranslations
 *   - chunkText.ts   → chunkTexts / mergeChunkResults
 *   - usePageTranslator.ts → full pipeline hook
 *
 * The demo has two sections:
 *   1. A "sample article" rendered inside a scoped div — only that div is
 *      translated, not the whole page, so the controls stay readable.
 *   2. A live inspector showing the raw TextNodeEntry list and the chunks that
 *      would be sent to the worker.
 */

import React, { useRef, useState, useEffect } from 'react';
import { usePageTranslator } from './hooks/usePageTranslator';
import { collectTextNodes } from './utils/domWalker';
import { chunkTexts } from './utils/chunkText';
import { LANGUAGES } from './languages';

// ---------------------------------------------------------------------------
// Sample content — deliberately mixed: headings, paragraphs, a list, a badge
// that opts out via data-no-translate, and a <code> block that is auto-skipped.
// ---------------------------------------------------------------------------
function SampleArticle() {
  return (
    <article style={{ lineHeight: 1.7, color: '#1a1a2e' }}>
      <h1>The Art of Sourdough Baking</h1>
      <p>
        Sourdough bread has been baked for <strong>thousands of years</strong>,
        long before commercial yeast was available. The key ingredient is a{' '}
        <em>starter</em> — a live culture of wild yeast and bacteria that gives
        the loaf its distinctive tangy flavour and chewy crumb.
      </p>

      <h2>Why Wild Yeast?</h2>
      <p>
        Unlike packaged yeast, wild yeast ferments more slowly. This slow
        fermentation breaks down phytic acid in the flour, making minerals more
        bioavailable and improving digestibility.
      </p>

      <h2>The Basic Process</h2>
      <ol>
        <li>Mix flour and water; let rest for 30 minutes (autolyse).</li>
        <li>Add starter and salt; fold every 30 minutes for 3 hours.</li>
        <li>Shape the dough and place it in a banneton.</li>
        <li>Cold-proof overnight in the refrigerator.</li>
        <li>Bake in a Dutch oven at 230 °C for 45 minutes.</li>
      </ol>

      <h2>Tips for Success</h2>
      <ul>
        <li>Use bread flour with at least 12 % protein for a strong gluten network.</li>
        <li>Keep your starter at room temperature and feed it daily.</li>
        <li>Score the dough just before baking to control oven spring.</li>
      </ul>

      <p>
        The smell of a freshly baked sourdough loaf cooling on a wire rack is one
        of life's simple pleasures. With patience and practice, anyone can master
        this ancient craft.
      </p>

      {/* This badge should NOT be translated */}
      <p>
        Status:{' '}
        <span
          data-no-translate
          style={{
            background: '#e0f7fa',
            border: '1px solid #00acc1',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          ACTIVE_RECIPE
        </span>
      </p>

      {/* Code blocks are auto-skipped by domWalker */}
      <pre
        style={{
          background: '#f4f4f4',
          padding: '12px 16px',
          borderRadius: 6,
          fontSize: 13,
          overflowX: 'auto',
        }}
      >
        <code>{`// This code block is skipped by domWalker (SKIP_TAGS includes PRE & CODE)
const starter = { hydration: 100, flourType: 'whole-wheat' };`}</code>
      </pre>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const STATUS_COLORS: Record<string, string> = {
  idle: '#94a3b8',
  'loading-model': '#f59e0b',
  translating: '#3b82f6',
  done: '#22c55e',
  error: '#ef4444',
};

function StatusBadge({ status, progress }: { status: string; progress: number }) {
  const color = STATUS_COLORS[status] ?? '#94a3b8';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: color + '22',
        border: `1px solid ${color}`,
        color,
        borderRadius: 99,
        padding: '3px 12px',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {status === 'loading-model' && `Loading model… ${progress}%`}
      {status === 'translating' && 'Translating…'}
      {status === 'idle' && 'Idle'}
      {status === 'done' && 'Done ✓'}
      {status === 'error' && 'Error ✗'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Inspector panel — shows collected nodes + chunks without actually translating
// ---------------------------------------------------------------------------
function InspectorPanel({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const [nodes, setNodes] = useState<{ text: string }[]>([]);
  const [chunks, setChunks] = useState<{ items: { index: number; text: string }[] }[]>([]);
  const [chunkSize, setChunkSize] = useState(300);

  function runInspect() {
    if (!targetRef.current) return;
    const entries = collectTextNodes(targetRef.current);
    setNodes(entries.map(e => ({ text: e.originalText })));
    const chunked = chunkTexts(
      entries.map(e => e.originalText),
      chunkSize,
    );
    setChunks(chunked);
  }

  return (
    <div
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        borderRadius: 10,
        padding: '20px 24px',
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <strong style={{ color: '#7dd3fc' }}>DOM Inspector</strong>
        <label style={{ color: '#94a3b8', fontSize: 12 }}>
          maxCharsPerChunk:
          <input
            type="number"
            value={chunkSize}
            onChange={e => setChunkSize(Number(e.target.value))}
            min={50}
            step={50}
            style={{
              marginLeft: 6,
              width: 70,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          />
        </label>
        <button
          onClick={runInspect}
          style={{
            background: '#7dd3fc22',
            border: '1px solid #7dd3fc',
            color: '#7dd3fc',
            borderRadius: 6,
            padding: '4px 14px',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Inspect
        </button>
      </div>

      {nodes.length === 0 && (
        <p style={{ color: '#475569' }}>
          Click <em>Inspect</em> to run collectTextNodes() + chunkTexts() on the article above.
        </p>
      )}

      {nodes.length > 0 && (
        <>
          {/* Text nodes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#a78bfa', marginBottom: 8 }}>
              collectTextNodes() → <strong>{nodes.length}</strong> text nodes
            </div>
            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                background: '#1e293b',
                borderRadius: 6,
                padding: '8px 12px',
              }}
            >
              {nodes.map((n, i) => (
                <div key={i} style={{ borderBottom: '1px solid #1e293b', padding: '3px 0' }}>
                  <span style={{ color: '#475569' }}>[{i}]</span>{' '}
                  <span style={{ color: '#fde68a' }}>"{n.text.trim()}"</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chunks */}
          <div>
            <div style={{ color: '#a78bfa', marginBottom: 8 }}>
              chunkTexts(maxChars={chunkSize}) → <strong>{chunks.length}</strong> chunk
              {chunks.length !== 1 ? 's' : ''}
            </div>
            {chunks.map((chunk, ci) => {
              const totalChars = chunk.items.reduce((s, it) => s + it.text.length, 0);
              return (
                <div
                  key={ci}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ color: '#38bdf8', marginBottom: 6, fontSize: 12 }}>
                    Chunk {ci + 1} — {chunk.items.length} item{chunk.items.length !== 1 ? 's' : ''},{' '}
                    {totalChars} chars
                  </div>
                  {chunk.items.map(item => (
                    <div key={item.index} style={{ padding: '2px 0' }}>
                      <span style={{ color: '#475569' }}>[{item.index}]</span>{' '}
                      <span style={{ color: '#fde68a' }}>"{item.text.trim()}"</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main demo component
// ---------------------------------------------------------------------------
export function Phase2Demo() {
  const articleRef = useRef<HTMLDivElement>(null);
  const [selectedLang, setSelectedLang] = useState('fr');
  const { status, modelProgress, currentLanguage, error, translatePage, revertPage, dispose } =
    usePageTranslator();

  // Clean up worker on unmount
  useEffect(() => () => dispose(), [dispose]);

  async function handleTranslate() {
    if (!articleRef.current) return;
    await translatePage(selectedLang, 'en', articleRef.current);
  }

  function handleRevert() {
    revertPage();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '40px 24px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>🌐</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a' }}>
              Phase 2 — DOM Translation Engine
            </h1>
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: 15 }}>
            Demonstrates <code>domWalker.ts</code>, <code>chunkText.ts</code>, and{' '}
            <code>usePageTranslator.ts</code> working together to translate in-place DOM content
            without disturbing HTML structure.
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <label style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
            Translate article to:
          </label>

          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            disabled={status === 'loading-model' || status === 'translating'}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              background: '#f8fafc',
              cursor: 'pointer',
            }}
          >
            {LANGUAGES.filter(l => l.code !== 'en').map(l => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleTranslate}
            disabled={status === 'loading-model' || status === 'translating'}
            style={{
              background: status === 'loading-model' || status === 'translating' ? '#e2e8f0' : '#3b82f6',
              color: status === 'loading-model' || status === 'translating' ? '#94a3b8' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor:
                status === 'loading-model' || status === 'translating' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {status === 'loading-model'
              ? `Loading model… ${modelProgress}%`
              : status === 'translating'
              ? 'Translating…'
              : 'Translate'}
          </button>

          {currentLanguage && (
            <button
              onClick={handleRevert}
              style={{
                background: '#fff',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Revert to English
            </button>
          )}

          <StatusBadge status={status} progress={modelProgress} />

          {currentLanguage && (
            <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 500 }}>
              Currently: {LANGUAGES.find(l => l.code === currentLanguage)?.flag}{' '}
              {LANGUAGES.find(l => l.code === currentLanguage)?.label}
            </span>
          )}

          {error && (
            <span style={{ color: '#ef4444', fontSize: 13 }}>Error: {error}</span>
          )}
        </div>

        {/* Callout: what to observe */}
        <div
          style={{
            background: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 13,
            color: '#713f12',
          }}
        >
          <strong>Things to observe:</strong>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: 18 }}>
            <li>
              The <code>ACTIVE_RECIPE</code> badge (marked <code>data-no-translate</code>) is{' '}
              <strong>never translated</strong>.
            </li>
            <li>
              The <code>&lt;pre&gt;/&lt;code&gt;</code> block is <strong>automatically skipped</strong> by
              the domWalker.
            </li>
            <li>
              HTML structure (bold, italics, list items) is <strong>preserved</strong> — only Text
              nodes are patched.
            </li>
            <li>
              "Revert to English" restores every node to its exact <code>originalText</code>.
            </li>
          </ul>
        </div>

        {/* Article (the translation target) */}
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '32px 40px',
            marginBottom: 28,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div ref={articleRef}>
            <SampleArticle />
          </div>
        </div>

        {/* Inspector */}
        <InspectorPanel targetRef={articleRef} />

        {/* Module legend */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            marginTop: 24,
          }}
        >
          {[
            {
              module: 'domWalker.ts',
              color: '#a78bfa',
              desc: 'Walks the DOM with TreeWalker, skips SCRIPT/STYLE/PRE/CODE and data-no-translate elements, returns TextNodeEntry[] for in-place patching.',
            },
            {
              module: 'chunkText.ts',
              color: '#38bdf8',
              desc: 'Groups text strings into batches under a character limit so the NMT model stays fast and accurate on long pages.',
            },
            {
              module: 'usePageTranslator.ts',
              color: '#34d399',
              desc: 'Orchestrates the pipeline: collect → chunk → worker → patch. Tracks status, modelProgress, currentLanguage, and provides revertPage().',
            },
          ].map(item => (
            <div
              key={item.module}
              style={{
                background: '#fff',
                border: `1px solid ${item.color}44`,
                borderTop: `3px solid ${item.color}`,
                borderRadius: 8,
                padding: '14px 16px',
              }}
            >
              <code style={{ color: item.color, fontWeight: 700, fontSize: 13 }}>{item.module}</code>
              <p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: 12.5, lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
