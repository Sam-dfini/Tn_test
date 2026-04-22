import React from 'react';
import { Globe, Clock, CheckCircle, XCircle } from 'lucide-react';

interface FeedPanelProps {
  metrics: {
    lastFetch: number;
    successCount: number;
    failureCount: number;
    isFetching: boolean;
  };
}

export const FeedPanel: React.FC<FeedPanelProps> = ({ metrics }) => {
  const lastFetchStr = metrics.lastFetch > 0 
    ? new Date(metrics.lastFetch).toLocaleTimeString() 
    : 'NEVER';
  
  const total = metrics.successCount + metrics.failureCount;
  const ratio = total > 0 ? (metrics.successCount / total) * 100 : 100;

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-5 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Globe className="w-4 h-4 text-intel-cyan" />
          Feed Ingestion
        </h3>
        {metrics.isFetching && (
          <div className="flex items-center gap-2 text-[10px] text-intel-cyan animate-pulse font-mono">
            INGESTING...
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Last Fetch</span>
          <span className="text-sm font-mono text-white/90 flex items-center gap-2">
            <Clock className="w-3 h-3 opacity-40" />
            {lastFetchStr}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Success Ratio</span>
          <span className={`text-sm font-mono ${ratio < 50 ? 'text-red-400' : ratio < 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {ratio.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5 space-y-2">
         <div className="flex justify-between text-xs font-mono">
            <span className="text-white/40">Success</span>
            <span className="text-emerald-400">{metrics.successCount}</span>
         </div>
         <div className="flex justify-between text-xs font-mono">
            <span className="text-white/40">Failures</span>
            <span className="text-red-400">{metrics.failureCount}</span>
         </div>
      </div>
    </div>
  );
};
