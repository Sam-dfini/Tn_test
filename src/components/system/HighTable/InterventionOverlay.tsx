import React from 'react';

interface Position { x: number; y: number; }

interface RankedIntervention {
  rank: number;
  intervention_name: string;
  intervention_id: string;
  actor_support?: string[];
  actor_opposition?: string[];
  p_revolution_delta?: number;
  efficiency_score?: number;
  veto_risk?: boolean;
  veto_actor?: string;
}

interface InterventionRun {
  ranked_results?: RankedIntervention[];
  top_recommendation?: string;
  recommendation_narrative?: string;
}

interface Props {
  run: InterventionRun;
  positions: Record<string, Position>;
  cx: number;
  cy: number;
}

export const InterventionOverlay: React.FC<Props> = ({ run, positions, cx, cy }) => {
  if (!run?.ranked_results?.length) return null;

  const top = run.ranked_results[0];
  const support = top.actor_support ?? [];
  const opposition = top.actor_opposition ?? [];
  const deltaSign = (top.p_revolution_delta ?? 0) < 0 ? '' : '+';
  const deltaPct = ((top.p_revolution_delta ?? 0) * 100).toFixed(1);

  return (
    <g className="intervention-overlay" style={{ pointerEvents: 'none' }}>
      {/* Green glow rings on support actors */}
      {support.map(actorId => {
        const pos = positions[actorId];
        if (!pos) return null;
        return (
          <circle key={`sup-${actorId}`}
            cx={pos.x} cy={pos.y} r={34}
            fill="none" stroke="#10B981"
            strokeWidth={2} strokeOpacity={0.55}
            className="support-pulse"
          />
        );
      })}

      {/* Red dashed rings on opposition actors */}
      {opposition.map(actorId => {
        const pos = positions[actorId];
        if (!pos) return null;
        return (
          <circle key={`opp-${actorId}`}
            cx={pos.x} cy={pos.y} r={34}
            fill="none" stroke="#DC2626"
            strokeWidth={2} strokeOpacity={0.55}
            strokeDasharray="4 3"
          />
        );
      })}

      {/* Top intervention banner at center bottom */}
      <rect
        x={cx - 140} y={cy + 58}
        width={280} height={38}
        rx={4}
        fill="rgba(16,185,129,0.08)"
        stroke="rgba(16,185,129,0.25)"
        strokeWidth={1}
      />
      <text
        x={cx} y={cy + 72}
        textAnchor="middle"
        fill="#10B981"
        fontSize={9}
        fontFamily="monospace"
        fontWeight="bold"
        letterSpacing="0.05em"
      >
        ↑ {top.intervention_name}
      </text>
      <text
        x={cx} y={cy + 86}
        textAnchor="middle"
        fill="#6B7280"
        fontSize={8}
        fontFamily="monospace"
      >
        ΔP(rev): {deltaSign}{deltaPct}%  ·  efficiency {(top.efficiency_score ?? 0).toFixed(2)}
        {top.veto_risk ? `  ·  VETO: ${top.veto_actor}` : ''}
      </text>
    </g>
  );
};
