import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Droplets,
  CloudRain,
  Wheat,
  Activity,
  History,
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { cn } from '../utils/cn';

interface AgroScenario {
  id: string;
  name: string;
  desc: string;
  impact_bci: number;
  impact_rri: number;
  causality_chain: string[];
}

const SCENARIO_PRESETS: AgroScenario[] = [
  {
    id: 'severe-drought',
    name: 'Compound 3-Year Drought',
    desc: 'Successive winter rainfall failure leading to complete surface water depletion.',
    impact_bci: 0.82,
    impact_rri: 0.15,
    causality_chain: ['Dam Level < 15%', 'Irrigation Cutoffs', 'Veg Supply Chain Collapse', 'Urban Food Insecurity']
  },
  {
    id: 'import-shock',
    name: 'Black Sea Import Blockade',
    desc: 'Disruption of global wheat supply chains leading to 40% price surge.',
    impact_bci: 0.74,
    impact_rri: 0.22,
    causality_chain: ['Global Wheat Price +40%', 'Subsidy Budget Exhaustion', 'Bread Queue Formation', 'Public Signal Spike']
  },
  {
    id: 'subsidy-reform',
    name: 'Sudden Subsidy Removal',
    desc: 'Structural adjustment requiring immediate withdrawal of flour subsidies.',
    impact_bci: 0.91,
    impact_rri: 0.35,
    causality_chain: ['Retail Bread Price +150%', 'Mass Urban Mobilization', 'General Strike Risk', 'Systemic Instability']
  }
];

export const AgroScenarioSimulator: React.FC = () => {
  const [params, setParams] = useState({
    rainfall_def: 20,
    import_cost: 0,
    subsidy_level: 100,
    dam_reserve: 35
  });

  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const results = useMemo(() => {
    // Simplified simulation logic
    const bci_base = 0.35;
    const water_stress = (100 - params.dam_reserve) / 100;
    const price_pressure = (params.import_cost / 100) + ((100 - params.subsidy_level) / 100);
    const supply_stress = (params.rainfall_def / 100) + (water_stress * 0.5);

    const bci = Math.min(0.98, bci_base + (supply_stress * 0.3) + (price_pressure * 0.4));
    
    return {
      bci,
      water_stress: Math.min(1, water_stress + (params.rainfall_def / 200)),
      food_insecurity: Math.min(1, (bci * 0.7) + (supply_stress * 0.3)),
      rri_impact: parseFloat((bci * 0.25).toFixed(3))
    };
  }, [params]);

  const causalityChain = useMemo(() => {
    const chain = [];
    if (params.rainfall_def > 30) chain.push('Aquifer Depletion');
    if (params.dam_reserve < 20) chain.push('Irrigation Triage');
    if (results.bci > 0.6) chain.push('Supply Shortages');
    if (results.bci > 0.75) chain.push('Price Riots / Unrest');
    return chain.length > 0 ? chain : ['Baseline Stability'];
  }, [params, results]);

  return (
    <div className="glass rounded-2xl border border-intel-border overflow-hidden flex flex-col bg-[#0a0a0a]/90 backdrop-blur-2xl">
      <div className="px-6 py-5 border-b border-intel-border/30 flex items-center justify-between bg-gradient-to-r from-emerald-500/5 to-transparent">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
          <div className="flex flex-col">
            <h3 className="text-xs font-mono text-white uppercase tracking-widest font-bold">
              Agro-Shock Simulator v1.0
            </h3>
            <span className="text-[8px] text-slate-500 font-mono uppercase">Strategic Scenario Modeler</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white/5 px-2 py-1 rounded border border-white/10">
            <Search className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-mono text-slate-400 uppercase">Monte Carlo Active</span>
          </div>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4">Manual Parameters</h4>
            
            <SimControl 
              label="Rainfall Deficit (%)" 
              value={params.rainfall_def} 
              icon={CloudRain}
              onChange={(v) => setParams(p => ({ ...p, rainfall_def: v }))} 
            />
            <SimControl 
              label="Import Cost Delta (%)" 
              value={params.import_cost} 
              icon={TrendingUp}
              onChange={(v) => setParams(p => ({ ...p, import_cost: v }))} 
            />
            <SimControl 
              label="Subsidy Intensity (%)" 
              value={params.subsidy_level} 
              icon={Activity}
              max={100}
              onChange={(v) => setParams(p => ({ ...p, subsidy_level: v }))} 
            />
            <SimControl 
              label="Dam Reserves (%)" 
              value={params.dam_reserve} 
              icon={Droplets}
              max={100}
              onChange={(v) => setParams(p => ({ ...p, dam_reserve: v }))} 
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-[9px] font-mono text-slate-500 uppercase">Preset Shocks</h4>
            <div className="grid grid-cols-1 gap-2">
              {SCENARIO_PRESETS.map(s => (
                <button 
                  key={s.id}
                  onClick={() => {
                    if (s.id === 'severe-drought') setParams({ rainfall_def: 65, import_cost: 15, subsidy_level: 90, dam_reserve: 12 });
                    if (s.id === 'import-shock') setParams({ rainfall_def: 15, import_cost: 48, subsidy_level: 100, dam_reserve: 40 });
                    if (s.id === 'subsidy-reform') setParams({ rainfall_def: 10, import_cost: 10, subsidy_level: 0, dam_reserve: 35 });
                    setActiveScenario(s.id);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all text-[10px] font-mono flex items-center justify-between group",
                    activeScenario === s.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  <span>{s.name.toUpperCase()}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central Display */}
        <div className="lg:col-span-1 border-x border-white/5 flex items-center justify-center">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ResultCard label="Simulated BCI" value={`${(results.bci * 100).toFixed(1)}%`} sub="Bread Crisis Index" color="red" />
            <ResultCard label="Water Stress" value={`${(results.water_stress * 100).toFixed(1)}%`} sub="Composite Deficit" color="amber" />
            <ResultCard label="RRI Volatility" value={`+${results.rri_impact}`} sub="Risk Impact Score" color="cyan" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center">
                 <History className="w-3.5 h-3.5 mr-2" />
                 Causality Chain Tracking
               </h4>
               <div className="space-y-4 relative pl-4 border-l border-white/5">
                 {causalityChain.map((step, i) => (
                   <motion.div 
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start space-x-3 group"
                   >
                     <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all" />
                     <div className="flex flex-col">
                       <span className="text-[11px] font-medium text-white/90 uppercase tracking-tight">{step}</span>
                       <span className="text-[8px] text-slate-500 font-mono">T+{i*7} DAYS</span>
                     </div>
                   </motion.div>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                Impact Decomposition
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Supply', value: results.bci * 40 },
                    { name: 'Price', value: (params.import_cost + (100 - params.subsidy_level)) / 2 },
                    { name: 'Stability', value: results.rri_impact * 100 }
                  ]}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      { [0, 1, 2].map(i => <Cell key={i} fill={ i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : '#3b82f6'} />) }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-tight">Intelligence Recommendation</span>
                <span className="text-[10px] text-slate-400">Model suggests proactive wheat procurement or subsidy hedging if BCI sustains &gt; 0.65.</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setParams({ rainfall_def: 20, import_cost: 0, subsidy_level: 100, dam_reserve: 35 });
                setActiveScenario(null);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 transition-all border border-white/5"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimControl: React.FC<{ label: string; value: number; icon: any; max?: number; onChange: (v: number) => void }> = ({ label, value, icon: Icon, max = 100, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-tight text-white/70">
      <div className="flex items-center">
        <Icon className="w-3 h-3 mr-2 text-emerald-400/60" />
        <span className="uppercase">{label}</span>
      </div>
      <span>{value}%</span>
    </div>
    <div className="group relative pt-2">
      <input 
        type="range" 
        min="0" 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 group-hover:accent-emerald-400 transition-all"
      />
    </div>
  </div>
);

const ResultCard: React.FC<{ label: string; value: string; sub: string; color: 'red' | 'amber' | 'cyan' }> = ({ label, value, sub, color }) => (
  <div className="p-5 rounded-2xl border border-white/5 bg-[#0f172a]/40 group hover:border-white/10 transition-all">
    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</div>
    <div className={cn(
      "text-2xl font-bold font-mono tracking-tighter mb-1",
      color === 'red' ? 'text-red-400' : color === 'amber' ? 'text-amber-400' : 'text-intel-cyan'
    )}>{value}</div>
    <div className="text-[8px] text-slate-600 uppercase font-mono">{sub}</div>
  </div>
);
