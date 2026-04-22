/**
 * ingestionEngine.ts
 * Global ingestion singleton and system data seeder.
 */

import { normalizeEvent } from '../utils/eventUtils';
import { logPipelineError } from '../utils/logger';

// GLOBAL SINGLETON LOCK
let isFetchingGlobal = false;

/**
 * Returns true if the ingestion engine is currently busy.
 */
export function isIngestionBusy() {
  return isFetchingGlobal;
}

/**
 * MOCK: Seed initial events for the system.
 */
export function seedInitialEvents(rriState: any, data: any) {
  // Static seed to ensure stability
  return [
    {
      title: "RRI Baseline Calibrated",
      source: "SYSTEM_ENGINE",
      content: `National Risk Index stabilized at ${rriState.rri.toFixed(2)}`,
      date: new Date().toISOString(),
      governorate: "National",
      severity: 1
    },
    {
      title: "Social Stability Monitor Active",
      source: "SYSTEM_ENGINE",
      content: `Monitoring mobilization levels. Current: ${data.social?.ugtt_mobilisation_level || 'LOW'}`,
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
