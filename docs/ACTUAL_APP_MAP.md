# TunisiaIntel v2 - Actual App Map (Quick Onboarding)

Purpose: This is the **current-state map** of the app (not target architecture).  
Use this first when editing, debugging, or adding features to avoid wasting tokens and time.

---

## 1) What this app is right now

- Monorepo with:
  - **Node/Express host** (`server.ts`) for API routes + Vite middleware.
  - **React frontend** (`src/`) with multiple operational modes.
  - **Python FastAPI backend** (`backend/`) started by `server.ts` on port `8000`.
  - **Supabase** as persistence/realtime layer.

- Current default dev runtime:
  - Frontend + Express: `http://localhost:3001`
  - Python backend: `http://localhost:8000`

---

## 2) Boot/runtime flow (actual)

1. `npm run dev` -> runs `tsx server.ts --port 3001`.
2. `server.ts` starts Express + Vite and spawns Python `uvicorn app.main:app --port 8000`.
3. Frontend loads `src/App.tsx`.
4. App checks auth (`supabase.auth.getSession`) + fallback local flag.
5. On mode selection, app runs loading pipeline:
   - `loadPipelineData()`
   - `initializeVariables()` (pipeline service seeding/init)
6. Mode UI mounts (Tactical / Professional / Terminal / Brain).

Important: if Python fails, parts of telemetry/collectors fail even if UI loads.

---

## 3) Top-level entry files you should read first

- `server.ts` -> backend host, Python spawn, API routing, provider checks.
- `src/App.tsx` -> auth gating, mode switching, providers, global overlays.
- `src/components/modes/ModeSelection.tsx` -> currently exposed modes and labels.
- `src/context/PipelineContext.tsx` -> core shared runtime state and intelligence orchestration on frontend.
- `src/services/*` -> math/engines/adapters used by contexts/components.

---

## 4) Current mode map (as implemented)

From `ModeSelection.tsx`, only these modes are currently exposed:

- `advanced` -> **TACTICAL OSINT**
- `professional` -> **PROFESSIONAL INTEL**
- `terminal` -> **TUNISIA TERMINAL**
- `brain` -> **BRAIN MODE**

Mode selection is a major UX gate; most user journeys start here after auth.

---

## 5) Frontend composition map

### 5.1 `src/App.tsx` responsibilities

- Lazy-loads mode components and heavy pages.
- Handles:
  - auth state
  - loading/progress logs
  - selected mode
  - overlays/modals (pipeline, report, methodology, notifications, onboarding)
- Wires global providers.

### 5.2 Active global providers

- `PipelineProvider`
- `AIAnalysisProvider`
- `AgriIntelProvider`
- `RSSProvider`
- `AlertProvider`
- `AIProvider_`
- `ObservabilityProvider`
- `NotificationProvider`
- `AuditProvider`

Rule of thumb: if data appears "global" in UI, start by checking related context providers before touching components.

---

## 6) Backend map (Node + Python)

### 6.1 `server.ts` (Node/Express)

Main roles:

- Starts/stabilizes Python backend process.
- Serves Vite app in dev and APIs in same host.
- Initializes Supabase server client.
- Registers API endpoints/proxies and sockets.
- Runs startup checks (AI provider health, schema init paths, seeding hooks).

### 6.2 Python backend (`backend/app`)

Main roles:

- Deeper intelligence/agent/data processing paths.
- API routes consumed by Node host and internal flows.
- Some ingestion/simulation capabilities and domain logic not ideal to duplicate in frontend.

If Python crashes: check `backend/app/intelligence/*`, `backend/app/api/routes.py`, and import-time errors first.

---

## 7) Data and state reality (today)

- There is a mix of:
  - real data pipelines
  - hybrid/calibrated outputs
  - legacy/mock remnants in some modules

- Existing audit references:
  - `real_fake_fix.md`
  - `UPGRADE_PLAN.md`

When editing feature tabs, verify whether module is REAL/HYBRID/placeholder before claiming production behavior.

---

## 8) Current folder cheat sheet

- `src/components/` -> UI modules by domain/mode.
- `src/context/` -> app-wide state + orchestration.
- `src/services/` -> engines, adapters, computations.
- `src/math/` -> RRI and model math.
- `src/pipeline/` -> ingestion/satellite pipeline logic.
- `src/store/` -> Zustand slices for focused state.
- `backend/app/` -> Python API + intelligence backend.
- `docs/` -> architecture and product docs.
- `md_work/` -> working drafts/plans.

---

## 9) Fast debugging playbook

1. App not loading:
   - check `npm run dev` output
   - check ports `3001`, `8000`
2. UI loads but data missing:
   - inspect `PipelineContext`, `RSSContext`, relevant service
3. API/collector errors:
   - inspect `server.ts` logs and Python stderr
4. Auth weirdness:
   - check Supabase session in `App.tsx` + `Authentication.tsx`
5. Mode-specific issues:
   - start from mode component entry, then its domain context/services

---

## 10) Non-goals of this file

This file does **not** define target clean architecture.  
For future-state architecture blueprint see:

- `md_work/ARCHITECTURE_CLEAN.md`

This file is intentionally focused on **actual current app behavior** for fast contributor onboarding.

---

## 11) Recommended next doc updates (when code changes)

Update this file whenever one of these changes:

- exposed modes in `ModeSelection.tsx`
- startup port/process behavior in `server.ts`
- core providers in `App.tsx`
- major source-of-truth shift in contexts/services

Keep this doc short and current; stale architecture docs cost tokens and cause wrong edits.

