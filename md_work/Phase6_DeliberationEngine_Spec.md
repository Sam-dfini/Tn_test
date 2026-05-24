# Phase 6 — Deliberation Engine
## High Table MVP — TunisiaIntel

**Version:** 1.0  
**Date:** 2026-05-21  
**Depends on:** Phase 1 (canonical state), Phase 4 (actor profiles), Phase 5 (doctrine library)

---

## What This Phase Builds

The deliberation engine is the core of the High Table.

Phases 1–5 built the substrate:
- Phase 1: one authoritative state
- Phase 2: causal chains
- Phase 3: live memory
- Phase 4: actor behavioral models
- Phase 5: doctrine reasoning

Phase 6 makes them interact.

When a crisis signal fires or an analyst injects a scenario, the engine:
1. Reads the current state snapshot
2. Activates relevant actors
3. Each actor generates a position from its profile + live signals + doctrine
4. Positions are submitted to a deliberation table
5. Conflicts detected, coalitions formed, authority weights applied
6. Output: a decision probability distribution with full reasoning trace

This is not a chatbot roundtable. Every position is computed from structured schemas, equations, and retrieved evidence — not freeform generation.

---

## Architecture

```
TRIGGER (ontology chain activation | analyst scenario | scheduled)
        │
        ▼
DELIBERATION ORCHESTRATOR
        │
        ├── Load canonical state snapshot
        ├── Identify relevant actors (by authority_weights + chain sensitivity)
        ├── For each actor:
        │     ├── Apply state_update_rules → adjusted probability matrix
        │     ├── Retrieve live signal context (Phase 3 RAG)
        │     ├── Retrieve doctrine context (Phase 5, actor-bound workspace)
        │     └── Generate position (structured, not freeform)
        │
        ├── Submit all positions to deliberation table
        ├── Conflict detection
        ├── Coalition formation
        ├── Authority weighting (context-sensitive)
        ├── Resolution: consensus | compromise | deadlock | escalation
        │
        └── Store full deliberation record
              └── Broadcast to frontend (High Table UI)
```

---

## Migration: `005_deliberation.sql`

```sql
-- Deliberation sessions
CREATE TABLE deliberation_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            TEXT NOT NULL UNIQUE,   -- "del_20260521_143022"
  trigger_type          TEXT NOT NULL,          -- "ontology_chain"|"analyst"|"scheduled"|"shock"
  trigger_source        TEXT,                   -- chain_id or analyst user_id
  scenario_description  TEXT NOT NULL,          -- human-readable scenario
  state_version_id      TEXT NOT NULL,          -- snapshot used as input
  is_simulation         BOOLEAN DEFAULT FALSE,  -- true = scenario fork

  -- Participating actors
  actor_ids             TEXT[] NOT NULL,        -- entity_ids of actors at the table

  -- Output
  resolution_type       TEXT,    -- "consensus"|"compromise"|"deadlock"|"escalation"
  decision_output       JSONB,   -- structured decision with probabilities
  confidence            NUMERIC(4,3),
  dominant_coalition    TEXT[],  -- entity_ids of winning coalition
  dissenting_actors     TEXT[],  -- entity_ids who opposed

  -- Full trace
  deliberation_trace    JSONB NOT NULL DEFAULT '[]',  -- ordered position submissions
  conflict_map          JSONB DEFAULT '{}',
  coalition_map         JSONB DEFAULT '{}',

  -- Timing
  started_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,

  -- Validation
  historical_analogue   TEXT,    -- matched historical event if any
  analogue_similarity   NUMERIC(4,3)
);

-- Individual actor positions within a session
CREATE TABLE deliberation_positions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES deliberation_sessions(id) ON DELETE CASCADE,
  entity_id         TEXT NOT NULL,
  actor_name        TEXT NOT NULL,

  -- Position content
  recommendation    TEXT NOT NULL,         -- primary recommended action
  recommendation_confidence NUMERIC(4,3),
  reasoning_chain   TEXT NOT NULL,         -- structured reasoning (not freeform)
  supporting_actions JSONB DEFAULT '[]',   -- secondary actions

  -- Evidence base
  live_citations    JSONB DEFAULT '[]',    -- from Phase 3 RAG
  doctrine_citations JSONB DEFAULT '[]',  -- from Phase 5 AnythingLLM

  -- Probability matrix at time of position
  adjusted_probabilities JSONB DEFAULT '{}',

  -- Conflict flags
  conflicts_with    TEXT[] DEFAULT '{}',   -- entity_ids this position conflicts with
  aligns_with       TEXT[] DEFAULT '{}',   -- entity_ids this position aligns with

  submitted_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ds_trigger ON deliberation_sessions(trigger_type);
CREATE INDEX idx_ds_state ON deliberation_sessions(state_version_id);
CREATE INDEX idx_ds_simulation ON deliberation_sessions(is_simulation);
CREATE INDEX idx_dp_session ON deliberation_positions(session_id);
CREATE INDEX idx_dp_entity ON deliberation_positions(entity_id);
```

---

## Core Service: `deliberation_engine.py`

```python
# backend/app/services/deliberation_engine.py

class DeliberationEngine:

    async def run(
        self,
        scenario: str,
        trigger_type: str,
        trigger_source: str = None,
        state_version_id: str = None,   # None = use latest
        actor_ids: list[str] = None,    # None = auto-select by relevance
        is_simulation: bool = False
    ) -> dict:
        """
        Full deliberation pipeline. Returns complete session record.
        """
        # 1. Load state
        snapshot = await self._load_state(state_version_id)

        # 2. Select actors
        actors = await self._select_actors(scenario, snapshot, actor_ids)

        # 3. Generate positions
        positions = await asyncio.gather(*[
            self._generate_position(actor, scenario, snapshot)
            for actor in actors
        ])

        # 4. Deliberate
        result = await self._deliberate(positions, snapshot, scenario)

        # 5. Store + broadcast
        session = await self._store_session(result, snapshot, scenario, trigger_type)
        await self._broadcast(session)

        return session


    async def _select_actors(
        self,
        scenario: str,
        snapshot: dict,
        override_ids: list[str] = None
    ) -> list[dict]:
        """
        Auto-select relevant actors based on:
        - Which ontology chains are active in snapshot
        - Which actors have high authority_weight for the crisis type
        - Minimum: always include PRES, ARM, UGTT, BCT for national scenarios

        Returns ordered list (highest authority first).
        """
        if override_ids:
            return await self._load_profiles(override_ids)

        crisis_type = self._classify_crisis(snapshot)
        all_profiles = await self._load_all_profiles()

        scored = [
            (p, p["authority_weights"].get(crisis_type, 0.30))
            for p in all_profiles
        ]

        # Always include core four
        core = {"PRES", "ARM", "UGTT", "BCT"}
        selected = [p for p, s in scored if p["entity_id"] in core]
        selected += [p for p, s in sorted(scored, key=lambda x: -x[1])
                     if p["entity_id"] not in core and s > 0.50]

        return selected[:8]  # max 8 actors at the table


    async def _generate_position(
        self,
        actor: dict,
        scenario: str,
        snapshot: dict
    ) -> dict:
        """
        Generate one actor's position. Structured, not freeform.

        Pipeline:
        1. Apply state_update_rules to get adjusted probabilities
        2. Identify top recommended action
        3. Retrieve live signal context (RAG Phase 3)
        4. Retrieve doctrine context (Phase 5, actor-bound workspace)
        5. Generate reasoning chain via LLM with strict schema
        6. Return structured position
        """
        # Step 1: adjust probabilities
        adjusted = self._apply_state_rules(actor, snapshot)

        # Step 2: top action
        recommendation = max(adjusted, key=adjusted.get)
        confidence = adjusted[recommendation]

        # Step 3: live context
        live_chunks = await rag_search(
            query=f"{scenario} {actor['actor_name']}",
            limit=3
        )

        # Step 4: doctrine context
        workspaces = ACTOR_DOCTRINE_WORKSPACES.get(actor["entity_id"], [])
        doctrine_chunks = await doctrine_client.search_doctrine(
            query=scenario,
            workspace=workspaces[0] if workspaces else None,
            limit=2
        )

        # Step 5: generate reasoning (strictly structured)
        reasoning = await self._generate_reasoning(
            actor, scenario, snapshot,
            recommendation, confidence,
            live_chunks, doctrine_chunks
        )

        return {
            "entity_id": actor["entity_id"],
            "actor_name": actor["actor_name"],
            "recommendation": recommendation,
            "recommendation_confidence": confidence,
            "reasoning_chain": reasoning["prose"],
            "supporting_actions": reasoning["supporting_actions"],
            "live_citations": live_chunks,
            "doctrine_citations": doctrine_chunks,
            "adjusted_probabilities": adjusted,
            "submitted_at": datetime.utcnow().isoformat()
        }


    async def _generate_reasoning(
        self,
        actor: dict,
        scenario: str,
        snapshot: dict,
        recommendation: str,
        confidence: float,
        live_chunks: list,
        doctrine_chunks: list
    ) -> dict:
        """
        LLM call with strict schema enforcement.
        Must return structured JSON — no freeform prose allowed.
        """
        system_prompt = f"""
You are modeling the reasoning of: {actor['actor_name']}
Doctrine: {actor['doctrine']}
Decision style: {actor['decision_style']}
Risk tolerance: {actor['risk_tolerance']}
Primary objectives: {actor['objectives'][:3]}
Current fears active: {self._get_active_fears(actor, snapshot)}

SCENARIO: {scenario}

CURRENT STATE:
RRI: {snapshot['rri']} | P(Revolution): {snapshot['p_revolution']}
State phase: {snapshot['state_phase']}
Active chains: {snapshot.get('active_chains', [])}

LIVE INTELLIGENCE ({len(live_chunks)} fragments):
{self._format_chunks(live_chunks)}

DOCTRINE CONTEXT ({len(doctrine_chunks)} fragments):
{self._format_chunks(doctrine_chunks)}

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
- Output valid JSON only
"""
        response = await llm_client.generate(
            prompt=f"Generate position for scenario: {scenario}",
            system=system_prompt,
            response_format="json"
        )
        return json.loads(response)


    async def _deliberate(
        self,
        positions: list[dict],
        snapshot: dict,
        scenario: str
    ) -> dict:
        """
        Core deliberation logic.

        Steps:
        1. Conflict detection
        2. Coalition formation
        3. Veto check
        4. Authority weighting
        5. Resolution
        """
        # Step 1: detect conflicts
        conflict_map = self._detect_conflicts(positions)

        # Step 2: form coalitions
        coalition_map = self._form_coalitions(positions, conflict_map)

        # Step 3: check vetoes
        veto_result = self._check_vetoes(positions, snapshot)
        if veto_result["veto_active"]:
            return self._resolve_veto(veto_result, positions, coalition_map)

        # Step 4: apply authority weights
        crisis_type = self._classify_crisis(snapshot)
        weighted = self._apply_authority_weights(
            positions, coalition_map, crisis_type
        )

        # Step 5: resolve
        return self._resolve(weighted, coalition_map, conflict_map, positions)


    def _detect_conflicts(self, positions: list[dict]) -> dict:
        """
        Two positions conflict if their recommendations are
        in opposing action categories.

        Opposition map:
        repression ↔ concessions
        general_strike ↔ negotiation
        imf_delay ↔ imf_compliance
        crackdown ↔ international_appeal
        """
        OPPOSITION_MAP = {
            "repression": "concessions",
            "concessions": "repression",
            "general_strike": "negotiation",
            "negotiation": "general_strike",
            "imf_delay": "imf_compliance",
            "crackdown": "international_appeal"
        }

        conflicts = {}
        for i, p1 in enumerate(positions):
            for j, p2 in enumerate(positions[i+1:], i+1):
                opposite = OPPOSITION_MAP.get(p1["recommendation"])
                if opposite and p2["recommendation"] == opposite:
                    key = f"{p1['entity_id']}_vs_{p2['entity_id']}"
                    conflicts[key] = {
                        "actor_a": p1["entity_id"],
                        "actor_b": p2["entity_id"],
                        "conflict_type": f"{p1['recommendation']}_vs_{p2['recommendation']}",
                        "severity": (p1["recommendation_confidence"] +
                                    p2["recommendation_confidence"]) / 2
                    }
        return conflicts


    def _form_coalitions(
        self,
        positions: list[dict],
        conflict_map: dict
    ) -> dict:
        """
        Group actors by shared recommendation category.
        Weight each coalition by sum of actor authority scores.
        """
        coalitions = {}
        for p in positions:
            rec = p["recommendation"]
            if rec not in coalitions:
                coalitions[rec] = {
                    "recommendation": rec,
                    "actors": [],
                    "total_confidence": 0.0
                }
            coalitions[rec]["actors"].append(p["entity_id"])
            coalitions[rec]["total_confidence"] += p["recommendation_confidence"]

        return coalitions


    def _check_vetoes(
        self,
        positions: list[dict],
        snapshot: dict
    ) -> dict:
        """
        Check each actor's veto_conditions against current snapshot.
        A veto blocks the scenario action regardless of coalition weight.
        """
        # Load veto conditions from actor profiles
        # Check against snapshot values
        # Return { veto_active: bool, vetoing_actor: str, blocked_action: str }
        ...


    def _apply_authority_weights(
        self,
        positions: list[dict],
        coalition_map: dict,
        crisis_type: str
    ) -> dict:
        """
        Weight each coalition by the sum of authority_weights[crisis_type]
        for all actors in that coalition.

        Context-sensitive authority:
        - economic_crisis → BCT weight high
        - security_crisis → ARM + INT weight high
        - labor_crisis    → UGTT veto power active
        - legitimacy_crisis → ARM posture decisive
        """
        weighted_coalitions = {}
        for rec, coalition in coalition_map.items():
            authority_sum = sum(
                self._get_actor_authority(actor_id, crisis_type)
                for actor_id in coalition["actors"]
            )
            weighted_coalitions[rec] = {
                **coalition,
                "authority_weight": authority_sum
            }
        return weighted_coalitions


    def _resolve(
        self,
        weighted: dict,
        coalition_map: dict,
        conflict_map: dict,
        positions: list[dict]
    ) -> dict:
        """
        Determine resolution type and output.

        CONSENSUS: one recommendation has authority_weight > 0.65
        COMPROMISE: top two recommendations are within 0.15 of each other
                    → output is partial version of both
        DEADLOCK: no coalition exceeds 0.40 authority weight
        ESCALATION: conflict_severity > 0.80 AND no resolution found
        """
        sorted_coalitions = sorted(
            weighted.values(),
            key=lambda x: x["authority_weight"],
            reverse=True
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
            resolution_type = "consensus"  # weak consensus

        dominant_coalition = top["actors"]
        dissenting = [
            p["entity_id"] for p in positions
            if p["entity_id"] not in dominant_coalition
        ]

        return {
            "resolution_type": resolution_type,
            "decision_output": {
                "primary_action": top["recommendation"],
                "primary_confidence": top["authority_weight"],
                "secondary_action": second["recommendation"] if second else None,
                "secondary_confidence": second["authority_weight"] if second else None,
                "full_distribution": {
                    c["recommendation"]: c["authority_weight"]
                    for c in sorted_coalitions
                }
            },
            "dominant_coalition": dominant_coalition,
            "dissenting_actors": dissenting,
            "conflict_map": conflict_map,
            "coalition_map": coalition_map,
            "confidence": top["authority_weight"]
        }


    def _classify_crisis(self, snapshot: dict) -> str:
        """
        Determine dominant crisis type from snapshot.
        Used to set authority weights.
        """
        rri = snapshot.get("rri", 0)
        ugtt = snapshot.get("sei", 0)       # proxy for labor stress
        reserves = snapshot.get("fx_reserves_days", 90)
        p_rev = snapshot.get("p_revolution", 0)

        if reserves < 45:
            return "economic_crisis"
        if ugtt > 0.75:
            return "labor_crisis"
        if p_rev > 0.50:
            return "legitimacy_crisis"
        if rri > 2.5:
            return "security_crisis"
        return "economic_crisis"  # default
```

---

## Deliberation Output Schema

Every completed session produces this record:

```json
{
  "session_id": "del_20260521_143022",
  "scenario": "IMF demands subsidy removal by Q3 2027 or program suspended",
  "state_version_id": "v_20260521_143022",
  "resolution_type": "compromise",
  "confidence": 0.61,

  "decision_output": {
    "primary_action": "imf_delay",
    "primary_confidence": 0.61,
    "secondary_action": "partial_subsidy_phasing",
    "secondary_confidence": 0.48,
    "full_distribution": {
      "imf_delay": 0.61,
      "partial_subsidy_phasing": 0.48,
      "full_removal": 0.18,
      "general_strike": 0.72
    }
  },

  "dominant_coalition": ["PRES", "INT", "LPR"],
  "dissenting_actors": ["BCT", "DONOR"],
  "veto_active": true,
  "veto_actor": "UGTT",
  "veto_condition": "ugtt_strike_index > 0.75 blocks subsidy_removal",

  "positions": [
    {
      "entity_id": "PRES",
      "recommendation": "imf_delay",
      "confidence": 0.75,
      "reasoning": "Unrest probability at 0.43 exceeds containment threshold...",
      "key_fear": "mass_unrest_sustained",
      "doctrine_applied": "Bueno de Mesquita — delay preserves winning coalition",
      "live_citation": "TAP 2026-05-18: BCT reserves at 52 days"
    },
    {
      "entity_id": "UGTT",
      "recommendation": "general_strike",
      "confidence": 0.82,
      "reasoning": "Subsidy removal signal at 0.78 triggers strike threshold...",
      "key_fear": "wage_erosion_above_15pct_real",
      "doctrine_applied": "Olson — collective action viable when stakes exceed threshold",
      "live_citation": "Telegram UGTT channel 2026-05-20: leadership meeting convened"
    },
    {
      "entity_id": "ARM",
      "recommendation": "neutrality",
      "confidence": 0.88,
      "reasoning": "P(Revolution) at 0.43 approaches military intervention threshold...",
      "key_fear": "civilian_casualty_risk",
      "doctrine_applied": "2011 historical pattern — ARM declared neutrality at P_rev 0.45"
    },
    {
      "entity_id": "BCT",
      "recommendation": "imf_compliance",
      "confidence": 0.75,
      "reasoning": "FX reserves at 52 days, approaching critical threshold...",
      "key_fear": "fx_reserves_below_30_days",
      "doctrine_applied": "Reinhart/Rogoff — reserve depletion accelerates at delay"
    }
  ],

  "historical_analogue": "TUN_2023_IMF_NEGOTIATION",
  "analogue_similarity": 0.74,
  "duration_ms": 4200
}
```

---

## API Endpoints

```
POST /api/deliberation/run
  body: { scenario, trigger_type, actor_ids?, state_version_id?, is_simulation? }
  → runs full deliberation, returns session record

GET  /api/deliberation/sessions
  → list recent sessions (live + simulation)

GET  /api/deliberation/sessions/:session_id
  → full session with positions + trace

GET  /api/deliberation/sessions/latest
  → most recent live session

POST /api/deliberation/scenarios
  → analyst-defined scenario library (saved for reuse)

GET  /api/deliberation/scenarios
  → list saved scenarios
```

---

## Scheduled Deliberation

Wire into the orchestrator to run automatically when ontology chains activate:

```python
# backend/app/orchestrator.py — addition

async def on_chain_activated(chain_id: str, snapshot: dict):
    """
    When an ontology chain crosses its activation threshold,
    automatically trigger a deliberation session.
    """
    chain = await get_chain(chain_id)
    scenario = f"Chain activated: {chain['chain_name']} — {chain['trigger_category']}"

    await deliberation_engine.run(
        scenario=scenario,
        trigger_type="ontology_chain",
        trigger_source=chain_id,
        state_version_id=snapshot["state_version_id"]
    )
```

This means every time CHAIN-01 (bread price cascade) crosses threshold, the High Table automatically convenes and produces a decision probability output — without analyst intervention.

---

## High Table UI: Minimal Frontend Spec

The Phase 6 UI is intentionally minimal. Full circular table interface is Phase 8.

What Phase 6 needs on the frontend:

```
DeliberationPanel.tsx

State:
- latest session (auto-refresh on ti:DELIBERATION_COMPLETE event)
- session list (last 10)
- scenario input (analyst can trigger manually)

Display:
- Session header: scenario + resolution_type + confidence
- Actor position cards (one per actor):
    entity name | recommendation | confidence bar | key fear | citations
- Coalition visualization: two columns (dominant | dissenting)
- Veto alert if veto_active = true
- Historical analogue if similarity > 0.65
- Full trace expandable

Actions:
- "Run deliberation" button → POST /api/deliberation/run
- Scenario selector (saved scenarios)
- "View full trace" modal
```

No D3 graph yet. Cards and columns. The circular table comes in Phase 8.

---

## Validation Protocol

Before Phase 6 is marked complete:

```
Test 1: Subsidy removal scenario
  Input: "IMF demands full subsidy removal Q3 2027"
  Expected:
    - UGTT: general_strike (confidence > 0.75)
    - BCT: imf_compliance
    - PRES: imf_delay
    - ARM: neutrality
    - Resolution: compromise or deadlock (not consensus)
    - UGTT veto active

Test 2: Security crisis scenario
  Input: "Major protest wave spreading from Kasserine to 8 governorates"
  Expected:
    - INT: crackdown (high confidence)
    - ARM: neutrality (confidence proportional to P_rev)
    - UGTT: coalition_with_opposition (if unrest > 0.75)
    - BCT: public_statement only
    - ARM authority weight dominant

Test 3: Auto-trigger on chain activation
  Manually set CHAIN-01 threshold to breach
  Expected: deliberation session auto-created within 30 seconds
  Check: deliberation_sessions table has new row, trigger_type = "ontology_chain"

Test 4: Historical analogue match
  Input: scenario matching 2011 revolution conditions (RRI > 2.8, P_rev > 0.45)
  Expected: analogue_similarity > 0.70 for TUN_2011 event
```

---

## Implementation Order

```
1. Migration 005_deliberation.sql                           → 30 min
2. deliberation_engine.py — full service                    → 4 hrs
3. actor_engine.py — _apply_state_rules() if not done       → 1 hr
4. Wire on_chain_activated() into orchestrator              → 1 hr
5. API endpoints                                            → 1 hr
6. DeliberationPanel.tsx (minimal UI)                       → 2 hrs
7. Wire ti:DELIBERATION_COMPLETE WebSocket broadcast        → 30 min
8. Run 4 validation tests                                   → 2 hrs
```

Total: ~2 days.

---

## What Phase 6 Unlocks

After this phase the system can:

- **Auto-convene** the High Table when a causal chain activates
- **Produce structured decision probabilities** — not "AI thinks X" but "weighted actor coalition recommends X with authority score 0.61"
- **Detect vetoes** — UGTT blocks subsidy removal before the presidency even decides
- **Show dissent** — which actors opposed and why
- **Cite evidence** — every position backed by live signals and doctrine
- **Match history** — "this deliberation resembles TUN_2023 with 74% similarity"

That is the High Table MVP. Phase 7 (simulation chamber) and Phase 8 (circular table UI) build on top of this foundation.

---

*Deliberation Engine v1.0 — 2026-05-21*
