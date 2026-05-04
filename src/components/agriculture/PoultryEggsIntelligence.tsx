/**
 * PoultryEggsIntelligence.tsx
 * TunisiaIntel — Poultry & Eggs Intelligence Module
 * Agriculture Branch Phase 2
 *
 * Fastest social stability signal in the agriculture chain.
 * FPI shock → farm exits → egg scarcity → household stress → protest
 * Lag: 7–14 days from feed shock to street impact.
 *
 * Tabs:
 *   1. Sector Dashboard — ESI, farm exits, production cycle
 *   2. Egg Crisis Monitor — Price, availability, scarcity heatmap
 *   3. Disease & Biosecurity — Avian flu risk, mortality index
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Activity, TrendingUp, TrendingDown,
  ShieldAlert, Zap, BarChart3, FlaskConical, AlertCircle,
  CheckCircle2, Thermometer, Map as MapIcon,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { BackgroundGrid, ModuleHeader, LiveTicker } from '../shared/ProfessionalShared';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { BASE_FEED, computeFeedIndices } from '../agriculture/FeedIntelligenceHub';
import { cn } from '../../utils/cn';

// ─── ESI CALCULATION ─────────────────────────────────────────────────────────
// Egg Security Index = f(feed_cost_pressure, farm_survival_rate,
//                       production_trend, import_buffer, seasonal_demand)

function computeESI(fpiPoultry: number): {
  ESI: number; farmExitRate: number; productionIndex: number;
  alertLevel: 1 | 2 | 3 | 4;
} {
  const feedPressure = Math.max(0, fpiPoultry - 1.0);
  const farmExitRate = Math.min(0.35, feedPressure * 0.8);
  const productionIndex = Math.max(0.55, 1 - feedPressure * 0.6);
  const ESI = Math.min(1, feedPressure * 1.2 + 0.1);
  const alertLevel: 1 | 2 | 3 | 4 =
    ESI > 0.7 ? 4 : ESI > 0.5 ? 3 : ESI > 0.3 ? 2 : 1;
  return { ESI, farmExitRate, productionIndex, alertLevel };
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const poultryAlerts = [
  { code: 'PLTRY-ESI-01', title: 'Egg Security Index elevated — production -18% vs seasonal norm', impact: 'CRITICAL' },
  { code: 'PLTRY-EXIT-02', title: 'Farm exit rate rising — small integrators (<5000 birds) hardest hit', impact: 'HIGH' },
  { code: 'PLTRY-PRICE-03', title: 'Egg wholesale price +28% — retail impact within 5 days', impact: 'HIGH' },
  { code: 'PLTRY-DISEASE-04', title: 'Avian flu alert: H5N1 detected in Medjez el-Bab — quarantine active', impact: 'HIGH' },
];

const productionTrend = [
  { month: 'Oct', production: 98, farms_active: 2840, avg_price: 0.310 },
  { month: 'Nov', production: 95, farms_active: 2810, avg_price: 0.325 },
  { month: 'Dec', production: 91, farms_active: 2770, avg_price: 0.340 },
  { month: 'Jan', production: 88, farms_active: 2720, avg_price: 0.362 },
  { month: 'Feb', production: 84, farms_active: 2680, avg_price: 0.381 },
  { month: 'Mar', production: 80, farms_active: 2630, avg_price: 0.398 },
];

const eggPriceData = [
  { week: 'W1 Feb', wholesale: 0.365, retail: 0.420, black_market: 0.580 },
  { week: 'W2 Feb', wholesale: 0.372, retail: 0.428, black_market: 0.590 },
  { week: 'W3 Feb', wholesale: 0.381, retail: 0.438, black_market: 0.615 },
  { week: 'W4 Feb', wholesale: 0.390, retail: 0.448, black_market: 0.630 },
  { week: 'W1 Mar', wholesale: 0.398, retail: 0.458, black_market: 0.650 },
  { week: 'W2 Mar', wholesale: 0.410, retail: 0.472, black_market: 0.680 },
];

const farmSizeImpact = [
  { size: 'Large (>50k birds)', exit_risk: 12, feed_cost_pct: 62, survival: 'HIGH' },
  { size: 'Medium (10–50k)', exit_risk: 28, feed_cost_pct: 68, survival: 'MEDIUM' },
  { size: 'Small (1–10k)', exit_risk: 45, feed_cost_pct: 74, survival: 'LOW' },
  { size: 'Micro (<1k birds)', exit_risk: 68, feed_cost_pct: 81, survival: 'CRITICAL' },
];

const govProduction = [
  { gov: 'Ariana', index: 92, risk: 'LOW', birds_k: 8400 },
  { gov: 'Ben Arous', index: 88, risk: 'LOW', birds_k: 7200 },
  { gov: 'Bizerte', index: 84, risk: 'MEDIUM', birds_k: 5800 },
  { gov: 'Nabeul', index: 81, risk: 'MEDIUM', birds_k: 6100 },
  { gov: 'Béja', index: 76, risk: 'MEDIUM', birds_k: 4200 },
  { gov: 'Siliana', index: 68, risk: 'HIGH', birds_k: 2800 },
  { gov: 'Kasserine', index: 54, risk: 'HIGH', birds_k: 1900 },
  { gov: 'Sidi Bouzid', index: 48, risk: 'CRITICAL', birds_k: 1400 },
];

const diseaseRisk = [
  { gov: 'Béja', h5n1_risk: 0.82, bio_security: 0.44, mortality_idx: 0.38, status: 'QUARANTINE' },
  { gov: 'Jendouba', h5n1_risk: 0.71, bio_security: 0.48, mortality_idx: 0.31, status: 'ALERT' },
  { gov: 'Bizerte', h5n1_risk: 0.58, bio_security: 0.55, mortality_idx: 0.24, status: 'WATCH' },
  { gov: 'Ariana', h5n1_risk: 0.44, bio_security: 0.68, mortality_idx: 0.18, status: 'MONITOR' },
  { gov: 'Ben Arous', h5n1_risk: 0.38, bio_security: 0.72, mortality_idx: 0.14, status: 'MONITOR' },
];

const mortalityTrend = [
  { week: 'W1', normal: 2.1, current: 2.8 },
  { week: 'W2', normal: 2.1, current: 3.2 },
  { week: 'W3', normal: 2.1, current: 4.1 },
  { week: 'W4', normal: 2.1, current: 5.8 },
  { week: 'W5', normal: 2.1, current: 4.9 },
  { week: 'W6', normal: 2.1, current: 5.2 },
];

const TABS = [
  { id: 'SECTOR', label: 'Sector Dashboard', icon: BarChart3 },
  { id: 'EGG', label: 'Egg Crisis Monitor', icon: AlertTriangle },
  { id: 'DISEASE', label: 'Disease & Biosecurity', icon: ShieldAlert },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    CRITICAL: 'text-red-400 border-red-400/30 bg-red-400/10',
    HIGH: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    LOW: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    QUARANTINE: 'text-red-400 border-red-400/30 bg-red-400/10',
    ALERT: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    WATCH: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    MONITOR: 'text-slate-400 border-slate-600 bg-slate-800/50',
  };
  return <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase', map[level] || 'text-slate-500 border-slate-700')}>{level}</span>;
};

const KpiCard: React.FC<{ label: string; value: string; sub: string; warn?: boolean; color?: string }> = ({
  label, value, sub, warn, color = 'text-orange-400',
}) => (
  <div className={cn('glass rounded-xl border p-4 space-y-2', warn ? 'border-red-500/30 bg-red-500/5' : 'border-intel-border')}>
    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
    <div className={cn('text-2xl font-bold font-mono', warn ? 'text-red-400' : color)}>{value}</div>
    <div className="text-[9px] font-mono text-slate-600">{sub}</div>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const PoultryEggsIntelligence: React.FC = () => {
  const { fullData: data } = useRiskMetrics();
  const [activeTab, setActiveTab] = useState<TabId>('SECTOR');

  const fxStress = (data as any)?.economy?.fx_reserves
    ? Math.max(0.3, 1 - (data as any).economy.fx_reserves / 200)
    : 0.68;
  const indices = useMemo(() => computeFeedIndices({ ...BASE_FEED, fx_stress: fxStress }), [fxStress]);
  const { ESI, farmExitRate, productionIndex, alertLevel } = computeESI(indices.FPI_poultry);

  const alertColors = {
    1: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    2: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400',
    3: 'border-orange-400/30 bg-orange-400/10 text-orange-400',
    4: 'border-red-500/30 bg-red-500/10 text-red-400',
  }[alertLevel];

  return (
    <div className="p-3 md:p-4 space-y-6 relative pb-10">
      <BackgroundGrid />
      <ModuleHeader
        title="Poultry & Eggs Intelligence"
        subtitle="Egg Security Index · Farm viability · Disease biosecurity · Fastest food-to-protest signal"
        icon={Activity}
        nodeId="AGRI-PLTRY-01"
      />

      {/* Alert banner */}
      <div className={cn('rounded-xl border p-4 flex items-center justify-between', alertColors)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-[11px] font-bold font-mono uppercase tracking-widest">
              Egg Security Index — {['', 'STABLE', 'WATCH', 'PRESSURE', 'CRISIS'][alertLevel]}
            </div>
            <div className="text-[9px] font-mono opacity-70 mt-0.5">
              ESI={ESI.toFixed(3)} · FPI×Poultry={indices.FPI_poultry.toFixed(3)} · Farm Exit Rate={(farmExitRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[9px] font-mono opacity-60">
          <span>Production: <b>{(productionIndex * 100).toFixed(0)}%</b> of norm</span>
          <span>Active farms: <b>2,630</b></span>
          <span>Lag to retail: <b>5–7 days</b></span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Egg Security Index" value={ESI.toFixed(3)} sub={`Alert level ${alertLevel}/4`} warn={ESI > 0.5} />
        <KpiCard label="Farm Exit Rate" value={`${(farmExitRate * 100).toFixed(1)}%`} sub="Micro+small farms MTD" warn={farmExitRate > 0.2} />
        <KpiCard label="Production Index" value={`${(productionIndex * 100).toFixed(0)}%`} sub="vs seasonal normal" warn={productionIndex < 0.8} />
        <KpiCard label="FPI × Poultry" value={indices.FPI_poultry.toFixed(3)} sub="Sector feed cost index" warn={indices.FPI_poultry > 1.15} />
      </div>

      <LiveTicker items={poultryAlerts} />

      {/* Tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-0 z-40 bg-black/40 backdrop-blur-xl p-2 rounded-xl border border-white/5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border',
                activeTab === tab.id
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
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

          {/* SECTOR DASHBOARD */}
          {activeTab === 'SECTOR' && (
            <div className="space-y-6">
              {/* Production trend */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Production Index · Active Farms · Avg Price (6M)</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={productionTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="prod" domain={[70, 105]} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="farms" orientation="right" domain={[2500, 2900]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={85} yAxisId="prod" stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
                      <Bar dataKey="production" yAxisId="prod" fill="rgba(249,115,22,0.4)" radius={[2,2,0,0]} name="Production %" />
                      <Line type="monotone" dataKey="farms_active" yAxisId="farms" stroke="#00f2ff" strokeWidth={2} dot={false} name="Active farms" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Farm size impact */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Farm Viability by Size — Exit Risk · Feed Cost Share</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[450px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Farm Size', 'Exit Risk', 'Feed Cost %', 'Survival', 'Impact on ESI'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {farmSizeImpact.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-[10px] font-mono text-white pr-4">{row.size}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full', row.exit_risk > 50 ? 'bg-red-500' : row.exit_risk > 30 ? 'bg-orange-500' : 'bg-yellow-500')} style={{ width: `${row.exit_risk}%` }} />
                              </div>
                              <span className={cn('text-[9px] font-mono font-bold', row.exit_risk > 50 ? 'text-red-400' : row.exit_risk > 30 ? 'text-orange-400' : 'text-yellow-400')}>{row.exit_risk}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-[9px] font-mono text-orange-400 pr-4">{row.feed_cost_pct}%</td>
                          <td className="py-2.5 pr-4"><RiskBadge level={row.survival} /></td>
                          <td className="py-2.5 text-[9px] font-mono text-slate-500">
                            {row.exit_risk > 50 ? '↑ ESI +0.12' : row.exit_risk > 30 ? '↑ ESI +0.06' : '→ Marginal'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Governorate production */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Production Index by Governorate</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={govProduction} layout="vertical" margin={{ left: 75 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} unit="%" />
                      <YAxis type="category" dataKey="gov" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={75} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                        formatter={(v: any, _, p) => [`${v}% — ${p.payload.birds_k}k birds`, 'Production Index']} />
                      <Bar dataKey="index" radius={[0,4,4,0]} name="Production">
                        {govProduction.map((e, i) => (
                          <Cell key={i} fill={e.index < 55 ? '#ef4444' : e.index < 75 ? '#f97316' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* EGG CRISIS MONITOR */}
          {activeTab === 'EGG' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Egg Price Tracker — Wholesale · Retail · Black Market (TND/unit)</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={eggPriceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 7, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0.3, 0.75]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${v.toFixed(3)} TND`]} />
                      <ReferenceLine y={0.450} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: 'Crisis ceiling', position: 'right', fill: '#ef4444', fontSize: 7, fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="wholesale" stroke="#00f2ff" strokeWidth={2} dot={{ fill: '#00f2ff', r: 3 }} name="Wholesale" />
                      <Line type="monotone" dataKey="retail" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Retail" />
                      <Line type="monotone" dataKey="black_market" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Black Market" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 text-[9px] font-mono">
                  {[{ c: '#00f2ff', l: 'Wholesale' }, { c: '#f59e0b', l: 'Retail' }, { c: '#ef4444', l: 'Black Market (dashed)' }].map(({ c, l }) => (
                    <span key={l} className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block" style={{ backgroundColor: c }} /><span className="text-slate-500">{l}</span></span>
                  ))}
                </div>
              </div>

              {/* Scarcity + impact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Egg Crisis → Social Impact Chain</div>
                  <div className="space-y-3">
                    {[
                      { trigger: 'FPI×Poultry > 1.15', lag: '0d', impact: 'Farm profit margin negative', color: 'text-orange-400' },
                      { trigger: 'Farm exits +10%', lag: '7d', impact: 'Production drops 8–12%', color: 'text-orange-400' },
                      { trigger: 'Production −12%', lag: '10d', impact: 'Wholesale price +20–25%', color: 'text-red-400' },
                      { trigger: 'Retail price +25%', lag: '14d', impact: 'Household budget stress signal', color: 'text-red-400' },
                      { trigger: 'Budget stress', lag: '21d', impact: 'Social.Food_Security −0.06 RRI', color: 'text-red-400' },
                      { trigger: 'Scarcity + price spike', lag: '14d', impact: '"Mafama beydh" OSINT surge', color: 'text-red-400' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 py-1.5 border-b border-white/5 last:border-0 text-[9px] font-mono">
                        <span className="text-slate-600 w-10 shrink-0">{step.lag}</span>
                        <span className="text-white w-36 shrink-0">{step.trigger}</span>
                        <span className={step.color}>→ {step.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Egg Scarcity OSINT — Dialect Intercepts</div>
                  <div className="space-y-3">
                    {[
                      { term: '"mafama beydh"', ar: 'ما فاماش بيض', heat: 'CRITICAL', vel: '+312%' },
                      { term: '"beydh ghali"', ar: 'بيض غالي', heat: 'CRITICAL', vel: '+248%' },
                      { term: '"souk beydh"', ar: 'سوق البيض', heat: 'HIGH', vel: '+164%' },
                      { term: '"fil beidh"', ar: 'فيلة البيض', heat: 'HIGH', vel: '+118%' },
                      { term: '"djeij ghali"', ar: 'دجاج غالي', heat: 'MEDIUM', vel: '+84%' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0', s.heat === 'CRITICAL' ? 'bg-red-500/20' : 'bg-orange-500/20')}>🔥</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-white">{s.term} <span className="text-slate-600 text-[9px]" dir="rtl">{s.ar}</span></div>
                        </div>
                        <RiskBadge level={s.heat} />
                        <span className={cn('text-[9px] font-mono font-bold shrink-0', s.heat === 'CRITICAL' ? 'text-red-400' : 'text-orange-400')}>{s.vel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DISEASE & BIOSECURITY */}
          {activeTab === 'DISEASE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/8 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-[10px] font-mono text-red-400 font-bold">
                  H5N1 AVIAN FLU ALERT — Béja + Jendouba governorates under active quarantine. 48h mortality spike detected. Cross-contamination risk to Bizerte corridor.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="H5N1 Alert Govs." value="2" sub="Béja + Jendouba quarantine" warn />
                <KpiCard label="Mortality Index" value="5.8%" sub="vs 2.1% normal" warn />
                <KpiCard label="ESI Biosecurity Impact" value="+0.14" sub="Additional ESI pressure" warn />
                <KpiCard label="Vaccination Coverage" value="61%" sub="Below 80% safety threshold" color="text-orange-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Mortality Rate — Normal vs Current (%)</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mortalityTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0, 7]} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${v}%`]} />
                        <ReferenceLine y={3.5} stroke="rgba(249,115,22,0.4)" strokeDasharray="4 4" label={{ value: 'Alert', position: 'right', fill: '#f97316', fontSize: 7 }} />
                        <Area type="monotone" dataKey="current" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth={2} name="Current mortality %" />
                        <Line type="monotone" dataKey="normal" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Normal baseline" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Disease Risk Matrix by Governorate</div>
                  <div className="space-y-2">
                    {diseaseRisk.map((d, i) => (
                      <div key={i} className={cn('p-3 rounded-xl border space-y-1.5', d.status === 'QUARANTINE' ? 'border-red-500/30 bg-red-500/5' : d.status === 'ALERT' ? 'border-orange-500/20' : 'border-intel-border')}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-white">{d.gov}</span>
                          <RiskBadge level={d.status} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                          <span className="text-slate-600">H5N1 Risk: <span className={d.h5n1_risk > 0.7 ? 'text-red-400' : 'text-orange-400'}>{(d.h5n1_risk * 100).toFixed(0)}%</span></span>
                          <span className="text-slate-600">Biosec: <span className="text-slate-400">{(d.bio_security * 100).toFixed(0)}%</span></span>
                          <span className="text-slate-600">Mort. Idx: <span className={d.mortality_idx > 0.3 ? 'text-red-400' : 'text-orange-400'}>{d.mortality_idx.toFixed(2)}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
