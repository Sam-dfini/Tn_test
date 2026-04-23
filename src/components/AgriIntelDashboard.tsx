import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  Droplets, 
  CloudRain, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Waves,
  Leaf,
  Globe,
  CornerDownRight,
  ShieldAlert,
  Info,
  Wheat
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
  LineChart,
  Line
} from 'recharts';
import { Map } from './Map';
import { Governorate } from '../types/intel';
import governoratesData from '../data/governorates.json';
import { ModuleHeader } from './ProfessionalShared';
import { cn } from '../utils/cn';
import { usePipeline } from '../context/PipelineContext';

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

export const AgriIntelDashboard: React.FC = () => {
  const { agroSummary } = usePipeline();
  const [readings, setReadings] = useState<Record<string, AgriReading>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedGov, setSelectedGov] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/agri/latest');
        const json = await res.json();
        if (json.success) {
          setReadings(json.data);
        }
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

  // Fallback display values — used when agroSummary not yet populated from pipeline
  const displayMetrics = useMemo(() => {
    if (agroSummary) {
      const n = agroSummary.results.length || 1;
      return {
        bci: agroSummary.bci.BCI,
        bciLevel: agroSummary.bci.level,
        waterStress: agroSummary.national_water_stress,
        agroStress: agroSummary.national_agro_stress,
        foodRisk: agroSummary.national_food_risk,
        datePalm: agroSummary.results.reduce((s, r) => s + r.tree_crops.date_palm_health_index, 0) / n,
        vegSupply: agroSummary.results.reduce((s, r) => s + r.vegetables.vegetable_supply_index, 0) / n,
        fromPipeline: true,
      };
    }
    // Fallback from satellite readings
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

  const chartData = useMemo(() => {
    return Object.values(readings).map(r => ({
      name: r.governorate,
      wheat: r.wheat_stress * 100,
      olive: r.olive_health * 100,
      ndvi: r.ndvi
    })).sort((a, b) => b.wheat - a.wheat);
  }, [readings]);

  // Map readings to Governorate format for the Map component
  const mappedGovernorates = useMemo(() => {
    return (governoratesData.governorates as any[]).map(g => {
      const reading = readings[g.id];
      // Find per-gov agroSummary result for date palm data
      const agroResult = agroSummary?.results?.find(r => r.governorate === g.id);
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
          // Fallback: no reading but we have an agroResult — show date palm at minimum
          wheat_stress: 0.35,
          olive_health: 0.5,
          soil_moisture: 0.4,
          rainfall_anomaly: 0,
          ndvi: 0.45,
          date_palm_health: agroResult.tree_crops.date_palm_health_index,
        } : null,
        rri_score: reading ? reading.wheat_stress * 3 : 1.5,
        risk_level: reading ? (reading.wheat_stress > 0.7 ? 'ALERT' : reading.wheat_stress > 0.4 ? 'HIGH' : 'MEDIUM') : g.risk_level
      } as Governorate;
    });
  }, [readings, agroSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 overflow-y-auto p-4 custom-scrollbar">
      {/* Header Summary */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">National Summary</h2>
        <button 
          onClick={async () => {
            setSyncing(true);
            try {
              await fetch('/api/agri/sync', { method: 'POST' });
              const res = await fetch('/api/agri/latest');
              const json = await res.json();
              if (json.success) setReadings(json.data);
            } catch (err) {
              console.error('Manual sync failed:', err);
            } finally {
              setSyncing(false);
            }
          }}
          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-[10px] uppercase font-bold text-emerald-400 transition-all font-mono flex items-center gap-1.5"
        >
          {syncing && <Activity className="w-3 h-3 animate-spin" />}
          {syncing ? 'Syncing...' : 'Sync Live Data'}
        </button>
      </div>
      {/* Advanced System Metrics — always visible, pipeline data when available, fallback from readings */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard
          title="Bread Crisis Index"
          value={`${(displayMetrics.bci * 100).toFixed(1)}%`}
          icon={Wheat}
          color={displayMetrics.bciLevel === 'CRISIS' ? 'text-intel-red' : displayMetrics.bciLevel === 'HIGH_RISK' ? 'text-intel-orange' : 'text-intel-cyan'}
          trend={displayMetrics.bciLevel}
          nodeId="BCI"
          live={displayMetrics.fromPipeline}
        />
        <SummaryCard
          title="Water Stress"
          value={`${(displayMetrics.waterStress * 100).toFixed(1)}%`}
          icon={Waves}
          color={displayMetrics.waterStress > 0.6 ? 'text-intel-red' : 'text-intel-cyan'}
          trend={displayMetrics.waterStress > 0.6 ? 'CRITICAL' : 'STABLE'}
          nodeId="H2O"
          live={displayMetrics.fromPipeline}
        />
        <SummaryCard
          title="Agro-Stress"
          value={`${(displayMetrics.agroStress * 100).toFixed(1)}%`}
          icon={AlertTriangle}
          color={displayMetrics.agroStress > 0.6 ? 'text-intel-red' : 'text-intel-orange'}
          trend={displayMetrics.agroStress > 0.6 ? 'HIGH' : 'MEDIUM'}
          nodeId="ASI"
          live={displayMetrics.fromPipeline}
        />
        <SummaryCard
          title="Food Production Risk"
          value={`${(displayMetrics.foodRisk * 100).toFixed(1)}%`}
          icon={Leaf}
          color={displayMetrics.foodRisk > 0.5 ? 'text-intel-orange' : 'text-intel-green'}
          trend={displayMetrics.foodRisk > 0.5 ? 'HIGH' : 'STABLE'}
          nodeId="FPR"
          live={displayMetrics.fromPipeline}
        />
        <SummaryCard
          title="Date Palm Health"
          value={`${(displayMetrics.datePalm * 100).toFixed(1)}%`}
          icon={Sprout}
          color={displayMetrics.datePalm < 0.4 ? 'text-intel-red' : displayMetrics.datePalm < 0.6 ? 'text-intel-orange' : 'text-intel-green'}
          trend={displayMetrics.datePalm < 0.4 ? 'CRITICAL' : displayMetrics.datePalm < 0.6 ? 'STRESS' : 'OPTIMAL'}
          nodeId="PALM"
          live={displayMetrics.fromPipeline}
        />
        <SummaryCard
          title="Vegetable Supply"
          value={`${(displayMetrics.vegSupply * 100).toFixed(1)}%`}
          icon={Droplets}
          color={displayMetrics.vegSupply < 0.4 ? 'text-intel-red' : displayMetrics.vegSupply < 0.65 ? 'text-intel-orange' : 'text-intel-cyan'}
          trend={displayMetrics.vegSupply < 0.4 ? 'CRITICAL' : displayMetrics.vegSupply < 0.65 ? 'LOW' : 'STABLE'}
          nodeId="VEG"
          live={displayMetrics.fromPipeline}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="National Wheat Stress" 
          value={`${(nationalAverages.wheat * 100).toFixed(1)}%`}
          icon={ShieldAlert}
          color="text-red-400"
          trend={nationalAverages.wheat > 0.6 ? 'critical' : 'stable'}
        />
        <SummaryCard 
          title="Olive Health Index" 
          value={`${(nationalAverages.olive * 100).toFixed(1)}%`}
          icon={Leaf}
          color="text-emerald-400"
          trend="optimal"
        />
        <SummaryCard 
          title="Avg NDVI (Vegetation)" 
          value={nationalAverages.ndvi.toFixed(3)}
          icon={Sprout}
          color="text-green-400"
        />
        <SummaryCard 
          title="Rainfall Anomaly" 
          value={`${(nationalAverages.rain * 100).toFixed(1)}%`}
          icon={CloudRain}
          color={nationalAverages.rain < 0 ? "text-amber-400" : "text-blue-400"}
        />
      </div>

      <div className="glass rounded-2xl border border-intel-border overflow-hidden flex flex-col h-[500px]">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-intel-border/30">
            <div className="flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5 text-intel-cyan" />
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                Sovereign Agricultural Risk Map (Wheat Stress)
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {[
                { label: 'Low', color: 'bg-intel-cyan' },
                { label: 'Med', color: 'bg-intel-orange' },
                { label: 'High', color: 'bg-intel-red' }
              ].map(tag => (
                <div key={tag.label} className="flex items-center space-x-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", tag.color)} />
                  <span className="text-[8px] font-mono text-slate-500 uppercase">{tag.label}</span>
                </div>
              ))}
            </div>
            </div>
          </div>
          <div className="flex-1 rounded border border-white/5 overflow-hidden h-[400px]">
            <Map 
              governorates={mappedGovernorates} 
              events={[]}
              activeLayer="Agricultural Stress"
              onSelectGovernorate={(gov) => setSelectedGov(gov.id)}
            />
          </div>
        </div>

      {/* Regional Ranking + Sentinel-2 Index — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regional Stress Ranking */}
        <div className="glass rounded-2xl border border-intel-border overflow-hidden flex flex-col h-[420px]">
          <div className="px-5 py-4 border-b border-intel-border/30 bg-white/5 flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-intel-cyan" />
            <h3 className="text-[9px] font-mono text-white uppercase tracking-widest">Regional Stress Ranking</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {chartData.map((d, i) => (
              <div 
                key={`${d.name}-${i}`}
                onClick={() => setSelectedGov(d.name)}
                className={`p-2 rounded border border-white/5 transition-colors cursor-pointer ${
                  selectedGov === d.name ? 'bg-emerald-500/10 border-emerald-500/30' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white/80">{d.name.toUpperCase()}</span>
                  <span className={`text-[10px] font-mono ${d.wheat > 70 ? 'text-red-400' : d.wheat > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {d.wheat.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${d.wheat > 70 ? 'bg-red-500' : d.wheat > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${d.wheat}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Governorate Sentinel-2 Index */}
        <div className="glass rounded-2xl border border-intel-border p-6 space-y-4 h-[420px] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-intel-cyan" />
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Governorate Sentinel-2 Index</h3>
            </div>
            {selectedGov && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                DRILLDOWN: {selectedGov.toUpperCase()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricBox label="Current NDVI" value={readings[selectedGov || 'tunis']?.ndvi.toFixed(3) || '0.000'} />
            <MetricBox label="Soil Water" value={`${((readings[selectedGov || 'tunis']?.soil_moisture || 0) * 100).toFixed(1)}%`} />
            <MetricBox label="Rainfall Dev" value={`${((readings[selectedGov || 'tunis']?.rainfall_anomaly || 0) * 100).toFixed(1)}%`} />
            <MetricBox 
              label="National Risk" 
              value={readings[selectedGov || 'tunis']?.risk_flag || '--'} 
              color={readings[selectedGov || 'tunis']?.risk_flag === 'CRITICAL' ? 'text-intel-red' : 'text-intel-cyan'}
            />
          </div>
          <div className="mt-auto p-4 bg-white/5 border border-white/5 rounded-xl">
            <p className="text-[9px] text-slate-500 leading-relaxed italic">
              * Sentinel-2 L2A composite data synced every 72 hours. Anomaly scores calculated against 10-year multi-temporal mean for the current phenological window.
            </p>
          </div>
          </div>
        </div>
      </div>

      {/* Crop Performance Distribution */}
      <div className="glass rounded-2xl border border-intel-border p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-intel-cyan" />
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Crop Performance Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={s => s.slice(0, 3).toUpperCase()} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '10px', color: '#38bdf8' }}
                  labelStyle={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}
                />
                <Bar dataKey="wheat" name="Wheat Stress" fill="#ef4444" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
                <Bar dataKey="olive" name="Olive Health" fill="#10b981" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
    </div>
  );
};

<<<<<<< HEAD
const SummaryCard: React.FC<{ title: string; value: string; icon: any; color: string; trend?: string; nodeId?: string; live?: boolean }> = ({ 
  title, value, icon: Icon, color, trend, nodeId, live
=======
const SummaryCard: React.FC<{ title: string; value: string; icon: any; color: string; trend?: string }> = ({ 
  title, value, icon: Icon, color, trend 
>>>>>>> f517a83c7aecd1d6fbbc73c6a5b19cde59b10413
}) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4 hover:border-emerald-500/30 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/10 transition-colors`}>
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
            "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border",
            trend === 'OPTIMAL' || trend === 'STABLE' || trend === 'NORMAL' || trend === 'optimal' || trend === 'stable' ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20' :
            trend === 'MEDIUM' || trend === 'LOW' || trend === 'STRESS' ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' :
            'bg-intel-red/10 text-intel-red border-intel-red/20'
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

const MetricBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-white/5 rounded border border-white/5 flex flex-col">
    <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{label}</span>
    <span className="text-sm font-mono text-white font-semibold">{value}</span>
  </div>
);
