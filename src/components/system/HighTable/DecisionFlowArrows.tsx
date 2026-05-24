import React from 'react';
import { RING_CONFIG } from './CircularTable';

interface Session {
  resolution_type?: string;
}

interface Props {
  session?: Session | null;
  cx: number;
  cy: number;
}

// Draws small chevron arrows along each ring boundary indicating
// which direction pressure/decree is flowing.
const FlowArrow: React.FC<{
  cx: number; cy: number; radius: number;
  color: string; direction: 'inward' | 'outward';
  angle: number;
}> = ({ cx, cy, radius, color, direction, angle }) => {
  const rad = (angle * Math.PI) / 180;
  const ax = cx + radius * Math.cos(rad);
  const ay = cy + radius * Math.sin(rad);

  // Arrow points inward or outward along the radius at this angle
  const dr = direction === 'inward' ? -8 : 8;
  const tip = { x: ax + dr * Math.cos(rad), y: ay + dr * Math.sin(rad) };
  const base1 = {
    x: ax + 5 * Math.cos(rad + Math.PI / 2),
    y: ay + 5 * Math.sin(rad + Math.PI / 2),
  };
  const base2 = {
    x: ax + 5 * Math.cos(rad - Math.PI / 2),
    y: ay + 5 * Math.sin(rad - Math.PI / 2),
  };

  return (
    <polygon
      points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${base2.x},${base2.y}`}
      fill={color}
      opacity={0.35}
    />
  );
};

export const DecisionFlowArrows: React.FC<Props> = ({ session, cx, cy }) => {
  if (!session) return null;

  const resolution = session.resolution_type ?? '';
  const direction: 'inward' | 'outward' = ['consensus', 'compromise'].includes(resolution)
    ? 'outward'
    : 'inward';

  // Place 3 arrows per ring, at 30°, 150°, 270°
  const arrowAngles = [30, 150, 270];

  return (
    <g className="decision-flow" style={{ pointerEvents: 'none' }}>
      {(Object.entries(RING_CONFIG) as [string, typeof RING_CONFIG[keyof typeof RING_CONFIG]][])
        .filter(([key]) => key !== 'core')
        .map(([key, ring]) =>
          arrowAngles.map(angle => (
            <FlowArrow
              key={`${key}-${angle}`}
              cx={cx} cy={cy}
              radius={ring.radius}
              color={ring.color}
              direction={direction}
              angle={angle}
            />
          ))
        )}
    </g>
  );
};
