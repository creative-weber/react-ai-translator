import type { ChatMessage } from '../types';
import { getLangLabel, getLangFlag } from '../languages';
import { useSpeaker } from '../hooks/useSpeaker';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const fromLabel = `${getLangFlag(message.fromLang)} ${getLangLabel(message.fromLang)}`;
  const toLabel = `${getLangFlag(message.toLang)} ${getLangLabel(message.toLang)}`;
  const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const { state: speakerState, isSupported: speakerSupported, toggle: toggleSpeaker } = useSpeaker();

  return (
    <div className="message-pair">
      {/* Original text — user bubble (right) */}
      <div className="message-row user-row">
        <div className="message user-bubble">
          <div className="bubble-meta">
            <span className="lang-tag">{fromLabel}</span>
            <span className="bubble-time">{time}</span>
          </div>
          <p className="bubble-text">{message.originalText}</p>
        </div>
      </div>

      {/* Translated text — bot bubble (left) */}
      <div className="message-row bot-row">
        <div className="bot-icon" aria-hidden>🤖</div>
        <div className="message bot-bubble">
          <div className="bubble-meta">
            <span className="lang-tag">{toLabel}</span>
          </div>

          {(message.status === 'pending' || message.status === 'loading') && (
            <div className="loading-state">
              {message.progress !== undefined ? (
                <>
                  <span className="loading-label">Downloading model… {message.progress}%</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${message.progress}%` }} />
                  </div>
                </>
              ) : (
                <span className="typing-dots">
                  <span /><span /><span />
                </span>
              )}
            </div>
          )}

          {message.status === 'done' && (
            <div className="bubble-done">
              <p className="bubble-text">{message.translatedText}</p>
              {speakerSupported && message.translatedText && (
                <button
                  className={`speaker-btn${speakerState === 'speaking' ? ' speaker-btn--active' : ''}`}
                  onClick={() => toggleSpeaker(message.translatedText!, message.toLang)}
                  aria-label={speakerState === 'speaking' ? 'Stop speaking' : 'Read translation aloud'}
                  title={speakerState === 'speaking' ? 'Stop' : 'Read aloud'}
                  type="button"
                >
                  {speakerState === 'speaking' ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}

          {message.status === 'error' && (
            <p className="bubble-text error-text">⚠ {message.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
