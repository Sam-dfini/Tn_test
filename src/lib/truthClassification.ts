/**
 * Truth Classification System
 * 
 * Every data source and module must declare its truth class:
 * - LIVE: Real-time data from production sources (RSS, API, sensors)
 * - HYBRID: Mix of live and computed/estimated data
 * - SIMULATION: Model-generated or scenario-injected data
 * - PLACEHOLDER: Static demo data (NOT for production)
 * - MOCK: Hardcoded test data (NOT for production)
 */

export type TruthClass = 'LIVE' | 'HYBRID' | 'SIMULATION' | 'PLACEHOLDER' | 'MOCK';

export interface TruthMetadata {
  truthClass: TruthClass;
  source: string;           // e.g. "rss", "rri_engine", "user_input"
  confidence: number;       // 0-1
  provenance?: string;      // where the data came from
  lastVerified?: string;    // ISO timestamp
}

export const TRUTH_COLORS: Record<TruthClass, string> = {
  LIVE: '#10b981',
  HYBRID: '#f59e0b',
  SIMULATION: '#a855f7',
  PLACEHOLDER: '#64748b',
  MOCK: '#ef4444',
};

export const TRUTH_LABELS: Record<TruthClass, string> = {
  LIVE: 'LIVE DATA',
  HYBRID: 'HYBRID',
  SIMULATION: 'SIMULATION',
  PLACEHOLDER: 'PLACEHOLDER',
  MOCK: 'MOCK DATA',
};

/**
 * Check if a module's data is production-ready (not PLACEHOLDER or MOCK)
 */
export function isProductionReady(truthClass: TruthClass): boolean {
  return truthClass === 'LIVE' || truthClass === 'HYBRID' || truthClass === 'SIMULATION';
}
