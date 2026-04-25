import React, { useState } from 'react';
import { useObservability } from '../context/ObservabilityContext';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Terminal, 
  Target, 
  RefreshCcw, 
  Zap,
  TrendingUp,
  Cpu,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Pause,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimeSeriesChart } from './observability/TimeSeriesChart';
import { PipelineFlow } from './observability/PipelineFlow';
import { TraceInspector } from './observability/TraceInspector';

export const ObservabilityDashboard: React.FC = () => {
  const { metrics, history, logs, alerts, healthScore, updateMetrics } = useObservability();
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'traces' | 'logs'>('overview');

  const getHealthColor = (score: number) => {
    if (score > 80) return { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', label: 'HEALTHY' };
    if (score > 50) return { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', label: 'DEGRADED' };
    return { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', label: 'CRITICAL' };
  };

  const health = getHealthColor(healthScore);

  return (
    <div className="h-full bg-transparent text-white/80 font-sans flex flex-col space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-12">
      {/* PMC Header */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tighter uppercase text-white">Pipeline Mission Control / <span className="text-white/40">Intel Pipeline</span></h1>
          </div>
          
          <div className="h-8 w-px bg-white/10" />
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Health Score</span>
               <div className={`flex items-center gap-2 font-mono font-bold ${health.text}`}>
                 <Zap className="w-3 h-3" />
                 <span>{Math.round(healthScore)}% {health.label}</span>
               </div>
             </div>
             
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Data Latency</span>
               <div className="flex items-center gap-2 font-mono font-bold text-blue-400">
                 <RefreshCcw className={`w-3 h-3 ${isPaused ? '' : 'animate-spin-slow'}`} />
                 <span>{metrics.latencyMs.toLocaleString()}ms</span>
               </div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('traces')}
            className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'traces' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
          >
            Trace Inspector
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
          >
            Terminal Logs
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4 text-amber-500" />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Metric Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              <MiniMetric label="Feed Rate" value={`${Math.round(metrics.ingestionRate)}`} unit="/min" icon={BarChart3} color="text-emerald-400" key="metric-feed" />
              <MiniMetric label="Successful" value={metrics.newsCount} icon={Database} color="text-blue-400" key="metric-success" />
              <MiniMetric label="Failures" value={Math.round(metrics.errorRate * metrics.feedCount)} icon={AlertTriangle} color="text-red-400" key="metric-fail" />
              <MiniMetric label="Signals" value={metrics.signalCount} icon={Activity} color="text-purple-400" key="metric-sig" />
              <MiniMetric label="Events" value={metrics.eventCount} icon={Target} color="text-amber-400" key="metric-ev" />
              <MiniMetric label="Error %" value={(metrics.errorRate * 100).toFixed(1)} unit="%" icon={Cpu} color="text-red-500" key="metric-errp" />
              <MiniMetric label="Dups %" value={(metrics.duplicateRate * 100).toFixed(1)} unit="%" icon={RefreshCcw} color="text-amber-500" key="metric-dup" />
              <MiniMetric label="Latency" value={Math.round(metrics.latencyMs)} unit="ms" icon={TrendingUp} color="text-indigo-400" key="metric-lat" />
            </div>

            {/* Main Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <TimeSeriesChart data={history} dataKey="ingestionRate" label="Ingestion Velocity" color="#10b981" unit="/min" />
                <TimeSeriesChart data={history} dataKey="latencyMs" label="System Latency" color="#3b82f6" unit="ms" />
                <TimeSeriesChart data={history} dataKey="errorRate" label="Pipeline Error Rate" color="#ef4444" unit="%" />
                <TimeSeriesChart data={history} dataKey="eventCount" label="Intelligence Accumulation" color="#f59e0b" />
              </div>
              
              <div className="flex flex-col gap-4">
                <PipelineFlow metrics={metrics} />
                {/* Active Alerts Panel */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex-1 flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Pending System Alerts
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-2 min-h-[200px]">
                    {alerts.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-white/10 text-xs italic">
                        System stable...
                      </div>
                    ) : (
                      alerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded border ${alert.type === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                           <div className="flex justify-between items-start">
                             <div className="text-[10px] font-bold uppercase" style={{ color: alert.type === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{alert.type}</div>
                             <span className="text-[9px] font-mono opacity-20">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <p className="text-xs text-white/70 mt-1">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'traces' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex-1 min-h-0"
          >
            <TraceInspector />
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex flex-col min-h-0"
          >
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Live Pipeline Terminal Output
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 pr-2 no-scrollbar">
                {logs.map((log, i) => (
                  <div key={`log-${log.timestamp}-${i}`} className="flex gap-4 border-b border-white/[0.02] py-1 hover:bg-white/[0.02]">
                    <span className="text-white/20 shrink-0">{log.timestamp.split('T')[1].slice(0, 8)}</span>
                    <span className={`w-20 shrink-0 font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-emerald-500'}`}>[{log.stage}]</span>
                    <span className="text-white/60">{log.message}</span>
                    {log.traceId && <span className="text-blue-500 text-[9px] bg-blue-500/10 px-1 rounded ml-auto">{log.traceId.slice(0, 8)}</span>}
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MiniMetric: React.FC<{ label: string; value: string | number; unit?: string; icon: any; color: string }> = ({ label, value, unit, icon: Icon, color }) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-white/10 transition-colors">
     <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase font-bold tracking-tighter text-white/20">{label}</span>
        <Icon className={`w-3 h-3 ${color} opacity-40`} />
     </div>
     <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono tracking-tighter text-white/90">{value}</span>
        {unit && <span className="text-[9px] opacity-20 font-bold">{unit}</span>}
     </div>
  </div>
);
