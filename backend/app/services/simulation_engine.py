"""
Simulation Chamber Engine — Phase 7.

Runs Monte Carlo simulations that fork from the canonical state snapshot,
inject shocks, propagate through causal chains, integrate deliberation
(Phase 6), and produce probability distributions of outcomes.

Architecture:
  run() returns run_id immediately, spawns _execute() async.
  _execute() runs MC iterations, each advancing time in discrete steps.
  At key thresholds, deliberation is triggered and fed back into state.
"""

from __future__ import annotations

import asyncio
import copy
import json
import math
import random
import time
from collections import Counter
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from ..api.ws import manager
from .state_snapshot import get_latest_snapshot, get_snapshot_by_version

# ---------------------------------------------------------------------------
# In-memory stores
# ---------------------------------------------------------------------------

_runs_store: Dict[str, Dict[str, Any]] = {}
_library_store: List[Dict[str, Any]] = []


def set_runs(runs: List[Dict[str, Any]]) -> None:
    _runs_store.clear()
    for r in runs:
        _runs_store[r["run_id"]] = r


def get_runs() -> List[Dict[str, Any]]:
    return list(_runs_store.values())


def set_library(scenarios: List[Dict[str, Any]]) -> None:
    _library_store.clear()
    _library_store.extend(scenarios)


def get_library() -> List[Dict[str, Any]]:
    return list(_library_store)


# ---------------------------------------------------------------------------
# Scenario library — 13 pre-built scenarios
# ---------------------------------------------------------------------------

SCENARIO_LIBRARY: List[Dict[str, Any]] = [
    # ── ECONOMIC ──────────────────────────────────────────────────────
    {
        "scenario_id": "SCN-E01",
        "scenario_name": "Full Subsidy Removal — IMF Demand",
        "scenario_type": "policy_decision",
        "description": "IMF demands complete removal of bread and fuel subsidies as condition for program continuation.",
        "shock_vector": {"E2_wheat_stress": 0.35, "E4_fx_reserves_pressure": 0.25, "P3_imf_pressure": 0.40, "A12_supply_squeeze": 0.20},
        "tags": ["economic", "imf", "food", "ugtt"],
        "historical_basis": "TUN_2023_IMF_NEGOTIATION"
    },
    {
        "scenario_id": "SCN-E02",
        "scenario_name": "FX Reserve Crisis — Below 30 Days",
        "scenario_type": "shock_injection",
        "description": "Foreign exchange reserves drop to critical level below 30 days import cover.",
        "shock_vector": {"E4_fx_reserves_days": -25, "E4_parallel_fx_premium": 0.30, "A18_revenue_collapse": 0.25},
        "tags": ["economic", "currency", "bct", "imf"]
    },
    {
        "scenario_id": "SCN-E03",
        "scenario_name": "Global Wheat Price Spike +40%",
        "scenario_type": "shock_injection",
        "description": "Global wheat price rises 40% due to Black Sea disruption.",
        "shock_vector": {"E2_wheat_stress": 0.40, "E2_bci": 0.30, "A12_supply_squeeze": 0.25},
        "tags": ["economic", "food", "global"],
        "historical_basis": "TUN_2011_FOOD_PRICE_SPIKE"
    },
    # ── POLITICAL ─────────────────────────────────────────────────────
    {
        "scenario_id": "SCN-P01",
        "scenario_name": "Cabinet Reshuffle — MII Spike",
        "scenario_type": "policy_decision",
        "description": "Sudden dismissal of 5+ ministers signals elite fracture.",
        "shock_vector": {"P1_mii": 0.35, "P1_elite_cohesion": -0.25, "P1_cabinet_friction": 0.30},
        "tags": ["political", "elite", "presidency"]
    },
    {
        "scenario_id": "SCN-P02",
        "scenario_name": "Constitutional Crisis",
        "scenario_type": "black_swan",
        "description": "Legitimacy challenge to executive authority — opposition coalition + international condemnation.",
        "shock_vector": {"P1_elite_cohesion": -0.40, "P3_foreign_pressure": 0.35, "S1_protest_velocity": 0.30, "narrative_convergence": 0.45},
        "tags": ["political", "legitimacy", "opposition", "foreign"],
        "historical_basis": "TUN_2021_SELF_COUP"
    },
    # ── SECURITY ──────────────────────────────────────────────────────
    {
        "scenario_id": "SCN-S01",
        "scenario_name": "UGTT General Strike",
        "scenario_type": "shock_injection",
        "description": "UGTT calls a national general strike over wage demands.",
        "shock_vector": {"S4_ugtt_strike_index": 0.50, "S1_protest_velocity": 0.25, "E4_economic_output": -0.15},
        "tags": ["labor", "ugtt", "social"],
        "historical_basis": "TUN_2013_GENERAL_STRIKE"
    },
    {
        "scenario_id": "SCN-S02",
        "scenario_name": "Gafsa Mining Basin Blockade",
        "scenario_type": "shock_injection",
        "description": "CPG production halted by protest blockade — phosphate exports suspended.",
        "shock_vector": {"S4_phosphate_strike": 0.60, "A18_revenue_collapse": 0.30, "E4_fx_reserves_pressure": 0.20},
        "tags": ["security", "economic", "regional", "phosphate"],
        "historical_basis": "TUN_2008_GAFSA"
    },
    # ── ENVIRONMENTAL ─────────────────────────────────────────────────
    {
        "scenario_id": "SCN-V01",
        "scenario_name": "Severe Drought — Agricultural Collapse",
        "scenario_type": "shock_injection",
        "description": "Third consecutive drought year. Wheat yield -60%. Water rationing in 12 governorates.",
        "shock_vector": {"B1_water_stress": 0.45, "E2_wheat_stress": 0.35, "E2_bci": 0.30, "S1_rural_grievance": 0.25},
        "tags": ["environmental", "food", "water", "agriculture"]
    },
    # ── COMPOUND ──────────────────────────────────────────────────────
    {
        "scenario_id": "SCN-C01",
        "scenario_name": "Perfect Storm — IMF + Drought + Gaza Escalation",
        "scenario_type": "compound",
        "description": "Simultaneous: IMF program suspended + severe drought + major regional conflict escalation.",
        "shock_vector": {"P3_imf_pressure": 0.50, "B1_water_stress": 0.40, "E2_wheat_stress": 0.40, "W_war_intensity": 0.35, "E4_fx_reserves_pressure": 0.30, "A12_supply_squeeze": 0.25},
        "tags": ["compound", "critical", "economic", "environmental", "external"]
    },
    {
        "scenario_id": "SCN-C02",
        "scenario_name": "Regime Transition Threshold",
        "scenario_type": "compound",
        "description": "Conditions matching 2011 pre-departure week: mass protest + elite fracture + military signal.",
        "shock_vector": {"P1_elite_cohesion": -0.50, "S1_sir_infected": 0.40, "P1_mii": 0.40, "ARM_posture_shift": -0.35, "narrative_convergence": 0.50},
        "tags": ["compound", "critical", "terminal", "political"],
        "historical_basis": "TUN_2011_REVOLUTION"
    },
    # ── BLACK SWANS ───────────────────────────────────────────────────
    {
        "scenario_id": "SCN-B01",
        "scenario_name": "Presidential Incapacitation",
        "scenario_type": "black_swan",
        "description": "Sudden removal of executive authority — succession crisis, power vacuum.",
        "shock_vector": {"P1_elite_cohesion": -0.60, "P1_mii": 0.55, "S1_protest_velocity": 0.20, "ARM_posture_shift": -0.40},
        "tags": ["black_swan", "political", "succession"]
    },
    {
        "scenario_id": "SCN-B02",
        "scenario_name": "Major Terrorist Attack — Tourism Collapse",
        "scenario_type": "black_swan",
        "description": "High-casualty attack on tourist site. Tourism revenue collapse + security state activation.",
        "shock_vector": {"S3_terrorism_risk": 0.60, "A18_revenue_collapse": 0.40, "S3_repression_index": 0.35, "E4_fx_reserves_pressure": 0.25},
        "tags": ["black_swan", "security", "economic"],
        "historical_basis": "TUN_2015_BARDO_SOUSSE"
    },
    {
        "scenario_id": "SCN-B03",
        "scenario_name": "Libya State Collapse Spillover",
        "scenario_type": "black_swan",
        "description": "Western Libya falls to armed faction. Weapons flow + migration surge + border crisis.",
        "shock_vector": {"W_war_intensity": 0.55, "S3_border_incidents": 0.40, "S3_repression_index": 0.25, "P3_foreign_pressure": 0.20, "migration_pressure": 0.45},
        "tags": ["black_swan", "external", "security", "regional"]
    }
]


def make_run_id() -> str:
    now = datetime.now(timezone.utc)
    return f"sim_{now.strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:6]}"


# ---------------------------------------------------------------------------
# Phase labels for outcome distribution
# ---------------------------------------------------------------------------

PHASE_LABELS = ["stable", "elevated", "crisis", "acute_crisis", "transition"]


def _classify_phase(rri: float, p_rev: float) -> str:
    if rri < 1.5 and p_rev < 0.15:
        return "stable"
    elif rri < 2.5 and p_rev < 0.30:
        return "elevated"
    elif rri < 3.5 and p_rev < 0.50:
        return "crisis"
    elif rri < 4.5 or p_rev < 0.75:
        return "acute_crisis"
    return "transition"


def _estimate_rri(variables: Dict[str, float]) -> float:
    if not variables:
        return 0.0
    vals = [v for v in variables.values() if isinstance(v, (int, float))]
    return sum(vals) / len(vals) if vals else 0.0


def _estimate_p_rev(variables: Dict[str, float]) -> float:
    base = 0.3
    uplift = 0.0
    for k, v in variables.items():
        if "protest" in k.lower() or "unrest" in k.lower() or "grievance" in k.lower():
            uplift += v * 0.15
        elif "cohesion" in k.lower() or "stability" in k.lower():
            uplift += (1.0 - v) * 0.12
        elif "pressure" in k.lower() or "stress" in k.lower():
            uplift += v * 0.08
    return min(1.0, max(0.0, base + uplift))


# ---------------------------------------------------------------------------
# Simulation Engine
# ---------------------------------------------------------------------------


class SimulationEngine:

    async def run(
        self,
        scenario_id: Optional[str] = None,
        custom_scenario: Optional[Dict[str, Any]] = None,
        base_state_version_id: Optional[str] = None,
        mc_iterations: int = 1000,
        time_horizon_days: int = 30,
        time_step_days: int = 7,
        noise_sigma: float = 0.05,
        counterfactual_of: Optional[str] = None,
    ) -> Dict[str, Any]:
        run_id = make_run_id()

        scenario = self._resolve_scenario(scenario_id, custom_scenario)
        base_state = await self._load_base_state(base_state_version_id)
        shock_vector = scenario.get("shock_vector", {})

        now_ts = datetime.now(timezone.utc).isoformat()
        run_record: Dict[str, Any] = {
            "run_id": run_id,
            "scenario_name": scenario.get("scenario_name", "Custom"),
            "scenario_description": scenario.get("description", ""),
            "scenario_type": scenario.get("scenario_type", "custom"),
            "base_state_version_id": base_state.get("state_version_id", "unknown"),
            "base_rri": base_state.get("rri", 0.0),
            "base_p_revolution": base_state.get("p_revolution", 0.0),
            "base_state_phase": base_state.get("state_phase", "unknown"),
            "is_historical_fork": False,
            "shock_vector": shock_vector,
            "time_horizon_days": time_horizon_days,
            "time_step_days": time_step_days,
            "mc_iterations": mc_iterations,
            "noise_sigma": noise_sigma,
            "activated_chain_ids": [],
            "outcome_distribution": {},
            "p_revolution_range": {},
            "rri_trajectory": [],
            "governorate_risk_delta": {},
            "elite_fracture_probability": 0.0,
            "military_posture_shift": 0.0,
            "ugtt_strike_probability": 0.0,
            "migration_pressure_delta": 0.0,
            "sensitivity_ranking": [],
            "counterfactual_run_id": counterfactual_of,
            "historical_analogue": None,
            "analogue_similarity": None,
            "deliberation_session_ids": [],
            "status": "running",
            "started_at": now_ts,
            "completed_at": None,
            "duration_ms": 0,
            "error_message": None,
        }

        _runs_store[run_id] = run_record
        await self._persist_run(run_record)

        asyncio.create_task(
            self._execute(run_id, mc_iterations, time_horizon_days, time_step_days, noise_sigma)
        )

        return {"run_id": run_id, "status": "running"}

    # ------------------------------------------------------------------
    # Scenario resolution
    # ------------------------------------------------------------------

    def _resolve_scenario(
        self, scenario_id: Optional[str], custom_scenario: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if scenario_id:
            for s in SCENARIO_LIBRARY:
                if s["scenario_id"] == scenario_id:
                    return s
            for s in _library_store:
                if s.get("scenario_id") == scenario_id:
                    return s
            raise ValueError(f"Scenario not found: {scenario_id}")
        if custom_scenario:
            return custom_scenario
        raise ValueError("Either scenario_id or custom_scenario is required")

    # ------------------------------------------------------------------
    # Base state loading
    # ------------------------------------------------------------------

    async def _load_base_state(self, version_id: Optional[str]) -> Dict[str, Any]:
        if version_id:
            snap = get_snapshot_by_version(version_id)
        else:
            snap = get_latest_snapshot()
        if snap:
            return snap
        return {
            "state_version_id": "unknown",
            "rri": 2.0,
            "p_revolution": 0.35,
            "state_phase": "elevated",
            "variables": {
                "E2_wheat_stress": 0.5, "E4_fx_reserves_pressure": 0.4,
                "P3_imf_pressure": 0.3, "A12_supply_squeeze": 0.4,
                "B1_water_stress": 0.3, "S1_protest_velocity": 0.3,
                "P1_elite_cohesion": 0.6, "S4_ugtt_strike_index": 0.4,
                "S3_terrorism_risk": 0.3, "W_war_intensity": 0.2,
                "narrative_convergence": 0.3, "migration_pressure": 0.3,
                "A18_revenue_collapse": 0.3, "E4_fx_reserves_days": 45.0,
                "E4_parallel_fx_premium": 0.2, "E4_economic_output": 0.5,
                "S3_repression_index": 0.3, "E2_bci": 0.3,
                "P1_mii": 0.3, "P1_cabinet_friction": 0.3,
                "P3_foreign_pressure": 0.3, "S1_rural_grievance": 0.3,
                "S4_phosphate_strike": 0.2, "S3_border_incidents": 0.2,
                "ARM_posture_shift": 0.1, "S1_sir_infected": 0.2,
            }
        }

    # ------------------------------------------------------------------
    # Execute — the async main pipeline
    # ------------------------------------------------------------------

    async def _execute(
        self,
        run_id: str,
        mc_iterations: int,
        time_horizon_days: int,
        time_step_days: int,
        noise_sigma: float,
    ) -> None:
        start_ms = time.monotonic_ns() // 1_000_000
        try:
            run = _runs_store.get(run_id, {})
            base_state = await self._load_base_state(run.get("base_state_version_id"))
            shock_vector = run.get("shock_vector", {})

            shocked_state = self._apply_shock(base_state, shock_vector)
            activated_chains = self._identify_chains(shocked_state)
            run["activated_chain_ids"] = [c["chain_id"] for c in activated_chains]

            iteration_results: List[Dict[str, Any]] = []
            for i in range(mc_iterations):
                result = await self._run_iteration(
                    copy.deepcopy(shocked_state),
                    activated_chains,
                    time_horizon_days,
                    time_step_days,
                    noise_sigma,
                    run_id,
                )
                iteration_results.append(result)
                if i % 10 == 0:
                    await self._store_iteration(run_id, i, result)

            aggregated = self._aggregate_results(iteration_results)
            sensitivity = await self._sensitivity_analysis(
                base_state, shock_vector, time_horizon_days, time_step_days
            )
            analogue = self._match_historical(shocked_state, aggregated)

            run.update(aggregated)
            run["sensitivity_ranking"] = sensitivity
            if analogue:
                run["historical_analogue"] = analogue["event_name"]
                run["analogue_similarity"] = analogue["similarity"]

            elapsed_ms = (time.monotonic_ns() // 1_000_000) - start_ms
            run["status"] = "complete"
            run["completed_at"] = datetime.now(timezone.utc).isoformat()
            run["duration_ms"] = elapsed_ms

            await self._persist_run(run)
            await self._broadcast_complete(run_id, run)

        except Exception as e:
            elapsed_ms = (time.monotonic_ns() // 1_000_000) - start_ms
            run = _runs_store.get(run_id, {})
            run["status"] = "failed"
            run["error_message"] = str(e)
            run["duration_ms"] = elapsed_ms
            await self._persist_run(run)

    # ------------------------------------------------------------------
    # Single Monte Carlo iteration
    # ------------------------------------------------------------------

    async def _run_iteration(
        self,
        initial_state: Dict[str, Any],
        activated_chains: List[Dict[str, Any]],
        time_horizon_days: int,
        time_step_days: int,
        noise_sigma: float,
        run_id: str,
    ) -> Dict[str, Any]:
        state = self._add_gaussian_noise(initial_state, noise_sigma)
        trajectory: List[Dict[str, Any]] = []
        chain_sequence: List[str] = []
        chains = list(activated_chains)
        delib_session_ids: List[str] = []

        for day in range(0, time_horizon_days + 1, time_step_days):
            for chain in chains:
                state = self._propagate_chain_step(chain, state, day)
                cid = chain.get("chain_id", "unknown")
                if cid not in chain_sequence:
                    chain_sequence.append(cid)

            new_chains = self._check_new_activations(state, chains)
            for nc in new_chains:
                cid = nc.get("chain_id", f"auto_{len(chains)}")
                if cid not in chain_sequence:
                    chain_sequence.append(cid)
                chains.append(nc)

            state = self._recompute_rri(state)

            if self._deliberation_warranted(state, day):
                session = await self._run_deliberation(state, day, run_id)
                if session:
                    state = self._apply_deliberation(state, session)
                    sid = session.get("session_id")
                    if sid:
                        delib_session_ids.append(sid)

            trajectory.append({
                "day": day,
                "rri": state.get("rri", 0.0),
                "p_revolution": state.get("p_revolution", 0.0),
                "state_phase": state.get("state_phase", "unknown"),
                "active_chains": [c.get("chain_id", "") for c in chains],
            })

        if delib_session_ids:
            run = _runs_store.get(run_id, {})
            existing = run.get("deliberation_session_ids", [])
            run["deliberation_session_ids"] = list(set(existing + delib_session_ids))

        return {
            "final_rri": state.get("rri", 0.0),
            "final_p_revolution": state.get("p_revolution", 0.0),
            "final_phase": state.get("state_phase", "unknown"),
            "trajectory": trajectory,
            "chain_sequence": chain_sequence,
            "elite_fracture": state.get("P1_elite_cohesion", 1.0) < 0.35,
            "military_shifted": state.get("ARM_posture_shift", 0) < -0.2,
            "ugtt_strike": state.get("S4_ugtt_strike_index", 0) > 0.70,
            "migration_pressure": state.get("migration_pressure", 0),
        }

    # ------------------------------------------------------------------
    # Shock application
    # ------------------------------------------------------------------

    def _apply_shock(self, base_state: Dict[str, Any], shock_vector: Dict[str, Any]) -> Dict[str, Any]:
        state = copy.deepcopy(base_state)
        variables = state.get("variables", {})
        for var_code, delta in shock_vector.items():
            current = variables.get(var_code, 0.5)
            variables[var_code] = max(0.0, min(1.0, current + delta))
        state["variables"] = variables
        if "rri" in state:
            state["rri"] = _estimate_rri(variables)
        if "state_phase" in state:
            state["state_phase"] = _classify_phase(state.get("rri", 0), state.get("p_revolution", 0))
        return state

    # ------------------------------------------------------------------
    # Gaussian noise
    # ------------------------------------------------------------------

    def _add_gaussian_noise(self, state: Dict[str, Any], sigma: float) -> Dict[str, Any]:
        variables = state.get("variables", {})
        for k in variables:
            noise = random.gauss(0, sigma)
            variables[k] = max(0.0, min(1.0, variables[k] + noise))
        state["variables"] = variables
        return state

    # ------------------------------------------------------------------
    # Causal chain helpers
    # ------------------------------------------------------------------

    CHAIN_DEFINITIONS: List[Dict[str, Any]] = [
        {"chain_id": "CHAIN-01", "name": "Food Subsidy → Social Unrest", "trigger_vars": ["E2_wheat_stress", "E2_bci"], "threshold": 0.55, "nodes": [
            {"rri_variable": "S1_protest_velocity", "propagation_weight": 0.4, "time_lag_days": 7},
            {"rri_variable": "S4_ugtt_strike_index", "propagation_weight": 0.3, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-02", "name": "IMF Pressure → Fiscal Crisis", "trigger_vars": ["P3_imf_pressure", "E4_fx_reserves_pressure"], "threshold": 0.50, "nodes": [
            {"rri_variable": "A18_revenue_collapse", "propagation_weight": 0.35, "time_lag_days": 7},
            {"rri_variable": "A12_supply_squeeze", "propagation_weight": 0.25, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-03", "name": "Drought → Agricultural Collapse", "trigger_vars": ["B1_water_stress"], "threshold": 0.50, "nodes": [
            {"rri_variable": "E2_wheat_stress", "propagation_weight": 0.5, "time_lag_days": 7},
            {"rri_variable": "S1_rural_grievance", "propagation_weight": 0.3, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-04", "name": "Protest Amplification → Regime Threat", "trigger_vars": ["S1_protest_velocity", "narrative_convergence"], "threshold": 0.45, "nodes": [
            {"rri_variable": "P1_elite_cohesion", "propagation_weight": -0.3, "time_lag_days": 7},
            {"rri_variable": "P1_mii", "propagation_weight": 0.25, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-05", "name": "UGTT Strike → Economic Disruption", "trigger_vars": ["S4_ugtt_strike_index"], "threshold": 0.50, "nodes": [
            {"rri_variable": "E4_economic_output", "propagation_weight": -0.4, "time_lag_days": 7},
            {"rri_variable": "E4_fx_reserves_pressure", "propagation_weight": 0.25, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-06", "name": "External War → Domestic Instability", "trigger_vars": ["W_war_intensity"], "threshold": 0.40, "nodes": [
            {"rri_variable": "P3_foreign_pressure", "propagation_weight": 0.3, "time_lag_days": 7},
            {"rri_variable": "migration_pressure", "propagation_weight": 0.25, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-07", "name": "Terrorism → Security State", "trigger_vars": ["S3_terrorism_risk"], "threshold": 0.50, "nodes": [
            {"rri_variable": "S3_repression_index", "propagation_weight": 0.4, "time_lag_days": 7},
            {"rri_variable": "A18_revenue_collapse", "propagation_weight": 0.2, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-08", "name": "Elite Fracture → Regime Instability", "trigger_vars": ["P1_elite_cohesion"], "threshold": 0.40, "nodes": [
            {"rri_variable": "P1_mii", "propagation_weight": 0.35, "time_lag_days": 7},
            {"rri_variable": "P1_cabinet_friction", "propagation_weight": 0.3, "time_lag_days": 14},
        ]},
        {"chain_id": "CHAIN-09", "name": "Narrative Convergence → Mobilization", "trigger_vars": ["narrative_convergence"], "threshold": 0.50, "nodes": [
            {"rri_variable": "S1_protest_velocity", "propagation_weight": 0.45, "time_lag_days": 7},
            {"rri_variable": "S1_sir_infected", "propagation_weight": 0.3, "time_lag_days": 14},
        ]},
    ]

    def _identify_chains(self, state: Dict[str, Any]) -> List[Dict[str, Any]]:
        variables = state.get("variables", {})
        activated = []
        for chain in self.CHAIN_DEFINITIONS:
            trigger_values = [variables.get(v, 0) for v in chain["trigger_vars"]]
            if trigger_values and (sum(trigger_values) / len(trigger_values)) >= chain["threshold"]:
                activated.append(copy.deepcopy(chain))
        return activated

    def _propagate_chain_step(self, chain: Dict[str, Any], state: Dict[str, Any], current_day: int) -> Dict[str, Any]:
        variables = state.get("variables", {})
        for node in chain.get("nodes", []):
            if node.get("time_lag_days", 99) <= current_day:
                affected_var = node.get("rri_variable")
                if affected_var and affected_var in variables:
                    delta = node.get("propagation_weight", 0) * 0.15
                    variables[affected_var] = max(0.0, min(1.0, variables[affected_var] + delta))
        state["variables"] = variables
        return state

    def _check_new_activations(self, state: Dict[str, Any], existing: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        existing_ids = {c.get("chain_id") for c in existing}
        all_active = self._identify_chains(state)
        return [c for c in all_active if c.get("chain_id") not in existing_ids]

    def _recompute_rri(self, state: Dict[str, Any]) -> Dict[str, Any]:
        variables = state.get("variables", {})
        rri = _estimate_rri(variables)
        p_rev = _estimate_p_rev(variables)
        state["rri"] = rri
        state["p_revolution"] = p_rev
        state["state_phase"] = _classify_phase(rri, p_rev)
        return state

    def _deliberation_warranted(self, state: Dict[str, Any], day: int) -> bool:
        p_rev = state.get("p_revolution", 0)
        rri = state.get("rri", 0)
        if day > 0 and (day % 14 == 0):
            return True
        if p_rev > 0.50 or rri > 3.0:
            return True
        return False

    async def _run_deliberation(
        self, state: Dict[str, Any], day: int, run_id: str
    ) -> Optional[Dict[str, Any]]:
        try:
            from .deliberation_engine import run_deliberation
            session = await run_deliberation(
                scenario=f"Simulation step day {day} of {run_id}",
                trigger_type="simulation",
                state_version_id=state.get("state_version_id"),
                is_simulation=True,
            )
            return session
        except ImportError:
            return None
        except Exception:
            return None

    def _apply_deliberation(self, state: Dict[str, Any], session: Dict[str, Any]) -> Dict[str, Any]:
        variables = state.get("variables", {})
        resolution = session.get("resolution_type", "deadlock")
        decision = session.get("primary_decision", "")
        decision_deltas = {
            "imf_compliance": {"P3_imf_pressure": -0.15, "E4_fx_reserves_pressure": -0.10},
            "imf_delay": {"P3_imf_pressure": 0.10, "E4_fx_reserves_pressure": 0.15},
            "repression": {"S3_repression_index": 0.20, "S1_protest_velocity": 0.10},
            "concessions": {"S1_protest_velocity": -0.15, "P1_elite_cohesion": 0.10},
            "negotiation": {"S4_ugtt_strike_index": -0.15, "S1_protest_velocity": -0.10},
            "general_strike": {"S4_ugtt_strike_index": 0.25, "S1_protest_velocity": 0.15},
            "international_appeal": {"P3_foreign_pressure": 0.15, "P3_imf_pressure": -0.10},
        }
        deltas = decision_deltas.get(decision, {})
        for var_code, delta in deltas.items():
            if var_code in variables:
                variables[var_code] = max(0.0, min(1.0, variables[var_code] + delta * 0.5))
        state["variables"] = variables
        return state

    # ------------------------------------------------------------------
    # Sensitivity analysis
    # ------------------------------------------------------------------

    async def _sensitivity_analysis(
        self,
        base_state: Dict[str, Any],
        shock_vector: Dict[str, Any],
        time_horizon_days: int,
        time_step_days: int,
        n_samples: int = 100,
    ) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        base_rri = base_state.get("rri", 0.0)
        base_vars = base_state.get("variables", {})

        for var_code, delta in shock_vector.items():
            single_shock = {var_code: delta}
            shocked = self._apply_shock(base_state, single_shock)
            chains = self._identify_chains(shocked)
            outcomes: List[float] = []
            for _ in range(n_samples):
                r = await self._run_iteration(
                    copy.deepcopy(shocked),
                    chains,
                    time_horizon_days,
                    time_step_days,
                    0.03,
                    "sensitivity",
                )
                outcomes.append(r["final_rri"])
            mean_rri = sum(outcomes) / len(outcomes) if outcomes else base_rri
            results.append({
                "variable": var_code,
                "delta_applied": delta,
                "mean_rri_impact": round(mean_rri - base_rri, 4),
                "impact_magnitude": round(abs(mean_rri - base_rri), 4),
            })

        return sorted(results, key=lambda x: -x["impact_magnitude"])

    # ------------------------------------------------------------------
    # Aggregation
    # ------------------------------------------------------------------

    def _aggregate_results(self, iterations: List[Dict[str, Any]]) -> Dict[str, Any]:
        n = len(iterations)
        if n == 0:
            return {}

        phases = [r.get("final_phase", "unknown") for r in iterations]
        phase_counts = Counter(phases)
        outcome_distribution = {
            phase: round(count / n, 4) for phase, count in phase_counts.items()
        }
        for label in PHASE_LABELS:
            outcome_distribution.setdefault(label, 0.0)

        p_revs = sorted([r.get("final_p_revolution", 0) for r in iterations])
        p_revolution_range = {
            "mean": round(sum(p_revs) / n, 4),
            "p10": round(p_revs[max(0, int(n * 0.10))], 4),
            "p50": round(p_revs[int(n * 0.50)], 4),
            "p90": round(p_revs[min(n - 1, int(n * 0.90))], 4),
        }

        max_steps = max(len(r.get("trajectory", [])) for r in iterations)
        rri_trajectory: List[Dict[str, Any]] = []
        for step_idx in range(max_steps):
            step_rris = [
                r["trajectory"][step_idx]["rri"]
                for r in iterations
                if step_idx < len(r.get("trajectory", []))
            ]
            if not step_rris:
                continue
            step_rris_sorted = sorted(step_rris)
            rri_trajectory.append({
                "day": iterations[0]["trajectory"][step_idx]["day"],
                "mean": round(sum(step_rris) / len(step_rris), 4),
                "p10": round(step_rris_sorted[max(0, int(len(step_rris) * 0.10))], 4),
                "p90": round(step_rris_sorted[min(len(step_rris) - 1, int(len(step_rris) * 0.90))], 4),
            })

        elite_fracture_p = sum(1 for r in iterations if r.get("elite_fracture")) / n
        military_shift_p = sum(1 for r in iterations if r.get("military_shifted")) / n
        ugtt_strike_p = sum(1 for r in iterations if r.get("ugtt_strike")) / n
        migration_p = sum(r.get("migration_pressure", 0) for r in iterations) / n

        return {
            "outcome_distribution": outcome_distribution,
            "p_revolution_range": p_revolution_range,
            "rri_trajectory": rri_trajectory,
            "elite_fracture_probability": round(elite_fracture_p, 4),
            "military_posture_shift": round(military_shift_p, 4),
            "ugtt_strike_probability": round(ugtt_strike_p, 4),
            "migration_pressure_delta": round(migration_p, 4),
        }

    # ------------------------------------------------------------------
    # Historical analogue matching
    # ------------------------------------------------------------------

    HISTORICAL_EVENTS = [
        {"event_name": "TUN_2011_REVOLUTION", "variables": {"unemployment": 0.8, "social_unrest": 1.0, "political_stability": 0.1, "food_prices": 0.9}},
        {"event_name": "TUN_2013_GENERAL_STRIKE", "variables": {"social_unrest": 0.8, "political_stability": 0.3, "ugtt_mobilization": 0.9}},
        {"event_name": "TUN_2015_BARDO_SOUSSE", "variables": {"terrorism_risk": 0.9, "tourism_revenue": 0.1, "security_focus": 0.8}},
        {"event_name": "TUN_2021_SELF_COUP", "variables": {"political_stability": 0.4, "institutional_risk": 0.7, "social_unrest": 0.5}},
        {"event_name": "TUN_2023_IMF_NEGOTIATION", "variables": {"imf_pressure": 0.8, "fx_reserves": 0.2, "subsidy_stress": 0.7}},
        {"event_name": "TUN_2008_GAFSA", "variables": {"phosphate_production": 0.1, "regional_unrest": 0.7, "economic_disruption": 0.6}},
    ]

    def _match_historical(
        self, state: Dict[str, Any], aggregated: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        variables = state.get("variables", {})
        p_rev = aggregated.get("p_revolution_range", {}).get("mean", 0.35)
        best_match = None
        best_sim = 0.0
        var_map = {
            "social_unrest": variables.get("S1_protest_velocity", 0),
            "political_stability": 1.0 - variables.get("P1_elite_cohesion", 0.5),
            "terrorism_risk": variables.get("S3_terrorism_risk", 0),
            "imf_pressure": variables.get("P3_imf_pressure", 0),
            "subsidy_stress": variables.get("E2_wheat_stress", 0),
            "ugtt_mobilization": variables.get("S4_ugtt_strike_index", 0),
            "food_prices": variables.get("E2_bci", 0),
            "unemployment": p_rev * 1.5,
            "security_focus": variables.get("S3_repression_index", 0),
            "institutional_risk": variables.get("P1_mii", 0),
            "regional_unrest": variables.get("S1_rural_grievance", 0),
            "economic_disruption": variables.get("A18_revenue_collapse", 0),
            "phosphate_production": 1.0 - variables.get("S4_phosphate_strike", 0),
            "fx_reserves": max(0, variables.get("E4_fx_reserves_days", 45) / 100),
        }
        for event in self.HISTORICAL_EVENTS:
            common = set(var_map.keys()) & set(event["variables"].keys())
            if not common:
                continue
            dist = math.sqrt(sum((var_map[k] - event["variables"][k]) ** 2 for k in common))
            sim = 1.0 / (1.0 + dist)
            if sim > best_sim and sim > 0.50:
                best_sim = sim
                best_match = event
        if best_match:
            return {"event_name": best_match["event_name"], "similarity": round(best_sim, 4)}
        return None

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    async def _persist_run(self, run: Dict[str, Any]) -> None:
        try:
            data = {k: v for k, v in run.items() if v is not None}
            db.table("simulation_runs").upsert(data, on_conflict="run_id").execute()
        except Exception:
            pass

    async def _store_iteration(self, run_id: str, idx: int, result: Dict[str, Any]) -> None:
        try:
            db.table("simulation_iterations").insert({
                "run_id": run_id,
                "iteration_index": idx,
                "final_rri": result.get("final_rri"),
                "final_p_rev": result.get("final_p_revolution"),
                "final_phase": result.get("final_phase"),
                "trajectory": json.dumps(result.get("trajectory", [])),
                "chain_sequence": result.get("chain_sequence", []),
            }).execute()
        except Exception:
            pass

    # ------------------------------------------------------------------
    # WebSocket broadcast
    # ------------------------------------------------------------------

    async def _broadcast_complete(self, run_id: str, run: Dict[str, Any]) -> None:
        payload = {
            "type": "ti:SIMULATION_COMPLETE",
            "payload": {
                "run_id": run_id,
                "scenario_name": run.get("scenario_name"),
                "scenario_type": run.get("scenario_type"),
                "status": run.get("status"),
                "duration_ms": run.get("duration_ms"),
                "outcome_distribution": run.get("outcome_distribution"),
                "p_revolution_range": run.get("p_revolution_range"),
                "elite_fracture_probability": run.get("elite_fracture_probability"),
                "military_posture_shift": run.get("military_posture_shift"),
                "ugtt_strike_probability": run.get("ugtt_strike_probability"),
                "historical_analogue": run.get("historical_analogue"),
                "analogue_similarity": run.get("analogue_similarity"),
            },
        }
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast(payload))
        except RuntimeError:
            pass


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

simulation_engine = SimulationEngine()
