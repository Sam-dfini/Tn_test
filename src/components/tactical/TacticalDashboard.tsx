import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Zap, Globe, Lock, 
  AlertTriangle, TrendingUp, Radio, 
  Waves, Target, Database, Eye, 
  MessageSquare, BarChart3, Clock, Cloud,
  ChevronRight, ChevronLeft, Search, Bell, Menu, X
} from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { cn } from '../../lib/utils';

// Sub-components will be defined here or in separate files
import { TacticalHeader } from './TacticalHeader';
import { SensorGrid } from './SensorGrid';
import { InfraWatch } from './NuclearWatch';
import { RiskGauges } from './RiskGauges';
import { TacticalMap } from './TacticalMap';
import { BreakingIntelFeed } from './BreakingIntelFeed';
import { OSINTStream } from './OSINTStream';
import { SocialMonitor } from './SocialMonitor';
import { SignalCore } from './SignalCore';
import { NewsTicker } from './NewsTicker';
import { SweepDelta } from './SweepDelta';
import { MacroMarkets } from './MacroMarkets';
import { LiveMediaStreams } from './LiveMediaStreams';
import { IdeologicalIntelligence } from './IdeologicalIntelligence';
import { CrossSourceSignals } from './CrossSourceSignals';
import { LeverageableIdeas } from './LeverageableIdeas';
import { IntelligenceBriefPanel } from '../IntelligenceBriefPanel';

import { WeatherWidget } from './WeatherWidget';
import { FireIncidentsWidget, WaterCutsWidget, RoadAccidentsWidget, SuicidesWidget, ViolenceWidget } from './IncidentWidgets';

import { Governorate, IntelEvent } from '../../types/intel';

import { usePipeline } from '../../context/PipelineContext';
import { useRSS } from '../../context/RSSContext';

interface TacticalDashboardProps {
  governorates: Governorate[];
  events: IntelEvent[];
  onOpenAI: () => void;
  onOpenPipeline: (tab?: 'pipeline' | 'sources' | 'ai-api') => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  data: any;
}

export const TacticalDashboard: React.FC<TacticalDashboardProps> = ({
  governorates, events, onOpenAI, onOpenPipeline, onGoHome, onOpenReport, data
}) => {
  const { rriState, data: pipelineData, aiAnalysis } = usePipeline();
  const { articles: rssArticles } = useRSS();
  const { width } = useWindowSize();
  const isSmallScreen = width < 768;

  const [geofenceAlerts, setGeofenceAlerts] = React.useState<any[]>([]);
  const [activeRegion, setActiveRegion] = React.useState('National');
  const [viewMode, setViewMode] = React.useState<'MAP' | 'INTEL'>('MAP');
  const [leftCollapsed, setLeftCollapsed] = React.useState(isSmallScreen);
  
  useEffect(() => {
    setLeftCollapsed(width < 768);
  }, [width]);

  const [leftTab, setLeftTab] = useState<
    'status' | 'intel' | 'economy' | 'social' | 'signals' | 'weather'
  >('status');
  const [rightTab, setRightTab] = React.useState<'media' | 'fire' | 'water' | 'accidents' | 'suicides' | 'violence'>('media');
  const [showAnalysis, setShowAnalysis] = React.useState(false);

  const addGeofenceAlert = (alert: any) => {
    setGeofenceAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  // Sidebar tabs config
  const leftTabs = [
    { id: 'status', label: 'STATUS', shortLabel: 'STA', icon: Activity },
    { id: 'intel', label: 'INTEL & FEEDS', shortLabel: 'INT', icon: Radio },
    { id: 'economy', label: 'ECONOMY', shortLabel: 'ECO', icon: BarChart3 },
    { id: 'social', label: 'SOCIAL & IDEO', shortLabel: 'SOC', icon: MessageSquare },
    { id: 'weather', label: 'WEATHER', shortLabel: 'WTH', icon: Cloud },
    { id: 'signals', label: 'SIGNALS', shortLabel: 'SIG', icon: Waves },
  ];

  const rightTabs = [
    { id: 'media', label: 'MEDIA', shortLabel: 'MED', icon: Eye },
    { id: 'fire', label: 'FIRE', shortLabel: 'FIR', icon: Zap },
    { id: 'water', label: 'WATER', shortLabel: 'H2O', icon: Cloud },
    { id: 'accidents', label: 'ACCIDENTS', shortLabel: 'ACC', icon: AlertTriangle },
    { id: 'suicides', label: 'SUICIDES', shortLabel: 'SUI', icon: Target },
    { id: 'violence', label: 'VIOLENCE', shortLabel: 'VIO', icon: Activity },
  ];

  return (
    <div className="h-screen bg-background text-on-surface-variant font-sans overflow-hidden flex flex-col min-h-0 min-w-0">

      {/* Header */}
      <TacticalHeader
        onOpenAI={onOpenAI}
        onOpenPipeline={onOpenPipeline}
        onGoHome={onGoHome}
        onOpenReport={onOpenReport}
        data={data}
        activeRegion={activeRegion}
        onRegionChange={setActiveRegion}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main content grid — rigid structure for TV/Res consistency */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[auto_1fr_auto] min-h-0 min-w-0 overflow-hidden relative">
        {/* ============================================
            LEFT SIDEBAR — collapsible
        ============================================ */}
        <div 
          className={cn(
            "flex border-r border-intel-border/30 bg-black/20 transition-all duration-300 shrink-0 min-h-0 relative z-30",
            leftCollapsed ? 'w-12' : 'w-[280px] lg:w-[18vw] xl:w-[16vw]',
            isSmallScreen && leftCollapsed ? 'hidden md:flex' : 'flex'
          )}
        >

          {/* Vertical Navigation Rail */}
          <div className="w-12 border-r border-outline-variant flex flex-col items-center py-4 space-y-4 shrink-0 bg-surface-container">
            <button
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              aria-label={leftCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-expanded={!leftCollapsed}
              className="p-2 text-slate-500 hover:text-intel-cyan transition-colors mb-4"
              title={leftCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {leftCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {leftTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setLeftTab(tab.id as any);
                  if (leftCollapsed) setLeftCollapsed(false);
                }}
                aria-label={tab.label}
                aria-selected={leftTab === tab.id}
                role="tab"
                className={`p-2.5 rounded-xl transition-all duration-300 relative group ${
                  leftTab === tab.id
                    ? 'bg-intel-cyan/10 text-intel-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)] border border-intel-cyan/30'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
                title={tab.label}
              >
                <tab.icon className="w-5 h-5" />
                {leftTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute -left-1 top-1/4 bottom-1/4 w-1 bg-intel-cyan rounded-r-full"
                  />
                )}
                
                {/* Tooltip for collapsed state */}
                {leftCollapsed && (
                  <div className="absolute left-14 px-2 py-1 bg-black border border-intel-border rounded text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {tab.label}
                  </div>
                )}
              </button>
            ))}

            <div className="flex-1" />

            {/* Status Indicators in Rail */}
            <div className="flex flex-col items-center space-y-4 pb-4">
              {[
                { color: pipelineData.social.protest_events_30d > 20 ? 'bg-intel-red' : 'bg-intel-orange', label: 'SOC' },
                { color: pipelineData.economy.fx_reserves < 90 ? 'bg-intel-orange' : 'bg-intel-cyan', label: 'ECO' },
                { color: rriState.rri >= 2.625 ? 'bg-intel-red animate-pulse' : 'bg-intel-orange', label: 'RRI' },
              ].map(item => (
                <div key={item.label} className="flex flex-col items-center space-y-1 group relative">
                  <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`} />
                  <div className="absolute left-8 px-2 py-1 bg-black border border-intel-border rounded text-[8px] font-mono text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label} STATUS
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Content Area */}
          {!leftCollapsed && (
            <div className="flex-1 flex flex-col overflow-hidden bg-surface-container-low">
              <div className="h-12 border-b border-outline-variant flex items-center px-4 justify-between shrink-0">
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.2em]">
                  {leftTabs.find(t => t.id === leftTab)?.label}
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 rounded-full bg-intel-cyan animate-pulse" />
                  <span className="text-[8px] font-mono text-intel-cyan/50 uppercase">Live Node</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary-container/10">
                {leftTab === 'status' && (
                  <div className="space-y-4">
                    <RiskGauges />
                    <SensorGrid />
                    <InfraWatch />
                  </div>
                )}
                
                {leftTab === 'intel' && (
                  <div className="space-y-4">
                    <BreakingIntelFeed externalAlerts={geofenceAlerts} />
                    <OSINTStream />
                    <NewsTicker />
                  </div>
                )}
                
                {leftTab === 'economy' && (
                  <div className="space-y-4">
                    <MacroMarkets />
                    <LeverageableIdeas />
                  </div>
                )}
                
                {leftTab === 'social' && (
                  <div className="space-y-4">
                    <SocialMonitor />
                    <IdeologicalIntelligence compact />
                  </div>
                )}
                
                {leftTab === 'weather' && (
                  <div className="space-y-4">
                    <WeatherWidget />
                  </div>
                )}
                
                {leftTab === 'signals' && (
                  <div className="space-y-4">
                    <SignalCore />
                    <SweepDelta />
                    <CrossSourceSignals />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            CENTER — MAP (dominant)
        ============================================ */}
        <div className="flex flex-col overflow-hidden min-w-0 min-h-0 relative">
          <div className="flex-1 relative overflow-hidden">
            <TacticalMap
              governorates={governorates}
              events={events}
              onGeofenceBreach={addGeofenceAlert}
              activeRegion={activeRegion}
              onRegionChange={setActiveRegion}
              showAccidents={true}
            />
          </div>

          {/* Under-map strip */}
          <div className="h-[5vh] min-h-[40px] max-h-[60px] shrink-0 flex items-center border-t border-intel-border/30 bg-black/40 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#05070a] via-[#05070a]/90 to-transparent z-10 flex items-center px-3 border-r border-intel-cyan/20">
              <span className="text-[9px] font-mono font-bold text-intel-cyan uppercase tracking-widest flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse mr-2" />
                LIVE FEED
              </span>
            </div>
            
            <div className="flex-1 overflow-hidden relative h-full">
              <motion.div 
                animate={{ x: [0, -2000] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                className="flex items-center h-full space-x-12 whitespace-nowrap pl-32"
              >
                {rssArticles
                  .slice(0, 10)
                  .filter(a => typeof a?.id === "string" && a.id.trim() !== "")
                  .map((article) => (
                  <div key={`ticker-1-${article.id}`} className="flex items-center space-x-3">
                    <span className="text-[9px] font-mono text-slate-500">{new Date(article.published_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wide ${article.severity >= 4 ? 'text-intel-red' : 'text-white'}`}>
                      {article.source_name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-xs">
                      {article.title}
                    </span>
                    <span className="text-[10px] font-mono text-intel-cyan/50 ml-4">//</span>
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {rssArticles
                  .slice(0, 10)
                  .filter(a => typeof a?.id === "string" && a.id.trim() !== "")
                  .map((article) => (
                  <div key={`ticker-2-${article.id}`} className="flex items-center space-x-3">
                    <span className="text-[9px] font-mono text-slate-500">{new Date(article.published_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wide ${article.severity >= 4 ? 'text-intel-red' : 'text-white'}`}>
                      {article.source_name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate max-w-xs">
                      {article.title}
                    </span>
                    <span className="text-[10px] font-mono text-intel-cyan/50 ml-4">//</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* ============================================
            RIGHT SIDEBAR — tabbed intelligence panel
        ============================================ */}
        <div className="flex border-t md:border-t-0 md:border-l border-intel-border/30 bg-black/20 w-full md:w-[300px] lg:w-[22vw] xl:w-[20vw] h-[350px] md:h-auto shrink-0 min-h-0 z-30">
          
          {/* Right Sidebar Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-intel-cyan/10 min-h-0">
            <div className="p-3 space-y-4">
              <IntelligenceBriefPanel compact={true} />
              {rightTab === 'media' && <LiveMediaStreams />}
              {rightTab === 'fire' && <FireIncidentsWidget />}
              {rightTab === 'water' && <WaterCutsWidget />}
              {rightTab === 'accidents' && <RoadAccidentsWidget />}
              {rightTab === 'suicides' && <SuicidesWidget />}
              {rightTab === 'violence' && <ViolenceWidget />}
            </div>
          </div>

          {/* Right Sidebar Tabs */}
          <div className="w-12 shrink-0 border-l border-intel-border/30 bg-black/40 flex flex-col">
            {rightTabs.map(tab => (
              <button
                key={`right-tab-${tab.id}`}
                onClick={() => setRightTab(tab.id as any)}
                aria-label={tab.label}
                aria-selected={rightTab === tab.id}
                role="tab"
                className={`h-16 flex flex-col items-center justify-center space-y-1 border-b border-intel-border/30 transition-colors relative ${
                  rightTab === tab.id 
                    ? 'text-intel-cyan bg-intel-cyan/10' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {rightTab === tab.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-intel-cyan shadow-[0_0_8px_#00f2ff]" />
                )}
                <tab.icon className="w-4 h-4" />
                <span className="text-[8px] font-mono font-bold tracking-widest">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Analysis Panel */}
      <motion.div
        initial={false}
        animate={{ height: showAnalysis ? '40vh' : '0px' }}
        className="fixed bottom-8 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-intel-cyan/30 z-40 overflow-hidden min-h-0"
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-intel-border/30 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-intel-cyan" />
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">Tactical Analysis & Breaches</h4>
            </div>
            <button 
              onClick={() => setShowAnalysis(false)}
              aria-label="Close analysis panel"
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Breaches List */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-mono text-intel-red font-bold uppercase mb-2">Active Threshold Breaches</h5>
              <div className="space-y-2">
                {rriState.threshold_breaches?.map((breach: any, idx: number) => (
                  <div key={`breach-${breach.variable || idx}-${idx}`} className="bg-intel-red/5 border border-intel-red/20 p-2 rounded flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-white">{breach.label || breach.variable}</div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase">Value: {breach.value} (Limit: {breach.threshold})</div>
                    </div>
                    <div className="text-[10px] font-mono text-intel-red font-bold">+{breach.impact?.toFixed(3)} RRI</div>
                  </div>
                ))}
                {(!rriState.threshold_breaches || rriState.threshold_breaches.length === 0) && (
                  <div className="text-[10px] font-mono text-slate-600 italic">No critical breaches detected.</div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-mono text-intel-cyan font-bold uppercase mb-2">Strategic AI Insights</h5>
              <div className="space-y-3">
                {aiAnalysis?.summary && (
                  <div className="bg-intel-cyan/10 border border-intel-cyan/30 p-3 rounded-lg mb-4">
                    <p className="text-[10px] text-white leading-relaxed italic">"{aiAnalysis.summary}"</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-2">
                  {aiAnalysis?.keyDrivers?.slice(0, 3).map((driver: string, idx: number) => (
                    <div key={`driver-${driver}-${idx}`} className="bg-intel-cyan/5 border border-intel-cyan/20 p-2 rounded">
                      <div className="text-[10px] font-bold text-intel-cyan mb-1 flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Key Driver
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">{driver}</p>
                    </div>
                  ))}
                  {aiAnalysis?.recommendations?.slice(0, 2).map((rec: string, idx: number) => (
                    <div key={`rec-${rec}-${idx}`} className="bg-white/5 border border-white/10 p-2 rounded">
                      <div className="text-[10px] font-bold text-white mb-1 flex items-center">
                        <Zap className="w-3 h-3 mr-1 text-intel-orange" />
                        Recommendation
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>

                {!aiAnalysis && (
                  <div className="text-[10px] font-mono text-slate-600 italic p-4 text-center border border-dashed border-intel-border/30 rounded-lg">
                    Analysis engine standby. Run intelligence loop to generate strategic insights.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer ticker — fixed at bottom */}
      <div className="h-[4vh] min-h-[28px] max-h-[40px]
        bg-black/80 backdrop-blur-md border-t
        border-intel-cyan/30 z-[60] flex items-center
        overflow-hidden shrink-0">
        <div className="bg-intel-red px-3 h-full flex
          items-center shrink-0">
          <span className="text-[10px] font-mono font-bold
            text-white uppercase tracking-tighter animate-pulse">
            RRI: {rriState.rri.toFixed(2)}
          </span>
        </div>
        <div className="bg-intel-orange px-3 h-full flex
          items-center shrink-0 border-l border-white/10">
          <span className="text-[10px] font-mono font-bold
            text-white uppercase tracking-tighter">
            P_rev: {(rriState.p_rev * 100).toFixed(1)}%
          </span>
        </div>

        {/* Breaches Icon & Analysis Toggle */}
        <button 
          onClick={() => setShowAnalysis(!showAnalysis)}
          aria-label={showAnalysis ? "Hide breaches analysis" : "Show breaches analysis"}
          aria-expanded={showAnalysis}
          className={`px-3 h-full flex items-center shrink-0 border-l border-white/10 transition-all ${
            showAnalysis ? 'bg-intel-cyan/20' : 'hover:bg-white/5'
          }`}
        >
          <div className="relative mr-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${rriState.threshold_breaches?.length > 0 ? 'text-intel-red' : 'text-slate-500'}`} />
            {rriState.threshold_breaches?.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-intel-red rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-tighter">
            {rriState.threshold_breaches?.length || 0} BREACHES
          </span>
          <ChevronRight className={`w-3 h-3 ml-2 transition-transform duration-300 ${showAnalysis ? '-rotate-90' : 'rotate-0'}`} />
        </button>
        <div className="flex-1 overflow-hidden whitespace-nowrap
          flex items-center">
          <motion.div
            animate={{ x: [0, -2000] }}
            transition={{ duration: 40, repeat: Infinity,
              ease: 'linear' }}
            className="flex items-center space-x-12 px-4"
          >
            {events
              .filter(e => typeof e?.id === "string" && e.id.trim() !== "")
              .map((event) => (
              <div key={`footer-event-1-${event.id}`} className="flex items-center space-x-2">
                <div className={`w-1 h-1 rounded-full shrink-0 ${event.urgent ? 'bg-intel-red animate-pulse' : 'bg-intel-cyan'}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest ${event.urgent ? 'text-intel-red' : 'text-intel-cyan'}`}>
                  {event.date} — {event.title || 'No Title'}: {(event as any).summary || (event as any).description || ''}
                </span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {events
              .filter(e => typeof e?.id === "string" && e.id.trim() !== "")
              .map((event) => (
              <div key={`footer-event-2-${event.id}`} className="flex items-center space-x-2">
                <div className={`w-1 h-1 rounded-full shrink-0 ${event.urgent ? 'bg-intel-red animate-pulse' : 'bg-intel-cyan'}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest ${event.urgent ? 'text-intel-red' : 'text-intel-cyan'}`}>
                  {event.date} — {event.title || 'No Title'}: {(event as any).summary || (event as any).description || ''}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="bg-black/60 px-4 h-full flex items-center
          border-l border-intel-cyan/20 shrink-0">
          <span className="text-[9px] font-mono text-slate-500">
            {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
          </span>
        </div>
      </div>

    </div>
  );
};
