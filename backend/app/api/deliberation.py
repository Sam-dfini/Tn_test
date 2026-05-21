"""Deliberation API — High Table deliberation endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.deliberation_engine import deliberation_engine, get_sessions

router = APIRouter(prefix="/deliberation", tags=["deliberation"])


class RunDeliberationRequest(BaseModel):
    scenario: str
    trigger_type: str = "analyst"
    trigger_source: Optional[str] = None
    state_version_id: Optional[str] = None
    actor_ids: Optional[List[str]] = None
    is_simulation: bool = False


@router.post("/run")
async def run_deliberation(req: RunDeliberationRequest):
    """Run a full deliberation session and return the record."""
    session = await deliberation_engine.run(
        scenario=req.scenario,
        trigger_type=req.trigger_type,
        trigger_source=req.trigger_source,
        state_version_id=req.state_version_id,
        actor_ids=req.actor_ids,
        is_simulation=req.is_simulation,
    )
    return session


@router.get("/sessions")
async def list_sessions(limit: int = 10):
    """List recent deliberation sessions (from in-memory store)."""
    sessions = get_sessions()
    return sorted(sessions, key=lambda s: s.get("completed_at", ""), reverse=True)[:limit]


@router.get("/sessions/latest")
async def latest_session():
    """Return the most recent deliberation session."""
    sessions = get_sessions()
    if not sessions:
        return {"status": "no_sessions_yet"}
    return max(sessions, key=lambda s: s.get("completed_at", ""))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Return a specific session by session_id."""
    sessions = get_sessions()
    for s in sessions:
        if s.get("session_id") == session_id:
            return s
    raise HTTPException(status_code=404, detail="Session not found")
