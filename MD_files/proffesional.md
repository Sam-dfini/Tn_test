# Professional Mode Architecture & Roadmap

This document outlines the structure, components, and navigation of the Professional Intelligence Dashboard (`ProfessionalIntel.tsx`). Use this as a reference for understanding the application's layers, intelligence branches, sub-modules, and data flows.

---

## 1. Global Structure & Layout Architecture

The Professional Mode follows a full-screen enterprise-grade layout with:

- **Navigation Sidebar (Left)**: 6 hierarchical categories with nested intelligence modules
- **Action Header (Top)**: Live real-time metrics, global system actions, and UTC clock
- **Main Viewport (Center/Right)**: Dynamic container for the active module content
- **Intelligence Terminal**: Pop-over overlay for OSINT command-line interactions
- **Mission Control / Pipeline Overlay**: Full-screen management overlays for data ingestion
- **AI Analyst Panel**: Floating chat interface for conversational intelligence queries

---

## 2. Top Bar (ProfessionalHeader.tsx) - Real-Time Command Center

### Live Metrics & KPIs (Left-Center Section)

**Critical Risk Indicators:**
- **RRI Index** (Revolutionary Risk Index): Multi-factor national stability metric. **Critical threshold > 2.5**
  - Tracks systemic risk from political, economic, social, and security dimensions
  - Real-time colored indicator (Green < 1.5, Yellow 1.5-2.5, Red > 2.5)
- **P(Revolution)**: Probability of social escalation normalized 0-1
  - Composite of protest severity, political instability, and network effects
- **FX Reserves**: Foreign exchange import cover in days
  - Calculated as: (Total FX Reserves) / (Daily Import Average)
  - Critical threshold < 30 days indicates currency distress

### Global Action Buttons (Right Section)

| Action | Icon | Function | Integration |
|--------|------|----------|-------------|
| **Home** | Home | Return to Selection Mode | ModeSelection.tsx |
| **Data Pipeline** | Settings | Intelligence Pipeline & AI API configuration | DataPipeline.tsx |
| **AI Analyst** | Zap | Intelligent conversational interface | AIAnalystPanel.tsx |
| **Generate Report** | Download | PDF/Markdown export engine | IntelligenceDossierExporter.tsx |
| **Calendar** | Calendar | Political and Economic event tracking overlay | CalendarOverlay.tsx |
| **Terminal** | TerminalSquare | OSINT Command Line interface | IntelligenceTerminal.tsx |
| **Debugger** | AlertTriangle | Data sync and logic inspector | PipelineDebugger.tsx |
| **Methodology** | HelpCircle | RRI and MII mathematical logic documentation | RRIMethodology.tsx |
| **Notifications** | Bell/Radio | Alert center for critical events | NotificationCenter.tsx |
| **System Time** | Clock | Live UTC timestamp for coordination | Synchronized to server |

---

## 3. Sidebar Navigation (SIDEBAR_CATEGORIES) - Six Operational Branches

### Branch 1: Command Center
Intelligence coordination and system monitoring hub.

- **Dashboard** (`overview`): Central situational awareness
  - Daily Briefing: 3-sentence executive summary
  - Spotlight Card: High-impact metrics (RRI, P-Revolution, Economic Resilience, Social Cohesion)
  - Forecast Panel: 14-day predictive cascade probability
  - Lead Story: High-severity news item aggregated daily
  - Hotspots/KIQs: Key Intelligence Questions and regional risk zones
  - Strategic Outlook: Narrative assessment of current stability
  - Scenarios: Probability mapping of potential outcomes

- **System Monitor** (`pipeline-control`): Pipeline health & observability
  - Real-time data ingestion metrics
  - API latency monitoring
  - Document processing queue status
  - Variable calculation timestamps
  - Sync error logging and recovery status

- **Calendar** (`calendar`): Event timelines
  - Political events (elections, parliament sessions, policy announcements)
  - Economic releases (CPI, employment, trade data)
  - Social events (strikes, protests, demonstrations)
  - Military/security exercises
  - International summits and bilateral meetings

- **Gov. Agent** (`govagent`): AI government simulator
  - State actor decision modeling
  - Policy impact forecasting
  - Political actor behavior prediction
  - Government capacity assessments

- **Methodology** (`methodology`): Intelligence logic foundations
  - RRI (Revolutionary Risk Index) mathematical equations
  - Component weightings and sub-indices
  - Data source hierarchies
  - Calculation validation logs

---

### Branch 2: Economical Intelligence Hub
Comprehensive macroeconomic and sectoral analysis.

- **Investment Reports** (`reports`): Generated business intelligence
  - AI-generated sector risk assessments
  - Investment opportunity scoring
  - Currency exposure analysis
  - Commodity price forecasting
  - Portfolio stress scenarios
  - Exportable reports in PDF/Markdown

- **Economy** (`economy`): Macroeconomic data & indicators
  - **GDP & Growth**: Real GDP, growth rates, sectoral contribution
  - **Inflation Metrics**: CPI, PPI, core inflation, wage-price dynamics
  - **Unemployment**: Labor force participation, jobless rates by sector
  - **Trade**: Exports, imports, trade balance, competitiveness index
  - **Debt Distress**: Government debt levels, debt servicing ratios, Eurobond yields
  - **FX Reserves**: Currency holdings, import cover days, reserve adequacy ratios
  - **Remittances**: Diaspora inflows, destination countries, transfer mechanisms
  - **Interest Rates**: Policy rates, bond yields, credit spreads
  - **Stock Market**: Index performance, sector rotation, liquidity metrics
  - **Real Estate**: Property prices, construction activity, mortgage rates

- **Industry** (`industry`): Industrial baseline monitoring & sectoral analysis
  - **Manufacturing**: Production indices, capacity utilization, industrial orders
  - **Phosphate Sector**: Extraction volumes, price exposure, export dependence
  - **Textiles & Apparel**: Factory output, employment, export competitiveness
  - **Energy Production**: Thermal generation, renewable capacity, grid stability
  - **Tourism**: Bed occupancy, visitor arrivals, forex receipts
  - **Logistics**: Port throughput, road freight, supply chain disruptions
  - **Industrial Closures**: Facility shutdowns, layoff announcements, bankruptcy filings
  - **Supply Chain Risk**: Raw material bottlenecks, component shortages

- **Strategic Energy** (`strategic-energy`): Energy security modeling
  - **National Energy Security Index (NESI)**: Multi-factor energy resilience metric
  - **Fuel Imports**: Crude oil, diesel, LNG dependencies and costs
  - **Generator Stress**: Fuel scarcity indicators, blackout risks, sector impacts
  - **Butane Crisis**: Cooking fuel shortages, social disruption vectors
  - **Electricity**: Demand patterns, generation mix, grid stability
  - **Renewable Capacity**: Solar/wind development, grid integration challenges
  - **Energy Prices**: Domestic fuel costs, international benchmarks, subsidy burden

- **Black Market** (`black-market`): Unofficial trade monitoring
  - **Currency Arbitrage**: Parallel exchange rates vs official rates, dollarization indicators
  - **Price Gaps**: Formal vs informal market pricing disparities
  - **Smuggling Routes**: Cross-border contraband flows, trade diversion
  - **Cash Economy**: Estimated informal transaction volumes
  - **Commodity Hoarding**: Price manipulation and artificial scarcity

- **Strategic Explorer** (`strategic-explorer`): Market frontier analysis
  - Emerging sector opportunities
  - Untapped market segments
  - Technology adoption curves
  - Regional trade corridor analysis

- **Entrepreneur** (`entrepreneur`): Business ecosystem monitoring
  - **Startup Health**: New company formations, funding activity
  - **Brain Drain**: Skill migration, diaspora talent pools
  - **SME Stress**: Small/medium enterprise failure rates, credit constraints
  - **Entrepreneurial Sentiment**: Business confidence indices
  - **Digital Adoption**: E-commerce, fintech penetration, digital payment adoption

---

### Branch 3: Threat & Security Intelligence
Real-time tactical and strategic security monitoring.

- **Events** (`events`): Real-time event monitoring & OSINT engine
  - **News Feed**: Aggregated international news sources
  - **Analysis Engine**: Automated event extraction and severity classification
  - **Timeline**: Chronological incident reconstruction
  - **Live Signal**: Real-time alert ticker of incoming intelligence
  - **Temporal Trends**: Historical event frequency and seasonality
  - **RTEE (Real-Time Event Extraction)**: Automated parsing of unstructured data
  - Event categorization: protests, violence, accidents, natural disasters, crime

- **Security** (`security`): National security posture
  - **Physical Security**: Crime rates, armed robbery, gang activity
  - **Border Incidents**: Smuggling, unauthorized crossings, military incursions
  - **Police Operations**: Raid activity, arrest statistics, community tensions
  - **Military Operations**: Exercise schedules, deployment changes, readiness posture
  - **Terrorism Risk**: Extremist cell activity, attack planning, radicalization vectors
  - **Cyber Security**: Attacks on critical infrastructure, government hacks, vulnerability exploits
  - **Prison System**: Overcrowding, inmate violence, radicalization in custody

- **Clusters** (`clusters`): Data cluster mapping
  - Geographic clustering of incidents
  - Thematic grouping of related events
  - Actor-centric network clustering
  - Temporal event clustering (waves, cycles)

- **Actor Network** (`actor-network`): Stakeholder graph analysis
  - Key individuals: Political leaders, military brass, business titans, activist leaders
  - Organizations: Political parties, NGOs, militant groups, international organizations
  - Entity relationships: Partnerships, rivalries, financial flows, ideological alignment
  - Network dynamics: Coalition formation, factional splits, influence networks
  - Sanction lists integration with international designations

- **Radicalisation** (`radicalisation`): Extreme narrative tracking
  - **Ideological Shifts**: Salafism, Marxism, nationalist narratives
  - **Recruitment Risk**: Online radicalization pipelines, foreign fighter recruitment
  - **Sermon Analysis**: Religious rhetoric escalation monitoring
  - **Sympathizer Networks**: Social media group analysis, encrypted chat monitoring
  - **Prison Radicalization**: High-risk detainee tracking, chaplain activities

- **Cognitive Warfare** (`cognitive`): Information operation analysis
  - **Disinformation Campaigns**: Coordinated false narratives, bot networks
  - **Propaganda**: State media strategies, political messaging campaigns
  - **Media Manipulation**: Ownership concentration, editorial bias
  - **Rumor Tracking**: Viral misinformation, debunking effectiveness
  - **Narrative Wars**: Competing national identity stories, historical revisionism

---

### Branch 4: Socio-Political Intelligence
Domestic political stability and social dynamics.

- **Political** (`political`): State actor monitoring
  - **Parliamentary Dynamics**: Legislative voting patterns, coalition stability, party discipline
  - **Party Positions**: Policy platforms on economy, security, foreign relations
  - **Cabinet Changes**: Minister appointments, resignations, power consolidation
  - **Electoral Dynamics**: Polling trends, voter demographics, electoral calendar
  - **Factional Tensions**: Intra-party splits, personality-driven rivalries
  - **Government Stability**: Confidence votes, legislative majority control
  - **Policy Implementation**: Decree effectiveness, bureaucratic capacity

- **Social** (`social`): Civil society & labor dynamics
  - **Protest Activity**: Frequency, size, location, duration, grievance themes
  - **Labor Strikes**: Sector-specific strikes, wage demands, strike duration
  - **Civil Unrest**: Clashes with security forces, property damage, casualty counts
  - **Public Sentiment**: Social media sentiment analysis, polling data
  - **Ethnic/Regional Tensions**: Marginalized communities, resource distribution conflicts
  - **Gender Issues**: Women's rights movements, discrimination complaints
  - **Youth Dynamics**: Unemployment, education, emigration aspirations

- **Geopolitical** (`geopolitical`): Regional influence mapping
  - **Foreign Relations**: Bilateral tensions, diplomatic incidents, alliance shifts
  - **Regional Powers**: Saudi, UAE, Egypt, Algeria, Turkey influence vectors
  - **European Engagement**: EU trade negotiations, migration pressures, sanctions
  - **Chinese Interests**: Belt & Road participation, infrastructure investments
  - **American Presence**: Military partnerships, intelligence sharing, aid programs
  - **International Organizations**: UN positions, IMF/World Bank negotiations

- **Narrative** (`narrative`): Media sentiment tracking
  - **Media Landscape**: Ownership structures, editorial bias, circulation trends
  - **Dominant Narratives**: State competence, corruption, external threats
  - **Sentiment Drivers**: Events that shift public opinion
  - **Misinformation**: False claims, conspiracy theories, viral rumors
  - **International Coverage**: Foreign media framing of national events

---

### Branch 5: Environmental & Agricultural Intelligence
Ecological and food security monitoring.

- **Environment** (`environment`): Ecological risk monitoring
  - **Water Scarcity**: Aquifer levels, desalination capacity, drought indicators
  - **Air Quality**: Pollution indices in major cities, health impacts
  - **Coastal Degradation**: Marine resource depletion, tourism impact
  - **Deforestation**: Tree cover loss, desertification progression
  - **Climate Impacts**: Temperature anomalies, rainfall variance, extreme weather frequency
  - **Waste Management**: Landfill capacity, plastic pollution, hazardous waste

- **Agriculture** (`agriculture`): Food security modeling
  - **Crop Yields**: Wheat, barley, dates production vs historical averages
  - **Livestock**: Herd sizes, meat production, feed availability
  - **Water for Agriculture**: Irrigation adequacy, groundwater depletion
  - **Fertilizer Access**: Input costs, subsidy programs, supply chains
  - **Agricultural Prices**: Farm gate prices, food inflation impacts on poor
  - **Rural Livelihoods**: Farmer distress, migration to cities, agri-protest risk
  - **Food Imports**: Dependency ratios, import costs, supply continuity
  - **Pest Outbreaks**: Desert locust, crop diseases, early warning systems

- **Fire Intelligence** (`fire`): Wildfire and environmental hazard tracking
  - **Wildfire Activity**: Active fires, burn area, threat to settlements
  - **Coordinated Arson**: Suspicious fire clusters, criminal networks
  - **Firefighting Capacity**: Equipment, personnel, air support availability
  - **Climate Contribution**: Temperature and drought effect on fire risk
  - **Economic Damage**: Property loss, agricultural damage, infrastructure impact

---

### Branch 6: Advanced Modeling & System Analytics
Predictive intelligence and AI performance monitoring.

- **Strategic** (`strategic`): Multi-variable forecasting
  - Scenario modeling combining economic, political, security variables
  - Systemic risk stress testing
  - Cascade failure analysis
  - Long-term strategic forecasts (6-12 months)

- **Simulation** (`simulation`): Scenario stress testing
  - **Pre-Crime Modeling**: Predictive risk analysis for potential crises
  - **Economic Shock Scenarios**: Currency collapse, trade war, commodity crash
  - **Political Scenarios**: Election outcomes, cabinet crises, constitutional changes
  - **Security Scenarios**: Major terrorist attack, military coup, border conflict
  - **Environmental Scenarios**: Drought escalation, flood events, disease outbreaks
  - **Monte Carlo Simulations**: Probabilistic outcome distributions

- **Civilizational** (`civilizational`): Long-term cycle analysis
  - Historical patterns of state collapse and revival
  - Demographic cycles: youth bulges, aging trends
  - Technological disruption impacts on society
  - Cultural identity evolution
  - Institutional strength trajectory

- **Model Performance** (`performance`): AI logic validation
  - **Accuracy Metrics**: Prediction success rates by event type
  - **Token Usage**: LLM API consumption and costs
  - **Latency Analysis**: Data processing speed, response times
  - **Error Patterns**: Systematic biases, blind spots
  - **Backtesting Results**: Historical forecast validation
  - **Calibration**: Model confidence levels vs actual outcomes

- **NE** (`ne`): Narrative Engine / Live Feed
  - Rapid ticker of incoming intelligence alerts
  - High-priority story escalations
  - Breaking news stream
  - Multi-source verification status

---

## 4. Main Dashboard (Overview-Tab) - Situational Awareness

### Components & Data Elements

**Daily Briefing**
- 3-sentence executive summary of the day's most significant developments
- Written in analytical but accessible language
- Updated at 00:00 UTC

**Spotlight Card**
- **RRI (Revolutionary Risk Index)**: Composite national stability metric
- **P(Revolution)**: Probability of major social escalation
- **Economic Resilience**: GDP growth, FX reserves, debt sustainability
- **Social Cohesion**: Labor unrest, protest activity, protest size

**Forecast Panel**
- 14-day predictive cascade probability
- Daily risk level projections (Low, Medium, High, Critical)
- Confidence intervals for each forecast
- Driver analysis: which variables are pushing risk up/down

**Lead Story**
- Highest-severity news item of the day
- Full article summary with source links
- Contextualization with relevant indicators

**Hotspots/KIQs (Key Intelligence Questions)**
- Regional risk zones requiring monitoring
- Strategic questions the system is tracking
- Relevant sub-indices for each question

**Strategic Outlook**
- Narrative assessment of current national stability
- 2-3 week outlook narrative
- Key risks and opportunities

**Scenarios**
- Probability mapping of 3-5 potential major outcomes
- Best case, base case, worst case scenarios
- Policy intervention leverage points

---

## 5. Intelligence Pipeline (DataPipeline.tsx) - Configuration & Observability

### Configuration Tabs

**AI Settings**
- Provider selection (Gemini, OpenAI, Claude)
- API key management and rotation
- Model selection and versioning
- Token limit configuration
- Temperature and sampling parameters

**Pipeline Configuration**
- RSS feed source management (add/remove sources)
- Document ingestion frequency
- Field extraction rules
- Data validation thresholds
- Retry logic and error handling

**Sources Management**
- Managed library of intelligence origins
- Source credibility ratings
- Bias assessments for each source
- Coverage gaps identification
- Alternative sources recommendations

**Finance Law (2026 Fiscal Modeling)**
- Specialized fiscal policy modeling
- Tax revenue forecasting
- Subsidy cost projections
- Budget constraint scenarios
- Debt ceiling implications

**Health (Observability Panel)**
- OSINT Pipeline Health monitoring
- Data freshness metrics
- Source availability status
- Processing queue depth
- Error rates and types

**System Monitor (Advanced Observability)**
- Memory usage and optimization
- Websocket connectivity status
- Database sync latency
- API response times
- System resource allocation
- React component rendering performance

---

## 6. Global Overlays & Context Management

These components operate independently and can be triggered universally via `window.dispatchEvent()` or context hooks.

### AIAnalystPanel.tsx - Conversational Intelligence
- Floating AI chat interface powered by Gemini
- Ask questions about active data on current screen
- Context-aware responses using visible data
- Export conversation history
- Multi-turn dialogue capability

### IntelligenceDossierExporter.tsx - Report Generation
- Converts current views into downloadable reports
- PDF export with professional formatting
- Markdown export for documentation
- Custom section selection
- Watermarking and metadata inclusion
- Scheduling regular report generation

### RRIMethodology.tsx - Mathematical Transparency
- Full mathematical breakdown of RRI calculation
- Component weightings and sub-indices
- Data source hierarchies
- Calculation validation logs
- Version history of methodology changes

### ObservabilityDashboard.tsx - Engineering Dashboard
- Memory usage trending
- Websocket connectivity monitoring
- Database sync latency tracking
- System error logs
- Performance bottleneck identification
- Real-time alerting for critical issues

### PipelineDebugger.tsx - State Inspection
- Low-level state inspection of the RRI pipeline variables
- Variable calculation traces
- Dependency graphs
- Data source lineage tracking
- Manual recalculation triggers

---

## 7. Core Data Management (Contexts & State)

### PipelineContext
- Manages RRI (Revolutionary Risk Index) calculation and all sub-components
- Variable states: economic, political, security, social
- Pipeline history and data versioning
- AI analytical task management
- Forecasting model parameters

### RSSContext
- Ingests news data from configured sources
- Caches and prioritizes real-time intelligence
- Distributes news across application components
- Source reliability scoring
- Deduplication and clustering

### AIContext
- Standardizes usage of configured LLM API
- Request batching and token optimization
- Error handling and fallback mechanisms
- Usage analytics and cost tracking

### ObservabilityContext
- Telemetry and diagnostic tracking
- Performance metrics collection
- Error logging and stack trace capture
- User interaction analytics (privacy-respecting)
- System health indicators

---

## 8. Integration Points & Data Flows

### External Data Sources
- **Reuters, AP, AFP**: Major news agencies
- **Central Bank Data**: Official economic statistics
- **UN/IMF Databases**: International development indicators
- **Satellite Imagery APIs**: NDVI, weather, infrastructure
- **Social Media APIs**: Twitter/X sentiment, trending topics
- **Market Data Feeds**: Stock prices, commodity prices, FX rates

### Calculation Pipelines
1. Data ingestion from sources
2. Field extraction using NLP
3. Data validation and anomaly detection
4. Variable calculation and normalization
5. RRI component aggregation
6. Forecast model execution
7. Alert generation for threshold breaches

### User Action Triggers
- View switching triggers data reloading
- Report generation initiates background processing
- Calendar events filter displayed data
- Manual recalculation overrides automated updates
- Export operations transform data formats

---

## 9. Performance & Optimization Considerations

- **Real-Time Updates**: WebSocket connections for live data
- **Data Caching**: Multi-tier caching to reduce API calls
- **Lazy Loading**: Components load data on-demand
- **Batch Processing**: Group operations for efficiency
- **Search Optimization**: Indexed queries for rapid retrieval
- **Mobile Responsiveness**: Sidebar collapses on small screens

---

## 10. Security & Access Control

- **Authentication**: Role-based access control for different user tiers
- **Data Sensitivity**: Compartmentalization of high-risk intelligence
- **Audit Logging**: Track all data access and modifications
- **Encryption**: End-to-end for sensitive communications
- **API Key Management**: Secure storage and rotation
- **Session Management**: Automatic timeout for inactive sessions
