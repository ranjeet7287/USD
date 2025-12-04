import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

const ChatInterface = ({ bookName }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `I've finished analyzing **${bookName}**. I'm ready to answer your questions!`,
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.response },
            ]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container glass-panel">
            <div className="chat-header">
                <div className="book-info">
                    <Book size={20} className="text-accent" />
                    <span>{bookName}</span>
                </div>
            </div>

            <div className="messages-area">
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`message-wrapper ${msg.role}`}
                    >
                        <div className="avatar">
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className="message-content">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="message-wrapper assistant">
                        <div className="avatar">
                            <Bot size={20} />
                        </div>
                        <div className="message-content loading">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about the book..."
                    className="input-field"
                    disabled={isLoading}
                />
                <button type="submit" className="btn" disabled={isLoading || !input.trim()}>
                    <Send size={20} />
                </button>
            </form>

            <style>{`
        .chat-container {
          width: 100%;
          max-width: 900px;
          height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(15, 23, 42, 0.5);
        }

        .book-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .text-accent {
          color: var(--accent-color);
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .message-wrapper {
          display: flex;
          gap: 1rem;
          max-width: 80%;
        }

        .message-wrapper.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .assistant .avatar {
          background: var(--accent-color);
          color: white;
        }

        .user .avatar {
          background: var(--card-bg);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .message-content {
          background: var(--card-bg);
          padding: 1rem 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .user .message-content {
          background: var(--accent-color);
          color: white;
          border: none;
        }
        
        .message-content p:first-child { margin-top: 0; }
        .message-content p:last-child { margin-bottom: 0; }

        .input-area {
          padding: 1.5rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          gap: 1rem;
        }

        .loading {
          display: flex;
          gap: 4px;
          padding: 1.25rem;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--text-secondary);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
        </div>
    );
};

export default ChatInterface;
