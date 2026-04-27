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
  BarChart3,
  Calendar,
  Clock
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
  { id: 'italy', name: 'Italy', color: '#16a34a', icon: Handshake, pressure: 45, dependency: 78, status: 'PRIMARY ADVOCATE', region: 'Europe', volatility: 'Medium' },
  { id: 'algeria', name: 'Algeria', color: '#059669', icon: Shield, pressure: 30, dependency: 85, status: 'STRATEGIC ALLY', region: 'North Africa', volatility: 'Low' },
  { id: 'gulf', name: 'Gulf States', color: '#10b981', icon: Landmark, pressure: 42, dependency: 64, status: 'SELECTIVE ENGAGEMENT', region: 'Middle East', volatility: 'Low' },
  { id: 'china', name: 'China', color: '#dc2626', icon: Zap, pressure: 35, dependency: 52, status: 'INFRASTRUCTURE', region: 'Asia', volatility: 'Medium' },
  { id: 'wb', name: 'World Bank', color: '#0891b2', icon: Landmark, pressure: 68, dependency: 82, status: 'DEVELOPMENT', region: 'Global', volatility: 'Low' }
];

// Low score = high pressure on regime / misalignment
// High score = alignment with regime priorities
const alignmentData = [
  { 
    subject: 'Democracy', 
    imf: 65, eu: 25, us: 45, gulf: 90, china: 95, wb: 60, france: 40, algeria: 92, italy: 35,
    weight: 0.8
  },
  { 
    subject: 'Migration Control', 
    imf: 70, eu: 85, us: 65, gulf: 75, china: 80, wb: 70, france: 90, algeria: 88, italy: 95,
    weight: 0.9
  },
  { 
    subject: 'Economic Reform', 
    imf: 15, eu: 35, us: 40, gulf: 75, china: 80, wb: 20, france: 45, algeria: 82, italy: 40,
    weight: 1.0
  },
  { 
    subject: 'Counter-terrorism', 
    imf: 70, eu: 80, us: 90, gulf: 85, china: 75, wb: 70, france: 88, algeria: 95, italy: 85,
    weight: 0.7
  },
  { 
    subject: 'Press Freedom', 
    imf: 55, eu: 20, us: 35, gulf: 90, china: 95, wb: 50, france: 30, algeria: 90, italy: 25,
    weight: 0.6
  },
  { 
    subject: 'Human Rights', 
    imf: 60, eu: 22, us: 40, gulf: 88, china: 92, wb: 55, france: 28, algeria: 85, italy: 22,
    weight: 0.6
  },
  { 
    subject: 'Regional Stability', 
    imf: 65, eu: 70, us: 75, gulf: 80, china: 72, wb: 65, france: 72, algeria: 90, italy: 85,
    weight: 0.9
  },
  { 
    subject: 'Energy Security', 
    imf: 55, eu: 85, us: 65, gulf: 88, china: 82, wb: 58, france: 88, algeria: 98, italy: 92,
    weight: 0.8
  },
  { 
    subject: 'Debt Sustainability', 
    imf: 10, eu: 38, us: 45, gulf: 72, china: 65, wb: 15, france: 42, algeria: 75, italy: 45,
    weight: 1.0
  },
  { 
    subject: 'Trade Relations', 
    imf: 55, eu: 88, us: 58, gulf: 78, china: 82, wb: 55, france: 90, algeria: 85, italy: 95,
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
    actors: ['EU', 'France', 'Italy'],
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
  },
  { 
    id: 5, 
    title: 'Maghreb Energy Corridor', 
    impact: 'HIGH', 
    probability: 'HIGH', 
    description: 'Deepening energy integration with Algeria and Italy strengthening regional leverage.',
    actors: ['Algeria', 'Italy'],
    trend: 'rising',
    code: 'RISK-MED-07'
  }
];

export const GeopoliticalIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'diplomacy' | 'regional'>('overview');
  const [selectedActor, setSelectedActor] = useState(actors[0]);
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);
  const { data, updateField } = usePipeline();
  
  const natoScores = data.geopolitical.nato_alignment || {
    imf: 45, eu: 92, us: 100, france: 95, gulf: 65, china: 15, wb: 40, algeria: 78, italy: 94
  };

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
    <div className="p-4 md:p-8 space-y-6 md:space-y-12 pb-20 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Geopolitical Intelligence"
        subtitle="Strategic synchronization and cross-dimensional geopolitical analysis"
        icon={Globe}
        nodeId="GEOPOL-NODE-08"
      />

      {/* Tab Navigation */}
      <div className="flex space-x-8 border-b border-white/5 mb-8 relative z-20">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn(
            "pb-4 px-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'overview' ? "text-intel-cyan" : "text-slate-500 hover:text-white"
          )}
        >
          Strategic Overview
          {activeTab === 'overview' && (
            <motion.div 
              layoutId="activeGeopolTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]" 
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('diplomacy')}
          className={cn(
            "pb-4 px-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'diplomacy' ? "text-intel-cyan" : "text-slate-500 hover:text-white"
          )}
        >
          Diplomatic Relations
          {activeTab === 'diplomacy' && (
            <motion.div 
              layoutId="activeGeopolTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]" 
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('regional')}
          className={cn(
            "pb-4 px-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative",
            activeTab === 'regional' ? "text-intel-cyan" : "text-slate-500 hover:text-white"
          )}
        >
          Regional Powers
          {activeTab === 'regional' && (
            <motion.div 
              layoutId="activeGeopolTab" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]" 
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 md:space-y-12"
          >
            {/* Treasury Runway Widget */}
            <div className={cn(
              "intel-card p-4 md:p-8 rounded-xl md:rounded-3xl border relative overflow-hidden z-20 transition-all",
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
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Section */}
          <div className="lg:col-span-3 space-y-1 w-full lg:w-auto">
            <div className="flex items-baseline space-x-2">
              <span className={cn("text-4xl md:text-5xl font-bold font-mono tracking-tighter", 
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
          <div className="lg:col-span-6 space-y-4 w-full">
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
          <div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start w-full lg:w-auto gap-4 lg:space-y-2">
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
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center sm:text-left">
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

      {/* NATO Alignment Section */}
      <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border relative overflow-hidden z-20">
        <CornerAccent position="tl" />
        <CornerAccent position="br" />
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center space-x-3">
              <Shield className="w-6 h-6 text-intel-cyan" />
              <span>NATO Strategic Alignment</span>
            </h3>
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Security architecture synchronization index</p>
          </div>
          <div className="text-[10px] font-mono text-intel-cyan bg-intel-cyan/10 px-3 py-1 rounded border border-intel-cyan/20">
            LIVE OPERATIONAL DATA
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Visualization */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={actors.map(a => ({ name: a.name, score: natoScores[a.id], color: a.color }))}
                layout="vertical"
                margin={{ left: 40, right: 40 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                  {actors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actors.map((actor, idx) => (
              <div key={`${actor.id}-${idx}`} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:border-intel-cyan/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <actor.icon className="w-4 h-4 transition-transform group-hover:scale-110" style={{ color: actor.color }} />
                    <span className="text-xs font-bold text-white uppercase tracking-tight">{actor.name}</span>
                  </div>
                  <span className="text-xs font-mono text-intel-cyan font-bold">{natoScores[actor.id]}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={natoScores[actor.id]} 
                  onChange={(e) => {
                    const newVal = parseInt(e.target.value);
                    updateField('geopolitical.nato_alignment', { ...natoScores, [actor.id]: newVal }, 'Analyst Input');
                  }}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-intel-cyan"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 relative z-20">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border relative overflow-hidden group hover:border-intel-cyan/30 transition-all">
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
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border relative overflow-hidden">
            <CornerAccent position="tl" />
            <CornerAccent position="br" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-6">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center space-x-3">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-intel-cyan" />
                  <span>Actor Alignment Matrix</span>
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 uppercase font-mono tracking-wider">Cross-dimensional strategic synchronization</p>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                {actors.map((actor, idx) => (
                  <button
                    key={`${actor.id}-${idx}`}
                    onClick={() => setSelectedActor(actor)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl border text-[9px] md:text-[10px] font-bold transition-all flex items-center space-x-2 group flex-shrink-0 ${
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="h-[300px] md:h-[400px] relative group">
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
                <div className="p-4 md:p-8 rounded-xl md:rounded-3xl bg-white/5 border border-white/10 space-y-6 relative overflow-hidden">
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
                  <div className="p-4 md:p-8 rounded-xl md:rounded-3xl bg-white/5 border border-intel-cyan/20 space-y-4">
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
                    {alignmentData.filter(d => d.weight >= 0.9).map((dim, index) => {
                      const val = (dim as any)[selectedActor.id];
                      return (
                        <div key={`${dim.subject}-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-intel-cyan/20 hover:bg-white/10 transition-all group cursor-default">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border relative overflow-hidden">
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

            <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border relative overflow-hidden">
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
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6 md:space-y-8 relative overflow-hidden">
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
                  className="p-4 rounded-xl bg-white/5 border border-intel-border hover:border-intel-cyan/30 transition-all group relative overflow-hidden"
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

            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-[0.2em] flex items-center justify-center space-x-3 group">
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
              className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-red/20 bg-intel-red/5 space-y-6 relative overflow-hidden"
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
                 selectedActor.id === 'algeria' ? '"Strategic energy partnership is deepening. Border security coordination remains a top priority. Mutual interests in regional stability are aligned."' :
                 selectedActor.id === 'italy' ? '"Mattei Plan implementation is accelerating. Italy remains the most vocal advocate for Tunisia within the EU council. Focus on economic development."' :
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
    </motion.div>
  ) : activeTab === 'regional' ? (
    <motion.div
      key="regional"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Regional Powers Influence Matrix */}
      <div className="glass p-6 rounded-2xl border border-intel-border relative overflow-hidden z-20">
        <CornerAccent position="tl" />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-3">
              <Globe className="w-5 h-5 text-intel-cyan" />
              <span className="uppercase tracking-tight">Regional Power Influence Vectors</span>
            </h3>
            <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Influence magnitude, posture, and strategic leverage on Tunisia</p>
          </div>
          <span className="text-[8px] font-mono px-2 py-1 rounded border text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5 uppercase">Live Assessment</span>
        </div>

        <div className="space-y-5">
          {[
            {
              power: 'Algeria', flag: '🇩🇿', color: '#10b981',
              influence: 88, posture: 'STRATEGIC ALLY', trend: '→ STABLE',
              vectors: { energy: 95, security: 92, trade: 78, political: 82 },
              leverage: 'Gas supply (35% of Tunisian energy). Border security cooperation. Diplomatic cover at Arab League.',
              risk: 'LOW',
              note: 'Algeria is Tunisia\'s most reliable regional partner. Shared interest in preventing Libyan spillover and Sahelian jihadist expansion.'
            },
            {
              power: 'Saudi Arabia', flag: '🇸🇦', color: '#f59e0b',
              influence: 72, posture: 'SELECTIVE ENGAGEMENT', trend: '↑ DEEPENING',
              vectors: { energy: 45, security: 65, trade: 58, political: 88 },
              leverage: 'Emergency liquidity deposits ($500M+). Soft power via religious networks. Potential OPEC+ coordination.',
              risk: 'MEDIUM',
              note: 'KSA provides political cover and selective liquidity but conditions support on counter-Iran alignment and Islamist suppression.'
            },
            {
              power: 'Turkey', flag: '🇹🇷', color: '#ef4444',
              influence: 54, posture: 'COMPETITIVE PRESSURE', trend: '↑ RISING',
              vectors: { energy: 18, security: 42, trade: 68, political: 65 },
              leverage: 'Growing trade ties. Drone technology exports. Soft power through MB-aligned networks. Libya proxy connection.',
              risk: 'HIGH',
              note: 'Turkey and Saied regime have ideological friction. Ankara maintains ties with suppressed Ennahda networks — this is a persistent tension vector.'
            },
            {
              power: 'UAE', flag: '🇦🇪', color: '#3b82f6',
              influence: 68, posture: 'SUPPORTIVE', trend: '→ STABLE',
              vectors: { energy: 38, security: 55, trade: 72, political: 82 },
              leverage: 'FDI in real estate and hospitality. Intelligence sharing on Islamist networks. Diplomatic backing at Arab League.',
              risk: 'LOW',
              note: 'UAE strongly backs Saied\'s anti-MB stance. Provides strategic intelligence cooperation and selective investment. Aligned on Libya.'
            },
            {
              power: 'China', flag: '🇨🇳', color: '#8b5cf6',
              influence: 48, posture: 'INFRASTRUCTURE', trend: '↑ EXPANDING',
              vectors: { energy: 28, security: 22, trade: 75, political: 45 },
              leverage: 'BRI infrastructure deals. Phosphate processing investment. Debt restructuring leverage. UN veto cover.',
              risk: 'MEDIUM',
              note: 'China is expanding footprint through non-conditional investment. No democracy conditionality = attractive to Saied. Debt dependency risk growing.'
            },
            {
              power: 'Libya', flag: '🇱🇾', color: '#f97316',
              influence: 62, posture: 'INSTABILITY VECTOR', trend: '↑ WORSENING',
              vectors: { energy: 15, security: 88, trade: 45, political: 38 },
              leverage: 'Direct border spillover risk. Smuggling corridor. Arms trafficking. Refugee pressure. Militia influence on southern Tunisia.',
              risk: 'CRITICAL',
              note: 'Libya is not a power but a threat multiplier. Eastern Libya (Haftar) provides covert support to certain Tunisian factions. Instability is direct national security risk.'
            },
          ].map((p, i) => (
            <div key={i} className={`p-5 rounded-xl border space-y-4 ${p.risk === 'CRITICAL' ? 'border-intel-red/30 bg-intel-red/5' : p.risk === 'HIGH' ? 'border-intel-orange/20' : 'border-intel-border'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.flag}</span>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{p.power}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${p.risk === 'CRITICAL' ? 'text-intel-red border-intel-red/30' : p.risk === 'HIGH' ? 'text-intel-orange border-intel-orange/30' : p.risk === 'MEDIUM' ? 'text-yellow-400 border-yellow-400/30' : 'text-intel-cyan border-intel-cyan/30'}`}>{p.risk}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono font-bold" style={{ color: p.color }}>{p.posture}</span>
                      <span className={`text-[9px] font-mono ${p.trend.startsWith('↑') ? 'text-intel-red' : 'text-slate-500'}`}>{p.trend}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold font-mono" style={{ color: p.color }}>{p.influence}</div>
                  <div className="text-[8px] font-mono text-slate-600">Influence Index</div>
                </div>
              </div>

              {/* 4 dimension bars */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(p.vectors).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase">
                      <span>{key}</span><span style={{ color: p.color }}>{val}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: p.color, opacity: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Leverage Vectors</div>
                  <p className="text-[9px] font-mono text-slate-400 leading-relaxed">{p.leverage}</p>
                </div>
                <div>
                  <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Analyst Assessment</div>
                  <p className="text-[9px] font-mono text-slate-400 leading-relaxed italic">{p.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Influence Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-intel-border">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Influence Radar — All Regional Powers</div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { subject: 'Energy', ALG: 95, KSA: 45, TUR: 18, UAE: 38, CHN: 28, LIB: 15 },
                { subject: 'Security', ALG: 92, KSA: 65, TUR: 42, UAE: 55, CHN: 22, LIB: 88 },
                { subject: 'Trade', ALG: 78, KSA: 58, TUR: 68, UAE: 72, CHN: 75, LIB: 45 },
                { subject: 'Political', ALG: 82, KSA: 88, TUR: 65, UAE: 82, CHN: 45, LIB: 38 },
                { subject: 'Financial', ALG: 55, KSA: 85, TUR: 32, UAE: 78, CHN: 65, LIB: 12 },
              ]}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Algeria" dataKey="ALG" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} />
                <Radar name="Saudi Arabia" dataKey="KSA" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} />
                <Radar name="Turkey" dataKey="TUR" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} />
                <Radar name="China" dataKey="CHN" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={1.5} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-intel-border space-y-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Overall Influence Ranking</div>
          <div className="space-y-3">
            {[
              { power: 'Algeria', flag: '🇩🇿', score: 88, color: '#10b981' },
              { power: 'Saudi Arabia', flag: '🇸🇦', score: 72, color: '#f59e0b' },
              { power: 'Libya (threat)', flag: '🇱🇾', score: 62, color: '#ef4444' },
              { power: 'UAE', flag: '🇦🇪', score: 68, color: '#3b82f6' },
              { power: 'Turkey', flag: '🇹🇷', score: 54, color: '#f97316' },
              { power: 'China', flag: '🇨🇳', score: 48, color: '#8b5cf6' },
            ].sort((a, b) => b.score - a.score).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-6 shrink-0">{p.flag}</span>
                <span className="text-[10px] font-mono text-slate-400 w-28 shrink-0">{p.power}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.score}%`, backgroundColor: p.color }} />
                </div>
                <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: p.color }}>{p.score}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Key RRI Linkages</div>
            <p className="text-[9px] font-mono text-slate-500 leading-relaxed">Libya instability (EQ.17 cascade) and Turkey-Ennahda alignment (EQ.7 elite defection utility) are the two highest-risk regional vectors feeding directly into R(t).</p>
          </div>
        </div>
      </div>
    </motion.div>
  ) : (
    <motion.div
      key="diplomacy"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Diplomatic Relations Tracker */}
      <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border relative overflow-hidden z-20">
        <CornerAccent position="tl" />
        <CornerAccent position="br" />
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center space-x-3">
              <Handshake className="w-6 h-6 text-intel-cyan" />
              <span>Diplomatic Relations Tracker</span>
            </h3>
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Bilateral engagement and regime alignment monitoring</p>
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
            <Clock className="w-3 h-3" />
            <span>LAST SYNC: {data.geopolitical.last_updated}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(!data.geopolitical.diplomatic_relations || data.geopolitical.diplomatic_relations.length === 0) ? (
            <div className="col-span-full p-12 rounded-2xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-intel-cyan/10 text-intel-cyan">
                <Info className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold uppercase tracking-tight">No Diplomatic Data Synchronized</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">The diplomatic relations tracker is currently awaiting synchronization with the core intelligence engine.</p>
              </div>
              <button 
                onClick={() => updateField('geopolitical.diplomatic_relations', [
                  {
                    actor: 'European Union',
                    last_contact: '2026-03-12',
                    nature_of_contact: 'High-level Bilateral Meeting',
                    regime_alignment: 'CRITICAL',
                    analyst_assessment: 'EU continues to link financial aid to migration control and democratic reforms. Relations remain transactional but strained.'
                  },
                  {
                    actor: 'United States',
                    last_contact: '2026-03-05',
                    nature_of_contact: 'Security Cooperation Briefing',
                    regime_alignment: 'NEUTRAL',
                    analyst_assessment: 'Focus remains on counter-terrorism and regional stability. Public rhetoric on democracy is increasing but military aid persists.'
                  },
                  {
                    actor: 'France',
                    last_contact: '2026-03-10',
                    nature_of_contact: 'Presidential Phone Call',
                    regime_alignment: 'SUPPORTIVE',
                    analyst_assessment: 'France maintains a pragmatic approach, prioritizing stability and historical economic ties over public criticism of domestic policy.'
                  },
                  {
                    actor: 'Gulf States (KSA/UAE)',
                    last_contact: '2026-02-28',
                    nature_of_contact: 'Investment Forum',
                    regime_alignment: 'SUPPORTIVE',
                    analyst_assessment: 'Gulf partners are providing selective liquidity support but demand clear ROI and alignment on regional security architectures.'
                  },
                  {
                    actor: 'Algeria',
                    last_contact: '2026-03-14',
                    nature_of_contact: 'Border Security Coordination',
                    regime_alignment: 'SUPPORTIVE',
                    analyst_assessment: 'Strategic partnership on energy and security remains the cornerstone. Algeria provides critical gas supplies and cooperates closely on border stability.'
                  },
                  {
                    actor: 'Italy',
                    last_contact: '2026-03-18',
                    nature_of_contact: 'Mattei Plan Implementation Meeting',
                    regime_alignment: 'SUPPORTIVE',
                    analyst_assessment: 'Italy is the primary advocate for Tunisia in the EU, focusing on economic development and migration management through the Mattei Plan.'
                  }
                ], 'System Recovery')}
                className="px-6 py-2 rounded-xl bg-intel-cyan/20 border border-intel-cyan/30 text-intel-cyan text-[10px] font-bold uppercase tracking-widest hover:bg-intel-cyan/30 transition-all"
              >
                Force Intelligence Sync
              </button>
            </div>
          ) : data.geopolitical.diplomatic_relations.map((rel, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-intel-cyan/30 transition-all group relative overflow-hidden">
              <div className={cn(
                "absolute top-0 right-0 px-3 py-1 text-[8px] font-mono font-bold uppercase tracking-widest rounded-bl-xl border-l border-b",
                rel.regime_alignment === 'SUPPORTIVE' ? "bg-intel-green/20 border-intel-green/30 text-intel-green" :
                rel.regime_alignment === 'CRITICAL' ? "bg-intel-red/20 border-intel-red/30 text-intel-red" :
                rel.regime_alignment === 'HOSTILE' ? "bg-intel-red/40 border-intel-red/50 text-white" :
                "bg-slate-500/20 border-slate-500/30 text-slate-400"
              )}>
                {rel.regime_alignment}
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-intel-cyan transition-colors uppercase tracking-tight">{rel.actor}</h4>
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>LAST CONTACT: {rel.last_contact}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">Nature of Contact</div>
                  <div className="text-[11px] text-slate-300 font-sans italic">{rel.nature_of_contact}</div>
                </div>

                <div className="space-y-2 p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center space-x-2 text-[8px] font-mono text-intel-cyan uppercase tracking-widest font-bold">
                    <Activity className="w-3 h-3" />
                    <span>Analyst Assessment</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {rel.analyst_assessment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};
