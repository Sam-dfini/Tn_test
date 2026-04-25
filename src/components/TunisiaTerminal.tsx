/**
 * TunisiaTerminal.tsx — Tunisia Intelligence & Strategy Terminal
 * Visual design: Fincept Terminal (bloomberg-style)
 * 
 * Objectives: 
 * - Macroeconomic Pulse (Economy, Bourse, Energy)
 * - Geopolitical Risk (RRI Engine, Strategic Indicators)
 * - Social Stability (Governorate Heatmap, Cascades)
 * - Intelligence Flow (Economic & International Signals)
 */

import React, { useState } from 'react';
import { usePipeline } from '../context/PipelineContext';
import { useRSS } from '../context/RSSContext';
import { prepareList, assertKey, getRenderKey } from '../lib/keyUtils';

// ── Design System ──────────────────────────────────────────────────────────
const C = {
  bg:      '#0a0a0a',
  panel:   '#0f0f0f',
  panel2:  '#111111',
  border:  '#1e1e1e',
  accent:  '#ff6b00',
  cyan:    '#00d4ff',
  pos:     '#00cc66',
  neg:     '#ff4444',
  warn:    '#ffaa00',
  dim:     '#555555',
  white:   '#e8e8e8',
  muted:   '#888888',
};

const S: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed', inset: 0,
    background: C.bg,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.white,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: '0.08em',
    padding: '3px 8px', borderBottom: `1px solid ${C.border}`, background: C.panel2,
    display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' as const,
  },
  tableRow: {
    display: 'grid', padding: '4px 8px', borderBottom: `1px solid ${C.border}`,
    alignItems: 'center', fontSize: 10,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────
const riskBg = (score: number) => score >= 0.75 ? '#5a0000' : score >= 0.60 ? '#5a2800' : score >= 0.45 ? '#4a3800' : '#002010';
const riskFg = (score: number) => score >= 0.75 ? '#ff4444' : score >= 0.60 ? '#ff8800' : score >= 0.45 ? '#ffcc00' : '#00cc66';

// ── Layout Components ──────────────────────────────────────────────────────

const MenuBar = () => (
  <div style={{ height: '3.2vh', minHeight: 26, background: '#000', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0 }}>
    <div style={{ display: 'flex', gap: 16 }}>
       <span style={{ color: C.accent, fontWeight: 700, fontSize: '1.2vh' }}>TUNISIAINTEL</span>
       <span style={{ color: C.dim, fontSize: '1vh' }}>TERMINAL: STRATEGIC_V1.4</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1vh' }}>
       <span style={{ color: C.pos }}>● CONNECTION: ULTRA_LOW_LATENCY</span>
       <span style={{ border: `1px solid ${C.dim}`, padding: '0 4px', color: C.white }}>SECURE_CORE</span>
    </div>
  </div>
);

const Ticker = ({ rriState, econ }: any) => {
  const items = [
    { n: 'R(t)', v: (rriState?.rri ?? 2.45).toFixed(3), c: C.neg },
    { n: 'P_REV', v: `${((rriState?.p_rev ?? 0.64) * 100).toFixed(1)}%`, c: C.warn },
    { n: 'TND/USD', v: (econ?.tnd_usd ?? 3.118).toFixed(4), c: C.pos },
    { n: 'BRENT', v: '$72.41', c: C.warn },
    { n: 'FX_COV', v: `${econ?.fx_reserves ?? 112}d`, c: (econ?.fx_reserves ?? 112) > 90 ? C.pos : C.neg },
    { n: 'TUNINDEX', v: '9120.4', c: C.pos },
  ];
  return (
    <div style={{ height: '2.8vh', minHeight: 22, background: '#050505', borderBottom: `1px solid ${C.border}`, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', whiteSpace: 'nowrap', animation: 'tick-scroll 30s linear infinite' }}>
        {prepareList([...items, ...items, ...items]).map((it: any, i: number) => (
          <span key={assertKey(getRenderKey(it, i, 'term-tick'))} style={{ padding: '0 15px', borderRight: `1px solid ${C.border}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.9vh', color: C.dim }}>{it.n}</span>
            <span style={{ color: it.c, fontWeight: 700, fontSize: '1vh' }}>{it.v}</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes tick-scroll { from{transform:translateX(0)} to{transform:translateX(-33.33%)} }`}</style>
    </div>
  );
};

// ── Widget Panels ──────────────────────────────────────────────────────────

const RRIEnginePanel: React.FC<{ rriState: any }> = ({ rriState }) => {
  const rri = rriState?.rri ?? 2.4512;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={S.sectionTitle}>| RRI ENGINE HUB (EQ.11)</div>
      <div style={{ padding: 14, textAlign: 'center', background: rri > 2.3 ? '#200' : '#012', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, color: C.dim }}>REGIME RISK INDEX R(t)</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: rri > 2.3 ? C.neg : C.pos }}>{rri.toFixed(4)}</div>
        <div style={{ fontSize: 9, color: rri > 2.3 ? C.neg : C.pos, marginTop: 4 }}>[ {rri > 2.3 ? 'CRITICAL ALERT' : 'SYSTEM STABLE'} ]</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {prepareList([
          { lbl: 'SAL(S) SALIENCE', val: (rriState?.salience ?? 0.412).toFixed(4), c: C.cyan },
          { lbl: 'WAR(W) DISTRAC', val: (rriState?.w_t ?? 0.72).toFixed(4), c: C.warn },
          { lbl: 'VEL(V) VELOCITY', val: (rriState?.velocity ?? 0.18).toFixed(4), c: C.neg },
          { lbl: 'AMP(A) INFOAMP', val: (rriState?.info_amplification ?? 0.35).toFixed(4), c: C.pos },
          { lbl: 'COH(K) ELIDYN.', val: (rriState?.elite_cohesion ?? 0.55).toFixed(4), c: C.pos },
        ]).map((r: any, i: number) => (
          <div key={assertKey(getRenderKey(r, i, 'term-rrimet'))} style={{ ...S.tableRow, gridTemplateColumns: '1fr 65px' }}>
            <span style={{ color: C.muted }}>{r.lbl}</span>
            <span style={{ textAlign: 'right', color: r.c, fontWeight: 700 }}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BourseTracker: React.FC = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={S.sectionTitle}>| TUNINDEX & BOURSE FLOW</div>
    <div style={{ flex: 1, overflowY: 'auto' }}>
       {prepareList([
         { ticker: 'TUNINDEX', val: '9120.40', chg: '+0.12%', c: C.pos },
         { ticker: 'SFBT', val: '12.420', chg: '+0.05%', c: C.pos },
         { ticker: 'BIAT', val: '104.500', chg: '-0.12%', c: C.neg },
         { ticker: 'BANQUE DE TUN.', val: '4.850', chg: '0.00%', c: C.dim },
         { ticker: 'POULINA GP', val: '7.200', chg: '-0.33%', c: C.neg },
         { ticker: 'CARTHAGE CEM.', val: '1.920', chg: '+1.05%', c: C.pos },
         { ticker: 'SAH LILAS', val: '8.400', chg: '-0.12%', c: C.neg },
       ]).map((r: any, i: number) => (
         <div key={assertKey(getRenderKey(r, i, 'term-bt'))} style={{ ...S.tableRow, gridTemplateColumns: '1fr 60px 50px' }}>
           <span style={{ fontWeight: 700 }}>{r.ticker}</span>
           <span style={{ textAlign: 'right' }}>{r.val}</span>
           <span style={{ textAlign: 'right', color: r.c, fontSize: 9 }}>{r.chg}</span>
         </div>
       ))}
    </div>
  </div>
);

const CascadeMonitor: React.FC<{ governorates: any[] }> = ({ governorates }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <div style={S.sectionTitle}>| CASCADE MONITOR (EQ.17)</div>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, padding: 2, background: C.border }}>
                  {prepareList(governorates.slice(0, 24)).map((g: any, gi: number) => {
                    const score = g.rri_score ?? 0.5;
                    return (
                      <div key={assertKey(getRenderKey(g, gi, 'term-gtile'))} style={{ background: riskBg(score), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 2px' }}>
                        <div style={{ fontSize: 8, color: riskFg(score), opacity: 0.8 }}>{typeof g.name === 'object' ? g.name.en?.slice(0,4) : g.name?.slice(0,4)}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: riskFg(score) }}>{(score * 100).toFixed(0)}</div>
                      </div>
                    );
                  })}
    </div>
  </div>
);

const IntelFeed: React.FC<{ title: string; articles: any[]; isShock?: boolean }> = ({ title, articles, isShock }) => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={S.sectionTitle}>{title}</div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {prepareList(articles.slice(0, 15)).map((a: any, i: number) => {
          const shock = (0.01 + Math.random() * 0.04).toFixed(3);
          const tag = ['A.1', 'P.2', 'G.4', 'S.1'][Math.floor(Math.random()*4)];
          return (
            <div key={assertKey(getRenderKey(a, i, 'term-if'))} style={{ padding: '6px 10px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                {isShock && <span style={{ fontSize: 9, color: C.accent }}>[{tag}] ε(t) +{shock}</span>}
                <span style={{ fontSize: 8, color: C.dim }}>{a.source_name}</span>
              </div>
              <div style={{ fontSize: 10, color: '#e0e0e0', lineHeight: 1.3 }}>{a.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StrategicDecisionPanel: React.FC<{ rriState: any, econ: any }> = ({ rriState, econ }) => {
  const p_rev = (rriState?.p_rev ?? 0.643) * 100;
  const cs_t = (rriState?.compound_stress ?? 0.45) * 100;
  const petrol = 2.45; // Energy driver
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Big Energy Driver Section */}
      <div style={{ padding: 18, borderBottom: `2px solid ${C.accent}`, background: '#111', textAlign: 'center' }}>
         <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em' }}>ENERGY DRIVER · PETROL (TND)</div>
         <div style={{ fontSize: 52, fontWeight: 900, color: C.warn, lineHeight: 1 }}>{petrol.toFixed(2)}</div>
         <div style={{ fontSize: 10, color: C.dim }}>TND / LITER [FIXED_RATE]</div>
         <div style={{ marginTop: 8, fontSize: 9, color: C.pos }}>▲ +0.02 BRENT_SHOCK_AMP</div>
      </div>
      
      {/* Decision Indicators */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
         <div style={{ padding: '12px 10px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.dim }}>INSTABILITY PROBABILITY (P_rev)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: p_rev > 60 ? C.neg : C.warn }}>{p_rev.toFixed(1)}%</div>
         </div>
         <div style={{ padding: '12px 10px', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: C.dim }}>SYSTEM STRESS (CS-t)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: cs_t > 40 ? C.neg : C.pos }}>{cs_t.toFixed(1)}</div>
         </div>
         
         <div style={{ padding: 10 }}>
            <div style={S.sectionTitle}>| STRATEGIC ALERTS (CRITICAL)</div>
            <div style={{ marginTop: 8, fontSize: 10 }}>
               <div style={{ color: C.neg, marginBottom: 5 }}>● FX COVER CRITICAL: {econ?.fx_reserves}d</div>
               <div style={{ color: C.neg, marginBottom: 5 }}>● DEBT DEFAULT RISK: ELEVATED</div>
               <div style={{ color: C.warn, marginBottom: 5 }}>● UGTT STRIKE SALIENCE HIGH</div>
            </div>
         </div>
      </div>
    </div>
  );
};

// ── Main Controller ────────────────────────────────────────────────────────

export const TunisiaTerminal: React.FC<{ onGoHome: () => void; governorates: any[] }> = ({ onGoHome, governorates }) => {
  const { rriState, data } = usePipeline() as any;
  const rssCtx = useRSS();
  const econ = data?.economy ?? {};

  return (
    <div style={S.root}>
      <MenuBar />
      <Ticker rriState={rriState} econ={econ} />
      
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(250px, 18vw) 1fr 1fr minmax(250px, 18vw)', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        
        {/* COL 1: Intelligence Engine & Bourse */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, minHeight: 0, minWidth: 0 }}>
           <div style={{ flex: '0 0 35%', borderBottom: `1px solid ${C.border}`, minHeight: 0 }}><RRIEnginePanel rriState={rriState} /></div>
           <div style={{ flex: 1, minHeight: 0 }}><BourseTracker /></div>
        </div>

        {/* COL 2: Spatial & Capital Signals */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, minHeight: 0, minWidth: 0 }}>
           <div style={{ flex: '0 0 35%', borderBottom: `1px solid ${C.border}`, minHeight: 0 }}><CascadeMonitor governorates={governorates} /></div>
           <div style={{ flex: 1, padding: '1vw', minHeight: 0, overflowY: 'auto' }}>
              <div style={S.sectionTitle}>| CAPITAL SIGNALS & MACRO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vw', marginTop: '1vw', borderBottom: `1px solid ${C.border}`, paddingBottom: '1vw' }}>
                <div><div style={{fontSize:9,color:C.dim}}>FDI INFLOW</div><div style={{fontSize:'clamp(14px, 1.5vw, 24px)',fontWeight:900,color:C.neg}}>0.92B</div></div>
                <div><div style={{fontSize:9,color:C.dim}}>REMITTANCES</div><div style={{fontSize:'clamp(14px, 1.5vw, 24px)',fontWeight:900,color:C.pos}}>{econ.remittances_total_bnd ?? 8.8}B</div></div>
                <div><div style={{fontSize:9,color:C.dim}}>GDP GROWTH</div><div style={{fontSize:'clamp(14px, 1.5vw, 24px)',fontWeight:900,color:C.pos}}>{econ.gdp_growth ?? 0.4}%</div></div>
                <div><div style={{fontSize:9,color:C.dim}}>INFLATION</div><div style={{fontSize:'clamp(14px, 1.5vw, 24px)',fontWeight:900,color:C.neg}}>{econ.inflation ?? 7.1}%</div></div>
              </div>
              <div style={{ marginTop: '1.5vw' }}>
                 <div style={S.sectionTitle}>| NARRATIVE CONTROL (A-t)</div>
                 <div style={{ width: '100%', height: 8, background: '#222', marginTop: 10 }}>
                    <div style={{ width: `${(rriState?.info_amplification ?? 0.35) * 100}%`, height: '100%', background: C.cyan }} />
                 </div>
                 <div style={{ marginTop: 5, fontSize: 8, color: C.dim }}>POLITICAL SALIENCE AMPLIFICATION SIGNAL</div>
              </div>
           </div>
        </div>

        {/* COL 3: Dual News Flow (Economic/International) */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, minHeight: 0, minWidth: 0 }}>
           <div style={{ flex: 1, borderBottom: `1px solid ${C.border}`, minHeight: 0 }}><IntelFeed title="| ECONOMIC SHOCK ε(t)" articles={rssCtx?.articles ?? []} isShock /></div>
           <div style={{ flex: 1, minHeight: 0 }}><IntelFeed title="| INTERNATIONAL MACRO" articles={rssCtx?.articles ?? []} /></div>
        </div>

        {/* COL 4: The Bridge (Energy & Strategy) */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
           <StrategicDecisionPanel rriState={rriState} econ={econ} />
        </div>

      </div>

      {/* Footer bar */}
      <div style={{ height: '2.5vh', minHeight: 20, background: '#000', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '0.9vh', color: C.dim, flexShrink: 0 }}>
        <span>OS: TUN_INTEL_SHELL_6.1</span>
        <span style={{ margin: '0 12px' }}>|</span>
        <span style={{ color: C.pos }}>SYSTEM_UPTIME: 100%</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 15 }}>
          <span>{new Date().toLocaleDateString()}</span>
          <span>LAST_RECALC: {new Date().toLocaleTimeString()}</span>
        </span>
      </div>
    </div>
  );
};
