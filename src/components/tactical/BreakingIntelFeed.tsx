import React from 'react';
import { motion } from 'motion/react';
import { Radio, Bell, Zap, AlertCircle } from 'lucide-react';

const updates = [
  {
    id: 1,
    source: 'OSINT_ALPHA',
    time: '02:45Z',
    type: 'CRITICAL',
    content: 'Unconfirmed reports of multiple explosions near Sfax industrial zone. Local sources reporting power outages.',
    urgent: true
  },
  {
    id: 2,
    source: 'SIGINT_DELTA',
    time: '02:38Z',
    type: 'SIGNAL',
    content: 'Increased radio traffic detected between maritime assets in the Gulf of Gabes. Frequency hopping observed.',
    urgent: false
  },
  {
    id: 3,
    source: 'GEOINT_PRIME',
    time: '02:15Z',
    type: 'UPDATE',
    content: 'Satellite imagery confirms mobilization of heavy equipment near Gafsa mining facilities.',
    urgent: false
  },
  {
    id: 4,
    source: 'NEWS_WIRE',
    time: '01:55Z',
    type: 'BREAKING',
    content: 'UGTT leadership calls for emergency meeting following stalled negotiations in Tunis.',
    urgent: true
  },
  {
    id: 5,
    source: 'HUMINT_NET',
    time: '01:30Z',
    type: 'INTEL',
    content: 'Reports of localized protests forming in Kasserine over water distribution delays.',
    urgent: false
  }
];

interface BreakingIntelFeedProps {
  externalAlerts?: any[];
}

export const BreakingIntelFeed: React.FC<BreakingIntelFeedProps> = ({ externalAlerts = [] }) => {
  const allUpdates = [...externalAlerts, ...updates];

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
        <div className="flex items-center space-x-1">
          <span className="w-1 h-1 rounded-full bg-intel-red animate-pulse"></span>
          <span className="text-[8px] font-mono text-slate-500 uppercase">Live Stream</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-intel-cyan/20">
        {allUpdates.map((update, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={update.id || idx} 
            className={`p-2 border-l-2 ${update.urgent ? 'border-intel-red bg-intel-red/5' : 'border-intel-cyan/30 bg-white/5'} space-y-1`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-[8px] font-mono font-bold px-1 rounded ${update.urgent ? 'bg-intel-red text-white' : 'bg-intel-cyan/20 text-intel-cyan'}`}>
                  {update.type}
                </span>
                <span className="text-[9px] font-bold text-slate-400 font-mono">{update.source}</span>
              </div>
              <span className="text-[8px] font-mono text-slate-600">{update.time}</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-relaxed uppercase font-medium">
              {update.content}
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
          <span>Buffer Status: 98%</span>
          <span>Encryption: AES-256</span>
        </div>
      </div>
    </div>
  );
};
