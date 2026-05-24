import React, { useState, useEffect, useCallback } from 'react';
import {
  Library, FileText, Activity, TrendingUp, Bot, Clock,
  Database, ArrowRight, Server, Cpu, BookOpen, Search,
  ChevronDown, ChevronRight, Layers, Globe, Users, MapPin,
  Brain, Wifi, WifiOff, BookMarked, Target, Shield,
  BarChart3, Radio, GitBranch, Eye
} from 'lucide-react';
import { fetchDoctrineStatus } from '../../services/backendClient';

const COGNITIVE_WORKSPACES = [
  {
    id: 'CORE_DOCTRINE',
    label: 'Core Doctrine',
    desc: 'Teaches the AI how to think',
    icon: Brain,
    color: '#8b5cf6',
    domain: 'Strategic reasoning',
  },
  {
    id: 'TUNISIA_STATE',
    label: 'Tunisia State',
    desc: 'Teaches the AI national reality',
    icon: Library,
    color: '#06b6d4',
    domain: 'Economic & state analysis',
  },
  {
    id: 'POLITICAL_ACTORS',
    label: 'Political Actors',
    desc: 'Teaches behavioral dynamics',
    icon: Users,
    color: '#f59e0b',
    domain: 'Actor mapping & forecasting',
  },
  {
    id: 'SECURITY_INTEL',
    label: 'Security Intel',
    desc: 'Teaches threat landscapes',
    icon: Shield,
    color: '#ef4444',
    domain: 'Security & instability',
  },
  {
    id: 'HISTORICAL_MEMORY',
    label: 'Historical Memory',
    desc: 'Teaches pattern recognition',
    icon: BookMarked,
    color: '#10b981',
    domain: 'Analogical reasoning',
  },
  {
    id: 'RRI_ENGINE',
    label: 'RRI Engine',
    desc: 'Teaches risk modeling',
    icon: BarChart3,
    color: '#ec4899',
    domain: 'Quantitative & simulation',
  },
  {
    id: 'LIVE_INTELLIGENCE',
    label: 'Live Intelligence',
    desc: 'Teaches current awareness',
    icon: Radio,
    color: '#3b82f6',
    domain: 'Real-time monitoring',
  },
];

const PIPELINE_STAGES = [
  { id: 'ingest',   label: 'Ingestion',     desc: 'Article normalization, entity extraction',     icon: Database },
  { id: 'chunk',    label: 'Chunking',       desc: 'Semantic section splitting, paragraph groups', icon: FileText },
  { id: 'embed',    label: 'Embeddings',     desc: 'text-embedding-3-large → pgvector',           icon: Cpu },
  { id: 'vector',   label: 'Vector Storage', desc: 'pgvector / Qdrant / Weaviate',                 icon: Database },
  { id: 'retrieve', label: 'Retrieval',      desc: 'Hybrid search + reranking + assembly',         icon: Search },
];

const MEMORY_TIERS = [
  { id: 'hot',   label: 'HOT',   desc: 'Recent articles, events, alerts',          color: '#ef4444', storage: 'Fast retrieval' },
  { id: 'warm',  label: 'WARM',  desc: 'Historical months/years of memory',        color: '#f59e0b', storage: 'Standard retrieval' },
  { id: 'cold',  label: 'COLD',  desc: 'Archives, PDFs, reports, datasets',        color: '#3b82f6', storage: 'Archival storage' },
];

const RAG_CONSUMERS = [
  'Intelligence Briefs', 'AI Agents', 'Analyst Terminal', 'Governorate Dossiers',
  'Twin Tunisia', 'Forecasting', 'Simulations', 'Timeline Replay', 'Scenario Generation',
];

const PHASES = [
  { id: 1, label: 'Memory Foundation', items: ['7 workspace creation', 'document ingestion', 'pgvector', 'embeddings', 'chunking'] },
  { id: 2, label: 'Cognitive Retrieval', items: ['cross-workspace query', 'hybrid search', 'synthesis', 'citations'] },
  { id: 3, label: 'Intelligence Integration', items: ['AI briefings', 'dossiers', 'terminal queries', 'doctrine search'] },
  { id: 4, label: 'Agent Layer', items: ['workspace router', 'domain specialists', 'memory namespaces', 'replayable cognition'] },
  { id: 5, label: 'Living Intelligence', items: ['live ingestion', 'autonomous monitoring', 'daily briefs', 'scenario engine'] },
];

interface WorkspaceStatus {
  workspace: string;
  document_count: number;
  status: string;
  source: string;
}

const RAGTab: React.FC = () => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [expandedWs, setExpandedWs] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const data = await fetchDoctrineStatus();
    if (data) setWorkspaces(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'empty': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'empty': return 'EMPTY';
      case 'offline': return 'OFFLINE';
      default: return 'UNKNOWN';
    }
  };

  const allOnline = workspaces.length > 0 && workspaces.every(w => w.status === 'active' || w.status === 'empty');
  const totalDocs = workspaces.reduce((s, w) => s + w.document_count, 0);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar space-y-3">

      {/* AnythingLLM Connection Header */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-500/5 to-transparent border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Cognitive Architecture</h3>
            <p className="text-[8px] font-mono text-slate-500">AnythingLLM · 7 workspaces · sovereign intelligence memory</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                CHECKING
              </span>
            ) : allOnline ? (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Wifi className="w-3 h-3" />
                CONNECTED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                <WifiOff className="w-3 h-3" />
                PARTIAL
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Workspaces</div>
              <div className="text-lg font-bold text-white font-mono">{workspaces.length}/7</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Total Documents</div>
              <div className="text-lg font-bold text-white font-mono">{totalDocs}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Base URL</div>
              <div className="text-[9px] font-bold text-cyan-400 font-mono truncate">llm.kilma.ai</div>
            </div>
          </div>
          <button
            onClick={loadStatus}
            className="text-[7px] font-mono text-slate-600 hover:text-slate-400 transition-colors"
          >
            ↻ Refresh status
          </button>
        </div>
      </div>

      {/* Cognitive Workspaces */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <GitBranch className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Cognitive Workspaces</span>
          <span className="text-[8px] font-mono text-slate-600 ml-auto">{totalDocs} total documents</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {COGNITIVE_WORKSPACES.map(ws => {
            const status = workspaces.find(w => w.workspace === ws.id);
            const docCount = status?.document_count ?? 0;
            const wsStatus = status?.status ?? 'offline';
            const statusColor = getStatusColor(wsStatus);
            const isExpanded = expandedWs === ws.id;

            return (
              <div
                key={ws.id}
                className="bg-[#0a0a0c] border border-white/5 rounded-lg overflow-hidden hover:border-white/10 transition-all"
              >
                <button
                  onClick={() => setExpandedWs(isExpanded ? null : ws.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${ws.color}15`, border: `1px solid ${ws.color}30` }}
                    >
                      <ws.icon className="w-3.5 h-3.5" style={{ color: ws.color }} />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-white">{ws.label}</div>
                      <div className="text-[7px] font-mono text-slate-600">{ws.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono" style={{ color: statusColor }}>{docCount} docs</span>
                    <span
                      className="text-[6px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
                      style={{
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}30`,
                      }}
                    >
                      {getStatusLabel(wsStatus)}
                    </span>
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-2">
                    <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-mono text-slate-600">Cognitive Function</span>
                        <span className="text-[7px] font-mono text-slate-400">{ws.domain}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-mono text-slate-600">Documents</span>
                        <span className="text-[7px] font-mono text-slate-400">{docCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-mono text-slate-600">Status</span>
                        <span className="text-[7px] font-mono uppercase" style={{ color: statusColor }}>{getStatusLabel(wsStatus)}</span>
                      </div>
                      {wsStatus === 'empty' && (
                        <p className="text-[7px] font-mono text-slate-600 italic pt-1">No documents ingested yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Stages */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Pipeline Stages</span>
          <span className="text-[8px] font-mono text-slate-600 ml-auto">Cognitive processing pipeline</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <div className="bg-[#0a0a0c] border border-white/5 rounded-lg p-3 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <stage.icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-white/5 uppercase tracking-wider font-bold">
                    IDLE
                  </span>
                </div>
                <div className="text-[9px] font-bold text-white mb-0.5">{stage.label}</div>
                <div className="text-[7px] font-mono text-slate-600 leading-tight">{stage.desc}</div>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Memory Tiers + Phase Roadmap in 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Memory Tiers */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Memory Tiers</span>
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-bold ml-auto">Pgvector</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MEMORY_TIERS.map(tier => (
              <div key={tier.id} className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
                <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}40` }} />
                <div className="text-[9px] font-bold text-white">{tier.label}</div>
                <div className="text-[7px] font-mono text-slate-600 mb-1.5">{tier.desc}</div>
                <div className="text-[8px] font-mono text-slate-600">0 docs</div>
                <div className="text-[6px] font-mono text-slate-700">{tier.storage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Roadmap */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Cognitive Roadmap</span>
            <span className="text-[8px] font-mono text-slate-600 ml-auto">0% complete</span>
          </div>
          <div className="divide-y divide-white/5">
            {PHASES.map(phase => (
              <div key={phase.id}>
                <button
                  onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-slate-500 font-bold">P{phase.id}</span>
                    <span className="text-[9px] font-bold text-white">{phase.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: '0%' }} />
                    </div>
                    <span className="text-[8px] font-mono text-slate-700">0%</span>
                    {expandedPhase === phase.id ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
                  </div>
                </button>
                {expandedPhase === phase.id && (
                  <div className="px-4 pb-3 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {phase.items.map(item => (
                        <span key={item} className="text-[7px] font-mono px-2 py-1 rounded bg-black/40 border border-white/5 text-slate-600">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RAG Consumers */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">RAG Consumers</span>
          <span className="text-[8px] font-mono text-slate-600 ml-auto">All pending document ingestion</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {RAG_CONSUMERS.map(consumer => (
            <div key={consumer} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-center opacity-40">
              <div className="text-[7px] font-mono text-slate-500 uppercase tracking-wider">{consumer}</div>
              <span className="text-[6px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-600 uppercase tracking-wider font-bold mt-1 inline-block">PENDING</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata Schema */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Metadata Schema</span>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider font-bold ml-auto">DESIGNED</span>
        </div>
        <div className="bg-black/40 border border-white/5 rounded-lg p-3 overflow-x-auto">
          <pre className="text-[7px] font-mono text-slate-500 leading-relaxed">{`{
  "id":              "string",
  "type":            "article|event|brief|signal|methodology",
  "timestamp":       "ISO 8601",
  "governorate":     "string",
  "actors":          ["string"],
  "tags":            ["string"],
  "risk_categories": ["string"],
  "source":          "string",
  "source_type":     "live|hybrid|synthetic",
  "confidence":      0.0-1.0,
  "language":        "ar|fr|en",
  "embedding_version": "v1",
  "entity_refs":     ["string"],
  "related_events":  ["string"],
  "canonical_state_id": "string"
}`}</pre>
        </div>
        <p className="text-[7px] font-mono text-slate-600 mt-2 italic">Metadata transforms generic RAG into intelligence retrieval</p>
      </div>
    </div>
  );
};

export default RAGTab;
