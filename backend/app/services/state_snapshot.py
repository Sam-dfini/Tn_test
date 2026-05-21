"""
State Snapshot Service — Single-authority writer for national_state_snapshots.

Orchestrator step 7 invokes write_snapshot() after RRI computation.  The
snapshot becomes the canonical state that every frontend component reads.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from ..api.ws import manager
from .rri_engine import (
    calculate_rri,
    detect_threshold_breaches,
    calculate_model_confidence,
    get_regime_age,
    _load_variables,
)


def make_version_id() -> str:
    now = datetime.now(timezone.utc)
    return f"snap_{now.strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"


def write_snapshot(
    rri_result: Dict[str, Any],
    articles_processed: int = 0,
    is_simulation: bool = False,
    parent_state_id: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Write a full NationalStateSnapshot to Supabase.

    Args:
        rri_result: Output from calculate_rri()
        articles_processed: Count of articles consumed this cycle
        is_simulation: True if this is a scenario/simulation run
        parent_state_id: Link to parent snapshot (for forks)
        notes: Optional human annotation

    Returns:
        The created snapshot row dict.
    """
    version_id = make_version_id()
    now = datetime.now(timezone.utc).isoformat()

    snapshot = {
        "state_version_id": version_id,
        "computed_at": now,
        "computation_source": "python_orchestrator",
        "computation_duration_ms": None,

        "rri": rri_result.get("rri", 0.0),
        "rri_previous": None,
        "p_revolution": rri_result.get("p_rev", 0.0),
        "velocity": rri_result.get("velocity", 0.0),
        "acceleration": rri_result.get("acceleration", 0.0),
        "compound_stress": rri_result.get("compound_stress", 0.0),
        "cascade_probability": rri_result.get("cascade_probability", 0.0),
        "salience": rri_result.get("salience", 0.0),
        "salience_effective": rri_result.get("salience_effective", 0.0),
        "war_intensity": rri_result.get("w_t", 0.0),
        "elite_cohesion": rri_result.get("elite_cohesion_dynamics", 0.0),
        "elite_defection_prob": rri_result.get("elite_defection_prob", 0.0),
        "info_amplification": rri_result.get("info_amplification", 0.0),

        "mii": rri_result.get("mii", 0.0),
        "oci": rri_result.get("oci", 0.0),
        "cpi_index": rri_result.get("cpi_index", 0.0),
        "structural_econ": rri_result.get("structural_econ", 0.0),
        "pattern_similarity": rri_result.get("pattern_similarity", 0.0),
        "pattern_label": rri_result.get("pattern_label", ""),

        "mc_p_revolution_mean": rri_result.get("p_rev_mean", 0.0),
        "mc_p_revolution_p10": rri_result.get("ci_low", 0.0),
        "mc_p_revolution_p90": rri_result.get("ci_high", 0.0),
        "mc_runs": rri_result.get("simulations_run", 10000),

        "category_scores": json.dumps(rri_result.get("category_scores", {})),
        "sir_susceptible": rri_result.get("sir_susceptible", 0.0),
        "sir_infected": rri_result.get("sir_infected", 0.0),
        "sir_recovered": rri_result.get("sir_recovered", 0.0),

        "governorate_vectors": "[]",
        "active_shocks": "[]",
        "narrative_state": "{}",
        "actor_postures": "[]",

        "state_phase": "unknown",
        "state_phase_confidence": 0.0,
        "state_phase_dwell_days": 0,

        "avg_sci_score": 0.0,
        "high_confidence_signals": 0,
        "psyop_detected": False,

        "variables_used": rri_result.get("variables_count", 0),
        "articles_processed": articles_processed,
        "data_freshness_hours": 0.0,
        "confidence_overall": rri_result.get("model_confidence", 0.0),
        "stochastic_shock": rri_result.get("stochastic_shock", 0.0),

        "is_simulation": is_simulation,
        "parent_state_id": parent_state_id,
        "notes": notes,
    }

    # Write to Supabase
    try:
        res = db.table("national_state_snapshots").insert(snapshot).execute()
        created: List[Dict[str, Any]] = res.data or []

        # Write per-variable snapshots
        threshold_breaches = rri_result.get("threshold_breaches", [])
        breached_codes = {b["variable"] for b in threshold_breaches}

        for var in rri_result.get("variables", {}).values():
            if not isinstance(var, dict):
                continue
            var_code = var.get("id") or f"{var.get('code', '')}{var.get('number', '')}"
            try:
                db.table("state_variable_snapshots").insert({
                    "state_id": created[0]["id"],
                    "variable_code": var_code,
                    "variable_value": var.get("value_2026"),
                    "normalized_value": var.get("value"),
                    "weight": var.get("weight"),
                    "threshold_breach": var_code in breached_codes,
                }).execute()
            except Exception:
                pass

        # WebSocket broadcast
        _broadcast_snapshot(created[0] if created else snapshot)

        return created[0] if created else snapshot

    except Exception as e:
        # Fallback: return computed snapshot without DB persistence
        _broadcast_snapshot(snapshot)
        return snapshot


def _broadcast_snapshot(snapshot: Dict[str, Any]) -> None:
    """Fire-and-forget WebSocket broadcast (non-blocking)."""
    import asyncio

    payload = {
        "type": "STATE_SNAPSHOT",
        "payload": {
            "state_version_id": snapshot.get("state_version_id"),
            "computed_at": snapshot.get("computed_at"),
            "rri": snapshot.get("rri"),
            "p_revolution": snapshot.get("p_revolution"),
            "velocity": snapshot.get("velocity"),
            "acceleration": snapshot.get("acceleration"),
            "compound_stress": snapshot.get("compound_stress"),
            "cascade_probability": snapshot.get("cascade_probability"),
            "category_scores": snapshot.get("category_scores"),
            "is_simulation": snapshot.get("is_simulation", False),
        },
    }
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast(payload))
    except RuntimeError:
        pass


def get_latest_snapshot() -> Optional[Dict[str, Any]]:
    """Fetch the most recent non-simulation snapshot from Supabase."""
    try:
        res = (
            db.table("national_state_snapshots")
            .select("*")
            .eq("is_simulation", False)
            .order("computed_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            return _deserialize(res.data[0])
    except Exception:
        pass
    return None


def get_snapshot_by_version(version_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a specific snapshot by version_id."""
    try:
        res = (
            db.table("national_state_snapshots")
            .select("*")
            .eq("state_version_id", version_id)
            .limit(1)
            .execute()
        )
        if res.data:
            return _deserialize(res.data[0])
    except Exception:
        pass
    return None


def _deserialize(row: Dict[str, Any]) -> Dict[str, Any]:
    """Parse JSONB fields back to Python objects."""
    for field in ("category_scores", "governorate_vectors", "active_shocks",
                  "narrative_state", "actor_postures"):
        val = row.get(field)
        if isinstance(val, str):
            try:
                row[field] = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                pass
    return row
