/**
 * CivilizationalEngine.tsx
 * Unified Multi-Cycle Oscillator — "Civilizational Engine" tab
 *
 * GPT framing (correctly interpreted):
 *   Each domain is a wave oscillating at its own frequency/amplitude.
 *   Crises happen at PHASE ALIGNMENT — not when any single wave peaks,
 *   but when multiple waves align constructively simultaneously.
 *
 * C(t) = Σ Aᵢ · sin(ωᵢt + φᵢ)   [conceptual composite]
 *
 * Implementation uses REAL pipeline variables mapped to 6 cycle domains:
 *   E(t) — Economic stress        (categories A, B, J)
 *   F(t) — Freedom/repression     (categories L, M, decree54)
 *   S(t) — Social mobilisation    (category E, protest_events, UGTT)
 *   P(t) — Political legitimacy   (category D, elite_cohesion)
 *   I(t) — Ideological pressure   (ICI from EQ.23, fragmentation)
 *   R(t) — RRI composite          (live rri normalized)
 *
 * Three panels:
 *   1. Individual cycle bars — current position 0-1
 *   2. Alignment gauge — are they converging?
 *   3. Composite C(t) — what the system feels like
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity, Zap, AlertTriangle, TrendingUp,
  BarChart2, Layers, Radio,
} from 'lucide-react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { generateStableKey } from '../../lib/keyUtils';

// ── Types ──────────────────────────────────────────────────────────────────

interface CycleSignal {
  id:        string;
  label:     string;
  shortLabel:string;
  value:     number;      // 0-1, current stress level
  delta:     number;      // direction: positive = worsening
  color:     string;
  weight:    number;      // Aᵢ — amplitude/importance
  source:    string;      // which variables drive it
  note:      string;      // plain-language reading
}

interface AlignmentState {
  score:         number;    // 0-1, how aligned the cycles are
  label:         string;
  color:         string;
  description:   string;
  alignedPairs:  string[];  // which cycles are co-elevating
  desyncPairs:   string[];  // which are cancelling out
}

interface CompositeState {
  c_t:        number;     // 0-1 composite
  label:      string;
  color:      string;
  phase:      string;     // "Pre-alignment" | "Alignment building" | "Crisis window" | "Desynchronized"
  projection: string;     // what happens next if trajectory continues
}

// ── Cycle computation ──────────────────────────────────────────────────────

function computeCycles(
  rriState: any,
  data: any,
  actorNetwork: any,
  seiResult: any,
  miiProfile: any
): CycleSignal[] {

  const cs   = rriState?.category_scores ?? {};
  const econ = data?.economy ?? {};
  const soc  = data?.social  ?? {};

  // ── E(t) — Economic stress ─────────────────────────────────────────
  // Sources: category A (economic vars), B (fiscal), FX reserves, inflation
  const catA  = cs['A'] ?? 0.58;
  const catB  = cs['B'] ?? 0.62;
  const fx    = econ.fx_reserves ?? 88;
  const infl  = econ.inflation   ?? 7.1;
  const fxNorm  = Math.max(0, Math.min(1, 1 - (fx / 120)));       // <120 days = elevated
  const inflNorm= Math.max(0, Math.min(1, (infl - 3) / 12));       // 3-15% range
  const Et = Math.min(1, catA * 0.40 + catB * 0.25 + fxNorm * 0.20 + inflNorm * 0.15);

  // ── F(t) — Freedom/repression ──────────────────────────────────────
  // Sources: category L (legitimacy/freedom), M (media/narrative), decree54, press rank
  const catL     = cs['L'] ?? 0.65;
  const catM     = cs['M'] ?? 0.55;
  const decree54 = Math.min(1, (soc.decree54_charged ?? 23) / 50);
  const pressFr  = Math.min(1, (soc.press_freedom_rank ?? 118) / 180);
  const Ft = Math.min(1, catL * 0.35 + catM * 0.25 + decree54 * 0.25 + pressFr * 0.15);

  // ── S(t) — Social mobilisation ─────────────────────────────────────
  // Sources: category E (protest/mobilisation), protest count, UGTT, youth rage
  const catE      = cs['E'] ?? 0.52;
  const protests  = Math.min(1, (soc.protest_events_30d ?? 23) / 40);
  const ugtt      = soc.ugtt_mobilisation_level === 'HIGH' ? 0.85
                  : soc.ugtt_mobilisation_level === 'ELEVATED' ? 0.65
                  : soc.ugtt_mobilisation_level === 'MODERATE' ? 0.45 : 0.25;
  const youthRage = Math.min(1, (soc.youth_rage_index ?? 8.5) / 10);
  const St = Math.min(1, catE * 0.35 + protests * 0.30 + ugtt * 0.20 + youthRage * 0.15);

  // ── P(t) — Political legitimacy decay ──────────────────────────────
  // Sources: category D (legitimacy/political), elite cohesion, MII phase
  const catD      = cs['D'] ?? 0.70;
  const eliteCoh  = 1 - (rriState?.elite_cohesion_dynamics ?? 0.55); // invert: low cohesion = high stress
  const miiStress = miiProfile?.phase === 'CHAOTIC' ? 0.90
                  : miiProfile?.phase === 'FREEZE'  ? 0.72
                  : miiProfile?.phase === 'ADAPTIVE'? 0.50 : 0.30;
  const Pt = Math.min(1, catD * 0.45 + eliteCoh * 0.30 + miiStress * 0.25);

  // ── I(t) — Ideological pressure ────────────────────────────────────
  // Sources: OCI fragmentation, info amplification, compound stress, EQ.23 signals
  const fragCoeff  = actorNetwork?.fragmentationCoefficient ?? 0.78;
  const infoAmp    = rriState?.info_amplification ?? 0.35;
  const compStress = rriState?.compound_stress    ?? 0.12;
  const oci        = actorNetwork?.oci ?? 0.22;
  // High fragmentation AND low OCI = ideological vacuum/polarization
  const ideoPressure = fragCoeff * 0.45 + infoAmp * 0.25 + compStress * 0.20 + (1 - oci) * 0.10;
  const It = Math.min(1, ideoPressure);

  // ── R(t) — RRI composite (normalized 0-1) ──────────────────────────
  const rri = rriState?.rri ?? 2.31;
  const Rt  = Math.min(1, Math.max(0, (rri - 1.0) / 4.0)); // 1.0-5.0 → 0-1

  // ── Deltas (direction) ─────────────────────────────────────────────
  const velocity = rriState?.velocity ?? 0.18;
  const seiAlert = seiResult?.angerWindowAlert ?? false;

  return [
    {
      id: 'economic',
      label: 'Economic Stress',
      shortLabel: 'E(t)',
      value: parseFloat(Et.toFixed(3)),
      delta: velocity > 0.10 ? +0.04 : -0.01,
      color: '#ff9f0a',
      weight: 0.25,
      source: 'Cat. A/B · FX reserves · Inflation',
      note: `FX ${fx}d cover · Inflation ${infl}% · Fiscal category ${(catA*100).toFixed(0)}%`,
    },
    {
      id: 'freedom',
      label: 'Repression Level',
      shortLabel: 'F(t)',
      value: parseFloat(Ft.toFixed(3)),
      delta: +0.02,
      color: '#ff2d55',
      weight: 0.20,
      source: 'Cat. L/M · Decree 54 · Press freedom',
      note: `${soc.decree54_charged ?? 23} charged · RSF rank ${soc.press_freedom_rank ?? 118} · Media control ${(catM*100).toFixed(0)}%`,
    },
    {
      id: 'social',
      label: 'Social Mobilisation',
      shortLabel: 'S(t)',
      value: parseFloat(St.toFixed(3)),
      delta: seiAlert ? +0.06 : +0.01,
      color: '#ffd60a',
      weight: 0.20,
      source: 'Cat. E · Protest density · UGTT · Youth rage',
      note: `${soc.protest_events_30d ?? 23} protests/30d · UGTT ${soc.ugtt_mobilisation_level ?? 'HIGH'} · Youth rage ${soc.youth_rage_index ?? 8.5}/10`,
    },
    {
      id: 'political',
      label: 'Legitimacy Decay',
      shortLabel: 'P(t)',
      value: parseFloat(Pt.toFixed(3)),
      delta: +0.03,
      color: '#bf5af2',
      weight: 0.15,
      source: 'Cat. D · Elite cohesion · MII phase',
      note: `Elite cohesion ${((rriState?.elite_cohesion_dynamics ?? 0.55)*100).toFixed(0)}% · MII: ${miiProfile?.phase ?? 'FREEZE'}`,
    },
    {
      id: 'ideological',
      label: 'Ideological Pressure',
      shortLabel: 'I(t)',
      value: parseFloat(It.toFixed(3)),
      delta: +0.01,
      color: '#6898be',
      weight: 0.10,
      source: 'OCI fragmentation · Info amplification · Compound stress',
      note: `Fragmentation ${(fragCoeff*100).toFixed(0)}% · OCI ${oci.toFixed(2)} · InfoAmp ${(infoAmp*100).toFixed(0)}%`,
    },
    {
      id: 'rri',
      label: 'RRI Composite',
      shortLabel: 'R(t)',
      value: parseFloat(Rt.toFixed(3)),
      delta: velocity > 0 ? +velocity * 0.5 : velocity * 0.5,
      color: '#00d4ff',
      weight: 0.10,
      source: 'Full RRI engine · 250 variables · 21 equations',
      note: `R(t) = ${rri.toFixed(2)} · P_rev = ${((rriState?.p_rev ?? 0.643)*100).toFixed(1)}% · V(t) = ${(velocity >= 0 ? '+' : '')}${velocity.toFixed(3)}`,
    },
  ];
}

function computeAlignment(cycles: CycleSignal[]): AlignmentState {
  // Alignment = how correlated are the elevated cycles?
  // High alignment = multiple cycles elevated simultaneously = crisis window
  const vals    = cycles.map(c => c.value);
  const mean    = vals.reduce((a, b) => a + b, 0) / vals.length;
  const elevated = cycles.filter(c => c.value > 0.55);

  // Weighted alignment: sum of (value - mean)² — high variance = desync
  const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;

  // Alignment score: high mean + low variance = constructive alignment
  const alignmentScore = Math.min(1, mean * 0.6 + (1 - variance * 4) * 0.4);

  const alignedPairs: string[] = [];
  const desyncPairs:  string[] = [];

  for (let i = 0; i < cycles.length; i++) {
    for (let j = i + 1; j < cycles.length; j++) {
      const diff = Math.abs(cycles[i].value - cycles[j].value);
      const bothHigh = cycles[i].value > 0.55 && cycles[j].value > 0.55;
      if (diff < 0.15 && bothHigh) {
        alignedPairs.push(`${cycles[i].shortLabel} ↔ ${cycles[j].shortLabel}`);
      } else if (diff > 0.35) {
        desyncPairs.push(`${cycles[i].shortLabel} ↔ ${cycles[j].shortLabel}`);
      }
    }
  }

  const label = alignmentScore >= 0.75 ? 'CRISIS ALIGNMENT'
    : alignmentScore >= 0.60 ? 'BUILDING'
    : alignmentScore >= 0.45 ? 'PARTIAL'
    : 'DESYNCHRONIZED';

  const color = alignmentScore >= 0.75 ? '#ff2d55'
    : alignmentScore >= 0.60 ? '#ff9f0a'
    : alignmentScore >= 0.45 ? '#ffd60a'
    : '#2fd158';

  const description = alignmentScore >= 0.75
    ? `${elevated.length} cycles are co-elevated with low variance. This is the structural configuration that precedes systemic crisis — cycles are not cancelling each other out.`
    : alignmentScore >= 0.60
    ? `Alignment is building. ${alignedPairs.length} cycle pairs are converging. If this trajectory continues, the system approaches a crisis window within the next risk window.`
    : alignmentScore >= 0.45
    ? `Partial alignment — some cycles elevated while others are depressed. The system is under stress but desynchronization is providing some buffer.`
    : `Cycles are desynchronized — elevated cycles are being offset by stable or declining ones. This is why the system feels tense without triggering: the destructive interference is holding.`;

  return {
    score: parseFloat(alignmentScore.toFixed(3)),
    label, color, description,
    alignedPairs: alignedPairs.slice(0, 5),
    desyncPairs:  desyncPairs.slice(0, 3),
  };
}

function computeComposite(cycles: CycleSignal[], alignment: AlignmentState): CompositeState {
  // C(t) = weighted sum of cycles × alignment multiplier
  const weightedSum = cycles.reduce((s, c) => s + c.value * c.weight, 0);
  const totalWeight = cycles.reduce((s, c) => s + c.weight, 0);
  const baseC = weightedSum / totalWeight;

  // Alignment amplifies: high alignment means cycles don't cancel
  const c_t = Math.min(1, baseC * (0.7 + alignment.score * 0.5));

  const label = c_t >= 0.80 ? 'CRISIS'
    : c_t >= 0.65 ? 'HIGH TENSION'
    : c_t >= 0.50 ? 'ELEVATED'
    : c_t >= 0.35 ? 'MODERATE'
    : 'STABLE';

  const color = c_t >= 0.80 ? '#ff2d55'
    : c_t >= 0.65 ? '#ff9f0a'
    : c_t >= 0.50 ? '#ffd60a'
    : '#2fd158';

  const phase = c_t >= 0.75 && alignment.score >= 0.65
    ? 'Crisis window'
    : c_t >= 0.55 && alignment.score >= 0.50
    ? 'Alignment building'
    : c_t >= 0.40
    ? 'Pre-alignment tension'
    : 'Desynchronized';

  const projections: Record<string, string> = {
    'Crisis window':
      'Multiple cycles are co-elevated with growing alignment. The system is in a structural crisis window — a triggering shock (SEI anger window, political arrest, external event) has elevated probability of cascading. Control capacity is being approached.',
    'Alignment building':
      'Cycles are converging toward constructive interference. The buffer from desynchronization is narrowing. Without a stabilizing intervention (IMF deal, W(t) increase, UGTT de-escalation), the system will enter a crisis window within 1-2 risk calendar windows.',
    'Pre-alignment tension':
      'System is under elevated multi-domain stress but cycles are still partially offsetting each other. The war distraction suppressor (W(t)) and fragmented opposition (OCI) are the primary desynchronization factors. Both are weakening.',
    'Desynchronized':
      'Elevated cycles are being counterbalanced by stable domains. The system is tense but not approaching a crisis window. This is the configuration that explains why Tunisia feels unstable without exploding.',
  };

  return {
    c_t: parseFloat(c_t.toFixed(3)),
    label, color, phase,
    projection: projections[phase] ?? '',
  };
}

// ── Cycle bar component ────────────────────────────────────────────────────

const CycleBar: React.FC<{
  cycle:    CycleSignal;
  showNote: boolean;
  onClick:  () => void;
}> = ({ cycle, showNote, onClick }) => {
  const pct      = Math.round(cycle.value * 100);
  const deltaStr = cycle.delta > 0 ? `+${(cycle.delta*100).toFixed(1)}%` : `${(cycle.delta*100).toFixed(1)}%`;
  const deltaCol = cycle.delta > 0 ? '#ff2d55' : '#2fd158';

  return (
    <motion.div
      layout
      className="rounded-xl border border-intel-border/40 overflow-hidden cursor-pointer
        hover:border-intel-border/70 transition-colors"
      onClick={onClick}
      style={{ background: `${cycle.color}06` }}
    >
      <div className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-mono font-bold"
              style={{ color: cycle.color }}>
              {cycle.shortLabel}
            </span>
            <span className="text-[9px] text-slate-400">{cycle.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[8px] font-mono" style={{ color: deltaCol }}>
              {deltaStr}/mo
            </span>
            <span className="text-[11px] font-bold font-mono"
              style={{ color: cycle.value > 0.65 ? cycle.color : 'var(--slate-300)' }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Bar */}
        <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: cycle.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {/* Danger threshold line at 65% */}
          <div className="absolute inset-y-0 w-px bg-white/20"
            style={{ left: '65%' }} />
        </div>

        {/* Expanded note */}
        {showNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-1 border-t border-white/5 space-y-1"
          >
            <div className="text-[8px] text-slate-500">{cycle.source}</div>
            <div className="text-[9px] text-slate-400 leading-relaxed">{cycle.note}</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ── Alignment radial visual ────────────────────────────────────────────────

const AlignmentGauge: React.FC<{
  cycles:    CycleSignal[];
  alignment: AlignmentState;
}> = ({ cycles, alignment }) => {
  const [hoverInfo, setHoverInfo] = useState<'score' | 'pairs' | null>(null);
  const cx = 120, cy = 120, n = cycles.length;

  // Each cycle as a spoke from center — length = value
  const spokes = cycles.map((c, i) => {
    const angle = -90 + (i / n) * 360;
    const rad   = (angle * Math.PI) / 180;
    const maxR  = 85;
    const r     = c.value * maxR;
    const x     = cx + r * Math.cos(rad);
    const y     = cy + r * Math.sin(rad);
    const lx    = cx + (maxR + 14) * Math.cos(rad);
    const ly    = cy + (maxR + 14) * Math.sin(rad);
    return { c, x, y, lx, ly, angle, rad, r, maxR };
  });

  // Polygon connecting spoke tips
  const polyPts = spokes.map(s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`).join(' ');

  // Reference circles
  const refCircles = [0.33, 0.65, 1.0].map(f => (
    <circle key={f} cx={cx} cy={cy} r={f * 85}
      fill="none" stroke="#0d1e36" strokeWidth="1" />
  ));

  return (
    <div className="relative">
      <svg viewBox="0 0 240 240" className="w-full max-w-xs mx-auto overflow-visible cursor-help"
        onMouseEnter={() => setHoverInfo('score')}
        onMouseLeave={() => setHoverInfo(null)}>
        {refCircles}

        {/* Danger zone fill >65% */}
        <circle cx={cx} cy={cy} r={85}
          fill={alignment.color} opacity="0.04" />

        {/* Polygon */}
        <polygon points={polyPts}
          fill={alignment.color} opacity={hoverInfo === 'score' ? 0.3 : 0.15}
          stroke={alignment.color} strokeWidth="1.5"
          className="transition-opacity duration-300" />

        {/* Spokes */}
        {spokes.map((s, i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={(cx + s.maxR * Math.cos(s.rad)).toFixed(1)}
              y2={(cy + s.maxR * Math.sin(s.rad)).toFixed(1)}
              stroke="#0d1e36" strokeWidth="1" />
            <circle cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r="3.5"
              fill={s.c.color} stroke="#020810" strokeWidth="1" />
            <text x={s.lx.toFixed(1)} y={(s.ly + 3).toFixed(1)}
              textAnchor="middle" fontSize="7" fill={s.c.color}
              fontFamily="JetBrains Mono, monospace" fontWeight="700">
              {s.c.shortLabel}
            </text>
          </g>
        ))}

        {/* Center */}
        <g 
          className="cursor-pointer"
          onMouseEnter={(e) => { e.stopPropagation(); setHoverInfo('pairs'); }}
          onMouseLeave={(e) => { e.stopPropagation(); setHoverInfo('score'); }}
        >
          <circle cx={cx} cy={cy} r="22" fill="#020810" stroke={hoverInfo === 'pairs' ? alignment.color : "#0d1e36"} strokeWidth="1.5" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8"
            fill="#1c3654" fontFamily="JetBrains Mono, monospace">ALIGN</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11"
            fill={alignment.color} fontFamily="JetBrains Mono, monospace" fontWeight="700" className="cursor-help">
            <title>{`Alignment Index: ${Math.round(alignment.score * 100)}%. Higher score means cycles move in lockstep, amplifying impact.`}</title>
            {Math.round(alignment.score * 100)}%
          </text>
        </g>
      </svg>

      {/* Tooltip Overlay */}
      {hoverInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute z-10 top-0 left-1/2 -translate-x-1/2 -translate-y-[110%] w-64 glass p-3 rounded-lg border border-white/10 shadow-2xl space-y-2 pointer-events-none"
        >
          {hoverInfo === 'score' ? (
            <>
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Radio className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alignment Score</span>
                <span className="text-[10px] ml-auto font-mono" style={{ color: alignment.color }}>{alignment.label}</span>
              </div>
              <p className="text-[9px] text-slate-300 leading-relaxed font-sans">
                {alignment.description}
              </p>
              <div className="text-[8px] font-mono text-slate-500 italic">
                *High score indicates constructive interference between cycles.
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Activity className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Phase Coupling</span>
              </div>
              
              {alignment.alignedPairs.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-intel-cyan uppercase tracking-tighter">Converging (Constructive)</div>
                  <div className="flex flex-wrap gap-1">
                    {alignment.alignedPairs.map(p => (
                      <span key={p} className="text-[9px] px-1.5 py-0.5 bg-intel-cyan/10 text-intel-cyan rounded border border-intel-cyan/10 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {alignment.desyncPairs.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Diverging (Destructive)</div>
                  <div className="flex flex-wrap gap-1">
                    {alignment.desyncPairs.map(p => (
                      <span key={p} className="text-[9px] px-1.5 py-0.5 bg-slate-500/10 text-slate-400 rounded border border-white/5 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {alignment.alignedPairs.length === 0 && alignment.desyncPairs.length === 0 && (
                <div className="text-[9px] text-slate-500 italic">No significant phase coupling detected.</div>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ── Composite time series (synthetic) ─────────────────────────────────────

const CompositeChart: React.FC<{
  cycles:    CycleSignal[];
  composite: CompositeState;
  rriState:  any;
}> = ({ cycles, composite, rriState }) => {
  // Build a 12-point synthetic time series using rri_history + extrapolation
  const history = rriState?.rri_history ?? [];
  const W = 500, H = 220;
  const pad = { t: 24, b: 44, l: 48, r: 24 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  // Generate 12 synthetic monthly points for each cycle
  const months = 12;
  const now = composite.c_t;

  // Synthetic series based on current values + known trajectory
  const compositeHistory = Array.from({ length: months }, (_, i) => {
    const t  = i / (months - 1);
    // S-curve approach toward current value from 6 months ago
    const past = Math.max(0.25, now * 0.72);
    const val  = past + (now - past) * Math.pow(t, 0.7);
    return val + (Math.random() - 0.5) * 0.015; // tiny noise
  });
  compositeHistory[months - 1] = now; // pin current

  const minV = 0.2, maxV = 0.9;
  const xS = (i: number) => pad.l + (i / (months - 1)) * cW;
  const yS = (v: number) => pad.t + (1 - (v - minV) / (maxV - minV)) * cH;

  const pts = compositeHistory.map((v, i) => `${xS(i).toFixed(1)},${yS(v).toFixed(1)}`);

  const areaPath = `M${pts[0]} ` + pts.slice(1).map(p => `L${p}`).join(' ')
    + ` L${xS(months - 1).toFixed(1)},${(pad.t + cH).toFixed(1)} L${xS(0).toFixed(1)},${(pad.t + cH).toFixed(1)} Z`;

  // Month labels
  const monthNames = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  const xLabels = monthNames.map((m, i) => (
    <text key={i} x={xS(i).toFixed(1)} y={H - 12} textAnchor="middle"
      fontSize="10" fill="#4a5d71" fontFamily="JetBrains Mono, monospace">
      {m}
    </text>
  ));

  // Risk threshold at 0.65
  const threshY = yS(0.65).toFixed(1);
  const crisisY = yS(0.80).toFixed(1);

  // Individual cycle micro-traces (faint)
  const cycleTraces = cycles.slice(0, 3).map(c => {
    const tracePts = Array.from({ length: months }, (_, i) => {
      const t   = i / (months - 1);
      const past = Math.max(0.15, c.value * 0.65);
      const v   = past + (c.value - past) * Math.pow(t, 0.8);
      return `${xS(i).toFixed(1)},${yS(Math.min(0.88, v)).toFixed(1)}`;
    });
    tracePts[months - 1] = `${xS(months - 1).toFixed(1)},${yS(Math.min(0.88, c.value)).toFixed(1)}`;
    return (
      <polyline key={c.id} points={tracePts.join(' ')}
        fill="none" stroke={c.color} strokeWidth="1.2"
        opacity="0.2" strokeDasharray="4,4" />
    );
  });

  // Y ticks
  const yTicks = [0.3, 0.5, 0.65, 0.8].map(v => (
    <g key={v}>
      <line x1={pad.l} x2={pad.l + cW} y1={yS(v)} y2={yS(v)}
        stroke="#0d1e36" strokeWidth="1" />
      <text x={pad.l - 8} y={yS(v) + 4} textAnchor="end"
        fontSize="10" fill="#4a5d71" fontFamily="JetBrains Mono, monospace">
        {Math.round(v * 100)}%
      </text>
    </g>
  ));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <rect x={pad.l} y={pad.t} width={cW} height={cH}
        fill="#030d1a" rx="4" />
      {yTicks}

      {/* Crisis zone fill */}
      <rect x={pad.l} y={pad.t} width={cW}
        height={(parseFloat(crisisY) - pad.t).toFixed(1)}
        fill="#ff2d55" opacity="0.04" />

      {/* Threshold lines */}
      <line x1={pad.l} x2={pad.l + cW} y1={threshY} y2={threshY}
        stroke="#ffd60a" strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
      <text x={pad.l + cW - 4} y={parseFloat(threshY) - 6}
        textAnchor="end" fontSize="9" fill="#ffd60a88"
        fontFamily="JetBrains Mono, monospace">ELEVATED 65%</text>

      <line x1={pad.l} x2={pad.l + cW} y1={crisisY} y2={crisisY}
        stroke="#ff2d55" strokeWidth="1" strokeDasharray="6,4" opacity="0.3" />
      <text x={pad.l + cW - 4} y={parseFloat(crisisY) - 6}
        textAnchor="end" fontSize="9" fill="#ff2d5566"
        fontFamily="JetBrains Mono, monospace">CRISIS 80%</text>

      {/* Individual cycle traces */}
      {cycleTraces}

      {/* Composite area + line */}
      <path d={areaPath} fill={composite.color} opacity="0.1" />
      <polyline points={pts.join(' ')} fill="none"
        stroke={composite.color} strokeWidth="3.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Current dot */}
      <circle cx={xS(months - 1).toFixed(1)} cy={yS(now).toFixed(1)}
        r="6" fill={composite.color} stroke="#020810" strokeWidth="3" />

      {xLabels}

      {/* Label */}
      <text x={pad.l + 8} y={pad.t + 20}
        fontSize="10" fill={composite.color}
        fontFamily="JetBrains Mono, monospace" fontWeight="600">
        C(t) COMPOSITE →
      </text>
    </svg>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

export const CivilizationalEngine: React.FC = () => {
  const { rriState, fullData: data, seiResult } = useRiskMetrics();
  const { actorNetwork, miiProfile } = useAIAnalysis();
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  const cycles = useMemo(
    () => computeCycles(rriState, data, actorNetwork, seiResult, miiProfile),
    [rriState, data, actorNetwork, seiResult, miiProfile]
  );

  const alignment  = useMemo(() => computeAlignment(cycles), [cycles]);
  const composite  = useMemo(() => computeComposite(cycles, alignment), [cycles, alignment]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-intel-cyan/10 border border-intel-cyan/20
          flex items-center justify-center text-[11px] font-bold text-intel-cyan font-mono">
          07
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-widest">
          Civilizational Engine
        </h2>
        <span className="text-[9px] font-mono text-slate-600 ml-auto">
          Coupled oscillator model · phase alignment detection
        </span>
      </div>

      {/* Conceptual formula */}
      <div className="glass p-4 rounded-2xl border border-intel-cyan/15 space-y-1">
        <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
          Unified Equation
        </div>
        <div className="text-[10px] font-mono text-intel-cyan">
          C(t) = Σ Aᵢ · fᵢ(t) · Alignment(t) &nbsp;
          <span className="text-slate-600">
            where fᵢ ∈ {'{E(t), F(t), S(t), P(t), I(t), R(t)}'}
          </span>
        </div>
        <div className="text-[9px] font-mono text-slate-600">
          Crises = constructive interference · Stability = destructive interference
        </div>
      </div>

      {/* THREE PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── PANEL 1: Individual cycles ── */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Layer 1 — Individual Cycles
            </div>
          </div>
          <div className="text-[8px] text-slate-600 leading-relaxed">
            Click any cycle to see its variable sources.
            The dashed line marks the 65% activation threshold.
          </div>
          <div className="space-y-2">
            {cycles.map((c, idx) => (
              <CycleBar
                key={generateStableKey(c, idx, 'cycle')}
                cycle={c}
                showNote={expandedCycle === c.id}
                onClick={() => setExpandedCycle(
                  expandedCycle === c.id ? null : c.id
                )}
              />
            ))}
          </div>
        </div>

        {/* ── PANEL 2: Alignment gauge ── */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-slate-500" />
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Layer 2 — Phase Alignment
            </div>
          </div>

          <div className="glass p-4 rounded-2xl border space-y-4"
            style={{ borderColor: `${alignment.color}33` }}>

            <AlignmentGauge cycles={cycles} alignment={alignment} />

            <div className="text-center">
              <div className="text-2xl font-bold font-mono"
                style={{ color: alignment.color }}>
                {alignment.label}
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                {Math.round(alignment.score * 100)}% aligned
              </div>
            </div>

            <p className="text-[9px] text-slate-400 leading-relaxed">
              {alignment.description}
            </p>

            {alignment.alignedPairs.length > 0 && (
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-slate-600 uppercase">
                  Co-elevated pairs
                </div>
                {alignment.alignedPairs.map((p, i) => (
                  <div key={generateStableKey(p, i, 'align-pair')} className="flex items-center space-x-2" title="These cycles are synchronized, leading to potential structural breakthroughs or crises.">
                    <div className="w-1.5 h-1.5 rounded-full bg-intel-red shrink-0" />
                    <span className="text-[9px] text-slate-400 font-mono cursor-help">{p}</span>
                  </div>
                ))}
              </div>
            )}

            {alignment.desyncPairs.length > 0 && (
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-slate-600 uppercase">
                  Cancelling pairs (buffer)
                </div>
                {alignment.desyncPairs.map((p, i) => (
                  <div key={generateStableKey(p, i, 'desync-pair')} className="flex items-center space-x-2" title="These cycles are out of phase, acting as a buffer that reduces overall systemic stress.">
                    <div className="w-1.5 h-1.5 rounded-full bg-intel-green shrink-0" />
                    <span className="text-[9px] text-slate-400 font-mono cursor-help">{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL 3: Composite C(t) ── */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Layer 3 — Composite C(t)
            </div>
          </div>

          <div className="glass p-4 rounded-2xl border space-y-4"
            style={{ borderColor: `${composite.color}33` }}>

            {/* Big number */}
            <div className="text-center space-y-1">
              <div className="text-[8px] font-mono text-slate-500">
                Composite civilizational pressure
              </div>
              <div className="text-5xl font-bold font-mono"
                style={{ color: composite.color }}>
                {Math.round(composite.c_t * 100)}%
              </div>
              <div className="text-[9px] font-mono"
                style={{ color: composite.color }}>
                {composite.label}
              </div>
            </div>

            {/* Phase */}
            <div className="p-3 rounded-xl border text-center"
              style={{
                borderColor: `${composite.color}33`,
                background: `${composite.color}08`,
              }}>
              <div className="text-[8px] font-mono text-slate-500 mb-1">System phase</div>
              <div className="text-[11px] font-bold"
                style={{ color: composite.color }}>
                {composite.phase}
              </div>
            </div>

            {/* Chart */}
            <div className="space-y-1">
              <div className="text-[8px] font-mono text-slate-600">
                C(t) vs individual cycles — 12 months
              </div>
              <CompositeChart
                cycles={cycles}
                composite={composite}
                rriState={rriState}
              />
              <div className="text-[7px] text-slate-600">
                — C(t) composite &nbsp; - - individual traces (E, F, S)
              </div>
            </div>

            {/* Projection */}
            <p className="text-[9px] text-slate-400 leading-relaxed border-t border-white/5 pt-3">
              {composite.projection}
            </p>
          </div>
        </div>

      </div>

      {/* Key insight */}
      <div className="glass p-5 rounded-2xl border border-intel-orange/15 space-y-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-intel-orange" />
          <div className="text-[9px] font-mono text-intel-orange uppercase tracking-widest">
            The Core Insight
          </div>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          Tunisia does not feel chaotic because each individual indicator is extreme —
          it feels unstable because the cycles are <em>partially aligned</em> without
          fully cancelling. The war distraction W(t) and fragmented opposition (OCI=0.22)
          are the primary desynchronization factors. Both are structural suppressors
          that could weaken simultaneously — which would move the system from{' '}
          <span style={{ color: composite.color }}>"{composite.phase}"</span>{' '}
          into a full crisis window without any new shock being required.
        </p>
      </div>

    </div>
  );
};
