import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Cell
} from 'recharts';
import { motion } from 'motion/react';
import { 
  Activity, ShieldAlert, Zap, Users, Globe, 
  AlertTriangle, TrendingUp, Info
} from 'lucide-react';
import { BackgroundGrid, ModuleHeader } from './ProfessionalShared';
import { usePipeline } from '../context/PipelineContext';
import { computeClusters, Signals } from '../services/clusters';

export const ClusterIntelligence: React.FC = () => {
  const { rriState } = usePipeline();

  // Map RRIState to Signals for the Cluster Layer
  const signals = useMemo((): Signals => {
    if (!rriState) {
      return {
        structuralRisk: 0, systemStress: 0, mobilization: 0,
        protestDynamics: 0, eliteInstability: 0, acceleration: 0,
        spatialRisk: 0, informationPressure: 0, shockImpact: 0,
        historicalAlignment: 0
      };
    }

    return {
      structuralRisk: Math.min(1, rriState.rri / 5),
      systemStress: rriState.compound_stress || 0,
      mobilization: rriState.salience || 0,
      protestDynamics: rriState.sir_infected || 0,
      eliteInstability: rriState.elite_defection_prob || 0,
      acceleration: Math.min(1, Math.abs(rriState.velocity || 0) * 2),
      spatialRisk: rriState.cascade_probability || 0,
      informationPressure: Math.max(0, Math.min(1, (rriState.info_amplification - 0.5) / 1.5)),
      shockImpact: Math.min(1, Math.abs(rriState.stochastic_shock || 0) * 10),
      historicalAlignment: rriState.pattern_similarity || 0,
    };
  }, [rriState]);

  const clusters = useMemo(() => computeClusters(signals), [signals]);

  const radarData = [
    { subject: 'System Pressure', A: clusters.systemPressure, fullMark: 1 },
    { subject: 'Mobilization', A: clusters.mobilizationPotential, fullMark: 1 },
    { subject: 'Dynamic Instability', A: clusters.dynamicInstability, fullMark: 1 },
    { subject: 'Regime Fragility', A: clusters.regimeFragility, fullMark: 1 },
    { subject: 'Spread & Contagion', A: clusters.spreadContagion, fullMark: 1 },
  ];

  const clusterDetails = [
    { 
      id: 'systemPressure', 
      label: 'System Pressure', 
      value: clusters.systemPressure, 
      icon: Activity, 
      color: '#ef4444',
      description: 'Underlying structural strain and systemic stress levels.'
    },
    { 
      id: 'mobilizationPotential', 
      label: 'Mobilization Potential', 
      value: clusters.mobilizationPotential, 
      icon: Users, 
      color: '#f97316',
      description: 'The capacity and readiness of the population to organize and protest.'
    },
    { 
      id: 'dynamicInstability', 
      label: 'Dynamic Instability', 
      value: clusters.dynamicInstability, 
      icon: Zap, 
      color: '#3b82f6',
      description: 'Rate of change and impact of unpredictable shocks.'
    },
    { 
      id: 'regimeFragility', 
      label: 'Regime Fragility', 
      value: clusters.regimeFragility, 
      icon: ShieldAlert, 
      color: '#a855f7',
      description: 'Probability of the regime losing control over elite and street dynamics.'
    },
    { 
      id: 'spreadContagion', 
      label: 'Spread & Contagion', 
      value: clusters.spreadContagion, 
      icon: Globe, 
      color: '#eab308',
      description: 'Risk of geographic propagation and historical pattern alignment.'
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Cluster Intelligence"
        subtitle="High-level synthesis of normalized intelligence signals and systemic risk mapping"
        icon={Activity}
        nodeId="CLUSTER-NODE-11"
      />

      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-20">
        {/* Radar Chart */}
        <div className="glass p-6 rounded-2xl border border-intel-border relative overflow-hidden h-[450px]">
          <div className="absolute top-4 left-6 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-intel-cyan" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Cluster Profile</span>
          </div>
          
          <div className="w-full h-full pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 1]} 
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Intelligence"
                  dataKey="A"
                  stroke="#00f2ff"
                  fill="#00f2ff"
                  fillOpacity={0.2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#020617', 
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ color: '#00f2ff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cluster Breakdown List */}
        <div className="space-y-3">
          {clusterDetails.map((cluster, idx) => (
            <motion.div
              key={cluster.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-4 rounded-xl border border-intel-border hover:border-intel-cyan/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-black/40 border border-intel-border group-hover:border-intel-cyan/20 transition-colors">
                    <cluster.icon className="w-4 h-4" style={{ color: cluster.color }} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">{cluster.label}</div>
                    <div className="text-[9px] text-slate-500 line-clamp-1">{cluster.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono" style={{ color: cluster.color }}>
                    {(cluster.value * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-intel-border/30">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${cluster.value * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cluster.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass p-6 rounded-2xl border border-intel-border space-y-4">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-intel-cyan" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Intelligence Synthesis</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-white uppercase border-b border-intel-border pb-2">Primary Risk Driver</h4>
              <div className="p-3 rounded-xl bg-black/40 border border-intel-border">
                {(() => {
                  const maxCluster = [...clusterDetails].sort((a, b) => b.value - a.value)[0];
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <maxCluster.icon className="w-3.5 h-3.5" style={{ color: maxCluster.color }} />
                        <span className="text-[10px] font-bold text-white uppercase">{maxCluster.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        The current system state is primarily driven by <span className="text-white font-bold">{maxCluster.label}</span>, 
                        indicating that {maxCluster.description.toLowerCase()} is the dominant factor in the RRI calculation.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-white uppercase border-b border-intel-border pb-2">System Stability Assessment</h4>
              <div className="p-3 rounded-xl bg-black/40 border border-intel-border">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className={`w-3.5 h-3.5 ${clusters.volatility > 0.2 ? 'text-intel-red' : 'text-intel-cyan'}`} />
                    <span className="text-[10px] font-bold text-white uppercase">
                      {clusters.volatility > 0.2 ? 'High Volatility' : 'Stable Imbalance'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Volatility is at <span className="text-white font-bold">{(clusters.volatility * 100).toFixed(1)}%</span>. 
                    {clusters.volatility > 0.2 
                      ? " Significant variance across clusters suggests a highly unstable and unpredictable system trajectory."
                      : " Low variance indicates a synchronized deterioration across all intelligence dimensions."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-intel-border flex flex-col justify-center items-center text-center space-y-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-intel-border"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={364.4}
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 * (1 - clusters.intelligenceScore) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-intel-cyan"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-white">{(clusters.intelligenceScore * 100).toFixed(0)}</span>
              <span className="text-[8px] font-mono text-slate-500 uppercase">RRI Score</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-white uppercase">Intelligence Confidence</div>
            <div className="text-[9px] font-mono text-slate-500">Based on 10 normalized signals</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClusterIntelligence;
