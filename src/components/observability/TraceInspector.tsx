import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, XCircle, Clock, Database, Activity, Target } from 'lucide-react';
import { useObservability } from '../../context/ObservabilityContext';
import { motion, AnimatePresence } from 'motion/react';

export const TraceInspector: React.FC = () => {
  const { logs } = useObservability();
  const [searchId, setSearchId] = useState('');
  const [activeTrace, setActiveTrace] = useState<any[] | null>(null);

  const handleInspect = () => {
    if (!searchId.trim()) return;
    const traceLogs = logs.filter(l => l.traceId === searchId || (l.payload?.id === searchId));
    setActiveTrace(traceLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  };

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'WARN': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 flex flex-col h-full font-sans">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
          <Target className="w-4 h-4 text-intel-cyan" />
          Intelligence Item Trace Inspector
        </h3>
        <div className="flex gap-2">
           <input 
              type="text" 
              placeholder="Enter Fingerprint / Trace ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
              className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white/80 focus:outline-none focus:border-intel-cyan/50 w-[240px]"
           />
           <button 
              onClick={handleInspect}
              className="px-3 py-1.5 bg-intel-cyan text-black rounded-lg text-xs font-bold hover:bg-white transition-colors"
           >
             INSPECT
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {!activeTrace ? (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="h-full flex flex-col items-center justify-center text-white/20 text-center space-y-4"
            >
              <Search className="w-12 h-12 opacity-10" />
              <p className="text-sm italic">Enter a Trace ID to see full lifecycle analysis</p>
              <div className="text-[10px] uppercase tracking-tighter opacity-40">
                Tip: Copy a trace ID from the live logs
              </div>
            </motion.div>
          ) : activeTrace.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="h-full flex flex-col items-center justify-center text-red-500/40 text-center space-y-2"
            >
              <XCircle className="w-8 h-8 opacity-20" />
              <p className="text-sm">Trace ID not found in current session buffer</p>
            </motion.div>
          ) : (
            <motion.div 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
               className="space-y-4 relative pl-8"
            >
              {/* Stepper Line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/5" />

              {activeTrace.map((step, i) => (
                <div key={i} className="relative">
                  {/* Status Circle */}
                  <div className="absolute -left-8 top-1.5 z-10 bg-[#0a0a0a] p-0.5 rounded-full ring-2 ring-[#0a0a0a]">
                    {getStatusIcon(step.level)}
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 ml-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-intel-cyan bg-intel-cyan/10 px-2 py-0.5 rounded">
                          {step.stage}
                        </span>
                        <span className="text-[10px] font-mono text-white/30">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold ${step.level === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {step.level}
                      </span>
                    </div>
                    
                    <p className="text-sm text-white/90 mb-2">{step.message}</p>
                    
                    {step.payload && (
                      <div className="mt-3 p-3 bg-black/50 rounded-lg border border-white/5 font-mono text-[10px] text-white/40 overflow-x-auto">
                        <pre>{JSON.stringify(step.payload, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Completion Marker */}
              <div className="flex items-center gap-3 ml-2 text-white/20 pt-4">
                <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center">
                  <Loader2 className="w-3 h-3 animate-pulse" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest italic">Monitoring continuous updates...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
