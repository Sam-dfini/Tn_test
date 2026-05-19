import React, { useState } from 'react';
import {
  Library, FileText, Activity, TrendingUp, Bot, Clock,
  Database, ArrowRight, Server, Cpu, BookOpen, Search,
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  HardDrive, Layers, Globe, Users, MapPin
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'ingest',   label: 'Ingestion',     desc: 'Article normalization, entity extraction',     icon: Database },
  { id: 'chunk',    label: 'Chunking',       desc: 'Semantic section splitting, paragraph groups', icon: FileText },
  { id: 'embed',    label: 'Embeddings',     desc: 'text-embedding-3-large → pgvector',           icon: Cpu },
  { id: 'vector',   label: 'Vector Storage', desc: 'pgvector / Qdrant / Weaviate',                icon: HardDrive },
  { id: 'retrieve', label: 'Retrieval',      desc: 'Hybrid search + reranking + assembly',        icon: Search },
];

const RAG_SOURCES = [
  { id: 'articles',    label: 'News Articles',    desc: 'RSS, news APIs, scraped articles',         icon: FileText, color: '#10b981' },
  { id: 'events',      label: 'Events Database',  desc: 'Protests, arrests, speeches, decrees',     icon: Activity, color: '#f59e0b' },
  { id: 'rri',         label: 'RRI Variables',    desc: 'Variable explanations, threshold breaches', icon: TrendingUp, color: '#8b5cf6' },
  { id: 'agents',      label: 'Agent Outputs',    desc: 'Briefings, analyses, alerts, predictions', icon: Bot, color: '#06b6d4' },
  { id: 'methodology', label: 'Methodology Docs', desc: 'Equations, calibration notes, whitepapers', icon: BookOpen, color: '#ec4899' },
  { id: 'timeline',    label: 'Timeline Memory',  desc: 'Major events, elections, IMF crises',       icon: Clock, color: '#ef4444' },
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
  { id: 1, label: 'Core Infrastructure', items: ['pgvector', 'embeddings', 'chunking', 'ingestion pipeline', 'metadata schema'] },
  { id: 2, label: 'Basic Retrieval',     items: ['semantic search', 'hybrid search', 'citations'] },
  { id: 3, label: 'Intelligence Integration', items: ['AI briefings', 'dossiers', 'terminal queries'] },
  { id: 4, label: 'Agent Memory',        items: ['persistent retrieval', 'memory namespaces', 'replayable cognition'] },
  { id: 5, label: 'Twin Tunisia',        items: ['state-linked retrieval', 'historical replay', 'simulation grounding'] },
];

interface RAGState {
  pipelineStatus: Record<string, 'idle' | 'running' | 'ready' | 'error'>;
  sourceCounts: Record<string, number>;
  totalChunks: number;
  totalVectors: number;
  entityActors: number;
  entityGovernorates: number;
  hotDocs: number;
  warmDocs: number;
  coldDocs: number;
}

const defaultRAGState = (): RAGState => ({
  pipelineStatus: Object.fromEntries(PIPELINE_STAGES.map(s => [s.id, 'idle'])),
  sourceCounts: Object.fromEntries(RAG_SOURCES.map(s => [s.id, 0])),
  totalChunks: 0,
  totalVectors: 0,
  entityActors: 0,
  entityGovernorates: 0,
  hotDocs: 0,
  warmDocs: 0,
  coldDocs: 0,
});

const RAGTab: React.FC = () => {
  const [ragState] = useState<RAGState>(defaultRAGState());
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const totalIngested = Object.values(ragState.sourceCounts).reduce((s, c) => s + c, 0);
  const allIdle = Object.values(ragState.pipelineStatus).every(s => s === 'idle');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar space-y-3">

      {/* Vector Memory Layer Card */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500/5 to-transparent border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Library className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Vector Memory Layer</h3>
            <p className="text-[8px] font-mono text-slate-500">pgvector · hybrid retrieval · shared cognitive substrate</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-bold uppercase font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              INITIALIZING
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Storage Used</div>
              <div className="text-lg font-bold text-slate-600 font-mono">—</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Total Chunks</div>
              <div className="text-lg font-bold text-slate-600 font-mono">0</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Collections</div>
              <div className="text-lg font-bold text-slate-600 font-mono">0</div>
            </div>
          </div>
          <div className="bg-black/40 border border-dashed border-white/5 rounded-lg px-4 py-6 text-center">
            <Library className="w-6 h-6 text-slate-700 mx-auto mb-2 opacity-30" />
            <p className="text-[10px] font-mono text-slate-600 italic">Memory infrastructure not yet initialized — ingestion pipeline required</p>
          </div>
        </div>
      </div>

      {/* Pipeline Status */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Server className="w-3.5 h-3.5 text-intel-cyan" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Pipeline Stages</span>
          <span className="text-[8px] font-mono text-slate-600 ml-auto">All stages idle</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PIPELINE_STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <div className="bg-[#0a0a0c] border border-white/5 rounded-lg p-3 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <stage.icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-bold">
                    {ragState.pipelineStatus[stage.id]}
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

      {/* Data Sources + Memory Tiers in a 2-col layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Data Sources */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-intel-cyan" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Data Sources</span>
                <span className="text-[8px] font-mono text-slate-600">{totalIngested} ingested</span>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {RAG_SOURCES.map(src => (
                <div key={src.id}>
                  <button
                    onClick={() => setExpandedSource(expandedSource === src.id ? null : src.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${src.color}15`, borderColor: `${src.color}30`, borderWidth: 1 }}>
                        <src.icon className="w-3 h-3" style={{ color: src.color }} />
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-white">{src.label}</div>
                        <div className="text-[7px] font-mono text-slate-600">{src.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-slate-600">{ragState.sourceCounts[src.id]} docs</span>
                      <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-bold">PENDING</span>
                      {expandedSource === src.id ? <ChevronDown className="w-3 h-3 text-slate-600" /> : <ChevronRight className="w-3 h-3 text-slate-600" />}
                    </div>
                  </button>
                  {expandedSource === src.id && (
                    <div className="px-4 pb-3 pt-1">
                      <div className="bg-black/40 border border-dashed border-white/5 rounded-lg px-3 py-2.5 text-[8px] font-mono text-slate-600 italic">
                        Source not yet connected — ingestion pipeline must be active
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Memory Tiers + Entity Extraction */}
          <div className="space-y-3">
            {/* Memory Tiers */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-3.5 h-3.5 text-intel-cyan" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Memory Tiers</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MEMORY_TIERS.map(tier => (
                  <div key={tier.id} className="bg-black/40 border border-white/5 rounded-lg p-3 text-center">
                    <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ backgroundColor: tier.color, boxShadow: `0 0 6px ${tier.color}40` }} />
                    <div className="text-[9px] font-bold text-white">{tier.label}</div>
                    <div className="text-[7px] font-mono text-slate-600 mb-1.5">{tier.desc}</div>
                    <div className="text-[8px] font-mono text-slate-600">{ragState[`${tier.id}Docs` as keyof RAGState] as number} docs</div>
                    <div className="text-[6px] font-mono text-slate-700">{tier.storage}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Extraction */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-3.5 h-3.5 text-intel-cyan" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">Entity Extraction</span>
                <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider font-bold ml-auto">IDLE</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-center">
                  <Users className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-slate-600 font-mono">{ragState.entityActors}</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Actors</div>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-center">
                  <MapPin className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-slate-600 font-mono">{ragState.entityGovernorates}</div>
                  <div className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Governorates</div>
                </div>
              </div>
              <div className="mt-2 bg-black/40 border border-dashed border-white/5 rounded-lg px-3 py-2 text-center">
                <p className="text-[7px] font-mono text-slate-600 italic">Entity extraction pipeline not running</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consumers */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-3.5 h-3.5 text-intel-cyan" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">RAG Consumers</span>
            <span className="text-[8px] font-mono text-slate-600">Built-in — pending infrastructure</span>
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

        {/* Phase Roadmap */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
            <Activity className="w-3.5 h-3.5 text-intel-cyan" />
            <span className="text-[9px] font-bold text-white uppercase tracking-widest">Phase Roadmap</span>
            <span className="text-[8px] font-mono text-slate-600 ml-auto">5 phases · 0% complete</span>
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

        {/* Metadata Schema Preview */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-3.5 h-3.5 text-intel-cyan" />
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
          <p className="text-[7px] font-mono text-slate-600 mt-2 italic">Metadata is what transforms generic RAG into intelligence retrieval</p>
        </div>
      </div>
    );
  };

export default RAGTab;
