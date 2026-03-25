import React, { useState, useMemo, useEffect } from 'react';
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
  BrainCircuit,
  Users,
  Clock,
  Database,
  Shield
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
import { usePipeline } from '../context/PipelineContext';

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

const DEFAULT_PROBS: Record<string, number> = {
  imf_fail: 35,
  subsidies_cut: 25,
  ugtt_strike: 62,
  forex_low: 48,
  gafsa_violent: 71,
  military_statement: 8,
  libya_border: 22,
  health_crisis: 12,
  uae_withdraw: 18,
  dinar_fall: 28,
  eu_suspend: 15,
  drought: 44,
};

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
  const { data, rriState, recalculateRRI, updateField } = usePipeline();
  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const [eventProbabilities, setEventProbabilities] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('ti_scenario_probs');
    return saved ? JSON.parse(saved) : {};
  });

  const [scenarioActive, setScenarioActive] = useState(false);
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({});
  const [scenarioResult, setScenarioResult] = useState<{
    new_rri: number;
    new_p_rev: number;
    delta_rri: number;
    delta_p_rev: number;
  } | null>(null);

  const [baselineScores, setBaselineScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!scenarioActive && rriState.category_scores && Object.keys(rriState.category_scores).length > 0) {
      setBaselineScores(rriState.category_scores);
    }
  }, [scenarioActive, rriState.category_scores]);

  const radarData = useMemo(() => {
    const categories = [
      { key: 'A', label: 'Economic' },
      { key: 'E', label: 'Social' },
      { key: 'D', label: 'Political' },
      { key: 'N', label: 'Security' },
      { key: 'L', label: 'Regime' },
      { key: 'I', label: 'External' },
    ];

    return categories.map(cat => ({
      subject: cat.label,
      A: Math.round((baselineScores[cat.key] ?? rriState.category_scores?.[cat.key] ?? 0.6) * 100),
      B: scenarioActive ? Math.round((rriState.category_scores?.[cat.key] ?? 0) * 100) : undefined,
      fullMark: 100
    }));
  }, [baselineScores, rriState.category_scores, scenarioActive]);

  const [baselineRRI, setBaselineRRI] = useState({ rri: 2.31, p_rev: 0.643 });

  useEffect(() => {
    if (!scenarioActive && rriState.rri) {
      setBaselineRRI({ rri: rriState.rri, p_rev: rriState.p_rev });
    }
  }, [scenarioActive, rriState.rri, rriState.p_rev]);

  const baseRRI = rriState.p_rev * 100;

  useEffect(() => {
    localStorage.setItem('ti_scenario_probs', JSON.stringify(eventProbabilities));
  }, [eventProbabilities]);

  const compositeRisk = useMemo(() => {
    const events = CRISIS_EVENTS;
    const totalWeightedRisk = events.reduce((sum, event) => {
      const prob = (eventProbabilities[event.id] ?? DEFAULT_PROBS[event.id] ?? 20) / 100;
      return sum + (prob * event.impact);
    }, 0);
    const maxPossible = events.reduce((sum, e) => sum + e.impact, 0);
    return Math.round((totalWeightedRisk / maxPossible) * 100);
  }, [eventProbabilities]);

  const handleRunScenario = () => {
    // Save current values
    const saved = {
      fx_reserves: data.economy.fx_reserves,
      inflation: data.economy.inflation,
      protest_events_30d: data.social.protest_events_30d,
      ugtt_mobilisation_level: data.social.ugtt_mobilisation_level,
      imf_deal_probability: data.geopolitical?.imf_deal_probability ?? 31,
      tnd_usd: data.economy.tnd_usd,
      fdi_inflow_usd: data.economy.fdi_inflow_usd,
      parallel_market_premium: data.economy.parallel_market_premium,
      water_crisis_govs: data.social.water_crisis_govs,
    };
    setOriginalValues(saved);

    // Apply scenario overrides based on active events
    activeEvents.forEach(eventId => {
      switch(eventId) {
        case 'imf_fail':
          updateField('geopolitical.imf_deal_probability', 0, 'Scenario Simulator');
          updateField('economy.fx_reserves', Math.max(50, data.economy.fx_reserves - 15), 'Scenario Simulator');
          break;
        case 'subsidies_cut':
          updateField('economy.inflation', data.economy.inflation + 4.5, 'Scenario Simulator');
          updateField('social.protest_events_30d', data.social.protest_events_30d + 18, 'Scenario Simulator');
          break;
        case 'ugtt_strike':
          updateField('social.ugtt_mobilisation_level', 'HIGH', 'Scenario Simulator');
          updateField('social.protest_events_30d', data.social.protest_events_30d + 14, 'Scenario Simulator');
          break;
        case 'forex_low':
          updateField('economy.fx_reserves', 60, 'Scenario Simulator');
          updateField('economy.parallel_market_premium', (data.economy.parallel_market_premium || 18) + 8, 'Scenario Simulator');
          break;
        case 'gafsa_violent':
          updateField('social.protest_events_30d', data.social.protest_events_30d + 11, 'Scenario Simulator');
          updateField('economy.fx_reserves', Math.max(55, data.economy.fx_reserves - 8), 'Scenario Simulator');
          break;
        case 'military_statement':
          updateField('social.protest_events_30d', data.social.protest_events_30d + 22, 'Scenario Simulator');
          break;
        case 'dinar_fall':
          updateField('economy.tnd_usd', data.economy.tnd_usd * 1.3, 'Scenario Simulator');
          updateField('economy.inflation', data.economy.inflation + 6, 'Scenario Simulator');
          break;
        case 'eu_suspend':
          updateField('economy.fdi_inflow_usd', (data.economy.fdi_inflow_usd || 0.9) * 0.4, 'Scenario Simulator');
          break;
        case 'drought':
          updateField('social.water_crisis_govs', Math.min(24, (data.social.water_crisis_govs || 8) + 4), 'Scenario Simulator');
          break;
        // Stabilizing events
        case 'imf_signed':
          updateField('geopolitical.imf_deal_probability', 95, 'Scenario Simulator');
          updateField('economy.fx_reserves', data.economy.fx_reserves + 20, 'Scenario Simulator');
          break;
        case 'gulf_loan':
          updateField('economy.fx_reserves', data.economy.fx_reserves + 18, 'Scenario Simulator');
          break;
        case 'ugtt_wage':
          updateField('social.ugtt_mobilisation_level', 'MODERATE', 'Scenario Simulator');
          updateField('social.protest_events_30d', Math.max(5, data.social.protest_events_30d - 12), 'Scenario Simulator');
          break;
      }
    });

    setScenarioActive(true);

    // Trigger recalculation after state updates
    setTimeout(() => {
      recalculateRRI();
      setTimeout(() => {
        setScenarioResult({
          new_rri: rriState.rri,
          new_p_rev: rriState.p_rev,
          delta_rri: rriState.rri - baselineRRI.rri,
          delta_p_rev: rriState.p_rev - baselineRRI.p_rev,
        });
      }, 300);
    }, 100);
  };

  const handleResetScenario = () => {
    Object.entries(originalValues).forEach(([key, value]) => {
      if (key === 'ugtt_mobilisation_level') {
        updateField('social.ugtt_mobilisation_level', value, 'Scenario Simulator');
      } else if (['fx_reserves','inflation','tnd_usd','fdi_inflow_usd',
                   'parallel_market_premium'].includes(key)) {
        updateField(`economy.${key}`, value, 'Scenario Simulator');
      } else if (['protest_events_30d','water_crisis_govs'].includes(key)) {
        updateField(`social.${key}`, value, 'Scenario Simulator');
      } else if (key === 'imf_deal_probability') {
        updateField('geopolitical.imf_deal_probability', value, 'Scenario Simulator');
      }
    });
    recalculateRRI();
    setScenarioActive(false);
    setScenarioResult(null);
    setActiveEvents([]);
  };

  const FORECAST_DATA = useMemo(() => {
    const months = ['Now','Apr','May','Jun','Jul','Aug','Sep'];
    const baseP = rriState.p_rev * 100;
    const velocity = rriState.velocity;

    // Base case: current trajectory continues
    // Escalation: velocity accelerates by 50%
    // Recovery: velocity reverses

    return months.map((month, i) => {
      const base = Math.min(99, Math.max(1,
        baseP + (velocity * 8 * i)
      ));
      const escalation = Math.min(99, Math.max(1,
        baseP + (Math.max(velocity, 0.05) * 12 * i)
      ));
      const recovery = Math.min(99, Math.max(1,
        baseP + (Math.min(velocity, -0.03) * 10 * i)
      ));
      return { date: month, base, escalation, recovery };
    });
  }, [rriState.p_rev, rriState.velocity]);

  const scenarios = useMemo(() => {
    const baseEndP = FORECAST_DATA[FORECAST_DATA.length - 1]?.base ?? 70;
    const escalEndP = FORECAST_DATA[FORECAST_DATA.length - 1]?.escalation ?? 85;
    const recEndP = FORECAST_DATA[FORECAST_DATA.length - 1]?.recovery ?? 55;
    return [
      {
        label: 'Base Case',
        prob: rriState.velocity > 0.1 ? '48%' : '54%',
        rri: (baseEndP).toFixed(1) + '%',
        color: 'border-intel-cyan/30'
      },
      {
        label: 'Escalation',
        prob: rriState.compound_stress > 0.08 ? '32%' : '24%',
        rri: (escalEndP).toFixed(1) + '%',
        color: 'border-intel-red/30'
      },
      {
        label: 'Recovery',
        prob: rriState.velocity < -0.05 ? '18%' : '12%',
        rri: (recEndP).toFixed(1) + '%',
        color: 'border-intel-green/30'
      },
      {
        label: 'Crisis/Rupture',
        prob: rriState.rri > 2.5 ? '8%' : '4%',
        rri: '95+%',
        color: 'border-intel-purple/30'
      },
    ];
  }, [FORECAST_DATA, rriState]);

  const toggleEvent = (id: string) => {
    setActiveEvents(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const resetSimulator = () => setActiveEvents([]);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Strategic Intelligence & Crisis Analysis"
        subtitle="Game theory, coalition dynamics, and scenario modeling for Tunisia's critical political-economic juncture"
        icon={BrainCircuit}
        nodeId="STRAT-NODE-09"
      />

      <div className="flex items-center space-x-6 p-4 rounded-xl
        bg-black/30 border border-intel-border text-[10px] font-mono
        overflow-x-auto scrollbar-hide">
        <span className="text-slate-500 shrink-0">Live baseline:</span>
        <span className="shrink-0">
          R(t) = <strong className="text-white">{rriState.rri.toFixed(4)}</strong>
        </span>
        <span className="shrink-0">
          P_rev = <strong className="text-white">{(rriState.p_rev*100).toFixed(1)}%</strong>
        </span>
        <span className="shrink-0">
          V(t) = <strong className={rriState.velocity > 0 ? 'text-intel-red' : 'text-intel-cyan'}>
            {rriState.velocity > 0 ? '+' : ''}{rriState.velocity.toFixed(3)}
          </strong>
        </span>
        <span className="shrink-0">
          CS(t) = <strong className="text-intel-orange">{rriState.compound_stress.toFixed(3)}</strong>
        </span>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }))}
          className="ml-auto shrink-0 text-intel-cyan hover:underline"
        >
          → Methodology
        </button>
      </div>

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
            <div className="text-center p-8 bg-intel-bg/50 rounded-2xl
              border border-intel-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1
                bg-gradient-to-r from-transparent via-intel-cyan
                to-transparent opacity-50" />

              {/* Baseline */}
              <div className="text-[9px] font-mono text-slate-500
                uppercase tracking-widest mb-1">Baseline P_rev</div>
              <div className="text-3xl font-bold font-mono text-white mb-1">
                {(rriState.p_rev * 100).toFixed(1)}%
              </div>
              <div className="text-[9px] font-mono text-slate-600 mb-4">
                R(t) = {rriState.rri.toFixed(4)}
              </div>

              {/* Scenario result */}
              {scenarioResult && (
                <div className={`mt-4 pt-4 border-t border-intel-border space-y-1 ${
                  scenarioResult.delta_rri > 0.3
                    ? 'border-intel-red/50'
                    : 'border-intel-orange/30'
                }`}>
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">Scenario P_rev</div>
                  <div className={`text-4xl font-bold font-mono ${
                    scenarioResult.new_p_rev > 0.80 ? 'text-intel-red' :
                    scenarioResult.new_p_rev > 0.70 ? 'text-intel-orange' :
                    'text-intel-cyan'
                  }`}>
                    {(scenarioResult.new_p_rev * 100).toFixed(1)}%
                  </div>
                  <div className={`text-[10px] font-mono font-bold ${
                    scenarioResult.delta_p_rev > 0 ? 'text-intel-red' : 'text-intel-cyan'
                  }`}>
                    {scenarioResult.delta_p_rev > 0 ? '+' : ''}
                    {(scenarioResult.delta_p_rev * 100).toFixed(1)}% from baseline
                  </div>
                  <div className="text-[9px] font-mono text-slate-600">
                    R(t) = {scenarioResult.new_rri.toFixed(4)}
                    {' '}({scenarioResult.delta_rri > 0 ? '+' : ''}
                    {scenarioResult.delta_rri.toFixed(4)})
                  </div>
                  {scenarioResult.new_rri > 2.625 && (
                    <div className="text-[9px] font-mono text-intel-red
                      font-bold animate-pulse">
                      ⚠ REVOLUTION THRESHOLD BREACHED IN SCENARIO
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRunScenario}
                disabled={activeEvents.length === 0}
                className={`flex-1 py-3 rounded-xl text-[10px] font-mono
                  font-bold uppercase tracking-wider transition-all ${
                  activeEvents.length > 0
                    ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 hover:bg-intel-cyan/20'
                    : 'bg-white/5 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                ⚡ Run RRI Scenario ({activeEvents.length} events)
              </button>
              {scenarioActive && (
                <button
                  onClick={handleResetScenario}
                  className="px-4 py-3 rounded-xl text-[10px] font-mono
                    text-slate-400 border border-intel-border
                    hover:text-white hover:border-slate-600 transition-all"
                >
                  ↺ Reset
                </button>
              )}
            </div>

            <div className="h-64 w-full bg-intel-bg/30 rounded-2xl border border-intel-border p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                  <Radar name="Baseline" dataKey="A" stroke="#00f2ff" fill="#00f2ff" fillOpacity={0.3} />
                  {scenarioActive && (
                    <Radar 
                      name="Scenario" 
                      dataKey="B" 
                      stroke="#ff453a" 
                      fill="#ff453a" 
                      fillOpacity={0.15} 
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>
              <div className="text-[8px] font-mono text-slate-600 text-center">
                {scenarioActive
                  ? 'Cyan = baseline · Red = scenario'
                  : 'Live RRI category scores'}
              </div>
            </div>
          </div>

          {/* Right: Event Toggles */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-intel-red">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Crisis Events (toggle to activate)</span>
              </div>

              <div className="intel-card p-6 rounded-2xl border border-intel-border mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Composite Crisis Risk Score</div>
                  <div className={`text-4xl font-bold font-mono ${
                    compositeRisk > 60 ? 'text-intel-red' : 
                    compositeRisk > 35 ? 'text-intel-orange' : 'text-intel-cyan'
                  }`}>{compositeRisk}%</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1">
                    Based on probability × impact across all scenarios
                  </div>
                </div>
                <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      compositeRisk > 60 ? 'bg-intel-red' : 
                      compositeRisk > 35 ? 'bg-intel-orange' : 'bg-intel-cyan'
                    }`}
                    style={{ width: compositeRisk + '%' }}
                  />
                </div>
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
                    
                    <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-slate-500 uppercase">
                          Probability Estimate
                        </span>
                        <span className={`text-xs font-bold font-mono ${
                          (eventProbabilities[event.id] ?? DEFAULT_PROBS[event.id] ?? 20) > 60 
                            ? 'text-intel-red' 
                            : (eventProbabilities[event.id] ?? DEFAULT_PROBS[event.id] ?? 20) > 35 
                            ? 'text-intel-orange' 
                            : 'text-intel-cyan'
                        }`}>
                          {eventProbabilities[event.id] ?? DEFAULT_PROBS[event.id] ?? 20}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={eventProbabilities[event.id] ?? DEFAULT_PROBS[event.id] ?? 20}
                        onChange={(e) => setEventProbabilities(prev => ({
                          ...prev,
                          [event.id]: parseInt(e.target.value)
                        }))}
                        className="w-full h-1 accent-intel-cyan cursor-pointer"
                      />
                    </div>
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

      {/* Section 2: Coalition Stability Monitor */}
      <div className="glass p-8 rounded-3xl border border-intel-border
        space-y-8">
        <div className="flex items-center space-x-3 border-b
          border-intel-border pb-4">
          <Users className="w-5 h-5 text-intel-cyan" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white uppercase
              tracking-tight">Coalition Stability Monitor</h3>
            <p className="text-[10px] text-slate-500 uppercase">
              Selectorate theory — who is in the winning coalition
              and under what conditions they defect
            </p>
          </div>
          <div className="ml-auto text-[8px] font-mono text-slate-600">
            Based on Bueno de Mesquita selectorate theory
          </div>
        </div>

        {/* Elite Defection Probability from RRI engine */}
        <div className="flex items-center space-x-4 p-4 rounded-xl
          bg-black/30 border border-intel-border">
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              Elite Defection Probability — EQ.7
            </div>
            <div className={`text-2xl font-bold font-mono ${
              rriState.elite_defection_prob > 0.3 ? 'text-intel-red' :
              rriState.elite_defection_prob > 0.15 ? 'text-intel-orange' :
              'text-intel-cyan'
            }`}>
              {(rriState.elite_defection_prob * 100).toFixed(1)}%
            </div>
          </div>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                rriState.elite_defection_prob > 0.3 ? 'bg-intel-red' :
                rriState.elite_defection_prob > 0.15 ? 'bg-intel-orange' :
                'bg-intel-cyan'
              }`}
              style={{ width: `${rriState.elite_defection_prob * 100}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-slate-600">
            Nash threshold: {(10 + 0.05 * rriState.rri).toFixed(2)}
          </div>
        </div>

        {/* 6 Coalition Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              group: 'Military & Security',
              status: 'IN COALITION',
              loyalty: 88,
              defection_risk: 12,
              leverage: 'Salary payments, promotions, autonomy',
              trigger: 'Salary delays >3 months OR order to fire on crowds',
              rri_var: 'N141',
              color: 'cyan',
              icon: '🛡',
              trend: 'stable',
              note: `Gen. Ammar — historically apolitical. Security score: ${Math.round((rriState.category_scores?.['N'] ?? 0.55) * 100)}%.`
            },
            {
              group: 'Business Elite',
              status: 'WAVERING',
              loyalty: 52,
              defection_risk: 48,
              leverage: 'Import licenses, credit access, offshore privileges',
              trigger: 'FX controls tighten further OR parallel market hits 25%',
              rri_var: 'L123',
              color: 'orange',
              icon: '💼',
              trend: 'declining',
              note: `Capital flight proxy (${data.economy.parallel_market_premium}% parallel premium) signals hedging.`
            },
            {
              group: 'Gulf State Allies',
              status: 'CONDITIONAL',
              loyalty: 61,
              defection_risk: 39,
              leverage: 'Financial support, diplomatic cover, legitimacy',
              trigger: 'IMF deal collapse OR major human rights incident',
              rri_var: 'I91',
              color: 'yellow',
              icon: '🌍',
              trend: 'stable',
              note: 'UAE and Saudi support is transactional — not ideological.'
            },
            {
              group: 'Judiciary & Technocrats',
              status: 'CAPTURED',
              loyalty: 35,
              defection_risk: 65,
              leverage: 'Appointment power, budget control, immunity from Decree 54',
              trigger: 'Regime asks them to enforce clearly illegal orders',
              rri_var: 'D42',
              color: 'red',
              icon: '⚖',
              trend: 'declining',
              note: 'CSM dissolved. Judiciary nominally loyal but institutionally degraded.'
            },
            {
              group: 'Civil Society & UGTT',
              status: 'OPPOSITION',
              loyalty: 15,
              defection_risk: 85,
              leverage: 'None currently — regime does not need this group',
              trigger: 'Any further wage erosion OR major Decree 54 escalation',
              rri_var: 'M_UGTT',
              color: 'red',
              icon: '✊',
              trend: 'deteriorating',
              note: 'UGTT formal break with regime is complete. Strike probability 64%.'
            },
            {
              group: 'EU & International',
              status: 'TRANSACTIONAL',
              loyalty: 44,
              defection_risk: 56,
              leverage: 'Migration deal funding, trade preferences, IMF mediation',
              trigger: 'Human rights violations become internationally undeniable',
              rri_var: 'I92',
              color: 'orange',
              icon: '🇪🇺',
              trend: 'stable',
              note: 'EU prioritizes migration control over democracy — explicit policy.'
            },
          ].map((group, i) => (
            <div key={i} className={`p-5 rounded-2xl border space-y-3 ${
              group.status === 'IN COALITION'
                ? 'border-intel-cyan/20 bg-intel-cyan/5'
                : group.status === 'OPPOSITION'
                ? 'border-intel-red/20 bg-intel-red/5'
                : group.status === 'WAVERING' || group.status === 'CAPTURED'
                ? 'border-intel-orange/20 bg-intel-orange/5'
                : 'border-yellow-500/20 bg-yellow-500/5'
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{group.icon}</span>
                    <span className="text-xs font-bold text-white uppercase">
                      {group.group}
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono px-2 py-0.5
                    rounded border uppercase font-bold ${
                    group.status === 'IN COALITION'
                      ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
                      : group.status === 'OPPOSITION'
                      ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                      : group.status === 'WAVERING'
                      ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                      : group.status === 'CAPTURED'
                      ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                      : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                  }`}>{group.status}</span>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-[8px] font-mono text-slate-600">Defection risk</div>
                  <div className={`text-lg font-bold font-mono ${
                    group.defection_risk > 60 ? 'text-intel-red' :
                    group.defection_risk > 35 ? 'text-intel-orange' :
                    'text-intel-cyan'
                  }`}>{group.defection_risk}%</div>
                </div>
              </div>

              {/* Loyalty bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-mono">
                  <span className="text-slate-600">Loyalty</span>
                  <span className="text-white">{group.loyalty}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      group.loyalty > 70 ? 'bg-intel-cyan' :
                      group.loyalty > 45 ? 'bg-intel-orange' : 'bg-intel-red'
                    } transition-all`}
                    style={{ width: `${group.loyalty}%` }}
                  />
                </div>
              </div>

              {/* Trend */}
              <div className="flex items-center space-x-2 text-[9px] font-mono">
                <span className="text-slate-600">Trend:</span>
                <span className={
                  group.trend === 'stable' ? 'text-slate-400' :
                  group.trend === 'declining' ? 'text-intel-orange' :
                  'text-intel-red'
                }>
                  {group.trend === 'stable' ? '→ STABLE' :
                   group.trend === 'declining' ? '↓ DECLINING' :
                   '↓↓ DETERIORATING'}
                </span>
              </div>

              {/* Defection trigger */}
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-slate-600 uppercase">
                  Defection trigger:
                </div>
                <div className="text-[9px] text-intel-orange leading-snug">
                  {group.trigger}
                </div>
              </div>

              {/* Leverage */}
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-slate-600 uppercase">
                  Regime leverage:
                </div>
                <div className="text-[9px] text-slate-400 leading-snug">
                  {group.leverage}
                </div>
              </div>

              {/* Note */}
              <div className="pt-2 border-t border-intel-border/20
                text-[8px] text-slate-600 italic leading-snug">
                {group.note}
              </div>

              {/* RRI variable link */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(
                  'navigate-to-methodology', { detail: { equation: '7' } }
                ))}
                className="text-[8px] font-mono text-intel-cyan/50
                  hover:text-intel-cyan transition-colors"
              >
                RRI var: {group.rri_var} → EQ.7
              </button>
            </div>
          ))}
        </div>

        {/* Coalition stability summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-intel-border">
          <div className="text-center space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              Winning Coalition Size
            </div>
            <div className="text-2xl font-bold font-mono text-intel-cyan">
              2/6
            </div>
            <div className="text-[9px] text-slate-600">
              Military + Gulf (minimal)
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              Coalition Stability
            </div>
            <div className="text-2xl font-bold font-mono text-intel-orange">
              FRAGILE
            </div>
            <div className="text-[9px] text-slate-600">
              One defection = critical
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              Elite Cohesion EC(t)
            </div>
            <div className={`text-2xl font-bold font-mono ${
              rriState.elite_cohesion_dynamics < 0.5 ? 'text-intel-red' :
              rriState.elite_cohesion_dynamics < 0.65 ? 'text-intel-orange' :
              'text-intel-cyan'
            }`}>
              {(rriState.elite_cohesion_dynamics * 100).toFixed(0)}%
            </div>
            <div className="text-[9px] text-slate-600">
              EQ.18 — declining trend
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
            <div className="text-[10px] font-bold text-intel-cyan uppercase mb-1">Security Sector Note</div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Current security score is {(rriState.category_scores.N * 100).toFixed(1)}%. Military remains the primary pillar of support, but interior ministry cohesion is showing signs of stress due to resource constraints.
            </p>
          </div>
          <div className="p-4 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
            <div className="text-[10px] font-bold text-intel-orange uppercase mb-1">Economic Note</div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              Parallel market premium at {data.economy.parallel_market_premium}% is driving capital flight. This directly impacts the regime's ability to maintain the loyalty of the business elite.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Predictive Engine */}
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
            {scenarios.map((scenario, i) => (
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

          {/* Game 3: Three-Player Interaction */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-intel-purple uppercase">
                  Three-Player Coordination Game
                </div>
                <h4 className="text-xl font-bold text-white tracking-tight">
                  Regime × UGTT × Military
                </h4>
                <p className="text-xs text-slate-500">
                  Critical triad — the three actors whose combined
                  choices determine regime survival
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse" />
            </div>

            {/* Payoff matrix — 3 player simplified */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-[9px] font-mono border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-slate-600 font-normal border border-intel-border/30 bg-black/20">
                      Military stance →
                    </th>
                    <th className="p-3 text-center text-intel-cyan uppercase border border-intel-border/30 bg-black/20" colSpan={2}>
                      Military: LOYAL
                    </th>
                    <th className="p-3 text-center text-intel-red uppercase border border-intel-border/30 bg-black/20" colSpan={2}>
                      Military: DEFECTS
                    </th>
                  </tr>
                  <tr>
                    <th className="p-3 text-left text-slate-600 font-normal border border-intel-border/30 bg-black/20">
                      UGTT stance ↓
                    </th>
                    <th className="p-3 text-center text-intel-cyan border border-intel-border/30 bg-black/20">
                      UGTT: Moderate
                    </th>
                    <th className="p-3 text-center text-intel-orange border border-intel-border/30 bg-black/20">
                      UGTT: Strike
                    </th>
                    <th className="p-3 text-center text-intel-cyan border border-intel-border/30 bg-black/20">
                      UGTT: Moderate
                    </th>
                    <th className="p-3 text-center text-intel-orange border border-intel-border/30 bg-black/20">
                      UGTT: Strike
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: 'Regime: Concede',
                      cells: [
                        { content: 'Regime survives weakened\nUGTT wins partial\nMilitary neutral', color: 'text-intel-cyan', bg: 'bg-intel-cyan/5', outcome: 'STABLE-WEAK' },
                        { content: 'Regime loses legitimacy\nUGTT wins major\nMilitary stays neutral', color: 'text-intel-orange', bg: 'bg-intel-orange/5', outcome: 'REGIME CRISIS' },
                        { content: 'IMPOSSIBLE — Military\ndefection + concession\n= immediate collapse', color: 'text-intel-red', bg: 'bg-intel-red/5', outcome: 'COLLAPSE' },
                        { content: 'Transition scenario\nNegotiated exit\nMilitary mediates', color: 'text-intel-purple', bg: 'bg-intel-purple/5', outcome: 'TRANSITION' },
                      ]
                    },
                    {
                      label: 'Regime: Hold Firm',
                      cells: [
                        { content: 'Current equilibrium\nRegime stable short-term\nPressure building', color: 'text-slate-400', bg: 'bg-white/5', outcome: 'STATUS QUO ★' },
                        { content: 'Maximum pressure\nRegime vulnerable\nMilitary decision point', color: 'text-intel-orange', bg: 'bg-intel-orange/5', outcome: 'HIGH RISK' },
                        { content: 'Coup scenario\nMilitary takes power\nUGTT uncertain ally', color: 'text-intel-red', bg: 'bg-intel-red/5', outcome: 'COUP RISK' },
                        { content: 'Revolutionary scenario\nAll actors against regime\nCollapse probable', color: 'text-intel-red', bg: 'bg-intel-red/10', outcome: 'REVOLUTION RISK' },
                      ]
                    },
                  ].map((row, rowI) => (
                    <tr key={rowI}>
                      <td className="p-3 font-bold text-white border border-intel-border/30 bg-black/10 uppercase text-[9px]">
                        {row.label}
                      </td>
                      {row.cells.map((cell, cellI) => (
                        <td key={cellI} className={`p-3 border border-intel-border/30 ${cell.bg}`}>
                          <div className={`text-[8px] font-mono ${cell.color} leading-relaxed whitespace-pre-line`}>
                            {cell.content}
                          </div>
                          <div className={`mt-2 text-[7px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block ${
                            cell.outcome === 'STATUS QUO ★'
                              ? 'text-slate-400 border-slate-700 bg-slate-900'
                              : cell.outcome.includes('REVOLUTION') || cell.outcome === 'COLLAPSE'
                              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                              : cell.outcome.includes('COUP') || cell.outcome === 'REGIME CRISIS'
                              ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                              : cell.outcome === 'TRANSITION'
                              ? 'text-intel-purple border-intel-purple/30 bg-intel-purple/10'
                              : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
                          }`}>
                            {cell.outcome}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Current equilibrium analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl space-y-2">
                <div className="text-[10px] font-bold text-intel-cyan uppercase">
                  Current Equilibrium — STATUS QUO ★
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Regime holds firm. UGTT applies pressure but stops short
                  of general strike. Military remains loyal.
                  This is the stable (but fragile) current state.
                  P_rev = {(rriState.p_rev * 100).toFixed(1)}% — elevated but
                  below revolution threshold.
                </p>
              </div>
              <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl space-y-2">
                <div className="text-[10px] font-bold text-intel-red uppercase">
                  Critical Transition Path
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  STATUS QUO → HIGH RISK requires only UGTT escalation to
                  full strike (probability: {eventProbabilities['ugtt_strike'] ?? DEFAULT_PROBS['ugtt_strike']}%).
                  HIGH RISK → REVOLUTION RISK additionally requires military
                  defection (probability: {rriState.elite_defection_prob
                    ? (rriState.elite_defection_prob * 100).toFixed(0)
                    : 12}%).
                  Combined path probability:{' '}
                  {(
                    ((eventProbabilities['ugtt_strike'] ?? DEFAULT_PROBS['ugtt_strike']) / 100) *
                    (rriState.elite_defection_prob || 0.12) * 100
                  ).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Intelligence insight */}
            <div className="p-4 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
              <div className="text-[10px] font-bold text-intel-orange uppercase mb-2">
                Strategic Intelligence Insight
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                "The three-player game reveals why the regime is stable
                despite extreme economic pressure: Military loyalty is the
                load-bearing pillar. Saied does not need popular legitimacy,
                UGTT cooperation, or international approval as long as
                the military stays loyal. The ONLY path to rapid regime change
                is military defection — which requires either an order to fire
                on crowds (EQ.7 Nash threshold breach) or severe salary delays.
                This is why monitoring N141 (Military Loyalty) is the single
                most important intelligence variable in the entire model."
              </p>
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
