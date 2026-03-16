import React from 'react';

const metrics = [
  { label: 'Incident Tempo', value: 15, max: 20, color: 'bg-intel-cyan' },
  { label: 'Air Theaters', value: 6, max: 10, color: 'bg-intel-cyan' },
  { label: 'Thermal Spikes', value: 465, max: 1000, color: 'bg-intel-cyan' },
  { label: 'SDR Nodes', value: 922, max: 1000, color: 'bg-intel-cyan' },
  { label: 'Chokepoints', value: 8, max: 10, color: 'bg-intel-cyan' },
  { label: 'WHO Alerts', value: 10, max: 20, color: 'bg-intel-cyan' },
];

export const SignalCore: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Signal Core</h3>
        <span className="text-[8px] font-mono text-intel-orange uppercase font-bold">Hot Metrics</span>
      </div>

      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{m.label}</span>
              <span className="text-[10px] font-mono font-bold text-white">{m.value}</span>
            </div>
            <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
              <div 
                className={`h-full ${m.color}`} 
                style={{ width: `${(m.value / m.max) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
