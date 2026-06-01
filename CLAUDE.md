# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (starts Express server on port 3001, which proxies Vite dev on 3000)
npm run dev

# Type-check (no emit)
npm run lint

# Production build (outputs to /dist, generates dist/stats.html bundle analysis)
npm run build

# Start both Python backend (port 8000) + Node frontend together
./start_tunisiaintel.sh

# Python backend only (from project root)
source venv/bin/activate && cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

There is no automated test runner — `test-results/` holds manual/Playwright artifacts. The backtick key (`` ` ``) opens the `SystemCommandCenter` debug overlay in the running app.

## Environment Setup

Copy `.env.example` to `.env`. Required at minimum:

- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — already pre-filled in `.env.example` for the project's Supabase instance
- AI keys (at least one): `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`, `MISTRAL_API_KEY`, `NVIDIA_API_KEY`
- News feed keys (optional): `VITE_NEWSAPI_KEY`, `VITE_NEWSDATA_KEY`, `VITE_GNEWS_KEY`

All AI keys are validated at boot in `server.ts`; providers whose keys contain `MY_` are silently skipped.

## Architecture

### Three-tier stack

| Layer | Tech | Port |
|---|---|---|
| Frontend (SPA) | React 19 + TypeScript + Vite + Tailwind v4 | 3000 |
| Middleware | Express + Socket.io (`server.ts`) | 3001 |
| Backend intelligence engine | Python FastAPI (`backend/app/`) | 8000 |

`server.ts` spawns the Python backend as a child process on startup and restarts it on crash. In development, Vite runs at 3000 and `server.ts` at 3001; in production, Express statically serves `/dist`.

### Mode-based navigation (no router)

`App.tsx` owns a `mode` state that switches between full-screen application modes. There is no `react-router` — all navigation is state-driven or via `window.dispatchEvent` custom events:

- `navigate-to-home` — go to mode selection
- `navigate-to-methodology` — open RRI methodology overlay
- `navigate-to-pipeline` — open DataPipeline overlay
- `navigate-to-observability` — open ObservabilityDashboard

**Modes**: `selection`, `simplified` (CitizenEdition), `professional` (ProfessionalIntel), `advanced` (TacticalDashboard), `palantir`, `bloomberg`, `business_investigator`, `terminal`, `test`, `agriculture`, `brain`

All mode components are lazily loaded via `React.lazy`.

### Context provider stack (outer → inner)

`ObservabilityProvider` → `AIProvider_` → `AuditProvider` → `PipelineProvider` → `RSSProvider` → `NotificationProvider` → `AIAnalysisProvider` → `AgriIntelProvider` → `AlertProvider`

**`PipelineContext`** (`src/context/PipelineContext.tsx`) is the main nervous system — it runs all client-side intelligence engines on load and provides `pipelineData`, `rriState`, and live signal subscriptions to the rest of the app.

**`RSSContext`** is RSS-activation-gated via the `ti-rss-enable` custom event to prevent polling cascades during auth/selection.

### Zustand stores (lightweight cross-cut state)

`src/store/`: `useEventsStore`, `useEconomyStore`, `useIntelStore`, `useModelStore`

### AI proxy

All AI calls are proxied through `server.ts /api/ai`. The server checks provider health at boot and builds a fallback chain. Clients call `geminiService.ts` → `fetch('/api/ai', { prompt })` and never touch API keys directly.

Supported providers (checked in order): Cerebras, OpenAI, NVIDIA, OpenRouter, Mistral, Groq, Google Gemini, Anthropic.

### RRI engine

The Risk/Resilience Index is the core quantitative output. The calculation lives in `src/math/rri/engine.ts`, driven by variables in `src/data/rri_variables.json`. Related engines in `src/services/`: `miiEngine.ts` (Ministerial Instability), `seiEngine.ts` (Systemic Exhaustion), `etmEngine.ts` (Elite Threshold Math), `propagationEngine.ts` (shock spread via SIR model).

### Python backend structure (`backend/app/`)

- `orchestrator.py` — `MissionOrchestrator` singleton, 10-step serial intelligence pipeline, internal pub/sub event bus
- `agents/` — ExtractorAgent, DisinformationAnalyst, MovementTracker, EconomicForecaster
- `intelligence/` — RRIEngine, AnomalyDetectionEngine, DecisionEngine
- `core/` — database.py (Supabase), observability.py, config.py

### Component directory map

`src/components/` is organized by intelligence domain:

| Directory | Purpose |
|---|---|
| `tactical/` | Real-time feeds, TacticalMap (Leaflet), BreakingIntelFeed |
| `political/` | Actor networks (D3 force graph), geopolitical analysis |
| `economy/` | BloombergTerminal, BusinessInvestigator, EconomyIntelligence |
| `predictive/` | StrategicModeling, SimulationIntelligence, PropagationVisualizer |
| `security/` | SecurityIntelligence, RadicalisationIntelligence |
| `social/` | SocialPoliticalIntelligence, NarrativeIntelligence |
| `agriculture/` | AgriIntelDashboard, EnvironmentalIntelligence |
| `modes/` | Top-level mode containers (ModeSelection, ProfessionalIntel, etc.) |
| `system/` | DataPipeline, SystemCommandCenter, AIAnalystPanel, RRIMethodology |
| `shared/` | Authentication, Onboarding, NotificationPanel, TacticalLoading |

### Adding a new intelligence domain

1. Define types in `src/types.ts` or `src/types/`
2. Add calculation logic in `src/services/<domain>Engine.ts`
3. Wire state into `src/context/PipelineContext.tsx`
4. Build visualization in `src/components/<domain>/`
5. Add a new mode or tab entry point in `src/App.tsx` and `src/components/modes/ModeSelection`

### Vite bundle splitting

Manual chunks are configured in `vite.config.ts`: `charts` (d3/recharts), `maps` (leaflet), `animation` (motion), `particles`, `katex`, `three`, `supabase`, and domain chunks (`political`, `security`, `economy`, `agriculture`, `predictive`, `social`).

### Design system

Tailwind v4 with custom intel theme tokens (`intel-bg`, `intel-cyan`, `intel-magenta`). Animations via `motion` (Framer Motion v12). Icons via `lucide-react`. Charts via `recharts` and custom D3 SVG. Maps via `react-leaflet`.

### Supabase

Used for auth (JWT via `src/lib/supabase.ts`), persistent storage (articles, events, RRI snapshots), and real-time channel subscriptions. Schema is in `supabase/schema.sql`.
