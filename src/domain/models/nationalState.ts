// ============================================================
// NATIONAL STATE SNAPSHOT - Domain Model
// ============================================================
// This is the canonical state contract for TunisiaIntel.
// All strategic outputs must derive from one canonical national state.
//
// Rules:
// - Snapshots are immutable after publication.
// - New information creates a new version.
// - All outputs link to snapshot_id.
// - UI always displays the source snapshot_id and freshness.

export type TruthClassification = 'REAL' | 'HYBRID' | 'SIMULATION' | 'PLACEHOLDER' | 'MOCK';

export interface ConfidenceBreakdown {
  overall: number;                    // 0-1
  by_domain: {
    economic: number;                 // 0-1
    political: number;                // 0-1
    social: number;                   // 0-1
    security: number;                 // 0-1
    narrative: number;                // 0-1
  };
  by_source: {
    [sourceName: string]: number;     // Per-source confidence
  };
  model_versions: {
    classification: string;           // e.g. "v2.1"
    brief_model: string;              // e.g. "gpt-4-turbo-2024-04-09"
    rri_engine: string;               // e.g. "rri-engine-v2"
  };
}

export interface Provenance {
  sources: string[];                  // e.g. ["rss", "imf", "laws", "events", "supabase"]
  pipeline_run_id: string;            // Unique ID for this pipeline execution
  model_versions: {
    classification: string;
    brief_model: string;
    rri_engine: string;
  };
  ingested_at: string;                // ISO-8601 timestamp
  processed_at: string;               // ISO-8601 timestamp
}

export interface SnapshotWindow {
  from: string;                       // ISO-8601
  to: string;                         // ISO-8601
}

export interface GovernorateState {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tension: 'stable' | 'moderate' | 'tension' | 'high' | 'alert';
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
  last_updated: string;
}

export interface RiskVector {
  rri: number;                        // R(t) — Revolutionary Risk Index
  p_rev: number;                      // P_rev — Revolution probability 0-1
  salience: number;                   // S(t) — Narrative salience
  w_t: number;                        // W(t) — War distraction suppressor
  ci_low: number;                     // 95% CI lower bound
  ci_high: number;                    // 95% CI upper bound
  velocity: number;                   // V(t) — Rate of change (-1 to +1)
  velocity_label: string;             // "DETERIORATING FAST" etc
  compound_stress: number;            // CS(t) — Non-linear interaction bonus
  pattern_similarity: number;         // HPS(t) — Historical pattern match 0-1
  pattern_label: string;              // "HIGH SIMILARITY TO 2010"
  cascade_probability: number;        // P_cascade — Regional cascade risk
  info_amplification: number;         // A(t) — Information environment factor
  elite_cohesion_dynamics: number;    // EC(t) — Elite cohesion trajectory
  elite_defection_prob: number;       // Probability of elite defection
  cpi_index: number;                  // EQ.22 — Cycle Position Index
  acceleration: number;               // EQ.23 — Acceleration Index
  structural_econ: number;            // EQ.24 — Structural Economic Signal
  sir_susceptible: number;
  sir_infected: number;
  sir_recovered: number;
  stochastic_shock: number;
  last_calculated: string;
  variables_count: number;
  threshold_breaches: {
    variable: string;
    value: number;
    threshold: number;
    impact: number;
  }[];
}

export interface DerivedMetrics {
  rri: number;
  p_rev: number;
  cascade_probability: number;
  velocity: number;
  compound_stress: number;
  elite_defection_prob: number;
}

export interface ActiveShock {
  id: string;
  type: 'ECON' | 'SEC' | 'AGRI' | 'SOCIAL' | 'SYSTEM' | 'POLITICAL' | 'CLIMATE';
  source: string;
  intensity: number;                  // 0-1
  message: string;
  timestamp: number;
  overrides: Record<string, number>;
  governorates?: string[];
  affectedEquations?: string[];
  propagationPath?: string[];
}

export interface ActorGraphRef {
  id: string;
  version: string;
  last_updated: string;
}

export interface EventGraphRef {
  id: string;
  version: string;
  last_updated: string;
  event_count: number;
  recent_events: {
    id: string;
    date: string;
    type: string;
    title: string;
  }[];
}

export interface NationalStateSnapshot {
  // Core identifiers
  snapshot_id: string;                // UUID v4
  version: string;                    // e.g. "v1.2.3" or "2026-05-29T10:30:00Z"
  
  // Timestamps
  created_at: string;                 // ISO-8601 when snapshot was published
  window: SnapshotWindow;             // Time window this snapshot represents
  
  // Truth classification (PR4 - Explainability)
  truth_class: TruthClassification;   // REAL, HYBRID, SIMULATION, PLACEHOLDER, MOCK
  is_simulation: boolean;             // True if this is a simulation fork
  simulation_base_snapshot_id?: string; // If simulation, reference to base
  
  // Provenance and confidence
  provenance: Provenance;
  confidence: ConfidenceBreakdown;
  
  // Core state
  risk_vector: RiskVector;
  derived_metrics: DerivedMetrics;
  governorates: GovernorateState[];
  active_shocks: ActiveShock[];
  
  // Graph references
  actor_graph_ref?: ActorGraphRef;
  event_graph_ref?: EventGraphRef;
  
  // Derived data (for performance)
  active_signals?: ActiveShock[];     // Alias for active_shocks
  last_pipeline_push?: string;        // ISO-8601 of last pipeline update
  
  // Metadata for UI
  freshness: {
    age_seconds: number;
    is_stale: boolean;
    last_updated: string;
  };
  
  // Version history (for traceability)
  parent_snapshot_id?: string;        // If this is an update, reference to previous
  children_snapshot_ids?: string[];   // If this snapshot was forked, references to children
}

// ============================================================
// EXPORTS
// ============================================================

export const TRUTH_CLASSES: TruthClassification[] = [
  'REAL',
  'HYBRID',
  'SIMULATION',
  'PLACEHOLDER',
  'MOCK',
];

export const TRUTH_CLASS_LABELS: Record<TruthClassification, string> = {
  REAL: 'Real Data',
  HYBRID: 'Hybrid (AI + Human)',
  SIMULATION: 'Simulation',
  PLACEHOLDER: 'Placeholder',
  MOCK: 'Mock Data',
};

export const TRUTH_CLASS_COLORS: Record<TruthClassification, string> = {
  REAL: 'text-green-400 bg-green-400/10 border-green-400/20',
  HYBRID: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  SIMULATION: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  PLACEHOLDER: 'text-slate-500 bg-slate-500/10 border-slate-500/20',
  MOCK: 'text-red-400 bg-red-400/10 border-red-400/20',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create a new NationalStateSnapshot from current pipeline state
 */
export function createNationalStateSnapshot(
  pipelineData: any,
  rriState: any,
  activeSignals: any[],
  governorates: any[],
  options?: {
    isSimulation?: boolean;
    simulationBaseSnapshotId?: string;
    parentSnapshotId?: string;
  }
): NationalStateSnapshot {
  const now = new Date().toISOString();
  
  // Calculate confidence scores
  const confidence = calculateConfidence(pipelineData, rriState);
  
  // Build risk vector
  const riskVector = buildRiskVector(rriState);
  
  // Build derived metrics
  const derivedMetrics = buildDerivedMetrics(rriState);
  
  // Build governorate states
  const govStates = governorates.map(gov => buildGovernateState(gov));
  
  // Build provenance
  const provenance = buildProvenance(pipelineData, now);
  
  return {
    snapshot_id: generateSnapshotId(),
    version: now,
    created_at: now,
    window: {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      to: now,
    },
    truth_class: options?.isSimulation ? 'SIMULATION' : 'REAL',
    is_simulation: options?.isSimulation || false,
    simulation_base_snapshot_id: options?.simulationBaseSnapshotId,
    provenance,
    confidence,
    risk_vector: riskVector,
    derived_metrics: derivedMetrics,
    governorates: govStates,
    active_shocks: activeSignals.map(buildActiveShock),
    freshness: {
      age_seconds: 0,
      is_stale: false,
      last_updated: now,
    },
    parent_snapshot_id: options?.parentSnapshotId,
    children_snapshot_ids: [],
  };
}

/**
 * Calculate confidence scores based on data sources and model outputs
 */
function calculateConfidence(pipelineData: any, rriState: any): ConfidenceBreakdown {
  // Base confidence on data freshness and model outputs
  const dataFreshnessScore = calculateDataFreshnessScore(pipelineData);
  const modelConfidence = rriState?.model_confidence || 0.75;
  
  return {
    overall: (dataFreshnessScore + modelConfidence) / 2,
    by_domain: {
      economic: calculateDomainConfidence(pipelineData?.economy),
      political: calculateDomainConfidence(pipelineData?.geopolitical),
      social: calculateDomainConfidence(pipelineData?.social),
      security: 0.70, // Default for security domain
      narrative: 0.65, // Default for narrative domain
    },
    by_source: {
      supabase: 0.85,
      rss: 0.70,
      imf: 0.80,
      wb: 0.75,
      bct: 0.82,
      laws: 0.90,
      events: 0.65,
    },
    model_versions: {
      classification: 'v2.1',
      brief_model: 'gpt-4-turbo-2024-04-09',
      rri_engine: 'rri-engine-v2',
    },
  };
}

function calculateDataFreshnessScore(data: any): number {
  if (!data) return 0.5;
  
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  const scores = [];
  
  if (data.economy?.last_updated) {
    const age = now - new Date(data.economy.last_updated).getTime();
    scores.push(Math.max(0, 1 - age / oneDayMs));
  }
  
  if (data.social?.last_updated) {
    const age = now - new Date(data.social.last_updated).getTime();
    scores.push(Math.max(0, 1 - age / oneDayMs));
  }
  
  if (data.geopolitical?.last_updated) {
    const age = now - new Date(data.geopolitical.last_updated).getTime();
    scores.push(Math.max(0, 1 - age / oneDayMs));
  }
  
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;
}

function calculateDomainConfidence(domainData: any): number {
  if (!domainData) return 0.5;
  
  // Base confidence on presence of key fields
  const keys = Object.keys(domainData);
  const knownKeys = Object.keys(domainData).filter(k => 
    !k.includes('last_updated') && !k.includes('source')
  );
  
  return Math.min(0.95, 0.5 + (knownKeys.length / 20));
}

function buildRiskVector(rriState: any): RiskVector {
  if (!rriState) {
    return {
      rri: 2.31,
      p_rev: 0.643,
      salience: 0.412,
      w_t: 0.72,
      ci_low: 59.8,
      ci_high: 68.7,
      velocity: 0,
      velocity_label: 'STABLE',
      compound_stress: 0,
      pattern_similarity: 0,
      pattern_label: 'NO PATTERN MATCH',
      cascade_probability: 0.3,
      info_amplification: 1,
      elite_cohesion_dynamics: 0.5,
      elite_defection_prob: 0.2,
      cpi_index: 0,
      acceleration: 0,
      structural_econ: 0,
      sir_susceptible: 0.9,
      sir_infected: 0.05,
      sir_recovered: 0.05,
      stochastic_shock: 0,
      last_calculated: new Date().toISOString(),
      variables_count: 0,
      threshold_breaches: [],
    };
  }
  
  return {
    rri: rriState.rri || 2.31,
    p_rev: rriState.p_rev || 0.643,
    salience: rriState.salience || 0.412,
    w_t: rriState.w_t || 0.72,
    ci_low: rriState.ci_low || 59.8,
    ci_high: rriState.ci_high || 68.7,
    velocity: rriState.velocity || 0,
    velocity_label: rriState.velocity_label || 'STABLE',
    compound_stress: rriState.compound_stress || 0,
    pattern_similarity: rriState.pattern_similarity || 0,
    pattern_label: rriState.pattern_label || 'NO PATTERN MATCH',
    cascade_probability: rriState.cascade_probability || 0.3,
    info_amplification: rriState.info_amplification || 1,
    elite_cohesion_dynamics: rriState.elite_cohesion_dynamics || 0.5,
    elite_defection_prob: rriState.elite_defection_prob || 0.2,
    cpi_index: rriState.cpi_index || 0,
    acceleration: rriState.acceleration || 0,
    structural_econ: rriState.structural_econ || 0,
    sir_susceptible: rriState.sir_susceptible || 0.9,
    sir_infected: rriState.sir_infected || 0.05,
    sir_recovered: rriState.sir_recovered || 0.05,
    stochastic_shock: rriState.stochastic_shock || 0,
    last_calculated: rriState.last_calculated || new Date().toISOString(),
    variables_count: rriState.variables_count || 0,
    threshold_breaches: rriState.threshold_breaches || [],
  };
}

function buildDerivedMetrics(rriState: any): DerivedMetrics {
  return {
    rri: rriState?.rri || 2.31,
    p_rev: rriState?.p_rev || 0.643,
    cascade_probability: rriState?.cascade_probability || 0.3,
    velocity: rriState?.velocity || 0,
    compound_stress: rriState?.compound_stress || 0,
    elite_defection_prob: rriState?.elite_defection_prob || 0.2,
  };
}

function buildGovernateState(gov: any): GovernorateState {
  return {
    id: gov.id || 'unknown',
    name: {
      en: gov.name?.en || gov.name || 'Unknown',
      ar: gov.name?.ar || gov.name || 'غير معروف',
    },
    risk_level: gov.risk_level || 'MEDIUM',
    tension: gov.tension || 'moderate',
    rri_score: gov.rri_score || 0,
    protest_count: gov.protest_count || 0,
    unemp: gov.unemp || 0,
    water_cut_hours: gov.water_cut_hours || 0,
    internet_score: gov.internet_score || 0,
    event_count: gov.event_count || 0,
    pop: gov.pop || 0,
    area_km2: gov.area_km2 || 0,
    pop_density: gov.pop_density || 0,
    youth_pct: gov.youth_pct || 0,
    rural_pct: gov.rural_pct || 0,
    gdp_pc_tnd: gov.gdp_pc_tnd || 0,
    poverty_pct: gov.poverty_pct || 0,
    literacy_pct: gov.literacy_pct || 0,
    internal_migration: gov.internal_migration || 0,
    healthcare_beds_1k: gov.healthcare_beds_1k || 0,
    tribal_influence: gov.tribal_influence || 'MEDIUM',
    police_presence: gov.police_presence || 'MEDIUM',
    main_tribes: gov.main_tribes || [],
    key_industry: gov.key_industry || 'Unknown',
    water_source: gov.water_source || 'Unknown',
    election_turnout_2023: gov.election_turnout_2023 || 0,
    decree54_cases: gov.decree54_cases || 0,
    migration_attempts_2025: gov.migration_attempts_2025 || 0,
    cascade_risk: gov.cascade_risk || 0,
    pred_7d: gov.pred_7d || 0,
    pred_30d: gov.pred_30d || 0,
    pred_90d: gov.pred_90d || 0,
    last_updated: gov.last_updated || new Date().toISOString(),
  };
}

function buildActiveShock(signal: any): ActiveShock {
  return {
    id: signal.id || 'unknown',
    type: signal.type || 'SYSTEM',
    source: signal.source || 'Unknown',
    intensity: signal.intensity || 0,
    message: signal.message || '',
    timestamp: signal.timestamp || Date.now(),
    overrides: signal.overrides || {},
    governorates: signal.governorates || [],
    affectedEquations: signal.affectedEquations || [],
    propagationPath: signal.propagationPath || [],
  };
}

function buildProvenance(data: any, now: string): Provenance {
  const sources = new Set<string>();
  
  if (data?.economy?.source) sources.add(data.economy.source.toLowerCase());
  if (data?.social?.source) sources.add(data.social.source.toLowerCase());
  if (data?.geopolitical?.source) sources.add(data.geopolitical.source.toLowerCase());
  if (data?.energy?.source) sources.add(data.energy.source.toLowerCase());
  
  // Add default sources
  sources.add('supabase');
  sources.add('rss');
  sources.add('events');
  
  return {
    sources: Array.from(sources),
    pipeline_run_id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    model_versions: {
      classification: 'v2.1',
      brief_model: 'gpt-4-turbo-2024-04-09',
      rri_engine: 'rri-engine-v2',
    },
    ingested_at: now,
    processed_at: now,
  };
}

function generateSnapshotId(): string {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
