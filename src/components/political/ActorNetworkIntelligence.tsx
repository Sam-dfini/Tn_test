import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Network, 
  Zap, 
  ShieldAlert, 
  Target, 
  MessageSquare, 
  TrendingUp,
  AlertTriangle,
  Info,
  Activity,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { ActorAlignment } from '../../services/actorNetwork';
import { generateStableKey } from '../../lib/keyUtils';

const ActorNetworkIntelligence: React.FC = () => {
  const { rriState } = useRiskMetrics();
  const { actorNetwork } = useAIAnalysis();
  const [alignmentFilter, setAlignmentFilter] = useState<ActorAlignment | 'ALL'>('ALL');

  const filteredActors = useMemo(() => {
    if (!actorNetwork) return [];
    if (alignmentFilter === 'ALL') return actorNetwork.actors;
    return actorNetwork.actors.filter(a => a.alignment === alignmentFilter);
  }, [actorNetwork, alignmentFilter]);

  if (!actorNetwork) return (
    <div className="flex items-center justify-center h-64 text-intel-cyan/50">
      <div className="animate-pulse flex flex-col items-center">
        <Network className="w-12 h-12 mb-4" />
        <p className="font-mono text-sm tracking-widest uppercase">Initializing Actor Network Analysis...</p>
      </div>
    </div>
  );

  const ociColor = actorNetwork.oci > 0.5 ? 'text-intel-red' : actorNetwork.oci > 0.3 ? 'text-intel-orange' : 'text-intel-cyan';
  const cpgColor = actorNetwork.cpgDisruptionLevel > 60 ? 'text-intel-red' : actorNetwork.cpgDisruptionLevel > 30 ? 'text-intel-orange' : 'text-intel-cyan';

  const radarData = [
    { subject: 'Opposition Unity', A: actorNetwork.oci * 100, fullMark: 100 },
    { subject: 'NGO Capacity', A: actorNetwork.ngoCapacity * 100, fullMark: 100 },
    { subject: 'CPG Disruption', A: actorNetwork.cpgDisruptionLevel, fullMark: 100 },
    { subject: 'State Suppression', A: (1 - actorNetwork.ngoCapacity) * 100, fullMark: 100 },
    { subject: 'Frame Alignment', A: 45, fullMark: 100 }, // Placeholder for now
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      <ModuleHeader 
        title="Actor Network Monitor"
        subtitle="Real-time mapping of opposition coordination, narrative capacity, and structural disruption"
        icon={Network}
        nodeId="ACTOR-NODE-01"
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-intel-black/40 border border-intel-cyan/20 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12" />
          </div>
          <h3 className="text-xs font-mono text-slate-200 uppercase tracking-widest mb-1">Opposition Coordination (OCI)</h3>
          <div className={`text-3xl font-bold font-mono ${ociColor}`}>
            {(actorNetwork.oci * 100).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-300 mt-2 leading-tight">
            Measures frame alignment and coordination capacity across opposition clusters.
          </p>
          <div className="mt-3 h-1 w-full bg-intel-cyan/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${actorNetwork.oci * 100}%` }}
              className={`h-full ${actorNetwork.oci > 0.5 ? 'bg-intel-red' : 'bg-intel-cyan'}`}
            />
          </div>
        </div>

        <div className="bg-intel-black/40 border border-intel-cyan/20 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-12 h-12" />
          </div>
          <h3 className="text-xs font-mono text-slate-200 uppercase tracking-widest mb-1">CPG Disruption Index</h3>
          <div className={`text-3xl font-bold font-mono ${cpgColor}`}>
            {actorNetwork.cpgDisruptionLevel.toFixed(1)}
          </div>
          <p className="text-[10px] text-slate-300 mt-2 leading-tight">
            Phosphate production disruption level in the Gafsa mining basin.
          </p>
          <div className="mt-3 h-1 w-full bg-intel-cyan/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${actorNetwork.cpgDisruptionLevel}%` }}
              className={`h-full ${actorNetwork.cpgDisruptionLevel > 60 ? 'bg-intel-red' : 'bg-intel-orange'}`}
            />
          </div>
        </div>

        <div className="bg-intel-black/40 border border-intel-cyan/20 p-4 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-12 h-12" />
          </div>
          <h3 className="text-xs font-mono text-slate-200 uppercase tracking-widest mb-1">NGO Narrative Capacity</h3>
          <div className="text-3xl font-bold font-mono text-intel-cyan">
            {(actorNetwork.ngoCapacity * 100).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-300 mt-2 leading-tight">
            Civil society's ability to sustain alternative narratives under state pressure.
          </p>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${actorNetwork.ngoCapacity * 100}%` }}
              className="h-full bg-cyan-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Dynamics Radar */}
        <div className="bg-intel-black/40 border border-intel-cyan/20 p-5 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-mono text-slate-200 uppercase tracking-widest flex items-center gap-2">
              <Network className="w-4 h-4" />
              Network Dynamics Radar
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#00f2ff20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Network"
                  dataKey="A"
                  stroke="#00f2ff"
                  fill="#00f2ff"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crosscutting Issues */}
        <div className="bg-intel-black/40 border border-intel-cyan/20 p-5 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-intel-cyan uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4" />
              Crosscutting Issues Salience
            </h3>
          </div>
          <div className="space-y-4">
            {actorNetwork.crosscuttingIssues.map((issue, idx) => (
              <div key={generateStableKey(issue, idx, 'issue')} className="relative">
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-300">{issue.label}</span>
                  <span className="text-slate-100">{issue.fragmentation.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${issue.fragmentation * 100}%` }}
                    className="h-full bg-cyan-500"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  {issue.affectedClusters.map((aff, affIdx) => (
                    <span key={generateStableKey(aff, affIdx, 'cluster')} className="text-[10px] px-1 bg-orange-600 text-black rounded tracking-widest uppercase font-mono">
                      {aff.cluster}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actor Profiles */}
      <div className="bg-intel-black/40 border border-intel-cyan/20 p-5 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-mono text-intel-cyan uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4" />
            Strategic Actor Profiles
          </h3>
          
          <div className="flex items-center gap-2 bg-intel-black/60 p-1 rounded-lg border border-intel-cyan/10">
            <div className="px-2 py-1 text-[8px] font-mono text-intel-cyan/40 uppercase flex items-center gap-1">
              <Filter className="w-2.5 h-2.5" />
              Filter:
            </div>
            {(['ALL', 'GOV', 'OPP', 'INTL'] as const).map((align, alignIdx) => (
              <button
                key={generateStableKey(align, alignIdx, 'align')}
                onClick={() => setAlignmentFilter(align)}
                className={`px-3 py-1 rounded text-[9px] font-mono transition-all ${
                  alignmentFilter === align 
                    ? 'bg-intel-cyan text-black font-bold' 
                    : 'text-intel-cyan/60 hover:text-intel-cyan hover:bg-intel-cyan/10'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredActors.map((actor, actorIdx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={generateStableKey(actor, actorIdx, 'actor')} 
                className={`p-3 border rounded transition-all relative overflow-hidden ${
                  actor.threatLevel === 'CRITICAL' 
                    ? 'border-intel-red/50 bg-intel-red/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                    : 'border-intel-cyan/10 bg-intel-cyan/5 hover:border-intel-cyan/30'
                }`}
              >
                {actor.threatLevel === 'CRITICAL' && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-intel-red text-black text-[9px] font-bold px-2 py-0.5 uppercase tracking-tighter transform rotate-45 translate-x-3 translate-y-1 shadow-sm">
                      Critical
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-slate-100 font-bold text-sm leading-tight">{actor.label}</span>
                    <span className="text-[8px] font-mono text-intel-cyan/40 uppercase mt-0.5">{actor.alignment}</span>
                  </div>
                  <span className={`text-[10px] px-1 rounded tracking-widest uppercase font-mono ${
                    actor.coordinationScore > 0.5 ? 'bg-intel-cyan/20 text-intel-cyan' : 
                    actor.threatLevel === 'CRITICAL' ? 'bg-intel-red/20 text-intel-red' :
                    'bg-orange-500 text-black'
                  }`}>
                    {actor.cluster}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-intel-cyan/40">REACH</span>
                      <span className="text-intel-cyan/80">{(actor.reach * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${actor.threatLevel === 'CRITICAL' ? 'bg-intel-red' : 'bg-cyan-500'}`} style={{ width: `${actor.reach * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] mb-0.5">
                      <span className="text-intel-cyan/40">ALIGNMENT</span>
                      <span className="text-intel-cyan/80">{(actor.frameAlignment * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${actor.threatLevel === 'CRITICAL' ? 'bg-intel-red' : 'bg-cyan-500'}`} style={{ width: `${actor.frameAlignment * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-intel-cyan/5">
                  <div className="text-[8px] text-intel-cyan/40 uppercase mb-1">Current Frame</div>
                  <div className="text-slate-300 text-sm leading-relaxed">"{actor.currentFrame}"</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Intelligence Assessment */}
      <div className="bg-intel-black/40 border border-intel-cyan/20 p-5 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-intel-red" />
          <h3 className="text-sm font-mono text-intel-red uppercase tracking-widest">Actor Network Assessment</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-intel-red/20 rounded">
                <AlertTriangle className="w-3 h-3 text-intel-red" />
              </div>
              <div>
                <p className="text-xs font-bold text-intel-red mb-1 tracking-tight">OCI Salience Multiplier: {(0.4 + 0.6 * actorNetwork.oci).toFixed(2)}x</p>
                <p className="text-[10px] text-intel-cyan/60 leading-relaxed">
                  The current level of opposition coordination is {actorNetwork.oci > 0.4 ? 'amplifying' : 'dampening'} the conversion of social grievances into political risk.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-intel-orange/20 rounded">
                <Zap className="w-3 h-3 text-intel-orange" />
              </div>
              <div>
                <p className="text-xs font-bold text-intel-orange mb-1 tracking-tight">CPG Cascade Risk: {actorNetwork.cpgCascadeAmplifier > 1.4 ? 'CRITICAL' : 'ELEVATED'}</p>
                <p className="text-[10px] text-intel-cyan/60 leading-relaxed">
                  Phosphate disruption in Gafsa acts as a structural amplifier for regional contagion, with a current multiplier of {actorNetwork.cpgCascadeAmplifier.toFixed(2)}x.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-intel-black/20 p-3 rounded border border-intel-cyan/5">
            <h4 className="text-[10px] font-mono text-intel-cyan/40 uppercase mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Strategic Implications
            </h4>
            <ul className="space-y-2">
              <li className="text-[10px] text-intel-cyan/80 flex gap-2">
                <span className="text-intel-cyan">•</span>
                <span>{actorNetwork.oci > 0.5 ? 'High OCI indicates imminent risk of unified mass mobilization.' : 'Low OCI suggests regime can continue to manage opposition through fragmentation.'}</span>
              </li>
              <li className="text-[10px] text-intel-cyan/80 flex gap-2">
                <span className="text-intel-cyan">•</span>
                <span>{actorNetwork.ngoCapacity < 0.4 ? 'Civil society narrative capacity is severely degraded, increasing reliance on informal networks.' : 'NGOs maintain significant ability to bridge disparate grievances into a coherent critique.'}</span>
              </li>
              <li className="text-[10px] text-intel-cyan/80 flex gap-2">
                <span className="text-intel-cyan">•</span>
                <span>{actorNetwork.cpgDisruptionLevel > 50 ? 'Economic shock from CPG is now the primary driver of fiscal instability.' : 'CPG disruption remains within manageable historical bounds.'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorNetworkIntelligence;
