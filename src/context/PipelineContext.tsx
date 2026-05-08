import { safeStorage } from '../utils/storage';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ShockSignal } from '../types/intel';
import { PRESET_SHOCKS } from '../config/shocks';
import calculateRRI, {
  updateVariableFromPipeline
} from '../math/rri/engine';

// AI Intelligence imports
import { 
  generateAIAnalysis, 
  generateForecast,
  AIAnalysis,
  ForecastResult
} from '../services/ai';
import { computeSignals } from '../services/signals';
import { computeClusters } from '../services/clusters';
import { generateSmartAlerts } from '../services/smartAlerts';
import { generateAgentInsights } from '../services/agents';
import { computeMII } from '../services/miiEngine';
import { analyzeActorNetwork } from '../services/actorNetwork';
import { TemporalAnalyzer } from '../services/temporalAnalysisService';
import {
  processAllGovernorates,
  generateMockInputs,
  AgriNationalSummary,
} from '../services/AgriIntelEngine';
import { addNotification } from '../services/notificationService';
import {
  processAgroNational,
  buildAgroInput,
  buildBCEWMInputs,
  AgroNationalSummary,
} from '../services/AgroSystemEngine';
import { detectShortagesInArticles } from '../services/shortageDetector';
import { computeSBDE, DEFAULT_SBDE_INPUTS, W_PSI_RRI } from '../services/sbdeEngine';

interface EconomyData {
  gdp_growth: number;        // % e.g. 0.4
  inflation: number;         // % e.g. 7.1
  fx_reserves: number;       // days of import cover e.g. 84
  public_debt: number;       // % of GDP e.g. 81.2
  tnd_usd: number;           // exchange rate e.g. 3.18
  unemployment: number;      // % e.g. 16.4
  youth_unemployment: number;// % e.g. 37.8
  current_account: number;   // % GDP e.g. -8.1
  remittances: number;       // B TND e.g. 8.2
  tourism_revenue: number;   // B TND e.g. 2.1
  trade_deficit: number;     // B TND e.g. 12.4
  remittances_total_bnd: number;        // 8.8
  remittances_pct_gdp: number;          // 9.4
  remittances_urban_bnd: number;        // 7.04
  remittances_rural_bnd: number;        // 1.76
  remittances_growth_yoy: number;       // 2.3
  remittances_france_pct: number;       // 40
  parallel_market_premium: number;      // 18
  cpi_score: number;                    // 40
  heritage_freedom_score: number;       // 49.8
  fdi_inflow_usd: number;               // 0.9
  doing_business_rank: number;         // 78
  informal_economy_pct: number;        // 47
  sme_credit_access_pct: number;       // 18
  new_business_registrations: number;  // 12400
  last_updated: string;      // ISO date
  source: string;
  // Finance Law 2026 fields
  budget_revenues_tnd?: number;
  budget_expenditures_tnd?: number;
  domestic_borrowing_tnd?: number;
  foreign_borrowing_tnd?: number;
  bct_monetization_limit_tnd?: number;
  public_employees?: number;
  special_levy_rate_pct?: number;
  sme_credit_new_m_tnd?: number;
  ev_tax_incentive_active?: boolean;
  lithium_battery_customs_exempt?: boolean;
}

interface EnergyData {
  steg_debt: number;         // B TND e.g. 4.2
  gas_import_pct: number;    // % e.g. 68
  renewable_pct: number;     // % e.g. 4.1
  peak_demand_mw: number;    // MW e.g. 3850
  fuel_subsidy_cost: number; // B TND e.g. 2.1
  electricity_access: number;// % e.g. 99.7
  oil_production: number;    // k bbl/day e.g. 34
  gas_production: number;    // BCM/year e.g. 1.6
  last_updated: string;
  source: string;
}

interface RRIData {
  rri: number;               // e.g. 2.31
  p_rev: number;             // 0-1 e.g. 0.643
  salience: number;          // 0-1 e.g. 0.412
  w_t: number;               // 0-1 e.g. 0.72
  ci_low: number;            // % e.g. 59.8
  ci_high: number;           // % e.g. 68.7
  last_updated: string;
  source: string;
}

interface GeopoliticalData {
  imf_deal_probability: number;  // % e.g. 31
  eu_partnership_status: string; // e.g. 'STRAINED'
  gulf_support_level: string;    // e.g. 'SELECTIVE'
  external_debt_2026: number;    // B TND e.g. 4.2
  nato_alignment: Record<string, number>;
  diplomatic_relations?: any;
  last_updated: string;
  source: string;
}

interface SocialData {
  ugtt_strike_count_2025: number;    // e.g. 847
  ugtt_mobilisation_level: string;   // HIGH/MEDIUM/LOW
  protest_events_30d: number;        // e.g. 23
  press_freedom_rank: number;        // RSF rank e.g. 118
  decree54_charged: number;          // e.g. 67
  water_crisis_govs: number;         // govs with >10hr cuts
  happiness_index: number;           // 0-10 e.g. 4.2
  youth_rage_index: number;          // 0-10 e.g. 8.5
  population_pressure: number;       // 0-10 e.g. 7.2
  suicide_rate: number;              // per 100k e.g. 12.4
  mental_health_stress: number;      // % e.g. 68
  chronic_disease_pct: number;       // % e.g. 42.8
  street_signal: number;             // 0-1 e.g. 0.78
  social_cohesion: string;           // e.g. 'LOW'
  divorce_rate: number;              // % e.g. 22.1
  addiction_total: string;           // e.g. '450K'
  youth_addiction_rate: number;      // % e.g. 24.8
  diaspora_total: number;               // 1400000
  diaspora_pct_population: number;      // 11
  engineers_leaving_per_year: number;   // 3500
  doctors_leaving_per_year: number;     // 800
  phd_emigration_pct: number;           // 60
  illegal_crossing_attempts: number;    // 36000
  illegal_crossing_deaths: number;      // 1200
  youth_emigration_aspiration_pct: number; // 65
  return_migration_annual: number;      // 8000
  net_migration: number;               // -10000
  smuggling_network_revenue_usd_m: number; // 57 (midpoint estimate)
  coast_guard_interceptions: number;   // 23000
  sub_saharan_transit_pct: number;     // 55
  last_updated: string;
  source: string;
  // Finance Law 2026 social fields
  autism_stipend_tnd?: number;
  diabetes_stipend_tnd?: number;
  celiac_stipend_tnd?: number;
  xeroderma_stipend_tnd?: number;
  graduate_employment_incentive?: boolean;
  wage_increase_mandate_active?: boolean;
  agri_debt_relief_active?: boolean;
  drought_lease_exemption_active?: boolean;
  water_fund_created?: boolean;
}

interface PlatformData {
  economy: EconomyData;
  energy: EnergyData;
  rri: RRIData;
  geopolitical: GeopoliticalData;
  social: SocialData;
  active_signals: ShockSignal[];
  last_pipeline_push: string | null;
}

const DEFAULT_DATA: PlatformData = {
  economy: {
    gdp_growth: 0.4,
    inflation: 7.1,
    fx_reserves: 84,
    public_debt: 81.2,
    tnd_usd: 3.18,
    unemployment: 16.4,
    youth_unemployment: 37.8,
    current_account: -8.1,
    remittances: 8.2,
    tourism_revenue: 2.1,
    trade_deficit: 12.4,
    remittances_total_bnd: 8.8,
    remittances_pct_gdp: 9.4,
    remittances_urban_bnd: 7.04,
    remittances_rural_bnd: 1.76,
    remittances_growth_yoy: 2.3,
    remittances_france_pct: 40,
    last_updated: '2026-03-01',
    parallel_market_premium: 18,
    cpi_score: 40,
    heritage_freedom_score: 49.8,
    fdi_inflow_usd: 0.9,
    doing_business_rank: 78,
    informal_economy_pct: 47,
    sme_credit_access_pct: 18,
    new_business_registrations: 12400,
    source: 'BCT / INS'
  },
  energy: {
    steg_debt: 4.2,
    gas_import_pct: 68,
    renewable_pct: 4.1,
    peak_demand_mw: 3850,
    fuel_subsidy_cost: 2.1,
    electricity_access: 99.7,
    oil_production: 34,
    gas_production: 1.6,
    last_updated: '2026-02-15',
    source: 'STEG / ANME'
  },
  rri: {
    rri: 2.31,
    p_rev: 0.643,
    salience: 0.412,
    w_t: 0.72,
    ci_low: 59.8,
    ci_high: 68.7,
    last_updated: '2026-03-15',
    source: 'RRI Engine v2'
  },
  geopolitical: {
    imf_deal_probability: 31,
    eu_partnership_status: 'STRAINED',
    gulf_support_level: 'SELECTIVE',
    external_debt_2026: 4.2,
    nato_alignment: {
      imf: 45,
      eu: 92,
      us: 100,
      france: 95,
      gulf: 65,
      china: 15,
      wb: 40
    },
    last_updated: '2026-03-10',
    source: 'IMF / EU Delegation'
  },
  social: {
    ugtt_strike_count_2025: 847,
    ugtt_mobilisation_level: 'HIGH',
    protest_events_30d: 23,
    press_freedom_rank: 118,
    decree54_charged: 67,
    water_crisis_govs: 8,
    happiness_index: 4.2,
    youth_rage_index: 8.5,
    population_pressure: 7.2,
    suicide_rate: 12.4,
    mental_health_stress: 68,
    chronic_disease_pct: 42.8,
    street_signal: 0.78,
    social_cohesion: 'LOW',
    divorce_rate: 22.1,
    addiction_total: '450K',
    youth_addiction_rate: 24.8,
    diaspora_total: 1400000,
    diaspora_pct_population: 11,
    engineers_leaving_per_year: 3500,
    doctors_leaving_per_year: 800,
    phd_emigration_pct: 60,
    illegal_crossing_attempts: 36000,
    illegal_crossing_deaths: 1200,
    youth_emigration_aspiration_pct: 65,
    return_migration_annual: 8000,
    net_migration: -10000,
    smuggling_network_revenue_usd_m: 57,
    coast_guard_interceptions: 23000,
    sub_saharan_transit_pct: 55,
    last_updated: '2026-03-14',
    source: 'UGTT / RSF / TAP'
  },
  active_signals: [],
  last_pipeline_push: null
};

interface ApprovedChange {
  field: string;     // dot notation e.g. 'economy.inflation'
  value: any;
  oldValue: any;
  source: string;
  label: string;
  approvedAt: string;
}

interface AuditEntry {
  id: string;
  type: 'PUSH' | 'APPROVED' | 'REJECTED' | 'EXTRACTED' | 'RESET';
  field: string;
  value: any;
  oldValue?: any;
  source: string;
  label: string;
  timestamp: string;
}

interface PipelineContextType {
  data: PlatformData;
  updateField: (path: string, value: any, source: string) => void;
  pushApprovedChanges: (changes: ApprovedChange[]) => void;
  resetToDefaults: () => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'id'>) => void;
  auditLog: AuditEntry[];
  rriState: any;
  recalculateRRI: () => void;
  updateArticleCache: (articles: any) => void;
  injectSignal: (signalId: string) => void;
  activeSignals: ShockSignal[];
  miiProfile?: any;
  sbdeResult?: ReturnType<typeof computeSBDE>;
  actorNetwork?: any;
  aiAnalysis?: any;
  forecast?: any;
  runAIAnalysis?: () => void;
  isAIAnalysisLoading?: boolean;
  rpiProfile?: any;
  cognitiveEnvironment?: any;
  seiResult?: any;
  agroSummary?: AgroNationalSummary | null;
  agriSummary?: AgriNationalSummary | null;
  temporalAnalysis?: any;
  isPaused: boolean;
  togglePause: () => void;
}

export const PipelineContext = createContext<PipelineContextType>(
  {} as PipelineContextType
);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PlatformData>(() => {
    try {
      const saved = safeStorage.getItem('ti_platform_data');
      return saved ? { ...DEFAULT_DATA, ...JSON.parse(saved) } : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
  });

  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    try {
      const saved = safeStorage.getItem('ti_audit_log');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);
  const [miiProfile, setMiiProfile] = useState<any>(null);
  const [sbdeResult, setSbdeResult] = useState<ReturnType<typeof computeSBDE>>(() => computeSBDE());
  const [actorNetwork, setActorNetwork] = useState<any>(null);
  const [temporalAnalysis, setTemporalAnalysis] = useState<any>(null);
  const [seiResult, setSeiResult] = useState<any>(null);
  const [agriSummary, setAgriSummary] = useState<AgriNationalSummary | null>(null);
  const [agroSummary, setAgroSummary] = useState<AgroNationalSummary | null>(null);
  const [articleCache, setArticleCache] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const togglePause = useCallback(async () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);

    try {
      if (nextPaused) {
        await fetch('/api/intelligence/continuous/stop', { method: 'POST' });
      } else {
        await fetch('/api/intelligence/continuous/start', { method: 'POST' });
      }
    } catch (e) {
      console.error('Failed to sync pause state with backend:', e);
    }
  }, [isPaused]);

  const [rriState, setRriState] = useState(() => {
    try {
      return calculateRRI();
    } catch(e) {
      console.error('RRI init failed:', e);
      return {
        rri: 2.31,
        r_t: 2.31,
        p_rev: 0.643,
        salience: 0.412,
        w_t: 0.72,
        velocity: 0.18,
        velocity_label: 'DETERIORATING',
        compound_stress: 0.08,
        pattern_similarity: 0.67,
        pattern_label: 'HIGH — SIGNIFICANT SIMILARITY TO TUNISIA 2010',
        cascade_probability: 0.58,
        info_amplification: 0.82,
        elite_cohesion_dynamics: 0.65,
        elite_defection_prob: 0.12,
        ci_low: 59.8,
        ci_high: 68.7,
        p_rev_mean: 64.3,
        simulations_run: 0,
        category_scores: {},
        model_confidence: 0.72,
        last_calculated: new Date().toISOString(),
        variables_count: 250,
        variables: {},
        threshold_breaches: ['A_FX','M_UGTT','E51'],
        sir_susceptible: 0.94,
        sir_infected: 0.04,
        sir_recovered: 0.02,
        stochastic_shock: 0.001
      };
    }
  });

  useEffect(() => {
    try {
      safeStorage.setItem('ti_platform_data', JSON.stringify(data));
    } catch {}
  }, [data]);

  useEffect(() => {
    try {
      safeStorage.setItem('ti_audit_log', JSON.stringify(auditLog.slice(0, 200)));
    } catch {}
  }, [auditLog]);

  const recalculateRRI = useCallback(() => {
    try {
      // Build base overrides from current pipeline data
      const baseOverrides: Record<string, number> = {
        'economy.fx_reserves': data.economy.fx_reserves,
        'economy.inflation': data.economy.inflation,
        'economy.unemployment': data.economy.unemployment,
        'economy.tnd_usd': data.economy.tnd_usd,
        'economy.remittances_total_bnd': data.economy.remittances_total_bnd ?? 8.8,
        'economy.parallel_market_premium': data.economy.parallel_market_premium ?? 18,
        'economy.cpi_score': data.economy.cpi_score ?? 40,
        'economy.heritage_freedom_score': data.economy.heritage_freedom_score ?? 49.8,
        'economy.fdi_inflow_usd': data.economy.fdi_inflow_usd ?? 0.9,
        'social.protest_events_30d': data.social.protest_events_30d,
        'social.decree54_charged': data.social.decree54_charged,
        'social.ugtt_mobilisation_level':
          data.social.ugtt_mobilisation_level === 'HIGH' ? 80 :
          data.social.ugtt_mobilisation_level === 'ELEVATED' ? 65 : 50,
        'social.water_crisis_govs': data.social.water_crisis_govs,
        'social.press_freedom_rank': data.social.press_freedom_rank ?? 118,
        'social.youth_emigration_aspiration_pct':
          data.social.youth_emigration_aspiration_pct ?? 65,
        'social.engineers_leaving_per_year':
          data.social.engineers_leaving_per_year ?? 3500,
        'social.coast_guard_interceptions':
          data.social.coast_guard_interceptions ?? 23000,
        'social.smuggling_network_revenue_usd_m':
          data.social.smuggling_network_revenue_usd_m ?? 57,
        'geopolitical.imf_deal_probability':
          data.geopolitical?.imf_deal_probability ?? 31,
        'geopolitical.external_debt_2026':
          data.geopolitical?.external_debt_2026 ?? 4.2,
        'energy.steg_debt': data.energy?.steg_debt ?? 4.2,
      };

      // Apply overrides from active signals
      const signalOverrides: Record<string, number> = {};
      data.active_signals.forEach(sig => {
        Object.entries(sig.overrides).forEach(([key, val]) => {
          signalOverrides[key] = val;
        });
      });

      const overrides = { ...baseOverrides, ...signalOverrides };

      // ── EQ.10 — Ψ_soc(t) SBDE Integration ──────────────────────────────
      // Compute live SBDE with economic stress from current pipeline data
      const econStress = Math.min(1, (data.economy?.inflation ?? 7.1) / 15);
      const liveSbde = computeSBDE({
        ...DEFAULT_SBDE_INPUTS,
        economic_stress: econStress,
        youth_unemployment_rate: (data.economy?.youth_unemployment ?? 37.8) / 100,
      });
      setSbdeResult(liveSbde);

      // Inject Ψ_soc as _psi_soc override — rriEngine reads this
      overrides['_psi_soc'] = liveSbde.psi_soc;
      overrides['_psi_soc_weight'] = W_PSI_RRI;
      // ─────────────────────────────────────────────────────────────────────

      const newState = calculateRRI(overrides);
      newState.active_signals = data.active_signals;
      setRriState(newState);

      // Run AgriIntel satellite engine
      const agriInputs = generateMockInputs('drought'); // Mock for dev baseline
      const summary = processAllGovernorates(agriInputs);
      setAgriSummary(summary);

      // Also update the legacy data.rri fields for backward compatibility
      // We use a functional update to avoid dependency on data
      setData(prev => ({
        ...prev,
        rri: {
          ...prev.rri,
          rri: newState.rri,
          p_rev: newState.p_rev,
          salience: newState.salience,
          w_t: newState.w_t,
          ci_low: newState.ci_low,
          ci_high: newState.ci_high,
          last_updated: new Date().toISOString()
        }
      }));

    } catch(e) {
      console.error('RRI recalculation failed:', e);
    }
  }, [data.economy, data.social, data.geopolitical, data.energy]);

  const addAuditEntry = useCallback((entry: Omit<AuditEntry, 'id'>) => {
    setAuditLog(prev => [{
      ...entry,
      id: Math.random().toString(36).substr(2, 9)
    }, ...prev]);
  }, []);

  const updateField = useCallback((path: string, value: any, source: string) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      const oldValue = obj[parts[parts.length - 1]];
      obj[parts[parts.length - 1]] = value;
      next.last_pipeline_push = new Date().toISOString();
      
      addAuditEntry({
        type: 'PUSH',
        field: path,
        value,
        oldValue,
        source,
        label: path,
        timestamp: new Date().toISOString()
      });

      // Dispatch window event for notifications
      window.dispatchEvent(new CustomEvent('ti:pipeline:push', {
        detail: {
          fields_updated: 1,
          new_rri: rriState.rri,
          changes: [{
            field: path,
            oldValue,
            newValue: value,
          }]
        }
      }));
      
      return next;
    });

    // Update RRI variable if mapped
    if (typeof value === 'number') {
      updateVariableFromPipeline(path, value);
    }
    setTimeout(() => recalculateRRI(), 100);
  }, [addAuditEntry, recalculateRRI]);

  const pushApprovedChanges = useCallback((changes: ApprovedChange[]) => {
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      
      changes.forEach(change => {
        const parts = change.field.split('.');
        let obj = next;
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = change.value;

        addAuditEntry({
          type: 'APPROVED',
          field: change.field,
          value: change.value,
          oldValue: change.oldValue,
          source: change.source,
          label: change.label,
          timestamp: change.approvedAt
        });
      });

      next.last_pipeline_push = new Date().toISOString();

      // Dispatch window event for notifications
      window.dispatchEvent(new CustomEvent('ti:pipeline:push', {
        detail: {
          fields_updated: changes.length,
          new_rri: rriState.rri,
          changes: changes.map(c => ({
            field: c.field,
            oldValue: c.oldValue,
            newValue: c.value,
          }))
        }
      }));

      return next;
    });

    // Update RRI variables for each change
    changes.forEach(change => {
      if (typeof change.value === 'number') {
        updateVariableFromPipeline(change.field, change.value);
      }
    });
    setTimeout(() => recalculateRRI(), 100);
  }, [addAuditEntry, recalculateRRI]);

  useEffect(() => {
    const syncPause = async () => {
      const { setRSSPaused } = await import('../services/rssService');
      setRSSPaused(isPaused);
    };
    syncPause();
  }, [isPaused]);

  useEffect(() => {
    recalculateRRI();
  }, []);

  useEffect(() => {
    const handler = () => recalculateRRI();
    window.addEventListener('rri-recalculate', handler);
    return () => window.removeEventListener('rri-recalculate', handler);
  }, [recalculateRRI]);

  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const { results: satResults, rri_overrides: satOverrides } = e.detail;

        // Fetch consolidated summary from the new Python-backed API
        const response = await fetch('/api/agri/summary');
        if (response.ok) {
          const summary = await response.json();
          setAgroSummary(summary);

          // Apply RRI overrides from the summary
          Object.entries(summary.rri_overrides).forEach(([field, value]) => {
            if (!field.startsWith('_')) {
              updateField(field, value as number, 'AgroIntelligence Engine (Backend)');
            }
          });

          // Notify if BCI crisis
          if (summary.bci.crisis_imminent) {
            addNotification({
              type: 'ALERT',
              priority: 'CRITICAL',
              title: `Bread Crisis Index: ${(summary.bci.BCI * 100).toFixed(0)}% — ${summary.bci.level}`,
              message: `Supply: ${(summary.bci.supply_stress*100).toFixed(0)}% · Price: ${(summary.bci.price_pressure*100).toFixed(0)}% · Public: ${(summary.bci.public_signal*100).toFixed(0)}%`,
              action_label: 'View AgriIntel',
              action_event: 'navigate-main',
              action_detail: { tab: 'agri' },
            });
          }

          if (summary.bci.early_warning) {
            addNotification({
              type: 'ALERT',
              priority: 'HIGH',
              title: `BCI Velocity Alert: +${(summary.bci.velocity * 100).toFixed(0)}% in 7 days`,
              message: 'Bread Crisis Index accelerating. Early warning threshold exceeded.',
              action_label: 'View AgriIntel',
              action_event: 'navigate-main',
              action_detail: { tab: 'agri' },
            });
          }
        } else {
          // Fallback to local calculation if backend fails
          console.warn('Backend agro summary failed, falling back to local calculation');
          const agroInputs: Record<string, any> = {};
          const wheatStress: Record<string, number> = {};

          for (const r of satResults) {
            agroInputs[r.governorate] = buildAgroInput(
              r.governorate,
              r.ndvi ?? 0.35,
              r.rainfall_anomaly ?? 0,
              r.soil_moisture ?? 0.25,
              r.temperature ?? 22,
              data
            );
            wheatStress[r.governorate] = r.wheat_stress ?? 0.35;
          }

          const media_bread_score = detectShortagesInArticles(articleCache)
            .shortages.find(s => s.type === 'flour')?.severity ?? 0;

          const bciInputs = buildBCEWMInputs(
            satOverrides?.national_wheat_stress ?? 0.35,
            data,
            seiResult?.score ?? 0,
            media_bread_score,
            0,
            agroSummary?.bci?.BCI ?? 0
          );

          const summary = processAgroNational(agroInputs, bciInputs, wheatStress);
          setAgroSummary(summary);
        }
      } catch (err) {
        console.error('Failed to update agro summary:', err);
      } finally {
        setTimeout(() => recalculateRRI(), 200);
      }
    };

    window.addEventListener('ti:agri_update', handler);
    return () => window.removeEventListener('ti:agri_update', handler);
  }, [data, seiResult, agroSummary?.bci?.BCI, updateField, recalculateRRI]);

  const resetToDefaults = useCallback(() => {
    setData(DEFAULT_DATA);
    addAuditEntry({
      type: 'RESET',
      field: 'ALL',
      value: null,
      source: 'Analyst',
      label: 'Full reset to defaults',
      timestamp: new Date().toISOString()
    });
  }, [addAuditEntry]);

  const runAIAnalysis = useCallback(async () => {
    if (isAIAnalysisLoading) return;
    setIsAIAnalysisLoading(true);
    try {
      // 1. Process base signals & clusters using current RRI outputs
      const signals = computeSignals({
        R: rriState.r_t,
        compoundStress: rriState.compound_stress,
        salience: rriState.salience,
        infoAmplification: rriState.info_amplification,
        remittanceEffect: 0.1, // Fixed parameter fallback
        protestInfectedRatio: rriState.sir_infected,
        defectionProbability: rriState.elite_defection_prob,
        eliteCohesion: rriState.elite_cohesion_dynamics,
        velocity: rriState.velocity,
        cascadeProbability: rriState.cascade_probability,
        shock: rriState.stochastic_shock,
        historicalSimilarity: rriState.pattern_similarity
      });
      const clusters = computeClusters(signals);
      
      // We need previous states for alerts, but for now we can pass same to generate baseline
      const { alerts, situations } = generateSmartAlerts(
        signals, signals, clusters, clusters, null
      );
      
      const { insights } = generateAgentInsights(signals, clusters, alerts, null);

      // 2. Parallel run analysis & forecast
      const [analysis, forecastResult, mii, actors] = await Promise.all([
        generateAIAnalysis(signals, clusters, alerts, situations, insights),
        generateForecast({ rri: rriState.rri, data }, []),
        computeMII(),
        analyzeActorNetwork([]) // We could pass articles here if we had them in context
      ]);

      setAiAnalysis(analysis);
      setForecast(forecastResult);
      setMiiProfile(mii);
      setActorNetwork(actors);
      // temporalAnalysis requires complex per-variable mapping, skipping for now or return empty
      setTemporalAnalysis({});

      addAuditEntry({
        type: 'EXTRACTED',
        field: 'AI_ANALYSIS',
        value: analysis.riskLevel,
        source: 'CoreLogic v2.0',
        label: 'Intelligence cycle complete',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('AI Analysis failed:', e);
    } finally {
      setIsAIAnalysisLoading(false);
    }
  }, [data, rriState, isAIAnalysisLoading, addAuditEntry]);

  useEffect(() => {
    if (!aiAnalysis && !isAIAnalysisLoading) {
      runAIAnalysis();
    }
  }, [aiAnalysis, isAIAnalysisLoading, runAIAnalysis]);

  const injectSignal = useCallback((signalId: string) => {
    const preset = PRESET_SHOCKS[signalId];
    if (!preset) return;

    const signal: ShockSignal = {
      ...preset,
      timestamp: Date.now()
    };

    setData(prev => ({
      ...prev,
      active_signals: [...prev.active_signals.filter(s => s.id !== signalId), signal]
    }));

    addNotification({
      type: 'SHOCK',
      priority: 'CRITICAL',
      title: `⚡ ${signal.type} SHOCK: ${signal.id}`,
      message: signal.message,
      action_label: 'View Impact',
      action_event: 'navigate-main',
      action_detail: { tab: 'risk' }
    });

    setTimeout(() => recalculateRRI(), 100);
  }, [addNotification, recalculateRRI]);

  return (
    <PipelineContext.Provider value={{
      data, updateField, pushApprovedChanges, 
      resetToDefaults, addAuditEntry, auditLog,
      rriState, recalculateRRI,
      aiAnalysis, forecast, isAIAnalysisLoading,
      miiProfile, actorNetwork, temporalAnalysis, agriSummary, agroSummary, seiResult,
      sbdeResult,
      runAIAnalysis,
      isPaused,
      togglePause,
      injectSignal,
      activeSignals: data.active_signals,
      updateArticleCache: (articles: any) => {}
    }}>
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => useContext(PipelineContext);
