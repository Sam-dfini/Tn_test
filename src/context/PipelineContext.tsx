import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import calculateRRI, {
  updateVariableFromPipeline
} from '../utils/rriEngine';

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
}

interface PlatformData {
  economy: EconomyData;
  energy: EnergyData;
  rri: RRIData;
  geopolitical: GeopoliticalData;
  social: SocialData;
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
}

export const PipelineContext = createContext<PipelineContextType>(
  {} as PipelineContextType
);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PlatformData>(() => {
    try {
      const saved = localStorage.getItem('ti_platform_data');
      return saved ? { ...DEFAULT_DATA, ...JSON.parse(saved) } : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
  });

  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ti_audit_log');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [rriState, setRriState] = useState(() => {
    try {
      return calculateRRI();
    } catch(e) {
      console.error('RRI init failed:', e);
      return {
        rri: 2.31, p_rev: 0.643, salience: 0.412, w_t: 0.72,
        velocity: 0.18, velocity_label: 'DETERIORATING',
        compound_stress: 0.08, pattern_similarity: 0.67,
        pattern_label: 'HIGH — SIGNIFICANT SIMILARITY TO TUNISIA 2010',
        cascade_probability: 0.58, info_amplification: 0.82,
        elite_cohesion_dynamics: 0.65,
        elite_defection_prob: 0.12,
        ci_low: 59.8, ci_high: 68.7, p_rev_mean: 64.3,
        simulations_run: 0,
        category_scores: {},
        model_confidence: 0.72,
        last_calculated: new Date().toISOString(),
        variables_count: 250,
        threshold_breaches: ['A_FX','M_UGTT','E51'],
        sir_susceptible: 0.94, sir_infected: 0.04, sir_recovered: 0.02,
        stochastic_shock: 0.001
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ti_platform_data', JSON.stringify(data));
    } catch {}
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem('ti_audit_log', JSON.stringify(auditLog.slice(0, 200)));
    } catch {}
  }, [auditLog]);

  const recalculateRRI = useCallback(() => {
    try {
      // Build overrides from current pipeline data
      const overrides: Record<string, number> = {
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

      const newState = calculateRRI(overrides);
      setRriState(newState);

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
    recalculateRRI();
  }, []);

  useEffect(() => {
    const handler = () => recalculateRRI();
    window.addEventListener('rri-recalculate', handler);
    return () => window.removeEventListener('rri-recalculate', handler);
  }, [recalculateRRI]);

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

  return (
    <PipelineContext.Provider value={{
      data, updateField, pushApprovedChanges, 
      resetToDefaults, addAuditEntry, auditLog,
      rriState, recalculateRRI
    }}>
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => useContext(PipelineContext);
