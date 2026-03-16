import React from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Target, Layout, ChevronRight, AlertCircle } from 'lucide-react';

interface ModeSelectionProps {
  onSelect: (mode: 'simplified' | 'advanced') => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-intel-bg z-[110] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00f2ff 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-intel-cyan/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-intel-purple/5 rounded-full blur-[120px]"></div>

      <div className="max-w-5xl w-full space-y-12 relative z-20">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <div className="px-3 py-1 rounded-full border border-intel-cyan/20 bg-intel-cyan/5 text-intel-cyan text-[10px] font-mono uppercase tracking-[0.3em]">
              System Access Portal
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl tracking-[0.2em] font-bold text-white uppercase"
          >
            TUNISIA<span className="text-intel-cyan">INTEL</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto font-light tracking-wide"
          >
            Select your operational interface. Advanced Tactical mode requires high-level clearance and provides deep geospatial intelligence.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Simplified Mode */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => onSelect('simplified')}
            className="group relative glass p-8 rounded-3xl border border-intel-border hover:border-intel-cyan/30 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Layout className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700 group-hover:border-intel-cyan/50 transition-colors">
                <Layout className="w-7 h-7 text-slate-400 group-hover:text-intel-cyan" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">Simplified</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Standard intelligence overview. Focuses on high-level trends, basic risk metrics, and general stability indicators.
                </p>
              </div>

              <div className="flex items-center text-intel-cyan text-xs font-mono uppercase tracking-widest font-bold pt-4">
                Initialize Standard Link <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Advanced Tactical Mode */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => onSelect('advanced')}
            className="group relative glass p-8 rounded-3xl border border-intel-border hover:border-intel-cyan/30 transition-all text-left overflow-hidden bg-gradient-to-br from-intel-card to-intel-cyan/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-32 h-32" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20 group-hover:border-intel-cyan/50 transition-colors">
                <Target className="w-7 h-7 text-intel-cyan" />
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Tactical OSINT Tunisia</h3>
                  <div className="px-2 py-0.5 rounded bg-intel-red/10 border border-intel-red/20 text-[8px] font-mono text-intel-red font-bold animate-pulse">
                    CLASSIFIED
                  </div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Deep-dive geospatial intelligence. Real-time incident tracking, predictive modeling, and granular actor network analysis.
                </p>
              </div>

              <div className="flex items-center text-intel-cyan text-xs font-mono uppercase tracking-widest font-bold pt-4">
                Initialize Tactical Link <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center"
        >
          <div className="flex items-center space-x-2 text-slate-600 text-[10px] font-mono uppercase">
            <AlertCircle className="w-3 h-3" />
            <span>Authorized Personnel Only · AES-256 Encryption Active</span>
          </div>
        </motion.div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-intel-cyan/20"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-intel-cyan/20"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-intel-cyan/20"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-intel-cyan/20"></div>
    </div>
  );
};
