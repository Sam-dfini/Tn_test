/**
 * sbdeEngine.ts
 * TunisiaIntel — Socio-Behavioral Destabilization Engine (SBDE)
 *
 * Computes: SBI, FSC, DIC, Ψ_soc(t)
 * Tier II equation — outputs Ψ_soc(t) to EQ.1 with w_Ψ = 0.15
 *
 * Phase 1: Proxy-based computation from existing pipeline data.
 * Phase 2: Arabic/Darija NLP classifier from scraped behavioral data.
 *
 * Architecture per SBDE Specification §3.3 and §4:
 * - EQ.SBDE.1: SBI = Σ(w_i × B_i(t))
 * - EQ.SBDE.2: FSC(t) = 1 - weighted_average([divorce, familicide, abuse, neglect])
 * - EQ.SBDE.3: DIC(t) = EconomicStress × SBI × YouthUnemploymentRate
 * - EQ.SBDE.4: Ψ_soc(t) = (w1×SBI + w2×(1-FSC) + w3×DIC) × decay
 */

// ─── WEIGHTS & PARAMETERS ────────────────────────────────────────────────────

// EQ.SBDE.1 — SBI component weights (sum = 1.0)
// Suicide highest due to Bouazizi precedent in Tunisian context
const W_SBI = {
  suicide:           0.22,
  domestic_violence: 0.18,
  street_crime:      0.17,
  youth_crime:       0.14,
  drug_abuse:        0.11,
  prostitution:      0.09,
  mental_health:     0.09,
};

// EQ.SBDE.2 — FSC component weights (sum = 1.0)
const W_FSC = {
  divorce:          0.30,
  familicide:       0.25,
  domestic_abuse:   0.28,
  child_neglect:    0.17,
};

// EQ.SBDE.4 — Ψ_soc component weights
const W_PSI = {
  SBI: 0.40,
  FSC_inverted: 0.35,  // (1 - FSC) — higher distress = lower family cohesion
  DIC: 0.25,
};

// Tier I integration weight (w_Ψ in EQ.1)
export const W_PSI_RRI = 0.15;

// Temporal decay factor (per week — prevents stale incidents from inflating score)
const DECAY_WEEKLY = 0.95;

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface SBDEInputs {
  // Raw behavioral indicators (0–1 normalized)
  suicide_rate_normalized: number;      // relative to historical baseline
  domestic_violence_rate: number;
  street_crime_rate: number;
  youth_crime_rate: number;
  drug_abuse_proxy: number;             // Phase 1: arrest-based proxy
  prostitution_proxy: number;           // Phase 1: structurally distressed area proxy
  mental_health_proxy: number;          // Phase 1: hospitalization + drug-related proxy

  // FSC inputs
  divorce_rate_normalized: number;
  familicide_proxy: number;
  domestic_abuse_index: number;
  child_neglect_proxy: number;

  // Economic context for DIC
  economic_stress: number;              // 0–1 from RRI economy scores
  youth_unemployment_rate: number;      // 0–1 normalized (Tunisia: ~35% = 0.35)

  // Temporal
  weeks_since_last_major_incident: number;
}

export interface SBDEResult {
  SBI: number;           // 0–1 Social Behavior Index
  FSC: number;           // 0–1 Family Stability Coefficient (higher = more stable)
  DIC: number;           // 0–1 Destabilization Ignition Coefficient
  psi_soc: number;       // 0–1 Ψ_soc(t) — the Tier I integration scalar
  alertLevel: 1 | 2 | 3 | 4 | 5;
  components: {
    SBI_breakdown: Record<string, number>;
    FSC_breakdown: Record<string, number>;
  };
  governorateRisk: GovernorateRisk[];
}

export interface GovernorateRisk {
  gov: string;
  SBI_local: number;
  DIC_local: number;
  dominant_signal: string;
  cluster: 'IGNITION' | 'ELEVATED' | 'MEDIUM' | 'STABLE';
}

// ─── DEFAULT PROXY INPUTS ────────────────────────────────────────────────────
// Phase 1 calibrated estimates from published Tunisian statistics.
// Will be replaced by live NLP classifier in Phase 2.

export const DEFAULT_SBDE_INPUTS: SBDEInputs = {
  // Behavioral — all normalized to 0–1 vs 2015–2019 baseline
  suicide_rate_normalized:   0.68,  // +35% above baseline (ONDCA data)
  domestic_violence_rate:    0.74,  // +48% above baseline (ATFD data)
  street_crime_rate:         0.61,  // arrest proxy from security data
  youth_crime_rate:          0.58,  // 18–25 arrest rate proxy
  drug_abuse_proxy:          0.52,  // narcotics arrest rate proxy
  prostitution_proxy:        0.44,  // structurally distressed area indicator
  mental_health_proxy:       0.55,  // hospitalization + substance proxy

  // FSC
  divorce_rate_normalized:   0.62,  // INSTM 2025 estimate
  familicide_proxy:          0.38,  // MFPE data proxy
  domestic_abuse_index:      0.71,  // ATFD + police reports
  child_neglect_proxy:       0.48,  // DGPE proxy

  // Economic context
  economic_stress:           0.68,  // from pipeline economy scores
  youth_unemployment_rate:   0.35,  // ~35% youth unemployment Tunisia 2025

  // Temporal decay
  weeks_since_last_major_incident: 2,
};

// ─── CALCULATION FUNCTIONS ────────────────────────────────────────────────────

/**
 * EQ.SBDE.1 — Social Behavior Index
 * SBI = Σ(w_i × B_i(t))
 */
export function computeSBI(inputs: SBDEInputs): { SBI: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    suicide:           W_SBI.suicide           * inputs.suicide_rate_normalized,
    domestic_violence: W_SBI.domestic_violence * inputs.domestic_violence_rate,
    street_crime:      W_SBI.street_crime      * inputs.street_crime_rate,
    youth_crime:       W_SBI.youth_crime       * inputs.youth_crime_rate,
    drug_abuse:        W_SBI.drug_abuse        * inputs.drug_abuse_proxy,
    prostitution:      W_SBI.prostitution      * inputs.prostitution_proxy,
    mental_health:     W_SBI.mental_health     * inputs.mental_health_proxy,
  };
  const SBI = Math.min(1, Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { SBI, breakdown };
}

/**
 * EQ.SBDE.2 — Family Stability Coefficient
 * FSC(t) = 1 - weighted_average([divorce, familicide, abuse, neglect])
 * Uses weighted average NOT sum — prevents FSC from going negative.
 */
export function computeFSC(inputs: SBDEInputs): { FSC: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    divorce:       W_FSC.divorce       * inputs.divorce_rate_normalized,
    familicide:    W_FSC.familicide    * inputs.familicide_proxy,
    domestic_abuse: W_FSC.domestic_abuse * inputs.domestic_abuse_index,
    child_neglect: W_FSC.child_neglect * inputs.child_neglect_proxy,
  };
  // Weighted average ensures FSC ∈ [0, 1]
  const weighted_avg = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const FSC = Math.max(0, Math.min(1, 1 - weighted_avg));
  return { FSC, breakdown };
}

/**
 * EQ.SBDE.3 — Destabilization Ignition Coefficient
 * DIC(t) = EconomicStress × SBI × YouthUnemploymentRate
 * The "conversion function" — measures how close desperation is to ignition.
 */
export function computeDIC(inputs: SBDEInputs, SBI: number): number {
  const DIC = inputs.economic_stress * SBI * inputs.youth_unemployment_rate;
  return Math.min(1, DIC);
}

/**
 * EQ.SBDE.4 — Ψ_soc(t)
 * Ψ_soc(t) = (w1×SBI + w2×(1-FSC) + w3×DIC) × decay
 * Temporal decay prevents stale incidents from permanently inflating score.
 */
export function computePsiSoc(SBI: number, FSC: number, DIC: number, weeksSinceMajorIncident: number): number {
  const raw = W_PSI.SBI * SBI + W_PSI.FSC_inverted * (1 - FSC) + W_PSI.DIC * DIC;
  const decay = Math.pow(DECAY_WEEKLY, weeksSinceMajorIncident);
  return Math.min(1, Math.max(0, raw * decay));
}

/**
 * Alert level from Ψ_soc
 * 1=Green 2=Yellow 3=Orange 4=Red 5=Black
 */
function getAlertLevel(psi: number, dic: number): 1 | 2 | 3 | 4 | 5 {
  if (psi > 0.80 && dic > 0.25) return 5; // Black — systemic behavioral collapse
  if (psi > 0.65) return 4;               // Red — crisis
  if (psi > 0.50) return 3;               // Orange — pressure
  if (psi > 0.30) return 2;               // Yellow — watch
  return 1;                                // Green — stable
}

// ─── GOVERNORATE RISK MATRIX ──────────────────────────────────────────────────

const GOV_MODIFIERS: Record<string, { sbi_mult: number; dic_mult: number; signal: string }> = {
  'Gafsa':        { sbi_mult: 1.42, dic_mult: 1.38, signal: 'Suicide + Youth Crime' },
  'Kasserine':    { sbi_mult: 1.38, dic_mult: 1.35, signal: 'Domestic Violence + Poverty' },
  'Sidi Bouzid':  { sbi_mult: 1.35, dic_mult: 1.40, signal: 'Youth Crime + Mental Health' },
  'Kairouan':     { sbi_mult: 1.28, dic_mult: 1.22, signal: 'Drug Abuse + Unemployment' },
  'Jendouba':     { sbi_mult: 1.22, dic_mult: 1.18, signal: 'Domestic Violence + Isolation' },
  'Tataouine':    { sbi_mult: 1.18, dic_mult: 1.25, signal: 'Youth Crime + Border Proximity' },
  'Sfax':         { sbi_mult: 1.08, dic_mult: 1.05, signal: 'Street Crime + Immigration Stress' },
  'Tunis':        { sbi_mult: 0.95, dic_mult: 1.12, signal: 'Drug Abuse + Inequality' },
  'Sousse':       { sbi_mult: 0.88, dic_mult: 0.82, signal: 'Stable — Tourism Buffer' },
  'Monastir':     { sbi_mult: 0.82, dic_mult: 0.78, signal: 'Stable — Diaspora Income' },
};

function computeGovernorateRisk(SBI_national: number, DIC_national: number): GovernorateRisk[] {
  return Object.entries(GOV_MODIFIERS).map(([gov, mod]) => {
    const SBI_local = Math.min(1, SBI_national * mod.sbi_mult);
    const DIC_local = Math.min(1, DIC_national * mod.dic_mult);
    const composite = SBI_local * 0.5 + DIC_local * 0.5;
    const cluster: GovernorateRisk['cluster'] =
      composite > 0.6 ? 'IGNITION' :
      composite > 0.45 ? 'ELEVATED' :
      composite > 0.3 ? 'MEDIUM' : 'STABLE';
    return { gov, SBI_local, DIC_local, dominant_signal: mod.signal, cluster };
  });
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function computeSBDE(inputs: SBDEInputs = DEFAULT_SBDE_INPUTS): SBDEResult {
  const { SBI, breakdown: SBI_breakdown } = computeSBI(inputs);
  const { FSC, breakdown: FSC_breakdown } = computeFSC(inputs);
  const DIC = computeDIC(inputs, SBI);
  const psi_soc = computePsiSoc(SBI, FSC, DIC, inputs.weeks_since_last_major_incident);
  const alertLevel = getAlertLevel(psi_soc, DIC);
  const governorateRisk = computeGovernorateRisk(SBI, DIC);

  return {
    SBI,
    FSC,
    DIC,
    psi_soc,
    alertLevel,
    components: { SBI_breakdown, FSC_breakdown },
    governorateRisk,
  };
}

// Singleton for sync access
export const SBDE_RESULT = computeSBDE();
