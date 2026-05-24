import React, { useRef, useEffect } from 'react';

interface Citation {
  title?: string;
  source?: string;
  text?: string;
}

interface Message {
  role: string;
  content?: string;
  query_text?: string;
  response?: {
    key_finding?: string;
    narrative?: string;
    confidence?: number;
    confidence_rationale?: string;
    citations?: Citation[];
    follow_up_actions?: string[];
  };
  narrative?: string;
  key_finding?: string;
  confidence?: number;
  confidence_rationale?: string;
  citations?: Citation[];
  follow_up_actions?: string[];
  blocks_rendered?: any[];
  timestamp?: string;
  isError?: boolean;
}

interface Props {
  messages: Message[];
  isProcessing: boolean;
  streamedNarrative: string;
  onQuery: (query: string) => void;
  onFollowUp: (action: string) => void;
}

const MessageBubble: React.FC<{ message: Message; onFollowUp: (action: string) => void }> = ({ message, onFollowUp }) => {
  if (message.role === 'user') {
    return (
      <div className="message-bubble user">
        <span className="query-label">QUERY</span>
        <span>{message.query_text || message.content}</span>
      </div>
    );
  }

  const response = message.response || message;
  const citations = response.citations || message.citations || [];
  const followUps = response.follow_up_actions || message.follow_up_actions || [];

  if (message.isError) {
    return (
      <div className="message-bubble assistant error">
        <p className="narrative-text" style={{ color: '#EF4444' }}>{message.content || message.narrative}</p>
      </div>
    );
  }

  const conf = response.confidence ?? message.confidence ?? 0;
  const confLevel = conf > 0.65 ? 'high' : conf > 0.40 ? 'medium' : 'low';

  return (
    <div className="message-bubble assistant">
      {response.key_finding && (
        <div className="key-finding">{response.key_finding}</div>
      )}
      <p className="narrative-text">{response.narrative || message.narrative}</p>

      {conf > 0 && (
        <div className="confidence-row">
          <span className="confidence-label">CONFIDENCE</span>
          <div className="confidence-bar">
            <div className="confidence-bar-track">
              <div className={`confidence-bar-fill ${confLevel}`} style={{ width: `${conf * 100}%` }} />
            </div>
            <span className="confidence-bar-value" style={{ color: confLevel === 'high' ? '#10b981' : confLevel === 'medium' ? '#f59e0b' : '#ef4444' }}>
              {(conf * 100).toFixed(0)}%
            </span>
          </div>
          {response.confidence_rationale && (
            <span className="confidence-rationale">{response.confidence_rationale}</span>
          )}
        </div>
      )}

      {citations.length > 0 && (
        <div className="citations-section">
          <div className="citations-label">CITATIONS</div>
          {citations.map((c: Citation, i: number) => (
            <div key={i} className="citation-item">
              <span className="citation-source">{c.source || c.title}</span>
              {' — '}{c.text?.slice(0, 100)}
            </div>
          ))}
        </div>
      )}

      {followUps.length > 0 && (
        <div className="follow-up-actions">
          {followUps.map((action, i) => (
            <button key={i} className="follow-up-btn" onClick={() => onFollowUp(action)}>
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ConversationPanel: React.FC<Props> = ({
  messages, isProcessing, streamedNarrative, onQuery, onFollowUp,
}) => {
  const threadRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = React.useState('');

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, streamedNarrative]);

  const handleSubmit = () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText('');
    onQuery(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="conversation-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="conversation-panel-header">
        <div className="conversation-panel-header-left">
          <div className="dot" />
          <span>CONVERSATION THREAD</span>
        </div>
        {messages.length > 0 && (
          <span style={{ fontSize: 8, color: '#4B5563' }}>{messages.length} exchanges</span>
        )}
      </div>

      <div className="message-thread" ref={threadRef}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onFollowUp={onFollowUp} />
        ))}
        {isProcessing && streamedNarrative && (
          <div className="message-bubble assistant streaming">
            <span className="narrative-text">{streamedNarrative}</span>
            <span className="cursor-blink">▊</span>
          </div>
        )}
        {isProcessing && !streamedNarrative && (
          <div className="processing-indicator">
            <span>ROUTING</span>
            <span>RETRIEVING</span>
            <span>SYNTHESIZING</span>
          </div>
        )}
      </div>

      <div className="query-input-container">
        <textarea
          className="query-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your intelligence query..."
          disabled={isProcessing}
          rows={1}
        />
        <button
          className="query-submit-btn"
          onClick={handleSubmit}
          disabled={isProcessing || !inputText.trim()}
        >
          SEND
        </button>
      </div>
    </div>
  );
};