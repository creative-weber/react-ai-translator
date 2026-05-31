import { useState } from 'react'
import App from './App.tsx'
import { Phase2Demo } from './Phase2Demo.tsx'
import { Phase3Demo } from './Phase3Demo.tsx'
import { Phase4Demo } from './Phase4Demo.tsx'

type Tab = 'phase4' | 'phase3' | 'demo' | 'chat';

const TAB_LABELS: Record<Tab, string> = {
  phase4: '🧩 Phase 4 Demo',
  phase3: '🎨 Phase 3 Demo',
  demo:   '🌐 Phase 2 Demo',
  chat:   '💬 AI Chat',
};

export function Root() {
  const [tab, setTab] = useState<Tab>('phase4')
  return (
    <>
      <nav style={{
        display: 'flex',
        gap: 0,
        background: '#0f172a',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        {(['phase4', 'phase3', 'demo', 'chat'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #38bdf8' : '2px solid transparent',
              color: tab === t ? '#38bdf8' : '#94a3b8',
              padding: '12px 20px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>
      {tab === 'phase4' ? <Phase4Demo /> :
       tab === 'phase3' ? <Phase3Demo /> :
       tab === 'demo'   ? <Phase2Demo /> :
                          <App />}
    </>
  )
}
