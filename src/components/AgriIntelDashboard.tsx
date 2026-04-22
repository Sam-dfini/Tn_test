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
  Info
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
  const [readings, setReadings] = useState<Record<string, AgriReading>>({});
  const [loading, setLoading] = useState(true);
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
      return {
        ...g,
        // Include all agri metrics for layers and icons
        agri_metrics: reading ? {
          wheat_stress: reading.wheat_stress,
          olive_health: reading.olive_health,
          soil_moisture: reading.soil_moisture,
          rainfall_anomaly: reading.rainfall_anomaly,
          ndvi: reading.ndvi
        } : null,
        // Keep rri_score for default coloring if needed
        rri_score: reading ? reading.wheat_stress * 3 : 1.5,
        risk_level: reading ? (reading.wheat_stress > 0.7 ? 'ALERT' : reading.wheat_stress > 0.4 ? 'HIGH' : 'MEDIUM') : g.risk_level
      };
    });
  }, [readings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6 animate-in fade-in duration-500">
      <ModuleHeader 
        title="Agricultural Intelligence"
        subtitle="Real-time monitoring of crop stress, vegetation indices, and rural stability metrics"
        icon={Leaf}
        nodeId="AGRI-NODE-01"
      />

      {/* Header Summary */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
          <h2 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">National Sovereignty Summary</h2>
        </div>
        <button 
          onClick={async () => {
            setLoading(true);
            try {
              await fetch('/api/agri/sync', { method: 'POST' });
              const res = await fetch('/api/agri/latest');
              const json = await res.json();
              if (json.success) setReadings(json.data);
            } catch (err) {
              console.error('Manual sync failed:', err);
            } finally {
              setLoading(false);
            }
          }}
          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-[10px] uppercase font-bold text-emerald-400 transition-all font-mono"
        >
          Sync Live Data
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="National Wheat Stress" 
          value={`${(nationalAverages.wheat * 100).toFixed(1)}%`}
          icon={ShieldAlert}
          color="text-intel-red"
          trend={nationalAverages.wheat > 0.6 ? 'critical' : 'stable'}
          nodeId="WHEAT-STRESS"
        />
        <SummaryCard 
          title="Olive Health Index" 
          value={`${(nationalAverages.olive * 100).toFixed(1)}%`}
          icon={Leaf}
          color="text-intel-green"
          trend="optimal"
          nodeId="OLIVE-HEALTH"
        />
        <SummaryCard 
          title="Avg NDVI (Vegetation)" 
          value={nationalAverages.ndvi.toFixed(3)}
          icon={Sprout}
          color="text-intel-cyan"
          nodeId="VEG-INDEX"
        />
        <SummaryCard 
          title="Rainfall Anomaly" 
          value={`${(nationalAverages.rain * 100).toFixed(1)}%`}
          icon={CloudRain}
          color={nationalAverages.rain < 0 ? "text-intel-orange" : "text-intel-cyan"}
          nodeId="RAIN-ANOMALY"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2 glass rounded-2xl border border-intel-border overflow-hidden flex flex-col h-[500px]">
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
          <div className="flex-1 w-full relative">
            <Map 
              governorates={mappedGovernorates} 
              events={[]}
              activeLayer="Agricultural Stress"
              onSelectGovernorate={(gov) => setSelectedGov(gov.id)}
            />
          </div>
        </div>


        {/* Regional Drilldown */}
        <div className="glass rounded-2xl border border-intel-border overflow-hidden flex flex-col h-[500px]">
          <div className="px-5 py-4 border-b border-intel-border/30 bg-white/5 flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-intel-cyan" />
            <h3 className="text-[9px] font-mono text-white uppercase tracking-widest">Regional Stress Ranking</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3">
            {chartData.map((d, i) => (
              <div 
                key={`${d.name}-${i}`}
                onClick={() => setSelectedGov(d.name)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer",
                  selectedGov === d.name 
                    ? 'bg-intel-cyan/10 border-intel-cyan/40 shadow-[0_0_15px_rgba(0,242,255,0.05)]' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">{d.name}</span>
                  <span className={cn(
                    "text-[10px] font-mono font-bold",
                    d.wheat > 70 ? 'text-intel-red' : d.wheat > 40 ? 'text-intel-orange' : 'text-intel-cyan'
                  )}>
                    {d.wheat.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${d.wheat}%` }}
                    className={cn(
                      "h-full rounded-full",
                      d.wheat > 70 ? 'bg-intel-red' : d.wheat > 40 ? 'bg-intel-orange' : 'bg-intel-cyan'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Metrics Line Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="glass rounded-2xl border border-intel-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-intel-cyan" />
              <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Governorate Sentinel-2 Index</h3>
            </div>
            {selectedGov && (
              <span className="text-[9px] bg-intel-cyan/10 text-intel-cyan px-2 py-0.5 rounded border border-intel-cyan/20 font-mono font-bold uppercase tracking-tighter">
                DRILLDOWN: {selectedGov}
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
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
            <p className="text-[9px] text-slate-500 leading-relaxed italic">
              * Sentinel-2 L2A composite data synced every 72 hours. Anomaly scores calculated against 10-year multi-temporal mean for the current phenological window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string; icon: any; color: string; trend?: string; nodeId?: string }> = ({ 
  title, value, icon: Icon, color, trend, nodeId
}) => (
  <div className="glass rounded-xl p-4 border border-intel-border hover:border-intel-cyan/30 transition-all duration-300 group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-2 opacity-[0.03]">
      <Icon className="w-12 h-12" />
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", color.replace('text-', 'bg-') + '/10')}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        {nodeId && <span className="text-[7px] font-mono text-slate-600 uppercase tracking-tighter">{nodeId}</span>}
      </div>
      {trend && (
        <span className={cn(
          "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border",
          trend === 'optimal' ? 'bg-intel-green/10 text-intel-green border-intel-green/20' : 
          trend === 'stable' ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20' : 
          'bg-intel-red/10 text-intel-red border-intel-red/20'
        )}>
          {trend.toUpperCase()}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-bold text-white font-mono tracking-tighter">{value}</div>
      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">{title}</div>
    </div>
  </div>
);

const MetricBox: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col space-y-1 hover:bg-white/10 transition-colors">
    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={cn("text-sm font-mono font-bold", color)}>{value}</span>
  </div>
);
