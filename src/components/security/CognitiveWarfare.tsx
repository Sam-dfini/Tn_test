/**
 * CognitiveWarfare.tsx
 * Cognitive Warfare & Social Engineering Detection Panel
 *
 * Integrates with:
 *   - cognitiveWarfareEngine.ts — detection logic
 *   - narrativeEngine.ts — existing propaganda analysis
 *   - PipelineContext — RRI recalculation trigger
 *   - useRSS — live article feed
 *
 * Three panels:
 *   1. Live scan — run on current RSS articles
 *   2. Shock vector dashboard — visual breakdown
 *   3. RRI integration — how it feeds into the model
 *   4. Campaign tracker — persistent session history
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, AlertTriangle, Zap, Radio, Brain,
  Eye, RefreshCw, ChevronDown, ChevronRight,
  Activity, Target, Globe, Loader2, CheckCircle,
  XCircle, AlertCircle, TrendingUp, Clock,
} from 'lucide-react';
import { ModuleHeader } from '../shared/ProfessionalShared';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useRSS } from '../../context/RSSContext';
import {
  analyzeCognitiveWarfare,
  quickScan,
  detectPatterns,
  mapShockVectorToRRI,
  campaignTracker,
  CogWarfareAnalysis,
} from '../../services/cognitiveWarfareEngine';

// ── Color helpers ─────────────────────────────────────────────────────────

function classColor(cls: string): string {
  switch (cls) {
    case 'EMERGENCY': return '#ff2d55';
    case 'CRITICAL':  return '#ff2d55';
    case 'HIGH':      return '#ff9f0a';
    case 'ELEVATED':  return '#ffd60a';
    default:          return '#2fd158';
  }
}

function scoreColor(v: number): string {
  if (v >= 0.65) return '#ff2d55';
  if (v >= 0.40) return '#ff9f0a';
  if (v >= 0.20) return '#ffd60a';
  return '#2fd158';
}

// ── Shock vector gauge ────────────────────────────────────────────────────

const VectorBar: React.FC<{
  label:    string;
  value:    number;
  sublabel: string;
  icon:     React.ElementType;
}> = ({ label, value, sublabel, icon: Icon }) => {
  const col = scoreColor(value);
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3" style={{ color: col }} />
          <span className="text-[9px] font-mono uppercase tracking-wide text-slate-400">{label}</span>
        </div>
        <span className="text-[11px] font-bold font-mono" style={{ color: col }}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full"
          style={{ background: col }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <div className="text-[8px] text-slate-600">{sublabel}</div>
    </div>
  );
};

// ── Classification badge ──────────────────────────────────────────────────

const ClassBadge: React.FC<{ cls: string; large?: boolean }> = ({ cls, large }) => {
  const col = classColor(cls);
  return (
    <span className={`font-mono font-bold uppercase tracking-widest ${large ? 'text-[11px] px-3 py-1.5' : 'text-[8px] px-2 py-0.5'} rounded`}
      style={{ background: `${col}18`, color: col, border: `1px solid ${col}44` }}>
      {cls}
    </span>
  );
};

// ── RRI impact display ────────────────────────────────────────────────────

const RRIImpactPanel: React.FC<{ analysis: CogWarfareAnalysis }> = ({ analysis }) => {
  const impact = mapShockVectorToRRI(analysis);

  const rows = [
    {
      label: 'ε(t) Shock Weight',
      value: impact.epsilon_weight,
      desc: 'Contribution weight to eq13_stochasticShock',
      formula: 'eq13',
    },
    {
      label: 'ε(t) Magnitude',
      value: impact.epsilon_magnitude,
      desc: 'Shock magnitude added to R(t)',
      formula: 'eq13',
    },
    {
      label: 'Salience Nudge S(t)',
      value: impact.salience_nudge,
      desc: 'Additive to eq3 salience calculation',
      formula: 'eq3',
    },
    {
      label: 'Info Amp Delta A(t)',
      value: impact.amplification_delta,
      desc: 'Additive to eq19 info_amplification',
      formula: 'eq19',
    },
    {
      label: 'Cascade Risk Delta',
      value: impact.cascade_risk_delta,
      desc: 'Additive to eq17 cascade_probability',
      formula: 'eq17',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
        RRI Model Integration — ε(t) Injection
      </div>
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-3 py-1 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold text-slate-300">{r.label}</div>
            <div className="text-[7px] text-slate-600">{r.desc}</div>
          </div>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded shrink-0"
            style={{ background: '#00d4ff10', color: '#00d4ff88', border: '1px solid #00d4ff22' }}>
            {r.formula}
          </span>
          <span className="text-[11px] font-bold font-mono w-14 text-right shrink-0"
            style={{ color: r.value > 0.05 ? '#ff9f0a' : '#2fd158' }}>
            +{r.value.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Analysis result card ──────────────────────────────────────────────────

const AnalysisCard: React.FC<{
  analysis: CogWarfareAnalysis;
  onInjectRRI: (a: CogWarfareAnalysis) => void;
  injected: boolean;
}> = ({ analysis, onInjectRRI, injected }) => {
  const [open, setOpen] = useState(true);
  const col = classColor(analysis.classification);
  const sv  = analysis.shock_vector;

  // Semicircle composite score
  const composite = (sv.media_manipulation + sv.panic_index + sv.polarization_index + sv.trust_erosion) / 4;
  const compositeAngle = (composite / 1.0) * 180 - 90; // -90° (left) to +90° (right)
  const rad = compositeAngle * Math.PI / 180;
  const needleX = 60 + 45 * Math.sin(rad);
  const needleY = 60 - 45 * Math.cos(rad);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border overflow-hidden"
      style={{ borderColor: `${col}33` }}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5"
        style={{ background: `${col}06` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${col}18`, border: `1px solid ${col}33` }}>
            <Shield className="w-4 h-4" style={{ color: col }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ClassBadge cls={analysis.classification} />
              <span className="text-[9px] font-mono text-slate-500">
                {analysis.campaign_stage.toUpperCase()} · {analysis.suspected_actor.toUpperCase()}
              </span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">{analysis.campaign_id}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[8px] font-mono text-slate-500">CONFIDENCE</div>
            <div className="text-[13px] font-bold font-mono" style={{ color: col }}>
              {Math.round(analysis.confidence_score * 100)}%
            </div>
          </div>
          <button onClick={() => setOpen(!open)}
            className="p-1.5 hover:bg-white/5 rounded transition-colors">
            {open ? <ChevronDown className="w-4 h-4 text-slate-500" />
                  : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="p-4 space-y-5">

              {/* Narrative intent */}
              {analysis.narrative_intent && (
                <div className="p-3 rounded-xl border border-white/5 bg-black/20 space-y-1">
                  <div className="text-[8px] font-mono text-slate-500 uppercase">Narrative Intent</div>
                  <p className="text-[10px] text-slate-300 leading-relaxed italic">
                    "{analysis.narrative_intent}"
                  </p>
                </div>
              )}

              {/* Two-column: gauge + vectors */}
              <div className="grid grid-cols-2 gap-4">
                {/* Composite semicircle */}
                <div className="space-y-2">
                  <div className="text-[8px] font-mono text-slate-500 uppercase">Threat Composite</div>
                  <svg viewBox="0 0 120 70" className="w-full max-w-[140px] mx-auto">
                    {/* Background arc */}
                    <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="#1a1a2e" strokeWidth="12" />
                    {/* Color zones */}
                    <path d="M 15 60 A 45 45 0 0 1 42 20" fill="none" stroke="#2fd158" strokeWidth="12" opacity="0.4" />
                    <path d="M 42 20 A 45 45 0 0 1 60 15" fill="none" stroke="#ffd60a" strokeWidth="12" opacity="0.4" />
                    <path d="M 60 15 A 45 45 0 0 1 78 20" fill="none" stroke="#ff9f0a" strokeWidth="12" opacity="0.4" />
                    <path d="M 78 20 A 45 45 0 0 1 105 60" fill="none" stroke="#ff2d55" strokeWidth="12" opacity="0.4" />
                    {/* Needle */}
                    <line x1="60" y1="60" x2={needleX.toFixed(1)} y2={needleY.toFixed(1)}
                      stroke={col} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="60" cy="60" r="4" fill={col} />
                    {/* Score */}
                    <text x="60" y="52" textAnchor="middle" fontSize="11" fontWeight="bold"
                      fill={col} fontFamily="monospace">
                      {Math.round(composite * 100)}
                    </text>
                  </svg>
                  <div className="text-[8px] text-center font-mono text-slate-500">
                    vel: {analysis.disinformation_velocity.toFixed(2)}
                  </div>
                </div>

                {/* Vector bars */}
                <div className="space-y-2">
                  {[
                    { label: 'Media Manip.', value: sv.media_manipulation, sublabel: 'Artificial amplification', icon: Radio },
                    { label: 'Panic Index',  value: sv.panic_index,        sublabel: 'Fear & urgency signals', icon: AlertTriangle },
                    { label: 'Polarization', value: sv.polarization_index, sublabel: 'Us vs them framing', icon: Target },
                    { label: 'Trust Erosion',value: sv.trust_erosion,      sublabel: 'Institution attacks', icon: Shield },
                  ].map(v => (
                    <VectorBar key={v.label} {...v} />
                  ))}
                </div>
              </div>

              {/* Tactics + Target */}
              {(analysis.manipulation_tactics?.length > 0 || analysis.target_population) && (
                <div className="grid grid-cols-2 gap-3">
                  {analysis.manipulation_tactics?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[8px] font-mono text-slate-500 uppercase">Tactics Detected</div>
                      {analysis.manipulation_tactics.map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-intel-red shrink-0" />
                          <span className="text-[9px] text-slate-400">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {analysis.target_population && (
                    <div className="space-y-1">
                      <div className="text-[8px] font-mono text-slate-500 uppercase">Target Population</div>
                      <p className="text-[9px] text-slate-300">{analysis.target_population}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Falsifiable indicators */}
              {analysis.falsifiable_indicators?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[8px] font-mono text-slate-500 uppercase">Falsifiable Indicators</div>
                  {analysis.falsifiable_indicators.map((fi, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-intel-cyan shrink-0 mt-0.5" />
                      <span className="text-[9px] text-slate-400">{fi}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* RRI integration */}
              <div className="border-t border-white/5 pt-3">
                <RRIImpactPanel analysis={analysis} />
              </div>

              {/* Inject button */}
              <button onClick={() => onInjectRRI(analysis)} disabled={injected}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-[10px] font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                style={{
                  background: injected ? 'rgba(47,209,88,0.1)' : `${col}18`,
                  border: `1px solid ${injected ? '#2fd15844' : col + '44'}`,
                  color: injected ? '#2fd158' : col,
                }}>
                {injected
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Injected into RRI Model</>
                  : <><Zap className="w-3.5 h-3.5" /> Inject ε(t) into RRI Model</>
                }
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

export const CognitiveWarfare: React.FC = () => {
  const { rriState, updateField, recalculateRRI } = useRiskMetrics();
  const rssCtx  = useRSS();
  const articles = rssCtx?.articles ?? [];

  const [analyses,     setAnalyses]     = useState<CogWarfareAnalysis[]>([]);
  const [quickResult,  setQuickResult]  = useState<ReturnType<typeof quickScan> | null>(null);
  const [scanning,     setScanning]     = useState(false);
  const [deepScanning, setDeepScanning] = useState(false);
  const [injected,     setInjected]     = useState<Set<string>>(new Set());
  const [activeSection,setActiveSection]= useState<'scan' | 'campaigns'>('scan');

  // Quick scan — Layer 1 only, instant
  const runQuickScan = useCallback(() => {
    if (articles.length === 0) return;
    setScanning(true);
    const result = quickScan(articles, rriState);
    setQuickResult(result);
    setScanning(false);
  }, [articles, rriState]);

  // Deep scan — Layer 2, Gemini-powered
  const runDeepScan = useCallback(async () => {
    if (articles.length === 0) return;
    setDeepScanning(true);
    try {
      const texts   = articles.map(a => `${a.title} ${a.summary ?? ''} ${a.content ?? ''}`);
      const patterns = detectPatterns(texts);
      const batchId  = Date.now().toString(36).toUpperCase();
      const result   = await analyzeCognitiveWarfare(articles, patterns, rriState, batchId);
      if (result) {
        campaignTracker.record(result);
        setAnalyses(prev => [result, ...prev.slice(0, 9)]); // keep 10 max
      }
    } finally {
      setDeepScanning(false);
    }
  }, [articles, rriState]);

  // Inject analysis into RRI model
  const injectRRI = useCallback((analysis: CogWarfareAnalysis) => {
    if (injected.has(analysis.id)) return;
    const impact = mapShockVectorToRRI(analysis);

    // Update info_amplification additively
    const currentAmp = rriState?.info_amplification ?? 0.35;
    updateField(
      'rri.info_amplification_override',
      parseFloat(Math.min(2.0, currentAmp + impact.amplification_delta).toFixed(4)),
      `CogWar Engine — ${analysis.campaign_id}`
    );

    // Trigger RRI recalculation with shock event logged
    window.dispatchEvent(new CustomEvent('ti:cogwar:shock', {
      detail: {
        epsilon_weight:    impact.epsilon_weight,
        epsilon_magnitude: impact.epsilon_magnitude,
        campaign_id:       analysis.campaign_id,
        classification:    analysis.classification,
      }
    }));

    setTimeout(() => recalculateRRI(), 150);
    setInjected(prev => new Set([...prev, analysis.id]));
  }, [injected, rriState, updateField, recalculateRRI]);

  const campaigns = campaignTracker.getActive();

  const qcol = quickResult ? classColor(quickResult.classification) : '#888';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      <ModuleHeader
        title="Cognitive Warfare Engine"
        subtitle="Social engineering detection · Narrative manipulation analysis · ε(t) RRI integration"
        icon={Brain}
        nodeId="COG-WAR-01"
        statusLabel="ACTIVE"
      />
      <div className="flex justify-end gap-4 -mt-3 text-[9px] font-mono">
        <span className="text-slate-500">{articles.length} articles in feed</span>
        <span className="text-slate-600">R(t)={rriState?.rri?.toFixed(2) ?? '2.31'}</span>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2">
        {[
          { id: 'scan',      label: 'Live Scanner', icon: Eye },
          { id: 'campaigns', label: `Active Campaigns (${campaigns.length})`, icon: Activity },
        ].map(s => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id as any)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all"
              style={{
                background: isActive ? 'rgba(0,212,255,0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                color: isActive ? '#00d4ff' : '#475569',
              }}>
              <Icon className="w-3 h-3" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── SCAN SECTION ── */}
      {activeSection === 'scan' && (
        <div className="space-y-5">

          {/* Scan controls */}
          <div className="glass p-5 rounded-2xl border border-intel-border/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <div className="text-[10px] font-mono text-slate-400">
                  Layer 1 — Pattern Detection (instant, no API)
                </div>
                <div className="text-[9px] text-slate-600">
                  Scans {articles.length} articles for panic, polarization, coordination, and trust-erosion patterns
                </div>
              </div>
              <button onClick={runQuickScan} disabled={scanning || articles.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold
                  uppercase transition-all disabled:opacity-40"
                style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff' }}>
                {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                Quick Scan
              </button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/5">
              <div className="flex-1 space-y-1">
                <div className="text-[10px] font-mono text-slate-400">
                  Layer 2 — Cognitive Warfare Analysis (Gemini JSON-only)
                </div>
                <div className="text-[9px] text-slate-600">
                  Full GPT framework: classification, shock_vector, falsifiable indicators, campaign tracking
                </div>
              </div>
              <button onClick={runDeepScan} disabled={deepScanning || articles.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold
                  uppercase transition-all disabled:opacity-40"
                style={{ background: 'rgba(191,90,242,0.12)', border: '1px solid rgba(191,90,242,0.4)', color: '#bf5af2' }}>
                {deepScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                {deepScanning ? 'Analyzing…' : 'Deep Analysis'}
              </button>
            </div>
          </div>

          {/* Quick scan result */}
          {quickResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="glass p-5 rounded-2xl border space-y-4"
              style={{ borderColor: `${qcol}33` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClassBadge cls={quickResult.classification} large />
                  <span className="text-[9px] font-mono text-slate-500">
                    Layer 1 · {quickResult.campaign_stage.toUpperCase()} · {new Date(quickResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  Velocity: <span style={{ color: qcol }}>{quickResult.disinformation_velocity.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Media Manipulation', value: quickResult.shock_vector.media_manipulation, sublabel: 'Coordination signals', icon: Radio },
                  { label: 'Panic Index',         value: quickResult.shock_vector.panic_index,        sublabel: 'Fear vocabulary density', icon: AlertTriangle },
                  { label: 'Polarization Index',  value: quickResult.shock_vector.polarization_index, sublabel: 'Us-vs-them framing', icon: Target },
                  { label: 'Trust Erosion',       value: quickResult.shock_vector.trust_erosion,      sublabel: 'Institution attacks', icon: Shield },
                ].map(v => <VectorBar key={v.label} {...v} />)}
              </div>

              <div className="pt-3 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
                {[
                  { l: 'ε(t) Weight',   v: quickResult.rri_epsilon_weight.toFixed(4) },
                  { l: 'Salience Nudge',v: `+${quickResult.rri_salience_nudge.toFixed(4)}` },
                  { l: 'Amp. Delta',    v: `+${quickResult.rri_amplification_delta.toFixed(4)}` },
                ].map(m => (
                  <div key={m.l}>
                    <div className="text-[7px] font-mono text-slate-500 uppercase">{m.l}</div>
                    <div className="text-[11px] font-bold font-mono text-intel-cyan">{m.v}</div>
                  </div>
                ))}
              </div>

              <div className="text-[8px] font-mono text-slate-600 text-center">
                Layer 1 only — run Deep Analysis for full classification + falsifiable indicators
              </div>
            </motion.div>
          )}

          {/* Deep scan results */}
          {analyses.map(a => (
            <AnalysisCard key={a.id} analysis={a}
              onInjectRRI={injectRRI}
              injected={injected.has(a.id)} />
          ))}

          {/* Empty state */}
          {analyses.length === 0 && !quickResult && (
            <div className="glass p-8 rounded-2xl border border-intel-border/30 text-center space-y-3">
              <Eye className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                No Scans Run
              </div>
              <div className="text-[9px] text-slate-600">
                Run Quick Scan for instant Layer 1 pattern detection, or Deep Analysis for the full cognitive warfare framework.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS SECTION ── */}
      {activeSection === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="glass p-8 rounded-2xl border border-intel-border/30 text-center space-y-3">
              <Activity className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                No Active Campaigns
              </div>
              <div className="text-[9px] text-slate-600">
                Run Deep Analysis to begin tracking campaigns. Active window: 24 hours.
              </div>
            </div>
          ) : campaigns.map(c => {
            const peakCol = classColor(c.peak_class);
            const latest  = c.analyses[c.analyses.length - 1];
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass p-4 rounded-2xl border space-y-3"
                style={{ borderColor: `${peakCol}33` }}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ClassBadge cls={c.peak_class} />
                      <span className="text-[10px] font-bold text-white">{c.id}</span>
                    </div>
                    <div className="text-[8px] font-mono text-slate-500">
                      {c.detections} detections · First: {new Date(c.first_seen).toLocaleTimeString()} · Last: {new Date(c.last_seen).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-500">STAGE</div>
                    <div className="text-[10px] font-mono font-bold" style={{ color: peakCol }}>
                      {latest?.campaign_stage?.toUpperCase() ?? '—'}
                    </div>
                  </div>
                </div>
                {latest?.narrative_intent && (
                  <p className="text-[9px] text-slate-400 italic">"{latest.narrative_intent}"</p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {latest && Object.entries(latest.shock_vector).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <div className="text-[7px] text-slate-600 uppercase">{k.split('_')[0]}</div>
                      <div className="text-[11px] font-bold font-mono"
                        style={{ color: scoreColor(v as number) }}>
                        {Math.round((v as number) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
