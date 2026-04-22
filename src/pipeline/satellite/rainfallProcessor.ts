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

async function fetchCurrent30d(gov: GovCoord): Promise<number | null> {
  // Use Forecast API with past_days — it has 0 lag for recent history
  const params = new URLSearchParams({
    latitude:   gov.lat.toFixed(4),
    longitude:  gov.lon.toFixed(4),
    past_days:  '31',
    daily:      'precipitation_sum',
    timezone:   'Africa/Tunis',
  });

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) {
      console.warn(`[Rainfall] Open-Meteo failed for ${gov.id}: ${res.status}`);
      return null;
    }

    const data = await res.json() as any;
    const precip: (number | null)[] = data?.daily?.precipitation_sum ?? [];
    const valid = precip.filter((v): v is number => v !== null && isFinite(v) && v >= 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : 0;

  } catch { return null; }
}

// ── Historical 30-day average (same calendar period, prior 5 years) ───────

async function fetchHistorical30dAvg(gov: GovCoord): Promise<number | null> {
  const today = new Date();
  const year  = today.getFullYear();
  const totals: number[] = [];

  // Fetch same 30-day window for years Y-1 through Y-5
  const yearFetches = [1, 2, 3, 4, 5].map(async (offset) => {
    const hy     = year - offset;
    const end    = new Date(today);
    end.setFullYear(hy);
    const start  = new Date(end);
    start.setDate(end.getDate() - 30);

    const params = new URLSearchParams({
      latitude:   gov.lat.toFixed(4),
      longitude:  gov.lon.toFixed(4),
      start_date: isoDate(start),
      end_date:   isoDate(end),
      daily:      'precipitation_sum',
      timezone:   'Africa/Tunis',
    });

    try {
      const res = await fetch(`${OPEN_METEO_ARCHIVE}?${params}`);
      if (!res.ok) return null;
      const d = await res.json() as any;
      const precip: (number | null)[] = d?.daily?.precipitation_sum ?? [];
      const valid = precip.filter((v): v is number => v !== null && isFinite(v) && v >= 0);
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : null;
    } catch { return null; }
  });

  const results = await Promise.all(yearFetches);
  const valid = results.filter((v): v is number => v !== null);

  return valid.length >= 2
    ? valid.reduce((a, b) => a + b, 0) / valid.length
    : null;
}

// ── Main rainfall processor ───────────────────────────────────────────────

/**
 * getRainfallAnomaly()
 *
 * Returns the rainfall anomaly for a governorate.
 *
 * anomaly > 0  = above average (surplus)
 * anomaly < 0  = below average (deficit, drought signal)
 * anomaly = -1 = complete drought (no rainfall vs normal)
 *
 * Clamped to [-1.0, +1.0] for pipeline compatibility.
 */
export async function getRainfallAnomaly(
  gov: GovCoord
): Promise<RainfallResult> {
  // Run current and historical fetch in parallel
  const [current, historical] = await Promise.all([
    fetchCurrent30d(gov),
    fetchHistorical30dAvg(gov),
  ]);

  const current_30d = current ?? 0;

  // Use live historical if available, else climatology baseline
  const hist_avg = historical
    ?? RAINFALL_CLIMATOLOGY_MAY[gov.id]
    ?? DEFAULT_CLIMATOLOGY_MM;

  // Anomaly calculation — avoid division by zero in desert govs
  let anomaly: number;
  if (hist_avg < 1.0) {
    // Near-zero historical baseline (Tozeur, Kebili, Tataouine)
    anomaly = current_30d > 5 ? 1.0 : 0.0;
  } else {
    anomaly = (current_30d - hist_avg) / hist_avg;
  }

  // Clamp to [-1, +1]
  anomaly = Math.max(-1, Math.min(1, anomaly));

  return {
    governorate:       gov.id,
    current_30d_mm:    parseFloat(current_30d.toFixed(2)),
    historical_avg_mm: parseFloat(hist_avg.toFixed(2)),
    anomaly:           parseFloat(anomaly.toFixed(4)),
    source:            historical ? 'open-meteo-era5-live' : 'open-meteo-era5+climatology',
  };
}

/**
 * getRainfallBatch()
 *
 * Process all governorates with rate limiting.
 * Open-Meteo allows ~10k daily requests — batch safely.
 */
export async function getRainfallBatch(
  govs: GovCoord[],
  concurrency: number = 4
): Promise<RainfallResult[]> {
  const results: RainfallResult[] = [];

  for (let i = 0; i < govs.length; i += concurrency) {
    const batch  = govs.slice(i, i + concurrency);
    const chunk  = await Promise.all(batch.map(g => getRainfallAnomaly(g)));
    results.push(...chunk);

    // Polite delay between batches (Open-Meteo rate limit: ~600/min)
    if (i + concurrency < govs.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  return results;
}
