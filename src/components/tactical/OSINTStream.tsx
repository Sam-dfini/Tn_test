import React from 'react';

const news = [
  { 
    source: 'CIG_TELEGRAM', 
    time: '7h ago', 
    tags: ['BREAKING', 'MISSILE'], 
    content: 'BREAKING: An Iranian missile strike hit Prince Sultan Air Base in Saudi Arabia, damaging 5 U.S. Air Force refueling planes on the ground. The aircraft were dam...' 
  },
  { 
    source: 'CIG_TELEGRAM', 
    time: '8h ago', 
    tags: ['STRIKE', 'KILLED'], 
    content: 'BREAKING: An Iranian missile strike hit Prince Sultan Air Base in Saudi Arabia, damaging 5 U.S. Air Force refueling planes on the ground. The aircraft were dam...' 
  },
  { 
    source: 'CIG_TELEGRAM', 
    time: '11h ago', 
    tags: ['ASSASSINATION'], 
    content: 'IR 🇮🇷 vs US Iran may have avenged IRGC general, Qassem Soleimani, a mere three weeks after his assassination.' 
  },
];

export const OSINTStream: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">OSINT Stream</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">15 Urgent</span>
      </div>

      <div className="space-y-6">
        {news.map((n, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-bold text-intel-orange font-mono">{n.source}</span>
                <span className="text-[8px] font-mono text-slate-600 uppercase">{n.time}</span>
              </div>
              <div className="flex space-x-1">
                {n.tags.map(t => (
                  <span key={t} className="text-[7px] font-mono font-bold px-1 bg-intel-red/10 text-intel-red border border-intel-red/20 rounded uppercase">{t}</span>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-300 leading-relaxed uppercase">{n.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
