import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  MapPin, 
  MessageSquare, 
  Zap,
  ArrowUpRight, 
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';
import { BackgroundGrid, ModuleHeader, LiveTicker } from '../ProfessionalShared';

const sentimentAlerts = [
  { code: 'SENT-01', title: 'Narrative Shift: Sovereignty discourse up 14%', impact: 'HIGH' },
  { code: 'SENT-02', title: 'Bot Activity Detected: #TunisiaElections', impact: 'CRITICAL' },
  { code: 'SENT-03', title: 'Regional Divergence: Gafsa sentiment drops', impact: 'HIGH' },
  { code: 'SENT-04', title: 'Viral Narrative: "Economic Sovereignty" peak', impact: 'MEDIUM' },
];

const sentimentTrend = [
  { date: '02/20', score: 58.2 },
  { date: '02/25', score: 59.5 },
  { date: '03/02', score: 61.1 },
  { date: '03/07', score: 60.4 },
  { date: '03/12', score: 62.8 },
  { date: '03/17', score: 61.9 },
  { date: '03/21', score: 62.4 },
];

const actorSentiment = [
  { actor: 'Kais Saied', score: 65, trend: '+3.2', volume: 'High', color: '#00ffff' },
  { actor: 'UGTT', score: 42, trend: '-1.5', volume: 'High', color: '#ff4444' },
  { actor: 'Opposition', score: 28, trend: '-4.8', volume: 'Medium', color: '#ffaa00' },
  { actor: 'Media', score: 51, trend: '+0.4', volume: 'Medium', color: '#8884d8' },
];

const narratives = [
  { id: 1, topic: 'Economic Sovereignty', impact: 88, sentiment: 'Positive', lifecycle: 'Peak', reach: '2.4M' },
  { id: 2, topic: 'Decree 54 Resistance', impact: 74, sentiment: 'Negative', lifecycle: 'Emergence', reach: '1.1M' },
  { id: 3, topic: 'IMF Dependency', impact: 62, sentiment: 'Negative', lifecycle: 'Decay', reach: '0.8M' },
  { id: 4, topic: 'National Stability', impact: 81, sentiment: 'Positive', lifecycle: 'Peak', reach: '1.9M' },
  { id: 5, topic: 'Election Integrity', impact: 55, sentiment: 'Mixed', lifecycle: 'Emergence', reach: '0.5M' },
];

const regionalSentiment = [
  { region: 'Tunis', score: 64, trend: 'stable', pop: '2.4M' },
  { region: 'Sfax', score: 58, trend: 'down', pop: '1.2M' },
  { region: 'Gafsa', score: 41, trend: 'critical', pop: '0.4M' },
  { region: 'Sahel', score: 67, trend: 'up', pop: '1.8M' },
  { region: 'Interior', score: 45, trend: 'down', pop: '2.1M' },
];

const urbanRuralData = [
  { category: 'Urban', positive: 58, negative: 24, neutral: 18 },
  { category: 'Rural', positive: 42, negative: 38, neutral: 20 },
];

export const SentimentAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'actors' | 'topics' | 'platforms'>('actors');

  const trendingTopics = [
    { topic: 'Economic Sovereignty', volume: 85, velocity: '+12%' },
    { topic: 'Decree 54', volume: 72, velocity: '+24%' },
    { topic: 'IMF Negotiations', volume: 64, velocity: '-5%' },
    { topic: 'Bread Shortages', volume: 58, velocity: '+18%' },
    { topic: 'Migration Policy', volume: 45, velocity: '+8%' },
  ];

  const platformData = [
    { name: 'Facebook', value: 68, color: '#1877F2' },
    { name: 'TikTok', value: 18, color: '#000000' },
    { name: 'X (Twitter)', value: 8, color: '#1DA1F2' },
    { name: 'Instagram', value: 6, color: '#E4405F' },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white p-8 font-sans overflow-hidden">
      <BackgroundGrid />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <ModuleHeader 
          title="SOCIAL SENTIMENT & DISCOURSE"
          subtitle="Digital Intelligence / Public Perception Matrix"
          icon={MessageSquare}
        />

        <LiveTicker items={sentimentAlerts} />

        {/* Sub-Tabs */}
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
          {[
            { id: 'actors', label: 'ACTORS', icon: <Activity className="w-4 h-4" /> },
            { id: 'topics', label: 'TOPICS', icon: <Zap className="w-4 h-4" /> },
            { id: 'platforms', label: 'PLATFORMS', icon: <MessageSquare className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-intel-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.3)]" 
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'actors' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Stats Row */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'SENTIMENT INDEX', value: '62.4', sub: '+2.1%', color: 'text-intel-cyan' },
                { label: 'VOLATILITY', value: 'LOW', sub: 'Stable Trend', color: 'text-emerald-400' },
                { label: 'TOP PLATFORM', value: 'FB', sub: '68% Volume', color: 'text-blue-400' },
                { label: 'BOT ACTIVITY', value: '4.2%', sub: 'Minimal Impact', color: 'text-slate-400' }
              ].map((stat, i) => (
                <div key={i} className="intel-card p-6 border-l-2 border-l-intel-cyan">
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">{stat.label}</div>
                  <div className={cn("text-3xl font-bold tracking-tighter mt-1", stat.color)}>{stat.value}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Main Trend Chart */}
            <div className="lg:col-span-8 intel-card p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">SENTIMENT TREND (30D)</h3>
                  <p className="text-xs text-slate-500 font-mono uppercase">Aggregate social media perception index</p>
                </div>
                <div className="flex items-center space-x-4 text-[10px] font-mono">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-intel-cyan rounded-full" />
                    <span>SENTIMENT SCORE</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentTrend}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[50, 70]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#00ffff', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00ffff" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Actor Sentiment Matrix */}
            <div className="lg:col-span-4 intel-card p-8">
              <h3 className="text-lg font-bold tracking-tight mb-6">ACTOR SENTIMENT MATRIX</h3>
              <div className="space-y-6">
                {actorSentiment.map((actor) => (
                  <div key={actor.actor} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-bold">{actor.actor}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Volume: {actor.volume}</div>
                      </div>
                      <div className={cn(
                        "text-sm font-bold font-mono",
                        actor.trend.startsWith('+') ? "text-emerald-400" : "text-intel-red"
                      )}>
                        {actor.score}% <span className="text-[10px] opacity-60">({actor.trend})</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${actor.score}%` }}
                        className="h-full"
                        style={{ backgroundColor: actor.color, boxShadow: `0 0 10px ${actor.color}44` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center space-x-2 text-intel-cyan mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">AI Insight</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "Sentiment towards Kais Saied remains resilient in urban centers despite economic headwinds, while UGTT's digital footprint shows increasing polarization."
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trending Topics Bar Chart */}
            <div className="lg:col-span-8 intel-card p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">TRENDING TOPICS</h3>
                  <p className="text-xs text-slate-500 font-mono uppercase">Volume of discourse by theme</p>
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendingTopics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="topic" 
                      type="category" 
                      stroke="#475569" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      width={150}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                    <Bar dataKey="volume" fill="#00ffff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Topic Velocity Panel */}
            <div className="lg:col-span-4 intel-card p-8">
              <h3 className="text-lg font-bold tracking-tight mb-6">TOPIC VELOCITY</h3>
              <div className="space-y-6">
                {trendingTopics.map((topic) => (
                  <div key={topic.topic} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <div className="text-sm font-bold">{topic.topic}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Volume: {topic.volume}k</div>
                    </div>
                    <div className={cn(
                      "flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold font-mono",
                      topic.velocity.startsWith('+') ? "bg-emerald-500/10 text-emerald-400" : "bg-intel-red/10 text-intel-red"
                    )}>
                      {topic.velocity.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                      <span>{topic.velocity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'platforms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Platform Breakdown */}
            <div className="lg:col-span-4 intel-card p-8">
              <h3 className="text-lg font-bold tracking-tight mb-8">PLATFORM BREAKDOWN</h3>
              <div className="space-y-8">
                {platformData.map((platform) => (
                  <div key={platform.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">{platform.name}</span>
                      <span className="text-sm font-mono text-slate-400">{platform.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${platform.value}%` }}
                        className="h-full"
                        style={{ backgroundColor: platform.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic Sentiment Table */}
            <div className="lg:col-span-8 intel-card overflow-hidden">
              <div className="p-8 border-b border-white/10">
                <h3 className="text-lg font-bold tracking-tight">GEOGRAPHIC SENTIMENT BY REGION</h3>
                <p className="text-xs text-slate-500 font-mono uppercase">Sentiment distribution across governorates</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-4 text-[10px] font-mono text-slate-500 uppercase">Region</th>
                      <th className="p-4 text-[10px] font-mono text-slate-500 uppercase">Sentiment Score</th>
                      <th className="p-4 text-[10px] font-mono text-slate-500 uppercase">Trend</th>
                      <th className="p-4 text-[10px] font-mono text-slate-500 uppercase text-right">Population</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalSentiment.map((region) => (
                      <tr key={region.region} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="text-sm font-bold">{region.region}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-1 bg-white/10 rounded-full max-w-[100px]">
                              <div className={cn(
                                "h-full",
                                region.score > 60 ? "bg-intel-cyan" :
                                region.score > 50 ? "bg-emerald-400" :
                                region.score > 45 ? "bg-intel-orange" : "bg-intel-red"
                              )} style={{ width: `${region.score}%` }} />
                            </div>
                            <span className="text-xs font-mono">{region.score}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            region.trend === 'up' ? "bg-emerald-500/10 text-emerald-400" :
                            region.trend === 'down' ? "bg-intel-orange/10 text-intel-orange" :
                            region.trend === 'critical' ? "bg-intel-red/10 text-intel-red" :
                            "bg-white/10 text-slate-400"
                          )}>
                            {region.trend}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-xs font-mono text-slate-400">{region.pop}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
