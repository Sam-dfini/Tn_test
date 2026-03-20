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
  Tag
} from 'lucide-react';
import { CornerAccent } from './ProfessionalShared';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  sourceType: 'international' | 'local';
  date: string;
  timestamp: number;
  relevance: number; // 0-100
  category: string;
  url: string;
  summary: string;
  aiSummary?: string;
}

const mockNews: NewsArticle[] = [
  {
    id: 'NEWS-001',
    title: 'IMF Reaches Preliminary Agreement with Tunisia on $1.9bn Loan',
    source: 'Reuters',
    sourceType: 'international',
    date: '2026-03-17T14:30:00Z',
    timestamp: 1742221800000,
    relevance: 95,
    category: 'Economy',
    url: 'https://reuters.com/tunisia-imf',
    summary: 'The International Monetary Fund has reached a staff-level agreement with Tunisian authorities for a new 48-month Extended Fund Facility.',
    aiSummary: 'Tunisia and the IMF have reached a staff-level agreement for a $1.9 billion loan. The deal is contingent on the implementation of a comprehensive economic reform program aimed at restoring fiscal sustainability and promoting inclusive growth.'
  },
  {
    id: 'NEWS-002',
    title: 'New Desalination Plant Inaugurated in Sfax to Combat Water Scarcity',
    source: 'TAP',
    sourceType: 'local',
    date: '2026-03-18T09:15:00Z',
    timestamp: 1742289300000,
    relevance: 88,
    category: 'Infrastructure',
    url: 'https://tap.info.tn/sfax-desalination',
    summary: 'A major desalination project in Sfax has officially started operations, expected to provide drinking water for over 600,000 residents.',
    aiSummary: 'The new Sfax desalination plant is a strategic response to Tunisia\'s chronic water stress. It utilizes advanced reverse osmosis technology and is expected to significantly reduce the region\'s dependency on rainfall-dependent dams.'
  },
  {
    id: 'NEWS-003',
    title: 'EU Commission Proposes Enhanced Security Partnership with Maghreb Countries',
    source: 'BBC News',
    sourceType: 'international',
    date: '2026-03-16T11:00:00Z',
    timestamp: 1742122800000,
    relevance: 75,
    category: 'Geopolitics',
    url: 'https://bbc.com/eu-maghreb-security',
    summary: 'The European Commission has unveiled a new strategy for security cooperation with North African nations, focusing on counter-terrorism and border management.',
    aiSummary: 'The EU is seeking to deepen security ties with Maghreb nations, including Tunisia, to address shared threats. The proposal includes increased funding for border surveillance and joint intelligence-sharing initiatives.'
  },
  {
    id: 'NEWS-004',
    title: 'Tunisian Central Bank Maintains Interest Rate Amid Inflation Concerns',
    source: 'Business News',
    sourceType: 'local',
    date: '2026-03-17T16:45:00Z',
    timestamp: 1742229900000,
    relevance: 82,
    category: 'Economy',
    url: 'https://businessnews.com.tn/bct-rate',
    summary: 'The Central Bank of Tunisia (BCT) has decided to keep its key interest rate unchanged at 8%, citing the need to balance inflation control with economic growth.',
    aiSummary: 'The BCT\'s decision to hold rates reflects a cautious approach to monetary policy. While inflation remains a concern, the bank is also wary of stifling a fragile economic recovery.'
  },
  {
    id: 'NEWS-005',
    title: 'Major Tech Summit to be Hosted in Tunis Next Month',
    source: 'Mosaïque FM',
    sourceType: 'local',
    date: '2026-03-15T13:20:00Z',
    timestamp: 1742044800000,
    relevance: 60,
    category: 'Technology',
    url: 'https://mosaiquefm.net/tunis-tech-summit',
    summary: 'Tunis is preparing to host the Mediterranean Digital Forum, attracting startups and investors from across the region.',
    aiSummary: 'The upcoming Mediterranean Digital Forum in Tunis aims to position the city as a regional tech hub. The event will focus on AI, fintech, and green technologies, fostering collaboration between African and European innovators.'
  }
];

export const NewsFeed: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'source' | 'relevance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);

  const filteredAndSortedNews = useMemo(() => {
    let result = mockNews.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return result;
  }, [searchQuery, sortBy, sortOrder]);

  const toggleSort = (newSortBy: 'date' | 'source' | 'relevance') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleSummarize = (id: string) => {
    setIsSummarizing(id);
    setTimeout(() => {
      setIsSummarizing(null);
      setExpandedId(id);
    }, 1500);
  };

  return (
    <div className="glass p-8 rounded-3xl border border-intel-border relative overflow-hidden">
      <CornerAccent position="tl" />
      <CornerAccent position="br" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Newspaper className="w-6 h-6 text-intel-cyan" />
            <span>Real-time News Feed</span>
          </h3>
          <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">Aggregated global & local intelligence</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter news..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all w-48"
            />
          </div>

          <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
            <button 
              onClick={() => toggleSort('date')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 ${sortBy === 'date' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'}`}
            >
              <Calendar className="w-3 h-3" />
              <span>DATE</span>
              {sortBy === 'date' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
            </button>
            <button 
              onClick={() => toggleSort('source')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 ${sortBy === 'source' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'}`}
            >
              <Globe className="w-3 h-3" />
              <span>SOURCE</span>
              {sortBy === 'source' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
            </button>
            <button 
              onClick={() => toggleSort('relevance')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center space-x-2 ${sortBy === 'relevance' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'}`}
            >
              <Zap className="w-3 h-3" />
              <span>REL</span>
              {sortBy === 'relevance' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedNews.map((article) => (
            <motion.div 
              key={article.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-5 rounded-2xl border transition-all group ${
                expandedId === article.id ? 'bg-white/10 border-intel-cyan/30' : 'bg-white/5 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                      article.sourceType === 'international' ? 'bg-intel-purple/20 text-intel-purple border border-intel-purple/30' : 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/30'
                    }`}>
                      {article.source}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(article.date).toLocaleDateString()}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      {article.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-intel-cyan transition-colors leading-tight">
                    {article.title}
                  </h4>
                </div>
                
                <div className="flex items-center space-x-2">
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
                        <p className="text-xs text-slate-400 leading-relaxed">{article.summary}</p>
                      </div>
                      
                      {article.aiSummary && (
                        <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-[9px] font-mono text-intel-cyan uppercase font-bold tracking-widest flex items-center">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI-Powered Insight
                            </div>
                            <div className="text-[8px] font-mono text-intel-cyan/50 uppercase">Confidence: 98%</div>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed italic">"{article.aiSummary}"</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
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
  );
};
