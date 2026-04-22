import React from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../utils/cn';

export const SignalCore: React.FC = () => {
  const { data, rriState } = usePipeline();

  const metrics = [
    {
      label: 'Protest Tempo',
      value: data.social.protest_events_30d,
      max: 50,
      color: data.social.protest_events_30d > 20
        ? 'bg-intel-red' : 'bg-intel-orange',
      unit: '/30d'
    },
    {
      label: 'Decree 54',
      value: data.social.decree54_charged,
      max: 100,
      color: 'bg-intel-red',
      unit: ' charged'
    },
    {
      label: 'FX Cover',
      value: data.economy.fx_reserves,
      max: 180,
      color: data.economy.fx_reserves < 90
        ? 'bg-intel-orange' : 'bg-intel-cyan',
      unit: ' days'
    },
    {
      label: 'UGTT Index',
      value: data.social.ugtt_mobilisation_level === 'HIGH' ? 80 :
             data.social.ugtt_mobilisation_level === 'ELEVATED' ? 60 : 40,
      max: 100,
      color: data.social.ugtt_mobilisation_level === 'HIGH'
        ? 'bg-intel-red' : 'bg-intel-orange',
      unit: '%'
    },
    {
      label: 'Water Crisis',
      value: data.social.water_crisis_govs,
      max: 24,
      color: 'bg-intel-red',
      unit: ' govs'
    },
    {
      label: 'RRI Level',
      value: parseFloat(rriState.rri.toFixed(2)),
      max: 5,
      color: rriState.rri > 2.625
        ? 'bg-intel-red' : 'bg-intel-orange',
      unit: ''
    },
  ];

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-[10px] font-mono text-slate-500
            uppercase tracking-widest">Signal Core</h3>
          <div className="w-1 h-1 rounded-full bg-intel-green
            animate-pulse" />
        </div>
        <span className="text-[8px] font-mono text-intel-orange uppercase font-bold tracking-widest">Tunisia Metrics</span>
      </div>

      <div className="space-y-4 flex-1">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1.5 group">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-slate-200 transition-colors">
                {m.label}
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-mono font-bold text-white">{m.value}</span>
                <span className="text-[8px] font-mono text-slate-600 uppercase">{m.unit}</span>
              </div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-1000", m.color)} 
                style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 text-[7px] font-mono text-slate-600 uppercase tracking-widest text-center">
        Real-time sensor fusion active
      </div>
    </div>
  );
};
