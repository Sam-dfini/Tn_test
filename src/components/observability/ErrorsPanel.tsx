import React from 'react';
import { Terminal, Bug, Skull } from 'lucide-react';

interface ErrorsPanelProps {
  errors: any[];
}

export const ErrorsPanel: React.FC<ErrorsPanelProps> = ({ errors }) => {
  return (
    <div className="h-full p-4 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
          <Bug className="w-4 h-4 text-red-500" />
          Pipeline Failures
        </h3>
        <span className={`text-lg font-mono font-bold ${errors.length > 10 ? 'text-red-500' : 'text-white/40'}`}>
          {errors.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {errors.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-emerald-500/20 py-8">
            <Terminal className="w-8 h-8 mb-2" />
            <p className="text-[10px] uppercase font-bold tracking-widest">System Operational</p>
          </div>
        ) : (
          errors.slice(-15).reverse().map((err, i) => (
            <div key={err.id || i} className="p-2 bg-red-500/5 border border-red-500/10 rounded text-[10px] font-mono group">
              <div className="flex justify-between items-start gap-2">
                <span className="text-red-400 font-bold truncate flex-1">{err.message}</span>
                <span className="text-white/20 whitespace-nowrap">{new Date(err.timestamp || err.time).toLocaleTimeString()}</span>
              </div>
              {err.stack && (
                <pre className="mt-1 text-[8px] opacity-20 hidden group-hover:block overflow-x-hidden">
                  {err.stack.slice(0, 100)}...
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      {errors.length > 50 && (
         <div className="pt-2 border-t border-red-500/20 flex items-center gap-2 text-red-500 animate-pulse">
            <Skull className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Critical Error Overflow</span>
         </div>
      )}
    </div>
  );
};
