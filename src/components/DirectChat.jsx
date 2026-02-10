import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DirectChat = ({ backendConnected }) => {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'DIRECT NEURAL INTERFACE ACTIVE', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Try to hit the backend
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.content })
      });

      if (!response.ok) throw new Error('Backend error');

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || data.message || 'Neural core processing complete.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: '⚠️ NEURAL LINK SEVERED - Backend connection lost. Ensure Ollama and FastAPI are running.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/10 bg-black/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              DIRECT NEURAL INTERFACE
            </h2>
            <p className="text-xs text-white/50 font-mono mt-1">Raw LLM access • Unfiltered communication channel</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            backendConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              backendConnected ? 'bg-emerald-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-xs font-mono ${
              backendConnected ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {backendConnected ? 'LINKED' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-blue-600/20 border-blue-500/30' 
                  : msg.role === 'error'
                    ? 'bg-red-600/20 border-red-500/30'
                    : msg.role === 'system'
                      ? 'bg-emerald-600/20 border-emerald-500/30'
                      : 'bg-white/5 border-white/10'
              } border rounded-2xl p-4 backdrop-blur-xl`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    msg.role === 'user' 
                      ? 'text-blue-400' 
                      : msg.role === 'error'
                        ? 'text-red-400'
                        : msg.role === 'system'
                          ? 'text-emerald-400'
                          : 'text-cyan-400'
                  }`}>
                    {msg.role === 'user' ? '▶ OPERATOR' : msg.role === 'system' ? '⚡ SYS' : msg.role === 'error' ? '⚠ ERR' : '◀ NEURAL-CORE'}
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">{msg.timestamp}</span>
                </div>
                {/* Content */}
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words font-mono">
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-cyan-400 font-mono">NEURAL CORE PROCESSING...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-8 py-4 border-t border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="flex gap-3 items-end">
          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter neural command..."
              disabled={loading}
              rows={1}
              className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none font-mono text-sm scrollbar-hide disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-white/20 font-mono">
              {loading ? 'TRANSMITTING...' : 'ENTER TO SEND'}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl px-6 py-3 transition-all disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm font-mono">XMIT</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="text-sm font-mono">SEND</span>
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-3 text-[10px] text-white/30 font-mono flex items-center gap-4">
          <span>⌨️ SHIFT+ENTER for new line</span>
          <span>•</span>
          <span>⚡ Direct link to Ollama LLaMA 3 via FastAPI</span>
          {!backendConnected && (
            <>
              <span>•</span>
              <span className="text-red-400">⚠️ Backend offline - start services first</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DirectChat;
