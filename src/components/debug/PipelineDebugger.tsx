import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, Activity, AlertCircle, Clock, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventsStore } from '../../store/useEventsStore';
import { DEBUG_EVENTS } from '../../utils/eventUtils';

export const PipelineDebugger: React.FC = () => {
  const { events } = useEventsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    duplicates: 0,
    delayed: 0,
    lastIngest: 0
  });

  useEffect(() => {
    if (!DEBUG_EVENTS) return;

    const keys = events.map(e => e.id);
    const dups = keys.filter((k, i) => keys.indexOf(k) !== i).length;
    
    let delayedCount = 0;
    let latestIngest = 0;

    events.forEach(e => {
       if (e._debug?.ingestedAt && e._debug.ingestedAt > latestIngest) {
         latestIngest = e._debug.ingestedAt;
       }
       
       const ts = e.timestamp || (e as any).date;
       if (ts) {
         const age = Date.now() - new Date(ts).getTime();
         if (age > 300000) delayedCount++;
       }
    });

    setStats({
      total: events.length,
      duplicates: dups,
      delayed: delayedCount,
      lastIngest: latestIngest
    });
  }, [events]);

  if (!DEBUG_EVENTS) return null;

  return (
    <div className="fixed bottom-12 right-8 z-modal font-mono">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-black/90 backdrop-blur-xl border border-intel-cyan/30 rounded-xl p-4 w-64 shadow-2xl mb-2"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-intel-cyan/20">
              <div className="flex items-center space-x-2">
                <Bug className="w-4 h-4 text-intel-cyan" />
                <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">Pipeline Debug</span>
              </div>
              <span className="text-[8px] bg-intel-cyan/20 text-intel-cyan px-1 rounded animate-pulse">ACTIVE</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Database className="w-3 h-3" />
                  <span className="text-[9px]">TOTAL EVENTS</span>
                </div>
                <span className="text-[10px] text-on-surface font-bold">{stats.total}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <AlertCircle className={`w-3 h-3 ${stats.duplicates > 0 ? 'text-intel-red' : ''}`} />
                  <span className="text-[9px]">DUPLICATES</span>
                </div>
                <span className={`text-[10px] font-bold ${stats.duplicates > 0 ? 'text-intel-red' : 'text-intel-cyan'}`}>
                  {stats.duplicates}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Clock className={`w-3 h-3 ${stats.delayed > 0 ? 'text-intel-orange' : ''}`} />
                  <span className="text-[9px]">DELAYED (&gt;5M)</span>
                </div>
                <span className={`text-[10px] font-bold ${stats.delayed > 0 ? 'text-intel-orange' : 'text-intel-cyan'}`}>
                  {stats.delayed}
                </span>
              </div>

              <div className="pt-2 border-t border-intel-cyan/10">
                <div className="text-[8px] text-slate-500 uppercase mb-1">Last Ingestion</div>
                <div className="text-[9px] text-intel-cyan/60">
                  {stats.lastIngest ? new Date(stats.lastIngest).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all ${
          isOpen 
            ? 'bg-intel-cyan text-black border-intel-cyan font-bold' 
            : 'bg-black/60 text-intel-cyan border-intel-cyan/30 hover:bg-intel-cyan/10'
        }`}
      >
        <Activity className={`w-4 h-4 ${isOpen ? 'animate-spin' : ''}`} />
        <span className="text-[10px] uppercase tracking-wider">
          {isOpen ? 'Close Proxy' : 'Debug Pipeline'}
        </span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
    </div>
  );
};
