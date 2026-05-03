# Frontend Documentation: The Pulse

The TUNISIAINTEL frontend is a high-fidelity React interactive dashboard designed for political risk analysts.

## 🧱 Component Architecture

### 1. `App.tsx`: The Shell
- Root component managing high-level layout and navigation.
- Integrated with `PipelineContext` for real-time data flow.

### 2. `CivilizationalAnalysis.tsx`: Theoretical Frameworks
A container for different complex models. Managed via a tabbed interface:
- **Ideological Cycle**: Based on fragmentation vs. mobilization theory.
- **Civilizational Engine**: Implements the coupled oscillator model.

### 3. `MissionControl.tsx`: Orchestration View
- Real-time monitoring of the `MissionOrchestrator`'s internal steps.
- Displays detected signals and active missions.

### 4. `ActorNetwork.tsx`: Institutional Analysis
- Visualizes the relationship between elite cohesion and institutional strength.
- Tracks metrics like OCI (Opposition Cohesion Index).

---

## 🌊 Data Flow (Real-time)
1.  **Context**: `PipelineContext.tsx` provides the global state (Signals, Events, RRI).
2.  **WebSockets**: The app listens for `MISSION_STEP_UPDATE`, `ANOMALY_DETECTED`, and `RRI_UPDATED` events from the backend.
3.  **Hooks**: Custom hooks like `usePipeline()` allow components to react instantly to incoming intelligence data.

---

## 🎨 Design System
- **Tailwind CSS**: Utility-first styling with custom theme definitions for "Intel" colors (Cyan, Magenta, Gold).
- **Framer Motion**: Used for fluid state transitions, entrance animations, and micro-interactions.
- **Recharts**: Primary library for longitudinal time-series data (C(t) composite, RRI pulse).
- **Lucide React**: Unified icon set for consistent visual language.
