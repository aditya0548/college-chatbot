import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  
  return (
    <div className={`message-wrapper ${isUser ? 'user-wrapper' : 'bot-wrapper'}`}>
      {!isUser && (
        <div className="bot-avatar">
          A
        </div>
      )}
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {isUser ? (
          <p className="message-content">{content}</p>
        ) : (
          <div className="message-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        <div className="message-timestamp">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
