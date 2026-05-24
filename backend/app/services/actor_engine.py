"""
Actor Engine — Compute posture and adjusted action probabilities
for each actor profile from a state snapshot.

Called after every snapshot write. Results are broadcast via WebSocket
and stored in snapshot.actor_postures.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..core.database import db
from ..actors.seed_profiles import PROFILES

# ── Doctrine Workspace Bindings ─────────────────────────────────────
# Each actor maps to one or more doctrine library workspaces.
# Used to enrich posture computation with historical/theoretical context.

ACTOR_DOCTRINE_WORKSPACES: Dict[str, List[str]] = {
    "PRES": ["tunisia-history", "regime-survival", "strategic-studies"],
    "UGTT": ["tunisia-history", "social-movements", "economic-statecraft"],
    "ARM": ["security-state", "strategic-studies", "tunisia-history"],
    "INT": ["security-state", "tunisia-history"],
    "BCT": ["economic-statecraft", "energy-water"],
    "LPR": ["tunisia-history", "social-movements"],
    "EU": ["strategic-studies", "economic-statecraft"],
    "DZA": ["strategic-studies", "regional-context"],
    "UTICA": ["economic-statecraft", "tunisia-history"],
    "DONOR": ["economic-statecraft", "strategic-studies"],
    "PPL": ["tunisia-history", "social-movements"],
}

async def enrich_with_doctrine(
    entity_id: str,
    query: str,
    limit: int = 3,
) -> List[Dict[str, Any]]:
    """Fetch relevant doctrine context for an actor.

    Used by the actor engine to incorporate historical pattern
    matching into posture computation.

    Returns empty list if AnythingLLM is unreachable.
    """
    from .doctrine_client import search_doctrine

    workspaces = ACTOR_DOCTRINE_WORKSPACES.get(entity_id, [])
    if not workspaces:
        return []

    chunks: List[Dict[str, Any]] = []
    max_per_ws = max(1, limit // len(workspaces)) + 1

    for ws in workspaces:
        ws_chunks = await search_doctrine(query, workspace=ws, limit=max_per_ws)
        chunks.extend(ws_chunks)

    chunks.sort(key=lambda c: c.get("rerank_score", 0), reverse=True)
    return chunks[:limit]


# ── Snapshot Signal Extraction ──────────────────────────────────────

SIGNAL_TO_SNAPSHOT_FIELD: Dict[str, str] = {
    "unrest": "cascade_probability",
    "p_revolution": "p_revolution",
    "elite_cohesion": "elite_cohesion",
    "military_posture": "elite_cohesion",
    "imf_pressure": "compound_stress",
    "imf_conditionality": "compound_stress",
    "foreign_pressure": "war_intensity",
    "narrative_convergence": "salience",
    "narrative_frame": "salience",
    "ugtt_strike_index": "compound_stress",
    "repression_index": "compound_stress",
    "public_anger": "salience",
    "inflation_rate": "structural_econ",
    "real_wage_index": "structural_econ",
    "unemployment_rate": "structural_econ",
    "fx_reserves_days": "rri",
    "parallel_fx_premium": "structural_econ",
    "subsidy_fiscal_cost": "structural_econ",
    "subsidy_removal_signal": "structural_econ",
    "policy_uncertainty": "structural_econ",
    "capital_control_risk": "structural_econ",
    "protest_intensity": "cascade_probability",
    "regional_spread": "cascade_probability",
    "foreign_scrutiny": "salience",
    "budget_constraints": "structural_econ",
    "presidential_directive": "mii",
    "civilian_casualty_risk": "elite_cohesion",
    "institutional_legitimacy": "elite_cohesion",
    "migration_pressure": "war_intensity",
    "regime_stability": "elite_cohesion",
    "human_rights_violations": "salience",
    "chinese_influence": "war_intensity",
    "islamist_influence": "salience",
    "french_influence": "war_intensity",
    "energy_market": "structural_econ",
    "exchange_rate": "structural_econ",
    "bread_prices": "compound_stress",
    "fuel_prices": "compound_stress",
    "remittance_flow": "structural_econ",
    "reform_implementation": "structural_econ",
    "fiscal_deficit": "structural_econ",
    "political_stability": "elite_cohesion",
    "ugtt_posture": "compound_stress",
    "foreign_support": "war_intensity",
}


def _map_signal(signal: str) -> str:
    return SIGNAL_TO_SNAPSHOT_FIELD.get(signal, "compound_stress")


def _extract_signal_value(snapshot: Dict[str, Any], signal: str) -> float:
    field = _map_signal(signal)
    val = snapshot.get(field, 0.0)
    if isinstance(val, (int, float)):
        return float(val)
    return 0.0


def _compare(
    current_value: float, operator: str, threshold: float
) -> bool:
    if operator == ">":
        return current_value > threshold
    elif operator == "<":
        return current_value < threshold
    elif operator == ">=":
        return current_value >= threshold
    elif operator == "<=":
        return current_value <= threshold
    elif operator == "==":
        return abs(current_value - threshold) < 0.01
    return False


def _get_posture_label(
    adjusted_probs: Dict[str, float],
) -> str:
    """Classify current actor posture based on highest-probability actions."""
    # Sort actions by probability descending
    sorted_actions = sorted(adjusted_probs.items(), key=lambda x: x[1], reverse=True)
    if not sorted_actions:
        return "passive"

    top_action = sorted_actions[0][0]
    top_prob = sorted_actions[0][1]

    aggressive_actions = {
        "repression", "crackdown", "mass_arrests", "targeted_arrests",
        "intervention", "arrest_opposition", "capital_flight",
        "street_mobilization", "general_strike", "sector_strike",
        "disbursement_suspension", "program_suspension", "sanctions",
    }
    defensive_actions = {
        "neutrality", "neutrality_declaration", "reduced_visibility",
        "border_tightening", "capital_controls",
    }
    negotiating_actions = {
        "negotiation", "concessions", "speech", "public_statement",
        "diplomatic_statement", "foreign_outreach", "quiet_diplomacy",
        "lobbying", "imf_consultation", "emergency_support",
    }
    collapsing_actions = {
        "immediate_concession_or_flight", "go_underground_or_exile",
        "capital_flight", "emigration",
    }

    if top_action in aggressive_actions and top_prob > 0.50:
        return "aggressive"
    if top_action in collapsing_actions and top_prob > 0.30:
        return "collapsing"
    if top_action in defensive_actions and top_prob > 0.40:
        return "defensive"
    if top_action in negotiating_actions and top_prob > 0.40:
        return "negotiating"
    if top_prob < 0.20:
        return "passive"
    return "defensive"


# ── Core Functions ──────────────────────────────────────────────────


async def get_actor_posture(
    entity_id: str,
    snapshot: Dict[str, Any],
) -> Dict[str, Any]:
    """Compute current posture and adjusted output probabilities for one actor.

    1. Load profile from Supabase (fallback to seed data)
    2. Extract relevant signals from snapshot
    3. Apply state_update_rules sequentially
    4. Return adjusted probability matrix + posture label
    """
    # Load profile
    profile = None
    try:
        res = db.table("actor_profiles").select("*").eq("entity_id", entity_id).execute()
        if res.data:
            profile = res.data[0]
    except Exception:
        pass

    if not profile:
        profile = next((p for p in PROFILES if p["entity_id"] == entity_id), None)

    if not profile:
        return {
            "entity_id": entity_id,
            "error": f"Profile not found for {entity_id}",
        }

    # Copy base probability matrix
    probs: Dict[str, float] = dict(
        profile.get("output_probability_matrix", {})
    )
    rules: List[Dict[str, Any]] = profile.get("state_update_rules", [])
    sensitivity: Dict[str, float] = profile.get("input_sensitivity", {})

    # Apply each rule sequentially
    for rule in rules:
        signal = rule.get("if_signal", "")
        operator = rule.get("operator", ">")
        threshold = float(rule.get("threshold", 0.5))
        then_action = rule.get("then_action", "")
        delta = float(rule.get("delta", 0.0))
        and_action = rule.get("and_action", "")
        and_delta = float(rule.get("and_delta", 0.0))

        current_value = _extract_signal_value(snapshot, signal)

        if _compare(current_value, operator, threshold):
            if then_action in probs:
                probs[then_action] = max(0.0, min(1.0, probs[then_action] + delta))
            if and_action and and_action in probs:
                probs[and_action] = max(0.0, min(1.0, probs[and_action] + and_delta))

    posture = _get_posture_label(probs)

    # Compute stress level from weighted input signals
    stress_sum = 0.0
    weight_sum = 0.0
    for signal, weight in sensitivity.items():
        val = _extract_signal_value(snapshot, signal)
        stress_sum += val * weight
        weight_sum += weight
    stress = round(stress_sum / weight_sum, 3) if weight_sum > 0 else 0.0

    return {
        "entity_id": entity_id,
        "actor_name": profile.get("actor_name", ""),
        "actor_class": profile.get("actor_class", ""),
        "current_stress": stress,
        "current_posture": posture,
        "posture_updated_at": datetime.now(timezone.utc).isoformat(),
        "adjusted_probability_matrix": {
            k: round(v, 3) for k, v in sorted(probs.items(), key=lambda x: x[1], reverse=True)
        },
        "rules_applied": len(rules),
        "status": profile.get("status", "draft"),
    }


async def get_all_postures(
    snapshot: Dict[str, Any],
    entity_ids: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Run get_actor_posture for all active profiles.

    If entity_ids is None, runs for all 11 core profiles.
    Results are sorted by stress descending.
    """
    if entity_ids is None:
        entity_ids = [p["entity_id"] for p in PROFILES]

    postures = []
    for eid in entity_ids:
        posture = await get_actor_posture(eid, snapshot)
        if "error" not in posture:
            postures.append(posture)

    return sorted(postures, key=lambda p: p["current_stress"], reverse=True)


async def seed_profiles_to_db() -> Dict[str, Any]:
    """Upsert all 11 seed profiles into Supabase.

    Returns counts of inserted/updated per status.
    """
    inserted = 0
    updated = 0
    for profile in PROFILES:
        try:
            existing = db.table("actor_profiles").select("id").eq("entity_id", profile["entity_id"]).execute()
            if existing.data:
                db.table("actor_profiles").update(profile).eq("entity_id", profile["entity_id"]).execute()
                updated += 1
            else:
                db.table("actor_profiles").insert(profile).execute()
                inserted += 1
        except Exception:
            pass
    return {"inserted": inserted, "updated": updated, "total": len(PROFILES)}


async def backtest_actor(
    entity_id: str,
    historical_event: Dict[str, Any],
) -> Dict[str, Any]:
    """Reconstruct historical state and compare actor behavior to documented pattern.

    Args:
        entity_id: Actor to test.
        historical_event: Dict with snapshot fields + expected_behavior.

    Returns:
        Validation score and match analysis.
    """
    # Build synthetic snapshot from historical event data
    snapshot = {k: v for k, v in historical_event.items() if k != "expected_behavior"}

    posture = await get_actor_posture(entity_id, snapshot)
    expected = historical_event.get("expected_behavior", "")

    # Compare top action from adjusted matrix to expected behavior
    probs = posture.get("adjusted_probability_matrix", {})
    top_action = list(probs.keys())[0] if probs else ""

    # Simple match: does the top predicted action contain the expected keyword?
    match = 0.0
    if expected and top_action:
        expected_keywords = expected.lower().replace("_", " ").split()
        top_lower = top_action.lower().replace("_", " ")
        keyword_match = sum(1 for kw in expected_keywords if kw in top_lower)
        match = round(min(1.0, keyword_match / max(len(expected_keywords), 1)), 3)

    return {
        "entity_id": entity_id,
        "historical_event": historical_event.get("event", ""),
        "top_predicted_action": top_action,
        "expected_behavior": expected,
        "match_score": match,
        "adjusted_probability_matrix": posture.get("adjusted_probability_matrix", {}),
        "current_posture": posture.get("current_posture", ""),
    }
