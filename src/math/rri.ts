/**
 * TunisiaIntel — Pure Math Library
 * Centralized equations from METHODOLOGY.md
 */

/**
 * EQ.1 & EQ.12 — Revolutionary Risk Index (RRI) & Probability
 * P_rev(t) = 1 / (1 + e^{-(0.8 * R(t) - 2.1)})
 */
export function computeRevolutionProbability(rriValue: number): number {
  const logit = 0.8 * rriValue - 2.1;
  return 1 / (1 + Math.exp(-logit));
}

/**
 * Inverse of P_rev to find RRI threshold
 * For P_rev = 0.5, RRI = 2.625
 */
export function rriFromProbability(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  const logit = Math.log(p / (1 - p));
  return (logit + 2.1) / 0.8;
}

/**
 * EQ.16 — Velocity Index V(t)
 * Measures rate of change
 */
export function computeVelocity(current: number, previous: number, lambda: number = 1): number {
  const delta = current - previous;
  return Math.tanh(delta / lambda);
}

/**
 * EQ.23 — Acceleration Index A(t)
 */
export function computeAcceleration(currentVel: number, prevVel: number): number {
  return currentVel - prevVel; // Simplified second derivative
}
