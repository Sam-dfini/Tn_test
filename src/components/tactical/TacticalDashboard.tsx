import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Zap, Globe, Lock, 
  AlertTriangle, TrendingUp, Radio, 
  Waves, Target, Database, Eye, 
  MessageSquare, BarChart3, Clock, 
  ChevronRight, Search, Bell, Menu, X
} from 'lucide-react';

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

import { Governorate, IntelEvent } from '../../types/intel';

import { usePipeline } from '../../context/PipelineContext';

interface TacticalDashboardProps {
  governorates: Governorate[];
  events: IntelEvent[];
  onOpenAI: () => void;
  onGoHome: () => void;
  data: any;
}

export const TacticalDashboard: React.FC<TacticalDashboardProps> = ({ governorates, events, onOpenAI, onGoHome, data }) => {
  const { rriState, data: pipelineData } = usePipeline();
  const [geofenceAlerts, setGeofenceAlerts] = React.useState<any[]>([]);
  const [activeRegion, setActiveRegion] = React.useState('National');
  const [viewMode, setViewMode] = React.useState<'MAP' | 'INTEL'>('MAP');

  const addGeofenceAlert = (alert: any) => {
    setGeofenceAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-intel-cyan/30 overflow-x-hidden">
      <TacticalHeader 
        onOpenAI={onOpenAI} 
        onGoHome={onGoHome} 
        data={data} 
        activeRegion={activeRegion}
        onRegionChange={setActiveRegion}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <div className="p-4 grid grid-cols-12 gap-4 h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left Sidebar: Sensors & Risk */}
        <div className="col-span-12 lg:col-span-2 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-intel-cyan/10">
          <SensorGrid />
          <InfraWatch />
          <RiskGauges />
        </div>

        {/* Center Area: Map & Market Intel */}
        <div className="col-span-12 lg:col-span-7 flex flex-col space-y-4 overflow-hidden">
          {viewMode === 'MAP' ? (
            <>
              <div className="flex-1 min-h-[400px]">
                <TacticalMap 
                  governorates={governorates} 
                  events={events} 
                  onGeofenceBreach={addGeofenceAlert}
                  activeRegion={activeRegion}
                />
              </div>
              <div className="grid grid-cols-12 gap-4 h-[250px] shrink-0">
                <div className="col-span-12 md:col-span-4">
                  <NewsTicker />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <SweepDelta />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <MacroMarkets />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-hidden rounded-xl border border-intel-cyan/20">
              <IdeologicalIntelligence />
            </div>
          )}
        </div>

        {/* Right Sidebar: Live Media & Social Monitoring */}
        <div className="col-span-12 lg:col-span-3 space-y-4 overflow-y-auto pl-2 scrollbar-thin scrollbar-thumb-intel-cyan/10">
          <LiveMediaStreams />
          <SocialMonitor />
          <BreakingIntelFeed externalAlerts={geofenceAlerts} />
          <OSINTStream />
        </div>
      </div>

      {/* Persistent Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-intel-cyan/30 h-7 md:h-8 z-50 flex items-center overflow-hidden">
        <div className="bg-intel-red px-2 md:px-3 h-full flex items-center shrink-0">
          <span className="text-[8px] md:text-[10px] font-mono font-bold text-white uppercase tracking-tighter animate-pulse">Live RRI: {rriState.rri.toFixed(2)}</span>
        </div>
        <div className="bg-intel-orange px-2 md:px-3 h-full flex items-center shrink-0 border-l border-white/10 hidden sm:flex">
          <span className="text-[8px] md:text-[10px] font-mono font-bold text-white uppercase tracking-tighter">P_rev: {(rriState.p_rev * 100).toFixed(1)}%</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap flex items-center">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex items-center space-x-8 md:space-x-12 px-4"
          >
            {[
              `RRI ALERT: R(t) = ${rriState.rri.toFixed(4)} — P_rev = ${(rriState.p_rev*100).toFixed(1)}% — ${rriState.rri >= 2.625 ? 'THRESHOLD BREACHED' : 'ELEVATED RISK'}`,
              `VELOCITY: V(t) = ${rriState.velocity > 0 ? '+' : ''}${rriState.velocity.toFixed(3)} — ${rriState.velocity_label}`,
              `PATTERN: HPS = ${(rriState.pattern_similarity*100).toFixed(0)}% — ${rriState.pattern_label}`,
              `ECONOMIC: FX RESERVES ${pipelineData.economy.fx_reserves} DAYS — INFLATION ${pipelineData.economy.inflation}% — TND/USD ${pipelineData.economy.tnd_usd}`,
              `SOCIAL: ${pipelineData.social.protest_events_30d} PROTEST EVENTS 30D — UGTT: ${pipelineData.social.ugtt_mobilisation_level} — DECREE 54: ${pipelineData.social.decree54_charged} CHARGED`,
              `CASCADE RISK: P_cascade = ${(rriState.cascade_probability*100).toFixed(0)}% — COMPOUND STRESS CS(t) = ${rriState.compound_stress.toFixed(3)}`,
              `WATER CRISIS: ${pipelineData.social.water_crisis_govs} GOVERNORATES AFFECTED — SFAX: 6HRS/DAY SUPPLY`,
              `IMF: DEAL PROBABILITY ${pipelineData.geopolitical?.imf_deal_probability ?? 31}% — EXTERNAL DEBT DEADLINE Q3 2026`,
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-intel-cyan"></div>
                <span className="text-[9px] md:text-[10px] font-mono text-intel-cyan uppercase tracking-widest">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="bg-black/60 px-2 md:px-4 h-full flex items-center border-l border-intel-cyan/20 shrink-0 hidden md:flex">
          <span className="text-[8px] md:text-[9px] font-mono text-slate-500">{new Date().toISOString()}</span>
        </div>
      </div>
    </div>
  );
};
