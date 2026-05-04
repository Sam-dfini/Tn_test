export interface EquationOutputs {
  R: number;
  compoundStress: number;
  salience: number;
  infoAmplification: number;
  remittanceEffect: number;
  protestInfectedRatio: number;
  defectionProbability: number;
  eliteCohesion: number;
  velocity: number;
  cascadeProbability: number;
  shock: number;
  historicalSimilarity: number;
}

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
  defectionProbability: number;
}

/**
 * Normalizes a value to a 0-1 range based on provided min and max bounds.
 * Handles NaN, undefined, and ensures the output is strictly clamped.
 * 
 * @param value - The raw value to normalize
 * @param min - The expected minimum value (default: 0)
 * @param max - The expected maximum value (default: 5)
 * @returns A normalized value between 0 and 1
 */
function normalize(value: number, min: number = 0, max: number = 5): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }
  
  const range = max - min;
  if (range === 0) return 0; // Prevent division by zero
  
  const normalized = (value - min) / range;
  
  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, normalized));
}

/**
 * Transforms raw equation outputs from the RRI model into normalized intelligence signals.
 * 
 * @param eq - The raw outputs from the 20-equation model
 * @returns A set of 10 normalized signals (0 to 1 range)
 */
export function computeSignals(eq: EquationOutputs): Signals {
  return {
    // 1. Core structural risk derived from EQ1
    structuralRisk: normalize(eq.R),
    
    // 2. Compound stress reflecting multi-dimensional pressures (EQ15)
    systemStress: normalize(eq.compoundStress),
    
    // 3. Mobilization potential combining salience, info amplification, and remittance effects
    mobilization: normalize((eq.salience * eq.infoAmplification) + eq.remittanceEffect),
    
    // 4. Protest dynamics based on the SIR model's infected ratio (EQ4)
    protestDynamics: normalize(eq.protestInfectedRatio),
    
    // 5. Elite instability factoring in defection probability and lack of cohesion (EQ7 & EQ18)
    eliteInstability: normalize(eq.defectionProbability * (1 - eq.eliteCohesion)),
    
    // 6. Acceleration or velocity of risk accumulation (EQ16)
    acceleration: normalize(eq.velocity),
    
    // 7. Spatial risk representing the probability of regional cascade (EQ17)
    spatialRisk: normalize(eq.cascadeProbability),
    
    // 8. Information pressure measuring the amplification of narratives (EQ19)
    informationPressure: normalize(eq.infoAmplification),
    
    // 9. Shock impact from exogenous or endogenous triggers (EQ13)
    shockImpact: normalize(eq.shock),
    
    // 10. Historical alignment comparing current state to historical patterns (EQ20)
    historicalAlignment: normalize(eq.historicalSimilarity),
    
    // 11. Raw defection probability for alert triggering
    defectionProbability: eq.defectionProbability
  };
}

/**
 * Convenience bridge between CoreLogicEngine and the Signal Layer
 */
export function getSignalsFromModel(analysis: any): Signals {
  const rt = analysis.rt;
  // Map simplified analysis to EquationOutputs-like structure
  // In a full implementation, we'd have all 20 equations here
  const eq: EquationOutputs = {
    R: rt,
    compoundStress: rt * 0.8,
    salience: analysis.salience,
    infoAmplification: 1.0,
    remittanceEffect: 0.2,
    protestInfectedRatio: analysis.pRev * 0.1,
    defectionProbability: analysis.pRev * 0.05,
    eliteCohesion: 1.0 - (analysis.pRev * 0.2),
    velocity: 0.1,
    cascadeProbability: analysis.pRev * 0.02,
    shock: 0,
    historicalSimilarity: 0.4
  };
  
  return computeSignals(eq);
}
