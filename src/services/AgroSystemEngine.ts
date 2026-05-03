/**
 * AgroSystemEngine.ts
 * Agro-Climate Intelligence System (ASIL) — TunisiaIntel v2.0
 *
 * Extends AgriIntelEngine (wheat + olive baseline) with:
 *   - Tree Crops Intelligence (citrus, dates)
 *   - Vegetables Intelligence (short-cycle, high-frequency signal)
 *   - Water Intelligence (dams, groundwater, desertification)
 *   - Bread Crisis Early Warning Model (BCI)
 *   - Full AgroSystemIndex aggregation
 *
 * REAL pipeline field mapping (not GPT fictional IDs):
 *   GPT "A.12"  → economy.agriculture        (w=0.08)
 *   GPT "E.3"   → environment.water_stress    (w=0.20)
 *   GPT "W.2"   → environment.desertification (w=0.20)
 *   GPT "A.20"  → economy.food_subsidies      (w=0.10)
 *   BCI output  → social.food_security        (w=0.18)
 *                 + environment.drought        (w=0.18)
 *
 * SEI integration: BCI connects to existing shortageDetector.ts
 * flour/bread keyword tracking — no duplication.
 *
 * Shock pattern: _sei_shock_magnitude + _sei_salience_boost
 * (same keys as seiEngine.ts and AgriIntelEngine.ts)
 *
 * Architecture: pure functions only, no side effects, no UI imports.
 */

// ── Re-export AgriIntelEngine types we build on ────────────────────────
// Consumers import from here, not from AgriIntelEngine directly.

import {
  clamp01,
  normalize,
  rainfallToDeficit,
  soilToDeficit,
  normalizeNDVI,
} from './AgriIntelEngine';
import type {
  AgriResult,
  AgriNationalSummary,
} from './AgriIntelEngine';

export { clamp01, normalize };

// ─────────────────────────────────────────────────────────────────────────
// SECTION 1 — SHARED INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────

/** Raw satellite/pipeline signal per governorate */
export interface AgroSignal {
  value: number;
  timestamp: number;
  governorate: string;
  quality?: 'MEASURED' | 'INTERPOLATED' | 'FALLBACK';
}

/** Full input bundle for a single governorate */
export interface AgroInputBundle {
  governorate: string;

  // Satellite signals (from satelliteIngestion pipeline)
  ndvi: number;   // [0,1]
  ndvi_trend_30d: number;   // delta: negative = declining
  ndvi_trend_365d: number;   // multi-year: negative = long-term loss
  rainfall_anomaly: number;   // [-1,+1]
  soil_moisture: number;   // [0,1]
  temperature: number;   // °C

  // Derived/pipeline signals (from PipelineContext data)
  inflation: number;   // % e.g. 7.1
  parallel_premium: number;   // % e.g. 18
  food_subsidy_cost: number;   // B TND
  fx_reserves_days: number;   // days import cover
  dam_level_pct: number;   // 0–100% (environment.dam_levels)
  groundwater_stress: number;   // [0,1] higher = more depleted

  // Social signals (from SEI / RSS articles)
  flour_sei_score: number;   // [0,1] from seiEngine flour tracking
  protest_events_30d: number;   // count
  media_bread_score: number;   // [0,1] from shortageDetector flour keywords
  queue_reports: number;   // [0,1] normalized report density

  // Optional: import data
  import_dependency_ratio?: number;  // [0,1] how much food is imported
  port_delay_days?: number;  // avg delay at Rades/Sfax/Bizerte
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 2 — TREE CROPS INTELLIGENCE
// Citrus, apples: medium water dependency, seasonal yield
// Date palms: desert strategic asset, groundwater-critical
// ─────────────────────────────────────────────────────────────────────────

export interface TreeCropsResult {
  governorate: string;

  // Citrus / fruit trees (Nabeul, Sousse, Sfax belt)
  fruit_tree_health_index: number;   // [0,1]
  seasonal_yield_variability: number;  // [0,1] higher = more volatile
  market_supply_pressure: number;   // [0,1]

  // Date palms (Tozeur, Kebili, Tataouine — desert critical)
  date_palm_health_index: number;   // [0,1]
  groundwater_dependency_stress: number; // [0,1]
  oasis_viability_score: number;   // [0,1] 0 = oasis collapse risk

  // Aggregate
  tree_crop_risk: number;   // [0,1]
  long_term_decline_flag: boolean;  // ndvi_trend_365d < -0.08
}

// Governorates with significant date palm cultivation
const DATE_PALM_GOVS = new Set(['tozeur', 'kebili', 'tataouine', 'gafsa', 'medenine']);
// Citrus / fruit tree belt
const CITRUS_GOVS = new Set(['nabeul', 'sousse', 'monastir', 'bizerte', 'beja', 'jendouba', 'sfax', 'mahdia']);

/**
 * computeTreeCrops()
 *
 * Tree crops respond to multi-month NDVI trends, not single readings.
 * Date palms are unique: they survive surface drought via deep roots
 * but collapse under groundwater depletion — modeled separately.
 */
export function computeTreeCrops(input: AgroInputBundle): TreeCropsResult {
  const gov = input.governorate;
  const isDatePalmGov = DATE_PALM_GOVS.has(gov);
  const isCitrusGov = CITRUS_GOVS.has(gov);

  // ── Fruit tree health (citrus/apples) ──────────────────────────────
  const ndvi_n = normalizeNDVI(input.ndvi);
  const soil_n = clamp01(input.soil_moisture);
  const temp_stress = clamp01((input.temperature - 24) / 16);  // stress >24°C

  const fruit_tree_health_index = isCitrusGov
    ? clamp01(ndvi_n * 0.50 + soil_n * 0.30 + (1 - temp_stress) * 0.20)
    : clamp01(ndvi_n * 0.60 + soil_n * 0.40);  // non-citrus govs use simpler model

  // Seasonal yield variability: driven by rainfall anomaly variance
  const seasonal_yield_variability = clamp01(
    Math.abs(input.rainfall_anomaly) * 0.60 +
    temp_stress * 0.40
  );

  // Market supply pressure: poor health + high variability = price spike risk
  const market_supply_pressure = clamp01(
    (1 - fruit_tree_health_index) * 0.55 +
    seasonal_yield_variability * 0.45
  );

  // ── Date palm intelligence ─────────────────────────────────────────
  // Date palms: NDVI less predictive (desert-adapted), groundwater is key signal
  const gw_stress = clamp01(input.groundwater_stress);
  const rain_deficit = rainfallToDeficit(input.rainfall_anomaly);

  // Long-term NDVI decline is the primary date palm early warning
  const ndvi_decline = clamp01(-Math.min(0, input.ndvi_trend_365d) * 5);

  const date_palm_health_index = isDatePalmGov
    ? clamp01(
      ndvi_n * 0.30 +
      (1 - gw_stress) * 0.40 +   // groundwater is dominant for dates
      (1 - ndvi_decline) * 0.30
    )
    : clamp01(ndvi_n * 0.70 + (1 - gw_stress) * 0.30);  // minor in non-desert govs

  // Groundwater dependency stress: how much the palm system relies on depleting aquifers
  const groundwater_dependency_stress = isDatePalmGov
    ? clamp01(gw_stress * 0.70 + rain_deficit * 0.30)
    : clamp01(gw_stress * 0.40);

  // Oasis viability: compound of health + groundwater + long-term trend
  const oasis_viability_score = isDatePalmGov
    ? clamp01(
      date_palm_health_index * 0.40 +
      (1 - groundwater_dependency_stress) * 0.40 +
      (1 - ndvi_decline) * 0.20
    )
    : 1.0;  // not applicable in non-desert govs

  // ── Aggregate tree crop risk ───────────────────────────────────────
  const fruit_risk = 1 - fruit_tree_health_index;
  const date_risk = 1 - date_palm_health_index;

  // Weight by governorate profile
  const tree_crop_risk = isDatePalmGov && isCitrusGov
    ? clamp01(fruit_risk * 0.45 + date_risk * 0.55)
    : isDatePalmGov
      ? clamp01(date_risk * 0.70 + fruit_risk * 0.30)
      : clamp01(fruit_risk * 0.80 + date_risk * 0.20);

  const long_term_decline_flag = input.ndvi_trend_365d < -0.08;

  return {
    governorate: gov,
    fruit_tree_health_index: parseFloat(fruit_tree_health_index.toFixed(4)),
    seasonal_yield_variability: parseFloat(seasonal_yield_variability.toFixed(4)),
    market_supply_pressure: parseFloat(market_supply_pressure.toFixed(4)),
    date_palm_health_index: parseFloat(date_palm_health_index.toFixed(4)),
    groundwater_dependency_stress: parseFloat(groundwater_dependency_stress.toFixed(4)),
    oasis_viability_score: parseFloat(oasis_viability_score.toFixed(4)),
    tree_crop_risk: parseFloat(tree_crop_risk.toFixed(4)),
    long_term_decline_flag,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 3 — VEGETABLES INTELLIGENCE
// Short-cycle, high-frequency signal — fastest path to inflation/anger
// ─────────────────────────────────────────────────────────────────────────

export interface VegetablesResult {
  governorate: string;
  vegetable_supply_index: number;   // [0,1] 1 = full supply
  harvest_cycle_disruption: number;   // [0,1]
  price_volatility_pressure: number;   // [0,1]
  vegetable_risk: number;   // [0,1]
  rapid_deterioration_flag: boolean;  // ndvi_trend_30d < -0.05
}

// Major vegetable production governorates
const VEG_GOVS = new Set(['nabeul', 'beja', 'jendouba', 'manouba', 'ariana',
  'zaghouan', 'sidi_bouzid', 'kairouan', 'sfax', 'mahdia']);

export function computeVegetables(input: AgroInputBundle): VegetablesResult {
  const gov = input.governorate;
  const isVegGov = VEG_GOVS.has(gov);

  // Vegetables respond to short-term NDVI changes and temperature spikes
  const ndvi_n = normalizeNDVI(input.ndvi);
  const ndvi_drop_30d = clamp01(-Math.min(0, input.ndvi_trend_30d) * 8);  // rapid decline = stress
  const temp_spike = clamp01((input.temperature - 28) / 12);           // >28°C = heat stress
  const rain_deficit = rainfallToDeficit(input.rainfall_anomaly);
  const soil_def = soilToDeficit(input.soil_moisture);

  // Supply index: NDVI + short-term trend + temperature
  const vegetable_supply_index = clamp01(
    ndvi_n * 0.40 +
    (1 - ndvi_drop_30d) * 0.35 +
    (1 - temp_spike) * 0.25
  ) * (isVegGov ? 1.0 : 0.7);  // non-veg govs contribute less to national supply

  // Harvest cycle disruption: rain deficit + soil stress
  const harvest_cycle_disruption = clamp01(
    rain_deficit * 0.45 +
    soil_def * 0.30 +
    temp_spike * 0.25
  );

  // Price volatility pressure: supply drop + harvest disruption → immediate CPI impact
  const price_volatility_pressure = clamp01(
    (1 - vegetable_supply_index) * 0.55 +
    harvest_cycle_disruption * 0.45
  );

  const vegetable_risk = clamp01(
    (1 - vegetable_supply_index) * 0.50 +
    harvest_cycle_disruption * 0.30 +
    price_volatility_pressure * 0.20
  );

  const rapid_deterioration_flag = input.ndvi_trend_30d < -0.05;

  return {
    governorate: gov,
    vegetable_supply_index: parseFloat(vegetable_supply_index.toFixed(4)),
    harvest_cycle_disruption: parseFloat(harvest_cycle_disruption.toFixed(4)),
    price_volatility_pressure: parseFloat(price_volatility_pressure.toFixed(4)),
    vegetable_risk: parseFloat(vegetable_risk.toFixed(4)),
    rapid_deterioration_flag,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 4 — WATER INTELLIGENCE
// Dams, groundwater, desertification — highest RRI weight variables
// (environment.dam_levels w=0.22, environment.water_stress w=0.20)
// ─────────────────────────────────────────────────────────────────────────

export interface WaterIntelResult {
  governorate: string;
  water_reserve_index: number;   // [0,1] 1 = full reserves
  evaporation_loss_rate: number;   // [0,1] estimated normalized loss
  rainfall_decline_trend: number;   // [-1,+1] negative = long-term decline
  desertification_index: number;   // [0,1] 1 = advanced desertification
  water_stress_composite: number;   // [0,1] feeds environment.water_stress
  water_crisis_flag: boolean;  // water_reserve_index < 0.3
}

// Tunisia dam distribution by governorate (major dams near these govs)
const DAM_GOVS = new Set(['beja', 'jendouba', 'siliana', 'kef', 'zaghouan', 'kairouan', 'kasserine']);
const DESERT_GOVS = new Set(['tozeur', 'kebili', 'tataouine', 'gafsa', 'medenine']);

export function computeWaterIntel(input: AgroInputBundle): WaterIntelResult {
  const gov = input.governorate;
  const isDamGov = DAM_GOVS.has(gov);
  const isDesert = DESERT_GOVS.has(gov);

  // Water reserve index: dam level (for dam govs) + rainfall trend + soil moisture
  const dam_n = clamp01(input.dam_level_pct / 100);
  const soil_n = clamp01(input.soil_moisture);
  const rain_surplus = clamp01((input.rainfall_anomaly + 1) / 2);  // remap to [0,1]

  const water_reserve_index = isDamGov
    ? clamp01(dam_n * 0.50 + soil_n * 0.25 + rain_surplus * 0.25)
    : isDesert
      ? clamp01((1 - input.groundwater_stress) * 0.60 + soil_n * 0.20 + rain_surplus * 0.20)
      : clamp01(soil_n * 0.45 + rain_surplus * 0.35 + dam_n * 0.20);

  // Evaporation loss rate: driven by temperature (higher T = more loss)
  // Tunisia-calibrated: significant above 30°C average
  const evaporation_loss_rate = clamp01(
    Math.max(0, (input.temperature - 20) / 20) * 0.60 +
    (1 - soil_n) * 0.40   // dry soil = more surface heating = more evaporation
  );

  // Long-term rainfall trend: ndvi_trend_365d as proxy for multi-year drying
  const rainfall_decline_trend = clamp01(input.ndvi_trend_365d + 0.5) * 2 - 1;  // remap to [-1,+1]

  // Desertification index: long-term NDVI loss + high temp + low rainfall
  const ndvi_long_loss = clamp01(-Math.min(0, input.ndvi_trend_365d) * 6);
  const rain_long_def = rainfallToDeficit(input.rainfall_anomaly);

  const desertification_index = isDesert
    ? clamp01(
      ndvi_long_loss * 0.40 +
      input.groundwater_stress * 0.35 +
      rain_long_def * 0.25
    )
    : clamp01(
      ndvi_long_loss * 0.50 +
      rain_long_def * 0.35 +
      evaporation_loss_rate * 0.15
    );

  // Composite water stress (maps to environment.water_stress pipeline field)
  const water_stress_composite = clamp01(
    (1 - water_reserve_index) * 0.45 +
    desertification_index * 0.30 +
    evaporation_loss_rate * 0.25
  );

  const water_crisis_flag = water_reserve_index < 0.30;

  return {
    governorate: gov,
    water_reserve_index: parseFloat(water_reserve_index.toFixed(4)),
    evaporation_loss_rate: parseFloat(evaporation_loss_rate.toFixed(4)),
    rainfall_decline_trend: parseFloat(rainfall_decline_trend.toFixed(4)),
    desertification_index: parseFloat(desertification_index.toFixed(4)),
    water_stress_composite: parseFloat(water_stress_composite.toFixed(4)),
    water_crisis_flag,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 5 — BREAD CRISIS EARLY WARNING MODEL (BCEWM)
// Three-layer model: Supply + Price + Public Signal
// Connects to existing SEI flour tracking — does not duplicate it
// ─────────────────────────────────────────────────────────────────────────

export interface BCEWMResult {
  // Core BCI
  BCI: number;             // [0,1]
  level: 'NORMAL' | 'STRESS' | 'HIGH_RISK' | 'CRISIS';
  velocity: number;             // BCI change vs 7d ago (requires history)

  // Component scores
  supply_stress: number;
  price_pressure: number;
  public_signal: number;

  // Shock outputs (SEI pattern)
  epsilon_shock: number;   // for _sei_shock_magnitude
  salience_boost: number;   // for _sei_salience_boost

  // Pipeline field updates
  pipeline_updates: {
    'social.food_security': number;  // 1 - BCI (higher BCI = lower security)
    'economy.food_subsidies': number;  // subsidy burden signal
    'environment.drought': number;  // supply stress maps to drought variable
  };

  // Alerts
  early_warning: boolean;  // velocity > 0.2
  crisis_imminent: boolean;  // BCI > 0.7
}

export interface BCEWMInputs {
  // Supply layer — from AgriIntelEngine + satellite pipeline
  wheat_stress_index: number;   // [0,1] from AgriIntelEngine
  import_dependency_ratio: number;   // [0,1] 0 = self-sufficient, 1 = fully imported
  stock_depletion: number;   // [0,1] proxy: low reserves + high demand
  milling_disruption: number;   // [0,1] proxy: energy outages + STEG debt

  // Price layer — from PipelineContext data
  inflation: number;   // % e.g. 7.1
  food_subsidy_cost: number;   // B TND — higher = more strained
  parallel_premium: number;   // % — proxy for black market food prices

  // Public signal layer — from SEI + shortageDetector (already computed)
  flour_sei_score: number;   // [0,1] from seiEngine flour tracking
  media_bread_score: number;   // [0,1] from shortageDetector.flour keywords
  protest_events_30d: number;   // count (normalize against 30 = threshold)
  queue_reports: number;   // [0,1] normalized

  // BCI from 7 days ago (for velocity — pass 0 if unavailable)
  bci_previous_7d: number;
}

/**
 * computeBCI()
 *
 * Bread Crisis Early Warning Model — exact GPT formula correctly implemented.
 *
 * BCI = 0.40 × SupplyStress + 0.35 × PricePressure + 0.25 × PublicSignal
 *
 * Key design: PublicSignal uses EXISTING SEI flour tracking (seiEngine.ts)
 * rather than duplicating it. The flour_sei_score IS the social signal.
 */
export function computeBCI(inputs: BCEWMInputs): BCEWMResult {

  // ── Layer 1: Supply Stress ──────────────────────────────────────────
  // SupplyStress = 0.4×wheat_stress + 0.3×import_dependency
  //             + 0.2×stock_depletion + 0.1×milling_disruption

  const supply_stress = clamp01(
    inputs.wheat_stress_index * 0.40 +
    inputs.import_dependency_ratio * 0.30 +
    inputs.stock_depletion * 0.20 +
    inputs.milling_disruption * 0.10
  );

  // ── Layer 2: Price Pressure ─────────────────────────────────────────
  // PricePressure = 0.5×flour_price_change + 0.3×subsidy_burden
  //              + 0.2×black_market_premium

  // Normalize inflation to a flour price change signal
  // Tunisia baseline: 7% inflation → moderate, >10% → high, >15% → severe
  const flour_price_change = clamp01(Math.max(0, inputs.inflation - 4) / 12);

  // Subsidy burden: food_subsidy_cost rising = strain signal
  // Normalize against a 3B TND reference (current est. 2B TND)
  const subsidy_burden = clamp01(inputs.food_subsidy_cost / 3.0);

  // Black market premium: parallel FX → higher import food costs
  const black_market_premium = clamp01(inputs.parallel_premium / 30);

  const price_pressure = clamp01(
    flour_price_change * 0.50 +
    subsidy_burden * 0.30 +
    black_market_premium * 0.20
  );

  // ── Layer 3: Public Signal ─────────────────────────────────────────
  // PublicSignal = 0.4×queue_reports + 0.3×social_complaints
  //             + 0.2×media_mentions + 0.1×protest_events
  //
  // Uses SEI flour score as social_complaints proxy (already computed)

  const protest_norm = clamp01(inputs.protest_events_30d / 30);

  const public_signal = clamp01(
    inputs.queue_reports * 0.40 +
    inputs.flour_sei_score * 0.30 +   // social complaints = SEI flour
    inputs.media_bread_score * 0.20 +   // media mentions = shortage keywords
    protest_norm * 0.10
  );

  // ── BCI Aggregation ────────────────────────────────────────────────
  const BCI = clamp01(
    supply_stress * 0.40 +
    price_pressure * 0.35 +
    public_signal * 0.25
  );

  // Level classification
  const level: BCEWMResult['level'] =
    BCI > 0.70 ? 'CRISIS' :
      BCI > 0.50 ? 'HIGH_RISK' :
        BCI > 0.30 ? 'STRESS' : 'NORMAL';

  // Velocity: BCI change vs 7 days ago
  const velocity = parseFloat((BCI - inputs.bci_previous_7d).toFixed(4));

  // ── Shock outputs (SEI pattern) ────────────────────────────────────
  // BCI > 0.6 → epsilon += 0.3 (per GPT spec, calibrated to SEI scale)
  const epsilon_shock = BCI > 0.60
    ? parseFloat(Math.min(0.30, (BCI - 0.60) * 0.75).toFixed(4))
    : 0;

  // Salience boost: bread crisis is maximum public salience
  const salience_boost = parseFloat(Math.min(0.15, BCI * 0.18).toFixed(4));

  // ── Pipeline field updates ─────────────────────────────────────────
  const pipeline_updates = {
    'social.food_security': parseFloat((1 - BCI).toFixed(4)),  // invert: high BCI = low security
    'economy.food_subsidies': parseFloat(subsidy_burden.toFixed(4)),
    'environment.drought': parseFloat(supply_stress.toFixed(4)), // supply stress = drought signal
  };

  // ── Alert flags ────────────────────────────────────────────────────
  const early_warning = velocity > 0.20;
  const crisis_imminent = BCI > 0.70;

  return {
    BCI: parseFloat(BCI.toFixed(4)),
    level,
    velocity,
    supply_stress: parseFloat(supply_stress.toFixed(4)),
    price_pressure: parseFloat(price_pressure.toFixed(4)),
    public_signal: parseFloat(public_signal.toFixed(4)),
    epsilon_shock,
    salience_boost,
    pipeline_updates,
    early_warning,
    crisis_imminent,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 6 — AGRO SYSTEM ENGINE (Aggregator)
// ─────────────────────────────────────────────────────────────────────────

export interface AgroSystemResult {
  governorate: string;
  timestamp: number;

  // Module outputs
  tree_crops: TreeCropsResult;
  vegetables: VegetablesResult;
  water_intel: WaterIntelResult;

  // Aggregate indices
  food_production_risk: number;  // [0,1]
  agro_stress_index: number;  // [0,1]

  // Risk classification
  risk_flag: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // RRI pipeline field updates (all real dot-path fields)
  pipeline_updates: {
    'economy.agriculture': number;
    'economy.food_subsidies': number;
    'social.food_security': number;
    'environment.water_stress': number;
    'environment.desertification': number;
    'environment.drought': number;
    'environment.dam_levels': number;
    'environment.groundwater': number;
  };

  // Shock signals (SEI pattern — pass to calculateRRI overrides)
  rri_shock_magnitude: number;
  rri_salience_boost: number;

  // Special flags
  oasis_collapse_risk: boolean;
  water_crisis: boolean;
  rapid_veg_decline: boolean;
}

export interface AgroNationalSummary {
  results: AgroSystemResult[];
  bci: BCEWMResult;
  national_food_risk: number;
  national_agro_stress: number;
  national_water_stress: number;
  critical_govs: string[];
  oasis_at_risk_govs: string[];
  water_crisis_govs: string[];
  // Aggregate RRI overrides — pass directly to calculateRRI()
  rri_overrides: {
    'economy.agriculture': number;
    'social.food_security': number;
    'environment.water_stress': number;
    'environment.desertification': number;
    'environment.drought': number;
    'environment.dam_levels': number;
    'environment.groundwater': number;
    _sei_shock_magnitude: number;
    _sei_salience_boost: number;
  };
  generated_at: string;
}

/**
 * processAgroSystem()
 *
 * Main aggregation entry point. Runs all modules for one governorate.
 * Pure function — caller applies pipeline updates and shock injection.
 *
 * food_production_risk =
 *   cereal_risk * 0.40 + vegetable_risk * 0.35 +
 *   fruit_risk  * 0.15 + date_risk     * 0.10
 *
 * agro_stress_index =
 *   food_production_risk * 0.50 +
 *   water_stress         * 0.30 +
 *   desertification      * 0.20
 */
export function processAgroSystem(
  input: AgroInputBundle,
  // Wheat stress from existing AgriIntelEngine (pass in rather than recompute)
  wheat_stress_index: number = 0.35
): AgroSystemResult {
  const now = Date.now();
  const gov = input.governorate;

  // ── Run all modules ────────────────────────────────────────────────
  const tree = computeTreeCrops(input);
  const veg = computeVegetables(input);
  const water = computeWaterIntel(input);

  // Cereal risk = wheat_stress_index (from AgriIntelEngine)
  const cereal_risk = wheat_stress_index;

  // ── food_production_risk (GPT formula, correct weights) ───────────
  const food_production_risk = clamp01(
    cereal_risk * 0.40 +
    veg.vegetable_risk * 0.35 +
    tree.tree_crop_risk * 0.15 +   // combined fruit + date risk
    (1 - tree.date_palm_health_index) * 0.10
  );

  // ── agro_stress_index (GPT formula) ───────────────────────────────
  const agro_stress_index = clamp01(
    food_production_risk * 0.50 +
    water.water_stress_composite * 0.30 +
    water.desertification_index * 0.20
  );

  // ── Risk flag ──────────────────────────────────────────────────────
  const risk_flag: AgroSystemResult['risk_flag'] =
    agro_stress_index > 0.75 ? 'CRITICAL' :
      agro_stress_index > 0.55 ? 'HIGH' :
        agro_stress_index > 0.35 ? 'MEDIUM' : 'LOW';

  // ── Pipeline field updates ─────────────────────────────────────────
  // All real dot-path fields from rri_variables.json
  const pipeline_updates = {
    'economy.agriculture': parseFloat((1 - food_production_risk * 0.65).toFixed(4)),
    'economy.food_subsidies': parseFloat(clamp01(food_production_risk * 0.8).toFixed(4)),
    'social.food_security': parseFloat((1 - agro_stress_index).toFixed(4)),
    'environment.water_stress': parseFloat(water.water_stress_composite.toFixed(4)),
    'environment.desertification': parseFloat(water.desertification_index.toFixed(4)),
    'environment.drought': parseFloat(clamp01(cereal_risk * 0.7 + water.water_reserve_index < 0.4 ? 0.3 : 0).toFixed(4)),
    'environment.dam_levels': parseFloat(clamp01(input.dam_level_pct / 100).toFixed(4)),
    'environment.groundwater': parseFloat(input.groundwater_stress.toFixed(4)),
  };

  // ── Shock signals ──────────────────────────────────────────────────
  // Trigger: water_reserve_index < 0.3 AND crop_failure_probability > 0.6
  const compound_trigger =
    water.water_reserve_index < 0.30 && food_production_risk > 0.60;

  // Additional: oasis collapse → regional instability boost
  const oasis_trigger =
    DATE_PALM_GOVS.has(gov) && tree.oasis_viability_score < 0.40;

  const base_shock = agro_stress_index > 0.60
    ? Math.min(0.25, (agro_stress_index - 0.60) * 0.625) : 0;

  const rri_shock_magnitude = parseFloat(Math.min(0.30,
    base_shock +
    (compound_trigger ? 0.10 : 0) +
    (oasis_trigger ? 0.05 : 0)
  ).toFixed(4));

  const rri_salience_boost = parseFloat(Math.min(0.15,
    agro_stress_index * 0.15
  ).toFixed(4));

  return {
    governorate: gov,
    timestamp: now,
    tree_crops: tree,
    vegetables: veg,
    water_intel: water,
    food_production_risk: parseFloat(food_production_risk.toFixed(4)),
    agro_stress_index: parseFloat(agro_stress_index.toFixed(4)),
    risk_flag,
    pipeline_updates,
    rri_shock_magnitude,
    rri_salience_boost,
    oasis_collapse_risk: oasis_trigger,
    water_crisis: water.water_crisis_flag,
    rapid_veg_decline: veg.rapid_deterioration_flag,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 7 — NATIONAL SUMMARY
// ─────────────────────────────────────────────────────────────────────────

/**
 * processAgroNational()
 *
 * Process all governorates + compute national BCI.
 * Returns complete summary with RRI overrides ready to pass to calculateRRI().
 */
export function processAgroNational(
  inputs: Record<string, AgroInputBundle>,
  bciInputs: BCEWMInputs,
  // Per-gov wheat stress from AgriIntelEngine (pass in to avoid recompute)
  wheatStress: Record<string, number> = {}
): AgroNationalSummary {
  const results: AgroSystemResult[] = [];

  for (const [gov, bundle] of Object.entries(inputs)) {
    const ws = wheatStress[gov] ?? 0.35;
    results.push(processAgroSystem(bundle, ws));
  }

  // Area-weighted national averages
  const n = results.length || 1;
  const national_food_risk = clamp01(results.reduce((s, r) => s + r.food_production_risk, 0) / n);
  const national_agro_stress = clamp01(results.reduce((s, r) => s + r.agro_stress_index, 0) / n);
  const national_water_stress = clamp01(results.reduce((s, r) => s + r.water_intel.water_stress_composite, 0) / n);

  // National BCI
  const bci = computeBCI(bciInputs);

  // Flag govs
  const critical_govs = results.filter(r => r.risk_flag === 'CRITICAL').map(r => r.governorate);
  const oasis_at_risk_govs = results.filter(r => r.oasis_collapse_risk).map(r => r.governorate);
  const water_crisis_govs = results.filter(r => r.water_crisis).map(r => r.governorate);

  // Aggregate shocks: max across govs + BCI shock
  const max_gov_shock = Math.max(0, ...results.map(r => r.rri_shock_magnitude));
  const aggregate_shock = clamp01(Math.max(max_gov_shock, bci.epsilon_shock));
  const aggregate_salience = clamp01(Math.max(
    ...results.map(r => r.rri_salience_boost),
    bci.salience_boost
  ));

  // National pipeline overrides (weighted averages of all govs)
  const avg = (field: keyof AgroSystemResult['pipeline_updates']) =>
    parseFloat((results.reduce((s, r) => s + r.pipeline_updates[field], 0) / n).toFixed(4));

  return {
    results,
    bci,
    national_food_risk,
    national_agro_stress,
    national_water_stress,
    critical_govs,
    oasis_at_risk_govs,
    water_crisis_govs,
    rri_overrides: {
      'economy.agriculture': avg('economy.agriculture'),
      'social.food_security': parseFloat(Math.min(avg('social.food_security'), 1 - bci.BCI).toFixed(4)),
      'environment.water_stress': avg('environment.water_stress'),
      'environment.desertification': avg('environment.desertification'),
      'environment.drought': avg('environment.drought'),
      'environment.dam_levels': avg('environment.dam_levels'),
      'environment.groundwater': avg('environment.groundwater'),
      _sei_shock_magnitude: parseFloat(aggregate_shock.toFixed(4)),
      _sei_salience_boost: parseFloat(aggregate_salience.toFixed(4)),
    },
    generated_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 8 — MOCK DATA (testing / development)
// ─────────────────────────────────────────────────────────────────────────

/** Build AgroInputBundle from satellite ingestion outputs + pipeline data */
export function buildAgroInput(
  governorate: string,
  ndvi: number,
  rainfall_anomaly: number,
  soil_moisture: number,
  temperature: number,
  pipelineData: any    // PipelineContext data object
): AgroInputBundle {
  const econ = pipelineData?.economy ?? {};
  const env = pipelineData?.environment ?? {};

  return {
    governorate,
    ndvi,
    ndvi_trend_30d: -0.02,   // placeholder: caller should provide from satellite history
    ndvi_trend_365d: -0.05,   // placeholder
    rainfall_anomaly,
    soil_moisture,
    temperature,
    inflation: econ.inflation ?? 7.1,
    parallel_premium: econ.parallel_market_premium ?? 18,
    food_subsidy_cost: econ.food_subsidies ?? 2.0,
    fx_reserves_days: econ.fx_reserves ?? 84,
    dam_level_pct: env.dam_levels ?? 35,   // % — Tunisia 2026 ~35% average
    groundwater_stress: env.groundwater ?? 0.55,
    flour_sei_score: 0,   // caller injects from seiEngine result
    protest_events_30d: pipelineData?.social?.protest_events_30d ?? 23,
    media_bread_score: 0,   // caller injects from shortageDetector
    queue_reports: 0,
    import_dependency_ratio: 0.55,  // Tunisia imports ~55% of cereal consumption
    port_delay_days: 2,
  };
}

/** Build BCEWMInputs from pipeline data + AgriIntelEngine wheat stress */
export function buildBCEWMInputs(
  wheat_stress_index: number,
  pipelineData: any,
  flour_sei_score: number = 0,
  media_bread_score: number = 0,
  queue_reports: number = 0,
  bci_previous_7d: number = 0
): BCEWMInputs {
  const econ = pipelineData?.economy ?? {};
  const soc = pipelineData?.social ?? {};

  return {
    wheat_stress_index,
    import_dependency_ratio: 0.55,
    stock_depletion: clamp01(1 - econ.fx_reserves / 120),  // proxy: low reserves = depletion risk
    milling_disruption: clamp01((econ.energy_subsidies ?? 2.1) / 5), // STEG debt proxy
    inflation: econ.inflation ?? 7.1,
    food_subsidy_cost: econ.food_subsidies ?? 2.0,
    parallel_premium: econ.parallel_market_premium ?? 18,
    flour_sei_score,
    media_bread_score,
    protest_events_30d: soc.protest_events_30d ?? 23,
    queue_reports,
    bci_previous_7d,
  };
}
