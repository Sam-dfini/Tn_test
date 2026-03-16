import React from 'react';

const sites = [
  { name: 'STEG Rades Power Station', value: 'NOMINAL', color: 'text-intel-green' },
  { name: 'Trans-Med Pipeline (Cap Bon)', value: 'FLOW: 100%', color: 'text-intel-cyan' },
  { name: 'Port of La Goulette', value: 'ACTIVE', color: 'text-intel-cyan' },
  { name: 'Skhira Oil Terminal', value: 'SECURE', color: 'text-intel-cyan' },
  { name: 'Bizerte Refinery', value: 'NOMINAL', color: 'text-intel-green' },
  { name: 'Gabes Chemical Complex', value: 'MONITORING', color: 'text-intel-orange' },
];

export const NuclearWatch: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Critical Infrastructure</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">Status</span>
      </div>

      <div className="mb-4 flex items-center space-x-2 bg-intel-cyan/5 border border-intel-cyan/20 px-2 py-1 rounded">
        <div className="w-1 h-1 rounded-full bg-intel-cyan"></div>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">Grid Stability: 98.4%</span>
      </div>

      <div className="space-y-2">
        {sites.map((site) => (
          <div key={site.name} className="flex items-center justify-between">
            <div className="text-[9px] text-slate-300 uppercase truncate pr-2">{site.name}</div>
            <div className={`text-[9px] font-mono font-bold whitespace-nowrap ${site.color}`}>{site.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
