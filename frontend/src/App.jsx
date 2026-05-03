import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import LEGAL_CATEGORIES from './data/legalCategories';

function App() {
  const [activeCategory, setActiveCategory] = useState(LEGAL_CATEGORIES[0]); // General
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [chatKey, setChatKey] = useState(0); // Used to reset chat on new conversation

  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
    setChatKey((k) => k + 1); // Reset messages
  }, []);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  return (
    <>
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatBox
        key={chatKey}
        activeCategory={activeCategory}
        onOpenSidebar={() => setSidebarOpen(true)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </>
  );
}

export default App;
