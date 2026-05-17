import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Heart, RefreshCw, MapPin } from 'lucide-react';

interface GovEmotion {
  name: string; total_mentions: number;
  dominant_emotion: string; dominant_color: string;
  emotions: Record<string, number>;
  coordinates: [number, number];
}

interface HeatmapResult {
  national_mood: {
    dominant_emotion: string; dominant_color: string;
    distribution: Record<string, number>;
  };
  governorates: Record<string, GovEmotion>;
  governorates_active: number;
  governorates_total: number;
  total_signals_analyzed: number;
}

const EMOTION_LABELS: Record<string, string> = {
  anger: 'Anger', fear: 'Fear', hope: 'Hope',
  defiance: 'Defiance', resignation: 'Resignation', surprise: 'Surprise',
};

const SVG_W = Math.round(760 * (4.1 / 7.3) * Math.cos(33.85 * Math.PI / 180));
const PX = (lon: number) => (lon - 7.5) / (11.6 - 7.5) * SVG_W;
const PY = (lat: number) => 760 - (lat - 30.2) / (37.5 - 30.2) * 760;

const EmotionalHeatmapView: React.FC = () => {
  const [result, setResult] = useState<HeatmapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [govPaths, setGovPaths] = useState<Record<string, string>>({});
  const [hoveredGov, setHoveredGov] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/heatmap/current');
      if (res.ok) setResult(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 60000); return () => clearInterval(t); }, [fetchData]);

  useEffect(() => {
    fetch('/data/tunisia_governorates.geojson').then(r => r.json()).then(data => {
      const map: Record<string, string> = {};
      for (const feat of data.features || []) {
        const props = feat.properties;
        const name = (props.gouv_fr || props.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
        const geom = feat.geometry;
        const ringToPath = (ring: number[][]) =>
          ring.map((p, i) => {
            const cmd = i === 0 ? 'M' : 'L';
            return `${cmd}${PX(p[0]).toFixed(1)},${PY(p[1]).toFixed(1)}`;
          }).join('') + 'Z';
        if (geom?.type === 'Polygon') {
          map[name] = ringToPath(geom.coordinates[0]);
        } else if (geom?.type === 'MultiPolygon') {
          let largest = geom.coordinates[0][0];
          for (const poly of geom.coordinates) {
            if (poly[0].length > largest.length) largest = poly[0];
          }
          map[name] = ringToPath(largest);
        }
      }
      setGovPaths(map);
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity className="w-6 h-6 animate-spin" style={{ color: '#a78bfa' }} />
      </div>
    );
  }

  const mood = result?.national_mood;
  const govs = result?.governorates || {};
  const distribution = mood?.distribution || {};
  const maxEmotion = Math.max(...Object.values(distribution), 0.01);

  return (
    <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', flexDirection: 'column', padding: 20, gap: 16, fontFamily: '"IBM Plex Mono",monospace', color: '#c9d1e0', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, flexShrink: 0 }}>
        <Heart size={18} color="#ef4444" />
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#3a4a5a', fontWeight: 600 }}>EMOTIONAL HEATMAP</span>
        <span style={{ fontSize: 9, color: '#3a4a5a', marginLeft: 'auto' }}>
          {result?.governorates_active || 0}/{result?.governorates_total || 24} govs · {result?.total_signals_analyzed || 0} signals
        </span>
        <button onClick={fetchData} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#c9d1e0', cursor: 'pointer' }}>
          <RefreshCw size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Refresh
        </button>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden' }}>
        {/* Map */}
        <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(ellipse at 45% 35%,rgba(8,18,45,0.95) 0%,#05070f 70%)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${SVG_W} 760`} style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <filter id="glow-anger" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="b1"/>
                <feGaussianBlur stdDeviation="12" result="b2"/>
                <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-defiance" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="b1"/>
                <feGaussianBlur stdDeviation="8" result="b2"/>
                <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="glow-fear" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {Object.entries(govPaths).map(([gid, path]) => {
              const g = govs[gid];
              const hasData = g && g.total_mentions > 0;
              const isHovered = hoveredGov === gid;
              const dominantShare = hasData ? (g.emotions[g.dominant_emotion] || 0) : 0;
              const intensity = hasData ? Math.max(0.15, dominantShare) : 0;
              const fillColor = hasData ? g.dominant_color : '#1a2a3a';
              const strokeColor = hasData ? g.dominant_color : '#2a4a6a';
              // Glow: anger glows strongest, defiance moderate, fear subtle
              const glowFilter = hasData && intensity > 0.3
                ? (g.dominant_emotion === 'anger' ? 'url(#glow-anger)'
                  : g.dominant_emotion === 'defiance' ? 'url(#glow-defiance)'
                  : g.dominant_emotion === 'fear' && intensity > 0.5 ? 'url(#glow-fear)'
                  : undefined)
                : undefined;
              return (
                <g key={gid}
                  onMouseEnter={() => setHoveredGov(gid)}
                  onMouseLeave={() => setHoveredGov(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path d={path}
                    fill={fillColor}
                    fillOpacity={hasData ? intensity * 0.7 : 0.03}
                    stroke={isHovered ? strokeColor : strokeColor}
                    strokeWidth={hasData ? (isHovered ? 2.5 : 1.5) : (isHovered ? 2 : 0.8)}
                    strokeOpacity={hasData ? 0.9 : 0.45}
                    filter={glowFilter}
                    style={{ transition: 'all .2s' }} />
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredGov && govs[hoveredGov] && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(2,6,18,0.97)', border: `1px solid ${govs[hoveredGov].total_mentions > 0 ? govs[hoveredGov].dominant_color + '44' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '10px 14px', minWidth: 160, pointerEvents: 'none' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: govs[hoveredGov].total_mentions > 0 ? govs[hoveredGov].dominant_color : '#64748b', marginBottom: 4 }}>
                {govs[hoveredGov].name}
              </div>
              <div style={{ fontSize: 9, color: '#3a4a5a', marginBottom: 4 }}>
                {govs[hoveredGov].total_mentions > 0
                  ? `${EMOTION_LABELS[govs[hoveredGov].dominant_emotion] || govs[hoveredGov].dominant_emotion} (${govs[hoveredGov].total_mentions} mentions)`
                  : 'No signals mentioning this governorate'}
              </div>
              {govs[hoveredGov].total_mentions > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Object.entries(govs[hoveredGov].emotions).sort(([,a], [,b]) => b - a).slice(0, 4).map(([emo, score]) => (
                    <div key={emo} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8, color: '#3a4a5a', width: 60 }}>{EMOTION_LABELS[emo] || emo}</span>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(score as number) * 100}%`, height: '100%', background: govs[hoveredGov].dominant_color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 8, color: '#3a4a5a', width: 28, textAlign: 'right' }}>
                        {((score as number) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {/* National mood */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 14 }}>
            <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 8 }}>NATIONAL MOOD</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: mood?.dominant_color || '#64748b', marginBottom: 8 }}>
              {EMOTION_LABELS[mood?.dominant_emotion || ''] || mood?.dominant_emotion || 'NEUTRAL'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(distribution).sort(([,a], [,b]) => b - a).map(([emo, score]) => (
                <div key={emo} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 8, color: '#3a4a5a', width: 55 }}>{EMOTION_LABELS[emo] || emo}</span>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${((score as number) / maxEmotion) * 100}%`, height: '100%', background: mood?.dominant_color || '#64748b', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 8, color: '#3a4a5a', width: 28, textAlign: 'right' }}>
                    {((score as number) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active governorates list */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 14, flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 8 }}>
              <MapPin size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> GOVERNORATES
            </div>
            {Object.entries(govs).sort(([, a], [, b]) => b.total_mentions - a.total_mentions).map(([id, g]) => {
              const active = g.total_mentions > 0;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: active ? g.dominant_color : '#2a3a4a' }} />
                  <span style={{ fontSize: 9, color: active ? '#c9d1e0' : '#3a4a5a', flex: 1 }}>{g.name}</span>
                  {active ? (
                    <>
                      <span style={{ fontSize: 8, color: g.dominant_color, fontWeight: 600 }}>
                        {EMOTION_LABELS[g.dominant_emotion] || g.dominant_emotion}
                      </span>
                      <span style={{ fontSize: 8, color: '#3a4a5a', width: 24, textAlign: 'right' }}>{g.total_mentions}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 7, color: '#2a3a4a', letterSpacing: 1 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionalHeatmapView;
