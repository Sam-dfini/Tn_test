import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio, AlertTriangle, MapPin, Clock, BarChart3,
  ChevronRight, ShieldAlert, TrendingUp, TrendingDown,
  Minus, Search, Filter, RefreshCw, Zap, Brain,
  Sparkles, Globe, Eye, Target, Activity,
  ArrowUp, ArrowDown, ExternalLink, GitBranch,
  Layers, AlertCircle, Newspaper, Users, ChevronUp, ChevronDown
} from 'lucide-react';
import { BackgroundGrid, ModuleHeader } from './ProfessionalShared';
import { LiveSignalFeed } from './LiveSignalFeed';
import { RealTimeNewsFeed } from './RealTimeNewsFeed';
import { LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { supabase, Event, Article } from '../lib/supabase';
import { generateAnalystResponse } from '../services/geminiService';
import { usePipeline } from '../context/PipelineContext';
import { getSeverityLabel } from '../services/rssService';
import { SignalClassification } from '../services/signalClassifier';

import { useRSS } from '../context/RSSContext';
import { generateStableKey, assertKey, getUniqueKey, getRenderKey, prepareList } from '../lib/keyUtils';

export const EventsIntelligence: React.FC = () => {
  const { rriState, data } = usePipeline();
  const { events: contextEvents, isFetching: eventsFetching, fetchNow } = useRSS();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventArticles, setEventArticles] = useState<Article[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiScenarios, setAiScenarios] = useState<{
    stabilization: number;
    continued: number;
    escalation: number;
    reasoning: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeFeedTab, setActiveFeedTab] = useState<'NEWS' | 'SIGNAL'>('NEWS');

  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'analysis' | 'temporal'>('analysis');

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUp className="w-2.5 h-2.5 text-intel-red" />;
    if (trend === 'down') return <ArrowDown className="w-2.5 h-2.5 text-intel-green" />;
    return <Minus className="w-2.5 h-2.5 text-slate-500" />;
  };

  const getStatusIndicator = (event: Event) => {
    if (event.is_critical || event.status === 'escalating') {
      return (
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-intel-red animate-ping" />
          <span className="text-[8px] font-mono font-bold text-intel-red">CRITICAL/ESCALATING</span>
        </div>
      );
    }
    if (event.status === 'emerging') {
      return (
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-intel-cyan" />
          <span className="text-[8px] font-mono font-bold text-intel-cyan">EMERGING</span>
        </div>
      );
    }
    if (event.status === 'cooling') {
      return (
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-[8px] font-mono font-bold text-slate-500">COOLING</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1.5">
        <div className="w-2 h-2 rounded-full bg-intel-green" />
        <span className="text-[8px] font-mono font-bold text-intel-green">STABLE</span>
      </div>
    );
  };

  // Use events from context with filtering
  const events = useMemo(() => {
    let list = contextEvents || [];
    if (filterCategory !== 'all') {
      list = list.filter(e => e.category === filterCategory);
    }
    return list;
  }, [contextEvents, filterCategory]);

  const loading = eventsFetching && events.length === 0;

  // Fetch articles for selected event
  const fetchEventArticles = useCallback(async (eventId: string) => {
    try {
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .eq('event_id', eventId)
        .order('published_at', { ascending: false });

      if (error) throw error;
      
      const results = articles || [];
      
      // Deduplicate by ID
      const uniqueArticles = Array.from(new Map(results.map(a => [a.id, a])).values());
      setEventArticles(uniqueArticles);
      return uniqueArticles;
    } catch (err) {
      console.error('Error fetching articles:', err);
      return [];
    }
  }, []);

  // Generate AI analysis for selected event
  const generateEventAnalysis = useCallback(async (
    event: Event,
    articles: Article[]
  ) => {
    setAiLoading(true);
    setAiAnalysis('');
    setAiScenarios(null);

    try {
      const sourcesSummary = articles.slice(0, 6).map(a =>
        `${a.source_name} (${a.bias_alignment || 'NEUTRAL'}/${a.bias_tone || 'NEUTRAL'}): "${a.title}"`
      ).join('\n');

      const divergenceScore = event.article_count > 0
        ? Math.round(((event.critical_count + event.alarmist_count) /
            (event.article_count * 2)) * 100)
        : 0;

      const prompt = `You are a senior political intelligence analyst for Tunisia.

EVENT: ${event.title}
Category: ${event.category}
Location: ${event.governorate || 'National'}
Severity: ${event.severity}/5
Article count: ${event.article_count}
Source alignment — Critical: ${event.critical_count}, Neutral: ${event.neutral_count}, Pro-gov: ${event.pro_gov_count}
Narrative tone — Alarmist: ${event.alarmist_count}, Minimizing: ${event.minimizing_count}
Narrative divergence: ${divergenceScore}%

Source coverage:
${sourcesSummary}

Current context: R(t)=${rriState.rri.toFixed(2)}, UGTT=${data.social.ugtt_mobilisation_level}, Protests=${data.social.protest_events_30d}/month

Write a 3-sentence intelligence assessment of this event.
Then on a new line write: SCENARIOS:stabilization_pct:continued_pct:escalation_pct:one_sentence_reasoning
Example: SCENARIOS:25:45:30:Multi-source confirmation and prior pattern suggest continued pressure.

Keep assessment direct, analyst-style, no hedging. Focus on what divergence between sources reveals.`;

      const response = await generateAnalystResponse(prompt, {});

      if (response) {
        const lines = response.split('\n');
        const scenarioLine = lines.find(l => l.startsWith('SCENARIOS:'));
        const analysisLines = lines
          .filter(l => !l.startsWith('SCENARIOS:'))
          .join(' ')
          .trim();

        setAiAnalysis(analysisLines);

        if (scenarioLine) {
          const parts = scenarioLine.replace('SCENARIOS:', '').split(':');
          if (parts.length >= 4) {
            setAiScenarios({
              stabilization: parseInt(parts[0]) || 25,
              continued: parseInt(parts[1]) || 45,
              escalation: parseInt(parts[2]) || 30,
              reasoning: parts.slice(3).join(':'),
            });
          }
        }
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
      setAiAnalysis('AI analysis unavailable. Check Gemini API key.');
    } finally {
      setAiLoading(false);
    }
  }, [rriState, data]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventArticles(selectedEvent.id).then(articles => {
        generateEventAnalysis(selectedEvent, articles);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id]);

  // ── Helpers ───────────────────────────────────────────────
  const getDivergenceScore = (event: Event) => {
    if (!event.article_count) return 0;
    return Math.round(((event.critical_count + event.alarmist_count) /
      (event.article_count * 2)) * 100);
  };

  const getRiskScore = (event: Event) => {
    // 0-100 composite risk score
    const severityScore = event.severity * 15;
    const divergenceBonus = getDivergenceScore(event) * 0.3;
    const sourceBonus = Math.min(event.article_count * 3, 20);
    return Math.min(100, Math.round(severityScore + divergenceBonus + sourceBonus));
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-intel-red';
    if (score >= 50) return 'text-intel-orange';
    if (score >= 25) return 'text-yellow-500';
    return 'text-intel-cyan';
  };

  const getRiskBorder = (score: number) => {
    if (score >= 75) return 'border-intel-red/30 bg-intel-red/5';
    if (score >= 50) return 'border-intel-orange/30 bg-intel-orange/5';
    return 'border-intel-border bg-black/40';
  };

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, typeof Radio> = {
      protest: Activity,
      arrest: ShieldAlert,
      economic: BarChart3,
      political: Target,
      water: Layers,
      migration: Globe,
      labor: Zap,
      rights: Eye,
    };
    return icons[cat] || Radio;
  };

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    return e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.governorate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ── Mock timeline data (from article timestamps) ──────────
  const buildTimeline = (articles: Article[]) => {
    if (!articles.length) return [];
    const sorted = [...articles].sort(
      (a, b) => new Date(a.published_at).getTime() -
                 new Date(b.published_at).getTime()
    );
    return sorted.map((a, i) => ({
      time: new Date(a.published_at).toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit'
      }),
      sources: i + 1,
      severity: a.severity,
    }));
  };

  // ────────────────────────────────────────────────────────────
  // JSX
  // ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-12 pb-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />

      {/* ── Header — matches other tabs ── */}
      <div className="flex flex-col md:flex-row md:items-center
        justify-between gap-4 relative z-20">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <Radio className="w-5 h-5 text-intel-cyan" />
            <h2 className="text-sm font-bold text-white uppercase
              tracking-[0.15em]">
              Event Engine // Narrative Intelligence
            </h2>
          </div>
          <p className="text-[10px] font-mono text-slate-500 uppercase
            tracking-widest pl-8">
            AI-powered event clustering · Source comparison ·
            Narrative divergence detection
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="flex items-center bg-black/40 border
            border-intel-border rounded-xl px-3 py-2 space-x-2
            focus-within:border-intel-cyan/40 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="bg-transparent text-[10px] font-mono
                text-slate-300 placeholder-slate-700 focus:outline-none
                w-36"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center bg-black/40 border
            border-intel-border rounded-xl px-3 py-2 space-x-2">
            <Filter className="w-3 h-3 text-slate-500 shrink-0" />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-transparent text-[10px] font-mono
                text-slate-300 focus:outline-none uppercase"
            >
              <option value="all">All</option>
              <option value="protest">Protest</option>
              <option value="economic">Economic</option>
              <option value="political">Political</option>
              <option value="arrest">Arrest</option>
              <option value="water">Water</option>
              <option value="migration">Migration</option>
              <option value="labor">Labor</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchNow(true)}
            className="p-2 rounded-xl border border-intel-border
              hover:border-intel-cyan/30 hover:bg-white/5
              transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${
              eventsFetching ? 'animate-spin text-intel-cyan' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Priority Alerts',
            value: events.filter(e => e.priority_score > 7).length,
            color: 'text-intel-red',
          },
          {
            label: 'Escalating',
            value: events.filter(e => e.status === 'escalating').length,
            color: 'text-intel-orange',
          },
          {
            label: 'High Divergence',
            value: events.filter(e => getDivergenceScore(e) > 60).length,
            color: 'text-intel-cyan',
          },
          {
            label: 'Avg Priority',
            value: events.length > 0 ? (events.reduce((s, e) => s + (e.priority_score || 0), 0) / events.length).toFixed(1) : '0.0',
            color: 'text-white',
          },
        ].map(stat => (
          <div key={stat.label}
            className="glass p-4 rounded-2xl border border-intel-border
              space-y-1">
            <div className="text-[8px] font-mono text-slate-600
              uppercase tracking-widest">{stat.label}</div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Event List ── */}
        <div className="lg:col-span-1 space-y-2 max-h-[900px]
          overflow-y-auto pr-1 scrollbar-thin
          scrollbar-thumb-intel-cyan/10">

          {loading ? (
            <div className="flex flex-col items-center justify-center
              py-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-intel-cyan
                animate-spin" />
              <span className="text-[10px] font-mono text-slate-600
                uppercase tracking-widest">
                Clustering events...
              </span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center
              py-20 border border-dashed border-intel-border/50
              rounded-2xl space-y-3">
              <Radio className="w-8 h-8 text-slate-700" />
              <span className="text-[10px] font-mono text-slate-600
                uppercase tracking-widest">
                {events.length === 0
                  ? 'No events yet — RSS feeds will populate this'
                  : 'No events match filter'}
              </span>
              <p className="text-[9px] text-slate-700 text-center
                max-w-[200px] leading-relaxed">
                Events are created automatically when multiple
                articles cover the same incident.
              </p>
            </div>
          ) : (
            prepareList(filteredEvents)
              .map((event, eventIdx) => {
              const riskScore = getRiskScore(event);
              const divergence = getDivergenceScore(event);
              const CatIcon = getCategoryIcon(event.category);
              const isSelected = selectedEvent?.id === event.id;
              const isExpanded = expandedEventId === event.id;

              const severityLabel = event.severity >= 5 ? 'SYSTEMIC RISK' : 
                                   event.severity >= 4 ? 'POTENTIAL CATALYST' : 
                                   event.severity >= 3 ? 'CRITICAL' : 
                                   event.severity >= 2 ? 'HIGH' : 'LOCALIZED IMPACT';
              const severityColor = event.severity >= 5 ? 'text-intel-red border-intel-red/40 bg-intel-red/15 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                   event.severity >= 4 ? 'text-intel-orange border-intel-orange/40 bg-intel-orange/15 shadow-[0_0_10px_rgba(249,115,22,0.2)]' :
                                   event.severity >= 3 ? 'text-intel-red border-intel-red/30 bg-intel-red/10' :
                                   event.severity >= 2 ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' :
                                   'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10';

              return (
                <motion.div
                  key={generateStableKey(event)}
                  layout
                  className={`w-full rounded-2xl border transition-all overflow-hidden ${
                    isSelected
                      ? 'border-intel-cyan/40 bg-intel-cyan/5'
                      : `hover:border-slate-700 ${getRiskBorder(riskScore)}`
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <CatIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${severityColor}`}>
                          {severityLabel} (LVL {event.severity})
                        </span>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-mono font-bold ${getRiskColor(riskScore)}`}>
                            P: {(event.priority_score || 0).toFixed(1)}
                          </span>
                          {getTrendIcon(event.trend || 'stable')}
                        </div>
                        {getStatusIndicator(event)}
                      </div>
                    </div>

                    {/* Title */}
                    <button 
                      onClick={() => setSelectedEvent(event)}
                      className="text-[11px] font-bold text-white leading-snug line-clamp-2 text-left hover:text-intel-cyan transition-colors w-full"
                    >
                      {event.title}
                    </button>

                    {/* Location + sources */}
                    <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-600">
                      {event.governorate && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{event.governorate}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-2.5 h-2.5" />
                        <span>{event.article_count} sources</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedEventId(isExpanded ? null : event.id);
                        }}
                        className="ml-auto p-1 hover:bg-white/5 rounded transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Narrative divergence bar */}
                    <div className="space-y-1">
                      <div className="flex h-1.5 w-full bg-slate-800/60 rounded-full overflow-hidden">
                        <div className="bg-intel-red/80 h-full transition-all"
                          style={{ width: `${event.article_count ? (event.critical_count / event.article_count) * 100 : 0}%` }}
                        />
                        <div className="bg-slate-500/50 h-full transition-all"
                          style={{ width: `${event.article_count ? (event.neutral_count / event.article_count) * 100 : 0}%` }}
                        />
                        <div className="bg-intel-green/80 h-full transition-all"
                          style={{ width: `${event.article_count ? (event.pro_gov_count / event.article_count) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Collapsible details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pt-3 border-t border-white/5 space-y-3"
                        >
                          {event.description && (
                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="space-y-1.5">
                            <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Grounding Summary</div>
                            <div className="text-[9px] text-slate-500 flex flex-wrap gap-2">
                              {event.pro_gov_count > 0 && <span className="text-intel-green">Pro-Gov: {event.pro_gov_count}</span>}
                              {event.critical_count > 0 && <span className="text-intel-red">Critical: {event.critical_count}</span>}
                              {event.neutral_count > 0 && <span className="text-slate-400">Neutral: {event.neutral_count}</span>}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[8px] font-mono text-slate-700">
                              {new Date(event.last_updated).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            <button 
                              onClick={() => setSelectedEvent(event)}
                              className="text-[9px] font-mono text-intel-cyan hover:underline"
                            >
                              FULL ANALYSIS →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Right: Event Intelligence View ── */}
        <div className="lg:col-span-2 space-y-5">
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* ── EVENT IDENTITY HEADER ── */}
                <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/5 mb-4">
                  <button
                    onClick={() => setActiveDetailTab('analysis')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                      activeDetailTab === 'analysis' 
                        ? 'bg-intel-cyan text-black font-bold' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Analysis
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('temporal')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${
                      activeDetailTab === 'temporal' 
                        ? 'bg-intel-cyan text-black font-bold' 
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    Temporal
                  </button>
                </div>

                {activeDetailTab === 'analysis' ? (
                  <div className="space-y-5">
                    {/* ── AI INTELLIGENCE ANALYSIS ── */}
                    <div className="glass p-6 rounded-2xl border
                      border-intel-border/50 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-intel-cyan" />
                        <span className="text-[10px] font-mono
                          text-slate-500 uppercase tracking-widest">
                          AI Intelligence Assessment
                        </span>
                        {aiLoading && (
                          <RefreshCw className="w-3 h-3 text-intel-cyan
                            animate-spin ml-auto" />
                        )}
                      </div>

                      {aiLoading ? (
                        <div className="space-y-2">
                          {prepareList([80, 60, 70]).map((w: any, i: number) => (
                            <div key={assertKey(getRenderKey(w, i, 'ai-shimmer'))} className={`h-3 bg-slate-800
                              rounded animate-pulse`}
                              style={{ width: `${w}%` }} />
                          ))}
                        </div>
                      ) : aiAnalysis ? (
                        <p className="text-sm text-slate-300 leading-relaxed
                          border-l-2 border-intel-cyan/40 pl-4">
                          {aiAnalysis}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600 italic">No analysis available.</p>
                      )}
                    </div>

                    {/* ── GROUNDING SOURCES ── */}
                    <div className="glass p-6 rounded-2xl border
                      border-intel-border/50 space-y-3">
                      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Source Grounding</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {prepareList(eventArticles).map((article, aIdx) => (
                          <a 
                            key={assertKey(getRenderKey(article, aIdx, 'art'))}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:border-intel-cyan/30 transition-all group"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-slate-300 truncate group-hover:text-intel-cyan transition-colors">
                                {article.title}
                              </span>
                              <span className="text-[8px] font-mono text-slate-600">
                                {article.source_name} · {new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[7px] font-mono border ${
                              article.bias_alignment === 'CRITICAL' ? 'text-intel-red border-intel-red/20 bg-intel-red/5' :
                              article.bias_alignment === 'PRO_GOV' ? 'text-intel-green border-intel-green/20 bg-intel-green/5' :
                              'text-slate-500 border-white/10 bg-white/5'
                            }`}>
                              {article.bias_alignment}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* ── PREDICTIVE SCENARIOS ── */}
                    {aiScenarios && (
                      <div className="glass p-6 rounded-2xl border
                        border-intel-border/50 space-y-3">
                        <div className="text-[9px] font-mono
                          text-slate-500 uppercase tracking-widest">
                          24h Scenario Projection
                        </div>
                        <div className="space-y-2">
                          {[
                            {
                              label: 'Stabilization',
                              pct: aiScenarios.stabilization,
                              color: 'bg-intel-green',
                              textColor: 'text-intel-green',
                            },
                            {
                              label: 'Continued Tension',
                              pct: aiScenarios.continued,
                              color: 'bg-intel-orange',
                              textColor: 'text-intel-orange',
                            },
                            {
                              label: 'Escalation',
                              pct: aiScenarios.escalation,
                              color: 'bg-intel-red',
                              textColor: 'text-intel-red',
                            },
                          ].map(s => (
                            <div key={s.label} className="space-y-1">
                              <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-slate-400">{s.label}</span>
                                <span className={s.textColor}>{s.pct}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                <div className={`${s.color} h-full`} style={{ width: `${s.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-500 italic pt-2">{aiScenarios.reasoning}</p>
                      </div>
                    )}
                  </div>

                ) : (
                  <div className="h-[600px] overflow-y-auto">
                    {/* <TemporalAnalysisTab /> */}
                  </div>
                )}

                {/* ── NARRATIVE INTELLIGENCE ── */}
                <div className="glass p-6 rounded-2xl border
                  border-intel-border/50 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-intel-orange" />
                    <span className="text-[10px] font-mono
                      text-slate-500 uppercase tracking-widest">
                      Narrative Intelligence
                    </span>
                    {/* Divergence level badge */}
                    <span className={`text-[8px] font-mono px-2 py-0.5
                      rounded border ml-auto ${
                      getDivergenceScore(selectedEvent) > 60
                        ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                        : getDivergenceScore(selectedEvent) > 30
                        ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                        : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
                    }`}>
                      {getDivergenceScore(selectedEvent) > 60
                        ? 'HIGH DIVERGENCE'
                        : getDivergenceScore(selectedEvent) > 30
                        ? 'MODERATE DIVERGENCE'
                        : 'LOW DIVERGENCE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {/* Alignment */}
                    <div className="p-4 rounded-xl bg-black/40
                      border border-intel-border/40 space-y-3">
                      <div className="text-[8px] font-mono
                        text-slate-600 uppercase">Source Alignment</div>
                      {[
                        {
                          label: 'Critical',
                          count: selectedEvent.critical_count,
                          color: 'bg-intel-red',
                          textColor: 'text-intel-red',
                        },
                        {
                          label: 'Neutral',
                          count: selectedEvent.neutral_count,
                          color: 'bg-slate-500',
                          textColor: 'text-slate-400',
                        },
                        {
                          label: 'Pro-Gov',
                          count: selectedEvent.pro_gov_count,
                          color: 'bg-intel-green',
                          textColor: 'text-intel-green',
                        },
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between
                            text-[9px] font-mono">
                            <span className={item.textColor}>
                              {item.label}
                            </span>
                            <span className="text-white font-bold">
                              {item.count}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-800
                            rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color}`}
                              style={{
                                width: selectedEvent.article_count
                                  ? `${(item.count /
                                    selectedEvent.article_count) * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tone */}
                    <div className="p-4 rounded-xl bg-black/40
                      border border-intel-border/40 space-y-3">
                      <div className="text-[8px] font-mono
                        text-slate-600 uppercase">Narrative Tone</div>
                      {[
                        {
                          label: 'Alarmist',
                          count: selectedEvent.alarmist_count,
                          color: 'bg-intel-red',
                          textColor: 'text-intel-red',
                        },
                        {
                          label: 'Neutral',
                          count: selectedEvent.neutral_count,
                          color: 'bg-slate-500',
                          textColor: 'text-slate-400',
                        },
                        {
                          label: 'Minimizing',
                          count: selectedEvent.minimizing_count,
                          color: 'bg-intel-cyan',
                          textColor: 'text-intel-cyan',
                        },
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between
                            text-[9px] font-mono">
                            <span className={item.textColor}>
                              {item.label}
                            </span>
                            <span className="text-white font-bold">
                              {item.count}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-800
                            rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color}`}
                              style={{
                                width: selectedEvent.article_count
                                  ? `${(item.count /
                                    selectedEvent.article_count) * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divergence gauge */}
                    <div className="p-4 rounded-xl bg-black/40
                      border border-intel-border/40 space-y-3
                      flex flex-col items-center justify-center">
                      <div className="text-[8px] font-mono
                        text-slate-600 uppercase">Divergence Index</div>
                      <div className={`text-4xl font-bold font-mono
                        ${getDivergenceScore(selectedEvent) > 60
                          ? 'text-intel-red'
                          : getDivergenceScore(selectedEvent) > 30
                          ? 'text-intel-orange'
                          : 'text-intel-cyan'
                        }`}>
                        {getDivergenceScore(selectedEvent)}%
                      </div>
                      <div className="text-[8px] font-mono
                        text-slate-600 text-center">
                        {getDivergenceScore(selectedEvent) > 60
                          ? 'Narratives conflict significantly'
                          : getDivergenceScore(selectedEvent) > 30
                          ? 'Partial narrative conflict'
                          : 'Sources broadly agree'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SOURCE INTELLIGENCE FEED ── */}
                <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-intel-border/30 pb-4">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => setActiveFeedTab('NEWS')}
                        className={`flex items-center space-x-2 pb-2 transition-all relative ${
                          activeFeedTab === 'NEWS' ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        <Newspaper className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">News Feed</span>
                        {activeFeedTab === 'NEWS' && (
                          <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
                        )}
                      </button>
                      <button
                        onClick={() => setActiveFeedTab('SIGNAL')}
                        className={`flex items-center space-x-2 pb-2 transition-all relative ${
                          activeFeedTab === 'SIGNAL' ? 'text-intel-orange' : 'text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">Signal Intelligence</span>
                        {activeFeedTab === 'SIGNAL' && (
                          <motion.div layoutId="feedTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-orange" />
                        )}
                      </button>
                    </div>
                    {activeFeedTab === 'NEWS' && (
                      <span className="text-[9px] font-mono text-slate-700">
                        ({eventArticles.length} articles)
                      </span>
                    )}
                  </div>

                  {activeFeedTab === 'NEWS' ? (
                    eventArticles.length > 0 ? (
                      <div className="space-y-4">
                        {/* Group by alignment */}
                        {['CRITICAL', 'NEUTRAL', 'PRO_GOV'].map(alignment => {
                          const alignmentArticles = eventArticles.filter(
                            a => (a.bias_alignment || 'NEUTRAL') === alignment
                          );
                          if (!alignmentArticles.length) return null;

                          const alignmentColors: Record<string, string> = {
                            CRITICAL: 'text-intel-red border-intel-red/20',
                            NEUTRAL: 'text-slate-400 border-slate-700',
                            PRO_GOV: 'text-intel-green border-intel-green/20',
                          };
                          const alignmentLabels: Record<string, string> = {
                            CRITICAL: 'Critical / Independent',
                            NEUTRAL: 'Neutral',
                            PRO_GOV: 'Pro-Government / Official',
                          };

                          return (
                            <div key={alignment} className="space-y-2">
                              <div className={`text-[9px] font-mono
                                uppercase tracking-widest px-2
                                ${alignmentColors[alignment]}`}>
                                {alignmentLabels[alignment]} ·{' '}
                                {alignmentArticles.length} source
                                {alignmentArticles.length > 1 ? 's' : ''}
                              </div>

                              {prepareList(alignmentArticles)
                                .map((article: any, aIdx: number) => (
                                <div key={assertKey(getRenderKey(article, aIdx, 'ev-art'))}
                                  className="p-4 rounded-xl border
                                    border-intel-border/30 bg-black/20
                                    hover:bg-black/40 transition-colors
                                    group space-y-2">
                                  <div className="flex items-start
                                    justify-between gap-2">
                                    <div className="flex items-center
                                      space-x-2 flex-wrap gap-1">
                                      <span className="text-[10px]
                                        font-mono font-bold
                                        text-intel-cyan">
                                        {article.source_name}
                                      </span>
                                      {article.bias_tone && (
                                        <span className={`text-[8px]
                                          font-mono px-1.5 py-0.5 rounded
                                          border ${
                                          article.bias_tone === 'ALARMIST'
                                            ? 'text-intel-red border-intel-red/20 bg-intel-red/10'
                                            : article.bias_tone === 'MINIMIZING'
                                            ? 'text-intel-cyan border-intel-cyan/20 bg-intel-cyan/10'
                                            : 'text-slate-500 border-slate-700'
                                        }`}>
                                          {article.bias_tone}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[8px] font-mono
                                      text-slate-700 shrink-0">
                                      {new Date(article.published_at)
                                        .toLocaleTimeString('en-GB', {
                                          hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                  </div>

                                  <p className="text-[11px] font-medium
                                    text-slate-200 group-hover:text-white
                                    transition-colors leading-snug">
                                    {article.title}
                                  </p>

                                  {article.ai_summary && (
                                    <p className="text-[10px] text-slate-500
                                      italic border-l-2
                                      border-intel-cyan/20 pl-3 py-0.5
                                      leading-snug">
                                      {article.ai_summary}
                                    </p>
                                  )}

                                  <div className="flex items-center
                                    justify-between pt-1">
                                    <div className="flex items-center
                                      space-x-1 text-[8px] font-mono
                                      text-slate-700">
                                      {article.governorate && (
                                        <>
                                          <MapPin className="w-2.5 h-2.5" />
                                          <span>{article.governorate}</span>
                                        </>
                                      )}
                                    </div>
                                    <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] font-mono
                                        text-slate-600 hover:text-intel-cyan
                                        flex items-center space-x-1
                                        transition-colors"
                                    >
                                      <span>View source</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <p className="text-[10px] font-mono text-slate-600 uppercase">No articles found for this event</p>
                      </div>
                    )
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <LiveSignalFeed maxItems={10} showFilter={true} compact={true} />
                    </div>
                  )}
                </div>

                {/* ── TIMELINE (from article timestamps) ── */}
                {eventArticles.length >= 2 && (
                  <div className="glass p-6 rounded-2xl border
                    border-intel-border/50 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-intel-orange" />
                      <span className="text-[10px] font-mono
                        text-slate-500 uppercase tracking-widest">
                        Event Timeline
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={buildTimeline(eventArticles)}>
                        <CartesianGrid strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="time"
                          tick={{ fill: '#475569', fontSize: 8,
                            fontFamily: 'monospace' }}
                          axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ background: '#0a0f1a',
                            border: '1px solid #1e293b',
                            borderRadius: '8px', fontSize: '10px',
                            fontFamily: 'monospace' }}
                        />
                        <Line type="monotone" dataKey="sources"
                          stroke="#00d4ff" strokeWidth={2}
                          dot={{ fill: '#00d4ff', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-start space-x-2 text-[9px]
                      font-mono">
                      <span className="text-slate-600">First signal:</span>
                      <span className="text-white">
                        {new Date(eventArticles[eventArticles.length - 1]
                          ?.published_at)
                          .toLocaleString('en-GB')}
                      </span>
                      <span className="text-slate-700 mx-2">·</span>
                      <span className="text-slate-600">Last update:</span>
                      <span className="text-intel-cyan">
                        {new Date(eventArticles[0]?.published_at)
                          .toLocaleString('en-GB')}
                      </span>
                    </div>
                  </div>
                )}

              </motion.div>
            ) : (
              /* Global Intelligence View when no event is selected */
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <Globe className="w-5 h-5 text-intel-cyan animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                    Global Intelligence Stream
                  </h3>
                </div>
                <RealTimeNewsFeed hideBackground={true} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
