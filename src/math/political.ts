/**
 * TunisiaIntel — Political & Elite Math
 */

/**
 * EQ.21 — Ministerial Instability Index (MII)
 * MII(t) = α·CF + β·(1/tenure_normalized) + γ·CrisisRatio + δ·KM + ε·LS
 */
export interface MIIPayload {
  changeFrequency: number;     // CF (0-1)
  tenureScore: number;         // 1/tenure (0-1)
  crisisRatio: number;         // (0-1)
  keyMinistryScore: number;    // KM (0-1)
  loyaltyShift: number;        // LS (0-1)
}

const MII_WEIGHTS = {
  alpha: 0.20,
  beta: 0.25,
  gamma: 0.20,
  delta: 0.20,
  eps: 0.15
};

export function calculateMII(data: MIIPayload): number {
  return Math.min(1, Math.max(0,
    MII_WEIGHTS.alpha * data.changeFrequency +
    MII_WEIGHTS.beta  * data.tenureScore +
    MII_WEIGHTS.gamma * data.crisisRatio +
    MII_WEIGHTS.delta * data.keyMinistryScore +
    MII_WEIGHTS.eps   * data.loyaltyShift
  ));
}

/**
 * EQ.7 — Elite Defection Utility Function
 * U_i(Defect) = B_i - C_i * (1 - P_rev) + λ_i * Σ D_j
 */
export function calculateEliteDefectionUtility(
  benefit: number,
  cost: number,
  pRev: number,
  cascadeTerm: number,
  lambda: number = 0.5
): number {
  return benefit - cost * (1 - pRev) + lambda * cascadeTerm;
}
