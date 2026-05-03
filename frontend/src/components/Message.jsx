import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Message.css';

const Message = ({ text, sender }) => {
  const isBot = sender === 'bot';
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // Stop any currently playing speech
      
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className={`message-wrapper ${isBot ? 'bot-wrapper' : 'user-wrapper'}`}>
      {isBot && (
        <div className="avatar bot-avatar">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 19.93C7.05 19.43 4 16.05 4 12C4 7.95 7.05 4.57 11 4.07V19.93ZM13 4.07C16.95 4.57 20 7.95 20 12C20 16.05 16.95 19.43 13 19.93V4.07Z" fill="currentColor"/>
          </svg>
        </div>
      )}
      
      <div className="message-content">
        <div className={`message-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
        
        {isBot && (
          <div className="message-actions">
            <button 
              className={`tts-button ${isPlaying ? 'playing' : ''}`} 
              onClick={toggleSpeech}
              title={isPlaying ? "Stop speaking" : "Read aloud"}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="7" width="10" height="10" fill="currentColor"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="currentColor"/>
                </svg>
              )}
              <span>{isPlaying ? "Stop listening" : "Read aloud"}</span>
            </button>
          </div>
        )}
      </div>

      {!isBot && (
        <div className="avatar user-avatar">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20.2C9.5 20.2 7.29 18.92 6 16.98C6.03 14.99 10 13.9 12 13.9C13.99 13.9 17.97 14.99 18 16.98C16.71 18.92 14.5 20.2 12 20.2Z" fill="currentColor"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default Message;
