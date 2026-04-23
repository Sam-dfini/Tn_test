# TunisiaIntel v2.0 - Quick Architecture Structure

This document provides a high-level overview of the TunisiaIntel platform's architecture, outlining the operational modes, dashboard branches, and system overlays. It serves as a rapid navigation map for the application.

---

## 1. System Access Gateway (Mode Selection)
The entry point of the application (`/src/components/ModeSelection.tsx`). Allows users to boot into different operational interfaces depending on their clearance and analytical needs.

*   **Professional Intel:** The core deep-state analytical hub with categorized intel branches (Detailed below).
*   **Tactical OSINT:** Real-time open-source reconnaissance, live news mapping, and geolocation.
*   **Business Investigator:** Economic intelligence tailored for emerging markets.
*   **Test Mode:** Experimental interface for graph/particle mesh rendering.
*   **Palantir Mode:** Interactive node visualization for exploring entity networks and link intelligence.
*   **Tunisia Terminal:** High-density, Bloomberg-style CLI/Dashboard for rapid, terminal-based data feeds.
*   **Agriculture ASIL:** Dedicated Agro-Climate Intelligence System overlay.
*   **Simplified (Citizen Edition):** A stripped-down, simplified view of national risk metrics.

---

## 2. Professional Intel Hub (Core Application)
The primary interface (`/src/components/ProfessionalIntel.tsx`) utilizing a sidebar with discrete intelligence branches.

### Branch 1: Overview
*   **Dashboard (`overview`):** Central command view aggregating RRI (Revolutionary Risk Index), top active shocks, and system status across all modules.

### Branch 2: Information & Geo-Politics
*   **Narratives (`narrative`):** Tracks dominant media and conversational narratives, detecting disinfo campaigns.
*   **Social & Public (`social`):** Monitors public sentiment, protest risks, and social friction.
*   **Geo-Political (`geopolitical`):** Tracks foreign relations, international agreements, and external pressures.
*   **Political (`political`):** Monitors domestic political stability, legislative actions, and party shifts.
*   **Radicalisation (`radicalisation`):** Extremism tracking, ideological shifts, and recruitment risk vectors.
*   **Cognitive Warfare (`cognitive`):** Tracks psychological operations, media manipulation, and info-warfare.
*   **Civilizational (`civilizational`):** Long-term societal, cultural, and demographic trend analysis.

### Branch 3: Tactical & Security
*   **Live Events (`events`):** The core OSINT engine. Contains sub-tabs: 
    *   *News Feed, Analysis Engine, Timeline, Live Signal, Temporal Trends, RTEE (Real-Time Event Extraction).*
*   **Security (`security`):** Tracks physical security threats, border incidents, and police/military operations.
*   **Actor Network (`actor-network`):** Graph-based network analysis of key individuals, organizations, and entities.

### Branch 4: Environmental
*   **Environment / Climate (`environment`):** Broad environmental risk trackers, water scarcity, and ecological stress.
*   **Agriculture (`agriculture`):** Food security, crop yield risks, and agricultural protests. *(Note: Connects to the standalone ASIL module).*
*   **Fire Intelligence (`fire`):** Wildfire tracking, burn area analysis, and coordinated arson detection.

### Branch 5: Economical
*   **Investment Reports (`reports`):** Automated, AI-generated investment risk reports.
*   **Economy (`economy`):** Macro-economic indicators, inflation, debt distress, and FX reserves.
*   **Industry (`industry`):** Track manufacturing density, phosphate extraction risks, and industrial closures *(IndustrialIntel module)*.
*   **Strategic Energy (`strategic-energy`):** National Energy Security Index (NESI), fuel shocks, and butane/generator stress metrics *(StrategicEnergyIntel module)*.
*   **Black Market (`black-market`):** Informal economy tracking, price divergence gaps, and currency distortion.
*   **Entrepreneur (`entrepreneur`):** Tracks startup ecosystem health, brain drain proxies, and SME stress.

### Branch 6: System & AI
*   **Pre-Crime / Simulation (`simulation`):** Predictive risk modeling and systemic shock forecasting.
*   **Live Signal (`ne`):** Rapid ticker/feed of incoming intelligence alerts.
*   **AI Performance (`performance`):** Analytics on the LLM's accuracy, predictive success rates, and token usage.
*   **Gov. Agent (`govagent`):** Specialized interface for specific state-actor simulation/tracking.
*   **Methodology (`methodology`):** Detailed breakdown of the RRI mathematical equations and weightings.

---

## 3. Dedicated Modules & Dashboards

### Agriculture ASIL (`/src/components/agriculture_dashboard/`)
A standalone specialized interface.
*   **Tactical Map:** Leaflet map overlaying NDVI, weather, and agricultural borders.
*   **Crop Monitoring:** Recharts tracking yield predictions vs historical baselines.
*   **Protein Market:** Livestock, poultry, and meat price tracking.
*   **Price Prediction:** Models forecasting forward commodity prices.
*   **Governorate Panel:** Deep dive into specific regional agricultural health.

---

## 4. Global Overlays & Contexts
These components run independent of the current view and can be triggered universally via `window.dispatchEvent` or context hooks.

*   **AI Analyst Panel (`AIAnalystPanel.tsx`):** A floating AI chat interface powered by Gemini to ask questions about the active data.
*   **Data Pipeline Configuration (`DataPipeline.tsx`):** Settings for RSS feeds, API keys (Supabase, Gemini), and raw data ingestion.
*   **Methodology Modal (`RRIMethodology.tsx`):** Full mathematical transparency view.
*   **Intelligence Dossier Exporter (`IntelligenceDossierExporterModal.tsx`):** Converts current views into downloadable PDF/Markdown reports.
*   **System Observability / Mission Control (`ObservabilityDashboard.tsx`):** Engineering dashboard to track memory usage, websocket connectivity, database sync latency, and system errors.
*   **Visual Debugger (`PipelineDebugger.tsx`):** Low-level state inspection of the RRI pipeline variables.

---

## 5. Core Data Management (Contexts)
*   `PipelineContext`: Manages RRI (Revolutionary Risk Index) calculation, Variable states, Pipeline history, and AI analytical tasks.
*   `RSSContext`: Ingests, caches, prioritizes, and distributes real-time news data across the application.
*   `AIContext`: Standardizes usage of the configured LLM API.
*   `ObservabilityContext`: Telemetry and diagnostic tracking of the React application itself.
