/**
 * TunisiaIntel Smart Alert Engine
 * Detects critical risk patterns, computes deltas, and groups alerts into situations.
 */

import { Signals } from './signals';
import { generateRandomId } from '../utils/idUtils';
import { Clusters } from './clusters';
import { SEIResult } from './seiEngine';
import { AnalysisResult as TemporalAnalysisResult } from './temporalAnalysisService';

export interface SmartAlert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  priority: number;
  message: string;
  context: string;
  value: number;
  previousValue: number;
  delta: number;
  timestamp: number;
}

export interface Situation {
  id: string;
  title: string;
  description: string;
  alerts: SmartAlert[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface SmartAlertResult {
  alerts: SmartAlert[];
  situations: Situation[];
}

const SEVERITY_WEIGHTS = { critical: 3, high: 2, medium: 1, low: 0.5 };

export function generateSmartAlerts(
  currentSignals: Signals,
  previousSignals: Signals,
  currentClusters: Clusters,
  previousClusters: Clusters,
  rpiProfile: any,
  seiResult?: SEIResult | null,
  temporalAnalysis?: Record<string, TemporalAnalysisResult> | null
): SmartAlertResult {
  const alerts: SmartAlert[] = [];
  const timestamp = Date.now();

  const getDelta = (curr: number, prev: number | undefined) => (prev === undefined ? 0 : curr - prev);

  const signalDelta = {
    acceleration: getDelta(currentSignals.acceleration, previousSignals.acceleration),
    eliteInstability: getDelta(currentSignals.eliteInstability, previousSignals.eliteInstability),
    spatialRisk: getDelta(currentSignals.spatialRisk, previousSignals.spatialRisk),
    informationPressure: getDelta(currentSignals.informationPressure, previousSignals.informationPressure),
    historicalAlignment: getDelta(currentSignals.historicalAlignment, previousSignals.historicalAlignment),
    protestDynamics: getDelta(currentSignals.protestDynamics, previousSignals.protestDynamics)
  };

  const clusterDelta = {
    volatility: getDelta(currentClusters.volatility, previousClusters.volatility),
    intelligenceScore: getDelta(currentClusters.intelligenceScore, previousClusters.intelligenceScore)
  };

  const createAlert = (
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    message: string,
    context: string,
    value: number,
    prevValue: number | undefined,
    delta: number
  ): SmartAlert => {
    const priority = Math.min(10, Math.max(0, SEVERITY_WEIGHTS[severity] * 2 + Math.abs(delta) * 3 + value));
    return {
      id: `${type}-${timestamp}-${generateRandomId('alt')}`,
      type,
      severity,
      priority,
      message,
      context,
      value,
      previousValue: prevValue ?? 0,
      delta,
      timestamp
    };
  };

  const pushAlert = (alert: SmartAlert) => {
    if (!alerts.some(a => a.type === alert.type)) {
      alerts.push(alert);
    }
  };

  // 1. Acceleration Spike
  if (currentSignals.acceleration > 0.7 && signalDelta.acceleration > 0.15) {
    pushAlert(createAlert("acceleration-spike", currentSignals.acceleration > 0.85 ? "critical" : "high", "Rapid acceleration in systemic risk detected", `Acceleration increased from ${previousSignals.acceleration?.toFixed(2) ?? 'N/A'} to ${currentSignals.acceleration.toFixed(2)} (+${signalDelta.acceleration.toFixed(2)})`, currentSignals.acceleration, previousSignals.acceleration, signalDelta.acceleration));
  }

  // 2. System Overload
  if (currentSignals.systemStress > 0.8 && currentSignals.structuralRisk > 0.7) {
    pushAlert(createAlert("system-overload", "critical", "System under extreme multi-factor stress", `Stress: ${currentSignals.systemStress.toFixed(2)}, Risk: ${currentSignals.structuralRisk.toFixed(2)}`, Math.max(currentSignals.systemStress, currentSignals.structuralRisk), undefined, 0));
  }

  // 3. Regime Freeze (MII Phase 4)
  if (rpiProfile?.mii?.phase === 'FREEZE') {
    pushAlert(createAlert("regime-freeze", "high", "Regime in state of structural freeze", "MII phase is FREEZE, indicating high loyalist concentration and low adaptability.", 1, 0, 1));
  }

  // 4. Elite Fracture (Defection Cascade)
  if (currentSignals.defectionProbability > 0.65) {
    pushAlert(createAlert("elite-fracture", "critical", "Elite defection cascade risk extreme", `Defection probability: ${(currentSignals.defectionProbability * 100).toFixed(1)}%`, currentSignals.defectionProbability, previousSignals.defectionProbability, signalDelta.eliteInstability));
  }

  // 3. Elite Instability Surge
  if (currentSignals.eliteInstability > 0.7 && signalDelta.eliteInstability > 0.1) {
    pushAlert(createAlert("elite-instability", "high", "High probability of elite defection cascade", `Instability: ${currentSignals.eliteInstability.toFixed(2)}`, currentSignals.eliteInstability, previousSignals.eliteInstability, signalDelta.eliteInstability));
  }

  // 4. Cascade Risk
  if (currentSignals.spatialRisk > 0.65 && signalDelta.spatialRisk > 0.1) {
    pushAlert(createAlert("cascade-risk", "medium", "Regional instability spread likely", `Spatial risk: ${currentSignals.spatialRisk.toFixed(2)}`, currentSignals.spatialRisk, previousSignals.spatialRisk, signalDelta.spatialRisk));
  }

  // 5. Information Surge
  if (currentSignals.informationPressure > 0.75 && signalDelta.informationPressure > 0.1) {
    pushAlert(createAlert("information-surge", "medium", "Information environment amplifying mobilization", `Pressure: ${currentSignals.informationPressure.toFixed(2)}`, currentSignals.informationPressure, previousSignals.informationPressure, signalDelta.informationPressure));
  }

  // 6. Shock Acceleration Link
  if (currentSignals.shockImpact > 0.7 && signalDelta.acceleration > 0.1) {
    pushAlert(createAlert("shock-acceleration", "high", "Significant destabilizing shock detected", `Shock: ${currentSignals.shockImpact.toFixed(2)}, Accel Delta: +${signalDelta.acceleration.toFixed(2)}`, currentSignals.shockImpact, undefined, signalDelta.acceleration));
  }

  // 7. Critical Convergence
  if (currentClusters.systemPressure > 0.7 && currentClusters.mobilizationPotential > 0.7 && currentClusters.regimeFragility > 0.7) {
    pushAlert(createAlert("critical-convergence", "critical", "High-risk convergence: pressure, mobilization, and regime fragility aligned", `Pressure: ${currentClusters.systemPressure.toFixed(2)}, Mobilization: ${currentClusters.mobilizationPotential.toFixed(2)}, Fragility: ${currentClusters.regimeFragility.toFixed(2)}`, currentClusters.intelligenceScore, undefined, 0));
  }

  // 8. Volatility Spike
  if (currentClusters.volatility > 0.25 && clusterDelta.volatility > 0.05) {
    pushAlert(createAlert("volatility-spike", "high", "High systemic imbalance detected across clusters", `Volatility: ${currentClusters.volatility.toFixed(2)}`, currentClusters.volatility, previousClusters.volatility, clusterDelta.volatility));
  }

  // 9. Historical Match
  if (currentSignals.historicalAlignment > 0.8 && signalDelta.historicalAlignment > 0.05) {
    pushAlert(createAlert("historical-match", "high", "Current conditions strongly resemble past patterns", `Alignment: ${currentSignals.historicalAlignment.toFixed(2)}`, currentSignals.historicalAlignment, previousSignals.historicalAlignment, signalDelta.historicalAlignment));
  }

  // 10. System Transition (Meta-Alert)
  if (signalDelta.acceleration > 0.15 && currentClusters.systemPressure > 0.65 && currentClusters.regimeFragility > 0.6) {
    pushAlert(createAlert("system-transition", "critical", "System transitioning toward instability phase", `Accel Delta: ${signalDelta.acceleration.toFixed(2)}, Pressure: ${currentClusters.systemPressure.toFixed(2)}, Fragility: ${currentClusters.regimeFragility.toFixed(2)}`, currentClusters.systemPressure, undefined, signalDelta.acceleration));
  }

  // 11. Narrative Closure Alert
  if (currentClusters.narrativeClosure > 0.65) {
    pushAlert(createAlert(
      "narrative-closure",
      currentClusters.narrativeClosure > 0.80 ? "critical" : "high",
      "Narrative closure detected — unfalsifiable belief system active",
      `Closure score: ${currentClusters.narrativeClosure.toFixed(2)}. ` +
        `Fact-checking is now counterproductive. Narrative substitution required.`,
      currentClusters.narrativeClosure,
      previousClusters.narrativeClosure,
      getDelta(currentClusters.narrativeClosure, previousClusters.narrativeClosure)
    ));
  }

  // 12. Cognitive-Structural Convergence (most dangerous)
  if (
    currentClusters.narrativeClosure > 0.55 &&
    currentClusters.mobilizationPotential > 0.65 &&
    currentClusters.systemPressure > 0.60
  ) {
    pushAlert(createAlert(
      "cognitive-structural-convergence",
      "critical",
      "COGNITIVE-STRUCTURAL CONVERGENCE: Engineered narrative + structural crisis aligned",
      `Structural crisis (${currentClusters.systemPressure.toFixed(2)}) + ` +
        `mobilization potential (${currentClusters.mobilizationPotential.toFixed(2)}) + ` +
        `narrative closure (${currentClusters.narrativeClosure.toFixed(2)}) converging. ` +
        `This combination historically precedes organized uprising within 14-30 days.`,
      currentClusters.intelligenceScore,
      previousClusters.intelligenceScore,
      0
    ));
  }

  // 13. Sustained Anxiety Spike (from narrativeClosure delta)
  const narrativeDelta = getDelta(
    currentClusters.narrativeClosure,
    previousClusters.narrativeClosure
  );
  if (narrativeDelta > 0.15) {
    pushAlert(createAlert(
      "anxiety-surge",
      "high",
      "Rapid narrative construction acceleration detected",
      `Narrative closure increased +${narrativeDelta.toFixed(2)} in this cycle. ` +
        `Audience is being rapidly prepared. Seed → Amplification phase transition likely.`,
      currentClusters.narrativeClosure,
      previousClusters.narrativeClosure,
      narrativeDelta
    ));
  }

  // --- NEW RADICALISATION ALERTS ---
  if (rpiProfile?.rpi > 0.7) {
    pushAlert(createAlert("radicalisation-spike", "critical", "Critical Radicalisation Pressure detected", `RPI: ${rpiProfile.rpi.toFixed(2)}`, rpiProfile.rpi, 0, 0));
  }
  if (rpiProfile?.ideologicalRigidity > 0.8) {
    pushAlert(createAlert("ideological-rigidity", "high", "Extreme Ideological Rigidity", `Rigidity: ${rpiProfile.ideologicalRigidity.toFixed(2)}`, rpiProfile.ideologicalRigidity, 0, 0));
  }
  if (rpiProfile?.mobilizationPotential > 0.75) {
    pushAlert(createAlert("mobilization-threshold", "high", "Mobilization threshold exceeded", `Potential: ${rpiProfile.mobilizationPotential.toFixed(2)}`, rpiProfile.mobilizationPotential, 0, 0));
  }
  if (rpiProfile?.escalationLevel > 3) {
    pushAlert(createAlert("pipeline-escalation", "critical", "Pipeline escalation to critical phase", `Escalation: ${rpiProfile.escalationLevel}`, rpiProfile.escalationLevel, 0, 0));
  }

  // ── SEI ALERTS ──────────────────────────────────────────────

  if (seiResult) {
    const sei = seiResult.maxSEI;
    const prevSei = 0; // track separately if needed

    // 17. Food anger window (compound trigger)
    if (seiResult.angerWindowAlert) {
      pushAlert(createAlert(
        "food-anger-window",
        "critical",
        "FOOD ANGER WINDOW: Compound shortage + inflation trigger active",
        seiResult.angerWindowMessage,
        sei, prevSei, sei - prevSei
      ));
    }

    // 18. Shortage phase transition (Phase 4+ = critical)
    const phase4Plus = seiResult.commodities.filter(c => c.phase >= 4);
    if (phase4Plus.length > 0) {
      const top = phase4Plus[0];
      pushAlert(createAlert(
        "shortage-intervention",
        top.phase >= 5 ? "critical" : "high",
        `${top.type.toUpperCase()} shortage: Phase ${top.phase} — ${
          top.phase >= 5 ? 'Distortion' : 'Intervention'
        }`,
        `SEI ${top.sei.toFixed(2)}. ` +
          (top.phase >= 5
            ? 'Black market active. State intervention failed. Anger ignition window open.'
            : 'Price controls/confiscations detected. Intervention often worsens shortage.') +
          (top.timeToAngerDays
            ? ` Estimated anger ignition: ${top.timeToAngerDays}-${top.timeToAngerDays + 5} days.`
            : ' Anger signals already detected.'),
        top.sei, 0, 0
      ));
    }

    // 19. Black market emergence
    if (seiResult.commodities.some(c => c.blackMarketDetected)) {
      const bm = seiResult.commodities.find(c => c.blackMarketDetected)!;
      pushAlert(createAlert(
        "black-market-emergence",
        "high",
        `Black market detected: ${bm.type.toUpperCase()} informal distribution active`,
        `Formal supply chain has failed for ${bm.type}. ` +
          'Informal market absorbing commodity. Trust in state supply collapsing. ' +
          'Anger ignition within 5-10 days if supply not normalized.',
        bm.sei, 0, 0
      ));
    }
  }

  // ── TEMPORAL ANOMALY ALERTS ─────────────────────────────────
  if (temporalAnalysis) {
    Object.entries(temporalAnalysis).forEach(([varName, result]) => {
      if (result.isAnomalous) {
        pushAlert(createAlert(
          `temporal-anomaly-${varName}`,
          "high",
          `Temporal Anomaly: ${varName.toUpperCase()} deviating from predictable cycles`,
          `Current value ${result.residual > 0 ? 'exceeds' : 'falls below'} expected ${result.primaryPatternType === 'WEEKLY' ? 'weekly' : 'seasonal'} pattern. ` +
          `Expected: ${result.expectedValue.toFixed(2)}, Actual: ${(result.expectedValue + result.residual).toFixed(2)}. ` +
          `This suggests an anomalous event rather than a routine fluctuation.`,
          Math.abs(result.residual),
          0,
          result.residual
        ));
      }
    });
  }

  alerts.sort((a, b) => b.priority - a.priority);

  const situations: Situation[] = [];

  // Grouping by causal chains
  const shockRelated = alerts.filter(a => ["shock-acceleration", "acceleration-spike"].includes(a.type));
  const instabilityRelated = alerts.filter(a => ["elite-instability", "critical-convergence", "system-transition"].includes(a.type));
  const spreadRelated = alerts.filter(a => ["cascade-risk", "information-surge"].includes(a.type));
  const radicalisationRelated = alerts.filter(a => ["radicalisation-spike", "ideological-rigidity", "mobilization-threshold", "pipeline-escalation"].includes(a.type));

  // Situation 1: System Destabilization
  if (shockRelated.length > 0 && currentClusters.systemPressure > 0.7 && currentClusters.volatility > 0.2) {
    situations.push({ id: "sit-destab", title: "System Destabilization", description: "High acceleration combined with systemic pressure and volatility.", alerts: [...shockRelated, ...alerts.filter(a => a.type === "volatility-spike")], severity: "critical" });
  }

  // Situation 2: Regional Spread Risk
  if (spreadRelated.length > 0 && signalDelta.protestDynamics > 0) {
    situations.push({ id: "sit-spread", title: "Regional Spread Risk", description: "Cascade risk forming with rising protest dynamics.", alerts: spreadRelated, severity: "high" });
  }

  // Situation 3: Elite Collapse Scenario
  if (instabilityRelated.length > 0 && currentClusters.regimeFragility > 0.7) {
    situations.push({ id: "sit-elite", title: "Elite Collapse Scenario", description: "Elite instability surge within a fragile regime context.", alerts: instabilityRelated, severity: "critical" });
  }

  // Situation 4: Pre-Revolution State
  if (currentClusters.mobilizationPotential > 0.7 && currentClusters.regimeFragility > 0.7 && currentSignals.historicalAlignment > 0.75) {
    situations.push({ id: "sit-pre-rev", title: "Pre-Revolution State", description: "High mobilization and fragility aligned with high historical pattern similarity.", alerts: alerts.filter(a => a.type === "historical-match"), severity: "critical" });
  }

  // Situation 5: Cognitive Warfare
  const cognitiveRelated = alerts.filter(a =>
    ['narrative-closure', 'cognitive-structural-convergence', 'anxiety-surge'].includes(a.type)
  );
  if (cognitiveRelated.length > 0) {
    situations.push({
      id: 'sit-cognitive',
      title: 'Cognitive Warfare Active',
      description: 'Engineered narrative system detected at closure or near-closure phase. ' +
        'Traditional fact-checking ineffective. Structural and cognitive pressures converging.',
      alerts: cognitiveRelated,
      severity: cognitiveRelated.some(a => a.severity === 'critical') ? 'critical' : 'high',
    });
  }

  // Situation 6: Radicalisation Dynamics
  if (radicalisationRelated.length > 0) {
    situations.push({
      id: 'sit-radicalisation',
      title: 'Radicalisation Dynamics Detected',
      description: 'Systemic radicalisation dynamics detected, including ideological rigidity and mobilization potential.',
      alerts: radicalisationRelated,
      severity: radicalisationRelated.some(a => a.severity === 'critical') ? 'critical' : 'high',
    });
  }

  // Situation 8: Food Security Crisis
  const foodRelated = alerts.filter(a =>
    ['food-anger-window', 'shortage-intervention',
     'black-market-emergence'].includes(a.type)
  );
  if (foodRelated.length > 0) {
    situations.push({
      id: 'sit-food-crisis',
      title: 'Food Security Crisis',
      description:
        'Commodity shortage escalation detected at Phase 4+. ' +
        'State intervention active. ' +
        (seiResult?.angerWindowAlert
          ? 'Compound trigger: food + inflation + secondary stress = anger ignition window.'
          : 'Monitor for compound trigger: inflation + secondary utility stress.'),
      alerts: foodRelated,
      severity: seiResult?.angerWindowAlert ? 'critical' : 'high',
    });
  }

  // Situation 9: Temporal Anomaly Detected
  const temporalRelated = alerts.filter(a => a.type.startsWith('temporal-anomaly-'));
  if (temporalRelated.length > 0) {
    situations.push({
      id: 'sit-temporal',
      title: 'Temporal Anomaly Detected',
      description: 'Systemic variables are deviating from their historical weekly or seasonal cycles. ' +
        'This suggests the presence of non-routine, anomalous drivers affecting the risk model.',
      alerts: temporalRelated,
      severity: 'high',
    });
  }

  return { alerts, situations };
}
