# TunisiaIntel — Brain Mode
## Design Specification v1.0

> *"The interface itself becomes part of the intelligence system."*

---

## 1. Overview

**Brain** is the fourth view mode in TunisiaIntel, joining **Professional**, **Tactical**, and **Bloomberg**.

Where the other modes present intelligence through structured dashboards, Brain mode presents Tunisia as a **living cognitive space** — a spatial, real-time, ambient visualization of the country's political, economic, and social nervous system.

The user does not read Tunisia's state. They *feel* it.

---

## 2. Philosophy

| Traditional Dashboard | Brain Mode |
|---|---|
| Static tables and charts | Living, breathing spatial system |
| User parses data | User perceives patterns instinctively |
| Information delivery | Cognitive immersion |
| Administrative interface | Command-center consciousness |
| Spreadsheet logic | Graph/node logic |

Your existing architecture — ministries, actors, shocks, SIR propagation, narrative clusters, elite networks, cascade equations — is already a graph. Brain mode simply makes that graph visible.

---

## 3. The Three Spaces

Brain mode contains three interchangeable 3D lenses. All draw from the same real-time data layer. Each answers a different spatial question.

---

### 3.1 Constellation — *Who connects to whom?*

A force-directed network floating in dark space.

**Visual Language:**
- **Nodes** = entities (ministries, governorates, opposition groups, media narratives, external actors, economic sectors)
- **Edges** = relationships (influence, conflict, funding, ideological alignment)
- **Node size** = salience / current relevance
- **Node color** = risk level (cool → hot)
- **Pulse speed** = instability velocity
- **Edge thickness** = influence strength
- **Particle storms** = shock propagation through the network
- **Orbital drift** = elite fragmentation or narrative convergence

**Behavior:**
- Nodes attract and repel based on relationship weights
- A shock in one node sends visible pulses along edges
- Clusters naturally form (e.g., "south Tunisia agricultural bloc", "coastal economic corridor")
- Selecting a node highlights its first and second-degree connections

**Use Case:**
> Detecting narrative convergence — opposition groups and media outlets suddenly clustering around a shared node indicates coordinated information warfare.

---

### 3.2 Projection — *What level is affected?*

A layered, concentric hierarchy stacked in 3D space — like the reference image's stacked rings.

**Layer Architecture:**

| Level | Z-Depth | Entity Types |
|---|---|---|
| **Layer 0 — Strategic** | Top | Country, presidency, foreign policy, IMF, EU |
| **Layer 1 — Sectoral** | Upper-mid | Ministries, economic sectors, regional blocs |
| **Layer 2 — Operational** | Lower-mid | Governorates, municipal councils, security zones |
| **Layer 3 — Tactical** | Bottom | Events, protests, actors, rumors, incidents |

**Visual Language:**
- Each layer is a translucent ring/plane
- Nodes sit on their appropriate layer
- Vertical lines connect related nodes across layers (e.g., a protest in Kairouan linked to the Ministry of Agriculture and the IMF negotiation node above)
- **Color intensity** on a layer = aggregate instability at that level
- **Vertical pulses** = cascade effects moving up or down the hierarchy

**Behavior:**
- Shocks typically originate in Layer 3 and propagate upward
- Policy decisions (Layer 0) send downward pressure waves
- A layer glowing intensely indicates systemic stress at that altitude

**Use Case:**
> A water crisis starts in Kairouan (Layer 3). You watch it climb: municipal pressure → governorate destabilization → agricultural ministry crisis → IMF loan conditionality breach (Layer 0). The vertical propagation is visible in real time.

---

### 3.3 Terrain — *Where does it move?*

Tunisia rendered as actual 3D terrain. Nodes pinned to real latitude/longitude. Shock waves propagate physically across the landscape.

**Visual Language:**
- **Base** = elevation-mapped Tunisia (Atlas mountains, Sahel coast, southern desert)
- **Nodes** = governorates, cities, border crossings, industrial zones
- **Node elevation** = current risk score (higher = more unstable)
- **Shock rings** = concentric circles expanding from an event location
- **Flow lines** = migration, smuggling, protest movement paths
- **Heat bloom** = narrative or anger intensity
- **Particle streams** = refugee flows, fuel convoys, information spread

**Behavior:**
- Events in one location send visible waves across the terrain
- Mountain ranges and distance naturally attenuate shock propagation
- Coastal nodes cluster; southern nodes are sparse and vulnerable
- Real weather overlays (drought, heat) can tint the terrain

**Use Case:**
> A fuel shortage hits Tataouine. You watch the shock wave move north along the coastal corridor, skipping the mountain interior, hitting Gabes and Sfax 48 hours later. The terrain itself explains the propagation pattern.

---

## 4. Cross-Space Mechanics

All three spaces share these ambient features:

### 4.1 Audio Briefing
- Morning and evening automated briefings in a calm, BBC-style voice
- Triggered by: schedule, emergency threshold breach, or user request
- Overlay: subtle waveform visualization on the active space during playback
- Content sourced directly from your existing AI brief generation pipeline

### 4.2 Simulation Overlay
- User adjusts a parameter ("fuel prices +20%", "internet shutdown", "elite defection begins")
- The active space visually mutates to show projected cascade paths
- Monte Carlo outputs drive the animation probabilities

### 4.3 Narrative Warfare Lens
- Toggle overlay showing narrative clusters as competing gravitational fields
- Opposition narratives vs. government narratives as orbital systems
- Rumor injection points as particle bursts
- Amplification pathways as glowing trails

### 4.4 Real-Time Sync
- All spaces pulse with live Supabase data
- A shock detected by your ingestion pipeline appears in Brain mode within seconds
- No manual refresh. The brain is always awake.

---

## 5. Interaction Model

```
┌─────────────────────────────────────────────┐
│  [Professional] [Tactical] [Bloomberg] [BRAIN] │  ← Mode switcher
├─────────────────────────────────────────────┤
│                                             │
│         ┌─────────────────────┐             │
│         │   [Constellation]   │             │
│         │   [Projection]      │  ← Space    │
│         │   [Terrain]         │    selector │
│         └─────────────────────┘             │
│                                             │
│              ╔═══════════════╗              │
│              ║   3D SPACE    ║              │
│              ║  (active)     ║              │
│              ╚═══════════════╝              │
│                                             │
│  [▶ Briefing]  [⚡ Simulate]  [? Narrative] │  ← Action bar
│                                             │
└─────────────────────────────────────────────┘
```

**Drill-Down:**
- Click any node in any space → slide-out panel with Professional/Tactical detail view
- Brain is the entry point. The other modes provide the forensic depth.

---

## 6. Data Mapping

Your existing entities map directly to Brain mode:

| Entity | Constellation | Projection | Terrain |
|---|---|---|---|
| Ministries | Node | Layer 1 | Tunis (pinned) |
| Governorates | Node | Layer 2 | Lat/Lng pin |
| Actors | Node | Layer 3 | Lat/Lng pin |
| Shocks | Pulse origin | Vertical pulse | Shock ring |
| Narratives | Cluster field | Layer 3 cloud | Regional tint |
| SIR spread | Edge infection | Layer propagation | Terrain wave |
| Elite networks | Dense subgraph | Layer 0-1 | Tunis-centric |
| Cascade equations | Animation driver | Vertical motion | Wave physics |
| RRI score | Node color | Layer glow | Elevation |
| Instability velocity | Pulse speed | Pulse frequency | Wave speed |

---

## 7. Technical Stack

| Component | Technology |
|---|---|
| 3D Renderer | React Three Fiber (Three.js) |
| Force Graph | D3-force or react-force-graph-3d |
| Terrain | Three.js plane geometry + heightmap |
| Animations | Framer Motion (UI), GSAP (timeline) |
| Particles | Three.js Points / custom GLSL shaders |
| Audio | Web Speech API (TTS) or ElevenLabs |
| Real-time | Supabase Realtime (existing) |
| State | Zustand or existing context |

**Performance Note:** Start with 2.5D (perspective 2D with depth) for Constellation and Projection. Full 3D terrain can be WebGL-instanced. Target 60fps on modern laptops.

---

## 8. Implementation Phases

### Phase 1 — Proof of Concept
- [ ] Create `/brain` route
- [ ] Implement Constellation with mock nodes (10-15 entities)
- [ ] Connect one live feed (governorate risk scores from Supabase)
- [ ] Add mode switcher to nav

### Phase 2 — Spatial Expansion
- [ ] Build Projection view with 4-layer hierarchy
- [ ] Build Terrain view with Tunisia base map
- [ ] Add space toggle selector
- [ ] Implement node selection → detail panel

### Phase 3 — Intelligence Layer
- [ ] Audio briefing integration (TTS pipeline)
- [ ] Simulation mode (Monte Carlo → visual mutation)
- [ ] Narrative warfare overlay
- [ ] Shock propagation animations

### Phase 4 — Polish
- [ ] GLSL shaders for glow, bloom, particle effects
- [ ] Performance optimization (LOD, culling)
- [ ] Mobile-responsive Brain mode (simplified 2D fallback)
- [ ] Onboarding: guided first launch through each space

---

## 9. Voice & Tone

Brain mode should feel:

- **Calm under pressure** — never frantic, even during high-risk events
- **Authoritative** — like a well-designed military command center
- **Alive** — subtle ambient motion even in stable periods
- **Cinematic** — dark palette, high contrast, purposeful color
- **Intelligent** — the system seems to know what matters before you do

**Color Palette:**
- Background: `#0a0a0f` (deep void)
- Stable nodes: `#3b82f6` (cool blue)
- Elevated risk: `#f59e0b` (amber)
- Critical: `#ef4444` (crimson)
- Narrative clusters: `#a855f7` (violet)
- Edges: `#1e293b` (subtle slate)
- Active pulses: `#ffffff` (white core with colored trail)

---

## 10. The Vision

You are not building a Tunisia news app.

You are building a **national cognitive operating system** — a second brain for understanding a country in motion.

Brain mode is where that ambition becomes tangible.

---

*Document version: 1.0*
*For: TunisiaIntel v2.0*
*Status: Design Specification / Ready for Implementation*
