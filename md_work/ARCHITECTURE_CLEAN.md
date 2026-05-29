# TunisiaIntel v2 - Clean Architecture Blueprint

Status: Draft v1  
Owner: TunisiaIntel Core Team  
Scope: Full platform (frontend, backend, agents, simulation, data, API)  
Last updated: 2026-05-28

---

## 1) Purpose

This document defines the target clean architecture for TunisiaIntel so that:

- New engineers can understand the platform quickly.
- New apps (web/mobile/partner tools) can integrate safely.
- Features can scale without creating conflicting truths.
- AI, simulations, and dashboards all rely on one canonical state model.

This is the architecture we will evolve toward over time. It is not a rewrite mandate.

---

## 2) Architecture principles

1. **Single Source of Truth**
   - All strategic outputs must derive from one canonical national state.

2. **Domain First**
   - Domain models and business rules do not depend on UI, DB, or providers.

3. **Use-Case Oriented Application Layer**
   - All behavior is expressed as clear application use-cases.

4. **Ports and Adapters**
   - External systems are integrated through interfaces, not directly from domain/use-cases.

5. **Explainability by Design**
   - Every important output includes provenance, confidence, and timestamp.

6. **Truth Classification Gate**
   - No PLACEHOLDER or MOCK in production surfaces.
   - HYBRID and SIMULATION must be explicitly labeled.

7. **Incremental Migration**
   - Apply in phases without blocking delivery.

---

## 3) Target system view (high level)

```text
External Sources (RSS, IMF, WB, BCT, laws, events, social, satellite)
        |
        v
[Ingestion & Normalization]
        |
        v
[Signal Engine] ---> [Entity Resolution] ---> [Event Graph]
        |                                      |
        v                                      v
                [NationalStateSnapshot]  <-----+
                        |
        +---------------+------------------+
        |               |                  |
        v               v                  v
  [Agents]         [Simulation/Twin]   [Alert/Brief Engine]
        |               |                  |
        +---------------+------------------+
                        |
                        v
                  API + Projections
                        |
      +-----------------+----------------------+
      |                 |                      |
      v                 v                      v
 Tactical UI      Professional UI       Tunisia Terminal / Partners
```

---

## 4) Core architectural layers

### 4.1 Domain layer (pure core)

Contains:

- Entities/value objects
- Domain invariants
- Core domain services
- Domain policies (risk, confidence, constraints)

No framework imports, no HTTP, no DB, no React.

Core entities (minimum):

- `NationalStateSnapshot`
- `Signal`
- `Event`
- `Actor`
- `GovernorateState`
- `RiskVector`
- `Alert`
- `Brief`
- `ScenarioRun`
- `AgentRunRecord`

### 4.2 Application layer (use-cases)

Contains business workflows:

- `IngestSignalsUseCase`
- `NormalizeSourcesUseCase`
- `UpdateNationalStateUseCase`
- `RunAgentUseCase`
- `GenerateBriefUseCase`
- `TriggerAlertsUseCase`
- `ForkScenarioUseCase`
- `ExportDossierUseCase`

Application layer orchestrates domain logic via interfaces (ports).

### 4.3 Interface layer (adapters)

Contains adapters between internal use-cases and external consumers:

- REST controllers
- Websocket handlers
- UI view-model mappers
- Agent invocation endpoints
- RAG query adapters

No business logic duplication here.

### 4.4 Infrastructure layer

Contains implementation details:

- Supabase repositories
- External API clients (IMF/WB/etc.)
- LLM providers
- queue/event bus adapters
- telemetry/logging
- file/object storage

Infrastructure implements interfaces defined by application/domain.

---

## 5) Canonical state contract

`NationalStateSnapshot` is the keystone.

### 5.1 Required fields

```json
{
  "snapshot_id": "uuid",
  "created_at": "ISO-8601",
  "state_version": "string",
  "window": {
    "from": "ISO-8601",
    "to": "ISO-8601"
  },
  "provenance": {
    "sources": ["rss", "imf", "laws", "events"],
    "pipeline_run_id": "string",
    "model_versions": {
      "classification": "vX",
      "brief_model": "model-id"
    }
  },
  "confidence": {
    "overall": 0.0,
    "by_domain": {
      "economic": 0.0,
      "political": 0.0,
      "social": 0.0,
      "security": 0.0,
      "narrative": 0.0
    }
  },
  "governorates": [],
  "risk_vector": {},
  "actor_graph_ref": "id",
  "event_graph_ref": "id",
  "active_shocks": [],
  "derived_metrics": {
    "rri": 0.0,
    "p_rev": 0.0,
    "cascade_probability": 0.0
  }
}
```

### 5.2 Rules

- Snapshots are immutable after publication.
- New information creates a new version.
- All outputs link to `snapshot_id`.
- UI always displays the source `snapshot_id` and freshness.

---

## 6) Bounded contexts

Define clear domain boundaries:

1. **Signal Intelligence Context**
   - Ingestion, normalization, scoring, deduplication.

2. **National State Context**
   - Snapshot composition, risk vectors, governorate state.

3. **Alerting Context**
   - Threshold rules, anomaly triggers, escalation policy.

4. **Briefing Context**
   - Structured briefs, recommendations, evidence references.

5. **Simulation/Twin Context**
   - Scenario forks, shock injection, propagation.

6. **Agent Cognition Context**
   - Agent orchestration, memory, run records, confidence.

7. **Access & Tenant Context**
   - orgs, roles, plans, limits, policy enforcement.

Cross-context integration must happen through application contracts, not direct DB coupling.

---

## 7) Truth classification system

All user-facing modules must declare one class:

- `REAL`
- `HYBRID`
- `SIMULATION`
- `PLACEHOLDER`
- `MOCK`

### 7.1 Production policy

- REAL: allowed
- HYBRID: allowed only with visible label
- SIMULATION: allowed only with explicit label
- PLACEHOLDER: blocked
- MOCK: blocked

### 7.2 Enforcement

- Metadata declaration per module/tab
- CI lint check
- Runtime badge in UI
- release gate validation

Example metadata:

```ts
export const moduleMeta = {
  id: "economic-reality",
  truthClass: "REAL",
  dataSources: ["supabase", "price_reports"],
  owner: "economy-team"
} as const;
```

---

## 8) API design for interoperability

### 8.1 Public/partner read API (v1)

- `GET /api/v1/state/latest`
- `GET /api/v1/state/{snapshot_id}`
- `GET /api/v1/events`
- `GET /api/v1/alerts`
- `GET /api/v1/briefs/latest`
- `GET /api/v1/rri`

### 8.2 Internal write/ops API

- `POST /api/internal/ingest/signals`
- `POST /api/internal/state/build`
- `POST /api/internal/agents/run`
- `POST /api/internal/simulation/fork`

### 8.3 API rules

- Version all contracts (`/v1`).
- Include `snapshot_id` where relevant.
- Include `provenance` and `confidence` fields in strategic outputs.
- Never leak provider-specific response structures directly.

---

## 9) Agent architecture standard

Agents must produce structured, replayable records.

```json
{
  "agent_name": "PoliticalStabilityAgent",
  "trigger": "cabinet_reshuffle",
  "started_at": "ISO-8601",
  "finished_at": "ISO-8601",
  "snapshot_id": "uuid",
  "inputs": {
    "signals": [],
    "events": [],
    "context_window": "id"
  },
  "output": {
    "findings": [],
    "risk_delta": {},
    "recommendations": []
  },
  "confidence": 0.74,
  "citations": [],
  "model": {
    "provider": "x",
    "version": "y"
  }
}
```

No free-form output-only agents in production critical workflows.

---

## 10) RAG as infrastructure (not feature tab)

RAG should support:

- Brief generation
- Dossier export
- Analyst Q&A
- Agent memory grounding
- Twin replay context

### 10.1 Retrieval contract

- Input: query + intent + snapshot_id optional
- Output: ranked chunks + source metadata + confidence
- Mandatory citation payload:
  - `source_id`
  - `source_type`
  - `published_at`
  - `excerpt`

### 10.2 Guardrails

- If confidence below threshold, return uncertainty state.
- No uncited strategic recommendation in high-stakes flows.

---

## 11) Twin Tunisia architecture

Twin is a persistent simulation substrate.

### 11.1 Twin components

- Base state = `NationalStateSnapshot`
- Scenario fork manager
- Shock injection engine
- Propagation engine
- Outcome evaluator
- Replay timeline store

### 11.2 Twin flow

1. Select base snapshot
2. Create scenario fork
3. Inject policy/law/external shock
4. Run multi-step propagation
5. Store state deltas and confidence
6. Compare against baseline
7. Publish simulation artifact

---

## 12) Proposed repository structure (target)

```txt
src/
  domain/
    models/
    services/
    policies/
  application/
    usecases/
    commands/
    queries/
    orchestrators/
    ports/
  interfaces/
    api/
    websocket/
    ui/
    agents/
  infrastructure/
    db/
    repositories/
    external/
    llm/
    telemetry/
  shared/
    types/
    errors/
    utils/

backend/
  domain/
  application/
  interfaces/
  infrastructure/
```

This can be implemented incrementally while keeping current code operational.

---

## 13) Coding rules (must-have)

1. No domain logic inside React components.
2. No direct external API calls inside UI tabs.
3. No DB queries from domain layer.
4. No strategic output without provenance metadata.
5. Every new module declares truth classification.
6. Every use-case has a test for expected/edge path.
7. Every schema change includes migration and rollback notes.

---

## 14) Observability and reliability

### 14.1 Minimum telemetry

- ingestion run id
- snapshot build duration
- agent run duration and error rate
- brief generation latency
- alert false-positive review metrics
- simulation run metadata

### 14.2 Operational SLO candidates

- state freshness latency
- alert delivery latency
- API success rate
- agent run success rate

---

## 15) Security and access model

- Multi-tenant by `org_id`
- Role-based access (viewer/analyst/admin/strategic)
- RLS enforced in data layer
- service-role key only server-side
- audit log for strategic actions:
  - simulation create
  - policy injection
  - recommendation export

---

## 16) Migration plan (incremental)

### Phase A - Stabilize truth
- Add truth-class metadata to all modules.
- Remove/disable PLACEHOLDER and MOCK from production routes.
- Add HYBRID/SIMULATION badges in UI.

### Phase B - Canonical state
- Introduce `NationalStateSnapshot` schema.
- Route key outputs through snapshot-based reads.
- Attach `snapshot_id` to briefs and alerts.

### Phase C - Use-case extraction
- Move major workflows into application use-cases.
- Keep existing endpoints as adapters to new use-cases.

### Phase D - API coherence
- Publish `/api/v1` contracts.
- Add compatibility layer for old endpoints.

### Phase E - Twin and RAG integration
- Wire simulation forks to snapshot store.
- Use one retrieval substrate for brief/agent/terminal/twin.

---

## 17) Definition of done for new strategic modules

A module is production-ready only if:

- [ ] truth class declared and valid
- [ ] domain invariants documented
- [ ] use-case implemented (not only UI)
- [ ] provenance shown in output
- [ ] confidence included
- [ ] tests exist (happy path + failure path)
- [ ] observability hooks added

---

## 18) Architecture decision record (ADR) template

Use ADRs for major decisions.

```md
# ADR-00X: <Title>
Date:
Status: Proposed | Accepted | Deprecated
Context:
Decision:
Alternatives considered:
Consequences:
Rollback plan:
```

---

## 19) Immediate backlog (next practical actions)

1. Create `truth-class` metadata map for all current Professional and Tactical tabs.
2. Define initial `NationalStateSnapshot` TypeScript interface and backend schema.
3. Add `snapshot_id` to alerts and briefs payloads.
4. Extract one end-to-end use-case as reference:
   - ingest -> classify -> state update -> alert.
5. Publish initial `/api/v1/state/latest` endpoint contract doc.

---

## 20) Final note

This architecture is designed to keep TunisiaIntel understandable as it scales:

- many interfaces
- one truth
- explicit confidence
- strict provenance
- clean layering

If we keep this discipline, future apps will integrate easily and the platform will remain coherent under growth.

