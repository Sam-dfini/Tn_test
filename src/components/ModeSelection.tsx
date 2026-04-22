import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, AlertCircle, Box, Eye, ShieldAlert } from 'lucide-react';
import { ModePageLayout } from './ModePageLayout';

interface ModeSelectionProps {
  onSelect: (mode: 'simplified' | 'advanced' | 'professional' | 'palantir' | 'bloomberg' | 'business_investigator' | 'test' | 'terminal') => void;
  onLogoff: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect, onLogoff }) => {
  return (
    <ModePageLayout
      headerAction={
        <button 
          onClick={onLogoff}
          aria-label="Logout from system"
          className="text-[#ef4444] font-mono text-[10px] border border-[#ef4444]/20 px-3 py-1 hover:bg-[#ef4444]/10 transition-colors"
        >
          [ LOGOUT ]
        </button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">SYSTEM ACCESS GATEWAY</h1>
            <p className="text-intel-cyan font-mono text-sm">// SELECT OPERATIONAL INTERFACE</p>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-observability'))}
            className="flex items-center gap-2 px-4 py-2 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-mono rounded"
          >
            <ShieldAlert className="w-4 h-4" />
             [ MISSION CONTROL ]
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Professional Intel */}
          <div className="border border-slate-700 p-6 space-y-4 bg-[#0f141a]">
            <div className="flex justify-between items-start">
              <div className="text-xs font-mono text-intel-cyan">INTEL_NODE_01</div>
              <Box className="w-5 h-5 text-intel-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white">PROFESSIONAL INTEL</h2>
            <p className="text-sm text-slate-400">Aggregate high-fidelity geopolitical telemetry from verified sovereign channels. Optimized for deep-state analysis and strategic foresight planning with minimal latency.</p>
            <button 
              onClick={() => onSelect('professional')}
              aria-label="Initiate Professional Intel mode"
              className="border border-intel-cyan text-intel-cyan px-4 py-2 font-mono text-xs hover:bg-intel-cyan/10"
            >
              [ INITIATE ]
            </button>
          </div>

          {/* Tactical OSINT */}
          <div className="border border-slate-700 p-6 space-y-4 bg-[#0f141a]">
            <div className="flex justify-between items-start">
              <div className="text-xs font-mono text-intel-cyan">INTEL_NODE_02</div>
              <Eye className="w-5 h-5 text-intel-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white">TACTICAL OSINT</h2>
            <p className="text-sm text-slate-400">Real-time open-source reconnaissance engine. Direct feed from global social signals, satellite imagery, and localized transmission clusters. Decipher the ground truth.</p>
            <button 
              onClick={() => onSelect('advanced')}
              aria-label="Initiate Tactical OSINT mode"
              className="border border-intel-cyan text-intel-cyan px-4 py-2 font-mono text-xs hover:bg-intel-cyan/10"
            >
              [ INITIATE ]
            </button>
          </div>

          {/* Business Investigator */}
          <div className="border border-slate-700 p-6 space-y-4 bg-[#0f141a]">
            <div className="flex justify-between items-start">
              <div className="text-xs font-mono text-intel-cyan">INTEL_NODE_03</div>
              <Eye className="w-5 h-5 text-intel-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white">BUSINESS INVESTIGATOR</h2>
            <p className="text-sm text-slate-400">Advanced Economic Intelligence System operating in "Bloomberg Mode" for emerging markets. Transform economic data into actionable, field-level intelligence.</p>
            <button 
              onClick={() => onSelect('business_investigator')}
              aria-label="Initiate Business Investigator mode"
              className="border border-intel-cyan text-intel-cyan px-4 py-2 font-mono text-xs hover:bg-intel-cyan/10"
            >
              [ INITIATE ]
            </button>
          </div>

          {/* Test Mode */}
          <div className="border border-slate-700 p-6 space-y-4 bg-[#0f141a]">
            <div className="flex justify-between items-start">
              <div className="text-xs font-mono text-intel-cyan">INTEL_NODE_04</div>
              <Box className="w-5 h-5 text-intel-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white">TEST MODE</h2>
            <p className="text-sm text-slate-400">Experimental Plexus Triangle Network visualization. High-performance particle mesh engine for testing visual telemetry rendering.</p>
            <button 
              onClick={() => onSelect('test')}
              aria-label="Initiate Test mode"
              className="border border-intel-cyan text-intel-cyan px-4 py-2 font-mono text-xs hover:bg-intel-cyan/10"
            >
              [ INITIATE ]
            </button>
          </div>
          {/* Palantir Mode */}
          <div className="border border-slate-700 p-6 space-y-4 bg-[#0f141a]">
            <div className="flex justify-between items-start">
              <div className="text-xs font-mono text-indigo-400">INTEL_NODE_05</div>
              <Box className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">PALANTIR MODE</h2>
            <p className="text-sm text-slate-400">Interactive Node Visualization. Organic, physics-based network graphs for exploring deeply connected high-risk entity relationships and analyzing link intelligence.</p>
            <button 
              onClick={() => onSelect('palantir')}
              aria-label="Initiate Palantir mode"
              className="border border-indigo-400 text-indigo-400 px-4 py-2 font-mono text-xs hover:bg-indigo-400/10"
            >
              [ INITIATE ]
            </button>
          </div>

          {/* Tunisia Terminal */}
          <div className="border border-slate-700 p-6 space-y-4 bg-[#0f141a]">
            <div className="flex justify-between items-start">
              <div className="text-xs font-mono text-intel-cyan">INTEL_NODE_06</div>
              <Box className="w-5 h-5 text-intel-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white">TUNISIA TERMINAL</h2>
            <p className="text-sm text-slate-400">Bloomberg-style high-density intelligence terminal. Real-time RRI, macroeconomic indicators, and tactical intel feed.</p>
            <button 
              onClick={() => onSelect('terminal')}
              aria-label="Initiate Tunisia Terminal mode"
              className="border border-intel-cyan text-intel-cyan px-4 py-2 font-mono text-xs hover:bg-intel-cyan/10"
            >
              [ INITIATE ]
            </button>
          </div>
        </div>
      </div>
    </ModePageLayout>
  );
};
