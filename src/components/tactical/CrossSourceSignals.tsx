import React from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../utils/cn';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CrossSourceSignals: React.FC = () => {
  const { data, rriState } = usePipeline();

  const crossSignals = [
    {
      event: 'Water Crisis — Sfax',
      sources: ['SONEDE (official)', 'Nawaat (independent)', 'User reports', 'UGTT press'],
      sourceCount: 4,
      consensus: 'CONFIRMED',
      divergence: 'None — all sources agree',
      rriImpact: '+0.07',
      confidence: 'HIGH'
    },
    {
      event: 'FX Reserve Decline',
      sources: ['BCT bulletin', 'IMF assessment', 'Business News'],
      sourceCount: 3,
      consensus: 'CONFIRMED',
      divergence: 'Minor: BCT says 84 days, IMF model suggests 78 effective',
      rriImpact: '+0.05',
      confidence: 'HIGH'
    },
    {
      event: 'UGTT Strike Threat',
      sources: ['UGTT press release', 'Mosaique FM', 'Nawaat'],
      sourceCount: 3,
      consensus: 'CONFIRMED',
      divergence: 'Timeline disputed — UGTT says imminent, govt says talks ongoing',
      rriImpact: '+0.04',
      confidence: 'MEDIUM'
    },
    {
      event: 'IMF Negotiations — Stalled',
      sources: ['IMF statement', 'Business News', 'Reuters Africa'],
      sourceCount: 3,
      consensus: 'CONFIRMED',
      divergence: 'TAP (state wire) reports "productive discussions" — contradicts others',
      rriImpact: '+0.04',
      confidence: 'HIGH'
    },
    {
      event: 'Decree 54 Charge Count',
      sources: ['RSF', 'CPJ', 'Nawaat tracker'],
      sourceCount: 3,
      consensus: 'PARTIAL',
      divergence: 'RSF says 67, CPJ says 64 — methodology difference',
      rriImpact: '+0.02',
      confidence: 'MEDIUM'
    },
  ];

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-3 h-3 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cross-Source Signals</h3>
        </div>
        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Triangulation Active</span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-hide">
        {crossSignals.map((signal, i) => (
          <div 
            key={i} 
            className={cn(
              "p-3 rounded-lg border transition-all hover:bg-white/5",
              signal.consensus === 'DISPUTED' || signal.divergence.includes('contradicts') 
                ? "border-intel-orange/30 bg-intel-orange/5" 
                : "border-white/5 bg-black/20"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-white uppercase tracking-tight">{signal.event}</div>
                <div className="flex items-center space-x-2">
                  <span className="text-[7px] font-mono bg-intel-cyan/10 text-intel-cyan px-1 rounded border border-intel-cyan/20 uppercase">
                    {signal.sourceCount} SOURCES
                  </span>
                  <span className={cn(
                    "text-[7px] font-mono px-1 rounded border uppercase font-bold",
                    signal.consensus === 'CONFIRMED' ? "bg-intel-green/10 text-intel-green border-intel-green/20" :
                    signal.consensus === 'PARTIAL' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                    "bg-intel-red/10 text-intel-red border-intel-red/20"
                  )}>
                    {signal.consensus}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[7px] font-mono text-slate-500 uppercase">RRI Impact</div>
                <div className="text-[10px] font-bold font-mono text-intel-red">{signal.rriImpact}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5">
                {signal.consensus === 'CONFIRMED' ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-intel-green" />
                ) : (
                  <AlertCircle className="w-2.5 h-2.5 text-intel-orange" />
                )}
                <span className="text-[8px] text-slate-400 leading-tight uppercase italic">
                  {signal.divergence}
                </span>
              </div>
              {signal.divergence.includes('contradicts') && (
                <div className="text-[7px] font-mono text-intel-orange uppercase font-bold flex items-center mt-1">
                  <AlertCircle className="w-2 h-2 mr-1" />
                  Narrative Gap Detected
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 text-[7px] font-mono text-slate-600 uppercase tracking-widest text-center">
        Multi-source event triangulation
      </div>
    </div>
  );
};
