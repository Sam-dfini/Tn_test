/**
 * TunisiaIntel — Model Performance & Learning Loop
 *
 * Displays prediction accuracy, hit rates by variable and
 * time horizon, analyst correction workflow, and surfaced
 * weight-change recommendations.
 *
 * The honest version of "model confidence" — not a computed
 * score, but a historical accuracy record.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target, TrendingUp, TrendingDown, CheckCircle,
  XCircle, AlertCircle, Clock, Brain, Eye,
  ChevronRight, RefreshCw, AlertTriangle, Activity,
  BookOpen, Layers, Plus, Save
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import {
  fetchPredictions, computeAccuracyStats, computeModelPerformance,
  storeAnalystCorrection, fetchAnalystCorrections,
  getSurfacedRecommendations, storePredictionLocal, loadLocalPredictions,
  PredictionRecord, AccuracyStats, ModelPerformanceSummary,
  AnalystCorrection, PredictionVariable,
} from '../services/predictionLedger';

// ── Variable labels ────────────────────────────────────────────

const VAR_LABELS: Record<PredictionVariable, string> = {
  fx_reserves_below_75: 'FX < 75 days',
  fx_reserves_below_60: 'FX < 60 days (crisis)',
  ugtt_escalates: 'UGTT → HIGH',
  protests_exceed_30: 'Protests > 30/month',
  protests_exceed_40: 'Protests > 40/month',
  sei_phase_4_any: 'SEI Phase 4+',
  sei_anger_window: 'Anger Window Active',
  cascade_prob_above_60: 'Cascade > 60%',
  velocity_above_20: 'Velocity DETERIORATING FAST',
  rpi_above_50: 'RPI > 50% (Level 3+)',
  etm_closure_above_65: 'ETM Closure > 65%',
  mii_phase_chaotic: 'MII → CHAOTIC',
  elite_defection_above_30: 'Elite Defection > 30%',
  rri_above_2_5: 'R(t) > 2.5 (P_rev > 50%)',
  rri_above_3_0: 'R(t) > 3.0',
};

const HORIZON_LABELS: Record<number, string> = {
  7: '7-day',
  14: '14-day',
  30: '30-day',
  60: '60-day',
};

// ── Sub-components ─────────────────────────────────────────────

const AccuracyBar: React.FC<{
  value: number;
  label: string;
  inverse?: boolean;
}> = ({ value, label, inverse = false }) => {
  const pct = Math.round(value * 100);
  const color = inverse
    ? (pct >= 30 ? 'bg-intel-red' : pct >= 15 ? 'bg-intel-orange' : 'bg-intel-cyan')
    : (pct >= 75 ? 'bg-intel-cyan' : pct >= 55 ? 'bg-yellow-500' : 'bg-intel-red');
  const textColor = inverse
    ? (pct >= 30 ? 'text-intel-red' : pct >= 15 ? 'text-intel-orange' : 'text-intel-cyan')
    : (pct >= 75 ? 'text-intel-cyan' : pct >= 55 ? 'text-yellow-500' : 'text-intel-red');

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] font-mono">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

// ── Analyst Correction Form ────────────────────────────────────

const CorrectionForm: React.FC<{
  predictionId: string;
  onSubmit: () => void;
  onCancel: () => void;
}> = ({ predictionId, onSubmit, onCancel }) => {
  const [note, setNote] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [missedVar, setMissedVar] = useState('');
  const [equation, setEquation] = useState('');
  const [parameter, setParameter] = useState('');
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [magnitude, setMagnitude] = useState<'minor' | 'moderate' | 'significant'>('minor');
  const [reasoning, setReasoning] = useState('');
  const [includeSuggestion, setIncludeSuggestion] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!note || !whatHappened) return;
    setSaving(true);
    try {
      await storeAnalystCorrection({
        prediction_id: predictionId,
        analyst_note: note,
        what_actually_happened: whatHappened,
        missed_variable: missedVar || undefined,
        suggested_weight_change: includeSuggestion && equation && parameter ? {
          equation, parameter, direction, magnitude, reasoning,
        } : undefined,
      });
      onSubmit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-intel-purple/30
      bg-intel-purple/5">
      <div className="text-[9px] font-mono text-intel-purple uppercase tracking-widest">
        Analyst Correction
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[8px] font-mono text-slate-500 mb-1">
            What was wrong / what the model missed
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Describe what the model got wrong..."
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg p-2.5 resize-none focus:outline-none
              focus:border-intel-purple/50"
          />
        </div>

        <div>
          <div className="text-[8px] font-mono text-slate-500 mb-1">
            What actually happened
          </div>
          <textarea
            value={whatHappened}
            onChange={e => setWhatHappened(e.target.value)}
            rows={2}
            placeholder="Describe the actual outcome..."
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg p-2.5 resize-none focus:outline-none
              focus:border-intel-purple/50"
          />
        </div>

        <div>
          <div className="text-[8px] font-mono text-slate-500 mb-1">
            Missing variable / signal (optional)
          </div>
          <input
            type="text"
            value={missedVar}
            onChange={e => setMissedVar(e.target.value)}
            placeholder="e.g. 'seasonal religious consumption', 'military salary delays'"
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg p-2.5 focus:outline-none
              focus:border-intel-purple/50"
          />
        </div>

        <div>
          <button
            onClick={() => setIncludeSuggestion(!includeSuggestion)}
            className="text-[9px] font-mono text-intel-purple hover:underline"
          >
            {includeSuggestion ? '▼' : '►'} Suggest weight change (optional)
          </button>

          {includeSuggestion && (
            <div className="mt-3 space-y-2 p-3 rounded-lg bg-black/30
              border border-intel-border/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[7px] text-slate-600 mb-1">Equation</div>
                  <input
                    value={equation}
                    onChange={e => setEquation(e.target.value)}
                    placeholder="e.g. EQ.3, EQ.7"
                    className="w-full text-[9px] bg-black/40 border border-intel-border/40
                      text-slate-300 rounded p-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="text-[7px] text-slate-600 mb-1">Parameter</div>
                  <input
                    value={parameter}
                    onChange={e => setParameter(e.target.value)}
                    placeholder="e.g. BETA, w_t, alpha"
                    className="w-full text-[9px] bg-black/40 border border-intel-border/40
                      text-slate-300 rounded p-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[7px] text-slate-600 mb-1">Direction</div>
                  <select
                    value={direction}
                    onChange={e => setDirection(e.target.value as any)}
                    className="w-full text-[9px] bg-black/40 border border-intel-border/40
                      text-slate-300 rounded p-1.5"
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
                <div>
                  <div className="text-[7px] text-slate-600 mb-1">Magnitude</div>
                  <select
                    value={magnitude}
                    onChange={e => setMagnitude(e.target.value as any)}
                    className="w-full text-[9px] bg-black/40 border border-intel-border/40
                      text-slate-300 rounded p-1.5"
                  >
                    <option value="minor">Minor (±5%)</option>
                    <option value="moderate">Moderate (±15%)</option>
                    <option value="significant">Significant (±30%)</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="text-[7px] text-slate-600 mb-1">Reasoning</div>
                <textarea
                  value={reasoning}
                  onChange={e => setReasoning(e.target.value)}
                  rows={2}
                  placeholder="Why this change?"
                  className="w-full text-[9px] bg-black/40 border border-intel-border/40
                    text-slate-300 rounded p-1.5 resize-none focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleSubmit}
          disabled={!note || !whatHappened || saving}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg
            bg-intel-purple/20 border border-intel-purple/40 text-intel-purple
            text-[9px] font-mono uppercase hover:bg-intel-purple/30
            disabled:opacity-40 transition-all"
        >
          <Save className="w-3 h-3" />
          <span>{saving ? 'Saving...' : 'Save Correction'}</span>
        </button>
        <button
          onClick={onCancel}
          className="text-[9px] font-mono text-slate-600 hover:text-slate-400"
        >
          Cancel
        </button>
      </div>
      <p className="text-[8px] text-slate-700 leading-relaxed">
        ⚠ Corrections are stored for analyst review. No model parameters
        are changed automatically. Changes require explicit human approval.
      </p>
    </div>
  );
};

// ── Prediction Card ────────────────────────────────────────────

const PredictionCard: React.FC<{
  record: PredictionRecord;
  onCorrect: (id: string) => void;
}> = ({ record, onCorrect }) => {
  const isPending = !record.evaluated_at;
  const isEvaluated = !!record.evaluated_at;
  const accuracy = record.accuracy_score;
  const daysUntilEval = record.evaluate_after
    ? Math.max(0, Math.round(
        (new Date(record.evaluate_after).getTime() - Date.now()) / 86400000
      ))
    : 0;

  const rriColor = record.rri >= 2.5 ? 'text-intel-red' :
    record.rri >= 2.0 ? 'text-intel-orange' : 'text-yellow-500';

  return (
    <div className={`p-4 rounded-xl border space-y-3 transition-all ${
      isEvaluated
        ? (accuracy && accuracy >= 0.70)
          ? 'border-intel-cyan/20 bg-intel-cyan/3'
          : (accuracy && accuracy < 0.50)
          ? 'border-intel-red/20 bg-intel-red/3'
          : 'border-intel-border/30 bg-black/10'
        : 'border-intel-border/20 bg-black/10'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isPending ? (
            <Clock className="w-3.5 h-3.5 text-slate-600" />
          ) : accuracy && accuracy >= 0.70 ? (
            <CheckCircle className="w-3.5 h-3.5 text-intel-cyan" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-intel-red" />
          )}
          <span className="text-[9px] font-mono text-slate-500">
            {new Date(record.predicted_at).toLocaleDateString()}
            {' · '}
            {HORIZON_LABELS[record.horizon_days]} horizon
          </span>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5
            rounded border ${
            record.triggered_by === 'THRESHOLD_BREACH'
              ? 'border-intel-red/30 text-intel-red'
              : 'border-intel-border/30 text-slate-600'
          }`}>
            {record.triggered_by}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {isPending && (
            <span className="text-[8px] font-mono text-slate-600">
              evaluates in {daysUntilEval}d
            </span>
          )}
          {isEvaluated && accuracy !== undefined && (
            <span className={`text-[11px] font-bold font-mono ${
              accuracy >= 0.70 ? 'text-intel-cyan' :
              accuracy >= 0.50 ? 'text-yellow-500' : 'text-intel-red'
            }`}>
              {Math.round(accuracy * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Model state at prediction time */}
      <div className="flex flex-wrap gap-2 text-[8px] font-mono">
        <span className={`${rriColor} font-bold`}>R(t)={record.rri.toFixed(2)}</span>
        <span className="text-slate-600">P_rev={Math.round(record.p_rev * 100)}%</span>
        <span className={record.velocity > 0.15 ? 'text-intel-orange' : 'text-slate-600'}>
          V={record.velocity.toFixed(3)}
        </span>
        <span className="text-slate-600">MII={Math.round(record.mii * 100)}%</span>
        {record.rpi > 0.30 && (
          <span className="text-intel-orange">RPI={Math.round(record.rpi * 100)}%</span>
        )}
      </div>

      {/* Predictions list */}
      <div className="grid grid-cols-2 gap-1">
        {(record.predictions ?? []).slice(0, 8).map(p => {
          const actual = record.actuals?.[p.variable];
          const hit = actual !== undefined ? p.predicted === actual : null;
          return (
            <div key={p.variable}
              className="flex items-center space-x-1.5 text-[8px] font-mono">
              {hit === true ? (
                <CheckCircle className="w-3 h-3 text-intel-cyan shrink-0" />
              ) : hit === false ? (
                <XCircle className="w-3 h-3 text-intel-red shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-slate-700 shrink-0" />
              )}
              <span className={`truncate ${
                hit === true ? 'text-slate-400' :
                hit === false ? 'text-slate-500' :
                'text-slate-700'
              }`}>
                {VAR_LABELS[p.variable] ?? p.variable}
              </span>
            </div>
          );
        })}
      </div>

      {/* False positives / negatives */}
      {isEvaluated && (record.false_positives?.length || record.false_negatives?.length) ? (
        <div className="space-y-1 border-t border-white/5 pt-2">
          {record.false_positives && record.false_positives.length > 0 && (
            <div className="text-[8px] font-mono">
              <span className="text-intel-orange">False +: </span>
              <span className="text-slate-500">
                {record.false_positives
                  .map(v => VAR_LABELS[v] ?? v)
                  .join(', ')}
              </span>
            </div>
          )}
          {record.false_negatives && record.false_negatives.length > 0 && (
            <div className="text-[8px] font-mono">
              <span className="text-intel-red">False −: </span>
              <span className="text-slate-500">
                {record.false_negatives
                  .map(v => VAR_LABELS[v] ?? v)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Analyst correction button */}
      {isEvaluated && (
        <button
          onClick={() => onCorrect(record.id)}
          className="flex items-center space-x-1.5 text-[8px] font-mono
            text-slate-600 hover:text-intel-purple transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add analyst correction</span>
        </button>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────

export const ModelPerformance: React.FC = () => {
  const { rriState, data, miiProfile, rpiProfile, cognitiveEnvironment, seiResult } = usePipeline();

  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [corrections, setCorrections] = useState<AnalystCorrection[]>([]);
  const [recommendations, setRecommendations] = useState<Awaited<
    ReturnType<typeof getSurfacedRecommendations>
  >>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    'overview' | 'predictions' | 'accuracy' | 'corrections' | 'recommendations'
  >('overview');
  const [correctionTarget, setCorrectionTarget] = useState<string | null>(null);

  // Load data
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Try Supabase first, fall back to localStorage
      let fetched = await fetchPredictions({ limit: 100 });
      if (!fetched.length) {
        fetched = loadLocalPredictions();
      }
      setRecords(fetched);

      const corr = await fetchAnalystCorrections();
      setCorrections(corr);

      const recs = await getSurfacedRecommendations();
      setRecommendations(recs);
    } catch {
      setRecords(loadLocalPredictions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Compute stats
  const stats = useMemo(() => computeAccuracyStats(records), [records]);
  const performance = useMemo(() => computeModelPerformance(records, stats), [records, stats]);

  // Store a new prediction manually
  const handleStorePrediction = useCallback(async () => {
    const engines = { miiProfile, rpiProfile, cognitiveEnvironment, seiResult };
    // Try Supabase, fall back to localStorage
    try {
      const { storePrediction } = await import('../services/predictionLedger');
      await storePrediction(rriState, data, engines, 14, 'MANUAL');
    } catch {
      storePredictionLocal(rriState, data, engines, 14);
    }
    await loadAll();
  }, [rriState, data, miiProfile, rpiProfile, cognitiveEnvironment, seiResult, loadAll]);

  const trendColor = performance.recentTrend === 'IMPROVING' ? 'text-intel-cyan' :
    performance.recentTrend === 'DEGRADING' ? 'text-intel-red' : 'text-slate-400';
  const trendIcon = performance.recentTrend === 'IMPROVING' ? TrendingUp :
    performance.recentTrend === 'DEGRADING' ? TrendingDown : Activity;
  const TrendIcon = trendIcon;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-intel-cyan" />
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">
              Model Performance & Learning Loop
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleStorePrediction}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg
                border border-intel-cyan/30 bg-intel-cyan/5 text-intel-cyan
                text-[9px] font-mono uppercase hover:bg-intel-cyan/10 transition-all"
            >
              <Plus className="w-3 h-3" />
              <span>Snapshot</span>
            </button>
            <button
              onClick={loadAll}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg
                border border-intel-border/30 text-slate-600 text-[9px]
                font-mono uppercase hover:text-slate-300 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-8">
          Falsifiable predictions · Accuracy by variable ·
          Analyst corrections · No auto-adjustment
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: 'Overall Accuracy',
            value: `${Math.round(performance.overallAccuracy * 100)}%`,
            sub: performance.calibrationNote.slice(0, 40),
            color: performance.overallAccuracy >= 0.70 ? 'text-intel-cyan' :
              performance.overallAccuracy >= 0.55 ? 'text-yellow-500' : 'text-intel-red',
          },
          {
            label: 'Total Predictions',
            value: performance.totalPredictions.toString(),
            sub: `${performance.evaluated} evaluated · ${performance.pending} pending`,
            color: 'text-white',
          },
          {
            label: 'False Positive Rate',
            value: `${Math.round(performance.falsePositiveRate * 100)}%`,
            sub: 'Predicted escalation, nothing happened',
            color: performance.falsePositiveRate > 0.25 ? 'text-intel-orange' : 'text-slate-300',
          },
          {
            label: 'False Negative Rate',
            value: `${Math.round(performance.falseNegativeRate * 100)}%`,
            sub: 'Missed escalation that occurred',
            color: performance.falseNegativeRate > 0.20 ? 'text-intel-red' : 'text-slate-300',
          },
          {
            label: 'Recent Trend',
            value: performance.recentTrend,
            sub: 'Last 5 vs previous 5 evaluations',
            color: trendColor,
          },
        ].map((kpi, i) => (
          <div key={i}
            className="glass p-4 rounded-xl border border-intel-border/30 space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
              {kpi.label}
            </div>
            <div className={`text-xl font-bold font-mono ${kpi.color}`}>
              {kpi.value}
            </div>
            <div className="text-[7px] text-slate-700 leading-snug">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Section nav */}
      <div className="flex items-center space-x-1 bg-black/40 border
        border-intel-border rounded-xl p-1 overflow-x-auto scrollbar-hide w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: Brain },
          { id: 'predictions', label: 'Predictions', icon: Clock },
          { id: 'accuracy', label: 'Accuracy', icon: Target },
          { id: 'corrections', label: `Corrections (${corrections.length})`, icon: BookOpen },
          { id: 'recommendations', label: `Recommendations (${recommendations.length})`, icon: Layers },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg
                text-[9px] font-mono uppercase tracking-wider whitespace-nowrap
                transition-all ${
                activeSection === s.id
                  ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
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

          {/* ── OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div className="space-y-5">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                The learning loop compares what the model predicted against what
                actually happened. Accuracy is computed by variable and time horizon.
                The model does not self-adjust — analyst corrections accumulate and
                surface as recommendations for human review.
              </p>

              {/* Calibration note */}
              <div className="glass p-5 rounded-2xl border border-intel-cyan/20 space-y-2">
                <div className="flex items-center space-x-2">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    Calibration Assessment
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {performance.calibrationNote || 'Awaiting evaluated predictions.'}
                </p>
              </div>

              {/* By horizon */}
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Accuracy by Time Horizon
                </div>
                {([7, 14, 30, 60] as const).map(h => {
                  const hData = performance.byHorizon[h];
                  return (
                    <div key={h} className="space-y-1">
                      <AccuracyBar
                        value={hData.accuracy}
                        label={`${HORIZON_LABELS[h]} (${hData.count} evaluated)`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Best / worst variables */}
              {(performance.bestVariable || performance.worstVariable) && (
                <div className="grid grid-cols-2 gap-4">
                  {performance.bestVariable && (
                    <div className="glass p-4 rounded-xl border border-intel-cyan/20 space-y-1">
                      <div className="text-[8px] font-mono text-slate-600 uppercase">
                        Best Predicted Variable
                      </div>
                      <div className="text-[10px] text-intel-cyan font-bold">
                        {VAR_LABELS[performance.bestVariable.variable]}
                      </div>
                      <div className="text-[9px] font-mono text-intel-cyan">
                        {Math.round(performance.bestVariable.hitRate * 100)}% hit rate
                      </div>
                    </div>
                  )}
                  {performance.worstVariable && (
                    <div className="glass p-4 rounded-xl border border-intel-red/20 space-y-1">
                      <div className="text-[8px] font-mono text-slate-600 uppercase">
                        Needs Review
                      </div>
                      <div className="text-[10px] text-intel-red font-bold">
                        {VAR_LABELS[performance.worstVariable.variable]}
                      </div>
                      <div className="text-[9px] font-mono text-intel-red">
                        {Math.round(performance.worstVariable.hitRate * 100)}% hit rate
                      </div>
                    </div>
                  )}
                </div>
              )}

              {loading && (
                <div className="text-[10px] font-mono text-slate-700 text-center py-8">
                  Loading prediction records...
                </div>
              )}

              {!loading && records.length === 0 && (
                <div className="p-6 rounded-2xl border border-dashed border-intel-border/30
                  text-center space-y-3">
                  <Target className="w-8 h-8 text-slate-800 mx-auto" />
                  <div className="text-[10px] font-mono text-slate-700 uppercase">
                    No predictions stored yet
                  </div>
                  <p className="text-[9px] text-slate-700 max-w-sm mx-auto leading-relaxed">
                    Click "Snapshot" to store the current model state as a prediction.
                    The system will evaluate it automatically after the horizon elapses.
                  </p>
                  <button
                    onClick={handleStorePrediction}
                    className="px-4 py-2 rounded-lg border border-intel-cyan/30
                      bg-intel-cyan/5 text-intel-cyan text-[9px] font-mono
                      uppercase hover:bg-intel-cyan/10 transition-all mx-auto block"
                  >
                    Store First Snapshot
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PREDICTIONS ── */}
          {activeSection === 'predictions' && (
            <div className="space-y-3">
              {correctionTarget && (
                <CorrectionForm
                  predictionId={correctionTarget}
                  onSubmit={async () => {
                    setCorrectionTarget(null);
                    await loadAll();
                  }}
                  onCancel={() => setCorrectionTarget(null)}
                />
              )}

              {records.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-700 text-center py-12">
                  No predictions yet. Click "Snapshot" to begin.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-[9px]
                    font-mono text-slate-600">
                    <span>{records.length} predictions total</span>
                    <span>
                      {records.filter(r => !r.evaluated_at).length} pending ·{' '}
                      {records.filter(r => r.evaluated_at).length} evaluated
                    </span>
                  </div>
                  {records.map(rec => (
                    <PredictionCard
                      key={rec.id}
                      record={rec}
                      onCorrect={(id) => setCorrectionTarget(id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── ACCURACY ── */}
          {activeSection === 'accuracy' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Hit rate per variable. A 70%+ hit rate indicates the variable is
                well-calibrated. Below 55% suggests systematic bias — either
                the threshold is wrong, the weight is wrong, or a key signal
                is missing.
              </p>

              {stats.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-700 text-center py-12">
                  No evaluated predictions yet. Accuracy data appears after
                  prediction horizons elapse.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats
                    .sort((a, b) => b.hitRate - a.hitRate)
                    .map(s => (
                    <div key={s.variable}
                      className="glass p-4 rounded-xl border border-intel-border/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white">
                          {VAR_LABELS[s.variable] ?? s.variable}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-[8px] font-mono text-slate-600">
                            n={s.total}
                          </span>
                          <span className={`text-[11px] font-bold font-mono ${
                            s.hitRate >= 0.70 ? 'text-intel-cyan' :
                            s.hitRate >= 0.55 ? 'text-yellow-500' : 'text-intel-red'
                          }`}>
                            {Math.round(s.hitRate * 100)}%
                          </span>
                        </div>
                      </div>
                      <AccuracyBar value={s.hitRate} label="Hit rate" />
                      <div className="grid grid-cols-4 gap-2">
                        {([7, 14, 30, 60] as const).map(h => {
                          const hd = s.byHorizon[h];
                          return (
                            <div key={h} className="text-center">
                              <div className="text-[7px] font-mono text-slate-700">
                                {HORIZON_LABELS[h]}
                              </div>
                              <div className={`text-[9px] font-mono font-bold ${
                                hd.total === 0 ? 'text-slate-800' :
                                hd.hitRate >= 0.70 ? 'text-intel-cyan' :
                                hd.hitRate >= 0.55 ? 'text-yellow-500' : 'text-intel-red'
                              }`}>
                                {hd.total === 0 ? '—' : `${Math.round(hd.hitRate * 100)}%`}
                              </div>
                              <div className="text-[6px] text-slate-800">
                                {hd.total > 0 ? `n=${hd.total}` : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {(s.falsePositiveRate > 0.25 || s.falseNegativeRate > 0.20) && (
                        <div className="flex items-center space-x-3 text-[8px] font-mono border-t
                          border-white/5 pt-2">
                          {s.falsePositiveRate > 0.25 && (
                            <span className="text-intel-orange">
                              FP rate: {Math.round(s.falsePositiveRate * 100)}%
                            </span>
                          )}
                          {s.falseNegativeRate > 0.20 && (
                            <span className="text-intel-red">
                              FN rate: {Math.round(s.falseNegativeRate * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CORRECTIONS ── */}
          {activeSection === 'corrections' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Analyst corrections record what the model missed and why.
                They accumulate into evidence that surfaces as recommendations.
                No model parameters change automatically — all changes require
                explicit human approval.
              </p>

              {corrections.length === 0 ? (
                <div className="text-[10px] font-mono text-slate-700 text-center py-12">
                  No analyst corrections yet. Add corrections from evaluated
                  predictions in the Predictions tab.
                </div>
              ) : (
                <div className="space-y-3">
                  {corrections.map(c => (
                    <div key={c.id}
                      className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                      <div className="flex items-center justify-between text-[8px] font-mono">
                        <span className="text-slate-600">
                          {new Date(c.corrected_at).toLocaleDateString()}
                        </span>
                        {c.applied && (
                          <span className="text-intel-cyan">✓ Applied</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300">{c.analyst_note}</div>
                      <div className="text-[9px] text-slate-500">
                        Reality: {c.what_actually_happened}
                      </div>
                      {c.missed_variable && (
                        <div className="text-[8px] font-mono text-intel-orange">
                          Missed signal: {c.missed_variable}
                        </div>
                      )}
                      {c.suggested_weight_change && (
                        <div className="p-2 rounded-lg bg-black/30 border border-intel-border/20
                          text-[8px] font-mono space-y-0.5">
                          <div className="text-slate-400 font-bold">Suggested change:</div>
                          <div className="text-intel-purple">
                            {c.suggested_weight_change.equation} →
                            {c.suggested_weight_change.parameter} :
                            {c.suggested_weight_change.direction.toUpperCase()}
                            ({c.suggested_weight_change.magnitude})
                          </div>
                          <div className="text-slate-600">
                            {c.suggested_weight_change.reasoning}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RECOMMENDATIONS ── */}
          {activeSection === 'recommendations' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                Recommendations surface when 3+ analyst corrections flag the same
                parameter in the same direction. These are evidence-based suggestions
                for model improvement — not automatic changes.
              </p>

              {recommendations.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-intel-border/30
                  text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-800 mx-auto" />
                  <div className="text-[10px] font-mono text-slate-700 uppercase">
                    No recommendations yet
                  </div>
                  <p className="text-[9px] text-slate-700 max-w-sm mx-auto">
                    Recommendations appear when 3+ analyst corrections point
                    to the same model weakness.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={i}
                      className="glass p-5 rounded-2xl border border-intel-purple/30
                        bg-intel-purple/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-intel-purple">
                          {rec.parameter}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-mono font-bold uppercase ${
                            rec.direction === 'increase' ? 'text-intel-orange' : 'text-intel-cyan'
                          }`}>
                            {rec.direction === 'increase' ? '↑' : '↓'} {rec.direction}
                          </span>
                          <span className="text-[8px] font-mono text-slate-600">
                            {rec.magnitude}
                          </span>
                          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded
                            bg-intel-purple/20 border border-intel-purple/30 text-intel-purple">
                            {rec.evidenceCount} corrections
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        {rec.latestReasoning}
                      </p>
                      <div className="flex items-center space-x-3 border-t
                        border-white/5 pt-3">
                        <span className="text-[8px] font-mono text-slate-700">
                          ⚠ Requires analyst review and explicit approval before applying
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
