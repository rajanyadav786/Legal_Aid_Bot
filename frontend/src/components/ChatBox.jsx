import React, { useState, useRef, useEffect, useCallback } from 'react';
import Message from './Message';
import { Icons } from './Icons';
import { useAuth } from '../context/AuthContext';
import './ChatBox.css';

const DEFAULT_QUICK_PROMPTS = [
  'What are my fundamental rights as an Indian citizen?',
  'How do I file an RTI application?',
  'What is the process to get a legal aid lawyer for free?',
];

const ChatBox = ({
  activeCategory,
  onCategoryChange,
  onOpenSidebar,
  selectedModel,
  setSelectedModel,
  activeSession,
  onSessionCreated,
}) => {
  const { authFetch, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(activeSession?.id || null);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognition = useRef(null);

  useEffect(() => {
    if (!activeCategory || activeCategory.id === 'general') {
      setLoadingCats(true);
      authFetch('/api/categories')
        .then(r => r.json())
        .then(data => setCategories(data))
        .catch(() => {})
        .finally(() => setLoadingCats(false));
    }
  }, [activeCategory, authFetch]);

  // Load messages from an existing session
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      setSessionId(null);
      return;
    }
    setSessionId(activeSession.id);
    authFetch(`/api/history/sessions/${activeSession.id}/messages`)
      .then((r) => r.ok ? r.json() : [])
      .then((msgs) => {
        setMessages(msgs.map((m) => ({ text: m.content, sender: m.role === 'user' ? 'user' : 'bot' })));
      })
      .catch(() => {});
  }, [activeSession]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + transcript);
      };
      recognition.current.onend = () => setIsListening(false);
      recognition.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else if (recognition.current) {
      try { recognition.current.start(); setIsListening(true); }
      catch (e) { console.error(e); }
    } else {
      alert('Your browser does not support voice input.');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // Create a new session for the current category (called on first message)
  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    if (!user) return null;
    try {
      const res = await authFetch('/api/history/sessions', {
        method: 'POST',
        body: JSON.stringify({
          category_id: activeCategory?.id || 'general',
          category_label: activeCategory?.label || 'General Legal Aid',
        }),
      });
      if (!res.ok) return null;
      const session = await res.json();
      setSessionId(session.id);
      onSessionCreated?.(session);
      return session.id;
    } catch (_) { return null; }
  }, [sessionId, user, activeCategory, authFetch, onSessionCreated]);

  // Save a message to history
  const saveMessage = useCallback(async (sid, role, content) => {
    if (!sid || !user) return;
    authFetch(`/api/history/sessions/${sid}/messages`, {
      method: 'POST',
      body: JSON.stringify({ role, content }),
    }).catch(() => {});
  }, [user, authFetch]);

  const handleSend = async (customMessage) => {
    const messageText = (customMessage || input).trim();
    if (!messageText || isLoading) return;

    setMessages((prev) => [...prev, { text: messageText, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    // Ensure session exists then save user message
    const sid = await ensureSession();
    await saveMessage(sid, 'user', messageText);

    let enrichedMessage = messageText;
    if (activeCategory?.systemContext) {
      enrichedMessage = `[Context: ${activeCategory.systemContext}]\n\nUser query: ${messageText}`;
    }

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enrichedMessage,
          model: selectedModel,
          systemContext: activeCategory?.systemContext || '',
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data.response, sender: 'bot' }]);
      await saveMessage(sid, 'assistant', data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { text: '**Connection Error**: Unable to reach the legal aid server. Please ensure the backend is running and try again.', sender: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const showWelcome = messages.length === 0;
  const CategoryIcon = activeCategory?.icon ? Icons[activeCategory.icon] : Icons.scales;
  const quickPrompts = activeCategory?.quickPrompts?.length ? activeCategory.quickPrompts : DEFAULT_QUICK_PROMPTS;

  return (
    <div className="chat">
      {/* Top bar */}
      <header className="chat__header">
        <div className="chat__header-left">
          <button className="chat__menu-btn" onClick={onOpenSidebar} aria-label="Open categories">
            <Icons.menu style={{ width: 20, height: 20 }} />
          </button>
          <div className="chat__header-context">
            <div className="chat__header-icon" style={{ '--cat-color': activeCategory?.color || 'var(--accent-saffron)' }}>
              {CategoryIcon && <CategoryIcon style={{ width: 16, height: 16 }} />}
            </div>
            <div className="chat__header-info">
              <h2 className="chat__header-title">{activeCategory?.label || 'General Legal Aid'}</h2>
              <span className="chat__header-desc">{activeCategory?.description || 'Ask any legal question'}</span>
            </div>
          </div>
        </div>
        <div className="chat__header-right">
          <div className="chat__model-select">
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              aria-label="Select AI model"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
              <option value="gemma">Gemma 7B</option>
              <option value="minimax">Minimax</option>
              <option value="qwen">Qwen 2 72B</option>
            </select>
            <Icons.chevronDown style={{ width: 14, height: 14 }} className="chat__select-arrow" />
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="chat__messages" role="log" aria-label="Chat messages">
        {showWelcome ? (
          <div className="welcome">
            <div className="welcome__hero">
              <div className="welcome__icon-ring">
                <div className="welcome__icon">
                  <Icons.scales style={{ width: 36, height: 36 }} />
                </div>
              </div>
              <h2 className="welcome__title">Namaste! How can I help you today?</h2>
              <p className="welcome__subtitle">
                I'm your AI legal aid companion, here to simplify Indian law and help you understand your rights. Select a category or ask anything.
              </p>
            </div>

            {(!activeCategory || activeCategory.id === 'general') ? (
              <div className="welcome__dashboard-grid">
                {loadingCats ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
                ) : (
                  categories.map((cat, i) => {
                    const CardIcon = Icons[cat.icon] || Icons.scales;
                    return (
                      <button
                        key={cat.id}
                        className="welcome__dashboard-card"
                        onClick={() => onCategoryChange(cat)}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        <div className="welcome__dashboard-icon" style={{ color: cat.color }}>
                          <CardIcon style={{ width: 22, height: 22 }} />
                        </div>
                        <div className="welcome__dashboard-title">{cat.label}</div>
                        <div className="welcome__dashboard-desc">{cat.description}</div>
                        <div className="welcome__dashboard-arrow" style={{ color: cat.color }}>
                          <Icons.send style={{ width: 16, height: 16 }} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="welcome__prompts">
                <p className="welcome__prompts-label">
                  <Icons.sparkle style={{ width: 14, height: 14 }} />
                  Quick questions about {activeCategory.shortLabel || activeCategory.label}
                </p>
                <div className="welcome__prompt-grid">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      className="welcome__prompt-card"
                      onClick={() => handleSend(prompt)}
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <span className="welcome__prompt-text">{prompt}</span>
                      <Icons.send style={{ width: 14, height: 14, opacity: 0.4, flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <Message
                key={index}
                text={msg.text}
                sender={msg.sender}
                isLatest={index === messages.length - 1}
              />
            ))}
            {isListening && (
              <div className="chat__listening">
                <div className="chat__wave"><span /><span /><span /><span /><span /></div>
                <span className="chat__listening-text">Listening...</span>
              </div>
            )}
            {isLoading && (
              <div className="chat__loading">
                <div className="chat__loading-avatar">
                  <Icons.bot style={{ width: 16, height: 16 }} />
                </div>
                <div className="chat__loading-content">
                  <span className="chat__loading-label">Nyaay Saathi</span>
                  <div className="chat__loading-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Agent Button */}
      {!showWelcome && (
        <button 
          className="chat__floating-agent"
          onClick={() => alert("Connecting to Local Language AI Assistant...")}
        >
          <Icons.phone style={{ width: 18, height: 18 }} />
          <span>Call Assistance</span>
        </button>
      )}

      {/* Input area */}
      <footer className="chat__input-area">
        <div className="chat__input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeCategory && activeCategory.id !== 'general'
                ? `Ask about ${activeCategory.shortLabel || activeCategory.label}...`
                : 'Describe your legal issue...'
            }
            rows="1"
            aria-label="Type your message"
            id="chat-input"
          />
          <div className="chat__input-actions">
            <button
              className={`chat__mic-btn ${isListening ? 'chat__mic-btn--active' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Voice input'}
              aria-label={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <Icons.micOff style={{ width: 18, height: 18 }} /> : <Icons.mic style={{ width: 18, height: 18 }} />}
            </button>
            <button
              className="chat__send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              title="Send message"
              aria-label="Send message"
              id="send-button"
            >
              <Icons.send style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
        <p className="chat__footer-note">
          Nyaay Saathi provides information, not formal legal counsel. Always consult a qualified lawyer.
        </p>
      </footer>
    </div>
  );
};

export default ChatBox;
