import React from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, AlertTriangle, Calendar, Activity } from 'lucide-react';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ReferenceLine
} from 'recharts';

const forecastData = [
  { date: '2026-03-18', mean: 64.3, low: 64.3, high: 64.3 },
  { date: '2026-04-18', mean: 66.1, low: 62.1, high: 70.1 },
  { date: '2026-05-18', mean: 68.4, low: 61.4, high: 75.4 },
  { date: '2026-06-18', mean: 71.2, low: 60.2, high: 82.2 },
  { date: '2026-07-18', mean: 74.5, low: 58.5, high: 90.5 },
  { date: '2026-08-18', mean: 78.1, low: 55.1, high: 98.1 },
];

export const Predict: React.FC = () => {
  const forecasts = [
    { label: 'Protest Intensity', prob: 0.82, timeframe: '7-Day', trend: 'up' },
    { label: 'Arrest Rate', prob: 0.65, timeframe: '30-Day', trend: 'up' },
    { label: 'Economic Default', prob: 0.28, timeframe: '90-Day', trend: 'up' },
    { label: 'Regime Stability', prob: 0.35, timeframe: '90-Day', trend: 'down' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Probabilistic Forecasts</h2>
        <p className="text-slate-500 text-sm">7, 30, and 90-day predictive modeling for key stability metrics</p>
        <div className="pt-4">
          <div className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 px-4 py-2 rounded-lg">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">Predictive Engine Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {forecasts.map((f, i) => (
          <motion.div 
            key={f.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border border-intel-border relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap className="w-16 h-16" />
            </div>
            
            <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">{f.timeframe} Forecast</div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">{f.label}</h4>
            
            <div className="flex items-baseline space-x-2 mb-4">
              <span className={`text-3xl font-bold font-mono ${f.prob > 0.7 ? 'text-intel-red' : f.prob > 0.4 ? 'text-intel-orange' : 'text-intel-green'}`}>
                {(f.prob * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Probability</span>
            </div>

            <div className="h-1.5 w-full bg-intel-border rounded-full overflow-hidden">
              <div 
                className={`h-full ${f.prob > 0.7 ? 'bg-intel-red' : f.prob > 0.4 ? 'bg-intel-orange' : 'bg-intel-green'}`} 
                style={{ width: `${f.prob * 100}%` }}
              ></div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Activity className={`w-3 h-3 ${f.trend === 'up' ? 'text-intel-red' : 'text-intel-green'}`} />
                <span className="text-[8px] font-mono text-slate-500 uppercase">Trend: {f.trend}</span>
              </div>
              <button className="text-[8px] font-mono text-intel-cyan uppercase font-bold hover:underline">View Methodology</button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass p-8 rounded-2xl">
          <h3 className="text-sm tracking-widest mb-6 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-intel-cyan" />
            90-Day Stability Trajectory
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorMean" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="high" 
                  stroke="none" 
                  fill="#00f2ff" 
                  fillOpacity={0.1} 
                />
                <Area 
                  type="monotone" 
                  dataKey="low" 
                  stroke="none" 
                  fill="#0a0a0a" 
                  fillOpacity={1} 
                />
                <Line 
                  type="monotone" 
                  dataKey="mean" 
                  stroke="#00f2ff" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#00f2ff' }}
                />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'CRITICAL', position: 'right', fill: '#ef4444', fontSize: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 glass p-8 rounded-2xl bg-gradient-to-br from-intel-card to-intel-orange/5">
          <h3 className="text-sm tracking-widest mb-4 flex items-center text-intel-orange">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Scenario Branching
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-intel-border rounded-xl">
              <div className="text-[10px] font-mono text-intel-cyan uppercase font-bold mb-1">Scenario A: IMF Deal</div>
              <div className="text-xs text-slate-400">RRI drops to 1.85, P(rev) to 32%</div>
            </div>
            <div className="p-4 bg-white/5 border border-intel-border rounded-xl">
              <div className="text-[10px] font-mono text-intel-red uppercase font-bold mb-1">Scenario B: General Strike</div>
              <div className="text-xs text-slate-400">RRI spikes to 3.12, P(rev) to 88%</div>
            </div>
            <button className="w-full py-3 bg-intel-orange/10 text-intel-orange border border-intel-orange/20 rounded-xl text-[10px] font-mono uppercase font-bold hover:bg-intel-orange/20 transition-all">
              Launch Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
