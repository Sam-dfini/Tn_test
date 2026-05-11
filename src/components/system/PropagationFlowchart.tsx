import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Brain, AlertTriangle, Target, Activity } from 'lucide-react';
import { ShockSignal } from '../../types/intel';
import { EquationBadge } from '../shared/EquationBadge';

export const PropagationFlowchart: React.FC<{ shock: ShockSignal; rriDelta: number }> = ({ shock, rriDelta }) => {
  return (
    <div className="p-6 bg-black/40 border border-intel-border/50 rounded-xl">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-intel-cyan" />
        <h3 className="text-sm font-bold text-white uppercase tracking-widest">
          Shock Propagation Path
        </h3>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-intel-border/50" />

        <div className="space-y-8">
          {/* Step 1: Ingestion */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="relative z-10 flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                Trigger Event
              </div>
              <div className="text-sm font-bold text-white">{shock.message}</div>
              <div className="text-xs text-slate-400 mt-1">Source: {shock.source}</div>
            </div>
          </motion.div>

          {/* Step 2: Variable Override */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-full bg-intel-orange/10 border border-intel-orange/30 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-intel-orange" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                Variable Mapping
              </div>
              <div className="space-y-2">
                {Object.entries(shock.overrides).map(([v, val]) => (
                  <div key={v} className="flex items-center justify-between p-2 bg-black/40 border border-slate-800 rounded">
                    <span className="text-xs font-mono text-slate-300">{v}</span>
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-xs font-bold text-intel-orange">{(val).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Step 3: Equation Impact */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-full bg-intel-cyan/10 border border-intel-cyan/30 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-intel-cyan" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                Mathematical Execution
              </div>
              <div className="flex flex-wrap gap-2">
                {shock.affectedEquations?.map(eq => (
                  <EquationBadge key={eq} eqId={eq} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Step 4: RRI Output */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="relative z-10 flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                RRI Delta
              </div>
              <div className="flex items-center space-x-3">
                <div className={`text-2xl font-bold ${rriDelta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {rriDelta > 0 ? '+' : ''}{rriDelta.toFixed(3)}
                </div>
                <div className="text-xs text-slate-400">
                  Direct impact on National Revolutionary Risk Index
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
