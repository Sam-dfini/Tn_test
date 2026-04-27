import { safeStorage } from '../utils/storage';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  MapPin
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { useRSS } from '../context/RSSContext';
import { generateAnalystResponse } from '../services/geminiService';
import { Article } from '../lib/supabase';
import { BackgroundGrid, ModuleHeader } from './ProfessionalShared';

const NarrativeIntelligence = React.lazy(() => import('./NarrativeIntelligence').then(m => ({ default: m.NarrativeIntelligence })));
const RadicalisationIntelligence = React.lazy(() => import('./RadicalisationIntelligence').then(m => ({ default: m.RadicalisationIntelligence })));
const CognitiveSecurityIntelligence = React.lazy(() => import('./CognitiveSecurityIntelligence').then(m => ({ default: m.CognitiveSecurityIntelligence })));
const EconomyIntelligence = React.lazy(() => import('./EconomyIntelligence').then(m => ({ default: m.EconomyIntelligence })));
const IntelligenceBriefPanel = React.lazy(() => import('./IntelligenceBriefPanel').then(m => ({ default: m.IntelligenceBriefPanel })));
const EnergyIntelligence = React.lazy(() => import('./EnergyIntelligence').then(m => ({ default: m.EnergyIntelligence })));
const EnvironmentalIntelligence = React.lazy(() => import('./EnvironmentalIntelligence').then(m => ({ default: m.EnvironmentalIntelligence })));
const SocialIntelligence = React.lazy(() => import('./SocialIntelligence').then(m => ({ default: m.SocialIntelligence })));
const SecurityIntelligence = React.lazy(() => import('./SecurityIntelligence').then(m => ({ default: m.SecurityIntelligence })));
const BusinessInvestigator = React.lazy(() => import('./BusinessInvestigator').then(m => ({ default: m.BusinessInvestigator })));
const StrategicModeling = React.lazy(() => import('./StrategicModeling').then(m => ({ default: m.StrategicModeling })));
const GeopoliticalIntelligence = React.lazy(() => import('./GeopoliticalIntelligence').then(m => ({ default: m.GeopoliticalIntelligence })));
const ClusterIntelligence = React.lazy(() => import('./ClusterIntelligence').then(m => ({ default: m.ClusterIntelligence })));
const PoliticalIntelligence = React.lazy(() => import('./PoliticalIntelligence').then(m => ({ default: m.PoliticalIntelligence })));
const Terminal = React.lazy(() => import('./terminal/Terminal').then(m => ({ default: m.Terminal })));
const PoliticalStabilityIntelligence = React.lazy(() => import('./PoliticalStabilityIntelligence').then(m => ({ default: m.PoliticalStabilityIntelligence })));
const PoliticalCalendar = React.lazy(() => import('./PoliticalCalendar').then(m => ({ default: m.PoliticalCalendar })));
const CivilizationalAnalysis = React.lazy(() => import('./CivilizationalAnalysis').then(m => ({ default: m.CivilizationalAnalysis })));
const FireIntelligencePanel = React.lazy(() => import('./FireIntelligencePanel').then(m => ({ default: m.FireIntelligencePanel })));
const AgriIntelDashboard = React.lazy(() => import('./AgriIntelDashboard').then(m => ({ default: m.AgriIntelDashboard })));
const ActorNetworkIntelligence = React.lazy(() => import('./ActorNetworkIntelligence'));
const SimulationIntelligence = React.lazy(() => import('./SimulationIntelligence'));
const NewsFeed = React.lazy(() => import('./NewsFeed').then(m => ({ default: m.NewsFeed })));
const RealTimeNewsFeed = React.lazy(() => import('./RealTimeNewsFeed').then(m => ({ default: m.RealTimeNewsFeed })));
const LiveSignalFeed = React.lazy(() => import('./LiveSignalFeed').then(m => ({ default: m.LiveSignalFeed })));
const EventsIntelligence = React.lazy(() => import('./EventsIntelligence').then(m => ({ default: m.EventsIntelligence })));
const RTEE = React.lazy(() => import('./RTEE').then(m => ({ default: m.RTEE })));
const TemporalAnalysisTab = React.lazy(() => import('./TemporalAnalysisTab').then(m => ({ default: m.TemporalAnalysisTab })));
const Timeline = React.lazy(() => import('./Timeline').then(m => ({ default: m.Timeline })));
const GovernmentAgentPanel = React.lazy(() => import('./GovernmentAgentPanel').then(m => ({ default: m.GovernmentAgentPanel })));
const Map = React.lazy(() => import('./Map').then(m => ({ default: m.Map })));
const InvestmentIntelligenceReportGenerator = React.lazy(() => import('./InvestmentIntelligenceReportGenerator').then(m => ({ default: m.InvestmentIntelligenceReportGenerator })));
const CognitiveWarfare = React.lazy(() => import('./CognitiveWarfare').then(m => ({ default: m.CognitiveWarfare })));
const EntrepreneurIntelligence = React.lazy(() => import('./EntrepreneurIntelligence').then(m => ({ default: m.EntrepreneurIntelligence })));
const IndustrialIntelligencePanel = React.lazy(() => import('./IndustrialIntelligencePanel').then(m => ({ default: m.IndustrialIntelligencePanel })));
const StrategicEnergyIntelligencePanel = React.lazy(() => import('./StrategicEnergyIntelligencePanel').then(m => ({ default: m.StrategicEnergyIntelligencePanel })));
const BlackMarketIntelligencePanel = React.lazy(() => import('./BlackMarketIntelligencePanel').then(m => ({ default: m.BlackMarketIntelligencePanel })));

// Categories for sidebar grouping
const SIDEBAR_CATEGORIES = [
  {
    id: 'command',
    label: 'Command Center',
    items: [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'govagent', label: 'Gov. Agent', icon: Brain },
      { id: 'methodology', label: 'Methodology', icon: BookOpen, isEvent: true },
    ]
  },
  {
    id: 'economical',
    label: 'Economical',
    items: [
      { id: 'reports', label: 'Investment Reports', icon: FileText },
      { id: 'economy', label: 'Economy', icon: TrendingUp },
      { id: 'industry', label: 'Industry', icon: Box },
      { id: 'strategic-energy', label: 'Strategic Energy', icon: Zap },
      { id: 'black-market', label: 'Black Market', icon: ShoppingBag },
      { id: 'strategic-explorer', label: 'Strategic Explorer', icon: Compass },
      { id: 'entrepreneur', label: 'Entrepreneur', icon: Rocket },
    ]
  },
  {
    id: 'threat',
    label: 'Threat & Security',
    items: [
      { id: 'events', label: 'Events', icon: Radio },
      { id: 'security', label: 'Security', icon: ShieldCheck },
      { id: 'clusters', label: 'Clusters', icon: Network },
      { id: 'actor-network', label: 'Actor Network', icon: Network },
      { id: 'radicalisation', label: 'Radicalisation', icon: AlertTriangle },
      { id: 'cognitive', label: 'Cognitive Warfare', icon: ShieldAlert },
    ]
  },
  {
    id: 'socio',
    label: 'Socio-Political',
    items: [
      { id: 'political', label: 'Political', icon: Users },
      { id: 'social', label: 'Social', icon: Users },
      { id: 'geopolitical', label: 'Geopolitical', icon: Globe },
      { id: 'narrative', label: 'Narrative', icon: Brain },
    ]
  },
  {
    id: 'env',
    label: 'Environment',
    items: [
      { id: 'environment', label: 'Environment', icon: Sprout },
      { id: 'agriculture', label: 'Agriculture', icon: Leaf },
      { id: 'energy', label: 'Energy', icon: Zap },
      { id: 'fire', label: 'Fire Intel', icon: Flame },
    ]
  },
  {
    id: 'advanced',
    label: 'Advanced Modeling',
    items: [
      { id: 'strategic', label: 'Strategic', icon: BrainCircuit },
      { id: 'simulation', label: 'Simulation', icon: Cpu },
      { id: 'civilizational', label: 'Civilizational', icon: RotateCcw },
      { id: 'performance', label: 'Model Performance', icon: ShieldCheck },
      { id: 'ne', label: 'NE', icon: Newspaper },
    ]
  }
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
    id: 'REP-001',
    title: 'The Gafsa Corridor: Mining Crisis and Social Cascade Risk',
    category: 'Social-Economic',
    date: 'MAR 15, 2026',
    author: 'Social Intelligence Unit',
    readTime: '14 min',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800',
    summary: 'CPG phosphate production has fallen 40% since 2010 due to sustained protest disruption. 12,000 workers face wage arrears averaging 2.1 months. The sit-in tradition — established in 2008 — has created a self-reinforcing cycle of economic decline and social mobilisation. Current RRI contribution from E51 (protest frequency) stands at maximum weight.',
    keyFindings: [
      'CPG revenue down 68% from 2010 peak — from 2.2B TND to 0.7B TND annually',
      'Wage arrears across 847 contracted workers average 2.1 months — approaching the 3-month general strike trigger',
      'Security deployment has increased 340% since January 2026 — suggesting regime anticipates escalation',
      'Water scarcity in Gafsa (14 hrs/day cuts) compounding economic grievances into compound crisis',
      'Protest contagion risk to Kasserine, Sidi Bouzid — historically linked mobilisation corridors'
    ],
    classification: 'Level 3 // Social Intelligence'
  },
  {
    id: 'REP-002',
    title: 'IMF Negotiations: The 1.9B USD Deadlock and Fiscal Cliff',
    category: 'Economic',
    date: 'MAR 12, 2026',
    author: 'Economic Intelligence Unit',
    readTime: '11 min',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800',
    summary: 'Tunisia requires 1.9B USD in IMF financing to meet 2026 external debt obligations totalling 4.2B TND. Three consecutive failed negotiation rounds since 2023 have created a fiscal cliff scenario. The IMF conditions — subsidy reform, public wage freeze, SOE privatisation — are politically undeliverable under current regime constraints.',
    keyFindings: [
      'External debt service 2026: 4.2B TND — requires IMF deal or selective default by Q3',
      'FX reserves at 84 days import cover — below the 90-day critical threshold',
      'IMF condition: 25% electricity tariff increase — estimated +12% protest probability',
      'Alternative financing: Gulf states offered 800M USD but with political conditions Saied rejected',
      'Probability of IMF deal before Q3 2026: 31% (down from 48% in January)'
    ],
    classification: 'Level 4 // Economic Intelligence'
  },
  {
    id: 'REP-003',
    title: 'Decree 54: Press Freedom Collapse and Information Warfare',
    category: 'Political',
    date: 'MAR 10, 2026',
    author: 'Political Intelligence Division',
    readTime: '9 min',
    image: 'https://images.unsplash.com/photo-1520437358207-323b43b50729?auto=format&fit=crop&q=80&w=800',
    summary: 'Decree 54 (September 2022) criminalises "false news" with up to 10 years imprisonment. 67 journalists and activists have been charged since enactment. The decree functions as a political instrument — 89% of charges target regime critics. Tunisia dropped 27 places in RSF Press Freedom Index 2025, now ranked 118th globally.',
    keyFindings: [
      '67 charged under Decree 54 since 2022 — 89% are political opposition or journalists',
      'RSF ranking: 118th globally (2025) — down from 91st in 2021 pre-coup',
      'Internet throttling events: 14 documented since 2023 — targeting protest coordination',
      'Self-censorship index (per civil society monitors): 74% of journalists report topic avoidance',
      'International response: EU suspended media freedom dialogue — diplomatic signal with no enforcement'
    ],
    classification: 'Level 3 // Political Intelligence'
  },
  {
    id: 'REP-004',
    title: 'Migration Crisis: Rising Civil Unrest and Anti-Immigrant Sentiment',
    category: 'Social-Security',
    date: 'MAR 25, 2026',
    author: 'Social Intelligence Unit',
    readTime: '12 min',
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800',
    summary: 'Coordinated civil protests scheduled for March 28th signal a significant escalation in anti-immigrant sentiment. Social media monitoring indicates mobilization across Tunis and Sfax, driven by economic grievances and perceived state failure in border management. High risk of localized clashes and security force intervention.',
    keyFindings: [
      '340% increase in anti-immigrant keywords on social media over the last 14 days.',
      'Coordinated mobilization across 12 governorates for the March 28th "National Sovereignty" protest.',
      'Security forces (GNR) increasing deployment in Sfax and Medenine by 45%.',
      'Risk of "Social Contagion" where anti-immigrant protests merge with economic grievances.',
      'International NGOs reporting increased vulnerability of migrant populations in urban centers.'
    ],
    classification: 'Level 3 // Social Intelligence'
  }
];

import { generateAIAnalysis, AIAnalysis, ForecastResult } from '../services/ai';
const ModelPerformance = React.lazy(() => import('./ModelPerformance').then(m => ({ default: m.ModelPerformance })));
const ObservabilityDashboard = React.lazy(() => import('../pages/ObservabilityDashboard').then(m => ({ default: m.ObservabilityDashboard })));
import { usePipeline } from '../context/PipelineContext';
import { SmartAlert, Situation } from '../services/smartAlerts';
import { AgentInsight } from '../services/agents';
import { ProfessionalHeader } from './ProfessionalHeader';
import { prepareList, assertKey, getRenderKey } from '../lib/keyUtils';

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
      <div className={`text-5xl font-bold font-mono leading-none ${valueColor}`}>
        {value}
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>

    {/* Metrics */}
    <div className="md:col-span-3 space-y-2">
      {prepareList(metrics).map((m: any) => (
        <div key={m.id}
          className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
          <span className="text-[9px] font-mono text-slate-500">{m.label}</span>
          <span className={`text-[10px] font-mono font-bold ${
            m.warn ? 'text-intel-orange' : 'text-intel-cyan'
          }`}>{m.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const ForecastPanel: React.FC = () => {
  const { forecast } = usePipeline();

  if (!forecast) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-intel-border/50 overflow-hidden flex flex-col"
    >
      <div className="px-5 py-4 border-b border-intel-border/30 bg-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-white uppercase tracking-widest">Predictive 14-Day Forecast</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Cascade Probability:</span>
          <span className={`text-[10px] font-mono font-bold ${forecast.cascadeProbability > 0.5 ? 'text-intel-red' : 'text-intel-cyan'}`}>
            {(forecast.cascadeProbability * 100).toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="p-5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-2">
              <Zap className="w-3 h-3 text-intel-orange" />
              <span>Precursor Signals</span>
            </h4>
            <div className="space-y-2">
              {prepareList(forecast.precursorSignals).map((signal: any) => (
                <div key={signal.id} className="flex items-start space-x-2 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-intel-cyan mt-1">•</span>
                  <span>{signal.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-2">
              <BookOpen className="w-3 h-3 text-intel-cyan" />
              <span>Forecast Narrative</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "{forecast.narrative}"
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
  onOpenPipeline: (tab?: 'pipeline' | 'sources' | 'ai-api') => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  onToggleDebug: () => void;
}> = ({ context, onOpenAI, onOpenPipeline, onGoHome, onOpenReport, onToggleDebug }) => {
  const { data, rriState, miiProfile, actorNetwork, auditLog, aiAnalysis, forecast, runAIAnalysis, isAIAnalysisLoading } = usePipeline();
  const { articles: rssArticles, isFetching } = useRSS();
  const [activeTab, setActiveTab] = useState<'overview' | 'clusters' | 'events' | 'narrative' | 'political' | 'radicalisation' | 'cognitive' | 'economy' | 'energy' | 'strategic-energy' | 'black-market' | 'environment' | 'social' | 'security' | 'strategic' | 'geopolitical' | 'simulation' | 'methodology' | 'civilizational' | 'calendar' | 'performance' | 'actor-network' | 'govagent' | 'reports' | 'fire' | 'ne' | 'entrepreneur' | 'agriculture' | 'industry' | 'strategic-explorer' | 'pipeline-control'>('overview');
  const [eventsSubTab, setEventsSubTab] = useState<'news' | 'engine' | 'timeline' | 'signal' | 'temporal' | 'rtee'>('news');
  const [activeNewsTab, setActiveNewsTab] = useState<'feed' | 'signal'>('feed');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    command: true,
    economical: true,
    threat: false,
    socio: false,
    env: false,
    advanced: false
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Daily briefing state
  const [briefingSummary, setBriefingSummary] = useState<string>('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(
    () => Math.floor(Math.random() * 7) // random 0-6 on each load
  );

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length > 0) {
        return `{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '...' : ''}}`;
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  // Get today's lead story — highest severity article in recent time
  const leadStory = useMemo(() => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const past24h = rssArticles.filter(a => new Date(a.published_at).getTime() > yesterday);
    
    if (past24h.length > 0) {
      return past24h.sort((a, b) => b.severity - a.severity)[0];
    }
    
    // Fallback to most recent high-severity even if older than 24h
    return rssArticles.sort((a, b) => {
      // Prioritize severity, then date
      if (b.severity !== a.severity) return b.severity - a.severity;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    })[0] || null;
  }, [rssArticles]);

  const isLeadStoryStale = useMemo(() => {
    if (!leadStory) return false;
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(leadStory.published_at).getTime() < yesterday;
  }, [leadStory]);

  // Recent articles strip — last 8
  const recentArticles = useMemo(() =>
    rssArticles.slice(0, 8),
    [rssArticles]
  );

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
      setSpotlightIndex(prev => (prev + 1) % 7);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clusters', label: 'Clusters', icon: Network },
    { id: 'events', label: 'Events', icon: Radio },
    { id: 'narrative', label: 'Narrative', icon: Brain },
    { id: 'actor-network', label: 'Actor Network', icon: Network },
    { id: 'political', label: 'Political', icon: Users },
    { id: 'radicalisation', label: 'Radicalisation', icon: AlertTriangle },
    { id: 'cognitive', label: 'Cognitive Warfare', icon: ShieldAlert },
    { id: 'economy', label: 'Economy', icon: TrendingUp },
    { id: 'geopolitical', label: 'Geopolitical', icon: Globe },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'environment', label: 'Environment', icon: Sprout },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'strategic', label: 'Strategic', icon: BrainCircuit },
    { id: 'simulation', label: 'Simulation', icon: Cpu },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'civilizational', label: 'Civilizational', icon: RotateCcw },
    { id: 'fire', label: 'Fire Intel', icon: Flame },
    { id: 'ne', label: 'NE', icon: Newspaper },
    { id: 'performance', label: 'Model Performance', icon: ShieldCheck },
    { id: 'govagent', label: 'Gov. Agent', icon: Brain },
    { id: 'methodology', label: 'Methodology', icon: BookOpen, isEvent: true },
    { id: 'entrepreneur', label: 'Entrepreneur', icon: Rocket },
    { id: 'industry', label: 'Industry', icon: Box },
  ];

  useEffect(() => {
    // Check hash on load
    if (window.location.hash === '#pipeline') {
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
    const avgUnemp = context.governorates.reduce(
      (a: number, b: any) => a + (b.unemp || 0), 0
    ) / context.governorates.length;
    return Math.min(100, Math.max(0, Math.round(100 - avgUnemp)));
  }, [context]);

  const socialCohesion = useMemo(() => {
    // Derived from RRI state components if possible, or keep existing logic
    if (!context?.events) return 85;
    const tensionEvents = context.events.filter((e: any) => e.type === 'protest' || e.type === 'strike').length;
    return Math.min(100, Math.max(0, 100 - (tensionEvents * 5)));
  }, [context]);

  const handleDownloadDossier = () => {
    if (!selectedReport) return;
    const content = `TUNISIAINTEL STRATEGIC DOSSIER\nReference: ${selectedReport.id}\nTitle: ${selectedReport.title}\nCategory: ${selectedReport.category}\nDate: ${selectedReport.date}\nAuthor: ${selectedReport.author}\n\n[CLASSIFIED INFORMATION SUMMARY]\nThis report provides a deep-dive analysis into ${selectedReport.category.toLowerCase()} dynamics affecting Tunisian national security and economic stability. Full data sets are available via the secure terminal.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.id}_Dossier.txt`;
    a.click();
  };

  const handleDownloadOutlook = () => {
    const content = `TUNISIAINTEL STRATEGIC OUTLOOK\nGenerated: ${new Date().toLocaleString()}\n\nRegional Stability: ${stabilityRisk.toFixed(1)}% (Risk Level: ${stabilityRisk > 70 ? 'CRITICAL' : stabilityRisk > 40 ? 'MODERATE' : 'LOW'})\nEconomic Resilience: ${economicResilience.toFixed(1)}%\nSocial Cohesion: ${socialCohesion.toFixed(1)}%\n\nAnalysis: Current indicators suggest a period of heightened volatility in the southern sectors, primarily driven by resource scarcity and localized economic grievances.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Strategic_Outlook_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const kiqs = [
    { id: 'KIQ-1', question: 'Will the UGTT call for a general strike before the IMF Q3 deadline?', status: 'CRITICAL', confidence: 'MEDIUM', impact: 'HIGH' },
    { id: 'KIQ-2', question: 'Is the Gafsa mining disruption linked to coordinated regional actors?', status: 'INVESTIGATING', confidence: 'LOW', impact: 'MEDIUM' },
    { id: 'KIQ-3', question: 'How will the EU-Tunisia migration pact review impact FX reserve stability?', status: 'MONITORING', confidence: 'HIGH', impact: 'HIGH' },
  ];

  const hotspots = [
    { region: 'Gafsa', risk: 'CRITICAL', trend: 'STABLE', reason: 'Phosphate production deadlock' },
    { region: 'Sfax', risk: 'HIGH', trend: 'WORSENING', reason: 'Water scarcity & migration pressure' },
    { region: 'Kasserine', risk: 'ELEVATED', trend: 'WORSENING', reason: 'Social contagion risk' },
  ];

  const strategicOutlook = "The Tunisian state faces a multi-dimensional crisis as fiscal constraints collide with escalating social demands. The IMF deadlock remains the primary structural risk, with a 69% probability of selective default if no agreement is reached by Q3 2026. Social cohesion is deteriorating in the interior regions, specifically the Gafsa-Kasserine corridor, where economic marginalization is being compounded by acute water scarcity. The regime's reliance on Decree 54 suggests a shift towards securitized management of dissent rather than structural reform.";

  const actors = [
    { name: 'Regime', posture: 'CONSOLIDATING', influence: 'HIGH', sentiment: 'DEFENSIVE', trend: 'STABLE' },
    { name: 'UGTT', posture: 'MOBILIZING', influence: 'HIGH', sentiment: 'RESISTANT', trend: 'WORSENING' },
    { name: 'Opposition', posture: 'FRAGMENTED', influence: 'LOW', sentiment: 'SUPPRESSED', trend: 'STABLE' },
    { name: 'Youth', posture: 'DISAFFECTED', influence: 'MEDIUM', sentiment: 'EXIT-ORIENTED', trend: 'WORSENING' },
    { name: 'IMF/EU', posture: 'CONDITIONAL', influence: 'HIGH', sentiment: 'MONITORING', trend: 'STABLE' },
  ];

  const scenarios = [
    { title: 'Selective Default', prob: 45, impact: 'CRITICAL', color: 'text-intel-red' },
    { title: 'Social Cascade', prob: 30, impact: 'HIGH', color: 'text-intel-orange' },
    { title: 'IMF Breakthrough', prob: 15, impact: 'LOW', color: 'text-intel-cyan' },
    { title: 'Status Quo Muddle', prob: 10, impact: 'MEDIUM', color: 'text-slate-400' },
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
      <div className={`fixed z-[70] top-0 bottom-0 left-0 h-full bg-black/40 backdrop-blur-3xl border-r border-white/10 flex flex-col shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${
        sidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full border-r-0"
      }`}>
        <div className="w-64 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 text-center flex items-center justify-between">
            <div className="flex items-center justify-center space-x-2 text-intel-cyan font-mono select-none tracking-widest text-[10px] md:text-sm pl-2">
               <div className="w-2 h-2 rounded-full bg-intel-cyan animate-pulse" />
               <span>SYSTEM LINK</span>
            </div>
            {/* Close button for mobile inside sidebar */}
            <button className="md:hidden p-1 text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
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
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expandedCategories[category.id] ? 'rotate-90 text-intel-cyan' : ''}`} />
                </button>

                {/* Category Items */}
                <AnimatePresence>
                  {expandedCategories[category.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
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
                                window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }));
                              } else {
                                setActiveTab(item.id as any);
                              }
                              // auto-close when a link is clicked (overlay behavior)
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-all tracking-wide
                              ${isActive 
                                ? 'bg-intel-cyan/10 text-intel-cyan font-bold shadow-[inset_2px_0_0_0_#00f2ff]' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                            `}
                          >
                            <item.icon className={`w-4 h-4 shrink-0 col-span-1 ${isActive ? "text-intel-cyan animate-pulse" : "opacity-80"}`} />
                            <span className={`${isActive ? 'opacity-100' : 'opacity-80'} truncate`}>{item.label}</span>
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
          onOpenCalendar={() => setActiveTab('calendar')}
          onOpenTerminal={() => setIsTerminalOpen(true)}
          onToggleDebug={onToggleDebug}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        >
        </ProfessionalHeader>
        
        {/* Dynamic View Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-6" id="professional-intel-dossier">
        <React.Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-intel-cyan border-t-transparent rounded-full animate-spin"></div></div>}>
        {activeTab === 'pipeline-control' ? (
          <ObservabilityDashboard onBack={() => setActiveTab('overview')} />
        ) : activeTab === 'govagent' ? (
          <GovernmentAgentPanel />
        ) : activeTab === 'events' ? (
          <div className="space-y-6">
            <ModuleHeader 
              title="News Intelligence"
              subtitle="Real-time monitoring of local and international media sources with AI-powered sentiment analysis"
              icon={Newspaper}
              nodeId="NEWS-NODE-15"
            />
            <div className="flex items-center space-x-1 mb-6 bg-surface-container border border-outline-variant rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setEventsSubTab('news')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  eventsSubTab === 'news'
                    ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Newspaper className="w-3 h-3" />
                <span>Real-Time News</span>
              </button>
              <button
                onClick={() => setEventsSubTab('temporal')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  eventsSubTab === 'temporal'
                    ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Temporal Analysis</span>
              </button>
              <button
                onClick={() => setEventsSubTab('signal')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  eventsSubTab === 'signal'
                    ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Signal Intelligence</span>
              </button>
              <button
                onClick={() => setEventsSubTab('engine')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  eventsSubTab === 'engine'
                    ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Event Engine</span>
              </button>
              <button
                onClick={() => setEventsSubTab('rtee')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                  eventsSubTab === 'rtee'
                    ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]'
                    : 'border-transparent text-on-surface-variant hover:text-intel-cyan hover:border-intel-cyan/20'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>RTEE</span>
              </button>
              <button
                onClick={() => setEventsSubTab('timeline')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                  eventsSubTab === 'timeline'
                    ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Timeline</span>
              </button>
            </div>
            {eventsSubTab === 'news' ? (
              <div className="space-y-6">
                <RealTimeNewsFeed />
              </div>
            ) : eventsSubTab === 'temporal' ? (
              <TemporalAnalysisTab />
            ) : eventsSubTab === 'timeline' ? (
              <Timeline />
            ) : eventsSubTab === 'signal' ? (
              <LiveSignalFeed maxItems={15} showFilter={true} />
            ) : eventsSubTab === 'rtee' ? (
              <RTEE />
            ) : (
              <EventsIntelligence />
            )}
          </div>
        ) : activeTab === 'radicalisation' ? (
          <RadicalisationIntelligence />
        ) : activeTab === 'actor-network' ? (
          <ActorNetworkIntelligence />
        ) : activeTab === 'reports' ? (
          <InvestmentIntelligenceReportGenerator />
        ) : activeTab === 'industry' ? (
          <IndustrialIntelligencePanel />
        ) : activeTab === 'strategic-energy' ? (
          <StrategicEnergyIntelligencePanel />
        ) : activeTab === 'black-market' ? (
          <BlackMarketIntelligencePanel />
        ) : activeTab === 'cognitive' ? (
          <CognitiveWarfare />
        ) : activeTab === 'clusters' ? (
          <ClusterIntelligence />
        ) : activeTab === 'overview' ? (
<div className="space-y-8 pb-6">
  <ModuleHeader 
    title="Core Intelligence Overview"
    subtitle="Strategic synchronization of all intelligence dimensions and real-time revolutionary risk assessment"
    icon={LayoutDashboard}
    nodeId="CORE-NODE-01"
  />

  {/* ══════════════════════════════════════════════════════
      BLOCK 1 — THE SITUATION
      Full-width. Big numbers. Immediate impact.
      Analyst sees the state of Tunisia in 3 seconds.
  ══════════════════════════════════════════════════════ */}
  <div className={`relative overflow-hidden rounded-2xl border p-6 ${
    rriState.rri >= 2.625
      ? 'border-intel-red/40 bg-gradient-to-br from-intel-red/10 to-black/60'
      : rriState.velocity > 0.15
      ? 'border-intel-orange/30 bg-gradient-to-br from-intel-orange/8 to-black/60'
      : 'border-intel-border bg-gradient-to-br from-white/[0.02] to-black/60'
  }`}>

    {/* Ambient glow */}
    <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 ${
      rriState.rri >= 2.625 ? 'bg-intel-red' :
      rriState.velocity > 0.15 ? 'bg-intel-orange' : 'bg-intel-cyan'
    }`} style={{ transform: 'translate(30%, -30%)' }} />

    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

      {/* Left — The main number */}
      <div className="md:col-span-3 space-y-1">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.3em]">
          Revolutionary Risk Index
        </div>
        <div className={`text-7xl font-bold font-mono tracking-tighter leading-none ${
          rriState.rri >= 2.625 ? 'text-intel-red' : 'text-intel-orange'
        }`}>
          {rriState.rri.toFixed(2)}
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
            rriState.rri >= 2.625
              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
              : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
          }`}>
            {rriState.rri >= 2.625 ? 'THRESHOLD BREACHED' : 'ELEVATED RISK'}
          </span>
          {rriState.velocity > 0 ? (
            <span className="text-[11px] font-mono text-intel-red">
              ↑ {rriState.velocity.toFixed(3)}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-intel-cyan">
              ↓ {rriState.velocity.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      {/* Center — Key metrics as accelerometers */}
      <div className="md:col-span-6 grid grid-cols-3 gap-4">
        {prepareList([
          {
            label: 'P(Revolution)',
            value: (rriState.p_rev * 100).toFixed(1) + '%',
            sub: `CI [${(rriState.ci_low * 100).toFixed(1)}–${(rriState.ci_high * 100).toFixed(1)}%]`,
            color: rriState.p_rev > 0.7 ? '#ff453a' : '#ff9f0a',
            fill: rriState.p_rev,
          },
          {
            label: 'Cascade Risk',
            value: (rriState.cascade_probability * 100).toFixed(0) + '%',
            sub: 'P_cascade EQ.17',
            color: rriState.cascade_probability > 0.6 ? '#ff453a' : '#ff9f0a',
            fill: rriState.cascade_probability,
          },
          {
            label: 'Pattern Match',
            value: (rriState.pattern_similarity * 100).toFixed(0) + '%',
            sub: rriState.pattern_label?.slice(0, 18) || 'HPS EQ.20',
            color: rriState.pattern_similarity > 0.65 ? '#ff453a' :
                   rriState.pattern_similarity > 0.5 ? '#ff9f0a' : '#64748b',
            fill: rriState.pattern_similarity,
          },
        ]).map((m: any) => (
          <div key={m.id} className="space-y-2 flex flex-col items-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">
              {m.label}
            </div>
            {/* Arc gauge */}
            <div className="relative w-full" style={{ paddingTop: '53.33%' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 64">
                {/* Background arc */}
                <path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none" stroke="#1e293b" strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Value arc */}
                <motion.path
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  fill="none"
                  stroke={m.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: m.fill }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                />
                {/* Center value */}
                <motion.text 
                  x="60" 
                  y="52" 
                  textAnchor="middle"
                  fill="white" 
                  fontSize="16" 
                  fontFamily="monospace"
                  fontWeight="bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {m.value}
                </motion.text>
              </svg>
            </div>
            <div className="text-[10px] font-mono text-slate-600 text-center truncate w-full">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Right — Live signal column */}
      <div className="md:col-span-3 space-y-2">
        {prepareList([
          {
            label: 'FX Reserves',
            value: data.economy.fx_reserves + 'd',
            warn: data.economy.fx_reserves < 90,
            sub: data.economy.fx_reserves < 90 ? '⚠ Below 90d' : 'OK',
          },
          {
            label: 'MII',
            value: miiProfile ? `${Math.round(miiProfile.mii * 100)} — ${miiProfile.phase}` : '...',
            warn: (miiProfile?.mii ?? 0) > 0.55 || miiProfile?.phase === 'FREEZE',
            sub: miiProfile?.phase === 'FREEZE' ? '⚠ FREEZE' : 'Instability',
          },
          {
            label: 'UGTT',
            value: data.social.ugtt_mobilisation_level,
            warn: data.social.ugtt_mobilisation_level === 'HIGH',
            sub: 'Mobilisation',
          },
          {
            label: 'Protests/30d',
            value: String(data.social.protest_events_30d),
            warn: data.social.protest_events_30d > 20,
            sub: 'Events logged',
          },
          {
            label: 'Decree 54',
            value: String(data.social.decree54_charged),
            warn: true,
            sub: 'Charged',
          },
          {
            label: 'Velocity',
            value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3),
            warn: rriState.velocity > 0.15,
            sub: rriState.velocity_label,
          },
        ]).map((sig: any) => (
          <div key={sig.id} className="grid grid-cols-12 items-center py-2 border-b border-white/5 last:border-0 gap-2">
            <span className="col-span-5 text-[11px] font-mono text-slate-500 uppercase tracking-tight">{sig.label}</span>
            <div className="col-span-4 text-right pr-2">
              <span className={`text-[13px] font-mono font-bold ${
                sig.warn ? 'text-intel-red' : 'text-intel-cyan'
              }`}>{sig.value}</span>
            </div>
            <div className="col-span-3 text-left">
              <span className={`text-[10px] font-mono truncate block ${
                sig.warn ? 'text-intel-orange/60' : 'text-slate-700'
              }`}>{sig.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* TunisiaIntel v2.0 Core Logic Engine Analysis */}
    <div className="relative z-10 mt-5 pt-5 border-t border-white/5 space-y-4">
      {/* ETM Warning Banner */}
      {rriState.clusters?.narrativeClosure > 0.55 && (
        <div className={`flex items-center space-x-3 p-3 rounded-xl border
          text-[10px] font-mono ${
          rriState.clusters.narrativeClosure > 0.75
            ? 'border-intel-red/30 bg-intel-red/5 text-intel-red'
            : 'border-intel-orange/30 bg-intel-orange/5 text-intel-orange'
        }`}>
          <Brain className="w-3.5 h-3.5 shrink-0" />
          <span>
            Cognitive Security: Narrative closure at{' '}
            {Math.round(rriState.clusters.narrativeClosure * 100)}%
            {rriState.clusters.narrativeClosure > 0.70
              ? ' — Unfalsifiable narrative active. Fact-checking counterproductive.'
              : ' — Amplification phase. Intervention window open.'}
          </span>
          <button
            onClick={() => setActiveTab('cognitive')}
            className="ml-auto shrink-0 hover:underline"
          >
            Analyze →
          </button>
        </div>
      )}

      {/* Radicalisation Warning Banner */}
      {rriState.rpiProfile?.rpi > 0.5 && (
        <div className={`flex items-center space-x-3 p-3 rounded-xl border
          text-[10px] font-mono ${
          rriState.rpiProfile.rpi > 0.7
            ? 'border-intel-red/30 bg-intel-red/5 text-intel-red'
            : 'border-intel-orange/30 bg-intel-orange/5 text-intel-orange'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Radicalisation Dynamics: Pressure at{' '}
            {Math.round(rriState.rpiProfile.rpi * 100)}%
            {rriState.rpiProfile.rpi > 0.7
              ? ' — Critical escalation detected. Immediate intervention required.'
              : ' — Elevated pressure. Monitor mobilization pathways.'}
          </span>
          <button
            onClick={() => setActiveTab('radicalisation')}
            className="ml-auto shrink-0 hover:underline"
          >
            Analyze →
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAIAnalysisLoading ? 'bg-intel-cyan animate-pulse' : 'bg-intel-cyan/40'}`} />
          <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">TunisiaIntel v2.0 Core Logic Engine</span>
        </div>
        <button 
          onClick={runCoreLogicAnalysis}
          disabled={isAIAnalysisLoading}
          className="flex items-center space-x-1.5 px-2 py-1 rounded border border-intel-cyan/20 bg-intel-cyan/5 text-[9px] font-mono text-intel-cyan hover:bg-intel-cyan/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isAIAnalysisLoading ? 'animate-spin' : ''}`} />
          <span>{isAIAnalysisLoading ? 'ANALYZING...' : 'RUN CORE LOGIC'}</span>
        </button>
      </div>

      {isAIAnalysisLoading ? (
        <div className="flex items-center space-x-2 py-2">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-intel-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-intel-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-intel-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] font-mono text-slate-500 italic">Processing 250 variables across 24 categories...</span>
        </div>
      ) : aiAnalysis ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-4 h-4 text-intel-cyan shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {aiAnalysis.summary}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {prepareList(aiAnalysis.keyDrivers).map((driver: any) => (
                    <span key={driver.id} className="text-[9px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-400 rounded">
                      {driver.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-4 border-l border-white/5 pl-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-0.5">
                <div className="text-[8px] font-mono text-slate-500 uppercase">AI R(t)</div>
                <div className="text-lg font-bold font-mono text-intel-cyan">{aiAnalysis.rt.toFixed(3)}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[8px] font-mono text-slate-500 uppercase">AI P_rev</div>
                <div className="text-lg font-bold font-mono text-intel-cyan">{(aiAnalysis.pRev > 1 ? aiAnalysis.pRev : aiAnalysis.pRev * 100).toFixed(1)}%</div>
              </div>
            </div>
            {aiAnalysis.variableUpdates && aiAnalysis.variableUpdates.length > 0 && (
              <div className="space-y-1">
                <div className="text-[8px] font-mono text-slate-500 uppercase">Variable Adjustments</div>
                <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-hide">
                  {prepareList(aiAnalysis.variableUpdates.slice(0, 3)).map((update: any) => (
                    <div key={update.id} className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400 truncate mr-2">{update.variable}</span>
                      <span className="text-intel-cyan">{update.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2 py-2">
          <Info className="w-3 h-3 text-slate-600" />
          <span className="text-[10px] font-mono text-slate-600 italic">Core Logic Engine v2.0 ready for analysis.</span>
        </div>
      )}
    </div>
  </div>

  {/* ══════════════════════════════════════════════════════
      BLOCK 2 — INTELLIGENCE SPOTLIGHT + LEAD STORY
      Two-column. Left: rotating spotlight. Right: top story.
  ══════════════════════════════════════════════════════ */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

    {/* Spotlight — takes 2/3 */}
    <div className="md:col-span-2 glass rounded-2xl border border-intel-border/50 overflow-hidden">

      {/* Spotlight header — tab dots only, no label clutter */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-intel-orange" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Intelligence Spotlight
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <button key={assertKey(getRenderKey(null, i, 'prof-sp-dot'))} onClick={() => setSpotlightIndex(i)}
              className={`transition-all rounded-full ${
              spotlightIndex === i
                ? 'w-4 h-1.5 bg-intel-cyan'
                : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
            }`} />
          ))}
        </div>
      </div>

      {/* Spotlight content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={spotlightIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {spotlightIndex === 0 && (
              <SpotlightCard
                title="UGTT Strike Risk"
                value="64%"
                valueColor={data.social.ugtt_mobilisation_level === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'}
                description={`General strike trigger probability. Mobilisation: ${data.social.ugtt_mobilisation_level}. ${data.social.ugtt_strike_count_2025 || 847} strikes in 2025.`}
                metrics={[
                  { label: 'Strike count 2025', value: String(data.social.ugtt_strike_count_2025 || 847), warn: true },
                  { label: 'CPG wage arrears', value: '3 months', warn: true },
                  { label: 'Mobilisation', value: data.social.ugtt_mobilisation_level, warn: data.social.ugtt_mobilisation_level === 'HIGH' },
                  { label: 'R(t) impact if strike', value: '+0.14', warn: true },
                ]}
              />
            )}
            {spotlightIndex === 1 && (
              <SpotlightCard
                title="Water Crisis"
                value={String(data.social.water_crisis_govs)}
                valueColor="text-intel-red"
                description={`Governorates in critical water stress. Sfax: 6hrs/day. Kairouan: 4hrs/day.`}
                metrics={[
                  { label: 'Sfax supply', value: '6 hrs/day', warn: true },
                  { label: 'Kairouan supply', value: '4 hrs/day', warn: true },
                  { label: 'Kasserine', value: '9 hrs/day', warn: true },
                  { label: 'Govs critical', value: String(data.social.water_crisis_govs), warn: true },
                ]}
              />
            )}
            {spotlightIndex === 2 && (
              <SpotlightCard
                title="FX Reserve Runway"
                value={data.economy.fx_reserves + 'd'}
                valueColor={data.economy.fx_reserves < 90 ? 'text-intel-orange' : 'text-intel-cyan'}
                description={`Days of import cover remaining. Warning: 90d · Crisis: 60d. IMF deal probability: ${data.geopolitical?.imf_deal_probability ?? 31}%.`}
                metrics={[
                  { label: 'Current', value: `${data.economy.fx_reserves} days`, warn: data.economy.fx_reserves < 90 },
                  { label: 'Depletion rate', value: '~0.8d/week', warn: true },
                  { label: 'Crisis ETA', value: `~${Math.round((data.economy.fx_reserves - 60) / 0.8)}w`, warn: true },
                  { label: 'IMF deal prob.', value: `${data.geopolitical?.imf_deal_probability ?? 31}%`, warn: (data.geopolitical?.imf_deal_probability ?? 31) < 40 },
                ]}
              />
            )}
            {spotlightIndex === 3 && (
              <SpotlightCard
                title="Political Prisoners"
                value={String(data.social.decree54_charged)}
                valueColor="text-intel-red"
                description={`Decree 54 charges filed. 12+ opposition leaders, journalists, lawyers detained under terrorism laws.`}
                metrics={[
                  { label: 'Ghannouchi', value: `${Math.floor((Date.now() - new Date('2023-04-17').getTime()) / 86400000)}d`, warn: true },
                  { label: 'Bhiri (since 2022)', value: `${Math.floor((Date.now() - new Date('2022-01-03').getTime()) / 86400000)}d`, warn: true },
                  { label: 'Dahmani', value: `${Math.floor((Date.now() - new Date('2024-05-11').getTime()) / 86400000)}d`, warn: true },
                  { label: 'Zagrouba (lawyer)', value: `${Math.floor((Date.now() - new Date('2024-01-30').getTime()) / 86400000)}d`, warn: true },
                ]}
              />
            )}
            {spotlightIndex === 4 && (
              <SpotlightCard
                title="Cascade Risk"
                value={(rriState.cascade_probability * 100).toFixed(0) + '%'}
                valueColor={rriState.cascade_probability > 0.6 ? 'text-intel-red' : 'text-intel-orange'}
                description={`P_cascade EQ.17 — probability of regional protest propagation. Sfax → Interior corridor is active.`}
                metrics={[
                  { label: 'Sfax → Kasserine', value: '71%', warn: true },
                  { label: 'Sfax → Gafsa', value: '58%', warn: true },
                  { label: 'Kasserine → Sidi Bouzid', value: '52%', warn: true },
                  { label: 'Compound stress', value: rriState.compound_stress?.toFixed(3) || 'N/A', warn: true },
                ]}
              />
            )}
            {spotlightIndex === 5 && (
              <SpotlightCard
                title="Migration Watch"
                value="36k"
                valueColor="text-intel-orange"
                description={`Annual irregular crossing attempts. 65% from Sfax. ~1,200 deaths/year. EU €105M deal active.`}
                metrics={[
                  { label: 'Annual attempts', value: '36,000', warn: true },
                  { label: 'Deaths/year', value: '~1,200', warn: true },
                  { label: 'Sfax share', value: '65%', warn: false },
                  { label: 'Youth emigration intent', value: '65%', warn: true },
                ]}
              />
            )}
            {spotlightIndex === 6 && (
              <SpotlightCard
                title="Pattern Match HPS"
                value={(rriState.pattern_similarity * 100).toFixed(0) + '%'}
                valueColor={rriState.pattern_similarity > 0.65 ? 'text-intel-red' : rriState.pattern_similarity > 0.5 ? 'text-intel-orange' : 'text-slate-400'}
                description={rriState.pattern_label || 'EQ.20 — cosine similarity to historical pre-crisis states.'}
                metrics={[
                  { label: 'Tunisia 2010 Q3', value: '71%', warn: true },
                  { label: 'Tunisia 2021 Q1', value: '64%', warn: true },
                  { label: 'Egypt 2011', value: '58%', warn: false },
                  { label: 'Algeria 2019', value: '44%', warn: false },
                ]}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>

    {/* Lead Story — 1/3 */}
    <div className={`glass rounded-2xl border overflow-hidden flex flex-col ${
      leadStory?.severity >= 4
        ? 'border-intel-red/30'
        : 'border-intel-border/50'
    }`}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
        <div className="flex items-center space-x-2">
          <Radio className={`w-3.5 h-3.5 ${isFetching ? 'text-intel-cyan animate-pulse' : 'text-intel-orange'}`} />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            {isFetching ? 'Recalibrating Intelligence...' : 'Lead Story'}
            {isLeadStoryStale && !isFetching && (
              <span className="text-intel-red ml-1.5 opacity-80 decoration-dotted underline">
                (ARCHIVED CONTEXT)
              </span>
            )}
          </span>
        </div>
        {leadStory && (
          <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded border ${
            leadStory.severity >= 4
              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
              : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
          }`}>SEV {leadStory.severity}</span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-3">
        {leadStory ? (
          <>
            <div className="text-[11px] font-bold text-white leading-snug flex-1">
              {leadStory.title}
            </div>
            {(leadStory as any).ai_summary && (
              <p className="text-[10px] text-slate-400 leading-snug italic border-l-2 border-intel-cyan/20 pl-2">
                {(leadStory as any).ai_summary.slice(0, 140)}...
              </p>
            )}
            <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 pt-1 border-t border-white/5">
              <span>{leadStory.source_name}</span>
              <span>{new Date(leadStory.published_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <a href={leadStory.url} target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-mono text-intel-cyan hover:underline flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>Read source</span>
            </a>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] font-mono text-slate-700 text-center italic">
              No articles in last 24h.<br/>RSS feeds will populate this.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* ══════════════════════════════════════════════════════
      BLOCK 2.5 — REGIONAL RISK MAP (The "New Changment")
      Full-width choropleth map for spatial intelligence.
  ══════════════════════════════════════════════════════ */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
    <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden h-[500px]">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
        <div className="flex items-center space-x-2">
          <Globe className="w-3.5 h-3.5 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Regional Risk Choropleth // ADM1 Spatial Intelligence
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-intel-cyan animate-pulse" />
            <span className="text-[8px] font-mono text-intel-cyan uppercase">Live Sync</span>
          </div>
        </div>
      </div>
      <div className="h-full w-full relative">
        <Map 
          governorates={context?.governorates || []} 
          events={context?.events || []} 
          activeLayer="Regional Risk"
        />
      </div>
    </div>

    {/* ══════════════════════════════════════════════════════
        BLOCK 2.6 — HISTORICAL RRI TREND (Advanced Visualization)
    ══════════════════════════════════════════════════════ */}
    <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden h-[500px] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-3.5 h-3.5 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            RRI Trend Analysis & Calibration
          </span>
        </div>
        <button 
          onClick={() => setActiveTab('simulation')}
          className="flex items-center space-x-1.5 px-2 py-1 rounded bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 hover:bg-intel-cyan/20 transition-colors text-[8px] font-mono uppercase"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Run 2011 Backtest</span>
        </button>
      </div>
      <div className="flex-1 p-5">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[
            { date: 'Jan', rri: 1.8, threshold: 2.625 },
            { date: 'Feb', rri: 1.95, threshold: 2.625 },
            { date: 'Mar', rri: 2.1, threshold: 2.625 },
            { date: 'Apr', rri: 2.05, threshold: 2.625 },
            { date: 'May', rri: 2.3, threshold: 2.625 },
            { date: 'Jun', rri: 2.45, threshold: 2.625 },
            { date: 'Jul', rri: rriState.rri, threshold: 2.625 },
            ...(forecast?.trajectory.filter((_, i) => i % 2 === 0).map(t => ({
              date: `+${t.day}d`,
              rri: t.predictedRRI,
              threshold: 2.625,
              forecast: true
            })) || [])
          ]}>
            <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 4]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace', marginBottom: '4px' }}
              formatter={(value: any, name: string, props: any) => {
                if (props.payload.forecast && name === 'R(t)') return [value.toFixed(2), 'R(t) Forecast'];
                return [typeof value === 'number' ? value.toFixed(2) : value, name];
              }}
            />
            <Line type="monotone" dataKey="threshold" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Critical Threshold" />
            <Line type="monotone" dataKey="rri" stroke="#38bdf8" strokeWidth={2} dot={(props: any) => {
              const { cx, cy, payload, index } = props;
              const key = `dot-rri-trend-${index}-${cx}-${cy}`;
              if (payload.forecast) {
                return <circle key={key} cx={cx} cy={cy} r={3} fill="#0f172a" stroke="#38bdf8" strokeWidth={1} strokeDasharray="2 2" />;
              }
              return <circle key={key} cx={cx} cy={cy} r={4} fill="#0f172a" stroke="#38bdf8" strokeWidth={2} />;
            }} activeDot={{ r: 6, fill: '#38bdf8' }} name="R(t)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>

  <div className="mt-8">
    <ForecastPanel />
  </div>

  <div className="mt-8">
    <IntelligenceBriefPanel />
  </div>

  {/* ══════════════════════════════════════════════════════
      BLOCK 3 — LIVE SIGNAL INTELLIGENCE
      Was: simple news strip.
      Now: classified signal feed with model traceability.
  ══════════════════════════════════════════════════════ */}
  {/* STRATEGIC OUTLOOK */}
  <div className="mt-8 glass rounded-xl border border-intel-border p-5 relative overflow-hidden">
    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-intel-cyan/40" />
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Activity className="w-4 h-4 text-intel-cyan" />
        <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold"> Strategic Outlook</span>
      </div>
      <span className="text-[8px] font-mono px-2 py-0.5 rounded border text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5 uppercase">Analyst Assessment</span>
    </div>
    <p className="text-[11px] font-mono text-slate-300 leading-relaxed pl-3">{strategicOutlook}</p>
  </div>

  {/* KEY INTELLIGENCE QUESTIONS */}
  <div className="mt-6 space-y-3">
    <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
      <ShieldAlert className="w-4 h-4 text-intel-cyan" />
      <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold">Key Intelligence Questions</span>
      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border text-slate-500 border-slate-700 uppercase ml-auto">{kiqs.length} Active</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {kiqs.map((kiq) => (
        <div key={kiq.id} className={`glass rounded-xl border p-4 space-y-3 hover:border-white/20 transition-all ${kiq.status === 'CRITICAL' ? 'border-intel-red/30 bg-intel-red/5' : 'border-intel-border'}`}>
          <div className="flex items-start justify-between gap-2">
            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${kiq.status === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' : kiq.status === 'INVESTIGATING' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5'}`}>{kiq.status}</span>
            <span className="text-[8px] font-mono text-slate-600">{kiq.id}</span>
          </div>
          <p className="text-[10px] font-mono text-slate-300 leading-relaxed">{kiq.question}</p>
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-center space-x-1">
              <span className="text-[8px] font-mono text-slate-600 uppercase">Confidence</span>
              <span className={`text-[8px] font-mono font-bold ${kiq.confidence === 'HIGH' ? 'text-intel-cyan' : kiq.confidence === 'MEDIUM' ? 'text-intel-orange' : 'text-slate-500'}`}>{kiq.confidence}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-[8px] font-mono text-slate-600 uppercase">Impact</span>
              <span className={`text-[8px] font-mono font-bold ${kiq.impact === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'}`}>{kiq.impact}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* REGIONAL HOTSPOTS */}
  <div className="mt-6 space-y-3">
    <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
      <MapPin className="w-4 h-4 text-intel-red" />
      <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold">Regional Hotspots</span>
      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border text-intel-red border-intel-red/30 uppercase ml-auto">Active Monitoring</span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {hotspots.map((h, i) => (
        <div key={i} className={`glass rounded-xl border p-4 space-y-3 hover:border-white/20 transition-all ${h.risk === 'CRITICAL' ? 'border-intel-red/30 bg-intel-red/5' : h.risk === 'HIGH' ? 'border-intel-orange/30' : 'border-intel-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold font-mono text-white">{h.region}</span>
            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${h.risk === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' : h.risk === 'HIGH' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>{h.risk}</span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{h.reason}</p>
          <div className="flex items-center space-x-2 pt-1 border-t border-white/5">
            <span className="text-[8px] font-mono text-slate-600 uppercase">Trend</span>
            <span className={`text-[9px] font-mono font-bold ${h.trend === 'WORSENING' ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {h.trend === 'WORSENING' ? '↑ ' : '→ '}{h.trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* SCENARIOS */}
  <div className="mt-6 space-y-3">
    <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
      <TrendingUp className="w-4 h-4 text-intel-cyan" />
      <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold">Scenario Probability Distribution</span>
      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border text-slate-500 border-slate-700 uppercase ml-auto">30-Day Horizon</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {scenarios.map((s, i) => (
        <div key={i} className="glass rounded-xl border border-intel-border p-4 space-y-3 hover:border-white/20 transition-all">
          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${s.impact === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' : s.impact === 'HIGH' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : s.impact === 'LOW' ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5' : 'text-slate-400 border-slate-700 bg-slate-800/50'}`}>{s.impact}</span>
          <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.prob}%</div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${s.impact === 'CRITICAL' ? 'bg-intel-red' : s.impact === 'HIGH' ? 'bg-intel-orange' : s.impact === 'LOW' ? 'bg-intel-cyan' : 'bg-slate-500'}`} style={{ width: `${s.prob}%` }} />
          </div>
          <div className="text-[9px] font-mono text-slate-400 leading-snug">{s.title}</div>
        </div>
      ))}
    </div>
  </div>

  {/* ACTOR POSTURE MATRIX */}
  <div className="mt-6 space-y-3">
    <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
      <Network className="w-4 h-4 text-intel-cyan" />
      <span className="text-[10px] font-mono text-white uppercase tracking-[0.2em] font-bold">Actor Posture Matrix</span>
      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border text-slate-500 border-slate-700 uppercase ml-auto">{actors.length} Tracked</span>
    </div>
    <div className="glass rounded-xl border border-intel-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {['Actor', 'Posture', 'Influence', 'Sentiment', 'Trend'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {actors.map((actor, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-[11px] font-mono font-bold text-white">{actor.name}</td>
              <td className="px-4 py-3">
                <span className={`text-[9px] font-mono font-bold ${actor.posture === 'MOBILIZING' ? 'text-intel-red' : actor.posture === 'CONSOLIDATING' ? 'text-intel-orange' : actor.posture === 'FRAGMENTED' ? 'text-slate-500' : actor.posture === 'DISAFFECTED' ? 'text-yellow-400' : 'text-intel-cyan'}`}>{actor.posture}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${actor.influence === 'HIGH' ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5' : actor.influence === 'MEDIUM' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>{actor.influence}</span>
              </td>
              <td className="px-4 py-3 text-[9px] font-mono text-slate-400">{actor.sentiment}</td>
              <td className="px-4 py-3">
                <span className={`text-[9px] font-mono font-bold ${actor.trend === 'WORSENING' ? 'text-intel-red' : 'text-slate-500'}`}>
                  {actor.trend === 'WORSENING' ? '↑ ' : '→ '}{actor.trend}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

  <LiveSignalFeed
    maxItems={6}
    showFilter={true}
    compact={false}
    title="Live Signal Intelligence"
  />

</div>

      ) : activeTab === 'performance' ? (
        <ModelPerformance />
      ) : activeTab === 'narrative' ? (
        <NarrativeIntelligence />
      ) : activeTab === 'economy' ? (
        <EconomyIntelligence />
      ) : activeTab === 'geopolitical' ? (
        <GeopoliticalIntelligence />
      ) : activeTab === 'political' ? (
        <PoliticalIntelligence context={context} />
      ) : activeTab === 'security' ? (
        <SecurityIntelligence />
      ) : activeTab === 'energy' ? (
        <EnergyIntelligence />
      ) : activeTab === 'environment' ? (
        <EnvironmentalIntelligence />
      ) : activeTab === 'agriculture' ? (
        <AgriIntelDashboard />
      ) : activeTab === 'social' ? (
        <SocialIntelligence />
      ) : activeTab === 'strategic' ? (
        <StrategicModeling />
      ) : activeTab === 'civilizational' ? (
        <CivilizationalAnalysis />
      ) : activeTab === 'fire' ? (
        <FireIntelligencePanel 
          governorates={context?.governorates || []}
          events={context?.events || []}
        />
      ) : activeTab === 'ne' ? (
        <div className="space-y-6">
          <ModuleHeader 
            title="NE // Intelligence Feed"
            subtitle="Simplified real-time stream of latest regional and global intelligence signals"
            icon={Newspaper}
            nodeId="NE-NODE-01"
          />
          <NewsFeed hideBackground={true} />
        </div>
      ) : activeTab === 'entrepreneur' ? (
        <EntrepreneurIntelligence />
      ) : activeTab === 'strategic-explorer' ? (
        <BusinessInvestigator onGoHome={() => setActiveTab('overview')} context={data} inline={true} onOpenAI={() => {}} onOpenPipeline={() => {}} onOpenReport={() => {}} />
      ) : activeTab === 'calendar' ? (
        <PoliticalCalendar />
      ) : (
        <SimulationIntelligence context={context} variables={context?.variables || []} />
      )}
      </React.Suspense>
      </div>
      </div>
      <React.Suspense fallback={null}>
        <Terminal 
          isOpen={isTerminalOpen} 
          onClose={() => setIsTerminalOpen(false)} 
        />
      </React.Suspense>
    </div>
  );
};
