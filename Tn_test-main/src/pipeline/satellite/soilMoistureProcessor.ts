/**
 * soilMoistureProcessor.ts
 * Soil moisture processor for TunisiaIntel satellite pipeline.
 *
 * PRIMARY: Open-Meteo ERA5-Land soil water variables
 *   soil_moisture_0_to_7cm    → surface layer (most relevant for crop stress)
 *   soil_moisture_7_to_28cm   → root zone layer
 *
 *   These are volumetric water content (m³/m³).
 *   Range: ~0.02 (bone dry) to ~0.50 (saturated).
 *   Normalized to [0,1] using Tunisia-specific field capacity ranges.
 *
 * SMAP note: NASA SMAP soil moisture requires EarthData auth +
 * HDF5 file processing. Open-Meteo ERA5-Land is the correct
 * Node.js-accessible alternative (same underlying reanalysis data).
 */

import fetch from 'node-fetch';
import {
  GovCoord, isoDate, daysAgo, OPEN_METEO_ARCHIVE,
} from './satelliteConfig.ts';

// ── Tunisia soil capacity ranges (m³/m³) by soil type ────────────────────
// Sandy soils (south) have lower capacity; clay soils (north) higher.

const SOIL_CAPACITY: Record<string, { wilting: number; field_capacity: number }> = {
  // Northern clay/loam soils
  beja:       { wilting: 0.14, field_capacity: 0.38 },
  jendouba:   { wilting: 0.13, field_capacity: 0.36 },
  kef:        { wilting: 0.13, field_capacity: 0.35 },
  siliana:    { wilting: 0.12, field_capacity: 0.34 },
  bizerte:    { wilting: 0.13, field_capacity: 0.37 },
  manouba:    { wilting: 0.12, field_capacity: 0.35 },
  // Central regions
  kairouan:   { wilting: 0.10, field_capacity: 0.30 },
  kasserine:  { wilting: 0.09, field_capacity: 0.28 },
  sidi_bouzid:{ wilting: 0.09, field_capacity: 0.27 },
  zaghouan:   { wilting: 0.11, field_capacity: 0.32 },
  sfax:       { wilting: 0.09, field_capacity: 0.28 },
  nabeul:     { wilting: 0.10, field_capacity: 0.30 },
  // Sandy south
  gafsa:      { wilting: 0.06, field_capacity: 0.20 },
  gabes:      { wilting: 0.06, field_capacity: 0.20 },
  medenine:   { wilting: 0.05, field_capacity: 0.18 },
  tataouine:  { wilting: 0.04, field_capacity: 0.15 },
  tozeur:     { wilting: 0.03, field_capacity: 0.12 },
  kebili:     { wilting: 0.03, field_capacity: 0.12 },
};

const DEFAULT_CAPACITY = { wilting: 0.10, field_capacity: 0.30 };

// ── Normalize volumetric soil water to [0, 1] ─────────────────────────────
// 0 = at wilting point (plant stress), 1 = at field capacity (optimal)

function normalizeVWC(
  vwc:   number,
  govId: string
): number {
  const cap = SOIL_CAPACITY[govId] ?? DEFAULT_CAPACITY;
  if (vwc <= cap.wilting)        return 0;
  if (vwc >= cap.field_capacity) return 1;
  return (vwc - cap.wilting) / (cap.field_capacity - cap.wilting);
}

// ── Fetch soil moisture from Open-Meteo ──────────────────────────────────

export interface SoilMoistureResult {
  governorate:   string;
  surface_norm:  number;    // surface layer [0,1]
  rootzone_norm: number;    // root zone [0,1]
  combined:      number;    // weighted average
  raw_surface:   number;    // m³/m³
  raw_rootzone:  number;    // m³/m³
  source:        string;
}

export async function getSoilMoisture(
  gov: GovCoord,
  days: number = 7
 ): Promise<SoilMoistureResult | null> {
  const endDate   = isoDate(daysAgo(7));   // 7-day lag for Archive safety
  const startDate = isoDate(daysAgo(days + 7));

  const params = new URLSearchParams({
    latitude:   gov.lat.toFixed(4),
    longitude:  gov.lon.toFixed(4),
    start_date: startDate,
    end_date:   endDate,
    hourly:     [
      'soil_moisture_0_to_7cm',
      'soil_moisture_7_to_28cm',
    ].join(','),
    timezone:   'Africa/Tunis',
  });

  try {
    const res = await fetch(`${OPEN_METEO_ARCHIVE}?${params}`);
    if (!res.ok) {
      console.warn(`[SoilMoisture] Open-Meteo failed for ${gov.id}: ${res.status}`);
      return null;
    }

    const data = await res.json() as any;
    const hourly = data.hourly;

    if (!hourly?.soil_moisture_0_to_7cm?.length) return null;

    // Mean over valid (non-null) hourly readings
    const mean = (arr: (number|null)[]): number => {
      const valid = arr.filter((v): v is number =>
        v !== null && isFinite(v) && v > 0
      );
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    const raw_surface  = mean(hourly.soil_moisture_0_to_7cm);
    const raw_rootzone = mean(hourly.soil_moisture_7_to_28cm);

    const surface_norm  = normalizeVWC(raw_surface,  gov.id);
    const rootzone_norm = normalizeVWC(raw_rootzone, gov.id);

    // Weighted: surface matters more for evaporation, root zone for crops
    const combined = surface_norm * 0.35 + rootzone_norm * 0.65;

    return {
      governorate:   gov.id,
      surface_norm:  parseFloat(surface_norm.toFixed(4)),
      rootzone_norm: parseFloat(rootzone_norm.toFixed(4)),
      combined:      parseFloat(combined.toFixed(4)),
      raw_surface:   parseFloat(raw_surface.toFixed(4)),
      raw_rootzone:  parseFloat(raw_rootzone.toFixed(4)),
      source:        'open-meteo-era5-land',
    };

  } catch (err) {
    console.error(`[SoilMoisture] Error for ${gov.id}:`, err);
    return null;
  }
}

/**
 * getSoilMoistureBatch()
 * Process all governorates using batched API calls for efficiency.
 */
export async function getSoilMoistureBatch(
  govs:        GovCoord[],
  days:        number = 7,
  concurrency: number = 4
): Promise<SoilMoistureResult[]> {
  console.log(`[SoilMoisture] Starting batched fetch for ${govs.length} governorates...`);
  
  const endDate   = isoDate(daysAgo(7));   // 7-day lag for Archive safety
  const startDate = isoDate(daysAgo(days + 7));

  const lats = govs.map(g => g.lat.toFixed(4)).join(',');
  const lons = govs.map(g => g.lon.toFixed(4)).join(',');

  const params = new URLSearchParams({
    latitude:   lats,
    longitude:  lons,
    start_date: startDate,
    end_date:   endDate,
    hourly:     [
      'soil_moisture_0_to_7cm',
      'soil_moisture_7_to_28cm',
    ].join(','),
    timezone:   'Africa/Tunis',
  });

  try {
    const res = await fetch(`${OPEN_METEO_ARCHIVE}?${params}`);
    if (!res.ok) {
      console.warn(`[SoilMoisture] Batch Open-Meteo failed: ${res.status}`);
      return [];
    }

    const data = await res.json() as any;
    const dataList = Array.isArray(data) ? data : [data];
    
    // Mean over valid (non-null) hourly readings helper
    const mean = (arr: (number|null)[]): number => {
      const valid = arr?.filter((v): v is number =>
        v !== null && isFinite(v) && v > 0
      ) ?? [];
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    return dataList.map((item: any, idx: number) => {
      const gov = govs[idx];
      const hourly = item.hourly;
      
      if (!hourly?.soil_moisture_0_to_7cm?.length) return null as any;

      const raw_surface  = mean(hourly.soil_moisture_0_to_7cm);
      const raw_rootzone = mean(hourly.soil_moisture_7_to_28cm);

      const surface_norm  = normalizeVWC(raw_surface,  gov.id);
      const rootzone_norm = normalizeVWC(raw_rootzone, gov.id);

      // Weighted: surface matters more for evaporation, root zone for crops
      const combined = surface_norm * 0.35 + rootzone_norm * 0.65;

      return {
        governorate:   gov.id,
        surface_norm:  parseFloat(surface_norm.toFixed(4)),
        rootzone_norm: parseFloat(rootzone_norm.toFixed(4)),
        combined:      parseFloat(combined.toFixed(4)),
        raw_surface:   parseFloat(raw_surface.toFixed(4)),
        raw_rootzone:  parseFloat(raw_rootzone.toFixed(4)),
        source:        'open-meteo-era5-land',
      };
    }).filter(r => r !== null);

  } catch (err) {
    console.error('[SoilMoisture] Batch fetch error:', err);
    return [];
  }
}
