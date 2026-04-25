# Professional Mode Architecture & Roadmap

This document outlines the structure, components, and navigation of the Professional Intelligence Dashboard (`ProfessionalIntel.tsx`). Use this as a reference for understanding the application's layout and functionality.

## 1. Global Structure

The Professional Mode follows a full-screen layout with:
- **Navigation Sidebar (Left)**: Grouped categories for all intelligence modules.
- **Action Header (Top)**: Real-time metrics, global actions, and system status.
- **Main Viewport (Center/Right)**: Dynamic container for the active module.
- **Intelligence Terminal**: A pop-over overlay for command-line interactions.
- **Mission Control / Pipeline Overlay**: Full-screen overlays for data management.

## 2. Top Bar (ProfessionalHeader.tsx)

### Live Metrics (Left-Center)
- **RRI Index**: Risk Resilience Index (Critical > 2.5).
- **P(Revolution)**: Probability of social escalation.
- **FX Reserves**: Foreign Exchange import cover in days.

### Global Actions (Right)
- **Home (`Home`)**: Return to Selection Mode.
- **Data Pipeline (`Settings`)**: Intelligence Pipeline & AI API settings.
- **AI Analyst (`Zap`)**: Intelligent chat interface.
- **Generate Report (`Download`)**: PDF/Doc export engine.
- **Calendar (`Calendar`)**: Political and Economic event tracking.
- **Terminal (`TerminalSquare`)**: OSINT Command Line.
- **Debugger (`AlertTriangle`)**: Data sync and logic inspector.
- **Methodology (`HelpCircle`)**: RRI and MII logic documentation.
- **Notifications (`Bell/Radio`)**: Alert center.
- **System Time**: Live UTC clock.

## 3. Sidebar Navigation (SIDEBAR_CATEGORIES)

### Command Center
- **Dashboard (`overview`)**: Current situational awareness.
- **System Monitor (`pipeline-control`)**: Pipeline health & observability.
- **Calendar (`calendar`)**: Event timelines.
- **Gov. Agent (`govagent`)**: AI government simulator.
- **Methodology (`methodology`)**: Intelligence logic foundations.

### Economical
- **Investment Reports (`reports`)**: Generated business intel.
- **Economy (`economy`)**: Macroeconomic data.
- **Industry (`industry`)**: Industrial baseline monitoring.
- **Strategic Energy (`strategic-energy`)**: Energy security modeling.
- **Black Market (`black-market`)**: Unofficial trade monitoring.
- **Strategic Explorer (`strategic-explorer`)**: Market frontier analysis.
- **Entrepreneur (`entrepreneur`)**: Business ecosystem monitoring.

### Threat & Security
- **Events (`events`)**: Real-time event monitoring.
- **Security (`security`)**: National security posture.
- **Clusters (`clusters`)**: Data cluster mapping.
- **Actor Network (`actor-network`)**: Stakeholder mapping.
- **Radicalisation (`radicalisation`)**: Extreme narrative tracking.
- **Cognitive Warfare (`cognitive`)**: Information operation analysis.

### Socio-Political
- **Political (`political`)**: State actor monitoring.
- **Social (`social`)**: Civil society & labor dynamics.
- **Geopolitical (`geopolitical`)**: Regional influence mapping.
- **Narrative (`narrative`)**: Media sentiment tracking.

### Environment
- **Environment (`environment`)**: Ecological risk monitoring.
- **Agriculture (`agriculture`)**: Food security modeling.
- **Energy (`energy`)**: Standard energy metrics.
- **Fire Intel (`fire`)**: Wildfire and environmental hazard tracking.

### Advanced Modeling
- **Strategic (`strategic`)**: Multi-variable forecasting.
- **Simulation (`simulation`)**: Scenario stress testing.
- **Civilizational (`civilizational`)**: Long-term cycle analysis.
- **Model Performance (`performance`)**: AI logic validation.
- **NE (`ne`)**: Narrative Engine / Feed.

## 4. Main Dashboard (Overview-Tab)

### Components
- **Daily Briefing**: 3-sentence executive summary.
- **Spotlight Card**: High-impact metrics (RRI, P-Rev, Economic Resilience, Social Cohesion).
- **Forecast Panel**: 14-day predictive cascade probability.
- **Lead Story**: High-severity news item of the day.
- **Hotspots/KIQs**: Key Intelligence Questions and regional risk zones.
- **Strategic Outlook**: Narrative assessment of current stability.
- **Scenarios**: Probability mapping of potential outcomes.

## 5. Intelligence Pipeline (DataPipeline.tsx)

### Tabs
- **AI settings**: Provider selection (Gemini/OpenAI) and API keys.
- **Pipeline**: Document ingestion and field extraction loop.
- **Sources**: Managed library of intelligence origins.
- **Finance Law**: Specialized 2026 fiscal modeling.
- **Health**: OSINT Pipeline Health monitoring (`ObservabilityPanel`).
- **System Monitor**: Advanced observability dashboard (`ObservabilityDashboard`).
