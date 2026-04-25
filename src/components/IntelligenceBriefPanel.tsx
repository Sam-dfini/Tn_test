import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, AlertTriangle, Eye, Target, Clock,
  ChevronRight, TrendingUp, TrendingDown, Zap,
  CheckCircle, AlertCircle, Activity, BookOpen,
  Radio, Lock
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { useRSS } from '../context/RSSContext';
import { prepareList, assertKey, getRenderKey } from '../lib/keyUtils';
import {
  generateIntelligenceBrief, IntelligenceBrief,
  BriefClassification, ActionPriority,
} from '../services/intelligenceBrief';
import { classifySignals, buildSignalSummary } from '../services/signalClassifier';
import { assessGovernmentAgent } from '../services/govAgent';

// ── Classification config ──────────────────────────────────────

const CLASSIFICATION_CONFIG: Record<BriefClassification, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: React.ReactNode;
}> = {
  ROUTINE: {
    label: 'ROUTINE',
    color: 'text-intel-cyan',
    bg: 'bg-intel-cyan/5',
    border: 'border-intel-cyan/20',
    glow: 'bg-intel-cyan',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  ELEVATED: {
    label: 'ELEVATED',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    glow: 'bg-yellow-500',
    icon: <Activity className="w-4 h-4" />,
  },
  HIGH: {
    label: 'HIGH',
    color: 'text-intel-orange',
    bg: 'bg-intel-orange/8',
    border: 'border-intel-orange/30',
    glow: 'bg-intel-orange',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  CRITICAL: {
    label: 'CRITICAL',
    color: 'text-intel-red',
    bg: 'bg-intel-red/10',
    border: 'border-intel-red/40',
    glow: 'bg-intel-red',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  EMERGENCY: {
    label: 'EMERGENCY',
    color: 'text-intel-red',
    bg: 'bg-intel-red/15',
    border: 'border-intel-red/60',
    glow: 'bg-intel-red',
    icon: <Zap className="w-4 h-4" />,
  },
};

const PRIORITY_CONFIG: Record<ActionPriority, { color: string; label: string }> = {
  IMMEDIATE: { color: 'text-intel-red', label: 'IMMEDIATE' },
  URGENT: { color: 'text-intel-orange', label: 'URGENT' },
  MONITOR: { color: 'text-yellow-500', label: 'MONITOR' },
  PREPARE: { color: 'text-intel-cyan', label: 'PREPARE' },
};

// ── Section selector ────────────────────────────────────────────

type BriefSection = 'brief' | 'watch' | 'actions' | 'drivers';

const SECTION_LABELS: Record<BriefSection, string> = {
  brief: 'Brief',
  watch: 'Watch',
  actions: 'Actions',
  drivers: 'Drivers',
};

// ── Main Component ─────────────────────────────────────────────

export const IntelligenceBriefPanel: React.FC<{
  compact?: boolean;  // compact = single-section summary card
}> = ({ compact = false }) => {
  const {
    rriState, data,
    miiProfile, rpiProfile, cognitiveEnvironment, seiResult, actorNetwork
  } = usePipeline();
  const { articles } = useRSS();

  const govAssessment = useMemo(() => {
    try {
      return assessGovernmentAgent(rriState, data, { miiProfile, actorNetwork, seiResult });
    } catch { return null; }
  }, [rriState, data, miiProfile, actorNetwork, seiResult]);

  const classified = useMemo(() =>
    classifySignals(articles, rriState, data, govAssessment, 20),
    [articles, rriState, data, govAssessment]
  );

  const signalSummary = useMemo(() => buildSignalSummary(classified), [classified]);

  const [activeSection, setActiveSection] = useState<BriefSection>('brief');
  const [expanded, setExpanded] = useState(!compact);

  // Get contradiction texts from framework adapters if available
  const contradictionTexts: string[] = [];

  const brief = useMemo<IntelligenceBrief>(() => {
    return generateIntelligenceBrief(
      rriState,
      data,
      { miiProfile, rpiProfile, cognitiveEnvironment, seiResult },
      contradictionTexts
    );
  }, [rriState, data, miiProfile, rpiProfile, cognitiveEnvironment, seiResult]);

  const cfg = CLASSIFICATION_CONFIG[brief.classification];

  // ── Compact mode: just the header card ──────────────────────
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border p-4
          cursor-pointer group z-20 ${cfg.bg} ${cfg.border}`}
        onClick={() => {
          console.log('Brief clicked, current expanded state:', expanded);
          setExpanded(!expanded);
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full
          blur-3xl pointer-events-none opacity-10"
          style={{ background: `var(--${cfg.glow.replace('bg-','')}, #f97316)`,
                   transform: 'translate(30%,-30%)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cfg.color}>{cfg.icon}</div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[9px] font-mono font-bold uppercase
                  tracking-widest ${cfg.color}`}>
                  INTELLIGENCE BRIEF — {cfg.label}
                </span>
                {brief.classification !== 'ROUTINE' && (
                  <div className={`w-2 h-2 rounded-full animate-pulse ${cfg.glow}`} />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug max-w-lg">
                {brief.situation.slice(0, 120)}
                {brief.situation.length > 120 ? '...' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="text-[8px] font-mono text-slate-600">Time horizon</div>
              <div className={`text-[9px] font-mono font-bold ${cfg.color}`}>
                {brief.timeHorizon.window}
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${cfg.color} transition-transform
              ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Full mode ────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Classification banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-5
        space-y-4 ${cfg.bg} ${cfg.border}`}>
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full
          blur-3xl pointer-events-none opacity-15 ${cfg.glow}`}
          style={{ transform: 'translate(30%,-30%)' }} />

        {/* Header row */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cfg.color}>{cfg.icon}</div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[9px] font-mono font-bold uppercase
                  tracking-widest ${cfg.color}`}>
                  INTELLIGENCE BRIEF — {cfg.label}
                </span>
                {brief.classification !== 'ROUTINE' && (
                  <div className={`w-2 h-2 rounded-full animate-pulse ${cfg.glow}`} />
                )}
              </div>
              <div className="text-[8px] font-mono text-slate-600 mt-0.5">
                {brief.classificationBasis}
              </div>
            </div>
          </div>
          <div className="text-right space-y-0.5 shrink-0">
            <div className="text-[8px] font-mono text-slate-600">Generated</div>
            <div className="text-[9px] font-mono text-slate-500">
              {new Date(brief.generatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Model state strip */}
        <div className="relative z-10 flex items-center space-x-4 flex-wrap gap-2
          text-[8px] font-mono text-slate-600 border-t border-white/5 pt-3">
          <span>R(t)=<strong className="text-white">{brief.modelState.rri.toFixed(2)}</strong></span>
          <span>P_rev=<strong className={cfg.color}>{(brief.modelState.p_rev*100).toFixed(0)}%</strong></span>
          <span>V={brief.modelState.velocity}</span>
          <span>MII=<strong className={brief.modelState.mii > 0.60 ? 'text-intel-orange' : 'text-slate-400'}>
            {(brief.modelState.mii*100).toFixed(0)}%
          </strong> {brief.modelState.miiPhase}</span>
          {brief.modelState.rpi > 0.25 && (
            <span>RPI=<strong className="text-intel-orange">{(brief.modelState.rpi*100).toFixed(0)}%</strong></span>
          )}
          {brief.modelState.seiMax > 0.40 && (
            <span>SEI=<strong className="text-intel-orange">{(brief.modelState.seiMax*100).toFixed(0)}%</strong> Ph{brief.modelState.seiDominantPhase}</span>
          )}
        </div>

        {/* Trigger zones + primary drivers */}
        {(brief.triggerZones.length > 0 || brief.primaryDrivers.length > 0) && (
          <div className="relative z-10 grid grid-cols-2 gap-3
            border-t border-white/5 pt-3">
            {brief.triggerZones.length > 0 && (
              <div>
                <div className="text-[8px] font-mono text-slate-600 mb-1">
                  📍 Trigger zones
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {prepareList(brief.triggerZones).map((z: any) => (
                    <span key={z.id}
                      className={`text-[8px] font-mono px-1.5 py-0.5
                        rounded border ${cfg.color} ${cfg.border}`}>
                      {z.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {brief.primaryDrivers.length > 0 && (
              <div>
                <div className="text-[8px] font-mono text-slate-600 mb-1">
                  🎯 Primary drivers
                </div>
                <div className="space-y-0.5">
                  {prepareList(brief.primaryDrivers.slice(0, 2)).map((d: any, i: number) => (
                    <div key={d.id}
                      className="text-[8px] text-slate-500 truncate">
                      {i + 1}. {d.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section nav */}
      <div className="flex items-center space-x-1 bg-black/40 border
        border-intel-border rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
        {prepareList(['brief', 'watch', 'actions', 'drivers'] as BriefSection[]).map((s: any, i: number) => (
          <button key={s.id}
            onClick={() => setActiveSection(s.value as BriefSection)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg
              text-[9px] font-mono uppercase tracking-wider transition-all ${
              activeSection === s.value
                ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            {s.value === 'brief' && <BookOpen className="w-3 h-3" />}
            {s.value === 'watch' && <Eye className="w-3 h-3" />}
            {s.value === 'actions' && <Target className="w-3 h-3" />}
            {s.value === 'drivers' && <Radio className="w-3 h-3" />}
            <span>{SECTION_LABELS[s.value as BriefSection]}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >

          {/* ── BRIEF ── */}
          {activeSection === 'brief' && (
            <div className="space-y-4">

              {/* Situation */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Situation
                </div>
                <p className="text-[12px] text-slate-200 leading-relaxed">
                  {brief.situation}
                </p>
              </div>

              {/* Key developments */}
              {brief.keyDevelopments.length > 0 && (
                <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    Key Developments
                  </div>
                  <div className="space-y-2">
                    {prepareList(brief.keyDevelopments).map((dev: any, i: number) => (
                      <div key={dev.id} className="flex items-start space-x-3">
                        <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full
                          border flex items-center justify-center text-[7px]
                          font-bold ${
                          dev.severity === 'critical'
                            ? 'border-intel-red/40 text-intel-red'
                            : dev.severity === 'high'
                            ? 'border-intel-orange/40 text-intel-orange'
                            : 'border-slate-700 text-slate-600'
                        }`}>
                          {dev.direction === 'up' ? '↑' : dev.direction === 'down' ? '↓' : '●'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-medium ${
                            dev.severity === 'critical' ? 'text-intel-red' :
                            dev.severity === 'high' ? 'text-intel-orange' :
                            'text-slate-300'
                          }`}>{dev.signal}</div>
                          <div className="text-[8px] font-mono text-slate-600 mt-0.5">
                            {dev.source} {dev.value ? `· ${dev.value}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment */}
              <div className={`p-5 rounded-2xl border space-y-2 ${cfg.bg} ${cfg.border}`}>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Assessment
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {brief.assessment}
                </p>
              </div>

              {/* Predicted Regime Response */}
              {brief.regimeResponse && (
                <div className="glass p-4 rounded-xl border border-intel-purple/20
                  bg-intel-purple/5 space-y-2">
                  <div className="text-[9px] font-mono text-intel-purple uppercase tracking-widest">
                    Predicted Regime Response
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[9px]">
                    <div>
                      <span className="text-slate-600">Threat perception: </span>
                      <span className="text-slate-300">{brief.regimeResponse.threatLevel}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Expected action: </span>
                      <span className="text-slate-300">{brief.regimeResponse.mostLikelyAction}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-600">Narrative frame: </span>
                    <span className="text-[8px] text-intel-orange">{brief.regimeResponse.narrativeFrame}</span>
                  </div>
                </div>
              )}

              {/* Contradictions */}
              {brief.contradictions.length > 0 && (
                <div className="glass p-4 rounded-xl border border-intel-purple/20
                  bg-intel-purple/5 space-y-2">
                  <div className="text-[9px] font-mono text-intel-purple uppercase">
                    Framework Contradictions
                  </div>
                  {prepareList(brief.contradictions).map((c: any) => (
                    <div key={c.id} className="flex items-start space-x-2 text-[9px]">
                      <span className="text-intel-purple shrink-0">◆</span>
                      <span className="text-slate-400">{c.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Time horizon */}
              <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    Time Horizon
                  </div>
                  <div className={`text-[10px] font-mono font-bold ${cfg.color}`}>
                    {brief.timeHorizon.window}
                  </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cfg.glow}`}
                    style={{ width: `${brief.timeHorizon.confidence * 100}%` }}
                  />
                </div>
                <div className="text-[8px] text-slate-600">{brief.timeHorizon.basis}</div>
              </div>
            </div>
          )}

          {/* ── WATCH INDICATORS ── */}
          {activeSection === 'watch' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                Specific falsifiable observables. If any of these cross their
                threshold, the classification upgrades and the brief regenerates.
              </p>
              {prepareList(brief.watchIndicators).map((ind: any, i: number) => {
                const probPct = Math.round(ind.probability * 100);
                return (
                  <div key={ind.id}
                    className={`glass p-5 rounded-2xl border space-y-3 ${
                    probPct >= 65 ? 'border-intel-red/20' :
                    probPct >= 45 ? 'border-intel-orange/20' :
                    'border-intel-border/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${
                        probPct >= 65 ? 'text-intel-red' :
                        probPct >= 45 ? 'text-intel-orange' : 'text-slate-300'
                      }`}>{ind.indicator}</span>
                      <div className="text-right shrink-0">
                        <div className="text-[8px] font-mono text-slate-600">Probability</div>
                        <div className={`text-xl font-bold font-mono ${
                          probPct >= 65 ? 'text-intel-red' :
                          probPct >= 45 ? 'text-intel-orange' : 'text-slate-400'
                        }`}>{probPct}%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[9px]">
                      <div>
                        <div className="text-slate-600 mb-0.5">Current</div>
                        <div className="text-slate-300">{ind.currentValue}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 mb-0.5">Timeframe</div>
                        <div className="text-slate-300">{ind.timeframe}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-600 mb-0.5">Threshold</div>
                      <div className="text-[9px] text-slate-400">{ind.threshold}</div>
                    </div>
                    <div className="border-t border-white/5 pt-2">
                      <div className="text-[8px] font-mono text-slate-600 mb-0.5">
                        If crossed →
                      </div>
                      <div className={`text-[9px] font-mono ${
                        probPct >= 65 ? 'text-intel-red' : 'text-intel-orange'
                      }`}>{ind.consequence}</div>
                    </div>
                  </div>
                );
              })}

              {brief.watchIndicators.length === 0 && (
                <div className="text-[10px] font-mono text-slate-700 text-center py-8">
                  No active watch indicators above threshold.
                </div>
              )}
            </div>
          )}

          {/* ── RECOMMENDED ACTIONS ── */}
          {activeSection === 'actions' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                Priority-ordered actions based on current classification
                and active signal configuration.
              </p>
              {prepareList(brief.recommendedActions).map((action: any, i: number) => {
                const pcfg = PRIORITY_CONFIG[action.priority];
                return (
                  <div key={action.id}
                    className={`glass p-5 rounded-2xl border space-y-2 ${
                    action.priority === 'IMMEDIATE'
                      ? 'border-intel-red/30 bg-intel-red/5'
                      : action.priority === 'URGENT'
                      ? 'border-intel-orange/20 bg-intel-orange/3'
                      : 'border-intel-border/30 bg-black/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-mono font-bold uppercase
                        px-2 py-0.5 rounded border ${pcfg.color} border-current`}>
                        {pcfg.label}
                      </span>
                      {action.owner && (
                        <span className="text-[8px] font-mono text-slate-700">
                          {action.owner}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] font-medium ${
                      action.priority === 'IMMEDIATE' ? 'text-white' : 'text-slate-200'
                    }`}>{action.action}</div>
                    <div className="text-[9px] text-slate-500 leading-relaxed">
                      {action.rationale}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PRIMARY DRIVERS ── */}
          {activeSection === 'drivers' && (
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                Top drivers of current risk level, ranked by composite
                signal weight across all analytical layers.
              </p>
              <div className="space-y-2">
                {prepareList(brief.primaryDrivers).map((driver: any, i: number) => (
                  <div key={driver.id}
                    className="glass p-4 rounded-xl border border-intel-border/30
                      flex items-center space-x-3">
                    <div className={`w-7 h-7 rounded-full border flex items-center
                      justify-center text-[10px] font-bold shrink-0 ${
                      i === 0 ? 'border-intel-red/40 text-intel-red' :
                      i === 1 ? 'border-intel-orange/40 text-intel-orange' :
                      'border-yellow-500/30 text-yellow-500'
                    }`}>{i + 1}</div>
                    <span className="text-[10px] text-slate-300">{driver.value}</span>
                  </div>
                ))}
              </div>

              {/* All key developments as context */}
              {brief.keyDevelopments.length > 0 && (
                <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3 mt-4">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    All Signal Sources
                  </div>
                  {prepareList(brief.keyDevelopments).map((dev: any, i: number) => (
                    <div key={dev.id} className="flex items-center justify-between
                      py-1.5 border-b border-white/5 last:border-0">
                      <div className="text-[9px] text-slate-400 flex-1 min-w-0 truncate pr-3">
                        {dev.signal}
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[8px] font-mono text-slate-600">
                          {dev.source}
                        </span>
                        <span className={`text-[8px] font-mono font-bold ${
                          dev.severity === 'critical' ? 'text-intel-red' :
                          dev.severity === 'high' ? 'text-intel-orange' :
                          'text-slate-600'
                        }`}>
                          {dev.value ?? dev.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Signal Activity Summary */}
              {signalSummary.systemShocks > 0 && (
                <div className="glass p-4 rounded-xl border border-intel-red/20 space-y-2 mt-4">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                    Recent Signal Activity
                  </div>
                  <div className="text-[9px] font-mono space-y-1">
                    {signalSummary.systemShocks > 0 && (
                      <div className="text-intel-red">
                        ⚡ {signalSummary.systemShocks} system shock(s) detected
                      </div>
                    )}
                    {signalSummary.confirmedPredictions > 0 && (
                      <div className="text-intel-purple">
                        ✓ {signalSummary.confirmedPredictions} gov agent prediction(s) confirmed
                      </div>
                    )}
                    {Math.abs(signalSummary.totalEpsilon) > 0.05 && (
                      <div className={signalSummary.totalEpsilon > 0 ? 'text-intel-red' : 'text-intel-cyan'}>
                        Total ε(t): {signalSummary.totalEpsilon > 0 ? '+' : ''}{signalSummary.totalEpsilon.toFixed(3)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
