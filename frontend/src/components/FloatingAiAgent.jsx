import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOpportunities } from '../context/useOpportunities';
import { sendAgentQuery, checkBackendHealth } from '../services/api';

export function FloatingAiAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your **DarkIntent Sales Intelligence Copilot**. Connected to your real discussion database and powered by Groq LLM. Select an opportunity or ask me anything about your pipeline, root causes, or outreach.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState('');
  const [llmStatus, setLlmStatus] = useState({ provider: 'Groq', configured: false, model: null });
  const [activeDraft, setActiveDraft] = useState(null);

  const { opportunities, showToast } = useOpportunities();
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Sync selected opportunity with URL route if on detail page
  useEffect(() => {
    const match = location.pathname.match(/\/opportunity\/([^\/]+)/);
    if (match && match[1]) {
      setSelectedOppId(match[1]);
    } else if (!selectedOppId && opportunities && opportunities.length > 0) {
      setSelectedOppId(opportunities[0].id);
    }
  }, [location.pathname, opportunities]);

  // Check backend health & LLM status
  useEffect(() => {
    checkBackendHealth().then((health) => {
      if (health.isOnline && health.data?.llm) {
        setLlmStatus(health.data.llm);
      }
    });
  }, []);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const currentOpp = opportunities.find((o) => o.id === selectedOppId);

  const handleSendMessage = async (textToSend, action = null, outreachType = 'initial') => {
    const userMsg = textToSend || inputText.trim();
    if (!userMsg && !action) return;

    const newMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg || `Action: Draft ${outreachType} outreach`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendAgentQuery({
        message: userMsg,
        opportunityId: selectedOppId || undefined,
        action,
        outreachType,
        conversationHistory: history
      });

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response || res.error || 'No response returned.',
        provider: res.provider || (res.mode === 'groq_live_inference' ? 'Groq' : 'DarkIntent Intelligence'),
        model: res.model || (llmStatus.configured ? 'llama-3.3-70b-versatile' : null),
        isLlm: res.mode === 'groq_live_inference' || res.provider === 'Groq',
        outreachDraft: res.outreachDraft,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      if (res.outreachDraft) {
        setActiveDraft(res.outreachDraft);
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Connection error: ${err.message}. Please check that the DarkIntent backend is active.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, label = 'Draft') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, 'success');
  };

  const quickPrompts = [
    { label: '🔥 Top Deals', prompt: 'Which live opportunities in our database should we investigate first?' },
    { label: '📊 Score Why', prompt: 'Why did this opportunity receive this intent score? Explain the factors.' },
    { label: '🔍 Root Cause', prompt: 'Summarize the core technical bottleneck and detected technologies.' },
    { label: '✉️ Draft Outreach', prompt: 'Draft a personalized consultative cold email based on this technical discussion.', action: 'draft_outreach', outreachType: 'initial' },
    { label: '📅 Pre-Meeting Brief', prompt: 'Prepare an executive intelligence brief and discovery agenda for my upcoming call with this team.' }
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="floating-agent-trigger"
          aria-label="Open DarkIntent Sales Copilot"
          title="Open AI Sales Copilot"
        >
          <div className="trigger-icon-pulse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span className="trigger-label">AI Copilot</span>
          <span className={`trigger-status-dot ${llmStatus.configured ? 'online' : 'context'}`} />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="floating-agent-window">
          {/* Header */}
          <div className="agent-header">
            <div className="agent-header-left">
              <div className="agent-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                  <rect x="4" y="8" width="16" height="12" rx="2" />
                  <path d="M9 13v2M15 13v2" />
                </svg>
              </div>
              <div>
                <div className="agent-title-row">
                  <h3 className="agent-title">Sales Intelligence Copilot</h3>
                  <span className={`agent-chip ${llmStatus.configured ? 'chip-groq' : 'chip-context'}`}>
                    {llmStatus.configured ? '⚡ Groq LLM' : 'DB Context'}
                  </span>
                </div>
                <p className="agent-subtitle">Real-time technical signal analysis & outreach</p>
              </div>
            </div>

            <div className="agent-header-actions">
              <button
                onClick={() => setIsOpen(false)}
                className="agent-icon-btn"
                aria-label="Close copilot"
                title="Minimize Copilot"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Context Selector */}
          <div className="agent-context-bar">
            <label className="context-label" htmlFor="copilot-opp-select">Target Signal:</label>
            <select
              id="copilot-opp-select"
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="context-select"
            >
              <option value="">All Database Signals (Global Context)</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  #{opp.id} — {opp.company || 'Unknown'}: {opp.title.slice(0, 42)}... ({opp.score}/100)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Prompts */}
          <div className="agent-quick-prompts">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.prompt, qp.action, qp.outreachType)}
                disabled={isLoading}
                className="quick-prompt-btn"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="agent-messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`agent-message-row ${msg.role === 'user' ? 'msg-user' : 'msg-assistant'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="msg-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                )}

                <div className="msg-bubble-wrapper">
                  <div className="msg-bubble">
                    <div className="msg-content">
                      {msg.content.split('\n\n').map((para, pIdx) => {
                        if (para.startsWith('```') && para.endsWith('```')) {
                          const code = para.slice(3, -3).replace(/^text\n/, '');
                          return (
                            <pre key={pIdx} className="msg-code-block">
                              <code>{code}</code>
                            </pre>
                          );
                        }
                        return (
                          <p key={pIdx} className="msg-para">
                            {para}
                          </p>
                        );
                      })}
                    </div>

                    {/* Outreach Draft Card if attached */}
                    {msg.outreachDraft && (
                      <div className="agent-draft-card">
                        <div className="draft-card-header">
                          <span className="draft-badge">GENERATED OUTREACH DRAFT</span>
                          <button
                            onClick={() => copyToClipboard(`Subject: ${msg.outreachDraft.subject}\n\n${msg.outreachDraft.body}`)}
                            className="draft-copy-btn"
                            title="Copy to clipboard"
                          >
                            Copy Draft
                          </button>
                        </div>
                        <div className="draft-field">
                          <strong>Subject:</strong> {msg.outreachDraft.subject}
                        </div>
                        <div className="draft-body-preview">
                          {msg.outreachDraft.body}
                        </div>
                        {selectedOppId && (
                          <button
                            onClick={() => {
                              navigate(`/outreach/${selectedOppId}`);
                              setIsOpen(false);
                            }}
                            className="draft-open-btn"
                          >
                            Open in Outreach Hub →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="msg-meta">
                    <span>{msg.timestamp}</span>
                    {msg.provider && (
                      <span className="msg-provider-tag">
                        • {msg.provider} {msg.model ? `(${msg.model})` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="agent-message-row msg-assistant">
                <div className="msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="msg-bubble-wrapper">
                  <div className="msg-bubble loading-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">Analyzing technical signals with Groq...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="agent-input-form"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about this issue, score, root cause, or draft outreach..."
              disabled={isLoading}
              className="agent-input-field"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="agent-send-btn"
              aria-label="Send prompt"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
