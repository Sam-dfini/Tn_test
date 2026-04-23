# Tactical Dashboard (TunisiaIntel v2.0)

## Production-Grade Risk Intelligence & Predictive Analytics Platform

The **Tactical Dashboard** (colloquially TunisiaIntel) is a comprehensive intelligence orchestration platform designed to monitor, analyze, and predict civilizational, economic, and political stability, with a specific geographical taxonomy tuned for Tunisia. It combines raw multi-source data ingestion with AI-driven agentic analysis, real-time statistical modeling, and coupled oscillator analytics.

---

## 🎯 Primary Objective

To provide actionable, empirical foresight into systemic risk by modeling national stability not as a static state, but as the interaction of complex, overlapping cycles (economic, political, social) through a **Risk/Resilience Index (RRI)**.

## ✨ Core Features & Modules

The platform is massive and highly modularized, split into various analytical "tiers":

### 1. Tactical & Live Monitoring (`/tactical`)
- **Real-Time News & OSINT Feeds**: Streaming monitors parsing RSS feeds and social trends in real-time.
- **Breaking Intel**: Urgency-filtered live updates indicating critical priority actions.
- **Tactical Map**: A Leaflet-based spatial intelligence map marking geofences, cascade paths, anomaly events, and regional incidents.
- **Incident Widgets & Sweep Delta**: Micro-components for rapid analysis of outages, protests, and rapid systemic shifts.

### 2. Predictive & Simulation (`/predictive`)
- **Simulation Intelligence (RTEE) & Strategic Modeling**: Sandboxed environments for simulating policy decisions, global shocks, and measuring their systemic propagation.
- **Propagation Visualizer**: Graph-based node representations of how a single shock (e.g., fuel price hike) ripples through regional nodes (Governorates).

### 3. Political & Societal Modeling (`/political`)
- **Civilizational Engine**: The crown jewel of the systemic modeling theory. Utilizes coupled oscillator math (destructive/constructive interference) across domains (Economic, Freedom, Social, Political, Ideological).
- **Political Stability & Calendar**: Tracking executive decrees, cabinet stability, constitutional alignments, and an institutional event ledger.
- **Civil Movements & Actor Network**: Network graphs tracking elite cohesion, opposition ideological fragmentation versus mobilization, and protest demands.

### 4. Specialized Intelligence Domains
- **Economy**: Tracking macro-variables (GDP, Inflation), BCT Reserve trackers (import cover), Subsidy Reform Pressures, and Sovereign Debt distributions.
- **Environmental**: Water stress metrics, agricultural deficits, and regional climate volatility maps.
- **Cognitive & Narrative**: Information warfare tracking. Measures disinformation velocity, media framing, and ideological divergence.
- **Fire & Security**: Defense readiness, border security incidents, and conflict heatmap analytics.

### 5. Business Intelligence & Entrepreneurship
- **Business Investigator**: A specialized decision engine for entrepreneurs, operators, and distressed businesses. Provides market gap analysis, location recommendations, and risk-adjusted forecasting for 24 governorates.
- **Entrepreneur Decision Engine**: A structured, multi-phase roadmap for starting ventures, spanning local market validation, legal frameworks, financial modeling, and execution strategy.

### 6. Automated AI Briefings
- **Intelligence Brief Panel**: A generative AI pipeline that computes all active context into a SITREP (Situational Report). Defines classification levels from ROUTINE to EMERGENCY based on anomaly deltas and provides falsifiable watch indicators.

---

## 🛠 Tech Stack

### Frontend Application
*   **React 18**: Core rendering library with functional components and hooks.
*   **TypeScript**: Enforcement of strict typings for variables, contexts, and domain models.
*   **Vite**: Next-generation frontend tooling and bundler.
*   **Tailwind CSS**: Utility-first CSS framework for complex layout precision and glass-morphism dark mode aesthetics.
*   **Recharts**: High-performance SVG charting (used for RRI timelines, Cycle Analysis, and Economic metrics).
*   **Framer Motion (`motion/react`)**: High-fidelity micro-interactions and route animations.
*   **Lucide React**: Vector iconography.
*   **React Leaflet**: Maps and spatial logic.

### Backend & Middleware
*   **Express.js (`server.ts`)**: Serves as the primary application host. It provides HTTP proxying `/api/ai` to the Google Generative AI endpoints securely without exposing API keys to the browser, and handles specific `/api/health` probes.
*   **Python / FastAPI (`/backend`)**: Heavy-lifting offline data crunching, intelligence agents, and mathematical orchestrators (where applicable).

---

## 🚀 Getting Started

### 1. Requirements
*   Node.js v18+
*   npm or yarn
*   A Google Generative AI (Gemini) API Key

### 2. Installation Setup

Clone the repository and install the Node dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file at the root. The AI Studio environment normally injects these variables.
```env
# REQUIRED: Google Gemini API Key for Intelligence Briefs & AI functions
GEMINI_API_KEY="your_api_key_here"

# OPTIONAL: Supabase connection for persistent storage
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 4. Running the Development Server
```bash
npm run dev
```
The React SPA runs using Vite middleware integrated directly into the custom `server.ts` Express server. Your application will be accessible via `http://localhost:3000`.

### 5. Running the Python Backend (Optional Legacy/Offline Processing)
If utilizing the local offline extraction pipelines:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 🧭 Architecture & Further Documentation

To understand the specific interplay of Contexts (`PipelineContext`, `RSSContext`), the Express proxy, and to delve into the mathematical models driving the dashboards, please see the extended documentation:

*   **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Details the folder structure, data flow, API proxy, and React Context architecture.
*   **[METHODOLOGY.md](./METHODOLOGY.md)**: Explains the math behind the Risk/Resilience Index (RRI) and the Coupled Oscillator Civilizational Engine.
