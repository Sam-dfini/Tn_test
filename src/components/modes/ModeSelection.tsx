import React from 'react';
import { motion } from 'motion/react';
import {
  Eye, ShieldAlert, Shield, Terminal,
  Globe, Network, Lock
} from 'lucide-react';
import { ModePageLayout } from '../modes/ModePageLayout';
import { usePipeline } from '../../context/PipelineContext';

interface ModeSelectionProps {
  onSelect: (mode: 'advanced' | 'professional' | 'terminal' | 'brain') => void;
  onLogoff: () => void;
}

interface ModeCard {
  id: 'advanced' | 'professional' | 'terminal' | 'brain';
  node: string;
  label: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  accentHex: string;
  tier: 'public' | 'analyst' | 'strategic';
}

const MODES: ModeCard[] = [
  {
    id: 'professional',
    node: 'INTEL_NODE_01',
    label: 'PROFESSIONAL INTEL',
    description: 'High-fidelity geopolitical telemetry from verified sovereign channels. Strategic foresight planning with predictive ledger, RBAC access tiers, and live RRI engine.',
    icon: Shield,
    accentColor: 'text-intel-cyan border-intel-cyan/30 hover:border-intel-cyan',
    accentHex: '#00f2ff',
    tier: 'analyst',
  },
  {
    id: 'advanced',
    node: 'INTEL_NODE_02',
    label: 'TACTICAL OSINT',
    description: 'Real-time open-source reconnaissance. Direct feed from global social signals, satellite imagery, and localized transmission clusters. Decipher the ground truth.',
    icon: Eye,
    accentColor: 'text-intel-cyan border-intel-cyan/30 hover:border-intel-cyan',
    accentHex: '#00f2ff',
    tier: 'public',
  },
  {
    id: 'terminal',
    node: 'INTEL_NODE_05',
    label: 'TUNISIA TERMINAL',
    description: 'Bloomberg-style high-density intelligence terminal. Real-time RRI, macroeconomic indicators, and tactical intel feed in a data-dense operator interface.',
    icon: Terminal,
    accentColor: 'text-intel-cyan border-intel-cyan/30 hover:border-intel-cyan',
    accentHex: '#00f2ff',
    tier: 'analyst',
  },
  {
    id: 'brain',
    node: 'BRAIN_NODE_09',
    label: 'BRAIN MODE',
    description: 'Cognitive Interface. Immersive 3D visualization of Tunisia’s political, economic, and social dynamics. Experience real-time data as a living neural network.',
    icon: Globe,
    accentColor: 'text-intel-purple border-intel-purple/30 hover:border-intel-purple',
    accentHex: '#a78bfa',
    tier: 'strategic',
  },
];

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  public: { label: 'PUBLIC', color: 'text-intel-green bg-intel-green/10 border-intel-green/20' },
  analyst: { label: 'ANALYST', color: 'text-intel-cyan bg-intel-cyan/10 border-intel-cyan/20' },
  strategic: { label: 'CLASSIFIED', color: 'text-intel-purple bg-intel-purple/10 border-intel-purple/20' },
};

export const ModeSelection: React.FC<ModeSelectionProps> = React.memo(({ onSelect, onLogoff }) => {
  const { rriState, data } = usePipeline();

  const rriColor = rriState.rri > 2.7
    ? 'text-intel-red' : rriState.rri > 2.3
    ? 'text-intel-orange' : 'text-intel-cyan';

  const ticker = [
    { label: 'RRI', value: rriState.rri.toFixed(3), color: rriColor },
    { label: 'P(REV)', value: `${(rriState.p_rev * 100).toFixed(1)}%`, color: 'text-intel-orange' },
    { label: 'VELOCITY', value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3), color: rriState.velocity > 0.1 ? 'text-intel-red' : 'text-slate-400' },
    { label: 'FX', value: `${data.economy.fx_reserves}d`, color: data.economy.fx_reserves < 90 ? 'text-intel-orange' : 'text-intel-green' },
    { label: 'INFLATION', value: `${data.economy.inflation}%`, color: data.economy.inflation > 8 ? 'text-intel-orange' : 'text-slate-400' },
    { label: 'UGTT', value: data.social.ugtt_mobilisation_level, color: data.social.ugtt_mobilisation_level === 'HIGH' ? 'text-intel-red' : 'text-slate-400' },
    { label: 'CASCADE', value: `${(rriState.cascade_probability * 100).toFixed(0)}%`, color: rriState.cascade_probability > 0.5 ? 'text-intel-red' : 'text-slate-400' },
  ];

  return (
    <ModePageLayout
      headerAction={
        <button
          onClick={onLogoff}
          aria-label="Logout from system"
          className="text-[#ef4444] font-mono text-[10px] border border-[#ef4444]/20 px-3 py-1 hover:bg-[#ef4444]/10 transition-colors rounded"
        >
          [ LOGOUT ]
        </button>
      }
    >
      {/* Live Intelligence Ticker */}
      <div className="mb-8 overflow-hidden border border-intel-border/30 rounded-lg bg-black/30 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent z-10 pointer-events-none" />
        <div className="flex items-center gap-3 px-4 py-2 border-b border-intel-border/20">
          <div className="w-1.5 h-1.5 rounded-full bg-intel-green animate-pulse" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Live Intelligence Feed</span>
          <span className="text-[9px] font-mono text-slate-600 ml-auto">{new Date().toUTCString().slice(0, 25)} UTC</span>
        </div>
        <div className="py-2 px-4 flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {ticker.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.35, ease: 'easeOut' }}
              className="flex items-center gap-2 shrink-0"
            >
              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{t.label}</span>
              <span className={`text-[11px] font-mono font-bold ${t.color}`}>{t.value}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-px h-8 bg-intel-cyan/40" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SYSTEM ACCESS GATEWAY</h1>
                <p className="text-intel-cyan font-mono text-[10px] uppercase tracking-[0.3em]">// SELECT OPERATIONAL INTERFACE</p>
              </div>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-system-command'))}
            className="flex items-center gap-2 px-4 py-2 border border-intel-cyan/20 text-intel-cyan/60 hover:text-intel-cyan hover:bg-intel-cyan/5 transition-all text-[10px] font-mono rounded"
          >
            <Shield className="w-4 h-4" />
            [ SYSTEM COMMAND ]
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger-children">
          {MODES.map((m, i) => {
            const Icon = m.icon;
            const badge = TIER_BADGE[m.tier];
            const isStrategic = m.tier === 'strategic';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`intel-card p-5 space-y-3 cursor-pointer group relative overflow-hidden border transition-all duration-200 ${m.accentColor}`}
                onClick={() => onSelect(m.id)}
                role="button"
                aria-label={`Initiate ${m.label}`}
              >
                {/* Background glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${m.accentHex}08 0%, transparent 70%)` }}
                />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none overflow-hidden">
                  <div
                    className="absolute top-0 right-0 w-full h-full opacity-20"
                    style={{ background: `linear-gradient(225deg, ${m.accentHex} 0%, transparent 60%)` }}
                  />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${m.accentHex}15`, border: `1px solid ${m.accentHex}30` }}
                    >
                      {isStrategic
                        ? <Lock className="w-4 h-4" style={{ color: m.accentHex as string }} />
                        : <Icon className="w-4 h-4" style={{ color: m.accentHex as string }} />
                      }
                    </div>
                    <span className="text-[8px] font-mono text-slate-600 uppercase">{m.node}</span>
                  </div>
                  <span
                    className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="relative z-10">
                  <h2
                    className="text-sm font-bold text-white tracking-wide group-hover:opacity-90 transition-opacity"
                    style={{ textShadow: `0 0 20px ${m.accentHex}40` }}
                  >
                    {m.label}
                  </h2>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed relative z-10 group-hover:text-slate-400 transition-colors">
                  {m.description}
                </p>

                <div className="pt-1 relative z-10">
                  <div
                    className="text-[9px] font-mono font-bold px-3 py-1.5 rounded border inline-flex items-center gap-1.5 transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(0,242,255,0.15)]"
                    style={{
                      color: m.accentHex,
                      borderColor: `${m.accentHex}40`,
                      background: `${m.accentHex}08`,
                    }}
                  >
                    {isStrategic ? '[ RESTRICTED ]' : '[ INITIATE ]'}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Status footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between pt-4 border-t border-intel-border/20 text-[9px] font-mono text-slate-600"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-intel-green animate-pulse" />
              <span>PIPELINE ACTIVE</span>
            </div>
            <span className="text-slate-700">|</span>
            <span>RRI ENGINE v4.2</span>
            <span className="text-slate-700">|</span>
            <span>250 VARIABLES</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-intel-cyan/40" />
            <span>REGION: NORTH AFRICA // TUNISIA</span>
          </div>
        </motion.div>
      </div>
    </ModePageLayout>
  );
});
