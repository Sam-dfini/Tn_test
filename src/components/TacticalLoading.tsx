import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Zap, Globe, Activity, Terminal } from 'lucide-react';

export const TacticalLoading: React.FC<{ onComplete: () => void, mode?: 'simplified' | 'advanced' | 'professional' | null }> = ({ onComplete, mode }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const statusMessages = [
    'Initializing kernel...',
    'Connecting pipeline... [OK]',
    'Loading RRI model... [OK]',
    'Fetching RSS data... [OK]',
    'Synchronizing geospatial layers... [OK]',
    'Calibrating sensor grid... [OK]',
    'Establishing data stream... [OK]',
    'Finalizing system environment... [OK]',
    'System ready.'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + Math.random() * 12;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const messageIndex = Math.floor((progress / 100) * statusMessages.length);
    const currentMessages = statusMessages.slice(0, messageIndex + 1);
    setLogs(currentMessages);
  }, [progress]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 bg-[#05070a] z-[100] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-mono">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-2xl w-full space-y-8 relative z-20">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-xl bg-intel-cyan/5 border border-intel-cyan/20 flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-intel-cyan/10 animate-pulse rounded-xl"></div>
            <Eye className="w-8 h-8 text-intel-cyan" />
          </motion.div>
          
          <div className="text-center">
            <h1 className="text-2xl tracking-[0.2em] font-bold text-white uppercase">
              TUNISIA<span className="text-intel-cyan">INTEL</span>
            </h1>
            <div className="text-[8px] text-slate-500 uppercase tracking-[0.4em] mt-1">
              Tactical Risk Intelligence v2.0
            </div>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="bg-black/80 border border-intel-border rounded-lg overflow-hidden shadow-2xl">
          <div className="bg-intel-card border-b border-intel-border px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-3 h-3 text-intel-cyan" />
              <span className="text-[9px] text-slate-400 uppercase tracking-widest">System Boot Sequence</span>
            </div>
            <div className="flex space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan/40"></div>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="p-4 h-48 overflow-y-auto scrollbar-hide text-[10px] space-y-1 text-intel-cyan/80"
          >
            {logs.map((log, i) => {
              const hasOk = log.endsWith('[OK]');
              const message = hasOk ? log.replace(' [OK]', '') : log;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-600">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                    <span className={i === logs.length - 1 ? "text-white" : ""}>{message}</span>
                  </div>
                  {hasOk && <span className="text-intel-cyan font-bold">[OK]</span>}
                </motion.div>
              );
            })}
            {progress < 100 && (
              <div className="flex items-center space-x-2">
                <span className="text-slate-600">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                <span className="w-2 h-3 bg-intel-cyan animate-pulse"></span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Initialization Progress</span>
            <span className="text-lg font-bold text-white">{Math.min(100, Math.floor(progress))}%</span>
          </div>
          <div className="h-1 w-full bg-intel-card border border-intel-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-[8px] text-slate-600 uppercase tracking-widest pt-4">
          <span>Node: Tunis-01</span>
          <span>Status: Online</span>
          <span>Load: {Math.floor(progress * 0.8)}%</span>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-intel-cyan/20"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-intel-cyan/20"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-intel-cyan/20"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-intel-cyan/20"></div>
    </div>
  );
};

// Helper for cn if not available in this scope
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
