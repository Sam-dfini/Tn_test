/**
 * LivestockMeatIntelligence.tsx
 * TunisiaIntel — Livestock & Meat Intelligence Module
 * Agriculture Branch Phase 3
 *
 * Eid al-Adha is the single highest-demand meat event in Tunisia.
 * A sheep deficit of 15%+ creates measurable social pressure.
 * 90-day lag from feed shock to slaughter-weight impact.
 *
 * Tabs:
 *   1. Sector Dashboard — Herd index, meat production, price tracker
 *   2. Eid al-Adha Engine — Sheep forecast, deficit model, social risk
 *   3. Meat Crisis Detection — Price distortion, scarcity, supply chain
 *   4. Price Intelligence — Regional price map, black market
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Activity, TrendingUp, TrendingDown,
  ShieldAlert, Zap, BarChart3, Clock, AlertCircle,
  Package, Truck, Map as MapIcon, Users,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, AreaChart,
} from 'recharts';
import { BackgroundGrid, ModuleHeader, LiveTicker } from '../shared/ProfessionalShared';
import { generateStableKey, prepareList } from '../../lib/keyUtils';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { BASE_FEED, computeFeedIndices } from '../agriculture/FeedIntelligenceHub';
import { cn } from '../../utils/cn';

// ─── HERD INDEX & EID ENGINE ─────────────────────────────────────────────────

function computeHerdIndex(fpiLivestock: number): {
  HI: number; sheepDeficit: number; eidRiskScore: number; meatPriceIndex: number;
} {
  const feedPressure = Math.max(0, fpiLivestock - 1.0);
  const HI = Math.max(0.5, 1 - feedPressure * 0.4);            // Herd viability index
  const sheepDeficit = Math.min(0.35, feedPressure * 0.9 + 0.05); // % below Eid demand
  const eidRiskScore = Math.min(1, sheepDeficit * 3.2);
  const meatPriceIndex = Math.max(1, 1 + feedPressure * 0.7);
  return { HI, sheepDeficit, eidRiskScore, meatPriceIndex };
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const meatAlerts = [
  { code: 'MEAT-EID-01', title: 'Eid al-Adha sheep deficit projected at 18% — social risk HIGH', impact: 'CRITICAL' },
  { code: 'MEAT-PRICE-02', title: 'Live sheep price +34% vs last Eid — household affordability crisis', impact: 'CRITICAL' },
  { code: 'MEAT-FEED-03', title: 'Livestock FPI 0.85 — ruminant herd thinning accelerating', impact: 'HIGH' },
  { code: 'MEAT-IMPORT-04', title: 'Romania + France live cattle imports delayed — logistics disruption', impact: 'HIGH' },
];

const herdTrend = [
  { month: 'Oct', sheep_k: 8420, goat_k: 1840, cattle_k: 680, price_sheep: 420 },
  { month: 'Nov', sheep_k: 8380, goat_k: 1820, cattle_k: 672, price_sheep: 435 },
  { month: 'Dec', sheep_k: 8290, goat_k: 1795, cattle_k: 661, price_sheep: 448 },
  { month: 'Jan', sheep_k: 8210, goat_k: 1770, cattle_k: 652, price_sheep: 468 },
  { month: 'Feb', sheep_k: 8140, goat_k: 1748, cattle_k: 644, price_sheep: 490 },
  { month: 'Mar', sheep_k: 8060, goat_k: 1720, cattle_k: 635, price_sheep: 512 },
];

const meatPriceTrend = [
  { month: 'Oct', beef: 28.5, lamb: 32.8, chicken: 8.5, target_lamb: 30 },
  { month: 'Nov', beef: 29.2, lamb: 33.9, chicken: 8.8, target_lamb: 30 },
  { month: 'Dec', beef: 30.1, lamb: 35.4, chicken: 9.2, target_lamb: 30 },
  { month: 'Jan', beef: 31.4, lamb: 37.1, chicken: 9.8, target_lamb: 30 },
  { month: 'Feb', beef: 33.2, lamb: 39.8, chicken: 10.4, target_lamb: 30 },
  { month: 'Mar', beef: 35.8, lamb: 43.2, chicken: 11.2, target_lamb: 30 },
];

const eidDemandForecast = [
  { year: '2022', demand_k: 1820, supply_k: 1780, deficit_pct: 2.2, price_sheep: 340 },
  { year: '2023', demand_k: 1850, supply_k: 1790, deficit_pct: 3.2, price_sheep: 380 },
  { year: '2024', demand_k: 1870, supply_k: 1820, deficit_pct: 2.7, price_sheep: 420 },
  { year: '2025', demand_k: 1890, supply_k: 1760, deficit_pct: 7.1, price_sheep: 510 },
  { year: '2026 (proj)', demand_k: 1910, supply_k: 1570, deficit_pct: 17.8, price_sheep: 680 },
];

const eidGovRisk = [
  { gov: 'Tunis Metro', demand_k: 420, supply_k: 180, deficit: 57, social_risk: 'CRITICAL' },
  { gov: 'Sfax', demand_k: 180, supply_k: 85, deficit: 53, social_risk: 'CRITICAL' },
  { gov: 'Sousse', demand_k: 140, supply_k: 70, deficit: 50, social_risk: 'HIGH' },
  { gov: 'Kasserine', demand_k: 95, supply_k: 60, deficit: 37, social_risk: 'HIGH' },
  { gov: 'Sidi Bouzid', demand_k: 88, supply_k: 62, deficit: 30, social_risk: 'MEDIUM' },
  { gov: 'Béja', demand_k: 72, supply_k: 58, deficit: 19, social_risk: 'LOW' },
  { gov: 'Siliana', demand_k: 65, supply_k: 54, deficit: 17, social_risk: 'LOW' },
];

const regionalPrices = [
  { region: 'Tunis', lamb_kg: 43.2, beef_kg: 35.8, official_lamb: 30.0, bm_premium: '+44%' },
  { region: 'Sfax', lamb_kg: 41.8, beef_kg: 34.2, official_lamb: 30.0, bm_premium: '+39%' },
  { region: 'Sousse', lamb_kg: 40.5, beef_kg: 33.5, official_lamb: 30.0, bm_premium: '+35%' },
  { region: 'Kairouan', lamb_kg: 38.9, beef_kg: 32.1, official_lamb: 30.0, bm_premium: '+30%' },
  { region: 'Kasserine', lamb_kg: 37.2, beef_kg: 30.8, official_lamb: 30.0, bm_premium: '+24%' },
  { region: 'Gafsa', lamb_kg: 36.8, beef_kg: 30.2, official_lamb: 30.0, bm_premium: '+23%' },
  { region: 'Jendouba', lamb_kg: 35.4, beef_kg: 29.8, official_lamb: 30.0, bm_premium: '+18%' },
];

const supplyChainRisks = [
  { stage: 'Farm Gate', risk: 'HIGH', issue: 'Feed cost squeeze forcing early slaughter of breeding stock', impact: 'Herd depletion' },
  { stage: 'Transport', risk: 'MEDIUM', issue: 'Fuel cost +35% — refrigerated transport margins negative', impact: 'Regional distribution gaps' },
  { stage: 'Abattoir', risk: 'MEDIUM', issue: 'Capacity utilization 94% — holiday surge will create bottleneck', impact: 'Processing delays +3d' },
  { stage: 'Retail', risk: 'HIGH', issue: 'Refrigeration chain weak in interior governorates', impact: 'Quality + waste risk' },
  { stage: 'Import', risk: 'CRITICAL', issue: 'Live cattle from Romania/France delayed — logistics + customs', impact: 'Supply shortfall 8–12%' },
];

const TABS = [
  { id: 'SECTOR', label: 'Sector Dashboard', icon: BarChart3 },
  { id: 'EID', label: 'Eid al-Adha Engine', icon: Clock },
  { id: 'CRISIS', label: 'Meat Crisis Detection', icon: AlertTriangle },
  { id: 'PRICE', label: 'Price Intelligence', icon: TrendingUp },
] as const;

type TabId = typeof TABS[number]['id'];

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    CRITICAL: 'text-red-400 border-red-400/30 bg-red-400/10',
    HIGH: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    LOW: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  };
  return <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase', map[level] || 'text-slate-500 border-slate-700')}>{level}</span>;
};

const KpiCard: React.FC<{ label: string; value: string; sub: string; warn?: boolean; color?: string }> = ({
  label, value, sub, warn, color = 'text-amber-400',
}) => (
  <div className={cn('glass rounded-xl border p-4 space-y-2', warn ? 'border-red-500/30 bg-red-500/5' : 'border-intel-border')}>
    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
    <div className={cn('text-2xl font-bold font-mono', warn ? 'text-red-400' : color)}>{value}</div>
    <div className="text-[9px] font-mono text-slate-600">{sub}</div>
  </div>
);

export const LivestockMeatIntelligence: React.FC = () => {
  const { fullData: data } = useRiskMetrics();
  const [activeTab, setActiveTab] = useState<TabId>('SECTOR');

  const fxStress = (data as any)?.economy?.fx_reserves
    ? Math.max(0.3, 1 - (data as any).economy.fx_reserves / 200)
    : 0.68;
  const indices = useMemo(() => computeFeedIndices({ ...BASE_FEED, fx_stress: fxStress }), [fxStress]);
  const { HI, sheepDeficit, eidRiskScore, meatPriceIndex } = computeHerdIndex(indices.FPI_livestock);

  const eidDate = new Date('2026-05-27T00:00:00');
  const today = new Date();
  const diffTime = eidDate.getTime() - today.getTime();
  const eidDaysTo = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return (
    <div className="p-3 md:p-4 space-y-6 relative pb-10">
      <BackgroundGrid />
      <ModuleHeader
        title="Livestock & Meat Intelligence"
        subtitle="Herd viability · Eid al-Adha forecast engine · Meat crisis detection · Supply chain risk"
        icon={Package}
        nodeId="AGRI-MEAT-01"
      />

      {/* Eid countdown banner */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <div className="text-[11px] font-bold font-mono text-red-400 uppercase tracking-widest">
              Eid al-Adha 2026 — {eidDaysTo} Days · Projected Sheep Deficit: {(sheepDeficit * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">
              Eid Risk Score: {eidRiskScore.toFixed(3)} · Herd Index: {HI.toFixed(3)} · Meat Price Index: ×{meatPriceIndex.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <RiskBadge level={eidRiskScore > 0.6 ? 'CRITICAL' : eidRiskScore > 0.4 ? 'HIGH' : 'MEDIUM'} />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Herd Index (HI)" value={HI.toFixed(3)} sub="Ruminant viability vs norm" warn={HI < 0.75} />
        <KpiCard label="Sheep Deficit (Eid)" value={`${(sheepDeficit * 100).toFixed(1)}%`} sub="Below projected Eid demand" warn={sheepDeficit > 0.1} />
        <KpiCard label="Eid Risk Score" value={eidRiskScore.toFixed(3)} sub="Social stability risk" warn={eidRiskScore > 0.5} />
        <KpiCard label="Meat Price Index" value={`×${meatPriceIndex.toFixed(2)}`} sub="vs baseline" warn={meatPriceIndex > 1.2} />
      </div>

      <LiveTicker items={meatAlerts} />

      {/* Tab bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-0 z-40 bg-black/40 backdrop-blur-xl p-2 rounded-xl border border-white/5">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border',
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
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
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">National Herd Trend (thousands of head) + Live Sheep Price (TND)</div>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={herdTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="herd" domain={[7800, 8600]} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="price" orientation="right" domain={[380, 560]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="sheep_k" yAxisId="herd" fill="rgba(245,158,11,0.4)" radius={[2,2,0,0]} name="Sheep (k head)" />
                      <Line type="monotone" dataKey="price_sheep" yAxisId="price" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 3 }} name="Sheep price (TND)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Meat Price Trend — Lamb · Beef · Chicken (TND/kg)</div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={meatPriceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${v} TND/kg`]} />
                      <ReferenceLine y={30} stroke="rgba(249,115,22,0.3)" strokeDasharray="4 4" label={{ value: 'Official ceiling', position: 'right', fill: '#f97316', fontSize: 7 }} />
                      <Line type="monotone" dataKey="lamb" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} name="Lamb (TND/kg)" />
                      <Line type="monotone" dataKey="beef" stroke="#ef4444" strokeWidth={2} dot={false} name="Beef (TND/kg)" />
                      <Line type="monotone" dataKey="chicken" stroke="#00f2ff" strokeWidth={2} dot={false} name="Chicken (TND/kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* EID AL-ADHA ENGINE */}
          {activeTab === 'EID' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-red-500/30 bg-red-500/5 p-5 space-y-4">
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest font-bold">Eid al-Adha 2026 — Demand vs Supply Forecast</div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={eidDemandForecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="k" domain={[1400, 2000]} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} yAxisId="pct" orientation="right" domain={[0, 25]} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="demand_k" yAxisId="k" fill="rgba(245,158,11,0.3)" radius={[2,2,0,0]} name="Demand (k head)" />
                      <Bar dataKey="supply_k" yAxisId="k" fill="rgba(16,185,129,0.4)" radius={[2,2,0,0]} name="Supply (k head)" />
                      <Line type="monotone" dataKey="deficit_pct" yAxisId="pct" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} name="Deficit %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 text-[9px] font-mono">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-400/30 inline-block rounded-sm" /><span className="text-slate-500">Demand</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500/40 inline-block rounded-sm" /><span className="text-slate-500">Supply</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block" /><span className="text-slate-500">Deficit %</span></span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-red-500/20 text-[9px] font-mono text-red-400 leading-relaxed">
                  ⚠ 2026 projection: 17.8% sheep deficit at current herd depletion rate. At this deficit level, urban household access to Eid sacrifice drops significantly. Historical data shows: deficit &gt;15% → protest incidents in peripheral urban areas within 5–7 days of Eid. RRI EQ.4 protest spread probability increases by +0.08 coefficient.
                </div>
              </div>

              {/* Governorate Eid risk */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Eid Sheep Deficit by Governorate — Social Risk Matrix</div>
                <div className="space-y-2">
                  {prepareList(eidGovRisk).map((g: any, i: number) => (
                    <div key={generateStableKey(g, i, 'eid-gov')} className={cn('p-3 rounded-xl border space-y-1.5',
                      g.social_risk === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' :
                      g.social_risk === 'HIGH' ? 'border-orange-500/20' : 'border-intel-border'
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-white">{g.gov}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn('text-[10px] font-mono font-bold', g.deficit > 45 ? 'text-red-400' : g.deficit > 30 ? 'text-orange-400' : 'text-yellow-400')}>
                            −{g.deficit}%
                          </span>
                          <RiskBadge level={g.social_risk} />
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', g.deficit > 45 ? 'bg-red-500' : g.deficit > 30 ? 'bg-orange-500' : 'bg-yellow-500')}
                          style={{ width: `${g.deficit}%` }} />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-600">
                        <span>Demand: {g.demand_k}k head</span>
                        <span>Supply: {g.supply_k}k head</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RRI linkage */}
              <div className="glass rounded-xl p-5 border border-amber-500/20 bg-amber-500/5 space-y-2">
                <div className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest">RRI Linkage — Eid Deficit → Political Pressure</div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  Eid al-Adha sheep access is not purely economic — it carries deep social contract significance. A household that cannot afford Eid sacrifice signals economic collapse to that family. At 17.8% projected deficit: urban periphery households affected ≈ 380,000. This feeds directly into <span className="text-amber-400">EQ.4 protest spread</span> (β×S×I coefficient increases), <span className="text-amber-400">EQ.7 elite defection utility</span> (B_i − C_i term shifts), and <span className="text-amber-400">EQ.15 compound stress</span> (A251 coupling with S.1 public pressure variable).
                </p>
              </div>
            </div>
          )}

          {/* MEAT CRISIS DETECTION */}
          {activeTab === 'CRISIS' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Supply Chain Risk Assessment</div>
                <div className="space-y-3">
                  {prepareList(supplyChainRisks).map((r: any, i: number) => (
                    <div key={generateStableKey(r, i, 'supply-chain')} className={cn('p-4 rounded-xl border space-y-2',
                      r.risk === 'CRITICAL' ? 'border-red-500/30 bg-red-500/5' :
                      r.risk === 'HIGH' ? 'border-orange-500/20' : 'border-intel-border'
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-white">{r.stage}</span>
                        <RiskBadge level={r.risk} />
                      </div>
                      <p className="text-[9px] font-mono text-slate-400">{r.issue}</p>
                      <p className="text-[8px] font-mono text-orange-400">→ Impact: {r.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meat black market signals */}
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Meat Black Market OSINT — Crisis Signals</div>
                <div className="space-y-2">
                  {prepareList([
                    { term: '"ghanmi ghali"', ar: 'غنمي غالي', meaning: 'Sheep expensive — Eid stress signal', vel: '+284%', heat: 'CRITICAL' },
                    { term: '"mafama lahm"', ar: 'ما فاماش لحم', meaning: 'No meat available', vel: '+196%', heat: 'CRITICAL' },
                    { term: '"souk parallel lahm"', ar: 'سوق موازي لحم', meaning: 'Parallel meat market', vel: '+152%', heat: 'HIGH' },
                    { term: '"lahm bleid"', ar: 'لحم البلاد', meaning: 'Local meat (informal slaughter)', vel: '+118%', heat: 'HIGH' },
                    { term: '"dhabeh door"', ar: 'ذبيح الدور', meaning: 'Home slaughter (informal)', vel: '+94%', heat: 'MEDIUM' },
                  ]).map((s: any, i: number) => (
                    <div key={generateStableKey(s, i, 'osint')} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0', s.heat === 'CRITICAL' ? 'bg-red-500/20' : 'bg-orange-500/20')}>🥩</div>
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

          {/* PRICE INTELLIGENCE */}
          {activeTab === 'PRICE' && (
            <div className="space-y-6">
              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Regional Meat Price Matrix — Lamb · Beef vs Official Ceiling (TND/kg)</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {prepareList(['Region', 'Lamb/kg', 'Beef/kg', 'Official Lamb', 'BM Premium', 'Status']).map((h: any, index: number) => (
                          <th key={generateStableKey(h, index, 'header')} className="pb-2 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {prepareList(regionalPrices).map((r: any, i: number) => {
                        const distortion = Math.round(((r.lamb_kg - r.official_lamb) / r.official_lamb) * 100);
                        return (
                          <tr key={generateStableKey(r, i, 'price')} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 text-[10px] font-mono font-bold text-white pr-4">{r.region}</td>
                            <td className={cn('py-2.5 text-[10px] font-mono pr-4 font-bold', r.lamb_kg > 40 ? 'text-red-400' : 'text-orange-400')}>{r.lamb_kg}</td>
                            <td className="py-2.5 text-[9px] font-mono text-slate-400 pr-4">{r.beef_kg}</td>
                            <td className="py-2.5 text-[9px] font-mono text-intel-cyan pr-4">{r.official_lamb}</td>
                            <td className="py-2.5 pr-4">
                              <span className={cn('text-[10px] font-mono font-bold', distortion > 40 ? 'text-red-400' : 'text-orange-400')}>+{distortion}%</span>
                            </td>
                            <td className="py-2.5">
                              <RiskBadge level={distortion > 40 ? 'CRITICAL' : distortion > 25 ? 'HIGH' : 'MEDIUM'} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Lamb Price — Regional Bar Chart (TND/kg)</div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalPrices}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[25, 48]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`${v} TND/kg`, 'Lamb price']} />
                      <ReferenceLine y={30} stroke="rgba(0,242,255,0.4)" strokeDasharray="4 4" label={{ value: 'Official ceiling', position: 'right', fill: '#00f2ff', fontSize: 7 }} />
                      <Bar dataKey="lamb_kg" radius={[4,4,0,0]} name="Lamb price">
                        {prepareList(regionalPrices).map((e: any, i: number) => (
                          <Cell key={generateStableKey(e, i, 'cell')} fill={e.lamb_kg > 41 ? '#ef4444' : e.lamb_kg > 38 ? '#f97316' : '#f59e0b'} />
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
