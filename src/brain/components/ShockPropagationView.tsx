import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { usePipeline } from '../../context/PipelineContext';
import {
  simulatePropagation,
  compareToHistorical,
  HISTORICAL_WAVES,
  type PropagationResult,
  type HistoricalWave,
} from '../../services/propagationEngine';
import govData from '../../data/governorates.json';

const PROJECT_X = (lon: number) => (lon - 7.5) / (11.6 - 7.5) * 100 - 50;
const PROJECT_Y = (lat: number) => -((lat - 30.2) / (37.5 - 30.2) * 80 - 40);

interface GovPosition {
  id: string; name: string; x: number; y: number; riskScore: number;
}

const GOV_POSITIONS: GovPosition[] = (govData.governorates as any[]).map((g) => ({
  id: g.id, name: g.name?.en || g.id,
  x: PROJECT_X(g.lon), y: PROJECT_Y(g.lat),
  riskScore: g.rri_score ?? 1.5,
}));
const GOV_MAP = Object.fromEntries(GOV_POSITIONS.map((g) => [g.id, g]));
const ADJACENCY = govData.adjacency_graph as Record<string, string[]>;

const riskColor = (s: number): string => s >= 2.5 ? '#ef4444' : s >= 2.0 ? '#f59e0b' : s >= 1.5 ? '#eab308' : '#22c55e';
const nodeColor = (status: string, prob: number): string => {
  if (status === 'origin') return '#ef4444';
  if (status === 'high') return `hsl(0,80%,${40 + prob * 30}%)`;
  if (status === 'medium') return `hsl(38,90%,${40 + prob * 30}%)`;
  if (status === 'low') return `hsl(48,80%,${45 + prob * 20}%)`;
  return '#475569';
};

const ANIM_DURATION = 120;

const Scene: React.FC<{
  govs: GovPosition[]; adj: Record<string, string[]>;
  result: PropagationResult | null; animDay: number; isAnimating: boolean;
  hoveredId: string | null; setHoveredId: (id: string | null) => void;
  selectedId: string; onSelect: (id: string) => void;
}> = ({ govs, adj, result, animDay, isAnimating, hoveredId, setHoveredId, selectedId, onSelect }) => {
  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 5]} intensity={0.3} color="#a78bfa" />

      {/* Ground glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[120, 100]} />
        <meshBasicMaterial color="#0a0a0f" />
      </mesh>

      {/* Edges as lines */}
      {govs.map((gov) =>
        (adj[gov.id] || []).map((nId) => {
          if (nId < gov.id) return null;
          const n = GOV_MAP[nId];
          if (!n) return null;
          const rq = result?.nodes[gov.id];
          const rs = result?.nodes[nId];
          const active = (rq && rq.status !== 'unreachable') || (rs && rs.status !== 'unreachable');
          return (
            <Line key={`e-${gov.id}-${nId}`}
              points={[[gov.x, 0, gov.y], [n.x, 0, n.y]]}
              color={active ? '#6366f1' : '#1e293b'}
              transparent opacity={active ? 0.5 : 0.2}
              lineWidth={0.5}
            />
          );
        })
      )}

      {/* Nodes */}
      {govs.map((gov) => {
        const node = result?.nodes[gov.id];
        const show = !node || !isAnimating || animDay >= (node.expectedDays || 0) || node.status === 'origin';
        const isSel = selectedId === gov.id;
        const isHov = hoveredId === gov.id;
        const s = node ? nodeColor(node.status, node.probability) : '#475569';
        const rc = riskColor(gov.riskScore);
        const scale = isSel ? 1.6 : isHov ? 1.3 : 1;
        const r = isSel ? 0.35 : 0.25;

        return (
          <group key={gov.id}>
            {/* Highlight ring for high-risk */}
            {node?.status === 'high' && show && (
              <mesh position={[gov.x, -0.05, gov.y]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[r * 1.3, r * 1.8, 16]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.2} side={THREE.DoubleSide} />
              </mesh>
            )}
            {/* Main sphere */}
            <mesh position={[gov.x, 0, gov.y]} scale={scale}
              onClick={() => onSelect(gov.id)}
              onPointerOver={() => setHoveredId(gov.id)}
              onPointerOut={() => setHoveredId(null)}
            >
              <sphereGeometry args={[r, 16, 16]} />
              <meshStandardMaterial color={s} emissive={s} emissiveIntensity={isSel ? 0.5 : 0.1} />
            </mesh>
            {/* Risk ring */}
            <mesh position={[gov.x, -0.01, gov.y]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r * 1.1, r * 1.4, 16]} />
              <meshBasicMaterial color={rc} transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
            {/* Label */}
            <Text position={[gov.x, -0.35, gov.y]} fontSize={0.12} color={show ? '#cbd5e1' : '#475569'} anchorX="center" anchorY="middle">{gov.name}</Text>
            {/* Probability */}
            {node && show && node.status !== 'unreachable' && (
              <Text position={[gov.x, 0.05, gov.y]} fontSize={0.08} color="white" anchorX="center" anchorY="middle">
                {Math.round(node.probability * 100)}%
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
};

const ShockPropagationView: React.FC = () => {
  const { rriState } = usePipeline();
  const cascadeProb = rriState?.cascade_probability ?? 0.58;
  const rri = rriState?.rri ?? 2.31;

  const [originId, setOriginId] = useState('tunis');
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
    const sim = simulatePropagation(originId, origin.name, ADJACENCY, govData.governorates as any[], cascadeProb, maxDays);
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
    const t = setTimeout(() => setAnimDay((d) => d + 1), ANIM_DURATION);
    return () => clearTimeout(t);
  }, [isAnimating, animDay, maxDays, result]);

  const sirData = result?.sirData ?? [];
  const sirW = 480, sirH = 120;
  const sirToX = (d: number) => (d / maxDays) * sirW;
  const sirToY = (v: number) => sirH - v * sirH;
  const pathD = (k: 'S' | 'I' | 'R') =>
    sirData.map((p, i) => `${i === 0 ? 'M' : 'L'}${sirToX(p.day).toFixed(1)},${sirToY((p as any)[k]).toFixed(1)}`).join(' ');

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', color: '#e2e8f0', fontFamily: 'monospace', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0, background: 'rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, letterSpacing: 2 }}>SHOCK PROPAGATION — EQ.17</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>
          RRI <span style={{ color: rri >= 2.5 ? '#ef4444' : rri >= 2.0 ? '#f59e0b' : '#22c55e' }}>{rri.toFixed(2)}</span>
          {' | '}CASCADE <span style={{ color: '#a78bfa' }}>{(cascadeProb * 100).toFixed(0)}%</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['map', 'sir', 'history'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background: activeTab === tab ? 'rgba(99,102,241,0.3)' : 'transparent', border: '1px solid rgba(99,102,241,0.4)', color: activeTab === tab ? '#a78bfa' : '#64748b', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 10, textTransform: 'uppercase' }}>
              {tab === 'sir' ? 'SIR Model' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '6px 20px', borderBottom: '1px solid rgba(30,41,59,0.8)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, background: 'rgba(0,0,0,0.4)' }}>
        <label style={{ fontSize: 10, color: '#94a3b8' }}>ORIGIN</label>
        <select value={originId} onChange={(e) => setOriginId(e.target.value)}
          style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.4)', color: '#e2e8f0', padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
          {GOV_POSITIONS.sort((a, b) => a.name.localeCompare(b.name)).map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <label style={{ fontSize: 10, color: '#94a3b8' }}>HORIZON</label>
        <select value={maxDays} onChange={(e) => setMaxDays(Number(e.target.value))}
          style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.4)', color: '#e2e8f0', padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
          {[14, 30, 60, 90].map((d) => <option key={d} value={d}>{d}d</option>)}
        </select>
        <button onClick={() => { setAnimDay(0); setIsAnimating(true); }}
          style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)', color: '#a78bfa', padding: '4px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>
          ▶ ANIMATE
        </button>
        {isAnimating && (
          <button onClick={() => setIsAnimating(false)}
            style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', padding: '4px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>
            ■ STOP
          </button>
        )}
        {isAnimating && <div style={{ fontSize: 10, color: '#64748b' }}>DAY <span style={{ color: '#a78bfa' }}>{animDay}</span> / {maxDays}</div>}
        {result && (
          <div style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b' }}>
            {Object.values(result.nodes).filter((n) => n.status !== 'unreachable').length} reached
            {' | '}<span style={{ color: '#f59e0b' }}>{Object.values(result.nodes).filter((n) => n.status === 'high').length} HIGH</span>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'map' ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas camera={{ position: [0, 30, 0], fov: 40 }}>
            <OrbitControls enablePan enableZoom enableRotate minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            <Scene
              govs={GOV_POSITIONS} adj={ADJACENCY} result={result}
              animDay={animDay} isAnimating={isAnimating}
              hoveredId={hoveredGov} setHoveredId={setHoveredGov}
              selectedId={originId} onSelect={(id) => setOriginId(id)}
            />
          </Canvas>

          {/* Tooltip overlay */}
          {hoveredGov && result?.nodes[hoveredGov] && (
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, padding: '10px 14px', fontSize: 10, minWidth: 180, pointerEvents: 'none' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>{result.nodes[hoveredGov].governorateName}</div>
              <div style={{ color: '#94a3b8' }}>Probability: <span style={{ color: '#e2e8f0' }}>{(result.nodes[hoveredGov].probability * 100).toFixed(1)}%</span></div>
              <div style={{ color: '#94a3b8' }}>Day: <span style={{ color: '#e2e8f0' }}>{result.nodes[hoveredGov].expectedDays}</span></div>
              <div style={{ color: '#94a3b8' }}>Status: <span style={{ color: result.nodes[hoveredGov].status === 'high' ? '#ef4444' : result.nodes[hoveredGov].status === 'medium' ? '#f59e0b' : result.nodes[hoveredGov].status === 'origin' ? '#ef4444' : '#64748b' }}>{result.nodes[hoveredGov].status.toUpperCase()}</span></div>
              <div style={{ color: '#475569', marginTop: 4, fontSize: 9 }}>Path: {result.nodes[hoveredGov].path.join(' > ')}</div>
            </div>
          )}

          {/* Sidebar */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, borderLeft: '1px solid rgba(30,41,59,0.8)', padding: '14px 12px', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 8, letterSpacing: 1 }}>LEGEND</div>
            {[{ label: 'Origin', color: '#ef4444' }, { label: 'High >=60%', color: 'rgba(239,68,68,0.7)' }, { label: 'Medium >=30%', color: 'rgba(245,158,11,0.7)' }, { label: 'Low <30%', color: 'rgba(234,179,8,0.5)' }, { label: 'Unreachable', color: 'rgba(100,116,139,0.3)' }].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} /><span style={{ fontSize: 10, color: '#94a3b8' }}>{l.label}</span>
              </div>
            ))}
            {result && (
              <>
                <div style={{ fontSize: 9, color: '#64748b', margin: '10 0 6 0', letterSpacing: 1 }}>STATS</div>
                {[{ label: 'Origin', value: result.originName }, { label: 'Cascade P', value: `${(result.cascadeProbability * 100).toFixed(0)}%` }, { label: 'Horizon', value: `${result.maxReach}d` }, { label: 'Reachable', value: Object.values(result.nodes).filter((n) => n.status !== 'unreachable').length }, { label: 'High risk', value: Object.values(result.nodes).filter((n) => n.status === 'high').length }].map((s) => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{s.label}</span>
                    <span style={{ fontSize: 10, color: '#e2e8f0' }}>{s.value}</span>
                  </div>
                ))}
              </>
            )}
            {historicalMatch && (
              <>
                <div style={{ fontSize: 9, color: '#64748b', margin: '10 0 6 0', letterSpacing: 1 }}>HIST. MATCH</div>
                <div style={{ fontSize: 10, color: '#a78bfa', marginBottom: 4 }}>{historicalMatch.wave.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Similarity: <span style={{ color: '#e2e8f0' }}>{(historicalMatch.score * 100).toFixed(0)}%</span></div>
              </>
            )}
            <div style={{ marginTop: 20, fontSize: 9, color: '#475569' }}>Orbit & zoom to explore. Click node to set origin.</div>
          </div>
        </div>
      ) : activeTab === 'sir' ? (
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 12, color: '#a78bfa', letterSpacing: 1 }}>SIR PROTEST SPREAD — EQ.4</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>dS/dt = -B*S*I | dI/dt = B*S*I - G*I | dR/dt = G*I &nbsp; B = {(0.4 * (0.5 + cascadeProb)).toFixed(3)} | G = 0.150</div>
          {sirData.length > 0 && (
            <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(30,41,59,0.8)', borderRadius: 8, padding: 24 }}>
              <svg width={sirW} height={sirH} style={{ overflow: 'visible' }}>
                {[0.25, 0.5, 0.75].map((v) => (<line key={v} x1={0} y1={sirToY(v)} x2={sirW} y2={sirToY(v)} stroke="rgba(30,41,59,0.8)" strokeWidth={1} strokeDasharray="4,4" />))}
                <path d={pathD('S')} fill="none" stroke="#22c55e" strokeWidth={2} />
                <path d={pathD('I')} fill="none" stroke="#ef4444" strokeWidth={2} />
                <path d={pathD('R')} fill="none" stroke="#64748b" strokeWidth={2} />
              </svg>
              <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                {[{ key: 'S', label: 'Susceptible', color: '#22c55e' }, { key: 'I', label: 'Infected (Protesting)', color: '#ef4444' }, { key: 'R', label: 'Recovered', color: '#64748b' }].map((l) => (
                  <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 18, height: 2, background: l.color }} /><span style={{ fontSize: 10, color: '#94a3b8' }}>{l.label}</span></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                {[{ label: 'Peak infected', value: `${(Math.max(...sirData.map((p) => p.I)) * 100).toFixed(1)}%` }, { label: 'Peak day', value: 1 + sirData.indexOf(sirData.reduce((b, p) => p.I > b.I ? p : b, sirData[0])) }, { label: 'R0', value: (0.4 * (0.5 + cascadeProb) / 0.15).toFixed(2) }].map((m) => (
                  <div key={m.label} style={{ background: 'rgba(30,41,59,0.6)', borderRadius: 6, padding: '10px 16px' }}>
                    <div style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 16, color: '#e2e8f0', fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, color: '#a78bfa', letterSpacing: 1, marginBottom: 16 }}>HISTORICAL WAVE COMPARISON</div>
          {HISTORICAL_WAVES.map((wave) => {
            const score = result ? compareToHistorical(result, wave) : 0;
            return (
              <div key={wave.name} style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${score > 0.4 ? 'rgba(239,68,68,0.4)' : 'rgba(30,41,59,0.8)'}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 700 }}>{wave.name}</span>
                  <span style={{ fontSize: 11, color: score > 0.4 ? '#ef4444' : '#64748b' }}>{(score * 100).toFixed(0)}% match</span>
                </div>
                <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 10 }}>{wave.outcome}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {wave.steps.map((step) => (
                    <span key={step.governorateId} style={{ background: 'rgba(30,41,59,0.8)', borderRadius: 4, padding: '3px 8px', fontSize: 9, border: `1px solid ${step.intensity > 0.7 ? 'rgba(239,68,68,0.4)' : 'rgba(30,41,59,0.8)'}` }}>
                      <span style={{ color: '#94a3b8' }}>D{step.day} </span><span style={{ color: '#e2e8f0' }}>{step.governorateId}</span><span style={{ color: '#64748b' }}> {(step.intensity * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShockPropagationView;
