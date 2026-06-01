import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Flame, AlertTriangle, RefreshCw, Activity, Zap, Clock, Shield, Globe, Map as MapIcon, Eye } from 'lucide-react';                
import { fetchFireIntelligence, getSimulatedFireData, FireIntelligenceState, FireSignal, FireType } from '../../services/firmsService';
import { TacticalMap } from '../tactical/TacticalMap';
import { Governorate, IntelEvent } from '../../types/intel';
import { cn } from '../../lib/utils';
import { CornerAccent } from '../shared/ProfessionalShared';

interface FireIntelligencePanelProps {
  governorates?: Governorate[];
  events?: IntelEvent[];
}

const FIRE_CONFIG: Record<FireType, { label: string; color: string; bg: string; border: string }> = {
  PROTEST_HIGH:   { label: 'Protest — High Confidence', color: 'text-intel-red',    bg: 'bg-intel-red/10',    border: 'border-intel-red/40' },
  PROTEST_MEDIUM: { label: 'Protest — Medium',          color: 'text-intel-orange', bg: 'bg-intel-orange/8',  border: 'border-intel-orange/25' },
  PROTEST_LOW:    { label: 'Protest — Low',             color: 'text-yellow-500',   bg: 'bg-yellow-500/5',    border: 'border-yellow-500/20' },
  INDUSTRIAL:     { label: 'Industrial',                color: 'text-slate-500',    bg: 'bg-black/10',        border: 'border-slate-700' },
  AGRICULTURAL:   { label: 'Agricultural Burn',         color: 'text-slate-600',    bg: 'bg-black/5',         border: 'border-slate-800' },
  UNKNOWN:        { label: 'Unknown',                   color: 'text-slate-700',    bg: 'bg-black/5',         border: 'border-slate-800' },
};

const FireCard: React.FC<{ s: FireSignal }> = ({ s }) => {
  const cfg = FIRE_CONFIG[s.fireType];
  const pct = Math.round(s.protestProbability * 100);
  return (
    <div className={`p-4 rounded-xl border space-y-2 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Flame className={`w-3.5 h-3.5 ${cfg.color} ${s.fireType === 'PROTEST_HIGH' ? 'animate-pulse' : ''}`} />
          <span className={`text-[9px] font-mono font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono text-slate-600">Protest prob</div>
          <div className={`text-xl font-bold font-mono ${cfg.color}`}>{pct}%</div>
        </div>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 70 ? 'bg-intel-red' : pct >= 50 ? 'bg-intel-orange' : 'bg-yellow-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-[8px] font-mono">
        <div><span className="text-slate-600">Location: </span><span className={cfg.color}>{s.nearestUrbanCenter}</span><span className="text-slate-700"> ({s.distanceToUrban.toFixed(1)}km)</span></div>
        <div><span className="text-slate-600">Gov: </span><span className="text-slate-300">{s.governorate}</span></div>
        <div><span className="text-slate-600">Time: </span><span className={s.localHour >= 19 || s.localHour <= 5 ? 'text-intel-orange font-bold' : 'text-slate-500'}>{s.localHour}:00 {s.localHour >= 19 || s.localHour <= 5 ? '(NIGHT)' : '(DAY)'}</span></div>
        <div><span className="text-slate-600">Cluster: </span><span className={s.clusterSize >= 3 ? 'text-intel-red font-bold' : 'text-slate-400'}>{s.clusterSize} hotspots</span></div>
      </div>
      <div className="text-[8px] text-slate-600 italic">{s.classificationReason}</div>
      {s.epsilonContribution > 0 && (
        <div className="flex items-center space-x-2 border-t border-white/5 pt-2">
          <Zap className="w-3 h-3 text-intel-red" />
          <span className="text-[8px] font-mono text-intel-red">ε(t) +{s.epsilonContribution.toFixed(3)} → EQ.13{s.affectsEQ17 ? ' + EQ.17' : ''}</span>
        </div>
      )}
    </div>
  );
};

export const FireIntelligencePanel: React.FC<FireIntelligencePanelProps> = ({ governorates = [], events = [] }) => {
  const [state, setState] = useState<FireIntelligenceState | null>(null);
  const [loading, setLoading] = useState(false);
  const [simMode, setSimMode] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PROTEST' | 'ACTIVE'>('PROTEST');
  const [showChoropleth, setShowChoropleth] = useState(true);
  const fireRiskLegend = useMemo(() => [
    { label: 'High Risk', color: 'bg-intel-red' },
    { label: 'Elevated Risk', color: 'bg-intel-orange' },
    { label: 'Moderate Risk', color: 'bg-yellow-500' },
  ], []);

  const load = useCallback(async (sim = false) => {
    setLoading(true);
    try {
      if (sim) { await new Promise(r => setTimeout(r, 500)); setState(getSimulatedFireData()); setSimMode(true); }
      else { const r = await fetchFireIntelligence(true); if (r.fetchError) { setState(getSimulatedFireData()); setSimMode(true); } else { setState(r); setSimMode(false); } }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (state?.hotspots ?? []).filter(s =>
    filter === 'PROTEST' ? s.fireType.startsWith('PROTEST') :
    filter === 'ACTIVE'  ? s.protestProbability >= 0.50 :
    s.fireType !== 'AGRICULTURAL'
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Flame className="w-5 h-5 text-intel-red shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.15em] leading-tight">Fire Intelligence</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase">
              NASA FIRMS VIIRS · {simMode ? 'DEMO' : 'SNPP 24h'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => load(true)} className="text-[8px] font-mono text-slate-600 hover:text-intel-cyan px-2 py-1.5 rounded border border-slate-800 flex-1 sm:flex-none">Demo</button>
          <button onClick={() => load(false)} disabled={loading} className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg border border-intel-cyan/30 bg-intel-cyan/5 text-intel-cyan text-[9px] font-mono uppercase hover:bg-intel-cyan/10 disabled:opacity-40 transition-all flex-1 sm:flex-none">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Fetching...' : 'Live'}</span>
          </button>
        </div>
      </div>

      {state && (
        <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${state.cascadeRisk ? 'border-intel-red/40 bg-intel-red/8' : state.activeProtestSignals.length > 0 ? 'border-intel-orange/30 bg-intel-orange/5' : 'border-intel-border/40 bg-black/10'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total hotspots', val: state.hotspots.length, color: 'text-on-surface' },
              { label: 'Protest signals', val: state.activeProtestSignals.length, color: state.activeProtestSignals.length > 0 ? 'text-intel-red' : 'text-slate-500' },
              { label: 'Govs affected', val: state.governoratesAffected.length, color: state.cascadeRisk ? 'text-intel-red' : 'text-slate-400' },
              { label: 'Σ ε(t)', val: `+${state.totalEpsilon.toFixed(3)}`, color: state.totalEpsilon > 0.05 ? 'text-intel-red' : 'text-slate-500' },
            ].map(m => (
              <div key={m.label} className="text-center sm:text-left">
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter sm:tracking-normal">{m.label}</div>
                <div className={`text-2xl sm:text-3xl font-bold font-mono ${m.color}`}>{m.val}</div>
              </div>
            ))}
          </div>
          {state.cascadeRisk && (
            <div className="flex items-center space-x-2 border-t border-white/5 pt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-intel-red animate-pulse" />
              <span className="text-[9px] font-mono text-intel-red font-bold">CASCADE RISK — {state.governoratesAffected.join(', ')}</span>
            </div>
          )}
          {state.lastFetched && (
            <div className="flex items-center space-x-2 text-[8px] font-mono text-slate-700">
              <Clock className="w-3 h-3" />
              <span>Updated: {state.lastFetched.toLocaleTimeString()}</span>
              {simMode && <span className="text-intel-orange/60 ml-2">[DEMO — FIRMS unavailable in this environment]</span>}
            </div>
          )}
        </div>
      )}

      {/* Spatial Intelligence — Thermal Horizon Map */}
      {/* Spatial Intelligence — Thermal Horizon Map */}
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest flex items-center">
              <Globe className="w-4 h-4 mr-2 text-intel-orange" />
              Spatial Thermal Intelligence 
            </h3>
          </div>

          {/* RRI Choropleth Toggle */}
          <button
            onClick={() => setShowChoropleth(!showChoropleth)}
            className={cn(
              "flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all font-mono text-[9px] uppercase font-bold",
              showChoropleth 
                ? "bg-intel-cyan/20 border-intel-cyan text-intel-cyan" 
                : "bg-black/60 border-intel-border/50 text-slate-500 hover:text-slate-300"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>RRI CHOROPLETH: {showChoropleth ? 'ENABLED' : 'HIDDEN'}</span>
          </button>
        </div>

        {/* Map Container */}
        <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden relative">
          <div className="h-[500px] sm:h-[650px] w-full relative">
            <TacticalMap 
              governorates={governorates}
              events={events}
              activeRegion="National"
              initialLayers={{ fire: true, scanning: true, grid: false }}
              forcedRiskZones={showChoropleth}
              initialActiveLayer="risk"
              hideHeader={true}
              hideControls={true}
              hideStatus={true}
              hideRegionWheel={true}
              hideLegend={true}
              showRriToggle={false}
            />
          </div>
        </div>

        {/* Risk Level Legend (Bottom) */}
        <div className="flex items-center space-x-4 bg-black/40 border border-intel-border/50 p-3 rounded-xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Risk Level:</span>
          {fireRiskLegend.map((item) => (
            <div key={item.label} className="flex items-center space-x-1.5">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-[10px] font-mono text-slate-300 uppercase">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-1 bg-black/40 border border-intel-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-hide">
        {(['ALL', 'PROTEST', 'ACTIVE'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all whitespace-nowrap ${filter === f ? 'bg-intel-red/10 text-intel-red border border-intel-red/20' : 'text-slate-600 hover:text-slate-300'}`}>
            {f === 'ACTIVE' ? 'HIGH CONF' : f}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12"><Flame className="w-8 h-8 text-intel-red animate-pulse mx-auto" /><div className="text-[10px] font-mono text-intel-red uppercase mt-3">Fetching FIRMS VIIRS...</div></div>}

      {!loading && filtered.length === 0 && state && (
        <div className="text-center py-12">
          <Shield className="w-8 h-8 text-slate-700 mx-auto" />
          <div className="text-[10px] font-mono text-slate-600 uppercase mt-2">No {filter.toLowerCase()} signals in 24h window</div>
        </div>
      )}

      {!loading && <div className="space-y-2">{filtered.map(s => <FireCard key={s.id} s={s} />)}</div>}

      <div className="glass p-4 sm:p-5 rounded-2xl border border-intel-border/50 space-y-3">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Classification Logic</div>
        <div className="space-y-3 sm:space-y-2">
          {[
            { label: 'PROTEST HIGH',   rule: 'Urban (<3km) + Night (19-05h) + Clustered (2+ in 25km)', color: 'text-intel-red' },
            { label: 'PROTEST MEDIUM', rule: 'Urban + Night OR Urban + Clustered',                    color: 'text-intel-orange' },
            { label: 'PROTEST LOW',    rule: 'Urban only — unconfirmed',                               color: 'text-yellow-500' },
            { label: 'AGRICULTURAL',   rule: 'Rural + Daytime → filtered out',                         color: 'text-slate-600' },
          ].map(i => (
            <div key={i.label} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:space-x-3 text-[8px]">
              <span className={`font-mono font-bold sm:w-28 shrink-0 ${i.color}`}>{i.label}</span>
              <span className="text-slate-500 leading-tight">{i.rule}</span>
            </div>
          ))}
        </div>
        <div className="text-[8px] text-slate-700 border-t border-white/5 pt-2">
          NASA FIRMS VIIRS SNPP NRT · 375m resolution · Tunisia bounding box 30-38°N, 7.5-12°E ·
          Nominal + high confidence only · Gafsa/Kasserine/Sidi Bouzid: 1.9-2.0× sensitivity multiplier (historical protest precedent).
        </div>
      </div>
    </div>
  );
};
