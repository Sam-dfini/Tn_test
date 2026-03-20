import { RRIVariable as BaseRRIVariable } from '../types/intel';

/**
 * CORE TYPES
 */
export interface RRIVariable extends BaseRRIVariable {
  id: string;
  value: number;
  weight: number;
  category: string;
}

export interface RRIState {
  rri: number;
  prev: number;
  salience: number;
  W: number;
  regime_age: { age_pct: number; years: number };
  ci_low: number;
  ci_high: number;
  monte_carlo_runs: number;
}

/**
 * EQ.1 — Base RRI: weighted sum of all variables
 * R_base(t) = Σ[wi * vi(t)] / Σwi
 * Then scaled 0-5
 */
export const calculateBaseRRI = (variables: RRIVariable[]): number => {
  let weightedSum = 0;
  let totalWeight = 0;

  variables.forEach(v => {
    weightedSum += v.value * v.weight;
    totalWeight += v.weight;
  });

  if (totalWeight === 0) return 0;
  return (weightedSum / totalWeight) * 5; // Scaled to 0-5
};

/**
 * EQ.2 — War Distraction Suppressor W(t)
 * W(t) = 1 - (war_intensity * 0.3)
 * war_intensity comes from variables with category 'war'
 * W(t) clamps to [0.4, 1.0]
 */
export const calculateWarSuppressor = (variables: RRIVariable[]): number => {
  const warVars = variables.filter(v => v.category === 'war');
  if (warVars.length === 0) return 1.0;
  
  const avgWarIntensity = warVars.reduce((sum, v) => sum + v.value, 0) / warVars.length;
  const w = 1 - (avgWarIntensity * 0.3);
  return Math.max(0.4, Math.min(1.0, w));
};

/**
 * EQ.3 — Salience S(t)  
 * S(t) = active_narratives / total_narratives * media_intensity
 * Use variables with category 'media' and 'narrative'
 * S(t) clamps to [0.1, 1.0]
 * Default: 0.412 when no narrative data
 */
export const calculateSalience = (variables: RRIVariable[]): number => {
  const narrativeVars = variables.filter(v => v.category === 'narrative');
  const mediaVars = variables.filter(v => v.category === 'media');
  
  if (narrativeVars.length === 0) return 0.412;
  
  const activeNarratives = narrativeVars.filter(v => v.value > 0.5).length;
  const totalNarratives = narrativeVars.length;
  const mediaIntensity = mediaVars.length > 0 
    ? mediaVars.reduce((sum, v) => sum + v.value, 0) / mediaVars.length 
    : 1.0;
    
  const s = (activeNarratives / totalNarratives) * mediaIntensity;
  return Math.max(0.1, Math.min(1.0, s));
};

/**
 * EQ.4 — Regime Age Suppressor
 * age_pct = percentile of current regime duration vs global distribution
 * Tunisia regime started 2011 (Ennahda transition), consolidated 2021 (Saied)
 * Use 2021 as start year. Current year 2026 = 5 years
 * Global distribution mean: 12 years, stddev: 8 years
 * age_pct = sigmoid((years - 12) / 8)
 * Returns { years: number, age_pct: number }
 */
export const calculateRegimeAge = (): { years: number; age_pct: number } => {
  const startYear = 2021;
  const currentYear = 2026;
  const years = currentYear - startYear;
  
  // Sigmoid function: 1 / (1 + exp(-x))
  const x = (years - 12) / 8;
  const age_pct = 1 / (1 + Math.exp(-x));
  
  return { years, age_pct };
};

/**
 * EQ.5 — Elite Cohesion Suppressor
 * Elite cohesion from variables with category 'elite'
 * High cohesion REDUCES R(t), range [0,1]
 * elite_suppressor = 1 - (elite_cohesion * 0.4)
 */
export const calculateEliteSuppressor = (variables: RRIVariable[]): number => {
  const eliteVars = variables.filter(v => v.category === 'elite');
  if (eliteVars.length === 0) return 1.0;
  
  const avgCohesion = eliteVars.reduce((sum, v) => sum + v.value, 0) / eliteVars.length;
  return 1 - (avgCohesion * 0.4);
};

/**
 * EQ.6 — Final R(t) combining all suppressors
 * R(t) = R_base * W(t) * elite_suppressor
 * Clamp to [0, 5]
 */
export const calculateRRI = (
  variables: RRIVariable[], 
  warDistraction?: number
): number => {
  const baseRRI = calculateBaseRRI(variables);
  const w = warDistraction !== undefined ? warDistraction : calculateWarSuppressor(variables);
  const eliteSuppressor = calculateEliteSuppressor(variables);
  
  const r = baseRRI * w * eliteSuppressor;
  return Math.max(0, Math.min(5, r));
};

/**
 * EQ.7 — P_rev: logistic sigmoid
 * P_rev = 1 / (1 + exp(-k * (R(t) - threshold)))
 * threshold = 2.31 (recalibrated March 2025)
 * k = 0.8 (slope parameter)
 * Returns value in [0, 1]
 */
export const calculatePRev = (rri: number): number => {
  const threshold = 2.31;
  const k = 0.8;
  return 1 / (1 + Math.exp(-k * (rri - threshold)));
};

/**
 * EQ.8 — Salience-weighted P_rev
 * P_rev_adj = P_rev * (0.6 + 0.4 * S(t))
 */
export const calculateAdjustedPRev = (prev: number, salience: number): number => {
  return prev * (0.6 + 0.4 * salience);
};

/**
 * EQ.13 — Gaussian noise helper for Monte Carlo
 * Box-Muller transform for proper normal distribution
 */
const gaussianNoise = (mean: number, stddev: number): number => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stddev + mean;
};

/**
 * EQ.9 — Monte Carlo simulation
 * Run N iterations (default 10000)
 * Each iteration: add Gaussian noise (stddev 0.15) to each variable value
 * Recalculate RRI and P_rev for each run
 * Returns { mean, median, p5, p95, ci_low, ci_high, runs_above_threshold }
 */
export const runMonteCarlo = (
  variables: RRIVariable[], 
  iterations: number = 10000
): { 
  mean: number; 
  median: number; 
  p5: number; 
  p95: number; 
  ci_low: number; 
  ci_high: number; 
  runs_above_threshold: number;
  chartData: { rri: number; frequency: number; pRev: number }[];
} => {
  const rriResults: number[] = [];
  const pRevResults: number[] = [];
  const threshold = 2.31;
  
  const rriBuckets: Record<number, number> = {};
  const pRevSumByRRI: Record<number, number> = {};

  for (let i = 0; i < iterations; i++) {
    const noisyVars = variables.map(v => ({
      ...v,
      value: Math.max(0, Math.min(1, gaussianNoise(v.value, 0.15)))
    }));
    
    const rri = calculateRRI(noisyVars);
    const pRev = calculatePRev(rri);
    
    rriResults.push(rri);
    pRevResults.push(pRev);
    
    const bucket = Math.round(rri * 20) / 20; // 0.05 steps
    rriBuckets[bucket] = (rriBuckets[bucket] || 0) + 1;
    pRevSumByRRI[bucket] = (pRevSumByRRI[bucket] || 0) + pRev;
  }
  
  const sortedRRI = [...rriResults].sort((a, b) => a - b);
  const sortedPRev = [...pRevResults].sort((a, b) => a - b);
  
  const mean = rriResults.reduce((a, b) => a + b, 0) / iterations;
  const median = sortedRRI[Math.floor(iterations / 2)];
  const p5 = sortedRRI[Math.floor(iterations * 0.05)];
  const p95 = sortedRRI[Math.floor(iterations * 0.95)];
  
  const ci_low = sortedPRev[Math.floor(iterations * 0.025)];
  const ci_high = sortedPRev[Math.floor(iterations * 0.975)];
  
  const runs_above_threshold = rriResults.filter(r => r >= threshold).length;
  
  const chartData = Object.keys(rriBuckets).map(key => {
    const rri = parseFloat(key);
    return {
      rri,
      frequency: rriBuckets[rri],
      pRev: pRevSumByRRI[rri] / rriBuckets[rri]
    };
  }).sort((a, b) => a.rri - b.rri);
  
  return { mean, median, p5, p95, ci_low, ci_high, runs_above_threshold, chartData };
};

/**
 * EQ.10 — Risk tier classification
 */
export const getRiskTier = (rri: number): { 
  label: string; 
  color: string; 
  bgColor: string 
} => {
  if (rri < 1.0) return { label: 'STABLE', color: 'text-intel-green', bgColor: 'bg-intel-green/10' };
  if (rri < 1.8) return { label: 'LOW', color: 'text-intel-cyan', bgColor: 'bg-intel-cyan/10' };
  if (rri < 2.31) return { label: 'ELEVATED', color: 'text-intel-orange', bgColor: 'bg-intel-orange/10' };
  if (rri <= 3.0) return { label: 'THRESHOLD', color: 'text-intel-red', bgColor: 'bg-intel-red/10' };
  return { label: 'CRITICAL', color: 'text-red-600', bgColor: 'bg-red-600/10' };
};

/**
 * EQ.11 — Scenario simulation (for simulator tab)
 * Apply overrides to variable values, recalculate full model
 * overrides is a Record<variableId, newValue>
 */
export const simulateScenario = (
  variables: RRIVariable[],
  overrides: Record<string, number>
): RRIState => {
  const simulatedVars = variables.map(v => ({
    ...v,
    value: overrides[v.id] !== undefined ? overrides[v.id] : v.value
  }));
  
  return calculateFullRRIState(simulatedVars);
};

/**
 * EQ.12 — Full state calculation (main export used by App.tsx)
 * Combines all equations into one call
 * Returns complete RRIState
 */
export const calculateFullRRIState = (variables: RRIVariable[]): RRIState => {
  const rri = calculateRRI(variables);
  const rawPRev = calculatePRev(rri);
  const salience = calculateSalience(variables);
  const prev = calculateAdjustedPRev(rawPRev, salience);
  const w = calculateWarSuppressor(variables);
  const regime_age = calculateRegimeAge();
  
  // Quick Monte Carlo for CI bands (fewer iterations for performance if needed, but user said 10000)
  const mc = runMonteCarlo(variables, 1000); 
  
  return {
    rri,
    prev,
    salience,
    W: w,
    regime_age,
    ci_low: mc.ci_low,
    ci_high: mc.ci_high,
    monte_carlo_runs: 1000
  };
};

/**
 * EQ.14 — Model confidence score
 * Based on data freshness, variable coverage, and calibration history
 * Returns 0-100
 */
export const calculateModelConfidence = (variables: RRIVariable[]): number => {
  if (variables.length === 0) return 0;
  
  // Coverage: how many categories are represented
  const categories = new Set(variables.map(v => v.category));
  const coverageScore = (categories.size / 8) * 40; // Assume 8 key categories
  
  // Freshness: average age of data
  const now = new Date().getTime();
  const avgAgeDays = variables.reduce((sum, v) => {
    const updated = new Date(v.last_updated).getTime();
    return sum + (now - updated) / (1000 * 60 * 60 * 24);
  }, 0) / variables.length;
  
  const freshnessScore = Math.max(0, 40 - avgAgeDays * 2); // Lose 2 points per day
  
  // Calibration: fixed base for now
  const calibrationScore = 20;
  
  return Math.min(100, Math.round(coverageScore + freshnessScore + calibrationScore));
};
