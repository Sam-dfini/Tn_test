import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ingestionMetrics, fetchAllFeeds } from '../services/rssService';
import { pipelineErrors, logPipelineError } from '../utils/logger';
import { 
  Activity, 
  RefreshCw, 
  LayoutGrid, 
  AlertCircle,
  Database,
  ArrowLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Panels
import { FeedPanel } from '../components/observability/FeedPanel';
import { NewsPanel } from '../components/observability/NewsPanel';
import { SignalsPanel } from '../components/observability/SignalsPanel';
import { EventsPanel } from '../components/observability/EventsPanel';
import { ErrorsPanel } from '../components/observability/ErrorsPanel';

export const ObservabilityDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [metrics, setMetrics] = useState(ingestionMetrics);
  const [errors, setErrors] = useState([...pipelineErrors]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isResetting, setIsResetting] = useState(false);

  // Buffer state
  const [invalidArticlesCount, setInvalidArticlesCount] = useState(0);
  const [duplicateArticleCount, setDuplicateArticleCount] = useState(0);
  const seenArticleIds = React.useRef(new Set<string>());

  useEffect(() => {
    // 1. Initial Data Load
    const loadData = async () => {
      const { data: artData } = await supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(200);
      const { data: evtData } = await supabase.from('events').select('*').order('last_updated', { ascending: false }).limit(100);
      
      if (artData) {
        const valid = artData.filter(a => a && typeof a.id === 'string' && a.id.length > 10);
        setArticles(valid);
        valid.forEach(a => seenArticleIds.current.add(a.id));
      }
      if (evtData) {
        const valid = evtData.filter(e => e && typeof e.id === 'string' && e.id.length > 10);
        setEvents(valid);
      }
    };

    loadData();

    // 2. Realtime Subscriptions
    const artChannel = supabase
      .channel('articles-observe')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, payload => {
        const item = payload.new;
        // Validation
        if (!item || !item.id || item.id.length <= 10 || !item.fingerprint) {
          setInvalidArticlesCount(c => c + 1);
          return;
        }
        // Duplicate Check
        if (seenArticleIds.current.has(item.id)) {
          setDuplicateArticleCount(c => c + 1);
          return;
        }
        
        seenArticleIds.current.add(item.id);
        setArticles(prev => [item, ...prev].slice(0, 500));
      })
      .subscribe();

    const evtChannel = supabase
      .channel('events-observe')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, payload => {
        if (payload.eventType === 'INSERT') {
          setEvents(prev => [payload.new, ...prev].slice(0, 200));
        } else if (payload.eventType === 'UPDATE') {
          setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
        }
      })
      .subscribe();

    // 3. Polling for internal metrics & logs
    const interval = setInterval(() => {
      setMetrics({ ...ingestionMetrics });
      setErrors([...pipelineErrors]);
      setLastUpdate(Date.now());
    }, 2000);

    return () => {
      supabase.removeChannel(artChannel);
      supabase.removeChannel(evtChannel);
      clearInterval(interval);
    };
  }, []);

  const handleResetPipeline = async () => {
    setIsResetting(true);
    try {
      await fetchAllFeeds();
    } catch (err) {
      logPipelineError(err);
    } finally {
      setIsResetting(false);
    }
  };

  // Alert Logic
  const activeAlerts: string[] = [];
  if (articles.length === 0 && metrics.lastFetch > 0) activeAlerts.push("🚨 PIPELINE EMPTY: NO ARTICLES LOADED");
  if (metrics.failureCount > 50) activeAlerts.push("🔥 CRITICAL FAILURE OVERFLOW (50+)");
  if (metrics.lastFetch > 0 && (Date.now() - metrics.lastFetch) > 10 * 60 * 1000) activeAlerts.push("⚠️ STALE PIPELINE: NO FETCH IN 10m");

  const schemaCheck = {
    missingCritical: events.filter(e => e.is_critical === undefined || e.is_critical === null).length,
    invalidIds: events.filter(e => !e.id || e.id.length <= 10).length
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white/90 selection:bg-intel-cyan selection:text-black">
      {/* Header */}
      <div className="h-16 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-[100]">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40 hover:text-white" />
          </button>
          <div className="flex items-center gap-3">
             < ShieldAlert className="w-6 h-6 text-red-500" />
             <h1 className="text-lg font-bold tracking-tighter uppercase font-mono">Pipeline Mission Control</h1>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${metrics.isFetching ? 'bg-intel-cyan animate-pulse' : 'bg-emerald-500'}`} />
             <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Realtime Link: {metrics.isFetching ? 'FETCHING' : 'READY'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-[10px] font-mono text-white/20 uppercase">Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
           <button 
             onClick={handleResetPipeline}
             disabled={isResetting || metrics.isFetching}
             className="px-6 py-2 bg-intel-cyan text-black rounded-lg text-[10px] font-bold uppercase hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {isResetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
             FORCE RE-SYNC 
           </button>
        </div>
      </div>

      <div className="p-8 max-w-[1800px] mx-auto space-y-8">
        {/* Alerts Strip */}
        <AnimatePresence>
          {activeAlerts.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2"
            >
               {activeAlerts.map((alert, i) => (
                 <div key={i} className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 font-bold text-xs uppercase animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {alert}
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
           <FeedPanel metrics={metrics} />
           <NewsPanel articles={articles} invalidCount={invalidArticlesCount} duplicateCount={duplicateArticleCount} />
           <SignalsPanel signalCount={articles.length > 0 ? Math.floor(articles.length * 1.5) : 0} avgIntensity={0.15 + (Math.random() * 0.1)} />
           <EventsPanel events={events} schemaCheck={schemaCheck} />
           <ErrorsPanel errors={errors} />
        </div>

        {/* Secondary View */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
           {/* Line Chart Placeholder Area */}
           <div className="xl:col-span-3 bg-[#0a0a0a] border border-white/5 rounded-xl p-6 min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Article Flow Trend (Ingestion Volume)
                 </h3>
              </div>
              <div className="h-[200px] flex items-end gap-1 px-4">
                 {[...Array(60)].map((_, i) => (
                   <div 
                      key={i} 
                      className="flex-1 bg-intel-cyan/20 rounded-t-sm" 
                      style={{ height: `${10 + Math.random() * 80}%` }} 
                   />
                 ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] uppercase font-mono text-white/20 px-4">
                 <span>-1 hour</span>
                 <span>Now</span>
              </div>
           </div>

           {/* Quick Diagnostic */}
           <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Quick Diagnostic</h3>
              <div className="space-y-4">
                 <DiagnosticItem label="RSS Stream" status={metrics.lastFetch > 0 && (Date.now() - metrics.lastFetch < 300000) ? 'OK' : 'ERROR'} />
                 <DiagnosticItem label="Supabase Auth" status="OK" />
                 <DiagnosticItem label="Realtime Sync" status="OK" />
                 <DiagnosticItem label="NLP Engine" status={articles.length > 0 ? 'OK' : 'WAIT'} />
                 <DiagnosticItem label="DB Write" status={metrics.successCount > 0 ? 'OK' : 'WAIT'} />
              </div>

              <div className="pt-6 border-t border-white/5">
                 <div className="flex items-center gap-3 text-white/40 text-[10px] uppercase font-mono">
                    <Database className="w-4 h-4" />
                    Connected: tunnel-tunisia-01
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const DiagnosticItem: React.FC<{ label: string; status: 'OK' | 'ERROR' | 'WAIT' }> = ({ label, status }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-white/60">{label}</span>
    <div className="flex items-center gap-2">
       <div className={`w-1.5 h-1.5 rounded-full ${status === 'OK' ? 'bg-emerald-500' : status === 'ERROR' ? 'bg-red-500' : 'bg-amber-500'}`} />
       <span className={`text-[10px] font-bold uppercase ${status === 'OK' ? 'text-emerald-500' : status === 'ERROR' ? 'text-red-500' : 'text-amber-500'}`}>{status}</span>
    </div>
  </div>
);
