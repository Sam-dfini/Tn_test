import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, Eye, Shield, AlertTriangle, ChevronRight,
  Radio, Lock, Users, Zap, Network, Clock,
  AlertCircle, CheckCircle, XCircle, Activity,
  Target, Layers
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { useRSS } from '../context/RSSContext';
import {
  analyzeETM, computeCognitiveEnvironment,
  ETMNarrative, ETMElements, ConstructionPhase,
  NarrativeVector, CognitiveEnvironment
} from '../services/etmEngine';
import { ModuleHeader } from './ProfessionalShared';

// ── Sub-components ─────────────────────────────────────────────

const PhaseTag: React.FC<{ phase: ConstructionPhase }> = ({ phase }) => {
  const config = {
    CLOSURE:       { color: 'text-intel-red border-intel-red/40 bg-intel-red/10', label: 'CLOSURE' },
    AMPLIFICATION: { color: 'text-intel-orange border-intel-orange/40 bg-intel-orange/10', label: 'AMPLIFICATION' },
    SEED:          { color: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10', label: 'SEED' },
    DORMANT:       { color: 'text-slate-500 border-slate-700 bg-slate-800/50', label: 'DORMANT' },
  };
  const c = config[phase];
  return (
    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${c.color}`}>
      {c.label}
    </span>
  );
};

const VectorTag: React.FC<{ vector: NarrativeVector }> = ({ vector }) => {
  const config = {
    REGIME:     { color: 'text-intel-cyan', label: 'REGIME' },
    OPPOSITION: { color: 'text-intel-orange', label: 'OPPOSITION' },
    EXTERNAL:   { color: 'text-intel-purple', label: 'EXTERNAL' },
    HYBRID:     { color: 'text-yellow-500', label: 'HYBRID' },
  };
  const c = config[vector];
  return (
    <span className={`text-[8px] font-mono ${c.color}`}>{c.label}</span>
  );
};

const ETMGauge: React.FC<{
  label: string;
  score: number;
  description: string;
  icon: React.ReactNode;
}> = ({ label, score, description, icon }) => {
  const color = score >= 70 ? 'bg-intel-red' :
                score >= 45 ? 'bg-intel-orange' :
                score >= 25 ? 'bg-yellow-500' : 'bg-slate-700';
  const textColor = score >= 70 ? 'text-intel-red' :
                    score >= 45 ? 'text-intel-orange' :
                    score >= 25 ? 'text-yellow-500' : 'text-slate-600';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-slate-600">{icon}</span>
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <span className={`text-[11px] font-mono font-bold ${textColor}`}>
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, type: 'spring' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <div className="text-[8px] text-slate-600">{description}</div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────

export const CognitiveSecurityIntelligence: React.FC = () => {
  const { rriState, cognitiveEnvironment } = usePipeline();
  const { articles } = useRSS();
  const [selectedNarrative, setSelectedNarrative] =
    useState<ETMNarrative | null>(null);
  const [activeSection, setActiveSection] =
    useState<'environment' | 'anatomy' | 'timeline' | 'anxiety' | 'intervention'>(
      'environment'
    );

  // Use cached cognitive environment from pipeline, or compute live
  const env: CognitiveEnvironment = useMemo(() => {
    if (cognitiveEnvironment) return cognitiveEnvironment;
    const narratives = analyzeETM(articles as any, 72);
    return computeCognitiveEnvironment(narratives);
  }, [cognitiveEnvironment, articles]);

  const narratives = env.narratives;

  // Phase order for timeline display
  const phaseOrder: ConstructionPhase[] = ['SEED', 'AMPLIFICATION', 'CLOSURE'];

  const getClosureColor = (score: number) =>
    score >= 70 ? 'text-intel-red' :
    score >= 45 ? 'text-intel-orange' :
    score >= 25 ? 'text-yellow-500' : 'text-intel-cyan';

  const getClosureBg = (score: number) =>
    score >= 70 ? 'border-intel-red/30 bg-intel-red/5' :
    score >= 45 ? 'border-intel-orange/30 bg-intel-orange/5' :
    score >= 25 ? 'border-yellow-500/20 bg-yellow-500/5' :
    'border-intel-border/30 bg-black/20';

  return (
    <div className="space-y-6 pb-8">

      <ModuleHeader
        title="Cognitive Security Intelligence"
        subtitle="ETM detection · Narrative closure mapping · Construction phase analysis · Intervention windows"
        icon={Brain}
        nodeId="COG-SEC-01"
      />

      {/* ── Top-level environment summary ── */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 space-y-4 ${
        env.phase === 'CLOSURE'
          ? 'border-intel-red/40 bg-gradient-to-br from-intel-red/10 to-black/60'
          : env.phase === 'AMPLIFICATION'
          ? 'border-intel-orange/30 bg-gradient-to-br from-intel-orange/8 to-black/60'
          : 'border-intel-border bg-gradient-to-br from-white/[0.02] to-black/60'
      }`}>
        {/* Ambient glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl
          pointer-events-none opacity-15 ${
          env.phase === 'CLOSURE' ? 'bg-intel-red' :
          env.phase === 'AMPLIFICATION' ? 'bg-intel-orange' :
          'bg-intel-purple'
        }`} style={{ transform: 'translate(30%,-30%)' }} />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {/* Closure score */}
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Narrative Closure
            </div>
            <div className={`text-6xl font-bold font-mono leading-none ${
              getClosureColor(Math.round(env.narrativeClosure * 100))
            }`}>
              {Math.round(env.narrativeClosure * 100)}
            </div>
            <div className="text-[9px] font-mono text-slate-600">/ 100</div>
          </div>

          {/* Phase + vector */}
          <div className="space-y-3">
            <div>
              <div className="text-[8px] font-mono text-slate-600 mb-1">Phase</div>
              <PhaseTag phase={env.phase} />
            </div>
            <div>
              <div className="text-[8px] font-mono text-slate-600 mb-1">Vector</div>
              <VectorTag vector={env.dominantVector} />
            </div>
            <div>
              <div className="text-[8px] font-mono text-slate-600 mb-1">
                Intervention
              </div>
              <span className={`text-[9px] font-mono font-bold ${
                env.interventionStillPossible ? 'text-intel-green' : 'text-intel-red'
              }`}>
                {env.interventionStillPossible ? '✓ WINDOW OPEN' : '✕ CLOSURE REACHED'}
              </span>
            </div>
          </div>

          {/* SAI bar */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Sustained Anxiety Index
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-slate-600">SAI</span>
                <span className={getClosureColor(
                  Math.round(env.sustainedAnxietyIndex * 100)
                )}>
                  {Math.round(env.sustainedAnxietyIndex * 100)}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${env.sustainedAnxietyIndex * 100}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full rounded-full ${
                    env.sustainedAnxietyIndex > 0.7 ? 'bg-intel-red' :
                    env.sustainedAnxietyIndex > 0.4 ? 'bg-intel-orange' :
                    'bg-intel-cyan'
                  }`}
                />
              </div>
              <div className="text-[8px] text-slate-600 leading-snug">
                Unresolved threat emphasis in the information environment
              </div>
            </div>
          </div>

          {/* Active narratives count */}
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Active Narratives
            </div>
            <div className="text-4xl font-bold font-mono text-white">
              {narratives.filter(n => n.phase !== 'DORMANT').length}
            </div>
            <div className="text-[9px] text-slate-600">
              {narratives.filter(n => n.phase === 'CLOSURE').length} at closure ·{' '}
              {narratives.filter(n => n.phase === 'AMPLIFICATION').length} amplifying
            </div>
          </div>
        </div>

        {/* Situation description */}
        <div className="relative z-10 pt-4 border-t border-white/5">
          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            {env.mostDangerousCombination}
          </p>
        </div>
      </div>

      {/* ── Section navigation ── */}
      <div className="flex items-center space-x-1 bg-black/40 border
        border-intel-border rounded-xl p-1 overflow-x-auto scrollbar-hide w-fit">
        {[
          { id: 'environment', label: 'Narrative Map', icon: Network },
          { id: 'anatomy', label: 'ETM Anatomy', icon: Layers },
          { id: 'timeline', label: 'Construction', icon: Clock },
          { id: 'anxiety', label: 'Anxiety Index', icon: Activity },
          { id: 'intervention', label: 'Intervention', icon: Shield },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg
                text-[9px] font-mono uppercase tracking-wider whitespace-nowrap
                transition-all ${
                activeSection === s.id
                  ? 'bg-intel-purple/10 text-intel-purple border border-intel-purple/20'
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

          {/* ═══ NARRATIVE MAP ════════════════════════════════ */}
          {activeSection === 'environment' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Active narrative clusters detected in the information environment.
                Each cluster is analyzed for ETM elements, construction phase,
                and intervention window status.
              </p>

              {narratives.length === 0 ? (
                <div className="flex flex-col items-center justify-center
                  py-16 border border-dashed border-intel-border/30 rounded-2xl">
                  <Brain className="w-8 h-8 text-slate-800 mb-3" />
                  <span className="text-[10px] font-mono text-slate-700 uppercase">
                    No narrative clusters detected in RSS feed (72h window)
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {narratives.map(narrative => (
                    <motion.button
                      key={narrative.id}
                      onClick={() => {
                        setSelectedNarrative(
                          selectedNarrative?.id === narrative.id ? null : narrative
                        );
                        setActiveSection('anatomy');
                      }}
                      className={`w-full text-left p-5 rounded-2xl border
                        transition-all group ${getClosureBg(narrative.closureScore)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            narrative.phase === 'CLOSURE' ? 'bg-intel-red animate-pulse' :
                            narrative.phase === 'AMPLIFICATION' ? 'bg-intel-orange animate-pulse' :
                            narrative.phase === 'SEED' ? 'bg-yellow-500' :
                            'bg-slate-600'
                          }`} />
                          <span className="text-[11px] font-bold text-white">
                            {narrative.label}
                          </span>
                          <PhaseTag phase={narrative.phase} />
                          <VectorTag vector={narrative.vector} />
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-2xl font-bold font-mono ${
                            getClosureColor(narrative.closureScore)
                          }`}>{narrative.closureScore}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600
                            group-hover:text-white transition-colors" />
                        </div>
                      </div>

                      {/* ETM elements mini-bars */}
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        {[
                          { key: 'patternicity', label: 'Pattern' },
                          { key: 'agencyAttribution', label: 'Agency' },
                          { key: 'existentialThreat', label: 'Threat' },
                          { key: 'coalition', label: 'Coalition' },
                          { key: 'secrecy', label: 'Secrecy' },
                        ].map(e => {
                          const val = narrative.elements[e.key as keyof ETMElements];
                          return (
                            <div key={e.key} className="space-y-1">
                              <div className="text-[7px] font-mono text-slate-600 truncate">
                                {e.label}
                              </div>
                              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    val >= 70 ? 'bg-intel-red' :
                                    val >= 45 ? 'bg-intel-orange' :
                                    val >= 25 ? 'bg-yellow-500' : 'bg-slate-700'
                                  }`}
                                  style={{ width: `${val}%` }}
                                />
                              </div>
                              <div className="text-[7px] font-mono text-slate-600">{val}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between
                        text-[8px] font-mono text-slate-600">
                        <span>{narrative.articleCount} articles ·{' '}
                          {narrative.governoratesActive.slice(0, 3).join(', ')}
                        </span>
                        <span className={`font-bold ${
                          narrative.interventionWindow ? 'text-intel-green' : 'text-intel-red'
                        }`}>
                          {narrative.interventionWindow ? '✓ Intervention possible' : '✕ Closure reached'}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ ETM ANATOMY ══════════════════════════════════ */}
          {activeSection === 'anatomy' && (
            <div className="space-y-5">
              {/* Narrative selector */}
              {narratives.length > 0 && (
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  {narratives.map(n => (
                    <button key={n.id}
                      onClick={() => setSelectedNarrative(n)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono
                        uppercase border transition-all ${
                        selectedNarrative?.id === n.id
                          ? 'border-intel-purple/40 bg-intel-purple/10 text-intel-purple'
                          : 'border-intel-border/30 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              )}

              {(selectedNarrative || narratives[0]) ? (() => {
                const n = selectedNarrative || narratives[0];
                return (
                  <div className="space-y-5">

                    {/* Five ETM elements */}
                    <div className="glass p-6 rounded-2xl border
                      border-intel-border/50 space-y-5">
                      <div className="text-[9px] font-mono text-slate-500
                        uppercase tracking-widest">
                        ETM Element Scores — {n.label}
                      </div>

                      <ETMGauge
                        label="Patternicity"
                        score={n.elements.patternicity}
                        description="Spatial/temporal clustering of real events used as evidence of coordination. Score indicates how strongly routine coincidences are reframed as designed."
                        icon={<Network className="w-3 h-3" />}
                      />
                      <ETMGauge
                        label="Agency Attribution"
                        score={n.elements.agencyAttribution}
                        description="Responsibility shifted from accident to intentional hidden actors. High score = specific actors named, institutional uniformity detected."
                        icon={<Target className="w-3 h-3" />}
                      />
                      <ETMGauge
                        label="Existential Threat"
                        score={n.elements.existentialThreat}
                        description="Group identity or survival dimension activated. High score = narrative has attached to cultural, religious, or national identity."
                        icon={<AlertTriangle className="w-3 h-3" />}
                      />
                      <ETMGauge
                        label="Coalition"
                        score={n.elements.coalition}
                        description="Breadth of the 'they' — multiple actors named in coordinated conspiracy. High score = narrative is unfalsifiable by debunking any single actor."
                        icon={<Users className="w-3 h-3" />}
                      />
                      <ETMGauge
                        label="Secrecy / Unfalsifiability"
                        score={n.elements.secrecy}
                        description="Counter-evidence reinterpreted as proof of concealment. Absence-as-evidence logic. High score = narrative is closed to refutation."
                        icon={<Lock className="w-3 h-3" />}
                      />
                    </div>

                    {/* Closure reading + anchor events */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-5 rounded-2xl border space-y-3 ${
                        getClosureBg(n.closureScore)
                      }`}>
                        <div className="text-[9px] font-mono text-slate-500
                          uppercase tracking-widest">Closure Score</div>
                        <div className={`text-5xl font-bold font-mono ${
                          getClosureColor(n.closureScore)
                        }`}>{n.closureScore}</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          {n.closureScore >= 70
                            ? 'CLOSED: Unfalsifiable. Fact-checking now amplifies the narrative.'
                            : n.closureScore >= 45
                            ? 'AMPLIFYING: Source synergy active. Counter-narrative still viable.'
                            : n.closureScore >= 25
                            ? 'SEEDING: Early construction. High receptivity to counter-narrative.'
                            : 'DORMANT: Below activation threshold.'}
                        </div>
                      </div>

                      <div className="glass p-5 rounded-2xl border
                        border-intel-border/50 space-y-3">
                        <div className="text-[9px] font-mono text-slate-500
                          uppercase tracking-widest">Anchor Events</div>
                        <div className="space-y-2">
                          {n.anchorEvents.length > 0 ? n.anchorEvents.map((e, index) => (
                            <div key={`${e}-${index}`}
                              className="flex items-center space-x-2 text-[10px]">
                              <div className="w-1 h-1 rounded-full bg-intel-orange shrink-0" />
                              <span className="text-slate-300">{e}</span>
                            </div>
                          )) : (
                            <span className="text-[10px] text-slate-600 italic">
                              No specific anchor events identified
                            </span>
                          )}
                        </div>
                        <div className="pt-2 border-t border-white/5">
                          <div className="text-[9px] font-mono text-slate-600 mb-1">
                            Named agents
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {n.agentsNamed.length > 0
                              ? n.agentsNamed.map((a, index) => (
                                <span key={`${a}-${index}`}
                                  className="text-[8px] font-mono px-1.5 py-0.5
                                    rounded bg-intel-red/10 border border-intel-red/20
                                    text-intel-red">{a}</span>
                              ))
                              : <span className="text-[9px] text-slate-600 italic">None detected</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unfalsifiability signals */}
                    {n.unfalsifiabilitySignals.length > 0 && (
                      <div className="glass p-5 rounded-2xl border
                        border-intel-red/20 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-3.5 h-3.5 text-intel-red" />
                          <div className="text-[9px] font-mono text-intel-red
                            uppercase tracking-widest">
                            Unfalsifiability Signals Detected
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {n.unfalsifiabilitySignals.map((s, index) => (
                            <span key={`${s}-${index}`}
                              className="text-[9px] font-mono px-2 py-1
                                bg-intel-red/10 border border-intel-red/20
                                text-intel-red rounded italic">
                              "{s}"
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          These phrases indicate the narrative is using secrecy logic —
                          any counter-evidence will be reinterpreted as confirmation
                          of concealment.
                        </p>
                      </div>
                    )}

                    {/* Sample headlines */}
                    {n.sampleHeadlines.length > 0 && (
                      <div className="glass p-5 rounded-2xl border
                        border-intel-border/50 space-y-3">
                        <div className="text-[9px] font-mono text-slate-500
                          uppercase tracking-widest">Sample Evidence Articles</div>
                        <div className="space-y-2">
                          {n.sampleHeadlines.map((h, i) => (
                            <div key={i}
                              className="flex items-start space-x-2 text-[10px]">
                              <span className="text-slate-700 font-mono shrink-0">
                                {i + 1}.
                              </span>
                              <span className="text-slate-300 leading-snug">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="text-[10px] font-mono text-slate-700 text-center py-12">
                  No narrative selected. RSS feeds will populate this when articles arrive.
                </div>
              )}
            </div>
          )}

          {/* ═══ CONSTRUCTION TIMELINE ═══════════════════════ */}
          {activeSection === 'timeline' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                The construction pipeline maps where each narrative is in its
                lifecycle. Intervention is only effective during Seed and
                Amplification phases. Once Closure is reached, refutation
                becomes counterproductive.
              </p>

              {/* Phase pipeline */}
              <div className="glass p-6 rounded-2xl border border-intel-border/50">
                <div className="grid grid-cols-3 gap-4 relative">
                  {/* Connecting line */}
                  <div className="absolute top-6 left-[17%] right-[17%] h-0.5
                    bg-gradient-to-r from-yellow-500 via-intel-orange to-intel-red" />

                  {['SEED', 'AMPLIFICATION', 'CLOSURE'].map((phase, idx) => {
                    const inPhase = narratives.filter(n => n.phase === phase);
                    const colors = [
                      'text-yellow-500 border-yellow-500/40 bg-yellow-500/10',
                      'text-intel-orange border-intel-orange/40 bg-intel-orange/10',
                      'text-intel-red border-intel-red/40 bg-intel-red/10',
                    ];
                    const descriptions = [
                      'Small communities testing framings. Low visibility. High receptivity to counter-narrative.',
                      'Source synergy active. Peer normalization spreading. Intervention window closing.',
                      'Unfalsifiable. Counter-evidence reinterpreted. Fact-checking amplifies.',
                    ];
                    return (
                      <div key={phase} className="space-y-3 relative z-10">
                        <div className={`w-10 h-10 rounded-full border-2 flex
                          items-center justify-center text-sm font-bold mx-auto
                          ${colors[idx]}`}>
                          {inPhase.length}
                        </div>
                        <div className={`text-[9px] font-mono font-bold uppercase
                          text-center ${colors[idx].split(' ')[0]}`}>
                          {phase}
                        </div>
                        <div className="text-[8px] text-slate-600 text-center
                          leading-relaxed">
                          {descriptions[idx]}
                        </div>
                        {inPhase.map(n => (
                          <div key={n.id}
                            className={`p-2 rounded-lg border text-[8px]
                              font-mono ${colors[idx].split(' ').slice(1).join(' ')}`}>
                            {n.label}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Intervention clock */}
              <div className={`p-5 rounded-2xl border space-y-3 ${
                env.interventionStillPossible
                  ? 'border-intel-green/30 bg-intel-green/5'
                  : 'border-intel-red/30 bg-intel-red/5'
              }`}>
                <div className="flex items-center space-x-2">
                  {env.interventionStillPossible
                    ? <CheckCircle className="w-4 h-4 text-intel-green" />
                    : <XCircle className="w-4 h-4 text-intel-red" />
                  }
                  <span className={`text-[10px] font-mono font-bold uppercase ${
                    env.interventionStillPossible ? 'text-intel-green' : 'text-intel-red'
                  }`}>
                    {env.interventionStillPossible
                      ? 'Intervention Window Open'
                      : 'Intervention Window Closed'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {env.interventionStillPossible
                    ? 'Dominant narrative is in Seed or Amplification phase. Counter-narratives introduced now can compete for cognitive space. Prioritize: credible local voices, address anchor events directly, avoid amplifying the conspiracy frame.'
                    : 'Dominant narrative has reached Closure. Direct refutation will be reinterpreted as confirmation of cover-up. Recommended strategy: narrative substitution (introduce alternative story), not refutation. Address the underlying anxiety driving susceptibility.'}
                </p>
              </div>
            </div>
          )}

          {/* ═══ SUSTAINED ANXIETY INDEX ══════════════════════ */}
          {activeSection === 'anxiety' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Sustained Anxiety Index (SAI) measures repeated emphasis on
                risk without closure in the information environment. High SAI
                is the primary signal that an audience is being prepared for
                a weaponized narrative. It is distinct from fear — it is
                <em> unresolved</em> fear, maintained deliberately.
              </p>

              <div className={`p-6 rounded-2xl border space-y-5 ${
                env.sustainedAnxietyIndex > 0.7
                  ? 'border-intel-red/40 bg-intel-red/5'
                  : env.sustainedAnxietyIndex > 0.4
                  ? 'border-intel-orange/30 bg-intel-orange/5'
                  : 'border-intel-border/50'
              }`}>
                {/* SAI big number */}
                <div className="flex items-end space-x-4">
                  <div className={`text-7xl font-bold font-mono ${
                    getClosureColor(Math.round(env.sustainedAnxietyIndex * 100))
                  }`}>
                    {Math.round(env.sustainedAnxietyIndex * 100)}
                  </div>
                  <div className="pb-2 space-y-1">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">
                      Sustained Anxiety Index
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {env.sustainedAnxietyIndex > 0.7
                        ? 'CRITICAL — Audience in sustained high-anxiety state. Highly susceptible.'
                        : env.sustainedAnxietyIndex > 0.4
                        ? 'ELEVATED — Anxiety being maintained. Vulnerability window active.'
                        : 'MODERATE — Normal information environment stress.'}
                    </div>
                  </div>
                </div>

                {/* SAI components per narrative */}
                {narratives.filter(n => n.sustainedAnxietyIndex > 20).map(n => (
                  <div key={n.id} className="space-y-2">
                    <div className="flex items-center justify-between
                      text-[9px] font-mono">
                      <span className="text-slate-400">{n.label}</span>
                      <span className={getClosureColor(n.sustainedAnxietyIndex)}>
                        {n.sustainedAnxietyIndex}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          n.sustainedAnxietyIndex >= 70 ? 'bg-intel-red' :
                          n.sustainedAnxietyIndex >= 45 ? 'bg-intel-orange' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${n.sustainedAnxietyIndex}%` }}
                      />
                    </div>
                  </div>
                ))}

                {narratives.every(n => n.sustainedAnxietyIndex <= 20) && (
                  <div className="text-[10px] font-mono text-slate-700 text-center py-4">
                    SAI data populates from RSS articles. Feed RSS sources to see live values.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ INTERVENTION GUIDE ═══════════════════════════ */}
          {activeSection === 'intervention' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Counter-narrative strategy varies by construction phase.
                The same intervention that works at Seed phase becomes
                counterproductive at Closure.
              </p>

              {[
                {
                  phase: 'SEED' as ConstructionPhase,
                  color: 'border-yellow-500/30 bg-yellow-500/5',
                  titleColor: 'text-yellow-500',
                  title: 'SEED Phase — Pre-emptive',
                  icon: <Zap className="w-4 h-4 text-yellow-500" />,
                  strategies: [
                    'Introduce counter-narrative before closure forms',
                    'Address the underlying anxiety — the grievance is real even if the conspiracy is not',
                    'Use credible local voices, not institutional sources',
                    'Provide closure: explain what happened and why, with evidence',
                    'Identify which anchor events are being weaponized and address them directly',
                  ],
                  warning: 'Window: days to weeks. Act before amplification phase.',
                },
                {
                  phase: 'AMPLIFICATION' as ConstructionPhase,
                  color: 'border-intel-orange/30 bg-intel-orange/5',
                  titleColor: 'text-intel-orange',
                  title: 'AMPLIFICATION Phase — Competitive',
                  icon: <Radio className="w-4 h-4 text-intel-orange" />,
                  strategies: [
                    'Inoculation: expose the ETM structure itself ("they want you to see these events as connected")',
                    'Peer-based counter-messaging: use voices from within the affected community',
                    'Disrupt source synergy: identify and address the "reluctant truth-teller" accounts',
                    'Do not directly debunk — reframe without repeating the conspiracy frame',
                    'Monitor for phase transition to closure — strategy must shift rapidly',
                  ],
                  warning: 'Window: closing. Competitive but viable. Avoid amplifying by over-debunking.',
                },
                {
                  phase: 'CLOSURE' as ConstructionPhase,
                  color: 'border-intel-red/30 bg-intel-red/5',
                  titleColor: 'text-intel-red',
                  title: 'CLOSURE Phase — Substitution Only',
                  icon: <Lock className="w-4 h-4 text-intel-red" />,
                  strategies: [
                    'ABANDON fact-checking — refutation amplifies the closure mechanism',
                    'Narrative substitution: introduce an alternative story that addresses the same grievance',
                    'Target the anxiety, not the belief: reduce the underlying stress driving susceptibility',
                    'Identify and engage the 15-20% who are persuadable (not true believers)',
                    'Wait for the narrative to produce a visible false prediction, then act on the disappointment',
                  ],
                  warning: 'Window: closed for refutation. Substitution is the only viable strategy.',
                },
              ].map(strategy => (
                <div key={strategy.phase}
                  className={`p-5 rounded-2xl border space-y-3 ${strategy.color}`}>
                  <div className="flex items-center space-x-3">
                    {strategy.icon}
                    <span className={`text-[11px] font-bold uppercase
                      tracking-wider ${strategy.titleColor}`}>
                      {strategy.title}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {strategy.strategies.map((s, i) => (
                      <div key={i} className="flex items-start space-x-2 text-[10px]">
                        <span className="text-slate-600 font-mono shrink-0">{i + 1}.</span>
                        <span className="text-slate-300 leading-snug">{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`text-[9px] font-mono font-bold ${strategy.titleColor}
                    border-t border-white/5 pt-2`}>
                    ⚠ {strategy.warning}
                  </div>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
