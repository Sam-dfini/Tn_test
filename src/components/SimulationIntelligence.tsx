import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  BarChart3, 
  Settings2, 
  Users, 
  Zap, 
  History, 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Trash2, 
  AlertTriangle,
  Info,
  ChevronRight,
  Target,
  Activity,
  Brain,
  TrendingUp,
  TrendingDown,
  Shield,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Landmark
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';
import { generateAnalystResponse } from '../services/geminiService';
import { runMonteCarlo, simulateScenario, calculatePRev as engineCalculatePRev } from '../utils/rriEngine';
import { RRIVariable } from '../types/intel';

import { usePipeline } from '../context/PipelineContext';

// --- Types ---

type Tab = 'monte-carlo' | 'scenario' | 'agent' | 'ai-multi' | 'backtesting';

interface Scenario {
  id: string;
  name: string;
  params: Record<string, number>;
  pRev: number;
  timestamp: number;
}

interface AgentState {
  type: string;
  count: number;
  active: number;
  threshold: number;
  color: string;
}

interface AnalystPersona {
  id: string;
  name: string;
  role: string;
  color: string;
}

// --- Constants & Mock Data ---

const SIM_ALERTS = [
  { code: 'SIM-MC-01', title: 'Monte Carlo: Tail Risk Expansion', impact: 'HIGH' },
  { code: 'SIM-AGENT-04', title: 'Agent Model: Tipping Point Detected', impact: 'CRITICAL' },
  { code: 'SIM-AI-09', title: 'AI Consensus: High Dissent Flag', impact: 'MEDIUM' },
  { code: 'SIM-BACK-12', title: 'Backtest: Calibration Drift > 5%', impact: 'WARNING' }
];

const ANALYST_PERSONAS: AnalystPersona[] = [
  { id: 'realist', name: 'Dr. Aris Thorne', role: 'Realist Power Dynamics', color: '#00f2ff' },
  { id: 'inst', name: 'Prof. Elena Vance', role: 'Institutional Stability', color: '#bf00ff' },
  { id: 'const', name: 'Marcus Chen', role: 'Constructivist Narratives', color: '#22c55e' },
  { id: 'sec', name: 'Gen. Sarah Miller', role: 'Security & Order', color: '#ef4444' },
  { id: 'econ', name: 'David Stein', role: 'Macro-Fiscal Impact', color: '#f97316' },
  { id: 'civil', name: 'Nadia Mansour', role: 'Civil Society Pulse', color: '#fbbf24' }
];

const SCENARIO_PRESETS = [
  { name: 'Baseline 2026', params: { war: 0.2, repression: 0.4, remittances: 0.7, imf: 0.3, ugtt: 0.5, fx: 0.4, youth: 0.8, elite: 0.6 } },
  { name: 'IMF Breakthrough', params: { war: 0.1, repression: 0.2, remittances: 0.8, imf: 0.9, ugtt: 0.2, fx: 0.7, youth: 0.6, elite: 0.8 } },
  { name: 'Total Gridlock', params: { war: 0.5, repression: 0.7, remittances: 0.4, imf: 0.1, ugtt: 0.9, fx: 0.2, youth: 0.9, elite: 0.3 } },
  { name: 'Security Crackdown', params: { war: 0.3, repression: 0.9, remittances: 0.6, imf: 0.4, ugtt: 0.1, fx: 0.5, youth: 0.8, elite: 0.9 } }
];

// --- Helper Functions ---

const generateMonteCarlo = (count = 10000) => {
  const data: Record<number, number> = {};
  const results: number[] = [];
  
  // Simulate RRI (Revolution Risk Index) 0-100
  // Mean around 65, StdDev around 12
  for (let i = 0; i < count; i++) {
    let val = 65 + (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 20;
    val = Math.max(0, Math.min(100, val));
    const bucket = Math.round(val);
    data[bucket] = (data[bucket] || 0) + 1;
    results.push(val);
  }
  
  const sorted = [...results].sort((a, b) => a - b);
  const mean = results.reduce((a, b) => a + b, 0) / count;
  const median = sorted[Math.floor(count / 2)];
  const p5 = sorted[Math.floor(count * 0.05)];
  const p95 = sorted[Math.floor(count * 0.95)];
  
  const chartData = Array.from({ length: 101 }, (_, i) => ({
    rri: i,
    frequency: data[i] || 0
  }));
  
  return { chartData, stats: { mean, median, p5, p95 } };
};

const calculatePRev = (params: Record<string, number>) => {
  // Simple weighted formula for P_rev (Probability of Revolution)
  const weights: Record<string, number> = {
    war: 0.15,
    repression: 0.2,
    remittances: -0.1,
    imf: -0.15,
    ugtt: 0.2,
    fx: -0.1,
    youth: 0.25,
    elite: -0.15
  };
  
  let score = 0.4; // Base score
  Object.entries(params).forEach(([key, val]) => {
    score += val * weights[key];
  });
  
  return Math.max(0, Math.min(1, score));
};

// --- Components ---

export const SimulationIntelligence: React.FC<{ context?: any, variables: RRIVariable[] }> = ({ context, variables }) => {
  const { rriState } = usePipeline();
  const [activeTab, setActiveTab] = useState<Tab>('monte-carlo');
  
  // Monte Carlo State
  const [mcData, setMcData] = useState(() => runMonteCarlo(variables as any));
  
  // Scenario State
  const [scenarioParams, setScenarioParams] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    variables.forEach(v => {
      initial[v.id] = v.value;
    });
    return initial;
  });
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  
  const currentPRev = useMemo(() => {
    const state = simulateScenario(variables, scenarioParams);
    return state.prev;
  }, [scenarioParams, variables]);
  
  // Agent Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTick, setSimTick] = useState(0);
  const [simSpeed, setSimSpeed] = useState(500);
  const [agentHistory, setAgentHistory] = useState<any[]>([]);
  const simRef = useRef<NodeJS.Timeout | null>(null);
  
  const INITIAL_AGENTS: AgentState[] = [
    { type: 'Citizens', count: 2400000, active: 12000, threshold: 0.15, color: '#00f2ff' },
    { type: 'Elites', count: 800, active: 0, threshold: 0.4, color: '#bf00ff' },
    { type: 'Security', count: 120000, active: 0, threshold: 0.6, color: '#ef4444' },
    { type: 'UGTT', count: 650000, active: 5000, threshold: 0.25, color: '#22c55e' },
    { type: 'Opposition', count: 4200, active: 800, threshold: 0.1, color: '#f97316' }
  ];
  
  const [agents, setAgents] = useState<AgentState[]>(INITIAL_AGENTS);

  // AI Multi-Agent State
  const [aiSeed, setAiSeed] = useState('');
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiForecast, setAiForecast] = useState(0);

  // Backtesting State
  const [backtestLogs, setBacktestLogs] = useState([
    { date: '2025-Q1', sim: 62, actual: 58, error: -4, event: 'IMF Delay' },
    { date: '2025-Q2', sim: 68, actual: 72, error: 4, event: 'Subsidy Protest' },
    { date: '2025-Q3', sim: 75, actual: 74, error: -1, event: 'Security Reform' },
    { date: '2025-Q4', sim: 82, actual: 85, error: 3, event: 'Election Crisis' },
    { date: '2026-Q1', sim: 78, actual: 79, error: 1, event: 'Remittance Surge' },
  ]);

  const calibrationData = [
    { predicted: 10, actual: 12 },
    { predicted: 20, actual: 18 },
    { predicted: 30, actual: 35 },
    { predicted: 40, actual: 38 },
    { predicted: 50, actual: 52 },
    { predicted: 60, actual: 58 },
    { predicted: 70, actual: 75 },
    { predicted: 80, actual: 82 },
    { predicted: 90, actual: 88 }
  ];

  // --- Handlers ---

  const handleRunMC = () => {
    setMcData(runMonteCarlo(variables));
  };

  const handleParamChange = (key: string, val: number) => {
    setScenarioParams(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveScenario = () => {
    if (!scenarioName) return;
    const newScenario: Scenario = {
      id: Math.random().toString(36).substr(2, 9),
      name: scenarioName,
      params: { ...scenarioParams },
      pRev: currentPRev,
      timestamp: Date.now()
    };
    setSavedScenarios(prev => [newScenario, ...prev].slice(0, 6));
    setScenarioName('');
  };

  const handleLoadScenario = (s: Scenario | typeof SCENARIO_PRESETS[0]) => {
    setScenarioParams(s.params);
  };

  const handleRunAgentSim = useCallback(() => {
    if (isSimulating) {
      if (simRef.current) clearInterval(simRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      simRef.current = setInterval(() => {
        setSimTick(prev => {
          if (prev >= 52) {
            if (simRef.current) clearInterval(simRef.current);
            setIsSimulating(false);
            return prev;
          }
          return prev + 1;
        });
      }, simSpeed);
    }
  }, [isSimulating, simSpeed]);

  const handleResetAgentSim = () => {
    if (simRef.current) clearInterval(simRef.current);
    setIsSimulating(false);
    setSimTick(0);
    setAgents(INITIAL_AGENTS);
    setAgentHistory([]);
  };

  useEffect(() => {
    if (simTick === 0) return;
    
    // Simple tipping logic
    setAgents(prev => {
      const next = prev.map(agent => {
        // Influence from other active agents
        const totalActive = prev.reduce((sum, a) => sum + a.active, 0);
        const totalPop = prev.reduce((sum, a) => sum + a.count, 0);
        const activeRatio = totalActive / totalPop;
        
        let growth = 0;
        if (activeRatio > agent.threshold) {
          growth = agent.count * 0.05 * (Math.random() + 0.5);
        } else {
          growth = -agent.active * 0.1 * Math.random();
        }
        
        const newActive = Math.max(0, Math.min(agent.count, agent.active + growth));
        return { ...agent, active: newActive };
      });
      
      setAgentHistory(h => [...h, {
        tick: simTick,
        ...next.reduce((acc, a) => ({ ...acc, [a.type]: Math.round(a.active) }), {})
      }]);
      
      return next;
    });
  }, [simTick]);

  const handleRunAIAnalyst = async () => {
    if (!aiSeed) return;
    setIsAiLoading(true);
    setAiResponses([]);
    
    try {
      const prompt = `Perform a multi-agent simulation for the following scenario: "${aiSeed}". 
      Analyze from 6 perspectives: Realist, Institutionalist, Constructivist, Security, Economist, and Civil Society.
      Return a JSON array of objects with "id", "persona", "forecast" (0-100), "reasoning", and "dissent" (boolean).`;
      
      const response = await generateAnalystResponse(prompt, context || {
        rri: rriState.rri,
        pRev: rriState.p_rev,
        events: [],
        governorates: [],
        actors: [],
        movements: []
      });
      // Mocking the structured response for now as geminiService returns text
      // In a real app, we'd parse the JSON from the text
      const mockResponses = ANALYST_PERSONAS.map(p => ({
        id: p.id,
        persona: p.name,
        forecast: Math.floor(Math.random() * 40) + 40,
        reasoning: `Based on the ${p.role} framework, this scenario suggests a significant shift in power dynamics. The primary risk factor is the decoupling of elite interests from security apparatus stability.`,
        dissent: Math.random() > 0.8
      }));
      
      setAiResponses(mockResponses);
      setAiForecast(Math.round(mockResponses.reduce((a, b) => a + b.forecast, 0) / mockResponses.length));
    } catch (error) {
      console.error('AI Simulation failed:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleInjectEvent = (eventType: string) => {
    setAgents(prev => prev.map(agent => {
      switch(eventType) {
        case 'POLICE_BRUTALITY':
          // Increases citizen and opposition activation, reduces security threshold
          if (agent.type === 'Citizens') 
            return { ...agent, active: Math.min(agent.count, agent.active * 1.4), threshold: agent.threshold * 0.8 };
          if (agent.type === 'Opposition') 
            return { ...agent, active: Math.min(agent.count, agent.active * 1.8) };
          if (agent.type === 'Security') 
            return { ...agent, threshold: agent.threshold * 1.2 };
          return agent;
        case 'UGTT_STRIKE':
          if (agent.type === 'UGTT') 
            return { ...agent, active: Math.min(agent.count, agent.active * 2.0) };
          if (agent.type === 'Citizens')
            return { ...agent, active: Math.min(agent.count, agent.active * 1.2) };
          return agent;
        case 'IMF_REJECTION':
          if (agent.type === 'Elites')
            return { ...agent, threshold: agent.threshold * 0.5 };
          if (agent.type === 'Citizens')
            return { ...agent, threshold: agent.threshold * 0.7 };
          return agent;
        case 'REMITTANCE_SURGE':
          if (agent.type === 'Citizens')
            return { ...agent, active: Math.max(0, agent.active * 0.7), threshold: agent.threshold * 1.3 };
          return agent;
        default:
          return agent;
      }
    }));
  };

  // --- Render Helpers ---

  const renderMonteCarlo = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 intel-card p-6 rounded-2xl border border-intel-border">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">RRI Distribution Analysis</h3>
              <p className="text-[10px] text-slate-500 font-mono">1,000 Iterations // Monte Carlo Engine v4.2</p>
            </div>
            <button 
              onClick={handleRunMC}
              className="flex items-center space-x-2 px-4 py-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 rounded-lg hover:bg-intel-cyan/20 transition-all text-xs font-bold font-mono"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RE-RUN SIMULATION</span>
            </button>
          </div>
          
          {context?.regimeAge && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Regime Age (Years)</div>
                <div className="text-lg font-bold font-mono text-white">{context.regimeAge.years} Years</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Age Percentile</div>
                <div className="text-lg font-bold font-mono text-intel-cyan">{(context.regimeAge.age_pct * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mcData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="rri" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                  label={{ value: 'Revolution Risk Index (RRI)', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                />
                <Bar dataKey="frequency">
                  {mcData.chartData.map((entry, index) => {
                    let color = '#1e293b';
                    if (entry.rri >= mcData.p5 && entry.rri <= mcData.p95) color = '#00f2ff44';
                    if (entry.rri >= 3.0) color = '#ef444488'; // Threshold is 2.31, critical is 3.0
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-intel-cyan/30 rounded-sm"></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">90% Confidence Interval</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-intel-red/50 rounded-sm"></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Critical Risk Zone (&gt;80)</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="intel-card p-6 rounded-2xl border border-intel-border bg-gradient-to-br from-intel-card to-intel-cyan/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center">
              <Target className="w-4 h-4 mr-2 text-intel-cyan" />
              Statistical Summary
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Mean RRI', value: mcData.mean.toFixed(2), color: 'text-white' },
                { label: 'Median RRI', value: mcData.median.toFixed(2), color: 'text-white' },
                { label: '5th Percentile', value: mcData.p5.toFixed(2), color: 'text-intel-cyan' },
                { label: '95th Percentile', value: mcData.p95.toFixed(2), color: 'text-intel-red' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{stat.label}</span>
                  <span className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="intel-card p-6 rounded-2xl border border-intel-border">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-intel-orange" />
              Risk Assessment
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              The simulation indicates a <span className="text-intel-red font-bold">12.4% probability</span> of RRI exceeding the critical threshold of 80 within the next 12 months.
            </p>
            <div className="p-3 bg-intel-red/10 border border-intel-red/20 rounded-lg">
              <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Tail Risk Warning</div>
              <div className="text-[10px] text-white italic">"Extreme scenarios show potential for rapid escalation if IMF negotiations fail simultaneously with UGTT mobilization."</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScenarioSimulator = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-8 intel-card p-6 rounded-2xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Variable Parameter Matrix</h3>
              <p className="text-[10px] text-slate-500 font-mono">Adjust sliders to observe real-time impact on P_rev</p>
            </div>
            <div className="flex items-center space-x-2">
              {SCENARIO_PRESETS.map((preset, i) => (
                <button 
                  key={i}
                  onClick={() => handleLoadScenario(preset)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-slate-400 hover:text-intel-cyan hover:border-intel-cyan/30 transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {variables.map((v) => (
              <div key={v.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Activity className="w-3 h-3 text-intel-cyan" />
                    <span className="text-[10px] font-mono uppercase tracking-wider">{v.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-intel-cyan font-bold">{(scenarioParams[v.id] * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={scenarioParams[v.id]} 
                  onChange={(e) => handleParamChange(v.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-intel-cyan"
                />
                <div className="flex justify-between text-[8px] font-mono text-slate-600 uppercase">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gauge Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="intel-card p-6 rounded-2xl border border-intel-border flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">P_rev Gauge</h3>
            </div>
            
            <div className="relative w-48 h-48 mt-4">
              {/* Gauge Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="12"
                  strokeDasharray="502.4"
                  strokeDashoffset="125.6"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke={currentPRev > 0.7 ? '#ef4444' : currentPRev > 0.4 ? '#f97316' : '#00f2ff'}
                  strokeWidth="12"
                  strokeDasharray="502.4"
                  initial={{ strokeDashoffset: 502.4 }}
                  animate={{ strokeDashoffset: 502.4 - (currentPRev * 376.8) }}
                  transition={{ type: 'spring', damping: 20 }}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.div 
                  key={currentPRev}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-4xl font-bold font-mono tracking-tighter ${currentPRev > 0.7 ? 'text-intel-red' : currentPRev > 0.4 ? 'text-intel-orange' : 'text-intel-cyan'}`}
                >
                  {(currentPRev * 100).toFixed(1)}%
                </motion.div>
                <div className="text-[8px] font-mono text-slate-500 uppercase mt-1 tracking-widest">Prob. of Revolution</div>
              </div>
            </div>
            
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Risk Level:</span>
                <span className={`font-bold uppercase ${currentPRev > 0.7 ? 'text-intel-red' : currentPRev > 0.4 ? 'text-intel-orange' : 'text-intel-cyan'}`}>
                  {currentPRev > 0.7 ? 'Critical' : currentPRev > 0.4 ? 'Elevated' : 'Nominal'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${currentPRev > 0.7 ? 'bg-intel-red' : currentPRev > 0.4 ? 'bg-intel-orange' : 'bg-intel-cyan'}`}
                  animate={{ width: `${currentPRev * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
              <Save className="w-4 h-4 mr-2 text-intel-cyan" />
              Save Scenario
            </h3>
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Scenario Name..." 
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-intel-cyan/50"
              />
              <button 
                onClick={handleSaveScenario}
                className="bg-intel-cyan text-intel-bg px-4 py-2 rounded-lg text-xs font-bold font-mono hover:bg-intel-cyan/80 transition-all"
              >
                SAVE
              </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {savedScenarios.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-lg group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white">{s.name}</span>
                    <span className="text-[8px] font-mono text-slate-500">P_rev: {(s.pRev * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleLoadScenario(s)} className="text-intel-cyan hover:text-white"><Play className="w-3 h-3" /></button>
                    <button onClick={() => setSavedScenarios(prev => prev.filter(x => x.id !== s.id))} className="text-intel-red hover:text-white"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              {savedScenarios.length === 0 && (
                <div className="text-center py-4 text-[10px] font-mono text-slate-600 italic">No saved scenarios</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgentSimulation = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Sim Controls</h3>
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-intel-green animate-pulse' : 'bg-slate-600'}`}></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">{isSimulating ? 'Running' : 'Paused'}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={handleRunAgentSim}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSimulating ? 'bg-intel-orange/20 text-intel-orange border border-intel-orange/30' : 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/30'}`}
              >
                {isSimulating ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
              <button 
                onClick={handleResetAgentSim}
                className="w-10 h-10 rounded-full bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center hover:text-white transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Simulation Week</span>
                <span className="text-xl font-bold font-mono text-white">{simTick} / 52</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-intel-cyan" style={{ width: `${(simTick / 52) * 100}%` }}></div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Playback Speed</span>
                <div className="flex items-center space-x-2">
                  {[1000, 500, 100].map(speed => (
                    <button 
                      key={speed}
                      onClick={() => setSimSpeed(speed)}
                      className={`flex-1 py-1 rounded text-[10px] font-mono font-bold border transition-all ${simSpeed === speed ? 'bg-intel-cyan/20 border-intel-cyan text-intel-cyan' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                      {speed === 1000 ? '1x' : speed === 500 ? '2x' : '5x'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Agent Populations</h3>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.type} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400 uppercase">{agent.type}</span>
                    <span className="text-white font-bold">{(agent.active).toLocaleString()} / {(agent.count).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full" 
                      style={{ backgroundColor: agent.color }}
                      animate={{ width: `${(agent.active / agent.count) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Chart Panel */}
        <div className="lg:col-span-8 intel-card p-6 rounded-2xl border border-intel-border flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Agent Dynamics</h3>
              <p className="text-[10px] text-slate-500 font-mono">Real-time population activation tracking</p>
            </div>
            <div className="flex items-center space-x-4">
              {INITIAL_AGENTS.map(a => (
                <div key={a.type} className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }}></div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">{a.type}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex-1 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agentHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="tick" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                  label={{ value: 'Weeks', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                />
                {INITIAL_AGENTS.map(a => (
                  <Line 
                    key={a.type}
                    type="monotone" 
                    dataKey={a.type} 
                    stroke={a.color} 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-4 gap-4">
            <button 
              onClick={() => handleInjectEvent('POLICE_BRUTALITY')}
              className="p-3 bg-intel-red/10 border border-intel-red/20 rounded-xl text-center hover:bg-intel-red/20 transition-all group"
            >
              <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Inject Event</div>
              <div className="text-[10px] text-white font-bold group-hover:text-intel-red transition-colors">POLICE BRUTALITY</div>
            </button>
            <button 
              onClick={() => handleInjectEvent('UGTT_STRIKE')}
              className="p-3 bg-intel-cyan/10 border border-intel-cyan/20 rounded-xl text-center hover:bg-intel-cyan/20 transition-all group"
            >
              <div className="text-[8px] font-mono text-intel-cyan uppercase font-bold mb-1">Inject Event</div>
              <div className="text-[10px] text-white font-bold group-hover:text-intel-cyan transition-colors">UGTT STRIKE</div>
            </button>
            <button 
              onClick={() => handleInjectEvent('IMF_REJECTION')}
              className="p-3 bg-intel-orange/10 border border-intel-orange/20 rounded-xl text-center hover:bg-intel-orange/20 transition-all group"
            >
              <div className="text-[8px] font-mono text-intel-orange uppercase font-bold mb-1">Inject Event</div>
              <div className="text-[10px] text-white font-bold group-hover:text-intel-orange transition-colors">IMF REJECTION</div>
            </button>
            <button 
              onClick={() => handleInjectEvent('REMITTANCE_SURGE')}
              className="p-3 bg-intel-green/10 border border-intel-green/20 rounded-xl text-center hover:bg-intel-green/20 transition-all group"
            >
              <div className="text-[8px] font-mono text-intel-green uppercase font-bold mb-1">Inject Event</div>
              <div className="text-[10px] text-white font-bold group-hover:text-intel-green transition-colors">REMITTANCE SURGE</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIMultiAgent = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="intel-card p-6 rounded-2xl border border-intel-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Multi-Agent Simulation Engine</h3>
            <p className="text-[10px] text-slate-500 font-mono">Consensus-based forecasting via specialized analyst personas</p>
          </div>
          <div className="flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="Enter scenario seed (e.g., 'Sudden collapse of phosphate exports due to regional conflict')..." 
              value={aiSeed}
              onChange={(e) => setAiSeed(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-32 py-3 text-xs font-mono text-white focus:outline-none focus:border-intel-cyan/50"
            />
            <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-intel-cyan" />
            <button 
              onClick={handleRunAIAnalyst}
              disabled={isAiLoading || !aiSeed}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-intel-cyan text-intel-bg px-4 py-1.5 rounded-lg text-[10px] font-bold font-mono hover:bg-intel-cyan/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAiLoading ? 'SIMULATING...' : 'RUN ANALYSIS'}
            </button>
          </div>
        </div>
        
        {aiResponses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Forecast Gauge */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#00f2ff"
                    strokeWidth="10"
                    strokeDasharray="439.6"
                    initial={{ strokeDashoffset: 439.6 }}
                    animate={{ strokeDashoffset: 439.6 - (aiForecast / 100 * 439.6) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono text-white">{aiForecast}%</span>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Aggregate Risk</span>
                </div>
              </div>
              
              <div className="w-full space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Consensus Level</span>
                    <span className="text-[10px] font-mono text-intel-green font-bold">HIGH</span>
                  </div>
                  <div className="h-1.5 w-full bg-intel-border rounded-full overflow-hidden">
                    <div className="h-full bg-intel-green w-[85%]"></div>
                  </div>
                </div>
                
                {aiResponses.some(r => r.dissent) && (
                  <div className="p-4 bg-intel-red/10 border border-intel-red/20 rounded-xl flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 text-intel-red shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-intel-red uppercase">Dissent Flag Detected</div>
                      <p className="text-[9px] text-slate-400 leading-tight">One or more analysts have flagged outlier risks not reflected in the aggregate score.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Analyst Cards */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {aiResponses.map((response, i) => {
                const persona = ANALYST_PERSONAS.find(p => p.id === response.id)!;
                return (
                  <motion.div 
                    key={response.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-xl border bg-white/5 flex flex-col justify-between space-y-4 relative overflow-hidden ${response.dissent ? 'border-intel-red/30' : 'border-white/10'}`}
                  >
                    {response.dissent && <div className="absolute top-0 right-0 bg-intel-red text-white text-[8px] px-2 py-0.5 font-bold uppercase">Dissent</div>}
                    
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${persona.color}20`, color: persona.color, borderColor: `${persona.color}40` }}
                      >
                        {persona.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-white">{persona.name}</div>
                        <div className="text-[8px] font-mono text-slate-500 uppercase">{persona.role}</div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">"{response.reasoning}"</p>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Risk Forecast</span>
                      <span className={`text-xs font-bold font-mono ${response.forecast > 70 ? 'text-intel-red' : 'text-intel-cyan'}`}>{response.forecast}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center space-y-4 text-center">
            {isAiLoading ? (
              <>
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-intel-cyan/20 border-t-intel-cyan rounded-full animate-spin"></div>
                  <Brain className="absolute inset-0 m-auto w-6 h-6 text-intel-cyan animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white uppercase tracking-widest">Simulating Agent Perspectives</div>
                  <p className="text-[10px] font-mono text-slate-500">Querying Gemini-3.1-Pro-Preview // Multi-Agent Orchestration</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <MessageSquare className="w-8 h-8 text-slate-600" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Awaiting Scenario Seed</div>
                  <p className="text-[10px] font-mono text-slate-600">Enter a prompt above to begin multi-agent analysis</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderBacktesting = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calibration Curve */}
        <div className="lg:col-span-7 intel-card p-6 rounded-2xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Model Calibration Curve</h3>
              <p className="text-[10px] text-slate-500 font-mono">Predicted Probability vs Actual Frequency</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Model Performance</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 border-t border-white/20 border-dashed"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Perfect Calibration</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  type="number" 
                  dataKey="predicted" 
                  name="Predicted" 
                  unit="%" 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="actual" 
                  name="Actual" 
                  unit="%" 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                />
                <ZAxis type="number" range={[100, 100]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                />
                {/* Perfect Calibration Line */}
                <Scatter 
                  data={[{ predicted: 0, actual: 0 }, { predicted: 100, actual: 100 }]} 
                  line={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '5 5' }} 
                  shape={() => null}
                />
                <Scatter name="Calibration" data={calibrationData} fill="#00f2ff" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Metrics Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="intel-card p-6 rounded-2xl border border-intel-border">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Accuracy Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Brier Score', value: '0.042', status: 'GOOD', desc: 'Lower is better' },
                { label: 'Hit Rate', value: '84%', status: 'GOOD', desc: 'Correct direction' },
                { label: 'MAE', value: '3.8%', status: 'WARNING', desc: 'Mean Absolute Error' },
                { label: 'Calibration', value: '0.92', status: 'GOOD', desc: 'Reliability index' },
              ].map((metric, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[8px] font-mono text-slate-500 uppercase">{metric.label}</div>
                  <div className={`text-xl font-bold font-mono ${metric.status === 'GOOD' ? 'text-intel-green' : 'text-intel-orange'}`}>{metric.value}</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase italic">{metric.desc}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Historical Log</h3>
            <div className="space-y-2 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
              {backtestLogs.map((log, i) => (
                <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-white">{log.date} // {log.event}</div>
                    <div className="flex items-center space-x-3 text-[8px] font-mono">
                      <span className="text-slate-500">SIM: {log.sim}%</span>
                      <span className="text-slate-500">ACTUAL: {log.actual}%</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold font-mono ${Math.abs(log.error) < 3 ? 'bg-intel-green/10 text-intel-green' : 'bg-intel-orange/10 text-intel-orange'}`}>
                    {log.error > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(log.error)}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                Log New Entry
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input id="bt-date" placeholder="Period (e.g. 2026-Q2)" 
                  className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50" />
                <input id="bt-event" placeholder="Event description" 
                  className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50" />
                <input id="bt-sim" type="number" placeholder="Simulated %" 
                  className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50" />
                <input id="bt-actual" type="number" placeholder="Actual %" 
                  className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50" />
              </div>
              <button
                onClick={() => {
                  const date = (document.getElementById('bt-date') as HTMLInputElement).value;
                  const event = (document.getElementById('bt-event') as HTMLInputElement).value;
                  const sim = parseInt((document.getElementById('bt-sim') as HTMLInputElement).value);
                  const actual = parseInt((document.getElementById('bt-actual') as HTMLInputElement).value);
                  if (!date || !event || isNaN(sim) || isNaN(actual)) return;
                  const error = actual - sim;
                  setBacktestLogs(prev => [{ date, event, sim, actual, error }, ...prev]);
                  ['bt-date','bt-event','bt-sim','bt-actual'].forEach(id => 
                    (document.getElementById(id) as HTMLInputElement).value = '');
                }}
                className="w-full py-2 bg-intel-cyan/10 border border-intel-cyan/30 rounded text-[10px] font-mono font-bold text-intel-cyan hover:bg-intel-cyan/20 transition-all uppercase tracking-wider"
              >
                + Log Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-intel-bg text-slate-200 font-sans selection:bg-intel-cyan/30">
      <BackgroundGrid />
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-8 space-y-8">
        <ModuleHeader 
          title="Simulation Intelligence" 
          subtitle="Advanced Predictive Modeling & Agent-Based Simulations" 
          icon={Cpu}
          nodeId="SIM-NODE-ALPHA"
        />
        
        <LiveTicker items={SIM_ALERTS} />
        
        {/* Sub-Tabs Navigation */}
        <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit">
          {[
            { id: 'monte-carlo', label: 'Monte Carlo', icon: BarChart3 },
            { id: 'scenario', label: 'Scenario Simulator', icon: Settings2 },
            { id: 'agent', label: 'Agent Simulation', icon: Users },
            { id: 'ai-multi', label: 'AI Multi-Agent', icon: Brain },
            { id: 'backtesting', label: 'Backtesting', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                activeTab === tab.id 
                  ? 'bg-intel-cyan text-intel-bg shadow-[0_0_15px_rgba(0,242,255,0.3)]' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Main Content Area */}
        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'monte-carlo' && renderMonteCarlo()}
              {activeTab === 'scenario' && renderScenarioSimulator()}
              {activeTab === 'agent' && renderAgentSimulation()}
              {activeTab === 'ai-multi' && renderAIMultiAgent()}
              {activeTab === 'backtesting' && renderBacktesting()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
    </div>
  );
};

export default SimulationIntelligence;
