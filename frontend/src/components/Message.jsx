import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Icons } from './Icons';
import './Message.css';

const Message = ({ text, sender, isLatest }) => {
  const isBot = sender === 'bot';
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

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
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleCopy = async () => {
    try {
      const cleanText = text.replace(/[*#_`]/g, '');
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCallAgent = () => {
    alert("Initiating call to local language AI Agent...");
  };

  return (
    <div className={`msg ${isBot ? 'msg--bot' : 'msg--user'} ${isLatest ? 'msg--latest' : ''}`}>
      <div className="msg__avatar-col">
        <div className={`msg__avatar ${isBot ? 'msg__avatar--bot' : 'msg__avatar--user'}`}>
          {isBot ? (
            <Icons.bot style={{ width: 18, height: 18 }} />
          ) : (
            <Icons.user style={{ width: 18, height: 18 }} />
          )}
        </div>
      </div>

      <div className="msg__body">
        <div className="msg__meta">
          <span className="msg__sender">{isBot ? 'Nyaay Saathi' : 'You'}</span>
        </div>

        <div className={`msg__bubble ${isBot ? 'msg__bubble--bot' : 'msg__bubble--user'}`}>
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>

        {isBot && (
          <div className="msg__actions">
            <button
              className={`msg__action-btn ${isPlaying ? 'msg__action-btn--active' : ''}`}
              onClick={toggleSpeech}
              title={isPlaying ? 'Stop reading' : 'Read aloud'}
              aria-label={isPlaying ? 'Stop reading' : 'Read aloud'}
            >
              {isPlaying ? (
                <Icons.stop style={{ width: 13, height: 13 }} />
              ) : (
                <Icons.speaker style={{ width: 13, height: 13 }} />
              )}
              <span>{isPlaying ? 'Stop' : 'Read aloud'}</span>
            </button>

            <button
              className={`msg__action-btn ${copied ? 'msg__action-btn--active' : ''}`}
              onClick={handleCopy}
              title="Copy response"
              aria-label="Copy response"
            >
              {copied ? (
                <Icons.check style={{ width: 13, height: 13 }} />
              ) : (
                <Icons.copy style={{ width: 13, height: 13 }} />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              className="msg__action-btn"
              onClick={handleCallAgent}
              title="Call AI Agent in local language"
              aria-label="Call AI Agent in local language"
            >
              <Icons.phone style={{ width: 13, height: 13 }} />
              <span>Call AI Agent</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
