import React from 'react';
import { motion } from 'motion/react';
import { Zap, Droplets, Battery, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';

export const Energy: React.FC = () => {
  const facilities = [
    { name: 'Nawara Gas Field', status: 'OPERATIONAL', risk: 'LOW', output: '85%' },
    { name: 'El Borma Oil Field', status: 'DISRUPTED', risk: 'HIGH', output: '42%' },
    { name: 'Skhira Refinery', status: 'MONITORED', risk: 'MEDIUM', output: '68%' },
    { name: 'STEG Grid Hub', status: 'CRITICAL', risk: 'ALERT', output: '55%' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl tracking-tight">Energy & Infrastructure</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time monitoring of critical energy assets and grid stability</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 bg-intel-orange/10 text-intel-orange border border-intel-orange/20 px-4 py-2 rounded-lg">
              <Battery className="w-4 h-4" />
              <span className="text-xs font-mono uppercase font-bold">Grid Stress: HIGH</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map((f, i) => (
          <motion.div 
            key={f.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-lg bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20">
                <Zap className="w-5 h-5 text-intel-cyan" />
              </div>
              <div className={cn(
                "px-2 py-0.5 rounded text-[8px] font-mono font-bold border",
                f.risk === 'ALERT' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                f.risk === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                "bg-intel-green/10 text-intel-green border-intel-green/20"
              )}>
                {f.status}
              </div>
            </div>

            <h4 className="text-white font-bold uppercase tracking-tight mb-4">{f.name}</h4>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[8px] mb-1">
                  <span className="text-slate-500 uppercase">Output Efficiency</span>
                  <span className="text-intel-cyan font-mono">{f.output}</span>
                </div>
                <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
                  <div className="h-full bg-intel-cyan" style={{ width: f.output }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 glass p-8 rounded-2xl">
          <h3 className="text-sm tracking-widest mb-6 flex items-center">
            <Droplets className="w-4 h-4 mr-2 text-intel-cyan" />
            Water Crisis Heatmap
          </h3>
          <div className="relative h-64 w-full bg-intel-bg/50 rounded-xl border border-intel-border overflow-hidden p-6 flex items-center justify-center">
             <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-intel-orange mx-auto mb-4 opacity-50" />
                <p className="text-xs text-slate-500 uppercase tracking-widest">Geospatial Water Stress Data Loading...</p>
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 glass p-8 rounded-2xl bg-gradient-to-br from-intel-card to-intel-red/5">
          <h3 className="text-sm tracking-widest mb-4 flex items-center text-intel-red">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Supply Chain Alert
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Gas import dependency has reached 52%. Sustained blockade of the Skhira refinery will trigger rolling blackouts in Tunis within 72 hours.
          </p>
          <div className="p-4 bg-intel-red/10 border border-intel-red/20 rounded-xl">
            <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Critical Threshold</div>
            <div className="text-xl font-bold font-mono text-white">48h Reserve</div>
          </div>
        </div>
      </div>
    </div>
  );
};
