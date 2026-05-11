# 8. Mission Control System

## 8.1 Mission Definitions

### Mission: Food Security Crisis
**Trigger Conditions:**
- BCI (Bread Crisis Index) > 0.7
- Wheat import dependency > 85%
- Subsidy burden > 15% of budget
- Black market flour price spike > 30%

**Involved Domains:**
- Agriculture (crop yields, BCI)
- Climate & Water (drought impact)
- Informal Economy (black market prices)
- Social Dynamics (UGTT mobilization)
- Narrative (food scarcity discourse)

**Pre-loaded Variables for Simulation:**
```typescript
{
  wheat_yield: 0.4,
  water_scarcity: 0.7,
  subsidy_burden: 0.8,
  black_market_premium: 0.6,
  ugt_mobilization: 0.5,
  narrative_salience: 0.6,
}
```

### Mission: Elite Fracture
**Trigger Conditions:**
- MII (Ministerial Instability Index) > 0.6
- Coalition fragmentation signal
- Elite network graph perturbation
- Brain/Mouth divergence detected

**Involved Domains:**
- Actor Network (influence mapping)
- Political (regime stability)
- Governance Matrix (MII)
- Societal Fracture (social contract)

### Mission: UGTT Escalation
**Trigger Conditions:**
- Strike frequency > historical +2σ
- UGTT narrative amplification detected
- Cascade probability > 0.5
- Governorate clustering in industrial zones

**Involved Domains:**
- Social Dynamics (labor metrics)
- Events (protest telemetry)
- Hotspot Clusters (geospatial)
- Narrative (UGTT discourse)
- Simulation (cascade model)

### Mission: Water Collapse
**Trigger Conditions:**
- Dam capacity < 30%
- Aquifer depletion rate > threshold
- Desalination capacity insufficient
- Agricultural water cuts announced

**Involved Domains:**
- Climate & Water (dam levels, aquifers)
- Agriculture (crop stress)
- Governorates (spatial risk)
- Social Dynamics (grievance)

### Mission: Border Instability
**Trigger Conditions:**
- Border interception spike
- Smuggling route activation
- Radicalisation gradient increase in border governorates
- Geopolitical tension (Libya/Algeria)

**Involved Domains:**
- Security & Borders
- Geopolitical
- Informal Economy (smuggling)
- Radicalisation

### Mission: Narrative War
**Trigger Conditions:**
- Disinformation velocity spike
- Narrative divergence > 0.5
- Cognitive warfare signal detected
- Foreign actor amplification

**Involved Domains:**
- Cognitive Warfare
- Narrative Intelligence
- Social Media Signals
- Political (regime narrative response)

## 8.2 Mission Lifecycle

```
DORMANT → MONITORING → ACTIVE → ESCALATING → CRITICAL → RESOLVED
   ↑___________________________________________________________↓
```

- **DORMANT:** Mission workspace exists but is collapsed in sidebar
- **MONITORING:** Telemetry widgets active, auto-refreshing
- **ACTIVE:** Shock propagation engine running for this mission
- **ESCALATING:** RRI delta > 0.2, alerts generated
- **CRITICAL:** RRI delta > 0.4, executive briefing triggered
- **RESOLVED:** Conditions normalize, mission archived
