import React from 'react';

interface Position { x: number; y: number; }

interface Props {
  vetoActor: string;
  positions: Record<string, Position>;
  cx: number;
  cy: number;
}

export const VetoLine: React.FC<Props> = ({ vetoActor, positions, cx, cy }) => {
  const vetoPos = positions[vetoActor];
  const presPos = positions['PRES'] ?? { x: cx, y: cy };
  if (!vetoPos) return null;

  const midX = (vetoPos.x + presPos.x) / 2;
  const midY = (vetoPos.y + presPos.y) / 2 - 10;

  return (
    <g className="veto-line" style={{ pointerEvents: 'none' }}>
      {/* Glow layer behind the line */}
      <line
        x1={vetoPos.x} y1={vetoPos.y}
        x2={presPos.x} y2={presPos.y}
        stroke="#DC2626" strokeWidth={6} strokeOpacity={0.12}
      />
      {/* Main dashed veto line */}
      <line
        x1={vetoPos.x} y1={vetoPos.y}
        x2={presPos.x} y2={presPos.y}
        stroke="#DC2626" strokeWidth={2}
        strokeDasharray="6 3"
        className="veto-pulse"
      />
      {/* VETO label at midpoint */}
      <text
        x={midX} y={midY}
        textAnchor="middle"
        fill="#DC2626"
        fontSize={8}
        fontFamily="monospace"
        letterSpacing="0.15em"
        fontWeight="bold"
        opacity={0.9}
      >
        VETO
      </text>
      {/* Pulsing dot at the veto actor end */}
      <circle
        cx={vetoPos.x} cy={vetoPos.y} r={5}
        fill="#DC2626" opacity={0.85}
        className="pulse-ring"
      />
    </g>
  );
};
