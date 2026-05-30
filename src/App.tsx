import React, { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import './App.css';
import { LanguageSelector } from './components/LanguageSelector';
import { MessageBubble } from './components/MessageBubble';
import type { ChatMessage, WorkerResponse } from './types';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('fr');
  const [protectedTerms, setProtectedTerms] = useState<string[]>([]);
  const [termInput, setTermInput] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Boot the translation Web Worker once
  useEffect(() => {
    console.log('[App] Booting translation worker…');
    workerRef.current = new Worker(
      new URL('./worker/translation.worker.ts', import.meta.url),
      { type: 'module' }
    );
    console.log('[App] Worker instance created:', workerRef.current);

    workerRef.current.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      console.log(`[App] ← worker message [${data.id}] status=${data.status}`, data);

      setMessages(prev =>
        prev.map(m => {
          if (m.id !== data.id) return m;

          switch (data.status) {
            case 'loading':
              console.log(`[App]   loading model: ${'model' in data ? data.model : ''}`);
              return { ...m, status: 'loading', progress: undefined };
            case 'progress': {
              const pct = data.total > 0 ? Math.round((data.loaded / data.total) * 100) : 0;
              console.log(`[App]   download progress: ${pct}% (${data.loaded}/${data.total} bytes)`);
              return { ...m, status: 'loading', progress: pct };
            }
            case 'done':
              console.log(`[App]   translation done → "${'result' in data ? data.result : ''}"`);
              return { ...m, status: 'done', translatedText: data.result, progress: undefined };
            case 'error':
              console.error(`[App]   translation error → ${'error' in data ? data.error : ''}`);
              return { ...m, status: 'error', error: data.error, progress: undefined };
            default:
              console.warn('[App]   unknown status:', data);
              return m;
          }
        })
      );
    });

    workerRef.current.addEventListener('error', (err) => {
      console.error('[App] Unhandled worker error:', err.message, err);
    });

    workerRef.current.addEventListener('messageerror', (err) => {
      console.error('[App] Worker message deserialization error:', err);
    });

    return () => {
      console.log('[App] Terminating worker.');
      workerRef.current?.terminate();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSwapLanguages = useCallback(() => {
    setFromLang(toLang);
    setToLang(fromLang);
  }, [fromLang, toLang]);

  const handleSubmit = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const id = crypto.randomUUID();
    const newMessage: ChatMessage = {
      id,
      originalText: text,
      fromLang,
      toLang,
      status: 'loading',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    textareaRef.current?.focus();

    const payload = { id, text, from: fromLang, to: toLang, protectedTerms };
    console.log('[App] → postMessage to worker:', payload);
    workerRef.current?.postMessage(payload);
  }, [inputText, fromLang, toLang, protectedTerms]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearChat = () => setMessages([]);

  const handleAddTerm = () => {
    const term = termInput.trim();
    if (term && !protectedTerms.includes(term)) {
      setProtectedTerms(prev => [...prev, term]);
    }
    setTermInput('');
  };

  const handleRemoveTerm = (term: string) => {
    setProtectedTerms(prev => prev.filter(t => t !== term));
  };

  const handleTermKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddTerm(); }
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-title">
          <span className="header-icon">🌐</span>
          <div>
            <h1>AI Translator</h1>
            <p>OPUS-MT · Runs entirely in your browser · No data leaves your device</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="clear-btn" onClick={handleClearChat} title="Clear chat">
            Clear
          </button>
        )}
      </header>

      {/* ── Protected terms panel ── */}
      <div className="terms-bar">
        <button
          className="terms-toggle"
          onClick={() => setShowTerms(v => !v)}
          aria-expanded={showTerms}
        >
          <span>🔒 Protected terms</span>
          {protectedTerms.length > 0 && (
            <span className="terms-count">{protectedTerms.length}</span>
          )}
          <span className="terms-chevron">{showTerms ? '▲' : '▼'}</span>
        </button>

        {showTerms && (
          <div className="terms-body">
            <p className="terms-hint">
              Words or phrases added here are passed through untranslated (e.g. company names, product names).
            </p>
            <div className="terms-input-row">
              <input
                type="text"
                className="terms-input"
                placeholder="e.g. Sunbelt Inc"
                value={termInput}
                onChange={e => setTermInput(e.target.value)}
                onKeyDown={handleTermKeyDown}
                aria-label="Add protected term"
              />
              <button
                className="terms-add-btn"
                onClick={handleAddTerm}
                disabled={!termInput.trim()}
              >
                Add
              </button>
            </div>
            {protectedTerms.length > 0 && (
              <ul className="terms-list">
                {protectedTerms.map(term => (
                  <li key={term} className="terms-chip">
                    <span>{term}</span>
                    <button
                      className="terms-remove"
                      onClick={() => handleRemoveTerm(term)}
                      aria-label={`Remove ${term}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Language bar ── */}
      <div className="lang-bar">
        <LanguageSelector
          label="Translate from"
          value={fromLang}
          onChange={setFromLang}
          disabledCode={toLang}
        />
        <button className="swap-btn" onClick={handleSwapLanguages} title="Swap languages">
          ⇄
        </button>
        <LanguageSelector
          label="Translate to"
          value={toLang}
          onChange={setToLang}
          disabledCode={fromLang}
        />
      </div>

      {/* ── Chat window ── */}
      <main className="chat-window">
        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <p>Type something below and hit <strong>Translate</strong>.</p>
            <p className="empty-hint">
              The first translation downloads the AI model (~80 MB).<br />
              Subsequent translations are instant.
            </p>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </main>

      {/* ── Input area ── */}
      <footer className="input-area">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type text to translate… (Enter to submit, Shift+Enter for new line)"
          rows={3}
          aria-label="Text to translate"
        />
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!inputText.trim()}
          aria-label="Translate"
        >
          Translate
          <span className="btn-icon">→</span>
        </button>
      </footer>
    </div>
  );
}

export default App;

