import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Filter, Download, Search, AlertCircle, ChevronUp, ChevronDown, MapPin, User, ExternalLink, RefreshCw } from 'lucide-react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { supabase, Article } from '../../lib/supabase';

const typeColors: Record<string, string> = {
  protest: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  arrest: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  economic: 'text-intel-green border-intel-green/30 bg-intel-green/10',
  political: 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
  diplomatic: 'text-intel-purple border-intel-purple/30 bg-intel-purple/10',
  labor: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  censorship: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  detention: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  infrastructure: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  rights: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
};

export const Timeline: React.FC = () => {
  const { rriState, fullData: data } = useRiskMetrics();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data: articles, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching timeline events:', error);
      } else if (articles) {
        const mappedEvents = articles.map((a: Article) => ({
          id: a.id,
          date: a.published_at.split('T')[0],
          title: a.title,
          summary: a.summary || a.ai_summary || a.title,
          type: a.category?.toLowerCase() || 'general',
          severity: a.severity,
          gov: a.governorate || 'National',
          source: a.source_name,
          actors: a.actors || [],
          rri_impact: a.rri_nudge > 0 ? `+${a.rri_nudge.toFixed(2)}` : '0.00',
          urgent: a.severity >= 4
        }));
        setEvents(mappedEvents);
      }
      setLoading(false);
    }
    fetchEvents();
  }, []);
  const [filter, setFilter] = useState('all');
  const [govFilter, setGovFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const eventTypes = ['all', ...new Set(events.map(e => e.type))];
  const governorates = ['all', ...new Set(events.map(e => e.gov))];

  const filteredEvents = events
    .filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filter === 'all' || e.type === filter;
      const matchesGov = govFilter === 'all' || e.gov === govFilter || e.gov === 'National';
      const matchesActor = actorFilter === '' || e.actors.some((a: string) => a.toLowerCase().includes(actorFilter.toLowerCase()));
      
      return matchesSearch && matchesType && matchesGov && matchesActor;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const stats = {
    total: events.length,
    last30: events.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return (now.getTime() - d.getTime()) < (30 * 24 * 60 * 60 * 1000);
    }).length,
    highSeverity: events.filter(e => e.severity >= 4).length,
    rriEvents: events.filter(e => e.rri_impact !== '0.00').length
  };

  const getRecencyColor = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays < 7) return 'text-intel-red border-intel-red/30 bg-intel-red/10';
    if (diffDays < 30) return 'text-intel-orange border-intel-orange/30 bg-intel-orange/10';
    return 'text-slate-500 border-white/10 bg-white/5';
  };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-on-surface' },
          { label: 'Last 30 Days', value: stats.last30, color: 'text-intel-cyan' },
          { label: 'High Severity', value: stats.highSeverity, color: 'text-intel-red' },
          { label: 'RRI Impacting', value: stats.rriEvents, color: 'text-intel-orange' },
        ].map(stat => (
          <div key={stat.label} className="glass p-4 rounded-xl border border-intel-border flex flex-col items-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-intel-cyan animate-spin" />
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Loading Intelligence Database...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center text-center space-y-4">
            <div>
              <h2 className="text-2xl tracking-tight text-on-surface">Intelligence Timeline</h2>
              <p className="text-slate-500 text-sm mt-1">Chronological event database with type and severity classification</p>
            </div>
          </div>

      {/* Filter Bar */}
      <div className="glass p-6 rounded-2xl border border-intel-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search intelligence database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-on-surface focus:outline-none focus:border-intel-cyan/50 transition-all"
            />
          </div>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            {sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {eventTypes.map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all whitespace-nowrap border ${
                filter === t 
                  ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/40 font-bold' 
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Governorate</label>
            <select 
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-xs font-mono text-on-surface focus:outline-none focus:border-intel-cyan/50 transition-all"
            >
              {governorates.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Actor Search</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Filter by actor (e.g. UGTT)..."
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-on-surface focus:outline-none focus:border-intel-cyan/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-intel-cyan/50 before:via-intel-border before:to-transparent">
        <AnimatePresence mode="popLayout">
          {filteredEvents
            .filter(e => typeof e?.id === "string" && e.id.trim() !== "")
            .map((event) => (
            <motion.div 
              key={event.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-intel-border bg-intel-bg text-intel-cyan shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                <Clock className="w-5 h-5" />
              </div>
              
              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all group/card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase tracking-tighter ${getRecencyColor(event.date)}`}>
                      {event.date}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase tracking-tighter ${typeColors[event.type] || 'text-slate-400 border-white/10'}`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                      event.severity >= 4 ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
                      event.severity >= 3 ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' :
                      'bg-intel-green/10 text-intel-green border-intel-green/20'
                    }`}>
                      LVL {event.severity}
                    </span>
                    {event.urgent && <AlertCircle className="w-3 h-3 text-intel-red animate-pulse" />}
                  </div>
                </div>

                <div className="text-sm font-bold text-on-surface uppercase tracking-tight mb-2 group-hover/card:text-intel-cyan transition-colors">{event.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{event.summary}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.actors.map((actor, idx) => (
                    <span key={`${actor}-${idx}`} className="text-[8px] font-mono px-2 py-0.5 bg-white/5 text-slate-500 border border-white/10 rounded">
                      {actor}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-intel-border/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-[8px] font-mono text-on-surface uppercase font-bold">{event.gov}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">{event.source}</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border ${
                    event.rri_impact.startsWith('+') ? 'bg-intel-red/10 border-intel-red/20 text-intel-red' : 'bg-intel-cyan/10 border-intel-cyan/20 text-intel-cyan'
                  }`}>
                    <span className="text-[8px] font-mono uppercase tracking-tighter">RRI Impact</span>
                    <span className="text-[8px] font-mono font-bold">{event.rri_impact}</span>
                  </div>
                </div>

                {event.severity >= 4 && (
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'pipeline' } }))}
                    className="mt-4 w-full py-2 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl text-[9px] font-mono text-intel-cyan uppercase tracking-widest hover:bg-intel-cyan hover:text-black transition-all"
                  >
                    → View in Pipeline
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
        </>
      )}
    </div>
  );
};
