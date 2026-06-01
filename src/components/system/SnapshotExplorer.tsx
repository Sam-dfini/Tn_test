import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, Clock, ArrowRight, 
  ShieldCheck, AlertTriangle, Info, ChevronDown, ChevronUp,
  Download, RefreshCw, TrendingUp, Shield, Globe, Users, MapPin
} from 'lucide-react';
import { NationalStateSnapshot, TRUTH_CLASS_LABELS, TRUTH_CLASS_COLORS } from '../../domain/models/nationalState';

// Comprehensive mock data
const MOCK_SNAPSHOT: NationalStateSnapshot = {
  snapshot_id: '550e8400-e29b-41d4-a716-446655440000',
  version: 'v1.0.0',
  created_at: '2026-05-29T10:30:00Z',
  window: { from: '2026-05-28T10:30:00Z', to: '2026-05-29T10:30:00Z' },
  truth_class: 'REAL',
  is_simulation: false,
  provenance: {
    sources: ['supabase', 'rss', 'bct', 'imf', 'wb'],
    pipeline_run_id: 'run_1716972600000_abc123',
    model_versions: { classification: 'v2.1', brief_model: 'gpt-4-turbo-2024-04-09', rri_engine: 'rri-engine-v2' },
    ingested_at: '2026-05-29T10:30:00Z', processed_at: '2026-05-29T10:30:05Z',
  },
  confidence: {
    overall: 0.82,
    by_domain: { economic: 0.85, political: 0.80, social: 0.83, security: 0.75, narrative: 0.78 },
    by_source: { supabase: 0.85, rss: 0.70, bct: 0.82, imf: 0.78, wb: 0.76 },
    model_versions: { classification: 'v2.1', brief_model: 'gpt-4-turbo-2024-04-09', rri_engine: 'rri-engine-v2' },
  },
  risk_vector: {
    rri: 2.31, p_rev: 0.643, salience: 0.412, w_t: 0.72, ci_low: 59.8, ci_high: 68.7,
    velocity: 0.05, velocity_label: 'STABLE', compound_stress: 0.35, pattern_similarity: 0.15,
    pattern_label: 'LOW SIMILARITY TO HISTORICAL PATTERNS', cascade_probability: 0.35,
    info_amplification: 1.0, elite_cohesion_dynamics: 0.65, elite_defection_prob: 0.22,
    cpi_index: 0.45, acceleration: 0.02, structural_econ: 0.38,
    sir_susceptible: 0.88, sir_infected: 0.05, sir_recovered: 0.07,
    stochastic_shock: 0.0, last_calculated: '2026-05-29T10:30:00Z', variables_count: 24,
    threshold_breaches: [
      { variable: 'A_FX', value: 84, threshold: 90, impact: 0.12 },
      { variable: 'E51', value: 23, threshold: 20, impact: 0.08 },
    ],
  },
  derived_metrics: { rri: 2.31, p_rev: 0.643, cascade_probability: 0.35, velocity: 0.05, compound_stress: 0.35, elite_defection_prob: 0.22 },
  governorates: [
    { id: '1', name: { en: 'Tunis', ar: 'تونس' }, risk_level: 'MEDIUM', tension: 'moderate', rri_score: 2.1, protest_count: 5, unemp: 15.2, water_cut_hours: 4, internet_score: 85, event_count: 12, pop: 1000000, area_km2: 210, pop_density: 4762, youth_pct: 32, rural_pct: 15, gdp_pc_tnd: 8500, poverty_pct: 12, literacy_pct: 95, internal_migration: 15000, healthcare_beds_1k: 3.2, tribal_influence: 'LOW', police_presence: 'HIGH', main_tribes: [], key_industry: 'Services', water_source: 'Groundwater', election_turnout_2023: 42, decree54_cases: 12, migration_attempts_2025: 1200, cascade_risk: 0.25, pred_7d: 3, pred_30d: 12, pred_90d: 35, last_updated: '2026-05-29T10:30:00Z' },
    { id: '2', name: { en: 'Sfax', ar: 'صفاقس' }, risk_level: 'HIGH', tension: 'tension', rri_score: 2.8, protest_count: 12, unemp: 18.5, water_cut_hours: 8, internet_score: 78, event_count: 28, pop: 320000, area_km2: 120, pop_density: 2667, youth_pct: 35, rural_pct: 25, gdp_pc_tnd: 6200, poverty_pct: 18, literacy_pct: 88, internal_migration: 8000, healthcare_beds_1k: 2.8, tribal_influence: 'MEDIUM', police_presence: 'MEDIUM', main_tribes: ['Beni Khalled'], key_industry: 'Industry', water_source: 'Desalination', election_turnout_2023: 38, decree54_cases: 8, migration_attempts_2025: 2800, cascade_risk: 0.45, pred_7d: 8, pred_30d: 25, pred_90d: 60, last_updated: '2026-05-29T10:30:00Z' },
    { id: '3', name: { en: 'Kasserine', ar: 'القصرين' }, risk_level: 'CRITICAL', tension: 'alert', rri_score: 3.2, protest_count: 18, unemp: 22.3, water_cut_hours: 12, internet_score: 65, event_count: 45, pop: 180000, area_km2: 300, pop_density: 600, youth_pct: 38, rural_pct: 45, gdp_pc_tnd: 4100, poverty_pct: 28, literacy_pct: 72, internal_migration: 5000, healthcare_beds_1k: 1.5, tribal_influence: 'HIGH', police_presence: 'LOW', main_tribes: ['Beni Zentis', 'Ouled Khelil'], key_industry: 'Agriculture', water_source: 'Surface water', election_turnout_2023: 35, decree54_cases: 15, migration_attempts_2025: 3500, cascade_risk: 0.65, pred_7d: 15, pred_30d: 45, pred_90d: 95, last_updated: '2026-05-29T10:30:00Z' },
  ],
  active_shocks: [
    {
      id: 'shock_1',
      type: 'ECON',
      source: 'FX Reserves Warning',
      intensity: 0.45,
      message: 'Foreign exchange reserves fell below 90 days warning threshold',
      timestamp: 1716972000000,
      overrides: { 'A_FX': 84 },
      governorates: ['2', '3'],
      affectedEquations: ['EQ.1', 'EQ.5'],
      propagationPath: ['A_FX → EQ.1 → RRI'],
    },
    {
      id: 'shock_2',
      type: 'SOCIAL',
      source: 'Protest Surge',
      intensity: 0.38,
      message: 'Protest events exceeded 30/month threshold',
      timestamp: 1716968400000,
      overrides: { 'E51': 23 },
      governorates: ['1', '2', '3'],
      affectedEquations: ['EQ.21', 'EQ.51'],
      propagationPath: ['E51 → EQ.51 → RRI'],
    },
  ],
  freshness: { age_seconds: 300, is_stale: false, last_updated: '2026-05-29T10:30:00Z' },
};

const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center space-x-2 mb-3 border-b border-intel-border/30 pb-2">
    {icon && <span className="text-intel-cyan">{icon}</span>}
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
  </div>
);

const ValueRow: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between py-2 border-b border-intel-border/10">
    <span className="text-[9px] font-mono text-slate-500 uppercase">{label}</span>
    <span className={`text-[10px] font-bold ${highlight ? 'text-intel-cyan' : 'text-slate-300'}`}>{String(value)}</span>
  </div>
);

export const SnapshotExplorer: React.FC = () => {
  const [snapshot, setSnapshot] = useState<NationalStateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string[]>(['overview', 'risk', 'governorates']);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setSnapshot(MOCK_SNAPSHOT);
    setLoading(false);
  }, []);

  const toggle = (section: string) => setExpanded(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setSnapshot(prev => prev ? { ...prev, created_at: new Date().toISOString(), freshness: { ...prev.freshness, age_seconds: 0, last_updated: new Date().toISOString() } } : null);
    } finally { setRefreshing(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      <Database className="w-8 h-8 animate-pulse" />
      <span className="ml-3 font-mono">Loading National State Snapshot...</span>
    </div>
  );

  if (!snapshot) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      <Database className="w-8 h-8 opacity-50" />
      <span className="ml-3 font-mono">No snapshot available</span>
    </div>
  );

  const truthColor = TRUTH_CLASS_COLORS[snapshot.truth_class];
  const isSimulation = snapshot.truth_class === 'SIMULATION';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#05070a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-intel-border/30 bg-black/40">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-intel-cyan" />
          <div>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest">National State Snapshot</h2>
            <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-500">
              <span>ID: {snapshot.snapshot_id.slice(0, 8)}...</span>
              <span>•</span>
              <span>Ver: {snapshot.version}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-[9px] font-bold px-2 py-1 rounded border uppercase ${truthColor}`}>{TRUTH_CLASS_LABELS[snapshot.truth_class]}</span>
          {isSimulation && <span className="text-[9px] font-mono text-purple-400">Base: {snapshot.simulation_base_snapshot_id?.slice(0, 8)}...</span>}
          <button onClick={refresh} disabled={refreshing} className="p-2 text-slate-500 hover:text-intel-cyan disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        
        {/* Overview */}
        <div className="glass-panel rounded-xl border border-intel-border/20 overflow-hidden">
          <button onClick={() => toggle('overview')} className="w-full flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-black/30">
            <div className="flex items-center space-x-2"><Info className="w-4 h-4 text-intel-cyan" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Overview</span></div>
            {expanded.includes('overview') ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded.includes('overview') && (
            <div className="p-4 space-y-4 border-t border-intel-border/10">
              <div className="grid grid-cols-2 gap-4">
                <div><SectionHeader title="Timestamps" icon={<Clock className="w-3 h-3" />} /><ValueRow label="Created" value={new Date(snapshot.created_at).toLocaleString()} /><ValueRow label="Window From" value={new Date(snapshot.window.from).toLocaleString()} /><ValueRow label="Window To" value={new Date(snapshot.window.to).toLocaleString()} /><ValueRow label="Freshness" value={`${snapshot.freshness.age_seconds}s ago`} highlight /></div>
                <div><SectionHeader title="Version History" icon={<ArrowRight className="w-3 h-3" />} />{snapshot.parent_snapshot_id && <ValueRow label="Parent" value={snapshot.parent_snapshot_id.slice(0, 8) + '...'} />}{snapshot.children_snapshot_ids?.length ? <ValueRow label="Children" value={`${snapshot.children_snapshot_ids.length} fork(s)`} /> : <ValueRow label="Children" value="None" />}</div>
              </div>
            </div>
          )}
        </div>

        {/* Provenance */}
        <div className="glass-panel rounded-xl border border-intel-border/20 overflow-hidden">
          <button onClick={() => toggle('provenance')} className="w-full flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-black/30">
            <div className="flex items-center space-x-2"><ShieldCheck className="w-4 h-4 text-intel-green" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Provenance</span></div>
            {expanded.includes('provenance') ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded.includes('provenance') && (
            <div className="p-4 space-y-4 border-t border-intel-border/10">
              <div><SectionHeader title="Data Sources" icon={<Database className="w-3 h-3" />} /><div className="flex flex-wrap gap-2">{snapshot.provenance.sources.map(s => <span key={s} className="px-2 py-1 bg-intel-cyan/5 text-intel-cyan text-[8px] font-mono rounded border border-intel-cyan/10 uppercase">{s}</span>)}</div></div>
              <div className="grid grid-cols-2 gap-4"><ValueRow label="Pipeline Run ID" value={snapshot.provenance.pipeline_run_id} /><ValueRow label="Model Versions" value={Object.entries(snapshot.provenance.model_versions).map(([k, v]) => `${k}: ${v}`).join(', ')} /></div>
            </div>
          )}
        </div>

        {/* Confidence */}
        <div className="glass-panel rounded-xl border border-intel-border/20 overflow-hidden">
          <button onClick={() => toggle('confidence')} className="w-full flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-black/30">
            <div className="flex items-center space-x-2"><Activity className="w-4 h-4 text-intel-orange" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Confidence</span></div>
            {expanded.includes('confidence') ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded.includes('confidence') && (
            <div className="p-4 space-y-4 border-t border-intel-border/10">
              <div><div className="flex items-center justify-between mb-1"><span className="text-[9px] font-mono text-slate-500 uppercase">Overall Confidence</span><span className={`text-[10px] font-bold ${snapshot.confidence.overall >= 0.8 ? 'text-green-400' : snapshot.confidence.overall >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>{(snapshot.confidence.overall * 100).toFixed(0)}%</span></div><div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${snapshot.confidence.overall >= 0.8 ? 'bg-green-500' : snapshot.confidence.overall >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${snapshot.confidence.overall * 100}%` }} /></div></div>
              <div><SectionHeader title="By Domain" icon={<Activity className="w-3 h-3" />} />{Object.entries(snapshot.confidence.by_domain).map(([domain, score]) => <div key={domain} className="space-y-1"><div className="flex items-center justify-between text-[9px]"><span className="text-slate-500 uppercase">{domain}</span><span className="text-slate-300">{(score * 100).toFixed(0)}%</span></div><div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="bg-intel-cyan h-full" style={{ width: `${score * 100}%` }} /></div></div>)}</div>
            </div>
          )}
        </div>

        {/* Risk Vector */}
        <div className="glass-panel rounded-xl border border-intel-border/20 overflow-hidden">
          <button onClick={() => toggle('risk')} className="w-full flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-black/30">
            <div className="flex items-center space-x-2"><AlertTriangle className="w-4 h-4 text-intel-red" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Risk Vector</span></div>
            {expanded.includes('risk') ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded.includes('risk') && (
            <div className="p-4 space-y-4 border-t border-intel-border/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-intel-border/10"><div className="text-[8px] text-slate-500 uppercase mb-1">RRI</div><div className="text-xl font-bold text-intel-red">{snapshot.risk_vector.rri.toFixed(3)}</div></div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-intel-border/10"><div className="text-[8px] text-slate-500 uppercase mb-1">P(Rev)</div><div className="text-xl font-bold text-intel-orange">{(snapshot.risk_vector.p_rev * 100).toFixed(1)}%</div></div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-intel-border/10"><div className="text-[8px] text-slate-500 uppercase mb-1">Velocity</div><div className="text-xl font-bold text-intel-cyan">{snapshot.risk_vector.velocity.toFixed(3)}</div></div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-intel-border/10"><div className="text-[8px] text-slate-500 uppercase mb-1">Cascade</div><div className="text-xl font-bold text-amber-400">{(snapshot.risk_vector.cascade_probability * 100).toFixed(1)}%</div></div>
              </div>
              <div><SectionHeader title="Threshold Breaches" icon={<AlertTriangle className="w-3 h-3" />} />{snapshot.risk_vector.threshold_breaches.length > 0 ? <div className="space-y-2">{snapshot.risk_vector.threshold_breaches.map((breach, i) => <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg"><div className="flex items-center justify-between mb-2"><span className="text-[9px] font-bold text-red-400 uppercase">{breach.variable}</span><span className="text-[8px] text-red-300/70">Impact: +{breach.impact.toFixed(3)}</span></div><div className="flex items-center justify-between text-[9px]"><span className="text-slate-500">Value: {breach.value}</span><span className="text-slate-500">Threshold: {breach.threshold}</span></div></div>)}</div> : <div className="text-[9px] text-slate-500 italic">No threshold breaches</div>}</div>
            </div>
          )}
        </div>

        {/* Governorates */}
        <div className="glass-panel rounded-xl border border-intel-border/20 overflow-hidden">
          <button onClick={() => toggle('governorates')} className="w-full flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-black/30">
            <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-intel-green" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Governorates ({snapshot.governorates.length})</span></div>
            {expanded.includes('governorates') ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded.includes('governorates') && (
            <div className="p-4 space-y-3 border-t border-intel-border/10">
              {snapshot.governorates.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{snapshot.governorates.map(gov => <div key={gov.id} className="bg-slate-900/30 p-3 rounded-lg border border-intel-border/10"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-on-surface">{gov.name.en}</span><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${gov.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : gov.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : gov.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{gov.risk_level}</span></div><div className="space-y-1 text-[9px] text-slate-500"><div className="flex justify-between"><span>RRI Score</span><span className="text-slate-300">{gov.rri_score.toFixed(2)}</span></div><div className="flex justify-between"><span>Unemployment</span><span className="text-slate-300">{gov.unemp}%</span></div><div className="flex justify-between"><span>Water Cuts</span><span className="text-slate-300">{gov.water_cut_hours}h</span></div></div></div>)}</div> : <div className="text-[9px] text-slate-500 italic">No governorate data available</div>}
            </div>
          )}
        </div>

        {/* Active Shocks */}
        <div className="glass-panel rounded-xl border border-intel-border/20 overflow-hidden">
          <button onClick={() => toggle('shocks')} className="w-full flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-black/30">
            <div className="flex items-center space-x-2"><AlertTriangle className="w-4 h-4 text-intel-red" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Active Shocks ({snapshot.active_shocks.length})</span></div>
            {expanded.includes('shocks') ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {expanded.includes('shocks') && (
            <div className="p-4 space-y-3 border-t border-intel-border/10">
              {snapshot.active_shocks.length > 0 ? <div className="space-y-3">{snapshot.active_shocks.map(shock => <div key={shock.id} className="bg-slate-900/30 p-3 rounded-lg border border-intel-border/10"><div className="flex items-center justify-between mb-2"><div className="flex items-center space-x-2"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${shock.type === 'ECON' ? 'bg-blue-500/20 text-blue-400' : shock.type === 'SEC' ? 'bg-red-500/20 text-red-400' : shock.type === 'SOCIAL' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'}`}>{shock.type}</span><span className="text-[9px] font-bold text-on-surface">{shock.source}</span></div><span className="text-[8px] text-slate-500">{(shock.intensity * 100).toFixed(0)}% intensity</span></div><p className="text-[9px] text-slate-400 mb-2">{shock.message}</p>{shock.affectedEquations && <div className="flex flex-wrap gap-1">{shock.affectedEquations.map(eq => <span key={eq} className="text-[9px] font-mono text-intel-cyan bg-intel-cyan/5 px-1.5 py-0.5 rounded">{eq}</span>)}</div>}</div>)}</div> : <div className="text-[9px] text-slate-500 italic">No active shocks</div>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
