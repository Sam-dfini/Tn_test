# TunisiaIntel v3.0 — Cognitive Intelligence Workspace
## Strategic Blueprint & Technical Architecture

**Status:** Draft v1.0  
**Date:** 2026-05-21  
**Classification:** Internal Roadmap  
**Author:** System Architect / Product Strategy  

---

## 1. Executive Summary

TunisiaIntel is evolving from a **multi-tab risk intelligence dashboard** into a **Cognitive Intelligence Workspace** — a unified, conversational operating system for geopolitical analysis specialized on Tunisia.

The core paradigm shift:

> **From:** User navigates static dashboards → **To:** AI navigates intelligence for the user.

This document defines the architecture, component registry, orchestration layer, and implementation roadmap required to reach this end-state.

---

## 2. The Product Thesis

### 2.1 Problem with Dashboard-First Intelligence
- Cognitive overload from 40+ disconnected views
- Users must *know where to look* before they can *know what to ask*
- Static layouts cannot adapt to query specificity
- Exporting insights requires manual copy-paste across tabs
- No persistent investigation context across sessions

### 2.2 The Conversational Workspace Solution
A single immersive interface where:
- **Left Panel:** Conversational command center (query → reasoning → response)
- **Right Panel:** Dynamically generated intelligence widgets (adaptive, query-specific)
- **Top Bar:** Quick-action macro triggers ("Morning Brief", "Escalation Watch", "Economic Snapshot")
- **Bottom:** Persistent query input with context awareness

**Key principle:** The conversation *is* the navigation. The interface *is* the report.

---

## 3. Core Concepts

### 3.1 Intelligence Blocks (Dynamic Widgets)
Every visual component becomes a **callable, parameterized, self-contained intelligence block**.

| Block ID | Function | Data Sources | Models |
|----------|----------|--------------|--------|
| `rri-gauge` | Revolution Risk Index live probability | Economic, social, media | RRI equation: $P_{rev}(t)=\frac{1}{1+e^{-0.8R(t)-2.1}}$ |
| `governorate-heatmap` | Interactive Tunisia risk map | Subnational data, protest geolocation | Spatial clustering, kernel density |
| `protest-sir` | Epidemiological protest spread | Event data, social network proxies | SIR model: $\frac{dI}{dt}=\beta SI - \gamma I$ |
| `economic-stress` | FX, inflation, unemployment, debt | Central Bank, IMF, World Bank | Time-series, anomaly detection |
| `elite-network` | Regime cohesion / fragmentation | OSINT, biographical, media co-mention | Graph analysis, betweenness centrality |
| `monte-carlo-futures` | Scenario simulation (3-path) | All macro indicators | Monte Carlo with regime-switching |
| `water-stress` | Drought / scarcity indicators | NASA GRACE, climate models | Hydrological stress index |
| `migration-flow` | Irregular migration vectors | IOM, border incident data | Gravity model, agent-based |
| `actor-timeline` | Escalation chronology | Event database, NLP extraction | Temporal graph, burst detection |
| `narrative-warfare` | Disinformation / framing detection | Social media, state media, Telegram | Narrative clustering, LLM classification |
| `confidence-meter` | Model uncertainty visualization | All model outputs | Confidence interval aggregation |
| `comparative-historical` | Tunisia vs. Egypt 2011, etc. | Historical case DB | Similarity scoring, structural analogy |

### 3.2 The Orchestration Layer (Cognitive Core)
The AI does not merely respond with text. It **reasons across the intelligence stack** and assembles a structured response.

**Orchestration Flow:**
```
User Query
    ↓
[Intent Router] → Classify: analytical | predictive | comparative | monitoring
    ↓
[Context Engine] → Load: current investigation, prior hypotheses, selected actors
    ↓
[Capability Selector] → Decide: which blocks, which models, which datasets
    ↓
[Parallel Execution] → RAG retrieval + Model inference + Graph queries + Simulation runs
    ↓
[Synthesis Engine] → Narrative generation + Block parameterization + Confidence scoring
    ↓
[Response Assembler] → Structured JSON → Frontend renders adaptive layout
    ↓
User receives: narrative + live widgets + drill-down paths
```

### 3.3 Persistent Intelligence Memory
Conversations are not ephemeral. They become **investigation dossiers**.

**Memory Layers:**
- **Session Context:** Current thread, selected actors, active hypotheses
- **Investigation Graph:** Linked questions, evidence blocks, conclusions
- **Entity Watchlist:** Users pin actors, regions, indicators for persistent monitoring
- **Report Builder:** Any conversation can be exported as a formatted intelligence brief (PDF/Markdown)

---

## 4. Technical Architecture

### 4.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND: COGNITIVE WORKSPACE                 │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐  │
│  │  Chat Panel  │  │      Dynamic Intelligence Canvas        │  │
│  │  (Command)   │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌──────────┐  │  │
│  │              │  │  │Block│ │Block│ │Block│ │  Block   │  │  │
│  │  Input       │  │  │  1  │ │  2  │ │  3  │ │    N     │  │  │
│  │  History     │  │  └─────┘ └─────┘ └─────┘ └──────────┘  │  │
│  │  Reasoning   │  │         (Adaptive Grid Layout)            │  │
│  └──────────────┘  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    ORCHESTRATION LAYER                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │Intent Router│ │Context Eng. │ │Block Regist.│ │Synthesis  │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    INTELLIGENCE ENGINE                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  RAG     │ │  Models  │ │  Graph   │ │  Simulation      │   │
│  │  Engine  │ │  (RRI,   │ │  Engine  │ │  (Monte Carlo,   │   │
│  │          │ │  SIR,    │ │          │ │  Agent-Based,    │   │
│  │          │ │  Elite)  │ │          │ │  Scenario)       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    DATA & INFRASTRUCTURE                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Supabase │ │  OSINT   │ │  Static  │ │  Background      │   │
│  │ Realtime │ │  Feeds   │ │  DBs     │ │  Workers         │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Widget Registry Specification

Every block must implement a standard interface:

```typescript
interface IntelligenceBlock {
  id: string;                    // Unique block identifier
  version: string;               // Semantic version
  category: 'risk' | 'economic' | 'social' | 'simulation' | 'network' | 'temporal';

  // Parameter schema for dynamic configuration
  parameters: z.ZodSchema;

  // Data requirements
  requiredData: DataSource[];

  // Rendering
  render: (props: BlockProps, data: BlockData) => ReactNode;

  // Metadata
  confidenceMetric: boolean;     // Does this block expose uncertainty?
  exportable: boolean;           // Can be included in report builder?
  drillDown: boolean;            // Supports deeper exploration?
}

// Example: RRI Gauge Block
const rriGaugeBlock: IntelligenceBlock = {
  id: 'rri-gauge',
  version: '2.1.0',
  category: 'risk',
  parameters: z.object({
    timeframe: z.enum(['30d', '90d', '1y']),
    governorates: z.array(z.string()).optional(),
    showComponents: z.boolean().default(true)
  }),
  requiredData: ['economic_indicators', 'protest_events', 'media_sentiment', 'elite_actions'],
  render: RRIGaugeComponent,
  confidenceMetric: true,
  exportable: true,
  drillDown: true
};
```

### 4.3 Structured Response Schema

The orchestration layer returns a typed response envelope:

```typescript
interface IntelligenceResponse {
  meta: {
    queryId: string;
    timestamp: string;
    intent: IntelligenceIntent;
    confidence: number;           // Overall response confidence (0-1)
    processingTimeMs: number;
    modelsUsed: string[];
    dataSources: string[];
  };

  narrative: {
    summary: string;              // Executive summary (2-3 sentences)
    analysis: string;             // Full analytical narrative
    reasoning: string;            // Chain-of-thought (collapsible)
    caveats: string[];            // Limitations and uncertainty flags
  };

  blocks: {
    id: string;
    type: string;
    parameters: Record<string, unknown>;
    data: unknown;
    confidence?: number;
    position: 'primary' | 'secondary' | 'ancillary';
  }[];

  actions: {
    label: string;
    type: 'drill-down' | 'compare' | 'simulate' | 'monitor' | 'export';
    payload: unknown;
  }[];

  context: {
    suggestedFollowUps: string[];
    relatedActors: string[];
    relevantTimeRange: [string, string];
    investigationId: string;
  };
}
```

### 4.4 Intent Router Logic

```typescript
type IntelligenceIntent = 
  | 'risk-assessment'           // "How vulnerable is Tunisia..."
  | 'comparative-analysis'      // "Compare to Egypt 2011..."
  | 'predictive-query'          // "What happens if..."
  | 'monitoring-brief'          // "Morning Brief"
  | 'actor-analysis'            // "What is Saied doing..."
  | 'escalation-tracking'       // "Escalation Watch"
  | 'economic-snapshot'         // "Economic Snapshot"
  | 'simulation-request'        // "Run Monte Carlo..."
  | 'historical-analogy'        // "Has this happened before..."
  | 'narrative-detection'       // "What frames are emerging..."
  | 'data-exploration';         // "Show me FX reserves..."

// Router maps intent → required blocks + models + data sources
const intentMap: Record<IntelligenceIntent, OrchestrationPlan> = {
  'risk-assessment': {
    blocks: ['rri-gauge', 'governorate-heatmap', 'economic-stress', 'elite-network', 'confidence-meter'],
    models: ['rri-engine', 'anomaly-detection'],
    data: ['macro_indicators', 'protest_db', 'elite_tracker']
  },
  'comparative-analysis': {
    blocks: ['comparative-historical', 'actor-timeline', 'rri-gauge'],
    models: ['similarity-engine', 'structural-analogy'],
    data: ['historical_cases', 'current_indicators']
  },
  // ... etc
};
```

---

## 5. Backend Services

### 5.1 Orchestration API

```
POST /api/v3/intelligence/query
Content-Type: application/json

{
  "query": "How vulnerable is Tunisia to social unrest in summer 2026?",
  "context": {
    "investigationId": "inv-2026-05-21-001",
    "priorHypotheses": ["water-stress-accelerant"],
    "selectedActors": ["Kais Saied", "Ennahda", "UGTT"],
    "preferredDepth": "analytical" // or 'brief', 'technical'
  },
  "options": {
    "includeReasoning": true,
    "maxBlocks": 6,
    "confidenceThreshold": 0.6
  }
}
```

### 5.2 Block Data API

```
GET /api/v3/blocks/{blockId}/data
Query params: block-specific parameters
Response: { data, metadata, confidence, lastUpdated }
```

### 5.3 Real-Time Layer (Supabase)
- **Realtime subscriptions** for live indicator updates
- **Broadcast channels** for block-level data refresh
- **Row-level security** per user tier (analyst, journalist, embassy, admin)

### 5.4 Background Workers
- **Ingestion Workers:** OSINT feed processing, NLP extraction, entity resolution
- **Model Workers:** RRI recalculation, Monte Carlo batch runs, graph updates
- **Alert Workers:** Threshold monitoring, anomaly detection, brief generation
- **Export Workers:** PDF report compilation, dossier assembly

---

## 6. Frontend Architecture

### 6.1 Layout System

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  [Morning Brief] [Escalation Watch] [Econ Snapshot] │  ← Quick Actions
├──────────────────┬──────────────────────────────────────────┤
│                  │                                        │
│   CHAT PANEL     │      INTELLIGENCE CANVAS               │
│   ───────────    │      ─────────────────                 │
│   User: How...   │   ┌─────────┐  ┌─────────┐            │
│   AI: Analysis   │   │  RRI    │  │ Heatmap │            │
│   [Reasoning ▼]  │   │ Gauge   │  │         │            │
│                  │   └─────────┘  └─────────┘            │
│   [Block: Eco]   │   ┌─────────────────────────┐         │
│   [Block: SIR]   │   │   Economic Stress Graph │         │
│                  │   └─────────────────────────┘         │
│   Input...       │   ┌─────────┐  ┌─────────┐            │
│   [Send]         │   │Timeline │  │Network  │            │
│                  │   └─────────┘  └─────────┘            │
├──────────────────┴──────────────────────────────────────────┤
│ [Export Brief]  [Save Investigation]  [Share]             │  ← Bottom Actions
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Adaptive Grid Engine
The canvas uses a **constraint-based layout engine**:
- Primary blocks (large, top): `rri-gauge`, `economic-stress`
- Secondary blocks (medium): `governorate-heatmap`, `protest-sir`
- Ancillary blocks (compact, side): `confidence-meter`, `actor-timeline`
- Layout recalculates on intent classification, not fixed breakpoints

### 6.3 Design Language
- **Palette:** Deep charcoal (`#0a0a0f`), signal amber (`#f59e0b`), alert crimson (`#ef4444`), intel cyan (`#06b6d4`)
- **Typography:** Monospace for data, sans-serif for narrative, serif for quotations
- **Motion:** Blocks enter with staggered fade + slight scale; data updates pulse subtly
- **Density:** High information density, minimal chrome, terminal-inspired but polished

---

## 7. The Cognitive Layer (What Makes This Different)

This is not a chatbot with charts. The system exhibits **cognitive characteristics**:

### 7.1 Temporal Intelligence
- Understands *when* things happened and *what phase* Tunisia is in
- Detects acceleration patterns ("protest frequency doubling every 14 days")
- Maps seasonal risks (summer water stress, Ramadan political dynamics)

### 7.2 Narrative Warfare Engine
- Tracks framing contests: "coup vs. correction", "traitors vs. reformers"
- Identifies narrative pivots and inflection points
- Maps state media vs. independent media vs. social media divergence

### 7.3 Predictive Chain Reaction
- Does not just predict single events
- Models cascades: economic shock → protest → repression → elite defection → coup risk
- Surfaces *trigger points* and *feedback loops*

### 7.4 Reality Calibration
- Explicit confidence scoring on every block
- "Known knowns" vs. "known unknowns" vs. "blind spots" visualization
- Automatic flagging when models disagree or data is stale

### 7.5 Autonomous Agent Capability (Phase 2)
- **Monitor Agents:** Watch specific actors/indicators and surface anomalies
- **Briefing Agents:** Auto-generate morning/evening briefs based on delta detection
- **Simulation Agents:** Run counterfactuals when thresholds are breached
- **Alert Agents:** Push notifications with pre-analyzed context, not raw data

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Refactor all existing visualizations into **Widget Registry** (standardized interface)
- [ ] Build **Intent Router** with 5 core intents
- [ ] Implement **Structured Response Schema** (JSON envelope)
- [ ] Create **Chat Panel** + basic **Intelligence Canvas** (2-column layout)
- [ ] Wire **RAG engine** to conversational context
- [ ] **Supabase real-time** subscriptions for live block updates (Step 8 from upgrade plan)

### Phase 2: Cognition (Weeks 5-8)
- [ ] Add **Persistent Investigation Memory** (conversation → dossier)
- [ ] Implement **Context Engine** (entity tracking, hypothesis management)
- [ ] Build **Narrative Warfare Engine** (frame detection, media divergence)
- [ ] Add **Confidence Meter** block + uncertainty visualization
- [ ] **Unit/integration tests** for all engines (Step 9)
- [ ] **Automated backtesting** framework for model validation (Step 10)

### Phase 3: Intelligence (Weeks 9-12)
- [ ] Deploy **Background Workers** (ingestion, model, alert, export)
- [ ] Add **Monitoring/Alerting** infrastructure (Step 14)
- [ ] Implement **Report Builder** (export conversation as PDF/Markdown brief)
- [ ] Build **Comparative Historical** block (Egypt 2011, etc.)
- [ ] Add **Actor Network** drill-down with temporal evolution
- [ ] **Monte Carlo Futures** with interactive parameter adjustment

### Phase 4: Autonomy (Weeks 13-16)
- [ ] **Autonomous Monitor Agents** (self-directed tracking)
- [ ] **Auto-briefing** generation with delta analysis
- [ ] **Simulation Agents** for counterfactual exploration
- [ ] **OSINT expansion** (Telegram, regional media, satellite)
- [ ] **Strategic simulation** sandbox for policy scenario testing
- [ ] **Reality calibration** dashboard (model health, data freshness)

---

## 9. Data Model (Simplified)

```
investigations
├── id, user_id, title, status, created_at
├── context: { actors[], hypotheses[], timeRange }
└── messages[]
    ├── role: user | assistant | system
    ├── content: text | structured_response
    ├── intent: IntelligenceIntent
    ├── blocks_rendered: BlockInstance[]
    └── confidence: number

block_registry
├── id, version, category, parameters_schema
├── required_data_sources[]
├── render_component_path
└── capabilities: { confidenceMetric, exportable, drillDown }

intelligence_blocks (instances)
├── id, investigation_id, block_id
├── parameters, data_snapshot
├── confidence, generated_at
└── export_status

actor_graph
├── nodes: actors, organizations, institutions
├── edges: alliances, conflicts, dependencies
├── weights: dynamic (time-decayed)
└── temporal_snapshots[]

model_outputs
├── model_id, run_id, investigation_id
├── inputs_hash, outputs
├── confidence_interval, validation_status
└── backtest_results
```

---

## 10. Quality & Validation Framework

### 10.1 Model Backtesting
- Every predictive model must have a **backtesting harness**
- Historical simulation: "What would RRI have predicted on Jan 10, 2011?"
- Calibration curves: predicted probability vs. actual frequency
- **Failure recovery:** Auto-fallback to simpler models when complex ones fail

### 10.2 Uncertainty Budget
Every response carries an **uncertainty budget**:
- **Data uncertainty:** How stale/noisy are the inputs?
- **Model uncertainty:** How well-calibrated is the model?
- **Structural uncertainty:** What are we not modeling?
- **Epistemic uncertainty:** What do we simply not know?

### 10.3 Red-Teaming Protocol
- Monthly adversarial testing of narrative engine
- Bias audits for governorates, political actors, economic classes
- Stress tests: "What if all social media is state-controlled?"

---

## 11. Competitive Differentiation

| Capability | Generic AI | Palantir AIP | TunisiaIntel v3 |
|------------|-----------|--------------|-----------------|
| Conversational interface | ✅ | ✅ | ✅ |
| Dynamic visualization | ⚠️ Static | ✅ | ✅ **Adaptive** |
| Tunisia-specific models | ❌ | ❌ | ✅ **RRI, SIR, Elite** |
| Narrative warfare detection | ❌ | ⚠️ | ✅ **Native** |
| Real-time geopolitical OSINT | ❌ | ✅ | ✅ **Regional focus** |
| Investigation memory | ❌ | ✅ | ✅ **Dossier-native** |
| Confidence/uncertainty display | ❌ | ⚠️ | ✅ **Explicit** |
| Exportable intelligence briefs | ❌ | ⚠️ | ✅ **One-click** |
| Autonomous monitoring agents | ❌ | ✅ | 🔄 **Phase 4** |

---

## 12. Success Metrics

### 12.1 Product Metrics
- **Query-to-insight time:** < 15 seconds for standard queries
- **Block relevance score:** User-upvote/downvote on generated blocks (target > 80%)
- **Investigation depth:** Average messages per investigation (target > 8)
- **Export rate:** % of conversations exported as briefs (target > 30%)

### 12.2 Model Metrics
- **RRI calibration:** Brier score < 0.15
- **Protest prediction:** 7-day F1 > 0.65
- **Narrative detection:** Precision > 0.75, Recall > 0.70
- **Data freshness:** 95% of blocks updated within 15 minutes of source change

### 12.3 Business Metrics
- **User tiers:** Free (limited queries), Analyst (full), Embassy (custom OSINT), Enterprise (API)
- **Retention:** Weekly active investigators (target > 60% of signups)
- **Virality:** Brief sharing rate (target > 20% of exports shared)

---

## 13. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Model hallucination in narrative | Medium | High | Confidence scoring, reasoning transparency, human-in-the-loop for alerts |
| Data source degradation | Medium | High | Multi-source redundancy, graceful degradation, stale-data flags |
| Performance at scale | Medium | Medium | Block lazy-loading, Web Workers, edge caching, progressive enhancement |
| Regulatory / political pressure | Low | High | Data jurisdiction clarity, user encryption, transparent methodology |
| Over-reliance on AI reasoning | Medium | High | Always show raw data access, source links, model assumptions |

---

## 14. Appendix: Example Interaction Flow

**User:** *"Compare Tunisia today to Egypt before 2011."*

**System Processing:**
1. **Intent:** `comparative-analysis`
2. **Context:** Load current Tunisia snapshot + Egypt 2010-2011 historical case
3. **Blocks selected:** `comparative-historical`, `actor-timeline`, `rri-gauge`, `economic-stress`, `elite-network`
4. **Models called:** Similarity engine, structural analogy, RRI (current), RRI (Egypt retroactive)
5. **Synthesis:** Generate narrative + parameterize blocks

**Response:**
- **Narrative:** "Tunisia and Egypt 2011 share 4 structural similarities and 3 critical divergences..."
- **Blocks:**
  - Comparative timeline (dual-track: Tunisia 2026 vs Egypt 2010-2011)
  - RRI gauge (Tunisia current: 0.34) + Egypt Jan 2011 retroactive (0.71)
  - Economic stress comparison (FX reserves trajectory, youth unemployment)
  - Elite network divergence (military neutrality in Tunisia vs. military ambiguity in Egypt)
- **Actions:** ["Drill down: military role"] ["Simulate: Tunisia with Egypt-like inflation spike"] ["Monitor: UGTT vs. ETUF similarity"]
- **Confidence:** 0.72 (medium-high; historical analogy inherently uncertain)

**User clicks:** *"Simulate: Tunisia with Egypt-like inflation spike"*

**System:** Runs Monte Carlo with inflation shock parameter → Returns `monte-carlo-futures` block with 3 paths + updated RRI trajectory.

---

## 15. Conclusion

TunisiaIntel v3.0 is not an incremental dashboard improvement. It is a **category shift** from static visualization to **cognitive intelligence orchestration**.

The product thesis is simple:

> **Ask anything about Tunisia. The system thinks like an intelligence agency.**

This blueprint provides the architecture, component specifications, and roadmap to execute that vision. The next step is Phase 1: Widget Registry + Intent Router + Conversational Foundation.

---

*Document Version: 1.0*  
*Next Review: Post-Phase 1 Completion*  
*Distribution: Core Team, Advisory Board*
