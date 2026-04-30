import React from 'react';
import { Terminal, AlertTriangle, Info, XCircle, RefreshCw } from 'lucide-react';
import { DebugLog } from '../../services/debugService';
import { prepareList } from '../../lib/keyUtils';

interface ColProps {
  items: DebugLog[];
}

export function PipelineLogColumn({ items }: ColProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0d0d0f]">
      <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">PIPELINE STATE</span>
        </div>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-0 font-mono">
        {prepareList(items).map(item => (
          <div 
            key={item.id}
            className={`p-3 border-b border-white/5 text-[9px] ${
              item.status === 'error' ? 'bg-red-500/5 text-red-400' :
              item.status === 'dropped' ? 'bg-orange-500/5 text-orange-400' :
              'text-gray-400'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                {item.status === 'error' ? <XCircle className="w-3 h-3" /> : 
                 item.status === 'dropped' ? <AlertTriangle className="w-3 h-3" /> :
                 item.stage === 'PIPELINE' ? <RefreshCw className="w-3 h-3 text-emerald-500/60" /> :
                 <Info className="w-3 h-3 text-blue-500/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold ${
                    item.stage === 'FEED' ? 'text-blue-400' :
                    item.stage === 'NEWS' ? 'text-emerald-400' :
                    item.stage === 'SIGNALS' ? 'text-orange-400' :
                    item.stage === 'EVENTS' ? 'text-purple-400' :
                    'text-gray-500'
                  }`}>[{item.stage}]</span>
                  <span className="text-[8px] opacity-40">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="leading-tight break-words">{item.message}</p>
                {item.data && Object.keys(item.data).length > 0 && (
                  <pre className="mt-2 text-[8px] opacity-60 bg-black/40 p-1.5 rounded overflow-x-auto max-h-24">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 opacity-20 mt-20">
             <Terminal className="w-12 h-12 mb-4" />
             <span className="text-[10px] uppercase tracking-widest text-center">Listener idle...<br/>awaiting pipeline triggers</span>
          </div>
        )}
      </div>
    </div>
  );
}
