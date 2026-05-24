"""
Intervention Engine — Phase 10.

Answers: "What action reduces collapse probability most efficiently,
at lowest political cost, with highest confidence?"

Architecture:
  run() -> select_interventions -> parallel test_each -> rank -> synthesize -> report
"""

from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from .llm_client import generate as llm_generate
from .state_snapshot import get_latest_snapshot

# ---------------------------------------------------------------------------
# In-memory stores (Supabase fallback)
# ---------------------------------------------------------------------------

_library_store: Dict[str, Dict[str, Any]] = {}
_runs_store: Dict[str, Dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# Intervention library seed data
# ---------------------------------------------------------------------------

INTERVENTION_LIBRARY = [
    # ── ECONOMIC ──────────────────────────────────────────────────────────
    {
        "intervention_id": "INT-E01",
        "intervention_name": "Emergency Bread Subsidy Increase",
        "category": "economic",
        "description": "Temporarily increase bread subsidy allocation by 30%. Requires BCT reserve drawdown or emergency financing.",
        "state_vector": {"E2_wheat_stress": -0.25, "E2_bci": -0.30, "S1_public_anger": -0.20},
        "political_cost": 0.20, "economic_cost": 0.70, "social_cost": 0.05,
        "time_to_effect_days": 3, "duration_days": 90, "reversibility": 0.60,
        "actor_stances": [
            {"entity_id": "UGTT", "stance": "support", "intensity": 0.80},
            {"entity_id": "BCT",  "stance": "oppose",  "intensity": 0.70},
            {"entity_id": "DONOR","stance": "oppose",  "intensity": 0.85},
        ],
        "historical_basis": "TUN_2011_POST_REVOLUTION_SUBSIDY",
        "success_rate": 0.72,
        "requires_imf_approval": False,
        "tags": ["food", "subsidy", "short_term"],
        "status": "active",
    },
    {
        "intervention_id": "INT-E02",
        "intervention_name": "Gulf Emergency Financial Injection",
        "category": "diplomatic",
        "description": "Request emergency budget support from KSA or UAE. Historically $1–3B deposits at BCT.",
        "state_vector": {"E4_fx_reserves_days": 30, "E4_parallel_fx_premium": -0.20, "P3_imf_pressure": -0.15},
        "political_cost": 0.55, "economic_cost": 0.10, "social_cost": 0.15,
        "time_to_effect_days": 7, "duration_days": 180, "reversibility": 0.30,
        "actor_stances": [
            {"entity_id": "BCT",  "stance": "support", "intensity": 0.90},
            {"entity_id": "LPR",  "stance": "oppose",  "intensity": 0.60},
            {"entity_id": "LTDH", "stance": "oppose",  "intensity": 0.70},
        ],
        "historical_basis": "TUN_2013_QATAR_DEPOSITS",
        "success_rate": 0.65,
        "requires_imf_approval": False,
        "tags": ["external", "fx", "gulf", "medium_term"],
        "status": "active",
    },
    {
        "intervention_id": "INT-E03",
        "intervention_name": "Phased Subsidy Reform (24 months)",
        "category": "economic",
        "description": "Gradual subsidy reduction with compensatory cash transfers. IMF-approved. UGTT negotiated timeline.",
        "state_vector": {"P3_imf_pressure": -0.35, "E4_fx_reserves_pressure": -0.20, "S4_ugtt_strike_index": -0.15},
        "political_cost": 0.40, "economic_cost": 0.30, "social_cost": 0.35,
        "time_to_effect_days": 30, "duration_days": 730, "reversibility": 0.20,
        "actor_stances": [
            {"entity_id": "DONOR","stance": "support", "intensity": 0.95},
            {"entity_id": "BCT",  "stance": "support", "intensity": 0.80},
            {"entity_id": "UGTT", "stance": "neutral", "intensity": 0.50},
        ],
        "historical_basis": "TUN_2023_IMF_NEGOTIATION",
        "success_rate": 0.45,
        "requires_imf_approval": True,
        "requires_ugtt_consent": True,
        "tags": ["imf", "subsidy", "long_term", "structural"],
        "status": "active",
    },
    # ── SECURITY ──────────────────────────────────────────────────────────
    {
        "intervention_id": "INT-S01",
        "intervention_name": "Targeted Security Deployment — Interior",
        "category": "security",
        "description": "Deploy security forces to Kasserine, Gafsa, Sidi Bouzid. Suppress protest spread.",
        "state_vector": {"S1_sir_infected": -0.20, "S1_protest_velocity": -0.25, "S3_repression_index": 0.35},
        "political_cost": 0.60, "economic_cost": 0.20, "social_cost": 0.65,
        "time_to_effect_days": 1, "duration_days": 30, "reversibility": 0.80,
        "actor_stances": [
            {"entity_id": "INT",  "stance": "support", "intensity": 0.95},
            {"entity_id": "ARM",  "stance": "neutral",  "intensity": 0.50},
            {"entity_id": "EU",   "stance": "oppose",   "intensity": 0.70},
            {"entity_id": "UGTT", "stance": "oppose",   "intensity": 0.75},
        ],
        "historical_basis": "TUN_2008_GAFSA_CONTAINMENT",
        "success_rate": 0.58,
        "warning": "Activates CHAIN-07 (repression→radicalization feedback). Short-term calm, long-term volatility increase.",
        "tags": ["security", "short_term", "repression", "regional"],
        "status": "active",
    },
    {
        "intervention_id": "INT-S02",
        "intervention_name": "Internet Throttling — Social Media Restriction",
        "category": "informational",
        "description": "Restrict social media bandwidth. Reduces narrative amplification A(t) and protest coordination speed.",
        "state_vector": {"narrative_convergence": -0.25, "A19_information_amplification": -0.30, "S1_sir_transmission_rate": -0.15},
        "political_cost": 0.55, "economic_cost": 0.10, "social_cost": 0.50,
        "time_to_effect_days": 1, "duration_days": 14, "reversibility": 0.95,
        "actor_stances": [
            {"entity_id": "INT",     "stance": "support", "intensity": 0.90},
            {"entity_id": "EU",      "stance": "oppose",  "intensity": 0.85},
            {"entity_id": "LTDH",    "stance": "oppose",  "intensity": 0.95},
            {"entity_id": "USA",     "stance": "oppose",  "intensity": 0.80},
        ],
        "historical_basis": "TUN_2021_SOCIAL_MEDIA_RESTRICTIONS",
        "success_rate": 0.50,
        "warning": "Increases diaspora amplification paradox. International salience rises when domestic is suppressed.",
        "tags": ["informational", "short_term", "digital"],
        "status": "active",
    },
    # ── POLITICAL ─────────────────────────────────────────────────────────
    {
        "intervention_id": "INT-P01",
        "intervention_name": "Cabinet Reshuffle — Technocratic Signal",
        "category": "political",
        "description": "Replace political ministers with technocrats. Signals competence restoration to IMF and markets.",
        "state_vector": {"P1_mii": -0.20, "P1_elite_cohesion": 0.15, "P3_imf_pressure": -0.10},
        "political_cost": 0.35, "economic_cost": 0.05, "social_cost": 0.10,
        "time_to_effect_days": 7, "duration_days": 365, "reversibility": 0.50,
        "actor_stances": [
            {"entity_id": "BCT",  "stance": "support", "intensity": 0.75},
            {"entity_id": "DONOR","stance": "support", "intensity": 0.70},
            {"entity_id": "LPR",  "stance": "neutral", "intensity": 0.40},
        ],
        "historical_basis": "TUN_2023_TECHNOCRATIC_APPOINTMENTS",
        "success_rate": 0.60,
        "tags": ["political", "elite", "medium_term"],
        "status": "active",
    },
    {
        "intervention_id": "INT-P02",
        "intervention_name": "National Dialogue — UGTT Mediation",
        "category": "political",
        "description": "Convene UGTT-mediated national dialogue. Historical precedent: 2013 Quartet model.",
        "state_vector": {"S4_ugtt_strike_index": -0.35, "P1_elite_cohesion": 0.20, "S1_protest_velocity": -0.15, "narrative_convergence": -0.20},
        "political_cost": 0.45, "economic_cost": 0.05, "social_cost": 0.10,
        "time_to_effect_days": 14, "duration_days": 180, "reversibility": 0.40,
        "actor_stances": [
            {"entity_id": "UGTT", "stance": "support", "intensity": 0.85},
            {"entity_id": "LPR",  "stance": "support", "intensity": 0.70},
            {"entity_id": "EU",   "stance": "support", "intensity": 0.80},
            {"entity_id": "PRES", "stance": "neutral", "intensity": 0.40},
        ],
        "historical_basis": "TUN_2013_NATIONAL_DIALOGUE",
        "success_rate": 0.68,
        "requires_ugtt_consent": True,
        "tags": ["political", "dialogue", "medium_term", "ugtt"],
        "status": "active",
    },
    # ── SOCIAL ────────────────────────────────────────────────────────────
    {
        "intervention_id": "INT-V01",
        "intervention_name": "Emergency Water Infrastructure — Interior",
        "category": "social",
        "description": "Fast-track water network repair in Kasserine, Sidi Bouzid, Gafsa. Reduces structural grievance.",
        "state_vector": {"B1_water_stress": -0.25, "S1_rural_grievance": -0.20, "E2_bci": -0.10},
        "political_cost": 0.15, "economic_cost": 0.40, "social_cost": 0.02,
        "time_to_effect_days": 30, "duration_days": 1825,
        "reversibility": 0.05,
        "actor_stances": [
            {"entity_id": "PPL",  "stance": "support", "intensity": 0.90},
            {"entity_id": "UGTT", "stance": "support", "intensity": 0.75},
            {"entity_id": "LPR",  "stance": "support", "intensity": 0.70},
        ],
        "success_rate": 0.80,
        "tags": ["social", "infrastructure", "long_term", "regional"],
        "status": "active",
    },
    # ── DIPLOMATIC ────────────────────────────────────────────────────────
    {
        "intervention_id": "INT-D01",
        "intervention_name": "EU Migration Deal Leverage",
        "category": "diplomatic",
        "description": "Use migration leverage to unlock EU budget support and suspend reform conditionality pressure.",
        "state_vector": {"P3_foreign_pressure": -0.25, "E4_fx_reserves_days": 15, "P3_imf_pressure": -0.10},
        "political_cost": 0.30, "economic_cost": 0.05, "social_cost": 0.20,
        "time_to_effect_days": 14, "duration_days": 365, "reversibility": 0.40,
        "actor_stances": [
            {"entity_id": "EU",   "stance": "conditional", "intensity": 0.70},
            {"entity_id": "LTDH", "stance": "oppose",      "intensity": 0.80},
            {"entity_id": "BCT",  "stance": "support",     "intensity": 0.75},
        ],
        "historical_basis": "TUN_2023_EU_MIGRATION_DEAL",
        "success_rate": 0.62,
        "tags": ["diplomatic", "eu", "migration", "medium_term"],
        "status": "active",
    },
]

# Target outcome → relevant tag categories
TARGET_TAGS: Dict[str, List[str]] = {
    "reduce_unrest":       ["food", "social", "political", "security", "dialogue"],
    "stabilize_fx":        ["economic", "diplomatic", "fx", "gulf"],
    "prevent_strike":      ["political", "ugtt", "economic", "dialogue"],
    "reduce_p_revolution": ["political", "economic", "social", "structural"],
    "reduce_cascade":      ["security", "regional", "social", "infrastructure"],
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _seed_library() -> None:
    """Populate in-memory library once on startup."""
    for item in INTERVENTION_LIBRARY:
        _library_store[item["intervention_id"]] = item


def _compute_efficiency(result: dict) -> float:
    outcome_improvement = max(0.0, -result["p_revolution_delta"])
    total_cost = (
        result["political_cost"] * 0.40
        + result["economic_cost"] * 0.35
        + result["social_cost"] * 0.25
    )
    return round(outcome_improvement / max(total_cost, 0.01), 3)


def _composite_score(r: dict) -> float:
    time_score = 1.0 - min(1.0, r["time_to_effect_days"] / 30.0)
    return (
        r["efficiency_score"] * 0.60
        + r["historical_success_rate"] * 0.20
        + time_score * 0.10
        + r["reversibility"] * 0.10
    )


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class InterventionEngine:

    def __init__(self):
        if not _library_store:
            _seed_library()

    async def run(
        self,
        target_outcome: str,
        investigation_id: Optional[str] = None,
        base_state_version_id: Optional[str] = None,
        time_horizon_days: int = 30,
        intervention_ids: Optional[List[str]] = None,
        top_n: int = 5,
    ) -> Dict[str, Any]:
        run_id = f"int_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:6]}"

        snapshot = await self._load_state(base_state_version_id)
        interventions = self._select_interventions(target_outcome, intervention_ids)

        # Baseline: no intervention
        baseline = self._run_baseline(snapshot, time_horizon_days)

        # Test each intervention
        results = await asyncio.gather(*[
            self._test_intervention(intv, snapshot, time_horizon_days, baseline)
            for intv in interventions
        ])

        ranked = self._rank_by_efficiency(list(results), target_outcome)
        narrative = await self._synthesize_recommendation(
            ranked[:top_n], snapshot, target_outcome, baseline
        )

        run_record = {
            "run_id": run_id,
            "investigation_id": investigation_id,
            "target_outcome": target_outcome,
            "base_state_version_id": snapshot.get("state_version_id", "in-memory"),
            "base_rri": snapshot.get("rri", 0.0),
            "base_p_revolution": snapshot.get("p_revolution", 0.0),
            "time_horizon_days": time_horizon_days,
            "interventions_tested": [i["intervention_id"] for i in interventions],
            "ranked_results": ranked[:top_n],
            "top_recommendation": ranked[0]["intervention_id"] if ranked else None,
            "recommendation_confidence": narrative.get("confidence", 0.65),
            "recommendation_narrative": narrative.get("narrative", ""),
            "baseline_p_revolution": baseline["p_revolution"],
            "baseline_rri": baseline["rri"],
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

        _runs_store[run_id] = run_record

        # Persist to Supabase if available
        try:
            await db.insert("intervention_runs", {
                "run_id": run_id,
                "target_outcome": target_outcome,
                "base_state_version_id": snapshot.get("state_version_id", "in-memory"),
                "base_rri": snapshot.get("rri"),
                "base_p_revolution": snapshot.get("p_revolution"),
                "time_horizon_days": time_horizon_days,
                "interventions_tested": run_record["interventions_tested"],
                "ranked_results": ranked[:top_n],
                "top_recommendation": run_record["top_recommendation"],
                "recommendation_confidence": narrative.get("confidence"),
                "recommendation_narrative": narrative.get("narrative"),
                "baseline_p_revolution": baseline["p_revolution"],
                "baseline_rri": baseline["rri"],
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            pass

        return run_record

    # ------------------------------------------------------------------

    def _select_interventions(
        self,
        target_outcome: str,
        override_ids: Optional[List[str]],
    ) -> List[Dict]:
        if not _library_store:
            _seed_library()

        if override_ids:
            return [_library_store[i] for i in override_ids if i in _library_store]

        target_tags = TARGET_TAGS.get(target_outcome, [])
        return [
            intv for intv in _library_store.values()
            if intv["status"] == "active"
            and any(tag in intv.get("tags", []) for tag in target_tags)
        ]

    async def _load_state(self, state_version_id: Optional[str]) -> Dict[str, Any]:
        try:
            snap = await get_latest_snapshot()
            if snap:
                return snap
        except Exception:
            pass
        return {
            "state_version_id": "fallback",
            "rri": 2.14,
            "p_revolution": 0.34,
            "state_phase": "elevated",
            "compound_stress": 0.38,
            "elite_defection_prob": 0.22,
        }

    def _run_baseline(
        self,
        snapshot: Dict[str, Any],
        time_horizon_days: int,
    ) -> Dict[str, Any]:
        """No-intervention baseline: apply linear drift from current state."""
        rri = snapshot.get("rri", 2.14)
        p_rev = snapshot.get("p_revolution", 0.34)
        drift_factor = 1.0 + (0.02 * time_horizon_days / 30.0)
        return {
            "rri": round(min(rri * drift_factor, 5.0), 4),
            "p_revolution": round(min(p_rev * drift_factor, 1.0), 4),
            "state_phase": snapshot.get("state_phase", "elevated"),
        }

    async def _test_intervention(
        self,
        intervention: Dict[str, Any],
        snapshot: Dict[str, Any],
        time_horizon_days: int,
        baseline: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Fork state, apply vector, estimate outcome deltas."""

        intv_id = intervention["intervention_id"]
        state_vector = intervention.get("state_vector", {})

        # ── Simulate via deliberation engine if available ──────────────
        deliberation_resolution = "compromise"
        veto_actor = None
        try:
            from .deliberation_engine import deliberation_engine as de
            delib = await de.run(
                scenario=f"Proposed intervention: {intervention['intervention_name']}",
                trigger_type="intervention",
                is_simulation=True,
            )
            deliberation_resolution = delib.get("resolution_type", "compromise")
            veto_actor = delib.get("veto_actor")
        except Exception:
            pass

        # ── Apply state vector to estimate p_revolution delta ──────────
        # Each variable in state_vector contributes ~0.08 × delta to p_rev
        p_rev_delta = 0.0
        for key, delta in state_vector.items():
            weight = 0.08 if "stress" in key or "anger" in key or "velocity" in key else 0.05
            p_rev_delta += delta * weight

        # Scale by simulation horizon
        horizon_scale = time_horizon_days / 30.0
        p_rev_delta = round(p_rev_delta * horizon_scale, 4)

        rri_base = snapshot.get("rri", 2.14)
        rri_delta = round(p_rev_delta * 1.8, 4)

        # ── Actor stances ──────────────────────────────────────────────
        actor_stances = intervention.get("actor_stances", [])
        actor_opposition = [
            s["entity_id"] for s in actor_stances
            if s["stance"] == "oppose" and s.get("intensity", 0) > 0.60
        ]
        actor_support = [
            s["entity_id"] for s in actor_stances
            if s["stance"] == "support" and s.get("intensity", 0) > 0.60
        ]

        # ── Veto risk ──────────────────────────────────────────────────
        veto_risk = False
        if intervention.get("requires_ugtt_consent"):
            ugtt_stance = next(
                (s for s in actor_stances if s["entity_id"] == "UGTT"), {}
            )
            if ugtt_stance.get("stance") == "oppose":
                veto_risk = True
                veto_actor = veto_actor or "UGTT"

        # ── Efficiency ────────────────────────────────────────────────
        result = {
            "intervention_id": intv_id,
            "intervention_name": intervention["intervention_name"],
            "category": intervention["category"],
            "p_revolution_delta": p_rev_delta,
            "rri_delta": rri_delta,
            "political_cost": intervention.get("political_cost", 0.5),
            "economic_cost": intervention.get("economic_cost", 0.5),
            "social_cost": intervention.get("social_cost", 0.5),
            "time_to_effect_days": intervention.get("time_to_effect_days", 14),
            "duration_days": intervention.get("duration_days", 90),
            "reversibility": intervention.get("reversibility", 0.5),
            "actor_opposition": actor_opposition,
            "actor_support": actor_support,
            "deliberation_resolution": deliberation_resolution,
            "veto_risk": veto_risk,
            "veto_actor": veto_actor,
            "historical_success_rate": intervention.get("success_rate", 0.50),
            "requires_imf_approval": intervention.get("requires_imf_approval", False),
            "requires_ugtt_consent": intervention.get("requires_ugtt_consent", False),
            "warning": intervention.get("warning"),
            "tags": intervention.get("tags", []),
            "historical_basis": intervention.get("historical_basis"),
            "confidence": round(
                min(0.90, intervention.get("success_rate", 0.50) + 0.18), 3
            ),
        }
        result["efficiency_score"] = _compute_efficiency(result)
        return result

    def _rank_by_efficiency(
        self,
        results: List[Dict],
        target_outcome: str,
    ) -> List[Dict]:
        ranked = sorted(results, key=_composite_score, reverse=True)
        for i, r in enumerate(ranked):
            r["rank"] = i + 1
        return ranked

    async def _synthesize_recommendation(
        self,
        top_interventions: List[Dict],
        snapshot: Dict[str, Any],
        target_outcome: str,
        baseline: Dict[str, Any],
    ) -> Dict[str, Any]:
        if not top_interventions:
            return {"narrative": "Insufficient data to generate recommendation.", "confidence": 0.40}

        top = top_interventions[0]

        prompt_system = f"""You are a senior strategic analyst for Tunisia. Generate a concise intervention recommendation.

TARGET OUTCOME: {target_outcome}
CURRENT STATE: RRI {snapshot.get('rri', 'N/A')}, P(rev) {snapshot.get('p_revolution', 'N/A')}
BASELINE (no intervention): P(rev) would reach {baseline['p_revolution']:.3f}

TOP RANKED INTERVENTION: {top['intervention_name']} (rank 1)
  - P(rev) delta: {top['p_revolution_delta']:+.3f}
  - Efficiency: {top['efficiency_score']:.2f}
  - Political cost: {top['political_cost']:.2f}
  - Historical success: {top['historical_success_rate']:.0%}
  - Actor support: {top['actor_support']}
  - Actor opposition: {top['actor_opposition']}
  - Veto risk: {top['veto_risk']}
  {'- WARNING: ' + top['warning'] if top.get('warning') else ''}

BACKUP OPTION: {top_interventions[1]['intervention_name'] if len(top_interventions) > 1 else 'None'}

Generate a JSON response:
{{
  "narrative": "3-4 sentences: top recommendation, key tradeoff, timing, risk caveat",
  "primary_recommendation": "{top['intervention_id']}",
  "backup_recommendation": "{top_interventions[1]['intervention_id'] if len(top_interventions) > 1 else 'none'}",
  "key_tradeoff": "one sentence on main cost",
  "timing_note": "when to implement for maximum effect",
  "confidence": 0.0-1.0
}}
Output valid JSON only."""

        try:
            raw = await llm_generate(
                prompt=f"Strategic intervention recommendation for: {target_outcome}",
                system=prompt_system,
                response_format="json",
            )
            parsed = json.loads(raw) if isinstance(raw, str) else raw
            return parsed
        except Exception:
            return {
                "narrative": (
                    f"Based on current state (RRI {snapshot.get('rri', 'N/A')}, "
                    f"P(rev) {snapshot.get('p_revolution', 'N/A'):.1%}), "
                    f"the recommended intervention is '{top['intervention_name']}' "
                    f"(efficiency {top['efficiency_score']:.2f}, "
                    f"historical success {top['historical_success_rate']:.0%}). "
                    f"Key tradeoff: political cost {top['political_cost']:.2f}. "
                    f"Expected P(rev) delta: {top['p_revolution_delta']:+.2%}."
                ),
                "primary_recommendation": top["intervention_id"],
                "confidence": top.get("confidence", 0.60),
            }

    # ------------------------------------------------------------------
    # Library accessors

    def get_library(self) -> List[Dict]:
        if not _library_store:
            _seed_library()
        return list(_library_store.values())

    def get_intervention(self, intervention_id: str) -> Optional[Dict]:
        if not _library_store:
            _seed_library()
        return _library_store.get(intervention_id)

    def get_run(self, run_id: str) -> Optional[Dict]:
        return _runs_store.get(run_id)

    def get_latest_run(self) -> Optional[Dict]:
        if not _runs_store:
            return None
        latest = max(_runs_store.values(), key=lambda r: r.get("created_at", ""))
        return latest


intervention_engine = InterventionEngine()
