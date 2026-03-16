import React from 'react';

const items = [
  { source: 'INTELSLAVA', time: '6h ago', content: 'The arrival of an Iranian ballistic missile in southern Israel.' },
  { source: 'INTELSLAVA', time: '6h ago', content: 'The Israeli Air Force carried out a strike on the headquarters of the Nepalese battalion operating a' },
  { source: 'BBC', time: '6h ago', content: 'More US Marines and warships to be moved to Middle East, reports say' },
  { source: 'NYT', time: '6h ago', content: 'A New Trump Envoy Stirs Fears of U.S. Meddling in Brazil\'s Elections' },
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
