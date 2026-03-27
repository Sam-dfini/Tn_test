import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Zap, Globe, Lock, 
  AlertTriangle, TrendingUp, Radio, 
  Waves, Target, Database, Eye, 
  MessageSquare, BarChart3, Clock, 
  ChevronRight, ChevronLeft, Search, Bell, Menu, X
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
import { CrossSourceSignals } from './CrossSourceSignals';
import { LeverageableIdeas } from './LeverageableIdeas';

import { Governorate, IntelEvent } from '../../types/intel';

import { usePipeline } from '../../context/PipelineContext';

interface TacticalDashboardProps {
  governorates: Governorate[];
  events: IntelEvent[];
  onOpenAI: () => void;
  onOpenPipeline: (tab?: 'pipeline' | 'sources' | 'hub') => void;
  onGoHome: () => void;
  data: any;
}

export const TacticalDashboard: React.FC<TacticalDashboardProps> = ({
  governorates, events, onOpenAI, onOpenPipeline, onGoHome, data
}) => {
  const { rriState, data: pipelineData } = usePipeline();
  const [geofenceAlerts, setGeofenceAlerts] = React.useState<any[]>([]);
  const [activeRegion, setActiveRegion] = React.useState('National');
  const [viewMode, setViewMode] = React.useState<'MAP' | 'INTEL'>('MAP');
  const [leftCollapsed, setLeftCollapsed] = React.useState(window.innerWidth < 1024);
  const [rightTab, setRightTab] = React.useState<
    'intel' | 'media' | 'social' | 'signals' | 'markets' | 'leverage'
  >('intel');

  const addGeofenceAlert = (alert: any) => {
    setGeofenceAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  // Right sidebar tabs config
  const rightTabs = [
    { id: 'intel', label: 'INTEL', shortLabel: 'INT' },
    { id: 'media', label: 'MEDIA', shortLabel: 'MED' },
    { id: 'social', label: 'SOCIAL', shortLabel: 'SOC' },
    { id: 'markets', label: 'MARKETS', shortLabel: 'MKT' },
    { id: 'signals', label: 'SIGNALS', shortLabel: 'SIG' },
    { id: 'leverage', label: 'LEVERAGE', shortLabel: 'LEV' },
  ];

  return (
    <div className="h-screen bg-[#05070a] text-slate-300
      font-sans overflow-hidden flex flex-col">

      {/* Header */}
      <TacticalHeader
        onOpenAI={onOpenAI}
        onOpenPipeline={onOpenPipeline}
        onGoHome={onGoHome}
        data={data}
        activeRegion={activeRegion}
        onRegionChange={setActiveRegion}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main content — fills remaining height */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-8">
        {/* pb-8 accounts for 32px footer ticker */}

        {/* ============================================
            LEFT SIDEBAR — collapsible
        ============================================ */}
        <div className={`flex flex-col border-r border-intel-border/30
          bg-black/20 transition-all duration-300 shrink-0 ${
          leftCollapsed ? 'w-10' : 'w-[220px]'
        } ${window.innerWidth < 1024 && leftCollapsed ? 'hidden lg:flex' : 'flex'}`}>

          {/* Collapse toggle */}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="flex items-center justify-center h-8 w-full
              border-b border-intel-border/20 text-slate-600
              hover:text-intel-cyan transition-colors shrink-0"
          >
            {leftCollapsed
              ? <ChevronRight className="w-3 h-3" />
              : <ChevronLeft className="w-3 h-3" />
            }
          </button>

          {/* Sidebar content — hidden when collapsed */}
          {!leftCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3
              scrollbar-thin scrollbar-thumb-intel-cyan/10">
              <SensorGrid />
              <InfraWatch />
              <RiskGauges />
            </div>
          )}

          {/* Collapsed — show icon indicators */}
          {leftCollapsed && (
            <div className="flex flex-col items-center py-3
              space-y-4">
              {[
                { color: pipelineData.social.protest_events_30d > 20
                  ? 'bg-intel-red' : 'bg-intel-orange',
                  label: 'SOC' },
                { color: pipelineData.economy.fx_reserves < 90
                  ? 'bg-intel-orange' : 'bg-intel-cyan',
                  label: 'ECO' },
                { color: rriState.rri >= 2.625
                  ? 'bg-intel-red animate-pulse' : 'bg-intel-orange',
                  label: 'RRI' },
              ].map(item => (
                <div key={item.label}
                  className="flex flex-col items-center space-y-1">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[7px] font-mono text-slate-700
                    uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================
            CENTER — MAP (dominant, fills all space)
        ============================================ */}
        <div className="flex-1 flex flex-col overflow-hidden
          min-w-0">
          {/* Map fills everything */}
          <div className="flex-1 relative overflow-hidden">
            <TacticalMap
              governorates={governorates}
              events={events}
              onGeofenceBreach={addGeofenceAlert}
              activeRegion={activeRegion}
            />
          </div>

          {/* Under-map strip — compact, always visible */}
          <div className="h-14 shrink-0 flex items-center
            space-x-3 px-3 border-t border-intel-border/30
            bg-black/40 overflow-x-auto scrollbar-hide">

            {/* Live RRI metrics */}
            {[
              {
                label: 'R(t)',
                value: rriState.rri.toFixed(4),
                color: rriState.rri >= 2.625
                  ? 'text-intel-red' : 'text-intel-orange'
              },
              {
                label: 'P_rev',
                value: (rriState.p_rev * 100).toFixed(1) + '%',
                color: 'text-intel-orange'
              },
              {
                label: 'V(t)',
                value: (rriState.velocity > 0 ? '+' : '') +
                  rriState.velocity.toFixed(3),
                color: rriState.velocity > 0.15
                  ? 'text-intel-red' : 'text-intel-cyan'
              },
              {
                label: 'FX',
                value: pipelineData.economy.fx_reserves + 'd',
                color: pipelineData.economy.fx_reserves < 90
                  ? 'text-intel-orange' : 'text-intel-cyan'
              },
              {
                label: 'UGTT',
                value: pipelineData.social.ugtt_mobilisation_level,
                color: pipelineData.social.ugtt_mobilisation_level
                  === 'HIGH' ? 'text-intel-red' : 'text-intel-orange'
              },
              {
                label: 'Protests',
                value: pipelineData.social.protest_events_30d + '/30d',
                color: pipelineData.social.protest_events_30d > 20
                  ? 'text-intel-red' : 'text-intel-orange'
              },
              {
                label: 'Cascade',
                value: (rriState.cascade_probability * 100).toFixed(0) + '%',
                color: rriState.cascade_probability > 0.6
                  ? 'text-intel-red' : 'text-intel-orange'
              },
              {
                label: 'HPS',
                value: (rriState.pattern_similarity * 100).toFixed(0) + '%',
                color: rriState.pattern_similarity > 0.5
                  ? 'text-intel-orange' : 'text-slate-500'
              },
              {
                label: 'D54',
                value: pipelineData.social.decree54_charged + ' charged',
                color: 'text-intel-red'
              },
              {
                label: 'IMF',
                value: (pipelineData.geopolitical?.imf_deal_probability
                  ?? 31) + '%',
                color: 'text-intel-orange'
              },
            ].map(metric => (
              <div key={metric.label}
                className="flex flex-col items-center shrink-0
                px-3 border-r border-intel-border/20 last:border-0">
                <div className="text-[7px] font-mono text-slate-700
                  uppercase tracking-widest">{metric.label}</div>
                <div className={`text-[10px] font-mono font-bold
                  ${metric.color} whitespace-nowrap`}>
                  {metric.value}
                </div>
              </div>
            ))}

            {/* Geofence alerts counter */}
            {geofenceAlerts.length > 0 && (
              <div className="flex items-center space-x-2 shrink-0
                ml-auto px-3 py-1 bg-intel-red/10 border
                border-intel-red/30 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full
                  bg-intel-red animate-pulse" />
                <span className="text-[9px] font-mono text-intel-red
                  font-bold">
                  {geofenceAlerts.length} BREACH
                  {geofenceAlerts.length > 1 ? 'ES' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================
            RIGHT SIDEBAR — tabbed intelligence panel
        ============================================ */}
        <div className="w-full lg:w-[300px] h-[300px] lg:h-auto
          shrink-0 flex flex-col border-t lg:border-t-0
          lg:border-l border-intel-border/30 bg-black/20">

          {/* Tab bar */}
          <div className="flex items-center border-b
            border-intel-border/30 shrink-0 overflow-x-auto
            scrollbar-hide">
            {rightTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id as any)}
                className={`flex-1 py-2.5 text-[8px] font-mono
                  uppercase tracking-wider transition-all
                  whitespace-nowrap min-w-0 px-1 ${
                  rightTab === tab.id
                    ? 'text-intel-cyan border-b-2 border-intel-cyan bg-intel-cyan/5'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto
            scrollbar-thin scrollbar-thumb-intel-cyan/10">

            {rightTab === 'intel' && (
              <div className="p-3 space-y-3">
                <BreakingIntelFeed externalAlerts={geofenceAlerts} />
                <OSINTStream />
              </div>
            )}

            {rightTab === 'media' && (
              <div className="p-3">
                <LiveMediaStreams />
              </div>
            )}

            {rightTab === 'social' && (
              <div className="p-3">
                <SocialMonitor />
              </div>
            )}

            {rightTab === 'markets' && (
              <div className="p-3 space-y-3">
                <MacroMarkets />
                <NewsTicker />
              </div>
            )}

            {rightTab === 'signals' && (
              <div className="p-3 space-y-3">
                <SignalCore />
                <SweepDelta />
                <CrossSourceSignals />
              </div>
            )}

            {rightTab === 'leverage' && (
              <div className="p-3">
                <LeverageableIdeas />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer ticker — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0
        bg-black/80 backdrop-blur-md border-t
        border-intel-cyan/30 h-8 z-50 flex items-center
        overflow-hidden">
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
        <div className="flex-1 overflow-hidden whitespace-nowrap
          flex items-center">
          <motion.div
            animate={{ x: [0, -2000] }}
            transition={{ duration: 40, repeat: Infinity,
              ease: 'linear' }}
            className="flex items-center space-x-12 px-4"
          >
            {[
              `RRI: R(t)=${rriState.rri.toFixed(4)} P_rev=${(rriState.p_rev*100).toFixed(1)}% — ${rriState.rri >= 2.625 ? '⚠ THRESHOLD BREACHED' : 'ELEVATED RISK'}`,
              `VELOCITY V(t)=${rriState.velocity > 0 ? '+' : ''}${rriState.velocity.toFixed(3)} — ${rriState.velocity_label}`,
              `PATTERN HPS=${(rriState.pattern_similarity*100).toFixed(0)}% — ${rriState.pattern_label || 'NO MATCH'}`,
              `ECONOMY: FX ${pipelineData.economy.fx_reserves}d — INFLATION ${pipelineData.economy.inflation}% — TND/USD ${pipelineData.economy.tnd_usd}`,
              `SOCIAL: ${pipelineData.social.protest_events_30d} PROTESTS/30D — UGTT: ${pipelineData.social.ugtt_mobilisation_level} — D54: ${pipelineData.social.decree54_charged} CHARGED`,
              `CASCADE: P_cascade=${(rriState.cascade_probability*100).toFixed(0)}% — CS(t)=${rriState.compound_stress.toFixed(3)}`,
              `WATER: ${pipelineData.social.water_crisis_govs} GOVS CRITICAL — SFAX 6HRS/DAY`,
              `IMF: ${pipelineData.geopolitical?.imf_deal_probability ?? 31}% DEAL PROBABILITY — Q3 2026 DEADLINE`,
              `GEOFENCES: 8 ZONES ACTIVE — ${geofenceAlerts.length} BREACH ALERTS`,
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full
                  bg-intel-cyan shrink-0" />
                <span className="text-[10px] font-mono
                  text-intel-cyan uppercase tracking-widest">
                  {text}
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
