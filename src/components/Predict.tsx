import React from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, AlertTriangle, Calendar, Activity } from 'lucide-react';

export const Predict: React.FC = () => {
  const forecasts = [
    { label: 'Protest Intensity', prob: 0.82, timeframe: '7-Day', trend: 'up' },
    { label: 'Arrest Rate', prob: 0.65, timeframe: '30-Day', trend: 'up' },
    { label: 'Economic Default', prob: 0.28, timeframe: '90-Day', trend: 'up' },
    { label: 'Regime Stability', prob: 0.35, timeframe: '90-Day', trend: 'down' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight">Probabilistic Forecasts</h2>
          <p className="text-slate-500 text-sm mt-1">7, 30, and 90-day predictive modeling for key stability metrics</p>
        </div>
        <div className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 px-4 py-2 rounded-lg">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-mono uppercase font-bold">Predictive Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="relative h-64 w-full bg-intel-bg/50 rounded-xl border border-intel-border overflow-hidden p-6">
             {/* Confidence Bands Visualization */}
             <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-[80%] h-32 bg-intel-cyan/20 blur-3xl rounded-full transform -rotate-12"></div>
             </div>
             
             <div className="absolute inset-0 flex items-center px-12">
                <svg className="w-full h-full" viewBox="0 0 1000 400">
                  <path 
                    d="M0,200 Q250,150 500,250 T1000,100" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    className="text-intel-cyan"
                  />
                  <path 
                    d="M0,200 Q250,100 500,200 T1000,50 L1000,150 T500,300 Q250,200 0,200" 
                    fill="currentColor" 
                    className="text-intel-cyan/10"
                  />
                </svg>
             </div>

             <div className="absolute top-6 right-6 flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-intel-cyan rounded"></div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">Mean Projection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-intel-cyan/20 rounded"></div>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">95% Confidence Interval</span>
                </div>
             </div>
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
