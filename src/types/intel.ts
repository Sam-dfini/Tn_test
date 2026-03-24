export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ALERT';
export type TensionLevel = 'stable' | 'moderate' | 'tension' | 'high' | 'alert';

export interface Governorate {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  risk_level: RiskLevel;
  tension: TensionLevel;
  rri_score: number;
  protest_count: number;
  unemp: number;
  water_cut_hours: number;
  internet_score: number;
  event_count: number;
  pop: number;
  area_km2: number;
  pop_density: number;
  youth_pct: number;
  rural_pct: number;
  gdp_pc_tnd: number;
  poverty_pct: number;
  literacy_pct: number;
  internal_migration: number;
  healthcare_beds_1k: number;
  lat?: number;
  lon?: number;
  tribal_influence: 'LOW' | 'MEDIUM' | 'HIGH';
  police_presence: 'LOW' | 'MEDIUM' | 'HIGH';
  main_tribes: string[];
  key_industry: string;
  water_source: string;
  election_turnout_2023: number;
  decree54_cases: number;
  migration_attempts_2025: number;
  cascade_risk: number;
  pred_7d: number;
  pred_30d: number;
  pred_90d: number;
}

export interface IntelEvent {
  id: string;
  date: string;
  type: 'protest' | 'arrest' | 'economic' | 'water' |
        'migration' | 'internet' | 'political' | 'detention' |
        'infrastructure' | 'rights' | 'labor';
  title: string;
  summary: string;
  gov: string;
  lat: number;
  lon: number;
  severity: 1 | 2 | 3;
  urgent: boolean;
  actors: string[];
  source: string;
  cases: string[];
}

export interface RRIVariable {
  id: string;
  category: string;
  category_name: string;
  name: string;
  label: string;
  value: number; // normalized 0-1
  raw_value: number;
  unit: string;
  weight: number;
  invert: boolean;
  min_value: number;
  max_value: number;
  volatility: number;
  threshold: number | null;
  threshold_weight: number;
  pipeline_field: string | null;
  nlp_keywords: string[];
  nlp_nudge: number;
  history: number[];
  direction: 'positive' | 'negative';
  source: string;
  last_updated: string;
  update_frequency: string;
  methodology?: string;
}

export interface RRIState {
  // Core outputs (Samir Dni model)
  rri: number;                  // R(t) — Revolutionary Risk Index
  p_rev: number;                // P_rev — Revolution probability 0-1
  salience: number;             // S(t) — Narrative salience
  w_t: number;                  // W(t) — War distraction suppressor
  elite_defection_prob: number; // Probability of elite defection

  // New outputs (TUNISIAINTEL extensions)
  velocity: number;             // V(t) — Rate of change (-1 to +1)
  velocity_label: string;       // "DETERIORATING FAST" etc
  compound_stress: number;      // CS(t) — Non-linear interaction bonus
  pattern_similarity: number;   // HPS(t) — Historical pattern match 0-1
  pattern_label: string;        // "HIGH SIMILARITY TO 2010"
  cascade_probability: number;  // P_cascade — Regional cascade risk
  info_amplification: number;   // A(t) — Information environment factor
  elite_cohesion_dynamics: number; // EC(t) — Elite cohesion trajectory

  // Monte Carlo outputs
  ci_low: number;
  ci_high: number;
  p_rev_mean: number;
  simulations_run: number;

  // Category scores
  category_scores: Record<string, number>;

  // Metadata
  model_confidence: number;
  last_calculated: string;
  variables_count: number;
  threshold_breaches: string[];

  // SIR model state
  sir_susceptible: number;
  sir_infected: number;
  sir_recovered: number;

  // Shock model
  stochastic_shock: number;

  // Legacy fields for backward compatibility
  prev?: number;
  W?: number;
  regime_age?: { age_pct: number; years: number };
  monte_carlo_runs?: number;
}

export interface Actor {
  id: string;
  name: string;
  role: string;
  faction: string;
  influence: number;
  defection_score: number;
  last_seen: string;
  threat_level: 'ACTIVE' | 'MONITORED' | 'INACTIVE';
  connections: string[];
  recent_activity: {
    date: string;
    text: string;
  }[];
}

export interface IntelCase {
  id: string;
  title: string;
  status: 'ACTIVE' | 'MONITORED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  opened: string;
  summary: string;
  governorates: string[];
  actors: string[];
  suspects: string[];
  events: string[];
  timeline: {
    date: string;
    event: string;
  }[];
  classification: string;
}
