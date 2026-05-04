import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Activity, Zap, Radio, Globe, Database, Network, ShieldAlert, Wifi, Server, AlertTriangle, Hexagon } from 'lucide-react';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { useRSS } from '../../context/RSSContext';

export const RTEE: React.FC = () => {
  const { events, isFetching } = useRSS();
  const [pulse, setPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic or simply displaying recent anomalies
  const recentAnomalies = useMemo(() => {
    // We synthesize some high-impact signals from live events, or just pure tech data
    return events.slice(0, 15).map((e, i) => ({
      ...e,
      hash: Math.random().toString(36).substring(2, 10).toUpperCase(),
      latency: Math.floor(Math.random() * 80) + 12,
      nodeIndex: i
    }));
  }, [events]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 relative z-10 w-full animate-in fade-in duration-700">
      <BackgroundGrid />
      
      <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border relative overflow-hidden bg-black/50">
        
        {/* TOP ACCENTS */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-intel-cyan/30 to-transparent"></div>
        <div className="absolute top-0 left-10 w-32 h-1 bg-intel-cyan shadow-[0_0_15px_rgba(0,242,255,1)]"></div>

        <div className="flex flex-col md:flex-row justify-between gap-6 pb-6 border-b border-white/5 relative z-20">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
              <Cpu className="w-6 h-6 text-intel-cyan" />
              <span>Real Time Event Engine</span>
              <span className="text-[10px] uppercase font-mono font-bold text-intel-cyan bg-intel-cyan/10 px-2 py-0.5 rounded border border-intel-cyan/20 ml-2">v2.0 ACTIVE</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest max-w-xl">
              High-frequency multi-node signal interception matrix. Automatically synthesizing incoming streams.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-[10px] font-mono">
            <div className="flex flex-col items-end space-y-1">
              <span className="text-slate-500 uppercase tracking-widest">Network Status</span>
              <div className="flex items-center space-x-2">
                <Wifi className="w-3.5 h-3.5 text-intel-green" />
                <span className="text-intel-green font-bold shadow-intel-green/50">STABLE</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-1 border-l border-white/10 pl-6">
              <span className="text-slate-500 uppercase tracking-widest">Ingest Rate</span>
              <div className="flex items-center space-x-2">
                <Zap className="w-3.5 h-3.5 text-intel-cyan" />
                <span className="text-white font-bold">{Math.floor(Math.random() * 140) + 200} mb/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <MetricBox icon={<Radio />} label="Active Satellites" value="04" color="text-intel-cyan" />
          <MetricBox icon={<Database />} label="Nodes Syncing" value="128" color="text-intel-purple" />
          <MetricBox icon={<Activity />} label="Packet Loss" value="0.01%" color="text-intel-green" />
          <MetricBox icon={<AlertTriangle />} label="Anomalies 24H" value="47" color="text-intel-orange" />
        </div>

        {/* MAIN VISUALIZATION CORRIDOR */}
        <div className="mt-6 flex flex-col md:flex-row gap-6 relative">
          
          {/* LEFT: SIGNAL TERMINAL STREAM */}
          <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 overflow-hidden relative min-h-[400px] font-mono shadow-inner shadow-black/50">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2 text-[10px] text-intel-cyan uppercase font-bold tracking-widest">
                <Server className="w-3.5 h-3.5" />
                <span>Raw Signal Ingest</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-intel-cyan animate-pulse' : 'bg-intel-green'}`}></div>
            </div>

            <div className="space-y-1.5 h-[360px] overflow-y-auto custom-scrollbar flex flex-col-reverse" ref={containerRef}>
              <AnimatePresence>
                {recentAnomalies.length > 0 ? recentAnomalies.map((anomaly, idx) => (
                  <motion.div
                    key={`signal-${anomaly.id}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center text-[10px] space-x-3 py-1.5 hover:bg-white/5 px-2 rounded group transition-colors"
                  >
                    <span className="text-slate-600 w-24 flex-shrink-0">
                      {new Date(anomaly.last_updated || anomaly.created_at || Date.now()).toISOString().substring(11, 23)}
                    </span>
                    <span className={`w-16 font-bold flex-shrink-0 ${
                      anomaly.severity >= 4 ? 'text-intel-red' : 
                      anomaly.severity >= 3 ? 'text-intel-orange' : 'text-intel-cyan'
                    }`}>
                      LVL-{anomaly.severity || 1}
                    </span>
                    <span className="text-intel-purple font-bold tracking-widest w-20 flex-shrink-0">
                      [{anomaly.hash}]
                    </span>
                    <span className="text-slate-300 truncate flex-1 group-hover:text-white transition-colors">
                      {anomaly.title || anomaly.category || 'Intercepted generic traffic protocol.'}
                    </span>
                    <span className="text-slate-500 w-12 text-right">{anomaly.latency}ms</span>
                  </motion.div>
                )) : (
                  <div className="text-[10px] text-slate-500 italic p-4 text-center">
                    Awaiting signals. No events loaded in current cluster.
                  </div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Overlay scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 z-0"></div>
          </div>

          {/* RIGHT: TACTICAL DIAGNOSTICS */}
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-black/60 border border-white/5 rounded-xl p-5">
              <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                <Network className="w-3.5 h-3.5 mr-2" />
                Network Topology
              </h4>
              <div className="relative h-48 flex items-center justify-center">
                <div className="absolute w-full h-full border border-intel-cyan/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute w-3/4 h-3/4 border border-intel-purple/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="absolute w-1/2 h-1/2 border border-intel-orange/10 rounded-full animate-[spin_8s_linear_infinite]"></div>
                <Cpu className={`w-8 h-8 text-intel-cyan ${pulse ? 'scale-110 drop-shadow-[0_0_10px_rgba(0,242,255,0.8)]' : 'scale-100'} transition-all duration-300`} />
                
                {/* Simulated Nodes */}
                <div className="absolute top-4 left-1/4 w-2 h-2 bg-intel-purple rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,1)]"></div>
                <div className="absolute bottom-6 right-1/4 w-2 h-2 bg-intel-green rounded-full shadow-[0_0_8px_rgba(74,222,128,1)]"></div>
                <div className="absolute top-1/2 right-4 w-2 h-2 bg-intel-red rounded-full animate-ping shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
              </div>
            </div>

            <div className="bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl p-5">
              <h4 className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest mb-3 font-bold">
                Sub-System Analysis
              </h4>
              <div className="space-y-3 text-[10px] font-mono">
                <div className="flex justify-between items-center border-b border-intel-cyan/10 pb-1.5">
                  <span className="text-slate-400">Heuristic Engine</span>
                  <span className="text-intel-green">NOMINAL</span>
                </div>
                <div className="flex justify-between items-center border-b border-intel-cyan/10 pb-1.5">
                  <span className="text-slate-400">Threat Classifier</span>
                  <span className="text-intel-orange">HEAVY LOAD</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-slate-400">Stream Buffer</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full bg-black rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-intel-cyan h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(0,242,255,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper Sub-Component
const MetricBox: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-start hover:bg-white/10 transition-colors">
    <div className={`mb-3 p-2 bg-black/50 rounded-lg border border-white/5 ${color}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' }) : icon}
    </div>
    <div className="space-y-1">
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-tight">{label}</div>
    </div>
  </div>
);
