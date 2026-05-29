# TunisiaIntel — AnythingLLM Upload Method

**Purpose:** Canonical procedure for loading Core_Concept doctrine into AnythingLLM.

---

## 1. Architecture Overview

### Entity Relationship

```
Core_Concept/  (canonical library — 42 .md + 57 PDF)
    │
    ▼  (files mapped to workspaces by domain, not by folder)
    │
AnythingLLM  (7 workspaces, each with custom prompt + document set)
```

### 7 Workspaces

| Workspace | Purpose | Upload Priority |
|---|---|---|
| `Foundation_Intelligence` | Tradecraft methodology (ACH, CIA primer, NATO cycle) | Low |
| `Political_Dynamics` | Revolution theory, authoritarianism, collective action, elites | **Tier Zero** |
| `Cognitive_Warfare` | Psyops, narrative warfare, propaganda, disinformation | Medium |
| `Systems_Theory` | Complexity, cascades, feedback loops, emergence | **Tier Zero** |
| `TunisiaIntel_Core` | Proprietary Tunisia doctrine, mappings, governorate profiles | Medium |
| `RRI_Engine` | Equations, thresholds, risk model | **Tier Zero** |
| `Negotiation_GameTheory` | Future — empty for now | Never |

---

## 2. Pre-Upload Configuration

### 2.1 LLM Provider (Cerebras)

AnythingLLM Settings → LLM Preference:
- Provider: **Generic OpenAI**
- Base URL: `https://api.cerebras.ai/v1`
- API Key: `csk-YOUR_CEREBRAS_API_KEY`

### 2.2 Embedding Provider

AnythingLLM Settings → Embedding Provider:
- Engine: **native** (local, all-MiniLM-L6-v2)
- Alternative (requires server restart): OpenRouter via Generic OpenAI
  - Base URL: `https://openrouter.ai/api/v1`
  - API Key: `sk-or-v1-YOUR_OPENROUTER_API_KEY`
  - Model: `text-embedding-3-small`

### 2.3 Chunk Settings (per workspace if available, otherwise global)

| Setting | Value |
|---|---|
| Chunk size | 1400 |
| Chunk overlap | 200 |
| Preserve headers | YES |
| Smart chunking | YES |

### 2.4 API Credentials

```
API_BASE = "https://llm.kilma.ai/api/v1"
API_KEY  = "YOUR_ANYTHINGLLM_API_KEY"
```

---

## 3. File-to-Workspace Mapping

### Political_Dynamics (13 files)

```
Preference_Falsification.md           ← Revolution_Dynamics/Doctrine_Notes/
Threshold_Activation.md                ← Revolution_Dynamics/Doctrine_Notes/
Collective_Action.md                   ← Civil_Resistance/Doctrine_Notes/
Elite_Cohesion.md                      ← Elite_Cohision/Doctrine_Notes/
Regime_Durability.md                   ← Regime_Durability/Doctrine_Notes/
Authoritarian_Adaptation.md            ← Authoritarian_Adaptation/Doctrine_Notes/
Revolution_Dynamics.md                 ← Revolution_Dynamics/Doctrine_Notes/
State_Fragility.md                     ← State_Fragility/Doctrine_Notes/
Hybrid_Civil_Durability_Cohesion.md    ← Hybrid_Regimes/Doctrine_Notes/
Collective_Action_and_Emergence.md     ← Tunisia_Intelligence/Intersections/
Elite_Fragmentation_and_Regime_Collapse.md ← Tunisia_Intelligence/Intersections/
Preference_Falsification_and_Cascade_Dynamics.md ← Tunisia_Intelligence/Intersections/
00_MASTER_QUERY_ROUTER.md              ← Root
```

### TunisiaIntel_Core (18 files)

```
Tunisia_Authoritarian_Adaptation.md    ← Proprietary_Doctrine/
Tunisia_Elite_Cohesion.md              ← Proprietary_Doctrine/
Tunisia_Emotional_Triggers.md          ← Proprietary_Doctrine/
Tunisia_Narrative_Environment.md       ← Proprietary_Doctrine/
Tunisia_Power_Structure.md             ← Proprietary_Doctrine/
Tunisia_Protest_Dynamics.md            ← Proprietary_Doctrine/
Tunisia_Regime_Stability.md            ← Proprietary_Doctrine/
Tunisia_Elite_Cohesion_Framework.md    ← Tunisia_Mappings/
Tunisia_Narrative_Triggers.md          ← Tunisia_Mappings/
Tunisia_Preference_Falsification.md    ← Tunisia_Mappings/
Tunisia_Regime_Durability_Model.md     ← Tunisia_Mappings/
Tunisia_Regional_Instability.md        ← Tunisia_Mappings/
Tunisia_Revolutionary_Thresholds.md    ← Tunisia_Mappings/
Gafsa_Profile.md                       ← Governorate_Profiles/
Kasserine_Profile.md                   ← Governorate_Profiles/
Sfax_and_Tunis_Profiles.md             ← Governorate_Profiles/
Tunisia_Historical_Crisis_Patterns.md  ← Historical_Memory/
00_MASTER_QUERY_ROUTER.md              ← Root
```

### Systems_Theory (5 files)

```
Cascade_Dynamics.md                    ← Core_Concepts/Cascade_Dynamics/Doctrine_Notes/
Nonlinear_Escalation.md                ← Core_Concepts/Nonlinear_Escalation/Doctrine_Notes/
Feedback_Nonlinear_Cascade.md          ← Core_Concepts/Feedback_Loops/Doctrine_Notes/
Emergence_CAS_Network.md               ← Essential_Additions/CAS/Doctrine_Notes/
00_MASTER_QUERY_ROUTER.md              ← Root
```

### Cognitive_Warfare (4 files)

```
Narrative_Amplification.md             ← Narrative_Warfare_Doctrine/Doctrine_Notes/
Propaganda_Crowd_Intel_Cycle.md        ← Propaganda_Narrative/Doctrine_Notes/
Narrative_Amplification_and_Nonlinear_Escalation.md ← Intersections/
00_MASTER_QUERY_ROUTER.md              ← Root
```

### RRI_Engine (6 files)

```
00_RRI_Master_Framework.md             ← Tunisia_Intelligence/RRI_Engine/
01_Equations_EQ1-EQ8.md                ← Tunisia_Intelligence/RRI_Engine/
02_Equations_EQ12-EQ24.md              ← Tunisia_Intelligence/RRI_Engine/
METHODOLOGY.md                         ← Tn_test project root
Threshold_Activation.md                ← Revolution_Dynamics/Doctrine_Notes/ (cross-workspace)
00_MASTER_QUERY_ROUTER.md              ← Root
```

### Foundation_Intelligence (2 files)

```
Essential_Thinkers_Index.md            ← Foundation_Intelligence/
00_MASTER_QUERY_ROUTER.md              ← Root
```

---

## 4. Upload Sequence

### Phase A — Tier Zero (Claude's priority order)

Upload one file at a time, in this exact sequence:

```
1. Preference_Falsification.md                  → Political_Dynamics
2. Threshold_Activation.md                       → RRI_Engine
3. Cascade_Dynamics.md                            → Systems_Theory
4. Elite_Cohesion.md                              → Political_Dynamics
5. Narrative_Amplification.md                     → Cognitive_Warfare
6. Collective_Action.md                           → Political_Dynamics
7. Regime_Durability.md                           → Political_Dynamics
8. Nonlinear_Escalation.md                        → Systems_Theory
```

### Phase B — TunisiaIntel_Core (all 18 files at once)

### Phase C — Remaining workspaces (any order)

```
1. Political_Dynamics (remaining files)
2. Systems_Theory (remaining files)
3. Cognitive_Warfare (remaining files)
4. Foundation_Intelligence
5. RRI_Engine
```

---

## 5. Upload Procedure (API)

### Step 1 — Create workspace

```bash
curl -X POST "https://llm.kilma.ai/api/v1/workspace/new" \
  -H "Authorization: Bearer YOUR_ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Political_Dynamics","slug":"political_dynamics"}'
```

### Step 2 — Upload document

```bash
curl -X POST "https://llm.kilma.ai/api/v1/document/upload" \
  -H "Authorization: Bearer YOUR_ANYTHINGLLM_API_KEY" \
  -F "file=@/path/to/file.md"
# Returns: {"documents":[{"id":"<doc-uuid>"}]}
```

### Step 3 — Link document to workspace

```bash
curl -X POST "https://llm.kilma.ai/api/v1/workspace/{slug}/update-embeddings" \
  -H "Authorization: Bearer YOUR_ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"adds":["<doc-uuid>"],"deletes":[]}'
```

### Step 4 — Set workspace prompt + settings

```bash
curl -X POST "https://llm.kilma.ai/api/v1/workspace/{slug}/update" \
  -H "Authorization: Bearer YOUR_ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "similarityThreshold": 0.20,
    "topN": 6,
    "openAiPrompt": "Your system prompt here"
  }'
```

### Step 5 — Update embedding provider (if changing from native)

```bash
curl -X POST "https://llm.kilma.ai/api/v1/system/update-env" \
  -H "Authorization: Bearer YOUR_ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "EmbeddingEngine": "generic-openai",
    "EmbeddingModelPref": "text-embedding-3-small",
    "GenericOpenAiEmbeddingApiKey": "sk-or-v1-...",
    "GenericOpenAiBasePath": "https://openrouter.ai/api/v1"
  }'
# NOTE: Requires server restart to take effect!
```

---

## 6. System Prompts

### Political_Dynamics

```
You are TunisiaIntel, a strategic intelligence analysis system specialized in political
dynamics — revolutions, authoritarian adaptation, elite cohesion, civil resistance,
regime durability, and state fragility. Your role is not to provide generic summaries.
You must identify causal mechanisms, detect strategic interactions, map actor
incentives, analyze systemic fragility, and evaluate escalation pathways. Your
knowledge base contains doctrine on preference falsification, threshold activation,
collective action, elite defection, and revolutionary dynamics. Always reason
structurally, not morally. Prioritize systems thinking, game theory, and political
realism.
```

### TunisiaIntel_Core

```
You are TunisiaIntel, the proprietary Tunisia intelligence analyst. You have deep
knowledge of Tunisia power structure, elite cohesion, protest dynamics, regime
stability, narrative environment, emotional triggers, and regional instability. Your
analysis is grounded in Tunisia-specific proprietary doctrine, not generic theory.
When analyzing political events, always assess: Which power node is affected? Does
this shift UGTT toward confrontation? Does it move business elite toward defection?
Reference governorate-level risk profiles and historical memory patterns. Be
precise, avoid speculation, cite structural mechanisms.
```

### Systems_Theory

```
You are TunisiaIntel, a systems theory analyst specialized in complexity science,
cascade dynamics, nonlinear escalation, feedback loops, and emergent behavior. Your
role is to analyze political phenomena through the lens of complexity theory. You
understand how small perturbations can trigger cascading failures, how feedback
mechanisms amplify or dampen political change, and how network topology affects
information and protest diffusion. Your knowledge base contains doctrine on cascades,
nonlinear systems, complex adaptive systems, and emergence. Always ground analysis in
mechanistic explanations rather than descriptive narratives.
```

### Cognitive_Warfare

```
You are TunisiaIntel, a cognitive warfare analyst specialized in narrative warfare,
psyops, disinformation, and propaganda. You track narrative frames, emotional
registers, and competing information environment actors. Your goal is to identify
which frames are gaining or losing dominance, detect disinformation operations, and
assess how narrative convergence or divergence affects political mobilization. Your
knowledge base contains doctrine on narrative amplification, propaganda theory
(Bernays, Ellul, Le Bon), and information warfare. Score narratives using the Signal
Credibility Index framework — not all claims are equal.
```

### RRI_Engine

```
You are TunisiaIntel, the RRI Engine analyst. You have deep expertise in the Regime
Risk Index mathematical framework — 21 equations, 251 variables, and the interactions
between them. When answering questions, always cite the specific equation (EQ.X) and
explain the quantitative mechanism. Reference current Tunisia values where known
(RRI ≈ 2.31, P(rev) ≈ 34%, cascade P ≈ 58%). Never speculate beyond the model —
ground all answers in the equation structure contained in your knowledge base. Your
documents include the full RRI framework, threshold activation models, and cascade
dynamics equations.
Similarity Threshold: 0.15, TopN: 8
```

### Foundation_Intelligence

```
You are TunisiaIntel, a strategic intelligence analysis system. You specialize in
intelligence tradecraft methodology — structured analytic techniques, analysis of
competing hypotheses, the intelligence cycle, and analytical epistemology. Your role
is not to provide generic summaries. You must apply tradecraft standards to every
analysis: identify assumptions, generate alternative hypotheses, assess confidence
levels, and distinguish between observed facts and analytic judgments. Use the
Foundation_Intelligence knowledge base for tradecraft methodology. Always reason
structurally, not morally.
```

---

## 7. PDF Upload Phases (Wave 2 + 3)

After all .md files are uploaded and retrieval is verified, add PDFs.

### Phase A — Core Thinkers (upload first)

| PDF | Source Path | Workspace |
|---|---|---|
| The Strategy of Conflict | `Political_Dynamics/Essential_Thinkers/Thomas_Schelling/` | Political_Dynamics |
| Micromotives and Macrobehavior | `Political_Dynamics/Essential_Thinkers/Thomas_Schelling/` | Political_Dynamics |
| Private Truths, Public Lies | (Timur Kuran — not in Core_Concept as PDF) | Political_Dynamics |
| Sparks and Prairie Fires | `Political_Dynamics/Essential_Thinkers/Timur_Kuran/` | Political_Dynamics |
| The Logic of Collective Action | `Political_Dynamics/Essential_Thinkers/Mancur_Olson/` | Political_Dynamics |
| Thinking in Systems | `Systems_Theory_Complexity/Core_Concepts/Feedback_Loops/Book/` | Systems_Theory |
| Psychology of Intelligence Analysis | `Foundation_Intelligence/` | Foundation_Intelligence |
| All 8 Foundation Intelligence PDFs | `Foundation_Intelligence/` | Foundation_Intelligence |
| Gene Sharp (all 4) | `Political_Dynamics/Essential_Thinkers/Gene_Sharp/` | Political_Dynamics |
| All Systems Theory PDFs (12) | `Systems_Theory_Complexity/` | Systems_Theory |

### Phase B — Heavy Cognitive Warfare PDFs (upload last)

All Cognitive Warfare PDFs (18 files) from:
- `Cognitive_Warfare/Information_Operation_Manuals/`
- `Cognitive_Warfare/Narrative_Warfare_Doctrine/`
- `Cognitive_Warfare/Nato/`
- `Cognitive_Warfare/Psyops_Doctrine/`
- `Propaganda_Narrative/Books/`
- `Propaganda_Narrative/Studies/`

---

## 8. Verification Queries

After uploading, test each workspace:

### Political_Dynamics
```
"What causes revolutionary threshold activation in Tunisia?"
"Explain relationship between preference falsification and cascade dynamics."
"How does elite cohesion affect regime durability?"
```

### RRI_Engine
"What is P(rev) at current RRI of 2.31?"
"At what OCI does salience effective multiplier change significantly?"
"Explain the CPG cascade amplifier threshold."

### TunisiaIntel_Core
"What is Kasserine's cascade probability and current stress factors?"
"What are the six regime adaptation mechanisms?"
"Who are the key power nodes in Tunisia currently?"

### Systems_Theory
"How do feedback loops amplify political change?"
"What distinguishes nonlinear from linear escalation?"

### Cognitive_Warfare
"Which narrative frame is most dangerous to the regime currently?"
"What are the Tier 1 emotional triggers?"

### Foundation_Intelligence
"How does Analysis of Competing Hypotheses differ from traditional analysis?"

---

## 9. Troubleshooting

### Embeddings not processing
- Server needs restart after `update-env` changes take effect
- Verify worker process is running: `docker ps` / `pm2 list` / `systemctl status anythingllm`
- Native embedding requires no external API — if it's not working, the worker is down

### "GenericOpenAI must have a valid base path" error
- GenericOpenAiBasePath and GenericOpenAiEmbeddingBasePath are the SAME env var
- Changing it for embedding breaks the LLM if both use GenericOpenAI
- Solution: use different providers (e.g., Cerebras for LLM, native for embeddings)

### API response returns HTML instead of JSON
- The endpoint doesn't exist (SPA catch-all)
- Only these API endpoints exist:
  - `GET /api/v1/system/`
  - `POST /api/v1/system/update-env`
  - `GET /api/v1/workspaces`
  - `POST /api/v1/workspace/new`
  - `GET /api/v1/workspace/{slug}`
  - `POST /api/v1/workspace/{slug}/update`
  - `POST /api/v1/workspace/{slug}/update-embeddings`
  - `POST /api/v1/document/upload`
  - `DELETE /api/v1/document/delete`
  - `GET /api/v1/documents`
  - `POST /api/v1/auth/`
  - `GET /api/v1/system/`

---

## 10. Quick-Start (Docker)

If deploying a fresh AnythingLLM instance:

```bash
docker run -d \
  --name anythingllm \
  -p 3001:3001 \
  -v anythingllm-data:/app/server/storage \
  -e LLM_PROVIDER="generic-openai" \
  -e OPEN_AI_BASE_PATH="https://api.cerebras.ai/v1" \
  -e OPEN_AI_KEY="csk-YOUR_CEREBRAS_API_KEY" \
  -e OPEN_AI_MODEL_PREF="llama3.1-8b" \
  -e EMBEDDING_ENGINE="generic-openai" \
  -e EMBEDDING_MODEL_PREF="text-embedding-3-small" \
  -e EMBEDDING_KEY="sk-or-v1-YOUR_OPENROUTER_API_KEY" \
  -e OPEN_AI_BASE_PATH="https://openrouter.ai/api/v1" \
  mintplexlabs/anythingllm
```

*(Note: OPEN_AI_BASE_PATH conflict above is a real issue — you MUST choose ONE base path per container. Use separate env for embedding if available, or run two instances.)*

---

**Version:** 1.0 | **Updated:** May 2026

*This document is the authoritative upload reference for TunisiaIntel Core_Concept → AnythingLLM ingestion.*
