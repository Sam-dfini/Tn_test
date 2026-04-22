/**
 * TunisiaIntel Cluster Layer
 * Aggregates normalized intelligence signals into high-level analytical clusters.
 */

/**
 * Normalized intelligence signals (range 0–1)
 */
export interface Signals {
  structuralRisk: number;
  systemStress: number;
  mobilization: number;
  protestDynamics: number;
  eliteInstability: number;
  acceleration: number;
  spatialRisk: number;
  informationPressure: number;
  shockImpact: number;
  historicalAlignment: number;
}

/**
 * Aggregated intelligence clusters and global scores
 */
export interface Clusters {
  systemPressure: number;
  mobilizationPotential: number;
  dynamicInstability: number;
  regimeFragility: number;
  spreadContagion: number;
  narrativeClosure: number;         // NEW — ETM cognitive layer
  intelligenceScore: number;
  volatility: number;
}

/**
 * Helper to clamp a value between 0 and 1
 */
const clamp = (val: number): number => {
  if (isNaN(val)) return 0;
  return Math.min(1, Math.max(0, val));
};

/**
 * Helper for weighted averages
 * @param inputs Array of [value, weight] tuples
 */
const weightedAverage = (inputs: [number, number][]): number => {
  let totalValue = 0;
  let totalWeight = 0;

  for (const [val, weight] of inputs) {
    const safeVal = isNaN(val) ? 0 : val;
    totalValue += safeVal * weight;
    totalWeight += weight;
  }

  return totalWeight === 0 ? 0 : totalValue / totalWeight;
};

/**
 * Helper for standard deviation across an array of numbers
 */
const standardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
};

/**
 * Aggregates signals into high-level intelligence clusters.
 * 
 * @param signals Normalized input signals from the Signal Layer
 * @returns Computed clusters, intelligence score, and volatility
 */
export function computeClusters(
  signals: Signals,
  narrativeClosure: number = 0   // NEW — injected from ETM engine
): Clusters {
  // 🔴 1. System Pressure: Underlying structural strain
  const systemPressure = clamp(weightedAverage([
    [signals.structuralRisk, 0.6],
    [signals.systemStress, 0.4]
  ]));

  // 🟠 2. Mobilization Potential: Ability of population to mobilize
  const mobilizationPotential = clamp(weightedAverage([
    [signals.mobilization, 0.5],
    [signals.informationPressure, 0.3],
    [signals.protestDynamics, 0.2]
  ]));

  // 🔵 3. Dynamic Instability: Speed and unpredictability of change
  const dynamicInstability = clamp(weightedAverage([
    [signals.acceleration, 0.5],
    [signals.shockImpact, 0.5]
  ]));

  // 🟣 4. Regime Fragility: Probability system loses control
  const regimeFragility = clamp(weightedAverage([
    [signals.eliteInstability, 0.6],
    [signals.protestDynamics, 0.4]
  ]));

  // 🟡 5. Spread & Contagion: Geographic + historical propagation risk
  const spreadContagion = clamp(weightedAverage([
    [signals.spatialRisk, 0.6],
    [signals.historicalAlignment, 0.4]
  ]));

  // 🧠 6. Narrative Closure: Cognitive security / ETM layer
  // Passed in from ETM engine — 0-1 normalized
  const narrativeClosureCluster = clamp(narrativeClosure);

  // 🧮 GLOBAL INTELLIGENCE SCORE (RRI_intelligence)
  const intelligenceScore = clamp(
    0.22 * systemPressure +
    0.22 * mobilizationPotential +
    0.18 * dynamicInstability +
    0.13 * regimeFragility +
    0.13 * spreadContagion +
    0.12 * narrativeClosureCluster
  );

  // 📊 VOLATILITY: Standard deviation across the 6 clusters
  const volatility = clamp(standardDeviation([
    systemPressure,
    mobilizationPotential,
    dynamicInstability,
    regimeFragility,
    spreadContagion,
    narrativeClosureCluster,
  ]));

  return {
    systemPressure,
    mobilizationPotential,
    dynamicInstability,
    regimeFragility,
    spreadContagion,
    narrativeClosure: narrativeClosureCluster,
    intelligenceScore,
    volatility
  };
}
