import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash,
  Radio,
  Headphones,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  ShieldAlert,
  Flame,
  Droplets,
  DollarSign,
  Smile,
  Activity,
  X,
  Bell,
  MoreVertical,
  ThumbsUp,
  MessageSquare,
  Share2,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Governorate, IntelEvent } from '../types/intel';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Map } from './Map';

interface CitizenEditionProps {
  governorates: Governorate[];
  events: IntelEvent[];
  rri: number;
  pRev: number;
  onOpenAI: () => void;
  onGoHome: () => void;
  data: any;
}

// --- Mock Data for the new views ---

const topKeywords = [
  { id: 1, word: 'Inflation', mentions: 124, trend: 'up' },
  { id: 2, word: 'Sfax Water', mentions: 98, trend: 'up' },
  { id: 3, word: 'Elections 2026', mentions: 85, trend: 'stable' },
  { id: 4, word: 'Wheat Supply', mentions: 64, trend: 'down' },
  { id: 5, word: 'Cyber Attack', mentions: 42, trend: 'up' },
  { id: 6, word: 'Protests', mentions: 38, trend: 'stable' },
  { id: 7, word: 'Foreign Reserves', mentions: 31, trend: 'down' },
];

const feedItems = [
  { 
    id: 1, 
    title: 'Protests in Sfax over water shortages', 
    summary: 'Hundreds gathered in central Sfax today to protest against repeated water cuts and lack of infrastructure maintenance.', 
    impact: 'HIGH', 
    confidence: 95, 
    time: '2h ago', 
    category: 'SOCIAL',
    votes: 245
  },
  { 
    id: 2, 
    title: 'Central Bank reports 12% inflation spike', 
    summary: 'New data shows food prices have increased by 15% in the last quarter, driving overall inflation to record highs.', 
    impact: 'CRITICAL', 
    confidence: 98, 
    time: '5h ago', 
    category: 'ECONOMY',
    votes: 512
  },
  { 
    id: 3, 
    title: 'Border security reinforced at Western frontier', 
    summary: 'Tactical units deployed to monitor increased smuggling activity reported by local intelligence nodes.', 
    impact: 'MEDIUM', 
    confidence: 82, 
    time: '8h ago', 
    category: 'SECURITY',
    votes: 128
  },
  { 
    id: 4, 
    title: 'New Startup Act 2.0 proposed in Parliament', 
    summary: 'Legislation aims to provide tax incentives and easier access to foreign currency for tech entrepreneurs.', 
    impact: 'LOW', 
    confidence: 75, 
    time: '12h ago', 
    category: 'ECONOMY',
    votes: 89
  }
];

const marketIndices = [
  { name: 'TUNINDEX', value: '7,452.12', change: -1.24, trend: 'down' },
  { name: 'BVMT', value: '2,145.85', change: -0.85, trend: 'down' },
  { name: 'TND/USD', value: '3.1245', change: 0.12, trend: 'up' },
  { name: 'TND/EUR', value: '3.4120', change: -0.05, trend: 'down' },
];

const economicNews = [
  "Central Bank maintains interest rate at 8% to combat inflation",
  "Tunisia's trade deficit narrows by 15% in Q1 2026",
  "New investment law expected to boost foreign direct investment",
  "Olive oil exports reach record high of 2.5 billion TND",
  "Phosphate production increases by 20% following infrastructure upgrades"
];

const commodities = [
  { name: 'Phosphate', value: '145.20', change: +2.45, trend: 'up' },
  { name: 'Olive Oil', value: '18.50', change: +5.12, trend: 'up' },
  { name: 'Crude Oil', value: '82.45', change: -1.20, trend: 'down' },
  { name: 'Gold', value: '2,145.00', change: +0.85, trend: 'up' },
];

const foodPrices = [
  { name: 'Meat (Beef)', value: '38.500', change: +1.2, trend: 'up', unit: 'KG' },
  { name: 'Chicken', value: '8.450', change: -0.5, trend: 'down', unit: 'KG' },
  { name: 'Eggs (30pcs)', value: '12.800', change: +0.0, trend: 'stable', unit: 'UNIT' },
  { name: 'Potatoes', value: '1.850', change: +5.4, trend: 'up', unit: 'KG' },
  { name: 'Tomatoes', value: '2.100', change: +12.5, trend: 'up', unit: 'KG' },
  { name: 'Pepper', value: '3.400', change: -2.1, trend: 'down', unit: 'KG' },
];

const predictions = [
  { 
    id: 1, 
    question: 'Will there be a nationwide strike before June 2026?', 
    probability: 68.4, 
    category: 'SOCIAL', 
    votes: 1245, 
    daysLeft: 72,
    history: [60, 62, 65, 64, 68, 67, 68.4]
  },
  { 
    id: 2, 
    question: 'Will the TND/USD exchange rate exceed 3.50 in 2026?', 
    probability: 42.1, 
    category: 'ECONOMY', 
    votes: 856, 
    daysLeft: 285,
    history: [45, 44, 43, 42, 41, 42, 42.1]
  },
  { 
    id: 3, 
    question: 'Will a major cabinet reshuffle occur in Q2 2026?', 
    probability: 85.7, 
    category: 'POLITICAL', 
    votes: 2140, 
    daysLeft: 45,
    history: [70, 75, 80, 82, 84, 85, 85.7]
  }
];

// --- Sub-components ---

const KeywordItem: React.FC<{ keyword: typeof topKeywords[0] }> = ({ keyword }) => (
  <div className="flex items-center justify-between p-4 border-b border-intel-border hover:bg-white/5 transition-colors">
    <div className="flex items-center space-x-4">
      <span className="text-intel-red font-mono font-bold">#{keyword.id}</span>
      <span className="text-sm font-bold text-white uppercase tracking-tight">{keyword.word}</span>
    </div>
    <div className="flex items-center space-x-4">
      <span className="text-[10px] font-mono text-slate-500 uppercase">{keyword.mentions} mentions</span>
      {keyword.trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-intel-green" /> : 
       keyword.trend === 'down' ? <ArrowDownRight className="w-4 h-4 text-intel-red" /> : 
       <div className="w-4 h-[2px] bg-slate-500" />}
    </div>
  </div>
);

const FeedCard: React.FC<{ item: typeof feedItems[0] }> = ({ item }) => (
  <div className="glass p-5 rounded-3xl border border-intel-border space-y-4 hover:border-intel-cyan/30 transition-all group">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          item.impact === 'CRITICAL' ? 'bg-intel-red' : 
          item.impact === 'HIGH' ? 'bg-intel-orange' : 'bg-intel-cyan'
        } animate-pulse`} />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{item.category} • {item.time}</span>
      </div>
      <div className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
        item.impact === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/5' :
        item.impact === 'HIGH' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/5' :
        'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5'
      }`}>
        {item.impact}
      </div>
    </div>
    
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-intel-cyan transition-colors">{item.title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{item.summary}</p>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-intel-border/50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 text-intel-green">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Confidence {item.confidence}%</span>
        </div>
      </div>
      <div className="flex items-center space-x-4 text-slate-500">
        <div className="flex items-center space-x-1">
          <ThumbsUp className="w-3 h-3" />
          <span className="text-[10px] font-mono">{item.votes}</span>
        </div>
        <MessageSquare className="w-3 h-3" />
        <Share2 className="w-3 h-3" />
      </div>
    </div>
  </div>
);

const MarketRow: React.FC<{ item: any }> = ({ item }) => (
  <div className="flex items-center justify-between p-4 border-b border-intel-border hover:bg-white/5 transition-colors">
    <div className="flex items-center space-x-3">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">{item.name}</span>
        {item.unit && <span className="text-[8px] text-slate-500 font-mono uppercase">PER {item.unit}</span>}
      </div>
      {item.country && <span className="text-[8px] bg-white/10 px-1 rounded text-slate-500 uppercase font-mono">{item.country}</span>}
    </div>
    <div className="flex items-center space-x-4">
      <span className="text-sm font-mono font-bold text-white">{item.value}</span>
      <div className={`flex items-center space-x-1 ${item.change > 0 ? 'text-intel-green' : item.change < 0 ? 'text-intel-red' : 'text-slate-500'}`}>
        {item.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : item.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : <div className="w-3 h-[2px] bg-slate-500" />}
        <span className="text-[10px] font-mono font-bold">{Math.abs(item.change)}%</span>
      </div>
    </div>
  </div>
);

const PredictionCard: React.FC<{ item: typeof predictions[0] }> = ({ item }) => (
  <div className="glass p-6 rounded-3xl border border-intel-border space-y-6 hover:border-intel-cyan/30 transition-all group">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <BarChart3 className="w-4 h-4 text-intel-red" />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{item.category} • {item.votes} VOTES • {item.daysLeft}D LEFT</span>
      </div>
      <MoreVertical className="w-4 h-4 text-slate-600" />
    </div>

    <h3 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-intel-cyan transition-colors">{item.question}</h3>

    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-3xl font-bold text-intel-green font-mono">{item.probability}% <span className="text-xs uppercase font-bold tracking-widest">YES</span></div>
        </div>
        <div className="h-12 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.history.map((val, i) => ({ val, i }))}>
              <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} dot={false} />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="h-1 w-full bg-intel-border rounded-full overflow-hidden">
        <div className="h-full bg-intel-green" style={{ width: `${item.probability}%` }}></div>
      </div>
      
      <div className="flex justify-between text-[10px] font-mono font-bold">
        <span className="text-intel-green uppercase">{item.probability}% YES</span>
        <span className="text-intel-red uppercase">{(100 - item.probability).toFixed(1)}% NO</span>
      </div>
    </div>

    <button className="w-full py-3 rounded-xl border border-intel-border bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-intel-cyan/10 hover:border-intel-cyan/40 hover:text-intel-cyan transition-all flex items-center justify-center space-x-2">
      <Lock className="w-3 h-3" />
      <span>Sign in to predict</span>
    </button>
  </div>
);

// --- Main Component ---

export const CitizenEdition: React.FC<CitizenEditionProps> = ({ governorates, events, rri, pRev, onOpenAI, onGoHome, data }) => {
  const [activeTab, setActiveTab] = useState<'keywords' | 'feed' | 'operator' | 'markets' | 'predict'>('operator');
  const [searchQuery, setSearchQuery] = useState('');

  const heatmapPoints = useMemo(() => {
    return (events || []).map(e => ({
      lat: e.lat,
      lon: e.lon,
      intensity: e.severity / 3,
      label: e.title,
      risk: e.urgent ? 'CRITICAL' : 'HIGH'
    }));
  }, [events]);

  const navItems = [
    { id: 'keywords', label: 'Keywords', icon: Hash },
    { id: 'feed', label: 'Feed', icon: Radio },
    { id: 'operator', label: 'Operator', icon: Headphones },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'predict', label: 'Predict', icon: BarChart3 },
  ];

  const renderView = () => {
    switch (activeTab) {
      case 'keywords':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Hash className="w-5 h-5 text-intel-red" />
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Top Keywords (24H)</h2>
              </div>
              <X className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setActiveTab('operator')} />
            </div>
            <div className="glass rounded-3xl border border-intel-border overflow-hidden">
              {topKeywords.map(k => <KeywordItem key={k.id} keyword={k} />)}
            </div>
          </div>
        );
      case 'feed':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-intel-red rounded-full animate-pulse" />
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Live Feed</h2>
              </div>
              <X className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setActiveTab('operator')} />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
               {['HIGH', 'MEDIUM', '24H', 'ESCALATION', 'DE-ESCALATION'].map(f => (
                 <button key={f} className="px-4 py-1.5 rounded-lg border border-intel-border bg-white/5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hover:border-intel-cyan/40 transition-all">
                   {f}
                 </button>
               ))}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search intelligence..." 
                className="w-full bg-intel-card border border-intel-border rounded-2xl pl-12 pr-12 py-3 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-colors"
              />
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 cursor-pointer hover:text-intel-cyan transition-colors" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-intel-orange">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Community Top 24H</span>
              </div>
              {feedItems.map(item => <FeedCard key={item.id} item={item} />)}
            </div>
          </div>
        );
      case 'markets':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-intel-red" />
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Markets</h2>
              </div>
              <X className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setActiveTab('operator')} />
            </div>

            {/* Economic News Banner */}
            <div className="bg-intel-red/10 border-y border-intel-red/20 py-2 overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                {[...economicNews, ...economicNews].map((news, i) => (
                  <div key={i} className="flex items-center mx-8">
                    <span className="text-[10px] font-bold text-intel-red uppercase tracking-widest">{news}</span>
                    <div className="w-1 h-1 bg-intel-red rounded-full mx-4" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-intel-red">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Indices</span>
                  </div>
                  <button className="px-3 py-1 rounded-lg border border-intel-red/30 bg-intel-red/5 text-[8px] font-bold text-intel-red uppercase tracking-widest hover:bg-intel-red/10 transition-all">
                    Market Intelligence & Price Monitoring
                  </button>
                </div>
                <div className="glass rounded-3xl border border-intel-border overflow-hidden">
                  {marketIndices.map((m, i) => <MarketRow key={i} item={m} />)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-intel-orange">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Commodities</span>
                </div>
                <div className="glass rounded-3xl border border-intel-border overflow-hidden">
                  {commodities.map((c, i) => <MarketRow key={i} item={c} />)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-intel-cyan">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Essential Food Prices (TND)</span>
                </div>
                <div className="glass rounded-3xl border border-intel-border overflow-hidden">
                  {foodPrices.map((f, i) => <MarketRow key={i} item={f} />)}
                </div>
              </div>
            </div>
          </div>
        );
      case 'predict':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-intel-red" />
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">Top Predictions</h2>
              </div>
              <X className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setActiveTab('operator')} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-intel-red">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Top Predictions</span>
                </div>
                <button className="text-[10px] font-bold text-intel-red uppercase tracking-widest flex items-center space-x-1">
                  <span>View All</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {predictions.map(p => <PredictionCard key={p.id} item={p} />)}
            </div>
          </div>
        );
      case 'operator':
      default:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Operator Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-intel-cyan">
                  <div className="w-2 h-2 bg-intel-cyan rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Operator // Active Session</span>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">TUNISIA <span className="text-intel-cyan">INTEL</span></h1>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={onOpenAI} className="p-3 rounded-2xl bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan glow-cyan">
                  <Zap className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-intel-cyan to-intel-purple p-[1px]">
                  <div className="w-full h-full rounded-full bg-intel-bg flex items-center justify-center overflow-hidden">
                    <Headphones className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-5 rounded-3xl border border-intel-border space-y-2">
                <div className="flex items-center justify-between">
                  <Flame className="w-4 h-4 text-intel-red" />
                  <span className="text-[8px] font-mono text-intel-red uppercase">Alert</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{(pRev * 100).toFixed(1)}%</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Revolution Risk</div>
              </div>
              <div className="glass p-5 rounded-3xl border border-intel-border space-y-2">
                <div className="flex items-center justify-between">
                  <DollarSign className="w-4 h-4 text-intel-orange" />
                  <span className="text-[8px] font-mono text-intel-orange uppercase">High</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">84.1%</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Price Pressure</div>
              </div>
              <div className="glass p-5 rounded-3xl border border-intel-border space-y-2">
                <div className="flex items-center justify-between">
                  <Droplets className="w-4 h-4 text-intel-cyan" />
                  <span className="text-[8px] font-mono text-intel-cyan uppercase">Critical</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">68.2%</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Water Security</div>
              </div>
              <div className="glass p-5 rounded-3xl border border-intel-border space-y-2">
                <div className="flex items-center justify-between">
                  <ShieldAlert className="w-4 h-4 text-intel-green" />
                  <span className="text-[8px] font-mono text-intel-green uppercase">Stable</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono">72.4%</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Public Safety</div>
              </div>
            </div>

            {/* Map Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Geospatial Awareness</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse" />
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Live Heatmap</span>
                </div>
              </div>
              <div className="h-96 w-full relative">
                <Map 
                  governorates={governorates} 
                  events={events} 
                  activeLayer="Vulnerability" 
                  heatmapPoints={heatmapPoints}
                />
              </div>
            </div>

            {/* Recent Alerts List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">Recent Intelligence</h3>
                <button onClick={() => setActiveTab('feed')} className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest">View Feed</button>
              </div>
              <div className="space-y-3">
                {feedItems.slice(0, 2).map(item => (
                  <div key={item.id} className="glass p-4 rounded-2xl border border-intel-border flex items-center justify-between group cursor-pointer hover:border-intel-cyan/30 transition-all" onClick={() => setActiveTab('feed')}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.impact === 'CRITICAL' ? 'bg-intel-red' : 'bg-intel-orange'} animate-pulse`} />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white group-hover:text-intel-cyan transition-colors">{item.title}</div>
                        <div className="text-[8px] font-mono text-slate-500 uppercase">{item.time} • {item.category}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-intel-cyan transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-2xl border border-intel-border bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-intel-cyan/10 hover:border-intel-cyan/40 hover:text-intel-cyan transition-all flex flex-col items-center space-y-2">
                <Bell className="w-5 h-5" />
                <span>Alert Settings</span>
              </button>
              <button onClick={onGoHome} className="p-4 rounded-2xl border border-intel-border bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-intel-red/10 hover:border-intel-red/40 hover:text-intel-red transition-all flex flex-col items-center space-y-2">
                <Zap className="w-5 h-5" />
                <span>Switch Mode</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-intel-bg text-slate-300 pb-32">
      {/* Main Viewport */}
      <main className="max-w-md mx-auto p-6 pt-12">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-intel-bg/90 backdrop-blur-xl border-t border-intel-border px-4 py-3 z-[100]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isOperator = item.id === 'operator';
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
                  isActive ? 'text-intel-red' : 'text-slate-500 hover:text-slate-300'
                } ${isOperator ? 'relative -top-4' : ''}`}
              >
                <div className={`p-2 rounded-full transition-all ${
                  isOperator 
                    ? `bg-intel-bg border-2 ${isActive ? 'border-intel-red glow-red' : 'border-intel-border'} p-4 shadow-2xl` 
                    : ''
                }`}>
                  <item.icon className={`${isOperator ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  {isOperator && <div className="absolute -top-1 -right-1 w-2 h-2 bg-intel-green rounded-full border-2 border-intel-bg"></div>}
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-widest ${isOperator ? 'mt-2' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

