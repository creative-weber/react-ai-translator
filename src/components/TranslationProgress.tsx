/**
 * TranslationProgress.tsx
 *
 * A small inline progress bar shown during model download.
 * All styles are inline so nothing leaks into the consumer's stylesheet.
 */

import React from 'react';

export interface TranslationProgressProps {
  /** 0–100 */
  progress: number;
}

export function TranslationProgress({ progress }: TranslationProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Loading model: ${clamped}%`}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {/* Track */}
      <div
        style={{
          width: '100%',
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            borderRadius: 2,
            background: '#fff',
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>
        {clamped}%
      </span>
    </div>
  );
}
