import React, { useState, useEffect, useMemo } from "react";
import {
  Lock,
  TrendingUp,
  Shield,
  MapPin,
  Radio,
  ChevronRight,
  Zap,
} from "lucide-react";
import { ModuleHeader } from "../shared/ProfessionalShared";
import { NewsFeed } from "../shared/NewsFeed";
import { AIVoiceBriefing } from "./AIVoiceBriefing";
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { generateIntelligenceBrief, IntelligenceBrief } from '../../services/intelligenceBrief';
import { classifySignals, buildSignalSummary } from '../../services/signalClassifier';
import { assessGovernmentAgent } from '../../services/govAgent';
import GOVERNORATES from '../../data/governorates.json';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ExecutiveSummaryData {
  narrative: string;
  confidence: "high" | "moderate" | "low";
  meta: {
    signalSources: number;
    anomalousClusters: number;
    monteCarloRuns: number;
    activeModels: string[];
  };
}

interface RRIMetric {
  label: string;
  value: string;
  trend: {
    direction: "up" | "down" | "stable";
    delta: string;
    label: string;
  };
  context: string;
}

interface BriefingSection {
  id: "economy" | "security" | "society" | "environment";
  name: string;
  icon: React.ReactNode;
  accentColor: string;
  trend: { direction: "up" | "down" | "stable"; label: string };
  narrative: string;
  indicators: { label: string; severity?: "high" | "moderate" | null }[];
  sourceCount: number;
  confidence: "high" | "moderate" | "low";
}

interface GovernorateAlert {
  name: string;
  description: string;
  riskLevel: "low" | "moderate" | "high" | "critical";
  riskPercentage: number;
  trendDelta: number;
  trendDirection: "up" | "down" | "stable";
}

interface PhasePreview {
  phaseNumber: number;
  title: string;
  description: string;
  features: string[];
  status: "in-development" | "planned" | "research" | "beta";
  accentColor: string;
}

// ─── GOVERNORATE PROFILES ─────────────────────────────────────────────────────

const rawGovs: any[] =
  (GOVERNORATES as any)?.default?.governorates ?? (GOVERNORATES as any)?.governorates ?? [];
const GOV_PROFILES = rawGovs.map(g => ({
  name: typeof g.name === 'object' ? g.name.en : g.name,
  cascade_risk: (g as any).cascade_risk ?? 0.3,
}));

const PHASE_PREVIEWS: PhasePreview[] = [
  {
    phaseNumber: 3,
    title: "AI Voice Narration",
    description:
      "Real-time voice synthesis in Arabic, French, and English with morning and evening briefing schedules.",
    features: [
      "ElevenLabs / Azure Neural TTS",
      "Real-time voice-visual sync",
      "Tunisian dialect support",
      "Scheduled briefings",
    ],
    status: "beta",
    accentColor: "#8b5cf6",
  },
  {
    phaseNumber: 4,
    title: "Strategic Forecast",
    description:
      "72h / 7d / 30d cascade probability projections with scenario-based narrative generation.",
    features: [
      "Conditional language engine",
      "Multi-horizon forecast",
      "Scenario branching",
      "Cascade probability curves",
    ],
    status: "planned",
    accentColor: "#f59e0b",
  },
  {
    phaseNumber: 5,
    title: "Multi-Level Access",
    description:
      "Role-based content tiers with custom briefing personalities per desk.",
    features: [
      "Public / Analyst / Strategic tiers",
      "Custom briefing desks",
      "Role-based filtering",
      "Compartmentalized access",
    ],
    status: "planned",
    accentColor: "#ef4444",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const riskColor = (level: string) => {
  switch (level) {
    case "critical":
      return "var(--color-intel-red)";
    case "high":
      return "var(--color-intel-red)";
    case "moderate":
      return "var(--color-intel-orange)";
    default:
      return "var(--color-intel-green)";
  }
};

const confidenceLabel = (c: string) => {
  switch (c) {
    case "high":
      return { label: "High Confidence", color: "var(--color-intel-green)" };
    case "moderate":
      return { label: "Moderate", color: "var(--color-intel-orange)" };
    default:
      return { label: "Low", color: "var(--color-intel-red)" };
  }
};

const TrendArrow: React.FC<{
  direction: "up" | "down" | "stable";
  isRisk?: boolean;
}> = ({ direction, isRisk = true }) => {
  let color =
    direction === "stable"
      ? "var(--color-intel-orange)"
      : direction === "up"
        ? isRisk
          ? "var(--color-intel-red)"
          : "var(--color-intel-green)"
        : isRisk
          ? "var(--color-intel-green)"
          : "var(--color-intel-red)";
  let symbol = direction === "stable" ? "→" : direction === "up" ? "▲" : "▼";
  return <span style={{ color, fontFamily: "inherit" }}>{symbol}</span>;
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const LiveDot: React.FC = () => (
  <span
    className="inline-block w-2 h-2 rounded-full bg-intel-green shadow-[0_0_8px_rgba(50,215,75,0.5)] animate-pulse"
  />
);

const ConfidenceTag: React.FC<{ level: "high" | "moderate" | "low" }> = ({
  level,
}) => {
  const { label, color } = confidenceLabel(level);
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        borderRadius: 4,
        padding: "2px 7px",
        fontFamily: "var(--font-mono)",
      }}
    >
      {label}
    </span>
  );
};

const RiskBar: React.FC<{ percentage: number; level: string }> = ({
  percentage,
  level,
}) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), 80);
    return () => clearTimeout(t);
  }, [percentage]);
  return (
    <div
      style={{
        width: 80,
        height: 6,
        background: "rgba(148,163,184,0.1)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: riskColor(level),
          borderRadius: 3,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
};

// ─── PHASE NAV ────────────────────────────────────────────────────────────────

const PHASES = [
  { num: 1, label: "Text Briefing", active: true },
  { num: 2, label: "Visual Cards", active: true },
  { num: 3, label: "Live News Feed", active: true },
  { num: 4, label: "AI Voice", active: true },
  { num: 5, label: "Forecast", active: false },
  { num: 6, label: "Multi-Access", active: false },
];

const PhaseNav: React.FC<{
  activePhase: number;
  onPhaseChange: (p: number) => void;
}> = ({ activePhase, onPhaseChange }) => (
  <div
    className="flex gap-1 overflow-x-auto scrollbar-hide py-2 px-1"
  >
    {PHASES.map((p) => (
      <button
        key={p.num}
        disabled={!p.active}
        onClick={() => p.active && onPhaseChange(p.num)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-b-2 transition-all whitespace-nowrap font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider ${
          p.active && activePhase === p.num
            ? "bg-intel-cyan/10 border-intel-cyan text-intel-cyan"
            : p.active
              ? "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
              : "opacity-40 cursor-not-allowed border-transparent text-slate-600"
        }`}
      >
        {!p.active && <Lock className="w-3 h-3" />}
        <span>{p.label}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[8px] tracking-tight ${
            p.active ? "bg-intel-cyan text-intel-bg" : "bg-white/5 text-slate-500"
          }`}
        >
          {p.active ? "Active" : `P${p.num}`}
        </span>
      </button>
    ))}
  </div>
);

// ─── EXECUTIVE SUMMARY ────────────────────────────────────────────────────────

const ExecutiveSummary: React.FC<{ data: ExecutiveSummaryData }> = ({
  data,
}) => (
  <div
    className="bg-intel-card/50 backdrop-blur-sm rounded-xl border border-intel-border overflow-hidden relative"
  >
    {/* Left accent border */}
    <div
      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-intel-cyan to-intel-blue"
    />

    <div className="p-5 md:p-6 pl-7 md:pl-8">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-4"
      >
        <span
          className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-intel-cyan font-mono"
        >
          Executive Summary
        </span>
        <ConfidenceTag level={data.confidence} />
      </div>

      {/* Narrative */}
      <p
        className="text-sm md:text-base leading-relaxed text-slate-300 font-sans mb-5 ti-strong"
        dangerouslySetInnerHTML={{ __html: data.narrative }}
      />

      {/* Meta bar */}
      <div
        className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-white/5"
      >
        {[
          {
            dot: true,
            text: `${data.meta.signalSources} signal sources`,
          },
          { dot: false, text: `${data.meta.anomalousClusters} anomalous clusters` },
          {
            dot: false,
            text: `${(data.meta.monteCarloRuns / 1000).toFixed(0)}k MC simulations`,
          },
          {
            dot: false,
            text: `${data.meta.activeModels.length} active models`,
            tooltip: data.meta.activeModels.join(" · "),
          },
        ].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-[10px] text-slate-500 font-mono"
            title={item.tooltip}
          >
            {item.dot ? (
              <LiveDot />
            ) : (
              <span
                className="w-1.5 h-1.5 rounded-full bg-intel-cyan/40"
              />
            )}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// ─── RRI DASHBOARD ────────────────────────────────────────────────────────────

const RRICard: React.FC<{ metric: RRIMetric }> = ({ metric }) => {
  const [hovered, setHovered] = useState(false);
  const trendColor =
    metric.trend.direction === "stable"
      ? "var(--color-intel-orange)"
      : metric.trend.direction === "up"
        ? "var(--color-intel-red)"
        : "var(--color-intel-green)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-intel-card/50 backdrop-blur-sm rounded-xl border p-5 transition-all duration-300 ${
        hovered ? "border-intel-cyan/40 -translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]" : "border-intel-border"
      }`}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 font-mono mb-3"
      >
        {metric.label}
      </div>
      <div
        className="text-3xl font-black font-mono text-white leading-none mb-3"
      >
        {metric.value}
      </div>
      <div
        style={{ color: trendColor }}
        className="text-xs font-mono font-bold mb-1"
      >
        <TrendArrow direction={metric.trend.direction} /> {metric.trend.delta}
      </div>
      <div
        className="text-[10px] text-slate-600 font-sans uppercase tracking-wider"
      >
        {metric.context}
      </div>
    </div>
  );
};



// ─── SECTION CARDS ────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ section: BriefingSection }> = ({ section }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-intel-card/50 backdrop-blur-sm rounded-xl border transition-all duration-300 overflow-hidden flex flex-col ${
        hovered ? "border-intel-cyan/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)]" : "border-intel-border"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]"
      >
        <div
          className="flex items-center gap-2"
          style={{ color: section.accentColor }}
        >
          {section.icon}
          <span
            className="text-xs font-bold tracking-wider text-white font-sans uppercase"
          >
            {section.name}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold ${
            section.trend.direction === "up" ? "text-intel-red" : "text-intel-green"
          }`}
        >
          <TrendArrow direction={section.trend.direction} />{" "}
          {section.trend.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex-1">
        <p
          className="text-xs md:text-sm leading-relaxed text-slate-400 font-sans mb-4 ti-strong"
          dangerouslySetInnerHTML={{ __html: section.narrative }}
        />

        {/* Indicator tags */}
        <div className="flex flex-wrap gap-2">
          {section.indicators.map((ind, i) => {
            const tagColorClass =
              ind.severity === "high"
                ? "text-intel-red border-intel-red/30 bg-intel-red/10"
                : ind.severity === "moderate"
                  ? "text-intel-orange border-intel-orange/30 bg-intel-orange/10"
                  : "text-slate-500 border-white/10 bg-white/5";
            return (
              <span
                key={i}
                className={`text-[9px] font-bold tracking-tight uppercase border rounded px-2 py-0.5 font-mono ${tagColorClass}`}
              >
                {ind.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between p-3 px-5 border-t border-white/5 bg-black/20"
      >
        <span className="text-[10px] text-intel-cyan font-mono font-bold">
          {section.sourceCount}{" "}
          <span className="text-slate-600 font-normal">sources</span>
        </span>
        <ConfidenceTag level={section.confidence} />
      </div>
    </div>
  );
};

// ─── GOVERNORATE ALERTS ───────────────────────────────────────────────────────

const GovernorateAlertsPanel: React.FC<{ alerts: GovernorateAlert[] }> = ({ alerts }) => {
  const highCount = alerts.filter(
    (g) => g.riskLevel === "high" || g.riskLevel === "critical"
  ).length;

  return (
    <div
      className="bg-intel-card/50 backdrop-blur-sm rounded-xl border border-intel-border overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-intel-cyan" />
          <span
            className="text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase text-white font-mono"
          >
            Governorate Alert Matrix
          </span>
        </div>
        <span
          className="text-[10px] font-bold bg-intel-red/10 text-intel-red border border-intel-red/30 rounded px-2 py-0.5 font-mono"
        >
          {highCount} High Alerts
        </span>
      </div>
      <div>
        {alerts.map((gov, i) => (
          <GovernorateRow key={i} gov={gov} index={i} total={alerts.length} />
        ))}
      </div>
    </div>
  );
};

const GovernorateRow: React.FC<{
  gov: GovernorateAlert;
  index: number;
  total: number;
}> = ({ gov, index, total }) => {
  const [hovered, setHovered] = useState(false);
  const color = riskColor(gov.riskLevel);
  const trendColor =
    gov.trendDirection === "stable"
      ? "var(--color-intel-orange)"
      : gov.trendDirection === "up"
        ? "var(--color-intel-red)"
        : "var(--color-intel-green)";
  const trendSymbol =
    gov.trendDirection === "up" ? "▲" : gov.trendDirection === "down" ? "▼" : "→";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`grid grid-cols-[160px_1fr_130px_90px] items-center p-3 px-5 border-b transition-colors cursor-pointer gap-3 ${
        index < total - 1 ? "border-white/[0.03]" : "border-transparent"
      } ${hovered ? "bg-white/[0.03]" : "bg-transparent"}`}
    >
      {/* Name */}
      <div className="flex items-center gap-2">
        <span className="text-sm">🇹🇳</span>
        <span
          className="text-sm font-bold text-white font-sans"
        >
          {gov.name}
        </span>
      </div>

      {/* Description */}
      <span
        className="text-xs text-slate-500 font-sans truncate"
      >
        {gov.description}
      </span>

      {/* Risk bar + level */}
      <div className="flex items-center gap-3">
        <RiskBar percentage={gov.riskPercentage} level={gov.riskLevel} />
        <span
          className="text-[10px] font-bold font-mono min-w-[30px]"
          style={{ color }}
        >
          {gov.riskPercentage}%
        </span>
      </div>

      {/* Trend */}
      <div
        className="text-right text-xs font-mono font-bold"
        style={{ color: trendColor }}
      >
        {gov.trendDelta > 0 ? "+" : ""}
        {gov.trendDelta.toFixed(2)} {trendSymbol}
      </div>
    </div>
  );
};

// ─── PHASE PREVIEWS ───────────────────────────────────────────────────────────

const PhasePreviewCard: React.FC<{ preview: PhasePreview }> = ({ preview }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-intel-card/50 backdrop-blur-sm rounded-xl border p-5 transition-all duration-300 relative overflow-hidden ${
        hovered ? "border-white/20 opacity-100 -translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.3)]" : "border-intel-border opacity-70"
      }`}
      style={{ borderTop: `3px solid ${hovered ? preview.accentColor : `${preview.accentColor}50`}` }}
    >
      {/* Coming soon badge */}
      <span
        className="absolute top-3 right-3 text-[8px] font-bold tracking-[0.1em] uppercase bg-white/5 text-slate-500 border border-white/10 rounded px-1.5 py-0.5 font-mono"
      >
        Coming Soon
      </span>

      {/* Phase number */}
      <div
        className="text-4xl font-black font-mono text-white/5 leading-none mb-4"
      >
        {String(preview.phaseNumber).padStart(2, "0")}
      </div>

      <div
        className="text-sm font-bold text-white font-sans mb-2"
      >
        {preview.title}
      </div>
      <p
        className="text-[11px] text-slate-500 font-sans leading-relaxed mb-4"
      >
        {preview.description}
      </p>

      <div className="flex flex-col gap-1.5 mb-5">
        {preview.features.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-2"
          >
            <ChevronRight
              className="w-2.5 h-2.5"
              style={{ color: preview.accentColor }}
            />
            <span
              className="text-[10px] text-slate-400 font-sans"
            >
              {f}
            </span>
          </div>
        ))}
      </div>

      {/* Locked CTA */}
      <button
        disabled
        className="w-full p-2 border border-white/5 rounded-lg bg-white/5 text-slate-600 text-[10px] font-bold font-mono tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Lock className="w-3 h-3" />
        Locked
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const DailyBriefing: React.FC = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [tunisTime, setTunisTime] = useState("");

  const {
    rriState, fullData: data, rpiProfile,
    cognitiveEnvironment, seiResult
  } = useRiskMetrics();
  const { miiProfile, actorNetwork } = useAIAnalysis();

  const govAssessment = useMemo(() => {
    try {
      return assessGovernmentAgent(rriState, data, { miiProfile, actorNetwork, seiResult });
    } catch { return null; }
  }, [rriState, data, miiProfile, actorNetwork, seiResult]);

  const signalSummary = useMemo(() => {
    try {
      return buildSignalSummary(classifySignals([], rriState, data, govAssessment, 20));
    } catch { return null; }
  }, [rriState, data, govAssessment]);

  const brief = useMemo<IntelligenceBrief>(() => {
    const contradictionTexts: string[] = [];
    return generateIntelligenceBrief(
      rriState, data,
      { miiProfile, rpiProfile, cognitiveEnvironment, seiResult },
      contradictionTexts
    );
  }, [rriState, data, miiProfile, rpiProfile, cognitiveEnvironment, seiResult]);

  // ── Derived display data ──────────────────────────────────────────────────

  const executiveSummary: ExecutiveSummaryData = {
    narrative: brief.situation,
    confidence:
      brief.classification === 'ROUTINE' ? 'low' :
      brief.classification === 'ELEVATED' ? 'moderate' : 'high',
    meta: {
      signalSources: brief.keyDevelopments.length,
      anomalousClusters: signalSummary?.systemShocks ?? 0,
      monteCarloRuns: rriState?.simulations_run ?? 10000,
      activeModels: ['RRI Engine v2', `P_rev ${(brief.modelState.p_rev*100).toFixed(0)}%`, brief.modelState.miiPhase],
    },
  };

  const rriMetrics: RRIMetric[] = [
    {
      label: "Composite RRI",
      value: brief.modelState.rri.toFixed(2),
      trend: {
        direction:
          rriState?.velocity_label?.includes('DETERIORATING') ? 'up' :
          rriState?.velocity_label?.includes('IMPROVING') ? 'down' : 'stable',
        delta: `V=${brief.modelState.velocity}`,
        label: rriState?.velocity_label ?? 'Stable',
      },
      context: brief.classification === 'ROUTINE' ? 'Normal range' : 'Elevated stress band',
    },
    {
      label: "Revolution Probability",
      value: `${(brief.modelState.p_rev * 100).toFixed(1)}%`,
      trend: { direction: brief.modelState.p_rev > 0.5 ? 'up' : 'stable', delta: `P_rev`, label: `Threshold ${brief.modelState.p_rev > 0.5 ? 'breached' : 'stable'}` },
      context: `${brief.classification} classification`,
    },
    {
      label: "Cascade Probability",
      value: `${((rriState?.cascade_probability ?? 0) * 100).toFixed(0)}%`,
      trend: {
        direction: (rriState?.cascade_probability ?? 0) > 0.5 ? 'up' : 'stable',
        delta: `${((rriState?.cascade_probability ?? 0) * 100).toFixed(0)}%`,
        label: (rriState?.cascade_probability ?? 0) > 0.6 ? 'Critical' : 'Elevated',
      },
      context: 'EQ.17 regional cascade',
    },
    {
      label: "Salience Score",
      value: (rriState?.salience ?? 0).toFixed(2),
      trend: { direction: 'stable', delta: '→ EQ.3', label: 'Stable' },
      context: 'Media & narrative attention',
    },
  ];

  const briefSections: BriefingSection[] = [
    {
      id: "security",
      name: "Security",
      icon: <Shield className="w-4 h-4" />,
      accentColor: "#ef4444",
      trend: { direction: brief.classification === 'ROUTINE' ? 'down' : 'up', label: brief.classification },
      narrative: brief.assessment,
      indicators: brief.keyDevelopments.slice(0, 4).map(d => ({
        label: d.signal.slice(0, 36),
        severity: (d.severity === 'critical' || d.severity === 'high') ? 'high' as const : d.severity === 'medium' ? 'moderate' as const : null,
      })),
      sourceCount: brief.keyDevelopments.length,
      confidence: brief.classification === 'CRITICAL' || brief.classification === 'EMERGENCY' ? 'high' as const : 'moderate' as const,
    },
    {
      id: "economy",
      name: "Economy",
      icon: <TrendingUp className="w-4 h-4" />,
      accentColor: "#10b981",
      trend: { direction: data?.economy?.inflation && data.economy.inflation > 6 ? 'up' : 'stable', label: data?.economy?.inflation ? `${data.economy.inflation}% CPI` : 'Stable' },
      narrative: `Composite RRI at <strong>${brief.modelState.rri.toFixed(2)}</strong>, P_rev <strong>${(brief.modelState.p_rev*100).toFixed(0)}%</strong>. ` +
        `Inflation: <strong>${data?.economy?.inflation ?? '—'}%</strong>, FX reserves: <strong>${data?.economy?.fx_reserves ?? '—'} days</strong>, ` +
        `Unemployment: <strong>${data?.economy?.unemployment ?? '—'}%</strong>. ` +
        `Compound stress: <strong>${((rriState?.compound_stress ?? 0)*100).toFixed(0)}%</strong>.`,
      indicators: [
        ...(data?.economy?.inflation ? [{ label: `CPI ${data.economy.inflation}%`, severity: (data.economy.inflation > 7 ? 'high' as const : 'moderate' as const) }] : []),
        ...(data?.economy?.fx_reserves ? [{ label: `FX ${data.economy.fx_reserves}d`, severity: (data.economy.fx_reserves < 90 ? 'high' as const : 'moderate' as const) }] : []),
        { label: `RRI ${brief.modelState.rri.toFixed(2)}`, severity: brief.modelState.rri > 2.5 ? 'high' as const : brief.modelState.rri > 2.0 ? 'moderate' as const : null },
        { label: `${rriState?.threshold_breaches?.length ?? 0} breaches`, severity: (rriState?.threshold_breaches?.length ?? 0) > 3 ? 'high' as const : null },
      ],
      sourceCount: rriState?.threshold_breaches?.length ?? 0,
      confidence: 'high' as const,
    },
  ];

  const computeGovernorateAlerts = (): GovernorateAlert[] => {
    const cascade = rriState?.cascade_probability ?? 0.3;
    const velocity = rriState?.velocity ?? 0;
    const protestEvents = data?.social?.protest_events_30d ?? 10;

    const govList = GOV_PROFILES.slice(0, 8);
    return govList.map((g, i) => {
      const baseRisk = g.cascade_risk ?? 0.3;
      const protestBoost = Math.min(0.25, protestEvents * 0.01);
      const riskRaw = Math.min(1, baseRisk * (0.4 + cascade * 0.4 + velocity * 0.2) + protestBoost);
      const riskPct = Math.round(riskRaw * 100);
      return {
        name: g.name,
        description: riskPct > 60 ? 'Elevated cascade risk — monitor closely' :
                      riskPct > 40 ? 'Moderate stress indicators' :
                      'Stable baseline. Routine monitoring.',
        riskLevel: riskPct > 65 ? 'high' as const : riskPct > 40 ? 'moderate' as const : 'low' as const,
        riskPercentage: riskPct,
        trendDelta: parseFloat((velocity * (0.5 + g.cascade_risk * 0.5)).toFixed(2)),
        trendDirection: velocity > 0.05 ? 'up' as const : velocity < -0.05 ? 'down' as const : 'stable' as const,
      };
    });
  };

  const governorateAlerts = computeGovernorateAlerts();

  // Update time every minute
  useEffect(() => {
    const update = () => {
      const t = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Africa/Tunis",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTunisTime(t);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Tunis",
  });

  return (
    <>
      <style>{`
        .ti-strong strong {
          color: var(--color-intel-cyan);
          font-weight: 700;
        }
      `}</style>

      <div className="min-h-full pb-20">
        <ModuleHeader 
          title="Daily Intelligence Briefing" 
          subtitle="Real-time risk assessment & strategic overview" 
          icon={Radio}
          statusLabel="HYPER-SYNC ACTIVE"
          nodeId="BRIEF-NODE-01"
        />

        <div className="sticky top-0 z-10 bg-intel-bg/95 backdrop-blur-md border-b border-white/5 py-1 mb-8">
          <PhaseNav activePhase={activePhase} onPhaseChange={setActivePhase} />
        </div>

        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2 text-intel-cyan font-mono text-[10px] uppercase tracking-widest mb-1">
                <Radio className="w-3 h-3" />
                <span>Sector: Tunisia National</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">
                Executive Report
              </h1>
            </div>
            <div className="flex flex-col items-end font-mono text-[10px] text-slate-500">
              <span className="text-intel-cyan">{today}</span>
              <span>Morning Edition // Gen: {tunisTime} TUN</span>
            </div>
          </div>

          <div className="min-h-[400px]">
            {activePhase === 1 && (
              <div className="space-y-8">
                <div>
                  <ExecutiveSummary data={executiveSummary} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-red rounded-full" />
                    Critical Risk Indicators
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                    {rriMetrics.map((m, i) => (
                      <RRICard key={i} metric={m} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-cyan rounded-full" />
                    Intelligence Domain Breakdown
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {briefSections.map((s) => (
                      <SectionCard key={s.id} section={s} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePhase === 2 && (
              <div className="space-y-8">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-orange rounded-full" />
                    Regional Threat Matrix
                  </div>
                  <GovernorateAlertsPanel alerts={governorateAlerts} />
                </div>
              </div>
            )}

            {activePhase === 3 && (
              <div className="space-y-8">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-blue rounded-full animate-pulse" />
                    Live News Feed — Real-time Signal Monitoring
                  </div>
                  <NewsFeed hideBackground={true} />
                </div>
              </div>
            )}

            {activePhase === 4 && (
              <div className="space-y-8">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    Neural Voice Narration — Beta
                  </div>
                  <AIVoiceBriefing
                    briefingText={brief.situation}
                    metrics={{
                      rri: brief.modelState.rri,
                      pRev: brief.modelState.p_rev,
                      inflation: data?.economy?.inflation ?? 0,
                      fxReserves: data?.economy?.fx_reserves ?? 0,
                      unemployment: data?.economy?.unemployment ?? 0,
                      protestEvents: data?.social?.protest_events_30d ?? 0,
                      waterCrisisGovs: data?.social?.water_crisis_govs ?? 0,
                      imfProb: data?.geopolitical?.imf_deal_probability ?? 0,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-12">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-6 border-t border-white/5 pt-8">
              Development Roadmap — System Expansion
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PHASE_PREVIEWS.map((p) => (
                <PhasePreviewCard key={p.phaseNumber} preview={p} />
              ))}
            </div>
          </div>

          <footer className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-intel-cyan" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white font-mono uppercase tracking-widest">TunisiaIntel v2.0 // RRI ENGINE</span>
                <span className="text-[9px] text-slate-600 font-mono">System Integrity Verified · {today} · Hyper-Sync v4.1</span>
              </div>
            </div>
            <div className="flex gap-6">
              {["Methodology", "Sources", "API", "Export"].map((link) => (
                <button key={link} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-intel-cyan transition-colors font-mono">[{link}]</button>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default DailyBriefing;
