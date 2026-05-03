/**
 * satelliteIngestion.ts
 * Main orchestrator for TunisiaIntel satellite data pipeline.
 *
 * Fetches NDVI, rainfall, and soil moisture for all 24 governorates,
 * assembles AgriInputBundles, calls processAllGovernorates(), and
 * emits results via the pipeline (Supabase upsert or socket.io event).
 *
 * Call this from server.ts on a schedule:
 *   NDVI + soil moisture: every 3–7 days
 *   Rainfall anomaly:     daily
 *
 * Usage:
 *   import { runSatelliteIngestion } from './src/pipeline/satellite/satelliteIngestion.js';
 *   await runSatelliteIngestion(supabase, io);
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SatelliteReading } from './satelliteConfig.ts';
import {
  GOVERNORATE_COORDS,
  getCached, setCache,
  CACHE_TTL_NDVI_MS, CACHE_TTL_RAIN_MS,
} from './satelliteConfig.ts';
import { getNDVIBatch } from './ndviProcessor.ts';
import { getRainfallBatch } from './rainfallProcessor.ts';
import { getSoilMoistureBatch } from './soilMoistureProcessor.ts';

// ── Import AgriIntelEngine (pure computation layer) ───────────────────────
import {
  processAllGovernorates,
} from '../../services/AgriIntelEngine.ts';
import type {
  AgriInputBundle,
  AgriNationalSummary,
} from '../../services/AgriIntelEngine.ts';
import { safeUpsert } from '../../utils/safeDatabase.ts';

// ── Result type emitted to pipeline ──────────────────────────────────────

export interface IngestionResult {
  success:        boolean;
  govs_processed: number;
  critical_govs:  string[];
  high_risk_govs: string[];
  national_wheat_stress: number;
  national_olive_health: number;
  aggregate_shock:       number;
  elapsed_ms:            number;
  timestamp:             string;
  errors:                string[];
}

// ── Cache key helpers ─────────────────────────────────────────────────────

const ndviKey  = (govId: string) => `ndvi:${govId}`;
const rainKey  = (govId: string) => `rain:${govId}`;
const soilKey  = (govId: string) => `soil:${govId}`;

// ── Fallback values (if all fetches fail) ─────────────────────────────────
// Tunisia 2026 baseline conditions (moderate drought year)

const FALLBACK: Record<string, { ndvi: number; rain: number; soil: number }> = {
  tunis:      { ndvi: 0.42, rain:  0.05, soil: 0.38 },
  nabeul:     { ndvi: 0.50, rain:  0.08, soil: 0.40 },
  bizerte:    { ndvi: 0.52, rain:  0.12, soil: 0.44 },
  beja:       { ndvi: 0.55, rain:  0.15, soil: 0.48 },
  jendouba:   { ndvi: 0.48, rain:  0.10, soil: 0.42 },
  kef:        { ndvi: 0.44, rain:  0.05, soil: 0.38 },
  siliana:    { ndvi: 0.41, rain:  0.02, soil: 0.35 },
  kairouan:   { ndvi: 0.36, rain: -0.12, soil: 0.28 },
  kasserine:  { ndvi: 0.32, rain: -0.20, soil: 0.24 },
  sidi_bouzid:{ ndvi: 0.31, rain: -0.22, soil: 0.22 },
  sfax:       { ndvi: 0.40, rain: -0.05, soil: 0.30 },
  sousse:     { ndvi: 0.43, rain:  0.00, soil: 0.35 },
  monastir:   { ndvi: 0.42, rain: -0.02, soil: 0.33 },
  mahdia:     { ndvi: 0.44, rain:  0.02, soil: 0.36 },
  zaghouan:   { ndvi: 0.46, rain:  0.04, soil: 0.38 },
  gabes:      { ndvi: 0.28, rain: -0.30, soil: 0.18 },
  medenine:   { ndvi: 0.22, rain: -0.40, soil: 0.14 },
  tataouine:  { ndvi: 0.15, rain: -0.55, soil: 0.08 },
  gafsa:      { ndvi: 0.24, rain: -0.35, soil: 0.15 },
  tozeur:     { ndvi: 0.12, rain: -0.70, soil: 0.05 },
  kebili:     { ndvi: 0.11, rain: -0.75, soil: 0.04 },
  ariana:     { ndvi: 0.40, rain:  0.04, soil: 0.36 },
  ben_arous:  { ndvi: 0.38, rain:  0.03, soil: 0.35 },
  manouba:    { ndvi: 0.44, rain:  0.06, soil: 0.39 },
};

// ── Main ingestion function ───────────────────────────────────────────────

export async function runSatelliteIngestion(
  supabase?: SupabaseClient,
  io?: any,       // socket.io Server instance (optional)
  options?: {
    ndvi_days?:    number;
    rain_days?:    number;
    concurrency?:  number;
    force_refresh?: boolean;
  }
): Promise<IngestionResult> {
  const t0 = Date.now();
  const errors: string[] = [];
  const opts = {
    ndvi_days:    options?.ndvi_days    ?? 7,
    rain_days:    options?.rain_days    ?? 30,
    concurrency:  options?.concurrency  ?? 4,
    force_refresh:options?.force_refresh ?? false,
  };

  console.log(`[AgriIngestion] Starting for ${GOVERNORATE_COORDS.length} governorates…`);
  
  // ── 0. Check Supabase for fresh data (avoid 429s) ────────────────────────
  if (supabase && !opts.force_refresh) {
    const { data: latestRows, error } = await supabase
      .from('agri_readings')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(24);
    
    if (!error && latestRows && latestRows.length >= 24) {
      const mostRecent = new Date(latestRows[0].fetched_at).getTime();
      const ageMs = Date.now() - mostRecent;
      const FRESH_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours
      
      if (ageMs < FRESH_THRESHOLD) {
        console.log(`[AgriIngestion] Fresh data found in Supabase (age: ${(ageMs / 1000 / 60).toFixed(1)}m). Skipping API fetch.`);
        // Re-assemble summary from DB rows to emit via socket
        const mockBundles: Record<string, Partial<AgriInputBundle>> = {};
        latestRows.forEach(r => {
          mockBundles[r.governorate] = {
            ndvi: { value: r.ndvi ?? 0.35, timestamp: Date.now(), governorate: r.governorate, quality: 'INTERPOLATED' },
            rainfall_anomaly: { value: r.rainfall_anomaly ?? 0, timestamp: Date.now(), governorate: r.governorate, quality: 'INTERPOLATED' },
            soil_moisture: { value: r.soil_moisture ?? 0.25, timestamp: Date.now(), governorate: r.governorate, quality: 'INTERPOLATED' },
          };
        });
        const cachedSummary = processAllGovernorates(mockBundles);
        if (io) io.emit('intel_event', { type: 'agri_update', payload: cachedSummary });
        return {
          success: true,
          govs_processed: latestRows.length,
          critical_govs: cachedSummary.critical_govs,
          high_risk_govs: cachedSummary.high_risk_govs,
          national_wheat_stress: cachedSummary.national_wheat_stress,
          national_olive_health: cachedSummary.national_olive_health,
          aggregate_shock: cachedSummary.aggregate_shock,
          elapsed_ms: Date.now() - t0,
          timestamp: new Date().toISOString(),
          errors: [],
        };
      }
    }
  }

  // ── 1. Fetch NDVI for all govs (with cache and batching) ────────────────
  const ndviMap: Record<string, number> = {};
  const govsToFetchNDVI = GOVERNORATE_COORDS.filter(gov => {
    if (!opts.force_refresh) {
      const cached = getCached(ndviKey(gov.id));
      if (cached) { ndviMap[gov.id] = cached.ndvi; return false; }
    }
    return true;
  });

  if (govsToFetchNDVI.length > 0) {
    const ndviResults = await getNDVIBatch(govsToFetchNDVI, opts.ndvi_days);
    for (const govId of Object.keys(ndviResults)) {
      ndviMap[govId] = ndviResults[govId].ndvi;
    }
  }

  // Fallback for NDVI missing govs
  for (const gov of GOVERNORATE_COORDS) {
    if (ndviMap[gov.id] === undefined) {
      ndviMap[gov.id] = FALLBACK[gov.id]?.ndvi ?? 0.35;
      errors.push(`NDVI fallback used for ${gov.id}`);
    }
  }

  // ── 2. Fetch rainfall anomaly (batch) ─────────────────────────────────
  const rainfallMap: Record<string, number> = {};
  const rainResults = await getRainfallBatch(GOVERNORATE_COORDS);
  for (const r of rainResults) {
    rainfallMap[r.governorate] = r.anomaly;
  }

  // Fallback for missing govs
  for (const gov of GOVERNORATE_COORDS) {
    if (rainfallMap[gov.id] === undefined) {
      rainfallMap[gov.id] = FALLBACK[gov.id]?.rain ?? -0.10;
      errors.push(`Rainfall fallback used for ${gov.id}`);
    }
  }

  // ── 3. Fetch soil moisture (batch) ────────────────────────────────────
  const soilMap: Record<string, number> = {};
  const soilResults = await getSoilMoistureBatch(GOVERNORATE_COORDS, opts.ndvi_days);
  for (const r of soilResults) {
    soilMap[r.governorate] = r.combined;
  }

  for (const gov of GOVERNORATE_COORDS) {
    if (soilMap[gov.id] === undefined) {
      soilMap[gov.id] = FALLBACK[gov.id]?.soil ?? 0.25;
      errors.push(`Soil moisture fallback used for ${gov.id}`);
    }
  }

  // ── 4. Assemble AgriInputBundles ──────────────────────────────────────
  const now = Date.now();
  const inputBundles: Record<string, Partial<AgriInputBundle>> = {};

  for (const gov of GOVERNORATE_COORDS) {
    inputBundles[gov.id] = {
      ndvi: {
        value:       ndviMap[gov.id] ?? 0.35,
        timestamp:   now,
        governorate: gov.id,
        quality:     'MEASURED',
      },
      rainfall_anomaly: {
        value:       rainfallMap[gov.id] ?? 0.0,
        timestamp:   now,
        governorate: gov.id,
        quality:     'MEASURED',
      },
      soil_moisture: {
        value:       soilMap[gov.id] ?? 0.25,
        timestamp:   now,
        governorate: gov.id,
        quality:     'MEASURED',
      },
    };
  }

  // ── 5. Run AgriIntelEngine (pure computation) ─────────────────────────
  const summary: AgriNationalSummary = processAllGovernorates(inputBundles);

  console.log(`[AgriIngestion] Complete: wheat_stress=${summary.national_wheat_stress.toFixed(3)}, critical_govs=${summary.critical_govs.join(',') || 'none'}`);

  // ── 6. Persist to Supabase ────────────────────────────────────────────
  if (supabase) {
    const rows = summary.results.map(r => ({
      governorate:     r.governorate,
      ndvi:            ndviMap[r.governorate] ?? null,
      rainfall_anomaly:rainfallMap[r.governorate] ?? null,
      soil_moisture:   soilMap[r.governorate] ?? null,
      wheat_stress:    r.wheat_stress_index,
      olive_health:    r.olive_health_index,
      rural_stability: r.rural_stability_score,
      risk_flag:       r.risk_flag,
      rri_shock:       r.rri_shock_magnitude,
      data_quality:    r.data_quality,
      source:          'open-meteo-era5',
      fetched_at:      new Date().toISOString(),
    }));

    const { success, error } = await safeUpsert(
      supabase,
      'agri_readings',
      rows,
      'governorate,fetched_at'
    );

    if (!success) {
      errors.push(`Supabase upsert failed: ${error?.message || 'Unknown error'}`);
    } else {
      console.log(`[AgriIngestion] Successfully persisted ${rows.length} rows (self-healing enabled)`);
    }
  }

  // ── 7. Emit via socket.io (for real-time dashboard update) ────────────
  if (io) {
    io.emit('intel_event', {
      type: 'agri_update',
      payload: {
        national_wheat_stress: summary.national_wheat_stress,
        national_olive_health: summary.national_olive_health,
        national_stability:    summary.national_stability,
        critical_govs:         summary.critical_govs,
        high_risk_govs:        summary.high_risk_govs,
        aggregate_shock:       summary.aggregate_shock,
        rri_overrides:         summary.rri_overrides,
        results:               summary.results,
        generated_at:          summary.generated_at,
      },
    });
    console.log('[AgriIngestion] Socket.io event emitted: agri_update');
  }

  // ── 8. Emit pipeline field updates (for RRI recalculation) ───────────
  // These match the format used by server.ts existing emit patterns
  if (io) {
    for (const [field, value] of Object.entries(summary.rri_overrides)) {
      if (!field.startsWith('_')) {
        io.emit('intel_event', {
          type:    'pipeline_field_update',
          payload: { field, value, source: 'AgriIntel Satellite Pipeline' },
        });
      }
    }
  }

  const elapsed_ms = Date.now() - t0;
  console.log(`[AgriIngestion] Total elapsed: ${elapsed_ms}ms`);

  return {
    success:               errors.length < GOVERNORATE_COORDS.length * 3,
    govs_processed:        summary.results.length,
    critical_govs:         summary.critical_govs,
    high_risk_govs:        summary.high_risk_govs,
    national_wheat_stress: summary.national_wheat_stress,
    national_olive_health: summary.national_olive_health,
    aggregate_shock:       summary.aggregate_shock,
    elapsed_ms,
    timestamp:             new Date().toISOString(),
    errors,
  };
}

// ── Convenience: get latest readings from Supabase ────────────────────────

export async function getLatestAgriReadings(
  supabase: SupabaseClient
): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('agri_readings')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(24);  // latest reading per gov

  if (error || !data) return {};

  return Object.fromEntries(
    data.map(r => [r.governorate, r])
  );
}
