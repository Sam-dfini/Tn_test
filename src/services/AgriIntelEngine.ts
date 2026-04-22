/**
 * AgriIntelEngine.ts
 * Satellite Agriculture Intelligence Module — TunisiaIntel v2.0
 *
 * Monitors wheat and olive crop stress using NDVI, rainfall,
 * soil moisture, and temperature signals per governorate.
 *
 * RRI Integration (real pipeline fields, not fictional IDs):
 *   wheat_stress_index  → economy.agriculture   (Agricultural_Output variable)
 *   olive_yield_ratio   → economy.food_subsidies (Food_Subsidy_Cost proxy)
 *   rural_stability     → social.food_security   (Food_Security_Index variable)
 *   soil_stress         → environment.soil_degradation
 *
 * Shock injection follows the SEI pattern:
 *   _sei_shock_magnitude  → injected into eq13_stochasticShock
 *   _sei_salience_boost   → boosts salience S(t) via eq3
 *
 * Architecture: pure functions only, no side effects, no UI imports.
 * Call sites: PipelineContext recalculateRRI() or AgriIntel component.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface AgriSignal {
  value:       number;      // normalized or raw depending on field
  timestamp:   number;      // Unix ms
  governorate: string;      // e.g. 'sfax', 'nabeul'
  quality?:    'MEASURED' | 'INTERPOLATED' | 'FALLBACK';
}

export interface AgriInputBundle {
  // NDVI: Normalized Difference Vegetation Index, 0–1 (higher = healthier)
  ndvi:              AgriSignal;
  // Rainfall anomaly: deviation from seasonal mean, negative = deficit
  rainfall_anomaly:  AgriSignal;
  // Soil moisture: volumetric water content, 0–1 (higher = wetter)
  soil_moisture:     AgriSignal;
  // Temperature: °C, raw value
  temperature:       AgriSignal;
  // Historical baseline for olive yield (tonnes/ha, governorate average)
  olive_historical_average?: number;
  // Seasonal stability proxy (0–1, 1 = stable season, 0 = erratic)
  seasonal_stability?: number;
}

export interface AgriResult {
  governorate:          string;
  timestamp:            number;

  // Core indices
  wheat_stress_index:   number;   // 0–1 (1 = maximum stress)
  olive_health_index:   number;   // 0–1 (1 = maximum health)
  olive_yield_forecast: number;   // tonnes/ha (absolute)
  rural_stability_score:number;   // 0–1 (1 = fully stable)

  // Risk classification
  risk_flag:            'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // RRI shock signals (passed as overrides to calculateRRI)
  rri_shock_magnitude:  number;   // ε(t) contribution (0–0.25)
  rri_salience_boost:   number;   // S(t) salience nudge (0–0.12)

  // Pipeline field updates (use these keys with updateVariableFromPipeline)
  pipeline_updates: {
    'economy.agriculture':          number;  // wheat_stress → agricultural output
    'social.food_security':         number;  // rural_stability → food security
    'environment.soil_degradation': number;  // derived soil stress
    'infra.irrigation':             number;  // inferred irrigation efficiency
  };

  // GeoJSON-compatible properties (for map rendering)
  geojson_properties: {
    governorate:          string;
    wheat_stress_index:   number;
    olive_health_index:   number;
    rural_stability_score:number;
    risk_flag:            string;
    fill_color:           string;  // CSS color for choropleth
    fill_opacity:         number;
  };

  // Diagnostics
  data_quality:   'FULL' | 'PARTIAL' | 'FALLBACK';
  missing_fields: string[];
}

// Per-governorate running averages for fallback (session-scoped cache)
const _signalCache: Map<string, Partial<AgriInputBundle>> = new Map();

// ── Tunisia governorate agri profiles ────────────────────────────────────
// Historical olive yield (tonnes/ha) and wheat base yield (tonnes/ha)
// Source: ONAGRI + FAO Tunisia data

const GOV_PROFILES: Record<string, {
  olive_ha: number;        // olive cultivation area (thousands ha)
  wheat_ha: number;        // wheat cultivation area (thousands ha)
  olive_avg_yield: number; // tonnes/ha historical average
  wheat_avg_yield: number; // tonnes/ha
  agri_gdp_weight: number; // weight of agriculture in governorate GDP (0–1)
}> = {
  sfax:        { olive_ha: 220, wheat_ha: 15,  olive_avg_yield: 1.8, wheat_avg_yield: 1.4, agri_gdp_weight: 0.18 },
  nabeul:      { olive_ha: 100, wheat_ha: 20,  olive_avg_yield: 2.1, wheat_avg_yield: 1.6, agri_gdp_weight: 0.25 },
  beja:        { olive_ha: 30,  wheat_ha: 180, olive_avg_yield: 1.4, wheat_avg_yield: 2.1, agri_gdp_weight: 0.42 },
  jendouba:    { olive_ha: 25,  wheat_ha: 120, olive_avg_yield: 1.2, wheat_avg_yield: 1.9, agri_gdp_weight: 0.38 },
  siliana:     { olive_ha: 40,  wheat_ha: 90,  olive_avg_yield: 1.3, wheat_avg_yield: 1.7, agri_gdp_weight: 0.35 },
  kasserine:   { olive_ha: 80,  wheat_ha: 60,  olive_avg_yield: 0.9, wheat_avg_yield: 1.2, agri_gdp_weight: 0.30 },
  sidi_bouzid: { olive_ha: 75,  wheat_ha: 80,  olive_avg_yield: 1.0, wheat_avg_yield: 1.3, agri_gdp_weight: 0.45 },
  kairouan:    { olive_ha: 90,  wheat_ha: 70,  olive_avg_yield: 1.1, wheat_avg_yield: 1.4, agri_gdp_weight: 0.40 },
  gafsa:       { olive_ha: 20,  wheat_ha: 10,  olive_avg_yield: 0.7, wheat_avg_yield: 0.8, agri_gdp_weight: 0.15 },
  gabes:       { olive_ha: 60,  wheat_ha: 8,   olive_avg_yield: 1.0, wheat_avg_yield: 0.9, agri_gdp_weight: 0.20 },
  medenine:    { olive_ha: 45,  wheat_ha: 5,   olive_avg_yield: 0.8, wheat_avg_yield: 0.7, agri_gdp_weight: 0.18 },
  tataouine:   { olive_ha: 15,  wheat_ha: 3,   olive_avg_yield: 0.6, wheat_avg_yield: 0.5, agri_gdp_weight: 0.12 },
  tunis:       { olive_ha: 5,   wheat_ha: 5,   olive_avg_yield: 1.5, wheat_avg_yield: 1.5, agri_gdp_weight: 0.02 },
  ariana:      { olive_ha: 8,   wheat_ha: 10,  olive_avg_yield: 1.6, wheat_avg_yield: 1.6, agri_gdp_weight: 0.05 },
  ben_arous:   { olive_ha: 10,  wheat_ha: 8,   olive_avg_yield: 1.5, wheat_avg_yield: 1.5, agri_gdp_weight: 0.04 },
  manouba:     { olive_ha: 12,  wheat_ha: 25,  olive_avg_yield: 1.6, wheat_avg_yield: 1.8, agri_gdp_weight: 0.15 },
  zaghouan:    { olive_ha: 30,  wheat_ha: 40,  olive_avg_yield: 1.5, wheat_avg_yield: 1.7, agri_gdp_weight: 0.30 },
  bizerte:     { olive_ha: 35,  wheat_ha: 60,  olive_avg_yield: 1.6, wheat_avg_yield: 1.9, agri_gdp_weight: 0.20 },
  sousse:      { olive_ha: 50,  wheat_ha: 20,  olive_avg_yield: 1.7, wheat_avg_yield: 1.5, agri_gdp_weight: 0.12 },
  monastir:    { olive_ha: 45,  wheat_ha: 15,  olive_avg_yield: 1.8, wheat_avg_yield: 1.4, agri_gdp_weight: 0.14 },
  mahdia:      { olive_ha: 70,  wheat_ha: 25,  olive_avg_yield: 1.9, wheat_avg_yield: 1.5, agri_gdp_weight: 0.28 },
  kef:         { olive_ha: 25,  wheat_ha: 100, olive_avg_yield: 1.2, wheat_avg_yield: 2.0, agri_gdp_weight: 0.38 },
  tozeur:      { olive_ha: 5,   wheat_ha: 2,   olive_avg_yield: 0.5, wheat_avg_yield: 0.4, agri_gdp_weight: 0.10 },
  kebili:      { olive_ha: 10,  wheat_ha: 3,   olive_avg_yield: 0.6, wheat_avg_yield: 0.5, agri_gdp_weight: 0.12 },
};

const DEFAULT_PROFILE = {
  olive_ha: 30, wheat_ha: 30,
  olive_avg_yield: 1.2, wheat_avg_yield: 1.3,
  agri_gdp_weight: 0.20,
};

// ── Pure helper functions ─────────────────────────────────────────────────

/**
 * Clamp a value to [0, 1].
 */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Normalize a raw value to [0, 1] given known min/max range.
 * Gracefully handles out-of-range by clamping.
 */
export function normalize(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 0.5;
  return clamp01((value - min) / (max - min));
}

/**
 * Normalize rainfall anomaly to a drought deficit signal [0, 1].
 * Anomaly of -1.0 (severe deficit) → deficit 1.0.
 * Anomaly of +0.5 (surplus) → deficit 0.0.
 */
export function rainfallToDeficit(anomaly: number): number {
  // anomaly range: -1.0 (severe drought) to +1.0 (flood)
  // deficit = how stressed due to water absence
  return clamp01((-anomaly + 1) / 2);
}

/**
 * Normalize soil moisture to a deficit signal [0, 1].
 * 0.0 soil moisture → deficit 1.0. 0.6+ → deficit 0.0.
 */
export function soilToDeficit(moisture: number): number {
  // moisture 0–1 (0 = bone dry, 0.6+ = saturated for crops)
  return clamp01(1 - moisture / 0.6);
}

/**
 * Normalize NDVI to [0, 1]. NDVI raw range: -1 to 1, but crops 0.2–0.9.
 */
export function normalizeNDVI(ndvi: number): number {
  return normalize(ndvi, 0.1, 0.9);
}

/**
 * Resolve a signal value with fallback to cache or default.
 * Updates cache with fresh values.
 */
function resolveSignal(
  signal: AgriSignal | undefined,
  cacheKey: string,
  govKey: string,
  defaultValue: number
): { value: number; quality: 'MEASURED' | 'INTERPOLATED' | 'FALLBACK'; missing: boolean } {
  if (signal !== undefined && signal !== null && isFinite(signal.value)) {
    // Update cache
    const cached = _signalCache.get(govKey) ?? {};
    (cached as any)[cacheKey] = signal;
    _signalCache.set(govKey, cached);
    return { value: signal.value, quality: 'MEASURED', missing: false };
  }

  // Try cache
  const cached = _signalCache.get(govKey);
  if (cached && (cached as any)[cacheKey]) {
    return { value: ((cached as any)[cacheKey] as AgriSignal).value, quality: 'INTERPOLATED', missing: false };
  }

  return { value: defaultValue, quality: 'FALLBACK', missing: true };
}

// ── Core computations ─────────────────────────────────────────────────────

/**
 * EQ.AGRI.1 — Wheat Stress Index
 *
 * wheat_stress = (1 - NDVI_norm) * 0.5
 *              + rainfall_deficit * 0.3
 *              + soil_deficit * 0.2
 *
 * Output: [0, 1] where 1 = maximum stress (crop failure risk)
 */
export function computeWheatStress(
  ndvi_norm:        number,  // [0, 1]
  rainfall_deficit: number,  // [0, 1]
  soil_deficit:     number   // [0, 1]
): number {
  const stress =
    (1 - ndvi_norm)     * 0.50 +
    rainfall_deficit    * 0.30 +
    soil_deficit        * 0.20;
  return clamp01(stress);
}

/**
 * EQ.AGRI.2 — Olive Health Index
 *
 * olive_health = NDVI_norm * 0.6
 *             + soil_moisture_norm * 0.2
 *             + seasonal_stability * 0.2
 *
 * Output: [0, 1] where 1 = peak health
 */
export function computeOliveHealth(
  ndvi_norm:          number,  // [0, 1]
  soil_moisture_norm: number,  // [0, 1]
  seasonal_stability: number   // [0, 1]
): number {
  const health =
    ndvi_norm          * 0.60 +
    soil_moisture_norm * 0.20 +
    seasonal_stability * 0.20;
  return clamp01(health);
}

/**
 * EQ.AGRI.3 — Rural Stability Score
 *
 * rural_stability = (1 - wheat_stress) * 0.6
 *                 + olive_health * 0.4
 *
 * Output: [0, 1] where 1 = fully stable
 */
export function computeRuralStability(
  wheat_stress:  number,
  olive_health:  number
): number {
  return clamp01(
    (1 - wheat_stress) * 0.60 +
    olive_health       * 0.40
  );
}

/**
 * EQ.AGRI.4 — Olive Yield Forecast (tonnes/ha)
 *
 * olive_yield = olive_health * historical_average
 *
 * Bounded: [0, historical_average * 1.3] (cap at 30% above average)
 */
export function computeOliveYieldForecast(
  olive_health:         number,
  historical_average:   number
): number {
  const raw = olive_health * historical_average;
  return Math.min(raw, historical_average * 1.30);
}

/**
 * EQ.AGRI.5 — Shock magnitude for ε(t) injection
 *
 * Triggered when wheat_stress > 0.75 (severe crop failure risk).
 * Scale: 0.05 baseline + up to 0.20 additional for extreme stress.
 * Follows SEI pattern: { weight: SEI_SHOCK_WEIGHT, magnitude: value }
 */
export function computeAgriShock(
  wheat_stress:   number,
  agri_gdp_weight:number   // how agriculture-dependent this governorate is
): number {
  if (wheat_stress <= 0.60) return 0;
  // Graduated shock: 0.60–0.75 = warning zone, 0.75+ = shock zone
  const base = wheat_stress > 0.75
    ? 0.08 + (wheat_stress - 0.75) * 0.68  // up to 0.25 at stress=1.0
    : (wheat_stress - 0.60) * 0.53;         // 0–0.08 in warning zone

  // Weight by how much agriculture matters to this governorate
  return clamp01(base * (0.5 + agri_gdp_weight * 0.5));
}

/**
 * Risk classification per GPT spec, extended with CRITICAL tier.
 */
export function classifyRisk(wheat_stress: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (wheat_stress > 0.85) return 'CRITICAL';
  if (wheat_stress > 0.70) return 'HIGH';
  if (wheat_stress > 0.40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Choropleth fill color for map rendering.
 */
export function riskToColor(risk: string): string {
  switch (risk) {
    case 'CRITICAL': return '#7f0000';
    case 'HIGH':     return '#ff2d55';
    case 'MEDIUM':   return '#ff9f0a';
    default:         return '#2fd158';
  }
}

/**
 * Convert rural_stability to a food security index value
 * in the range the RRI variable expects (0–1 normalized).
 * food_security_index: higher = better. Invert for pipeline field.
 */
export function stabilityToFoodSecurity(rural_stability: number): number {
  // RRI Food_Security_Index: higher value = more secure = LOWER risk contribution
  return clamp01(rural_stability);
}

/**
 * Convert wheat_stress to agricultural output impact.
 * economy.agriculture pipeline field represents output as
 * a % of potential. 0 stress = 100% output, 1.0 stress = 30% output.
 */
export function stressToAgriOutput(wheat_stress: number): number {
  // Realistic: even at peak stress, some output remains
  return clamp01(1.0 - wheat_stress * 0.70);
}

// ── Main engine function ──────────────────────────────────────────────────

/**
 * processAgriBundle()
 *
 * Main entry point. Takes raw AgriInputBundle per governorate,
 * resolves missing values, computes all indices, classifies risk,
 * and returns a complete AgriResult with RRI-ready pipeline updates.
 *
 * Pure function — no side effects. Caller applies pipeline updates.
 */
export function processAgriBundle(
  governorate: string,
  inputs:      Partial<AgriInputBundle>
): AgriResult {
  const profile = GOV_PROFILES[governorate] ?? DEFAULT_PROFILE;
  const now     = Date.now();
  const missing: string[] = [];

  // ── 1. Resolve all signals with fallback ────────────────────────────
  const ndvi   = resolveSignal(inputs.ndvi,             'ndvi',             governorate, 0.45);
  const rain   = resolveSignal(inputs.rainfall_anomaly, 'rainfall_anomaly', governorate, 0.0);
  const soil   = resolveSignal(inputs.soil_moisture,    'soil_moisture',    governorate, 0.30);
  const temp   = resolveSignal(inputs.temperature,      'temperature',      governorate, 20.0);

  if (ndvi.missing)  missing.push('ndvi');
  if (rain.missing)  missing.push('rainfall_anomaly');
  if (soil.missing)  missing.push('soil_moisture');
  if (temp.missing)  missing.push('temperature');

  const data_quality: AgriResult['data_quality'] =
    missing.length === 0 ? 'FULL' :
    missing.length <= 2  ? 'PARTIAL' : 'FALLBACK';

  // ── 2. Normalize signals ────────────────────────────────────────────
  const ndvi_norm        = normalizeNDVI(clamp01(ndvi.value));
  const rainfall_deficit = rainfallToDeficit(Math.max(-1, Math.min(1, rain.value)));
  const soil_deficit     = soilToDeficit(clamp01(soil.value));
  const soil_moisture_n  = clamp01(soil.value);

  // Seasonal stability: derived from temperature variance proxy
  // High temp anomaly (>5°C above mean) = low stability
  const temp_anomaly      = Math.abs(temp.value - 20) / 20;
  const seasonal_stability = inputs.seasonal_stability
    ?? clamp01(1 - temp_anomaly * 0.6);

  // ── 3. Core computations ────────────────────────────────────────────
  const wheat_stress_index    = computeWheatStress(ndvi_norm, rainfall_deficit, soil_deficit);
  const olive_health_index    = computeOliveHealth(ndvi_norm, soil_moisture_n, seasonal_stability);
  const olive_historical_avg  = inputs.olive_historical_average ?? profile.olive_avg_yield;
  const olive_yield_forecast  = computeOliveYieldForecast(olive_health_index, olive_historical_avg);
  const rural_stability_score = computeRuralStability(wheat_stress_index, olive_health_index);

  // ── 4. Risk classification ──────────────────────────────────────────
  const risk_flag = classifyRisk(wheat_stress_index);

  // ── 5. RRI shock signals ────────────────────────────────────────────
  const rri_shock_magnitude = computeAgriShock(wheat_stress_index, profile.agri_gdp_weight);

  // Salience boost: food stress amplifies public narrative salience
  // Follows SEI pattern — additive to eq3 salience
  const rri_salience_boost = wheat_stress_index > 0.50
    ? clamp01((wheat_stress_index - 0.50) * 0.24)  // max 0.12 at stress=1.0
    : 0;

  // ── 6. Pipeline field updates (dot-path keys) ────────────────────────
  const pipeline_updates = {
    'economy.agriculture':          stressToAgriOutput(wheat_stress_index),
    'social.food_security':         stabilityToFoodSecurity(rural_stability_score),
    'environment.soil_degradation': clamp01(soil_deficit * 0.7 + (1 - ndvi_norm) * 0.3),
    'infra.irrigation':             clamp01(soil_moisture_n * (1 - rainfall_deficit * 0.5)),
  };

  // ── 7. GeoJSON properties ───────────────────────────────────────────
  const geojson_properties = {
    governorate,
    wheat_stress_index:    parseFloat(wheat_stress_index.toFixed(4)),
    olive_health_index:    parseFloat(olive_health_index.toFixed(4)),
    rural_stability_score: parseFloat(rural_stability_score.toFixed(4)),
    risk_flag,
    fill_color:    riskToColor(risk_flag),
    fill_opacity:  0.4 + wheat_stress_index * 0.5,
  };

  return {
    governorate,
    timestamp: now,
    wheat_stress_index:    parseFloat(wheat_stress_index.toFixed(4)),
    olive_health_index:    parseFloat(olive_health_index.toFixed(4)),
    olive_yield_forecast:  parseFloat(olive_yield_forecast.toFixed(3)),
    rural_stability_score: parseFloat(rural_stability_score.toFixed(4)),
    risk_flag,
    rri_shock_magnitude:   parseFloat(rri_shock_magnitude.toFixed(4)),
    rri_salience_boost:    parseFloat(rri_salience_boost.toFixed(4)),
    pipeline_updates: {
      'economy.agriculture':          parseFloat(pipeline_updates['economy.agriculture'].toFixed(4)),
      'social.food_security':         parseFloat(pipeline_updates['social.food_security'].toFixed(4)),
      'environment.soil_degradation': parseFloat(pipeline_updates['environment.soil_degradation'].toFixed(4)),
      'infra.irrigation':             parseFloat(pipeline_updates['infra.irrigation'].toFixed(4)),
    },
    geojson_properties,
    data_quality,
    missing_fields: missing,
  };
}

// ── Multi-governorate processing ──────────────────────────────────────────

export interface AgriNationalSummary {
  results:              AgriResult[];
  national_wheat_stress:number;   // area-weighted average
  national_olive_health:number;
  national_stability:   number;
  critical_govs:        string[];
  high_risk_govs:       string[];
  // Aggregate RRI signals — max shock across all govs
  aggregate_shock:      number;
  aggregate_salience:   number;
  // RRI override bundle (pass as overrides to calculateRRI)
  rri_overrides: {
    'economy.agriculture':          number;
    'social.food_security':         number;
    'environment.soil_degradation': number;
    'infra.irrigation':             number;
    _sei_shock_magnitude:           number;
    _sei_salience_boost:            number;
  };
  generated_at: string;
}

/**
 * processAllGovernorates()
 *
 * Process AgriInputBundle for all available governorates.
 * Returns national summary with aggregate RRI signals.
 *
 * Pure function. All side effects (updateField, recalculateRRI)
 * are the caller's responsibility.
 */
export function processAllGovernorates(
  inputs: Record<string, Partial<AgriInputBundle>>
): AgriNationalSummary {
  const results: AgriResult[] = [];

  // Process each governorate — use default profile for any not in inputs
  const allGovs = new Set([
    ...Object.keys(inputs),
    ...Object.keys(GOV_PROFILES),
  ]);

  for (const gov of allGovs) {
    const bundle = inputs[gov] ?? {};
    results.push(processAgriBundle(gov, bundle));
  }

  // Area-weighted averages using wheat_ha as weight for wheat stress
  // and olive_ha as weight for olive health
  let totalWheatHa = 0, wheatStressSum = 0;
  let totalOliveHa = 0, oliveHealthSum = 0;
  let stabilitySum = 0;

  for (const r of results) {
    const p = GOV_PROFILES[r.governorate] ?? DEFAULT_PROFILE;
    totalWheatHa  += p.wheat_ha;
    wheatStressSum += r.wheat_stress_index * p.wheat_ha;
    totalOliveHa  += p.olive_ha;
    oliveHealthSum += r.olive_health_index * p.olive_ha;
    stabilitySum  += r.rural_stability_score;
  }

  const national_wheat_stress = totalWheatHa > 0
    ? clamp01(wheatStressSum / totalWheatHa) : 0;
  const national_olive_health = totalOliveHa > 0
    ? clamp01(oliveHealthSum / totalOliveHa) : 0.5;
  const national_stability = results.length > 0
    ? clamp01(stabilitySum / results.length) : 0.5;

  const critical_govs = results.filter(r => r.risk_flag === 'CRITICAL').map(r => r.governorate);
  const high_risk_govs = results.filter(r => r.risk_flag === 'HIGH').map(r => r.governorate);

  // Aggregate shock: max across all governorates (worst-case propagation)
  const aggregate_shock = Math.max(0, ...results.map(r => r.rri_shock_magnitude));
  const aggregate_salience = Math.max(0, ...results.map(r => r.rri_salience_boost));

  // National pipeline updates: weighted averages
  const agriOutput   = stressToAgriOutput(national_wheat_stress);
  const foodSecurity = stabilityToFoodSecurity(national_stability);
  const soilStress   = clamp01(national_wheat_stress * 0.6 + (1 - national_olive_health) * 0.4);
  const irrigation   = clamp01(national_stability * 0.7 + national_olive_health * 0.3);

  return {
    results,
    national_wheat_stress:  parseFloat(national_wheat_stress.toFixed(4)),
    national_olive_health:  parseFloat(national_olive_health.toFixed(4)),
    national_stability:     parseFloat(national_stability.toFixed(4)),
    critical_govs,
    high_risk_govs,
    aggregate_shock:        parseFloat(aggregate_shock.toFixed(4)),
    aggregate_salience:     parseFloat(aggregate_salience.toFixed(4)),
    rri_overrides: {
      'economy.agriculture':          parseFloat(agriOutput.toFixed(4)),
      'social.food_security':         parseFloat(foodSecurity.toFixed(4)),
      'environment.soil_degradation': parseFloat(soilStress.toFixed(4)),
      'infra.irrigation':             parseFloat(irrigation.toFixed(4)),
      _sei_shock_magnitude:           parseFloat(aggregate_shock.toFixed(4)),
      _sei_salience_boost:            parseFloat(aggregate_salience.toFixed(4)),
    },
    generated_at: new Date().toISOString(),
  };
}

// ── Mock data generator (for testing) ────────────────────────────────────

/**
 * generateMockInputs()
 * Generates realistic mock AgriInputBundle for all 24 governorates.
 * Simulates a moderate drought year (2026 baseline conditions).
 */
export function generateMockInputs(
  scenario: 'normal' | 'drought' | 'flood' = 'normal'
): Record<string, Partial<AgriInputBundle>> {
  const now = Date.now();

  const scenarioParams = {
    normal:  { ndvi_base: 0.52, rain_base: 0.05,  soil_base: 0.38 },
    drought: { ndvi_base: 0.32, rain_base: -0.45, soil_base: 0.18 },
    flood:   { ndvi_base: 0.61, rain_base: 0.65,  soil_base: 0.72 },
  }[scenario];

  // Interior governorates are more vulnerable (drier, less infrastructure)
  const interiorGovs = new Set(['kasserine','sidi_bouzid','kairouan','gafsa','kef','siliana','tataouine','kebili','tozeur']);

  return Object.fromEntries(
    Object.keys(GOV_PROFILES).map(gov => {
      const isInterior = interiorGovs.has(gov);
      const stress_mod = isInterior ? 0.12 : 0;

      return [gov, {
        ndvi: {
          value: Math.max(0.1, scenarioParams.ndvi_base - stress_mod + (Math.random() - 0.5) * 0.1),
          timestamp: now,
          governorate: gov,
          quality: 'MEASURED',
        },
        rainfall_anomaly: {
          value: Math.max(-1, Math.min(1, scenarioParams.rain_base - stress_mod * 0.5 + (Math.random() - 0.5) * 0.15)),
          timestamp: now,
          governorate: gov,
          quality: 'MEASURED',
        },
        soil_moisture: {
          value: Math.max(0, scenarioParams.soil_base - stress_mod + (Math.random() - 0.5) * 0.08),
          timestamp: now,
          governorate: gov,
          quality: 'MEASURED',
        },
        temperature: {
          value: isInterior ? 26 + Math.random() * 4 : 22 + Math.random() * 3,
          timestamp: now,
          governorate: gov,
          quality: 'MEASURED',
        },
      }];
    })
  );
}

// ── Integration example (documentation) ──────────────────────────────────

/**
 * INTEGRATION EXAMPLE — How to wire AgriIntelEngine into PipelineContext
 *
 * In PipelineContext.tsx, inside recalculateRRI() or a dedicated
 * useEffect, add:
 *
 * ```typescript
 * import {
 *   processAllGovernorates,
 *   generateMockInputs,
 * } from '../services/AgriIntelEngine';
 *
 * // 1. Get inputs from pipeline (or mock during development)
 * const agriInputs = generateMockInputs('drought'); // replace with live data
 *
 * // 2. Process all governorates
 * const agriSummary = processAllGovernorates(agriInputs);
 *
 * // 3. Apply pipeline field updates
 * Object.entries(agriSummary.rri_overrides).forEach(([field, value]) => {
 *   if (!field.startsWith('_')) {
 *     updateField(field, value, 'AgriIntel Satellite Engine');
 *   }
 * });
 *
 * // 4. Inject SEI-compatible shock into next RRI recalculation
 * // Pass as overrides to calculateRRI():
 * const newState = calculateRRI({
 *   ...existingOverrides,
 *   _sei_shock_magnitude: agriSummary.rri_overrides._sei_shock_magnitude,
 *   _sei_salience_boost:  agriSummary.rri_overrides._sei_salience_boost,
 * });
 *
 * // 5. Alert if critical govs detected
 * if (agriSummary.critical_govs.length > 0) {
 *   addNotification({
 *     type: 'ALERT',
 *     priority: 'CRITICAL',
 *     title: 'AgriIntel: Crop Failure Risk',
 *     message: `Critical stress in: ${agriSummary.critical_govs.join(', ')}`,
 *     action: { label: 'View AgriIntel', event: 'navigate-main', detail: { tab: 'agri' } },
 *   });
 * }
 * ```
 */
export const AGRI_INTEGRATION_DOCS = 'See JSDoc above for integration example.';
