# Technical Architecture & Folder Structure

This document serves as the developer compass for the TunisiaIntel v2.0 Tactical Dashboard. It covers the structural separation of concerns, intelligence pipelines, scaling protocols, and file tree explanations.

---

## 🏗 High-Level System Architecture

The application operates as a **Monorepo** encompassing both a React-based frontend built on a Node.js/Express.js middleware stack, and an isolated Python/FastAPI module for offline data analysis. 

### 1. The Frontend (React 18 + Vite + TypeScript)
The primary user interface is deeply nested and heavily componentized. It does not use standard routing hooks (e.g., `react-router`), but relies on a `ModePageLayout` and localized View states (e.g., Tactical, Predictive, Political). 
*   **State Management:** Driven entirely by high-level React Contexts (`PipelineContext`, `RSSContext`) avoiding Redux in favor of hook-based local state subscriptions.
*   **Data Visualization:** Primarily relies on Recharts combined with custom SVG interactions.
*   **Animations:** Framer Motion enables smooth, sub-second structural transitions (crucial for the dashboard's "cyber/intelligence" aesthetic).

### 2. The Express Middleware (`server.ts`)
Due to CORS issues, strict API security, and the need to process JSON payloads robustly before dispatch, the React app avoids hitting third-party APIs directly.
*   **AI Proxy (`/api/ai`)**: Proxies calls to Google Generative AI strictly through the backend. Validates the `GEMINI_API_KEY` on boot to prevent frontend crashes.
*   **Static Serving**: During production, Vite builds to `/dist`, which is statically mounted and served by Express.

---

## 📂 File Directory Structure (`/src`)

The `/src` folder holds the entire intelligence dashboard codebase.

### `src/components/` (UI & Dashboard Modules)
The largest directory, structurally divided by domain intelligence branches:

*   **`/components/tactical/`** - Live streaming, real-time monitors.
    *   `TacticalDashboard.tsx`: Root panel integrating feeds.
    *   `TacticalMap.tsx`: Spatial geography utilizing `react-leaflet`.
    *   `BreakingIntelFeed.tsx`: Live urgency updates.
    *   `SweepDelta.tsx` & `IncidentWidgets.tsx`: Anomaly detectors.
*   **`/components/predictive/`** - Future modeling and outcome simulation.
    *   `PropagationVisualizer.tsx`: Graph networking to watch domain shocks spread.
*   **`/components/political/`** - Policy, statecraft, and human movement mapping.
    *   `PoliticalOverview.tsx`: Root macro-politics panel.
    *   `CivilMovements.tsx`: Opposition & organizational cluster analysis.
    *   `ActorNetwork.tsx`: D3/Force-graph equivalents tracking elites.
*   **`/components/shared/`** - Common utilities.
*   **Root Components (`/components/*.tsx`)** - Macro panels integrating the above.
    *   `CivilizationalEngine.tsx`: The primary oscillator visualizer tracking interference patterns.
    *   `Economy.tsx` & `EconomyIntelligence.tsx`: Fiscal buffers.
    *   `CognitiveSecurityIntelligence.tsx` & `NarrativeIntelligence.tsx`: Measuring disinformation load.
    *   `BusinessInvestigator.tsx`: Economic decision engine for operators and investors.
    *   `EntrepreneurIntelligence.tsx`: Structured step-by-step startup intelligence framework.

### `src/services/` (Business Logic & Intelligence Engien)
The "brain" of the client-side system. Abstract mathematical concepts are calculated here:

*   `intelligenceBrief.ts`: Core AI module compiling the daily SITREP automatically.
*   `govAgent.ts` & `agents.ts`: Persona-driven evaluations (e.g., simulating how the state evaluates threats).
*   `signalClassifier.ts`: Filters RSS noise into 'Routine', 'Elevated', 'High' urgency buckets.
*   `miiEngine.ts`, `seiEngine.ts`, `etmEngine.ts`: Mass Ideological Index, Systemic Exhaustion Index, Elite Threshold Math.
*   `entrepreneurEngine.ts`: (Experimental) Logic governing phase-based startup risk scoring.
*   `propagationEngine.ts`: The algorithm driving the shock Propagation Visualizer.

### `src/context/` (Global State)
*   **`PipelineContext.tsx`**: The main nervous system. Triggers updates dynamically to the global RRI (Risk/Resilience Index) when certain widgets mutate.
*   **`RSSContext.tsx`**: Background poller tracking external data inputs.
*   **`AIContext.tsx`** / `WebSocketContext.tsx`: Streaming infrastructure.

### `src/types.ts`
The strict taxonomy for the universe. Defines `VariableMap`, `GovernorateMap` (all 24 Tunisian governorates and their properties), `NewsFeedItem`, etc.

---

## 🔌 API & Integration Map

### Google Gemini API integration
The core of the unstructured text extraction relies on sending raw payloads through Vite to `server.ts` -> Google Gen AI.

1.  **Frontend**: component calls `geminiService.ts` function `generateContent(prompt)`.
2.  **Service**: `fetch('/api/ai', { prompt })` (avoids exposing API KEY).
3.  **Backend (`server.ts`)**: `genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt)`.
4.  **Error Handling**: If the key is invalid or "MY_GEMINI_API_KEY", it returns a `400 Bad Request` parsed cleanly by the client.

### Supabase Integration (Optional/Offline)
Stored in `/supabase` (schema definitions) and integrated via standard generic fetchers if connected for long-term intelligence persistence.

---

## 🛠 Extending the Application

**To Add a New Intelligence Domain (e.g., Maritime Intelligence):**
1.  Define the taxonomy inside `src/types.ts` (e.g., `MaritimeIncident`).
2.  Create mathematical bounds in `src/services/maritimeEngine.ts`.
3.  Inject the state into `src/context/PipelineContext.tsx`.
4.  Build a visualization inside `src/components/MaritimeIntelligence.tsx`.
5.  Route it into `src/components/ModePageLayout.tsx`.
