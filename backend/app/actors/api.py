"""Actor Profiles API — Posture, backtest, and profile endpoints."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.actor_engine import (
    backtest_actor,
    get_actor_posture,
    get_all_postures,
    seed_profiles_to_db,
)
from ..services.state_snapshot import get_latest_snapshot
from ..actors.seed_profiles import PROFILES

router = APIRouter(prefix="/actors", tags=["actors"])


class BacktestRequest(BaseModel):
    entity_id: str
    historical_event: Dict[str, Any]


# ── Get all active profiles (lean) ──────────────────────────────────


@router.get("", response_model=Dict[str, Any])
async def list_actors():
    """List all actor profiles with basic metadata."""
    return [
        {
            "entity_id": p["entity_id"],
            "actor_name": p["actor_name"],
            "actor_class": p["actor_class"],
            "decision_style": p["decision_style"],
            "status": p["status"],
            "doctrine": p.get("doctrine", ""),
        }
        for p in PROFILES
    ]


# ── Get full profile with current posture ───────────────────────────


@router.get("/{entity_id}", response_model=Dict[str, Any])
async def get_actor(entity_id: str):
    """Get full profile for one actor, enriched with current posture."""
    profile = next((p for p in PROFILES if p["entity_id"] == entity_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Actor '{entity_id}' not found")

    snapshot = get_latest_snapshot()
    posture = {}
    if snapshot:
        posture = await get_actor_posture(entity_id, snapshot)

    return {**profile, "live_posture": posture}


# ── Get current posture only (for UI) ───────────────────────────────


@router.get("/{entity_id}/posture", response_model=Dict[str, Any])
async def get_actor_posture_endpoint(entity_id: str):
    """Get current posture and adjusted probabilities for one actor."""
    snapshot = get_latest_snapshot()
    if not snapshot:
        raise HTTPException(status_code=503, detail="No snapshot available yet")

    profile = next((p for p in PROFILES if p["entity_id"] == entity_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Actor '{entity_id}' not found")

    return await get_actor_posture(entity_id, snapshot)


# ── Get all postures from latest snapshot ───────────────────────────


@router.get("/postures/current", response_model=Dict[str, Any])
async def get_all_current_postures():
    """Get all actor postures from the latest state snapshot."""
    snapshot = get_latest_snapshot()
    if not snapshot:
        return {"postures": [], "note": "No snapshot available"}

    postures = await get_all_postures(snapshot)
    return {
        "state_version_id": snapshot.get("state_version_id"),
        "computed_at": snapshot.get("computed_at"),
        "postures": postures,
    }


# ── Backtest ────────────────────────────────────────────────────────


@router.post("/{entity_id}/backtest", response_model=Dict[str, Any])
async def backtest_actor_endpoint(entity_id: str, req: BacktestRequest):
    """Run historical validation against a documented event.

    Body should contain a dict with snapshot fields + 'expected_behavior' key.
    """
    profile = next((p for p in PROFILES if p["entity_id"] == entity_id), None)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Actor '{entity_id}' not found")

    result = await backtest_actor(entity_id, req.historical_event)
    return result


# ── Seed profiles to DB ─────────────────────────────────────────────


@router.post("/seed", response_model=Dict[str, Any])
async def seed_actors():
    """Upsert all 11 seed profiles into Supabase."""
    result = await seed_profiles_to_db()
    return {"status": "ok", **result}
