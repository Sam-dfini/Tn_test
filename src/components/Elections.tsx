import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, PieChart, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

export const Elections: React.FC = () => {
  const results = [
    { name: 'Kais Saied', party: 'Independent', percentage: 89.1, status: 'ELECTED' },
    { name: 'Ayachi Zammel', party: 'Azimoun', percentage: 7.3, status: 'DETAINED' },
    { name: 'Zouhair Maghzaoui', party: 'Echaab', percentage: 3.6, status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Electoral Legitimacy</h2>
        <p className="text-slate-500 text-sm">Analysis of 2024 Presidential results and parliamentary composition</p>
        <div className="pt-4">
          <div className="flex items-center space-x-2 bg-intel-purple/10 text-intel-purple border border-intel-purple/20 px-4 py-2 rounded-lg">
            <Users className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">Turnout: 11.2%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-2xl">
          <h3 className="text-sm tracking-widest mb-8 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-intel-cyan" />
            2024 Presidential Results
          </h3>
          <div className="space-y-8">
            {results.map((r, i) => (
              <div key={r.name} className="space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold text-white uppercase tracking-tight">{r.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">{r.party}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border mb-1 inline-block",
                      r.status === 'ELECTED' ? "bg-intel-green/10 text-intel-green border-intel-green/20" :
                      r.status === 'DETAINED' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                      "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                    )}>
                      {r.status}
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{r.percentage}%</div>
                  </div>
                </div>
                <div className="h-2 w-full bg-intel-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${r.percentage}%` }}
                    transition={{ delay: i * 0.2, duration: 1 }}
                    className={cn(
                      "h-full",
                      r.status === 'ELECTED' ? "bg-intel-cyan" : "bg-slate-600"
                    )}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm tracking-widest mb-4 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-intel-cyan" />
              Parliamentary Blocs
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Pro-Regime', value: '87 Seats', color: 'bg-intel-cyan' },
                { label: 'Independent', value: '54 Seats', color: 'bg-intel-purple' },
                { label: 'Opposition', value: '20 Seats', color: 'bg-intel-red' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-white uppercase font-bold">{item.label}</span>
                    <span className="text-slate-500 font-mono">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-intel-border rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: item.label === 'Pro-Regime' ? '54%' : item.label === 'Independent' ? '33%' : '13%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl bg-intel-cyan/5 border-intel-cyan/20">
            <h3 className="text-sm tracking-widest mb-4 flex items-center text-intel-cyan">
              <Info className="w-4 h-4 mr-2" />
              Institutional Capture
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Electoral institutions (ISIE) are now direct presidential appointments. The 2024 turnout represents a historic low, signaling a significant legitimacy deficit among the youth demographic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
