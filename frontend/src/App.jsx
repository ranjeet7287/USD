import React, { useState } from 'react';
import { Upload, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadSection from './components/UploadSection';
import ChatInterface from './components/ChatInterface';
import './index.css';

function App() {
  const [isProcessed, setIsProcessed] = useState(false);
  const [bookName, setBookName] = useState('');

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <div className="logo">
          <BookOpen className="icon" size={32} color="#60a5fa" />
          <h1>AI Book Agent</h1>
        </div>
        <p className="subtitle">Your personal expert for any book. Upload, ask, and learn.</p>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {!isProcessed ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="upload-wrapper"
            >
              <UploadSection onUploadComplete={(name) => {
                setBookName(name);
                setIsProcessed(true);
              }} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="chat-wrapper"
            >
              <ChatInterface bookName={bookName} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <div className="background-gradient"></div>
    </div>
  );
}

export default App;
