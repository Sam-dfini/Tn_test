# TunisiaIntel v2.0 — The Revolutionary Risk Index (RRI) Engine

## 1. System Overview

The **Revolutionary Risk Index (RRI) Engine** is the mathematical and analytical heart of the TunisiaIntel platform. It is a predictive machine-learning and rule-based hybrid model designed to calculate the real-time probability of state failure, mass uprisings, and systemic collapse. 

Unlike traditional geopolitical risk indices that rely on delayed quarterly economic data, the RRI Engine fuses slow-moving structural variables with high-velocity, real-time "Shocks" to provide a live, tactical threat assessment.

---

## 2. The Core RRI Equation

The engine calculates the real-time stability of the nation using the following master equation:

```text
RRI(t) = [ α·E(t) + β·P(t) + γ·S(t) ] + ε(t)
```

Where:
*   **RRI(t)** ∈ [0, 1]: The ultimate Revolutionary Risk Index at time *t*.
*   **E(t)**: Economic and Environmental Structural Variables.
*   **P(t)**: Political and Institutional Structural Variables.
*   **S(t)**: Social and Security Structural Variables.
*   **α, β, γ**: Dynamic weighting coefficients (representing the relative importance of each sphere at a given time).
*   **ε(t)**: The **Shock Amplifier** (Anomalous, high-velocity events).

### RRI Threat Thresholds
*   **0.00 – 0.35:** `STABLE` (Routine governance, manageable friction)
*   **0.36 – 0.60:** `ELEVATED` (Rising structural pressure, localized protests)
*   **0.61 – 0.85:** `CRITICAL` (Severe systemic stress, wide-scale unrest, institutional paralysis)
*   **0.86 – 1.00:** `IMMINENT COLLAPSE` (Cascading failure, social contract destroyed, kinetic revolution)

---

## 3. The Variable Matrix (Structural Base)

The structural base of the RRI is composed of dozens of continuously tracked variables, typically categorized as follows:

### 📊 E-Variables: Economic & Environmental
*   **E.1 (Macro-Economy):** Inflation, Subsidies, Debt-to-GDP, Sovereign Bond Yields.
*   **E.2 (Food & Agronomy):** Yield stress, ASIL tracking, Protein Market Deficits.
*   **E.3 (Energy Security):** The National Energy Security Index (NESI), import dependency, STEG infrastructure health.
*   **E.4 (Currency & Financial):** Parallel currency exchange rates, Black Market Index (BMI), capital flight.

### 🏛️ P-Variables: Political & Institutional
*   **P.1 (Regime Cohesion):** Elite fracturing, purges, abrupt cabinet reshuffles.
*   **P.2 (Legislative Friction):** Gridlock, rule-by-decree frequency.
*   **P.3 (Geopolitical Isolation):** IMF negotiation breakdowns, EU sanction threats, regional blockades.

### 🛡️ S-Variables: Social & Security
*   **S.1 (Public Pressure / O.6):** Social contract breach indicators, mass mobilization size.
*   **S.2 (Radicalization Flux):** Recruitment indicators, extremist narrative volume.
*   **S.3 (Kinetic Security):** Border clashes, terrorism, police-civilian friction.
*   **S.4 (Labor Unrest):** UGTT strike authorizations, wildcat strikes, industrial closures.

### 📈 A-Variables: Accelerators & Modifiers
These variables act as multipliers when combined with structural weaknesses.
*   **A.12:** Supply Chain / Food Stress.
*   **A.14:** Market Distortion (Black market arbitrage).
*   **A.16:** Investment Climate (Generator dependence, startup closures).
*   **A.18:** Export Revenue Collapse (Phosphate strikes, textile closures).

---

## 4. The Shock Amplifier ( ε )

The most critical innovation of the RRI Engine is the **ε (Epsilon) Shock Component**. Structural variables take months to move; revolutions happen in days. 

The engine uses Natural Language Processing (NLP) and real-time data hooks to detect "Shocks"—events that cause sudden, unmitigated spikes to the RRI regardless of the structural base.

**Shock Logic Example:**
```javascript
let epsilon = 0;

// Shock Trigger 1: Energy
if (fuelShock === "CRITICAL" && subsidySustainability < 0.3) {
    epsilon += 0.40; // Immediate massive spike; state cannot absorb fuel shock
}

// Shock Trigger 2: Basic Needs
if (butaneStress > 0.7 && season === "WINTER") {
    epsilon += 0.25; // Dead of winter, no cooking gas = instant riots
}

// Shock Trigger 3: Economic Death Spiral
if (blackMarketIndex > 0.65 && officialInflation > 0.1) {
    epsilon += 0.30; // Parallel market has overtaken formal market
}

RRI = Math.min(1.0, BaseRRI + epsilon);
```

---

## 5. Sub-System Interoperability

The RRI Engine does not calculate these variables in a void. It relies on real-time data pumped in from the platform's independent modules:

1.  **Strategic Energy Intelligence Module (SEIM):** Feeds `E.3` and `A.16` via grid stability data, Generator Stress (GSI), and Butane Stress (BSI).
2.  **Industrial Intelligence:** Feeds the RRI through extraction decline data (Phosphate Nodes) and localized employment risk.
3.  **Agriculture ASIL:** Feeds `E.2` mapping NDVI satellite data and crop failure probabilities into food security risk layers.
4.  **Black Market Intelligence:** Feeds `A.14` and `E.4` tracking parallel currency distortions and unofficial commodity pricing.
5.  **Live OSINT (Radar):** Feeds into `ε`. Identifies "spark" events (e.g., self-immolations, unprovoked arrests, hyper-localized riots) and injects them instantly into the equation.

---

## 6. The Calculation Pipeline

1.  **Ingestion:** Real-time extraction of variables (APIs, Scrapers, RSS feeds, User Inputs).
2.  **Normalization:** Converting all disparate data types (TND/USD exchange rate, °C temperature, sentiment scores) into standardized [0,1] floats.
3.  **Base Aggregation:** Calculating `[ α·E(t) + β·P(t) + γ·S(t) ]`.
4.  **Anomaly Detection:** Checking for threshold breaches in deep modules (e.g., *Is the Black Market Index over 0.60? Is Gafsa striking?*).
5.  **Epsilon Addition:** Adding the sum of active anomaly payloads `ε(t)` to the Base RRI.
6.  **State Output:** The final RRI value is broadcast globally to the React UI, updating dashboards, triggering UI color shifts (Cyan -> Orange -> Red), and initiating automated AI analyst reports.

***

*Engine Specification — TunisiaIntel RRI Methodology v2.0*
