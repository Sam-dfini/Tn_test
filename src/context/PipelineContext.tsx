import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    last_updated: '2026-03-01',
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
      
      return next;
    });
  }, [addAuditEntry]);

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
      return next;
    });
  }, [addAuditEntry]);

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
      resetToDefaults, addAuditEntry, auditLog
    }}>
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => useContext(PipelineContext);
