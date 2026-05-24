import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TunisiaMapCenter } from './TunisiaMapCenter';
import { CoalitionArcs } from './CoalitionArcs';
import { ChainSignalLines } from './ChainSignalLines';
import { ActorNode } from './ActorNode';
import { RRIPulse } from './RRIPulse';
import { VetoLine } from './VetoLine';
import { DecisionFlowArrows } from './DecisionFlowArrows';
import { InterventionOverlay } from './InterventionOverlay';

// ── Concentric ring configuration ────────────────────────────────────────────
export const RING_CONFIG = {
  core: {
    radius: 68,
    label: 'CARTHAGE ECHELON',
    color: '#7C3AED',
    strokeWidth: 2,
    actors: ['PRES'],
  },
  ring1: {
    radius: 145,
    label: 'SECURITY COUNCIL',
    color: '#DC2626',
    strokeWidth: 1.5,
    actors: ['ARM', 'INT'],
  },
  ring2: {
    radius: 225,
    label: 'ECONOMIC COUNCIL',
    color: '#2563EB',
    strokeWidth: 1.5,
    actors: ['BCT', 'UTICA', 'DONOR'],
  },
  ring3: {
    radius: 310,
    label: 'CIVIL-POLITICAL',
    color: '#D97706',
    strokeWidth: 1,
    actors: ['UGTT', 'LPR', 'LTDH', 'PPL'],
  },
  ring4: {
    radius: 395,
    label: 'EXTERNAL POWERS',
    color: '#4B5563',
    strokeWidth: 1,
    actors: ['EU', 'DZA', 'KSA', 'USA'],
  },
} as const;

type RingKey = keyof typeof RING_CONFIG;

const CENTER_X = 500;
const CENTER_Y = 500;
const SVG_W = 1000;
const SVG_H = 1000;
const INTRO_MS = 3200;
const ORBIT_SPEED = 0.22; // degrees per frame ≈ 13°/sec
const RING_ORDER: RingKey[] = ['core', 'ring1', 'ring2', 'ring3', 'ring4'];

// ── Position computation ──────────────────────────────────────────────────────
type ActorMeta = { x: number; y: number; ring: RingKey; ringColor: string; ringRadius: number; baseAngle: number };

function computeRingPositions(): Record<string, ActorMeta> {
  const positions: Record<string, ActorMeta> = {};
  const RING_START_ANGLES: Record<string, number> = {
    core: 0, ring1: -90, ring2: -60, ring3: -80, ring4: -70,
  };
  for (const [ringKey, ring] of Object.entries(RING_CONFIG)) {
    const count = ring.actors.length;
    const startAngle = RING_START_ANGLES[ringKey] ?? -90;
    ring.actors.forEach((actorId, i) => {
      const angle = count === 1 ? startAngle : startAngle + (360 / count) * i;
      const rad = (angle * Math.PI) / 180;
      positions[actorId] = {
        x: CENTER_X + ring.radius * Math.cos(rad),
        y: CENTER_Y + ring.radius * Math.sin(rad),
        ring: ringKey as RingKey,
        ringColor: ring.color,
        ringRadius: ring.radius,
        baseAngle: angle,
      };
    });
  }
  return positions;
}

// Bottom-inside arc for ring labels — text reads left→right along inner bottom of ring
function ringLabelBottomPath(r: number, sweepDeg = 140): string {
  const half = (sweepDeg / 2) * (Math.PI / 180);
  // Bottom-left start: 90° + half, going counterclockwise to bottom-right: 90° - half
  const s = Math.PI / 2 + half;
  const e = Math.PI / 2 - half;
  const x1 = CENTER_X + r * Math.cos(s);
  const y1 = CENTER_Y + r * Math.sin(s);
  const x2 = CENTER_X + r * Math.cos(e);
  const y2 = CENTER_Y + r * Math.sin(e);
  // sweep-flag=0 (counterclockwise) traces the bottom arc from left to right
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Snapshot {
  rri?: number;
  p_revolution?: number;
  governorate_vectors?: any[];
  actor_postures?: any[];
  active_shocks?: any[];
  state_phase?: string;
}
interface Session {
  dominant_coalition?: string[];
  dissenting_actors?: string[];
  veto_actor?: string;
  conflict_map?: Record<string, any>;
  resolution_type?: string;
}
interface Props {
  snapshot?: Snapshot;
  session?: Session;
  selectedActor?: string | null;
  mode: 'live' | 'simulation';
  introActive?: boolean;
  interventionRun?: any;
  onActorSelect: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export const CircularTable: React.FC<Props> = ({
  snapshot, session, selectedActor, mode, introActive,
  interventionRun, onActorSelect,
}) => {
  const [introProgress, setIntroProgress] = useState(introActive ? 0 : 1);
  const [orbitingRing, setOrbitingRing] = useState<RingKey | null>(null);
  const [orbitOffsets, setOrbitOffsets] = useState<Record<string, number>>({});
  const orbitRafRef = useRef<number>(0);
  const orbitRef = useRef<Record<string, number>>({});

  // ── Intro animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!introActive) { setIntroProgress(1); return; }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / INTRO_MS);
      setIntroProgress(easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    setIntroProgress(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [introActive]);

  // ── Click-orbit loop ───────────────────────────────────────────────────
  useEffect(() => {
    if (!orbitingRing) {
      cancelAnimationFrame(orbitRafRef.current);
      return;
    }
    const animate = () => {
      const next = { ...orbitRef.current };
      next[orbitingRing] = (next[orbitingRing] || 0) + ORBIT_SPEED;
      orbitRef.current = next;
      setOrbitOffsets(next);
      orbitRafRef.current = requestAnimationFrame(animate);
    };
    orbitRafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(orbitRafRef.current);
  }, [orbitingRing]);

  const finalPositions = useMemo(() => computeRingPositions(), []);

  // ── Display positions: intro + click-orbit combined ────────────────────
  const displayPositions = useMemo<Record<string, ActorMeta>>(() => {
    const p = Math.max(0, Math.min(1, introProgress));
    const out: Record<string, ActorMeta> = {};

    for (const [actorId, final] of Object.entries(finalPositions)) {
      let angle = final.baseAngle;
      let radius = final.ringRadius;

      if (p < 1) {
        // ── Two-phase intro ────────────────────────────────────────────
        // Phase 1 (radial bloom): actors move from center straight down
        //   the Y-axis to their ring radius (all at 6 o'clock).
        // Phase 2 (orbital sweep): each actor orbits from 6 o'clock to
        //   its baseAngle, completing ≥1 full rotation.
        // Stagger: rings start sequentially (inner → outer).
        const ringIdx = RING_ORDER.indexOf(final.ring);
        const stagger = ringIdx * 0.06;
        const localP = Math.min(1, Math.max(0, (p - stagger) / (1 - stagger)));

        const rp = Math.min(1, localP / 0.35);
        radius = final.ringRadius * easeOutCubic(rp);
        angle = -90; // straight down (6 o'clock)

        if (localP >= 0.35) {
          const op = easeOutCubic((localP - 0.35) / 0.65);
          const totalAngle = 360 + (final.baseAngle - (-90));
          angle = -90 + op * totalAngle;
          radius = final.ringRadius;
        }
      } else {
        // ── Click-orbit offset per ring ─────────────────────────────
        const off = orbitOffsets[final.ring];
        if (off) angle = final.baseAngle + off;
      }

      const rad = (angle * Math.PI) / 180;
      out[actorId] = {
        ...final,
        x: CENTER_X + radius * Math.cos(rad),
        y: CENTER_Y + radius * Math.sin(rad),
      };
    }
    return out;
  }, [finalPositions, introProgress, orbitOffsets]);

  const settled = introProgress > 0.88;

  const handleActorClick = (entityId: string) => {
    onActorSelect(entityId);
    if (!settled) return; // don't orbit during intro
    const ring = finalPositions[entityId]?.ring;
    if (!ring) return;
    setOrbitingRing(prev => (prev === ring ? null : ring));
  };

  return (
    <div className="circular-table-container">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="circular-table-svg">
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#7C3AED" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#2563EB" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          {/* Bottom-arc paths for ring labels — inside each ring's band */}
          {(Object.entries(RING_CONFIG) as [RingKey, typeof RING_CONFIG[RingKey]][]).map(([key, ring]) => (
            <path
              key={`arc-${key}`}
              id={`ring-bottom-arc-${key}`}
              d={ringLabelBottomPath(ring.radius - 14)}
              fill="none"
            />
          ))}
        </defs>

        {/* Background glow */}
        <circle cx={CENTER_X} cy={CENTER_Y} r={RING_CONFIG.ring4.radius + 40} fill="url(#centerGlow)" />

        {/* Simulation mode border */}
        {mode === 'simulation' && (
          <>
            <rect x={10} y={10} width={SVG_W - 20} height={SVG_H - 20} rx={6}
              fill="none" stroke="#7C3AED" strokeWidth={1} strokeDasharray="8 4" opacity={0.3} />
            <text x={CENTER_X} y={18} textAnchor="middle"
              fill="#7C3AED" fontSize={8} fontFamily="monospace" letterSpacing="0.2em" opacity={0.7}>
              SIMULATION MODE
            </text>
          </>
        )}

        {/* Rings — drawn outside-in */}
        {(Object.entries(RING_CONFIG) as [RingKey, typeof RING_CONFIG[RingKey]][])
          .slice().reverse().map(([key, ring]) => {
            const isOrbiting = orbitingRing === key;
            return (
              <g key={key}>
                {/* Subtle band fill */}
                <circle cx={CENTER_X} cy={CENTER_Y} r={ring.radius}
                  fill={`${ring.color}${isOrbiting ? '10' : '06'}`} />
                {/* Ring border — glows when orbiting */}
                <circle cx={CENTER_X} cy={CENTER_Y} r={ring.radius}
                  fill="none" stroke={ring.color}
                  strokeWidth={isOrbiting ? ring.strokeWidth * 2 : ring.strokeWidth}
                  strokeOpacity={isOrbiting ? 0.7 : 0.3} />
                {/* Inner dashed echo */}
                <circle cx={CENTER_X} cy={CENTER_Y} r={ring.radius - 12}
                  fill="none" stroke={ring.color}
                  strokeWidth={0.5} strokeDasharray="3 6" strokeOpacity={0.12} />
                {/* Ring label — bottom-inside the ring band */}
                <text
                  fontSize={key === 'core' ? 7 : 7.5}
                  fontFamily="monospace"
                  letterSpacing="0.16em"
                  fill={ring.color}
                  opacity={isOrbiting ? 0.9 : 0.6}
                  fontWeight={isOrbiting ? 'bold' : 'normal'}
                >
                  <textPath href={`#ring-bottom-arc-${key}`} startOffset="50%" textAnchor="middle">
                    {ring.label}
                  </textPath>
                </text>
              </g>
            );
          })}

        {/* Tunisia map — larger, fills the core ring */}
        <TunisiaMapCenter
          cx={CENTER_X} cy={CENTER_Y}
          snapshot={snapshot} radius={64}
        />

        {/* RRI pulse */}
        <RRIPulse
          cx={CENTER_X} cy={CENTER_Y}
          rri={snapshot?.rri}
          pRevolution={snapshot?.p_revolution}
        />

        {/* Settled-state overlays */}
        {settled && (
          <>
            <DecisionFlowArrows session={session} cx={CENTER_X} cy={CENTER_Y} />
            {session && (
              <CoalitionArcs
                session={session} positions={displayPositions}
                cx={CENTER_X} cy={CENTER_Y}
              />
            )}
            <ChainSignalLines
              snapshot={snapshot} positions={displayPositions}
              cx={CENTER_X} cy={CENTER_Y}
            />
            {session?.veto_actor && (
              <VetoLine
                vetoActor={session.veto_actor} positions={displayPositions}
                cx={CENTER_X} cy={CENTER_Y}
              />
            )}
            {interventionRun && (
              <InterventionOverlay
                run={interventionRun} positions={displayPositions}
                cx={CENTER_X} cy={CENTER_Y}
              />
            )}
          </>
        )}

        {/* Orbit hint: pulsing ring indicator */}
        {orbitingRing && settled && (
          <circle
            cx={CENTER_X} cy={CENTER_Y}
            r={RING_CONFIG[orbitingRing].radius}
            fill="none"
            stroke={RING_CONFIG[orbitingRing].color}
            strokeWidth={2}
            strokeOpacity={0.4}
            className="pulse-ring"
          />
        )}

        {/* Actor nodes */}
        {Object.entries(displayPositions).map(([entityId, pos]) => (
          <ActorNode
            key={entityId}
            entityId={entityId}
            position={pos}
            ringColor={pos.ringColor}
            snapshot={snapshot}
            session={session}
            isSelected={selectedActor === entityId}
            isOrbiting={orbitingRing === pos.ring}
            isPres={entityId === 'PRES'}
            onClick={() => handleActorClick(entityId)}
          />
        ))}
      </svg>
    </div>
  );
};
