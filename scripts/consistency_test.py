"""
Python RRI Engine Consistency Test
Mirrors scripts/consistency_test.ts — same inputs, same equation tests.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.services.rri_engine import (
    calculate_rri,
    eq3_salience,
    eq4_sir,
    eq7_eliteDefection,
    eq8_warIntensity,
    eq12_pRev,
    eq15_compoundStress,
    eq16_velocity,
    eq17_cascadeProbability,
    eq18_eliteDefectionDynamics,
    eq19_infoAmplification,
    eq20_historicalPatternSimilarity,
    eq22_cyclePositionIndex,
    eq23_acceleration,
    eq24_structuralEconomic,
    _normalize,
    velocity_label,
    get_current_state_vector,
    _load_variables,
)


# ── 1. Equation-level tests ──────────────────────────────────────

results: list[dict] = []


def test(label: str, inputs: dict, fn, *args):
    out = fn(*args)
    range_ok = not (isinstance(out, float) and (out != out or abs(out) == float("inf")))
    results.append({
        "eq": label,
        "inputs": inputs,
        "output_py": round(out, 6) if isinstance(out, float) else (
            {k: round(v, 6) if isinstance(v, float) else v for k, v in out.items()}
            if isinstance(out, dict) else out
        ),
        "output_range_ok": range_ok,
    })


# EQ.3 — Salience
test("EQ.3 Salience",
     {"w_t": 0.72, "cp_t": 0.42, "dp_t": 0.38, "rm_t": 0.4, "rr_t": 0.3, "cr_t": 0.3, "p_t": 0.72, "dd_t": 0.65},
     eq3_salience, 0.72, 0.42, 0.38, 0.4, 0.3, 0.3, 0.72, 0.65)

# EQ.4 — SIR
test("EQ.4 SIR", {"initial_infected_pct": 0.02},
     eq4_sir, 0.02)

# EQ.7 — Elite Defection
test("EQ.7 Elite Defection", {"p_rev": 0.5, "r_t": 2.31, "defections": 0},
     eq7_eliteDefection, 0.5, 2.31, 0.0)

# EQ.8 — War Intensity
test("EQ.8 War Intensity", {"battle_deaths_norm": 0.35, "media_salience_norm": 0.45},
     eq8_warIntensity, 0.35, 0.45)

# EQ.12 — P_rev
test("EQ.12 P_rev", {"r_t": 2.31},
     eq12_pRev, 2.31)

# EQ.15 — Compound Stress (via state vector)
test_vars = _load_variables()
state_vector = get_current_state_vector(test_vars)
test("EQ.15 Compound Stress", {"via_state_vector": True},
     eq15_compoundStress, state_vector)

# EQ.16 — Velocity (needs history)
test("EQ.16 Velocity", {"via_cloned_vars": True},
     eq16_velocity, test_vars)

# EQ.17 — Cascade Probability
test("EQ.17 Cascade Probability", {"via_cloned_vars": True},
     eq17_cascadeProbability, test_vars)

# EQ.18 — Elite Defection Dynamics
test("EQ.18 Elite Defection Dynamics",
     {"previous_ec": 0.65, "parallel_market_premium": 18, "decree54_charged": 23, "fdi_change": -5},
     eq18_eliteDefectionDynamics, 0.65, 18, 23, -5)

# EQ.19 — Info Amplification
test("EQ.19 Info Amplification",
     {"press_freedom": 31, "internet_censorship": 0.72, "social_media_pen": 0.75, "throttling": 14},
     eq19_infoAmplification, 31, 0.72, 0.75, 14)

# EQ.20 — Historical Pattern Similarity
current_state = {
    "A01": 0.45, "A02": 0.72, "A03": 0.52, "A_FX": 0.40,
    "D41": 0.55, "D44": 0.35, "E51": 0.80, "L121": 0.85,
    "N141": 0.40, "N144": 0.25, "O151": 0.85, "O152": 0.82,
    "P164": 0.80, "P169": 0.75, "M133": 0.65, "F66": 0.72,
    "M_UGTT": 0.5, "N142": 0.5, "I92": 0.5, "D50": 0.5,
    "B21": 0.5, "L123": 0.5, "A251": 0.5, "D_MII": 0.5, "SEI_A01": 0.5,
}
test("EQ.20 HPS", {"state": "tunisia_2010_q3_vector"},
     eq20_historicalPatternSimilarity, current_state)

# EQ.22 — CPI Index (takes variables list like TS version)
test("EQ.22 CPI Index", {"via_cloned_vars": True},
     eq22_cyclePositionIndex, test_vars)

# EQ.23 — Acceleration (needs 3+ history)
test("EQ.23 Acceleration", {"via_cloned_vars": True},
     eq23_acceleration, test_vars)

# EQ.24 — Structural Economic (takes variables list like TS version)
test("EQ.24 Structural Economic", {"via_cloned_vars": True},
     eq24_structuralEconomic, test_vars)

# ── 2. Normalize helper ──────────────────────────────────────────
test("normalize(50, 0, 100, false)", {"raw": 50, "min": 0, "max": 100, "invert": False},
     _normalize, 50, 0, 100, False)
test("normalize(20, 0, 100, true)", {"raw": 20, "min": 0, "max": 100, "invert": True},
     _normalize, 20, 0, 100, True)

# ── 3. Velocity labels ───────────────────────────────────────────
test("velocityLabel(0.5)", {"v": 0.5}, velocity_label, 0.5)
test("velocityLabel(0.2)", {"v": 0.2}, velocity_label, 0.2)
test("velocityLabel(0)", {"v": 0}, velocity_label, 0)
test("velocityLabel(-0.2)", {"v": -0.2}, velocity_label, -0.2)
test("velocityLabel(-0.5)", {"v": -0.5}, velocity_label, -0.5)

# ── 4. Full RRI pipeline (deterministic fields only) ─────────────
full_result = calculate_rri()

deterministic_fields = [
    "rri", "p_rev", "salience", "salience_effective", "oci",
    "w_t", "elite_defection_prob", "velocity", "velocity_label",
    "compound_stress", "pattern_similarity", "pattern_label",
    "cascade_probability", "info_amplification", "elite_cohesion_dynamics",
    "cpi_index", "acceleration", "structural_econ",
    "sir_susceptible", "sir_infected", "sir_recovered",
    "category_scores", "model_confidence", "variables_count",
    "stochastic_shock",
]

field_results = {}
for field in deterministic_fields:
    val = full_result.get(field)
    range_ok = False
    if isinstance(val, (int, float)):
        range_ok = not (val != val or abs(val) == float("inf")) and -5 <= val <= 5
    elif isinstance(val, str):
        range_ok = len(val) > 0
    elif isinstance(val, dict):
        range_ok = True
    field_results[field] = {
        "type": type(val).__name__,
        "value": val,
        "range_ok": range_ok,
    }

# ── Output ──────────────────────────────────────────────────────
output = {
    "equation_tests": results,
    "full_rri_fields": field_results,
    "full_rri": {
        "rri": full_result["rri"],
        "p_rev": full_result["p_rev"],
        "velocity": full_result["velocity"],
        "category_scores_keys": list(full_result.get("category_scores", {}).keys()),
        "variables_count": full_result.get("variables_count", 0),
    },
}

print(json.dumps(output, indent=2, default=str))
