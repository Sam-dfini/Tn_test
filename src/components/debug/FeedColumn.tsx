import React from 'react';
import { Radio, Clock } from 'lucide-react';
import { DebugLog } from '../../services/debugService';
import { assertKey, getRenderKey, prepareList } from '../../lib/keyUtils';

interface ColProps {
  items: DebugLog[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FeedColumn({ items, selectedId, onSelect }: ColProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d0d0f] border-r border-white/5">
      <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">RAW FEED</span>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500/80">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {prepareList(items).map((item, idx) => (
          <div 
            key={assertKey(getRenderKey(item, idx, 'feed'))}
            onClick={() => item.data?.id && onSelect(item.data.id)}
            className={`p-2 rounded border text-[10px] cursor-pointer transition-all ${
              selectedId === item.data?.id 
                ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                : 'bg-black/40 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-400 font-bold uppercase text-[9px]">{item.data.source}</span>
              <span className="text-gray-600 text-[8px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <h3 className="text-gray-300 font-medium line-clamp-2 leading-relaxed mb-1">{item.data.title}</h3>
            {item.data.pubDate && (
              <div className="flex items-center gap-1 text-gray-600 text-[8px]">
                <Clock className="w-2.5 h-2.5" />
                <span>{item.data.pubDate}</span>
              </div>
            )}
            <div className="mt-2 p-1.5 bg-black/60 rounded text-[8px] font-mono text-gray-500 break-all border border-white/5 opacity-60">
              {item.data.xmlSnippet || 'No XML available'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
