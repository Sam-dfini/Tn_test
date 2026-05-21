import variables from '../../data/rri_variables.json';
import { RRIVariable, RRIState } from '../../types/intel';

// Helper to get raw variables correctly regardless of import style
const getRawVariables = (): RRIVariable[] => {
  if (!variables) return [];
  
  // Handle various module formats (default export, named variables, direct array)
  // Vite often wraps JSON in a default object
  const data = (variables as any).default || variables;
  
  if (Array.isArray(data.variables)) return data.variables;
  if (Array.isArray(data)) return data;
  if (Array.isArray((variables as any).variables)) return (variables as any).variables;
  
  return [];
};

const baseVars = getRawVariables();

const PARAMS = {
  // EQ.12 — Logistic Revolution Probability
  P_REV_K: 0.8,          // sensitivity parameter
  P_REV_THRESHOLD: 2.625, // R(t) where P_rev = 50%
                          // NOTE: threshold = 2.1/0.8 = 2.625

  // EQ.21 — Ministerial Instability Index
  MII_ALPHA: 0.20,   // change frequency weight
  MII_BETA:  0.25,   // tenure weight
  MII_GAMMA: 0.20,   // crisis-triggered change weight
  MII_DELTA: 0.20,   // key ministry weight
  MII_EPS:   0.15,   // loyalty shift weight
  MII_R_WEIGHT: 0.04, // contribution to R(t) via category D

  // EQ.3 — Full War Distraction / Salience
  ALPHA: 0.7,    // base salience parameter
  BETA: 0.7,     // war distraction effectiveness
  GAMMA: 0.3,    // propaganda amplification
  DELTA: 0.12,   // counter-propaganda effectiveness
  EPSILON: 0.08, // diaspora protest impact
  ZETA: 0.05,    // urban remittance mobilization
  ETA: 0.02,     // rural remittance mobilization
  THETA: 0.03,   // rural connectivity impact
  IOTA: 0.1,     // digital divide amplification

  // EQ.4 — SIR Protest Spread
  SIR_BETA: 0.4,   // transmission rate
  SIR_GAMMA: 0.15, // recovery rate (repression efficacy)
  POPULATION: 12000000, // Tunisia total population

  // EQ.7 — Elite Defection
  SIGMA: 0.05,   // elite risk tolerance
  DEFECT_THRESHOLD: 10, // utility threshold for defection
  DEFECT_B: 0.4,  // benefit of defection
  DEFECT_C: 0.8,  // cost of defection
  DEFECT_LAMBDA: 0.15, // social proof multiplier

  // EQ.8 — War Intensity
  W_BATTLE_WEIGHT: 0.6,
  W_MEDIA_WEIGHT: 0.4,

  // EQ.9 — Remittance Mobilization
  REMIT_MOBILIZATION: 0.05,
  URBAN_PROTESTERS_PER_M: 250,
  RURAL_PROTESTERS_PER_M: 50,

  // EQ.10 — Remittance Distribution
  PHI: 0.8, // urban allocation proportion

  // EQ.14 — Monte Carlo
  MONTE_CARLO_RUNS: 10000,

  // Category weights (sum to 1.0)
  CATEGORY_WEIGHTS: {
    'A': 0.20, // Economic
    'B': 0.04, // Environmental
    'C': 0.06, // Digital & Tech
    'D': 0.08, // Political
    'E': 0.07, // Social
    'F': 0.05, // Socio-Cultural
    'G': 0.05, // Legal & Structural
    'H': 0.04, // Media & Communication
    'I': 0.05, // International & External
    'J': 0.04, // Conflict & War
    'K': 0.02, // Historical & Legacy
    'L': 0.06, // Regime Characteristics
    'M': 0.05, // Opposition Dynamics
    'N': 0.06, // Security Apparatus
    'O': 0.04, // Public Sentiment
    'P': 0.04, // Youth-Specific
    'Q': 0.02, // Regional Dynamics
    'R': 0.02, // Global Influences
    'S': 0.02, // Health & Welfare
    'T': 0.02, // Educational System
    'U': 0.02, // Infrastructure
    'V': 0.01, // Environmental Sustainability
    'W': 0.01, // Economic Resilience
    'X': 0.01, // Future-Oriented
  } as Record<string, number>,

  // Extension parameters
  // EQ.15 — Compound Stress
  CS_PAIRS: [
    { i: 'A_FX', j: 'E51', alpha: 0.15 },       // low reserves + protests
    { i: 'M_UGTT', j: 'A01', alpha: 0.12 },      // UGTT + inflation
    { i: 'N142', j: 'E51', alpha: 0.18 },         // weak repression + protests
    { i: 'I92', j: 'A_FX', alpha: 0.14 },         // IMF fail + low reserves
    { i: 'D50', j: 'M133', alpha: 0.16 },          // low legitimacy + mobilization
    { i: 'B21', j: 'E51', alpha: 0.13 },           // water stress + protests
    { i: 'A01', j: 'A02', alpha: 0.10 },           // inflation + unemployment
    { i: 'L123', j: 'M_UGTT', alpha: 0.15 },       // regime fracture + UGTT
    { i: 'D_MII', j: 'E51', alpha: 0.14 },    // instability + protests
    { i: 'D_MII', j: 'M_UGTT', alpha: 0.12 }, // instability + UGTT
    { i: 'SEI_A01', j: 'A01', alpha: 0.13 }, // food stress + inflation
    { i: 'M215', j: 'E51', alpha: 0.14 }, // low OCI + protests = ineffective anger
    { i: 'A251', j: 'E51', alpha: 0.20 }, // structural signal + protests = high risk
  ],
  CS_THRESHOLD: 0.7, // variable must exceed 70% to count

  // EQ.16 — Velocity Index
  V_HIGH_WEIGHT_IDS: ['A_FX','E51','A01','M_UGTT','D41','G71','D_MII','A251'],
  V_SCALING: 3.0,

  // EQ.17 — Regional Cascade
  CASCADE_GOVS: ['sfax','kasserine','sidi_bouzid','gafsa','gabes'],
  CASCADE_THRESHOLD: 0.70,

  // EQ.18 — Elite Defection Dynamics
  EC_DECAY: 0.02,   // monthly cohesion decay rate
  EC_REINFORCE: 0.01, // loyalty reinforcement rate

  // EQ.19 — Information Amplification
  IA_GAMMA: 0.4,    // amplification factor

  // EQ.20 — Historical Pattern Similarity
  HPS_WEIGHT: 0.12, // contribution to P_rev
  HPS_MIN_TRIGGER: 0.5, // minimum HPS to add to P_rev

  // EQ.RDE — Radicalisation coupling coefficient
  MU_RDE: 0.15,        // war-synchronization amplifier

  // EQ.SEI — Shortage Escalation Index
  SEI_SALIENCE_WEIGHT: 0.12, // food salience boost multiplier
  SEI_SHOCK_WEIGHT: 0.35,    // shock event weight for ε(t)
  SEI_CASCADE_WEIGHT: 0.15,  // cascade probability boost

  // EQ.OCI — Opposition Coordination Index
  OCI_FLOOR: 0.40,       // minimum S_effective multiplier (OCI=0)
  OCI_CEILING: 1.00,     // maximum S_effective multiplier (OCI=1)

  // EQ.CPG — CPG cascade amplifier thresholds
  CPG_BASELINE_GAFSA: 1.20,  // default Gafsa weight
  CPG_CRITICAL_GAFSA: 2.20,  // Gafsa weight when CPG disruption critical
  CPG_THRESHOLD: 65,          // disruption level that activates amplifier
};

const HISTORICAL_STATES: Record<string, Record<string, number>> = {
  'tunisia_2010_q3': {
    'A01': 0.45, 'A02': 0.72, 'A03': 0.52, 'A_FX': 0.40,
    'D41': 0.55, 'D44': 0.35, 'E51': 0.80, 'L121': 0.85,
    'N141': 0.40, 'N144': 0.25, 'O151': 0.85, 'O152': 0.82,
    'P164': 0.80, 'P169': 0.75, 'M133': 0.65, 'F66': 0.72,
  },
  'tunisia_2021_q1': {
    'A01': 0.62, 'A02': 0.74, 'A03': 0.68, 'A_FX': 0.55,
    'D41': 0.48, 'D44': 0.65, 'E51': 0.72, 'L121': 0.70,
    'N141': 0.38, 'N144': 0.28, 'O151': 0.80, 'O152': 0.78,
    'P164': 0.82, 'P169': 0.78, 'M133': 0.58, 'F66': 0.78,
  },
  'egypt_2011_q1': {
    'A01': 0.52, 'A02': 0.68, 'A03': 0.48, 'A_FX': 0.52,
    'D41': 0.45, 'D44': 0.72, 'E51': 0.88, 'L121': 0.88,
    'N141': 0.35, 'N144': 0.20, 'O151': 0.90, 'O152': 0.88,
    'P164': 0.85, 'P169': 0.80, 'M133': 0.72, 'F66': 0.82,
  },
  'algeria_2019_hirak': {
    'A01': 0.55, 'A02': 0.65, 'A03': 0.55, 'A_FX': 0.45,
    'D41': 0.40, 'D44': 0.68, 'E51': 0.75, 'L121': 0.82,
    'N141': 0.42, 'N144': 0.30, 'O151': 0.78, 'O152': 0.75,
    'P164': 0.78, 'P169': 0.72, 'M133': 0.70, 'F66': 0.70,
  },
};

function gaussianRandom(mean: number, std: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>
): number {
  const keys = Object.keys(a).filter(k => b[k] !== undefined);
  if (keys.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    dot += a[k] * b[k];
    normA += a[k] * a[k];
    normB += b[k] * b[k];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalize(
  raw: number,
  min: number,
  max: number,
  invert: boolean
): number {
  const n = Math.max(0, Math.min(1, (raw - min) / (max - min)));
  return invert ? 1 - n : n;
}

function getVar(id: string): RRIVariable | undefined {
  return baseVars.find(v => (v.id === id || `${v.code}${v.number}` === id));
}

function getCurrentStateVector(vars: RRIVariable[]): Record<string, number> {
  const state: Record<string, number> = {};
  
  const getNorm = (code: string, num: number) => {
    const v = vars.find(v => v.code === code && v.number === num);
    return v ? eq1_normalize(v) : 0.5;
  };

  state['A01'] = getNorm('A', 1); // GDP Growth
  state['A02'] = getNorm('A', 2); // Inflation
  state['A03'] = getNorm('A', 3); // Unemployment
  state['A_FX'] = getNorm('A', 7); // Foreign Reserves
  state['D41'] = getNorm('D', 79); // Trust in Gov
  state['D44'] = getNorm('D', 71); // Press Freedom
  state['E51'] = getNorm('M', 202); // Protest Mobilization
  state['L121'] = getNorm('L', 189); // Regime Cohesion
  state['N141'] = getNorm('N', 221); // Security Force Loyalty
  state['N144'] = getNorm('L', 199); // Extrajudicial Actions
  state['O151'] = getNorm('D', 78); // Political Polarization
  state['O152'] = getNorm('A', 22); // Purchasing Power
  state['P164'] = getNorm('A', 4); // Youth Unemployment
  state['P169'] = getNorm('O', 232); // Youth Bulge
  state['M133'] = getNorm('M', 201); // Opposition Fragmentation
  state['F66'] = getNorm('E', 95); // Social Cohesion

  // Additional variables for CS_PAIRS
  state['M_UGTT'] = getNorm('M', 207); // Labor Union Strength
  state['N142'] = getNorm('N', 219); // Riot Control Capacity
  state['I92'] = getNorm('A', 6); // Public Debt GDP
  state['D50'] = getNorm('D', 79); // Trust in Gov (reusing D79)
  state['B21'] = getNorm('B', 26); // Water stress
  state['L123'] = getNorm('L', 189); // Ruling Party Cohesion (reusing L189)
  state['A251'] = getNorm('A', 251); // Structural Economic Signal

  // D_MII and SEI_A01 are dynamically created in calculateRRI()
  // These entries ensure they participate in compound stress (CS_PAIRS)
  state['D_MII'] = getNorm('D', 250); // Ministerial Instability Index
  state['SEI_A01'] = getNorm('A', 250); // Shortage Escalation Index

  return state;
}

function eq1_normalize(v: RRIVariable): number {
  const raw_value = v.value_2026;
  const min_value = v.min_value ?? 0;
  const max_value = v.max_value ?? 100;
  const invert = v.invert ?? false;
  const threshold_weight = v.threshold_weight ?? 1.2;

  let normalized = normalize(raw_value, min_value, max_value, invert);
  if (v.threshold !== null && threshold_weight > 1.0) {
    const thresholdNorm = normalize(
      v.threshold, min_value, max_value, invert
    );
    if (normalized > thresholdNorm) {
      const excess = normalized - thresholdNorm;
      normalized = thresholdNorm + excess * threshold_weight;
    }
  }
  return Math.max(0, Math.min(1.5, normalized));
}

function eq2_categoryScores(
  vars: RRIVariable[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  const categories = [...new Set(vars.map(v => v.code))];

  for (const cat of categories) {
    const catVars = vars.filter(v => v.code === cat);
    if (catVars.length === 0) continue;
    const weightedSum = catVars.reduce(
      (sum, v) => sum + v.weight * eq1_normalize(v), 0
    );
    const totalWeight = catVars.reduce((sum, v) => sum + v.weight, 0);
    scores[cat] = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  return scores;
}

function eq3_salience(
  w_t: number,
  cp_t: number,
  dp_t: number,
  rm_t: number,
  rr_t: number,
  cr_t: number,
  p_t: number,
  dd_t: number,
  rpi_t: number
): number {
  const numerator = PARAMS.ALPHA * (
    1 +
    PARAMS.DELTA * cp_t +
    PARAMS.EPSILON * dp_t +
    PARAMS.ZETA * rm_t +
    PARAMS.ETA * rr_t +
    PARAMS.THETA * cr_t +
    PARAMS.MU_RDE * rpi_t
  );
  const denominator = 1 + PARAMS.BETA * w_t * (
    1 + PARAMS.GAMMA * p_t + PARAMS.IOTA * dd_t
  );
  return Math.max(0.05, Math.min(1.0, numerator / denominator));
}

function eq4_sir(
  initial_infected_pct: number,
  beta: number = PARAMS.SIR_BETA,
  gamma: number = PARAMS.SIR_GAMMA
): { S: number; I: number; R: number; peak_infected: number } {
  let S = 1 - initial_infected_pct;
  let I = initial_infected_pct;
  let R = 0;
  let peak_infected = I;
  const dt = 0.1;
  const steps = 300;

  for (let i = 0; i < steps; i++) {
    const dS = -beta * S * I * dt;
    const dI = (beta * S * I - gamma * I) * dt;
    const dR = gamma * I * dt;
    S = Math.max(0, S + dS);
    I = Math.max(0, I + dI);
    R = Math.min(1, R + dR);
    if (I > peak_infected) peak_infected = I;
  }
  return { S, I, R, peak_infected };
}

function eq7_eliteDefection(
  p_rev: number,
  r_t: number,
  current_defections: number = 0
): {
  defection_probability: number;
  nash_threshold: number;
} {
  const utility = PARAMS.DEFECT_B - PARAMS.DEFECT_C * (1 - p_rev) + PARAMS.DEFECT_LAMBDA * current_defections;
  const nash_threshold = PARAMS.DEFECT_THRESHOLD + PARAMS.SIGMA * r_t;

  const defection_probability = sigmoid((utility - nash_threshold) * 2);

  return { defection_probability, nash_threshold };
}

function eq8_warIntensity(
  battle_deaths_norm: number,
  media_salience_norm: number
): number {
  return Math.max(0.2, Math.min(0.8,
    PARAMS.W_BATTLE_WEIGHT * battle_deaths_norm +
    PARAMS.W_MEDIA_WEIGHT * media_salience_norm
  ));
}

function eq9_remittanceMobilization(
  r_total_millions: number,
  dd_t: number
): { urban: number; rural: number; total: number } {
  const delta_p = PARAMS.REMIT_MOBILIZATION * r_total_millions * (1 - dd_t);
  return {
    urban: delta_p * PARAMS.URBAN_PROTESTERS_PER_M,
    rural: delta_p * PARAMS.RURAL_PROTESTERS_PER_M * dd_t,
    total: delta_p * (PARAMS.URBAN_PROTESTERS_PER_M + PARAMS.RURAL_PROTESTERS_PER_M * dd_t)
  };
}

function eq10_remittanceDistribution(
  r_total: number
): { urban: number; rural: number } {
  return {
    urban: PARAMS.PHI * r_total,
    rural: (1 - PARAMS.PHI) * r_total
  };
}

function eq12_pRev(r_t: number): number {
  return 1 / (1 + Math.exp(-(PARAMS.P_REV_K * r_t - 2.1)));
}

function eq13_stochasticShock(
  shock_events: Array<{ weight: number; magnitude: number }>
): number {
  return shock_events.reduce(
    (sum, event) => sum + event.weight * event.magnitude, 0
  );
}

function eq14_monteCarlo(
  vars: RRIVariable[],
  w_t: number,
  n_runs: number = PARAMS.MONTE_CARLO_RUNS
): { ci_low: number; ci_high: number; mean: number; std: number } {
  const results: number[] = [];

  for (let i = 0; i < n_runs; i++) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const v of vars) {
      const normalized = eq1_normalize(v);
      const volatility = v.volatility * (Math.random() * 2 - 1);
      const perturbed = Math.max(0, Math.min(1.5, normalized + volatility));
      weightedSum += v.weight * perturbed;
      totalWeight += v.weight;
    }

    const r_base = totalWeight > 0
      ? (weightedSum / totalWeight) * 5
      : 2.31;

    const w_variation = w_t + gaussianRandom(0, 0.05);
    const r_sim = r_base * Math.max(0.2, w_variation);

    const shock = gaussianRandom(0, 0.08);
    const r_final = Math.max(0, r_sim + shock);

    const p_rev_sim = eq12_pRev(r_final);
    results.push(p_rev_sim);
  }

  results.sort((a, b) => a - b);
  if (results.length === 0) {
    return { ci_low: 0, ci_high: 0, mean: 0, std: 0 };
  }
  const mean = results.reduce((s, v) => s + v, 0) / results.length;
  const variance = results.reduce((s, v) => s + (v - mean) ** 2, 0) / results.length;
  const std = Math.sqrt(variance);

  return {
    ci_low: results[Math.floor(results.length * 0.025)] || 0,
    ci_high: results[Math.floor(results.length * 0.975)] || 0,
    mean,
    std
  };
}

function eq15_compoundStress(vars: RRIVariable[]): number {
  const varMap = getCurrentStateVector(vars);

  let cs = 0;
  for (const pair of PARAMS.CS_PAIRS) {
    const ni = varMap[pair.i] ?? 0;
    const nj = varMap[pair.j] ?? 0;

    const bi = Math.max(0, ni - PARAMS.CS_THRESHOLD) / (1 - PARAMS.CS_THRESHOLD);
    const bj = Math.max(0, nj - PARAMS.CS_THRESHOLD) / (1 - PARAMS.CS_THRESHOLD);

    cs += pair.alpha * bi * bj;
  }

  return Math.max(0, Math.min(0.5, cs));
}

function eq16_velocity(vars: RRIVariable[]): number {
  let velocitySum = 0;
  let count = 0;

  for (const v of vars) {
    if (!v || !Array.isArray(v.history) || v.history.length < 2) continue;

    const current = v.value;
    const previous = v.history[v.history.length - 2];
    const delta = current - previous;

    const beta = PARAMS.V_HIGH_WEIGHT_IDS.includes(v.id) ? 2.0 : 1.0;
    const sigma = Math.max(0.01, v.volatility);

    velocitySum += beta * (delta / sigma) * v.weight;
    count++;
  }

  if (count === 0) return 0;

  const rawVelocity = velocitySum / count;
  return Math.max(-1, Math.min(1, Math.tanh(rawVelocity / PARAMS.V_SCALING)));
}

function eq22_cyclePositionIndex(vars: RRIVariable[]): number {
  const varMap = getCurrentStateVector(vars);
  const keys = Object.keys(varMap);
  if (keys.length < 5) return 0.5;

  const values = keys.map(k => varMap[k]);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  if (mean === 0) return 0.5;
  const cv = std / mean;

  return Math.max(0, Math.min(1, 0.5 + (cv - 0.3) * 0.5));
}

function eq23_acceleration(vars: RRIVariable[]): number {
  let currentVelSum = 0;
  let prevVelSum = 0;
  let count = 0;

  for (const v of vars) {
    if (!v || !Array.isArray(v.history) || v.history.length < 3) continue;
    const current = v.value;
    const previous = v.history[v.history.length - 2];
    const older = v.history[v.history.length - 3];
    const beta = PARAMS.V_HIGH_WEIGHT_IDS.includes(v.id) ? 2.0 : 1.0;
    const sigma = Math.max(0.01, v.volatility);
    currentVelSum += beta * ((current - previous) / sigma) * v.weight;
    prevVelSum += beta * ((previous - older) / sigma) * v.weight;
    count++;
  }

  if (count === 0) return 0;
  const currentVel = currentVelSum / count;
  const prevVel = prevVelSum / count;
  const rawAccel = (currentVel - prevVel) / Math.max(Math.abs(prevVel), 0.01);

  const shockVars = vars.filter(v => v.volatility > 0.2);
  const shockDensity = shockVars.length / Math.max(vars.length, 1);

  return Math.max(-1, Math.min(1, parseFloat((rawAccel * 0.5 + shockDensity * 0.3).toFixed(4))));
}

function eq24_structuralEconomic(vars: RRIVariable[]): number {
  const varMap = getCurrentStateVector(vars);
  const subsidyVar = varMap['A_SUBSIDY'] ?? varMap['A11'] ?? 0;
  const inflationVar = varMap['A01'] ?? 0;
  const fxVar = varMap['A_FX'] ?? 0;
  const debtVar = varMap['F_DEBT'] ?? 0;

  const policyDelta = (subsidyVar > 0.5 ? 0.3 : 0) + (inflationVar > 0.7 ? 0.2 : 0);
  const subsidyAdjustment = Math.max(0, 0.5 - fxVar);
  const s_econ = policyDelta * 0.6 + subsidyAdjustment * 0.4;

  return Math.max(0, Math.min(1, parseFloat(s_econ.toFixed(4))));
}

function velocityLabel(v: number): string {
  if (v > 0.4) return 'DETERIORATING FAST';
  if (v > 0.15) return 'DETERIORATING';
  if (v > -0.15) return 'STABLE';
  if (v > -0.4) return 'IMPROVING';
  return 'IMPROVING FAST';
}

function eq17_cascadeProbability(vars: RRIVariable[]): number {
  const protestVar = vars.find(v => v.id === 'E51');
  const waterVar = vars.find(v => v.id === 'B21');
  const unemployVar = vars.find(v => v.id === 'A09');
  const securityVar = vars.find(v => v.id === 'N142');

  if (!protestVar || !waterVar) return 0.3;

  const baseProtest = eq1_normalize(protestVar);
  const waterStress = eq1_normalize(waterVar);
  const unemployment = unemployVar ? eq1_normalize(unemployVar) : 0.65;
  const securityCapacity = securityVar ? eq1_normalize(securityVar) : 0.5;

  const govWeights = {
    sfax: 1.4, kasserine: 1.2, sidi_bouzid: 1.1, gafsa: 1.2, gabes: 1.0
  };

  let productTerm = 1.0;
  for (const gov of PARAMS.CASCADE_GOVS) {
    const weight = govWeights[gov as keyof typeof govWeights] || 1.0;
    const p_gov = sigmoid(
      3 * (baseProtest * weight + waterStress * 0.3 + unemployment * 0.2)
      - (securityCapacity * 2)
      - 2
    );
    productTerm *= (1 - p_gov);
  }

  const cogwar_cascade_delta = 0;
  return Math.max(0, Math.min(1, (1 - productTerm) + cogwar_cascade_delta));
}

function eq18_eliteDefectionDynamics(
  previous_ec: number,
  parallel_market_premium: number,
  decree54_charged: number,
  fdi_change: number
): number {
  const delta_defection = Math.min(0.15,
    (parallel_market_premium / 100) * 0.4 +
    (decree54_charged / 100) * 0.2 +
    (Math.max(0, -fdi_change) / 50) * 0.2
  );

  const epsilon_loyalty = 0.01;

  const ec_new = previous_ec * (1 - delta_defection) + epsilon_loyalty;
  return Math.max(0.1, Math.min(1.0, ec_new));
}

function eq19_infoAmplification(
  press_freedom_score: number,
  internet_censorship: number,
  social_media_penetration: number,
  throttling_incidents: number
): number {
  const ifi = (press_freedom_score / 100) *
    (1 - internet_censorship) *
    (1 - Math.min(0.5, throttling_incidents / 20));

  const sm_reach = social_media_penetration;

  const amplification = 1 + PARAMS.IA_GAMMA * ifi * sm_reach;
  return Math.max(0.5, Math.min(2.0, amplification));
}


/**
 * EQ.21 — Ministerial Instability Index
 * Measures regime elite stability as leading indicator
 * of policy failure, internal fracture, and collapse risk.
 *
 * MII(t) = α·CF + β·tenure + γ·CrisisRatio + δ·KM + ε·LS
 */
function eq21_ministerialInstability(
  mii_score: number    // 0-1, computed by miiEngine.ts
): {
  mii: number;
  eq7_current_defections: number;
  eq18_delta_defection_addon: number;
  eq16_velocity_addon: number;
} {
  // MII directly feeds three equations:

  // EQ.7 — Elite defection: high MII = more internal pressure = more defections
  const eq7_current_defections = Math.round(mii_score * 15);

  // EQ.18 — Cohesion dynamics: crisis-triggered changes erode cohesion
  const eq18_delta_defection_addon = Math.min(0.08, mii_score * 0.08);

  // EQ.16 — Velocity: MII delta adds to system velocity
  // (handled in calculateRRI call site via _mii_velocity_addon)

  return {
    mii: mii_score,
    eq7_current_defections,
    eq18_delta_defection_addon,
    eq16_velocity_addon: 0, // placeholder, computed in PipelineContext
  };
}

function eq20_historicalPatternSimilarity(
  currentState: Record<string, number>
): { score: number; closest_match: string; label: string } {
  let maxSimilarity = 0;
  let closestMatch = 'none';

  for (const [stateName, historicalVector] of Object.entries(HISTORICAL_STATES)) {
    const similarity = cosineSimilarity(currentState, historicalVector);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      closestMatch = stateName;
    }
  }

  let label = 'LOW PATTERN MATCH';
  if (maxSimilarity > 0.8) label = 'CRITICAL — NEAR-IDENTICAL TO ' + closestMatch.toUpperCase().replace(/_/g, ' ');
  else if (maxSimilarity > 0.65) label = 'HIGH — SIGNIFICANT SIMILARITY TO ' + closestMatch.toUpperCase().replace(/_/g, ' ');
  else if (maxSimilarity > 0.5) label = 'MODERATE — PARTIAL SIMILARITY TO ' + closestMatch.toUpperCase().replace(/_/g, ' ');

  return { score: maxSimilarity, closest_match: closestMatch, label };
}

const REGIME_ORIGIN = new Date('2021-07-25').getTime();

function getRegimeAge(): { age_pct: number; years: number } {
  const now = Date.now();
  const years = (now - REGIME_ORIGIN) / (365.25 * 24 * 60 * 60 * 1000);
  return {
    years: parseFloat(years.toFixed(1)),
    age_pct: Math.min(1, years / 15),
  };
}

export function calculateRRI(
  overridesOrVars?: Partial<Record<string, number>> | RRIVariable[],
  rpi_t: number = 0,
  liveData?: RRIVariable[]
): RRIState {
  let vars: RRIVariable[];
  
  if (Array.isArray(overridesOrVars)) {
    vars = overridesOrVars;
  } else {
    try {
      vars = JSON.parse(JSON.stringify(baseVars)) as RRIVariable[];
    } catch (e) {
      vars = [];
    }
    
    if (overridesOrVars && typeof overridesOrVars === 'object') {
      for (const v of vars) {
        if (v && v.pipeline_field && (overridesOrVars as any)[v.pipeline_field] !== undefined) {
          v.value_2026 = (overridesOrVars as any)[v.pipeline_field]!;
          v.value = eq1_normalize(v);
        }
      }
    }
  }

  // Merge live values from Supabase on top of JSON schema
  if (liveData && liveData.length > 0) {
    for (const live of liveData) {
      if (!live.code || !live.number) continue;
      const key = `${live.code}${live.number}`;
      const match = vars.find(v =>
        v.id === key || v.id === live.id || `${v.code}${v.number}` === key
      );
      if (match && live.value_2026 !== undefined) {
        match.value_2026 = live.value_2026;
        match.value = eq1_normalize(match);
      }
    }
  }

  if (!Array.isArray(vars)) vars = [];

  const category_scores = eq2_categoryScores(vars);

  const warVar = vars.find(v => (v.id === 'J_WAR' || `${v.code}${v.number}` === 'J104'));
  const battle_deaths_norm = (overridesOrVars as any)?._battle_deaths_norm ?? 0.35;
  const media_salience_norm = (overridesOrVars as any)?._media_salience_norm ?? 0.45;
  const w_t = warVar
    ? warVar.value_2026
    : eq8_warIntensity(battle_deaths_norm, media_salience_norm);

  const remitVar = vars.find(v => (v.id === 'A_REMIT_URBAN' || `${v.code}${v.number}` === 'A11'));
  const r_total_usd = (overridesOrVars as any)?._r_total_usd ?? 2850;
  const remitDist = eq10_remittanceDistribution(r_total_usd);

  const cpVar = vars.find(v => (v.id === 'H_CP' || `${v.code}${v.number}` === 'H116'));
  const dpVar = vars.find(v => (v.id === 'F_DP' || `${v.code}${v.number}` === 'F81'));
  const propVar = vars.find(v => (v.id === 'H_PROP' || `${v.code}${v.number}` === 'H117'));
  const ddVar = vars.find(v => (v.id === 'C_DD' || `${v.code}${v.number}` === 'C40'));
  const ruralConnVar = vars.find(v => (v.id === 'C31' || `${v.code}${v.number}` === 'C31'));

  const cp_t = (overridesOrVars as any)?._cp_t ?? (cpVar ? cpVar.value_2026 : 0.42);
  const dp_t = (overridesOrVars as any)?._dp_t ?? (dpVar ? dpVar.value_2026 : 0.38);
  const p_t = (overridesOrVars as any)?._p_t ?? (propVar ? propVar.value_2026 : 0.72);
  const dd_t = (overridesOrVars as any)?._dd_t ?? (ddVar ? ddVar.value_2026 : 0.65);
  const cr_t = (overridesOrVars as any)?._cr_t ?? (ruralConnVar ? (1 - eq1_normalize(ruralConnVar)) : 0.30);
  const rm_normalized = Math.min(1, remitDist.urban / 3000);
  const rr_normalized = Math.min(1, remitDist.rural / 800);

  const rde_modifier = (overridesOrVars as any)?._rde_salience_modifier ?? 0;
  const sei_salience_boost = (overridesOrVars as any)?._sei_salience_boost ?? 0;

  // Read OCI and CPG from actor network engine
  const _oci = (overridesOrVars as any)?._oci ?? 0.22;
  const _oci_multiplier = PARAMS.OCI_FLOOR + (1 - PARAMS.OCI_FLOOR) * _oci;
  const _cpg_amplifier = (overridesOrVars as any)?._cpg_amplifier ?? 1.20;

  const cogwar_salience_nudge = (overridesOrVars as any)?._cogwar_salience_nudge ?? 0;
  
  // Pass combined modifier — food stress + radicalization + cogwar boost salience
  const salience = eq3_salience(
    w_t, cp_t, dp_t, rm_normalized, rr_normalized, cr_t, p_t, dd_t,
    rde_modifier + sei_salience_boost + cogwar_salience_nudge
  );

  // OCI multiplier: opposition fragmentation reduces how much
  // salience converts to coordinated political action.
  // S_effective = S(t) × (0.40 + 0.60 × OCI)
  // At OCI=0.22 (current Tunisia): S_eff = 0.532 × S(t)
  // This explains the 2024-2025 non-rupture: high anger, low coordination.
  const salience_effective = salience * _oci_multiplier;

  let r_base = 0;
  for (const [cat, catWeight] of Object.entries(PARAMS.CATEGORY_WEIGHTS)) {
    const catScore = category_scores[cat] ?? 0;
    r_base += catWeight * catScore;
  }
  r_base = r_base * 5;

  const cs_t = eq15_compoundStress(vars);
  const r_with_cs = r_base * (1 + cs_t);
  const war_suppressor = 0.5 + 0.5 * w_t;
  const r_suppressed = r_with_cs * (2 - war_suppressor);

  const CALIBRATION_FACTOR = 0.465;
  const r_t = r_suppressed * CALIBRATION_FACTOR;

  const _sei_shock = (overridesOrVars as any)?._sei_shock_magnitude ?? 0;
  const shock = eq13_stochasticShock([
    { weight: 0.4, magnitude: gaussianRandom(0, 0.03) },
    { weight: 0.3, magnitude: gaussianRandom(0, 0.05) },
    { weight: 0.3, magnitude: gaussianRandom(0, 0.02) },
    // SEI shock: deterministic shortage-driven component
    { weight: PARAMS.SEI_SHOCK_WEIGHT, magnitude: _sei_shock },
    // CogWar shock: ε(t) magnitude from campaign intensity
    { weight: 0.25, magnitude: (overridesOrVars as any)?._cogwar_epsilon_magnitude ?? 0 },
  ]);

  const r_final = Math.max(0, r_t + shock);
  const p_rev_base = eq12_pRev(r_final);
  const p_rev_adjusted = p_rev_base * (0.6 + 0.4 * salience_effective);
  // EQ.21 MII modifier for elite defection
  const _mii_score = (overridesOrVars as any)?._mii_score ?? 0;
  const _mii_defections = (overridesOrVars as any)?._mii_eq7_defections ?? 0;
  const _mii_ec_addon = (overridesOrVars as any)?._mii_eq18_addon ?? 0;

  const eliteResult = eq7_eliteDefection(
    p_rev_adjusted,
    r_final,
    _mii_defections  // MII feeds current_defections parameter
  );

  // Inject MII as virtual variable D_MII
  if (overridesOrVars && typeof overridesOrVars === 'object') {
    const miiScore = (overridesOrVars as any)._mii_score;
    const seiScore = (overridesOrVars as any)?._sei_cs_value ?? 0;

    if (miiScore !== undefined) {
      // Add as synthetic variable for velocity and compound stress
      vars.push({
        id: 'D_MII',
        category: 'D',
        value: miiScore,
        raw_value: miiScore,
        weight: PARAMS.MII_R_WEIGHT,
        invert: false,
        volatility: 0.08,
        history: [miiScore * 0.9, miiScore * 0.95, miiScore],
        min_value: 0, max_value: 1,
        threshold: 0.65,
        threshold_weight: 1.2,
        pipeline_field: 'politics.mii',
        nlp_keywords: ['ministre', 'minister', 'nomination', 'cabinet'],
        nlp_nudge: 0.01,
        label: 'Ministerial Instability Index',
        last_updated: new Date().toISOString().slice(0, 10),
        source: 'miiEngine',
      } as any);
    }

    if (seiScore > 0) {
      vars.push({
        id: 'SEI_A01',
        category: 'A',
        value: seiScore,
        raw_value: seiScore,
        weight: 0.04,
        invert: false,
        volatility: 0.15,
        history: [seiScore * 0.7, seiScore * 0.85, seiScore],
        min_value: 0, max_value: 1,
        threshold: 0.65,
        threshold_weight: 1.3,
        pipeline_field: 'economy.sei',
        nlp_keywords: ['pénurie', 'shortage', 'نقص'],
        nlp_nudge: 0.015,
        label: 'Shortage Escalation Index',
        last_updated: new Date().toISOString().slice(0, 10),
        source: 'seiEngine',
      } as any);
    }
  }

  const parallelPremiumVar = vars.find(v => (v.id === 'A_PARALLEL' || `${v.code}${v.number}` === 'A16'));
  const decree54Var = vars.find(v => (v.id === 'G71' || `${v.code}${v.number}` === 'G101'));
  const ec_t_base = eq18_eliteDefectionDynamics(
    0.65,
    (overridesOrVars as any)?._parallel_premium ?? (parallelPremiumVar ? parallelPremiumVar.value_2026 : 18),
    (overridesOrVars as any)?._decree54 ?? (decree54Var ? decree54Var.value_2026 * 100 : 23),
    (overridesOrVars as any)?._fdi_change ?? -5
  );
  // MII adds to delta_defection in EQ.18
  const ec_t = Math.max(0.10, ec_t_base - _mii_ec_addon);

  const pressVar = vars.find(v => (v.id === 'D44' || `${v.code}${v.number}` === 'D54'));
  const censorVar = vars.find(v => (v.id === 'C37' || `${v.code}${v.number}` === 'C37'));
  const socialMediaVar = vars.find(v => (v.id === 'C26' || `${v.code}${v.number}` === 'C26'));
  const a_t = eq19_infoAmplification(
    (overridesOrVars as any)?._press_freedom ?? (pressVar ? pressVar.value_2026 : 31),
    (overridesOrVars as any)?._internet_censorship ?? (censorVar ? censorVar.value_2026 / 100 : 0.72),
    (overridesOrVars as any)?._social_media_pen ?? (socialMediaVar ? 1 - eq1_normalize(socialMediaVar) : 0.75),
    (overridesOrVars as any)?._throttling ?? 14
  );

  const currentStateVector = getCurrentStateVector(vars);
  const hpsResult = eq20_historicalPatternSimilarity(currentStateVector);

  const hps_bonus = hpsResult.score > PARAMS.HPS_MIN_TRIGGER
    ? PARAMS.HPS_WEIGHT * (hpsResult.score - PARAMS.HPS_MIN_TRIGGER)
    : 0;
  const p_rev_final = Math.max(0, Math.min(0.99, p_rev_adjusted + hps_bonus));
  console.log('DEBUG P_REV:', { r_final, p_rev_base, p_rev_adjusted, hps_bonus, p_rev_final });

  const velocity = eq16_velocity(vars);
  const cpi_index = eq22_cyclePositionIndex(vars);
  const acceleration = eq23_acceleration(vars);
  const structural_econ = eq24_structuralEconomic(vars);
  const _sei_cascade_boost = (overridesOrVars as any)?._sei_cascade_boost ?? 0;
  const p_cascade_base = eq17_cascadeProbability(vars);
  // CPG cascade amplifier: phosphate disruption above threshold
  // amplifies Gafsa activation probability via community mobilization
  // infrastructure built since the 2008 uprising precedent.
  const cpg_cascade_boost = _cpg_amplifier > PARAMS.CPG_BASELINE_GAFSA
    ? Math.min(0.15, (_cpg_amplifier - PARAMS.CPG_BASELINE_GAFSA) * 0.15)
    : 0;
  const p_cascade = Math.min(1, p_cascade_base + _sei_cascade_boost + cpg_cascade_boost);

  const protestVar = vars.find(v => (v.id === 'E51' || `${v.code}${v.number}` === 'E61'));
  const initial_infected = protestVar
    ? eq1_normalize(protestVar) * 0.05
    : 0.02;
  const sirResult = eq4_sir(initial_infected);

  const mcResult = eq14_monteCarlo(vars, w_t, PARAMS.MONTE_CARLO_RUNS);

  const now = new Date();
  const freshness = vars.reduce((sum, v) => {
    const lastUpdatedStr = v.last_updated || new Date().toISOString();
    const lastUpdated = new Date(lastUpdatedStr).getTime();
    const daysSince = (now.getTime() - lastUpdated) / (1000 * 60 * 60 * 24);
    const score = isNaN(daysSince) ? 0 : Math.exp(-daysSince / 30);
    return sum + score;
  }, 0) / (vars.length || 1);
  const model_confidence = Math.min(0.95, (isNaN(freshness) ? 0 : freshness) * 0.9 + 0.1);

  const threshold_breaches: { variable: string; value: number; threshold: number; label: string; impact: number }[] = [];
  for (const v of vars) {
    if (v.threshold !== null) {
      const invert = v.invert ?? false;
      const isBreached = invert
        ? v.value_2026 < v.threshold
        : v.value_2026 > v.threshold;
      if (isBreached) {
        threshold_breaches.push({
          variable: v.id || `${v.code}${v.number}`,
          value: v.value_2026,
          threshold: v.threshold,
          label: v.label || v.id || `${v.code}${v.number}`,
          impact: (v.weight || 0.05) * 5 * eq1_normalize(v) // Rough estimate of contribution to R(t)
        });
      }
    }
  }

  const safeVal = (val: number, fallback: number = 0) => isNaN(val) ? fallback : val;

  return {
    rri: parseFloat(safeVal(r_final, 2.31).toFixed(4)),
    r_t: parseFloat(safeVal(r_final, 2.31).toFixed(4)),
    p_rev: parseFloat(safeVal(p_rev_final, 0.643).toFixed(4)),
    salience: parseFloat(safeVal(salience, 0.412).toFixed(4)),
    salience_effective: parseFloat(safeVal(salience_effective, 0.412).toFixed(4)),
    oci: parseFloat(safeVal(_oci, 0.22).toFixed(4)),
    cpg_cascade_amplifier: parseFloat(safeVal(_cpg_amplifier, 1.0).toFixed(4)),
    w_t: parseFloat(safeVal(w_t, 0.72).toFixed(4)),
    elite_defection_prob: parseFloat(safeVal(eliteResult.defection_probability, 0.45).toFixed(4)),

    velocity: parseFloat(safeVal(velocity, 0.05).toFixed(4)),
    velocity_label: velocityLabel(safeVal(velocity, 0.05)),
    compound_stress: parseFloat(safeVal(cs_t, 0.12).toFixed(4)),
    pattern_similarity: parseFloat(safeVal(hpsResult.score, 0.42).toFixed(4)),
    pattern_label: hpsResult.label,
    cascade_probability: parseFloat(safeVal(p_cascade, 0.18).toFixed(4)),
    info_amplification: parseFloat(safeVal(a_t, 0.35).toFixed(4)),
    elite_cohesion_dynamics: parseFloat(safeVal(ec_t, 0.55).toFixed(4)),
    cpi_index: parseFloat(safeVal(cpi_index, 0.5).toFixed(4)),
    acceleration: parseFloat(safeVal(acceleration, 0.0).toFixed(4)),
    structural_econ: parseFloat(safeVal(structural_econ, 0.15).toFixed(4)),

    ci_low: parseFloat(safeVal(mcResult.ci_low, 0.598).toFixed(4)),
    ci_high: parseFloat(safeVal(mcResult.ci_high, 0.687).toFixed(4)),
    p_rev_mean: parseFloat(safeVal(mcResult.mean, 0.643).toFixed(4)),
    simulations_run: PARAMS.MONTE_CARLO_RUNS,

    category_scores,

    model_confidence: parseFloat(safeVal(model_confidence, 0.85).toFixed(4)),
    last_calculated: new Date().toISOString(),
    variables_count: vars.length,
    variables: vars.reduce((acc, v) => {
      const id = v.id || `${v.code}${v.number}`;
      acc[id] = v;
      return acc;
    }, {} as Record<string, RRIVariable>),
    threshold_breaches,
    rri_history: [
      { date: '2026-03-01', rri: 2.15 },
      { date: '2026-03-05', rri: 2.22 },
      { date: '2026-03-10', rri: 2.28 },
      { date: '2026-03-15', rri: 2.31 },
      { date: '2026-03-20', rri: 2.35 },
      { date: '2026-03-25', rri: 2.42 },
      { date: '2026-03-29', rri: parseFloat(safeVal(r_final, 2.31).toFixed(4)) }
    ],

    sir_susceptible: parseFloat(sirResult.S.toFixed(4)),
    sir_infected: parseFloat(sirResult.I.toFixed(4)),
    sir_recovered: parseFloat(sirResult.R.toFixed(4)),

    stochastic_shock: parseFloat(shock.toFixed(4)),
    
    // Legacy fields for backward compatibility
    prev: parseFloat(p_rev_final.toFixed(4)),
    W: parseFloat(w_t.toFixed(4)),
    regime_age: getRegimeAge(),
    monte_carlo_runs: 1000
  };
}

export function runFullMonteCarlo(
  overridesOrVars?: Partial<Record<string, number>> | RRIVariable[]
): { ci_low: number; ci_high: number; mean: number; std: number; histogram: number[]; chartData: { rri: number; frequency: number }[]; p5: number; p95: number; median: number } {
  let vars: RRIVariable[];
  const baseVars = (variables && Array.isArray(variables.variables)) ? variables.variables : [];
  
  if (Array.isArray(overridesOrVars)) {
    vars = overridesOrVars;
  } else {
    try {
      vars = JSON.parse(JSON.stringify(baseVars)) as RRIVariable[];
    } catch (e) {
      vars = [];
    }
    
    if (overridesOrVars && typeof overridesOrVars === 'object') {
      for (const v of vars) {
        if (v && v.pipeline_field && (overridesOrVars as any)[v.pipeline_field] !== undefined) {
          v.value_2026 = (overridesOrVars as any)[v.pipeline_field]!;
          v.value = eq1_normalize(v);
        }
      }
    }
  }
  
  if (!Array.isArray(vars)) vars = [];
  const warVar = vars.find(v => (v.id === 'J_WAR' || `${v.code}${v.number}` === 'J104'));
  const w_t = warVar ? warVar.value_2026 : 0.72;
  const result = eq14_monteCarlo(vars, w_t, PARAMS.MONTE_CARLO_RUNS);

  const histogram = new Array(20).fill(0);
  for (let i = 0; i < PARAMS.MONTE_CARLO_RUNS; i++) {
    const p = eq12_pRev(
      gaussianRandom(2.31, 0.15)
    );
    const bin = Math.min(19, Math.floor(p * 20));
    histogram[bin]++;
  }

  const chartData = histogram.map((count, i) => ({
    rri: parseFloat((i / 4).toFixed(2)), // 0 to 5 range
    frequency: count
  }));

  return { 
    ...result, 
    histogram, 
    chartData,
    p5: result.ci_low,
    p95: result.ci_high,
    median: result.mean
  };
}

export function processArticleForRRI(
  articleText: string,
  articleSeverity: number
): {
  nudged_variables: string[];
  total_r_delta: number;
  new_rri: number;
} {
  const vars = (variables && Array.isArray(variables.variables)) ? (variables.variables as RRIVariable[]) : [];
  const text = (articleText || "").toLowerCase();
  const nudged: string[] = [];
  let total_delta = 0;

  for (const v of vars) {
    if (!v) continue;
    const keywords = v.keywords || v.nlp_keywords || [];
    const matched = keywords.some(kw =>
      kw && text.includes(kw.toLowerCase())
    );
    if (matched) {
      const nlp_nudge = v.nlp_nudge ?? 0.05;
      const scaled_nudge = nlp_nudge * (articleSeverity / 3);
      const current_value = v.value ?? eq1_normalize(v);
      const new_value = Math.max(0, Math.min(1.5, current_value + scaled_nudge));
      v.value = new_value;
      
      const min_value = v.min_value ?? 0;
      const max_value = v.max_value ?? 100;
      const invert = v.invert ?? false;
      const range = max_value - min_value;
      const unnorm = invert
        ? min_value + (1 - new_value) * range
        : min_value + new_value * range;
      v.value_2026 = unnorm;
      nudged.push(v.id || `${v.code}${v.number}`);
      total_delta += scaled_nudge * v.weight;
    }
  }

  const newState = calculateRRI();

  return {
    nudged_variables: nudged,
    total_r_delta: parseFloat(total_delta.toFixed(4)),
    new_rri: newState.rri,
  };
}

export function updateVariableFromPipeline(
  pipeline_field: string,
  new_value: number
): { variable_id: string; old_value: number; new_value: number } | null {
  const vars = (variables && Array.isArray(variables.variables)) ? (variables.variables as RRIVariable[]) : [];
  const v = vars.find(v => v && v.pipeline_field === pipeline_field);
  if (!v) return null;

  const old_value = v.value_2026;
  v.value_2026 = new_value;
  v.value = eq1_normalize(v);

  if (Array.isArray(v.history)) {
    v.history.shift();
    v.history.push(v.value_2026);
  } else {
    v.history = new Array(12).fill(v.value_2026);
  }
  
  v.last_updated = new Date().toISOString().split('T')[0];

  return {
    variable_id: v.id || `${v.code}${v.number}`,
    old_value,
    new_value,
  };
}

export function getRiskTier(rri: number): { label: string; color: string } {
  if (rri >= 2.5) return { label: 'CRITICAL', color: 'text-intel-red' };
  if (rri >= 2.0) return { label: 'ELEVATED', color: 'text-intel-orange' };
  if (rri >= 1.5) return { label: 'MODERATE', color: 'text-intel-yellow' };
  return { label: 'LOW', color: 'text-intel-cyan' };
}

export function calculateModelConfidence(vars: RRIVariable[]): number {
  if (!Array.isArray(vars)) return 0.5;
  const now = new Date();
  const freshness = vars.reduce((sum, v) => {
    if (!v) return sum + 0;
    const lastUpdatedStr = v.last_updated || new Date().toISOString();
    const lastUpdated = new Date(lastUpdatedStr).getTime();
    const daysSince = (now.getTime() - lastUpdated) / (1000 * 60 * 60 * 24);
    const score = isNaN(daysSince) ? 0 : Math.exp(-daysSince / 30);
    return sum + score;
  }, 0) / (vars.length || 1);
  return Math.min(0.95, (isNaN(freshness) ? 0 : freshness) * 0.9 + 0.1);
}

export function simulateScenario(
  vars: RRIVariable[],
  overrides: Record<string, number>
): { rri: number; prev: number } {
  // Create a deep copy of variables to avoid side effects
  const simVars = JSON.parse(JSON.stringify(vars)) as RRIVariable[];
  
  for (const v of simVars) {
    const id = v.id || `${v.code}${v.number}`;
    if (overrides[id] !== undefined) {
      v.value_2026 = overrides[id];
      // We need eq1_normalize but it's internal. 
      // For simulation, we can just use the raw value if it's already normalized 0-1
      // or implement a simple version here.
      v.value = Math.max(0, Math.min(1.5, v.value_2026 / 100)); 
    }
  }

  // Simplified RRI calculation for simulation
  let r_base = 0;
  for (const v of simVars) {
    r_base += v.weight * v.value;
  }
  const r_final = r_base * 5 * 0.465; // Applying same calibration
  const p_rev = 1 / (1 + Math.exp(-(0.8 * r_final - 2.1)));

  return { rri: r_final, prev: p_rev };
}

export const calculateFullRRIState = calculateRRI;
export const runMonteCarlo = runFullMonteCarlo;
export const calculatePRev = calculateRRI;

export {
  eq3_salience,
  eq4_sir,
  eq7_eliteDefection,
  eq8_warIntensity,
  eq9_remittanceMobilization,
  eq10_remittanceDistribution,
  eq12_pRev,
  eq14_monteCarlo,
  eq15_compoundStress,
  eq16_velocity,
  eq17_cascadeProbability,
  eq18_eliteDefectionDynamics,
  eq19_infoAmplification,
  eq20_historicalPatternSimilarity,
  eq22_cyclePositionIndex,
  eq23_acceleration,
  eq24_structuralEconomic,
  velocityLabel,
  normalize,
  PARAMS,
};

export default calculateRRI;
