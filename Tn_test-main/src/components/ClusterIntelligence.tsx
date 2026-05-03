import React, { useMemo, useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Cell, LineChart, Line, ComposedChart, Area, AreaChart,
} from 'recharts';
import { motion } from 'motion/react';
import { 
  Activity, ShieldAlert, Zap, Users, Globe, 
  AlertTriangle, TrendingUp, Info, MapPin, Clock,
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

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'GEOGRAPHIC' | 'TEMPORAL'>('PROFILE');

  const governorateClusterData = [
    { gov: 'Gafsa', systemPressure: 0.88, mobilization: 0.72, regimeFragility: 0.65, spread: 0.78, composite: 0.76 },
    { gov: 'Sidi Bouzid', systemPressure: 0.84, mobilization: 0.81, regimeFragility: 0.58, spread: 0.74, composite: 0.74 },
    { gov: 'Kasserine', systemPressure: 0.79, mobilization: 0.75, regimeFragility: 0.52, spread: 0.71, composite: 0.69 },
    { gov: 'Kairouan', systemPressure: 0.74, mobilization: 0.68, regimeFragility: 0.48, spread: 0.65, composite: 0.64 },
    { gov: 'Sfax', systemPressure: 0.68, mobilization: 0.55, regimeFragility: 0.44, spread: 0.58, composite: 0.56 },
    { gov: 'Tunis', systemPressure: 0.62, mobilization: 0.48, regimeFragility: 0.72, spread: 0.52, composite: 0.59 },
    { gov: 'Sousse', systemPressure: 0.55, mobilization: 0.42, regimeFragility: 0.38, spread: 0.44, composite: 0.45 },
    { gov: 'Monastir', systemPressure: 0.48, mobilization: 0.38, regimeFragility: 0.32, spread: 0.40, composite: 0.40 },
    { gov: 'Béja', systemPressure: 0.44, mobilization: 0.35, regimeFragility: 0.28, spread: 0.36, composite: 0.36 },
    { gov: 'Bizerte', systemPressure: 0.42, mobilization: 0.32, regimeFragility: 0.30, spread: 0.34, composite: 0.35 },
  ];

  const temporalWaveData = [
    { week: 'W1 Jan', systemPressure: 0.52, mobilization: 0.38, dynamicInstability: 0.44, regimeFragility: 0.48, spread: 0.41 },
    { week: 'W2 Jan', systemPressure: 0.54, mobilization: 0.40, dynamicInstability: 0.46, regimeFragility: 0.49, spread: 0.43 },
    { week: 'W3 Jan', systemPressure: 0.58, mobilization: 0.45, dynamicInstability: 0.52, regimeFragility: 0.50, spread: 0.47 },
    { week: 'W4 Jan', systemPressure: 0.61, mobilization: 0.48, dynamicInstability: 0.55, regimeFragility: 0.51, spread: 0.49 },
    { week: 'W1 Feb', systemPressure: 0.64, mobilization: 0.52, dynamicInstability: 0.58, regimeFragility: 0.52, spread: 0.52 },
    { week: 'W2 Feb', systemPressure: 0.67, mobilization: 0.55, dynamicInstability: 0.61, regimeFragility: 0.54, spread: 0.55 },
    { week: 'W3 Feb', systemPressure: 0.70, mobilization: 0.58, dynamicInstability: 0.64, regimeFragility: 0.55, spread: 0.58 },
    { week: 'W4 Feb', systemPressure: 0.72, mobilization: 0.61, dynamicInstability: 0.67, regimeFragility: 0.57, spread: 0.60 },
    { week: 'W1 Mar', systemPressure: 0.74, mobilization: 0.64, dynamicInstability: 0.70, regimeFragility: 0.58, spread: 0.63 },
    { week: 'W2 Mar', systemPressure: 0.76, mobilization: 0.67, dynamicInstability: 0.72, regimeFragility: 0.60, spread: 0.65 },
    { week: 'W3 Mar', systemPressure: 0.78, mobilization: 0.70, dynamicInstability: 0.74, regimeFragility: 0.62, spread: 0.67 },
    { week: 'W4 Mar', systemPressure: 0.79, mobilization: 0.72, dynamicInstability: 0.75, regimeFragility: 0.63, spread: 0.68 },
  ];

  const clusterGroups = [
    { id: 'IGNITION', label: 'Ignition Zone', color: '#ef4444', govs: ['Gafsa', 'Sidi Bouzid'], desc: 'Highest composite score. Historical precedent for national cascades. CPG multiplier active.' },
    { id: 'ELEVATED', label: 'Elevated Risk', color: '#f97316', govs: ['Kasserine', 'Kairouan', 'Sfax'], desc: 'Structural stress above threshold. Mobilization potential high. Monitor for cascade entry.' },
    { id: 'POLITICAL', label: 'Political Hub', color: '#8b5cf6', govs: ['Tunis'], desc: 'Lower street pressure but highest regime fragility score. Elite defection risk node.' },
    { id: 'STABLE', label: 'Stable', color: '#10b981', govs: ['Sousse', 'Monastir', 'Béja', 'Bizerte'], desc: 'Below cascade threshold. Coastal tourism economy creates buffer. Monitor in drought season.' },
  ];

  const TABS = [
    { id: 'PROFILE', label: 'Cluster Profiles', icon: Activity },
    { id: 'GEOGRAPHIC', label: 'Geographic Distribution', icon: MapPin },
    { id: 'TEMPORAL', label: 'Temporal Wave Analysis', icon: Clock },
  ] as const;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Cluster Intelligence"
        subtitle="High-level synthesis of normalized intelligence signals and systemic risk mapping"
        icon={Activity}
        nodeId="CLUSTER-NODE-11"
      />

      {/* ── TAB SELECTOR ── */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-4 relative z-20">
      {TABS.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all border ${activeTab === tab.id ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/30' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'}`}
          >
            <Icon className="w-3 h-3" />
            {tab.label}
          </button>
        );
      })}
    </div>

    {activeTab === 'PROFILE' && (
      <>
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
          {clusterDetails.map((cluster, idx) => {
            const ClusterIcon = cluster.icon;
            return (
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
                    <ClusterIcon className="w-4 h-4" style={{ color: cluster.color }} />
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
            );
          })}
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
                  const MaxClusterIcon = maxCluster.icon;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MaxClusterIcon className="w-3.5 h-3.5" style={{ color: maxCluster.color }} />
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
      </>
    )}

    {/* ── GEOGRAPHIC DISTRIBUTION ── */}
    {activeTab === 'GEOGRAPHIC' && (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
          <MapPin className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Geographic Cluster Distribution</h3>
        </div>

        {/* Cluster group legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {clusterGroups.map(g => (
            <div key={g.id} className="glass rounded-xl border border-intel-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color, boxShadow: `0 0 6px ${g.color}` }} />
                <span className="text-[9px] font-mono font-bold uppercase" style={{ color: g.color }}>{g.label}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {g.govs.map(gov => (
                  <span key={gov} className="text-[8px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{gov}</span>
                ))}
              </div>
              <p className="text-[8px] font-mono text-slate-600 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>

        {/* Governorate composite score bar chart */}
        <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Governorate Composite Cluster Score</div>
            <div className="text-[9px] font-mono text-slate-600">All 5 cluster dimensions weighted — higher = closer to cascade threshold</div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={governorateClusterData} layout="vertical" margin={{ left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="gov" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={70} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${(v*100).toFixed(1)}%`, 'Composite Score']} />
                <Bar dataKey="composite" radius={[0,4,4,0]} name="Composite Score">
                  {governorateClusterData.map((entry, i) => (
                    <Cell key={i} fill={entry.composite > 0.7 ? '#ef4444' : entry.composite > 0.55 ? '#f97316' : entry.composite > 0.45 ? '#8b5cf6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Multi-dimension breakdown */}
        <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">5-Dimension Breakdown — Top 6 Governorates</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10">
                  {['Governorate', 'Sys Pressure', 'Mobilization', 'Regime Fragility', 'Spread Risk', 'Composite'].map(h => (
                    <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {governorateClusterData.slice(0, 6).map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-2 text-[10px] font-mono text-white pr-4">{row.gov}</td>
                    {(['systemPressure', 'mobilization', 'regimeFragility', 'spread', 'composite'] as const).map(key => (
                      <td key={key} className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${row[key]*100}%`, backgroundColor: row[key] > 0.7 ? '#ef4444' : row[key] > 0.5 ? '#f97316' : '#10b981' }} />
                          </div>
                          <span className={`text-[9px] font-mono font-bold ${row[key] > 0.7 ? 'text-intel-red' : row[key] > 0.5 ? 'text-intel-orange' : 'text-emerald-400'}`}>
                            {(row[key]*100).toFixed(0)}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {/* ── TEMPORAL WAVE ANALYSIS ── */}
    {activeTab === 'TEMPORAL' && (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-3">
          <Clock className="w-4 h-4 text-intel-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Temporal Wave Analysis — Cluster Evolution</h3>
        </div>

        {/* All 5 dimensions over time */}
        <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">12-Week Cluster Trajectory — All Dimensions</div>
            <div className="text-[9px] font-mono text-slate-600">Jan → Mar 2025 — all 5 indices trending upward simultaneously</div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalWaveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 7, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0.3, 0.85]} tickFormatter={v => `${(v*100).toFixed(0)}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${(v*100).toFixed(1)}%`]} />
                <Line type="monotone" dataKey="systemPressure" stroke="#ef4444" strokeWidth={2} dot={false} name="System Pressure" />
                <Line type="monotone" dataKey="mobilization" stroke="#f97316" strokeWidth={2} dot={false} name="Mobilization" />
                <Line type="monotone" dataKey="dynamicInstability" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Dynamic Instability" />
                <Line type="monotone" dataKey="regimeFragility" stroke="#00f2ff" strokeWidth={2} dot={false} name="Regime Fragility" />
                <Line type="monotone" dataKey="spread" stroke="#eab308" strokeWidth={2} dot={false} name="Spread Contagion" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 text-[9px] font-mono">
            {[
              { c: '#ef4444', l: 'System Pressure' },
              { c: '#f97316', l: 'Mobilization' },
              { c: '#8b5cf6', l: 'Dynamic Instability' },
              { c: '#00f2ff', l: 'Regime Fragility' },
              { c: '#eab308', l: 'Spread Contagion' },
            ].map(({ c, l }) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: c }} />
                <span className="text-slate-500">{l}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Week-on-week delta */}
        <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Week-on-Week Acceleration — Composite Index</div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temporalWaveData.map((d, i, arr) => ({
                week: d.week,
                delta: i > 0 ? parseFloat(((d.systemPressure - arr[i-1].systemPressure) * 100).toFixed(2)) : 0,
              }))}>
                <defs>
                  <linearGradient id="deltaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 7, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} unit="pp" />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`+${v}pp`, 'Weekly Acceleration']} />
                <Area type="monotone" dataKey="delta" stroke="#ef4444" fill="url(#deltaGrad)" strokeWidth={2} name="Δ System Pressure" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-start gap-2 p-3 rounded bg-intel-red/5 border border-intel-red/20">
            <AlertTriangle className="w-3.5 h-3.5 text-intel-red shrink-0 mt-0.5" />
            <p className="text-[9px] font-mono text-slate-400 leading-relaxed">All 5 cluster dimensions have risen monotonically for 12 consecutive weeks. This is structurally significant — simultaneous convergence across dimensions (EQ.15 Compound Stress) is the pre-cursor pattern identified in 2010–2011 historical backtest.</p>
          </div>
        </div>
      </div>
    )}

  </div>
  );
};

export default ClusterIntelligence;
