/**
 * ingestionEngine.ts
 * Global ingestion singleton and system data seeder.
 */

import { normalizeEvent } from '../utils/eventUtils';
import { logPipelineError } from '../utils/logger';
import { RSS_SOURCES } from '../config/rssSources';
import { pauseRSSPipeline } from '../services/rssService';
import { isAIAvailable } from './aiGuard';

// GLOBAL SINGLETON LOCK
let isFetchingGlobal = false;

function activateSafeMode() {
  console.warn("SYSTEM IN SAFE MODE");
  // stopIngestion() is not defined, will call pauseRSSPipeline
  pauseRSSPipeline();
}

/**
 * Returns true if the ingestion engine is currently busy.
 */
export function isIngestionBusy() {
  return isFetchingGlobal;
}

/**
 * Mock for rule-based processing as a fallback
 */
function runRuleBasedProcessing(data: any) {
    console.log("Running rule-based processing fallback...");
    return [];
}

/**
 * MOCK: Seed initial events for the system.
 */
export function seedInitialEvents(rriData: any, contextData: any) {
  const rri = rriData?.rri ?? 1.5;
  const velocity = rriData?.velocity ?? 0;
  const ugtt_level = contextData?.social?.ugtt_mobilisation_level || 'LOW';
  
  // Static seed to ensure stability
  return [
    {
      title: "RRI Baseline Calibrated",
      source: "SYSTEM_ENGINE",
      content: `National Risk Index stabilized at ${rri.toFixed(2)}`,
      date: new Date().toISOString(),
      governorate: "National",
      severity: 1
    },
    {
      title: "Social Stability Monitor Active",
      source: "SYSTEM_ENGINE",
      content: `Monitoring mobilization levels. Current: ${ugtt_level}`,
      date: new Date().toISOString(),
      governorate: "Tunis",
      severity: 1
    }
  ];
}

/**
 * Core ingestion wrapper for system-triggered batches.
 */
export async function fetchSystemEvents(rriState: any, data: any, ingestData: (raw: any[], source: string) => void) {
  if (isFetchingGlobal) {
    console.warn("[INGESTION BLOCKED] Global hook active");
    return;
  }

  // 1. GLOBAL FAILURE CONTROL
  const total = RSS_SOURCES.length;
  const failing = RSS_SOURCES.filter(f => f.status === "failing" || f.status === "paused").length;
  const failureRate = total > 0 ? (failing / total) : 0;
  
  if (failureRate > 0.6) {
    pauseRSSPipeline();
    return;
  }

  // 2. AI EXECUTION GUARD
  if (!isAIAvailable()) {
    console.warn("AI disabled → fallback mode");
    runRuleBasedProcessing(data);
  }

  console.log("[PIPELINE] Ingestion started: SYSTEM");
  isFetchingGlobal = true;

  try {
    const rawEvents = seedInitialEvents(rriState, data);
    
    // Safety normalize before passing to store
    const validEvents = rawEvents
      .map(e => normalizeEvent(e, "SYSTEM"))
      .filter((e): e is any => e !== null);

    ingestData(validEvents, 'SYSTEM');
    console.log("[PIPELINE] Ingestion completed: SYSTEM");
  } catch (err) {
    logPipelineError(err);
  } finally {
    isFetchingGlobal = false;
  }
}
