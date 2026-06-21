import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChatHistory.css';

export default function ChatHistory({ activeSessionId, onSelectSession, onDeleteSession }) {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/history/sessions');
      if (res.ok) setSessions(await res.json());
    } catch (_) {}
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  // Re-expose reload for parent to call
  ChatHistory.reload = load;

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    const res = await authFetch(`/api/history/sessions/${sessionId}`, { method: 'DELETE' });
    if (res.ok) {
      setSessions((s) => s.filter((x) => x.id !== sessionId));
      if (sessionId === activeSessionId) onDeleteSession?.();
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="chat-history">
      <div className="chat-history__header" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}>
        <span className="chat-history__title">Recent Conversations</span>
        <span className={`chat-history__chevron ${open ? 'chat-history__chevron--open' : ''}`}>▼</span>
      </div>

      {open && (
        <div className="chat-history__list">
          {loading && <p className="chat-history__loading">Loading…</p>}
          {!loading && sessions.length === 0 && (
            <p className="chat-history__empty">No past conversations yet</p>
          )}
          {sessions.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <button
                className={`chat-history__item ${s.id === activeSessionId ? 'chat-history__item--active' : ''}`}
                onClick={() => onSelectSession(s)}
                style={{ flex: 1 }}
              >
                <div className="chat-history__item-left">
                  <div className="chat-history__dot" style={{ background: '#e8922f' }} />
                  <div className="chat-history__item-text">
                    <span className="chat-history__item-label">{s.category_label}</span>
                    <span className="chat-history__item-meta">
                      {s.message_count} msg · {formatDate(s.updated_at)}
                    </span>
                  </div>
                </div>
              </button>
              <button
                className="chat-history__delete-btn"
                onClick={(e) => handleDelete(e, s.id)}
                title="Delete conversation"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
