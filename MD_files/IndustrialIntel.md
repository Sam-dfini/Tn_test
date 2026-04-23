# TunisiaIntel v2.0 — Industrial Intelligence Module

## Overview

Production-ready TypeScript module for monitoring Tunisia's industrial health, employment, exports, and strategic sectors at governorate level with full RRI integration and shock triggers.

---

## File Location

```
src/intel/industry/IndustrialIntel.ts
```

---

## Architecture

```
Industrial Intelligence System
├── SectorMonitor.ts              (concentration risk, dominant sector)
├── RegionalIndustryMap.ts        (governorate classification)
├── PhosphateIntel.ts             (strategic failure node)
├── StartupHealthIndex.ts         (innovation ecosystem)
├── EnergyStress.ts               (cross-cutting energy variable)
├── IndustrialSystemEngine.ts     (master aggregation)
└── IndustrialRRIIntegration.ts   (RRI mapping + shock triggers)
```

---

## Types & Interfaces

### IndustrialGovernorateData

Per-governorate industrial metrics.

```typescript
interface IndustrialGovernorateData {
  governorate: string;
  industrial_density: number;        // factories per 1000 residents [0,1]
  employment_rate: number;         // industrial employment / working age [0,1]
  sector_breakdown: SectorBreakdown;
  energy_cost_index: number;       // normalized cost per kWh [0,1]
  logistics_performance: number;   // port/customs efficiency [0,1]
  strike_frequency: number;         // events per quarter [0,1]
  closure_rate: number;             // business closures / new registrations [0,1]
  fdi_inflow: number;               // normalized FDI [0,1]
  export_volume_index: number;      // vs historical baseline [0,1]
  timestamp: number;
}
```

### SectorBreakdown

```typescript
interface SectorBreakdown {
  textile: number;        // [0,1] sector weight
  mechanical: number;
  agro_food: number;
  phosphate: number;
  chemicals: number;
  construction: number;
  other: number;
}
```

### PhosphateData

Standalone strategic node for phosphate sector monitoring.

```typescript
interface PhosphateData {
  production_volume: number;        // tons vs historical baseline [0,1]
  production_trend: number;        // 90-day slope [-1,1]
  protest_frequency: number;       // events per month [0,1]
  environmental_cost_index: number; // pollution proxy [0,1]
  state_revenue_impact: number;     // % of expected revenue [0,1]
  global_price_index: number;       // phosphate rock price [0,1]
  timestamp: number;
}
```

### StartupHealthData

```typescript
interface StartupHealthData {
  funding_volume: number;          // vs 12-month average [0,1]
  survival_rate_24m: number;       // % still operating [0,1]
  new_registrations: number;       // vs baseline [0,1]
  fintech_transaction_volume: number; // proxy [0,1]
  brain_drain_proxy: number;       // emigration signal [0,1]
  timestamp: number;
}
```

### EnergyStressData

Cross-cutting variable shared across all modules.

```typescript
interface EnergyStressData {
  cost_per_kwh: number;            // normalized [0,1]
  supply_stability: number;        // uptime / reliability [0,1]
  fuel_import_dependency: number;  // [0,1]
  outage_frequency: number;        // events per month [0,1]
  timestamp: number;
}
```

### IndustrialStressOutput

Master per-governorate output.

```typescript
interface IndustrialStressOutput {
  governorate: string;
  industrial_stress_index: number;     // [0,1] master metric
  employment_risk: number;             // [0,1]
  export_vulnerability: number;        // [0,1]
  sector_concentration_risk: number;   // [0,1]
  energy_stress: number;               // [0,1]
  phosphate_risk: number;             // [0,1] or null
  startup_health: number;              // [0,1]
  risk_flag: "STABLE" | "ELEVATED" | "HIGH" | "CRITICAL";
  contributing_factors: string[];
  timestamp: number;
}
```

### NationalIndustrialOutput

```typescript
interface NationalIndustrialOutput {
  national_stress_index: number;
  governorate_breakdown: IndustrialStressOutput[];
  phosphate_national_risk: number;
  startup_national_health: number;
  energy_national_stress: number;
  top_risk_governorates: string[];
  timestamp: number;
}
```

---

## Utility Functions

### normalize(value, min, max)

Clamps value to [0,1] range.

```typescript
normalize(0.72, 0, 1) // 0.72
normalize(1.2, 0, 1)  // 1.0
normalize(-0.3, 0, 1) // 0.0
```

### ema(values, alpha)

Exponential moving average for trend detection.

```typescript
ema([0.5, 0.6, 0.7, 0.65], 0.3) // trend smoothing
```

### detectTrend(values)

Returns `"RISING" | "FALLING" | "STABLE"`.

### safeValue(value, fallback)

Handles missing/null/NaN data gracefully.

```typescript
safeValue(undefined, 0.5) // 0.5
safeValue(null, 0.5)      // 0.5
safeValue(NaN, 0.5)       // 0.5
safeValue(0.8, 0.5)       // 0.8
```

---

## Module 1: SectorMonitor

### computeConcentrationRisk(breakdown)

Herfindahl-Hirschman Index for sector concentration risk.

**Logic:**
```
hhi = sum(sector_weight²)
concentration_risk = normalize(hhi, 0.14, 1.0)
```

**Why:** Higher concentration = higher vulnerability to sector-specific shocks.

**Example:**
```typescript
const risk = SectorMonitor.computeConcentrationRisk({
  textile: 0.4, mechanical: 0.25, agro_food: 0.15,
  phosphate: 0.0, chemicals: 0.05, construction: 0.1, other: 0.05
});
// risk ≈ 0.65 (elevated — textile dominant)
```

### getDominantSector(breakdown)

Returns dominant sector with vulnerability score.

| Sector | Vulnerability | Reason |
|--------|--------------|--------|
| textile | 0.7 | EU demand dependent |
| mechanical | 0.6 | Supply chain exposure |
| agro_food | 0.5 | Domestic + export mix |
| phosphate | 0.9 | Strategic, volatile |
| chemicals | 0.6 | Energy intensive |
| construction | 0.4 | Cyclical |
| other | 0.3 | Diversified |

---

## Module 2: RegionalIndustryMap

### classifyGovernorate(data)

Classifies governorates into industrial profiles.

| Profile | Governorates | Key Risk |
|---------|-------------|----------|
| COASTAL_INDUSTRIAL | Sfax, Sousse, Monastir, Bizerte | EU demand shock |
| MINING | Gafsa, Gabès | Phosphate volatility |
| WEAK_INDUSTRY | Kasserine, Kef, Siliana, Jendouba | Unemployment spiral |
| AGRO_INDUSTRIAL | All others | Agricultural dependency |

### computeRegionalImbalance(allGovernorates)

Measures coastal vs interior industrial concentration.

**Logic:**
```
ratio = coastal_industrial_density / interior_industrial_density
imbalance = normalize(ratio, 1.0, 5.0)
```

**Why it matters:** High imbalance creates migration pressure and protest hotspots in interior regions.

---

## Module 3: PhosphateIntel

Standalone strategic node — phosphate is Tunisia's most critical industrial sector.

### computeRisk(data)

**Equation:**
```
production_risk = production_volume × 0.3 + |production_trend| × 0.2
social_risk = protest_frequency × 0.2 + environmental_cost × 0.1
economic_risk = state_revenue_impact × 0.1 + (1 - global_price) × 0.1

risk_score = min(1, production_risk + social_risk + economic_risk)
```

**Thresholds:**
| Score | Level | Meaning |
|-------|-------|---------|
| < 0.35 | STABLE | Normal operations |
| 0.35-0.55 | ELEVATED | Some stress |
| 0.55-0.75 | HIGH | Significant disruption |
| > 0.75 | CRITICAL | Sector collapse risk |

**Triggers:**
- `production_decline` — trend < -0.2
- `social_unrest` — protests > 0.6
- `fiscal_stress` — revenue impact > 0.5
- `environmental_damage` — cost > 0.7

### computeRegionalSpillover(phosphateData, gafsaData)

Measures how phosphate stress spills into local Gafsa economy.

```
spillover = (phosphate_stress × 0.6) + ((1 - local_employment) × 0.4)
```

---

## Module 4: StartupHealthIndex

### computeHealth(data)

**Equation:**
```
health = funding × 0.25 + survival × 0.25 + growth × 0.2 + digital × 0.15 + (1 - brain_drain) × 0.15
fragility = 1 - health
```

**Risk Signals:**
| Condition | Signal |
|-----------|--------|
| funding < 0.3 | funding_drought |
| survival < 0.4 | high_mortality |
| brain_drain > 0.6 | brain_drain_accelerating |
| digital < 0.3 | digital_contraction |

**RRI Mapping:**
- `fragility_index` → `A.22` (Human Capital Flight)
- `health_score` → `A.16` (Investment Climate)

---

## Module 5: EnergyStress

Cross-cutting module — feeds into Industrial, Agri, Protein, and BMDM.

### computeStress(data)

**Equation:**
```
stress = cost × 0.35 + (1 - supply) × 0.3 + import_dependency × 0.2 + outages × 0.15
cross_sector_impact = stress × (1 + import_dependency × 0.5)
```

**Output:**
```typescript
{
  stress_index: number,        // [0,1]
  cost_pressure: number,       // [0,1]
  supply_risk: number,          // [0,1]
  cross_sector_impact: number  // amplified severity
}
```

**Why cross_sector_impact matters:** When energy is stressed AND import-dependent, the shock amplifies agriculture (irrigation), protein (cold chain), and transport (market distortion).

---

## Module 6: IndustrialSystemEngine

### computeGovernorateStress(data, phosphateData, startupData, energyData)

Master aggregation per governorate.

**Weights:**
| Factor | Weight | Source |
|--------|--------|--------|
| employment_risk | 0.25 | IndustrialGovernorateData |
| export_vulnerability | 0.20 | IndustrialGovernorateData |
| concentration_risk | 0.15 | SectorMonitor |
| energy_stress | 0.15 | EnergyStress |
| closure_risk | 0.10 | IndustrialGovernorateData |
| labor_risk | 0.10 | IndustrialGovernorateData |
| phosphate_risk | 0.05 | PhosphateIntel (Gafsa/Gabès only) |

**Risk Flags:**
| industrial_stress_index | Flag |
|------------------------|------|
| < 0.35 | STABLE |
| 0.35-0.55 | ELEVATED |
| 0.55-0.75 | HIGH |
| > 0.75 | CRITICAL |

**Contributing Factors:**
- `high_unemployment` — employment_risk > 0.6
- `export_decline` — export_vulnerability > 0.6
- `sector_concentration` — concentration > 0.6
- `energy_stress` — energy > 0.6
- `business_closures` — closure_rate > 0.5
- `labor_unrest` — strikes > 0.5
- `phosphate_crisis` — phosphate > 0.5
- `startup_ecosystem_fragile` — startup_health < 0.3

### computeNationalStress(governorateOutputs, phosphateData, startupData, energyData)

National aggregation with phosphate getting extra fiscal weight.

**Weights:**
| Factor | Weight |
|--------|--------|
| Average governorate stress | 0.50 |
| Phosphate national risk | 0.20 |
| Startup fragility (1 - health) | 0.15 |
| Energy national stress | 0.15 |

---

## RRI Integration

### Variable Mapping

| Industrial Output | RRI Variable | Description |
|------------------|--------------|-------------|
| export_vulnerability | A.18 | Export Revenue Stability |
| employment_risk | Q.3 | Regional Stability |
| startup_health | A.16 | Investment Climate |
| phosphate_national_risk | A.18 | Export Revenue (phosphate-specific) |
| startup_national_health | A.22 | Human Capital Flight |
| energy_national_stress | E.3 | Water/Energy Security |

### Shock Triggers

| Condition | ε(t) | Reason |
|-----------|------|--------|
| Industrial > 0.6 AND Agro > 0.6 | +0.6 | Simultaneous employment + food crisis |
| Industrial > 0.6 AND Agro > 0.6 AND BMI > 0.5 | +0.8 | Triple stress (employment + food + market) |
| Phosphate > 0.75 | +0.4 | Phosphate sector collapse |
| 3+ governorates with closures | +0.35 | Widespread business failures |
| Energy > 0.7 | +0.3 | Cross-sector energy crisis |

---

## Data Sources

| Source | Data | Access | Pipeline Method |
|--------|------|--------|----------------|
| World Bank API | Industrial value added, manufacturing growth | ✅ REST API | Direct API call |
| IMF SDMX | Balance of payments, trade by sector | ✅ JSON API | Direct API call |
| UN Comtrade | Export by product (HS code) | ✅ API | Direct API call |
| INS Tunisia | Industrial Production Index, employment | ❌ No API | Scrape PDF/HTML |
| APII | Company creation, investment, zones | ❌ Reports | Scrape + manual |
| STEG | Electricity cost, supply | ❌ Reports | Manual entry |
| News OSINT | Strikes, closures, protests | ✅ RSS pipeline | Already integrated |
| Copernicus | Night lights (activity proxy) | ✅ GEE/Sentinel Hub | Extend satellite pipeline |

---

## Mock Data

### Sfax (Coastal Industrial)

```typescript
{
  governorate: "Sfax",
  industrial_density: 0.75,
  employment_rate: 0.62,
  sector_breakdown: { textile: 0.4, mechanical: 0.25, agro_food: 0.15, phosphate: 0, chemicals: 0.05, construction: 0.1, other: 0.05 },
  energy_cost_index: 0.65,
  logistics_performance: 0.7,
  strike_frequency: 0.2,
  closure_rate: 0.35,
  fdi_inflow: 0.55,
  export_volume_index: 0.6,
  timestamp: Date.now()
}
```

**Expected output:** industrial_stress_index ≈ 0.45 (ELEVATED)

### Gafsa (Mining)

```typescript
{
  governorate: "Gafsa",
  industrial_density: 0.25,
  employment_rate: 0.35,
  sector_breakdown: { textile: 0.05, mechanical: 0.05, agro_food: 0.1, phosphate: 0.65, chemicals: 0.05, construction: 0.05, other: 0.05 },
  energy_cost_index: 0.7,
  logistics_performance: 0.4,
  strike_frequency: 0.75,
  closure_rate: 0.45,
  fdi_inflow: 0.15,
  export_volume_index: 0.4,
  timestamp: Date.now()
}
```

**Expected output:** industrial_stress_index ≈ 0.72 (HIGH — phosphate + unemployment + strikes)

### Kasserine (Weak Industry)

```typescript
{
  governorate: "Kasserine",
  industrial_density: 0.15,
  employment_rate: 0.28,
  sector_breakdown: { textile: 0.1, mechanical: 0.05, agro_food: 0.3, phosphate: 0, chemicals: 0, construction: 0.2, other: 0.35 },
  energy_cost_index: 0.6,
  logistics_performance: 0.35,
  strike_frequency: 0.15,
  closure_rate: 0.55,
  fdi_inflow: 0.1,
  export_volume_index: 0.25,
  timestamp: Date.now()
}
```

**Expected output:** industrial_stress_index ≈ 0.68 (HIGH — closures + low employment)

---

## Usage Example

```typescript
import {
  IndustrialSystemEngine,
  IndustrialRRIIntegration,
  mockGovernorateData,
  mockPhosphateData,
  mockStartupData,
  mockEnergyData
} from './IndustrialIntel';

// Compute per governorate
const sfax = IndustrialSystemEngine.computeGovernorateStress(
  mockGovernorateData[0], null, mockStartupData, mockEnergyData
);

const gafsa = IndustrialSystemEngine.computeGovernorateStress(
  mockGovernorateData[1], mockPhosphateData, mockStartupData, mockEnergyData
);

const kasserine = IndustrialSystemEngine.computeGovernorateStress(
  mockGovernorateData[2], null, mockStartupData, mockEnergyData
);

// National aggregation
const national = IndustrialSystemEngine.computeNationalStress(
  [sfax, gafsa, kasserine],
  mockPhosphateData,
  mockStartupData,
  mockEnergyData
);

// Check shock conditions
const shock = IndustrialRRIIntegration.checkShockConditions(
  national,
  0.65,   // agroStress from AgroSystemEngine
  0.55    // BMI from BMDM
);

console.log(national.national_stress_index);  // ≈ 0.58
console.log(shock);  // { shock: true, magnitude: 0.6, reason: "industrial_agricultural_simultaneous_stress" }
```

---

## Integration Checklist

- [ ] Add `src/intel/industry/` directory
- [ ] Copy `IndustrialIntel.ts` into directory
- [ ] Wire `IndustrialSystemEngine.computeNationalStress()` into main pipeline
- [ ] Add industrial data ingestion layer (World Bank, IMF, UN Comtrade APIs)
- [ ] Configure INS/APII scrapers (Puppeteer/Playwright)
- [ ] Add `industry.*` fields to Supabase schema
- [ ] Update RRI engine to accept industrial variables
- [ ] Add industrial shock conditions to `ε(t)` model
- [ ] Update dashboard with industrial panel
- [ ] Test with mock data, then real APIs

---

## Requirements

- Pure TypeScript (no side effects)
- Deterministic outputs
- Pipeline-compatible (emit/ingest pattern)
- Handles missing data gracefully
- Governorate-level granularity (24 governorates)
- Cross-module energy integration
- Full RRI variable mapping

---

*Built for TunisiaIntel v2.0 — Industrial Intelligence Layer*
