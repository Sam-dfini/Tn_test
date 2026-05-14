# RRI Engine Audit — Hardcoded Values & Data Gaps

**File:** `src/math/rri/engine.ts` (1150 lines)

## Equation Coverage (All 21 Equations)

| Eq # | Function | Lines | Status |
|------|----------|-------|--------|
| EQ.1 | `eq1_normalize` | 260-278 | ✅ Clean — normalizes variables with threshold |
| EQ.2 | `eq2_categoryScores` | 280-296 | ✅ Clean — computes weighted category averages |
| EQ.3 | `eq3_salience` | 298-322 | ✅ Clean — war distraction / salience formula |
| EQ.4 | `eq4_sir` | 324-346 | ✅ Clean — SIR protest spread model |
| EQ.7 | `eq7_eliteDefection` | 348-366 | ✅ Clean — sigmoid-based defection |
| EQ.8 | `eq8_warIntensity` | 368-376 | ✅ Clean — weighted battle + media |
| EQ.9 | `eq9_remittanceMobilization` | 378-388 | ✅ Clean |
| EQ.10 | `eq10_remittanceDistribution` | 390-397 | ✅ Clean |
| EQ.12 | `eq12_pRev` | 399-401 | ✅ Clean — logistic RRI→P_rev |
| EQ.13 | `eq13_stochasticShock` | 403-409 | ✅ Clean |
| EQ.14 | `eq14_monteCarlo` | 411-458 | ✅ Clean |
| EQ.15 | `eq15_compoundStress` | 460-475 | ✅ Clean |
| EQ.16 | `eq16_velocity` | 477-499 | ✅ Clean |
| EQ.17 | `eq17_cascadeProbability` | 509-543 | ✅ Clean |
| EQ.18 | `eq18_eliteDefectionDynamics` | 545-561 | ✅ Clean |
| EQ.19 | `eq19_infoAmplification` | 563-577 | ✅ Clean |
| EQ.20 | `eq20_historicalPatternSimilarity` | 614-634 | ✅ Clean |
| EQ.21 | `eq21_ministerialInstability` | 587-612 | ✅ Clean |

**All equations are structurally sound.** The issues are in the **input data** — hardcoded fallbacks when pipeline variables aren't available.

---

## HARDCODED VALUES (16 items to fix)

### 1. War Distraction — `battle_deaths_norm` & `media_salience_norm`
**Lines:** 668-669
```ts
const battle_deaths_norm = 0.35;   // ← HARDCODED
const media_salience_norm = 0.45;  // ← HARDCODED
```
**Current state:** Static values used as fallback when `J_WAR` variable isn't found in the database.
**Should be:** Dynamic values computed from RSS article pipeline — count articles mentioning conflict keywords (war, strike, attack, Lebanon, Gaza, etc.) weighted by severity.
**Source:** `useRSS()` articles filtered by geopolitical keywords, normalized to 0-1.

### 2. Remittance Total — `r_total_usd`
**Line:** 675
```ts
const r_total_usd = 2850;
```
**Current state:** Static number (USD millions).
**Should be:** Dynamic value from economic data pipeline or World Bank API.
**Source:** `economy.remittances` pipeline field or `/api/worldbank` endpoint.

### 3. Fallback Values for EQ.3 Inputs (cp_t, dp_t, p_t, dd_t, cr_t)
**Lines:** 684-690
```ts
const cp_t = cpVar ? cpVar.value_2026 : 0.42;
const dp_t = dpVar ? dpVar.value_2026 : 0.38;
const p_t = propVar ? propVar.value_2026 : 0.72;
const dd_t = ddVar ? ddVar.value_2026 : 0.65;
const cr_t = ruralConnVar ? (1 - eq1_normalize(ruralConnVar)) : 0.30;
```
**Current state:** Fallback values used when pipeline variables aren't found.
**Should be:** All from pipeline variables defined in `rri_variables.json`. The fallbacks should come from actual Supabase data or recent pipeline values.
**Source:** PipelineContext → `data` object.

### 4. Calibration Factor
**Line:** 727
```ts
const CALIBRATION_FACTOR = 0.465;
```
**Current state:** Global multiplier that scales raw RRI to match observed values.
**Should be:** Either validated against historical data or made adaptive via Bayesian updating.
**Note:** This is a necessary architectural constant — but should be documented with its derivation.

### 5. Shock Weights (EQ.13)
**Lines:** 731-738
```ts
{ weight: 0.4, magnitude: gaussianRandom(0, 0.03) },
{ weight: 0.3, magnitude: gaussianRandom(0, 0.05) },
{ weight: 0.3, magnitude: gaussianRandom(0, 0.02) },
```
**Current state:** Static weights and magnitudes.
**Should be:** Dynamic based on recent real-world shock events detected by the pipeline.

### 6. OCI Default Value
**Line:** 696
```ts
const _oci = (overridesOrVars as any)?._oci ?? 0.22;
```
**Current state:** Default 0.22 when no actor network data available.
**Should be:** From live actor network graph (NationalActorNetwork / GeopoliticalNetworkGraph).

### 7. Elite Defection Hardcoded Inputs
**Lines:** 808-813
```ts
0.65,  // base EC (elite cohesion)
18,    // parallel market premium fallback
23,    // decree54 charged fallback
-5     // FDI change
```
**Current state:** Hardcoded fallback values.
**Should be:** From pipeline variables `A_PARALLEL`, `G71`, and FDI data.

### 8. Info Amplification Fallbacks
**Lines:** 820-824
```ts
pressVar ? pressVar.value_2026 : 31,       // Press freedom score
censorVar ? censorVar.value_2026 / 100 : 0.72,
socialMediaVar ? 1 - eq1_normalize(socialMediaVar) : 0.75,
14  // throttling incidents
```
**Current state:** Hardcoded fallback when variables aren't found.
**Should be:** From pipeline variables `D44`, `C37`, `C26`.

### 9. Historical States
**Lines:** 154-179
```ts
const HISTORICAL_STATES = { 'tunisia_2010_q3': {...}, 'tunisia_2021_q1': {...}, ... };
```
**Current state:** 4 hardcoded reference states (Tunisia 2010, Tunisia 2021, Egypt 2011, Algeria 2019).
**Should be:** Expanded with more historical reference points. Values should be validated by actual historical data.

### 10. Regime Age
**Line:** 636
```ts
const REGIME_AGE = { age_pct: 0.29, years: 5 };
```
**Current state:** Static (5 years since 2021 coup).
**Should be:** Dynamic — computed from date since last regime transition.

### 11. RRI History
**Lines:** 922-929
```ts
rri_history: [
  { date: '2026-03-01', rri: 2.15 },
  { date: '2026-03-05', rri: 2.22 },
  ...
]
```
**Current state:** 6 hardcoded historical points + current.
**Should be:** From a Supabase `rri_history` table or local storage.

### 12. Cascade Governorate Weights
**Lines:** 522-528
```ts
const govWeights = { sfax: 1.4, kasserine: 1.2, sidi_bouzid: 1.1, gafsa: 1.2, gabes: 1.0 };
```
**Current state:** Hardcoded per-governorate weights.
**Should be:** Dynamic — could come from governorate data (population, economic factors).

### 13. EQ.7 Internal Parameters
**Lines:** 356-358
```ts
const B_i = 0.4; const C_i = 0.8; const lambda_i = 0.15;
```
**Current state:** Hardcoded inside function (not in PARAMS object).
**Should be:** Moved to PARAMS object for consistency and tunability.

### 14. Monte Carlo Runs Capped
**Line:** 853
```ts
const mcResult = eq14_monteCarlo(vars, w_t, 1000);
```
**Current state:** Only 1000 runs (PARAMS says 10000).
**Should be:** Use `PARAMS.MONTE_CARLO_RUNS` (10000) for proper confidence intervals.

### 15. SIR Initial Infected
**Line:** 850
```ts
const initial_infected = protestVar ? eq1_normalize(protestVar) * 0.05 : 0.02;
```
**Current state:** Fixed multiplier of protest variable.
**Should be:** Dynamic — based on recent protest event count or survey data.

### 16. War Variable ID Hardcoded
**Line:** 667
```ts
const warVar = vars.find(v => (v.id === 'J_WAR' || `${v.code}${v.number}` === 'J104'));
```
**Current state:** Hardcoded variable lookup by ID.
**Should be:** Use variable metadata system rather than hardcoded IDs.

---

## Priority Matrix

| # | Item | Impact | Effort | Priority |
|---|------|--------|--------|----------|
| 1 | War distraction (battle_deaths + media_salience) | **HIGH** — directly affects salience/P_rev | Medium | **P0** |
| 3 | Fallback values for EQ.3 inputs | **HIGH** — 5 variables with static fallbacks | Medium | **P0** |
| 2 | Remittance total | **MEDIUM** — affects protest mobilization | Low | **P1** |
| 6 | OCI from actor network | **MEDIUM** — affects salience_effective | Medium | **P1** |
| 7 | Elite defection inputs | **MEDIUM** — affects cohesion dynamics | Low | **P1** |
| 8 | Info amplification fallbacks | **MEDIUM** — affects info_amplification | Low | **P1** |
| 14 | Monte Carlo 1000→10000 | **LOW** — better confidence intervals | Very Low | **P2** |
| 13 | Move B_i, C_i, lambda_i to PARAMS | **LOW** — code quality | Very Low | **P2** |
| 12 | Cascade weights from governorate data | **LOW** — refinement | Medium | **P2** |
| 9 | More historical states | **LOW** — pattern matching benchmark | Low | **P2** |
| 10 | Dynamic regime age | **LOW** — currently accurate | Very Low | **P2** |
| 11 | RRI history from database | **LOW** — nice to have | Medium | **P3** |
| 15 | SIR initial infected dynamic | **LOW** — refinement | Low | **P3** |

---

## About the 250 Variables

The 250 variables come from `src/data/rri_variables.json` — a **STATIC JSON file imported at build time**. The values only update when:
1. `initializeVariables()` is called (fetches from `/api/variables` endpoint)
2. `updateVariableFromPipeline()` is called for specific fields
3. Pipeline data overwrites them via the overrides mechanism in `calculateRRI()`

The `pipeline_field` mapping connects each variable to its live data source. But if pipeline data never flows, the 2026 values in the JSON are used as-is.

---

## Execution Plan

### Phase 1: Dynamic War Distraction (P0)
1. Add a service function `computeMediaSalience(articles: Article[]): number` that:
   - Scans recent articles for conflict keywords (Lebanon, Hezbollah, strikes, Gaza, war, etc.)
   - Weights by article severity
   - Returns normalized 0-1 score
2. Pass result as override to `calculateRRI()` via `_media_salience_norm` and `_battle_deaths_norm`

### Phase 2: Remove Hardcoded Fallbacks (P0-P1)
1. Ensure all 250 variables from `rri_variables.json` have the correct `pipeline_field` mapping
2. Ensure the pipeline context writes values to these variables
3. Add a `processArticleForWarTracking()` that updates `J_WAR`, `E51`, etc.

### Phase 3: Calibration & Refinement (P1-P2)
1. Audit `rri_variables.json` — are the current values accurate for May 2026?
2. Re-run pipeline data fetch on app startup
3. Move internal function constants to PARAMS
