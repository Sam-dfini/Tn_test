import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ExternalLink, 
  Clock, 
  Globe, 
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Calendar,
  Tag,
  AlertCircle,
  AlertTriangle,
  Database,
  CheckCircle2,
  X
} from 'lucide-react';
import { CornerAccent } from './ProfessionalShared';
import { BackgroundGrid, ModuleHeader } from './ProfessionalShared';
import { usePipeline } from '../context/PipelineContext';
import { processArticleForRRI } from '../utils/rriEngine';

import { useRSS } from '../context/RSSContext';
import { Article } from '../lib/supabase';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  sourceType: 'international' | 'local';
  date: string;
  timestamp: number;
  relevance: number; // 0-100
  severity: 1 | 2 | 3 | 4 | 5; // 1: Low, 5: Critical
  category: string;
  url: string;
  summary: string;
  aiSummary?: string;
  keywords?: string[];
  governorate?: string;
  rriImpact?: string;
  rriVariable?: string;
}

type SeverityLevel = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM';

type IntelModule = 'ALL' | 'POLITICAL' | 'ECONOMIC' | 'SOCIAL' | 'ENVIRONMENTAL' | 'SECURITY';

interface NewsFeedProps {
  hideBackground?: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ hideBackground }) => {
  const { pushApprovedChanges } = usePipeline();
  const { articles: rssArticles, isFetching, fetchNow, lastFetch } = useRSS();
  const [isRawView, setIsRawView] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'source' | 'relevance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel>('ALL');
  const [moduleFilter, setModuleFilter] = useState<IntelModule>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [pushedArticles, setPushedArticles] = useState<Set<string>>(new Set());

  const liveArticles: NewsArticle[] = rssArticles.map((a: Article) => ({
    id: a.id,
    title: a.title,
    source: a.source_name,
    sourceType: ['Reuters', 'BBC', 'AFP', 'Middle East Eye']
      .includes(a.source_name) ? ('international' as const) : ('local' as const),
    date: a.published_at,
    timestamp: new Date(a.published_at).getTime(),
    relevance: Math.min(100, 50 + (a.severity * 10) + (a.rri_nudge * 1000)),
    severity: Math.min(5, Math.max(1, a.severity)) as 1|2|3|4|5,
    category: a.category || 'general',
    url: a.url,
    summary: a.summary || a.title,
    aiSummary: (a as any).ai_summary || undefined,
    keywords: a.keywords || [],
    governorate: a.governorate,
    rriImpact: a.rri_nudge > 0 ? `+${a.rri_nudge.toFixed(3)}` : undefined,
    rriVariable: a.rri_variable,
  }));

  const getModuleTag = (article: NewsArticle): IntelModule => {
    const title = article.title.toLowerCase();
    const cat = article.category.toLowerCase();
    const summary = article.summary.toLowerCase();

    if (cat.includes('economy') || title.includes('loan') || title.includes('bank') || title.includes('imf')) return 'ECONOMIC';
    if (cat.includes('geopolitics') || title.includes('partnership') || title.includes('eu')) return 'POLITICAL';
    if (cat.includes('infrastructure') || title.includes('water') || title.includes('desalination')) return 'ENVIRONMENTAL';
    if (cat.includes('security') || title.includes('terrorism') || title.includes('border')) return 'SECURITY';
    if (cat.includes('social') || title.includes('protest') || title.includes('unemployment')) return 'SOCIAL';
    
    return 'ECONOMIC'; // Default
  };

  const moduleTagColors: Record<IntelModule, string> = {
    ALL: 'text-slate-500',
    POLITICAL: 'text-intel-purple',
    ECONOMIC: 'text-intel-cyan',
    SOCIAL: 'text-intel-orange',
    ENVIRONMENTAL: 'text-intel-green',
    SECURITY: 'text-intel-red'
  };

  const counts = useMemo(() => {
    return {
      ALL: liveArticles.length,
      CRITICAL: liveArticles.filter(e => e.severity >= 4).length,
      HIGH: liveArticles.filter(e => e.severity >= 3).length,
      MEDIUM: liveArticles.filter(e => e.severity >= 2).length,
    };
  }, [liveArticles]);

  const filteredAndSortedNews = useMemo(() => {
    let result = liveArticles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSeverity = 
        severityFilter === 'ALL' || 
        (severityFilter === 'CRITICAL' && article.severity >= 4) ||
        (severityFilter === 'HIGH' && article.severity >= 3) ||
        (severityFilter === 'MEDIUM' && article.severity >= 2);
      
      const matchesModule = 
        moduleFilter === 'ALL' || 
        getModuleTag(article) === moduleFilter;

      return matchesSearch && matchesSeverity && matchesModule;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = b.timestamp - a.timestamp;
      } else if (sortBy === 'source') {
        comparison = a.source.localeCompare(b.source);
      } else if (sortBy === 'relevance') {
        comparison = b.relevance - a.relevance;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

    // Identify unique articles by ID or URL
    const seenIds = new Set();
    const uniqueResults = result.filter(a => {
      const uniqueKey = a.id || a.url;
      if (!uniqueKey) return true;
      if (seenIds.has(uniqueKey)) return false;
      seenIds.add(uniqueKey);
      return true;
    });

    return uniqueResults.map(a => ({
      ...a,
      id: a.id || `gen-${a.url ? btoa(a.url).substring(0, 10) : Math.random().toString(36).substring(7)}`
    }));
  }, [liveArticles, searchQuery, sortBy, sortOrder, severityFilter, moduleFilter]);

  const toggleSort = (newSortBy: 'date' | 'source' | 'relevance') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const latestArticleDate = useMemo(() => {
    if (liveArticles.length === 0) return null;
    return new Date(Math.max(...liveArticles.map(a => new Date(a.date).getTime())));
  }, [liveArticles]);

  const isDataStale = useMemo(() => {
    if (!latestArticleDate) return false;
    return (Date.now() - latestArticleDate.getTime()) > 48 * 60 * 60 * 1000;
  }, [latestArticleDate]);

  const handleSummarize = (id: string) => {
    setIsSummarizing(id);
    setTimeout(() => {
      setIsSummarizing(null);
      setExpandedId(id);
    }, 1500);
  };

  const handlePushToPipeline = (article: NewsArticle) => {
    // Process for RRI nudging
    processArticleForRRI(article.title + ' ' + article.summary, 0.5);

    // Emit event for DataPipeline to catch
    window.dispatchEvent(new CustomEvent('pipeline-article', { 
      detail: { url: article.url, title: article.title } 
    }));
    
    setPushedArticles(prev => new Set(prev).add(article.id));
    
    // Also add a small notification or visual feedback
    console.log(`Article ${article.id} pushed to pipeline and RRI nudged`);
    
    // Trigger global RRI recalculation event
    window.dispatchEvent(new CustomEvent('rri-recalculate'));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      {!hideBackground && <BackgroundGrid />}
      
      <div className="glass p-4 md:p-8 rounded-3xl border border-intel-border relative overflow-hidden z-20">
      <CornerAccent position="tl" />
      <CornerAccent position="br" />

      <div className="flex flex-col space-y-6 mb-8 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center space-x-3">
              <Newspaper className="w-5 h-5 md:w-6 md:h-6 text-intel-cyan" />
              <span>Real-time News Feed</span>
            </h3>
            <div className="flex items-center space-x-4 text-[9px] font-mono">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => { setCleared(false); fetchNow(); }}
                  className={`flex items-center space-x-1.5 transition-colors ${
                    isFetching ? 'text-intel-cyan' : 'text-slate-500 hover:text-intel-cyan'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                  <span>{isFetching ? 'Fetching feeds...' : 'Refresh'}</span>
                </button>
                <button
                  onClick={() => setCleared(true)}
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-intel-red transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
              {lastFetch && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-700">
                    Sync: {lastFetch.toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  {isDataStale && (
                    <span className="flex items-center space-x-1 text-intel-orange animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Delayed Source Updates</span>
                    </span>
                  )}
                </div>
              )}
              <span className={`px-2 py-0.5 rounded border text-[8px] ${
                rssArticles.length > 0
                  ? 'text-intel-green border-intel-green/20 bg-intel-green/5'
                  : 'text-slate-600 border-slate-700'
              }`}>
                {rssArticles.length > 0 ? `${rssArticles.length} LIVE` : 'DEMO DATA'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Aggregated global & local intelligence</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Filter news..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all w-full md:w-48"
              />
            </div>

            <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setIsRawView(!isRawView)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${isRawView ? 'bg-intel-orange text-intel-bg' : 'text-slate-500 hover:text-white'}`}
              >
                <span>{isRawView ? 'RAW' : 'INTEL'}</span>
              </button>
              <button 
                onClick={() => toggleSort('date')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${sortBy === 'date' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'}`}
              >
                <Calendar className="w-3 h-3" />
                <span>DATE</span>
                {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
              <button 
                onClick={() => toggleSort('source')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${sortBy === 'source' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'}`}
              >
                <Globe className="w-3 h-3" />
                <span>SOURCE</span>
                {sortBy === 'source' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
              <button 
                onClick={() => toggleSort('relevance')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 flex-shrink-0 ${sortBy === 'relevance' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'}`}
              >
                <Zap className="w-3 h-3" />
                <span>REL</span>
                {sortBy === 'relevance' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
            </div>
          </div>
        </div>

        {/* Severity Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as SeverityLevel[]).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold transition-all border flex-shrink-0 ${
                  severityFilter === sev 
                    ? 'bg-intel-cyan border-intel-cyan text-intel-bg' 
                    : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30'
                }`}
              >
                {sev} ({counts[sev]})
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono text-slate-600 uppercase">Module:</span>
            <select 
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value as IntelModule)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50"
            >
              <option value="ALL">ALL MODULES</option>
              <option value="POLITICAL">POLITICAL</option>
              <option value="ECONOMIC">ECONOMIC</option>
              <option value="SOCIAL">SOCIAL</option>
              <option value="ENVIRONMENTAL">ENVIRONMENTAL</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {cleared ? null : filteredAndSortedNews
            .filter(article => article && typeof article.id === "string" && article.id.length > 0)
            .map((article) => {
            const moduleTag = getModuleTag(article);
            return (
              <motion.div 
                key={article.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 md:p-5 rounded-2xl border transition-all group ${
                  expandedId === article.id ? 'bg-white/10 border-intel-cyan/30' : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {isRawView ? (
                    <div className="text-white text-xs font-mono font-bold">
                      from {article.source} : {article.title} .... {new Date(article.date).toLocaleDateString()} / Time {new Date(article.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ) : (
                    <>
                    <div className="space-y-2 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        article.sourceType === 'international' ? 'bg-intel-purple/20 text-intel-purple border border-intel-purple/30' : 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/30'
                      }`}>
                        {article.source}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-white/5 border border-white/10 ${moduleTagColors[moduleTag]}`}>
                        {moduleTag}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(article.date).toLocaleDateString()}
                      </span>
                      {article.severity >= 4 && (
                        <span className="flex items-center text-[8px] font-mono text-intel-red font-bold animate-pulse">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-intel-cyan transition-colors leading-tight">
                      {article.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-2 self-end sm:self-start">
                    <button 
                      onClick={() => handlePushToPipeline(article)}
                      disabled={pushedArticles.has(article.id)}
                      className={`p-2 rounded-lg border transition-all ${
                        pushedArticles.has(article.id)
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500'
                          : 'border-white/10 hover:border-intel-cyan/50 text-slate-400 hover:text-intel-cyan'
                      }`}
                      title="Push to Data Pipeline"
                    >
                      {pushedArticles.has(article.id) ? <CheckCircle2 className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleSummarize(article.id)}
                      disabled={isSummarizing === article.id}
                      className={`p-2 rounded-lg border border-white/10 hover:border-intel-cyan/50 transition-all text-slate-400 hover:text-intel-cyan ${isSummarizing === article.id ? 'animate-pulse' : ''}`}
                      title="AI Summarize"
                    >
                      {isSummarizing === article.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    </button>
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-white/10 hover:border-intel-cyan/50 transition-all text-slate-400 hover:text-intel-cyan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                      className="p-2 rounded-lg border border-white/10 hover:border-intel-cyan/50 transition-all text-slate-400 hover:text-intel-cyan"
                    >
                      {expandedId === article.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  </>
                  )}
                </div>

                <AnimatePresence>
                  {expandedId === article.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-white/10 space-y-4">
                        <div className="space-y-2">
                          <div className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-widest">Original Summary</div>
                          {article.aiSummary ? (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                <Sparkles className="w-3 h-3 text-intel-cyan" />
                                <span className="text-[8px] font-mono text-intel-cyan uppercase">
                                  AI Summary
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {article.aiSummary}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {article.summary}
                            </p>
                          )}
                        </div>
                        
                        {article.rriImpact && (
                          <div className="flex items-center space-x-2 text-[9px] font-mono">
                            <span className="text-slate-600">RRI impact:</span>
                            <span className="text-intel-orange font-bold">
                              {article.rriImpact}
                            </span>
                            {article.rriVariable && (
                              <span className="text-slate-700">({article.rriVariable})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-intel-green" />
            <span>SOURCES ONLINE: 12</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse" />
            <span>LAST UPDATE: JUST NOW</span>
          </div>
        </div>
        <button className="hover:text-intel-cyan transition-colors uppercase tracking-widest font-bold">Refresh Feed</button>
      </div>
      </div>
    </div>
  );
};
