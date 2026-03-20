import React from 'react';
import { 
  TrendingUp,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

const sentimentData = [
  { name: 'Kais Saied', score: 65, trend: 'up', topics: ['Stability', 'Sovereignty', 'Anti-Corruption'] },
  { name: 'Ennahda', score: -42, trend: 'down', topics: ['Detentions', 'Economic Crisis', 'Legitimacy'] },
  { name: 'Abir Moussi', score: 28, trend: 'stable', topics: ['Resistance', 'Old Guard', 'Legal Battles'] },
  { name: 'Echaab', score: 15, trend: 'down', topics: ['Support', 'Nuance', 'Unionism'] },
];

const trendingTopics = [
  { topic: '#TunisiaElections', volume: '125K', sentiment: 'Mixed' },
  { topic: 'Decree 54', volume: '88K', sentiment: 'Negative' },
  { topic: 'IMF Loan', volume: '72K', sentiment: 'Negative' },
  { topic: 'National Sovereignty', volume: '65K', sentiment: 'Positive' },
];

const platformData = [
  { platform: 'Facebook', sentiment: 'Positive', volume: '65%', color: 'text-blue-500' },
  { platform: 'X (Twitter)', sentiment: 'Negative', volume: '25%', color: 'text-slate-400' },
  { platform: 'TikTok', sentiment: 'Neutral', volume: '10%', color: 'text-pink-500' },
];

const topicCloud = [
  { tag: 'Constitution', size: 'text-lg', color: 'text-white' },
  { tag: 'IMF', size: 'text-sm', color: 'text-intel-red' },
  { tag: 'Sovereignty', size: 'text-xl', color: 'text-intel-cyan' },
  { tag: 'Elections', size: 'text-md', color: 'text-intel-orange' },
  { tag: 'Detentions', size: 'text-sm', color: 'text-intel-red' },
  { tag: 'Stability', size: 'text-lg', color: 'text-intel-cyan' },
  { tag: 'Reform', size: 'text-xs', color: 'text-slate-500' },
];

export const SentimentAnalysis: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sentiment Scores */}
      <div className="lg:col-span-8 glass p-8 rounded-3xl border border-intel-border/50 space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-intel-cyan" />
            <span>Social Media Sentiment Tracker</span>
          </h3>
          <p className="text-xs text-slate-500 uppercase font-mono">Real-time analysis of digital discourse & public perception</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sentimentData.map(actor => (
            <div key={actor.name} className="p-6 rounded-2xl bg-white/5 border border-intel-border space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-bold text-white">{actor.name}</div>
                  <div className="text-[8px] text-slate-500 uppercase font-mono">Sentiment Score</div>
                </div>
                <div className={cn(
                  "flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono",
                  actor.score > 0 ? "text-intel-cyan bg-intel-cyan/10" : "text-intel-red bg-intel-red/10"
                )}>
                  {actor.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90" />}
                  <span>{actor.score}%</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    actor.score > 0 ? "bg-intel-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]" : "bg-intel-red shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                  )} 
                  style={{ width: `${Math.abs(actor.score)}%` }}
                ></div>
              </div>

              <div className="flex flex-wrap gap-2">
                {actor.topics.map(topic => (
                  <span key={topic} className="text-[8px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="lg:col-span-4 space-y-8">
        <div className="glass p-8 rounded-3xl border border-intel-border/50 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-intel-orange" />
              <span>Trending Political Topics</span>
            </h3>
            <p className="text-xs text-slate-500 uppercase font-mono">High-volume digital discourse keywords</p>
          </div>

          <div className="space-y-4">
            {trendingTopics.map(item => (
              <div key={item.topic} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-intel-border group hover:border-intel-orange/30 transition-all">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white group-hover:text-intel-orange transition-colors">{item.topic}</div>
                  <div className="text-[8px] text-slate-500 uppercase font-mono">{item.volume} mentions / 24h</div>
                </div>
                <div className={cn(
                  "text-[8px] font-mono px-2 py-0.5 rounded border uppercase",
                  item.sentiment === 'Positive' ? "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20" :
                  item.sentiment === 'Negative' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                  "bg-white/5 text-slate-400 border-white/10"
                )}>
                  {item.sentiment}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Platform Sentiment Breakdown</h4>
          <div className="space-y-3">
            {platformData.map(p => (
              <div key={p.platform} className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className={p.color}>{p.platform}</span>
                  <span className="text-slate-500">{p.volume} Volume</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={cn("h-full", p.color.replace('text-', 'bg-'))} style={{ width: p.volume }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Cloud */}
        <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Discourse Topic Cloud</h4>
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {topicCloud.map(t => (
              <span key={t.tag} className={cn("font-bold tracking-tight hover:scale-110 transition-transform cursor-default", t.size, t.color)}>
                {t.tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
