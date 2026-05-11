import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Lock,
  Mic,
  TrendingUp,
  Shield,
  Users,
  Leaf,
  MapPin,
  Radio,
  ChevronRight,
  Zap,
} from "lucide-react";
import { ModuleHeader } from "../shared/ProfessionalShared";
import { NewsFeed } from "../shared/NewsFeed";
import { AIVoiceBriefing } from "./AIVoiceBriefing";

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

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const EXECUTIVE_SUMMARY: ExecutiveSummaryData = {
  narrative: `Tunisia entered a <strong>higher social stress phase</strong> today following coordinated transport strikes in Sfax and Gabès, rising fuel scarcity reports across the interior, and renewed online criticism surrounding water cuts in Kairouan and Sidi Bouzid. <strong>The RRI composite index rose to 2.31 (+0.14)</strong>, driven primarily by society and environment vectors. While protest volume remains limited, the concentration of incidents in historically sensitive mining regions resembles early-stage escalation patterns observed in 2008. The dinar remains under pressure with <strong>parallel market spreads widening to 3.2%</strong>. Interior Ministry activity increased in Kasserine following localized demonstrations. Youth migration narratives surged across Tunisian Facebook pages, with sentiment analysis indicating a <strong>23% increase in negative framing</strong> over the past 72 hours.`,
  confidence: "high",
  meta: {
    signalSources: 47,
    anomalousClusters: 3,
    monteCarloRuns: 12000,
    activeModels: ["SIR coastal propagation", "EQ.17 cascade", "MII-phase-4"],
  },
};

const RRI_METRICS: RRIMetric[] = [
  {
    label: "Composite RRI",
    value: "2.31",
    trend: { direction: "up", delta: "+0.14 (24h)", label: "Accelerating" },
    context: "Elevated stress band",
  },
  {
    label: "RRI Velocity",
    value: "+0.14",
    trend: { direction: "up", delta: "↑ Accelerating", label: "Accelerating" },
    context: "Above historical mean",
  },
  {
    label: "Cascade Probability",
    value: "18.4%",
    trend: { direction: "up", delta: "+2.1% (24h)", label: "Rising" },
    context: "Coastal govs. at risk",
  },
  {
    label: "Salience Score",
    value: "0.67",
    trend: { direction: "stable", delta: "→ Stable", label: "Stable" },
    context: "High media attention",
  },
];

const SECTIONS: BriefingSection[] = [
  {
    id: "economy",
    name: "Economy",
    icon: <TrendingUp className="w-4 h-4" />,
    accentColor: "#10b981",
    trend: { direction: "up", label: "Deteriorating" },
    narrative: `The <strong>dinar remained under pressure</strong> as parallel market spreads widened to 3.2%, the highest level since January. Fuel scarcity reports intensified across Kasserine and Gafsa governorates, with queue lengths at distribution points increasing <strong>40% week-over-week</strong>. The Central Bank's foreign reserves coverage dropped to <strong>98 days of imports</strong>. Informal sector activity in border regions shows elevated smuggling indicators, particularly in contraband fuel and consumer goods.`,
    indicators: [
      { label: "Dinar Pressure", severity: "high" },
      { label: "FX 98 days", severity: "moderate" },
      { label: "Fuel Queues +40%", severity: "high" },
      { label: "Black Market Active", severity: null },
    ],
    sourceCount: 14,
    confidence: "high",
  },
  {
    id: "security",
    name: "Security",
    icon: <Shield className="w-4 h-4" />,
    accentColor: "#ef4444",
    trend: { direction: "up", label: "Elevated" },
    narrative: `<strong>Interior Ministry activity increased</strong> in Kasserine following localized demonstrations at the governorate headquarters. Security force deployment patterns show a <strong>15% increase in the interior regions</strong> compared to the 30-day baseline. Border monitoring detected unusual movement patterns in the <strong>Tataouine-Libya corridor</strong>. No significant terrorist incidents reported in the past 24 hours, but online radicalization chatter in closed Telegram channels showed a modest uptick in the south.`,
    indicators: [
      { label: "Kasserine Deployment ↑", severity: "high" },
      { label: "Border Anomaly", severity: "moderate" },
      { label: "Telegram Uptick", severity: "moderate" },
      { label: "No Terror Incidents", severity: null },
    ],
    sourceCount: 11,
    confidence: "moderate",
  },
  {
    id: "society",
    name: "Society",
    icon: <Users className="w-4 h-4" />,
    accentColor: "#8b5cf6",
    trend: { direction: "up", label: "Deteriorating" },
    narrative: `<strong>Youth migration narratives surged</strong> across Tunisian Facebook and TikTok content, with sentiment analysis indicating a <strong>23% increase in negative framing</strong> over 72 hours. Transport strikes in Sfax and Gabès entered their second day, with solidarity actions spreading to Mahdia. Online mobilization around water cuts in Kairouan generated <strong>4,200 new posts</strong> in 24 hours. The SIR protest spread model projects a <strong>34% probability of contagion</strong> to coastal governorates if strikes persist beyond 72 hours.`,
    indicators: [
      { label: "Strike Day 2", severity: "high" },
      { label: "SIR Contagion 34%", severity: "high" },
      { label: "4,200 Posts / 24h", severity: "moderate" },
      { label: "Migration Surge +23%", severity: null },
    ],
    sourceCount: 16,
    confidence: "high",
  },
  {
    id: "environment",
    name: "Environment",
    icon: <Leaf className="w-4 h-4" />,
    accentColor: "#f59e0b",
    trend: { direction: "up", label: "Worsening" },
    narrative: `<strong>Water stress indicators rose sharply</strong> in central governorates, with Kairouan reporting 14-hour daily cuts and Sidi Bouzid implementing rotational distribution. Reservoir levels at Sebkha Séjoumi dropped to <strong>32% capacity</strong>, 8 percentage points below the seasonal average. Agricultural stress is visible in satellite-derived vegetation indices for the Cap Bon peninsula. <strong>Heatwave conditions</strong> are forecast for the coming week, which may compound water access tensions in urban peripheries.`,
    indicators: [
      { label: "Kairouan 14h Cuts", severity: "high" },
      { label: "Reservoir 32%", severity: "moderate" },
      { label: "Heatwave Forecast", severity: "moderate" },
      { label: "Agri Stress Visible", severity: null },
    ],
    sourceCount: 9,
    confidence: "moderate",
  },
];

const GOVERNORATE_ALERTS: GovernorateAlert[] = [
  {
    name: "Sfax",
    description: "Transport strike Day 2. Port operations disrupted.",
    riskLevel: "high",
    riskPercentage: 78,
    trendDelta: 0.31,
    trendDirection: "up",
  },
  {
    name: "Kasserine",
    description: "Demonstrations at HQ. Interior Ministry deployment up.",
    riskLevel: "high",
    riskPercentage: 72,
    trendDelta: 0.24,
    trendDirection: "up",
  },
  {
    name: "Kairouan",
    description: "Water cuts 14h/day. Online mobilization surge.",
    riskLevel: "moderate",
    riskPercentage: 61,
    trendDelta: 0.19,
    trendDirection: "up",
  },
  {
    name: "Tataouine",
    description: "Border movement anomaly. Radicalization chatter uptick.",
    riskLevel: "moderate",
    riskPercentage: 54,
    trendDelta: 0.03,
    trendDirection: "stable",
  },
  {
    name: "Tunis",
    description: "Stable baseline. No anomalies detected.",
    riskLevel: "low",
    riskPercentage: 28,
    trendDelta: -0.02,
    trendDirection: "stable",
  },
  {
    name: "Sousse",
    description: "Tourism stable. No protest signals.",
    riskLevel: "low",
    riskPercentage: 22,
    trendDelta: 0.01,
    trendDirection: "stable",
  },
];

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

const RRIDashboard: React.FC = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 16,
    }}
  >
    {RRI_METRICS.map((m, i) => (
      <RRICard key={i} metric={m} />
    ))}
  </div>
);

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

const GovernorateAlertsPanel: React.FC = () => {
  const highCount = GOVERNORATE_ALERTS.filter(
    (g) => g.riskLevel === "high" || g.riskLevel === "critical"
  ).length;

  return (
    <div
      className="bg-intel-card/50 backdrop-blur-sm rounded-xl border border-intel-border overflow-hidden"
    >
      {/* Header */}
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

      {/* Rows */}
      <div>
        {GOVERNORATE_ALERTS.map((gov, i) => (
          <GovernorateRow key={i} gov={gov} index={i} total={GOVERNORATE_ALERTS.length} />
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
      {/* Dynamic styles */}
      <style>{`
        .ti-strong strong {
          color: var(--color-intel-cyan);
          font-weight: 700;
        }
      `}</style>

      <div className="min-h-full pb-20">
        {/* standard ModuleHeader */}
        <ModuleHeader 
          title="Daily Intelligence Briefing" 
          subtitle="Real-time risk assessment & strategic overview" 
          icon={Radio}
          statusLabel="HYPER-SYNC ACTIVE"
          nodeId="BRIEF-NODE-01"
        />

        {/* ── PHASE NAV ── */}
        <div
          className="sticky top-0 z-10 bg-intel-bg/95 backdrop-blur-md border-b border-white/5 py-1 mb-8"
        >
          <PhaseNav activePhase={activePhase} onPhaseChange={setActivePhase} />
        </div>

        {/* ── CONTENT ── */}
        <div className="space-y-10">
          {/* Briefing Date/Time info */}
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

          {/* ── TABS CONTENT ── */}
          <div className="min-h-[400px]">
            {activePhase === 1 && (
              <div className="space-y-8">
                {/* Executive Summary */}
                <div>
                  <ExecutiveSummary data={EXECUTIVE_SUMMARY} />
                </div>

                {/* RRI Dashboard */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-red rounded-full" />
                    Critical Risk Indicators
                  </div>
                  <RRIDashboard />
                </div>

                {/* Section Cards */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-cyan rounded-full" />
                    Intelligence Domain Breakdown
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SECTIONS.map((s) => (
                      <SectionCard key={s.id} section={s} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activePhase === 2 && (
              <div className="space-y-8">
                {/* Governorate Alert Matrix */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-intel-orange rounded-full" />
                    Regional Threat Matrix
                  </div>
                  <GovernorateAlertsPanel />
                </div>
              </div>
            )}

            {activePhase === 3 && (
              <div className="space-y-8">
                {/* Live News Feed */}
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
                {/* AI Voice Briefing */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 font-mono mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                    Neural Voice Narration — Beta
                  </div>
                  <AIVoiceBriefing />
                </div>
              </div>
            )}
          </div>

          {/* Roadmap */}
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

          {/* Footer */}
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
                <button
                  key={link}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-intel-cyan transition-colors font-mono"
                >
                  [{link}]
                </button>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default DailyBriefing;
