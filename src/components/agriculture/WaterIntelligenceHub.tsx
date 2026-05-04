import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Waves, 
  Droplets, 
  CloudRain, 
  Activity, 
  Wind,
  ShieldCheck,
  TrendingDown,
  Info
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../../utils/cn';

interface WaterHubData {
  national_water_stress: number;
  water_crisis_govs: string[];
  aggregate_water_reserve?: number;
  evaporation_index?: number;
}

interface WaterIntelligenceHubProps {
  data: WaterHubData | null;
}

export const WaterIntelligenceHub: React.FC<WaterIntelligenceHubProps> = ({ data }) => {
  if (!data) return null;

  const reserveData = [
    { name: 'Active Storage', value: (1 - data.national_water_stress) * 100, color: '#00f2ff' },
    { name: 'Stress/Deficit', value: data.national_water_stress * 100, color: '#1e293b' },
  ];

  // Simulated desalination capacity vs demand
  const desalinationData = [
    { time: '08:00', capacity: 120, production: 110 },
    { time: '12:00', capacity: 120, production: 118 },
    { time: '16:00', capacity: 120, production: 115 },
    { time: '20:00', capacity: 120, production: 105 },
    { time: '00:00', capacity: 120, production: 95 },
    { time: '04:00', capacity: 120, production: 98 },
  ];

  return (
    <div className="glass rounded-2xl border border-intel-border overflow-hidden flex flex-col h-full bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="px-6 py-4 border-b border-intel-border/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Waves className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">
            Water Intelligence Hub (WIH)
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse" />
            <span className="text-[8px] font-mono text-slate-500 uppercase">Live Sensor Grid</span>
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Resource Allocation */}
        <div className="space-y-6">
          <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">National Reserve Profile</h4>
          <div className="relative h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reserveData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reserveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                   itemStyle={{ fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white font-mono">{( (1-data.national_water_stress) * 100).toFixed(1)}%</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-tighter">System Level</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Crisis Hubs" value={data.water_crisis_govs.length} color="text-red-400" />
            <MetricBox label="Annual Deficit" value="-312M m³" color="text-amber-400" />
          </div>
        </div>

        {/* Desalination Production */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Desalination Performance</h4>
            <span className="text-[8px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-mono uppercase">Optimal</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={desalinationData}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 150]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px', color: '#00f2ff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="production" 
                  stroke="#00f2ff" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorProd)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="capacity" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
             <ProgressBar label="Djerba Plant Load" value={0.92} color="cyan" />
             <ProgressBar label="Zarat Plant (Final Phase)" value={0.88} color="cyan" />
             <ProgressBar label="Sfax Plant (Baseline)" value={0.15} color="amber" />
          </div>
        </div>

        {/* Groundwater & Soil */}
        <div className="space-y-6">
          <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Groundwater Depletion Risk</h4>
          <div className="space-y-4">
            <RiskCard 
              label="Deep Aquifer (South)" 
              risk="CRITICAL" 
              trend="RECDING" 
              score={0.84} 
            />
            <RiskCard 
              label="Coastal Aquifer (Nabeul)" 
              risk="HIGH" 
              trend="STABLE" 
              score={0.62} 
            />
            <RiskCard 
              label="Central Basin" 
              risk="MODERATE" 
              trend="REC_EFF" 
              score={0.45} 
            />
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3">
            <Info className="w-3.5 h-3.5 text-intel-cyan mt-0.5 shrink-0" />
            <p className="text-[9px] text-slate-400 leading-relaxed italic">
              Groundwater levels are monitored via GRACE satellite anomalies combined with local borehole telemetry. Current extraction rate exceeds natural recharge by 18%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricBox: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => (
  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
    <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
    <div className="text-[8px] text-slate-600 uppercase tracking-widest">{label}</div>
  </div>
);

const ProgressBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-[9px] text-slate-400 uppercase">{label}</span>
      <span className="text-[9px] font-mono text-slate-500">{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full", color === 'cyan' ? 'bg-intel-cyan' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500')} 
        style={{ width: `${value * 100}%` }}
      />
    </div>
  </div>
);

const RiskCard: React.FC<{ label: string; risk: string; trend: string; score: number }> = ({ label, risk, trend, score }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
    <div className="space-y-1">
      <div className="text-[10px] font-medium text-white">{label}</div>
      <div className="flex items-center space-x-2">
        <span className={cn(
          "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase",
          risk === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          risk === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        )}>{risk}</span>
        <span className="text-[8px] font-mono text-slate-600 uppercase">{trend}</span>
      </div>
    </div>
    <div className="text-xl font-bold text-white/20 font-mono">
      {(score * 10).toFixed(1)}
    </div>
  </div>
);
