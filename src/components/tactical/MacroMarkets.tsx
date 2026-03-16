import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

const indexes = [
  { label: 'S&P 500', value: '$662.29', change: '-1.5%', trend: 'down' },
  { label: 'NASDAQ 100', value: '$593.72', change: '-1.01%', trend: 'down' },
  { label: 'DOW JONES', value: '$466.41', change: '-1.56%', trend: 'down' },
  { label: 'RUSSELL 2000', value: '$246.59', change: '-1.71%', trend: 'down' },
];

const crypto = [
  { label: 'BITCOIN', value: '$70,653.2', change: '+1.04%', trend: 'up' },
  { label: 'ETHEREUM', value: '$2,078.14', change: '+2.01%', trend: 'up' },
];

const energy = [
  { label: 'WTI CRUDE', value: '$98.71', change: '$/bbl', trend: 'down' },
  { label: 'BRENT', value: '$103.14', change: '$/bbl', trend: 'up' },
  { label: 'NAT GAS', value: '$3.13', change: '$/MMBtu', trend: 'down' },
];

export const MacroMarkets: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Macro + Markets</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">Live</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Indexes</div>
          <div className="grid grid-cols-2 gap-4">
            {indexes.map(idx => (
              <div key={idx.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{idx.label}</div>
                <div className="text-xs font-bold font-mono text-intel-orange">{idx.value}</div>
                <div className={`text-[8px] font-mono flex items-center ${idx.trend === 'up' ? 'text-intel-green' : 'text-intel-red'}`}>
                  {idx.trend === 'up' ? <TrendingUp className="w-2 h-2 mr-1" /> : <TrendingDown className="w-2 h-2 mr-1" />}
                  {idx.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Crypto</div>
          <div className="grid grid-cols-1 gap-4">
            {crypto.map(c => (
              <div key={c.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{c.label}</div>
                <div className="text-xs font-bold font-mono text-intel-green">{c.value}</div>
                <div className={`text-[8px] font-mono flex items-center ${c.trend === 'up' ? 'text-intel-green' : 'text-intel-red'}`}>
                  {c.trend === 'up' ? <TrendingUp className="w-2 h-2 mr-1" /> : <TrendingDown className="w-2 h-2 mr-1" />}
                  {c.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Energy + Macro</div>
          <div className="grid grid-cols-2 gap-4">
            {energy.map(e => (
              <div key={e.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{e.label}</div>
                <div className="text-xs font-bold font-mono text-white">{e.value}</div>
                <div className="text-[8px] font-mono text-slate-600">{e.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
