import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import ModelSelector from './ModelSelector';
import './ChatBox.css';

const ChatBox = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I am your legal aid assistant. How can I help you today? Please note that I provide information, not formal legal advice.", sender: "bot" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  
  const recognition = useRef(null);

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

      recognition.current.onend = () => {
        setIsListening(false);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
      setIsListening(false);
    } else {
      if (recognition.current) {
        try {
          recognition.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Your browser does not support voice input.");
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          model: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.response, sender: "bot" }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { text: "**Error**: Unable to connect to the legal aid backend. Please try again later.", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <div className="header-info">
          <h2>Justice Companion</h2>
          <p>Accessible legal knowledge for everyone</p>
        </div>
        <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
      </div>
      
      <div className="chatbox-messages">
        {messages.map((msg, index) => (
          <Message key={index} text={msg.text} sender={msg.sender} />
        ))}
        
        {isListening && (
          <div className="listening-indicator">
            <span className="listening-text">Listening...</span>
            <div className="sound-wave">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <span className="processing-text">Processing...</span>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbox-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Describe your legal issue..."
          rows="1"
        />
        <div className="input-actions">
          <button 
            className={`mic-button ${isListening ? 'listening' : ''}`} 
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="send-button" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
