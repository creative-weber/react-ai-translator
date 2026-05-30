import type { ChatMessage } from '../types';
import { getLangLabel, getLangFlag } from '../languages';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const fromLabel = `${getLangFlag(message.fromLang)} ${getLangLabel(message.fromLang)}`;
  const toLabel = `${getLangFlag(message.toLang)} ${getLangLabel(message.toLang)}`;
  const time = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
            <p className="bubble-text">{message.translatedText}</p>
          )}

          {message.status === 'error' && (
            <p className="bubble-text error-text">⚠ {message.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
