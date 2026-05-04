import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, AlertCircle, ShoppingBag, TrendingUp, AlertTriangle,
  ShieldAlert, Activity, Map as MapIcon, BarChart3, Radio,
  Truck, Zap, Eye, Search, Package, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, ComposedChart,
  Area, AreaChart, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { motion as m } from 'motion/react';
import { ModuleHeader, BackgroundGrid, ScanlineOverlay } from '../shared/ProfessionalShared';
import { Map } from '../shared/Map';
import governoratesData from '../../data/governorates.json';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type TabId = 'COMMAND' | 'COMMODITIES' | 'ROUTES' | 'LEAKAGE' | 'OSINT';

// ─── DATA ────────────────────────────────────────────────────────────────────

const COMMODITIES = [
  // Category 1 — Subsidized Essentials
  { id: 'bread', name: 'Bread (Baguette)', cat: 1, official: 0.200, street: 0.320, unit: 'TND', available: 'SCARCE', css: 0.82, smugRisk: 'LOW' },
  { id: 'flour', name: 'Flour (kg)', cat: 1, official: 0.850, street: 1.400, unit: 'TND', available: 'SCARCE', css: 0.78, smugRisk: 'HIGH' },
  { id: 'semolina', name: 'Semolina (kg)', cat: 1, official: 0.650, street: 1.100, unit: 'TND', available: 'SCARCE', css: 0.81, smugRisk: 'HIGH' },
  { id: 'sugar', name: 'Sugar (kg)', cat: 1, official: 0.900, street: 1.600, unit: 'TND', available: 'LIMITED', css: 0.74, smugRisk: 'MEDIUM' },
  { id: 'oil', name: 'Cooking Oil (L)', cat: 1, official: 0.900, street: 2.500, unit: 'TND', available: 'SCARCE', css: 0.91, smugRisk: 'CRITICAL' },
  { id: 'milk', name: 'Milk (L)', cat: 1, official: 1.150, street: 1.800, unit: 'TND', available: 'LIMITED', css: 0.68, smugRisk: 'MEDIUM' },
  { id: 'butter', name: 'Butter (250g)', cat: 1, official: 2.100, street: 3.800, unit: 'TND', available: 'SCARCE', css: 0.79, smugRisk: 'MEDIUM' },
  { id: 'cheese', name: 'Processed Cheese', cat: 1, official: 3.200, street: 5.500, unit: 'TND', available: 'LIMITED', css: 0.62, smugRisk: 'LOW' },
  { id: 'yogurt', name: 'Yogurt (unit)', cat: 1, official: 0.650, street: 1.100, unit: 'TND', available: 'OK', css: 0.44, smugRisk: 'LOW' },
  { id: 'fuel_essence', name: 'Fuel Essence (L)', cat: 1, official: 2.300, street: 3.100, unit: 'TND', available: 'LIMITED', css: 0.72, smugRisk: 'CRITICAL' },
  { id: 'fuel_gazoil', name: 'Gazoil / Diesel (L)', cat: 1, official: 1.900, street: 2.800, unit: 'TND', available: 'SCARCE', css: 0.85, smugRisk: 'CRITICAL' },
  // Category 2 — Controlled but Distorted
  { id: 'chicken', name: 'Chicken (kg)', cat: 2, official: 8.500, street: 12.500, unit: 'TND', available: 'LIMITED', css: 0.71, smugRisk: 'MEDIUM' },
  { id: 'beef', name: 'Red Meat (kg)', cat: 2, official: 28.000, street: 42.000, unit: 'TND', available: 'LIMITED', css: 0.65, smugRisk: 'MEDIUM' },
  { id: 'eggs', name: 'Eggs (×6)', cat: 2, official: 2.400, street: 3.600, unit: 'TND', available: 'OK', css: 0.45, smugRisk: 'LOW' },
  { id: 'rice', name: 'Rice (kg)', cat: 2, official: 2.100, street: 3.400, unit: 'TND', available: 'LIMITED', css: 0.58, smugRisk: 'MEDIUM' },
  { id: 'coffee', name: 'Coffee (250g)', cat: 2, official: 4.500, street: 8.500, unit: 'TND', available: 'SCARCE', css: 0.77, smugRisk: 'HIGH' },
  { id: 'bananas', name: 'Bananas (kg)', cat: 2, official: 8.500, street: 14.000, unit: 'TND', available: 'LIMITED', css: 0.66, smugRisk: 'MEDIUM' },
  // Category 3 — Smuggled Consumer Goods
  { id: 'cigarettes', name: 'Cigarettes (pack)', cat: 3, official: 8.500, street: 14.000, unit: 'TND', available: 'OK', css: 0.38, smugRisk: 'CRITICAL' },
  { id: 'tyres', name: 'Car Tyres (unit)', cat: 3, official: 120.000, street: 75.000, unit: 'TND (parallel)', available: 'OK', css: 0.31, smugRisk: 'HIGH' },
  { id: 'medicine', name: 'Generic Medicine', cat: 3, official: 'Varies', street: '+60%', unit: 'TND', available: 'SCARCE', css: 0.71, smugRisk: 'HIGH' },
  { id: 'electronics', name: 'Electronics (avg)', cat: 3, official: 'Retail', street: '-25%', unit: 'TND (Libya)', available: 'OK', css: 0.22, smugRisk: 'HIGH' },
  { id: 'clothing', name: 'Clothing (import)', cat: 3, official: 'Retail', street: '-40%', unit: 'TND (parallel)', available: 'OK', css: 0.18, smugRisk: 'MEDIUM' },
] as const;

const GOVERNORATE_BMI = [
  { id: 'tataouine', name: 'Tataouine', bmi: 0.91, rsp: 0.94, leakage: 88, color: '#ef4444', cluster: 'SMUGGLING HUB' },
  { id: 'medenine', name: 'Medenine', bmi: 0.88, rsp: 0.91, leakage: 84, color: '#ef4444', cluster: 'SMUGGLING HUB' },
  { id: 'kasserine', name: 'Kasserine', bmi: 0.84, rsp: 0.87, leakage: 79, color: '#ef4444', cluster: 'FUEL CORRIDOR' },
  { id: 'gafsa', name: 'Gafsa', bmi: 0.81, rsp: 0.82, leakage: 76, color: '#ef4444', cluster: 'FUEL CORRIDOR' },
  { id: 'jendouba', name: 'Jendouba', bmi: 0.79, rsp: 0.84, leakage: 74, color: '#f97316', cluster: 'ALGERIA BORDER' },
  { id: 'gabes', name: 'Gabès', bmi: 0.76, rsp: 0.78, leakage: 71, color: '#f97316', cluster: 'COASTAL DIST.' },
  { id: 'sidi-bouzid', name: 'Sidi Bouzid', bmi: 0.73, rsp: 0.68, leakage: 68, color: '#f97316', cluster: 'LEAKAGE ZONE' },
  { id: 'kairouan', name: 'Kairouan', bmi: 0.70, rsp: 0.64, leakage: 64, color: '#f97316', cluster: 'LEAKAGE ZONE' },
  { id: 'kebili', name: 'Kébili', bmi: 0.68, rsp: 0.72, leakage: 62, color: '#f97316', cluster: 'DESERT ROUTE' },
  { id: 'sfax', name: 'Sfax', bmi: 0.65, rsp: 0.55, leakage: 58, color: '#f59e0b', cluster: 'URBAN RESALE' },
  { id: 'tunis', name: 'Tunis', bmi: 0.61, rsp: 0.42, leakage: 52, color: '#f59e0b', cluster: 'URBAN RESALE' },
  { id: 'sousse', name: 'Sousse', bmi: 0.55, rsp: 0.38, leakage: 44, color: '#f59e0b', cluster: 'URBAN RESALE' },
];

const SMUGGLING_ROUTES = [
  {
    id: 'route-1', name: 'Libya → Tataouine / Medenine',
    commodity: 'Fuel (Gazoil)', volume: 'Est. 800,000L/day',
    risk: 'CRITICAL', active: true, seizures_30d: 47,
    profit_margin: '+47%', trend: '↑ RISING',
    description: 'Primary fuel smuggling corridor. Libya gazoil at 0.15 TND/L vs Tunisia 1.90 TND official. Arbitrage margin drives massive organized flow through Ras Jdir and Ben Guerdane crossings.',
    path: ['Tripoli', 'Ras Jdir', 'Ben Guerdane', 'Medenine', 'Tataouine'],
  },
  {
    id: 'route-2', name: 'Algeria → Kasserine / Jendouba',
    commodity: 'Fuel + Consumer Goods', volume: 'Est. 400,000L/day',
    risk: 'CRITICAL', active: true, seizures_30d: 31,
    profit_margin: '+35%', trend: '↑ RISING',
    description: 'Algeria fuel differential (1.4 TND/L vs 2.3 TND official). Secondary route also carries subsidized goods westward. Thala and Kasserine crossing points. More organized than Libyan route.',
    path: ['Constantine', 'Souk Ahras', 'Jendouba', 'Kasserine'],
  },
  {
    id: 'route-3', name: 'Coastal Redistribution (Sfax → North)',
    commodity: 'Subsidized Goods', volume: 'Est. 200 tonnes/week',
    risk: 'HIGH', active: true, seizures_30d: 18,
    profit_margin: '+65%', trend: '→ STABLE',
    description: 'Subsidized cooking oil, flour, semolina purchased at official prices in interior governorates, transported to coastal urban markets for resale at 60–70% markup. STIR distribution manipulation.',
    path: ['Sidi Bouzid', 'Kairouan', 'Sfax', 'Sousse', 'Tunis'],
  },
  {
    id: 'route-4', name: 'Libya → Electronics / Consumer Goods',
    commodity: 'Electronics, Clothing', volume: 'Est. 50 tonnes/week',
    risk: 'HIGH', active: true, seizures_30d: 12,
    profit_margin: '+40%', trend: '→ STABLE',
    description: 'Duty-free goods from Libyan free zones sold in informal Tunisian markets. Primarily Ben Guerdane market. Legal grey area — locally tolerated but undermines formal retail sector.',
    path: ['Tripoli', 'Zuwara', 'Ben Guerdane', 'Medenine', 'Sfax'],
  },
];

const LEAKAGE_BY_PRODUCT = [
  { product: 'Cooking Oil', distributed: 100, retail: 42, leakage: 58, cost_mTND: 180 },
  { product: 'Flour', distributed: 100, retail: 48, leakage: 52, cost_mTND: 145 },
  { product: 'Semolina', distributed: 100, retail: 51, leakage: 49, cost_mTND: 132 },
  { product: 'Fuel (Gazoil)', distributed: 100, retail: 38, leakage: 62, cost_mTND: 420 },
  { product: 'Sugar', distributed: 100, retail: 55, leakage: 45, cost_mTND: 98 },
  { product: 'Bread Subsidy', distributed: 100, retail: 61, leakage: 39, cost_mTND: 215 },
  { product: 'Milk', distributed: 100, retail: 68, leakage: 32, cost_mTND: 76 },
];

const SEIZURE_TREND = [
  { month: 'Oct', fuel: 28, goods: 12, currency: 4 },
  { month: 'Nov', fuel: 34, goods: 15, currency: 6 },
  { month: 'Dec', fuel: 31, goods: 11, currency: 5 },
  { month: 'Jan', fuel: 42, goods: 18, currency: 8 },
  { month: 'Feb', fuel: 38, goods: 21, currency: 7 },
  { month: 'Mar', fuel: 47, goods: 24, currency: 9 },
];

const OSINT_SIGNALS = [
  { term: '"prix ytir"', arabic: 'سعر يطير', type: 'Social Media', velocity: 340, heat: 'CRITICAL', lang: 'TN-Arab', meaning: 'Price is flying / soaring — signals sudden price spike' },
  { term: '"mafama chay"', arabic: 'ما فاماش', type: 'Supply Intercept', velocity: 288, heat: 'CRITICAL', lang: 'TN-Arab', meaning: '"There is nothing left" — shortage signal' },
  { term: '"souk parallèle"', arabic: null, type: 'Grey Market', velocity: 120, heat: 'HIGH', lang: 'FR', meaning: 'Parallel market — indicates known informal trade' },
  { term: '"zit mdfouaa"', arabic: 'زيت مدعمة', type: 'Subsidy Fraud', velocity: 218, heat: 'CRITICAL', lang: 'TN-Arab', meaning: 'Subsidized oil — often context of resale or hoarding' },
  { term: '"essence libya"', arabic: null, type: 'Smuggling Route', velocity: 195, heat: 'CRITICAL', lang: 'TN-FR', meaning: 'Libyan fuel — direct smuggling reference' },
  { term: '"mazout"', arabic: null, type: 'Fuel Black Market', velocity: 164, heat: 'HIGH', lang: 'FR', meaning: 'Heating oil / gazoil — parallel fuel keyword' },
  { term: '"contrebande"', arabic: null, type: 'Smuggling General', velocity: 142, heat: 'HIGH', lang: 'FR', meaning: 'Contraband — general smuggling signal' },
  { term: '"mafama 7lib"', arabic: 'ما فاماش حليب', type: 'Milk Scarcity', velocity: 131, heat: 'HIGH', lang: 'TN-Arab', meaning: '"No milk" — shortage signal, frequently peaks before protests' },
  { term: '"parallel"', arabic: null, type: 'Market Signal', velocity: 118, heat: 'MEDIUM', lang: 'FR/EN', meaning: 'General parallel market reference' },
  { term: '"tkassar flousse"', arabic: 'تكسر الفلوس', type: 'Currency', velocity: 104, heat: 'MEDIUM', lang: 'TN-Arab', meaning: 'Money exchange at informal rates' },
  { term: '"dinar parallèle"', arabic: null, type: 'FX Black Market', velocity: 98, heat: 'MEDIUM', lang: 'FR', meaning: 'Parallel dinar rate — informal FX market' },
  { term: '"stock caché"', arabic: null, type: 'Hoarding', velocity: 87, heat: 'MEDIUM', lang: 'FR', meaning: 'Hidden stock — hoarding detection signal' },
];

const SHADOW_BASKET = [
  { category: 'Food Essentials', official: 380, informal: 680, gap: 79 },
  { category: 'Fuel / Transport', official: 120, informal: 210, gap: 75 },
  { category: 'Housing Costs', official: 450, informal: 490, gap: 9 },
  { category: 'Healthcare', official: 80, informal: 145, gap: 81 },
  { category: 'Education', official: 60, informal: 62, gap: 3 },
  { category: 'Clothing', official: 90, informal: 65, gap: -28 },
];

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'COMMAND', label: 'Command Center', icon: ShieldAlert },
  { id: 'COMMODITIES', label: 'Commodity Forensics', icon: Package },
  { id: 'ROUTES', label: 'Smuggling Routes', icon: Truck },
  { id: 'LEAKAGE', label: 'Subsidy Leakage', icon: BarChart3 },
  { id: 'OSINT', label: 'OSINT Intercepts', icon: Radio },
];

// ─── SUB-COMPONENTS (matching existing style) ────────────────────────────────

function StatRow({ label, official, real, gap }: { label: string; official: string; real: string; gap: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-3 text-xs">
      <div className="w-1/4 font-medium text-white">{label}</div>
      <div className="w-1/4 font-mono text-slate-400">{official}</div>
      <div className="w-1/4 font-mono font-bold text-white">{real}</div>
      <div className="w-1/4 text-right">
        <span className={`px-2 py-1 border rounded font-mono font-bold text-[10px] ${gap > 100 ? 'bg-intel-red/20 text-intel-red border-intel-red/30' : gap > 50 ? 'bg-intel-orange/20 text-intel-orange border-intel-orange/30' : 'bg-amber-400/20 text-amber-400 border-amber-400/30'}`}>
          {typeof gap === 'number' ? `+${gap}%` : gap}
        </span>
      </div>
    </div>
  );
}

function ComponentBar({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div className="flex items-center gap-4 text-xs group">
      <div className="w-28 text-slate-400 tracking-wide font-mono uppercase text-[10px] group-hover:text-intel-cyan transition-colors">{label}</div>
      <div className="w-10 font-mono font-bold text-white">{value.toFixed(2)}</div>
      <div className="flex-1 h-3 bg-black/40 rounded overflow-hidden border border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-intel-orange to-intel-red"
          style={{ opacity: weight }}
        />
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    CRITICAL: 'text-intel-red border-intel-red/30 bg-intel-red/10',
    HIGH: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
    MEDIUM: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    LOW: 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5',
    SCARCE: 'text-intel-red border-intel-red/30 bg-intel-red/10',
    LIMITED: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
    OK: 'text-slate-500 border-slate-700 bg-slate-800/50',
  };
  return (
    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${map[level] || 'text-slate-500 border-slate-700'}`}>
      {level}
    </span>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const BlackMarketIntelligencePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('COMMAND');
  const [selectedCategory, setSelectedCategory] = useState<1 | 2 | 3 | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const bmdiCalc = (official: number | string, street: number | string) => {
    if (typeof official !== 'number' || typeof street !== 'number') return null;
    return Math.round(((street - official) / official) * 100);
  };

  const filteredCommodities = COMMODITIES.filter(c => {
    const catMatch = selectedCategory === 'ALL' || c.cat === selectedCategory;
    const searchMatch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return catMatch && searchMatch;
  });

  const totalSubsidyLeakage = LEAKAGE_BY_PRODUCT.reduce((sum, p) => sum + p.cost_mTND * (p.leakage / 100), 0);

  return (
    <div className="space-y-6 pb-20 relative">
      <BackgroundGrid />
      <ScanlineOverlay />

      <ModuleHeader
        title="Black Market Detection"
        subtitle="Parallel economy monitoring, informal currency distortion, and price divergence engines."
        icon={ShoppingBag}
        nodeId="ECON-NODE-BM-01"
        statusLabel="ACTIVE"
      />

      {/* ── ALWAYS-VISIBLE KPI STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
          <div className="flex items-end justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl font-bold tracking-tight text-white">0.68</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">BMI Score</span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-intel-orange mt-1 px-2 py-0.5 border border-intel-orange/30 bg-intel-orange/10 rounded">
                  <AlertCircle className="h-2.5 w-2.5" /> ELEVATED
                </span>
              </div>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden border border-white/10">
            <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} className="h-full bg-gradient-to-r from-intel-orange to-intel-red" />
          </div>
        </div>

        <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Currency Distortion</span>
            <TrendingUp className="w-4 h-4 text-intel-red" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-3xl font-bold text-white">22%</span>
            <span className="font-mono text-xs text-intel-red">GAP</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            Official: 3.15 TND/USD<br />
            Parallel: 3.85 TND/USD
          </div>
        </div>

        <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Avg. Basket Inflation</span>
            <Lock className="w-4 h-4 text-intel-orange" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-3xl font-bold text-white">48.5%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">Informal margin over official subsidized pricing.</div>
        </div>

        <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Subsidy Leakage Est.</span>
            <Zap className="w-4 h-4 text-intel-red" />
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-3xl font-bold text-intel-red">{Math.round(totalSubsidyLeakage)}M</span>
            <span className="font-mono text-xs text-slate-500">TND/yr</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">Estimated annual budget leakage.</div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 relative z-10 no-scrollbar sticky top-0 bg-black/40 backdrop-blur-xl p-3 rounded-xl border border-white/5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                activeTab === tab.id
                  ? 'bg-intel-orange/20 text-intel-orange border-intel-orange/40 shadow-[0_0_16px_rgba(249,115,22,0.2)]'
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-white hover:border-white/10'
              }`}
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
          className="space-y-6 relative z-10"
        >

          {/* ════════════════════════════════════════════════
              TAB 1 — COMMAND CENTER
          ════════════════════════════════════════════════ */}
          {activeTab === 'COMMAND' && (
            <div className="space-y-6">
              {/* Existing price divergence + component bars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                  <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-5 flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2 text-intel-cyan" />
                    Price Divergence Forensics
                  </h3>
                  <div className="rounded border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <div className="w-1/4">Commodity</div>
                      <div className="w-1/4">Official</div>
                      <div className="w-1/4">Street</div>
                      <div className="w-1/4 text-right">Divergence</div>
                    </div>
                    <div className="mt-2">
                      <StatRow label="Bread (Baguette)" official="0.200 TND" real="0.320 TND" gap={60} />
                      <StatRow label="Chicken (kg)" official="8.500 TND" real="12.50 TND" gap={47} />
                      <StatRow label="Flour (kg)" official="0.850 TND" real="1.400 TND" gap={65} />
                      <StatRow label="Fuel (L)" official="2.300 TND" real="3.100 TND" gap={35} />
                      <StatRow label="Cooking Oil (L)" official="0.900 TND" real="2.500 TND" gap={177} />
                      <StatRow label="Sugar (kg)" official="0.900 TND" real="1.600 TND" gap={78} />
                      <StatRow label="Coffee (250g)" official="4.500 TND" real="8.500 TND" gap={89} />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-intel-orange/10 border border-intel-orange/30 rounded text-[10px] text-intel-orange font-mono">
                    [WARNING] Multi-layered price distortion detected. Systemic shift away from regulated market.
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                    <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-5 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-intel-cyan" />
                      Index Component Breakdown
                    </h3>
                    <div className="space-y-4">
                      <ComponentBar label="Price Gap" value={0.82} weight={1} />
                      <ComponentBar label="Supply Avail." value={0.55} weight={0.8} />
                      <ComponentBar label="Currency Div." value={0.71} weight={0.6} />
                      <ComponentBar label="Informal Signals" value={0.45} weight={0.4} />
                    </div>
                  </div>

                  {/* Shadow Basket Index */}
                  <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                    <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-4 flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-intel-orange" />
                      Shadow Basket Index — Monthly Cost (TND)
                    </h3>
                    <div className="space-y-2">
                      {SHADOW_BASKET.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-[10px] font-mono">
                          <div className="w-28 text-slate-500 uppercase tracking-tighter shrink-0">{item.category}</div>
                          <div className="flex-1 flex gap-1 h-5 items-center">
                            <div className="h-3 rounded-sm bg-intel-cyan/30" style={{ width: `${(item.official / 490) * 100}%` }} />
                            {item.gap > 0 && <div className="h-3 rounded-sm bg-intel-red/60" style={{ width: `${(Math.abs(item.informal - item.official) / 490) * 100}%` }} />}
                          </div>
                          <div className={`w-12 text-right font-bold ${item.gap > 50 ? 'text-intel-red' : item.gap > 0 ? 'text-intel-orange' : 'text-intel-cyan'}`}>
                            {item.gap > 0 ? `+${item.gap}%` : `${item.gap}%`}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[9px] font-mono text-slate-600">
                      <span className="flex items-center gap-1"><span className="w-3 h-2 bg-intel-cyan/30 inline-block rounded-sm" />Official basket</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-2 bg-intel-red/60 inline-block rounded-sm" />Informal premium</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top affected governorates */}
              <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-5 flex items-center">
                  <MapIcon className="w-4 h-4 mr-2 text-intel-cyan" />
                  Top Affected Governorates — BMI Ranking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GOVERNORATE_BMI.slice(0, 9).map((g, i) => (
                    <div key={i} className={`p-3 rounded-xl border space-y-2 ${g.bmi > 0.8 ? 'border-intel-red/30 bg-intel-red/5' : g.bmi > 0.65 ? 'border-intel-orange/20' : 'border-intel-border'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white font-mono">{g.name}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase" style={{ color: g.color, borderColor: `${g.color}40`, backgroundColor: `${g.color}10` }}>{g.cluster}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${g.bmi * 100}%`, backgroundColor: g.color }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-slate-600">BMI: <span style={{ color: g.color }} className="font-bold">{g.bmi}</span></span>
                        <span className="text-slate-600">RSP: <span className="text-white">{g.rsp}</span></span>
                        <span className="text-slate-600">Leak: <span className="text-intel-orange">{g.leakage}%</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seizure trend */}
              <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur">
                <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-widest mb-5 flex items-center">
                  <Flame className="w-4 h-4 mr-2 text-intel-orange" />
                  Customs Seizure Trend — Monthly (units/tonnes)
                </h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={SEIZURE_TREND}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="fuel" stackId="a" fill="#ef4444" fillOpacity={0.7} name="Fuel seizures" />
                      <Bar dataKey="goods" stackId="a" fill="#f97316" fillOpacity={0.7} name="Goods seizures" />
                      <Bar dataKey="currency" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Currency seizures" />
                      <Line type="monotone" dataKey="fuel" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB 2 — COMMODITY FORENSICS
          ════════════════════════════════════════════════ */}
          {activeTab === 'COMMODITIES' && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {(['ALL', 1, 2, 3] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase border transition-all ${selectedCategory === cat ? 'bg-intel-orange/20 text-intel-orange border-intel-orange/40' : 'bg-white/5 text-slate-500 border-white/5 hover:text-white'}`}
                  >
                    {cat === 'ALL' ? 'All Products' : cat === 1 ? 'Subsidized Essentials' : cat === 2 ? 'Controlled Goods' : 'Smuggled Items'}
                  </button>
                ))}
                <div className="relative ml-auto">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Search commodity..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-[10px] font-mono text-white placeholder:text-slate-700 focus:outline-none focus:border-intel-orange/40 w-48"
                  />
                </div>
              </div>

              {/* Full commodity table */}
              <div className="glass rounded-xl border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/20">
                        {['Product', 'Cat.', 'Official Price', 'Street Price', 'BMDI', 'Availability', 'Stress Score', 'Smuggling Risk'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[8px] font-mono text-slate-600 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredCommodities.map((c, i) => {
                        const bmdi = bmdiCalc(c.official as number, c.street as number);
                        return (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-[10px] font-mono font-bold text-white">{c.name}</td>
                            <td className="px-4 py-3 text-[9px] font-mono text-slate-600">
                              {c.cat === 1 ? 'SUB' : c.cat === 2 ? 'CTR' : 'SMG'}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-intel-cyan">
                              {typeof c.official === 'number' ? `${c.official.toFixed(3)} TND` : c.official}
                            </td>
                            <td className="px-4 py-3 text-[10px] font-mono text-white font-bold">
                              {typeof c.street === 'number' ? `${c.street.toFixed(3)} TND` : c.street}
                            </td>
                            <td className="px-4 py-3">
                              {bmdi !== null ? (
                                <span className={`text-[10px] font-bold font-mono ${bmdi > 100 ? 'text-intel-red' : bmdi > 50 ? 'text-intel-orange' : 'text-amber-400'}`}>
                                  +{bmdi}%
                                </span>
                              ) : <span className="text-slate-600 text-[9px] font-mono">N/A</span>}
                            </td>
                            <td className="px-4 py-3"><RiskBadge level={c.available} /></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${c.css > 0.7 ? 'bg-intel-red' : c.css > 0.5 ? 'bg-intel-orange' : 'bg-amber-500'}`} style={{ width: `${c.css * 100}%` }} />
                                </div>
                                <span className={`text-[9px] font-mono font-bold ${c.css > 0.7 ? 'text-intel-red' : c.css > 0.5 ? 'text-intel-orange' : 'text-amber-400'}`}>{c.css}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3"><RiskBadge level={c.smugRisk} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top distortion chart */}
              <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 backdrop-blur space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Black Market Distortion Index — Top 10 Products</div>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={COMMODITIES
                        .filter(c => typeof c.official === 'number' && typeof c.street === 'number')
                        .map(c => ({ name: c.name.split(' ')[0], bmdi: bmdiCalc(c.official as number, c.street as number) }))
                        .sort((a, b) => (b.bmdi || 0) - (a.bmdi || 0))
                        .slice(0, 10)
                      }
                      layout="vertical"
                      margin={{ left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} unit="%" />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`+${v}%`, 'BMDI']} />
                      <Bar dataKey="bmdi" radius={[0, 4, 4, 0]} name="BMDI %">
                        {COMMODITIES.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={i < 3 ? '#ef4444' : i < 6 ? '#f97316' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB 3 — SMUGGLING ROUTES
          ════════════════════════════════════════════════ */}
          {activeTab === 'ROUTES' && (
            <div className="space-y-5">
              {/* Route cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {SMUGGLING_ROUTES.map((r, i) => (
                  <div key={i} className={`glass rounded-xl p-5 border space-y-4 ${r.risk === 'CRITICAL' ? 'border-intel-red/30 bg-intel-red/5' : 'border-intel-orange/20'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className={`w-4 h-4 ${r.risk === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`} />
                          <span className="text-[11px] font-bold text-white uppercase tracking-tight">{r.name}</span>
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">{r.commodity}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <RiskBadge level={r.risk} />
                        <span className={`text-[8px] font-mono ${r.trend.startsWith('↑') ? 'text-intel-red' : 'text-slate-500'}`}>{r.trend}</span>
                      </div>
                    </div>

                    {/* Route path visualization */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                      {r.path.map((node, ni) => (
                        <React.Fragment key={ni}>
                          <div className={`px-2 py-1 rounded text-[8px] font-mono whitespace-nowrap shrink-0 border ${ni === 0 || ni === r.path.length - 1 ? 'border-intel-orange/40 text-intel-orange bg-intel-orange/10' : 'border-white/10 text-slate-400 bg-white/5'}`}>
                            {node}
                          </div>
                          {ni < r.path.length - 1 && (
                            <div className="w-4 h-px bg-intel-orange/40 shrink-0 relative">
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-intel-orange/40" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <p className="text-[9px] font-mono text-slate-400 leading-relaxed border-l-2 border-intel-orange/20 pl-3">{r.description}</p>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5 text-[9px] font-mono">
                      <div>
                        <div className="text-slate-600 uppercase text-[8px]">Volume</div>
                        <div className="text-white font-bold">{r.volume}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 uppercase text-[8px]">Seizures/30d</div>
                        <div className={`font-bold ${r.seizures_30d > 30 ? 'text-intel-red' : 'text-intel-orange'}`}>{r.seizures_30d}</div>
                      </div>
                      <div>
                        <div className="text-slate-600 uppercase text-[8px]">Profit Margin</div>
                        <div className="text-intel-orange font-bold">{r.profit_margin}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Map heatmap */}
              <div className="glass rounded-xl border border-intel-border/50 bg-[#0f141a]/90 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon className="w-3.5 h-3.5 text-intel-orange" />
                    National Smuggling Risk Heatmap
                  </div>
                  <div className="flex items-center gap-4 text-[8px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-intel-red inline-block" />Smuggling Hub</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-intel-orange inline-block" />Leakage Zone</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Urban Resale</span>
                  </div>
                </div>
                <div className="h-[420px]">
                  <Map
                    governorates={(governoratesData.governorates as any[]).map(g => {
                      const bmi = GOVERNORATE_BMI.find(b => b.id === g.id || b.name === g.name?.en);
                      return { ...g, rri_score: bmi ? bmi.bmi * 3 : 1.2 };
                    })}
                    events={[]}
                    activeLayer="Security"
                    heatmapPoints={SMUGGLING_ROUTES.flatMap(r => [])}
                  />
                </div>
              </div>

              {/* Predictive alert */}
              <div className="glass rounded-xl p-5 border border-intel-red/20 bg-intel-red/5 space-y-2">
                <div className="flex items-center gap-2 text-intel-red text-[10px] font-bold font-mono uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  Predictive Cascade Alert — Libya Route Disruption Scenario
                </div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  If Libya fuel route disrupted (border closure or armed incident): Southern fuel distortion projected <span className="text-intel-red font-bold">+40% within 5 days</span>. Tataouine and Medenine CSS would breach 0.95 critical threshold. Expected protest escalation in Ben Guerdane within <span className="text-intel-orange font-bold">7–10 days</span>. RRI EQ.17 cascade probability increases from 30% → 58%.
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB 4 — SUBSIDY LEAKAGE
          ════════════════════════════════════════════════ */}
          {activeTab === 'LEAKAGE' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Leakage Est.', value: `${Math.round(totalSubsidyLeakage)}M TND`, color: 'text-intel-red', sub: 'Annual budget loss' },
                  { label: 'Worst Product', value: 'Fuel (Gazoil)', color: 'text-intel-red', sub: '62% leakage rate' },
                  { label: 'Avg Leakage Rate', value: '48%', color: 'text-intel-orange', sub: 'Across all products' },
                  { label: 'Border Pressure', value: 'CRITICAL', color: 'text-intel-red', sub: 'Libya + Algeria diff.' },
                ].map((k, i) => (
                  <div key={i} className="glass rounded-xl p-4 border border-intel-border/50 bg-[#0f141a]/90 space-y-2">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className={`text-xl font-bold font-mono ${k.color}`}>{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Leakage by product */}
              <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Subsidy Leakage — Distributed vs Retail vs Leaked</div>
                <div className="space-y-3">
                  {LEAKAGE_BY_PRODUCT.map((p, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-white">{p.product}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">Budget cost: <span className="text-intel-orange">{Math.round(p.cost_mTND * p.leakage / 100)}M TND/yr</span></span>
                          <span className={`font-bold ${p.leakage > 55 ? 'text-intel-red' : 'text-intel-orange'}`}>{p.leakage}% leaked</span>
                        </div>
                      </div>
                      <div className="h-4 bg-black/40 rounded-sm overflow-hidden border border-white/5 flex">
                        <div className="h-full bg-intel-cyan/50" style={{ width: `${p.retail}%` }} title={`Retail: ${p.retail}%`} />
                        <div className="h-full bg-intel-red/70" style={{ width: `${p.leakage}%` }} title={`Leaked: ${p.leakage}%`} />
                      </div>
                      <div className="flex text-[8px] font-mono text-slate-600 gap-4">
                        <span><span className="text-intel-cyan">■</span> Retail: {p.retail}%</span>
                        <span><span className="text-intel-red">■</span> Leaked: {p.leakage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leakage chart */}
              <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Annual Budget Cost of Subsidy Leakage (Million TND)</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={LEAKAGE_BY_PRODUCT.map(p => ({ name: p.product.split(' ')[0], leaked: Math.round(p.cost_mTND * p.leakage / 100), retained: Math.round(p.cost_mTND * p.retail / 100) }))} layout="vertical" margin={{ left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} unit="M" />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={60} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      <Bar dataKey="retained" stackId="a" fill="rgba(0,242,255,0.3)" name="Reaches market (MTND)" />
                      <Bar dataKey="leaked" stackId="a" fill="rgba(239,68,68,0.7)" radius={[0, 2, 2, 0]} name="Leaked / stolen (MTND)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-5 border border-intel-orange/20 bg-intel-orange/5">
                <div className="text-[10px] font-mono text-intel-orange uppercase font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Fiscal Impact — Government Sales Pitch
                </div>
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                  Estimated <span className="text-intel-red font-bold">{Math.round(totalSubsidyLeakage)}M TND annually</span> in direct subsidy leakage — equivalent to approximately <span className="text-intel-orange font-bold">4.2% of total annual subsidy expenditure</span>. Fuel leakage alone (62% of distributed volume) costs the state an estimated <span className="text-intel-red font-bold">260M TND/year</span>. Real-time BPEIS intelligence can reduce leakage by 20–35% through targeted enforcement positioning.
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB 5 — OSINT INTERCEPTS
          ════════════════════════════════════════════════ */}
          {activeTab === 'OSINT' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Active Keywords', value: String(OSINT_SIGNALS.length), color: 'text-intel-cyan', sub: 'Across 3 languages' },
                  { label: 'Critical Signals', value: String(OSINT_SIGNALS.filter(s => s.heat === 'CRITICAL').length), color: 'text-intel-red', sub: 'Velocity >200%' },
                  { label: 'Top Spike', value: '+340%', color: 'text-intel-red', sub: '"prix ytir" — now' },
                  { label: 'Platforms Monitored', value: '6', color: 'text-intel-cyan', sub: 'FB, TikTok, TG, WA, TW, Souk' },
                ].map((k, i) => (
                  <div key={i} className="glass rounded-xl p-4 border border-intel-border/50 bg-[#0f141a]/90 space-y-2">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</div>
                    <div className={`text-2xl font-bold font-mono ${k.color}`}>{k.value}</div>
                    <div className="text-[9px] font-mono text-slate-600">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Full signal list */}
              <div className="glass rounded-xl border border-intel-border/50 bg-[#0f141a]/90 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-intel-orange" />
                  Automated OSINT Signal Registry — Live Monitoring
                </div>
                <div className="divide-y divide-white/5">
                  {OSINT_SIGNALS.map((s, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.heat === 'CRITICAL' ? 'bg-intel-red/20 border border-intel-red/30' : s.heat === 'HIGH' ? 'bg-intel-orange/20 border border-intel-orange/30' : 'bg-amber-400/20 border border-amber-400/30'}`}>
                        {s.heat === 'CRITICAL' ? '🔥' : s.heat === 'HIGH' ? '⚠️' : '📡'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-0.5">
                          <span className="text-white font-mono text-sm">{s.term}</span>
                          {s.arabic && <span className="text-slate-600 font-mono text-xs" dir="rtl">{s.arabic}</span>}
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ml-auto shrink-0 ${s.heat === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/10' : s.heat === 'HIGH' ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10' : 'text-amber-400 border-amber-400/30 bg-amber-400/10'}`}>{s.heat}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-mono text-slate-500">
                          <span>{s.type}</span>
                          <span>·</span>
                          <span>{s.lang}</span>
                          <span>·</span>
                          <span className="text-slate-400 italic">{s.meaning}</span>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-sm shrink-0 px-3 py-1.5 rounded border ${s.velocity > 200 ? 'text-intel-red bg-intel-red/10 border-intel-red/20' : s.velocity > 100 ? 'text-intel-orange bg-intel-orange/10 border-intel-orange/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
                        +{s.velocity}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Velocity chart */}
              <div className="glass rounded-xl p-6 border border-intel-border/50 bg-[#0f141a]/90 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Signal Velocity Ranking — Top 8 Keywords</div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={OSINT_SIGNALS.slice(0, 8).map(s => ({ name: s.term.replace(/"/g, '').slice(0, 12), velocity: s.velocity }))}
                      layout="vertical"
                      margin={{ left: 90 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} unit="%" />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={90} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} formatter={(v: any) => [`+${v}%`, 'Signal velocity']} />
                      <Bar dataKey="velocity" radius={[0, 4, 4, 0]} name="Velocity %">
                        {OSINT_SIGNALS.slice(0, 8).map((s, i) => (
                          <Cell key={i} fill={s.velocity > 200 ? '#ef4444' : s.velocity > 100 ? '#f97316' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Platform coverage */}
              <div className="glass rounded-xl p-5 border border-intel-border/50 bg-[#0f141a]/90 space-y-4">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Platform Coverage Matrix</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { platform: 'Facebook Groups', coverage: 88, signals: 847, status: 'LIVE' },
                    { platform: 'TikTok (Vendor)', coverage: 72, signals: 312, status: 'LIVE' },
                    { platform: 'Telegram Channels', coverage: 65, signals: 218, status: 'LIVE' },
                    { platform: 'WhatsApp (sampled)', coverage: 44, signals: 124, status: 'PARTIAL' },
                    { platform: 'Twitter/X', coverage: 55, signals: 189, status: 'LIVE' },
                    { platform: 'Souk.tn / Tayara', coverage: 91, signals: 432, status: 'LIVE' },
                  ].map((p, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white">{p.platform}</span>
                        <span className={`text-[7px] font-mono px-1 py-0.5 rounded border uppercase ${p.status === 'LIVE' ? 'text-intel-cyan border-intel-cyan/30' : 'text-slate-500 border-slate-700'}`}>{p.status}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-intel-orange/60 rounded-full" style={{ width: `${p.coverage}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-600">
                        <span>Coverage: {p.coverage}%</span>
                        <span className="text-white">{p.signals} signals</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
