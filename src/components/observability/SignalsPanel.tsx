import React from 'react';
import { Activity, Zap, TrendingUp } from 'lucide-react';

interface SignalsPanelProps {
  signalCount: number;
  avgIntensity: number;
}

export const SignalsPanel: React.FC<SignalsPanelProps> = ({ signalCount, avgIntensity }) => {
  return (
    <div className="h-full p-4 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Signals Layer
        </h3>
        <span className="text-lg font-mono font-bold text-white/90">{signalCount}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Intensity Pulse</span>
          <div className="flex items-center gap-2 text-sm font-mono text-purple-400">
            <Zap className="w-3 h-3" />
            {avgIntensity.toFixed(3)}
          </div>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Health Level</span>
          <span className={`text-sm font-mono ${signalCount === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {signalCount === 0 ? 'STALLED' : 'ACTIVE'}
          </span>
        </div>
      </div>

      <div className="flex gap-1 h-8 items-end">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{ 
              backgroundColor: 'rgb(168, 85, 247, 0.4)',
              height: `${20 + Math.random() * 80}%`,
              opacity: i > 8 ? 0.3 : 1
            }}
          />
        ))}
      </div>
    </div>
  );
};
