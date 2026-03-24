import React from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const SweepDelta: React.FC = () => {
  const { data, rriState, auditLog } = usePipeline();

  const recentChanges = [
    {
      type: 'RRI',
      field: 'R(t)',
      change: `${rriState.rri.toFixed(4)}`,
      direction: rriState.velocity > 0 ? 'up' : 'down'
    },
    {
      type: 'ECO',
      field: 'fx_reserves',
      change: `${data.economy.fx_reserves} days`,
      direction: data.economy.fx_reserves < 90 ? 'down' : 'stable'
    },
    {
      type: 'SOC',
      field: 'protests',
      change: `${data.social.protest_events_30d}/30d`,
      direction: 'up'
    },
    {
      type: 'RRI',
      field: 'P_cascade',
      change: `${(rriState.cascade_probability*100).toFixed(0)}%`,
      direction: rriState.cascade_probability > 0.5 ? 'up' : 'stable'
    },
  ];

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono text-slate-500
          uppercase tracking-widest">Sweep Delta</h3>
        <span className={`text-[8px] font-mono font-bold uppercase ${
          rriState.velocity > 0.15 ? 'text-intel-red' :
          rriState.velocity < -0.15 ? 'text-intel-cyan' :
          'text-slate-500'
        }`}>
          {rriState.velocity > 0.15 ? '▲ WORSENING' :
           rriState.velocity < -0.15 ? '▼ IMPROVING' :
           '◆ STABLE'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[8px] font-mono text-slate-600 uppercase">
            V(t)
          </div>
          <div className={`text-sm font-bold font-mono ${
            rriState.velocity > 0 ? 'text-intel-red' : 'text-intel-cyan'
          }`}>
            {rriState.velocity > 0 ? '+' : ''}
            {rriState.velocity.toFixed(3)}
          </div>
        </div>
        <div>
          <div className="text-[8px] font-mono text-slate-600 uppercase">
            Breaches
          </div>
          <div className="text-sm font-bold font-mono text-intel-red">
            {rriState.threshold_breaches?.length || 0}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {recentChanges.map((item, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className={`text-[7px] font-mono font-bold px-1
              rounded border uppercase shrink-0 ${
              item.type === 'RRI'
                ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                : item.type === 'ECO'
                ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
            }`}>{item.type}</span>
            <span className="text-[9px] font-mono text-slate-400
              uppercase flex-1 truncate">{item.field}</span>
            <span className={`text-[9px] font-mono font-bold shrink-0 ${
              item.direction === 'up' ? 'text-intel-red' :
              item.direction === 'down' ? 'text-intel-orange' :
              'text-slate-500'
            }`}>{item.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
