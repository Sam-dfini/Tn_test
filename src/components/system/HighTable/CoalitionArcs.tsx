import React from 'react';

interface Position {
  x: number;
  y: number;
}

interface Props {
  session?: {
    dominant_coalition?: string[];
    dissenting_actors?: string[];
    conflict_map?: Record<string, { actor_a: string; actor_b: string; severity: number }>;
  };
  positions: Record<string, Position>;
  cx: number;
  cy: number;
}

function buildArc(
  posA: Position,
  posB: Position,
  cx: number,
  cy: number,
): string {
  const mx = (posA.x + posB.x) / 2;
  const my = (posA.y + posB.y) / 2;
  const cpx = mx + (cx - mx) * 0.3;
  const cpy = my + (cy - my) * 0.3;
  return `M ${posA.x} ${posA.y} Q ${cpx} ${cpy} ${posB.x} ${posB.y}`;
}

export const CoalitionArcs: React.FC<Props> = ({
  session, positions, cx, cy,
}) => {
  if (!session) return null;

  const dominant = session.dominant_coalition ?? [];
  const dissenting = session.dissenting_actors ?? [];
  const conflictMap = session.conflict_map ?? {};

  return (
    <g className="coalition-arcs">
      {dominant.length > 1 && dominant.map((actorA, i) =>
        dominant.slice(i + 1).map(actorB => {
          const posA = positions[actorA];
          const posB = positions[actorB];
          if (!posA || !posB) return null;

          return (
            <path
              key={`coal-${actorA}-${actorB}`}
              d={buildArc(posA, posB, cx, cy)}
              fill="none"
              stroke="#10B981"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          );
        })
      )}

      {dissenting.length > 1 && dissenting.map((actorA, i) =>
        dissenting.slice(i + 1).map(actorB => {
          const posA = positions[actorA];
          const posB = positions[actorB];
          if (!posA || !posB) return null;

          return (
            <path
              key={`diss-${actorA}-${actorB}`}
              d={buildArc(posA, posB, cx, cy)}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              strokeOpacity={0.5}
            />
          );
        })
      )}

      {Object.values(conflictMap).map((conflict: any) => {
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
            strokeOpacity={0.4 + (conflict.severity || 0.5) * 0.4}
          />
        );
      })}
    </g>
  );
};
