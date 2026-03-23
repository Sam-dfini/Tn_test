import React from 'react';
import { motion } from 'motion/react';

export const CornerAccent = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const classes = {
    tl: 'top-0 left-0 border-t-2 border-l-2',
    tr: 'top-0 right-0 border-t-2 border-r-2',
    bl: 'bottom-0 left-0 border-b-2 border-l-2',
    br: 'bottom-0 right-0 border-b-2 border-r-2'
  };
  return <div className={`absolute w-3 h-3 border-intel-cyan/30 ${classes[position]}`} />;
};

export const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
       style={{ backgroundImage: 'radial-gradient(#00f2ff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
);

export const ScanlineOverlay = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.05] z-10">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-intel-cyan/10 to-transparent h-[10%] w-full animate-scanline" />
  </div>
);

export const ModuleHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  statusLabel = "ACTIVE",
  nodeId = "INTEL-NODE-01"
}: { 
  title: string; 
  subtitle: string; 
  icon: any;
  statusLabel?: string;
  nodeId?: string;
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-20">
    <div className="space-y-1">
      <div className="flex items-center space-x-2 text-intel-cyan">
        <div className="w-1.5 h-1.5 bg-intel-cyan rounded-full animate-pulse" />
        <span className="text-[8px] md:text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Intelligence Node: {nodeId} // STATUS: {statusLabel}</span>
      </div>
      <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-intel-cyan" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{title}</span>
      </h2>
      <p className="text-slate-500 text-[10px] md:text-xs uppercase font-mono tracking-wider">{subtitle}</p>
    </div>
    
    <div className="flex items-center space-x-4">
      <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
          <div className="w-1 h-1 rounded-full bg-intel-green" />
          <span>SIGINT: NOMINAL</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
          <div className="w-1 h-1 rounded-full bg-intel-cyan animate-pulse" />
          <span>UPLINK: SECURE</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide">
        {['24H', '7D', '30D', '1Y'].map(range => (
          <button 
            key={range}
            className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all flex-shrink-0 ${
              range === '7D' ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const LiveTicker = ({ items }: { items: { code: string; title: string; impact: string }[] }) => (
  <div className="bg-intel-bg/80 backdrop-blur-md border-y border-white/5 py-2 overflow-hidden relative z-20">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...items, ...items].map((item, i) => (
        <div key={i} className="flex items-center space-x-8 mx-4 md:mx-8">
          <div className="flex items-center space-x-2">
            <span className="text-[8px] md:text-[10px] font-mono text-intel-cyan font-bold">{item.code}</span>
            <span className="text-[8px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest">{item.title}</span>
            <span className={`text-[8px] md:text-[10px] font-mono font-bold ${
              item.impact === 'CRITICAL' ? 'text-intel-red' : 
              item.impact === 'HIGH' ? 'text-intel-orange' : 'text-intel-cyan'
            }`}>[{item.impact}]</span>
          </div>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);
