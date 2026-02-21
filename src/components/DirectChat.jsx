import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Copy Button ──────────────────────────────────────────────────────────────
const CopyButton = ({ text, size = 'sm' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all font-mono
        ${copied
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          : 'bg-white/5 border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 hover:border-white/20'
        } ${size === 'xs' ? 'text-[9px]' : 'text-[10px]'}`}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          COPIED
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          COPY
        </>
      )}
    </button>
  );
};

// ── Language Detector ────────────────────────────────────────────────────────
const detectLang = (code) => {
  if (/^\s*(def |import |from .+ import|class .+:|print\(|if __name__)/.test(code)) return 'python';
  if (/^\s*(const |let |var |function |=>|import .+ from|require\()/.test(code)) return 'javascript';
  if (/^\s*(import React|export default|useState|useEffect)/.test(code)) return 'jsx';
  if (/^\s*(<\?php|\$[a-zA-Z])/.test(code)) return 'php';
  if (/^\s*(public class|private |protected |System\.out)/.test(code)) return 'java';
  if (/^\s*(#include|int main|std::|cout|cin)/.test(code)) return 'c++';
  if (/^\s*(fn |let mut|use std|println!|impl )/.test(code)) return 'rust';
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)/i.test(code)) return 'sql';
  if (/^\s*(FROM |RUN |CMD |EXPOSE |WORKDIR )/.test(code)) return 'dockerfile';
  if (/^\s*([a-zA-Z-]+:\s|^\s*-\s)/.test(code) && code.includes('\n')) return 'yaml';
  if (/^\s*(\{|\[)/.test(code.trim())) return 'json';
  if (/^\s*(echo |apt|npm |pip |brew |cd |ls |mkdir |chmod )/.test(code)) return 'bash';
  if (/^\s*([a-zA-Z-]+\s*\{|@media|:root|\.[\w-]+\s*\{)/.test(code)) return 'css';
  return null;
};

// ── Code Block ───────────────────────────────────────────────────────────────
const CodeBlock = ({ code, lang }) => {
  const resolvedLang = lang || detectLang(code);
  const lines = code.split('\n');

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/10 bg-black/60">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">
          {resolvedLang || 'CODE'}
        </span>
        <CopyButton text={code} size="xs" />
      </div>
      <div className="flex overflow-x-auto">
        {/* Line numbers */}
        <div className="select-none px-3 py-3 text-xs font-mono text-white/20 text-right leading-relaxed border-r border-white/5 bg-white/[0.02] min-w-[2.5rem]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Code */}
        <pre className="px-4 py-3 text-xs font-mono text-emerald-300/90 leading-relaxed flex-1">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// ── Message Content Parser ───────────────────────────────────────────────────
const parseContent = (content) => {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || '', value: match[2].trimEnd() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return parts;
};

// ── Rendered Message Body ────────────────────────────────────────────────────
const MessageBody = ({ content }) => {
  const parts = parseContent(content);
  return (
    <div>
      {parts.map((part, i) =>
        part.type === 'code' ? (
          <CodeBlock key={i} code={part.value} lang={part.lang} />
        ) : (
          <p key={i} className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap break-words font-mono">
            {part.value}
          </p>
        )
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
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

  const roleLabel = (role) => {
    switch (role) {
      case 'user':   return '▶ OPERATOR';
      case 'system': return '⚡ SYS';
      case 'error':  return '⚠ ERR';
      default:       return '◀ NEURAL-CORE';
    }
  };

  const roleBubbleClass = (role) => {
    switch (role) {
      case 'user':   return 'bg-blue-600/20 border-blue-500/30';
      case 'error':  return 'bg-red-600/20 border-red-500/30';
      case 'system': return 'bg-emerald-600/20 border-emerald-500/30';
      default:       return 'bg-white/5 border-white/10';
    }
  };

  const roleLabelClass = (role) => {
    switch (role) {
      case 'user':   return 'text-blue-400';
      case 'error':  return 'text-red-400';
      case 'system': return 'text-emerald-400';
      default:       return 'text-cyan-400';
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
              <div className={`max-w-[80%] ${roleBubbleClass(msg.role)} border rounded-2xl p-4 backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-2 gap-3">
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${roleLabelClass(msg.role)}`}>
                    {roleLabel(msg.role)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30 font-mono">{msg.timestamp}</span>
                    {msg.role !== 'system' && <CopyButton text={msg.content} size="xs" />}
                  </div>
                </div>
                <MessageBody content={msg.content} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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