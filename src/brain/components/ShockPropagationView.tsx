import React, { useState, useEffect, useCallback, useRef, useMemo, WheelEvent, MouseEvent } from 'react';
import { usePipeline } from '../../context/PipelineContext';
import {
  simulatePropagation, compareToHistorical, HISTORICAL_WAVES,
  type PropagationResult, type HistoricalWave,
} from '../../services/propagationEngine';
import govData from '../../data/governorates.json';

// ── Tunisia projection (lon/lat → SVG x/y) ────────────────────
// Map bounds: lon 7.5–11.6, lat 30.2–37.5 → viewBox 0 0 <SVG_W> 760
const SVG_W = Math.round(760 * (4.1 / 7.3) * Math.cos(33.85 * Math.PI / 180));
const PX = (lon: number) => (lon - 7.5) / (11.6 - 7.5) * SVG_W;
const PY = (lat: number) => 760 - (lat - 30.2) / (37.5 - 30.2) * 760;

function ringToPath(ring: number[][]): string {
  return ring.map((p, i) => {
    const cmd = i === 0 ? 'M' : 'L';
    return `${cmd}${PX(p[0]).toFixed(1)},${PY(p[1]).toFixed(1)}`;
  }).join('') + 'Z';
}

function featureCenter(coords: number[][][]): { cx: number; cy: number } {
  const ring = coords[0];
  let sx = 0, sy = 0;
  for (const p of ring) { sx += PX(p[0]); sy += PY(p[1]); }
  return { cx: sx / ring.length, cy: sy / ring.length };
}

async function loadGovPaths(): Promise<Record<string, { path: string; cx: number; cy: number }>> {
  const res = await fetch('/data/tunisia_governorates.geojson');
  const data = await res.json();
  const map: Record<string, { path: string; cx: number; cy: number }> = {};
  for (const feat of data.features || []) {
    const props = feat.properties;
    const name = (props.gouv_fr || props.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    const geom = feat.geometry;
    if (!geom || !geom.coordinates) continue;
    if (geom.type === 'Polygon') {
      map[name] = { path: ringToPath(geom.coordinates[0]), ...featureCenter(geom.coordinates) };
    } else if (geom.type === 'MultiPolygon') {
      // Use the largest polygon ring for the path
      let largest = geom.coordinates[0][0];
      for (const poly of geom.coordinates) {
        if (poly[0].length > largest.length) largest = poly[0];
      }
      map[name] = { path: ringToPath(largest), ...featureCenter(geom.coordinates[0]) };
    }
  }
  // Map French names to English IDs
  const idMap: Record<string, string> = {
    'tunis': 'tunis', 'ben_arous': 'ben_arous', 'ariana': 'ariana',
    'nabeul': 'nabeul', 'manouba': 'manouba', 'bizerte': 'bizerte',
    'zaghouan': 'zaghouan', 'jendouba': 'jendouba', 'beja': 'beja',
    'le_kef': 'kef', 'siliana': 'siliana', 'kairouan': 'kairouan',
    'kasserine': 'kasserine', 'sidi_bouzid': 'sidi_bouzid',
    'sousse': 'sousse', 'monastir': 'monastir', 'mahdia': 'mahdia',
    'sfax': 'sfax', 'gafsa': 'gafsa', 'tozeur': 'tozeur',
    'kebili': 'kebili', 'gabes': 'gabes', 'medenine': 'medenine',
    'tataouine': 'tataouine',
  };
  const result: Record<string, any> = {};
  for (const [french, eng] of Object.entries(idMap)) {
    if (map[french]) result[eng] = map[french];
  }
  return result;
}
const GOV_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  kasserine:   { path: "M164.8,185.0L179.0,188.8L187.4,191.7L184.0,194.0L186.3,197.7L199.1,199.2L199.6,200.2L209.6,199.2L212.1,199.9L213.2,205.6L225.5,209.0L231.3,213.3L232.4,213.3L213.1,225.2L213.9,225.7L209.4,232.8L222.1,241.4L218.8,243.9L221.5,251.0L231.0,255.4L225.4,261.4L210.8,262.8L210.4,262.8L194.9,269.1L192.1,274.3L197.1,275.8L196.0,277.6L176.0,284.6L165.4,288.1L152.3,292.4L135.2,303.6L124.7,300.7L105.3,292.2L99.1,290.8L97.0,282.8L94.4,272.9L102.1,267.3L102.6,262.2L117.9,243.6L120.7,240.3L102.3,235.1L100.5,220.4L108.9,214.7L109.9,214.0L106.2,200.7L111.4,200.4L112.5,197.5L114.6,193.8L127.6,194.1L132.6,196.3L137.3,196.3L139.8,191.1L144.3,185.5L148.2,183.3L149.4,182.6L152.7,183.6L161.1,184.0L164.8,185.0Z", cx: 163.7, cy: 234.0 },
  sidi_bouzid: { path: "M277.1,242.7L277.4,244.3L301.0,246.5L310.8,244.4L315.4,248.8L318.3,260.7L324.1,262.4L323.7,265.2L312.5,276.2L304.5,291.7L302.7,304.3L309.8,306.2L314.2,310.7L324.6,312.8L313.8,318.3L309.4,319.7L299.9,328.5L286.1,329.9L282.8,333.2L284.9,337.0L281.1,336.9L260.7,337.8L259.2,330.6L261.4,330.3L262.5,327.3L254.3,325.5L247.8,316.7L243.9,316.9L232.8,314.3L231.2,308.7L224.1,307.6L220.8,306.9L226.3,302.1L225.8,296.5L215.3,293.9L207.3,293.9L205.9,293.9L197.0,296.8L182.1,289.8L178.0,283.9L196.0,277.6L197.1,275.8L192.1,274.3L194.9,269.1L200.6,266.8L210.4,262.8L225.4,261.4L231.0,255.4L221.5,251.0L218.8,243.9L222.1,241.4L209.4,232.8L213.9,225.7L213.1,225.2L232.4,213.3L248.0,213.5L251.6,218.1L252.7,222.4L247.9,225.5L249.0,227.0L256.5,229.2L261.9,236.3L265.0,235.2L272.7,238.9L277.6,238.7L277.1,242.7Z", cx: 255.0, cy: 280.0 },
  kef:         { path: "M185.7,131.3L187.4,130.7L192.4,136.3L194.1,140.3L191.6,142.8L197.6,145.9L207.8,151.6L208.6,156.6L208.8,160.5L203.2,163.6L200.0,166.0L195.2,173.6L191.3,177.7L194.1,183.2L190.2,184.7L194.1,192.9L189.0,190.6L187.4,191.7L179.0,188.8L164.8,185.0L161.1,184.0L152.7,183.6L149.4,182.6L148.2,183.3L144.3,185.5L141.5,188.9L139.8,191.1L137.3,196.3L132.6,196.3L127.6,194.1L114.6,193.8L112.5,197.5L111.4,200.4L106.2,200.7L105.2,197.0L95.7,190.0L94.4,176.7L96.3,165.4L96.5,164.5L102.0,151.9L100.8,143.8L106.8,132.3L109.8,124.5L117.3,124.5L129.2,121.1L138.7,118.5L148.9,117.0L157.9,119.5L173.1,116.9L180.6,113.9L183.6,118.3L184.4,125.9L185.7,131.3Z", cx: 155.6, cy: 162.7 },
  siliana:     { path: "M244.0,202.5L246.3,213.5L231.3,213.3L225.5,209.0L213.2,205.6L212.1,199.9L209.6,199.2L199.6,200.2L199.1,199.2L186.3,197.7L184.0,194.0L187.4,191.7L189.0,190.6L194.1,192.9L190.2,184.7L194.1,183.2L191.3,177.7L195.2,173.6L200.0,166.0L203.2,163.6L208.8,160.5L208.6,156.6L207.8,151.6L197.6,145.9L191.6,142.8L194.1,140.3L192.4,136.3L187.4,130.7L185.7,131.3L184.4,125.9L183.6,118.3L180.6,113.9L186.1,111.7L189.9,111.7L198.5,115.5L204.1,119.8L203.3,123.1L205.8,123.5L209.8,120.9L221.6,122.2L222.5,125.0L230.3,121.7L234.3,115.0L233.9,114.0L247.6,113.3L256.5,112.5L259.4,115.8L259.3,116.4L268.4,117.1L278.0,115.3L283.5,112.3L285.4,115.3L285.9,119.6L284.1,124.6L279.0,128.1L264.3,133.6L267.1,134.7L273.2,137.8L275.9,136.6L282.3,139.8L285.3,146.1L281.3,154.1L265.8,162.5L251.7,170.2L250.1,173.2L256.4,174.7L257.8,177.6L253.0,179.3L252.1,183.7L255.8,185.2L257.0,187.5L242.9,190.7L238.4,192.2L226.7,188.8L221.2,191.4L226.1,195.7L238.3,203.8L244.0,202.5Z", cx: 227.0, cy: 156.1 },
};

const ADJ = govData.adjacency_graph as Record<string, string[]>;

// ── colour helpers ─────────────────────────────────────────────
const STATUS_COLOR: Record<string, { fill: string; stroke: string; glow: string }> = {
  origin:      { fill: 'rgba(0,242,255,0.55)',  stroke: '#00f2ff', glow: '#00f2ff' },
  high:        { fill: 'rgba(0,200,200,0.45)',  stroke: '#00c8c8', glow: '#00c8c8' },
  medium:      { fill: 'rgba(0,180,180,0.35)',  stroke: '#00b4b4', glow: '#00b4b4' },
  low:         { fill: 'rgba(0,160,160,0.20)',  stroke: '#00a0a0', glow: '#00a0a0' },
  unreachable: { fill: 'rgba(15,23,42,0.0)',    stroke: 'rgba(40,60,90,0.6)', glow: 'transparent' },
};

const rriColor = (v: number) => v >= 2.5 ? '#ff2d55' : v >= 2.0 ? '#ff9f0a' : v >= 1.5 ? '#ffd60a' : '#00f2ff';

// ── inject CSS once ────────────────────────────────────────────
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return; _cssInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes spv-scan { 0%{transform:translateY(-40px)} 100%{transform:translateY(800px)} }
    @keyframes spv-pulse { 0%{r:0;opacity:.8} 100%{r:80;opacity:0} }
    @keyframes spv-dash  { to{stroke-dashoffset:-16} }
    @keyframes spv-blink { 0%,100%{opacity:1} 50%{opacity:.4} }
  `;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────
const ShockPropagationView: React.FC = () => {
  const { rriState } = usePipeline();
  const cascadeProb = rriState?.cascade_probability ?? 0.58;
  const rri         = rriState?.rri ?? 2.31;
  const pRev        = rriState?.p_revolution ?? 0.34;

  const [originId, setOriginId]   = useState('kasserine');
  const [maxDays, setMaxDays]     = useState(30);
  const [result, setResult]       = useState<PropagationResult | null>(null);
  const [match, setMatch]         = useState<{ wave: HistoricalWave; score: number } | null>(null);
  const [animDay, setAnimDay]     = useState(0);
  const [playing, setPlaying]     = useState(false);
  const [tab, setTab]             = useState<'map' | 'sir' | 'history'>('map');
  const [hovered, setHovered]     = useState<string | null>(null);
  const [govPaths, setGovPaths]   = useState<Record<string, { path: string; cx: number; cy: number }>>(GOV_PATHS);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion) return;
    const s = document.createElement('style');
    s.id = 'spv-reduced-motion';
    s.textContent = `
      @keyframes spv-scan, spv-pulse, spv-dash, spv-blink {
        animation-play-state: paused !important;
      }
      [style*="animation"] { animation-play-state: paused !important; }
    `;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [prefersReducedMotion]);

  useEffect(() => {
    loadGovPaths().then(paths => {
      if (Object.keys(paths).length > 0) setGovPaths(paths);
    }).catch(() => {});
  }, []);

  const nodesMeta = useMemo(() => Object.fromEntries(
    (govData.governorates as any[]).map((g: any) => [
      g.id, {
        id: g.id,
        name: g.name?.en || g.id,
        cx: govPaths[g.id]?.cx ?? 260,
        cy: govPaths[g.id]?.cy ?? 380,
        riskScore: g.rri_score ?? 1.5,
        cascadeRisk: g.cascade_risk ?? 0.3,
      }
    ])
  ), [govPaths]);

  // Pan/zoom state
  const [zoom, setZoom]           = useState(1);
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [dragging, setDragging]   = useState(false);
  const dragStart                 = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const svgRef                    = useRef<SVGSVGElement>(null);

  useEffect(() => { injectCSS(); }, []);

  // Run simulation
  const runSim = useCallback(() => {
    const meta = nodesMeta[originId];
    if (!meta) return;
    const sim = simulatePropagation(
      originId, meta.name, ADJ,
      govData.governorates as any[], cascadeProb, maxDays,
    );
    (govData.governorates as any[]).forEach((g) => {
      if (!sim.nodes[g.id]) {
        sim.nodes[g.id] = {
          governorateId: g.id,
          governorateName: g.name?.en || g.id,
          probability: 0,
          expectedDays: maxDays + 1,
          path: [],
          riskScore: 0,
          status: 'unreachable',
        };
      }
    });
    setResult(sim);
    setAnimDay(0);

    let bestScore = 0, bestWave: HistoricalWave | null = null;
    for (const wave of HISTORICAL_WAVES) {
      const s = compareToHistorical(sim, wave);
      if (s > bestScore) { bestScore = s; bestWave = wave; }
    }
    if (bestWave) setMatch({ wave: bestWave, score: bestScore });
  }, [originId, maxDays, cascadeProb, nodesMeta]);

  useEffect(() => { runSim(); }, [runSim]);

  // Animation
  useEffect(() => {
    if (!playing || !result) return;
    if (animDay >= maxDays) { setPlaying(false); return; }
    const t = setTimeout(() => setAnimDay(d => d + 1), 100);
    return () => clearTimeout(t);
  }, [playing, animDay, maxDays, result]);

  const visibleIds = result
    ? new Set(
        Object.values(result.nodes)
          .filter(n => !playing || n.expectedDays <= animDay || n.status === 'origin')
          .map(n => n.governorateId)
      )
    : new Set<string>(Object.keys(nodesMeta));

  // Zoom on wheel
  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(z => Math.min(6, Math.max(0.5, z + delta * z)));
  }, []);

  // Pan
  const onMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  };
  const onMouseUp = () => setDragging(false);

  const sir = result?.sirData ?? [];
  const SW = 480, SH = 130;
  const sx = (d: number) => (d / maxDays) * SW;
  const sy = (v: number) => SH - v * SH;
  const sirPath = (k: 'S'|'I'|'R') =>
    sir.map((p,i)=>`${i===0?'M':'L'}${sx(p.day).toFixed(1)},${sy((p as any)[k]).toFixed(1)}`).join(' ');

  const highCount  = result ? Object.values(result.nodes).filter(n => n.status === 'high').length   : 0;
  const reachCount = result ? Object.values(result.nodes).filter(n => n.status !== 'unreachable').length : 0;
  const originMeta = nodesMeta[originId];

  return (
    <div style={{
      width:'100%', height:'100%', background:'#040609',
      display:'flex', flexDirection:'column', overflow:'hidden',
      fontFamily:'"IBM Plex Mono","Courier New",monospace', color:'#e2e8f0',
    }}>

      {/* TOP BAR */}
      <div style={{
        height:44, flexShrink:0, background:'rgba(4,6,9,0.75)',
        borderBottom:'1px solid rgba(0,180,180,0.28)',
        display:'flex', alignItems:'center', padding:'0 20px', gap:28,
        backdropFilter:'blur(12px)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{
            width:8,height:8,borderRadius:'50%',background:rriColor(rri),
            boxShadow:`0 0 10px ${rriColor(rri)}`,
            animation:'spv-blink 2s infinite',
          }}/>
          <span style={{fontSize:11,letterSpacing:3,color:'rgba(0,200,200,0.6)',fontWeight:600}}>SHOCK PROPAGATION</span>
          <span style={{fontSize:10,color:'rgba(0,242,255,0.5)',letterSpacing:2}}>EQ.17</span>
        </div>
        {[
          {l:'RRI',      v:rri.toFixed(2),              c:rriColor(rri)},
          {l:'CASCADE',  v:`${(cascadeProb*100).toFixed(0)}%`, c:'#00f2ff'},
          {l:'P(REV)',   v:`${(pRev*100).toFixed(0)}%`, c:'#ffd60a'},
          {l:'REACHED',  v:`${reachCount}/24`,           c:'#00f2ff'},
          {l:'HIGH',     v:String(highCount),            c:'#ff2d55'},
        ].map(m=>(
          <div key={m.l} style={{display:'flex',alignItems:'baseline',gap:5}}>
            <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>{m.l}</span>
            <span style={{fontSize:13,color:m.c,fontWeight:700,textShadow:`0 0 10px ${m.c}44`}}>{m.v}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:3}}>
          {(['map','sir','history'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} onMouseEnter={e => { if(tab!==t) { e.currentTarget.style.background='rgba(0,242,255,0.08)'; e.currentTarget.style.borderColor='rgba(0,242,255,0.35)'; e.currentTarget.style.color='rgba(0,242,255,0.8)'; } }} onMouseLeave={e => { if(tab!==t) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(0,180,180,0.28)'; e.currentTarget.style.color='rgba(148,163,184,0.35)'; } }} style={{
              background:tab===t?'rgba(0,242,255,0.12)':'transparent',
              border:`1px solid ${tab===t?'rgba(0,242,255,0.45)':'rgba(0,180,180,0.28)'}`,
              color:tab===t?'#00f2ff':'rgba(148,163,184,0.35)',
              padding:'6px 14px',borderRadius:3,cursor:'pointer',
              fontSize:10,letterSpacing:2,textTransform:'uppercase',transition:'all .15s',
            }}>{t==='sir'?'SIR MODEL':t}</button>
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{
        height:38,flexShrink:0,background:'rgba(4,6,9,0.85)',
        borderBottom:'1px solid rgba(0,180,180,0.28)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:16,
      }}>
        <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:2}}>ORIGIN</span>
        <select value={originId} onChange={e=>setOriginId(e.target.value)} style={{
          background:'rgba(4,6,9,0.9)',border:'1px solid rgba(0,242,255,0.3)',
          color:'#00f2ff',padding:'3px 8px',borderRadius:3,fontSize:11,cursor:'pointer',outline:'none',
        }}>
          {Object.values(nodesMeta).sort((a,b)=>a.name.localeCompare(b.name)).map(g=>(
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:2}}>HORIZON</span>
        <select value={maxDays} onChange={e=>setMaxDays(Number(e.target.value))} style={{
          background:'rgba(4,6,9,0.9)',border:'1px solid rgba(0,242,255,0.3)',
          color:'#00f2ff',padding:'3px 8px',borderRadius:3,fontSize:11,cursor:'pointer',outline:'none',
        }}>
          {[14,30,60,90].map(d=><option key={d} value={d}>{d}D</option>)}
        </select>
        <button onClick={()=>{if(playing)setPlaying(false);else{setAnimDay(0);setPlaying(true);}}} onMouseEnter={e => { e.currentTarget.style.background=playing?'rgba(0,242,255,0.25)':'rgba(0,242,255,0.14)'; }} onMouseLeave={e => { e.currentTarget.style.background=playing?'rgba(0,242,255,0.15)':'rgba(0,242,255,0.07)'; }} style={{
          background:playing?'rgba(0,242,255,0.15)':'rgba(0,242,255,0.07)',
          border:`1px solid ${playing?'rgba(0,242,255,0.55)':'rgba(0,242,255,0.25)'}`,
          color:'#00f2ff',padding:'6px 14px',borderRadius:3,cursor:'pointer',fontSize:11,letterSpacing:1,
        }}>{playing?'■ STOP':'▶ SIMULATE'}</button>
        {playing&&(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:100,height:2,background:'rgba(0,180,180,0.15)',borderRadius:2,overflow:'hidden'}}>
              <div style={{width:`${(animDay/maxDays)*100}%`,height:'100%',
                background:'linear-gradient(90deg,#00f2ff,#00c8c8)',transition:'width .1s'}}/>
            </div>
            <span style={{fontSize:10,color:'#00f2ff'}}>D{animDay}/{maxDays}</span>
          </div>
        )}
        <div style={{marginLeft:'auto',fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>
          SCROLL TO ZOOM · DRAG TO PAN
        </div>
        <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}} onMouseEnter={e => { e.currentTarget.style.background='rgba(0,180,180,0.12)'; e.currentTarget.style.borderColor='rgba(0,180,180,0.4)'; e.currentTarget.style.color='rgba(148,163,184,0.6)'; }} onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(0,180,180,0.28)'; e.currentTarget.style.color='rgba(148,163,184,0.35)'; }} style={{
          background:'transparent',border:'1px solid rgba(0,180,180,0.28)',
          color:'rgba(148,163,184,0.35)',padding:'6px 14px',borderRadius:3,cursor:'pointer',fontSize:9,letterSpacing:1,
        }}>RESET</button>
      </div>

      {/* BODY */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ══ MAP ══════════════════════════════════════════ */}
        {tab==='map'&&(
          <>
            <div style={{
              flex:1,position:'relative',overflow:'hidden',
              background:'radial-gradient(ellipse at 45% 35%,rgba(4,6,9,0.95) 0%,#040609 70%)',
              cursor:dragging?'grabbing':'grab',
            }}>
              <svg
                ref={svgRef}
                width="100%" height="100%"
                viewBox={`0 0 ${SVG_W} 760`}
                style={{display:'block',userSelect:'none'}}
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                <defs>
                  <filter id="spv-glow-red"    x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="spv-glow-orange" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="spv-glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="spv-glow-edge"   x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* Pan+zoom group */}
                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom}) translate(${(1-zoom)*0 / zoom},${(1-zoom)*0 / zoom})`}
                  style={{transformOrigin:'260px 380px'}}>

                  {/* Scanline */}
                  <rect x={-60} y={-40} width={640} height={4} fill="rgba(255,45,85,0.04)"
                    style={{animation:'spv-scan 8s linear infinite'}}/>

                  {/* Governorate shapes */}
                  {(govData.governorates as any[])
                    .sort((a: any, b: any) => a.id === 'sfax' ? 1 : b.id === 'sfax' ? -1 : 0)
                    .map((g: any) => {
                    const gid = g.id;
                    const geo = govPaths[gid];
                    if (!geo) return null;
                    const node   = result?.nodes[gid];
                    const vis    = visibleIds.has(gid);
                    const status = node?.status ?? 'unreachable';
                    const col    = STATUS_COLOR[status] ?? STATUS_COLOR.unreachable;
                    const isOrigin = gid === originId;
                    const isHov    = hovered === gid;
                    const filterId = status==='origin'||status==='high' ? 'spv-glow-red'
                                   : status==='medium' ? 'spv-glow-orange'
                                   : status==='low' ? 'spv-glow-yellow' : undefined;

                    return (
                      <g key={gid}
                        onMouseEnter={()=>setHovered(gid)}
                        onMouseLeave={()=>setHovered(null)}
                        onClick={e=>{e.stopPropagation();setOriginId(gid);}}
                        style={{cursor:'pointer'}}
                      >
                        <path
                          d={geo.path}
                          fill={vis ? col.fill : 'rgba(8,16,35,0.4)'}
                          stroke={vis ? col.stroke : 'rgba(25,45,75,0.5)'}
                          strokeWidth={isOrigin?2.5:isHov?1.8:1}
                          filter={vis&&filterId?`url(#${filterId})`:undefined}
                          opacity={vis?1:0.6}
                          style={{transition:'fill .4s,stroke .4s,opacity .4s'}}
                        />
                        {isHov&&(
                          <path d={geo.path} fill="none"
                            stroke={col.stroke} strokeWidth={3} opacity={0.4}
                            filter={`url(#${filterId??'spv-glow-yellow'})`}/>
                        )}
                        <text x={geo.cx} y={geo.cy}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={vis?9:8} fontWeight={vis?700:400}
                          fill={vis&&status!=='unreachable'?'rgba(255,255,255,0.9)':'rgba(60,90,120,0.7)'}
                          fontFamily="IBM Plex Mono,monospace"
                          style={{pointerEvents:'none',userSelect:'none'}}
                        >
                          {nodesMeta[gid]?.name.toUpperCase().slice(0,8)}
                        </text>
                        {vis&&node&&node.status!=='unreachable'&&(
                          <text x={geo.cx} y={geo.cy+11}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={8} fill={col.glow} fontWeight={700}
                            fontFamily="IBM Plex Mono,monospace"
                            style={{pointerEvents:'none'}}
                          >
                            {Math.round(node.probability*100)}%
                          </text>
                        )}
                        {vis&&node&&node.status!=='unreachable'&&node.status!=='origin'&&(
                          <text x={geo.cx+18} y={geo.cy-6}
                            fontSize={7} fill="#ffd60a"
                            fontFamily="IBM Plex Mono,monospace"
                            style={{pointerEvents:'none'}}
                          >D{node.expectedDays}</text>
                        )}
                      </g>
                    );
                  })}

                  {/* Adjacency edges (on top, active ones) */}
                  {Object.entries(ADJ).map(([fromId, neighbors]) =>
                    neighbors.map(toId => {
                      if (toId < fromId) return null;
                      const fromMeta = nodesMeta[fromId];
                      const toMeta   = nodesMeta[toId];
                      if (!fromMeta||!toMeta) return null;
                      const bothVis = visibleIds.has(fromId)&&visibleIds.has(toId);
                      const fromNode = result?.nodes[fromId];
                      const toNode   = result?.nodes[toId];
                      const active = bothVis
                        && fromNode?.status!=='unreachable'
                        && toNode?.status!=='unreachable';
                      if (!active) return null;
                      return (
                        <line key={`${fromId}-${toId}`}
                          x1={fromMeta.cx} y1={fromMeta.cy}
                          x2={toMeta.cx}   y2={toMeta.cy}
                          stroke="rgba(255,214,10,0.5)" strokeWidth={1.5}
                          strokeDasharray="5 3"
                          filter="url(#spv-glow-edge)"
                          style={{animation:'spv-dash 0.8s linear infinite',pointerEvents:'none'}}
                        />
                      );
                    })
                  )}

                  {/* Origin pulse rings */}
                  {originMeta&&[0,1,2].map(i=>(
                    <circle key={i}
                      cx={originMeta.cx} cy={originMeta.cy}
                      r={0} fill="none"
                      stroke="rgba(255,45,85,0.5)" strokeWidth={2}
                      style={{
                        animation:`spv-pulse 2.4s ease-out ${i*0.7}s infinite`,
                        transformOrigin:`${originMeta.cx}px ${originMeta.cy}px`,
                      }}
                    />
                  ))}

                </g>
              </svg>

              {/* Hover tooltip */}
              {hovered&&result?.nodes[hovered]&&(()=>{
                const n   = result.nodes[hovered];
                const m   = nodesMeta[hovered];
                const col = STATUS_COLOR[n.status]??STATUS_COLOR.unreachable;
                return (
                  <div style={{
                    position:'absolute',top:16,right:16,
                    background:'rgba(2,6,18,0.97)',
                    border:`1px solid ${col.stroke}`,borderRadius:6,
                    padding:'14px 18px',minWidth:210,pointerEvents:'none',
                    boxShadow:`0 0 30px ${col.glow}22`,backdropFilter:'blur(12px)',
                  }}>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:col.glow,marginBottom:10}}>
                      {m?.name.toUpperCase()}
                    </div>
                    {[
                      {l:'STATUS',  v:n.status.toUpperCase(),              c:col.glow},
                      {l:'PROB',    v:`${(n.probability*100).toFixed(1)}%`,c:'#e2e8f0'},
                      {l:'DAY',     v:n.status==='origin'?'D0':`D${n.expectedDays}`,c:'#ff9f0a'},
                      {l:'CASCADE', v:`${((m?.cascadeRisk??0)*100)|0}%`,   c:'#a78bfa'},
                      {l:'PATH LEN',v:String(n.path.length),               c:'#64748b'},
                    ].map(r=>(
                      <div key={r.l} style={{display:'flex',justifyContent:'space-between',marginBottom:5,gap:12}}>
                        <span style={{fontSize:9,color:'rgba(148,163,184,0.35)',letterSpacing:1}}>{r.l}</span>
                        <span style={{fontSize:10,color:r.c,fontWeight:600}}>{r.v}</span>
                      </div>
                    ))}
                    {n.path.length>0&&(
                      <div style={{marginTop:8,fontSize:8,color:'rgba(148,163,184,0.35)',lineHeight:1.6}}>
                        {n.path.map(id=>nodesMeta[id]?.name).join(' → ')}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{position:'absolute',bottom:12,left:16,fontSize:8,color:'rgba(148,163,184,0.35)',letterSpacing:2}}>
                CLICK GOVERNORATE TO SET ORIGIN
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{
              width:230,flexShrink:0,borderLeft:'1px solid rgba(0,180,180,0.28)',
              background:'rgba(4,6,9,0.92)',display:'flex',flexDirection:'column',overflowY:'auto',
            }}>
              <div style={{padding:'16px 14px 0'}}>
                <div style={{fontSize:9,color:'rgba(0,200,200,0.6)',letterSpacing:2,marginBottom:10}}>STATUS</div>
                {[
                  {s:'origin',      l:'Ignition Point'},
                  {s:'high',        l:'High  ≥60%'},
                  {s:'medium',      l:'Medium ≥30%'},
                  {s:'low',         l:'Low    <30%'},
                  {s:'unreachable', l:'Not reached'},
                ].map(({s,l})=>(
                  <div key={s} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:10,height:10,borderRadius:2,flexShrink:0,
                      background:STATUS_COLOR[s].fill,
                      border:`1px solid ${STATUS_COLOR[s].stroke}`,
                      boxShadow:s!=='unreachable'?`0 0 6px ${STATUS_COLOR[s].glow}`:'none',
                    }}/>
                    <span style={{fontSize:10,color:'rgba(148,163,184,0.35)'}}>{l}</span>
                  </div>
                ))}
              </div>

              <div style={{height:1,background:'rgba(0,180,180,0.28)',margin:'12px 0'}}/>

              {result&&(
                <div style={{padding:'0 14px'}}>
                  <div style={{fontSize:9,color:'rgba(0,200,200,0.6)',letterSpacing:2,marginBottom:10}}>SIMULATION</div>
                  {[
                    {l:'ORIGIN',   v:result.originName},
                    {l:'CASCADE P',v:`${(result.cascadeProbability*100).toFixed(0)}%`},
                    {l:'HORIZON',  v:`${result.maxReach}D`},
                    {l:'REACHED',  v:`${reachCount} GOV`},
                    {l:'HIGH RISK',v:`${highCount} GOV`},
                    {l:'PEAK I',   v:`${(Math.max(...sir.map(p=>p.I))*100).toFixed(1)}%`},
                    {l:'R₀',       v:(0.4*(0.5+cascadeProb)/0.15).toFixed(2)},
                  ].map(r=>(
                    <div key={r.l} style={{display:'flex',justifyContent:'space-between',
                      marginBottom:6,borderBottom:'1px solid rgba(0,180,180,0.28)',paddingBottom:6}}>
                      <span style={{fontSize:9,color:'#3a4a5a',letterSpacing:1}}>{r.l}</span>
                      <span style={{fontSize:11,color:'#8899bb',fontWeight:600}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{height:1,background:'rgba(255,255,255,0.04)',margin:'4px 0 12px'}}/>

              {match&&(
                <div style={{padding:'0 14px'}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:8}}>HIST. MATCH</div>
                  <div style={{
                    background:'rgba(255,45,85,0.06)',border:'1px solid rgba(255,45,85,0.2)',
                    borderRadius:4,padding:'10px 12px',
                  }}>
                    <div style={{fontSize:11,color:'#ff6b8a',marginBottom:4,fontWeight:600}}>{match.wave.name}</div>
                    <div style={{fontSize:10,color:'#ffd60a',marginBottom:6}}>{(match.score*100).toFixed(0)}% SIMILARITY</div>
                    <div style={{fontSize:9,color:'#4a5568',lineHeight:1.5}}>{match.wave.outcome}</div>
                  </div>
                </div>
              )}

              {result&&(
                <div style={{padding:'12px 14px 16px'}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:8}}>SPREAD SEQUENCE</div>
                  {Object.values(result.nodes)
                    .filter(n=>n.status!=='unreachable')
                    .sort((a,b)=>a.expectedDays-b.expectedDays)
                    .slice(0,12)
                    .map((n,i)=>{
                      const col = STATUS_COLOR[n.status]??STATUS_COLOR.unreachable;
                      const vis = !playing||n.expectedDays<=animDay;
                      return (
                        <div key={n.governorateId} style={{
                          display:'flex',alignItems:'center',gap:7,marginBottom:5,
                          opacity:vis?1:0.25,transition:'opacity .3s',
                        }}>
                          <span style={{fontSize:8,color:'#2a3a4a',width:14}}>{String(i+1).padStart(2,'0')}</span>
                          <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
                            background:col.glow,boxShadow:`0 0 4px ${col.glow}`}}/>
                          <span style={{fontSize:9,color:'#4a5a6a',flex:1,overflow:'hidden',
                            textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {nodesMeta[n.governorateId]?.name.toUpperCase()}
                          </span>
                          <span style={{fontSize:8,color:'#ffd60a'}}>D{n.expectedDays}</span>
                          <span style={{fontSize:8,color:col.glow}}>{Math.round(n.probability*100)}%</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ SIR ══════════════════════════════════════════ */}
        {tab==='sir'&&(
          <div style={{flex:1,padding:'32px 40px',overflowY:'auto'}}>
            <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:3,marginBottom:6}}>EPIDEMIC PROTEST MODEL</div>
            <div style={{fontSize:20,color:'#c9d1e0',fontWeight:700,marginBottom:4}}>SIR — EQ.4</div>
            <div style={{fontSize:11,color:'#4a5a6a',marginBottom:28}}>
              β={( 0.4*(0.5+cascadeProb)).toFixed(3)} · γ=0.150 · R₀={(0.4*(0.5+cascadeProb)/0.15).toFixed(2)}
            </div>
            {sir.length>0&&(
              <>
                <div style={{background:'rgba(0,4,12,0.8)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'24px 28px',marginBottom:24}}>
                  <svg width={SW} height={SH} style={{overflow:'visible'}}>
                    {[0.25,0.5,0.75].map(v=>(
                      <React.Fragment key={v}>
                        <line x1={0} y1={sy(v)} x2={SW} y2={sy(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
                        <text x={-6} y={sy(v)+4} textAnchor="end" fontSize={8} fill="#2a3a4a" fontFamily="IBM Plex Mono,monospace">{(v*100).toFixed(0)}%</text>
                      </React.Fragment>
                    ))}
                    {[0,maxDays/4,maxDays/2,3*maxDays/4,maxDays].map(d=>(
                      <text key={d} x={sx(d)} y={SH+14} textAnchor="middle" fontSize={8} fill="#2a3a4a" fontFamily="IBM Plex Mono,monospace">D{Math.round(d)}</text>
                    ))}
                    <path d={sirPath('I')} fill="none" stroke="#ff2d55" strokeWidth={2.5}/>
                    <path d={`${sirPath('I')} L${SW},${SH} L0,${SH} Z`} fill="rgba(255,45,85,0.07)"/>
                    <path d={sirPath('S')} fill="none" stroke="#00b4b4" strokeWidth={2}/>
                    <path d={sirPath('R')} fill="none" stroke="#3a4a5a" strokeWidth={2}/>
                  </svg>
                  <div style={{display:'flex',gap:20,marginTop:16}}>
                    {[{c:'#00b4b4',l:'Susceptible'},{c:'#ff2d55',l:'Infected'},{c:'#3a4a5a',l:'Recovered'}].map(lg=>(
                      <div key={lg.l} style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:20,height:2,background:lg.c,boxShadow:`0 0 5px ${lg.c}`}}/>
                        <span style={{fontSize:10,color:'#4a5a6a'}}>{lg.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                  {[
                    {l:'PEAK INFECTED',  v:`${(Math.max(...sir.map(p=>p.I))*100).toFixed(1)}%`,c:'#ff2d55'},
                    {l:'PEAK DAY',       v:`D${sir.indexOf(sir.reduce((b,p)=>p.I>b.I?p:b,sir[0]))}`,c:'#ffd60a'},
                    {l:'R₀',            v:(0.4*(0.5+cascadeProb)/0.15).toFixed(2),c:'#ff9f0a'},
                    {l:'FINAL RECOVERED',v:`${((sir[sir.length-1]?.R??0)*100).toFixed(1)}%`,c:'#00a0a0'},
                  ].map(m=>(
                    <div key={m.l} style={{background:'rgba(0,4,12,0.8)',border:`1px solid ${m.c}22`,borderRadius:6,padding:'12px 16px',minWidth:130}}>
                      <div style={{fontSize:8,color:'#3a4a5a',letterSpacing:2,marginBottom:6}}>{m.l}</div>
                      <div style={{fontSize:16,color:m.c,fontWeight:700}}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ HISTORY ══════════════════════════════════════ */}
        {tab==='history'&&(
          <div style={{flex:1,padding:'32px 40px',overflowY:'auto'}}>
            <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:3,marginBottom:6}}>PATTERN RECOGNITION</div>
            <div style={{fontSize:20,color:'#c9d1e0',fontWeight:700,marginBottom:28}}>Historical Wave Comparison</div>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {HISTORICAL_WAVES.map(wave=>{
                const score = result?compareToHistorical(result,wave):0;
                const isMatch = score>0.35;
                return (
                  <div key={wave.name} style={{
                    background:'rgba(0,4,12,0.8)',
                    border:`1px solid ${isMatch?'rgba(255,214,10,0.3)':'rgba(255,255,255,0.05)'}`,
                    borderRadius:8,padding:'18px 22px',
                    boxShadow:isMatch?'0 0 25px rgba(255,214,10,0.07)':'none',
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontSize:13,color:'#c9d1e0',fontWeight:700,marginBottom:3}}>{wave.name}</div>
                        <div style={{fontSize:10,color:'#ff9f0a'}}>{wave.outcome}</div>
                      </div>
                      <div style={{
                        background:isMatch?'rgba(255,214,10,0.12)':'rgba(255,255,255,0.04)',
                        border:`1px solid ${isMatch?'rgba(255,214,10,0.4)':'rgba(255,255,255,0.06)'}`,
                        borderRadius:4,padding:'5px 10px',textAlign:'center',minWidth:60,
                      }}>
                        <div style={{fontSize:16,fontWeight:700,color:isMatch?'#ffd60a':'#3a4a5a'}}>{(score*100).toFixed(0)}%</div>
                        <div style={{fontSize:8,color:'#3a4a5a',letterSpacing:1}}>MATCH</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {wave.steps.map((step,i)=>(
                        <div key={i} style={{
                          background:step.intensity>0.7?'rgba(255,214,10,0.1)':'rgba(255,255,255,0.04)',
                          border:`1px solid ${step.intensity>0.7?'rgba(255,214,10,0.3)':'rgba(255,255,255,0.06)'}`,
                          borderRadius:3,padding:'3px 8px',fontSize:9,display:'flex',gap:5,
                        }}>
                          <span style={{color:'#ff9f0a'}}>D{step.day}</span>
                          <span style={{color:'#7a8a9a'}}>{nodesMeta[step.governorateId]?.name??step.governorateId}</span>
                          <span style={{color:step.intensity>0.7?'#ffd60a':'#3a4a5a'}}>{(step.intensity*100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShockPropagationView;
