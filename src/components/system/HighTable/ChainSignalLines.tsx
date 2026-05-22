import React from 'react';

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
  'CHAIN-01': '#F59E0B',
  'CHAIN-02': '#EF4444',
  'CHAIN-03': '#8B5CF6',
  'CHAIN-04': '#3B82F6',
  'CHAIN-06': '#10B981',
  'CHAIN-09': '#F97316',
  'CHAIN-11': '#DC2626',
};

interface Position {
  x: number;
  y: number;
}

interface Shock {
  chain_id?: string;
}

interface Props {
  snapshot?: {
    active_shocks?: Shock[];
  };
  positions: Record<string, Position>;
  cx: number;
  cy: number;
}

export const ChainSignalLines: React.FC<Props> = ({
  snapshot, positions, cx, cy,
}) => {
  const activeChains = snapshot?.active_shocks
    ?.map((s: any) => s.chain_id)
    .filter(Boolean) ?? [];

  if (activeChains.length === 0) return null;

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
