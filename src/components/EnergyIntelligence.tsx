import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePipeline } from '../context/PipelineContext';
import { 
  Zap, 
  Droplets, 
  Sun, 
  Wind, 
  Activity, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Globe, 
  ShieldAlert, 
  Factory, 
  Flame, 
  Battery, 
  Network, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  Clock, 
  Info,
  Map as MapIcon,
  DollarSign,
  FileText,
  AlertCircle
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
  LineChart, 
  Line, 
  ComposedChart,
  Legend
} from 'recharts';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';
import { Map } from './Map';
import governoratesData from '../data/governorates.json';

type EnergyTab = 'overview' | 'hydrocarbons' | 'renewables' | 'grid' | 'subsidies';

const energyAlerts = [
  { code: 'ENG-GAS-01', title: 'Nawara Field Pressure Drop', impact: 'HIGH' },
  { code: 'ENG-STEG-04', title: 'Debt Ceiling Breach: 4.2B TND', impact: 'CRITICAL' },
  { code: 'ENG-GRID-09', title: 'Peak Demand Forecast +12%', impact: 'HIGH' },
  { code: 'ENG-RE-02', title: 'Solar Tender Delay - Q3 2026', impact: 'MEDIUM' },
  { code: 'ENG-SUBS-12', title: 'Fuel Price Adjustment Risk', impact: 'HIGH' }
];

const energyBalanceData = [
  { month: 'JAN', gas_generation: 2400, renewables: 120, imports: 800, demand: 3320 },
  { month: 'FEB', gas_generation: 2350, renewables: 125, imports: 850, demand: 3325 },
  { month: 'MAR', gas_generation: 2300, renewables: 130, imports: 900, demand: 3330 },
  { month: 'APR', gas_generation: 2250, renewables: 135, imports: 950, demand: 3335 },
  { month: 'MAY', gas_generation: 2200, renewables: 140, imports: 1050, demand: 3390 },
  { month: 'JUN', gas_generation: 2150, renewables: 145, imports: 1200, demand: 3500 },
  { month: 'JUL', gas_generation: 2100, renewables: 150, imports: 1500, demand: 3750 },
  { month: 'AUG', gas_generation: 2050, renewables: 155, imports: 1650, demand: 3850 },
  { month: 'SEP', gas_generation: 2100, renewables: 150, imports: 1400, demand: 3650 },
  { month: 'OCT', gas_generation: 2150, renewables: 145, imports: 1100, demand: 3400 },
  { month: 'NOV', gas_generation: 2200, renewables: 140, imports: 950, demand: 3300 },
  { month: 'DEC', gas_generation: 2250, renewables: 135, imports: 900, demand: 3280 },
];

const stegFinancialData = [
  { quarter: 'Q2 25', revenue: 820, expenditure: 1350 },
  { quarter: 'Q3 25', revenue: 850, expenditure: 1420 },
  { quarter: 'Q4 25', revenue: 880, expenditure: 1480 },
  { quarter: 'Q1 26', revenue: 840, expenditure: 1520 },
];

const productionDeclineData = [
  { year: '2016', oil: 48, gas: 2.4 },
  { year: '2017', oil: 45, gas: 2.3 },
  { year: '2018', oil: 42, gas: 2.2 },
  { year: '2019', oil: 39, gas: 2.1 },
  { year: '2020', oil: 36, gas: 2.0 },
  { year: '2021', oil: 35, gas: 1.9 },
  { year: '2022', oil: 34, gas: 1.85 },
  { year: '2023', oil: 33, gas: 1.82 },
  { year: '2024', oil: 32.5, gas: 1.81 },
  { year: '2025', oil: 32.0, gas: 1.80 },
];

const renewablesCapacityData = [
  { tech: 'Solar PV', current: 180, target: 1200, color: '#fbbf24' },
  { tech: 'Wind', current: 245, target: 800, color: '#22d3ee' },
  { tech: 'Hydro', current: 62, target: 80, color: '#3b82f6' },
  { tech: 'Biomass', current: 5, target: 50, color: '#10b981' },
];

const subsidyBreakdownData = [
  { name: 'Diesel', value: 850, color: '#475569' },
  { name: 'LPG', value: 620, color: '#f97316' },
  { name: 'Gasoline', value: 410, color: '#ef4444' },
  { name: 'Electricity', value: 220, color: '#fbbf24' },
];

const vulnerabilityPoints = [
  { id: 'v1', lat: 36.8, lng: 10.2, type: 'GRID_STRESS', intensity: 0.8, label: 'Tunis North Hub' },
  { id: 'v2', lat: 34.7, lng: 10.7, type: 'PRODUCTION_DROP', intensity: 0.9, label: 'Sfax Energy Port' },
  { id: 'v3', lat: 33.2, lng: 10.1, type: 'SUPPLY_RISK', intensity: 0.7, label: 'Tataouine Gas Link' },
  { id: 'v4', lat: 36.1, lng: 8.7, type: 'GRID_STRESS', intensity: 0.6, label: 'Kef Interconnection' },
];

export const EnergyIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EnergyTab>('overview');
  const { data } = usePipeline();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'hydrocarbons', label: 'Hydrocarbons', icon: Flame },
    { id: 'renewables', label: 'Renewables', icon: Sun },
    { id: 'grid', label: 'Grid & Infrastructure', icon: Network },
    { id: 'subsidies', label: 'Subsidies & Reform', icon: DollarSign },
  ];

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'STEG Debt to State', value: `${data.energy.steg_debt}B TND`, trend: 'CRITICAL', icon: AlertCircle, color: 'text-intel-red' },
          { label: 'Gas Import Dependency', value: `${data.energy.gas_import_pct}%`, trend: 'HIGH', icon: Globe, color: 'text-intel-orange' },
          { label: 'Renewable Share', value: `${data.energy.renewable_pct}%`, trend: 'LOW', icon: Sun, color: 'text-intel-orange' },
          { label: 'Daily Peak Demand', value: `${data.energy.peak_demand_mw.toLocaleString()} MW`, trend: 'STABLE', icon: Zap, color: 'text-intel-cyan' },
          { label: 'Electricity Access', value: '99.7%', trend: 'TARGET', icon: ShieldAlert, color: 'text-intel-green' },
          { label: 'Fuel Subsidy Cost', value: `${data.energy.fuel_subsidy_cost}B TND`, trend: 'HIGH', icon: DollarSign, color: 'text-intel-red' },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-3 md:p-4 rounded-xl border border-white/10 relative overflow-hidden group"
          >
            <CornerAccent position="tl" />
            <div className="flex flex-col h-full justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">{metric.label}</span>
                <metric.icon className={`w-3 h-3 ${metric.color}`} />
              </div>
              <div className="text-2xl font-bold text-white font-mono tracking-tighter">{metric.value}</div>
              <div className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border w-fit ${
                metric.trend === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red animate-pulse' :
                metric.trend === 'HIGH' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                metric.trend === 'LOW' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                'bg-intel-green/10 border-intel-green/30 text-intel-green'
              }`}>
                {metric.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Energy Balance Chart */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Energy Generation vs Demand</h3>
              <p className="text-[10px] text-slate-500">12-month rolling balance (MW)</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Gas</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-green"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">RE</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Imports</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={energyBalanceData}>
                <defs>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorImports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="gas_generation" stackId="1" stroke="#f97316" fill="url(#colorGas)" />
                <Area type="monotone" dataKey="renewables" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Area type="monotone" dataKey="imports" stackId="1" stroke="#a855f7" fill="url(#colorImports)" />
                <Line type="monotone" dataKey="demand" stroke="#00f2ff" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STEG Financial Health */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">STEG Financial Health</h3>
              <p className="text-[10px] text-slate-500">Revenue vs Expenditure (M TND)</p>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 bg-intel-red/10 border border-intel-red/20 rounded">
              <TrendingDown className="w-3 h-3 text-intel-red" />
              <span className="text-[10px] font-mono text-intel-red font-bold uppercase">Deficit Widening</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stegFinancialData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenditure" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-mono">Accumulated Debt</span>
              <div className="text-lg font-bold text-white font-mono">4.2B TND</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-mono">Recovery Rate</span>
              <div className="text-lg font-bold text-intel-orange font-mono">72%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Infrastructure Heatmap */}
      <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
              <MapIcon className="w-4 h-4 mr-2 text-intel-cyan" />
              Infrastructure Vulnerability Heatmap
            </h3>
            <p className="text-[10px] text-slate-500">Real-time grid stress and supply risk assessment</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-intel-red"></div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">Critical Stress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">High Risk</span>
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-white/5 relative">
          <Map 
            governorates={governoratesData.governorates as any} 
            events={[]}
            heatmapPoints={vulnerabilityPoints.map(p => ({
              lat: p.lat,
              lon: p.lng,
              intensity: p.intensity,
              label: p.label,
              risk: p.type
            }))}
            activeLayer="energy"
          />
          <div className="absolute bottom-4 right-4 glass p-3 rounded-lg border border-white/10 space-y-2 z-10">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-white/10 pb-1">Legend</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-400">
                <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                <span>Grid Overload</span>
              </div>
              <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-400">
                <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                <span>Supply Chain Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHydrocarbons = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hydrocarbon Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Crude Production', value: '32k bpd', trend: '-4.2%', icon: Droplets, color: 'text-intel-red' },
          { label: 'Gas Production', value: '1.8B m³/y', trend: '-2.8%', icon: Flame, color: 'text-intel-red' },
          { label: 'Oil Reserves', value: '425M bbl', trend: 'STABLE', icon: Battery, color: 'text-intel-cyan' },
          { label: 'Gas Reserves', value: '1.1T cf', trend: 'STABLE', icon: Factory, color: 'text-intel-cyan' },
        ].map((metric, i) => (
          <div key={i} className="glass p-3 md:p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <metric.icon className={`w-3 h-3 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
            <div className={`text-[10px] font-mono ${metric.trend.startsWith('-') ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {metric.trend} vs 2024
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Production Decline Chart */}
        <div className="lg:col-span-2 glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Production Decline Trend (10Y)</h3>
              <p className="text-[10px] text-slate-500">Historical decline in domestic crude and natural gas output</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Oil (k bpd)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Gas (B m³)</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={productionDeclineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="oil" stroke="#00f2ff" fill="#00f2ff" fillOpacity={0.1} />
                <Line yAxisId="right" type="monotone" dataKey="gas" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Assets Table */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Strategic Assets</h3>
          <div className="space-y-4">
            {[
              { name: 'El Borma', type: 'Oil/Gas', status: 'Mature', output: '12k bpd', risk: 'MEDIUM' },
              { name: 'Hasdrubal', type: 'Gas/Cond.', status: 'Active', output: '0.4B m³', risk: 'LOW' },
              { name: 'Miskar', type: 'Gas', status: 'Mature', output: '0.6B m³', risk: 'HIGH' },
              { name: 'Nawara', type: 'Gas', status: 'Strategic', output: '0.8B m³', risk: 'HIGH' },
            ].map((asset, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-white font-mono">{asset.name}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{asset.type} • {asset.status}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-[10px] font-bold text-intel-cyan font-mono">{asset.output}</div>
                  <div className={`text-[8px] font-bold px-1 rounded ${
                    asset.risk === 'HIGH' ? 'text-intel-red bg-intel-red/10' :
                    asset.risk === 'MEDIUM' ? 'text-intel-orange bg-intel-orange/10' :
                    'text-intel-green bg-intel-green/10'
                  }`}>
                    {asset.risk} RISK
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 italic">
              <Info className="w-3 h-3 text-intel-orange" />
              <span>Algerian gas imports via Transmed pipeline now cover 68% of demand.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRenewables = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* RE Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Solar Capacity', value: '180 MW', target: '1,200 MW', icon: Sun, color: 'text-intel-orange' },
          { label: 'Wind Capacity', value: '245 MW', target: '800 MW', icon: Wind, color: 'text-intel-cyan' },
          { label: 'Target 2030', value: '35%', current: '4.1%', icon: Globe, color: 'text-intel-green' },
          { label: 'Avoided CO2', value: '0.8M t/y', target: '4.5M t/y', icon: Droplets, color: 'text-intel-green' },
        ].map((metric, i) => (
          <div key={i} className="glass p-3 md:p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <metric.icon className={`w-3 h-3 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              {metric.target ? `Target: ${metric.target}` : `Current: ${metric.current}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RE Roadmap */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Renewable Energy Roadmap</h3>
              <p className="text-[10px] text-slate-500">Installed capacity vs. Strategic Plan 2030 (MW)</p>
            </div>
            <span className="text-[10px] font-mono text-intel-orange uppercase px-2 py-0.5 bg-intel-orange/10 border border-intel-orange/20 rounded">Lagging</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { year: '2020', actual: 120, target: 120 },
                { year: '2021', actual: 145, target: 250 },
                { year: '2022', actual: 180, target: 450 },
                { year: '2023', actual: 240, target: 750 },
                { year: '2024', actual: 380, target: 1200 },
                { year: '2025', actual: 487, target: 1800 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="actual" name="Actual Capacity" fill="#00f2ff" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="target" name="Target Roadmap" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity by Tech */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Capacity by Technology</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={renewablesCapacityData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="tech" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="current" radius={[0, 4, 4, 0]} barSize={20}>
                  {renewablesCapacityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {renewablesCapacityData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-500 uppercase">{item.tech}</span>
                </div>
                <div className="flex space-x-4">
                  <span className="text-white font-bold">{item.current} MW</span>
                  <span className="text-slate-600">Target: {item.target} MW</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Projects Table */}
      <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Active Renewable Projects</h3>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Project Name</th>
                <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Type</th>
                <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Capacity</th>
                <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Developer</th>
                <th className="pb-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Commissioning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: 'Kairouan Solar', type: 'PV', cap: '100 MW', status: 'Construction', dev: 'AMEA Power', date: 'Q4 2026' },
                { name: 'Gafsa Solar', type: 'PV', cap: '120 MW', status: 'Financial Close', dev: 'Voltalia', date: 'Q2 2027' },
                { name: 'Tataouine Wind', type: 'Wind', cap: '200 MW', status: 'Permitting', dev: 'Scatec', date: 'Q1 2028' },
                { name: 'Sidi Bouzid Solar', type: 'PV', cap: '50 MW', status: 'Tendered', dev: 'TBD', date: '2028' },
                { name: 'Tozeur II', type: 'PV', cap: '10 MW', status: 'Operational', dev: 'STEG', date: '2021' },
              ].map((proj, i) => (
                <tr key={i} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 text-[11px] font-bold text-white font-mono">{proj.name}</td>
                  <td className="py-4 text-[10px] text-slate-400 font-mono uppercase">{proj.type}</td>
                  <td className="py-4 text-[10px] text-intel-cyan font-bold font-mono">{proj.cap}</td>
                  <td className="py-4">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      proj.status === 'Operational' ? 'bg-intel-green/10 border-intel-green/30 text-intel-green' :
                      proj.status === 'Construction' ? 'bg-intel-cyan/10 border-intel-cyan/30 text-intel-cyan' :
                      'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
                    }`}>
                      {proj.status}
                    </span>
                  </td>
                  <td className="py-4 text-[10px] text-slate-400">{proj.dev}</td>
                  <td className="py-4 text-[10px] text-slate-500 font-mono">{proj.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderGrid = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Grid Stability', value: '94%', trend: 'WARNING', icon: Activity, color: 'text-intel-orange' },
          { label: 'Transmission Losses', value: '12%', trend: 'HIGH', icon: TrendingDown, color: 'text-intel-red' },
          { label: 'Interconnection Capacity', value: '1,200 MW', trend: 'ELMED', icon: Network, color: 'text-intel-cyan' },
          { label: 'Storage Capacity', value: '0 MW', trend: 'CRITICAL', icon: Battery, color: 'text-intel-red' },
        ].map((metric, i) => (
          <div key={i} className="glass p-3 md:p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <metric.icon className={`w-3 h-3 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
            <div className={`text-[10px] font-mono ${metric.trend === 'CRITICAL' ? 'text-intel-red' : 'text-intel-cyan'}`}>
              {metric.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Regional Grid Stress */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Regional Grid Stress Index</h3>
              <p className="text-[10px] text-slate-500">Load vs Capacity by Region (Peak Hours)</p>
            </div>
            <span className="text-[10px] font-mono text-intel-red uppercase">Summer Peak Risk</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { region: 'Greater Tunis', stress: 88, risk: 'HIGH' },
                { region: 'Sahel', stress: 72, risk: 'MEDIUM' },
                { region: 'Sfax', stress: 82, risk: 'HIGH' },
                { region: 'South West', stress: 45, risk: 'LOW' },
                { region: 'North West', stress: 58, risk: 'MEDIUM' },
                { region: 'South East', stress: 65, risk: 'MEDIUM' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="stress" radius={[2, 2, 0, 0]}>
                  { [88, 72, 82, 45, 58, 65].map((val, index) => (
                    <Cell key={`cell-${index}`} fill={val > 80 ? '#ef4444' : val > 60 ? '#f97316' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Major Infrastructure Projects */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Infrastructure Pipeline</h3>
          <div className="space-y-4">
            {[
              { name: 'ELMED Interconnector', desc: '600MW undersea link to Italy', budget: '€840M', progress: 15, status: 'Procurement' },
              { name: 'Skhira Refinery Upgrade', desc: 'Modernization of refining capacity', budget: '$450M', progress: 5, status: 'Feasibility' },
              { name: 'STEG Smart Grid Phase 1', desc: 'Rollout of 400k smart meters', budget: '€120M', progress: 45, status: 'Execution' },
              { name: 'Ghannouch CCGT Overhaul', desc: 'Efficiency upgrade for gas plant', budget: '$80M', progress: 80, status: 'Final Stage' },
            ].map((proj, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-white font-mono">{proj.name}</div>
                    <div className="text-[9px] text-slate-500">{proj.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-intel-cyan font-mono">{proj.budget}</div>
                    <div className="text-[8px] text-slate-500 uppercase">{proj.status}</div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${proj.progress}%` }}
                    className="h-full bg-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[8px] font-mono text-slate-500">{proj.progress}% Complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubsidies = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Subsidy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Energy Subsidy', value: '2.1B TND', trend: '12% of Budget', icon: DollarSign, color: 'text-intel-red' },
          { label: 'Reform Progress', value: '15%', trend: 'PHASE 1', icon: Activity, color: 'text-intel-orange' },
          { label: 'Protest Risk', value: 'HIGH', trend: 'SUBSIDY SENSITIVE', icon: ShieldAlert, color: 'text-intel-red' },
          { label: 'Fiscal Impact', value: 'CRITICAL', trend: 'STEG DEFICIT', icon: AlertTriangle, color: 'text-intel-red' },
        ].map((metric, i) => (
          <div key={i} className="glass p-3 md:p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{metric.label}</span>
              <metric.icon className={`w-3 h-3 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold text-white font-mono">{metric.value}</div>
            <div className="text-[9px] font-mono text-slate-500 uppercase">{metric.trend}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subsidy Breakdown */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
            <PieChartIcon className="w-4 h-4 mr-2 text-intel-cyan" />
            Subsidy Breakdown
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subsidyBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subsidyBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {subsidyBreakdownData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-500 uppercase">{item.name}</span>
                </div>
                <span className="text-white font-bold">{item.value}M TND</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reform Roadmap */}
        <div className="lg:col-span-2 glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Reform Roadmap & Milestones</h3>
          <div className="relative space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
            {[
              { date: 'Q1 2025', title: 'Industrial Price Adjustment', status: 'COMPLETED', impact: 'MEDIUM' },
              { date: 'Q3 2025', title: 'Smart Meter Pilot Launch', status: 'ONGOING', impact: 'LOW' },
              { date: 'Q1 2026', title: 'Fuel Subsidy Phase-out (Gasoline)', status: 'DELAYED', impact: 'HIGH' },
              { date: 'Q3 2026', title: 'Targeted Cash Transfer System', status: 'PLANNING', impact: 'CRITICAL' },
              { date: '2027', title: 'Full Electricity Tariff Reform', status: 'PLANNING', impact: 'CRITICAL' },
            ].map((milestone, i) => (
              <div key={i} className="relative pl-8 group">
                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-intel-bg transition-all ${
                  milestone.status === 'COMPLETED' ? 'bg-intel-green' :
                  milestone.status === 'ONGOING' ? 'bg-intel-cyan animate-pulse' :
                  milestone.status === 'DELAYED' ? 'bg-intel-red' :
                  'bg-slate-700'
                }`} />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">{milestone.date}</span>
                    <span className={`text-[8px] font-bold px-1 rounded ${
                      milestone.impact === 'CRITICAL' ? 'text-intel-red bg-intel-red/10' :
                      milestone.impact === 'HIGH' ? 'text-intel-orange bg-intel-orange/10' :
                      'text-intel-cyan bg-intel-cyan/10'
                    }`}>
                      {milestone.impact} IMPACT
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-white font-mono group-hover:text-intel-cyan transition-colors">{milestone.title}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{milestone.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protest Risk Assessment */}
      <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Protest Risk Assessment</h3>
            <p className="text-[10px] text-slate-500">Social sensitivity to price adjustments by region</p>
          </div>
          <div className="flex items-center space-x-2 px-2 py-1 bg-intel-red/10 border border-intel-red/20 rounded">
            <ShieldAlert className="w-3 h-3 text-intel-red" />
            <span className="text-[10px] font-mono text-intel-red font-bold uppercase">High Volatility</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { region: 'Interior (Kasserine/Gafsa)', risk: 'EXTREME', factor: 'High unemployment + cost of living', icon: AlertTriangle },
            { region: 'Greater Tunis', risk: 'HIGH', factor: 'Transport cost sensitivity', icon: Activity },
            { region: 'Coastal (Sousse/Sfax)', risk: 'MEDIUM', factor: 'Industrial impact concerns', icon: Factory },
          ].map((risk, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase">{risk.region}</span>
                <risk.icon className={`w-3 h-3 ${risk.risk === 'EXTREME' ? 'text-intel-red' : risk.risk === 'HIGH' ? 'text-intel-orange' : 'text-intel-cyan'}`} />
              </div>
              <div className="space-y-1">
                <div className={`text-lg font-bold font-mono ${risk.risk === 'EXTREME' ? 'text-intel-red' : risk.risk === 'HIGH' ? 'text-intel-orange' : 'text-intel-cyan'}`}>
                  {risk.risk}
                </div>
                <p className="text-[9px] text-slate-500 leading-tight">{risk.factor}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-intel-bg p-3 md:p-4 overflow-hidden">
      <BackgroundGrid />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <ModuleHeader 
          title="Energy Intelligence" 
          subtitle="Strategic monitoring of hydrocarbon production, renewable transition, and grid stability"
          icon={Zap}
        />

        <LiveTicker items={energyAlerts} />

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EnergyTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-mono text-[10px] uppercase tracking-widest ${
                activeTab === tab.id 
                  ? 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'hydrocarbons' && renderHydrocarbons()}
            {activeTab === 'renewables' && renderRenewables()}
            {activeTab === 'grid' && renderGrid()}
            {activeTab === 'subsidies' && renderSubsidies()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnergyIntelligence;
