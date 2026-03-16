import React from 'react';

const signals = [
  { id: 1, title: 'SIGNAL 1', desc: 'HIGH INTENSITY FIRES in Middle East: 15 detections >10MW FRP' },
  { id: 2, title: 'SIGNAL 2', desc: 'ELEVATED NIGHT ACTIVITY in Middle East: 990 night detections (potential strikes/combat)' },
  { id: 3, title: 'SIGNAL 3', desc: 'HIGH INTENSITY FIRES in Ukraine: 15 detections >10MW FRP' },
  { id: 4, title: 'SIGNAL 4', desc: 'ELEVATED NIGHT ACTIVITY in Ukraine: 327 night detections (potential strikes/combat)' },
  { id: 5, title: 'SIGNAL 5', desc: 'HIGH INTENSITY FIRES in Iran: 15 detections >10MW FRP' },
  { id: 6, title: 'SIGNAL 6', desc: 'ELEVATED NIGHT ACTIVITY in Iran: 625 night detections (potential strikes/combat)' },
];

export const CrossSourceSignals: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cross-Source Signals</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">Worldview</span>
      </div>

      <div className="space-y-4">
        {signals.map((s) => (
          <div key={s.id} className="space-y-1">
            <div className="text-[10px] font-bold text-white uppercase tracking-tight">{s.title}</div>
            <div className="text-[9px] text-slate-400 leading-relaxed uppercase">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
