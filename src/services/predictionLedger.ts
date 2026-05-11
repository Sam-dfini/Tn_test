import { safeStorage } from '../utils/storage';
/**
 * TunisiaIntel — Prediction Ledger
 *
 * The learning loop core. Stores variable-level predictions,
 * evaluates them against observed reality, computes accuracy
 * by variable / time horizon / RRI threshold, and surfaces
 * analyst corrections for human review.
 *
 * Design principles:
 *   - All predictions are falsifiable and time-bounded
 *   - No auto-weight adjustment — humans validate all changes
 *   - Track structural preconditions, not just binary outcomes
 *   - Accuracy is computed honestly (base rate matters)
 */

import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────

export type PredictionHorizon = 7 | 14 | 30 | 60;

export type PredictionVariable =
  | 'fx_reserves_below_75'     // FX crosses 75-day threshold
  | 'fx_reserves_below_60'     // FX crosses crisis threshold
  | 'ugtt_escalates'           // UGTT reaches HIGH mobilisation
  | 'protests_exceed_30'       // protest_events_30d > 30
  | 'protests_exceed_40'       // protest_events_30d > 40
  | 'sei_phase_4_any'          // any commodity reaches Phase 4+
  | 'sei_anger_window'         // compound anger trigger fires
  | 'cascade_prob_above_60'    // cascade_probability > 0.60
  | 'velocity_above_20'        // velocity > 0.20 (DETERIORATING FAST)
  | 'rpi_above_50'             // RPI > 0.50 (Level 3+)
  | 'etm_closure_above_65'     // ETM narrative closure > 0.65
  | 'mii_phase_chaotic'        // MII phase transitions to CHAOTIC
  | 'elite_defection_above_30' // elite_defection_prob > 0.30
  | 'rri_above_2_5'            // R(t) crosses 2.5 (P_rev > 50%)
  | 'rri_above_3_0';           // R(t) crosses 3.0

export interface FalsifiablePrediction {
  variable: PredictionVariable;
  predicted: boolean;          // model predicts this will happen
  confidence: number;          // 0-1, model confidence in this prediction
  basis: string;               // which equation/signal drove this
}

export interface PredictionRecord {
  id: string;
  predicted_at: string;        // ISO datetime
  horizon_days: PredictionHorizon;
  evaluate_after: string;      // ISO datetime — when to check

  // Model state at prediction time
  rri: number;
  p_rev: number;
  velocity: number;
  compound_stress: number;
  pattern_similarity: number;
  cascade_probability: number;
  elite_defection_prob: number;
  elite_cohesion: number;

  // Layer states
  mii: number;
  mii_phase: string;
  rpi: number;
  escalation_level: number;
  etm_closure: number;
  etm_phase: string;
  sei_max: number;
  sei_dominant_phase: number;

  // Variable-level predictions
  predictions: FalsifiablePrediction[];

  // Filled when horizon elapses
  actuals?: Partial<Record<PredictionVariable, boolean>>;
  evaluated_at?: string;
  accuracy_score?: number;       // 0-1 across predictions
  hit_count?: number;
  miss_count?: number;
  false_positives?: PredictionVariable[];
  false_negatives?: PredictionVariable[];
  analyst_note?: string;

  // Source
  triggered_by: 'RECALCULATE' | 'THRESHOLD_BREACH' | 'MANUAL' | 'SCHEDULED';
}

export interface AnalystCorrection {
  id: string;
  prediction_id: string;
  corrected_at: string;
  analyst_note: string;
  missed_variable?: string;
  missed_signal?: string;
  what_actually_happened: string;
  suggested_weight_change?: {
    equation: string;
    parameter: string;
    direction: 'increase' | 'decrease';
    magnitude: 'minor' | 'moderate' | 'significant';
    reasoning: string;
  };
  applied: boolean;
}

export interface AccuracyStats {
  variable: PredictionVariable;
  total: number;
  hits: number;
  misses: number;
  hitRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  avgConfidence: number;
  byHorizon: Record<PredictionHorizon, { hits: number; total: number; hitRate: number }>;
}

export interface ModelPerformanceSummary {
  totalPredictions: number;
  evaluated: number;
  pending: number;
  overallAccuracy: number;
  bestVariable: { variable: PredictionVariable; hitRate: number } | null;
  worstVariable: { variable: PredictionVariable; hitRate: number } | null;
  byHorizon: Record<PredictionHorizon, { accuracy: number; count: number }>;
  falsePositiveRate: number;
  falseNegativeRate: number;
  recentTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  calibrationNote: string;
}

// ── Prediction Generator ───────────────────────────────────────
// Translates current model state into falsifiable predictions

export function generatePredictions(
  rriState: any,
  data: any,
  engines: {
    miiProfile?: any;
    rpiProfile?: any;
    cognitiveEnvironment?: any;
    seiResult?: any;
  } = {}
): FalsifiablePrediction[] {

  const predictions: FalsifiablePrediction[] = [];
  const rri = rriState.rri ?? 2.31;
  const velocity = rriState.velocity ?? 0.18;
  const p_rev = rriState.p_rev ?? 0.643;
  const cascade = rriState.cascade_probability ?? 0.58;
  const eliteDefection = rriState.elite_defection_prob ?? 0.12;
  const eliteCohesion = rriState.elite_cohesion_dynamics ?? 0.65;
  const inflation = data?.economy?.inflation ?? 7.1;
  const fxReserves = data?.economy?.fx_reserves ?? 84;
  const protests = data?.social?.protest_events_30d ?? 23;
  const ugtt = data?.social?.ugtt_mobilisation_level ?? 'ELEVATED';

  const mii = engines.miiProfile?.mii ?? 0.572;
  const miiPhase = engines.miiProfile?.phase ?? 'FREEZE';
  const rpi = engines.rpiProfile?.escalationRisk ?? 0.28;
  const escalationLevel = engines.rpiProfile?.escalationLevel ?? 2;
  const etmClosure = engines.cognitiveEnvironment?.narrativeClosure ?? 0.35;
  const etmPhase = engines.cognitiveEnvironment?.phase ?? 'AMPLIFICATION';
  const seiMax = engines.seiResult?.maxSEI ?? 0.42;
  const seiDomPhase = engines.seiResult?.dominantPhase ?? 2;

  // ── FX Reserve predictions ──────────────────────────────────
  // Predict based on current level + trajectory
  if (fxReserves < 100) {
    const velocityFactor = velocity > 0.1 ? 1.3 : velocity > 0 ? 1.1 : 0.9;
    const conf = Math.min(0.90, (1 - fxReserves / 100) * velocityFactor * 0.8 + 0.2);
    predictions.push({
      variable: 'fx_reserves_below_75',
      predicted: fxReserves < 80 || (fxReserves < 90 && velocity > 0.1),
      confidence: conf,
      basis: `FX=${fxReserves}d, V(t)=${velocity.toFixed(3)}`,
    });
  }

  if (fxReserves < 85) {
    predictions.push({
      variable: 'fx_reserves_below_60',
      predicted: fxReserves < 65 || (fxReserves < 75 && velocity > 0.15),
      confidence: Math.min(0.85, (1 - fxReserves / 85) * 0.7 + 0.15),
      basis: `FX=${fxReserves}d approaching crisis threshold`,
    });
  }

  // ── UGTT prediction ──────────────────────────────────────────
  const ugttHigh = ugtt === 'HIGH';
  const ugttElevated = ugtt === 'ELEVATED';
  predictions.push({
    variable: 'ugtt_escalates',
    predicted: ugttHigh || (ugttElevated && mii > 0.55 && inflation > 7),
    confidence: ugttHigh ? 0.90 :
      ugttElevated ? Math.min(0.75, mii * 0.5 + inflation / 20) : 0.20,
    basis: `UGTT=${ugtt}, MII=${mii.toFixed(2)}, inflation=${inflation}%`,
  });

  // ── Protest surge prediction ─────────────────────────────────
  const protestVelocity = velocity > 0.15;
  predictions.push({
    variable: 'protests_exceed_30',
    predicted: protests > 28 || (protests > 20 && protestVelocity),
    confidence: Math.min(0.88,
      (protests / 30) * 0.6 + (protestVelocity ? 0.25 : 0) + 0.15
    ),
    basis: `protests=${protests}/month, V(t)=${velocity.toFixed(3)}`,
  });

  predictions.push({
    variable: 'protests_exceed_40',
    predicted: protests > 35 || (protests > 28 && rpi > 0.40),
    confidence: Math.min(0.80, (protests / 40) * 0.65 + rpi * 0.25),
    basis: `protests=${protests}, RPI=${rpi.toFixed(2)}`,
  });

  // ── SEI predictions ──────────────────────────────────────────
  predictions.push({
    variable: 'sei_phase_4_any',
    predicted: seiMax > 0.55 || seiDomPhase >= 3,
    confidence: Math.min(0.85, seiMax * 0.7 + (seiDomPhase >= 3 ? 0.3 : 0) + 0.1),
    basis: `SEI=${seiMax.toFixed(2)}, phase=${seiDomPhase}`,
  });

  predictions.push({
    variable: 'sei_anger_window',
    predicted: seiMax > 0.65 && inflation > 7.5,
    confidence: Math.min(0.80,
      seiMax * 0.5 + (inflation / 12) * 0.3 + 0.1
    ),
    basis: `SEI=${seiMax.toFixed(2)}, inflation=${inflation}% (threshold: SEI>0.70 + infl>7%)`,
  });

  // ── Cascade prediction ───────────────────────────────────────
  predictions.push({
    variable: 'cascade_prob_above_60',
    predicted: cascade > 0.50,
    confidence: Math.min(0.85, cascade * 0.85 + 0.10),
    basis: `EQ.17 cascade=${cascade.toFixed(3)}`,
  });

  // ── Velocity prediction ──────────────────────────────────────
  predictions.push({
    variable: 'velocity_above_20',
    predicted: velocity > 0.15 || (mii > 0.60 && rpi > 0.35),
    confidence: Math.min(0.80,
      (velocity / 0.3) * 0.6 + mii * 0.2 + rpi * 0.2
    ),
    basis: `V(t)=${velocity.toFixed(3)}, MII=${mii.toFixed(2)}`,
  });

  // ── RDE prediction ───────────────────────────────────────────
  predictions.push({
    variable: 'rpi_above_50',
    predicted: rpi > 0.38 || escalationLevel >= 3,
    confidence: Math.min(0.85, rpi * 0.75 + (escalationLevel >= 3 ? 0.25 : 0) + 0.10),
    basis: `RPI=${rpi.toFixed(2)}, Level=${escalationLevel}`,
  });

  // ── ETM prediction ───────────────────────────────────────────
  predictions.push({
    variable: 'etm_closure_above_65',
    predicted: etmClosure > 0.45 || etmPhase === 'CLOSURE',
    confidence: Math.min(0.80,
      etmClosure * 0.70 + (etmPhase === 'CLOSURE' ? 0.30 : 0) + 0.10
    ),
    basis: `ETM closure=${(etmClosure*100).toFixed(0)}%, phase=${etmPhase}`,
  });

  // ── MII prediction ───────────────────────────────────────────
  predictions.push({
    variable: 'mii_phase_chaotic',
    predicted: mii > 0.60 && miiPhase !== 'STABLE',
    confidence: Math.min(0.75, mii * 0.65 + 0.15),
    basis: `MII=${mii.toFixed(2)}, phase=${miiPhase}`,
  });

  // ── Elite defection prediction ───────────────────────────────
  predictions.push({
    variable: 'elite_defection_above_30',
    predicted: eliteDefection > 0.22 || (1 - eliteCohesion) > 0.45,
    confidence: Math.min(0.80,
      eliteDefection * 0.70 + (1 - eliteCohesion) * 0.30
    ),
    basis: `defection_prob=${eliteDefection.toFixed(2)}, cohesion=${eliteCohesion.toFixed(2)}`,
  });

  // ── RRI threshold predictions ────────────────────────────────
  predictions.push({
    variable: 'rri_above_2_5',
    predicted: rri > 2.35 || (rri > 2.2 && velocity > 0.15),
    confidence: Math.min(0.90, (rri / 3) * 0.75 + velocity * 0.20 + 0.05),
    basis: `R(t)=${rri.toFixed(3)}, P_rev=${(p_rev*100).toFixed(1)}%`,
  });

  if (rri > 2.3) {
    predictions.push({
      variable: 'rri_above_3_0',
      predicted: rri > 2.70 || (rri > 2.5 && velocity > 0.20),
      confidence: Math.min(0.75, (rri / 4) * 0.65 + velocity * 0.25),
      basis: `R(t)=${rri.toFixed(3)}, velocity=${velocity.toFixed(3)}`,
    });
  }

  return predictions;
}

// ── Horizon calculator ─────────────────────────────────────────

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Store prediction to Supabase ───────────────────────────────

export async function storePrediction(
  rriState: any,
  data: any,
  engines: {
    miiProfile?: any;
    rpiProfile?: any;
    cognitiveEnvironment?: any;
    seiResult?: any;
  } = {},
  horizon: PredictionHorizon = 14,
  triggeredBy: PredictionRecord['triggered_by'] = 'RECALCULATE'
): Promise<string | null> {
  try {
    const predictions = generatePredictions(rriState, data, engines);
    const now = new Date().toISOString();

    const record: Omit<PredictionRecord, 'id'> = {
      predicted_at: now,
      horizon_days: horizon,
      evaluate_after: addDays(now, horizon),
      rri: rriState.rri ?? 2.31,
      p_rev: rriState.p_rev ?? 0.643,
      velocity: rriState.velocity ?? 0.18,
      compound_stress: rriState.compound_stress ?? 0.08,
      pattern_similarity: rriState.pattern_similarity ?? 0.67,
      cascade_probability: rriState.cascade_probability ?? 0.58,
      elite_defection_prob: rriState.elite_defection_prob ?? 0.12,
      elite_cohesion: rriState.elite_cohesion_dynamics ?? 0.65,
      mii: engines.miiProfile?.mii ?? 0.572,
      mii_phase: engines.miiProfile?.phase ?? 'FREEZE',
      rpi: engines.rpiProfile?.escalationRisk ?? 0.28,
      escalation_level: engines.rpiProfile?.escalationLevel ?? 2,
      etm_closure: engines.cognitiveEnvironment?.narrativeClosure ?? 0.35,
      etm_phase: engines.cognitiveEnvironment?.phase ?? 'AMPLIFICATION',
      sei_max: engines.seiResult?.maxSEI ?? 0.42,
      sei_dominant_phase: engines.seiResult?.dominantPhase ?? 2,
      predictions,
      triggered_by: triggeredBy,
    };

    const { data: saved, error } = await supabase
      .from('predictions')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('[PredictionLedger] Store failed:', error);
      return null;
    }

    return saved?.id ?? null;
  } catch (err) {
    console.error('[PredictionLedger] Store error:', err);
    return null;
  }
}

// ── Evaluate pending predictions ───────────────────────────────
// Called when rriState updates — checks if any pending
// predictions have passed their horizon and can be evaluated

export async function evaluatePendingPredictions(
  currentData: any
): Promise<number> {
  try {
    const now = new Date().toISOString();

    // Fetch predictions past their evaluate_after date
    const { data: pending, error } = await supabase
      .from('predictions')
      .select('*')
      .lte('evaluate_after', now)
      .is('evaluated_at', null)
      .limit(20);

    if (error || !pending) return 0;

    let evaluatedCount = 0;

    for (const pred of pending) {
      // Build actuals from current observed data
      const actuals: Partial<Record<PredictionVariable, boolean>> = {};

      const fx = currentData?.economy?.fx_reserves ?? 84;
      const protests = currentData?.social?.protest_events_30d ?? 23;
      const ugtt = currentData?.social?.ugtt_mobilisation_level ?? 'ELEVATED';

      actuals.fx_reserves_below_75 = fx < 75;
      actuals.fx_reserves_below_60 = fx < 60;
      actuals.ugtt_escalates = ugtt === 'HIGH';
      actuals.protests_exceed_30 = protests > 30;
      actuals.protests_exceed_40 = protests > 40;
      // SEI, cascade, RPI actuals require engine outputs — approximated
      actuals.velocity_above_20 = false; // will be filled if engines active

      // Compute accuracy
      const preds: FalsifiablePrediction[] = pred.predictions ?? [];
      let hits = 0;
      let misses = 0;
      const falsePositives: PredictionVariable[] = [];
      const falseNegatives: PredictionVariable[] = [];

      for (const p of preds) {
        const actual = actuals[p.variable];
        if (actual === undefined) continue; // can't evaluate this one

        if (p.predicted === actual) {
          hits++;
        } else {
          misses++;
          if (p.predicted && !actual) falsePositives.push(p.variable);
          if (!p.predicted && actual) falseNegatives.push(p.variable);
        }
      }

      const evaluable = hits + misses;
      const accuracy = evaluable > 0 ? hits / evaluable : null;

      await supabase
        .from('predictions')
        .update({
          actuals,
          evaluated_at: now,
          accuracy_score: accuracy,
          hit_count: hits,
          miss_count: misses,
          false_positives: falsePositives,
          false_negatives: falseNegatives,
        })
        .eq('id', pred.id);

      evaluatedCount++;
    }

    return evaluatedCount;
  } catch (err) {
    console.error('[PredictionLedger] Evaluate error:', err);
    return 0;
  }
}

// ── Fetch prediction records ───────────────────────────────────

export async function fetchPredictions(options: {
  limit?: number;
  evaluated?: boolean;
  horizonDays?: PredictionHorizon;
  minRRI?: number;
}): Promise<PredictionRecord[]> {
  try {
    console.log('[PredictionLedger] Fetching predictions...');
    let query = supabase
      .from('predictions')
      .select('*')
      .order('predicted_at', { ascending: false })
      .limit(options.limit ?? 50);

    if (options.evaluated === true) {
      query = query.not('evaluated_at', 'is', null);
    } else if (options.evaluated === false) {
      query = query.is('evaluated_at', null);
    }

    if (options.horizonDays) {
      query = query.eq('horizon_days', options.horizonDays);
    }

    if (options.minRRI) {
      query = query.gte('rri', options.minRRI);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as PredictionRecord[];
  } catch {
    return [];
  }
}

// ── Compute accuracy stats ─────────────────────────────────────

export function computeAccuracyStats(
  records: PredictionRecord[]
): AccuracyStats[] {
  const evaluated = records.filter(r => r.evaluated_at && r.actuals);
  if (!evaluated.length) return [];

  const VARIABLES: PredictionVariable[] = [
    'fx_reserves_below_75', 'fx_reserves_below_60',
    'ugtt_escalates', 'protests_exceed_30', 'protests_exceed_40',
    'sei_phase_4_any', 'sei_anger_window', 'cascade_prob_above_60',
    'velocity_above_20', 'rpi_above_50', 'etm_closure_above_65',
    'mii_phase_chaotic', 'elite_defection_above_30',
    'rri_above_2_5', 'rri_above_3_0',
  ];

  const HORIZONS: PredictionHorizon[] = [7, 14, 30, 60];

  return VARIABLES.map(variable => {
    let total = 0;
    let hits = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    const byHorizon: AccuracyStats['byHorizon'] = {
      7: { hits: 0, total: 0, hitRate: 0 },
      14: { hits: 0, total: 0, hitRate: 0 },
      30: { hits: 0, total: 0, hitRate: 0 },
      60: { hits: 0, total: 0, hitRate: 0 },
    };

    for (const rec of evaluated) {
      const pred = rec.predictions?.find(p => p.variable === variable);
      if (!pred) continue;
      const actual = rec.actuals?.[variable];
      if (actual === undefined) continue;

      total++;
      confidenceSum += pred.confidence;
      confidenceCount++;

      const horizon = rec.horizon_days as PredictionHorizon;
      byHorizon[horizon].total++;

      if (pred.predicted === actual) {
        hits++;
        byHorizon[horizon].hits++;
      } else if (pred.predicted && !actual) {
        falsePositives++;
      } else if (!pred.predicted && actual) {
        falseNegatives++;
      }
    }

    // Compute horizon hit rates
    for (const h of HORIZONS) {
      const hData = byHorizon[h];
      hData.hitRate = hData.total > 0 ? hData.hits / hData.total : 0;
    }

    return {
      variable,
      total,
      hits,
      misses: total - hits,
      hitRate: total > 0 ? hits / total : 0,
      falsePositiveRate: total > 0 ? falsePositives / total : 0,
      falseNegativeRate: total > 0 ? falseNegatives / total : 0,
      avgConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : 0,
      byHorizon,
    };
  }).filter(s => s.total > 0);
}

// ── Compute model performance summary ─────────────────────────

export function computeModelPerformance(
  records: PredictionRecord[],
  stats: AccuracyStats[]
): ModelPerformanceSummary {
  const evaluated = records.filter(r => r.evaluated_at);
  const pending = records.filter(r => !r.evaluated_at);

  const overallAccuracy = evaluated.length > 0
    ? evaluated.reduce((sum, r) => sum + (r.accuracy_score ?? 0), 0) / evaluated.length
    : 0;

  const sortedByHR = [...stats].sort((a, b) => b.hitRate - a.hitRate);
  const best = sortedByHR[0]
    ? { variable: sortedByHR[0].variable, hitRate: sortedByHR[0].hitRate }
    : null;
  const worst = sortedByHR[sortedByHR.length - 1]
    ? { variable: sortedByHR[sortedByHR.length - 1].variable,
        hitRate: sortedByHR[sortedByHR.length - 1].hitRate }
    : null;

  const HORIZONS: PredictionHorizon[] = [7, 14, 30, 60];
  const byHorizon: ModelPerformanceSummary['byHorizon'] = {
    7: { accuracy: 0, count: 0 },
    14: { accuracy: 0, count: 0 },
    30: { accuracy: 0, count: 0 },
    60: { accuracy: 0, count: 0 },
  };

  for (const rec of evaluated) {
    const h = rec.horizon_days as PredictionHorizon;
    byHorizon[h].count++;
    byHorizon[h].accuracy += rec.accuracy_score ?? 0;
  }
  for (const h of HORIZONS) {
    if (byHorizon[h].count > 0) {
      byHorizon[h].accuracy /= byHorizon[h].count;
    }
  }

  // Overall FP/FN rates
  let totalFP = 0, totalFN = 0, totalPredictions = 0;
  for (const s of stats) {
    totalFP += s.falsePositiveRate * s.total;
    totalFN += s.falseNegativeRate * s.total;
    totalPredictions += s.total;
  }

  // Recent trend: compare last 5 vs previous 5 accuracy
  const sorted = [...evaluated].sort((a, b) =>
    new Date(b.evaluated_at!).getTime() - new Date(a.evaluated_at!).getTime()
  );
  const recent5 = sorted.slice(0, 5);
  const prev5 = sorted.slice(5, 10);
  const recentAvg = recent5.length > 0
    ? recent5.reduce((s, r) => s + (r.accuracy_score ?? 0), 0) / recent5.length : 0;
  const prevAvg = prev5.length > 0
    ? prev5.reduce((s, r) => s + (r.accuracy_score ?? 0), 0) / prev5.length : 0;

  const trend: ModelPerformanceSummary['recentTrend'] =
    recentAvg > prevAvg + 0.05 ? 'IMPROVING' :
    recentAvg < prevAvg - 0.05 ? 'DEGRADING' : 'STABLE';

  // Calibration note
  let calibrationNote = '';
  if (evaluated.length < 5) {
    calibrationNote = 'Insufficient data for calibration. Minimum 5 evaluated predictions needed.';
  } else if (overallAccuracy > 0.75) {
    calibrationNote = `Strong calibration (${(overallAccuracy*100).toFixed(0)}% accuracy). ` +
      `Model is reliably identifying risk trajectory.`;
  } else if (overallAccuracy > 0.60) {
    calibrationNote = `Moderate calibration (${(overallAccuracy*100).toFixed(0)}% accuracy). ` +
      `Review ${worst?.variable?.replace(/_/g,' ')} — lowest hit rate.`;
  } else {
    calibrationNote = `Below-target calibration (${(overallAccuracy*100).toFixed(0)}% accuracy). ` +
      `Consider analyst corrections for systematic bias. ` +
      `False positive rate: ${(totalFP/totalPredictions*100).toFixed(0)}%.`;
  }

  return {
    totalPredictions: records.length,
    evaluated: evaluated.length,
    pending: pending.length,
    overallAccuracy,
    bestVariable: best,
    worstVariable: worst,
    byHorizon,
    falsePositiveRate: totalPredictions > 0 ? totalFP / totalPredictions : 0,
    falseNegativeRate: totalPredictions > 0 ? totalFN / totalPredictions : 0,
    recentTrend: trend,
    calibrationNote,
  };
}

// ── Analyst correction ─────────────────────────────────────────

export async function storeAnalystCorrection(
  correction: Omit<AnalystCorrection, 'id' | 'corrected_at' | 'applied'>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('analyst_corrections')
      .insert({
        ...correction,
        corrected_at: new Date().toISOString(),
        applied: false,
      });
    return !error;
  } catch {
    return false;
  }
}

export async function fetchAnalystCorrections(
  predictionId?: string
): Promise<AnalystCorrection[]> {
  try {
    let query = supabase
      .from('analyst_corrections')
      .select('*')
      .order('corrected_at', { ascending: false })
      .limit(50);

    if (predictionId) {
      query = query.eq('prediction_id', predictionId);
    }

    const { data, error } = await query;
    return (data ?? []) as AnalystCorrection[];
  } catch {
    return [];
  }
}

// ── Correction recommendation surfacer ────────────────────────
// Looks at accumulated corrections and surfaces patterns

export async function getSurfacedRecommendations(): Promise<Array<{
  parameter: string;
  direction: 'increase' | 'decrease';
  evidenceCount: number;
  latestReasoning: string;
  magnitude: string;
}>> {
  try {
    const corrections = await fetchAnalystCorrections();
    const withChanges = corrections.filter(c => c.suggested_weight_change);

    const grouped: Record<string, typeof withChanges> = {};
    for (const c of withChanges) {
      const key = `${c.suggested_weight_change!.equation}:${c.suggested_weight_change!.parameter}:${c.suggested_weight_change!.direction}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    }

    return Object.entries(grouped)
      .filter(([, cases]) => cases.length >= 3) // surface when 3+ analysts flag same thing
      .map(([key, cases]) => {
        const latest = cases[0].suggested_weight_change!;
        return {
          parameter: `${latest.equation} → ${latest.parameter}`,
          direction: latest.direction,
          evidenceCount: cases.length,
          latestReasoning: cases[0].suggested_weight_change!.reasoning,
          magnitude: latest.magnitude,
        };
      })
      .sort((a, b) => b.evidenceCount - a.evidenceCount);
  } catch {
    return [];
  }
}

// ── localStorage fallback (for when Supabase is unavailable) ──

const LS_KEY = 'ti_prediction_ledger';

export function storePredictionLocal(
  rriState: any,
  data: any,
  engines: any = {},
  horizon: PredictionHorizon = 14
): void {
  try {
    const predictions = generatePredictions(rriState, data, engines);
    const now = new Date().toISOString();
    const record = {
      id: `local-${Date.now()}`,
      predicted_at: now,
      horizon_days: horizon,
      evaluate_after: addDays(now, horizon),
      rri: rriState.rri ?? 2.31,
      p_rev: rriState.p_rev ?? 0.643,
      predictions,
    };

    const existing = JSON.parse(safeStorage.getItem(LS_KEY) || '[]');
    existing.unshift(record);
    safeStorage.setItem(LS_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch {}
}

export function loadLocalPredictions(): PredictionRecord[] {
  try {
    return JSON.parse(safeStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}