import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePipeline } from '../context/PipelineContext';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Users, 
  Lock, 
  Scale, 
  Zap, 
  DollarSign,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronRight,
  Flag,
  Handshake,
  Heart,
  Landmark,
  Target,
  Crosshair,
  Layers,
  Cpu,
  Terminal,
  Wifi,
  Radio,
  BarChart3
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
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { cn } from '../lib/utils';
import { 
  CornerAccent, 
  BackgroundGrid, 
  ModuleHeader, 
  LiveTicker 
} from './ProfessionalShared';

const actors = [
  { id: 'imf', name: 'IMF', color: '#3b82f6', icon: DollarSign, pressure: 85, dependency: 92, status: 'STALLED NEGOTIATION', region: 'Global', volatility: 'High' },
  { id: 'eu', name: 'European Union', color: '#1d4ed8', icon: Globe, pressure: 72, dependency: 88, status: 'STRATEGIC PARTNER', region: 'Europe', volatility: 'Medium' },
  { id: 'us', name: 'United States', color: '#ef4444', icon: Flag, pressure: 65, dependency: 45, status: 'SECURITY FOCUS', region: 'North America', volatility: 'Low' },
  { id: 'france', name: 'France', color: '#2563eb', icon: Landmark, pressure: 58, dependency: 76, status: 'HISTORICAL TIES', region: 'Europe', volatility: 'Medium' },
  { id: 'gulf', name: 'Gulf States', color: '#10b981', icon: Landmark, pressure: 42, dependency: 64, status: 'SELECTIVE ENGAGEMENT', region: 'Middle East', volatility: 'Low' },
  { id: 'china', name: 'China', color: '#dc2626', icon: Zap, pressure: 35, dependency: 52, status: 'INFRASTRUCTURE', region: 'Asia', volatility: 'Medium' },
  { id: 'wb', name: 'World Bank', color: '#0891b2', icon: Landmark, pressure: 68, dependency: 82, status: 'DEVELOPMENT', region: 'Global', volatility: 'Low' }
];

// Low score = high pressure on regime / misalignment
// High score = alignment with regime priorities
const alignmentData = [
  { 
    subject: 'Democracy', 
    imf: 65, eu: 25, us: 45, gulf: 90, china: 95, wb: 60, france: 40,
    weight: 0.8
  },
  { 
    subject: 'Migration Control', 
    imf: 70, eu: 85, us: 65, gulf: 75, china: 80, wb: 70, france: 90,
    weight: 0.9
  },
  { 
    subject: 'Economic Reform', 
    imf: 15, eu: 35, us: 40, gulf: 75, china: 80, wb: 20, france: 45,
    weight: 1.0
  },
  { 
    subject: 'Counter-terrorism', 
    imf: 70, eu: 80, us: 90, gulf: 85, china: 75, wb: 70, france: 88,
    weight: 0.7
  },
  { 
    subject: 'Press Freedom', 
    imf: 55, eu: 20, us: 35, gulf: 90, china: 95, wb: 50, france: 30,
    weight: 0.6
  },
  { 
    subject: 'Human Rights', 
    imf: 60, eu: 22, us: 40, gulf: 88, china: 92, wb: 55, france: 28,
    weight: 0.6
  },
  { 
    subject: 'Regional Stability', 
    imf: 65, eu: 70, us: 75, gulf: 80, china: 72, wb: 65, france: 72,
    weight: 0.9
  },
  { 
    subject: 'Energy Security', 
    imf: 55, eu: 85, us: 65, gulf: 88, china: 82, wb: 58, france: 88,
    weight: 0.8
  },
  { 
    subject: 'Debt Sustainability', 
    imf: 10, eu: 38, us: 45, gulf: 72, china: 65, wb: 15, france: 42,
    weight: 1.0
  },
  { 
    subject: 'Trade Relations', 
    imf: 55, eu: 88, us: 58, gulf: 78, china: 82, wb: 55, france: 90,
    weight: 0.7
  }
];

const strategicRisks = [
  { 
    id: 1, 
    title: 'IMF Funding Deadlock', 
    impact: 'CRITICAL', 
    probability: 'HIGH', 
    description: 'Failure to meet IMF conditions leading to sovereign default risk.',
    actors: ['IMF', 'World Bank'],
    trend: 'rising',
    code: 'RISK-IMF-01'
  },
  { 
    id: 2, 
    title: 'EU Migration Pressure', 
    impact: 'HIGH', 
    probability: 'VERY HIGH', 
    description: 'Increased pressure from EU to curb migration flows in exchange for aid.',
    actors: ['EU', 'France'],
    trend: 'stable',
    code: 'RISK-EU-04'
  },
  { 
    id: 3, 
    title: 'Gulf Investment Shift', 
    impact: 'MEDIUM', 
    probability: 'MEDIUM', 
    description: 'Potential redirection of Gulf investment towards regional competitors.',
    actors: ['Gulf States'],
    trend: 'falling',
    code: 'RISK-GCC-09'
  },
  { 
    id: 4, 
    title: 'China-Tunisia Infrastructure Deal Signed', 
    impact: 'HIGH', 
    probability: 'VERY HIGH', 
    description: 'Significant infrastructure investment impacting Economic Reform and Debt Sustainability.',
    actors: ['China'],
    trend: 'rising',
    code: 'RISK-CN-15'
  }
];

export const GeopoliticalIntelligence: React.FC = () => {
  const [selectedActor, setSelectedActor] = useState(actors[0]);
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);
  const { data } = usePipeline();

  const reserves = data.economy.fx_reserves; // 84 days
  const CRISIS_THRESHOLD = 60;  // days — IMF crisis level
  const WARNING_THRESHOLD = 90; // days — BCT warning level
  const SAFE_THRESHOLD = 120;   // days — comfortable level

  const runwayPct = Math.min(100, (reserves / SAFE_THRESHOLD) * 100);
  const daysToWarning = reserves - WARNING_THRESHOLD; // negative = already below
  const daysToCrisis = reserves - CRISIS_THRESHOLD;
  const status = reserves < CRISIS_THRESHOLD ? 'CRISIS' :
                 reserves < WARNING_THRESHOLD ? 'WARNING' : 'STABLE';
  const statusColor = status === 'CRISIS' ? '#ef4444' :
                      status === 'WARNING' ? '#f97316' : '#10b981';

  const stats = useMemo(() => [
    { label: 'IMF Deal Probability', value: `${data.geopolitical.imf_deal_probability}%`, trend: '+2.4%', status: data.geopolitical.imf_deal_probability < 30 ? 'critical' : 'warning', icon: Activity },
    { label: 'EU Partnership', value: data.geopolitical.eu_partnership_status, trend: '-1.2%', status: 'warning', icon: Shield },
    { label: 'External Debt', value: `${data.geopolitical.external_debt_2026}B`, trend: '+0.8%', status: 'normal', icon: Globe },
    { label: 'Risk Exposure', value: 'High', trend: 'Rising', status: 'critical', icon: AlertTriangle }
  ], [data.geopolitical]);

  // Data for the US actor stacked bar chart
  const usAlignmentData = useMemo(() => {
    const ct = alignmentData.find(d => d.subject === 'Counter-terrorism')?.us || 0;
    const rs = alignmentData.find(d => d.subject === 'Regional Stability')?.us || 0;
    return [
      {
        name: 'Security Focus',
        'Counter-terrorism': ct,
        'Regional Stability': rs
      }
    ];
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="External Influence & Alignment"
        subtitle="Strategic synchronization and cross-dimensional geopolitical analysis"
        icon={Globe}
        nodeId="GEOPOL-01"
      />

      {/* Treasury Runway Widget */}
      <div className={cn(
        "intel-card p-6 rounded-3xl border relative overflow-hidden z-20 transition-all",
        status === 'CRISIS' ? "border-intel-red/50 bg-intel-red/5 shadow-[0_0_30px_rgba(239,68,68,0.1)]" :
        status === 'WARNING' ? "border-intel-orange/50 bg-intel-orange/5 shadow-[0_0_30px_rgba(249,115,22,0.1)]" :
        "border-intel-border"
      )}>
        {status !== 'STABLE' && (
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-1 animate-pulse",
            status === 'CRISIS' ? "bg-intel-red" : "bg-intel-orange"
          )} />
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Section */}
          <div className="lg:col-span-3 space-y-1">
            <div className="flex items-baseline space-x-2">
              <span className={cn("text-5xl font-bold font-mono tracking-tighter", 
                status === 'CRISIS' ? "text-intel-red" : status === 'WARNING' ? "text-intel-orange" : "text-intel-green"
              )}>
                {reserves}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Days Import Cover</span>
            </div>
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
              BCT FX Reserves — {data.economy.last_updated}
            </div>
          </div>

          {/* Center Section: Progress Bar */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative h-6 bg-white/5 rounded-full border border-white/10 overflow-hidden">
              {/* Zone Markers */}
              <div className="absolute inset-0 flex">
                <div className="h-full border-r border-white/10" style={{ width: '50%' }} /> {/* 60/120 = 50% */}
                <div className="h-full border-r border-white/10" style={{ width: '25%' }} /> {/* 90/120 = 75% total */}
              </div>
              
              {/* Progress Fill */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${runwayPct}%` }}
                className="h-full transition-all duration-1000"
                style={{ 
                  backgroundColor: statusColor,
                  boxShadow: `0 0 20px ${statusColor}40`
                }}
              />

              {/* Current Position Marker */}
              <motion.div 
                initial={{ left: 0 }}
                animate={{ left: `${runwayPct}%` }}
                className="absolute top-0 bottom-0 w-[2px] bg-white z-10 -translate-x-1/2"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]" />
              </motion.div>
            </div>

            <div className="flex justify-between text-[8px] font-mono font-bold uppercase tracking-tighter">
              <div className="flex flex-col items-start">
                <span className="text-intel-red">60 CRISIS</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-intel-orange">90 WARNING</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-intel-green">120 SAFE</span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="lg:col-span-3 flex flex-col items-end space-y-2">
            <div className={cn(
              "px-3 py-1 rounded border text-[10px] font-mono font-bold",
              status === 'CRISIS' ? "bg-intel-red/20 border-intel-red/30 text-intel-red" :
              status === 'WARNING' ? "bg-intel-orange/20 border-intel-orange/30 text-intel-orange" :
              "bg-intel-green/20 border-intel-green/30 text-intel-green"
            )}>
              {status}
            </div>
            <div className="text-right space-y-1">
              {reserves < 90 && (
                <div className="text-[9px] font-mono text-intel-orange font-bold uppercase">
                  ⚠ {Math.abs(daysToWarning)} days below warning threshold
                </div>
              )}
              {reserves < 60 && (
                <div className="text-[10px] font-mono text-intel-red font-bold uppercase animate-pulse">
                  🔴 SOVEREIGN DEFAULT RISK
                </div>
              )}
              <div className="text-[8px] font-mono text-slate-500 uppercase">
                BCT · Push update via Pipeline
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Markers */}
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            AT CURRENT RATE: Crisis in ~{Math.round((reserves-60)/1.2)} days
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'economy' }}))}
              className="text-[8px] font-mono text-intel-cyan underline cursor-pointer"
            >
              → Economy Impact
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'political', subTab: 'freedom' }}))}
              className="text-[8px] font-mono text-intel-cyan underline cursor-pointer"
            >
              → Freedom Index
            </button>
          </div>
        </div>
      </div>

      <LiveTicker items={strategicRisks} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-intel-border relative overflow-hidden group hover:border-intel-cyan/30 transition-all">
            <CornerAccent position="tl" />
            <CornerAccent position="br" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-intel-cyan group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                stat.status === 'critical' ? 'text-intel-red border-intel-red/30 bg-intel-red/5' : 
                stat.status === 'warning' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/5' : 
                'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5'
              }`}>
                {stat.status.toUpperCase()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</div>
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className={`text-[10px] font-mono flex items-center space-x-1 ${
                  stat.trend.startsWith('+') || stat.trend === 'Rising' ? 'text-intel-red' : 'text-intel-green'
                }`}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{stat.trend}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
        {/* Main Analysis Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass p-8 rounded-3xl border border-intel-border relative overflow-hidden">
            <CornerAccent position="tl" />
            <CornerAccent position="br" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-3">
                  <Target className="w-6 h-6 text-intel-cyan" />
                  <span>Actor Alignment Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">Cross-dimensional strategic synchronization</p>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end">
                {actors.map(actor => (
                  <button
                    key={actor.id}
                    onClick={() => setSelectedActor(actor)}
                    className={`px-4 py-2 rounded-xl border text-[10px] font-bold transition-all flex items-center space-x-2 group ${
                      selectedActor.id === actor.id 
                        ? 'border-intel-cyan bg-intel-cyan/10 text-intel-cyan shadow-[0_0_20px_rgba(0,242,255,0.15)]' 
                        : 'border-white/10 bg-white/5 text-slate-500 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <actor.icon className={`w-3 h-3 transition-transform group-hover:scale-110`} style={{ color: selectedActor.id === actor.id ? actor.color : undefined }} />
                    <span>{actor.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="h-[400px] relative group">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <Crosshair className="w-64 h-64 text-intel-cyan/20 animate-spin-slow" />
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={alignmentData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600, letterSpacing: '0.05em' }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name={selectedActor.name}
                      dataKey={selectedActor.id}
                      stroke={selectedActor.color}
                      fill={selectedActor.color}
                      fillOpacity={0.2}
                      strokeWidth={2}
                      animationDuration={1000}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid rgba(0,242,255,0.2)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(10px)'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Score interpretation: Lower = more pressure on Saied regime. Higher = alignment with regime's strategic priorities.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-intel-cyan/5 to-transparent pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                        <selectedActor.icon className="w-6 h-6" style={{ color: selectedActor.color }} />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white tracking-tight">{selectedActor.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">{selectedActor.region} // VOLATILITY: {selectedActor.volatility}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-intel-cyan bg-intel-cyan/10 px-3 py-1 rounded border border-intel-cyan/20 animate-pulse">
                        {selectedActor.status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        <span>Pressure</span>
                        <span className="text-intel-red">{selectedActor.pressure}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedActor.pressure}%` }}
                          className="h-full bg-intel-red shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        <span>Dependency</span>
                        <span className="text-intel-cyan">{selectedActor.dependency}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedActor.dependency}%` }}
                          className="h-full bg-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* US Specific Stacked Bar Chart */}
                {selectedActor.id === 'us' && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-intel-cyan/20 space-y-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-intel-cyan" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Security Alignment Metrics</h4>
                    </div>
                    <div className="h-[120px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={usAlignmentData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" hide />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px', fontSize: '10px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'monospace' }} />
                          <Bar dataKey="Counter-terrorism" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
                          <Bar dataKey="Regional Stability" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest px-1 flex items-center justify-between">
                    <span>Critical Dimensions</span>
                    <Cpu className="w-3 h-3 opacity-30" />
                  </div>
                  <div className="space-y-2">
                    {alignmentData.filter(d => d.weight >= 0.9).map(dim => {
                      const val = (dim as any)[selectedActor.id];
                      return (
                        <div key={dim.subject} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-intel-cyan/20 hover:bg-white/10 transition-all group cursor-default">
                          <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors uppercase font-mono tracking-tight">{dim.subject}</span>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-intel-cyan transition-all duration-1000 shadow-[0_0_8px_rgba(0,242,255,0.4)]" style={{ width: `${val}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-white w-8 text-right font-bold">{val}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dependency Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-3xl border border-intel-border relative overflow-hidden">
              <CornerAccent position="tl" />
              <h4 className="text-sm font-bold text-white mb-6 flex items-center space-x-3">
                <Layers className="w-5 h-5 text-intel-cyan" />
                <span className="uppercase tracking-widest">Dependency Vectors</span>
              </h4>
              <div className="space-y-6">
                {[
                  { label: 'Financial Liquidity', value: 88, color: '#ef4444' },
                  { label: 'Security Infrastructure', value: 42, color: '#10b981' },
                  { label: 'Energy Supply Chain', value: 65, color: '#f59e0b' },
                  { label: 'Trade Volume', value: 74, color: '#06b6d4' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <span>{item.label}</span>
                      <span className="text-white font-mono">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        className="h-full"
                        style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}40` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border border-intel-border relative overflow-hidden">
              <CornerAccent position="tr" />
              <h4 className="text-sm font-bold text-white mb-6 flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-intel-cyan" />
                <span className="uppercase tracking-widest">Alignment Trend (30D)</span>
              </h4>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { day: 1, val: 45 }, { day: 5, val: 48 }, { day: 10, val: 42 },
                    { day: 15, val: 55 }, { day: 20, val: 52 }, { day: 25, val: 58 },
                    { day: 30, val: 62 }
                  ]}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Area type="monotone" dataKey="val" stroke="#00f2ff" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px', fontSize: '10px' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Risks & Events */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-3xl border border-intel-border space-y-8 relative overflow-hidden">
            <CornerAccent position="tr" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-intel-red" />
                <span className="uppercase tracking-tight">Strategic Risks</span>
              </h3>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-intel-red/10 border border-intel-red/20 text-[9px] font-mono text-intel-red font-bold">
                <div className="w-1.5 h-1.5 bg-intel-red rounded-full animate-pulse" />
                <span>LIVE FEED</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
              {strategicRisks.map(risk => (
                <motion.div 
                  key={risk.id} 
                  whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  className="p-5 rounded-2xl bg-white/5 border border-intel-border hover:border-intel-cyan/30 transition-all group relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    risk.impact === 'CRITICAL' ? 'bg-intel-red' : risk.impact === 'HIGH' ? 'bg-intel-orange' : 'bg-intel-cyan'
                  }`} />
                  
                  <div className="flex items-start justify-between mb-3 pl-2">
                    <div className="space-y-1">
                      <div className="text-[8px] font-mono text-slate-500 font-bold tracking-widest">{risk.code}</div>
                      <h4 className="text-sm font-bold text-white group-hover:text-intel-cyan transition-colors uppercase tracking-tight leading-tight">{risk.title}</h4>
                    </div>
                    {risk.trend === 'rising' ? <ArrowUpRight className="w-4 h-4 text-intel-red" /> : <ArrowDownRight className="w-4 h-4 text-intel-green" />}
                  </div>
                  
                  <p className="text-[11px] text-slate-400 mb-5 leading-relaxed pl-2 font-sans uppercase tracking-tight">{risk.description}</p>
                  
                  <div className="flex items-center justify-between pl-2 border-t border-white/5 pt-4">
                    <div className="flex -space-x-2">
                      {risk.actors.map(a => {
                        const actor = actors.find(act => act.name === a || act.id === a.toLowerCase());
                        return (
                          <div key={a} className="w-8 h-8 rounded-full bg-intel-bg border border-white/10 flex items-center justify-center shadow-lg hover:z-10 transition-all group/actor" title={a}>
                            {actor ? <actor.icon className="w-4 h-4" style={{ color: actor.color }} /> : <Globe className="w-4 h-4 text-slate-500" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Probability</div>
                      <div className="text-[10px] font-mono text-white font-bold">{risk.probability}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em] flex items-center justify-center space-x-3 group">
              <Terminal className="w-4 h-4 group-hover:text-intel-cyan" />
              <span>Access Intelligence Logs</span>
            </button>
          </div>

          {/* Active Tension Alert */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedActor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 rounded-3xl border border-intel-red/20 bg-intel-red/5 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <AlertTriangle className="w-16 h-16 text-intel-red" />
              </div>
              <div className="flex items-center space-x-3 text-intel-red">
                <Zap className="w-6 h-6 animate-pulse" />
                <h4 className="text-sm font-bold uppercase tracking-[0.2em]">Tension Advisory</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic relative z-10 font-sans uppercase tracking-tight">
                {selectedActor.id === 'imf' ? '"Structural reform demands creating significant friction with domestic social policy. Negotiations entering critical phase. Default risk elevated."' : 
                 selectedActor.id === 'eu' ? '"Migration control expectations are straining diplomatic relations. Human rights alignment under review by EU commission. Aid packages conditional."' :
                 selectedActor.id === 'us' ? '"Security cooperation remains robust, but democratic backsliding concerns are impacting non-military aid packages. Monitoring legislative shifts."' :
                 '"Strategic interests are diverging from current administration priorities. Monitoring for potential shift in investment focus and regional realignment."'}
              </p>
              <div className="pt-4 flex items-center justify-between border-t border-intel-red/10">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-intel-red rounded-full animate-ping" />
                  <span className="text-[10px] text-intel-red/60 font-mono font-bold">SOURCE: SIGINT-DELTA-9</span>
                </div>
                <button className="text-[10px] text-white hover:text-intel-cyan uppercase font-bold transition-colors tracking-widest">Full Briefing</button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
