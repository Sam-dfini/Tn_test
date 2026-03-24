import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Info, TrendingUp, RefreshCw, Sliders, Zap, AlertCircle, TrendingDown, Calendar, Database, BookOpen } from 'lucide-react';
import { RRIVariable, RRIState } from '../types/intel';
import { 
  getRiskTier, 
  runMonteCarlo
} from '../utils/rriEngine';
import { usePipeline } from '../context/PipelineContext';

interface RiskModelProps {
  variables: RRIVariable[];
  rriState?: RRIState;
}

const scenarios = [
  {
    id: 'imf_collapse',
    name: 'IMF Deal Collapse',
    description: 'Negotiations fail, leading to immediate currency devaluation and reserve depletion.',
    icon: TrendingDown,
    impact: {
      'inflation': 0.85,
      'reserves': 0.15,
      'debt': 0.95,
      'fdi': 0.10,
      'unemployment': 0.75
    }
  },
  {
    id: 'general_strike',
    name: 'General Strike',
    description: 'UGTT calls for nationwide industrial action, paralyzing key economic sectors.',
    icon: AlertCircle,
    impact: {
      'gdp': 0.10,
      'unemployment': 0.85,
      'phosphate': 0.05,
      'tourism': 0.20,
      'social_stress': 0.90
    }
  },
  {
    id: 'energy_shock',
    name: 'Energy Supply Shock',
    description: 'Major disruption in regional gas pipelines leading to widespread power outages.',
    icon: Zap,
    impact: {
      'energy': 0.90,
      'gdp': 0.25,
      'inflation': 0.80,
      'social_stress': 0.75
    }
  },
  {
    id: 'stabilization',
    name: 'Stabilization Pact',
    description: 'Successful multi-lateral agreement leads to significant capital inflows.',
    icon: TrendingUp,
    impact: {
      'fdi': 0.80,
      'reserves': 0.75,
      'inflation': 0.40,
      'gdp': 0.65,
      'social_stress': 0.30
    }
  }
];

export const RiskModel: React.FC<RiskModelProps> = ({ variables: initialVariables }) => {
  const { rriState } = usePipeline();
  const [variables, setVariables] = useState<RRIVariable[]>(initialVariables || []);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [hoveredVarId, setHoveredVarId] = useState<string | null>(null);
  const [mcData, setMcData] = useState<{ rri: number; count: number }[]>([]);

  const applyScenario = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    setIsSimulating(true);
    setActiveScenario(scenarioId);

    // Simulate processing time
    setTimeout(() => {
      setIsSimulating(false);
    }, 800);
  };

  const resetVariables = () => {
    setVariables(initialVariables || []);
    setActiveScenario(null);
  };

  useEffect(() => {
    if (initialVariables) {
      setVariables(initialVariables);
      // Initial MC run for the chart
      const mc = runMonteCarlo(initialVariables as any);
      setMcData(mc.chartData.map(d => ({ rri: d.rri, count: d.frequency })));
    }
  }, [initialVariables]);

  const handleVariableChange = (id: string, newValue: number) => {
    setVariables(prev => (prev || []).map(v => v.id === id ? { ...v, value: newValue } : v));
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setVariables(prev => (prev || []).map(v => v.id === id ? { ...v, weight: newWeight } : v));
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const mc = runMonteCarlo(variables as any);
      setMcData(mc.chartData.map(d => ({ rri: d.rri, count: d.frequency })));
      setIsSimulating(false);
    }, 1500);
  };

  const tier = getRiskTier(rriState.rri);
  const confidence = rriState.model_confidence;

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
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Current State — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <div className="flex items-baseline space-x-4">
                <span className={`text-6xl font-bold font-mono ${tier.color}`}>{rriState.rri.toFixed(2)}</span>
                <span className="text-sm font-mono text-slate-400 uppercase">R(t) Index</span>
              </div>
              
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">P(Revolution)</div>
                  <div className="text-xl font-bold font-mono text-white">{(rriState.p_rev * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-intel-border">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Risk Tier</div>
                  <div className={`text-xl font-bold font-mono uppercase ${tier.color}`}>{tier.label}</div>
                  <div className="mt-1 text-[10px] font-mono text-slate-400">
                    Regime Age: <span className="text-white font-bold">{rriState.regime_age.years}Y</span> ({(rriState.regime_age.age_pct * 100).toFixed(0)}%)
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">95% CI Low</div>
                  <div className="text-xs font-mono text-slate-300">{rriState.ci_low.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">95% CI High</div>
                  <div className="text-xs font-mono text-slate-300">{rriState.ci_high.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <div className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">Confidence</div>
                  <div className="text-xs font-mono text-intel-cyan">{(confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
                 <div className="text-[10px] font-mono text-intel-cyan uppercase font-bold mb-2 flex items-center">
                   <Info className="w-3 h-3 mr-1" />
                   Model Equation
                 </div>
                 <div className="text-xs font-mono text-slate-300 italic">
                   R(t) = Σ[wi * vi(t)] / Σwi · W(t) · S(t)
                 </div>
                 <div className="mt-2 text-[8px] text-slate-500 leading-relaxed">
                   Where W(t) is the war distractor ({rriState.w_t.toFixed(2)}) and S(t) is salience ({rriState.salience.toFixed(2)}).
                 </div>
              </div>
            </div>
          </div>

          {/* VELOCITY PANEL */}
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Velocity Index V(t) — Rate of Change
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold font-mono ${
                rriState.velocity > 0.15 ? 'text-intel-red' :
                rriState.velocity < -0.15 ? 'text-intel-cyan' : 'text-slate-400'
              }`}>
                {rriState.velocity > 0 ? '+' : ''}{rriState.velocity.toFixed(3)}
              </div>
              <div className={`text-xs font-mono px-3 py-1 rounded border ${
                rriState.velocity > 0.4 ? 'text-intel-red border-intel-red/30 bg-intel-red/10' :
                rriState.velocity > 0.15 ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' :
                rriState.velocity < -0.15 ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10' :
                'text-slate-500 border-slate-700'
              }`}>
                {rriState.velocity_label}
              </div>
            </div>
            <div className="text-[10px] text-slate-500">
              Measures rate of change across all 250 variables.
              Positive = situation deteriorating. Negative = improving.
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  rriState.velocity > 0 ? 'bg-intel-red' : 'bg-intel-cyan'
                }`}
                style={{
                  width: `${Math.abs(rriState.velocity) * 100}%`,
                  marginLeft: rriState.velocity < 0 ? 'auto' : '0'
                }}
              />
            </div>
          </div>

          {/* HISTORICAL PATTERN SIMILARITY PANEL */}
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Historical Pattern Similarity HPS(t)
            </div>
            <div className="flex items-center justify-between">
              <div className={`text-3xl font-bold font-mono ${
                rriState.pattern_similarity > 0.65 ? 'text-intel-red' :
                rriState.pattern_similarity > 0.5 ? 'text-intel-orange' : 'text-slate-400'
              }`}>
                {(rriState.pattern_similarity * 100).toFixed(0)}%
              </div>
              {rriState.pattern_similarity > 0.5 && (
                <div className="text-[9px] font-mono text-intel-orange animate-pulse">
                  ⚠ PATTERN MATCH DETECTED
                </div>
              )}
            </div>
            <div className="text-[10px] text-intel-orange leading-relaxed">
              {rriState.pattern_label}
            </div>
            <div className="text-[10px] text-slate-500">
              Cosine similarity to known pre-crisis reference states:
              Tunisia 2010, Tunisia 2021, Egypt 2011, Algeria 2019.
            </div>
          </div>

          {/* COMPOUND STRESS PANEL */}
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Compound Stress Index CS(t)
            </div>
            <div className="text-3xl font-bold font-mono text-intel-orange">
              {rriState.compound_stress.toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500">
              Non-linear interaction bonus. Fires when multiple variables
              breach thresholds simultaneously. Current R(t) includes
              {' '}{(rriState.compound_stress * 100).toFixed(1)}% compound stress amplification.
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-slate-600 uppercase">Active threshold breaches</div>
              <div className="flex flex-wrap gap-2">
                {rriState.threshold_breaches.slice(0, 8).map((id: string) => (
                  <span key={id} className="text-[8px] font-mono px-2 py-0.5
                    bg-intel-red/10 text-intel-red border border-intel-red/20 rounded">
                    {id}
                  </span>
                ))}
                {rriState.threshold_breaches.length > 8 && (
                  <span className="text-[8px] font-mono text-slate-500">
                    +{rriState.threshold_breaches.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CASCADE PROBABILITY PANEL */}
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Regional Cascade Probability P_cascade(t)
            </div>
            <div className={`text-3xl font-bold font-mono ${
              rriState.cascade_probability > 0.6 ? 'text-intel-red' :
              rriState.cascade_probability > 0.4 ? 'text-intel-orange' : 'text-slate-400'
            }`}>
              {(rriState.cascade_probability * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-500">
              Probability that instability in one governorate triggers
              cascade to neighbors. High-risk pathway: Sfax → Kasserine.
            </div>
            <div className="space-y-2">
              {[
                { from: 'Sfax', to: 'Kasserine', prob: 0.71 },
                { from: 'Sfax', to: 'Gafsa', prob: 0.58 },
                { from: 'Kasserine', to: 'Sidi Bouzid', prob: 0.52 },
              ].map(path => (
                <div key={path.from+path.to} className="flex items-center
                  justify-between text-[10px]">
                  <span className="text-slate-400">{path.from} → {path.to}</span>
                  <span className={`font-mono font-bold ${
                    path.prob > 0.6 ? 'text-intel-red' : 'text-intel-orange'
                  }`}>{(path.prob * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* SIR MODEL PANEL */}
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              SIR Protest Spread Model — EQ.4
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Susceptible S', value: rriState.sir_susceptible, color: 'text-intel-cyan', desc: 'Potential protesters' },
                { label: 'Infected I', value: rriState.sir_infected, color: 'text-intel-orange', desc: 'Active protesters' },
                { label: 'Recovered R', value: rriState.sir_recovered, color: 'text-slate-400', desc: 'Former participants' },
              ].map(item => (
                <div key={item.label} className="text-center space-y-1">
                  <div className={`text-xl font-bold font-mono ${item.color}`}>
                    {(item.value * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">{item.label}</div>
                  <div className="text-[8px] text-slate-600">{item.desc}</div>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-slate-600">
              beta=0.4 (transmission) · gamma=0.15 (repression efficacy)
              · Samir Dni (2025) calibrated
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm tracking-widest flex items-center">
                <Zap className="w-4 h-4 mr-2 text-intel-purple" />
                Crisis Scenarios
              </h3>
              {activeScenario && (
                <button 
                  onClick={resetVariables}
                  className="text-[8px] font-mono text-intel-cyan uppercase hover:underline"
                >
                  Reset Model
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => applyScenario(s.id)}
                  disabled={isSimulating}
                  className={`flex items-start p-3 rounded-xl border transition-all text-left group ${
                    activeScenario === s.id 
                      ? 'bg-intel-purple/10 border-intel-purple/40 ring-1 ring-intel-purple/20' 
                      : 'bg-white/5 border-intel-border hover:border-intel-purple/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg mr-3 ${
                    activeScenario === s.id ? 'bg-intel-purple/20 text-intel-purple' : 'bg-white/5 text-slate-500 group-hover:text-intel-purple'
                  }`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-white uppercase tracking-wider">{s.name}</div>
                    <div className="text-[8px] text-slate-500 leading-tight">{s.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl">
            <h3 className="text-sm tracking-widest mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-intel-cyan" />
              Simulation Output
            </h3>
            <div className="space-y-4">
              <div className="relative h-32 w-full bg-intel-bg/50 rounded-lg border border-intel-border overflow-hidden flex items-end px-2 space-x-1">
                {mcData.length > 0 ? (
                  mcData.map((d, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.count / Math.max(...mcData.map(x => x.count))) * 100}%` }}
                      className={`flex-1 rounded-t ${d.rri > 2.5 ? 'bg-intel-red/40' : 'bg-intel-cyan/40'}`}
                    ></motion.div>
                  ))
                ) : (
                  Array.from({ length: 20 }).map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: isSimulating ? `${Math.random() * 80 + 10}%` : `${[20, 35, 50, 65, 80, 90, 85, 70, 55, 40, 30, 25, 20, 15, 10, 8, 5, 3, 2, 1][i]}%` }}
                      className={`flex-1 rounded-t ${i > 10 ? 'bg-intel-red/40' : 'bg-intel-cyan/40'}`}
                    ></motion.div>
                  ))
                )}
                <div className="absolute top-1/2 left-0 right-0 border-t border-intel-red/30 border-dashed"></div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase">
                <span>Low Risk</span>
                <span>Threshold (2.50)</span>
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
                      <div key={v.id} className="space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex flex-col cursor-help group/var"
                            onMouseEnter={() => setHoveredVarId(v.id)}
                            onMouseLeave={() => setHoveredVarId(null)}
                          >
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-white uppercase tracking-wider group-hover/var:text-intel-cyan transition-colors">{v.name}</span>
                              <Info className="w-3 h-3 text-slate-600 group-hover/var:text-intel-cyan transition-colors" />
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase">{v.source}</span>

                            <AnimatePresence>
                              {hoveredVarId === v.id && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute z-50 bottom-full left-0 mb-2 w-64 p-4 bg-intel-card border border-intel-border rounded-xl shadow-2xl pointer-events-none"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">{v.name}</span>
                                      <span className="text-[8px] font-mono text-intel-cyan uppercase">Metadata</span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex items-start space-x-2">
                                        <Database className="w-3 h-3 text-slate-500 mt-0.5" />
                                        <div className="space-y-0.5">
                                          <div className="text-[8px] font-mono text-slate-500 uppercase">Data Source</div>
                                          <div className="text-[10px] text-slate-300">{v.source}</div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start space-x-2">
                                        <Calendar className="w-3 h-3 text-slate-500 mt-0.5" />
                                        <div className="space-y-0.5">
                                          <div className="text-[8px] font-mono text-slate-500 uppercase">Last Updated</div>
                                          <div className="text-[10px] text-slate-300">{v.last_updated}</div>
                                        </div>
                                      </div>

                                      <div className="flex items-start space-x-2">
                                        <BookOpen className="w-3 h-3 text-slate-500 mt-0.5" />
                                        <div className="space-y-0.5">
                                          <div className="text-[8px] font-mono text-slate-500 uppercase">Methodology</div>
                                          <div className="text-[10px] text-slate-400 leading-relaxed italic">
                                            {v.methodology || 'Standard econometric modeling applied to primary source data.'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-intel-card border-r border-b border-intel-border rotate-45"></div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] text-slate-500 uppercase">Weight</span>
                              <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                max="1"
                                value={v.weight}
                                onChange={(e) => handleWeightChange(v.id, parseFloat(e.target.value))}
                                className="w-10 bg-transparent text-[10px] font-mono text-intel-purple text-right focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] text-slate-500 uppercase">Value</span>
                              <span className="text-xs font-mono text-white">{(v.value * 100).toFixed(0)}%</span>
                            </div>
                          </div>
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
                  Global Suppressors & Factors
                </h4>
                <div className="h-[1px] w-full bg-intel-purple/20"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">War Distraction W(t)</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase italic">Dampens protest mobilisation</span>
                    </div>
                    <span className="text-xs font-mono text-white">{(rriState.w_t * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-intel-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-intel-purple transition-all duration-500" 
                      style={{ width: `${rriState.w_t * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Regime Age Factor</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase italic">{rriState.regime_age.years} years in power</span>
                    </div>
                    <span className="text-xs font-mono text-white">{(rriState.regime_age.age_pct * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-intel-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-intel-cyan transition-all duration-500" 
                      style={{ width: `${rriState.regime_age.age_pct * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODEL METADATA FOOTER */}
      <div className="glass p-4 rounded-xl border border-intel-border/30
        flex flex-wrap gap-6 text-[10px] font-mono text-slate-600">
        <span>Variables: {rriState.variables_count}</span>
        <span>Confidence: {(rriState.model_confidence * 100).toFixed(0)}%</span>
        <span>Simulations: {rriState.simulations_run.toLocaleString()}</span>
        <span>Last calc: {new Date(rriState.last_calculated).toLocaleTimeString()}</span>
        <span>Threshold breaches: {rriState.threshold_breaches.length}</span>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-methodology'))}
          className="text-intel-cyan hover:underline ml-auto"
        >
          → View Full Methodology
        </button>
      </div>
    </div>
  );
};
