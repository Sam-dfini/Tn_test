/**
 * TunisiaIntel Alert Engine
 * Detects critical risk patterns and generates actionable intelligence alerts.
 */

import { Signals } from './clusters';
import { Clusters } from './clusters';

export interface Alert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

/**
 * Evaluates signals and clusters to generate actionable intelligence alerts.
 * 
 * @param signals Normalized input signals
 * @param clusters Computed intelligence clusters
 * @returns Array of triggered alerts
 */
export function generateAlerts(signals: Signals, clusters: Clusters): Alert[] {
  const alerts: Alert[] = [];
  const timestamp = Date.now();

  const createAlert = (
    type: string,
    severity: "low" | "medium" | "high" | "critical",
    message: string,
    value: number,
    threshold: number
  ): Alert => ({
    id: `${type}-${timestamp}`,
    type,
    severity,
    message,
    value,
    threshold,
    timestamp
  });

  // 1. Acceleration Spike
  if (signals.acceleration > 0.7) {
    alerts.push(createAlert(
      "acceleration-spike",
      signals.acceleration > 0.85 ? "critical" : "high",
      "Rapid acceleration in systemic risk detected",
      signals.acceleration,
      0.7
    ));
  }

  // 2. System Overload
  if (signals.systemStress > 0.8 && signals.structuralRisk > 0.7) {
    alerts.push(createAlert(
      "system-overload",
      "critical",
      "System under extreme multi-factor stress",
      Math.max(signals.systemStress, signals.structuralRisk),
      0.7
    ));
  }

  // 3. Shock Event
  if (signals.shockImpact > 0.75) {
    alerts.push(createAlert(
      "shock-event",
      "high",
      "Significant destabilizing shock detected",
      signals.shockImpact,
      0.75
    ));
  }

  // 4. Elite Breakdown Risk
  if (signals.eliteInstability > 0.7) {
    alerts.push(createAlert(
      "elite-breakdown",
      "high",
      "High probability of elite defection cascade",
      signals.eliteInstability,
      0.7
    ));
  }

  // 5. Cascade Risk
  if (signals.spatialRisk > 0.65) {
    alerts.push(createAlert(
      "cascade-risk",
      "medium",
      "Regional instability spread likely",
      signals.spatialRisk,
      0.65
    ));
  }

  // 6. Information Surge
  if (signals.informationPressure > 0.75) {
    alerts.push(createAlert(
      "information-surge",
      "medium",
      "Information environment amplifying mobilization",
      signals.informationPressure,
      0.75
    ));
  }

  // 7. Critical Convergence
  if (clusters.systemPressure > 0.7 && clusters.mobilizationPotential > 0.7 && clusters.regimeFragility > 0.7) {
    alerts.push(createAlert(
      "critical-convergence",
      "critical",
      "High-risk convergence: pressure, mobilization, and regime fragility aligned",
      Math.min(clusters.systemPressure, clusters.mobilizationPotential, clusters.regimeFragility),
      0.7
    ));
  }

  // 8. Volatility Spike
  if (clusters.volatility > 0.25) {
    alerts.push(createAlert(
      "volatility-spike",
      "high",
      "High systemic imbalance detected across clusters",
      clusters.volatility,
      0.25
    ));
  }

  // 9. Historical Match
  if (signals.historicalAlignment > 0.8) {
    alerts.push(createAlert(
      "historical-match",
      "high",
      "Current conditions strongly resemble past революция patterns",
      signals.historicalAlignment,
      0.8
    ));
  }

  // 10. Intelligence Score Alert
  if (clusters.intelligenceScore > 0.75) {
    alerts.push(createAlert(
      "intelligence-score",
      clusters.intelligenceScore > 0.9 ? "critical" : "high",
      "Overall system risk reaching critical levels",
      clusters.intelligenceScore,
      0.75
    ));
  }

  return alerts;
}
