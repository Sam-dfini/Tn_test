import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Smile, 
  Frown, 
  Flame, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ShieldAlert,
  HeartPulse,
  Brain,
  ShieldCheck,
  HeartOff,
  Home,
  Baby,
  Syringe,
  Pill,
  Skull,
  LayoutGrid,
  Search
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
  ComposedChart,
  Line,
  LineChart,
  Legend
} from 'recharts';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

type SubTab = 'cohesion' | 'family' | 'narcotics';

const socialAlerts = [
  { code: 'SOC-RAGE-01', title: 'Youth Rage Index at Critical Peak', impact: 'CRITICAL' },
  { code: 'SOC-DIV-09', title: 'Divorce Rate Surpasses 22% Threshold', impact: 'HIGH' },
  { code: 'SOC-DRUG-02', title: 'New Synthetic Molecule Detected', impact: 'CRITICAL' }
];

const socialIndicators = [
  { label: 'Happiness Index', value: '4.2/10', trend: 'Lowest in 15 years', status: 'CRITICAL', icon: Smile, color: 'text-intel-red', history: [5.8, 5.2, 4.8, 4.5, 4.2] },
  { label: 'Youth Rage Index', value: '8.5/10', trend: 'Rising in interior hubs', status: 'CRITICAL', icon: Flame, color: 'text-intel-red', history: [6.2, 6.8, 7.5, 8.0, 8.5] },
  { label: 'Population Pressure', value: '7.2/10', trend: 'Urban density at peak', status: 'WARNING', icon: Users, color: 'text-intel-orange', history: [6.5, 6.8, 7.0, 7.1, 7.2] },
  { label: 'Suicide Rate', value: '12.4', trend: 'Per 100k inhabitants', status: 'CRITICAL', icon: HeartPulse, color: 'text-intel-red', history: [9.2, 10.5, 11.2, 11.8, 12.4] },
  { label: 'Mental Health Stress', value: '68%', trend: 'Surveyed population', status: 'CRITICAL', icon: Brain, color: 'text-intel-red', history: [45, 52, 58, 62, 68] },
  { label: 'Street Signal S(t)', value: '0.78', trend: 'Protest probability: HIGH', status: 'CRITICAL', icon: Activity, color: 'text-intel-red', history: [0.45, 0.55, 0.62, 0.72, 0.78] },
  { label: 'Social Cohesion', value: 'LOW', trend: 'Trust in institutions < 15%', status: 'CRITICAL', icon: ShieldAlert, color: 'text-intel-red', history: [35, 28, 22, 18, 15] },
];

const streetSignalData = [
  { time: '08:00', signal: 0.65, threshold: 0.75 },
  { time: '10:00', signal: 0.68, threshold: 0.75 },
  { time: '12:00', signal: 0.72, threshold: 0.75 },
  { time: '14:00', signal: 0.78, threshold: 0.75 },
  { time: '16:00', signal: 0.82, threshold: 0.75 },
  { time: '18:00', signal: 0.79, threshold: 0.75 },
  { time: '20:00', signal: 0.75, threshold: 0.75 }
];

const roadAccidentData = [
  { month: 'OCT', accidents: 420, fatalities: 85, injuries: 620 },
  { month: 'NOV', accidents: 450, fatalities: 92, injuries: 680 },
  { month: 'DEC', accidents: 510, fatalities: 110, injuries: 750 },
  { month: 'JAN', accidents: 380, fatalities: 78, injuries: 590 },
  { month: 'FEB', accidents: 410, fatalities: 82, injuries: 610 },
  { month: 'MAR', accidents: 440, fatalities: 88, injuries: 640 }
];

const accidentCauses = [
  { name: 'Speeding', value: 35, color: '#ef4444' },
  { name: 'Inattention', value: 25, color: '#f59e0b' },
  { name: 'Infrastructure', value: 20, color: '#0ea5e9' },
  { name: 'Mechanical', value: 10, color: '#6366f1' },
  { name: 'Other', value: 10, color: '#94a3b8' }
];

const divorceRateData = [
  { year: '2015', rate: 12.4, marriages: 110000, divorces: 13600 },
  { year: '2018', rate: 14.8, marriages: 105000, divorces: 15500 },
  { year: '2021', rate: 16.2, marriages: 98000, divorces: 15800 },
  { year: '2023', rate: 18.5, marriages: 92000, divorces: 17000 },
  { year: '2024', rate: 20.4, marriages: 88000, divorces: 17950 },
  { year: '2025', rate: 22.1, marriages: 85000, divorces: 18780 }
];

const familyDynamicsData = [
  { category: 'Single Parent HH', value: 14.2, trend: '+2.1', status: 'WARNING' },
  { category: 'Delayed Marriage', value: 32.4, trend: '+4.5', status: 'WARNING' },
  { category: 'Domestic Friction', value: 42.8, trend: '+12.4', status: 'CRITICAL' },
  { category: 'Youth Independence', value: 18.5, trend: '-5.2', status: 'CRITICAL' }
];

const divorceByRegion = [
  { region: 'Greater Tunis', rate: 28.4, economicStress: 7.2 },
  { region: 'Coastal East', rate: 24.2, economicStress: 6.5 },
  { region: 'North West', rate: 18.5, economicStress: 8.4 },
  { region: 'Central West', rate: 16.8, economicStress: 9.1 },
  { region: 'South East', rate: 14.2, economicStress: 7.8 },
  { region: 'South West', rate: 12.5, economicStress: 8.2 }
];

const drugConsumptionData = [
  { name: 'Cannabis (Zatla)', value: 65, color: '#22c55e', description: 'Most prevalent, widespread among youth.' },
  { name: 'Psychotropic Pills', value: 22, color: '#f59e0b', description: 'Rising abuse of prescription meds (Parkizol, etc).' },
  { name: 'Cocaine', value: 8, color: '#0ea5e9', description: 'Increasing availability in urban nightlife hubs.' },
  { name: 'Heroin/Injectables', value: 3, color: '#ef4444', description: 'High-risk, concentrated in specific urban pockets.' },
  { name: 'Synthetic/New', value: 2, color: '#a855f7', description: 'Emerging chemical variants, difficult to track.' }
];

const drugArrestTrends = [
  { month: 'OCT', users: 850, dealers: 120 },
  { month: 'NOV', users: 920, dealers: 145 },
  { month: 'DEC', users: 1100, dealers: 180 },
  { month: 'JAN', users: 880, dealers: 130 },
  { month: 'FEB', users: 950, dealers: 155 },
  { month: 'MAR', users: 1050, dealers: 190 }
];

const rehabMetrics = [
  { category: 'Public Rehab Beds', current: 120, required: 850, status: 'CRITICAL' },
  { category: 'NGO Support Centers', current: 15, required: 45, status: 'WARNING' },
  { category: 'Relapse Rate (12m)', current: 72, required: 30, status: 'CRITICAL' },
  { category: 'Youth Outreach', current: 25, required: 100, status: 'WARNING' }
];

export const SocialIntelligence: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Intelligence', icon: LayoutGrid },
    { id: 'COHESION', label: 'Social Cohesion', icon: Activity },
    { id: 'FAMILY', label: 'Family Dynamics', icon: Users },
    { id: 'HEALTH', label: 'Public Health', icon: HeartPulse },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-intel-cyan uppercase tracking-[0.3em]">Social Intelligence Module</div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Social Cohesion & Migration Dynamics</h2>
          <p className="text-slate-500 text-sm max-w-2xl">
            Real-time monitoring of social friction, psychological stress, and migration flows. Direct linkage to Street Signal S(t) for protest prediction.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-intel-red/10 border border-intel-red/20 rounded-xl flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse"></div>
            <span className="text-[10px] font-mono text-intel-red font-bold uppercase tracking-widest">Social Unrest Risk: CRITICAL</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-intel-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              <cat.icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-intel-cyan transition-colors" />
          <input 
            type="text" 
            placeholder="SEARCH SOCIAL DATABASE..." 
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-intel-cyan/50 focus:ring-1 focus:ring-intel-cyan/20 w-full md:w-64 transition-all"
          />
        </div>
      </div>

      <LiveTicker items={socialAlerts} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* CATEGORY 1: PUBLIC SENTIMENT & SOCIAL STABILITY */}
          {(activeCategory === 'ALL' || activeCategory === 'COHESION') && (
            <div className="space-y-6 relative z-20">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
                <Activity className="w-4 h-4 text-intel-cyan" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Public Sentiment & Social Stability</h3>
              </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialIndicators.filter(ind => ['Happiness Index', 'Youth Rage Index', 'Street Signal S(t)', 'Social Cohesion'].includes(ind.label)).map((ind, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              className="glass p-5 rounded-2xl border border-intel-border space-y-3 group hover:border-intel-cyan/30 transition-all relative overflow-hidden h-40 flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <ind.icon className={`w-4 h-4 ${ind.color} group-hover:text-intel-cyan transition-colors`} />
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    ind.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                  }`}>
                    {ind.status}
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="text-2xl font-bold text-white font-mono tracking-tighter">{ind.value}</div>
                  <div className="text-[10px] font-mono text-slate-300 uppercase tracking-tight">{ind.label}</div>
                </div>
              </div>

              <div className="h-10 w-full mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ind.history.map((v, idx) => ({ v, idx }))}>
                    <Line 
                      type="monotone" 
                      dataKey="v" 
                      stroke={ind.status === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-[9px] text-slate-500 font-mono italic relative z-10">{ind.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* Street Signal S(t) */}
        <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between border-b border-intel-border pb-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-intel-red" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Street Signal S(t)</h3>
                <p className="text-[10px] text-slate-500 uppercase">Protest Probability Index - Real-time</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-intel-red font-mono">0.78</div>
              <div className="text-[8px] font-mono text-slate-500 uppercase">Threshold: 0.75</div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={streetSignalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis domain={[0, 1]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="signal" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="threshold" stroke="#64748b" strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            S(t) is calculated from social media sentiment, price stress, and localized youth unemployment spikes. Current level (0.78) indicates a high probability of spontaneous protests in the next 24-48 hours.
          </p>
        </div>

        {/* Risk Dossiers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            { 
              title: 'Youth Rage & Radicalization', 
              risk: 'CRITICAL', 
              color: 'text-intel-red', 
              desc: 'Youth unemployment in interior regions (Gafsa, Kasserine) exceeds 40%. This demographic is highly susceptible to both political radicalization and irregular migration. Social media monitoring shows a 300% increase in "rage" keywords since JAN 2026.' 
            },
            { 
              title: 'Social Cohesion Erosion', 
              risk: 'HIGH', 
              color: 'text-intel-orange', 
              desc: 'Trust in public institutions has reached an all-time low (< 15%). Polarization between urban coastal elites and rural interior populations is widening, creating fertile ground for populist movements and civil disobedience.' 
            }
          ].map((dossier, i) => (
            <div key={i} className="glass p-6 rounded-2xl border border-intel-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldAlert className={`w-5 h-5 ${dossier.color}`} />
                  <span className="text-sm font-bold text-white uppercase tracking-widest">{dossier.title}</span>
                </div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  dossier.risk === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                }`}>
                  {dossier.risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {dossier.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

          {/* CATEGORY 2: FAMILY & DEMOGRAPHICS */}
          {(activeCategory === 'ALL' || activeCategory === 'FAMILY') && (
            <div className="space-y-6 relative z-20">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
                <Users className="w-4 h-4 text-intel-cyan" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Family & Demographics</h3>
              </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialIndicators.filter(ind => ['Population Pressure'].includes(ind.label)).map((ind, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              className="glass p-5 rounded-2xl border border-intel-border space-y-3 group hover:border-intel-cyan/30 transition-all relative overflow-hidden h-40 flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <ind.icon className={`w-4 h-4 ${ind.color} group-hover:text-intel-cyan transition-colors`} />
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    ind.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                  }`}>
                    {ind.status}
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="text-2xl font-bold text-white font-mono tracking-tighter">{ind.value}</div>
                  <div className="text-[10px] font-mono text-slate-300 uppercase tracking-tight">{ind.label}</div>
                </div>
              </div>

              <div className="h-10 w-full mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ind.history.map((v, idx) => ({ v, idx }))}>
                    <Line 
                      type="monotone" 
                      dataKey="v" 
                      stroke={ind.status === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-[9px] text-slate-500 font-mono italic relative z-10">{ind.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* Divorce & Family Dynamics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Divorce Trends */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">National Divorce Trends</h4>
                <p className="text-[10px] text-slate-500 uppercase">Annual Divorce Rate vs Total Cases</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Rate %</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Cases</span>
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={divorceRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="rate" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth={3} name="Divorce Rate %" />
                  <Bar yAxisId="right" dataKey="divorces" fill="#00f2ff" fillOpacity={0.4} radius={[4, 4, 0, 0]} name="Total Divorces" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl flex items-start space-x-3">
              <AlertTriangle className="w-4 h-4 text-intel-red mt-0.5" />
              <p className="text-[9px] text-slate-400 leading-relaxed">
                <span className="text-white font-bold uppercase">Intelligence Alert:</span> The divorce rate has surpassed 22% in 2025, a 78% increase over the last decade. Economic stress and shifting social norms are primary drivers.
              </p>
            </div>
          </div>

          {/* Regional Breakdown & Family Stats */}
          <div className="glass p-8 rounded-3xl border border-intel-border space-y-8">
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-white uppercase tracking-tight border-b border-intel-border pb-4">Regional Breakdown</h4>
              <div className="space-y-4">
                {divorceByRegion.map((region, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                      <span className="text-slate-400">{region.region}</span>
                      <span className="text-white font-bold">{region.rate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-intel-red" style={{ width: `${region.rate}%` }}></div>
                      <div className="h-full bg-intel-cyan/30" style={{ width: `${region.economicStress * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                <Home className="w-4 h-4 text-intel-cyan" />
                <span>Family Dynamics</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {familyDynamicsData.map((stat, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-intel-border flex flex-col justify-between">
                    <span className="text-[8px] font-mono text-slate-500 uppercase mb-1">{stat.category}</span>
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-bold text-white">{stat.value}%</span>
                      <span className={`text-[8px] font-mono ${stat.trend.startsWith('+') ? 'text-intel-red' : 'text-intel-green'}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl space-y-2">
              <div className="flex items-center space-x-2">
                <Baby className="w-4 h-4 text-intel-cyan" />
                <span className="text-[10px] font-bold text-white uppercase">Birth Rate Impact</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight">
                Declining marriage rates and increasing divorce frequency have led to a 1.8% annual drop in birth rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

          {/* CATEGORY 3: PUBLIC HEALTH & RISKS */}
          {(activeCategory === 'ALL' || activeCategory === 'HEALTH') && (
            <div className="space-y-6 relative z-20">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
                <HeartPulse className="w-4 h-4 text-intel-red" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Public Health & Risks</h3>
              </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialIndicators.filter(ind => ['Suicide Rate', 'Mental Health Stress'].includes(ind.label)).map((ind, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              className="glass p-5 rounded-2xl border border-intel-border space-y-3 group hover:border-intel-cyan/30 transition-all relative overflow-hidden h-40 flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <ind.icon className={`w-4 h-4 ${ind.color} group-hover:text-intel-cyan transition-colors`} />
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    ind.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                  }`}>
                    {ind.status}
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="text-2xl font-bold text-white font-mono tracking-tighter">{ind.value}</div>
                  <div className="text-[10px] font-mono text-slate-300 uppercase tracking-tight">{ind.label}</div>
                </div>
              </div>

              <div className="h-10 w-full mt-2 opacity-30 group-hover:opacity-60 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ind.history.map((v, idx) => ({ v, idx }))}>
                    <Line 
                      type="monotone" 
                      dataKey="v" 
                      stroke={ind.status === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-[9px] text-slate-500 font-mono italic relative z-10">{ind.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* Narcotics Intelligence Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Consumption Breakdown */}
          <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
            <h4 className="text-lg font-bold text-white uppercase tracking-tight flex items-center space-x-2">
              <Pill className="w-5 h-5 text-intel-cyan" />
              <span>Consumption Profile</span>
            </h4>
            <div className="space-y-6">
              {drugConsumptionData.map((drug, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{drug.name}</span>
                    <span className="text-xs font-bold text-white">{drug.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${drug.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full" 
                      style={{ backgroundColor: drug.color }}
                    ></motion.div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrest Trends */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight">Law Enforcement Activity</h4>
                <p className="text-[10px] text-slate-500 uppercase">Monthly Drug-Related Arrests (Users vs Dealers)</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Dealers</span>
                </div>
              </div>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drugArrestTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="users" fill="#f97316" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="User Arrests" />
                  <Bar dataKey="dealers" fill="#ef4444" radius={[4, 4, 0, 0]} name="Dealer Arrests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rehab Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rehabMetrics.map((metric, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-intel-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{metric.category}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  metric.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                }`}>
                  {metric.status}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-white font-mono">{metric.current}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Target: {metric.required}</div>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.status === 'CRITICAL' ? 'bg-intel-red' : 'bg-intel-orange'}`} 
                    style={{ width: `${Math.min(100, (metric.current / metric.required) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
