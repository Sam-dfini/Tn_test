# Professional Page Documentation

## Overview
- **Purpose**: The Professional Intelligence Dashboard provides a high-level, comprehensive interface for intelligence analysts to monitor socio-political, economic, predictive, and environmental data for situational awareness.
- **Layout and Design Style**: Cyber-professional, modern, dark-themed (slate/black), utilizing monospace fonts for data values, cyan/cyan accents for tech/intel aesthetic, and a dense informational hierarchy tailored for power users.
- **Main Structure**: It consists of a sticky top action header containing global tools and real-time metrics, a collapsible left-side navigation grouping intelligence modules, and a vast dynamic central viewport displaying the currently active module.

## Header / Top Bar
The header (`ProfessionalHeader`) spans the full width of the screen and stays fixed at the top.

### Left Section (Branding & Status)
- **Toggle Sidebar Button**: A small button with the `Menu` icon to collapse/expand the left navigation.
- **Logo Icon**: A subtle shield icon within a rounded box.
- **Application Title**: "TUNISIA INTEL" 
- **Mode Badge**: "PROFESSIONAL" (Cyan styling).
- **System Status**: Green LED dot accompanied by "System Operational // Node 04" text.

### Center Section
- **Global Search**: Search input with a `Search` icon placeholder (e.g., "Search entities, events, dossiers...").
- **Real-Time Date/Time**: Displayed in UTC format (e.g., "14:32:04 UTC").

### Right Section (Global Actions & Tools)
A suite of icon-only or badge-button actions available from anywhere in the application:
- **Pipeline Debugger** (`AlertTriangle` icon): Opens logic inspector.
- **Data Pipeline** (`Database` or `Settings` icon): Opens the Settings/Data Pipeline view.
- **Intelligence Terminal** (`TerminalSquare` icon): Opens the OSINT Command Line interface popup.
- **Calendar** (`Calendar` icon): Opens the global Political and Economic Event tracking modal. 
- **Generate Report** (`Download` icon): Opens the Intelligence Dossier Exporter form overlay.
- **AI Analyst** (`Zap` icon): Opens the interactive chat/AI reasoning assistant panel.
- **Methodology** (`HelpCircle` icon): Explains calculation schemas like RRI (Risk Resilience Index).
- **Notifications** (`Bell` / `Radio` icon): Alerts dropdown and feed.
- **Home** (`Home` icon): Returns the user to the central Mode Selection screen.
- **System Monitor** (`Activity` icon): Triggers a full-screen observability and pipeline health overlay.

## Sidebar / Left Navigation
The sidebar groups the various intelligence lenses into specific thematic categories. Each category can be expanded or collapsed. 

### Command Center
- **Dashboard** (Default Active) - Icon: `LayoutDashboard`
- **System Monitor** - Icon: `Activity`
- **Calendar** - Icon: `Calendar`
- **Gov. Agent** - Icon: `Brain`
- **Methodology** - Icon: `BookOpen`

### Economical
- **Investment Reports** - Icon: `FileText`
- **Economy** - Icon: `TrendingUp`
- **Industry** - Icon: `Box`
- **Strategic Energy** - Icon: `Zap`
- **Black Market** - Icon: `ShoppingBag`
- **Strategic Explorer** - Icon: `Compass`
- **Entrepreneur** - Icon: `Rocket`

### Threat & Security
- **Events** - Icon: `Radio`
- **Security** - Icon: `ShieldCheck`
- **Clusters** - Icon: `Network`
- **Actor Network** - Icon: `Network`
- **Radicalisation** - Icon: `AlertTriangle`
- **Cognitive Warfare** - Icon: `ShieldAlert`

### Socio-Political
- **Political** - Icon: `Users`
- **Social** - Icon: `Users`
- **Geopolitical** - Icon: `Globe`
- **Narrative** - Icon: `Brain`

### Environment
- **Environment** - Icon: `Sprout`
- **Agriculture** - Icon: `Leaf`
- **Energy** - Icon: `Zap`
- **Fire Intel** - Icon: `Flame`

### Advanced Modeling
- **Strategic** - Icon: `BrainCircuit`
- **Simulation** - Icon: `Cpu`
- **Civilizational** - Icon: `RotateCcw`
- **Model Performance** - Icon: `ShieldCheck`
- **NE (Narrative Engine)** - Icon: `Newspaper`

## Main Content Area

### Tabs and Sub-Tabs
The main view switches entirely based on the selection from the sidebar. 

**Default Active Tab:** `Dashboard` (Overview)

When the **Events** tab is selected, a heavily customized sub-header appears with horizontal pills for granular switching:
- **Real-Time News** (`Newspaper` icon)
- **Temporal Analysis** (`Clock` icon)
- **Signal Intelligence** (`Zap` icon)
- **Event Engine** (`Radio` icon)
- **RTEE** (`Cpu` icon)
- **Timeline** (`Clock` icon)

### Sections and Panels (Overview / Dashboard View)

**1. Executive Briefing Panel**
- **Title**: "Daily Briefing"
- **Content**: A short conversational text providing current status and insights.
- **Interactive Element**: Ability to re-generate or view full context.

**2. Key Risk Indicators (KPI Cards)**
- Four dynamic cards summarizing core metric stability.
- Typically contains: Current value, sparkline or mini-graph trend, delta indicator (red/green arrow), and category title (e.g., Risk Resilience Index, FX Reserves).

**3. Predictive 14-Day Forecast**
- **Title**: "Predictive 14-Day Forecast"
- **Content**: Shows a "Cascade Probability" percentage (Cyan if low, Red if high).
- **Sub-Sections**: 
  - *Precursor Signals*: Bulleted list of detected baseline anomalies.
  - *Forecast Narrative*: Highly contextual AI-generated summary of upcoming risks.

**4. Intelligence Reports (If applicable)**
- Rendered as dense, actionable cards detailing specific situations.
- **Fields displayed**: Title, Report ID (e.g., "REP-001"), Category, Date, Author, Classification Level, Read Time, Quick Summary, and "Key Findings". 

### Buttons and Interactive Elements

| Exact Button Text / Icon | Type / Style | Location | Inferred Action |
| --- | --- | --- | --- |
| `Menu` Icon | Generic Icon | Header (Far Left) | Toggles the Navigation Sidebar |
| "TUNISIA INTEL" | Text Link | Header | N/A (Branding) |
| `Activity` Icon "SYSTEM MONITOR" | Primary Ghost Button | Header | Overlays the pipeline monitoring view |
| `Home` Icon | Header Action Icon | Header (Right Action Group) | Go back to mode selection |
| `TerminalSquare` Icon | Header Action Icon | Header (Right Action Group) | Open terminal prompt |
| `Calendar` Icon | Header Action Icon | Header (Right Action Group) | Switch active view to Calendar |
| `Download` Icon | Header Action Icon | Header (Right Action Group) | Open report generation modal |
| `Zap` Icon | Header Action Icon | Header (Right Action Group) | Open AI assistance / Chat panel |
| "Read Report" | Secondary Outline | Report Cards | Expands the view to read the full intelligence dossier |
| "Real-Time News" | Sub-tab Pill | Events View Header | Switches dynamic view to RSS/News feed |
| "Signal Intelligence" | Sub-tab Pill | Events View Header | Switches dynamic view to NLP signal extraction |
| "Close" / `X` Icon | Close Glyph | Any active Modal/Overlay | Dismisses the current modal |

### Forms, Inputs, and Controls
*Assuming global tools are active:*
- **Global Search Navigation**: 
  - **Label**: None (Icon-driven)
  - **Placeholder**: "Search intelligence database..."
  - **Type**: Text Input
- **API Setup / Settings (Data Pipeline View)**:
  - **Label**: "Select AI Model Provider" 
  - **Type**: Dropdown/Select (Options: Gemini, OpenAI, Anthropic, Custom Node)
  - **Label**: "API Key"
  - **Type**: Password input with eye toggle
  - **Required**: Yes, to operate custom insights

### Tables, Lists, or Data Displays
Within the primary views (e.g., Economy, Political):
- **Tabular Data Views**: Dense structure focusing on real-time datastreams.
- **Typical Table Headers**: `ENTITY`, `SECTOR`, `RISK LEVEL`, `LAST UPDATE`, `CONFIDENCE SCORE`.
- **Badges**: Confidence scores often rendered as colored pill badges (Green = High Confidence, Yellow = Estimated, Red = Low/Inferred).
- **Graphs**: Widespread use of `Recharts` for plotting line charts (e.g., Inflation forecasting), utilizing dark mode contrast and cyan/purple lines for technical data appeal.

### Other UI Elements
- **Scrollbars**: Custom styled webkit scrollbars (Dark track, slate thumb) globally.
- **Notifications Toast**: Floating notifications originating from the bottom right with rapid entrance and fade sequences containing active feed events.
- **Grid Background**: The application runs over a subtle dot-grid matrix background pattern giving a tactical feel.
- **Skeleton Loaders**: Rendered as pulsing semi-transparent slate blocks when the pipeline fetching delays.

## Full Element Inventory
- `ProfessionalHeader` (Sticky top nav)
  - Sidebar Toggle
  - System Indicator
  - Search Input
  - Action Control Group (Home, Terminal, Calendar, AI, Export, Pipeline, Diagnostics)
- `SidebarNavigation`
  - 6 Collapsible Accordion sections (Command Center, Economical, Threat, etc.)
  - 31 specific intelligence viewpoints
- `Main Content Area` (`ProfessionalIntel` render body)
  - Conditional Renderer based on state `activeTab`
  - Sub-navigation dynamic pills for 'Events', 'Economy' or complex contexts
  - Executive Briefing Banner
  - 14-Day Predictor Card
  - Contextual AI Cards (Report summaries, analytical breakdowns)
- Overlays
  - Terminal Command Interface
  - Intelligence Exporter Modal
  - Observability Dashboard (System Monitor)
  - Analytics side-drawer (AI chat) 
