import React, { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { usePipeline } from '../../context/PipelineContext';

const DOMAINS = [
  { key: 'economy',   label: 'ECONOMY',    keys: ['A', 'W'],       color: '#f97316' },
  { key: 'governance',label: 'GOVERN',     keys: ['D', 'G', 'L'],  color: '#a78bfa' },
  { key: 'security',  label: 'SECURITY',   keys: ['N', 'J'],       color: '#ef4444' },
  { key: 'social',    label: 'SOCIAL',     keys: ['E', 'F', 'S'],  color: '#22c55e' },
  { key: 'narrative', label: 'NARRATIVE',  keys: ['H', 'O'],       color: '#facc15' },
  { key: 'geopolitical', label: 'GEO',     keys: ['I', 'R', 'Q'],  color: '#00f2ff' },
];

const DOMAIN_WEIGHTS: Record<string, number> = {
  A: 0.20, W: 0.01, D: 0.08, G: 0.05, L: 0.06,
  N: 0.06, J: 0.04, E: 0.07, F: 0.05, S: 0.02,
  H: 0.04, O: 0.04, I: 0.05, R: 0.02, Q: 0.02,
};

function computeScore(keys: string[], scores: Record<string, number>): number {
  const total = keys.reduce((s, k) => s + (DOMAIN_WEIGHTS[k] ?? 0), 0);
  if (total === 0) return 5;
  const weighted = keys.reduce(
    (s, k) => s + (DOMAIN_WEIGHTS[k] ?? 0) * ((scores[k] ?? 0.5) * 10), 0
  );
  return Math.round((weighted / total) * 10) / 10;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#070a0f] border border-intel-border rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">{d.fullLabel}</div>
      <div className="text-[11px] font-mono font-bold text-intel-cyan">{d.current.toFixed(1)} <span className="text-slate-500 font-normal">/ 10</span></div>
      <div className="text-[9px] font-mono text-slate-500">trend {d.trend >= d.current ? '▲' : '▼'} {d.trend.toFixed(1)}</div>
    </div>
  );
};

export const RRIDomainRadar: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { rriState } = usePipeline();
  const [showTrend, setShowTrend] = useState(false);

  const categoryScores: Record<string, number> = rriState?.category_scores ?? {};
  const velocity = rriState?.velocity ?? 0;

  const chartData = DOMAINS.map(d => {
    const current = computeScore(d.keys, categoryScores);
    const trend = Math.max(0, Math.min(10, current + velocity * 2));
    return {
      domain: d.label,
      fullLabel: d.key.charAt(0).toUpperCase() + d.key.slice(1),
      current,
      trend,
    };
  });

  const h = compact ? 180 : 240;

  return (
    <div className="glass-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          Domain Pressure Radar
        </div>
        <button
          onClick={() => setShowTrend(v => !v)}
          aria-label={showTrend ? 'Show current values' : 'Show trend projection'}
          className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
            showTrend
              ? 'border-intel-cyan/40 text-intel-cyan bg-intel-cyan/10'
              : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
          }`}
        >
          {showTrend ? 'TREND' : 'CURRENT'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={h}>
        <RadarChart data={chartData} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
          <PolarGrid
            gridType="polygon"
            stroke="rgba(255,255,255,0.05)"
          />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'monospace', fontWeight: 700 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fill: '#374151', fontSize: 7, fontFamily: 'monospace' }}
            tickCount={4}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name={showTrend ? 'Trend' : 'Current'}
            dataKey={showTrend ? 'trend' : 'current'}
            stroke="#00f2ff"
            fill="#00f2ff"
            fillOpacity={0.12}
            strokeWidth={1.5}
            dot={{ fill: '#00f2ff', r: 2 }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-1">
        {DOMAINS.map(d => {
          const val = computeScore(d.keys, categoryScores);
          return (
            <div key={d.key} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[9px] font-mono text-slate-500 uppercase">{d.label}</span>
              <span className="text-[9px] font-mono ml-auto" style={{ color: val > 6 ? '#ef4444' : val > 4 ? '#f97316' : '#32d74b' }}>
                {val.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
