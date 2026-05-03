/**
 * TunisiaIntel Agent Layer (v2)
 * Transforms signals, clusters, and alerts into context-aware analytical insights.
 */

import { Signals } from './signals';
import { Clusters } from './clusters';
import { SmartAlert } from './smartAlerts';

export interface AgentInsight {
  agent: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  drivers: string[];
  recommendation?: string;
}

/**
 * Generates context-aware analytical insights based on system state and alerts.
 * 
 * @param signals Normalized input signals
 * @param clusters Computed intelligence clusters
 * @param alerts Triggered smart alerts
 * @returns A set of structured analytical insights
 */
export function generateAgentInsights(
  signals: Signals,
  clusters: Clusters,
  alerts: SmartAlert[],
  rpiProfile: any
): { insights: AgentInsight[] } {
  const insights: AgentInsight[] = [];

  const hasAlert = (type: string) => alerts.some(a => a.type === type);

  // 🔴 1. System Risk Analyst
  {
    const relevantInputs = [signals.structuralRisk, signals.systemStress, clusters.systemPressure];
    const confidence = Math.min(1, relevantInputs.reduce((a, b) => a + b, 0) / 3);
    let severity: "low" | "medium" | "high" | "critical" = "low";
    
    if (signals.structuralRisk > 0.75 && signals.systemStress > 0.75) severity = "critical";
    else if (signals.structuralRisk > 0.6 || signals.systemStress > 0.6) severity = "high";
    else if (signals.structuralRisk > 0.4 || signals.systemStress > 0.4) severity = "medium";

    if (hasAlert("system-overload") || hasAlert("critical-convergence")) severity = "critical";

    const drivers = [
      `Structural risk at ${signals.structuralRisk.toFixed(2)}`,
      `System stress at ${signals.systemStress.toFixed(2)}`,
      `System pressure at ${clusters.systemPressure.toFixed(2)}`
    ];
    if (hasAlert("system-overload")) drivers.push("System overload alert triggered");

    insights.push({
      agent: "System Risk Analyst",
      title: severity === "critical" ? "Critical Systemic Risk" : "Systemic Pressure Assessment",
      summary: `System stress is elevated at ${signals.systemStress.toFixed(2)}, combined with structural risk at ${signals.structuralRisk.toFixed(2)}, indicating ${severity === "critical" ? "extreme" : "increasing"} systemic pressure.`,
      severity,
      confidence,
      drivers,
      recommendation: "Immediate intervention required to stabilize core structural pillars and reduce compound stress."
    });
  }

  // 🟠 2. Mobilization Analyst
  {
    const relevantInputs = [signals.mobilization, signals.protestDynamics, signals.informationPressure, clusters.mobilizationPotential];
    const confidence = Math.min(1, relevantInputs.reduce((a, b) => a + b, 0) / 4);
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (signals.mobilization > 0.7 && signals.protestDynamics > 0.7) severity = "critical";
    else if (signals.mobilization > 0.6 || signals.protestDynamics > 0.6) severity = "high";
    else if (signals.mobilization > 0.4 || signals.protestDynamics > 0.4) severity = "medium";

    if (hasAlert("information-surge")) {
      if (severity === "medium") severity = "high";
      else if (severity === "high") severity = "critical";
    }

    const drivers = [
      `Mobilization at ${signals.mobilization.toFixed(2)}`,
      `Protest dynamics at ${signals.protestDynamics.toFixed(2)}`,
      `Information pressure at ${signals.informationPressure.toFixed(2)}`
    ];
    if (hasAlert("information-surge")) drivers.push("Information surge amplifying narratives");

    insights.push({
      agent: "Mobilization Analyst",
      title: "Mobilization & Narrative Analysis",
      summary: `Mobilization potential is ${clusters.mobilizationPotential > 0.6 ? 'high' : 'moderate'} at ${clusters.mobilizationPotential.toFixed(2)}. Protest dynamics (${signals.protestDynamics.toFixed(2)}) are being ${signals.informationPressure > 0.6 ? 'intensified' : 'influenced'} by information pressure at ${signals.informationPressure.toFixed(2)}.`,
      severity,
      confidence,
      drivers,
      recommendation: "Prepare for potential protest escalation and monitor information channels for rapid narrative shifts."
    });
  }

  // 🔵 3. Dynamics Analyst
  {
    const relevantInputs = [signals.acceleration, signals.shockImpact, clusters.dynamicInstability, clusters.volatility];
    const confidence = Math.min(1, relevantInputs.reduce((a, b) => a + b, 0) / 4);
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (signals.acceleration > 0.7 && clusters.volatility > 0.25) severity = "critical";
    else if (signals.acceleration > 0.6 || signals.shockImpact > 0.6) severity = "high";
    else if (signals.acceleration > 0.4 || signals.shockImpact > 0.4) severity = "medium";

    if (hasAlert("acceleration-spike") || hasAlert("shock-acceleration")) {
      severity = "critical";
    }

    const drivers = [
      `Acceleration at ${signals.acceleration.toFixed(2)}`,
      `Shock impact at ${signals.shockImpact.toFixed(2)}`,
      `Volatility at ${clusters.volatility.toFixed(2)}`
    ];
    if (hasAlert("acceleration-spike")) drivers.push("Rapid acceleration spike detected");

    insights.push({
      agent: "Dynamics Analyst",
      title: "System Dynamics & Volatility",
      summary: `The system is experiencing ${severity === "critical" ? "rapid" : "elevated"} change with acceleration at ${signals.acceleration.toFixed(2)} and volatility at ${clusters.volatility.toFixed(2)}. Recent shocks (${signals.shockImpact.toFixed(2)}) are driving instability.`,
      severity,
      confidence,
      drivers,
      recommendation: "Monitor acceleration trends closely and assess the system's capacity to absorb further shocks."
    });
  }

  // 🟣 4. Regime Stability Analyst
  {
    const relevantInputs = [signals.eliteInstability, clusters.regimeFragility];
    const confidence = Math.min(1, relevantInputs.reduce((a, b) => a + b, 0) / 2);
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (signals.eliteInstability > 0.7 && clusters.regimeFragility > 0.7) severity = "critical";
    else if (signals.eliteInstability > 0.6 || clusters.regimeFragility > 0.6) severity = "high";
    else if (signals.eliteInstability > 0.4 || clusters.regimeFragility > 0.4) severity = "medium";

    if (hasAlert("elite-instability") || hasAlert("system-transition")) severity = "critical";

    const drivers = [
      `Elite instability at ${signals.eliteInstability.toFixed(2)}`,
      `Regime fragility at ${clusters.regimeFragility.toFixed(2)}`
    ];
    if (hasAlert("elite-instability")) drivers.push("Elite defection risk alert");

    insights.push({
      agent: "Regime Stability Analyst",
      title: "Regime Stability Assessment",
      summary: `Regime fragility is ${clusters.regimeFragility > 0.7 ? 'critical' : 'elevated'} at ${clusters.regimeFragility.toFixed(2)}. Elite instability at ${signals.eliteInstability.toFixed(2)} suggests a ${severity === "critical" ? "high" : "growing"} risk of institutional collapse.`,
      severity,
      confidence,
      drivers,
      recommendation: "Monitor elite cohesion indicators closely and watch for signs of institutional defection."
    });
  }

  // 🟡 5. Spread & Scenario Analyst
  {
    const relevantInputs = [signals.spatialRisk, signals.historicalAlignment, clusters.spreadContagion];
    const confidence = Math.min(1, relevantInputs.reduce((a, b) => a + b, 0) / 3);
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (signals.spatialRisk > 0.65 && signals.historicalAlignment > 0.75) severity = "critical";
    else if (signals.spatialRisk > 0.6 || signals.historicalAlignment > 0.6) severity = "high";
    else if (signals.spatialRisk > 0.4 || signals.historicalAlignment > 0.4) severity = "medium";

    if (hasAlert("cascade-risk") || hasAlert("historical-match")) {
      if (severity === "medium") severity = "high";
      else if (severity === "high") severity = "critical";
    }

    const drivers = [
      `Spatial risk at ${signals.spatialRisk.toFixed(2)}`,
      `Historical alignment at ${signals.historicalAlignment.toFixed(2)}`,
      `Spread contagion at ${clusters.spreadContagion.toFixed(2)}`
    ];
    if (hasAlert("cascade-risk")) drivers.push("Regional cascade risk detected");

    insights.push({
      agent: "Spread & Scenario Analyst",
      title: "Contagion & Pattern Analysis",
      summary: `Spatial risk is ${signals.spatialRisk > 0.6 ? 'high' : 'moderate'} at ${signals.spatialRisk.toFixed(2)}. Historical alignment at ${signals.historicalAlignment.toFixed(2)} indicates that current dynamics ${signals.historicalAlignment > 0.7 ? 'closely' : 'partially'} replicate past destabilization patterns.`,
      severity,
      confidence,
      drivers,
      recommendation: "Watch for regional spillover and assess cross-border instability triggers."
    });
  }

  // 🧠 6. Cognitive Security Analyst
  {
    const narrativeClosure = clusters.narrativeClosure || 0;
    const confidence = Math.min(1, narrativeClosure + signals.informationPressure * 0.5);
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (narrativeClosure > 0.80) severity = "critical";
    else if (narrativeClosure > 0.60) severity = "high";
    else if (narrativeClosure > 0.40) severity = "medium";

    if (hasAlert("narrative-closure") || hasAlert("cognitive-structural-convergence")) {
      severity = "critical";
    }

    const drivers = [
      `Narrative closure at ${narrativeClosure.toFixed(2)}`,
      `Information pressure at ${signals.informationPressure.toFixed(2)}`,
    ];
    if (hasAlert("cognitive-structural-convergence")) {
      drivers.push("Cognitive-structural convergence detected");
    }

    let summary = '';
    if (narrativeClosure > 0.70) {
      summary = `A weaponized narrative has reached closure (${(narrativeClosure * 100).toFixed(0)}%). ` +
        `The belief system is now self-reinforcing — counter-evidence will be reinterpreted as ` +
        `confirmation. Traditional fact-checking is counterproductive at this stage. ` +
        `Narrative substitution or audience segmentation are the only viable interventions.`;
    } else if (narrativeClosure > 0.40) {
      summary = `Narrative construction is in the amplification phase (${(narrativeClosure * 100).toFixed(0)}%). ` +
        `Source synergy and peer normalization are active. The intervention window is open. ` +
        `Counter-narratives introduced now can still compete for cognitive space.`;
    } else {
      summary = `Cognitive environment is in early-stage monitoring. ` +
        `Information pressure at ${signals.informationPressure.toFixed(2)} — ` +
        `watch for patternicity signals and agency attribution phrases.`;
    }

    insights.push({
      agent: "Cognitive Security Analyst",
      title: severity === "critical"
        ? "Narrative Closure — Cognitive Emergency"
        : severity === "high"
        ? "Weaponized Narrative in Amplification"
        : "Cognitive Environment Assessment",
      summary,
      severity,
      confidence,
      drivers,
      recommendation: narrativeClosure > 0.60
        ? "Deploy narrative substitution strategy. Do not issue direct rebuttals — they amplify the closure."
        : "Monitor seed-phase signals. Prepare counter-narrative infrastructure while intervention is still possible.",
    });
  }

  // 🛡️ 7. Radicalisation Dynamics Analyst
  {
    const rpi = rpiProfile?.rpi || 0;
    const escalation = rpiProfile?.escalationLevel || 0;
    const confidence = Math.min(1, (rpi + (escalation / 5)) / 2);
    let severity: "low" | "medium" | "high" | "critical" = "low";

    if (rpi > 0.7 || escalation > 3) severity = "critical";
    else if (rpi > 0.5 || escalation > 2) severity = "high";
    else if (rpi > 0.3 || escalation > 1) severity = "medium";

    if (hasAlert("radicalisation-spike") || hasAlert("pipeline-escalation")) {
      severity = "critical";
    }

    const drivers = [
      `RPI at ${rpi.toFixed(2)}`,
      `Escalation level at ${escalation}`,
      `Ideological rigidity at ${rpiProfile?.ideologicalRigidity?.toFixed(2) ?? 'N/A'}`
    ];
    if (hasAlert("radicalisation-spike")) drivers.push("Critical radicalisation pressure spike");

    insights.push({
      agent: "Radicalisation Dynamics Analyst",
      title: severity === "critical" ? "Critical Radicalisation Dynamics" : "Radicalisation Pressure Assessment",
      summary: `Radicalisation pressure is ${rpi > 0.5 ? 'high' : 'moderate'} at ${rpi.toFixed(2)}, with an escalation level of ${escalation}. ${rpiProfile?.ideologicalRigidity > 0.7 ? 'Ideological rigidity is extreme, limiting intervention options.' : 'Ideological rigidity is manageable.'}`,
      severity,
      confidence,
      drivers,
      recommendation: escalation > 2 
        ? "Immediate intervention required to disrupt mobilization pathways." 
        : "Monitor radicalisation indicators and prepare counter-radicalisation measures."
    });
  }

  return { insights };
}
