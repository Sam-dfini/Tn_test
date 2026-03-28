import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  BarChart3, 
  ChevronRight,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase, Event, Article } from '../lib/supabase';

export const EventsIntelligence: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventArticles, setEventArticles] = useState<Article[]>([]);
  const [filter, setFilter] = useState({
    category: 'all',
    governorate: 'all',
    severity: 0
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*')
        .order('last_updated', { ascending: false });

      if (filter.category !== 'all') query = query.eq('category', filter.category);
      if (filter.governorate !== 'all') query = query.eq('governorate', filter.governorate);
      if (filter.severity > 0) query = query.gte('severity', filter.severity);

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventArticles = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('event_id', eventId)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      setEventArticles(data || []);
    } catch (err) {
      console.error('Error fetching event articles:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventArticles(selectedEvent.id);
    }
  }, [selectedEvent]);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'text-intel-red border-intel-red/30 bg-intel-red/10';
    if (severity >= 3) return 'text-intel-orange border-intel-orange/30 bg-intel-orange/10';
    return 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10';
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <Radio className="w-5 h-5 text-intel-cyan" />
            <span>Event Engine // Narrative Comparison</span>
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">
            Grouping intelligence signals into discrete events
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => fetchEvents()}
            className="p-2 rounded-lg border border-intel-border hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="flex items-center bg-black/40 border border-intel-border rounded-lg px-3 py-1.5 space-x-3">
            <Filter className="w-3 h-3 text-slate-500" />
            <select 
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="bg-transparent text-[10px] font-mono text-slate-300 focus:outline-none uppercase"
            >
              <option value="all">All Categories</option>
              <option value="protest">Protest</option>
              <option value="economic">Economic</option>
              <option value="political">Political</option>
              <option value="water">Water</option>
              <option value="migration">Migration</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event List */}
        <div className="lg:col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-8 h-8 text-intel-cyan animate-spin" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                Analyzing event clusters...
              </span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-intel-border rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                No active events detected
              </span>
            </div>
          ) : (
            events.map((event) => (
              <motion.button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                whileHover={{ x: 4 }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedEvent?.id === event.id
                    ? 'border-intel-cyan bg-intel-cyan/5'
                    : 'border-intel-border bg-black/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase tracking-widest ${getSeverityColor(event.severity)}`}>
                    Level {event.severity}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {new Date(event.last_updated).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{event.title}</h3>
                
                <div className="flex items-center space-x-3 mt-3">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{event.governorate || 'National'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">{event.article_count} Sources</span>
                  </div>
                </div>

                {/* Bias Indicators Mini */}
                <div className="flex h-1 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-intel-red h-full" 
                    style={{ width: `${(event.critical_count / event.article_count) * 100}%` }} 
                  />
                  <div 
                    className="bg-slate-400 h-full" 
                    style={{ width: `${(event.neutral_count / event.article_count) * 100}%` }} 
                  />
                  <div 
                    className="bg-intel-green h-full" 
                    style={{ width: `${(event.pro_gov_count / event.article_count) * 100}%` }} 
                  />
                </div>
              </motion.button>
            ))
          )}
        </div>

        {/* Event Detail & Narrative Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Event Header */}
              <div className="glass p-6 rounded-2xl border border-intel-border/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">
                        Event ID: {selectedEvent.event_key}
                      </span>
                      <span className="text-slate-700">•</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {selectedEvent.category}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">
                      {selectedEvent.title}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Status</div>
                    <div className="flex items-center space-x-2 justify-end">
                      <div className="w-1.5 h-1.5 rounded-full bg-intel-green animate-pulse" />
                      <span className="text-xs font-mono text-intel-green uppercase tracking-widest">
                        {selectedEvent.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {selectedEvent.description}
                </p>

                {/* Narrative Divergence Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-intel-border">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-3 flex items-center justify-between">
                      <span>Source Alignment</span>
                      <ShieldAlert className="w-3 h-3" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-intel-red uppercase">Critical</span>
                        <span className="text-xs font-mono text-white">{selectedEvent.critical_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Neutral</span>
                        <span className="text-xs font-mono text-white">{selectedEvent.neutral_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-intel-green uppercase">Pro-Gov</span>
                        <span className="text-xs font-mono text-white">{selectedEvent.pro_gov_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-intel-border">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-3 flex items-center justify-between">
                      <span>Narrative Tone</span>
                      <TrendingUp className="w-3 h-3" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-intel-red uppercase">Alarmist</span>
                        <span className="text-xs font-mono text-white">{selectedEvent.alarmist_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Neutral</span>
                        <span className="text-xs font-mono text-white">{selectedEvent.article_count - selectedEvent.alarmist_count - selectedEvent.minimizing_count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-intel-cyan uppercase">Minimizing</span>
                        <span className="text-xs font-mono text-white">{selectedEvent.minimizing_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-intel-border">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-3 flex items-center justify-between">
                      <span>Divergence Index</span>
                      <BarChart3 className="w-3 h-3" />
                    </div>
                    <div className="flex flex-col items-center justify-center h-full pb-4">
                      <span className="text-3xl font-bold font-mono text-intel-cyan">
                        {Math.round(((selectedEvent.critical_count + selectedEvent.alarmist_count) / (selectedEvent.article_count * 2)) * 100)}%
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase mt-1">High Divergence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Articles */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] px-2">
                  Source Intelligence Feed ({eventArticles.length})
                </h3>
                <div className="space-y-3">
                  {eventArticles.map((article) => (
                    <div 
                      key={article.id}
                      className="p-4 rounded-xl border border-intel-border bg-black/20 hover:bg-black/40 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono text-intel-cyan uppercase">{article.source_name}</span>
                          <span className="text-slate-700">•</span>
                          <span className={`text-[9px] font-mono uppercase ${
                            article.bias_alignment === 'CRITICAL' ? 'text-intel-red' :
                            article.bias_alignment === 'PRO_GOV' ? 'text-intel-green' : 'text-slate-400'
                          }`}>
                            {article.bias_alignment}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600">
                          {new Date(article.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors mb-2">
                        {article.title}
                      </h4>
                      {article.ai_summary && (
                        <p className="text-xs text-slate-500 italic border-l border-intel-cyan/30 pl-3 py-1">
                          {article.ai_summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            article.bias_tone === 'ALARMIST' ? 'bg-intel-red/10 text-intel-red' :
                            article.bias_tone === 'MINIMIZING' ? 'bg-intel-cyan/10 text-intel-cyan' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {article.bias_tone}
                          </span>
                        </div>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-slate-500 hover:text-intel-cyan flex items-center space-x-1"
                        >
                          <span>View Source</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-40 border border-dashed border-intel-border rounded-2xl bg-black/20">
              <Radio className="w-12 h-12 text-slate-800 mb-4 animate-pulse" />
              <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest">
                Select an event to begin analysis
              </h3>
              <p className="text-[10px] font-mono text-slate-600 mt-2 max-w-xs text-center">
                The Event Engine automatically clusters related intelligence signals to detect narrative divergence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
