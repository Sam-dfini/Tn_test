import { Article, Event } from '../lib/supabase';

export type PipelineStage = 'FEED' | 'NEWS' | 'SIGNALS' | 'EVENTS' | 'PIPELINE' | 'ORCHESTRATOR';

export interface DebugLog {
  id: string;
  stage: PipelineStage;
  timestamp: string;
  data: any;
  status: 'valid' | 'warning' | 'error' | 'dropped';
  message: string;
  latency?: number; // ms since previous stage
}

type DebugListener = (log: DebugLog) => void;

class PipelineDebugService {
  private listeners: Set<DebugListener> = new Set();
  private logs: DebugLog[] = [];
  private maxLogs = 500;

  subscribe(listener: DebugListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  log(stage: PipelineStage, status: DebugLog['status'], message: string, data: any, latency?: number) {
    const log: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stage,
      status,
      message,
      data,
      timestamp: new Date().toISOString(),
      latency
    };

    this.logs = [log, ...this.logs].slice(0, this.maxLogs);
    this.listeners.forEach(l => l(log));

    if (status === 'error' || status === 'dropped') {
      console.warn(`[PipelineDebug][${stage}] ${message}`, data);
    }
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(l => l({} as DebugLog)); // Trigger refresh
  }
}

export const pipelineDebugger = new PipelineDebugService();
