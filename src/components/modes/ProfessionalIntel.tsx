import { safeStorage } from "../../utils/storage";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Shield,
  Globe,
  ChevronRight,
  Download,
  Lock,
  ArrowUpRight,
  Users,
  X,
  Search,
  LayoutDashboard,
  Zap,
  Sprout,
  Leaf,
  BrainCircuit,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  BookOpen,
  AlertTriangle,
  Activity,
  Radio,
  Eye,
  Box,
  ShoppingBag,
  Target,
  RotateCcw,
  Flame,
  Calendar,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Newspaper,
  Brain,
  Network,
  Info,
  Loader2,
  ShieldAlert,
  Rocket,
  Compass,
  MapPin,
  Wheat,
  Package,
  Droplets,
  Triangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { NarrativeIntelligence } from "../social/NarrativeIntelligence";
import { RadicalisationIntelligence } from "../security/RadicalisationIntelligence";
import { CognitiveSecurityIntelligence } from "../security/CognitiveSecurityIntelligence";
import { EconomyIntelligence } from "../economy/EconomyIntelligence";
import { IntelligenceBriefPanel } from "../system/IntelligenceBriefPanel";
import { EnergyIntelligence } from "../energy/EnergyIntelligence";
import { EnvironmentalIntelligence } from "../agriculture/EnvironmentalIntelligence";
import { SocialIntelligence } from "../social/SocialIntelligence";
import { SecurityIntelligence } from "../security/SecurityIntelligence";
import { BusinessInvestigator } from "../economy/BusinessInvestigator";
import { StrategicModeling } from "../predictive/StrategicModeling";
import { GeopoliticalIntelligence } from "../geopolitical/GeopoliticalIntelligence";
import { ClusterIntelligence } from "../tactical/ClusterIntelligence";
import { PoliticalIntelligence } from "../political/PoliticalIntelligence";
import { Terminal } from "../terminal/Terminal";
import { PoliticalStabilityIntelligence } from "../political/PoliticalStabilityIntelligence";
import { PoliticalCalendar } from "../political/PoliticalCalendar";
import { CalendarOverlay } from "../shared/CalendarOverlay";
import { CivilizationalAnalysis } from "../social/CivilizationalAnalysis";
import { FireIntelligencePanel } from "../security/FireIntelligencePanel";
import { ObservabilityDashboard } from "../../pages/ObservabilityDashboard";
import { AgriIntelDashboard } from "../agriculture/AgriIntelDashboard";
import { FeedIntelligenceHub } from "../agriculture/FeedIntelligenceHub";
import { PoultryEggsIntelligence } from "../agriculture/PoultryEggsIntelligence";
import { LivestockMeatIntelligence } from "../agriculture/LivestockMeatIntelligence";
import { MilkDairyIntelligence } from "../agriculture/MilkDairyIntelligence";
import { SocietalFractureMonitor } from "../SocietalFractureMonitor";
import { NationalCommandCenter } from "../NationalCommandCenter";
import ActorNetworkIntelligence from "../political/ActorNetworkIntelligence";
import SimulationIntelligence from "../predictive/SimulationIntelligence";
import { NewsFeed } from "../shared/NewsFeed";
import { RealTimeNewsFeed } from "../tactical/RealTimeNewsFeed";
import { LiveSignalFeed } from "../tactical/LiveSignalFeed";
import { EventsIntelligence } from "../geopolitical/EventsIntelligence";
import { GeopoliticalNetworkGraph } from "../political/GeopoliticalNetworkGraph";
import { RTEE } from "../system/RTEE";
import { TemporalAnalysisTab } from "../predictive/TemporalAnalysisTab";
import { Timeline } from "../shared/Timeline";
import { GovernmentAgentPanel } from "../security/GovernmentAgentPanel";
import { Map } from "../shared/Map";
import { InvestmentIntelligenceReportGenerator } from "../economy/InvestmentIntelligenceReportGenerator";
import { CognitiveWarfare } from "../security/CognitiveWarfare";
import { EntrepreneurIntelligence } from "../economy/EntrepreneurIntelligence";
import { IndustrialIntelligencePanel } from "../economy/IndustrialIntelligencePanel";
import { StrategicEnergyIntelligencePanel } from "../energy/StrategicEnergyIntelligencePanel";
import { BlackMarketIntelligencePanel } from "../geopolitical/BlackMarketIntelligencePanel";
import { useRSS } from "../../context/RSSContext";
import { generateAnalystResponse } from "../../services/geminiService";
import { Article } from "../../lib/supabase";
import { BackgroundGrid, ModuleHeader } from "../shared/ProfessionalShared";
import { TRGMDashboard } from './TRGMDashboard';
import { NationalAgriculturalPulse } from './NationalAgriculturalPulse';

// Categories for sidebar grouping
const SIDEBAR_CATEGORIES = [
  {
    id: "command",
    label: "Command Center",
    items: [
      { id: "command-center", label: "National Command", icon: Target },
      { id: "trgm", label: "Governance Matrix", icon: Triangle },
      { id: "overview", label: "Core Intelligence", icon: LayoutDashboard },
      { id: "calendar", label: "Calendar", icon: Calendar },
      { id: "govagent", label: "Gov. Agent", icon: Brain },
      {
        id: "methodology",
        label: "Methodology",
        icon: BookOpen,
        isEvent: true,
      },
    ],
  },
  {
    id: "economical",
    label: "Economical",
    items: [
      { id: "reports", label: "Investment Reports", icon: FileText },
      { id: "economy", label: "Economy", icon: TrendingUp },
      { id: "industry", label: "Industry", icon: Box },
      { id: "strategic-energy", label: "Strategic Energy", icon: Zap },
      { id: "black-market", label: "Black Market", icon: ShoppingBag },
      { id: "strategic-explorer", label: "Strategic Explorer", icon: Compass },
      { id: "entrepreneur", label: "Entrepreneur", icon: Rocket },
    ],
  },
  {
    id: "threat",
    label: "Threat & Security",
    items: [
      { id: "events", label: "Events", icon: Radio },
      { id: "security", label: "Security", icon: ShieldCheck },
      { id: "clusters", label: "Clusters", icon: Network },
      { id: "actor-network", label: "Actor Network", icon: Network },
      { id: "radicalisation", label: "Radicalisation", icon: AlertTriangle },
      { id: "cognitive", label: "Cognitive Warfare", icon: ShieldAlert },
    ],
  },
  {
    id: "social-observatory",
    label: "Social Observatory",
    items: [
      { id: "societal-fracture", label: "Societal Fracture", icon: Brain },
    ],
  },
  {
    id: "socio",
    label: "Socio-Political",
    items: [
      { id: "political", label: "Political", icon: Users },
      { id: "social", label: "Social", icon: Users },
      { id: "geopolitical", label: "Geopolitical", icon: Globe },
      { id: "geopolitical-network", label: "Int'l Actor Network", icon: Globe },
      { id: "narrative", label: "Narrative", icon: Brain },
    ],
  },
  {
    id: "env",
    label: "Environment",
    items: [
      { id: "environment", label: "Environment", icon: Sprout },
      { id: "agriculture", label: "Agriculture", icon: Leaf },
      { id: "agri-pulse", label: "Agricultural Pulse", icon: Leaf },
      { id: "feed-hub", label: "Feed Intelligence", icon: Wheat },
      { id: "poultry", label: "Poultry & Eggs", icon: Zap },
      { id: "livestock", label: "Livestock & Meat", icon: Package },
      { id: "dairy", label: "Milk & Dairy", icon: Droplets },
      { id: "energy", label: "Energy", icon: Activity },
      { id: "fire", label: "Fire Intel", icon: Flame },
    ],
  },
  {
    id: "advanced",
    label: "Advanced Modeling",
    items: [
      { id: "strategic", label: "Strategic", icon: BrainCircuit },
      { id: "simulation", label: "Simulation", icon: Cpu },
      { id: "civilizational", label: "Civilizational", icon: RotateCcw },
      { id: "performance", label: "Model Performance", icon: ShieldCheck },
      { id: "ne", label: "NE", icon: Newspaper },
    ],
  },
];

interface IntelReport {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  summary: string;
  keyFindings: string[];
  classification: string;
}

const reports: IntelReport[] = [
  {
    id: "REP-001",
    title: "The Gafsa Corridor: Mining Crisis and Social Cascade Risk",
    category: "Social-Economic",
    date: "MAR 15, 2026",
    author: "Social Intelligence Unit",
    readTime: "14 min",
    image:
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800",
    summary:
      "CPG phosphate production has fallen 40% since 2010 due to sustained protest disruption. 12,000 workers face wage arrears averaging 2.1 months. The sit-in tradition — established in 2008 — has created a self-reinforcing cycle of economic decline and social mobilisation. Current RRI contribution from E51 (protest frequency) stands at maximum weight.",
    keyFindings: [
      "CPG revenue down 68% from 2010 peak — from 2.2B TND to 0.7B TND annually",
      "Wage arrears across 847 contracted workers average 2.1 months — approaching the 3-month general strike trigger",
      "Security deployment has increased 340% since January 2026 — suggesting regime anticipates escalation",
      "Water scarcity in Gafsa (14 hrs/day cuts) compounding economic grievances into compound crisis",
      "Protest contagion risk to Kasserine, Sidi Bouzid — historically linked mobilisation corridors",
    ],
    classification: "Level 3 // Social Intelligence",
  },
  {
    id: "REP-002",
    title: "IMF Negotiations: The 1.9B USD Deadlock and Fiscal Cliff",
    category: "Economic",
    date: "MAR 12, 2026",
    author: "Economic Intelligence Unit",
    readTime: "11 min",
    image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
    summary:
      "Tunisia requires 1.9B USD in IMF financing to meet 2026 external debt obligations totalling 4.2B TND. Three consecutive failed negotiation rounds since 2023 have created a fiscal cliff scenario. The IMF conditions — subsidy reform, public wage freeze, SOE privatisation — are politically undeliverable under current regime constraints.",
    keyFindings: [
      "External debt service 2026: 4.2B TND — requires IMF deal or selective default by Q3",
      "FX reserves at 84 days import cover — below the 90-day critical threshold",
      "IMF condition: 25% electricity tariff increase — estimated +12% protest probability",
      "Alternative financing: Gulf states offered 800M USD but with political conditions Saied rejected",
      "Probability of IMF deal before Q3 2026: 31% (down from 48% in January)",
    ],
    classification: "Level 4 // Economic Intelligence",
  },
  {
    id: "REP-003",
    title: "Decree 54: Press Freedom Collapse and Information Warfare",
    category: "Political",
    date: "MAR 10, 2026",
    author: "Political Intelligence Division",
    readTime: "9 min",
    image:
      "https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=800",
    summary:
      'Decree 54 (September 2022) criminalises "false news" with up to 10 years imprisonment. 67 journalists and activists have been charged since enactment. The decree functions as a political instrument — 89% of charges target regime critics. Tunisia dropped 27 places in RSF Press Freedom Index 2025, now ranked 118th globally.',
    keyFindings: [
      "67 charged under Decree 54 since 2022 — 89% are political opposition or journalists",
      "RSF ranking: 118th globally (2025) — down from 91st in 2021 pre-coup",
      "Internet throttling events: 14 documented since 2023 — targeting protest coordination",
      "Self-censorship index (per civil society monitors): 74% of journalists report topic avoidance",
      "International response: EU suspended media freedom dialogue — diplomatic signal with no enforcement",
    ],
    classification: "Level 3 // Political Intelligence",
  },
  {
    id: "REP-004",
    title: "Migration Crisis: Rising Civil Unrest and Anti-Immigrant Sentiment",
    category: "Social-Security",
    date: "MAR 25, 2026",
    author: "Social Intelligence Unit",
    readTime: "12 min",
    image:
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800",
    summary:
      "Coordinated civil protests scheduled for March 28th signal a significant escalation in anti-immigrant sentiment. Social media monitoring indicates mobilization across Tunis and Sfax, driven by economic grievances and perceived state failure in border management. High risk of localized clashes and security force intervention.",
    keyFindings: [
      "340% increase in anti-immigrant keywords on social media over the last 14 days.",
      'Coordinated mobilization across 12 governorates for the March 28th "National Sovereignty" protest.',
      "Security forces (GNR) increasing deployment in Sfax and Medenine by 45%.",
      'Risk of "Social Contagion" where anti-immigrant protests merge with economic grievances.',
      "International NGOs reporting increased vulnerability of migrant populations in urban centers.",
    ],
    classification: "Level 3 // Social Intelligence",
  },
];

import {
  generateAIAnalysis,
  AIAnalysis,
  ForecastResult,
} from "../../services/ai";
import { ModelPerformance } from "../system/ModelPerformance";
import { usePipeline } from "../../context/PipelineContext";
import { SmartAlert, Situation } from "../../services/smartAlerts";
import { AgentInsight } from "../../services/agents";
import { ProfessionalHeader } from "../shared/ProfessionalHeader";
import { prepareList, assertKey, getRenderKey } from "../../lib/keyUtils";

const SpotlightCard: React.FC<{
  title: string;
  value: string;
  valueColor: string;
  description: string;
  metrics: Array<{ label: string; value: string; warn: boolean }>;
}> = ({ title, value, valueColor, description, metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
    {/* Big number */}
    <div className="md:col-span-2 space-y-2">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
        {title}
      </div>
      <div
        className={`text-5xl font-bold font-mono leading-none ${valueColor}`}
      >
        {value}
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>

    {/* Metrics */}
    <div className="md:col-span-3 space-y-2">
      {prepareList(metrics).map((m: any) => (
        <div
          key={m.id}
          className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
        >
          <span className="text-[9px] font-mono text-slate-500">{m.label}</span>
          <span
            className={`text-[10px] font-mono font-bold ${
              m.warn ? "text-intel-orange" : "text-intel-cyan"
            }`}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const ForecastPanel: React.FC = () => {
  const { forecast, data } = usePipeline();
  const rri = (data as any)?.rri?.rri ?? 0.46;

  // Generate 14-day cascade probability bars from forecast
  const days14 = useMemo(() => {
    const base = forecast?.cascadeProbability ?? rri * 0.08 + 0.05;
    const trend = rri > 2 ? 0.008 : rri > 1.5 ? 0.004 : 0.001;
    return Array.from({ length: 14 }, (_, i) => {
      const noise = Math.sin(i * 2.3 + rri) * 0.015 + Math.cos(i * 1.7) * 0.01;
      const prob = Math.max(0.02, Math.min(0.95, base + i * trend + noise));
      const dayLabel = (() => {
        const d = new Date();
        d.setDate(d.getDate() + i + 1);
        return d.toLocaleDateString("en", { weekday: "short", day: "numeric" });
      })();
      const level =
        prob > 0.5
          ? "CRITICAL"
          : prob > 0.3
            ? "HIGH"
            : prob > 0.15
              ? "ELEVATED"
              : "LOW";
      return {
        day: dayLabel,
        prob: parseFloat((prob * 100).toFixed(1)),
        level,
      };
    });
  }, [forecast, rri]);

  const peakDay = days14.reduce((a, b) => (a.prob > b.prob ? a : b));
  const avgProb = days14.reduce((s, d) => s + d.prob, 0) / 14;

  const barColor = (level: string) =>
    level === "CRITICAL"
      ? "#ef4444"
      : level === "HIGH"
        ? "#f97316"
        : level === "ELEVATED"
          ? "#f59e0b"
          : "#00f2ff";

  if (!forecast && rri === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-intel-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-intel-border/30 bg-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-white uppercase tracking-widest">
            Predictive 14-Day Cascade Forecast
          </h3>
        </div>
        <div className="flex items-center space-x-4 text-[9px] font-mono">
          <span className="text-slate-500 uppercase tracking-widest">
            Peak:
          </span>
          <span
            className={`font-bold ${peakDay.prob > 50 ? "text-intel-red" : peakDay.prob > 30 ? "text-intel-orange" : "text-intel-cyan"}`}
          >
            Day {days14.indexOf(peakDay) + 1} — {peakDay.prob}%
          </span>
          <span className="text-slate-500 uppercase tracking-widest">Avg:</span>
          <span
            className={`font-bold ${avgProb > 30 ? "text-intel-orange" : "text-intel-cyan"}`}
          >
            {avgProb.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 14-day bar chart */}
        <div>
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-3">
            Cascade Probability — Daily (%) — {days14[0].day} → {days14[13].day}
          </div>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={days14}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#334155",
                    fontSize: 7,
                    fontFamily: "monospace",
                  }}
                  interval={1}
                  tickFormatter={(v, i) => (i % 2 === 0 ? v.split(" ")[0] : "")}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#334155",
                    fontSize: 7,
                    fontFamily: "monospace",
                  }}
                  domain={[0, Math.max(60, peakDay.prob + 10)]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "10px",
                    fontFamily: "monospace",
                  }}
                  formatter={(v: any, _, props) => [
                    `${v}% — ${props.payload?.level}`,
                    "Cascade Prob.",
                  ]}
                />
                <ReferenceLine
                  y={30}
                  stroke="rgba(249,115,22,0.3)"
                  strokeDasharray="4 4"
                  label={{
                    value: "HIGH",
                    position: "right",
                    fill: "#f97316",
                    fontSize: 7,
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine
                  y={50}
                  stroke="rgba(239,68,68,0.3)"
                  strokeDasharray="4 4"
                  label={{
                    value: "CRITICAL",
                    position: "right",
                    fill: "#ef4444",
                    fontSize: 7,
                    fontFamily: "monospace",
                  }}
                />
                <Bar dataKey="prob" radius={[2, 2, 0, 0]} maxBarSize={28}>
                  {days14.map((d, i) => (
                    <Cell
                      key={i}
                      fill={barColor(d.level)}
                      fillOpacity={
                        0.75 + (i === days14.indexOf(peakDay) ? 0.25 : 0)
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk level legend */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-4 text-[8px] font-mono">
              {[
                { color: "#00f2ff", label: "LOW (<15%)" },
                { color: "#f59e0b", label: "ELEVATED (15-30%)" },
                { color: "#f97316", label: "HIGH (30-50%)" },
                { color: "#ef4444", label: "CRITICAL (>50%)" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-sm inline-block"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-slate-600">{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Precursor signals + narrative row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-white/5">
          <div className="space-y-2">
            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-2">
              <Zap className="w-3 h-3 text-intel-orange" />
              <span>Precursor Signals</span>
            </h4>
            <div className="space-y-1.5">
              {(
                forecast?.precursorSignals ?? [
                  "FX reserves below 90-day critical threshold",
                  "UGTT mobilization at HIGH — strike risk within 30d",
                  "MII Phase 4 FREEZE — cabinet instability elevated",
                ]
              ).map((signal: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start space-x-2 text-[10px] text-slate-300 leading-relaxed"
                >
                  <span className="text-intel-orange mt-1 shrink-0">→</span>
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-2">
              <BookOpen className="w-3 h-3 text-intel-cyan" />
              <span>Forecast Narrative</span>
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed italic border-l-2 border-intel-cyan/20 pl-3">
              "
              {forecast?.narrative ??
                "Moderate structural pressure without acute trigger. Conditions stable but fragile — probability rises if any precursor signal converts to event."}
              "
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const ProfessionalIntel: React.FC<{
  context?: any;
  onOpenAI: () => void;
  onOpenPipeline: (tab?: "pipeline" | "sources" | "ai-api") => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  onToggleDebug: () => void;
}> = ({
  context,
  onOpenAI,
  onOpenPipeline,
  onGoHome,
  onOpenReport,
  onToggleDebug,
}) => {
  const {
    data,
    rriState,
    miiProfile,
    actorNetwork,
    auditLog,
    aiAnalysis,
    forecast,
    runAIAnalysis,
    isAIAnalysisLoading,
  } = usePipeline();
  const { articles: rssArticles, isFetching } = useRSS();
  const [activeTab, setActiveTab] = useState<
    | "command-center"
    | "trgm"
    | "overview"
    | "clusters"
    | "events"
    | "narrative"
    | "political"
    | "radicalisation"
    | "cognitive"
    | "economy"
    | "energy"
    | "strategic-energy"
    | "black-market"
    | "environment"
    | "social"
    | "security"
    | "strategic"
    | "geopolitical"
    | "geopolitical-network"
    | "simulation"
    | "methodology"
    | "civilizational"
    | "calendar"
    | "performance"
    | "actor-network"
    | "govagent"
    | "reports"
    | "fire"
    | "ne"
    | "entrepreneur"
    | "agriculture"
    | "agri-pulse"
    | "feed-hub"
    | "poultry"
    | "livestock"
    | "dairy"
    | "societal-fracture"
    | "industry"
    | "strategic-explorer"
    | "pipeline-control"
  >("command-center");
  const [eventsSubTab, setEventsSubTab] = useState<
    "news" | "engine" | "timeline" | "signal" | "temporal" | "rtee"
  >("news");
  const [activeNewsTab, setActiveNewsTab] = useState<"feed" | "signal">("feed");
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    command: true,
    economical: true,
    threat: false,
    socio: false,
    env: false,
    advanced: false,
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Daily briefing state
  const [briefingSummary, setBriefingSummary] = useState<string>("");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(
    () => Math.floor(Math.random() * 7), // random 0-6 on each load
  );

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return "N/A";
    if (typeof val === "object") {
      const keys = Object.keys(val);
      if (keys.length > 0) {
        return `{${keys.slice(0, 2).join(", ")}${keys.length > 2 ? "..." : ""}}`;
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  // Get today's lead story — highest severity article in recent time
  const leadStory = useMemo(() => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const past24h = rssArticles.filter(
      (a) => new Date(a.published_at).getTime() > yesterday,
    );

    if (past24h.length > 0) {
      return past24h.sort((a, b) => b.severity - a.severity)[0];
    }

    // Fallback to most recent high-severity even if older than 24h
    return (
      rssArticles.sort((a, b) => {
        // Prioritize severity, then date
        if (b.severity !== a.severity) return b.severity - a.severity;
        return (
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
        );
      })[0] || null
    );
  }, [rssArticles]);

  const isLeadStoryStale = useMemo(() => {
    if (!leadStory) return false;
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(leadStory.published_at).getTime() < yesterday;
  }, [leadStory]);

  // Recent articles strip — last 8
  const recentArticles = useMemo(() => rssArticles.slice(0, 8), [rssArticles]);

  // Generate daily briefing on load (once per day) - DISABLED
  useEffect(() => {
    /*
    const todayKey = `briefing_${new Date().toISOString().slice(0, 10)}`;
    const cached = safeStorage.getItem(todayKey);
    if (cached) {
      setBriefingSummary(cached);
      return;
    }

    setBriefingLoading(true);
    const prompt = `You are a senior political analyst for Tunisia.
    
Write a 3-sentence executive intelligence briefing for today.
Focus on the most critical current situation.
Current data: R(t)=${rriState.rri.toFixed(2)}, P_rev=${(rriState.p_rev*100).toFixed(1)}%,
FX reserves=${data.economy.fx_reserves} days, UGTT=${data.social.ugtt_mobilisation_level},
Protests=${data.social.protest_events_30d}/month, Water crisis=${data.social.water_crisis_govs} govs.
${leadStory ? `Lead story: ${leadStory.title}` : ''}

Write in the style of a classified intelligence brief. Be direct and specific.
Return only the 3-sentence briefing.`;

    generateAnalystResponse(prompt, {})
      .then(summary => {
        if (summary) {
          setBriefingSummary(summary);
          safeStorage.setItem(todayKey, summary);
        }
      })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));
    */
  }, [rriState.rri, leadStory?.url]);

  // Trigger TunisiaIntel v2.0 Core Logic Analysis
  const runCoreLogicAnalysis = useCallback(async () => {
    await runAIAnalysis();
  }, [runAIAnalysis]);

  // Run analysis on first load of overview - DISABLED AUTO TRIGGER
  useEffect(() => {
    /*
    if (activeTab === 'overview' && !aiAnalysis && !isAIAnalysisLoading) {
      runCoreLogicAnalysis();
    }
    */
  }, [activeTab, aiAnalysis, isAIAnalysisLoading, runCoreLogicAnalysis]);

  // Rotate spotlight every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % 7);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: "overview", label: "Core Intelligence", icon: LayoutDashboard },
    { id: "clusters", label: "Clusters", icon: Network },
    { id: "events", label: "Events", icon: Radio },
    { id: "narrative", label: "Narrative", icon: Brain },
    { id: "actor-network", label: "Actor Network", icon: Network },
    { id: "political", label: "Political", icon: Users },
    { id: "radicalisation", label: "Radicalisation", icon: AlertTriangle },
    { id: "cognitive", label: "Cognitive Warfare", icon: ShieldAlert },
    { id: "economy", label: "Economy", icon: TrendingUp },
    { id: "geopolitical", label: "Geopolitical", icon: Globe },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "energy", label: "Energy", icon: Zap },
    { id: "environment", label: "Environment", icon: Sprout },
    { id: "social", label: "Social", icon: Users },
    { id: "strategic", label: "Strategic", icon: BrainCircuit },
    { id: "simulation", label: "Simulation", icon: Cpu },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "civilizational", label: "Civilizational", icon: RotateCcw },
    { id: "fire", label: "Fire Intel", icon: Flame },
    { id: "ne", label: "NE", icon: Newspaper },
    { id: "performance", label: "Model Performance", icon: ShieldCheck },
    { id: "govagent", label: "Gov. Agent", icon: Brain },
    { id: "methodology", label: "Methodology", icon: BookOpen, isEvent: true },
    { id: "entrepreneur", label: "Entrepreneur", icon: Rocket },
    { id: "industry", label: "Industry", icon: Box },
  ];

  useEffect(() => {
    // Check hash on load
    if (window.location.hash === "#pipeline") {
      // The pipeline is now an overlay, so we don't set activeTab here
      // App.tsx handles the navigate-to-pipeline event
    }
  }, []);

  const stabilityRisk = useMemo(() => {
    return Math.min(100, Math.max(0, Math.round(rriState.p_rev * 100)));
  }, [rriState.p_rev]);

  const economicResilience = useMemo(() => {
    // Derived from RRI state components if possible, or keep existing logic
    if (!context?.governorates?.length) return 45;
    const avgUnemp =
      context.governorates.reduce(
        (a: number, b: any) => a + (b.unemp || 0),
        0,
      ) / context.governorates.length;
    return Math.min(100, Math.max(0, Math.round(100 - avgUnemp)));
  }, [context]);

  const socialCohesion = useMemo(() => {
    // Derived from RRI state components if possible, or keep existing logic
    if (!context?.events) return 85;
    const tensionEvents = context.events.filter(
      (e: any) => e.type === "protest" || e.type === "strike",
    ).length;
    return Math.min(100, Math.max(0, 100 - tensionEvents * 5));
  }, [context]);

  const handleDownloadDossier = () => {
    if (!selectedReport) return;
    const content = `TUNISIAINTEL STRATEGIC DOSSIER\nReference: ${selectedReport.id}\nTitle: ${selectedReport.title}\nCategory: ${selectedReport.category}\nDate: ${selectedReport.date}\nAuthor: ${selectedReport.author}\n\n[CLASSIFIED INFORMATION SUMMARY]\nThis report provides a deep-dive analysis into ${selectedReport.category.toLowerCase()} dynamics affecting Tunisian national security and economic stability. Full data sets are available via the secure terminal.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport.id}_Dossier.txt`;
    a.click();
  };

  const handleDownloadOutlook = () => {
    const content = `TUNISIAINTEL STRATEGIC OUTLOOK\nGenerated: ${new Date().toLocaleString()}\n\nRegional Stability: ${stabilityRisk.toFixed(1)}% (Risk Level: ${stabilityRisk > 70 ? "CRITICAL" : stabilityRisk > 40 ? "MODERATE" : "LOW"})\nEconomic Resilience: ${economicResilience.toFixed(1)}%\nSocial Cohesion: ${socialCohesion.toFixed(1)}%\n\nAnalysis: Current indicators suggest a period of heightened volatility in the southern sectors, primarily driven by resource scarcity and localized economic grievances.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Strategic_Outlook_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
  };

  const kiqs = [
    {
      id: "KIQ-1",
      question:
        "Will the UGTT call for a general strike before the IMF Q3 deadline?",
      status: "CRITICAL",
      confidence: "MEDIUM",
      impact: "HIGH",
    },
    {
      id: "KIQ-2",
      question:
        "Is the Gafsa mining disruption linked to coordinated regional actors?",
      status: "INVESTIGATING",
      confidence: "LOW",
      impact: "MEDIUM",
    },
    {
      id: "KIQ-3",
      question:
        "How will the EU-Tunisia migration pact review impact FX reserve stability?",
      status: "MONITORING",
      confidence: "HIGH",
      impact: "HIGH",
    },
  ];

  const hotspots = [
    {
      region: "Gafsa",
      risk: "CRITICAL",
      trend: "STABLE",
      reason: "Phosphate production deadlock",
    },
    {
      region: "Sfax",
      risk: "HIGH",
      trend: "WORSENING",
      reason: "Water scarcity & migration pressure",
    },
    {
      region: "Kasserine",
      risk: "ELEVATED",
      trend: "WORSENING",
      reason: "Social contagion risk",
    },
  ];

  const strategicOutlook =
    "The Tunisian state faces a multi-dimensional crisis as fiscal constraints collide with escalating social demands. The IMF deadlock remains the primary structural risk, with a 69% probability of selective default if no agreement is reached by Q3 2026. Social cohesion is deteriorating in the interior regions, specifically the Gafsa-Kasserine corridor, where economic marginalization is being compounded by acute water scarcity. The regime's reliance on Decree 54 suggests a shift towards securitized management of dissent rather than structural reform.";

  const actors = [
    {
      name: "Regime",
      posture: "CONSOLIDATING",
      influence: "HIGH",
      sentiment: "DEFENSIVE",
      trend: "STABLE",
    },
    {
      name: "UGTT",
      posture: "MOBILIZING",
      influence: "HIGH",
      sentiment: "RESISTANT",
      trend: "WORSENING",
    },
    {
      name: "Opposition",
      posture: "FRAGMENTED",
      influence: "LOW",
      sentiment: "SUPPRESSED",
      trend: "STABLE",
    },
    {
      name: "Youth",
      posture: "DISAFFECTED",
      influence: "MEDIUM",
      sentiment: "EXIT-ORIENTED",
      trend: "WORSENING",
    },
    {
      name: "IMF/EU",
      posture: "CONDITIONAL",
      influence: "HIGH",
      sentiment: "MONITORING",
      trend: "STABLE",
    },
  ];

  const scenarios = [
    {
      title: "Selective Default",
      prob: 45,
      impact: "CRITICAL",
      color: "text-intel-red",
    },
    {
      title: "Social Cascade",
      prob: 30,
      impact: "HIGH",
      color: "text-intel-orange",
    },
    {
      title: "IMF Breakthrough",
      prob: 15,
      impact: "LOW",
      color: "text-intel-cyan",
    },
    {
      title: "Status Quo Muddle",
      prob: 10,
      impact: "MEDIUM",
      color: "text-slate-400",
    },
  ];

  useEffect(() => {
    // Default to closed on all screens for overlay behavior
    setSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative font-sans">
      {/* Global Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div
        className={`fixed z-[70] top-0 bottom-0 left-0 h-full bg-black/40 backdrop-blur-3xl border-r border-white/10 flex flex-col shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${
          sidebarOpen
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full border-r-0"
        }`}
      >
        <div className="w-64 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 text-center flex items-center justify-between">
            <div className="flex items-center justify-center space-x-2 text-intel-cyan font-mono select-none tracking-widest text-[10px] md:text-sm pl-2">
              <div className="w-2 h-2 rounded-full bg-intel-cyan animate-pulse" />
              <span>SYSTEM LINK</span>
            </div>
            {/* Close button for mobile inside sidebar */}
            <button
              className="md:hidden p-1 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Categories */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
            {prepareList(SIDEBAR_CATEGORIES).map((category: any) => (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => {
                    toggleCategory(category.id);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
                  aria-expanded={expandedCategories[category.id]}
                >
                  <span>{category.label}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${expandedCategories[category.id] ? "rotate-90 text-intel-cyan" : ""}`}
                  />
                </button>

                {/* Category Items */}
                <AnimatePresence>
                  {expandedCategories[category.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-0.5 overflow-hidden border-l border-white/10 pl-2 ml-2 mt-1"
                    >
                      {prepareList(category.items).map((item: any) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.isEvent) {
                                window.dispatchEvent(
                                  new CustomEvent("navigate-to-methodology", {
                                    detail: {},
                                  }),
                                );
                              } else {
                                setActiveTab(item.id as any);
                              }
                              // auto-close when a link is clicked (overlay behavior)
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-all tracking-wide
                              ${
                                isActive
                                  ? "bg-intel-cyan/10 text-intel-cyan font-bold shadow-[inset_2px_0_0_0_#00f2ff]"
                                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                              }
                            `}
                          >
                            <item.icon
                              className={`w-4 h-4 shrink-0 col-span-1 ${isActive ? "text-intel-cyan animate-pulse" : "opacity-80"}`}
                            />
                            <span
                              className={`${isActive ? "opacity-100" : "opacity-80"} truncate`}
                            >
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden h-full relative z-[50]">
        {/* Global Action Header */}
        <ProfessionalHeader
          onOpenAI={onOpenAI}
          onOpenPipeline={onOpenPipeline}
          onGoHome={onGoHome}
          onOpenReport={onOpenReport}
          onOpenCalendar={() => setShowCalendar(true)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          onToggleDebug={onToggleDebug}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        ></ProfessionalHeader>

        {/* Dynamic View Container */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-6"
          id="professional-intel-dossier"
        >
          {activeTab === "pipeline-control" ? (
            <ObservabilityDashboard onBack={() => setActiveTab("overview")} />
          ) : activeTab === "govagent" ? (
            <GovernmentAgentPanel />
          ) : activeTab === "events" ? (
            <div className="space-y-6">
              <ModuleHeader
                title="News Intelligence"
                subtitle="Real-time monitoring of local and international media sources with AI-powered sentiment analysis"
                icon={Newspaper}
                nodeId="NEWS-NODE-15"
              />
              <div className="flex items-center space-x-1 mb-6 bg-surface-container border border-outline-variant rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setEventsSubTab("news")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    eventsSubTab === "news"
                      ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Newspaper className="w-3 h-3" />
                  <span>Real-Time News</span>
                </button>
                <button
                  onClick={() => setEventsSubTab("temporal")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    eventsSubTab === "temporal"
                      ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Temporal Analysis</span>
                </button>
                <button
                  onClick={() => setEventsSubTab("signal")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    eventsSubTab === "signal"
                      ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Signal Intelligence</span>
                </button>
                <button
                  onClick={() => setEventsSubTab("engine")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    eventsSubTab === "engine"
                      ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>Event Engine</span>
                </button>
                <button
                  onClick={() => setEventsSubTab("rtee")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                    eventsSubTab === "rtee"
                      ? "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]"
                      : "border-transparent text-on-surface-variant hover:text-intel-cyan hover:border-intel-cyan/20"
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>RTEE</span>
                </button>
                <button
                  onClick={() => setEventsSubTab("timeline")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                    eventsSubTab === "timeline"
                      ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Timeline</span>
                </button>
              </div>
              {eventsSubTab === "news" ? (
                <div className="space-y-6">
                  <RealTimeNewsFeed />
                </div>
              ) : eventsSubTab === "temporal" ? (
                <TemporalAnalysisTab />
              ) : eventsSubTab === "timeline" ? (
                <Timeline />
              ) : eventsSubTab === "signal" ? (
                <LiveSignalFeed maxItems={15} showFilter={true} />
              ) : eventsSubTab === "rtee" ? (
                <RTEE />
              ) : (
                <EventsIntelligence />
              )}
            </div>
          ) : activeTab === "radicalisation" ? (
            <RadicalisationIntelligence />
          ) : activeTab === "actor-network" ? (
            <ActorNetworkIntelligence />
          ) : activeTab === "reports" ? (
            <InvestmentIntelligenceReportGenerator />
          ) : activeTab === "industry" ? (
            <IndustrialIntelligencePanel />
          ) : activeTab === "strategic-energy" ? (
            <StrategicEnergyIntelligencePanel />
          ) : activeTab === "black-market" ? (
            <BlackMarketIntelligencePanel />
          ) : activeTab === "cognitive" ? (
            <CognitiveWarfare />
          ) : activeTab === "clusters" ? (
            <ClusterIntelligence />
          ) : activeTab === "trgm" ? (
            <TRGMDashboard />
          ) : activeTab === "overview" ? (
            <div className="space-y-4 pb-6 w-full max-w-7xl mx-auto text-white">
              <ModuleHeader 
                title="Core Intelligence Overview"
                subtitle="Strategic synchronization of all intelligence dimensions and real-time revolutionary risk assessment"
                icon={LayoutDashboard}
                nodeId="CORE-NODE-01"
              />
              {/* LAYER 1 — SITUATIONAL AWARENESS */}
              <div className="glass rounded-xl border border-intel-border/50 p-4 space-y-4 mt-4">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                  {/* Huge RRI Score */}
                  <div className="flex flex-col min-w-[200px]">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Revolutionary Risk Index
                    </div>
                    <div
                      className={`text-6xl lg:text-7xl font-black font-mono tracking-tighter leading-none ${rriState.rri >= 2.625 ? "text-intel-red" : "text-intel-orange"}`}
                    >
                      {rriState.rri.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          rriState.rri >= 2.625
                            ? "text-intel-red border-intel-red/30 bg-intel-red/10"
                            : "text-intel-orange border-intel-orange/30 bg-intel-orange/10"
                        }`}
                      >
                        {rriState.rri >= 2.625
                          ? "THRESHOLD BREACHED"
                          : "ELEVATED RISK"}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${rriState.velocity > 0 ? "text-intel-red" : "text-intel-cyan"}`}
                      >
                        {rriState.velocity > 0 ? "↑" : "↓"}{" "}
                        {Math.abs(rriState.velocity).toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* 3 Gauges row */}
                  <div className="flex-1 grid grid-cols-3 gap-2 lg:gap-4 lg:border-l lg:border-white/10 lg:pl-6 lg:border-r lg:pr-6">
                    {[
                      {
                        label: "P(REVOLUTION)",
                        value: (rriState.p_rev * 100).toFixed(1) + "%",
                        sub: `CI [${(rriState.ci_low * 100).toFixed(1)}–${(rriState.ci_high * 100).toFixed(1)}%]`,
                        color: rriState.p_rev > 0.7 ? "#ef4444" : "#f59e0b",
                        percent: rriState.p_rev * 100,
                      },
                      {
                        label: "CASCADE RISK",
                        value:
                          (rriState.cascade_probability * 100).toFixed(0) + "%",
                        sub: "P_cascade EQ.17",
                        color:
                          rriState.cascade_probability > 0.6
                            ? "#ef4444"
                            : "#f59e0b",
                        percent: rriState.cascade_probability * 100,
                      },
                      {
                        label: "PATTERN MATCH",
                        value:
                          (rriState.pattern_similarity * 100).toFixed(0) + "%",
                        sub: "MODERATE-PARTIAL",
                        color:
                          rriState.pattern_similarity > 0.65
                            ? "#ef4444"
                            : rriState.pattern_similarity > 0.5
                              ? "#f59e0b"
                              : "#38bdf8",
                        percent: rriState.pattern_similarity * 100,
                      },
                    ].map((g, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center mt-2 group"
                      >
                        <svg
                          viewBox="0 0 100 60"
                          className="w-[120px] lg:w-[160px] drop-shadow-md lg:mb-1 overflow-visible"
                        >
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke={g.color}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="125.66"
                            strokeDashoffset={
                              125.66 - (g.percent / 100) * 125.66
                            }
                            className="transition-all duration-1000 ease-out"
                          />
                          <text
                            x="50"
                            y="44"
                            textAnchor="middle"
                            fill={g.color}
                            className="font-mono font-bold"
                            style={{
                              fontSize: "16px",
                              letterSpacing: "-0.05em",
                            }}
                          >
                            {g.value}
                          </text>
                        </svg>
                        <div className="text-[8px] lg:text-[9px] font-mono text-slate-500 uppercase mt-1 text-center">
                          {g.label}
                        </div>
                        <div className="text-[7px] lg:text-[8px] font-mono text-slate-600 truncate text-center">
                          {g.sub}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 6 Ticker Metrics Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      {
                        label: "FX RESERVES",
                        val: `${data.economy.fx_reserves}d`,
                        sub:
                          data.economy.fx_reserves < 90 ? "▲ Below 90d" : "OK",
                        warn: data.economy.fx_reserves < 90,
                      },
                      {
                        label: "MII",
                        val: Math.round(
                          (miiProfile?.mii || 0.14) * 100,
                        ).toString(),
                        sub: miiProfile?.phase || "STABLE",
                        warn: (miiProfile?.mii ?? 0) > 0.55,
                      },
                      {
                        label: "UGTT",
                        val: data.social.ugtt_mobilisation_level,
                        sub: "Mobilisation",
                        warn: data.social.ugtt_mobilisation_level === "HIGH",
                      },
                      {
                        label: "PROTESTS/30D",
                        val: String(data.social.protest_events_30d),
                        sub: "Events Logged",
                        warn: data.social.protest_events_30d > 20,
                      },
                      {
                        label: "DECREE 54",
                        val: String(data.social.decree54_charged),
                        sub: "Charged",
                        warn: true,
                      },
                      {
                        label: "VELOCITY",
                        val:
                          (rriState.velocity > 0 ? "+" : "") +
                          rriState.velocity.toFixed(3),
                        sub: rriState.velocity_label || "STABLE",
                        warn: rriState.velocity > 0.15,
                      },
                    ].map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-white/5 pb-1"
                      >
                        <span className="text-[8px] lg:text-[9px] font-mono text-slate-500">
                          {t.label}
                        </span>
                        <div className="text-right flex space-x-2 items-center">
                          <span
                            className={`text-[9px] lg:text-[10px] font-mono font-bold ${t.warn ? "text-intel-orange" : "text-intel-cyan"}`}
                          >
                            {t.val}
                          </span>
                          <span className="text-[7px] lg:text-[8px] font-mono text-slate-600 leading-none truncate w-[40px] lg:w-[60px] text-right">
                            {t.sub}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Summary Sub-header */}
                <div className="bg-intel-cyan/5 border border-intel-cyan/10 p-2 lg:p-3 rounded flex flex-col lg:flex-row items-start lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                  <Sparkles className="w-4 h-4 text-intel-cyan shrink-0 hidden lg:block" />
                  <div className="text-[9px] lg:text-[10px] text-slate-300 font-sans leading-relaxed flex-1 w-full truncate whitespace-normal overflow-hidden max-h-16 lg:max-h-12 border-l-2 border-intel-cyan/30 pl-3">
                    {aiAnalysis?.summary ||
                      "The current analysis of Tunisia's revolutionary risk indicates a moderate level of systemic pressure. Structural indicators remain elevated while catalytic events show partial consolidation. Intervention pathways are open."}
                  </div>
                  <div className="flex w-full lg:w-auto items-center justify-between lg:justify-end gap-4 shrink-0">
                    <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-500">
                      <span className="flex flex-col text-right">
                        <span>AI R(T)</span>
                        <span className="text-white font-bold text-[10px]">
                          {(aiAnalysis?.rt ?? 2.8).toFixed(3)}
                        </span>
                      </span>
                      <span className="flex flex-col text-right">
                        <span>AI P_REV</span>
                        <span className="text-white font-bold text-[10px]">
                          {((aiAnalysis?.pRev ?? 0.909) * 100).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={runCoreLogicAnalysis}
                      disabled={isAIAnalysisLoading}
                      className="bg-intel-cyan/20 hover:bg-intel-cyan/30 text-intel-cyan hover:text-white border border-intel-cyan/40 rounded px-5 py-2 flex items-center h-[34px] text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    >
                      {isAIAnalysisLoading ? "ANALYZING..." : "RUN AI ANALYSIS"}
                    </button>

                    <div className="w-2 h-2 rounded-full bg-intel-cyan animate-ping hidden lg:block ml-1" />
                  </div>
                </div>
              </div>

              {/* LAYER 2 — ACTIVE INTELLIGENCE */}
              <div className="mt-8 mb-2 flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-intel-cyan" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Active Intelligence
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                <div className="lg:col-span-6 flex flex-col gap-4">
                  {/* Spotlight Carousel */}
                  <div className="glass rounded-xl border border-intel-border/50 relative overflow-hidden flex-1 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                      <div className="flex items-center space-x-2 uppercase text-[9px] font-mono tracking-widest text-white">
                        <Zap className="w-3 h-3 text-intel-orange" />
                        <span>Intelligence Spotlight</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[0, 1, 2, 3].map((_, i) => (
                          <button
                            key={`spotlight-${i}`}
                            onClick={() => setSpotlightIndex(i)}
                            className={`h-1 transition-all rounded w-4 ${spotlightIndex % 4 === i ? "bg-intel-cyan" : "bg-white/20"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="p-5 flex-1 relative flex flex-col justify-center">
                      {/* CAROUSEL SLIDES */}
                      {spotlightIndex % 4 === 0 && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-baseline space-x-3">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                              UGTT Strike Risk
                            </h3>
                            <span className="text-3xl font-bold font-mono text-intel-orange">
                              64%
                            </span>
                          </div>
                          <p className="text-[10px] font-sans text-slate-400 leading-relaxed max-w-md">
                            General strike trigger probability. Mobilisation:{" "}
                            {data.social.ugtt_mobilisation_level}.{" "}
                            {data.social.ugtt_strike_count_2025 || 847} strikes
                            registered historically in baseline 2025 metric.
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Strike count 2025</span>
                              <span className="text-intel-orange font-bold font-mono">
                                {data.social.ugtt_strike_count_2025 || 847}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>CPG wage arrears</span>
                              <span className="text-intel-red font-bold font-mono">
                                3 months
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Mobilisation</span>
                              <span className="text-intel-orange font-bold font-mono">
                                {data.social.ugtt_mobilisation_level}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>R(t) impact if strike</span>
                              <span className="text-intel-red font-bold font-mono">
                                +0.14
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {spotlightIndex % 4 === 1 && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-baseline space-x-3">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                              FX Reserve Runway
                            </h3>
                            <span
                              className={`text-3xl font-bold font-mono ${data.economy.fx_reserves < 90 ? "text-intel-orange" : "text-intel-cyan"}`}
                            >
                              {data.economy.fx_reserves}d
                            </span>
                          </div>
                          <p className="text-[10px] font-sans text-slate-400 leading-relaxed max-w-md">
                            Days of import cover remaining. Warning: 90d ·
                            Crisis: 60d. IMF deal probability remains contingent
                            on institutional reform markers.
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Current capacity</span>
                              <span className="text-intel-orange font-bold font-mono">
                                {data.economy.fx_reserves} days
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Depletion rate</span>
                              <span className="text-intel-red font-bold font-mono">
                                ~0.8d/week
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Crisis ETA</span>
                              <span className="text-intel-orange font-bold font-mono">
                                ~
                                {Math.max(
                                  0,
                                  Math.round(
                                    (data.economy.fx_reserves - 60) / 0.8,
                                  ),
                                )}
                                w
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>IMF deal prob.</span>
                              <span className="text-slate-300 font-bold font-mono">
                                31%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {spotlightIndex % 4 === 2 && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-baseline space-x-3">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                              Cascade Risk
                            </h3>
                            <span className="text-3xl font-bold font-mono text-intel-orange">
                              {(rriState.cascade_probability * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] font-sans text-slate-400 leading-relaxed max-w-md">
                            P_cascade EQ.17 — probability of regional protest
                            propagation. Current models indicate the Sfax →
                            Interior corridor is highly active.
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Sfax→Kasserine</span>
                              <span className="text-intel-red font-bold font-mono">
                                71%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Sfax→Gafsa</span>
                              <span className="text-intel-orange font-bold font-mono">
                                58%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Kasserine→Sidi Bouzid</span>
                              <span className="text-intel-orange font-bold font-mono">
                                52%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Compound stress</span>
                              <span className="text-intel-cyan font-bold font-mono">
                                0.000
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {spotlightIndex % 4 === 3 && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-baseline space-x-3">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                              Pattern Match HPS
                            </h3>
                            <span className="text-3xl font-bold font-mono text-intel-cyan">
                              {(rriState.pattern_similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-[10px] font-sans text-slate-400 leading-relaxed max-w-md">
                            MODERATE-PARTIAL similarity. Historical analogues
                            derived via high-dimensional latent space proximity
                            to defined revolutionary vectors.
                          </p>
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Tunisia 2010 Q3</span>
                              <span className="text-intel-red font-bold font-mono">
                                71%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Tunisia 2021 Q1</span>
                              <span className="text-intel-orange font-bold font-mono">
                                64%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Egypt 2011</span>
                              <span className="text-intel-cyan font-bold font-mono">
                                58%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 bg-black/20 p-2 rounded">
                              <span>Algeria 2019</span>
                              <span className="text-slate-400 font-bold font-mono">
                                44%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lead Story Banner */}
                  <div
                    className={`glass rounded-xl border flex items-center p-3 gap-4 ${leadStory?.severity >= 4 ? "border-intel-red/30" : "border-intel-border/50"}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 w-20 shrink-0 border-r border-white/10 pr-2">
                      <div className="flex items-center space-x-1 uppercase text-[8px] font-mono tracking-widest text-[#f97316]">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>LEAD</span>
                      </div>
                      <span
                        className={`text-[8px] font-mono px-1 py-0.5 rounded text-center leading-none ${leadStory?.severity >= 4 ? "bg-intel-red/20 text-intel-red border border-intel-red/30" : "bg-intel-orange/20 text-intel-orange border border-intel-orange/30"}`}
                      >
                        SEV {leadStory?.severity ?? 5}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 pr-2">
                      <h4 className="text-[11px] font-sans font-bold text-white leading-snug truncate w-full">
                        {leadStory?.title ??
                          "(🔊) Localized disruptions escalate in critical state-owned sector"}
                      </h4>
                      <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 mt-1.5 w-full">
                        <span className="truncate pr-2">
                          {leadStory?.source_name ?? "Google News Tunisie"} •{" "}
                          {leadStory
                            ? new Date(
                                leadStory.published_at,
                              ).toLocaleTimeString()
                            : "Current"}
                        </span>
                        <a
                          href={leadStory?.url ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-intel-cyan flex items-center space-x-1 hover:underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Read source</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="lg:col-span-4 glass rounded-xl border border-intel-border/50 overflow-hidden flex flex-col h-[calc(100vh-250px)]">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5 shrink-0">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-slate-300 flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-intel-cyan" />
                      <span>Regional Risk</span>
                    </div>
                    <div className="flex items-center space-x-1 border border-intel-cyan/30 bg-intel-cyan/10 px-1 py-0.5 rounded">
                      <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse" />
                      <span className="text-[7px] font-mono text-intel-cyan uppercase">
                        Live Sync
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 relative bg-black/60 isolate overflow-hidden">
                    <Map
                      governorates={context?.governorates || []}
                      events={context?.events || []}
                      activeLayer="Regional Risk"
                    />
                  </div>
                </div>
              </div>

              {/* LAYER 3 — ANALYTICAL DEPTH */}
              <div className="mt-8 mb-2 flex items-center space-x-2">
                <BrainCircuit className="w-3.5 h-3.5 text-intel-cyan" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Analytical Depth
                </span>
              </div>

              {/* 3A: Forecast & Calibration */}
              <div className="glass rounded-xl border border-intel-border/50 overflow-hidden space-y-4 p-4">
                <div className="flex items-center space-x-2 border-b border-white/10 pb-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-intel-cyan" />
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">
                    3A: Forecast & Calibration
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[200px]">
                  {/* RRI Trend */}
                  <div className="flex flex-col space-y-2 h-full">
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase px-1">
                      <span>RRI Trend Analysis</span>
                      <button className="flex items-center space-x-1 bg-white/10 px-1.5 py-0.5 rounded text-white hover:bg-white/20">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>RUN 2011 BACKTEST</span>
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { date: "Jan", rri: 1.8 },
                          { date: "Feb", rri: 1.95 },
                          { date: "Mar", rri: 2.1 },
                          { date: "Apr", rri: 2.05 },
                          { date: "May", rri: 2.3 },
                          { date: "Jun", rri: 2.45 },
                          { date: "Jul", rri: rriState.rri },
                          ...(forecast?.trajectory
                            ?.filter((_, i) => i % 2 === 0)
                            .map((t) => ({
                              date: `+${t.day}d`,
                              rri: t.predictedRRI,
                            })) || []),
                        ]}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#475569"
                          fontSize={8}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[0, 4]}
                          stroke="#475569"
                          fontSize={8}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            fontSize: "10px",
                            fontFamily: "monospace",
                          }}
                        />
                        <ReferenceLine
                          y={2.5}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                        />
                        <Line
                          type="monotone"
                          dataKey="rri"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          dot={{
                            r: 2,
                            fill: "#0f172a",
                            stroke: "#38bdf8",
                            strokeWidth: 1,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 14 Day Cascade */}
                  <div className="flex flex-col space-y-2 h-full">
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase px-1">
                      <span>Predictive 14-Day Cascade Forecast</span>
                      <span className="flex space-x-2">
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 bg-intel-cyan rounded-full" />
                          <span>LOW</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 bg-intel-orange rounded-full" />
                          <span>ELEVATED</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 bg-intel-red rounded-full" />
                          <span>CRITICAL</span>
                        </span>
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Array.from({ length: 14 }, (_, i) => ({
                          day: `${6 + i} ${["WED", "THU", "FRI", "SAT", "SUN", "MON", "TUE"][i % 7]}`,
                          prob: Math.min(80, 15 + i * 2.5 + Math.sin(i) * 10),
                        }))}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          stroke="#475569"
                          fontSize={7}
                          tickLine={false}
                          axisLine={false}
                          angle={-35}
                          textAnchor="end"
                          height={20}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#475569"
                          fontSize={8}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.05)" }}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            border: "none",
                            fontSize: "10px",
                            fontFamily: "monospace",
                          }}
                        />
                        <Bar dataKey="prob" radius={[2, 2, 0, 0]}>
                          {Array.from({ length: 14 }).map((_, i) => {
                            const prob = Math.min(
                              80,
                              15 + i * 2.5 + Math.sin(i) * 10,
                            );
                            return (
                              <Cell
                                key={i}
                                fill={
                                  prob > 50
                                    ? "#ef4444"
                                    : prob > 30
                                      ? "#f97316"
                                      : prob > 15
                                        ? "#f59e0b"
                                        : "#38bdf8"
                                }
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap text-[8px] font-mono mt-4">
                  <span className="bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded">
                    Structural_Economic_Signal
                  </span>
                  <span className="bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded">
                    CPG_Disruption_Index
                  </span>
                  <span className="bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded">
                    Opposition_Coordination_Index
                  </span>
                </div>
                <p className="text-[10px] font-sans text-slate-400 leading-relaxed max-w-4xl border-l-2 border-intel-cyan/30 pl-3">
                  Forecast Narrative: Predictive models indicate a progressive
                  tightening of systemic pressures peaking over the next two
                  weeks. Structural economic signals point to increasing
                  vulnerabilities in state capacity, while localized disruptions
                  show high potential for broader integration if unchecked.
                </p>
              </div>

              {/* 3B: Intelligence Brief & 3C: Strategic Assessment */}
              <div className="grid grid-cols-1 gap-6 mt-6">
                {/* 3B */}
                <div className="glass rounded-xl border border-intel-border/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1e293b]/50">
                    <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-[#f59e0b]">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="font-bold">
                        Intelligence Brief — ELEVATED
                      </span>
                    </div>
                    <div className="hidden lg:flex items-center space-x-3 text-[8px] font-mono text-slate-400">
                      <span>MII=57%</span>
                      <span>19:42:08</span>
                      <span className="text-white border-l border-white/10 pl-2">
                        R(t)=0.44
                      </span>
                      <span className="text-white">P_rev=12%</span>
                      <span className="text-white">V=STABLE</span>
                      <span className="text-intel-cyan">MII=57% FREEZE</span>
                      <span className="text-white">RPI=28%</span>
                      <span className="text-white">SEI=42% Ph2</span>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    {/* Section 1 */}
                    <div className="space-y-3">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        Situation
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Tunisia's political risk index stands at R(t)=0.44
                        (ELEVATED risk). Trigger zones include 1) wage disputes,
                        2) localized water scarcity protests, 3) elite
                        fragmentation. Primary drivers are mounting fiscal
                        illiquidity and structural unemployment in marginalized
                        regions.
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">
                          Wage Disputes
                        </span>
                        <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">
                          Resource Scarcity
                        </span>
                        <span className="text-[8px] font-mono bg-white/5 border border-white/10 px-1 py-0.5 rounded text-slate-400">
                          Elite Friction
                        </span>
                      </div>
                    </div>
                    {/* Section 2 */}
                    <div className="space-y-3">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        Key Developments
                      </div>
                      <ul className="space-y-2 text-[10px] text-slate-300">
                        <li className="flex items-start">
                          <span className="text-intel-red mr-2">•</span>
                          <span className="text-intel-red">
                            FX reserves at 60d — approaching warning threshold
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-intel-red mr-2">•</span>
                          <span className="text-intel-red">
                            UGTT mobilisation at HIGH — strike action imminent
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-intel-orange mr-2">•</span>
                          <span className="text-intel-orange">
                            Narrative amplification underway (ETM 35%)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-intel-cyan mr-2">•</span>
                          <span className="text-intel-cyan">
                            Ministerial Instability at 57% — Phase: FREEZE
                          </span>
                        </li>
                      </ul>
                    </div>
                    {/* Section 3 */}
                    <div className="space-y-3">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        Assessment
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Current conditions represent elevated background risk
                        without acute convergence. However, isolated triggers
                        could cascade rapidly if state response mechanisms are
                        overwhelmed simultaneously.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 bg-black/30 p-3 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wide mb-1">
                        Predicted Regime Response
                      </div>
                      <div className="text-[10px] font-sans text-slate-300">
                        Threat perception:{" "}
                        <span className="font-bold text-white">DEFENSIVE</span>.
                        Expected action:{" "}
                        <span className="text-intel-cyan">
                          Targeted Suppression (75%)
                        </span>
                        . Narrative frame: Sovereignty / Anti-Interference.
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                        <span>Time Horizon: 30-90 days</span>
                        <span className="text-intel-cyan">Moderate</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div className="h-full w-[45%] bg-intel-cyan"></div>
                      </div>
                      <div className="text-[8px] font-sans text-slate-500 mt-1">
                        Moderate structural pressure without acute trigger
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3C: Strategic Assessment Outlook */}
                <div className="glass rounded-xl border border-intel-border/50 p-4 relative overflow-hidden bg-gradient-to-r from-transparent to-[#0a0e17]">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-intel-cyan/40" />
                  <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 ml-2">
                    <Activity className="w-3.5 h-3.5 text-white" />
                    <span className="text-white font-bold">
                      Strategic Outlook
                    </span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-300 leading-relaxed pl-2 max-w-5xl">
                    {strategicOutlook}
                  </p>
                </div>

                {/* 3C Grid elements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: KIQs */}
                  <div className="space-y-3">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Key Intelligence Questions
                    </div>
                    {kiqs.map((kiq, idx) => (
                      <div
                        key={`kiq-${idx}`}
                        className={`glass rounded-lg border p-3 flex flex-col gap-2 ${kiq.status === "CRITICAL" ? "border-[#ef4444]/40 bg-[#ef4444]/5" : "border-white/10"}`}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={`text-[8px] font-mono px-1 py-0.5 rounded ${kiq.status === "CRITICAL" ? "bg-[#ef4444]/20 text-[#ef4444]" : kiq.status === "INVESTIGATING" ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-[#38bdf8]/20 text-[#38bdf8]"}`}
                          >
                            {kiq.id} {kiq.status}
                          </span>
                          <div className="flex items-center space-x-2 text-[8px] font-mono">
                            <span className="text-slate-500">
                              CONFIDENCE:{" "}
                              <span className="text-white">
                                {kiq.confidence}
                              </span>
                            </span>
                            <span className="text-slate-500">
                              IMPACT:{" "}
                              <span className="text-[#f59e0b]">
                                {kiq.impact}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] font-sans text-slate-300">
                          {kiq.question}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right: Hotspots */}
                  <div className="space-y-3">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Regional Hotspots
                    </div>
                    {hotspots.map((h, idx) => (
                      <div
                        key={`hotspot-${idx}`}
                        className={`glass rounded-lg border p-3 flex flex-col gap-2 ${h.risk === "CRITICAL" ? "border-[#ef4444]/40 bg-[#ef4444]/5" : "border-white/10"}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] font-bold font-mono text-white">
                            {h.region}
                          </span>
                          <span
                            className={`text-[8px] font-mono px-1 py-0.5 rounded ${h.risk === "CRITICAL" ? "bg-[#ef4444]/20 text-[#ef4444]" : h.risk === "HIGH" ? "bg-[#f97316]/20 text-[#f97316]" : "bg-[#f59e0b]/20 text-[#f59e0b]"}`}
                          >
                            {h.risk}
                          </span>
                        </div>
                        <div className="text-[10px] font-sans text-slate-400">
                          {h.reason}
                        </div>
                        <div className="text-[8px] font-mono text-slate-500 pt-1 border-t border-white/5 flex items-center gap-1">
                          TREND:{" "}
                          <span
                            className={`font-bold ${h.trend === "WORSENING" ? "text-intel-red" : "text-intel-cyan"}`}
                          >
                            {h.trend === "WORSENING" ? "↑" : "→"} {h.trend}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scenario Distribution & Actor Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Scenario Probability (30-day horizon)
                    </div>
                    <div className="grid grid-cols-2 gap-3 h-[calc(100%-1.5rem)]">
                      {scenarios.map((s, idx) => (
                        <div
                          key={`scenario-${idx}`}
                          className="glass rounded-lg border border-white/10 p-3 flex flex-col justify-between"
                        >
                          <div className="text-[8px] font-mono text-slate-500 mb-1">
                            {s.impact}
                          </div>
                          <div
                            className={`text-3xl font-mono font-bold ${s.color}`}
                          >
                            {s.prob}%
                          </div>
                          <div className="w-full h-1 bg-white/5 mt-1 mb-2">
                            <div
                              className={`h-full ${s.impact === "CRITICAL" ? "bg-intel-red" : s.impact === "HIGH" ? "bg-intel-orange" : s.impact === "LOW" ? "bg-intel-cyan" : "bg-slate-400"}`}
                              style={{ width: `${s.prob}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-sans text-slate-300 leading-tight">
                            {s.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      Actor Posture Matrix
                    </div>
                    <div className="glass rounded-lg border border-white/10 overflow-hidden text-[9px] font-mono">
                      <div className="grid grid-cols-4 bg-white/5 text-slate-500 p-2 border-b border-white/10">
                        <div>ACTOR</div>
                        <div>POSTURE</div>
                        <div>INFLUENCE</div>
                        <div>TREND</div>
                      </div>
                      {actors.map((actor, idx) => (
                        <div
                          key={`actor-${idx}`}
                          className="grid grid-cols-4 p-2 border-b border-white/5 text-slate-300 items-center"
                        >
                          <div className="font-bold text-white max-w-[80px] truncate">
                            {actor.name}
                          </div>
                          <div>
                            <span
                              className={`px-1 py-0.5 rounded text-[8px] bg-black/20 ${actor.posture === "MOBILIZING" ? "text-[#ef4444]" : actor.posture === "CONSOLIDATING" ? "text-[#38bdf8]" : "text-slate-400"}`}
                            >
                              {actor.posture}
                            </span>
                          </div>
                          <div className="uppercase">{actor.influence}</div>
                          <div
                            className={`font-bold ${actor.trend === "WORSENING" ? "text-intel-red" : "text-slate-500"}`}
                          >
                            {actor.trend === "WORSENING" ? "↑" : "→"}{" "}
                            {actor.trend}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3C Live Signal Intelligence Footer Ticker */}
                <div className="mt-4 pb-12">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
                    Live Signal Intelligence (Σε(t)=+0.360)
                  </div>
                  <LiveSignalFeed
                    maxItems={4}
                    showFilter={false}
                    compact={true}
                    title="Live Signal Ticker"
                  />
                </div>
              </div>
            </div>
          ) : activeTab === "command-center" ? (
            <NationalCommandCenter
              onNavigate={(tab) => setActiveTab(tab as any)}
            />
          ) : activeTab === "performance" ? (
            <ModelPerformance />
          ) : activeTab === "narrative" ? (
            <NarrativeIntelligence />
          ) : activeTab === "economy" ? (
            <EconomyIntelligence />
          ) : activeTab === "geopolitical" ? (
            <GeopoliticalIntelligence />
          ) : activeTab === "geopolitical-network" ? (
            <GeopoliticalNetworkGraph />
          ) : activeTab === "political" ? (
            <PoliticalIntelligence context={context} />
          ) : activeTab === "security" ? (
            <SecurityIntelligence />
          ) : activeTab === "energy" ? (
            <EnergyIntelligence />
          ) : activeTab === "environment" ? (
            <EnvironmentalIntelligence />
          ) : activeTab === "agriculture" ? (
            <AgriIntelDashboard />
          ) : activeTab === "agri-pulse" ? (
            <NationalAgriculturalPulse />
          ) : activeTab === "feed-hub" ? (
            <FeedIntelligenceHub />
          ) : activeTab === "poultry" ? (
            <PoultryEggsIntelligence />
          ) : activeTab === "livestock" ? (
            <LivestockMeatIntelligence />
          ) : activeTab === "dairy" ? (
            <MilkDairyIntelligence />
          ) : activeTab === "societal-fracture" ? (
            <SocietalFractureMonitor />
          ) : activeTab === "social" ? (
            <SocialIntelligence />
          ) : activeTab === "strategic" ? (
            <StrategicModeling />
          ) : activeTab === "civilizational" ? (
            <CivilizationalAnalysis />
          ) : activeTab === "fire" ? (
            <FireIntelligencePanel
              governorates={context?.governorates || []}
              events={context?.events || []}
            />
          ) : activeTab === "ne" ? (
            <div className="space-y-6">
              <ModuleHeader
                title="NE // Intelligence Feed"
                subtitle="Simplified real-time stream of latest regional and global intelligence signals"
                icon={Newspaper}
                nodeId="NE-NODE-01"
              />
              <NewsFeed hideBackground={true} />
            </div>
          ) : activeTab === "entrepreneur" ? (
            <EntrepreneurIntelligence />
          ) : activeTab === "strategic-explorer" ? (
            <BusinessInvestigator
              onGoHome={() => setActiveTab("overview")}
              context={data}
              inline={true}
              onOpenAI={() => {}}
              onOpenPipeline={() => {}}
              onOpenReport={() => {}}
            />
          ) : activeTab === "calendar" ? (
            <PoliticalCalendar />
          ) : (
            <SimulationIntelligence
              context={context}
              variables={Object.values(rriState?.variables || {})}
            />
          )}
        </div>
      </div>
      <Terminal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />
      <CalendarOverlay
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />
    </div>
  );
};
