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
  Pill,
  ArrowUpRight
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
import { prepareList, assertKey, getRenderKey } from '../lib/keyUtils';

const securityAlerts = [
  { code: 'SEC-BORDER-01', title: 'Increased Activity at Western Border', impact: 'CRITICAL' },
  { code: 'SEC-CYBER-04', title: 'DDoS Attempt on Gov Infrastructure', impact: 'HIGH' },
  { code: 'SEC-PROTEST-09', title: 'Civil Unrest Reported in Kasserine', impact: 'HIGH', link: 'CIVIL MOVEMENTS', subTab: 'movements' },
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
  { id: 'HS-005', location: 'Mount Ouergha (Kef)', threat: 'HIGH', type: 'Counter-Terror', status: 'Active Monitoring' },
  { id: 'HS-006', location: 'Gafsa Mining Basin', threat: 'MEDIUM', type: 'Civil Unrest', status: 'Strained' },
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

const cyberIncidentData = [
  { month: 'Oct', ddos: 3, phishing: 18, intrusion: 2, defacement: 1 },
  { month: 'Nov', ddos: 5, phishing: 22, intrusion: 4, defacement: 2 },
  { month: 'Dec', ddos: 4, phishing: 28, intrusion: 3, defacement: 1 },
  { month: 'Jan', ddos: 8, phishing: 31, intrusion: 6, defacement: 3 },
  { month: 'Feb', ddos: 6, phishing: 25, intrusion: 5, defacement: 2 },
  { month: 'Mar', ddos: 12, phishing: 38, intrusion: 9, defacement: 4 },
];

const cyberTargets = [
  { target: 'Energy Grid (STEG)', threat: 'CRITICAL', lastAttempt: '2h ago', vector: 'DDoS + Credential Stuffing', status: 'DEFENDED' },
  { target: 'Central Bank (BCT)', threat: 'HIGH', lastAttempt: '6h ago', vector: 'Phishing Campaign', status: 'MONITORING' },
  { target: 'Interior Ministry', threat: 'HIGH', lastAttempt: '14h ago', vector: 'APT Lateral Movement', status: 'DEFENDED' },
  { target: 'Tunis-Carthage Airport', threat: 'HIGH', lastAttempt: '1d ago', vector: 'SCADA Probe', status: 'PATCHED' },
  { target: 'ATB Banking Network', threat: 'MEDIUM', lastAttempt: '2d ago', vector: 'SQL Injection', status: 'BLOCKED' },
  { target: 'TAP News Agency', threat: 'MEDIUM', lastAttempt: '3d ago', vector: 'Defacement Attempt', status: 'BLOCKED' },
];

const cyberThreatActors = [
  { name: 'Anonymous Arab', origin: 'Regional', motivation: 'Hacktivist', capability: 'MEDIUM', activity: 'ELEVATED' },
  { name: 'Tunisian Cyber Army', origin: 'Domestic', motivation: 'Nationalist', capability: 'LOW', activity: 'MODERATE' },
  { name: 'APT-Regional-07', origin: 'State-Sponsored', motivation: 'Espionage', capability: 'HIGH', activity: 'LOW' },
  { name: 'Criminal Syndicate', origin: 'Unknown', motivation: 'Financial', capability: 'MEDIUM', activity: 'ELEVATED' },
];

const prisonData = [
  { facility: 'Mornaguia Prison', capacity: 1500, population: 3200, occupancy: 213, risk: 'CRITICAL' },
  { facility: 'La Manouba', capacity: 800, population: 1650, occupancy: 206, risk: 'CRITICAL' },
  { facility: 'Sfax Prison', capacity: 600, population: 1180, occupancy: 197, risk: 'HIGH' },
  { facility: 'Sousse Prison', capacity: 500, population: 920, occupancy: 184, risk: 'HIGH' },
  { facility: 'Bizerte Prison', capacity: 400, population: 680, occupancy: 170, risk: 'HIGH' },
  { facility: 'Gabes Prison', capacity: 350, population: 540, occupancy: 154, risk: 'MEDIUM' },
];

const radicalizationInPrisonData = [
  { year: '2020', salafi: 12, political: 8, criminal: 45 },
  { year: '2021', salafi: 18, political: 11, criminal: 42 },
  { year: '2022', salafi: 24, political: 15, criminal: 38 },
  { year: '2023', salafi: 31, political: 19, criminal: 35 },
  { year: '2024', salafi: 38, political: 24, criminal: 31 },
  { year: '2025', salafi: 44, political: 28, criminal: 29 },
];

const prisonIncidentData = [
  { month: 'Oct', riots: 1, hunger_strikes: 3, assaults: 12 },
  { month: 'Nov', riots: 0, hunger_strikes: 5, assaults: 9 },
  { month: 'Dec', riots: 2, hunger_strikes: 4, assaults: 14 },
  { month: 'Jan', riots: 1, hunger_strikes: 7, assaults: 11 },
  { month: 'Feb', riots: 3, hunger_strikes: 6, assaults: 18 },
  { month: 'Mar', riots: 2, hunger_strikes: 9, assaults: 22 },
];

const policeOpsData = [
  { month: 'Oct', raids: 45, arrests: 128, seizures: 32 },
  { month: 'Nov', raids: 52, arrests: 147, seizures: 38 },
  { month: 'Dec', raids: 38, arrests: 112, seizures: 28 },
  { month: 'Jan', raids: 61, arrests: 183, seizures: 44 },
  { month: 'Feb', raids: 55, arrests: 162, seizures: 41 },
  { month: 'Mar', raids: 68, arrests: 197, seizures: 52 },
];

const policeDeploymentData = [
  { region: 'Grand Tunis', units: 42, status: 'REINFORCED', incidents_30d: 156 },
  { region: 'Sfax', units: 18, status: 'NORMAL', incidents_30d: 89 },
  { region: 'Sousse', units: 14, status: 'NORMAL', incidents_30d: 67 },
  { region: 'Kasserine', units: 12, status: 'ELEVATED', incidents_30d: 94 },
  { region: 'Sidi Bouzid', units: 10, status: 'ELEVATED', incidents_30d: 78 },
  { region: 'Gafsa', units: 16, status: 'REINFORCED', incidents_30d: 112 },
  { region: 'Jendouba', units: 8, status: 'NORMAL', incidents_30d: 34 },
  { region: 'Tataouine', units: 9, status: 'NORMAL', incidents_30d: 28 },
];

const policeUseOfForce = [
  { type: 'Tear Gas', incidents: 28, trend: '+12%', status: 'ELEVATED' },
  { type: 'Baton / Crowd Control', incidents: 45, trend: '+8%', status: 'ELEVATED' },
  { type: 'Rubber Bullets', incidents: 12, trend: '+22%', status: 'HIGH' },
  { type: 'Live Ammunition', incidents: 2, trend: 'STABLE', status: 'CRITICAL' },
  { type: 'Water Cannon', incidents: 8, trend: '+5%', status: 'NORMAL' },
];

export const SecurityIntelligence: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'STRATEGIC' | 'BORDER' | 'CRIME' | 'SAFETY' | 'TACTICAL' | 'CYBER' | 'PRISON' | 'POLICE'>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Intelligence', icon: LayoutGrid },
    { id: 'STRATEGIC', label: 'Strategic Readiness', icon: Shield },
    { id: 'BORDER', label: 'Border & Migration', icon: Navigation },
    { id: 'CRIME', label: 'Narcotics & Crime', icon: FlaskConical },
    { id: 'SAFETY', label: 'Public Safety', icon: Siren },
    { id: 'CYBER', label: 'Cyber Warfare', icon: Wifi },
    { id: 'PRISON', label: 'Prison System', icon: Lock },
    { id: 'POLICE', label: 'Police Operations', icon: ShieldAlert },
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
        title="Security Intelligence"
        subtitle="Real-time threat assessment, border dynamics, and strategic readiness analysis"
        icon={Shield}
        nodeId="SEC-NODE-04"
      />

      <LiveTicker items={securityAlerts} />

      {/* Strategic Links Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
        <div className="glass p-3 md:p-4 rounded-xl md:rounded-2xl border border-intel-border flex items-center justify-between group cursor-pointer hover:border-intel-cyan/50 transition-all"
             onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'political', subTab: 'freedom' } }))}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-intel-cyan/10 rounded-xl border border-intel-cyan/20 group-hover:bg-intel-cyan/20 transition-all">
              <Lock className="w-6 h-6 text-intel-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Decree 54 Tracker</h3>
              <p className="text-[10px] text-slate-500 font-mono">Monitor institutional erosion & press freedom</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-intel-cyan transition-all" />
        </div>

        <div className="glass p-3 md:p-4 rounded-xl md:rounded-2xl border border-intel-border flex items-center justify-between group cursor-pointer hover:border-intel-orange/50 transition-all"
             onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'political', subTab: 'movements' } }))}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-intel-orange/10 rounded-xl border border-intel-orange/20 group-hover:bg-intel-orange/20 transition-all">
              <Users className="w-6 h-6 text-intel-orange" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Civil Movements</h3>
              <p className="text-[10px] text-slate-500 font-mono">Real-time protest frequency & social actors</p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-intel-orange transition-all" />
        </div>
      </div>

      {/* CATEGORY SELECTOR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-intel-border/30 pb-4 sticky top-0 bg-black/50 backdrop-blur-md z-50 py-2">
        {prepareList(categories).map((cat: any) => (
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
          {prepareList([
            { label: 'National Threat Level', value: 'Level 4', status: 'CRITICAL', icon: ShieldAlert },
            { label: 'Ongoing Operations', value: '12', status: 'ACTIVE', icon: Target },
            { label: 'Surveillance Nodes', value: '842', status: 'STABLE', icon: Eye },
            { label: 'Border Integrity', value: '94%', status: 'STABLE', icon: ShieldCheck },
          ]).map((metric: any, i: number) => (
            <div key={metric.id} className="glass p-3 md:p-4 rounded-xl md:rounded-2xl border border-intel-border relative overflow-hidden group">
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
          <div className="lg:col-span-1 glass p-5 md:p-6 rounded-2xl border border-intel-border">
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
          <div className="lg:col-span-2 glass p-5 md:p-6 rounded-2xl border border-intel-border">
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
            <div className="lg:col-span-2 glass p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
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
            <div className="glass p-5 md:p-6 rounded-2xl border border-intel-border space-y-8">
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-white uppercase tracking-tight border-b border-intel-border pb-4">Maritime Readiness</h4>
                <div className="space-y-4">
                  {prepareList(maritimeSecurityMetrics).map((metric: any, i: number) => (
                    <div key={metric.id} className="p-4 rounded-xl bg-white/5 border border-intel-border flex flex-col justify-between group hover:border-intel-cyan/30 transition-all">
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
                  {prepareList(migrationHotspots).map((hotspot: any, i: number) => (
                    <div key={hotspot.id} className="p-3 rounded-xl bg-white/5 border border-intel-border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-white uppercase">{hotspot.name}</span>
                        <span className={`text-[8px] font-mono font-bold ${hotspot.risk === 'CRITICAL' ? 'text-intel-red' : hotspot.risk === 'HIGH' ? 'text-intel-orange' : 'text-intel-cyan'}`}>{hotspot.risk}</span>
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
        <div className="lg:col-span-1 glass p-5 md:p-6 rounded-2xl border border-intel-border flex flex-col">
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
        <div className="lg:col-span-3 glass p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
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
        <div className="lg:col-span-2 glass p-5 md:p-6 rounded-2xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Strategic Seizures</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Top Substances & Market Impact</p>
            </div>
            <FlaskConical className="w-5 h-5 text-intel-cyan" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {prepareList(drugSeizures).map((item: any, i: number) => (
                <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-intel-cyan/30 transition-all">
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
                    {prepareList(drugSeizures).map((entry: any, index: number) => (
                      <Cell key={entry.id} fill={entry.color} />
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
        <div className="lg:col-span-1 glass p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Consumption Profile</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Market Prevalence</p>
            </div>
            <Pill className="w-5 h-5 text-intel-cyan" />
          </div>
          <div className="space-y-6">
            {prepareList(drugConsumptionData).map((drug: any, i: number) => (
              <div key={drug.id} className="space-y-2">
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
        <div className="lg:col-span-2 glass p-5 md:p-6 rounded-2xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Trafficking Vector Analysis</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Active Narcotics Routes & Border Dynamics</p>
            </div>
            <Navigation className="w-5 h-5 text-intel-cyan" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prepareList(traffickingRoutes).map((route: any, i: number) => (
              <div key={route.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative overflow-hidden group">
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

        <div className="lg:col-span-1 glass p-5 md:p-6 rounded-2xl border border-intel-border flex flex-col justify-between">
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
            <div className="lg:col-span-2 glass p-5 md:p-6 rounded-2xl border border-intel-border space-y-6">
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
                  {prepareList(accidentCauses).map((cause: any, i: number) => (
                    <div key={assertKey(getRenderKey(cause, i, 'seccau'))} className="space-y-2">
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
                  {prepareList([
                    { route: 'GP1: Tunis - Sousse', risk: 'EXTREME', trend: 'High speed / Heavy traffic' },
                    { route: 'GP3: Kairouan - Gafsa', risk: 'HIGH', trend: 'Poor lighting / Infrastructure' },
                    { route: 'GP11: Bizerte - Menzel Bourguiba', risk: 'HIGH', trend: 'Urban congestion' },
                  ]).map((route: any, i: number) => (
                    <div key={assertKey(getRenderKey(route, i, 'seccor'))} className="p-3 rounded-xl bg-white/5 border border-intel-border">
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

      {/* CATEGORY 6: CYBER WARFARE & DIGITAL THREATS */}
      {(activeCategory === 'ALL' || activeCategory === 'CYBER') && (
        <div className="space-y-6 relative z-20">
          <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
            <Wifi className="w-4 h-4 text-intel-cyan" />
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Cyber Warfare & Digital Threats</h3>
            <span className="text-[8px] font-mono px-2 py-0.5 rounded border text-intel-red border-intel-red/30 bg-intel-red/5 ml-auto uppercase">Level 2 Alert Active</span>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Threat Actors', value: '4', color: 'text-intel-red', sub: '1 state-sponsored' },
              { label: 'Incidents MTD', value: '78', color: 'text-intel-orange', sub: '+31% vs last month' },
              { label: 'Critical Infra Targeted', value: '6', color: 'text-intel-red', sub: 'Energy, Finance, Gov' },
              { label: 'Cyber Defense Score', value: '65/100', color: 'text-intel-orange', sub: 'Below threshold' },
            ].map((k, i) => (
              <div key={i} className="glass rounded-xl border border-intel-border p-4 space-y-2">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
                <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Incident trend + target matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cyber Incident Trend — by Attack Vector</div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cyberIncidentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="ddos" stackId="a" fill="#ef4444" name="DDoS" />
                    <Bar dataKey="phishing" stackId="a" fill="#f97316" name="Phishing" />
                    <Bar dataKey="intrusion" stackId="a" fill="#8b5cf6" name="Intrusion" />
                    <Bar dataKey="defacement" stackId="a" fill="#64748b" radius={[2,2,0,0]} name="Defacement" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Critical Infrastructure Target Matrix</div>
              <div className="space-y-2">
                {cyberTargets.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <div>
                      <div className="text-[10px] font-mono text-white">{t.target}</div>
                      <div className="text-[8px] font-mono text-slate-600">{t.vector} · {t.lastAttempt}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${t.threat === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' : t.threat === 'HIGH' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>{t.threat}</span>
                      <span className={`text-[8px] font-mono font-bold ${t.status === 'DEFENDED' || t.status === 'BLOCKED' || t.status === 'PATCHED' ? 'text-intel-cyan' : 'text-intel-orange'}`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Threat actors */}
          <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Known Threat Actor Profiles</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cyberThreatActors.map((a, i) => (
                <div key={i} className={`p-4 rounded-xl border space-y-2 ${a.activity === 'ELEVATED' ? 'border-intel-orange/30 bg-intel-orange/5' : 'border-intel-border bg-white/[0.02]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white">{a.name}</span>
                    <span className={`text-[7px] font-mono px-1 py-0.5 rounded border uppercase ${a.activity === 'ELEVATED' ? 'text-intel-orange border-intel-orange/30' : 'text-slate-500 border-slate-700'}`}>{a.activity}</span>
                  </div>
                  <div className="space-y-1 text-[9px] font-mono">
                    <div><span className="text-slate-600">Origin: </span><span className="text-slate-400">{a.origin}</span></div>
                    <div><span className="text-slate-600">Motive: </span><span className="text-slate-400">{a.motivation}</span></div>
                    <div><span className="text-slate-600">Capability: </span><span className={a.capability === 'HIGH' ? 'text-intel-red' : a.capability === 'MEDIUM' ? 'text-intel-orange' : 'text-intel-cyan'}>{a.capability}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY 7: PRISON SYSTEM */}
      {(activeCategory === 'ALL' || activeCategory === 'PRISON') && (
        <div className="space-y-6 relative z-20">
          <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
            <Lock className="w-4 h-4 text-intel-red" />
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Prison System Intelligence</h3>
            <span className="text-[8px] font-mono px-2 py-0.5 rounded border text-intel-red border-intel-red/30 bg-intel-red/5 ml-auto uppercase">Overcrowding: Critical</span>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'System Occupancy', value: '196%', color: 'text-intel-red', sub: 'National average' },
              { label: 'Total Prisoners', value: '24,800', color: 'text-intel-orange', sub: 'Capacity: 12,600' },
              { label: 'Radicalization Cases', value: '44%', color: 'text-intel-red', sub: 'Salafi — Mornaguia' },
              { label: 'Incidents MTD', value: '47', color: 'text-intel-orange', sub: 'Riots, strikes, assaults' },
            ].map((k, i) => (
              <div key={i} className="glass rounded-xl border border-intel-border p-4 space-y-2">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
                <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Overcrowding table + incidents */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Facility Occupancy Matrix</div>
              <div className="space-y-2">
                {prisonData.map((p, i) => (
                  <div key={i} className="space-y-1.5 py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white">{p.facility}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold font-mono ${p.risk === 'CRITICAL' ? 'text-intel-red' : p.risk === 'HIGH' ? 'text-intel-orange' : 'text-yellow-400'}`}>{p.occupancy}%</span>
                        <span className={`text-[7px] font-mono px-1 py-0.5 rounded border uppercase ${p.risk === 'CRITICAL' ? 'text-intel-red border-intel-red/30' : p.risk === 'HIGH' ? 'text-intel-orange border-intel-orange/30' : 'text-yellow-400 border-yellow-400/30'}`}>{p.risk}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.risk === 'CRITICAL' ? 'bg-intel-red' : p.risk === 'HIGH' ? 'bg-intel-orange' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, p.occupancy / 2.5)}%` }} />
                    </div>
                    <div className="text-[8px] font-mono text-slate-600">{p.population.toLocaleString()} / {p.capacity.toLocaleString()} capacity</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Prison Incidents — Monthly Trend</div>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prisonIncidentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="assaults" stackId="a" fill="#64748b" name="Assaults" />
                      <Bar dataKey="hunger_strikes" stackId="a" fill="#f59e0b" name="Hunger Strikes" />
                      <Bar dataKey="riots" stackId="a" fill="#ef4444" radius={[2,2,0,0]} name="Riots" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Radicalization Profile Trend (Mornaguia)</div>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={radicalizationInPrisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Line type="monotone" dataKey="salafi" stroke="#ef4444" strokeWidth={2} dot={false} name="Salafi Radicalization %" />
                      <Line type="monotone" dataKey="political" stroke="#f97316" strokeWidth={2} dot={false} name="Political Extremism %" />
                      <Line type="monotone" dataKey="criminal" stroke="#64748b" strokeWidth={2} dot={false} name="Criminal Networks %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-xl bg-intel-red/5 border border-intel-red/20">
            <AlertTriangle className="w-4 h-4 text-intel-red shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
              <span className="text-intel-red font-bold">RRI LINKAGE:</span> Prison overcrowding (EQ.21 MII modifier) at 196% national average creates a radicalization accelerant. Mornaguia's salafi network exposure has risen from 12% to 44% since 2020. Release cycles feed directly into tracked extremist networks. This is a structural instability multiplier on EQ.7 elite defection dynamics.
            </p>
          </div>
        </div>
      )}

      {/* CATEGORY 8: POLICE OPERATIONS */}
      {(activeCategory === 'ALL' || activeCategory === 'POLICE') && (
        <div className="space-y-6 relative z-20">
          <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
            <ShieldAlert className="w-4 h-4 text-intel-cyan" />
            <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Police Operations & Force Posture</h3>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Raids MTD', value: '68', color: 'text-intel-cyan', sub: '+24% vs last month' },
              { label: 'Arrests MTD', value: '197', color: 'text-intel-orange', sub: '62% pre-trial detention' },
              { label: 'Decree 54 Charges', value: '67', color: 'text-intel-red', sub: 'Active prosecutions' },
              { label: 'Force Incidents', value: '93', color: 'text-intel-orange', sub: '+18% trend' },
            ].map((k, i) => (
              <div key={i} className="glass rounded-xl border border-intel-border p-4 space-y-2">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
                <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Ops trend + deployment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Police Operations — Monthly Trend</div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={policeOpsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                    <Bar dataKey="raids" fill="rgba(0,242,255,0.3)" radius={[2,2,0,0]} name="Raids" />
                    <Line type="monotone" dataKey="arrests" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 3 }} name="Arrests" />
                    <Line type="monotone" dataKey="seizures" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Seizures" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Regional Deployment Matrix</div>
              <div className="space-y-2">
                {policeDeploymentData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-[10px] font-mono text-white">{r.region}</div>
                      <div className="text-[8px] font-mono text-slate-600">{r.units} units · {r.incidents_30d} incidents/30d</div>
                    </div>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${r.status === 'REINFORCED' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' : r.status === 'ELEVATED' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : 'text-slate-500 border-slate-700'}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Use of force table */}
          <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Use of Force Register — MTD</div>
              <span className="text-[8px] font-mono text-intel-orange px-2 py-0.5 border border-intel-orange/30 rounded uppercase">Trend: Escalating</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Force Type', 'Incidents', 'Trend', 'Status'].map(h => (
                      <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {policeUseOfForce.map((f, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-2 text-[10px] font-mono text-white pr-4">{f.type}</td>
                      <td className="py-2 text-[11px] font-bold font-mono text-intel-cyan pr-4">{f.incidents}</td>
                      <td className="py-2 text-[10px] font-mono text-intel-orange pr-4">{f.trend}</td>
                      <td className="py-2">
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${f.status === 'CRITICAL' ? 'text-intel-red border-intel-red/30' : f.status === 'HIGH' || f.status === 'ELEVATED' ? 'text-intel-orange border-intel-orange/30' : 'text-slate-500 border-slate-700'}`}>{f.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-intel-orange/5 border border-intel-orange/20">
              <AlertCircle className="w-3.5 h-3.5 text-intel-orange shrink-0 mt-0.5" />
              <p className="text-[9px] font-mono text-slate-400 leading-relaxed">2 live ammunition incidents recorded MTD. Social media monitoring shows civilian documentation of 3 additional unregistered incidents in Sidi Bouzid. RRI social input elevated: S.1 Protest Activity rising.</p>
            </div>
          </div>
        </div>
      )}

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
            {prepareList(hotspots).map((spot: any, index: number) => (
              <div key={assertKey(getRenderKey(spot, index, 'sechot'))} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-intel-border hover:border-intel-cyan/30 transition-all group">
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
