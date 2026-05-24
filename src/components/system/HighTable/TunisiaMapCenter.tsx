import React, { useState, useEffect } from 'react';

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

const SVG_W = Math.round(760 * (4.1 / 7.3) * Math.cos(33.85 * Math.PI / 180));
const PX = (lon: number) => (lon - 7.5) / (11.6 - 7.5) * SVG_W;
const PY = (lat: number) => 760 - (lat - 30.2) / (37.5 - 30.2) * 760;

function ringToPath(ring: number[][]): string {
  return ring.map((p, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${cmd}${PX(p[0]).toFixed(1)},${PY(p[1]).toFixed(1)}`;
  }).join('') + 'Z';
}

function normalizeName(raw: string): string {
  const lower = raw.toLowerCase().replace(/\s+/g, '_');
  try {
    return lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return lower.replace(/[éèêë]/g, 'e').replace(/[àâä]/g, 'a')
      .replace(/[ùûü]/g, 'u').replace(/[ôö]/g, 'o').replace(/[îï]/g, 'i')
      .replace(/[ç]/g, 'c');
  }
}

const GOV_IDS = [
  'tunis', 'ariana', 'ben_arous', 'manouba', 'nabeul', 'bizerte',
  'beja', 'jendouba', 'kef', 'siliana', 'zaghouan', 'kairouan',
  'kasserine', 'sidi_bouzid', 'sousse', 'monastir', 'mahdia',
  'sfax', 'gafsa', 'tozeur', 'kebili', 'gabes', 'medenine', 'tataouine',
];

const FRENCH_TO_ENGLISH: Record<string, string> = {
  'tunis': 'tunis', 'ben_arous': 'ben_arous', 'ariana': 'ariana',
  'nabeul': 'nabeul', 'manouba': 'manouba', 'bizerte': 'bizerte',
  'zaghouan': 'zaghouan', 'jendouba': 'jendouba', 'beja': 'beja',
  'le_kef': 'kef', 'siliana': 'siliana', 'kairouan': 'kairouan',
  'kasserine': 'kasserine', 'sidi_bouzid': 'sidi_bouzid',
  'sousse': 'sousse', 'monastir': 'monastir', 'mahdia': 'mahdia',
  'sfax': 'sfax', 'gafsa': 'gafsa', 'tozeur': 'tozeur',
  'kebili': 'kebili', 'gabes': 'gabes', 'medenine': 'medenine',
  'tataouine': 'tataouine',
};

async function loadGovPaths(): Promise<Record<string, string>> {
  try {
    const res = await fetch('/data/tunisia_governorates.geojson');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const map: Record<string, string> = {};
    for (const feat of data.features || []) {
      try {
        const props = feat.properties;
        const raw = props.gouv_fr || props.name || '';
        if (!raw) continue;
        const name = normalizeName(raw);
        const geom = feat.geometry;
        if (!geom || !geom.coordinates) continue;
        let path = '';
        if (geom.type === 'Polygon') {
          path = ringToPath(geom.coordinates[0]);
        } else if (geom.type === 'MultiPolygon') {
          let largest = geom.coordinates[0][0];
          for (const poly of geom.coordinates) {
            if (poly[0]?.length > largest.length) largest = poly[0];
          }
          path = ringToPath(largest);
        }
        if (path) map[name] = path;
      } catch (e) {
        console.warn('TunisiaMapCenter: failed to process feature', e);
      }
    }
    const result: Record<string, string> = {};
    for (const [french, eng] of Object.entries(FRENCH_TO_ENGLISH)) {
      if (map[french]) result[eng] = map[french];
      else console.warn(`TunisiaMapCenter: missing path for ${french} -> ${eng}`);
    }
    return result;
  } catch (e) {
    console.warn('TunisiaMapCenter: failed to load GeoJSON', e);
    return {};
  }
}

const getGovColor = (stress: number): string => {
  if (stress >= 0.75) return '#DC2626';
  if (stress >= 0.50) return '#F59E0B';
  if (stress >= 0.25) return '#10B981';
  return '#4B5563';
};

export const TunisiaMapCenter: React.FC<Props> = ({ cx, cy, snapshot, radius }) => {
  const [govPaths, setGovPaths] = useState<Record<string, string> | null>(null);
  const govVectors = snapshot?.governorate_vectors ?? [];

  useEffect(() => {
    loadGovPaths().then(setGovPaths);
  }, []);

  const fitScale = ((radius - 4) * 2 * 0.85) / Math.max(SVG_W, 760);

  const getColor = (govId: string): string => {
    const gov = govVectors.find((g: GovVector) => g.gov_id === govId);
    return getGovColor(gov?.stress ?? 0);
  };

  return (
    <g transform={`translate(${cx - radius}, ${cy - radius + 10})`}>
      <defs>
        <clipPath id="tunisia-map-clip-ht">
          <circle cx={radius} cy={radius} r={radius - 4} />
        </clipPath>
      </defs>

      <circle
        cx={radius} cy={radius} r={radius - 4}
        fill="#0D1117" stroke="#1F2937" strokeWidth={1}
      />

      <g clipPath="url(#tunisia-map-clip-ht)">
        <g transform={`translate(${radius}, ${radius}) scale(${fitScale}) translate(${-SVG_W / 2}, ${-760 / 2})`}>
          {GOV_IDS.map(govId => {
            const path = govPaths?.[govId];
            if (!path) return null;
            return (
              <path
                key={govId}
                d={path}
                fill={getColor(govId)}
                stroke="#1F2937"
                strokeWidth={0.5 / fitScale}
                opacity={0.8}
              />
            );
          })}
        </g>
      </g>


    </g>
  );
};
