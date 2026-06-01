"""
Intervention Engine API — Phase 10.

Routes:
  POST /api/interventions/run
  GET  /api/interventions/library
  GET  /api/interventions/library/{intervention_id}
  POST /api/interventions/test
  GET  /api/interventions/runs/{run_id}
  GET  /api/interventions/runs/latest
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.intervention_engine import intervention_engine

router = APIRouter(prefix="/interventions", tags=["interventions"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RunRequest(BaseModel):
    target_outcome: str
    investigation_id: Optional[str] = None
    base_state_version_id: Optional[str] = None
    time_horizon_days: int = 30
    intervention_ids: Optional[List[str]] = None
    top_n: int = 5


class TestRequest(BaseModel):
    intervention_id: str
    base_state_version_id: Optional[str] = None
    time_horizon_days: int = 30


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/run", response_model=Dict[str, Any])
async def run_intervention_analysis(req: RunRequest) -> Dict[str, Any]:
    """
    Run full intervention efficiency analysis for a target outcome.
    Returns ranked interventions with deltas, tradeoffs, and recommendation.
    """
    valid_outcomes = {
        "reduce_unrest", "stabilize_fx", "prevent_strike",
        "reduce_p_revolution", "reduce_cascade",
    }
    if req.target_outcome not in valid_outcomes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target_outcome. Must be one of: {sorted(valid_outcomes)}",
        )

    result = await intervention_engine.run(
        target_outcome=req.target_outcome,
        investigation_id=req.investigation_id,
        base_state_version_id=req.base_state_version_id,
        time_horizon_days=req.time_horizon_days,
        intervention_ids=req.intervention_ids,
        top_n=req.top_n,
    )
    return result


@router.get("/library", response_model=Dict[str, Any])
def get_library() -> List[Dict[str, Any]]:
    """Return full intervention library."""
    return intervention_engine.get_library()


@router.get("/library/{intervention_id}", response_model=Dict[str, Any])
def get_intervention(intervention_id: str) -> Dict[str, Any]:
    """Return a single intervention from the library."""
    intv = intervention_engine.get_intervention(intervention_id)
    if not intv:
        raise HTTPException(status_code=404, detail=f"Intervention '{intervention_id}' not found.")
    return intv


@router.post("/test", response_model=Dict[str, Any])
async def test_single_intervention(req: TestRequest) -> Dict[str, Any]:
    """
    Test a single intervention in isolation.
    Returns outcome delta, actor reactions, efficiency score.
    """
    intv = intervention_engine.get_intervention(req.intervention_id)
    if not intv:
        raise HTTPException(status_code=404, detail=f"Intervention '{req.intervention_id}' not found.")

    snapshot = await intervention_engine._load_state(req.base_state_version_id)
    baseline = intervention_engine._run_baseline(snapshot, req.time_horizon_days)
    result = await intervention_engine._test_intervention(
        intv, snapshot, req.time_horizon_days, baseline
    )
    return {
        "intervention_id": req.intervention_id,
        "snapshot": {
            "rri": snapshot.get("rri"),
            "p_revolution": snapshot.get("p_revolution"),
        },
        "baseline": baseline,
        "result": result,
    }


@router.get("/runs/latest", response_model=Dict[str, Any])
def get_latest_run() -> Dict[str, Any]:
    """Return the most recent intervention run."""
    run = intervention_engine.get_latest_run()
    if not run:
        return {"status": "no_runs_yet"}
    return run


@router.get("/runs/{run_id}", response_model=Dict[str, Any])
def get_run(run_id: str) -> Dict[str, Any]:
    """Return a specific intervention run by ID."""
    run = intervention_engine.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")
    return run
