import React from 'react';
import { GitBranch, Database, Shield, Brain, Activity, ArrowRight } from 'lucide-react';
import { StubPage } from '../shared/StubPage';
import { navigationTree } from '../../config/navigation';

export const IntelligenceArchitecture: React.FC = () => {
  const node = navigationTree
    .find(t => t.id === 'missions')
    ?.children?.find(c => c.id === 'intelligence-arch');

  return (
    <div className="space-y-6 pb-8">
      <StubPage nodeContext={node} />

      <div className="glass p-6 rounded-2xl border border-intel-border mt-6">
        <div className="flex items-center space-x-3 mb-6 border-b border-intel-border pb-4">
          <GitBranch className="w-5 h-5 text-intel-cyan" />
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">
              System Data Flow Topology
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Static reference diagram — Full interactive version scheduled for Phase 4
            </p>
          </div>
        </div>

        {/* Static Topology Diagram */}
        <div className="relative p-8 border border-intel-border/50 rounded-xl bg-black/40 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0" 
               style={{ 
                 backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
                 backgroundSize: '24px 24px',
                 opacity: 0.3
               }} 
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
            
            {/* Input Layer */}
            <div className="flex flex-col space-y-4 w-full md:w-1/4">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center mb-2">Ingestion Layer</div>
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 flex flex-col items-center justify-center space-y-2">
                <Database className="w-6 h-6 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-300">RSS / OSINT Feeds</span>
              </div>
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-800/30 flex flex-col items-center justify-center space-y-2">
                <Database className="w-6 h-6 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-300">Supabase DB</span>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-600">
              <ArrowRight className="w-6 h-6" />
            </div>

            {/* Processing Layer */}
            <div className="flex flex-col w-full md:w-1/3">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center mb-2">Processing Engine</div>
              <div className="p-6 rounded-xl border border-intel-cyan/40 bg-intel-cyan/5 flex flex-col items-center justify-center space-y-4 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
                <Brain className="w-8 h-8 text-intel-cyan" />
                <div className="text-center">
                  <div className="text-[12px] font-bold text-on-surface uppercase tracking-wider">RRI Engine</div>
                  <div className="text-[9px] text-intel-cyan/70 font-mono mt-1">250 Variables • 24 Equations</div>
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="hidden md:flex items-center justify-center text-slate-600">
              <ArrowRight className="w-6 h-6" />
            </div>

            {/* Output Layer */}
            <div className="flex flex-col space-y-4 w-full md:w-1/4">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center mb-2">Intelligence Outputs</div>
              <div className="p-4 rounded-xl border border-intel-orange/30 bg-intel-orange/5 flex items-center space-x-3">
                <Shield className="w-5 h-5 text-intel-orange shrink-0" />
                <span className="text-[10px] font-bold text-slate-300">National Command</span>
              </div>
              <div className="p-4 rounded-xl border border-intel-purple/30 bg-intel-purple/5 flex items-center space-x-3">
                <Activity className="w-5 h-5 text-intel-purple shrink-0" />
                <span className="text-[10px] font-bold text-slate-300">Mission Control</span>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-intel-cyan/5 border border-intel-cyan/20 flex items-start space-x-3">
          <Activity className="w-4 h-4 text-intel-cyan shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-intel-cyan uppercase tracking-widest mb-1">Phase 4 Implementation</div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              The full interactive Intelligence Architecture module will allow analysts to view real-time variable ingestion rates, trace individual data points back to their source, and monitor the health of the Supabase integration pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
