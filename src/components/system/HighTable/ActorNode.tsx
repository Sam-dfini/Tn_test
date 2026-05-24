import React from 'react';

const POSTURE_COLORS: Record<string, string> = {
  passive:     '#4A5568',
  defensive:   '#D97706',
  aggressive:  '#DC2626',
  negotiating: '#2563EB',
  collapsing:  '#7C3AED',
};

const POSTURE_ABBREV: Record<string, string> = {
  passive:     'PASS',
  defensive:   'DEF',
  aggressive:  'AGR',
  negotiating: 'NEG',
  collapsing:  'COL',
};

const POSTURE_PULSE: Record<string, boolean> = {
  aggressive: true,
  collapsing: true,
};

interface Position { x: number; y: number; }
interface Posture  { actor_id: string; posture?: string; stress_level?: number; }
interface Session  { dominant_coalition?: string[]; dissenting_actors?: string[]; veto_actor?: string; }

interface Props {
  entityId:   string;
  position:   Position;
  ringColor?: string;
  snapshot?:  { actor_postures?: Posture[] };
  session?:   Session;
  isSelected: boolean;
  isOrbiting?: boolean;
  isPres:     boolean;
  onClick:    () => void;
}

export const ActorNode: React.FC<Props> = ({
  entityId, position, ringColor, snapshot, session,
  isSelected, isOrbiting, isPres, onClick,
}) => {
  const posture      = snapshot?.actor_postures?.find(p => p.actor_id === entityId);
  const stress       = posture?.stress_level ?? 0.5;
  const postureLabel = posture?.posture ?? 'passive';
  const postureColor = POSTURE_COLORS[postureLabel] || '#4A5568';
  const color        = postureLabel === 'passive' && ringColor ? ringColor : postureColor;

  const inCoalition = session?.dominant_coalition?.includes(entityId);
  const isDissenting = session?.dissenting_actors?.includes(entityId);
  const isVetoing    = session?.veto_actor === entityId;

  const nodeR     = isPres ? 32 : 22;
  const ringR     = nodeR + 8;
  const stressRingR = ringR + (stress * 10);

  const pctText = `${(stress * 100).toFixed(0)}%`;
  const pctFontSize = isPres ? 15 : 14;
  // pill behind the percentage
  const pillW = pctText.length * (pctFontSize * 0.62) + 8;
  const pillH = pctFontSize + 4;
  const pillY = nodeR + 12;
  const textY = nodeR + 12 + pillH / 2 + pctFontSize * 0.35;

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      {/* Invisible hit area */}
      <circle
        r={nodeR + 24}
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
          <circle r={stressRingR + 6} fill="none"
            stroke="#DC2626" strokeWidth={3} strokeDasharray="6 3"
            opacity={0.8} className="pulse-ring" />
        )}

        {inCoalition && (
          <circle r={ringR + 2} fill="none"
            stroke="#10B981" strokeWidth={2} opacity={0.7} />
        )}
        {isDissenting && (
          <circle r={ringR + 2} fill="none"
            stroke="#F59E0B" strokeWidth={2} strokeDasharray="3 3" opacity={0.7} />
        )}

        {/* Orbit ring: subtle glow when this ring is orbiting */}
        {isOrbiting && (
          <circle r={nodeR + 4} fill="none"
            stroke={color} strokeWidth={1.5} opacity={0.5}
            className="pulse-ring" />
        )}
      </g>

      {/* Selection ring */}
      {isSelected && (
        <circle r={nodeR + 6} fill="none"
          stroke="#00f2ff" strokeWidth={2} opacity={0.9} />
      )}

      {/* Main avatar */}
      <circle
        r={nodeR}
        fill={isSelected ? '#1a2a3a' : '#0d1117'}
        stroke={isSelected ? '#00f2ff' : color}
        strokeWidth={isPres ? 3 : 2}
        className="actor-avatar"
        style={{ cursor: 'pointer', transition: 'fill 0.15s ease, stroke 0.15s ease' }}
        onClick={onClick}
      />

      {/* Text labels — no pointer events */}
      <g style={{ pointerEvents: 'none' }}>
        {/* Entity ID */}
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          y={isPres ? -4 : 0}
          fill={color}
          fontSize={isPres ? 13 : 11}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {entityId}
        </text>

        {/* Posture abbreviation — small, dim */}
        <text
          y={nodeR + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={7}
          fontFamily="monospace"
          letterSpacing="0.08em"
        >
          {isVetoing ? 'VETO' : (POSTURE_ABBREV[postureLabel] ?? postureLabel.slice(0, 4).toUpperCase())}
        </text>

        {/* Stress % — large, readable, with dark pill background */}
        <rect
          x={-pillW / 2}
          y={pillY}
          width={pillW}
          height={pillH}
          rx={3}
          fill="rgba(0,0,0,0.65)"
        />
        <text
          y={textY}
          textAnchor="middle"
          fill={stress > 0.7 ? '#EF4444' : stress > 0.45 ? '#F59E0B' : color}
          fontSize={pctFontSize}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {pctText}
        </text>
      </g>
    </g>
  );
};
