import React from 'react';
import { motion } from 'motion/react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';

export const SensorGrid: React.FC = () => {
  const { fullData: data, rriState } = useRiskMetrics();

  const sensors = [
    {
      label: 'Social Unrest',
      value: data.social.protest_events_30d > 20 ? 'CRITICAL' :
             data.social.protest_events_30d > 10 ? 'HIGH' : 'MODERATE',
      sub: `${data.social.protest_events_30d} events / 30d`,
      color: data.social.protest_events_30d > 20 ?
        'text-intel-red' : 'text-intel-orange',
      bg: data.social.protest_events_30d > 20 ?
        'bg-intel-red' : 'bg-intel-orange'
    },
    {
      label: 'UGTT Alert',
      value: data.social.ugtt_mobilisation_level,
      sub: `${data.social.ugtt_strike_count_2025 || 847} strikes 2025`,
      color: data.social.ugtt_mobilisation_level === 'HIGH' ?
        'text-intel-red' : 'text-intel-orange',
      bg: data.social.ugtt_mobilisation_level === 'HIGH' ?
        'bg-intel-red' : 'bg-intel-orange'
    },
    {
      label: 'Water Crisis',
      value: 'CRITICAL',
      sub: `${data.social.water_crisis_govs} govs affected`,
      color: 'text-intel-red',
      bg: 'bg-intel-red'
    },
    {
      label: 'FX Reserves',
      value: data.economy.fx_reserves < 90 ? 'WARNING' : 'STABLE',
      sub: `${data.economy.fx_reserves} days cover`,
      color: data.economy.fx_reserves < 90 ?
        'text-intel-orange' : 'text-intel-cyan',
      bg: data.economy.fx_reserves < 90 ?
        'bg-intel-orange' : 'bg-intel-cyan'
    },
    {
      label: 'Decree 54',
      value: `${data.social.decree54_charged} CHARGED`,
      sub: 'Press / Activists',
      color: 'text-intel-red',
      bg: 'bg-intel-red'
    },
    {
      label: 'RRI Status',
      value: rriState.rri >= 2.625 ? 'THRESHOLD' : 'ELEVATED',
      sub: `R(t) = ${rriState.rri.toFixed(2)}`,
      color: rriState.rri >= 2.625 ?
        'text-intel-red' : 'text-intel-orange',
      bg: rriState.rri >= 2.625 ?
        'bg-intel-red' : 'bg-intel-orange'
    },
    {
      label: 'Border Activity',
      value: 'ELEVATED',
      sub: 'Libya-Algeria sectors',
      color: 'text-intel-orange',
      bg: 'bg-intel-orange'
    },
    {
      label: 'Maritime Watch',
      value: '14',
      sub: 'Vessels monitored',
      color: 'text-intel-cyan',
      bg: 'bg-intel-cyan'
    },
    {
      label: 'Press Freedom',
      value: `RANK ${data.social.press_freedom_rank || 118}`,
      sub: 'RSF Global Index',
      color: 'text-intel-orange',
      bg: 'bg-intel-orange'
    },
  ];

  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sensor Grid</h3>
        <div className="flex items-center space-x-1">
          <span className="w-1 h-1 rounded-full bg-intel-green animate-pulse"></span>
          <span className="text-[8px] font-mono text-intel-green uppercase font-bold">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {sensors.map((s) => (
          <div key={s.label} className="bg-white/5 p-2 rounded border border-intel-border/10 group cursor-pointer hover:bg-white/10 transition-colors">
            <div className="flex items-center space-x-1.5 mb-1">
              <div className={`w-1 h-1 rounded-full ${s.bg}`}></div>
              <div className="text-[8px] font-bold text-on-surface uppercase tracking-tight group-hover:text-intel-cyan transition-colors truncate">{s.label}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-mono text-slate-500 uppercase truncate">{s.sub}</div>
              <div className={`text-[9px] font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
