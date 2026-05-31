import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, AlertTriangle, CheckCircle, Clock, GitBranch, BarChart3 } from 'lucide-react';

const BASE = 'http://localhost:8000';

interface Scenario {
  scenario_id: string;
  scenario_name: string;
  scenario_type: string;
  description: string;
  shock_vector: Record<string, number>;
  tags: string[];
  historical_basis?: string;
}

interface RRIPoint {
  day: number;
  mean: number;
  p10: number;
  p90: number;
}

interface SimRun {
  run_id: string;
  scenario_name: string;
  scenario_type: string;
  status: string;
  base_rri: number;
  base_p_revolution: number;
  time_horizon_days: number;
  mc_iterations: number;
  outcome_distribution: Record<string, number>;
  p_revolution_range: { mean: number; p10: number; p50: number; p90: number };
  rri_trajectory: RRIPoint[];
  governorate_risk_delta: Record<string, number>;
  elite_fracture_probability: number;
  military_posture_shift: number;
  ugtt_strike_probability: number;
  sensitivity_ranking: { variable: string; impact_magnitude: number }[];
  activated_chain_ids: string[];
  historical_analogue?: string;
  analogue_similarity?: number;
  duration_ms?: number;
  started_at?: string;
  completed_at?: string;
}

const PHASE_COLORS: Record<string, string> = {
  stable: '#22c55e', elevated: '#ffd60a', crisis: '#ff9f0a',
  acute_crisis: '#ff2d55', transition: '#a78bfa',
};

const typeColors: Record<string, string> = {
  policy_decision: '#3b82f6', shock_injection: '#ff9f0a',
  black_swan: '#ef4444', compound: '#a78bfa',
};

const SimulationChamber: React.FC = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [runs, setRuns] = useState<SimRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<SimRun | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/simulation/scenarios`);
      if (res.ok) setScenarios(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/simulation/runs?limit=20`);
      if (res.ok) setRuns(await res.json());
    } catch {}
  }, []);

  const runSimulation = useCallback(async () => {
    if (!selectedScenario) return;
    setRunning(true);
    try {
      const res = await fetch(`${BASE}/api/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: selectedScenario, mc_iterations: 500, time_horizon_days: 30 }),
      });
      if (res.ok) {
        const data = await res.json();
        // Poll for completion
        const poll = async () => {
          const r = await fetch(`${BASE}/api/simulation/runs/${data.run_id}`);
          if (r.ok) {
            const run = await r.json();
            if (run.status === 'complete') {
              setSelectedRun(run);
              setRuns(prev => [run, ...prev]);
              setRunning(false);
            } else if (run.status === 'failed') {
              setRunning(false);
            } else {
              setTimeout(poll, 1000);
            }
          } else { setRunning(false); }
        };
        setTimeout(poll, 500);
      } else { setRunning(false); }
    } catch { setRunning(false); }
  }, [selectedScenario]);

  useEffect(() => { fetchScenarios(); fetchRuns(); }, [fetchScenarios, fetchRuns]);

  const types = ['all', ...new Set(scenarios.map(s => s.scenario_type))];
  const filtered = typeFilter === 'all' ? scenarios : scenarios.filter(s => s.scenario_type === typeFilter);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#040609', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BarChart3 className="w-6 h-6 animate-spin" style={{ color: '#00f2ff' }} />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: '#040609',
      display: 'flex', flexDirection: 'column',
      padding: '60px 20px 44px', gap: 10,
      fontFamily: '"IBM Plex Mono",monospace', color: '#e2e8f0', overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        borderBottom: '1px solid rgba(0,180,180,0.28)', paddingBottom: 8,
      }}>
        <BarChart3 size={18} color="#00f2ff" />
        <span style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(0,200,200,0.6)', fontWeight: 600 }}>SIMULATION CHAMBER</span>
        <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)' }}>
          {scenarios.length} scenarios · {runs.length} runs
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, alignItems: 'center' }}>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              background: typeFilter === t ? 'rgba(0,242,255,0.12)' : 'transparent',
              border: `1px solid ${typeFilter === t ? 'rgba(0,242,255,0.45)' : 'rgba(0,180,180,0.28)'}`,
              color: typeFilter === t ? '#00f2ff' : 'rgba(148,163,184,0.35)',
              padding: '2px 8px', borderRadius: 3, cursor: 'pointer',
              fontSize: 8, letterSpacing: 1, textTransform: 'uppercase',
            }}>{t}</button>
          ))}
        </div>
        <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)} style={{
          background: 'rgba(4,6,9,0.9)', border: '1px solid rgba(0,242,255,0.3)',
          color: '#00f2ff', padding: '3px 8px', borderRadius: 3, fontSize: 10, cursor: 'pointer', outline: 'none',
        }}>
          <option value="">Select scenario...</option>
          {filtered.map(s => <option key={s.scenario_id} value={s.scenario_id}>{s.scenario_name}</option>)}
        </select>
        <button onClick={runSimulation} disabled={!selectedScenario || running} style={{
          background: running ? 'rgba(255,214,10,0.12)' : 'rgba(0,242,255,0.07)',
          border: `1px solid ${running ? 'rgba(255,214,10,0.5)' : 'rgba(0,242,255,0.25)'}`,
          color: running ? '#ffd60a' : '#00f2ff', padding: '4px 14px', borderRadius: 3,
          cursor: running ? 'wait' : 'pointer', fontSize: 10, letterSpacing: 1,
        }}>
          {running ? '...' : <><Play size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />RUN</>}
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: Scenario List */}
        <div style={{ width: 260, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(s => (
            <div key={s.scenario_id} onClick={() => setSelectedScenario(s.scenario_id)} style={{
              background: selectedScenario === s.scenario_id ? 'rgba(0,242,255,0.08)' : 'rgba(4,6,9,0.6)',
              border: `1px solid ${selectedScenario === s.scenario_id ? 'rgba(0,242,255,0.4)' : 'rgba(0,180,180,0.15)'}`,
              borderRadius: 6, padding: '7px 10px', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: typeColors[s.scenario_type] || '#64748b',
                }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.scenario_name}
                </span>
              </div>
              <div style={{ fontSize: 7, color: 'rgba(148,163,184,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.description}
              </div>
              <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 6, color: typeColors[s.scenario_type] || '#64748b', background: `${typeColors[s.scenario_type] || '#64748b'}22`, padding: '1px 4px', borderRadius: 2 }}>
                  {s.scenario_type}
                </span>
                {s.tags.slice(0, 2).map(t => (
                  <span key={t} style={{ fontSize: 6, color: 'rgba(148,163,184,0.35)', background: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: 2 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Recent Runs */}
          {runs.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid rgba(0,180,180,0.15)', paddingTop: 8 }}>
              <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 6 }}>RECENT RUNS</div>
              {runs.slice(0, 5).map(r => (
                <div key={r.run_id} onClick={() => setSelectedRun(r)} style={{
                  background: selectedRun?.run_id === r.run_id ? 'rgba(0,242,255,0.08)' : 'transparent',
                  border: `1px solid ${selectedRun?.run_id === r.run_id ? 'rgba(0,242,255,0.3)' : 'transparent'}`,
                  borderRadius: 4, padding: '5px 8px', cursor: 'pointer', marginBottom: 3,
                }}>
                  <div style={{ fontSize: 8, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.scenario_name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, fontSize: 7, color: 'rgba(148,163,184,0.35)', marginTop: 2 }}>
                    <span style={{ color: r.status === 'complete' ? '#22c55e' : '#ffd60a' }}>{r.status}</span>
                    {r.duration_ms && <span>{(r.duration_ms / 1000).toFixed(1)}s</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Results */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedRun ? (
            <>
              {/* Run Header */}
              <div style={{ background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{selectedRun.scenario_name}</span>
                  <span style={{ fontSize: 7, color: typeColors[selectedRun.scenario_type] || '#64748b', background: `${typeColors[selectedRun.scenario_type] || '#64748b'}22`, padding: '1px 6px', borderRadius: 2 }}>
                    {selectedRun.scenario_type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 8, color: 'rgba(148,163,184,0.35)' }}>
                  <span>BASE RRI: <span style={{ color: '#00f2ff' }}>{selectedRun.base_rri?.toFixed(2)}</span></span>
                  <span>P(REV): <span style={{ color: '#ffd60a' }}>{(selectedRun.base_p_revolution * 100).toFixed(0)}%</span></span>
                  <span>ITERATIONS: {selectedRun.mc_iterations}</span>
                  <span>HORIZON: {selectedRun.time_horizon_days}D</span>
                  {selectedRun.duration_ms && <span>DURATION: {(selectedRun.duration_ms / 1000).toFixed(1)}s</span>}
                </div>
              </div>

              {/* Outcome Distribution + RRI Trajectory */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Outcome Distribution */}
                <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 8 }}>OUTCOME DISTRIBUTION</div>
                  {Object.entries(selectedRun.outcome_distribution || {}).sort(([,a], [,b]) => b - a).map(([phase, pct]) => (
                    <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', width: 80, textTransform: 'uppercase' }}>{phase.replace('_', ' ')}</span>
                      <div style={{ flex: 1, height: 4, background: 'rgba(0,180,180,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(pct as number) * 100}%`, height: '100%', background: PHASE_COLORS[phase] || '#64748b', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 8, color: PHASE_COLORS[phase] || '#64748b', width: 36, textAlign: 'right' }}>
                        {((pct as number) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* RRI Trajectory */}
                <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 8 }}>RRI TRAJECTORY</div>
                  {selectedRun.rri_trajectory?.length > 0 && (
                    <svg viewBox={`0 0 200 80`} style={{ width: '100%', height: 80 }}>
                      {/* Grid lines */}
                      {[0.25, 0.5, 0.75].map(v => (
                        <line key={v} x1={0} y1={v * 80} x2={200} y2={v * 80} stroke="rgba(0,180,180,0.1)" strokeWidth={0.5} />
                      ))}
                      {/* P90 band */}
                      <path
                        d={selectedRun.rri_trajectory.map((p, i) => {
                          const x = (i / (selectedRun.rri_trajectory.length - 1)) * 200;
                          const y = 80 - (p.p90 / 5) * 80;
                          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                        }).join(' ') + selectedRun.rri_trajectory.slice().reverse().map((p, i) => {
                          const x = ((selectedRun.rri_trajectory.length - 1 - i) / (selectedRun.rri_trajectory.length - 1)) * 200;
                          const y = 80 - (p.p10 / 5) * 80;
                          return `L${x},${y}`;
                        }).join('') + 'Z'}
                        fill="rgba(0,242,255,0.08)"
                      />
                      {/* Mean line */}
                      <path
                        d={selectedRun.rri_trajectory.map((p, i) => {
                          const x = (i / (selectedRun.rri_trajectory.length - 1)) * 200;
                          const y = 80 - (p.mean / 5) * 80;
                          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                        }).join(' ')}
                        fill="none" stroke="#00f2ff" strokeWidth={1.5}
                      />
                      {/* Dots */}
                      {selectedRun.rri_trajectory.map((p, i) => {
                        const x = (i / (selectedRun.rri_trajectory.length - 1)) * 200;
                        const y = 80 - (p.mean / 5) * 80;
                        return <circle key={i} cx={x} cy={y} r={2} fill="#00f2ff" />;
                      })}
                    </svg>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: 'rgba(148,163,184,0.35)', marginTop: 4 }}>
                    <span>Day 0</span>
                    <span>Day {selectedRun.time_horizon_days}</span>
                  </div>
                </div>
              </div>

              {/* Key Probabilities */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'P(REVOLUTION)', value: selectedRun.p_revolution_range?.mean, color: '#ffd60a', format: (v: number) => `${(v * 100).toFixed(0)}%` },
                  { label: 'UGTT STRIKE', value: selectedRun.ugtt_strike_probability, color: '#ff2d55', format: (v: number) => `${(v * 100).toFixed(0)}%` },
                  { label: 'ELITE FRACTURE', value: selectedRun.elite_fracture_probability, color: '#ff9f0a', format: (v: number) => `${(v * 100).toFixed(0)}%` },
                  { label: 'MILITARY SHIFT', value: selectedRun.military_posture_shift, color: '#a78bfa', format: (v: number) => `${(v * 100).toFixed(0)}%` },
                ].map(m => (
                  <div key={m.label} style={{ flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 7, color: 'rgba(148,163,184,0.35)', letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value != null ? m.format(m.value) : '—'}</div>
                  </div>
                ))}
              </div>

              {/* Sensitivity + Governorate Delta */}
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Sensitivity */}
                <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 8 }}>SENSITIVITY RANKING</div>
                  {(selectedRun.sensitivity_ranking || []).slice(0, 5).map((s, i) => (
                    <div key={s.variable} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', width: 14 }}>{i + 1}.</span>
                      <span style={{ fontSize: 8, color: '#e2e8f0', flex: 1 }}>{s.variable}</span>
                      <div style={{ width: 60, height: 3, background: 'rgba(0,180,180,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(s.impact_magnitude / 1) * 100}%`, height: '100%', background: '#00f2ff', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 8, color: '#00f2ff', width: 30, textAlign: 'right' }}>{s.impact_magnitude.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Governorate Risk Delta */}
                <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 8 }}>GOVERNORATE RISK DELTA</div>
                  {Object.entries(selectedRun.governorate_risk_delta || {}).sort(([,a], [,b]) => (b as number) - (a as number)).map(([gov, delta]) => (
                    <div key={gov} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', width: 70, textTransform: 'capitalize' }}>{gov}</span>
                      <div style={{ flex: 1, height: 3, background: 'rgba(0,180,180,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(Math.abs(delta as number) * 100, 100)}%`, height: '100%',
                          background: (delta as number) > 0.3 ? '#ff2d55' : (delta as number) > 0.15 ? '#ff9f0a' : '#ffd60a',
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 8, width: 36, textAlign: 'right',
                        color: (delta as number) > 0.3 ? '#ff2d55' : (delta as number) > 0.15 ? '#ff9f0a' : '#ffd60a',
                      }}>
                        +{((delta as number) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activated Chains */}
              {selectedRun.activated_chain_ids?.length > 0 && (
                <div style={{ background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 6 }}>ACTIVATED CHAINS</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedRun.activated_chain_ids.map(id => (
                      <span key={id} style={{ fontSize: 8, color: '#00f2ff', background: 'rgba(0,242,255,0.1)', padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(0,242,255,0.2)' }}>
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Analogue */}
              {selectedRun.historical_analogue && (
                <div style={{ background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 6 }}>HISTORICAL ANALOGUE</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>{selectedRun.historical_analogue}</span>
                    {selectedRun.analogue_similarity != null && (
                      <span style={{ fontSize: 9, color: '#ffd60a' }}>{(selectedRun.analogue_similarity * 100).toFixed(0)}% similarity</span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,0.35)', fontSize: 10, letterSpacing: 2 }}>
              SELECT A SCENARIO TO RUN OR A PAST RUN TO INSPECT
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationChamber;
