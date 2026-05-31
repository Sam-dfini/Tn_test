# TunisiaIntel — Master Strategic Plan
## From Risk Dashboard to Sovereign Intelligence Cognition System

**Version:** 1.0  
**Date:** 2026-05-21  
**Status:** Living Document — Updated as Architecture Evolves  
**Classification:** Internal Strategic Reference

---

## 1. What We Are Building

TunisiaIntel is not a dashboard. It is not a chatbot. It is not a news aggregator.

It is a **sovereign intelligence cognition system** — a continuously learning national brain that monitors, interprets, simulates, and forecasts the strategic state of Tunisia.

The long-term vision has two layers:

### The Agency Brain
A central intelligence cognition engine trained on:
- Intelligence methodology and tradecraft (Sherman Kent, Richards Heuer, CIA analytic standards)
- Strategic studies and statecraft literature
- Think tank research (RAND, Brookings, Chatham House, ICG, Carnegie)
- Escalation theory, insurgency doctrine, regime survival theory
- Psychological operations, narrative warfare, information environment modeling
- Economic warfare, sanctions theory, fiscal stress doctrine
- Tunisia-specific historical patterns, sociology, informal power structures

This is the reasoning substrate. It does not answer questions. It thinks about Tunisia.

### The High Table
A set of modeled cognitive entities — each representing a strategic actor at the highest level of national power — sitting around a virtual deliberation chamber. Each member of the High Table has its own brain: trained on its institutional history, doctrine, incentives, fears, and decision patterns.

The High Table includes:
- Presidency / Executive Authority
- Military High Command
- Interior Ministry / Security Apparatus
- UGTT (Labor Confederation)
- Central Bank of Tunisia (BCT)
- Foreign Ministry
- Business Elite Networks
- Organized Opposition
- Foreign Powers (EU, IMF, Algeria, Gulf states, US)
- Population Blocs (regional, generational, economic)
- Media Ecosystem

These are not personas. They are **structured behavioral models** grounded in equations, historical patterns, and institutional memory.

---

## 2. What We Have Already Built

The hardest substrate is already in place.

### Data & Ingestion
- RSS pipeline (5-minute cycles)
- Telegram collection (18 channels, 40+ alert keywords, Telethon)
- Real-time variable nudging from article ingestion
- Signal Credibility Index (SCI) — 6-tier classification, Bayesian source reliability

### Risk Engine
- RRI Engine — 21 equations, 251 variables, full dynamic calculation
- Monte Carlo simulation — 10,000 runs
- SIR protest spread model
- Compound Stress Index — non-linear variable coupling
- Velocity and Acceleration indices
- Ministerial Instability Index (MII)
- Shock Taxonomy — 30 event types

### Intelligence Synthesis
- Intelligence Brief Engine — structured SITREP generation
- Multi-Framework Intelligence Layer — 6 analytical frameworks + contradiction detector
- Prediction Ledger — model performance tracking, analyst correction loop
- Calibration Dashboard — Brier scores, bias detection, per-variable accuracy

### Spatial & Temporal
- Emotional Heatmap — 24 governorates, GeoJSON, real-time emotion coloring
- Shock Propagation View — SIR model animated across governorate map
- Per-governorate RRI stress coloring — sensitivity profiles per governorate
- 10-day RRI sparkline wired to real history

### Actor & Network Systems
- Knowledge Graph — 50 entities, 46 relations, Supabase-backed, D3 explorer
- National Actor Network — force-directed graph, API-driven
- Geopolitical Network Graph — refactored from hardcoded to API-driven
- Actor cognition schema design — objectives, fears, decision style, probability matrices

### Cognitive UX
- Brain Mode — 10-view icon sidebar (Constellation, Projection, Terrain, Narrative Warfare, Heatmap, State Machine, SCI, Calibration, Shock Propagation, Telegram)
- National Command Center — 7-index gauge, domain polygon, per-gov map, threat cards
- National State Machine — 7-phase rules-based classifier with transition probabilities
- Narrative Warfare Engine — 10 frames, 6 emotions, slogan tracking, convergence scoring

### Infrastructure
- FastAPI backend on Cloud Run (europe-west2)
- Supabase with pgvector (real-time channels, RLS, auth)
- React 18 + TypeScript + Vite frontend
- Gemini API integration via Express proxy
- Variable pipeline wired into RSS + Telegram ingestion

---

## 3. The Architecture Stack

The complete system operates as a layered cognitive pipeline:

```
RAW SIGNALS
  RSS · Telegram · BCT · INS · TAP · Social · Satellite
        ↓
INTELLIGENCE PIPELINE
  Ingestion · Normalization · Entity Extraction · SCI Scoring
        ↓
RISK ENGINE
  RRI (21 equations) · Monte Carlo · SIR · Compound Stress
  Velocity · Cascade Probability · MII · Shock Taxonomy
        ↓
KNOWLEDGE GRAPH
  50+ entities · 46+ relations · Causal chains · Ontology
  Historical event memory · Actor profiles
        ↓
RAG MEMORY LAYER
  pgvector · Hybrid retrieval · Citation enforcement
  Doctrine library · Tunisia institutional memory
        ↓
COGNITIVE ACTOR LAYER
  Presidency · Military · UGTT · BCT · Opposition
  Foreign Powers · Business Elites · Population Blocs
        ↓
SIMULATION ENGINE
  Multi-agent deliberation · Crisis escalation
  Policy sandbox · Shock injection · Cascade modeling
        ↓
STRATEGIC DELIBERATION (HIGH TABLE)
  Agent debate · Coalition logic · Decision aggregation
  Counterfactual comparison · Confidence intervals
        ↓
DECISION FORECASTING
  Intelligence Briefs · Scenario outputs · Dossiers
  Executive alerts · Policy impact chains
```

---

## 4. The Intelligence Ontology (Critical Gap)

Before agents can reason, the system needs a formal causal map — a Tunisia-specific intelligence ontology defining how concepts connect, propagate, and amplify each other.

### What an Ontology Is

Not a list of entities. A directional causal graph with weights.

Example chain:
```
Wheat price spike
  → Bread subsidy pressure (+0.85)
  → Public anger activation (+0.72)
  → Labor unrest amplification (+0.65)
  → Narrative frame shift: Anti-IMF (+0.80)
  → Elite anxiety: BCT reserves (+0.60)
  → Security deployment signal (+0.55)
  → Repression risk (+0.70)
  → International condemnation probability (+0.45)
  → Investment chill (+0.50)
  → FX reserve pressure (+0.65)
  → More subsidy pressure (loop closes)
```

### Ontology Construction Protocol

**Step 1 — Seed from existing equations**
Extract causal relationships already encoded in RRI equations (EQ.1–EQ.24, EQ.A1–EQ.I4). Every variable dependency is a proto-ontology edge.

**Step 2 — Tunisia historical validation**
Trace each chain against documented Tunisian events (2008 mining basin, 2011 revolution, 2013 political crisis, 2021 self-coup, 2023–2026 economic deterioration). Adjust weights based on what actually happened.

**Step 3 — Doctrine grounding**
Cross-reference chains with intelligence methodology literature (escalation theory, crowd behavior, authoritarian resilience models). Add doctrine-derived chains not captured in current equations.

**Step 4 — Local sociology layer**
Encode Tunisia-specific patterns: informal power networks, tribal dynamics, regional sensitivities (Gafsa mining basin logic, Kasserine marginalization, Sfax business elite behavior), bureaucratic inertia, corruption network routing.

**Step 5 — Continuous update**
Every agent run and every calibration correction that improves prediction accuracy should propose ontology edge weight adjustments. Human analyst approval required before any change is applied.

### Critical Warning

Do not train the system only on Western intelligence doctrine. That produces American intelligence cosplay — analytically coherent but Tunisia-blind.

The ontology must carry equal weight from:
- Tunisia institutional sociology
- Local economic realities (informal sector, black market routing, subsidy dependency)
- Regional tribal logic and clan dynamics
- Bureaucratic behavior under Saied's consolidation
- Corruption network topology
- Street sentiment patterns by governorate
- Diaspora influence vectors

---

## 5. The RAG Layer (Memory Substrate)

RAG in TunisiaIntel is not a chatbot feature. It is the cognitive memory of the system.

### Knowledge Base Structure

**Layer 1 — Intelligence Doctrine Library**
Books, papers, doctrine on:
- Intelligence analysis methodology (Sherman Kent, Richards Heuer, structured analytic techniques)
- Strategic studies and statecraft
- Insurgency and counterinsurgency theory
- Regime survival and authoritarian resilience
- Crowd behavior and protest dynamics
- Psychological operations and narrative warfare
- Economic warfare and sanctions theory
- Escalation theory and crisis bargaining
- Systems thinking and complexity theory

This becomes the **reasoning substrate** — the cognitive training base for all agents.

**Layer 2 — Tunisia Knowledge Graph**
Encoded entities, relations, and causal chains specific to Tunisia. Historical events, actor profiles, institutional memory. This becomes the **national memory**.

**Layer 3 — Live Signal Layer**
Continuous article ingestion, Telegram monitoring, BCT/INS data. Embedded with metadata: governorate, actors, confidence, language, timestamp. This becomes the **sensory nervous system**.

**Layer 4 — Analytical Output Layer**
Every agent run, every intelligence brief, every calibration result stored with full provenance: model version, confidence score, trigger source, citations. This becomes the **institutional intelligence memory**.

### Retrieval Requirements
- Hybrid retrieval: semantic vector search + keyword/BM25 + metadata filters
- Every output must carry citations (source, date, confidence)
- No output without provenance. No provenance, no deployment.
- Multilingual: Arabic, French, English with canonical entity mapping

---

## 6. The Cognitive Actor Layer

### Actor Schema Standard

Every actor is a structured cognition schema, not a prompt.

```json
{
  "actor_id": "string",
  "actor_name": "string",
  "objectives": ["weighted list of goals"],
  "fears": ["trigger conditions with thresholds"],
  "decision_style": "centralized | consensus | factional | reactive",
  "risk_tolerance": 0.0–1.0,
  "time_horizon": "short | medium | long",
  "preferred_tools": ["action repertoire"],
  "doctrine": "institutional survival principle",
  "historical_patterns": ["encoded past behavior references"],
  "input_sensitivity": {
    "signal_type": 0.0–1.0
  },
  "output_probability_matrix": {
    "action_type": 0.0–1.0
  },
  "state_update_rules": {
    "if input_signal > threshold → adjust output_probability by delta"
  }
}
```

The `state_update_rules` field is critical — this is what the current blueprint is missing. Static probability matrices produce snapshots, not cognition. Every actor needs explicit rules for how its behavior shifts as conditions change.

### Actor Validation Protocol

Before any actor model is deployed, it must be backtested against historical events:

- 2008: Gafsa mining basin protests — what did each actor do?
- 2010–2011: Revolution trajectory — who defected, when, and at what threshold?
- 2013: Bardo assassinations and political crisis — negotiation dynamics
- 2021: Presidential self-coup — military posture, opposition response, foreign reaction
- 2023–2026: IMF negotiations, subsidy pressure, economic deterioration — BCT behavior, UGTT positioning

Actor outputs for these events must match documented reality before the model is trusted for future forecasting.

---

## 7. The Deliberation Engine

### The Problem It Solves

Individual actor models produce isolated probability estimates. The deliberation engine answers: when four actors have conflicting recommendations, what decision actually emerges?

### Deliberation Protocol

```
1. Crisis or policy question injected
2. Each actor generates position (recommendation + confidence + reasoning chain)
3. Positions submitted to deliberation table
4. Conflict detection: identify contradictions between actor positions
5. Authority weighting: apply institutional hierarchy and context-specific power
6. Coalition detection: which actors naturally align?
7. Deadlock or resolution: output consensus, partial compromise, or escalation
8. Decision stored with full deliberation trace
```

Example output:
```
SCENARIO: Remove bread subsidy — IMF pressure (Q3 2027)

Interior Ministry: OPPOSE — unrest probability 0.84 (confidence: 0.82)
Central Bank: SUPPORT — reserve depletion critical (confidence: 0.75)
Foreign Ministry: CONDITIONAL — EU support if phased (confidence: 0.68)
Military: OPPOSE — escalation risk exceeds containment capacity (confidence: 0.90)
UGTT: OPPOSE — general strike threshold triggered (confidence: 0.88)

DELIBERATION OUTPUT:
  Coalition against: Interior + Military + UGTT (combined weight: 0.71)
  Coalition for: BCT + Foreign Ministry (combined weight: 0.42)
  Presidency decision modeled: Delay + distraction narrative + partial phasing
  Confidence: 0.67
  Historical analogue: 2023 fuel subsidy partial adjustment pattern
```

### Authority Weighting Rules

Authority is not fixed. It is context-sensitive:
- Economic crisis → BCT weight increases
- Security crisis → Military weight increases  
- Labor unrest → UGTT veto power activates above strike threshold
- Foreign pressure → Foreign Ministry weight increases
- Legitimacy collapse → Presidency loses override capacity

---

## 8. The Simulation Chamber

### Simulation Types

| Type | Description | Key Output |
|------|-------------|------------|
| Crisis Escalation | Rapid deterioration chains | Unrest map, fracture probability |
| Policy Sandbox | "What if decision X" | Multi-actor reaction cascade |
| Shock Injection | Black swan events | Systemic response chain |
| Negotiation Simulation | Multi-actor bargaining | Outcome probability distribution |
| Regional Cascade | Cross-border contagion | Spillover vectors |
| Regime Adaptation | How the system mutates under pressure | Stability trajectory |

### Simulation Output Standard

Every simulation run must produce:
- Unrest probability and intensity (by governorate)
- Elite fracture probability and likely locus
- Foreign actor reaction vectors
- Migration pressure indicators
- Political survival probability (current regime)
- Narrative warfare evolution
- Economic feedback loops
- Military posture shift probability
- Confidence interval for each output
- Sensitivity analysis: which variable moves the outcome most?
- Counterfactual: same scenario with alternative decision

---

## 9. Build Phases

### Phase 0 — Trust & Production Integrity *(In Progress)*
**Goal:** No fake data in production. Every component declares its truth class.

- Remove MOCK/PLACEHOLDER from all production routes
- Badge all HYBRID surfaces (LIVE / CALIBRATED / SIMULATION)
- Implement truth classification on all nav/components
- Disable VITE_DEMO_CODE in production

**Exit criteria:** No paying user can reach FAKE without Labs opt-in.

---

### Phase 1 — Canonical State *(Next Priority)*
**Goal:** One authoritative national state snapshot. All modes read from it.

- Define `NationalStateSnapshot` schema (TypeScript + Supabase + Python)
- One writer: Python orchestrator primary, frontend read-only
- Refactor PipelineContext to consume snapshots
- `GET /api/state/latest` + `/api/rri` consistency across all modes

**Exit criteria:** Same RRI value in Professional, Tactical ticker, and API for same state version.

---

### Phase 2 — Tunisia Strategic Ontology v1 *(Foundation for everything after)*
**Goal:** Formal causal map encoding how Tunisia actually behaves.

- Extract causal edges from existing RRI equations (auto-seed)
- Validate chains against 5 historical events (2008, 2011, 2013, 2021, 2024)
- Add doctrine-derived chains from intelligence methodology literature
- Encode Tunisia-specific local sociology layer
- Store as enriched knowledge graph in Supabase

**Exit criteria:** System can trace a causal chain from "wheat price spike" to "protest cascade" with historically-validated weights.

---

### Phase 3 — RAG Substrate *(Memory Layer)*
**Goal:** Unified retrieval powering briefs, agents, dossiers, terminal.

- Ingest Doctrine Library (intelligence methodology, strategic studies)
- Ingest Tunisia historical event database (2000–2026)
- Hybrid retrieval: semantic + keyword + metadata
- Citation enforcement on every generation call
- Wire to: Intelligence Brief, Dossier export, Analyst Terminal

**Exit criteria:** Every AI output carries citations. No output without provenance.

---

### Phase 4 — Actor Cognition Profiles *(Cognitive Layer)*
**Goal:** Structured behavioral models for all High Table members.

- Build 11 actor schemas (Presidency, Military, Interior, UGTT, BCT, Foreign, Business, Opposition, EU/IMF, Algeria/Gulf, Population)
- Add state_update_rules to each schema
- Backtest each actor against 5 historical events
- Store profiles in Supabase with versioning

**Exit criteria:** Actor outputs for 2011 revolution match documented institutional behavior at each phase.

---

### Phase 5 — Agency Brain Training *(Intelligence Doctrine Layer)*
**Goal:** The system reasons from doctrine, not just pattern matching.

- Ingest and chunk intelligence methodology library
- Ingest Tunisia-specific sociology, institutional behavior, informal power maps
- Build doctrine retrieval layer (separate namespace from live signals)
- Wire doctrine retrieval into agent reasoning chains
- Calibration: does doctrine grounding improve prediction accuracy?

**Exit criteria:** Agent reasoning chains cite doctrine and Tunisia-specific patterns, not just current signals.

---

### Phase 6 — Deliberation Engine *(High Table MVP)*
**Goal:** Agents debate. System outputs decision probability with full trace.

- Implement deliberation protocol (position submission, conflict detection, coalition logic, resolution)
- Authority weighting system (context-sensitive)
- Output: consensus OR deadlock OR escalation with confidence
- Store every deliberation with full trace in Supabase
- Wire into policy sandbox UI

**Exit criteria:** Deliberation output for subsidy removal scenario matches historical 2023 decision pattern.

---

### Phase 7 — Simulation Chamber *(Full Frontier)*
**Goal:** "What happens next if X" — fully modeled.

- Scenario fork API from canonical state snapshot
- Multi-actor reaction cascade engine
- Monte Carlo robustness testing per scenario
- Sensitivity analysis per simulation
- Counterfactual comparison interface
- Brain Mode views consume real simulation results

**Exit criteria:** Analysts can test a policy decision and receive probability distributions with full deliberation trace.

---

### Phase 8 — High Table Interface *(UX Frontier)*
**Goal:** The circular deliberation table as a strategic interface.

- Dark strategic room UI centered on Tunisia map
- Each High Table member: live stress indicator, current posture, likely moves
- Crisis injection: analyst inputs scenario, table responds in real time
- Full deliberation trace visible and inspectable
- Human analyst override and annotation layer

**Exit criteria:** An analyst can run a crisis simulation and inspect every actor's reasoning chain.

---

## 10. The Real Moat

The platform's defensibility is not the UI, the equations, or the models.

The moat is the **accumulated Tunisia-specific intelligence ontology** — built over years of ingestion, calibration, and validation against real events.

This includes:
- How Tunisian institutions actually behave (not how they say they behave)
- How narratives spread through specific regional sociology
- How elites defect at which thresholds and under which pressures
- How protest cascades actually propagate between governorates
- How the BCT behaves under simultaneous IMF and political pressure
- How UGTT positions itself between class interest and national legitimacy

No generic AI system can replicate this. It requires years of Tunisia-specific training data, calibration against real outcomes, and institutional memory that accumulates over time.

That is the sovereign intelligence asset. Everything else is infrastructure.

---

## 11. What We Are Not Building

To stay disciplined:

| Not Building | Why |
|-------------|-----|
| A chatbot | Freeform conversation produces inconsistent intelligence |
| A news aggregator | Signal without interpretation is noise |
| A generic political risk tool | Tunisia-specific cognition is the entire value |
| A real intelligence agency | No operations, no HUMINT, no enforcement capability |
| AGI | Structured cognition, memory, incentives, and interaction models are sufficient |
| More dashboards | Architecture coherence matters more than surface expansion |

---

## 12. Principles That Must Not Break

| Principle | Enforcement |
|-----------|------------|
| **Structured** | All cognition is schema-backed, not freeform |
| **Probabilistic** | Every prediction carries confidence intervals |
| **Transparent** | Reasoning chains are always inspectable |
| **Equation-backed** | Mathematical models ground all assessments |
| **Source-grounded** | All inputs traceable to real signals |
| **Citation-mandatory** | No output without provenance |
| **Human-in-loop** | System never self-applies weight changes. Analyst approves. |
| **Tunisia-first** | Doctrine is calibrated against local reality, not generic theory |

---

## 13. Reference Documents

| File | Role |
|------|------|
| `METHODOLOGY.md` | RRI equations and mathematical foundations |
| `ARCHITECTURE.md` | Folder structure and data flow |
| `TunisiaIntel_Strategic_Evolution_Plan.md` | Phase completion status |
| `TunisiaIntel_RAG_Architecture.md` | RAG layer design |
| `upgrade_saas.md` | SaaS commercialization plan |
| `proffesional__1_.md` | Professional mode component reference |
| `TunisiaIntel_Strategic_Brain_Layer_Blueprint.md` | Actor cognition and simulation design |

---

*Document version 1.0 — 2026-05-21*  
*Synthesized from: Strategic Evolution Plan, RAG Architecture, Brain Layer Blueprint, upgrade plan, and architectural review sessions.*
