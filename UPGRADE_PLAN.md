# TUNISIAINTEL v2.0 - UPGRADE PLAN

This document outlines the step-by-step implementation plan to transform TunisiaIntel from a clean backend system into a real-time, AI-powered intelligence platform.

---

## 🎯 OBJECTIVE
Implement the missing Intelligence Layer, advanced orchestration, and real-time intelligence loop without breaking the existing architecture.

---

## ⚙️ STEP-BY-STEP PLAN

### Step 1: Database Schema & Core Utilities (COMPLETED)
- [x] Create `backend/app/models/schema.sql` with new tables: `variables`, `signals`, `events`, `agent_memory`, `correlations`, `anomalies`, `scenarios`, `relationships`, `recommendations`.
- [x] Create `backend/app/core/database.py` for Supabase connection management.

### Step 2: Intelligence Engines (COMPLETED)
- [x] Implement `FusionEngine` for multi-source data normalization and weighting.
- [x] Implement `CorrelationEngine` for relationship detection and leading/lagging indicators.
- [x] Implement `AnomalyDetectionEngine` for statistical and rule-based outlier detection.
- [x] Implement `ScenarioSimulator` for "what-if" RRI impact analysis.
- [x] Location: `backend/app/intelligence/engines.py`.

### Step 3: Agent Refactoring (COMPLETED)
- [x] Refactor `BaseAgent` to include `perceive()`, `think()`, `act()`, `learn()` methods.
- [x] Integrate Supabase `agent_memory` for persistent contextual storage.
- [x] Implement `AnalystAgent` for trend analysis and narrative generation.
- [x] Implement `PredictorAgent` for future RRI forecasting and scenario outcomes.
- [x] Location: `backend/app/agents/`.

### Step 4: Advanced Orchestration (COMPLETED)
- [x] Upgrade `MissionOrchestrator` to support event-driven architecture (`EventBus`).
- [x] Implement `MissionState` for lifecycle tracking and state persistence.
- [x] Integrate all intelligence engines into the orchestrator workflows.
- [x] Location: `backend/app/orchestrator.py`.

### Step 5: Real-Time Intelligence Loop (COMPLETED)
- [x] Implement the `run_intelligence_loop` method in `MissionOrchestrator`.
- [x] Define the continuous loop: `INGEST → ANALYZE → UPDATE RRI → DETECT → ALERT → STORE`.
- [x] Integrate event-based alerting for anomalies and risk thresholds.

### Step 6: Decision & Strategy Layer (COMPLETED)
- [x] Create `DecisionEngine` to analyze RRI and anomalies for strategic actions.
- [x] Create `PolicyRecommendationEngine` for specific institutional suggestions.
- [x] Location: `backend/app/strategy/engine.py`.

### Step 7: Graph & Relationship Model (COMPLETED)
- [x] Implement `GraphService` to manage influence relationships between entities.
- [x] Enable graph-like traversal for indirect impact analysis.
- [x] Location: `backend/app/services/graph_service.py`.

### Step 8: API Integration & Frontend Updates (IN PROGRESS)
- [ ] Update `backend/app/api/routes.py` to expose new intelligence and strategy endpoints.
- [ ] Implement Supabase real-time subscriptions in the React frontend for live alerts.
- [ ] Update the RRI dashboard to visualize anomalies, correlations, and scenarios.

### Step 9: Testing & Validation (PENDING)
- [ ] Unit tests for each intelligence engine.
- [ ] Integration tests for the `MissionOrchestrator` loop.
- [ ] Security validation for Supabase RLS rules.

### Step 10: Reliability & Production Hardening (IN PROGRESS)
- [x] Implement `DataQualityLayer` for signal validation and noise filtering.
- [x] Implement `ValidationLayer` for backtesting and confidence scoring.
- [x] Implement `RiskDecompositionEngine` for RRI explainability.
- [x] Implement `SystemObservability` for logging, monitoring, and metrics.
- [x] Upgrade `ScenarioSimulator` for multi-step cascading effects.
- [ ] Implement automated backtesting jobs for historical accuracy.
- [ ] Set up failure recovery and retry strategies in the orchestrator.

### Step 12: Signal Engine Implementation (COMPLETED)
- [x] Design unified `Signal`, `Event`, and `Source` models.
- [x] Implement `SourceScoringSystem` for dynamic reliability tracking.
- [x] Upgrade `ExtractorAgent` to `EventExtractionEngine`.
- [x] Implement `DeduplicationEngine` for signal merging.
- [x] Implement `SignalQualityLayer` for noise filtering.
- [x] Implement `SocialSignalAggregator` for confidence boosting.
- [x] Integrate full Signal Engine pipeline into `MissionOrchestrator`.
- [x] Update Supabase schema with new signal engine tables.

### Step 13: Final Intelligence Upgrade (COMPLETED)
- [x] Implement `SignalLifecycleManager` for decay and expiration.
- [x] Implement `ConflictResolver` for source disagreements and uncertainty.
- [x] Implement `CausalityEngine` for relationship modeling.
- [x] Implement `TemporalPatternEngine` for cycle detection.
- [x] Integrate Human-in-the-Loop (HITL) hooks and validation storage.
- [x] Implement `FeedbackSystem` for agent weight recalibration.
- [x] Upgrade `AdvancedScenarioSimulator` with causality and patterns.
- [x] Enhance `SystemObservability` with failure detection and recovery.
- [x] Implement full database persistence for signals, events, and metrics.
- [x] Integrate all upgraded components into `MissionOrchestrator`.

### Step 14: Production Readiness (PENDING)
- [ ] Configure background workers (Celery/Redis) for the continuous loop.
- [ ] Set up monitoring and logging for agent performance and token usage.
- [ ] Final deployment to Cloud Run.

---

## ⚠️ CRITICAL NOTES
- **No Redesign:** All changes are additive and build on top of the existing FastAPI + Supabase structure.
- **Production Ready:** All code uses async/await, Pydantic models, and structured error handling.
- **Security:** Backend operations use the Supabase Service Role key; frontend operations must use the Anon key with RLS.
