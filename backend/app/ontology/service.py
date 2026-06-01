import logging
"""
Ontology Service — Causal Intelligence Layer.

Checks active causal chains against the canonical national_state_snapshots
after each write. Returns triggered chain_ids with propagation timing.

All chains start as draft; they require analyst validation to reach active.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..core.database import db
from .seed_chains import CHAINS, TRIGGER_THRESHOLDS
logger = logging.getLogger(__name__)


def _build_threshold_map() -> Dict[str, List[Dict[str, Any]]]:
    """Build lookup: variable_code -> [threshold_records]."""
    m: Dict[str, List[Dict[str, Any]]] = {}
    for t in TRIGGER_THRESHOLDS:
        code = t.get("variable_code", "")
        m.setdefault(code, []).append(t)
    return m


def _get_state_variable_value(
    snapshot: Dict[str, Any],
    variable_code: str,
) -> float:
    """Extract a numeric value from a snapshot dict by variable code.

    Maps ontology activation_variable codes to snapshot fields:
      - rri -> snapshot['rri']
      - p_rev -> snapshot['p_revolution']
      - E4_fx_reserves_days -> snapshot['rri'] (fallback); best-effort
      - narrative_convergence -> snapshot['category_scores']['N']
      - etc.
    """
    direct_field_map: Dict[str, str] = {
        "rri": "rri",
        "p_rev": "p_revolution",
        "E4_fx_reserves_days": "rri",
        "narrative_convergence": "salience",
        "E2_wheat_stress": "compound_stress",
        "S4_phosphate_strike": "compound_stress",
        "P1_mii": "mii",
        "S4_ugtt_strike_index": "compound_stress",
        "S3_repression_index": "compound_stress",
        "B1_water_stress": "compound_stress",
        "P3_imf_pressure": "compound_stress",
        "w_t": "war_intensity",
        "elite_cohesion_dynamics": "elite_cohesion",
        "elite_defection_prob": "elite_defection_prob",
        "A16_brain_drain_rate": "compound_stress",
        "compound_stress": "compound_stress",
        "cascade_probability": "cascade_probability",
        "salience": "salience",
        "salience_effective": "salience_effective",
        "info_amplification": "info_amplification",
        "structural_econ": "structural_econ",
        "acceleration": "acceleration",
        "cpi_index": "cpi_index",
    }

    field = direct_field_map.get(variable_code)
    if field:
        val = snapshot.get(field)
        if isinstance(val, (int, float)):
            return float(val)
        return 0.0

    return 0.0


def check_activation(
    snapshot: Dict[str, Any],
) -> Dict[str, Any]:
    """Scan chains and thresholds against a snapshot's variable values.

    Returns:
        {
            "checked_at": "<ISO timestamp>",
            "state_version_id": "<id>",
            "active_chains": [
                {
                    "chain_id": "bread_price_cascade",
                    "threshold_breached": "active",
                    "current_value": 0.72,
                    "threshold_value": 0.65,
                    "propagation_estimate_hours": <max time_lag_days * 24>,
                    "nodes_triggered": [1, 2, 3, ...],
                    "status": "active",
                },
                ...
            ],
            "latent_chains": [...],
            "thresholds_checked": [...],
        }
    """
    state_version_id = snapshot.get("state_version_id", "")
    threshold_map = _build_threshold_map()
    active_chains: List[Dict[str, Any]] = []
    latent_chains: List[Dict[str, Any]] = []
    thresholds_checked: List[Dict[str, Any]] = []

    variable_cache: Dict[str, float] = {}

    def _get_var(code: str) -> float:
        if code not in variable_cache:
            variable_cache[code] = _get_state_variable_value(snapshot, code)
        return variable_cache[code]

    for chain in CHAINS:
        chain_id = chain.get("chain_id", "")
        activation_var = chain.get("activation_variable", "")
        threshold = chain.get("activation_threshold", 0.5)
        current_val = _get_var(activation_var)

        # Check all thresholds for this chain
        chain_thresholds = [
            t for t in TRIGGER_THRESHOLDS
            if chain_id in t.get("chain_ids", [])
        ]

        highest_breach: Optional[str] = None
        highest_val: float = 0.0

        for ct in chain_thresholds:
            t_name = ct.get("threshold_name", "")
            t_val = float(ct.get("threshold_value", 0))
            thresholds_checked.append({
                "chain_id": chain_id,
                "threshold_name": t_name,
                "variable_code": ct.get("variable_code", ""),
                "threshold_value": t_val,
                "current_value": current_val,
                "breached": current_val >= t_val,
                "distance": current_val - t_val,
            })

            if current_val >= t_val and t_val > highest_val:
                highest_breach = t_name
                highest_val = t_val

        # Determine which causal nodes fire
        triggered_nodes: List[int] = []
        max_time_lag = 0
        for node in chain.get("causal_nodes", []):
            step = node.get("step", 0)
            lag = node.get("time_lag_days", 0)
            weight = node.get("propagation_weight", 0)

            # Node fires if the weight-adjusted threshold is met
            effective_threshold = threshold * (1.5 - weight * 0.5)
            if current_val >= effective_threshold:
                triggered_nodes.append(step)
            max_time_lag = max(max_time_lag, lag)

        entry = {
            "chain_id": chain_id,
            "chain_name": chain.get("chain_name", ""),
            "domain": chain.get("domain", ""),
            "activation_variable": activation_var,
            "threshold_value": threshold,
            "current_value": round(current_val, 4),
            "threshold_breached": highest_breach,
            "propagation_estimate_hours": max_time_lag * 24 if triggered_nodes else 0,
            "nodes_triggered": triggered_nodes,
            "total_nodes": len(chain.get("causal_nodes", [])),
            "trigger_ratio": round(len(triggered_nodes) / max(len(chain.get("causal_nodes", [])), 1), 4),
            "status": chain.get("status", "draft"),
            "confidence": chain.get("confidence", 0.0),
        }

        if highest_breach and highest_breach != "latent":
            active_chains.append(entry)
        else:
            latent_chains.append(entry)

    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "state_version_id": state_version_id,
        "active_chains": sorted(active_chains, key=lambda x: x["current_value"], reverse=True),
        "latent_chains": sorted(latent_chains, key=lambda x: x["current_value"], reverse=True),
        "thresholds_checked": thresholds_checked,
    }


def validate_chain(
    chain_id: str,
    analyst_notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Mark a chain as validated (status -> active) in Supabase.

    Falls back to in-memory update if DB write fails.
    """
    chain = next((c for c in CHAINS if c.get("chain_id") == chain_id), None)
    if not chain:
        return {"error": f"Chain '{chain_id}' not found"}

    now = datetime.now(timezone.utc).isoformat()

    try:
        db.table("ontology_causal_chains").update({
            "status": "active",
            "validation_score": 1.0,
            "last_validated_at": now,
            "notes": analyst_notes,
        }).eq("chain_id", chain_id).execute()

        db.table("ontology_causal_chains").upsert({
            "chain_id": chain_id,
            "chain_name": chain.get("chain_name", ""),
            "domain": chain.get("domain", ""),
            "trigger_category": chain.get("trigger_category", ""),
            "causal_nodes": chain.get("causal_nodes", []),
            "activation_threshold": chain.get("activation_threshold"),
            "activation_variable": chain.get("activation_variable"),
            "validated_events": chain.get("validated_events", []),
            "validation_score": 1.0,
            "last_validated_at": now,
            "doctrine_refs": chain.get("doctrine_refs", []),
            "local_amplifiers": chain.get("local_amplifiers", []),
            "local_suppressors": chain.get("local_suppressors", []),
            "regional_sensitivity": chain.get("regional_sensitivity", {}),
            "confidence": chain.get("confidence", 0.0),
            "status": "active",
        }).execute()
    except Exception as e:
        logger.warning("Suppressed exception in ontology/service.py: %s", e)

    # Also update in-memory
    chain["status"] = "active"
    chain["validation_score"] = 1.0
    chain["last_validated_at"] = now

    return {
        "chain_id": chain_id,
        "status": "active",
        "validated_at": now,
        "analyst_notes": analyst_notes,
    }


def trace_variable(variable_code: str) -> Dict[str, Any]:
    """Find all chains that reference a given variable code.

    Returns chain info plus node positions within each chain.
    """
    results: List[Dict[str, Any]] = []

    for chain in CHAINS:
        chain_id = chain.get("chain_id", "")
        nodes = chain.get("causal_nodes", [])

        matching_nodes = [
            {
                "step": n.get("step"),
                "concept": n.get("concept"),
                "propagation_weight": n.get("propagation_weight"),
                "time_lag_days": n.get("time_lag_days"),
            }
            for n in nodes
            if n.get("rri_variable") == variable_code
        ]

        if matching_nodes or chain.get("activation_variable") == variable_code:
            results.append({
                "chain_id": chain_id,
                "chain_name": chain.get("chain_name", ""),
                "domain": chain.get("domain", ""),
                "status": chain.get("status", "draft"),
                "is_activation_variable": chain.get("activation_variable") == variable_code,
                "activation_threshold": chain.get("activation_threshold"),
                "matching_nodes": matching_nodes,
            })

    return {
        "variable_code": variable_code,
        "chains_referencing": len(results),
        "chains": results,
    }


def get_all_chains() -> List[Dict[str, Any]]:
    """Return all seed chains with metadata."""
    return CHAINS


def get_chain(chain_id: str) -> Optional[Dict[str, Any]]:
    """Return a single chain by ID."""
    return next((c for c in CHAINS if c.get("chain_id") == chain_id), None)
