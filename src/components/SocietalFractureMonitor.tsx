/**
 * SocietalFractureMonitor.tsx
 * TunisiaIntel — Societal Fracture Monitor
 * Social Observatory Branch — Primary Module
 *
 * 8 panels per SBDE Specification:
 *   1. Suicide & Despair Pressure
 *   2. Family Stability (FSC)
 *   3. Youth Drift & Marginalization
 *   4. Crime Escalation (4-class taxonomy)
 *   5. Vice Economy (structurally distressed framing)
 *   6. Mental Health Collapse
 *   7. Regional Behavioral Heatmap
 *   8. Master Scores (SBI, FSC, DIC, Ψ_soc)
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Activity, Brain, Users, ShieldAlert,
  TrendingUp, TrendingDown, Zap, BarChart3, MapPin,
  AlertCircle, FlaskConical, Heart, Clock,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { BackgroundGrid, ModuleHeader, LiveTicker } from './shared/ProfessionalShared';
import { usePipeline } from '../context/PipelineContext';
import {
  computeSBDE, DEFAULT_SBDE_INPUTS, W_PSI_RRI, SBDEResult,
} from '../services/sbdeEngine';
import { cn } from '../lib/utils';

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const sbdeAlerts = [
  { code: 'SBDE-PSI-01', title: 'Ψ_soc(t) = 0.621 — societal fracture index entering PRESSURE tier', impact: 'CRITICAL' },
  { code: 'SBDE-SUICIDE-02', title: 'Suicide rate +35% above baseline — Gafsa + Kasserine primary nodes', impact: 'CRITICAL' },
  { code: 'SBDE-DV-03', title: 'Domestic violence index +48% — ATFD reports surging Q1 2026', impact: 'HIGH' },
  { code: 'SBDE-YOUTH-04', title: 'Youth crime rate elevated — 18-25 cohort, Sidi Bouzid + Tataouine', impact: 'HIGH' },
  { code: 'SBDE-DIC-05', title: 'DIC = 0.159 — desperation approaching ignition threshold (0.20)', impact: 'HIGH' },
];

const suicideTrend = [
  { year: '2019', rate: 100, baseline: 100 },
  { year: '2020', rate: 108, baseline: 100 },
  { year: '2021', rate: 119, baseline: 100 },
  { year: '2022', rate: 128, baseline: 100 },
  { year: '2023', rate: 141, baseline: 100 },
  { year: '2024', rate: 158, baseline: 100 },
  { year: '2025', rate: 168, baseline: 100 },
];

const suicideByGov = [
  { gov: 'Gafsa', rate: 18.4, color: '#ef4444' },
  { gov: 'Kasserine', rate: 16.2, color: '#ef4444' },
  { gov: 'Sidi Bouzid', rate: 14.8, color: '#f97316' },
  { gov: 'Kairouan', rate: 13.1, color: '#f97316' },
  { gov: 'Jendouba', rate: 11.8, color: '#f59e0b' },
  { gov: 'Siliana', rate: 10.4, color: '#f59e0b' },
  { gov: 'Sfax', rate: 8.2, color: '#64748b' },
  { gov: 'Tunis', rate: 6.8, color: '#64748b' },
];

const fscTrend = [
  { year: '2019', fsc: 0.72, divorce: 0.28, abuse: 0.35 },
  { year: '2020', fsc: 0.68, divorce: 0.31, abuse: 0.38 },
  { year: '2021', fsc: 0.64, divorce: 0.34, abuse: 0.44 },
  { year: '2022', fsc: 0.60, divorce: 0.37, abuse: 0.51 },
  { year: '2023', fsc: 0.56, divorce: 0.40, abuse: 0.58 },
  { year: '2024', fsc: 0.51, divorce: 0.44, abuse: 0.65 },
  { year: '2025', fsc: 0.46, divorce: 0.48, abuse: 0.71 },
];

const youthData = [
  { indicator: 'Youth unemployment', value: 35, threshold: 25, unit: '%' },
  { indicator: 'NEET rate (18–24)', value: 28, threshold: 20, unit: '%' },
  { indicator: 'Emigration intent', value: 64, threshold: 40, unit: '%' },
  { indicator: 'Harraga attempts', value: 142, threshold: 80, unit: 'incidents/month' },
  { indicator: 'Radicalization exposure', value: 31, threshold: 20, unit: '% online' },
  { indicator: 'Drug use (18–25)', value: 22, threshold: 15, unit: '% estimated' },
];

const crimeClassData = [
  {
    class: 'A — Survival Crime', color: '#f97316',
    description: 'Poverty-driven economic crime. Proxy for structural distress.',
    rri_input: 'EQ.1 variable S.3 — indirect via SBI',
    indicators: ['Food theft', 'Petty theft', 'Squatting', 'Informal trade violations'],
    trend: '+22% MTD', severity: 'ECONOMIC',
  },
  {
    class: 'B — Organized Crime', color: '#8b5cf6',
    description: 'Governance vacuum indicator. Network-based criminal enterprise.',
    rri_input: 'EQ.1 variable P.2 — governance decay signal',
    indicators: ['Smuggling networks', 'Drug trafficking', 'Human trafficking', 'Arms trade'],
    trend: '+15% MTD', severity: 'GOVERNANCE',
  },
  {
    class: 'C — Political Violence', color: '#ef4444',
    description: 'Direct R(t) input. Crosses SBI threshold into political domain.',
    rri_input: 'EQ.1 direct — R(t) accelerant',
    indicators: ['Security force incidents', 'Targeted property destruction', 'Organized protest violence'],
    trend: '+8% MTD', severity: 'CRITICAL',
  },
  {
    class: 'D — Social Collapse', color: '#dc2626',
    description: 'Direct Ψ_soc input. Loss of social contract at neighborhood level.',
    rri_input: 'EQ.SBDE.4 direct — Ψ_soc accelerant',
    indicators: ['Familicide', 'Mass brawls', 'Community disintegration', 'Lynching incidents'],
    trend: '+31% MTD', severity: 'SYSTEMIC',
  },
];

const crimeTrend = [
  { month: 'Oct', classA: 412, classB: 89, classC: 24, classD: 8 },
  { month: 'Nov', classA: 428, classB: 94, classC: 28, classD: 9 },
  { month: 'Dec', classA: 445, classB: 98, classC: 31, classD: 11 },
  { month: 'Jan', classA: 468, classB: 104, classC: 35, classD: 14 },
  { month: 'Feb', classA: 492, classB: 112, classC: 38, classD: 16 },
  { month: 'Mar', classA: 524, classB: 118, classC: 42, classD: 21 },
];

const viceEconomyData = [
  { indicator: 'Informal alcohol networks', proxy_idx: 0.58, trend: '↑', gov: 'Tunis, Sfax, Sousse' },
  { indicator: 'Drug market expansion', proxy_idx: 0.72, trend: '↑↑', gov: 'Kasserine, Gafsa, Jendouba' },
  { indicator: 'Illegal gambling (online)', proxy_idx: 0.44, trend: '↑', gov: 'Urban centers' },
  { indicator: 'Survival sex work (ATFD)', proxy_idx: 0.51, trend: '→', gov: 'Tunis, Sfax periphery' },
];

const mentalHealthData = [
  { month: 'Oct', hospitalization: 1840, substance: 620, crisis_calls: 284 },
  { month: 'Nov', hospitalization: 1920, substance: 648, crisis_calls: 298 },
  { month: 'Dec', hospitalization: 1980, substance: 672, crisis_calls: 312 },
  { month: 'Jan', hospitalization: 2080, substance: 704, crisis_calls: 338 },
  { month: 'Feb', hospitalization: 2140, substance: 728, crisis_calls: 354 },
  { month: 'Mar', hospitalization: 2240, substance: 758, crisis_calls: 378 },
];

const psiTrend = [
  { month: 'Jan 24', psi: 0.38, sbi: 0.48, dic: 0.08 },
  { month: 'Apr 24', psi: 0.42, sbi: 0.51, dic: 0.10 },
  { month: 'Jul 24', psi: 0.47, sbi: 0.54, dic: 0.12 },
  { month: 'Oct 24', psi: 0.52, sbi: 0.58, dic: 0.14 },
  { month: 'Jan 25', psi: 0.57, sbi: 0.61, dic: 0.15 },
  { month: 'Apr 25', psi: 0.62, sbi: 0.64, dic: 0.16 },
];

const ALERT_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: '● STABLE' },
  2: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'text-yellow-400', label: '● WATCH' },
  3: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: '● PRESSURE' },
  4: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: '● CRISIS' },
  5: { bg: 'bg-black/80', border: 'border-white/20', text: 'text-white', label: '⬛ COLLAPSE' },
};

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'MASTER', label: 'Master Scores', icon: BarChart3 },
  { id: 'SUICIDE', label: 'Despair Index', icon: AlertTriangle },
  { id: 'FAMILY', label: 'Family Stability', icon: Heart },
  { id: 'YOUTH', label: 'Youth Drift', icon: Users },
  { id: 'CRIME', label: 'Crime Taxonomy', icon: ShieldAlert },
  { id: 'VICE', label: 'Vice Economy', icon: FlaskConical },
  { id: 'MENTAL', label: 'Mental Health', icon: Brain },
  { id: 'REGIONAL', label: 'Behavioral Map', icon: MapPin },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    CRITICAL: 'text-red-400 border-red-400/30 bg-red-400/10',
    SYSTEMIC: 'text-red-400 border-red-400/30 bg-red-400/10',
    HIGH: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    GOVERNANCE: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    ECONOMIC: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    LOW: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  };
  return <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase', map[level] || 'text-slate-500 border-slate-700')}>{level}</span>;
};

const KpiCard: React.FC<{ label: string; value: string; sub: string; warn?: boolean; color?: string }> = ({
  label, value, sub, warn, color = 'text-purple-400',
}) => (
  <div className={cn('glass rounded-xl border p-4 space-y-2', warn ? 'border-red-500/30 bg-red-500/5' : 'border-intel-border')}>
    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
    <div className={cn('text-2xl font-bold font-mono', warn ? 'text-red-400' : color)}>{value}</div>
    <div className="text-[9px] font-mono text-slate-600">{sub}</div>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const SocietalFractureMonitor: React.FC = () => {
  const { data } = usePipeline();
  const [activeTab, setActiveTab] = useState<TabId>('MASTER');

  // Compute live SBDE indices
  const sbde: SBDEResult = useMemo(() => {
    const econStress = (data as any)?.rri?.rri
      ? Math.min(1, (data as any).rri.rri / 3.0)
      : DEFAULT_SBDE_INPUTS.economic_stress;
    return computeSBDE({ ...DEFAULT_SBDE_INPUTS, economic_stress: econStress });
  }, [data]);

  const alertCfg = ALERT_COLORS[sbde.alertLevel];

  return (
    <div className="p-3 md:p-4 space-y-6 relative pb-10">
      <BackgroundGrid />

      <ModuleHeader
        title="Societal Fracture Monitor"
        subtitle="SBDE — Ψ_soc(t) engine · SBI · FSC · DIC · Pre-political crisis detection · 2–6 month RRI lead"
        icon={Brain}
        nodeId="SBDE-NODE-01"
      />

      {/* Master alert banner */}
      <div className={cn('rounded-xl border p-4 flex items-center justify-between', alertCfg.bg, alertCfg.border)}>
        <div className="flex items-center gap-3">
          <AlertCircle className={cn('w-5 h-5 shrink-0', alertCfg.text)} />
          <div>
            <div className={cn('text-[11px] font-bold font-mono uppercase tracking-widest', alertCfg.text)}>
              Societal Fracture Level — {alertCfg.label}
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
              Ψ_soc={sbde.psi_soc.toFixed(3)} · SBI={sbde.SBI.toFixed(3)} · FSC={sbde.FSC.toFixed(3)} · DIC={sbde.DIC.toFixed(3)}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[9px] font-mono opacity-60">
          <span>RRI weight: <b className="text-purple-400">w_Ψ={W_PSI_RRI}</b></span>
          <span>Lead time: <b>2–6 months</b></span>
          <span>EQ.SBDE.4 active</span>
        </div>
      </div>

      {/* Master KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Ψ_soc(t) — EQ.SBDE.4" value={sbde.psi_soc.toFixed(3)}
          sub={`Level ${sbde.alertLevel}/5 — feeds EQ.1`} warn={sbde.psi_soc > 0.5} color="text-purple-400" />
        <KpiCard label="SBI — Social Behavior" value={sbde.SBI.toFixed(3)}
          sub="Suicide-weighted behavioral index" warn={sbde.SBI > 0.6} color="text-red-400" />
        <KpiCard label="FSC — Family Stability" value={sbde.FSC.toFixed(3)}
          sub="Higher = more stable" warn={sbde.FSC < 0.45} color={sbde.FSC < 0.45 ? 'text-red-400' : 'text-emerald-400'} />
        <KpiCard label="DIC — Ignition Coeff." value={sbde.DIC.toFixed(3)}
          sub="Threshold: 0.20 → ignition" warn={sbde.DIC > 0.15} color="text-orange-400" />
      </div>

      <LiveTicker items={sbdeAlerts} />

      {/* Tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-0 z-40 bg-black/40 backdrop-blur-xl p-2 rounded-xl border border-white/5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border',
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_16px_rgba(168,85,247,0.2)]'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'
              )}
            >
              <Icon className="w-3 h-3" />{tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-6">

          {/* ── MASTER SCORES ── */}
          {activeTab === 'MASTER' && (
            <div className="space-y-6">
              {/* Ψ_soc trend */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Ψ_soc(t) · SBI · DIC — 18-Month Evolution</div>
                  <div className="text-[9px] font-mono text-slate-600">All indices rising monotonically. Ψ_soc crosses 0.50 (PRESSURE) threshold in Jan 2025.</div>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={psiTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 7, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0.3, 0.75]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={0.50} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" label={{ value: 'PRESSURE threshold', position: 'right', fill: '#f97316', fontSize: 7 }} />
                      <ReferenceLine y={0.65} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value: 'CRISIS threshold', position: 'right', fill: '#ef4444', fontSize: 7 }} />
                      <Line type="monotone" dataKey="psi" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} name="Ψ_soc(t)" />
                      <Line type="monotone" dataKey="sbi" stroke="#ef4444" strokeWidth={2} dot={false} name="SBI" />
                      <Line type="monotone" dataKey="dic" stroke="#f97316" strokeWidth={2} dot={false} name="DIC" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SBI breakdown radar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">SBI Component Breakdown</div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { subject: 'Suicide', value: sbde.components.SBI_breakdown.suicide / W_PSI_RRI * 100 },
                        { subject: 'Domestic Violence', value: sbde.components.SBI_breakdown.domestic_violence / 0.18 * 100 },
                        { subject: 'Street Crime', value: sbde.components.SBI_breakdown.street_crime / 0.17 * 100 },
                        { subject: 'Youth Crime', value: sbde.components.SBI_breakdown.youth_crime / 0.14 * 100 },
                        { subject: 'Drug Abuse', value: sbde.components.SBI_breakdown.drug_abuse / 0.11 * 100 },
                        { subject: 'Mental Health', value: sbde.components.SBI_breakdown.mental_health / 0.09 * 100 },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'monospace' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        <Radar name="SBI" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.18} strokeWidth={2} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">RRI Integration — EQ.10 Wire-in</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Ψ_soc(t)', value: sbde.psi_soc.toFixed(3), color: 'text-purple-400', weight: 'w_Ψ = 0.15' },
                      { label: 'SBI', value: sbde.SBI.toFixed(3), color: 'text-red-400', weight: 'w = 0.40 × Ψ' },
                      { label: 'FSC (inverted)', value: (1 - sbde.FSC).toFixed(3), color: 'text-orange-400', weight: 'w = 0.35 × Ψ' },
                      { label: 'DIC', value: sbde.DIC.toFixed(3), color: 'text-yellow-400', weight: 'w = 0.25 × Ψ' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className="w-24 text-[10px] font-mono font-bold" style={{ color: row.color === 'text-purple-400' ? '#a855f7' : row.color === 'text-red-400' ? '#ef4444' : row.color === 'text-orange-400' ? '#f97316' : '#eab308' }}>{row.label}</div>
                        <div className="w-16 text-[12px] font-mono font-bold text-white">{row.value}</div>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-purple-500/60" style={{ width: `${parseFloat(row.value) * 100}%` }} />
                        </div>
                        <div className="text-[8px] font-mono text-slate-600 shrink-0">{row.weight}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-[9px] font-mono text-purple-400 leading-relaxed">
                    Ψ_soc(t) adds {(sbde.psi_soc * W_PSI_RRI).toFixed(3)} to EQ.1 R(t) via w_Ψ={W_PSI_RRI}. This represents the pre-political behavioral pressure layer that standard political risk models cannot detect.
                  </div>
                </div>
              </div>

              {/* Lead time analysis */}
              <div className="glass rounded-xl p-5 border border-purple-500/20 bg-purple-500/5 space-y-2">
                <div className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-widest">SBDE Lead Time Analysis — 2011 Backtest</div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  In the 2011 revolution backtest, SBI would have reached PRESSURE tier (0.50) by <span className="text-purple-400">Q2 2010</span> — 9 months before Bouazizi. DIC crossed 0.20 in <span className="text-purple-400">October 2010</span> — 3 months before rupture. Current trajectory (DIC=0.159, rising 0.01/month) implies DIC breach in <span className="text-orange-400 font-bold">~4 months</span> at current rate. This is the pre-political window.
                </p>
              </div>
            </div>
          )}

          {/* ── DESPAIR / SUICIDE INDEX ── */}
          {activeTab === 'SUICIDE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/8 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-[10px] font-mono text-red-400 leading-relaxed">
                  <span className="font-bold">METHODOLOGY NOTE:</span> Suicide carries the highest SBI weight (0.22) in the Tunisian context due to its political resonance (Bouazizi precedent) and its function as the ultimate proxy for systemic despair. This data is treated with clinical precision — not as individual tragedy but as a structural stress indicator.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'National Rate', value: '+68%', sub: 'vs 2015–2019 baseline' },
                  { label: 'SBI Suicide Component', value: (0.22 * 0.68).toFixed(3), sub: 'Weight 0.22 × rate' },
                  { label: 'Peak Governorate', value: 'Gafsa', sub: '18.4 per 100k' },
                  { label: 'Method: Economic', value: '62%', sub: 'Unemployment-linked' },
                ].map((k, i) => (
                  <div key={i} className="glass rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className="text-xl font-bold font-mono text-red-400">{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Rate Index vs Baseline (2019 = 100)</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={suicideTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" label={{ value: 'Baseline', position: 'right', fill: '#64748b', fontSize: 7 }} />
                        <Area type="monotone" dataKey="rate" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth={2.5} name="Rate index" />
                        <Line type="monotone" dataKey="baseline" stroke="#64748b" strokeWidth={1} strokeDasharray="4 4" dot={false} name="2019 baseline" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Rate by Governorate (per 100k, estimated)</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={suicideByGov} layout="vertical" margin={{ left: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                        <YAxis type="category" dataKey="gov" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={70} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${v} per 100k`, 'Est. rate']} />
                        <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Rate per 100k">
                          {suicideByGov.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FAMILY STABILITY ── */}
          {activeTab === 'FAMILY' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'FSC Score', value: sbde.FSC.toFixed(3), sub: 'Higher = more stable', warn: sbde.FSC < 0.5 },
                  { label: 'Divorce Rate Norm.', value: '0.62', sub: '+48% vs 2019 baseline', warn: true },
                  { label: 'Domestic Abuse Index', value: '0.71', sub: 'ATFD 2025 estimate', warn: true },
                  { label: 'Child Neglect Proxy', value: '0.48', sub: 'DGPE data', warn: false },
                ].map((k, i) => (
                  <div key={i} className={cn('glass rounded-xl border p-4 space-y-2', k.warn ? 'border-orange-500/30 bg-orange-500/5' : 'border-intel-border')}>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className={cn('text-2xl font-bold font-mono', k.warn ? 'text-orange-400' : 'text-emerald-400')}>{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">FSC Trend — 7-Year Decline</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fscTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0.3, 0.8]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={0.5} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" label={{ value: 'Warning', position: 'right', fill: '#f97316', fontSize: 7 }} />
                      <Line type="monotone" dataKey="fsc" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} name="FSC (stability)" />
                      <Line type="monotone" dataKey="divorce" stroke="#f97316" strokeWidth={2} dot={false} name="Divorce rate" />
                      <Line type="monotone" dataKey="abuse" stroke="#ef4444" strokeWidth={2} dot={false} name="Domestic abuse" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] font-mono text-slate-500 leading-relaxed">
                  FSC has declined from 0.72 (2019) to 0.46 (2025) — a 36% deterioration in 6 years. At this trajectory, FSC reaches the 0.40 crisis threshold in 2026–2027. Formula corrected per specification: uses weighted average to prevent FSC from going negative.
                </p>
              </div>
            </div>
          )}

          {/* ── YOUTH DRIFT ── */}
          {activeTab === 'YOUTH' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Youth Marginalization Indicators — Current vs Threshold</div>
                <div className="space-y-3">
                  {youthData.map((ind, i) => {
                    const ratio = ind.value / ind.threshold;
                    const isWarn = ratio > 1.2;
                    return (
                      <div key={i} className={cn('p-3 rounded-xl border space-y-1.5', isWarn ? 'border-orange-500/20 bg-orange-500/5' : 'border-intel-border')}>
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-white">{ind.indicator}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-600">Threshold: {ind.threshold}{ind.unit}</span>
                            <span className={cn('font-bold', isWarn ? 'text-orange-400' : 'text-emerald-400')}>
                              Now: {ind.value}{ind.unit}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', isWarn ? 'bg-orange-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min(100, ratio * 50)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass rounded-xl p-5 border border-orange-500/20 bg-orange-500/5 space-y-2">
                <div className="text-[10px] font-mono text-orange-400 uppercase font-bold">Youth Drift → DIC Contribution</div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  Youth unemployment (35%) is the primary DIC amplifier. DIC = EconomicStress × SBI × YouthUnemploymentRate. At 35% youth unemployment, even moderate SBI and economic stress produces ignition-level DIC. The Harraga signal (sea crossing attempts) is the most operationally significant — it measures the population's willingness to risk death to escape. At 142 incidents/month, this is at the highest recorded level since 2011.
                </p>
              </div>
            </div>
          )}

          {/* ── CRIME TAXONOMY ── */}
          {activeTab === 'CRIME' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">4-Class Crime Taxonomy — SBDE Classification System</div>
                <div className="space-y-4">
                  {crimeClassData.map((c, i) => (
                    <div key={i} className="p-4 rounded-xl border space-y-3" style={{ borderColor: `${c.color}30`, backgroundColor: `${c.color}08` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono" style={{ color: c.color }}>{c.class}</span>
                        <div className="flex items-center gap-2">
                          <RiskBadge level={c.severity} />
                          <span className={cn('text-[9px] font-mono font-bold', c.trend.includes('↑↑') ? 'text-red-400' : 'text-orange-400')}>{c.trend}</span>
                        </div>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400">{c.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {c.indicators.map(ind => (
                          <span key={ind} className="text-[8px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-500">{ind}</span>
                        ))}
                      </div>
                      <div className="text-[8px] font-mono text-slate-600">RRI Input: <span className="text-slate-400">{c.rri_input}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Crime Class Monthly Trend</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crimeTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="classA" fill="#f97316" fillOpacity={0.7} radius={[0,0,0,0]} name="A: Survival" />
                      <Bar dataKey="classB" fill="#8b5cf6" fillOpacity={0.7} radius={[0,0,0,0]} name="B: Organized" />
                      <Bar dataKey="classC" fill="#ef4444" fillOpacity={0.7} radius={[0,0,0,0]} name="C: Political" />
                      <Bar dataKey="classD" fill="#dc2626" radius={[2,2,0,0]} name="D: Collapse" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── VICE ECONOMY ── */}
          {activeTab === 'VICE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-slate-700 bg-slate-900 text-[10px] font-mono text-slate-400 leading-relaxed">
                <span className="text-slate-300 font-bold">ANALYTICAL FRAMING:</span> The Vice Economy domain tracks informal economic activity driven by structural distress — not population characteristics. All indicators are attributed to systemic conditions (unemployment, marginalization, lack of alternatives), not to individuals or communities. Consistent with SBDE Specification §13 ethical constraints.
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Structural Distress Economy — Proxy Indicators</div>
                <div className="space-y-3">
                  {viceEconomyData.map((ind, i) => (
                    <div key={i} className="p-4 rounded-xl border border-intel-border space-y-2 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white">{ind.indicator}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-mono font-bold', ind.trend === '↑↑' ? 'text-red-400' : ind.trend === '↑' ? 'text-orange-400' : 'text-slate-400')}>{ind.trend}</span>
                          <span className="text-[9px] font-mono font-bold text-slate-300">{ind.proxy_idx.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', ind.proxy_idx > 0.6 ? 'bg-red-500/60' : ind.proxy_idx > 0.4 ? 'bg-orange-500/60' : 'bg-yellow-500/60')}
                          style={{ width: `${ind.proxy_idx * 100}%` }} />
                      </div>
                      <div className="text-[8px] font-mono text-slate-600">Concentration: {ind.gov}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MENTAL HEALTH ── */}
          {activeTab === 'MENTAL' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Mental Health Proxy Trend — Hospitalization · Substance · Crisis Calls</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mentalHealthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="hosp" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="calls" orientation="right" domain={[250, 420]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="hospitalization" yAxisId="hosp" fill="rgba(168,85,247,0.3)" radius={[2,2,0,0]} name="Psychiatric hospitalization" />
                      <Bar dataKey="substance" yAxisId="hosp" fill="rgba(239,68,68,0.3)" radius={[2,2,0,0]} name="Substance-related admissions" />
                      <Line type="monotone" dataKey="crisis_calls" yAxisId="calls" stroke="#00f2ff" strokeWidth={2.5} dot={{ fill: '#00f2ff', r: 3 }} name="Crisis hotline calls" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Mental Health → SBI Contribution</div>
                <p className="text-[9px] font-mono text-slate-400 leading-relaxed">
                  Mental health proxy carries 0.09 SBI weight — lowest individual weight but the most systemic indicator. A society with rising hospitalization and crisis call volumes is one where the informal support network (family, community, religious) has degraded. This correlates with FSC decline and amplifies the DIC conversion rate. Tunisia has 1 psychiatrist per 80,000 people (WHO threshold: 1 per 30,000). The treatment gap is the structural driver.
                </p>
              </div>
            </div>
          )}

          {/* ── REGIONAL HEATMAP ── */}
          {activeTab === 'REGIONAL' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Governorate Behavioral Risk Matrix — SBI × DIC Local</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Governorate', 'SBI Local', 'DIC Local', 'Dominant Signal', 'Cluster'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sbde.governorateRisk.map((g, i) => (
                        <tr key={i} className={cn('hover:bg-white/[0.02]', g.cluster === 'IGNITION' ? 'bg-red-500/5' : '')}>
                          <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-4">{g.gov}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full', g.SBI_local > 0.7 ? 'bg-red-500' : g.SBI_local > 0.55 ? 'bg-orange-500' : 'bg-yellow-500')}
                                  style={{ width: `${g.SBI_local * 100}%` }} />
                              </div>
                              <span className={cn('text-[9px] font-mono font-bold', g.SBI_local > 0.7 ? 'text-red-400' : 'text-orange-400')}>{g.SBI_local.toFixed(3)}</span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={cn('text-[9px] font-mono font-bold', g.DIC_local > 0.2 ? 'text-red-400' : g.DIC_local > 0.15 ? 'text-orange-400' : 'text-yellow-400')}>
                              {g.DIC_local.toFixed(3)}
                            </span>
                          </td>
                          <td className="py-2.5 text-[9px] font-mono text-slate-500 pr-4">{g.dominant_signal}</td>
                          <td className="py-2.5">
                            <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase',
                              g.cluster === 'IGNITION' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                              g.cluster === 'ELEVATED' ? 'text-orange-400 border-orange-400/30 bg-orange-400/10' :
                              g.cluster === 'MEDIUM' ? 'text-yellow-400 border-yellow-400/30' :
                              'text-emerald-400 border-emerald-400/30'
                            )}>{g.cluster}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Composite SBI × DIC — Governorate Ranking</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sbde.governorateRisk.map(g => ({ gov: g.gov, composite: parseFloat(((g.SBI_local + g.DIC_local) / 2).toFixed(3)), cluster: g.cluster }))} layout="vertical" margin={{ left: 75 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0, 0.8]} />
                      <YAxis type="category" dataKey="gov" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={75} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [v, 'Composite SBI×DIC']} />
                      <Bar dataKey="composite" radius={[0, 4, 4, 0]}>
                        {sbde.governorateRisk.map((g, i) => (
                          <Cell key={i} fill={g.cluster === 'IGNITION' ? '#ef4444' : g.cluster === 'ELEVATED' ? '#f97316' : g.cluster === 'MEDIUM' ? '#f59e0b' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
