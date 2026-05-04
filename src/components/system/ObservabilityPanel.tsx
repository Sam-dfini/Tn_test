import React from 'react';
import { useObservability } from '../../context/ObservabilityContext';
import { 
  BarChart, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Database, 
  Search, 
  CheckCircle2, 
  XCircle,
  Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ObservabilityPanel: React.FC = () => {
  const { metrics, logs, alerts, healthScore } = useObservability();

  const getHealthColor = (score: number) => {
    if (score > 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score > 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4 bg-[#050505] text-white/80 font-sans overflow-y-auto custom-scrollbar">
      {/* Header & Health Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tighter uppercase">OSINT Pipeline Health</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${getHealthColor(healthScore)}`}>
          <Stethoscope className="w-4 h-4" />
          <span className="font-mono font-bold">{Math.round(healthScore)}% HEALTHY</span>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Feeds" value={metrics.feedCount} icon={Search} color="text-blue-400" />
        <MetricCard label="News Items" value={metrics.newsCount} icon={Database} color="text-indigo-400" />
        <MetricCard label="Signals" value={metrics.signalCount} icon={Activity} color="text-purple-400" />
        <MetricCard label="Events" value={metrics.eventCount} icon={CheckCircle2} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(1)}%`} subValue="Threshold: 30%" status={metrics.errorRate > 0.3 ? 'CRITICAL' : 'OK'} />
        <StatusCard label="Duplicate Rate" value={`${(metrics.duplicateRate * 100).toFixed(1)}%`} subValue="Target: <10%" status={metrics.duplicateRate > 0.5 ? 'WARNING' : 'OK'} />
        <StatusCard label="Avg Latency" value={`${Math.round(metrics.latencyMs)}ms`} subValue="Last data point" status={metrics.latencyMs > 5000 ? 'WARNING' : 'OK'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
        {/* Active Alerts */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active System Alerts
            </h3>
            <span className="text-[10px] font-mono text-white/20">{alerts.length} ACTIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <AnimatePresence>
              {alerts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/20 text-xs italic">
                  No active alerts detected. System stable.
                </div>
              ) : (
                alerts.map(alert => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={alert.id}
                    className={`p-3 rounded border ${alert.type === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-xs font-bold leading-none mb-1 ${alert.type === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                        {alert.type}
                      </p>
                      <span className="text-[10px] font-mono opacity-40">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-white/80">{alert.message}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Trace Logs */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-500" />
              Live Pipeline Traces
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar font-mono text-[10px]">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 p-1 hover:bg-white/5 rounded">
                <span className="text-white/20 whitespace-nowrap">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                <span className={`font-bold ${getLogLevelColor(log.level)}`}>[{log.stage}]</span>
                <span className="text-white/60">{log.message}</span>
                {log.traceId && <span className="text-blue-500/50 text-[8px] bg-blue-500/10 px-1 rounded">TR:{log.traceId.slice(0, 8)}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-2xl font-bold text-white font-mono tracking-tighter">{value.toLocaleString()}</span>
    </div>
  </div>
);

const StatusCard: React.FC<{ label: string; value: string; subValue: string; status: 'OK' | 'WARNING' | 'CRITICAL' }> = ({ label, value, subValue, status }) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{label}</span>
      <div className={`w-2 h-2 rounded-full ${status === 'OK' ? 'bg-emerald-500' : status === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-bold text-white font-mono">{value}</span>
      <span className="text-[10px] opacity-40">{status}</span>
    </div>
    <span className="text-[9px] uppercase tracking-wider text-white/20">{subValue}</span>
  </div>
);
