import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingDown, TrendingUp, DollarSign, Landmark, PieChart, Info, AlertTriangle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export const Economy: React.FC = () => {
  const indicators = [
    { label: 'GDP Growth', value: '0.4%', trend: 'down', color: 'text-intel-red', history: [0.8, 0.6, 0.5, 0.4, 0.4] },
    { label: 'Inflation', value: '7.1%', trend: 'up', color: 'text-intel-red', history: [8.2, 7.8, 7.5, 7.2, 7.1] },
    { label: 'Unemployment', value: '16.4%', trend: 'up', color: 'text-intel-orange', history: [15.5, 15.8, 16.0, 16.1, 16.2] },
    { label: 'Youth Unemp.', value: '37.8%', trend: 'up', color: 'text-intel-red', history: [35, 36, 37, 37.5, 37.8] },
    { label: 'Public Debt', value: '81.2%', trend: 'up', color: 'text-intel-red', history: [78, 79, 80, 80.5, 81.2] },
    { label: 'BCT Reserves', value: '88 Days', trend: 'down', color: 'text-intel-red', history: [112, 105, 98, 92, 88] },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Economic Intelligence</h2>
        <p className="text-slate-500 text-sm">Macroeconomic indicators and fiscal stability monitoring</p>
        <div className="pt-4">
           <div className="flex items-center space-x-2 bg-intel-red/10 text-intel-red border border-intel-red/20 px-4 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-mono uppercase font-bold">BCT Warning Threshold</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {indicators.map((ind, i) => (
          <motion.div 
            key={ind.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            className="glass p-4 rounded-xl border border-intel-border hover:border-intel-cyan/30 transition-all group relative overflow-hidden h-32 flex flex-col justify-between"
          >
            <div className="relative z-10">
              <div className="text-[8px] font-mono text-slate-500 uppercase mb-1 tracking-widest">{ind.label}</div>
              <div className="flex items-center justify-between">
                <div className={`text-xl font-bold font-mono ${ind.color} tracking-tighter`}>{ind.value}</div>
                {ind.trend === 'up' ? <TrendingUp className={`w-3 h-3 ${ind.color}`} /> : <TrendingDown className={`w-3 h-3 ${ind.color}`} />}
              </div>
            </div>

            <div className="h-10 w-full mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ind.history.map((v, idx) => ({ v, idx }))}>
                  <Line 
                    type="monotone" 
                    dataKey="v" 
                    stroke={ind.color.includes('red') ? '#ef4444' : ind.color.includes('orange') ? '#f97316' : '#00f2ff'} 
                    strokeWidth={2} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm tracking-widest flex items-center">
              <Landmark className="w-4 h-4 mr-2 text-intel-cyan" />
              BCT Reserve Tracker (Import Cover)
            </h3>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Updated Daily</div>
          </div>

          <div className="relative h-64 w-full bg-intel-bg/50 rounded-xl border border-intel-border overflow-hidden p-6">
            {/* Simple Chart Visualization */}
            <div className="absolute inset-0 flex items-end px-12 space-x-4">
              {[112, 108, 105, 98, 95, 92, 88].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / 120) * 100}%` }}
                    className={`w-full rounded-t transition-all ${val < 90 ? 'bg-intel-red/60 group-hover:bg-intel-red' : 'bg-intel-cyan/40 group-hover:bg-intel-cyan'}`}
                  ></motion.div>
                  <span className="text-[8px] font-mono text-slate-500 mt-2">M{i+1}</span>
                </div>
              ))}
            </div>
            
            {/* Threshold Lines */}
            <div className="absolute top-[25%] left-0 right-0 border-t border-intel-red/30 border-dashed flex justify-end pr-4">
              <span className="text-[8px] font-mono text-intel-red -mt-4 uppercase">90-Day Warning</span>
            </div>
            <div className="absolute top-[50%] left-0 right-0 border-t border-intel-red/50 border-dashed flex justify-end pr-4">
              <span className="text-[8px] font-mono text-intel-red -mt-4 uppercase">60-Day Crisis</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
              <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">IMF Status</div>
              <div className="text-xs font-bold text-intel-red uppercase">Round 6 Suspended</div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
              <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Treasury Runway</div>
              <div className="text-xs font-bold text-intel-orange uppercase">14 Weeks Remaining</div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
              <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Phosphate Output</div>
              <div className="text-xs font-bold text-intel-red uppercase">-42% vs Target</div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm tracking-widest mb-4 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-intel-cyan" />
              Debt Breakdown
            </h3>
            <div className="space-y-4">
              {[
                { label: 'External Debt', value: '62%', color: 'bg-intel-cyan' },
                { label: 'Domestic Debt', value: '28%', color: 'bg-intel-purple' },
                { label: 'SOE Debt', value: '10%', color: 'bg-intel-orange' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white uppercase font-bold">{item.label}</span>
                    <span className="text-slate-500 font-mono">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-intel-border rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: item.value }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl bg-gradient-to-br from-intel-card to-intel-red/5">
            <h3 className="text-sm tracking-widest mb-4 flex items-center text-intel-red">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Subsidy Reform Pressure
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Government rejection of IMF subsidy reform conditionality has created a 2.4B TND fiscal gap for Q2 2026.
            </p>
            <div className="p-3 bg-intel-red/10 border border-intel-red/20 rounded-lg">
              <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Risk Implication</div>
              <div className="text-[10px] text-white italic">"High probability of bread and fuel shortages by late April."</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
