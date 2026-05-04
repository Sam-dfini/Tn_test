/**
 * TunisiaIntel — Economic & Shortage Math
 */

/**
 * SEI Calculation Helper
 * Ported from seiEngine.ts
 */
export interface SEIPayload {
  severityBase: number;       // 0.1 - 0.5
  denial: number;             // 0-1
  acceleration: number;       // 0-1
  intervention: number;       // 0-1
  distortion: number;         // 0-1
  angerIgnition: number;      // 0-1
  densityBoost: number;       // 0-0.15
}

export function calculateSEI(data: SEIPayload): number {
  const phaseContribution =
    data.denial * 0.10 +
    data.acceleration * 0.15 +
    data.intervention * 0.15 +
    data.distortion * 0.20 +
    data.angerIgnition * 0.25;

  return Math.min(1.0, data.severityBase + phaseContribution + data.densityBoost);
}

/**
 * EQ.15 — Compound Stress Index CS(t)
 * Interaction between multiple crisis variables
 */
export function calculatePairStress(val1: number, val2: number, alpha: number = 1, threshold: number = 0.5): number {
  const b1 = Math.max(0, val1 - threshold) / (1 - threshold);
  const b2 = Math.max(0, val2 - threshold) / (1 - threshold);
  return alpha * b1 * b2;
}
