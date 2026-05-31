# TunisiaIntel v2 — Platform Blueprint & Upgrade Plan

**Document purpose:** Consolidated product, architecture, and execution plan derived from platform review, SaaS positioning, mode strategy, and technical due-diligence framing.

**Status (May 2026):** Late alpha / early beta toward SaaS — not a demo, not yet full SaaS.

**Version:** 1.0

---

## 1. Executive summary

TunisiaIntel is a **national strategic operating system for Tunisia**: one shared intelligence substrate, multiple **modes** as lenses and commercial SKUs, and a long-term **Big Brain** (RAG + Twin + agents + institutional data) that powers decisions from cabinet strategy to SME evolution.

The product’s core value is not individual tabs — it is a **closed operational loop**:

```text
Ingestion → signals → state updates → agents → briefs → alerts
         → simulations → memory → feedback → analyst workflow
```

Most platforms fail by remaining disconnected dashboards. TunisiaIntel already has the subsystems to become **self-reinforcing**; the next phase is **coherent sovereign infrastructure engineering** (canonical state, provenance, trust gates) rather than surface expansion.

---

## 2. Maturity assessment

| Dimension | Stage |
|-----------|--------|
| Product vision | Advanced |
| Intelligence architecture | Advanced alpha |
| Operational reliability | Early beta |
| Commercialization | Pre-SaaS |
| Cognitive infrastructure | Emerging |
| Trust systems | Incomplete — correctly identified |

**Fair label:** Late alpha / early beta toward SaaS.

**What changed:** More features no longer automatically increase value. Architecture coherence and trust matter more than novelty.

---

## 3. Product vision

### 3.1 North star

> The tool for every strategic decision in Tunisia — monitoring, analysis, simulation, and grounded recommendations — for ministries, NGOs, companies, incubators, and investors.

### 3.2 Long-term Big Brain

Unified ingestion and cognition over:

- Tunisian **laws & decrees**, constitutional and regulatory corpus  
- **Historical events** and institutional timeline  
- **IFI & official statistics** (IMF, World Bank, BCT, national agencies)  
- Live **OSINT** (RSS, events, signals, social where applicable)  
- Platform-generated **variables, agents, predictions, simulations**

**RAG** disappears into the system (briefs, dossiers, memory, Twin replay, Q&A) — users feel *"the system remembers,"* not *"there is a RAG tab."*

**Twin Tunisia** is not another mode — it is the **persistent simulation layer**: evolving national state graph, shock injection, replay, forecasting base. Modes become **projections** of the twin.

**Agents & simulation:** Policy/law injection → shocks and impacts via propagation, game theory, **swarm agents** — with **attributable, replayable** outputs (not chat gimmicks).

### 3.3 Customer segments & primary modes

| Segment | Primary experience | Core job |
|---------|-------------------|----------|
| Ministerial / cabinet | Professional + (future) policy simulator | Briefs, scenarios, law impact, audit trail |
| NGO / think tank | Tactical + Professional | Monitor, alert, report to boards |
| Company / investor | Tunisia Terminal + Professional (lite) | Macro, sector, governorate risk |
| Incubator / SME | Tunisia Terminal | How to evolve — pricing, FX, regulation |
| **All accounts** | **Tactical OSINT** | 24/7 situation feed — **replaces news** |

### 3.4 Mode strategy (mode selection)

| Mode | Role | Commercial intent |
|------|------|-------------------|
| **Tactical** (`advanced`) | Universal layer — addictive, 24/7, all sources | **Included for every customer** — retention & distribution |
| **Professional** | Colossal analytical workspace — RRI, domains, agents | **Core paid depth** — cabinets, NGOs, strategic desks |
| **Tunisia Terminal** | Bloomberg-style — macro, dense data, business | **Business / investor SKU** — entrepreneurs, firms (WIP) |
| **Brain** | Lab / demo — 3D, simulation UX prototypes | **R&D** — previews Twin; not v1 revenue driver |
| **Business Investigator** | Economic intelligence (overlap with Terminal) | Consolidate with Terminal over time |
| **Agriculture, Palantir, etc.** | Vertical slices | **Future paid modules** extracted from Professional when REAL |
| **Fake / stub modes** | Hidden or Labs | Do not ship in production nav |

**Principle:** One ingestion pipeline, many **presentation modes** — not many disconnected apps.

### 3.5 Liability & output contracts

Same brain, different **output contracts**:

- **Minister:** scenario ranges, assumptions, dissent, classification, full audit trail  
- **SME / entrepreneur:** bounded, actionable guidance + clear disclaimers (not legal/financial advice)  

Design this split before the Big Brain speaks with one voice to everyone.

---

## 4. Architecture keystone: single national state

**Highest priority** — more important than new RAG, Twin UI, or more dashboards.

Without canonical state → conflicting truths, duplicate computation, agent drift, impossible debugging (**cognitive fragmentation** — the existential risk).

### 4.1 `NationalStateSnapshot` (conceptual contract)

Each snapshot should include at minimum:

| Field | Purpose |
|-------|---------|
| `timestamp` | Ordering & replay |
| `provenance` | Who/what wrote each slice |
| `confidence` | Aggregate and per-domain |
| `governorate_vectors` | 24 gov spatial state |
| `actor_graph` | Elite / opposition / institutions |
| `event_graph` | Recent events & links |
| `risk_vectors` | RRI components, P(rev), cascade |
| `economic_indicators` | Macro, FX, inflation, etc. |
| `narrative_state` | Frames, salience, cognitive load |
| `active_shocks` | Injected or detected shocks |

### 4.2 Projection model

```text
NationalStateSnapshot (canonical, versioned, event-sourced)
        │
        ├── Tactical Mode      → feed + urgency projection
        ├── Professional Mode  → analytical projection
        ├── Tunisia Terminal   → economic projection
        ├── Brain Mode         → immersive / simulation projection
        └── API clients        → JSON projections for integrators
```

- **All modes** = read projections  
- **All agents** = transformers (read state → write structured deltas + memory)  
- **All simulations** = forks (branch from snapshot → run → store outcome)

### 4.3 Single writer rule

One authoritative pipeline writes variables/signals (Python orchestrator **or** unified Node pipeline — not both diverging). UI **reads**; it does not silently recompute a second RRI.

---

## 5. Trust floor — hard deployment gate

**Not a guideline — a deployment rule.**

| Classification | Production |
|----------------|------------|
| **REAL** | Yes |
| **HYBRID** | Yes, **labeled** (LIVE / CALIBRATED / SIMULATION) |
| **SIMULATION** | Yes, **explicit** |
| **PLACEHOLDER** | **No** |
| **MOCK** | **No** |

**Source of truth:** `real_fake_fix.md` audit → evolve into:

- Runtime metadata on every nav node / component  
- CI checks (fail build if MOCK in production routes)  
- UI badges on every paid surface  
- Deployment validation before release  

**Rule:** A tab cannot ship without declaring its truth class.

### 5.1 Audit snapshot (ProfessionalIntel scope)

| Class | Count | Action |
|-------|-------|--------|
| REAL | 24 | Protect — tests + monitoring |
| HYBRID | 17 | Label + convert to REAL over time |
| FAKE | 14 | Remove from prod nav / Labs only |

**FAKE examples (hide until wired):** GeopoliticalIntelligence, SecurityIntelligence, EnergyIntelligence, IndustrialIntelligencePanel, DailyBriefing, AIVoiceBriefing, static agri commodity panels, etc.

**REAL spine examples:** NationalCommandCenter, AlertHub, IntelligenceBriefPanel, RealTimeNewsFeed, LiveSignalFeed, EventsIntelligence, EconomicReality, ModelPerformance, RRIMethodology, etc.

---

## 6. Agent & cognition standards

Agents are **infrastructure**, not conversational UI.

Every agent run should persist as:

```json
{
  "agent": "PoliticalStabilityAgent",
  "trigger": "cabinet_reshuffle",
  "inputs": ["event_id", "signal_ids"],
  "output": { "structured": "..." },
  "confidence": 0.74,
  "model_version": "gemini-1.5-flash",
  "timestamp": "ISO-8601",
  "state_delta": { "variables": [], "shocks": [] },
  "citations": [{ "source_id", "date", "excerpt" }]
}
```

**Properties:** attributable, replayable, structured, stored in Supabase (`agent_memory` / dedicated table), surfaced in UI with provenance.

---

## 7. RAG strategy

**Infrastructure, not a feature tab.**

| Consumer | Use |
|----------|-----|
| Intelligence Brief | Grounded SITREP + watch indicators |
| Dossier / PDF export | Citations |
| Tunisia Terminal Q&A | Macro/regulatory context |
| Actor / governorate memory | Timeline reconstruction |
| Twin replay | Historical analogues |
| Analyst terminal | Ad-hoc query |

**Corpus:** articles, events, variables, laws (future), methodology chunks, agent outputs.

**Requirement:** Strict citations (source id, date, governorate where relevant).

**When to expand:** After ingestion + entity resolution are stable — otherwise RAG amplifies noise.

---

## 8. Twin Tunisia strategy

| Wrong framing | Right framing |
|---------------|----------------|
| Another mode / second app | Persistent simulation layer on canonical state |
| Parallel mock world | Forks from `NationalStateSnapshot` |
| Pretty 3D only | Physics = propagation engine + scenario simulator + RRI |

**Ship order:** canonical state API → scenario fork/replay API → one primary viz (map or graph) → Brain Mode as premium UX.

---

## 9. SaaS & commercialization

### 9.1 What SaaS adds (beyond current build)

| Layer | Gap |
|-------|-----|
| Product SKU | Clear tiers: Tactical (all), Pro, Terminal, API, future modules |
| Data trust | Provenance UI, freshness SLA, trust gate |
| Identity | Orgs, roles, RLS — no `VITE_DEMO_CODE` in prod |
| Commercial | Plans, limits, billing (Stripe later; plan flags in DB now) |
| Ops | Rate limits, AI cost caps, uptime, incident playbooks |
| Quality | Tests on RRI, ingestion, agent outputs, hero journey |

### 9.2 Pricing axis (draft)

| Tier | Audience | Includes |
|------|----------|----------|
| **Core** | Everyone | Tactical — feed, alerts (basic) |
| **Analyst** | NGO, research | Professional (REAL nav only) + briefs + export cap |
| **Business** | SME, investor | Tunisia Terminal |
| **Team** | Institutions | Seats, shared alerts, audit log |
| **API** | Integrators | State, RRI, events, alerts, brief JSON |
| **Modules** | Vertical | Agri, energy, etc. when REAL |

**Meter:** Gemini/briefs, RSS frequency, API calls, exports/month.  
**Don’t meter:** Cached RRI views (habit formation).

### 9.3 API as first-class product

> SaaS isn’t only our UI.

Expose (read-first v1): RRI snapshot, events, alerts, latest brief, state version id.

Creates: integrations, institutional workflows, embedding, API lock-in, enterprise defensibility. UI may become **one client** of the intelligence engine.

### 9.4 Minimal SaaS v1 — analyst hero journey (5 screens)

| # | Screen | Components (REAL) |
|---|--------|---------------------|
| 1 | Situation | NationalCommandCenter + map + RRI |
| 2 | Feed | RealTimeNewsFeed + LiveSignalFeed + EventsIntelligence (unified) |
| 3 | Alerts | AlertHub |
| 4 | Brief | IntelligenceBriefPanel (**not** DailyBriefing / AIVoiceBriefing) |
| 5 | Export | Dossier / PDF pipeline |

**Domains drawer (REAL only):** Political stability, Economic reality, Narrative/cognitive, Radicalisation, Fire intel.

**Labs (off by default):** HYBRID simulation, Brain experiments.

---

## 10. Existing assets (inventory)

### 10.1 Strengths

- Documented methodology (RRI, coupled systems, SIR, Monte Carlo)  
- Python intelligence layer: Fusion, Correlation, Anomaly, Scenario, agents, MissionOrchestrator, signal engine  
- React pipeline: PipelineContext, RSS, alerts, prediction ledger, observability  
- Supabase auth + realtime  
- Express AI proxy, optional Python spawn from `server.ts`  
- Honest audit: `real_fake_fix.md`  
- Upgrade tracking: `UPGRADE_PLAN.md`  
- Mode architecture aligned with GTM (Tactical universal, Pro depth, Terminal economic)

### 10.2 Risks

| Risk | Mitigation |
|------|------------|
| Cognitive fragmentation | Canonical state + single writer |
| Trust erosion (mock in prod) | Trust floor gate |
| Scope creep | Mode/SKU discipline; Labs flag |
| No automated tests | RRI + ingestion + hero journey tests |
| Overclaiming advice | Output contracts + disclaimers |
| Cost runaway (Gemini) | Per-org limits, caching briefs |

---

## 11. Upgrade plan — phased execution

### Phase 0 — Trust & truth (weeks 1–3) **BLOCKING**

- [ ] Implement truth classification enum on all nav/components  
- [ ] Remove MOCK/PLACEHOLDER from production Professional + Tactical routes  
- [ ] Badge all HYBRID surfaces (LIVE / CALIBRATED / SIMULATION)  
- [ ] Replace DailyBriefing / AIVoiceBriefing with IntelligenceBriefPanel in prod paths  
- [ ] Disable `VITE_DEMO_CODE` and mock agri defaults in production builds  
- [ ] Publish internal "production allowlist" derived from 24 REAL components  

**Exit criteria:** No paying user can reach FAKE without explicit Labs opt-in.

---

### Phase 1 — Canonical state (weeks 3–8) **KEYSTONE**

- [ ] Define `NationalStateSnapshot` schema (TypeScript + Supabase + Python)  
- [ ] Event-sourced writes: ingestion → signals → variable updates → snapshot version bump  
- [ ] Designate **one writer** (recommend: Python orchestrator primary, frontend read-only for RRI display)  
- [ ] Refactor PipelineContext to consume snapshots, not recompute divergent state  
- [ ] `GET /api/state/latest` + `GET /api/state/:version` + `GET /api/rri`  

**Exit criteria:** Same RRI value in Pro, Tactical ticker, and API for a given version id.

---

### Phase 2 — Closed loop & SaaS core (weeks 6–12)

- [ ] Hero journey complete: Feed → Alert → Brief → Export (E2E test)  
- [ ] Supabase: `org_id`, plans, limits; RLS per tenant  
- [ ] Agent persistence standard (JSON schema + UI replay)  
- [ ] Prediction ledger visible on Brief/Alerts (ModelPerformance)  
- [ ] Tactical as default landing post-login for all tiers  
- [ ] Professional v1 nav = 5 screens + Domains (REAL only)  

**Exit criteria:** First pilot customer on manual billing; one documented workflow.

---

### Phase 3 — API & integrations (weeks 10–16)

- [ ] Read API: state, RRI, events, alerts, brief  
- [ ] Webhooks: alert fired, brief ready, state delta > threshold  
- [ ] API keys per org, rate limits  
- [ ] Optional: Stripe + plan enforcement  

---

### Phase 4 — Ingestion expansion (weeks 12–24)

- [ ] IMF / World Bank / BCT connectors → normalized economic slice on snapshot  
- [ ] Law corpus ingestion (chunked, versioned)  
- [ ] Historical events timeline → event graph  
- [ ] Entity resolution pass before RAG scale-up  

---

### Phase 5 — RAG substrate (weeks 16–28)

- [ ] Unified retrieval service (not a tab)  
- [ ] Wire: Brief, dossier, terminal Q&A, agent memory  
- [ ] Citation enforcement in generation prompts  
- [ ] Evaluation set: "answer must cite source" regression tests  

---

### Phase 6 — Twin & simulation (weeks 20–36)

- [ ] Scenario fork API from snapshot  
- [ ] Law/policy injection → shock vector → propagation run  
- [ ] Store simulation runs with diff from base state  
- [ ] Brain Mode views consume real fork results (not static mock)  
- [ ] Swarm agents v1: bounded agent set with structured outputs  

---

### Phase 7 — Mode commercialization (ongoing)

- [ ] Tunisia Terminal GA (business SKU)  
- [ ] Extract Agriculture / Energy / Network modes from Pro when REAL  
- [ ] Brain Mode: premium or enterprise tier when Twin-backed  
- [ ] Consolidate Business Investigator into Terminal where overlap exists  

---

## 12. CI / deployment checklist (trust gate)

```text
[ ] Every component in production routes has truth_class metadata
[ ] truth_class in { REAL, HYBRID_LABELED, SIMULATION_LABELED }
[ ] No truth_class MOCK or PLACEHOLDER in prod bundle
[ ] HYBRID components have data_provenance string in UI
[ ] E2E: login → tactical feed → alert → brief → export
[ ] RRI consistency test: API vs UI for same state_version
[ ] GEMINI_API_KEY not placeholder in prod env
[ ] VITE_DEMO_CODE unset in prod
```

---

## 13. Success metrics

| Metric | Target |
|--------|--------|
| FAKE reachable in prod | 0 |
| HYBRID unlabeled | 0 |
| State version consistency | 100% across modes |
| Hero journey E2E | Passing in CI |
| Pilot paying orgs | ≥1 |
| Brief citation rate | >95% claims with source |
| Agent runs persisted | 100% of production agent outputs |

---

## 14. Strategic conclusion

TunisiaIntel has crossed from **expansive intelligence experimentation** to the need for **coherent sovereign infrastructure engineering**.

**Stop optimizing for:** more tabs, more modes, more visual power alone.

**Start optimizing for:** reducing ambiguity, centralizing truth, enforcing provenance, stabilizing cognition, operationalizing trust.

The closed loop (ingest → signal → state → agent → brief → alert → simulate → memory → workflow) **is the product**. Tactical wins daily attention; Professional wins depth; Terminal wins economic decisions; Twin + Big Brain win defensibility; API wins enterprise lock-in.

Those are solvable engineering and product problems — and the audit, orchestrator, and mode structure already point in the right direction.

---

## 15. Reference documents (repo)

| File | Role |
|------|------|
| `README.md` | Product overview & stack |
| `ARCHITECTURE.md` | Folder structure & data flow |
| `METHODOLOGY.md` | RRI & engine math |
| `real_fake_fix.md` | Truth audit (REAL / HYBRID / FAKE) |
| `UPGRADE_PLAN.md` | Backend intelligence steps |
| `CHANGELOG.md` | Release history |

---

*Blueprint v1.0 — synthesized from platform review, SaaS v1 mapping, mode/GTM strategy, and infrastructure maturity framing.*
