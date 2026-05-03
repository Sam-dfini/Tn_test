import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Zap, Users, Brain, Shield,
  TrendingUp, Activity, Radio, ChevronRight,
  Target, Layers, Eye, Lock, AlertCircle, MapPin
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { useRSS } from '../context/RSSContext';
import {
  analyzeRadicalisation,
  RadicalisationProfile,
  EscalationLevel,
  NarrativePole,
} from '../services/radicalEngine';
import { ModuleHeader } from './ProfessionalShared';
import { assertKey, getRenderKey, prepareList, generateStableKey } from '../lib/keyUtils';

// ── Escalation level config ────────────────────────────────────

const LEVEL_CONFIG: Record<EscalationLevel, {
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  intervention: string;
}> = {
  0: {
    label: 'Awareness',
    color: 'text-intel-cyan',
    bg: 'bg-intel-cyan/5',
    border: 'border-intel-cyan/20',
    description: 'General knowledge that conflict exists. No emotional or identity engagement.',
    intervention: 'No action needed. Standard monitoring.',
  },
  1: {
    label: 'Emotional Engagement',
    color: 'text-slate-300',
    bg: 'bg-slate-800/40',
    border: 'border-slate-700',
    description: 'Anger, solidarity, and injustice signals present. Normal civic response to war.',
    intervention: 'Monitor. Ensure information environment provides closure and factual grounding.',
  },
  2: {
    label: 'Identity Alignment',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    description: 'Individual aligning with a narrative pole. "I am part of this." Still reversible.',
    intervention: 'Pre-emptive: introduce counter-narrative. Address underlying grievance directly.',
  },
  3: {
    label: 'Us vs Them',
    color: 'text-intel-orange',
    bg: 'bg-intel-orange/5',
    border: 'border-intel-orange/30',
    description: 'Exclusionary worldview consolidating. Others begin to be seen as enemies. Divergence point.',
    intervention: 'Urgent: peer-based counter-messaging. Do not amplify by over-debunking. Inoculation strategy.',
  },
  4: {
    label: 'Justification',
    color: 'text-intel-red',
    bg: 'bg-intel-red/8',
    border: 'border-intel-red/40',
    description: 'Violence justification language present. Traditional counter-messaging now counterproductive.',
    intervention: 'Critical window. Structural intervention only. Address root grievance, not ideology.',
  },
  5: {
    label: 'Mobilisation',
    color: 'text-intel-red',
    bg: 'bg-intel-red/15',
    border: 'border-intel-red/60',
    description: 'Active mobilization calls detected. Action is being organized or demanded.',
    intervention: 'Emergency. Security and community response required. Intelligence product only.',
  },
};

const POLE_CONFIG: Record<NarrativePole, {
  label: string;
  color: string;
  description: string;
  riskLabel: string;
}> = {
  TRANSNATIONAL_SOLIDARITY: {
    label: 'Transnational Solidarity',
    color: 'text-intel-red',
    description: 'Religious-identity framing. Ummah, duty, martyrdom. Connects external war to local moral obligation.',
    riskLabel: 'HIGH RISK — most likely to reach Level 4',
  },
  ANTI_SYSTEMIC: {
    label: 'Anti-Systemic',
    color: 'text-intel-orange',
    description: 'Anti-imperialist / Left framing. Colonialism, resistance, liberation. Intellectual-student networks.',
    riskLabel: 'MEDIUM RISK — rarely reaches Level 4 alone',
  },
  REGIME_CAPTURE: {
    label: 'Regime Capture',
    color: 'text-intel-cyan',
    description: 'Nationalist-sovereignty framing controlled by regime. Suppressor mechanism, not radicalization vector.',
    riskLabel: 'SUPPRESSOR — regime redirecting emotional activation',
  },
  MIXED: {
    label: 'Mixed / Converging',
    color: 'text-yellow-500',
    description: 'Poles 1 and 2 converging on same trigger. Synergy effect active. Most volatile configuration.',
    riskLabel: 'VERY HIGH RISK — pole convergence = system amplification',
  },
};

// ── Main Component ─────────────────────────────────────────────

export const RadicalisationIntelligence: React.FC = () => {
  const { rriState, rpiProfile } = usePipeline();
  const { articles } = useRSS();
  const [activeSection, setActiveSection] =
    useState<'gradient' | 'poles' | 'pipeline' | 'equations' | 'intervention' | 'geographic'>('gradient');

  // Use pipeline profile or compute live
  const profile: RadicalisationProfile = useMemo(() => {
    if (rpiProfile) return rpiProfile;
    return analyzeRadicalisation(articles as any, rriState.w_t ?? 0.35);
  }, [rpiProfile, articles, rriState.w_t]);

  const levelCfg = LEVEL_CONFIG[profile.escalationLevel];
  const poleCfg = POLE_CONFIG[profile.dominantPole];

  const getRPIColor = (rpi: number) =>
    rpi >= 0.65 ? 'text-intel-red' :
    rpi >= 0.45 ? 'text-intel-orange' :
    rpi >= 0.25 ? 'text-yellow-500' : 'text-intel-cyan';

  return (
    <div className="space-y-6 pb-8">

      <ModuleHeader
        title="Radicalisation Dynamics Engine"
        subtitle="War synchronization · Escalation gradient · Narrative pole analysis · EQ.3/4/19 modifiers"
        icon={AlertTriangle}
        nodeId="RAD-ENG-01"
      />

      {/* ── Top summary bar ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-5
        space-y-4 ${levelCfg.bg} ${levelCfg.border}`}>
        {/* Glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full
          blur-3xl pointer-events-none opacity-15 ${
          profile.escalationLevel >= 4 ? 'bg-intel-red' :
          profile.escalationLevel >= 3 ? 'bg-intel-orange' :
          profile.escalationLevel >= 2 ? 'bg-yellow-500' : 'bg-intel-cyan'
        }`} style={{ transform: 'translate(30%,-30%)' }} />

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* RPI */}
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Radicalisation Pressure
            </div>
            <div className={`text-6xl font-bold font-mono leading-none ${
              getRPIColor(profile.escalationRisk)
            }`}>
              {Math.round(profile.escalationRisk * 100)}
            </div>
            <div className="text-[8px] font-mono text-slate-600">RPI / 100</div>
          </div>

          {/* Level */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Escalation Level
            </div>
            <div className={`text-4xl font-bold font-mono ${levelCfg.color}`}>
              {profile.escalationLevel}/5
            </div>
            <div className={`text-[9px] font-mono font-bold uppercase ${levelCfg.color}`}>
              {levelCfg.label}
            </div>
          </div>

          {/* Dominant pole */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Dominant Pole
            </div>
            <div className={`text-[11px] font-bold ${poleCfg.color}`}>
              {poleCfg.label}
            </div>
            <div className="text-[8px] font-mono text-slate-600 leading-snug">
              {poleCfg.riskLabel}
            </div>
          </div>

          {/* Intervention window */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Intervention
            </div>
            <div className={`text-[11px] font-bold ${
              profile.interventionWindow ? 'text-intel-green' : 'text-intel-red'
            }`}>
              {profile.interventionWindow ? '✓ WINDOW OPEN' : '✕ WINDOW CLOSED'}
            </div>
            <div className="text-[8px] font-mono text-slate-600">
              {profile.synergyCoefficent > 0.5
                ? `⚡ High synergy: ${(profile.synergyCoefficent * 100).toFixed(0)}%`
                : `Synergy: ${(profile.synergyCoefficent * 100).toFixed(0)}%`}
            </div>
            {profile.escalationDelta !== 0 && (
              <div className={`text-[8px] font-mono font-bold ${
                profile.escalationDelta > 0 ? 'text-intel-red' : 'text-intel-green'
              }`}>
                Δ {profile.escalationDelta > 0 ? '+' : ''}{(profile.escalationDelta * 100).toFixed(0)} this cycle
              </div>
            )}
          </div>
        </div>

        {/* Key signals */}
        {profile.keySignals && profile.keySignals.length > 0 && (
          <div className="relative z-10 pt-3 border-t border-white/5">
            <div className="flex flex-wrap gap-1.5">
              {profile.keySignals.slice(0, 10).map((sig, i) => (
                <span key={generateStableKey(sig, i, 'signal')} className={`text-[8px] font-mono px-2 py-0.5
                  rounded border ${
                  sig.includes('Level 5') || sig.includes('Level 4')
                    ? 'bg-intel-red/10 border-intel-red/20 text-intel-red'
                    : sig.includes('SYNERGY')
                    ? 'bg-intel-orange/10 border-intel-orange/20 text-intel-orange'
                    : 'bg-white/5 border-white/10 text-slate-500'
                }`}>{sig}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section nav ── */}
      <div className="flex items-center space-x-1 bg-black/40 border
        border-intel-border rounded-xl p-1 overflow-x-auto scrollbar-hide w-fit">
        {[
          { id: 'gradient', label: 'Gradient', icon: TrendingUp },
          { id: 'poles', label: 'Narrative Poles', icon: Layers },
          { id: 'pipeline', label: 'Pipeline', icon: Activity },
          { id: 'equations', label: 'EQ. Impact', icon: Zap },
          { id: 'intervention', label: 'Intervention', icon: Shield },
          { id: 'geographic', label: 'Geographic', icon: MapPin },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={generateStableKey(s.id, 0, 'nav')}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg
                text-[9px] font-mono uppercase tracking-wider whitespace-nowrap
                transition-all ${
                activeSection === s.id
                  ? 'bg-intel-red/10 text-intel-red border border-intel-red/20'
                  : 'text-slate-600 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >

          {/* ═══ ESCALATION GRADIENT ══════════════════════════ */}
          {activeSection === 'gradient' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Radicalisation is a trajectory, not a state.
                The system tracks movement between levels.
                Level 3→4 is the critical threshold — intervention
                strategy changes fundamentally at that boundary.
              </p>

              {/* Level progress bar */}
              <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Escalation Gradient — Current Position
                </div>

                {/* The six levels */}
                <div className="space-y-3">
                  {([0, 1, 2, 3, 4, 5] as EscalationLevel[]).map(lvl => {
                    const cfg = LEVEL_CONFIG[lvl];
                    const isCurrent = lvl === profile.escalationLevel;
                    const isPassed = lvl < profile.escalationLevel;
                    const isCritical = lvl >= 4;

                    return (
                      <div key={`level-stable-${lvl}`}
                        className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? `${cfg.bg} ${cfg.border} ring-1 ring-offset-1 ring-offset-black ring-opacity-30`
                          : isPassed
                          ? 'border-white/5 bg-white/3 opacity-60'
                          : 'border-intel-border/20 bg-black/10 opacity-40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-7 h-7 rounded-full border-2
                              flex items-center justify-center text-[10px]
                              font-bold font-mono shrink-0 ${
                              isCurrent
                                ? `${cfg.border} ${cfg.color}`
                                : isPassed
                                ? 'border-slate-600 text-slate-600'
                                : 'border-slate-800 text-slate-800'
                            }`}>
                              {lvl}
                            </div>
                            <div>
                              <div className={`text-[11px] font-bold ${
                                isCurrent ? cfg.color : 'text-slate-500'
                              }`}>
                                Level {lvl}: {cfg.label}
                                {isCurrent && ' ← CURRENT'}
                              </div>
                              {isCritical && (
                                <div className="text-[8px] font-mono text-intel-red uppercase">
                                  ⚠ Critical threshold
                                </div>
                              )}
                            </div>
                          </div>
                          {isCurrent && (
                            <div className={`text-[9px] font-mono font-bold
                              px-2 py-0.5 rounded ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                              RPI {Math.round(profile.escalationRisk * 100)}
                            </div>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 pl-10 leading-relaxed">
                          {cfg.description}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Critical threshold line */}
                <div className="flex items-center space-x-3 pt-2 border-t border-intel-border/20">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-yellow-500 to-intel-red" />
                  <span className="text-[8px] font-mono text-intel-red uppercase tracking-widest shrink-0">
                    Level 4 threshold — strategy changes here
                  </span>
                  <div className="h-0.5 flex-1 bg-intel-red" />
                </div>
              </div>

              {/* RPI component breakdown */}
              <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  RPI Component Breakdown
                </div>
                {[
                  { label: 'War Exposure', value: profile.exposureLevel, desc: 'War coverage density in information environment' },
                  { label: 'Emotional Activation', value: profile.emotionalActivation, desc: 'Anger, injustice, humiliation signals' },
                  { label: 'Narrative Alignment', value: profile.narrativeAlignment, desc: 'Coherence of ideological framing' },
                  { label: 'Ideological Rigidity', value: profile.ideologicalRigidity, desc: 'Us/Them language, dismissal of alternatives' },
                  { label: 'Pole Synergy', value: profile.synergyCoefficent, desc: 'Convergence of multiple narrative poles' },
                ].map((comp, i) => {
                  const pct = Math.round(comp.value * 100);
                  return (
                    <div key={generateStableKey(comp.label, i, 'breakdown')} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-slate-400">{comp.label}</span>
                        <span className={getRPIColor(comp.value)}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${
                            comp.value >= 0.65 ? 'bg-intel-red' :
                            comp.value >= 0.45 ? 'bg-intel-orange' :
                            comp.value >= 0.25 ? 'bg-yellow-500' : 'bg-intel-cyan'
                          }`}
                        />
                      </div>
                      <div className="text-[8px] text-slate-600">{comp.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ NARRATIVE POLES ══════════════════════════════ */}
          {activeSection === 'poles' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                War activates three distinct narrative poles simultaneously.
                The most dangerous configuration is when Poles 1 and 2
                converge on the same emotional trigger — the synergy effect.
                Pole 3 is a regime suppression mechanism, not a radicalisation vector.
              </p>

              {/* Pole bars */}
              <div className="space-y-4">
                {(Object.entries(POLE_CONFIG) as [NarrativePole, typeof POLE_CONFIG[NarrativePole]][])
                  .filter(([k]) => k !== 'MIXED')
                  .map(([pole, cfg]) => {
                    const score = profile.poleScores[pole] || 0;
                    const isDominant = profile.dominantPole === pole;
                    return (
                      <div key={`pole-stable-${pole}`}
                        className={`p-5 rounded-2xl border space-y-3 ${
                        isDominant
                          ? 'border-intel-orange/30 bg-intel-orange/5'
                          : 'border-intel-border/30 bg-black/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isDominant && (
                              <div className="w-1.5 h-1.5 rounded-full bg-intel-orange animate-pulse" />
                            )}
                            <span className={`text-[11px] font-bold ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {isDominant && (
                              <span className="text-[8px] font-mono text-intel-orange
                                border border-intel-orange/30 px-1.5 py-0.5 rounded">
                                DOMINANT
                              </span>
                            )}
                          </div>
                          <span className={`text-xl font-bold font-mono ${cfg.color}`}>
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(score * 100)}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${
                              pole === 'TRANSNATIONAL_SOLIDARITY' ? 'bg-intel-red' :
                              pole === 'ANTI_SYSTEMIC' ? 'bg-intel-orange' :
                              'bg-intel-cyan'
                            }`}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500 leading-relaxed">
                          {cfg.description}
                        </div>
                        <div className={`text-[8px] font-mono font-bold ${
                          pole === 'REGIME_CAPTURE' ? 'text-intel-cyan' : 'text-intel-orange'
                        }`}>
                          {cfg.riskLabel}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Synergy indicator */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                profile.synergyCoefficent > 0.5
                  ? 'border-intel-red/40 bg-intel-red/8'
                  : 'border-intel-border/30 bg-black/20'
              }`}>
                <div className="flex items-center space-x-2">
                  <Zap className={`w-4 h-4 ${
                    profile.synergyCoefficent > 0.5 ? 'text-intel-red' : 'text-slate-600'
                  }`} />
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Pole Synergy — Convergence Index
                  </span>
                  <span className={`text-lg font-bold font-mono ml-auto ${
                    profile.synergyCoefficent > 0.5 ? 'text-intel-red' : 'text-slate-500'
                  }`}>
                    {(profile.synergyCoefficent * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {profile.synergyCoefficent > 0.5
                    ? 'HIGH SYNERGY: Transnational Solidarity and Anti-Systemic poles are converging on the same emotional trigger. This is the war-synchronization effect — the most dangerous configuration because it amplifies across all three RRI equations simultaneously.'
                    : 'Poles are not significantly converging. Synergy effect not yet active. Monitor for alignment between Pole 1 and Pole 2 signals.'}
                </p>
              </div>
            </div>
          )}

          {/* ═══ PIPELINE ════════════════════════════════════ */}
          {activeSection === 'pipeline' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                The radicalisation pipeline shows how war converts
                into escalation risk through five sequential stages.
                Each stage amplifies the next.
              </p>

              <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-3">
                {[
                  {
                    stage: 'External Shock',
                    value: profile.exposureLevel,
                    desc: `W(t) = ${(rriState.w_t ?? 0.35).toFixed(2)} · War coverage ${Math.round(profile.exposureLevel * 100)}%`,
                    icon: <Radio className="w-3.5 h-3.5" />,
                    source: 'EQ.8 War Intensity',
                  },
                  {
                    stage: 'Emotional Activation',
                    value: profile.emotionalActivation,
                    desc: 'Anger, injustice, humiliation, identity threat signals',
                    icon: <AlertTriangle className="w-3.5 h-3.5" />,
                    source: 'NLP lexicon · Bias tone',
                  },
                  {
                    stage: 'Narrative Framing',
                    value: Math.max(...(Object.values(profile.poleScores).filter(v => typeof v === 'number') as number[])),
                    desc: `Dominant: ${POLE_CONFIG[profile.dominantPole]?.label || 'Computing...'}`,
                    icon: <Layers className="w-3.5 h-3.5" />,
                    source: 'Pole classifier',
                  },
                  {
                    stage: 'Synergy Injection',
                    value: profile.synergyCoefficent,
                    desc: 'Multiple poles converging → alignment becomes self-reinforcing',
                    icon: <Zap className="w-3.5 h-3.5" />,
                    source: 'Cross-pole coherence',
                  },
                  {
                    stage: 'Identity Alignment + Rigidity',
                    value: profile.ideologicalRigidity,
                    desc: 'Exclusionary language, dismissal of alternatives, justification framing',
                    icon: <Lock className="w-3.5 h-3.5" />,
                    source: 'Rigidity lexicon',
                  },
                  {
                    stage: 'Escalation Risk (RPI)',
                    value: profile.escalationRisk,
                    desc: `Level ${profile.escalationLevel}/5: ${LEVEL_CONFIG[profile.escalationLevel].label}`,
                    icon: <AlertCircle className="w-3.5 h-3.5" />,
                    source: 'Composite RPI output',
                  },
                ].map((step, i) => {
                  const pct = Math.round(step.value * 100);
                  const isLast = i === 5;
                  return (
                    <div key={generateStableKey(step.stage, i, 'pipeline-step')}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full border flex items-center
                          justify-center shrink-0 ${
                          pct >= 65 ? 'border-intel-red/50 text-intel-red bg-intel-red/10' :
                          pct >= 45 ? 'border-intel-orange/50 text-intel-orange' :
                          pct >= 25 ? 'border-yellow-500/50 text-yellow-500' :
                          'border-slate-700 text-slate-600'
                        }`}>
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white">
                              {step.stage}
                            </span>
                            <span className={`text-[10px] font-mono font-bold ${
                              getRPIColor(step.value)
                            }`}>{pct}%</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 65 ? 'bg-intel-red' :
                                pct >= 45 ? 'bg-intel-orange' :
                                pct >= 25 ? 'bg-yellow-500' : 'bg-intel-cyan'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-slate-600">{step.desc}</span>
                            <span className="text-[7px] font-mono text-slate-700">{step.source}</span>
                          </div>
                        </div>
                      </div>
                      {!isLast && (
                        <div className="ml-4 pl-4 border-l border-dashed border-slate-800 h-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ EQUATION IMPACT ══════════════════════════════ */}
          {activeSection === 'equations' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                RPI modifies three core RRI equations in real time.
                When radicalisation pressure is high, the model becomes
                more sensitive — protests spread faster, information
                amplifies more violently, domestic salience is no longer
                suppressed by war.
              </p>

              {[
                {
                  eq: 'EQ.3 — Salience S(t)',
                  mechanism: 'War-synchronization modifier',
                  formula: 'numerator += μ × RPI × W(t)',
                  explanation: 'Normally W(t) suppresses domestic grievance salience (war distracts). When RPI is high, war stops suppressing and starts amplifying — radicalized individuals become MORE focused on domestic grievance when external conflict is present.',
                  baseValue: rriState.salience,
                  modifier: (profile.escalationRisk * (rriState.w_t ?? 0.35) * 0.15).toFixed(4),
                  color: 'text-intel-cyan',
                  impact: profile.escalationRisk > 0.4 ? 'Significant — war now amplifying' : 'Low — war still suppressing',
                },
                {
                  eq: 'EQ.4 — SIR Protest Spread',
                  mechanism: 'Modified β (transmission) and γ (recovery)',
                  formula: 'β × (1 + RPI×0.5)  |  γ × (1 - RPI×0.5)',
                  explanation: 'Radicalized individuals spread the narrative faster (higher β) and are harder to pull back (lower γ). Identity-level alignment resists the "recovery" that normal information processing allows.',
                  baseValue: 0.40,
                  modifier: `β → ${(0.40 * (1 + profile.escalationRisk * 0.5)).toFixed(3)} | γ → ${(0.15 * (1 - profile.escalationRisk * 0.5)).toFixed(3)}`,
                  color: 'text-intel-orange',
                  impact: profile.escalationRisk > 0.4 ? 'Significant — protests spread faster' : 'Low — normal dynamics',
                },
                {
                  eq: 'EQ.19 — Information Amplification A(t)',
                  mechanism: 'Radical content amplification multiplier',
                  formula: 'A(t) × (1 + RPI×0.4)',
                  explanation: 'When the information environment is radicalized, all content amplifies more — not just radical content. Emotionally charged framing bypasses normal cognitive filtering and spreads at higher velocity.',
                  baseValue: rriState.info_amplification || 1.0,
                  modifier: `× ${(1 + profile.escalationRisk * 0.4).toFixed(3)}`,
                  color: 'text-intel-purple',
                  impact: profile.escalationRisk > 0.4 ? 'Significant — amplification elevated' : 'Low — normal amplification',
                },
              ].map((eq, i) => (
                <div key={generateStableKey(eq.eq, i, 'equation-card')}
                  className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${eq.color}`}>{eq.eq}</span>
                    <span className="text-[8px] font-mono text-slate-600">{eq.mechanism}</span>
                  </div>
                  <div className={`text-[10px] font-mono px-3 py-2 rounded-lg
                    bg-black/40 border border-white/5 ${eq.color}`}>
                    {eq.formula}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {eq.explanation}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
                    <div>
                      <div className="text-slate-600 mb-0.5">Current modifier</div>
                      <div className={`font-bold ${eq.color}`}>{eq.modifier}</div>
                    </div>
                    <div>
                      <div className="text-slate-600 mb-0.5">Impact</div>
                      <div className={`font-bold ${
                        eq.impact.includes('Significant') ? 'text-intel-orange' : 'text-slate-400'
                      }`}>{eq.impact}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══ INTERVENTION ════════════════════════════════ */}
          {activeSection === 'intervention' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                profile.interventionWindow
                  ? 'border-intel-green/30 bg-intel-green/5'
                  : 'border-intel-red/30 bg-intel-red/5'
              }`}>
                {profile.interventionWindow
                  ? <Shield className="w-4 h-4 text-intel-green shrink-0 mt-0.5" />
                  : <Lock className="w-4 h-4 text-intel-red shrink-0 mt-0.5" />
                }
                <div>
                  <div className={`text-[10px] font-bold font-mono uppercase mb-1 ${
                    profile.interventionWindow ? 'text-intel-green' : 'text-intel-red'
                  }`}>
                    {profile.interventionWindow
                      ? 'Intervention window is open'
                      : 'Intervention window is closed — strategy shift required'}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {levelCfg.intervention}
                  </p>
                </div>
              </div>

              {/* Level-specific guidance */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Current Level {profile.escalationLevel} — Recommended Strategy
                </div>
                {profile.escalationLevel <= 2 && (
                  <div className="space-y-2 text-[10px] text-slate-400">
                    <div className="font-bold text-intel-green">Pre-emptive window (Levels 0-2)</div>
                    <ul className="space-y-1.5 pl-3">
                      {[
                        'Address the underlying grievance — the anger is legitimate even if the narrative is engineered',
                        'Provide emotional closure: explain what is happening and why, with credible evidence',
                        'Use voices from within the affected community, not institutional sources',
                        'Do not attack the narrative directly — introduce an alternative framing',
                        'Monitor W(t) — if war intensity increases, all signals will escalate rapidly',
                      ].map((s, i) => (
                        <li key={generateStableKey(s.slice(0, 20), i, 'strat-low')} className="flex items-start space-x-2">
                          <span className="text-intel-green shrink-0">→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.escalationLevel === 3 && (
                  <div className="space-y-2 text-[10px] text-slate-400">
                    <div className="font-bold text-intel-orange">Competitive window (Level 3) — URGENT</div>
                    <ul className="space-y-1.5 pl-3">
                      {[
                        'Inoculation strategy: expose the ETM structure ("they want you to see these as connected")',
                        'Peer-based counter-messaging using trusted voices within each pole\'s community',
                        'Identify the "reluctant truth-teller" accounts driving peer normalization',
                        'Do NOT issue direct rebuttals — they amplify via the closure mechanism',
                        'Prepare for Level 4 transition — strategy must change rapidly if rigidity increases',
                        'Monitor 72h delta — if RPI increases >0.15 in one cycle, escalate response immediately',
                      ].map((s, i) => (
                        <li key={generateStableKey(s.slice(0, 20), i, 'strat-mid')} className="flex items-start space-x-2">
                          <span className="text-intel-orange shrink-0">→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.escalationLevel >= 4 && (
                  <div className="space-y-2 text-[10px] text-slate-400">
                    <div className="font-bold text-intel-red">
                      Critical — Level {profile.escalationLevel} (no standard counter-narrative)
                    </div>
                    <ul className="space-y-1.5 pl-3">
                      {[
                        'ABANDON direct refutation — it amplifies the closure mechanism',
                        'Narrative substitution: introduce alternative story addressing the same grievance',
                        'Target the anxiety and the grievance, not the ideology or belief content',
                        'Identify the 15-20% who are at Level 3-4 boundary (persuadable)',
                        'Do not engage true believers — focus resources on the persuadable periphery',
                        profile.escalationLevel >= 5
                          ? 'Level 5 detected: intelligence product only. Security and community response required.'
                          : 'Wait for the narrative to produce a visible false prediction, then act on the disappointment',
                      ].map((s, i) => (
                        <li key={generateStableKey(s.slice(0, 20), i, 'strat-high')} className={`flex items-start space-x-2 ${
                          i === 5 && profile.escalationLevel >= 5 ? 'text-intel-red font-bold' : ''
                        }`}>
                          <span className="text-intel-red shrink-0">→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── GEOGRAPHIC TAB ── */}
          {activeSection === 'geographic' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
                <MapPin className="w-4 h-4 text-intel-red" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Geographic Radicalization Distribution</h3>
              </div>

              {/* RPI by region */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">RPI Exposure — Governorate Ranking</div>
                  <div className="space-y-2">
                    {[
                      { gov: 'Gafsa', rpi: 0.78, vector: 'Prison + Mining Unemployment', risk: 'CRITICAL' },
                      { gov: 'Kasserine', rpi: 0.74, vector: 'Border Salafi + Poverty', risk: 'CRITICAL' },
                      { gov: 'Sidi Bouzid', rpi: 0.71, vector: 'Youth Unemployment + Online', risk: 'HIGH' },
                      { gov: 'Kairouan', rpi: 0.68, vector: 'Historical Salafi Networks', risk: 'HIGH' },
                      { gov: 'Tataouine', rpi: 0.62, vector: 'Border Proximity + Isolation', risk: 'HIGH' },
                      { gov: 'Medenine', rpi: 0.58, vector: 'Libya Route + Smuggling', risk: 'HIGH' },
                      { gov: 'Sfax', rpi: 0.52, vector: 'Urban Marginalization', risk: 'MEDIUM' },
                      { gov: 'Ben Arous', rpi: 0.44, vector: 'Online Recruitment', risk: 'MEDIUM' },
                      { gov: 'Tunis', rpi: 0.38, vector: 'University Radicalization', risk: 'MEDIUM' },
                      { gov: 'Sousse', rpi: 0.28, vector: 'Tourist Economy Buffer', risk: 'LOW' },
                    ].map((row, i) => (
                      <div key={generateStableKey(row.gov, i, 'geo-ranking')} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                        <div className="w-24 shrink-0">
                          <div className="text-[10px] font-mono text-white">{row.gov}</div>
                        </div>
                        <div className="flex-1">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${row.rpi > 0.7 ? 'bg-intel-red' : row.rpi > 0.5 ? 'bg-intel-orange' : row.rpi > 0.35 ? 'bg-yellow-500' : 'bg-intel-cyan'}`} style={{ width: `${row.rpi * 100}%` }} />
                          </div>
                          <div className="text-[8px] font-mono text-slate-600 mt-0.5">{row.vector}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-mono font-bold ${row.rpi > 0.7 ? 'text-intel-red' : row.rpi > 0.5 ? 'text-intel-orange' : 'text-yellow-400'}`}>{(row.rpi * 100).toFixed(0)}</span>
                          <span className={`text-[7px] font-mono px-1 py-0.5 rounded border uppercase ${row.risk === 'CRITICAL' ? 'text-intel-red border-intel-red/30' : row.risk === 'HIGH' ? 'text-intel-orange border-intel-orange/30' : 'text-yellow-400 border-yellow-400/30'}`}>{row.risk}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Prison radicalization nodes */}
                  <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Prison Radicalization Nodes</div>
                    <div className="space-y-2">
                      {[
                        { facility: 'Mornaguia', exposure: 44, trend: '↑', severity: 'CRITICAL', note: 'Primary Salafi network hub' },
                        { facility: 'La Manouba', exposure: 31, trend: '↑', severity: 'HIGH', note: 'Political extremism rising' },
                        { facility: 'Sfax Prison', exposure: 24, trend: '↑', severity: 'HIGH', note: 'Criminal-Salafi overlap' },
                        { facility: 'Sousse Prison', exposure: 18, trend: '→', severity: 'MEDIUM', note: 'Stable but monitored' },
                      ].map((p, i) => (
                        <div key={generateStableKey(p.facility, i, 'prison-node')} className={`p-3 rounded-xl border space-y-1 ${p.severity === 'CRITICAL' ? 'border-intel-red/30 bg-intel-red/5' : p.severity === 'HIGH' ? 'border-intel-orange/30' : 'border-intel-border'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-white">{p.facility}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono font-bold ${p.severity === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`}>{p.exposure}% <span className="text-[8px]">{p.trend}</span></span>
                              <span className={`text-[7px] font-mono px-1 py-0.5 rounded border uppercase ${p.severity === 'CRITICAL' ? 'text-intel-red border-intel-red/30' : p.severity === 'HIGH' ? 'text-intel-orange border-intel-orange/30' : 'text-yellow-400 border-yellow-400/30'}`}>{p.severity}</span>
                            </div>
                          </div>
                          <div className="text-[8px] font-mono text-slate-600">{p.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Online recruitment vectors */}
                  <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Online Recruitment Vectors</div>
                    {[
                      { platform: 'Telegram Channels', activity: 82, status: 'ACTIVE', channels: 14 },
                      { platform: 'Facebook Groups', activity: 65, status: 'MONITORED', channels: 28 },
                      { platform: 'TikTok (Youth)', activity: 71, status: 'ACTIVE', channels: '~400k reach' },
                      { platform: 'WhatsApp Cells', activity: 58, status: 'PARTIAL', channels: 'Unknown' },
                    ].map((v, i) => (
                      <div key={generateStableKey(v.platform, i, 'online-vector')} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                        <div>
                          <div className="text-[10px] font-mono text-white">{v.platform}</div>
                          <div className="text-[8px] font-mono text-slate-600">{v.channels}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${v.activity > 70 ? 'bg-intel-red' : 'bg-intel-orange'}`} style={{ width: `${v.activity}%` }} />
                          </div>
                          <span className={`text-[7px] font-mono px-1 py-0.5 rounded border uppercase ${v.status === 'ACTIVE' ? 'text-intel-red border-intel-red/30' : v.status === 'MONITORED' ? 'text-intel-cyan border-intel-cyan/30' : 'text-slate-500 border-slate-700'}`}>{v.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RRI linkage note */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-intel-red/5 border border-intel-red/20">
                <Activity className="w-4 h-4 text-intel-red shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  <span className="text-intel-red font-bold">RRI LINKAGE (EQ.21 + X246):</span> Geographic radicalization distribution feeds directly into X246 NGO_Narrative_Capacity (0.55) and the CPG Disruption Index (J170 = 35). The Gafsa–Kasserine corridor has historically been the ignition zone for national cascades. Current RPI exposure in those two governorates (0.78 / 0.74) represents the highest reading since 2013.
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
