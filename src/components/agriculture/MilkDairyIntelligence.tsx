/**
 * MilkDairyIntelligence.tsx
 * TunisiaIntel — Milk & Dairy Intelligence Module
 * Agriculture Branch Phase 4
 *
 * "Dairy tells you when the system is collapsing silently."
 * Butter and milk shortages precede visible social pressure by 30–45 days.
 * The silent collapse detector of the food security chain.
 *
 * Tabs:
 *   1. Sector Dashboard — Raw milk production, dairy chain health
 *   2. Butter Crisis Monitor — Stock levels, subsidy pressure, scarcity
 *   3. Subsidy Pressure — BCT cost, fiscal ceiling, diversion
 *   4. Regional Dairy Heatmap — Governorate production vs demand
 *   5. Collapse Predictor — Silent crisis detection, early warning
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Activity, TrendingUp, TrendingDown,
  ShieldAlert, Zap, BarChart3, AlertCircle, Map as MapIcon,
  Package, Droplets, Thermometer, FlaskConical, DollarSign,
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

// ─── DAIRY SECURITY INDEX (DSI) ──────────────────────────────────────────────

function computeDSI(fpiDairy: number): {
  DSI: number; butterStockDays: number; milkProductionIndex: number;
  collapseRisk: number; alertLevel: 1 | 2 | 3 | 4 | 5;
} {
  const feedPressure = Math.max(0, fpiDairy - 1.0);
  const milkProductionIndex = Math.max(0.55, 1 - feedPressure * 0.5);
  const butterStockDays = Math.max(4, 22 - feedPressure * 40);
  const DSI = Math.min(1, feedPressure * 1.1 + 0.08);
  const collapseRisk = Math.min(1, DSI * 1.3 * (butterStockDays < 14 ? 1.4 : 1));
  const alertLevel: 1 | 2 | 3 | 4 | 5 =
    collapseRisk > 0.8 ? 5 :
    collapseRisk > 0.6 ? 4 :
    collapseRisk > 0.4 ? 3 :
    collapseRisk > 0.2 ? 2 : 1;
  return { DSI, butterStockDays, milkProductionIndex, collapseRisk, alertLevel };
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const dairyAlerts = [
  { code: 'DAIRY-BUTTER-01', title: 'Butter stock at 14 days — below 21-day security threshold', impact: 'CRITICAL' },
  { code: 'DAIRY-MILK-02', title: 'Raw milk collection −22% in interior governorates — feed cost driver', impact: 'HIGH' },
  { code: 'DAIRY-SUB-03', title: 'Dairy subsidy burden 285M TND — 47% above 2023 baseline', impact: 'HIGH' },
  { code: 'DAIRY-CHEESE-04', title: 'Processed cheese: factory production cut 30% — import comp. unavailable', impact: 'HIGH' },
];

const milkProductionTrend = [
  { month: 'Oct', collection_ML: 138, target_ML: 155, fat_content: 3.6, price_farm: 0.620 },
  { month: 'Nov', collection_ML: 132, target_ML: 155, fat_content: 3.5, price_farm: 0.638 },
  { month: 'Dec', collection_ML: 124, target_ML: 155, fat_content: 3.4, price_farm: 0.660 },
  { month: 'Jan', collection_ML: 118, target_ML: 155, fat_content: 3.3, price_farm: 0.685 },
  { month: 'Feb', collection_ML: 112, target_ML: 155, fat_content: 3.2, price_farm: 0.710 },
  { month: 'Mar', collection_ML: 108, target_ML: 155, fat_content: 3.1, price_farm: 0.738 },
];

const butterStockTrend = [
  { week: 'W1 Jan', stock_t: 2840, critical: 2000, days: 28 },
  { week: 'W2 Jan', stock_t: 2620, critical: 2000, days: 24 },
  { week: 'W3 Jan', stock_t: 2380, critical: 2000, days: 22 },
  { week: 'W4 Jan', stock_t: 2140, critical: 2000, days: 19 },
  { week: 'W1 Feb', stock_t: 1920, critical: 2000, days: 16 },
  { week: 'W2 Feb', stock_t: 1680, critical: 2000, days: 14 },
  { week: 'W3 Feb', stock_t: 1520, critical: 2000, days: 12 },
  { week: 'W4 Feb', stock_t: 1380, critical: 2000, days: 11 },
];

const dairyPriceTracker = [
  { product: 'Raw Milk (farm)', official: 0.620, market: 0.738, unit: 'TND/L', distortion: 19 },
  { product: 'Pasteurized Milk (1L)', official: 1.150, market: 1.820, unit: 'TND', distortion: 58 },
  { product: 'Butter (250g)', official: 2.100, market: 3.900, unit: 'TND', distortion: 86 },
  { product: 'Yogurt (unit)', official: 0.650, market: 1.050, unit: 'TND', distortion: 62 },
  { product: 'Processed Cheese', official: 3.200, market: 5.800, unit: 'TND', distortion: 81 },
  { product: 'Fresh Cheese', official: 4.800, market: 7.200, unit: 'TND', distortion: 50 },
];

const subsidyCostData = [
  { year: '2020', dairy_mTND: 148, target_mTND: 160 },
  { year: '2021', dairy_mTND: 174, target_mTND: 160 },
  { year: '2022', dairy_mTND: 208, target_mTND: 160 },
  { year: '2023', dairy_mTND: 194, target_mTND: 160 },
  { year: '2024', dairy_mTND: 248, target_mTND: 160 },
  { year: '2025', dairy_mTND: 285, target_mTND: 160 },
];

const govDairyData = [
  { gov: 'Béja', production_ML: 22.4, demand_ML: 14.2, surplus: 8.2, risk: 'LOW' },
  { gov: 'Jendouba', production_ML: 18.8, demand_ML: 12.4, surplus: 6.4, risk: 'LOW' },
  { gov: 'Siliana', production_ML: 14.2, demand_ML: 10.8, surplus: 3.4, risk: 'LOW' },
  { gov: 'Le Kef', production_ML: 12.8, demand_ML: 10.2, surplus: 2.6, risk: 'MEDIUM' },
  { gov: 'Bizerte', production_ML: 10.4, demand_ML: 9.8, surplus: 0.6, risk: 'MEDIUM' },
  { gov: 'Nabeul', production_ML: 8.2, demand_ML: 12.4, surplus: -4.2, risk: 'HIGH' },
  { gov: 'Tunis', production_ML: 4.8, demand_ML: 22.8, surplus: -18.0, risk: 'CRITICAL' },
  { gov: 'Sfax', production_ML: 6.2, demand_ML: 14.4, surplus: -8.2, risk: 'CRITICAL' },
  { gov: 'Kasserine', production_ML: 7.4, demand_ML: 9.2, surplus: -1.8, risk: 'HIGH' },
  { gov: 'Sidi Bouzid', production_ML: 8.8, demand_ML: 10.4, surplus: -1.6, risk: 'HIGH' },
];

const collapseIndicators = [
  { indicator: 'Butter Stock Days', current: 14, warning: 21, crisis: 10, unit: 'd', direction: 'down' },
  { indicator: 'Milk Collection vs Target', current: 70, warning: 80, crisis: 65, unit: '%', direction: 'down' },
  { indicator: 'Farm Gate Price', current: 0.738, warning: 0.700, crisis: 0.750, unit: 'TND/L', direction: 'up' },
  { indicator: 'Dairy Subsidy Burden', current: 285, warning: 220, crisis: 300, unit: 'M TND', direction: 'up' },
  { indicator: 'BM Price Distortion (Butter)', current: 86, warning: 50, crisis: 100, unit: '%', direction: 'up' },
  { indicator: 'Factory Utilization', current: 68, warning: 75, crisis: 60, unit: '%', direction: 'down' },
];

const silentCollapseTimeline = [
  { day: 'D−45', signal: 'Farm gate milk price rises 15% above official', visibility: 'INVISIBLE', type: 'Economic' },
  { day: 'D−38', signal: 'Rural collection centers reduce pickup frequency', visibility: 'LOW', type: 'Logistics' },
  { day: 'D−30', signal: 'Butter factory output cut 20%', visibility: 'LOW', type: 'Production' },
  { day: 'D−21', signal: 'Butter stock falls below 21-day threshold', visibility: 'LOW', type: 'Stock' },
  { day: 'D−14', signal: 'Retail butter shortages in interior governorates', visibility: 'MEDIUM', type: 'Retail' },
  { day: 'D−7', signal: 'Urban supermarket empty shelves', visibility: 'HIGH', type: 'Retail' },
  { day: 'D0', signal: '"Mafama zebda" OSINT surge — social media', visibility: 'CRITICAL', type: 'Social' },
  { day: 'D+3', signal: 'Queue protests at distribution points', visibility: 'CRITICAL', type: 'Security' },
  { day: 'D+7', signal: 'RRI S.1 Public Pressure spike — EQ.4 activation', visibility: 'CRITICAL', type: 'RRI' },
];

const osintDairy = [
  { term: '"mafama zebda"', ar: 'ما فاماش زبدة', meaning: 'No butter — primary scarcity signal', vel: '+342%', heat: 'CRITICAL' },
  { term: '"7lib ghali"', ar: 'حليب غالي', meaning: 'Milk expensive', vel: '+218%', heat: 'CRITICAL' },
  { term: '"zebda essouq"', ar: 'زبدة السوق', meaning: 'Market butter (informal)', vel: '+184%', heat: 'HIGH' },
  { term: '"mafama 7lib"', ar: 'ما فاماش حليب', meaning: 'No milk in stores', vel: '+156%', heat: 'HIGH' },
  { term: '"jben ghali"', ar: 'جبن غالي', meaning: 'Cheese expensive', vel: '+112%', heat: 'MEDIUM' },
];

const TABS = [
  { id: 'SECTOR', label: 'Sector Dashboard', icon: BarChart3 },
  { id: 'BUTTER', label: 'Butter Crisis', icon: AlertTriangle },
  { id: 'SUBSIDY', label: 'Subsidy Pressure', icon: DollarSign },
  { id: 'REGIONAL', label: 'Regional Heatmap', icon: MapIcon },
  { id: 'COLLAPSE', label: 'Collapse Predictor', icon: FlaskConical },
] as const;

type TabId = typeof TABS[number]['id'];

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    CRITICAL: 'text-red-400 border-red-400/30 bg-red-400/10',
    HIGH: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    LOW: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
    INVISIBLE: 'text-slate-500 border-slate-700 bg-slate-800/50',
  };
  return <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase', map[level] || 'text-slate-500 border-slate-700')}>{level}</span>;
};

const KpiCard: React.FC<{ label: string; value: string; sub: string; warn?: boolean; color?: string }> = ({
  label, value, sub, warn, color = 'text-blue-400',
}) => (
  <div className={cn('glass rounded-xl border p-4 space-y-2', warn ? 'border-red-500/30 bg-red-500/5' : 'border-intel-border')}>
    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
    <div className={cn('text-2xl font-bold font-mono', warn ? 'text-red-400' : color)}>{value}</div>
    <div className="text-[9px] font-mono text-slate-600">{sub}</div>
  </div>
);

export const MilkDairyIntelligence: React.FC = () => {
  const { fullData: data } = useRiskMetrics();
  const [activeTab, setActiveTab] = useState<TabId>('SECTOR');

  const fxStress = (data as any)?.economy?.fx_reserves
    ? Math.max(0.3, 1 - (data as any).economy.fx_reserves / 200)
    : 0.68;
  const indices = useMemo(() => computeFeedIndices({ ...BASE_FEED, fx_stress: fxStress }), [fxStress]);
  const { DSI, butterStockDays, milkProductionIndex, collapseRisk, alertLevel } = computeDSI(indices.FPI_dairy);

  const alertColors: Record<number, string> = {
    1: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    2: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400',
    3: 'border-orange-400/30 bg-orange-400/10 text-orange-400',
    4: 'border-red-500/30 bg-red-500/10 text-red-400',
    5: 'border-white/20 bg-black text-white',
  };

  return (
    <div className="p-3 md:p-4 space-y-6 relative pb-10">
      <BackgroundGrid />
      <ModuleHeader
        title="Milk & Dairy Intelligence"
        subtitle="Silent collapse detector — DSI · Butter crisis · Raw milk production · Subsidy pressure"
        icon={Droplets}
        nodeId="AGRI-DAIRY-01"
      />

      {/* Alert banner */}
      <div className={cn('rounded-xl border p-4 flex items-center justify-between', alertColors[alertLevel])}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-[11px] font-bold font-mono uppercase tracking-widest">
              Dairy Security Index — {['', 'STABLE', 'WATCH', 'PRESSURE', 'CRISIS', 'SILENT COLLAPSE'][alertLevel]}
            </div>
            <div className="text-[9px] font-mono opacity-70 mt-0.5">
              DSI={DSI.toFixed(3)} · Butter stocks={butterStockDays.toFixed(0)}d · Collapse risk={collapseRisk.toFixed(3)}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[9px] font-mono opacity-60">
          <span>Milk output: <b>{(milkProductionIndex * 100).toFixed(0)}%</b></span>
          <span>Butter: <b className={butterStockDays < 14 ? 'text-red-400' : ''}>{butterStockDays.toFixed(0)}d stock</b></span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Dairy Security Index" value={DSI.toFixed(3)} sub={`Level ${alertLevel}/5`} warn={DSI > 0.4} />
        <KpiCard label="Butter Stock Days" value={`${butterStockDays.toFixed(0)}d`} sub="vs 21d security threshold" warn={butterStockDays < 14} />
        <KpiCard label="Milk Production Index" value={`${(milkProductionIndex * 100).toFixed(0)}%`} sub="vs seasonal target" warn={milkProductionIndex < 0.75} />
        <KpiCard label="Collapse Risk Score" value={collapseRisk.toFixed(3)} sub="Silent crisis probability" warn={collapseRisk > 0.5} />
      </div>

      <LiveTicker items={dairyAlerts} />

      {/* Tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-0 z-40 bg-black/40 backdrop-blur-xl p-2 rounded-xl border border-white/5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border',
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
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
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Raw Milk Collection — Actual vs Target (ML) + Farm Gate Price</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={milkProductionTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="ml" domain={[90, 165]} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="price" orientation="right" domain={[0.58, 0.80]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={155} yAxisId="ml" stroke="rgba(0,242,255,0.3)" strokeDasharray="4 4" label={{ value: 'Target', position: 'right', fill: '#00f2ff', fontSize: 7 }} />
                      <Bar dataKey="collection_ML" yAxisId="ml" fill="rgba(59,130,246,0.4)" radius={[2,2,0,0]} name="Actual collection (ML)" />
                      <Line type="monotone" dataKey="target_ML" yAxisId="ml" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Target (ML)" />
                      <Line type="monotone" dataKey="price_farm" yAxisId="price" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} name="Farm gate price (TND/L)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dairy price tracker */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Dairy Product Price Distortion — Official vs Market</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Product', 'Official', 'Market', 'Unit', 'Distortion', 'Status'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dairyPriceTracker.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-4">{p.product}</td>
                          <td className="py-2.5 text-[9px] font-mono text-intel-cyan pr-4">{p.official}</td>
                          <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-4">{p.market}</td>
                          <td className="py-2.5 text-[9px] font-mono text-slate-500 pr-4">{p.unit}</td>
                          <td className="py-2.5 pr-4">
                            <span className={cn('text-[10px] font-mono font-bold', p.distortion > 70 ? 'text-red-400' : p.distortion > 50 ? 'text-orange-400' : 'text-yellow-400')}>
                              +{p.distortion}%
                            </span>
                          </td>
                          <td className="py-2.5"><RiskBadge level={p.distortion > 70 ? 'CRITICAL' : p.distortion > 50 ? 'HIGH' : 'MEDIUM'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BUTTER CRISIS MONITOR */}
          {activeTab === 'BUTTER' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-4">
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">Butter National Stock — Depletion Trend</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={butterStockTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 7, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="stock" domain={[1000, 3200]} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="days" orientation="right" domain={[0, 35]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={2000} yAxisId="stock" stroke="rgba(239,68,68,0.5)" strokeDasharray="4 4" label={{ value: 'Critical', position: 'right', fill: '#ef4444', fontSize: 7 }} />
                      <Area type="monotone" dataKey="stock_t" yAxisId="stock" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={2} name="Stock (tonnes)" />
                      <Line type="monotone" dataKey="days" yAxisId="days" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} name="Days of supply" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-[9px] font-mono text-red-400 leading-relaxed">
                    ⚠ At current depletion rate (−160t/week), butter stocks reach 0 in <b>8–9 weeks</b>. Below 14 days of supply, retail shortages become visible. Below 7 days: OSINT surge + queue incidents. The system crossed 2,000t (critical) threshold last week.
                  </p>
                </div>
              </div>

              {/* Butter OSINT */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Butter Scarcity OSINT — Dialect Intercepts</div>
                <div className="divide-y divide-white/5">
                  {osintDairy.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 hover:bg-white/[0.02]">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0', s.heat === 'CRITICAL' ? 'bg-red-500/20' : 'bg-orange-500/20')}>🧈</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-white">{s.term} <span className="text-slate-600 text-[9px]" dir="rtl">{s.ar}</span></div>
                        <div className="text-[8px] font-mono text-slate-500">{s.meaning}</div>
                      </div>
                      <RiskBadge level={s.heat} />
                      <span className={cn('text-[9px] font-mono font-bold shrink-0', s.heat === 'CRITICAL' ? 'text-red-400' : 'text-orange-400')}>{s.vel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBSIDY PRESSURE */}
          {activeTab === 'SUBSIDY' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Dairy Subsidy Burden — Actual vs BCT Target (M TND/year)</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={subsidyCostData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${v}M TND`]} />
                      <Bar dataKey="dairy_mTND" fill="rgba(59,130,246,0.5)" radius={[2,2,0,0]} name="Dairy subsidy cost" />
                      <Line type="monotone" dataKey="target_mTND" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="BCT ceiling" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: '2025 Dairy Subsidy', value: '285M TND', sub: '+78% vs target', warn: true },
                  { label: 'IMF Reduction Target', value: '160M TND', sub: 'By 2027 per conditionality', warn: false, color: 'text-slate-400' },
                  { label: 'Diversion Estimated', value: '38%', sub: 'Of subsidized milk', warn: true },
                ].map((k, i) => (
                  <KpiCard key={i} label={k.label} value={k.value} sub={k.sub} warn={k.warn} color={(k as any).color} />
                ))}
              </div>

              <div className="glass rounded-xl p-5 border border-orange-500/20 bg-orange-500/5 space-y-2">
                <div className="text-[10px] font-mono text-orange-400 uppercase font-bold tracking-widest">IMF Conditionality Risk</div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  IMF program requires dairy subsidy reduction from 285M to 160M TND by 2027. A sudden cut triggers immediate farm gate price collapse → herd liquidation → 3-year recovery cycle. A gradual cut risks visible retail price increases of 40–60% on milk and butter. Either path increases <span className="text-orange-400">social contract breach probability</span> (EQ.E4) from current 0.42 → estimated 0.68 if implemented without household income compensation.
                </p>
              </div>
            </div>
          )}

          {/* REGIONAL HEATMAP */}
          {activeTab === 'REGIONAL' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Milk Production vs Demand by Governorate (ML/month)</div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={govDairyData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis type="category" dataKey="gov" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                        formatter={(v: any, name) => [`${v} ML`, name]} />
                      <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                      <Bar dataKey="surplus" radius={[0,4,4,0]} name="Surplus/Deficit (ML)">
                        {govDairyData.map((entry, i) => (
                          <Cell key={i} fill={entry.surplus < -5 ? '#ef4444' : entry.surplus < 0 ? '#f97316' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 text-[9px] font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /><span className="text-slate-500">Surplus</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" /><span className="text-slate-500">Small deficit</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /><span className="text-slate-500">Critical deficit</span></span>
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Governorate Supply Risk Table</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Governorate', 'Production ML', 'Demand ML', 'Surplus/Deficit', 'Risk'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {govDairyData.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2 text-[10px] font-mono font-bold text-white pr-4">{row.gov}</td>
                          <td className="py-2 text-[9px] font-mono text-emerald-400 pr-4">{row.production_ML}</td>
                          <td className="py-2 text-[9px] font-mono text-slate-400 pr-4">{row.demand_ML}</td>
                          <td className="py-2 pr-4">
                            <span className={cn('text-[9px] font-mono font-bold', row.surplus < -5 ? 'text-red-400' : row.surplus < 0 ? 'text-orange-400' : 'text-emerald-400')}>
                              {row.surplus > 0 ? '+' : ''}{row.surplus.toFixed(1)} ML
                            </span>
                          </td>
                          <td className="py-2"><RiskBadge level={row.risk} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* COLLAPSE PREDICTOR */}
          {activeTab === 'COLLAPSE' && (
            <div className="space-y-6">
              {/* Indicators */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Silent Collapse Indicators — Current vs Thresholds</div>
                <div className="space-y-3">
                  {collapseIndicators.map((ind, i) => {
                    const isWarning = ind.direction === 'down'
                      ? ind.current < ind.warning
                      : ind.current > ind.warning;
                    const isCrisis = ind.direction === 'down'
                      ? ind.current < ind.crisis
                      : ind.current > ind.crisis;
                    const pct = ind.direction === 'down'
                      ? Math.min(100, ((ind.warning - ind.current) / (ind.warning - ind.crisis + 0.001)) * 100)
                      : Math.min(100, ((ind.current - ind.warning) / (ind.crisis - ind.warning + 0.001)) * 100);
                    return (
                      <div key={i} className={cn('p-3 rounded-xl border space-y-2', isCrisis ? 'border-red-500/30 bg-red-500/5' : isWarning ? 'border-orange-500/20' : 'border-intel-border')}>
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <span className="text-white">{ind.indicator}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">Warn: {ind.warning}{ind.unit}</span>
                            <span className="text-slate-600">Crisis: {ind.crisis}{ind.unit}</span>
                            <span className={cn('font-bold', isCrisis ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-emerald-400')}>
                              Now: {ind.current}{ind.unit}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', isCrisis ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.max(5, Math.min(100, pct))}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Silent collapse timeline */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Silent Collapse Timeline — Dairy Crisis Progression</div>
                <div className="space-y-2">
                  {silentCollapseTimeline.map((step, i) => {
                    const isPast = ['D−45', 'D−38', 'D−30', 'D−21'].includes(step.day);
                    const isCurrent = step.day === 'D−14';
                    return (
                      <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl border transition-all',
                        isCurrent ? 'border-orange-500/40 bg-orange-500/10' :
                        isPast ? 'border-white/5 bg-black/20 opacity-60' :
                        'border-intel-border'
                      )}>
                        <div className="flex flex-col items-center shrink-0 w-12">
                          <span className={cn('text-[9px] font-mono font-bold', isCurrent ? 'text-orange-400' : isPast ? 'text-slate-600' : 'text-slate-500')}>{step.day}</span>
                          {i < silentCollapseTimeline.length - 1 && <div className="w-px h-4 bg-white/10 mt-1" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn('text-[9px] font-mono font-bold', isCurrent ? 'text-orange-400' : isPast ? 'text-slate-600' : 'text-white')}>{step.signal}</span>
                            {isCurrent && <span className="text-[7px] font-mono text-orange-400 border border-orange-400/30 px-1 rounded animate-pulse">NOW</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={step.visibility} />
                            <span className="text-[8px] font-mono text-slate-600">{step.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RRI linkage */}
              <div className="glass rounded-xl p-5 border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="text-[10px] font-mono text-blue-400 uppercase font-bold tracking-widest">RRI Linkage — Dairy → Political Pressure Chain</div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  Dairy collapse is the most politically dangerous food crisis because it is <span className="text-blue-400 font-bold">invisible until day 0</span>. Policymakers have no warning. The system goes from "stable" to "queue incidents" in 7 days. This module serves as the early warning layer that standard economic monitoring misses entirely. At current trajectory: <span className="text-orange-400">butter crisis visible in 3–4 weeks</span>. RRI inputs affected: <span className="text-blue-400">A.12 Supply Squeeze</span>, <span className="text-blue-400">A.14 Market Distortion</span>, and <span className="text-blue-400">S.1 Public Pressure</span> (EQ.15 compound stress coupling).
                </p>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
