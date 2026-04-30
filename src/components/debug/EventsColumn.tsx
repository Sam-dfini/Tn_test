import React from 'react';
import { Activity, MapPin } from 'lucide-react';
import { DebugLog } from '../../services/debugService';
import { assertKey, getRenderKey, prepareList } from '../../lib/keyUtils';

interface ColProps {
  items: DebugLog[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function EventsColumn({ items, selectedId, onSelect }: ColProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d0d0f] border-r border-white/5">
      <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">EVENTS</span>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500/80">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {prepareList(items).map((item, idx) => (
          <div 
            key={assertKey(getRenderKey(item, idx, 'devt'))}
            onClick={() => onSelect(item.data.id)}
            className={`p-2 rounded border text-[10px] cursor-pointer transition-all ${
              selectedId === item.data.id
                ? 'bg-purple-500/10 border-purple-500/50' 
                : 'bg-black/40 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${
                item.data.status === 'escalating' ? 'bg-red-500/20 text-red-400' : 
                item.data.status === 'emerging' ? 'bg-blue-500/20 text-blue-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {item.data.status}
              </span>
              <span className="text-gray-600 text-[8px]">{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <h3 className="text-gray-300 font-medium line-clamp-1 mb-1">{item.data.title}</h3>
            <div className="flex items-center gap-2 text-[8px] text-gray-500 mb-2">
              <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {item.data.governorate}</span>
              <span>•</span>
              <span>{item.data.article_count} articles</span>
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
               <div className="flex flex-col">
                 <span className="text-[7px] text-gray-600 uppercase">PRIORITY</span>
                 <span className="text-purple-400 font-bold">{item.data.priority_score}</span>
               </div>
               <div className="flex flex-col items-end">
                 <span className="text-[7px] text-gray-600 uppercase">TREND</span>
                 <span className={`text-[10px] font-bold uppercase ${
                   item.data.trend === 'up' ? 'text-red-400' : 
                   item.data.trend === 'down' ? 'text-blue-400' : 
                   'text-gray-400'
                 }`}>
                   {item.data.trend === 'up' ? '▲ HIGHER' : item.data.trend === 'down' ? '▼ LOWER' : '● STABLE'}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
