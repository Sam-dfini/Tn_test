import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Database, 
  Radio, 
  Zap, 
  Layers, 
  Terminal, 
  Trash2, 
  Pause, 
  Play, 
  Filter, 
  AlertTriangle,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import { supabase, Article, Event as IntelEvent } from '../../lib/supabase';
import { pipelineDebugger, DebugLog, PipelineStage } from '../../services/debugService';

// Sub-components
import { FeedColumn } from '../debug/FeedColumn';
import { NewsColumn } from '../debug/NewsColumn';
import { SignalsColumn } from '../debug/SignalsColumn';
import { EventsColumn } from '../debug/EventsColumn';
import { PipelineLogColumn } from '../debug/PipelineLogColumn';

export default function PipelineDebugger({ onClose }: { onClose?: () => void }) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showInvalid, setShowInvalid] = useState(true);
  const [highlightDuplicates, setHighlightDuplicates] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const counts = {
      FEED: 0,
      NEWS: 0,
      SIGNALS: 0,
      EVENTS: 0,
      PIPELINE: 0,
      dropped: 0,
      error: 0
    };
    logs.forEach(l => {
      counts[l.stage] = (counts[l.stage] || 0) + 1;
      if (l.status === 'dropped') counts.dropped++;
      if (l.status === 'error') counts.error++;
    });
    return counts;
  }, [logs]);

  useEffect(() => {
    const unsubscribe = pipelineDebugger.subscribe((newLog) => {
      if (isPaused) return;
      if (newLog.id) {
        setLogs(prev => [newLog, ...prev].slice(0, 500));
      } else {
        // Clear triggered
        setLogs([]);
      }
    });

    // Initial logs
    setLogs(pipelineDebugger.getLogs());

    return () => {
      unsubscribe();
    };
  }, [isPaused]);

  // Real-time Supabase subscriptions for NEWS and EVENTS
  useEffect(() => {
    const articleChannel = supabase
      .channel('pipeline-debug-news')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, (payload) => {
        if (isPaused) return;
        pipelineDebugger.log('NEWS', 'valid', `DB INSERT: ${payload.new.title}`, payload.new);
      })
      .subscribe();

    const eventChannel = supabase
      .channel('pipeline-debug-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (isPaused) return;
        const type = payload.eventType === 'INSERT' ? 'EVENT CREATED' : 'EVENT UPDATED';
        const data = payload.new as any;
        pipelineDebugger.log('EVENTS', 'valid', `${type}: ${data.title || 'Untitled'}`, payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(articleChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [isPaused]);

  const filteredLogs = useMemo(() => {
    let list = logs;
    if (!showInvalid) {
      list = list.filter(l => l.status === 'valid');
    }
    return list;
  }, [logs, showInvalid]);

  // Stage filters
  const feedItems = useMemo(() => filteredLogs.filter(l => l.stage === 'FEED'), [filteredLogs]);
  const newsItems = useMemo(() => filteredLogs.filter(l => l.stage === 'NEWS'), [filteredLogs]);
  const signalItems = useMemo(() => filteredLogs.filter(l => l.stage === 'SIGNALS'), [filteredLogs]);
  const eventItems = useMemo(() => filteredLogs.filter(l => l.stage === 'EVENTS'), [filteredLogs]);
  const pipeLogs = useMemo(() => logs.filter(l => l.stage === 'PIPELINE' || l.status === 'error' || l.status === 'dropped'), [logs]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c] text-gray-300 font-mono selection:bg-emerald-500/30 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
      {/* Header — Add drag handle area */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h1 className="text-sm font-bold tracking-widest text-on-surface uppercase">Pipeline Debugger v2.4</h1>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-gray-500">
            <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> Raw: <span className="text-gray-300">{stats.FEED}</span></span>
            <span className="flex items-center gap-1"><Database className="w-3 h-3" /> News: <span className="text-gray-300">{stats.NEWS}</span></span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Signals: <span className="text-gray-300">{stats.SIGNALS}</span></span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Events: <span className="text-gray-300">{stats.EVENTS}</span></span>
            <span className="flex items-center gap-1 text-red-500/80"><AlertTriangle className="w-3 h-3" /> Drops: <span>{stats.dropped}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
              isPaused ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Resuming...' : 'Live Stream'}
          </button>
          
          <button 
            onClick={() => setShowInvalid(!showInvalid)}
            className={`p-1.5 rounded-md transition-all ${showInvalid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500'}`}
            title="Toggle Invalid Items"
          >
            <Filter className="w-4 h-4" />
          </button>

          <button 
            onClick={() => pipelineDebugger.clear()}
            className="p-1.5 bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20 transition-all"
            title="Clear Buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onClose && (
            <>
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-all rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-5 gap-px bg-white/5 overflow-hidden">
        <FeedColumn 
          items={feedItems} 
          selectedId={selectedItemId} 
          onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} 
        />
        <NewsColumn 
          items={newsItems} 
          selectedId={selectedItemId} 
          onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} 
          highlightDuplicates={highlightDuplicates}
        />
        <SignalsColumn 
          items={signalItems} 
          selectedId={selectedItemId} 
          onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} 
        />
        <EventsColumn 
          items={eventItems} 
          selectedId={selectedItemId} 
          onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} 
        />
        <PipelineLogColumn 
          items={pipeLogs} 
        />
      </div>

      {/* Trace Footer */}
      <AnimatePresence>
        {selectedItemId && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="h-24 bg-black/90 border-t border-emerald-500/30 backdrop-blur-xl absolute bottom-0 left-0 right-0 z-20 px-6 flex items-center gap-8"
          >
            <div className="flex-1">
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest block mb-1">Active Trace</span>
              <span className="text-on-surface text-sm truncate block">{selectedItemId}</span>
            </div>
            <div className="flex items-center gap-4">
               {/* Simplified logic for visualization of journey */}
               <TraceStep label="FEED" active />
               <ArrowRight className="w-3 h-3 text-gray-600" />
               <TraceStep label="NEWS" active />
               <ArrowRight className="w-3 h-3 text-gray-600" />
               <TraceStep label="SIGNAL" active />
               <ArrowRight className="w-3 h-3 text-gray-600" />
               <TraceStep label="EVENT" active />
            </div>
            <button 
              onClick={() => setSelectedItemId(null)}
              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20"
            >
              EXIT TRACE
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TraceStep({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-3 h-3 rounded-full mb-1 ${active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-800'}`} />
      <span className={`text-[8px] font-bold ${active ? 'text-emerald-400' : 'text-gray-600'}`}>{label}</span>
    </div>
  );
}
