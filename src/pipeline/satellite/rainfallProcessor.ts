/**
 * rainfallProcessor.ts
 * Rainfall anomaly processor for TunisiaIntel satellite pipeline.
 *
 * PRIMARY: Open-Meteo ERA5 historical archive
 *   - Current 30-day precipitation sum
 *   - Historical 30-day average (same period, prior 5 years)
 *   - Anomaly = (current - historical_avg) / historical_avg
 *
 * CHIRPS note: CHIRPS (UCSB-CHG/CHIRPS/DAILY) requires GEE or
 * a separate THREDDS/OPeNDAP server. Open-Meteo ERA5 provides
 * equivalent quality for the governorate-centroid scale we need.
 */

import fetch from 'node-fetch';
import {
  GovCoord, isoDate, daysAgo, OPEN_METEO_ARCHIVE,
} from './satelliteConfig.js';

// ── Types ─────────────────────────────────────────────────────────────────

export interface RainfallResult {
  governorate:       string;
  current_30d_mm:    number;    // mm in the last 30 days
  historical_avg_mm: number;    // mm historical 30-day average (5-year)
  anomaly:           number;    // (current - hist) / hist, negative = deficit
  source:            string;
}

// ── Historical baseline per governorate ───────────────────────────────────
// 30-day May average rainfall (mm) from ERA5 1991–2020 climatology.
// Sourced from: Tunisia Meteorological Institute / ERA5 reanalysis.
// Used as fallback if live historical fetch fails.

const RAINFALL_CLIMATOLOGY_MAY: Record<string, number> = {
  tunis: 18.2, ariana: 17.8, ben_arous: 17.5, manouba: 19.1,
  nabeul: 24.3, zaghouan: 22.5, bizerte: 28.4, beja: 35.6,
  jendouba: 31.2, kef: 28.8, siliana: 24.1, sousse: 16.8,
  monastir: 14.2, mahdia: 15.7, kairouan: 18.5, kasserine: 20.4,
  sidi_bouzid: 15.8, sfax: 12.3, gabes: 8.6, medenine: 5.4,
  tataouine: 3.2, gafsa: 7.8, tozeur: 2.1, kebili: 1.8,
};

// Fallback for unknown govs
const DEFAULT_CLIMATOLOGY_MM = 15.0;

// ── Current 30-day precipitation fetch ───────────────────────────────────

async function fetchCurrent30dBatch(govs: GovCoord[]): Promise<Record<string, number>> {
  const lats = govs.map(g => g.lat.toFixed(4)).join(',');
  const lons = govs.map(g => g.lon.toFixed(4)).join(',');
  
  const params = new URLSearchParams({
    latitude:   lats,
    longitude:  lons,
    past_days:  '31',
    daily:      'precipitation_sum',
    timezone:   'Africa/Tunis',
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) {
      console.warn(`[Rainfall] Batch Open-Meteo failed: ${res.status}`);
      return {};
    }

    const data = await res.json() as any;
    const results: Record<string, number> = {};
    
    // Open-Meteo returns an array of objects if multiple locations requested
    const dataList = Array.isArray(data) ? data : [data];
    
    dataList.forEach((item: any, idx: number) => {
      const precip: (number | null)[] = item?.daily?.precipitation_sum ?? [];
      const valid = precip.filter((v): v is number => v !== null && isFinite(v) && v >= 0);
      const sum = valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : 0;
      results[govs[idx].id] = sum;
    });
    
    return results;
  } catch (err) {
    console.error('[Rainfall] Batch fetch error:', err);
    return {};
  }
}

// ── Historical 30-day average (same calendar period, prior 5 years) ───────

async function fetchHistorical30dAvgBatch(govs: GovCoord[]): Promise<Record<string, number>> {
  const today = new Date();
  const year  = today.getFullYear();
  const historicalTotals: Record<string, number[]> = {};
  govs.forEach(g => historicalTotals[g.id] = []);

  const lats = govs.map(g => g.lat.toFixed(4)).join(',');
  const lons = govs.map(g => g.lon.toFixed(4)).join(',');

  // Fetch same 30-day window for years Y-1 through Y-5
  for (const offset of [1, 2, 3, 4, 5]) {
    const hy     = year - offset;
    const end    = new Date(today);
    end.setFullYear(hy);
    const start  = new Date(end);
    start.setDate(end.getDate() - 30);

    const params = new URLSearchParams({
      latitude:   lats,
      longitude:  lons,
      start_date: isoDate(start),
      end_date:   isoDate(end),
      daily:      'precipitation_sum',
      timezone:   'Africa/Tunis',
    });

    try {
      const res = await fetch(`${OPEN_METEO_ARCHIVE}?${params}`);
      if (!res.ok) continue;
      const data = await res.json() as any;
      const dataList = Array.isArray(data) ? data : [data];
      
      dataList.forEach((item: any, idx: number) => {
        const precip: (number | null)[] = item?.daily?.precipitation_sum ?? [];
        const valid = precip.filter((v): v is number => v !== null && isFinite(v) && v >= 0);
        if (valid.length > 0) {
          const sum = valid.reduce((a, b) => a + b, 0);
          historicalTotals[govs[idx].id].push(sum);
        }
      });
      // Small pause between historical years to be polite
      await new Promise(r => setTimeout(r, 200));
    } catch { continue; }
  }

  const results: Record<string, number> = {};
  govs.forEach(g => {
    const valid = historicalTotals[g.id];
    if (valid.length >= 2) {
      results[g.id] = valid.reduce((a, b) => a + b, 0) / valid.length;
    }
  });

  return results;
}

// ── Main rainfall processor ───────────────────────────────────────────────

/**
 * getRainfallBatch()
 * 
 * Process all governorates using batched API calls for efficiency.
 * Reduces 24 govs * 6 calls = 144 requests to just 6 requests.
 */
export async function getRainfallBatch(
  govs: GovCoord[],
  concurrency: number = 4
): Promise<RainfallResult[]> {
  console.log(`[Rainfall] Starting batched fetch for ${govs.length} governorates...`);
  
  const [currentMap, historicalMap] = await Promise.all([
    fetchCurrent30dBatch(govs),
    fetchHistorical30dAvgBatch(govs),
  ]);

  return govs.map(gov => {
    const current_30d = currentMap[gov.id] ?? 0;
    const hist_avg = historicalMap[gov.id]
      ?? RAINFALL_CLIMATOLOGY_MAY[gov.id]
      ?? DEFAULT_CLIMATOLOGY_MM;

    let anomaly: number;
    if (hist_avg < 1.0) {
      anomaly = current_30d > 5 ? 1.0 : 0.0;
    } else {
      anomaly = (current_30d - hist_avg) / hist_avg;
    }

    anomaly = Math.max(-1, Math.min(1, anomaly));

    return {
      governorate:       gov.id,
      current_30d_mm:    parseFloat(current_30d.toFixed(2)),
      historical_avg_mm: parseFloat(hist_avg.toFixed(2)),
      anomaly:           parseFloat(anomaly.toFixed(4)),
      source:            historicalMap[gov.id] ? 'open-meteo-era5-live' : 'open-meteo-era5+climatology',
    };
  });
}
