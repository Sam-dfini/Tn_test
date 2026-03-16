import React from 'react';
import { motion } from 'motion/react';

const sensors = [
  { label: 'Border Activity', value: 'HIGH', sub: 'Tunis-Libya/Alg', color: 'text-intel-orange', bg: 'bg-intel-orange' },
  { label: 'Social Unrest', value: 'MODERATE', sub: '3 active protests', color: 'text-intel-orange', bg: 'bg-intel-orange' },
  { label: 'SDR Coverage', value: '24/24', sub: 'Governorate sync', color: 'text-intel-cyan', bg: 'bg-intel-cyan' },
  { label: 'Maritime Watch', value: '14', sub: 'Vessels in port', color: 'text-intel-purple', bg: 'bg-intel-purple' },
  { label: 'Water Crisis', value: 'CRITICAL', sub: '12 govs affected', color: 'text-intel-red', bg: 'bg-intel-red' },
  { label: 'Conflict Events', value: '2', sub: 'Border skirmish', color: 'text-intel-red', bg: 'bg-intel-red' },
  { label: 'Health Watch', value: 'STABLE', sub: 'Local clinics', color: 'text-intel-green', bg: 'bg-intel-green' },
  { label: 'Local News', value: '12', sub: 'TAP geolocated', color: 'text-intel-cyan', bg: 'bg-intel-cyan' },
  { label: 'OSINT Feed', value: '84', sub: '8 urgent', color: 'text-intel-orange', bg: 'bg-intel-orange' },
];

export const SensorGrid: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sensor Grid</h3>
        <div className="flex items-center space-x-1">
          <span className="w-1 h-1 rounded-full bg-intel-green animate-pulse"></span>
          <span className="text-[8px] font-mono text-intel-green uppercase font-bold">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {sensors.map((s) => (
          <div key={s.label} className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full ${s.bg}`}></div>
              <div>
                <div className="text-[10px] font-bold text-white uppercase tracking-tight group-hover:text-intel-cyan transition-colors">{s.label}</div>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{s.sub}</div>
              </div>
            </div>
            <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
