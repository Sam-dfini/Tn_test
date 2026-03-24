import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Users, 
  ShieldAlert, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Briefcase,
  Globe
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePipeline } from '../../context/PipelineContext';

const strikeHistory = [
  { date: '2025-12-15', sector: 'Transport', impact: 'HIGH', status: 'RESOLVED', description: 'National rail strike over wage arrears.' },
  { date: '2026-01-10', sector: 'Education', impact: 'MEDIUM', status: 'ONGOING', description: 'Teacher union protests against budget cuts.' },
  { date: '2026-02-05', sector: 'Health', impact: 'CRITICAL', status: 'THREATENED', description: 'General health strike threatened for March.' },
  { date: '2026-02-20', sector: 'Phosphate (CPG)', impact: 'CRITICAL', status: 'ACTIVE', description: 'Regional strike in Gafsa basin.' },
];

const wageNegotiations = [
  { sector: 'Public Service', demand: '+12%', offer: '+4%', gap: '8%', status: 'STALLED', risk: 'HIGH' },
  { sector: 'Education', demand: '+15%', offer: '+6%', gap: '9%', status: 'ACTIVE', risk: 'CRITICAL' },
  { sector: 'Health', demand: '+10%', offer: '+5%', gap: '5%', status: 'NEGOTIATING', risk: 'MEDIUM' },
  { sector: 'Transport', demand: '+8%', offer: '+3%', gap: '5%', status: 'STALLED', risk: 'HIGH' },
];

const contributingFactors = [
  { factor: 'Inflation (CPI)', value: '10.2%', trend: 'up', impact: 0.92 },
  { factor: 'Purchasing Power', value: '-15%', trend: 'down', impact: 0.88 },
  { factor: 'Public Debt/GDP', value: '88%', trend: 'up', impact: 0.75 },
  { factor: 'Unemployment', value: '16.4%', trend: 'up', impact: 0.82 },
];

export const UGTTMonitor: React.FC = () => {
  const { rriState } = usePipeline();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const stats = [
    { label: 'Total Membership', value: '750k+', icon: Users, color: 'text-intel-cyan' },
    { label: 'Strike Probability', value: '64%', icon: Zap, color: 'text-intel-red' },
    { label: 'Negotiation Gap', value: 'Avg 6.8%', icon: Activity, color: 'text-intel-orange' },
    { label: 'Economic Impact', value: 'HIGH', icon: TrendingUp, color: 'text-intel-red' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="intel-card p-6 rounded-2xl border border-intel-border flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</div>
              </div>
              <stat.icon className={cn("w-5 h-5 opacity-20", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Wage Negotiations & Factors */}
        <div className="lg:col-span-2 space-y-8">
          <div className="intel-card p-8 rounded-3xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Wage Negotiation Status</h3>
              <BarChart3 className="w-5 h-5 text-intel-cyan opacity-20" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    <th className="pb-4 font-normal">Sector</th>
                    <th className="pb-4 font-normal">Demand</th>
                    <th className="pb-4 font-normal">Offer</th>
                    <th className="pb-4 font-normal">Gap</th>
                    <th className="pb-4 font-normal text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {wageNegotiations.map((neg, i) => (
                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="text-xs font-bold text-white">{neg.sector}</div>
                        <div className="text-[8px] font-mono text-slate-500 uppercase">{neg.status}</div>
                      </td>
                      <td className="py-4 text-[10px] font-mono text-slate-300">{neg.demand}</td>
                      <td className="py-4 text-[10px] font-mono text-slate-300">{neg.offer}</td>
                      <td className="py-4 text-[10px] font-mono text-intel-orange font-bold">{neg.gap}</td>
                      <td className="py-4 text-right">
                        <span className={cn(
                          "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold",
                          neg.risk === 'CRITICAL' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                          neg.risk === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                          "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                        )}>
                          {neg.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contributing Economic Factors</h4>
              <div className="space-y-4">
                {contributingFactors.map((factor, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">{factor.factor}</span>
                      <div className="space-x-2">
                        <span className="text-white font-bold">{factor.value}</span>
                        <span className={cn(
                          "text-[8px]",
                          factor.trend === 'up' ? "text-intel-red" : "text-intel-green"
                        )}>{factor.trend === 'up' ? '↑' : '↓'}</span>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          factor.impact > 0.85 ? "bg-intel-red" : factor.impact > 0.7 ? "bg-intel-orange" : "bg-intel-cyan"
                        )} 
                        style={{ width: `${factor.impact * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl border border-intel-cyan/20 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-intel-cyan">
                  <ShieldAlert className="w-4 h-4" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest">Strategic Assessment</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "The UGTT is currently the only institutional force capable of resisting the executive's economic program. Internal debate between 'confrontation' and 'dialogue' factions is reaching a tipping point. A general strike in Q2 2026 is the primary risk vector for regime stability."
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-[8px] font-mono text-slate-500 uppercase">Leadership Status</div>
                <div className="text-[10px] font-bold text-white uppercase tracking-widest">Tense / Defensive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Strike History & Triggers */}
        <div className="space-y-8">
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recent Strike Activity</h3>
              <Clock className="w-4 h-4 text-intel-cyan opacity-20" />
            </div>
            <div className="space-y-4">
              {strikeHistory.map((strike, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2 group hover:border-intel-cyan/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{strike.sector}</div>
                      <div className="text-[8px] font-mono text-slate-500">{strike.date}</div>
                    </div>
                    <span className={cn(
                      "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold",
                      strike.impact === 'CRITICAL' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                      strike.impact === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                      "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                    )}>
                      {strike.impact}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{strike.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[8px] font-mono text-slate-600 uppercase">Status: {strike.status}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-intel-cyan transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="intel-card p-6 rounded-2xl border border-intel-red/20 space-y-4">
            <div className="flex items-center space-x-2 text-intel-red">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">General Strike Triggers</h4>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Arrest of Executive Bureau Member', prob: '85%' },
                { label: 'Unilateral Civil Service Wage Freeze', prob: '72%' },
                { label: 'Privatization of CPG or STEG', prob: '94%' },
                { label: 'Failure to reach 2026 Wage Agreement', prob: '68%' },
              ].map((trigger, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-slate-400">{trigger.label}</span>
                    <span className="text-intel-red font-bold">{trigger.prob}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-intel-red opacity-50" style={{ width: trigger.prob }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-intel-cyan" />
              <h4 className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest">International Alignment</h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              UGTT maintains strong ties with the ITUC and European trade unions. Any state action against UGTT leadership will likely trigger international labor sanctions and diplomatic pressure from the EU.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
