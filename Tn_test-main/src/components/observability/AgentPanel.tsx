import React from 'react';
import { Bot, Cpu, Zap, Timer } from 'lucide-react';

interface AgentPanelProps {
  agents: any[];
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ agents }) => {
  return (
    <div className="h-full p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase font-bold text-white/40 tracking-widest flex items-center gap-2">
           <Bot className="w-4 h-4 text-intel-cyan" />
           AI Agent Network
        </h3>
        <div className="flex items-center gap-1">
           <Zap className="w-3 h-3 text-amber-500" />
           <span className="text-[10px] font-mono text-amber-500/80">{agents.filter(a => a.status === 'ACTIVE' || a.status === 'BUSY').length} ACTIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-20">
            <Cpu className="w-8 h-8 mb-2 animate-pulse" />
            <span className="text-[10px] uppercase">Initializing Neurals...</span>
          </div>
        ) : (
          agents.map((agent, i) => (
            <div key={agent.id || `agent-${i}`} className="bg-white/5 border border-white/5 rounded-lg p-2 group hover:border-intel-cyan/30 transition-colors">
              <div className="flex justify-between items-start mb-1">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/80">{agent.name}</span>
                    <span className="text-[8px] uppercase text-white/20">{agent.type}</span>
                 </div>
                 <div className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                   agent.status === 'BUSY' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' : 
                   agent.status === 'ACTIVE' ? 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/20' : 
                   'bg-white/5 text-white/20'
                 }`}>
                   {agent.status}
                 </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        agent.status === 'BUSY' ? 'bg-amber-500 w-full animate-pulse' : 
                        agent.status === 'ACTIVE' ? 'bg-intel-cyan w-1/3' : 'bg-white/10 w-0'
                      }`}
                    />
                 </div>
                 <div className="flex items-center gap-1 text-[8px] font-mono text-white/40">
                    <Timer className="w-2.5 h-2.5" />
                    {agent.latency}
                 </div>
              </div>
              
              {agent.last_task !== "None" && (
                <div className="mt-1 text-[8px] text-white/40 italic truncate">
                  Task: {agent.last_task}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
