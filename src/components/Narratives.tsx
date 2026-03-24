import React from 'react';
import { motion } from 'motion/react';
import { FileText, TrendingUp, MessageSquare, Users, Zap, ShieldAlert } from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { cn } from '../utils/cn';

const narratives = [
  { 
    id: 'n1', 
    title: 'Economic Sovereignty', 
    momentum: 0.85, 
    sentiment: 'GOV', 
    sources: 12, 
    trend: 'up',
    history: [0.65, 0.70, 0.75, 0.82, 0.85]
  },
  { 
    id: 'n2', 
    title: 'Judicial Independence', 
    momentum: 0.72, 
    sentiment: 'OPP', 
    sources: 8, 
    trend: 'up',
    history: [0.45, 0.52, 0.60, 0.68, 0.72]
  },
  { 
    id: 'n3', 
    title: 'Security Legitimacy', 
    momentum: 0.64, 
    sentiment: 'GOV', 
    sources: 15, 
    trend: 'down',
    history: [0.80, 0.78, 0.72, 0.68, 0.64]
  },
  { 
    id: 'n4', 
    title: 'UGTT Resistance', 
    momentum: 0.78, 
    sentiment: 'STREET', 
    sources: 22, 
    trend: 'up',
    history: [0.55, 0.62, 0.70, 0.75, 0.78]
  },
];

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  const width = 60;
  const height = 20;
  const padding = 2;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (width - padding * 2) + padding,
    y: height - (d * (height - padding * 2) + padding)
  }));

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
};

export const Narratives: React.FC = () => {
  const { rriState } = usePipeline();
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'GOV': return '#00f2ff'; // intel-cyan
      case 'OPP': return '#ff3b3b'; // intel-red
      case 'STREET': return '#f59e0b'; // intel-orange
      default: return '#94a3b8';
    }
  };

  const getSentimentGradient = (sentiment: string) => {
    switch (sentiment) {
      case 'GOV': return 'from-intel-cyan/20 to-intel-cyan';
      case 'OPP': return 'from-intel-red/20 to-intel-red';
      case 'STREET': return 'from-intel-orange/20 to-intel-orange';
      default: return 'from-slate-500/20 to-slate-500';
    }
  };

  const activeClusters = 12;
  const analysisNotes = [
    {
      title: 'Key Claim',
      content: '"The current economic crisis is a result of foreign interference and legacy corruption, necessitating centralized executive power for stabilization."',
      color: 'intel-cyan',
      icon: Zap
    },
    {
      title: 'Counter-Narrative Tracking',
      content: 'Opposition groups are successfully framing the crisis as "institutional failure" and "authoritarian mismanagement," gaining significant traction in coastal governorates.',
      color: 'intel-red',
      icon: ShieldAlert
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight font-bold text-white uppercase">Political Narratives</h2>
        <p className="text-slate-500 text-sm max-w-2xl">Tracking momentum and salience of competing political discourses across monitored media and social channels.</p>
        <div className="pt-4">
          <div className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 px-4 py-2 rounded-lg">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">{activeClusters} Active Clusters</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {narratives.map((nar, i) => (
            <motion.div 
              key={nar.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="intel-card p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white tracking-tight uppercase">{nar.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold",
                      nar.sentiment === 'GOV' ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20' :
                      nar.sentiment === 'OPP' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
                      'bg-intel-orange/10 text-intel-orange border-intel-orange/20'
                    )}>
                      {nar.sentiment}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">{nar.sources} Monitored Sources</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1 tracking-widest">Momentum Trend</div>
                  <Sparkline data={nar.history} color={getSentimentColor(nar.sentiment)} />
                  <div className="text-xl font-bold font-mono text-white mt-1">{(nar.momentum * 100).toFixed(0)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getSentimentGradient(nar.sentiment)} transition-all duration-1000`} 
                    style={{ width: `${nar.momentum * 100}%` }}
                  ></div>
                </div>
                <div className={cn(
                  "text-[10px] font-mono font-bold",
                  nar.trend === 'up' ? 'text-intel-green' : 'text-intel-red'
                )}>
                  {nar.trend === 'up' ? '↑' : '↓'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="intel-card p-8 rounded-2xl border border-intel-border flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-intel-cyan" />
              Narrative Analysis (AI Synthesis)
            </h3>
            <span className="text-[8px] font-mono text-slate-500 uppercase">Last Update: Q1 2026</span>
          </div>
          
          <div className="flex-1 space-y-6">
            {analysisNotes.map((note, i) => (
              <div key={i} className={cn("p-5 rounded-2xl border space-y-3", 
                note.color === 'intel-cyan' ? "bg-intel-cyan/5 border-intel-cyan/20" : "bg-intel-red/5 border-intel-red/20"
              )}>
                <div className="flex items-center space-x-2">
                  <note.icon className={cn("w-3 h-3", note.color === 'intel-cyan' ? "text-intel-cyan" : "text-intel-red")} />
                  <div className={cn("text-[10px] font-mono uppercase font-bold", 
                    note.color === 'intel-cyan' ? "text-intel-cyan" : "text-intel-red"
                  )}>{note.title}</div>
                </div>
                <p className={cn("text-xs leading-relaxed italic", 
                  note.color === 'intel-cyan' ? "text-slate-300" : "text-slate-400"
                )}>
                  {note.content}
                </p>
              </div>
            ))}
            
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sentiment Distribution</div>
              <div className="flex h-2 w-full rounded-full overflow-hidden">
                <div className="h-full bg-intel-cyan" style={{ width: '45%' }} />
                <div className="h-full bg-intel-red" style={{ width: '35%' }} />
                <div className="h-full bg-intel-orange" style={{ width: '20%' }} />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mr-1" /> GOV (45%)</span>
                <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-intel-red mr-1" /> OPP (35%)</span>
                <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-intel-orange mr-1" /> STREET (20%)</span>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-intel-border flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border border-intel-bg flex items-center justify-center">
                    <Users className="w-3 h-3 text-slate-500" />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full bg-intel-card border border-intel-border flex items-center justify-center text-[8px] font-mono text-slate-500">
                  +12
                </div>
              </div>
              <button className="text-[10px] font-mono text-intel-cyan uppercase font-bold hover:underline tracking-widest">
                View Full Cluster Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
