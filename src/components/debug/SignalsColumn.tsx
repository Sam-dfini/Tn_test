import React from 'react';
import { Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DebugLog } from '../../services/debugService';

import { assertKey, getRenderKey, prepareList } from '../../lib/keyUtils';

interface ColProps {
  items: DebugLog[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SignalsColumn({ items, selectedId, onSelect }: ColProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d0d0f] border-r border-white/5">
      <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">SIGNALS</span>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500/80">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 custom-scrollbar">
        {prepareList(items).map((item, idx) => (
          <div 
            key={assertKey(getRenderKey(item, idx, 'sig'))}
            onClick={() => onSelect(item.data.eventId)}
            className={`p-1.5 rounded border text-[9px] cursor-pointer transition-all ${
              selectedId === item.data.eventId
                ? 'bg-orange-500/10 border-orange-500/50' 
                : 'bg-black/40 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-[8px] uppercase tracking-tighter truncate max-w-[80px]">{item.data.eventId}</span>
              <span className="text-gray-600 text-[8px]">{new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              <SignalItem label="PRIO" value={item.data.finalScore} status="active" />
              <SignalItem label="SEV" value={(item.data.severity ?? 0).toFixed(1)} status="neutral" />
              <SignalItem label="VOL" value={(item.data.volume ?? 0).toFixed(1)} status="neutral" />
              <SignalItem label="VEL" value={(item.data.velocity ?? 0).toFixed(1)} status={(item.data.velocity ?? 0) > 0.5 ? 'active' : 'neutral'} />
            </div>

            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-gray-600 uppercase">Decay:</span>
                <span className="text-[9px] text-gray-400">{(((item.data.decay ?? 0) * 100).toFixed(0)}%</span>
              </div>
              <div className={`w-1 h-1 rounded-full ${(item.data.finalScore ?? 0) > 7 ? 'bg-red-500 animate-pulse' : 'bg-orange-500/40'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalItem({ label, value, status }: { label: string, value: any, status: 'active' | 'neutral' }) {
  return (
    <div className="p-1 px-1.5 bg-black/40 rounded border border-white/5">
      <span className="text-[9px] text-gray-500 block mb-0.5 uppercase tracking-tighter">{label}</span>
      <span className={`text-[10px] font-bold ${status === 'active' ? 'text-orange-400' : 'text-gray-400'}`}>{value}</span>
    </div>
  );
}
