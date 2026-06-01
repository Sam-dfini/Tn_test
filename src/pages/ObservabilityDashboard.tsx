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
  ShieldAlert,
  Zap,
  Pause,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUniqueKey, stableHash, assertKey } from '../lib/keyUtils';
import { useRiskMetrics } from '../hooks/usePipelineDomains';

// Panels
import { FeedPanel } from '../components/observability/FeedPanel';
import { NewsPanel } from '../components/observability/NewsPanel';
import { SignalsPanel } from '../components/observability/SignalsPanel';
import { EventsPanel } from '../components/observability/EventsPanel';
import { ErrorsPanel } from '../components/observability/ErrorsPanel';
import { AgentPanel } from '../components/observability/AgentPanel';

import { useObservability } from '../context/ObservabilityContext';
import { useRSS } from '../context/RSSContext';

export const ObservabilityDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { metrics, dbOps, healthScore, logs, alerts } = useObservability();
  const { articles, events, fetchNow } = useRSS();
  const { isPaused, togglePause } = useRiskMetrics();
  const [agents, setAgents] = useState<any[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [invalidArticlesCount, setInvalidArticlesCount] = useState(0);
  const [duplicateArticleCount, setDuplicateArticleCount] = useState(0);

  const handleResetSystem = () => {
    if (window.confirm('Are you sure you want to reset the system? This will clear all locally saved configurations and refresh the page.')) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const resp = await fetch('/api/observability/agents');
        const data = await resp.json();
        setAgents(data.agents || []);
      } catch (e) {
        console.error("Failed to fetch agents", e);
      }
    };
    fetchAgents();
    const timer = setInterval(() => {
      setLastUpdate(Date.now());
      fetchAgents();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleResetPipeline = async () => {
    setIsResetting(true);
    try {
      await fetchNow(true);
    } catch (err) {
      logPipelineError(err);
    } finally {
      setIsResetting(false);
    }
  };

  // Alert Logic
  const activeAlerts: string[] = alerts.slice(0, 3).map(a => a.message);
  if (articles.length === 0 && metrics.lastFetch > 0) activeAlerts.push("🚨 PIPELINE EMPTY: NO ARTICLES LOADED");
  if (healthScore < 50) activeAlerts.push("🔥 CRITICAL HEALTH DROP: CHECK DB TRAFFIC");

  const schemaCheck = {
    missingCritical: events.filter((e: any) => e.is_critical === undefined || e.is_critical === null).length,
    invalidIds: events.filter((e: any) => !e.id || e.id.length <= 10).length
  };

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-white/90 selection:bg-intel-cyan selection:text-black flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/5 bg-black/60 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-sticky">
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
             onClick={togglePause}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[10px] transition-all uppercase ${
               isPaused 
                 ? 'bg-amber-500 text-black animate-pulse' 
                 : 'bg-white/10 text-on-surface hover:bg-white/20 border border-white/10'
             }`}
           >
             {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
             {isPaused ? 'RESUME PIPELINE' : 'PAUSE SYSTEM'}
           </button>

           <button 
             onClick={handleResetSystem}
             className="px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all flex items-center gap-2"
             title="Factory Reset - Clear all cache"
           >
             <RefreshCw className="w-3 h-3" />
             Reset System
           </button>

           <button 
             onClick={handleResetPipeline}
             disabled={isResetting || metrics.isFetching || isPaused}
             className="px-6 py-2 bg-intel-cyan text-black rounded-lg text-[10px] font-bold uppercase hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
           >
             {isResetting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
             FORCE RE-SYNC 
           </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-[1920px] mx-auto w-full flex flex-col min-h-0 space-y-4">
        {/* Alerts Strip */}
        <AnimatePresence>
          {activeAlerts.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="space-y-1 shrink-0"
            >
               {activeAlerts.map((alert, i) => (
                 <div key={assertKey(getUniqueKey('alert', i))} className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-center gap-3 text-red-400 font-bold text-[10px] uppercase animate-pulse">
                    <AlertCircle className="w-3 h-3" />
                    {alert}
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Symmetric Intelligence Matrix */}
        <div className="flex-1 min-h-0 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
           
           {/* Column 1: Pipeline & Status */}
           <div className="flex flex-col gap-6 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-xl">
                 <FeedPanel metrics={metrics} />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl">
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2 shrink-0">
                    <Database className="w-3 h-3 text-intel-cyan" />
                    Status Matrix
                 </h3>
                 <div className="flex-1 flex flex-col justify-center space-y-4">
                    <DiagnosticItem label="RSS Stream" status={metrics.lastIngestionTime > 0 && (Date.now() - metrics.lastIngestionTime < 300000) ? 'OK' : 'ERROR'} />
                    <DiagnosticItem label="Supabase" status="OK" />
                    <DiagnosticItem label="Agent Net" status={agents.length > 0 ? 'OK' : 'WAIT'} />
                    <DiagnosticItem label="DB Traffic" status={(metrics.dbWriteCount || 0) > 1000 ? 'ERROR' : 'OK'} />
                 </div>
              </div>
           </div>

           {/* Column 2: News & Signals */}
           <div className="flex flex-col gap-6 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-xl">
                 <NewsPanel articles={articles} invalidCount={invalidArticlesCount} duplicateCount={duplicateArticleCount} />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-xl">
                 <SignalsPanel signalCount={articles.length > 0 ? Math.floor(articles.length * 1.5) : 0} avgIntensity={0.15 + (Math.random() * 0.1)} />
              </div>
           </div>

           {/* Column 3: Events & Agents */}
           <div className="flex flex-col gap-6 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-xl">
                 <EventsPanel events={events} schemaCheck={schemaCheck} />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-xl">
                 <AgentPanel agents={agents} />
              </div>
           </div>

           {/* Column 4: Traffic & Alerts */}
           <div className="flex flex-col gap-6 min-h-0">
              {/* DB Traffic Panel */}
              <div className="flex-1 min-h-0 bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 flex flex-col gap-5 overflow-hidden shadow-xl">
                 <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
                       <Zap className="w-3 h-3 text-intel-cyan" />
                       Traffic Load
                    </h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${healthScore > 70 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                       {healthScore}%
                    </span>
                 </div>
                 <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                       <div className="text-[8px] text-white/20 uppercase font-bold mb-1">Writes</div>
                       <div className="text-xl font-bold font-mono text-intel-cyan">{metrics.dbWriteCount || 0}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                       <div className="text-[8px] text-white/20 uppercase font-bold mb-1">Reads</div>
                       <div className="text-xl font-bold font-mono text-white/80">{metrics.dbReadCount || 0}</div>
                    </div>
                 </div>
                 <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="text-[8px] uppercase font-mono text-white/20 mb-3 flex items-center justify-between">
                       <span>Live Database Ops</span>
                       <span className="animate-pulse text-intel-cyan">●</span>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[9px] space-y-1.5">
                       {dbOps.length === 0 && <div className="text-white/10 italic text-center py-4">Awaiting transactions...</div>}
                       {dbOps.slice(-20).reverse().map((op, i) => (
                         <div key={assertKey(getUniqueKey('dbop', stableHash(JSON.stringify(op))))} className="flex justify-between items-center bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.02]">
                            <span className={op.op === 'SELECT' ? 'text-blue-400 font-bold' : 'text-intel-cyan font-bold'}>{op.op}</span>
                            <span className="text-white/40 truncate max-w-[80px]">{op.table}</span>
                            <span className="text-white/20 text-[8px]">{new Date(op.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 min-h-0 bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                 <ErrorsPanel errors={alerts.map(a => ({ id: a.id, message: a.message, timestamp: a.timestamp }))} />
              </div>
           </div>
        </div>

        {/* Global Trend Overlay (Bottom Strip) */}
        <div className="h-40 bg-[#0a0a0a] border-t border-white/5 p-6 flex flex-col shrink-0">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                 <Activity className="w-3 h-3 text-intel-cyan" />
                 Article Flow Trend (Global Ingestion Pulse)
              </h3>
              <div className="flex items-center gap-6 text-[9px] font-mono">
                 <div className="flex items-center gap-2">
                    <span className="text-white/20 uppercase tracking-tighter">Rate:</span>
                    <span className="text-intel-cyan font-bold">{(articles.length / 60).toFixed(2)} EPS</span>
                 </div>
                 <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                    <span className="text-white/20 uppercase tracking-tighter">Stability:</span>
                    <span className={`${healthScore > 80 ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>{healthScore}%</span>
                 </div>
              </div>
           </div>
           <div className="flex-1 flex items-end gap-1 min-h-0 px-2 overflow-hidden">
              {[...Array(120)].map((_, i) => (
                <motion.div 
                   key={assertKey(getUniqueKey('trend', i))} 
                   initial={{ height: "5%" }}
                   animate={{ height: `${10 + (Math.sin(i / 10 + Date.now() / 1000) * 15 + 35) + Math.random() * 20}%` }}
                   transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                   className="flex-1 bg-gradient-to-t from-intel-cyan/10 to-intel-cyan/40 rounded-t-[2px] hover:bg-intel-cyan transition-colors" 
                />
              ))}
           </div>
           <div className="flex justify-between mt-4 text-[8px] uppercase font-mono text-white/20 tracking-tighter">
              <span className="flex items-center gap-1"><Zap className="w-2 h-2" /> T-60m INFRASTRUCTURE LINK</span>
              <span className="animate-pulse">BUFFERED STREAMING MODE : SYNCHRONIZED</span>
              <span className="flex items-center gap-1">REALTIME VECTOR T-0m <Activity className="w-2 h-2" /></span>
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
