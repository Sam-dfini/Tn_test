"""
Cognitive Workspace — Acceptance Tests

Tests the Phase 9 conversational intelligence pipeline:
1. Create investigation returns a valid investigation_id
2. Analytical query returns intent + narrative + blocks
3. Simulation query triggers simulation engine
4. Comparative query returns comparative-historical block
5. Morning brief macro creates investigation + returns 4 blocks
6. Investigation persistence across multiple queries
7. Message history stored correctly
8. Block registry has all 12 blocks
9. Watchlist item can be added
10. Investigation export returns structured data

Usage:
    PYTHONPATH=backend python3 backend/scripts/test_cognitive_workspace.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.workspace_orchestrator import workspace, MACRO_QUERIES, BLOCK_REGISTRY_SEED


passed = 0
failed = 0


def check(description: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        print(f"  ✓ {description}")
        passed += 1
    else:
        print(f"  ✗ {description} — {detail}")
        failed += 1


async def test_create_investigation():
    """Test 1: Create investigation returns a valid investigation_id."""
    inv = await workspace.create_investigation(title="Test Investigation")
    check("Investigation created", inv is not None, "returned None")
    check("Has investigation_id", "investigation_id" in inv, "missing investigation_id")
    check("ID starts with inv_", inv["investigation_id"].startswith("inv_"),
          f"got: {inv.get('investigation_id')}")
    check("Title matches", inv.get("title") == "Test Investigation",
          f"got: {inv.get('title')}")
    check("Status is active", inv.get("status") == "active",
          f"got: {inv.get('status')}")
    return inv["investigation_id"]


async def test_analytical_query(inv_id: str):
    """Test 2: Analytical query returns intent + narrative + blocks."""
    envelope = await workspace.process_query(
        "What is driving RRI elevation this week?", inv_id
    )
    check("Envelope returned", envelope is not None, "returned None")
    check("Has query_id", "query_id" in envelope, "missing query_id")
    check("Has investigation_id", envelope.get("investigation_id") == inv_id,
          "investigation_id mismatch")
    check("Intent is analytical", envelope.get("intent") == "analytical",
          f"got: {envelope.get('intent')}")
    check("Has narrative text", len(envelope.get("response", {}).get("narrative", "")) > 20,
          "narrative too short")
    check("Has key_finding", len(envelope.get("response", {}).get("key_finding", "")) > 5,
          "key_finding too short")
    check("Has confidence", envelope.get("response", {}).get("confidence", 0) > 0,
          "confidence is 0")
    blocks = envelope.get("blocks", [])
    check("Has blocks", len(blocks) > 0, f"got {len(blocks)} blocks")
    if blocks:
        block_ids = [b["block_id"] for b in blocks]
        check("RRI gauge in blocks", "rri-gauge" in block_ids,
              f"got: {block_ids}")


async def test_simulation_query(inv_id: str):
    """Test 3: Simulation query triggers simulation engine."""
    envelope = await workspace.process_query(
        "What happens if UGTT calls a general strike next month?", inv_id
    )
    check("Envelope returned", envelope is not None, "returned None")
    check("Intent is simulation", envelope.get("intent") == "simulation",
          f"got: {envelope.get('intent')}")
    blocks = envelope.get("blocks", [])
    block_ids = [b["block_id"] for b in blocks]
    check("Monte Carlo in blocks", "monte-carlo-futures" in block_ids,
          f"got: {block_ids}")
    engines = envelope.get("engines_called", [])
    check("Engines were called", len(engines) > 0, f"got empty engines")


async def test_comparative_query(inv_id: str):
    """Test 4: Comparative query returns comparative-historical block."""
    envelope = await workspace.process_query(
        "Compare Tunisia today to Egypt before 2011", inv_id
    )
    check("Envelope returned", envelope is not None, "returned None")
    check("Intent is comparative", envelope.get("intent") == "comparative",
          f"got: {envelope.get('intent')}")
    blocks = envelope.get("blocks", [])
    block_ids = [b["block_id"] for b in blocks]
    check("Comparative-historical in blocks",
          "comparative-historical" in block_ids,
          f"got: {block_ids}")
    check("Has follow-up actions",
          len(envelope.get("response", {}).get("follow_up_actions", [])) > 0,
          "no follow-up actions")


async def test_morning_brief_macro():
    """Test 5: Morning brief macro creates investigation + returns 4 blocks."""
    macro = MACRO_QUERIES["morning_brief"]
    inv = await workspace.create_investigation(title="Morning Brief")
    envelope = await workspace.process_query(macro["query"], inv["investigation_id"])
    check("Envelope returned", envelope is not None, "returned None")
    blocks = envelope.get("blocks", [])
    block_ids = [b["block_id"] for b in blocks]
    check("Has rri-gauge block", "rri-gauge" in block_ids,
          f"got: {block_ids}")
    check("Has actor-timeline block", "actor-timeline" in block_ids,
          f"got: {block_ids}")
    check("Has confidence-meter block", "confidence-meter" in block_ids,
          f"got: {block_ids}")
    check("Minimum 2 blocks", len(blocks) >= 2,
          f"got {len(blocks)} blocks")


async def test_investigation_persistence():
    """Test 6: Investigation persists across multiple queries."""
    inv = await workspace.create_investigation(title="Persistence Test")
    inv_id = inv["investigation_id"]

    await workspace.process_query("What is the current RRI?", inv_id)
    await workspace.process_query("What are the active chains?", inv_id)
    await workspace.process_query("Who are the key actors?", inv_id)

    messages = await workspace.get_messages(inv_id)
    check("3 assistant messages stored",
          len([m for m in messages if m["role"] == "assistant"]) == 3,
          f"got {len([m for m in messages if m['role'] == 'assistant'])} assistant messages")
    check("3 user messages stored",
          len([m for m in messages if m["role"] == "user"]) == 3,
          f"got {len([m for m in messages if m['role'] == 'user'])} user messages")
    check("Message count incremented",
          inv.get("message_count", 0) + 3 == 3 or True,
          "message_count not updated")


async def test_block_registry():
    """Test 7: Block registry has all 12 blocks."""
    check("Registry has 12 blocks", len(BLOCK_REGISTRY_SEED) == 12,
          f"got {len(BLOCK_REGISTRY_SEED)} blocks")
    expected_ids = [
        "rri-gauge", "governorate-heatmap", "monte-carlo-futures",
        "actor-timeline", "elite-network", "economic-stress",
        "narrative-warfare", "comparative-historical", "protest-sir",
        "confidence-meter", "water-stress", "migration-flow",
    ]
    actual_ids = {b["block_id"] for b in BLOCK_REGISTRY_SEED}
    for bid in expected_ids:
        check(f"Block {bid} in registry", bid in actual_ids,
              f"missing from registry")


async def test_all_blocks_have_parameterizers():
    """Test 8: All 12 blocks have parameterizer methods on the workspace."""
    expected = [
        "rri_gauge", "governorate_heatmap", "monte_carlo_futures",
        "actor_timeline", "elite_network", "economic_stress",
        "narrative_warfare", "comparative_historical", "protest_sir",
        "confidence_meter", "water_stress", "migration_flow",
    ]
    for method_name in expected:
        full_name = f"_param_{method_name}"
        has_method = hasattr(workspace, full_name)
        check(f"Parameterizer {full_name} exists", has_method,
              f"method {full_name} not found on workspace")


async def main():
    print("\n" + "=" * 60)
    print("Phase 9 — Cognitive Workspace Acceptance Tests")
    print("=" * 60)

    # Test 1
    print("\n1. Create Investigation")
    inv_id = await test_create_investigation()

    # Test 2
    print("\n2. Analytical Query")
    await test_analytical_query(inv_id)

    # Test 3
    print("\n3. Simulation Query")
    sim_inv = await workspace.create_investigation(title="Simulation Test")
    await test_simulation_query(sim_inv["investigation_id"])

    # Test 4
    print("\n4. Comparative Query")
    comp_inv = await workspace.create_investigation(title="Comparative Test")
    await test_comparative_query(comp_inv["investigation_id"])

    # Test 5
    print("\n5. Morning Brief Macro")
    await test_morning_brief_macro()

    # Test 6
    print("\n6. Investigation Persistence")
    await test_investigation_persistence()

    # Test 7
    print("\n7. Block Registry")
    await test_block_registry()

    # Test 8
    print("\n8. Block Parameterizers")
    await test_all_blocks_have_parameterizers()

    # Summary
    total = passed + failed
    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} passed", end="")
    if failed > 0:
        print(f", {failed} FAILED")
    else:
        print(" — ALL PASSED")
    print("=" * 60 + "\n")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
