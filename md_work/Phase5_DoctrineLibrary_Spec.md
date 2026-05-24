# Phase 5 — Agency Brain / Doctrine Library
## Intelligence Cognition Substrate — TunisiaIntel

**Version:** 1.0  
**Date:** 2026-05-21  
**Depends on:** Phase 3 (RAG substrate), Phase 4 (actor profiles)

---

## What This Phase Builds

The reasoning substrate beneath all agents and simulations.

Phase 3 gave the system **memory of events** (what happened).  
Phase 5 gives the system **knowledge of how things work** (why they happen and what to expect).

Without doctrine, agents pattern-match against recent events only.  
With doctrine, agents reason from established frameworks — escalation theory, regime survival logic, crowd behavior, economic crisis contagion — and apply them to Tunisia-specific context.

The end state: when the deliberation engine asks "what does the Presidency do under fiscal stress?", the answer is grounded in both Tunisia's historical behavior AND established statecraft doctrine — not just the last 30 days of articles.

---

## Architecture: Option C (Hybrid)

```
QUERY (from brief engine / agent / terminal)
        │
        ├── pgvector search (Phase 3)
        │     Live signals: articles, Telegram, RRI variables
        │     Freshness: hours to days
        │
        └── AnythingLLM API (Phase 5)
              Doctrine: books, papers, reports, methodology
              Freshness: static (updated manually)
                │
                ▼
        rag_synthesis.py
        Merges both source types
        Weights: live signals 0.60, doctrine 0.40
        Generates grounded output with citations from both
```

---

## AnythingLLM Setup

### Docker deployment

```yaml
# docker-compose.yml addition

anythingllm:
  image: mintplexlabs/anythingllm:latest
  container_name: tunisiaintel_doctrine
  ports:
    - "3001:3001"
  volumes:
    - ./doctrine_storage:/app/server/storage
  environment:
    - STORAGE_DIR=/app/server/storage
    - JWT_SECRET=${ANYTHINGLLM_JWT_SECRET}
    - LLM_PROVIDER=openrouter          # or groq
    - OPEN_ROUTER_API_KEY=${OPENROUTER_API_KEY}
    - EMBEDDING_ENGINE=openai
    - OPEN_AI_KEY=${OPENAI_API_KEY}    # for embeddings only
    - VECTOR_DB=lancedb                # built-in, no extra infra
  restart: unless-stopped
```

### Workspace structure

One workspace per doctrine domain. Keeps retrieval scoped and clean.

```
AnythingLLM Workspaces:
├── intelligence-methodology      # Kent, Heuer, CIA analytic techniques
├── regime-survival               # Authoritarian resilience, selectorate theory
├── protest-dynamics              # Crowd behavior, collective action, SIR theory
├── economic-crisis               # Fiscal stress, IMF dynamics, currency crisis
├── strategic-studies             # Statecraft, escalation theory, crisis bargaining
├── information-warfare           # PSYOP, narrative warfare, disinformation
├── tunisia-history               # Documented Tunisian political history 2000–2026
└── regional-context              # North Africa, Sahel, MENA geopolitics
```

### API authentication

```python
# backend/app/services/doctrine_client.py

ANYTHINGLLM_BASE = "http://localhost:3001/api"
ANYTHINGLLM_KEY  = os.getenv("ANYTHINGLLM_API_KEY")

headers = {
    "Authorization": f"Bearer {ANYTHINGLLM_KEY}",
    "Content-Type": "application/json"
}
```

---

## Doctrine Library: Priority Corpus

### Tier 1 — Must ingest before Phase 6 (deliberation engine depends on these)

| Document | Workspace | Why Critical |
|----------|-----------|--------------|
| Richards Heuer — *Psychology of Intelligence Analysis* | intelligence-methodology | Structured analytic techniques, cognitive bias framework |
| Sherman Kent — *Strategic Intelligence* | intelligence-methodology | Intelligence analysis doctrine foundation |
| CIA — *A Tradecraft Primer* | intelligence-methodology | Structured analytic techniques (SAT) |
| Bruce Bueno de Mesquita — *The Logic of Political Survival* | regime-survival | Selectorate theory — explains elite loyalty math |
| Milan Svolik — *The Politics of Authoritarian Rule* | regime-survival | Coalition dynamics, military-authoritarian relations |
| Mancur Olson — *The Logic of Collective Action* | protest-dynamics | Why protests form or fail — collective action problem |
| Mark Beissinger — *Nationalist Mobilization* | protest-dynamics | Cascade and threshold models for mass mobilization |
| Thomas Schelling — *Arms and Influence* | strategic-studies | Escalation theory, coercive bargaining |
| Carmen Reinhart + Rogoff — *This Time Is Different* | economic-crisis | Sovereign debt crisis patterns — directly applicable |
| IMF — Tunisia Article IV Consultations (2019–2024) | economic-crisis | Ground truth: IMF's actual assessment of Tunisia |

### Tier 2 — Ingest within Phase 5

| Document | Workspace |
|----------|-----------|
| RAND — various Tunisia/North Africa papers | regional-context |
| ICG — Tunisia reports 2011–2026 | tunisia-history |
| Chatham House — North Africa briefs | regional-context |
| Carnegie — Arab Reform Bulletin Tunisia editions | tunisia-history |
| Arquilla + Ronfeldt — *Networks and Netwars* | information-warfare |
| Jacques Semelin — *Purify and Destroy* | protest-dynamics |
| Stathis Kalyvas — *The Logic of Violence in Civil War* | strategic-studies |
| World Bank — Tunisia Economic Monitor series | economic-crisis |
| Freedom House — Tunisia annual reports | regime-survival |

### Tier 3 — Ongoing additions

| Source | Workspace | Frequency |
|--------|-----------|-----------|
| New ICG Tunisia reports | tunisia-history | On publication |
| IMF Press releases on Tunisia | economic-crisis | On publication |
| TAP official statements (structured) | tunisia-history | Weekly batch |
| BCT annual reports | economic-crisis | Annual |
| UGTT congress documents | tunisia-history | As available |

---

## New Service: `doctrine_client.py`

```python
# backend/app/services/doctrine_client.py

async def search_doctrine(
    query: str,
    workspace: str = None,    # None = search all workspaces
    limit: int = 5
) -> list[dict]:
    """
    Query AnythingLLM for doctrine-relevant chunks.
    
    Returns:
    [
      {
        "chunk_id": "...",
        "workspace": "regime-survival",
        "source_document": "Bueno de Mesquita - Logic of Political Survival",
        "chunk_text": "...",
        "similarity": 0.84,
        "metadata": { "author": "...", "year": "...", "page": "..." }
      }
    ]
    """
    endpoint = f"{ANYTHINGLLM_BASE}/v1/workspace"
    if workspace:
        endpoint += f"/{workspace}/chat"
    
    payload = {
        "message": query,
        "mode": "query",        # retrieval only, no generation
        "sessionId": "doctrine-retrieval"
    }
    
    response = await httpx.post(endpoint, json=payload, headers=headers)
    return _parse_doctrine_chunks(response.json())


async def get_workspace_status() -> dict:
    """
    Returns document count, embedding status per workspace.
    Used by system health monitor.
    """


async def ingest_document(
    file_path: str,
    workspace: str,
    metadata: dict
) -> bool:
    """
    Programmatic ingestion for automated Tier 3 sources.
    Manual upload via AnythingLLM UI for Tier 1 + 2.
    """
```

---

## Updated `rag_synthesis.py`

Extend Phase 3 synthesis to merge both retrieval sources.

```python
# backend/app/services/rag_synthesis.py — updated

async def synthesize(
    query: str,
    trigger_source: str,
    chain_id: str = None,
    rri_context: dict = None,
    max_live_chunks: int = 5,
    max_doctrine_chunks: int = 3,       # NEW
    doctrine_workspace: str = None      # NEW — target specific workspace
) -> dict:
    """
    Merged RAG pipeline:
    1. Retrieve live signal chunks from pgvector (Phase 3)
    2. Retrieve doctrine chunks from AnythingLLM (Phase 5)
    3. Weight and merge: live 0.60, doctrine 0.40
    4. Generate with combined context
    5. Citations from both sources
    """

    # Step 1: live signals
    live_chunks = await search_live_signals(query, limit=max_live_chunks)

    # Step 2: doctrine
    doctrine_chunks = await doctrine_client.search_doctrine(
        query=query,
        workspace=doctrine_workspace,
        limit=max_doctrine_chunks
    )

    # Step 3: build merged context
    context = _build_merged_context(
        live_chunks,
        doctrine_chunks,
        live_weight=0.60,
        doctrine_weight=0.40
    )

    # Step 4: generate
    output = await llm_client.generate(
        prompt=query,
        system=SYNTHESIS_SYSTEM_PROMPT.format(context=context),
        response_format="json"
    )

    # Step 5: parse + log (same as Phase 3)
    return _parse_and_log(output, live_chunks, doctrine_chunks)
```

### Citation schema extension

```json
{
  "prose": "...",
  "citations": [
    {
      "chunk_id": "uuid",
      "source_type": "live",
      "source": "TAP",
      "date": "2026-05-19",
      "governorate": "gafsa",
      "excerpt": "max 15 words"
    },
    {
      "chunk_id": "uuid",
      "source_type": "doctrine",
      "source": "Bueno de Mesquita — Logic of Political Survival",
      "year": "2003",
      "workspace": "regime-survival",
      "excerpt": "max 15 words"
    }
  ],
  "confidence": 0.84,
  "live_chunks_used": 5,
  "doctrine_chunks_used": 3
}
```

---

## Doctrine-Actor Binding

Each actor profile references which doctrine workspaces are most relevant to its reasoning.

```python
ACTOR_DOCTRINE_WORKSPACES = {
    "PRES": ["regime-survival", "strategic-studies", "information-warfare"],
    "UGTT": ["protest-dynamics", "economic-crisis"],
    "ARM":  ["strategic-studies", "regime-survival"],
    "INT":  ["information-warfare", "strategic-studies"],
    "BCT":  ["economic-crisis"],
    "LPR":  ["protest-dynamics", "regime-survival"],
    "EU":   ["strategic-studies", "regional-context"],
    "DZA":  ["regional-context", "strategic-studies"],
    "UTICA":["economic-crisis"],
    "DONOR":["economic-crisis"],
    "PPL":  ["protest-dynamics", "tunisia-history"]
}
```

When `actor_engine.py` generates a posture assessment, it pulls doctrine from the actor's bound workspaces — not all workspaces. This keeps doctrine retrieval precise and prevents cross-domain noise.

---

## Tunisia History Workspace: Structured Event Format

The `tunisia-history` workspace is different from the others. Instead of ingesting raw PDFs, events are structured before ingestion.

```python
# Each historical event as a structured document

HISTORICAL_EVENTS = [
    {
        "event_id": "TUN_2008_GAFSA",
        "title": "Gafsa Mining Basin Uprising 2008",
        "date_start": "2008-01-05",
        "date_end": "2008-06-15",
        "trigger": "CPG hiring process corruption + unemployment",
        "actors_involved": ["CPG", "UGTT", "INT", "PPL"],
        "governorates": ["gafsa", "metlaoui", "redeyef"],
        "rri_estimate": 1.9,
        "escalation_sequence": [
            "hiring_corruption_revealed",
            "local_protest_gafsa",
            "security_crackdown",
            "ugtt_local_support",
            "national_attention",
            "military_containment",
            "negotiated_end"
        ],
        "outcome": "contained_with_force",
        "lessons": [
            "gafsa_grievance_permanent_not_resolved",
            "ugtt_split_local_vs_national_leadership",
            "security_force_containment_below_national_threshold"
        ],
        "chains_activated": ["CHAIN-02", "CHAIN-07"],
        "doctrine_parallels": ["olson_collective_action", "selectorate_local_elite"]
    },
    # ... 2011, 2013, 2021, 2023, 2024 events
]
```

Each event ingested as one structured document with rich metadata. This enables:
- Historical similarity queries (EQ.20 HPS)
- Chain validation (Phase 2 ontology)
- Actor backtest reconstruction (Phase 4)
- Simulation grounding (Phase 7)

---

## New Supabase Table: `doctrine_ingestion_log`

```sql
CREATE TABLE doctrine_ingestion_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_title  TEXT NOT NULL,
  workspace       TEXT NOT NULL,
  anythingllm_doc_id TEXT,
  ingested_at     TIMESTAMPTZ DEFAULT NOW(),
  chunk_count     INTEGER,
  status          TEXT DEFAULT 'pending',  -- pending|active|failed
  tier            INTEGER,                 -- 1|2|3
  metadata        JSONB DEFAULT '{}'
);
```

Tracks what's been ingested, when, and status. System health monitor checks this. Analyst knows what's in the doctrine library at any time.

---

## System Prompt: Doctrine-Aware Generation

When doctrine chunks are present in context, the synthesis system prompt changes:

```
You are a senior intelligence analyst for Tunisia with access to:
1. Live intelligence signals (recent articles, field reports, indicators)
2. Strategic doctrine library (intelligence methodology, statecraft, political science)

Your task: produce grounded analytical assessments that combine
current evidence with established frameworks.

RULES:
- Live signals establish WHAT is happening
- Doctrine establishes WHY it follows a pattern and WHAT to expect
- Every factual claim about current events cites a live signal chunk
- Every framework or pattern claim cites a doctrine source
- Do not present doctrine as current fact
- Do not present current events as universal patterns
- Output must be valid JSON matching the citation schema
- Confidence reflects both signal quality AND doctrine fit

LIVE SIGNALS ({n} fragments):
{live_chunks}

DOCTRINE CONTEXT ({m} fragments):
{doctrine_chunks}

RRI CONTEXT:
{rri_context}

QUERY: {query}
```

---

## API Endpoints

```
GET  /api/doctrine/status              → workspace list + document counts
GET  /api/doctrine/search?q=X&ws=Y    → search doctrine directly
POST /api/doctrine/ingest              → programmatic ingestion (Tier 3)
GET  /api/doctrine/events              → historical event library
GET  /api/doctrine/events/:event_id    → single historical event
```

---

## Implementation Order

```
1. Deploy AnythingLLM via Docker                              → 1 hr
2. Create 8 workspaces in AnythingLLM UI                     → 30 min
3. Manually ingest Tier 1 documents (10 docs)                → 2 hrs
4. doctrine_client.py service                                → 1 hr
5. Update rag_synthesis.py to merge both sources             → 2 hrs
6. Update citation schema + rag_query_log                    → 30 min
7. Build ACTOR_DOCTRINE_WORKSPACES binding in actor_engine   → 30 min
8. Structure + ingest 5 historical events (Tunisia history)  → 3 hrs
9. doctrine_ingestion_log table + health monitor wire-in     → 1 hr
10. Test: synthesize query that should use both sources      → 1 hr
```

Total: ~2 days.

---

## Acceptance Tests

```
1. GET /api/doctrine/status → 8 workspaces, Tier 1 docs showing active
2. POST /api/rag/synthesize { query: "what happens when Tunisia removes subsidies" }
   → citations include both TAP/live source AND Bueno de Mesquita or Reinhart/Rogoff
3. Actor posture query for PRES under fiscal stress
   → reasoning chain cites regime-survival workspace
4. Historical event query: "what happened in Gafsa 2008"
   → returns structured event from tunisia-history workspace
5. doctrine_ingestion_log → 10+ rows with status: active
```

---

## What This Enables

Once the doctrine layer is live:

- **Agents reason from frameworks**, not just pattern matching
- **Intelligence Briefs explain dynamics**, not just report events
- **Actor posture assessments cite theory** alongside current signals
- **The system can answer:** "Based on selectorate theory and Tunisia's 2011 precedent, military neutrality at current elite cohesion levels gives a 0.78 probability of regime concession within 14 days"
- **AnythingLLM's UI** lets you drag-drop new books and papers without touching code

That last point matters: the doctrine library grows continuously. New RAND papers, new ICG reports, new IMF assessments — all ingested through AnythingLLM's interface, immediately available to all agents.

---

*Phase 5 Doctrine Library v1.0 — 2026-05-21*
