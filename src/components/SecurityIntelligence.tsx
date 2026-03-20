import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  AlertTriangle, 
  Activity,
  Zap,
  Target,
  Eye,
  Crosshair,
  Shield,
  Terminal,
  Wifi,
  Radio,
  TrendingUp,
  TrendingDown,
  Navigation,
  Users,
  FlaskConical,
  Car,
  AlertCircle,
  Ship,
  Anchor,
  Waves,
  Siren,
  Construction,
  LayoutGrid,
  Search,
  Pill
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

const securityAlerts = [
  { code: 'SEC-BORDER-01', title: 'Increased Activity at Western Border', impact: 'CRITICAL' },
  { code: 'SEC-CYBER-04', title: 'DDoS Attempt on Gov Infrastructure', impact: 'HIGH' },
  { code: 'SEC-PROTEST-09', title: 'Civil Unrest Reported in Kasserine', impact: 'HIGH' },
  { code: 'SEC-MARITIME-12', title: 'Unidentified Vessel in Territorial Waters', impact: 'MEDIUM' },
  { code: 'SEC-INTEL-02', title: 'Strategic Threat Level: ELEVATED', impact: 'HIGH' }
];

const securityMetrics = [
  { subject: 'Border Control', A: 85, fullMark: 100 },
  { subject: 'Counter-Terror', A: 92, fullMark: 100 },
  { subject: 'Cyber Defense', A: 65, fullMark: 100 },
  { subject: 'Urban Safety', A: 78, fullMark: 100 },
  { subject: 'Maritime Sec', A: 82, fullMark: 100 },
  { subject: 'Intelligence', A: 88, fullMark: 100 },
];

const incidentData = [
  { month: 'Oct', terrorism: 1, smuggling: 45, cyber: 12 },
  { month: 'Nov', terrorism: 0, smuggling: 52, cyber: 18 },
  { month: 'Dec', terrorism: 2, smuggling: 38, cyber: 25 },
  { month: 'Jan', terrorism: 1, smuggling: 61, cyber: 30 },
  { month: 'Feb', terrorism: 0, smuggling: 48, cyber: 22 },
  { month: 'Mar', terrorism: 1, smuggling: 55, cyber: 28 },
];

const hotspots = [
  { id: 'HS-001', location: 'Mount Chaambi', threat: 'CRITICAL', type: 'Terrorism', status: 'Active Operation' },
  { id: 'HS-002', location: 'Ras Ajdir', threat: 'HIGH', type: 'Smuggling/Border', status: 'Reinforced' },
  { id: 'HS-003', location: 'Ben Guerdane', threat: 'HIGH', type: 'Insurgency Risk', status: 'High Alert' },
  { id: 'HS-004', location: 'Tunis Port', threat: 'MEDIUM', type: 'Cyber/Logistics', status: 'Monitoring' },
];

const drugArrestsData = [
  { month: 'Oct', arrests: 420, trend: '+5%' },
  { month: 'Nov', arrests: 380, trend: '-2%' },
  { month: 'Dec', arrests: 510, trend: '+12%' },
  { month: 'Jan', arrests: 490, trend: '+8%' },
  { month: 'Feb', arrests: 550, trend: '+15%' },
  { month: 'Mar', arrests: 620, trend: '+20%' },
];

const drugArrestTrends = [
  { month: 'OCT', users: 850, dealers: 120 },
  { month: 'NOV', users: 920, dealers: 145 },
  { month: 'DEC', users: 1100, dealers: 180 },
  { month: 'JAN', users: 880, dealers: 130 },
  { month: 'FEB', users: 950, dealers: 155 },
  { month: 'MAR', users: 1050, dealers: 190 }
];

const drugConsumptionData = [
  { name: 'Cannabis (Zatla)', value: 65, color: '#22c55e', description: 'Most prevalent, widespread among youth.' },
  { name: 'Psychotropic Pills', value: 22, color: '#f59e0b', description: 'Rising abuse of prescription meds (Parkizol, etc).' },
  { name: 'Cocaine', value: 8, color: '#0ea5e9', description: 'Increasing availability in urban nightlife hubs.' },
  { name: 'Heroin/Injectables', value: 3, color: '#ef4444', description: 'High-risk, concentrated in specific urban pockets.' },
  { name: 'Synthetic/New', value: 2, color: '#a855f7', description: 'Emerging chemical variants, difficult to track.' }
];

const drugSeizures = [
  { substance: 'Cannabis (Zatla)', quantity: '1,240 kg', value: '4.2M TND', trend: 'UP', color: '#10b981' },
  { substance: 'Cocaine', quantity: '12.5 kg', value: '3.8M TND', trend: 'STABLE', color: '#ef4444' },
  { substance: 'Tramadol', quantity: '85,000 units', value: '1.2M TND', trend: 'CRITICAL', color: '#f59e0b' },
];

const traffickingRoutes = [
  { name: 'Western Corridor', route: 'Algeria Border → Kasserine → Tunis', risk: 'HIGH', activity: 'Increased' },
  { name: 'Southern Pipeline', route: 'Libya Border → Ben Guerdane → Sfax', risk: 'CRITICAL', activity: 'Extreme' },
  { name: 'Maritime Node', route: 'Sfax Port → Mediterranean', risk: 'MEDIUM', activity: 'Stable' },
];

const illegalImmigrationTrends = [
  { month: 'OCT', interceptions: 1200, crossings: 450 },
  { month: 'NOV', interceptions: 1400, crossings: 480 },
  { month: 'DEC', interceptions: 1100, crossings: 520 },
  { month: 'JAN', interceptions: 1600, crossings: 580 },
  { month: 'FEB', interceptions: 1800, crossings: 610 },
  { month: 'MAR', interceptions: 2100, crossings: 650 }
];

const maritimeSecurityMetrics = [
  { category: 'Coast Guard Patrols', value: 145, trend: '+12%', status: 'HIGH' },
  { category: 'Vessel Interceptions', value: 82, trend: '+25%', status: 'CRITICAL' },
  { category: 'Search & Rescue Ops', value: 34, trend: '+8%', status: 'ACTIVE' },
  { category: 'Border Breaches (Land)', value: 12, trend: '-5%', status: 'STABLE' }
];

const migrationHotspots = [
  { name: 'Sfax Coastline', risk: 'CRITICAL', activity: 'High Departure Rate', force: 'Reinforced' },
  { name: 'Zarzis/Djerba', risk: 'HIGH', activity: 'Medium Departure Rate', force: 'Standard' },
  { name: 'Kelibia/Hammam Ghezaz', risk: 'MEDIUM', activity: 'Low Departure Rate', force: 'Monitoring' },
  { name: 'Tabarka (North)', risk: 'MEDIUM', activity: 'Emerging Route', force: 'Patrolling' }
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

export const SecurityIntelligence: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'STRATEGIC' | 'BORDER' | 'CRIME' | 'SAFETY' | 'TACTICAL'>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Intelligence', icon: LayoutGrid },
    { id: 'STRATEGIC', label: 'Strategic Readiness', icon: Shield },
    { id: 'BORDER', label: 'Border & Migration', icon: Navigation },
    { id: 'CRIME', label: 'Narcotics & Crime', icon: FlaskConical },
    { id: 'SAFETY', label: 'Public Safety', icon: Siren },
    { id: 'TACTICAL', label: 'Tactical Briefing', icon: Crosshair },
  ];

  const radarData = [
    { subject: 'Border Control', A: 85, fullMark: 100 },
    { subject: 'Counter-Terror', A: 92, fullMark: 100 },
    { subject: 'Cyber Defense', A: 65, fullMark: 100 },
    { subject: 'Urban Safety', A: 78, fullMark: 100 },
    { subject: 'Maritime Sec', A: 82, fullMark: 100 },
    { subject: 'Intelligence', A: 88, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Security Intelligence & Tactical Monitoring"
        subtitle="Real-time threat assessment, border dynamics, and strategic readiness analysis"
        icon={Shield}
        nodeId="SEC-NODE-07"
      />

      <LiveTicker items={securityAlerts} />

      {/* CATEGORY SELECTOR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-intel-border/30 pb-4 sticky top-0 bg-black/50 backdrop-blur-md z-50 py-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 border ${
              activeCategory === cat.id 
                ? 'bg-intel-cyan/10 border-intel-cyan text-intel-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                : 'bg-white/5 border-intel-border text-slate-500 hover:border-white/20 hover:text-white'
            }`}
          >
            <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-intel-cyan' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{cat.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-12"
        >
          {/* CATEGORY 1: STRATEGIC READINESS & NATIONAL DEFENSE */}
          {(activeCategory === 'ALL' || activeCategory === 'STRATEGIC') && (
            <div className="space-y-6 relative z-20">
        <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
          <Shield className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Strategic Readiness & National Defense</h3>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'National Threat Level', value: 'Level 4', status: 'CRITICAL', icon: ShieldAlert },
            { label: 'Ongoing Operations', value: '12', status: 'ACTIVE', icon: Target },
            { label: 'Surveillance Nodes', value: '842', status: 'STABLE', icon: Eye },
            { label: 'Border Integrity', value: '94%', status: 'STABLE', icon: ShieldCheck },
          ].map((metric, i) => (
            <div key={i} className="glass p-6 rounded-3xl border border-intel-border relative overflow-hidden group">
              <CornerAccent position="tl" />
              <CornerAccent position="br" />
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-intel-cyan group-hover:scale-110 transition-transform duration-300">
                  <metric.icon className="w-5 h-5" />
                </div>
                <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  metric.status === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/5' :
                  metric.status === 'ACTIVE' ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5' :
                  'text-intel-green border-intel-green/30 bg-intel-green/5'
                }`}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Readiness Assessment */}
          <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Readiness Matrix</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Current Capability Assessment</p>
              </div>
              <Target className="w-5 h-5 text-intel-cyan" />
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Readiness"
                    dataKey="A"
                    stroke="#00f2ff"
                    fill="#00f2ff"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incident Trends */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Incident Dynamics</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-mono">6-Month Threat Vector Analysis</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Terror</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Smuggling</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incidentData}>
                  <defs>
                    <linearGradient id="colorSmuggling" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="smuggling" 
                    stroke="#00f2ff" 
                    fillOpacity={1} 
                    fill="url(#colorSmuggling)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cyber" 
                    stroke="#a855f7" 
                    fill="transparent" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="terrorism" 
                    stroke="#ff4e00" 
                    fill="transparent" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    )}

          {/* CATEGORY 2: BORDER INTEGRITY & MIGRATION CONTROL */}
          {(activeCategory === 'ALL' || activeCategory === 'BORDER') && (
            <div className="space-y-6 relative z-20">
        <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
          <Navigation className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Border Integrity & Migration Control</h3>
        </div>

        {/* Illegal Immigration & Maritime Security Section */}
        <div className="space-y-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Immigration Trends */}
            <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight">Migration Interception Dynamics</h4>
                  <p className="text-[10px] text-slate-500 uppercase">Interceptions vs. Estimated Successful Crossings</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Interceptions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Crossings</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={illegalImmigrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="interceptions" fill="#00f2ff" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Interceptions" />
                    <Line type="monotone" dataKey="crossings" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Est. Crossings" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Maritime Metrics */}
            <div className="glass p-8 rounded-3xl border border-intel-border space-y-8">
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight border-b border-intel-border pb-4">Maritime Readiness</h4>
                <div className="space-y-4">
                  {maritimeSecurityMetrics.map((metric, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-intel-border flex flex-col justify-between group hover:border-intel-cyan/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{metric.category}</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                          metric.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 
                          metric.status === 'HIGH' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                          'bg-intel-cyan/10 border-intel-cyan/30 text-intel-cyan'
                        }`}>
                          {metric.status}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
                        <div className={`text-[10px] font-mono font-bold ${metric.trend.startsWith('+') ? 'text-intel-red' : 'text-intel-green'}`}>
                          {metric.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-intel-red" />
                  <span>Migration Hotspots</span>
                </h4>
                <div className="space-y-3">
                  {migrationHotspots.map((hotspot, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-intel-border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-white uppercase">{hotspot.name}</span>
                        <span className={`text-[8px] font-mono font-bold ${hotspot.risk === 'CRITICAL' ? 'text-intel-red' : 'hotspot.risk === "HIGH" ? "text-intel-orange" : "text-intel-cyan"'}`}>{hotspot.risk}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>{hotspot.activity}</span>
                        <span className="text-intel-cyan">{hotspot.force}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
          
          {/* CATEGORY 3: NARCOTICS & ORGANIZED CRIME */}
          {(activeCategory === 'ALL' || activeCategory === 'CRIME') && (
            <div className="space-y-6 relative z-20">
        <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
          <FlaskConical className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Narcotics & Organized Crime</h3>
        </div>
        
        {/* Drug & Narcotic Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Arrests Trend */}
        <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Narcotic Enforcement</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Monthly Arrests & Trend</p>
            </div>
            <div className="p-2 rounded-xl bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          
          <div className="flex-1 h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drugArrestsData}>
                <defs>
                  <linearGradient id="colorArrests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="arrests" stroke="#00f2ff" fill="url(#colorArrests)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">Current Month</div>
              <div className="text-xl font-bold text-white">620</div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-intel-red space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-bold">+20%</span>
              </div>
              <div className="text-[8px] font-mono text-slate-600 uppercase">vs Last Month</div>
            </div>
          </div>
        </div>

        {/* Law Enforcement Activity - Drug Related Arrests */}
        <div className="lg:col-span-3 glass p-8 rounded-3xl border border-intel-border space-y-6">
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

        {/* Major Seizures & Substances */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Strategic Seizures</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Top Substances & Market Impact</p>
            </div>
            <FlaskConical className="w-5 h-5 text-intel-cyan" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {drugSeizures.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-intel-cyan/30 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{item.substance}</div>
                      <div className="text-[10px] font-mono text-slate-500">{item.quantity}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-intel-cyan">{item.value}</div>
                    <div className={`text-[8px] font-mono font-bold ${item.trend === 'CRITICAL' ? 'text-intel-red' : 'text-slate-500'}`}>{item.trend}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-[200px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={drugSeizures.map(s => ({ name: s.substance, value: parseFloat(s.value) }))}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {drugSeizures.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[10px] font-mono text-slate-500 uppercase">Total Value</div>
                <div className="text-lg font-bold text-white">9.2M</div>
                <div className="text-[8px] font-mono text-slate-600 uppercase">TND</div>
              </div>
            </div>
          </div>
        </div>

        {/* Consumption Profile */}
        <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Consumption Profile</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Market Prevalence</p>
            </div>
            <Pill className="w-5 h-5 text-intel-cyan" />
          </div>
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
      </div>

      {/* Trafficking Routes & Addiction Link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-20">
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Trafficking Vector Analysis</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Active Narcotics Routes & Border Dynamics</p>
            </div>
            <Navigation className="w-5 h-5 text-intel-cyan" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {traffickingRoutes.map((route, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110 ${route.risk === 'CRITICAL' ? 'text-intel-red' : 'text-intel-cyan'}`}>
                  <Navigation className="w-full h-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono font-bold text-white uppercase">{route.name}</div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    route.risk === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                  }`}>
                    {route.risk}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">{route.route}</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="text-[8px] font-mono text-slate-600 uppercase">Activity</div>
                  <div className={`text-[8px] font-mono font-bold uppercase ${route.activity === 'Extreme' ? 'text-intel-red' : 'text-intel-cyan'}`}>{route.activity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Social Impact</h3>
              <Users className="w-5 h-5 text-intel-cyan" />
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-intel-cyan/5 border border-intel-cyan/20">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Youth Addiction Rate</div>
                <div className="flex items-end space-x-2">
                  <div className="text-3xl font-bold text-white">14.2%</div>
                  <div className="text-xs font-bold text-intel-red mb-1">CRITICAL</div>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-intel-cyan w-[14.2%]"></div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 leading-relaxed italic">
                "Narcotic trafficking is directly fueling youth addiction rates in urban centers. Cross-module analysis suggests a 0.82 correlation with school dropout rates."
              </div>
            </div>
          </div>

          <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/10 transition-all group flex items-center justify-center space-x-2 mt-6">
            <Activity className="w-3 h-3 text-intel-cyan" />
            <span>View Social Intelligence Data</span>
          </button>
        </div>
      </div>
    </div>
  )}

  {/* CATEGORY 4: PUBLIC SAFETY & INFRASTRUCTURE */}
  {(activeCategory === 'ALL' || activeCategory === 'SAFETY') && (
    <div className="space-y-6 relative z-20">
        <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
          <Siren className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Public Safety & Infrastructure</h3>
        </div>

        {/* Road Accidents Section */}
        <div className="space-y-8">
          <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
            <Car className="w-6 h-6 text-intel-orange" />
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Road Safety & Infrastructure Intelligence</h3>
              <p className="text-[10px] text-slate-500 uppercase">Accident dynamics, mortality rates, and infrastructure risk factors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Accident Trends */}
            <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight">Monthly Accident Dynamics</h4>
                  <p className="text-[10px] text-slate-500 uppercase">Accidents vs. Fatalities vs. Injuries</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Accidents</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Fatalities</span>
                  </div>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={roadAccidentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="accidents" fill="#f59e0b" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Total Accidents" />
                    <Line type="monotone" dataKey="fatalities" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Fatalities" />
                    <Area type="monotone" dataKey="injuries" fill="#0ea5e9" fillOpacity={0.1} stroke="#0ea5e9" strokeWidth={1} name="Injuries" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Causes & Hotspots */}
            <div className="glass p-8 rounded-3xl border border-intel-border space-y-8">
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight border-b border-intel-border pb-4">Primary Causes</h4>
                <div className="space-y-4">
                  {accidentCauses.map((cause, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                        <span className="text-slate-400">{cause.name}</span>
                        <span className="text-white font-bold">{cause.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${cause.value}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full" 
                          style={{ backgroundColor: cause.color }}
                        ></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-intel-red" />
                  <span>High-Risk Corridors</span>
                </h4>
                <div className="space-y-3">
                  {[
                    { route: 'GP1: Tunis - Sousse', risk: 'EXTREME', trend: 'High speed / Heavy traffic' },
                    { route: 'GP3: Kairouan - Gafsa', risk: 'HIGH', trend: 'Poor lighting / Infrastructure' },
                    { route: 'GP11: Bizerte - Menzel Bourguiba', risk: 'HIGH', trend: 'Urban congestion' },
                  ].map((route, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-intel-border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-white uppercase">{route.route}</span>
                        <span className="text-[8px] font-mono text-intel-red font-bold">{route.risk}</span>
                      </div>
                      <p className="text-[9px] text-slate-500 italic">{route.trend}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    )}
      {/* Illegal Immigration & Maritime Security Section REMOVED FROM HERE - MOVED TO CATEGORY 2 */}
      
      {/* CATEGORY 5: HOTSPOTS & TACTICAL BRIEFING */}
      {(activeCategory === 'ALL' || activeCategory === 'TACTICAL') && (
        <div className="space-y-6 relative z-20">
          <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
            <Crosshair className="w-4 h-4 text-intel-cyan" />
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Hotspots & Tactical Briefing</h3>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Security Hotspots</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Priority Monitoring Zones</p>
            </div>
            <MapPin className="w-5 h-5 text-intel-red" />
          </div>

          <div className="space-y-4">
            {hotspots.map((spot) => (
              <div key={spot.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-intel-border hover:border-intel-cyan/30 transition-all group">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${spot.threat === 'CRITICAL' ? 'bg-intel-red shadow-[0_0_10px_rgba(255,78,0,0.5)]' : spot.threat === 'HIGH' ? 'bg-intel-orange' : 'bg-intel-cyan'}`}></div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">{spot.location}</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase">{spot.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-mono font-bold uppercase ${spot.threat === 'CRITICAL' ? 'text-intel-red' : spot.threat === 'HIGH' ? 'text-intel-orange' : 'text-intel-cyan'}`}>
                    {spot.threat}
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 uppercase mt-1">{spot.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-32 h-32 text-intel-cyan" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-6">Tactical Briefing</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-intel-cyan">
                  <Crosshair className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Operation: Desert Shield</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Increased patrols along the Southern border following reports of unauthorized drone activity. Electronic warfare units deployed to Sector 7.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-intel-orange">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Cyber Alert: Level 2</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Phishing campaign targeting government energy infrastructure detected. All nodes switched to high-security protocol.
                </p>
              </div>

              <button className="w-full py-3 rounded-xl bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-intel-cyan/20 transition-all mt-4">
                Access Classified Dossiers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</motion.div>
</AnimatePresence>
</div>
);
};
