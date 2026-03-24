import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion } from 'motion/react';
import { RefreshCw, AlertTriangle, Globe } from 'lucide-react';
import { processArticleForRRI } from '../../utils/rriEngine';

interface NewsItem {
  source: string;
  time: string;
  tags: string[];
  content: string;
}

export const OSINTStream: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOsintData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Get the latest 5 OSINT-style news updates about Tunisia (security, politics, economy, social). Format as a JSON array of objects with fields: source (e.g., 'TUNIS_INTEL', 'TAP_AGENCY'), time (e.g., '2h ago'), tags (array of uppercase strings), and content (brief, tactical description).",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text);
      setNews(data);

      // Nudge RRI for each news item
      data.forEach((item: any) => {
        processArticleForRRI(item.source + ' ' + item.content, 0.5);
      });
      
      // Trigger global RRI recalculation event
      window.dispatchEvent(new CustomEvent('rri-recalculate'));
    } catch (err) {
      console.error('Failed to fetch OSINT data:', err);
      setError('Uplink failed. Retrying connection...');
      // Fallback data
      setNews([
        {
          source: 'TAP_AGENCY',
          time: '12m ago',
          tags: ['PROTEST', 'SFAX'],
          content: 'Water distribution protests entering day 4 in Sfax. Security forces deployed to harbor area. 200+ participants.'
        },
        {
          source: 'NAWAAT_OSINT',
          time: '38m ago',
          tags: ['LEGAL', 'DECREE54'],
          content: 'New Decree 54 charges filed against investigative journalist. Total charged: 67. RSF condemns arrest.'
        },
        {
          source: 'BCT_WIRE',
          time: '1h ago',
          tags: ['ECONOMIC', 'RESERVES'],
          content: 'BCT FX reserves at 84 days import cover. Below 90-day warning threshold. IMF talks continue.'
        },
        {
          source: 'UGTT_PRESS',
          time: '2h ago',
          tags: ['LABOR', 'UGTT'],
          content: 'UGTT secretariat issues ultimatum on CPG wage arrears. General strike threshold at 64%.'
        },
        {
          source: 'GEOPOL_INTEL',
          time: '3h ago',
          tags: ['IMF', 'DIPLOMATIC'],
          content: 'IMF mission departs Tunis without agreement. Q3 debt repayment deadline unchanged.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOsintData();
    const interval = setInterval(fetchOsintData, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-3 h-3 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Tunisia OSINT Stream</h3>
        </div>
        <div className="flex items-center space-x-3">
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-3 h-3 text-intel-cyan" />
            </motion.div>
          )}
          <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">
            {loading ? 'Syncing...' : `${news.length} Active`}
          </span>
        </div>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {error && (
          <div className="flex items-center space-x-2 p-2 bg-intel-red/10 border border-intel-red/20 rounded mb-4">
            <AlertTriangle className="w-3 h-3 text-intel-red" />
            <span className="text-[8px] font-mono text-intel-red uppercase">{error}</span>
          </div>
        )}

        {news.map((n, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="space-y-2 border-l border-intel-cyan/20 pl-3 relative"
          >
            <div className="absolute left-[-1px] top-0 w-[2px] h-2 bg-intel-cyan"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-bold text-intel-orange font-mono">{n.source}</span>
                <span className="text-[8px] font-mono text-slate-600 uppercase">{n.time}</span>
              </div>
              <div className="flex space-x-1">
                {n.tags.map(t => (
                  <span key={t} className="text-[7px] font-mono font-bold px-1 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded uppercase">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-300 leading-relaxed uppercase font-mono tracking-tight">
              {n.content}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-2 border-t border-intel-border flex justify-between items-center">
        <div className="text-[7px] font-mono text-slate-600 uppercase">Region: North Africa // Sector: Tunisia</div>
        <button 
          onClick={fetchOsintData}
          className="text-[7px] font-mono text-intel-cyan hover:underline uppercase"
        >
          Force Refresh
        </button>
      </div>
    </div>
  );
};
