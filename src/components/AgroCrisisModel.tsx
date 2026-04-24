import React from 'react';
import { motion } from 'motion/react';
import { 
  Wheat, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  Users, 
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { cn } from '../utils/cn';

interface BCEWMData {
  BCI: number;
  level: string;
  supply_stress: number;
  price_pressure: number;
  public_signal: number;
  velocity: number;
}

interface AgroCrisisModelProps {
  data: BCEWMData | null;
}

export const AgroCrisisModel: React.FC<AgroCrisisModelProps> = ({ data }) => {
  if (!data) return null;

  const radarData = [
    { subject: 'Supply Stress', A: data.supply_stress * 100, full: 100 },
    { subject: 'Price Pressure', A: data.price_pressure * 100, full: 100 },
    { subject: 'Public Signal', A: data.public_signal * 100, full: 100 },
  ];

  const componentsData = [
    { name: 'Supply', value: data.supply_stress * 100, color: '#ef4444' },
    { name: 'Price', value: data.price_pressure * 100, color: '#f59e0b' },
    { name: 'Public', value: data.public_signal * 100, color: '#00f2ff' },
  ];

  return (
    <div className="glass rounded-2xl border border-intel-border overflow-hidden flex flex-col h-full bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="px-6 py-4 border-b border-intel-border/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wheat className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">
            Bread Crisis Early Warning Model (BCEWM)
          </h3>
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
          data.level === 'CRISIS' ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
          data.level === 'HIGH_RISK' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        )}>
          {data.level}
        </div>
      </div>

      <div className="p-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Score & Radar */}
        <div className="space-y-6">
          <div className="flex items-end space-x-4">
            <div>
              <div className="text-4xl font-bold text-white font-mono tracking-tighter">
                {(data.BCI * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                Crisis Probability Index
              </div>
            </div>
            <div className="pb-1">
              <div className={cn(
                "flex items-center text-xs font-bold font-mono",
                data.velocity > 0 ? "text-red-400" : "text-emerald-400"
              )}>
                {data.velocity > 0 ? "+" : ""}{(data.velocity * 100).toFixed(1)}%
                <TrendingUp className={cn("w-3 h-3 ml-1", data.velocity < 0 && "rotate-180")} />
              </div>
              <div className="text-[8px] text-slate-600 uppercase tracking-tight">7-Day Velocity</div>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                />
                <Radar
                  name="Crisis Components"
                  dataKey="A"
                  stroke="#00f2ff"
                  fill="#00f2ff"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <h4 className="text-[9px] font-mono text-slate-400 uppercase mb-3 flex items-center">
              <Info className="w-3 h-3 mr-2" />
              Strategic Assessment
            </h4>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {data.BCI > 0.6 ? 
                "Critical supply-price decoupling detected. High probability of retail-level shortages in urban hubs within 14 days." :
                data.BCI > 0.4 ?
                "Moderate stress in the milling-distribution axis. Price volatility in unregulated flour derivatives is trending up." :
                "Supply chain stable. Sufficient strategic reserves for current consumption window."}
            </p>
          </div>
        </div>

        {/* Right: Breakdown Detail */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <BreakdownCard 
              icon={AlertTriangle} 
              label="Supply Stress" 
              value={data.supply_stress} 
              color="emerald" 
              detail="Wheat yields, imports & reserves"
            />
            <BreakdownCard 
              icon={ShoppingCart} 
              label="Price Pressure" 
              value={data.price_pressure} 
              color="amber" 
              detail="Inflation & black market premiums"
            />
            <BreakdownCard 
              icon={Users} 
              label="Public Signal" 
              value={data.public_signal} 
              color="cyan" 
              detail="Queue reports & SEI sentiment"
            />
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={componentsData}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                  {componentsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BreakdownCardProps {
  icon: any;
  label: string;
  value: number;
  color: 'emerald' | 'amber' | 'cyan' | 'red';
  detail: string;
}

const BreakdownCard: React.FC<BreakdownCardProps> = ({ icon: Icon, label, value, color, detail }) => (
  <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-white/10 transition-colors">
    <div className={cn(
      "p-2 rounded-lg",
      color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
      color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
      color === 'cyan' ? 'bg-cyan-500/10 text-cyan-400' :
      'bg-red-500/10 text-red-400'
    )}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-white/80">{label}</span>
        <span className="text-[10px] font-mono text-slate-400">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          className={cn(
            "h-full rounded-full",
            color === 'emerald' ? 'bg-emerald-500' :
            color === 'amber' ? 'bg-amber-500' :
            color === 'cyan' ? 'bg-cyan-500' :
            'bg-red-500'
          )}
        />
      </div>
      <div className="text-[8px] text-slate-600 mt-1 uppercase tracking-tighter">{detail}</div>
    </div>
  </div>
);
