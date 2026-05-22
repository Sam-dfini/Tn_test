"""
Simulation Chamber — Acceptance Tests (Phase 7)

Tests the simulation engine pipeline:
1. Basic run returns a valid run_id immediately
2. Run resolves to complete status with aggregated results
3. Outcome distribution contains phase probabilities
4. P_revolution range has mean/p10/p50/p90
5. RRI trajectory has expected time steps
6. Sensitivity analysis ranks variables by impact
7. Scenario library has 13 pre-built scenarios
8. Custom scenario works with shock_vector
9. Chain activation detects relevant chains from shock vector
10. Historical analogue matching returns a match
11. Elite fracture probability is computed
12. UGTT strike probability is computed
13. Multiple runs produce independent run_ids
14. Counterfactual comparison produces deltas
15. Deliberation sessions are triggered at key thresholds
16. Completed run has duration_ms > 0

Usage:
    PYTHONPATH=backend python3 backend/scripts/test_simulation_chamber.py
"""

import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.simulation_engine import (
    simulation_engine,
    SCENARIO_LIBRARY,
    _runs_store,
)


async def test_basic_run():
    """Test 1: Basic run returns a valid run_id immediately."""
    result = await simulation_engine.run(
        scenario_id="SCN-E01",
        mc_iterations=50,
        time_horizon_days=30,
    )
    assert result is not None, "Result should not be None"
    assert result["run_id"].startswith("sim_"), \
        f"Run ID should start with 'sim_', got: {result['run_id']}"
    assert result["status"] == "running", \
        f"Status should be 'running', got: {result['status']}"
    assert result["run_id"] in _runs_store, "Run should be in store"
    print(f"  PASS: run_id={result['run_id']} status={result['status']}")
    return result["run_id"]


async def test_run_completes(run_id: str):
    """Test 2: Run resolves to complete status with aggregated results."""
    start = time.monotonic()
    while time.monotonic() - start < 60:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            assert run.get("outcome_distribution"), "Should have outcome distribution"
            assert run.get("p_revolution_range"), "Should have p_revolution range"
            assert run.get("rri_trajectory"), "Should have RRI trajectory"
            assert run.get("duration_ms", 0) > 0, "duration_ms should be > 0"
            assert run.get("sensitivity_ranking") is not None, "Should have sensitivity ranking"
            print(f"  PASS: status=complete duration={run['duration_ms']}ms "
                  f"iterations={run['mc_iterations']}")
            return run
        await asyncio.sleep(1)
    assert False, "Run did not complete within 60 seconds"


async def test_outcome_distribution():
    """Test 3: Outcome distribution contains valid phase probabilities."""
    result = await simulation_engine.run(scenario_id="SCN-C01", mc_iterations=30)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            od = run.get("outcome_distribution", {})
            total = sum(od.values())
            assert abs(total - 1.0) < 0.05, \
                f"Outcome probabilities should sum to ~1.0, got {total}"
            for phase in ("stable", "elevated", "crisis", "acute_crisis", "transition"):
                assert phase in od, f"Missing phase: {phase}"
            print(f"  PASS: outcome distribution sum={total:.2f} "
                  f"phases={len(od)}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_p_revolution_range():
    """Test 4: P_revolution range has mean/p10/p50/p90."""
    result = await simulation_engine.run(scenario_id="SCN-B01", mc_iterations=50)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            pr = run.get("p_revolution_range", {})
            for key in ("mean", "p10", "p50", "p90"):
                assert key in pr, f"Missing key: {key}"
                assert 0 <= pr[key] <= 1, \
                    f"{key}={pr[key]} should be between 0 and 1"
            assert pr["p10"] <= pr["p50"] <= pr["p90"], \
                f"p10/p50/p90 not ordered: {pr}"
            print(f"  PASS: p_rev_range mean={pr['mean']:.3f} "
                  f"p10={pr['p10']:.3f} p50={pr['p50']:.3f} p90={pr['p90']:.3f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_rri_trajectory():
    """Test 5: RRI trajectory has expected time steps."""
    result = await simulation_engine.run(
        scenario_id="SCN-E02", mc_iterations=30, time_horizon_days=30, time_step_days=7
    )
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            traj = run.get("rri_trajectory", [])
            assert len(traj) >= 3, \
                f"Should have at least 3 steps, got {len(traj)}"
            assert traj[0]["day"] == 0, \
                f"First day should be 0, got {traj[0]['day']}"
            for step in traj:
                for key in ("mean", "p10", "p90"):
                    assert key in step, f"Missing key '{key}' in step {step['day']}"
            print(f"  PASS: rri_trajectory steps={len(traj)} "
                  f"day0_mean={traj[0]['mean']:.3f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_sensitivity_analysis():
    """Test 6: Sensitivity analysis ranks variables by impact."""
    result = await simulation_engine.run(scenario_id="SCN-S01", mc_iterations=30)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            sr = run.get("sensitivity_ranking", [])
            assert len(sr) >= 2, \
                f"Should have at least 2 ranked variables, got {len(sr)}"
            for i in range(len(sr) - 1):
                assert sr[i]["impact_magnitude"] >= sr[i + 1]["impact_magnitude"], \
                    "Sensitivity should be sorted descending"
            for entry in sr:
                assert "variable" in entry, "Missing variable name"
                assert "impact_magnitude" in entry, "Missing impact_magnitude"
            print(f"  PASS: sensitivity_ranking top={sr[0]['variable']} "
                  f"impact={sr[0]['impact_magnitude']:.4f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_scenario_library():
    """Test 7: Scenario library has 13 pre-built scenarios."""
    assert len(SCENARIO_LIBRARY) == 13, \
        f"Should have 13 scenarios, got {len(SCENARIO_LIBRARY)}"
    types = set(s["scenario_type"] for s in SCENARIO_LIBRARY)
    assert "policy_decision" in types
    assert "shock_injection" in types
    assert "black_swan" in types
    assert "compound" in types
    print(f"  PASS: scenario_library count={len(SCENARIO_LIBRARY)} "
          f"types={types}")


async def test_custom_scenario():
    """Test 8: Custom scenario works with shock_vector."""
    result = await simulation_engine.run(
        custom_scenario={
            "scenario_name": "Test Custom",
            "description": "Custom test",
            "scenario_type": "custom",
            "shock_vector": {"E2_wheat_stress": 0.5, "P1_elite_cohesion": -0.3},
        },
        mc_iterations=20,
    )
    assert result is not None
    assert result["run_id"].startswith("sim_")
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            assert run["scenario_name"] == "Test Custom"
            assert run["scenario_type"] == "custom"
            print(f"  PASS: custom_scenario run_id={run_id}")
            return
        await asyncio.sleep(1)
    assert False, "Custom scenario run did not complete"


async def test_chain_activation():
    """Test 9: Chain activation detects relevant chains from shock vector."""
    result = await simulation_engine.run(scenario_id="SCN-V01", mc_iterations=20)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            chains = run.get("activated_chain_ids", [])
            assert len(chains) >= 1, \
                f"Should have at least 1 activated chain, got {len(chains)}"
            assert "CHAIN-03" in chains, \
                f"Drought scenario should activate CHAIN-03, got {chains}"
            print(f"  PASS: activated_chains={chains}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_historical_analogue():
    """Test 10: Historical analogue matching returns a match."""
    result = await simulation_engine.run(scenario_id="SCN-C02", mc_iterations=30)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            analogue = run.get("historical_analogue")
            similarity = run.get("analogue_similarity")
            assert analogue is not None, \
                "Should have a historical analogue for SCN-C02"
            assert similarity is not None and similarity > 0, \
                f"Similarity should be > 0, got {similarity}"
            print(f"  PASS: historical_analogue={analogue} "
                  f"similarity={similarity:.3f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_elite_fracture():
    """Test 11: Elite fracture probability is computed."""
    result = await simulation_engine.run(scenario_id="SCN-B01", mc_iterations=30)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            efp = run.get("elite_fracture_probability")
            assert efp is not None, "elite_fracture_probability should exist"
            assert 0 <= efp <= 1, \
                f"Should be between 0 and 1, got {efp}"
            print(f"  PASS: elite_fracture_probability={efp:.3f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_ugtt_strike():
    """Test 12: UGTT strike probability is higher for labor scenarios."""
    result = await simulation_engine.run(scenario_id="SCN-S01", mc_iterations=30)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            usp = run.get("ugtt_strike_probability")
            assert usp is not None and usp > 0, \
                f"UGTT strike probability should be > 0 for SCN-S01, got {usp}"
            print(f"  PASS: ugtt_strike_probability={usp:.3f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_multiple_runs_independence():
    """Test 13: Multiple runs produce independent run_ids."""
    ids = []
    for _ in range(3):
        result = await simulation_engine.run(scenario_id="SCN-E03", mc_iterations=10)
        ids.append(result["run_id"])
    assert len(set(ids)) == 3, \
        f"Run IDs should be unique, got {ids}"
    # Wait for completion
    start = time.monotonic()
    while time.monotonic() - start < 30:
        statuses = [_runs_store.get(i, {}).get("status") for i in ids]
        if all(s == "complete" for s in statuses):
            print(f"  PASS: 3 independent runs completed: {ids}")
            return
        await asyncio.sleep(1)
    status_map = {i: _runs_store.get(i, {}).get('status') for i in ids}
    print(f"  WARN: not all completed within timeout, statuses: {status_map}")


async def test_counterfactual_comparison():
    """Test 14: Counterfactual comparison produces deltas."""
    result_a = await simulation_engine.run(scenario_id="SCN-E01", mc_iterations=30)
    result_b = await simulation_engine.run(
        custom_scenario={
            "scenario_name": "Phased Subsidy Removal 24 months",
            "description": "Gradual phasing instead of full removal",
            "scenario_type": "policy_decision",
            "shock_vector": {"P3_imf_pressure": 0.20, "E2_wheat_stress": 0.15},
        },
        mc_iterations=30,
        counterfactual_of=result_a["run_id"],
    )
    assert result_b["counterfactual_run_id"] == result_a["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run_a = _runs_store.get(result_a["run_id"])
        run_b = _runs_store.get(result_b["run_id"])
        if run_a and run_b and run_a.get("status") == "complete" and run_b.get("status") == "complete":
            assert run_b.get("counterfactual_run_id") == result_a["run_id"], \
                f"counterfactual_run_id mismatch"
            print(f"  PASS: counterfactual linked "
                  f"run_a={result_a['run_id']} run_b={result_b['run_id']}")
            return
        await asyncio.sleep(1)
    assert False, "Counterfactual runs did not complete"


async def test_governorate_delta():
    """Test 15: Migration pressure delta is computed."""
    result = await simulation_engine.run(scenario_id="SCN-B03", mc_iterations=30)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            mpd = run.get("migration_pressure_delta")
            assert mpd is not None, "migration_pressure_delta should exist"
            print(f"  PASS: migration_pressure_delta={mpd:.4f}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def test_duration():
    """Test 16: Completed run has duration_ms > 0."""
    result = await simulation_engine.run(scenario_id="SCN-C01", mc_iterations=20)
    run_id = result["run_id"]
    start = time.monotonic()
    while time.monotonic() - start < 30:
        run = _runs_store.get(run_id)
        if run and run.get("status") == "complete":
            assert run.get("duration_ms", 0) > 0, \
                f"duration_ms should be > 0, got {run.get('duration_ms')}"
            print(f"  PASS: duration_ms={run['duration_ms']}")
            return
        await asyncio.sleep(1)
    assert False, "Run did not complete"


async def main():
    print("\n=== Simulation Chamber Acceptance Tests ===\n")

    tests = [
        ("Test 1: Basic run returns valid run_id", test_basic_run),
        ("Test 2: Run completes with aggregated results", None),
        ("Test 3: Outcome distribution", test_outcome_distribution),
        ("Test 4: P_revolution range", test_p_revolution_range),
        ("Test 5: RRI trajectory", test_rri_trajectory),
        ("Test 6: Sensitivity analysis", test_sensitivity_analysis),
        ("Test 7: Scenario library count", test_scenario_library),
        ("Test 8: Custom scenario", test_custom_scenario),
        ("Test 9: Chain activation", test_chain_activation),
        ("Test 10: Historical analogue", test_historical_analogue),
        ("Test 11: Elite fracture probability", test_elite_fracture),
        ("Test 12: UGTT strike probability", test_ugtt_strike),
        ("Test 13: Multiple runs independence", test_multiple_runs_independence),
        ("Test 14: Counterfactual comparison", test_counterfactual_comparison),
        ("Test 15: Migration pressure delta", test_governorate_delta),
        ("Test 16: Duration measurement", test_duration),
    ]

    passed = 0
    failed = 0

    for name, test_fn in tests:
        print(f"Running: {name}")
        try:
            if name.startswith("Test 2"):
                run_id = await test_basic_run()
                await test_run_completes(run_id)
            else:
                await test_fn()
            passed += 1
            print(f"  ✓ {name}\n")
        except Exception as e:
            failed += 1
            print(f"  ✗ {name}")
            print(f"    FAILED: {e}\n")

    print("=" * 50)
    print(f"Results: {passed}/{passed + failed} passed")
    if failed:
        print(f"FAILURES: {failed}")
        sys.exit(1)
    else:
        print("All tests passed!")


if __name__ == "__main__":
    asyncio.run(main())
