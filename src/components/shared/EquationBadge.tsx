import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain } from 'lucide-react';

export const EquationBadge: React.FC<{ eqId: string; className?: string }> = ({ eqId, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Mocked details, in reality this would fetch from a dictionary or markdown parser
  const getEqDetails = (id: string) => {
    switch (id) {
      case 'EQ.1': return { name: 'Macro-Economic Stress', formula: 'E(t) = ∑(w_i * I_i) / FX_reserves' };
      case 'EQ.2': return { name: 'Elite Defection Probability', formula: 'P_defect = 1 - e^(-λ * (RRI - 2.5))' };
      case 'EQ.13': return { name: 'Bread Crisis Index (BCI)', formula: 'BCI = (W_supply * S_stress) + (W_price * P_stress)' };
      case 'EQ.17': return { name: 'Cascade Probability', formula: 'P_cascade = 1 - Π(1 - p_i)' };
      case 'EQ.19': return { name: 'Cognitive Warfare Penetration', formula: 'CWP = (V_disinfo * A_actor) / OCI' };
      default: return { name: 'System Equation', formula: 'ƒ(x) = ...' };
    }
  };

  const details = getEqDetails(eqId);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-1 px-2 py-0.5 bg-intel-cyan/10 border border-intel-cyan/30 rounded text-[10px] font-mono text-intel-cyan cursor-help hover:bg-intel-cyan/20 transition-colors">
        <Brain className="w-3 h-3" />
        <span>{eqId}</span>
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#020810]/95 backdrop-blur-md border border-intel-border rounded-xl shadow-2xl z-50 pointer-events-none"
          >
            <div className="text-xs font-bold text-on-surface mb-1">{details.name}</div>
            <div className="text-[10px] text-intel-cyan font-mono bg-black/50 p-2 rounded border border-intel-cyan/20">
              {details.formula}
            </div>
            <div className="text-[9px] text-slate-500 mt-2 text-center">
              Click to view full Methodology
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
