import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';

// ── Inner app (needs auth context) ───────────────────────────────────────────
function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('login'); // 'login' | 'register' | 'chat' | 'admin'
  const [activeCategory, setActiveCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [chatKey, setChatKey] = useState(0);
  const [activeSession, setActiveSession] = useState(null); // { id, category_label, ... }

  // Route based on auth state
  useEffect(() => {
    if (loading) return;
    if (user) {
      setPage('chat');
    } else {
      setPage('login');
    }
  }, [user, loading]);

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    setActiveSession(null);
    setChatKey((k) => k + 1);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveSession(null);
    setChatKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  const handleSelectSession = useCallback((session) => {
    setActiveSession(session);
    setChatKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  const handleSessionCreated = useCallback((session) => {
    setActiveSession(session);
  }, []);

  // Full-page loading spinner
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0c10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#e8922f', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    if (page === 'register') return <RegisterPage onGoLogin={() => setPage('login')} />;
    return <LoginPage onGoRegister={() => setPage('register')} />;
  }

  if (page === 'admin') return <AdminPage onBack={() => setPage('chat')} />;

  return (
    <>
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onGoAdmin={() => setPage('admin')}
        activeSessionId={activeSession?.id}
        onSelectSession={handleSelectSession}
      />
      <ChatBox
        key={chatKey}
        activeCategory={activeCategory}
        onOpenSidebar={() => setSidebarOpen(true)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        activeSession={activeSession}
        onSessionCreated={handleSessionCreated}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
