# TunisiaIntel AI Configuration Page — Full Design Specification

> **Version:** 2.0  
> **Date:** 2026-05-19  
> **Status:** Implementation Complete — Layers 1–3 (Providers, Capabilities, Registry)  
> **Scope:** Complete AI Infrastructure Orchestration UI for TunisiaIntel v2.0

> **Implementation Note:** This document records both the original design specification and the current implementation status. Sections marked **IMPLEMENTED** reflect what has been built in `SystemCommandCenter.tsx`. Sections marked **DEFERRED** are design targets for future phases.

---

## 1. Design Philosophy

### The Shift: Model-Centric → Task-Centric

| Old Thinking (Wrong) | New Thinking (Right) |
|---------------------|---------------------|
| "Which model should I pick?" | "What intelligence capability do I need?" |
| Provider → Scan → Models → Configure | Capability → Role → Best model auto-suggested |
| List of `llama-3.3-70b-versatile` cards | Mission capability matrix with live status |
| Developer console UI | Bloomberg / Palantir-grade orchestration |

> **Models are infrastructure. Capabilities are the product.**

TunisiaIntel is an **intelligence operating system**, not an AI chatbot. The AI Configuration page must reflect that by exposing **cognitive roles**, not raw model IDs.

---

## 2. Page Hierarchy

```
AI Infrastructure (Sidebar Root)
├── Providers        ✅ Layer 1 — Infrastructure (IMPLEMENTED)
├── Capabilities     ✅ Layer 2 — MAIN UI (IMPLEMENTED)
├── Registry         ✅ Layer 3 — Advanced (IMPLEMENTED)
├── Routing          ⏳ Layer 4 — Orchestration (DEFERRED)
├── Memory           ⏳ Layer 5 — Context / RAG (DEFERRED)
└── Agents           ⏳ Layer 6 — Future autonomous (DEFERRED)
```

### Implementation: Sub-tab Navigation in SystemCommandCenter

The AI tab in `SystemCommandCenter.tsx` uses a **sub-tab bar** (Providers | Capabilities | Registry) instead of sidebar navigation. Sub-tab state is managed via `aiTabView` (`'providers' | 'capabilities' | 'registry'`). Layers 4–6 (Routing, Memory, Agents) are not yet implemented.

```
┌─────────────────────────────────────────────────────┐
│  AI Infrastructure                                   │
│  ────────────────────────────────────────────────    │
│                                                      │
│  [Providers] [Capabilities] [Registry]    [Failover] │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Sub-tab content (see Layers below)            │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 3. Layer 1 — Providers (Infrastructure)

### Purpose
Bare-metal provider management. API keys, connection status, model discovery. **Minimal UI.** No clutter.

### Layout

```
┌─────────────────────────────────────────────┐
│  AI Providers                                │
│  ─────────────────────────────────────────   │
│                                              │
│  CEREBRAS                                    │
│  ● Online        Latency: 240ms   14 models │
│  [Scan Models]  [Edit Key]  [Disconnect]    │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  GROQ                                        │
│  ● Online        Latency: 89ms    8 models  │
│  [Scan Models]  [Edit Key]  [Disconnect]     │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  OPENROUTER                                  │
│  ○ Offline       [Connect]                   │
│                                              │
│  ─────────────────────────────────────────   │
│                                              │
│  + Add Provider                              │
│                                              │
└─────────────────────────────────────────────┘
```

### Provider Card Fields

| Field | Type | Description |
|-------|------|-------------|
| Provider Name | string | Cerebras, Groq, OpenRouter, Ollama, etc. |
| Status | enum | `online` / `offline` / `degraded` / `scanning` |
| Latency | number | Last ping RTT in ms |
| Models Discovered | number | Count from last scan |
| API Key | masked string | `csk-••••••••••••••••••••••••` |
| Actions | buttons | Scan, Edit, Disconnect, Test |

### Provider States

| State | Visual | Behavior |
|-------|--------|----------|
| Online | Green dot | Fully operational, models available |
| Offline | Red dot | Connection failed, no models |
| Degraded | Yellow dot | High latency or partial failure |
| Scanning | Spinner | Actively fetching model list |

### Add Provider Flow (IMPLEMENTED)

The Add Provider flow is implemented as a **3-step provisioning modal** (`provisionStep: 1 | 2 | 3`):

```
Step 1: Credentialing
    Select provider from grid (Google, OpenAI, Anthropic, OpenRouter,
    Cerebras, NVIDIA, Mistral, Custom/Local)
    ↓
    Input API Secret Key
    ↓
    (Optional: Base Endpoint URL for custom endpoints)
    ↓
[Authorize & Continue]

Step 2: Verification (auto-executes)
    ├── Authenticating with provider    → POST /api/ai/test
    └── Scanning available models       → POST /api/ai/provider-models
    ↓
    On success → Step 3

Step 3: Select Models to Provision
    Checkbox list of discovered models
    [Save Selected] → creates AIModel entries, persists to localStorage
```

### Role Bindings (IMPLEMENTED — Not in Original Spec)

A **Role Bindings** panel was added to the Providers view, assigning a single model to each of three intelligence roles:

| Role Key | Label | Icon | Used By |
|----------|-------|------|---------|
| `parser` | National Briefing | 📰 | RSS/News parsing pipeline |
| `analys` | Predictive Analysis | 📊 | Risk & trend analysis |
| `answer` | AI Analyst Chat | 🤖 | AIAnalystPanel Q&A |

Each role has a dropdown populated from `allModels` (`[...envModels, ...aiModels]`). Changes persist immediately via `onPersistRoles` to `localStorage` key `ti_ai_role_assignments`.

### Provider Cards (IMPLEMENTED)

Each provider is rendered as a collapsible card with:

| Element | Detail |
|---------|--------|
| Status dot | Green pulse (online) / Red (offline) |
| Provider name | Color-coded label from `PROVIDER_STYLE` |
| Model count | `N models` |
| Avg latency | Calculated from all provider models |
| Actions | `Scan` / `Edit Key` / `Chevron` (expand) |
| Expanded | Model list with test/edit/remove per model |

Supported providers in `MODEL_CATALOG` and `PROVIDER_STYLE`:

| Provider | Color | Label | Models |
|----------|-------|-------|--------|
| Google Gemini | `#4285F4` | Google | 3 |
| OpenAI | `#10A37F` | OpenAI | 3 |
| Anthropic | `#D97757` | Anthropic | 3 |
| OpenRouter | `#FF6B35` | OpenRouter | 2 |
| Cerebras | `#6C5CE7` | Cerebras | 3 |
| NVIDIA | `#76B900` | NVIDIA | 3 |
| Mistral | `#FF6B6B` | Mistral | 5 |
| Custom/Local | `#64748B` | Custom | 2 |

### Env Models (IMPLEMENTED)

On mount, `AITab` fetches `GET /api/ai/models` and maps the response to `AIModel[]`. These env models are:
- Cached to `localStorage` key `ti_env_models`
- Merged with user-added models to form `allModels = [...envModels, ...aiModels]`
- Auto-seeded into role assignments on first launch (when no roles are assigned)

### Auto-Failover (IMPLEMENTED — Not in Original Spec)

A `Failover` toggle button in the header enables automatic role reassignment every 10 seconds: if the model assigned to a role goes `offline`, the system reassigns an online model to that role. State persisted to `localStorage` key `ti_auto_failover`.

---

## 4. Layer 2 — Capabilities (MAIN UI) — IMPLEMENTED

### Purpose
**The heart of the page.** Analysts assign intelligence capabilities to optimal models. This is the primary user-facing layer.

### Core Concept: Capability Assignment Matrix

Instead of browsing model cards, users see **intelligence roles** and their assigned models.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Intelligence Capabilities                                           │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  ┌────────────┬──────────────┬─────────────┬──────────┬─────────┐  │
│  │ Capability │ Model        │ Provider    │ Status   │ Actions │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ 🎯 Exec    │ Llama 70B    │ Cerebras    │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   Briefing │              │             │          │         │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ 📰 RSS     │ Qwen 7B      │ Groq        │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   Parsing  │              │             │          │         │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ 🧠 Risk    │ DeepSeek R1  │ OpenRouter  │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   Reasoning│              │             │          │         │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ ⚡ Fast     │ Llama 8B     │ Cerebras    │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   Stream   │              │             │          │         │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ 🔍 Entity  │ Mistral 7B   │ Groq        │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   Extraction│             │             │          │         │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ 🌐 Trans-  │ Gemma 9B     │ Ollama      │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   lation   │              │             │          │         │  │
│  ├────────────┼──────────────┼─────────────┼──────────┼─────────┤  │
│  │ 📊 Simu-   │ DeepSeek     │ Cerebras    │ ● Online │ ⚙️ 🔄 ✕ │  │
│  │   lation   │              │             │          │         │  │
│  └────────────┴──────────────┴─────────────┴──────────┴─────────┘  │
│                                                                      │
│  [+ Assign Capability]  [Auto-Configure]  [Reset to Defaults]      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Capability Definitions (Built-in)

| ID | Capability | Icon | Default Role | Description |
|----|-----------|------|--------------|-------------|
| `briefing` | Executive Briefing | 🎯 | Synthesis | Daily/weekly intelligence briefs, executive summaries |
| `parsing` | RSS Parsing | 📰 | Extraction | Article classification, entity extraction, sentiment |
| `reasoning` | Geopolitical Reasoning | 🧠 | Analysis | Deep multi-hop queries, correlation, causal inference |
| `stream` | Fast Realtime Chat | ⚡ | Interactive | Sub-second analyst Q&A, live narration |
| `entities` | Entity Extraction | 🔍 | Structured | Actor detection, governorate mapping, event typing |
| `translation` | Translation | 🌐 | Utility | Arabic/French/English document translation |
| `simulation` | Simulation Narration | 📊 | Narrative | Scenario walkthroughs, Monte Carlo explanations |
| `alerting` | Alert Synthesis | 🚨 | Urgent | Human-readable alert generation, escalation rationale |
| `memory` | Memory Retrieval | 💾 | Context | RAG-based historical recall, timeline reconstruction |
| `fallback` | System Fallback | 🛡️ | Safety | Catch-all when primary models fail |

### Capability Card Detail (Expanded)

```
┌─────────────────────────────────────────────┐
│  🎯 Executive Briefing                       │
│  ─────────────────────────────────────────   │
│                                              │
│  Primary Model                               │
│  ┌───────────────────────────────────────┐   │
│  │ Llama 3.3 70B          [Change ▼]   │   │
│  │ Cerebras                              │   │
│  │ Context: 128K  |  Speed: Very Fast      │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  Fallback Model                              │
│  ┌───────────────────────────────────────┐   │
│  │ DeepSeek R1            [Change ▼]     │   │
│  │ OpenRouter                            │   │
│  │ Context: 64K   |  Speed: Fast         │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  Parameters                                  │
│  Temperature:  [0.4 ───────●──────── 1.0]   │
│  Max Tokens:   [2048 ──────●──────── 8192]   │
│  Context Limit:[32K ───────●──────── 128K]   │
│                                              │
│  Tools Access                                │
│  ☑ RAG Retrieval                           │
│  ☑ Web Search                                │
│  ☑ Timeline Engine                           │
│  ☐ Simulation Engine                           │
│                                              │
│  Memory                                      │
│  ☑ Enable persistent context               │
│                                              │
│  Routing Priority                            │
│  [High ▼]  (Failover to fallback after 3s)   │
│                                              │
│  [Save Configuration]  [Test Capability]       │
│                                              │
└─────────────────────────────────────────────┘
```

### Capability Parameters

| Parameter | Range | Default by Role | Description |
|-----------|-------|-----------------|-------------|
| Temperature | 0.0 – 1.0 | Briefing: 0.3, Chat: 0.7, Reasoning: 0.2 | Creativity vs determinism |
| Max Tokens | 512 – 16K | Briefing: 2048, Chat: 1024 | Output length limit |
| Context Limit | 4K – 128K | Briefing: 64K, Parsing: 8K | Input window size |
| Routing Priority | Low / Normal / High / Critical | Briefing: High | Failover urgency |
| Retry Count | 1 – 5 | Default: 3 | API failure retries |
| Timeout | 1s – 30s | Briefing: 10s, Chat: 3s | Request timeout |

### Auto-Configure Flow (IMPLEMENTED)

```
[Auto-Configure] clicked
    ↓
Tests all models with status !== 'online' via POST /api/ai/test
    ↓
Collects passing model IDs
    ↓
Round-robins passing models across all 10 capabilities:
    - cap[0] → onlineIds[0 % N]
    - cap[1] → onlineIds[1 % N]
    - ...
    - cap[i] → onlineIds[i % N]
    ↓
Fallback for each capability → onlineIds[(i + 1) % N]
    ↓
Persists to localStorage key ti_ai_cap_config
```

### Capability Config Persistence (IMPLEMENTED)

Each capability stores `{ primary: string, fallback: string }` (model IDs) in the `capConfig` state. This is synced to `localStorage` key `ti_ai_cap_config` via a `useEffect` on every change.

### Capability Model Assignment (IMPLEMENTED)

Expanded capability cards show two dropdowns: **Primary Model** and **Fallback Model**, populated from `allModels`. Status displayed as:

| Badge | Condition |
|-------|-----------|
| ACTIVE (green) | Primary model status === 'online' |
| DEGRADED (amber) | No primary, fallback configured |
| OFFLINE (red) | No model assigned or all providers down |

### Capability States

| State | Badge | Meaning |
|-------|-------|---------|
| Active | ● Green | Model assigned, provider online, ready |
| Degraded | ● Yellow | Fallback in use, primary unavailable |
| Offline | ● Red | No model assigned or all providers down |
| Unconfigured | ○ Gray | Capability exists but no model assigned |
| Testing | ◌ Spinner | Active test in progress |

---

## 5. Layer 3 — Model Registry (Advanced) — IMPLEMENTED

### Purpose
Raw inventory of all discovered models across all providers. Shown as a searchable/filterable table.

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Model Registry  [Show ▼]                                            │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  Filter: [All Providers ▼]  [All Sizes ▼]  [Search...    ]         │
│                                                                      │
│  ┌──────────────┬────────────┬──────────┬─────────┬──────────────┐  │
│  │ Model        │ Provider   │ Size     │ Speed   │ Capabilities │  │
│  ├──────────────┼────────────┼──────────┼─────────┼──────────────┤  │
│  │ llama-3.3-70B│ Cerebras   │ 70B      │ Fast    │ brief,chat  │  │
│  │ qwen-2.5-7b  │ Groq       │ 7B       │ Instant │ parse,entity│  │
│  │ deepseek-r1  │ OpenRouter │ 671B     │ Slow    │ reason,sim  │  │
│  │ mistral-7b   │ Groq       │ 7B       │ Instant │ parse,entity│  │
│  │ gemma-9b     │ Ollama     │ 9B       │ Fast    │ trans,parse │  │
│  └──────────────┴────────────┴──────────┴─────────┴──────────────┘  │
│                                                                      │
│  [Export Registry]  [Refresh All]                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Model Registry Fields

| Field | Description |
|-------|-------------|
| Model ID | Raw model identifier (e.g., `llama-3.3-70b-versatile`) |
| Provider | Source provider |
| Size | Parameter count (7B, 70B, etc.) |
| Speed | Benchmarked tokens/second |
| Context | Max context window |
| Capabilities | Auto-detected or manually tagged roles |
| Status | Available / Unavailable / Deprecated |
| Last Seen | Timestamp of last successful ping |

---

## 6. Layer 4 — Routing (Orchestration)

### Purpose
The **brain** that routes tasks to the correct capability automatically. This transforms "AI settings" into "cognitive infrastructure."

### Auto-Router Logic

```
Task Detected
    ↓
Classify intent
    ↓
Route to capability
    ↓
Check capability status
    ↓
Execute with primary model
    ↓
If failure → fallback model
    ↓
If cascade failure → system fallback
    ↓
Return response + routing log
```

### Routing Rules Engine

```
┌─────────────────────────────────────────────┐
│  Routing Rules                               │
│  ─────────────────────────────────────────   │
│                                              │
│  IF task.type == "briefing"                  │
│     → route_to: capability.briefing          │
│     → timeout: 10s                           │
│     → fallback: capability.fallback          │
│                                              │
│  IF task.type == "rss_parse"                 │
│     → route_to: capability.parsing           │
│     → batch_size: 10                         │
│     → timeout: 5s                            │
│                                              │
│  IF task.type == "analyst_chat"              │
│     → route_to: capability.stream            │
│     → streaming: true                        │
│     → timeout: 3s                            │
│                                              │
│  IF task.type == "deep_reasoning"            │
│     → route_to: capability.reasoning         │
│     → timeout: 30s                           │
│     → tools: [rag, timeline, web]            │
│                                              │
│  [+ Add Rule]  [Test Router]                 │
│                                              │
└─────────────────────────────────────────────┘
```

### Routing Decision Tree

```
Incoming Task
    ├── Is it structured extraction?
    │   ├── YES → Parser AI (Qwen/Mistral 7B)
    │   └── NO → Is it synthesis / narrative / chat?
    │           ├── YES → Cerebras (Llama 70B / DeepSeek)
    │           └── NO → Is it search / similarity?
    │                   ├── YES → Vector DB (Qdrant)
    │                   └── NO → Rule-based pipeline
```

### Routing Logs

| Timestamp | Task | Routed To | Model | Latency | Status |
|-----------|------|-----------|-------|---------|--------|
| 04:23:11 | briefing | capability.briefing | Llama 70B | 1.2s | ✅ |
| 04:23:45 | rss_batch | capability.parsing | Qwen 7B | 0.8s | ✅ |
| 04:24:02 | analyst_q | capability.stream | Llama 8B | 0.3s | ✅ |
| 04:24:15 | deep_corr | capability.reasoning | DeepSeek R1 | 4.1s | ✅ |

---

## 7. Layer 5 — Memory (Context / RAG)

### Purpose
Configure how capabilities access and use memory / RAG / vector search.

### Configuration

```
┌─────────────────────────────────────────────┐
│  Memory & Context Configuration              │
│  ─────────────────────────────────────────   │
│                                              │
│  Vector Database                             │
│  Provider: [Qdrant ▼]                        │
│  URL: http://localhost:6333                  │
│  Status: ● Connected                         │
│                                              │
│  Embedding Model                             │
│  Model: [BGE-small ▼]                        │
│  Dimensions: 384                             │
│  Device: CPU (GPU available)                 │
│                                              │
│  Context Assembly                            │
│  Max chunks per query: 5                     │
│  Chunk overlap: 200 tokens                   │
│  Relevance threshold: 0.75                   │
│                                              │
│  Memory Persistence                          │
│  ☑ Enable conversation memory                │
│  ☑ Enable event memory                       │
│  ☐ Enable agent memory                       │
│                                              │
│  [Test Retrieval]  [Rebuild Index]             │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 8. Layer 6 — Agents (Future)

### Purpose
Placeholder for autonomous agent configuration. Not implemented in v2.0 but architected for.

### Planned Capabilities

| Agent | Role | Trigger |
|-------|------|---------|
| Monitor Agent | Watches RSS feeds, auto-classifies | Every 15 min |
| Briefing Agent | Generates morning brief | 06:00 AM daily |
| Escalation Agent | Detects risk spikes, alerts team | Risk score > 0.7 |
| Correlation Agent | Finds cross-domain patterns | Every 1 hour |

---

## 9. Complete Page States

### State 1: Empty (No Providers)

```
┌─────────────────────────────────────────────┐
│  AI Infrastructure                           │
│                                              │
│  [Empty State Illustration]                  │
│                                              │
│  No AI providers connected.                   │
│  Add a provider to discover models and        │
│  configure intelligence capabilities.           │
│                                              │
│  [+ Add Your First Provider]                 │
│                                              │
│  Supported: Cerebras, Groq, OpenRouter,      │
│  Ollama, OpenAI, Anthropic                  │
│                                              │
└─────────────────────────────────────────────┘
```

### State 2: Provider Connected, Scanning

```
┌─────────────────────────────────────────────┐
│  CEREBRAS                                    │
│  ◌ Scanning models...                        │
│  Please wait while we discover available     │
│  models from your provider.                  │
│                                              │
│  [Cancel Scan]                               │
└─────────────────────────────────────────────┘
```

### State 3: Provider Connected, Models Discovered

```
┌─────────────────────────────────────────────┐
│  CEREBRAS                                    │
│  ● Online        14 models discovered        │
│                                              │
│  💡 Recommended setup available!               │
│  [View Recommendations]                      │
│                                              │
│  [Scan Models]  [Edit Key]  [Disconnect]     │
└─────────────────────────────────────────────┘
```

### State 4: Capabilities Configured (Main State)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Intelligence Capabilities                                           │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                      │
│  🎯 Executive Briefing        Llama 70B    Cerebras    ● Online     │
│  📰 RSS Parsing               Qwen 7B      Groq        ● Online     │
│  🧠 Risk Reasoning            DeepSeek R1  OpenRouter  ● Online     │
│  ⚡ Fast Stream Chat          Llama 8B     Cerebras    ● Online     │
│  🔍 Entity Extraction         Mistral 7B   Groq        ● Online     │
│  🌐 Translation               Gemma 9B     Ollama      ● Online     │
│                                                                      │
│  [+ Assign Capability]  [Auto-Configure]  [Export Config]            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### State 5: Degraded (Fallback Active)

```
┌─────────────────────────────────────────────┐
│  🎯 Executive Briefing                       │
│  ⚠ Primary: Llama 70B (Cerebras) — Offline│
│  ● Fallback: DeepSeek R1 (OpenRouter) — Active│
│                                              │
│  [View Details]  [Force Primary Retry]       │
└─────────────────────────────────────────────┘
```

---

## 10. User Flows

### Flow A: First-Time Setup

```
1. User navigates to AI Infrastructure
2. Sees empty state → clicks "Add Provider"
3. Selects Cerebras → enters API key
4. System tests connection → success
5. Auto-scans models → "14 models discovered"
6. System shows recommendation modal
7. User clicks "Accept All"
8. Capabilities page populated automatically
9. User clicks "Test Capability" on Briefing
10. System generates test brief → success
11. Setup complete
```

### Flow B: Adding a New Capability

```
1. User clicks "+ Assign Capability"
2. Modal: Select capability type from dropdown
3. System suggests best model based on:
   - Provider health
   - Model profile (size, speed, context)
   - Existing assignments (load balancing)
4. User accepts or overrides
5. System validates: tests model with sample prompt
6. Capability added to matrix
```

### Flow C: Provider Failure & Failover

```
1. Cerebras goes offline (detected by health check)
2. System marks Cerebras models as offline
3. Capabilities using Cerebras switch to fallback
4. UI shows degraded badges
5. Alert banner: "Cerebras offline. Fallbacks active."
6. User sees routing logs showing failover
7. When Cerebras recovers → auto-promote primary
```

### Flow D: Benchmarking / Comparison

```
1. User selects a capability
2. Clicks "Benchmark"
3. System runs same prompt across:
   - Primary model
   - Fallback model
   - All models in registry with same capability tag
4. Shows comparison table:
   - Latency
   - Token count
   - Quality score (if eval available)
   - Cost (if applicable)
5. User can reassign based on results
```

---

## 11. Data Model

### Provider

```typescript
interface Provider {
  id: string;           // "cerebras", "groq", "openrouter"
  name: string;         // "Cerebras"
  apiKey: string;       // encrypted
  baseUrl: string;      // API endpoint
  status: "online" | "offline" | "degraded" | "scanning";
  latency: number;      // ms
  modelsDiscovered: number;
  lastScanAt: Date;
  createdAt: Date;
}
```

### Model

```typescript
interface Model {
  id: string;           // "llama-3.3-70b-versatile"
  providerId: string;   // "cerebras"
  name: string;         // "Llama 3.3 70B"
  size: number;         // 70 (billions)
  contextWindow: number; // 128000
  speed: number;        // tokens/sec benchmark
  capabilities: string[]; // ["briefing", "chat", "reasoning"]
  status: "available" | "unavailable" | "deprecated";
  tags: string[];       // ["fast", "long-context", "open-source"]
}
```

### Capability

```typescript
interface Capability {
  id: string;           // "briefing", "parsing", "reasoning"
  name: string;         // "Executive Briefing"
  icon: string;         // emoji or SVG
  description: string;

  // Assignment
  primaryModelId: string;
  fallbackModelId: string;

  // Parameters
  temperature: number;
  maxTokens: number;
  contextLimit: number;

  // Features
  toolsEnabled: string[];  // ["rag", "web", "timeline"]
  memoryEnabled: boolean;
  streaming: boolean;

  // Routing
  priority: "low" | "normal" | "high" | "critical";
  timeout: number;       // seconds
  retryCount: number;

  // State
  status: "active" | "degraded" | "offline" | "unconfigured";
  lastUsedAt: Date;
  usageCount: number;
}
```

### RoutingRule

```typescript
interface RoutingRule {
  id: string;
  taskType: string;      // "briefing", "rss_parse", "analyst_chat"
  targetCapability: string;
  conditions: {
    minContext?: number;
    maxLatency?: number;
    requireTools?: string[];
  };
  fallbackChain: string[]; // ordered list of capability IDs
  enabled: boolean;
}
```

---

## 12. API Integration Patterns

### Capability Execution

```typescript
// Route a task to the correct capability
async function executeCapability(
  taskType: string,
  payload: any,
  options?: ExecutionOptions
): Promise<ExecutionResult> {

  // 1. Find routing rule
  const rule = await routingRules.findByTaskType(taskType);

  // 2. Get capability configuration
  const capability = await capabilities.get(rule.targetCapability);

  // 3. Resolve model (primary or fallback)
  const model = await resolveModel(capability, options);

  // 4. Assemble context (RAG, memory, tools)
  const context = await assembleContext(capability, payload);

  // 5. Execute with provider
  const response = await providers.execute(model, {
    messages: buildMessages(capability, context, payload),
    temperature: capability.temperature,
    max_tokens: capability.maxTokens,
    timeout: capability.timeout,
    stream: capability.streaming
  });

  // 6. Log routing
  await routingLogs.create({
    taskType,
    capability: capability.id,
    model: model.id,
    latency: response.latency,
    status: "success"
  });

  return response;
}
```

### Health Check & Failover

```typescript
async function healthCheck(): Promise<void> {
  for (const provider of providers.list()) {
    const healthy = await pingProvider(provider);

    if (!healthy) {
      // Mark provider offline
      await providers.updateStatus(provider.id, "offline");

      // Find affected capabilities
      const affected = await capabilities.findByProvider(provider.id);

      for (const cap of affected) {
        // Activate fallback
        await capabilities.activateFallback(cap.id);

        // Emit alert
        events.emit("capability.degraded", {
          capability: cap.id,
          reason: `Provider ${provider.name} offline`
        });
      }
    }
  }
}
```

---

## 13. UI Component Inventory

| Component | Location | Description |
|-----------|----------|-------------|
| `ProviderCard` | Providers page | Status card for each provider |
| `ProviderForm` | Modal | Add/edit provider API key |
| `CapabilityMatrix` | Capabilities page | Main assignment table |
| `CapabilityCard` | Capabilities page | Expanded detail panel |
| `CapabilityAssignModal` | Modal | Assign model to capability |
| `AutoConfigModal` | Modal | Recommendation acceptance |
| `ModelRegistryTable` | Registry page | Raw model inventory |
| `RoutingRulesPanel` | Routing page | Rule editor |
| `RoutingLogTable` | Routing page | Execution history |
| `MemoryConfigPanel` | Memory page | RAG/vector settings |
| `AgentPlaceholder` | Agents page | Future agent config |
| `StatusBadge` | Global | Online/Offline/Degraded indicator |
| `LatencyIndicator` | Global | Real-time latency sparkline |
| `TestButton` | Per capability | Quick capability test |
| `BenchmarkModal` | Modal | A/B model comparison |

---

## 14. Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Setup time (new user) | < 3 minutes | Time from empty state to first working capability |
| Capability assignment time | < 30 seconds | Time to assign + test a new capability |
| Provider recovery time | < 5 seconds | Time to detect failure + activate fallback |
| Routing accuracy | > 95% | Correct capability selected for task type |
| User comprehension | N/A | Can user explain what each capability does without seeing model IDs? |

---

## 15. Implementation Order

### Phase 1: Foundation (Week 1) — ✅ COMPLETE
- [x] Build sub-tab navigation (Providers, Capabilities, Registry) — within SystemCommandCenter
- [x] Implement Provider page (add, edit, delete, status)
- [x] Build provider connection + model scanning
- [x] Create provider data model + API layer

### Phase 2: Capabilities Core (Week 2) — ✅ COMPLETE
- [x] Build Capability Matrix UI (table view)
- [x] Implement built-in capability definitions (10 capabilities)
- [x] Create capability assignment flow
- [x] Add capability parameter controls (primary/fallback model selection)
- [x] Build auto-configure engine (tests models, round-robins assignments)

### Phase 3: Routing & Execution (Week 3) — ❌ DEFERRED
- [ ] Implement routing rules engine
- [ ] Build task classifier
- [ ] Create execution pipeline (resolve model → assemble context → execute → log)
- [ ] Add health checks + automatic failover (health checks done but routing engine deferred)
- [ ] Build routing logs viewer

### Phase 4: Polish & Advanced (Week 4) — ⏳ PARTIAL
- [x] Model Registry page (searchable table view)
- [ ] Memory / RAG configuration panel
- [ ] Benchmarking / comparison modal
- [ ] Export / import configuration
- [ ] Agent placeholder architecture

---

## 16. Integration with TunisiaIntel Stack

| TunisiaIntel Component | AI Config Integration |
|------------------------|----------------------|
| RSS Pipeline | Uses `parsing` capability for extraction |
| Briefing Engine | Uses `briefing` capability for daily reports |
| Analyst Chat | Uses `stream` capability for Q&A |
| Risk Engine | Uses `reasoning` capability for deep analysis |
| Alert System | Uses `alerting` capability for human-readable alerts |
| Simulation Engine | Uses `simulation` capability for scenario narration |
| Timeline Engine | Uses `memory` capability for historical recall |
| RRI Engine | Uses `reasoning` + `memory` for composite risk |
| Dashboard | Shows capability status badges |
| Supabase Sync | Stores provider/capability config |

---

---

## 17. Current Implementation Summary

### Architecture
All AI infrastructure UI is implemented in a single component: `SystemCommandCenter.tsx` (`src/components/system/`), in the `AITab` sub-component (~1200 lines). State is managed via `useState`/`useEffect` with `localStorage` persistence for models, role assignments, capability config, and failover toggle.

### Data Flow
```
Environment (server)
  └── GET /api/ai/models → envModels (AIModel[])
       └── cached to localStorage 'ti_env_models'
User-added models ← localStorage 'ti_ai_models'
       │
       └── allModels = [...envModels, ...aiModels]
            ├── Role Bindings ↓ roleAssign (localStorage 'ti_ai_role_assignments')
            ├── Capability Config ↓ capConfig (localStorage 'ti_ai_cap_config')
            └── Registry table view
```

### API Endpoints Consumed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/models` | GET | Fetch env-configured models |
| `/api/ai/test` | POST | Test a single model connection |
| `/api/ai/provider-models` | POST | Discover available models from a provider |

### localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `ti_ai_models` | `AIModel[]` | User-added AI models |
| `ti_ai_role_assignments` | `Record<RoleType, string>` | Role → model ID mapping |
| `ti_ai_cap_config` | `Record<string, {primary, fallback}>` | Per-capability model assignment |
| `ti_env_models` | `AIModel[]` | Server-provided model cache |
| `ti_auto_failover` | `boolean` | Auto-failover toggle state |
| `ti_ai_cap_config` | `Record<string, {primary, fallback}>` | Capability configuration |

### Role Keys

| Key | Display Name | Consumer |
|-----|-------------|----------|
| `parser` | National Briefing | RSS pipeline / brief generation |
| `analys` | Predictive Analysis | Risk & trend analysis engine |
| `answer` | AI Analyst Chat | `AIAnalystPanel.tsx` / `chatWithAnalyst()` |

### Implemented vs Design Comparison

| Design Feature | Status | Notes |
|---------------|--------|-------|
| Layers 1–3 (Providers/Capabilities/Registry) | ✅ Implemented | With sub-tab navigation |
| Layer 4 (Routing) | ❌ Deferred | Not yet built |
| Layer 5 (Memory/RAG) | ❌ Deferred | Not yet built |
| Layer 6 (Agents) | ❌ Deferred | Not yet built |
| Provider provisioning | ✅ Implemented | 3-step modal with auth + scan |
| Model scanning | ✅ Implemented | POST /api/ai/provider-models |
| Role Bindings | ✅ Implemented | Added beyond original spec |
| Auto-failover | ✅ Implemented | 10s interval reassigns offline models |
| Auto-seed roles | ✅ Implemented | First-launch assignment from env models |
| Capability primary/fallback config | ✅ Implemented | Persisted to localStorage |
| Auto-Configure | ✅ Implemented | Tests all models, round-robins assignments |
| Test All | ✅ Implemented | Iterates all models via /api/ai/test |
| Model filtering/search | ✅ Implemented | In Registry view |
| Warm/Cold/Off provider states | ✅ Implemented | Online/Offline/Unknown with visual badges |
| Routing rules engine | ❌ Deferred | |
| Routing logs viewer | ❌ Deferred | |
| Benchmarking / comparison | ❌ Deferred | |
| Export/import config | ❌ Deferred | |
| Memory / RAG config | ❌ Deferred | |
| Agent placeholder | ❌ Deferred | |

### Provider Catalog

8 providers in `MODEL_CATALOG`: Google (3), OpenAI (3), Anthropic (3), OpenRouter (2), Cerebras (3), NVIDIA (3), Mistral (5), Custom/Local (2). Total: 24 model entries.

---

## Appendix A: Configuration Schema (JSON)

```json
{
  "version": "2.0",
  "providers": [
    {
      "id": "cerebras",
      "name": "Cerebras",
      "apiKey": "csk-••••••••••••••••••••••••",
      "status": "online",
      "latency": 240,
      "models": ["llama-3.3-70b", "llama-3.1-8b"]
    }
  ],
  "capabilities": [
    {
      "id": "briefing",
      "name": "Executive Briefing",
      "primaryModel": "llama-3.3-70b",
      "fallbackModel": "deepseek-r1",
      "temperature": 0.3,
      "maxTokens": 2048,
      "tools": ["rag", "timeline"],
      "memory": true,
      "priority": "high"
    }
  ],
  "routing": {
    "rules": [
      {
        "taskType": "briefing",
        "capability": "briefing",
        "fallbackChain": ["briefing", "fallback"]
      }
    ]
  }
}
```

## Appendix B: Wireframe Notes

- **Color palette:** Dark mode default (intelligence dashboard aesthetic)
- **Status colors:** Green `#10B981`, Yellow `#F59E0B`, Red `#EF4444`, Gray `#6B7280`
- **Typography:** Inter / SF Pro, 14px base, 12px for metadata
- **Spacing:** 24px section gaps, 16px card padding, 8px element gaps
- **Icons:** Lucide React icons + custom capability emoji
- **Animations:** Subtle fade-in for capability cards, pulse for scanning states

---

*This specification bridges the Cerebras integration architecture with the capability-based UX redesign. It serves as the single source of truth for implementing the AI Configuration page in TunisiaIntel v2.0.*
