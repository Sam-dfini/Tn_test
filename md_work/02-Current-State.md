# 2. Current State Assessment

## 2.1 Existing Modules (from PROFESSIONAL_DASHBOARD_MAP.md)

### Command Center (7 modules)
| Module | Component | Status | Sub-tabs |
|---|---|---|---|
| National Command | `NationalCommandCenter` | Live | — |
| Governance Matrix | `TRGMDashboard` | Live | — |
| Daily Briefing | `DailyBriefing` | Live | — |
| Daily News | `NewsFeed` | Live | — |
| Core Intelligence | Core Overview Layout | Live | — |
| Calendar | `PoliticalCalendar` | Live | — |
| Gov. Agent | `GovernmentAgentPanel` | Live | Threat Model, Predicted Actions, Brain/Mouth, Constraints, Assessment |
| Methodology | Action/Modal | Live | — |

### Economical (7 modules)
| Module | Component | Status | Sub-tabs |
|---|---|---|---|
| Investment Reports | `InvestmentIntelligenceReportGenerator` | Live | — |
| Economy | `EconomyIntelligence` | Live | Macroeconomics, Remittances, Sector Dynamics, Market & Price Monitor, Social Economy, Commodity Stress, Regional Analysis, Business Climate |
| Industry | `IndustrialIntelligencePanel` | Live | — |
| Strategic Energy | `StrategicEnergyIntelligencePanel` | Live | — |
| Black Market | `BlackMarketIntelligencePanel` | Live | Command Center, Commodity Forensics, Smuggling Routes, Subsidy Leakage, OSINT Intercepts |
| Strategic Explorer | `BusinessInvestigator` | Live | — |
| Entrepreneur | `EntrepreneurIntelligence` | Live | — |

### Threat & Security (6 modules)
| Module | Component | Status | Sub-tabs |
|---|---|---|---|
| Events | `EventsIntelligence` | Live | News, Engine, Timeline, Signal, Temporal, RTEE |
| Security | `SecurityIntelligence` | Live | Strategic Readiness, Border & Migration, Narcotics & Crime, Public Safety, Cyber Warfare, Prison System, Police Operations |
| Clusters | `EventClusters` | Live | Geospatial, Temporal, Narrative, Risk |
| Actor Network | `ActorNetworkIntelligence` | Live | Influence, Posture, Coalitions, Threat |
| Radicalisation | `RadicalisationIntelligence` | Live | Gradient, Narrative Poles, Pipeline, EQ Impact, Intervention, Geographic |
| Cognitive Warfare | `CognitiveWarfare` / `CognitiveSecurityIntelligence` | Live | Narrative, Amplification, Targets, Countermeasures |

### Social Observatory (1 module)
| Module | Component | Status |
|---|---|---|
| Societal Fracture | `SocietalFractureMonitor` | Live |

### Socio-Political (5 modules)
| Module | Component | Status | Sub-tabs |
|---|---|---|---|
| Political | `PoliticalIntelligence` | Live | Regime Stability, Elections & Processes, Policy & Legislation, International Relations |
| Social | `SocialIntelligence` | Live | Demographics, Social Cohesion, Education & Labor, Health & Welfare |
| Geopolitical | `GeopoliticalIntelligence` | Live | — |
| Int'l Actor Network | `GeopoliticalNetworkGraph` | Live | — |
| Narrative | `NarrativeIntelligence` | Live | — |

### Environment & Agriculture (9 modules)
| Module | Component | Status | Sub-tabs |
|---|---|---|---|
| Environment | `EnvironmentalIntelligence` | Live | Intelligence Map, Water Security, Ecological Stability, Climate Risks |
| Agriculture | `AgriIntelDashboard` | Live | National Map, Crop Intelligence, Food Security, Rural Dynamics, Agro-Simulator |
| Agricultural Pulse | `NationalAgriculturalPulse` | Live | — |
| Feed Intelligence | `FeedIntelligenceHub` | Live | — |
| Poultry & Eggs | `PoultryEggsIntelligence` | Live | — |
| Livestock & Meat | `LivestockMeatIntelligence` | Live | — |
| Milk & Dairy | `MilkDairyIntelligence` | Live | — |
| Energy | `EnergyIntelligence` | Live | — |
| Fire Intel | `FireIntelligencePanel` | Live | — |

### Advanced Modeling (4 modules)
| Module | Component | Status | Sub-tabs |
|---|---|---|---|
| Strategic | `StrategicModeling` | Live | Crisis Simulator, Coalition Monitor, Predictive Engine, Game Theory, Multi-Framework |
| Simulation | `SimulationIntelligence` | Live | Monte Carlo, Scenario Simulator, Agent Modeling, AI Multi-Agent, Backtesting, Risk Propagation |
| Civilizational | `CivilizationalAnalysis` | Live | Dalio Cycle, Haupt Phases, Freedom Cycle, Ideological Shifts |
| Model Performance | `ModelPerformance` | Live | Overview, Predictions, Accuracy, Correction, Recommendation, Backtesting |

## 2.2 Critical Discovery: Shock Engine Fragments Already Exist

The following sub-tabs contain **pieces of the Shock Propagation Engine**, but they are distributed and invisible to users:

| Fragment | Location | Function |
|---|---|---|
| Risk Propagation | Simulation / Risk Propagation | Graph visualization of shock spread through connected nodes |
| EQ Impact | Radicalisation / EQ Impact | RPI impact on core RRI equations (EQ.3, EQ.4, EQ.19) |
| Crisis Simulator | Strategic / Crisis Simulator | Event-driven regime stability modeling (IMF failure, subsidy cuts, strikes) |
| Multi-Framework | Strategic / Multi-Framework | Synthesis of Fragility, Conflict, Strategic Pressure, Info War, Cascade models |
| RTEE | Events / RTEE | Real-Time Event Engine — shock ingestion layer |
| Agro-Simulator | Agriculture / Agro-Simulator | Agricultural shock testing via `AgroCrisisModel` and `AgroScenarioSimulator` |

**Gap:** No unified interface connects these fragments. An analyst cannot see a shock enter at Events, propagate through equations, and exit as an RRI delta.

## 2.3 Naming Conflict Detected

**Two components named `SocialIntelligence` exist under different parents:**

1. **Threat & Security / Social** — Migration, Diaspora, Brain Drain, Labor, Policy, Family, Health
2. **Socio-Political / Social** — Demographics, Social Cohesion, Education & Labor, Health & Welfare

**Resolution:** Rename to avoid routing collisions:
- Threat & Security / Social → `SocialThreatIntelligence`
- Socio-Political / Social → `SocialPoliticalIntelligence`
