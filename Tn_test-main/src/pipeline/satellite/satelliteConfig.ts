/**
 * satelliteConfig.ts
 * Configuration, governorate coordinates, and shared types
 * for the TunisiaIntel satellite data ingestion pipeline.
 *
 * Data sources used (all free, no GEE required):
 *   NDVI proxy  → Open-Meteo ERA5 land surface temperature + EVI
 *   Rainfall    → Open-Meteo historical precipitation (ERA5)
 *   Soil moist  → Open-Meteo volumetric soil water (ERA5 Land)
 *   True NDVI   → Copernicus Data Space Statistical API (optional, needs account)
 *
 * Reality note: Google Earth Engine JavaScript SDK cannot be called
 * from Node.js directly. The GEE REST API requires OAuth2 service account.
 * Open-Meteo covers the same signals with zero auth and is used here.
 */

// ── Governorate coordinates (from governorates.json) ─────────────────────

export interface GovCoord {
  id:   string;
  name: string;
  lat:  number;
  lon:  number;
}

export const GOVERNORATE_COORDS: GovCoord[] = [
  { id: 'tunis',      name: 'Tunis',      lat: 36.8065, lon: 10.1815 },
  { id: 'ariana',     name: 'Ariana',     lat: 36.8625, lon: 10.1956 },
  { id: 'ben_arous',  name: 'Ben Arous',  lat: 36.7531, lon: 10.2282 },
  { id: 'manouba',    name: 'Manouba',    lat: 36.8089, lon: 10.0863 },
  { id: 'nabeul',     name: 'Nabeul',     lat: 36.4561, lon: 10.7376 },
  { id: 'zaghouan',   name: 'Zaghouan',   lat: 36.4021, lon: 10.1425 },
  { id: 'bizerte',    name: 'Bizerte',    lat: 37.2744, lon:  9.8739 },
  { id: 'beja',       name: 'Beja',       lat: 36.7256, lon:  9.1817 },
  { id: 'jendouba',   name: 'Jendouba',   lat: 36.5011, lon:  8.7757 },
  { id: 'kef',        name: 'Kef',        lat: 36.1822, lon:  8.7147 },
  { id: 'siliana',    name: 'Siliana',    lat: 36.0844, lon:  9.3708 },
  { id: 'sousse',     name: 'Sousse',     lat: 35.8245, lon: 10.6346 },
  { id: 'monastir',   name: 'Monastir',   lat: 35.7643, lon: 10.8113 },
  { id: 'mahdia',     name: 'Mahdia',     lat: 35.5047, lon: 11.0622 },
  { id: 'kairouan',   name: 'Kairouan',   lat: 35.6781, lon: 10.0963 },
  { id: 'kasserine',  name: 'Kasserine',  lat: 35.1676, lon:  8.8365 },
  { id: 'sidi_bouzid',name: 'Sidi Bouzid',lat: 35.0382, lon:  9.4849 },
  { id: 'sfax',       name: 'Sfax',       lat: 34.7398, lon: 10.7600 },
  { id: 'gabes',      name: 'Gabes',      lat: 33.8814, lon: 10.0982 },
  { id: 'medenine',   name: 'Medenine',   lat: 33.3549, lon: 10.5055 },
  { id: 'tataouine',  name: 'Tataouine',  lat: 32.9211, lon: 10.4511 },
  { id: 'gafsa',      name: 'Gafsa',      lat: 34.4311, lon:  8.7757 },
  { id: 'tozeur',     name: 'Tozeur',     lat: 33.9197, lon:  8.1335 },
  { id: 'kebili',     name: 'Kebili',     lat: 33.7027, lon:  8.9645 },
];

// ── Pipeline output type (matches AgriIntelEngine.AgriSignal) ─────────────

export interface SatelliteReading {
  governorate:       string;
  ndvi:              number;    // [0, 1]
  rainfall_anomaly:  number;    // deviation from 30-day historical mean
  soil_moisture:     number;    // volumetric [0, 1]
  temperature:       number;    // °C mean
  timestamp:         number;    // Unix ms
  data_sources:      string[];  // which APIs contributed
  quality:           'LIVE' | 'CACHED' | 'FALLBACK';
}

// ── Cache (in-memory, per run) ────────────────────────────────────────────

interface CacheEntry {
  data:    SatelliteReading;
  expires: number;            // Unix ms
}

const _cache = new Map<string, CacheEntry>();
const CACHE_TTL_NDVI_MS     = 3  * 24 * 60 * 60 * 1000;  // 3 days
const CACHE_TTL_RAIN_MS     = 6  * 60 * 60 * 1000;        // 6 hours
const CACHE_TTL_DEFAULT_MS  = 12 * 60 * 60 * 1000;        // 12 hours

export function getCached(key: string): SatelliteReading | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { _cache.delete(key); return null; }
  return entry.data;
}

export function setCache(
  key:     string,
  data:    SatelliteReading,
  ttl_ms?: number
): void {
  _cache.set(key, {
    data,
    expires: Date.now() + (ttl_ms ?? CACHE_TTL_DEFAULT_MS),
  });
}

export function clearCache(): void { _cache.clear(); }

// ── Date helpers ──────────────────────────────────────────────────────────

export function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── API base URLs ─────────────────────────────────────────────────────────

export const OPEN_METEO_ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
export const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';

// Optional: Copernicus Data Space Statistical API
// Requires free account at https://dataspace.copernicus.eu/
// Set COPERNICUS_CLIENT_ID + COPERNICUS_CLIENT_SECRET in .env
export const COPERNICUS_TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
export const COPERNICUS_STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';

export { CACHE_TTL_NDVI_MS, CACHE_TTL_RAIN_MS };
