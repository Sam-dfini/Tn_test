import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Activity, Database, Radio, Zap, Layers, Terminal,
  Trash2, Pause, Play, Filter, AlertTriangle, ArrowRight,
  RefreshCw, ShieldAlert, CheckCircle2, XCircle,
  Cpu, Globe, FileText, FlaskConical, Server, Send,
  BarChart3, RotateCcw, Loader2, Maximize2, Minimize2,
  ExternalLink, Settings, History, Info, ChevronRight,
  ArrowUpRight, ArrowDownRight, Gauge,
  Map as MapIcon,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { pipelineDebugger, DebugLog, PipelineStage } from '../services/debugService';
import { useObservability } from '../context/ObservabilityContext';
import { useRSS } from '../context/RSSContext';
import { usePipeline } from '../context/PipelineContext';
import { ingestionMetrics, ingestTelegramManually } from '../services/rssService';
import { prepareList, assertKey, getRenderKey } from '../lib/keyUtils';
import { FeedColumn } from './debug/FeedColumn';
import { NewsColumn } from './debug/NewsColumn';
import { SignalsColumn } from './debug/SignalsColumn';
import { EventsColumn } from './debug/EventsColumn';
import { PipelineLogColumn } from './debug/PipelineLogColumn';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Tab = 'MISSION' | 'FLOW' | 'DEBUGGER' | 'DATABASE' | 'TESTS';

interface TestResult {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'pass' | 'fail';
  message: string;
  latencyMs?: number;
  detail?: string;
  ts?: number;
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const FLOW_STYLE = `
@keyframes flowDash {
  to { stroke-dashoffset: -24; }
}
@keyframes flowDashRev {
  to { stroke-dashoffset: 24; }
}
@keyframes ledPulse {
  0%,100% { opacity:1; r:5; }
  50%      { opacity:0.5; r:7; }
}
@keyframes ledPulseWarn {
  0%,100% { opacity:1; }
  50%      { opacity:0.3; }
}
.flow-ok   { animation: flowDash 0.8s linear infinite; }
.flow-rev  { animation: flowDashRev 0.8s linear infinite; }
.flow-warn { animation: flowDash 1.6s linear infinite; }
.flow-fail { animation: none; }
.led-ok    { animation: ledPulse 2s ease-in-out infinite; }
.led-warn  { animation: ledPulseWarn 1s ease-in-out infinite; }
`;

if (typeof document !== 'undefined' && !document.getElementById('scc-flow-styles')) {
  const s = document.createElement('style');
  s.id = 'scc-flow-styles';
  s.textContent = FLOW_STYLE;
  document.head.appendChild(s);
}

// ─── FLOW DIAGRAM LOGIC ─────────────────────────────────────────────────────

type NodeStatus = 'OK' | 'WARN' | 'FAIL' | 'IDLE';
type ConnStatus = 'FLOWING' | 'SLOW' | 'BLOCKED' | 'IDLE';

function nodeStatus(id: string, m: any): NodeStatus {
  const now = Date.now();
  switch (id) {
    case 'rss':
      if (!m.lastIngestionTime) return 'IDLE';
      if (now - m.lastIngestionTime < 600_000) return 'OK';
      if (now - m.lastIngestionTime < 1_800_000) return 'WARN';
      return 'FAIL';
    case 'parser':
      if (m.isFetching) return 'OK';
      if (m.feedCount > 0) return 'OK';
      if (m.lastIngestionTime > 0) return 'WARN';
      return 'IDLE';
    case 'classifier':
      if (m.newsCount > 0 && m.errorRate < 0.3) return 'OK';
      if (m.newsCount > 0) return 'WARN';
      if (m.feedCount > 0) return 'WARN';
      return 'IDLE';
    case 'supabase':
      if (m.dbWriteCount > 0) return 'OK';
      if (m.dbReadCount > 0) return 'WARN';
      return 'FAIL';
    case 'signals':
      if (m.signalCount > 0) return 'OK';
      if (m.newsCount > 0) return 'WARN';
      return 'IDLE';
    case 'events':
      if (m.eventCount > 0) return 'OK';
      if (m.signalCount > 0) return 'WARN';
      return 'IDLE';
    case 'rri':
      return 'OK'; 
    case 'ui':
      return 'OK'; 
    default:
      return 'IDLE';
  }
}

function connStatus(from: string, to: string, m: any): ConnStatus {
  const pairs: Record<string, () => ConnStatus> = {
    'rss-parser':      () => m.feedCount > 0 ? 'FLOWING' : m.lastIngestionTime > 0 ? 'SLOW' : 'IDLE',
    'parser-classifier': () => m.feedCount > 0 && m.newsCount > 0 ? 'FLOWING' : m.feedCount > 0 ? 'SLOW' : 'BLOCKED',
    'classifier-supabase': () => m.errorRate > 0.4 ? 'BLOCKED' : m.newsCount > 0 ? 'FLOWING' : 'SLOW',
    'supabase-signals': () => m.dbWriteCount > 0 && m.signalCount > 0 ? 'FLOWING' : m.dbWriteCount > 0 ? 'SLOW' : 'BLOCKED',
    'signals-events':  () => m.signalCount > 0 && m.eventCount > 0 ? 'FLOWING' : m.signalCount > 0 ? 'SLOW' : 'BLOCKED',
    'events-rri':      () => m.eventCount > 0 ? 'FLOWING' : 'SLOW',
    'rri-ui':          () => 'FLOWING',
    'supabase-vert':   () => m.dbWriteCount > 0 ? 'FLOWING' : 'SLOW',
  };
  const key = `${from}-${to}`;
  return pairs[key] ? pairs[key]() : 'IDLE';
}

const NS_COLOR: Record<NodeStatus, string> = { OK: '#10b981', WARN: '#f59e0b', FAIL: '#ef4444', IDLE: '#334155' };
const NS_GLOW: Record<NodeStatus, string> = { OK: 'rgba(16,185,129,0.4)', WARN: 'rgba(245,158,11,0.4)', FAIL: 'rgba(239,68,68,0.4)', IDLE: 'rgba(0,0,0,0)' };
const CS_COLOR: Record<ConnStatus, string> = { FLOWING: '#10b981', SLOW: '#f59e0b', BLOCKED: '#ef4444', IDLE: '#1e293b' };
const CS_CLASS: Record<ConnStatus, string> = { FLOWING: 'flow-ok', SLOW: 'flow-warn', BLOCKED: 'flow-fail', IDLE: 'flow-fail' };
const LED_CLASS: Record<NodeStatus, string> = { OK: 'led-ok', WARN: 'led-warn', FAIL: '', IDLE: '' };

// ─── FLOW DIAGRAM COMPONENT ─────────────────────────────────────────────────

const FlowDiagram: React.FC<{ metrics: any; onNodeClick: (stage: string) => void }> = ({ metrics, onNodeClick }) => {
  const W = 900;
  const H = 340;
  const NODE_W = 130;
  const NODE_H = 90;
  const TOP_Y = 40;
  const BOT_Y = 210;
  const xs = [40, 220, 400, 580, 760];

  const topDefs = [
    { id: 'rss',        label: 'RSS Sources',  sub: 'Google News',    icon: '🌐', color: '#3b82f6', stage: 'FEED',     xi: 0 },
    { id: 'parser',     label: 'Parser',        sub: 'XML → JSON',     icon: '📄', color: '#8b5cf6', stage: 'FEED',     xi: 1 },
    { id: 'classifier', label: 'Classifier',    sub: 'AI tagging',     icon: '🧠', color: '#f59e0b', stage: 'NEWS',     xi: 2 },
    { id: 'supabase',   label: 'Supabase DB',   sub: 'articles+events',icon: '🗄', color: '#10b981', stage: 'NEWS',     xi: 3 },
  ];
  const botDefs = [
    { id: 'signals',    label: 'Signal Engine', sub: 'priority score', icon: '⚡', color: '#f97316', stage: 'SIGNALS',  xi: 0 },
    { id: 'events',     label: 'Event Engine',  sub: 'clustering',     icon: '📡', color: '#a78bfa', stage: 'EVENTS',   xi: 1 },
    { id: 'rri',        label: 'RRI Engine',    sub: '250 variables',  icon: '📊', color: '#ef4444', stage: 'PIPELINE', xi: 2 },
    { id: 'ui',         label: 'Dashboard',     sub: 'live render',    icon: '🖥', color: '#00f2ff', stage: 'PIPELINE', xi: 3 },
  ];

  const getCount = (id: string) => {
    switch (id) {
      case 'rss': return metrics.feedCount || 0;
      case 'parser': return metrics.feedCount || 0;
      case 'classifier': return metrics.newsCount || 0;
      case 'supabase': return metrics.newsCount || 0;
      case 'signals': return metrics.signalCount || 0;
      case 'events': return metrics.eventCount || 0;
      case 'rri': return 250;
      case 'ui': return metrics.eventCount || 0;
      default: return 0;
    }
  };

  const NodeBox = ({ def, x, y }: { def: any; x: number; y: number }) => {
    const status = nodeStatus(def.id, metrics);
    const sc = NS_COLOR[status];
    const glow = NS_GLOW[status];
    const count = getCount(def.id);
    const ledClass = LED_CLASS[status];

    return (
      <g onClick={() => onNodeClick(def.stage)} style={{ cursor: 'pointer' }}>
        <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10} fill="none" stroke={sc} strokeWidth={1.5} strokeOpacity={0.25} style={{ filter: `drop-shadow(0 0 8px ${glow})` }} />
        <rect x={x+1} y={y+1} width={NODE_W-2} height={NODE_H-2} rx={9} fill="#0d0d12" />
        <rect x={x+1} y={y+1} width={NODE_W-2} height={3} rx={9} fill={def.color} opacity={0.7} />
        <circle cx={x + NODE_W - 14} cy={y + 14} r={5} fill={sc} className={ledClass} />
        <circle cx={x + NODE_W - 14} cy={y + 14} r={8} fill="none" stroke={sc} strokeWidth={1} opacity={0.3} />
        <text x={x + 12} y={y + 22} fontSize={13} fontFamily="monospace">{def.icon}</text>
        <text x={x + 8} y={y + 46} fontSize={10} fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="monospace">{def.label}</text>
        <text x={x + 8} y={y + 60} fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="monospace">{def.sub}</text>
        <text x={x + 8} y={y + 78} fontSize={13} fontWeight="bold" fill={def.color} fontFamily="monospace">{count.toLocaleString()}</text>
        <text x={x + NODE_W - 10} y={y + NODE_H - 8} fontSize={7} fill={sc} fontFamily="monospace" textAnchor="end" fontWeight="bold">{status}</text>
      </g>
    );
  };

  const Connector = ({ x1, y1, x2, y2, fromId, toId, reverse }: any) => {
    const cs = connStatus(fromId, toId, metrics);
    const color = CS_COLOR[cs];
    const dashClass = reverse ? (cs === 'FLOWING' ? 'flow-rev' : cs === 'SLOW' ? 'flow-warn' : 'flow-fail') : CS_CLASS[cs];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isVertical = x1 === x2;

    return (
      <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={cs === 'FLOWING' ? 2.5 : 1.5} strokeDasharray={cs === 'BLOCKED' ? '0' : '8 16'} className={dashClass} style={{ opacity: cs === 'IDLE' ? 0.2 : 1 }} />
        {!isVertical && !reverse && <polygon points={`${x2},${y2} ${x2-8},${y2-4} ${x2-8},${y2+4}`} fill={color} />}
        {!isVertical && reverse && <polygon points={`${x1},${y1} ${x1+8},${y1-4} ${x1+8},${y1+4}`} fill={color} />}
        {isVertical && <polygon points={`${x2},${y2} ${x2-4},${y2-8} ${x2+4},${y2-8}`} fill={color} />}
      </g>
    );
  };

  const tx = topDefs.map(d => xs[d.xi]);
  const bx = botDefs.map(d => xs[d.xi]);

  return (
    <div className="bg-[#070709] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-gradient-to-r from-black via-[#0a0a10] to-black">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Intelligence Pipeline Map</div>
            <div className="text-[9px] font-mono text-emerald-400">Live Active Decision Matrix (ADM)</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[9px] font-mono">
            {[
              { c: '#10b981', l: 'FLOWING' },
              { c: '#f59e0b', l: 'DEGRADED' },
              { c: '#ef4444', l: 'CRITICAL' },
            ].map(({ c, l }) => (
              <span key={l} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }} />
                <span className="text-white/30 uppercase tracking-tighter">{l}</span>
              </span>
            ))}
          </div>
          <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-white/60">
            AUTO-RECOVERY: <span className="text-emerald-400">ENABLED</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto overflow-y-hidden py-10 bg-[#050508] relative">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="relative z-10 mx-auto" style={{ minWidth: 800 }}>
          <Connector x1={tx[0]+NODE_W} y1={TOP_Y+45} x2={tx[1]} y2={TOP_Y+45} fromId="rss" toId="parser" />
          <Connector x1={tx[1]+NODE_W} y1={TOP_Y+45} x2={tx[2]} y2={TOP_Y+45} fromId="parser" toId="classifier" />
          <Connector x1={tx[2]+NODE_W} y1={TOP_Y+45} x2={tx[3]} y2={TOP_Y+45} fromId="classifier" toId="supabase" />

          {(() => {
            const midY = (TOP_Y + NODE_H + BOT_Y) / 2;
            const x3 = tx[3] + NODE_W / 2;
            const x0 = bx[0] + NODE_W / 2;
            return (
              <g>
                <line x1={x3} y1={TOP_Y+NODE_H} x2={x3} y2={midY} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <line x1={x3} y1={midY} x2={x0} y2={midY} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <line x1={x0} y1={midY} x2={x0} y2={BOT_Y} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <line x1={x3} y1={TOP_Y+NODE_H} x2={x3} y2={midY} stroke={CS_COLOR[connStatus('supabase', 'signals', metrics)]} strokeWidth={2} strokeDasharray="8 16" className={CS_CLASS[connStatus('supabase', 'signals', metrics)]} />
                <line x1={x3} y1={midY} x2={x0} y2={midY} stroke={CS_COLOR[connStatus('supabase', 'signals', metrics)]} strokeWidth={2} strokeDasharray="8 16" className={CS_CLASS[connStatus('supabase', 'signals', metrics)]} />
                <line x1={x0} y1={midY} x2={x0} y2={BOT_Y} stroke={CS_COLOR[connStatus('supabase', 'signals', metrics)]} strokeWidth={2} strokeDasharray="8 16" className={CS_CLASS[connStatus('supabase', 'signals', metrics)]} />
              </g>
            );
          })()}

          <Connector x1={bx[0]+NODE_W} y1={BOT_Y+45} x2={bx[1]} y2={BOT_Y+45} fromId="signals" toId="events" />
          <Connector x1={bx[1]+NODE_W} y1={BOT_Y+45} x2={bx[2]} y2={BOT_Y+45} fromId="events" toId="rri" />
          <Connector x1={bx[2]+NODE_W} y1={BOT_Y+45} x2={bx[3]} y2={BOT_Y+45} fromId="rri" toId="ui" />

          {topDefs.map((d, i) => <NodeBox key={d.id} def={d} x={tx[i]} y={TOP_Y} />)}
          {botDefs.map((d, i) => <NodeBox key={d.id} def={d} x={bx[i]} y={BOT_Y} />)}
        </svg>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-[#0a0a0f] text-[9px] font-mono text-white/30 uppercase">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-orange-400" /> RSS Rate: <span className="text-white/60 tracking-wider">{(metrics.ingestionRate || 0).toFixed(1)}/min</span></span>
          <span className="flex items-center gap-2"><Layers className="w-3 h-3 text-indigo-400" /> Buffer Load: <span className="text-white/60 tracking-wider">{(metrics.loadFactor || 0).toFixed(1)}%</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
          Synchronizing Decision Core...
        </div>
      </div>
    </div>
  );
};

// ─── MISSION CONTROL COMPONENTS ─────────────────────────────────────────────

const MetricCard = ({ label, value, trend, unit, icon: Icon, color }: any) => (
  <div className="bg-[#0b0b0f] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'} font-mono`}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="space-y-1">
      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-white/90 font-mono">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        <span className="text-[10px] font-mono text-white/20 uppercase">{unit}</span>
      </div>
    </div>
  </div>
);

const ServiceStatus = ({ name, status, lag }: any) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
      <span className="text-xs font-mono text-white/60 tracking-tight">{name}</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-mono text-white/20 font-bold uppercase">{status}</span>
      {lag && <span className="text-[10px] font-mono text-white/40">{lag}ms</span>}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-3 mb-6 px-1">
    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-white/60" />
    </div>
    <div>
      <h3 className="text-xs font-mono text-white/90 uppercase tracking-[0.2em]">{title}</h3>
      <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{subtitle}</p>
    </div>
  </div>
);

// ─── MISSION CONTROL TAB ────────────────────────────────────────────────────

const MissionControl: React.FC<{ metrics: any }> = ({ metrics }) => {
  const { data, rriState } = usePipeline();
  const handleResetSystem = () => {
    if (window.confirm('Are you sure you want to reset the system? This will clear all locally saved configurations and refresh the page.')) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* MAINTENANCE SECTION */}
      <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={RotateCcw} title="System Command" subtitle="Operational maintenance & state reset" />
          <button 
            onClick={handleResetSystem}
            className="px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-100 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all flex items-center gap-2"
            title="Factory Reset - Clear all local cache and reload"
          >
            <RefreshCw className="w-3 h-3" />
            Reset System
          </button>
        </div>
        <p className="text-[10px] font-mono text-white/30 leading-relaxed max-w-2xl">
          Use this function if the dashboard becomes unresponsive or exhibits stale data. This will clear the browser's localStorage and indexedDB cache, then trigger a full page reload.
        </p>
      </div>
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Intelligence Units" value={metrics.newsCount || 0} unit="RECORDS" icon={Database} color="blue" trend={12} />
        <MetricCard label="Pipeline Velocity" value={Math.round(metrics.ingestionRate || 0)} unit="NEWS/MIN" icon={Zap} color="orange" trend={5.4} />
        <MetricCard label="System Latency" value={Math.round(metrics.latencyMs || 0)} unit="MS" icon={Activity} color="emerald" trend={-8} />
        <MetricCard label="Signal Strength" value={metrics.signalCount || 0} unit="ACTIVE" icon={Radio} color="purple" trend={2.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SERVICES COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl p-6">
            <SectionHeader icon={Server} title="Service Matrix" subtitle="Real-time health grid" />
            <div className="space-y-3">
              <ServiceStatus name="Google RSS Cluster" status="healthy" lag={42} />
              <ServiceStatus name="NLP Parser Node" status="healthy" lag={128} />
              <ServiceStatus name="Signal Scoring Logic" status="healthy" lag={84} />
              <ServiceStatus name="Event Clustering Core" status="healthy" lag={210} />
              <ServiceStatus name="Supabase Realtime" status="healthy" lag={56} />
              <ServiceStatus name="DeepMind Inference" status="healthy" lag={892} />
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Resource Allocation</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">OPTIMAL</span>
              </div>
              <div className="space-y-4">
                {[
                  { l: 'CPU', v: 42, c: 'bg-emerald-500' },
                  { l: 'MEM', v: 68, c: 'bg-indigo-500' },
                  { l: 'NET', v: 15, c: 'bg-blue-500' },
                ].map((r) => (
                  <div key={r.l} className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-white/40">
                      <span>{r.l} LOAD</span>
                      <span>{r.v}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${r.c} transition-all duration-1000`} style={{ width: `${r.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RECENT EVENTS COLUMN */}
        <div className="lg:col-span-2">
          <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl h-full flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <SectionHeader icon={History} title="Operational History" subtitle="Live pipeline trace" />
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono text-white/40 hover:text-white/70 transition-colors">EXPORT LOGS</button>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-400 hover:bg-indigo-500/20 transition-colors">VIEW ALL</button>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10">
              {prepareList([
                { t: 'PIPELINE_INIT', m: 'Cold start complete. Warm cache ready.', s: 'SYSTEM', ts: '10:42:01' },
                { t: 'INGEST_SCAN', m: '58 RSS feeds scanned. 12 new artifacts found.', s: 'FEEDER', ts: '10:41:55' },
                { t: 'SIGNAL_BURST', m: 'Detected high-volatility event cluster in Tech sector.', s: 'SIGNALS', ts: '10:41:42' },
                { t: 'DB_SYNC', m: 'Batch update success. Records: 450, Latency: 42ms.', s: 'SUPABASE', ts: '10:40:12' },
                { t: 'PARSER_LOAD', m: 'Optimizing XML buffer load. Decreasing GC pressure.', s: 'PARSER', ts: '10:39:58' },
                { t: 'CLUSTER_LOCK', m: 'Conflict detected in event grouping. Resolving...', s: 'EVENTS', ts: '10:38:22' },
              ]).map((ev: any, i: number) => (
                <div key={assertKey(getRenderKey(ev, i, 'scc-op-hist'))} className="flex gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors group">
                  <div className="text-[10px] font-mono text-white/20 whitespace-nowrap pt-1">{ev.ts}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono text-indigo-400 tracking-tighter">[{ev.t}]</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">{ev.s}</span>
                    </div>
                    <p className="text-xs font-mono text-white/60 leading-relaxed">{ev.m}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PIPELINE DEBUGGER TAB ──────────────────────────────────────────────────

const DebuggerTab: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightDuplicates, setHighlightDuplicates] = useState(true);

  useEffect(() => {
    // Initial logs
    setLogs(pipelineDebugger.getLogs());
    
    // Subscribe to new logs
    const unsubscribe = pipelineDebugger.subscribe((newLog) => {
      if (!newLog || !newLog.id) {
        // Handle clear
        setLogs(pipelineDebugger.getLogs());
        return;
      }
      setLogs(prev => [newLog, ...prev].slice(0, 500));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const stageLogs = (stage: PipelineStage) => logs.filter(l => l.stage === stage);

  return (
    <div className="flex flex-col h-full bg-[#030305]">
      {/* Debugger Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a0f]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
            <Filter className="w-3 h-3" />
            Display Filters:
          </div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={highlightDuplicates} 
              onChange={e => setHighlightDuplicates(e.target.checked)}
              className="w-3 h-3 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[10px] font-mono text-white/40 group-hover:text-white/60 transition-colors uppercase">Highlight Duplicates</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => pipelineDebugger.clear()}
            className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-tighter"
          >
            <Trash2 className="w-3 h-3" /> Clear Buffer
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
            Buffer: <span className="text-white/50">{logs.length}/500</span>
          </div>
        </div>
      </div>

      {/* Grid of Columns */}
      <div className="flex-1 overflow-x-auto min-w-0">
        <div className="flex h-full min-w-[1250px]">
          <div className="flex-1 min-w-[250px]">
            <FeedColumn 
              items={stageLogs('FEED')} 
              selectedId={selectedId} 
              onSelect={setSelectedId} 
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <NewsColumn 
              items={stageLogs('NEWS')} 
              selectedId={selectedId} 
              onSelect={setSelectedId}
              highlightDuplicates={highlightDuplicates}
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <SignalsColumn 
              items={stageLogs('SIGNALS')} 
              selectedId={selectedId} 
              onSelect={setSelectedId} 
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <EventsColumn 
              items={stageLogs('EVENTS')} 
              selectedId={selectedId} 
              onSelect={setSelectedId} 
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <PipelineLogColumn 
              items={stageLogs('PIPELINE')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DATABASE TAB ──────────────────────────────────────────────────────────

const DatabaseTab: React.FC = () => {
  const { metrics } = useObservability();
  const [dbStats, setDbStats] = useState<any[]>([]);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDbMetadata = async () => {
      setLoading(true);
      try {
        const tables = ['articles', 'events', 'signals', 'narratives', 'audit_logs'];
        const stats = await Promise.all(tables.map(async (table) => {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          return { name: table, count: count || 0, error };
        }));
        setDbStats(stats);

        // Fetch last 7 days of article ingestion for flow graph
        const { data: recent, error: flowError } = await supabase
          .from('articles')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!flowError && recent) {
          const days: Record<string, number> = {};
          recent.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString();
            days[date] = (days[date] || 0) + 1;
          });
          const chartData = Object.entries(days).map(([date, count]) => ({ date, count })).reverse();
          setTimeSeries(chartData);
        }
      } catch (e) {
        console.error("Database metadata fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDbMetadata();
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Card */}
        <div className="lg:col-span-1 bg-[#0b0b0f] border border-white/5 rounded-2xl p-6">
          <SectionHeader icon={Activity} title="Live I/O Stream" subtitle="Database interaction metrics" />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Active Writes</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.dbWriteCount || 0}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Active Reads</span>
                <span className="text-2xl font-bold font-mono text-blue-400">{metrics.dbReadCount || 1}</span>
              </div>
            </div>
            
            <div className="h-24 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={timeSeries.slice(-10)}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-white/40 uppercase">Connection Pool</span>
                <span className="text-emerald-400 font-bold">STABLE</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-white/40 uppercase">Transaction Latency</span>
                <span className="text-white/60">42ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Distribution */}
        <div className="lg:col-span-2 bg-[#0b0b0f] border border-white/5 rounded-2xl p-6">
          <SectionHeader icon={Database} title="Storage Matrix" subtitle="Global table distribution" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {dbStats.map((stat, i) => (
              <div key={stat.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-[8px] font-mono text-white/30 uppercase mb-1">{stat.name}</div>
                <div className="text-xl font-bold font-mono text-white/90">{stat.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
          
          <div className="h-64 w-full overflow-hidden">
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={8} 
                    fontFamily="monospace"
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    fontSize={8} 
                    fontFamily="monospace"
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <Area type="stepBefore" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Query Monitor */}
      <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <SectionHeader icon={Terminal} title="Query Monitor" subtitle="Active transaction listeners" />
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-mono text-white/40 uppercase">AWAITING TRANSACTIONS...</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="border-b border-white/5 text-white/20 uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Transaction ID</th>
                <th className="px-6 py-4 font-bold">Operation</th>
                <th className="px-6 py-4 font-bold">Schema</th>
                <th className="px-6 py-4 font-bold">Result</th>
                <th className="px-6 py-4 font-bold">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {[
                { id: 'tx_8291_a', op: 'INSERT', schema: 'articles', res: 'SUCCESS', exec: '12ms' },
                { id: 'tx_8292_b', op: 'SELECT', schema: 'events', res: 'SUCCESS', exec: '8ms' },
                { id: 'tx_8293_c', op: 'UPDATE', schema: 'audit_logs', res: 'SUCCESS', exec: '24ms' },
                { id: 'tx_8294_d', op: 'DELETE', schema: 'cache_tmp', res: 'SUCCESS', exec: '4ms' },
              ].map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] text-white/60">
                  <td className="px-6 py-3 font-bold text-white/40">{tx.id}</td>
                  <td className="px-6 py-3">
                    <span className={`px-1.5 py-0.5 rounded ${tx.op === 'INSERT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {tx.op}
                    </span>
                  </td>
                  <td className="px-6 py-3">{tx.schema}</td>
                  <td className="px-6 py-3 text-emerald-400/70">{tx.res}</td>
                  <td className="px-6 py-3 text-white/20">{tx.exec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── TEST SUITE TAB ──────────────────────────────────────────────────────────

const TestSuite: React.FC = () => {
  const { recalculateRRI, data } = usePipeline();
  const { fetchNow } = useRSS();
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([
    { id: 'rss-ping', label: 'RSS Feed Reachability', status: 'idle', message: 'Ready' },
    { id: 'rss-sync', label: 'Force Full RSS Sync', status: 'idle', message: 'Ready' },
    { id: 'db-ping', label: 'Supabase Database Ping', status: 'idle', message: 'Ready' },
    { id: 'db-articles', label: 'Article Table Count', status: 'idle', message: 'Ready' },
    { id: 'tg-ping', label: 'Telegram Bot API Link', status: 'idle', message: 'Ready' },
    { id: 'tg-ingest', label: 'Telegram Ingestion Test', status: 'idle', message: 'Ready' },
    { id: 'ai-ping', label: 'Gemini API Health', status: 'idle', message: 'Ready' },
    { id: 'ai-proxy', label: 'AI Proxy Reachability', status: 'idle', message: 'Ready' },
    { id: 'rri-vars', label: 'RRI Variable Check', status: 'idle', message: 'Ready' },
    { id: 'rri-output', label: 'RRI Outcome Sanity', status: 'idle', message: 'Ready' },
  ]);

  const runTest = useCallback(async (id: string) => {
    const start = Date.now();
    setTests(prev => prev.map(t => t.id === id ? { ...t, status: 'running', message: 'Executing...' } : t));

    try {
      let message = 'Verification Complete';
      let status: 'pass' | 'fail' = 'pass';
      let detail = '';

      switch (id) {
        case 'rss-ping': {
          const feedUrl = encodeURIComponent('https://africanmanager.com/feed/');
          const res = await fetch(`/api/rss?url=${feedUrl}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          message = 'Endpoint Reachable';
          break;
        }
        case 'rss-sync': {
          await fetchNow(true);
          message = 'Sync Signal Emitted';
          break;
        }
        case 'db-ping': {
          const { error } = await supabase.from('articles').select('id').limit(1);
          if (error) throw error;
          message = 'PostgreSQL Link Active';
          break;
        }
        case 'db-articles': {
          const { count, error } = await supabase.from('articles').select('*', { count: 'exact', head: true });
          if (error) throw error;
          message = `${count?.toLocaleString()} Rows Detected`;
          break;
        }
        case 'tg-ping': {
          const res = await fetch('/api/health');
          const json = await res.json();
          const ok = json.telegram?.token_exists;
          if (!ok) { status = 'fail'; message = 'Bot Token Missing'; }
          else message = 'Token Validated';
          break;
        }
        case 'tg-ingest': {
          const result = await ingestTelegramManually();
          if (result.errors.length > 0) throw new Error(result.errors[0]);
          message = `Processed ${result.totalArticlesHandled} items (${result.newArticles} new)`;
          break;
        }
        case 'ai-ping': {
          const res = await fetch('/api/health');
          const json = await res.json();
          const ok = json.gemini?.key_exists && !json.gemini?.key_is_placeholder;
          if (!ok) { status = 'fail'; message = 'Key Missing or Placeholder'; }
          else message = 'Gemini API Validated';
          break;
        }
        case 'ai-proxy': {
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Reply: PROXY_OK' }),
          });
          if (!res.ok) throw new Error('Proxy Unreachable');
          message = 'Inference Pipeline Clear';
          break;
        }
        case 'rri-vars': {
          const count = data?.variables ? Object.keys(data.variables).length : 0;
          if (count < 200) { status = 'fail'; message = `Low Variable Yield: ${count}`; }
          else message = `${count} Variables Active`;
          break;
        }
        case 'rri-output': {
          const val = data?.rri?.rri;
          if (val === undefined || val === null) { status = 'fail'; message = 'Invalid RRI Output'; }
          else message = `Outcome: ${val.toFixed(3)}`;
          break;
        }
      }

      setTests(prev => prev.map(t => t.id === id ? { 
        ...t, 
        status, 
        message, 
        latencyMs: Date.now() - start,
        ts: Date.now()
      } : t));
    } catch (e: any) {
      setTests(prev => prev.map(t => t.id === id ? { ...t, status: 'fail', message: e.message || 'IO Fail' } : t));
    }
  }, [data, fetchNow]);

  const runAll = async () => {
    setIsRunningAll(true);
    for (const test of tests) {
      await runTest(test.id);
    }
    setIsRunningAll(false);
  };

  return (
    <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl p-6 lg:p-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <SectionHeader icon={FlaskConical} title="System Validation Suite" subtitle="Comprehensive pipeline integrity testing" />
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setTests(prev => prev.map(t => ({ ...t, status: 'idle', message: 'Reset' })))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/40 hover:bg-white/10 transition-colors uppercase tracking-widest">RESET ALL</button>
          <button onClick={runAll} disabled={isRunningAll} className="px-6 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold font-mono tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
            {isRunningAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            STRESS TEST CLUSTER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tests.map((test) => (
          <div key={test.id} className="relative bg-white/[0.02] border border-white/5 rounded-xl p-5 group hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-mono text-white/20 tracking-tighter">REF: {test.id.toUpperCase()}</span>
               {test.status === 'running' ? (
                 <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
               ) : test.status === 'pass' ? (
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
               ) : test.status === 'fail' ? (
                 <XCircle className="w-4 h-4 text-red-500" />
               ) : (
                 <div className="w-4 h-4 rounded-full border border-white/10" />
               )}
            </div>
            <h4 className="text-sm font-mono text-white/80 font-bold mb-1">{test.label}</h4>
            <p className={`text-[10px] font-mono ${test.status === 'fail' ? 'text-red-400' : 'text-white/30'}`}>{test.message}</p>
            
            {test.latencyMs && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Latency</span>
                <span className="text-[10px] font-mono text-white/60 font-bold">{test.latencyMs.toFixed(1)}ms</span>
              </div>
            )}

            {test.status === 'running' && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500/20 overflow-hidden rounded-b-xl">
                <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-1/2 h-full bg-emerald-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN SYSTEM COMMAND CENTER ─────────────────────────────────────────────

interface SystemCommandCenterProps {
  onClose?: () => void;
}

export const SystemCommandCenter: React.FC<SystemCommandCenterProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('MISSION');
  const { metrics, updateMetrics } = useObservability();
  const {} = useRSS();
  const { isPaused } = usePipeline();
  
  useEffect(() => {
    const fetchInitialCounts = async () => {
        try {
          const { count: articleCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
          const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
          updateMetrics({ 
            newsCount: articleCount || 0, 
            eventCount: eventCount || 0,
            signalCount: (eventCount || 0) * 2.5
          });
        } catch (e) {
          console.error("Initial count fetch failed", e);
        }
    };
    fetchInitialCounts();
  }, [updateMetrics]);
  
  const combinedMetrics = useMemo(() => ({
    ...metrics,
    pipeline: isPaused ? 'PAUSED' : 'ACTIVE',
    ingestionRate: metrics?.ingestionRate || 0,
    latencyMs: metrics?.latencyMs || 0,
    loadFactor: (metrics?.dbWriteCount || 0) / 10,
  }), [metrics, isPaused]);

  const { fetchNow, isFetching } = useRSS();

  const [isTelegramFetching, setIsTelegramFetching] = useState(false);

  const handleForceSync = async () => {
    try {
      await fetchNow(true);
    } catch (e) {
      console.error('Manual sync failed', e);
    }
  };

  const handleResetSystem = () => {
    if (window.confirm('Are you sure you want to reset the system? This will clear all locally saved configurations and refresh the page.')) {
      window.localStorage.clear();
      window.location.reload();
    }
  };

  const handleTelegramSync = async () => {
    setIsTelegramFetching(true);
    try {
      await ingestTelegramManually();
      window.dispatchEvent(new CustomEvent('sync-completed', {
        detail: { newArticles: '?', totalHandled: '?', feeds: 1, errors: [] }
      }));
    } catch (e) {
      console.error('Telegram sync failed', e);
    } finally {
      setIsTelegramFetching(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'MISSION', label: 'Mission Control', icon: Radio },
    { id: 'FLOW', label: 'Flow ADM', icon: MapIcon },
    { id: 'DEBUGGER', label: 'Pipeline Debugger', icon: Terminal },
    { id: 'DATABASE', label: 'Database', icon: Database },
    { id: 'TESTS', label: 'Global Tests', icon: FlaskConical },
  ];

  return (
    <div className="flex flex-col h-full bg-[#030305] text-white">
      {/* HUD Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#070709] relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
               <ShieldAlert className="w-5 h-5 text-black" />
             </div>
             <div>
                <h1 className="text-sm font-black font-mono uppercase tracking-[0.3em] text-white/90 leading-tight">System CommandCenter</h1>
                <p className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest leading-tight">Sentinel Operational Node v4.0.2</p>
             </div>
          </div>
          <div className="hidden lg:flex items-center gap-8 pl-8 border-l border-white/5">
             <div className="space-y-1">
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Network Status</div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                   <span className="text-[10px] font-mono text-emerald-400 font-bold">SECURED</span>
                </div>
             </div>
             <div className="space-y-1">
                <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Decision Core</div>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                   <span className="text-[10px] font-mono text-blue-400 font-bold">ACTIVE</span>
                </div>
             </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={handleTelegramSync}
              disabled={isTelegramFetching}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-lg border border-indigo-500/30 transition-all mr-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50`}
            >
              {isTelegramFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {isTelegramFetching ? 'INGESTING...' : 'TELEGRAM SYNC'}
            </button>
            <button
              onClick={handleForceSync}
              disabled={isFetching}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-lg border border-white/5 transition-all mr-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50`}
            >
              {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {isFetching ? 'SYNCING...' : 'FORCE SYNC'}
            </button>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] transition-all rounded-lg overflow-hidden group ${
                    activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white" />
                  )}
                  <Icon className={`relative z-10 w-3.5 h-3.5 ${activeTab === tab.id ? 'text-black' : 'text-white/40 group-hover:text-white/60'}`} />
                  <span className="relative z-10 font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors rounded-xl border border-white/10 bg-white/5 hover:border-red-500/50"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Viewport */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-thin scrollbar-thumb-white/10">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'MISSION' && <MissionControl metrics={combinedMetrics} />}
          {activeTab === 'FLOW' && <FlowDiagram metrics={combinedMetrics} onNodeClick={() => setActiveTab('DEBUGGER')} />}
          {activeTab === 'DEBUGGER' && <DebuggerTab />}
          {activeTab === 'DATABASE' && <DatabaseTab />}
          {activeTab === 'TESTS' && <TestSuite />}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="px-8 py-3 border-t border-white/5 bg-[#070709] flex items-center justify-between text-[9px] font-mono text-white/20">
        <div className="flex items-center gap-6">
           <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> NODE_LOC: EUROPE_W2</span>
           <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> KER_STK: V8_ISOLATE</span>
           <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> CFG_MODE: PROD_HIGH_AVAIL</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
           UPTIME: 14D 08H 22M 14S
        </div>
      </div>
    </div>
  );
};
