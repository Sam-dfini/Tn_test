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
        // We use rri_score slot to represent agricultural stress (0-3 scaled)
        // Since Map.tsx uses rri_score for choropleth
        rri_score: reading ? reading.wheat_stress * 3 : 1.5,
        risk_level: reading ? (reading.wheat_stress > 0.7 ? 'ALERT' : reading.wheat_stress > 0.4 ? 'HIGH' : 'MEDIUM') : g.risk_level
      } as Governorate;
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
    <div className="h-full flex flex-col space-y-4 overflow-y-auto p-4 custom-scrollbar">
      {/* Header Summary */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">National Summary</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[500px]">
        {/* Map View */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Sovereign Agricultural Risk Map (Wheat Stress)
            </h3>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-white/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Med</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> High</span>
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


        {/* Regional Drilldown */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4 flex flex-col">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Regional Stress Ranking
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
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
      </div>

      {/* Advanced Metrics Line Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-white/60 mb-4 uppercase tracking-widest">Crop Performance Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} tickFormatter={s => s.slice(0, 3).toUpperCase()} />
                <YAxis stroke="#555" fontSize={10} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                  itemStyle={{ padding: '0px' }}
                />
                <Bar dataKey="wheat" name="Wheat Stress" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Bar dataKey="olive" name="Olive Health" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Governorate Sentinel-2 Index</h3>
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
            <MetricBox label="National Risk" value={readings[selectedGov || 'tunis']?.risk_flag || '--'} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; value: string; icon: any; color: string; trend?: string }> = ({ 
  title, value, icon: Icon, color, trend 
}) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-4 hover:border-emerald-500/30 transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/10 transition-colors`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {trend && (
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
          trend === 'optimal' ? 'bg-emerald-500/10 text-emerald-400' : 
          trend === 'stable' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {trend.toUpperCase()}
        </span>
      )}
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
