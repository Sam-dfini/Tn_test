import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Radio, AlertCircle } from 'lucide-react';
import { useEventsStore } from '../../store/useEventsStore';
import { DEBUG_EVENTS } from '../../utils/eventUtils';

interface BreakingIntelFeedProps {
  externalAlerts?: any[];
}

export const BreakingIntelFeed: React.FC<BreakingIntelFeedProps> = ({ externalAlerts = [] }) => {
  const { events, ingestData } = useEventsStore();

  useEffect(() => {
    if (externalAlerts.length > 0) {
      ingestData(externalAlerts, 'WS');
    }
  }, [externalAlerts, ingestData]);

  // HARD UI DEFENSE: Duplicate Detection
  useEffect(() => {
    if (DEBUG_EVENTS && events.length > 0) {
      const seen = new Set();
      events.forEach(e => {
        if (!e.id) {
          console.error("[UI ERROR] Event missing ID in store", e);
          return;
        }
        if (seen.has(e.id)) {
          console.error("[UI DUPLICATE DETECTED] Collision in store snapshot", e.id);
        }
        seen.add(e.id);
      });
    }
  }, [events]);

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-intel-cyan/20 pb-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Radio className="w-3 h-3 text-intel-red" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-intel-red rounded-full"
            />
          </div>
          <h3 className="text-[10px] font-mono text-intel-cyan uppercase font-bold tracking-widest">Breaking Intel Feed</h3>
        </div>
        <div className="flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
          <span className="w-1 h-1 rounded-full bg-intel-red animate-pulse"></span>
          <span className="ml-1">Live Stream</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-intel-cyan/20">
        {events
          .filter(e => typeof e?.id === "string" && e.id.length > 0)
          .map((update) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={update.id} 
              className={`p-2 border-l-2 ${update.urgent ? 'border-intel-red bg-intel-red/5' : 'border-intel-cyan/30 bg-white/5'} space-y-1`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-[8px] font-mono font-bold px-1 rounded ${update.urgent ? 'bg-intel-red text-white' : 'bg-intel-cyan/20 text-intel-cyan'}`}>
                    {update.type || 'INFO'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 font-mono">{update.source}</span>
                </div>
                <span className="text-[8px] font-mono text-slate-600">
                  {new Date(update.timestamp || update.date || Date.now()).toTimeString().slice(0, 8) + 'Z'}
                </span>
              </div>
              <div className="text-[10px] text-slate-300 leading-relaxed uppercase font-medium">
                {(update as any).content || update.description || update.title}
              </div>
              {update.urgent && (
                <div className="flex items-center space-x-1 text-intel-red">
                  <AlertCircle className="w-2 h-2" />
                  <span className="text-[7px] font-mono uppercase font-bold">Priority Action Required</span>
                </div>
              )}
            </motion.div>
          ))}
      </div>

      <div className="mt-4 pt-2 border-t border-intel-cyan/10">
        <div className="flex items-center justify-between text-[7px] font-mono text-slate-600 uppercase">
          <span>Buffer Status: {(events.length / 200 * 100).toFixed(0)}%</span>
          <span>Pipeline: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
