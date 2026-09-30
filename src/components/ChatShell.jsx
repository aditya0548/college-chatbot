import React, { useState } from 'react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import SuggestedChips from './SuggestedChips';
import '../styles/chat.css';

const INITIAL_MESSAGE = { id: 1, role: 'bot', content: 'Hello! I am ACA47. How can I help you today?' };

export default function ChatShell({ onInteract }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    if (onInteract) onInteract();

    
    const userMessage = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: messages.filter(m => m.id !== 1), // Exclude initial greeting if desired, or keep it. Let's keep all for context.
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', content: data.reply }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', content: 'Error: Could not connect to the server.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChipClick = (text) => {
    setInputValue(text);
  };

  return (
    <div className="chat-container">
      {messages.length === 1 && (
        <SuggestedChips onChipClick={handleChipClick} />
      )}
      <ChatMessages messages={messages} />
      {isTyping && (
        <div className="typing-indicator">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      )}
      <ChatInput 
        onSend={handleSend} 
        value={inputValue}
        onChange={setInputValue}
      />
    </div>
  );
}
