# Phase 8 — High Table Interface
## Strategic Deliberation UI — TunisiaIntel

**Version:** 1.0  
**Date:** 2026-05-21  
**Depends on:** All previous phases (1–7)

---

## What This Phase Builds

The High Table is the sovereign intelligence interface.

It is a dark strategic room where every actor at Tunisia's power center
sits around a virtual deliberation table. The system runs continuously.
When a chain activates or a simulation completes, the table responds
in real time — postures shift, coalitions form, decisions emerge.

This is not a dashboard. It is an operational intelligence theater.

---

## Design Philosophy

**Dark. Precise. Authoritative.**

- No gradients, no pastels, no consumer UI patterns
- Color carries meaning only: red = critical, amber = elevated,
  green = stable, purple = simulation mode
- Every pixel earns its place — if it does not carry intelligence,
  it does not exist
- Animations are functional — they communicate state change,
  not decoration
- Typography is monospace for data, serif for analysis,
  sans for navigation

**Reference aesthetics:**
- NORAD operations center
- Bloomberg terminal intelligence layer
- Palantir Gotham dark mode
- Not: Notion, Linear, Figma, any SaaS UI

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  COMMAND HEADER                                                      │
│  TunisiaIntel HIGH TABLE  |  STATE: ELEVATED  |  RRI: 2.14  | UTC  │
├───────────────┬─────────────────────────────┬───────────────────────┤
│               │                             │                       │
│  ACTOR        │   CIRCULAR TABLE            │  INTELLIGENCE         │
│  REGISTRY     │   (center)                  │  FEED                 │
│  (left panel) │                             │  (right panel)        │
│               │   Tunisia map at center     │                       │
│  11 actors    │   Actors around perimeter   │  Active chains        │
│  live stress  │   Live posture rings        │  Latest deliberation  │
│  posture      │   Coalition arcs            │  Simulation output    │
│  indicators   │   Signal lines              │  Doctrine citations   │
│               │                             │                       │
├───────────────┴─────────────────────────────┴───────────────────────┤
│  SCENARIO TERMINAL                                                   │
│  > Run scenario  |  Compare  |  Inject shock  |  History           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component: `HighTableRoom.tsx`

Root component. Full screen. Dark background `#080B0F`.

```tsx
// src/components/HighTable/HighTableRoom.tsx

export const HighTableRoom: React.FC = () => {
  const { snapshot } = usePipeline();
  const { latestSession } = useDeliberation();
  const { latestRun } = useSimulation();
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'simulation'>('live');

  return (
    <div className="high-table-room">
      <HighTableHeader snapshot={snapshot} mode={mode} />
      <div className="high-table-body">
        <ActorRegistry
          snapshot={snapshot}
          session={latestSession}
          onActorSelect={setSelectedActor}
        />
        <CircularTable
          snapshot={snapshot}
          session={latestSession}
          selectedActor={selectedActor}
          mode={mode}
        />
        <IntelligenceFeed
          session={latestSession}
          run={latestRun}
          selectedActor={selectedActor}
        />
      </div>
      <ScenarioTerminal
        onRun={(scenario) => { /* trigger simulation */ }}
        onModeSwitch={setMode}
      />
    </div>
  );
};
```

---

## Component: `CircularTable.tsx`

The centerpiece. SVG-based. Tunisia map at center.
Actors positioned around the perimeter in fixed seats.

### Actor seat positions (11 actors, clock positions)

```
        UGTT (12 o'clock)
    ARM           BCT
  (10)              (2)

INT                   DONOR
(9)                    (3)

  DZA               EU
  (8)              (4)

    LPR          UTICA
      (7)      (5)
        PPL (6 o'clock)
          PRES (center-bottom anchor)
```

PRES sits slightly inside the ring — presidency is the focal point,
not an equal peer.

### SVG structure

```tsx
// src/components/HighTable/CircularTable.tsx

const TABLE_RADIUS = 280;   // px from center
const CENTER_X = 400;
const CENTER_Y = 380;
const SVG_W = 800;
const SVG_H = 760;

// Actor seat angles (degrees from top, clockwise)
const ACTOR_SEATS: Record<string, number> = {
  UGTT:  0,
  ARM:   330,   // 10 o'clock = 330°
  BCT:   60,    // 2 o'clock
  INT:   270,   // 9 o'clock
  DONOR: 90,    // 3 o'clock
  DZA:   240,   // 8 o'clock
  EU:    120,   // 4 o'clock
  LPR:   210,   // 7 o'clock
  UTICA: 150,   // 5 o'clock
  PPL:   180,   // 6 o'clock
  PRES:  180,   // center-bottom (special case, inside ring)
};

export const CircularTable: React.FC<Props> = ({
  snapshot, session, selectedActor, mode
}) => {
  const actorPositions = useMemo(() =>
    computeActorPositions(TABLE_RADIUS, CENTER_X, CENTER_Y, ACTOR_SEATS),
    []
  );

  return (
    <div className="circular-table-container">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="circular-table-svg"
      >
        {/* Table ring */}
        <TableRing cx={CENTER_X} cy={CENTER_Y} r={TABLE_RADIUS} />

        {/* Tunisia map at center */}
        <TunisiaMapCenter
          cx={CENTER_X}
          cy={CENTER_Y}
          snapshot={snapshot}
          radius={160}
        />

        {/* Coalition arcs (behind actors) */}
        {session && (
          <CoalitionArcs
            session={session}
            positions={actorPositions}
            cx={CENTER_X}
            cy={CENTER_Y}
          />
        )}

        {/* Signal lines (active chains) */}
        <ChainSignalLines
          snapshot={snapshot}
          positions={actorPositions}
          cx={CENTER_X}
          cy={CENTER_Y}
        />

        {/* Actor nodes */}
        {Object.entries(actorPositions).map(([entityId, pos]) => (
          <ActorNode
            key={entityId}
            entityId={entityId}
            position={pos}
            snapshot={snapshot}
            session={session}
            isSelected={selectedActor === entityId}
            isPres={entityId === 'PRES'}
            onClick={() => onActorSelect(entityId)}
          />
        ))}

        {/* RRI pulse at center */}
        <RRIPulse
          cx={CENTER_X}
          cy={CENTER_Y}
          rri={snapshot?.rri}
          pRevolution={snapshot?.p_revolution}
        />
      </svg>
    </div>
  );
};
```

---

## Component: `ActorNode.tsx`

Each actor is a layered SVG node.

```
┌─────────────────────────────┐
│  Outer stress ring          │  ← animated, color = posture
│  ┌───────────────────────┐  │
│  │  Actor avatar circle  │  │  ← entity icon or initials
│  │  ┌─────────────────┐  │  │
│  │  │  Posture dot    │  │  │  ← live posture indicator
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
│  Actor label below          │
│  Confidence score           │
└─────────────────────────────┘
```

```tsx
// src/components/HighTable/ActorNode.tsx

const POSTURE_COLORS: Record<string, string> = {
  passive:      '#4A5568',   // dark gray
  defensive:    '#D97706',   // amber
  aggressive:   '#DC2626',   // red
  negotiating:  '#2563EB',   // blue
  collapsing:   '#7C3AED',   // purple — terminal signal
};

const POSTURE_PULSE: Record<string, boolean> = {
  aggressive: true,
  collapsing: true,
};

export const ActorNode: React.FC<ActorNodeProps> = ({
  entityId, position, snapshot, session,
  isSelected, isPres, onClick
}) => {
  const posture = snapshot?.actor_postures?.find(
    p => p.actor_id === entityId
  );
  const stress = posture?.stress_level ?? 0.5;
  const postureLabel = posture?.posture ?? 'passive';
  const color = POSTURE_COLORS[postureLabel];

  // Is this actor in the dominant coalition?
  const inCoalition = session?.dominant_coalition?.includes(entityId);
  const isDissenting = session?.dissenting_actors?.includes(entityId);
  const isVetoing = session?.veto_actor === entityId;

  const nodeR = isPres ? 32 : 24;
  const ringR = nodeR + 8;
  const stressRingR = ringR + (stress * 10);  // ring grows with stress

  return (
    <g
      className={`actor-node ${isSelected ? 'selected' : ''}`}
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Stress ring — animated */}
      <circle
        r={stressRingR}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={isVetoing ? "4 2" : "none"}
        opacity={0.4}
        className={POSTURE_PULSE[postureLabel] ? 'pulse-ring' : ''}
      />

      {/* Veto indicator — red outer ring */}
      {isVetoing && (
        <circle
          r={stressRingR + 6}
          fill="none"
          stroke="#DC2626"
          strokeWidth={3}
          strokeDasharray="6 3"
          opacity={0.8}
          className="pulse-ring"
        />
      )}

      {/* Coalition arc indicator */}
      {inCoalition && (
        <circle r={ringR + 2} fill="none"
          stroke="#10B981" strokeWidth={2} opacity={0.7} />
      )}
      {isDissenting && (
        <circle r={ringR + 2} fill="none"
          stroke="#F59E0B" strokeWidth={2}
          strokeDasharray="3 3" opacity={0.7} />
      )}

      {/* Main avatar circle */}
      <circle
        r={nodeR}
        fill="#111827"
        stroke={color}
        strokeWidth={isPres ? 3 : 2}
      />

      {/* Actor initials */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={isPres ? 13 : 10}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {entityId}
      </text>

      {/* Posture label below */}
      <text
        y={nodeR + 14}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize={8}
        fontFamily="monospace"
      >
        {postureLabel.toUpperCase()}
      </text>

      {/* Stress score */}
      <text
        y={nodeR + 24}
        textAnchor="middle"
        fill={color}
        fontSize={8}
        fontFamily="monospace"
      >
        {(stress * 100).toFixed(0)}%
      </text>
    </g>
  );
};
```

---

## Component: `CoalitionArcs.tsx`

Draws arcs between actors in the same coalition.
Dominant coalition: solid green arc.
Dissenting coalition: dashed amber arc.
Conflict pair: red line with tension indicator.

```tsx
// src/components/HighTable/CoalitionArcs.tsx

export const CoalitionArcs: React.FC<Props> = ({
  session, positions, cx, cy
}) => {
  if (!session) return null;

  const dominant = session.dominant_coalition ?? [];
  const dissenting = session.dissenting_actors ?? [];

  return (
    <g className="coalition-arcs">

      {/* Dominant coalition arcs */}
      {dominant.length > 1 && dominant.map((actorA, i) =>
        dominant.slice(i + 1).map(actorB => {
          const posA = positions[actorA];
          const posB = positions[actorB];
          if (!posA || !posB) return null;

          return (
            <path
              key={`${actorA}-${actorB}`}
              d={buildArc(posA, posB, cx, cy)}
              fill="none"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          );
        })
      )}

      {/* Conflict lines */}
      {Object.values(session.conflict_map ?? {}).map((conflict: any) => {
        const posA = positions[conflict.actor_a];
        const posB = positions[conflict.actor_b];
        if (!posA || !posB) return null;

        return (
          <line
            key={`conflict-${conflict.actor_a}-${conflict.actor_b}`}
            x1={posA.x} y1={posA.y}
            x2={posB.x} y2={posB.y}
            stroke="#DC2626"
            strokeWidth={1}
            strokeDasharray="4 2"
            strokeOpacity={0.4 + conflict.severity * 0.4}
          />
        );
      })}
    </g>
  );
};

// Build a curved arc between two points, curving around the center
function buildArc(
  posA: {x: number, y: number},
  posB: {x: number, y: number},
  cx: number, cy: number
): string {
  const mx = (posA.x + posB.x) / 2;
  const my = (posA.y + posB.y) / 2;
  // Control point pulled toward center
  const cpx = mx + (cx - mx) * 0.3;
  const cpy = my + (cy - my) * 0.3;
  return `M ${posA.x} ${posA.y} Q ${cpx} ${cpy} ${posB.x} ${posB.y}`;
}
```

---

## Component: `ChainSignalLines.tsx`

Draws animated signal lines from the Tunisia map center
to affected actor nodes when causal chains are active.

```tsx
// src/components/HighTable/ChainSignalLines.tsx

// Chain → which actors it activates
const CHAIN_ACTOR_MAP: Record<string, string[]> = {
  'CHAIN-01': ['UGTT', 'INT', 'PPL', 'PRES'],
  'CHAIN-02': ['INT', 'BCT', 'DONOR', 'DZA'],
  'CHAIN-03': ['PRES', 'ARM', 'LPR', 'EU'],
  'CHAIN-04': ['BCT', 'DONOR', 'PRES', 'EU'],
  'CHAIN-06': ['UGTT', 'PRES', 'INT', 'UTICA'],
  'CHAIN-09': ['DONOR', 'BCT', 'PRES', 'UGTT'],
  'CHAIN-11': ['ARM', 'PRES', 'EU', 'LPR'],
};

const CHAIN_COLORS: Record<string, string> = {
  'CHAIN-01': '#F59E0B',   // amber — food
  'CHAIN-02': '#EF4444',   // red — phosphate/revenue
  'CHAIN-03': '#8B5CF6',   // purple — elite fracture
  'CHAIN-04': '#3B82F6',   // blue — FX/economic
  'CHAIN-06': '#10B981',   // green — UGTT
  'CHAIN-09': '#F97316',   // orange — IMF
  'CHAIN-11': '#DC2626',   // deep red — terminal
};

export const ChainSignalLines: React.FC<Props> = ({
  snapshot, positions, cx, cy
}) => {
  const activeChains = snapshot?.active_shocks
    ?.map((s: any) => s.chain_id)
    .filter(Boolean) ?? [];

  return (
    <g className="chain-signal-lines">
      {activeChains.map(chainId => {
        const actors = CHAIN_ACTOR_MAP[chainId] ?? [];
        const color = CHAIN_COLORS[chainId] ?? '#6B7280';

        return actors.map(actorId => {
          const pos = positions[actorId];
          if (!pos) return null;

          return (
            <line
              key={`${chainId}-${actorId}`}
              x1={cx} y1={cy}
              x2={pos.x} y2={pos.y}
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0.3}
              strokeDasharray="3 6"
              className="chain-signal-animated"
            />
          );
        });
      })}
    </g>
  );
};
```

---

## Component: `TunisiaMapCenter.tsx`

Mini Tunisia SVG map rendered at the center of the table.
Governorates colored by RRI stress. Pulsing on chain activation.

```tsx
// src/components/HighTable/TunisiaMapCenter.tsx

export const TunisiaMapCenter: React.FC<Props> = ({
  cx, cy, snapshot, radius
}) => {
  const govVectors = snapshot?.governorate_vectors ?? [];

  const getGovColor = (govId: string): string => {
    const gov = govVectors.find((g: any) => g.gov_id === govId);
    const stress = gov?.stress ?? 0;
    if (stress >= 0.75) return '#DC2626';
    if (stress >= 0.50) return '#F59E0B';
    if (stress >= 0.25) return '#10B981';
    return '#1F2937';
  };

  // Clip map to circle
  const clipId = 'tunisia-map-clip';

  return (
    <g transform={`translate(${cx - radius}, ${cy - radius})`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={radius} cy={radius} r={radius - 4} />
        </clipPath>
      </defs>

      {/* Map background */}
      <circle
        cx={radius} cy={radius} r={radius - 4}
        fill="#0D1117" stroke="#1F2937" strokeWidth={1}
      />

      {/* Tunisia governorate paths — clipped to circle */}
      <g clipPath={`url(#${clipId})`}>
        <TunisiaGeoJSON
          scale={radius * 1.8}
          getColor={getGovColor}
        />
      </g>

      {/* RRI value overlay */}
      <text
        x={radius} y={radius - 10}
        textAnchor="middle"
        fill="#F9FAFB"
        fontSize={22}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {snapshot?.rri?.toFixed(2) ?? '—'}
      </text>
      <text
        x={radius} y={radius + 12}
        textAnchor="middle"
        fill="#6B7280"
        fontSize={9}
        fontFamily="monospace"
      >
        RRI
      </text>

      {/* P(Revolution) */}
      <text
        x={radius} y={radius + 28}
        textAnchor="middle"
        fill={snapshot?.p_revolution > 0.45 ? '#DC2626' : '#9CA3AF'}
        fontSize={11}
        fontFamily="monospace"
      >
        P(rev) {((snapshot?.p_revolution ?? 0) * 100).toFixed(1)}%
      </text>
    </g>
  );
};
```

---

## Component: `RRIPulse.tsx`

Concentric pulse rings emanating from center.
Pulse frequency and intensity proportional to RRI.

```tsx
// src/components/HighTable/RRIPulse.tsx

export const RRIPulse: React.FC<Props> = ({ cx, cy, rri, pRevolution }) => {
  const intensity = Math.min(1, (rri ?? 0) / 3.0);
  const isTerminal = pRevolution > 0.55;

  return (
    <g className="rri-pulse">
      {[1, 2, 3].map(ring => (
        <circle
          key={ring}
          cx={cx}
          cy={cy}
          r={160 + ring * 30}
          fill="none"
          stroke={isTerminal ? '#DC2626' : '#374151'}
          strokeWidth={0.5}
          opacity={intensity * (0.4 - ring * 0.1)}
          className={`pulse-ring-${ring}`}
          style={{
            animationDuration: `${3 + ring}s`,
            animationDelay: `${ring * 0.8}s`
          }}
        />
      ))}
    </g>
  );
};
```

---

## Component: `ActorRegistry.tsx`

Left panel. Compact list of all 11 actors with live indicators.

```tsx
// src/components/HighTable/ActorRegistry.tsx

// One row per actor:
// [color dot] [initials] [actor name]     [posture badge] [stress bar]

export const ActorRegistry: React.FC<Props> = ({
  snapshot, session, onActorSelect
}) => {
  const postures = snapshot?.actor_postures ?? [];

  return (
    <div className="actor-registry">
      <div className="registry-header">
        <span>HIGH TABLE</span>
        <span className="registry-count">
          {postures.length} ACTORS
        </span>
      </div>

      {ACTOR_ORDER.map(entityId => {
        const posture = postures.find(p => p.actor_id === entityId);
        const inCoalition = session?.dominant_coalition?.includes(entityId);
        const isDissenting = session?.dissenting_actors?.includes(entityId);
        const isVetoing = session?.veto_actor === entityId;

        return (
          <div
            key={entityId}
            className={`registry-row
              ${inCoalition ? 'coalition' : ''}
              ${isDissenting ? 'dissenting' : ''}
              ${isVetoing ? 'vetoing' : ''}`}
            onClick={() => onActorSelect(entityId)}
          >
            <div
              className="posture-dot"
              style={{ background: POSTURE_COLORS[posture?.posture ?? 'passive'] }}
            />
            <span className="entity-id">{entityId}</span>
            <span className="actor-name">
              {ACTOR_NAMES[entityId]}
            </span>
            <span className="posture-badge">
              {isVetoing ? 'VETO' : (posture?.posture ?? 'passive').toUpperCase()}
            </span>
            <div className="stress-bar">
              <div
                className="stress-fill"
                style={{
                  width: `${(posture?.stress_level ?? 0) * 100}%`,
                  background: POSTURE_COLORS[posture?.posture ?? 'passive']
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Deliberation summary */}
      {session && (
        <div className="deliberation-summary">
          <div className="summary-header">LAST DELIBERATION</div>
          <div className="resolution-type">
            {session.resolution_type?.toUpperCase()}
          </div>
          <div className="confidence-score">
            CONFIDENCE {((session.confidence ?? 0) * 100).toFixed(0)}%
          </div>
          {session.veto_actor && (
            <div className="veto-alert">
              ⚠ VETO: {session.veto_actor}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## Component: `IntelligenceFeed.tsx`

Right panel. Live intelligence stream feeding the table.

```tsx
// src/components/HighTable/IntelligenceFeed.tsx

// Sections (collapsible):
// 1. ACTIVE CHAINS
// 2. LATEST DELIBERATION (actor positions)
// 3. SIMULATION OUTPUT (if run exists)
// 4. DOCTRINE CITATIONS

export const IntelligenceFeed: React.FC<Props> = ({
  session, run, selectedActor
}) => {
  return (
    <div className="intelligence-feed">

      {/* Active chains */}
      <FeedSection title="ACTIVE CHAINS">
        {session?.activated_chain_ids?.map(chainId => (
          <ChainCard key={chainId} chainId={chainId} />
        ))}
      </FeedSection>

      {/* Actor detail (when selected) */}
      {selectedActor && session && (
        <FeedSection title={`${selectedActor} POSITION`}>
          <ActorPositionDetail
            entityId={selectedActor}
            session={session}
          />
        </FeedSection>
      )}

      {/* Simulation output */}
      {run && run.status === 'complete' && (
        <FeedSection title="SIMULATION OUTPUT">
          <SimulationSummaryCard run={run} />
        </FeedSection>
      )}

      {/* Historical analogue */}
      {session?.historical_analogue && (
        <FeedSection title="HISTORICAL ANALOGUE">
          <AnalogueBadge
            event={session.historical_analogue}
            similarity={session.analogue_similarity}
          />
        </FeedSection>
      )}

    </div>
  );
};
```

---

## Component: `ScenarioTerminal.tsx`

Bottom bar. Command-line style scenario input.

```tsx
// src/components/HighTable/ScenarioTerminal.tsx

export const ScenarioTerminal: React.FC<Props> = ({ onRun, onModeSwitch }) => {
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="scenario-terminal">
      <span className="terminal-prompt">SCENARIO ›</span>

      {/* Quick scenario buttons */}
      <div className="quick-scenarios">
        {QUICK_SCENARIOS.map(s => (
          <button
            key={s.id}
            className="quick-btn"
            onClick={() => onRun(s)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <input
        className="terminal-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Describe scenario or inject shock..."
        onKeyDown={e => e.key === 'Enter' && handleRun()}
      />

      <button
        className={`run-btn ${isRunning ? 'running' : ''}`}
        onClick={handleRun}
        disabled={isRunning}
      >
        {isRunning ? 'RUNNING' : 'RUN'}
      </button>

      <button
        className="mode-btn"
        onClick={() => onModeSwitch(mode === 'live' ? 'simulation' : 'live')}
      >
        {mode === 'live' ? 'SIMULATION MODE' : 'LIVE MODE'}
      </button>
    </div>
  );
};

const QUICK_SCENARIOS = [
  { id: 'SCN-E01', label: 'Subsidy Removal' },
  { id: 'SCN-C01', label: 'Perfect Storm' },
  { id: 'SCN-C02', label: 'Regime Threshold' },
  { id: 'SCN-B01', label: 'Black Swan' },
];
```

---

## CSS Architecture

```css
/* src/components/HighTable/HighTable.css */

.high-table-room {
  width: 100%;
  height: 100vh;
  background: #080B0F;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #F9FAFB;
  overflow: hidden;
}

.high-table-body {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr 300px;
  gap: 0;
  overflow: hidden;
}

/* Actor registry */
.actor-registry {
  background: #0D1117;
  border-right: 1px solid #1F2937;
  padding: 16px 12px;
  overflow-y: auto;
}

.registry-row {
  display: grid;
  grid-template-columns: 8px 36px 1fr auto 60px;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
}
.registry-row:hover { background: #161B22; }
.registry-row.vetoing { border-left: 2px solid #DC2626; }
.registry-row.coalition { border-left: 2px solid #10B981; }

.stress-bar {
  width: 60px;
  height: 3px;
  background: #1F2937;
  border-radius: 2px;
}
.stress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* Circular table */
.circular-table-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #080B0F;
  position: relative;
}

.circular-table-svg {
  width: 100%;
  height: 100%;
  max-height: 100%;
}

/* Actor node */
.actor-node {
  transition: transform 0.2s ease;
}
.actor-node:hover { transform: scale(1.1); }
.actor-node.selected circle { stroke-width: 3; }

/* Pulse animations */
@keyframes pulse-ring {
  0%   { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0;   transform: scale(1.4); }
}
.pulse-ring {
  animation: pulse-ring 2s ease-out infinite;
}

/* Chain signal lines */
@keyframes signal-flow {
  0%   { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -18; }
}
.chain-signal-animated {
  animation: signal-flow 1.5s linear infinite;
}

/* Intelligence feed */
.intelligence-feed {
  background: #0D1117;
  border-left: 1px solid #1F2937;
  padding: 16px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feed-section-title {
  font-size: 9px;
  letter-spacing: 0.15em;
  color: #4B5563;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #1F2937;
}

/* Scenario terminal */
.scenario-terminal {
  background: #0D1117;
  border-top: 1px solid #1F2937;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
}

.terminal-prompt {
  color: #10B981;
  font-size: 11px;
  white-space: nowrap;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid #374151;
  color: #F9FAFB;
  font-family: monospace;
  font-size: 12px;
  padding: 4px 0;
  outline: none;
}

.run-btn {
  background: #DC2626;
  color: white;
  border: none;
  padding: 6px 16px;
  font-family: monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  cursor: pointer;
  border-radius: 2px;
}
.run-btn.running {
  background: #374151;
  cursor: not-allowed;
}

.mode-btn {
  background: transparent;
  border: 1px solid #374151;
  color: #9CA3AF;
  padding: 6px 12px;
  font-family: monospace;
  font-size: 10px;
  cursor: pointer;
  border-radius: 2px;
}
```

---

## Hooks

```tsx
// src/hooks/useDeliberation.ts
export const useDeliberation = () => {
  const [latestSession, setLatestSession] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Initial load
    fetch('/api/deliberation/sessions/latest')
      .then(r => r.json())
      .then(setLatestSession);

    // Listen for new sessions
    const handler = async () => {
      const res = await fetch('/api/deliberation/sessions/latest');
      setLatestSession(await res.json());
    };
    window.addEventListener('ti:DELIBERATION_COMPLETE', handler);
    return () => window.removeEventListener('ti:DELIBERATION_COMPLETE', handler);
  }, []);

  return { latestSession, sessions };
};

// src/hooks/useSimulation.ts
export const useSimulation = () => {
  const [latestRun, setLatestRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runScenario = async (scenarioId: string, customScenario?: any) => {
    setIsRunning(true);
    const res = await fetch('/api/simulation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, ...customScenario })
    });
    const { run_id } = await res.json();
    return run_id;
  };

  useEffect(() => {
    const handler = async (e: any) => {
      const { run_id } = e.detail;
      const res = await fetch(`/api/simulation/runs/${run_id}`);
      setLatestRun(await res.json());
      setIsRunning(false);
    };
    window.addEventListener('ti:SIMULATION_COMPLETE', handler);
    return () => window.removeEventListener('ti:SIMULATION_COMPLETE', handler);
  }, []);

  return { latestRun, isRunning, runScenario };
};
```

---

## Sidebar Wiring

Add to existing sidebar under the appropriate category:

```tsx
// Two-line addition to sidebar config

{
  id: 'high-table',
  label: 'High Table',
  icon: 'CircleDot',          // or Shield, Crown
  component: HighTableRoom,
  category: 'simulation',
  truthClass: 'REAL'
}
```

---

## Implementation Order

```
1. HighTable/ folder structure                              → 15 min
2. CSS architecture + design tokens                        → 1 hr
3. CircularTable.tsx — SVG ring + actor positions          → 2 hrs
4. ActorNode.tsx — posture rings + coalition indicators    → 1 hr
5. TunisiaMapCenter.tsx — mini map at center              → 1 hr
6. CoalitionArcs.tsx + ChainSignalLines.tsx               → 1 hr
7. RRIPulse.tsx                                            → 30 min
8. ActorRegistry.tsx — left panel                         → 1 hr
9. IntelligenceFeed.tsx — right panel                     → 1 hr
10. ScenarioTerminal.tsx — bottom bar                     → 1 hr
11. useDeliberation + useSimulation hooks                 → 1 hr
12. HighTableRoom.tsx — root assembly                     → 30 min
13. Sidebar wiring (two lines)                            → 15 min
14. Live test: deliberation auto-updates table            → 1 hr
```

Total: ~2 days.

---

## Validation Tests

```
Test 1: Actor postures render from live snapshot
  Expected: all 11 actors visible, stress rings colored by posture
  ARM should show defensive amber, BCT shows blue technocratic

Test 2: Coalition arcs appear after deliberation
  Trigger deliberation via terminal
  Expected: green arcs between dominant coalition members
  Red dashed lines between conflicting pairs

Test 3: Chain signal lines activate
  Manually breach CHAIN-01 threshold
  Expected: amber signal lines from center to UGTT, INT, PPL, PRES

Test 4: Simulation mode
  Run SCN-E01 from terminal
  Expected: mode switches to purple SIMULATION badge
  RRI trajectory appears in intelligence feed
  Actor postures update to reflect simulated state

Test 5: Actor selection
  Click ARM node
  Expected: ARM position detail appears in right feed panel
  ARM seat highlighted in registry
```

---

## What Phase 8 Completes

With Phase 8 live, the full system is operational:

- **Phase 1:** One truth → canonical state
- **Phase 2:** Causal chains → why things escalate
- **Phase 3:** Memory → what happened
- **Phase 4:** Actor models → who does what
- **Phase 5:** Doctrine → why patterns repeat
- **Phase 6:** Deliberation → what the table decides
- **Phase 7:** Simulation → what happens next
- **Phase 8:** High Table → the sovereign interface

An analyst sits at this interface. A chain activates.
The table responds. Actors shift posture. Coalitions form.
A decision probability emerges — grounded in equations,
historical memory, and institutional doctrine.

That is the sovereign intelligence cognition system.

---

*High Table Interface v1.0 — 2026-05-21*
