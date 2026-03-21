import React, { useState } from 'react';
import { 
  Users, 
  BarChart3, 
  PieChart, 
  ShieldAlert, 
  Compass, 
  TrendingUp,
  Activity,
  Lock,
  Globe,
  Network
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Elections } from './Elections';
import { PoliticalOverview } from './political/PoliticalOverview';
import { SentimentAnalysis } from './political/SentimentAnalysis';
import { CivilMovements } from './political/CivilMovements';
import { PartyDossier } from './political/PartyDossier';
import { FreedomIndex } from './political/FreedomIndex';
import { ActorNetwork } from './political/ActorNetwork';
import { UGTTMonitor } from './political/UGTTMonitor';

type TabType = 'overview' | 'sentiment' | 'movements' | 'ugtt' | 'elections' | 'parties' | 'freedom' | 'powermap';

export const PoliticalIntelligence: React.FC<{ context?: any }> = ({ context }) => {
  const [activeSubTab, setActiveSubTab] = useState<TabType>('overview');

  const tabs: { id: TabType; label: string; icon: any; description: string }[] = [
    { id: 'overview', label: 'Overview', icon: Globe, description: 'Strategic regime stability and institutional landscape' },
    { id: 'sentiment', label: 'Sentiment', icon: TrendingUp, description: 'Real-time social media and public opinion tracking' },
    { id: 'movements', label: 'Movements', icon: Activity, description: 'Civil unrest, protest frequency, and social actors' },
    { id: 'ugtt', label: 'UGTT', icon: Users, description: 'Labor union monitoring, strike frequency, and wage negotiations' },
    { id: 'elections', label: 'Elections', icon: BarChart3, description: 'Electoral legitimacy and voting pattern analysis' },
    { id: 'parties', label: 'Parties', icon: Users, description: 'Political party dossiers and coalition dynamics' },
    { id: 'freedom', label: 'Freedom', icon: Lock, description: 'Institutional erosion and human rights monitoring' },
    { id: 'powermap', label: 'Power Map', icon: Network, description: 'Interactive actor network and influence mapping' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-2 bg-intel-cyan/5 border-y border-intel-cyan/10 text-[10px] font-mono uppercase tracking-widest text-slate-500">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Classification:</span>
            <span className="text-white">Top Secret // Intel-Alpha</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Division:</span>
            <span className="text-white">Political Intelligence (PID)</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Last Update:</span>
            <span className="text-white">{new Date().toISOString().split('T')[0]} 06:00 Z</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Analyst:</span>
            <span className="text-white">AI-SIGINT-09</span>
          </div>
        </div>
      </div>

      {/* Professional Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-intel-cyan">
            <div className="p-2 bg-intel-cyan/10 rounded-lg border border-intel-cyan/20">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono uppercase tracking-[0.4em] font-bold">Political Intelligence Division</span>
          </div>
          <div>
            <h2 className="text-5xl font-bold text-white tracking-tight leading-none">Regime Stability & Political Landscape</h2>
            <p className="text-slate-500 mt-4 max-w-3xl text-lg leading-relaxed">
              Strategic analysis of institutional power, electoral legitimacy, and the shifting dynamics of Tunisia's political actors. 
              Real-time monitoring of civil unrest and sentiment trends.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Stability Index</span>
              <span className="text-xl font-bold text-intel-orange font-mono">4.2 / 10</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Risk Level</span>
              <span className="text-xl font-bold text-intel-red font-mono">Elevated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 backdrop-blur-xl">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all group relative overflow-hidden",
              activeSubTab === tab.id 
                ? "bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]" 
                : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            {activeSubTab === tab.id && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-intel-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
            )}
            <tab.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeSubTab === tab.id ? "text-intel-cyan" : "text-slate-500 group-hover:text-intel-cyan")} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Description */}
      <div className="px-4 py-3 bg-white/5 border-l-2 border-intel-cyan rounded-r-lg">
        <p className="text-xs text-slate-400 font-mono italic">
          {tabs.find(t => t.id === activeSubTab)?.description}
        </p>
      </div>

      {/* Content Area */}
      <div className="min-h-[600px] animate-in fade-in duration-500">
        {activeSubTab === 'overview' && <PoliticalOverview />}
        {activeSubTab === 'sentiment' && <SentimentAnalysis />}
        {activeSubTab === 'movements' && <CivilMovements />}
        {activeSubTab === 'ugtt' && <UGTTMonitor />}
        {activeSubTab === 'elections' && <Elections />}
        {activeSubTab === 'parties' && <PartyDossier />}
        {activeSubTab === 'freedom' && <FreedomIndex />}
        {activeSubTab === 'powermap' && <ActorNetwork context={context} />}
      </div>

      {/* Footer Intelligence Note */}
      <div className="pt-12 border-t border-intel-border/30">
        <div className="flex items-start space-x-4 p-6 rounded-2xl bg-intel-cyan/5 border border-intel-cyan/10">
          <ShieldAlert className="w-6 h-6 text-intel-cyan shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Intelligence Advisory</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              This dossier is compiled from multi-source intelligence including satellite imagery of protest hotspots, 
              NLP-driven social media sentiment analysis, and field reports from civil society monitors. 
              Data is refreshed every 6 hours to reflect the volatile nature of the current political transition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
