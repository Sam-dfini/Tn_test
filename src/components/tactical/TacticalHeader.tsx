import React from 'react';
import { motion } from 'motion/react';
import { Clock, Globe, Zap, AlertTriangle } from 'lucide-react';

export const TacticalHeader: React.FC = () => {
  return (
    <header className="h-14 border-b border-intel-border bg-intel-card/50 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-[100]">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-intel-cyan/10 border border-intel-cyan/20 rounded flex items-center justify-center">
            <Zap className="w-5 h-5 text-intel-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-[0.2em] uppercase">Tactical OSINT Tunisia</h1>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse"></span>
              <span className="text-[8px] font-mono text-intel-red uppercase font-bold">Wartime Stagflation Risk</span>
            </div>
          </div>
        </div>

        <nav className="hidden xl:flex items-center space-x-1">
          {['National', 'North', 'Sahel', 'Central', 'South', 'Borders'].map((tab) => (
            <button 
              key={tab}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all rounded ${tab === 'National' ? 'bg-intel-cyan text-intel-bg font-bold' : 'text-slate-500 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center space-x-8">
        <div className="hidden md:flex flex-col items-end">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 uppercase">
            <span>Sweep</span>
            <span className="text-white font-bold">46.0s</span>
          </div>
          <div className="text-[10px] font-mono text-white">MAR 14, 2026 <span className="text-intel-cyan">12:12 AM</span></div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden lg:flex flex-col items-end">
            <div className="text-[8px] font-mono text-slate-500 uppercase">Sources</div>
            <div className="text-xs font-bold text-white font-mono">26/26</div>
          </div>
          <div className="hidden lg:flex flex-col items-end">
            <div className="text-[8px] font-mono text-slate-500 uppercase">Delta</div>
            <div className="text-xs font-bold text-intel-cyan font-mono">◆ Mixed</div>
          </div>
          <div className="px-3 py-1 bg-intel-red text-white text-[10px] font-bold uppercase tracking-widest rounded">
            High Alert
          </div>
        </div>
      </div>
    </header>
  );
};
