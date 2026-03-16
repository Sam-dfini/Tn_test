import { RRIVariable } from '../types/intel';

/**
 * Revolutionary Risk Index (RRI) Engine
 * EQ.1: R(t) = Σ[wi * vi(t)] / Σwi · W(t)
 */
export const calculateRRI = (variables: RRIVariable[], warDistraction: number = 0.72): number => {
  let weightedSum = 0;
  let totalWeight = 0;

  variables.forEach(v => {
    weightedSum += v.value * v.weight;
    totalWeight += v.weight;
  });

  if (totalWeight === 0) return 0;

  const baseRRI = (weightedSum / totalWeight) * 5; // Scale to 0-5
  return baseRRI * warDistraction;
};

export const getRiskTier = (rri: number) => {
  if (rri < 1.5) return { label: 'STABLE', color: 'text-intel-green' };
  if (rri < 2.31) return { label: 'ELEVATED', color: 'text-intel-orange' };
  return { label: 'THRESHOLD', color: 'text-intel-red' };
};

export const calculatePRev = (rri: number): number => {
  // Simple sigmoid for probability of revolution
  // Threshold 2.31 corresponds to ~64.3%
  const k = 2;
  const x0 = 2.0;
  return 1 / (1 + Math.exp(-k * (rri - x0)));
};
