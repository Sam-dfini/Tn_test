/**
 * TS vs Python RRI Engine Consistency Test
 *
 * Compares deterministic equation outputs between engines.
 * Usage: npx tsx scripts/consistency_test.ts
 */

import calculateRRI, {
  eq3_salience,
  eq4_sir,
  eq7_eliteDefection,
  eq8_warIntensity,
  eq12_pRev,
  eq15_compoundStress,
  eq16_velocity,
  eq17_cascadeProbability,
  eq18_eliteDefectionDynamics,
  eq19_infoAmplification,
  eq20_historicalPatternSimilarity,
  eq22_cyclePositionIndex,
  eq23_acceleration,
  eq24_structuralEconomic,
  normalize,
  velocityLabel,
} from '../src/math/rri/engine';

import type { RRIVariable } from '../src/types/intel';
import variables from '../src/data/rri_variables.json';

// ── Helper: build deterministic test vars ──────────────────────────

function cloneVars(): RRIVariable[] {
  const raw = (variables as any).default?.variables || (variables as any).variables || [];
  return JSON.parse(JSON.stringify(raw));
}

// ── 1. Equation-level tests ──────────────────────────────────────

interface TestResult {
  eq: string;
  inputs: string;
  output_ts: any;
  output_range_ok: boolean;
}

const results: TestResult[] = [];

function test(label: string, inputs: any, fn: (...args: any[]) => any, ...args: any[]) {
  const out = fn(...args);
  const rangeOk = typeof out === 'number' ? !isNaN(out) && isFinite(out) : true;
  results.push({
    eq: label,
    inputs: JSON.stringify(inputs),
    output_ts: typeof out === 'number' ? parseFloat(out.toFixed(6)) : out,
    output_range_ok: rangeOk,
  });
}

// EQ.3 — Salience
test('EQ.3 Salience', { w_t: 0.72, cp_t: 0.42, dp_t: 0.38, rm_t: 0.4, rr_t: 0.3, cr_t: 0.3, p_t: 0.72, dd_t: 0.65 },
  eq3_salience, 0.72, 0.42, 0.38, 0.4, 0.3, 0.3, 0.72, 0.65, 0);

// EQ.4 — SIR
test('EQ.4 SIR', { initial_infected_pct: 0.02 },
  () => eq4_sir(0.02), null);

// EQ.7 — Elite Defection
test('EQ.7 Elite Defection', { p_rev: 0.5, r_t: 2.31, defections: 0 },
  eq7_eliteDefection, 0.5, 2.31, 0);

// EQ.8 — War Intensity
test('EQ.8 War Intensity', { battle_deaths_norm: 0.35, media_salience_norm: 0.45 },
  eq8_warIntensity, 0.35, 0.45);

// EQ.12 — P_rev
test('EQ.12 P_rev', { r_t: 2.31 },
  eq12_pRev, 2.31);

// EQ.15 — Compound Stress (needs state vector; test via cloned vars)
const testVars = cloneVars();
test('EQ.15 Compound Stress', { via_cloned_vars: true },
  eq15_compoundStress, testVars);

// EQ.16 — Velocity (needs history; test via cloned vars)
test('EQ.16 Velocity', { via_cloned_vars: true },
  eq16_velocity, testVars);

// EQ.17 — Cascade Probability
test('EQ.17 Cascade Probability', { via_cloned_vars: true },
  eq17_cascadeProbability, testVars);

// EQ.18 — Elite Defection Dynamics
test('EQ.18 Elite Defection Dynamics', { previous_ec: 0.65, parallel_market_premium: 18, decree54_charged: 23, fdi_change: -5 },
  eq18_eliteDefectionDynamics, 0.65, 18, 23, -5);

// EQ.19 — Info Amplification
test('EQ.19 Info Amplification', { press_freedom: 31, internet_censorship: 0.72, social_media_pen: 0.75, throttling: 14 },
  eq19_infoAmplification, 31, 0.72, 0.75, 14);

// EQ.20 — Historical Pattern Similarity
const currentState = {
  A01: 0.45, A02: 0.72, A03: 0.52, A_FX: 0.40,
  D41: 0.55, D44: 0.35, E51: 0.80, L121: 0.85,
  N141: 0.40, N144: 0.25, O151: 0.85, O152: 0.82,
  P164: 0.80, P169: 0.75, M133: 0.65, F66: 0.72,
  M_UGTT: 0.5, N142: 0.5, I92: 0.5, D50: 0.5,
  B21: 0.5, L123: 0.5, A251: 0.5, D_MII: 0.5, SEI_A01: 0.5,
};
test('EQ.20 HPS', { state: 'tunisia_2010_q3_vector' },
  eq20_historicalPatternSimilarity, currentState);

// EQ.22 — Cycle Position Index
test('EQ.22 CPI Index', { via_cloned_vars: true },
  eq22_cyclePositionIndex, testVars);

// EQ.23 — Acceleration (needs 3+ history; via cloned vars)
test('EQ.23 Acceleration', { via_cloned_vars: true },
  eq23_acceleration, testVars);

// EQ.24 — Structural Economic (takes RRIVariable[], not state map)
test('EQ.24 Structural Economic', { via_cloned_vars: true },
  eq24_structuralEconomic, testVars);

// ── 2. Normalize helper ──────────────────────────────────────────
test('normalize(50, 0, 100, false)', { raw: 50, min: 0, max: 100, invert: false },
  normalize, 50, 0, 100, false);
test('normalize(20, 0, 100, true)', { raw: 20, min: 0, max: 100, invert: true },
  normalize, 20, 0, 100, true);

// ── 3. Velocity labels ───────────────────────────────────────────
test('velocityLabel(0.5)', { v: 0.5 }, velocityLabel, 0.5);
test('velocityLabel(0.2)', { v: 0.2 }, velocityLabel, 0.2);
test('velocityLabel(0)', { v: 0 }, velocityLabel, 0);
test('velocityLabel(-0.2)', { v: -0.2 }, velocityLabel, -0.2);
test('velocityLabel(-0.5)', { v: -0.5 }, velocityLabel, -0.5);

// ── 4. Full RRI pipeline (deterministic fields only) ─────────────
const fullResult = calculateRRI();

// Check deterministic fields exist and are in range
const deterministicFields = [
  'rri', 'p_rev', 'salience', 'salience_effective', 'oci',
  'w_t', 'elite_defection_prob', 'velocity', 'velocity_label',
  'compound_stress', 'pattern_similarity', 'pattern_label',
  'cascade_probability', 'info_amplification', 'elite_cohesion_dynamics',
  'cpi_index', 'acceleration', 'structural_econ',
  'sir_susceptible', 'sir_infected', 'sir_recovered',
  'category_scores', 'model_confidence', 'variables_count',
  'stochastic_shock',
];

const fieldResults: Record<string, any> = {};

for (const field of deterministicFields) {
  const val = (fullResult as any)[field];
  let rangeOk = false;
  if (typeof val === 'number') {
    rangeOk = !isNaN(val) && isFinite(val) && val >= -5 && val <= 5;
  } else if (typeof val === 'string') {
    rangeOk = val.length > 0;
  } else if (typeof val === 'object' && val !== null) {
    rangeOk = true;
  }
  fieldResults[field] = {
    type: typeof val,
    value: val,
    range_ok: rangeOk,
  };
}

// ── Output ──────────────────────────────────────────────────────
const output = {
  equation_tests: results,
  full_rri_fields: fieldResults,
  full_rri: {
    rri: fullResult.rri,
    p_rev: fullResult.p_rev,
    velocity: fullResult.velocity,
    category_scores_keys: Object.keys(fullResult.category_scores),
    variables_count: fullResult.variables_count,
  },
};

console.log(JSON.stringify(output, null, 2));
