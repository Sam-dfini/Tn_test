import React from 'react';

const items = [
  { source: 'TAP', time: '12m ago', content: 'Central Bank of Tunisia maintains interest rate at 8% amid inflation concerns.' },
  { source: 'MOSAIQUE', time: '45m ago', content: 'Protests reported in Gafsa over employment opportunities in the mining sector.' },
  { source: 'SHEMS FM', time: '1h ago', content: 'Ministry of Agriculture warns of water scarcity in northern dams following dry winter.' },
  { source: 'JAWHERA', time: '2h ago', content: 'New investment agreement signed between Tunisia and EU for renewable energy projects.' },
  { source: 'REUTERS', time: '3h ago', content: 'Tunisia seeks IMF deal as economic pressure mounts on the Mediterranean nation.' },
];

export const NewsTicker: React.FC = () => {
  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Live News Ticker</h3>
        <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">40 Items</span>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="space-y-1 border-b border-intel-border/30 pb-3 last:border-0">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-bold text-slate-500 font-mono">{item.source}</span>
              <span className="text-[8px] font-mono text-slate-600 uppercase">{item.time}</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-relaxed uppercase">{item.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
