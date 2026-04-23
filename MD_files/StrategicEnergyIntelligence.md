# TunisiaIntel v2.0 — Strategic Energy Intelligence Module (SEIM)

## System Context

You are extending TunisiaIntel v2.0 with a **Strategic Energy Intelligence Module (SEIM)** that monitors Tunisia's complete energy ecosystem as a **national security and stability variable**.

Energy is not just an economic input. In Tunisia, energy is:
- **Fiscal anchor** (subsidies = 15-20% of state budget)
- **Social contract** (cheap bread, cheap butane, cheap electricity)
- **Geopolitical vulnerability** (100% oil import dependence, 60% gas import dependence)
- **Seasonal flashpoint** (summer blackouts, winter butane queues)
- **War shock amplifier** (Ukraine war → European gas scramble → Tunisia squeezed)

---

## Strategic Architecture

```
Energy Intelligence Pyramid
┌─────────────────────────────────────────┐
│  LAYER 4: STRATEGIC RESILIENCE          │
│  • National Energy Security Index       │
│  • Subsidy Collapse Risk                │
│  • Social Contract Breach Probability     │
│  • Regime Stability Threat              │
├─────────────────────────────────────────┤
│  LAYER 3: MARKET & GEOPOLITICS          │
│  • Global Fuel Shock Detection          │
│  • War Impact Transmission              │
│  • Contract Renegotiation Risk          │
│  • Green Transition Stress              │
├─────────────────────────────────────────┤
│  LAYER 2: INFRASTRUCTURE & SUPPLY       │
│  • STEG Grid Stability                  │
│  • Butane Distribution Network          │
│  • Liquid Fuel Logistics                │
│  • Generator Dependency (formal+informal) │
├─────────────────────────────────────────┤
│  LAYER 1: PRODUCTION & EXTRACTION       │
│  • Domestic Oil/Gas Fields              │
│  • ETAP Production Volumes              │
│  • Exploration Contracts                │
│  • Field Depletion Rates                │
├─────────────────────────────────────────┤
│  LAYER 0: CONSUMPTION PATTERNS          │
│  • Seasonal Demand Cycles               │
│  • Governorate Consumption Maps         │
│  • Sectoral Breakdown (industry/household)│
│  • Informal Consumption (generators)    │
└─────────────────────────────────────────┘
```

---

## Core Insight: Energy as Social Contract

Tunisia's post-independence social contract rests on three subsidized pillars:

| Pillar | Subsidy Cost | Breach Trigger | Social Impact |
|--------|-------------|----------------|---------------|
| **Bread** (wheat) | ~$500M/year | Import price spike + FX crisis | Immediate riots |
| **Butane** (LPG) | ~$400M/year | Global LPG price + supply disruption | Winter queues, domestic crisis |
| **Electricity** | ~$1B/year | Gas supply cut + STEG deficit | Summer blackouts, industrial halt |

**The energy module must track all three as interconnected breach risks.**

When one pillar weakens, pressure transfers to the others:
```
Electricity price ↑ → households switch to butane for cooking/heating → butane demand ↑
Butane shortage → households switch to electricity → grid load ↑ → blackouts
Both failing → generators proliferate → diesel demand ↑ → import bill ↑ → FX pressure ↑
```

---

## Module 1: National Energy Security Index (NESI)

### Master Equation

```
NESI = 
  0.20 × ImportDependenceRisk +
  0.20 × SubsidySustainability +
  0.15 × SupplyDiversification +
  0.15 × InfrastructureResilience +
  0.15 × SeasonalStress +
  0.15 × GeopoliticalVulnerability
```

**NESI ∈ [0,1]** where:
- 0.00-0.30: **Secure** — diversified, sustainable, resilient
- 0.30-0.50: **Vulnerable** — single points of failure emerging
- 0.50-0.70: **Stressed** — active supply risks, subsidy strain
- 0.70-1.00: **Critical** — imminent collapse, social contract breach

---

### Component 1: Import Dependence Risk

```
ImportDependenceRisk = 
  0.35 × oil_import_ratio +
  0.35 × gas_import_ratio +
  0.20 × refined_product_import_ratio +
  0.10 × strategic_reserve_coverage

// oil_import_ratio = imported_oil / total_oil_consumption
// gas_import_ratio = imported_gas / total_gas_consumption  
// refined_product = gasoline/diesel/jet fuel imports
// strategic_reserve = days of consumption covered
```

**Tunisia Baseline:**
| Fuel | Import Dependence | Source Countries | Risk Level |
|------|------------------|------------------|------------|
| Crude Oil | 100% | Algeria, Libya, Azerbaijan, Russia | 🔴 Critical |
| Natural Gas | 60% | Algeria (via pipeline) | 🟠 High |
| Refined Products | 40% | EU refineries | 🟡 Elevated |
| LPG (Butane) | 70% | Algeria, Libya | 🟠 High |

**War Shock Scenario (Ukraine-style disruption):**
```
If global_gas_price ↑ 200%:
  → Algeria redirects supply to Europe at premium
  → Tunisia pipeline contract renegotiated (worse terms)
  → gas_import_ratio effectively becomes 80%+
  → ImportDependenceRisk jumps from 0.55 → 0.82
  → NESI crosses 0.70 threshold
```

---

### Component 2: Subsidy Sustainability

```
SubsidySustainability = 
  1 - (subsidy_burden / fiscal_capacity)

subsidy_burden = 
  electricity_subsidy +
  butane_subsidy +
  fuel_price_stabilization +
  bread_subsidy (linked via wheat imports)

fiscal_capacity = 
  tax_revenue + 
  borrowing_capacity + 
  foreign_assistance
```

**Tunisia Reality:**
- Energy subsidies = ~7-8% of GDP
- State budget deficit = persistent
- IMF negotiations = ongoing conditionality
- **Subsidy reform = political suicide** (2011 revolution triggered partly by bread prices)

**Subsidy Collapse Indicators:**
| Indicator | Threshold | Meaning |
|-----------|-----------|---------|
| subsidy/GDP > 10% | 🔴 | Fiscal crisis, IMF forced reform |
| FX reserves < 3 months imports | 🔴 | Cannot pay for fuel imports |
| parallel FX premium > 30% | 🔴 | Real import cost exploding |
| IMF program suspended | 🔴 | No external financing buffer |

---

### Component 3: Supply Diversification

```
SupplyDiversification = 
  0.4 × source_country_diversity +
  0.3 × route_diversity +
  0.2 × contract_flexibility +
  0.1 × domestic_production_ratio

// source_country_diversity = Herfindahl index of import sources
// route_diversity = pipeline vs LNG vs tanker
// contract_flexibility = spot vs long-term, take-or-pay clauses
// domestic_production = ETAP oil + gas / total consumption
```

**Tunisia Vulnerability:**
- **Gas:** Single pipeline from Algeria (Trans-Med). No LNG terminal. No alternative route.
- **Oil:** Multiple sources but all via tanker (Strait of Gibraltar / Suez exposure)
- **Butane:** Algeria dominant. Libya intermittent (security).

**Diversification Score:** ~0.25 (Very Low)

---

### Component 4: Infrastructure Resilience

```
InfrastructureResilience = 
  0.3 × grid_stability +
  0.25 × generation_capacity_margin +
  0.2 × storage_capacity +
  0.15 × maintenance_backlog +
  0.1 × cyber_security_index
```

**STEG (Société Tunisienne de l'Électricité et du Gaz) Reality:**
| Factor | Status | Risk |
|--------|--------|------|
| Generation mix | 95% gas-fired | 🔴 Single fuel dependency |
| Grid losses | ~15% | 🟠 Technical + theft |
| Maintenance | Chronic underinvestment | 🟠 Aging plants |
| Peak demand | Summer AC surge | 🟡 Seasonal stress |
| Renewable share | ~3% | 🔴 Far below potential |

**Critical Infrastructure Nodes:**
- **Rades power plant** (near Tunis) — largest gas-fired plant
- **Trans-Med pipeline** (Algeria→Italy via Tunisia) — Tunisia gets transit + supply
- **La Skhira refinery** — only refinery, capacity constraints
- **Butane bottling plants** — distribution bottleneck

---

### Component 5: Seasonal Stress

```
SeasonalStress = max(summer_electricity_stress, winter_butane_stress)

summer_electricity_stress = 
  (peak_demand / generation_capacity) × 
  (temperature_anomaly / historical_max) ×
  (hydro_availability / normal)

winter_butane_stress = 
  (heating_demand_surge / distribution_capacity) ×
  (import_delivery_lag / normal_lag) ×
  (strategic_stock / minimum_required)
```

**Summer Pattern (June-September):**
- Temperatures 35-45°C
- AC load spikes
- Peak demand can exceed generation capacity → rolling blackouts
- Industrial users forced to curtail (economic cost)
- **Stress signal:** `summer_electricity_stress > 0.7` → blackouts likely

**Winter Pattern (November-March):**
- Heating demand via butane (no natural gas grid to homes)
- Butane bottle distribution bottlenecks
- Queue formation at distribution points
- Black market price surges
- **Stress signal:** `winter_butane_stress > 0.6` → queues and social tension

---

### Component 6: Geopolitical Vulnerability

```
GeopoliticalVulnerability = 
  0.3 × neighbor_stability +
  0.25 × global_energy_market_tension +
  0.2 × transit_route_risk +
  0.15 × supplier_reliability +
  0.1 × sanction_exposure

// neighbor_stability = Algeria political risk + Libya security risk
// global_tension = Ukraine/Russia, Middle East, Hormuz Strait
// transit_route = Mediterranean piracy, Suez disruption
// supplier_reliability = Algeria contract adherence, Libya consistency
// sanction_exposure = secondary sanctions if dealing with Russia/Iran
```

**Tunisia's Geopolitical Position:**
- **Algeria:** Stable but aging leadership transition risk. Gas contract renegotiation pressure.
- **Libya:** Perpetual instability. Oil smuggling affects Tunisian market. Refugee flows strain resources.
- **Europe:** Tunisia's main export market. European energy crisis = Tunisian economic crisis.
- **Russia:** Pre-war oil supplier. Post-war sanctions complicate relations.

---

## Module 2: Fuel Shock Detection System

### Global Fuel Shock Pipeline

**Inputs:**
| Source | Data | Refresh | Method |
|--------|------|---------|--------|
| Brent crude futures | $/barrel | Real-time | API (Yahoo Finance, Investing.com) |
| TTF gas futures | €/MWh | Real-time | API (ICE, EEX) |
| Algeria gas spot | $/MMBtu | Daily | Scraped / manual |
| LPG (butane) ARA | $/ton | Daily | Platts / Argus (subscription) |
| Diesel/gasoline barge | $/ton | Daily | Platts / Argus |
| Freight rates (tanker) | $/day | Daily | Baltic Exchange API |

**Shock Detection Algorithm:**

```typescript
class FuelShockDetector {
  private priceHistory: Map<string, number[]> = new Map();
  private shockThreshold = 0.20; // 20% move in 5 days

  detectShock(commodity: string, currentPrice: number): FuelShock | null {
    const history = this.priceHistory.get(commodity) || [];
    if (history.length < 5) return null;

    const baseline = ema(history.slice(-20), 0.1); // 20-day EMA
    const velocity = (currentPrice - baseline) / baseline;
    const acceleration = velocity - ((history[history.length-1] - history[history.length-5]) / history[history.length-5]);

    if (Math.abs(velocity) > this.shockThreshold) {
      return {
        commodity,
        velocity,
        acceleration,
        severity: this.classifySeverity(velocity),
        transmissionLag: this.estimateTransmissionLag(commodity),
        tunisiaImpact: this.calculateTunisiaImpact(commodity, velocity)
      };
    }
    return null;
  }

  private classifySeverity(velocity: number): "ELEVATED" | "HIGH" | "CRITICAL" {
    if (velocity > 0.50) return "CRITICAL";   // +50% in 5 days
    if (velocity > 0.30) return "HIGH";         // +30%
    return "ELEVATED";                          // +20%
  }

  private estimateTransmissionLag(commodity: string): number {
    // Days until price change hits Tunisia consumer
    const lags: Record<string, number> = {
      "brent_crude": 15,      // Tanker voyage + refinery + distribution
      "natural_gas": 30,      // Pipeline contract renegotiation
      "lpg_butane": 20,       // Tanker + bottling + distribution
      "diesel": 10,           // Direct import, faster distribution
      "gasoline": 10,
    };
    return lags[commodity] || 21;
  }

  private calculateTunisiaImpact(commodity: string, velocity: number): number {
    // Tunisia-specific vulnerability multiplier
    const multipliers: Record<string, number> = {
      "brent_crude": 1.0,     // Full pass-through (no hedge)
      "natural_gas": 1.2,     // Algeria contract vulnerability
      "lpg_butane": 1.3,      // Subsidy burden amplifies
      "diesel": 0.9,          // Some smuggling buffer
      "gasoline": 0.8,        // Price cap delays pass-through
    };
    return velocity * (multipliers[commodity] || 1.0);
  }
}
```

**Shock Types:**

| Type | Trigger | Tunisia Lag | Impact |
|------|---------|-------------|--------|
| **War Shock** | Ukraine-style disruption | 15-30 days | Gas redirect, price spike |
| **Sanction Shock** | Iran/Russia sanctions | 7-14 days | Supply rerouting, premium |
| **Hormuz Closure** | Strait blocked | 30-60 days | Oil tanker reroute, freight surge |
| **Algeria Crisis** | Political transition | 30-90 days | Gas contract freeze |
| **Libya Collapse** | Civil war restart | 7-21 days | Oil smuggling chaos, border stress |

---

## Module 3: Butane Intelligence System

### The Butane Bottleneck

Butane (LPG) is Tunisia's **most socially sensitive fuel**:
- 80% of households use butane for cooking
- 40% use butane for water heating
- No piped natural gas to residential areas
- Distribution: state-controlled bottling plants → trucks → retailers

**Butane Stress Index (BSI):**

```
BSI = 
  0.30 × import_price_pressure +
  0.25 × distribution_bottleneck +
  0.20 × seasonal_demand_surge +
  0.15 × strategic_stock_level +
  0.10 × smuggling_drain

import_price_pressure = (global_lpg_price - subsidy_ceiling) / subsidy_ceiling
distribution_bottleneck = queue_length_index + delivery_delay_index
seasonal_demand = (current_demand - baseline) / baseline
strategic_stock = days_of_consumption_covered / 30_days_target
smuggling_drain = estimated_libya_smuggle_volume / total_imports
```

**Social Breach Thresholds:**

| BSI | Condition | Social Response |
|-----|-----------|-----------------|
| < 0.3 | Normal | No queues, stable price |
| 0.3-0.5 | Tight | Occasional shortages, longer queues |
| 0.5-0.7 | Critical | Persistent queues, black market active, protests |
| > 0.7 | Collapse | Rationing, violence at distribution points, riots |

**Butane Black Market Detection:**
```
ButaneBlackMarket = 
  0.4 × (black_market_price / official_price - 1) +
  0.3 × queue_intensity +
  0.2 × social_media_mentions("bouteille gaz", "mafama gaz") +
  0.1 × retailer_reported_shortages
```

---

## Module 4: Generator Stress Index

### The Informal Power Grid

Tunisia has a **parallel electricity system**: private generators.

**Formal Generators:**
- Hospitals, banks, telecoms, industry
- Diesel/gas backup units
- Triggered by STEG outages

**Informal Generators:**
- Neighborhood-level diesel units ("groupe électrogène")
- Shops, restaurants, small industry
- Run during daily load shedding
- **Not metered, not taxed, not tracked**

**Generator Stress Index (GSI):**

```
GSI = 
  0.35 × outage_frequency +
  0.25 × generator_diesel_consumption_estimate +
  0.20 × informal_generator_proliferation +
  0.15 × diesel_price_pressure +
  0.05 × noise_complaint_index (proxy for density)

// diesel_consumption_estimate = 
//   (number_of_generators × avg_capacity × runtime_hours) / total_diesel_imports

// informal_proliferation = 
//   google_trends("groupe électrogène") + 
//   social_media_mentions("coupure courant") +
//   diesel_retail_sales_anomaly
```

**Critical Insight:**
```
GSI > 0.6 → generators become primary power source for significant population
→ diesel demand spikes → import bill surges → FX pressure
→ STEG revenue collapses (customers self-supply) → utility death spiral
→ state loses control of energy sector
```

---

## Module 5: Oil & Gas Extraction Monitor

### Domestic Production Reality

**ETAP (Entreprise Tunisienne d'Activités Pétrolières):**

| Field | Type | Status | Production Trend |
|-------|------|--------|------------------|
| El Borma | Oil + Gas | Mature | Declining 5%/year |
| Ashtart | Oil | Mature | Declining 8%/year |
| Nawara | Gas | New (2019) | Stable |
| Baguel | Gas | Development | Increasing |
| Offshore | Oil prospects | Exploration | Uncertain |

**Production Math:**
```
domestic_oil_production = 40,000 bbl/day (declining)
domestic_gas_production = 2.5 bcm/year (stable)
total_consumption_oil = 90,000 bbl/day
total_consumption_gas = 6.0 bcm/year

domestic_sufficiency_oil = 44%
domestic_sufficiency_gas = 42%
```

**Exploration Contract Monitor:**

Track:
- **Active licenses** (blocks awarded to Eni, Shell, OMV, etc.)
- **Work program commitments** (drilling obligations)
- **Discovery announcements** (new reserves)
- **Contract renegotiations** (fiscal terms, extensions)
- **Farm-in/farm-out** deals (risk sharing)

**Contract Risk Signals:**
| Signal | Meaning |
|--------|---------|
| Major IOC exits | No commercial viability, political risk |
| Work program delays | Technical challenges or funding issues |
| Fiscal term disputes | Government desperate for revenue |
| New licensing rounds | Trying to attract investment |

---

## Module 6: Green Transition Stress

### The Renewable Paradox

Tunisia has **massive renewable potential**:
- Solar: 3,000+ hours/year sunshine
- Wind: Strong coastal winds
- But: **Green transition creates short-term stress**

**Transition Stress Index (TSI):**

```
TSI = 
  0.30 × (renewable_investment_gap / target) +
  0.25 × grid_integration_cost +
  0.20 × fossil_fuel_stranded_asset_risk +
  0.15 × just_transition_cost (worker retraining, community support) +
  0.10 × international_pressure_index (EU Green Deal, CBAM)
```

**Critical Tensions:**
1. **Subsidies trap:** Cheap fossil fuels discourage renewable investment
2. **Grid capacity:** STEG cannot absorb intermittent solar/wind without storage
3. **Financing:** No green bond market, limited international climate finance
4. **Skills gap:** Workforce trained for fossil, not renewable
5. **EU CBAM:** Carbon border tax will hit Tunisian exports by 2026

**Green Opportunity Signals:**
- Desertec/North African solar export to Europe
- Green hydrogen pilot projects
- EU Just Transition partnership funds

---

## Module 7: Company & Contract Intelligence

### Key Actors to Monitor

| Company | Role | What to Track |
|---------|------|---------------|
| **ETAP** | State oil company | Production volumes, revenue, debt, exploration activity |
| **STEG** | State electricity/gas | Financial health, outage frequency, investment plans |
| **STIR** | State refining | Refinery runs, product yields, maintenance schedule |
| **Eni (Italy)** | Major IOC | El Borma operations, new exploration, contract disputes |
| **Shell** | IOC | Offshore exploration, license status |
| **OMV** | IOC | Nawara gas field, pipeline operations |
| **Sonatrach (Algeria)** | Gas supplier | Contract negotiations, delivery volumes, price disputes |
| **TotalEnergies** | IOC | Solar projects, LNG interest |
| **Tunisian government** | Regulator | Subsidy decisions, price adjustments, IMF negotiations |

**Contract Intelligence:**
- Gas purchase agreement (GPA) with Sonatrach: volume, price formula, take-or-pay
- Trans-Med pipeline transit agreement: tariff, capacity, duration
- ETAP production sharing contracts: fiscal terms, cost recovery
- Renewable energy concessions: feed-in tariff, grid connection

---

## Master Aggregation: EnergySystemEngine

### Compute National Energy Security

```typescript
class EnergySystemEngine {
  static computeNationalEnergySecurity(
    nesComponents: NESIComponents,
    fuelShocks: FuelShock[],
    butaneData: ButaneData,
    generatorData: GeneratorData,
    extractionData: ExtractionData,
    greenData: GreenTransitionData
  ): EnergySecurityOutput {

    // 1. NESI base
    const nesi = 
      nesComponents.importDependence * 0.20 +
      nesComponents.subsidySustainability * 0.20 +
      nesComponents.supplyDiversification * 0.15 +
      nesComponents.infrastructureResilience * 0.15 +
      nesComponents.seasonalStress * 0.15 +
      nesComponents.geopoliticalVulnerability * 0.15;

    // 2. Fuel shock amplification
    const shockAmplifier = fuelShocks.reduce((max, shock) => {
      const impact = shock.tunisiaImpact;
      return impact > max ? impact : max;
    }, 0);

    // 3. Butane social stress
    const butaneStress = butaneData.BSI;

    // 4. Generator informalization
    const generatorStress = generatorData.GSI;

    // 5. Extraction decline
    const extractionStress = 1 - extractionData.domesticSufficiencyRatio;

    // 6. Green transition gap
    const greenStress = greenData.TSI;

    // Master Energy Stress Index
    const energyStressIndex = Math.min(1, 
      nesi * 0.35 +
      shockAmplifier * 0.25 +
      butaneStress * 0.15 +
      generatorStress * 0.10 +
      extractionStress * 0.10 +
      greenStress * 0.05
    );

    // Social contract breach probability
    const socialContractBreach = this.computeBreachProbability(
      butaneStress, 
      nesComponents.subsidySustainability,
      generatorStress
    );

    return {
      energyStressIndex,
      nesi,
      shockAmplifier,
      butaneStress,
      generatorStress,
      extractionStress,
      greenStress,
      socialContractBreach,
      riskLevel: this.classifyRisk(energyStressIndex),
      topThreats: this.identifyThreats(nesi, fuelShocks, butaneData, generatorData),
      recommendedActions: this.generateRecommendations(energyStressIndex),
      timestamp: Date.now()
    };
  }

  private static computeBreachProbability(
    butane: number, 
    subsidy: number, 
    generator: number
  ): number {
    // Social contract breaches when:
    // - butane queues form (visible, daily impact)
    // - subsidies can no longer be paid (fiscal collapse)
    // - generators become necessity (state failure signal)

    const butaneBreach = butane > 0.6 ? 0.7 : butane * 0.5;
    const subsidyBreach = subsidy < 0.3 ? 0.8 : (1 - subsidy) * 0.4;
    const generatorBreach = generator > 0.7 ? 0.6 : generator * 0.3;

    return Math.min(1, butaneBreach * 0.4 + subsidyBreach * 0.35 + generatorBreach * 0.25);
  }

  private static classifyRisk(esi: number): "STABLE" | "VULNERABLE" | "STRESSED" | "CRITICAL" {
    if (esi < 0.30) return "STABLE";
    if (esi < 0.50) return "VULNERABLE";
    if (esi < 0.70) return "STRESSED";
    return "CRITICAL";
  }
}
```

---

## RRI Integration & Shock Triggers

### Variable Mapping

| Energy Output | RRI Variable | Description |
|--------------|--------------|-------------|
| energyStressIndex | E.3 | Energy Security |
| nesi | E.3 (component) | National Energy Security Index |
| butaneStress | A.12 (component) | Food/Energy Supply Stress |
| socialContractBreach | O.6 | Public Pressure |
| generatorStress | A.16 (component) | Investment Climate (inverse) |
| shockAmplifier | A.14 | Market Distortion |
| extractionStress | A.18 (component) | Export Revenue (domestic production) |

### Shock Conditions

| Condition | ε(t) | Reason |
|-----------|------|--------|
| energyStressIndex > 0.75 | +0.4 | Energy system critical |
| butaneStress > 0.7 AND winter | +0.5 | Social contract breach imminent |
| generatorStress > 0.7 AND summer | +0.4 | State losing electricity monopoly |
| socialContractBreach > 0.6 | +0.6 | Subsidy collapse → riots |
| fuelShock CRITICAL + subsidy < 0.3 | +0.7 | Perfect storm |
| energyStress > 0.6 AND agroStress > 0.6 AND industrialStress > 0.6 | +0.9 | **Total system failure** |

---

## Data Sources & Ingestion

### APIs (Real-time)
| Source | Data | Endpoint |
|--------|------|----------|
| Yahoo Finance | Brent crude | `GET /quote/BZ=F` |
| ICE | TTF gas futures | `GET /data/commodity-data` |
| EEX | Power/gas prices | `GET /api/market-data` |
| STEG (if available) | Grid data | Internal API |
| ETAP | Production | Monthly reports |

### Scraping (Daily/Weekly)
| Source | Data | Method |
|--------|------|--------|
| Ministry of Energy | Subsidy data, policy | Puppeteer |
| TAP (news agency) | Energy announcements | RSS |
| STEG website | Outage reports | Scraping |
| Local media | Butane queues, protests | RSS + NLP |

### Manual (Monthly)
| Source | Data |
|--------|------|
| IMF | Subsidy burden, fiscal capacity |
| World Bank | Energy sector reports |
| IEA | Tunisia energy profile |
| OPEC | Oil market outlook |

### Satellite (Weekly)
| Source | Data | Use |
|--------|------|-----|
| VIIRS Night Lights | Power availability proxy | Detect outages |
| Sentinel-2 | Solar farm construction | Green transition tracking |
| MODIS | Thermal anomalies | Refinery flaring, gas flaring |

---

## Dashboard Integration

### Energy Panel Design

```
┌─────────────────────────────────────────┐
│ ⚡ ENERGY INTELLIGENCE              [🔴] │
│ ─────────────────────────────────────── │
│                                         │
│  NESI: 0.68  LEVEL: STRESSED           │
│  [████████████████████░░░░░░░░░░]      │
│                                         │
│  THREAT MATRIX                          │
│  ┌─────────────────────────────────┐    │
│  │ 🔴 Fuel Shock: Brent +45%      │    │
│  │    Lag: 12 days to Tunisia     │    │
│  │ 🟠 Butane: BSI 0.58 (tight)     │    │
│  │ 🟡 Generator: GSI 0.42 (rising)  │    │
│  │ 🟢 Extraction: stable decline  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  SEASONAL STRESS                        │
│  Summer electricity: 0.62 [████████░░] │
│  Winter butane: 0.45 [██████░░░░░░]  │
│                                         │
│  SUBSIDY SUSTAINABILITY                 │
│  Burden: 8.2% GDP [██████████░░]      │
│  Fiscal capacity: 0.31 [██████░░░░]   │
│  Breach probability: 0.42               │
│                                         │
│  GEOPOLITICAL                           │
│  Algeria stability: 0.65               │
│  Libya security: 0.28 (poor)           │
│  Global tension: 0.72 (Ukraine+Gaza)   │
│                                         │
│  [View Contracts] [STEG Data] [ETAP]    │
└─────────────────────────────────────────┘
```

---

## Implementation Priority

**Phase 1 (Immediate):**
1. Fuel price API ingestion (Brent, TTF, LPG)
2. Butane stress index (from existing BMDM data)
3. Basic NESI computation
4. Shock detection algorithm
5. RRI integration

**Phase 2 (Short-term):**
6. STEG outage monitoring (scraping)
7. Generator stress proxy (social media + diesel sales)
8. Seasonal stress forecasting
9. Contract intelligence (ETAP, Sonatrach)

**Phase 3 (Medium-term):**
10. Satellite night lights for outage detection
11. Full company intelligence (Eni, Shell, OMV tracking)
12. Green transition stress modeling
13. Cross-border energy trade monitoring

---

## Final Strategic Insight

> **Energy is Tunisia's Achilles heel.**
>
> Not because Tunisia consumes too much, but because:
> - It imports almost all its oil
> - It depends on a single gas supplier (Algeria)
> - It cannot afford subsidies but cannot remove them
> - Its grid cannot handle demand peaks
> - Its people respond to energy failures with immediate protest
>
> **The energy module is not an economic indicator.**
> **It is a regime stability predictor.**

---

*Built for TunisiaIntel v2.0 — Strategic Energy Intelligence Module*
