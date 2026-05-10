# Professional Dashboard Map

This document provides a comprehensive structural map of the `ProfessionalIntel` module (the Professional Dashboard) to aid in enhancements and navigation.

## Sidebar Navigation & Categories

The sidebar groups intelligence applications into strategic categories.

### 1. Command Center
* **National Command** (`command-center`) -> `NationalCommandCenter`
* **Governance Matrix** (`trgm`) -> `TRGMDashboard`
* **Daily Briefing** (`briefing`) -> `DailyBriefing`
* **Daily News** (`ne`) -> `NewsFeed` (wrapped with `ModuleHeader`)
* **Core Intelligence** (`overview`) -> Core Overview Layout (Dashboard Home)
* **Calendar** (`calendar`) -> `PoliticalCalendar`
* **Gov. Agent** (`govagent`) -> `GovernmentAgentPanel`
* **Methodology** (`methodology`) -> (Usually triggers an action/modal)

### 2. Economical
* **Investment Reports** (`reports`) -> `InvestmentIntelligenceReportGenerator`
* **Economy** (`economy`) -> `EconomyIntelligence`
* **Industry** (`industry`) -> `IndustrialIntelligencePanel`
* **Strategic Energy** (`strategic-energy`) -> `StrategicEnergyIntelligencePanel`
* **Black Market** (`black-market`) -> `BlackMarketIntelligencePanel`
* **Strategic Explorer** (`strategic-explorer`) -> `BusinessInvestigator`
* **Entrepreneur** (`entrepreneur`) -> `EntrepreneurIntelligence`

### 3. Threat & Security
* **Events** (`events`) -> `EventsIntelligence`
* **Security** (`security`) -> `SecurityIntelligence`
* **Clusters** (`clusters`) -> `ClusterIntelligence`
* **Actor Network** (`actor-network`) -> `ActorNetworkIntelligence`
* **Radicalisation** (`radicalisation`) -> `RadicalisationIntelligence`
* **Cognitive Warfare** (`cognitive`) -> `CognitiveWarfare` or `CognitiveSecurityIntelligence`

### 4. Social Observatory
* **Societal Fracture** (`societal-fracture`) -> `SocietalFractureMonitor`

### 5. Socio-Political
* **Political** (`political`) -> `PoliticalIntelligence`
* **Social** (`social`) -> `SocialIntelligence`
* **Geopolitical** (`geopolitical`) -> `GeopoliticalIntelligence`
* **Int'l Actor Network** (`geopolitical-network`) -> `GeopoliticalNetworkGraph`
* **Narrative** (`narrative`) -> `NarrativeIntelligence`

### 6. Environment & Agriculture
* **Environment** (`environment`) -> `EnvironmentalIntelligence`
* **Agriculture** (`agriculture`) -> `AgriIntelDashboard`
* **Agricultural Pulse** (`agri-pulse`) -> `NationalAgriculturalPulse`
* **Feed Intelligence** (`feed-hub`) -> `FeedIntelligenceHub`
* **Poultry & Eggs** (`poultry`) -> `PoultryEggsIntelligence`
* **Livestock & Meat** (`livestock`) -> `LivestockMeatIntelligence`
* **Milk & Dairy** (`dairy`) -> `MilkDairyIntelligence`
* **Energy** (`energy`) -> `EnergyIntelligence`
* **Fire Intel** (`fire`) -> `FireIntelligencePanel`

### 7. Advanced Modeling
* **Strategic** (`strategic`) -> `StrategicModeling`
* **Simulation** (`simulation`) -> `SimulationIntelligence`
* **Civilizational** (`civilizational`) -> `CivilizationalAnalysis`
* **Model Performance** (`performance`) -> `ModelPerformance` (Not currently fully implemented, falls back based on `activeTab` condition)

---

## Shared Layout Elements

* **Top Header (`ProfessionalHeader`)**: Contains main navigation elements, global search, and high-level platform status.
* **Terminal (`Terminal`)**: Slide-up/overlay terminal for commands (`boolean: isTerminalOpen`).
* **Calendar Overlay (`CalendarOverlay`)**: Overlay schedule (`boolean: showCalendar`).
* **AI Analysis Modal/Panel (`IntelligenceBriefPanel`)**: Displayed when `aiAnalysis` is active in the `overview` or through global actions.

## Contextual Details of the `overview` (Core Intelligence) Page

The Core Intelligence Overview is the landing page of the professional dashboard and renders the following layers:

### Layer 1: Tactical Alerting & Status
- **SystemCommandCenter** or **ObservabilityDashboard** (RTEE integration)
- Live synchronization pulse indicators

### Layer 2: Main Dashboard Grid
- **Intelligence Spotlight Carousel**:
  - UGTT Strike Risk
  - FX Reserve Runway
  - Cascade Risk
  - Pattern Match HPS
- **Lead Story Banner**: Parses `leadStory` for SEV-level alerts and global news priorities.
- **Regional Risk Choropleth Map**: Displays geographical heat mapping (`activeLayer="Regional Risk"`). 

### Layer 3: Analytical Depth
- **Forecast & Calibration**: Recharts LineChart for RRI Trend Analysis (historical + forecast), 14-Day Cascade Forecast BarChart.
- **Intelligence Brief (ELEVATED)**: Situational summary, Key Developments, Assessment, and predicted Regime Response matrix.
- **Strategic Outlook**: AI-generated or context-provided strategic narrative.
- **Key Intelligence Questions (KIQs)**: Dynamic list of critical issues being tracked (Confidence/Impact/Status).
- **Regional Hotspots**: Heatmap metrics for areas like Sfax, Gafsa, Kasserine.
- **Scenario Probability (30-day horizon)**: Percentage breakdown of likely paths.
- **Actor Posture Matrix**: Listing of actors, their posture (MOBILIZING/CONSOLIDATING), influence, and trend direction.
- **Live Signal Intelligence Footer**: A ticker (`LiveSignalFeed`) at the bottom of the analytical depth section.

## General Component Architecture
* **State Management**: Zustand and Context Providers (e.g., `PipelineContext`, `RSSContext`).
* **Routing Strategy**: Handled via `activeTab` local state within `ProfessionalIntel.tsx` determining the currently mounted heavy component.
* **UI/Styles**: Tailwind CSS heavily leveraging `glass`, `backdrop-blur`, conditional border rendering (cyan/orange/red risk colors), mono and sans typography scales.
* **Graphs**: Displayed using `recharts`, nested within `<ResponsiveContainer>`.
* **Icons**: `lucide-react` icons standard throughout the sidebar and headers.
