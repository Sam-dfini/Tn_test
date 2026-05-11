# 4. Target Architecture: 3 Tiers + Cross-Cutting

## 4.1 Tier 1 — National Command (The Consciousness Layer)

**For:** Executives, senior analysts, decision-makers  
**Goal:** Immediate situational awareness. Land → See → Decide.  
**Time horizon:** Now  

```
┌─ TIER 1: NATIONAL COMMAND
│  ├─ Daily Briefing              [Landing page — merge Daily News as panel]
│  ├─ National Command            [Choropleth + risk meters]
│  ├─ Core Intelligence           [RRI + 4-spotlight carousel + trajectory]
│  ├─ Alert Hub                   [Unified deduplicated alert stream]
│  ├─ Threat Calendar               [Scheduled events: strikes, anniversaries, elections]
│  └─ Governance Matrix (TRGM)    [MII + ministerial stability]
```

**Key Changes:**
- `Daily News` is merged **into** `Daily Briefing` as a "Live Feed" panel, not a separate top-level node
- `Alert Hub` is **new** — deduplicated, escalated, routed alerts from all domains
- `Gov. Agent` is **moved to Tier 3** — too complex (5 sub-tabs) for executive view
- `Methodology` is **moved to Tier 3** — technical documentation belongs with advanced systems

**Executive Landing Experience:**
1. Daily Briefing (top 3 critical developments, AI-generated)
2. National Command map (choropleth, color-coded governorates)
3. Core Intelligence RRI score + spotlight carousel
4. Alert Hub (tactical → operational → strategic)
5. Threat Calendar (upcoming events)

## 4.2 Tier 2 — Intelligence Domains (The Operational Layer)

**For:** Working analysts, domain specialists  
**Goal:** Deep telemetry, pattern detection, early warning  
**Time horizon:** Now → 14 days  

```
├─ TIER 2: INTELLIGENCE DOMAINS
│  ├─ Economic Intelligence
│  │  ├─ Macro Dashboard           [Economy: 8 sub-tabs]
│  │  ├─ Industry & Energy         [Industry + Strategic Energy]
│  │  ├─ Informal Economy          [Black Market: 5 sub-tabs]
│  │  ├─ Corporate Explorer        [Strategic Explorer rename]
│  │  ├─ Entrepreneur Intel          [Entrepreneur]
│  │  └─ Investor Dossiers          [Investment Reports]
│  │
│  ├─ Security & Threat
│  │  ├─ Event Telemetry           [Events: 6 sub-tabs as view toggles]
│  │  ├─ Security & Borders        [Security: 7 sub-tabs]
│  │  ├─ Hotspot Clusters          [Clusters: 4 sub-tabs]
│  │  ├─ Actor Network             [Influence, Posture, Coalitions, Threat]
│  │  ├─ Radicalisation            [6 sub-tabs including EQ Impact]
│  │  └─ Cognitive Warfare         [4 sub-tabs]
│  │
│  ├─ Socio-Political
│  │  ├─ Political                 [4 sub-tabs]
│  │  ├─ Social Dynamics           [Renamed: Demographics, Cohesion, Labor, Health]
│  │  ├─ Geopolitical              [International relations]
│  │  ├─ International Actors      [IMF/EU graph]
│  │  ├─ Narrative                 [Narrative environment]
│  │  └─ Societal Fracture         [Social contract monitor]
│  │
│  └─ Environment & Food
│     ├─ Climate & Water            [Environment: 4 sub-tabs]
│     ├─ Agriculture                [Agri: 5 sub-tabs including Agro-Simulator]
│     ├─ Food Supply Chains         [Merges: Agri-Pulse + Feed + Poultry + Livestock + Dairy]
│     └─ Fire Intel                 [Satellite wildfire monitoring]
```

**Key Changes:**
- `Events` sub-tabs (News, Engine, Timeline, Signal, Temporal, RTEE) become **view mode toggles**, not separate tabs
- `Black Market` retains all 5 sub-tabs — it is a full fusion center
- `Social` (Socio-Political) renamed to `Social Dynamics` to avoid collision
- `Agricultural Pulse`, `Feed Hub`, `Poultry`, `Livestock`, `Dairy` **collapsed into** `Food Supply Chains`
- `Energy` (under Environment) — verify if this is `Strategic Energy` duplicate or grid-specific

## 4.3 Tier 3 — Advanced Systems (The Simulation Layer)

**For:** Modelers, researchers, methodologists  
**Goal:** Predictive intelligence, scenario testing, model calibration  
**Time horizon:** 14 days → years  

```
├─ TIER 3: ADVANCED SYSTEMS
│  ├─ Simulation Sandbox           [Monte Carlo, Scenario, Agent, AI Multi-Agent, Backtesting, Risk Propagation]
│  ├─ Strategic Modeling            [Crisis Simulator, Coalition Monitor, Predictive Engine, Game Theory, Multi-Framework]
│  ├─ Gov. Agent                   [Moved from Tier 1: Threat Model, Predicted Actions, Brain/Mouth, Constraints, Assessment]
│  ├─ Model Performance             [Overview, Predictions, Accuracy, Correction, Recommendation, Backtesting]
│  ├─ Methodology                   [Equation documentation]
│  ├─ Civilizational Analysis      [Dalio, Haupt, Freedom, Ideology]
│  └─ Historical Patterns           [Pattern matching engine]
```

**Key Changes:**
- `Gov. Agent` moved here — it is a **regime simulation engine**, not an executive briefing tool
- `Risk Propagation` (under Simulation) becomes the **frontend for the Shock Engine**
- `Methodology` moved here — transparency for specialists

## 4.4 Cross-Cutting — Mission Control (The Transformative Layer)

**For:** All analyst levels, mission-specific  
**Goal:** Threat-chain workspaces that pull from multiple domains  
**Time horizon:** Variable per mission  

```
└─ CROSS-CUTTING: MISSION CONTROL
   ├─ Food Security Crisis          [Agriculture + Water + Black Market + UGTT + Narrative]
   ├─ Elite Fracture                [Actor Network + Political + TRGM + Societal Fracture]
   ├─ UGTT Escalation               [Social Dynamics + Events + Clusters + Narrative + Cascade]
   ├─ Water Collapse                [Climate & Water + Agriculture + Governorates + Social Grievance]
   ├─ Border Instability            [Security & Borders + Geopolitical + Black Market + Radicalisation]
   ├─ Narrative War                 [Cognitive Warfare + Narrative + Social Media + Political]
   └─ Intelligence Architecture     [System topology + signal flow diagram]
```

**Mission Control Page Structure:**
Each mission is a **dynamic workspace** that:
1. Auto-assembles relevant telemetry widgets from existing domains
2. Runs mission-specific shock propagation (pre-loaded variables)
3. Generates mission-specific RRI delta
4. Provides "Open in Simulation Sandbox" button with pre-loaded scenario

**Example: Water Collapse Mission**
```
┌─ Water Collapse Mission Workspace ─────────────────┐
│  ┌─ Live Telemetry ──────────────────────────────┐ │
│  │ • Dam levels (Climate & Water)                │ │
│  │ • Crop stress (Agriculture)                   │ │
│  │ • UGTT chatter (Social)                       │ │
│  │ • Black market prices (Informal)              │ │
│  └────────────────────────────────────────────────┘ │
│  ┌─ Shock Propagation ────────────────────────────┐ │
│  │ Water Cuts in Kairouan                        │ │
│  │   ↓ [+0.4] Social Grievance                   │ │
│  │   ↓ [+0.2] UGTT Mobilization                  │ │
│  │   ↓ [+0.3] Narrative Salience                 │ │
│  │   ↓ [+0.5] Cascade Risk                       │ │
│  │   ↓ [+0.18] RRI Delta                         │ │
│  └────────────────────────────────────────────────┘ │
│  ┌─ Mission RRI ──────────────────────────────────┐ │
│  │  Current: 0.62 | Mission: 0.80                │ │
│  └────────────────────────────────────────────────┘ │
│  [Open in Simulation Sandbox]                        │
└──────────────────────────────────────────────────────┘
```
