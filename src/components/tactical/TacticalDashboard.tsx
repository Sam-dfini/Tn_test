import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Shield, Zap, Globe, Lock, 
  AlertTriangle, TrendingUp, Radio, 
  Waves, Target, Database, Eye, 
  MessageSquare, BarChart3, Clock, 
  ChevronRight, Search, Bell, Menu, X
} from 'lucide-react';

// Sub-components will be defined here or in separate files
import { TacticalHeader } from './TacticalHeader';
import { SensorGrid } from './SensorGrid';
import { NuclearWatch } from './NuclearWatch';
import { RiskGauges } from './RiskGauges';
import { TacticalMap } from './TacticalMap';
import { BreakingIntelFeed } from './BreakingIntelFeed';
import { OSINTStream } from './OSINTStream';
import { SignalCore } from './SignalCore';
import { NewsTicker } from './NewsTicker';
import { SweepDelta } from './SweepDelta';
import { MacroMarkets } from './MacroMarkets';
import { LiveMediaStreams } from './LiveMediaStreams';

import { Governorate, IntelEvent } from '../../types/intel';

interface TacticalDashboardProps {
  governorates: Governorate[];
  events: IntelEvent[];
}

export const TacticalDashboard: React.FC<TacticalDashboardProps> = ({ governorates, events }) => {
  const [geofenceAlerts, setGeofenceAlerts] = React.useState<any[]>([]);

  const addGeofenceAlert = (alert: any) => {
    setGeofenceAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-intel-cyan/30 overflow-x-hidden">
      <TacticalHeader />
      
      <div className="p-4 grid grid-cols-12 gap-4">
        {/* Left Sidebar */}
        <div className="col-span-12 lg:col-span-2 space-y-4">
          <SensorGrid />
          <NuclearWatch />
          <RiskGauges />
        </div>

        {/* Center Area */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <TacticalMap governorates={governorates} events={events} onGeofenceBreach={addGeofenceAlert} />
          <div className="grid grid-cols-12 gap-4">
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
        </div>

        {/* Right Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <LiveMediaStreams />
          <BreakingIntelFeed externalAlerts={geofenceAlerts} />
          <OSINTStream />
        </div>
      </div>

      {/* Persistent Footer Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-intel-cyan/30 h-8 z-50 flex items-center overflow-hidden">
        <div className="bg-intel-red px-3 h-full flex items-center shrink-0">
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-tighter animate-pulse">Flash Intel</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap flex items-center">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex items-center space-x-12 px-4"
          >
            {[
              "SIGNAL DETECTED: SFAX HARBOR BLOCKADE // PRIORITY ALPHA",
              "ECONOMIC ALERT: TUNIS STOCK EXCHANGE SUSPENDS TRADING",
              "WEATHER ADVISORY: SANDSTORM APPROACHING GAFSA SECTOR",
              "POLITICAL: EMERGENCY CABINET MEETING CONVENED AT 03:00Z",
              "OSINT: SOCIAL MEDIA BLACKOUT REPORTED IN SOUTHERN GOVERNORATES"
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-intel-cyan"></div>
                <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="bg-black/60 px-4 h-full flex items-center border-l border-intel-cyan/20 shrink-0">
          <span className="text-[9px] font-mono text-slate-500">{new Date().toISOString()}</span>
        </div>
      </div>
    </div>
  );
};
