import React, { useState } from 'react';
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
  Search
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
  LineChart
} from 'recharts';
import { Map } from './Map';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';

const environmentalAlerts = [
  { code: 'ENV-WATER-02', title: 'Aquifer Depletion Rate: CRITICAL', impact: 'CRITICAL' },
  { code: 'ENV-HEAT-05', title: 'Heatwave Warning: Central Regions', impact: 'HIGH' },
  { code: 'ENV-SOIL-01', title: 'Erosion Risk: Northern Highlands', impact: 'HIGH' },
  { code: 'ENV-COAST-04', title: 'Sea Level Rise: Djerba Vulnerability', impact: 'HIGH' },
  { code: 'ENV-AGRI-09', title: 'Crop Yield Forecast: -15% vs Average', impact: 'HIGH' }
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
  { region: 'Grand Tunis', hours: 4.5 },
  { region: 'Sfax', hours: 12.0 },
  { region: 'Sousse', hours: 8.5 },
  { region: 'Kairouan', hours: 18.2 },
  { region: 'Zaghouan', hours: 15.5 },
  { region: 'Nabeul', hours: 10.2 },
  { region: 'Bizerte', hours: 6.8 },
  { region: 'Gafsa', hours: 22.4 }
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
  { month: 'OCT', incidents: 18, hectares: 650 }
];

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
  { name: 'Tataouine', stress: 75, trend: 'STABLE', status: 'HIGH' },
  { name: 'Zaghouan', stress: 72, trend: 'UP', status: 'MEDIUM' },
  { name: 'Kasserine', stress: 78, trend: 'UP', status: 'HIGH' },
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

export const EnvironmentalIntelligence: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Intelligence', icon: LayoutGrid },
    { id: 'WATER', label: 'Water Security', icon: Droplets },
    { id: 'ECOLOGY', label: 'Ecological Stability', icon: Sprout },
    { id: 'CLIMATE', label: 'Climate Risks', icon: Flame },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Ecological Stability & Water Security"
        subtitle="Monitoring hydric stress, desertification, and climate-driven stability risks"
        icon={Leaf}
        nodeId="ENV-NODE-02"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-2xl">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-intel-cyan text-black shadow-[0_0_20px_rgba(0,242,255,0.3)]'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* CATEGORY 1: WATER SECURITY & HYDRIC STRESS */}
          {(activeCategory === 'ALL' || activeCategory === 'WATER') && (
            <div className="space-y-6 relative z-20">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
                <Droplets className="w-4 h-4 text-intel-cyan" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Water Security & Hydric Stress</h3>
              </div>

        {/* Key Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Dam Reserves', value: '28%', status: 'CRITICAL', icon: Waves },
            { label: 'Potable Water Coverage', value: '94.2%', status: 'WARNING', icon: Droplets },
            { label: 'Aquifer Depletion', value: '82%', status: 'CRITICAL', icon: Activity },
            { label: 'Avg Temp Anomaly', value: '+2.1°C', status: 'CRITICAL', icon: Thermometer },
          ].map((metric, i) => (
            <div key={i} className="glass p-6 rounded-3xl border border-intel-border relative overflow-hidden group">
              <CornerAccent position="tl" />
              <CornerAccent position="br" />
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-intel-cyan group-hover:scale-110 transition-transform duration-300">
                  <metric.icon className="w-5 h-5" />
                </div>
                <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  metric.status === 'CRITICAL' ? 'text-intel-red border-intel-red/30 bg-intel-red/5' : 'text-intel-orange border-intel-orange/30 bg-intel-orange/5'
                }`}>
                  {metric.status}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{metric.label}</div>
                <div className="text-2xl font-bold text-white tracking-tight">{metric.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dam Reserves Decline */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Dam Reserve Levels</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-mono">2026 Hydric Stress Trend Analysis</p>
              </div>
              <Waves className="w-5 h-5 text-intel-cyan" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={damReservesData}>
                  <defs>
                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="level" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorWater)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Cut Impact */}
          <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Regional Water Cuts</h3>
              <Activity className="w-5 h-5 text-intel-cyan" />
            </div>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {waterCutData.map((item) => (
                <div key={item.region} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono uppercase">
                    <span className="text-slate-400">{item.region}</span>
                    <span className="text-white font-bold">{item.hours}h/day</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-intel-cyan" style={{ width: `${(item.hours / 24) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Water Crisis Heatmap & Regional Stress Analysis */}
        <div className="glass p-8 rounded-3xl border border-intel-border space-y-6">
          <CornerAccent position="tl" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Water Crisis Heatmap & Regional Stress Analysis</h3>
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Governorate-level hydric stress & aquifer depletion monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-intel-cyan animate-pulse"></div>
                <span className="text-[10px] font-mono text-intel-cyan uppercase font-bold">Hydric Stress Indicators</span>
              </div>
              <Droplets className="w-5 h-5 text-intel-cyan" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[500px] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/20">
              <Map 
                governorates={[]} 
                events={[]} 
                activeLayer="Water Security" 
                heatmapPoints={waterStressHeatmapPoints}
              />
            </div>
            
            <div className="lg:col-span-1 space-y-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-intel-border pb-2">Governorate Stress Index</div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                {governorateWaterStress.map((gov) => (
                  <div key={gov.name} className="p-3 rounded-xl bg-white/5 border border-intel-border hover:border-intel-cyan/30 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{gov.name}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                        gov.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                      }`}>
                        {gov.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${gov.stress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full ${gov.stress > 90 ? 'bg-intel-red' : 'bg-intel-orange'}`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white font-mono">{gov.stress}%</span>
                        {gov.trend === 'UP' ? (
                          <TrendingUp className="w-3 h-3 text-intel-red" />
                        ) : (
                          <Activity className="w-3 h-3 text-intel-cyan" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-intel-cyan/5 border border-intel-cyan/20">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-intel-cyan" />
                  <span className="text-[10px] font-bold text-intel-cyan uppercase">Security Implication</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                  Stress levels exceeding 80% in agricultural hubs (Sidi Bouzid, Kairouan) correlate with increased risk of localized social unrest and rural-to-urban migration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

          {/* CATEGORY 2: ECOLOGICAL STABILITY & LAND USE */}
          {(activeCategory === 'ALL' || activeCategory === 'ECOLOGY') && (
            <div className="space-y-6 relative z-20">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
                <Sprout className="w-4 h-4 text-intel-cyan" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Ecological Stability & Land Use</h3>
              </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Land Classification */}
          <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Land Classification</h3>
              <PieChartIcon className="w-5 h-5 text-intel-cyan" />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={landUseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {landUseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {landUseData.map(item => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">{item.name} {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* CO2 Emissions */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">CO2 Emissions Trend</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-mono">National Carbon Footprint Analysis</p>
              </div>
              <Cloud className="w-5 h-5 text-intel-cyan" />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={co2EmissionsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="val" stroke="#00f2ff" strokeWidth={3} dot={{ fill: '#00f2ff', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    )}

          {/* CATEGORY 3: CLIMATE RISKS & FOREST FIRES */}
          {(activeCategory === 'ALL' || activeCategory === 'CLIMATE') && (
            <div className="space-y-6 relative z-20">
              <div className="flex items-center space-x-2 border-b border-intel-border/30 pb-2">
                <Flame className="w-4 h-4 text-intel-red" />
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Climate Risks & Forest Fires</h3>
              </div>

      {/* Forest Fire Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-20">
        <div className="lg:col-span-2 glass p-8 rounded-3xl border border-intel-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Forest Fire Dynamics</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase font-mono">Incidents vs. Hectares Burned (2025)</p>
            </div>
            <Flame className="w-5 h-5 text-intel-red" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forestFireData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="incidents" fill="#f97316" fillOpacity={0.6} radius={[4, 4, 0, 0]} name="Total Incidents" />
                <Line type="monotone" dataKey="hectares" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Hectares Burned" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 glass p-8 rounded-3xl border border-intel-border">
          <div className="flex items-center justify-between mb-8 border-b border-intel-border pb-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Active Hotspots</h3>
            <MapIcon className="w-4 h-4 text-intel-cyan" />
          </div>
          <div className="space-y-4">
            {fireHotspots.map((spot) => (
              <div key={spot.id} className="p-4 rounded-xl bg-white/5 border border-intel-border hover:border-intel-cyan/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">{spot.location}</div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">{spot.id}</div>
                  </div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    spot.risk === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' : 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                  }`}>
                    {spot.risk}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{spot.status}</span>
                  </div>
                  <div className="text-[10px] font-mono text-intel-cyan">{spot.hectares} Ha</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forest Fire Risk & Ecological Heatmap */}
      <div className="glass p-8 rounded-3xl border border-intel-border space-y-6 relative z-20">
        <CornerAccent position="tr" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Forest Fire Risk & Ecological Heatmap</h3>
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Satellite-derived thermal anomalies & fuel load analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse"></div>
              <span className="text-[10px] font-mono text-intel-red uppercase font-bold">Active Thermal Anomalies</span>
            </div>
            <FireExtinguisher className="w-5 h-5 text-intel-red" />
          </div>
        </div>
        <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/20">
          <Map 
            governorates={[]} 
            events={[]} 
            activeLayer="Environmental" 
            heatmapPoints={fireRiskHeatmapPoints}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[
            { title: 'Fuel Load Density', color: 'text-intel-green', desc: 'High biomass accumulation in North-West forests increasing ignition potential.' },
            { title: 'Thermal Anomalies', color: 'text-intel-red', desc: 'Real-time satellite detection of surface temperature spikes > 45°C.' },
            { title: 'Ecological Vulnerability', color: 'text-intel-cyan', desc: 'Endemic species habitats at risk of permanent degradation from fire cycles.' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 group hover:border-white/20 transition-all">
              <div className={`text-[10px] font-bold ${item.color} uppercase tracking-widest flex items-center space-x-2`}>
                <div className={`w-1 h-1 rounded-full bg-current`}></div>
                <span>{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    )}

          {/* Environmental Risk Dossiers */}
          {(activeCategory === 'ALL' || activeCategory === 'CLIMATE' || activeCategory === 'WATER') && (
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
                <div key={i} className="glass p-8 rounded-3xl border border-intel-border relative overflow-hidden">
                  <CornerAccent position="tl" />
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <ShieldAlert className="w-5 h-5 text-intel-red" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-widest">{dossier.title}</h4>
                    </div>
                    <span className="text-[8px] font-mono px-2 py-0.5 rounded border border-intel-red/30 bg-intel-red/5 text-intel-red uppercase">
                      {dossier.risk}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans uppercase tracking-tight">
                    {dossier.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
