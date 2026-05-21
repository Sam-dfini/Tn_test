import { safeStorage } from '../../utils/storage';
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
  Shield,
  Layers,
  Radio,
  Network
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
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from '../shared/ProfessionalShared';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import {
  computeAllFrameworks, buildFrameworkInput,
  FrameworkOutput, FragilityOutput, ConflictRiskOutput,
  StrategicPressureOutput, InformationEnvironmentOutput,
  CascadeOutput, EliteGameOutput, ContradictionOutput,
} from '../../services/Frameworkadapters';

// --- Data & Types ---

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

const DEFAULT_PROBS_FALLBACK: Record<string, number> = {
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

const PROBABILITY_MATRIX_CONFIG = [
  { event: 'Interior City Unrest (Gafsa/Kasserine)', trigger: 'Strike escalation + power cuts' },
  { event: 'UGTT General Strike', trigger: 'Wage negotiation failure' },
  { event: 'Dinar Official Devaluation', trigger: 'BCT forex floor collapse' },
  { event: 'Major Urban Protest (Tunis)', trigger: 'Food price spike + UGTT mobilisation' },
  { event: 'Subsidy Reform Announcement', trigger: 'IMF condition or fiscal necessity' },
  { event: 'Debt Restructuring / Default', trigger: 'External debt service failure' },
  { event: 'IMF Deal (any form)', trigger: 'Fiscal emergency forces Saied\'s hand' },
  { event: 'Security Force Defection (local)', trigger: 'Salary delays in interior units' },
  { event: 'Early Election / Constitutional Change', trigger: 'Massive protest wave + elite defection' },
];

// --- Authored actor metadata (analytical judgments, not framework-derived) ---

const ACTOR_META: Record<string, {
  icon: string;
  leverage: string;
  trigger: string;
  rri_var: string;
  note: (catN: number, premium: number, strikeProb: number) => string;
}> = {
  'Military Command': {
    icon: '🛡',
    leverage: 'Salary payments, promotions, autonomy',
    trigger: 'Salary delays >3 months OR order to fire on crowds',
    rri_var: 'N141',
    note: (catN) => `Gen. Ammar — historically apolitical. Security score: ${catN}%.`,
  },
  'Security Apparatus': {
    icon: '🚔',
    leverage: 'Interior ministry budget, Decree 54 enforcement powers',
    trigger: 'Wage delays OR sustained protest wave >60 days',
    rri_var: 'N142',
    note: () => 'Ministry of Interior — key internal stability enforcer. Salary discipline is paramount.',
  },
  'UGTT Leadership': {
    icon: '✊',
    leverage: 'None currently — regime does not need this group',
    trigger: 'Any further wage erosion OR major Decree 54 escalation',
    rri_var: 'M_UGTT',
    note: (_, __, strikeProb) => `UGTT formal break with regime is complete. Strike probability ${strikeProb}%.`,
  },
  'Business Elite / UTICA': {
    icon: '💼',
    leverage: 'Import licenses, credit access, offshore privileges',
    trigger: 'FX controls tighten further OR parallel market hits 25%',
    rri_var: 'L123',
    note: (_, premium) => `Capital flight proxy (${premium}% parallel premium) signals hedging.`,
  },
  'Loyalist Cabinet': {
    icon: '🏛',
    leverage: 'Appointment power, budget control, immunity from Decree 54',
    trigger: 'Regime asks them to enforce clearly illegal orders',
    rri_var: 'D42',
    note: () => 'Core political circle — loyalty is transactional. Institutions degraded.',
  },
  'Independent Judiciary (residual)': {
    icon: '⚖',
    leverage: 'Appointment power, budget control, immunity from Decree 54',
    trigger: 'Regime asks them to enforce clearly illegal orders',
    rri_var: 'D42',
    note: () => 'CSM dissolved. Judiciary nominally loyal but institutionally degraded.',
  },
};

const EXTERNAL_ACTORS = [
  {
    group: 'Gulf State Allies',
    status: 'CONDITIONAL',
    loyalty: 61,
    defection_risk: 39,
    leverage: 'Financial support, diplomatic cover, legitimacy',
    trigger: 'IMF deal collapse OR major human rights incident',
    rri_var: 'I91',
    icon: '🌍',
    trend: 'stable',
    note: 'UAE and Saudi support is transactional — not ideological.',
  },
  {
    group: 'EU & International',
    status: 'TRANSACTIONAL',
    loyalty: 44,
    defection_risk: 56,
    leverage: 'Migration deal funding, trade preferences, IMF mediation',
    trigger: 'Human rights violations become internationally undeniable',
    rri_var: 'I92',
    icon: '🇪🇺',
    trend: 'stable',
    note: 'EU prioritizes migration control over democracy — explicit policy.',
  },
];

const STATUS_DISPLAY: Record<string, string> = {
  LOYAL: 'IN COALITION',
  WAVERING: 'WAVERING',
  DEFECTION_RISK: 'CAPTURED',
  DEFECTED: 'OPPOSITION',
};

const STATUS_TREND: Record<string, string> = {
  LOYAL: 'stable',
  WAVERING: 'declining',
  DEFECTION_RISK: 'deteriorating',
  DEFECTED: 'deteriorating',
};

// --- Components ---

export const StrategicModeling: React.FC = () => {
  const { fullData: data, rriState, recalculateRRI, updateField, rpiProfile, cognitiveEnvironment, seiResult } = useRiskMetrics();
  const { miiProfile } = useAIAnalysis();
  const [activeTab, setActiveTab] = useState<'crisis' | 'coalition' | 'predictive' | 'gametheory' | 'multiframework'>('crisis');
  const [activeEvents, setActiveEvents] = useState<string[]>([]);
  const [eventProbabilities, setEventProbabilities] = useState<Record<string, number>>(() => {
    const saved = safeStorage.getItem('ti_scenario_probs');
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

  const defaultProbs = useMemo(() => {
    const ugttLevel = data.social.ugtt_mobilisation_level;
    const fxReserves = data.economy.fx_reserves ?? 150;
    const premium = data.economy.parallel_market_premium ?? 18;
    const waterCrisis = data.social.water_crisis_govs ?? 8;
    const imfProb = data.geopolitical.imf_deal_probability ?? 31;

    return {
      ...DEFAULT_PROBS_FALLBACK,
      imf_fail: Math.min(90, Math.max(5, 100 - imfProb * 0.8)),
      ugtt_strike: ugttLevel === 'HIGH' ? 68 : ugttLevel === 'ELEVATED' ? 45 : 35,
      forex_low: Math.min(85, Math.max(5, Math.round((150 - fxReserves) * 0.6))),
      dinar_fall: Math.min(80, Math.max(5, Math.round(premium * 0.8 + 10))),
      drought: Math.min(75, Math.max(5, Math.round(waterCrisis * 3))),
    };
  }, [data.social.ugtt_mobilisation_level, data.economy.fx_reserves, data.economy.parallel_market_premium, data.social.water_crisis_govs, data.geopolitical.imf_deal_probability]);

  const compositeRisk = useMemo(() => {
    const events = CRISIS_EVENTS;
    const totalWeightedRisk = events.reduce((sum, event) => {
      const prob = (eventProbabilities[event.id] ?? defaultProbs[event.id] ?? 20) / 100;
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

  // Build framework input and compute all six frameworks
  const frameworkOutput = useMemo<FrameworkOutput>(() => {
    const input = buildFrameworkInput(rriState, data, {
      miiProfile: miiProfile ?? undefined,
      rpiProfile: rpiProfile ?? undefined,
      cognitiveEnvironment: cognitiveEnvironment ?? undefined,
      seiResult: seiResult ?? undefined,
    });
    return computeAllFrameworks(input);
  }, [rriState, data, miiProfile, rpiProfile, cognitiveEnvironment, seiResult]);

  const coalitionGroups = useMemo(() => {
    const catN = Math.round((rriState.category_scores?.['N'] ?? 0.55) * 100);
    const premium = data.economy.parallel_market_premium ?? 18;
    const strikeProb = rriState.category_scores?.M_UGTT
      ? Math.round(rriState.category_scores.M_UGTT * 100)
      : 64;

    const internal = frameworkOutput.eliteGame.actors.map(a => {
      const meta = ACTOR_META[a.name];
      return {
        group: a.name,
        status: STATUS_DISPLAY[a.status] ?? a.status,
        loyalty: a.loyalty,
        defection_risk: a.defectionRisk,
        leverage: meta?.leverage ?? '',
        trigger: meta?.trigger ?? '',
        rri_var: meta?.rri_var ?? '',
        icon: meta?.icon ?? '▪',
        trend: STATUS_TREND[a.status] ?? 'stable',
        note: meta ? meta.note(catN, premium, strikeProb) : '',
      };
    });
    return [...internal, ...EXTERNAL_ACTORS];
  }, [frameworkOutput.eliteGame, rriState.category_scores, data.economy.parallel_market_premium]);

  const coalitionStability = useMemo(() => {
    const e = frameworkOutput.eliteGame;
    const loyalCount = e.actors.filter(a => a.status === 'LOYAL').length;
    const totalCount = e.actors.length;
    const stabilityLabel = e.nashEquilibrium === 'STABLE' ? 'STABLE'
      : e.nashEquilibrium === 'UNSTABLE' ? 'FRAGILE' : 'CRITICAL';
    const loyalNames = e.actors.filter(a => a.status === 'LOYAL')
      .map(a => a.name.replace(/ .*/, '')).join(' + ');
    return { loyalCount, totalCount, stabilityLabel, loyalNames };
  }, [frameworkOutput.eliteGame]);

  const probabilityMatrix = useMemo(() => {
    const e = frameworkOutput.eliteGame;
    const c = frameworkOutput.cascade;
    const cr = frameworkOutput.conflictRisk;
    const sp = frameworkOutput.strategicPressure;
    const ie = frameworkOutput.informationEnvironment;
    const ugttLevel = data.social.ugtt_mobilisation_level;
    const premium = data.economy.parallel_market_premium ?? 18;
    const fxReserves = data.economy.fx_reserves ?? 150;
    const imfProb = data.geopolitical.imf_deal_probability ?? 31;

    const interiorUnrest = () => {
      const interior = c.governorateRisks
        .filter(g => ['Gafsa', 'Kasserine', 'Sidi Bouzid', 'Kebili'].includes(g.name));
      const avg = interior.length > 0
        ? interior.reduce((s, g) => s + g.risk, 0) / interior.length
        : cr.mobilization;
      return Math.min(95, Math.max(5, Math.round(avg + 8)));
    };

    const ugttStrike = () => {
      if (ugttLevel === 'HIGH') return 68;
      if (ugttLevel === 'ELEVATED') return 45;
      return 20;
    };

    const devaluation = () => {
      const p = Math.round(premium * 2 + (150 - fxReserves) / 3);
      return Math.min(95, Math.max(5, p));
    };

    const urbanProtest = () => {
      const p = Math.round(cr.mobilization * 0.5 + ie.outrageMomentum * 0.3 + (data.social.protest_events_30d ?? 5) * 2);
      return Math.min(90, Math.max(5, p));
    };

    const subsidyReform = () => {
      const p = Math.round((100 - imfProb) * 0.4 + sp.stageScore * 0.3 + (data.economy.inflation ?? 7) * 2);
      return Math.min(85, Math.max(5, p));
    };

    const debtRestructuring = () => {
      const p = Math.round((150 - fxReserves) * 0.3 + (rriState.rri - 2) * 20);
      return Math.min(90, Math.max(5, p));
    };

    const imfDeal = () => {
      return Math.min(85, Math.max(5, Math.round(imfProb * 0.6 + (100 - premium * 2) * 0.2)));
    };

    const securityDefection = () => {
      const secActor = e.actors.find(a => a.name === 'Security Apparatus');
      return secActor ? Math.round(secActor.defectionRisk * 0.7) : 15;
    };

    const earlyElection = () => {
      const p = Math.round((rriState.rri - 2.3) * 30 + e.cascadeDefectionRisk * 0.3);
      return Math.min(60, Math.max(2, p));
    };

    const computeColor = (p: number) =>
      p >= 55 ? '#ef4444' : p >= 35 ? '#f97316' : p >= 20 ? '#eab308' : '#22c55e';

    return PROBABILITY_MATRIX_CONFIG.map(cfg => {
      const prob = (() => {
        switch (cfg.event) {
          case 'Interior City Unrest (Gafsa/Kasserine)': return interiorUnrest();
          case 'UGTT General Strike': return ugttStrike();
          case 'Dinar Official Devaluation': return devaluation();
          case 'Major Urban Protest (Tunis)': return urbanProtest();
          case 'Subsidy Reform Announcement': return subsidyReform();
          case 'Debt Restructuring / Default': return debtRestructuring();
          case 'IMF Deal (any form)': return imfDeal();
          case 'Security Force Defection (local)': return securityDefection();
          case 'Early Election / Constitutional Change': return earlyElection();
          default: return 20;
        }
      })();
      return { ...cfg, prob, color: computeColor(prob) };
    });
  }, [frameworkOutput, data, rriState.rri]);

  const simAlerts = useMemo(() => {
    const alerts: Array<{ code: string; title: string; impact: string }> = [];
    if (rriState.rri > 2.625) {
      alerts.push({ code: 'SIM-RRI-01', title: 'Revolution Threshold Breach — R(t) > 2.625', impact: 'CRITICAL' });
    } else if (rriState.rri > 2.5) {
      alerts.push({ code: 'SIM-RRI-02', title: 'Elevated RRI — Approaching Revolution Threshold', impact: 'HIGH' });
    }
    if (rriState.compound_stress > 0.4) {
      alerts.push({ code: 'SIM-STRESS-01', title: `Compound Stress Alert — CS(t) = ${rriState.compound_stress.toFixed(2)}`, impact: 'HIGH' });
    }
    if (rriState.elite_defection_prob > 0.3) {
      alerts.push({ code: 'SIM-ELITE-01', title: `Elite Defection Risk — ${(rriState.elite_defection_prob * 100).toFixed(0)}% probability`, impact: 'CRITICAL' });
    }
    if (rriState.velocity > 0.15) {
      alerts.push({ code: 'SIM-VEL-01', title: `Accelerating Deterioration — V(t) = +${rriState.velocity.toFixed(3)}`, impact: 'HIGH' });
    }
    if ((data.economy.fx_reserves ?? 150) < 75) {
      alerts.push({ code: 'SIM-FOREX-01', title: `Forex Reserves Critical — ${data.economy.fx_reserves ?? 0} days`, impact: 'CRITICAL' });
    }
    if (alerts.length === 0) {
      alerts.push({ code: 'SIM-NOMINAL', title: 'All engine indicators within nominal ranges', impact: 'STABLE' });
    }
    return alerts.slice(0, 5);
  }, [rriState.rri, rriState.compound_stress, rriState.elite_defection_prob, rriState.velocity, data.economy.fx_reserves]);

  const [activeFramework, setActiveFramework] = useState<
    'fragility' | 'conflict' | 'strategic' | 'information' | 'cascade' | 'elite' | 'contradiction'
  >('contradiction');

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Strategic Intelligence"
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

      <div className="flex items-center space-x-1 mb-6 bg-black/40 border border-intel-border rounded-xl p-1 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('crisis')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'crisis'
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Crisis Simulator</span>
        </button>
        <button
          onClick={() => setActiveTab('coalition')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'coalition'
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-3 h-3" />
          <span>Coalition Stability Monitor</span>
        </button>
        <button
          onClick={() => setActiveTab('predictive')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'predictive'
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>Predictive Engine</span>
        </button>
        <button
          onClick={() => setActiveTab('gametheory')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'gametheory'
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Target className="w-3 h-3" />
          <span>Game Theory Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('multiframework')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'multiframework'
              ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Multi-Framework Intelligence</span>
        </button>
      </div>

      {/* Section 0: Multi-Framework Intelligence */}
      {activeTab === 'multiframework' && (
        <div className="space-y-8">
          {/* ============================================================
              MULTI-FRAMEWORK INTELLIGENCE LAYER
              ============================================================ */}
          <div className="space-y-6">

            {/* Section header */}
            <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
              <Layers className="w-5 h-5 text-intel-purple" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Multi-Framework Intelligence
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Six analytical lenses · Same data · Contradictions are insight
                </p>
              </div>
              {/* Coherence indicator */}
              <div className="ml-auto text-right">
                <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">
                  Framework Coherence
                </div>
                <div className={`text-xl font-bold font-mono ${
                  frameworkOutput.contradiction.overallCoherence > 0.7
                    ? 'text-intel-cyan'
                    : frameworkOutput.contradiction.overallCoherence > 0.5
                    ? 'text-intel-orange'
                    : 'text-intel-red'
                }`}>
                  {(frameworkOutput.contradiction.overallCoherence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Framework selector */}
            <div className="grid grid-cols-7 gap-1">
              {[
                { id: 'contradiction', label: 'Synthesis', icon: Brain,
                  color: 'text-intel-purple', activeBg: 'bg-intel-purple/10 border-intel-purple/30',
                  badge: frameworkOutput.contradiction.contradictions.length > 0
                    ? frameworkOutput.contradiction.contradictions.length : null,
                },
                { id: 'fragility', label: 'Fragility', icon: Shield,
                  color: 'text-intel-orange', activeBg: 'bg-intel-orange/10 border-intel-orange/30',
                  badge: null,
                },
                { id: 'conflict', label: 'Conflict Risk', icon: AlertTriangle,
                  color: 'text-intel-red', activeBg: 'bg-intel-red/10 border-intel-red/30',
                  badge: null,
                },
                { id: 'strategic', label: 'Strategic', icon: Target,
                  color: 'text-intel-cyan', activeBg: 'bg-intel-cyan/10 border-intel-cyan/30',
                  badge: null,
                },
                { id: 'information', label: 'Info War', icon: Radio,
                  color: 'text-yellow-500', activeBg: 'bg-yellow-500/10 border-yellow-500/30',
                  badge: null,
                },
                { id: 'cascade', label: 'Cascade', icon: Network,
                  color: 'text-intel-orange', activeBg: 'bg-intel-orange/10 border-intel-orange/30',
                  badge: null,
                },
                { id: 'elite', label: 'Elite Game', icon: Users,
                  color: 'text-intel-purple', activeBg: 'bg-intel-purple/10 border-intel-purple/30',
                  badge: null,
                },
              ].map(f => {
                const Icon = f.icon;
                const isActive = activeFramework === f.id;
                return (
                  <button key={f.id}
                    onClick={() => setActiveFramework(f.id as any)}
                    className={`relative flex flex-col items-center space-y-1.5 p-3
                      rounded-xl border text-center transition-all ${
                      isActive
                        ? `${f.activeBg} border`
                        : 'border-intel-border/30 hover:border-intel-border/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? f.color : 'text-slate-600'}`} />
                    <span className={`text-[8px] font-mono uppercase tracking-wider
                      leading-tight ${isActive ? f.color : 'text-slate-600'}`}>
                      {f.label}
                    </span>
                    {f.badge !== null && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                        bg-intel-red text-white text-[7px] font-bold flex items-center
                        justify-center">
                        {f.badge}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Framework content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeFramework}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >

                {/* ── SYNTHESIS / CONTRADICTIONS ── */}
                {activeFramework === 'contradiction' && (
                  <div className="space-y-4">
                    {/* Analyst note */}
                    <div className="glass p-5 rounded-2xl border border-intel-purple/30
                      bg-intel-purple/5 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-3.5 h-3.5 text-intel-purple" />
                        <span className="text-[9px] font-mono text-intel-purple
                          uppercase tracking-widest">Framework Synthesis</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed pl-5">
                        {frameworkOutput.contradiction.analystNote}
                      </p>
                    </div>

                    {/* Six framework scores summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Fragility', value: frameworkOutput.fragility.compositeFragility,
                          level: frameworkOutput.fragility.fragilityLevel },
                        { label: 'Conflict Risk', value: frameworkOutput.conflictRisk.riskScore,
                          level: frameworkOutput.conflictRisk.riskLevel },
                        { label: 'Strategic Stage', value: frameworkOutput.strategicPressure.stageScore,
                          level: frameworkOutput.strategicPressure.stageLabel },
                        { label: 'Info Control', value: frameworkOutput.informationEnvironment.outrageMomentum,
                          level: frameworkOutput.informationEnvironment.informationControl },
                        { label: 'Cascade Risk', value: frameworkOutput.cascade.systemicRisk,
                          level: frameworkOutput.cascade.estimatedSpread.split(' ')[0] },
                        { label: 'Regime Survival', value: frameworkOutput.eliteGame.regimeSurvivalProbability,
                          level: frameworkOutput.eliteGame.nashEquilibrium },
                      ].map(f => {
                        const pct = f.value;
                        const color = pct >= 70 ? 'text-intel-red bg-intel-red' :
                                      pct >= 50 ? 'text-intel-orange bg-intel-orange' :
                                      pct >= 30 ? 'text-yellow-500 bg-yellow-500' :
                                      'text-intel-cyan bg-intel-cyan';
                        const textColor = color.split(' ')[0];
                        const barColor = color.split(' ')[1];
                        return (
                          <div key={f.label}
                            className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
                              {f.label}
                            </div>
                            <div className={`text-2xl font-bold font-mono ${textColor}`}>
                              {pct}
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-[8px] text-slate-600 truncate">{f.level}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contradictions list */}
                    {frameworkOutput.contradiction.contradictions.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          Framework Contradictions ({frameworkOutput.contradiction.contradictions.length})
                        </div>
                        {frameworkOutput.contradiction.contradictions.map(c => (
                          <div key={c.id}
                            className={`p-4 rounded-xl border space-y-2 ${
                            c.severity === 'HIGH'
                              ? 'border-intel-red/30 bg-intel-red/5'
                              : 'border-intel-orange/20 bg-intel-orange/3'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold ${
                                c.severity === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'
                              }`}>{c.title}</span>
                              <span className={`text-[7px] font-mono uppercase px-1.5
                                py-0.5 rounded border ${
                                c.severity === 'HIGH'
                                  ? 'border-intel-red/30 text-intel-red'
                                  : 'border-intel-orange/30 text-intel-orange'
                              }`}>{c.severity}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed">
                              {c.description}
                            </p>
                            <div className="space-y-1 border-t border-white/5 pt-2">
                              <div className="text-[8px] font-mono text-slate-600">
                                INTERPRETATION
                              </div>
                              <p className="text-[9px] text-slate-300 leading-relaxed">
                                {c.interpretation}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[8px] font-mono text-slate-600">
                                ACTION IMPLICATION
                              </div>
                              <p className="text-[9px] text-intel-cyan leading-relaxed">
                                → {c.actionImplication}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-intel-cyan/20 bg-intel-cyan/5
                        text-[10px] text-intel-cyan font-mono">
                        No contradictions detected. All frameworks converge — high analytical confidence.
                      </div>
                    )}
                  </div>
                )}

                {/* ── FRAGILITY (WB/OECD) ── */}
                {activeFramework === 'fragility' && (() => {
                  const f = frameworkOutput.fragility;
                  const levelColor = f.fragilityLevel === 'EXTREME' ? 'text-intel-red' :
                    f.fragilityLevel === 'HIGH' ? 'text-intel-orange' :
                    f.fragilityLevel === 'MODERATE' ? 'text-yellow-500' : 'text-intel-cyan';
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        {/* Radar chart */}
                        <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            Fragility Radar — WB/OECD Dimensions
                          </div>
                          <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={f.radarData}>
                              <PolarGrid stroke="#1e293b" />
                              <PolarAngleAxis dataKey="subject"
                                tick={{ fill: '#64748b', fontSize: 10 }} />
                              <PolarRadiusAxis domain={[0,100]} tick={false} />
                              <Radar name="Fragility"
                                dataKey="value"
                                stroke="#f97316"
                                fill="#f97316"
                                fillOpacity={0.2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Scores */}
                        <div className="space-y-3">
                          <div className="glass p-4 rounded-xl border border-intel-border/30">
                            <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                              Composite Fragility
                            </div>
                            <div className={`text-5xl font-bold font-mono ${levelColor}`}>
                              {f.compositeFragility}
                            </div>
                            <div className={`text-[10px] font-mono font-bold uppercase mt-1 ${levelColor}`}>
                              {f.fragilityLevel}
                            </div>
                            <div className="text-[8px] text-slate-600 mt-1">{f.wbComparison}</div>
                          </div>
                          {['security','political','economic','social'].map(dim => {
                            const val = f.dimensions[dim as keyof typeof f.dimensions];
                            return (
                              <div key={dim} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-slate-400 capitalize">{dim}</span>
                                  <span className={val >= 65 ? 'text-intel-red' :
                                    val >= 45 ? 'text-intel-orange' : 'text-slate-400'}>{val}</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    val >= 65 ? 'bg-intel-red' :
                                    val >= 45 ? 'bg-intel-orange' :
                                    val >= 25 ? 'bg-yellow-500' : 'bg-intel-cyan'
                                  }`} style={{ width: `${val}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {f.keyDrivers.length > 0 && (
                        <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            Key Fragility Drivers
                          </div>
                          {f.keyDrivers.map((d, i) => (
                            <div key={i} className="flex items-start space-x-2 text-[9px]">
                              <span className="text-intel-orange shrink-0">→</span>
                              <span className="text-slate-300">{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── CONFLICT RISK (ICG) ── */}
                {activeFramework === 'conflict' && (() => {
                  const f = frameworkOutput.conflictRisk;
                  const levelColor = f.riskLevel === 'CRITICAL' ? 'text-intel-red' :
                    f.riskLevel === 'HIGH' ? 'text-intel-orange' :
                    f.riskLevel === 'ELEVATED' ? 'text-yellow-500' : 'text-intel-cyan';
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Grievance', value: f.grievance,
                            desc: 'Economic injustice + political exclusion' },
                          { label: 'Mobilization', value: f.mobilization,
                            desc: 'Capacity to organize and act' },
                          { label: 'Opportunity', value: f.opportunity,
                            desc: 'State weakness + elite fracture' },
                        ].map(dim => (
                          <div key={dim.label} className={`glass p-5 rounded-xl border space-y-3 ${
                            dim.label === f.dominantDriver.charAt(0) + f.dominantDriver.slice(1).toLowerCase()
                              ? 'border-intel-red/40' : 'border-intel-border/30'
                          }`}>
                            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                              {dim.label}
                              {f.dominantDriver === dim.label.toUpperCase() && (
                                <span className="ml-2 text-intel-red">← DOMINANT</span>
                              )}
                            </div>
                            <div className={`text-4xl font-bold font-mono ${
                              dim.value >= 65 ? 'text-intel-red' :
                              dim.value >= 45 ? 'text-intel-orange' :
                              dim.value >= 25 ? 'text-yellow-500' : 'text-intel-cyan'
                            }`}>{dim.value}</div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                dim.value >= 65 ? 'bg-intel-red' :
                                dim.value >= 45 ? 'bg-intel-orange' :
                                dim.value >= 25 ? 'bg-yellow-500' : 'bg-intel-cyan'
                              }`} style={{ width: `${dim.value}%` }} />
                            </div>
                            <div className="text-[8px] text-slate-600">{dim.desc}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-4 rounded-xl border border-intel-border/30">
                          <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                            Composite Risk Score
                          </div>
                          <div className={`text-5xl font-bold font-mono ${levelColor}`}>
                            {f.riskScore}
                          </div>
                          <div className={`text-[10px] font-mono font-bold uppercase mt-1 ${levelColor}`}>
                            {f.riskLevel}
                          </div>
                          <div className="text-[9px] text-slate-500 mt-2">{f.estimatedTimeframe}</div>
                        </div>
                        <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                          <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                            Trigger Sensitivity
                          </div>
                          {f.triggerSensitivity.slice(0, 4).map((t, i) => (
                            <div key={i} className="space-y-0.5">
                              <div className="text-[8px] text-slate-400">{t.trigger}</div>
                              <div className={`text-[8px] font-mono ${
                                t.impact.includes('CATASTROPHIC') || t.impact.includes('SYSTEM') || t.impact.includes('CASCADE')
                                  ? 'text-intel-red' : 'text-intel-orange'
                              }`}>{t.impact}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── STRATEGIC PRESSURE ── */}
                {activeFramework === 'strategic' && (() => {
                  const f = frameworkOutput.strategicPressure;
                  const STAGE_COLORS: Record<string, string> = {
                    LATENT_STRESS: 'text-intel-cyan',
                    STRUCTURAL_PRESSURE: 'text-yellow-500',
                    ACTIVE_DESTABILIZATION: 'text-intel-orange',
                    CRISIS: 'text-intel-red',
                    NORMALIZATION: 'text-intel-green',
                  };
                  return (
                    <div className="space-y-5">
                      {/* State machine bar */}
                      <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          Strategic Pressure State Machine
                        </div>
                        <div className="flex items-center relative">
                          <div className="absolute top-5 left-0 right-0 h-0.5
                            bg-gradient-to-r from-intel-cyan via-intel-orange to-intel-red" />
                          {f.stateMachineBar.map((s, i) => {
                            const color = STAGE_COLORS[s.stage] ?? 'text-slate-500';
                            return (
                              <div key={s.stage} className="flex-1 relative z-10 text-center">
                                <div className={`w-10 h-10 rounded-full border-2 mx-auto
                                  flex items-center justify-center text-[10px] font-bold ${
                                  s.active
                                    ? `border-current ${color} bg-black`
                                    : s.passed
                                    ? 'border-slate-600 text-slate-600 bg-slate-800'
                                    : 'border-slate-800 text-slate-800 bg-black'
                                }`}>
                                  {s.active ? '●' : s.passed ? '✓' : '○'}
                                </div>
                                <div className={`text-[7px] font-mono uppercase mt-2
                                  leading-tight ${s.active ? color : 'text-slate-700'}`}>
                                  {s.label}
                                  {s.active && ' ← NOW'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                          <div className="text-[8px] font-mono text-slate-500 uppercase">Current Stage</div>
                          <div className={`text-[14px] font-bold ${STAGE_COLORS[f.stage]}`}>
                            {f.stageLabel}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Position within stage: {f.stageScore}%
                          </div>
                          <div className="text-[9px] text-slate-400">
                            → Transition probability: {(f.transitionProbability * 100).toFixed(0)}%
                            {f.nextStage && ` to ${f.nextStage.replace(/_/g, ' ')}`}
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl border space-y-2 ${
                          f.deliberateEngineering
                            ? 'border-intel-red/30 bg-intel-red/5'
                            : 'border-intel-border/30 glass'
                        }`}>
                          <div className="text-[8px] font-mono text-slate-500 uppercase">
                            Deliberate Engineering
                          </div>
                          <div className={`text-[11px] font-bold ${
                            f.deliberateEngineering ? 'text-intel-red' : 'text-intel-cyan'
                          }`}>
                            {f.deliberateEngineering
                              ? `DETECTED — ${(f.engineeringConfidence * 100).toFixed(0)}% confidence`
                              : 'NOT DETECTED'}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {f.deliberateEngineering
                              ? 'ETM + MII signals suggest coordinated external pressure'
                              : 'Endogenous structural failure — no single engineering actor'}
                          </div>
                        </div>
                      </div>
                      {f.pressureSources.length > 0 && (
                        <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            Pressure Sources
                          </div>
                          {f.pressureSources.map((src, i) => (
                            <div key={i} className="flex items-start space-x-2 text-[9px]">
                              <span className="text-intel-orange shrink-0">→</span>
                              <span className="text-slate-300">{src}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── INFORMATION ENVIRONMENT ── */}
                {activeFramework === 'information' && (() => {
                  const f = frameworkOutput.informationEnvironment;
                  const controlColors: Record<string, string> = {
                    STATE: 'text-intel-red', CONTESTED: 'text-intel-orange',
                    OPEN: 'text-intel-cyan', DEGRADED: 'text-yellow-500',
                  };
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-4">
                          {/* Narrative dominance bars */}
                          <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                              Narrative Dominance
                            </div>
                            {[
                              { label: 'Regime frame', value: f.narrativeDominance.regime, color: 'bg-intel-cyan' },
                              { label: 'Opposition frame', value: f.narrativeDominance.opposition, color: 'bg-intel-orange' },
                              { label: 'External frame', value: f.narrativeDominance.external, color: 'bg-intel-purple' },
                            ].map(n => (
                              <div key={n.label} className="space-y-1">
                                <div className="flex justify-between text-[9px] font-mono">
                                  <span className="text-slate-400">{n.label}</span>
                                  <span className="text-slate-300">{n.value}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${n.color}`}
                                    style={{ width: `${n.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="glass p-4 rounded-xl border border-intel-border/30">
                            <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                              Information Control
                            </div>
                            <div className={`text-[14px] font-bold ${controlColors[f.informationControl]}`}>
                              {f.informationControl}
                            </div>
                          </div>
                          <div className="glass p-4 rounded-xl border border-intel-border/30">
                            <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                              Amplification A(t)
                            </div>
                            <div className={`text-3xl font-bold font-mono ${
                              f.amplificationFactor > 1.4 ? 'text-intel-red' :
                              f.amplificationFactor > 1.2 ? 'text-intel-orange' : 'text-intel-cyan'
                            }`}>{f.amplificationFactor.toFixed(2)}×</div>
                          </div>
                          <div className="glass p-4 rounded-xl border border-intel-border/30">
                            <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                              Outrage Momentum
                            </div>
                            <div className={`text-3xl font-bold font-mono ${
                              f.outrageMomentum > 60 ? 'text-intel-red' :
                              f.outrageMomentum > 40 ? 'text-intel-orange' : 'text-slate-400'
                            }`}>{f.outrageMomentum}%</div>
                          </div>
                          {f.suppressionActive && (
                            <div className="p-3 rounded-xl border border-intel-red/30
                              bg-intel-red/5 text-[9px] font-mono text-intel-red">
                              ⚠ Active suppression detected
                            </div>
                          )}
                        </div>
                      </div>
                      {f.keyDynamics.length > 0 && (
                        <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            Key Dynamics
                          </div>
                          {f.keyDynamics.map((d, i) => (
                            <div key={i} className="flex items-start space-x-2 text-[9px]">
                              <span className="text-yellow-500 shrink-0">→</span>
                              <span className="text-slate-300">{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── CASCADE SIMULATION ── */}
                {activeFramework === 'cascade' && (() => {
                  const f = frameworkOutput.cascade;
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        {/* Gov risks */}
                        <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            Governorate Activation Risks
                          </div>
                          {f.governorateRisks.map(g => (
                            <div key={g.name} className={`space-y-1 ${
                              g.isFocal ? 'p-2 rounded-lg border border-intel-red/30 bg-intel-red/5' : ''
                            }`}>
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className={g.isFocal ? 'text-intel-red font-bold' : 'text-slate-400'}>
                                  {g.name} {g.isFocal && '← FOCAL'}
                                </span>
                                <span className={g.risk >= 70 ? 'text-intel-red' :
                                  g.risk >= 50 ? 'text-intel-orange' : 'text-slate-400'}>
                                  {g.risk}%
                                </span>
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  g.risk >= 70 ? 'bg-intel-red' :
                                  g.risk >= 50 ? 'bg-intel-orange' : 'bg-yellow-500'
                                }`} style={{ width: `${g.risk}%` }} />
                              </div>
                              {g.dayToActivation && (
                                <div className="text-[7px] font-mono text-slate-700">
                                  ~{g.dayToActivation}d to activation
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Summary + sequence */}
                        <div className="space-y-3">
                          <div className="glass p-4 rounded-xl border border-intel-border/30">
                            <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                              Systemic Risk
                            </div>
                            <div className={`text-5xl font-bold font-mono ${
                              f.systemicRisk >= 65 ? 'text-intel-red' :
                              f.systemicRisk >= 45 ? 'text-intel-orange' : 'text-yellow-500'
                            }`}>{f.systemicRisk}%</div>
                            <div className="text-[9px] text-slate-500 mt-1">{f.estimatedSpread}</div>
                          </div>
                          <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                            <div className="text-[8px] font-mono text-slate-500 uppercase">
                              Cascade Sequence
                            </div>
                            {f.cascadeSequence.slice(0, 4).map((c, i) => (
                              <div key={i} className="flex items-center space-x-2 text-[9px]">
                                <span className="text-slate-500 font-mono">{c.from}</span>
                                <span className="text-slate-700">→</span>
                                <span className="text-slate-400">{c.to}</span>
                                <span className={`ml-auto font-mono ${
                                  c.probability >= 60 ? 'text-intel-red' :
                                  c.probability >= 40 ? 'text-intel-orange' : 'text-slate-600'
                                }`}>{c.probability}%</span>
                              </div>
                            ))}
                          </div>
                          <div className={`p-3 rounded-xl border text-[9px] font-mono ${
                            f.containmentPossible
                              ? 'border-intel-cyan/30 text-intel-cyan'
                              : 'border-intel-red/30 text-intel-red'
                          }`}>
                            {f.containmentPossible ? '✓ Containment possible' : '✕ Containment unlikely'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── ELITE GAME ── */}
                {activeFramework === 'elite' && (() => {
                  const f = frameworkOutput.eliteGame;
                  const eqColor = f.nashEquilibrium === 'CASCADING' ? 'text-intel-red' :
                    f.nashEquilibrium === 'UNSTABLE' ? 'text-intel-orange' : 'text-intel-cyan';
                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div className="glass p-4 rounded-xl border border-intel-border/30">
                          <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">Nash Equilibrium</div>
                          <div className={`text-[13px] font-bold ${eqColor}`}>{f.nashEquilibrium}</div>
                        </div>
                        <div className="glass p-4 rounded-xl border border-intel-border/30">
                          <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                            Cascade Defection
                          </div>
                          <div className={`text-3xl font-bold font-mono ${
                            f.cascadeDefectionRisk >= 60 ? 'text-intel-red' :
                            f.cascadeDefectionRisk >= 40 ? 'text-intel-orange' : 'text-slate-400'
                          }`}>{f.cascadeDefectionRisk}%</div>
                        </div>
                        <div className="glass p-4 rounded-xl border border-intel-border/30">
                          <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                            Regime Survival
                          </div>
                          <div className={`text-3xl font-bold font-mono ${
                            f.regimeSurvivalProbability < 40 ? 'text-intel-red' :
                            f.regimeSurvivalProbability < 60 ? 'text-intel-orange' : 'text-intel-cyan'
                          }`}>{f.regimeSurvivalProbability}%</div>
                        </div>
                      </div>
                      {/* Actor grid */}
                      <div className="space-y-2">
                        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          Actor Status
                        </div>
                        {f.actors.map(a => {
                          const statusColors: Record<string, string> = {
                            LOYAL: 'text-intel-cyan',
                            WAVERING: 'text-yellow-500',
                            DEFECTION_RISK: 'text-intel-red',
                            DEFECTED: 'text-intel-red',
                          };
                          return (
                            <div key={a.name}
                              className={`flex items-center space-x-4 p-3 rounded-xl border ${
                              a.status === 'DEFECTION_RISK'
                                ? 'border-intel-red/30 bg-intel-red/5'
                                : a.status === 'WAVERING'
                                ? 'border-yellow-500/20 bg-yellow-500/3'
                                : 'border-intel-border/20 bg-black/10'
                            }`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold text-white truncate">
                                    {a.name}
                                  </span>
                                  <span className="text-[7px] font-mono text-slate-600 uppercase">
                                    {a.influence}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0">
                                <div className="text-right">
                                  <div className="text-[7px] font-mono text-slate-700">Loyalty</div>
                                  <div className="text-[9px] font-mono text-slate-400">{a.loyalty}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[7px] font-mono text-slate-700">Defect risk</div>
                                  <div className={`text-[9px] font-mono ${
                                    a.defectionRisk >= 60 ? 'text-intel-red font-bold' :
                                    a.defectionRisk >= 40 ? 'text-intel-orange' : 'text-slate-400'
                                  }`}>{a.defectionRisk}%</div>
                                </div>
                                <div className={`text-[8px] font-mono font-bold uppercase
                                  w-24 text-right ${statusColors[a.status]}`}>
                                  {a.status.replace(/_/g,' ')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="glass p-4 rounded-xl border border-intel-border/30">
                        <div className="text-[8px] font-mono text-slate-500 uppercase mb-2">
                          Defection Trigger
                        </div>
                        <p className="text-[10px] text-slate-300">{f.defectionTrigger}</p>
                      </div>
                    </div>
                  );
                })()}

              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      )}

      {/* Section 1: Crisis Simulator */}
      {activeTab === 'crisis' && (
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
      )}

      {/* Section 2: Coalition Stability Monitor */}
      {activeTab === 'coalition' && (
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
          {coalitionGroups.map((group, i) => (
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
              {coalitionStability.loyalCount}/{coalitionStability.totalCount}
            </div>
            <div className="text-[9px] text-slate-600">
              {coalitionStability.loyalNames || 'None'} (minimal)
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              Coalition Stability
            </div>
            <div className={`text-2xl font-bold font-mono ${
              coalitionStability.stabilityLabel === 'CRITICAL' ? 'text-intel-red' :
              coalitionStability.stabilityLabel === 'FRAGILE' ? 'text-intel-orange' :
              'text-intel-cyan'
            }`}>
              {coalitionStability.stabilityLabel}
            </div>
            <div className="text-[9px] text-slate-600">
              {coalitionStability.stabilityLabel === 'CRITICAL' ? 'Cascade imminent' :
               coalitionStability.stabilityLabel === 'FRAGILE' ? 'One defection = critical' :
               'Structurally stable'}
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
              EQ.18 — {rriState.elite_cohesion_dynamics < 0.5 ? 'declining trend' : 'stable'}
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
      )}

      {/* Section 3: Predictive Engine */}
      {activeTab === 'predictive' && (
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
            {probabilityMatrix.map((item, i) => (
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
      )}

      {/* Section 3: Game Theory Analysis */}
      {activeTab === 'gametheory' && (
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
      )}

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
