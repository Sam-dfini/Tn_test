# 6. Component Specifications

## 6.1 StubPage (Reusable Placeholder)

**Purpose:** All `stub` and `planned` routes use this component. Creates illusion of completeness while engine is built.

**Props Interface:**
```typescript
interface StubPageProps {
  title: string;
  description: string;
  status: 'stub' | 'planned';
  involvedDomains?: string[];      // Tags showing which domains feed this module
  equations?: string[];            // Equations that will power this module
  preloadedPath?: string;          // Route to Simulation Sandbox with preset
  estimatedCompletion?: string;    // e.g., "Phase 2, Week 4"
}
```

**UI Structure:**
```
┌─ StubPage ─────────────────────────┐
│  [Construction Icon]                 │
│  Title                               │
│  Description                         │
│  ┌─ Domain Tags ──────────────────┐ │
│  │ [Economic] [Security] [Social] │ │
│  └─────────────────────────────────┘ │
│  Equations: EQ.13, EQ.17, EQ.19     │
│  ┌─ Actions ──────────────────────┐ │
│  │ [View System Topology]         │ │
│  │ [Open in Simulation Sandbox]   │ │
│  └─────────────────────────────────┘ │
│  Estimated: Phase 2, Week 4          │
└──────────────────────────────────────┘
```

## 6.2 Navigation Config (Single Source of Truth)

**File:** `src/config/navigation.ts`

**Schema:**
```typescript
export type BuildStatus = 'live' | 'stub' | 'planned';

export interface NavNode {
  id: string;
  label: string;
  path: string;
  status: BuildStatus;
  icon: string;                    // lucide-react icon name
  component?: string;             // React component name
  children?: NavNode[];

  // Intelligence metadata
  dataSources?: string[];         // e.g., ['supabase', 'rss', 'gemini']
  equations?: string[];           // e.g., ['EQ.13', 'EQ.17', 'EQ.19']
  feeds?: string[];               // e.g., ['events', 'economic', 'narrative']

  // Mission Control linkage
  missionContexts?: string[];     // e.g., ['food-security', 'elite-fracture']
}

export interface MissionNode extends NavNode {
  preloadedVariables: Record<string, number>;
  involvedDomains: string[];
  primaryEquation: string;
}
```

## 6.3 Alert Hub

**Schema:**
```typescript
interface Alert {
  id: string;
  timestamp: Date;
  severity: 'tactical' | 'operational' | 'strategic';
  source: string;                 // Which module generated this
  domain: string;                 // Economic, Security, Social, etc.
  title: string;
  description: string;
  affectedEquations: string[];    // Which equations this alert feeds
  rriDelta?: number;              // Estimated impact on RRI
  governorate?: string;           // Spatial scope
  status: 'active' | 'acknowledged' | 'resolved';
  deduplicationKey: string;     // For grouping related alerts
}
```

**Deduplication Logic:**
```
Same event type + same governorate + within 4 hours = same alert cluster
Show cluster count badge, expand for individual signals
```

**Escalation Rules:**
```
Tactical:    Single domain, localized, <0.1 RRI delta → Analyst feed
Operational: Multi-domain, regional, 0.1-0.3 RRI delta → Domain lead + Alert Hub
Strategic:   Systemic, national, >0.3 RRI delta → Executive briefing + Alert Hub pinned
```

## 6.4 Shock Propagation Engine

**Core Concept:** Every shock is a node in a directed acyclic graph (DAG) where:
- **Nodes** = Variables (e.g., `water_scarcity`, `social_grievance`, `ugtt_mobilization`)
- **Edges** = Causal relationships powered by equations
- **Weights** = Equation coefficients
- **Depth** = Time offset from shock origin

**Shock Schema:**
```typescript
interface Shock {
  id: string;
  type: 'event' | 'economic' | 'environmental' | 'narrative' | 'manual';
  source: string;                 // e.g., "Water Cuts in Kairouan"
  originGovernorate: string;
  timestamp: Date;
  variables: Record<string, number>;  // Initial variable adjustments
  propagationChain: PropagationNode[];
  finalRriDelta: number;
  confidence: number;
}

interface PropagationNode {
  step: number;
  variable: string;               // e.g., "social_grievance"
  delta: number;                  // e.g., +0.4
  equation: string;               // e.g., "EQ.7"
  governorate: string;            // Where this effect manifests
  timeOffset: number;             // Hours from shock origin
  children: PropagationNode[];    // Cascading effects
}
```

**Visualization Modes:**
1. **Vertical Flow:** Classic cascade diagram (shock → variable → variable → RRI)
2. **Graph Network:** Force-directed graph showing all affected nodes
3. **Governorate Map:** Choropleth showing spatial propagation over time
4. **Timeline:** Horizontal scroll showing shock evolution

**Modes:**
- **Live Mode:** Auto-populate from Events/RTEE feed. Real-time propagation.
- **Sandbox Mode:** Analyst adjusts sliders, observes hypothetical propagation.
- **Mission Mode:** Pre-loaded from Mission Control context.

## 6.5 Mission Control Workspace

**Layout:**
```
┌─ Mission: [Water Collapse] ────────────────────────┐
│  ┌─ Telemetry Panel (auto-assembled) ─────────────┐ │
│  │ [Widget from Climate & Water]                   │ │
│  │ [Widget from Agriculture]                       │ │
│  │ [Widget from Social Dynamics]                   │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─ Shock Propagation (live) ──────────────────────┐ │
│  │ [Vertical flow diagram]                         │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─ Mission RRI ───────────────────────────────────┐ │
│  │ Current vs. Mission-scenario RRI                │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─ Key Intelligence Questions ────────────────────┐ │
│  │ • Will UGTT mobilize?                           │ │
│  │ • Will black market prices spike?               │ │
│  └─────────────────────────────────────────────────┘ │
│  [Open in Simulation Sandbox]                          │
└────────────────────────────────────────────────────────┘
```

**Widget Assembly Rules:**
```typescript
const missionConfigs: Record<string, MissionConfig> = {
  'water-collapse': {
    widgets: [
      { source: 'climate-water', type: 'dam-levels', position: 'top-left' },
      { source: 'agriculture', type: 'crop-stress', position: 'top-right' },
      { source: 'social-dynamics', type: 'ugtt-chatter', position: 'middle-left' },
      { source: 'informal-economy', type: 'black-market-prices', position: 'middle-right' },
    ],
    preloadedVariables: {
      water_scarcity: 0.8,
      agricultural_yield: 0.3,
      social_grievance: 0.6,
    },
    primaryEquation: 'EQ.13',
  },
  // ... etc
};
```
