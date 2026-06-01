import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  AlertCircle, 
  Zap, 
  ArrowUpRight, 
  Play, 
  Target,
  ChevronRight,
  Info
} from 'lucide-react';
import { MissionConfig, ShockSignal } from '../../types/intel';
import { AutoAssembler } from '../system/WidgetRegistry';
import { PropagationFlowchart } from '../system/PropagationFlowchart';
import { ModuleHeader, BackgroundGrid } from '../shared/ProfessionalShared';

export const MissionWorkspace: React.FC<{ 
  mission: MissionConfig;
  onOpenSandbox: (variables: Record<string, number>) => void;
}> = ({ mission, onOpenSandbox }) => {
  // Mock shock for the flowchart based on mission preloaded variables
  const mockShock: ShockSignal = {
    id: `mission-shock-${mission.id}`,
    type: 'SYSTEM',
    source: 'Mission Context',
    intensity: 0.75,
    message: `Aggregated risk signals for ${mission.title}`,
    timestamp: Date.now(),
    overrides: mission.preloadedVariables,
    affectedEquations: ['EQ.1', 'EQ.13', 'EQ.17']
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'ESCALATING': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'ACTIVE': return 'text-intel-cyan bg-intel-cyan/10 border-intel-cyan/20';
      default: return 'text-slate-500 bg-white/5 border-white/10';
    }
  };

  return (
    <div className="min-h-screen bg-intel-bg text-slate-200 font-sans selection:bg-intel-cyan/30">
      <BackgroundGrid />
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold font-mono ${getStatusColor(mission.status)}`}>
                {mission.status}
              </div>
              <div className={`px-3 py-1 rounded-full border text-[10px] font-bold font-mono ${mission.priority === 'CRITICAL' ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-slate-500 border-white/10 bg-white/5'}`}>
                PRIORITY: {mission.priority}
              </div>
            </div>
            <h1 className="text-4xl font-light tracking-tight text-on-surface uppercase tracking-widest">
              MISSION: <span className="font-bold text-intel-cyan">{mission.title}</span>
            </h1>
            <p className="max-w-2xl text-slate-400 text-sm leading-relaxed italic">
              {mission.description}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold text-on-surface group">
              <Shield className="w-4 h-4 text-intel-cyan group-hover:scale-110 transition-transform" />
              <span>DEFENSE POSTURE</span>
            </button>
            <button className="flex items-center space-x-2 px-6 py-3 bg-intel-cyan text-intel-bg rounded-xl font-bold text-xs hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all">
              <Play className="w-4 h-4 fill-current" />
              <span>RUN FULL SIMULATION</span>
            </button>
          </div>
        </div>

        {/* Involved Domains Row */}
        <div className="flex flex-wrap items-center gap-3 py-4 border-y border-white/5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mr-2">Involved Domains:</span>
          {mission.involvedDomains.map(domain => (
            <div key={domain} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-slate-300">
              {domain}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Telemetry Panel */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-intel-orange" />
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Mission Telemetry</h3>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-intel-green animate-pulse" />
                <span>LIVE FEED ACTIVE</span>
              </div>
            </div>

            <AutoAssembler widgetIds={mission.widgetLayout} />

            {/* Strategic Context Panel */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-2">Strategic Intelligence Summary</h3>
                  <p className="text-xs text-slate-400">Automated cross-domain synthesis for mission {mission.id}</p>
                </div>
                <AlertCircle className="w-6 h-6 text-intel-cyan opacity-50" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Primary Trigger</div>
                  <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="text-xs font-bold text-on-surface mb-1">Divergence Detected</div>
                    <div className="text-[10px] text-slate-400">Current trend shows 12% deviation from historical baseline for {mission.title}.</div>
                  </div>
                </div>
                <div className="space-y-3 md:col-span-2">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Analyst Recommendation</div>
                  <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl flex items-start space-x-4">
                    <Info className="w-5 h-5 text-intel-cyan shrink-0 mt-1" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Initialize sub-national propagation models to identify specific hotspot governorates. 
                      Escalation probability remains HIGH if external financing signals do not stabilize within 14 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel: Shock Propagation */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-intel-red" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Shock Prediction</h3>
            </div>
            
            <PropagationFlowchart shock={mockShock} rriDelta={0.42} />

            <div className="intel-card p-6 rounded-2xl border border-intel-border bg-gradient-to-b from-white/5 to-transparent text-center">
              <div className="mb-6">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-widest mb-2">Simulation Sandbox</h4>
                <p className="text-[10px] text-slate-500 font-mono italic">
                  Hypothesis testing with mission variables
                </p>
              </div>
              
              <button 
                onClick={() => onOpenSandbox(mission.preloadedVariables)}
                className="w-full py-4 bg-white/5 border border-intel-cyan/30 text-intel-cyan rounded-xl text-xs font-bold font-mono hover:bg-intel-cyan/10 transition-all flex items-center justify-center space-x-3 group"
              >
                <span>OPEN IN SIMULATION SUITE</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
