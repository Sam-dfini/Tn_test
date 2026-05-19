# TunisiaIntel Cerebras Integration Architecture

> **Version:** 2.0  
> **Date:** 2026-05-18  
> **Status:** Architecture Specification  
> **Scope:** AI layer design for TunisiaIntel risk intelligence platform

---

## Executive Summary

Cerebras is a strategic fit for TunisiaIntel when used as a **cognitive rendering layer**, not as the system's brain. This document defines a disciplined three-layer AI architecture that maps tasks to the correct model tier, maximizing Cerebras' speed and long-context advantages while avoiding token waste on ingestion tasks.

---

## 1. Architecture Philosophy

> **Cerebras = Language Layer. NOT the Brain.**

TunisiaIntel is building **intelligence infrastructure** — a cognitive pipeline and sovereign risk engine. LLMs must be treated as **cognitive renderers**, not as the entire system.

### What to Avoid

| Anti-Pattern | Why |
|-------------|-----|
| RSS → Giant LLM directly | Expensive, noisy, unstable, hallucinations, weak traceability, impossible to scale to 1000+ feeds |
| Using Cerebras for raw parsing | Wastes tokens on structured extraction tasks |
| Monolithic AI layer | Breaks under load, loses reasoning chains, impossible to debug |

### Correct Pattern

```
SENSORS (RSS / Social / Media / Gov)
        ↓
PARSER LAYER (Small local models)
        ↓
EVENT GRAPH (Vector + Structured DB)
        ↓
REASONING / RAG (Retrieval orchestration)
        ↓
CEREBRAS (Final synthesis layer)
        ↓
BRIEFINGS / CHAT / ALERTS
```

This architecture is scalable, traceable, and cost-efficient.

---

## 2. Three AI Layers

### Layer 1: Briefing / Narrative Synthesis
**Best fit for Cerebras**

This is where Cerebras shines because of:
- Ultra-fast inference
- Long context windows
- Low latency
- Free tier access to strong open models

#### Use Cases

| Task | Description |
|------|-------------|
| Daily intelligence briefings | Automated morning briefs from overnight events |
| Executive summaries | One-page risk snapshots for decision-makers |
| Weekly Tunisia situation reports | Consolidated trend analysis |
| Geopolitical syntheses | Multi-source narrative fusion |
| "What changed today?" reports | Delta analysis against baseline |
| Timeline reconstruction | Chronological event threading |
| Alert summarization | Human-readable alert explanations |

#### Recommended Model

**Meta Llama 3.3 70B** (if available through Cerebras)  
or **DeepSeek R1 distilled variants**

**Why:** Excellent summarization, strong geopolitical reasoning, very fast token throughput.

#### Workflow

```
RSS + Sensors + Alerts
        ↓
Event Clustering (Qdrant + embeddings)
        ↓
Cerebras Briefing Model
        ↓
Executive Intelligence Brief
```

> **This is the BEST use of Cerebras in the TunisiaIntel stack.**

---

### Layer 2: Question Answering / Analyst Chat
**Partially good for Cerebras — depends on complexity**

#### Good Use Cases (Cerebras handles well)

- "Summarize latest protests"
- "Compare Saied speeches"
- "What changed in economy this week"
- "Explain why risk increased"
- "Generate analytical narrative"

#### Weak Use Cases (Needs augmentation)

- Deep memory retrieval
- Large RAG reasoning chains
- Graph traversal
- Multi-hop intelligence queries
- Structured geopolitical reasoning
- Agentic workflows

**Example of a weak case:**
> "Show correlation between water stress, migration and protest escalation in Gafsa over 18 months."

This requires:
- Vector DB retrieval
- Graph memory traversal
- Retrieval orchestration
- Structured reasoning pipeline

**NOT** just raw inference.

#### Recommended Architecture

```
User Query
    ↓
Intent Classification
    ↓
RAG Retrieval (Qdrant + embeddings)
    ↓
Context Assembly
    ↓
Cerebras generates answer
    ↓
Analyst Response
```

---

### Layer 3: RSS Parsing
**Do NOT use Cerebras here.**

RSS parsing should be handled by:
- Rules and regex
- Embedding classifiers
- Lightweight local models

**NOT** giant LLMs.

---

## 3. Optimized RSS Pipeline

### Stage 1 — Ingestion
```
RSS Feeds → Normalized Events (structured schema)
```

### Stage 2 — Extraction
**Use small free models:**
- Alibaba Qwen 2.5 7B
- Mistral AI Mistral 7B
- DeepSeek 7B

**Tasks:**
- Classify article (topic / severity)
- Extract actors (entities)
- Detect governorate (geolocation)
- Sentiment analysis
- Detect escalation signals
- Variable nudging (risk score adjustment)

### Stage 3 — Embedding
**Use free embedding models:**
- `bge-small`
- `e5-small`
- `nomic-embed`

Run locally. No API cost.

### Stage 4 — Cerebras Synthesis
**ONLY after clustering.**

```
Clustered Events (Qdrant similarity groups)
        ↓
Cerebras Synthesis
        ↓
Intelligence Brief / Alert / Report
```

This saves enormous compute and improves quality.

---

## 4. Best Free-Only Stack

| Layer | Tool | Role |
|-------|------|------|
| **Briefings** | Cerebras | Executive briefs, synthesis, analyst assistant, explanations |
| **Retrieval** | Qdrant (free) | Vector search, event clustering, similarity matching |
| **Embeddings** | BGE-small / e5-base / nomic-embed | Local embedding generation |
| **RSS Parsing** | Qwen 7B / Mistral 7B / Gemma 7B | Local extraction and classification |
| **Structured Storage** | PostgreSQL | Event records, risk scores, time series |
| **Event Graph** | Neo4j (later) | Relationship mapping, actor networks |
| **Agents** | LangGraph (later) | Autonomous reasoning workflows |

---

## 5. Cerebras Strategic Advantage: SPEED

Cerebras' biggest asset for TunisiaIntel is **speed**. This changes UX completely:

| Capability | UX Impact |
|-----------|-----------|
| Real-time briefings | Live morning brief updated every 15 minutes |
| Live geopolitical narration | Streaming narrative as events unfold |
| Animated "brain mode" | Visual synthesis engine for dashboard |
| Instant synthesis | Sub-second analyst query responses |
| Streaming intelligence feed | Continuous cognitive output |

This aligns perfectly with TunisiaIntel's **"cognitive OS"** direction instead of static dashboards.

---

## 6. Task-to-Model Mapping

### ✅ Use Cerebras For

| Task | Rationale |
|------|-----------|
| Executive briefings | Long-context synthesis, fast turnaround |
| Analyst Q&A | Natural language generation with RAG context |
| Situation reports | Multi-source narrative fusion |
| Simulation explanations | Complex scenario walkthroughs |
| Narrative synthesis | Story-building from fragmented signals |
| Alert explanations | Human-readable risk rationale |

### ❌ Do NOT Use Cerebras For

| Task | Better Alternative |
|------|-----------------|
| Raw RSS parsing | Qwen 7B local / rule-based |
| Embeddings | BGE-small local |
| Vector search | Qdrant (free tier) |
| Entity extraction at scale | Mistral 7B local + spaCy |
| High-frequency ingestion | Streaming pipeline (no LLM) |

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Deploy Qdrant vector database
- [ ] Set up local embedding pipeline (BGE-small)
- [ ] Configure Cerebras API access (free tier)
- [ ] Build RSS ingestion → normalization pipeline

### Phase 2: Parsing Layer (Weeks 3-4)
- [ ] Deploy Qwen 7B / Mistral 7B locally for extraction
- [ ] Build entity extraction pipeline (actors, governorates, sentiment)
- [ ] Implement event classification and severity scoring
- [ ] Connect to Qdrant for embedding storage

### Phase 3: Synthesis Layer (Weeks 5-6)
- [ ] Build event clustering engine (Qdrant similarity search)
- [ ] Integrate Cerebras for briefing generation
- [ ] Develop "What changed today?" delta reports
- [ ] Create executive summary template

### Phase 4: Analyst Interface (Weeks 7-8)
- [ ] Build RAG retrieval layer
- [ ] Integrate Cerebras chat with context assembly
- [ ] Add multi-hop reasoning for complex queries
- [ ] Implement streaming response UX

### Phase 5: Cognitive OS (Ongoing)
- [ ] Add Neo4j event graph
- [ ] Deploy LangGraph agent workflows
- [ ] Build autonomous monitoring agents
- [ ] Implement reality calibration layer

---

## 8. Cost Projection (Free Tier)

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Cerebras API | $0 | Free tier sufficient for briefings + chat |
| Qdrant Cloud | $0 | Free tier: 1GB storage |
| Local Models | $0 | Run on existing infrastructure |
| Embeddings | $0 | Local inference |
| PostgreSQL | $0 | Self-hosted or Supabase free tier |

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Briefing generation time | < 30 seconds | End-to-end from event ingestion to brief |
| Analyst query latency | < 2 seconds | Time to first token with RAG |
| RSS processing throughput | > 1000 articles/hour | Local model pipeline |
| Embedding cost | $0 | Local only |
| Cerebras token efficiency | < 10K tokens per brief | Context assembly optimization |
| Hallucination rate | < 2% | Human analyst review sample |

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Cerebras free tier limits | Cache briefings, implement fallback to local Llama |
| Local model performance | Quantization (4-bit), batch processing |
| Qdrant storage limits | Aggressive deduplication, tiered storage |
| Pipeline failure | Dead letter queues, retry logic, alerting |
| Hallucination in synthesis | Ground all outputs in retrieved context, add citations |

---

## Appendix A: Model Selection Decision Tree

```
Is the task structured extraction?
    ├── YES → Use local 7B model (Qwen/Mistral/Gemma)
    └── NO → Is it synthesis / narrative / chat?
            ├── YES → Use Cerebras (Llama 70B / DeepSeek)
            └── NO → Is it search / similarity?
                    ├── YES → Use Qdrant + embeddings
                    └── NO → Rule-based pipeline
```

## Appendix B: Cerebras API Integration Pattern

```typescript
// Example: Briefing generation with Cerebras
async function generateBriefing(clusteredEvents: EventCluster[]): Promise<Briefing> {
  const context = assembleContext(clusteredEvents); // RAG retrieval

  const response = await cerebras.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [
      {
        role: "system",
        content: `You are TunisiaIntel's executive briefing engine. 
        Synthesize the following intelligence events into a concise, 
        actionable briefing. Cite sources. Flag escalations.`
      },
      {
        role: "user",
        content: context
      }
    ],
    temperature: 0.3,
    max_tokens: 2048
  });

  return parseBriefing(response.choices[0].message.content);
}
```

---

*Document generated for TunisiaIntel v2.0 cognitive architecture.  
Aligns with UPGRADE_PLAN.md Step 8+ and the 15-point gap analysis synthesis layer.*
