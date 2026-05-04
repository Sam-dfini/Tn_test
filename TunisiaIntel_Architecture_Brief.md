# TunisiaIntel v2.0 — Full Architecture & Optimization Brief

**Date:** 2026-05-04  
**Prepared for:** Claude / Gemini ingestion  
**Source:** `https://github.com/Sam-dfini/Tn_test`

---

## 1. PROJECT OVERVIEW

TunisiaIntel v2.0 is a production-grade risk intelligence & predictive analytics platform monitoring Tunisia's political, economic, and social stability. It models systemic risk through a **Revolutionary Risk Index (RRI)** across 250 variables using coupled oscillator mathematics, Monte Carlo simulation, and AI-driven brief generation.

**Primary Objective:** Provide actionable, empirical foresight into systemic risk by modeling national stability as the interaction of complex overlapping cycles.

---

## 2. TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (glass-morphism dark mode) |
| Charts | Recharts (SVG) |
| Maps | React Leaflet |
| Animation | Framer Motion (`motion/react`) |
| Icons | Lucide React |
| State | React Context (no Redux) |
| Middleware | Express.js (`server.ts`) |
| Backend | Python / FastAPI (`/backend`) |
| Database | Supabase (PostgreSQL + Realtime) |
| AI | Google Gemini API (proxied through Express) |
| Auth | Supabase Auth (mentioned but not implemented) |

---

## 3. CURRENT FILE STRUCTURE

```
Tn_test/
├── server.ts                    # Express proxy + static serve
├── vite.config.ts               # Vite bundler
├── package.json
├── .env                         # GEMINI_API_KEY, SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── README.md
├── ARCHITECTURE.md
├── METHODOLOGY.md
├── CHANGELOG.md
├── src/
│   ├── App.tsx                  # Root, notification listener
│   ├── types.ts                 # Variable, Governorate, NewsFeedItem
│   ├── components/
│   │   ├── ModePageLayout.tsx   # View state router (no react-router)
│   │   ├── tactical/
│   │   │   ├── TacticalDashboard.tsx
│   │   │   ├── TacticalMap.tsx
│   │   │   ├── BreakingIntelFeed.tsx
│   │   │   ├── SweepDelta.tsx
│   │   │   └── IncidentWidgets.tsx
│   │   ├── predictive/
│   │   │   ├── PropagationVisualizer.tsx
│   │   │   └── SimulationIntelligence.tsx
│   │   ├── political/
│   │   │   ├── PoliticalOverview.tsx
│   │   │   ├── CivilMovements.tsx
│   │   │   └── ActorNetwork.tsx
│   │   ├── shared/
│   │   ├── CivilizationalEngine.tsx
│   │   ├── Economy.tsx
│   │   ├── EconomyIntelligence.tsx
│   │   ├── CognitiveSecurityIntelligence.tsx
│   │   ├── NarrativeIntelligence.tsx
│   │   ├── BusinessInvestigator.tsx
│   │   └── EntrepreneurIntelligence.tsx
│   ├── services/
│   │   ├── intelligenceBrief.ts     # SITREP generator + 30+ shock taxonomy
│   │   ├── rssService.ts          # RSS ingestion, NLP, event engine
│   │   ├── geminiService.ts         # AI proxy calls
│   │   ├── miiEngine.ts             # Ministerial Instability Index
│   │   ├── seiEngine.ts             # Systemic Exhaustion Index
│   │   ├── etmEngine.ts             # Elite Threshold Math
│   │   ├── govAgent.ts              # Regime response simulation
│   │   ├── agents.ts                # Persona-driven evaluations
│   │   ├── signals.ts               # Signal classification
│   │   ├── clusters.ts              # Event clustering
│   │   ├── smartAlerts.ts           # Alert generation
│   │   ├── actorNetwork.ts          # Opposition cohesion analysis
│   │   ├── propagationEngine.ts     # Shock ripple algorithm
│   │   ├── entrepreneurEngine.ts    # Startup risk scoring
│   │   ├── narrativeEngine.ts       # Disinformation analysis
│   │   ├── priorityEngine.ts        # Event priority scoring
│   │   ├── notificationService.ts   # Alert dispatch
│   │   ├── temporalAnalysisService.ts
│   │   ├── AgriIntelEngine.ts
│   │   ├── AgroSystemEngine.ts
│   │   └── shortageDetector.ts
│   ├── context/
│   │   ├── PipelineContext.tsx      # GOD NODE — 81 edges
│   │   ├── RSSContext.tsx
│   │   ├── AIContext.tsx
│   │   └── WebSocketContext.tsx
│   ├── utils/
│   │   ├── rriEngine.ts             # Core math: 250 vars, 24 equations
│   │   ├── storage.ts               # safeStorage wrapper
│   │   ├── logger.ts                # Basic logging
│   │   └── eventUtils.ts            # ID generation
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── aiSafe.ts                # AI error wrapper
│   │   └── keyUtils.ts              # prepareList (had ID corruption bug)
│   ├── data/
│   │   └── rri_variables.json       # Static 250-variable definitions
│   └── config/
│       └── rssSources.ts            # Feed URLs, geo-weight config
├── backend/
│   └── app/
│       └── main.py                  # Python/FastAPI (routes not visible)
```

---

## 4. CORE MATHEMATICAL ENGINE (RRI)

### 4.1 Revolutionary Risk Index Formula
```
R(t) = Σ(i=1 to 24) [ Σ(j=1 to n_i) w_ij · F_ij(t) ] + ε(t)
```

### 4.2 Key Equations Implemented

| EQ | Name | File | Description |
|----|------|------|-------------|
| EQ.1 | Normalization | `rriEngine.ts` | Variable normalization with threshold amplification |
| EQ.2/3 | Salience Modulation | `rriEngine.ts` | War distraction + counter-propaganda effects |
| EQ.4 | SIR Protest Spread | `rriEngine.ts` | Epidemic model for protest propagation |
| EQ.7 | Elite Defection | `rriEngine.ts` | Nash equilibrium defection utility |
| EQ.8 | War Intensity | `rriEngine.ts` | Regional conflict impact (Gaza/Libya/Sahel) |
| EQ.9/10 | Remittance Mobilization | `rriEngine.ts` | Diaspora funding of opposition |
| EQ.12 | Logistic P_rev | `rriEngine.ts` | Probability of systemic disruption |
| EQ.13 | Stochastic Shock | `rriEngine.ts` | Unobserved event injection |
| EQ.14 | Monte Carlo | `rriEngine.ts` | 10,000-run simulation |
| EQ.15 | Compound Stress | `rriEngine.ts` | Non-linear multi-variable interactions |
| EQ.16 | Velocity Index | `rriEngine.ts` | Rate of change of R(t) |
| EQ.17 | Cascade Probability | `rriEngine.ts` | Regional governorates contagion |
| EQ.18 | Elite Cohesion | `rriEngine.ts` | Time-series cohesion depletion |
| EQ.19 | Info Amplification | `rriEngine.ts` | Social media + censorship effects |
| EQ.20 | Historical Pattern | `rriEngine.ts` | Cosine similarity to 2010/2011/2019 |
| EQ.21 | Ministerial Instability | `miiEngine.ts` | Cabinet reshuffle leading indicator |

### 4.3 Historical Reference States
- `tunisia_2010_q3` — Pre-revolution
- `tunisia_2021_q1` — Pre-coup
- `egypt_2011_q1` — Tahrir
- `algeria_2019_hirak` — Bouteflika ouster

### 4.4 Variable Taxonomy (250 variables, 24 categories)
- **A**: Economic (GDP, inflation, FX, debt, subsidies)
- **B**: Environmental (water stress, agriculture)
- **C**: Digital & Tech (censorship, social media, connectivity)
- **D**: Political (trust, press freedom, polarization)
- **E**: Social (protests, cohesion, emigration)
- **F**: Socio-Cultural (diaspora, identity)
- **G**: Legal & Structural (Decree 54, constitution)
- **H**: Media & Communication (propaganda, framing)
- **I**: International (IMF, EU, Gulf, debt)
- **J**: Conflict & War (regional intensity)
- **K**: Historical & Legacy
- **L**: Regime Characteristics (cohesion, age)
- **M**: Opposition Dynamics (UGTT, fragmentation)
- **N**: Security Apparatus (loyalty, repression)
- **O**: Public Sentiment (anger, hope)
- **P**: Youth-Specific (unemployment, rage)
- **Q**: Regional Dynamics
- **R**: Global Influences
- **S**: Health & Welfare
- **T**: Educational System
- **U**: Infrastructure
- **V**: Environmental Sustainability
- **W**: Economic Resilience
- **X**: Future-Oriented

---

## 5. INTELLIGENCE BRIEF ENGINE

### 5.1 Classification Levels
| Level | RRI Threshold | Trigger |
|-------|---------------|---------|
| ROUTINE | < 1.8 | No active alerts |
| ELEVATED | 1.8–2.2 | Single significant signal |
| HIGH | 2.2–2.5 | Multiple signals converging |
| CRITICAL | ≥ 2.5 | Threshold breach or compound trigger |
| EMERGENCY | > 2.8 or P_rev > 80% | Immediate pre-crisis |

### 5.2 Brief Components
- Situation (2-3 sentences)
- Key Developments (sorted by severity)
- Assessment (analytical judgment)
- Contradictions (framework disagreements)
- Watch Indicators (thresholds + timeframes + probabilities)
- Recommended Actions (IMMEDIATE / URGENT / MONITOR / PREPARE)
- Regime Response Prediction (threat level, narrative frame)
- Model State Snapshot
- Trigger Zones (Gafsa, Kasserine, Sidi Bouzid)
- Primary Drivers (top 3)

### 5.3 Shock Taxonomy (30+ Events)
**Categories:** Economic, Political, Social, Security, Information, Commodity, External

**Key Events:**
- `imf_deal_collapse` (ε=0.18, 90d decay)
- `subsidy_cut_bread` (ε=0.16, 45d decay)
- `military_statement` (ε=0.28, 14d decay)
- `ugtt_strike_general` (ε=0.20, 14d decay)
- `bread_disappears` (ε=0.14, 7d decay)
- `internet_shutdown` (ε=0.12, 7d decay)
- `war_regional_escalation` (ε=0.08, 30d decay)
- `ramadan_start` (ε=-0.05, 30d decay — suppressor)

Auto-detection from RSS via keyword matching in Arabic, French, English.

---

## 6. RSS / OSINT PIPELINE

### 6.1 Flow
```
RSS Feed → Fetch via /api/rss proxy → parseRSS() → Geo-filter → NLP Classify → 
Deduplicate (fingerprint) → Ingest to Supabase → Group into Events → 
Calculate Priority → AI Summary (Gemini) → Dispatch Notification
```

### 6.2 NLP Classification
- **Category:** protest, arrest, economic, political, water, migration, labor, rights, shortage_butane, shortage_food, shortage_energy, energy_shock, cabinet_change, econ_policy_change
- **Severity:** 1 (localized) → 5 (systemic risk)
- **Governorate:** 24 governorates via keyword matching
- **RRI Impact:** Variable nudge (0.005–0.035) scaled by severity
- **Bias Detection:** PRO_GOV / NEUTRAL / CRITICAL + ALARMIST / NEUTRAL / MINIMIZING
- **Propaganda Score:** Lexical analysis of techniques

### 6.3 Geo-Relevance Filter
- Drops non-Tunisia articles before DB write
- Score-based with confidence threshold
- Prevents Denmark train crashes from appearing as systemic risk

---

## 7. STATE MANAGEMENT

### 7.1 PipelineContext (GOD NODE)
**Holds:**
- `data: PlatformData` — Economy, Energy, RRI, Geopolitical, Social
- `rriState: RRIState` — Full calculated state
- `auditLog: AuditEntry[]` — All pipeline pushes
- `aiAnalysis, forecast, miiProfile, actorNetwork` — Engine outputs
- `agriSummary, agroSummary` — Agricultural intelligence
- `isPaused: boolean` — Pipeline pause toggle

**Methods:**
- `updateField(path, value, source)` — Single field update
- `pushApprovedChanges(changes[])` — Batch approved update
- `recalculateRRI()` — Full recalculation
- `runAIAnalysis()` — Parallel analysis + forecast + MII + actors
- `resetToDefaults()` — Full reset

**Side Effects:**
- Persists to `localStorage` via `safeStorage`
- Dispatches `ti:pipeline:push` events
- Syncs pause state with backend

### 7.2 Default Data (Hardcoded Baseline)
```
GDP Growth: 0.4%    | Inflation: 7.1%      | FX Reserves: 84 days
Public Debt: 81.2%  | Unemployment: 16.4%   | Youth Unemployment: 37.8%
UGTT Strikes 2025: 847 | Protest Events 30d: 23 | Press Freedom: 118 (RSF)
RRI: 2.31           | P_rev: 64.3%          | Salience: 41.2%
```

---

## 8. KNOWN BUGS & FIXES (May 3, 2026)

| Bug | Location | Fix | Status |
|-----|----------|-----|--------|
| Notification routes to wrong tab | App.tsx | Unified `navigate-main` signal + overlay close | ✅ Fixed |
| Sidebar falls back to Simulation | `keyUtils.ts` prepareList | Preserve domain IDs, use `renderId` for React keys | ✅ Fixed |
| Infinite reload loops | `vite.config.ts` | Expanded watcher ignore list + polling mode | ✅ Fixed |
| Port conflicts EADDRINUSE | `server.ts` | Retry logic + clean exit | ✅ Fixed |
| Blank screen crash | `EventsIntelligence.tsx` | Stabilized `useEffect` AI call | ✅ Fixed (v2.1.0) |
| Data duplication | Article IDs | Fallback hashing for stable IDs | ✅ Fixed (v2.1.0) |
| Import aliasing | Multiple files | `framer-motion` → `motion/react` | ✅ Fixed (v2.1.0) |

---

## 9. CRITICAL GAPS

### 9.1 Architecture
- **No Authentication** — Anyone with URL accesses all intelligence
- **No Authorization** — No role-based access (analyst, senior, admin)
- **God Node** — `usePipeline()` serves 81 consumers; single bottleneck
- **Low Cohesion** — Dashboard modules at 0.05 (junk drawers)
- **Monolithic Components** — No domain boundaries

### 9.2 Data
- **Mocked Agriculture** — `generateMockInputs('drought')` used
- **Static RRI Variables** — `rri_variables.json` loaded at build time
- **No Live Connectors** — BCT, INS, TAP not connected
- **Hardcoded Defaults** — `DEFAULT_DATA` is static baseline

### 9.3 Backend
- **Missing API Routes** — `/api/articles`, `/api/events`, `/api/agri/summary`, `/api/rss/sync`, `/api/intelligence/continuous/*`
- **Orphaned Python** — FastAPI backend exists but routes not visible
- **No Rate Limiting** — Gemini API exposed
- **No Input Validation** — No Zod/schema guards

### 9.4 Testing
- **Zero Tests** — No unit, integration, or E2E tests
- **No Error Boundaries** — One crash = blank screen
- **No Performance Tests** — Monte Carlo blocks main thread

### 9.5 DevOps
- **No Docker** — No containerization
- **No CI/CD** — No GitHub Actions
- **No Feature Flags** — Can't A/B test
- **No Monitoring** — Basic logger only

---

## 10. GRAPHIFY ANALYSIS RESULTS

### 10.1 Metrics
- **932 nodes**, **1486 edges**
- `usePipeline()`: **81 edges** — highest connectivity
- Dashboard & observability: **0.05 cohesion**
- RRI math engine: **well-structured, isolated**
- Radicalisation / SEI pods: **cohesive clusters**

### 10.2 Recommendations
1. **Modularize `usePipeline`** → `useRiskMetrics()`, `useEconomyData()`, `useSocialData()`, `usePoliticalData()`, `useAgriData()`, `useEnergyData()`, `useCognitiveData()`, `useSecurityData()`, `useSimulationData()`, `useAuditLog()`, `useNotifications()`
2. **Feature Extraction** — Move dashboard sub-modules to self-contained domain directories
3. **Utility Unification** — Consolidate ID generators (Community 10 & 21) into single file
4. **Pure Math Extraction** — Move RRI equations to dependency-free library for Web Workers + backend reuse

### 10.3 Target State
- `usePipeline` < 10 edges (from 81)
- Module cohesion > 0.5 (from 0.05)
- 6–8 domain-specific hook clusters
- 24 RRI equations in pure math package
- Domain-boundary folder structure

---

## 11. ENVIRONMENT VARIABLES

```env
# REQUIRED
GEMINI_API_KEY="your_api_key_here"
SUPABASE_URL="your_supabase_url"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

---

## 12. RUNNING THE APP

```bash
# Install
npm install

# Dev server (React SPA + Express middleware)
npm run dev        # → http://localhost:3000

# Python backend (optional)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 13. CHANGELOG (Latest: v2.1.0)

- Real-time Supabase sync via WebSocket channels
- Robust article ID hashing (deduplication fix)
- Critical blank-screen / infinite loop fix in `EventsIntelligence.tsx`
- `framer-motion` → `motion/react` import migration
- Standardized Supabase schemas

---

*End of brief. Ready for architectural refactoring.*
