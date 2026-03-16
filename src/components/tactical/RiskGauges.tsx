import React from 'react';

const gauges = [
  { label: 'VIX (Fear)', value: '27.29', color: 'text-intel-orange' },
  { label: 'HY Spread', value: '3.17', color: 'text-white' },
  { label: 'USD Index', value: '119.5', color: 'text-white' },
  { label: 'Jobless Claims', value: '213,000', color: 'text-white' },
  { label: '30Y Mortgage', value: '6.11%', color: 'text-white' },
  { label: 'M2 Supply', value: '$22.4T', color: 'text-white' },
  { label: 'Nat. Debt', value: '$38.90T', color: 'text-white' },
];

export const RiskGauges: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Risk Gauges</h3>
        <span className="text-[8px] font-mono text-intel-orange uppercase font-bold">Stress</span>
      </div>

      <div className="space-y-2">
        {gauges.map((g) => (
          <div key={g.label} className="flex items-center justify-between">
            <div className="text-[9px] text-slate-500 uppercase">{g.label}</div>
            <div className={`text-[9px] font-mono font-bold ${g.color}`}>{g.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
