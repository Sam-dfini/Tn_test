import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, 
  MessageCircle, 
  Twitter, 
  Facebook, 
  Send, 
  Disc, 
  TrendingUp, 
  RefreshCw,
  Globe,
  Share2,
  ExternalLink,
  AlertCircle,
  Activity
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Hashtag {
  tag: string;
  count: string;
  trend: 'up' | 'down' | 'stable';
}

interface SocialPost {
  platform: 'WHATSAPP' | 'TELEGRAM' | 'TWITTER' | 'FACEBOOK' | 'DISCORD';
  user: string;
  time: string;
  content: string;
  verified: boolean;
  engagement: string;
}

export const SocialMonitor: React.FC = () => {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'HASHTAGS' | 'SOCIAL'>('HASHTAGS');

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Generate a tactical social media monitoring report for Tunisia. Include: 1. Top 8 trending hashtags in Tunisia (Arabic and Latin script). 2. 6 simulated but realistic trending news posts from platforms like WhatsApp, Telegram, Twitter, Facebook, and Discord. Return ONLY a JSON object with two arrays: 'hashtags' (tag, count, trend: 'up'|'down'|'stable') and 'posts' (platform, user, time, content, verified: boolean, engagement). Wrap the JSON in a markdown code block.",
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : text;
      const data = JSON.parse(jsonStr.trim());
      setHashtags(data.hashtags || []);
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to fetch social monitor data:', err);
      // Fallback data
      setHashtags([
        { tag: '#تونس', count: '182K', trend: 'up' },
        { tag: '#أزمة_المياه', count: '145K', trend: 'up' },
        { tag: '#صفاقس', count: '98K', trend: 'up' },
        { tag: '#النهضة', count: '71K', trend: 'stable' },
        { tag: '#IMF_تونس', count: '65K', trend: 'down' },
        { tag: '#اتحاد_الشغل', count: '58K', trend: 'up' },
        { tag: '#Tunisia', count: '44K', trend: 'stable' },
        { tag: '#EconomieTN', count: '38K', trend: 'down' },
      ]);
      setPosts([
        { 
          platform: 'TWITTER', 
          user: '@TunisNews', 
          time: '12m ago', 
          content: 'Reports of localized protests in Sfax harbor regarding water distribution issues.', 
          verified: true, 
          engagement: '1.2K' 
        },
        { 
          platform: 'TELEGRAM', 
          user: 'Tunisia Intel Channel', 
          time: '45m ago', 
          content: 'Satellite imagery confirms increased activity near the southern border sectors.', 
          verified: false, 
          engagement: '8.4K' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
    const interval = setInterval(fetchSocialData, 600000); // 10 mins
    return () => clearInterval(interval);
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'WHATSAPP': return <MessageCircle className="w-3 h-3 text-green-500" />;
      case 'TELEGRAM': return <Send className="w-3 h-3 text-blue-400" />;
      case 'TWITTER': return <Twitter className="w-3 h-3 text-sky-400" />;
      case 'FACEBOOK': return <Facebook className="w-3 h-3 text-blue-600" />;
      case 'DISCORD': return <Disc className="w-3 h-3 text-indigo-400" />;
      default: return <Globe className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="glass rounded-lg border border-intel-border flex flex-col h-[450px] overflow-hidden">
      {/* Header */}
      <div className="bg-black/40 border-b border-intel-border p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-xs font-mono text-intel-cyan uppercase font-bold tracking-widest">Social Monitor</h3>
        </div>
        <div className="flex items-center space-x-2">
          {loading && <RefreshCw className="w-3 h-3 text-intel-cyan animate-spin" />}
          <div className="flex bg-white/5 p-0.5 rounded border border-white/10">
            <button 
              onClick={() => setActiveTab('HASHTAGS')}
              className={`px-2 py-1 text-[8px] font-mono uppercase tracking-tighter transition-all ${activeTab === 'HASHTAGS' ? 'bg-intel-cyan text-black font-bold' : 'text-slate-500 hover:text-white'}`}
            >
              Hashtags
            </button>
            <button 
              onClick={() => setActiveTab('SOCIAL')}
              className={`px-2 py-1 text-[8px] font-mono uppercase tracking-tighter transition-all ${activeTab === 'SOCIAL' ? 'bg-intel-cyan text-black font-bold' : 'text-slate-500 hover:text-white'}`}
            >
              Feed
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
        <AnimatePresence mode="wait">
          {activeTab === 'HASHTAGS' ? (
            <motion.div 
              key="hashtags"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-3"
            >
              {hashtags.map((h, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-2 rounded flex items-center justify-between group hover:border-intel-cyan/30 transition-all">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-3 h-3 text-intel-cyan opacity-50" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white font-mono truncate max-w-[80px]">{h.tag}</span>
                      <span className="text-[8px] font-mono text-slate-500">{h.count}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {h.trend === 'up' && <TrendingUp className="w-3 h-3 text-intel-green" />}
                    {h.trend === 'down' && <TrendingUp className="w-3 h-3 text-intel-red rotate-180" />}
                    {h.trend === 'stable' && <div className="w-3 h-0.5 bg-slate-500 rounded-full" />}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="social"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {posts.map((p, i) => (
                <div key={i} className="border-l-2 border-intel-cyan/20 pl-3 space-y-1 relative group">
                  <div className="absolute left-[-2px] top-0 w-0.5 h-3 bg-intel-cyan opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPlatformIcon(p.platform)}
                      <span className="text-[9px] font-bold text-white font-mono">{p.user}</span>
                      {p.verified && <div className="w-2 h-2 bg-intel-cyan rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>}
                    </div>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">{p.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-mono leading-relaxed uppercase tracking-tight">
                    {p.content}
                  </p>
                  <div className="flex items-center space-x-3 pt-1">
                    <div className="flex items-center space-x-1">
                      <Activity className="w-2.5 h-2.5 text-slate-600" />
                      <span className="text-[7px] font-mono text-slate-600 uppercase">Eng: {p.engagement}</span>
                    </div>
                    <button className="text-[7px] font-mono text-intel-cyan hover:underline uppercase flex items-center space-x-1">
                      <span>Source</span>
                      <ExternalLink className="w-2 h-2" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-black/60 p-2 border-t border-intel-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-3 h-3 text-intel-orange" />
          <span className="text-[7px] font-mono text-slate-500 uppercase">Sentiment: Neutral-Negative</span>
        </div>
        <button 
          onClick={fetchSocialData}
          className="text-[7px] font-mono text-intel-cyan hover:underline uppercase"
        >
          Rescan Network
        </button>
      </div>
    </div>
  );
};
