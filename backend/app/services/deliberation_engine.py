import logging
"""
Deliberation Engine — High Table MVP.

When a crisis signal fires or an analyst injects a scenario, the engine:
1. Reads the current state snapshot
2. Activates relevant actors
3. Each actor generates a position from its profile + live signals + doctrine
4. Positions are submitted to a deliberation table
5. Conflicts detected, coalitions formed, authority weights applied
6. Output: a decision probability distribution with full reasoning trace
"""

from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from ..api.ws import manager
from ..actors.seed_profiles import PROFILES
from .actor_engine import (
    get_actor_posture,
    ACTOR_DOCTRINE_WORKSPACES,
)
from .doctrine_client import search_doctrine
logger = logging.getLogger(__name__)
from .llm_client import generate as llm_generate, embed
from .rag_synthesis import _search_embeddings
from .state_snapshot import get_latest_snapshot, get_snapshot_by_version

# ── In-memory session store ─────────────────────────────────────

_sessions_store: List[Dict[str, Any]] = []


def set_sessions(sessions: List[Dict[str, Any]]) -> None:
    _sessions_store.clear()
    _sessions_store.extend(sessions)


def get_sessions() -> List[Dict[str, Any]]:
    return list(_sessions_store)


def make_session_id() -> str:
    now = datetime.now(timezone.utc)
    return f"del_{now.strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:6]}"


OPPOSITION_MAP: Dict[str, str] = {
    "repression": "concessions",
    "concessions": "repression",
    "general_strike": "negotiation",
    "negotiation": "general_strike",
    "imf_delay": "imf_compliance",
    "crackdown": "international_appeal",
}


class DeliberationEngine:

    async def run(
        self,
        scenario: str,
        trigger_type: str,
        trigger_source: str = None,
        state_version_id: str = None,
        actor_ids: list[str] = None,
        is_simulation: bool = False,
    ) -> Dict[str, Any]:
        started_at = datetime.now(timezone.utc)

        snapshot = await self._load_state(state_version_id)
        actors = await self._select_actors(scenario, snapshot, actor_ids)
        positions = await asyncio.gather(*[
            self._generate_position(actor, scenario, snapshot)
            for actor in actors
        ])
        result = await self._deliberate(positions, snapshot, scenario)

        completed_at = datetime.now(timezone.utc)
        duration_ms = int((completed_at - started_at).total_seconds() * 1000)

        session = self._build_session(
            result, positions, snapshot, scenario,
            trigger_type, trigger_source, is_simulation,
            started_at, completed_at, duration_ms,
        )

        await self._store_session(session, positions)
        await self._broadcast(session)

        return session

    async def _load_state(
        self, state_version_id: str = None
    ) -> Dict[str, Any]:
        if state_version_id:
            snapshot = get_snapshot_by_version(state_version_id)
            if snapshot:
                return snapshot
        snapshot = get_latest_snapshot()
        if snapshot:
            return snapshot
        return {
            "rri": 2.31,
            "p_revolution": 0.643,
            "velocity": 0.18,
            "compound_stress": 0.45,
            "cascade_probability": 0.58,
            "salience": 0.412,
            "elite_cohesion": 0.65,
            "mii": 0.35,
            "structural_econ": 0.55,
            "state_version_id": "v_fallback",
            "active_chains": [],
        }

    async def _load_profile(self, entity_id: str) -> Optional[Dict[str, Any]]:
        try:
            res = db.table("actor_profiles").select("*").eq("entity_id", entity_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.warning("Suppressed exception in services/deliberation_engine.py: %s", e)
        return next((p for p in PROFILES if p["entity_id"] == entity_id), None)

    async def _load_all_profiles(self) -> List[Dict[str, Any]]:
        profiles = []
        for p in PROFILES:
            profile = await self._load_profile(p["entity_id"])
            if profile:
                profiles.append(profile)
        return profiles

    def _classify_crisis(self, snapshot: Dict[str, Any]) -> str:
        rri = snapshot.get("rri", 0)
        compound = snapshot.get("compound_stress", 0)
        p_rev = snapshot.get("p_revolution", 0)

        reserves = snapshot.get("rri", 90)
        if isinstance(reserves, dict):
            reserves = reserves.get("fx_reserves_days", 90)

        if compound > 0.75:
            return "labor_crisis"
        if p_rev > 0.50:
            return "legitimacy_crisis"
        if rri > 2.5:
            return "security_crisis"
        return "economic_crisis"

    async def _select_actors(
        self,
        scenario: str,
        snapshot: Dict[str, Any],
        override_ids: list[str] = None,
    ) -> List[Dict[str, Any]]:
        if override_ids:
            profiles = []
            for eid in override_ids:
                p = await self._load_profile(eid)
                if p:
                    profiles.append(p)
            return profiles

        crisis_type = self._classify_crisis(snapshot)
        all_profiles = await self._load_all_profiles()

        scored = [
            (p, p.get("authority_weights", {}).get(crisis_type, 0.30))
            for p in all_profiles
        ]

        core = {"PRES", "ARM", "UGTT", "BCT"}
        selected = [p for p, s in scored if p["entity_id"] in core]
        selected += [
            p for p, s in sorted(scored, key=lambda x: -x[1])
            if p["entity_id"] not in core and s > 0.50
        ]

        return selected[:8]

    async def _generate_position(
        self,
        actor: Dict[str, Any],
        scenario: str,
        snapshot: Dict[str, Any],
    ) -> Dict[str, Any]:
        posture = await get_actor_posture(actor["entity_id"], snapshot)
        adjusted = posture.get("adjusted_probability_matrix", {})
        if not adjusted:
            adjusted = actor.get("output_probability_matrix", {})

        recommendation = max(adjusted, key=adjusted.get) if adjusted else "neutrality"
        confidence = adjusted.get(recommendation, 0.5)

        live_chunks = []
        try:
            query_embedding = await embed(f"{scenario} {actor.get('actor_name', '')}")
            live_chunks = await _search_embeddings(
                query_embedding, source="all", limit=3
            )
        except Exception as e:
            logger.warning("Suppressed exception in services/deliberation_engine.py: %s", e)

        doctrine_chunks = []
        try:
            workspaces = ACTOR_DOCTRINE_WORKSPACES.get(actor["entity_id"], [])
            if workspaces:
                doctrine_chunks = await search_doctrine(
                    query=scenario,
                    workspace=workspaces[0],
                    limit=2,
                )
        except Exception as e:
            logger.warning("Suppressed exception in services/deliberation_engine.py: %s", e)

        reasoning = await self._generate_reasoning(
            actor, scenario, snapshot,
            recommendation, confidence,
            live_chunks, doctrine_chunks,
        )

        return {
            "entity_id": actor["entity_id"],
            "actor_name": actor.get("actor_name", actor["entity_id"]),
            "recommendation": recommendation,
            "recommendation_confidence": round(confidence, 3),
            "reasoning_chain": reasoning.get("prose", ""),
            "supporting_actions": reasoning.get("supporting_actions", []),
            "live_citations": live_chunks[:3],
            "doctrine_citations": doctrine_chunks[:2],
            "adjusted_probabilities": adjusted,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _generate_reasoning(
        self,
        actor: Dict[str, Any],
        scenario: str,
        snapshot: Dict[str, Any],
        recommendation: str,
        confidence: float,
        live_chunks: list,
        doctrine_chunks: list,
    ) -> Dict[str, Any]:
        active_fears = actor.get("fears", [])
        active_fear_text = "; ".join(
            f"{f.get('fear','?')} (threshold {f.get('threshold',0.5)})"
            for f in active_fears[:3]
        )

        live_text = "\n".join(
            f"  [{c.get('source_document', '?')}] {c.get('chunk_text', '')[:200]}"
            for c in live_chunks
        ) if live_chunks else "  (no live fragments)"

        doctrine_text = "\n".join(
            f"  [{c.get('source_document', '?')}] {c.get('chunk_text', '')[:200]}"
            for c in doctrine_chunks
        ) if doctrine_chunks else "  (no doctrine fragments)"

        system_prompt = f"""You are modeling the reasoning of: {actor.get('actor_name', actor['entity_id'])}
Doctrine: {actor.get('doctrine', 'unknown')}
Decision style: {actor.get('decision_style', 'unknown')}
Risk tolerance: {actor.get('risk_tolerance', 0.5)}
Primary objectives: {[o.get('goal','') for o in actor.get('objectives',[])[:3]]}
Current fears active: {active_fear_text}

SCENARIO: {scenario}

CURRENT STATE:
RRI: {snapshot.get('rri', 0)} | P(Revolution): {snapshot.get('p_revolution', 0)}
State phase: {snapshot.get('state_phase', 'unknown')}
Active chains: {snapshot.get('active_chains', [])}

LIVE INTELLIGENCE ({len(live_chunks)} fragments):
{live_text}

DOCTRINE CONTEXT ({len(doctrine_chunks)} fragments):
{doctrine_text}

Generate this actor's position as structured JSON:
{{
  "prose": "2-3 sentence reasoning chain from THIS actor's perspective",
  "supporting_actions": ["secondary action 1", "secondary action 2"],
  "key_fear_driving_position": "which fear is dominant",
  "doctrine_framework_applied": "which framework from doctrine chunks",
  "confidence_rationale": "why this confidence level"
}}

RULES:
- Reason from THIS actor's objectives and fears only
- Do not recommend actions outside this actor's preferred_tools
- Every factual claim must reference a provided chunk
- Output valid JSON only"""

        try:
            response = await llm_generate(
                prompt=f"Generate position for scenario: {scenario}",
                system=system_prompt,
                response_format="json",
            )
            parsed = json.loads(response)
            return {
                "prose": parsed.get("prose", f"{actor.get('actor_name', '')} recommends {recommendation} with confidence {confidence}."),
                "supporting_actions": parsed.get("supporting_actions", []),
                "key_fear_driving_position": parsed.get("key_fear_driving_position", ""),
                "doctrine_framework_applied": parsed.get("doctrine_framework_applied", ""),
                "confidence_rationale": parsed.get("confidence_rationale", ""),
            }
        except Exception as e:
            logger.warning("Caught exception in services/deliberation_engine.py: %s", e)
            return {
                "prose": f"{actor.get('actor_name', '')} recommends {recommendation} at {confidence:.0%} confidence based on current state assessment.",
                "supporting_actions": [],
            }

    async def _deliberate(
        self,
        positions: List[Dict[str, Any]],
        snapshot: Dict[str, Any],
        scenario: str,
    ) -> Dict[str, Any]:
        conflict_map = self._detect_conflicts(positions)
        coalition_map = self._form_coalitions(positions, conflict_map)
        veto_result = self._check_vetoes(positions, snapshot)

        if veto_result["veto_active"]:
            return self._resolve_veto(veto_result, positions, coalition_map)

        crisis_type = self._classify_crisis(snapshot)
        weighted = self._apply_authority_weights(
            positions, coalition_map, crisis_type
        )

        return self._resolve(weighted, coalition_map, conflict_map, positions)

    def _detect_conflicts(self, positions: List[Dict[str, Any]]) -> Dict[str, Any]:
        conflicts = {}
        for i, p1 in enumerate(positions):
            for j, p2 in enumerate(positions[i+1:], i+1):
                opposite = OPPOSITION_MAP.get(p1.get("recommendation", ""))
                if opposite and p2.get("recommendation") == opposite:
                    key = f"{p1['entity_id']}_vs_{p2['entity_id']}"
                    conflicts[key] = {
                        "actor_a": p1["entity_id"],
                        "actor_b": p2["entity_id"],
                        "conflict_type": f"{p1['recommendation']}_vs_{p2['recommendation']}",
                        "severity": round(
                            (p1.get("recommendation_confidence", 0.5) +
                             p2.get("recommendation_confidence", 0.5)) / 2, 3
                        ),
                    }
        return conflicts

    def _form_coalitions(
        self,
        positions: List[Dict[str, Any]],
        conflict_map: Dict[str, Any],
    ) -> Dict[str, Any]:
        coalitions = {}
        for p in positions:
            rec = p.get("recommendation", "neutrality")
            if rec not in coalitions:
                coalitions[rec] = {
                    "recommendation": rec,
                    "actors": [],
                    "total_confidence": 0.0,
                }
            coalitions[rec]["actors"].append(p["entity_id"])
            coalitions[rec]["total_confidence"] += p.get("recommendation_confidence", 0.5)
        return coalitions

    def _check_vetoes(
        self,
        positions: List[Dict[str, Any]],
        snapshot: Dict[str, Any],
    ) -> Dict[str, Any]:
        compound = snapshot.get("compound_stress", 0)
        snapshot_rri = snapshot.get("rri", 0)

        for p in positions:
            profile = None
            try:
                profile = next(
                    (prof for prof in PROFILES if prof["entity_id"] == p["entity_id"]),
                    None,
                )
            except Exception as e:
                logger.warning("Suppressed exception in services/deliberation_engine.py: %s", e)

            if not profile:
                continue

            for veto in profile.get("veto_conditions", []):
                condition = veto.get("condition", "")
                blocks = veto.get("blocks", "")

                ugtt_strike_active = "ugtt_strike_index" in condition and compound > 0.75
                civilian_casualty_active = "civilian_casualty_order" in condition

                if ugtt_strike_active or civilian_casualty_active:
                    return {
                        "veto_active": True,
                        "vetoing_actor": p["entity_id"],
                        "blocked_action": blocks,
                        "veto_condition": condition,
                        "veto_history": veto.get("historical_basis", ""),
                    }

        return {"veto_active": False}

    def _resolve_veto(
        self,
        veto_result: Dict[str, Any],
        positions: List[Dict[str, Any]],
        coalition_map: Dict[str, Any],
    ) -> Dict[str, Any]:
        blocking_actor = veto_result["vetoing_actor"]
        blocked = veto_result["blocked_action"]
        remaining = [p for p in positions if p["entity_id"] != blocking_actor]
        if not remaining:
            return {
                "resolution_type": "deadlock",
                "decision_output": {
                    "primary_action": f"blocked_by_{blocking_actor}",
                    "primary_confidence": 0.0,
                    "full_distribution": {},
                },
                "dominant_coalition": [],
                "dissenting_actors": [p["entity_id"] for p in positions],
                "conflict_map": {},
                "coalition_map": coalition_map,
                "confidence": 0.0,
                "veto_active": True,
                "veto_actor": blocking_actor,
                "veto_condition": veto_result.get("veto_condition", ""),
            }

        coalition_map = self._form_coalitions(remaining, {})
        crisis_type = "economic_crisis"
        weighted = self._apply_authority_weights(remaining, coalition_map, crisis_type)
        result = self._resolve(weighted, coalition_map, {}, remaining)
        result["veto_active"] = True
        result["veto_actor"] = blocking_actor
        result["veto_condition"] = veto_result.get("veto_condition", "")
        return result

    def _apply_authority_weights(
        self,
        positions: List[Dict[str, Any]],
        coalition_map: Dict[str, Any],
        crisis_type: str,
    ) -> Dict[str, Any]:
        weighted = {}
        for rec, coalition in coalition_map.items():
            authority_sum = 0.0
            for actor_id in coalition["actors"]:
                profile = next(
                    (p for p in PROFILES if p["entity_id"] == actor_id),
                    None,
                )
                if profile:
                    authority_sum += profile.get("authority_weights", {}).get(crisis_type, 0.30)
                else:
                    authority_sum += 0.30
            weighted[rec] = {
                **coalition,
                "authority_weight": round(authority_sum, 3),
            }
        return weighted

    def _resolve(
        self,
        weighted: Dict[str, Any],
        coalition_map: Dict[str, Any],
        conflict_map: Dict[str, Any],
        positions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        sorted_coalitions = sorted(
            weighted.values(),
            key=lambda x: x.get("authority_weight", 0),
            reverse=True,
        )

        top = sorted_coalitions[0]
        second = sorted_coalitions[1] if len(sorted_coalitions) > 1 else None

        if top["authority_weight"] > 0.65:
            resolution_type = "consensus"
        elif second and (top["authority_weight"] - second["authority_weight"]) < 0.15:
            resolution_type = "compromise"
        elif top["authority_weight"] < 0.40:
            resolution_type = "deadlock"
        else:
            resolution_type = "consensus"

        dominant_coalition = top["actors"]
        dissenting = [
            p["entity_id"] for p in positions
            if p["entity_id"] not in dominant_coalition
        ]

        return {
            "resolution_type": resolution_type,
            "decision_output": {
                "primary_action": top["recommendation"],
                "primary_confidence": top.get("authority_weight", 0),
                "secondary_action": second["recommendation"] if second else None,
                "secondary_confidence": second.get("authority_weight", 0) if second else None,
                "full_distribution": {
                    c["recommendation"]: c.get("authority_weight", 0)
                    for c in sorted_coalitions
                },
            },
            "dominant_coalition": dominant_coalition,
            "dissenting_actors": dissenting,
            "conflict_map": conflict_map,
            "coalition_map": coalition_map,
            "confidence": round(top.get("authority_weight", 0), 3),
        }

    def _build_session(
        self,
        result: Dict[str, Any],
        positions: List[Dict[str, Any]],
        snapshot: Dict[str, Any],
        scenario: str,
        trigger_type: str,
        trigger_source: Optional[str],
        is_simulation: bool,
        started_at: datetime,
        completed_at: datetime,
        duration_ms: int,
    ) -> Dict[str, Any]:
        session_id = make_session_id()
        return {
            "session_id": session_id,
            "trigger_type": trigger_type,
            "trigger_source": trigger_source,
            "scenario_description": scenario,
            "state_version_id": snapshot.get("state_version_id", "v_fallback"),
            "is_simulation": is_simulation,
            "actor_ids": [p["entity_id"] for p in positions],
            "resolution_type": result.get("resolution_type"),
            "decision_output": result.get("decision_output"),
            "confidence": result.get("confidence"),
            "dominant_coalition": result.get("dominant_coalition", []),
            "dissenting_actors": result.get("dissenting_actors", []),
            "positions": positions,
            "deliberation_trace": positions,
            "conflict_map": result.get("conflict_map", {}),
            "coalition_map": result.get("coalition_map", {}),
            "started_at": started_at.isoformat(),
            "completed_at": completed_at.isoformat(),
            "duration_ms": duration_ms,
            "veto_active": result.get("veto_active", False),
            "veto_actor": result.get("veto_actor"),
            "veto_condition": result.get("veto_condition"),
        }

    async def _store_session(
        self,
        session: Dict[str, Any],
        positions: List[Dict[str, Any]],
    ) -> None:
        _sessions_store.append(session)
        if len(_sessions_store) > 50:
            _sessions_store[:] = _sessions_store[-50:]

        try:
            session_row = {
                "session_id": session["session_id"],
                "trigger_type": session["trigger_type"],
                "trigger_source": session.get("trigger_source"),
                "scenario_description": session["scenario_description"],
                "state_version_id": session["state_version_id"],
                "is_simulation": session.get("is_simulation", False),
                "actor_ids": session["actor_ids"],
                "resolution_type": session.get("resolution_type"),
                "decision_output": json.dumps(session.get("decision_output", {})),
                "confidence": session.get("confidence"),
                "dominant_coalition": session.get("dominant_coalition", []),
                "dissenting_actors": session.get("dissenting_actors", []),
                "deliberation_trace": json.dumps(session.get("deliberation_trace", [])),
                "conflict_map": json.dumps(session.get("conflict_map", {})),
                "coalition_map": json.dumps(session.get("coalition_map", {})),
                "started_at": session.get("started_at"),
                "completed_at": session.get("completed_at"),
                "duration_ms": session.get("duration_ms"),
            }
            res = db.table("deliberation_sessions").insert(session_row).execute()
            created = res.data[0] if res.data else None

            if created:
                for pos in positions:
                    pos_row = {
                        "session_id": created["id"],
                        "entity_id": pos["entity_id"],
                        "actor_name": pos["actor_name"],
                        "recommendation": pos["recommendation"],
                        "recommendation_confidence": pos.get("recommendation_confidence"),
                        "reasoning_chain": pos.get("reasoning_chain", ""),
                        "supporting_actions": json.dumps(pos.get("supporting_actions", [])),
                        "live_citations": json.dumps(pos.get("live_citations", [])),
                        "doctrine_citations": json.dumps(pos.get("doctrine_citations", [])),
                        "adjusted_probabilities": json.dumps(pos.get("adjusted_probabilities", {})),
                        "conflicts_with": pos.get("conflicts_with", []),
                        "aligns_with": pos.get("aligns_with", []),
                    }
                    db.table("deliberation_positions").insert(pos_row).execute()
        except Exception as e:
            print(f"[deliberation_engine] DB store failed (in-memory only): {e}")

    async def _broadcast(self, session: Dict[str, Any]) -> None:
        payload = {
            "type": "DELIBERATION_COMPLETE",
            "payload": {
                "session_id": session["session_id"],
                "scenario": session["scenario_description"],
                "resolution_type": session.get("resolution_type"),
                "confidence": session.get("confidence"),
                "dominant_coalition": session.get("dominant_coalition", []),
                "dissenting_actors": session.get("dissenting_actors", []),
                "veto_active": session.get("veto_active", False),
                "veto_actor": session.get("veto_actor"),
                "actor_count": len(session.get("positions", [])),
                "duration_ms": session.get("duration_ms"),
                "completed_at": session.get("completed_at"),
            },
        }
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast(payload))
        except RuntimeError:
            pass


deliberation_engine = DeliberationEngine()
