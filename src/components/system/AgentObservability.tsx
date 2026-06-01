import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Server,
  Terminal
} from 'lucide-react';

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'IDLE' | 'BUSY' | 'ACTIVE' | 'ERROR';
  last_task: string;
  latency: string;
}

interface ObservabilityData {
  agents: AgentStatus[];
  system_health: {
    status: string;
    metrics: {
      api_calls: number;
      agent_tasks: number;
      anomalies_detected: number;
      errors: number;
    };
    timestamp: string;
  };
}

export const AgentObservability: React.FC = () => {
  const [data, setData] = useState<ObservabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchObservability = async () => {
    try {
      const response = await fetch('/api/v1/observability/agents');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch agent observability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObservability();
    const interval = setInterval(fetchObservability, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-slate-900/40 border border-white/10 rounded-3xl">
        <RefreshCw className="w-8 h-8 text-intel-cyan animate-spin" />
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Connecting to Neural Monitor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-bold text-on-surface uppercase tracking-widest flex items-center space-x-2">
          <Activity className="w-4 h-4 text-intel-cyan" />
          <span>Agent Observability</span>
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-500 uppercase">Live Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.agents.map((agent) => (
          <motion.div 
            key={agent.id}
            layout
            className="p-4 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group hover:border-intel-cyan/30 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  agent.status === 'BUSY' ? 'bg-intel-orange/10' : 
                  agent.status === 'ERROR' ? 'bg-intel-red/10' : 'bg-intel-cyan/10'
                }`}>
                  <Cpu className={`w-4 h-4 ${
                    agent.status === 'BUSY' ? 'text-intel-orange' : 
                    agent.status === 'ERROR' ? 'text-intel-red' : 'text-intel-cyan'
                  }`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface tracking-tight">{agent.name}</h4>
                  <p className="text-[9px] font-mono text-slate-500 uppercase">{agent.type}</p>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                agent.status === 'IDLE' ? 'bg-slate-500/10 border-slate-500/20 text-slate-500' :
                agent.status === 'BUSY' ? 'bg-intel-orange/10 border-intel-orange/20 text-intel-orange' :
                agent.status === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                'bg-intel-red/10 border-intel-red/20 text-intel-red'
              }`}>
                {agent.status}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-slate-500 uppercase">Current Task</span>
                <span className="text-slate-300 truncate max-w-[150px]">{agent.last_task}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-slate-500 uppercase">Latency</span>
                <span className="text-intel-cyan">{agent.latency}</span>
              </div>
            </div>

            {agent.status === 'BUSY' && (
              <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="h-full w-1/3 bg-intel-orange"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-slate-900/40 border border-white/10 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center space-x-2">
            <BarChart3 className="w-3 h-3" />
            <span>Performance Metrics</span>
          </h4>
          <span className="text-[9px] font-mono text-slate-600">Updated: {lastUpdate.toLocaleTimeString()}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">API Calls</div>
            <div className="text-xl font-bold text-on-surface font-mono">{data?.system_health.metrics.api_calls}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">Tasks Completed</div>
            <div className="text-xl font-bold text-on-surface font-mono">{data?.system_health.metrics.agent_tasks}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">Anomalies</div>
            <div className="text-xl font-bold text-intel-orange font-mono">{data?.system_health.metrics.anomalies_detected}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">System Errors</div>
            <div className="text-xl font-bold text-intel-red font-mono">{data?.system_health.metrics.errors}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <Server className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-mono text-slate-500 uppercase">Backend: <span className="text-emerald-500">Connected</span></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Terminal className="w-3 h-3 text-slate-500" />
            <span className="text-[9px] font-mono text-slate-500 uppercase">Orchestrator: <span className="text-emerald-500">Stable</span></span>
          </div>
        </div>
        <button 
          onClick={fetchObservability}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-intel-cyan"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
