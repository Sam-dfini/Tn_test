import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldAlert, 
  MessageSquare,
  Globe,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePipeline } from '../../context/PipelineContext';

const movementData = [
  {
    id: 'm1',
    name: 'National Coordination of Unemployed Graduates',
    type: 'ECONOMIC',
    strength: 0.78,
    momentum: 'UP',
    hotspots: ['Kasserine', 'Sidi Bouzid', 'Gafsa'],
    demands: ['Public sector employment', 'Regional development funds', 'End to austerity'],
    lastAction: 'Sit-in at Gafsa Phosphate Company (CPG)',
    rriImpact: '+0.12',
    riskLevel: 'HIGH',
    description: 'Highly organized network of educated but unemployed youth. Historically the spark for larger unrest. Currently mobilizing around CPG production sites.',
    actors: ['Local youth committees', 'Leftist student unions'],
  },
  {
    id: 'm2',
    name: 'Save the Judiciary Front',
    type: 'INSTITUTIONAL',
    strength: 0.62,
    momentum: 'STABLE',
    hotspots: ['Tunis (Palais de Justice)', 'Sousse'],
    demands: ['Independence of the CSM', 'Reinstatement of dismissed judges', 'Repeal of Decree 35'],
    lastAction: 'National strike of judges (2-day)',
    rriImpact: '+0.05',
    riskLevel: 'MEDIUM',
    description: 'Coalition of judges and legal professionals protesting executive interference in the judiciary. High international visibility but limited mass mobilization.',
    actors: ['Association of Tunisian Judges (AMT)', 'Young Lawyers Association'],
  },
  {
    id: 'm3',
    name: 'Bread & Dignity (Informal)',
    type: 'SOCIAL',
    strength: 0.85,
    momentum: 'UP',
    hotspots: ['Tunis (Ettadhamen)', 'Sfax', 'Bizerte'],
    demands: ['Subsidized bread availability', 'Price controls', 'End to water shortages'],
    lastAction: 'Spontaneous night riots in Ettadhamen',
    rriImpact: '+0.18',
    riskLevel: 'CRITICAL',
    description: 'Organic, non-hierarchical movement driven by food insecurity and inflation. Hardest to predict and most prone to escalation into violence.',
    actors: ['Neighborhood youth', 'Informal sector workers'],
  },
  {
    id: 'm4',
    name: 'Environmental Justice Network',
    type: 'ENVIRONMENTAL',
    strength: 0.45,
    momentum: 'STABLE',
    hotspots: ['Sfax (Agareb)', 'Gabes'],
    demands: ['Closure of toxic landfills', 'Water rights', 'Industrial pollution control'],
    lastAction: 'Roadblock in Gabes industrial zone',
    rriImpact: '+0.03',
    riskLevel: 'LOW',
    description: 'Focuses on localized environmental crises. Often triggers regional strikes that disrupt industrial output.',
    actors: ['Local environmental NGOs', 'Affected residents'],
  },
];

const governorateRisks = [
  { name: 'Tunis', risk: 85, trend: 'up', activeMovements: 12, primaryDriver: 'Political' },
  { name: 'Sidi Bouzid', risk: 92, trend: 'up', activeMovements: 8, primaryDriver: 'Economic' },
  { name: 'Kasserine', risk: 88, trend: 'stable', activeMovements: 6, primaryDriver: 'Economic' },
  { name: 'Gafsa', risk: 94, trend: 'up', activeMovements: 15, primaryDriver: 'Resource' },
  { name: 'Sfax', risk: 78, trend: 'up', activeMovements: 10, primaryDriver: 'Social' },
  { name: 'Sousse', risk: 62, trend: 'down', activeMovements: 4, primaryDriver: 'Political' },
];

export const CivilMovements: React.FC = () => {
  const { rriState } = usePipeline();
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');

  const filteredMovements = movementData.filter(m => filter === 'ALL' || m.type === filter);

  const stats = [
    { label: 'Active Protest Clusters', value: 24, icon: Activity, color: 'text-intel-cyan' },
    { label: 'Avg. Protest Frequency', value: '3.2/day', icon: Zap, color: 'text-intel-orange' },
    { label: 'Mobilization Potential', value: 'HIGH', icon: TrendingUp, color: 'text-intel-red' },
    { label: 'Critical Hotspots', value: 4, icon: MapPin, color: 'text-intel-red' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="intel-card p-6 rounded-2xl border border-intel-border flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={cn("text-2xl font-bold font-mono", stat.color)}>{stat.value}</div>
              </div>
              <stat.icon className={cn("w-5 h-5 opacity-20", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Movement List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between glass p-4 rounded-2xl border border-intel-border">
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Movement Dossiers</h3>
              <div className="flex items-center space-x-2">
                {['ALL', 'ECONOMIC', 'SOCIAL', 'INSTITUTIONAL'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "px-2 py-1 rounded text-[8px] font-mono uppercase tracking-widest transition-all",
                      filter === t ? "bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Search className="w-4 h-4 text-slate-500" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMovements.map((movement, i) => (
              <motion.div 
                key={movement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedMovement(selectedMovement === movement.id ? null : movement.id)}
                className={cn(
                  "intel-card p-6 rounded-2xl border transition-all cursor-pointer group",
                  selectedMovement === movement.id ? "border-intel-cyan/50 bg-intel-cyan/5" : "border-intel-border hover:border-white/20"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-bold text-white tracking-tight uppercase">{movement.name}</h4>
                      <span className={cn(
                        "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold",
                        movement.riskLevel === 'CRITICAL' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                        movement.riskLevel === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                        "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                      )}>
                        {movement.riskLevel}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center"><Activity className="w-3 h-3 mr-1" /> {movement.type}</span>
                      <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> {movement.momentum}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">RRI Impact</div>
                    <div className="text-lg font-bold font-mono text-intel-red">{movement.rriImpact}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {movement.hotspots.map(h => (
                    <span key={h} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-slate-400 flex items-center">
                      <MapPin className="w-2 h-2 mr-1 text-intel-cyan" /> {h}
                    </span>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedMovement === movement.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-4 border-t border-white/10 mt-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest">Strategic Context</h5>
                          <p className="text-xs text-slate-300 leading-relaxed">{movement.description}</p>
                          <div className="space-y-1">
                            <h6 className="text-[9px] font-bold text-slate-500 uppercase">Primary Demands</h6>
                            <ul className="space-y-1">
                              {movement.demands.map((d, i) => (
                                <li key={i} className="text-[10px] text-slate-400 flex items-center">
                                  <ChevronRight className="w-3 h-3 mr-1 text-intel-cyan" /> {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Last Significant Action</span>
                              <Clock className="w-3 h-3 text-slate-500" />
                            </div>
                            <p className="text-[10px] text-intel-cyan font-bold">{movement.lastAction}</p>
                          </div>
                          <div className="space-y-2">
                            <h6 className="text-[9px] font-bold text-slate-500 uppercase">Key Actors Involved</h6>
                            <div className="flex flex-wrap gap-2">
                              {movement.actors.map(a => (
                                <span key={a} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] text-slate-400 border border-white/5">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Geographic Risk & Analysis */}
        <div className="space-y-8">
          <div className="intel-card p-6 rounded-2xl border border-intel-border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Geographic Risk Heatmap</h3>
              <Globe className="w-4 h-4 text-intel-cyan opacity-20" />
            </div>
            <div className="space-y-4">
              {governorateRisks.map((gov) => (
                <div key={gov.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{gov.name}</div>
                      <div className="text-[8px] font-mono text-slate-500 uppercase">{gov.primaryDriver} Driver</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">{gov.risk}%</div>
                      <div className={cn(
                        "text-[8px] font-mono",
                        gov.trend === 'up' ? "text-intel-red" : "text-intel-green"
                      )}>{gov.trend === 'up' ? '↑ ESCALATING' : '↓ STABILIZING'}</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        gov.risk > 85 ? "bg-intel-red" : gov.risk > 70 ? "bg-intel-orange" : "bg-intel-cyan"
                      )} 
                      style={{ width: `${gov.risk}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-600">
                    <span>{gov.activeMovements} Active Clusters</span>
                    <span>Threshold: 90%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-intel-red/20 space-y-4">
            <div className="flex items-center space-x-2 text-intel-red">
              <ShieldAlert className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Escalation Warning</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "Significant overlap detected between unemployed graduate networks and neighborhood 'Bread & Dignity' groups in the Ettadhamen-Mnihla axis. High probability of coordinated unrest if subsidy cuts are announced in Q2."
            </p>
            <div className="pt-2 border-t border-white/5">
              <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">Trigger Conditions</div>
              <div className="space-y-1.5">
                {[
                  'Bread price increase > 15%',
                  'Arrest of neighborhood youth leaders',
                  'Water outage > 48 hours in Tunis West',
                ].map((trigger, i) => (
                  <div key={i} className="flex items-center space-x-2 text-[9px] text-slate-300">
                    <div className="w-1 h-1 rounded-full bg-intel-red" />
                    <span>{trigger}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
