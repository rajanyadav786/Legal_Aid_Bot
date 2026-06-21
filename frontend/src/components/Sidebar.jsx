import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import ChatHistory from './ChatHistory';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const API_BASE = 'http://localhost:8000';

const Sidebar = ({
  activeCategory,
  onCategoryChange,
  onNewChat,
  isOpen,
  onClose,
  onGoAdmin,
  onGoDashboard,
  onGoForum,
  activeSessionId,
  onSelectSession,
}) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} role="navigation" aria-label="Legal issue categories">
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <Icons.scales style={{ width: 22, height: 22 }} />
            </div>
            <div className="sidebar__brand-text">
              <h1 className="sidebar__title">Nyaay Saathi</h1>
              <span className="sidebar__subtitle">न्याय साथी</span>
            </div>
          </div>
          <button className="sidebar__close-btn" onClick={onClose} aria-label="Close sidebar">
            <Icons.close style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* User info */}
        <div style={{
          padding: '0.5rem 1rem 0.65rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8922f, #c97a1a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {user?.name}
              </div>
              {isAdmin && (
                <div style={{
                  fontSize: '0.62rem', color: '#e8922f', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                  Admin
                </div>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '0.25rem 0.55rem',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            title="Sign out"
          >
            Sign out
          </button>
        </div>

        {/* Quick Links */}
        <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button className="sidebar__new-chat" onClick={onNewChat}>
            <Icons.newChat style={{ width: 18, height: 18 }} />
            <span>New Conversation</span>
          </button>
          <button className="sidebar__new-chat" onClick={onGoDashboard} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icons.receipt style={{ width: 18, height: 18 }} />
            <span>My Dashboard</span>
          </button>
          <button className="sidebar__new-chat" onClick={onGoForum} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icons.globe style={{ width: 18, height: 18 }} />
            <span>Community Forum</span>
          </button>
        </div>

        {/* Chat History */}
        <div style={{ padding: '0 0.5rem', marginBottom: '0.25rem' }}>
          <ChatHistory
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onDeleteSession={onNewChat}
          />
        </div>

        {/* Footer */}
        <div className="sidebar__footer">
          {isAdmin && (
            <button
              onClick={onGoAdmin}
              style={{
                width: '100%', marginBottom: '0.6rem',
                padding: '0.5rem', border: '1px solid rgba(232,146,47,0.25)',
                borderRadius: 8, background: 'rgba(232,146,47,0.08)',
                color: '#e8922f', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}
            >
              Admin Panel
            </button>
          )}
          <div className="sidebar__disclaimer">
            <Icons.shield style={{ width: 14, height: 14, opacity: 0.5 }} />
            <span>AI assistant. Not formal legal counsel.</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
