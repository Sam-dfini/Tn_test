import React from 'react';

const POSTURE_COLORS: Record<string, string> = {
  passive: '#4A5568',
  defensive: '#D97706',
  aggressive: '#DC2626',
  negotiating: '#2563EB',
  collapsing: '#7C3AED',
};

const POSTURE_PULSE: Record<string, boolean> = {
  aggressive: true,
  collapsing: true,
};

interface Position {
  x: number;
  y: number;
}

interface Posture {
  actor_id: string;
  posture?: string;
  stress_level?: number;
}

interface Session {
  dominant_coalition?: string[];
  dissenting_actors?: string[];
  veto_actor?: string;
}

interface Props {
  entityId: string;
  position: Position;
  snapshot?: {
    actor_postures?: Posture[];
  };
  session?: Session;
  isSelected: boolean;
  isPres: boolean;
  onClick: () => void;
}

export const ActorNode: React.FC<Props> = ({
  entityId, position, snapshot, session,
  isSelected, isPres, onClick,
}) => {
  const posture = snapshot?.actor_postures?.find(
    p => p.actor_id === entityId
  );
  const stress = posture?.stress_level ?? 0.5;
  const postureLabel = posture?.posture ?? 'passive';
  const color = POSTURE_COLORS[postureLabel] || '#4A5568';

  const inCoalition = session?.dominant_coalition?.includes(entityId);
  const isDissenting = session?.dissenting_actors?.includes(entityId);
  const isVetoing = session?.veto_actor === entityId;

  const nodeR = isPres ? 32 : 24;
  const ringR = nodeR + 8;
  const stressRingR = ringR + (stress * 10);
  const hitR = nodeR + 4;

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Invisible hit area — larger than visual, catches clicks */}
      <circle
        r={hitR + 20}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onClick={onClick}
      />

      {/* Decorative rings — no pointer events */}
      <g style={{ pointerEvents: 'none' }}>
        <circle
          r={stressRingR}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={isVetoing ? '4 2' : 'none'}
          opacity={0.4}
          className={POSTURE_PULSE[postureLabel] ? 'pulse-ring' : ''}
        />

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

        {inCoalition && (
          <circle r={ringR + 2} fill="none"
            stroke="#10B981" strokeWidth={2} opacity={0.7} />
        )}
        {isDissenting && (
          <circle r={ringR + 2} fill="none"
            stroke="#F59E0B" strokeWidth={2}
            strokeDasharray="3 3" opacity={0.7} />
        )}
      </g>

      {/* Selection ring — visible behind avatar when selected */}
      {isSelected && (
        <circle
          r={nodeR + 6}
          fill="none"
          stroke="#00f2ff"
          strokeWidth={2}
          opacity={0.9}
        />
      )}

      {/* Main avatar — clickable, visible hover state via CSS */}
      <circle
        r={nodeR}
        fill={isSelected ? '#1a2a3a' : '#111827'}
        stroke={isSelected ? '#00f2ff' : color}
        strokeWidth={isPres ? 3 : 2}
        className="actor-avatar"
        style={{ cursor: 'pointer', transition: 'fill 0.15s ease, stroke 0.15s ease' }}
        onClick={onClick}
      />

      {/* Text labels — no pointer events */}
      <g style={{ pointerEvents: 'none' }}>
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

        <text
          y={nodeR + 14}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize={8}
          fontFamily="monospace"
        >
          {postureLabel.toUpperCase()}
        </text>

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
    </g>
  );
};
