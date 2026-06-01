import React from 'react';
import { prepareList, generateStableKey } from '../../lib/keyUtils';
import { motion } from 'motion/react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Activity,
  ChevronRight,
  Info,
  Calendar,
  Lock,
  Zap,
  ArrowUpRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { MIIPhase, MinistryTier, ChangeType } from '../../services/miiEngine';

const PHASE_COLORS: Record<MIIPhase, string> = {
  STABLE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  ADAPTIVE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  CHAOTIC: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  FREEZE: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const TIER_LABELS: Record<MinistryTier, string> = {
  COERCIVE: 'Coercive Core',
  ECONOMIC: 'Economic Pillar',
  SOCIAL: 'Social Sector',
  PERIPHERAL: 'Peripheral',
};

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  ROUTINE: 'Routine Rotation',
  CRISIS_TRIGGERED: 'Crisis-Triggered',
  PREEMPTIVE: 'Preemptive Purge',
  LOYALTY_INSTALL: 'Loyalist Installation',
  TECHNOCRAT_IN: 'Technocrat Appointment',
};

export const PoliticalStabilityIntelligence: React.FC = () => {
  const { miiProfile } = useAIAnalysis();

  if (!miiProfile) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-xs animate-pulse">
        INITIALIZING MII ENGINE...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Political Stability Intelligence"
        subtitle="Ministerial Instability Index (MII) — EQ.21 Analysis of Elite Cohesion and Regime Fragility"
        icon={Users}
        nodeId="MII-NODE-21"
      />

      {/* Section 1: MII Phase & Composite Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${PHASE_COLORS[miiProfile.phase]}`}>
                  PHASE: {miiProfile.phase}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Confidence: {(miiProfile.phaseConfidence * 100).toFixed(0)}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface tracking-tight">
                Ministerial Instability Index
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                {miiProfile.interpretation}
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-6 min-w-[160px]">
              <span className="text-[10px] font-mono text-slate-500 uppercase mb-1">MII Score</span>
              <span className="text-5xl font-bold text-intel-cyan tracking-tighter">
                {miiProfile.mii.toFixed(3)}
              </span>
              <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${miiProfile.miiDelta >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {miiProfile.miiDelta >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                {miiProfile.miiDelta >= 0 ? '+' : ''}{miiProfile.miiDelta.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {prepareList([
              { label: 'Frequency (CF)', value: miiProfile.changeFrequency, color: 'bg-intel-cyan' },
              { label: 'Tenure (1/T)', value: miiProfile.avgTenureScore, color: 'bg-blue-400' },
              { label: 'Crisis Ratio', value: miiProfile.crisisChangeRatio, color: 'bg-orange-400' },
              { label: 'Key Ministry (KM)', value: miiProfile.keyMinistryScore, color: 'bg-rose-400' },
              { label: 'Loyalty (LS)', value: miiProfile.loyaltyShiftIndex, color: 'bg-purple-400' },
            ]).map((comp, i) => (
              <div key={generateStableKey(comp, i, 'comp')} className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                  <span>{comp.label}</span>
                  <span>{(comp.value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${comp.value * 100}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full ${comp.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={14} className="text-intel-cyan" />
            Equation Impact
          </h4>
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400">EQ.7 Elite Defection</span>
                <span className="text-xs font-bold text-rose-400">+{miiProfile.eq7_defections} virtual units</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                MII increases the current_defections parameter, raising the probability of a defection cascade.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400">EQ.18 Cohesion Decay</span>
                <span className="text-xs font-bold text-orange-400">+{miiProfile.eq18_delta_defection.toFixed(3)} addon</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Crisis-triggered changes erode elite cohesion dynamics (EC_t) directly.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-400">EQ.16 System Velocity</span>
                <span className="text-xs font-bold text-amber-400">+{miiProfile.eq16_velocity_addon.toFixed(3)} V(t)</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed">
                Sudden MII spikes contribute to overall system acceleration and volatility.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Ministry Profiles */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <Shield size={14} className="text-intel-cyan" />
            Ministry Stability Registry
          </h4>
          <span className="text-[10px] font-mono text-slate-500">10 ACTIVE MINISTRIES MONITORED</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Ministry</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium">Current Minister</th>
                <th className="px-6 py-3 font-medium text-center">Tenure</th>
                <th className="px-6 py-3 font-medium text-center">12M Changes</th>
                <th className="px-6 py-3 font-medium text-right">Loyalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prepareList(miiProfile.ministryProfiles).map((profile: any, i: number) => (
                <tr key={generateStableKey(profile, i, 'ministry')} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-on-surface group-hover:text-intel-cyan transition-colors">
                      {profile.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                      {profile.rriVariables.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      profile.tier === 'COERCIVE' ? 'text-rose-400 border-rose-400/20 bg-rose-400/5' :
                      profile.tier === 'ECONOMIC' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' :
                      'text-slate-400 border-slate-400/20 bg-slate-400/5'
                    }`}>
                      {TIER_LABELS[profile.tier]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-300">{profile.currentMinister || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-xs font-mono text-on-surface">{profile.tenureDays}d</div>
                    <div className="text-[9px] text-slate-500">since appointment</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`text-xs font-bold ${profile.changesLast12m > 1 ? 'text-orange-400' : 'text-slate-400'}`}>
                      {profile.changesLast12m}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-400" 
                          style={{ width: `${profile.loyalistScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-300">
                        {(profile.loyalistScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Timeline & Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-6 flex items-center gap-2">
            <Calendar size={14} className="text-intel-cyan" />
            Recent Reshuffle Timeline
          </h4>
          <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {prepareList(miiProfile.recentEvents).map((event: any, i: number) => (
              <div key={generateStableKey(event, i, 'event')} className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-intel-cyan z-10" />
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-intel-cyan font-bold">{event.date}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    event.changeType === 'PREEMPTIVE' ? 'bg-rose-400/20 text-rose-400' :
                    event.changeType === 'CRISIS_TRIGGERED' ? 'bg-orange-400/20 text-orange-400' :
                    'bg-white/5 text-slate-400'
                  }`}>
                    {CHANGE_TYPE_LABELS[event.changeType]}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-on-surface">{event.ministry}</h5>
                {event.crisisContext && (
                  <p className="text-xs text-slate-400 mt-1 italic">
                    "{event.crisisContext}"
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <UserX size={10} />
                    {event.outgoingName || 'Outgoing'}
                  </div>
                  <ChevronRight size={10} className="text-slate-700" />
                  <div className="flex items-center gap-1 text-[10px] text-intel-cyan font-bold">
                    <UserCheck size={10} />
                    {event.incomingName || 'Incoming'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 border-l-4 border-l-intel-cyan">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={14} className="text-intel-cyan" />
              Intelligence Prediction
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {miiProfile.prediction}
            </p>
            <div className="flex items-center justify-between p-4 bg-intel-cyan/5 rounded-xl border border-intel-cyan/20">
              <div className="flex items-center gap-3">
                <Clock className="text-intel-cyan" size={20} />
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Critical Horizon</div>
                  <div className="text-sm font-bold text-on-surface">{miiProfile.timeHorizon}</div>
                </div>
              </div>
              <ArrowUpRight className="text-intel-cyan" size={20} />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" />
              Watch Indicators
            </h4>
            <div className="space-y-3">
              {prepareList(miiProfile.keySignals).map((signal: any, i: number) => (
                <div key={generateStableKey(signal, i, 'signal')} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse" />
                  <span className="text-xs text-slate-300 font-mono">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
