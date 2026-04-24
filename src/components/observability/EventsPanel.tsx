import React from 'react';
import { ShieldCheck, Target, AlertTriangle } from 'lucide-react';

interface EventsPanelProps {
  events: any[];
  schemaCheck: {
    missingCritical: number;
    invalidIds: number;
  };
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ events, schemaCheck }) => {
  const criticalCount = events.filter(e => e.is_critical).length;
  
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-5 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          Events (Clusters)
        </h3>
        <span className="text-lg font-mono font-bold text-white/90">{events.length}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase font-bold tracking-tighter">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Critical Level
          </div>
          <span className="text-xs font-mono font-bold text-red-400">
            {criticalCount}
          </span>
        </div>

        <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
          <div className="bg-black/30 p-2 rounded">
             <div className="text-[8px] text-white/20 uppercase font-bold">Incomplete</div>
             <div className={`text-xs font-mono font-bold ${schemaCheck.missingCritical > 0 ? 'text-amber-500' : 'text-white/20'}`}>
                {schemaCheck.missingCritical}
             </div>
          </div>
          <div className="bg-black/30 p-2 rounded">
             <div className="text-[8px] text-white/20 uppercase font-bold">Orphaned</div>
             <div className={`text-xs font-mono font-bold ${schemaCheck.invalidIds > 0 ? 'text-red-500' : 'text-white/20'}`}>
                {schemaCheck.invalidIds}
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
         <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-40" />
         <span className="text-[9px] text-white/40 uppercase tracking-tighter">Schema Integrity: {schemaCheck.invalidIds > 0 ? 'DEGRADED' : 'VALDIATED'}</span>
      </div>
    </div>
  );
};
