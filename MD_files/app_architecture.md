# TunisiaIntel v2.0 — Complete Application Architecture

This document maps the entire repository structure, architectural layers, and the operational workflow of the TunisiaIntel platform.

---

## 1. System Overview & How It Works

TunisiaIntel v2.0 is a React/TypeScript application acting as a real-time OSINT (Open Source Intelligence) and Predictive Risk dashboard. 

### The Data Flow Loop:
1. **Ingestion (Sources):** The app ingests data from local historical JSON mappings (`src/data`), external APIs, and live RSS feeds (via `RSSContext.tsx` and `rssService.ts`).
2. **Processing (Services & Engines):** Data is piped into the intelligence engines located in `src/services/` and `src/utils/`. Here, raw signals are matched against mathematical constraints (like the RRI Engine, Actor Networks, or the Agri-Crisis models).
3. **State Management (Context Layer):** All parsed and aggregated data is injected into `PipelineContext.tsx`. This acts as the central nervous system. It holds the `PlatformData` (the singular truth state of the country's indicators at any given moment).
4. **Synthesis (AI Generation):** When thresholds are triggered, `AIContext` (using Gemini integration) processes the new pipeline baseline to generate qualitative text intelligence, smart alerts, and narrative analysis.
5. **Presentation (UI Layer):** `src/components/` reacts to changes in Context. Dashboards (Professional, Citizen, Investor) re-render immediately with the latest dynamic charts, maps, and risk indices.

---

## 2. Architectural Layers

The system relies on a strictly decoupled layered architecture.

### Tier 1: Core Data & Input Layer
Contains static variable definitions, historical datasets, and raw input connectors.
- Stores baseline 250 structural variables (`rri_variables.json`).
- Handles mock historical mappings (`mockData.ts`).

### Tier 2: Mathematical Engine & Service Layer
The brain of the platform. Separates all logic from the UI.
- Contains the `rriEngine.ts` (calculating Monte Carlo simulations and SIR protest dynamics).
- Holds domain-specific algorithms (e.g., `BlackMarketIntel.ts`, `AgroSystemEngine.ts`, `etmEngine.ts`).

### Tier 3: State & Orchestration Layer (Contexts)
The nervous system ensuring all disparate engines communicate.
- `PipelineContext`: The state master. Any engine that calculates a new risk sends it to the Pipeline.
- `AIContext`: Orchestrates multi-agent debate and narrative intelligence.
- `ObservabilityContext`: Monitors the performance of the platform itself.

### Tier 4: The Interface Layer (Components)
The final presentation to the end user.
- Modularized into major operational modes (`ModeSelection`).
- Separated logically into distinct branches (Economy, Security, Agriculture, Black Market).

---

## 3. Complete Repository Structure

```text
src/
├── App.tsx                              // Main wrapper (Context Providers, Error Boundary)
├── main.tsx                             // StrictReact DOM entry point
├── index.css                            // Tailwind imports / Global UI styles
├── types/                               // Global TS Interfaces
│   └── types.ts                         // Core type definitions (Signal, RiskOutput, etc.)
│
├── data/                                // Local knowledge graphs & variables
│   ├── actors.json                      // Known political/economic actors
│   ├── events.json                      // Historical timeline events
│   ├── governorates.json                // Geolocational region data
│   ├── mockData.ts                      // Base initialization maps
│   ├── model_v2.json                    // Legacy structural models
│   └── rri_variables.json               // The master 250 variables array
│
├── utils/                               // Mathematical & Utility logic
│   ├── rriEngine.ts                     // Core Revolutionary Risk Index (RRI) algorithms
│   ├── logger.ts                        // Audit & error tracking 
│   ├── pdfGenerator.ts                  // Local PDF report generation
│   ├── cn.ts                            // Tailwind classname merging utility
│   ├── eventUtils.ts                    // Event filtering helpers
│   ├── safeDatabase.ts                  // Local browser storage wrappers
│   └── variableBridge.ts                // Bridge between UI inputs and the RRI engine
│
├── context/                             // Application State Orchestrators
│   ├── AIContext.tsx                    // Manages Gemini LLM requests & agent memory
│   ├── PipelineContext.tsx              // The nervous system (Holds global PlatformData)
│   ├── RSSContext.tsx                   // Manages active OSINT/news feed polling
│   ├── ObservabilityContext.tsx         // Internal system tracing/debugging
│   ├── NotificationContext.tsx          // UI toast/alert engine
│   └── WebSocketContext.tsx             // Socket listeners for server pushes
│
├── services/                            // Domain-specific Intelligence Engines
│   ├── AgriIntelEngine.ts               // Agriculture raw data processing
│   ├── AgroSystemEngine.ts              // BCI (Bread Crisis) mathematical modeling
│   ├── BlackMarketIntel.ts              // BMI (Black Market Index) logic
│   ├── FoodPriceEngine.ts               // Commodity inflation tracking
│   ├── InvestmentIntelligenceEngine.ts  // VC / Startup fragility metrics
│   ├── ProteinIntel.ts                  // Meat/Poultry market tracking
│   ├── miiEngine.ts                     // Ministerial Instability Index logic
│   ├── etmEngine.ts                     // Extended Threat Matrix processing
│   ├── radicalEngine.ts                 // RDE (Radicalisation Dynamics Engine)
│   ├── cognitiveWarfareEngine.ts        // Infowar/narrative tracking
│   ├── geminiService.ts                 // Google AI LLM invocation wrapper
│   ├── signals.ts / signalClassifier.ts // OSINT signal NLP classifiers
│   └── backendClient.ts / firmsService.ts // External APIs
│
├── intel/                               // Secondary Domain Modeling
│   ├── energy/StrategicEnergyIntel.ts   // Strategic Energy Intelligence (NESI, BSI, GSI)
│   └── industry/IndustrialIntel*.ts     // Industrial / Manufacturing Stress Engines
│
├── components/                          // The Presentation / UI Layer
│   │
│   ├── ModeSelection.tsx                // The Gateway (Root Route Selection)
│   ├── ModePageLayout.tsx               // Base UI skeleton
│   ├── ProfessionalIntel.tsx            // Main Professional Analytics Dashboard Hub
│   ├── RRIMethodology.tsx               // The popup dictionary of equations & limits
│   │
│   ├── ... core dashboards ...
│   ├── EconomyIntelligence.tsx          // Economic overview
│   ├── PoliticalIntelligence.tsx        // Political & Regime tracking
│   ├── SocialIntelligence.tsx           // Labor & Protest tracking
│   ├── SecurityIntelligence.tsx         // Ministry of Interior/Defense tracking
│   │
│   ├── ... specific feature modules ...
│   ├── AgriIntelDashboard.tsx           // ASIL Agriculture interface
│   ├── BlackMarketIntelligencePanel.tsx // Parallel economy visualizations
│   ├── StrategicEnergyIntelligencePanel.tsx // SEIM Energy Interface
│   ├── IndustrialIntelligencePanel.tsx  // Industrial mapping
│   ├── InvestmentIntelligenceReport...  // Custom VC PDF Builder
│   │
│   ├── ... cross-domain panels ...
│   ├── ActorNetworkIntelligence.tsx     // Graph of elite relationships
│   ├── CognitiveSecurityIntelligence.tsx// Deep narrative analysis UI
│   ├── DataPipeline.tsx                 // The raw variable control board
│   ├── ObservabilityDashboard.tsx       // System internals monitor
│   ├── IntelligenceDossierExporterModal.tsx // Output export controller
│   │
│   └── shared/                          // Reusable UI components
│       ├── BackgroundGrid, ModuleHeader, ScanlineOverlay
│       └── ...
```

---

## 4. How the User Interfaces with the System

1. The user launches the app and hits `App.tsx`, immediately falling into `ModeSelection.tsx`.
2. The user generally selects **"Professional Mode"**, loading `ProfessionalIntel.tsx`.
3. `ProfessionalIntel.tsx` checks the `PipelineContext` for the latest `globalState.rri`.
4. If a threshold breaches (e.g., *Black Market premium goes above 25%*):
    - `BlackMarketIntel.ts` triggers an alert.
    - `PipelineContext.tsx` dispatches `ti:pipeline:push`.
    - `NotificationContext.tsx` displays a red top-right toast.
    - `rriEngine.ts` automatically runs a new Monte Carlo simulation string.
    - The `ProfessionalIntel` sidebar updates the "RRI Risk" label globally across all child tabs.
    - The `AIAnalystPanel` processes the event and injects a brief paragraph explaining why the Black Market just destabilized the system. 

---
*Created by the TunisiaIntel Automated System Architecture Mapper*