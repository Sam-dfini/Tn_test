
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TerminalLine } from './types';

interface OutputConsoleProps {
  history: TerminalLine[];
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const getColorClass = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-white font-bold';
      case 'error': return 'text-intel-red';
      case 'system': return 'text-intel-cyan font-bold';
      case 'success': return 'text-intel-green';
      default: return 'text-slate-300';
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2 custom-scrollbar selection:bg-intel-cyan selection:text-black"
    >
      <AnimatePresence initial={false}>
        {history.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={`whitespace-pre-wrap ${getColorClass(line.type)}`}
          >
            {line.type === 'structured' && line.structured ? (
              <div className="bg-white/5 border border-white/10 rounded p-3 my-2 font-mono">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] uppercase tracking-widest text-intel-cyan font-bold">
                    {line.structured.title}
                  </div>
                  {line.structured.type === 'loading' && (
                    <div className="w-2 h-2 rounded-full bg-intel-cyan animate-pulse" />
                  )}
                </div>
                
                <div className="text-xs text-slate-200">
                  {/* Data Grid */}
                  {typeof line.structured.data === 'string' ? (
                    line.structured.data
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(line.structured.data).map(([key, val]) => (
                        <div key={key} className="flex justify-between border-b border-white/5 py-1">
                          <span className="text-slate-500 uppercase text-[9px]">{key.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-intel-cyan">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Risk Level Badge */}
                  {line.structured.riskLevel && (
                    <div className="mt-4 flex items-center space-x-2">
                       <span className="text-[9px] text-slate-500 uppercase tracking-widest">Risk Level:</span>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                         line.structured.riskLevel === 'CRITICAL' ? 'bg-intel-red text-white' :
                         line.structured.riskLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                         line.structured.riskLevel === 'MEDIUM' ? 'bg-yellow-500 text-black' :
                         'bg-intel-green text-white'
                       }`}>
                         {line.structured.riskLevel}
                       </span>
                    </div>
                  )}

                  {/* Interpretation */}
                  {line.structured.interpretation && (
                    <div className="mt-4 space-y-1">
                       <div className="text-[9px] text-intel-cyan uppercase font-bold tracking-[0.1em]">Analyst Interpretation:</div>
                       <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-intel-cyan/30 pl-3 py-1 bg-intel-cyan/5">
                         {line.structured.interpretation}
                       </p>
                    </div>
                  )}

                  {/* RRI Impact */}
                  {line.structured.rriImpact && (
                    <div className="mt-4 p-2 bg-black/40 border border-white/5 rounded-lg">
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">Model Connectivity</div>
                      <div className="flex items-center justify-around">
                        <div className="text-center">
                          <div className="text-[16px] font-bold text-white flex items-center space-x-1">
                            <span>R(t): {line.structured.rriImpact.r > 0 ? '+' : ''}{line.structured.rriImpact.r.toFixed(3)}</span>
                            {line.structured.rriImpact.direction === 'up' && <span className="text-intel-red">↑</span>}
                            {line.structured.rriImpact.direction === 'down' && <span className="text-intel-green">↓</span>}
                          </div>
                          <div className="text-[8px] text-slate-500">Risk Coefficient</div>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-center">
                          <div className="text-[16px] font-bold text-white">
                            S(t): {line.structured.rriImpact.s > 0 ? '+' : ''}{line.structured.rriImpact.s.toFixed(3)}
                          </div>
                          <div className="text-[8px] text-slate-500">Social Salience</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {line.structured.suggestedActions && line.structured.suggestedActions.length > 0 && (
                    <div className="mt-4 space-y-2">
                       <div className="text-[9px] text-slate-400 uppercase tracking-wider">Suggested Intelligence Queries:</div>
                       <div className="flex flex-wrap gap-2">
                         {line.structured.suggestedActions.map((action, i) => (
                           <button 
                             key={i} 
                             className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-intel-cyan/80 hover:text-white hover:border-intel-cyan/40 transition-all"
                             onClick={() => {
                               const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                               if (input) {
                                 input.value = action;
                                 input.focus();
                               }
                             }}
                           >
                             {action}
                           </button>
                         ))}
                       </div>
                    </div>
                  )}
                </div>

                {line.structured.meta && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[9px] text-slate-500 italic">
                    <span>SOURCE: {line.structured.meta.source}</span>
                    <span>CONFIDENCE: {(line.structured.meta.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            ) : (
              line.content
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
