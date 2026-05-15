import React, { useState, useEffect, useCallback } from 'react';
import { usePipeline } from '../../context/PipelineContext';
import {
  simulatePropagation,
  compareToHistorical,
  HISTORICAL_WAVES,
  type PropagationResult,
  type HistoricalWave,
} from '../../services/propagationEngine';
import govData from '../../data/governorates.json';

// ── Tunisia map projection ─────────────────────────────────────
// Bounding box: lon 7.5–11.6, lat 30.2–37.5
const PROJECT_X = (lon: number) => ((lon - 7.5) / (11.6 - 7.5)) * 800 - 400;
const PROJECT_Y = (lat: number) => -(((lat - 30.2) / (37.5 - 30.2)) * 600 - 300);

interface GovPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  riskScore: number;
}

const GOV_POSITIONS: GovPosition[] = (govData.governorates as any[]).map((g) => ({
  id: g.id,
  name: g.name?.en || g.id,
  x: PROJECT_X(g.lon),
  y: PROJECT_Y(g.lat),
  riskScore: g.rri_score ?? 1.5,
}));

const GOV_MAP = Object.fromEntries(GOV_POSITIONS.map((g) => [g.id, g]));
const ADJACENCY = govData.adjacency_graph as Record<string, string[]>;

// ── Color helpers ──────────────────────────────────────────────
const statusColor = (status: string, prob: number): string => {
  if (status === 'origin')  return '#ef4444';
  if (status === 'high')    return `rgba(239,68,68,${0.4 + prob * 0.6})`;
  if (status === 'medium')  return `rgba(245,158,11,${0.4 + prob * 0.6})`;
  if (status === 'low')     return `rgba(234,179,8,${0.3 + prob * 0.4})`;
  return 'rgba(100,116,139,0.2)';
};

const riskBorderColor = (riskScore: number): string => {
  if (riskScore >= 2.5) return '#ef4444';
  if (riskScore >= 2.0) return '#f59e0b';
  if (riskScore >= 1.5) return '#eab308';
  return '#22c55e';
};

// ── Main Component ─────────────────────────────────────────────
const ShockPropagationView: React.FC = () => {
  const { rriState } = usePipeline();
  const cascadeProb: number = rriState?.cascade_probability ?? 0.58;
  const rri: number = rriState?.rri ?? 2.31;

  const [originId, setOriginId] = useState('kasserine');
  const [maxDays, setMaxDays] = useState(30);
  const [result, setResult] = useState<PropagationResult | null>(null);
  const [historicalMatch, setHistoricalMatch] = useState<{ wave: HistoricalWave; score: number } | null>(null);
  const [animDay, setAnimDay] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'sir' | 'history'>('map');
  const [hoveredGov, setHoveredGov] = useState<string | null>(null);

  const runSim = useCallback(() => {
    const origin = GOV_MAP[originId];
    if (!origin) return;
    const sim = simulatePropagation(
      originId, origin.name, ADJACENCY,
      govData.governorates as any[], cascadeProb, maxDays,
    );
    setResult(sim);
    setAnimDay(0);

    let bestScore = 0;
    let bestWave: HistoricalWave | null = null;
    for (const wave of HISTORICAL_WAVES) {
      const score = compareToHistorical(sim, wave);
      if (score > bestScore) { bestScore = score; bestWave = wave; }
    }
    if (bestWave) setHistoricalMatch({ wave: bestWave, score: bestScore });
  }, [originId, maxDays, cascadeProb]);

  useEffect(() => { runSim(); }, [runSim]);

  useEffect(() => {
    if (!isAnimating || !result) return;
    if (animDay >= maxDays) { setIsAnimating(false); return; }
    const t = setTimeout(() => setAnimDay((d) => d + 1), 120);
    return () => clearTimeout(t);
  }, [isAnimating, animDay, maxDays, result]);

  const visibleNodes = result
    ? Object.values(result.nodes).filter(
        (n) => !isAnimating || n.expectedDays <= animDay || n.status === 'origin'
      )
    : [];
  const visibleIds = new Set(visibleNodes.map((n) => n.governorateId));

  const sirData = result?.sirData ?? [];
  const sirWidth = 480;
  const sirHeight = 120;
  const sirToX = (day: number) => (day / maxDays) * sirWidth;
  const sirToY = (val: number) => sirHeight - val * sirHeight;
  const pathD = (key: 'S' | 'I' | 'R') =>
    sirData.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${sirToX(p.day).toFixed(1)},${sirToY((p as any)[key]).toFixed(1)}`
    ).join(' ');

  return (
    <div style={{
      width: '100vw', height: '100vh', backgroundColor: '#0a0a0f',
      display: 'flex', flexDirection: 'column', color: '#e2e8f0',
      fontFamily: 'monospace', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0,
        background: 'rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 700, letterSpacing: 2 }}>
          SHOCK PROPAGATION ENGINE — EQ.17
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          RRI{' '}
          <span style={{ color: rri >= 2.5 ? '#ef4444' : rri >= 2.0 ? '#f59e0b' : '#22c55e' }}>
            {rri.toFixed(2)}
          </span>
          {' | '}CASCADE P{' '}
          <span style={{ color: '#a78bfa' }}>{(cascadeProb * 100).toFixed(0)}%</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['map', 'sir', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? 'rgba(99,102,241,0.3)' : 'transparent',
              border: '1px solid rgba(99,102,241,0.4)',
              color: activeTab === tab ? '#a78bfa' : '#64748b',
              padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, textTransform: 'uppercase',
            }}>
              {tab === 'sir' ? 'SIR Model' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding: '8px 20px', borderBottom: '1px solid rgba(30,41,59,0.8)',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
        background: 'rgba(0,0,0,0.4)',
      }}>
        <label style={{ fontSize: 11, color: '#94a3b8' }}>ORIGIN</label>
        <select value={originId} onChange={(e) => setOriginId(e.target.value)} style={{
          background: '#1e293b', border: '1px solid rgba(99,102,241,0.4)',
          color: '#e2e8f0', padding: '3px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
        }}>
          {GOV_POSITIONS.sort((a, b) => a.name.localeCompare(b.name)).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <label style={{ fontSize: 11, color: '#94a3b8' }}>HORIZON</label>
        <select value={maxDays} onChange={(e) => setMaxDays(Number(e.target.value))} style={{
          background: '#1e293b', border: '1px solid rgba(99,102,241,0.4)',
          color: '#e2e8f0', padding: '3px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
        }}>
          {[14, 30, 60, 90].map((d) => <option key={d} value={d}>{d}d</option>)}
        </select>

        <button onClick={() => { setAnimDay(0); setIsAnimating(true); }} style={{
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)',
          color: '#a78bfa', padding: '4px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
        }}>
          ▶ ANIMATE
        </button>

        {isAnimating && (
          <button onClick={() => setIsAnimating(false)} style={{
            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
            color: '#ef4444', padding: '4px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
          }}>
            ■ STOP
          </button>
        )}

        {isAnimating && (
          <div style={{ fontSize: 11, color: '#64748b' }}>
            DAY <span style={{ color: '#a78bfa' }}>{animDay}</span> / {maxDays}
          </div>
        )}

        {result && (
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
            {Object.values(result.nodes).filter((n) => n.status !== 'unreachable').length} governorates reached
            {' | '}
            <span style={{ color: '#f59e0b' }}>
              {Object.values(result.nodes).filter((n) => n.status === 'high').length} HIGH
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* MAP */}
        {activeTab === 'map' && (
          <>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <svg width="100%" height="100%" viewBox="-450 -330 900 660" style={{ display: 'block' }}>
                {/* Edges */}
                {GOV_POSITIONS.map((gov) =>
                  (ADJACENCY[gov.id] || []).map((nId) => {
                    const n = GOV_MAP[nId];
                    if (!n || nId < gov.id) return null;
                    const both = visibleIds.has(gov.id) && visibleIds.has(nId);
                    return (
                      <line key={`${gov.id}-${nId}`}
                        x1={gov.x} y1={gov.y} x2={n.x} y2={n.y}
                        stroke={both ? 'rgba(99,102,241,0.35)' : 'rgba(30,41,59,0.4)'}
                        strokeWidth={both ? 1.5 : 0.8}
                      />
                    );
                  })
                )}

                {/* Wave ring */}
                {result && isAnimating && (
                  <circle
                    cx={GOV_MAP[originId]?.x ?? 0} cy={GOV_MAP[originId]?.y ?? 0}
                    r={animDay * 3.5} fill="none"
                    stroke="rgba(239,68,68,0.15)" strokeWidth={1}
                  />
                )}

                {/* Nodes */}
                {GOV_POSITIONS.map((gov) => {
                  const node = result?.nodes[gov.id];
                  const isVisible = visibleIds.has(gov.id);
                  const isHovered = hoveredGov === gov.id;
                  const fill = node && isVisible
                    ? statusColor(node.status, node.probability)
                    : 'rgba(30,41,59,0.6)';
                  const r = node?.status === 'origin' ? 14 : isHovered ? 11 : 9;
                  return (
                    <g key={gov.id}
                      onMouseEnter={() => setHoveredGov(gov.id)}
                      onMouseLeave={() => setHoveredGov(null)}
                      onClick={() => setOriginId(gov.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {node?.status === 'high' && isVisible && (
                        <circle cx={gov.x} cy={gov.y} r={r + 6}
                          fill="none" stroke="rgba(239,68,68,0.25)" strokeWidth={4} />
                      )}
                      <circle cx={gov.x} cy={gov.y} r={r}
                        fill={fill}
                        stroke={riskBorderColor(gov.riskScore)}
                        strokeWidth={node?.status === 'origin' ? 2.5 : 1.5}
                      />
                      <text x={gov.x} y={gov.y + r + 10}
                        textAnchor="middle" fontSize={isHovered ? 11 : 9}
                        fill={isVisible ? '#e2e8f0' : '#475569'}
                      >
                        {gov.name}
                      </text>
                      {node && isVisible && node.status !== 'unreachable' && (
                        <text x={gov.x} y={gov.y + 3}
                          textAnchor="middle" fontSize={8} fill="white" fontWeight="bold"
                        >
                          {Math.round(node.probability * 100)}%
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover tooltip */}
              {hoveredGov && result?.nodes[hoveredGov] && (
                <div style={{
                  position: 'absolute', top: 60, left: 20,
                  background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: 6, padding: '10px 14px', fontSize: 11, minWidth: 200, pointerEvents: 'none',
                }}>
                  <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 6 }}>
                    {result.nodes[hoveredGov].governorateName}
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    Probability:{' '}
                    <span style={{ color: '#e2e8f0' }}>
                      {(result.nodes[hoveredGov].probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    Expected day:{' '}
                    <span style={{ color: '#e2e8f0' }}>{result.nodes[hoveredGov].expectedDays}</span>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    Status:{' '}
                    <span style={{
                      color: result.nodes[hoveredGov].status === 'high' ? '#ef4444'
                        : result.nodes[hoveredGov].status === 'medium' ? '#f59e0b'
                        : result.nodes[hoveredGov].status === 'origin' ? '#ef4444'
                        : '#64748b'
                    }}>
                      {result.nodes[hoveredGov].status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ color: '#64748b', marginTop: 4, fontSize: 10 }}>
                    Path: {result.nodes[hoveredGov].path.join(' → ')}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{
              width: 220, borderLeft: '1px solid rgba(30,41,59,0.8)',
              padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 16,
              background: 'rgba(0,0,0,0.4)', overflowY: 'auto', flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, letterSpacing: 1 }}>LEGEND</div>
                {[
                  { label: 'Origin', color: '#ef4444' },
                  { label: 'High ≥60%', color: 'rgba(239,68,68,0.7)' },
                  { label: 'Medium ≥30%', color: 'rgba(245,158,11,0.7)' },
                  { label: 'Low <30%', color: 'rgba(234,179,8,0.5)' },
                  { label: 'Unreachable', color: 'rgba(100,116,139,0.3)' },
                ].map((l) => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {result && (
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, letterSpacing: 1 }}>STATS</div>
                  {[
                    { label: 'Origin', value: result.originName },
                    { label: 'Cascade P', value: `${(result.cascadeProbability * 100).toFixed(0)}%` },
                    { label: 'Horizon', value: `${result.maxReach}d` },
                    { label: 'Reachable', value: Object.values(result.nodes).filter((n) => n.status !== 'unreachable').length },
                    { label: 'High risk', value: Object.values(result.nodes).filter((n) => n.status === 'high').length },
                    { label: 'Peak I', value: `${(Math.max(...result.sirData.map((p) => p.I)) * 100).toFixed(1)}%` },
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
                      <span style={{ fontSize: 11, color: '#e2e8f0' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {historicalMatch && (
                <div>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, letterSpacing: 1 }}>HIST. MATCH</div>
                  <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 4 }}>{historicalMatch.wave.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                    Similarity:{' '}
                    <span style={{ color: '#e2e8f0' }}>{(historicalMatch.score * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{historicalMatch.wave.outcome}</div>
                </div>
              )}

              <div style={{ marginTop: 'auto', fontSize: 10, color: '#475569' }}>
                Click node to set origin. EQ.17 cascade P feeds BFS propagation with historical transmission boosts.
              </div>
            </div>
          </>
        )}

        {/* SIR TAB */}
        {activeTab === 'sir' && (
          <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 13, color: '#a78bfa', letterSpacing: 1 }}>SIR PROTEST SPREAD — EQ.4</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              dS/dt = −β·S·I | dI/dt = β·S·I − γ·I | dR/dt = γ·I
              &nbsp;&nbsp; β = {(0.4 * (0.5 + cascadeProb)).toFixed(3)} | γ = 0.150
            </div>
            {sirData.length > 0 && (
              <div style={{
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)',
                borderRadius: 8, padding: 24,
              }}>
                <svg width={sirWidth} height={sirHeight} style={{ overflow: 'visible' }}>
                  {[0.25, 0.5, 0.75].map((v) => (
                    <line key={v} x1={0} y1={sirToY(v)} x2={sirWidth} y2={sirToY(v)}
                      stroke="rgba(30,41,59,0.8)" strokeWidth={1} strokeDasharray="4,4" />
                  ))}
                  <path d={pathD('S')} fill="none" stroke="#22c55e" strokeWidth={2} />
                  <path d={pathD('I')} fill="none" stroke="#ef4444" strokeWidth={2} />
                  <path d={pathD('R')} fill="none" stroke="#64748b" strokeWidth={2} />
                </svg>
                <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                  {[
                    { key: 'S', label: 'Susceptible', color: '#22c55e' },
                    { key: 'I', label: 'Infected (Protesting)', color: '#ef4444' },
                    { key: 'R', label: 'Recovered', color: '#64748b' },
                  ].map((l) => (
                    <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 2, background: l.color }} />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
                  {[
                    { label: 'Peak infected', value: `${(Math.max(...sirData.map((p) => p.I)) * 100).toFixed(1)}%` },
                    { label: 'Peak day', value: sirData.indexOf(sirData.reduce((b, p) => p.I > b.I ? p : b, sirData[0])) },
                    { label: 'R₀', value: (0.4 * (0.5 + cascadeProb) / 0.15).toFixed(2) },
                    { label: 'Final recovered', value: `${((sirData[sirData.length - 1]?.R ?? 0) * 100).toFixed(1)}%` },
                  ].map((m) => (
                    <div key={m.label} style={{
                      background: 'rgba(30,41,59,0.6)', borderRadius: 6, padding: '10px 16px',
                    }}>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 18, color: '#e2e8f0', fontWeight: 700 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
            <div style={{ fontSize: 13, color: '#a78bfa', letterSpacing: 1, marginBottom: 20 }}>
              HISTORICAL WAVE COMPARISON
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {HISTORICAL_WAVES.map((wave) => {
                const score = result ? compareToHistorical(result, wave) : 0;
                return (
                  <div key={wave.name} style={{
                    background: 'rgba(15,23,42,0.8)',
                    border: `1px solid ${score > 0.4 ? 'rgba(239,68,68,0.4)' : 'rgba(30,41,59,0.8)'}`,
                    borderRadius: 8, padding: 20,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700 }}>{wave.name}</div>
                      <div style={{ fontSize: 12, color: score > 0.4 ? '#ef4444' : '#64748b' }}>
                        {(score * 100).toFixed(0)}% match
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 12 }}>{wave.outcome}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {wave.steps.map((step) => (
                        <div key={step.governorateId} style={{
                          background: 'rgba(30,41,59,0.8)', borderRadius: 4, padding: '4px 10px', fontSize: 10,
                          border: `1px solid ${step.intensity > 0.7 ? 'rgba(239,68,68,0.4)' : 'rgba(30,41,59,0.8)'}`,
                        }}>
                          <span style={{ color: '#94a3b8' }}>D{step.day} </span>
                          <span style={{ color: '#e2e8f0' }}>{step.governorateId}</span>
                          <span style={{ color: '#64748b' }}> {(step.intensity * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShockPropagationView;
