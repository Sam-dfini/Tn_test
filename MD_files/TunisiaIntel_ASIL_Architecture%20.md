# TunisiaIntel v2.0 — Agro-Climate Intelligence System (ASIL) + Economic Layers

## System Context

You are extending TunisiaIntel v2.0 into a full **Agro-Climate Intelligence System (ASIL)** with integrated economic monitoring layers.

The system already includes:
- Real-time RSS ingestion pipeline (7-stage deterministic flow)
- 250-variable Revolutionary Risk Index (RRI) model
- React + TypeScript frontend with Supabase realtime
- FastAPI Python backend
- Deterministic 64-bit dual-hash fingerprinting (`art_...` IDs)
- Governorate-level geospatial mapping

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TUNISIAINTEL v2.0                        │
├─────────────────────────────────────────────────────────────┤
│  LAYER 0: Base Intelligence                                 │
│  ├── RSS Ingestion Pipeline (7-stage)                       │
│  ├── Event Normalization & Deduplication                    │
│  ├── Deterministic NLP Enrichment                           │
│  └── RRI Engine (R(t), ε(t) shock model)                    │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Agro-Climate Intelligence (ASIL)                 │
│  ├── TreeCropsIntel.ts (olive, dates)                      │
│  ├── SoilCropsIntel.ts (wheat, rain-fed vs irrigated)      │
│  ├── WaterIntel.ts (reservoirs, evaporation, rainfall)       │
│  ├── DesertificationIntel.ts (multi-year NDVI trend)         │
│  ├── ImportDependencyIntel.ts (food import vulnerability)    │
│  └── AgroSystemEngine.ts (aggregation)                       │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Protein Intelligence                               │
│  ├── ProteinIntel.ts (livestock, poultry, fish)            │
│  └── FeedStress core variable                                │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: Black Market Detection (BMDM)                      │
│  ├── BlackMarketIntel.ts (price gaps, currency distortion)   │
│  └── Shadow economy divergence detection                     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: Food Price Prediction (FPPE)                     │
│  └── FoodPriceEngine.ts (2-8 week forward forecasting)     │
├─────────────────────────────────────────────────────────────┤
│  SATELLITE PIPELINE                                          │
│  ├── geeClient.ts (Google Earth Engine / Copernicus)         │
│  ├── ndviProcessor.ts (Sentinel-2 NDVI)                    │
│  ├── rainfallProcessor.ts (CHIRPS)                           │
│  ├── geoAggregator.ts (governorate-level aggregation)        │
│  └── satelliteIngestion.ts (pipeline emitter)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: ASIL — Agro-Climate Intelligence System

### Module: TreeCropsIntel.ts

**Purpose:** Monitor perennial tree crops (olive, dates, citrus)

**Inputs:**
- `agri.ndvi.{governorate}` — multi-month NDVI trend
- `agri.soil_moisture.{governorate}` — soil moisture proxy
- `agri.temperature.{governorate}` — temperature stress index

**Outputs per governorate:**
```typescript
{
  governorate: string,
  tree_health_index: number,        // [0,1]
  yield_forecast: number,            // tons or relative to historical
  long_term_decline_flag: boolean,   // true if 3+ year NDVI decline
  confidence: number                 // [0,1] based on data quality
}
```

**Core Computations:**
```
tree_health_index = 
  NDVI_6month_mean × 0.5 +
  soil_moisture × 0.3 +
  (1 - temperature_stress) × 0.2

long_term_decline_flag = true if 
  NDVI_trend_slope < -0.05 over 36 months
```

**RRI Mapping:**
- `tree_health_index` → `A.18` (Export Revenue Stability)
- `long_term_decline_flag` → `W.2` (Environmental Degradation)

---

### Module: SoilCropsIntel.ts

**Purpose:** Monitor annual soil crops (wheat, barley, vegetables)

**Split by water source:**

**Rain-fed Crops:**
```
rainfed_stress = 
  rainfall_deficit × 0.6 +
  (1 - NDVI) × 0.4
```

**Irrigated Crops:**
```
irrigation_stress = 
  (1 - water_availability) × 0.7 +
  irrigation_intensity × 0.3
```

**Outputs:**
```typescript
{
  governorate: string,
  rainfed_yield_risk: number,           // [0,1]
  irrigation_dependency_ratio: number,  // [0,1] — structural
  crop_failure_probability: number,       // [0,1]
  wheat_stress_index: number            // [0,1] — specific to wheat
}
```

**RRI Mapping:**
- `wheat_stress_index` → `A.12` (Food Supply Stress)
- `crop_failure_probability` → `A.12` (Food Supply Stress)

**Shock Trigger:**
```
if wheat_stress_index > 0.75:
  ε(t) += 0.15
```

---

### Module: WaterIntel.ts

**Purpose:** Track water system stress

**Inputs:**
- Reservoir levels (if available via API/manual)
- NDVI water proxy (vegetation health as water indicator)
- Rainfall history (CHIRPS 30-day accumulation)
- Temperature (evaporation proxy)

**Core Computations:**
```
water_reserve_index = 
  (current_reservoir / capacity) × 0.5 +  // if available
  rainfall_30day_anomaly × 0.3 +
  (1 - evaporation_loss_rate) × 0.2

// Fallback if no reservoir data:
water_reserve_index = 
  rainfall_30day_anomaly × 0.6 +
  NDVI_water_proxy × 0.4

evaporation_loss_rate = 
  temperature_anomaly × 0.7 +
  wind_speed_anomaly × 0.3
```

**Outputs:**
```typescript
{
  governorate: string,
  water_reserve_index: number,      // [0,1]
  evaporation_loss_rate: number,    // [0,1]
  rainfall_decline_trend: number,   // slope over 90 days
  drought_flag: boolean             // true if water_reserve < 0.3
}
```

**RRI Mapping:**
- `water_reserve_index` → `E.3` (Water Security)
- `drought_flag` → `E.3` (Water Security)

---

### Module: DesertificationIntel.ts

**Purpose:** Detect long-term land degradation

**Method:** Multi-year NDVI trend analysis

**Core Computation:**
```
// 5-year rolling NDVI per governorate
desertification_index = 
  1 - (NDVI_current_year / NDVI_5year_mean)

// Normalize to [0,1]
desertification_index = clamp(desertification_index, 0, 1)
```

**Outputs:**
```typescript
{
  governorate: string,
  desertification_index: number,    // [0,1]
  vegetation_loss_rate: number,     // % per year
  trend_direction: "STABLE" | "DECLINING" | "CRITICAL"
}
```

**RRI Mapping:**
- `desertification_index` → `W.2` (Environmental Degradation)

---

### Module: ImportDependencyIntel.ts

**Purpose:** Measure food import vulnerability

**Inputs:**
- Tunisia food import statistics (INS, Ministry of Agriculture)
- Global grain prices (FAO, World Bank)
- Port activity proxies (if available)
- Currency distortion (from BMDM layer)

**Core Computation:**
```
import_dependency_ratio = 
  imported_food_value / total_food_consumption

supply_risk_score = 
  import_dependency_ratio × 0.4 +
  global_price_volatility × 0.3 +
  currency_distortion × 0.3
```

**Outputs:**
```typescript
{
  national_level: boolean,          // This is national, not governorate
  import_dependency_ratio: number,  // [0,1]
  supply_risk_score: number,        // [0,1]
  wheat_import_dependency: number,  // specific to wheat
  top_risk_commodities: string[]
}
```

**RRI Mapping:**
- `supply_risk_score` → `A.20` (Import Vulnerability)

---

### Module: AgroSystemEngine.ts

**Purpose:** Aggregate all ASIL modules into unified agro-stress signal

**Aggregation:**
```
agro_stress_index = 
  food_production_risk × 0.4 +
  water_stress × 0.3 +
  import_dependency × 0.3

where:
  food_production_risk = 
    (wheat_stress × 0.4) +
    (olive_yield_risk × 0.3) +
    (crop_failure_probability × 0.3)
```

**Outputs:**
```typescript
{
  governorate: string,
  agro_stress_index: number,      // [0,1]
  risk_flag: "LOW" | "MEDIUM" | "HIGH",
  contributing_factors: string[],   // which modules drove the score
  timestamp: number
}
```

**RRI Integration:**
```typescript
updateVariable("A.12", food_production_risk)
updateVariable("E.3", water_stress)
updateVariable("W.2", desertification_index)
updateVariable("A.20", import_dependency)
```

**Compound Shock:**
```
if water_reserve_index < 0.3 AND crop_failure_probability > 0.6:
  ε(t) += 0.25
```

---

## Layer 2: Protein Intelligence System

### Module: ProteinIntel.ts

**Purpose:** Monitor livestock, poultry, and fish systems for protein inflation risk

**System Architecture:**
```
ProteinIntel
 ├── FeedStress (core variable)
 ├── LivestockStress (cattle, sheep)
 ├── PoultryStress (chicken, eggs)
 └── FishStress (coastal + aquaculture)
```

---

### A. FeedStress (علف) — System Core

**Feed Composition:**
- Barley (local + imported)
- Corn (imported — Ukraine/Argentina)
- Soy (imported — Brazil/USA)

**Core Computation:**
```
FeedStress = 
  0.3 × barley_price_index +
  0.3 × corn_price_index +
  0.2 × soy_price_index +
  0.2 × local_fodder_availability

// Where price indices are normalized against 5-year baseline
```

**Data Sources:**
- FAO food price index
- World Bank commodity prices
- Chicago Board of Trade grain futures
- Tunisia Ministry of Agriculture (livestock stats)
- INS inflation data (meat prices)

---

### B. LivestockStress (Red Meat)

**Key Signals:**
- `livestock_feed_price_index`
- `grazing_stress_index` (from NDVI)
- `herd_liquidation_rate`
- `red_meat_price_pressure`

**Core Computation:**
```
LivestockStress = 
  feed_stress × 0.6 +
  grazing_stress × 0.4

grazing_stress = 1 - (pasture_NDVI / historical_pasture_NDVI)
```

**Critical Cycle:**
```
Feed stress ↑ 
→ farmers sell animals (liquidation) 
→ short-term supply ↑, price ↓ (illusion of stability)
→ herd size ↓
→ future shortage ↑↑
→ price explosion
```

---

### C. PoultryStress (Most Sensitive System)

**Key Signals:**
- `poultry_feed_cost` (corn + soy dominant)
- `production_cycle_disruption`
- `egg_supply_index`
- `chicken_price_volatility`

**Core Computation:**
```
PoultryStress = 
  feed_cost × 0.7 +
  production_disruption × 0.3

// Production disruption = energy_price × 0.5 + disease_outbreak × 0.5
```

**Why Most Sensitive:**
- Depends almost entirely on imported feed
- Production cycle = 6-8 weeks (fastest inflation transmitter)
- No grazing buffer — pure input cost system

---

### D. FishStress

**Key Signals:**
- `fish_catch_volume`
- `fuel_cost_pressure`
- `marine_stock_stress`
- `fish_price_index`

**Core Computation:**
```
FishStress = 
  fuel_cost × 0.5 +
  catch_decline × 0.5

catch_decline = 1 - (current_catch / historical_average_catch)
```

**Critical Trigger:**
Fish becomes critical when meat is expensive AND chicken is unstable — substitution effect drives demand spike.

---

### E. Protein Aggregation

```
ProteinStress = 
  0.4 × poultry_stress +
  0.35 × livestock_stress +
  0.25 × fish_stress

ProteinInflationRisk = ProteinStress × import_dependency_multiplier
```

**Outputs:**
```typescript
{
  feed_stress_index: number,        // [0,1]
  livestock_stress: number,         // [0,1]
  poultry_stress: number,           // [0,1]
  fish_supply_stress: number,       // [0,1]
  protein_stress: number,           // [0,1]
  protein_inflation_risk: number    // [0,1]
}
```

**RRI Integration:**
```typescript
updateVariable("O.6", protein_stress)      // Public pressure
updateVariable("A.15", protein_stress)     // Food inflation
```

---

## Layer 3: Black Market Detection Model (BMDM)

### Module: BlackMarketIntel.ts

**Purpose:** Detect divergence between official economy and real market conditions

**Core Insight:**
> Not detecting "illegal trade" — detecting **system divergence** where official prices/availability no longer reflect reality.

---

### Core Equation

```
BMI (Black Market Index) ∈ [0,1]

BMI = 
  0.35 × PriceGap +
  0.25 × AvailabilityGap +
  0.20 × CurrencyDistortion +
  0.20 × InformalSignal
```

---

### Components

**A. PriceGap (Strongest Signal)**
```
PriceGap = (real_market_price - official_price) / official_price

// Products to track:
// - Bread (subsidized vs actual)
// - Chicken
// - Flour
// - Fuel
// - Sugar
```

**Threshold:**
- PriceGap > 0.3 → strong distortion

**B. AvailabilityGap**
```
AvailabilityGap = 
  shortage_report_intensity × 0.4 +
  empty_shelf_signals × 0.3 +
  queue_intensity × 0.3

// Signals from:
// - News mentions: "missing", "rupture", "queue", "mafama chay"
// - Social media posts
// - Field reports
```

**C. CurrencyDistortion (Most Powerful Early Signal)**
```
CurrencyDistortion = (parallel_rate - official_rate) / official_rate

// Tunisia: managed float with 15-20% parallel premium during stress
// This is a TRUST signal — when it diverges, import letters of credit break
```

**Velocity Rule:**
```
if CurrencyDistortion_velocity > 0.1 over 3 days:
  trigger pre-emptive feed stress alert
```

**D. InformalSignal**
```
InformalSignal = 
  0.4 × social_media_mentions +
  0.3 × keyword_spikes +
  0.3 × enforcement_events

// Tunisia dialect keywords:
// "mawjoud ken fil noir" (only available in black market)
// "prix ytir" (prices are flying)
// "mafama chay" (there's nothing)
// "rupture"
// "souk parallèle"
```

---

### Outputs

```typescript
{
  BMI: number,                      // [0,1]
  level: "NORMAL" | "EMERGING" | "ACTIVE" | "BREAKDOWN",
  velocity: number,                 // BMI(t) - BMI(t-7)
  price_gaps: Record<string, number>, // per product
  currency_distortion: number,
  informal_signals: string[]
}
```

**Thresholds:**
| BMI Range | Level | Meaning |
|-----------|-------|---------|
| < 0.3 | NORMAL | Functioning official market |
| 0.3–0.5 | EMERGING | Informal activity increasing |
| 0.5–0.7 | ACTIVE | ⚠️ Parallel market is primary source |
| > 0.7 | BREAKDOWN | 🔥 Official system collapsed |

**Acceleration Alert:**
```
if BMI_velocity > 0.2:
  rapid_distortion_alert = true
```

---

### RRI Integration

```typescript
updateVariable("A.14", BMI)        // Market distortion
updateVariable("O.6", BMI)         // Public anger
```

**Shock Triggers:**
```
if BMI > 0.6:
  ε(t) += 0.3

// Critical combined signal:
if BCI > 0.6 AND BMI > 0.6 AND CurrencyDistortion > 0.25:
  ε(t) += 0.7        // Regime stability threat
```

---

## Layer 4: Food Price Prediction Engine (FPPE)

### Module: FoodPriceEngine.ts

**Purpose:** Predict food prices 2-8 weeks ahead using physical + economic + behavioral signals

**Core Insight:**
> Forward-looking market stress engine. Detects price spikes before they hit the population (before الناس يحسو بيه).

---

### Master Equation

```
FPF(t+Δ) = BasePrice × (1 + SupplyShock + CostPressure + MarketDistortion + BehavioralPressure)

// Where Δ = product-specific delay (1-8 weeks)
```

---

### Components

**A. SupplyShock (from AgriIntel)**
```
SupplyShock = 
  0.5 × production_drop +
  0.3 × seasonal_factor +
  0.2 × stock_depletion

// production_drop from NDVI, rainfall, crop failure probability
// seasonal_factor = crop calendar phase (harvest/dormancy/planting)
// stock_depletion = inventory drawdown rate
```

**B. CostPressure (from ProteinIntel + Energy)**
```
CostPressure = 
  0.4 × feed_cost +
  0.3 × fuel_price +
  0.3 × import_cost

// import_cost = global_price × exchange_rate
```

**C. MarketDistortion (from BMDM)**
```
MarketDistortion = 
  0.6 × BMI +
  0.4 × availability_gap

// If official system fails, prices jump faster than supply would suggest
```

**D. BehavioralPressure (Social/Expectation)**
```
BehavioralPressure = 
  0.5 × panic_buying +
  0.3 × hoarding +
  0.2 × expectation_inflation

// Proxies:
// - Social media velocity ("mafama chay", "prix ytir")
// - Google Trends Tunisia ("prix pain", "prix djej", "farine")
// - News sentiment (INS reports + independent media)
// - Wholesale market bid-ask spreads (Tunis, Sfax, Sousse)
```

---

### Product-Specific Time Dynamics

| Product | Delay (Δ) | Driver | Volatility |
|---------|-----------|--------|------------|
| Vegetables | 1-2 weeks | Weather, transport | High |
| Chicken | 2-4 weeks | Feed cost | Medium-High |
| Meat | 1-3 months | Herd cycle | Medium |
| Bread | Subsidy-buffered, then sudden | Wheat import, FX | Low → Sudden |
| Fish | 1-2 weeks | Fuel, catch | Medium |

---

### Outputs per Product

```typescript
{
  product: string,                    // "chicken", "bread", "meat", etc.
  current_price: number,              // TND per kg/unit
  predicted_price_2w: number,
  predicted_price_4w: number,
  predicted_price_8w: number,
  volatility: number,                 // standard deviation of predictions
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  confidence: number,               // [0,1] based on input data quality
  contributing_factors: string[]      // which signals drove the prediction
}
```

---

### Alert Triggers

```
// Price spike alert
if predicted_increase > 20%:
  trigger_alert("PRICE_SPIKE", product, predicted_price)

// Cascade alert (food system shock)
if vegetables_risk == "HIGH" AND chicken_risk == "HIGH" AND bread_risk == "HIGH":
  trigger_alert("FOOD_SYSTEM_SHOCK")
  ε(t) += 0.5

// Cross-product contagion
if chicken_price_predicted ↑:
  fish_demand_predicted ↑
  fish_price_predicted ↑
```

---

### RRI Integration

```typescript
updateVariable("A.15", max_predicted_inflation)    // Food inflation
updateVariable("O.6", behavioral_pressure)           // Public pressure
```

---

## Satellite Data Pipeline

### Module: satelliteIngestion.ts

**Purpose:** Fetch and process real satellite data for agriculture monitoring

**Data Sources:**
- **Sentinel-2 (NDVI):** `COPERNICUS/S2_SR` via Google Earth Engine or Copernicus Data Space
- **CHIRPS (Rainfall):** `UCSB-CHG/CHIRPS/DAILY`
- **SMAP (Soil Moisture):** Or proxy via NDVI + rainfall

**File Structure:**
```
src/pipeline/satellite/
├── geeClient.ts              // Google Earth Engine / Copernicus connection
├── ndviProcessor.ts          // Sentinel-2 NDVI calculation
├── rainfallProcessor.ts      // CHIRPS rainfall aggregation
├── geoAggregator.ts          // Governorate-level zonal statistics
└── satelliteIngestion.ts     // Main pipeline orchestrator
```

**NDVI Calculation:**
```
NDVI = (NIR - RED) / (NIR + RED)
// Sentinel-2: B8 = NIR, B4 = RED
```

**Filters:**
- Time range: last 7 days (expand to 14 if cloud cover > 20%)
- Cloud filter: < 20% cloudy pixel percentage
- Composite method: median (not mean) to reduce outlier impact

**Governorate Aggregation:**
```
For each governorate in tunisia_governorates.geojson:
  1. Clip NDVI image to governorate boundary
  2. Compute mean NDVI (zonal statistics)
  3. Output: { governorate: "Kairouan", ndvi: 0.62 }
```

**Pipeline Emission:**
```typescript
emit("agri.ndvi.{governorate}", ndvi_value)
emit("agri.rainfall_anomaly.{governorate}", rainfall_anomaly)
emit("agri.soil_moisture.{governorate}", soil_moisture_proxy)
```

**Scheduling:**
- NDVI: every 3-7 days
- Rainfall: daily
- Aggregation: real-time on ingestion

**Performance:**
- Cache results to avoid redundant API calls
- Batch governorate processing
- Handle API rate limits with exponential backoff

---

## Copernicus / Sentinel Hub Integration

### Connection Options

**Option A: OpenEO Python Client (Server-side processing)**
- Best for: Processing without downloading raw imagery
- Connect: `openeo.dataspace.copernicus.eu`
- Auth: OAuth2 (browser flow first time, then token refresh)

**Option B: Sentinel Hub API (TypeScript/Node integration)**
- Best for: Direct API calls from your pipeline
- Base URL: `https://sh.dataspace.copernicus.eu/api/v1`
- Auth: OAuth2 client credentials flow
- Returns: Processed NDVI (not raw bands), cloud masked server-side

**Option C: STAC API + Earth Search (Cloud-native access)**
- Best for: Direct cloud-native loading
- API: `https://earth-search.aws.element84.com/v1`
- No auth for search, direct xarray loading

**Recommendation for TunisiaIntel:**
- **FastAPI backend:** Use OpenEO Python client for heavy processing
- **TypeScript pipeline:** Use Sentinel Hub API for quick statistical queries
- **Cache layer:** Redis/Supabase to store results, avoid redundant calls

**Critical Notes:**
- Always use **SENTINEL2_L2A** (atmospherically corrected)
- Use temporal compositing (median over 7-14 days) for cloudy regions
- Governorate aggregation via Statistical API (zonal stats, no raster download)

---

## System Integration & Shock Model

### Full Signal Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AgriIntel     │────►│   ProteinIntel  │────►│      BMDM       │
│  (physical)     │     │  (economic)     │     │  (distortion)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │      FPPE       │
                    │  (prediction)   │
                    └─────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │  AgroSystemEngine │
                    │   (aggregation)   │
                    └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌─────────┐  ┌─────────┐  ┌─────────┐
              │  A.12   │  │  O.6    │  │  ε(t)   │
              │ Food    │  │ Public  │  │ Shock   │
              │ Supply  │  │ Pressure│  │ Model   │
              └─────────┘  └─────────┘  └─────────┘
```

### Combined Shock Conditions

```
// Basic food crisis
if BCI > 0.6:
  ε(t) += 0.3

// Protein crisis
if protein_stress > 0.6:
  ε(t) += 0.3

// Black market active
if BMI > 0.6:
  ε(t) += 0.3

// System failure (combined)
if BCI > 0.6 AND BMI > 0.6:
  ε(t) += 0.5

// Regime stability threat (triple)
if BCI > 0.6 AND BMI > 0.6 AND CurrencyDistortion > 0.25:
  ε(t) += 0.7

// Food system shock (cascade)
if vegetables_risk == "HIGH" AND chicken_risk == "HIGH" AND bread_risk == "HIGH":
  ε(t) += 0.5
```

---

## Data Sources & Availability

| Data | Source | Availability | Reliability |
|------|--------|------------|-------------|
| NDVI | Sentinel-2 (Copernicus) | High | Cloud gaps |
| Rainfall | CHIRPS | High | 5-day delay |
| Soil Moisture | SMAP or proxy | Medium | Sparse coverage |
| Feed Prices | FAO / World Bank | Medium | Monthly |
| Grain Futures | CBOT | High | Daily |
| Tunisia Inflation | INS | Medium | Monthly |
| Parallel FX | Informal channels | Low | Noisy, restricted |
| Wholesale Prices | Tunisian markets | Low | No API |
| Social Media | Twitter/X, Facebook | Medium | Platform restrictions |
| Reservoir Levels | Ministry of Agriculture | Low | Manual/seasonal |

---

## Implementation Priority

**Phase 1 (Operational):**
1. AgriIntel (NDVI + rainfall + soil moisture)
2. SoilCropsIntel + TreeCropsIntel
3. WaterIntel
4. Basic RRI integration

**Phase 2 (Economic Layer):**
5. ProteinIntel (feed stress core)
6. ImportDependencyIntel
7. Enhanced RRI coupling

**Phase 3 (Market Intelligence):**
8. BMDM (manual inputs for parallel FX, shortage reports)
9. FPPE as scenario engine (what-if, not prediction)

**Phase 4 (Predictive):**
10. Real BMDM data sources
11. FPPE as true predictive model
12. Cross-product contagion modeling

---

## Technical Requirements

- **Pure TypeScript** (no side effects in computation layer)
- **Deterministic outputs** (same inputs = same outputs)
- **Pipeline-compatible** (emit/ingest pattern)
- **Handles missing data** (fallback values, not null drops)
- **Memoized calculations** where possible
- **No external APIs directly** (assume pipeline provides cleaned data)
- **Modular** (each module independent, testable)
- **Governorate-level granularity** (24 governorates)
- **Real-time capable** (WAL → WebSocket → React state)

---

## RRI Variable Mapping Summary

| Module | Output | RRI Variable | Description |
|--------|--------|--------------|-------------|
| AgriIntel | wheat_stress_index | A.12 | Food Supply Stress |
| AgriIntel | olive_yield_forecast | A.18 | Export Revenue Stability |
| AgriIntel | rural_stability_score | Q.3 | Regional Stability |
| WaterIntel | water_reserve_index | E.3 | Water Security |
| DesertificationIntel | desertification_index | W.2 | Environmental Degradation |
| ImportDependencyIntel | supply_risk_score | A.20 | Import Vulnerability |
| ProteinIntel | protein_stress | O.6 | Public Pressure |
| ProteinIntel | protein_stress | A.15 | Food Inflation |
| BMDM | BMI | A.14 | Market Distortion |
| BMDM | BMI | O.6 | Public Anger |
| FPPE | predicted_inflation | A.15 | Food Inflation |
| FPPE | behavioral_pressure | O.6 | Public Pressure |

---

## Deliverables Expected

1. Full TypeScript implementation of all modules
2. Helper functions (normalize, computeX, computeY)
3. Integration examples with RRI engine (`updateVariable()`)
4. Satellite pipeline implementation (Python TypeScript)
5. Mock data inputs + expected outputs
6. Unit tests for deterministic behavior
7. Pipeline emit examples
8. Error handling (missing data, schema mismatch)

---

*Built for TunisiaIntel v2.0 — Production-grade environmental and economic intelligence system.* 
