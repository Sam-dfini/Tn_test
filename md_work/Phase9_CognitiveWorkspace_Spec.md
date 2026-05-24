# Phase 9 — Cognitive Intelligence Workspace
## Conversational Operating System — TunisiaIntel v3

**Version:** 1.0
**Date:** 2026-05-21
**Depends on:** All previous phases (1–8)

---

## What This Phase Builds

The Cognitive Workspace is the interface layer that sits on top of
the entire Phase 1–8 intelligence substrate.

It transforms the interaction model:

```
BEFORE (Phases 1–8):
Analyst navigates to a view → view shows data

AFTER (Phase 9):
Analyst asks a question → system assembles the answer
```

The conversation IS the navigation.
The interface IS the report.
The system thinks — the analyst decides.

---

## Architecture

```
USER QUERY
    │
    ▼
INTENT ROUTER (Python)
Classifies: analytical | predictive | comparative | monitoring | simulation
    │
    ▼
CONTEXT ENGINE (Python)
Loads: investigation thread, pinned actors, active hypotheses,
       current snapshot (Phase 1), active chains (Phase 2)
    │
    ▼
CAPABILITY SELECTOR (Python)
Decides: which blocks, which engines, which data sources
Rules-based + LLM fallback for ambiguous queries
    │
    ▼
PARALLEL EXECUTION
├── RAG retrieval (Phase 3 pgvector + Phase 5 AnythingLLM)
├── Actor posture pull (Phase 4)
├── Deliberation trigger if warranted (Phase 6)
├── Simulation run if requested (Phase 7)
└── High Table posture summary (Phase 8)
    │
    ▼
SYNTHESIS ENGINE (Python + llm_client.py)
Generates: narrative + block parameters + confidence score
Enforces: citation schema from Phase 3
    │
    ▼
RESPONSE ASSEMBLER
Typed JSON envelope → frontend renders adaptive block layout
    │
    ▼
COGNITIVE WORKSPACE UI
Left: conversation thread
Right: dynamic intelligence canvas (assembled blocks)
```

---

## Migration: `007_workspace.sql`

```sql
-- Investigation dossiers
CREATE TABLE investigations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id TEXT NOT NULL UNIQUE,  -- "inv_20260521_143022"
  user_id         UUID,                   -- future: org/user auth
  title           TEXT NOT NULL,
  status          TEXT DEFAULT 'active',  -- "active"|"archived"|"exported"

  -- Investigation context (persists across messages)
  pinned_actors   TEXT[] DEFAULT '{}',    -- entity_ids
  active_hypotheses JSONB DEFAULT '[]',
  -- [{ "hypothesis": "...", "confidence": 0.72, "evidence_count": 4 }]
  time_range      JSONB DEFAULT '{}',
  -- { "start": "ISO", "end": "ISO" }
  watchlist       JSONB DEFAULT '[]',
  -- [{ "type": "actor|chain|variable", "id": "...", "threshold": 0.70 }]

  -- Metadata
  message_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Messages within investigations
CREATE TABLE investigation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  message_index   INTEGER NOT NULL,
  role            TEXT NOT NULL,    -- "user"|"assistant"|"system"

  -- User message
  query_text      TEXT,
  intent          TEXT,
  -- "analytical"|"predictive"|"comparative"|"monitoring"|"simulation"

  -- Assistant response
  narrative       TEXT,             -- synthesized prose
  confidence      NUMERIC(4,3),
  citations       JSONB DEFAULT '[]',

  -- Blocks rendered in this response
  blocks_rendered JSONB DEFAULT '[]',
  -- [{ "block_id": "rri-gauge", "parameters": {...}, "data_snapshot": {...} }]

  -- Engine calls made
  engines_called  TEXT[] DEFAULT '{}',
  -- ["rag", "deliberation", "simulation", "actor_posture"]
  deliberation_session_id UUID,
  simulation_run_id TEXT,

  -- State reference
  state_version_id TEXT,            -- snapshot used for this response

  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Block registry
CREATE TABLE block_registry (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id        TEXT NOT NULL UNIQUE,  -- "rri-gauge"
  version         TEXT NOT NULL,
  category        TEXT NOT NULL,
  -- "risk"|"economic"|"social"|"simulation"|"network"|"temporal"
  display_name    TEXT NOT NULL,
  description     TEXT,
  parameters_schema JSONB NOT NULL DEFAULT '{}',
  required_engines  TEXT[] DEFAULT '{}',
  -- which Phase 1-8 engines this block needs
  confidence_metric BOOLEAN DEFAULT FALSE,
  exportable       BOOLEAN DEFAULT TRUE,
  drill_down       BOOLEAN DEFAULT FALSE,
  status           TEXT DEFAULT 'active'
);

-- Block instances (rendered in a message)
CREATE TABLE block_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES investigation_messages(id) ON DELETE CASCADE,
  block_id        TEXT NOT NULL,
  parameters      JSONB DEFAULT '{}',
  data_snapshot   JSONB DEFAULT '{}',   -- data at time of render
  confidence      NUMERIC(4,3),
  exported        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_user ON investigations(user_id);
CREATE INDEX idx_inv_status ON investigations(status);
CREATE INDEX idx_im_investigation ON investigation_messages(investigation_id);
CREATE INDEX idx_im_intent ON investigation_messages(intent);
CREATE INDEX idx_bi_message ON block_instances(message_id);
```

---

## Core Service: `workspace_orchestrator.py`

```python
# backend/app/services/workspace_orchestrator.py

class WorkspaceOrchestrator:

    async def process_query(
        self,
        query: str,
        investigation_id: str,
        user_id: str = None
    ) -> dict:
        """
        Main orchestration pipeline.
        Returns structured response envelope.
        """
        # 1. Load investigation context
        investigation = await self._load_investigation(investigation_id)
        snapshot = await self._load_latest_snapshot()

        # 2. Route intent
        intent = await self._route_intent(query, investigation)

        # 3. Select capabilities
        capabilities = self._select_capabilities(intent, query, snapshot)

        # 4. Execute in parallel
        results = await self._execute_parallel(
            query, intent, capabilities,
            investigation, snapshot
        )

        # 5. Synthesize
        response = await self._synthesize(
            query, intent, results,
            investigation, snapshot
        )

        # 6. Store message
        message = await self._store_message(
            investigation_id, query, intent, response
        )

        # 7. Update investigation context
        await self._update_investigation_context(
            investigation_id, response, intent
        )

        return response


    async def _route_intent(
        self,
        query: str,
        investigation: dict
    ) -> str:
        """
        Classify query intent.

        Rules-based first (fast, free):
        - Contains "what if" / "simulate" / "scenario" → "simulation"
        - Contains "compare" / "vs" / "like" → "comparative"
        - Contains "watch" / "monitor" / "alert" → "monitoring"
        - Contains "predict" / "next" / "will" → "predictive"
        - Default → "analytical"

        LLM fallback for ambiguous queries only.
        """
        query_lower = query.lower()

        INTENT_RULES = [
            (["what if", "simulate", "scenario", "inject", "shock"],
             "simulation"),
            (["compare", " vs ", "versus", "like egypt", "like 2011",
              "similar to", "compared to"],
             "comparative"),
            (["watch", "monitor", "alert me", "notify", "track"],
             "monitoring"),
            (["predict", "will ", "next week", "forecast", "probability of"],
             "predictive"),
        ]

        for keywords, intent in INTENT_RULES:
            if any(kw in query_lower for kw in keywords):
                return intent

        # LLM fallback — only when rules fail
        return await self._llm_route_intent(query)


    def _select_capabilities(
        self,
        intent: str,
        query: str,
        snapshot: dict
    ) -> dict:
        """
        Decide which engines and blocks to activate.
        Returns capability map with block list + engine calls.

        Rules: intent → default capability set
        Then: query keyword modifiers add/remove capabilities
        """
        # Base capability sets per intent
        BASE_CAPABILITIES = {
            "analytical": {
                "engines": ["rag", "actor_posture"],
                "blocks": ["rri-gauge", "actor-timeline", "confidence-meter"]
            },
            "predictive": {
                "engines": ["rag", "simulation", "actor_posture"],
                "blocks": ["monte-carlo-futures", "rri-gauge",
                           "protest-sir", "confidence-meter"]
            },
            "comparative": {
                "engines": ["rag", "doctrine"],
                "blocks": ["comparative-historical", "economic-stress",
                           "elite-network", "rri-gauge"]
            },
            "monitoring": {
                "engines": ["rag", "actor_posture"],
                "blocks": ["governorate-heatmap", "rri-gauge",
                           "narrative-warfare"]
            },
            "simulation": {
                "engines": ["simulation", "deliberation", "actor_posture"],
                "blocks": ["monte-carlo-futures", "governorate-heatmap",
                           "actor-timeline", "confidence-meter"]
            }
        }

        capabilities = BASE_CAPABILITIES.get(intent, BASE_CAPABILITIES["analytical"]).copy()

        # Keyword modifiers
        query_lower = query.lower()

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
        }

        for keyword, (collection, action, item) in MODIFIERS.items():
            if keyword in query_lower:
                if action == "add" and item not in capabilities[collection]:
                    capabilities[collection].append(item)

        # Cap at 5 blocks max — cognitive load limit
        capabilities["blocks"] = capabilities["blocks"][:5]

        return capabilities


    async def _execute_parallel(
        self,
        query: str,
        intent: str,
        capabilities: dict,
        investigation: dict,
        snapshot: dict
    ) -> dict:
        """
        Run all required engines in parallel.
        """
        tasks = {}

        if "rag" in capabilities["engines"]:
            tasks["rag"] = rag_synthesis.synthesize(
                query=query,
                trigger_source="workspace",
                rri_context=snapshot,
                max_live_chunks=5,
                max_doctrine_chunks=3
            )

        if "actor_posture" in capabilities["engines"]:
            tasks["postures"] = actor_engine.get_all_postures(snapshot)

        if "deliberation" in capabilities["engines"]:
            tasks["deliberation"] = deliberation_engine.run(
                scenario=query,
                trigger_type="workspace",
                state_version_id=snapshot["state_version_id"],
                is_simulation=(intent == "simulation")
            )

        if "simulation" in capabilities["engines"]:
            # Extract scenario from query or use closest library match
            scenario_id = await self._match_scenario(query)
            tasks["simulation"] = simulation_engine.run(
                scenario_id=scenario_id,
                base_state_version_id=snapshot["state_version_id"],
                mc_iterations=500,   # faster for workspace (full=1000)
                time_horizon_days=30
            )

        if "doctrine" in capabilities["engines"]:
            tasks["doctrine"] = doctrine_client.search_doctrine(
                query=query,
                limit=3
            )

        # Execute all in parallel
        results = {}
        task_results = await asyncio.gather(
            *tasks.values(),
            return_exceptions=True
        )
        for key, result in zip(tasks.keys(), task_results):
            if not isinstance(result, Exception):
                results[key] = result

        return results


    async def _synthesize(
        self,
        query: str,
        intent: str,
        results: dict,
        investigation: dict,
        snapshot: dict
    ) -> dict:
        """
        Generate narrative + parameterize blocks + score confidence.
        """
        # Build context for LLM
        context_parts = []

        if "rag" in results:
            context_parts.append(
                f"INTELLIGENCE EVIDENCE:\n{self._format_rag(results['rag'])}"
            )

        if "postures" in results:
            context_parts.append(
                f"ACTOR POSTURES:\n{self._format_postures(results['postures'])}"
            )

        if "deliberation" in results:
            context_parts.append(
                f"DELIBERATION OUTPUT:\n{self._format_deliberation(results['deliberation'])}"
            )

        if "doctrine" in results:
            context_parts.append(
                f"DOCTRINE CONTEXT:\n{self._format_doctrine(results['doctrine'])}"
            )

        system_prompt = f"""
You are the TunisiaIntel cognitive intelligence engine.
Intent classified as: {intent}
Current RRI: {snapshot['rri']} | Phase: {snapshot['state_phase']}
Investigation context: {investigation.get('title', 'New Investigation')}
Pinned actors: {investigation.get('pinned_actors', [])}

{chr(10).join(context_parts)}

Generate a structured intelligence response as JSON:
{{
  "narrative": "3-5 sentence analytical response grounded in evidence",
  "key_finding": "single most important insight in one sentence",
  "confidence": 0.0-1.0,
  "confidence_rationale": "why this confidence level",
  "citations": [...],  // from evidence above
  "follow_up_actions": [
    // 2-3 suggested next queries the analyst might want to run
    "Simulate: ...",
    "Drill down: ...",
    "Monitor: ..."
  ],
  "hypothesis_update": {{
    // if this response confirms or challenges an active hypothesis
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
- Output valid JSON only
"""

        response_text = await llm_client.generate(
            prompt=query,
            system=system_prompt,
            response_format="json"
        )
        synthesis = json.loads(response_text)

        # Parameterize blocks
        blocks = await self._parameterize_blocks(
            capabilities_blocks=results.get("_blocks", []),
            synthesis=synthesis,
            results=results,
            snapshot=snapshot,
            query=query,
            intent=intent
        )

        return {
            "narrative": synthesis["narrative"],
            "key_finding": synthesis["key_finding"],
            "confidence": synthesis["confidence"],
            "confidence_rationale": synthesis["confidence_rationale"],
            "citations": synthesis["citations"],
            "follow_up_actions": synthesis["follow_up_actions"],
            "hypothesis_update": synthesis.get("hypothesis_update"),
            "blocks": blocks,
            "intent": intent,
            "engines_called": list(results.keys()),
            "state_version_id": snapshot["state_version_id"]
        }


    async def _parameterize_blocks(
        self,
        capabilities_blocks: list,
        synthesis: dict,
        results: dict,
        snapshot: dict,
        query: str,
        intent: str
    ) -> list:
        """
        For each selected block, generate its parameters
        from the query context and engine results.
        """
        parameterized = []

        BLOCK_PARAMETERIZERS = {
            "rri-gauge": self._param_rri_gauge,
            "governorate-heatmap": self._param_heatmap,
            "monte-carlo-futures": self._param_monte_carlo,
            "actor-timeline": self._param_actor_timeline,
            "elite-network": self._param_elite_network,
            "economic-stress": self._param_economic_stress,
            "narrative-warfare": self._param_narrative_warfare,
            "comparative-historical": self._param_comparative,
            "protest-sir": self._param_protest_sir,
            "water-stress": self._param_water_stress,
            "confidence-meter": self._param_confidence_meter,
            "migration-flow": self._param_migration_flow,
        }

        for block_id in capabilities_blocks:
            parameterizer = BLOCK_PARAMETERIZERS.get(block_id)
            if parameterizer:
                params = await parameterizer(
                    query, synthesis, results, snapshot
                )
                parameterized.append({
                    "block_id": block_id,
                    "parameters": params,
                    "data_snapshot": self._extract_block_data(
                        block_id, results, snapshot
                    ),
                    "confidence": synthesis["confidence"]
                })

        return parameterized


    async def _update_investigation_context(
        self,
        investigation_id: str,
        response: dict,
        intent: str
    ):
        """
        Update investigation after each message:
        - Extract new actors mentioned → add to pinned if high relevance
        - Update hypothesis confidence if response touches one
        - Increment message_count
        """
        updates = {"message_count": "message_count + 1"}

        # Hypothesis update
        if response.get("hypothesis_update"):
            hu = response["hypothesis_update"]
            # Update confidence of matched hypothesis
            # (merge logic in Supabase JSONB)

        await supabase.table("investigations").update(updates).eq(
            "investigation_id", investigation_id
        )
```

---

## Block Parameterizers (key examples)

```python
async def _param_rri_gauge(self, query, synthesis, results, snapshot):
    return {
        "current_rri": snapshot["rri"],
        "p_revolution": snapshot["p_revolution"],
        "state_phase": snapshot["state_phase"],
        "velocity": snapshot.get("velocity"),
        "mc_p10": snapshot.get("mc_p_revolution_p10"),
        "mc_p90": snapshot.get("mc_p_revolution_p90"),
        "show_components": True,
        "highlight_variable": None   # set if query mentions specific variable
    }

async def _param_monte_carlo(self, query, synthesis, results, snapshot):
    sim = results.get("simulation", {})
    return {
        "run_id": sim.get("run_id"),
        "outcome_distribution": sim.get("outcome_distribution", {}),
        "rri_trajectory": sim.get("rri_trajectory", []),
        "p_revolution_range": sim.get("p_revolution_range", {}),
        "sensitivity_ranking": sim.get("sensitivity_ranking", []),
        "time_horizon_days": 30
    }

async def _param_comparative(self, query, synthesis, results, snapshot):
    # Detect which historical case is being compared
    CASE_KEYWORDS = {
        "egypt": "EGY_2010_2011",
        "2011": "TUN_2011_REVOLUTION",
        "2008": "TUN_2008_GAFSA",
        "2013": "TUN_2013_CRISIS",
        "2021": "TUN_2021_COUP",
        "libya": "LBY_2011_COLLAPSE"
    }
    query_lower = query.lower()
    reference_case = next(
        (case for kw, case in CASE_KEYWORDS.items() if kw in query_lower),
        "TUN_2011_REVOLUTION"  # default
    )
    return {
        "current_state": snapshot,
        "reference_case_id": reference_case,
        "dimensions": [
            "rri_trajectory", "economic_indicators",
            "elite_cohesion", "protest_velocity", "military_posture"
        ]
    }

async def _param_confidence_meter(self, query, synthesis, results, snapshot):
    return {
        "overall_confidence": synthesis["confidence"],
        "data_freshness_hours": snapshot.get("data_freshness_hours", 0),
        "variables_used": snapshot.get("variables_used", 0),
        "rag_chunks_used": len(results.get("rag", {}).get("citations", [])),
        "model_calibration": snapshot.get("confidence_overall", 0),
        "uncertainty_breakdown": {
            "data": 1 - min(1, snapshot.get("data_freshness_hours", 24) / 24),
            "model": snapshot.get("confidence_overall", 0.7),
            "structural": 0.85,   # fixed — we know our blind spots
            "epistemic": synthesis["confidence"]
        }
    }
```

---

## API Endpoints

```
POST /api/workspace/investigations
  body: { title? }
  → creates new investigation, returns investigation_id

GET  /api/workspace/investigations
  → list all investigations for user

GET  /api/workspace/investigations/:investigation_id
  → full investigation with all messages

POST /api/workspace/investigations/:investigation_id/query
  body: { query }
  → main pipeline, returns structured response envelope
  → streams narrative via SSE, blocks follow when ready

GET  /api/workspace/investigations/:investigation_id/messages
  → message history

POST /api/workspace/investigations/:investigation_id/watchlist
  body: { type, id, threshold }
  → add item to watchlist

POST /api/workspace/investigations/:investigation_id/export
  → export investigation as PDF/Markdown brief

GET  /api/workspace/blocks
  → block registry

POST /api/workspace/quick
  body: { macro: "morning_brief"|"escalation_watch"|"economic_snapshot" }
  → runs predefined query, creates investigation, returns response
```

---

## Structured Response Envelope

```typescript
interface IntelligenceResponse {
  meta: {
    query_id: string;
    investigation_id: string;
    timestamp: string;
    intent: string;
    state_version_id: string;
    engines_called: string[];
    latency_ms: number;
  };

  response: {
    narrative: string;            // 3-5 sentence analytical prose
    key_finding: string;          // single most important insight
    confidence: number;           // 0-1
    confidence_rationale: string;
    citations: Citation[];
    follow_up_actions: string[];  // suggested next queries
    hypothesis_update?: {
      hypothesis: string;
      update_type: 'confirms' | 'challenges' | 'neutral';
      delta_confidence: number;
    };
  };

  blocks: BlockInstance[];        // ordered list for canvas rendering

  context_updates: {
    new_actors_mentioned: string[];
    hypotheses_updated: string[];
    watchlist_triggered: string[];
  };
}
```

---

## Macro Triggers

Three one-click macros available from the top bar.
Each runs a predefined orchestration pipeline.

```python
MACRO_QUERIES = {
    "morning_brief": {
        "query": "Generate a morning intelligence brief: "
                 "what changed overnight, what requires attention today, "
                 "and what is the 7-day risk outlook?",
        "intent": "analytical",
        "blocks": ["rri-gauge", "actor-timeline",
                   "narrative-warfare", "confidence-meter"],
        "engines": ["rag", "actor_posture"]
    },
    "escalation_watch": {
        "query": "What are the current escalation signals? "
                 "Which causal chains are active and "
                 "what is the cascade probability in the next 14 days?",
        "intent": "predictive",
        "blocks": ["monte-carlo-futures", "governorate-heatmap",
                   "protest-sir", "confidence-meter"],
        "engines": ["rag", "simulation", "actor_posture"]
    },
    "economic_snapshot": {
        "query": "Provide current economic stress assessment: "
                 "FX reserves, inflation trajectory, IMF status, "
                 "and subsidy sustainability.",
        "intent": "analytical",
        "blocks": ["economic-stress", "rri-gauge",
                   "elite-network", "confidence-meter"],
        "engines": ["rag", "doctrine"]
    }
}
```

---

## Frontend: `CognitiveWorkspace.tsx`

```tsx
// src/components/CognitiveWorkspace/CognitiveWorkspace.tsx

export const CognitiveWorkspace: React.FC = () => {
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamedNarrative, setStreamedNarrative] = useState('');

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    setStreamedNarrative('');

    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    }]);

    // Stream narrative via SSE
    const eventSource = new EventSource(
      `/api/workspace/investigations/${investigationId}/query/stream`
    );

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'narrative_token') {
        setStreamedNarrative(prev => prev + data.token);
      }
      if (data.type === 'complete') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          response: data.response,
          blocks: data.blocks,
          timestamp: new Date().toISOString()
        }]);
        setStreamedNarrative('');
        setIsProcessing(false);
        eventSource.close();
      }
    };
  };

  return (
    <div className="cognitive-workspace">
      <WorkspaceHeader onMacro={handleMacro} />
      <div className="workspace-body">
        <ConversationPanel
          messages={messages}
          isProcessing={isProcessing}
          streamedNarrative={streamedNarrative}
          onQuery={handleQuery}
          onFollowUp={handleQuery}
        />
        <IntelligenceCanvas
          messages={messages}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};
```

---

## Component: `ConversationPanel.tsx`

```tsx
// Left panel — conversation thread

export const ConversationPanel: React.FC<Props> = ({
  messages, isProcessing, streamedNarrative,
  onQuery, onFollowUp
}) => {
  return (
    <div className="conversation-panel">

      {/* Message thread */}
      <div className="message-thread">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} onFollowUp={onFollowUp} />
        ))}

        {/* Streaming narrative */}
        {isProcessing && streamedNarrative && (
          <div className="message-bubble assistant streaming">
            <span className="narrative-text">{streamedNarrative}</span>
            <span className="cursor-blink">▊</span>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && !streamedNarrative && (
          <div className="processing-indicator">
            <span>ROUTING</span>
            <span>RETRIEVING</span>
            <span>SYNTHESIZING</span>
          </div>
        )}
      </div>

      {/* Query input */}
      <QueryInput
        onSubmit={onQuery}
        disabled={isProcessing}
        placeholder="Ask anything about Tunisia..."
      />
    </div>
  );
};

// Message bubble with follow-up actions
const MessageBubble: React.FC<{ message: Message; onFollowUp: Function }> = ({
  message, onFollowUp
}) => {
  if (message.role === 'user') {
    return (
      <div className="message-bubble user">
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className="message-bubble assistant">
      {/* Key finding highlight */}
      {message.response?.key_finding && (
        <div className="key-finding">
          {message.response.key_finding}
        </div>
      )}

      {/* Narrative */}
      <p className="narrative-text">{message.response?.narrative}</p>

      {/* Confidence */}
      <div className="confidence-row">
        <span className="confidence-label">CONFIDENCE</span>
        <span className="confidence-value">
          {((message.response?.confidence ?? 0) * 100).toFixed(0)}%
        </span>
        <span className="confidence-rationale">
          {message.response?.confidence_rationale}
        </span>
      </div>

      {/* Citations */}
      {message.response?.citations?.length > 0 && (
        <CitationList citations={message.response.citations} />
      )}

      {/* Follow-up actions */}
      {message.response?.follow_up_actions?.length > 0 && (
        <div className="follow-up-actions">
          {message.response.follow_up_actions.map((action, i) => (
            <button
              key={i}
              className="follow-up-btn"
              onClick={() => onFollowUp(action)}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Component: `IntelligenceCanvas.tsx`

```tsx
// Right panel — dynamic block grid

export const IntelligenceCanvas: React.FC<Props> = ({
  messages, isProcessing
}) => {
  // Get blocks from latest assistant message
  const latestBlocks = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find(m => m.role === 'assistant');
    return lastAssistant?.blocks ?? [];
  }, [messages]);

  // Grid layout based on block count
  const gridClass = useMemo(() => {
    const n = latestBlocks.length;
    if (n === 1) return 'grid-1';
    if (n === 2) return 'grid-2';
    if (n <= 4) return 'grid-2x2';
    return 'grid-2x3';
  }, [latestBlocks.length]);

  return (
    <div className="intelligence-canvas">
      <div className="canvas-header">
        <span>INTELLIGENCE CANVAS</span>
        {latestBlocks.length > 0 && (
          <button className="export-btn">EXPORT BRIEF</button>
        )}
      </div>

      <div className={`block-grid ${gridClass}`}>
        {latestBlocks.map((block, i) => (
          <BlockRenderer
            key={`${block.block_id}-${i}`}
            block={block}
          />
        ))}

        {isProcessing && latestBlocks.length === 0 && (
          <div className="canvas-loading">
            <span>ASSEMBLING INTELLIGENCE...</span>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Component: `BlockRenderer.tsx`

```tsx
// Routes block_id to the correct React component

import { RRIGaugeBlock } from './blocks/RRIGaugeBlock';
import { GovernorateHeatmapBlock } from './blocks/GovernorateHeatmapBlock';
import { MonteCarloBlock } from './blocks/MonteCarloBlock';
import { ActorTimelineBlock } from './blocks/ActorTimelineBlock';
import { EliteNetworkBlock } from './blocks/EliteNetworkBlock';
import { EconomicStressBlock } from './blocks/EconomicStressBlock';
import { NarrativeWarfareBlock } from './blocks/NarrativeWarfareBlock';
import { ComparativeHistoricalBlock } from './blocks/ComparativeHistoricalBlock';
import { ProtestSIRBlock } from './blocks/ProtestSIRBlock';
import { ConfidenceMeterBlock } from './blocks/ConfidenceMeterBlock';
import { WaterStressBlock } from './blocks/WaterStressBlock';
import { MigrationFlowBlock } from './blocks/MigrationFlowBlock';

const BLOCK_COMPONENTS: Record<string, React.FC<BlockProps>> = {
  'rri-gauge':              RRIGaugeBlock,
  'governorate-heatmap':    GovernorateHeatmapBlock,
  'monte-carlo-futures':    MonteCarloBlock,
  'actor-timeline':         ActorTimelineBlock,
  'elite-network':          EliteNetworkBlock,
  'economic-stress':        EconomicStressBlock,
  'narrative-warfare':      NarrativeWarfareBlock,
  'comparative-historical': ComparativeHistoricalBlock,
  'protest-sir':            ProtestSIRBlock,
  'confidence-meter':       ConfidenceMeterBlock,
  'water-stress':           WaterStressBlock,
  'migration-flow':         MigrationFlowBlock,
};

export const BlockRenderer: React.FC<{ block: BlockInstance }> = ({ block }) => {
  const Component = BLOCK_COMPONENTS[block.block_id];

  if (!Component) {
    return (
      <div className="block-unknown">
        Unknown block: {block.block_id}
      </div>
    );
  }

  return (
    <div className="block-wrapper">
      <div className="block-header">
        <span className="block-id">{block.block_id}</span>
        <span className="block-confidence">
          {((block.confidence ?? 0) * 100).toFixed(0)}%
        </span>
      </div>
      <Component
        parameters={block.parameters}
        data={block.data_snapshot}
        confidence={block.confidence}
      />
    </div>
  );
};
```

---

## CSS

```css
/* src/components/CognitiveWorkspace/CognitiveWorkspace.css */

.cognitive-workspace {
  width: 100%;
  height: 100vh;
  background: #080B0F;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', monospace;
  color: #F9FAFB;
}

.workspace-body {
  flex: 1;
  display: grid;
  grid-template-columns: 420px 1fr;
  overflow: hidden;
}

/* Conversation panel */
.conversation-panel {
  background: #0D1117;
  border-right: 1px solid #1F2937;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-thread {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-bubble {
  padding: 12px 14px;
  border-radius: 4px;
  max-width: 100%;
}
.message-bubble.user {
  background: #161B22;
  border-left: 2px solid #374151;
  font-size: 13px;
  color: #9CA3AF;
}
.message-bubble.assistant {
  background: #0D1117;
  border-left: 2px solid #10B981;
}

.key-finding {
  font-size: 12px;
  font-weight: bold;
  color: #F9FAFB;
  padding: 8px 10px;
  background: #161B22;
  border-left: 3px solid #10B981;
  margin-bottom: 10px;
  line-height: 1.4;
}

.narrative-text {
  font-size: 12px;
  color: #D1D5DB;
  line-height: 1.6;
  font-family: 'Georgia', serif;  /* prose reads better in serif */
}

.confidence-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 10px;
}
.confidence-label { color: #4B5563; letter-spacing: 0.1em; }
.confidence-value { color: #10B981; font-weight: bold; }
.confidence-rationale { color: #6B7280; font-style: italic; }

.follow-up-btn {
  display: inline-block;
  margin: 4px 4px 0 0;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid #374151;
  color: #9CA3AF;
  font-family: monospace;
  font-size: 10px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.15s;
}
.follow-up-btn:hover {
  border-color: #10B981;
  color: #10B981;
}

/* Processing indicator */
.processing-indicator {
  display: flex;
  gap: 16px;
  padding: 12px;
  font-size: 10px;
  letter-spacing: 0.15em;
}
.processing-indicator span {
  color: #374151;
  animation: processing-pulse 1.5s ease-in-out infinite;
}
.processing-indicator span:nth-child(2) { animation-delay: 0.3s; }
.processing-indicator span:nth-child(3) { animation-delay: 0.6s; }

@keyframes processing-pulse {
  0%, 100% { color: #374151; }
  50%       { color: #10B981; }
}

/* Query input */
.query-input-container {
  padding: 12px 16px;
  border-top: 1px solid #1F2937;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.query-input {
  flex: 1;
  background: #161B22;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #F9FAFB;
  font-family: monospace;
  font-size: 12px;
  padding: 10px 12px;
  resize: none;
  outline: none;
  min-height: 40px;
  max-height: 120px;
}
.query-input:focus { border-color: #10B981; }
.query-submit-btn {
  background: #10B981;
  border: none;
  color: #080B0F;
  font-family: monospace;
  font-size: 11px;
  font-weight: bold;
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 2px;
}

/* Intelligence canvas */
.intelligence-canvas {
  background: #080B0F;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.canvas-header {
  padding: 10px 16px;
  border-bottom: 1px solid #1F2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #4B5563;
}
.export-btn {
  background: transparent;
  border: 1px solid #374151;
  color: #9CA3AF;
  font-family: monospace;
  font-size: 10px;
  padding: 4px 12px;
  cursor: pointer;
}

/* Block grid layouts */
.block-grid {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: grid;
  gap: 12px;
  align-content: start;
}
.grid-1   { grid-template-columns: 1fr; }
.grid-2   { grid-template-columns: 1fr 1fr; }
.grid-2x2 { grid-template-columns: 1fr 1fr; }
.grid-2x3 { grid-template-columns: 1fr 1fr; }

/* Block wrapper */
.block-wrapper {
  background: #0D1117;
  border: 1px solid #1F2937;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.block-header {
  padding: 6px 10px;
  border-bottom: 1px solid #1F2937;
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  letter-spacing: 0.12em;
}
.block-id { color: #4B5563; }
.block-confidence { color: #10B981; }
```

---

## Sidebar Wiring

```tsx
// Two-line addition to sidebar config

{
  id: 'cognitive-workspace',
  label: 'Intelligence Workspace',
  icon: 'MessageSquare',
  component: CognitiveWorkspace,
  category: 'command',
  truthClass: 'REAL'
}
```

---

## Seed: Block Registry

```python
BLOCK_REGISTRY_SEED = [
  { "block_id": "rri-gauge",
    "version": "2.1.0",
    "category": "risk",
    "display_name": "Revolution Risk Index",
    "required_engines": ["canonical_state"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": True },

  { "block_id": "governorate-heatmap",
    "version": "1.0.0",
    "category": "risk",
    "display_name": "Governorate Risk Map",
    "required_engines": ["canonical_state"],
    "confidence_metric": False,
    "exportable": True,
    "drill_down": True },

  { "block_id": "monte-carlo-futures",
    "version": "1.0.0",
    "category": "simulation",
    "display_name": "Monte Carlo Scenario",
    "required_engines": ["simulation"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": False },

  { "block_id": "actor-timeline",
    "version": "1.0.0",
    "category": "network",
    "display_name": "Actor Event Timeline",
    "required_engines": ["rag", "actor_posture"],
    "confidence_metric": False,
    "exportable": True,
    "drill_down": True },

  { "block_id": "elite-network",
    "version": "1.0.0",
    "category": "network",
    "display_name": "Elite Cohesion Network",
    "required_engines": ["actor_posture", "canonical_state"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": True },

  { "block_id": "economic-stress",
    "version": "1.0.0",
    "category": "economic",
    "display_name": "Economic Stress Indicators",
    "required_engines": ["canonical_state"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": False },

  { "block_id": "narrative-warfare",
    "version": "1.0.0",
    "category": "social",
    "display_name": "Narrative Warfare Engine",
    "required_engines": ["rag"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": False },

  { "block_id": "comparative-historical",
    "version": "1.0.0",
    "category": "temporal",
    "display_name": "Historical Comparison",
    "required_engines": ["rag", "doctrine"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": False },

  { "block_id": "protest-sir",
    "version": "1.0.0",
    "category": "social",
    "display_name": "Protest Spread (SIR)",
    "required_engines": ["canonical_state"],
    "confidence_metric": True,
    "exportable": False,
    "drill_down": False },

  { "block_id": "confidence-meter",
    "version": "1.0.0",
    "category": "risk",
    "display_name": "Uncertainty Budget",
    "required_engines": ["canonical_state", "rag"],
    "confidence_metric": True,
    "exportable": True,
    "drill_down": False },

  { "block_id": "water-stress",
    "version": "1.0.0",
    "category": "economic",
    "display_name": "Water Scarcity Index",
    "required_engines": ["canonical_state"],
    "confidence_metric": False,
    "exportable": True,
    "drill_down": False },

  { "block_id": "migration-flow",
    "version": "1.0.0",
    "category": "social",
    "display_name": "Migration Pressure",
    "required_engines": ["canonical_state"],
    "confidence_metric": False,
    "exportable": True,
    "drill_down": False },
]
```

---

## Validation Tests

```
Test 1: Analytical query
  Input: "What is driving RRI elevation this week?"
  Expected:
  - Intent: "analytical"
  - Blocks: rri-gauge + actor-timeline + confidence-meter
  - Narrative cites at least 2 RAG chunks
  - Follow-up actions include at least one simulation suggestion
  - Response < 15 seconds

Test 2: Simulation query
  Input: "What happens if UGTT calls a general strike next month?"
  Expected:
  - Intent: "simulation"
  - Engines called: simulation + deliberation + actor_posture
  - Blocks: monte-carlo-futures + governorate-heatmap
  - UGTT strike probability in output > 0.70

Test 3: Comparative query
  Input: "Compare Tunisia today to Egypt before 2011"
  Expected:
  - Intent: "comparative"
  - Blocks: comparative-historical + rri-gauge + economic-stress + elite-network
  - Doctrine citations present (regime-survival or economic-crisis workspace)
  - Reference case: EGY_2010_2011

Test 4: Morning brief macro
  Click "Morning Brief" button
  Expected:
  - New investigation created
  - 4 blocks rendered: rri-gauge + actor-timeline + narrative-warfare + confidence-meter
  - Narrative covers overnight changes + today's risks + 7-day outlook
  - Confidence score present

Test 5: Investigation persistence
  Run 3 queries in sequence
  Expected:
  - All 3 messages stored in investigation_messages
  - Context accumulates: actors mentioned in Q1 appear in context for Q3
  - Follow-up action from Q1 response executable in Q2 without reformulation
```

---

## Implementation Order

```
1. Migration 007_workspace.sql                            → 30 min
2. workspace_orchestrator.py — full service               → 5 hrs
3. Seed block_registry (12 blocks)                        → 30 min
4. API endpoints                                          → 1 hr
5. CognitiveWorkspace.tsx root                            → 30 min
6. ConversationPanel.tsx + MessageBubble                  → 2 hrs
7. IntelligenceCanvas.tsx + BlockRenderer.tsx             → 1 hr
8. CSS architecture                                       → 1 hr
9. Macro triggers (3 macros)                              → 30 min
10. Sidebar wiring                                        → 15 min
11. SSE streaming for narrative                           → 1 hr
12. Run 5 validation tests                                → 2 hrs
```

Total: ~2 days.

---

## What Phase 9 Completes

The full TunisiaIntel system is now:

```
PHASE 1:  One truth          → canonical state
PHASE 2:  Why it escalates   → causal ontology
PHASE 3:  What happened      → RAG memory
PHASE 4:  Who does what      → actor cognition
PHASE 5:  Why patterns repeat→ doctrine library
PHASE 6:  What they decide   → deliberation engine
PHASE 7:  What happens next  → simulation chamber
PHASE 8:  The sovereign table→ High Table UI
PHASE 9:  Ask anything       → cognitive workspace
```

An analyst opens the workspace.
Types: "What if Tunisia removes subsidies during a drought?"
The system routes the intent, retrieves evidence, runs
a simulation, convenes the High Table, synthesizes a
grounded response, and assembles five intelligence blocks
— all in under 15 seconds.

That is the sovereign intelligence cognition system.

---

*Cognitive Workspace v1.0 — 2026-05-21*
