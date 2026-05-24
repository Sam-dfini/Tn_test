"""
Historical Validation Script — Backtest causal chains against documented events.

Uses the 4 historical state vectors from rri_engine.py (tunisia_2010_q3,
tunisia_2021_q1, egypt_2011_q1, algeria_2019_hirak) to check which chains
would have triggered at each historical point.

Outputs a validation report with match scores and chain promotion
recommendations.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

# Add backend to path
sys.path.insert(0, ".")

from app.ontology.service import check_activation, get_all_chains, validate_chain
from app.ontology.seed_chains import CHAINS
from app.services.rri_engine import HISTORICAL_STATES, _load_variables

# ── Helpers ──────────────────────────────────────────────────────────


def _make_synthetic_snapshot(
    state_name: str,
    state_vector: Dict[str, float],
) -> Dict[str, Any]:
    """Build a fake snapshot dict for check_activation from a historic vector."""
    return {
        "state_version_id": f"historical_{state_name}",
        "computed_at": datetime.now().isoformat(),
        "rri": state_vector.get("rri", 2.31),
        "p_revolution": state_vector.get("p_rev", 0.5),
        "velocity": state_vector.get("velocity", 0.0),
        "acceleration": state_vector.get("acceleration", 0.0),
        "compound_stress": state_vector.get("compound_stress", 0.3),
        "cascade_probability": state_vector.get("cascade_probability", 0.3),
        "salience": state_vector.get("salience", 0.4),
        "salience_effective": state_vector.get("salience_effective", 0.4),
        "war_intensity": state_vector.get("w_t", 0.5),
        "elite_cohesion": state_vector.get("elite_cohesion_dynamics", 0.65),
        "elite_defection_prob": state_vector.get("elite_defection_prob", 0.3),
        "info_amplification": state_vector.get("info_amplification", 0.8),
        "mii": state_vector.get("mii", 0.3),
        "oci": state_vector.get("oci", 0.22),
        "cpi_index": state_vector.get("cpi_index", 0.5),
        "structural_econ": state_vector.get("structural_econ", 0.3),
        "category_scores": json.dumps({}),
    }


def _evaluate_chain_match(
    chain: Dict[str, Any],
    historical_state_name: str,
    state_vector: Dict[str, float],
    activation_result: Dict[str, Any],
) -> Dict[str, Any]:
    """Evaluate whether a chain's prediction matches historical events."""
    chain_id = chain.get("chain_id", "")
    validated_events = chain.get("validated_events", [])
    activation_var = chain.get("activation_variable", "")
    threshold = chain.get("activation_threshold", 0.5)

    current_val = state_vector.get(activation_var, 0.0)
    threshold_breached = current_val >= threshold

    # Find in activation result
    active_info = next(
        (c for c in activation_result.get("active_chains", [])
         if c["chain_id"] == chain_id),
        None,
    )
    latent_info = next(
        (c for c in activation_result.get("latent_chains", [])
         if c["chain_id"] == chain_id),
        None,
    )

    chain_result = active_info or latent_info or {}

    event_matches = []
    for event in validated_events:
        # Simple heuristic: if threshold breached and event matches era, score high
        era_match = str(event.get("year", "")) in historical_state_name
        match = 0.85 if (threshold_breached and era_match) else (
            0.15 if (not threshold_breached and era_match) else 0.5
        )
        event_matches.append({
            "year": event.get("year"),
            "event": event.get("event"),
            "expected_trigger": threshold_breached,
            "match_score": match,
        })

    return {
        "chain_id": chain_id,
        "chain_name": chain.get("chain_name", ""),
        "threshold_breached": threshold_breached,
        "current_value": current_val,
        "threshold_value": threshold,
        "trigger_ratio": chain_result.get("trigger_ratio", 0),
        "nodes_triggered": chain_result.get("nodes_triggered", []),
        "event_matches": event_matches,
        "avg_event_match": (
            sum(e["match_score"] for e in event_matches) / len(event_matches)
            if event_matches else 0
        ),
    }


# ── Main Validation ─────────────────────────────────────────────────


def run_validation() -> Dict[str, Any]:
    """Run full historical validation across all 4 historical states."""
    results: Dict[str, Any] = {}
    overall_scores: Dict[str, List[float]] = {}

    for state_name, state_vector in HISTORICAL_STATES.items():
        snapshot = _make_synthetic_snapshot(state_name, state_vector)
        activation = check_activation(snapshot)
        human_label = state_name.replace("_", " ").upper()

        chain_results = []
        for chain in CHAINS:
            result = _evaluate_chain_match(
                chain, state_name, state_vector, activation,
            )
            chain_results.append(result)
            overall_scores.setdefault(result["chain_id"], []).append(
                result["avg_event_match"]
            )

        results[state_name] = {
            "label": human_label,
            "active_chains": activation.get("active_chains", []),
            "latent_chains": activation.get("latent_chains", []),
            "chain_results": chain_results,
        }

    # Compute overall validation scores and recommendations
    recommendations = []
    for chain in CHAINS:
        chain_id = chain.get("chain_id", "")
        scores = overall_scores.get(chain_id, [0.0])
        avg = sum(scores) / len(scores)

        recommendation = "promote_to_active" if avg > 0.6 else (
            "partial_validation" if avg > 0.3 else "needs_analyst_review"
        )

        recommendations.append({
            "chain_id": chain_id,
            "chain_name": chain.get("chain_name", ""),
            "current_status": chain.get("status", "draft"),
            "avg_validation_score": round(avg, 3),
            "recommendation": recommendation,
            "suggested_validation_score": round(min(1.0, avg + 0.1), 3),
        })

    return {
        "validation_timestamp": datetime.now().isoformat(),
        "historical_states_validated": list(HISTORICAL_STATES.keys()),
        "states": results,
        "recommendations": sorted(
            recommendations,
            key=lambda r: r["avg_validation_score"],
            reverse=True,
        ),
    }


# ── Report Output ───────────────────────────────────────────────────


def print_report(report: Dict[str, Any]) -> None:
    print("=" * 72)
    print("   HISTORICAL VALIDATION REPORT — TunisiaIntel Ontology")
    print(f"   Generated: {report['validation_timestamp']}")
    print("=" * 72)

    for state_name, state_data in report["states"].items():
        print(f"\n{'─' * 72}")
        print(f"  STATE: {state_data['label']}")
        print(f"{'─' * 72}")

        active = state_data.get("active_chains", [])
        latent = state_data.get("latent_chains", [])

        print(f"  Active chains: {len(active)}")
        for c in active:
            icon = "🔴" if c.get("trigger_ratio", 0) > 0.5 else "🟡"
            print(
                f"    {icon} {c['chain_name']:40s}"
                f"  val={c['current_value']:.3f}  "
                f"thresh={c['threshold_value']:.3f}  "
                f"nodes={c.get('trigger_ratio', 0):.0%}"
            )

        if latent:
            print(f"  Latent chains: {len(latent)}")
            for c in latent[:5]:
                print(
                    f"    ⚪ {c['chain_name']:40s}"
                    f"  val={c['current_value']:.3f}"
                )

    print(f"\n{'=' * 72}")
    print("   VALIDATION RECOMMENDATIONS")
    print(f"{'=' * 72}")
    print(
        f"  {'Chain ID':25s} {'Score':6s} {'Recommendation':25s} {'Current':10s}"
    )
    print(f"  {'─' * 68}")
    for rec in report["recommendations"]:
        print(
            f"  {rec['chain_id']:25s}"
            f" {rec['avg_validation_score']:.3f} "
            f" {rec['recommendation']:25s}"
            f" {rec['current_status']:10s}"
        )

    print(f"\n{'=' * 72}")
    promote = [
        r for r in report["recommendations"]
        if r["recommendation"] == "promote_to_active"
    ]
    if promote:
        print(f"\n  CHAINS RECOMMENDED FOR PROMOTION TO ACTIVE:")
        for r in promote:
            print(
                f"    → {r['chain_name']:40s}"
                f"  score={r['avg_validation_score']:.3f}"
            )

    partial = [
        r for r in report["recommendations"]
        if r["recommendation"] == "partial_validation"
    ]
    if partial:
        print(f"\n  CHAINS NEEDING PARTIAL VALIDATION:")
        for r in partial:
            print(
                f"    → {r['chain_name']:40s}"
                f"  score={r['avg_validation_score']:.3f}"
            )

    review = [
        r for r in report["recommendations"]
        if r["recommendation"] == "needs_analyst_review"
    ]
    if review:
        print(f"\n  CHAINS NEEDING ANALYST REVIEW:")
        for r in review:
            print(
                f"    → {r['chain_name']:40s}"
                f"  score={r['avg_validation_score']:.3f}"
            )

    print()


if __name__ == "__main__":
    report = run_validation()
    print_report(report)

    # Optionally auto-promote high-scoring chains
    if "--promote" in sys.argv:
        for rec in report["recommendations"]:
            if rec["recommendation"] == "promote_to_active":
                print(f"Promoting {rec['chain_id']} to active...")
                result = validate_chain(rec["chain_id"], "Auto-promoted by historical validation")
                print(f"  → {result.get('status', 'error')}")
