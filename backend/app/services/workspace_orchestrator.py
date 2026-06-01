"""
Cognitive Workspace Orchestrator — Phase 9.

Routes natural language queries across all Phase 1-8 engines,
synthesizes intelligence responses, and parameterizes canvas blocks.

Architecture:
  process_query() -> Intent Routing -> Capability Selection ->
  Parallel Execution -> LLM Synthesis -> Block Parameterization ->
  Persistence -> Envelope Response
"""

from __future__ import annotations

import asyncio
import json
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..core.database import db
from ..api.ws import manager
from .llm_client import generate
from .state_snapshot import get_latest_snapshot

# ---------------------------------------------------------------------------
# In-memory stores
# ---------------------------------------------------------------------------

_investigations_store: Dict[str, Dict[str, Any]] = {}
_messages_store: Dict[str, List[Dict[str, Any]]] = {}

BLOCK_REGISTRY_SEED = [
    {"block_id": "rri-gauge", "version": "2.1.0", "category": "risk",
     "display_name": "Revolution Risk Index",
     "required_engines": ["canonical_state"], "confidence_metric": True,
     "exportable": True, "drill_down": True},
    {"block_id": "governorate-heatmap", "version": "1.0.0", "category": "risk",
     "display_name": "Governorate Risk Map",
     "required_engines": ["canonical_state"], "confidence_metric": False,
     "exportable": True, "drill_down": True},
    {"block_id": "monte-carlo-futures", "version": "1.0.0", "category": "simulation",
     "display_name": "Monte Carlo Scenario",
     "required_engines": ["simulation"], "confidence_metric": True,
     "exportable": True, "drill_down": False},
    {"block_id": "actor-timeline", "version": "1.0.0", "category": "network",
     "display_name": "Actor Event Timeline",
     "required_engines": ["rag", "actor_posture"], "confidence_metric": False,
     "exportable": True, "drill_down": True},
    {"block_id": "elite-network", "version": "1.0.0", "category": "network",
     "display_name": "Elite Cohesion Network",
     "required_engines": ["actor_posture", "canonical_state"], "confidence_metric": True,
     "exportable": True, "drill_down": True},
    {"block_id": "economic-stress", "version": "1.0.0", "category": "economic",
     "display_name": "Economic Stress Indicators",
     "required_engines": ["canonical_state"], "confidence_metric": True,
     "exportable": True, "drill_down": False},
    {"block_id": "narrative-warfare", "version": "1.0.0", "category": "social",
     "display_name": "Narrative Warfare Engine",
     "required_engines": ["rag"], "confidence_metric": True,
     "exportable": True, "drill_down": False},
    {"block_id": "comparative-historical", "version": "1.0.0", "category": "temporal",
     "display_name": "Historical Comparison",
     "required_engines": ["rag", "doctrine"], "confidence_metric": True,
     "exportable": True, "drill_down": False},
    {"block_id": "protest-sir", "version": "1.0.0", "category": "social",
     "display_name": "Protest Spread (SIR)",
     "required_engines": ["canonical_state"], "confidence_metric": True,
     "exportable": False, "drill_down": False},
    {"block_id": "confidence-meter", "version": "1.0.0", "category": "risk",
     "display_name": "Uncertainty Budget",
     "required_engines": ["canonical_state", "rag"], "confidence_metric": True,
     "exportable": True, "drill_down": False},
    {"block_id": "water-stress", "version": "1.0.0", "category": "economic",
     "display_name": "Water Scarcity Index",
     "required_engines": ["canonical_state"], "confidence_metric": False,
     "exportable": True, "drill_down": False},
    {"block_id": "migration-flow", "version": "1.0.0", "category": "social",
     "display_name": "Migration Pressure",
     "required_engines": ["canonical_state"], "confidence_metric": False,
     "exportable": True, "drill_down": False},
    {"block_id": "intervention-ranker", "version": "1.0.0", "category": "decision",
     "display_name": "Intervention Efficiency Ranker",
     "required_engines": ["intervention"], "confidence_metric": True,
     "exportable": True, "drill_down": True},
]

INTENT_RULES = [
    (["what should we do", "how to reduce", "best action", "what can be done", "recommend", "intervention", "policy option", "what action"], "intervention"),
    (["what if", "what happens", "simulate", "scenario", "inject", "shock", "general strike"], "simulation"),
    (["compare", " vs ", "versus", "like egypt", "like 2011", "similar to", "compared to"], "comparative"),
    (["watch", "monitor", "alert me", "notify", "track"], "monitoring"),
    (["predict", "will ", "next week", "forecast", "probability of"], "predictive"),
]

BASE_CAPABILITIES = {
    "analytical": {
        "engines": ["rag", "actor_posture"],
        "blocks": ["rri-gauge", "actor-timeline", "confidence-meter"]
    },
    "predictive": {
        "engines": ["rag", "simulation", "actor_posture"],
        "blocks": ["monte-carlo-futures", "rri-gauge", "protest-sir", "confidence-meter"]
    },
    "comparative": {
        "engines": ["rag", "doctrine"],
        "blocks": ["comparative-historical", "economic-stress", "elite-network", "rri-gauge"]
    },
    "monitoring": {
        "engines": ["rag", "actor_posture"],
        "blocks": ["governorate-heatmap", "rri-gauge", "narrative-warfare"]
    },
    "simulation": {
        "engines": ["simulation", "deliberation", "actor_posture"],
        "blocks": ["monte-carlo-futures", "governorate-heatmap", "actor-timeline", "confidence-meter"]
    },
    "intervention": {
        "engines": ["intervention", "deliberation", "actor_posture"],
        "blocks": ["intervention-ranker", "rri-gauge", "elite-network", "confidence-meter"]
    },
}

MODIFIERS = {
    "gafsa": ("blocks", "add", "governorate-heatmap"),
    "kasserine": ("blocks", "add", "governorate-heatmap"),
    "ugtt": ("blocks", "add", "elite-network"),
    "military": ("blocks", "add", "elite-network"),
    "food": ("blocks", "add", "economic-stress"),
    "water": ("blocks", "add", "water-stress"),
    "migration": ("blocks", "add", "migration-flow"),
    "narrative": ("blocks", "add", "narrative-warfare"),
    "imf": ("engines", "add", "doctrine"),
    "strike": ("blocks", "add", "intervention-ranker"),
    "unrest": ("blocks", "add", "intervention-ranker"),
}

MACRO_QUERIES = {
    "morning_brief": {
        "query": "Generate a morning intelligence brief: what changed overnight, what requires attention today, and what is the 7-day risk outlook?",
        "intent": "analytical",
        "blocks": ["rri-gauge", "actor-timeline", "narrative-warfare", "confidence-meter"],
        "engines": ["rag", "actor_posture"]
    },
    "escalation_watch": {
        "query": "What are the current escalation signals? Which causal chains are active and what is the cascade probability in the next 14 days?",
        "intent": "predictive",
        "blocks": ["monte-carlo-futures", "governorate-heatmap", "protest-sir", "confidence-meter"],
        "engines": ["rag", "simulation", "actor_posture"]
    },
    "economic_snapshot": {
        "query": "Provide current economic stress assessment: FX reserves, inflation trajectory, IMF status, and subsidy sustainability.",
        "intent": "analytical",
        "blocks": ["economic-stress", "rri-gauge", "elite-network", "confidence-meter"],
        "engines": ["rag", "doctrine"]
    }
}

CASE_KEYWORDS = {
    "egypt": "EGY_2010_2011",
    "2011": "TUN_2011_REVOLUTION",
    "2008": "TUN_2008_GAFSA",
    "2013": "TUN_2013_CRISIS",
    "2021": "TUN_2021_COUP",
    "libya": "LBY_2011_COLLAPSE",
}


class WorkspaceOrchestrator:

    def __init__(self):
        self._investigation_counter = 0

    async def create_investigation(self, title: str = None, user_id: str = None) -> dict:
        now = datetime.now(timezone.utc)
        self._investigation_counter += 1
        ts = now.strftime("%Y%m%d_%H%M%S")
        investigation_id = f"inv_{ts}_{uuid4().hex[:8]}"
        record = {
            "investigation_id": investigation_id,
            "user_id": user_id,
            "title": title or f"Investigation {self._investigation_counter}",
            "status": "active",
            "pinned_actors": [],
            "active_hypotheses": [],
            "time_range": {},
            "watchlist": [],
            "message_count": 0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        _investigations_store[investigation_id] = record
        _messages_store[investigation_id] = []
        try:
            data = {
                "investigation_id": investigation_id,
                "user_id": user_id,
                "title": record["title"],
                "status": "active",
                "message_count": 0,
            }
            await db.table("investigations").insert(data).execute()
        except Exception:
            pass
        return record

    async def get_investigation(self, investigation_id: str) -> Optional[dict]:
        if investigation_id in _investigations_store:
            return _investigations_store[investigation_id]
        try:
            resp = await db.table("investigations").select("*").eq("investigation_id", investigation_id).execute()
            if resp.data:
                record = dict(resp.data[0])
                _investigations_store[investigation_id] = record
                return record
        except Exception:
            pass
        return None

    async def list_investigations(self, user_id: str = None) -> list:
        store_list = list(_investigations_store.values())
        if user_id:
            store_list = [i for i in store_list if i.get("user_id") == user_id]
        try:
            query = db.table("investigations").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            resp = await query.execute()
            if resp.data:
                seen = {r["investigation_id"] for r in store_list}
                for r in resp.data:
                    if r["investigation_id"] not in seen:
                        store_list.append(dict(r))
        except Exception:
            pass
        return sorted(store_list, key=lambda x: x.get("created_at", ""), reverse=True)

    async def store_message(self, investigation_id: str, message: dict) -> dict:
        messages = _messages_store.setdefault(investigation_id, [])
        message["id"] = str(uuid4())
        message["created_at"] = datetime.now(timezone.utc).isoformat()
        messages.append(message)
        try:
            db_msg = {
                "investigation_id": investigation_id,
                "message_index": message.get("message_index", len(messages)),
                "role": message["role"],
                "query_text": message.get("query_text"),
                "intent": message.get("intent"),
                "narrative": message.get("narrative"),
                "confidence": message.get("confidence"),
                "citations": json.dumps(message.get("citations", [])),
                "blocks_rendered": json.dumps(message.get("blocks_rendered", [])),
                "engines_called": message.get("engines_called", []),
                "deliberation_session_id": message.get("deliberation_session_id"),
                "simulation_run_id": message.get("simulation_run_id"),
                "state_version_id": message.get("state_version_id"),
            }
            await db.table("investigation_messages").insert(db_msg).execute()
        except Exception:
            pass
        return message

    async def get_messages(self, investigation_id: str) -> list:
        return _messages_store.get(investigation_id, [])

    async def update_investigation_context(self, investigation_id: str, updates: dict):
        inv = _investigations_store.get(investigation_id)
        if inv:
            inv.update(updates)
            inv["updated_at"] = datetime.now(timezone.utc).isoformat()
            if "message_count" in updates:
                inv["message_count"] = inv.get("message_count", 0) + 1
        try:
            db_updates = {}
            if "pinned_actors" in updates:
                db_updates["pinned_actors"] = updates["pinned_actors"]
            if "active_hypotheses" in updates:
                db_updates["active_hypotheses"] = json.dumps(updates["active_hypotheses"])
            if db_updates:
                db_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.table("investigations").update(db_updates).eq("investigation_id", investigation_id).execute()
        except Exception:
            pass

    async def process_query(self, query: str, investigation_id: str, user_id: str = None) -> dict:
        start_time = time.time()
        investigation = await self.get_investigation(investigation_id)
        if not investigation:
            investigation = await self.create_investigation(title=f"Query: {query[:50]}", user_id=user_id)

        await self.store_message(investigation_id, {
            "role": "user",
            "message_index": investigation.get("message_count", 0),
            "query_text": query,
        })

        snapshot = get_latest_snapshot()
        if not snapshot:
            snapshot = {"rri": 2.14, "p_revolution": 0.34, "state_phase": "elevated", "state_version_id": "snap_default"}

        intent = await self._route_intent(query)
        capabilities = self._select_capabilities(intent, query, snapshot)
        results = await self._execute_parallel(query, intent, capabilities, investigation, snapshot)
        response = await self._synthesize(query, intent, results, investigation, snapshot, capabilities)
        response["latency_ms"] = int((time.time() - start_time) * 1000)

        assistant_msg = {
            "role": "assistant",
            "message_index": investigation.get("message_count", 0),
            "narrative": response.get("narrative", ""),
            "key_finding": response.get("key_finding", ""),
            "confidence": response.get("confidence", 0),
            "confidence_rationale": response.get("confidence_rationale", ""),
            "citations": response.get("citations", []),
            "follow_up_actions": response.get("follow_up_actions", []),
            "hypothesis_update": response.get("hypothesis_update"),
            "blocks_rendered": response.get("blocks", []),
            "intent": intent,
            "engines_called": list(results.keys()),
            "state_version_id": snapshot.get("state_version_id", "snap_default"),
        }
        await self.store_message(investigation_id, assistant_msg)
        await self.update_investigation_context(investigation_id, {"message_count": 1})

        envelope = {
            "query_id": str(uuid4()),
            "investigation_id": investigation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "intent": intent,
            "state_version_id": snapshot.get("state_version_id", "snap_default"),
            "engines_called": list(results.keys()),
            "latency_ms": response.get("latency_ms", 0),
            "response": {
                "narrative": response.get("narrative", ""),
                "key_finding": response.get("key_finding", ""),
                "confidence": response.get("confidence", 0),
                "confidence_rationale": response.get("confidence_rationale", ""),
                "citations": response.get("citations", []),
                "follow_up_actions": response.get("follow_up_actions", []),
                "hypothesis_update": response.get("hypothesis_update"),
            },
            "blocks": response.get("blocks", []),
            "context_updates": {
                "new_actors_mentioned": [],
                "hypotheses_updated": [],
                "watchlist_triggered": [],
            },
        }
        return envelope

    async def process_query_stream(self, query: str, investigation_id: str, user_id: str = None):
        start_time = time.time()
        investigation = await self.get_investigation(investigation_id)
        if not investigation:
            investigation = await self.create_investigation(title=f"Query: {query[:50]}", user_id=user_id)

        await self.store_message(investigation_id, {
            "role": "user",
            "message_index": investigation.get("message_count", 0),
            "query_text": query,
        })

        snapshot = get_latest_snapshot()
        if not snapshot:
            snapshot = {"rri": 2.14, "p_revolution": 0.34, "state_phase": "elevated", "state_version_id": "snap_default"}

        intent = await self._route_intent(query)
        capabilities = self._select_capabilities(intent, query, snapshot)
        results = await self._execute_parallel(query, intent, capabilities, investigation, snapshot)
        response = await self._synthesize(query, intent, results, investigation, snapshot, capabilities)
        response["latency_ms"] = int((time.time() - start_time) * 1000)

        narrative = response.get("narrative", "")
        words = narrative.split()
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield {"type": "narrative_token", "token": token}
            await asyncio.sleep(0.02)

        envelope = {
            "query_id": str(uuid4()),
            "investigation_id": investigation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "intent": intent,
            "state_version_id": snapshot.get("state_version_id", "snap_default"),
            "engines_called": list(results.keys()),
            "latency_ms": response.get("latency_ms", 0),
            "response": {
                "narrative": narrative,
                "key_finding": response.get("key_finding", ""),
                "confidence": response.get("confidence", 0),
                "confidence_rationale": response.get("confidence_rationale", ""),
                "citations": response.get("citations", []),
                "follow_up_actions": response.get("follow_up_actions", []),
                "hypothesis_update": response.get("hypothesis_update"),
            },
            "blocks": response.get("blocks", []),
            "context_updates": {
                "new_actors_mentioned": [],
                "hypotheses_updated": [],
                "watchlist_triggered": [],
            },
        }
        yield {"type": "complete", "envelope": envelope}

        assistant_msg = {
            "role": "assistant",
            "message_index": investigation.get("message_count", 0),
            "narrative": narrative,
            "key_finding": response.get("key_finding", ""),
            "confidence": response.get("confidence", 0),
            "confidence_rationale": response.get("confidence_rationale", ""),
            "citations": response.get("citations", []),
            "follow_up_actions": response.get("follow_up_actions", []),
            "hypothesis_update": response.get("hypothesis_update"),
            "blocks_rendered": response.get("blocks", []),
            "intent": intent,
            "engines_called": list(results.keys()),
            "state_version_id": snapshot.get("state_version_id", "snap_default"),
        }
        await self.store_message(investigation_id, assistant_msg)
        await self.update_investigation_context(investigation_id, {"message_count": 1})

    async def _route_intent(self, query: str) -> str:
        query_lower = query.lower()
        for keywords, intent in INTENT_RULES:
            if any(kw in query_lower for kw in keywords):
                return intent
        return "analytical"

    def _select_capabilities(self, intent: str, query: str, snapshot: dict) -> dict:
        capabilities = BASE_CAPABILITIES.get(intent, BASE_CAPABILITIES["analytical"]).copy()
        capabilities["blocks"] = list(capabilities["blocks"])
        capabilities["engines"] = list(capabilities["engines"])
        query_lower = query.lower()
        for keyword, (collection, action, item) in MODIFIERS.items():
            if keyword in query_lower:
                if action == "add" and item not in capabilities[collection]:
                    capabilities[collection].append(item)
        capabilities["blocks"] = capabilities["blocks"][:5]
        return capabilities

    async def _execute_parallel(self, query: str, intent: str, capabilities: dict, investigation: dict, snapshot: dict) -> dict:
        tasks = {}
        from .rag_synthesis import synthesize as rag_synthesize
        from .actor_engine import get_all_postures

        if "rag" in capabilities["engines"]:
            tasks["rag"] = rag_synthesize(query=query, trigger_source="workspace", rri_context=snapshot, max_chunks=5)
        if "actor_posture" in capabilities["engines"]:
            tasks["postures"] = get_all_postures(snapshot)
        if "simulation" in capabilities["engines"]:
            from .simulation_engine import simulation_engine
            scenario_id = await self._match_scenario(query)
            tasks["simulation"] = simulation_engine.run(scenario_id=scenario_id, base_state_version_id=snapshot.get("state_version_id"), mc_iterations=500, time_horizon_days=30)
        if "deliberation" in capabilities["engines"]:
            from .deliberation_engine import deliberation_engine
            tasks["deliberation"] = deliberation_engine.run(scenario=query, trigger_type="workspace", state_version_id=snapshot.get("state_version_id"), is_simulation=(intent == "simulation"))
        if "doctrine" in capabilities["engines"]:
            from .doctrine_client import search_doctrine
            tasks["doctrine"] = search_doctrine(query=query, limit=3)
        if "intervention" in capabilities["engines"]:
            from .intervention_engine import intervention_engine
            target_outcome = self._infer_target_outcome(query)
            tasks["intervention"] = intervention_engine.run(
                target_outcome=target_outcome,
                time_horizon_days=30,
                top_n=5,
            )

        results = {}
        if tasks:
            task_results = await asyncio.gather(*tasks.values(), return_exceptions=True)
            for key, result in zip(tasks.keys(), task_results):
                if not isinstance(result, Exception):
                    results[key] = result
        return results

    async def _match_scenario(self, query: str) -> str:
        return "subsidy_removal"

    async def _synthesize(self, query: str, intent: str, results: dict, investigation: dict, snapshot: dict, capabilities: dict) -> dict:
        context_parts = []
        if "rag" in results:
            rag = results["rag"]
            prose = rag.get("prose", rag.get("narrative", ""))
            citations = rag.get("citations", [])
            context_parts.append(f"INTELLIGENCE EVIDENCE:\n{prose[:2000]}")
        if "postures" in results:
            postures = results["postures"]
            if isinstance(postures, list):
                summary = "\n".join([f"  {p.get('actor_id', '?')}: {p.get('posture', 'unknown')} (stress: {p.get('stress_level', 0)})" for p in postures[:11]])
            else:
                summary = str(postures)[:500]
            context_parts.append(f"ACTOR POSTURES:\n{summary}")
        if "deliberation" in results:
            delib = results["deliberation"]
            context_parts.append(f"DELIBERATION OUTPUT:\n{json.dumps(delib, indent=2)[:1000]}")
        if "simulation" in results:
            sim = results["simulation"]
            context_parts.append(f"SIMULATION OUTPUT:\n{json.dumps(sim, indent=2)[:1000]}")
        if "intervention" in results:
            intv = results["intervention"]
            ranked = intv.get("ranked_results", [])
            if ranked:
                top = ranked[0]
                intv_summary = (
                    f"TOP INTERVENTION: {top.get('intervention_name')} "
                    f"(efficiency {top.get('efficiency_score', 0):.2f}, "
                    f"ΔP(rev) {top.get('p_revolution_delta', 0):+.3f})\n"
                    f"  Support: {top.get('actor_support', [])} | "
                    f"Opposition: {top.get('actor_opposition', [])}"
                )
                context_parts.append(f"INTERVENTION ANALYSIS:\n{intv_summary}")
        if "doctrine" in results:
            doctrine = results["doctrine"]
            if isinstance(doctrine, list):
                texts = "\n".join([f"  - {d.get('title', d.get('content', '?'))[:200]}" for d in doctrine[:3]])
            else:
                texts = str(doctrine)[:500]
            context_parts.append(f"DOCTRINE CONTEXT:\n{texts}")

        system_prompt = f"""You are the TunisiaIntel cognitive intelligence engine.
Intent classified as: {intent}
Current RRI: {snapshot.get('rri', 'N/A')} | Phase: {snapshot.get('state_phase', 'N/A')}
Investigation context: {investigation.get('title', 'New Investigation')}
Pinned actors: {investigation.get('pinned_actors', [])}

{' '.join(context_parts)}

Generate a structured intelligence response as JSON:
{{
  "narrative": "3-5 sentence analytical response grounded in evidence",
  "key_finding": "single most important insight in one sentence",
  "confidence": 0.0-1.0,
  "confidence_rationale": "why this confidence level",
  "citations": [],
  "follow_up_actions": [
    "Simulate: ...",
    "Drill down: ...",
    "Monitor: ..."
  ],
  "hypothesis_update": {{
    "hypothesis": "...",
    "update_type": "confirms|challenges|neutral",
    "delta_confidence": 0.0-1.0
  }}
}}

RULES:
- Every factual claim cites a provided evidence chunk
- Do not assert things not in the evidence
- Confidence reflects evidence quality, not certainty of the claim
- follow_up_actions must be actionable queries the system can actually run
- Output valid JSON only"""

        try:
            response_text = await generate(prompt=query, system=system_prompt, response_format="json", max_tokens=500)
            synthesis = json.loads(response_text)
        except Exception:
            synthesis = {
                "narrative": f"Analysis of {intent} query regarding current Tunisia situation.",
                "key_finding": "RRI at elevated levels with multiple active stress vectors.",
                "confidence": 0.65,
                "confidence_rationale": "Based on available intelligence data.",
                "citations": [],
                "follow_up_actions": ["Simulate: subsidy removal scenario", "Monitor: UGTT strike activity"],
                "hypothesis_update": None,
            }

        blocks = await self._parameterize_blocks(capabilities["blocks"], synthesis, results, snapshot, query, intent)
        return {
            "narrative": synthesis.get("narrative", ""),
            "key_finding": synthesis.get("key_finding", ""),
            "confidence": synthesis.get("confidence", 0.5),
            "confidence_rationale": synthesis.get("confidence_rationale", ""),
            "citations": synthesis.get("citations", []),
            "follow_up_actions": synthesis.get("follow_up_actions", []),
            "hypothesis_update": synthesis.get("hypothesis_update"),
            "blocks": blocks,
            "intent": intent,
            "engines_called": list(results.keys()),
            "state_version_id": snapshot.get("state_version_id", "snap_default"),
        }

    async def _parameterize_blocks(self, block_ids: list, synthesis: dict, results: dict, snapshot: dict, query: str, intent: str) -> list:
        parameterized = []
        for block_id in block_ids:
            method = getattr(self, f"_param_{block_id.replace('-', '_')}", None)
            if method:
                params = await method(query, synthesis, results, snapshot)
            else:
                params = {}
            parameterized.append({
                "block_id": block_id,
                "parameters": params,
                "data_snapshot": self._extract_block_data(block_id, results, snapshot),
                "confidence": synthesis.get("confidence", 0.5),
            })
        return parameterized

    def _extract_block_data(self, block_id: str, results: dict, snapshot: dict) -> dict:
        return {
            "snapshot_rri": snapshot.get("rri"),
            "snapshot_phase": snapshot.get("state_phase"),
            "snapshot_p_rev": snapshot.get("p_revolution"),
        }

    async def _param_rri_gauge(self, query, synthesis, results, snapshot):
        return {"current_rri": snapshot.get("rri"), "p_revolution": snapshot.get("p_revolution"), "state_phase": snapshot.get("state_phase"), "velocity": snapshot.get("velocity"), "show_components": True, "highlight_variable": None}

    async def _param_governorate_heatmap(self, query, synthesis, results, snapshot):
        return {"vectors": snapshot.get("governorate_vectors", []), "highlight_gov": None}

    async def _param_monte_carlo_futures(self, query, synthesis, results, snapshot):
        sim = results.get("simulation", {})
        return {"run_id": sim.get("run_id"), "outcome_distribution": sim.get("outcome_distribution", {}), "rri_trajectory": sim.get("rri_trajectory", []), "p_revolution_range": sim.get("p_revolution_range", {}), "sensitivity_ranking": sim.get("sensitivity_ranking", []), "time_horizon_days": 30}

    async def _param_actor_timeline(self, query, synthesis, results, snapshot):
        return {"actors": results.get("postures", [])[:5] if isinstance(results.get("postures"), list) else [], "time_range_days": 30}

    async def _param_elite_network(self, query, synthesis, results, snapshot):
        return {"actors": results.get("postures", []) if isinstance(results.get("postures"), list) else [], "highlight_coalitions": True}

    async def _param_economic_stress(self, query, synthesis, results, snapshot):
        return {"inflation": snapshot.get("inflation_rate"), "fx_reserves_days": snapshot.get("fx_reserves_days"), "parallel_market_premium": snapshot.get("parallel_market_premium"), "debt_to_gdp": snapshot.get("debt_to_gdp")}

    async def _param_narrative_warfare(self, query, synthesis, results, snapshot):
        rag = results.get("rag", {})
        return {"narrative_state": snapshot.get("narrative_state"), "active_narratives": rag.get("citations", [])[:3]}

    async def _param_comparative_historical(self, query, synthesis, results, snapshot):
        query_lower = query.lower()
        reference_case = next((case for kw, case in CASE_KEYWORDS.items() if kw in query_lower), "TUN_2011_REVOLUTION")
        return {"current_state": {"rri": snapshot.get("rri"), "phase": snapshot.get("state_phase")}, "reference_case_id": reference_case, "dimensions": ["rri_trajectory", "economic_indicators", "elite_cohesion", "protest_velocity", "military_posture"]}

    async def _param_protest_sir(self, query, synthesis, results, snapshot):
        return {"current_r0": snapshot.get("protest_r0"), "current_cases": snapshot.get("protest_cases"), "governorate_vectors": snapshot.get("governorate_vectors", [])[:5]}

    async def _param_confidence_meter(self, query, synthesis, results, snapshot):
        return {"overall_confidence": synthesis.get("confidence", 0.5), "data_freshness_hours": snapshot.get("data_freshness_hours", 0), "variables_used": len(snapshot) if isinstance(snapshot, dict) else 0, "rag_chunks_used": len(results.get("rag", {}).get("citations", [])), "model_calibration": snapshot.get("confidence_overall", 0), "uncertainty_breakdown": {"data": 0.5, "model": 0.5, "structural": 0.7, "epistemic": synthesis.get("confidence", 0.5)}}

    async def _param_water_stress(self, query, synthesis, results, snapshot):
        return {"water_stress_index": snapshot.get("water_stress_index"), "dam_fill_rate": snapshot.get("dam_fill_rate"), "rainfall_anomaly": snapshot.get("rainfall_anomaly")}

    async def _param_migration_flow(self, query, synthesis, results, snapshot):
        return {"migration_pressure_index": snapshot.get("migration_pressure"), "coast_guard_interceptions": snapshot.get("migration_interceptions"), "eu_readmission_rate": snapshot.get("eu_readmission_rate")}

    async def _param_intervention_ranker(self, query, synthesis, results, snapshot):
        intv_run = results.get("intervention", {})
        ranked = intv_run.get("ranked_results", [])
        return {
            "target_outcome": intv_run.get("target_outcome", self._infer_target_outcome(query)),
            "ranked_interventions": ranked[:5],
            "top_recommendation": intv_run.get("top_recommendation"),
            "recommendation_narrative": intv_run.get("recommendation_narrative", synthesis.get("narrative", "")),
            "baseline_p_revolution": intv_run.get("baseline_p_revolution", snapshot.get("p_revolution", 0.34)),
            "baseline_rri": intv_run.get("baseline_rri", snapshot.get("rri", 2.14)),
            "recommendation_confidence": intv_run.get("recommendation_confidence", synthesis.get("confidence", 0.65)),
        }

    def _infer_target_outcome(self, query: str) -> str:
        q = query.lower()
        if any(kw in q for kw in ["strike", "ugtt", "labour", "labor", "worker"]):
            return "prevent_strike"
        if any(kw in q for kw in ["fx", "reserves", "forex", "dinar", "currency"]):
            return "stabilize_fx"
        if any(kw in q for kw in ["unrest", "protest", "riot", "kasserine", "gafsa"]):
            return "reduce_unrest"
        if any(kw in q for kw in ["cascade", "chain", "spiral", "collapse"]):
            return "reduce_cascade"
        return "reduce_p_revolution"


workspace = WorkspaceOrchestrator()
