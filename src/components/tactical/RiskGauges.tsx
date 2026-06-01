import React from 'react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { generateStableKey, prepareList } from '../../lib/keyUtils';

export const RiskGauges: React.FC = () => {
  const { fullData: data, rriState } = useRiskMetrics();

  const gauges = [
    { 
      label: 'RRI Index', 
      value: (rriState?.rri ?? 0).toFixed(2), 
      color: (rriState?.rri ?? 0) >= 2.5 ? 'text-intel-red' : 
             (rriState?.rri ?? 0) >= 2.0 ? 'text-intel-orange' : 
             'text-intel-cyan',
      level: (rriState?.rri ?? 0) >= 2.5 ? 'bg-intel-red' : 
             (rriState?.rri ?? 0) >= 2.0 ? 'bg-intel-orange' : 
             'bg-intel-cyan'
    },
    { 
      label: 'P(Revolution)', 
      value: ((rriState?.p_rev ?? 0) * 100).toFixed(1) + '%',
      color: (rriState?.p_rev ?? 0) >= 0.7 ? 'text-intel-red' : 
             (rriState?.p_rev ?? 0) >= 0.5 ? 'text-intel-orange' : 
             'text-intel-cyan',
      level: (rriState?.p_rev ?? 0) >= 0.7 ? 'bg-intel-red' : 
             (rriState?.p_rev ?? 0) >= 0.5 ? 'bg-intel-orange' : 
             'bg-intel-cyan'
    },
    { 
      label: 'Compound Stress', 
      value: ((rriState?.compound_stress ?? 0) * 100).toFixed(1) + '%',
      color: (rriState?.compound_stress ?? 0) >= 0.1 ? 'text-intel-red' : 
             (rriState?.compound_stress ?? 0) >= 0.05 ? 'text-intel-orange' : 
             'text-intel-cyan',
      level: (rriState?.compound_stress ?? 0) >= 0.1 ? 'bg-intel-red' : 
             (rriState?.compound_stress ?? 0) >= 0.05 ? 'bg-intel-orange' : 
             'bg-intel-cyan'
    },
    { 
      label: 'Velocity of Change', 
      value: rriState?.velocity_label || 'STABLE',
      color: (rriState?.velocity ?? 0) > 0.2 ? 'text-intel-red' : 
             (rriState?.velocity ?? 0) > 0.1 ? 'text-intel-orange' : 
             'text-intel-cyan',
      level: (rriState?.velocity ?? 0) > 0.2 ? 'bg-intel-red' : 
             (rriState?.velocity ?? 0) > 0.1 ? 'bg-intel-orange' : 
             'bg-intel-cyan'
    },
    { 
      label: 'FX Reserves', 
      value: data.economy.fx_reserves + ' days',
      color: data.economy.fx_reserves < 60 ? 'text-intel-red' :
             data.economy.fx_reserves < 90 ? 'text-intel-orange' :
             'text-intel-cyan',
      level: data.economy.fx_reserves < 60 ? 'bg-intel-red' :
             data.economy.fx_reserves < 90 ? 'bg-intel-orange' :
             'bg-intel-cyan'
    },
    { 
      label: 'Inflation', 
      value: data.economy.inflation + '%',
      color: data.economy.inflation > 9 ? 'text-intel-red' :
             data.economy.inflation > 7 ? 'text-intel-orange' :
             'text-intel-cyan',
      level: data.economy.inflation > 9 ? 'bg-intel-red' :
             data.economy.inflation > 7 ? 'bg-intel-orange' :
             'bg-intel-cyan'
    },
    { 
      label: 'TND/USD', 
      value: (data?.economy?.tnd_usd ?? 3.118).toFixed(3),
      color: 'text-on-surface',
      level: 'bg-slate-700'
    },
    { 
      label: 'Protest Events/30d', 
      value: data.social.protest_events_30d.toString(),
      color: data.social.protest_events_30d > 20 ? 'text-intel-red' :
             data.social.protest_events_30d > 10 ? 'text-intel-orange' :
             'text-intel-cyan',
      level: data.social.protest_events_30d > 20 ? 'bg-intel-red' :
             data.social.protest_events_30d > 10 ? 'bg-intel-orange' :
             'bg-intel-cyan'
    },
    { 
      label: 'UGTT Status', 
      value: data.social.ugtt_mobilisation_level,
      color: data.social.ugtt_mobilisation_level === 'HIGH' ? 
             'text-intel-red' : 'text-intel-orange',
      level: data.social.ugtt_mobilisation_level === 'HIGH' ? 
             'bg-intel-red' : 'bg-intel-orange'
    },
  ];

  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Tunisia Risk Gauges</h3>
        <span className="text-[8px] font-mono text-intel-orange uppercase font-bold">Stress Level</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {prepareList(gauges).map((g: any, i: number) => (
          <div key={generateStableKey(g, i, 'gauge')} className="space-y-1 bg-white/5 p-2 rounded border border-intel-border/10">
            <div className="flex flex-col">
              <div className="text-[8px] text-slate-500 uppercase tracking-tighter truncate">{g.label}</div>
              <div className={`text-[10px] font-mono font-bold ${g.color}`}>{g.value}</div>
            </div>
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full w-full ${g.level} opacity-40`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
