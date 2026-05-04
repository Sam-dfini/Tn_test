import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  CloudRain, 
  Wind, 
  Thermometer, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Activity,
  ShieldAlert,
  Waves,
  Sprout,
  Trash2,
  Cloud,
  Flame,
  Map as MapIcon,
  FireExtinguisher,
  Terminal,
  Wifi,
  Radio,
  Globe,
  Leaf,
  LayoutGrid,
  Search,
  Eye,
  EyeOff,
  Mountain,
  TreePine,
  Fish,
  Anchor,
  Sun,
  Zap,
  TrendingDown as TrendDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
  LineChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Map } from '../shared/Map';
import governoratesData from '../../data/governorates.json';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from '../shared/ProfessionalShared';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { cn } from '../../lib/utils';
import { fetchFireIntelligence, FireSignal } from '../../services/firmsService';
import { Governorate } from '../../types/intel';
import { assertKey, getRenderKey, prepareList, generateStableKey } from '../../lib/keyUtils';

const environmentalAlerts = [
  { code: 'ENV-WATER-02', title: 'Aquifer Depletion Rate: CRITICAL — Gafsa Basin', impact: 'CRITICAL' },
  { code: 'ENV-HEAT-05', title: 'Heatwave Warning: Central Regions +42°C forecast', impact: 'HIGH' },
  { code: 'ENV-SOIL-01', title: 'Erosion Risk: Northern Highlands — 3.2t/ha/yr', impact: 'HIGH' },
  { code: 'ENV-COAST-04', title: 'Sea Level Rise: Djerba Vulnerability Index 0.87', impact: 'HIGH' },
  { code: 'ENV-AGRI-09', title: 'Crop Yield Forecast: -15% vs Average — Drought Driver', impact: 'HIGH' },
  { code: 'ENV-DEFOR-03', title: 'Forest Cover Loss: 2,400ha since Jan 2025', impact: 'MEDIUM' },
];

const damReservesData = [
  { month: 'JAN', level: 35 },
  { month: 'FEB', level: 32 },
  { month: 'MAR', level: 28 },
  { month: 'APR', level: 25 },
  { month: 'MAY', level: 22 },
  { month: 'JUN', level: 18 },
  { month: 'JUL', level: 15 },
  { month: 'AUG', level: 12 }
];

const co2EmissionsData = [
  { year: '2018', val: 28.5 },
  { year: '2019', val: 29.2 },
  { year: '2020', val: 27.8 },
  { year: '2021', val: 29.5 },
  { year: '2022', val: 30.2 },
  { year: '2023', val: 31.1 },
  { year: '2024', val: 32.4 },
  { year: '2025', val: 33.8 }
];

const waterCutData = [
  { region: 'Tunis', hours: 4.5 },
  { region: 'Ariana', hours: 5.2 },
  { region: 'Ben Arous', hours: 4.8 },
  { region: 'Manouba', hours: 3.5 },
  { region: 'Bizerte', hours: 6.8 },
  { region: 'Nabeul', hours: 10.2 },
  { region: 'Zaghouan', hours: 15.5 },
  { region: 'Sousse', hours: 8.5 },
  { region: 'Monastir', hours: 7.2 },
  { region: 'Mahdia', hours: 9.8 },
  { region: 'Sfax', hours: 12.0 },
  { region: 'Kairouan', hours: 18.2 },
  { region: 'Kasserine', hours: 14.5 },
  { region: 'Sidi Bouzid', hours: 16.8 },
  { region: 'Le Kef', hours: 12.5 },
  { region: 'Siliana', hours: 13.2 },
  { region: 'Beja', hours: 5.4 },
  { region: 'Jendouba', hours: 7.8 },
  { region: 'Gafsa', hours: 22.4 },
  { region: 'Tozeur', hours: 19.5 },
  { region: 'Kebili', hours: 20.2 },
  { region: 'Gabes', hours: 17.8 },
  { region: 'Medenine', hours: 14.2 },
  { region: 'Tataouine', hours: 16.5 }
];

const landUseData = [
  { name: 'Arable Land', value: 30, color: '#22c55e' },
  { name: 'Forest', value: 8, color: '#15803d' },
  { name: 'Desert/Arid', value: 58, color: '#f59e0b' },
  { name: 'Urban', value: 4, color: '#64748b' }
];

const forestFireData = [
  { month: 'MAY', incidents: 12, hectares: 450 },
  { month: 'JUN', incidents: 28, hectares: 1200 },
  { month: 'JUL', incidents: 85, hectares: 4800 },
  { month: 'AUG', incidents: 112, hectares: 7200 },
  { month: 'SEP', incidents: 45, hectares: 2100 },
  { month: 'OCT', incidents: 18, hectares: 650 },
];

// ─── NEW: WATER HUB DATA ────────────────────────────────────────────────────

const desalinationData = [
  { time: '06:00', capacity: 120, production: 98 },
  { time: '08:00', capacity: 120, production: 110 },
  { time: '10:00', capacity: 120, production: 118 },
  { time: '12:00', capacity: 120, production: 115 },
  { time: '14:00', capacity: 120, production: 119 },
  { time: '16:00', capacity: 120, production: 112 },
  { time: '18:00', capacity: 120, production: 105 },
  { time: '20:00', capacity: 120, production: 95 },
];

const aquiferDepletionData = [
  { year: '2015', north: 82, center: 54, south: 31 },
  { year: '2017', north: 78, center: 49, south: 27 },
  { year: '2019', north: 74, center: 44, south: 22 },
  { year: '2021', north: 69, center: 38, south: 17 },
  { year: '2023', north: 63, center: 31, south: 12 },
  { year: '2025', north: 57, center: 24, south: 8 },
];

const waterSourceMix = [
  { name: 'Surface Water', value: 42, color: '#0ea5e9' },
  { name: 'Groundwater', value: 35, color: '#38bdf8' },
  { name: 'Desalination', value: 12, color: '#00f2ff' },
  { name: 'Treated Wastewater', value: 8, color: '#64748b' },
  { name: 'Rainwater Harvest', value: 3, color: '#334155' },
];

const waterSourceMixPrepared = prepareList(waterSourceMix, 'name');

const waterStressHeatmapPoints = [
  { lat: 34.74, lon: 10.76, intensity: 0.92, label: 'Sfax - Industrial/Urban Stress', risk: 'CRITICAL' },
  { lat: 35.67, lon: 10.09, intensity: 0.88, label: 'Kairouan - Agricultural Depletion', risk: 'CRITICAL' },
  { lat: 34.42, lon: 8.78, intensity: 0.95, label: 'Gafsa - Mining/Phosphate Impact', risk: 'CRITICAL' },
  { lat: 33.88, lon: 10.09, intensity: 0.85, label: 'Gabès - Chemical/Industrial Demand', risk: 'HIGH' },
  { lat: 35.03, lon: 9.48, intensity: 0.82, label: 'Sidi Bouzid - Intensive Farming', risk: 'HIGH' },
  { lat: 33.70, lon: 8.96, intensity: 0.78, label: 'Kebili - Oasis Aquifer Stress', risk: 'HIGH' },
  { lat: 32.92, lon: 10.45, intensity: 0.75, label: 'Tataouine - Arid Zone Scarcity', risk: 'HIGH' },
  { lat: 36.40, lon: 10.14, intensity: 0.72, label: 'Zaghouan - Supply Corridor Strain', risk: 'MEDIUM' },
];

const governorateWaterStress = [
  { name: 'Sfax', stress: 92, trend: 'UP', status: 'CRITICAL' },
  { name: 'Kairouan', stress: 88, trend: 'UP', status: 'CRITICAL' },
  { name: 'Gafsa', stress: 95, trend: 'STABLE', status: 'CRITICAL' },
  { name: 'Sidi Bouzid', stress: 82, trend: 'UP', status: 'HIGH' },
  { name: 'Gabès', stress: 85, trend: 'UP', status: 'HIGH' },
  { name: 'Le Kef', stress: 74, trend: 'UP', status: 'MEDIUM' },
  { name: 'Tataouine', stress: 75, trend: 'STABLE', status: 'HIGH' },
  { name: 'Zaghouan', stress: 72, trend: 'UP', status: 'MEDIUM' },
  { name: 'Kasserine', stress: 78, trend: 'UP', status: 'HIGH' },
  { name: 'Tozeur', stress: 84, trend: 'UP', status: 'HIGH' },
  { name: 'Kebili', stress: 86, trend: 'UP', status: 'HIGH' },
  { name: 'Siliana', stress: 68, trend: 'UP', status: 'MEDIUM' },
  { name: 'Jendouba', stress: 55, trend: 'UP', status: 'LOW' },
  { name: 'Beja', stress: 48, trend: 'STABLE', status: 'LOW' },
  { name: 'Bizerte', stress: 52, trend: 'UP', status: 'LOW' },
  { name: 'Nabeul', stress: 76, trend: 'UP', status: 'MEDIUM' },
  { name: 'Mahdia', stress: 79, trend: 'UP', status: 'HIGH' },
  { name: 'Monastir', stress: 81, trend: 'UP', status: 'HIGH' },
  { name: 'Sousse', stress: 83, trend: 'UP', status: 'HIGH' },
  { name: 'Tunis', stress: 70, trend: 'UP', status: 'MEDIUM' },
  { name: 'Ariana', stress: 72, trend: 'UP', status: 'MEDIUM' },
  { name: 'Ben Arous', stress: 71, trend: 'UP', status: 'MEDIUM' },
  { name: 'Manouba', stress: 65, trend: 'UP', status: 'MEDIUM' },
  { name: 'Medenine', stress: 87, trend: 'UP', status: 'HIGH' }
];

const fireRiskHeatmapPoints = [
  { lat: 36.77, lon: 8.68, intensity: 0.95, label: 'Ain Draham - North Forest', risk: 'CRITICAL' },
  { lat: 36.95, lon: 8.75, intensity: 0.82, label: 'Tabarka Coastal Ridge', risk: 'HIGH' },
  { lat: 36.45, lon: 8.35, intensity: 0.88, label: 'Ghardimaou Border Zone', risk: 'HIGH' },
  { lat: 37.15, lon: 9.75, intensity: 0.65, label: 'Bizerte Ichkeul Buffer', risk: 'MEDIUM' },
  { lat: 36.18, lon: 9.12, intensity: 0.75, label: 'El Kef Highlands', risk: 'HIGH' },
  { lat: 35.85, lon: 8.82, intensity: 0.55, label: 'Thala Arid Transition', risk: 'MEDIUM' },
  { lat: 36.52, lon: 9.48, intensity: 0.78, label: 'Siliana Forest Complex', risk: 'HIGH' },
];

const fireHotspots = [
  { id: 'FF-01', location: 'Ain Draham', risk: 'CRITICAL', status: 'Active Monitoring', hectares: 120 },
  { id: 'FF-02', location: 'Tabarka', risk: 'HIGH', status: 'Contained', hectares: 45 },
  { id: 'FF-03', location: 'Ghardimaou', risk: 'HIGH', status: 'Under Control', hectares: 80 },
  { id: 'FF-04', location: 'Bizerte North', risk: 'MEDIUM', status: 'Dormant', hectares: 12 }
];

// ─── SHARED SUB-COMPONENTS ──────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  warn?: boolean;
  trend?: 'up' | 'down' | 'stable';
}> = ({ label, value, sub, icon: Icon, color = 'text-intel-cyan', warn, trend }) => (
  <div className={cn(
    'glass rounded-xl border p-4 space-y-2 transition-all hover:border-white/20',
    warn ? 'border-intel-red/30 bg-intel-red/5' : 'border-intel-border'
  )}>
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      <Icon className={cn('w-3.5 h-3.5', warn ? 'text-intel-red' : color)} />
    </div>
    <div className="flex items-end justify-between">
      <div>
        <div className={cn('text-xl font-bold font-mono tracking-tighter', warn ? 'text-white' : 'text-white')}>
          {value}
        </div>
        {sub && <div className="text-[8px] font-mono text-slate-500 mt-0.5">{sub}</div>}
      </div>
      {trend && (
        <div className={cn(
          'text-[8px] font-mono font-bold px-1 rounded flex items-center',
          trend === 'up' && warn ? 'text-intel-red' : (trend === 'up' ? 'text-intel-cyan' : 'text-intel-red')
        )}>
          {trend === 'up' ? <TrendingUp className="w-2 h-2 mr-0.5" /> : trend === 'down' ? <TrendingDown className="w-2 h-2 mr-0.5" /> : null}
          {trend === 'up' ? '+%' : trend === 'down' ? '-%' : 'STABLE'}
        </div>
      )}
    </div>
  </div>
);

const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  badge?: string;
  badgeColor?: string;
}> = ({ icon: Icon, title, badge, badgeColor = 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5' }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
        <Icon className="w-4 h-4 text-intel-cyan" />
      </div>
      <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
    </div>
    {badge && (
      <div className={cn('px-2 py-0.5 rounded border text-[8px] font-black tracking-widest', badgeColor)}>
        {badge}
      </div>
    )}
  </div>
);

const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  const getStyles = () => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': case 'EXTREME': return 'text-intel-red border-intel-red/30 bg-intel-red/5';
      case 'HIGH': case 'SEVERE': return 'text-intel-orange border-intel-orange/30 bg-intel-orange/5';
      case 'MEDIUM': case 'MODERATE': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5';
      default: return 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/5';
    }
  };
  return (
    <span className={cn('px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-tighter', getStyles())}>
      {level}
    </span>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export const EnvironmentalIntelligence: React.FC = () => {
  const { fullData: data } = useRiskMetrics();
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // Fire Map States
  const [showFireChoropleth, setShowFireChoropleth] = useState(true);
  const [showThermalDots, setShowThermalDots] = useState(true);
  const [showActualFires, setShowActualFires] = useState(false);
  const [fireSignals, setFireSignals] = useState<FireSignal[]>([]);

  useEffect(() => {
    const loadFireData = async () => {
      try {
        const result = await fetchFireIntelligence(true); // Using simulated data for now
        setFireSignals(result.hotspots);
      } catch (err) {
        console.error("Failed to load fire data", err);
      }
    };
    loadFireData();
  }, []);

  // Filter governorates for fire risk choropleth
  const fireRiskGovernorates = useMemo(() => {
    if (!showFireChoropleth) return [];
    
    return (governoratesData.governorates as unknown as Governorate[]).map(gov => {
      let riskScore = 1.2; 
      if (['Jendouba', 'Béja', 'Kasserine', 'Siliana'].includes(gov.name.en)) {
        riskScore = 2.45; 
      } else if (['Le Kef', 'Bizerte', 'Zaghouan'].includes(gov.name.en)) {
        riskScore = 2.15; 
      } else if (['Nabeul', 'Kairouan', 'Sidi Bouzid'].includes(gov.name.en)) {
        riskScore = 1.85; 
      }
      return { ...gov, rri_score: riskScore };
    });
  }, [showFireChoropleth]);

  // Heatmap points for actual fires
  const actualFirePoints = useMemo(() => {
    if (!showActualFires) return [];
    return fireSignals.map(s => ({
      id: s.id,
      lat: s.lat,
      lon: s.lon,
      intensity: s.protestProbability,
      label: `${s.nearestUrbanCenter} - ${s.fireType}`,
      risk: s.fireType.includes('PROTEST') ? 'CRITICAL' : 'HIGH'
    }));
  }, [showActualFires, fireSignals]);

  // Combined heatmap points
  const combinedHeatmapPoints = useMemo(() => {
    const points = [];
    if (showThermalDots) points.push(...fireRiskHeatmapPoints);
    if (showActualFires) points.push(...actualFirePoints);
    return points;
  }, [showThermalDots, showActualFires, actualFirePoints]);

  const categories = [
    { id: 'ALL', label: 'All intelligence map', icon: MapIcon },
    { id: 'WATER', label: 'Water Security', icon: Droplets },
    { id: 'ECOLOGY', label: 'Ecological Stability', icon: Sprout },
    { id: 'CLIMATE', label: 'Climate Risks', icon: Thermometer },
  ];

  const show = (id: string) => activeCategory === id;

  const [activeMapLayer, setActiveMapLayer] = useState('Water Stress');

  const mappedGovernorates = useMemo(() => {
    return (governoratesData.governorates as unknown as Governorate[]).map(gov => {
      let rri = 1.0;
      if (activeMapLayer === 'Water Stress') {
        const stressData = governorateWaterStress.find(s => s.name === gov.name.en);
        rri = stressData ? stressData.stress / 30 : 1.5;
      } else if (activeMapLayer === 'Fire Risk') {
        if (['Jendouba', 'Béja', 'Kasserine', 'Siliana'].includes(gov.name.en)) rri = 2.8;
        else if (['Le Kef', 'Bizerte'].includes(gov.name.en)) rri = 2.2;
        else rri = 1.2;
      }
      return { ...gov, rri_score: rri };
    });
  }, [activeMapLayer]);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="p-3 md:p-4 space-y-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />

      <ModuleHeader
        title="Environmental Intelligence"
        subtitle="Hydric stress, desertification indices, climate-driven instability risk — unified environmental threat picture"
        icon={Leaf}
        nodeId="ENV-NODE-07"
      />

      {/* Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 bg-black/40 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-white/5 shadow-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {prepareList(categories).map((cat: any, idx) => (
            <button
              key={generateStableKey(cat, idx, 'env-cat')}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                activeCategory === cat.id
                  ? 'bg-intel-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              )}
            >
              <cat.icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 group-focus-within:text-intel-cyan transition-colors" />
          <input
            type="text"
            placeholder="SEARCH ENVIRONMENTAL DATABASE..."
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-intel-cyan/50 focus:ring-1 focus:ring-intel-cyan/20 w-full md:w-64 transition-all"
          />
        </div>
      </div>

      <LiveTicker items={environmentalAlerts} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="space-y-10"
        >
          {/* ═══════════════════════════════════════════════════════════
              ALL INTELLIGENCE MAP
          ═══════════════════════════════════════════════════════════ */}
          {activeCategory === 'ALL' && (
            <div className="space-y-6">
              <SectionHeader icon={MapIcon} title="Sovereign Environmental Risk Map" badge="DYNAMIC LAYERS" />
              
              <div className="flex flex-wrap items-center gap-2">
                {prepareList(['Water Stress', 'Fire Risk', 'Erosion Index', 'Aquifer Depletion']).map((layer: any, layerIdx) => (
                  <button
                    key={generateStableKey(layer, layerIdx, 'map-layer')}
                    onClick={() => setActiveMapLayer(layer.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-widest transition-all',
                      activeMapLayer === layer 
                        ? 'bg-intel-cyan/20 border-intel-cyan/50 text-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {layer}
                  </button>
                ))}
              </div>

              <div className="glass rounded-xl border border-intel-border overflow-hidden h-[600px] relative">
                <Map 
                  governorates={mappedGovernorates}
                  events={[]}
                  activeLayer="Environmental"
                  externalActiveLayer={activeMapLayer}
                />
                
                <div className="absolute bottom-6 right-6 glass p-4 rounded-xl border border-white/10 z-10 max-w-[200px] space-y-3">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Layer Legend: {activeMapLayer}</div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-intel-red" />
                      <span className="text-[8px] font-mono text-slate-400">CRITICAL RISK</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-intel-orange" />
                      <span className="text-[8px] font-mono text-slate-400">HIGH STRESS</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-yellow-500" />
                      <span className="text-[8px] font-mono text-slate-400">MODERATE</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded bg-intel-cyan" />
                      <span className="text-[8px] font-mono text-slate-400">STABLE / OPTIMAL</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Active Hotspots" value="12" sub="Across 4 categories" icon={Flame} warn />
                <StatCard label="Regional Anomalies" value=" +2.4σ" sub="Std dev from 10yr mean" icon={Activity} color="text-intel-orange" />
                <StatCard label="Map Confidence" value="98.2%" sub="Verified Sentinel Feed" icon={ShieldAlert} color="text-emerald-400" />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              WATER SECURITY
          ═══════════════════════════════════════════════════════════ */}
          {show('WATER') && (
            <div className="space-y-6">
              <SectionHeader icon={Droplets} title="Water Security & Hydric Stress" badge="CRITICAL" badgeColor="text-intel-red border-intel-red/30 bg-intel-red/5" />

              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Governorates in Crisis" value={String(data?.social?.water_crisis_govs ?? 7)} sub="Critical water stress" icon={AlertTriangle} warn trend="up" />
                <StatCard label="National Water Stress" value="74%" sub="Above scarcity threshold" icon={Droplets} warn trend="up" />
                <StatCard label="Dam Reserve Level" value="12%" sub="vs 35% Jan baseline" icon={Waves} warn trend="down" />
                <StatCard label="Potable Coverage" value="94.2%" sub="Urban — Rural: 78%" icon={CheckCircle2} color="text-intel-cyan" trend="down" />
              </div>

              {/* Aquifer Depletion + Water Source Mix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Aquifer Reserve Levels — by Region</div>
                    <div className="text-[9px] font-mono text-slate-600 text-xs">% of estimated total capacity (2015 baseline)</div>
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={aquiferDepletionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0, 100]} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="north" stroke="#00f2ff" strokeWidth={2} dot={false} name="North" />
                        <Line type="monotone" dataKey="center" stroke="#f97316" strokeWidth={2} dot={false} name="Centre" />
                        <Line type="monotone" dataKey="south" stroke="#ef4444" strokeWidth={2} dot={false} name="South" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center space-x-6 text-[9px] font-mono">
                    <span className="flex items-center space-x-1.5"><span className="w-3 h-0.5 bg-intel-cyan inline-block" /><span className="text-slate-400">North</span></span>
                    <span className="flex items-center space-x-1.5"><span className="w-3 h-0.5 bg-intel-orange inline-block" /><span className="text-slate-400">Centre</span></span>
                    <span className="flex items-center space-x-1.5"><span className="w-3 h-0.5 bg-intel-red inline-block" /><span className="text-slate-400">South — Critical</span></span>
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Water Source Mix</div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={waterSourceMix} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                          {waterSourceMix.map((entry, i) => <Cell key={assertKey(getRenderKey(entry, i, 'water-source'))} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {waterSourceMixPrepared.map((item: any, idx) => (
                      <div key={generateStableKey(item, idx, 'water-mix')} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[9px] font-mono text-slate-500">{item.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-white">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desalination + Stress Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <SectionHeader icon={Sun} title="Desalination Lifecycle" badge="Active" />
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={desalinationData}>
                        <defs>
                          <linearGradient id="desalColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="production" stroke="#0ea5e9" fillOpacity={1} fill="url(#desalColor)" strokeWidth={2} name="Production (m³/d)" />
                        <Area type="monotone" dataKey="capacity" stroke="#ffffff20" fill="transparent" strokeDasharray="5 5" name="Design Capacity" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4 overflow-hidden">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Regional Supply Deficit Matrix</div>
                  <div className="h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {prepareList(governorateWaterStress.slice(0, 15)).map((gov: any, i) => (
                      <div key={generateStableKey(gov, i, 'water-stress')} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 group hover:border-intel-cyan/30 transition-all">
                        <div className="flex items-center space-x-3">
                          <RiskBadge level={gov.status} />
                          <span className="text-[10px] font-bold text-white uppercase">{gov.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden hidden md:block">
                            <div className="h-full bg-intel-cyan" style={{ width: `${gov.stress}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{gov.stress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              ECOLOGICAL STABILITY
          ═══════════════════════════════════════════════════════════ */}
          {show('ECOLOGY') && (
            <div className="space-y-6">
              <SectionHeader icon={Sprout} title="Ecological Stability & Land Use" badge="MONITORING" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Desertification Risk" value="62%" sub="Arid transition zone" icon={TrendingUp} warn trend="up" />
                <StatCard label="Forest Cover Loss" value="2.4k ha" sub="Since Jan 2025" icon={TreePine} warn trend="up" />
                <StatCard label="Soil Erosion" value="3.2 t/ha" sub="Annual average loss" icon={Mountain} warn trend="stable" />
                <StatCard label="Protected Areas" value="8.4%" sub="of National Territory" icon={ShieldAlert} color="text-intel-green" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Biodiversity Health Radar</div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Forest Integrity', A: 45, fullMark: 100 },
                        { subject: 'Species Variance', A: 32, fullMark: 100 },
                        { subject: 'Habitat Continuity', A: 28, fullMark: 100 },
                        { subject: 'Soil Quality', A: 42, fullMark: 100 },
                        { subject: 'Hydric Balance', A: 18, fullMark: 100 },
                        { subject: 'Air Quality', A: 65, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
                        <Radar name="North Region" dataKey="A" stroke="#00f2ff" fill="#00f2ff" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Desertification Index Migration (2018–2026)</div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { year: '2018', arid: 48, semiArid: 32, fertile: 20 },
                        { year: '2020', arid: 52, semiArid: 30, fertile: 18 },
                        { year: '2022', arid: 55, semiArid: 29, fertile: 16 },
                        { year: '2024', arid: 58, semiArid: 28, fertile: 14 },
                        { year: '2026', arid: 62, semiArid: 26, fertile: 12 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="arid" stackId="a" fill="#f59e0b" name="Arid/Desert" />
                        <Bar dataKey="semiArid" stackId="a" fill="#78350f" name="Semi-Arid" />
                        <Bar dataKey="fertile" stackId="a" fill="#15803d" name="Fertile/Arable" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-6 text-[9px] font-mono">
                    <span className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-[#f59e0b]" /> <span className="text-slate-400">Arid Transit</span></span>
                    <span className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-[#15803d]" /> <span className="text-slate-400">Total Fertile Yield</span></span>
                  </div>
                </div>
              </div>

              {/* Two-Column Soil & Coast */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center">
                    <Mountain className="w-3 h-3 mr-2" /> Soil Erosion Hotspots
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                    {[
                      { region: 'Northern Highlands', rate: '3.2 t/ha/yr', risk: 'HIGH' },
                      { region: 'Medjerda Basin', rate: '2.8 t/ha/yr', risk: 'MEDIUM' },
                      { region: 'Central Steppes', rate: '1.9 t/ha/yr', risk: 'MEDIUM' },
                      { region: 'Cap Bon Slopes', rate: '4.5 t/ha/yr', risk: 'CRITICAL' },
                    ].map((row, i) => (
                      <div key={`soil-erosion-stable-${i}-${row.region}`} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] font-bold text-white uppercase">{row.region}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-mono text-slate-400">{row.rate}</span>
                          <RiskBadge level={row.risk} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center">
                    <Waves className="w-3 h-3 mr-2 text-intel-cyan" /> Coastal Vulnerability Matrix
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                    {[
                      { site: 'Djerba Island', slr: '+1.2mm/yr', risk: 'Extreme' },
                      { site: 'Kerkennah Archipelago', slr: '+1.5mm/yr', risk: 'Extreme' },
                      { site: 'Gulf of Gabès', slr: '+0.8mm/yr', risk: 'Severe' },
                      { site: 'Tunis North Bay', slr: '+0.6mm/yr', risk: 'Moderate' },
                    ].map((row, i) => (
                      <div key={`coast-vuln-stable-${i}-${row.site}`} className="flex items-center justify-between p-2 rounded-lg bg-intel-cyan/5 border border-intel-cyan/10">
                        <span className="text-[10px] font-bold text-intel-cyan uppercase">{row.site}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] font-mono text-slate-400">{row.slr}</span>
                          <RiskBadge level={row.risk} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              CLIMATE RISKS
          ═══════════════════════════════════════════════════════════ */}
          {show('CLIMATE') && (
            <div className="space-y-6">
              <SectionHeader icon={Thermometer} title="Climate Hazards & Thermal Extremes" badge="HIGH RISK" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Avg Temp Anomaly" value="+2.1°C" sub="vs 1990-2020 base" icon={Thermometer} warn trend="up" />
                <StatCard label="Heatwave Frequency" value="+45%" sub="Increased vs 5yr average" icon={Zap} warn trend="up" />
                <StatCard label="Rainfall Deficit" value="-38%" sub="Cumulative deficit" icon={CloudRain} warn trend="down" />
                <StatCard label="Fire Risk Index" value="8.4/10" sub="Extreme fuel load north" icon={Flame} warn trend="up" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Temperature Anomaly Map (2020–2026)</div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                        <XAxis type="number" dataKey="month" name="month" unit="" hide />
                        <YAxis type="number" dataKey="temp" name="temp" unit="°C" hide />
                        <ZAxis type="number" dataKey="anomaly" range={[50, 400]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Scatter name="Anomalies" data={[
                          { month: 1, temp: 18, anomaly: 1.2 },
                          { month: 2, temp: 20, anomaly: 1.5 },
                          { month: 4, temp: 28, anomaly: 2.4 },
                          { month: 6, temp: 38, anomaly: 3.8 },
                          { month: 8, temp: 42, anomaly: 4.5 },
                          { month: 10, temp: 30, anomaly: 2.1 },
                          { month: 12, temp: 22, anomaly: 1.8 },
                        ]} fill="#ef4444" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-3 rounded-lg bg-intel-red/5 border border-intel-red/20 text-[10px] font-mono text-slate-400">
                    <span className="text-intel-red font-bold">INSIGHT:</span> Summer peak temperatures in 2025 exceeded local historical records in 8 governorates, accelerating evaporation from Sidi Salem reservoir.
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Drought Index: SPEI Matrix</div>
                  <div className="space-y-4">
                    {[
                      { period: '90-Day Accum', val: -2.4, status: 'EXCESSIVE' },
                      { period: '180-Day Accum', val: -1.8, status: 'SEVERE' },
                      { period: '12-Month Accum', val: -1.5, status: 'MODERATE' },
                      { period: '3-Year Trend', val: -2.1, status: 'SEVERE' },
                    ].map((row, i) => (
                      <div key={`spei-stable-${i}-${row.period}`} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono uppercase">
                          <span className="text-slate-400">{row.period}</span>
                          <span className={cn('font-bold', row.val < -2 ? 'text-intel-red' : 'text-intel-orange')}>{row.val} index</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={cn('h-full', row.val < -2 ? 'bg-intel-red' : 'bg-intel-orange')} style={{ width: `${Math.abs(row.val) * 25}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fire Risks & Sea Level Rise */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <SectionHeader icon={Flame} title="Active Forest Fire Hotspots" />
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {fireHotspots.map(spot => (
                      <div key={`fire-spot-stable-${spot.id}`} className="p-3 rounded-xl bg-white/5 border border-intel-border hover:border-intel-red/30 transition-all flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <div className="p-1.5 rounded-lg bg-intel-red/10 text-intel-red group-hover:scale-110 transition-transform"><Flame className="w-4 h-4" /></div>
                          <div>
                            <div className="text-[10px] font-bold text-white uppercase">{spot.location}</div>
                            <div className="text-[9px] font-mono text-slate-500 italic">{spot.status}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <RiskBadge level={spot.risk} />
                          <div className="text-[9px] font-mono text-slate-400 mt-1">{spot.hectares} ha burned</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-xl border border-intel-border p-5 space-y-4">
                  <SectionHeader icon={Waves} title="Sea Level Rise Impact Projection" />
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { year: '2020', level: 0 },
                        { year: '2025', level: 4.5 },
                        { year: '2030', level: 12.8 },
                        { year: '2035', level: 25.2 },
                        { year: '2040', level: 48.5 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                        <Area type="step" dataKey="level" stroke="#00f2ff" fill="#00f2ff10" strokeWidth={2} name="Mean Delta (mm)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 leading-relaxed italic">
                    Projection models indicate accelerated coastal erosion in Sfax industrial zones and Djerba tourism infrastructure by 2035.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Environmental Risk Dossiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-20">
            {[
              {
                title: 'Hydric Stress & Social Unrest',
                risk: 'CRITICAL',
                desc: 'Tunisia is below the absolute water scarcity threshold (500m³/capita/year). Rationing in interior regions like Gafsa and Kairouan is triggering localized protests. Water security is now a primary national security concern.'
              },
              {
                title: 'Forest Fire Proliferation',
                risk: 'CRITICAL',
                desc: 'Rising summer temperatures and prolonged droughts have increased wildfire frequency by 40% since 2020. The Kroumirie and Mogods forests are at extreme risk. Human activity (both accidental and arson) accounts for 90% of ignitions.'
              },
            ].map((dossier, i) => (
              <div key={`env-dossier-stable-${i}-${dossier.title}`} className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border relative overflow-hidden">
                <CornerAccent position="tl" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <ShieldAlert className="w-5 h-5 text-intel-red" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">{dossier.title}</h4>
                  </div>
                  <RiskBadge level={dossier.risk} />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans uppercase tracking-tight">
                  {dossier.desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
