import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, MapPin, TrendingUp, TrendingDown,
  Shield, AlertTriangle, ChevronRight, Clock,
  CheckCircle, XCircle, AlertCircle, Activity,
  Building, Globe, Zap, Lock, RefreshCw,
  Download, Eye, Target, Brain
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import {
  generateInvestmentReport,
  InvestmentIntelReport, ReportQuery,
  InvestorProfile, Sector, InvestmentHorizon, TimingVerdict,
} from '../services/InvestmentIntelligenceEngine';
import { assessGovernmentAgent } from '../services/govAgent';
import { computeAllFrameworks, buildFrameworkInput } from '../services/Frameworkadapters';

// ── Config labels ──────────────────────────────────────────────

const PROFILE_LABELS: Record<InvestorProfile, string> = {
  ENTREPRENEUR_SME: 'Entrepreneur / SME',
  INVESTOR_FDI: 'Foreign Direct Investor',
  NGO_DEVELOPMENT: 'NGO / Development Organization',
  INVESTOR_FINANCIAL: 'Financial Investor',
  GOVERNMENT_PARTNER: 'Government Partner / B2G',
};

const SECTOR_LABELS: Record<Sector, string> = {
  DIGITAL_TECH: 'Digital & Technology',
  MANUFACTURING_LIGHT: 'Light Manufacturing',
  MANUFACTURING_HEAVY: 'Heavy Manufacturing',
  AGRIBUSINESS: 'Agribusiness',
  TOURISM_HOSPITALITY: 'Tourism & Hospitality',
  ENERGY_RENEWABLE: 'Renewable Energy',
  LOGISTICS_TRANSPORT: 'Logistics & Transport',
  FINANCIAL_SERVICES: 'Financial Services',
  HEALTHCARE: 'Healthcare',
  EDUCATION_TRAINING: 'Education & Training',
  RETAIL_CONSUMER: 'Retail & Consumer',
  CONSTRUCTION_REAL_ESTATE: 'Construction & Real Estate',
};

const VERDICT_CONFIG: Record<TimingVerdict, {
  label: string; color: string; bg: string; border: string;
  icon: React.ReactNode; tagline: string;
}> = {
  ENTER_NOW: {
    label: 'Enter Now',
    color: 'text-intel-cyan',
    bg: 'bg-intel-cyan/8',
    border: 'border-intel-cyan/30',
    icon: <CheckCircle className="w-5 h-5" />,
    tagline: 'Conditions are currently favorable',
  },
  CONDITIONAL_ENTRY: {
    label: 'Conditional Entry',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/25',
    icon: <AlertCircle className="w-5 h-5" />,
    tagline: 'Viable with specific preconditions',
  },
  WAIT_FOR_TRIGGER: {
    label: 'Wait for Trigger',
    color: 'text-intel-orange',
    bg: 'bg-intel-orange/8',
    border: 'border-intel-orange/30',
    icon: <Clock className="w-5 h-5" />,
    tagline: 'Clear conditions identified — monitor',
  },
  DEFER: {
    label: 'Defer',
    color: 'text-intel-red',
    bg: 'bg-intel-red/8',
    border: 'border-intel-red/30',
    icon: <AlertTriangle className="w-5 h-5" />,
    tagline: 'Unfavorable — defer 12+ months',
  },
  AVOID: {
    label: 'Avoid',
    color: 'text-intel-red',
    bg: 'bg-intel-red/12',
    border: 'border-intel-red/50',
    icon: <XCircle className="w-5 h-5" />,
    tagline: 'Structural barriers too high',
  },
};

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-intel-red', bg: 'bg-intel-red/10', border: 'border-intel-red/30' },
  HIGH:     { color: 'text-intel-orange', bg: 'bg-intel-orange/8', border: 'border-intel-orange/25' },
  MEDIUM:   { color: 'text-yellow-500', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20' },
  LOW:      { color: 'text-intel-cyan', bg: 'bg-intel-cyan/5', border: 'border-intel-cyan/15' },
};

// ── Query Form ─────────────────────────────────────────────────

const QueryForm: React.FC<{
  query: ReportQuery;
  onChange: (q: ReportQuery) => void;
  onGenerate: () => void;
  generating: boolean;
}> = ({ query, onChange, onGenerate, generating }) => {
  return (
    <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-5">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-intel-orange" />
          <span className="text-[10px] font-mono text-white uppercase tracking-widest">
            Generate Investment Intelligence Report
          </span>
        </div>
        <p className="text-[9px] text-slate-500 pl-6">
          Synthesizes live model state into a structured investment assessment.
          All sections update automatically when conditions change.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Profile */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            Investor Profile
          </label>
          <select
            value={query.profile}
            onChange={e => onChange({ ...query, profile: e.target.value as InvestorProfile })}
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg px-3 py-2 focus:outline-none
              focus:border-intel-orange/40"
          >
            {Object.entries(PROFILE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Sector */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            Sector
          </label>
          <select
            value={query.sector}
            onChange={e => onChange({ ...query, sector: e.target.value as Sector })}
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg px-3 py-2 focus:outline-none
              focus:border-intel-orange/40"
          >
            {Object.entries(SECTOR_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Horizon */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            Investment Horizon
          </label>
          <select
            value={query.horizon}
            onChange={e => onChange({ ...query, horizon: e.target.value as InvestmentHorizon })}
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg px-3 py-2 focus:outline-none
              focus:border-intel-orange/40"
          >
            <option value="SHORT">Short-term (&lt;1 year)</option>
            <option value="MEDIUM">Medium-term (1-3 years)</option>
            <option value="LONG">Long-term (3-10 years)</option>
          </select>
        </div>

        {/* Capital scale */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            Capital Scale
          </label>
          <select
            value={query.capitalScale}
            onChange={e => onChange({ ...query, capitalScale: e.target.value as any })}
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg px-3 py-2 focus:outline-none
              focus:border-intel-orange/40"
          >
            <option value="MICRO">Micro (&lt;$50K)</option>
            <option value="SMALL">Small ($50K-$500K)</option>
            <option value="MEDIUM">Medium ($500K-$5M)</option>
            <option value="LARGE">Large (&gt;$5M)</option>
          </select>
        </div>

        {/* Region preference */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            Region Preference (optional)
          </label>
          <select
            value={query.preferredRegion ?? ''}
            onChange={e => onChange({ ...query, preferredRegion: e.target.value || undefined })}
            className="w-full text-[10px] bg-black/40 border border-intel-border/50
              text-slate-300 rounded-lg px-3 py-2 focus:outline-none
              focus:border-intel-orange/40"
          >
            <option value="">No preference — recommend best</option>
            <option value="coastal">Coastal governorates only</option>
            <option value="interior">Interior governorates</option>
            <option value="Tunis">Greater Tunis</option>
            <option value="Sfax">Sfax region</option>
            <option value="Sousse">Sousse-Monastir corridor</option>
          </select>
        </div>

        {/* Generate button */}
        <div className="flex items-end">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center space-x-2
              px-4 py-2.5 rounded-lg bg-intel-orange/15 border border-intel-orange/30
              text-intel-orange text-[10px] font-mono uppercase tracking-wider
              hover:bg-intel-orange/25 disabled:opacity-40 transition-all"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Report Display ─────────────────────────────────────────────

const ReportDisplay: React.FC<{ report: InvestmentIntelReport }> = ({ report: r }) => {
  const [activeSection, setActiveSection] = useState<
    'summary' | 'timing' | 'location' | 'risks' | 'constraints' | 'sector' | 'actions'
  >('summary');

  const verdictCfg = VERDICT_CONFIG[r.timingVerdict];

  return (
    <div className="space-y-5">
      {/* Report header */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 space-y-4
        ${verdictCfg.bg} ${verdictCfg.border}`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl
          opacity-10 pointer-events-none ${verdictCfg.color.replace('text-','bg-')}`}
          style={{ transform: 'translate(30%,-30%)' }} />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-2">
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
              Investment Intelligence Report · Tunisia ·
              {new Date(r.generatedAt).toLocaleDateString('en-GB', {
                day:'numeric', month:'long', year:'numeric'
              })}
            </div>
            <div className="flex items-center space-x-3">
              <div className={verdictCfg.color}>{verdictCfg.icon}</div>
              <div>
                <div className={`text-xl font-bold font-mono uppercase ${verdictCfg.color}`}>
                  {verdictCfg.label}
                </div>
                <div className="text-[9px] text-slate-500">{verdictCfg.tagline}</div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-1 shrink-0">
            <div className="text-[8px] font-mono text-slate-600">Confidence</div>
            <div className={`text-2xl font-bold font-mono ${verdictCfg.color}`}>
              {r.confidenceScore}%
            </div>
            <div className="text-[8px] font-mono text-slate-700">
              Entry: {r.entryWindow}
            </div>
          </div>
        </div>

        {/* Model state strip */}
        <div className="relative z-10 flex flex-wrap gap-3 text-[8px] font-mono
          text-slate-600 border-t border-white/5 pt-3">
          <span>R(t)=<strong className="text-slate-300">{r.modelState.rri.toFixed(2)}</strong></span>
          <span>P_rev=<strong className="text-slate-300">{(r.modelState.p_rev*100).toFixed(0)}%</strong></span>
          <span>V={r.modelState.velocity}</span>
          <span>FX=<strong className={r.modelState.fxReserves < 85 ? 'text-intel-red' : 'text-slate-300'}>
            {r.modelState.fxReserves}d
          </strong></span>
          <span>Inflation=<strong className={r.modelState.inflation > 7 ? 'text-intel-orange' : 'text-slate-300'}>
            {r.modelState.inflation.toFixed(1)}%
          </strong></span>
          <span>IMF=<strong className={r.modelState.imfDealProb < 40 ? 'text-intel-orange' : 'text-slate-300'}>
            {r.modelState.imfDealProb}%
          </strong></span>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex items-center space-x-1 bg-black/40 border border-intel-border
        rounded-xl p-1 overflow-x-auto scrollbar-hide w-fit">
        {[
          { id: 'summary', label: 'Summary', icon: FileText },
          { id: 'timing', label: 'Timing', icon: Clock },
          { id: 'location', label: 'Location', icon: MapPin },
          { id: 'risks', label: 'Scenarios', icon: Activity },
          { id: 'constraints', label: 'Constraints', icon: Lock },
          { id: 'sector', label: 'Sector', icon: Building },
          { id: 'actions', label: 'Actions', icon: ChevronRight },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg
                text-[9px] font-mono uppercase tracking-wider whitespace-nowrap
                transition-all ${
                activeSection === s.id
                  ? `${verdictCfg.bg} ${verdictCfg.color} border ${verdictCfg.border}`
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
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >

          {/* SUMMARY */}
          {activeSection === 'summary' && (
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border space-y-3 ${verdictCfg.bg} ${verdictCfg.border}`}>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Executive Summary
                </div>
                <p className="text-[12px] text-slate-100 leading-relaxed font-medium">
                  {r.executiveSummary}
                </p>
              </div>

              {/* Critical constraint callout */}
              {r.criticalConstraint && (
                <div className="p-4 rounded-xl border border-intel-red/30
                  bg-intel-red/5 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-intel-red" />
                    <span className="text-[9px] font-mono text-intel-red uppercase">
                      Critical Constraint: {r.criticalConstraint.title}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 pl-5 leading-relaxed">
                    {r.criticalConstraint.workaround}
                  </p>
                </div>
              )}

              {/* Regime risk one-liner */}
              <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                <div className="flex items-center space-x-2">
                  <Brain className="w-3.5 h-3.5 text-intel-purple" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    Regime Risk
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  {r.regimeRiskAssessment}
                </p>
                {r.predictedRegimeActions.length > 0 && (
                  <div className="text-[8px] font-mono text-intel-purple/70">
                    Predicted actions: {r.predictedRegimeActions.join(' · ')}
                  </div>
                )}
              </div>

              {/* Watch indicators preview */}
              <div className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Watch Indicators
                </div>
                {r.watchIndicators.slice(0, 3).map((w, i) => (
                  <div key={`${w.signal}-${i}`}
                    className="flex items-center justify-between py-1.5
                      border-b border-white/5 last:border-0">
                    <div className="text-[9px] text-slate-400">{w.signal}</div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`text-[9px] font-mono font-bold ${
                        w.probability > 0.55 ? 'text-intel-red' :
                        w.probability > 0.35 ? 'text-intel-orange' : 'text-slate-500'
                      }`}>{w.currentValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIMING */}
          {activeSection === 'timing' && (
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border space-y-3 ${verdictCfg.bg} ${verdictCfg.border}`}>
                <div className="flex items-center space-x-2">
                  {verdictCfg.icon}
                  <span className={`text-[11px] font-bold ${verdictCfg.color}`}>
                    {verdictCfg.label} — {r.entryWindow}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {r.timingRationale}
                </p>
              </div>

              {r.entryTriggers.length > 0 && (
                <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-4">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    Entry Conditions / Triggers
                  </div>
                  {r.entryTriggers.map((t, i) => (
                    <div key={`${t.condition}-${i}`}
                      className="p-4 rounded-xl border border-intel-border/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-white">
                          {t.condition}
                        </span>
                        <span className={`text-[9px] font-mono font-bold ${
                          t.probability > 0.60 ? 'text-intel-cyan' :
                          t.probability > 0.40 ? 'text-yellow-500' : 'text-intel-orange'
                        }`}>
                          {Math.round(t.probability * 100)}% likely
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-[8px] font-mono">
                        <div>
                          <span className="text-slate-600">Current: </span>
                          <span className="text-intel-orange">{t.currentValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Target: </span>
                          <span className="text-intel-cyan">{t.targetValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Est: </span>
                          <span className="text-slate-400">{t.estimatedDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LOCATION */}
          {activeSection === 'location' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                Governorate rankings for{' '}
                <strong className="text-slate-300">{SECTOR_LABELS[r.query.sector]}</strong>.
                Scores weight sector-specific factors — a high overall score for manufacturing
                reflects different inputs than for digital tech.
              </p>
              {r.governorateRankings.map((g, i) => {
                const recColors: Record<string, string> = {
                  RECOMMENDED: 'border-intel-cyan/30 bg-intel-cyan/5',
                  VIABLE: 'border-intel-border/30 bg-black/10',
                  CAUTION: 'border-yellow-500/20 bg-yellow-500/3',
                  AVOID: 'border-intel-red/20 bg-intel-red/3',
                };
                return (
                  <div key={`${g.name}-${i}`}
                    className={`p-5 rounded-2xl border space-y-3 ${recColors[g.recommendation]}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`text-[9px] font-mono font-bold uppercase
                          px-2 py-0.5 rounded border ${
                          g.recommendation === 'RECOMMENDED'
                            ? 'text-intel-cyan border-intel-cyan/30'
                            : g.recommendation === 'VIABLE'
                            ? 'text-slate-400 border-slate-700'
                            : g.recommendation === 'CAUTION'
                            ? 'text-yellow-500 border-yellow-500/30'
                            : 'text-intel-red border-intel-red/30'
                        }`}>{g.recommendation}</div>
                        <span className="text-[13px] font-bold text-white">{g.name}</span>
                        <span className="text-[8px] font-mono text-slate-600">#{i+1}</span>
                      </div>
                      <div className={`text-3xl font-bold font-mono ${
                        g.overall >= 70 ? 'text-intel-cyan' :
                        g.overall >= 55 ? 'text-yellow-500' : 'text-intel-red'
                      }`}>{g.overall}</div>
                    </div>

                    {/* Score bars */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Infrastructure', val: g.infrastructure },
                        { label: 'Labor', val: g.labor },
                        { label: 'Logistics', val: g.logistics },
                        { label: 'Security', val: 100 - g.socialRisk },
                        { label: 'Bureaucracy', val: g.bureaucracy },
                        { label: 'Economy', val: g.economy },
                      ].map(m => (
                        <div key={m.label} className="space-y-0.5">
                          <div className="flex justify-between text-[7px] font-mono">
                            <span className="text-slate-700">{m.label}</span>
                            <span className={m.val >= 70 ? 'text-slate-400' :
                              m.val >= 50 ? 'text-slate-600' : 'text-intel-red/60'}>
                              {m.val}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              m.val >= 70 ? 'bg-intel-cyan' :
                              m.val >= 50 ? 'bg-yellow-500' : 'bg-intel-red'
                            }`} style={{ width: `${m.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[8px]">
                      {g.keyStrengths.length > 0 && (
                        <div>
                          <div className="text-intel-cyan font-mono mb-1">Strengths</div>
                          {g.keyStrengths.map((s, j) => (
                            <div key={`${s}-${j}`} className="text-slate-500">+ {s}</div>
                          ))}
                        </div>
                      )}
                      {g.keyRisks.length > 0 && (
                        <div>
                          <div className="text-intel-red font-mono mb-1">Risks</div>
                          {g.keyRisks.map((r, j) => (
                            <div key={`${r}-${j}`} className="text-slate-500">− {r}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SCENARIOS */}
          {activeSection === 'risks' && (
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                Three scenarios derived from current model trajectories.
                Probabilities are model-based estimates, not forecasts.
                Plan for all three — calibrate capital deployment accordingly.
              </p>
              {r.scenarios.map(s => {
                const scColors = {
                  BASE_CASE: { color: 'text-slate-300', border: 'border-intel-border/40', bg: 'bg-black/10' },
                  DETERIORATION: { color: 'text-intel-red', border: 'border-intel-red/25', bg: 'bg-intel-red/5' },
                  IMPROVEMENT: { color: 'text-intel-cyan', border: 'border-intel-cyan/25', bg: 'bg-intel-cyan/5' },
                };
                const sc = scColors[s.label];
                return (
                  <div key={s.label}
                    className={`p-5 rounded-2xl border space-y-3 ${sc.bg} ${sc.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {s.label === 'IMPROVEMENT' && <TrendingUp className={`w-4 h-4 ${sc.color}`} />}
                        {s.label === 'DETERIORATION' && <TrendingDown className={`w-4 h-4 ${sc.color}`} />}
                        {s.label === 'BASE_CASE' && <Activity className={`w-4 h-4 ${sc.color}`} />}
                        <span className={`text-[11px] font-bold ${sc.color}`}>
                          {s.label.replace(/_/g,' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[7px] font-mono text-slate-600">Probability</div>
                        <div className={`text-2xl font-bold font-mono ${sc.color}`}>
                          {Math.round(s.probability * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-[9px]">
                      <div>
                        <span className="text-slate-600">Trajectory: </span>
                        <span className="text-slate-300">{s.rriTrajectory}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Investment impact: </span>
                        <span className="text-slate-300">{s.investmentImpact}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[8px] border-t border-white/5 pt-2">
                      <div className="space-y-1">
                        <div className="text-slate-600 font-mono uppercase">Trigger conditions</div>
                        {s.triggerConditions.map((c, i) => (
                          <div key={i} className="text-slate-500">→ {c}</div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-600 font-mono uppercase">Your response</div>
                        {s.mitigationActions.map((a, i) => (
                          <div key={i} className="text-slate-500">→ {a}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONSTRAINTS */}
          {activeSection === 'constraints' && (
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl">
                Structural constraints that apply to your specific
                profile, sector, and capital scale. Each has a documented
                workaround — these are solvable problems, not reasons to avoid.
              </p>
              {r.structuralConstraints.map((c, i) => {
                const scfg = SEVERITY_CONFIG[c.severity];
                return (
                  <div key={i}
                    className={`p-5 rounded-2xl border space-y-3 ${scfg.bg} ${scfg.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className={`w-3.5 h-3.5 ${scfg.color}`} />
                        <span className={`text-[10px] font-bold ${scfg.color}`}>
                          {c.title}
                        </span>
                      </div>
                      <span className={`text-[7px] font-mono uppercase px-1.5 py-0.5
                        rounded border ${scfg.color} border-current`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      {c.currentState}
                    </p>
                    {c.workaround && (
                      <div className="space-y-1">
                        <div className="text-[8px] font-mono text-intel-cyan uppercase">
                          Workaround
                        </div>
                        <p className="text-[9px] text-intel-cyan/80 leading-relaxed">
                          → {c.workaround}
                        </p>
                      </div>
                    )}
                    {c.timeToResolve && (
                      <div className="text-[8px] font-mono text-slate-600">
                        Time to resolve: {c.timeToResolve}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTOR */}
          {activeSection === 'sector' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4 rounded-xl border border-intel-border/30">
                  <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">
                    Sector Viability
                  </div>
                  <div className={`text-5xl font-bold font-mono ${
                    r.sectorAnalysis.viabilityScore >= 65 ? 'text-intel-cyan' :
                    r.sectorAnalysis.viabilityScore >= 45 ? 'text-yellow-500' : 'text-intel-red'
                  }`}>{r.sectorAnalysis.viabilityScore}</div>
                  <div className="text-[8px] text-slate-600 mt-1">/100 under current conditions</div>
                </div>
                <div className="glass p-4 rounded-xl border border-intel-border/30">
                  <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">
                    ROI Horizon
                  </div>
                  <div className="text-[13px] font-bold text-white">
                    {r.sectorAnalysis.estimatedROIHorizon}
                  </div>
                </div>
              </div>

              {[
                { label: 'Key Opportunity', text: r.sectorAnalysis.keyOpportunity, color: 'text-intel-cyan' },
                { label: 'Key Challenge', text: r.sectorAnalysis.keyChallenge, color: 'text-intel-orange' },
                { label: 'Market Size', text: r.sectorAnalysis.marketSize, color: 'text-slate-300' },
                { label: 'Comparable Successes', text: r.sectorAnalysis.comparableSuccesses, color: 'text-slate-300' },
                { label: 'Competitor Landscape', text: r.sectorAnalysis.competitorLandscape, color: 'text-slate-400' },
              ].map(item => (
                <div key={item.label}
                  className="glass p-4 rounded-xl border border-intel-border/30 space-y-2">
                  <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                    {item.label}
                  </div>
                  <p className={`text-[10px] leading-relaxed ${item.color}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ACTIONS */}
          {activeSection === 'actions' && (
            <div className="space-y-4">
              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4 text-intel-orange" />
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    Immediate Next Steps
                  </span>
                </div>
                <div className="space-y-2">
                  {r.immediateActions.map((action, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full border border-intel-orange/30
                        text-intel-orange text-[8px] font-bold flex items-center
                        justify-center shrink-0 mt-0.5">{i+1}</div>
                      <p className="text-[10px] text-slate-300 leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  Resource Links
                </div>
                {r.resourceLinks.map((link, i) => (
                  <div key={i}
                    className="text-[9px] font-mono text-intel-cyan/70 border-b
                      border-white/5 last:border-0 pb-1.5 last:pb-0">
                    → {link}
                  </div>
                ))}
              </div>

              <div className="glass p-4 rounded-xl border border-intel-border/30">
                <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">
                  Important Disclaimers
                </div>
                <p className="text-[8px] text-slate-700 leading-relaxed">
                  This report is generated from a quantitative political risk model
                  (Tunisia RRI Engine v2.0) and sector intelligence database.
                  It is an analytical tool, not investment advice.
                  Regulatory, legal, and financial decisions require qualified local counsel.
                  Sector data is periodically updated — verify current conditions with
                  FIPA, BCT, and UGTT directly before committing capital.
                  Report generated: {new Date(r.generatedAt).toLocaleString()}.
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────

export const InvestmentIntelligenceReportGenerator: React.FC = () => {
  const { rriState, data, miiProfile, actorNetwork, seiResult } = usePipeline();
  const [query, setQuery] = useState<ReportQuery>({
    profile: 'ENTREPRENEUR_SME',
    sector: 'DIGITAL_TECH',
    horizon: 'MEDIUM',
    capitalScale: 'SMALL',
  });
  const [report, setReport] = useState<InvestmentIntelReport | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const govAssessment = assessGovernmentAgent(rriState, data, {
        miiProfile, actorNetwork, seiResult,
      });

      const frameworkInput = buildFrameworkInput(rriState, data, {
        miiProfile, seiResult,
      });
      const frameworks = computeAllFrameworks(frameworkInput);
      const cascadeRisks = frameworks.cascade.governorateRisks;

      const generated = generateInvestmentReport(
        query, rriState, data, govAssessment, cascadeRisks
      );
      setReport(generated);
    } catch (e) {
      console.error('Report generation failed:', e);
    } finally {
      setGenerating(false);
    }
  }, [query, rriState, data, miiProfile, actorNetwork, seiResult]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-intel-orange" />
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">
            Investment Intelligence Reports
          </h2>
        </div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pl-8">
          Live model synthesis · Sector analysis · Location intelligence ·
          Structural constraints · Regime risk
        </p>
      </div>

      <QueryForm
        query={query}
        onChange={setQuery}
        onGenerate={handleGenerate}
        generating={generating}
      />

      {!report && !generating && (
        <div className="glass p-10 rounded-2xl border border-dashed border-intel-border/30
          text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-800 mx-auto" />
          <div className="text-[10px] font-mono text-slate-700 uppercase">
            Configure your profile above and generate a report
          </div>
          <p className="text-[9px] text-slate-800 max-w-sm mx-auto">
            Reports synthesize 250-variable RRI model data, sector intelligence,
            governorate risk profiles, and Gov Agent predictions into actionable
            investment guidance.
          </p>
        </div>
      )}

      {generating && (
        <div className="glass p-10 rounded-2xl border border-intel-border/30
          text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-intel-orange animate-spin mx-auto" />
          <div className="text-[10px] font-mono text-intel-orange uppercase">
            Synthesizing model state...
          </div>
        </div>
      )}

      {report && !generating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ReportDisplay report={report} />
        </motion.div>
      )}
    </div>
  );
};
