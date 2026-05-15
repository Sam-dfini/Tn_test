# TunisiaIntel v2.0 — Strategic Evolution Plan
## From Risk Dashboard to National Cognition System

**Version:** 2.1-STRATEGIC  
**Date:** 2026-05-15  
**Status:** Phases 1, 2, 4 Substantially Complete. Phase 3, 5, 6 Pending.  
**Horizon:** 24–36 weeks full buildout  

---

## Executive Summary

TunisiaIntel v2.0 has a powerful risk-monitoring architecture (RRI engine, Monte Carlo, SIR protest spread, AI briefs, Supabase real-time sync). The next evolution is not "more dashboards" — it is the transition from a powerful prototype into a **continuously learning national cognition system**.

This plan maps the 12 strategic gaps into 6 execution phases. **As of May 2026, Phases 1, 2, and 4 are substantially built.**

---

## Current Snapshot

| Phase | Progress | Key Items |
|-------|----------|-----------|
| **Phase 0** Foundation & Debt | **~60%** | Notification system, health monitoring. Tests/workers pending. |
| **Phase 1** Knowledge Graph + SCI | **~95%** | KG (50 entities, 46 relations, API, D3 explorer, graph components refactored). SCI (source reliability, 6-tier classification, 200+ signals scored). Missing: SCI governorate integration, infrastructure entity graph. |
| **Phase 2** Temporal Intelligence | **~90%** | State Machine (7-state classifier), Narrative Warfare (10 frames, 6 emotions, slogans, convergence), Emotional Heatmap (24 governorates, GeoJSON map, emotion glow), ShockPropagationView (SIR model, GeoJSON, animation). Complete. |
| **Phase 3** Multi-Agent | **0%** | Not started. 6 domain agents + meta-agent + policy simulator. |
| **Phase 4** Simulation & Calibration | **~60%** | RRI engine fully dynamic, Monte Carlo 10K, compound stress. Calibration Dashboard (per-variable accuracy, calibration curve, bias detection, Brier scores). |
| **Phase 5** Strategic Doctrine | **0%** | Not started. |
| **Phase 6** Cognitive UX | **~20%** | Brain Mode icon sidebar, interactive D3 graphs, animated shock propagation, emotional heatmap with glow. Missing: time-travel, narrative drift, ambient intelligence. |
| **Collection Infrastructure** | **~40%** | RSS + Satellite + Telegram (18 channels, alert keywords, feed view). TikTok/Gov/Social feeds pending. |

---

## What Was Built (May 2026 Session)

### Knowledge Graph (Phase 1)
- Supabase tables: `graph_entities` + `graph_relations` with SCHEMA_MAP registration
- Python module: models, graph_db (CRUD + recursive CTE traversal), API router, seed_data (50 entities + 46 relations)
- Frontend: `knowledgeGraphService.ts`, KnowledgeGraphExplorer (D3 combined graph, search/filter/traversal)
- GeopoliticalNetworkGraph + NationalActorNetwork: refactored from hardcoded arrays to API-driven
- Auto-seed on server start
- Civil society actors (LTDH, FTDES, Kawakibi, Bar Association, TNI) added to seed data
- Fixed 404: added `prefix="/api"` to graph router in main.py
- Fixed schema: re-enabled `initializeAllSchemas` to auto-create missing tables

### Signal Credibility Index (Phase 1.3)
- `SCIEngine` with 5-component scoring: source reliability, corroboration, propagation velocity, freshness, contradiction/PSYOP detection
- 30+ source reliability baselines with Bayesian updates
- 6-tier classification: Fact (≥0.85), Probable (≥0.60), Rumor (≥0.35), Coordinated Narrative, PSYOP, Early Weak Signal (<0.35)
- API: score, score-all, status, sources
- Frontend SCIView: classification cards, per-signal bars, source name + text preview, component breakdown
- Fixed: classification ID key mismatch (API used labels, frontend used IDs)
- Fixed: results/stats sync (returned `_scores_history` instead of latest batch)
- Fixed: source_name and text_preview now stored in history

### National State Machine (Phase 2.1)
- `StateMachine` class with 7-phase rules-based classifier using RRI, velocity, cascade prob, coercion, narrative divergence, elite cohesion, SIR infected, compound stress
- Dynamic transition probability matrix with signal boosting
- Dwell time tracking, history buffer, transition log
- API: classify, current, history, transitions
- Frontend NationalStateView: phase card with glow, phase sequence bar, 8 input signal gauges, transition bars, history timeline
- 10s auto-refresh with local classification fallback

### Narrative Warfare Engine (Phase 2.2)
- 10-frame classifier: Anti-IMF, Anti-Elite, Anti-System, Dignity, Hunger, Sovereignty, Security, Reform, Protest, Unity
- 6-emotion sentiment: Anger, Fear, Hope, Defiance, Resignation, Surprise (Arabic/French/English lexicon)
- Slogan/meme tracking via trigram frequency over 24h window
- Narrative convergence scoring via cosine similarity between source categories
- Source-level analysis per category
- API: analyze, current, history, frames, trend
- Frontend: replaced mock 3D view with real data dashboard (frame bars, emotion cards, slogan cloud, source breakdown)
- 30s auto-refresh

### Emotional Heatmap (Phase 2.3)
- Per-governorate emotion aggregation from Telegram + RSS text
- Governorate detection via trilingual keyword matching (24 governorates, major cities)
- Uses article `governorate` field when available (from RSS pipeline)
- National mood computation with full emotion distribution
- API: current, refresh
- Frontend: GeoJSON map with emotion-colored fills, glow filters (anger=strong red glow, defiance=orange, fear=purple), hover tooltip with emotion breakdown, all 24 governorates visible, graded intensity
- Fixed: SVG path commands (added M/L/Z), inactive governorates now visible with subtle outline

### ShockPropagationView Fixes
- Restored missing `GOV_PATHS` declaration
- Switched from 4 static hand-crafted paths to GeoJSON-based rendering (all 24 governorates)
- Fixed accent normalization for Béja/Gabès/Kébili
- Converted `NODES_META` from module-level constant to dynamic `useMemo` with proper center coordinates
- Fixed adjacency lines converging at (260,380) — now use per-governorate centers
- Fixed `useMemo` import

### Calibration Dashboard (Phase 4.2)
- `CalibrationEngine`: fetches predictions from Supabase, computes accuracy per variable/horizon/time
- Per-variable accuracy with Brier scores, category grouping (FX, protest, RRI, elite, cascade, velocity, UGTT, SEI, RPI, ETM, MII)
- Calibration curve: predicted probability vs actual frequency across deciles
- Bias detection: average confidence vs base rate (Overconfident/Underconfident/Well-calibrated)
- Weekly accuracy trend
- API: summary, refresh
- Frontend: overall accuracy %, bias label, horizon bars, per-variable list with colors, calibration scatter plot, trend bars

### Telegram Collection
- Telethon-based collector (v1.43.2) with dual-mode (bot token / user API credentials)
- 18 monitored Tunisian channels across 7 categories
- 40+ alert keywords (Arabic/French)
- Supabase `telegram_messages` table
- API: collect, start, stop, status, messages
- Auto-collect 8s after server start
- Frontend TelegramFeedView in Brain Mode: message list, alert highlighting, category/alert filters, "Collect Now" button

### Brain Mode Redesign
- Replaced floating text button bar with 56px vertical icon sidebar
- 10 views: Constellation, Projection, Terrain, Telegram, Simulation, Narrative Warfare, Heatmap, State Machine, SCI, Calibration, Shock Propagation
- Active purple indicator bar, hover effects, exit button
- All child views fixed from 100vh → 100% for flex layout

### RRI Engine Fixes
- Fixed `ReferenceError: overridesOrVars is not defined` in `eq17_cascadeProbability`
- Replaced `overridesOrVars._cascade_gov_weights` with static defaults
- Replaced `overridesOrVars._cogwar_cascade_risk_delta` with 0

### Infrastructure Fixes
- Proxy POST body forwarding: added explicit `app.post('/api/*', ...)` handler to forward POST bodies consumed by `express.json()`
- Server process management: used `setsid` for persistent background processes

---

## What Remains

### Phase 0 — Foundation & Technical Debt
- [ ] Unit/integration tests for RRI, Monte Carlo, SIR engines
- [ ] Automated backtesting jobs for historical accuracy
- [ ] Celery/BullMQ background workers for continuous loop
- [ ] Failure recovery and retry strategies in orchestrator
- [ ] Supabase real-time channels for live signal feed
- [ ] **Wire Sources tab (Pipeline button) to live RSS/Telegram/SCI collection status** (P1)

### Phase 1 — Knowledge Graph + SCI
- [ ] Infrastructure graph entities (power plants, ports, water networks, transport corridors)
- [ ] Governorate dependency graph (economic flows, migration patterns)
- [ ] Causal link types (TRIGGERED, CORROBORATES, CONTRADICTS)
- [ ] Signal Credibility Index: integrate with governorate-level signals

### Phase 2 — Temporal Intelligence
- [ ] HMM/regime-switching model for phase transitions (upgrade from rules-based)
- [ ] Learned transition probabilities from historical sequences (2010-2011, 2013, 2021, 2024)

### Phase 3 — Multi-Agent Architecture (Weeks 19-26)
- [ ] Economy Agent: inflation, unemployment, debt, smuggling
- [ ] Social Agent: protests, strikes, migration, clan dynamics
- [ ] Narrative Agent: media, social platforms, framing
- [ ] Security Agent: arrests, deployments, border incidents
- [ ] Elite Agent: cabinet reshuffles, party splits, business statements
- [ ] External Agent: IMF, EU, Algeria, Libya, diaspora
- [ ] Meta-Agent: contradiction resolution, consensus generation
- [ ] Policy Impact Simulator: "what-if" cascade trees

### Phase 4 — Simulation & Calibration
- [ ] Scenario sandbox UI (hypothetical injection, black swan library)
- [ ] Sensitivity analysis (tornado diagrams)
- [ ] Ground truth calibration: suppression detection, hidden stabilizers, false-positive analysis
- [ ] Adaptive self-correction: Bayesian parameter update from prediction errors

### Phase 5 — Strategic Doctrine (Weeks 33-40)
- [ ] Theory of State Stability: what holds Tunisia together
- [ ] Theory of Legitimacy: regime legitimacy sources and decay
- [ ] Theory of Coercion: when repression backfires
- [ ] Theory of Elite Cohesion: patronage, fear, fissures
- [ ] Theory of Revolutionary Thresholds: context-dependent RRI flip points
- [ ] National Digital Twin v0.1: unified state vector, interaction model

### Phase 6 — Cognitive UX (Weeks 41-48)
- [ ] Time-travel slider for knowledge graph evolution
- [ ] Narrative drift tracker (animated embedding space)
- [ ] AI Analyst Companion (conversational query over causal graph)
- [ ] Audio briefings (synthesized morning intelligence)
- [ ] Mobile-optimized crisis view

### Collection Infrastructure
- [ ] TikTok monitoring (API + keyword tracking)
- [ ] Facebook pages (CrowdTangle alternative)
- [ ] Government statements (TAP, Official Gazette)
- [ ] UGTT/UTICA press releases
- [ ] Local radio audio transcription
- [ ] Court announcements
- [ ] Commodity feeds (World Bank, FAO, local prices)
- [ ] Diaspora signals (Tunisian community platforms)
- [ ] **Telegram user API credentials** to unlock full 18-channel access

---

## Integration Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                    COGNITIVE UX LAYER                        │
│  Brain Mode (10 views, icon sidebar)                        │
│  KnowledgeGraphExplorer · ShockPropagationView              │
│  Emotional Heatmap · Calibration Dashboard                  │
├─────────────────────────────────────────────────────────────┤
│                   DECISION / SIMULATION                      │
│  Calibration Engine · RRI Engine (21 eq, MC 10K)            │
│  Compound Stress · Media Salience                           │
├─────────────────────────────────────────────────────────────┤
│              TEMPORAL + NARRATIVE INTELLIGENCE               │
│  State Machine (7-phase) · Narrative Warfare (10 frames)    │
│  Emotional Heatmap (24 govs) · SIR Model                    │
├─────────────────────────────────────────────────────────────┤
│              KNOWLEDGE GRAPH + SIGNAL CREDIBILITY            │
│  Supabase-backed (graph_entities + graph_relations)         │
│  Python API (CRUD, traverse, neighbors)                     │
│  SCI Engine (5 components, 6 tiers)                         │
├─────────────────────────────────────────────────────────────┤
│              COLLECTION + INGESTION                          │
│  RSS (5-min) · Satellite (on-demand) · Telegram (Telethon)  │
│  TV metadata · pipelineService                              │
├─────────────────────────────────────────────────────────────┤
│              CORE RISK ENGINE (Existing v2.0)                │
│  RRI · Monte Carlo 10K · SIR · AI Briefs                   │
└─────────────────────────────────────────────────────────────┘
```

---

*Document generated 2026-05-13. Updated 2026-05-15 — full May 2026 build session documented.*
