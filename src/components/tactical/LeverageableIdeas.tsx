import React from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../utils/cn';
import { Lightbulb, Zap, AlertTriangle, Eye } from 'lucide-react';

const generateIdeas = (rriState: any, data: any) => [
  rriState.cascade_probability > 0.5 && {
    id: 'L001',
    title: 'Sfax Cascade Window',
    type: 'LEVERAGE',
    urgency: 'HIGH',
    icon: Zap,
    color: 'text-intel-cyan',
    bgColor: 'bg-intel-cyan/10',
    borderColor: 'border-intel-cyan/20',
    description: `P_cascade = ${(rriState.cascade_probability*100).toFixed(0)}%. Sfax compound crisis creates maximum pressure point. Water + economic + migration narrative convergence is rare. Window to amplify cross-governorate solidarity.`,
    action: 'Monitor for cascade trigger event. Pre-position node reports in Kasserine and Sidi Bouzid.',
  },
  data.economy.fx_reserves < 90 && {
    id: 'L002',
    title: 'FX Reserve Countdown',
    type: 'MONITOR',
    urgency: 'HIGH',
    icon: Eye,
    color: 'text-intel-orange',
    bgColor: 'bg-intel-orange/10',
    borderColor: 'border-intel-orange/20',
    description: `Reserves at ${data.economy.fx_reserves} days. Below 90-day warning. At current depletion rate, crisis threshold (60 days) reached in approximately ${Math.round((data.economy.fx_reserves - 60) / 0.8)} weeks. IMF deadlock makes this trajectory likely to continue.`,
    action: 'Track BCT weekly bulletin. Alert when reserves cross 75 days.',
  },
  rriState.pattern_similarity > 0.6 && {
    id: 'L003',
    title: 'Historical Pattern Match Active',
    type: 'WARNING',
    urgency: 'CRITICAL',
    icon: AlertTriangle,
    color: 'text-intel-red',
    bgColor: 'bg-intel-red/10',
    borderColor: 'border-intel-red/20',
    description: `HPS = ${(rriState.pattern_similarity*100).toFixed(0)}%. Current variable vector shows ${rriState.pattern_similarity > 0.7 ? 'HIGH' : 'MODERATE'} similarity to ${rriState.pattern_label}. Pattern matches historically precede major political events within 3-6 months.`,
    action: 'Increase monitoring frequency. Prepare scenario response plans.',
  },
  data.social.ugtt_mobilisation_level === 'HIGH' && {
    id: 'L004',
    title: 'UGTT Strike Window',
    type: 'LEVERAGE',
    urgency: 'HIGH',
    icon: Zap,
    color: 'text-intel-cyan',
    bgColor: 'bg-intel-cyan/10',
    borderColor: 'border-intel-cyan/20',
    description: 'UGTT at HIGH mobilisation. General strike trigger threshold at 64%. CPG wage arrears unresolved. A strike would be the single highest-impact destabilization event currently possible.',
    action: 'Track UGTT secretariat communiqués. Monitor CPG mine situation daily.',
  },
  rriState.velocity > 0.15 && {
    id: 'L005',
    title: 'Momentum Acceleration',
    type: 'WARNING',
    urgency: 'MEDIUM',
    icon: AlertTriangle,
    color: 'text-intel-red',
    bgColor: 'bg-intel-red/10',
    borderColor: 'border-intel-red/20',
    description: `V(t) = +${rriState.velocity.toFixed(3)} (${rriState.velocity_label}). Multiple variables deteriorating simultaneously. Compound stress CS(t) = ${rriState.compound_stress.toFixed(3)} suggests threshold interaction effects.`,
    action: 'Review which variables are driving velocity. Check if threshold breaches are new.',
  },
].filter(Boolean);

export const LeverageableIdeas: React.FC = () => {
  const { data, rriState } = usePipeline();
  const ideas = generateIdeas(rriState, data);

  return (
    <div className="glass p-4 rounded-lg border border-intel-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-3 h-3 text-intel-purple" />
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Leverageable Signals</h3>
        </div>
        <span className="text-[8px] font-mono text-intel-purple uppercase font-bold tracking-widest">AI-Derived Intel</span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-hide">
        {ideas.length > 0 ? (
          ideas.map((idea: any, i: number) => (
            <div key={idea.id} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-3 group hover:border-white/10 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <span className="text-[7px] font-mono font-bold px-1 bg-white/5 text-slate-500 border border-white/10 rounded uppercase">
                    {idea.id}
                  </span>
                  <span className={cn("text-[7px] font-mono font-bold px-1 border rounded uppercase", idea.bgColor, idea.color, idea.borderColor)}>
                    {idea.type}
                  </span>
                  <span className={cn(
                    "text-[7px] font-mono font-bold px-1 border rounded uppercase",
                    idea.urgency === 'CRITICAL' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                    idea.urgency === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
                    "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                  )}>
                    {idea.urgency}
                  </span>
                </div>
                <idea.icon className={cn("w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity", idea.color)} />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-white uppercase tracking-tight group-hover:text-intel-cyan transition-colors">
                  {idea.title}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed uppercase">
                  {idea.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="text-[8px] font-mono text-slate-600 uppercase mb-1 tracking-widest">Recommended Action</div>
                <p className="text-[9px] text-intel-cyan italic uppercase leading-tight">
                  {idea.action}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2 opacity-30">
            <Lightbulb className="w-8 h-8 text-slate-500" />
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              No leverage signals active at current RRI levels.
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/5 text-[7px] font-mono text-slate-600 uppercase tracking-widest text-center">
        Strategic intelligence derived from RRI state
      </div>
    </div>
  );
};
