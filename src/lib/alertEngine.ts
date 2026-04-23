import { logger } from '../utils/logger.js';

export type AlertType = "CRITICAL" | "WARNING" | "INFO";

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: number;
}

export interface PipelineMetrics {
  feedCount: number;
  newsCount: number;
  signalCount: number;
  eventCount: number;
  ingestionRate: number;
  errorRate: number;
  duplicateRate: number;
  lastIngestionTime: number;
  latencyMs: number;
}

export class AlertEngine {
  private static instance: AlertEngine;
  private activeAlerts: Alert[] = [];

  private constructor() {}

  static getInstance() {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine();
    }
    return AlertEngine.instance;
  }

  evaluate(metrics: PipelineMetrics) {
    const newAlerts: Omit<Alert, 'id'>[] = [];
    const now = Date.now();

    // Rule: Ingestion Failure
    if (metrics.feedCount > 0 && metrics.newsCount === 0) {
      newAlerts.push({ type: "CRITICAL", message: "INGESTION FAILURE: Feeds received but no news created", timestamp: now });
    }

    // Rule: High Error Rate
    if (metrics.errorRate > 0.3) {
      newAlerts.push({ type: "CRITICAL", message: `HIGH ERROR RATE: ${Math.round(metrics.errorRate * 100)}%`, timestamp: now });
    }

    // Rule: Pipeline Stalled
    if (metrics.lastIngestionTime > 0 && (now - metrics.lastIngestionTime) > 120000) { // 2min
      newAlerts.push({ type: "WARNING", message: "PIPELINE STALLED: No data ingested in last 2 minutes", timestamp: now });
    }

    // Rule: Duplication Spike
    if (metrics.duplicateRate > 0.5) {
      newAlerts.push({ type: "WARNING", message: `DUPLICATION SPIKE: ${Math.round(metrics.duplicateRate * 100)}% duplicates detected`, timestamp: now });
    }

    // Rule: Event Aggregation Failure
    if (metrics.eventCount === 0 && metrics.signalCount > 0) {
      newAlerts.push({ type: "CRITICAL", message: "EVENT AGGREGATION FAILURE: Signals detected but no events generated", timestamp: now });
    }

    // Process new alerts
    newAlerts.forEach(a => this.triggerAlert(a));
  }

  private triggerAlert(alert: Omit<Alert, 'id'>) {
    const id = `${alert.type}_${alert.timestamp}_${alert.message.slice(0, 10)}`;
    
    // Avoid spamming the same alert message if it's already active and fresh
    const isDuplicate = this.activeAlerts.some(a => a.message === alert.message && (Date.now() - a.timestamp) < 60000);
    if (isDuplicate) return;

    const fullAlert: Alert = { ...alert, id };
    this.activeAlerts.unshift(fullAlert);
    
    // Log it
    logger.log({
      stage: "UI",
      level: alert.type === "CRITICAL" ? "ERROR" : "WARN",
      message: `[ALERT] ${alert.message}`,
    });

    // Limit active alerts
    if (this.activeAlerts.length > 50) this.activeAlerts.pop();

    // Trigger UI notification (custom event)
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('pipeline_alert', { detail: fullAlert });
      window.dispatchEvent(event);
    }
  }

  getActiveAlerts() {
    return this.activeAlerts;
  }

  clearAlerts() {
    this.activeAlerts = [];
  }
}

export const alertEngine = AlertEngine.getInstance();
