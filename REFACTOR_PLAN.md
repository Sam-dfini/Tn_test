# TunisiaIntel Production Refactor Plan

## 1. Architectural Analysis & Critique

### 🔍 Current Flaws
*   **Client-Side "Intelligence":** The RRI calculation, AI prompting, and data extraction are currently in the browser. This is insecure, unscalable, and limits the system's ability to run background tasks.
*   **Monolithic Services:** `pipelineService.ts` is a "God Object" that mixes data definitions (250 variables), UI logic, and business logic.
*   **Implicit Agent Design:** Agents are just functions in `aiService.ts`. They lack specific roles, memory, and structured communication patterns.
*   **Persistence Risk:** Storing a 250-variable risk index in `localStorage` is a major risk for data integrity and multi-user synchronization.

### 🧱 Anti-patterns
*   **Hardcoded Metadata:** The `FIELD_MAP` is hardcoded in a `.ts` file. This should be in a database or a configuration service.
*   **Global Event Bus:** Using `window.dispatchEvent` for budget/quota events makes tracing difficult.
*   **Implicit Context:** Context for AI calls is often unoptimized, leading to high token costs and lower accuracy.

---

## 2. Proposed Modular Architecture

We will move the "Intelligence" to a **FastAPI backend** and refactor the frontend to be a pure UI layer.

### 📁 New Folder Structure
```text
/backend
  /app
    /core           # Config, security, constants
    /models         # Pydantic models (Variable, Event, Actor)
    /agents         # Independent agent modules
      /base.py      # Base Agent class
      /analyst.py   # Strategic synthesis
      /extractor.py # Data extraction from text
      /predictor.py # RRI & trend prediction
    /services       # Business logic
      /rri_engine.py# The math behind the 250 variables
      /narratives.py# Narrative generation
    /pipelines      # Data ingestion (RSS, Scraping, API Sync)
    /orchestrator   # Agent coordination (The "Brain")
    /api            # FastAPI routes
/frontend           # Refactored React app (UI only)
/infrastructure     # Docker, Terraform, CI/CD
```

---

## 3. Agent System Redesign

Agents are now independent components with clear inputs/outputs.

### Base Agent Class (Python)
```python
class BaseAgent:
    def __init__(self, role: str, model: str = "gemini-3.1-pro-preview"):
        self.role = role
        self.model = model
        self.memory = []

    async def run(self, task: str, context: dict) -> dict:
        # Implementation logic
        pass
```

### Specialized Agents
1.  **Extractor Agent:** Takes raw text (RSS/PDF) and returns structured variable updates.
2.  **Analyst Agent:** Takes variable trends and returns strategic narratives.
3.  **Predictor Agent:** Runs simulations on the RRI model to predict future states.

---

## 4. Orchestration Layer

The **MissionOrchestrator** coordinates multi-step workflows.

**Example: The "Daily Sync" Workflow**
1.  **Orchestrator** triggers `RSSPipeline` to fetch latest news.
2.  **Orchestrator** passes news to `ExtractorAgent`.
3.  `ExtractorAgent` identifies 5 variables that need updating.
4.  **Orchestrator** updates the DB and triggers `RRIEngine`.
5.  `RRIEngine` recalculates the `P(Revolution)` index.
6.  **Orchestrator** passes the change to `AnalystAgent` for a "Breaking Intel" report.
7.  **Orchestrator** sends a notification to the frontend via WebSockets.

---

## 5. Data Layer Improvements

### Variable Normalization
Instead of a flat JSON, we use a structured `Variable` model.
```python
class Variable(BaseModel):
    id: str
    category: str  # Economy, Social, Geopolitical
    value: float
    unit: str
    source: str
    confidence: float
    last_updated: datetime
    history: List[dict]
```

---

## 6. Migration Plan (The 4-Step Strategy)

### Step 1: Backend Foundation (Week 1)
*   Initialize FastAPI and Supabase.
*   Migrate the 250 variables from `pipelineService.ts` to the database.
*   Implement the `RRIEngine` in Python to match the existing math.

### Step 2: Agent Extraction (Week 2)
*   Move AI extraction logic to `backend/agents/extractor.py`.
*   Implement the `MissionOrchestrator` for basic data sync.

### Step 3: Frontend Refactor (Week 3)
*   Replace direct AI calls in `aiService.ts` with calls to the new backend API.
*   Implement React Query for real-time data updates.

### Step 4: Orchestration & Background Tasks (Week 4)
*   Move RSS fetching to background workers (Celery/Redis).
*   Implement the full "Daily Sync" workflow in the Orchestrator.

---

## 7. Code-Level Refactoring Example

### Before (Mixed Responsibilities in TypeScript)
```typescript
// pipelineService.ts
export const extractFields = async (content, type, currentData) => {
  const prompt = `Extract values from ${content}...`;
  const response = await callAI(prompt); // Direct AI call
  return parseAIJSON(response);
};
```

### After (Clean Separation in Python)
```python
# backend/agents/extractor.py
class ExtractorAgent(BaseAgent):
    async def extract(self, content: str, schema: dict) -> List[ExtractedField]:
        # Structured extraction logic
        pass

# backend/api/routes.py
@router.post("/extract")
async def handle_extraction(payload: ExtractionRequest):
    agent = ExtractorAgent()
    return await agent.extract(payload.content, payload.schema)
```
