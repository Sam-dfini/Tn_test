import React, { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Activity, Globe } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../utils/cn';

export const MacroMarkets: React.FC = () => {
  const { data } = usePipeline();
  const [liveRates, setLiveRates] = useState<any>(null);
  const [lastFetch, setLastFetch] = useState<string>('');

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(
          'https://api.exchangerate-api.com/v4/latest/TND'
        );
        const json = await res.json();
        setLiveRates(json.rates);
        setLastFetch(new Date().toLocaleTimeString());
      } catch {
        setLastFetch('Pipeline');
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 300000);
    return () => clearInterval(interval);
  }, []);

  const forex = [
    {
      label: 'USD/TND',
      value: liveRates?.USD
        ? (1/liveRates.USD).toFixed(4)
        : data.economy.tnd_usd.toFixed(4),
      change: '+0.05%',
      trend: 'up',
      live: !!liveRates
    },
    {
      label: 'EUR/TND',
      value: liveRates?.EUR
        ? (1/liveRates.EUR).toFixed(4)
        : (data.economy.tnd_usd * 1.08).toFixed(4),
      change: '-0.12%',
      trend: 'down',
      live: !!liveRates
    },
    {
      label: 'SAR/TND',
      value: liveRates?.SAR
        ? (1/liveRates.SAR).toFixed(4)
        : '0.849',
      change: '0.00%',
      trend: 'stable',
      live: !!liveRates
    },
    {
      label: 'FX COVER',
      value: `${data.economy.fx_reserves}d`,
      change: data.economy.fx_reserves < 90 ? '⚠ BELOW 90' : 'BCT',
      trend: data.economy.fx_reserves < 90 ? 'down' : 'stable',
      live: true,
      urgent: data.economy.fx_reserves < 90
    },
    {
      label: 'PARALLEL',
      value: `+${data.economy.parallel_market_premium || 18}%`,
      change: 'vs official',
      trend: 'up',
      live: true,
      urgent: true
    },
  ];

  const tunisiaMarkets = forex;

  const globalIndexes = [
    { label: 'TUNINDEX', value: '9,842', change: '-0.24%', trend: 'down' },
    { label: 'BVMT', value: '2,456', change: '+0.12%', trend: 'up' },
    { label: 'S&P 500', value: '5,667', change: '+0.8%', trend: 'up' },
    { label: 'BRENT', value: '$81.2', change: '+0.4%', trend: 'up' },
    { label: 'NAT GAS', value: '$2.1', change: '-1.2%', trend: 'down' },
    { label: 'GOLD', value: '$2,340', change: '+0.6%', trend: 'up' },
  ];

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-3 h-3 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Macro + Markets</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[8px] font-mono text-intel-cyan">
            {liveRates ? `Live · ${lastFetch}` : 'Pipeline Data'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto md:overflow-visible pr-2 md:pr-0 scrollbar-hide">
        {/* Column 1: Tunisia Markets */}
        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2 border-b border-white/5 pb-1">Tunisia Markets</div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {tunisiaMarkets.map(m => (
              <div key={m.label} className="group">
                <div className="flex justify-between items-center mb-0.5">
                  <div className="text-[8px] font-mono text-slate-500 uppercase">{m.label}</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase">{m.live ? 'live' : 'BCT'}</div>
                </div>
                <div className={cn(
                  "text-xs font-bold font-mono transition-colors",
                  m.urgent ? "text-intel-red" : "text-white group-hover:text-intel-cyan"
                )}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Forex TND */}
        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2 border-b border-white/5 pb-1">Forex (TND)</div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {tunisiaMarkets.slice(0, 4).map(f => (
              <div key={f.label} className="p-2 bg-white/5 rounded border border-white/5 hover:border-intel-cyan/30 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-[8px] font-mono text-slate-500 uppercase">{f.label}</div>
                  {f.live && (
                    <span className="text-[6px] bg-intel-green/20 text-intel-green px-1 rounded font-bold">LIVE</span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-intel-cyan">{f.value}</div>
                <div className="text-[7px] font-mono text-slate-500 mt-1 uppercase">Spot Rate</div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Global Commodities */}
        <div className="space-y-4">
          <div className="text-[8px] font-mono text-slate-600 uppercase mb-2 border-b border-white/5 pb-1 flex items-center justify-between">
            <span>Global Indexes</span>
            <Globe className="w-2 h-2 text-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {globalIndexes.map(idx => (
              <div key={idx.label}>
                <div className="text-[8px] font-mono text-slate-500 uppercase">{idx.label}</div>
                <div className="text-[10px] font-bold font-mono text-white">{idx.value}</div>
                <div className={cn(
                  "text-[8px] font-mono flex items-center",
                  idx.trend === 'up' ? 'text-intel-green' : 'text-intel-red'
                )}>
                  {idx.trend === 'up' ? <TrendingUp className="w-2 h-2 mr-1" /> : <TrendingDown className="w-2 h-2 mr-1" />}
                  {idx.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[7px] font-mono text-slate-600 uppercase tracking-widest">
        <div className="space-x-2">
          <span>Tunisia-specific: BCT/Pipeline</span>
          <span>|</span>
          <span>Global: ExchangeRate-API</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Last update: {lastFetch}</span>
          <span className="text-intel-orange">Parallel market premium signals capital flight risk</span>
        </div>
      </div>
    </div>
  );
};
