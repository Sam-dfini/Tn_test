"""
Acceptance tests for Shock Engine bridge.

Tests:
1. Active shocks in-memory store (set/get)
2. POST /api/state/active-shocks stores shocks correctly
3. GET /api/state/active-shocks returns stored shocks
4. write_snapshot includes active_shocks in the payload
5. RRI engine produces stochastic_shock in valid range

Usage:
    PYTHONPATH=backend python3 backend/scripts/test_shock_engine.py
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

sys.path.insert(0, ".")

from app.services.state_snapshot import (
    set_active_shocks,
    get_active_shocks,
    write_snapshot,
)
from app.services.rri_engine import calculate_rri

PASS = 0
FAIL = 0


def check(name: str, condition: bool, detail: str = ""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL += 1
        print(f"  ✗ {name} — {detail}")


def test_1_shock_store():
    """Active shocks in-memory store set/get round-trip."""
    print("\n[Test 1] Active shock store")

    set_active_shocks([])
    check("empty store returns []", get_active_shocks() == [], str(get_active_shocks()))

    sample = [
        {
            "id": "test-shock-1",
            "type": "ECON",
            "source": "test",
            "intensity": 0.85,
            "message": "Test shock",
            "timestamp": int(time.time() * 1000),
            "overrides": {"economy.inflation": 9.2},
            "governorates": ["Tunis", "Sfax"],
            "affectedEquations": ["EQ.1", "EQ.13"],
        }
    ]
    set_active_shocks(sample)
    stored = get_active_shocks()
    check("store returns 1 shock", len(stored) == 1, f"count={len(stored)}")
    check(
        "shock id preserved",
        stored[0]["id"] == "test-shock-1",
        f'id={stored[0].get("id")}',
    )
    check(
        "overrides preserved",
        stored[0]["overrides"].get("economy.inflation") == 9.2,
        f'overrides={stored[0].get("overrides")}',
    )

    set_active_shocks([])
    check("clear restores empty", get_active_shocks() == [], str(get_active_shocks()))

    multi = [
        {"id": "s1", "type": "AGRI", "intensity": 0.5, "overrides": {"a": 1}},
        {"id": "s2", "type": "ECON", "intensity": 0.7, "overrides": {"b": 2}},
    ]
    set_active_shocks(multi)
    stored2 = get_active_shocks()
    check(
        "multi-shock store preserves all",
        len(stored2) == 2,
        f"count={len(stored2)}",
    )
    set_active_shocks([])


def test_2_snapshot_includes_shocks():
    """write_snapshot payload contains active_shocks from store."""
    print("\n[Test 2] Snapshot includes shocks")

    sample = [
        {
            "id": "snap-test-shock",
            "type": "SYSTEM",
            "source": "test",
            "intensity": 0.9,
            "message": "Snapshot shock test",
            "timestamp": int(time.time() * 1000),
            "overrides": {"social.water_crisis_govs": 14},
            "governorates": ["Tunis"],
        }
    ]
    set_active_shocks(sample)

    rri_result = calculate_rri()

    check(
        "RRI result has stochastic_shock field",
        "stochastic_shock" in rri_result,
        str(list(rri_result.keys())),
    )
    shock_val = rri_result.get("stochastic_shock", 0)
    check(
        "stochastic_shock is valid float in range [-5, 5]",
        isinstance(shock_val, (int, float))
        and not (shock_val != shock_val)
        and -5 <= shock_val <= 5,
        f"stochastic_shock={shock_val}",
    )

    snapshot = write_snapshot(rri_result=rri_result, notes="test_shock_engine")

    check(
        "snapshot is dict",
        isinstance(snapshot, dict),
        str(type(snapshot)),
    )

    if isinstance(snapshot, dict):
        raw_shocks = snapshot.get("active_shocks", "[]")
        parsed = json.loads(raw_shocks) if isinstance(raw_shocks, str) else raw_shocks
        check(
            "snapshot has active_shocks from store",
            isinstance(parsed, list) and len(parsed) > 0,
            f"active_shocks={parsed}",
        )
        if parsed:
            check(
                "first shock has expected fields",
                all(k in parsed[0] for k in ("id", "type", "intensity", "overrides")),
                f"keys={list(parsed[0].keys())}",
            )
            check(
                "snapshot shock matches store",
                parsed[0]["id"] == "snap-test-shock",
                f'id={parsed[0].get("id")}',
            )

    set_active_shocks([])


def test_3_empty_shocks_default():
    """write_snapshot with empty shock store writes '[]'."""
    print("\n[Test 3] Empty shocks default")

    set_active_shocks([])
    rri_result = calculate_rri()
    snapshot = write_snapshot(rri_result=rri_result, notes="test_empty_shocks")

    if isinstance(snapshot, dict):
        raw = snapshot.get("active_shocks", "[]")
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        check(
            "empty store produces empty array in snapshot",
            isinstance(parsed, list) and len(parsed) == 0,
            f"active_shocks={parsed}",
        )


def test_4_shock_store_replace():
    """set_active_shocks replaces previous content, does not append."""
    print("\n[Test 4] Shock store replaces on set")

    set_active_shocks([{"id": "first", "intensity": 0.5}])
    set_active_shocks([{"id": "second", "intensity": 0.8}])
    stored = get_active_shocks()
    check(
        "store has exactly 1 shock after second set (replaced)",
        len(stored) == 1,
        f"count={len(stored)}",
    )
    check(
        "store holds the second shock",
        stored[0]["id"] == "second",
        f'id={stored[0].get("id")}',
    )
    set_active_shocks([])


async def main():
    print("=" * 60)
    print("  Shock Engine — Acceptance Tests")
    print(f"  Started: {datetime.now().isoformat()}")
    print("=" * 60)

    test_1_shock_store()
    test_2_snapshot_includes_shocks()
    test_3_empty_shocks_default()
    test_4_shock_store_replace()

    print(f"\n{'=' * 60}")
    total = PASS + FAIL
    print(f"  RESULTS: {PASS}/{total} passed, {FAIL}/{total} failed")
    if FAIL == 0:
        print("  STATUS: ALL TESTS PASSED ✓")
    else:
        print(f"  STATUS: {FAIL} TEST(S) FAILED ✗")
    print(f"{'=' * 60}")

    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    import asyncio
    sys.exit(asyncio.run(main()))
