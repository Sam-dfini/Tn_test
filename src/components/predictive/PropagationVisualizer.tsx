import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  History, 
  TrendingUp, 
  ChevronRight,
  Info,
  Play,
  RotateCcw,
  Map as MapIcon,
  Activity
} from 'lucide-react';
import governorateData from '../../data/governorates.json';
import { generateStableKey, prepareList } from '../../lib/keyUtils';
import { 
  simulatePropagation, 
  HISTORICAL_WAVES, 
  compareToHistorical,
  PropagationResult,
  PropagationNode
} from '../../services/propagationEngine';
import { Map } from '../shared/Map';
import { Governorate } from '../../types/intel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

// ── Types ─────────────────────────────────────────────────────

interface PropagationVisualizerProps {
  originId?: string;
  originName?: string;
  cascadeProbability?: number;
  activeEventTitle?: string;
  onClose?: () => void;
}

// ── Component ──────────────────────────────────────────────────

export const PropagationVisualizer: React.FC<PropagationVisualizerProps> = ({
  originId = 'sidi_bouzid',
  originName = 'Sidi Bouzid',
  cascadeProbability = 0.65,
  activeEventTitle,
  onClose
}) => {
  const [maxDays, setMaxDays] = useState(21);
  const [simulation, setSimulation] = useState<PropagationResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<PropagationNode | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'map' | 'sir'>('graph');
  const [historicalMatches, setHistoricalMatches] = useState<Array<{ name: string, score: number }>>([]);

  // ── Simulation logic ─────────────────────────────────────────

  useEffect(() => {
    const govs = governorateData.governorates;
    const graph = governorateData.adjacency_graph as Record<string, string[]>;

    const result = simulatePropagation(
      originId,
      originName,
      graph,
      govs,
      cascadeProbability,
      maxDays,
      activeEventTitle
    );

    setSimulation(result);

    // Compare to historical patterns
    const matches = HISTORICAL_WAVES.map(wave => ({
      name: wave.name,
      score: compareToHistorical(result, wave)
    })).sort((a, b) => b.score - a.score);

    setHistoricalMatches(matches);
  }, [originId, originName, cascadeProbability, maxDays, activeEventTitle]);

  // ── Derived data ─────────────────────────────────────────────

  const nodesByDay = useMemo(() => {
    if (!simulation) return [];
    const days: Record<number, PropagationNode[]> = {};
    Object.values(simulation.nodes).forEach(node => {
      const d = Math.floor(node.expectedDays);
      if (!days[d]) days[d] = [];
      days[d].push(node);
    });
    return Object.entries(days)
      .map(([day, nodes]) => ({ day: parseInt(day), nodes }))
      .sort((a, b) => a.day - b.day);
  }, [simulation]);

  const stats = useMemo(() => {
    if (!simulation) return null;
    const nodes = Object.values(simulation.nodes);
    const reachable = nodes.filter(n => n.status !== 'unreachable');
    const highRisk = nodes.filter(n => n.status === 'high');
    
    return {
      totalReachable: reachable.length,
      highRiskCount: highRisk.length,
      avgProbability: reachable.reduce((acc, n) => acc + n.probability, 0) / (reachable.length || 1),
      maxDays: Math.max(...reachable.map(n => n.expectedDays), 0)
    };
  }, [simulation]);

  const simulatedGovernorates = useMemo(() => {
    if (!simulation) return governorateData.governorates as Governorate[];
    
    return (governorateData.governorates as Governorate[]).map(gov => {
      const node = simulation.nodes[gov.id];
      if (!node) return gov;

      let risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'ALERT' = 'LOW';
      if (node.status === 'origin') risk_level = 'ALERT';
      else if (node.status === 'high') risk_level = 'HIGH';
      else if (node.status === 'medium') risk_level = 'MEDIUM';
      
      return {
        ...gov,
        risk_level
      };
    });
  }, [simulation]);

  // ── Helper ───────────────────────────────────────────────────

  const getStatusColor = (status: PropagationNode['status']) => {
    switch (status) {
      case 'origin': return 'bg-red-600 text-white border-red-800';
      case 'high': return 'bg-orange-500 text-white border-orange-700';
      case 'medium': return 'bg-yellow-500 text-black border-yellow-600';
      case 'low': return 'bg-blue-500 text-white border-blue-700';
      default: return 'bg-gray-200 text-gray-500 border-gray-300';
    }
  };

  const getStatusLabel = (status: PropagationNode['status']) => {
    switch (status) {
      case 'origin': return 'Epicenter';
      case 'high': return 'High Risk (>60%)';
      case 'medium': return 'Medium Risk (30-60%)';
      case 'low': return 'Low Risk (5-30%)';
      default: return 'Unlikely';
    }
  };

  // ── Render ───────────────────────────────────────────────────

  if (!simulation) return null;

  return (
    <div className="flex flex-col min-h-[1200px] bg-[#0a0a0a] text-white border border-white/10 rounded-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-950/20 to-transparent">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-red-500" />
              <span className="text-xs font-mono uppercase tracking-widest text-red-500/80">
                Cascade Prediction Engine
              </span>
            </div>
            <h2 className="text-2xl font-light tracking-tight">
              Propagation Simulation: <span className="text-red-400">{originName}</span>
            </h2>
            {activeEventTitle && (
              <p className="text-sm text-gray-400 mt-1 italic">
                Trigger: {activeEventTitle}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'map' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2">
                <MapIcon className="w-3.5 h-3.5" />
                Map View
              </div>
            </button>
            <button 
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'graph' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5" />
                Graph View
              </div>
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'timeline' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Timeline
              </div>
            </button>
            <button 
              onClick={() => setViewMode('sir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'sir' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                SIR Dynamics
              </div>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Cascade Prob.</div>
            <div className="text-xl font-mono text-red-400">{(cascadeProbability * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Reachable Govs</div>
            <div className="text-xl font-mono text-white">{stats?.totalReachable} / 24</div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">High Risk Epicenters</div>
            <div className="text-xl font-mono text-orange-400">{stats?.highRiskCount}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Simulation Window</div>
            <div className="text-xl font-mono text-blue-400">{maxDays} Days</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Visualization */}
        <div className="flex-1 relative overflow-hidden bg-black/40">
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <Map 
                  governorates={simulatedGovernorates} 
                  events={[]} 
                  activeLayer="Political" 
                  focusedGovId={selectedNode?.governorateId}
                  onSelectGovernorate={(gov) => {
                    const node = simulation.nodes[gov.id];
                    if (node) setSelectedNode(node);
                  }}
                />
              </motion.div>
            ) : viewMode === 'graph' ? (
              <motion.div 
                key="graph"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full p-8 overflow-y-auto relative"
              >
                {/* Visual connection lines (simulated) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  {Object.values(simulation.nodes).filter(n => n.status !== 'unreachable').map((node, i, arr) => {
                    if (i === 0) return null;
                    const prev = arr[i - 1];
                    // Just drawing some abstract lines for visual effect
                    return (
                      <motion.line 
                        key={`line-${node.governorateId}`}
                        x1={`${20 + (i % 3) * 30}%`} 
                        y1={`${10 + i * 5}%`} 
                        x2={`${20 + ((i-1) % 3) * 30}%`} 
                        y2={`${10 + (i-1) * 5}%`}
                        stroke={node.status === 'high' ? '#f97316' : '#3b82f6'} 
                        strokeWidth="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, delay: i * 0.1 }}
                      />
                    );
                  })}
                </svg>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                  {prepareList(Object.values(simulation.nodes)
                    .filter(n => n.status !== 'unreachable')
                    .sort((a, b) => a.expectedDays - b.expectedDays))
                    .map((node: any, idx: number) => (
                      <motion.div
                        key={generateStableKey(node.governorateId, idx, 'node')}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                          delay: idx * 0.1 
                        }}
                        onClick={() => setSelectedNode(node)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                          selectedNode?.governorateId === node.governorateId 
                            ? 'border-white bg-white/10 ring-1 ring-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(node.status)}`}>
                            {node.status === 'origin' ? 'Origin' : `Day ${node.expectedDays}`}
                          </div>
                          <div className="text-xs font-mono text-gray-400">
                            {(node.probability * 100).toFixed(0)}%
                          </div>
                        </div>
                        <h3 className="text-lg font-medium">{node.governorateName}</h3>
                        <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${node.probability * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 + idx * 0.1, ease: "easeOut" }}
                            className={`h-full absolute left-0 top-0 ${node.status === 'high' ? 'bg-orange-500' : node.status === 'origin' ? 'bg-red-500' : 'bg-blue-500'}`}
                          />
                          {/* Pulse effect for high risk */}
                          {node.status === 'high' && (
                            <motion.div
                              animate={{ opacity: [0.2, 0.8, 0.2] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30"
                              style={{ left: `calc(${node.probability * 100}% - 2rem)` }}
                            />
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            ) : viewMode === 'timeline' ? (
              <motion.div 
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full p-8 overflow-y-auto"
              >
                <div className="relative border-l border-white/10 ml-4 pl-8 space-y-12">
                  {prepareList(nodesByDay).map((dayGroup: any, idx: number) => (
                    <motion.div 
                      key={generateStableKey(dayGroup, idx, 'day-group')} 
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                    >
                      {/* Day marker */}
                      <motion.div 
                        className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: idx * 0.2 + 0.1 }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </motion.div>
                      <div className="mb-4">
                        <h3 className="text-xl font-mono text-white">Day {dayGroup.day}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Potential Activation Window</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {prepareList(dayGroup.nodes).map((node: any, nodeIdx: number) => (
                          <motion.div 
                            key={generateStableKey(node, nodeIdx, 'node-item')}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.2 + 0.2 + nodeIdx * 0.05 }}
                            onClick={() => setSelectedNode(node)}
                            className={`px-4 py-2 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-all ${selectedNode?.governorateId === node.governorateId ? 'ring-1 ring-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${node.status === 'high' ? 'bg-orange-500 animate-pulse' : node.status === 'origin' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              <span className="text-sm font-medium">{node.governorateName}</span>
                              <span className="text-[10px] font-mono text-gray-500">{(node.probability * 100).toFixed(0)}%</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : viewMode === 'sir' ? (
              <motion.div 
                key="sir"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full p-8 flex flex-col"
              >
                <div className="mb-6">
                  <h3 className="text-xl font-light text-white mb-2">SIR Protest Spread Dynamics (EQ.4)</h3>
                  <p className="text-sm text-gray-400">
                    Epidemic-style model tracking the transition of the population between Susceptible (S), 
                    Infected/Protesting (I), and Recovered/Repressed (R) states over the simulation window.
                  </p>
                </div>
                
                <div className="flex-1 min-h-[300px] bg-white/5 border border-white/10 rounded-xl p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simulation.sirData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#ffffff60" 
                        tick={{ fill: '#ffffff60', fontSize: 12 }}
                        tickFormatter={(val) => `Day ${val}`}
                      />
                      <YAxis 
                        stroke="#ffffff60" 
                        tick={{ fill: '#ffffff60', fontSize: 12 }}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        domain={[0, 1]}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line 
                        key="sir-line-s"
                        type="monotone" 
                        dataKey="S" 
                        name="Susceptible" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        key="sir-line-i"
                        type="monotone" 
                        dataKey="I" 
                        name="Protesting (Infected)" 
                        stroke="#ef4444" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        key="sir-line-r"
                        type="monotone" 
                        dataKey="R" 
                        name="Recovered/Repressed" 
                        stroke="#22c55e" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="text-blue-400 text-sm font-bold mb-1">Susceptible (S)</div>
                    <div className="text-xs text-gray-400">Population vulnerable to mobilization but not yet active.</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="text-red-400 text-sm font-bold mb-1">Protesting (I)</div>
                    <div className="text-xs text-gray-400">Actively mobilized population spreading the movement.</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-green-400 text-sm font-bold mb-1">Recovered (R)</div>
                    <div className="text-xs text-gray-400">Population that has exited the protest cycle (exhaustion/repression).</div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Right: Analysis Sidebar */}
        <div className="w-96 border-l border-white/10 bg-black/60 p-6 overflow-y-auto">
          {/* Historical Pattern Match */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400">Historical Pattern Match</h3>
            </div>
            <div className="space-y-3">
              {prepareList(historicalMatches).map((match: any, i: number) => (
                <div key={generateStableKey(match, i, 'hist-match')} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium truncate pr-2">{match.name}</span>
                    <span className="text-xs font-mono text-blue-400">{(match.score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${match.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIR Analysis Insights */}
          {viewMode === 'sir' && simulation.sirData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400">SIR Model Insights</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Peak Mobilization</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-xl font-mono text-white">
                      Day {simulation.sirData.reduce((prev, curr) => prev.I > curr.I ? prev : curr).day}
                    </div>
                    <div className="text-xs text-red-400">
                      ({(Math.max(...simulation.sirData.map(d => d.I)) * 100).toFixed(1)}% of pop.)
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Reach (R at End)</div>
                  <div className="text-xl font-mono text-green-400">
                    {(simulation.sirData[simulation.sirData.length - 1].R * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <div className="text-[10px] text-gray-500 leading-relaxed italic">
                    Simulation based on {simulation.activeEvent || 'unspecified trigger'} with a cascade probability of {(simulation.cascadeProbability * 100).toFixed(1)}%.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Node Detail */}
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.governorateId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 rounded-xl bg-white/5 border border-white/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium">{selectedNode.governorateName}</h3>
                  <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Risk Status</div>
                    <div className={`text-sm font-medium ${selectedNode.status === 'high' ? 'text-orange-400' : selectedNode.status === 'origin' ? 'text-red-400' : 'text-blue-400'}`}>
                      {getStatusLabel(selectedNode.status)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Propagation Path</div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {prepareList(selectedNode.path).map((step: any, i: number) => (
                        <React.Fragment key={generateStableKey(step, i, 'step')}>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">{step}</span>
                          {i < selectedNode.path.length - 1 && <ChevronRight className="w-3 h-3 text-gray-600" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <p>
                        Simulation predicts activation in {selectedNode.governorateName} within {selectedNode.expectedDays} days of the origin event, 
                        with a structural similarity score of {((selectedNode.probability / cascadeProbability) * 100).toFixed(0)}% to the epicenter.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
                <MapIcon className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">Select a governorate to view deep propagation analysis</p>
              </div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400">Simulation Window</h3>
              <span className="text-xs font-mono text-white">{maxDays} Days</span>
            </div>
            <input 
              type="range" 
              min="7" 
              max="60" 
              value={maxDays} 
              onChange={(e) => setMaxDays(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono">
              <span>1 WEEK</span>
              <span>2 MONTHS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>ORIGIN</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span>HIGH RISK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>MEDIUM RISK</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>LOW RISK</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-all border border-white/10"
          >
            Close Analysis
          </button>
          <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-all flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Export Forecast
          </button>
        </div>
      </div>
    </div>
  );
};
