import React, { useState } from 'react';
import { Bot, ShieldAlert, Activity, AlertTriangle, CheckCircle2, Cpu, RefreshCw, ChevronDown, Clock } from 'lucide-react';

const DOMAIN_AGENTS = [
  { id: 'economy',  label: 'Economy Agent',  domain: 'Economy',       color: '#10b981', equations: ['EQ.1', 'EQ.24'], watches: 'FX reserves, inflation, IMF, subsidy burn rate' },
  { id: 'social',   label: 'Social Agent',   domain: 'Social',        color: '#f59e0b', equations: ['EQ.4', 'EQ.3'],  watches: 'UGTT signals, protest velocity, SIR model state' },
  { id: 'narrative',label: 'Narrative Agent',domain: 'Narrative',     color: '#8b5cf6', equations: ['EQ.19'],         watches: 'Frame convergence, slogan velocity, disinformation load' },
  { id: 'security', label: 'Security Agent', domain: 'Security',      color: '#ef4444', equations: ['EQ.8', 'EQ.13'], watches: 'Border incidents, decree 54 arrests, military posture' },
  { id: 'elite',    label: 'Elite Agent',    domain: 'Elite',         color: '#ec4899', equations: ['EQ.7', 'EQ.18', 'EQ.21'], watches: 'MII, cabinet changes, elite cohesion' },
  { id: 'external', label: 'External Agent', domain: 'External',      color: '#06b6d4', equations: ['EQ.8', 'EQ.9'],  watches: 'Libya/Algeria pressure, remittances, diaspora signals' },
];

type AgentStatus = 'standby' | 'running' | 'error';

interface AgentState {
  status: AgentStatus;
  lastRun: string | null;
  assessment: string | null;
  contradictions: number;
  confidence: number | null;
}

const defaultAgentState = (): AgentState => ({
  status: 'standby',
  lastRun: null,
  assessment: null,
  contradictions: 0,
  confidence: null,
});

const MultiAgentTab: React.FC = () => {
  const [agentStates] = useState<Record<string, AgentState>>(
    Object.fromEntries(DOMAIN_AGENTS.map(a => [a.id, defaultAgentState()]))
  );

  const allStandby = Object.values(agentStates).every(s => s.status === 'standby');
  const totalContradictions = Object.values(agentStates).reduce((s, a) => s + a.contradictions, 0);

  return (
    <div className="flex flex-col h-full space-y-4">

      {/* Meta-Agent Synthesis Card */}
      <div className="shrink-0 bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500/5 to-transparent border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest">Meta-Agent Synthesis</h3>
            <p className="text-[8px] font-mono text-slate-500">Consensus intelligence brief · resolving 6 domain assessments</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              STANDBY
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Confidence</div>
              <div className="text-lg font-bold text-slate-600 font-mono">—</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Contradictions</div>
              <div className="text-lg font-bold text-slate-600 font-mono">0</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Agent Reports</div>
              <div className="text-lg font-bold text-slate-600 font-mono">0 / 6</div>
            </div>
          </div>
          <div className="bg-black/40 border border-dashed border-white/5 rounded-lg px-4 py-6 text-center">
            <ShieldAlert className="w-6 h-6 text-slate-700 mx-auto mb-2 opacity-30" />
            <p className="text-[10px] font-mono text-slate-600 italic">Meta-agent inactive — activate domain agents to begin synthesis</p>
          </div>
        </div>
      </div>

      {/* Domain Agents Grid */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-intel-cyan" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">Domain Agents</span>
          <span className="text-[10px] font-mono text-slate-500">{DOMAIN_AGENTS.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-slate-600">All agents in STANDBY</span>
          <button disabled className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-700 cursor-not-allowed">
            <RefreshCw className="w-3 h-3" /> Activate All
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOMAIN_AGENTS.map(agent => {
            const state = agentStates[agent.id] || defaultAgentState();
            const isStandby = state.status === 'standby';
            return (
              <div key={agent.id} className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                {/* Agent Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
                  style={{ borderLeftColor: agent.color, borderLeftWidth: 3 }}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px] ${isStandby ? 'bg-amber-500 shadow-amber-500/40 animate-pulse' : ''}`} />
                    <div>
                      <span className="text-xs font-bold text-on-surface tracking-wide">{agent.label}</span>
                      <span className="text-[8px] font-mono text-slate-600 ml-2 uppercase">{agent.domain}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold ${
                    isStandby ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''
                  }`}>
                    {state.status.toUpperCase()}
                  </span>
                </div>

                {/* Agent Body */}
                <div className="p-4 space-y-3">
                  {/* Watched Equations */}
                  <div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1">Watched Equations</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {agent.equations.map(eq => (
                        <span key={eq} className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5 text-slate-400">{eq}</span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1">Monitors</div>
                    <p className="text-[9px] font-mono text-slate-500 leading-relaxed">{agent.watches}</p>
                  </div>

                  {/* Latest Assessment */}
                  <div className="bg-black/40 border border-dashed border-white/5 rounded-lg px-3 py-2.5">
                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1">Latest Assessment</div>
                    <p className="text-[9px] font-mono text-slate-700 italic">Not yet active — assessment pending agent activation</p>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-700 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {state.lastRun || 'Never run'}
                    </span>
                    <span>Confidence: {state.confidence !== null ? `${(state.confidence * 100).toFixed(0)}%` : '—'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contradiction Detector */}
      <div className="shrink-0 bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">Contradiction Detector</span>
          <span className="text-[8px] font-mono text-slate-700 ml-auto">{totalContradictions} flagged</span>
        </div>
        {allStandby ? (
          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 italic">
            <CheckCircle2 className="w-3 h-3 text-slate-700" />
            No contradictions detected — system idle
          </div>
        ) : (
          <div className="text-[9px] font-mono text-slate-600 italic">
            Contradiction analysis will appear here once agents are active
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiAgentTab;
