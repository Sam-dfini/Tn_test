/**
 * FeedIntelligenceHub.tsx
 * TunisiaIntel — Feed Intelligence Hub (Central Agriculture Engine)
 *
 * Architecture: Hub-and-spoke model per Master Architecture §2.1
 * FPI, FPSI, FSI, PCV are master indices consumed by all sector pages.
 *
 * Tabs:
 *   1. Strategic Dashboard — Master KPIs, FPI, sector dependency matrix
 *   2. Import Pipeline — Port arrivals, ONAGRI stocks, FX exposure
 *   3. Fodder & Livestock — Local production, drought stress, NDVI pasture
 *   4. Feed Black Market — Subsidy diversion, informal mills, price arbitrage
 *   5. Crisis Forecast — 30/90/180d projections, protein chain vulnerability
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wheat, TrendingUp, TrendingDown, AlertTriangle, AlertCircle,
  Ship, Package, BarChart3, Map as MapIcon, FlaskConical,
  Activity, Zap, ShieldAlert, Globe, Layers, Clock,
  DollarSign, Droplets, Thermometer, ArrowRight, CheckCircle2,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine,
} from 'recharts';
import { BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';
import { usePipeline } from '../context/PipelineContext';
import { cn } from '../utils/cn';

// ─── MASTER INDICES (FPI, FPSI, FSI, PCV) ────────────────────────────────────
// These are the canonical equations from §3.3 of the Master Architecture.
// All downstream sector pages import from this module.

export interface FeedIndices {
  FPI: number;         // Feed Price Index — weighted basket
  FPSI: number;        // Feed Price Shock Index
  FSI: number;         // Feed Security Index (inverted — higher = less secure)
  PCV: number;         // Protein Chain Vulnerability
  FPI_poultry: number; // Sector-specific FPI slice
  FPI_livestock: number;
  FPI_dairy: number;
  alertLevel: 1 | 2 | 3 | 4 | 5; // Green→Black
}

// Static calibrated values (updated when live data is available)
const BASE_FEED: {
  maize_price: number; soy_price: number; barley_price: number;
  bran_price: number; hay_price: number; fx_stress: number;
  freight_factor: number; grain_stocks_days: number;
  import_reliability: number; local_fodder_output: number;
  drought_stress: number; black_market_leakage: number;
} = {
  maize_price: 520,       // TND/tonne (imported)
  soy_price: 780,         // TND/tonne
  barley_price: 410,      // TND/tonne
  bran_price: 280,        // TND/tonne (sdariet)
  hay_price: 180,         // TND/tonne (local)
  fx_stress: 0.68,        // 0-1 (BCT pressure index)
  freight_factor: 1.12,   // +12% shipping premium
  grain_stocks_days: 42,  // days of national reserve
  import_reliability: 0.62, // 0-1
  local_fodder_output: 0.44, // 0-1 (% of historical avg)
  drought_stress: 0.71,   // 0-1
  black_market_leakage: 0.38, // 38% estimated leakage
};

function computeFeedIndices(base = BASE_FEED): FeedIndices {
  // FPI = weighted basket × FX × freight
  const basket = (
    base.maize_price * 0.35 +
    base.soy_price * 0.25 +
    base.barley_price * 0.20 +
    base.bran_price * 0.12 +
    base.hay_price * 0.08
  );
  const FPI = (basket / 450) * base.fx_stress * base.freight_factor; // normalized to 1.0 baseline

  // FPSI = imported_feed_inflation + local_fodder_scarcity + fx_pressure
  const FPSI = Math.min(1, (FPI - 1) * 0.5 + (1 - base.local_fodder_output) * 0.3 + base.fx_stress * 0.2);

  // FSI = grain_stocks + import_reliability + local_fodder_output
  //       - price_shock_magnitude - drought_stress
  const FSI_raw = (base.grain_stocks_days / 90) * 0.25
    + base.import_reliability * 0.25
    + base.local_fodder_output * 0.20
    - (FPI - 1) * 0.15
    - base.drought_stress * 0.15;
  const FSI = Math.max(0, Math.min(1, 1 - FSI_raw)); // inverted: higher = less secure

  // PCV = FPI × FX_Stress × Drought_Stress × Black_Market_Leakage
  const PCV = Math.min(1, FPI * base.fx_stress * base.drought_stress * (1 + base.black_market_leakage));

  // Sector-specific FPI slices
  const FPI_poultry = FPI * 1.08;   // poultry most exposed (imported soy + maize)
  const FPI_livestock = FPI * 0.85; // livestock uses more local fodder
  const FPI_dairy = FPI * 0.92;

  // Alert level (1=Green 2=Yellow 3=Orange 4=Red 5=Black)
  let alertLevel: 1 | 2 | 3 | 4 | 5 = 1;
  if (PCV > 0.85) alertLevel = 5;
  else if (FSI > 0.7) alertLevel = 4;
  else if (FSI > 0.55) alertLevel = 3;
  else if (FSI > 0.35) alertLevel = 2;

  return { FPI, FPSI, FSI, PCV, FPI_poultry, FPI_livestock, FPI_dairy, alertLevel };
}

// Export for downstream sector pages
export const FEED_INDICES = computeFeedIndices();

// ─── SEASONAL EVENT ENGINE ────────────────────────────────────────────────────

const SEASONAL_EVENTS = [
  {
    name: 'Ramadan 2026', start: '2026-02-17', end: '2026-03-18',
    poultry: 'SPIKE+30%', meat: 'NEUTRAL', dairy: 'SPIKE+20%', feed: 'SPIKE+25%',
    active: false, daysTo: 120,
  },
  {
    name: 'Eid al-Fitr 2026', start: '2026-03-19', end: '2026-03-21',
    poultry: 'SPIKE+40%', meat: 'NEUTRAL', dairy: 'SPIKE+25%', feed: 'SPIKE+30%',
    active: false, daysTo: 142,
  },
  {
    name: 'Eid al-Adha 2026', start: '2026-06-06', end: '2026-06-08',
    poultry: 'DIP−15%', meat: 'PEAK+120%', dairy: 'NEUTRAL', feed: 'DIVERTED TO MEAT',
    active: false, daysTo: 220,
  },
  {
    name: 'Summer Heat', start: '2026-07-01', end: '2026-08-31',
    poultry: 'MORTALITY↑', meat: 'WATER STRESS', dairy: 'YIELD DROP−20%', feed: 'FODDER STRESS',
    active: false, daysTo: 255,
  },
];

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const feedAlerts = [
  { code: 'FEED-FPI-01', title: 'Feed Price Index +18% in 30d — Poultry sector critical threshold breached', impact: 'CRITICAL' },
  { code: 'FEED-GRAIN-02', title: 'National grain reserves at 42 days — below 60-day security threshold', impact: 'CRITICAL' },
  { code: 'FEED-FX-03', title: 'FX stress at 0.68 — imported feed costs rising with dinar depreciation', impact: 'HIGH' },
  { code: 'FEED-DROUGHT-04', title: 'Fodder stress: local output at 44% of historical average', impact: 'HIGH' },
  { code: 'FEED-PCV-05', title: 'Protein Chain Vulnerability elevated — multi-sector convergence risk', impact: 'HIGH' },
];

const fpiTrend = [
  { month: 'Oct', fpi: 0.94, fpsi: 0.18, fsi: 0.38 },
  { month: 'Nov', fpi: 0.98, fpsi: 0.22, fsi: 0.42 },
  { month: 'Dec', fpi: 1.04, fpsi: 0.28, fsi: 0.48 },
  { month: 'Jan', fpi: 1.08, fpsi: 0.31, fsi: 0.52 },
  { month: 'Feb', fpi: 1.12, fpsi: 0.35, fsi: 0.57 },
  { month: 'Mar', fpi: 1.18, fpsi: 0.41, fsi: 0.63 },
];

const commodityPrices = [
  { name: 'Maize (import)', price: 520, baseline: 420, change: +23.8, unit: 'TND/t', critical: true },
  { name: 'Soy (import)', price: 780, baseline: 610, change: +27.9, unit: 'TND/t', critical: true },
  { name: 'Barley (local/import)', price: 410, baseline: 360, change: +13.9, unit: 'TND/t', critical: false },
  { name: 'Bran / Sdariet', price: 280, baseline: 220, change: +27.3, unit: 'TND/t', critical: true },
  { name: 'Hay / Tibane', price: 180, baseline: 145, change: +24.1, unit: 'TND/t', critical: false },
  { name: 'Alfalfa / Fassia', price: 220, baseline: 170, change: +29.4, unit: 'TND/t', critical: false },
];

const portArrivalData = [
  { week: 'W1 Mar', maize: 12400, soy: 8200, barley: 5100 },
  { week: 'W2 Mar', maize: 9800, soy: 6100, barley: 4200 },
  { week: 'W3 Mar', maize: 11200, soy: 7400, barley: 3800 },
  { week: 'W4 Mar', maize: 8400, soy: 5200, barley: 6100 },
  { week: 'W1 Apr', maize: 7200, soy: 4100, barley: 3200 },
  { week: 'W2 Apr', maize: 6100, soy: 3800, barley: 2900 },
];

const stockLevelData = [
  { item: 'Maize', days: 38, critical: 60, status: 'CRITICAL' },
  { item: 'Soy Meal', days: 22, critical: 45, status: 'CRITICAL' },
  { item: 'Barley', days: 55, critical: 45, status: 'OK' },
  { item: 'Bran', days: 18, critical: 30, status: 'CRITICAL' },
  { item: 'Hay', days: 71, critical: 30, status: 'OK' },
  { item: 'Compound Feed', days: 14, critical: 30, status: 'CRITICAL' },
];

const importOrigins = [
  { country: 'France', share: 28, commodity: 'Barley + Wheat', risk: 'LOW' },
  { country: 'Argentina', share: 22, commodity: 'Soy Meal', risk: 'MEDIUM' },
  { country: 'Ukraine', share: 18, commodity: 'Maize + Sunflower', risk: 'HIGH' },
  { country: 'Brazil', share: 15, commodity: 'Soy + Maize', risk: 'MEDIUM' },
  { country: 'Romania', share: 10, commodity: 'Barley + Wheat', risk: 'MEDIUM' },
  { country: 'Other', share: 7, commodity: 'Mixed', risk: 'LOW' },
];

const fodderByGovernorate = [
  { gov: 'Béja', ndvi: 0.62, fodder_output: 0.71, stress: 'LOW', rain_dev: +8 },
  { gov: 'Jendouba', ndvi: 0.58, fodder_output: 0.65, stress: 'LOW', rain_dev: +4 },
  { gov: 'Siliana', ndvi: 0.44, fodder_output: 0.51, stress: 'MEDIUM', rain_dev: -12 },
  { gov: 'Le Kef', ndvi: 0.42, fodder_output: 0.48, stress: 'MEDIUM', rain_dev: -18 },
  { gov: 'Kasserine', ndvi: 0.32, fodder_output: 0.38, stress: 'HIGH', rain_dev: -31 },
  { gov: 'Sidi Bouzid', ndvi: 0.28, fodder_output: 0.31, stress: 'HIGH', rain_dev: -38 },
  { gov: 'Kairouan', ndvi: 0.26, fodder_output: 0.29, stress: 'CRITICAL', rain_dev: -44 },
  { gov: 'Gafsa', ndvi: 0.18, fodder_output: 0.21, stress: 'CRITICAL', rain_dev: -52 },
];

const blackMarketFeed = [
  { type: 'Subsidized Compound Feed', official: 280, street: 490, diversion: 42, vector: 'STIR distribution fraud', risk: 'CRITICAL' },
  { type: 'Bran (Sdariet)', official: 220, street: 340, diversion: 35, vector: 'Mill hoarding + informal sale', risk: 'HIGH' },
  { type: 'Subsidized Barley', official: 360, street: 530, diversion: 28, vector: 'Cross-border Algeria route', risk: 'HIGH' },
  { type: 'Compound Poultry Feed', official: 310, street: 510, diversion: 38, vector: 'Feed mill black market', risk: 'CRITICAL' },
  { type: 'Hay / Fodder', official: 145, street: 210, diversion: 18, vector: 'Informal farmer networks', risk: 'MEDIUM' },
];

const blackMarketOsint = [
  { term: '"3lef ghali"', arabic: 'علف غالي', meaning: 'Feed expensive — price spike signal', velocity: '+218%', heat: 'CRITICAL' },
  { term: '"mafama 3lef"', arabic: 'ما فاماش علف', meaning: 'No feed available — shortage signal', velocity: '+184%', heat: 'CRITICAL' },
  { term: '"3lef essouq"', arabic: 'علف السوق', meaning: 'Market feed (parallel supply)', velocity: '+142%', heat: 'HIGH' },
  { term: '"sdariet ghalia"', arabic: 'سداري غالية', meaning: 'Bran expensive — input cost signal', velocity: '+128%', heat: 'HIGH' },
  { term: '"mouchkel djeij"', arabic: 'مشكل دجاج', meaning: 'Chicken problem — downstream stress', velocity: '+96%', heat: 'MEDIUM' },
];

const forecastData30 = [
  { day: 'D+7', FPI: 1.19, FSI: 0.64, PCV: 0.72, FPSI: 0.42 },
  { day: 'D+14', FPI: 1.21, FSI: 0.66, PCV: 0.74, FPSI: 0.44 },
  { day: 'D+21', FPI: 1.23, FSI: 0.68, PCV: 0.76, FPSI: 0.46 },
  { day: 'D+30', FPI: 1.26, FSI: 0.71, PCV: 0.79, FPSI: 0.49 },
];
const forecastData90 = [
  { period: 'M+1', FPI: 1.26, FSI: 0.71, PCV: 0.79 },
  { period: 'M+2', FPI: 1.31, FSI: 0.75, PCV: 0.83 },
  { period: 'M+3', FPI: 1.29, FSI: 0.73, PCV: 0.81 },
];
const forecastData180 = [
  { period: 'M+1', FPI: 1.26, crisis_prob: 0.28 },
  { period: 'M+2', FPI: 1.31, crisis_prob: 0.34 },
  { period: 'M+3', FPI: 1.29, crisis_prob: 0.31 },
  { period: 'M+4', FPI: 1.34, crisis_prob: 0.38 },
  { period: 'M+5', FPI: 1.38, crisis_prob: 0.44 },
  { period: 'M+6', FPI: 1.41, crisis_prob: 0.49 },
];

const ALERT_COLORS: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: '● STABLE' },
  2: { bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'text-yellow-400', label: '● WATCH' },
  3: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', label: '● PRESSURE' },
  4: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: '● CRISIS' },
  5: { bg: 'bg-black border', border: 'border-white/20', text: 'text-white', label: '⚫ SYSTEMIC COLLAPSE' },
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const AlertBadge: React.FC<{ level: number; small?: boolean }> = ({ level, small }) => {
  const c = ALERT_COLORS[level] || ALERT_COLORS[1];
  return (
    <span className={cn('font-mono font-bold rounded border px-2 py-0.5 uppercase', c.bg, c.border, c.text, small ? 'text-[8px]' : 'text-[9px]')}>
      {c.label}
    </span>
  );
};

const IndexCard: React.FC<{
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string; warn?: boolean;
}> = ({ label, value, sub, icon: Icon, color, warn }) => (
  <div className={cn('glass rounded-xl border p-4 space-y-2 hover:border-white/20 transition-all', warn ? 'border-red-500/30 bg-red-500/5' : 'border-intel-border')}>
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      <Icon className={cn('w-3.5 h-3.5', color)} />
    </div>
    <div className={cn('text-2xl font-bold font-mono', color)}>{value}</div>
    <div className="text-[9px] font-mono text-slate-600">{sub}</div>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ElementType; title: string; badge?: string; badgeColor?: string }> = ({
  icon: Icon, title, badge, badgeColor = 'text-amber-400 border-amber-400/30 bg-amber-400/5',
}) => (
  <div className="flex items-center justify-between border-b border-intel-border/30 pb-3">
    <div className="flex items-center space-x-2">
      <Icon className="w-4 h-4 text-amber-400" />
      <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
    </div>
    {badge && <span className={cn('text-[8px] font-mono px-2 py-0.5 rounded border uppercase', badgeColor)}>{badge}</span>}
  </div>
);

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    CRITICAL: 'text-red-400 border-red-400/30 bg-red-400/10',
    HIGH: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    LOW: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
    OK: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  };
  return <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase', map[level] || 'text-slate-500 border-slate-700')}>{level}</span>;
};

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'STRATEGIC', label: 'Strategic Dashboard', icon: BarChart3 },
  { id: 'IMPORT', label: 'Import Pipeline', icon: Ship },
  { id: 'FODDER', label: 'Fodder & Livestock', icon: Wheat },
  { id: 'BLACKMARKET', label: 'Feed Black Market', icon: AlertTriangle },
  { id: 'FORECAST', label: 'Crisis Forecast', icon: FlaskConical },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const FeedIntelligenceHub: React.FC = () => {
  const { data } = usePipeline();
  const [activeTab, setActiveTab] = useState<TabId>('STRATEGIC');

  const indices = useMemo(() => {
    const fxStress = (data as any)?.economy?.fx_reserves
      ? Math.max(0.3, 1 - (data as any).economy.fx_reserves / 200)
      : BASE_FEED.fx_stress;
    return computeFeedIndices({ ...BASE_FEED, fx_stress: fxStress });
  }, [data]);

  const alertCfg = ALERT_COLORS[indices.alertLevel];

  return (
    <div className="p-3 md:p-4 space-y-6 relative pb-10">
      <BackgroundGrid />

      <ModuleHeader
        title="Feed Intelligence Hub"
        subtitle="Central agricultural intelligence engine — FPI · FPSI · FSI · PCV · Protein Chain Vulnerability"
        icon={Wheat}
        nodeId="AGRI-FEED-HUB-01"
      />

      {/* ── MASTER ALERT BANNER ── */}
      <div className={cn('rounded-xl border p-4 flex items-center justify-between', alertCfg.bg, alertCfg.border)}>
        <div className="flex items-center gap-3">
          <AlertCircle className={cn('w-5 h-5 shrink-0', alertCfg.text)} />
          <div>
            <div className={cn('text-[11px] font-bold font-mono uppercase tracking-widest', alertCfg.text)}>
              Feed System Alert Level — {alertCfg.label}
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
              PCV={indices.PCV.toFixed(3)} · FSI={indices.FSI.toFixed(3)} · FPI={indices.FPI.toFixed(3)}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[9px] font-mono text-slate-500">
          <span>Grain reserves: <span className="text-red-400 font-bold">42d</span></span>
          <span>·</span>
          <span>Import reliability: <span className="text-orange-400 font-bold">62%</span></span>
          <span>·</span>
          <span>Fodder output: <span className="text-red-400 font-bold">44% avg</span></span>
        </div>
      </div>

      {/* ── MASTER INDEX STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <IndexCard label="Feed Price Index (FPI)" value={indices.FPI.toFixed(3)}
          sub={`Basket × FX × Freight — ${indices.FPI > 1.15 ? '⚠ Crisis tier' : indices.FPI > 1.05 ? 'Pressure' : 'Stable'}`}
          icon={TrendingUp} color={indices.FPI > 1.15 ? 'text-red-400' : indices.FPI > 1.05 ? 'text-orange-400' : 'text-emerald-400'} warn={indices.FPI > 1.15} />
        <IndexCard label="Feed Price Shock (FPSI)" value={indices.FPSI.toFixed(3)}
          sub="Import inflation + fodder scarcity + FX"
          icon={Zap} color={indices.FPSI > 0.4 ? 'text-red-400' : 'text-orange-400'} warn={indices.FPSI > 0.4} />
        <IndexCard label="Feed Security Index (FSI)" value={indices.FSI.toFixed(3)}
          sub={`Higher = less secure — ${indices.FSI > 0.6 ? 'CRISIS' : indices.FSI > 0.4 ? 'PRESSURE' : 'STABLE'}`}
          icon={ShieldAlert} color={indices.FSI > 0.6 ? 'text-red-400' : 'text-orange-400'} warn={indices.FSI > 0.6} />
        <IndexCard label="Protein Chain Vuln. (PCV)" value={indices.PCV.toFixed(3)}
          sub="FPI × FX × Drought × BM Leakage"
          icon={Activity} color={indices.PCV > 0.7 ? 'text-red-400' : 'text-orange-400'} warn={indices.PCV > 0.7} />
      </div>

      <LiveTicker items={feedAlerts} />

      {/* ── SECTOR DEPENDENCY STRIP ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { sector: '🐔 Poultry', fpi: indices.FPI_poultry, days: 30, color: 'text-orange-400' },
          { sector: '🐄 Livestock', fpi: indices.FPI_livestock, days: 90, color: 'text-amber-400' },
          { sector: '🥛 Dairy', fpi: indices.FPI_dairy, days: 60, color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-xl border border-intel-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white">{s.sector}</span>
              <span className="text-[8px] font-mono text-slate-600">{s.days}d lag</span>
            </div>
            <div className={cn('text-xl font-bold font-mono', s.color)}>FPI×{s.fpi.toFixed(2)}</div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', s.fpi > 1.15 ? 'bg-red-500' : 'bg-orange-500')}
                style={{ width: `${Math.min(100, (s.fpi - 0.8) / 0.6 * 100)}%` }} />
            </div>
            <div className="text-[8px] font-mono text-slate-600">
              Crisis threshold: FPI &gt; 1.20
            </div>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sticky top-0 z-40 bg-black/40 backdrop-blur-xl p-2 rounded-xl border border-white/5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border',
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-white hover:border-white/10'
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >

          {/* ════════════════════════════════════
              TAB 1 — STRATEGIC DASHBOARD
          ════════════════════════════════════ */}
          {activeTab === 'STRATEGIC' && (
            <div className="space-y-6">
              <SectionHeader icon={BarChart3} title="Feed Price Index — Historical & Trend" badge="MASTER INDEX" />

              {/* FPI trend chart */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">FPI · FPSI · FSI — 6-Month Evolution</div>
                  <div className="text-[9px] font-mono text-slate-600">All indices normalized to 1.0 baseline. FPI &gt; 1.15 = Crisis tier.</div>
                </div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fpiTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0.8, 1.3]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={1.15} stroke="rgba(239,68,68,0.4)" strokeDasharray="5 3" label={{ value: 'Crisis', position: 'right', fill: '#ef4444', fontSize: 7, fontFamily: 'monospace' }} />
                      <ReferenceLine y={1.05} stroke="rgba(249,115,22,0.3)" strokeDasharray="5 3" label={{ value: 'Pressure', position: 'right', fill: '#f97316', fontSize: 7, fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="fpi" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} name="FPI" />
                      <Line type="monotone" dataKey="fpsi" stroke="#ef4444" strokeWidth={2} dot={false} name="FPSI" />
                      <Line type="monotone" dataKey="fsi" stroke="#8b5cf6" strokeWidth={2} dot={false} name="FSI (insecurity)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 text-[9px] font-mono">
                  {[{ c: '#f59e0b', l: 'FPI (Feed Price Index)' }, { c: '#ef4444', l: 'FPSI (Price Shock)' }, { c: '#8b5cf6', l: 'FSI (Insecurity)' }].map(({ c, l }) => (
                    <span key={l} className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block" style={{ backgroundColor: c }} /><span className="text-slate-500">{l}</span></span>
                  ))}
                </div>
              </div>

              {/* Commodity prices table */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <SectionHeader icon={Package} title="Commodity Price Tracker — Current vs Baseline" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Commodity', 'Official Price', 'Baseline', 'Change', 'Status'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {commodityPrices.map((c, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-4">{c.name}</td>
                          <td className="py-2.5 text-[10px] font-mono text-white pr-4">{c.price} {c.unit}</td>
                          <td className="py-2.5 text-[9px] font-mono text-slate-500 pr-4">{c.baseline} {c.unit}</td>
                          <td className="py-2.5 pr-4">
                            <span className={cn('text-[10px] font-bold font-mono', c.change > 25 ? 'text-red-400' : c.change > 15 ? 'text-orange-400' : 'text-yellow-400')}>
                              +{c.change.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5"><RiskBadge level={c.critical ? 'CRITICAL' : 'MEDIUM'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seasonal Event Engine */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <SectionHeader icon={Clock} title="Seasonal Event Engine — Feed Impact Matrix" />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Event', 'Date', 'Poultry', 'Meat', 'Dairy', 'Feed', 'Days Out'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {SEASONAL_EVENTS.map((e, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-3">{e.name}</td>
                          <td className="py-2.5 text-[9px] font-mono text-slate-500 pr-3">{e.start}</td>
                          {[e.poultry, e.meat, e.dairy, e.feed].map((val, j) => (
                            <td key={j} className={cn('py-2.5 text-[9px] font-mono pr-3',
                              val.includes('SPIKE') || val.includes('PEAK') ? 'text-orange-400' :
                              val.includes('DIP') ? 'text-blue-400' :
                              val.includes('DIVERTED') || val.includes('STRESS') || val.includes('MORTALITY') ? 'text-red-400' : 'text-slate-500'
                            )}>{val}</td>
                          ))}
                          <td className="py-2.5">
                            <span className={cn('text-[9px] font-mono font-bold', e.daysTo < 90 ? 'text-orange-400' : 'text-slate-500')}>
                              {e.daysTo}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 2 — IMPORT PIPELINE
          ════════════════════════════════════ */}
          {activeTab === 'IMPORT' && (
            <div className="space-y-6">
              <SectionHeader icon={Ship} title="Feed Import Pipeline — Port Arrivals & Stock Levels" badge="LIVE TRACKING" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Grain Reserve Days', value: '42d', sub: 'vs 60d threshold', warn: true },
                  { label: 'Import Reliability', value: '62%', sub: 'Disruption risk HIGH', warn: true },
                  { label: 'FX Exposure', value: `${(indices.FPI_poultry - 1).toFixed(0)}%`, sub: 'Feed cost premium', warn: true },
                  { label: 'Port Queue', value: '3 vessels', sub: 'La Goulette + Sfax', warn: false },
                ].map((k, i) => (
                  <div key={i} className={cn('glass rounded-xl border p-4 space-y-2', k.warn ? 'border-red-500/30 bg-red-500/5' : 'border-intel-border')}>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className={cn('text-2xl font-bold font-mono', k.warn ? 'text-red-400' : 'text-amber-400')}>{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Stock levels */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">National Stock Levels — Days of Supply</div>
                <div className="space-y-3">
                  {stockLevelData.map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-white">{s.item}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">Critical: {s.critical}d</span>
                          <span className={cn('font-bold', s.days < s.critical ? 'text-red-400' : 'text-emerald-400')}>
                            {s.days}d {s.days < s.critical ? '⚠ BELOW THRESHOLD' : '✓ OK'}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-white/5 rounded-sm overflow-hidden border border-white/5 relative">
                        <div
                          className={cn('h-full', s.days < s.critical ? 'bg-red-500/70' : 'bg-emerald-500/50')}
                          style={{ width: `${Math.min(100, (s.days / 90) * 100)}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-px bg-orange-400/60"
                          style={{ left: `${(s.critical / 90) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Port arrivals + import origins */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Weekly Port Arrivals (tonnes)</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={portArrivalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 7, fontFamily: 'monospace' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="maize" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Maize" />
                        <Bar dataKey="soy" fill="#ef4444" radius={[2, 2, 0, 0]} name="Soy" />
                        <Bar dataKey="barley" fill="#10b981" radius={[2, 2, 0, 0]} name="Barley" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-mono">
                    {[{ c: '#f59e0b', l: 'Maize' }, { c: '#ef4444', l: 'Soy' }, { c: '#10b981', l: 'Barley' }].map(({ c, l }) => (
                      <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: c }} /><span className="text-slate-500">{l}</span></span>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Import Origin Risk Matrix</div>
                  <div className="space-y-2.5">
                    {importOrigins.map((o, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <div className="text-[10px] font-mono text-white">{o.country}</div>
                          <div className="text-[8px] font-mono text-slate-600">{o.commodity}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400/60" style={{ width: `${o.share}%` }} />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-white w-8">{o.share}%</span>
                          <RiskBadge level={o.risk} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 rounded bg-red-500/5 border border-red-500/20">
                    <p className="text-[9px] font-mono text-red-400">⚠ Ukraine route (18%) — maize + sunflower at continued disruption risk. No alternative secured.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 3 — FODDER & LIVESTOCK
          ════════════════════════════════════ */}
          {activeTab === 'FODDER' && (
            <div className="space-y-6">
              <SectionHeader icon={Wheat} title="Local Fodder Production & Pasture Stress" badge="SATELLITE NDVI" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'National Fodder Output', value: '44%', sub: 'of historical average', warn: true },
                  { label: 'Drought Stress Index', value: '0.71', sub: 'HIGH — Sahel expansion', warn: true },
                  { label: 'Pasture NDVI (Avg)', value: '0.34', sub: 'Below 0.40 threshold', warn: true },
                  { label: 'Rainfall Deficit', value: '−38%', sub: 'vs seasonal normal', warn: true },
                ].map((k, i) => (
                  <div key={i} className="glass rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className="text-2xl font-bold font-mono text-red-400">{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Governorate fodder table */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Fodder Stress by Governorate — NDVI + Rainfall</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Governorate', 'NDVI', 'Fodder Output', 'Rain Anomaly', 'Stress', 'FPI Impact'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {fodderByGovernorate.map((row, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-4">{row.gov}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.ndvi * 100}%` }} />
                              </div>
                              <span className={cn('text-[9px] font-mono font-bold', row.ndvi < 0.3 ? 'text-red-400' : row.ndvi < 0.45 ? 'text-orange-400' : 'text-emerald-400')}>
                                {row.ndvi}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={cn('text-[9px] font-mono font-bold', row.fodder_output < 0.35 ? 'text-red-400' : row.fodder_output < 0.55 ? 'text-orange-400' : 'text-emerald-400')}>
                              {(row.fodder_output * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className={cn('text-[9px] font-mono', row.rain_dev < -30 ? 'text-red-400' : row.rain_dev < -15 ? 'text-orange-400' : 'text-slate-400')}>
                              {row.rain_dev > 0 ? '+' : ''}{row.rain_dev}%
                            </span>
                          </td>
                          <td className="py-2.5 pr-4"><RiskBadge level={row.stress} /></td>
                          <td className="py-2.5">
                            <span className={cn('text-[9px] font-mono', row.stress === 'CRITICAL' ? 'text-red-400' : 'text-orange-400')}>
                              {row.stress === 'CRITICAL' ? '↑ FPI +12-18%' : row.stress === 'HIGH' ? '↑ FPI +6-10%' : '→ Neutral'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Radar: sector feed dependency */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sector Feed Dependency Radar</div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={[
                        { subject: 'Imported Maize', poultry: 88, livestock: 42, dairy: 35 },
                        { subject: 'Imported Soy', poultry: 72, livestock: 28, dairy: 22 },
                        { subject: 'Local Barley', poultry: 18, livestock: 65, dairy: 48 },
                        { subject: 'Local Fodder', poultry: 5, livestock: 78, dairy: 55 },
                        { subject: 'Compound Feed', poultry: 95, livestock: 22, dairy: 18 },
                        { subject: 'Alfalfa', poultry: 2, livestock: 58, dairy: 62 },
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontFamily: 'monospace' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        <Radar name="Poultry" dataKey="poultry" stroke="#f97316" fill="#f97316" fillOpacity={0.12} strokeWidth={1.5} />
                        <Radar name="Livestock" dataKey="livestock" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={1.5} />
                        <Radar name="Dairy" dataKey="dairy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={1.5} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-mono">
                    {[{ c: '#f97316', l: 'Poultry' }, { c: '#10b981', l: 'Livestock' }, { c: '#3b82f6', l: 'Dairy' }].map(({ c, l }) => (
                      <span key={l} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c }} /><span className="text-slate-500">{l}</span></span>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Feed Stress → RRI Impact Chain</div>
                  <div className="space-y-3">
                    {[
                      { label: 'FPI rises 20%', arrow: '→', outcome: 'Poultry farm exit rate +15%', days: '7d', color: 'text-orange-400' },
                      { label: 'Poultry exits +15%', arrow: '→', outcome: 'Egg price +25–30%', days: '14d', color: 'text-orange-400' },
                      { label: 'Egg price +30%', arrow: '→', outcome: 'Household food stress signal', days: '21d', color: 'text-red-400' },
                      { label: 'Food stress signal', arrow: '→', outcome: 'Social.Food_Security −0.08 RRI', days: '30d', color: 'text-red-400' },
                      { label: 'Livestock FPI +20%', arrow: '→', outcome: 'Eid sheep deficit risk', days: '90d', color: 'text-orange-400' },
                      { label: 'Dairy FPI +20%', arrow: '→', outcome: 'Butter crisis (butter_stock &lt; 14d)', days: '60d', color: 'text-red-400' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                        <span className="text-[9px] font-mono text-white w-36 shrink-0">{step.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                        <span className={cn('text-[9px] font-mono flex-1', step.color)}>{step.outcome}</span>
                        <span className="text-[8px] font-mono text-slate-600 shrink-0">{step.days}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 4 — FEED BLACK MARKET
          ════════════════════════════════════ */}
          {activeTab === 'BLACKMARKET' && (
            <div className="space-y-6">
              <SectionHeader icon={AlertTriangle} title="Feed Black Market Intelligence" badge="OSINT ACTIVE" badgeColor="text-red-400 border-red-400/30 bg-red-400/5" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'BM Leakage Rate', value: '38%', sub: 'Subsidized feed diverted' },
                  { label: 'Subsidy Cost Lost', value: '~180M TND', sub: 'Annual estimate' },
                  { label: 'Informal Mills', value: '140+', sub: 'Estimated operating' },
                  { label: 'OSINT Signals', value: String(blackMarketOsint.length), sub: 'Active keyword alerts' },
                ].map((k, i) => (
                  <div key={i} className="glass rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className="text-xl font-bold font-mono text-red-400">{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Black market price table */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Feed Price Distortion — Official vs Black Market (TND/tonne)</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Feed Type', 'Official', 'Black Market', 'Distortion', 'Diversion Est.', 'Vector', 'Risk'].map(h => (
                          <th key={h} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {blackMarketFeed.map((row, i) => {
                        const distortion = Math.round(((row.street - row.official) / row.official) * 100);
                        return (
                          <tr key={i} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-3">{row.type}</td>
                            <td className="py-2.5 text-[10px] font-mono text-slate-400 pr-3">{row.official}</td>
                            <td className="py-2.5 text-[10px] font-mono text-white font-bold pr-3">{row.street}</td>
                            <td className="py-2.5 pr-3">
                              <span className={cn('text-[10px] font-mono font-bold', distortion > 60 ? 'text-red-400' : distortion > 40 ? 'text-orange-400' : 'text-yellow-400')}>
                                +{distortion}%
                              </span>
                            </td>
                            <td className="py-2.5 text-[9px] font-mono text-orange-400 pr-3">{row.diversion}%</td>
                            <td className="py-2.5 text-[9px] font-mono text-slate-500 pr-3">{row.vector}</td>
                            <td className="py-2.5"><RiskBadge level={row.risk} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OSINT signals */}
              <div className="glass rounded-xl border border-intel-border overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Automated OSINT Feed Intercepts — Tunisian Dialect + Arabic
                </div>
                <div className="divide-y divide-white/5">
                  {blackMarketOsint.map((s, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm',
                        s.heat === 'CRITICAL' ? 'bg-red-500/20 border border-red-500/30' : 'bg-orange-500/20 border border-orange-500/30'
                      )}>🔥</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-mono text-sm">{s.term}</span>
                          <span className="text-slate-600 font-mono text-xs" dir="rtl">{s.arabic}</span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 mt-0.5">{s.meaning}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <RiskBadge level={s.heat} />
                        <span className="text-[10px] font-mono font-bold text-red-400">{s.velocity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 5 — CRISIS FORECAST
          ════════════════════════════════════ */}
          {activeTab === 'FORECAST' && (
            <div className="space-y-6">
              <SectionHeader icon={FlaskConical} title="Feed Crisis Forecast — 30 / 90 / 180 Day Horizons" badge="PREDICTIVE ENGINE" />

              {/* PCV gauge */}
              <div className="glass rounded-xl border border-red-500/30 bg-red-500/5 p-5">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Protein Chain Vulnerability (PCV)</div>
                    <div className="text-5xl font-bold font-mono text-red-400">{indices.PCV.toFixed(3)}</div>
                    <div className="text-[9px] font-mono text-slate-500">PCV = FPI × FX_Stress × Drought × BM_Leakage</div>
                    <div className="flex items-center gap-2 mt-2">
                      <AlertBadge level={indices.alertLevel} />
                      <span className="text-[9px] font-mono text-slate-500">
                        Black alert threshold: PCV &gt; 0.85 + multi-sector convergence
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:block space-y-2 text-right">
                    <div className="text-[9px] font-mono text-slate-600 uppercase">Black Alert Conditions</div>
                    {[
                      { cond: 'PCPI > 80 (Red)', met: false },
                      { cond: 'MSI > 0.80 (Red)', met: false },
                      { cond: 'DSI < 30 (Red)', met: false },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-2 justify-end">
                        {c.met
                          ? <AlertCircle className="w-3 h-3 text-red-400" />
                          : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        <span className={cn('text-[9px] font-mono', c.met ? 'text-red-400' : 'text-slate-500')}>{c.cond}</span>
                      </div>
                    ))}
                    <div className="text-[9px] font-mono text-slate-600 mt-2">→ Black alert NOT triggered</div>
                  </div>
                </div>
              </div>

              {/* 30-day forecast */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">30-Day Forecast — FPI · FPSI · PCV Trajectory</div>
                  <div className="text-[9px] font-mono text-slate-600">All indices trending upward — no reversal catalyst detected</div>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData30}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0.8, 1.4]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <ReferenceLine y={1.2} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="FPI" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} name="FPI" />
                      <Line type="monotone" dataKey="FPSI" stroke="#ef4444" strokeWidth={2} dot={false} name="FPSI" />
                      <Line type="monotone" dataKey="PCV" stroke="#8b5cf6" strokeWidth={2} dot={false} name="PCV" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 180-day crisis probability */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">180-Day Crisis Probability — Feed System Collapse</div>
                  <div className="text-[9px] font-mono text-slate-600">P(crisis) = probability that FSI exceeds 0.75 (Red threshold) in that month</div>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={forecastData180}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="prob" unit="%" domain={[0, 0.7]} tickFormatter={v => `${(v * 100).toFixed(0)}`} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="fpi" orientation="right" domain={[1, 1.6]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any, name) => [name === 'crisis_prob' ? `${(v * 100).toFixed(0)}%` : v.toFixed(3), name]} />
                      <Bar dataKey="crisis_prob" yAxisId="prob" fill="rgba(239,68,68,0.5)" radius={[2, 2, 0, 0]} name="P(crisis)" />
                      <Line type="monotone" dataKey="FPI" yAxisId="fpi" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="FPI forecast" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-mono text-slate-400 leading-relaxed">
                    At current trajectory, FPI reaches 1.41 by M+6 with 49% crisis probability. Eid al-Adha (June 2026) represents a critical convergence point — feed diversion to livestock sector will compound poultry and dairy stress simultaneously. Intervention window: <span className="text-orange-400 font-bold">next 45 days</span> before the divergence becomes irreversible.
                  </p>
                </div>
              </div>

              {/* Policy recommendations */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-intel-border/30 pb-3">
                  Automated Policy Recommendations — Feed System
                </div>
                {[
                  { priority: 'IMMEDIATE', action: 'Emergency grain import tender — 50,000t maize + 30,000t soy to restore 60-day reserve', impact: 'FPI −8%, FSI −0.12' },
                  { priority: 'URGENT', action: 'Deploy Customs enforcement to 5 highest-leakage governorates (Kairouan, Sidi Bouzid, Kasserine, Gafsa, Jendouba)', impact: 'BM Leakage −15%' },
                  { priority: 'STRATEGIC', action: 'Negotiate barley supply agreement with France/Romania to reduce Ukraine dependency from 18% to <10%', impact: 'Import risk −25%' },
                  { priority: 'STRATEGIC', action: 'Accelerate Eid al-Adha livestock import program — current herd + FPI trajectory makes domestic supply insufficient', impact: 'Eid MSI −0.18' },
                ].map((r, i) => (
                  <div key={i} className={cn('p-4 rounded-xl border space-y-1',
                    r.priority === 'IMMEDIATE' ? 'border-red-500/30 bg-red-500/5' :
                    r.priority === 'URGENT' ? 'border-orange-500/20' : 'border-intel-border'
                  )}>
                    <div className="flex items-center gap-3">
                      <RiskBadge level={r.priority === 'IMMEDIATE' ? 'CRITICAL' : r.priority === 'URGENT' ? 'HIGH' : 'MEDIUM'} />
                      <span className="text-[9px] font-mono text-slate-600 uppercase">{r.priority}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white leading-relaxed">{r.action}</p>
                    <p className="text-[9px] font-mono text-emerald-400">→ Expected impact: {r.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Export shared indices for downstream sector pages
export { computeFeedIndices, BASE_FEED };
