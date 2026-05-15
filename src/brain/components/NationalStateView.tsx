import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Clock, ArrowRight, Dot } from 'lucide-react';

const PHASES = [
  { id: 'accumulation', label: 'Accumulation', color: '#f59e0b', sig: 'Grievances build' },
  { id: 'stagnation',   label: 'Stagnation',   color: '#64748b', sig: 'No reform, cynicism' },
  { id: 'suppression',  label: 'Suppression',  color: '#ef4444', sig: 'Crackdowns, control' },
  { id: 'fracture',     label: 'Fracture',      color: '#a855f7', sig: 'Elite splits' },
  { id: 'ignition',     label: 'Ignition',      color: '#ff6b35', sig: 'Trigger event' },
  { id: 'cascade',      label: 'Cascade',       color: '#dc2626', sig: 'Rapid contagion' },
  { id: 'exhaustion',   label: 'Exhaustion',    color: '#475569', sig: 'Demobilization' },
];

interface StateResult {
  phase: string; phase_label: string; phase_signature: string;
  phase_color: string; dwell_days: number; phase_index: number;
  transitions: { target: string; probability: number }[];
  velocity_category: string; rri_category: string;
}

function classifyLocal(rri: number, vel: number, cp: number, ci: number, nd: number, ec: number, si: number, cs: number): string {
  if (rri >= 3.0 && cp > 0.6 && si > 0.15) return 'cascade';
  if (rri >= 2.5 && vel > 0.3 && si > 0.05) return 'ignition';
  if (rri >= 2.5 && ci > 0.6 && cs > 0.5) return 'suppression';
  if (rri >= 2.0 && nd > 0.6 && ec < 0.4) return 'fracture';
  if (rri >= 2.0 && Math.abs(vel) < 0.01 && nd > 0.5) return 'stagnation';
  if (rri >= 1.5 && vel > 0.01 && cp < 0.3) return 'accumulation';
  if (rri < 1.5 && cs < 0.3) return 'accumulation';
  if (vel < -0.1 && cp < 0.3) return 'exhaustion';
  return 'accumulation';
}

function makeLocalResult(rri: number, vel: number, cp: number, ci: number, nd: number, ec: number, si: number, cs: number): StateResult {
  const phase = classifyLocal(rri, vel, cp, ci, nd, ec, si, cs);
  const p = PHASES.find(x => x.id === phase) || PHASES[0];
  return {
    phase, phase_label: p.label, phase_signature: p.sig, phase_color: p.color,
    dwell_days: 0, phase_index: PHASES.indexOf(p), transitions: [],
    velocity_category: vel > 0.3 ? 'surge' : vel > 0.1 ? 'rising' : vel > 0.01 ? 'slow_rise' : vel > -0.01 ? 'flat' : 'slow_decline',
    rri_category: rri >= 3 ? 'critical' : rri >= 2.5 ? 'high' : rri >= 2 ? 'elevated' : rri >= 1.5 ? 'moderate' : 'low',
  };
}

const NationalStateView: React.FC = () => {
  const { rriState } = usePipeline();

  const rri = rriState?.rri ?? 2.0;
  const vel = rriState?.velocity ?? 0;
  const cp = rriState?.cascade_probability ?? 0.3;
  const ci = rriState?.coercion_idx ?? 0.3;
  const nd = rriState?.narrative_divergence ?? 0.3;
  const ec = rriState?.elite_cohesion_dynamics ?? 0.6;
  const si = rriState?.sir_infected ?? 0;
  const cs = rriState?.compound_stress ?? 0.3;

  const initial = useMemo(() => makeLocalResult(rri, vel, cp, ci, nd, ec, si, cs), []);
  const [result, setResult] = useState<StateResult>(initial);
  const [history, setHistory] = useState<StateResult[]>([]);
  const [apiAvail, setApiAvail] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const classify = async () => {
    const body = { rri, velocity: vel, cascade_prob: cp, coercion_idx: ci, narrative_divergence: nd, elite_cohesion: ec, sir_infected: si, compound_stress: cs };
    try {
      const res = await fetch('/api/state/classify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setResult(data);
      setApiAvail(true);
      setHistory(prev => { const next = [...prev, data]; return next.length > 100 ? next.slice(-100) : next; });
    } catch {
      setApiAvail(false);
      setResult(makeLocalResult(rri, vel, cp, ci, nd, ec, si, cs));
    }
  };

  useEffect(() => {
    const timer = setInterval(classify, 10000);
    return () => clearInterval(timer);
  }, [rri, vel, cp, ci, nd, ec, si, cs]);

  const phase = result;
  const currentIdx = PHASES.findIndex(p => p.id === phase.phase);
  const showTransitions = phase.transitions && phase.transitions.length > 0;

  const vcatColor = phase.velocity_category === 'surge' || phase.velocity_category === 'rising' ? '#ef4444'
    : phase.velocity_category === 'slow_rise' ? '#f59e0b'
    : phase.velocity_category === 'flat' ? '#64748b' : '#22c55e';

  return (
    <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', flexDirection: 'column', padding: 24, gap: 20, fontFamily: '"IBM Plex Mono",monospace', color: '#c9d1e0', overflow: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
        <Activity size={18} color={phase.phase_color} />
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#3a4a5a', fontWeight: 600 }}>NATIONAL STATE MACHINE</span>
        <span style={{ fontSize: 9, color: apiAvail ? '#30d158' : '#f59e0b', marginLeft: 'auto' }}>
          {apiAvail ? 'API CONNECTED' : 'LOCAL MODE'}
        </span>
      </div>

      {/* Current Phase Display */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
        <div style={{
          flex: 1, background: 'rgba(0,0,0,0.6)', borderRadius: 12, border: `1px solid ${phase.phase_color}44`,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2 }}>CURRENT PHASE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: phase.phase_color, boxShadow: `0 0 20px ${phase.phase_color}66` }} />
            <span style={{ fontSize: 28, fontWeight: 700, color: phase.phase_color, letterSpacing: 1 }}>{phase.phase_label.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 11, color: '#6a7a8a', letterSpacing: 1 }}>{phase.phase_signature}</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            <div><span style={{ fontSize: 9, color: '#3a4a5a' }}>DWELL</span><span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginLeft: 8 }}>{phase.dwell_days}d</span></div>
            <div><span style={{ fontSize: 9, color: '#3a4a5a' }}>RRI</span><span style={{ fontSize: 14, fontWeight: 700, color: rri >= 2.5 ? '#ef4444' : rri >= 2 ? '#f59e0b' : '#30d158', marginLeft: 8 }}>{rri.toFixed(2)}</span></div>
            <div><span style={{ fontSize: 9, color: '#3a4a5a' }}>VELOCITY</span><span style={{ fontSize: 14, fontWeight: 700, color: vcatColor, marginLeft: 8 }}>{(vel * 100).toFixed(1)}%</span></div>
          </div>
        </div>

        {/* Phase sequence */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 260,
        }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 8 }}>PHASE SEQUENCE</div>
          {PHASES.map((p, i) => {
            const isCurrent = i === currentIdx;
            const isPast = i < currentIdx;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: i > currentIdx ? 0.3 : 1 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isCurrent ? p.color : isPast ? p.color : 'rgba(255,255,255,0.1)',
                  boxShadow: isCurrent ? `0 0 12px ${p.color}88` : 'none',
                }} />
                <span style={{
                  fontSize: 10, fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? p.color : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                  letterSpacing: 1,
                }}>{p.label.toUpperCase()}</span>
                {isCurrent && <Dot size={14} color={p.color} className="animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Signals */}
      <div style={{
        background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16,
      }}>
        <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 12 }}>INPUT SIGNALS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'RRI', value: rri.toFixed(2), color: rri >= 2.5 ? '#ef4444' : rri >= 2 ? '#f59e0b' : '#30d158' },
            { label: 'Velocity', value: `${(vel * 100).toFixed(1)}%/d`, color: vcatColor },
            { label: 'Cascade Prob', value: `${(cp * 100).toFixed(0)}%`, color: cp > 0.5 ? '#ef4444' : '#f59e0b' },
            { label: 'Coercion', value: `${(ci * 100).toFixed(0)}%`, color: ci > 0.6 ? '#ef4444' : '#64748b' },
            { label: 'Narrative Div.', value: `${(nd * 100).toFixed(0)}%`, color: nd > 0.6 ? '#a855f7' : '#64748b' },
            { label: 'Elite Cohesion', value: `${(ec * 100).toFixed(0)}%`, color: ec < 0.4 ? '#ef4444' : '#22c55e' },
            { label: 'SIR Infected', value: `${(si * 100).toFixed(1)}%`, color: si > 0.15 ? '#ef4444' : '#64748b' },
            { label: 'Compound Stress', value: cs.toFixed(2), color: cs > 0.6 ? '#ef4444' : '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 8, color: '#3a4a5a', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transition Probabilities */}
      {showTransitions && (
        <div style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16,
        }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 12 }}>TRANSITION PROBABILITIES</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {phase.transitions.map((t, i) => {
              const tp = PHASES.find(p => p.id === t.target);
              const width = `${Math.max(4, t.probability * 100)}%`;
              return (
                <div key={i} style={{
                  flex: '1 0 120px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                  padding: '10px 14px', border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: tp?.color || '#64748b' }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: tp?.color || '#64748b', letterSpacing: 1 }}>{t.target.toUpperCase()}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width, height: '100%', background: tp?.color || '#64748b', borderRadius: 2, transition: 'width .5s' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>{(t.probability * 100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase History Timeline */}
      {history.length > 1 && (
        <div style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16, flex: 1,
        }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 12 }}>PHASE HISTORY</div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 60 }}>
            {history.slice(-60).map((h, i) => {
              const idx = PHASES.findIndex(p => p.id === h.phase);
              const hgt = Math.max(8, (idx + 1) / PHASES.length * 56);
              return (
                <div key={i} title={`${h.phase_label} (RRI: ${h.rri_category})`}
                  style={{ flex: 1, height: hgt, background: h.phase_color, borderRadius: '2px 2px 0 0', opacity: 0.7, minWidth: 3 }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 8, color: '#2a3a4a' }}>T-{history.length * 10}s</span>
            <span style={{ fontSize: 8, color: '#2a3a4a' }}>now</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NationalStateView;
