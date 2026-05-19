import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sprout, Droplets, CloudRain, AlertTriangle, TrendingUp, Activity,
  Waves, Leaf, Globe, ShieldAlert, Wheat, Users, Cpu, Zap, ArrowRight,
  Map as MapIcon, BarChart3, FlaskConical, TrendingDown, CheckCircle2,
  AlertCircle, Truck, Package, Tractor, Sun, Wind, Thermometer,
  LayoutGrid, Search,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line,
  ComposedChart, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis,
} from 'recharts';
const Map = React.lazy(() => import('../shared/Map').then(m => ({ default: m.Map })));
import { Governorate } from '../../types/intel';
import governoratesData from '../../data/governorates.json';
import { ModuleHeader, BackgroundGrid, CornerAccent, LiveTicker } from '../shared/ProfessionalShared';
import { cn } from '../../utils/cn';
import { generateStableKey, prepareList } from '../../lib/keyUtils';
import { usePipeline } from '../../context/PipelineContext';
import { useAgriIntel } from '../../context/AgriIntelContext';
import { AgroCrisisModel } from '../agriculture/AgroCrisisModel';
import { AgroScenarioSimulator } from '../agriculture/AgroScenarioSimulator';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface AgriReading {
  governorate: string;
  ndvi: number;
  rainfall_anomaly: number;
  soil_moisture: number;
  wheat_stress: number;
  olive_health: number;
  rural_stability: number;
  risk_flag: string;
  fetched_at: string;
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const agriAlerts = [
  { code: 'AGRI-BCI-01', title: 'Bread Crisis Index ELEVATED — National wheat output -18% forecast', impact: 'CRITICAL' },
  { code: 'AGRI-OLIVE-02', title: 'Olive harvest: Sfax/Nabeul yield down 22% — drought driver', impact: 'HIGH' },
  { code: 'AGRI-PEST-03', title: 'Desert locust alert: southern border — Medenine watch', impact: 'HIGH' },
  { code: 'AGRI-FERT-04', title: 'Fertilizer import cost +31% YoY — smallholder credit stress', impact: 'HIGH' },
  { code: 'AGRI-RURAL-05', title: 'Rural protest index rising — Sidi Bouzid & Kasserine', impact: 'MEDIUM' },
  { code: 'AGRI-PRICE-06', title: 'Semolina black market spread: +40% above official price', impact: 'MEDIUM' },
];

const cropYieldByGov = [
  { gov: 'Béja', wheat: 78, olive: 82, barley: 71 },
  { gov: 'Jendouba', wheat: 72, olive: 68, barley: 65 },
  { gov: 'Siliana', wheat: 65, olive: 71, barley: 60 },
  { gov: 'Zaghouan', wheat: 60, olive: 75, barley: 55 },
  { gov: 'Bizerte', wheat: 70, olive: 78, barley: 66 },
  { gov: 'Nabeul', wheat: 55, olive: 88, barley: 48 },
  { gov: 'Sfax', wheat: 38, olive: 91, barley: 32 },
  { gov: 'Kairouan', wheat: 42, olive: 64, barley: 38 },
  { gov: 'Sidi Bouzid', wheat: 35, olive: 58, barley: 31 },
  { gov: 'Kasserine', wheat: 30, olive: 52, barley: 28 },
];

const wheatProductionTrend = [
  { year: '2018', production: 1420, target: 1600, imports: 1800 },
  { year: '2019', production: 1650, target: 1600, imports: 1600 },
  { year: '2020', production: 820, target: 1600, imports: 2100 },
  { year: '2021', production: 1380, target: 1600, imports: 1850 },
  { year: '2022', production: 960, target: 1600, imports: 2200 },
  { year: '2023', production: 1100, target: 1600, imports: 2050 },
  { year: '2024', production: 870, target: 1600, imports: 2300 },
  { year: '2025', production: 740, target: 1600, imports: 2450 },
];

const fertilizerCostData = [
  { month: 'Jan', urea: 420, phosphate: 380, potash: 290 },
  { month: 'Mar', urea: 445, phosphate: 395, potash: 305 },
  { month: 'May', urea: 480, phosphate: 410, potash: 318 },
  { month: 'Jul', urea: 510, phosphate: 430, potash: 330 },
  { month: 'Sep', urea: 535, phosphate: 450, potash: 345 },
  { month: 'Nov', urea: 560, phosphate: 465, potash: 358 },
];

const cropCalendar = [
  { crop: 'Durum Wheat', sow: 'Nov', harvest: 'Jun', stress: 'CRITICAL', area_kha: 820 },
  { crop: 'Soft Wheat', sow: 'Nov', harvest: 'Jun', stress: 'HIGH', area_kha: 240 },
  { crop: 'Barley', sow: 'Oct', harvest: 'May', stress: 'HIGH', area_kha: 380 },
  { crop: 'Olive', sow: '—', harvest: 'Oct–Feb', stress: 'HIGH', area_kha: 1800 },
  { crop: 'Date Palm', sow: '—', harvest: 'Sep–Nov', stress: 'MEDIUM', area_kha: 38 },
  { crop: 'Vegetables', sow: 'Mar', harvest: 'Aug', stress: 'MEDIUM', area_kha: 115 },
  { crop: 'Citrus', sow: '—', harvest: 'Nov–Mar', stress: 'LOW', area_kha: 22 },
  { crop: 'Tomatoes', sow: 'Apr', harvest: 'Sep', stress: 'MEDIUM', area_kha: 28 },
];

const oliveOilExportData = [
  { year: '2019', export_kt: 340, revenue_mdinar: 1820, price_usd: 2.8 },
  { year: '2020', export_kt: 220, revenue_mdinar: 1180, price_usd: 3.1 },
  { year: '2021', export_kt: 290, revenue_mdinar: 1650, price_usd: 3.4 },
  { year: '2022', export_kt: 380, revenue_mdinar: 2280, price_usd: 3.9 },
  { year: '2023', export_kt: 310, revenue_mdinar: 2050, price_usd: 4.1 },
  { year: '2024', export_kt: 260, revenue_mdinar: 1890, price_usd: 4.5 },
  { year: '2025', export_kt: 195, revenue_mdinar: 1540, price_usd: 4.8 },
];

const foodImportDependency = [
  { category: 'Cereals', dependency: 72, cost_mUSD: 1240 },
  { category: 'Sugar', dependency: 98, cost_mUSD: 320 },
  { category: 'Vegetable Oil', dependency: 85, cost_mUSD: 410 },
  { category: 'Meat', dependency: 28, cost_mUSD: 180 },
  { category: 'Dairy', dependency: 15, cost_mUSD: 95 },
  { category: 'Legumes', dependency: 62, cost_mUSD: 145 },
  { category: 'Fish', dependency: 8, cost_mUSD: 45 },
];

const bciComponents = [
  { subject: 'Supply Stress', score: 78, fullMark: 100 },
  { subject: 'Price Pressure', score: 82, fullMark: 100 },
  { subject: 'Public Signal', score: 65, fullMark: 100 },
  { subject: 'Import Disruption', score: 71, fullMark: 100 },
  { subject: 'Subsidy Adequacy', score: 58, fullMark: 100 },
  { subject: 'Distribution Chain', score: 74, fullMark: 100 },
];

const subsidyBurdenData = [
  { year: '2020', cereals: 580, energy: 1200, total: 2100 },
  { year: '2021', cereals: 720, energy: 1450, total: 2580 },
  { year: '2022', cereals: 950, energy: 1820, total: 3280 },
  { year: '2023', cereals: 1100, energy: 1650, total: 3420 },
  { year: '2024', cereals: 1280, energy: 1750, total: 3780 },
  { year: '2025', cereals: 1450, energy: 1900, total: 4100 },
];

const ruralMigrationData = [
  { year: '2015', rural_pop_pct: 34.2, migration_rate: 2.1 },
  { year: '2017', rural_pop_pct: 32.8, migration_rate: 2.4 },
  { year: '2019', rural_pop_pct: 31.5, migration_rate: 2.8 },
  { year: '2021', rural_pop_pct: 30.1, migration_rate: 3.2 },
  { year: '2023', rural_pop_pct: 28.9, migration_rate: 3.7 },
  { year: '2025', rural_pop_pct: 27.4, migration_rate: 4.2 },
];

const ruralUnrestIndex = [
  { gov: 'Sidi Bouzid', unrest: 82, drivers: 'Water cuts, low wages', status: 'CRITICAL' },
  { gov: 'Kasserine', unrest: 78, drivers: 'Unemployment, food prices', status: 'CRITICAL' },
  { gov: 'Kairouan', unrest: 74, drivers: 'Drought, subsidy cuts', status: 'HIGH' },
  { gov: 'Gafsa', unrest: 72, drivers: 'Mining decline, water', status: 'HIGH' },
  { gov: 'Jendouba', unrest: 65, drivers: 'Seasonal poverty', status: 'HIGH' },
  { gov: 'Le Kef', unrest: 60, drivers: 'Land tenure disputes', status: 'MEDIUM' },
  { gov: 'Siliana', unrest: 55, drivers: 'Credit access', status: 'MEDIUM' },
  { gov: 'Béja', unrest: 42, drivers: 'Input cost rise', status: 'LOW' },
];

const smallholderStressData = [
  { subject: 'Credit Access', score: 28, fullMark: 100 },
  { subject: 'Input Costs', score: 22, fullMark: 100 },
  { subject: 'Market Access', score: 45, fullMark: 100 },
  { subject: 'Water Rights', score: 31, fullMark: 100 },
  { subject: 'Land Security', score: 52, fullMark: 100 },
  { subject: 'Tech Adoption', score: 38, fullMark: 100 },
];

const AGRI_LAYERS = [
  { id: 'Wheat Stress', label: 'Wheat Stress', icon: Wheat, color: 'text-intel-red' },
  { id: 'Olive Health', label: 'Olive Health', icon: Leaf, color: 'text-green-400' },
  { id: 'Rainfall Anomaly', label: 'Rainfall', icon: CloudRain, color: 'text-blue-400' },
  { id: 'Soil Moisture', label: 'Soil Moisture', icon: Droplets, color: 'text-sky-400' },
  { id: 'Date Palm Health', label: 'Date Palm', icon: Sprout, color: 'text-amber-400' },
];

// ─── SHARED SUB-COMPONENTS ───────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string; warn?: boolean; trend?: 'up' | 'down' | 'stable';
}> = ({ label, value, sub, icon: Icon, color = 'text-intel-cyan', warn, trend }) => (
  <div className={cn(
    'glass rounded-xl border p-4 space-y-2 transition-all hover:border-white/20',
    warn ? 'border-intel-red/30 bg-intel-red/5' : 'border-intel-border'
  )}>
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      <Icon className={cn('w-3.5 h-3.5', warn ? 'text-intel-red' : color)} />
    </div>
    <div className={cn('text-2xl font-bold font-mono', warn ? 'text-intel-red' : color)}>{value}</div>
    {sub && (
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-slate-600">{sub}</span>
        {trend && (
          <span className={cn('text-[9px] font-mono', trend === 'up' ? 'text-intel-red' : trend === 'down' ? 'text-intel-cyan' : 'text-slate-500')}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    )}
  </div>
);

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, string> = {
    CRITICAL: 'text-intel-red border-intel-red/30 bg-intel-red/10',
    HIGH: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    LOW: 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
  };
  return (
    <span className={cn('text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase', map[level] || 'text-slate-400 border-slate-600 bg-slate-800')}>
      {level}
    </span>
  );
};

// ─── TAB DEFINITIONS ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'MAP', label: 'Territorial Map', icon: MapIcon },
  { id: 'CROPS', label: 'Crop Intelligence', icon: Wheat },
  { id: 'FOOD', label: 'Food Security', icon: Package },
  { id: 'RURAL', label: 'Rural Dynamics', icon: Tractor },
  { id: 'SIM', label: 'Simulation & Agents', icon: FlaskConical },
];

const SectionHeader: React.FC<{ icon: React.ElementType; title: string; badge?: string; badgeColor?: string }> = ({
  icon: Icon, title, badge, badgeColor = 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5'
}) => (
  <div className="flex items-center justify-between border-b border-intel-border/30 pb-3">
    <div className="flex items-center space-x-2">
      <Icon className="w-4 h-4 text-intel-cyan" />
      <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
    </div>
    {badge && <span className={cn('text-[8px] font-mono px-2 py-0.5 rounded border uppercase', badgeColor)}>{badge}</span>}
  </div>
);

const priceTrackerData = [
  { item: 'Baguette', official: '0.190', market: '0.320', spread: '+68%', risk: 'HIGH' },
  { item: 'Semolina (1kg)', official: '0.650', market: '1.100', spread: '+69%', risk: 'HIGH' },
  { item: 'Couscous (1kg)', official: '1.200', market: '2.050', spread: '+71%', risk: 'HIGH' },
  { item: 'Sunflower Oil (1L)', official: '2.800', market: '4.200', spread: '+50%', risk: 'MEDIUM' },
  { item: 'Sugar (1kg)', official: '0.900', market: '1.380', spread: '+53%', risk: 'MEDIUM' },
  { item: 'Milk (1L)', official: '1.150', market: '1.550', spread: '+35%', risk: 'MEDIUM' },
  { item: 'Eggs (×6)', official: '2.400', market: '3.100', spread: '+29%', risk: 'LOW' },
];

const SummaryCard: React.FC<{
  title: string; value: string; icon: any; color: string;
  trend?: string; nodeId?: string; live?: boolean;
}> = ({ title, value, icon: Icon, color, trend, nodeId, live }) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4 hover:border-emerald-500/30 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/10 transition-colors">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex flex-col items-end gap-1">
        {live !== undefined && (
          <span className={cn('text-[6px] font-mono px-1 py-0.5 rounded', live ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 bg-white/5')}>
            {live ? '● LIVE' : '◌ EST'}
          </span>
        )}
        {trend && (
          <span className={cn(
            'text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border',
            trend === 'OPTIMAL' || trend === 'STABLE' || trend === 'NORMAL' || trend === 'optimal' || trend === 'stable'
              ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20'
              : trend === 'MEDIUM' || trend === 'LOW' || trend === 'STRESS'
                ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20'
                : 'bg-intel-red/10 text-intel-red border-intel-red/20'
          )}>
            {trend.toUpperCase()}
          </span>
        )}
      </div>
    </div>
    <div className="text-xl font-bold text-white mb-1 font-mono tracking-tighter">{value}</div>
    <div className="text-[10px] text-white/40 uppercase tracking-widest">{title}</div>
  </div>
);

const MetricBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="p-3 bg-white/5 rounded border border-white/5 flex flex-col">
    <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{label}</span>
    <span className={cn('text-sm font-mono font-semibold', color || 'text-white')}>{value}</span>
  </div>
);

const AgentPanel: React.FC<{ name: string; role: string; status: string; finding: string; recommendation: string }> = ({
  name, role, status, finding, recommendation
}) => (
  <div className="glass rounded-xl border border-intel-border/30 p-6 bg-[#0a0a0a]/60 flex flex-col space-y-4">
    <div className="flex justify-between items-start">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20">
          <Cpu className="w-5 h-5 text-intel-cyan" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white tracking-tight">{name}</span>
          <span className="text-[10px] text-slate-500 font-mono uppercase">{role}</span>
        </div>
      </div>
      <span className={cn(
        'text-[8px] font-mono px-1.5 py-0.5 rounded border flex items-center space-x-1',
        status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      )}>
        <div className={cn('w-1 h-1 rounded-full', status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-blue-400')} />
        <span>{status}</span>
      </span>
    </div>
    <div className="space-y-3">
      <div className="p-3 bg-white/5 rounded-lg border border-white/5">
        <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Current Finding</div>
        <p className="text-[10px] text-slate-300 leading-relaxed italic">{finding}</p>
      </div>
      <div className="flex items-center space-x-2 text-intel-cyan">
        <ArrowRight className="w-3 h-3" />
        <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Recommendation: {recommendation}</span>
      </div>
    </div>
  </div>
);

export const AgriIntelDashboard: React.FC = () => {
  const { agroSummary } = useAgriIntel();
  const [readings, setReadings] = useState<Record<string, AgriReading>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('MAP');
  const [selectedGov, setSelectedGov] = useState<string | null>(null);
  const [activeMapLayer, setActiveMapLayer] = useState('Wheat Stress');

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/agri/latest');
        const json = await res.json();
        if (json.success) setReadings(json.data);
      } catch (err) {
        console.error('Failed to fetch agri readings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  const nationalAverages = useMemo(() => {
    const values = Object.values(readings);
    if (values.length === 0) return { ndvi: 0, rain: 0, soil: 0, wheat: 0, olive: 0 };
    return {
      ndvi: values.reduce((sum, r) => sum + r.ndvi, 0) / values.length,
      rain: values.reduce((sum, r) => sum + r.rainfall_anomaly, 0) / values.length,
      soil: values.reduce((sum, r) => sum + r.soil_moisture, 0) / values.length,
      wheat: values.reduce((sum, r) => sum + r.wheat_stress, 0) / values.length,
      olive: values.reduce((sum, r) => sum + r.olive_health, 0) / values.length,
    };
  }, [readings]);

  const displayMetrics = useMemo(() => {
    if (agroSummary) {
      const n = agroSummary.results.length || 1;
      return {
        bci: agroSummary.bci.BCI,
        bciLevel: agroSummary.bci.level,
        waterStress: agroSummary.national_water_stress,
        agroStress: agroSummary.national_agro_stress,
        foodRisk: agroSummary.national_food_risk,
        datePalm: agroSummary.results.reduce((s: number, r: any) => s + r.tree_crops.date_palm_health_index, 0) / n,
        vegSupply: agroSummary.results.reduce((s: number, r: any) => s + r.vegetables.vegetable_supply_index, 0) / n,
        fromPipeline: true,
      };
    }
    const wheat = nationalAverages.wheat;
    return {
      bci: Math.min(0.95, wheat * 0.7 + 0.1),
      bciLevel: wheat > 0.6 ? 'HIGH_RISK' : wheat > 0.4 ? 'STRESS' : 'NORMAL',
      waterStress: Math.min(0.95, nationalAverages.soil > 0 ? 1 - nationalAverages.soil * 0.8 : 0.45),
      agroStress: Math.min(0.95, wheat * 0.5 + 0.15),
      foodRisk: Math.min(0.95, wheat * 0.6 + 0.1),
      datePalm: Math.max(0.1, nationalAverages.ndvi * 0.85),
      vegSupply: Math.max(0.1, nationalAverages.ndvi * 0.75 + 0.1),
      fromPipeline: false,
    };
  }, [agroSummary, nationalAverages]);

  const bcewmData = useMemo(() => {
    if (agroSummary && agroSummary.bci) {
      return {
        BCI: agroSummary.bci.BCI,
        level: agroSummary.bci.level,
        supply_stress: agroSummary.bci.supply_stress,
        price_pressure: agroSummary.bci.price_pressure,
        public_signal: agroSummary.bci.public_signal,
        velocity: agroSummary.bci.velocity,
      };
    }
    return {
      BCI: displayMetrics.bci,
      level: displayMetrics.bciLevel === 'HIGH_RISK' ? 'HIGH_RISK' : displayMetrics.bciLevel === 'STRESS' ? 'HIGH_RISK' : 'NORMAL',
      supply_stress: displayMetrics.agroStress,
      price_pressure: displayMetrics.foodRisk,
      public_signal: 0.35,
      velocity: 0.05,
    };
  }, [agroSummary, displayMetrics]);

  const chartData = useMemo(() => Object.values(readings).map(r => ({
    name: r.governorate,
    wheat: r.wheat_stress * 100,
    olive: r.olive_health * 100,
    ndvi: r.ndvi,
  })).sort((a, b) => b.wheat - a.wheat), [readings]);

  const mappedGovernorates = useMemo(() => (governoratesData.governorates as any[]).map(g => {
    const reading = readings[g.id];
    const agroResult = agroSummary?.results?.find((r: any) => r.governorate === g.id);
    return {
      ...g,
      agri_metrics: reading ? {
        wheat_stress: reading.wheat_stress,
        olive_health: reading.olive_health,
        soil_moisture: reading.soil_moisture,
        rainfall_anomaly: reading.rainfall_anomaly,
        ndvi: reading.ndvi,
        date_palm_health: agroResult?.tree_crops?.date_palm_health_index ?? null,
      } : agroResult ? {
        wheat_stress: 0.35,
        olive_health: 0.5,
        soil_moisture: 0.4,
        rainfall_anomaly: 0,
        ndvi: 0.45,
        date_palm_health: agroResult.tree_crops.date_palm_health_index,
      } : null,
      rri_score: reading ? reading.wheat_stress * 3 : 1.5,
      risk_level: reading
        ? (reading.wheat_stress > 0.7 ? 'ALERT' : reading.wheat_stress > 0.4 ? 'HIGH' : 'MEDIUM')
        : g.risk_level,
    } as Governorate;
  }), [readings, agroSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 space-y-6 animate-in fade-in duration-700 relative">
      <BackgroundGrid />

      <ModuleHeader
        title="Agriculture & Food Intelligence"
        subtitle="Sovereign food security analysis — crop stress, supply chains, rural dynamics and RRI agricultural feed"
        icon={Sprout}
        nodeId="AGRI-TECH-01"
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard title="Bread Crisis Index" value={`${(displayMetrics.bci * 100).toFixed(1)}%`} icon={Wheat}
          color={displayMetrics.bciLevel === 'CRISIS' ? 'text-intel-red' : displayMetrics.bciLevel === 'HIGH_RISK' ? 'text-intel-orange' : 'text-intel-cyan'}
          trend={displayMetrics.bciLevel} nodeId="BCI" live={displayMetrics.fromPipeline} />
        <SummaryCard title="Water Stress" value={`${(displayMetrics.waterStress * 100).toFixed(1)}%`} icon={Waves}
          color={displayMetrics.waterStress > 0.6 ? 'text-intel-red' : 'text-intel-cyan'}
          trend={displayMetrics.waterStress > 0.6 ? 'CRITICAL' : 'STABLE'} nodeId="H2O" live={displayMetrics.fromPipeline} />
        <SummaryCard title="Agro-Stress" value={`${(displayMetrics.agroStress * 100).toFixed(1)}%`} icon={AlertTriangle}
          color={displayMetrics.agroStress > 0.6 ? 'text-intel-red' : 'text-intel-orange'}
          trend={displayMetrics.agroStress > 0.6 ? 'HIGH' : 'MEDIUM'} nodeId="ASI" live={displayMetrics.fromPipeline} />
        <SummaryCard title="Food Production Risk" value={`${(displayMetrics.foodRisk * 100).toFixed(1)}%`} icon={Leaf}
          color={displayMetrics.foodRisk > 0.5 ? 'text-intel-orange' : 'text-green-400'}
          trend={displayMetrics.foodRisk > 0.5 ? 'HIGH' : 'STABLE'} nodeId="FPR" live={displayMetrics.fromPipeline} />
        <SummaryCard title="Date Palm Health" value={`${(displayMetrics.datePalm * 100).toFixed(1)}%`} icon={Sprout}
          color={displayMetrics.datePalm < 0.4 ? 'text-intel-red' : displayMetrics.datePalm < 0.6 ? 'text-intel-orange' : 'text-green-400'}
          trend={displayMetrics.datePalm < 0.4 ? 'CRITICAL' : displayMetrics.datePalm < 0.6 ? 'STRESS' : 'OPTIMAL'} nodeId="PALM" live={displayMetrics.fromPipeline} />
        <SummaryCard title="Vegetable Supply" value={`${(displayMetrics.vegSupply * 100).toFixed(1)}%`} icon={Droplets}
          color={displayMetrics.vegSupply < 0.4 ? 'text-intel-red' : displayMetrics.vegSupply < 0.65 ? 'text-intel-orange' : 'text-intel-cyan'}
          trend={displayMetrics.vegSupply < 0.4 ? 'CRITICAL' : displayMetrics.vegSupply < 0.65 ? 'LOW' : 'STABLE'} nodeId="VEG" live={displayMetrics.fromPipeline} />
      </div>

      <LiveTicker items={agriAlerts} />

      {/* Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 bg-black/40 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-white/5 shadow-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_16px_rgba(34,197,94,0.2)]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              )}
            >
              <tab.icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={async () => {
            setSyncing(true);
            try {
              await fetch('/api/agri/sync', { method: 'POST' });
              const res = await fetch('/api/agri/latest');
              const json = await res.json();
              if (json.success) setReadings(json.data);
            } catch (err) { console.error('Manual sync failed:', err); }
            finally { setSyncing(false); }
          }}
          className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] uppercase font-bold text-emerald-400 transition-all font-mono flex items-center gap-1.5 whitespace-nowrap"
        >
          {syncing && <Activity className="w-3 h-3 animate-spin" />}
          {syncing ? 'Syncing...' : '↻ Sync Live Data'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="space-y-8"
        >
          {activeTab === 'MAP' && (
            <div className="space-y-6">
              <SectionHeader icon={MapIcon} title="Sovereign Agricultural Risk Map" badge="5 LAYERS" badgeColor="text-emerald-400 border-emerald-400/30 bg-emerald-400/5" />

              {/* Layer Selector */}
              <div className="flex flex-wrap items-center gap-2">
                {prepareList(AGRI_LAYERS).map((layer: any, i: number) => (
                  <button
                    key={generateStableKey(layer, i, 'layer')}
                    onClick={() => setActiveMapLayer(layer.id)}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-widest transition-all',
                      activeMapLayer === layer.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                    )}
                  >
                    <layer.icon className={cn('w-3 h-3', activeMapLayer === layer.id ? layer.color : '')} />
                    <span>{layer.label}</span>
                    {activeMapLayer === layer.id && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                  </button>
                ))}
              </div>

              {/* Map */}
              <div className="glass rounded-xl border border-intel-border overflow-hidden">
                <div className="h-[520px]">
                  <Suspense fallback={<div className="h-full w-full bg-black/20 animate-pulse" />}>
                    <Map
                      governorates={mappedGovernorates}
                      events={[]}
                      activeLayer={activeMapLayer}
                      externalActiveLayer="Agricultural Stress"
                      onSelectGovernorate={(gov) => setSelectedGov((gov as any).id ?? null)}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Map Legend + Selected Gov drill-down side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Layer Legend */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Layer Legend</div>
                  {activeMapLayer === 'Wheat Stress' && (
                    <div className="space-y-2">
                      {prepareList([
                        { color: '#ff453a', label: 'Critical (>70% stress)' },
                        { color: '#ff9f0a', label: 'High (40–70%)' },
                        { color: '#ffd60a', label: 'Moderate (20–40%)' },
                        { color: '#00f2ff', label: 'Stable (<20%)' },
                      ]).map(({ color, label }: any, i: number) => (
                        <div key={generateStableKey({ label }, i, 'wheat-legend')} className="flex items-center space-x-3">
                          <div className="w-4 h-3 rounded" style={{ backgroundColor: color }} />
                          <span className="text-[9px] font-mono text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeMapLayer === 'Olive Health' && (
                    <div className="space-y-2">
                      {prepareList([
                        { color: '#064e3b', label: 'Excellent (>85%)' },
                        { color: '#059669', label: 'Good (70–85%)' },
                        { color: '#34d399', label: 'Moderate (50–70%)' },
                        { color: '#fbbf24', label: 'Stressed (30–50%)' },
                        { color: '#ef4444', label: 'Critical (<30%)' },
                      ]).map(({ color, label }: any, i: number) => (
                        <div key={generateStableKey({ label }, i, 'olive-legend')} className="flex items-center space-x-3">
                          <div className="w-4 h-3 rounded" style={{ backgroundColor: color }} />
                          <span className="text-[9px] font-mono text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeMapLayer === 'Rainfall Anomaly' && (
                    <div className="space-y-2">
                      {prepareList([
                        { color: '#0284c7', label: 'Surplus (+)' },
                        { color: '#0ea5e9', label: 'Normal' },
                        { color: '#f97316', label: 'Deficit' },
                        { color: '#991b1b', label: 'Severe Drought' },
                      ]).map(({ color, label }: any, i: number) => (
                        <div key={generateStableKey({ label }, i, 'rain-legend')} className="flex items-center space-x-3">
                          <div className="w-4 h-3 rounded" style={{ backgroundColor: color }} />
                          <span className="text-[9px] font-mono text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeMapLayer === 'Soil Moisture' && (
                    <div className="space-y-2">
                      {prepareList([
                        { color: '#1e3a8a', label: 'Saturated' },
                        { color: '#3b82f6', label: 'Moist' },
                        { color: '#fbbf24', label: 'Dry' },
                        { color: '#78350f', label: 'Parched' },
                      ]).map(({ color, label }: any, i: number) => (
                        <div key={generateStableKey({ label }, i, 'soil-legend')} className="flex items-center space-x-3">
                          <div className="w-4 h-3 rounded" style={{ backgroundColor: color }} />
                          <span className="text-[9px] font-mono text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeMapLayer === 'Date Palm Health' && (
                    <div className="space-y-2">
                      {prepareList([
                        { color: '#14532d', label: 'Excellent' },
                        { color: '#16a34a', label: 'Good' },
                        { color: '#ca8a04', label: 'Stressed' },
                        { color: '#ea580c', label: 'Critical' },
                        { color: '#991b1b', label: 'Collapse Risk' },
                      ]).map(({ color, label }: any, i: number) => (
                        <div key={generateStableKey({ label }, i, 'palm-legend')} className="flex items-center space-x-3">
                          <div className="w-4 h-3 rounded" style={{ backgroundColor: color }} />
                          <span className="text-[9px] font-mono text-slate-400">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sentinel-2 Drill-down */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sentinel-2 Drill-down</div>
                    {selectedGov && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono uppercase">
                        {selectedGov}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MetricBox label="NDVI" value={readings[selectedGov || 'tunis']?.ndvi.toFixed(3) || '—'} />
                    <MetricBox label="Soil Moisture" value={`${((readings[selectedGov || 'tunis']?.soil_moisture || 0) * 100).toFixed(1)}%`} />
                    <MetricBox label="Rainfall Dev." value={`${((readings[selectedGov || 'tunis']?.rainfall_anomaly || 0) * 100).toFixed(1)}%`} />
                    <MetricBox label="Risk Flag" value={readings[selectedGov || 'tunis']?.risk_flag || '—'}
                      color={readings[selectedGov || 'tunis']?.risk_flag === 'CRITICAL' ? 'text-intel-red' : 'text-intel-cyan'} />
                    <MetricBox label="Wheat Stress" value={`${((readings[selectedGov || 'tunis']?.wheat_stress || 0) * 100).toFixed(1)}%`} />
                    <MetricBox label="Olive Health" value={`${((readings[selectedGov || 'tunis']?.olive_health || 0) * 100).toFixed(1)}%`} />
                  </div>
                  <p className="text-[8px] font-mono text-slate-600 leading-relaxed border-t border-white/5 pt-3">
                    Sentinel-2 L2A composite — synced every 72 hours. Scores vs 10-year phenological mean.
                  </p>
                </div>

                {/* Regional Stress Ranking */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-3">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Stress Ranking</div>
                  <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                    {prepareList(chartData).map((d: any, i: number) => (
                      <div
                        key={generateStableKey(d, i, 'rank')}
                        onClick={() => setSelectedGov(d.id)}
                        className={cn(
                          'p-2 rounded-lg border transition-all cursor-pointer',
                          selectedGov === d.id
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-mono text-white">{d.id.toUpperCase()}</span>
                          <span className={cn('text-[9px] font-mono font-bold', d.wheat > 70 ? 'text-intel-red' : d.wheat > 40 ? 'text-intel-orange' : 'text-emerald-400')}>
                            {d.wheat.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', d.wheat > 70 ? 'bg-intel-red' : d.wheat > 40 ? 'bg-intel-orange' : 'bg-emerald-500')}
                            style={{ width: `${d.wheat}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CROPS' && (
            <div className="space-y-6">
              <SectionHeader icon={Wheat} title="Crop Intelligence & Production Analytics" badge="CRISIS" badgeColor="text-intel-red border-intel-red/30 bg-intel-red/5" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Wheat Production vs Imports */}
                <div className="lg:col-span-2 glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Wheat Strategy: National Production vs Import Gap</div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={wheatProductionTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} unit="kt" />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="imports" fill="#991b1b" fillOpacity={0.1} stroke="#ef4444" strokeWidth={2} name="Import Dependency" />
                        <Bar dataKey="production" fill="#10b981" radius={[4, 4, 0, 0]} name="Local Production" />
                        <Line type="step" dataKey="target" stroke="#ffffff40" strokeWidth={1} strokeDasharray="5 5" name="Self-Sufficiency Target" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Crop Yield Table */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4 overflow-hidden">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Regional Potential vs Baseline</div>
                  <div className="h-[280px] overflow-y-auto pr-1 space-y-2">
                    {prepareList(cropYieldByGov).map((gov: any, i: number) => (
                      <div key={generateStableKey(gov, i, 'yield')} className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-white uppercase">{gov.gov}</span>
                          <span className={cn('text-[9px] font-mono', gov.wheat < 40 ? 'text-intel-red' : 'text-slate-400')}>
                            Wheat: {gov.wheat}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-[8px] text-slate-500 uppercase">Olive Yield</div>
                            <div className="h-1 bg-white/10 rounded-full">
                              <div className="h-full bg-intel-cyan rounded-full" style={{ width: `${gov.olive}%` }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-[8px] text-slate-500 uppercase">Barley Yield</div>
                            <div className="h-1 bg-white/10 rounded-full">
                              <div className="h-full bg-intel-orange rounded-full" style={{ width: `${gov.barley}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Fertilizer Costs */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Input Cost Trend: Nitrogen & Phosphate (TND/t)</div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={fertilizerCostData}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="urea" stroke="#00f2ff" fill="#00f2ff05" strokeWidth={2} name="Urea" />
                        <Area type="monotone" dataKey="phosphate" stroke="#f97316" fill="#f9731605" strokeWidth={2} name="DAP" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Crop Calendar */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4 overflow-hidden">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Strategic Production Calendar</div>
                  <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                    {prepareList(cropCalendar).map((c: any, i: number) => (
                      <div key={generateStableKey(c, i, 'cal')} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <div>
                          <div className="text-[10px] font-bold text-white uppercase">{c.crop}</div>
                          <div className="text-[8px] font-mono text-slate-500">Sow: {c.sow} / Harvest: {c.harvest}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-[9px] font-mono text-slate-400">{c.area_kha}k ha</div>
                            <RiskBadge level={c.stress} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AgroCrisisModel integration */}
              <div className="glass rounded-xl border border-intel-border p-6 relative overflow-hidden bg-white/5">
                <div className="flex items-center space-x-3 mb-6">
                  <Activity className="w-5 h-5 text-intel-red animate-pulse" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Agro-Crisis Predictive Model (ACPM)</h4>
                </div>
                <AgroCrisisModel data={bcewmData} />
              </div>
            </div>
          )}

          {activeTab === 'FOOD' && (
            <div className="space-y-6">
              <SectionHeader icon={Package} title="Sovereign Food Security & Subsidy Burden" badge="HEDGE" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Import Dependency */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Import Dependency Matrix</div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={foodImportDependency} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: '#ffffff60', fontSize: 9 }} width={80} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="dependency" radius={[0, 4, 4, 0]} name="Dependency (%)">
                          {prepareList(foodImportDependency).map((entry: any, index: number) => (
                            <Cell key={generateStableKey(entry, index, 'cell')} fill={entry.dependency > 80 ? '#ef4444' : entry.dependency > 50 ? '#f97316' : '#00f2ff'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 italic">Critical exposure: Global wheat/sugar supply shocks.</div>
                </div>

                {/* BCI Radar */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Bread Crisis Index (BCI) Breakdown</div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={bciComponents}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="BCI" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[8px] font-mono text-center text-intel-red font-bold animate-pulse">OVERALL BCI: {(displayMetrics.bci * 100).toFixed(1)}% — ELEVATED RISK</div>
                </div>

                {/* Subsidy Burden */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">National Food Subsidy Burden (MDinar)</div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={subsidyBurdenData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="cereals" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.2} name="Cereals" />
                        <Area type="monotone" dataKey="total" stackId="2" stroke="#ffffff" fill="transparent" strokeDasharray="5 5" name="Total Burden" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[8px] font-mono text-slate-500 leading-relaxed italic">
                    Rising global prices + local harvest failure = exponential burden on the Caisse Générale de Compensation.
                  </p>
                </div>
              </div>

              {/* Black Market Price Tracker */}
              <div className="glass rounded-xl border border-intel-border p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Informal Market Price Tracker (Black Market Premium)</div>
                  <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/30 font-mono">LIVE CRAWL</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Item</th>
                        <th className="text-left py-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Official (TND)</th>
                        <th className="text-left py-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Market (TND)</th>
                        <th className="text-left py-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Spread</th>
                        <th className="text-right py-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {prepareList(priceTrackerData).map((p: any, i: number) => (
                        <tr key={generateStableKey(p, i, 'price')} className="hover:bg-white/[0.02] transition-all group">
                          <td className="py-2 text-[10px] font-bold text-white uppercase">{p.item}</td>
                          <td className="py-2 text-[10px] font-mono text-slate-400">{p.official}</td>
                          <td className="py-2 text-[10px] font-mono text-white">{p.market}</td>
                          <td className="py-2 text-[10px] font-mono text-intel-red font-bold">{p.spread}</td>
                          <td className="py-2 text-right"><RiskBadge level={p.risk} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RURAL' && (
            <div className="space-y-6">
              <SectionHeader icon={Tractor} title="Rural Dynamics & Smallholder Capacity" badge="STRESSED" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Rural Migration */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Rural Migration & Demographic Shift (Exodus)</div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={ruralMigrationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} unit="%" />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#ef4444', fontSize: 10 }} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="rural_pop_pct" fill="#1e3a8a" fillOpacity={0.1} stroke="#3b82f6" name="Rural Pop %" />
                        <Line yAxisId="right" type="monotone" dataKey="migration_rate" stroke="#ef4444" strokeWidth={3} name="Outbound Rate" dot={{ r: 4, fill: '#ef4444' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[8px] font-mono text-slate-500 leading-relaxed italic">
                    Declining agricultural profitability is driving rapid urbanization and youth exodus from interior governorates.
                  </p>
                </div>

                {/* Smallholder Stress Radar */}
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center">Smallholder Vulnerability Radar</div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={smallholderStressData}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="Vulnerability" dataKey="score" stroke="#00f2ff" fill="#00f2ff" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-[8px] font-mono text-slate-500 px-4">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-intel-cyan" /> 0-40: Critical</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /> 80-100: Resilient</span>
                  </div>
                </div>
              </div>

              {/* Rural Unrest Index */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Rural Dissatisfaction Heat rank</div>
                  <div className="space-y-3">
                    {prepareList(ruralUnrestIndex).map((r: any, i: number) => (
                      <div key={generateStableKey(r, i, 'unrest')} className="p-2 border-b border-white/5 hover:bg-white/[0.02] transition-all">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-white uppercase">{r.id}</span>
                          <RiskBadge level={r.status} />
                        </div>
                        <div className="text-[9px] text-slate-500 mb-1">{r.drivers}</div>
                        <div className="h-0.5 w-full bg-white/5">
                          <div className={cn('h-full', r.unrest > 75 ? 'bg-intel-red' : 'bg-intel-orange')} style={{ width: `${r.unrest}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intelligence Dossiers */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="glass p-5 rounded-xl border border-intel-border relative overflow-hidden bg-intel-red/5">
                    <CornerAccent position="tl" />
                    <div className="flex items-center space-x-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-intel-red" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Dossier: Sidi Bouzid Water-Agro Nexus</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans uppercase tracking-tight mb-4">
                      Critical unrest detected in Sidi Bouzid over unannounced irrigation water cuts during peak heat. Smallholders reporting 40% crop loss. High correlation between hydric stress and localized protest activity.
                    </p>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 bg-intel-red/20 border border-intel-red/30 rounded text-[8px] text-intel-red font-bold">STABILITY CRITICAL</div>
                      <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] text-slate-500 font-bold tracking-widest">MONITORING ACT-04</div>
                    </div>
                  </div>

                  <div className="glass p-5 rounded-xl border border-intel-border relative overflow-hidden">
                    <CornerAccent position="tr" />
                    <div className="flex items-center space-x-3 mb-3">
                      <Users className="w-5 h-5 text-intel-cyan" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Dossier: Seasonal Labor Exodus</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans uppercase tracking-tight mb-4">
                      Tabular analysis shows 15% increase in youth migration from Jendouba (north-west) to Tunis/Coastal hubs in Q1 2026. Driver: collapse of local sugar beet profitability due to input cost spike.
                    </p>
                    <div className="flex gap-2">
                       <MetricBox label="Out-Migration rate" value="+15.2%" color="text-intel-red" />
                       <MetricBox label="Labor Retention" value="42%" color="text-intel-orange" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SIM' && (
            <div className="space-y-6">
              <SectionHeader icon={FlaskConical} title="Agro-Strategic Simulation & Synthetic Intelligence" badge="AGENTS LIVE" />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="lg:col-span-2">
                  <AgroScenarioSimulator />
                </div>

                <AgentPanel
                  name="Agent Ceres-01"
                  role="Crop Phenology Analyst"
                  status="ACTIVE"
                  finding="Detected spectral signature anomaly in Medjerda Valley wheat fields. NDVI suggests early senescence forced by hydric stress."
                  recommendation="Redistribute remaining dam reserves to North-West silos immediately to salvage 15% of yield."
                />
                <AgentPanel
                  name="Agent Hermes-04"
                  role="Supply Chain Sentinel"
                  status="MONITORING"
                  finding="Black market semolina prices in Sfax exceeded 1.300 TND. Inter-regional logistics indicating bottleneck at Rades port."
                  recommendation="Deploy strategic grain reserves to Sfax-city municipal distribution points to break informal scalping."
                />
                <AgentPanel
                   name="Agent Gaia-02"
                   role="Soil Integrity Monitor"
                   status="ACTIVE"
                   finding="Soil moisture in Kairouan basin dropped below 8% volumetric. Permanent wilting point risk for olive groves in 12 days."
                   recommendation="Trigger emergency desalination subsidy for brackish groundwater pumps in the Kairouan step."
                />
                <AgentPanel
                   name="Agent Pax-Tunisia"
                   role="Rural Stability Predictor"
                   status="ACTIVE"
                   finding="Social media sentiment in Kasserine/Sidi Bouzid shows 300% spike in 'hunger' and 'water' keywords alongside protest coordinates."
                   recommendation="Synchronize Ministry of Agriculture presence in rural forums with instant subsidy payout notifications."
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
