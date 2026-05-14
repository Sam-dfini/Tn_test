# Knowledge Graph Implementation Plan

**Phase:** 1 of Strategic Evolution Plan (Weeks 5-10)
**Status:** ⏸️ Pending — start on order
**Total estimated effort:** ~460 lines across 8 steps, ~2-3 days full focus

---

## What We're Building

A unified Knowledge Graph page + backend that replaces the hardcoded NODES/EDGES/GAMES arrays in `GeopoliticalNetworkGraph.tsx` and `NationalActorNetwork.tsx` with live data from Supabase, and adds a combined graph explorer.

---

## Task List

### Step 1 — Database Tables (schemaValidator.ts)
**File:** `src/utils/schemaValidator.ts`
**Status:** ⏸️ Pending

Add two tables to `SCHEMA_MAP`:

```ts
graph_entities: {
  id: 'text', type: 'text', label: 'text',
  aliases: 'jsonb', first_seen: 'text', last_seen: 'text',
  confidence: 'float8', metadata: 'jsonb',
  tier: 'int8', domain: 'jsonb', power_type: 'text',
  color: 'text', size: 'int8',
  resources: 'jsonb', goals: 'jsonb', constraints: 'jsonb',
  risk_tolerance: 'text', time_horizon: 'text',
  fixed_x: 'float8', fixed_y: 'float8',
}
graph_relations: {
  id: 'text', source_id: 'text', target_id: 'text',
  type: 'text', weight: 'float8', domain: 'text',
  description: 'text', conditionality: 'text',
  trend: 'text', valid_from: 'text', valid_to: 'text',
  confidence: 'float8',
}
```

### Step 2 — Python Knowledge Graph Module
**Files:** `backend/app/knowledge_graph/`
**Status:** ⏸️ Pending

Create new Python package:
- `models.py` — Entity, Relation Pydantic models
- `graph_db.py` — Supabase CRUD + recursive CTE queries for graph traversal (up to 10 levels)
- `api.py` — FastAPI router with endpoints:
  - `GET /api/graph/entities` — list all entities
  - `GET /api/graph/relations` — list all relations
  - `POST /api/graph/query` — traverse graph with depth limit
  - `POST /api/graph/seed` — seed from existing data

### Step 3 — Seed Script
**File:** New or integrated into seed process
**Status:** ⏸️ Pending

Extract the existing hardcoded data from:
- `src/components/political/GeopoliticalNetworkGraph.tsx` — 13 actors, 42 relations, 6 games
- `src/components/political/NationalActorNetwork.tsx` — 16 actors, 36 relations, 6 games

Seed into Supabase `graph_entities` and `graph_relations` tables. Entities get UUIDs, relations reference entity IDs.

### Step 4 — Frontend API Service
**File:** `src/services/knowledgeGraphService.ts`
**Status:** ⏸️ Pending

```ts
export async function fetchEntities(): Promise<Entity[]>
export async function fetchRelations(): Promise<Relation[]>
export async function queryGraph(actor: string, depth: number): Promise<GraphResult>
```

### Step 5 — Refactor Existing Graphs
**Files:**
- `src/components/political/GeopoliticalNetworkGraph.tsx`
- `src/components/political/NationalActorNetwork.tsx`
**Status:** ⏸️ Pending

Replace hardcoded `NODES`, `EDGES`, `GAMES` arrays with `useEffect` that calls `fetchEntities()` and `fetchRelations()` on mount. Keep same rendering logic, just source data from API.

### Step 6 — Knowledge Graph Page (Combined)
**Files:**
- `src/components/knowledge/KnowledgeGraphExplorer.tsx` (new)
- `src/components/modes/ProfessionalIntel.tsx` (add tab)
**Status:** ⏸️ Pending

New page that combines international + domestic actors into one unified graph:
- D3 force-directed graph (reuse from existing components)
- Filter by entity type, domain, tier
- Search by name
- Time slider for historical changes
- Entity drill-down panel (profile + relations + game theory)
- Cypher/GQL-style query input: `INFLUENCES → UGTT depth=3`

### Step 7 — Sidebar + Routing
**File:** `src/components/modes/ProfessionalIntel.tsx`
**Status:** ⏸️ Pending

Add sidebar entry:
```ts
{ id: "knowledge-graph", label: "Knowledge Graph", icon: Network, restricted: 'STRATEGIC' },
```

Add routing:
```ts
activeTab === "knowledge-graph" ? (
  <Suspense fallback={Loader2 spinner}>
    <KnowledgeGraphExplorer />
  </Suspense>
)
```

### Step 8 — Auto-Seed on Startup
**File:** `server.ts`
**Status:** ⏸️ Pending

Add `POST /api/graph/seed` call in the auto-seed section (alongside variables seed) so entity data is always available.

---

## Architecture

```
Supabase graph_entities + graph_relations tables
  ↓ (Python backend API)
GET /api/graph/entities | GET /api/graph/relations | POST /api/graph/query
  ↓ (Frontend service)
knowledgeGraphService.ts
  ↓ (Components)
GeopoliticalNetworkGraph  │  NationalActorNetwork  │  KnowledgeGraphExplorer
  (live data from API)        (live data from API)      (combined + query)
```

## Dependencies

| Step | Depends On | Est. Lines |
|------|-----------|-----------|
| 1. DB tables | Nothing | 40 |
| 2. Python module | Step 1 | 200 |
| 3. Seed script | Step 1 + 2 | 100 |
| 4. Frontend service | Step 2 | 60 |
| 5. Refactor existing graphs | Step 4 | 30 |
| 6. Knowledge Graph page | Step 4 | 250 |
| 7. Sidebar + routing | Step 6 | 20 |
| 8. Auto-seed | Step 3 | 15 |

**Total:** ~715 lines

---

Start when you give the order.
