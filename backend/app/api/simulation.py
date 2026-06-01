"""
Simulation Chamber API — Phase 7 endpoints.

POST   /simulation/run              → run simulation (returns immediately)
GET    /simulation/runs             → list recent runs
GET    /simulation/runs/{run_id}    → single run record
GET    /simulation/scenarios        → full scenario library
GET    /simulation/scenarios/{scenario_id} → single scenario
POST   /simulation/scenarios        → save custom scenario
GET    /simulation/compare          → compare two runs
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Any, Dict, List, Optional

from ..services.simulation_engine import (
    simulation_engine,
    SCENARIO_LIBRARY,
    _runs_store,
    _library_store,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.post("/run", response_model=Dict[str, Any])
async def run_simulation(
    scenario_id: Optional[str] = None,
    custom_scenario: Optional[Dict[str, Any]] = None,
    base_state_version_id: Optional[str] = None,
    mc_iterations: int = 1000,
    time_horizon_days: int = 30,
    time_step_days: int = 7,
    counterfactual_of: Optional[str] = None,
):
    try:
        result = await simulation_engine.run(
            scenario_id=scenario_id,
            custom_scenario=custom_scenario,
            base_state_version_id=base_state_version_id,
            mc_iterations=mc_iterations,
            time_horizon_days=time_horizon_days,
            time_step_days=time_step_days,
            counterfactual_of=counterfactual_of,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/runs", response_model=Dict[str, Any])
async def list_runs(limit: int = 10, skip: int = 0):
    all_runs = list(_runs_store.values())
    sorted_runs = sorted(all_runs, key=lambda r: r.get("started_at", ""), reverse=True)
    return sorted_runs[skip : skip + limit]


@router.get("/runs/{run_id}", response_model=Dict[str, Any])
async def get_run(run_id: str):
    run = _runs_store.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/scenarios", response_model=Dict[str, Any])
async def list_scenarios(type_filter: Optional[str] = Query(None, alias="type")):
    scenarios = list(SCENARIO_LIBRARY)
    for s in _library_store:
        if s.get("scenario_id") not in {x["scenario_id"] for x in scenarios}:
            scenarios.append(s)
    if type_filter:
        scenarios = [s for s in scenarios if s.get("scenario_type") == type_filter]
    return scenarios


@router.get("/scenarios/{scenario_id}", response_model=Dict[str, Any])
async def get_scenario(scenario_id: str):
    for s in SCENARIO_LIBRARY:
        if s["scenario_id"] == scenario_id:
            return s
    for s in _library_store:
        if s.get("scenario_id") == scenario_id:
            return s
    raise HTTPException(status_code=404, detail="Scenario not found")


@router.post("/scenarios", response_model=Dict[str, Any])
async def save_scenario(scenario: Dict[str, Any]):
    if not scenario.get("scenario_id"):
        raise HTTPException(status_code=400, detail="scenario_id is required")
    for s in _library_store:
        if s.get("scenario_id") == scenario["scenario_id"]:
            s.update(scenario)
            return s
    _library_store.append(scenario)
    return scenario


@router.get("/compare", response_model=Dict[str, Any])
async def compare_runs(run_a: str, run_b: str):
    a = _runs_store.get(run_a)
    b = _runs_store.get(run_b)
    if not a:
        raise HTTPException(status_code=404, detail=f"Run {run_a} not found")
    if not b:
        raise HTTPException(status_code=404, detail=f"Run {run_b} not found")

    def _safe_delta(key_a, key_b):
        va = a.get(key_a) or 0
        vb = b.get(key_b) or 0
        if isinstance(va, (int, float)) and isinstance(vb, (int, float)):
            return round(vb - va, 4)
        return None

    from copy import deepcopy
    comparison = {
        "run_a": {"run_id": run_a, "scenario_name": a.get("scenario_name"), "status": a.get("status")},
        "run_b": {"run_id": run_b, "scenario_name": b.get("scenario_name"), "status": b.get("status")},
        "deltas": {
            "p_revolution_mean": _safe_delta("p_revolution_range", "p_revolution_range"),
            "elite_fracture_probability": _safe_delta("elite_fracture_probability", "elite_fracture_probability"),
            "military_posture_shift": _safe_delta("military_posture_shift", "military_posture_shift"),
            "ugtt_strike_probability": _safe_delta("ugtt_strike_probability", "ugtt_strike_probability"),
        },
    }

    oa = a.get("outcome_distribution", {})
    ob = b.get("outcome_distribution", {})
    comparison["outcome_delta"] = {}
    for phase in ["stable", "elevated", "crisis", "acute_crisis", "transition"]:
        va = oa.get(phase, 0)
        vb = ob.get(phase, 0)
        comparison["outcome_delta"][phase] = round(vb - va, 4)

    traj_a = a.get("rri_trajectory", [])
    traj_b = b.get("rri_trajectory", [])
    comparison["rri_trajectory_a"] = traj_a
    comparison["rri_trajectory_b"] = traj_b

    sa = a.get("sensitivity_ranking", [])
    sb = b.get("sensitivity_ranking", [])
    comparison["sensitivity_a"] = sa
    comparison["sensitivity_b"] = sb

    return comparison
