# TunisiaIntel v2.0 — Mode-Isolated Runtime Architecture

## The Problem

The previous `App.tsx` architecture suffered from **leaky initialization**:

- All heavy providers (`PipelineProvider`, `RSSProvider`, `AIAnalysisProvider`, `AgriIntelProvider`) were mounted at the **root level**, wrapping the entire application.
- Data fetching (`loadPipelineData`, RSS polling, notification triggers) fired on **app load**, not on **mode entry**.
- Switching between modes only swapped the visible UI layer; the heavy engine kept running in the background.
- This caused:
  - Wasted bandwidth and CPU on the selection screen.
  - Stale data bleeding between modes.
  - Background intervals accumulating every time a mode re-initialized.

---

## The Fix: Mode-Isolated Runtime

The new architecture introduces a **Mode Runtime boundary**. Heavy logic only exists when a mode is active, and is **completely destroyed** when you leave.

### Architecture Layers

```
┌─────────────────────────────────────────┐
│  APP (Root)                             │
│  • Auth check                           │
│  • Mode selection router                │
│  • Lightweight global overlays          │
│  • NotificationProvider (UI only)     │
│  • ObservabilityProvider (light)        │
└─────────────────────────────────────────┘
                    │
        mode === 'selection'
                    ↓
        ┌───────────────────┐
        │  ModeSelection UI │   ← No heavy providers. No polling.
        └───────────────────┘
                    │
        mode === 'professional' | 'tactical' | 'bloomberg' | 'brain' | ...
                    ↓
┌─────────────────────────────────────────┐
│  WRAPPED MODE RUNTIME (key={mode})      │
│  ┌─────────────────────────────────────┐│
│  │ PipelineProvider                    ││
│  │   └─ RSSProvider                    ││
│  │        └─ AIAnalysisProvider        ││
│  │             └─ AgriIntelProvider    ││
│  │                  └─ ModeRuntime     ││
│  │                       • Boot seq    ││
│  │                       • Data hooks  ││
│  │                       • Polling      ││
│  │                       • Mode UI    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## Core Components

### 1. `AppContent` — The Dumb Router

Responsibility: **Authenticate. Pick a mode. Render the shell.**

- Holds `mode` state (`'selection'` or a `ModeKey`).
- Does **not** hold any data state.
- Does **not** call any data hooks.
- Renders either `ModeSelection` or `WrappedModeRuntime`.

```tsx
// Simplified
{mode === 'selection'
  ? <ModeSelection onSelect={setMode} />
  : <WrappedModeRuntime key={mode} mode={mode} onGoHome={() => setMode('selection')} />
}
```

> **Why `key={mode}` matters:** React uses this to treat each mode switch as a **full unmount/remount** of the entire `WrappedModeRuntime` tree. When you switch from `tactical` → `bloomberg`, the tactical provider tree is destroyed and the bloomberg one is born fresh.

---

### 2. `WrappedModeRuntime` — The Provider Shell

Responsibility: **Mount the heavy providers only when needed.**

```tsx
const WrappedModeRuntime = ({ mode, onGoHome }) => (
  <PipelineProvider>          {/* Heavy: RRI engine, pipeline data */}
    <RSSProviderWrapper>      {/* Heavy: RSS polling, article cache */}
      <AIAnalysisProvider>    {/* Heavy: AI reasoning, briefs */}
        <AgriIntelProvider>   {/* Heavy: Agriculture data */}
          <ModeRuntime mode={mode} onGoHome={onGoHome} />
        </AgriIntelProvider>
      </AIAnalysisProvider>
    </RSSProviderWrapper>
  </PipelineProvider>
);
```

This component only renders when `mode !== 'selection'`. When the user clicks "Home", this entire branch unmounts, and **every provider's cleanup effects run**.

---

### 3. `ModeRuntime` — The Living Mode

Responsibility: **Boot the engine, fetch data, render the mode UI, manage mode-local overlays.**

This is where all the action happens:

| Concern | Implementation |
|---------|----------------|
| **Boot sequence** | `useEffect` runs once on mount, simulates loader logs, calls `loadPipelineData()` and `initializeVariables()`. |
| **Polling / streams** | `useNotificationTriggers()` is called here, not globally. It dies when the mode unmounts. |
| **Data access** | `usePipeline()`, `useEventsStore()`, `useRSS()` are consumed here. |
| **Overlays** | `showAIAnalyst`, `showPipeline`, `showReport`, etc. are local state. They reset on mode switch. |
| **Mode rendering** | A `switch` (or conditional blocks) renders the correct mode component (`TacticalDashboard`, `BloombergTerminal`, `BrainMode`, etc.). |

#### Boot Sequence (runs per mode entry)

```
LOADING_RRI_ENGINE_v4.2...
ESTABLISHING_SECURE_UPLINK... [OK]
DECRYPTING_INTELLIGENCE_LEDGER... [OK]
SYNCING_PREDICTIVE_MODEL_STATE... [OK]
CALIBRATING_RRI_THRESHOLD_MONITORS... [OK]
```

Each mode gets its own boot sequence. The loader blocks the mode UI until `progress === 100`.

---

## Data Flow

### Before (Leaky)

```
App mounts
  → Providers mount
    → RSS starts polling
    → Pipeline starts loading
    → Notifications start triggering
      → User sees selection screen (all this is happening in background)
        → User clicks "Tactical"
          → TacticalDashboard mounts (but data was already fetched 5s ago)
```

### After (Isolated)

```
App mounts
  → Auth check
    → Selection screen renders (zero heavy logic)
      → User clicks "Tactical"
        → WrappedModeRuntime mounts (key="tactical")
          → Providers mount
            → Boot sequence starts
              → TacticalDashboard renders after boot completes
                → User clicks "Bloomberg"
                  → WrappedModeRuntime unmounts (tactical tree destroyed)
                    → New WrappedModeRuntime mounts (key="bloomberg")
                      → Fresh boot sequence for Bloomberg
```

---

## Provider Placement Rules

| Provider | Level | Reason |
|----------|-------|--------|
| `ObservabilityProvider` | Root | Lightweight metrics; needed globally for debugging |
| `AIProvider_` | Root | Shared AI context (read-only config) |
| `AuditProvider` | Root | Action logging; always active |
| `NotificationProvider` | Root | Toast UI shell; lightweight |
| `AlertProvider` | Root | Global alert UI; lightweight |
| `PipelineProvider` | **Mode** | Heavy data fetching; mode-scoped |
| `RSSProvider` | **Mode** | Polling intervals; mode-scoped |
| `AIAnalysisProvider` | **Mode** | AI brief generation; mode-scoped |
| `AgriIntelProvider` | **Mode** | Agriculture data; mode-scoped |

---

## Why This Works

### 1. React Unmount Guarantees Cleanup

When `key={mode}` changes, React unmounts the old `WrappedModeRuntime`. Every `useEffect` cleanup function inside the provider tree runs:

```tsx
useEffect(() => {
  const interval = setInterval(fetchRSS, 5000);
  return () => clearInterval(interval); // ← This fires on mode switch
}, []);
```

### 2. No Stale Data Between Modes

Each mode gets a **fresh provider instance**. The Bloomberg mode does not inherit Tactical's cached RSS articles or RRI state. It boots clean.

### 3. Selection Screen Is Free

The landing screen (`ModeSelection`) has zero overhead. No polling, no engine initialization, no background CPU usage.

### 4. Predictable Memory Profile

Only one mode's worth of data exists in memory at any time. Switching modes is a **garbage collection event** for the previous mode's state.

---

## Migration Checklist

If you are updating existing mode components to fit this architecture:

1. **Remove global data initialization from `App.tsx`.**
   - Delete `useNotificationTriggers()` from the root.
   - Delete `loadPipelineData()` triggers tied to `mode` state.

2. **Move provider wrappers into `WrappedModeRuntime`.**
   - Any provider that fetches or polls belongs here.

3. **Ensure each mode component is pure UI.**
   - It should receive data via props or context.
   - It should not start its own `fetch()` on mount unless that fetch is mode-specific.

4. **Add `key={mode}` to the mode wrapper.**
   - This is the single most important line. Without it, React reuses the provider tree and stale state persists.

5. **Verify `useEffect` cleanups in your hooks.**
   - Any hook with `setInterval`, `EventSource`, `WebSocket`, or `supabase.channel().subscribe()` must return a cleanup function.

---

## Future Evolution

This architecture supports the long-term plan from the design doc:

- **Professional Mode** can later split into sub-modes (Governance, Simulation, Forecasting) by nesting another `WrappedModeRuntime` layer.
- **Brain Mode** can mount its own `CognitiveGraphProvider` without affecting other modes.
- **Background workers** can be attached to specific mode runtimes rather than the global scope.

The rule remains: **if it is heavy, it lives inside a mode. If it is light, it lives at the root.**

---

## Summary

| Before | After |
|--------|-------|
| All providers at root | Providers isolated per mode |
| Data fetches on app load | Data fetches on mode entry |
| Modes swap UI only | Modes swap entire runtime |
| Background leaks accumulate | Clean teardown on every switch |
| Selection screen carries overhead | Selection screen is zero-cost |

**The app is now a router. The modes are now self-contained runtimes.**
