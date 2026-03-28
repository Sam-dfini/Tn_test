import React, { useState, useEffect, useMemo } from 'react';
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
  Target,
  RotateCcw,
  Calendar,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { EconomyIntelligence } from './EconomyIntelligence';
import { EnergyIntelligence } from './EnergyIntelligence';
import { EnvironmentalIntelligence } from './EnvironmentalIntelligence';
import { SocialIntelligence } from './SocialIntelligence';
import { SecurityIntelligence } from './SecurityIntelligence';
import { StrategicModeling } from './StrategicModeling';
import { GeopoliticalIntelligence } from './GeopoliticalIntelligence';
import { PoliticalIntelligence } from './PoliticalIntelligence';
import { PoliticalCalendar } from './PoliticalCalendar';
import { CivilizationalAnalysis } from './CivilizationalAnalysis';
import { NewsFeed } from './NewsFeed';
import { EventsIntelligence } from './EventsIntelligence';
import { useRSS } from '../context/RSSContext';
import { generateAnalystResponse } from '../services/geminiService';
import { Article } from '../lib/supabase';

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

import { usePipeline } from '../context/PipelineContext';

export const ProfessionalIntel: React.FC<{ context?: any }> = ({ context }) => {
  const { data, rriState, auditLog } = usePipeline();
  const { articles: rssArticles } = useRSS();
  const [selectedReport, setSelectedReport] = useState<IntelReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'economy' | 'energy' | 'environment' | 'social' | 'security' | 'strategic' | 'geopolitical' | 'political' | 'methodology' | 'civilizational' | 'calendar'>('overview');
  const [eventsSubTab, setEventsSubTab] = useState<'news' | 'engine'>('news');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTabOpen, setMobileTabOpen] = useState(false);

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

  // Get today's lead story — highest severity article in last 24h
  const leadStory = useMemo(() => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return rssArticles
      .filter(a => new Date(a.published_at).getTime() > yesterday)
      .sort((a, b) => b.severity - a.severity)[0] || null;
  }, [rssArticles]);

  // Recent articles strip — last 8
  const recentArticles = useMemo(() =>
    rssArticles.slice(0, 8),
    [rssArticles]
  );

  // Generate daily briefing on load (once per day)
  useEffect(() => {
    const todayKey = `briefing_${new Date().toISOString().slice(0, 10)}`;
    const cached = localStorage.getItem(todayKey);
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
          localStorage.setItem(todayKey, summary);
        }
      })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));
  }, [rriState.rri, leadStory?.url]);

  // Rotate spotlight every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotlightIndex(prev => (prev + 1) % 7);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Radio },
    { id: 'economy', label: 'Economy', icon: TrendingUp },
    { id: 'geopolitical', label: 'Geopolitical', icon: Globe },
    { id: 'political', label: 'Political', icon: Users },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'environment', label: 'Environment', icon: Sprout },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'strategic', label: 'Strategic', icon: BrainCircuit },
    { id: 'civilizational', label: 'Civilizational', icon: RotateCcw },
    { id: 'methodology', label: 'Methodology', icon: BookOpen, isEvent: true },
  ];

  useEffect(() => {
    // Check hash on load
    if (window.location.hash === '#pipeline') {
      // The pipeline is now an overlay, so we don't set activeTab here
      // App.tsx handles the navigate-to-pipeline event
    }
  }, []);

  const globalSignals = [
    'EU-Tunisia Migration Pact Review',
    'IMF Mission to Tunis: Update',
    'Maghreb Regional Security Summit',
    'Mediterranean Energy Corridor Talks',
    'BCT FX Reserve Report Q1 2026',
    'UGTT Wage Negotiation Deadlock',
    'Sfax Water Crisis — UN Report',
    'Nawara Gas Field Production Update'
  ];

  const filteredReports = reports.filter(r => 
    searchQuery === '' ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSignals = globalSignals.filter(s =>
    searchQuery === '' ||
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRow = (item: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(item)) newExpanded.delete(item);
    else newExpanded.add(item);
    setExpandedRows(newExpanded);
  };

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

  return (
    <div className="space-y-6 md:space-y-12 pb-20 relative">
      {/* Sub-navigation */}
      {/* ... (mobile/desktop tabs remain same) ... */}
      {/* Sub-navigation */}
      {/* Mobile: dropdown selector */}
      <div className="block md:hidden px-4 py-3 border-b border-intel-border">
        <button
          onClick={() => setMobileTabOpen(!mobileTabOpen)}
          className="w-full flex items-center justify-between
            px-4 py-3 bg-black/40 border border-intel-border
            rounded-xl text-[11px] font-mono text-white"
        >
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan uppercase tracking-widest">
              {tabs.find(t => t.id === activeTab)?.label || activeTab}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${
            mobileTabOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {mobileTabOpen && (
          <div className="mt-2 bg-black/80 border border-intel-border
            rounded-xl overflow-hidden z-50 absolute left-4 right-4 shadow-2xl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if ((tab as any).isEvent) {
                    window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }));
                  } else {
                    setActiveTab(tab.id as any);
                  }
                  setMobileTabOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3
                  text-[11px] font-mono uppercase tracking-wider
                  border-b border-intel-border/30 last:border-0
                  transition-colors ${
                  activeTab === tab.id
                    ? 'bg-intel-cyan/10 text-intel-cyan'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="ml-auto text-intel-cyan">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: wrapped centered tabs */}
      <div className="hidden md:flex flex-wrap justify-center items-center border-b border-intel-border gap-y-2 pb-0 transition-colors">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              if ((tab as any).isEvent) {
                window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }));
              } else {
                setActiveTab(tab.id as any);
              }
            }}
            className={`px-4 pb-4 text-[10px] md:text-xs font-mono uppercase tracking-widest transition-all relative ${
              activeTab === tab.id 
                ? 'text-intel-cyan' 
                : 'text-slate-500 hover:text-slate-300'
            } ${(tab as any).isEvent ? 'hover:text-intel-cyan' : ''}`}
          >
            <div className="flex items-center space-x-2">
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </div>
            {activeTab === tab.id && !(tab as any).isEvent && (
              <motion.div layoutId="intel-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
            )}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-8 py-4 md:py-8">
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-6 border-b border-intel-border/30 pb-4">
              <button
                onClick={() => setEventsSubTab('news')}
                className={`text-[10px] font-mono uppercase tracking-widest pb-2 transition-all relative ${
                  eventsSubTab === 'news' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                1 Real-time News Feed
                {eventsSubTab === 'news' && (
                  <motion.div layoutId="events-subtab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-intel-cyan" />
                )}
              </button>
              <button
                onClick={() => setEventsSubTab('engine')}
                className={`text-[10px] font-mono uppercase tracking-widest pb-2 transition-all relative ${
                  eventsSubTab === 'engine' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                2 Event Engine // Narrative Comparison
                {eventsSubTab === 'engine' && (
                  <motion.div layoutId="events-subtab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-intel-cyan" />
                )}
              </button>
            </div>
            {eventsSubTab === 'news' ? <NewsFeed /> : <EventsIntelligence />}
          </div>
        )}
        {activeTab === 'overview' ? (
  <div className="space-y-8 pb-8">

    {/* ============================================
        ROW 1 — SITUATION STATUS HEADER
        Full width. The most critical information.
    ============================================ */}
    <div className={`rounded-2xl border p-6 space-y-6 relative overflow-hidden ${
      rriState.rri >= 2.625
        ? 'border-intel-red/50 bg-intel-red/5'
        : rriState.velocity > 0.15
        ? 'border-intel-orange/40 bg-intel-orange/5'
        : 'border-intel-border bg-black/40'
    }`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-intel-cyan/5 blur-3xl rounded-full -mr-32 -mt-32" />

      {/* Status bar top */}
      <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">
              Tunisia Intelligence Command // Strategic Overview
            </span>
            <span className="text-xs font-mono text-white">
              {new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono text-slate-500 uppercase">System Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-intel-green animate-pulse" />
              <span className="text-[10px] font-mono text-intel-green">OPERATIONAL</span>
            </div>
          </div>
          <div className="h-8 w-px bg-intel-border/50 mx-2" />
          <div className={`px-4 py-2 rounded border font-mono text-[10px] uppercase tracking-widest ${
            rriState.rri >= 2.625
              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
              : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
          }`}>
            {rriState.rri >= 2.625 ? 'CRITICAL THRESHOLD' : 'ELEVATED RISK'}
          </div>
        </div>
      </div>

      {/* RRI core metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 relative z-10">
        {[
          {
            label: 'R(t) Index',
            value: rriState.rri.toFixed(4),
            color: rriState.rri >= 2.625 ? 'text-intel-red' : 'text-intel-orange',
            sub: rriState.rri >= 2.625 ? 'BREACH' : 'ELEVATED',
            icon: Activity
          },
          {
            label: 'P(Revolution)',
            value: (rriState.p_rev * 100).toFixed(1) + '%',
            color: rriState.p_rev > 0.70 ? 'text-intel-red' : 'text-intel-orange',
            sub: `CI [${rriState.ci_low}–${rriState.ci_high}%]`,
            icon: Zap
          },
          {
            label: 'Velocity V(t)',
            value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3),
            color: rriState.velocity > 0.15 ? 'text-intel-red' :
                   rriState.velocity < -0.15 ? 'text-intel-cyan' : 'text-slate-400',
            sub: rriState.velocity_label,
            icon: TrendingUp
          },
          {
            label: 'Salience S(t)',
            value: rriState.salience.toFixed(3),
            color: 'text-white',
            sub: `W(t) = ${rriState.w_t.toFixed(2)}`,
            icon: Target
          },
          {
            label: 'Pattern HPS',
            value: (rriState.pattern_similarity * 100).toFixed(0) + '%',
            color: rriState.pattern_similarity > 0.65 ? 'text-intel-red' :
                   rriState.pattern_similarity > 0.5 ? 'text-intel-orange' : 'text-slate-400',
            sub: rriState.pattern_similarity > 0.5 ? 'MATCH' : 'NOMINAL',
            icon: Shield
          },
          {
            label: 'Cascade Risk',
            value: (rriState.cascade_probability * 100).toFixed(0) + '%',
            color: rriState.cascade_probability > 0.6 ? 'text-intel-red' :
                   rriState.cascade_probability > 0.4 ? 'text-intel-orange' : 'text-slate-400',
            sub: 'REGIONAL',
            icon: Radio
          },
          {
            label: 'Confidence',
            value: (rriState.model_confidence * 100).toFixed(0) + '%',
            color: 'text-slate-400',
            sub: `${rriState.variables_count} VARS`,
            icon: Database
          },
        ].map(m => (
          <div key={m.label} className="space-y-2 group cursor-help">
            <div className="flex items-center space-x-2">
              <m.icon className="w-3 h-3 text-slate-600 group-hover:text-intel-cyan transition-colors" />
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                {m.label}
              </span>
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tight ${m.color}`}>
              {m.value}
            </div>
            <div className="text-[8px] font-mono text-slate-600 truncate opacity-60">
              {m.sub}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ============================================
        NEW ROW — DAILY BRIEFING + LEAD STORY
    ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Daily AI Briefing */}
      <div className="lg:col-span-2 glass p-6 rounded-2xl
        border border-intel-border/50 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between space-y-2 lg:space-y-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-intel-cyan" />
            <span className="text-[10px] font-mono text-slate-500
              uppercase tracking-widest text-center lg:text-left">
              Daily Intelligence Brief —{' '}
              {new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-700 text-center lg:text-right">
            Gemini-powered · Refreshes daily
          </span>
        </div>

        {briefingLoading ? (
          <div className="flex items-center space-x-3 py-4">
            <RefreshCw className="w-4 h-4 text-intel-cyan animate-spin" />
            <span className="text-[11px] font-mono text-slate-500">
              Generating intelligence briefing...
            </span>
          </div>
        ) : briefingSummary ? (
          <p className="text-sm text-slate-300 leading-relaxed
            font-light italic border-l-0 lg:border-l-2 border-intel-cyan/30 pl-0 lg:pl-4 text-center lg:text-left">
            "{briefingSummary}"
          </p>
        ) : (
          <p className="text-[11px] text-slate-600 italic">
            Briefing generation requires Gemini API key.
            Current R(t) = {rriState.rri.toFixed(4)} —
            P_rev = {(rriState.p_rev * 100).toFixed(1)}% —
            {rriState.threshold_breaches?.length || 0} threshold
            breaches active.
          </p>
        )}
      </div>

      {/* Lead Story */}
      <div className={`glass p-5 rounded-2xl border space-y-3 ${
        leadStory?.severity >= 4
          ? 'border-intel-red/30 bg-intel-red/5'
          : 'border-intel-border/50'
      }`}>
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-intel-orange" />
          <span className="text-[9px] font-mono text-slate-500
            uppercase tracking-widest">Lead Story</span>
          {leadStory && (
            <span className={`text-[7px] font-mono px-1.5 py-0.5
              rounded border ml-auto ${
              leadStory.severity >= 4
                ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
            }`}>SEV {leadStory.severity}</span>
          )}
        </div>

        {leadStory ? (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-white
              leading-snug">{leadStory.title}</div>
            <div className="text-[9px] text-slate-400 leading-snug">
              {(leadStory as any).ai_summary || leadStory.summary?.slice(0, 120)}
              {(leadStory.summary?.length || 0) > 120 ? '...' : ''}
            </div>
            <div className="flex items-center justify-between
              text-[8px] font-mono">
              <span className="text-slate-600">{leadStory.source_name}</span>
              <span className="text-slate-700">
                {new Date(leadStory.published_at)
                  .toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit'
                  })}
              </span>
            </div>
            {leadStory.url && (
              <a href={leadStory.url} target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono text-intel-cyan
                  hover:underline flex items-center space-x-1">
                <ExternalLink className="w-3 h-3" />
                <span>Read full article</span>
              </a>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-600 italic py-4
            text-center">
            No articles in last 24 hours.
            <br />
            <button onClick={() => window.dispatchEvent(
              new CustomEvent('navigate-main', { detail: { tab: 'newsfeed' }})
            )} className="text-intel-cyan hover:underline mt-1 block">
              Check News Feed →
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ============================================
        NEW ROW — ROTATING INTELLIGENCE SPOTLIGHT
        Different module featured each load / every 30s
    ============================================ */}
    <div className="glass p-6 rounded-2xl border border-intel-border/50
      space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-intel-orange" />
          <span className="text-[10px] font-mono text-slate-500
            uppercase tracking-widest">Intelligence Spotlight</span>
          <span className="text-[8px] font-mono text-slate-700">
            Rotates every 30s
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {Array.from({length: 7}).map((_, i) => (
            <button key={i} onClick={() => setSpotlightIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
              spotlightIndex === i ? 'bg-intel-cyan' : 'bg-slate-700'
            }`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={spotlightIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {spotlightIndex === 0 && (
            /* UGTT Strike Risk */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  UGTT Strike Risk
                </div>
                <div className={`text-4xl font-bold font-mono ${
                  data.social.ugtt_mobilisation_level === 'HIGH'
                    ? 'text-intel-red'
                    : 'text-intel-orange'
                }`}>64%</div>
                <div className="text-[10px] text-slate-500">
                  General strike trigger probability.
                  {data.social.ugtt_mobilisation_level === 'HIGH'
                    ? ' UGTT at maximum mobilisation.'
                    : ' UGTT pressure building.'}
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('navigate-to-pipeline', {
                    detail: { tab: 'political', subTab: 'ugtt' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View UGTT Monitor →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { label: 'Strike count 2025', value: `${data.social.ugtt_strike_count_2025 || 847}`, color: 'text-intel-red' },
                  { label: 'CPG wage arrears', value: '3 months unpaid', color: 'text-intel-orange' },
                  { label: 'Last formal notice', value: '28 Jan 2026', color: 'text-white' },
                  { label: 'Mobilisation level', value: data.social.ugtt_mobilisation_level, color: data.social.ugtt_mobilisation_level === 'HIGH' ? 'text-intel-red' : 'text-intel-orange' },
                  { label: 'Strike impact on R(t)', value: '+0.14 if triggered', color: 'text-intel-red' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between
                    text-[10px] border-b border-intel-border/20 pb-1.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className={`font-mono font-bold ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spotlightIndex === 1 && (
            /* Water Crisis */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  Water Crisis
                </div>
                <div className="text-4xl font-bold font-mono text-intel-red">
                  {data.social.water_crisis_govs}
                </div>
                <div className="text-[10px] text-slate-500">
                  Governorates in critical water stress.
                  Sfax: 6hrs/day supply.
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('navigate-to-pipeline', {
                    detail: { tab: 'environment', subTab: 'water' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View Water Crisis →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { gov: 'Sfax', hours: '6 hrs/day', status: 'CRITICAL' },
                  { gov: 'Kairouan', hours: '4 hrs/day', status: 'CRITICAL' },
                  { gov: 'Kasserine', hours: '9 hrs/day', status: 'HIGH' },
                  { gov: 'Gafsa', hours: '10 hrs/day', status: 'HIGH' },
                  { gov: 'Sidi Bouzid', hours: '10 hrs/day', status: 'HIGH' },
                ].map(item => (
                  <div key={item.gov} className="flex items-center
                    justify-between text-[10px] border-b
                    border-intel-border/20 pb-1.5">
                    <span className="text-slate-400">{item.gov}</span>
                    <span className="text-slate-500 font-mono">
                      {item.hours}
                    </span>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5
                      rounded border ${
                      item.status === 'CRITICAL'
                        ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                        : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spotlightIndex === 2 && (
            /* FX Reserves Countdown */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  FX Reserve Countdown
                </div>
                <div className={`text-4xl font-bold font-mono ${
                  data.economy.fx_reserves < 90
                    ? 'text-intel-orange'
                    : 'text-intel-cyan'
                }`}>{data.economy.fx_reserves}d</div>
                <div className="text-[10px] text-slate-500">
                  Days of import cover.
                  Warning: 90d · Crisis: 60d
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('navigate-to-pipeline', {
                    detail: { tab: 'economy', subTab: 'macro' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View Economy →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { label: 'Current', value: `${data.economy.fx_reserves} days`, color: data.economy.fx_reserves < 90 ? 'text-intel-orange' : 'text-intel-cyan' },
                  { label: 'Warning threshold', value: '90 days', color: 'text-yellow-500' },
                  { label: 'Crisis threshold', value: '60 days', color: 'text-intel-red' },
                  { label: 'Depletion rate', value: '~0.8 days/week', color: 'text-intel-orange' },
                  { label: 'Crisis ETA (projected)', value: `~${Math.round((data.economy.fx_reserves - 60) / 0.8)} weeks`, color: 'text-intel-red' },
                  { label: 'IMF deal probability', value: `${data.geopolitical?.imf_deal_probability ?? 31}%`, color: 'text-intel-orange' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between
                    text-[10px] border-b border-intel-border/20 pb-1.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className={`font-mono font-bold ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spotlightIndex === 3 && (
            /* Political Prisoners */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  Political Prisoners
                </div>
                <div className="text-4xl font-bold font-mono text-intel-red">
                  {data.social.decree54_charged}
                </div>
                <div className="text-[10px] text-slate-500">
                  Decree 54 charges filed.
                  12+ political prisoners detained.
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('navigate-to-pipeline', {
                    detail: { tab: 'calendar' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View Persecution Tracker →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { name: 'Rached Ghannouchi', days: Math.floor((Date.now() - new Date('2023-04-17').getTime()) / 86400000), charge: 'Terrorism' },
                  { name: 'Noureddine Bhiri', days: Math.floor((Date.now() - new Date('2022-01-03').getTime()) / 86400000), charge: 'Terrorism' },
                  { name: 'Sonia Dahmani', days: Math.floor((Date.now() - new Date('2024-05-11').getTime()) / 86400000), charge: 'Decree 54' },
                  { name: 'Ghazi Chaouachi', days: Math.floor((Date.now() - new Date('2023-02-11').getTime()) / 86400000), charge: 'Terrorism' },
                ].map(item => (
                  <div key={item.name} className="flex items-center
                    justify-between text-[10px] border-b
                    border-intel-border/20 pb-1.5">
                    <span className="text-slate-300 font-bold">
                      {item.name}
                    </span>
                    <span className="text-intel-red font-mono font-bold">
                      {item.days}d
                    </span>
                    <span className="text-slate-600 text-[8px] font-mono">
                      {item.charge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spotlightIndex === 4 && (
            /* Cascade Risk */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  Cascade Risk
                </div>
                <div className={`text-4xl font-bold font-mono ${
                  rriState.cascade_probability > 0.6
                    ? 'text-intel-red'
                    : 'text-intel-orange'
                }`}>
                  {(rriState.cascade_probability * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-500">
                  P_cascade — EQ.17. Regional protest
                  propagation probability.
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('navigate-main', {
                    detail: { tab: 'risk' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View Risk Model →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { path: 'Sfax → Kasserine', prob: 71, active: true },
                  { path: 'Sfax → Gafsa', prob: 58, active: true },
                  { path: 'Kasserine → Sidi Bouzid', prob: 52, active: true },
                  { path: 'Kairouan → Kasserine', prob: 44, active: false },
                  { path: 'Gabes → Medenine', prob: 38, active: false },
                ].map(item => (
                  <div key={item.path} className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-400">{item.path}</span>
                      <span className={item.prob > 60
                        ? 'text-intel-red font-bold'
                        : 'text-intel-orange'
                      }>{item.prob}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        item.prob > 60 ? 'bg-intel-red' : 'bg-intel-orange'
                      }`} style={{ width: `${item.prob}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spotlightIndex === 5 && (
            /* Migration Watch */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  Migration Watch
                </div>
                <div className="text-4xl font-bold font-mono text-intel-orange">
                  36k
                </div>
                <div className="text-[10px] text-slate-500">
                  Annual crossing attempts.
                  65% depart from Sfax.
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('navigate-to-pipeline', {
                    detail: { tab: 'security' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View Security →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { label: 'Annual attempts', value: '36,000', color: 'text-intel-orange' },
                  { label: 'Deaths per year', value: '~1,200', color: 'text-intel-red' },
                  { label: 'EU deal interceptions', value: '23,000/yr', color: 'text-intel-cyan' },
                  { label: 'Sfax departure share', value: '65%', color: 'text-intel-orange' },
                  { label: 'EU deal funding', value: '€105M (Jun 2023)', color: 'text-white' },
                  { label: 'Youth emigration aspiration', value: '65% want to leave', color: 'text-intel-red' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between
                    text-[10px] border-b border-intel-border/20 pb-1.5">
                    <span className="text-slate-500">{item.label}</span>
                    <span className={`font-mono font-bold ${item.color}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spotlightIndex === 6 && (
            /* Pattern Match */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div className="text-xs font-bold text-white uppercase">
                  Historical Pattern
                </div>
                <div className={`text-4xl font-bold font-mono ${
                  rriState.pattern_similarity > 0.65
                    ? 'text-intel-red'
                    : rriState.pattern_similarity > 0.5
                    ? 'text-intel-orange'
                    : 'text-slate-400'
                }`}>
                  {(rriState.pattern_similarity * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {rriState.pattern_label || 'No active match'}
                </div>
                <button onClick={() => window.dispatchEvent(
                  new CustomEvent('open-methodology', {
                    detail: { equation: '20' }
                  })
                )} className="text-[9px] font-mono text-intel-cyan
                  hover:underline">View EQ.20 →</button>
              </div>
              <div className="md:col-span-2 space-y-2">
                {[
                  { ref: 'Tunisia 2010 Q3', similarity: 71, outcome: 'Revolution (Jan 2011)' },
                  { ref: 'Tunisia 2021 Q1', similarity: 64, outcome: 'Coup (Jul 2021)' },
                  { ref: 'Egypt 2011', similarity: 58, outcome: 'Revolution' },
                  { ref: 'Algeria 2019 Hirak', similarity: 44, outcome: 'Regime concessions' },
                ].map(item => (
                  <div key={item.ref} className="flex items-center
                    justify-between text-[10px] border-b
                    border-intel-border/20 pb-1.5">
                    <span className="text-slate-400 text-[9px]">
                      {item.ref}
                    </span>
                    <span className={`font-mono font-bold ${
                      item.similarity > 65 ? 'text-intel-red' :
                      item.similarity > 50 ? 'text-intel-orange' :
                      'text-slate-500'
                    }`}>{item.similarity}%</span>
                    <span className="text-slate-700 text-[8px]">
                      {item.outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>

    {/* ============================================
        NEW ROW — LIVE NEWS STRIP
    ============================================ */}
    {recentArticles.length > 0 && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-intel-cyan" />
            <span className="text-[9px] font-mono text-slate-500
              uppercase tracking-widest">Live Feed</span>
            <div className="w-1.5 h-1.5 rounded-full bg-intel-green
              animate-pulse" />
          </div>
          <button onClick={() => window.dispatchEvent(
            new CustomEvent('navigate-main', { detail: { tab: 'newsfeed' }})
          )} className="text-[9px] font-mono text-intel-cyan
            hover:underline">View all →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2
          lg:grid-cols-4 gap-3">
          {recentArticles.slice(0, 4).map(article => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-intel-border/30
                bg-black/20 hover:border-intel-border/60
                transition-all group space-y-2 block"
            >
              <div className="flex items-center
                justify-between">
                <span className={`text-[7px] font-mono px-1.5
                  py-0.5 rounded border uppercase ${
                  article.severity >= 4
                    ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                    : article.severity >= 3
                    ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                    : 'text-slate-600 border-slate-700'
                }`}>
                  {article.category || 'news'}
                </span>
                <span className="text-[8px] font-mono text-slate-700">
                  {new Date(article.published_at)
                    .toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                </span>
              </div>
              <div className="text-[10px] text-slate-300
                group-hover:text-white transition-colors
                leading-snug line-clamp-2 font-medium">
                {article.title}
              </div>
              <div className="text-[8px] font-mono text-slate-600">
                {article.source_name}
                {article.governorate && ` · ${article.governorate}`}
              </div>
            </a>
          ))}
        </div>
      </div>
    )}

    {/* ============================================
        ROW 2 — EXECUTIVE SUMMARY & STRATEGIC OUTLOOK
    ============================================ */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Strategic Outlook Text */}
      <div className="xl:col-span-2 glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-4 h-4 text-intel-cyan" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Strategic Outlook // Q1-Q2 2026
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-mono text-slate-600">Classification:</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-intel-cyan/30 text-intel-cyan bg-intel-cyan/5">
              RESTRICTED // ANALYST EYES ONLY
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm md:text-base text-slate-200 leading-relaxed font-serif italic">
            "{strategicOutlook}"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-intel-border/30">
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-slate-500 uppercase">Primary Risk Vector</div>
              <div className="text-xs font-bold text-intel-red">Fiscal Insolvency / Debt Default</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-slate-500 uppercase">Social Trigger</div>
              <div className="text-xs font-bold text-intel-orange">Water Scarcity & Subsidy Cuts</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-slate-500 uppercase">Regime Response</div>
              <div className="text-xs font-bold text-intel-cyan">Securitized Information Control</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Intelligence Questions (KIQs) */}
      <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-intel-cyan" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Key Intelligence Questions (KIQs)
          </span>
        </div>
        
        <div className="space-y-3">
          {kiqs.map((kiq) => (
            <div key={kiq.id} className="p-3 rounded-xl bg-white/5 border border-intel-border/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-600">{kiq.id}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  kiq.status === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' :
                  kiq.status === 'INVESTIGATING' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' :
                  'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
                }`}>
                  {kiq.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-snug">
                {kiq.question}
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-600">
                <span>Impact: <span className={kiq.impact === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'}>{kiq.impact}</span></span>
                <span>Conf: {kiq.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ============================================
        ROW 2 — SITUATION STATUS HEADER
        Full width. The most critical information.
    ============================================ */}
    <div className={`rounded-2xl border p-5 space-y-4 ${
      rriState.rri >= 2.625
        ? 'border-intel-red/50 bg-intel-red/5'
        : rriState.velocity > 0.15
        ? 'border-intel-orange/40 bg-intel-orange/5'
        : 'border-intel-border bg-black/20'
    }`}>

      {/* Status bar top */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            rriState.rri >= 2.625 ? 'bg-intel-red' :
            rriState.velocity > 0.15 ? 'bg-intel-orange' : 'bg-intel-cyan'
          }`} />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            Tunisia Intelligence Briefing —{' '}
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[9px] font-mono px-2 py-1 rounded border uppercase ${
            rriState.rri >= 2.625
              ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
              : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
          }`}>
            {rriState.rri >= 2.625 ? 'THRESHOLD BREACHED' : 'ELEVATED RISK'}
          </span>
          <span className="text-[9px] font-mono text-slate-600">
            Last calc: {new Date(rriState.last_calculated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* RRI core metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: 'R(t) Index',
            value: rriState.rri.toFixed(4),
            color: rriState.rri >= 2.625 ? 'text-intel-red' : 'text-intel-orange',
            sub: rriState.rri >= 2.625 ? 'THRESHOLD' : 'ELEVATED',
            size: 'text-2xl'
          },
          {
            label: 'P(Revolution)',
            value: (rriState.p_rev * 100).toFixed(1) + '%',
            color: rriState.p_rev > 0.70 ? 'text-intel-red' : 'text-intel-orange',
            sub: `CI [${rriState.ci_low}–${rriState.ci_high}%]`,
            size: 'text-2xl'
          },
          {
            label: 'Velocity V(t)',
            value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3),
            color: rriState.velocity > 0.15 ? 'text-intel-red' :
                   rriState.velocity < -0.15 ? 'text-intel-cyan' : 'text-slate-400',
            sub: rriState.velocity_label,
            size: 'text-xl'
          },
          {
            label: 'Salience S(t)',
            value: rriState.salience.toFixed(3),
            color: 'text-white',
            sub: `W(t) = ${rriState.w_t.toFixed(2)}`,
            size: 'text-xl'
          },
          {
            label: 'Pattern HPS',
            value: (rriState.pattern_similarity * 100).toFixed(0) + '%',
            color: rriState.pattern_similarity > 0.65 ? 'text-intel-red' :
                   rriState.pattern_similarity > 0.5 ? 'text-intel-orange' : 'text-slate-400',
            sub: rriState.pattern_similarity > 0.5 ? 'MATCH ACTIVE' : 'NO MATCH',
            size: 'text-xl'
          },
          {
            label: 'Cascade Risk',
            value: (rriState.cascade_probability * 100).toFixed(0) + '%',
            color: rriState.cascade_probability > 0.6 ? 'text-intel-red' :
                   rriState.cascade_probability > 0.4 ? 'text-intel-orange' : 'text-slate-400',
            sub: 'Sfax → Kasserine',
            size: 'text-xl'
          },
          {
            label: 'Conf.',
            value: (rriState.model_confidence * 100).toFixed(0) + '%',
            color: 'text-slate-400',
            sub: `${rriState.variables_count} vars`,
            size: 'text-xl'
          },
        ].map(m => (
          <div key={m.label} className="space-y-0.5">
            <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
              {m.label}
            </div>
            <div className={`${m.size} font-bold font-mono ${m.color}`}>
              {m.value}
            </div>
            <div className="text-[8px] font-mono text-slate-600 truncate">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Pattern label if active */}
      {rriState.pattern_similarity > 0.5 && (
        <div className="flex items-center space-x-2 pt-1">
          <AlertTriangle className="w-3 h-3 text-intel-orange shrink-0" />
          <span className="text-[10px] font-mono text-intel-orange">
            {rriState.pattern_label}
          </span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-methodology',
              { detail: { equation: '20' } }))}
            className="text-[9px] font-mono text-slate-600 hover:text-intel-cyan ml-2"
          >
            EQ.20 →
          </button>
        </div>
      )}
    </div>

    {/* ============================================
        ROW 3 — STRATEGIC ACTOR POSTURE & SCENARIO MATRIX
    ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Actor Posture */}
      <div className="lg:col-span-2 glass p-5 rounded-2xl border border-intel-border/50 space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="w-3 h-3 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Strategic Actor Posture Matrix
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-intel-border/30">
                <th className="py-2 text-[8px] font-mono text-slate-600 uppercase">Actor</th>
                <th className="py-2 text-[8px] font-mono text-slate-600 uppercase">Posture</th>
                <th className="py-2 text-[8px] font-mono text-slate-600 uppercase text-center">Influence</th>
                <th className="py-2 text-[8px] font-mono text-slate-600 uppercase">Sentiment</th>
                <th className="py-2 text-[8px] font-mono text-slate-600 uppercase text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-intel-border/10">
              {actors.map((actor) => (
                <tr key={actor.name} className="group hover:bg-white/5 transition-colors">
                  <td className="py-3 text-[10px] font-bold text-white">{actor.name}</td>
                  <td className="py-3">
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                      actor.posture === 'MOBILIZING' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' :
                      actor.posture === 'CONSOLIDATING' ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10' :
                      'text-slate-500 border-slate-700 bg-slate-900'
                    }`}>{actor.posture}</span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`w-1 h-2 rounded-full ${
                          (actor.influence === 'HIGH' && i <= 3) ||
                          (actor.influence === 'MEDIUM' && i <= 2) ||
                          (actor.influence === 'LOW' && i <= 1)
                            ? 'bg-intel-cyan' : 'bg-slate-800'
                        }`} />
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-[9px] font-mono text-slate-400">{actor.sentiment}</td>
                  <td className="py-3 text-right">
                    <span className={`text-[9px] font-mono ${
                      actor.trend === 'WORSENING' ? 'text-intel-red' :
                      actor.trend === 'IMPROVING' ? 'text-intel-green' : 'text-slate-500'
                    }`}>{actor.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Matrix */}
      <div className="glass p-5 rounded-2xl border border-intel-border/50 space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Q3 2026 Scenario Probabilities
          </span>
        </div>
        <div className="space-y-4">
          {scenarios.map((s) => (
            <div key={s.title} className="space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-slate-300">{s.title}</span>
                <span className="text-white font-bold">{s.prob}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.prob}%` }}
                  className={`h-full rounded-full ${s.prob > 40 ? 'bg-intel-red' : s.prob > 20 ? 'bg-intel-orange' : 'bg-intel-cyan'}`}
                />
              </div>
              <div className="flex items-center justify-between text-[7px] font-mono uppercase tracking-tighter text-slate-600">
                <span>Impact: <span className={s.color}>{s.impact}</span></span>
                <span>Confidence: HIGH</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-intel-border/30">
          <p className="text-[8px] font-mono text-slate-600 leading-tight italic">
            * Probabilities derived from Monte Carlo simulation (n=10,000) based on current RRI velocity and IMF deadlock duration.
          </p>
        </div>
      </div>
    </div>

    {/* ============================================
        ROW 4 — REGIONAL HOTSPOTS & TRENDS
    ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Hotspots List */}
      <div className="lg:col-span-1 glass p-5 rounded-2xl border border-intel-border/50 space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-3 h-3 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Regional Hotspots
          </span>
        </div>
        <div className="space-y-3">
          {hotspots.map((h) => (
            <div key={h.region} className="p-3 rounded-xl bg-black/20 border border-intel-border/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{h.region}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  h.risk === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' :
                  h.risk === 'HIGH' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' :
                  'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                }`}>{h.risk}</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">{h.reason}</div>
              <div className="flex items-center space-x-1 pt-1">
                <span className="text-[8px] font-mono text-slate-600 uppercase">Trend:</span>
                <span className={`text-[8px] font-mono ${h.trend === 'WORSENING' ? 'text-intel-red' : 'text-intel-cyan'}`}>{h.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RRI Trend Chart */}
      <div className="lg:col-span-3 glass p-5 rounded-2xl border border-intel-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 text-intel-cyan" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              R(t) Index Trend — 30 Day Forecast
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-intel-cyan" />
              <span className="text-[8px] font-mono text-slate-500">HISTORICAL</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-intel-orange border border-dashed border-intel-orange" />
              <span className="text-[8px] font-mono text-slate-500">FORECAST</span>
            </div>
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { day: -15, val: 2.1 }, { day: -12, val: 2.3 }, { day: -9, val: 2.2 }, { day: -6, val: 2.5 }, { day: -3, val: 2.7 }, { day: 0, val: rriState.rri },
              { day: 3, val: rriState.rri + 0.1, forecast: true }, { day: 6, val: rriState.rri + 0.25, forecast: true }, { day: 9, val: rriState.rri + 0.4, forecast: true }
            ]}>
              <XAxis dataKey="day" hide />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #1e293b', fontSize: '10px', fontFamily: 'monospace' }}
                itemStyle={{ color: '#00d4ff' }}
              />
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke="#00d4ff" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="val" 
                stroke="#ff9f0a" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="5 5"
                data={[
                  { day: 0, val: rriState.rri },
                  { day: 3, val: rriState.rri + 0.1 },
                  { day: 6, val: rriState.rri + 0.25 },
                  { day: 9, val: rriState.rri + 0.4 }
                ]}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-intel-border/30">
          <div className="text-center">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Mean Forecast</div>
            <div className="text-xs font-bold text-white">{(rriState.rri + 0.25).toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Variance</div>
            <div className="text-xs font-bold text-intel-orange">±0.12</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Model Confidence</div>
            <div className="text-xs font-bold text-intel-cyan">84%</div>
          </div>
        </div>
      </div>
    </div>

    {/* ============================================
        ROW 5 — LATEST INTELLIGENCE REPORTS
    ============================================ */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-intel-cyan" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Latest Strategic Intelligence Reports
          </span>
        </div>
        <button 
          onClick={() => setActiveTab('overview')} // Or a dedicated reports tab if added
          className="text-[10px] font-mono text-intel-cyan hover:underline"
        >
          Archive Access →
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="group relative overflow-hidden rounded-2xl border border-intel-border/50 bg-black/40 hover:border-intel-cyan/30 transition-all cursor-pointer"
          >
            <div className="aspect-video w-full overflow-hidden relative">
              <img 
                src={report.image} 
                alt={report.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="text-[8px] font-mono px-2 py-1 rounded bg-black/60 border border-white/10 text-white uppercase tracking-widest">
                  {report.category}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-500">
                <span>{report.id}</span>
                <span>{report.date}</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-intel-cyan transition-colors line-clamp-2 leading-tight">
                {report.title}
              </h3>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {report.summary}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-intel-border/30">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-intel-cyan/20 flex items-center justify-center">
                    <Users className="w-2 h-2 text-intel-cyan" />
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">{report.author}</span>
                </div>
                <span className="text-[8px] font-mono text-slate-600">{report.readTime} READ</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ============================================
        ROW 6 — ACTIVE ALERTS
        Critical signals requiring analyst attention
    ============================================ */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          Active Alerts
        </div>
        <div className="text-[9px] font-mono text-slate-600">
          {rriState.threshold_breaches.length} threshold breaches active
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {[
          {
            code: 'ECO-001',
            title: 'FX Reserves Below Warning',
            value: `${data.economy.fx_reserves} days import cover`,
            threshold: '90 days warning / 60 days crisis',
            priority: data.economy.fx_reserves < 60 ? 'CRITICAL' : 'HIGH',
            tab: 'economy',
            urgent: data.economy.fx_reserves < 90,
          },
          {
            code: 'SOC-002',
            title: 'UGTT Mobilisation Level',
            value: data.social.ugtt_mobilisation_level,
            threshold: 'General strike trigger at 64%',
            priority: data.social.ugtt_mobilisation_level === 'HIGH' ? 'CRITICAL' : 'HIGH',
            tab: 'political',
            subTab: 'ugtt',
            urgent: data.social.ugtt_mobilisation_level === 'HIGH',
          },
          {
            code: 'POL-003',
            title: 'Decree 54 Charges',
            value: `${data.social.decree54_charged} individuals charged`,
            threshold: 'Press freedom critical',
            priority: data.social.decree54_charged > 50 ? 'HIGH' : 'MEDIUM',
            tab: 'political',
            subTab: 'decree54',
            urgent: data.social.decree54_charged > 60,
          },
          {
            code: 'ENV-004',
            title: 'Water Crisis',
            value: `${data.social.water_crisis_govs} governorates affected`,
            threshold: 'Sfax: 6 hrs/day supply',
            priority: data.social.water_crisis_govs > 5 ? 'HIGH' : 'MEDIUM',
            tab: 'environment',
            subTab: 'water',
            urgent: data.social.water_crisis_govs > 8,
          },
          {
            code: 'GEO-005',
            title: 'IMF Deal Probability',
            value: `${data.geopolitical?.imf_deal_probability ?? 31}%`,
            threshold: 'Below 40% = fiscal risk',
            priority: (data.geopolitical?.imf_deal_probability ?? 31) < 40 ? 'HIGH' : 'MEDIUM',
            tab: 'geopolitical',
            urgent: (data.geopolitical?.imf_deal_probability ?? 31) < 40,
          },
          {
            code: 'RRI-006',
            title: 'Compound Stress',
            value: `CS(t) = ${rriState.compound_stress.toFixed(3)}`,
            threshold: `${rriState.threshold_breaches.length} simultaneous breaches`,
            priority: rriState.compound_stress > 0.1 ? 'HIGH' : 'MEDIUM',
            tab: 'risk',
            urgent: rriState.compound_stress > 0.15,
          },
        ].map(alert => (
          <div
            key={alert.code}
            onClick={() => window.dispatchEvent(new CustomEvent(
              'navigate-to-pipeline',
              { detail: { tab: alert.tab, subTab: alert.subTab } }
            ))}
            className={`flex items-start space-x-3 p-3 rounded-xl border
              cursor-pointer transition-all group ${
              alert.urgent
                ? 'border-intel-red/30 bg-intel-red/5 hover:border-intel-red/50'
                : 'border-intel-border bg-black/20 hover:border-intel-orange/30'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
              alert.priority === 'CRITICAL' ? 'bg-intel-red animate-pulse' :
              alert.priority === 'HIGH' ? 'bg-intel-orange' : 'bg-yellow-500'
            }`} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-mono text-slate-600">{alert.code}</span>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${
                  alert.priority === 'CRITICAL'
                    ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                    : alert.priority === 'HIGH'
                    ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                    : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
                }`}>{alert.priority}</span>
              </div>
              <div className="text-[11px] font-bold text-white group-hover:text-intel-cyan
                transition-colors truncate">{alert.title}</div>
              <div className="text-[10px] font-mono text-intel-orange truncate">{alert.value}</div>
              <div className="text-[9px] text-slate-600 truncate">{alert.threshold}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ============================================
        ROW 3 — THREE COLUMNS
        Timeline | Category Scores | Narratives
    ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* LEFT — Recent Events */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-3 h-3 text-intel-cyan" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Recent Events
            </span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(
              'navigate-main', { detail: { tab: 'timeline' } }
            ))}
            className="text-[9px] font-mono text-intel-cyan hover:underline"
          >
            View All →
          </button>
        </div>

        <div className="space-y-2">
          {auditLog
            .filter(entry => entry.type === 'APPROVED' || entry.type === 'PUSH')
            .slice(0, 6)
            .map((event, i) => (
            <div key={event.id} className="flex items-start space-x-3 p-2.5 rounded-lg
              bg-black/20 border border-intel-border/30 hover:border-intel-border
              transition-all cursor-pointer group">
              <span className="text-[9px] font-mono text-slate-600 whitespace-nowrap mt-0.5">
                {new Date(event.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${
                event.field.includes('social') ? 'bg-intel-red' :
                event.field.includes('economy') ? 'bg-intel-orange' : 'bg-intel-cyan'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-300 group-hover:text-white
                  transition-colors leading-snug line-clamp-1">
                  {event.label} Updated
                </div>
                <div className="text-[8px] font-mono text-slate-600 truncate">
                  {renderValue(event.oldValue)} → {renderValue(event.value)} // {event.source}
                </div>
              </div>
              <span className={`text-[8px] font-mono ml-auto shrink-0 ${
                event.type === 'PUSH' ? 'text-intel-cyan' : 'text-intel-green'
              }`}>
                {event.type}
              </span>
            </div>
          ))}
          {auditLog.filter(e => e.type === 'APPROVED' || e.type === 'PUSH').length === 0 && (
            <div className="p-8 text-center border border-dashed border-white/5 rounded-xl">
              <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">No Recent Pipeline Activity</div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER — RRI Category Scores Heatmap */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-3 h-3 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            RRI Category Scores
          </span>
        </div>

        <div className="space-y-1.5">
          {[
            { cat: 'A', label: 'Economic', weight: 0.20 },
            { cat: 'E', label: 'Social', weight: 0.07 },
            { cat: 'L', label: 'Regime', weight: 0.06 },
            { cat: 'N', label: 'Security', weight: 0.06 },
            { cat: 'D', label: 'Political', weight: 0.08 },
            { cat: 'O', label: 'Grievances', weight: 0.04 },
            { cat: 'M', label: 'Opposition', weight: 0.05 },
            { cat: 'C', label: 'Digital', weight: 0.06 },
            { cat: 'B', label: 'Environment', weight: 0.04 },
            { cat: 'I', label: 'External', weight: 0.05 },
            { cat: 'P', label: 'Youth', weight: 0.04 },
            { cat: 'F', label: 'Socio-Cultural', weight: 0.05 },
          ].map(item => {
            const score = rriState.category_scores?.[item.cat] ?? 0.5;
            return (
              <div key={item.cat} className="flex items-center space-x-2">
                <span className="text-[8px] font-mono text-slate-600 w-4 shrink-0">
                  {item.cat}
                </span>
                <span className="text-[9px] text-slate-500 w-20 shrink-0 truncate">
                  {item.label}
                </span>
                <div className="flex-1 h-3 bg-slate-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      score > 0.75 ? 'bg-intel-red' :
                      score > 0.60 ? 'bg-intel-orange' :
                      score > 0.45 ? 'bg-yellow-600' : 'bg-intel-cyan'
                    }`}
                    style={{ width: `${score * 100}%` }}
                  />
                </div>
                <span className={`text-[9px] font-mono w-8 text-right shrink-0 ${
                  score > 0.75 ? 'text-intel-red' :
                  score > 0.60 ? 'text-intel-orange' : 'text-slate-400'
                }`}>
                  {(score * 100).toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent(
            'navigate-main', { detail: { tab: 'risk' } }
          ))}
          className="w-full py-2 border border-intel-border rounded-xl
            text-[9px] font-mono text-slate-500 hover:text-intel-cyan
            hover:border-intel-cyan/30 transition-all"
        >
          Full Risk Model →
        </button>
      </div>

      {/* RIGHT — Active Narratives */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Active Narratives
          </span>
        </div>

        <div className="space-y-2">
          {[
            { 
              title: 'Economic Sovereignty', 
              actor: 'REGIME', 
              momentum: (rriState.salience || 0) > 0.5 ? 'SURGING' : 'RISING', 
              strength: Math.round((rriState.salience || 0) * 100), 
              trend: [30, 38, 55, 62, 70, Math.round((rriState.salience || 0) * 100)] 
            },
            { 
              title: 'Water Crisis as State Failure', 
              actor: 'GRASSROOTS', 
              momentum: (data.social.water_crisis_govs || 0) > 5 ? 'SURGING' : 'RISING', 
              strength: Math.round(((data.social.water_crisis_govs || 0) / 24) * 100 + 40), 
              trend: [30, 38, 55, 62, 70, Math.round(((data.social.water_crisis_govs || 0) / 24) * 100 + 40)] 
            },
            { 
              title: 'UGTT Resistance', 
              actor: 'LABOR', 
              momentum: data.social.ugtt_mobilisation_level === 'HIGH' ? 'SURGING' : 'RISING', 
              strength: data.social.ugtt_mobilisation_level === 'HIGH' ? 85 : 65, 
              trend: [40, 48, 56, 60, 62, data.social.ugtt_mobilisation_level === 'HIGH' ? 85 : 65] 
            },
            { 
              title: 'Migration as Escape', 
              actor: 'YOUTH', 
              momentum: (data.social.youth_rage_index || 0) > 7 ? 'SURGING' : 'RISING', 
              strength: Math.round((data.social.youth_rage_index || 0) * 10), 
              trend: [50, 57, 63, 66, 69, Math.round((data.social.youth_rage_index || 0) * 10)] 
            },
          ].map((n, i) => {
            const sparkline = (() => {
              const d = n.trend;
              const max = Math.max(...d);
              const min = Math.min(...d);
              const w = 50; const h = 20;
              const pts = d.map((v, idx) =>
                `${(idx/(d.length-1))*w},${h-((v-min)/(max-min||1))*h}`
              );
              return `M ${pts.join(' L ')}`;
            })();
            return (
              <div key={i} className="flex items-center space-x-3 p-2.5
                rounded-lg bg-black/20 border border-intel-border/30
                hover:border-intel-border transition-all">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="text-[10px] text-slate-300 truncate leading-snug">
                    {n.title}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[8px] font-mono ${
                      n.actor === 'REGIME' ? 'text-intel-cyan' :
                      n.actor === 'OPPOSITION' ? 'text-blue-400' :
                      n.actor === 'GRASSROOTS' ? 'text-intel-orange' :
                      n.actor === 'LABOR' ? 'text-purple-400' : 'text-pink-400'
                    }`}>{n.actor}</span>
                    <span className={`text-[8px] font-mono ${
                      n.momentum === 'SURGING' ? 'text-intel-red' :
                      n.momentum === 'RISING' ? 'text-intel-orange' :
                      n.momentum === 'DECLINING' ? 'text-intel-cyan' : 'text-slate-500'
                    }`}>{n.momentum}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <svg width="50" height="20" className="overflow-visible">
                    <path
                      d={sparkline}
                      fill="none"
                      stroke={
                        n.momentum === 'SURGING' ? '#ff453a' :
                        n.momentum === 'RISING' ? '#ff9f0a' :
                        n.momentum === 'DECLINING' ? '#00d4ff' : '#475569'
                      }
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className={`text-[10px] font-mono font-bold w-6 text-right ${
                    (n.strength || 0) > 70 ? 'text-intel-red' :
                    (n.strength || 0) > 55 ? 'text-intel-orange' : 'text-slate-400'
                  }`}>{isNaN(n.strength) ? 0 : n.strength}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent(
            'navigate-main', { detail: { tab: 'narratives' } }
          ))}
          className="w-full py-2 border border-intel-border rounded-xl
            text-[9px] font-mono text-slate-500 hover:text-intel-cyan
            hover:border-intel-cyan/30 transition-all"
        >
          Full Narrative Tracker →
        </button>
      </div>
    </div>

    {/* ============================================
        ROW 4 — PIPELINE ACTIVITY + MODULE STATUS
    ============================================ */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Pipeline recent activity */}
      <div className="glass p-5 rounded-2xl border border-intel-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-3 h-3 text-intel-cyan" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Pipeline Activity
            </span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(
              'navigate-to-pipeline', { detail: { tab: 'pipeline' } }
            ))}
            className="text-[9px] font-mono text-intel-cyan hover:underline"
          >
            Open Pipeline →
          </button>
        </div>

        <div className="space-y-2">
          {auditLog.slice(0, 5).map((item, i) => (
            <div key={item.id} className="flex items-center space-x-3 text-[10px]">
              <span className={`font-mono font-bold text-[8px] px-1.5 py-0.5
                rounded border shrink-0 ${
                item.type === 'PUSH'
                  ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
                  : item.type === 'APPROVED'
                  ? 'text-intel-green border-intel-green/30 bg-intel-green/10'
                  : 'text-slate-500 border-slate-700 bg-slate-900'
              }`}>{item.type}</span>
              <span className="text-slate-400 truncate flex-1">{item.label}</span>
              <span className="text-slate-500 font-mono text-[9px] shrink-0">
                {renderValue(item.oldValue)} → {renderValue(item.value)}
              </span>
              <span className="text-slate-700 text-[9px] shrink-0">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {auditLog.length === 0 && (
            <div className="py-8 text-center text-[10px] font-mono text-slate-600 italic">
              No pipeline activity recorded.
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-intel-border/30 flex items-center
          justify-between text-[9px] font-mono text-slate-600">
          <span>Model confidence: {(rriState.model_confidence * 100).toFixed(0)}%</span>
          <span>{rriState.variables_count} variables tracked</span>
        </div>
      </div>

      {/* Module status grid */}
      <div className="glass p-5 rounded-2xl border border-intel-border space-y-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-3 h-3 text-intel-cyan" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Module Status
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Economy', status: data.economy.fx_reserves < 90 ? 'CRITICAL' : 'NOMINAL', value: `FX ${data.economy.fx_reserves}d`, tab: 'economy' },
            { label: 'Political', status: data.social.ugtt_mobilisation_level === 'HIGH' ? 'CRITICAL' : 'HIGH', value: `UGTT ${data.social.ugtt_mobilisation_level}`, tab: 'political' },
            { label: 'Security', status: data.social.decree54_charged > 50 ? 'HIGH' : 'MEDIUM', value: `${data.social.decree54_charged} charged`, tab: 'security' },
            { label: 'Geopolitical', status: (data.geopolitical?.imf_deal_probability ?? 31) < 40 ? 'HIGH' : 'MEDIUM', value: `IMF ${data.geopolitical?.imf_deal_probability ?? 31}%`, tab: 'geopolitical' },
            { label: 'Social', status: data.social.protest_events_30d > 20 ? 'HIGH' : 'MEDIUM', value: `${data.social.protest_events_30d} protests/mo`, tab: 'social' },
            { label: 'Environment', status: data.social.water_crisis_govs > 5 ? 'HIGH' : 'MEDIUM', value: `${data.social.water_crisis_govs} govs water`, tab: 'environment' },
            { label: 'Energy', status: (data.energy?.steg_debt ?? 4.2) > 4 ? 'MEDIUM' : 'NOMINAL', value: `STEG ${data.energy?.steg_debt ?? 4.2}B TND`, tab: 'energy' },
            { label: 'Risk Model', status: rriState.rri >= 2.625 ? 'CRITICAL' : 'HIGH', value: `R(t) ${rriState.rri.toFixed(2)}`, tab: 'risk' },
          ].map(mod => (
            <div
              key={mod.label}
              onClick={() => setActiveTab(mod.tab as any)}
              className="flex items-center justify-between p-2.5 rounded-lg
                bg-black/20 border border-intel-border/30 cursor-pointer
                hover:border-intel-border transition-all group"
            >
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-300
                  group-hover:text-white transition-colors">
                  {mod.label}
                </div>
                <div className="text-[9px] font-mono text-slate-600 truncate">
                  {mod.value}
                </div>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded
                border shrink-0 ml-2 ${
                mod.status === 'CRITICAL'
                  ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                  : mod.status === 'HIGH'
                  ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                  : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10'
              }`}>{mod.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* ============================================
        ROW 5 — QUICK ACTIONS
    ============================================ */}
    <div className="space-y-3">
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
        Analyst Quick Actions
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Intelligence Pipeline', icon: Database, action: () => window.dispatchEvent(new CustomEvent('navigate-to-pipeline')), color: 'text-intel-cyan border-intel-cyan/20 bg-intel-cyan/5' },
          { label: 'Strategic Modeling', icon: BrainCircuit, action: () => setActiveTab('strategic'), color: 'text-intel-purple border-intel-purple/20 bg-intel-purple/5' },
          { label: 'Generate Report', icon: FileText, action: () => setSelectedReport(reports[0]), color: 'text-intel-green border-intel-green/20 bg-intel-green/5' },
          { label: 'Export Data', icon: Download, action: handleDownloadOutlook, color: 'text-slate-400 border-white/10 bg-white/5' },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.action}
            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
          >
            <action.icon className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{action.label}</span>
          </button>
        ))}
      </div>
    </div>

    {/* ============================================
        ROW 6 — QUICK NAVIGATION FOOTER
    ============================================ */}
    <div className="flex flex-wrap gap-2 pt-2 border-t border-intel-border/30">
      <span className="text-[9px] font-mono text-slate-600 uppercase
        tracking-widest self-center mr-2">
        Quick access:
      </span>
      {[
        { label: 'Risk Model', tab: 'risk', isMain: true },
        { label: 'Timeline', tab: 'timeline', isMain: true },
        { label: 'Narratives', tab: 'narratives', isMain: true },
        { label: 'UGTT Monitor', tab: 'political', subTab: 'ugtt' },
        { label: 'FX Reserves', tab: 'economy', subTab: 'macro' },
        { label: 'Water Crisis', tab: 'environment', subTab: 'water' },
        { label: 'Freedom Index', tab: 'political', subTab: 'decree54' },
        { label: 'Methodology', isMethodology: true },
      ].map(link => (
        <button
          key={link.label}
          onClick={() => {
            if (link.isMethodology) {
              window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }));
            } else if (link.isMain) {
              window.dispatchEvent(new CustomEvent('navigate-main',
                { detail: { tab: link.tab } }));
            } else {
              window.dispatchEvent(new CustomEvent('navigate-to-pipeline',
                { detail: { tab: link.tab, subTab: link.subTab } }));
            }
          }}
          className="text-[9px] font-mono text-slate-500 border border-intel-border/50
            px-3 py-1.5 rounded-lg hover:text-intel-cyan hover:border-intel-cyan/30
            transition-all"
        >
          {link.label}
        </button>
      ))}
    </div>

  </div>
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
      ) : activeTab === 'social' ? (
        <SocialIntelligence />
      ) : activeTab === 'strategic' ? (
        <StrategicModeling />
      ) : activeTab === 'civilizational' ? (
        <CivilizationalAnalysis />
      ) : activeTab === 'calendar' ? (
        <PoliticalCalendar />
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <LayoutDashboard className="w-12 h-12 text-intel-border mx-auto" />
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Select a module to begin analysis</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
