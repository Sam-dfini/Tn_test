/**
 * NationalCommandCenter.tsx
 * TunisiaIntel — National Command Center
 * Command Center Branch — "State of the Nation" operational view
 *
 * Layout per design mockup:
 *   Section 1: Status Strip — RRI | NBS | BMI | FSI | timestamp
 *   Section 2: National Status Arc Gauge — STRAINED/ESCALATING needle
 *   Section 3: Top Active Threats — 4 domain command cards
 *   Section 4: Strategic Response Panel — 3 actor lenses
 *   Section 5: National System Pressure Index — 5 rows + Tunisia tactical map
 *   Section 6: Domain Switchboard — 8 fast-access tiles
 *   Section 7: Analyst Mode — collapsed, expands to deep analysis
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, AlertTriangle, AlertCircle, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Zap, Shield, Globe,
  DollarSign, Wheat, Droplets, Brain, ShieldAlert, BarChart3,
  Map as MapIcon, Users, Radio, Target, ArrowRight, Clock,
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { usePipeline } from '../context/PipelineContext';
import { cn } from '../utils/cn';

// ─── NBS CALCULATION ─────────────────────────────────────────────────────────
function computeNBS(rri: number, pRev: number): number {
  const sentiment_divergence = Math.min(1, rri / 3.0) * 0.35;
  const spread_velocity      = Math.min(1, pRev * 2.5) * 0.25;
  const source_authority_gap = 0.42 * 0.20; // calibrated static
  const opp_gov_gap          = Math.min(1, rri / 2.5) * 0.20;
  return Math.round((sentiment_divergence + spread_velocity + source_authority_gap + opp_gov_gap) * 100);
}

// ─── STATUS LABEL ─────────────────────────────────────────────────────────────
function getStatusLabel(rri: number): { label: string; sub: string; color: string; zone: string } {
  if (rri >= 2.5) return { label: 'CRITICAL', sub: 'Regime rupture threshold approaching', color: '#ef4444', zone: 'RED' };
  if (rri >= 1.8) return { label: 'STRAINED / ESCALATING', sub: 'Primary Pressure: Narrative + Regional Instability', color: '#f97316', zone: 'ORANGE' };
  if (rri >= 1.2) return { label: 'ELEVATED', sub: 'Multiple structural stress indicators active', color: '#f59e0b', zone: 'YELLOW' };
  return { label: 'MONITORED', sub: 'System stable — standard monitoring active', color: '#10b981', zone: 'GREEN' };
}

// ─── MINI SPARKLINE DATA ─────────────────────────────────────────────────────
const SPARK_DATA = [
  { v: 1.28 }, { v: 1.31 }, { v: 1.29 }, { v: 1.34 }, { v: 1.38 },
  { v: 1.35 }, { v: 1.41 }, { v: 1.44 }, { v: 1.42 }, { v: 1.47 },
];

// ─── ARC GAUGE ───────────────────────────────────────────────────────────────
const ArcGauge: React.FC<{ rri: number; status: ReturnType<typeof getStatusLabel> }> = ({ rri, status }) => {
  const MAX_RRI = 3.0;
  const clampedRRI = Math.max(0, Math.min(MAX_RRI, rri));
  const pct = clampedRRI / MAX_RRI;
  const angle = -135 + (pct * 270);

  const cx = 200, cy = 180, r = 140;

  function polar(deg: number, radius = r) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(startDeg: number, endDeg: number, innerR = r - 25, outerR = r) {
    const s1 = polar(startDeg, outerR), e1 = polar(endDeg, outerR);
    const s2 = polar(endDeg, innerR), e2 = polar(startDeg, innerR);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s1.x} ${s1.y} A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${innerR} ${innerR} 0 ${large} 0 ${e2.x} ${e2.y} Z`;
  }

  return (
    <div className="relative w-full flex flex-col items-center py-6">
      {/* Percentage Display */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10 w-full px-4">
        <motion.div 
          key={rri}
          initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          className="text-5xl md:text-6xl font-mono font-bold tracking-tighter"
          style={{ color: status.color, textShadow: `0 0 35px ${status.color}` }}
        >
          {Math.round(pct * 100)}<span className="text-xl md:text-2xl opacity-50 ml-1">%</span>
        </motion.div>
        <div className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-[0.5em] mt-1 font-black">
          Crisis Pressure
        </div>
      </div>

      <svg viewBox="0 0 400 320" className="w-full h-auto max-w-[500px]" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="neoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient background ring */}
        <path d={arcPath(-135, 135, r - 26, r + 1)} fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* Ticks */}
        {Array.from({ length: 55 }).map((_, i) => {
          const tDeg = -135 + (i * 5);
          const isActive = (pct * 270) >= (i * 5);
          const iLen = i % 10 === 0 ? 12 : i % 5 === 0 ? 8 : 4;
          const p1 = polar(tDeg, r + 5);
          const p2 = polar(tDeg, r + 5 + iLen);
          return (
            <line 
              key={i} 
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} 
              stroke={isActive ? status.color : 'rgba(255,255,255,0.08)'} 
              strokeWidth={i % 5 === 0 ? 2 : 1}
              opacity={isActive ? 1 : 0.2}
              className="transition-all duration-500"
            />
          );
        })}

        {/* Level Segments */}
        {[
          { start: -135, end: -67.5, color: '#10b981', label: 'NORMAL', textDeg: -101 },
          { start: -67.5, end: 0,    color: '#f59e0b', label: 'ELEVATED', textDeg: -33 },
          { start: 0,    end: 67.5,  color: '#f97316', label: 'STRAINED', textDeg: 33 },
          { start: 67.5, end: 135,   color: '#ef4444', label: 'CRITICAL', textDeg: 101 },
        ].map((z, i) => {
          const sectionActive = (pct * 270) > (z.start + 135);
          return (
            <g key={i}>
              <path
                d={arcPath(z.start + 1.5, z.end - 1.5)}
                fill={sectionActive ? z.color : 'rgba(255,255,255,0.03)'}
                fillOpacity={sectionActive ? 0.35 : 0.05}
                className="transition-all duration-1000"
              />
              <text 
                {...polar(z.textDeg, r + 25)}
                fill={sectionActive ? z.color : 'rgba(255,255,255,0.08)'} 
                className="text-[9px] font-mono font-black tracking-widest pointer-events-none"
                textAnchor="middle"
                style={{ opacity: sectionActive ? 1 : 0.3 }}
              >
                {z.label}
              </text>
            </g>
          );
        })}

        {/* Neo Needle */}
        <g transform={`translate(${cx}, ${cy})`} style={{ filter: 'url(#neoGlow)' }}>
          <motion.g
            initial={{ rotate: -135 }}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            style={{ originX: "50%", originY: "100%" }}
          >
            {/* The main beam */}
            <path 
              d="M -3 0 L 0 -160 L 3 0 Z" 
              fill={status.color} 
              fillOpacity={0.9} 
            />
            {/* White core */}
            <line 
              x1="0" y1="0" x2="0" y2="-155" 
              stroke="white" strokeWidth="1.5" strokeOpacity="1" 
              strokeLinecap="round" 
            />
          </motion.g>
        </g>

        {/* Center Pivot Hub */}
        <g>
          <circle cx="200" cy="180" r="28" fill="#0a0c10" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <circle cx="200" cy="180" r="18" fill="none" stroke={status.color} strokeWidth="1" strokeDasharray="4 4" opacity={0.5}>
             <animateTransform attributeName="transform" type="rotate" from="0 200 180" to="360 200 180" dur="10s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="180" r="8" fill={status.color} style={{ filter: `drop-shadow(0 0 15px ${status.color})` }} />
        </g>

        {/* Labels below hub */}
        <text x="200" y="270" fill={status.color} className="text-sm font-mono font-bold tracking-[0.4em] uppercase" textAnchor="middle" style={{ textShadow: `0 0 10px ${status.color}40` }}>
          {status.label}
        </text>
        <text x="200" y="290" fill="rgba(255,255,255,0.25)" className="text-[9px] font-mono font-medium uppercase tracking-[0.1em]" textAnchor="middle">
          {status.sub}
        </text>
      </svg>
    </div>
  );
};



// ─── THREAT CARD ─────────────────────────────────────────────────────────────
interface ThreatCard {
  domain: string;
  icon: React.ElementType;
  color: string;
  title: string;
  confidence: number;
  delta: string;
  deltaDir: 'up' | 'down' | 'stable';
  region: string;
  decisionWindow: string;
}

// ─── PRESSURE ROW ─────────────────────────────────────────────────────────────
const PressureRow: React.FC<{
  id: string; label: string; desc: string; value: number;
  delta: number; status: string;
}> = ({ id, label, desc, value, delta, status }) => {
  const statusColors: Record<string, string> = {
    Red: '#ef4444', Orange: '#f97316', Yellow: '#f59e0b', Low: '#10b981',
  };
  const color = statusColors[status] || '#64748b';
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-2 rounded-lg transition-colors group">
      <div className="w-10 text-[9px] font-mono text-slate-600 shrink-0 font-bold">{id}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-mono font-bold text-white">{label}</span>
          <span className="text-[9px] font-mono text-slate-600">({desc})</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-mono text-sm font-bold" style={{ color }}>{value}%</span>
        <TrendIcon className="w-3 h-3" style={{ color: delta > 0 ? '#ef4444' : '#10b981' }} />
        <span className={cn('text-[9px] font-mono font-bold', delta > 0 ? 'text-red-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500')}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
          style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}>
          {status}
        </span>
      </div>
    </div>
  );
};

// ─── DOMAIN TILE ─────────────────────────────────────────────────────────────
const DomainTile: React.FC<{
  label: string; icon: React.ElementType; color: string;
  alert?: string; onClick: () => void;
}> = ({ label, icon: Icon, color, alert, onClick }) => (
  <button
    onClick={onClick}
    className="relative glass rounded-2xl border border-intel-border p-2 flex flex-col items-center justify-center gap-2 md:gap-3 aspect-square text-center hover:border-white/20 transition-all group hover:scale-[1.03] active:scale-[0.97] overflow-hidden w-full"
  >
    {alert && (
      <div className="absolute top-2 right-2 md:top-3 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,1)]"
        style={{ backgroundColor: '#ef4444' }} />
    )}
    <div className="p-2 md:p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.06] group-hover:border-white/[0.1] transition-all duration-300 shadow-inner">
      <Icon className="w-5 h-5 md:w-8 md:h-8 transition-transform group-hover:rotate-12 group-hover:scale-110" style={{ color }} />
    </div>
    <div className="text-[8px] md:text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tighter leading-tight w-full break-words line-clamp-2 px-1 group-hover:text-white transition-colors">
      {label}
    </div>
    
    {/* Subtle corner accent */}
    <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

interface NationalCommandCenterProps {
  onNavigate?: (tab: string) => void;
}

export const NationalCommandCenter: React.FC<NationalCommandCenterProps> = ({ onNavigate }) => {
  const { data, rriState } = usePipeline();
  const [analystOpen, setAnalystOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const rri  = (data as any)?.rri?.rri   ?? rriState?.rri   ?? 1.47;
  const pRev = (data as any)?.rri?.pRevolution ?? rriState?.cascade_probability ?? 0.12;
  const fxDays = (data as any)?.economy?.fx_reserves_days ?? 60;
  const bmi  = 0.68;
  const fsi  = Math.max(0, Math.min(1, 1 - rri / 3)) * 100;
  const nbs  = computeNBS(rri, pRev);
  const rsi  = Math.max(0, 100 - (rri / 3) * 100 * 0.8);

  const status = getStatusLabel(rri);

  // Top active threats
  const threats: ThreatCard[] = useMemo(() => [
    {
      domain: 'NARRATIVE',
      icon: Brain, color: '#a855f7',
      title: 'Nabeul protest probability +15%',
      confidence: 98, delta: '+15%', deltaDir: 'up',
      region: 'Nabeul', decisionWindow: '18h',
    },
    {
      domain: 'ECONOMIC',
      icon: DollarSign, color: '#f59e0b',
      title: 'Fuel smuggling pressure +32% South corridor',
      confidence: 22, delta: '+32%', deltaDir: 'up',
      region: 'Tataouine', decisionWindow: '72h',
    },
    {
      domain: 'AGRICULTURE',
      icon: Wheat, color: '#10b981',
      title: 'Poultry feed stress rising (+11%)',
      confidence: 18, delta: '+11%', deltaDir: 'up',
      region: 'National', decisionWindow: '7d',
    },
    {
      domain: 'WATER',
      icon: Droplets, color: '#00f2ff',
      title: 'Regional water cut escalation — Kasserine',
      confidence: 79, delta: '→ STABLE', deltaDir: 'stable',
      region: 'Kasserine', decisionWindow: '48h',
    },
  ], []);

  // Strategic response panel
  const responses = [
    {
      actor: 'GOVERNMENT',
      color: '#a855f7',
      action: 'Counter-narrative + food stabilization advised',
      sub: 'UGTT dialogue window: 18h',
    },
    {
      actor: 'NGO / HUMAN RIGHTS',
      color: '#00f2ff',
      action: 'Prepare civil liberties monitoring surge',
      sub: 'Decree 54 risk: HIGH',
    },
    {
      actor: 'INVESTOR / BUSINESS',
      color: '#f59e0b',
      action: 'Review logistics + inflation exposure (72h)',
      sub: 'FX reserves: 60 days cover',
    },
  ];

  // Pressure index rows
  const pressureRows = [
    { id: 'RRI', label: 'RRI', desc: 'Revolution Risk', value: Math.round(rri / 3 * 100), delta: +2, status: rri >= 1.8 ? 'Red' : 'Orange' },
    { id: 'NBS', label: 'NBS', desc: 'Narrative Battlefield', value: nbs, delta: +12, status: nbs > 70 ? 'Orange' : 'Yellow' },
    { id: 'BMI', label: 'BMI', desc: 'Black Market', value: Math.round(bmi * 100), delta: +2, status: 'Orange' },
    { id: 'FSI', label: 'FSI', desc: 'Food Security', value: Math.round(fsi), delta: -1, status: 'Low' },
    { id: 'RSI', label: 'RSI', desc: 'Regional Stability', value: Math.round(rsi), delta: +2, status: rsi < 50 ? 'Red' : 'Orange' },
  ];

  // Domain switchboard
  const domains = [
    { label: 'Economic Intelligence', icon: DollarSign, color: '#f59e0b', tab: 'economy', alert: true },
    { label: 'Political Stability', icon: Shield, color: '#a855f7', tab: 'political', alert: false },
    { label: 'Narrative Warfare', icon: Brain, color: '#00f2ff', tab: 'narrative', alert: true },
    { label: 'Black Market', icon: AlertTriangle, color: '#ef4444', tab: 'black-market', alert: true },
    { label: 'Agriculture & Feed', icon: Wheat, color: '#10b981', tab: 'feed-hub', alert: false },
    { label: 'Water Security', icon: Droplets, color: '#3b82f6', tab: 'environment', alert: false },
    { label: 'Forecast Lab', icon: BarChart3, color: '#f97316', tab: 'strategic', alert: false },
    { label: 'Security Intel', icon: ShieldAlert, color: '#8b5cf6', tab: 'security', alert: false },
  ];

  const navigate = (tab: string) => onNavigate?.(tab);

  return (
    <div className="space-y-4 relative pb-10 p-3 md:p-4">

      {/* ── SECTION 1: STATUS STRIP ── */}
      <div className="glass rounded-xl border border-intel-border/50 overflow-hidden">
        <div className="flex items-center gap-0 overflow-x-auto no-scrollbar divide-x divide-white/5">
          {/* Live pulse */}
          <div className="flex items-center gap-2 px-4 py-3 shrink-0">
            <Activity className="w-3.5 h-3.5 text-intel-cyan" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">National Status:</span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: status.color }}>
              {status.zone === 'ORANGE' ? 'STRAINED' : status.label}
            </span>
          </div>
          {[
            { id: 'RRI', value: (rri * 100 / 3).toFixed(0), delta: '↑', color: '#ef4444' },
            { id: 'NBS', value: String(nbs), delta: '↑+12', color: '#f97316' },
            { id: 'BMI', value: '54', delta: '↑', color: '#f97316' },
            { id: 'FSI', value: Math.round(fsi).toString(), delta: '⟷', color: '#10b981' },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 px-4 py-3 shrink-0">
              <span className="text-[9px] font-mono text-slate-600">{m.id}</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
              <span className="text-[9px] font-mono" style={{ color: m.color }}>{m.delta}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-3 ml-auto shrink-0">
            <span className="text-[8px] font-mono text-slate-600">2 NEW HIGH-PRIORITY SIGNALS</span>
            <div className="w-1.5 h-1.5 rounded-full bg-intel-red animate-pulse" />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 shrink-0">
            <Clock className="w-3 h-3 text-slate-600" />
            <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
              UPDATED {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: NATIONAL STATUS GAUGE ── */}
      <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-intel-cyan" />
            Integrated National Resilience
          </div>
          {/* Mini sparkline */}
          <div className="h-8 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SPARK_DATA}>
                <Line type="monotone" dataKey="v" stroke={status.color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="px-4 py-2">
          <ArcGauge rri={rri} status={status} />
        </div>
      </div>

      {/* ── SECTION 3: TOP ACTIVE THREATS ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Top Active Threats</div>
          <div className="text-[8px] font-mono text-slate-700">High-priority command cards</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {threats.map((t, i) => {
            const Icon = t.icon;
            const DeltaIcon = t.deltaDir === 'up' ? TrendingUp : t.deltaDir === 'down' ? TrendingDown : Minus;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'glass rounded-xl border p-4 space-y-3 hover:border-white/15 transition-all cursor-default',
                  i === 0 ? 'border-red-500/30 bg-red-500/5' :
                  i === 1 ? 'border-amber-500/20' :
                  'border-intel-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: t.color }} />
                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest" style={{ color: t.color }}>
                      {t.domain}
                    </span>
                  </div>
                  {i === 0 && <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />}
                </div>
                <p className="text-[10px] font-mono text-white leading-tight">{t.title}</p>
                <div className="space-y-1 text-[9px] font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Confidence</span>
                    <span className="text-white font-bold">{t.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delta since last check</span>
                    <div className="flex items-center gap-1">
                      <DeltaIcon className="w-2.5 h-2.5" style={{ color: t.deltaDir === 'up' ? '#ef4444' : '#10b981' }} />
                      <span className={t.deltaDir === 'up' ? 'text-red-400' : t.deltaDir === 'down' ? 'text-emerald-400' : 'text-slate-500'}>
                        {t.delta}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span>Region</span>
                    <span className="text-intel-cyan">{t.region}</span>
                  </div>
                  {t.decisionWindow && (
                    <div className="flex justify-between">
                      <span>Decision Window</span>
                      <span className="text-intel-orange font-bold">{t.decisionWindow}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 4: STRATEGIC RESPONSE PANEL ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Strategic Response Panel</div>
          <div className="text-[8px] font-mono text-slate-700">Actionable operational decision modules</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {responses.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="glass rounded-xl border border-intel-border p-4 space-y-2 hover:border-white/15 transition-all"
            >
              <div className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: r.color }}>
                {r.actor}
              </div>
              <p className="text-[11px] font-mono text-white leading-tight">{r.action}</p>
              <div className="text-[8px] font-mono text-slate-600 pt-1 border-t border-white/5">{r.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: NATIONAL PRESSURE INDEX + MAP ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pressure rows */}
        <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            National System Pressure Index
          </div>
          <div className="p-3">
            {pressureRows.map((row, i) => (
              <PressureRow key={i} {...row} />
            ))}
          </div>
        </div>

        {/* Tactical map placeholder */}
        <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Tactical Map</span>
            <span className="text-[8px] font-mono text-slate-700">System stress</span>
          </div>
          <div className="relative h-[280px] bg-[#0a0c10] flex items-center justify-center overflow-hidden">
            {/* SVG Tunisia outline with hotspot glows */}
            <svg viewBox="0 0 200 300" className="h-full opacity-90">
              {/* Simplified Tunisia outline */}
              <path
                d="M100,20 L140,30 L160,60 L165,90 L155,120 L160,150 L155,180 L145,220 L130,260 L115,280 L100,275 L85,260 L75,240 L80,200 L70,170 L65,140 L70,110 L60,80 L70,50 Z"
                fill="none"
                stroke="rgba(0,242,255,0.3)"
                strokeWidth="1.5"
              />
              <path
                d="M100,20 L140,30 L160,60 L165,90 L155,120 L160,150 L155,180 L145,220 L130,260 L115,280 L100,275 L85,260 L75,240 L80,200 L70,170 L65,140 L70,110 L60,80 L70,50 Z"
                fill="rgba(0,242,255,0.04)"
              />

              {/* Hotspot glows */}
              {[
                { x: 108, y: 55, label: 'Tunis', color: '#f97316', r: 12 },
                { x: 130, y: 110, label: 'Nabeul', color: '#ef4444', r: 14 },
                { x: 72, y: 170, label: 'Kasserine', color: '#ef4444', r: 16 },
                { x: 125, y: 190, label: 'Sfax', color: '#f97316', r: 11 },
                { x: 78, y: 210, label: 'Gafsa', color: '#ef4444', r: 13 },
              ].map((h, i) => (
                <g key={i}>
                  <circle cx={h.x} cy={h.y} r={h.r} fill={h.color} opacity={0.15} />
                  <circle cx={h.x} cy={h.y} r={h.r * 0.5} fill={h.color} opacity={0.4}>
                    <animate attributeName="r" values={`${h.r * 0.4};${h.r * 0.7};${h.r * 0.4}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={h.x} cy={h.y} r={3} fill={h.color} />
                  <text x={h.x + 6} y={h.y - 6} fill={h.color} fontSize={7} fontFamily="monospace">{h.label}</text>
                </g>
              ))}
            </svg>

            {/* Color scale */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
              {['#ef4444', '#f97316', '#f59e0b', '#10b981'].map((c, i) => (
                <div key={i} className="w-3 h-8 rounded-sm" style={{ backgroundColor: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>
          <div className="px-4 py-3 border-t border-white/5">
            <button
              onClick={() => navigate('events')}
              className="w-full py-2 rounded-xl border border-intel-cyan/30 bg-intel-cyan/10 text-intel-cyan text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-intel-cyan/20 transition-all flex items-center justify-center gap-2"
            >
              Enter Tactical Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 6: DOMAIN SWITCHBOARD ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Domain Switchboard</div>
          <div className="text-[8px] font-mono text-slate-700">Fast-access tactical tile modules</div>
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3 w-full">
          {domains.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.04 }}
              className="w-full"
            >
              <DomainTile
                label={d.label}
                icon={d.icon}
                color={d.color}
                alert={d.alert ? 'true' : undefined}
                onClick={() => navigate(d.tab)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── SECTION 7: ANALYST MODE ── */}
      <div className="glass rounded-2xl border border-intel-border/50 overflow-hidden">
        <button
          onClick={() => setAnalystOpen(!analystOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="text-left">
            <div className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-intel-cyan" />
              Analyst Mode
            </div>
            <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-0.5">
              Deep Analysis Mode | Force graph · Evidence chain · Source authority · Full simulation engine
            </div>
          </div>
          {analystOpen
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        <AnimatePresence>
          {analystOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="p-5 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Intelligence Brief', desc: 'AI-synthesized daily SITREP', tab: 'overview', icon: Radio },
                  { label: 'Key Intelligence Questions', desc: '3 active KIQs — UGTT, Gafsa, EU-TN', tab: 'overview', icon: Target },
                  { label: 'Scenario Distribution', desc: 'Default: 45% / Social: 30% / IMF: 15%', tab: 'strategic', icon: BarChart3 },
                  { label: 'Actor Posture Matrix', desc: 'Regime · UGTT · Opposition · Youth · IMF', tab: 'political', icon: Users },
                  { label: 'Narrative Cluster Map', desc: 'Gov Stability vs SNJT Denunciation', tab: 'narrative', icon: Brain },
                  { label: 'Live Signal Feed', desc: 'Real-time classified intelligence', tab: 'events', icon: Zap },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(item.tab)}
                      className="flex items-start gap-3 p-3 rounded-xl border border-intel-border hover:border-white/20 hover:bg-white/[0.02] transition-all text-left group"
                    >
                      <Icon className="w-4 h-4 text-intel-cyan shrink-0 mt-0.5 group-hover:text-white transition-colors" />
                      <div>
                        <div className="text-[10px] font-mono font-bold text-white">{item.label}</div>
                        <div className="text-[8px] font-mono text-slate-600 mt-0.5">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
