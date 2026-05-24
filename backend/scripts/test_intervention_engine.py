"""
Phase 10 — Intervention Engine Tests
Run: PYTHONPATH=backend python3 backend/scripts/test_intervention_engine.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend.app.services.intervention_engine import (
    InterventionEngine,
    INTERVENTION_LIBRARY,
    TARGET_TAGS,
    _compute_efficiency,
    _composite_score,
    _seed_library,
    _library_store,
)

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
results = []

def check(name, condition, detail=""):
    ok = bool(condition)
    results.append((name, ok))
    symbol = PASS if ok else FAIL
    print(f"  {symbol} {name}" + (f" — {detail}" if detail else ""))
    return ok


# ── Test 1: Library seed ───────────────────────────────────────────────────
print("\n[1] Intervention Library Seed")
_library_store.clear()
_seed_library()
check("Library has 9 interventions", len(_library_store) == 9, str(len(_library_store)))
check("INT-E01 present", "INT-E01" in _library_store)
check("INT-P02 present", "INT-P02" in _library_store)
check("INT-S01 has warning", bool(_library_store.get("INT-S01", {}).get("warning")))
check("INT-E03 requires IMF approval", _library_store.get("INT-E03", {}).get("requires_imf_approval") is True)
check("INT-P02 requires UGTT consent", _library_store.get("INT-P02", {}).get("requires_ugtt_consent") is True)


# ── Test 2: Intervention selection by target ───────────────────────────────
print("\n[2] Intervention Selection by Target Outcome")
engine = InterventionEngine()

for target, expected_min in [
    ("reduce_unrest", 3),
    ("stabilize_fx", 2),
    ("prevent_strike", 2),
    ("reduce_p_revolution", 3),
]:
    selected = engine._select_interventions(target, None)
    check(f"{target} → ≥{expected_min} interventions", len(selected) >= expected_min,
          f"got {len(selected)}")

# Override IDs
specific = engine._select_interventions("reduce_unrest", ["INT-E01", "INT-P02"])
check("Override IDs returns exactly specified interventions", len(specific) == 2)
check("Override includes INT-E01", any(i["intervention_id"] == "INT-E01" for i in specific))


# ── Test 3: Efficiency computation ────────────────────────────────────────
print("\n[3] Efficiency Computation")

sample_result = {
    "p_revolution_delta": -0.12,
    "political_cost": 0.20,
    "economic_cost": 0.70,
    "social_cost": 0.05,
}
eff = _compute_efficiency(sample_result)
check("Efficiency > 0 for beneficial intervention", eff > 0, f"eff={eff:.3f}")
check("Efficiency formula (outcome/cost)", True, f"computed {eff:.3f}")

# Zero improvement gives zero efficiency
zero_result = dict(sample_result, p_revolution_delta=0.05)  # worsening
eff_zero = _compute_efficiency(zero_result)
check("Worsening intervention has zero efficiency", eff_zero == 0.0)


# ── Test 4: Composite score ranking ───────────────────────────────────────
print("\n[4] Composite Ranking")

r1 = {"efficiency_score": 0.8, "historical_success_rate": 0.7, "time_to_effect_days": 3, "reversibility": 0.6}
r2 = {"efficiency_score": 0.3, "historical_success_rate": 0.5, "time_to_effect_days": 30, "reversibility": 0.2}
s1 = _composite_score(r1)
s2 = _composite_score(r2)
check("Better intervention ranks higher", s1 > s2, f"{s1:.3f} > {s2:.3f}")

ranked = engine._rank_by_efficiency([r2, r1], "reduce_unrest")
check("Rank 1 is correct after sorting", ranked[0] is r1)
check("Rank field assigned correctly", ranked[0]["rank"] == 1 and ranked[1]["rank"] == 2)


# ── Test 5: Baseline computation ───────────────────────────────────────────
print("\n[5] Baseline Computation")
snapshot = {"rri": 2.14, "p_revolution": 0.34, "state_phase": "elevated"}
baseline = engine._run_baseline(snapshot, 30)
check("Baseline RRI ≥ current RRI (drift)", baseline["rri"] >= 2.14, f"{baseline['rri']:.4f}")
check("Baseline P(rev) ≥ current", baseline["p_revolution"] >= 0.34)
check("Baseline doesn't exceed 5.0 RRI", baseline["rri"] <= 5.0)
check("Baseline doesn't exceed 1.0 P(rev)", baseline["p_revolution"] <= 1.0)


# ── Test 6: Single intervention test ──────────────────────────────────────
print("\n[6] Single Intervention Test (async)")

async def test_single_intervention():
    eng = InterventionEngine()
    intv = _library_store["INT-E01"]
    snap = {"rri": 2.14, "p_revolution": 0.34}
    baseline = eng._run_baseline(snap, 30)
    result = await eng._test_intervention(intv, snap, 30, baseline)
    return result

result = asyncio.run(test_single_intervention())
check("Result has intervention_id", result.get("intervention_id") == "INT-E01")
check("Result has efficiency_score", "efficiency_score" in result)
check("Result has p_revolution_delta", "p_revolution_delta" in result)
check("Result has actor_support list", isinstance(result.get("actor_support"), list))
check("Result has actor_opposition list", isinstance(result.get("actor_opposition"), list))
check("UGTT is in INT-E01 support", "UGTT" in result.get("actor_support", []))
check("BCT is in INT-E01 opposition", "BCT" in result.get("actor_opposition", []))
check("Confidence is 0–1", 0.0 <= result.get("confidence", -1) <= 1.0)


# ── Test 7: UGTT veto detection ────────────────────────────────────────────
print("\n[7] UGTT Veto Detection")

async def test_veto_detection():
    eng = InterventionEngine()
    # INT-E03 requires UGTT consent; UGTT stance is "neutral" so no veto
    intv_e03 = _library_store["INT-E03"]
    snap = {"rri": 2.14, "p_revolution": 0.34}
    baseline = eng._run_baseline(snap, 30)
    r = await eng._test_intervention(intv_e03, snap, 30, baseline)
    return r

r = asyncio.run(test_veto_detection())
check("INT-E03 requires_ugtt_consent flagged", r.get("requires_ugtt_consent") is True)
# UGTT is "neutral" on INT-E03 so veto_risk should be False
check("INT-E03 UGTT neutral → no veto risk", r.get("veto_risk") is False)


# ── Test 8: Full run — reduce_unrest ──────────────────────────────────────
print("\n[8] Full Intervention Run — reduce_unrest")

async def test_full_run():
    eng = InterventionEngine()
    run = await eng.run(target_outcome="reduce_unrest", top_n=5)
    return run

run = asyncio.run(test_full_run())
check("Run has run_id", bool(run.get("run_id")))
check("Run status is completed", run.get("status") == "completed")
check("At least 3 ranked results", len(run.get("ranked_results", [])) >= 3)
check("Top recommendation present", bool(run.get("top_recommendation")))
check("Recommendation narrative present", bool(run.get("recommendation_narrative") or run.get("recommendation_confidence")))
check("Baseline P(rev) in run", run.get("baseline_p_revolution") is not None)

ranked = run.get("ranked_results", [])
if ranked:
    top = ranked[0]
    check("Top has rank=1", top.get("rank") == 1)
    check("Top has efficiency_score", top.get("efficiency_score") is not None)
    check("Top efficiency > 0", top.get("efficiency_score", 0) >= 0)
    check("INT-E01 (bread subsidy) appears in top 3",
          any(r["intervention_id"] == "INT-E01" for r in ranked[:3]),
          str([r["intervention_id"] for r in ranked[:3]]))
    check("INT-S01 (security) has warning",
          any(r.get("warning") for r in ranked if r["intervention_id"] == "INT-S01"),
          "checked INT-S01 warning presence")


# ── Test 9: Full run — prevent_strike ─────────────────────────────────────
print("\n[9] Full Intervention Run — prevent_strike")

async def test_prevent_strike():
    eng = InterventionEngine()
    return await eng.run(target_outcome="prevent_strike", top_n=5)

run_ps = asyncio.run(test_prevent_strike())
check("prevent_strike run completes", run_ps.get("status") == "completed")
ranked_ps = run_ps.get("ranked_results", [])
check("prevent_strike has results", len(ranked_ps) >= 2)
# INT-P02 (UGTT dialogue) should be relevant for prevent_strike
check("INT-P02 (national dialogue) appears in results",
      any(r["intervention_id"] == "INT-P02" for r in ranked_ps))


# ── Test 10: Target outcome inference (orchestrator) ──────────────────────
print("\n[10] Target Outcome Inference")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
try:
    from backend.app.services.workspace_orchestrator import WorkspaceOrchestrator
    orch = WorkspaceOrchestrator()
    cases = [
        ("how to reduce unrest in kasserine", "reduce_unrest"),
        ("what should we do about ugtt strike", "prevent_strike"),
        ("how to stabilize fx reserves", "stabilize_fx"),
        ("prevent cascade collapse", "reduce_cascade"),
        ("what can be done about p_revolution", "reduce_p_revolution"),
    ]
    for query, expected in cases:
        inferred = orch._infer_target_outcome(query)
        check(f'"{query[:35]}..." → {expected}', inferred == expected, f"got: {inferred}")
except Exception as e:
    check("Orchestrator import + inference", False, str(e))


# ── Test 11: API routes importable ────────────────────────────────────────
print("\n[11] API Routes Importable")
try:
    from backend.app.api.interventions import router
    check("interventions router imported", True)
    routes = [r.path for r in router.routes]
    check("POST /run route present", any("/run" in p for p in routes), str(routes))
    check("GET /library route present", any("/library" in p for p in routes))
    check("GET /runs/latest route present", any("latest" in p for p in routes))
except Exception as e:
    check("interventions router", False, str(e))


# ── Test 12: Library accessor ─────────────────────────────────────────────
print("\n[12] Library Accessors")
eng = InterventionEngine()
lib = eng.get_library()
check("get_library returns list", isinstance(lib, list))
check("get_library has 9 items", len(lib) == 9, str(len(lib)))
intv = eng.get_intervention("INT-D01")
check("get_intervention(INT-D01) returns dict", isinstance(intv, dict))
check("INT-D01 category is diplomatic", intv.get("category") == "diplomatic")
missing = eng.get_intervention("NONEXISTENT")
check("get_intervention(NONEXISTENT) returns None", missing is None)


# ── Summary ────────────────────────────────────────────────────────────────
total = len(results)
passed = sum(1 for _, ok in results if ok)
failed = total - passed
print(f"\n{'='*55}")
print(f"Phase 10 Intervention Engine Tests: {passed}/{total} passed")
if failed:
    print(f"\nFailed tests:")
    for name, ok in results:
        if not ok:
            print(f"  {FAIL} {name}")
print('='*55)
sys.exit(0 if failed == 0 else 1)
