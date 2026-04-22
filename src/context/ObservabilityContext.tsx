import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PipelineMetrics, alertEngine, Alert } from '../lib/alertEngine.js';
import { logger, LogEvent } from '../utils/logger.js';

export interface MetricPoint {
  timestamp: number;
  errorRate: number;
  latencyMs: number;
  ingestionRate: number;
  eventCount: number;
}

interface ObservabilityContextType {
  metrics: PipelineMetrics;
  history: MetricPoint[];
  logs: LogEvent[];
  alerts: Alert[];
  healthScore: number;
  updateMetrics: (newMetrics: Partial<PipelineMetrics>) => void;
  trackTrace: (traceId: string, stage: any, message: string, payload?: any) => void;
}

const ObservabilityContext = createContext<ObservabilityContextType | undefined>(undefined);

const INITIAL_METRICS: PipelineMetrics = {
  feedCount: 0,
  newsCount: 0,
  signalCount: 0,
  eventCount: 0,
  ingestionRate: 0,
  errorRate: 0,
  duplicateRate: 0,
  lastIngestionTime: 0,
  latencyMs: 0,
};
export const ObservabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PipelineMetrics>(INITIAL_METRICS);
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Health Score Calculation
  const healthScore = Math.max(0, Math.min(100, 
    100 
    - (metrics.errorRate * 50) 
    - (metrics.latencyMs / 100) 
    - (metrics.duplicateRate * 30)
  ));

  const updateMetrics = useCallback((newMetrics: Partial<PipelineMetrics>) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics };
      alertEngine.evaluate(updated);
      
      // Add to history for charts
      const now = Date.now();
      setHistory(h => {
        const newPoint = {
          timestamp: now,
          errorRate: updated.errorRate,
          latencyMs: updated.latencyMs,
          ingestionRate: updated.ingestionRate,
          eventCount: updated.eventCount
        };
        // Keep last 30 points
        return [...h, newPoint].slice(-30);
      });

      return updated;
    });
  }, []);

  const trackTrace = useCallback((traceId: string, stage: any, message: string, payload?: any) => {
    logger.log({
      stage,
      level: "INFO",
      message: `[TRACE:${traceId}] ${message}`,
      payload,
      traceId
    });
  }, []);

  useEffect(() => {
    // Listen for events from the logger and alert engine (client-side only)
    if (typeof window === 'undefined') return;

    const handleLog = (e: any) => {
      setLogs(prev => [e.detail, ...prev].slice(0, 100));
    };

    const handleAlert = (e: any) => {
      setAlerts(prev => [e.detail, ...prev].slice(0, 50));
    };

    window.addEventListener('pipeline_log', handleLog);
    window.addEventListener('pipeline_alert', handleAlert);
    window.addEventListener('pipeline_metric_update', (e: any) => updateMetrics(e.detail));

    return () => {
      window.removeEventListener('pipeline_log', handleLog);
      window.removeEventListener('pipeline_alert', handleAlert);
      window.removeEventListener('pipeline_metric_update', (e: any) => updateMetrics(e.detail));
    };
  }, []);

  return (
    <ObservabilityContext.Provider value={{ 
      metrics, 
      history,
      logs, 
      alerts, 
      healthScore, 
      updateMetrics,
      trackTrace
    }}>
      {children}
    </ObservabilityContext.Provider>
  );
};

export const useObservability = () => {
  const context = useContext(ObservabilityContext);
  if (!context) throw new Error('useObservability must be used within an ObservabilityProvider');
  return context;
};
