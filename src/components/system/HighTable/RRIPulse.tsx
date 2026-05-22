import React from 'react';

interface Props {
  cx: number;
  cy: number;
  rri?: number;
  pRevolution?: number;
}

export const RRIPulse: React.FC<Props> = ({ cx, cy, rri, pRevolution }) => {
  const intensity = Math.min(1, (rri ?? 0) / 3.0);
  const isTerminal = (pRevolution ?? 0) > 0.55;

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
          style={{
            animation: `rri-pulse-${ring} ${3 + ring}s ease-out infinite`,
            animationDelay: `${ring * 0.8}s`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      ))}
    </g>
  );
};
