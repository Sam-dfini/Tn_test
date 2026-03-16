import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Info, TrendingUp, RefreshCw, Sliders, Zap } from 'lucide-react';
import { RRIVariable } from '../types/intel';
import { calculateRRI, getRiskTier, calculatePRev } from '../utils/rriEngine';

interface RiskModelProps {
  variables: RRIVariable[];
}

export const RiskModel: React.FC<RiskModelProps> = ({ variables: initialVariables }) => {
  const [variables, setVariables] = useState<RRIVariable[]>(initialVariables || []);
  const [warDistraction, setWarDistraction] = useState(0.72);
  const [rri, setRri] = useState(0);
  const [pRev, setPRev] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (initialVariables) {
      setVariables(initialVariables);
    }
  }, [initialVariables]);

  useEffect(() => {
    const newRri = calculateRRI(variables, warDistraction);
    setRri(newRri);
    setPRev(calculatePRev(newRri));
  }, [variables, warDistraction]);

  const handleVariableChange = (id: string, newValue: number) => {
    setVariables(prev => (prev || []).map(v => v.id === id ? { ...v, value: newValue } : v));
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1500);
  };

  const tier = getRiskTier(rri);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-2">
        <h2 className="text-2xl tracking-tight">Regime Resilience Index</h2>
        <p className="text-slate-500 text-sm">Quantitative model of regime stability derived from selectorate theory</p>
        <div className="pt-4">
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 px-4 py-2 rounded-lg hover:bg-intel-cyan/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="text-xs font-mono uppercase font-bold">Run Monte Carlo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Equation & Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Current State — March 2026</div>
              <div className="flex items-baseline space-x-4">
                <span className={`text-6xl font-bold font-mono ${tier.color}`}>{rri.toFixed(2)}</span>
                <span className="text-sm font-mono text-slate-400 uppercase">R(t) Index</span>
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">P(Revolution)</div>
                  <div className="text-xl font-bold font-mono text-white">{(pRev * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Risk Tier</div>
                  <div className="text-xl font-bold font-mono text-intel-red uppercase">{tier.label}</div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
                 <div className="text-[10px] font-mono text-intel-cyan uppercase font-bold mb-2 flex items-center">
                   <Info className="w-3 h-3 mr-1" />
                   Model Equation
                 </div>
                 <div className="text-xs font-mono text-slate-300 italic">
                   R(t) = Σ[wi * vi(t)] / Σwi · W(t)
                 </div>
                 <div className="mt-2 text-[8px] text-slate-500 leading-relaxed">
                   Where W(t) is the war distraction suppressor (currently {warDistraction.toFixed(2)}).
                 </div>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm tracking-widest mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-intel-cyan" />
              Simulation Output
            </h3>
            <div className="space-y-4">
              <div className="relative h-32 w-full bg-intel-bg/50 rounded-lg border border-intel-border overflow-hidden flex items-end px-2 space-x-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: isSimulating ? `${Math.random() * 80 + 10}%` : `${[20, 35, 50, 65, 80, 90, 85, 70, 55, 40, 30, 25, 20, 15, 10, 8, 5, 3, 2, 1][i]}%` }}
                    className={`flex-1 rounded-t ${i > 10 ? 'bg-intel-red/40' : 'bg-intel-cyan/40'}`}
                  ></motion.div>
                ))}
                <div className="absolute top-1/2 left-0 right-0 border-t border-intel-red/30 border-dashed"></div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                <span>Low Risk</span>
                <span>Threshold (2.31)</span>
                <span>High Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Variable Sliders */}
        <div className="col-span-12 lg:col-span-8 glass p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm tracking-widest flex items-center">
              <Sliders className="w-4 h-4 mr-2 text-intel-cyan" />
              Variable Inputs
            </h3>
            <div className="text-[10px] font-mono text-slate-500 uppercase">{variables.length} Variables Active</div>
          </div>

          <div className="space-y-12">
            {Object.entries(
              variables.reduce((acc, v) => {
                if (!acc[v.category]) acc[v.category] = [];
                acc[v.category].push(v);
                return acc;
              }, {} as Record<string, RRIVariable[]>)
            ).map(([category, vars]) => {
              const categoryVars = vars as RRIVariable[];
              return (
                <div key={category} className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <h4 className="text-[10px] font-mono text-intel-cyan uppercase font-bold tracking-widest whitespace-nowrap">
                      {category}
                    </h4>
                    <div className="h-[1px] w-full bg-intel-cyan/20"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    {categoryVars.map(v => (
                      <div key={v.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{v.name}</span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase">{v.source}</span>
                          </div>
                          <span className="text-xs font-mono text-white">{(v.value * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01"
                          value={v.value}
                          onChange={(e) => handleVariableChange(v.id, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-intel-border rounded-full appearance-none cursor-pointer accent-intel-cyan"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                          <span>{v.direction === 'positive' ? 'Low Risk' : 'High Risk'}</span>
                          <span>{v.direction === 'positive' ? 'High Risk' : 'Low Risk'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="space-y-6 pt-8 border-t border-intel-border">
              <div className="flex items-center space-x-4">
                <h4 className="text-[10px] font-mono text-intel-purple uppercase font-bold tracking-widest whitespace-nowrap">
                  Global Suppressors
                </h4>
                <div className="h-[1px] w-full bg-intel-purple/20"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">War Distraction W(t)</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase italic">Dampens protest mobilisation</span>
                    </div>
                    <span className="text-xs font-mono text-white">{(warDistraction * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={warDistraction}
                    onChange={(e) => setWarDistraction(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-intel-border rounded-full appearance-none cursor-pointer accent-intel-purple"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
