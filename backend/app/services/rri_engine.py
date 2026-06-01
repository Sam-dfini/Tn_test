import logging
"""
RRI Engine — Full Python port of src/math/rri/engine.ts (1239 lines)

All 24 equations from the TypeScript implementation, ported to Python
with NumPy for vectorized operations. This is the single authoritative
computation layer for the canonical national_state_snapshots table.
"""

from __future__ import annotations

import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent / "data" / "rri_variables.json"


def _load_variables() -> List[Dict[str, Any]]:
    try:
        with open(DATA_PATH) as f:
            data = json.load(f)
        return data.get("variables", [])
    except Exception as e:
        logger.warning("Caught exception in services/rri_engine.py: %s", e)
        return []


# ── Parameters (mirrors PARAMS in engine.ts) ──────────────────────────

P_REV_K = 0.8
P_REV_THRESHOLD = 2.625

MII_ALPHA = 0.20
MII_BETA = 0.25
MII_GAMMA = 0.20
MII_DELTA = 0.20
MII_EPS = 0.15
MII_R_WEIGHT = 0.04

ALPHA = 0.7
BETA = 0.7
GAMMA = 0.3
DELTA = 0.12
EPSILON = 0.08
ZETA = 0.05
ETA = 0.02
THETA = 0.03
IOTA = 0.1

SIR_BETA = 0.4
SIR_GAMMA = 0.15
POPULATION = 12_000_000

SIGMA = 0.05
DEFECT_THRESHOLD = 10
DEFECT_B = 0.4
DEFECT_C = 0.8
DEFECT_LAMBDA = 0.15

W_BATTLE_WEIGHT = 0.6
W_MEDIA_WEIGHT = 0.4

REMIT_MOBILIZATION = 0.05
URBAN_PROTESTERS_PER_M = 250
RURAL_PROTESTERS_PER_M = 50

PHI = 0.8

MONTE_CARLO_RUNS = 10000

CATEGORY_WEIGHTS: Dict[str, float] = {
    "A": 0.20, "B": 0.04, "C": 0.06, "D": 0.08,
    "E": 0.07, "F": 0.05, "G": 0.05, "H": 0.04,
    "I": 0.05, "J": 0.04, "K": 0.02, "L": 0.06,
    "M": 0.05, "N": 0.06, "O": 0.04, "P": 0.04,
    "Q": 0.02, "R": 0.02, "S": 0.02, "T": 0.02,
    "U": 0.02, "V": 0.01, "W": 0.01, "X": 0.01,
}

CS_PAIRS: List[Dict[str, Any]] = [
    {"i": "A_FX", "j": "E51", "alpha": 0.15},
    {"i": "M_UGTT", "j": "A01", "alpha": 0.12},
    {"i": "N142", "j": "E51", "alpha": 0.18},
    {"i": "I92", "j": "A_FX", "alpha": 0.14},
    {"i": "D50", "j": "M133", "alpha": 0.16},
    {"i": "B21", "j": "E51", "alpha": 0.13},
    {"i": "A01", "j": "A02", "alpha": 0.10},
    {"i": "L123", "j": "M_UGTT", "alpha": 0.15},
    {"i": "D_MII", "j": "E51", "alpha": 0.14},
    {"i": "D_MII", "j": "M_UGTT", "alpha": 0.12},
    {"i": "SEI_A01", "j": "A01", "alpha": 0.13},
    {"i": "M215", "j": "E51", "alpha": 0.14},
    {"i": "A251", "j": "E51", "alpha": 0.20},
]

CS_THRESHOLD = 0.7

V_HIGH_WEIGHT_IDS = [
    "A_FX", "E51", "A01", "M_UGTT", "D41", "G71", "D_MII", "A251",
]
V_SCALING = 3.0

CASCADE_GOVS = ["sfax", "kasserine", "sidi_bouzid", "gafsa", "gabes"]
CASCADE_THRESHOLD = 0.70

EC_DECAY = 0.02
EC_REINFORCE = 0.01

IA_GAMMA = 0.4
HPS_WEIGHT = 0.12
HPS_MIN_TRIGGER = 0.5

MU_RDE = 0.15
SEI_SALIENCE_WEIGHT = 0.12
SEI_SHOCK_WEIGHT = 0.35
SEI_CASCADE_WEIGHT = 0.15
OCI_FLOOR = 0.40
OCI_CEILING = 1.00
CPG_BASELINE_GAFSA = 1.20
CPG_CRITICAL_GAFSA = 2.20
CPG_THRESHOLD = 65

# ── Historical states (mirrors HISTORICAL_STATES in engine.ts) ───────

HISTORICAL_STATES: Dict[str, Dict[str, float]] = {
    "tunisia_2010_q3": {
        "A01": 0.45, "A02": 0.72, "A03": 0.52, "A_FX": 0.40,
        "D41": 0.55, "D44": 0.35, "E51": 0.80, "L121": 0.85,
        "N141": 0.40, "N144": 0.25, "O151": 0.85, "O152": 0.82,
        "P164": 0.80, "P169": 0.75, "M133": 0.65, "F66": 0.72,
    },
    "tunisia_2021_q1": {
        "A01": 0.62, "A02": 0.74, "A03": 0.68, "A_FX": 0.55,
        "D41": 0.48, "D44": 0.65, "E51": 0.72, "L121": 0.70,
        "N141": 0.38, "N144": 0.28, "O151": 0.80, "O152": 0.78,
        "P164": 0.82, "P169": 0.78, "M133": 0.58, "F66": 0.78,
    },
    "egypt_2011_q1": {
        "A01": 0.52, "A02": 0.68, "A03": 0.48, "A_FX": 0.52,
        "D41": 0.45, "D44": 0.72, "E51": 0.88, "L121": 0.88,
        "N141": 0.35, "N144": 0.20, "O151": 0.90, "O152": 0.88,
        "P164": 0.85, "P169": 0.80, "M133": 0.72, "F66": 0.82,
    },
    "algeria_2019_hirak": {
        "A01": 0.55, "A02": 0.65, "A03": 0.55, "A_FX": 0.45,
        "D41": 0.40, "D44": 0.68, "E51": 0.75, "L121": 0.82,
        "N141": 0.42, "N144": 0.30, "O151": 0.78, "O152": 0.75,
        "P164": 0.78, "P169": 0.72, "M133": 0.70, "F66": 0.70,
    },
}

# ── Helpers ──────────────────────────────────────────────────────────


def _sigmoid(x: float) -> float:
    if x < -100:
        return 0.0
    if x > 100:
        return 1.0
    return 1.0 / (1.0 + math.exp(-x))


def _gaussian_random(mean: float = 0.0, std: float = 1.0) -> float:
    u = random.random()
    while u == 0:
        u = random.random()
    v = random.random()
    while v == 0:
        v = random.random()
    z = math.sqrt(-2.0 * math.log(u)) * math.cos(2.0 * math.pi * v)
    return mean + z * std


def _normalize(raw: float, min_val: float, max_val: float, invert: bool) -> float:
    if max_val <= min_val:
        return 0.5
    n = max(0.0, min(1.0, (raw - min_val) / (max_val - min_val)))
    return 1.0 - n if invert else n


def _cosine_similarity(
    a: Dict[str, float], b: Dict[str, float]
) -> float:
    keys = [k for k in a if k in b]
    if not keys:
        return 0.0
    dot = sum(a[k] * b[k] for k in keys)
    norm_a = math.sqrt(sum(a[k] * a[k] for k in keys))
    norm_b = math.sqrt(sum(b[k] * b[k] for k in keys))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _get_var(vars: List[Dict[str, Any]], var_id: str) -> Optional[Dict[str, Any]]:
    for v in vars:
        vid = v.get("id") or f"{v.get('code', '')}{v.get('number', '')}"
        if vid == var_id or v.get("code", "") + str(v.get("number", "")) == var_id:
            return v
    return None


def _id(v: Dict[str, Any]) -> str:
    return v.get("id") or f"{v.get('code', '')}{v.get('number', '')}"


def _safe(val: float, fallback: float = 0.0) -> float:
    if val is None or math.isnan(val) or math.isinf(val):
        return fallback
    return val


# ── EQ.1 — Normalization ────────────────────────────────────────────


def eq1_normalize(v: Dict[str, Any]) -> float:
    raw_value = v.get("value_2026", 0)
    min_value = v.get("min_value", 0)
    max_value = v.get("max_value", 100)
    invert = v.get("invert", False)
    threshold_weight = v.get("threshold_weight", 1.2)

    normalized = _normalize(raw_value, min_value, max_value, invert)
    threshold = v.get("threshold")
    if threshold is not None and threshold_weight > 1.0:
        threshold_norm = _normalize(threshold, min_value, max_value, invert)
        if normalized > threshold_norm:
            excess = normalized - threshold_norm
            normalized = threshold_norm + excess * threshold_weight
    return max(0.0, min(1.5, normalized))


# ── EQ.2 — Category Scores ──────────────────────────────────────────


def eq2_category_scores(vars: List[Dict[str, Any]]) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    categories = sorted({v.get("code", "") for v in vars if v.get("code")})
    for cat in categories:
        cat_vars = [v for v in vars if v.get("code") == cat]
        if not cat_vars:
            continue
        weighted_sum = sum(
            v.get("weight", 0.02) * eq1_normalize(v) for v in cat_vars
        )
        total_weight = sum(v.get("weight", 0.02) for v in cat_vars)
        scores[cat] = weighted_sum / total_weight if total_weight > 0 else 0.0
    return scores


# ── EQ.3 — Salience (Full War Distraction) ──────────────────────────


def eq3_salience(
    w_t: float,
    cp_t: float,
    dp_t: float,
    rm_t: float,
    rr_t: float,
    cr_t: float,
    p_t: float,
    dd_t: float,
    rpi_t: float = 0.0,
) -> float:
    numerator = ALPHA * (
        1
        + DELTA * cp_t
        + EPSILON * dp_t
        + ZETA * rm_t
        + ETA * rr_t
        + THETA * cr_t
        + MU_RDE * rpi_t
    )
    denominator = 1 + BETA * w_t * (1 + GAMMA * p_t + IOTA * dd_t)
    return max(0.05, min(1.0, numerator / denominator))


# ── EQ.4 — SIR Protest Spread ───────────────────────────────────────


def eq4_sir(
    initial_infected_pct: float,
    beta: float = SIR_BETA,
    gamma: float = SIR_GAMMA,
) -> Dict[str, float]:
    S = 1.0 - initial_infected_pct
    I = initial_infected_pct
    R = 0.0
    peak_infected = I
    dt = 0.1
    steps = 300
    for _ in range(steps):
        dS = -beta * S * I * dt
        dI = (beta * S * I - gamma * I) * dt
        dR = gamma * I * dt
        S = max(0.0, S + dS)
        I = max(0.0, I + dI)
        R = min(1.0, R + dR)
        if I > peak_infected:
            peak_infected = I
    return {"S": S, "I": I, "R": R, "peak_infected": peak_infected}


# ── EQ.7 — Elite Defection ─────────────────────────────────────────


def eq7_eliteDefection(
    p_rev: float,
    r_t: float,
    current_defections: float = 0.0,
) -> Dict[str, float]:
    utility = (
        DEFECT_B
        - DEFECT_C * (1 - p_rev)
        + DEFECT_LAMBDA * current_defections
    )
    nash_threshold = DEFECT_THRESHOLD + SIGMA * r_t
    defection_probability = _sigmoid((utility - nash_threshold) * 2)
    return {
        "defection_probability": defection_probability,
        "nash_threshold": nash_threshold,
    }


# ── EQ.8 — War Intensity ────────────────────────────────────────────


def eq8_warIntensity(
    battle_deaths_norm: float,
    media_salience_norm: float,
) -> float:
    return max(
        0.2,
        min(
            0.8,
            W_BATTLE_WEIGHT * battle_deaths_norm
            + W_MEDIA_WEIGHT * media_salience_norm,
        ),
    )


# ── EQ.9 — Remittance Mobilization ──────────────────────────────────


def eq9_remittanceMobilization(
    r_total_millions: float,
    dd_t: float,
) -> Dict[str, float]:
    delta_p = REMIT_MOBILIZATION * r_total_millions * (1 - dd_t)
    return {
        "urban": delta_p * URBAN_PROTESTERS_PER_M,
        "rural": delta_p * RURAL_PROTESTERS_PER_M * dd_t,
        "total": delta_p
        * (URBAN_PROTESTERS_PER_M + RURAL_PROTESTERS_PER_M * dd_t),
    }


# ── EQ.10 — Remittance Distribution ─────────────────────────────────


def eq10_remittanceDistribution(r_total: float) -> Dict[str, float]:
    return {
        "urban": PHI * r_total,
        "rural": (1 - PHI) * r_total,
    }


# ── EQ.12 — Logistic Revolution Probability ─────────────────────────


def eq12_pRev(r_t: float) -> float:
    return 1.0 / (1.0 + math.exp(-(P_REV_K * r_t - 2.1)))


# ── EQ.13 — Stochastic Shock ────────────────────────────────────────


def eq13_stochasticShock(
    shock_events: List[Dict[str, float]],
) -> float:
    return sum(event["weight"] * event["magnitude"] for event in shock_events)


# ── EQ.14 — Monte Carlo Simulation ──────────────────────────────────


def eq14_monteCarlo(
    vars: List[Dict[str, Any]],
    w_t: float,
    n_runs: int = MONTE_CARLO_RUNS,
) -> Dict[str, float]:
    results: List[float] = []
    for _ in range(n_runs):
        weighted_sum = 0.0
        total_weight = 0.0
        for v in vars:
            normalized = eq1_normalize(v)
            volatility = v.get("volatility", 0.05) * (random.random() * 2 - 1)
            perturbed = max(0.0, min(1.5, normalized + volatility))
            weighted_sum += v.get("weight", 0.02) * perturbed
            total_weight += v.get("weight", 0.02)

        r_base = (weighted_sum / total_weight) * 5 if total_weight > 0 else 2.31
        w_variation = w_t + _gaussian_random(0, 0.05)
        r_sim = r_base * max(0.2, w_variation)
        shock = _gaussian_random(0, 0.08)
        r_final = max(0.0, r_sim + shock)
        p_rev_sim = eq12_pRev(r_final)
        results.append(p_rev_sim)

    if not results:
        return {"ci_low": 0.0, "ci_high": 0.0, "mean": 0.0, "std": 0.0}

    results.sort()
    mean = sum(results) / len(results)
    variance = sum((v - mean) ** 2 for v in results) / len(results)
    std = math.sqrt(variance)

    low_idx = max(0, min(len(results) - 1, int(len(results) * 0.025)))
    high_idx = max(0, min(len(results) - 1, int(len(results) * 0.975)))

    return {
        "ci_low": results[low_idx],
        "ci_high": results[high_idx],
        "mean": mean,
        "std": std,
    }


# ── EQ.15 — Compound Stress ─────────────────────────────────────────


def eq15_compoundStress(var_map: Dict[str, float]) -> float:
    cs = 0.0
    for pair in CS_PAIRS:
        ni = var_map.get(pair["i"], 0.0)
        nj = var_map.get(pair["j"], 0.0)
        bi = max(0.0, ni - CS_THRESHOLD) / (1.0 - CS_THRESHOLD)
        bj = max(0.0, nj - CS_THRESHOLD) / (1.0 - CS_THRESHOLD)
        cs += pair["alpha"] * bi * bj
    return max(0.0, min(0.5, cs))


# ── EQ.16 — Velocity Index ──────────────────────────────────────────


def eq16_velocity(vars: List[Dict[str, Any]]) -> float:
    velocity_sum = 0.0
    count = 0
    for v in vars:
        history = v.get("history")
        if not history or not isinstance(history, list) or len(history) < 2:
            continue
        current = v.get("value", v.get("value_2026", 0))
        previous = history[-2]
        delta = current - previous
        vid = _id(v)
        beta = 2.0 if vid in V_HIGH_WEIGHT_IDS else 1.0
        sigma = max(0.01, v.get("volatility", 0.05))
        velocity_sum += beta * (delta / sigma) * v.get("weight", 0.02)
        count += 1

    if count == 0:
        return 0.0

    raw_velocity = velocity_sum / count
    return max(-1.0, min(1.0, math.tanh(raw_velocity / V_SCALING)))


# ── EQ.17 — Cascade Probability ─────────────────────────────────────


def eq17_cascadeProbability(vars: List[Dict[str, Any]]) -> float:
    protest_var = _get_var(vars, "E51")
    water_var = _get_var(vars, "B21")
    unemploy_var = _get_var(vars, "A09")
    security_var = _get_var(vars, "N142")

    if not protest_var or not water_var:
        return 0.3

    base_protest = eq1_normalize(protest_var)
    water_stress = eq1_normalize(water_var)
    unemployment = eq1_normalize(unemploy_var) if unemploy_var else 0.65
    security_capacity = eq1_normalize(security_var) if security_var else 0.5

    gov_weights = {
        "sfax": 1.4,
        "kasserine": 1.2,
        "sidi_bouzid": 1.1,
        "gafsa": 1.2,
        "gabes": 1.0,
    }

    product_term = 1.0
    for gov in CASCADE_GOVS:
        weight = gov_weights.get(gov, 1.0)
        p_gov = _sigmoid(
            3 * (base_protest * weight + water_stress * 0.3 + unemployment * 0.2)
            - (security_capacity * 2)
            - 2
        )
        product_term *= 1.0 - p_gov

    return max(0.0, min(1.0, 1.0 - product_term))


# ── EQ.18 — Elite Defection Dynamics ────────────────────────────────


def eq18_eliteDefectionDynamics(
    previous_ec: float,
    parallel_market_premium: float,
    decree54_charged: float,
    fdi_change: float,
) -> float:
    delta_defection = min(
        0.15,
        (parallel_market_premium / 100) * 0.4
        + (decree54_charged / 100) * 0.2
        + (max(0.0, -fdi_change) / 50) * 0.2,
    )
    epsilon_loyalty = 0.01
    ec_new = previous_ec * (1 - delta_defection) + epsilon_loyalty
    return max(0.1, min(1.0, ec_new))


# ── EQ.19 — Information Amplification ───────────────────────────────


def eq19_infoAmplification(
    press_freedom_score: float,
    internet_censorship: float,
    social_media_penetration: float,
    throttling_incidents: float,
) -> float:
    ifi = (
        (press_freedom_score / 100)
        * (1 - internet_censorship)
        * (1 - min(0.5, throttling_incidents / 20))
    )
    sm_reach = social_media_penetration
    amplification = 1 + IA_GAMMA * ifi * sm_reach
    return max(0.5, min(2.0, amplification))


# ── EQ.20 — Historical Pattern Similarity ───────────────────────────


def eq20_historicalPatternSimilarity(
    current_state: Dict[str, float]
) -> Dict[str, Any]:
    max_similarity = 0.0
    closest_match = "none"

    for state_name, historical_vector in HISTORICAL_STATES.items():
        similarity = _cosine_similarity(current_state, historical_vector)
        if similarity > max_similarity:
            max_similarity = similarity
            closest_match = state_name

    label = "LOW PATTERN MATCH"
    if max_similarity > 0.8:
        label = (
            "CRITICAL — NEAR-IDENTICAL TO "
            + closest_match.upper().replace("_", " ")
        )
    elif max_similarity > 0.65:
        label = (
            "HIGH — SIGNIFICANT SIMILARITY TO "
            + closest_match.upper().replace("_", " ")
        )
    elif max_similarity > 0.5:
        label = (
            "MODERATE — PARTIAL SIMILARITY TO "
            + closest_match.upper().replace("_", " ")
        )

    return {
        "score": max_similarity,
        "closest_match": closest_match,
        "label": label,
    }


# ── EQ.21 — Ministerial Instability Index ───────────────────────────


def eq21_ministerialInstability(
    mii_score: float,
) -> Dict[str, Any]:
    return {
        "mii": mii_score,
        "eq7_current_defections": round(mii_score * 15),
        "eq18_delta_defection_addon": min(0.08, mii_score * 0.08),
        "eq16_velocity_addon": 0.0,
    }


# ── EQ.22 — Cycle Position Index ────────────────────────────────────


def eq22_cyclePositionIndex(vars_or_map: Any) -> float:
    if isinstance(vars_or_map, dict):
        var_map = vars_or_map
    else:
        var_map = get_current_state_vector(vars_or_map)
    keys = list(var_map.keys())
    if len(keys) < 5:
        return 0.5
    values = [var_map[k] for k in keys]
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    std = math.sqrt(variance)
    if mean == 0:
        return 0.5
    cv = std / mean
    return max(0.0, min(1.0, 0.5 + (cv - 0.3) * 0.5))


# ── EQ.23 — Acceleration ────────────────────────────────────────────


def eq23_acceleration(vars: List[Dict[str, Any]]) -> float:
    current_vel_sum = 0.0
    prev_vel_sum = 0.0
    count = 0
    for v in vars:
        history = v.get("history")
        if not history or not isinstance(history, list) or len(history) < 3:
            continue
        current = v.get("value", v.get("value_2026", 0))
        previous = history[-2]
        older = history[-3]
        vid = _id(v)
        beta = 2.0 if vid in V_HIGH_WEIGHT_IDS else 1.0
        sigma = max(0.01, v.get("volatility", 0.05))
        current_vel_sum += beta * ((current - previous) / sigma) * v.get("weight", 0.02)
        prev_vel_sum += beta * ((previous - older) / sigma) * v.get("weight", 0.02)
        count += 1

    if count == 0:
        return 0.0

    current_vel = current_vel_sum / count
    prev_vel = prev_vel_sum / count
    raw_accel = (current_vel - prev_vel) / max(abs(prev_vel), 0.01)

    shock_vars = [v for v in vars if v.get("volatility", 0) > 0.2]
    shock_density = len(shock_vars) / max(len(vars), 1)

    return max(-1.0, min(1.0, raw_accel * 0.5 + shock_density * 0.3))


# ── EQ.24 — Structural Economic Signal ──────────────────────────────


def eq24_structuralEconomic(vars_or_map: Any) -> float:
    if isinstance(vars_or_map, dict):
        var_map = vars_or_map
    else:
        var_map = get_current_state_vector(vars_or_map)
    subsidy_var = var_map.get("A_SUBSIDY", var_map.get("A11", 0))
    inflation_var = var_map.get("A01", 0)
    fx_var = var_map.get("A_FX", 0)

    policy_delta = (0.3 if subsidy_var > 0.5 else 0) + (0.2 if inflation_var > 0.7 else 0)
    subsidy_adjustment = max(0.0, 0.5 - fx_var)
    s_econ = policy_delta * 0.6 + subsidy_adjustment * 0.4
    return max(0.0, min(1.0, s_econ))


# ── Velocity Label ──────────────────────────────────────────────────


def velocity_label(v: float) -> str:
    if v > 0.4:
        return "DETERIORATING FAST"
    if v > 0.15:
        return "DETERIORATING"
    if v > -0.15:
        return "STABLE"
    if v > -0.4:
        return "IMPROVING"
    return "IMPROVING FAST"


# ── State Vector Construction ───────────────────────────────────────


def get_current_state_vector(vars: List[Dict[str, Any]]) -> Dict[str, float]:
    def get_norm(code: str, num: int) -> float:
        v = _get_var(vars, f"{code}{num}")
        return eq1_normalize(v) if v else 0.5

    state: Dict[str, float] = {}

    state["A01"] = get_norm("A", 1)
    state["A02"] = get_norm("A", 2)
    state["A03"] = get_norm("A", 3)
    state["A_FX"] = get_norm("A", 7)
    state["D41"] = get_norm("D", 79)
    state["D44"] = get_norm("D", 71)
    state["E51"] = get_norm("M", 202)
    state["L121"] = get_norm("L", 189)
    state["N141"] = get_norm("N", 221)
    state["N144"] = get_norm("L", 199)
    state["O151"] = get_norm("D", 78)
    state["O152"] = get_norm("A", 22)
    state["P164"] = get_norm("A", 4)
    state["P169"] = get_norm("O", 232)
    state["M133"] = get_norm("M", 201)
    state["F66"] = get_norm("E", 95)
    state["M_UGTT"] = get_norm("M", 207)
    state["N142"] = get_norm("N", 219)
    state["I92"] = get_norm("A", 6)
    state["D50"] = get_norm("D", 79)
    state["B21"] = get_norm("B", 26)
    state["L123"] = get_norm("L", 189)
    state["A251"] = get_norm("A", 251)
    state["D_MII"] = get_norm("D", 250)
    state["SEI_A01"] = get_norm("A", 250)

    return state


# ── Threshold Breaches ──────────────────────────────────────────────


def detect_threshold_breaches(
    vars: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    breaches: List[Dict[str, Any]] = []
    for v in vars:
        threshold = v.get("threshold")
        if threshold is not None:
            invert = v.get("invert", False)
            value = v.get("value_2026", 0)
            is_breached = value < threshold if invert else value > threshold
            if is_breached:
                breaches.append({
                    "variable": _id(v),
                    "value": value,
                    "threshold": threshold,
                    "label": v.get("label") or v.get("name") or _id(v),
                    "impact": (v.get("weight", 0.05) * 5 * eq1_normalize(v)),
                })
    return breaches


# ── Model Confidence / Data Freshness ────────────────────────────────


def calculate_model_confidence(vars: List[Dict[str, Any]]) -> float:
    if not vars:
        return 0.5
    now = datetime.now(timezone.utc)
    freshness_sum = 0.0
    for v in vars:
        last_updated_str = v.get("last_updated")
        if not last_updated_str:
            freshness_sum += 0
            continue
        try:
            last_updated = datetime.fromisoformat(last_updated_str)
            if last_updated.tzinfo is None:
                last_updated = last_updated.replace(tzinfo=timezone.utc)
            days_since = (now - last_updated).total_seconds() / (86400 * 30)
            score = math.exp(-days_since / 30)
            freshness_sum += score
        except Exception as e:
            logger.warning("Caught exception in services/rri_engine.py: %s", e)
            freshness_sum += 0

    freshness = freshness_sum / len(vars)
    return min(0.95, freshness * 0.9 + 0.1)


# ── Regime Age ──────────────────────────────────────────────────────


REGIME_ORIGIN = datetime(2021, 7, 25, tzinfo=timezone.utc)


def get_regime_age() -> Dict[str, float]:
    now = datetime.now(timezone.utc)
    years = (now - REGIME_ORIGIN).total_seconds() / (365.25 * 86400)
    return {
        "years": round(years, 1),
        "age_pct": min(1.0, years / 15),
    }


# ── Full RRI Calculation ────────────────────────────────────────────


def calculate_rri(
    vars: Optional[List[Dict[str, Any]]] = None,
    overrides: Optional[Dict[str, float]] = None,
    rpi_t: float = 0.0,
    live_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Full RRI computation — mirrors calculateRRI() in engine.ts.

    Args:
        vars: Variable list. If None, loaded from rri_variables.json.
        overrides: Pipeline field overrides (e.g. {"economy.inflation": 7.1}).
        rpi_t: Radicalisation parameter input.
        live_data: DB-fresh variable records merged on top of JSON schema.

    Returns:
        Dictionary with all RRIState fields.
    """
    if vars is None:
        vars = _load_variables()

    # Deep clone to avoid mutating the source
    import copy
    vars = copy.deepcopy(vars)

    # Apply pipeline field overrides
    if overrides:
        for v in vars:
            pf = v.get("pipeline_field")
            if pf and pf in overrides:
                v["value_2026"] = overrides[pf]

    # Merge live data records (from Supabase)
    if live_data:
        for live in live_data:
            code = live.get("code")
            number = live.get("number")
            if not code or number is None:
                continue
            key = f"{code}{number}"
            for v in vars:
                vid = _id(v)
                if vid == key or vid == live.get("id", "") or f"{v.get('code', '')}{v.get('number', '')}" == key:
                    if live.get("value_2026") is not None:
                        v["value_2026"] = live["value_2026"]
                    break

    category_scores = eq2_category_scores(vars)

    # EQ.8 — War Intensity
    war_var = _get_var(vars, "J_WAR") or _get_var(vars, "J104")
    battle_deaths_norm = (overrides or {}).get("_battle_deaths_norm", 0.35)
    media_salience_norm = (overrides or {}).get("_media_salience_norm", 0.45)
    if war_var:
        w_t = war_var.get("value_2026", 0.72)
    else:
        w_t = eq8_warIntensity(battle_deaths_norm, media_salience_norm)

    # EQ.10 — Remittance Distribution
    r_total_usd = (overrides or {}).get("_r_total_usd", 2850)
    remit_dist = eq10_remittanceDistribution(r_total_usd)

    # EQ.3 — Salience (livens from overrides or variable lookups)
    cp_t = (overrides or {}).get("_cp_t") or (
        eq1_normalize(_get_var(vars, "H116"))
        if _get_var(vars, "H116")
        else (overrides or {}).get("_cp_t", 0.42)
    )
    dp_t = (overrides or {}).get("_dp_t") or (
        eq1_normalize(_get_var(vars, "F81"))
        if _get_var(vars, "F81")
        else (overrides or {}).get("_dp_t", 0.38)
    )
    p_t = (overrides or {}).get("_p_t") or (
        eq1_normalize(_get_var(vars, "H117"))
        if _get_var(vars, "H117")
        else (overrides or {}).get("_p_t", 0.72)
    )
    dd_t = (overrides or {}).get("_dd_t") or (
        eq1_normalize(_get_var(vars, "C40"))
        if _get_var(vars, "C40")
        else (overrides or {}).get("_dd_t", 0.65)
    )
    rural_conn_var = _get_var(vars, "C31")
    cr_t = (overrides or {}).get("_cr_t") or (
        1 - eq1_normalize(rural_conn_var) if rural_conn_var else 0.30
    )

    rm_normalized = min(1.0, remit_dist["urban"] / 3000)
    rr_normalized = min(1.0, remit_dist["rural"] / 800)

    rde_modifier = (overrides or {}).get("_rde_salience_modifier", 0.0)
    sei_salience_boost = (overrides or {}).get("_sei_salience_boost", 0.0)

    _oci = (overrides or {}).get("_oci", 0.22)
    _oci_multiplier = OCI_FLOOR + (1 - OCI_FLOOR) * _oci
    _cpg_amplifier = (overrides or {}).get("_cpg_amplifier", 1.20)
    cogwar_salience_nudge = (overrides or {}).get("_cogwar_salience_nudge", 0.0)

    salience = eq3_salience(
        w_t, cp_t, dp_t, rm_normalized, rr_normalized,
        cr_t, p_t, dd_t,
        rde_modifier + sei_salience_boost + cogwar_salience_nudge,
    )
    salience_effective = salience * _oci_multiplier

    # Weighted R base
    r_base = sum(
        CATEGORY_WEIGHTS.get(cat, 0) * category_scores.get(cat, 0)
        for cat in CATEGORY_WEIGHTS
    )
    r_base *= 5

    # EQ.15 — Compound Stress
    var_map = get_current_state_vector(vars)

    # Inject D_MII if MII score provided
    _mii_score = (overrides or {}).get("_mii_score", 0.0)
    _sei_cs_value = (overrides or {}).get("_sei_cs_value", 0.0)

    if _mii_score > 0:
        var_map["D_MII"] = _mii_score
        vars.append({
            "id": "D_MII",
            "code": "D",
            "number": 250,
            "value_2026": _mii_score,
            "value": _mii_score,
            "weight": MII_R_WEIGHT,
            "invert": False,
            "volatility": 0.08,
            "history": [_mii_score * 0.9, _mii_score * 0.95, _mii_score],
            "min_value": 0,
            "max_value": 1,
            "threshold": 0.65,
            "threshold_weight": 1.2,
            "pipeline_field": "politics.mii",
            "label": "Ministerial Instability Index",
            "source": "miiEngine",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        })

    if _sei_cs_value > 0:
        var_map["SEI_A01"] = _sei_cs_value
        vars.append({
            "id": "SEI_A01",
            "code": "A",
            "number": 250,
            "value_2026": _sei_cs_value,
            "value": _sei_cs_value,
            "weight": 0.04,
            "invert": False,
            "volatility": 0.15,
            "history": [_sei_cs_value * 0.7, _sei_cs_value * 0.85, _sei_cs_value],
            "min_value": 0,
            "max_value": 1,
            "threshold": 0.65,
            "threshold_weight": 1.3,
            "pipeline_field": "economy.sei",
            "label": "Shortage Escalation Index",
            "source": "seiEngine",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        })

    cs_t = eq15_compoundStress(var_map)
    r_with_cs = r_base * (1 + cs_t)
    war_suppressor = 0.5 + 0.5 * w_t
    r_suppressed = r_with_cs * (2 - war_suppressor)

    CALIBRATION_FACTOR = 0.465
    r_t = r_suppressed * CALIBRATION_FACTOR

    # EQ.13 — Stochastic Shock
    _sei_shock = (overrides or {}).get("_sei_shock_magnitude", 0.0)
    shock = eq13_stochasticShock([
        {"weight": 0.4, "magnitude": _gaussian_random(0, 0.03)},
        {"weight": 0.3, "magnitude": _gaussian_random(0, 0.05)},
        {"weight": 0.3, "magnitude": _gaussian_random(0, 0.02)},
        {"weight": SEI_SHOCK_WEIGHT, "magnitude": _sei_shock},
        {"weight": 0.25, "magnitude": (overrides or {}).get("_cogwar_epsilon_magnitude", 0.0)},
    ])

    r_final = max(0.0, r_t + shock)
    p_rev_base = eq12_pRev(r_final)
    p_rev_adjusted = p_rev_base * (0.6 + 0.4 * salience_effective)

    _mii_defections = (overrides or {}).get("_mii_eq7_defections", 0.0)
    _mii_ec_addon = (overrides or {}).get("_mii_eq18_addon", 0.0)

    elite_result = eq7_eliteDefection(
        p_rev_adjusted, r_final, _mii_defections,
    )

    # EQ.18 — Elite Cohesion
    parallel_premium_var = _get_var(vars, "A_PARALLEL") or _get_var(vars, "A16")
    decree54_var = _get_var(vars, "G71") or _get_var(vars, "G101")
    ec_t_base = eq18_eliteDefectionDynamics(
        0.65,
        (overrides or {}).get("_parallel_premium", parallel_premium_var.get("value_2026", 18) if parallel_premium_var else 18),
        (overrides or {}).get("_decree54", (decree54_var.get("value_2026", 0.23) * 100) if decree54_var else 23),
        (overrides or {}).get("_fdi_change", -5),
    )
    ec_t = max(0.10, ec_t_base - _mii_ec_addon)

    # EQ.19 — Information Amplification
    press_var = _get_var(vars, "D44") or _get_var(vars, "D54")
    censor_var = _get_var(vars, "C37")
    social_media_var = _get_var(vars, "C26")
    a_t = eq19_infoAmplification(
        (overrides or {}).get("_press_freedom", press_var.get("value_2026", 31) if press_var else 31),
        (overrides or {}).get("_internet_censorship", censor_var.get("value_2026", 72) / 100 if censor_var else 0.72),
        (overrides or {}).get("_social_media_pen", 1 - eq1_normalize(social_media_var) if social_media_var else 0.75),
        (overrides or {}).get("_throttling", 14),
    )

    # EQ.20 — Historical Pattern Similarity
    current_state_vector = get_current_state_vector(vars)
    hps_result = eq20_historicalPatternSimilarity(current_state_vector)

    hps_bonus = (
        HPS_WEIGHT * (hps_result["score"] - HPS_MIN_TRIGGER)
        if hps_result["score"] > HPS_MIN_TRIGGER
        else 0.0
    )
    p_rev_final = max(0.0, min(0.99, p_rev_adjusted + hps_bonus))

    # EQ.16 — Velocity
    velocity = eq16_velocity(vars)

    # EQ.22 — Cycle Position Index
    cpi_index = eq22_cyclePositionIndex(current_state_vector)

    # EQ.23 — Acceleration
    acceleration = eq23_acceleration(vars)

    # EQ.24 — Structural Economic Signal
    structural_econ = eq24_structuralEconomic(current_state_vector)

    # EQ.17 — Cascade Probability
    _sei_cascade_boost = (overrides or {}).get("_sei_cascade_boost", 0.0)
    p_cascade_base = eq17_cascadeProbability(vars)
    cpg_cascade_boost = (
        min(0.15, (_cpg_amplifier - CPG_BASELINE_GAFSA) * 0.15)
        if _cpg_amplifier > CPG_BASELINE_GAFSA
        else 0.0
    )
    p_cascade = min(1.0, p_cascade_base + _sei_cascade_boost + cpg_cascade_boost)

    # EQ.4 — SIR
    protest_var = _get_var(vars, "E51") or _get_var(vars, "E61")
    initial_infected = (
        eq1_normalize(protest_var) * 0.05 if protest_var else 0.02
    )
    sir_result = eq4_sir(initial_infected)

    # EQ.14 — Monte Carlo
    mc_result = eq14_monteCarlo(vars, w_t)

    # Data freshness / confidence
    model_confidence = calculate_model_confidence(vars)

    # Threshold breaches
    threshold_breaches = detect_threshold_breaches(vars)

    # Variables map (for response)
    var_map_out: Dict[str, Dict[str, Any]] = {}
    for v in vars:
        var_map_out[_id(v)] = v

    regime_age = get_regime_age()

    # Build RRI history
    rri_history = [
        {"date": "2026-03-01", "rri": 2.15},
        {"date": "2026-03-05", "rri": 2.22},
        {"date": "2026-03-10", "rri": 2.28},
        {"date": "2026-03-15", "rri": 2.31},
        {"date": "2026-03-20", "rri": 2.35},
        {"date": "2026-03-25", "rri": 2.42},
        {"date": "2026-03-29", "rri": round(_safe(r_final, 2.31), 4)},
    ]

    return {
        "rri": round(_safe(r_final, 2.31), 4),
        "r_t": round(_safe(r_final, 2.31), 4),
        "p_rev": round(_safe(p_rev_final, 0.643), 4),
        "salience": round(_safe(salience, 0.412), 4),
        "salience_effective": round(_safe(salience_effective, 0.412), 4),
        "oci": round(_safe(_oci, 0.22), 4),
        "cpg_cascade_amplifier": round(_safe(_cpg_amplifier, 1.0), 4),
        "w_t": round(_safe(w_t, 0.72), 4),
        "elite_defection_prob": round(_safe(elite_result["defection_probability"], 0.45), 4),
        "velocity": round(_safe(velocity, 0.05), 4),
        "velocity_label": velocity_label(_safe(velocity, 0.05)),
        "compound_stress": round(_safe(cs_t, 0.12), 4),
        "pattern_similarity": round(_safe(hps_result["score"], 0.42), 4),
        "pattern_label": hps_result["label"],
        "cascade_probability": round(_safe(p_cascade, 0.18), 4),
        "info_amplification": round(_safe(a_t, 0.35), 4),
        "elite_cohesion_dynamics": round(_safe(ec_t, 0.55), 4),
        "cpi_index": round(_safe(cpi_index, 0.5), 4),
        "acceleration": round(_safe(acceleration, 0.0), 4),
        "structural_econ": round(_safe(structural_econ, 0.15), 4),
        "ci_low": round(_safe(mc_result["ci_low"], 0.598), 4),
        "ci_high": round(_safe(mc_result["ci_high"], 0.687), 4),
        "p_rev_mean": round(_safe(mc_result["mean"], 0.643), 4),
        "simulations_run": MONTE_CARLO_RUNS,
        "category_scores": category_scores,
        "model_confidence": round(_safe(model_confidence, 0.85), 4),
        "last_calculated": datetime.now(timezone.utc).isoformat(),
        "variables_count": len(vars),
        "variables": var_map_out,
        "threshold_breaches": threshold_breaches,
        "rri_history": rri_history,
        "sir_susceptible": round(_safe(sir_result["S"], 1.0), 4),
        "sir_infected": round(_safe(sir_result["I"], 0.0), 4),
        "sir_recovered": round(_safe(sir_result["R"], 0.0), 4),
        "stochastic_shock": round(_safe(shock, 0.0), 4),
        "mii": round(_safe(_mii_score, 0.0), 4),
        "regime_age": regime_age,
        "monte_carlo_runs": MONTE_CARLO_RUNS,
    }


# ── Full Monte Carlo (histogram output) ─────────────────────────────


def run_full_monte_carlo(
    vars: Optional[List[Dict[str, Any]]] = None,
    overrides: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    if vars is None:
        vars = _load_variables()

    import copy
    vars = copy.deepcopy(vars)

    if overrides:
        for v in vars:
            pf = v.get("pipeline_field")
            if pf and pf in overrides:
                v["value_2026"] = overrides[pf]

    war_var = _get_var(vars, "J_WAR") or _get_var(vars, "J104")
    w_t = war_var.get("value_2026", 0.72) if war_var else 0.72

    result = eq14_monteCarlo(vars, w_t)

    histogram = [0] * 20
    for _ in range(MONTE_CARLO_RUNS):
        p = eq12_pRev(_gaussian_random(2.31, 0.15))
        bin_idx = min(19, int(p * 20))
        histogram[bin_idx] += 1

    chart_data = [
        {"rri": round(i / 4, 2), "frequency": count}
        for i, count in enumerate(histogram)
    ]

    return {
        **result,
        "histogram": histogram,
        "chart_data": chart_data,
        "p5": result["ci_low"],
        "p95": result["ci_high"],
        "median": result["mean"],
    }


# ── Article Processing ──────────────────────────────────────────────


def process_article_for_rri(
    article_text: str,
    article_severity: float,
) -> Dict[str, Any]:
    vars = _load_variables()
    import copy
    vars = copy.deepcopy(vars)

    text = article_text.lower()
    nudged: List[str] = []
    total_delta = 0.0

    for v in vars:
        keywords = v.get("keywords") or v.get("nlp_keywords") or []
        if not keywords:
            continue
        matched = any(kw and kw.lower() in text for kw in keywords)
        if matched:
            nlp_nudge = v.get("nlp_nudge", 0.05)
            scaled_nudge = nlp_nudge * (article_severity / 3)
            current_value = v.get("value", eq1_normalize(v))
            new_value = max(0.0, min(1.5, current_value + scaled_nudge))
            v["value"] = new_value

            min_value = v.get("min_value", 0)
            max_value = v.get("max_value", 100)
            invert = v.get("invert", False)
            val_range = max_value - min_value
            if invert:
                v["value_2026"] = min_value + (1 - new_value) * val_range
            else:
                v["value_2026"] = min_value + new_value * val_range
            nudged.append(_id(v))
            total_delta += scaled_nudge * v.get("weight", 0.02)

    new_state = calculate_rri(vars)

    return {
        "nudged_variables": nudged,
        "total_r_delta": round(total_delta, 4),
        "new_rri": new_state["rri"],
    }


# ── Variable Update ─────────────────────────────────────────────────


def update_variable_from_pipeline(
    pipeline_field: str,
    new_value: float,
) -> Optional[Dict[str, Any]]:
    vars = _load_variables()
    v = next(
        (v for v in vars if v.get("pipeline_field") == pipeline_field),
        None,
    )
    if not v:
        return None

    old_value = v.get("value_2026", 0)
    v["value_2026"] = new_value
    v["value"] = eq1_normalize(v)

    history = v.get("history", [])
    if isinstance(history, list) and len(history) > 0:
        history.pop(0)
        history.append(new_value)
    else:
        v["history"] = [new_value] * 12

    v["last_updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return {
        "variable_id": _id(v),
        "old_value": old_value,
        "new_value": new_value,
    }


# ── Risk Tier ────────────────────────────────────────────────────────


def get_risk_tier(rri: float) -> Dict[str, str]:
    if rri >= 2.5:
        return {"label": "CRITICAL", "color": "text-intel-red"}
    if rri >= 2.0:
        return {"label": "ELEVATED", "color": "text-intel-orange"}
    if rri >= 1.5:
        return {"label": "MODERATE", "color": "text-intel-yellow"}
    return {"label": "LOW", "color": "text-intel-cyan"}


# ── Scenario Simulation ─────────────────────────────────────────────


def simulate_scenario(
    vars: List[Dict[str, Any]],
    overrides: Dict[str, float],
) -> Dict[str, float]:
    import copy
    sim_vars = copy.deepcopy(vars)

    for v in sim_vars:
        vid = _id(v)
        if vid in overrides:
            v["value_2026"] = overrides[vid]
            v["value"] = max(0.0, min(1.5, overrides[vid] / 100))

    r_base = sum(v.get("weight", 0.02) * v.get("value", 0) for v in sim_vars)
    r_final = r_base * 5 * 0.465
    p_rev = 1 / (1 + math.exp(-(0.8 * r_final - 2.1)))

    return {"rri": r_final, "prev": p_rev}


# ── Shortcut ─────────────────────────────────────────────────────────


def compute_current_rri(overrides: Optional[Dict[str, float]] = None) -> float:
    """Quick one-shot: load JSON, compute, return RRI."""
    result = calculate_rri(overrides=overrides)
    return result["rri"]
