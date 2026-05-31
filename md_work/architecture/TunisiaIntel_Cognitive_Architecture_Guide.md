# TunisiaIntel Cognitive Architecture Guide
## AnythingLLM as a National-Scale Intelligence Memory System

> **Purpose:** This document defines the complete architecture, content strategy, and implementation roadmap for deploying AnythingLLM as the sovereign cognitive layer of TunisiaIntel — transforming it from a chatbot interface into a national-scale intelligence operating system.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Workspace Architecture](#2-workspace-architecture)
3. [Content Doctrine by Layer](#3-content-doctrine-by-layer)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [API Automation & Infrastructure](#5-api-automation--infrastructure)
6. [Quality & Governance Principles](#6-quality--governance-principles)
7. [Evolution to Autonomous Intelligence](#7-evolution-to-autonomous-intelligence)
8. [Appendix A: Implementation Status](#appendix-a-implementation-status)

---

## 1. Design Philosophy

### 1.1 What You Are Building

You are **NOT** building:
- A chatbot
- A RAG demo
- A Q&A assistant

You **ARE** building:

> **A sovereign, national-scale cognitive intelligence architecture.**

The goal is not retrieval. The goal is:
- **Memory** — persistent institutional knowledge
- **Synthesis** — cross-domain reasoning
- **Strategic reasoning** — doctrine-informed analysis
- **Pattern recognition** — historical analogical thinking
- **Simulation** — scenario modeling and forecasting
- **Institutional knowledge** — encoded analytical logic

### 1.2 The Cognitive Twin Model

Think of AnythingLLM as:

> **Your sovereign intelligence memory + reasoning engine.**

It becomes a "cognitive twin" of Tunisia — a living memory system that understands the country's economic, political, security, and social dynamics through the lens of intelligence theory and proprietary analytical models.

### 1.3 Core Principle: Quality Over Quantity

**Better:** 200 elite, curated documents  
**Than:** 50,000 noisy, unfiltered PDFs

Bad memory architecture ruins the entire future system. The institutional memory phase is the **most important** phase.

---

## 2. Workspace Architecture

Do **NOT** dump everything into one giant thread. Treat AnythingLLM like an intelligence agency knowledge architecture — with strict domain separation.

### 2.1 The Seven Workspaces

| Workspace | Purpose | Cognitive Function |
|-----------|---------|-------------------|
| `CORE_DOCTRINE` | Teaches the AI **how to think** | Strategic reasoning foundation |
| `TUNISIA_STATE` | Teaches the AI **national reality** | Economic and state analysis |
| `POLITICAL_ACTORS` | Teaches the AI **behavioral dynamics** | Actor mapping and political forecasting |
| `SECURITY_INTEL` | Teaches the AI **threat landscapes** | Security and instability analysis |
| `HISTORICAL_MEMORY` | Teaches the AI **pattern recognition** | Historical analogical reasoning |
| `RRI_ENGINE` | Teaches the AI **risk modeling** | Quantitative reasoning and simulation |
| `LIVE_INTELLIGENCE` | Teaches the AI **current awareness** | Real-time monitoring and brief generation |

### 2.2 Workspace Isolation Rules

- **Never mix** random PDFs into the `RRI_ENGINE` workspace. Keep it "clean."
- **Never duplicate** files across workspaces.
- **Never ingest** low-quality internet junk.
- Each workspace should function as a **specialized intelligence cell** with its own analytical domain.

### 2.3 Recommended Configuration Templates

| Workspace | Temperature | Context Strategy |
|-----------|-------------|------------------|
| `RRI_ENGINE` | 0.1 | Deterministic, formula-driven |
| `LIVE_INTELLIGENCE` | 0.2 | Factual, current-event focused |
| `HISTORICAL_MEMORY` | 0.3 | Analogical, pattern-seeking |
| `CORE_DOCTRINE` | 0.4 | Creative, strategic reasoning |

---

## 3. Content Doctrine by Layer

### 3.1 Layer 1 — Core Intelligence Doctrine (`CORE_DOCTRINE`)

This creates the **"mind"** of the system. It teaches the AI how to think like an intelligence analyst.

**Content Types:**
- Intelligence theory and analytical tradecraft
- Strategic doctrine and military theory
- Political risk methodologies
- OSINT manuals and frameworks
- Crisis escalation theory
- Psychological operations and cognitive warfare
- Hybrid warfare doctrine
- Decision science and forecasting
- Systems thinking and complex adaptive systems
- Elite theory and regime stability literature
- Revolution dynamics and protest theory
- Propaganda and narrative warfare theory

**Source Examples:**
- RAND Corporation research papers
- NATO doctrine PDFs
- CIA declassified manuals
- Intelligence studies journals
- Counterinsurgency manuals
- Strategic foresight literature

> **Without this layer, the AI is just generic ChatGPT.**

### 3.2 Layer 2 — Tunisia State Memory (`TUNISIA_STATE`)

This creates the **national twin** — the empirical foundation of Tunisia's current condition.

**Economic:**
- BCT (Central Bank) monthly reports
- INS (National Statistics) datasets
- Ministry of Finance reports
- IMF Tunisia country reports
- World Bank Tunisia indicators
- African Development Bank reports
- Moody’s / Fitch ratings (if available)

**Social & Structural:**
- Migration data and trends
- Youth unemployment statistics
- Regional inequality indices
- Water stress and scarcity reports
- Education system strain data
- Healthcare system indicators

### 3.3 Layer 3 — Political Actor Mapping (`POLITICAL_ACTORS`)

**Content:**
- Kais Saied speeches and decrees
- UGTT (labor union) statements and positions
- Ennahda communications and network analysis
- Opposition coalition dynamics
- Military statements and neutrality indicators
- Political timelines and decree analysis (e.g., Decree 54)
- Elite network notes and business elite positioning

**Purpose:** Actor mapping, behavioral prediction, and elite cohesion tracking.

### 3.4 Layer 4 — Security & Threat Intelligence (`SECURITY_INTEL`)

**Content:**
- Protest event databases and timelines
- Terrorism and extremism reports
- Border incidents and smuggling routes
- Military doctrine and communiqués
- Migration crisis tracking
- Regional instability spillover (Libya, Algeria)
- Organized crime trends

**Purpose:** Security analysis, threat assessment, and instability forecasting.

### 3.5 Layer 5 — Historical Pattern Memory (`HISTORICAL_MEMORY`)

This is **CRITICAL** for pattern recognition. Create structured, annotated timelines.

**Tunisia:**
- 1978 general strike
- 1984 bread riots
- 2008 Gafsa mining basin uprising
- 2010–2011 revolution
- 2013 political assassinations
- July 25, 2021 constitutional coup
- Migration crises and water crises

**Regional:**
- Libya collapse and civil war
- Egypt 2011 revolution and 2013 coup
- Algeria Hirak movement
- Lebanon economic collapse
- Sudan instability and coup dynamics

**Global:**
- Arab Spring wave dynamics
- 2008 financial crisis contagion
- COVID-19 state strain
- Ukraine war (resource and migration effects)
- Gaza war (regional polarization)

### 3.6 Layer 6 — Proprietary Models (`RRI_ENGINE`) — MOST IMPORTANT

This is where TunisiaIntel becomes **unique and proprietary**.

**Content:**
- Your 20 equations and formulas
- RRI (Regime Risk Index) framework documentation
- Governorate-level risk models
- Cascade theory and spread mechanics
- Elite defection logic and thresholds
- Velocity index methodology
- Historical similarity engine logic
- Information amplification models
- Scenario simulation parameters

**Format:** Create dedicated, modular markdown files for each model.

```markdown
# EQ17: Regional Cascade Model

## Purpose
Estimate probability of instability spreading between governorates.

## Formula
P_cascade(t) = f(unemployment, water_stress, protest_history, ...)

## Inputs
- unemployment_rate
- water_stress_index
- protest_history_12m
- elite_defection_signal
- media_amplification_factor

## Thresholds
- Low: < 0.3
- Medium: 0.3–0.6
- High: > 0.6
```

> **Your custom markdown files are more valuable than external PDFs because they encode YOUR analytical doctrine.**

### 3.7 Layer 7 — Live Intelligence (`LIVE_INTELLIGENCE`)

**Future connections:**
- RSS feeds (news, official statements)
- Twitter/X monitoring
- News APIs
- Economic data APIs
- OONI (internet censorship monitoring)
- ACLED (armed conflict location data)
- GDELT (global event database)
- IMF / World Bank real-time indicators
- Trading Economics feeds

**Purpose:** Transform the system from an archive into a **living intelligence system**.

---

## 4. Implementation Roadmap

### 4.1 Phase 1: Foundation (Days 1–3)

| Day | Action | Workspaces |
|-----|--------|------------|
| **Day 1** | Create `CORE_DOCTRINE` — ingest 20–50 elite doctrine documents | CORE_DOCTRINE |
| | Create `RRI_ENGINE` — upload your proprietary markdown models | RRI_ENGINE |
| **Day 2** | Create `HISTORICAL_MEMORY` — build structured crisis timelines | HISTORICAL_MEMORY |
| | Create `TUNISIA_STATE` — upload BCT, INS, IMF, World Bank reports | TUNISIA_STATE |
| **Day 3** | Create `POLITICAL_ACTORS` — actor dossiers and timelines | POLITICAL_ACTORS |
| | Create `SECURITY_INTEL` — threat databases and incident logs | SECURITY_INTEL |

### 4.2 Phase 2: Cognitive Testing (Week 1)

Test the system's reasoning by asking questions that require **synthesis, memory, and cross-domain reasoning**:

- "What variables increase revolutionary salience in Tunisia?"
- "Compare Tunisia 2026 to Egypt 2010. What are the structural similarities and differences?"
- "Which governorates have the highest cascade potential under water stress conditions?"
- "How would water stress amplify unrest in the south?"
- "What indicators precede elite fragmentation in authoritarian consolidation phases?"

You are testing:
- Synthesis across doctrine + state data
- Memory retrieval across historical + current data
- Cross-domain reasoning (economy → politics → security)

### 4.3 Phase 3: Automation & Scale (Week 2+)

- Build workspace seeder scripts
- Build automated ingestion pipelines
- Add metadata tagging
- Connect live data feeds
- Deploy agent layer

### 4.4 Phase 4: Living System (Ongoing)

- Autonomous monitoring
- Daily intelligence brief generation
- Scenario engine activation
- Predictive chain reaction modeling
- Narrative warfare detection

---

## 5. API Automation & Infrastructure

Do **NOT** manually manage dozens of workspaces. Use the AnythingLLM API to automate the entire cognitive architecture.

### 5.1 Automated Workspace Creation

```typescript
// workspaceSeeder.ts
const workspaces = [
  "CORE_DOCTRINE",
  "RRI_ENGINE",
  "HISTORICAL_MEMORY",
  "TUNISIA_STATE",
  "POLITICAL_ACTORS",
  "SECURITY_INTEL",
  "LIVE_INTELLIGENCE"
];

async function seedWorkspaces() {
  for (const name of workspaces) {
    await fetch("http://localhost:3001/api/v1/workspace/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
  }
}
```

### 5.2 Automated Document Ingestion

```typescript
// documentIngestor.ts
// Flow: /incoming/bct_reports → Parser → Chunker → Embeddings → Workspace

async function ingestDocument(filePath: string, workspace: string, metadata: object) {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append("metadata", JSON.stringify(metadata));

  await fetch(`/api/v1/workspace/${workspace}/upload`, {
    method: "POST",
    body: formData
  });
}
```

### 5.3 Structured Metadata Schema

Every document must carry metadata for later agent filtering:

```json
{
  "country": "Tunisia",
  "domain": "Economy",
  "source": "BCT",
  "year": 2026,
  "classification": "official",
  "workspace": "TUNISIA_STATE",
  "language": "fr",
  "reliability": "A"
}
```

### 5.4 Recommended Project Structure

```
/scripts
    workspaceSeeder.ts          # One-click architecture deployment
    documentIngestor.ts         # Automated PDF → embedding pipeline
    metadataMapper.ts           # Metadata tagging and validation
    syncEconomicReports.ts      # Scheduled BCT/IMF sync
    agentRouter.ts              # Cross-workspace query routing

/incoming
    /bct_reports
    /imf_tunisia
    /security_incidents
    /political_speeches

/models
    /rri_equations
    /cascade_models
    /scenario_configs

/doctrine
    /intelligence_theory
    /hybrid_warfare
    /political_risk
```

### 5.5 Future Agent Architecture

```
User Question
    ↓
Router Agent (selects relevant workspaces)
    ↓
Retrieve: Doctrine + State Data + Historical Patterns + RRI Models
    ↓
Specialized Agents:
    - Economic Agent (TUNISIA_STATE)
    - Political Agent (POLITICAL_ACTORS)
    - Security Agent (SECURITY_INTEL)
    - Forecasting Agent (RRI_ENGINE)
    - Narrative Agent (LIVE_INTELLIGENCE)
    ↓
Synthesis & Simulation
    ↓
Intelligence Assessment Output
```

This is **far beyond normal RAG**. This is multi-agent cognitive orchestration.

---

## 6. Quality & Governance Principles

### 6.1 The Golden Rules

1. **Quality > Quantity** — 200 elite documents beat 50,000 noisy PDFs.
2. **Modularity > Monolith** — Small, focused markdown files beat giant unstructured PDFs.
3. **Isolation > Mixing** — Never cross-contaminate workspaces.
4. **Metadata > Memory** — Structured tagging enables agent-level filtering.
5. **Doctrine > Data** — How the AI thinks matters more than what it knows.

### 6.2 Custom Doctrine Files

Inside each workspace, create small curated markdown files yourself. Examples:

- `Tunisia Elite Cohesion Framework`
- `Governorate Cascade Logic`
- `Saied Regime Stability Model`
- `Military Neutrality Indicators`
- `Water Stress → Unrest Amplification Pathway`

These encode **your proprietary analytical logic** and become the system's unique intellectual property.

### 6.3 Document Curation Checklist

Before ingesting any document, verify:
- [ ] Is it relevant to the workspace's domain?
- [ ] Is it from a credible source?
- [ ] Is it recent enough to be useful?
- [ ] Is it free of duplication?
- [ ] Does it have complete metadata?
- [ ] Is it better as a summary than a full PDF?

---

## 7. Evolution to Autonomous Intelligence

### 7.1 The Evolution Chain

```
Institutional Memory Phase (NOW)
    ↓
Vector DB + Structured RAG
    ↓
Agent Layer (specialized reasoning cells)
    ↓
Simulation Engine (scenario modeling)
    ↓
Autonomous Monitoring (always-on sensing)
    ↓
National Cognitive Twin (sovereign intelligence OS)
```

### 7.2 What Changes at Each Stage

| Stage | Capability | Key Addition |
|-------|-----------|--------------|
| **Memory** | Retrieval and synthesis | Curated workspaces |
| **RAG** | Grounded reasoning | Vector embeddings + metadata |
| **Agents** | Specialized analysis | Router + domain agents |
| **Simulation** | Predictive modeling | RRI engine + scenario configs |
| **Monitoring** | Real-time awareness | Live APIs + alert system |
| **Cognitive Twin** | Autonomous assessment | Full-loop: sense → reason → forecast → alert |

### 7.3 The End State

At the final stage, TunisiaIntel stops being "RAG" and becomes:

> **A cognitive twin of Tunisia — a sovereign institutional intelligence memory that senses, reasons, simulates, and forecasts the nation's trajectory.**

This is where the project becomes genuinely strategic.

---

## Appendix A: Implementation Status

### Infrastructure — ✅ Complete
- [x] 7 AnythingLLM workspaces created via API
- [x] `doctrine_client.py` — workspace list, keyword mapping, status/search/ingest methods
- [x] Backend API endpoints: `GET /api/doctrine/status`, `GET /api/doctrine/search`, `POST /api/doctrine/ingest`
- [x] Historical events dataset (`doctrine/api.py` + `historical_events.py`)
- [x] RAG tab in SystemCommandCenter updated to reflect cognitive architecture
- [x] Cross-workspace search with automatic `workspace_suggest` routing

### Document Ingestion — ❌ Not Started
- [ ] `CORE_DOCTRINE`: 20–50 intelligence theory, strategy, doctrine PDFs
- [ ] `RRI_ENGINE`: All proprietary markdown models and equations
- [ ] `HISTORICAL_MEMORY`: Structured Tunisia + regional crisis timelines
- [ ] `TUNISIA_STATE`: BCT, INS, IMF, World Bank economic reports
- [ ] `POLITICAL_ACTORS`: Key actor dossiers, speeches, decrees
- [ ] `SECURITY_INTEL`: Incident databases, threat assessments
- [ ] `LIVE_INTELLIGENCE`: RSS, news APIs, social monitoring sources

### Automation — ❌ Not Started
- [ ] Workspace seeder script (`scripts/workspaceSeeder.ts`)
- [ ] Document ingestor script (`scripts/documentIngestor.ts`)
- [ ] Metadata mapper script (`scripts/metadataMapper.ts`)
- [ ] Scheduled economic report sync (`scripts/syncEconomicReports.ts`)
- [ ] Cross-workspace agent router (`scripts/agentRouter.ts`)

### Cognitive Validation — ❌ Not Started
- [ ] Cross-domain synthesis queries (see Appendix B)
- [ ] Historical analogical reasoning tests
- [ ] RRI model grounding verification
- [ ] Multi-workspace retrieval accuracy audit

### Priority Document List

| Priority | Workspace | Content | Target |
|----------|-----------|---------|--------|
| **P0** | `CORE_DOCTRINE` | Intelligence theory, RAND papers, NATO doctrine | 20–50 docs |
| **P0** | `RRI_ENGINE` | Custom markdown models, equations, cascade logic | 10–20 docs |
| **P1** | `HISTORICAL_MEMORY` | Tunisia crisis timelines, Arab Spring, regional history | 15–30 docs |
| **P1** | `TUNISIA_STATE` | BCT monthly, IMF country reports, World Bank indicators | 20–40 docs |
| **P2** | `POLITICAL_ACTORS` | Saied decrees, UGTT statements, elite dossiers | 15–25 docs |
| **P2** | `SECURITY_INTEL` | Protest databases, border incidents, threat assessments | 10–20 docs |
| **P3** | `LIVE_INTELLIGENCE` | RSS feeds, news APIs, Telegram channels | Ongoing |

---

## Appendix B: Testing Questions for Cognitive Validation

Use these to validate that the system is reasoning, not just retrieving:

1. "What variables increase revolutionary salience in Tunisia specifically?"
2. "Compare Tunisia 2026 to Egypt 2010 across economic, political, and military dimensions."
3. "Which governorates have the highest cascade potential and why?"
4. "How would a 20% water stress increase in the south amplify unrest probability?"
5. "What indicators would precede a significant elite fragmentation event?"
6. "Apply cascade theory to a hypothetical protest in Gafsa. What is the 30-day trajectory?"
7. "What does historical memory suggest about the durability of Saied's constitutional model?"

---

*Document Version: 1.0*  
*Architecture: TunisiaIntel v2.0 Cognitive Layer*  
*Platform: AnythingLLM (API-driven deployment)*
