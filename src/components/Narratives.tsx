import React from 'react';
import { motion } from 'motion/react';
import { FileText, TrendingUp, MessageSquare, Users, Zap } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Political Narratives</h2>
        <p className="text-slate-500 text-sm">Tracking momentum and salience of competing political discourses</p>
        <div className="pt-4">
          <div className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 px-4 py-2 rounded-lg">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono uppercase font-bold">12 Active Clusters</span>
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
              className="glass p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight uppercase">{nar.title}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                      nar.sentiment === 'GOV' ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20' :
                      nar.sentiment === 'OPP' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
                      'bg-intel-orange/10 text-intel-orange border-intel-orange/20'
                    }`}>
                      {nar.sentiment}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase">{nar.sources} Monitored Sources</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Momentum Trend</div>
                  <Sparkline data={nar.history} color={getSentimentColor(nar.sentiment)} />
                  <div className="text-xl font-bold font-mono text-white mt-1">{(nar.momentum * 100).toFixed(0)}</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1 h-1.5 bg-intel-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getSentimentGradient(nar.sentiment)}`} 
                    style={{ width: `${nar.momentum * 100}%` }}
                  ></div>
                </div>
                <div className={`text-[10px] font-mono font-bold ${nar.trend === 'up' ? 'text-intel-green' : 'text-intel-red'}`}>
                  {nar.trend === 'up' ? '↑' : '↓'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass p-8 rounded-2xl flex flex-col">
          <h3 className="text-sm tracking-widest mb-6 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-intel-cyan" />
            Narrative Analysis (AI Synthesis)
          </h3>
          <div className="flex-1 space-y-6">
            <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
              <div className="text-[10px] font-mono text-intel-cyan uppercase font-bold mb-2">Key Claim</div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "The current economic crisis is a result of foreign interference and legacy corruption, necessitating centralized executive power for stabilization."
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Counter-Narrative Tracking</div>
              <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Opposition groups are successfully framing the crisis as "institutional failure" and "authoritarian mismanagement," gaining significant traction in coastal governorates.
                </p>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-intel-border flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-intel-border border border-intel-bg flex items-center justify-center">
                    <Users className="w-3 h-3 text-slate-500" />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full bg-intel-card border border-intel-border flex items-center justify-center text-[8px] font-mono text-slate-500">
                  +12
                </div>
              </div>
              <button className="text-[10px] font-mono text-intel-cyan uppercase font-bold hover:underline">
                View Full Cluster Analysis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
