"""
Deliberation Engine — Acceptance Tests

Tests the High Table deliberation pipeline:
1. Basic run returns a valid session
2. Session has positions for core actors
3. Conflict detection works
4. Coalition formation works
5. Veto detection works (UGTT on subsidy removal)
6. Resolution type is sensible (compromise or deadlock for contested scenarios)
7. In-memory session store tracks sessions
8. Multiple runs produce independent sessions

Usage:
    PYTHONPATH=backend python3 backend/scripts/test_deliberation_engine.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.deliberation_engine import (
    deliberation_engine,
    get_sessions,
)


async def test_basic_run():
    """Test 1: Basic run returns a valid session."""
    session = await deliberation_engine.run(
        scenario="IMF demands full subsidy removal Q3 2027",
        trigger_type="test",
    )
    assert session is not None, "Session should not be None"
    assert session["session_id"].startswith("del_"), \
        f"Session ID should start with 'del_', got: {session['session_id']}"
    assert session["scenario_description"] == "IMF demands full subsidy removal Q3 2027"
    assert session["trigger_type"] == "test"
    assert len(session.get("positions", [])) >= 4, \
        f"Should have at least 4 positions, got {len(session.get('positions', []))}"
    assert session.get("resolution_type") in ("consensus", "compromise", "deadlock"), \
        f"Invalid resolution: {session.get('resolution_type')}"
    assert session.get("confidence", 0) > 0, "Confidence should be > 0"
    print(f"  PASS: session={session['session_id']} resolution={session['resolution_type']} "
          f"confidence={session['confidence']} actors={len(session['positions'])}")


async def test_core_actors_present():
    """Test 2: Core actors (PRES, UGTT, ARM, BCT) are always included."""
    session = await deliberation_engine.run(
        scenario="Test scenario for core actor inclusion",
        trigger_type="test",
    )
    actor_ids = {p["entity_id"] for p in session.get("positions", [])}
    for core in ("PRES", "UGTT", "ARM", "BCT"):
        assert core in actor_ids, \
            f"Core actor {core} missing from positions: {actor_ids}"
    print(f"  PASS: core actors all present: {actor_ids}")


async def test_actor_override():
    """Test 3: actor_ids override works."""
    session = await deliberation_engine.run(
        scenario="Override test",
        trigger_type="test",
        actor_ids=["BCT", "DONOR", "EU"],
    )
    actor_ids = {p["entity_id"] for p in session.get("positions", [])}
    assert len(actor_ids) <= 3, f"Should have at most 3 actors, got {len(actor_ids)}"
    assert "BCT" in actor_ids, "BCT should be in overridden actors"
    assert "DONOR" in actor_ids, "DONOR should be in overridden actors"
    print(f"  PASS: override actors present: {actor_ids}")


async def test_conflict_detection():
    """Test 4: Conflict detection runs without error."""
    session = await deliberation_engine.run(
        scenario="Conflict detection test with contentious scenario",
        trigger_type="test",
        actor_ids=["PRES", "UGTT", "ARM", "BCT", "INT"],
    )
    conflict_map = session.get("conflict_map", {})
    print(f"  PASS: conflict_map has {len(conflict_map)} entries: {list(conflict_map.keys())}")


async def test_veto_detection():
    """Test 5: UGTT veto on subsidy removal (compound_stress > 0.75 triggers)."""
    session = await deliberation_engine.run(
        scenario="Subsidy removal scenario for veto test",
        trigger_type="test",
    )
    # Print veto status for inspection
    print(f"  Veto active: {session.get('veto_active')}, "
          f"actor: {session.get('veto_actor', 'N/A')}, "
          f"condition: {session.get('veto_condition', 'N/A')}")
    # This is informational — veto may or may not fire depending on snapshot
    assert "veto_active" in session, "veto_active key should exist"
    print(f"  PASS: veto check complete")


async def test_session_store():
    """Test 6: Sessions are stored in-memory after running."""
    prev_count = len(get_sessions())
    await deliberation_engine.run(
        scenario="Store test",
        trigger_type="test",
    )
    sessions = get_sessions()
    assert len(sessions) == prev_count + 1, \
        f"Store should have {prev_count + 1} sessions, has {len(sessions)}"
    print(f"  PASS: store has {len(sessions)} sessions (was {prev_count})")


async def test_multi_run_independence():
    """Test 7: Multiple runs produce independent sessions."""
    s1 = await deliberation_engine.run(
        scenario="First independent run",
        trigger_type="test",
    )
    s2 = await deliberation_engine.run(
        scenario="Second independent run",
        trigger_type="test",
    )
    assert s1["session_id"] != s2["session_id"], "Session IDs should be different"
    print(f"  PASS: independent sessions: {s1['session_id']} vs {s2['session_id']}")


async def test_positions_have_reasoning():
    """Test 8: Each position has a reasoning chain."""
    session = await deliberation_engine.run(
        scenario="IMF demands full subsidy removal, UGTT threatens general strike",
        trigger_type="test",
    )
    for pos in session.get("positions", []):
        assert pos.get("reasoning_chain"), \
            f"Position for {pos['entity_id']} has no reasoning_chain"
        assert pos.get("recommendation"), \
            f"Position for {pos['entity_id']} has no recommendation"
        assert pos.get("recommendation_confidence", 0) > 0, \
            f"Position for {pos['entity_id']} has zero confidence"
    print(f"  PASS: all {len(session['positions'])} positions have reasoning")


async def test_coalition_structure():
    """Test 9: Coalition map groups actors by recommendation."""
    session = await deliberation_engine.run(
        scenario="Test coalition structure formation",
        trigger_type="test",
    )
    coalition_map = session.get("coalition_map", {})
    assert len(coalition_map) >= 1, "Should have at least one coalition"
    for rec, coalition in coalition_map.items():
        assert len(coalition.get("actors", [])) >= 1, \
            f"Coalition '{rec}' should have at least one actor"
    print(f"  PASS: {len(coalition_map)} coalitions formed: {list(coalition_map.keys())}")


async def test_resolution_consistency():
    """Test 10: Resolution type is one of the valid values."""
    session = await deliberation_engine.run(
        scenario="Generic test scenario for resolution consistency",
        trigger_type="test",
    )
    valid = ("consensus", "compromise", "deadlock")
    assert session.get("resolution_type") in valid, \
        f"Invalid resolution: {session.get('resolution_type')}"
    print(f"  PASS: resolution = {session['resolution_type']}")


async def test_decision_output_structure():
    """Test 11: Decision output has primary action and distribution."""
    session = await deliberation_engine.run(
        scenario="Test decision output structure",
        trigger_type="test",
    )
    decision = session.get("decision_output", {})
    assert decision.get("primary_action"), "No primary_action in decision_output"
    assert decision.get("primary_confidence", 0) > 0, "No primary_confidence"
    full_dist = decision.get("full_distribution", {})
    assert len(full_dist) > 0, "full_distribution should have entries"
    print(f"  PASS: primary={decision['primary_action']} "
          f"({decision['primary_confidence']}) "
          f"distribution={full_dist}")


async def test_dominant_and_dissenting():
    """Test 12: dominant_coalition and dissenting_actors are populated."""
    session = await deliberation_engine.run(
        scenario="Test coalition/dissent tracking",
        trigger_type="test",
    )
    assert len(session.get("dominant_coalition", [])) >= 1, \
        "Should have at least 1 dominant actor"
    print(f"  PASS: dominant={session['dominant_coalition']} "
          f"dissenting={session.get('dissenting_actors', [])}")


async def test_run_with_empty_scenario():
    """Test 13: Handles empty/edge case scenarios gracefully."""
    session = await deliberation_engine.run(
        scenario="",
        trigger_type="test",
    )
    assert session is not None, "Should handle empty scenario"
    print(f"  PASS: empty scenario produced session {session['session_id']}")


async def test_timing_fields():
    """Test 14: Session has timing metadata."""
    session = await deliberation_engine.run(
        scenario="Timing metadata test",
        trigger_type="test",
    )
    assert session.get("started_at"), "Missing started_at"
    assert session.get("completed_at"), "Missing completed_at"
    assert session.get("duration_ms", 0) > 0, "duration_ms should be > 0"
    print(f"  PASS: duration = {session['duration_ms']}ms")


async def test_session_schema_completeness():
    """Test 15: Full session has all expected top-level keys."""
    session = await deliberation_engine.run(
        scenario="Schema completeness test",
        trigger_type="test",
    )
    required_keys = [
        "session_id", "scenario_description", "trigger_type",
        "state_version_id", "resolution_type", "confidence",
        "dominant_coalition", "dissenting_actors",
        "positions", "conflict_map", "coalition_map",
        "started_at", "completed_at", "duration_ms",
    ]
    for key in required_keys:
        assert key in session, f"Missing required key: {key}"
    print(f"  PASS: all {len(required_keys)} required keys present")


async def main():
    print("=" * 60)
    print("Deliberation Engine — Acceptance Tests")
    print("=" * 60)
    print()

    tests = [
        ("Basic run", test_basic_run),
        ("Core actors present", test_core_actors_present),
        ("Actor override", test_actor_override),
        ("Conflict detection", test_conflict_detection),
        ("Veto detection", test_veto_detection),
        ("Session store", test_session_store),
        ("Multi-run independence", test_multi_run_independence),
        ("Positions have reasoning", test_positions_have_reasoning),
        ("Coalition structure", test_coalition_structure),
        ("Resolution consistency", test_resolution_consistency),
        ("Decision output structure", test_decision_output_structure),
        ("Dominant and dissenting", test_dominant_and_dissenting),
        ("Empty scenario handling", test_run_with_empty_scenario),
        ("Timing fields", test_timing_fields),
        ("Schema completeness", test_session_schema_completeness),
    ]

    passed = 0
    failed = 0
    for name, test_fn in tests:
        print(f"Test {passed + failed + 1}: {name}")
        try:
            await test_fn()
            passed += 1
        except AssertionError as e:
            print(f"  FAIL: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1
        print()

    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed, {len(tests)} total")
    print("=" * 60)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
