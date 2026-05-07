/**
 * TunisiaIntel — Multi-Framework Interpretation Layer
 *
 * Six analytical lenses reading from one engine state.
 * Same data → different interpretations → contradictions are insight.
 *
 * Architecture:
 *   Layer 1: Structural Assessment
 *     A. Fragility Framework (WB/OECD)
 *     B. Conflict Risk Framework (ICG — Grievance × Mobilization × Opportunity)
 *
 *   Layer 2: Dynamic Assessment
 *     C. Strategic Pressure Framework (ETM + MII synthesis — replaces Bezmenov)
 *     D. Information Environment Framework (NATO StratCom)
 *
 *   Layer 3: Predictive Assessment
 *     E. Cascade Simulation (Complex Systems)
 *     F. Elite Power Game (Game Theory)
 *
 * Plus: Contradiction Detector — compares outputs across frameworks
 * to identify analytically significant mismatches.
 */

// ── Input State ────────────────────────────────────────────────
// Accepts rriState + data from PipelineContext
// Self-contained: works without ETM/RDE/MII engines applied

export interface FrameworkInput {
  // From rriState
  rri: number;
  p_rev: number;
  salience: number;
  w_t: number;
  velocity: number;
  velocity_label: string;
  compound_stress: number;
  pattern_similarity: number;
  pattern_label: string;
  cascade_probability: number;
  info_amplification: number;
  elite_cohesion_dynamics: number;
  elite_defection_prob: number;
  sir_infected: number;
  sir_susceptible: number;
  category_scores: Record<string, number>;

  // From data.economy
  inflation: number;
  fx_reserves: number;
  unemployment: number;
  youth_unemployment: number;
  public_debt: number;
  parallel_market_premium: number;
  gdp_growth: number;

  // From data.social
  protest_events_30d: number;
  ugtt_mobilisation_level: string;
  decree54_charged: number;
  water_crisis_govs: number;
  press_freedom_rank: number;

  // From data.geopolitical
  imf_deal_probability: number;

  // From new engines (optional — default to 0 if not applied)
  mii?: number;
  miiPhase?: string;
  loyalistConcentration?: number;
  rpi?: number;              // Radicalization Pressure Index
  escalationLevel?: number;
  etmClosure?: number;       // ETM narrative closure 0-1
  etmPhase?: string;
  seiMax?: number;           // Shortage Escalation Index
  seiAngerWindow?: boolean;
}

// ── Framework Output Types ─────────────────────────────────────

export interface FragilityOutput {
  dimensions: {
    security: number;     // 0-100
    political: number;
    economic: number;
    social: number;
  };
  compositeFragility: number;  // 0-100
  fragilityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  radarData: Array<{ subject: string; value: number; fullMark: number }>;
  keyDrivers: string[];
  wbComparison: string; // where Tunisia sits vs WB fragility benchmarks
}

export interface ConflictRiskOutput {
  grievance: number;        // 0-100
  mobilization: number;     // 0-100
  opportunity: number;      // 0-100
  riskScore: number;        // composite 0-100
  riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  dominantDriver: 'GRIEVANCE' | 'MOBILIZATION' | 'OPPORTUNITY';
  triggerSensitivity: Array<{ trigger: string; impact: string }>;
  estimatedTimeframe: string;
}

export type StrategicStage =
  | 'LATENT_STRESS'
  | 'STRUCTURAL_PRESSURE'
  | 'ACTIVE_DESTABILIZATION'
  | 'CRISIS'
  | 'NORMALIZATION';

export interface StrategicPressureOutput {
  stage: StrategicStage;
  stageLabel: string;
  stageScore: number;       // 0-100, position within stage
  transitionProbability: number; // probability of moving to next stage
  nextStage: StrategicStage | null;
  deliberateEngineering: boolean; // is there evidence of intentional pressure?
  engineeringConfidence: number;  // 0-1
  pressureSources: string[];      // what's driving it
  stateMachineBar: Array<{        // for timeline visualization
    stage: StrategicStage;
    label: string;
    active: boolean;
    passed: boolean;
  }>;
}

export interface InformationEnvironmentOutput {
  narrativeDominance: {
    regime: number;       // 0-100
    opposition: number;
    external: number;
  };
  amplificationFactor: number;  // 1.0-2.0
  suppressionActive: boolean;   // is regime suppressing information?
  outrageMomentum: number;      // 0-100, is anger growing or fading?
  informationControl: 'STATE' | 'CONTESTED' | 'OPEN' | 'DEGRADED';
  digitalDivideEffect: number;  // 0-1, how much DD(t) limits spread
  keyDynamics: string[];
}

export interface CascadeOutput {
  governorateRisks: Array<{
    name: string;
    risk: number;         // 0-100
    activationThreshold: number;
    dayToActivation: number | null;
    isFocal: boolean;     // most likely ignition point
  }>;
  cascadeSequence: Array<{ from: string; to: string; probability: number }>;
  systemicRisk: number;   // 0-100
  focalPoint: string;
  estimatedSpread: string; // "72 hours", "7-14 days", etc.
  containmentPossible: boolean;
}

export interface EliteGameOutput {
  actors: Array<{
    name: string;
    loyalty: number;      // 0-100
    defectionRisk: number; // 0-100
    influence: string;    // 'CRITICAL' | 'HIGH' | 'MEDIUM'
    status: 'LOYAL' | 'WAVERING' | 'DEFECTION_RISK' | 'DEFECTED';
  }>;
  nashEquilibrium: 'STABLE' | 'UNSTABLE' | 'CASCADING';
  cohesionIndex: number;  // 0-100
  defectionTrigger: string;
  cascadeDefectionRisk: number; // 0-100
  regimeSurvivalProbability: number; // 0-100
}

export interface ContradictionOutput {
  contradictions: Array<{
    id: string;
    type: 'STRUCTURAL_WITHOUT_NARRATIVE'
      | 'NARRATIVE_WITHOUT_FUEL'
      | 'ELITE_FRACTURE_NO_MOBILIZATION'
      | 'COMMODITY_WITHOUT_FRAME'
      | 'HIGH_FRAGILITY_LOW_ACTIVATION'
      | 'NONE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    title: string;
    description: string;
    interpretation: string;
    actionImplication: string;
  }>;
  overallCoherence: number;  // 0-1, how consistent are all frameworks
  analystNote: string;       // synthesized plain-language assessment
}

export interface FrameworkOutput {
  fragility: FragilityOutput;
  conflictRisk: ConflictRiskOutput;
  strategicPressure: StrategicPressureOutput;
  informationEnvironment: InformationEnvironmentOutput;
  cascade: CascadeOutput;
  eliteGame: EliteGameOutput;
  contradiction: ContradictionOutput;
  computedAt: number;
}

// ── Framework A: Fragility (WB/OECD) ──────────────────────────

function computeFragility(s: FrameworkInput): FragilityOutput {
  // Security dimension
  const security = Math.round(
    (s.category_scores?.N ?? 0.5) * 40 +
    (s.elite_defection_prob) * 30 +
    (s.cascade_probability) * 20 +
    (s.water_crisis_govs / 24) * 10
  );

  // Political dimension
  const political = Math.round(
    (1 - (s.category_scores?.D ?? 0.5)) * 0 + // D is inverted (low score = bad)
    ((s.decree54_charged / 50) * 25) +
    (1 - (s.imf_deal_probability / 100)) * 20 +
    ((100 - s.press_freedom_rank) / 180 * 100) * 0.25 +
    (s.mii ?? 0.57) * 100 * 0.30
  );

  // Economic dimension
  const economic = Math.round(
    (s.inflation / 15) * 100 * 0.25 +
    Math.max(0, (1 - s.fx_reserves / 120)) * 100 * 0.25 +
    (s.unemployment / 25) * 100 * 0.20 +
    (s.public_debt / 100) * 100 * 0.15 +
    (s.parallel_market_premium / 30) * 100 * 0.15
  );

  // Social dimension
  const social = Math.round(
    (s.youth_unemployment / 50) * 100 * 0.30 +
    (s.protest_events_30d / 40) * 100 * 0.25 +
    (s.ugtt_mobilisation_level === 'HIGH' ? 80 :
     s.ugtt_mobilisation_level === 'ELEVATED' ? 55 : 30) * 0.25 +
    (s.seiMax ?? 0) * 100 * 0.20
  );

  const composite = Math.round(
    security * 0.25 +
    political * 0.25 +
    economic * 0.30 +
    social * 0.20
  );

  const level: FragilityOutput['fragilityLevel'] =
    composite >= 75 ? 'EXTREME' :
    composite >= 55 ? 'HIGH' :
    composite >= 35 ? 'MODERATE' : 'LOW';

  const keyDrivers: string[] = [];
  if (economic > 65) keyDrivers.push(`Economic stress: ${economic}% (inflation ${s.inflation}%, FX ${s.fx_reserves}d)`);
  if (political > 60) keyDrivers.push(`Political fragility: ${political}% (Decree 54: ${s.decree54_charged} charged)`);
  if (social > 60) keyDrivers.push(`Social cohesion: ${social}% (${s.protest_events_30d} protests/month)`);
  if (security > 55) keyDrivers.push(`Security stress: ${security}% (defection risk elevated)`);

  const wbComparison =
    composite >= 75 ? 'Comparable to pre-2011 Egypt/Yemen (EXTREME)' :
    composite >= 55 ? 'Above MENA fragility average — comparable to Jordan 2019' :
    composite >= 35 ? 'Moderate — comparable to Morocco 2018' :
    'Below regional average';

  return {
    dimensions: {
      security: Math.min(100, security),
      political: Math.min(100, political),
      economic: Math.min(100, economic),
      social: Math.min(100, social),
    },
    compositeFragility: Math.min(100, composite),
    fragilityLevel: level,
    radarData: [
      { subject: 'Security', value: Math.min(100,security), fullMark: 100 },
      { subject: 'Political', value: Math.min(100,political), fullMark: 100 },
      { subject: 'Economic', value: Math.min(100,economic), fullMark: 100 },
      { subject: 'Social', value: Math.min(100,social), fullMark: 100 },
    ],
    keyDrivers,
    wbComparison,
  };
}

// ── Framework B: Conflict Risk (ICG) ──────────────────────────

function computeConflictRisk(s: FrameworkInput): ConflictRiskOutput {
  // Grievance — economic injustice + political exclusion
  const grievance = Math.round(
    (s.inflation / 12) * 100 * 0.25 +
    (s.youth_unemployment / 45) * 100 * 0.25 +
    (s.decree54_charged / 40) * 100 * 0.20 +
    (1 - s.imf_deal_probability / 100) * 100 * 0.15 +
    (s.seiMax ?? 0) * 100 * 0.15
  );

  // Mobilization — capacity to organize and act
  const mobilization = Math.round(
    (s.sir_infected) * 100 * 5 * 0.25 +  // SIR infected × 5 to scale 0-100
    (s.salience) * 100 * 0.25 +
    (s.protest_events_30d / 35) * 100 * 0.20 +
    (s.ugtt_mobilisation_level === 'HIGH' ? 85 :
     s.ugtt_mobilisation_level === 'ELEVATED' ? 60 : 35) * 0.20 +
    (s.rpi ?? 0) * 100 * 0.10
  );

  // Opportunity — weakness of state, elite fracture
  const opportunity = Math.round(
    (1 - s.elite_cohesion_dynamics) * 100 * 0.30 +
    (s.elite_defection_prob) * 100 * 0.25 +
    (s.cascade_probability) * 100 * 0.20 +
    (s.mii ?? 0.57) * 100 * 0.25
  );

  // Additive with interaction term (not multiplicative)
  const base = grievance * 0.35 + mobilization * 0.35 + opportunity * 0.30;
  // Interaction: when all three elevated simultaneously
  const interaction = (grievance > 60 && mobilization > 60 && opportunity > 60)
    ? (grievance/100 * mobilization/100 * opportunity/100) * 20
    : 0;
  const riskScore = Math.min(100, Math.round(base + interaction));

  const level: ConflictRiskOutput['riskLevel'] =
    riskScore >= 75 ? 'CRITICAL' :
    riskScore >= 55 ? 'HIGH' :
    riskScore >= 35 ? 'ELEVATED' : 'LOW';

  const dominant: ConflictRiskOutput['dominantDriver'] =
    grievance >= mobilization && grievance >= opportunity ? 'GRIEVANCE' :
    mobilization >= opportunity ? 'MOBILIZATION' : 'OPPORTUNITY';

  const triggerSensitivity = [
    { trigger: 'Subsidy cut announcement',
      impact: grievance > 60 ? 'CATASTROPHIC (+25 risk)' : 'HIGH (+15 risk)' },
    { trigger: 'UGTT general strike',
      impact: mobilization > 60 ? 'CRITICAL (+20 risk)' : 'HIGH (+12 risk)' },
    { trigger: 'Military political statement',
      impact: opportunity > 55 ? 'SYSTEM-CHANGING' : 'HIGH (+18 risk)' },
    { trigger: 'FX reserves below 60 days',
      impact: 'HIGH (+14 risk) — import disruption triggers food crisis' },
    { trigger: 'Elite defection (cabinet level)',
      impact: opportunity > 65 ? 'CASCADE TRIGGER' : 'ELEVATED (+10 risk)' },
  ];

  const timeframe =
    riskScore >= 75 ? '0-30 days — immediate risk window' :
    riskScore >= 55 ? '30-90 days — elevated risk period' :
    riskScore >= 35 ? '90-180 days — watch period' :
    'Low immediate risk — structural monitoring';

  return {
    grievance: Math.min(100, grievance),
    mobilization: Math.min(100, mobilization),
    opportunity: Math.min(100, opportunity),
    riskScore,
    riskLevel: level,
    dominantDriver: dominant,
    triggerSensitivity,
    estimatedTimeframe: timeframe,
  };
}

// ── Framework C: Strategic Pressure (ETM + MII synthesis) ─────

function computeStrategicPressure(s: FrameworkInput): StrategicPressureOutput {
  // State machine: not Bezmenov labels but ETM+MII driven
  const etmClosure = s.etmClosure ?? 0.35;
  const mii = s.mii ?? 0.57;
  const rpi = s.rpi ?? 0.25;
  const structuralPressure = s.rri / 5; // normalize to 0-1

  // Composite pressure score
  const pressureScore =
    structuralPressure * 0.30 +
    etmClosure * 0.25 +
    mii * 0.25 +
    rpi * 0.20;

  // Stage classification
  let stage: StrategicStage;
  let stageScore: number;
  let transitionProb: number;

  if (pressureScore >= 0.75) {
    stage = 'CRISIS';
    stageScore = Math.round((pressureScore - 0.75) / 0.25 * 100);
    transitionProb = 0.45; // → NORMALIZATION
  } else if (pressureScore >= 0.55) {
    stage = 'ACTIVE_DESTABILIZATION';
    stageScore = Math.round((pressureScore - 0.55) / 0.20 * 100);
    transitionProb = 0.35; // → CRISIS
  } else if (pressureScore >= 0.35) {
    stage = 'STRUCTURAL_PRESSURE';
    stageScore = Math.round((pressureScore - 0.35) / 0.20 * 100);
    transitionProb = 0.28; // → ACTIVE_DESTABILIZATION
  } else if (pressureScore >= 0.15) {
    stage = 'LATENT_STRESS';
    stageScore = Math.round((pressureScore - 0.15) / 0.20 * 100);
    transitionProb = 0.15;
  } else {
    stage = 'LATENT_STRESS';
    stageScore = Math.round(pressureScore / 0.15 * 100);
    transitionProb = 0.08;
  }

  // Deliberate engineering signal
  // High ETM closure + high narrative coordination = engineered
  const deliberate = etmClosure > 0.50 && mii > 0.55;
  const engineeringConf = deliberate
    ? Math.min(0.9, etmClosure * 0.6 + mii * 0.4)
    : 0;

  const pressureSources: string[] = [];
  if (structuralPressure > 0.45)
    pressureSources.push(`Structural economic pressure (R(t)=${s.rri.toFixed(2)})`);
  if (etmClosure > 0.40)
    pressureSources.push(`Narrative closure (ETM=${(etmClosure*100).toFixed(0)}%)`);
  if (mii > 0.50)
    pressureSources.push(`Elite instability (MII=${(mii*100).toFixed(0)}%, Phase: ${s.miiPhase ?? 'FREEZE'})`);
  if (rpi > 0.30)
    pressureSources.push(`Radicalisation pressure (RPI=${(rpi*100).toFixed(0)}%)`);

  const STAGE_SEQUENCE: StrategicStage[] = [
    'LATENT_STRESS', 'STRUCTURAL_PRESSURE',
    'ACTIVE_DESTABILIZATION', 'CRISIS', 'NORMALIZATION'
  ];
  const currentIdx = STAGE_SEQUENCE.indexOf(stage);

  const STAGE_LABELS: Record<StrategicStage, string> = {
    LATENT_STRESS: 'Latent Stress',
    STRUCTURAL_PRESSURE: 'Structural Pressure',
    ACTIVE_DESTABILIZATION: 'Active Destabilization',
    CRISIS: 'Crisis',
    NORMALIZATION: 'Normalization',
  };

  const stateMachineBar = STAGE_SEQUENCE.map((st, idx) => ({
    stage: st,
    label: STAGE_LABELS[st],
    active: st === stage,
    passed: idx < currentIdx,
  }));

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    stageScore,
    transitionProbability: transitionProb,
    nextStage: currentIdx < STAGE_SEQUENCE.length - 1
      ? STAGE_SEQUENCE[currentIdx + 1]
      : null,
    deliberateEngineering: deliberate,
    engineeringConfidence: engineeringConf,
    pressureSources,
    stateMachineBar,
  };
}

// ── Framework D: Information Environment (NATO StratCom) ───────

function computeInformationEnvironment(s: FrameworkInput): InformationEnvironmentOutput {
  const etmClosure = s.etmClosure ?? 0.35;
  const etmPhase = s.etmPhase ?? 'AMPLIFICATION';

  // Narrative dominance — who controls the frame?
  // High ETM closure + REGIME vector = state control
  // High ETM closure + OPPOSITION/EXTERNAL = contested
  const regimeDominance = Math.round(
    (1 - (s.decree54_charged / 40)) * 40 +
    (100 - s.press_freedom_rank) / 180 * 100 * 0.30 +
    (s.mii ?? 0.57) * (s.loyalistConcentration ?? 0.76) * 30
  );

  const oppositionDominance = Math.round(
    (s.protest_events_30d / 30) * 100 * 0.35 +
    (s.ugtt_mobilisation_level === 'HIGH' ? 80 :
     s.ugtt_mobilisation_level === 'ELEVATED' ? 55 : 30) * 0.35 +
    (s.rpi ?? 0) * 100 * 0.30
  );

  const externalDominance = Math.round(
    (s.w_t) * 100 * 0.50 +
    (s.salience) * 100 * 0.30 +
    (1 - s.imf_deal_probability / 100) * 40 * 0.20
  );

  // Amplification — A(t) normalized to 0-100
  const amplification = s.info_amplification;

  // Suppression: high decree54 + low press freedom = active suppression
  const suppressionActive =
    s.decree54_charged > 20 && s.press_freedom_rank > 100;

  // Outrage momentum — is anger growing?
  const outrageMomentum = Math.round(
    (s.velocity > 0 ? s.velocity * 100 : 0) * 0.40 +
    (s.sir_infected * 500) * 0.30 +
    (s.seiMax ?? 0) * 100 * 0.30
  );

  // Information control classification
  const control: InformationEnvironmentOutput['informationControl'] =
    suppressionActive && regimeDominance > 60 ? 'STATE' :
    oppositionDominance > regimeDominance ? 'CONTESTED' :
    externalDominance > 60 ? 'OPEN' : 'DEGRADED';

  const digitalDivideEffect = Math.min(1,
    (s.water_crisis_govs / 24) * 0.5 + 0.3
  );

  const keyDynamics: string[] = [];
  if (suppressionActive)
    keyDynamics.push(`Active suppression: Decree 54 (${s.decree54_charged} charged), press rank #${s.press_freedom_rank}`);
  if (amplification > 1.3)
    keyDynamics.push(`High amplification: A(t)=${amplification.toFixed(2)} — content spreading rapidly`);
  if (etmPhase === 'CLOSURE')
    keyDynamics.push('ETM narrative at closure — unfalsifiable belief system active');
  if (externalDominance > 50)
    keyDynamics.push(`War salience W(t)=${s.w_t.toFixed(2)} shaping domestic framing`);

  return {
    narrativeDominance: {
      regime: Math.min(100, regimeDominance),
      opposition: Math.min(100, oppositionDominance),
      external: Math.min(100, externalDominance),
    },
    amplificationFactor: amplification,
    suppressionActive,
    outrageMomentum: Math.min(100, outrageMomentum),
    informationControl: control,
    digitalDivideEffect,
    keyDynamics,
  };
}

// ── Framework E: Cascade Simulation ───────────────────────────

function computeCascade(s: FrameworkInput): CascadeOutput {
  // Governorate risk profiles — calibrated to Tunisia
  const GOV_PROFILES = [
    { name: 'Gafsa',       baseRisk: 78, threshold: 0.60, daysBase: 7,  focal: true },
    { name: 'Kasserine',   baseRisk: 72, threshold: 0.62, daysBase: 9,  focal: false },
    { name: 'Sidi Bouzid', baseRisk: 65, threshold: 0.65, daysBase: 12, focal: false },
    { name: 'Gabès',       baseRisk: 58, threshold: 0.68, daysBase: 14, focal: false },
    { name: 'Siliana',     baseRisk: 55, threshold: 0.70, daysBase: 16, focal: false },
    { name: 'Sfax',        baseRisk: 48, threshold: 0.72, daysBase: 18, focal: false },
    { name: 'Sousse',      baseRisk: 35, threshold: 0.78, daysBase: 22, focal: false },
    { name: 'Tunis',       baseRisk: 28, threshold: 0.82, daysBase: 28, focal: false },
  ];

  const protestFactor = Math.min(1, s.protest_events_30d / 30);
  const seiBoost = (s.seiMax ?? 0) * 20;
  const miiBoost = (s.mii ?? 0.57) * 15;

  const governorateRisks = GOV_PROFILES.map(g => {
    const risk = Math.min(100, Math.round(
      g.baseRisk + protestFactor * 15 + seiBoost + miiBoost
    ));
    const activated = s.cascade_probability > g.threshold;
    const daysToActivation = activated
      ? null
      : Math.round(g.daysBase * (1 - s.velocity * 2));

    return {
      name: g.name,
      risk,
      activationThreshold: Math.round(g.threshold * 100),
      dayToActivation: daysToActivation ? Math.max(1, daysToActivation) : null,
      isFocal: g.focal,
    };
  });

  // Cascade sequence — based on geographic + historical patterns
  const cascadeSequence = [
    { from: 'Gafsa', to: 'Kasserine', probability: Math.round(s.cascade_probability * 85) },
    { from: 'Kasserine', to: 'Sidi Bouzid', probability: Math.round(s.cascade_probability * 75) },
    { from: 'Sidi Bouzid', to: 'Gabès', probability: Math.round(s.cascade_probability * 65) },
    { from: 'Multiple Interior', to: 'Sfax', probability: Math.round(s.cascade_probability * 55) },
    { from: 'Sfax', to: 'Tunis', probability: Math.round(s.cascade_probability * 40) },
  ];

  const systemicRisk = Math.round(s.cascade_probability * 100);
  const focalPoint = governorateRisks.find(g => g.isFocal)?.name ?? 'Gafsa';

  const spread =
    systemicRisk >= 70 ? '48-72 hours to multi-governorate activation' :
    systemicRisk >= 50 ? '7-14 days if focal point ignites' :
    systemicRisk >= 30 ? '14-30 days, conditional on trigger event' :
    'Low cascade risk — localized events unlikely to spread';

  return {
    governorateRisks,
    cascadeSequence,
    systemicRisk,
    focalPoint,
    estimatedSpread: spread,
    containmentPossible: systemicRisk < 60,
  };
}

// ── Framework F: Elite Power Game ──────────────────────────────

function computeEliteGame(s: FrameworkInput): EliteGameOutput {
  const mii = s.mii ?? 0.57;
  const loyalist = s.loyalistConcentration ?? 0.76;
  const defProb = s.elite_defection_prob;
  const cohesion = s.elite_cohesion_dynamics;

  // Actor profiles — calibrated to Tunisia
  const actors = [
    {
      name: 'Military Command',
      loyaltyBase: 78,
      influenceLevel: 'CRITICAL' as const,
      // Military stays out until threshold; then decisive
      defectionRisk: Math.round(defProb * 40 + (1 - cohesion) * 30),
    },
    {
      name: 'Security Apparatus',
      loyaltyBase: 82,
      influenceLevel: 'CRITICAL' as const,
      defectionRisk: Math.round(defProb * 45 + mii * 20),
    },
    {
      name: 'UGTT Leadership',
      loyaltyBase: 25,
      influenceLevel: 'HIGH' as const,
      // Already low loyalty — high defection/opposition
      defectionRisk: Math.round(
        (s.ugtt_mobilisation_level === 'HIGH' ? 80 :
         s.ugtt_mobilisation_level === 'ELEVATED' ? 60 : 40)
      ),
    },
    {
      name: 'Business Elite / UTICA',
      loyaltyBase: 45,
      influenceLevel: 'HIGH' as const,
      defectionRisk: Math.round(
        (1 - s.imf_deal_probability / 100) * 40 +
        (s.parallel_market_premium / 25) * 30
      ),
    },
    {
      name: 'Loyalist Cabinet',
      loyaltyBase: Math.round(loyalist * 100),
      influenceLevel: 'MEDIUM' as const,
      defectionRisk: Math.round(defProb * 60 + mii * 25),
    },
    {
      name: 'Independent Judiciary (residual)',
      loyaltyBase: 30,
      influenceLevel: 'MEDIUM' as const,
      defectionRisk: Math.round(s.decree54_charged / 50 * 100),
    },
  ];

  const mappedActors = actors.map(a => {
    const defRisk = Math.min(100, a.defectionRisk);
    const loyalty = Math.max(0, Math.min(100, a.loyaltyBase - defRisk * 0.3));
    const status: EliteGameOutput['actors'][0]['status'] =
      defRisk >= 75 ? 'DEFECTION_RISK' :
      defRisk >= 50 ? 'WAVERING' :
      'LOYAL';

    return {
      name: a.name,
      loyalty: Math.round(loyalty),
      defectionRisk: defRisk,
      influence: a.influenceLevel,
      status,
    };
  });

  // Nash equilibrium — is the coalition stable?
  const avgDefRisk = mappedActors.reduce((s, a) => s + a.defectionRisk, 0) / mappedActors.length;
  const criticalDefRisk = mappedActors
    .filter(a => a.influence === 'CRITICAL')
    .reduce((s, a) => s + a.defectionRisk, 0) / 2;

  const equilibrium: EliteGameOutput['nashEquilibrium'] =
    criticalDefRisk >= 65 ? 'CASCADING' :
    avgDefRisk >= 50 ? 'UNSTABLE' : 'STABLE';

  const cohesionIndex = Math.round(cohesion * 100);

  const trigger =
    criticalDefRisk >= 65
      ? 'Military or security apparatus signal — cascade irreversible'
      : avgDefRisk >= 55
      ? 'Business elite defection or UGTT escalation — tipping point near'
      : 'Sustained economic deterioration or external shock';

  const cascadeDefRisk = Math.round(
    defProb * 60 + (1 - cohesion) * 40
  );

  const regimeSurvival = Math.round(
    Math.max(10, 100 - cascadeDefRisk * 0.6 - mii * 20 - s.rri / 5 * 10)
  );

  return {
    actors: mappedActors,
    nashEquilibrium: equilibrium,
    cohesionIndex,
    defectionTrigger: trigger,
    cascadeDefectionRisk: cascadeDefRisk,
    regimeSurvivalProbability: Math.min(95, regimeSurvival),
  };
}

// ── Contradiction Detector ─────────────────────────────────────

function detectContradictions(
  fragility: FragilityOutput,
  conflict: ConflictRiskOutput,
  strategic: StrategicPressureOutput,
  info: InformationEnvironmentOutput,
  cascade: CascadeOutput,
  elite: EliteGameOutput,
  s: FrameworkInput
): ContradictionOutput {
  const contradictions: ContradictionOutput['contradictions'] = [];

  // Type 1: High structural fragility + low narrative closure
  // Structure is broken but no narrative is channeling it
  if (fragility.compositeFragility > 60 && (s.etmClosure ?? 0) < 0.30) {
    contradictions.push({
      id: 'C1',
      type: 'STRUCTURAL_WITHOUT_NARRATIVE',
      severity: 'HIGH',
      title: 'Structural Crisis Without Narrative Frame',
      description: `Fragility at ${fragility.compositeFragility}% but ETM closure only ${((s.etmClosure ?? 0)*100).toFixed(0)}%.`,
      interpretation: 'Structural conditions for crisis exist but no engineered narrative is channeling the anger. The instability, if it comes, will be endogenous — driven by accumulated failure, not external engineering.',
      actionImplication: 'Address structural conditions. No single external actor to counter. Economic intervention more effective than information operations.',
    });
  }

  // Type 2: High narrative closure + low RPI
  // Narrative is forming but no radicalization pressure sustaining it
  if ((s.etmClosure ?? 0) > 0.55 && (s.rpi ?? 0) < 0.25) {
    contradictions.push({
      id: 'C2',
      type: 'NARRATIVE_WITHOUT_FUEL',
      severity: 'MEDIUM',
      title: 'Narrative Closure Without Radicalization Fuel',
      description: `ETM closure at ${((s.etmClosure ?? 0)*100).toFixed(0)}% but RPI only ${((s.rpi ?? 0)*100).toFixed(0)}%.`,
      interpretation: 'A weaponized narrative is forming but the structural conditions are not there to sustain it. The narrative is fragile — it needs manufactured events or it will dissipate naturally.',
      actionImplication: 'Do not amplify by over-responding. Avoid giving the narrative the fuel of visible counter-pressure. The frame will exhaust itself.',
    });
  }

  // Type 3: High elite defection risk + low cascade probability
  // Elites fracturing but protests haven't reached cascade threshold
  if (elite.cascadeDefectionRisk > 55 && cascade.systemicRisk < 35) {
    contradictions.push({
      id: 'C3',
      type: 'ELITE_FRACTURE_NO_MOBILIZATION',
      severity: 'HIGH',
      title: 'Elite Fracture Without Popular Mobilization',
      description: `Elite defection risk ${elite.cascadeDefectionRisk}% but cascade probability only ${cascade.systemicRisk}%.`,
      interpretation: 'The elite is fracturing but protest hasn\'t reached cascade threshold. This is the pre-coup configuration, not pre-revolution. The danger is authoritarian consolidation by a competing elite faction, not popular uprising.',
      actionImplication: 'Monitor military and security apparatus. The key event is not a protest — it is a statement or action by a CRITICAL-influence actor. Watch interior ministry appointments.',
    });
  }

  // Type 4: High SEI + low RDE
  // Commodity anger exists but no political frame channeling it
  if ((s.seiMax ?? 0) > 0.55 && (s.rpi ?? 0) < 0.25) {
    contradictions.push({
      id: 'C4',
      type: 'COMMODITY_WITHOUT_FRAME',
      severity: 'MEDIUM',
      title: 'Commodity Anger Without Political Frame',
      description: `SEI at ${((s.seiMax ?? 0)*100).toFixed(0)}% but RPI only ${((s.rpi ?? 0)*100).toFixed(0)}%.`,
      interpretation: 'Commodity stress is escalating but no radicalization narrative is channeling the anger politically. The anger exists but has no frame. This is the window for a legitimate political actor to claim the grievance.',
      actionImplication: 'Whoever provides the frame for this anger captures the constituency. Monitor which political actor begins to adopt food crisis language — they are positioning for the anger window.',
    });
  }

  // Type 5: High fragility + low conflict risk activation
  if (fragility.compositeFragility > 65 && conflict.riskScore < 40) {
    contradictions.push({
      id: 'C5',
      type: 'HIGH_FRAGILITY_LOW_ACTIVATION',
      severity: 'MEDIUM',
      title: 'High Structural Fragility, Low Activation Risk',
      description: `Fragility ${fragility.compositeFragility}% but conflict risk score only ${conflict.riskScore}%.`,
      interpretation: 'The structure is fragile but mobilization conditions are not yet present. This is characteristic of Phase 4 Freeze — artificial calm over maximum structural fragility. The risk is not absent — it is compressed.',
      actionImplication: 'The next mobilization trigger, however small, will have outsized effect. Maintain heightened monitoring. Do not mistake low activation for structural stability.',
    });
  }

  // Overall coherence — how much do all frameworks agree?
  const scores = [
    fragility.compositeFragility / 100,
    conflict.riskScore / 100,
    strategic.stageScore / 100,
    info.outrageMomentum / 100,
    cascade.systemicRisk / 100,
    (100 - elite.regimeSurvivalProbability) / 100,
  ];
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
  const overallCoherence = 1 - Math.sqrt(variance); // high = frameworks agree

  // Analyst note
  let analystNote = '';
  if (contradictions.length === 0) {
    analystNote = `All six frameworks converge. Risk level is ${conflict.riskLevel}. ${
      conflict.riskScore > 60
        ? 'Elevated risk is consistent across structural, dynamic, and predictive layers. The system is not contradicting itself — this is a coherent high-risk configuration.'
        : 'Low-moderate risk is consistent. No significant analytical tensions detected.'
    }`;
  } else {
    const highSev = contradictions.filter(c => c.severity === 'HIGH');
    if (highSev.length > 0) {
      analystNote = `${highSev.length} high-severity contradiction${highSev.length > 1 ? 's' : ''} detected. ` +
        `Key insight: ${highSev[0].interpretation} ` +
        `This changes the analytical priority: focus on ${highSev[0].actionImplication}`;
    } else {
      analystNote = `${contradictions.length} medium-severity contradictions. ` +
        `The frameworks partially disagree — conditions are mixed and uncertain. ` +
        `${contradictions[0]?.interpretation ?? ''}`;
    }
  }

  return { contradictions, overallCoherence, analystNote };
}

// ── Master Compute Function ────────────────────────────────────

export function computeAllFrameworks(input: FrameworkInput): FrameworkOutput {
  const fragility = computeFragility(input);
  const conflictRisk = computeConflictRisk(input);
  const strategicPressure = computeStrategicPressure(input);
  const informationEnvironment = computeInformationEnvironment(input);
  const cascade = computeCascade(input);
  const eliteGame = computeEliteGame(input);
  const contradiction = detectContradictions(
    fragility, conflictRisk, strategicPressure,
    informationEnvironment, cascade, eliteGame, input
  );

  return {
    fragility,
    conflictRisk,
    strategicPressure,
    informationEnvironment,
    cascade,
    eliteGame,
    contradiction,
    computedAt: Date.now(),
  };
}

// ── Helper: Build FrameworkInput from PipelineContext ──────────

export function buildFrameworkInput(
  rriState: any,
  data: any,
  optionalEngines?: {
    miiProfile?: any;
    rpiProfile?: any;
    cognitiveEnvironment?: any;
    seiResult?: any;
  }
): FrameworkInput {
  const opt = optionalEngines ?? {};
  return {
    rri: rriState.rri ?? 2.31,
    p_rev: rriState.p_rev ?? 0.643,
    salience: rriState.salience ?? 0.412,
    w_t: rriState.w_t ?? 0.72,
    velocity: rriState.velocity ?? 0.18,
    velocity_label: rriState.velocity_label ?? 'DETERIORATING',
    compound_stress: rriState.compound_stress ?? 0.08,
    pattern_similarity: rriState.pattern_similarity ?? 0.67,
    pattern_label: rriState.pattern_label ?? '',
    cascade_probability: rriState.cascade_probability ?? 0.58,
    info_amplification: rriState.info_amplification ?? 0.82,
    elite_cohesion_dynamics: rriState.elite_cohesion_dynamics ?? 0.65,
    elite_defection_prob: rriState.elite_defection_prob ?? 0.12,
    sir_infected: rriState.sir_infected ?? 0.04,
    sir_susceptible: rriState.sir_susceptible ?? 0.94,
    category_scores: rriState.category_scores ?? {},

    inflation: data?.economy?.inflation ?? 7.1,
    fx_reserves: data?.economy?.fx_reserves ?? 84,
    unemployment: data?.economy?.unemployment ?? 16.4,
    youth_unemployment: data?.economy?.youth_unemployment ?? 37.8,
    public_debt: data?.economy?.public_debt ?? 81.2,
    parallel_market_premium: data?.economy?.parallel_market_premium ?? 18,
    gdp_growth: data?.economy?.gdp_growth ?? 0.4,

    protest_events_30d: data?.social?.protest_events_30d ?? 23,
    ugtt_mobilisation_level: data?.social?.ugtt_mobilisation_level ?? 'ELEVATED',
    decree54_charged: data?.social?.decree54_charged ?? 23,
    water_crisis_govs: data?.social?.water_crisis_govs ?? 8,
    press_freedom_rank: data?.social?.press_freedom_rank ?? 118,

    imf_deal_probability: data.geopolitical?.imf_deal_probability ?? 31,

    // Optional engines (default to calibrated Tunisia values if not applied)
    mii: opt.miiProfile?.mii ?? 0.572,
    miiPhase: opt.miiProfile?.phase ?? 'FREEZE',
    loyalistConcentration: opt.miiProfile?.loyaltyShiftIndex ?? 0.76,
    rpi: opt.rpiProfile?.escalationRisk ?? 0.28,
    escalationLevel: opt.rpiProfile?.escalationLevel ?? 2,
    etmClosure: opt.cognitiveEnvironment?.narrativeClosure ?? 0.35,
    etmPhase: opt.cognitiveEnvironment?.phase ?? 'AMPLIFICATION',
    seiMax: opt.seiResult?.maxSEI ?? 0.42,
    seiAngerWindow: opt.seiResult?.angerWindowAlert ?? false,
  };
}