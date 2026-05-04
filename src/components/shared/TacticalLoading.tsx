import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Zap, Globe, Activity, Terminal, Shield } from 'lucide-react';
import { generateStableKey } from '../../lib/keyUtils';

export const TacticalLoading: React.FC<{ onComplete: () => void, mode?: 'simplified' | 'advanced' | 'professional' | null }> = ({ onComplete, mode }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const statusMessages = [
    'INIT_KERNEL_BOOT_SEQUENCE...',
    'ESTABLISHING_SECURE_UPLINK... [OK]',
    'DECRYPTING_RRI_MODEL_V2.4... [OK]',
    'FETCHING_RSS_INTEL_STREAMS... [OK]',
    'SYNC_GEOSPATIAL_LAYERS_TUNISIA... [OK]',
    'CALIBRATING_SENSOR_GRID_ARRAY... [OK]',
    'ESTABLISHING_REALTIME_DATA_STREAM... [OK]',
    'FINALIZING_OPERATIONAL_ENVIRONMENT... [OK]',
    'SYSTEM_READY_FOR_OPERATOR_INPUT.'
  ];

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(onComplete, 1500);
      return () => clearTimeout(timeout);
    }

    const timer = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 8;
        return Math.min(100, prev + increment);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [progress, onComplete]);

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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#05070a] z-[999] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden font-mono"
    >
      {/* Background Grid & Scanline */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00f2ff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00f2ff]/5 to-transparent h-20 w-full animate-scanline pointer-events-none"></div>
      
      <div className="max-w-3xl w-full space-y-6 md:space-y-8 relative z-20">
        <div className="flex flex-col items-center space-y-4 md:space-y-6 mb-8 md:mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-intel-cyan/30 flex items-center justify-center relative"
          >
            <div className="absolute inset-0 border-2 border-intel-cyan/10 animate-ping rounded-full"></div>
            <div className="absolute inset-0 border-t-2 border-intel-cyan animate-spin rounded-full"></div>
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-intel-cyan" />
          </motion.div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-4xl tracking-[0.2em] md:tracking-[0.3em] font-bold text-white uppercase">
              TUNISIA<span className="text-intel-cyan">INTEL</span>
            </h1>
            <div className="flex items-center justify-center space-x-2 md:space-x-4">
              <div className="h-[1px] w-8 md:w-12 bg-intel-cyan/30"></div>
              <div className="text-[8px] md:text-[10px] text-intel-cyan uppercase tracking-[0.3em] md:tracking-[0.5em]">
                Sovereign Risk Intelligence Engine
              </div>
              <div className="h-[1px] w-8 md:w-12 bg-intel-cyan/30"></div>
            </div>
          </div>
        </div>

        {/* Tactical Data Grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
          {[
            { label: 'UPLINK', value: 'ENCRYPTED', color: 'text-intel-cyan' },
            { label: 'THREAT_LVL', value: 'ELEVATED', color: 'text-amber-500' },
            { label: 'NODE', value: 'TUNIS_01', color: 'text-slate-400' }
          ].map((stat, i) => (
            <div key={generateStableKey(stat, i, 'stat')} className="bg-black/40 border border-intel-border p-2 md:p-3 rounded flex flex-col items-center text-center">
              <span className="text-[6px] md:text-[8px] text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <span className={`text-[10px] md:text-xs font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Terminal Window */}
        <div className="bg-black/90 border border-intel-border rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,242,255,0.1)]">
          <div className="bg-intel-card border-b border-intel-border px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Terminal className="w-4 h-4 text-intel-cyan" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Secure Boot Sequence // Alpha-9</span>
            </div>
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-intel-cyan/50 animate-pulse"></div>
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="p-4 md:p-6 h-40 md:h-56 overflow-y-auto scrollbar-hide text-[9px] md:text-[11px] space-y-2 text-intel-cyan/70 font-mono"
          >
            {logs.map((log, i) => {
              const hasOk = log.endsWith('[OK]');
              const message = hasOk ? log.replace(' [OK]', '') : log;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={generateStableKey(null, i, 'log')} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between w-full border-b border-intel-cyan/5 pb-1 gap-1"
                >
                  <div className="flex items-start sm:items-center space-x-2 md:space-x-3">
                    <span className="text-slate-600 font-bold whitespace-nowrap">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                    <span className={`break-all ${i === logs.length - 1 ? "text-white font-bold" : ""}`}>{message}</span>
                  </div>
                  {hasOk && (
                    <span className="text-intel-cyan font-bold bg-intel-cyan/10 px-2 py-0.5 rounded text-[8px] md:text-[9px] self-start sm:self-auto">
                      SUCCESS
                    </span>
                  )}
                </motion.div>
              );
            })}
            {progress < 100 && (
              <div className="flex items-center space-x-2 md:space-x-3">
                <span className="text-slate-600 font-bold">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                <span className="w-2 h-3 md:h-4 bg-intel-cyan animate-pulse"></span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">System Initialization</span>
              <span className="text-[8px] text-intel-cyan/60 uppercase tracking-widest">Loading core modules...</span>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-white tabular-nums">{Math.min(100, Math.floor(progress))}</span>
              <span className="text-xs text-intel-cyan font-bold">%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-intel-card border border-intel-border rounded-full overflow-hidden p-[2px]">
            <motion.div 
              className="h-full bg-gradient-to-r from-intel-cyan/50 via-intel-cyan to-intel-cyan shadow-[0_0_15px_rgba(0,242,255,0.6)] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 text-[8px] md:text-[9px] text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] pt-4 md:pt-6 border-t border-intel-border/30">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 text-intel-cyan animate-pulse" />
            <span>Kernel: v4.2.0-stable</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="w-3 h-3 text-intel-cyan" />
            <span>Region: North Africa // Tunisia</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-intel-cyan" />
            <span>Latency: 14ms</span>
          </div>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 w-8 h-8 md:w-16 md:h-16 border-t-2 border-l-2 border-intel-cyan/20"></div>
      <div className="absolute top-4 right-4 md:top-8 md:right-8 w-8 h-8 md:w-16 md:h-16 border-t-2 border-r-2 border-intel-cyan/20"></div>
      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-8 h-8 md:w-16 md:h-16 border-b-2 border-l-2 border-intel-cyan/20"></div>
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-8 h-8 md:w-16 md:h-16 border-b-2 border-r-2 border-intel-cyan/20"></div>
    </motion.div>
  );
};

// Helper for cn if not available in this scope
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
