import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

const indexes = [
  { label: 'TUNINDEX', value: '9,842.15', change: '-0.24%', trend: 'down' },
  { label: 'BVMT', value: '2,456.80', change: '+0.12%', trend: 'up' },
  { label: 'S&P 500', value: '$5,124.29', change: '-1.5%', trend: 'down' },
  { label: 'NASDAQ', value: '$16,248.5', change: '-1.01%', trend: 'down' },
];

const forex = [
  { label: 'USD/TND', value: '3.1245', change: '+0.05%', trend: 'up' },
  { label: 'EUR/TND', value: '3.3892', change: '-0.12%', trend: 'down' },
  { label: 'SAR/TND', value: '0.8331', change: '0.00%', trend: 'stable' },
];

const energy = [
  { label: 'BRENT CRUDE', value: '$82.45', change: '$/bbl', trend: 'up' },
  { label: 'WTI CRUDE', value: '$78.12', change: '$/bbl', trend: 'down' },
  { label: 'NAT GAS', value: '$1.84', change: '$/MMBtu', trend: 'down' },
];

export const MacroMarkets: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Macro + Markets</h3>
        <div className="flex items-center space-x-2">
          <span className="w-1 h-1 rounded-full bg-intel-green animate-pulse"></span>
          <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">Live Data Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Indexes</div>
          <div className="grid grid-cols-2 gap-4">
            {indexes.map(idx => (
              <div key={idx.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{idx.label}</div>
                <div className="text-xs font-bold font-mono text-white">{idx.value}</div>
                <div className={`text-[8px] font-mono flex items-center ${idx.trend === 'up' ? 'text-intel-green' : idx.trend === 'down' ? 'text-intel-red' : 'text-slate-500'}`}>
                  {idx.trend === 'up' ? <TrendingUp className="w-2 h-2 mr-1" /> : idx.trend === 'down' ? <TrendingDown className="w-2 h-2 mr-1" /> : null}
                  {idx.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Forex (TND)</div>
          <div className="grid grid-cols-1 gap-4">
            {forex.map(f => (
              <div key={f.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{f.label}</div>
                <div className="text-xs font-bold font-mono text-intel-cyan">{f.value}</div>
                <div className={`text-[8px] font-mono flex items-center ${f.trend === 'up' ? 'text-intel-green' : f.trend === 'down' ? 'text-intel-red' : 'text-slate-500'}`}>
                  {f.trend === 'up' ? <TrendingUp className="w-2 h-2 mr-1" /> : f.trend === 'down' ? <TrendingDown className="w-2 h-2 mr-1" /> : null}
                  {f.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Energy + Commodities</div>
          <div className="grid grid-cols-2 gap-4">
            {energy.map(e => (
              <div key={e.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{e.label}</div>
                <div className="text-xs font-bold font-mono text-white">{e.value}</div>
                <div className={`text-[8px] font-mono ${e.trend === 'up' ? 'text-intel-green' : 'text-intel-red'}`}>{e.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
