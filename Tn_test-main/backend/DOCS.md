# Backend Documentation: The Brain

This directory contains the Python/FastAPI backend that powers the TUNISIAINTEL intelligence platform.

## 🧱 Core Modules

### 1. `orchestrator.py`: The Mission Control
- **MissionOrchestrator**: The central singleton class that coordinates all AI agents.
- **Intelligence Loop**: Implements the 10-step serial pipeline for processing signals.
- **Event Bus**: An internal pub/sub system that allows agents to react to events (e.g., `ANOMALY_DETECTED`) in real-time.

### 2. `agents/`: Specialized Cognition
- **ExtractorAgent**: Parses unstructured news/social data into structured Signal models.
- **DisinformationAnalyst**: Cross-references narratives to identify state-sponsored manipulation.
- **MovementTracker**: Monitors physical protest events and logistical mobilization.
- **EconomicForecaster**: Maps fiscal signals (FX reserves, inflation) to systemic stress.

### 3. `intelligence/`: Modeling Engines
- **RRIEngine**: The primary risk-modeling component. It consumes signals and calculates the current Risk/Resilience Index.
- **AnomalyDetectionEngine**: Uses historical baselines to identify statistical outliers in signal intensity.
- **DecisionEngine**: High-level reasoning layer that generates actionable recommendations based on detected risks.

### 4. `core/`: Infrastructure
- **database.py**: Interface for Supabase/PostgreSQL persistence.
- **observability.py**: System health monitoring, agent performance tracking, and logging.
- **config.py**: Management of environment variables (API keys, DB credentials).

---

## 🛠 Adding a New Agent
To extend the system:
1.  Create a new class in `agents/` inheriting from the base `Agent` class (if available) or as a standalone service.
2.  Register the agent in the `MissionOrchestrator.__init__` method.
3.  Add the agent's task to the `ANALYZE` step (Step 6) of the `run_intelligence_loop` in `orchestrator.py`.
4.  Optionally, subscribe to specific events via `orchestrator.subscribe()`.
