import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Shield, 
  Cpu, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Terminal,
  AlertTriangle
} from 'lucide-react';
import { chatWithAnalyst } from '../../services/ai';
import { safeAI } from '../../lib/aiSafe';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAI } from '../../context/AIContext';

interface Message {
  id: string;
  role: 'user' | 'analyst';
  text: string;
  timestamp: number;
}

interface AIAnalystPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAnalystPanel: React.FC<AIAnalystPanelProps> = ({ isOpen, onClose }) => {
  const { rriState, fullData: data } = useRiskMetrics();
  const { canCallAI, recordCall, recordError } = useAI();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'analyst',
      text: "TunisiaIntel v2.0 Neural Link Established. I am your Strategic Analyst. How can I assist with your intelligence requirements today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingProgress, setTypingProgress] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const TYPING_SPEED = 15; // ms per character

  useEffect(() => {
    const activeTyping = messages.filter(m =>
      m.role === 'analyst' &&
      typingProgress[m.id] !== undefined &&
      typingProgress[m.id] < m.text.length
    );
    if (activeTyping.length === 0) return;
    const timer = setInterval(() => {
      setTypingProgress(prev => {
        const next = { ...prev };
        for (const msg of activeTyping) {
          const current = prev[msg.id] ?? 0;
          next[msg.id] = Math.min(current + 1, msg.text.length);
        }
        return next;
      });
    }, TYPING_SPEED);
    return () => clearInterval(timer);
  }, [messages, typingProgress]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, typingProgress]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!canCallAI(true)) {
      setMessages(prev => [...prev, {
        id: `analyst-error-${Date.now()}-${Math.random()}`,
        role: 'analyst',
        text: "Neural link restricted. Daily API quota reached or system paused. Please check AI Configuration in Data Pipeline.",
        timestamp: Date.now()
      }]);
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = {
        rri: rriState.rri,
        pRev: rriState.p_rev,
        velocity: rriState.velocity_label,
        data: data
      };

      const response = await safeAI(
        () => chatWithAnalyst([...messages, userMsg], context),
        "Neural link currently inactive. System operating in offline tactical mode."
      );
      recordCall();

      const analystId = `analyst-${Date.now()}-${Math.random()}`;
      setMessages(prev => [...prev, {
        id: analystId,
        role: 'analyst',
        text: response,
        timestamp: Date.now()
      }]);
      setTypingProgress(prev => ({ ...prev, [analystId]: 0 }));
    } catch (error) {
      console.error('AI Analyst Error:', error);
      recordError(error instanceof Error ? error.message : String(error));
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}-${Math.random()}`,
        role: 'analyst',
        text: "Neural link interrupted. Failed to process intelligence request. Please retry.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-modal"
          />

          {/* Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              role="dialog"
              aria-label="AI Strategic Analyst Panel"
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#05070a] border-l border-white/10 z-popup flex flex-col shadow-2xl"
            >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Cpu className="w-24 h-24 text-intel-cyan" />
              </div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-intel-cyan/10 border border-intel-cyan/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-intel-cyan" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest">AI Strategic Analyst</h2>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        try {
                          // 1. Load Custom Models + Env Models
                          const customModels = JSON.parse(localStorage.getItem('ti_ai_models') || '[]');
                          const envModels = JSON.parse(localStorage.getItem('ti_env_models') || '[]');
                          const allModels = [...customModels, ...envModels];
                          
                          // 2. Fetch active assignment
                          const roles = JSON.parse(localStorage.getItem('ti_ai_role_assignments') || '{}');
                          const activeId = roles['answer'];
                          
                          if (!activeId) {
                            return (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest font-bold">STANDBY</span>
                              </>
                            );
                          }

                          // 3. Find Model in either Custom or Env list
                          const active = allModels.find((m: any) => m.id === activeId);
                          if (!active) {
                            return (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                <span className="text-[8px] font-mono text-amber-400 uppercase tracking-widest font-bold">STANDBY</span>
                              </>
                            );
                          }
                          const isOnline = active.status === 'online'; 

                          return (
                            <>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-intel-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}></span>
                              <span className={`text-[8px] font-mono uppercase tracking-widest ${isOnline ? 'text-intel-green/90 font-bold' : 'text-red-500/70'}`}>
                                {isOnline ? 'Neural Link Active' : 'Neural Link Offline'}
                              </span>
                            </>
                          );
                        } catch {
                          return (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span className="text-[8px] font-mono text-red-500/70 uppercase tracking-widest">Neural Link Sync Error</span>
                            </>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  aria-label="Close AI Analyst Panel"
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-gradient-to-b from-transparent to-intel-cyan/5"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 px-1">
                      {msg.role === 'analyst' ? (
                        <>
                          <Bot className="w-3 h-3 text-intel-cyan" />
                          <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-widest">Analyst</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[8px] font-mono text-slate-500 uppercase font-bold tracking-widest">User</span>
                          <User className="w-3 h-3 text-slate-500" />
                        </>
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed font-mono ${
                      msg.role === 'user' 
                        ? 'bg-intel-cyan text-intel-bg font-bold rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                    }`}>
                      {msg.role === 'analyst' && typingProgress[msg.id] !== undefined && typingProgress[msg.id] < msg.text.length
                        ? <>{msg.text.slice(0, typingProgress[msg.id])}<span className="inline-block w-[2px] h-[1em] bg-intel-cyan ml-0.5 animate-pulse" /></>
                        : msg.text
                      }
                    </div>
                    <div className="px-1 text-[9px] font-mono text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-2">
                    <div className="flex items-center space-x-2 px-1">
                      <Bot className="w-3 h-3 text-intel-cyan" />
                      <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-widest">Analyst</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 rounded-tl-none flex items-center space-x-3">
                      <Loader2 className="w-4 h-4 animate-spin text-intel-cyan" />
                      <span className="text-[10px] font-mono animate-pulse">Processing Intelligence...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/10 bg-black/40">
              <div className="relative">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Inquire about RRI dynamics, actor networks, or fiscal outlook..."
                  aria-label="Intelligence inquiry input"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs font-mono text-on-surface placeholder:text-slate-600 focus:outline-none focus:border-intel-cyan/50 transition-all resize-none min-h-[80px]"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send inquiry"
                  className="absolute right-3 bottom-3 p-2 bg-intel-cyan text-intel-bg rounded-lg hover:bg-white transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-3 h-3 text-intel-cyan/60" />
                    <span className="text-[8px] font-mono text-intel-cyan/60 uppercase font-black tracking-tighter">
                      {(() => {
                        try {
                          const customModels = JSON.parse(localStorage.getItem('ti_ai_models') || '[]');
                          const envModels = JSON.parse(localStorage.getItem('ti_env_models') || '[]');
                          const roles = JSON.parse(localStorage.getItem('ti_ai_role_assignments') || '{}');
                          const activeId = roles['answer'];
                          const active = [...customModels, ...envModels].find((m: any) => m.id === activeId);
                          if (!active) return 'STANDBY';
                          return `${active.provider}: ${active.modelName}`;
                        } catch { return '—'; }
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3 h-3 text-slate-500" />
                    <span className="text-[8px] font-mono text-slate-600 uppercase">
                      {(() => {
                        try {
                          const customModels = JSON.parse(localStorage.getItem('ti_ai_models') || '[]');
                          const envModels = JSON.parse(localStorage.getItem('ti_env_models') || '[]');
                          const roles = JSON.parse(localStorage.getItem('ti_ai_role_assignments') || '{}');
                          const activeId = roles['answer'];
                          const active = [...customModels, ...envModels].find((m: any) => m.id === activeId);
                          if (!active) return '—';
                          return `${active.provider}:${active.modelName}`;
                        } catch { return '—'; }
                      })()}
                    </span>
                  </div>
                </div>
                <div className="text-[8px] font-mono text-slate-600 uppercase italic">
                  Grounding: Core Logic Engine
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
