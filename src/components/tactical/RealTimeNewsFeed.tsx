import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Search, RefreshCw, X, ExternalLink, Clock, Globe, Database, Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRSS } from '../../context/RSSContext';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { processArticleForRRI } from '../../math/rri/engine';
import { BackgroundGrid } from '../shared/ProfessionalShared';
import { TruthBadge } from '../shared/TruthBadge';
import { getUniqueKey, prepareList, assertUnique, generateStableId, assertKey } from '../../lib/keyUtils';

interface RealTimeNewsFeedProps {
  hideBackground?: boolean;
}

export const RealTimeNewsFeed: React.FC<RealTimeNewsFeedProps> = ({ hideBackground }) => {
  const { pushApprovedChanges } = useRiskMetrics();
  const { articles, isFetching, fetchNow, lastFetch, syncErrors } = useRSS();
  
  const [viewMode, setViewMode] = useState<'processed' | 'raw'>('processed');
  const [showSyncLog, setShowSyncLog] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pushedArticles, setPushedArticles] = useState<Set<string>>(new Set());
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    setCleared(false);
    fetchNow();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setCleared(true);
  };

  const handlePushToPipeline = (article: any) => {
    processArticleForRRI(article.title + ' ' + (article.summary || ''), 0.5);
    window.dispatchEvent(new CustomEvent('pipeline-article', { 
      detail: { url: article.url, title: article.title } 
    }));
    setPushedArticles(prev => new Set(prev).add(article.id));
    window.dispatchEvent(new CustomEvent('rri-recalculate'));
  };

  const handleSummarize = (id: string) => {
    setIsSummarizing(id);
    setTimeout(() => {
      setIsSummarizing(null);
      setExpandedId(id);
    }, 1500);
  };

  // Safe mapping of the articles with proper fallbacks
  const feedItems = useMemo(() => {
    if (cleared) return [];
    
    // Add manual article for context
    const manualArticleId = "manual-article-polling-security-tunisia";
    const manualArticle = {
        id: manualArticleId,
        title: "Elections in Tunisia: Security concerns rise as polling stations open.",
        source_name: "BBC",
        published_at: "2026-04-18T10:00:00Z",
        pubDate: new Date("2026-04-18T10:00:00Z").getTime(),
        severity: 5,
        category: "POLITICAL",
        url: "https://www.bbc.com/news/world-africa-tunisia-manual",
        summary: "Polling stations are open amid heightened security concerns.",
    };

    // Deduplicate and process items with stable IDs
    const rawItems = viewMode === 'raw' ? [...articles] : [manualArticle, ...articles];
    
    const processed = rawItems.map((a: any) => ({
      ...a,
      id: generateStableId(a),
      pubDate: new Date(a.published_at).getTime(),
      relevance: Math.min(100, 50 + ((a.severity || 1) * 10) + ((a.rri_nudge || 0) * 1000)),
      moduleTag: (a.category?.toLowerCase() || 'general').includes('economy') ? 'ECONOMIC' : 'POLITICAL',
    }));

    return prepareList(processed);
  }, [articles, cleared, viewMode]);

  // Apply filter and group by event_id
  const filteredItems = useMemo(() => {
    let items = feedItems;
    
    if (viewMode === 'raw') {
      items = items.filter(item => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(item.source_name || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    } else {
      items = items.filter(item => {
        if (severityFilter === 'CRITICAL' && item.severity < 4) return false;
        if (severityFilter === 'HIGH' && item.severity < 3) return false;
        if (severityFilter === 'MEDIUM' && item.severity < 2) return false;
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(item.source_name || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    }

    const sorted =  items.sort((a, b) => b.pubDate - a.pubDate);
    assertUnique(sorted, 'RealTimeNewsFeed-Filtered');
    return sorted;
  }, [feedItems, severityFilter, searchQuery, viewMode]);

  return (
    <div className="space-y-6 relative z-10 w-full animate-in fade-in duration-700">
      {!hideBackground && <BackgroundGrid />}
      
      <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border relative overflow-hidden bg-black/40">
        {/* LIVE INTELLIGENCE BANNER */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-intel-cyan/40 to-transparent animate-pulse" />
        
        <div className="flex flex-col space-y-6 mb-8 relative z-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-red-500 uppercase tracking-[0.2em]">Live Stream Active</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight flex items-center space-x-3">
                <Newspaper className="w-6 h-6 text-intel-cyan" />
                <span>{viewMode === 'raw' ? 'External RSS Intercept' : 'Processed Intelligence Terminal'}</span>
                <TruthBadge truthClass="LIVE" />
              </h3>
              
              <div className="flex items-center space-x-4 pt-2">
                 <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
                    <button
                      onClick={() => setViewMode('processed')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                        viewMode === 'processed' 
                          ? 'bg-intel-cyan text-black' 
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      PROCESSED
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                        viewMode === 'raw' 
                          ? 'bg-intel-orange text-black' 
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      RAW FEED
                    </button>
                 </div>

                 <button
                    onClick={handleRefresh}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold transition-all border ${
                      isFetching 
                        ? 'bg-intel-cyan/10 border-intel-cyan/30 text-intel-cyan' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                    <span>{isFetching ? 'Fetching...' : 'Refresh Feed'}</span>
                 </button>
                 
                 <button
                    onClick={handleClear}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono font-bold bg-white/5 border border-white/10 text-slate-300 hover:text-intel-red hover:border-intel-red/30 transition-all cursor-pointer z-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Feed</span>
                 </button>
                 
                 {lastFetch && (
                  <span className="text-[9px] font-mono text-slate-500 hidden sm:block">
                    LIVE SINCE: {lastFetch.toLocaleTimeString('en-GB')}
                  </span>
                 )}
                 
                 <span className={`px-2 py-0.5 rounded border text-[8px] font-mono font-bold uppercase ${
                    articles.length > 0
                      ? 'text-intel-green border-intel-green/20 bg-intel-green/5'
                      : 'text-slate-600 border-slate-700'
                  }`}>
                    {articles.length} SIGNALS
                  </span>

                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center space-x-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/30 transition-all text-[8px] font-mono uppercase"
                    title="Hard reload application and clear memory"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset Matrix</span>
                  </button>

                  <button
                    onClick={() => setShowSyncLog(!showSyncLog)}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded border text-[8px] font-mono uppercase transition-all ${
                      syncErrors.length > 0 
                        ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' 
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-intel-cyan'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${syncErrors.length > 0 ? 'bg-intel-red animate-pulse' : 'bg-intel-green'}`} />
                    <span>{syncErrors.length > 0 ? `${syncErrors.length} SYNC FAILS` : 'ALL SOURCES OK'}</span>
                  </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Query intelligence..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-intel-cyan/50 transition-all w-full md:w-64"
                />
              </div>
              <div className={`flex items-center space-x-1.5 bg-black/50 rounded-xl border border-white/10 p-1 w-fit transition-opacity ${viewMode === 'raw' ? 'opacity-40 pointer-events-none' : ''}`}>
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                  <button
                    key={assertKey(getUniqueKey('sev', sev))}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                      severityFilter === sev 
                        ? 'bg-white/10 text-on-surface shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* SYNC DIAGNOSTIC LOG */}
        <AnimatePresence>
          {showSyncLog && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 bg-black/60 border border-intel-red/30 rounded-xl overflow-hidden"
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono text-intel-red uppercase font-bold tracking-widest">
                    Synchronization Diagnostic Log
                  </h4>
                  <button onClick={() => setShowSyncLog(false)} aria-label="Close sync log" className="text-slate-600 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-intel-red/20">
                  {syncErrors.length === 0 ? (
                    <p className="text-[9px] font-mono text-intel-green">No issues reported in current lifecycle.</p>
                  ) : (
                    prepareList(syncErrors).map((err: any, i: number) => (
                      <div key={err.id} className="flex items-center space-x-2 text-[9px] font-mono text-intel-red/80 px-2 py-1 bg-intel-red/5 rounded">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{err.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BREAKING NEWS TICKER */}
        {filteredItems.some(item => item.severity >= 4) && (
          <div className="mb-6 bg-intel-red/5 border-y border-intel-red/20 py-2 relative overflow-hidden">
            <div className="flex items-center space-x-4 animate-ticker whitespace-nowrap">
              {prepareList(filteredItems.filter(item => item.severity >= 4).slice(0, 10)).map((item: any, idx: number) => (
                <div key={item.id} className="flex items-center space-x-2 px-4 border-r border-intel-red/10">
                  <span className="text-[8px] font-mono font-bold text-intel-red uppercase tracking-widest bg-intel-red/10 px-1.5 py-0.5 rounded">CRITICAL</span>
                  <span className="text-[10px] font-medium text-slate-200">{item.title}</span>
                  <span className="text-[8px] font-mono text-slate-500">{item.source_name}</span>
                </div>
              ))}
            </div>
            {/* Overlay gradients for fade effect */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/40 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/40 to-transparent z-10" />
          </div>
        )}

        {/* FEED SECTION */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredItems.length === 0 && !isFetching && !cleared && (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
              <p className="text-sm font-mono text-slate-500">No active signals found.</p>
            </div>
          )}
          
          {cleared && (
            <div className="p-8 text-center border border-dashed border-intel-red/20 rounded-2xl bg-intel-red/5">
              <p className="text-sm font-mono text-intel-red font-bold">Feed Cleared by Operator</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 rounded-lg bg-black text-intel-cyan border border-intel-cyan/30 text-[10px] font-mono uppercase tracking-widest hover:bg-intel-cyan/10 transition-colors"
               >
                Restore Connection
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {prepareList(filteredItems).map((article: any, i: number) => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-5 rounded-2xl border transition-all ${
                  expandedId === article.id 
                    ? (viewMode === 'raw' ? 'bg-orange-500/5 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.05)]' : 'bg-white/10 border-intel-cyan/40 shadow-[0_0_20px_rgba(0,242,255,0.05)]')
                    : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 pr-4">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                        viewMode === 'raw' 
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}>
                        {article.source_name || 'UNKNOWN SOURCE'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(article.published_at).toLocaleString('en-GB')}
                      </span>
                      {viewMode === 'raw' && article.url && (
                        <span className="text-[9px] font-mono text-slate-600 truncate max-w-[150px]">
                          {article.url}
                        </span>
                      )}
                      {viewMode === 'processed' && article.severity >= 4 && (
                        <span className="flex items-center text-[8px] font-mono text-intel-red font-bold bg-intel-red/10 px-2 py-0.5 rounded border border-intel-red/20 uppercase tracking-widest">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Critical Signal
                        </span>
                      )}
                    </div>
                    <h4 className={`text-[15px] font-bold leading-tight ${viewMode === 'raw' ? 'text-slate-200' : 'text-on-surface'}`}>
                      {article.title}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-start">
                    <button 
                      onClick={() => handlePushToPipeline(article)}
                      disabled={pushedArticles.has(article.id)}
                      className={`p-2 rounded-lg border transition-all ${
                        pushedArticles.has(article.id)
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'
                          : 'border-white/10 hover:border-intel-cyan/50 bg-black/50 text-slate-400 hover:text-intel-cyan hover:bg-intel-cyan/10'
                      }`}
                      title="Push to Data Pipeline"
                    >
                      {pushedArticles.has(article.id) ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                    </button>
                    {viewMode === 'processed' && (
                      <button 
                        onClick={() => handleSummarize(article.id)}
                        disabled={isSummarizing === article.id}
                        className={`p-2 rounded-lg border bg-black/50 border-white/10 hover:border-intel-cyan/50 hover:bg-intel-cyan/10 transition-all text-slate-400 hover:text-intel-cyan ${isSummarizing === article.id ? 'animate-pulse' : ''}`}
                        title="AI Summarize"
                      >
                        {isSummarizing === article.id ? <RefreshCw className="w-4 h-4 animate-spin text-intel-cyan" /> : <Sparkles className="w-4 h-4" />}
                      </button>
                    )}
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border bg-black/50 border-white/10 hover:border-intel-cyan/50 hover:bg-intel-cyan/10 transition-all text-slate-400 hover:text-intel-cyan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-white/10 bg-black/50 hover:border-white/30 transition-all text-[10px] font-mono text-slate-300"
                    >
                      <span>{viewMode === 'raw' ? 'INSPECT' : 'DETAILS'}</span>
                      {expandedId === article.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === article.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-5 mt-5 border-t border-white/10 space-y-4">
                        <div className="space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest flex items-center">
                            <Newspaper className="w-3 h-3 mr-1.5" /> {viewMode === 'raw' ? 'Raw Payload' : 'Raw Intercept'}
                          </div>
                          {article.ai_summary && viewMode === 'processed' ? (
                            <div className="space-y-2 bg-intel-cyan/5 border border-intel-cyan/20 p-4 rounded-xl">
                              <div className="flex items-center space-x-1.5 mb-1">
                                <Sparkles className="w-3 h-3 text-intel-cyan" />
                                <span className="text-[9px] font-mono text-intel-cyan uppercase font-bold tracking-wider">
                                  AI Extracted Intelligence
                                </span>
                              </div>
                              <p className="text-[12px] text-slate-300 leading-relaxed font-serif">
                                {article.ai_summary}
                              </p>
                            </div>
                          ) : (
                            <div className={`p-4 rounded-xl border ${viewMode === 'raw' ? 'bg-orange-500/5 border-orange-500/10' : 'bg-black/30 border-white/5'}`}>
                              <p className={`text-[12px] leading-relaxed font-serif ${viewMode === 'raw' ? 'text-slate-300' : 'text-slate-400'}`}>
                                {article.content || article.summary || 'Content payload missing from source feed.'}
                              </p>
                              {viewMode === 'raw' && (
                                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4">
                                  <div className="space-y-1">
                                     <span className="text-[9px] font-mono text-slate-600 block uppercase">Original Keywords</span>
                                      <div className="flex flex-wrap gap-1">
                                        {prepareList(article.keywords || []).map((k: any) => (
                                          <span key={k.id} className="text-[8px] font-mono bg-white/5 px-1 rounded text-slate-500">{k.value}</span>
                                        ))}
                                      </div>
                                  </div>
                                  <div className="space-y-1">
                                     <span className="text-[9px] font-mono text-slate-600 block uppercase">Category</span>
                                     <span className="text-[9px] font-mono text-on-surface italic">{article.category}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
