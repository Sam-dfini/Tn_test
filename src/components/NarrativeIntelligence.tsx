import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain, AlertTriangle, Eye, Shield, Zap,
  GitBranch, Radio, Search, RefreshCw,
  ChevronRight, ExternalLink, BarChart3,
  AlertCircle, CheckCircle, XCircle, Minus,
  Layers, Globe, Target, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { supabase, Article, Event } from '../lib/supabase';
import {
  analyzeLexical,
  computeCrossSource,
  synthesizeRealityGap,
  TUNISIAN_EUPHEMISM_MAP,
  REGIME_TALKING_POINTS,
} from '../services/narrativeEngine';
import { BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';
import { usePipeline } from '../context/PipelineContext';
import { assertKey, getRenderKey, prepareList, generateStableKey } from '../lib/keyUtils';

export const NarrativeIntelligence: React.FC = () => {
  const { rriState } = usePipeline();
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] =
    useState<Event | null>(null);
  const [crossSourceReport, setCrossSourceReport] =
    useState<any | null>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);
  const [synthesis, setSynthesis] = useState('');
  const [activeSection, setActiveSection] =
    useState<'overview' | 'sources' | 'omissions' | 'coordination' | 'lexicon'>('overview');

  // Load recent articles + events
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: arts, error: artErr }, { data: evts, error: evtErr }] = await Promise.all([
        supabase.from('articles')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(200),
        supabase.from('events')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('last_updated', { ascending: false })
          .limit(20),
      ]);
      
      if (artErr) console.error('Error fetching articles:', artErr);
      if (evtErr) console.error('Error fetching events:', evtErr);

      setArticles(arts || []);
      setEvents(evts || []);
    } catch (err) {
      console.error('Failed to load narrative data:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  // When event selected: compute cross-source report
  useEffect(() => {
    if (!selectedEvent) return;

    const eventArticles = processedArticles.filter(
      a => a.event_id === selectedEvent.id
    );

    if (eventArticles.length > 0) {
      const report = computeCrossSource(eventArticles as any);
      setCrossSourceReport({ ...report, event_id: selectedEvent.id, event_title: selectedEvent.title });

      // Generate AI synthesis
      setSynthesisLoading(true);
      synthesizeRealityGap(selectedEvent.title, report)
        .then(s => setSynthesis(s))
        .finally(() => setSynthesisLoading(false));
    }
  }, [selectedEvent, articles]);

  // ── Aggregate stats ───────────────────────────────────────
  const processedArticles = articles.map(a => {
    if (a.propaganda_score != null) return a;
    // Fallback to lexical analysis if deep analysis hasn't run
    const lexical = analyzeLexical(a.title, a.content || a.summary || '', a.bias_alignment);
    return {
      ...a,
      propaganda_score: lexical.propaganda_score,
      techniques_detected: lexical.techniques,
      euphemism_count: lexical.euphemism_count,
      unnamed_source_count: lexical.unnamed_source_count,
    };
  });

  const avgPropagandaScore = processedArticles.length > 0
    ? Math.round(processedArticles
        .filter(a => a.propaganda_score != null)
        .reduce((s, a) => s + (a.propaganda_score || 0), 0) /
        Math.max(processedArticles.filter(a => a.propaganda_score != null).length, 1))
    : 0;

  const sourceStats = (() => {
    const map: Record<string, {
      count: number; totalScore: number; name: string;
    }> = {};
    processedArticles.forEach(a => {
      if (!map[a.source_name]) {
        map[a.source_name] = { count: 0, totalScore: 0, name: a.source_name };
      }
      map[a.source_name].count++;
      map[a.source_name].totalScore += a.propaganda_score || 0;
    });
    return Object.values(map).map(s => ({
      name: s.name,
      count: s.count,
      avg_score: s.count > 0 ? Math.round(s.totalScore / s.count) : 0,
    })).sort((a, b) => b.avg_score - a.avg_score);
  })();

  const techniqueFrequency = (() => {
    const freq: Record<string, number> = {};
    processedArticles.forEach(a => {
      (a.techniques_detected || []).forEach(t => {
        freq[t] = (freq[t] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const processedEvents = events.map(e => {
    if (e.reality_gap_score != null && e.reality_gap_score > 0) return e;
    const eventArticles = processedArticles.filter(a => a.event_id === e.id);
    if (eventArticles.length < 2) return e;

    try {
      const report = computeCrossSource(eventArticles as any);
      return {
        ...e,
        reality_gap_score: report.reality_gap_score,
        coordination_signal: report.coordination_detected,
        omission_keywords: report.omission_gaps.map(g => g.keyword),
      };
    } catch (err) {
      console.error('Error computing cross-source for event:', e.id, err);
      return e;
    }
  });

  const highDivergenceEvents = processedEvents.filter(
    e => e.article_count > 1 &&
      ((e.reality_gap_score || 0) >= 40 || (e.critical_count > 0 && e.pro_gov_count > 0))
  );

  // ── Helpers ───────────────────────────────────────────────
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-intel-red';
    if (score >= 50) return 'text-intel-orange';
    if (score >= 25) return 'text-yellow-500';
    return 'text-intel-cyan';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-intel-red/10 border-intel-red/30';
    if (score >= 50) return 'bg-intel-orange/10 border-intel-orange/30';
    if (score >= 25) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-intel-cyan/10 border-intel-cyan/30';
  };

  const TECHNIQUE_LABELS: Record<string, string> = {
    EUPHEMISTIC_SUBSTITUTION: 'Euphemistic substitution',
    REGIME_TALKING_POINTS: 'Regime talking points',
    UNNAMED_SOURCE_LAUNDERING: 'Unnamed source laundering',
    ATTRIBUTION_ASYMMETRY: 'Attribution asymmetry',
    SEVERITY_MINIMIZATION: 'Severity minimization',
  };

  // ────────────────────────────────────────────────────────────
  // JSX
  // ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Narrative Intelligence"
        subtitle="ML-powered propaganda detection, source comparison, and reality gap synthesis"
        icon={Brain}
        nodeId="NARRATIVE-NODE-03"
      />
      {error && <div className="text-red-500">Error: {error}</div>}

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-20">
        {[
          {
            label: 'Articles Analyzed',
            value: processedArticles.filter(a => a.propaganda_score != null).length,
            color: 'text-white',
          },
          {
            label: 'Avg Propaganda Score',
            value: avgPropagandaScore + '/100',
            color: getScoreColor(avgPropagandaScore),
          },
          {
            label: 'High Divergence Events',
            value: highDivergenceEvents.length,
            color: 'text-intel-orange',
          },
          {
            label: 'Techniques Detected',
            value: techniqueFrequency.reduce((s, t) => s + t.count, 0),
            color: 'text-intel-red',
          },
        ].map(stat => (
          <div key={stat.label}
            className="glass p-4 rounded-2xl border
              border-intel-border space-y-1">
            <div className="text-[8px] font-mono text-slate-600
              uppercase tracking-widest">{stat.label}</div>
            <div className={`text-2xl font-bold font-mono
              ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── Section tabs ── */}
      <div className="flex items-center space-x-1 bg-black/40
        border border-intel-border rounded-xl p-1 w-fit
        overflow-x-auto scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'sources', label: 'Source Scores', icon: Radio },
          { id: 'omissions', label: 'Omission Map', icon: Eye },
          { id: 'coordination', label: 'Coordination', icon: GitBranch },
          { id: 'lexicon', label: 'Lexicon', icon: Layers },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`flex items-center space-x-2 px-3 py-2
                rounded-lg text-[9px] font-mono uppercase
                tracking-wider whitespace-nowrap transition-all ${
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
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >

          {/* ═══ SECTION: OVERVIEW ═══════════════════════════ */}
          {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Propaganda score by source chart */}
              <div className="glass p-6 rounded-2xl border
                border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">
                  Propaganda Score by Source
                </div>
                {sourceStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sourceStats.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 80, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" domain={[0, 100]}
                        tick={{ fill: '#475569', fontSize: 8 }} />
                      <YAxis type="category" dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 9,
                          fontFamily: 'monospace' }}
                        width={75} />
                      <Tooltip
                        contentStyle={{
                          background: '#0a0f1a',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '10px',
                        }}
                      />
                      <Bar dataKey="avg_score" name="Avg Score"
                        fill="#ff453a" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center
                    h-40 text-slate-700 text-[10px] font-mono">
                    No scored articles yet — RSS fetch needed
                  </div>
                )}
              </div>

              {/* Technique frequency */}
              <div className="glass p-6 rounded-2xl border
                border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">
                  Propaganda Techniques Detected
                </div>
                {techniqueFrequency.length > 0 ? (
                  <div className="space-y-3">
                    {techniqueFrequency.map(t => (
                      <div key={t.name} className="space-y-1">
                        <div className="flex justify-between
                          text-[9px] font-mono">
                          <span className="text-slate-400">
                            {TECHNIQUE_LABELS[t.name] || t.name}
                          </span>
                          <span className="text-intel-orange
                            font-bold">{t.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800
                          rounded-full overflow-hidden">
                          <div
                            className="h-full bg-intel-orange/70
                              rounded-full"
                            style={{
                              width: `${Math.min(
                                (t.count / Math.max(
                                  techniqueFrequency[0]?.count, 1
                                )) * 100, 100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center
                    h-40 text-slate-700 text-[10px] font-mono">
                    No technique data yet
                  </div>
                )}
              </div>

              {/* High-divergence events */}
              <div className="lg:col-span-2 glass p-6 rounded-2xl
                border border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">
                  Events with Narrative Conflict
                </div>
                <div className="space-y-2">
                  {highDivergenceEvents.length === 0 ? (
                    <div className="text-[10px] font-mono
                      text-slate-700 py-6 text-center">
                      No multi-source events with narrative conflict
                      detected yet.
                    </div>
                  ) : (
                    prepareList(highDivergenceEvents).map((event, idx) => {
                      const divergence = event.article_count > 0
                        ? Math.round(((event.critical_count +
                            event.alarmist_count) /
                            (event.article_count * 2)) * 100)
                        : 0;
                      return (
                        <motion.button
                          key={assertKey(getRenderKey(event, idx, 'ni'))}
                          onClick={() => {
                            setSelectedEvent(event);
                            setActiveSection('omissions');
                          }}
                          className="w-full flex items-center
                            justify-between p-4 rounded-xl border
                            border-intel-border/30 bg-black/20
                            hover:border-intel-orange/30
                            hover:bg-intel-orange/5 transition-all
                            group text-left"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-[11px] font-bold
                              text-white truncate group-hover:text-intel-orange
                              transition-colors">
                              {event.title}
                            </div>
                            <div className="text-[9px] font-mono
                              text-slate-600">
                              {event.article_count} sources ·{' '}
                              {event.critical_count} critical ·{' '}
                              {event.pro_gov_count} pro-gov
                            </div>
                          </div>
                          <div className="flex items-center
                            space-x-3 shrink-0">
                            <div className={`text-[10px] font-mono
                              font-bold ${divergence > 50
                                ? 'text-intel-red'
                                : 'text-intel-orange'
                              }`}>
                              {divergence}% divergence
                            </div>
                            <ChevronRight className="w-3.5 h-3.5
                              text-slate-600 group-hover:text-intel-orange
                              transition-colors" />
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SECTION: SOURCE SCORES ══════════════════════ */}
          {activeSection === 'sources' && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500
                leading-relaxed max-w-2xl">
                Propaganda score per source — average across all
                analyzed articles. Scores above 50 indicate
                systematic narrative distortion. Above 75 indicates
                active propaganda use.
              </p>
              <div className="space-y-3">
                {sourceStats.map((source, i) => (
                  <div key={source.name}
                    className={`p-5 rounded-2xl border space-y-3
                      ${getScoreBg(source.avg_score)}`}>
                    <div className="flex items-center
                      justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-[9px] font-mono
                          text-slate-600 w-6">
                          #{i + 1}
                        </span>
                        <div>
                          <div className="text-sm font-bold
                            text-white">{source.name}</div>
                          <div className="text-[9px] font-mono
                            text-slate-600">
                            {source.count} articles analyzed
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold
                          font-mono ${getScoreColor(source.avg_score)}`}>
                          {source.avg_score}
                        </div>
                        <div className="text-[8px] font-mono
                          text-slate-600">/ 100</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full
                      overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${source.avg_score}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className={`h-full rounded-full ${
                          source.avg_score >= 75 ? 'bg-intel-red' :
                          source.avg_score >= 50 ? 'bg-intel-orange' :
                          source.avg_score >= 25 ? 'bg-yellow-500' :
                          'bg-intel-cyan'
                        }`}
                      />
                    </div>
                    <div className="text-[9px] font-mono
                      text-slate-600">
                      {source.avg_score >= 75
                        ? '⚠ Active propaganda — treat all coverage with high skepticism'
                        : source.avg_score >= 50
                        ? '⚡ Significant framing — cross-reference with independent sources'
                        : source.avg_score >= 25
                        ? '· Some bias — generally usable with context'
                        : '✓ Relatively accurate — good primary source'}
                    </div>
                  </div>
                ))}
                {sourceStats.length === 0 && (
                  <div className="text-[11px] font-mono text-slate-700
                    text-center py-12">
                    No articles with propaganda scores yet.
                    RSS feeds will populate this after fetching.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ SECTION: OMISSION MAP ═══════════════════════ */}
          {activeSection === 'omissions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Event selector */}
              <div className="space-y-2 max-h-[600px]
                overflow-y-auto pr-1 scrollbar-thin
                scrollbar-thumb-intel-cyan/10">
                <div className="text-[9px] font-mono text-slate-600
                  uppercase tracking-widest px-1 mb-3">
                  Select event to analyze
                </div>
                {highDivergenceEvents.length === 0 ? (
                  <div className="text-[10px] font-mono text-slate-700
                    text-center py-8 border border-dashed
                    border-intel-border/30 rounded-xl">
                    No divergence events detected yet
                  </div>
                ) : (
                  highDivergenceEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-3 rounded-xl
                        border text-[10px] transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-intel-cyan/40 bg-intel-cyan/5 text-white'
                          : 'border-intel-border/30 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold line-clamp-1">
                        {event.title}
                      </div>
                      <div className="font-mono text-[8px]
                        text-slate-600 mt-0.5">
                        {event.article_count} sources ·
                        {event.reality_gap_score || 0}% gap
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Omission detail */}
              <div className="lg:col-span-2 space-y-5">
                {selectedEvent && crossSourceReport ? (
                  <>
                    {/* Reality gap header */}
                    <div className={`p-5 rounded-2xl border
                      space-y-3 ${getScoreBg(crossSourceReport.reality_gap_score)}`}>
                      <div className="flex items-center
                        justify-between">
                        <span className="text-[9px] font-mono
                          text-slate-500 uppercase tracking-widest">
                          Reality Gap Score
                        </span>
                        <span className={`text-4xl font-bold
                          font-mono ${getScoreColor(
                            crossSourceReport.reality_gap_score
                          )}`}>
                          {crossSourceReport.reality_gap_score}
                        </span>
                      </div>

                      {/* AI synthesis */}
                      {synthesisLoading ? (
                        <div className="flex items-center space-x-2
                          text-[10px] font-mono text-slate-600">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Synthesizing reality gap...</span>
                        </div>
                      ) : synthesis ? (
                        <p className="text-[11px] text-slate-300
                          leading-relaxed border-l-2
                          border-intel-cyan/30 pl-3 italic">
                          {synthesis}
                        </p>
                      ) : null}
                    </div>

                    {/* Omission gaps */}
                    <div className="glass p-5 rounded-2xl border
                      border-intel-border/50 space-y-4">
                      <div className="text-[9px] font-mono
                        text-slate-500 uppercase tracking-widest">
                        Omission Map — What Official Sources
                        Don't Report
                      </div>
                      {crossSourceReport.omission_gaps.length === 0 ? (
                        <div className="text-[10px] font-mono
                          text-slate-700 py-4 text-center">
                          No significant omissions detected between
                          critical and official sources.
                        </div>
                      ) : (
                        crossSourceReport.omission_gaps.map(
                          (gap: any, i: number) => (
                            <div key={i}
                              className={`p-4 rounded-xl border
                                space-y-2 ${
                              gap.significance === 'HIGH'
                                ? 'border-intel-red/20 bg-intel-red/5'
                                : 'border-intel-border/30 bg-black/20'
                            }`}>
                              <div className="flex items-center
                                justify-between">
                                <span className="text-[10px] font-bold
                                  text-white font-mono">
                                  "{gap.keyword}"
                                </span>
                                <span className={`text-[8px] font-mono
                                  px-1.5 py-0.5 rounded border ${
                                  gap.significance === 'HIGH'
                                    ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                                    : 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
                                }`}>
                                  {gap.significance}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3
                                text-[9px] font-mono">
                                <div className="space-y-1">
                                  <div className="text-intel-green
                                    flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Reported by:</span>
                                  </div>
                                  {gap.present_in.map((s: string, index: number) => (
                                    <div key={`${s}-${index}`}
                                      className="text-slate-400 pl-4">
                                      {s}
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-intel-red
                                    flex items-center space-x-1">
                                    <XCircle className="w-3 h-3" />
                                    <span>Omitted by:</span>
                                  </div>
                                  {gap.absent_from.map((s: string, index: number) => (
                                    <div key={`${s}-${index}`}
                                      className="text-slate-400 pl-4">
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>

                    {/* Coordination signal */}
                    {crossSourceReport.coordination_detected && (
                      <div className="p-5 rounded-2xl border
                        border-intel-red/30 bg-intel-red/5 space-y-3">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4
                            text-intel-red" />
                          <span className="text-[10px] font-mono
                            text-intel-red uppercase tracking-widest
                            font-bold">
                            Coordinated Narrative Detected
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Multiple official sources used identical
                          phrases within this event window — a signal
                          of coordinated messaging rather than
                          independent reporting.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {crossSourceReport.coordinated_phrases
                            .map((p: string) => (
                              <span key={p}
                                className="text-[9px] font-mono
                                  px-2 py-1 bg-intel-red/10 border
                                  border-intel-red/20 text-intel-red
                                  rounded">
                                "{p}"
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center
                    justify-center py-20 border border-dashed
                    border-intel-border/30 rounded-2xl space-y-3">
                    <Eye className="w-8 h-8 text-slate-800" />
                    <span className="text-[10px] font-mono
                      text-slate-700 uppercase tracking-widest">
                      Select an event to see omission map
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ SECTION: COORDINATION ═══════════════════════ */}
          {activeSection === 'coordination' && (
            <div className="space-y-6">
              <p className="text-[11px] text-slate-500
                leading-relaxed max-w-2xl">
                Coordinated narrative detection identifies when
                multiple state-aligned sources use identical or
                near-identical phrases within a short time window —
                a hallmark of centrally orchestrated messaging
                rather than independent journalism.
              </p>

              {/* Talking point frequency */}
              <div className="glass p-6 rounded-2xl border
                border-intel-border/50 space-y-4">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">
                  Regime Talking Point Frequency
                  (last 200 articles)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2
                  gap-3">
                  {REGIME_TALKING_POINTS.map(phrase => {
                    const count = articles.filter(
                      a => (a.title + ' ' + (a.content || ''))
                        .toLowerCase()
                        .includes(phrase.toLowerCase())
                    ).length;
                    if (count === 0) return null;
                    return (
                      <div key={phrase}
                        className="flex items-center justify-between
                          p-3 rounded-xl border border-intel-border/30
                          bg-black/20 text-[10px]">
                        <span className="font-mono text-slate-400
                          italic">"{phrase}"</span>
                        <span className="font-mono font-bold
                          text-intel-orange shrink-0 ml-2">
                          {count}×
                        </span>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
                {articles.every(a =>
                  REGIME_TALKING_POINTS.every(p =>
                    !(a.title + (a.content || '')).toLowerCase()
                      .includes(p.toLowerCase())
                  )
                ) && (
                  <div className="text-[10px] font-mono text-slate-700
                    text-center py-6">
                    No talking points detected in current articles.
                    Populate RSS feeds to see this data.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ SECTION: LEXICON ════════════════════════════ */}
          {activeSection === 'lexicon' && (
            <div className="space-y-6">
              <p className="text-[11px] text-slate-500
                leading-relaxed max-w-2xl">
                The Tunisian propaganda lexicon — state euphemisms
                mapped to their honest equivalents. This lexicon
                is applied to every article automatically.
                Weight indicates severity of propaganda use (1=mild,
                3=severe).
              </p>

              <div className="space-y-2">
                {[3, 2, 1].map(weight => (
                  <div key={weight} className="space-y-2">
                    <div className={`text-[9px] font-mono uppercase
                      tracking-widest ${
                      weight === 3 ? 'text-intel-red' :
                      weight === 2 ? 'text-intel-orange' :
                      'text-yellow-500'
                    }`}>
                      Weight {weight} —{' '}
                      {weight === 3 ? 'Severe distortion'
                        : weight === 2 ? 'Significant distortion'
                        : 'Mild bias'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2
                      gap-2">
                      {TUNISIAN_EUPHEMISM_MAP
                        .filter(([, , w]) => w === weight)
                        .map(([euphemism, honest]) => (
                          <div key={euphemism}
                            className={`flex items-start
                              justify-between p-3 rounded-xl border
                              text-[9px] font-mono space-x-3 ${
                            weight === 3
                              ? 'border-intel-red/20 bg-intel-red/5'
                              : weight === 2
                              ? 'border-intel-orange/20 bg-intel-orange/5'
                              : 'border-yellow-500/20 bg-yellow-500/5'
                          }`}>
                            <div className="space-y-0.5 min-w-0">
                              <div className="text-slate-300 italic
                                truncate">"{euphemism}"</div>
                              <div className="flex items-center
                                space-x-1">
                                <ChevronRight className="w-3 h-3
                                  text-slate-600 shrink-0" />
                                <span className={`${
                                  weight === 3 ? 'text-intel-red' :
                                  weight === 2 ? 'text-intel-orange' :
                                  'text-yellow-500'
                                } truncate`}>{honest}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
