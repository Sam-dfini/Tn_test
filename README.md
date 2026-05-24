# TunisiaIntel v2.0 — Sovereign Intelligence Operating System

**Production-grade risk intelligence, predictive analytics, and cognitive architecture platform** — purpose-built for monitoring, analyzing, and forecasting Tunisia's political, economic, and social stability.

> This is NOT a dashboard. This is a **national-scale cognitive intelligence architecture**: a sovereign institutional memory that senses, reasons, simulates, and forecasts.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   Browser (React 18 SPA)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Citizen  │ │Professional│ │ Tunisia  │ │   Brain     │ │
│  │ Edition  │ │   Intel   │ │ Terminal │ │    Mode     │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │
│                         ↕                                │
│              Express.js Server (port 3001)                │
│         AI proxy · RSS proxy · WebSocket · Vite host      │
│                         ↕                                │
│           Python FastAPI Backend (port 8000)              │
│     Intervention Engine · RRI Pipeline · Telemetry        │
│                         ↕                                │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Supabase │  │  AnythingLLM  │  │ External APIs     │  │
│  │ Postgres │  │ (7 workspaces)│  │ (Gemini, Groq...) │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Operational Modes

| Mode | Description |
|------|-------------|
| **Citizen Edition** | Simplified public-facing view — governorate dossiers, core RRI metrics, easy-to-read intelligence |
| **Professional Intel** | Full-spectrum intelligence dashboard — live RSS/OSINT feeds, AI briefings, actor networks, economic telemetry, simulation sandbox, security & borders |
| **Tunisia Terminal** | Bloomberg-style high-density terminal — real-time RRI, macroeconomic indicators, tactical intel feed |
| **Brain Mode** | Immersive 3D cognitive visualization — High Table concentric actor network, intervention engine, neural map of Tunisia's political/economic/social dynamics |

---

## Core Systems

### Risk/Resilience Index (RRI)
251 variables across 7 domains (Political, Economic, Social, Security, Environmental, Narrative, Institutional) driving a coupled-oscillator civilizational engine. Real-time RRI calculation with cascade probability modeling.

### Phase 10 Intervention Engine
Strategic intervention simulation and ranking — tests interventions in parallel (economic, security, diplomatic, information, institutional), scores by efficiency/cost/risk, ranks by composite score, and synthesizes LLM-powered strategic recommendations.

### High Table Concentric Redesign
NORAD-operations-center-style actor network visualization — 5 concentric rings (Radius 68–395), 14 geopolitical actors with click-to-orbit animation, veto lines, decision flow arrows, stress % indicators, and slide-in intelligence feed.

### ThingsLLM Cognitive Architecture
7 sovereign workspaces replacing generic RAG:

| Workspace | Function |
|-----------|----------|
| `CORE_DOCTRINE` | Strategic reasoning foundation — intelligence theory, doctrine |
| `TUNISIA_STATE` | National reality — BCT, INS, IMF, World Bank economic data |
| `POLITICAL_ACTORS` | Behavioral dynamics — actor dossiers, elite network analysis |
| `SECURITY_INTEL` | Threat landscapes — protest databases, border incidents |
| `HISTORICAL_MEMORY` | Pattern recognition — structured crisis timelines |
| `RRI_ENGINE` | Risk modeling — proprietary equations, cascade models |
| `LIVE_INTELLIGENCE` | Current awareness — RSS, news APIs, real-time monitoring |

### RRI Variable Pipeline
Live article-to-variable extraction — keyword matching maps RSS/Telegram articles to the 251 RRI variables, applies severity-scaled nudges, updates Supabase and in-memory cache in real-time with WebSocket broadcasts.

### Real-Time News & OSINT Feeds
Streaming RSS aggregator — parses 20+ Tunisian news sources (TAP, Mosaique, Business News, etc.), deduplicates via content hash, classifies by severity, and pushes via WebSocket.

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** — integrated Express server on port 3001
- **Tailwind CSS v4** — dark theme, glass morphism, live metrics design
- **Framer Motion / motion** — high-fidelity animations
- **Three.js / React Three Fiber** — 3D Brain Mode visualization
- **D3.js** — force-directed graphs, SVG maps
- **Recharts** — time-series charts
- **Lucide React** — iconography
- **React Leaflet** — spatial maps
- **Socket.io Client** — real-time WebSocket events

### Backend (Express.js — port 3001)
- **Express.js** — AI proxy, RSS proxy, WebSocket server, Vite middleware
- **Socket.io** — real-time event broadcasting
- **@google/generative-ai** — Gemini AI integration
- **http-proxy-middleware** — backend API proxy to Python
- **Supabase JS SDK** — client + real-time channels
- **node-fetch / ws** — HTTP + WebSocket utilities

### Backend (Python FastAPI — port 8000)
- **FastAPI** / **Uvicorn** — HTTP + WebSocket server
- **SQLAlchemy** — ORM for local SQLite fallback
- **httpx** — async HTTP client
- **Supabase Python SDK** — database access
- **google-generativeai** — LLM synthesis
- **Groq / OpenAI** — alternative LLM providers
- **pandas / numpy** — data processing

### Cognitive Layer (AnythingLLM)
- **AnythingLLM API** — 7 workspace cognitive architecture
- **Custom markdown doctrine files** — proprietary analytical logic
- **Cross-workspace query routing** — workspace-aware retrieval

### Infrastructure
- **Supabase** — PostgreSQL + real-time channels + authentication
- **Vercel-ready** — static export + serverless functions
- **Docker Compose** — containerized deployment

---

## Getting Started

### Prerequisites
- Node.js v18+
- Python 3.12+
- A Gemini API key (for AI features)
- A Supabase project (free tier works)
- (Optional) AnythingLLM instance at `llm.kilma.ai` or self-hosted

### Installation

```bash
# Clone and install frontend dependencies
npm install

# Set up Python backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Environment Configuration
```env
# REQUIRED
GEMINI_API_KEY="your_gemini_key"
SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key"

# OPTIONAL — AI providers
OPENROUTER_API_KEY=""
OPENAI_API_KEY=""
GROQ_API_KEY=""

# OPTIONAL — AnythingLLM cognitive architecture
ANYTHINGLLM_API_KEY=""
ANYTHINGLLM_BASE_URL=https://llm.kilma.ai/api

# OPTIONAL — News APIs
VITE_NEWSAPI_KEY=""
VITE_NEWSDATA_KEY=""

# OPTIONAL — Telegram ingestion
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
```

### Running

```bash
# Start everything (Express + Python backend + Vite)
npm run dev

# The app runs on http://localhost:3001
# Python backend runs on http://localhost:8000
```

The Express server (`server.ts`) automatically spawns the Python FastAPI backend as a child process. Backend startup takes 10–15s due to Python import overhead.

### Tests

```bash
# Python backend tests (standalone scripts)
PYTHONPATH=backend python3 backend/scripts/test_intervention_engine.py
```

---

## Project Structure

```
├── src/
│   ├── App.tsx                  # Root — auth, mode routing, RSS provider
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Tailwind + global styles
│   ├── components/
│   │   ├── modes/               # Mode pages (ProfessionalIntel, ModeSelection, etc.)
│   │   ├── system/              # System panels (HighTable, CommandCenter, AlertHub, etc.)
│   │   └── shared/              # Shared UI components
│   ├── context/                 # React contexts (Pipeline, RSS, Alerts, etc.)
│   ├── services/                # API clients, RSS service, analytics
│   ├── config/                  # RSS sources, missions, constant configs
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utilities (storage, schema validation, boot sequence)
│   ├── hooks/                   # Custom React hooks
│   ├── pipeline/                # Satellite ingestion, data pipelines
│   ├── data/                    # Static data (governorates, variables)
│   ├── lib/                     # Library wrappers (Supabase client)
│   ├── math/                    # RRI math, coupled oscillator models
│   ├── store/                   # State stores
│   └── brain/                   # Three.js Brain Mode components
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, router registration
│   │   ├── api/                 # Route handlers (interventions, doctrine, rag, routes)
│   │   ├── services/            # Business logic (intervention_engine, doctrine_client, llm_client, etc.)
│   │   ├── core/                # Config, database, ORM setup
│   │   ├── models/              # SQLAlchemy models
│   │   ├── data/                # Seed data (rri_variables.json)
│   │   └── doctrine/            # Doctrine API router, historical events
│   ├── migrations/              # SQL migration files
│   └── scripts/                 # Standalone test scripts
├── server.ts                    # Express.js server (port 3001)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── docker-compose.yml
├── .env.example
└── public/
    └── data/                    # GeoJSON, static assets
```

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/ARCHITECTURE.md` | System architecture, data flow, ingestion pipeline |
| `docs/DEPLOYMENT.md` | Deployment and scaling plan |
| `METHODOLOGY.md` | RRI math, coupled oscillator civilizational engine |
| `CHANGELOG.md` | Version history and release notes |
| `md_work/TunisiaIntel_Cognitive_Architecture_Guide.md` | AnythingLLM 7-workspace cognitive architecture design |
| `PROFESSIONAL_DASHBOARD_MAP.md` | Professional Intel mode component map |
| `TunisiaIntel_Architecture_Brief.md` | High-level architecture summary |
| `REFACTOR_PLAN.md` | Refactoring roadmap |

---

## Key Design Decisions

- **Dark theme, glass morphism, colored borders, live metrics** across all new panels — no gradients, pastels, or consumer UI patterns
- **Monospace for data, serif for analysis, sans for navigation** — NORAD/Bloomberg/Palantir design language
- **In-memory store with Supabase dual persistence** — all DB writes wrapped in try/except with in-memory fallback (Supabase tables may return 404)
- **Python backend as child process** — spawned by Express (`server.ts`) for integrated dev experience
- **Imports are slow** — Python startup takes 10–15s cumulative
- **No pytest or Jest** — tests are standalone Python scripts (`PYTHONPATH=backend python3 backend/scripts/`)
- **Phases 8/9/10 lazy-loaded** via `React.lazy` from sidebar — no route-based navigation
- **Intelligence Feed as `position: absolute` overlay** — map always gets full grid space
- **AnythingLLM follows 7-workspace cognitive twin model** — not a single monolithic workspace
