import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Droplets, 
  Flame, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Battery,
  Wind,
  Sun,
  DollarSign,
  Globe,
  Terminal,
  Wifi,
  Radio
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Line,
  LineChart,
  Legend
} from 'recharts';
import { Map } from './Map';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

const energyAlerts = [
  { code: 'ENG-GRID-01', title: 'Grid Frequency Instability Detected', impact: 'CRITICAL' },
  { code: 'ENG-GAS-04', title: 'Pipeline Maintenance: Reduced Flow', impact: 'HIGH' },
  { code: 'ENG-RENEW-09', title: 'Solar Output Peak: 1.2GW', impact: 'GOOD' },
  { code: 'ENG-STORAGE-12', title: 'Strategic Reserves at 85%', impact: 'STABLE' },
  { code: 'ENG-SUBSIDY-02', title: 'Fiscal Pressure: Energy Subsidy Spike', impact: 'HIGH' }
];

const vulnerabilityPoints = [
  { lat: 31.5, lon: 9.2, intensity: 0.9, label: 'El Borma Oil Hub', risk: 'Physical Security' },
  { lat: 33.8, lon: 10.1, intensity: 0.7, label: 'Gabes Gas Terminal', risk: 'Cyber Threat' },
  { lat: 36.8, lon: 10.2, intensity: 0.8, label: 'STEG National Dispatch', risk: 'Cyber Threat' },
  { lat: 32.9, lon: 11.1, intensity: 0.85, label: 'Remada Pipeline Junction', risk: 'Conflict Proximity' },
  { lat: 34.4, lon: 8.8, intensity: 0.6, label: 'Mdhilla Power Station', risk: 'Physical Security' },
  { lat: 35.8, lon: 10.6, intensity: 0.5, label: 'Sousse Thermal Plant', risk: 'Cyber Threat' }
];

const energyMixData = [
  { name: 'Natural Gas', value: 67, color: '#00f2ff' },
  { name: 'Oil', value: 21, color: '#a855f7' },
  { name: 'Coal (Import)', value: 6, color: '#64748b' },
  { name: 'Renewables', value: 4, color: '#22c55e' },
  { name: 'Hydro', value: 2, color: '#38bdf8' }
];

const gasProductionData = [
  { year: '2018', val: 2100 },
  { year: '2019', val: 1950 },
  { year: '2020', val: 1800 },
  { year: '2021', val: 1650 },
  { year: '2022', val: 1500 },
  { year: '2023', val: 1400 },
  { year: '2024', val: 1300 },
  { year: '2025', val: 1245 }
];

const subsidyData = [
  { year: '2020', val: 1.2 },
  { year: '2021', val: 1.8 },
  { year: '2022', val: 2.9 },
  { year: '2023', val: 3.2 },
  { year: '2024', val: 3.5 },
  { year: '2025', val: 3.9 },
  { year: '2026e', val: 4.1 }
];

const powerCutData = [
  { region: 'Tunis', hours: 1.2 },
  { region: 'Sfax', hours: 2.5 },
  { region: 'Sousse', hours: 2.1 },
  { region: 'Gafsa', hours: 11.5 },
  { region: 'Kasserine', hours: 13.2 },
  { region: 'Sidi Bouzid', hours: 14.8 },
  { region: 'Tataouine', hours: 9.5 },
  { region: 'Kebili', hours: 8.2 }
];

export const EnergyIntelligence: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Energy Security & Strategic Infrastructure"
        subtitle="Monitoring grid stability, resource dependency, and transition dynamics"
        icon={Zap}
        nodeId="ENG-NODE-04"
      />

      <LiveTicker items={energyAlerts} />

      {/* Key Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
        {[
          { label: 'Energy Import Dependency', value: '62%', status: 'CRITICAL', icon: Droplets },
          { label: 'Gas Production Decline', value: '-40.7%', status: 'CRITICAL', icon: Flame },
          { label: 'STEG Annual Deficit', value: '1.2B TND', status: 'CRITICAL', icon: Zap },
          { label: 'Subsidy Cost 2026e', value: '4.1B TND', status: 'CRITICAL', icon: DollarSign },
        ].map((metric, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-intel-border relative overflow-hidden group">
            <CornerAccent position="tl" />
            <CornerAccent position="br" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-intel-cyan group-hover:scale-110 transition-transform duration-300">
                <metric.icon className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border text-intel-red border-intel-red/30 bg-intel-red/5">
                {metric.status}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{metric.label}</div>
              <div className="text-2xl font-bold text-white tracking-tight">{metric.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Infrastructure Vulnerability Map */}
      <div className="glass p-8 rounded-3xl border border-intel-border space-y-6 relative z-20">
        <CornerAccent position="tr" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Infrastructure Vulnerability Heatmap</h3>
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Strategic asset risk assessment</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse"></div>
              <span className="text-[10px] font-mono text-intel-red uppercase font-bold">Critical Monitoring</span>
            </div>
            <ShieldAlert className="w-5 h-5 text-intel-red" />
          </div>
        </div>
        <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/20">
          <Map 
            governorates={[]} 
            events={[]} 
            activeLayer="Energy" 
            heatmapPoints={vulnerabilityPoints}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            { title: 'Conflict Proximity', color: 'text-intel-red', desc: 'Southern assets (El Borma, Remada) at risk from regional instability.' },
            { title: 'Cyber Threat Level', color: 'text-intel-orange', desc: 'National dispatch centers showing increased scanning activity.' },
            { title: 'Physical Security', color: 'text-intel-cyan', desc: 'Coastal thermal plants monitored for potential sabotage.' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 group hover:border-white/20 transition-all">
              <div className={`text-[10px] font-bold ${item.color} uppercase tracking-widest flex items-center space-x-2`}>
                <div className={`w-1 h-1 rounded-full bg-current`}></div>
                <span>{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-20">
        {/* Energy Mix Pie Chart */}
        <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Energy Mix 2025</h3>
            <PieChartIcon className="w-5 h-5 text-intel-cyan" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={energyMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {energyMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {energyMixData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] text-slate-500 uppercase font-mono">{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gas Production Decline */}
        <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Gas Production</h3>
            <Flame className="w-5 h-5 text-intel-cyan" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gasProductionData}>
                <defs>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="val" stroke="#00f2ff" fillOpacity={1} fill="url(#colorGas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subsidy Cost Explosion */}
        <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Subsidy Cost</h3>
            <BarChart3 className="w-5 h-5 text-intel-cyan" />
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subsidyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                  {subsidyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === subsidyData.length - 1 ? '#ef4444' : index > 3 ? '#f97316' : '#22d3ee'} />
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
