import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert,
  Target,
  Brain,
  Dna,
  RefreshCcw,
  ChevronRight,
  Info,
  Lock,
  BrainCircuit
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

// --- Data & Types ---

const simAlerts = [
  { code: 'SIM-MODEL-01', title: 'Monte Carlo Simulation: 84% Convergence', impact: 'STABLE' },
  { code: 'SIM-RISK-04', title: 'High Probability: Interior Unrest Spike', impact: 'HIGH' },
  { code: 'SIM-DEBT-09', title: 'Debt Sustainability: Critical Threshold', impact: 'CRITICAL' },
  { code: 'SIM-SOCIAL-12', title: 'Social Tension: Regional Variance High', impact: 'HIGH' },
  { code: 'SIM-FOREX-02', title: 'BCT Reserves: 72-Day Floor Breach', impact: 'CRITICAL' }
];

interface CrisisEvent {
  id: string;
  label: string;
  description: string;
  impact: number;
  type: 'crisis' | 'stabilizing';
}

const CRISIS_EVENTS: CrisisEvent[] = [
  { id: 'imf_fail', label: 'IMF Deal Collapses Permanently', description: 'No external financing. Debt default within 6 months.', impact: 12, type: 'crisis' },
  { id: 'subsidies_cut', label: 'Bread/Oil Subsidies Cut 50%', description: 'Immediate street protests. Interior regions most affected.', impact: 18, type: 'crisis' },
  { id: 'ugtt_strike', label: 'UGTT Calls General Strike', description: 'Economic paralysis. Government under maximum pressure.', impact: 14, type: 'crisis' },
  { id: 'forex_low', label: 'Forex Reserves Hit 60-Day Mark', description: 'Import disruptions. Medicine and food shortages begin.', impact: 16, type: 'crisis' },
  { id: 'gafsa_violent', label: 'Gafsa Strike Turns Violent', description: 'Security forces deployed. Media blackout attempted.', impact: 11, type: 'crisis' },
  { id: 'military_statement', label: 'Military Issues Political Statement', description: 'CRITICAL SIGNAL. Historical precedent for regime change.', impact: 22, type: 'crisis' },
  { id: 'libya_border', label: 'Armed Militia Crosses Libya Border', description: 'Security crisis. Military deployment. Nationalist mobilisation.', impact: 8, type: 'crisis' },
  { id: 'health_crisis', label: 'Presidential Health Crisis / Incapacity', description: 'Power vacuum. Succession unclear under 2022 constitution.', impact: 20, type: 'crisis' },
  { id: 'uae_withdraw', label: 'UAE Withdraws Financial Support', description: 'Key bilateral financing cut. Political isolation deepens.', impact: 10, type: 'crisis' },
  { id: 'dinar_fall', label: 'Dinar Falls 30% Overnight', description: 'Imported goods crisis. Black market explodes. Panic buying.', impact: 15, type: 'crisis' },
  { id: 'eu_suspend', label: 'EU Suspends Tunisia Partnership', description: 'Trade disruption. Remittance complications. Diplomatic isolation.', impact: 9, type: 'crisis' },
  { id: 'drought', label: 'Major Drought – Water Rationing', description: 'Agricultural collapse. Interior cities under water stress.', impact: 7, type: 'crisis' },
];

const STABILIZING_EVENTS: CrisisEvent[] = [
  { id: 'imf_signed', label: 'IMF Deal Signed', description: 'External financing restored. Confidence returns.', impact: -14, type: 'stabilizing' },
  { id: 'gulf_loan', label: 'Gulf Bridge Loan $2B', description: 'Short-term forex pressure relieved.', impact: -10, type: 'stabilizing' },
  { id: 'ugtt_wage', label: 'UGTT Wage Deal Reached', description: 'Strike threat removed. Social tension reduces.', impact: -9, type: 'stabilizing' },
  { id: 'gafsa_resume', label: 'Gafsa Production Fully Resumes', description: 'Forex earnings recover. Interior employment stabilises.', impact: -7, type: 'stabilizing' },
  { id: 'tourism_surge', label: 'Tourism Surge (+40%)', description: 'Coastal employment. Forex inflows. Optimism signal.', impact: -5, type: 'stabilizing' },
];

const FORECAST_DATA = [
  { date: 'Mar 26', base: 68.7, escalation: 68.7, recovery: 68.7 },
  { date: 'Apr 26', base: 70.2, escalation: 74.5, recovery: 65.1 },
  { date: 'May 26', base: 71.5, escalation: 78.2, recovery: 62.4 },
  { date: 'Jun 26', base: 73.1, escalation: 82.4, recovery: 59.8 },
  { date: 'Jul 26', base: 74.8, escalation: 86.1, recovery: 57.2 },
  { date: 'Aug 26', base: 76.2, escalation: 89.5, recovery: 55.4 },
  { date: 'Sep 26', base: 77.5, escalation: 92.8, recovery: 53.1 },
];

const PROBABILITY_MATRIX = [
  { event: 'Interior City Unrest (Gafsa/Kasserine)', prob: 74, trigger: 'Strike escalation + power cuts', color: '#ef4444' },
  { event: 'UGTT General Strike', prob: 68, trigger: 'Wage negotiation failure', color: '#ef4444' },
  { event: 'Dinar Official Devaluation', prob: 55, trigger: 'BCT forex floor collapse', color: '#f97316' },
  { event: 'Major Urban Protest (Tunis)', prob: 41, trigger: 'Food price spike + UGTT mobilisation', color: '#f97316' },
  { event: 'Subsidy Reform Announcement', prob: 34, trigger: 'IMF condition or fiscal necessity', color: '#eab308' },
  { event: 'Debt Restructuring / Default', prob: 28, trigger: 'External debt service failure', color: '#eab308' },
  { event: 'IMF Deal (any form)', prob: 22, trigger: 'Fiscal emergency forces Saied\'s hand', color: '#22c55e' },
  { event: 'Security Force Defection (local)', prob: 12, trigger: 'Salary delays in interior units', color: '#ef4444' },
  { event: 'Early Election / Constitutional Change', prob: 8, trigger: 'Massive protest wave + elite defection', color: '#ef4444' },
];

// --- Components ---

export const StrategicModeling: React.FC = () => {
  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const baseRRI = 68.7;

  const simulatedRRI = useMemo(() => {
    const delta = activeEvents.reduce((acc, id) => {
      const event = [...CRISIS_EVENTS, ...STABILIZING_EVENTS].find(e => e.id === id);
      return acc + (event?.impact || 0);
    }, 0);
    return Math.min(100, Math.max(0, baseRRI + delta));
  }, [activeEvents]);

  const toggleEvent = (id: string) => {
    setActiveEvents(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const resetSimulator = () => setActiveEvents([]);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Strategic Forecasting & Crisis Modeling"
        subtitle="Advanced simulation engine for modeling political-economic shocks and predictive scenario analysis"
        icon={BrainCircuit}
        nodeId="STRAT-NODE-09"
      />

      <LiveTicker items={simAlerts} />

      {/* Section 1: Crisis Simulator */}
      <div className="glass p-8 rounded-3xl border border-intel-border space-y-8">
        <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
          <Zap className="w-5 h-5 text-intel-cyan" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Crisis Simulator</h3>
            <p className="text-[10px] text-slate-500 uppercase">Toggle events to model combined effect on RRI score</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: RRI Score & Radar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="text-center p-8 bg-intel-bg/50 rounded-2xl border border-intel-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-intel-cyan to-transparent opacity-50"></div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Simulated RRI Score</div>
              <div className={`text-6xl font-bold font-mono mb-2 ${simulatedRRI > 75 ? 'text-intel-red' : simulatedRRI > 60 ? 'text-intel-orange' : 'text-intel-green'}`}>
                {simulatedRRI.toFixed(1)}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${simulatedRRI > 75 ? 'text-intel-red' : simulatedRRI > 60 ? 'text-intel-orange' : 'text-intel-green'}`}>
                {simulatedRRI > 75 ? 'CRITICAL - Extreme Unrest Risk' : simulatedRRI > 60 ? 'HIGH - Significant Unrest Risk' : 'MODERATE - Managed Risk'}
              </div>
              <div className="mt-4 text-[10px] font-mono text-slate-600">
                Base: {baseRRI} → Delta: {(simulatedRRI - baseRRI).toFixed(1)}
              </div>
            </div>

            <div className="h-64 w-full bg-intel-bg/30 rounded-2xl border border-intel-border p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { subject: 'E(t)', A: 81, fullMark: 100 },
                  { subject: 'S(t)', A: 73, fullMark: 100 },
                  { subject: 'P(t)', A: 69, fullMark: 100 },
                  { subject: 'M(t)', A: 31, fullMark: 100 },
                  { subject: 'R(t)', A: 58, fullMark: 100 },
                ]}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                  <Radar name="Simulated" dataKey="A" stroke="#00f2ff" fill="#00f2ff" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Event Toggles */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-intel-red">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Crisis Events (toggle to activate)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CRISIS_EVENTS.map(event => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={`text-left p-4 rounded-xl border transition-all group ${
                      activeEvents.includes(event.id)
                        ? 'bg-intel-red/10 border-intel-red/50'
                        : 'bg-white/5 border-intel-border hover:border-intel-red/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold uppercase tracking-tight ${activeEvents.includes(event.id) ? 'text-intel-red' : 'text-white'}`}>
                        {event.label}
                      </span>
                      <span className="text-[10px] font-mono text-intel-red">+{event.impact} RRI</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight">{event.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-intel-green">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Stabilising Events (toggle to activate)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STABILIZING_EVENTS.map(event => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={`text-left p-4 rounded-xl border transition-all group ${
                      activeEvents.includes(event.id)
                        ? 'bg-intel-green/10 border-intel-green/50'
                        : 'bg-white/5 border-intel-border hover:border-intel-green/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold uppercase tracking-tight ${activeEvents.includes(event.id) ? 'text-intel-green' : 'text-white'}`}>
                        {event.label}
                      </span>
                      <span className="text-[10px] font-mono text-intel-green">{event.impact} RRI</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight">{event.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Predictive Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Forecast Chart */}
        <div className="lg:col-span-8 glass p-8 rounded-3xl border border-intel-border space-y-8">
          <div className="flex items-center justify-between border-b border-intel-border pb-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-intel-cyan" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Predictive Engine</h3>
                <p className="text-[10px] text-slate-500 uppercase">RRI 6-Month Forecast — Scenario Comparison</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                 <span className="text-[8px] font-mono text-slate-500 uppercase">Base</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                 <span className="text-[8px] font-mono text-slate-500 uppercase">Escalation</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-intel-green"></div>
                 <span className="text-[8px] font-mono text-slate-500 uppercase">Recovery</span>
               </div>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={FORECAST_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="base" stroke="#00f2ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="escalation" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="recovery" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            {[
              { label: 'Base Case', prob: '52%', rri: '77.5', color: 'border-intel-cyan/30' },
              { label: 'Escalation', prob: '28%', rri: '92.8', color: 'border-intel-red/30' },
              { label: 'Recovery', prob: '14%', rri: '53.1', color: 'border-intel-green/30' },
              { label: 'Crisis/Rupture', prob: '6%', rri: '98.5', color: 'border-intel-purple/30' },
            ].map((scenario, i) => (
              <div key={i} className={`p-4 rounded-xl bg-white/5 border ${scenario.color}`}>
                <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">{scenario.label}</div>
                <div className="flex items-end justify-between">
                  <div className="text-xl font-bold text-white">{scenario.prob}</div>
                  <div className="text-[10px] font-mono text-slate-400">RRI: {scenario.rri}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Probability Matrix */}
        <div className="lg:col-span-4 glass p-8 rounded-3xl border border-intel-border space-y-8">
          <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
            <Target className="w-5 h-5 text-intel-orange" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Probability Matrix</h3>
              <p className="text-[10px] text-slate-500 uppercase">Key Event Likelihood & Triggers</p>
            </div>
          </div>

          <div className="space-y-6">
            {PROBABILITY_MATRIX.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-white uppercase tracking-tight">{item.event}</div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">Trigger: {item.trigger}</div>
                  </div>
                  <div className="text-sm font-bold font-mono text-white">{item.prob}%</div>
                </div>
                <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.prob}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full" 
                    style={{ backgroundColor: item.color }}
                  ></motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Game Theory Analysis */}
      <div className="glass p-8 rounded-3xl border border-intel-border space-y-8">
        <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
          <Brain className="w-5 h-5 text-intel-purple" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Game Theory Analysis</h3>
            <p className="text-[10px] text-slate-500 uppercase">Strategic interaction modelling of key political-economic conflicts</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Game 1: Subsidy Reform */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-intel-purple uppercase">Chicken Game</div>
                <h4 className="text-xl font-bold text-white tracking-tight">Subsidy Reform Game</h4>
                <p className="text-xs text-slate-500">Players: Saied Government vs. UGTT / Citizens</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-intel-bg/50 rounded-2xl border border-intel-border overflow-hidden">
                <div className="grid grid-cols-3 border-b border-intel-border bg-intel-card/50">
                  <div className="p-3 border-r border-intel-border"></div>
                  <div className="p-3 border-r border-intel-border text-[10px] font-bold text-intel-cyan uppercase text-center">UGTT: Accommodate</div>
                  <div className="p-3 text-[10px] font-bold text-intel-red uppercase text-center">UGTT: Strike</div>
                </div>
                <div className="grid grid-cols-3 border-b border-intel-border">
                  <div className="p-3 border-r border-intel-border text-[10px] font-bold text-intel-cyan uppercase flex items-center">Gov: Cut Subsidies</div>
                  <div className="p-4 border-r border-intel-border text-[9px] text-slate-400 text-center">(+IMF deal, -popularity) / (-wage, -food)</div>
                  <div className="p-4 text-[9px] text-slate-400 text-center">(IMF deal, regime collapse risk) / (Strike wins)</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-3 border-r border-intel-border text-[10px] font-bold text-intel-green uppercase flex items-center">Gov: Maintain Subsidies</div>
                  <div className="p-4 border-r border-intel-border text-[9px] text-slate-400 text-center">(Fiscal crisis delayed) / (Status quo)</div>
                  <div className="p-4 text-[9px] text-slate-400 text-center">(Fiscal crisis + social crisis) / (Partial win)</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-intel-green/5 border border-intel-green/20 rounded-xl">
                  <div className="text-[10px] font-bold text-intel-green uppercase mb-1">Nash Equilibrium</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No stable Nash Equilibrium — pure chicken game. Both prefer the other blinks first. Most likely outcome: periodic brinkmanship, temporary agreements, crisis deferred.
                  </p>
                </div>
                <div className="p-4 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
                  <div className="text-[10px] font-bold text-intel-orange uppercase mb-1">Intelligence Insight</div>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    Saied is locked in a commitment problem: he publicly rejected IMF conditions, making capitulation domestically costly. UGTT knows this and maximises its leverage. This structural standoff is the primary medium-term stability risk.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Game 2: Regime Survival */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-intel-purple uppercase">Coordination Failure</div>
                <h4 className="text-xl font-bold text-white tracking-tight">Regime Survival vs. Opposition</h4>
                <p className="text-xs text-slate-500">Players: Saied Regime vs. Fragmented Opposition</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-intel-purple animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-intel-bg/50 rounded-2xl border border-intel-border overflow-hidden">
                <div className="grid grid-cols-3 border-b border-intel-border bg-intel-card/50">
                  <div className="p-3 border-r border-intel-border"></div>
                  <div className="p-3 border-r border-intel-border text-[10px] font-bold text-intel-cyan uppercase text-center">Opposition: Coordinate</div>
                  <div className="p-3 text-[10px] font-bold text-intel-red uppercase text-center">Opposition: Stay Fragmented</div>
                </div>
                <div className="grid grid-cols-3 border-b border-intel-border">
                  <div className="p-3 border-r border-intel-border text-[10px] font-bold text-intel-red uppercase flex items-center">Regime: Repress</div>
                  <div className="p-4 border-r border-intel-border text-[9px] text-slate-400 text-center">(Regime risk ↑, opposition risk ↑) / (High cost)</div>
                  <div className="p-4 text-[9px] text-slate-400 text-center">(Regime safe) / (Opposition loses)</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-3 border-r border-intel-border text-[10px] font-bold text-intel-green uppercase flex items-center">Regime: Tolerate</div>
                  <div className="p-4 border-r border-intel-border text-[9px] text-slate-400 text-center">(Regime risk moderate) / (Opposition gains space)</div>
                  <div className="p-4 text-[9px] text-slate-400 text-center">(Status quo) / (Opposition weak)</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-intel-green/5 border border-intel-green/20 rounded-xl">
                  <div className="text-[10px] font-bold text-intel-green uppercase mb-1">Nash Equilibrium</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nash Equilibrium: Regime Represses / Opposition stays Fragmented. This is the current stable (but suboptimal) outcome. Stable until an external shock (economic collapse) forces opposition coordination.
                  </p>
                </div>
                <div className="p-4 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
                  <div className="text-[10px] font-bold text-intel-orange uppercase mb-1">Intelligence Insight</div>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    The UGTT is the only actor capable of forcing coordination — it has members across political lines. A UGTT general strike could be the coordination mechanism that breaks the current equilibrium.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="p-6 bg-intel-card/30 border border-intel-border rounded-2xl flex items-start space-x-4">
        <Info className="w-5 h-5 text-slate-500 mt-0.5" />
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-white uppercase tracking-widest">Methodology Note</div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            All predictions are probabilistic estimates derived from historical precedent, current indicator analysis, and scenario modelling. They do not constitute intelligence assessments and should not be used as sole basis for decisions. The primary purpose is to structure thinking about risk, not predict specific events.
          </p>
        </div>
      </div>
    </div>
  );
};
