# TunisiaIntel RAG Architecture Plan

## Philosophy

RAG in TunisiaIntel is **not** a chatbot feature.

It is the **memory and retrieval substrate** of the national intelligence system.

The goal is not:

* "chat with PDFs"
* generic AI search
* document QA

The goal is:

* grounded intelligence synthesis
* explainable AI briefings
* persistent national memory
* historical reconstruction
* actor/governorate intelligence retrieval
* simulation context injection
* analyst-grade traceability

RAG must disappear into the platform and power:

* Intelligence Briefs
* AI agents
* Terminal queries
* Dossier exports
* Twin Tunisia
* Timeline replay
* Scenario generation
* Historical comparisons

The user should feel:

> "The system remembers and understands Tunisia."

---

# Core Principle

## ONE SHARED RETRIEVAL LAYER

Do NOT build:

* separate RAG per module
* separate vector DBs
* separate embeddings for each feature

Everything should use:

```text
Shared Retrieval Infrastructure
```

This becomes the cognitive memory layer of TunisiaIntel.

---

# High-Level Architecture

```text
INGESTION LAYER
(news/rss/apis/social/docs)
        ↓
NORMALIZATION LAYER
(cleaning/entity extraction/tagging)
        ↓
CHUNKING + ENRICHMENT
(metadata + embeddings)
        ↓
VECTOR MEMORY LAYER
(pgvector / Qdrant / Weaviate)
        ↓
RETRIEVAL ORCHESTRATOR
(hybrid retrieval + reranking)
        ↓
CONSUMERS
- AI Briefs
- Agents
- Terminal
- Dossiers
- Twin Tunisia
- Forecasting
- Simulations
```

---

# Recommended Stack

## Preferred Stack (simple + scalable)

### Database

Use:

```text
Supabase PostgreSQL + pgvector
```

Why:

* already using Supabase
* unified infra
* RLS compatible
* easy metadata joins
* simpler than introducing another DB

Only move to Qdrant/Weaviate later if scale demands it.

---

## Embeddings

Recommended:

```text
text-embedding-3-large
```

Alternative:

```text
bge-large-en-v1.5
```

For multilingual Tunisia content:

* Arabic
* French
* English

Prefer multilingual-capable embeddings eventually:

```text
bge-m3
```

because TunisiaIntel is trilingual by nature.

---

## Retrieval

Use HYBRID retrieval:

### 1. Vector similarity

Semantic meaning

### 2. Keyword/BM25

Exact matches:

* politician names
* laws
* governorates
* dates
* institutions

### 3. Metadata filtering

Critical for intelligence systems.

---

# Core Data Sources

## Phase 1 Sources

### News Articles

From pipeline:

* RSS
* news APIs
* scraped articles

Metadata:

```json
{
  "source": "",
  "date": "",
  "governorate": "",
  "category": "",
  "actors": [],
  "sentiment": "",
  "confidence": ""
}
```

---

## Events Database

Critical.

Every protest, arrest, speech, decree, fire, strike, etc.

This becomes:

```text
National Event Memory
```

Most valuable future asset.

---

## RRI Variables & Signals

Store:

* variable explanations
* historical changes
* threshold breaches
* anomalies
* state transitions

This allows:

> "Why did Kasserine risk rise this week?"

---

## Agent Outputs

Store:

* briefings
* analyses
* alerts
* classifications
* predictions

With:

* model version
* timestamp
* confidence
* trigger source

This becomes:

```text
Institutional Intelligence Memory
```

---

## Methodology Documents

Include:

* equations
* calibration notes
* assumptions
* whitepapers

Critical for explainability.

---

## Timeline Memory

Very important.

Store:

* major political events
* protests
* elections
* reshuffles
* IMF negotiations
* crises

This enables:

* historical similarity
* replay
* forecasting context

---

# Metadata Design (VERY IMPORTANT)

This matters more than embeddings.

Every chunk should include:

```json
{
  "id": "",
  "type": "article|event|brief|signal|methodology",
  "timestamp": "",
  "governorate": "",
  "actors": [],
  "tags": [],
  "risk_categories": [],
  "source": "",
  "source_type": "live|hybrid|synthetic",
  "confidence": 0.82,
  "language": "fr",
  "embedding_version": "v1",
  "entity_refs": [],
  "related_events": [],
  "canonical_state_id": ""
}
```

Metadata is what transforms:

> generic RAG
> into
> intelligence retrieval.

---

# Chunking Strategy

Do NOT use naive chunking.

## Recommended

### News

Chunk by:

* paragraph groups
* semantic sections

NOT fixed token windows.

---

### Methodology

Chunk by:

* equation
* concept
* variable group

---

### Events

One event = one chunk.

---

### Briefings

Chunk by:

* section/topic

---

# Entity Extraction Layer

Critical for TunisiaIntel.

Build entity extraction for:

* politicians
* ministries
* unions
* governorates
* companies
* NGOs
* judges
* military/security
* infrastructure

Example:

```json
{
  "actors": [
    "Kais Saied",
    "UGTT",
    "BCT"
  ]
}
```

This enables:

* actor memory
* relationship graphs
* timeline reconstruction
* Twin Tunisia linkage

---

# Retrieval Orchestrator

The most important RAG component.

## Input

User asks:

> "Why is Sfax instability rising?"

---

## Orchestrator retrieves:

* recent protests in Sfax
* water cuts
* labor strikes
* RRI variable shifts
* historical similarities
* agent analyses
* governorate events

---

## Then synthesizes:

NOT raw chunks.

This is intelligence retrieval.

---

# Retrieval Pipeline

## Step 1 — Query Understanding

Classify query:

* governorate
* actor
* economy
* security
* agriculture
* forecasting
* simulation

---

## Step 2 — Hybrid Search

Combine:

* semantic
* keyword
* metadata filters

---

## Step 3 — Reranking

Use reranker model.

Recommended:

```text
bge-reranker-large
```

---

## Step 4 — Context Assembly

Assemble:

* timeline
* related events
* contradictory signals
* confidence scores

---

## Step 5 — LLM Synthesis

Generate:

* briefing
* answer
* alert
* scenario

WITH citations.

---

# Citation System (MANDATORY)

Every AI output should show:

```text
SOURCE:
- TAP: Water protests in Gafsa (2026-03-11)
- MosaiqueFM: UGTT strike announcement
- RRI Variable P.14 breached threshold
```

Without citations:
RAG becomes hallucination amplification.

---

# Canonical State Integration

This is extremely important.

RAG should retrieve against:

```text
Canonical Tunisia State
```

Not disconnected documents.

Meaning chunks should connect to:

* governorates
* actors
* events
* variables
* state snapshots

This makes Twin Tunisia possible later.

---

# Agent Memory System

Each agent should have:

* short-term memory
* long-term memory
* retrieval namespace

Example:

```text
PoliticalStabilityAgent
```

retrieves:

* elite fracture history
* protests
* decrees
* opposition activity
* historical comparisons

This creates:

```text
Persistent Analytical Cognition
```

---

# RAG Use Cases

## 1. Intelligence Briefing

Input:

```text
Generate Tunisia daily briefing
```

Retrieves:

* top events
* anomalies
* RRI shifts
* economic stress
* social sentiment

Outputs:

* grounded briefing

---

## 2. Governorate Dossier

Input:

```text
Generate Kasserine dossier
```

Retrieves:

* unemployment
* protests
* water stress
* historical unrest
* key actors
* infrastructure issues

---

## 3. Historical Similarity

Input:

```text
Compare Tunisia 2026 to 2010
```

Retrieves:

* protest patterns
* inflation
* elite fragmentation
* unemployment

---

## 4. Analyst Terminal

Input:

```text
show recent judiciary tensions
```

Retrieves:

* articles
* decrees
* arrests
* agent analyses

---

# Multi-Language Support

TunisiaIntel MUST support:

* Arabic
* French
* English

Requirements:

* multilingual embeddings
* language tagging
* normalized transliteration

Critical problem:
Same actor may appear as:

* قيس سعيد
* Kais Saied
* Kaïs Saïed

Need canonical entity mapping.

---

# Storage Layers

## HOT MEMORY

Recent:

* articles
* events
* alerts

Fast retrieval.

---

## WARM MEMORY

Historical:

* months/years

---

## COLD MEMORY

Archives:

* PDFs
* reports
* datasets

---

# Truth & Provenance Layer

Every retrieved chunk should expose:

```json
{
  "source_type": "live",
  "freshness_hours": 3,
  "confidence": 0.91,
  "verified": true
}
```

This is mandatory for trust.

---

# What NOT To Do

## DO NOT:

* build "chat with documents"
* create isolated RAG tabs
* use embeddings without metadata
* mix mock and live silently
* store giant raw chunks
* let agents hallucinate without citations
* create separate memories per module

---

# Recommended Development Order

## Phase 1

Core infrastructure:

* pgvector
* embeddings
* chunking
* ingestion pipeline
* metadata schema

---

## Phase 2

Basic retrieval:

* semantic search
* hybrid search
* citations

---

## Phase 3

Intelligence integration:

* AI briefings
* dossiers
* terminal queries

---

## Phase 4

Agent memory:

* persistent retrieval
* memory namespaces
* replayable cognition

---

## Phase 5

Twin Tunisia integration:

* state-linked retrieval
* historical replay
* simulation grounding

---

# Final Vision

The end-state is NOT:

```text
AI chatbot for Tunisia
```

The end-state is:

```text
A continuously evolving national intelligence memory system.
```

RAG becomes:

* memory
* retrieval
* grounding
* historical cognition
* institutional recall
* simulation context

It is the cognitive substrate beneath the entire TunisiaIntel platform.

---

# RAG Tab (SCC) — Implementation Status

**File:** `src/components/system/RAGTab.tsx`  
**Status:** Tab shell built — engine deferred  
**SCC Tab:** `RAG Memory` (`'RAG'`) — positioned after `AI Models` tab  
**Icon:** `Library` from lucide-react

## Layout (6 sections, fully scrollable)

```
┌──────────────────────────────────────────────────────────────────┐
│ VECTOR MEMORY LAYER  — INITIALIZING                             │
│ Storage: —  ·  Chunks: 0  ·  Collections: 0                    │
│ [Memory infrastructure not yet initialized]                     │
├──────────────────────────────────────────────────────────────────┤
│ PIPELINE STAGES  (5 stage cards with arrows)                    │
│ Ingest → Chunk → Embed → Vector → Retrieve  (all IDLE)         │
├──────────────────────────────────────────────────────────────────┤
│ DATA SOURCES  (expandable, 6 sources)                           │
│ ▸ News[PENDING]  ▸ Events[PENDING]  ▸ RRI[PENDING]              │
│ ▸ Agent Outputs[PENDING]  ▸ Methodology[PENDING]                │
│ ▸ Timeline Memory[PENDING]                                      │
├──────────────────────────────────────────────────────────────────┤
│ MEMORY TIERS (HOT/WARM/COLD)  +  ENTITY EXTRACTION (IDLE)      │
├──────────────────────────────────────────────────────────────────┤
│ RAG CONSUMERS  (9 cards, all greyed with PENDING badge)        │
│ Briefs · Agents · Terminal · Dossiers · Twin TN                 │
│ Forecasting · Simulations · Timeline Replay · Scenario Gen       │
├──────────────────────────────────────────────────────────────────┤
│ PHASE ROADMAP  (5 phases, expandable, 0% progress)             │
├──────────────────────────────────────────────────────────────────┤
│ METADATA SCHEMA  (JSON preview, DESIGNED badge)                 │
└──────────────────────────────────────────────────────────────────┘
```

## SCC Integration

| Change | Location |
|--------|----------|
| `'RAG'` added to `Tab` type | `SystemCommandCenter.tsx:32` |
| `Library` imported from `lucide-react` | `SystemCommandCenter.tsx:10` |
| `{ id: 'RAG', label: 'RAG Memory', labelShort: 'RAG', icon: Library }` in `TABS` | `SystemCommandCenter.tsx:3479` |
| `{activeTab === 'RAG' && <RAGTab />}` | `SystemCommandCenter.tsx:3577` |
| `import RAGTab from './RAGTab'` | `SystemCommandCenter.tsx:29` |

## Component Tree

```
RAGTab
├── VectorMemoryCard       — top card, 3 metrics (storage/chunks/collections)
├── PipelineStageRow       — 5 inline stage cards with ArrowRight connectors
├── DataSourcesPanel       — expandable list, 6 RAG_SOURCES with color icons
├── MemoryTiersGrid        — 3-column: HOT/WARM/COLD with doc counts
├── EntityExtractionPanel  — actors/governorates counters, IDLE state
├── ConsumersGrid          — 9 greyed-out consumer cards
├── PhaseRoadmap           — 5 phase accordion with 0% progress bars
└── MetadataSchemaPreview  — JSON schema display with DESIGNED badge
```

## Data Constants (config-only)

- `PIPELINE_STAGES` — 5 stages (Ingest/Chunk/Embed/Vector/Retrieve) with icon + desc
- `RAG_SOURCES` — 6 source types (articles/events/RRI/agents/methodology/timeline)
- `MEMORY_TIERS` — 3 tiers (HOT/WARM/COLD) with colors and storage desc
- `RAG_CONSUMERS` — 9 consuming features
- `PHASES` — 5 roadmap phases with item tags

## State (local only, no persistence)

```typescript
interface RAGState {
  pipelineStatus: Record<string, 'idle' | 'running' | 'ready' | 'error'>;
  sourceCounts: Record<string, number>;
  totalChunks: number;
  totalVectors: number;
  entityActors: number;
  entityGovernorates: number;
  hotDocs: number;
  warmDocs: number;
  coldDocs: number;
}
```

## Deferred (until engine layer lands)

- Actual ingestion pipeline
- Vector DB connection
- Embedding generation
- Real chunk/vector counts
- Retrieval queries
- Entity extraction stats
- Any backend API calls

## Day 1 UX

Every element shows amber `INITIALIZING` / `IDLE` / `PENDING` badges. The layout is fully built — once the engine layer lands, flip states from idle → ready and wire real data in.

