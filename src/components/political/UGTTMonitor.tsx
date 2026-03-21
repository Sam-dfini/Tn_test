import React from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  ComposedChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';

const strikeHistory = [
  { month: 'Mar25', count: 52 },
  { month: 'Apr', count: 48 },
  { month: 'May', count: 65 },
  { month: 'Jun', count: 71 },
  { month: 'Jul', count: 58 },
  { month: 'Aug', count: 44 },
  { month: 'Sep', count: 67 },
  { month: 'Oct', count: 89 },
  { month: 'Nov', count: 95 },
  { month: 'Dec', count: 78 },
  { month: 'Jan26', count: 102 },
  { month: 'Feb', count: 88 },
  { month: 'Mar', count: 94 },
];

const wageNegotiations = [
  { sector: 'Education', demand: 1450, offer: 1180, gap: -270, status: 'DEADLOCKED' },
  { sector: 'Healthcare', demand: 1520, offer: 1240, gap: -280, status: 'DEADLOCKED' },
  { sector: 'Transport', demand: 1280, offer: 1100, gap: -180, status: 'NEGOTIATING' },
  { sector: 'Mining/CPG', demand: 1850, offer: 1420, gap: -430, status: 'STRIKE ACTIVE' },
  { sector: 'Civil Service', demand: 1350, offer: 1190, gap: -160, status: 'FROZEN' },
  { sector: 'Banking', demand: 2100, offer: 1980, gap: -120, status: 'NEAR AGREEMENT' },
];

const contributingFactors = [
  { factor: 'CPG wage arrears', impact: 18, type: 'positive' },
  { factor: 'Inflation 7.1%', impact: 12, type: 'positive' },
  { factor: 'Saied anti-union rhetoric', impact: 8, type: 'positive' },
  { factor: 'IMF wage freeze condition', impact: 15, type: 'positive' },
  { factor: 'Previous strike failures', impact: -8, type: 'negative' },
  { factor: 'Ghannouchi detention', impact: -4, type: 'negative' },
  { factor: 'Ramadan period', impact: -6, type: 'negative' },
];

const triggerConditions = [
  { label: 'Wage arrears > 3 months', current: '2.1 months', progress: 70 },
  { label: 'Simultaneous strikes in 5+ sectors', current: '3 sectors active', progress: 60 },
  { label: 'Public sector participation > 40%', current: '28%', progress: 70 },
];

export const UGTTMonitor: React.FC = () => {
  const strikeProb = 67;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: '650,000', sub: 'Largest in North Africa', icon: Users, color: 'text-intel-cyan' },
          { label: 'Sectors Covered', value: '23', sub: 'Out of 28 public sectors', icon: Activity, color: 'text-intel-cyan' },
          { label: 'Strike Actions 2025', value: '847', sub: 'Annual total', icon: TrendingUp, color: 'text-intel-orange' },
          { label: 'Mobilisation Level', value: 'HIGH', sub: 'Active threat', icon: AlertTriangle, color: 'text-intel-red', badge: true }
        ].map((stat, i) => (
          <div key={i} className="intel-card p-6 rounded-2xl border border-intel-border flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={cn("text-2xl font-bold font-mono", stat.color)}>
                  {stat.value}
                  {stat.badge && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="w-2 h-2 rounded-full bg-intel-red animate-pulse mr-1.5" />
                    </span>
                  )}
                </div>
              </div>
              <stat.icon className={cn("w-5 h-5 opacity-20", stat.color)} />
            </div>
            <div className="text-[9px] font-mono text-slate-600 uppercase mt-4">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Strike History Chart */}
        <div className="lg:col-span-8 intel-card p-8 rounded-3xl border border-intel-border space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-intel-red" />
                <span>Strike Frequency — Monthly (2025-2026)</span>
              </h3>
              <p className="text-xs text-slate-500 uppercase font-mono">Tracking industrial action and labor unrest</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strikeHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                />
                <Bar dataKey="count">
                  {strikeHistory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count > 80 ? '#ef4444' : entry.count > 60 ? '#f97316' : '#00f2ff'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="lg:col-span-4 intel-card p-8 rounded-3xl border border-intel-border flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-6 left-6">
            <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">General Strike Probability</h3>
          </div>
          
          <div className="relative w-48 h-48 mt-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
                strokeDasharray="502.4"
                strokeDashoffset="125.6"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="80"
                fill="none"
                stroke={strikeProb > 60 ? '#ef4444' : strikeProb > 35 ? '#f97316' : '#00f2ff'}
                strokeWidth="12"
                strokeDasharray="502.4"
                initial={{ strokeDashoffset: 502.4 }}
                animate={{ strokeDashoffset: 502.4 - (strikeProb / 100 * 376.8) }}
                transition={{ type: 'spring', damping: 20 }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className={cn(
                "text-4xl font-bold font-mono tracking-tighter",
                strikeProb > 60 ? 'text-intel-red' : strikeProb > 35 ? 'text-intel-orange' : 'text-intel-cyan'
              )}>
                {strikeProb}%
              </div>
              <div className="text-[8px] font-mono text-slate-500 uppercase mt-1 tracking-widest">Risk Level: HIGH</div>
            </div>
          </div>

          <div className="mt-8 w-full space-y-4">
            <div className="p-3 bg-intel-red/10 border border-intel-red/20 rounded-xl">
              <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Trigger Warning</div>
              <p className="text-[10px] text-slate-400 leading-tight italic">
                "Current wage arrear and sector coverage metrics most closely resemble January 1978 precursors."
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Wage Negotiation Table */}
        <div className="lg:col-span-7 intel-card p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Wage Negotiation Status</h3>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Real-time tracking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-intel-border">
                  <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sector</th>
                  <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Demand (TND)</th>
                  <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Offer (TND)</th>
                  <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Gap</th>
                  <th className="py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {wageNegotiations.map((row, i) => (
                  <tr key={i} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 text-xs font-bold text-white">{row.sector}</td>
                    <td className="py-4 text-xs font-mono text-slate-300">{row.demand.toLocaleString()}</td>
                    <td className="py-4 text-xs font-mono text-slate-300">{row.offer.toLocaleString()}</td>
                    <td className="py-4 text-xs font-mono text-intel-red">{row.gap.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[8px] font-mono px-2 py-1 rounded border uppercase inline-flex items-center",
                        row.status === 'DEADLOCKED' || row.status === 'STRIKE ACTIVE' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                        row.status === 'NEAR AGREEMENT' ? "bg-intel-green/10 text-intel-green border-intel-green/20" :
                        "bg-intel-orange/10 text-intel-orange border-intel-orange/20"
                      )}>
                        {row.status === 'STRIKE ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse mr-1.5" />}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contributing Factors & Trigger Conditions */}
        <div className="lg:col-span-5 space-y-8">
          {/* Contributing Factors Breakdown */}
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Contributing Factors Breakdown</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributingFactors} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="factor" 
                    type="category" 
                    stroke="#64748b" 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false}
                    width={120}
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                  />
                  <Bar dataKey="impact">
                    {contributingFactors.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'positive' ? '#ef4444' : '#22c55e'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trigger Conditions */}
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">General Strike Trigger Conditions</h4>
              <span className="px-2 py-0.5 bg-intel-red/10 text-intel-red border border-intel-red/20 rounded text-[8px] font-mono uppercase font-bold">64% Composite</span>
            </div>
            <div className="space-y-6">
              {triggerConditions.map((condition, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase">{condition.label}</span>
                    <span className="text-white font-bold">{condition.current}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-intel-red" 
                      initial={{ width: 0 }}
                      animate={{ width: `${condition.progress}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[8px] font-mono text-slate-600 uppercase">{condition.progress}% to trigger</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Context Box */}
      <div className="intel-card p-8 rounded-3xl border border-intel-border bg-gradient-to-br from-intel-card to-intel-red/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <FileText className="w-24 h-24 text-intel-red" />
        </div>
        
        <div className="flex items-start space-x-6">
          <div className="p-3 bg-intel-red/10 rounded-xl border border-intel-red/20">
            <ShieldAlert className="w-6 h-6 text-intel-red" />
          </div>
          <div className="space-y-6 flex-1">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Historical Context & Precursor Analysis</h4>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Reference Dossier: PID-UGTT-78-13</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-intel-red font-mono">JAN 1978: BLACK THURSDAY</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    General strike led to widespread civil unrest and military intervention. The regime's institutional foundation was fatally compromised, leading to collapse within 18 months.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-intel-red font-mono">FEB 2013: POST-REVOLUTION CRISIS</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    General strike attempt following political assassinations. Failed to achieve regime-change objectives due to elite fragmentation and lack of unified labor-opposition coordination.
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-black/40 rounded-2xl border border-intel-red/30 border-dashed space-y-4">
                <div className="flex items-center space-x-2 text-intel-red">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Analyst Warning</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono italic">
                  "Current wage arrear and sector coverage metrics most closely resemble January 1978 precursors. The decoupling of UGTT leadership from regime stability protocols suggests a high-probability shift toward total industrial paralysis by Q3 2026."
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-intel-red/20">
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Confidence Level</span>
                  <span className="text-[10px] font-bold text-intel-red font-mono">84%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
