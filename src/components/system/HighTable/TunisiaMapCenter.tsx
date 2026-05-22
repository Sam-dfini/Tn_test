import React from 'react';

interface GovVector {
  gov_id: string;
  stress?: number;
}

interface Props {
  cx: number;
  cy: number;
  snapshot?: {
    governorate_vectors?: GovVector[];
    rri?: number;
    p_revolution?: number;
  };
  radius: number;
}

const GOV_IDS = [
  'tunis', 'ariana', 'ben_arous', 'manouba', 'nabeul', 'bizerte',
  'beja', 'jendouba', 'kef', 'siliana', 'zaghouan', 'kairouan',
  'kasserine', 'sidi_bouzid', 'sousse', 'monastir', 'mahdia',
  'sfax', 'gafsa', 'tozeur', 'kebili', 'gabes', 'medenine', 'tataouine',
];

const ABSTRACT_PATHS: Record<string, string> = {
  tunis: 'M145,95 L160,88 L175,92 L172,108 L155,112 Z',
  ariana: 'M130,78 L145,82 L148,95 L135,92 Z',
  ben_arous: 'M160,88 L178,85 L185,98 L175,108 L172,108 Z',
  manouba: 'M130,90 L145,95 L148,108 L135,110 L128,102 Z',
  nabeul: 'M175,92 L195,88 L210,95 L205,110 L195,115 L185,98 Z',
  bizerte: 'M110,55 L130,50 L145,55 L148,70 L130,78 L115,72 Z',
  beja: 'M110,72 L128,78 L130,90 L115,92 L105,85 Z',
  jendouba: 'M95,65 L110,55 L115,72 L105,78 L92,75 Z',
  kef: 'M95,82 L110,85 L115,92 L105,100 L92,95 L88,88 Z',
  siliana: 'M115,92 L130,90 L135,105 L125,112 L115,108 L110,100 Z',
  zaghouan: 'M175,108 L185,98 L195,110 L190,122 L178,120 Z',
  kairouan: 'M135,105 L155,112 L165,125 L155,135 L140,130 L130,118 Z',
  kasserine: 'M105,115 L125,112 L135,130 L130,145 L115,140 L105,130 L100,120 Z',
  sidi_bouzid: 'M135,130 L155,135 L165,148 L158,160 L142,155 L135,145 Z',
  sousse: 'M185,110 L200,115 L210,125 L205,140 L195,135 L190,122 Z',
  monastir: 'M200,115 L215,118 L220,130 L210,132 Z',
  mahdia: 'M210,125 L225,130 L230,148 L218,145 L205,140 Z',
  sfax: 'M205,140 L225,148 L235,165 L225,178 L210,172 L200,158 Z',
  gafsa: 'M115,155 L135,160 L145,175 L130,185 L115,178 L108,165 Z',
  tozeur: 'M85,165 L105,160 L115,170 L105,182 L88,178 Z',
  kebili: 'M115,178 L145,190 L155,205 L140,215 L120,208 L108,195 Z',
  gabes: 'M145,190 L165,195 L175,210 L165,225 L150,218 L140,210 Z',
  medenine: 'M165,210 L185,220 L195,240 L180,250 L165,240 L155,225 Z',
  tataouine: 'M155,225 L175,245 L190,270 L170,280 L150,270 L140,250 Z',
};

const getGovColor = (stress: number): string => {
  if (stress >= 0.75) return '#DC2626';
  if (stress >= 0.50) return '#F59E0B';
  if (stress >= 0.25) return '#10B981';
  return '#1F2937';
};

export const TunisiaMapCenter: React.FC<Props> = ({ cx, cy, snapshot, radius }) => {
  const govVectors = snapshot?.governorate_vectors ?? [];
  const scale = radius * 1.6;

  const getColor = (govId: string): string => {
    const gov = govVectors.find((g: any) => g.gov_id === govId);
    return getGovColor(gov?.stress ?? 0);
  };

  return (
    <g transform={`translate(${cx - scale / 2}, ${cy - scale / 2 + 10})`}>
      <defs>
        <clipPath id="tunisia-map-clip-ht">
          <circle cx={scale / 2} cy={scale / 2} r={radius - 4} />
        </clipPath>
      </defs>

      <circle
        cx={scale / 2} cy={scale / 2} r={radius - 4}
        fill="#0D1117" stroke="#1F2937" strokeWidth={1}
      />

      <g clipPath="url(#tunisia-map-clip-ht)">
        {GOV_IDS.map(govId => {
          const path = ABSTRACT_PATHS[govId];
          if (!path) return null;
          return (
            <path
              key={govId}
              d={path}
              fill={getColor(govId)}
              stroke="#1F2937"
              strokeWidth={0.5}
              opacity={0.8}
            />
          );
        })}
      </g>

      <text
        x={scale / 2} y={scale / 2 - 10}
        textAnchor="middle"
        fill="#F9FAFB"
        fontSize={22}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {snapshot?.rri?.toFixed(2) ?? '—'}
      </text>
      <text
        x={scale / 2} y={scale / 2 + 12}
        textAnchor="middle"
        fill="#6B7280"
        fontSize={9}
        fontFamily="monospace"
      >
        RRI
      </text>

      <text
        x={scale / 2} y={scale / 2 + 28}
        textAnchor="middle"
        fill={(snapshot?.p_revolution ?? 0) > 0.45 ? '#DC2626' : '#9CA3AF'}
        fontSize={11}
        fontFamily="monospace"
      >
        P(rev) {((snapshot?.p_revolution ?? 0) * 100).toFixed(1)}%
      </text>
    </g>
  );
};
