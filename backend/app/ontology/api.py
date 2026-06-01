"""Ontology API — Causal Intelligence endpoints."""

from __future__ import annotations

from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .service import (
    check_activation,
    get_all_chains,
    get_chain,
    trace_variable,
    validate_chain,
)
from ..services.state_snapshot import get_latest_snapshot, get_snapshot_by_version

router = APIRouter(prefix="/ontology", tags=["ontology"])


class ValidateRequest(BaseModel):
    chain_id: str
    analyst_notes: Optional[str] = None


@router.get("/chains", response_model=Dict[str, Any])
async def list_chains():
    """List all 12 causal chains with metadata."""
    return get_all_chains()


@router.get("/chains/{chain_id}", response_model=Dict[str, Any])
async def get_chain_endpoint(chain_id: str):
    """Get a single causal chain by ID."""
    chain = get_chain(chain_id)
    if not chain:
        raise HTTPException(status_code=404, detail=f"Chain '{chain_id}' not found")
    return chain


@router.get("/active", response_model=Dict[str, Any])
async def get_active_chains(
    state_version_id: Optional[str] = None,
):
    """Check which chains are active given the current (or specific) state snapshot.

    If state_version_id is omitted, the latest snapshot is used.
    Returns triggered chains with propagation timing and node-level detail.
    """
    if state_version_id:
        snapshot = get_snapshot_by_version(state_version_id)
        if not snapshot:
            raise HTTPException(status_code=404, detail="Snapshot not found")
    else:
        snapshot = get_latest_snapshot()
        if not snapshot:
            return {
                "checked_at": None,
                "state_version_id": None,
                "active_chains": [],
                "latent_chains": [],
                "thresholds_checked": [],
                "note": "No snapshot available yet",
            }

    return check_activation(snapshot)


@router.get("/trace/{variable_code}", response_model=Dict[str, Any])
async def trace_variable_endpoint(variable_code: str):
    """Trace a variable through all chains that reference it.

    Returns chain IDs, node positions, and whether it's an activation variable.
    """
    return trace_variable(variable_code)


@router.post("/validate", response_model=Dict[str, Any])
async def validate_chain_endpoint(req: ValidateRequest):
    """Mark a draft chain as validated (status -> active).

    Requires analyst confirmation. Writes to Supabase and updates in-memory seed.
    """
    result = validate_chain(req.chain_id, req.analyst_notes)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
