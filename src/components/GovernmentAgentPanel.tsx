import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, Shield, AlertTriangle, Eye,
  Radio, Lock, Activity, Target,
  ChevronRight, Zap, TrendingDown,
  Network, AlertCircle, Clock, BookOpen
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import {
  assessGovernmentAgent, GovAgentAssessment,
  ThreatLevel, RegimeActionType, NarrativeFrame,
  ACTION_LABELS, FRAME_LABELS
} from '../services/govAgent';

// ── Config ─────────────────────────────────────────────────────

const THREAT_CONFIG: Record<ThreatLevel, {
  label: string; color: string; bg: string; border: string; pulse: boolean;
}> = {
  BASELINE:  { label: 'Baseline', color: 'text-slate-400', bg: 'bg-slate-800/30', border: 'border-slate-700', pulse: false },
  ELEVATED:  { label: 'Elevated', color: 'text-yellow-500', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', pulse: false },
  DEFENSIVE: { label: 'Defensive', color: 'text-intel-orange', bg: 'bg-intel-orange/8', border: 'border-intel-orange/30', pulse: false },
  CRISIS:    { label: 'Crisis', color: 'text-intel-red', bg: 'bg-intel-red/10', border: 'border-intel-red/40', pulse: true },
  EMERGENCY: { label: 'Emergency', color: 'text-intel-red', bg: 'bg-intel-red/15', border: 'border-intel-red/60', pulse: true },
};

const ACTION_ICONS: Partial<Record<RegimeActionType, React.ReactNode>> = {
  SUPPRESSION_TARGETED: <Lock className="w-3.5 h-3.5" />,
  SUPPRESSION_BROAD: <AlertTriangle className="w-3.5 h-3.5" />,
  NARRATIVE_INJECTION: <Radio className="w-3.5 h-3.5" />,
  DISTRACTION_GENERATE: <Activity className="w-3.5 h-3.5" />,
  ELITE_LOYALTY_REINFORCE: <Network className="w-3.5 h-3.5" />,
  ECONOMIC_EMERGENCY: <TrendingDown className="w-3.5 h-3.5" />,
  MIGRATION_DEPLOY: <Target className="w-3.5 h-3.5" />,
  ANTI_CORRUPTION_ARREST: <Shield className="w-3.5 h-3.5" />,
  CONSTITUTIONAL_MOVE: <BookOpen className="w-3.5 h-3.5" />,
  SECURITY_APPARATUS_SIGNAL: <Zap className="w-3.5 h-3.5" />,
  DIGITAL_SUPPRESSION: <Eye className="w-3.5 h-3.5" />,
};

// ── Sub-components ─────────────────────────────────────────────

const ConstraintBar: React.FC<{
  label: string;
  current: number;
  threshold: number;
  status: string;
  implication: string;
}> = ({ label, current, threshold, status, implication }) => {
  const pct = Math.round(current * 100);
  const thresholdPct = Math.round(threshold * 100);
  const color =
    status === 'NEAR_LIMIT' ? 'bg-intel-red' :
    status === 'STRESSED'   ? 'bg-intel-orange' :
    'bg-intel-cyan';
  const textColor =
    status === 'NEAR_LIMIT' ? 'text-intel-red' :
    status === 'STRESSED'   ? 'text-intel-orange' :
    'text-intel-cyan';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[9px] font-mono">
        <span className="text-slate-400">{label}</span>
        <div className="flex items-center space-x-2">
          <span className="text-slate-700">threshold {thresholdPct}%</span>
          <span className={`font-bold ${textColor}`}>
            {pct}% — {status.replace(/_/g,' ')}
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${color}`}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500"
          style={{ left: `${thresholdPct}%` }}
        />
      </div>
      <p className="text-[8px] text-slate-600 leading-snug">{implication}</p>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────

export const GovernmentAgentPanel: React.FC = () => {
  const {
    rriState, data,
    miiProfile, actorNetwork, seiResult,
  } = usePipeline();

  const [activeSection, setActiveSection] = useState<
    'threat' | 'actions' | 'brain_mouth' | 'constraints' | 'intelligence'
  >('threat');

  const assessment = useMemo<GovAgentAssessment>(() => {
    return assessGovernmentAgent(
      rriState, data,
      { miiProfile, actorNetwork, seiResult }
    );
  }, [rriState, data, miiProfile, actorNetwork, seiResult]);

  const threatCfg = THREAT_CONFIG[assessment.threatLevel];

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-intel-purple" />
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">
            Government Agent — Regime Cognitive Model
          </h2>
        </div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-8">
          Deterministic decision engine · Brain/mouth architecture ·
          Four hard constraints · Predicted actions
        </p>
      </div>

      {/* ── Threat perception banner ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-5
        space-y-4 ${threatCfg.bg} ${threatCfg.border}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full
          blur-3xl opacity-10 pointer-events-none ${
          assessment.threatLevel === 'CRISIS' || assessment.threatLevel === 'EMERGENCY'
            ? 'bg-intel-red' : 'bg-intel-orange'
        }`} style={{ transform: 'translate(30%,-30%)' }} />

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Threat level */}
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Regime Threat Perception
            </div>
            <div className="flex items-center space-x-2">
              {assessment.threatLevel !== 'BASELINE' && (
                <div className={`w-2 h-2 rounded-full ${
                  threatCfg.pulse ? 'animate-pulse' : ''
                } ${threatCfg.color.replace('text-','bg-')}`} />
              )}
              <span className={`text-xl font-bold font-mono uppercase ${threatCfg.color}`}>
                {threatCfg.label}
              </span>
            </div>
            <div className={`text-5xl font-bold font-mono leading-none ${threatCfg.color}`}>
              {assessment.threatScore}
            </div>
          </div>

          {/* Regime phase */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Regime Phase
            </div>
            <div className={`text-[10px] font-bold font-mono ${threatCfg.color}`}>
              {assessment.regimePhase.replace(/_/g,' ')}
            </div>
            <div className="text-[8px] text-slate-600 leading-snug">
              {assessment.adaptationMode.slice(0, 80)}...
            </div>
          </div>

          {/* Survival confidence */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Survival Confidence
            </div>
            <div className={`text-3xl font-bold font-mono ${
              assessment.survivalConfidence < 40 ? 'text-intel-red' :
              assessment.survivalConfidence < 60 ? 'text-intel-orange' :
              'text-slate-300'
            }`}>{assessment.survivalConfidence}%</div>
          </div>

          {/* Strategic ambiguity */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Strategic Ambiguity
            </div>
            <div className={`text-3xl font-bold font-mono ${
              assessment.strategicAmbiguityLevel > 0.70 ? 'text-intel-red' :
              assessment.strategicAmbiguityLevel > 0.50 ? 'text-intel-orange' :
              'text-yellow-500'
            }`}>{Math.round(assessment.strategicAmbiguityLevel * 100)}%</div>
            <div className="text-[8px] text-slate-600">Brain/mouth divergence</div>
          </div>
        </div>

        {/* Active narrative frame */}
        <div className="relative z-10 flex items-center space-x-3 pt-3
          border-t border-white/5">
          <Radio className={`w-3.5 h-3.5 shrink-0 ${threatCfg.color}`} />
          <div>
            <span className="text-[8px] font-mono text-slate-600 uppercase">
              Active mouth frame:
            </span>
            <span className={`text-[9px] font-mono font-bold ml-2 ${threatCfg.color}`}>
              {FRAME_LABELS[assessment.activeNarrativeFrame]}
            </span>
          </div>
        </div>
      </div>

      {/* ── Section nav ── */}
      <div className="flex items-center space-x-1 bg-black/40 border
        border-intel-border rounded-xl p-1 overflow-x-auto scrollbar-hide w-fit max-w-full">
        {[
          { id: 'threat', label: 'Threat Model', icon: AlertCircle },
          { id: 'actions', label: 'Predicted Actions', icon: Target },
          { id: 'brain_mouth', label: 'Brain / Mouth', icon: Brain },
          { id: 'constraints', label: 'Constraints', icon: Lock },
          { id: 'intelligence', label: 'Assessment', icon: Eye },
        ].map(s => {
          const Icon = s.icon;
          const isUrgent = s.id === 'actions' && assessment.urgentActions.length > 0;
          return (
            <button key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`relative flex items-center space-x-2 px-3 py-2
                rounded-lg text-[9px] font-mono uppercase tracking-wider
                whitespace-nowrap transition-all ${
                activeSection === s.id
                  ? 'bg-intel-purple/10 text-intel-purple border border-intel-purple/20'
                  : 'text-slate-600 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{s.label}</span>
              {isUrgent && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full
                  bg-intel-red text-[6px] font-bold text-white flex items-center
                  justify-center">{assessment.urgentActions.length}</div>
              )}
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

          {/* ═══ THREAT MODEL ═══════════════════════════════════ */}
          {activeSection === 'threat' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                The regime's threat perception is not the same as actual risk.
                It is most sensitive to UGTT formal action, elite signals, and
                Tunis activation. It systematically underweights interior governorate
                grievance (viewed as manageable) and international pressure
                (handled via narrative divergence).
              </p>

              {/* Threat drivers */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  What the Regime Is Watching
                </div>
                {assessment.threatDrivers.length > 0 ? (
                  assessment.threatDrivers.map((driver, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className={`w-6 h-6 rounded-full border flex items-center
                        justify-center text-[9px] font-bold shrink-0 ${
                        i === 0
                          ? 'border-intel-red/40 text-intel-red'
                          : 'border-intel-orange/30 text-intel-orange'
                      }`}>{i + 1}</div>
                      <span className="text-[10px] text-slate-300 leading-snug">
                        {driver}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-600">
                    No significant threat signals above baseline threshold.
                  </p>
                )}
              </div>

              {/* Regime phase detail */}
              <div className={`p-5 rounded-2xl border space-y-3 ${threatCfg.bg} ${threatCfg.border}`}>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Operational Mode
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {assessment.adaptationMode}
                </p>
              </div>

              {/* Critical constraint */}
              {assessment.criticalConstraint && (
                <div className="p-4 rounded-xl border border-intel-red/30
                  bg-intel-red/5 space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-intel-red" />
                    <span className="text-[9px] font-mono text-intel-red uppercase">
                      Critical Constraint Under Pressure
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 pl-5">
                    {assessment.criticalConstraint} is approaching threshold.
                    This is the variable the regime is most urgently managing.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ PREDICTED ACTIONS ══════════════════════════════ */}
          {activeSection === 'actions' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Predicted regime actions based on current threat level and
                constraint stresses. Each action has a deterministic trigger
                condition and a detectable RSS signal. These are not guesses —
                they are the historically documented playbook.
              </p>

              {assessment.predictedActions.slice(0, 6).map((action, i) => {
                const prob = Math.round(action.probability * 100);
                const icon = ACTION_ICONS[action.type] ?? <Target className="w-3.5 h-3.5" />;
                const isUrgent = prob >= 55;
                return (
                  <div key={i}
                    className={`p-5 rounded-2xl border space-y-3 ${
                    isUrgent
                      ? 'border-intel-red/30 bg-intel-red/5'
                      : prob >= 40
                      ? 'border-intel-orange/20 bg-intel-orange/3'
                      : 'border-intel-border/30 bg-black/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={isUrgent ? 'text-intel-red' : 'text-intel-orange'}>
                          {icon}
                        </div>
                        <span className={`text-[11px] font-bold ${
                          isUrgent ? 'text-intel-red' :
                          prob >= 40 ? 'text-intel-orange' : 'text-slate-300'
                        }`}>
                          {ACTION_LABELS[action.type]}
                        </span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5
                          rounded border ${
                          action.horizon === '7d'
                            ? 'border-intel-red/30 text-intel-red'
                            : action.horizon === '30d'
                            ? 'border-intel-orange/30 text-intel-orange'
                            : 'border-slate-700 text-slate-600'
                        }`}>{action.horizon}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[7px] font-mono text-slate-700">Probability</div>
                        <div className={`text-2xl font-bold font-mono ${
                          prob >= 55 ? 'text-intel-red' :
                          prob >= 40 ? 'text-intel-orange' : 'text-slate-400'
                        }`}>{prob}%</div>
                      </div>
                    </div>

                    {/* Probability bar */}
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        prob >= 55 ? 'bg-intel-red' :
                        prob >= 40 ? 'bg-intel-orange' : 'bg-yellow-500'
                      }`} style={{ width: `${prob}%` }} />
                    </div>

                    <div className="space-y-1.5 text-[9px]">
                      <div>
                        <span className="text-slate-600">Trigger: </span>
                        <span className="text-slate-400">{action.trigger}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">How: </span>
                        <span className="text-slate-400">{action.mechanism}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Effect: </span>
                        <span className="text-slate-500">{action.estimatedEffect}</span>
                      </div>
                      {action.historicalPrecedent && (
                        <div>
                          <span className="text-slate-600">Precedent: </span>
                          <span className="text-slate-600 italic">{action.historicalPrecedent}</span>
                        </div>
                      )}
                    </div>

                    {/* Detectable signal */}
                    <div className="flex items-center space-x-2 pt-1 border-t border-white/5">
                      <Radio className="w-3 h-3 text-intel-cyan shrink-0" />
                      <span className="text-[8px] font-mono text-intel-cyan/70">
                        {action.detectableSignal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ BRAIN / MOUTH ══════════════════════════════════ */}
          {activeSection === 'brain_mouth' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                The regime's brain and mouth are intentionally decoupled.
                The brain optimizes for survival under hard constraints.
                The mouth performs for domestic and international audiences
                simultaneously, often saying the opposite of what the brain is doing.
                The divergence is not inconsistency — it is the mechanism.
              </p>

              {/* Narrative prediction */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                threatCfg.bg} ${threatCfg.border}`}>
                <div className="flex items-center space-x-2">
                  <Radio className={`w-3.5 h-3.5 ${threatCfg.color}`} />
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${threatCfg.color}`}>
                    Predicted Mouth Narrative — {FRAME_LABELS[assessment.activeNarrativeFrame]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {assessment.narrativePrediction}
                </p>
              </div>

              {/* Brain/Mouth divergences */}
              <div className="space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Strategic Divergences (Brain ≠ Mouth)
                </div>
                {assessment.brainMouthDivergences.map((div, i) => {
                  const divPct = Math.round(div.divergenceScore * 100);
                  return (
                    <div key={i}
                      className={`p-5 rounded-2xl border space-y-4 ${
                      divPct >= 70
                        ? 'border-intel-red/30 bg-intel-red/5'
                        : 'border-intel-orange/20 bg-intel-orange/3'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white">
                          {div.topic}
                        </span>
                        <div className="text-right shrink-0">
                          <div className="text-[7px] font-mono text-slate-600">Divergence</div>
                          <div className={`text-xl font-bold font-mono ${
                            divPct >= 70 ? 'text-intel-red' : 'text-intel-orange'
                          }`}>{divPct}%</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-1.5">
                            <Brain className="w-3 h-3 text-intel-purple" />
                            <span className="text-[8px] font-mono text-intel-purple uppercase">
                              Brain (what it does)
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-300 leading-relaxed">
                            {div.brainPosition}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-1.5">
                            <Radio className="w-3 h-3 text-intel-orange" />
                            <span className="text-[8px] font-mono text-intel-orange uppercase">
                              Mouth (what it says)
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-300 leading-relaxed">
                            {div.mouthPosition}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-3
                        text-[8px] font-mono">
                        <div>
                          <span className="text-slate-600">Audience: </span>
                          <span className="text-slate-400">{div.audienceTargeted}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Purpose: </span>
                          <span className="text-slate-400">{div.strategicPurpose}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ CONSTRAINTS ════════════════════════════════════ */}
          {activeSection === 'constraints' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                The regime's four hard constraints. These are not preferences —
                they are the structural limits within which all decisions happen.
                When any constraint is near its threshold, regime behavior changes
                qualitatively, not just quantitatively.
              </p>

              {assessment.constraintStresses.map((c, i) => (
                <div key={i} className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                  <ConstraintBar
                    label={c.constraint}
                    current={c.current}
                    threshold={c.threshold}
                    status={c.status}
                    implication={c.implication}
                  />
                </div>
              ))}

              {/* The survival function */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  The Survival Function
                </div>
                <div className="text-[10px] font-mono text-intel-purple bg-black/40
                  border border-intel-border/30 px-4 py-3 rounded-xl space-y-1">
                  <div>Maximize(survival) subject to:</div>
                  <div className="text-slate-400 pl-4">Military loyalty ≥ threshold</div>
                  <div className="text-slate-400 pl-4">Western security cooperation ≠ broken</div>
                  <div className="text-slate-400 pl-4">Domestic economic minimum ≠ breached</div>
                  <div className="text-slate-400 pl-4">Elite cohesion ≥ minimum</div>
                  <div className="text-intel-orange mt-2">
                    Not ideology. Not values. Constraint optimization.
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 leading-relaxed">
                  The regime has no coherent ideology in the classical sense.
                  It has a survival function with constraints. Every decision —
                  the mouth, the brain, the reflex — can be traced to this function.
                  "What maintains the minimum conditions for continued rule?"
                </p>
              </div>
            </div>
          )}

          {/* ═══ INTELLIGENCE ASSESSMENT ════════════════════════ */}
          {activeSection === 'intelligence' && (
            <div className="space-y-5">

              {/* Main assessment */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                threatCfg.bg} ${threatCfg.border}`}>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Analytical Assessment
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {assessment.analystAssessment}
                </p>
              </div>

              {/* Watch signals */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-intel-cyan" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    RSS Watch Signals (What Will Confirm Predictions)
                  </span>
                </div>
                <div className="space-y-2">
                  {assessment.watchSignals.map((sig, i) => (
                    <div key={i}
                      className="text-[9px] font-mono text-intel-cyan/70 bg-black/30
                        border border-intel-cyan/10 px-3 py-2 rounded-lg">
                      {sig}
                    </div>
                  ))}
                </div>
              </div>

              {/* Reflex layer note */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  The Reflex Layer (Security Apparatus)
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Below the brain and mouth is the security apparatus — Interior Ministry,
                  security services, judicial prosecutors. This layer reacts faster than
                  both the brain and mouth. It has its own institutional logic: protect
                  the information environment, maintain public deterrence, prevent
                  coordination. It sometimes acts before the political decision is made.
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Detection: Decree 54 prosecutions, security deployments in interior
                  governorates, and journalist detentions often precede formal policy
                  announcements. When the reflex layer is active, it signals that the
                  brain has already made a decision the mouth hasn't announced yet.
                </p>
                <div className="text-[9px] font-mono text-intel-orange">
                  Watch signal: reflex = advance warning of brain decision.
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
