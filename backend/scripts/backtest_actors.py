"""
Actor Backtest Validation — 2011 Revolution Reconstruction.

Reconstructs the state snapshot for the week of January 14, 2011 (Ben Ali exit).
Runs all 11 actor profiles through state_update_rules and compares
top predicted actions to documented historical behavior.

Usage:
    PYTHONPATH=backend python3 backend/scripts/backtest_actors.py
"""

from __future__ import annotations

import sys
from datetime import datetime

sys.path.insert(0, ".")

from app.services.actor_engine import get_all_postures, backtest_actor
from app.actors.seed_profiles import PROFILES

# ── 2011 Revolution State Reconstruction ────────────────────────────
# Based on: Ben Ali exit week, January 14, 2011

REVOLUTION_SNAPSHOT = {
    "state_version_id": "historical_2011_revolution",
    "computed_at": "2011-01-14T12:00:00Z",
    "rri": 2.85,
    "p_revolution": 0.78,
    "velocity": 0.65,
    "acceleration": 0.72,
    "compound_stress": 0.82,
    "cascade_probability": 0.88,
    "salience": 0.91,
    "salience_effective": 0.85,
    "war_intensity": 0.35,
    "elite_cohesion": 0.28,
    "elite_defection_prob": 0.85,
    "info_amplification": 0.92,
    "mii": 0.78,
    "oci": 0.58,
    "cpi_index": 0.72,
    "structural_econ": 0.65,
}

# ── Expected Behaviors ──────────────────────────────────────────────
# Documented: what each actor actually did during the 2011 revolution

EXPECTED_BEHAVIORS = {
    "PRES": {
        "event": "2011_revolution",
        "expected_behavior": "repression_then_flight",
        "rationale": "Ben Ali ordered crackdown, then fled when military refused to fire",
    },
    "ARM": {
        "event": "2011_revolution",
        "expected_behavior": "neutrality_declaration",
        "rationale": "Military refused order to fire on protesters — turning point",
    },
    "INT": {
        "event": "2011_revolution",
        "expected_behavior": "escalating_crackdown",
        "rationale": "Interior Ministry led violent crackdown until capacity exceeded",
    },
    "UGTT": {
        "event": "2011_revolution",
        "expected_behavior": "coalition_with_opposition",
        "rationale": "UGTT local branches supported protests, national leadership later mediated",
    },
    "BCT": {
        "event": "2011_revolution",
        "expected_behavior": "imf_consultation",
        "rationale": "Central Bank signaled reserve stress and IMF engagement need",
    },
    "LPR": {
        "event": "2011_revolution",
        "expected_behavior": "street_mobilization",
        "rationale": "Opposition activated street protests coordinated with UGTT",
    },
    "EU": {
        "event": "2011_revolution",
        "expected_behavior": "diplomatic_statement",
        "rationale": "EU issued statements condemning violence, then supported transition",
    },
    "DZA": {
        "event": "2011_revolution",
        "expected_behavior": "quiet_diplomacy",
        "rationale": "Algeria initially supported Ben Ali, then recognized new government",
    },
    "UTICA": {
        "event": "2011_revolution",
        "expected_behavior": "hedging",
        "rationale": "Business elites hedged and switched sides at military neutrality signal",
    },
    "DONOR": {
        "event": "2011_revolution",
        "expected_behavior": "emergency_support",
        "rationale": "IMF/creditors signaled emergency support for transition",
    },
    "PPL": {
        "event": "2011_revolution",
        "expected_behavior": "street_protest",
        "rationale": "Mass protests across interior governorates, ignited by Bouazizi",
    },
}


def print_separator(char: str = "=", width: int = 72):
    print(char * width)


async def main():
    print_separator()
    print("  ACTOR BACKTEST VALIDATION — 2011 Revolution")
    print_separator()
    print(f"  Snapshot: RRI={REVOLUTION_SNAPSHOT['rri']}, "
          f"P_rev={REVOLUTION_SNAPSHOT['p_revolution']:.0%}, "
          f"Elite Cohesion={REVOLUTION_SNAPSHOT['elite_cohesion']:.0%}")
    print()

    # Run all actors through the engine
    postures = await get_all_postures(REVOLUTION_SNAPSHOT)

    print(f"{'Actor':12s} {'Posture':14s} {'Stress':7s} {'Top Action':25s} {'Expected':25s} {'Match':6s}")
    print(f"{'─' * 12} {'─' * 14} {'─' * 7} {'─' * 25} {'─' * 25} {'─' * 6}")

    results = []
    for p in postures:
        eid = p["entity_id"]
        expected = EXPECTED_BEHAVIORS.get(eid, {}).get("expected_behavior", "")
        probs = p.get("adjusted_probability_matrix", {})
        top_action = list(probs.keys())[0] if probs else ""

        # Compute match
        expected_keywords = expected.lower().replace("_", " ").split()
        top_lower = top_action.lower().replace("_", " ")
        keyword_match = sum(1 for kw in expected_keywords if kw in top_lower)
        match = round(min(1.0, keyword_match / max(len(expected_keywords), 1)), 3)

        results.append({
            "entity_id": eid,
            "posture": p["current_posture"],
            "stress": p["current_stress"],
            "top_action": top_action,
            "expected": expected,
            "match": match,
            "all_actions": list(probs.items())[:5],
        })

        print(f"{eid:12s} {p['current_posture']:14s} {p['current_stress']:.3f}  "
              f"{top_action:25s} {expected:25s} {match:.3f}")

    print()

    # Summary
    passed = [r for r in results if r["match"] >= 0.50]
    partial = [r for r in results if 0.25 <= r["match"] < 0.50]
    failed = [r for r in results if r["match"] < 0.25]

    print_separator("-")
    print("  RESULTS SUMMARY")
    print_separator("-")
    print(f"  PASS (match >= 0.50): {len(passed)}/11")
    for r in passed:
        print(f"    ✓ {r['entity_id']:8s} match={r['match']:.3f} — {r['top_action']} ≈ {r['expected']}")
    print()
    if partial:
        print(f"  PARTIAL (0.25-0.49): {len(partial)}/11")
        for r in partial:
            print(f"    ~ {r['entity_id']:8s} match={r['match']:.3f} — {r['top_action']} vs {r['expected']}")
        print()
    if failed:
        print(f"  FAIL (match < 0.25): {len(failed)}/11")
        for r in failed:
            print(f"    ✗ {r['entity_id']:8s} match={r['match']:.3f} — top={r['top_action']} expected={r['expected']}")
        print()

    # Detailed reasoning for each actor
    print_separator("-")
    print("  DETAILED ACTOR ANALYSIS")
    print_separator("-")
    for r in results:
        print(f"\n  {r['entity_id']} ({EXPECTED_BEHAVIORS.get(r['entity_id'], {}).get('rationale', '')})")
        print(f"    Posture: {r['posture']} | Stress: {r['stress']:.3f} | Match: {r['match']:.3f}")
        print(f"    Top 5 actions:")
        for action, prob in r["all_actions"]:
            marker = "✓" if action == r["expected"] else " "
            print(f"      {marker} {action:30s} {prob:.3f}")
        if r["match"] >= 0.50:
            print(f"    STATUS: ✓ VALIDATED (match ≥ 0.50)")
        elif r["match"] >= 0.25:
            print(f"    STATUS: ~ PARTIAL (adjust weights)")
        else:
            print(f"    STATUS: ✗ REVIEW NEEDED (match < 0.25)")

    # Recommended promotions
    print()
    print_separator()
    print("  PROMOTION RECOMMENDATIONS")
    print_separator()
    validated = [r for r in results if r["match"] >= 0.50]
    for r in validated:
        print(f"  → {r['entity_id']:8s} match={r['match']:.3f} — promote to status: active")

    if not validated:
        print("  No actors meet the 0.50 threshold. Adjust weights and re-run.")

    print()


if __name__ == "__main__":
    import asyncio
    sys.exit(asyncio.run(main()))
