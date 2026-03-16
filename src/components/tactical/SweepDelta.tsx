import React from 'react';

export const SweepDelta: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sweep Delta</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">◆ Mixed</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-[8px] font-mono text-slate-600 uppercase">Changes</div>
          <div className="text-sm font-bold font-mono text-intel-green">14</div>
        </div>
        <div>
          <div className="text-[8px] font-mono text-slate-600 uppercase">Critical</div>
          <div className="text-sm font-bold font-mono text-intel-red">14</div>
        </div>
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center space-x-2">
            <span className="text-[7px] font-mono font-bold px-1 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded uppercase">New</span>
            <span className="text-[9px] font-mono text-slate-400 uppercase">New urgent OSINT post</span>
          </div>
        ))}
      </div>
    </div>
  );
};
