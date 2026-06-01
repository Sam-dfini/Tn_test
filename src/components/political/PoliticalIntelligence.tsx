import React, { useState, useEffect } from 'react';
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
  Network,
  BookOpen
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { Elections } from './Elections';
import { PoliticalOverview } from './PoliticalOverview';
import { SentimentAnalysis } from './SentimentAnalysis';
import { CivilMovements } from './CivilMovements';
import { PartyDossier } from './PartyDossier';
import { FreedomIndex } from './FreedomIndex';
import { ActorNetwork } from './ActorNetwork';
import { UGTTMonitor } from './UGTTMonitor';
import { PoliticalStabilityIntelligence } from './PoliticalStabilityIntelligence';
import { IdeologicalIntelligence } from '../tactical/IdeologicalIntelligence';

type TabType = 'overview' | 'sentiment' | 'movements' | 'ugtt' | 'ideology' | 'elections' | 'parties' | 'freedom' | 'powermap' | 'stability';

export const PoliticalIntelligence: React.FC<{ context?: any }> = ({ context }) => {
  const [activeSubTab, setActiveSubTab] = useState<TabType>('overview');
  const { rriState } = useRiskMetrics();

  useEffect(() => {
    const handleNavigateSubTab = (e: any) => {
      const { subTab } = e.detail || {};
      if (subTab) {
        const targetTab = tabs.find(t => t.id.toLowerCase() === subTab.toLowerCase());
        if (targetTab) {
          setActiveSubTab(targetTab.id);
        }
      }
    };

    window.addEventListener('navigate-subtab', handleNavigateSubTab);
    return () => window.removeEventListener('navigate-subtab', handleNavigateSubTab);
  }, []);

  const tabs: { id: TabType; label: string; icon: any; description: string }[] = [
    { id: 'overview', label: 'Overview', icon: Globe, description: 'Strategic regime stability and institutional landscape' },
    { id: 'sentiment', label: 'Sentiment', icon: TrendingUp, description: 'Real-time social media and public opinion tracking' },
    { id: 'movements', label: 'Movements', icon: Activity, description: 'Civil unrest, protest frequency, and social actors' },
    { id: 'ideology', label: 'Ideology', icon: BookOpen, description: 'Evolution of Tunisian political ideologies (1956-2026)' },
    { id: 'ugtt', label: 'UGTT', icon: Users, description: 'Labor union monitoring, strike frequency, and wage negotiations' },
    { id: 'elections', label: 'Elections', icon: BarChart3, description: 'Electoral legitimacy and voting pattern analysis' },
    { id: 'parties', label: 'Parties', icon: Users, description: 'Political party dossiers and coalition dynamics' },
    { id: 'freedom', label: 'Freedom', icon: Lock, description: 'Institutional erosion and human rights monitoring' },
    { id: 'powermap', label: 'Power Map', icon: Network, description: 'Interactive actor network and influence mapping' },
    { id: 'stability', label: 'Stability', icon: ShieldAlert, description: 'Political stability and institutional resilience' },
  ];

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Political Intelligence"
        subtitle="Strategic analysis of institutional power, electoral legitimacy, and the shifting dynamics of Tunisia's political actors"
        icon={Users}
        nodeId="POL-NODE-02"
      />

      {/* Top Metadata Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-6 py-3 md:py-2 bg-intel-cyan/5 border-y border-intel-cyan/10 text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-slate-500 relative z-20">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Classification:</span>
            <span className="text-on-surface">Top Secret // Intel-Alpha</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Division:</span>
            <span className="text-on-surface">Political Intelligence (PID)</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Last Update:</span>
            <span className="text-on-surface">{new Date().toISOString().split('T')[0]} 06:00 Z</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-intel-cyan font-bold">Analyst:</span>
            <span className="text-on-surface">AI-SIGINT-09</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="px-2 relative z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 border-b border-intel-border/30 pb-6">
          <div className="flex flex-col items-start lg:items-end gap-4">
          <div className="flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col items-end">
              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-mono">Stability Index</span>
              <span className="text-lg md:text-xl font-bold text-intel-orange font-mono">4.2 / 10</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] md:text-[10px] text-slate-500 uppercase font-mono">Risk Level</span>
              <span className={cn(
                "text-lg md:text-xl font-bold font-mono",
                rriState.rri > 2.8 ? "text-intel-red" : "text-intel-orange"
              )}>
                {rriState.rri > 2.8 ? 'SYSTEMIC RISK' : rriState.rri > 2.4 ? 'POTENTIAL CATALYST' : 'LOCALIZED IMPACT'}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate-to-methodology', { detail: {} }));
              }}
              className="p-2 bg-intel-cyan/10 rounded-lg border border-intel-cyan/20 text-intel-cyan hover:bg-intel-cyan/20 transition-all"
              title="RRI Methodology"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide p-1 bg-black/40 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-xl gap-1">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-2 md:p-4 rounded-lg md:rounded-xl transition-all group relative overflow-hidden flex-shrink-0 min-w-[80px] md:min-w-0 md:flex-1",
              activeSubTab === tab.id 
                ? "bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.1)]" 
                : "text-slate-500 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            {activeSubTab === tab.id && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-intel-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
            )}
            <tab.icon className={cn("w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110", activeSubTab === tab.id ? "text-intel-cyan" : "text-slate-500 group-hover:text-intel-cyan")} />
            <span className="text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest">{tab.label}</span>
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
        {activeSubTab === 'ideology' && <IdeologicalIntelligence />}
        {activeSubTab === 'ugtt' && <UGTTMonitor />}
        {activeSubTab === 'elections' && <Elections />}
        {activeSubTab === 'parties' && <PartyDossier />}
        {activeSubTab === 'freedom' && <FreedomIndex />}
        {activeSubTab === 'powermap' && <ActorNetwork context={context} />}
        {activeSubTab === 'stability' && <PoliticalStabilityIntelligence />}
      </div>

      {/* Footer Intelligence Note */}
      <div className="pt-8 md:pt-12 border-t border-intel-border/30">
        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 p-4 md:p-6 rounded-2xl bg-intel-cyan/5 border border-intel-cyan/10">
          <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-intel-cyan shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Intelligence Advisory</h4>
            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">
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
