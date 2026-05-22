import React, { useMemo } from 'react';
import { TunisiaMapCenter } from './TunisiaMapCenter';
import { CoalitionArcs } from './CoalitionArcs';
import { ChainSignalLines } from './ChainSignalLines';
import { ActorNode } from './ActorNode';
import { RRIPulse } from './RRIPulse';

const TABLE_RADIUS = 260;
const CENTER_X = 400;
const CENTER_Y = 380;
const SVG_W = 800;
const SVG_H = 760;

interface Position {
  x: number;
  y: number;
}

const ACTOR_SEATS: Record<string, number> = {
  UGTT: 0,
  ARM: 330,
  BCT: 60,
  INT: 270,
  DONOR: 90,
  DZA: 240,
  EU: 120,
  LPR: 210,
  UTICA: 150,
  PPL: 180,
  PRES: 180,
};

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
}

interface Props {
  snapshot?: Snapshot;
  session?: Session;
  selectedActor?: string | null;
  mode: 'live' | 'simulation';
  onActorSelect: (id: string) => void;
}

function computeActorPositions(
  radius: number,
  cx: number,
  cy: number,
  seats: Record<string, number>,
): Record<string, Position> {
  const positions: Record<string, Position> = {};
  for (const [id, angleDeg] of Object.entries(seats)) {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    if (id === 'PRES') {
      positions[id] = { x: cx, y: cy + 100 };
    } else {
      positions[id] = {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad),
      };
    }
  }
  return positions;
}

export const CircularTable: React.FC<Props> = ({
  snapshot, session, selectedActor, mode, onActorSelect,
}) => {
  const actorPositions = useMemo(
    () => computeActorPositions(TABLE_RADIUS, CENTER_X, CENTER_Y, ACTOR_SEATS),
    [],
  );

  return (
    <div className="circular-table-container">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="circular-table-svg"
      >
        <circle
          cx={CENTER_X} cy={CENTER_Y} r={TABLE_RADIUS}
          fill="none" stroke="#1F2937" strokeWidth={1}
        />
        <circle
          cx={CENTER_X} cy={CENTER_Y} r={TABLE_RADIUS - 20}
          fill="none" stroke="#1F2937" strokeWidth={0.5}
          strokeDasharray="4 4"
          opacity={0.5}
        />

        {mode === 'simulation' && (
          <rect
            x={10} y={10} width={SVG_W - 20} height={SVG_H - 20} rx={4}
            fill="none" stroke="#7C3AED" strokeWidth={1}
            strokeDasharray="8 4"
            opacity={0.3}
          />
        )}

        {mode === 'simulation' && (
          <text
            x={CENTER_X} y={14}
            textAnchor="middle"
            fill="#7C3AED"
            fontSize={9}
            fontFamily="monospace"
            letterSpacing="0.2em"
          >
            SIMULATION MODE
          </text>
        )}

        <TunisiaMapCenter
          cx={CENTER_X}
          cy={CENTER_Y}
          snapshot={snapshot}
          radius={140}
        />

        {session && (
          <CoalitionArcs
            session={session}
            positions={actorPositions}
            cx={CENTER_X}
            cy={CENTER_Y}
          />
        )}

        <ChainSignalLines
          snapshot={snapshot}
          positions={actorPositions}
          cx={CENTER_X}
          cy={CENTER_Y}
        />

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
