import React from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { DebugLog } from '../../services/debugService';
import { assertKey, getRenderKey, prepareList } from '../../lib/keyUtils';

interface NewsProps {
  items: DebugLog[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  highlightDuplicates: boolean;
}

export function NewsColumn({ items, selectedId, onSelect, highlightDuplicates }: NewsProps) {
  const seenIds = new Set();
  
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d0d0f] border-r border-white/5">
      <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">NORMALIZED NEWS</span>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500/80">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {prepareList(items.filter(i => i.data && i.data.id)).map((item: any, idx) => {
          const isDup = seenIds.has(item.data.id);
          seenIds.add(item.data.id);

          return (
            <div 
              key={assertKey(getRenderKey(item, idx, 'newsdbg'))}
              onClick={() => onSelect(item.data.id)}
              className={`p-2 rounded border text-[10px] cursor-pointer transition-all ${
                selectedId === item.data.id 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-black/40 border-white/5 hover:border-white/10'
              } ${isDup && highlightDuplicates ? 'border-red-500/40 bg-red-500/5' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-emerald-500/80 font-bold uppercase text-[9px]">{item.data.source_name}</span>
                {isDup && highlightDuplicates && (
                  <span className="text-red-500 text-[8px] flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> DUP
                  </span>
                )}
                {!isDup && <span className="text-gray-600 text-[8px]">{new Date(item.timestamp).toLocaleTimeString()}</span>}
              </div>
              <h3 className="text-gray-300 font-medium line-clamp-2 leading-relaxed mb-1">{item.data.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[8px] font-mono text-gray-500 truncate max-w-[120px]">ID: {item.data.id}</span>
                <span className={`px-1 rounded text-[7px] font-bold uppercase ${
                  item.data.severity >= 4 ? 'bg-red-500/20 text-red-400' : 
                  item.data.severity >= 3 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  SEV {item.data.severity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
