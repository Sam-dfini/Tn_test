# 9. Shock Propagation Engine

## 9.1 Architecture

The Shock Propagation Engine is a **directed acyclic graph (DAG)** where:
- **Nodes** = Variables (e.g., `water_scarcity`, `social_grievance`, `ugtt_mobilization`)
- **Edges** = Causal relationships powered by equations
- **Weights** = Equation coefficients
- **Depth** = Time offset from shock origin

## 9.2 Example Propagation: Water Cuts in Kairouan

```
SHOCK ORIGIN: Water Cuts in Kairouan
  │
  ├─ [EQ.7: Resource Stress → Social Grievance]
  │     variable: social_grievance
  │     delta: +0.4
  │     time: +6 hours
  │     governorate: Kairouan
  │
  ├─ [EQ.3: Grievance → Mobilization]
  │     variable: ugtt_mobilization
  │     delta: +0.2
  │     time: +24 hours
  │     governorate: Kairouan → Sfax (spillover)
  │
  ├─ [EQ.19: Mobilization → Narrative Amplification]
  │     variable: narrative_salience
  │     delta: +0.3
  │     time: +48 hours
  │     governorate: National
  │
  ├─ [EQ.17: Multi-variable → Cascade Risk]
  │     variable: cascade_probability
  │     delta: +0.5
  │     time: +72 hours
  │     governorate: Multi-governorate
  │
  └─ [EQ.1: Aggregate → RRI]
        variable: rri
        delta: +0.18
        time: +96 hours
        governorate: National

FINAL OUTPUT:
  RRI: 0.62 → 0.80 (+0.18)
  Confidence: 0.73
  Primary Path: Water → Grievance → UGTT → Narrative → Cascade → RRI
```

## 9.3 Governorate Propagation

Shocks do not stay localized. They spread spatially based on:
- **Geographic adjacency** (neighbor governorates)
- **Economic connectivity** (supply chains, labor migration)
- **Narrative reach** (media coverage, social media)
- **Institutional similarity** (same ministry, same union local)

**Propagation Matrix:**
```typescript
interface GovernoratePropagation {
  from: string;           // Origin governorate
  to: string;             // Target governorate
  probability: number;      // Likelihood of spillover
  timeLag: number;        // Hours until effect manifests
  attenuation: number;    // 0-1, strength reduction
  channels: string[];     // e.g., ['labor_migration', 'media', 'supply_chain']
}
```

## 9.4 UI Specification

**Main View:**
```
┌─ Shock Propagation Engine ───────────────────────────┐
│  ┌─ Mode Selector ──────────────────────────────────┐ │
│  │ [Live] [Sandbox] [Mission: Water Collapse]        │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌─ Shock Input ─────────────────────────────────────┐ │
│  │ Event: Water Cuts in Kairouan                     │ │
│  │ Origin: Kairouan | Time: 2026-05-10 08:00         │ │
│  │ [Edit Variables]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌─ Propagation View ─────────────────────────────────┐ │
│  │                                                     │ │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐        │ │
│  │  │  Water  │───→│Grievance│───→│  UGTT   │        │ │
│  │  │  Cuts   │    │  +0.4   │    │  +0.2   │        │ │
│  │  └─────────┘    └─────────┘    └───┬─────┘        │ │
│  │                                      │             │ │
│  │  ┌─────────┐    ┌─────────┐    ┌───┴─────┐        │ │
│  │  │ Cascade │←───│Narrative│←───│Salience │        │ │
│  │  │  +0.5   │    │  +0.3   │    │  +0.3   │        │ │
│  │  └───┬─────┘    └─────────┘    └─────────┘        │ │
│  │       │                                             │ │
│  │  ┌────┴─────┐                                       │ │
│  │  │   RRI   │                                       │ │
│  │  │  +0.18  │                                       │ │
│  │  └─────────┘                                       │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─ Governorate Map ──────────────────────────────────┐ │
│  │ [Choropleth showing propagation over time]         │ │
│  │ [Timeline scrubber: Now → +96 hours]               │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─ Equation Details ─────────────────────────────────┐ │
│  │ Hover any arrow to see:                            │ │
│  │ • Equation ID and name                             │ │
│  │ • Input variables and values                       │ │
│  │ • Output variable and calculated delta             │ │
│  │ • Confidence interval                              │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```
