/**
 * ScenarioSandbox — Scenario injection & live RRI propagation view
 * Replaces the dead Three.js SimulationView with a real intelligence tool.
 *
 * Architecture:
 *   - 30 calibrated shock scenarios across 7 domains (EQ.13 taxonomy)
 *   - Injects via PipelineContext.injectShock() → recalculateRRI()
 *   - Shows live RRI delta, P(Revolution) delta, cascade delta, state phase
 *   - Multi-shock stacking with decay timeline
 *   - Propagation preview panel (reads from propagationEngine)
 *   - Black Swan library — rare high-magnitude events
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { simulatePropagation } from '../../services/propagationEngine';
import { ShockSignal } from '../../types/intel';
import govData from '../../data/governorates.json';

// ── CSS injection ──────────────────────────────────────────────
let _cssOk = false;
function injectCSS() {
  if (_cssOk) return; _cssOk = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes ssv-pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes ssv-scan   { 0%{transform:translateY(-10px)} 100%{transform:translateY(100vh)} }
    @keyframes ssv-flash  { 0%{background:rgba(255,45,85,0.25)} 100%{background:transparent} }
    @keyframes ssv-slide  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ssv-bar    { from{width:0} to{width:var(--w)} }
    @keyframes ssv-ring   { 0%{r:0;opacity:.7} 100%{r:50;opacity:0} }
    @keyframes ssv-glow   { 0%,100%{box-shadow:0 0 12px var(--c)} 50%{box-shadow:0 0 28px var(--c)} }
  `;
  document.head.appendChild(s);
}

// ── Shock catalogue (EQ.13 taxonomy) ──────────────────────────
interface ShockTemplate {
  id: string;
  label: string;
  domain: 'ECON' | 'SOCIAL' | 'POLITICAL' | 'SEC' | 'AGRI' | 'CLIMATE' | 'SYSTEM';
  magnitude: number;    // epsilon(t) magnitude
  decay: number;        // days to half-life
  description: string;
  equations: string[];
  overrides: Record<string, number>;
  blackSwan?: boolean;
}

const DOMAIN_COLOR: Record<string, string> = {
  ECON:      '#00f2ff',
  SOCIAL:    '#3b82f6',
  POLITICAL: '#d68910',
  SEC:       '#ef4444',
  AGRI:      '#22c55e',
  CLIMATE:   '#06b6d4',
  SYSTEM:    '#ff6b35',
};

const SHOCKS: ShockTemplate[] = [
  // ── ECONOMIC ───────────────────────────────────────────────
  {
    id: 'IMF_BREAKDOWN',
    label: 'IMF Deal Collapse',
    domain: 'ECON',
    magnitude: 0.72,
    decay: 90,
    description: 'Technical mission suspended indefinitely. FX reserves under 90-day cover.',
    equations: ['EQ.1','EQ.9','EQ.13','EQ.24'],
    overrides: { 'economy.imf_deal_probability': 5, 'economy.fx_reserves': 62, 'economy.tnd_usd': 3.45, '_battle_deaths_norm': 0.4 },
  },
  {
    id: 'BREAD_PRICE_SHOCK',
    label: 'Bread Subsidy Cut',
    domain: 'ECON',
    magnitude: 0.85,
    decay: 45,
    description: 'Subsidized bread price doubles under IMF structural adjustment.',
    equations: ['EQ.1','EQ.13','EQ.24'],
    overrides: { 'economy.inflation': 14.5, 'economy.subsidy_cost': 0.3, 'social.protest_mobilization': 0.78 },
  },
  {
    id: 'FX_CRISIS',
    label: 'FX Reserve Depletion',
    domain: 'ECON',
    magnitude: 0.68,
    decay: 60,
    description: 'Central Bank reserves drop below 60-day import cover.',
    equations: ['EQ.1','EQ.13','EQ.15'],
    overrides: { 'economy.fx_reserves': 55, 'economy.tnd_usd': 3.8, 'economy.inflation': 12.1 },
  },
  {
    id: 'PHOSPHATE_STRIKE',
    label: 'Gafsa Phosphate Strike',
    domain: 'ECON',
    magnitude: 0.60,
    decay: 30,
    description: 'CPG production halted. Regional cascade amplifier triggered.',
    equations: ['EQ.1','EQ.17','EQ.21'],
    overrides: { 'economy.phosphate_revenue': 0.2, 'opp.union_strength': 0.85, '_cpg_amplifier': 2.2 },
  },
  {
    id: 'EUROBOND_DEFAULT',
    label: 'Sovereign Bond Default Risk',
    domain: 'ECON',
    magnitude: 0.78,
    decay: 120,
    description: 'Yields spike above 18%. IMF emergency talks initiated.',
    equations: ['EQ.1','EQ.13','EQ.15'],
    overrides: { 'economy.sovereign_yield': 18.5, 'economy.public_debt': 92, 'economy.fx_reserves': 48 },
    blackSwan: true,
  },

  // ── SOCIAL ─────────────────────────────────────────────────
  {
    id: 'WATER_CRISIS',
    label: 'National Water Cuts',
    domain: 'SOCIAL',
    magnitude: 0.80,
    decay: 21,
    description: 'SONEDE cuts expand to 14 governorates. >12h/day in Sahel.',
    equations: ['EQ.13','EQ.17','EQ.19'],
    overrides: { 'social.water_crisis_govs': 14, 'social.protest_mobilization': 0.75, '_sei_shock_magnitude': 0.6 },
  },
  {
    id: 'UGTT_GENERAL_STRIKE',
    label: 'UGTT General Strike',
    domain: 'SOCIAL',
    magnitude: 0.88,
    decay: 14,
    description: 'UGTT calls 48h national strike. Public sector paralysis.',
    equations: ['EQ.2','EQ.3','EQ.17','EQ.21'],
    overrides: { 'opp.union_strength': 0.95, 'social.ugtt_strike_count_2025': 8, '_oci': 0.65, 'social.protest_mobilization': 0.82 },
  },
  {
    id: 'YOUTH_UPRISING',
    label: 'Youth Protest Wave',
    domain: 'SOCIAL',
    magnitude: 0.76,
    decay: 18,
    description: 'Mass mobilization in 10+ cities. Unemployment + TikTok amplification.',
    equations: ['EQ.4','EQ.19','EQ.17'],
    overrides: { 'social.protest_events_30d': 45, 'social.protest_mobilization': 0.80, '_sei_salience_boost': 0.3 },
  },
  {
    id: 'SELF_IMMOLATION',
    label: 'Self-Immolation Event',
    domain: 'SOCIAL',
    magnitude: 0.92,
    decay: 10,
    description: 'Single triggering event with 2010-style symbolic ignition potential.',
    equations: ['EQ.4','EQ.13','EQ.19'],
    overrides: { '_sei_shock_magnitude': 0.9, 'social.protest_mobilization': 0.88, '_media_salience_norm': 0.95 },
    blackSwan: true,
  },

  // ── POLITICAL ──────────────────────────────────────────────
  {
    id: 'CABINET_RESHUFFLE',
    label: 'Major Cabinet Reshuffle',
    domain: 'POLITICAL',
    magnitude: 0.45,
    decay: 30,
    description: 'Finance + Interior ministers replaced. Elite fracture signal.',
    equations: ['EQ.21','EQ.18'],
    overrides: { 'politics.cabinet_changes_90d': 6, 'politics.mii': 0.72, 'regime.elite_cohesion': 0.45 },
  },
  {
    id: 'CONSTITUTION_CRISIS',
    label: 'Constitutional Deadlock',
    domain: 'POLITICAL',
    magnitude: 0.70,
    decay: 60,
    description: 'Presidential decree suspended by court. Institutional fracture.',
    equations: ['EQ.7','EQ.18','EQ.21'],
    overrides: { 'politics.trust': 0.18, 'regime.elite_cohesion': 0.35, 'opp.fragmentation': 0.82 },
  },
  {
    id: 'OPPOSITION_COALITION',
    label: 'Opposition Coalition Forms',
    domain: 'POLITICAL',
    magnitude: 0.62,
    decay: 45,
    description: 'OCI threshold crossed. Coordination multiplier activates.',
    equations: ['EQ.2','EQ.3','EQ.7'],
    overrides: { '_oci': 0.58, 'opp.fragmentation': 0.25, 'opp.union_strength': 0.75 },
  },
  {
    id: 'MILITARY_SIGNAL',
    label: 'Military Posture Signal',
    domain: 'POLITICAL',
    magnitude: 0.88,
    decay: 7,
    description: 'Armored units redeployed to Tunis perimeter. Elite defection signal.',
    equations: ['EQ.7','EQ.18'],
    overrides: { 'security.military_readiness': 0.9, 'regime.elite_cohesion': 0.28, 'politics.trust': 0.12 },
    blackSwan: true,
  },

  // ── SECURITY ───────────────────────────────────────────────
  {
    id: 'BORDER_INCURSION',
    label: 'Libyan Border Incursion',
    domain: 'SEC',
    magnitude: 0.65,
    decay: 21,
    description: 'Armed militia crossing near Medenine. Army deployment mobilized.',
    equations: ['EQ.8','EQ.13','EQ.17'],
    overrides: { '_battle_deaths_norm': 0.65, '_media_salience_norm': 0.8, 'security.border_incidents': 12 },
  },
  {
    id: 'TERROR_ATTACK',
    label: 'Terrorist Attack (Urban)',
    domain: 'SEC',
    magnitude: 0.82,
    decay: 30,
    description: 'Attack on civilian infrastructure. Tourism revenue collapse.',
    equations: ['EQ.8','EQ.13','EQ.15'],
    overrides: { '_battle_deaths_norm': 0.8, 'economy.tourism_revenue': 0.15, '_media_salience_norm': 0.95 },
    blackSwan: true,
  },
  {
    id: 'DECREE54_MASS_ARREST',
    label: 'Mass Decree 54 Arrests',
    domain: 'SEC',
    magnitude: 0.55,
    decay: 20,
    description: '25+ journalists/activists arrested in 48h. Digital blackout signals.',
    equations: ['EQ.19','EQ.2'],
    overrides: { 'social.decree54_charged': 45, 'social.press_freedom_rank': 155, '_internet_censorship': 0.75 },
  },

  // ── AGRICULTURE ────────────────────────────────────────────
  {
    id: 'WHEAT_SHOCK',
    label: 'Wheat Import Crisis',
    domain: 'AGRI',
    magnitude: 0.74,
    decay: 60,
    description: 'Black Sea route disrupted. 45-day reserve. Bread shortage signals.',
    equations: ['EQ.1','EQ.13','EQ.24'],
    overrides: { 'economy.wheat_import_cost': 0.9, 'economy.inflation': 13.5, '_sei_shock_magnitude': 0.7 },
  },
  {
    id: 'EID_PRICE_SPIKE',
    label: 'Eid Livestock Price Shock',
    domain: 'AGRI',
    magnitude: 0.60,
    decay: 14,
    description: 'Sheep prices exceed 1,200 TND. Urban purchasing power collapse.',
    equations: ['EQ.1','EQ.13'],
    overrides: { 'economy.inflation': 9.2, 'social.protest_mobilization': 0.65 },
  },
  {
    id: 'DROUGHT_CRISIS',
    label: 'Multi-Year Drought',
    domain: 'AGRI',
    magnitude: 0.70,
    decay: 180,
    description: 'Rainfall below 40% of average. Agricultural GDP collapses 25%.',
    equations: ['EQ.1','EQ.13','EQ.15'],
    overrides: { 'environment.water_stress': 0.92, 'economy.agricultural_gdp': 0.3, 'environment.drought_index': 0.85 },
  },

  // ── CLIMATE ────────────────────────────────────────────────
  {
    id: 'HEAT_WAVE',
    label: 'Extreme Heat Wave',
    domain: 'CLIMATE',
    magnitude: 0.55,
    decay: 10,
    description: '47°C in Kairouan for 8 days. Energy grid stress. STEG blackouts.',
    equations: ['EQ.13','EQ.17'],
    overrides: { 'environment.temperature_anomaly': 0.9, 'social.protest_mobilization': 0.6, '_sei_shock_magnitude': 0.4 },
  },
  {
    id: 'FLOOD_DISASTER',
    label: 'Flash Flood (Nabeul/Sfax)',
    domain: 'CLIMATE',
    magnitude: 0.66,
    decay: 21,
    description: '200mm in 6h. Infrastructure collapse. 20,000 displaced.',
    equations: ['EQ.13','EQ.17','EQ.15'],
    overrides: { 'environment.flood_index': 0.9, '_sei_shock_magnitude': 0.5, 'social.protest_mobilization': 0.55 },
  },

  // ── SYSTEM ─────────────────────────────────────────────────
  {
    id: 'INTERNET_SHUTDOWN',
    label: 'Internet Shutdown',
    domain: 'SYSTEM',
    magnitude: 0.58,
    decay: 5,
    description: 'BGP routes withdrawn. Tunnels spike. Dunbar mobilization shift.',
    equations: ['EQ.19','EQ.2'],
    overrides: { '_internet_censorship': 0.95, 'social.press_freedom_rank': 165, '_media_salience_norm': 0.3 },
  },
  {
    id: 'BANK_RUN',
    label: 'Banking System Stress',
    domain: 'SYSTEM',
    magnitude: 0.80,
    decay: 14,
    description: 'Queues at ATMs in Tunis and Sfax. STB liquidity rumours spreading.',
    equations: ['EQ.1','EQ.13','EQ.15'],
    overrides: { 'economy.banking_stress': 0.85, 'economy.fx_reserves': 58, '_media_salience_norm': 0.88 },
    blackSwan: true,
  },
  {
    id: 'DISINFORMATION_CAMPAIGN',
    label: 'Coordinated Disinfo Op',
    domain: 'SYSTEM',
    magnitude: 0.50,
    decay: 7,
    description: 'NATO StratCom-confirmed IO: fabricated presidential health crisis.',
    equations: ['EQ.19','EQ.2','EQ.3'],
    overrides: { '_cogwar_epsilon_magnitude': 0.7, '_cogwar_salience_nudge': 0.25, '_media_salience_norm': 0.82 },
  },
];

// ── Adjacency for propagation preview ─────────────────────────
const ADJ = govData.adjacency_graph as Record<string, string[]>;

// ── Helpers ────────────────────────────────────────────────────
const rriColor = (v: number) =>
  v >= 2.5 ? '#ff2d55' : v >= 2.0 ? '#d68910' : v >= 1.5 ? '#00f2ff' : '#30d158';

const deltaColor = (d: number) => d > 0.05 ? '#ff2d55' : d > 0 ? '#d68910' : '#30d158';
const sign = (n: number) => n >= 0 ? '+' : '';

function phaseColor(phase: string): string {
  const map: Record<string, string> = {
    accumulation: '#00f2ff', stagnation: '#64748b', suppression: '#ef4444',
    fracture: '#d68910', ignition: '#ff6b35', cascade: '#dc2626', exhaustion: '#475569',
  };
  return map[phase] ?? '#64748b';
}

// Simple local phase classifier mirroring state_machine.py
function localClassifyPhase(rri: number, cascadeP: number, eliteCohesion: number, velocity: number): string {
  if (rri >= 3.0 && cascadeP >= 0.75) return 'cascade';
  if (rri >= 2.8 && velocity > 0.15) return 'ignition';
  if (eliteCohesion < 0.40 && rri >= 2.4) return 'fracture';
  if (cascadeP >= 0.60 && rri >= 2.2) return 'suppression';
  if (rri >= 2.0) return 'stagnation';
  if (rri >= 1.5) return 'accumulation';
  return 'exhaustion';
}

// ── Component ──────────────────────────────────────────────────
const ScenarioSandbox: React.FC = () => {
  const { rriState, injectShock, clearShocks, activeSignals } = usePipeline();

  const baseline = useRef({
    rri:      rriState?.rri ?? 2.31,
    pRev:     rriState?.p_rev ?? 0.64,
    cascade:  rriState?.cascade_probability ?? 0.58,
    cohesion: rriState?.elite_cohesion_dynamics ?? 0.65,
    velocity: rriState?.velocity ?? 0.18,
  });

  // Update baseline once on mount only
  useEffect(() => {
    baseline.current = {
      rri:      rriState?.rri ?? 2.31,
      pRev:     rriState?.p_rev ?? 0.64,
      cascade:  rriState?.cascade_probability ?? 0.58,
      cohesion: rriState?.elite_cohesion_dynamics ?? 0.65,
      velocity: rriState?.velocity ?? 0.18,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedDomain, setSelectedDomain]   = useState<string>('ALL');
  const [showBlackSwan, setShowBlackSwan]      = useState(false);
  const [selectedShock, setSelectedShock]      = useState<ShockTemplate | null>(null);
  const [injectedIds, setInjectedIds]          = useState<Set<string>>(new Set());
  const [propagOrigin, setPropagOrigin]        = useState('kasserine');
  const [propResult, setPropResult]            = useState<any>(null);
  const [activeTab, setActiveTab]              = useState<'library'|'active'|'propagation'>('library');
  const [flashRRI, setFlashRRI]                = useState(false);

  useEffect(() => { injectCSS(); }, []);

  // Current live deltas vs baseline
  const liveRRI      = rriState?.rri ?? 2.31;
  const livePRev     = rriState?.p_rev ?? 0.64;
  const liveCascade  = rriState?.cascade_probability ?? 0.58;
  const liveCohesion = rriState?.elite_cohesion_dynamics ?? 0.65;
  const liveVelocity = rriState?.velocity ?? 0.18;

  const dRRI     = liveRRI - baseline.current.rri;
  const dPRev    = livePRev - baseline.current.pRev;
  const dCascade = liveCascade - baseline.current.cascade;

  const currentPhase = localClassifyPhase(liveRRI, liveCascade, liveCohesion, liveVelocity);

  // Flash on RRI change
  useEffect(() => {
    setFlashRRI(true);
    const t = setTimeout(() => setFlashRRI(false), 600);
    return () => clearTimeout(t);
  }, [liveRRI]);

  // Propagation simulation
  const runPropagation = useCallback(() => {
    const govs = govData.governorates as any[];
    const origin = govs.find(g => g.id === propagOrigin);
    if (!origin) return;
    const result = simulatePropagation(
      propagOrigin, origin.name?.en || propagOrigin,
      ADJ, govs, liveCascade, 30,
    );
    setPropResult(result);
  }, [propagOrigin, liveCascade]);

  useEffect(() => { if (activeTab === 'propagation') runPropagation(); }, [activeTab, runPropagation]);

  const fireShock = (tpl: ShockTemplate) => {
    const shock: ShockSignal = {
      id: tpl.id,
      type: tpl.domain as any,
      source: 'Scenario Sandbox',
      intensity: tpl.magnitude,
      message: tpl.description,
      timestamp: Date.now(),
      overrides: tpl.overrides,
      affectedEquations: tpl.equations,
    };
    injectShock(shock);
    setInjectedIds(prev => new Set([...prev, tpl.id]));
    setFlashRRI(true);
  };

  const filteredShocks = SHOCKS.filter(s => {
    if (showBlackSwan) return s.blackSwan;
    if (selectedDomain !== 'ALL') return s.domain === selectedDomain && !s.blackSwan;
    return !s.blackSwan;
  });

  const domains = ['ALL', 'ECON', 'SOCIAL', 'POLITICAL', 'SEC', 'AGRI', 'CLIMATE', 'SYSTEM'];

  return (
    <div style={{
      width:'100%', height:'100%', background:'#040609',
      display:'flex', flexDirection:'column', overflow:'hidden',
      fontFamily:'"IBM Plex Mono","Courier New",monospace', color:'#e2e8f0',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        height:52, flexShrink:0, background:'rgba(4,6,9,0.75)',
        borderBottom:'1px solid rgba(0,180,180,0.28)',
        display:'flex', alignItems:'center', padding:'0 20px', gap:28,
        backdropFilter:'blur(12px)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{
            width:8,height:8,borderRadius:'50%',background:'#00f2ff',
            boxShadow:'0 0 10px #00f2ff', animation:'ssv-pulse 2s infinite',
          }}/>
          <span style={{fontSize:11,letterSpacing:3,color:'rgba(0,200,200,0.6)',fontWeight:600}}>SCENARIO SANDBOX</span>
          <span style={{fontSize:10,color:'rgba(0,242,255,0.5)',letterSpacing:2}}>EQ.13</span>
        </div>

        {/* Live metrics strip */}
        <div style={{display:'flex',gap:20}}>
          {/* RRI */}
          <div style={{
            display:'flex',alignItems:'baseline',gap:5,
            background:flashRRI?'rgba(255,45,85,0.08)':'transparent',
            padding:'2px 8px',borderRadius:4,
            transition:'background .3s',
          }}>
            <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>RRI</span>
            <span style={{fontSize:15,color:rriColor(liveRRI),fontWeight:700,textShadow:`0 0 12px ${rriColor(liveRRI)}55`}}>
              {liveRRI.toFixed(2)}
            </span>
            {Math.abs(dRRI) > 0.01 && (
              <span style={{fontSize:10,color:deltaColor(dRRI),fontWeight:600}}>
                {sign(dRRI)}{dRRI.toFixed(2)}
              </span>
            )}
          </div>

          {/* P(Rev) */}
          <div style={{display:'flex',alignItems:'baseline',gap:5}}>
            <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>P(REV)</span>
            <span style={{fontSize:13,color:'#d68910',fontWeight:700}}>
              {(livePRev*100).toFixed(1)}%
            </span>
            {Math.abs(dPRev) > 0.005 && (
              <span style={{fontSize:10,color:deltaColor(dPRev)}}>{sign(dPRev*100)}{(dPRev*100).toFixed(1)}%</span>
            )}
          </div>

          {/* Cascade */}
          <div style={{display:'flex',alignItems:'baseline',gap:5}}>
            <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>CASCADE</span>
            <span style={{fontSize:13,color:'#00f2ff',fontWeight:700}}>
              {(liveCascade*100).toFixed(0)}%
            </span>
            {Math.abs(dCascade) > 0.005 && (
              <span style={{fontSize:10,color:deltaColor(dCascade)}}>{sign(dCascade*100)}{(dCascade*100).toFixed(0)}%</span>
            )}
          </div>

          {/* Phase */}
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>PHASE</span>
            <span style={{
              fontSize:10,fontWeight:700,letterSpacing:1,
              color:phaseColor(currentPhase),
              textShadow:`0 0 10px ${phaseColor(currentPhase)}66`,
            }}>
              {currentPhase.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Active shock count */}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12}}>
          {injectedIds.size > 0 && (
            <div style={{
              background:'rgba(255,45,85,0.12)',border:'1px solid rgba(255,45,85,0.3)',
              borderRadius:4,padding:'3px 10px',fontSize:10,color:'#ff6b8a',
            }}>
              {injectedIds.size} SHOCK{injectedIds.size>1?'S':''} ACTIVE
            </div>
          )}
          <button onClick={()=>{setInjectedIds(new Set()); clearShocks();}} style={{
            background:'transparent',border:'1px solid rgba(0,180,180,0.28)',
            color:'rgba(148,163,184,0.35)',padding:'3px 10px',borderRadius:3,cursor:'pointer',fontSize:9,letterSpacing:1,
          }}>RESET</button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{
        height:38, flexShrink:0,
        background:'rgba(4,6,9,0.85)',
        borderBottom:'1px solid rgba(0,180,180,0.28)',
        display:'flex', alignItems:'stretch',
      }}>
        {([
          {id:'library',    label:'SHOCK LIBRARY'},
          {id:'active',     label:`ACTIVE  (${activeSignals?.length??0})`},
          {id:'propagation',label:'PROPAGATION PREVIEW'},
        ] as const).map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            background:'transparent',
            borderBottom:activeTab===t.id?'2px solid #00f2ff':'2px solid transparent',
            borderTop:'none',borderLeft:'none',borderRight:'none',
            color:activeTab===t.id?'#00f2ff':'rgba(148,163,184,0.35)',
            padding:'0 20px',fontSize:10,letterSpacing:2,cursor:'pointer',
            transition:'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ══ SHOCK LIBRARY ══════════════════════════════════════ */}
        {activeTab==='library'&&(
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>

            {/* Left: filters + grid */}
            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>

              {/* Domain filter bar */}
              <div style={{
                padding:'10px 16px',flexShrink:0,
                display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',
                borderBottom:'1px solid rgba(0,180,180,0.28)',
              }}>
                {domains.map(d=>(
                  <button key={d} onClick={()=>{setSelectedDomain(d);setShowBlackSwan(false);}} style={{
                    background:selectedDomain===d&&!showBlackSwan?`${DOMAIN_COLOR[d]??'rgba(0,242,255,1)'}18`:'transparent',
                    border:`1px solid ${selectedDomain===d&&!showBlackSwan?(DOMAIN_COLOR[d]??'#00f2ff'):'rgba(0,180,180,0.28)'}`,
                    color:selectedDomain===d&&!showBlackSwan?(DOMAIN_COLOR[d]??'#00f2ff'):'rgba(148,163,184,0.35)',
                    padding:'3px 10px',borderRadius:3,cursor:'pointer',fontSize:9,letterSpacing:1,
                  }}>
                    {d==='ALL'?'ALL DOMAINS':d}
                  </button>
                ))}
                <button onClick={()=>{setShowBlackSwan(!showBlackSwan);setSelectedDomain('ALL');}} style={{
                  background:showBlackSwan?'rgba(220,38,38,0.15)':'transparent',
                  border:`1px solid ${showBlackSwan?'rgba(220,38,38,0.5)':'rgba(0,180,180,0.28)'}`,
                  color:showBlackSwan?'#ef4444':'rgba(148,163,184,0.35)',
                  padding:'3px 12px',borderRadius:3,cursor:'pointer',fontSize:9,letterSpacing:1,
                  marginLeft:'auto',
                }}>
                  ◼ BLACK SWAN
                </button>
              </div>

              {/* Shock grid */}
              <div style={{
                flex:1,overflowY:'auto',padding:'16px',
                display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
                gap:12,alignContent:'start',
              }}>
                {filteredShocks.map(shock=>{
                  const col   = DOMAIN_COLOR[shock.domain];
                  const fired = injectedIds.has(shock.id);
                  const active= activeSignals?.some((s:any)=>s.id===shock.id);
                  return (
                    <div key={shock.id}
                      onClick={()=>setSelectedShock(selectedShock?.id===shock.id?null:shock)}
                      style={{
                        background: selectedShock?.id===shock.id
                          ? `rgba(${shock.blackSwan?'220,38,38':'0,242,255'},0.12)`
                          : 'rgba(4,6,9,0.8)',
                        border:`1px solid ${selectedShock?.id===shock.id?col:'rgba(0,180,180,0.28)'}`,
                        borderRadius:6,padding:'14px 16px',cursor:'pointer',
                        transition:'all .2s',
                        boxShadow:active?`0 0 20px ${col}22`:'none',
                        animation:active?`ssv-glow 2s ease-in-out infinite`:'none',
                        '--c':col,
                      } as any}
                    >
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                        <div>
                          {shock.blackSwan&&(
                            <span style={{fontSize:8,color:'#ef4444',letterSpacing:2,display:'block',marginBottom:3}}>
                              ◼ BLACK SWAN
                            </span>
                          )}
                          <div style={{fontSize:12,fontWeight:700,color:'#e2e8f0',marginBottom:3}}>
                            {shock.label}
                          </div>
                          <div style={{
                            fontSize:9,color:col,letterSpacing:1,
                            display:'inline-block',border:`1px solid ${col}44`,
                            borderRadius:2,padding:'1px 5px',
                          }}>
                            {shock.domain}
                          </div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
                          {/* Magnitude bar */}
                          <div style={{fontSize:8,color:'rgba(148,163,184,0.35)',marginBottom:4}}>ε(t)</div>
                          <div style={{width:60,height:4,background:'rgba(0,180,180,0.15)',borderRadius:2,overflow:'hidden'}}>
                            <div style={{
                              width:`${shock.magnitude*100}%`,height:'100%',
                              background:`linear-gradient(90deg,${col}88,${col})`,
                              borderRadius:2,
                            }}/>
                          </div>
                          <div style={{fontSize:10,color:col,fontWeight:700,marginTop:2}}>
                            {(shock.magnitude*100).toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div style={{fontSize:10,color:'rgba(148,163,184,0.35)',lineHeight:1.5,marginBottom:10}}>
                        {shock.description}
                      </div>

                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{fontSize:9,color:'rgba(148,163,184,0.35)'}}>
                          {shock.equations.join(' · ')} · T½={shock.decay}d
                        </div>
                        {active ? (
                          <div style={{
                            fontSize:9,color:col,border:`1px solid ${col}44`,
                            borderRadius:3,padding:'3px 8px',letterSpacing:1,
                          }}>ACTIVE</div>
                        ) : (
                          <button
                            onClick={e=>{e.stopPropagation();fireShock(shock);}}
                            style={{
                              background:`${col}18`,border:`1px solid ${col}55`,
                              color:col,padding:'4px 12px',borderRadius:3,
                              cursor:'pointer',fontSize:10,letterSpacing:1,fontWeight:600,
                              transition:'all .15s',
                            }}
                          >
                            ▶ INJECT
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: shock detail panel */}
            {selectedShock&&(
              <div style={{
                width:300,flexShrink:0,
                borderLeft:'1px solid rgba(0,180,180,0.28)',
                background:'rgba(4,6,9,0.9)',
                padding:'20px 18px',overflowY:'auto',
                animation:'ssv-slide .2s ease-out',
              }}>
                <div style={{
                  fontSize:9,color:DOMAIN_COLOR[selectedShock.domain],
                  letterSpacing:2,marginBottom:6,
                }}>
                  {selectedShock.domain} {selectedShock.blackSwan?'· ◼ BLACK SWAN':''}
                </div>
                <div style={{fontSize:16,fontWeight:700,color:'#e2e8f0',marginBottom:12,lineHeight:1.3}}>
                  {selectedShock.label}
                </div>
                <div style={{fontSize:11,color:'rgba(148,163,184,0.35)',lineHeight:1.6,marginBottom:20}}>
                  {selectedShock.description}
                </div>

                {/* Magnitude gauge */}
                <div style={{marginBottom:16}}>
                  <div style={{
                    display:'flex',justifyContent:'space-between',
                    fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1,marginBottom:6,
                  }}>
                    <span>SHOCK MAGNITUDE ε(t)</span>
                    <span style={{color:DOMAIN_COLOR[selectedShock.domain],fontWeight:700}}>
                      {(selectedShock.magnitude*100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{height:6,background:'rgba(0,180,180,0.15)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{
                      width:`${selectedShock.magnitude*100}%`,height:'100%',
                      background:`linear-gradient(90deg,${DOMAIN_COLOR[selectedShock.domain]}88,${DOMAIN_COLOR[selectedShock.domain]})`,
                    }}/>
                  </div>
                </div>

                {/* Half-life */}
                <div style={{
                  display:'flex',justifyContent:'space-between',
                  marginBottom:6,fontSize:10,
                }}>
                  <span style={{color:'#3a4a5a'}}>DECAY HALF-LIFE</span>
                  <span style={{color:'#8899bb'}}>{selectedShock.decay} days</span>
                </div>

                {/* Equations */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:1,marginBottom:8}}>AFFECTED EQUATIONS</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {selectedShock.equations.map(eq=>(
                      <span key={eq} style={{
                        fontSize:9,color:'#a78bfa',
                        border:'1px solid rgba(167,139,250,0.3)',
                        borderRadius:3,padding:'2px 8px',
                      }}>{eq}</span>
                    ))}
                  </div>
                </div>

                {/* Override preview */}
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:1,marginBottom:8}}>VARIABLE OVERRIDES</div>
                  {Object.entries(selectedShock.overrides).map(([k,v])=>(
                    <div key={k} style={{
                      display:'flex',justifyContent:'space-between',
                      marginBottom:5,borderBottom:'1px solid rgba(255,255,255,0.03)',paddingBottom:5,
                    }}>
                      <span style={{fontSize:9,color:'#3a4a5a',maxWidth:170,overflow:'hidden',textOverflow:'ellipsis'}}>
                        {k}
                      </span>
                      <span style={{fontSize:9,color:'#8899bb',fontWeight:600}}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Inject button */}
                <button
                  onClick={()=>fireShock(selectedShock)}
                  style={{
                    width:'100%',
                    background: injectedIds.has(selectedShock.id)
                      ? `rgba(48,209,88,0.1)` : `${DOMAIN_COLOR[selectedShock.domain]}18`,
                    border:`1px solid ${injectedIds.has(selectedShock.id)?'#30d158':DOMAIN_COLOR[selectedShock.domain]}`,
                    color: injectedIds.has(selectedShock.id)?'#30d158':DOMAIN_COLOR[selectedShock.domain],
                    padding:'10px',borderRadius:4,cursor:'pointer',
                    fontSize:11,fontWeight:700,letterSpacing:2,
                    transition:'all .2s',
                  }}
                >
                  {injectedIds.has(selectedShock.id) ? '✓ INJECTED' : '▶ INJECT SHOCK'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ ACTIVE SIGNALS ═════════════════════════════════════ */}
        {activeTab==='active'&&(
          <div style={{flex:1,padding:'24px',overflowY:'auto'}}>
            {(!activeSignals||activeSignals.length===0) ? (
              <div style={{
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                height:'60%',gap:16,
              }}>
                <div style={{fontSize:48,opacity:0.1}}>⚡</div>
                <div style={{fontSize:12,color:'#2a3a4a',letterSpacing:2}}>NO ACTIVE SHOCKS</div>
                <div style={{fontSize:10,color:'#1a2a3a'}}>Inject scenarios from the library to begin</div>
              </div>
            ) : (
              <>
                <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:20}}>
                  ACTIVE SHOCK STACK — {activeSignals.length} SIGNAL{activeSignals.length>1?'S':''}
                </div>

                {/* Compound effect bar */}
                <div style={{
                  background:'rgba(0,4,12,0.8)',
                  border:'1px solid rgba(255,45,85,0.2)',
                  borderRadius:6,padding:'16px 20px',marginBottom:24,
                }}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:12}}>
                    COMPOUND RRI IMPACT
                  </div>
                  <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                    {[
                      {l:'BASELINE RRI', v:baseline.current.rri.toFixed(2), c:'#64748b'},
                      {l:'CURRENT RRI',  v:liveRRI.toFixed(2), c:rriColor(liveRRI)},
                      {l:'DELTA',        v:`${sign(dRRI)}${dRRI.toFixed(3)}`, c:deltaColor(dRRI)},
                      {l:'P(REV) SHIFT', v:`${sign(dPRev*100)}${(dPRev*100).toFixed(1)}%`, c:deltaColor(dPRev)},
                      {l:'CASCADE SHIFT',v:`${sign(dCascade*100)}${(dCascade*100).toFixed(0)}%`, c:deltaColor(dCascade)},
                    ].map(m=>(
                      <div key={m.l} style={{
                        background:'rgba(255,255,255,0.03)',borderRadius:4,
                        padding:'10px 14px',minWidth:100,
                      }}>
                        <div style={{fontSize:8,color:'#3a4a5a',letterSpacing:1,marginBottom:6}}>{m.l}</div>
                        <div style={{fontSize:16,color:m.c,fontWeight:700}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signal list */}
                {(activeSignals as ShockSignal[]).map(sig=>{
                  const tpl = SHOCKS.find(s=>s.id===sig.id);
                  const col = DOMAIN_COLOR[sig.type]??'#64748b';
                  return (
                    <div key={sig.id} style={{
                      background:'rgba(0,4,12,0.8)',
                      border:`1px solid ${col}33`,
                      borderRadius:6,padding:'14px 18px',marginBottom:12,
                      animation:'ssv-slide .2s ease-out',
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                        <div>
                          <div style={{fontSize:9,color:col,letterSpacing:1,marginBottom:4}}>{sig.type}</div>
                          <div style={{fontSize:13,fontWeight:700,color:'#e2e8f0'}}>{tpl?.label??sig.id}</div>
                        </div>
                        <div style={{
                          fontSize:14,fontWeight:700,color:col,
                          border:`1px solid ${col}33`,borderRadius:4,
                          padding:'4px 10px',
                        }}>
                          ε={( sig.intensity*100).toFixed(0)}%
                        </div>
                      </div>
                      <div style={{fontSize:10,color:'#4a5a6a',marginBottom:10}}>{sig.message}</div>

                      {/* Override bars */}
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {Object.entries(sig.overrides).slice(0,6).map(([k,v])=>(
                          <div key={k} style={{
                            background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',
                            borderRadius:3,padding:'3px 8px',fontSize:9,
                          }}>
                            <span style={{color:'#3a4a5a'}}>{k.split('.').pop()}</span>
                            <span style={{color:col,marginLeft:6,fontWeight:600}}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {tpl&&(
                        <div style={{marginTop:8,fontSize:8,color:'#2a3a4a'}}>
                          {tpl.equations.join(' · ')} · T½={tpl.decay}d
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ══ PROPAGATION PREVIEW ════════════════════════════════ */}
        {activeTab==='propagation'&&(
          <div style={{flex:1,display:'flex',overflow:'hidden'}}>
            <div style={{flex:1,padding:'24px',overflowY:'auto'}}>
              <div style={{
                display:'flex',alignItems:'center',gap:16,marginBottom:20,
              }}>
                <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2}}>ORIGIN</div>
                <select value={propagOrigin} onChange={e=>{setPropagOrigin(e.target.value);}} style={{
                  background:'rgba(8,16,30,0.9)',border:'1px solid rgba(167,139,250,0.3)',
                  color:'#a78bfa',padding:'3px 8px',borderRadius:3,fontSize:11,cursor:'pointer',outline:'none',
                }}>
                  {(govData.governorates as any[])
                    .sort((a,b)=>(a.name?.en||a.id).localeCompare(b.name?.en||b.id))
                    .map(g=>(
                      <option key={g.id} value={g.id}>{g.name?.en||g.id}</option>
                    ))}
                </select>
                <button onClick={runPropagation} style={{
                  background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.3)',
                  color:'#a78bfa',padding:'4px 14px',borderRadius:3,cursor:'pointer',fontSize:10,
                }}>▶ RUN</button>

                {/* Context */}
                <div style={{marginLeft:'auto',fontSize:10,color:'#4a5a6a'}}>
                  Live cascade P: <span style={{color:'#a78bfa',fontWeight:700}}>{(liveCascade*100).toFixed(0)}%</span>
                  {activeSignals&&activeSignals.length>0&&(
                    <span style={{color:'#ff6b8a',marginLeft:8}}>
                      +{activeSignals.length} shocks active
                    </span>
                  )}
                </div>
              </div>

              {propResult&&(()=>{
                const nodes   = Object.values(propResult.nodes) as any[];
                const reached = nodes.filter(n=>n.status!=='unreachable');
                const high    = nodes.filter(n=>n.status==='high');
                const seq     = [...reached].sort((a,b)=>a.expectedDays-b.expectedDays);

                return (
                  <>
                    {/* Summary cards */}
                    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
                      {[
                        {l:'ORIGIN',    v:propResult.originName.toUpperCase(), c:'#ff2d55'},
                        {l:'REACHED',   v:`${reached.length}/24`,               c:'#30d158'},
                        {l:'HIGH RISK', v:String(high.length),                  c:'#ff6b35'},
                        {l:'CASCADE P', v:`${(propResult.cascadeProbability*100).toFixed(0)}%`, c:'#a78bfa'},
                        {l:'PEAK SIR I',v:`${(Math.max(...propResult.sirData.map((p:any)=>p.I))*100).toFixed(1)}%`, c:'#ef4444'},
                      ].map(m=>(
                        <div key={m.l} style={{
                          background:'rgba(0,4,12,0.8)',
                          border:`1px solid ${m.c}22`,borderRadius:6,
                          padding:'12px 16px',minWidth:100,
                        }}>
                          <div style={{fontSize:8,color:'#3a4a5a',letterSpacing:1,marginBottom:6}}>{m.l}</div>
                          <div style={{fontSize:16,color:m.c,fontWeight:700}}>{m.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Spread sequence */}
                    <div style={{
                      background:'rgba(0,4,12,0.8)',
                      border:'1px solid rgba(255,255,255,0.05)',
                      borderRadius:6,padding:'16px 20px',marginBottom:20,
                    }}>
                      <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:14}}>
                        PROPAGATION SEQUENCE
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {seq.map((n,i)=>{
                          const statusCol = n.status==='high'?'#ff6b35':n.status==='medium'?'#ffd60a':n.status==='origin'?'#ff2d55':'#30d158';
                          const pct = Math.round(n.probability*100);
                          return (
                            <div key={n.governorateId} style={{display:'flex',alignItems:'center',gap:10}}>
                              <span style={{fontSize:9,color:'#2a3a4a',width:18,textAlign:'right'}}>
                                {String(i+1).padStart(2,'0')}
                              </span>
                              <div style={{width:4,height:4,borderRadius:'50%',background:statusCol,flexShrink:0}}/>
                              <span style={{fontSize:10,color:'#5a6a7a',width:130}}>{n.governorateName}</span>
                              <div style={{flex:1,height:3,background:'rgba(255,255,255,0.05)',borderRadius:2,overflow:'hidden'}}>
                                <div style={{
                                  width:`${pct}%`,height:'100%',
                                  background:statusCol,
                                  transition:'width .6s ease-out',
                                }}/>
                              </div>
                              <span style={{fontSize:9,color:statusCol,width:30,textAlign:'right'}}>{pct}%</span>
                              <span style={{fontSize:9,color:'#ff9f0a',width:28,textAlign:'right'}}>D{n.expectedDays}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Historical comparison */}
                    {propResult.historicalMatch&&(
                      <div style={{
                        background:'rgba(255,45,85,0.06)',
                        border:'1px solid rgba(255,45,85,0.2)',
                        borderRadius:6,padding:'14px 18px',
                      }}>
                        <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:8}}>HISTORICAL ANALOG</div>
                        <div style={{fontSize:12,color:'#ff6b8a',fontWeight:600,marginBottom:4}}>
                          {propResult.historicalMatch.wave?.name??'2010 Revolution Pattern'}
                        </div>
                        <div style={{fontSize:10,color:'#4a5568'}}>
                          {propResult.historicalMatch.wave?.outcome}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioSandbox;
