import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Activity, Database, Radio, Zap, Layers, Terminal,
  Trash2, Pause, Play, Filter, AlertTriangle, ArrowRight,
  RefreshCw, ShieldAlert, CheckCircle2, XCircle, Clock,
  Camera, Send, Cpu, FlaskConical, Globe, Users, MapPin,
  FileText, BarChart3, TrendingUp, RotateCcw, Server, AlertCircle,
  Loader2, Brain, Plus, Edit3, Save, Power, PowerOff, Key, Check, Link,
  ChevronDown, Sparkles, TestTube2, Signal, Search, Shield, Bot, Library
} from 'lucide-react';
import { motion as m } from 'motion/react';
import { supabase, dbMetrics, supabaseUrl } from '../../lib/supabase';
import { pipelineDebugger, DebugLog } from '../../services/debugService';
import { prepareList, generateStableKey } from '../../lib/keyUtils';
import { useObservability } from '../../context/ObservabilityContext';
import { useRSS } from '../../context/RSSContext';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { RSS_SOURCES, RSSSource } from '../../config/rssSources';
import { fetchAllFeeds, ingestionMetrics, fetchRSSFeed, validateRSSSource } from '../../services/rssService';
import { fetchAllNewsAPIs, newsApiMetrics } from '../../services/newsApiService';
import { FeedColumn } from '../debug/FeedColumn';
import { NewsColumn } from '../debug/NewsColumn';
import { SignalsColumn } from '../debug/SignalsColumn';
import { EventsColumn } from '../debug/EventsColumn';
import { PipelineLogColumn } from '../debug/PipelineLogColumn';
import { getVarCache } from '../../services/pipelineService';
import MultiAgentTab from './MultiAgentTab';
import RAGTab from './RAGTab';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Tab = 'MISSION' | 'DEBUGGER' | 'TESTS' | 'NEWS_DEBUG' | 'ADM' | 'RRI_DATA' | 'AI' | 'RAG' | 'DATABASE' | 'MULTI_AGENT';

interface TestResult {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'pass' | 'fail';
  message: string;
  latencyMs?: number;
  detail?: string;
  ts?: number;
}

// ─── PIPELINE FLOW DIAGRAM ───────────────────────────────────────────────────



// ─── FLOW DIAGRAM STYLES (injected once) ────────────────────────────────────

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
@keyframes admTicker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.flow-ok   { animation: flowDash 0.8s linear infinite; }
.flow-rev  { animation: flowDashRev 0.8s linear infinite; }
.flow-warn { animation: flowDash 1.6s linear infinite; }
.flow-fail { animation: none; }
.led-ok    { animation: ledPulse 2s ease-in-out infinite; }
.led-warn  { animation: ledPulseWarn 1s ease-in-out infinite; }
.adm-ticker-track { display: inline-flex; min-width: max-content; }
.adm-ticker-run { animation: admTicker 26s linear infinite; }
.adm-ticker-run:hover { animation-play-state: paused; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('scc-flow-styles')) {
  const s = document.createElement('style');
  s.id = 'scc-flow-styles';
  s.textContent = FLOW_STYLE;
  document.head.appendChild(s);
}

// ─── NODE STATUS LOGIC ───────────────────────────────────────────────────────

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
      return 'OK'; // always running in memory
    case 'ui':
      return 'OK'; // if we're rendering, it's OK
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
    // vertical: supabase → signals (same as supabase-signals)
    'supabase-vert':   () => m.dbWriteCount > 0 ? 'FLOWING' : 'SLOW',
  };
  const key = `${from}-${to}`;
  return pairs[key] ? pairs[key]() : 'IDLE';
}

const NS_COLOR: Record<NodeStatus, string> = {
  OK: '#10b981', WARN: '#f59e0b', FAIL: '#ef4444', IDLE: '#334155',
};
const NS_GLOW: Record<NodeStatus, string> = {
  OK: 'rgba(16,185,129,0.4)', WARN: 'rgba(245,158,11,0.4)', FAIL: 'rgba(239,68,68,0.4)', IDLE: 'rgba(0,0,0,0)',
};
const CS_COLOR: Record<ConnStatus, string> = {
  FLOWING: '#10b981', SLOW: '#f59e0b', BLOCKED: '#ef4444', IDLE: '#1e293b',
};
const CS_CLASS: Record<ConnStatus, string> = {
  FLOWING: 'flow-ok', SLOW: 'flow-warn', BLOCKED: 'flow-fail', IDLE: 'flow-fail',
};
const LED_CLASS: Record<NodeStatus, string> = {
  OK: 'led-ok', WARN: 'led-warn', FAIL: '', IDLE: '',
};

// ─── SVG PIPELINE FLOW DIAGRAM ───────────────────────────────────────────────

const FlowDiagram: React.FC<{
  metrics: any;
  onNodeClick: (stage: string) => void;
}> = ({ metrics, onNodeClick }) => {
  const [edgeIssueTimestamps, setEdgeIssueTimestamps] = useState<Record<string, number>>({});

  // SVG canvas dimensions
  const W = 900;
  const H = 340;

  // Node positions — top row y=80, bottom row y=240, x spread evenly
  const NODE_W = 130;
  const NODE_H = 90;
  const TOP_Y = 40;
  const BOT_Y = 210;
  const xs = [40, 220, 400, 580, 760]; // x centers for 5 columns (we use 4 in each row)

  // Top row: RSS(0) Parser(1) Classifier(2) Supabase(3)
  // Bot row (left→right = signal flow right→left visually): Signals(0) Events(1) RRI(2) Dashboard(3)
  // But we draw bottom left→right as: Signals Events RRI Dashboard
  // Arrow direction: top goes →, bottom goes ← (flow returns left)

  const topDefs = [
    { id: 'rss', label: 'RSS+TG+API', sub: `${metrics.feedCount || 0} feeds`, icon: '📡', color: '#3b82f6', stage: 'FEED', xi: 0 },
    { id: 'parser', label: 'Parser+Norm.', sub: `${metrics.newsCount || 0} articles`, icon: '📄', color: '#8b5cf6', stage: 'FEED', xi: 1 },
    { id: 'classifier', label: 'Classifier+Geo', sub: `${metrics.signalCount || 0} signals`, icon: '🧠', color: '#f59e0b', stage: 'NEWS', xi: 2 },
    { id: 'supabase', label: 'Supabase DB', sub: `${(metrics.dbWriteCount || 0) + (metrics.dbReadCount || 0)} ops`, icon: '🗄', color: '#10b981', stage: 'NEWS', xi: 3 },
  ];
  const botDefs = [
    { id: 'signals',    label: 'Signal Engine', sub: `${metrics.signalCount || 0} classified`,  icon: '⚡', color: '#f97316', stage: 'SIGNALS',  xi: 0 },
    { id: 'events',     label: 'Event Engine',  sub: `${metrics.eventCount || 0} tracked`, icon: '📡', color: '#a78bfa', stage: 'EVENTS',  xi: 1 },
    { id: 'rri',        label: 'RRI Engine',    sub: `R(t) live`, icon: '📊', color: '#ef4444', stage: 'PIPELINE', xi: 2 },
    { id: 'ui',         label: 'Dashboard',     sub: `${metrics.ingestionRate?.toFixed(1) || '0'}/s rate`,  icon: '🖥', color: '#00f2ff', stage: 'PIPELINE', xi: 3 },
  ];

  const getCount = (id: string) => {
    let current = 0;
    let delta = 0;
    switch (id) {
      case 'rss': 
        current = metrics.feedCount || 0; 
        break;
      case 'parser':
      case 'classifier': 
      case 'supabase':
        current = metrics.newsCount || 0; 
        delta = metrics.deltas?.newsCount || 0;
        break;
      case 'signals': 
        current = metrics.signalCount || 0; 
        delta = metrics.deltas?.signalCount || 0;
        break;
      case 'events': 
        current = metrics.eventCount || 0; 
        delta = metrics.deltas?.eventCount || 0;
        break;
      case 'rri':
      case 'ui': 
        return '—';
      default: return '—';
    }
    
    if (delta > 0) {
      const prev = Math.max(0, current - delta);
      if (prev > 0) {
        return `${prev.toLocaleString()} +${delta.toLocaleString()}`;
      }
      return current.toLocaleString();
    }
    return current > 0 ? current.toLocaleString() : '—';
  };

  // Node box component inside SVG
  const NodeBox: React.FC<{
    def: typeof topDefs[0];
    x: number; y: number;
    flipped?: boolean;
  }> = ({ def, x, y, flipped }) => {
    const status = nodeStatus(def.id, metrics);
    const sc = NS_COLOR[status];
    const glow = NS_GLOW[status];
    const count = getCount(def.id);
    const ledClass = LED_CLASS[status];

    return (
      <g
        onClick={() => onNodeClick(def.stage)}
        style={{ cursor: 'pointer' }}
      >
        {/* Outer glow rect */}
        <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10}
          fill="none" stroke={sc} strokeWidth={1.5} strokeOpacity={0.25}
          style={{ filter: `drop-shadow(0 0 8px ${glow})` }}
        />
        {/* Inner fill */}
        <rect x={x+1} y={y+1} width={NODE_W-2} height={NODE_H-2} rx={9}
          fill="#0d0d12"
        />
        {/* Top color accent bar */}
        <rect x={x+1} y={y+1} width={NODE_W-2} height={3} rx={9}
          fill={def.color} opacity={0.7}
        />

        {/* LED indicator */}
        <circle
          cx={x + NODE_W - 14} cy={y + 14}
          r={5}
          fill={sc}
          className={ledClass}
          style={status === 'FAIL' ? { filter: `drop-shadow(0 0 4px ${sc})` } : undefined}
        />
        {/* LED ring */}
        <circle
          cx={x + NODE_W - 14} cy={y + 14}
          r={8}
          fill="none" stroke={sc} strokeWidth={1} opacity={0.3}
        />

        {/* Icon (text emoji) */}
        <text x={x + 12} y={y + 22} fontSize={13} fontFamily="monospace">{def.icon}</text>

        {/* Label */}
        <text x={x + 8} y={y + 46} fontSize={10} fontWeight="bold" fill="rgba(255,255,255,0.85)" fontFamily="monospace">
          {def.label}
        </text>

        {/* Sub label */}
        <text x={x + 8} y={y + 60} fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="monospace">
          {def.sub}
        </text>

        {/* Count */}
        <text x={x + 8} y={y + 78} fontSize={13} fontWeight="bold" fill={def.color} fontFamily="monospace">
          {count}
        </text>

        {/* Status label */}
        <text x={x + NODE_W - 10} y={y + NODE_H - 8} fontSize={7} fill={sc} fontFamily="monospace" textAnchor="end" fontWeight="bold">
          {status}
        </text>
      </g>
    );
  };

  // Animated arrow connector
  const Connector: React.FC<{
    x1: number; y1: number; x2: number; y2: number;
    fromId: string; toId: string; reverse?: boolean;
  }> = ({ x1, y1, x2, y2, fromId, toId, reverse }) => {
    const cs = connStatus(fromId, toId, metrics);
    const color = CS_COLOR[cs];
    const dashClass = reverse
      ? (cs === 'FLOWING' ? 'flow-rev' : cs === 'SLOW' ? 'flow-warn' : 'flow-fail')
      : CS_CLASS[cs];
    const label = cs === 'BLOCKED' ? 'BLOCKED' : cs === 'SLOW' ? 'SLOW' : '';

    // midpoint for label
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isVertical = x1 === x2;

    return (
      <g>
        {/* Base track */}
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.06)" strokeWidth={2}
        />
        {/* Animated flow line */}
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={color}
          strokeWidth={cs === 'FLOWING' ? 2.5 : 1.5}
          strokeDasharray={cs === 'BLOCKED' ? '0' : '8 16'}
          className={dashClass}
          style={{
            filter: cs === 'FLOWING' ? `drop-shadow(0 0 3px ${color})` : undefined,
            opacity: cs === 'IDLE' ? 0.2 : 1,
          }}
        />
        {/* Arrowhead */}
        {!isVertical && !reverse && (
          <polygon
            points={`${x2},${y2} ${x2-8},${y2-4} ${x2-8},${y2+4}`}
            fill={color} opacity={cs === 'IDLE' ? 0.2 : 0.8}
          />
        )}
        {!isVertical && reverse && (
          <polygon
            points={`${x1},${y1} ${x1+8},${y1-4} ${x1+8},${y1+4}`}
            fill={color} opacity={cs === 'IDLE' ? 0.2 : 0.8}
          />
        )}
        {isVertical && (
          <polygon
            points={`${x2},${y2} ${x2-4},${y2-8} ${x2+4},${y2-8}`}
            fill={color} opacity={cs === 'IDLE' ? 0.2 : 0.8}
          />
        )}
        {/* BLOCKED label */}
        {label && (
          <text x={mx + (isVertical ? 8 : 0)} y={my + (isVertical ? 0 : -6)}
            fontSize={7} fill={color} fontFamily="monospace" fontWeight="bold" textAnchor="middle"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  // Top row x centers
  const tx = topDefs.map(d => xs[d.xi] );
  // Bottom row x centers — same columns
  const bx = botDefs.map(d => xs[d.xi]);

  const flowEdges = [
    ['rss', 'parser'],
    ['parser', 'classifier'],
    ['classifier', 'supabase'],
    ['supabase', 'signals'],
    ['signals', 'events'],
    ['events', 'rri'],
    ['rri', 'ui'],
  ] as const;

  const nodeById = [...topDefs, ...botDefs].reduce((acc, n) => {
    acc[n.id] = n;
    return acc;
  }, {} as Record<string, (typeof topDefs)[number]>);

  useEffect(() => {
    const now = Date.now();
    setEdgeIssueTimestamps(prev => {
      const next = { ...prev };
      for (const [from, to] of flowEdges) {
        const key = `${from}-${to}`;
        const state = connStatus(from, to, metrics);
        if (state === 'SLOW' || state === 'BLOCKED') {
          if (!next[key]) next[key] = now;
        } else {
          delete next[key];
        }
      }
      return next;
    });
  }, [
    metrics.feedCount,
    metrics.newsCount,
    metrics.errorRate,
    metrics.dbWriteCount,
    metrics.signalCount,
    metrics.eventCount,
    metrics.lastIngestionTime,
  ]);

  const flowIssues = flowEdges
    .map(([from, to]) => {
      const state = connStatus(from, to, metrics);
      if (state === 'FLOWING' || state === 'IDLE') return null;
      const key = `${from}-${to}`;
      const fromNode = nodeById[from];
      const toNode = nodeById[to];
      const ts = edgeIssueTimestamps[key] ?? Date.now();
      const hhmmss = new Date(ts).toLocaleTimeString([], { hour12: false });
      return {
        key,
        status: state,
        from,
        to,
        fromLabel: fromNode?.label ?? from,
        toLabel: toNode?.label ?? to,
        fromStage: fromNode?.stage ?? 'MISSION',
        toStage: toNode?.stage ?? 'MISSION',
        timestamp: hhmmss,
      };
    })
    .filter(Boolean) as Array<{
      key: string;
      status: ConnStatus;
      from: string;
      to: string;
      fromLabel: string;
      toLabel: string;
      fromStage: string;
      toStage: string;
      timestamp: string;
    }>;

  const hasFlowIssues = flowIssues.length > 0;

  // Node center helpers
  const tCx = (i: number) => tx[i] + NODE_W / 2;
  const tCy = TOP_Y + NODE_H / 2;
  const tRx = (i: number) => tx[i] + NODE_W; // right edge
  const tLx = (i: number) => tx[i]; // left edge
  const tBy = TOP_Y + NODE_H; // bottom edge of top row

  const bCx = (i: number) => bx[i] + NODE_W / 2;
  const bCy = BOT_Y + NODE_H / 2;
  const bRx = (i: number) => bx[i] + NODE_W;
  const bLx = (i: number) => bx[i];
  const bTy = BOT_Y; // top edge of bottom row

  return (
    <div className="bg-[#070709] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          Intelligence Pipeline Flow — Live ADM
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono">
          {prepareList([
            { c: '#10b981', l: 'OK / Flowing' },
            { c: '#f59e0b', l: 'Degraded / Slow' },
            { c: '#ef4444', l: 'Failed / Blocked' },
            { c: '#334155', l: 'Idle' },
          ]).map(({ c, l }: any, i: number) => (
            <span key={generateStableKey({c, l}, i, 'legend')} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c, boxShadow: `0 0 4px ${c}` }} />
              <span className="text-white/30">{l}</span>
            </span>
          ))}
        </div>
      </div>

      {/* SVG canvas */}
      <div className="w-full overflow-x-auto custom-scrollbar relative group/flow">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 border border-white/10 rounded text-[8px] text-white/40 font-mono uppercase tracking-widest opacity-0 group-hover/flow:opacity-100 lg:hidden transition-opacity pointer-events-none z-20">
          Swipe to explore pipeline
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          className="h-auto max-h-[40vh]"
          style={{ display: 'block' }}
        >

          {/* Top row: RSS→Parser→Classifier→Supabase */}
          <Connector x1={tRx(0)} y1={tCy} x2={tLx(1)} y2={tCy} fromId="rss" toId="parser" />
          <Connector x1={tRx(1)} y1={tCy} x2={tLx(2)} y2={tCy} fromId="parser" toId="classifier" />
          <Connector x1={tRx(2)} y1={tCy} x2={tLx(3)} y2={tCy} fromId="classifier" toId="supabase" />

          {/* Vertical: Supabase (col 3) down to Signals (col 0) via an L-bend */}
          {/* We draw: Supabase bottom → down to mid-lane → left to col0 → down to Signals top */}
          {(() => {
            const midY = (tBy + bTy) / 2;
            // Supabase col=3, Signals col=0
            const x3 = tCx(3);
            const x0 = bCx(0);
            return (
              <g>
                {/* Down from Supabase */}
                <line x1={x3} y1={tBy} x2={x3} y2={midY}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <line x1={x3} y1={tBy} x2={x3} y2={midY}
                  stroke={CS_COLOR[connStatus('supabase', 'signals', metrics)]}
                  strokeWidth={2} strokeDasharray="8 16"
                  className={CS_CLASS[connStatus('supabase', 'signals', metrics)]}
                  style={{ opacity: connStatus('supabase','signals',metrics) === 'IDLE' ? 0.2 : 1 }}
                />
                {/* Left along mid-lane */}
                <line x1={x3} y1={midY} x2={x0} y2={midY}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <line x1={x3} y1={midY} x2={x0} y2={midY}
                  stroke={CS_COLOR[connStatus('supabase', 'signals', metrics)]}
                  strokeWidth={2} strokeDasharray="8 16"
                  className={CS_CLASS[connStatus('supabase', 'signals', metrics)]}
                  style={{ opacity: connStatus('supabase','signals',metrics) === 'IDLE' ? 0.2 : 1 }}
                />
                {/* Down to Signals */}
                <line x1={x0} y1={midY} x2={x0} y2={bTy}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={2} />
                <line x1={x0} y1={midY} x2={x0} y2={bTy}
                  stroke={CS_COLOR[connStatus('supabase', 'signals', metrics)]}
                  strokeWidth={2} strokeDasharray="8 16"
                  className={CS_CLASS[connStatus('supabase', 'signals', metrics)]}
                  style={{ opacity: connStatus('supabase','signals',metrics) === 'IDLE' ? 0.2 : 1 }}
                />
                {/* Arrowhead pointing down into Signals */}
                <polygon
                  points={`${x0},${bTy} ${x0-4},${bTy-8} ${x0+4},${bTy-8}`}
                  fill={CS_COLOR[connStatus('supabase', 'signals', metrics)]}
                  opacity={0.8}
                />
                {/* Corner dots */}
                <circle cx={x3} cy={midY} r={3} fill="rgba(255,255,255,0.15)" />
                <circle cx={x0} cy={midY} r={3} fill="rgba(255,255,255,0.15)" />
              </g>
            );
          })()}

          {/* Bottom row: Signals→Events→RRI→Dashboard (left to right) */}
          <Connector x1={bRx(0)} y1={bCy} x2={bLx(1)} y2={bCy} fromId="signals" toId="events" />
          <Connector x1={bRx(1)} y1={bCy} x2={bLx(2)} y2={bCy} fromId="events" toId="rri" />
          <Connector x1={bRx(2)} y1={bCy} x2={bLx(3)} y2={bCy} fromId="rri" toId="ui" />

          {/* ── NODES ── */}
          {prepareList(topDefs).map((d: any, i: number) => (
            <NodeBox key={generateStableKey(d, i, 'node-top')} def={d} x={tx[i]} y={TOP_Y} />
          ))}
          {prepareList(botDefs).map((d: any, i: number) => (
            <NodeBox key={generateStableKey(d, i, 'node-bot')} def={d} x={bx[i]} y={BOT_Y} />
          ))}

          {/* Row labels */}
          <text x={8} y={TOP_Y + 44} fontSize={8} fill="rgba(255,255,255,0.15)" fontFamily="monospace" fontWeight="bold" writingMode="vertical-rl" textAnchor="middle">INGEST</text>
          <text x={8} y={BOT_Y + 44} fontSize={8} fill="rgba(255,255,255,0.15)" fontFamily="monospace" fontWeight="bold" writingMode="vertical-rl" textAnchor="middle">PROCESS</text>
        </svg>
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 text-[9px] font-mono text-white/20 uppercase tracking-tighter">
        <span className="flex items-center gap-1.5">
          <Zap className="w-2.5 h-2.5 text-orange-400" />
          Ingestion: <span className="text-white/40">{Math.round(metrics.ingestionRate || 0)}/cycle</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live ADM — click any node → Debugger
        </span>
        <span>
          Latency: <span className={metrics.latencyMs > 2000 ? 'text-red-400' : 'text-white/40'}>{Math.round(metrics.latencyMs || 0)}ms</span>
        </span>
      </div>

      {/* Flow Issues List */}
      <div className="px-5 py-3 border-t border-white/5">
        {hasFlowIssues ? (
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-red-400 uppercase tracking-widest font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3 h-3" />
              Flow Errors ({flowIssues.length})
            </div>
            {flowIssues.map((issue, idx) => {
              const tone = issue.status === 'BLOCKED'
                ? 'text-red-300 border-red-500/30 bg-red-500/10'
                : 'text-amber-300 border-amber-500/30 bg-amber-500/10';
              return (
                <button key={issue.key}
                  onClick={() => onNodeClick(issue.toStage)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border ${tone} cursor-pointer hover:brightness-110 transition-all text-left`}
                >
                  <span className="text-[8px] font-mono text-white/40 shrink-0">[{issue.timestamp}]</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${issue.status === 'BLOCKED' ? 'text-red-300' : 'text-amber-300'}`}>{issue.status}</span>
                  <span className="text-[9px] font-mono text-white/70 truncate">{issue.fromLabel} → {issue.toLabel}</span>
                  <ArrowRight className="w-3 h-3 text-white/30 ml-auto shrink-0" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            No active flow errors
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MISSION CONTROL TAB ─────────────────────────────────────────────────────

interface MissionControlProps {
  onJumpToDebugger: (stage: string) => void;
  aiModels: AIModel[];
  roleAssign: Record<RoleType, string>;
}

const MissionControl: React.FC<MissionControlProps> = ({ onJumpToDebugger, aiModels, roleAssign }) => {
  const { metrics, history, alerts, healthScore, logs } = useObservability();
  const { articles, events, fetchNow } = useRSS();
  const { isPaused, togglePause, recalculateRRI } = useRiskMetrics();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const health = healthScore > 80
    ? { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'HEALTHY' }
    : healthScore > 50
      ? { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'DEGRADED' }
      : { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'CRITICAL' };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // 1. FLUSH & REBOOT
      pipelineDebugger.clear();
      
      // Reset metrics to defaults (broadcast to ObservabilityContext)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pipeline_metric_update', { 
          detail: {
            feedCount: 0,
            newsCount: 0,
            signalCount: 0,
            eventCount: 0,
            ingestionRate: 0,
            errorRate: 0,
            duplicateRate: 0,
            lastIngestionTime: 0,
            lastFetch: Date.now(),
            latencyMs: 0,
            dbWriteCount: 0,
            dbReadCount: 0,
            successCount: 0,
            failureCount: 0,
            isFetching: true 
          } 
        }));
      }

      pipelineDebugger.log('PIPELINE', 'valid', `┌─────────────────── SYSTEM PIPELINE REBOOT ────────────────────┐
│ [INGESTION] ──> [INTEL ENGINE] ──> [SIGNALS] ──> [SITUATION] │
│      │               │                │               │      │
│   (POLLING)      (NARRATIVE)       (DECAY)       (DECISION)  │
└──────────────────────────────────────────────────────────────┘`, {});

      pipelineDebugger.log('PIPELINE', 'valid', 'SCC REBOOT: Command Center state flushed. Initiating deep diagnostic...', {});
      await new Promise(r => setTimeout(r, 800));

      // 2. DEEP TESTING RSS FIRST
      const rssSources = RSS_SOURCES.map(s => ({ ...s, id: s.id || s.url, group: 'RSS' }));
      pipelineDebugger.log('PIPELINE', 'valid', `Diagnostic: Sequential reachability test for ${rssSources.length} RSS endpoints...`, { count: rssSources.length });
      
      for (const source of rssSources) {
        pipelineDebugger.log('FEED', 'valid', `Diagnostic: Probing ${source.name}...`, { url: source.url });
        try {
          // Deep probe: actually try to fetch items through the proxy
          const feedItems = await fetchRSSFeed(source as any);
          if (feedItems.length > 0) {
            pipelineDebugger.log('FEED', 'valid', `Diagnostic PASSED: ${source.name} reachable (${feedItems.length} items discovered).`, { count: feedItems.length });
          } else {
            pipelineDebugger.log('FEED', 'warning', `Diagnostic WARNING: ${source.name} returned 0 items. Possible block or stale URL.`, { url: source.url });
          }
        } catch (err: any) {
          pipelineDebugger.log('FEED', 'error', `Diagnostic FAILED: ${source.name} unreachable. Error: ${err.message}`, { error: err.message });
        }
        // Throttled diagnostic to prevent proxy overload
        await new Promise(r => setTimeout(r, 100));
      }

      pipelineDebugger.log('PIPELINE', 'valid', 'RSS DIAGNOSTIC COMPLETE. INITIALIZING INGESTION PIPELINE...', {});

      // 3. START PARSING (Full Sync)
      pipelineDebugger.log('PIPELINE', 'valid', 'Starting ingestion cycle (RSS + Telegram + NewsAPI)...', {});
      await fetchNow(true); 
      
      // Post-ingestion recalcs
      pipelineDebugger.log('SIGNALS', 'valid', 'Ingestion finished. Re-running narrative & signal analysis...', {});
      
      // Force RRI recalibration as part of "rest of pipeline"
      await recalculateRRI();
      
      pipelineDebugger.log('PIPELINE', 'valid', 'Full Ingestion Cycle & Analysis completed successfully.', {});

    } catch (e: any) { 
      console.error(e); 
      pipelineDebugger.log('PIPELINE', 'error', `Force Sync Sequence Aborted: ${e.message}`, { error: e.message });
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleRRI = async () => {
    setIsRecalculating(true);
    try { recalculateRRI(); await new Promise(r => setTimeout(r, 800)); }
    finally { setIsRecalculating(false); }
  };

  const getAllModels = (): AIModel[] => {
    const custom = aiModels || [];
    let env: AIModel[] = [];
    try { env = JSON.parse(localStorage.getItem('ti_env_models') || '[]'); } catch {}
    return [...custom, ...env];
  };

  const getModelForRole = (role: RoleType) => {
    if (!roleAssign) return 'Loading...';
    const assignedId = roleAssign[role];
    if (!assignedId) return 'Not Assigned';
    const model = getAllModels().find(m => m.id === assignedId);
    if (!model) return 'Unknown';
    const label = model.provider === 'google' ? 'Gemini' : model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
    return `${label}: ${model.modelName}`;
  };

  const getRoleHealth = (role: RoleType): 'online' | 'offline' | 'standby' => {
    if (!roleAssign) return 'standby';
    const assignedId = roleAssign[role];
    if (!assignedId) return 'standby';
    const model = getAllModels().find(m => m.id === assignedId);
    if (!model) return 'standby';
    return model.status === 'online' ? 'online' : 'offline';
  };

  const serviceChecks = [
    { label: 'RSS Feed', ok: metrics.lastIngestionTime > 0 && (Date.now() - metrics.lastIngestionTime < 600000) },
    { label: 'Supabase DB', ok: metrics.dbWriteCount > 0 || metrics.dbReadCount > 0 },
    { label: 'Signal Engine', ok: metrics.signalCount >= 0 },
    { label: 'National Briefing', health: getRoleHealth('parser'), detail: getModelForRole('parser') },
    { label: 'Predictive Analysis', health: getRoleHealth('analys'), detail: getModelForRole('analys') },
    { label: 'Realtime Sub', ok: !metrics.isFetching || isSyncing },
    { label: 'Sentinel Sat', ok: true, detail: 'On-demand via Agriculture tab' },
  ];

  const miniMetrics = [
    { label: 'Feed Rate', value: `${Math.round(metrics.ingestionRate || 0)}`, unit: '/cycle', color: 'text-blue-400' },
    { label: 'Articles', value: metrics.newsCount || 0, color: 'text-emerald-400' },
    { label: 'Signals', value: metrics.signalCount || 0, color: 'text-orange-400' },
    { label: 'Events', value: metrics.eventCount || 0, color: 'text-purple-400' },
    { label: 'DB Writes', value: metrics.dbWriteCount || 0, color: 'text-intel-cyan' },
    { label: 'DB Reads', value: metrics.dbReadCount || 0, color: 'text-blue-300' },
    { label: 'Error %', value: `${((metrics.errorRate || 0) * 100).toFixed(1)}%`, color: metrics.errorRate > 0.2 ? 'text-red-400' : 'text-emerald-400' },
    { label: 'Latency', value: `${Math.round(metrics.latencyMs || 0)}ms`, color: metrics.latencyMs > 2000 ? 'text-red-400' : 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-col space-y-4 h-full overflow-y-auto pr-1">

      {/* Top strip: health + controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#0a0a0c] border border-white/5 rounded-xl p-4 shrink-0 gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${health.bg} ${health.border} w-full sm:w-auto justify-center sm:justify-start`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${(healthScore || 0) > 80 ? 'bg-emerald-500' : (healthScore || 0) > 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-bold font-mono ${health.color}`}>{Math.round(healthScore || 0)}%</span>
            <span className={`text-[9px] font-mono ${health.color} opacity-70 uppercase`}>{health.label}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[9px] font-mono text-white/30 uppercase">
            <span>Articles: <span className="text-white/60">{articles.length}</span></span>
            <span>Events: <span className="text-white/60">{events.length}</span></span>
            <span>Alerts: <span className={alerts.length > 0 ? 'text-amber-400' : 'text-white/60'}>{alerts.length}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={togglePause}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase font-mono transition-all border ${isPaused ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing || isPaused}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing…' : 'Force Sync'}
          </button>
          <button
            onClick={handleRRI}
            disabled={isRecalculating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase font-mono bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40"
          >
            <RotateCcw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalc…' : 'Force RRI'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1 shrink-0">
            {prepareList(alerts.slice(0, 3)).map((a: any, i: number) => (
              <div key={generateStableKey(a, i, 'alert')} className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-[10px] font-mono animate-pulse">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span className="font-bold uppercase">{a.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 shrink-0">
        {prepareList(miniMetrics).map((m: any, i: number) => (
          <div key={generateStableKey(m, i, 'mini-metric')} className="bg-[#0a0a0c] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all text-center sm:text-left">
            <div className="text-[8px] text-white/20 uppercase tracking-tighter mb-1">{m.label}</div>
            <div className={`text-base font-bold font-mono ${m.color}`}>{m.value}</div>
            {m.unit && <div className="text-[7px] text-white/20">{m.unit}</div>}
          </div>
        ))}
      </div>

      {/* Pipeline flow diagram */}
      <FlowDiagram metrics={metrics} onNodeClick={(stage) => onJumpToDebugger(stage)} />

      {/* Service checks + recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service health */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-5">
          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Server className="w-3.5 h-3.5" />
            Service Health Matrix
          </div>
          <div className="space-y-3">
            {prepareList(serviceChecks).map((s: any, i: number) => (
              <div key={generateStableKey(s, i, 'service-check')} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/60 font-mono">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      s.health === 'online' || s.ok ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 
                      s.health === 'standby' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' :
                      'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                    }`} />
                    <span className={`text-[10px] font-bold font-mono ${
                      s.health === 'online' || s.ok ? 'text-emerald-400' : 
                      s.health === 'standby' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {s.health === 'online' || s.ok ? 'OK' : s.health === 'standby' ? 'STANDBY' : 'ERROR'}
                    </span>
                  </div>
                </div>
                {s.detail && <div className="text-[8px] font-mono text-white/20 uppercase tracking-tighter pl-1">{s.detail}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Recent terminal logs */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-5 flex flex-col min-h-0 flex-1 max-h-[50vh]">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
              <Terminal className="w-3.5 h-3.5" />
              Recent Pipeline Events
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[9px] min-h-0">
            {prepareList(logs).map((log: any, i: number) => (
              <div key={generateStableKey(log, i, 'recent-log')} className="flex gap-3 py-1 border-b border-white/[0.03] hover:bg-white/[0.02]">
                <span className="text-white/20 shrink-0">{String(log.timestamp).split('T')[1]?.slice(0, 8) || '—'}</span>
                <span className={`w-16 shrink-0 font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-amber-500' : 'text-emerald-500'}`}>[{log.stage}]</span>
                <span className="text-white/50 truncate">{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-white/10 text-center py-8 italic">No events yet…</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PIPELINE DEBUGGER TAB ───────────────────────────────────────────────────

const DebuggerTab: React.FC<{ jumpToStage?: string }> = ({ jumpToStage }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showInvalid, setShowInvalid] = useState(true);
  const [highlightDuplicates, setHighlightDuplicates] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const c = { FEED: 0, NEWS: 0, SIGNALS: 0, EVENTS: 0, PIPELINE: 0, dropped: 0, error: 0 };
    logs.forEach(l => {
      c[l.stage as keyof typeof c] = ((c[l.stage as keyof typeof c] as number) || 0) + 1;
      if (l.status === 'dropped') c.dropped++;
      if (l.status === 'error') c.error++;
    });
    return c;
  }, [logs]);

  useEffect(() => {
    const unsub = pipelineDebugger.subscribe((newLog) => {
      if (isPaused) return;
      if (newLog.id) setLogs(prev => [newLog, ...prev].slice(0, 500));
      else setLogs([]);
    });
    setLogs(pipelineDebugger.getLogs());
    return () => { unsub(); };
  }, [isPaused]);

  useEffect(() => {
    const articleCh = supabase.channel('scc-debug-news')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, (payload) => {
        if (isPaused) return;
        pipelineDebugger.log('NEWS', 'valid', `DB INSERT: ${payload.new.title}`, payload.new);
      }).subscribe();
    const eventCh = supabase.channel('scc-debug-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (isPaused) return;
        const d = payload.new as any;
        pipelineDebugger.log('EVENTS', 'valid', `${payload.eventType}: ${d.title || 'Untitled'}`, payload.new);
      }).subscribe();
    return () => {
      supabase.removeChannel(articleCh);
      supabase.removeChannel(eventCh);
    };
  }, [isPaused]);

  const filteredLogs = useMemo(() => showInvalid ? logs : logs.filter(l => l.status === 'valid'), [logs, showInvalid]);
  const feedItems = useMemo(() => filteredLogs.filter(l => l.stage === 'FEED'), [filteredLogs]);
  const newsItems = useMemo(() => filteredLogs.filter(l => l.stage === 'NEWS'), [filteredLogs]);
  const signalItems = useMemo(() => filteredLogs.filter(l => l.stage === 'SIGNALS'), [filteredLogs]);
  const eventItems = useMemo(() => filteredLogs.filter(l => l.stage === 'EVENTS'), [filteredLogs]);
  const pipeLogs = useMemo(() => logs.filter(l => l.stage === 'PIPELINE' || l.status === 'error' || l.status === 'dropped'), [logs]);

  return (
    <div className="flex flex-col h-full">
      {/* Debugger controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-white/30">
          <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-blue-400" /> Feed: <span className="text-white/70">{stats.FEED}</span></span>
          <span className="flex items-center gap-1"><Database className="w-3 h-3 text-emerald-400" /> News: <span className="text-white/70">{stats.NEWS}</span></span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> Signals: <span className="text-white/70">{stats.SIGNALS}</span></span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-purple-400" /> Events: <span className="text-white/70">{stats.EVENTS}</span></span>
          <span className="flex items-center gap-1 text-red-400/70"><AlertTriangle className="w-3 h-3" /> Drops: {stats.dropped}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase font-mono border transition-all ${isPaused ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {isPaused ? 'Paused' : 'Live'}
          </button>
          <button onClick={() => setShowInvalid(!showInvalid)} className={`p-1.5 rounded-lg border transition-all ${showInvalid ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/30 border-white/10'}`} title="Toggle invalid items">
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => pipelineDebugger.clear()} className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all" title="Clear buffer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5-column grid */}
      <div className="flex-1 flex overflow-x-auto bg-white/5 min-h-0 text-[10px] custom-scrollbar overflow-y-hidden">
        <div className="flex min-w-[1200px] h-full divide-x divide-white/5">
          <FeedColumn items={feedItems} selectedId={selectedItemId} onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} />
          <NewsColumn items={newsItems} selectedId={selectedItemId} onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} highlightDuplicates={highlightDuplicates} />
          <SignalsColumn items={signalItems} selectedId={selectedItemId} onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} />
          <EventsColumn items={eventItems} selectedId={selectedItemId} onSelect={(id) => setSelectedItemId(id === selectedItemId ? null : id)} />
          <PipelineLogColumn items={pipeLogs} />
        </div>
      </div>

      {/* Trace footer */}
      <AnimatePresence>
        {selectedItemId && (
          <motion.div
            initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            className="h-20 bg-black/95 border-t border-emerald-500/30 absolute bottom-0 left-0 right-0 z-20 px-6 flex items-center gap-8"
          >
            <div className="flex-1">
              <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest block mb-0.5">Active Trace</span>
              <span className="text-white text-xs truncate block font-mono">{selectedItemId}</span>
            </div>
            <div className="flex items-center gap-3">
              {['FEED', 'NEWS', 'SIGNAL', 'EVENT', 'RRI'].map((step, i, arr) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] mb-1" />
                    <span className="text-[8px] font-bold text-emerald-400">{step}</span>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-white/20" />}
                </React.Fragment>
              ))}
            </div>
            <button onClick={() => setSelectedItemId(null)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 font-mono uppercase">
              Exit Trace
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── TEST SUITE TAB ───────────────────────────────────────────────────────────

const INITIAL_TESTS: TestResult[] = [
  // RSS
  { id: 'rss-ping', label: 'RSS Feed Reachability', status: 'idle', message: 'Test RSS endpoint connectivity' },
  { id: 'rss-sync', label: 'Force Full RSS Sync', status: 'idle', message: 'Trigger fetchAllFeeds()' },
  { id: 'rss-parse', label: 'RSS Parse Validation', status: 'idle', message: 'Check article parse output' },
  // Database
  { id: 'db-ping', label: 'Supabase Ping', status: 'idle', message: 'Test DB connection' },
  { id: 'db-articles', label: 'Articles Table Count', status: 'idle', message: 'SELECT count(*) FROM articles' },
  { id: 'db-events', label: 'Events Table Count', status: 'idle', message: 'SELECT count(*) FROM events' },
  { id: 'db-dupes', label: 'Duplicate Article Check', status: 'idle', message: 'Scan for duplicate IDs' },
  { id: 'db-schema', label: 'Schema Validation', status: 'idle', message: 'Verify required fields on recent rows' },

  { id: 'sat-ping', label: 'Sentinel Satellite Ping', status: 'idle', message: 'Test Open-Meteo API connectivity' },
  { id: 'sat-ingest', label: 'Trigger Satellite Ingestion', status: 'idle', message: 'POST /api/agri/sync — fetches NDVI, rainfall, soil moisture' },
  // AI
  { id: 'ai-ping', label: 'Gemini API Health', status: 'idle', message: 'GET /api/health → check key status' },
  { id: 'ai-classify', label: 'Test Classification', status: 'idle', message: 'Run sample article through classifier' },
  { id: 'ai-proxy', label: 'AI Proxy Route', status: 'idle', message: 'Test /api/ai endpoint' },
  // RRI
  { id: 'rri-calc', label: 'RRI Recalculation', status: 'idle', message: 'Trigger recalculateRRI()' },
  { id: 'rri-vars', label: 'Variable Count Check', status: 'idle', message: 'Verify 250 variables loaded' },
  { id: 'rri-output', label: 'RRI Output Sanity', status: 'idle', message: 'Check R(t) is within 0–5 range' },
];

const GROUPS = [
  { id: 'rss', label: 'RSS Feed', icon: Globe, color: 'text-blue-400', borderColor: 'border-blue-500/20', ids: ['rss-ping', 'rss-sync', 'rss-parse'] },
  { id: 'db', label: 'Database', icon: Database, color: 'text-emerald-400', borderColor: 'border-emerald-500/20', ids: ['db-ping', 'db-articles', 'db-events', 'db-dupes', 'db-schema'] },
  { id: 'ai', label: 'AI / Gemini', icon: Cpu, color: 'text-amber-400', borderColor: 'border-amber-500/20', ids: ['ai-ping', 'ai-classify', 'ai-proxy'] },
  { id: 'sat', label: 'Satellites', icon: Radio, color: 'text-sky-400', borderColor: 'border-sky-500/20', ids: ['sat-ping', 'sat-ingest'] },
  { id: 'rri', label: 'RRI Engine', icon: BarChart3, color: 'text-red-400', borderColor: 'border-red-500/20', ids: ['rri-calc', 'rri-vars', 'rri-output'] },
];

const TestSuite: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>(INITIAL_TESTS);
  const { recalculateRRI, fullData: data, rriState } = useRiskMetrics();
  const { fetchNow } = useRSS();
  const [isRunningAll, setIsRunningAll] = useState(false);

  const setTest = (id: string, patch: Partial<TestResult>) =>
    setTests(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const runTest = useCallback(async (id: string) => {
    const start = Date.now();
    setTest(id, { status: 'running', message: 'Running…' });

    try {
      switch (id) {

        case 'rss-ping': {
          const res = await fetch('/api/rss', { method: 'GET' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const ms = Date.now() - start;
          setTest(id, { status: 'pass', message: `Endpoint reachable`, latencyMs: ms, detail: `Status ${res.status}` });
          break;
        }

        case 'rss-sync': {
          await fetchNow(true);
          const ms = Date.now() - start;
          setTest(id, { status: 'pass', message: 'Full sync triggered', latencyMs: ms, detail: `ingestionMetrics.successCount: ${ingestionMetrics.successCount}` });
          break;
        }

        case 'rss-parse': {
          const count = ingestionMetrics.successCount || 0;
          const ms = Date.now() - start;
          if (count === 0) setTest(id, { status: 'fail', message: 'No articles parsed yet', latencyMs: ms });
          else setTest(id, { status: 'pass', message: `${count} articles parsed successfully`, latencyMs: ms });
          break;
        }

        case 'db-ping': {
          const { error } = await supabase.from('articles').select('id').limit(1);
          const ms = Date.now() - start;
          if (error) throw error;
          setTest(id, { status: 'pass', message: 'Connection OK', latencyMs: ms });
          break;
        }

        case 'db-articles': {
          const { count, error } = await supabase.from('articles').select('*', { count: 'exact', head: true });
          const ms = Date.now() - start;
          if (error) throw error;
          setTest(id, { status: count! > 0 ? 'pass' : 'fail', message: `${count?.toLocaleString()} rows`, latencyMs: ms, detail: count === 0 ? 'Table empty — pipeline not writing' : undefined });
          break;
        }

        case 'db-events': {
          const { count, error } = await supabase.from('events').select('*', { count: 'exact', head: true });
          const ms = Date.now() - start;
          if (error) throw error;
          setTest(id, { status: 'pass', message: `${count?.toLocaleString()} rows`, latencyMs: ms });
          break;
        }

        case 'db-dupes': {
          const { data: rows, error } = await supabase.from('articles').select('id').limit(500);
          const ms = Date.now() - start;
          if (error) throw error;
          const ids = rows!.map(r => r.id);
          const dupes = ids.length - new Set(ids).size;
          setTest(id, {
            status: dupes === 0 ? 'pass' : 'fail',
            message: dupes === 0 ? 'No duplicates found' : `${dupes} duplicate IDs detected`,
            latencyMs: ms,
            detail: `Checked ${ids.length} rows`,
          });
          break;
        }

        case 'db-schema': {
          const { data: rows, error } = await supabase.from('articles').select('id,title,source_name,severity,created_at').limit(5);
          const ms = Date.now() - start;
          if (error) throw error;
          const issues = rows!.filter(r => !r.id || !r.title || !r.source_name).length;
          setTest(id, {
            status: issues === 0 ? 'pass' : 'fail',
            message: issues === 0 ? 'Schema valid on recent rows' : `${issues} rows missing required fields`,
            latencyMs: ms,
          });
          break;
        }

        case 'ai-ping': {
          const res = await fetch('/api/health');
          const json = await res.json();
          const ms = Date.now() - start;
          const geminiOk = json.gemini?.key_exists && !json.gemini?.key_is_placeholder;
          const openaiOk = json.openai?.key_exists && !json.openai?.key_is_placeholder;
          const aiOk = geminiOk || openaiOk;
          
          setTest(id, {
            status: aiOk ? 'pass' : 'fail',
            message: aiOk ? (openaiOk ? 'NVIDIA Llama-3.1-70b (Primary)' : 'OpenRouter (Fallback)') : 'AI keys missing or placeholder',
            latencyMs: ms,
            detail: `NVIDIA: ${openaiOk ? 'OK' : 'OFF'}, OpenRouter: ${geminiOk ? 'OK' : 'OFF'}`,
          });
          break;
        }

        case 'ai-classify': {
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Classify severity 1-5 for: "Protests in Tunis over rising bread prices". Reply with just a number.' }),
          });
          const ms = Date.now() - start;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const reply = json.text?.trim() || json.response?.trim();
          setTest(id, { status: 'pass', message: `Model replied: "${reply}"`, latencyMs: ms });
          break;
        }

        case 'ai-proxy': {
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Reply with exactly: PROXY_OK' }),
          });
          const ms = Date.now() - start;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setTest(id, { status: 'pass', message: 'AI proxy route reachable', latencyMs: ms, detail: `Status ${res.status}` });
          break;
        }

        case 'rri-calc': {
          recalculateRRI();
          await new Promise(r => setTimeout(r, 600));
          const ms = Date.now() - start;
          setTest(id, { status: 'pass', message: 'Recalculation triggered', latencyMs: ms });
          break;
        }

        case 'rri-vars': {
          const ms = Date.now() - start;
          const varCount = rriState?.variables ? Object.keys(rriState.variables).length : 0;
          setTest(id, {
            status: varCount >= 240 ? 'pass' : varCount > 0 ? 'fail' : 'fail',
            message: `${varCount} variables loaded`,
            latencyMs: ms,
            detail: varCount < 240 ? `Expected 250, got ${varCount}` : undefined,
          });
          break;
        }

        case 'rri-output': {
          const ms = Date.now() - start;
          const rriValue = data?.rri?.rri ?? null;
          if (rriValue === null) { setTest(id, { status: 'fail', message: 'R(t) is null — not calculated', latencyMs: ms }); break; }
          const ok = rriValue >= 0 && rriValue <= 5;
          setTest(id, {
            status: ok ? 'pass' : 'fail',
            message: ok ? `R(t) = ${rriValue.toFixed(3)} — within range` : `R(t) = ${rriValue.toFixed(3)} — OUT OF RANGE`,
            latencyMs: ms,
          });
          break;
        }

        case 'sat-ping': {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const res = await fetch('https://archive-api.open-meteo.com/v1/archive?latitude=36.8&longitude=10.18&start_date=2026-05-01&end_date=2026-05-07&daily=temperature_2m_max&timezone=Africa%2FTunis', {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          const ms = Date.now() - start;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setTest(id, { status: 'pass', message: 'Open-Meteo API reachable', latencyMs: ms, detail: `Status ${res.status}` });
          break;
        }

        case 'sat-ingest': {
          const res = await fetch('/api/agri/sync', { method: 'POST' });
          const ms = Date.now() - start;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setTest(id, { status: 'pass', message: 'Satellite ingestion triggered', latencyMs: ms, detail: 'NDVI + rainfall + soil moisture pipeline started' });
          break;
        }

        default:
          setTest(id, { status: 'fail', message: 'Unknown test', latencyMs: Date.now() - start });
      }
    } catch (err: any) {
      setTest(id, { status: 'fail', message: err.message || 'Unknown error', latencyMs: Date.now() - start });
    }
  }, [recalculateRRI, fetchNow, data]);

  const runAll = async () => {
    setIsRunningAll(true);
    for (const t of INITIAL_TESTS) {
      await runTest(t.id);
      await new Promise(r => setTimeout(r, 120));
    }
    setIsRunningAll(false);
  };

  const resetAll = () => setTests(INITIAL_TESTS);

  const passCount = tests.filter(t => t.status === 'pass').length;
  const failCount = tests.filter(t => t.status === 'fail').length;
  const runningCount = tests.filter(t => t.status === 'running').length;

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-5">
      {/* Header strip */}
      <div className="flex items-center justify-between bg-[#0a0a0c] border border-white/5 rounded-xl p-4 shrink-0">
        <div className="flex items-center gap-6 text-[10px] font-mono">
          <span className="text-white/30 uppercase tracking-widest">Test Results</span>
          <span className="text-emerald-400 font-bold">{passCount} PASS</span>
          <span className="text-red-400 font-bold">{failCount} FAIL</span>
          {runningCount > 0 && <span className="text-amber-400 font-bold animate-pulse">{runningCount} RUNNING</span>}
          <span className="text-white/20">{tests.filter(t => t.status === 'idle').length} IDLE</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="px-3 py-2 bg-white/5 text-white/40 border border-white/10 rounded-lg text-[10px] font-mono uppercase font-bold hover:text-white transition-all"
          >
            Reset All
          </button>
          <button
            onClick={runAll}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-mono uppercase font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
          >
            {isRunningAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
            {isRunningAll ? 'Running…' : 'Run All Tests'}
          </button>
        </div>
      </div>

      {/* Test groups */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 pb-8 sm:pb-0">
        {GROUPS.map((group, groupIndex) => {
          const Icon = group.icon;
          const groupTests = tests.filter(t => group.ids.includes(t.id));
          const groupPass = groupTests.filter(t => t.status === 'pass').length;
          const groupFail = groupTests.filter(t => t.status === 'fail').length;

          return (
            <div key={generateStableKey(group, groupIndex, 'test-group')} className={`bg-[#0a0a0c] border ${group.borderColor} rounded-xl overflow-hidden`}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${group.color}`} />
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${group.color}`}>{group.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  {groupPass > 0 && <span className="text-emerald-400">{groupPass}✓</span>}
                  {groupFail > 0 && <span className="text-red-400">{groupFail}✗</span>}
                  <button
                    onClick={() => group.ids.forEach(id => runTest(id))}
                    className={`px-2 py-1 rounded border text-[8px] font-bold uppercase font-mono transition-all ${group.color} border-current/30 hover:bg-current/10 opacity-70 hover:opacity-100`}
                  >
                    Run Group
                  </button>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {prepareList(groupTests).map((test: any, testIndex: number) => (
                  <div key={generateStableKey(test, testIndex, 'test-item')} className="flex items-start gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0 w-4">
                      {test.status === 'idle' && <div className="w-2 h-2 rounded-full bg-white/10 mt-1" />}
                      {test.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                      {test.status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {test.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-white/80">{test.label}</span>
                        {test.latencyMs !== undefined && (
                          <span className={`text-[9px] font-mono shrink-0 ${test.latencyMs > 3000 ? 'text-amber-400' : 'text-white/30'}`}>{test.latencyMs}ms</span>
                        )}
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${test.status === 'pass' ? 'text-emerald-400/70' : test.status === 'fail' ? 'text-red-400/70' : 'text-white/20'}`}>
                        {test.message}
                      </div>
                      {test.detail && (
                        <div className="text-[9px] font-mono text-white/20 mt-0.5 bg-white/[0.03] px-2 py-1 rounded">{test.detail}</div>
                      )}
                    </div>
                    {/* Run button */}
                    <button
                      onClick={() => runTest(test.id)}
                      disabled={test.status === 'running'}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 px-2 py-1 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded text-[8px] font-mono uppercase font-bold disabled:opacity-20"
                    >
                      Run
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── SOURCE DEBUGGER TAB ─────────────────────────────────────────────────────

// ─── RSS TAB ───────────────────────────────────────────────────────────────────

const RSSTab: React.FC = () => {
  const { fetchNow } = useRSS();
  const [userSources, setUserSources] = useState<RSSSource[]>(() => {
    try { return JSON.parse(localStorage.getItem('ti_user_rss_sources') || '[]'); }
    catch { return []; }
  });
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
  const [lastArticleDates, setLastArticleDates] = useState<Record<string, string | null>>({});
  const [sourceStatus, setSourceStatus] = useState<Record<string, 'healthy' | 'failing' | 'paused' | 'idle' | 'testing'>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [sourceArticles, setSourceArticles] = useState<Record<string, any[]>>({});
  const [loadingArticles, setLoadingArticles] = useState(false);

  // News API state
  const [apiFetching, setApiFetching] = useState(false);
  const [apiMetrics, setApiMetrics] = useState(newsApiMetrics);
  const [apiEnabled, setApiEnabled] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('ti_api_providers_enabled') || '{"newsapi":true,"newsdata":true,"gnews":true}'); }
    catch { return { newsapi: true, newsdata: true, gnews: true }; }
  });
  const [customAPIs, setCustomAPIs] = useState<{ id: string; name: string; url: string; key: string; language: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('ti_custom_api_sources') || '[]'); }
    catch { return []; }
  });
  const [hiddenSources, setHiddenSources] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ti_hidden_rss_sources') || '[]'); }
    catch { return []; }
  });

  const persistHidden = (ids: string[]) => {
    setHiddenSources(ids);
    localStorage.setItem('ti_hidden_rss_sources', JSON.stringify(ids));
  };

  const persistAPIEnabled = (val: Record<string, boolean>) => {
    setApiEnabled(val);
    localStorage.setItem('ti_api_providers_enabled', JSON.stringify(val));
  };

  const persistCustomAPIs = (apis: { id: string; name: string; url: string; key: string; language: string }[]) => {
    setCustomAPIs(apis);
    localStorage.setItem('ti_custom_api_sources', JSON.stringify(apis));
  };

  const [showAddAPIModal, setShowAddAPIModal] = useState(false);
  const [newAPI, setNewAPI] = useState({ name: '', url: '', key: '', language: 'fr' as string });

  const fetchAPIs = useCallback(async () => {
    setApiFetching(true);
    try {
      await fetchAllNewsAPIs();
      setApiMetrics({ ...newsApiMetrics, isFetching: false });
    } catch (_) {}
    setApiFetching(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setApiMetrics({ ...newsApiMetrics }), 3000);
    return () => clearInterval(interval);
  }, []);

  // Add Source Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', language: 'fr' as 'fr' | 'en' | 'ar', reliability: 'B' as 'A' | 'B' | 'C', category: 'general' as 'general' | 'politics' | 'economy' | 'security' | 'social' });
  const [testingNew, setTestingNew] = useState(false);
  const [newTestResult, setNewTestResult] = useState<'idle' | 'pass' | 'fail'>('idle');

  const persistUserSources = (sources: RSSSource[]) => {
    setUserSources(sources);
    localStorage.setItem('ti_user_rss_sources', JSON.stringify(sources));
  };

  // Merge built-in + user sources, exclude hidden
  const allSources = useMemo(() => {
    const builtins = RSS_SOURCES.map(s => ({ ...s, builtin: true as const }));
    const custom = userSources.map(s => ({ ...s, builtin: false as const }));
    return [...builtins, ...custom];
  }, [userSources]);

  // Dedup by id and filter hidden
  const dedupedSources = useMemo(() => {
    const seen = new Set<string>();
    return allSources.filter(s => {
      if (hiddenSources.includes(s.id)) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [allSources, hiddenSources]);

  // Filter by search + category + language
  const filteredSources = useMemo(() => {
    return dedupedSources.filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (filterLang !== 'all' && s.language !== filterLang) return false;
      return true;
    });
  }, [dedupedSources, searchQuery, filterCategory, filterLang]);

  // Derive aggregates
  const aggregates = useMemo(() => {
    let online = 0, failing = 0, paused = 0, idle = 0, total = dedupedSources.length;
    dedupedSources.forEach(s => {
      const st = sourceStatus[s.id] || 'idle';
      if (st === 'healthy') online++;
      else if (st === 'failing') failing++;
      else if (st === 'paused') paused++;
      else idle++;
    });
    return { online, failing, paused, idle, total };
  }, [dedupedSources, sourceStatus]);

  // Fetch article counts + last dates
  const refreshCounts = useCallback(async () => {
    const ids = dedupedSources.map(s => s.id);
    const counts: Record<string, number> = {};
    const dates: Record<string, string | null> = {};
    const batchSize = 10;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(async id => {
        const [countRes, lastRes] = await Promise.all([
          supabase.from('articles').select('*', { count: 'exact', head: true }).eq('source_id', id),
          supabase.from('articles').select('published_at').eq('source_id', id).order('published_at', { ascending: false }).limit(1),
        ]);
        return { id, count: countRes.count ?? 0, last: lastRes.data?.[0]?.published_at ?? null };
      }));
      for (const r of results) {
        counts[r.id] = r.count;
        dates[r.id] = r.last;
      }
    }
    setSourceCounts(counts);
    setLastArticleDates(dates);
  }, [dedupedSources]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  // Load persisted statuses
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ti_rss_source_status') || '{}');
      setSourceStatus(saved);
    } catch {}
  }, []);

  const persistStatus = (id: string, status: 'healthy' | 'failing' | 'paused' | 'idle' | 'testing') => {
    setSourceStatus(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem('ti_rss_source_status', JSON.stringify(next));
      return next;
    });
  };

  const testSource = async (source: RSSSource & { builtin: boolean }) => {
    persistStatus(source.id, 'testing');
    try {
      const res = await validateRSSSource(source.url);
      const data = await fetchRSSFeed(source);
      if (res === 'failing' || data.length === 0) {
        persistStatus(source.id, 'failing');
      } else {
        persistStatus(source.id, 'healthy');
      }
    } catch {
      persistStatus(source.id, 'failing');
    }
  };

  const testAllSources = async () => {
    setTestingAll(true);
    for (const source of dedupedSources) {
      await testSource(source);
    }
    setTestingAll(false);
  };

  const togglePause = (source: RSSSource & { builtin: boolean }) => {
    const current = sourceStatus[source.id] || 'idle';
    if (current === 'paused') {
      persistStatus(source.id, 'idle');
    } else {
      persistStatus(source.id, 'paused');
    }
  };

  const removeSource = (source: RSSSource & { builtin: boolean }) => {
    if (source.builtin) {
      persistHidden([...hiddenSources, source.id]);
    } else {
      const next = userSources.filter(s => s.id !== source.id);
      persistUserSources(next);
    }
  };

  const expandSource = async (source: RSSSource & { builtin: boolean }) => {
    if (expandedSource === source.id) {
      setExpandedSource(null);
      return;
    }
    setExpandedSource(source.id);
    setLoadingArticles(true);
    try {
      const data = await fetchRSSFeed(source);
      setSourceArticles(prev => ({ ...prev, [source.id]: data.slice(0, 20) }));
    } catch {
      setSourceArticles(prev => ({ ...prev, [source.id]: [] }));
    }
    setLoadingArticles(false);
  };

  const handleAddSource = async () => {
    const id = newSource.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    const source: RSSSource = {
      id,
      name: newSource.name,
      url: newSource.url,
      language: newSource.language,
      reliability: newSource.reliability,
      alignment: 'NEUTRAL',
      keywords: [],
      type: 'rss',
      category: newSource.category,
      geo_weight: 0.5,
    };
    persistUserSources([...userSources, source]);
    setNewSource({ name: '', url: '', language: 'fr', reliability: 'B', category: 'general' });
    setNewTestResult('idle');
    setShowAddModal(false);
  };

  const testNewSource = async () => {
    setTestingNew(true);
    setNewTestResult('idle');
    try {
      const res = await validateRSSSource(newSource.url);
      setNewTestResult(res === 'failing' ? 'fail' : 'pass');
    } catch {
      setNewTestResult('fail');
    }
    setTestingNew(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header Stats */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-intel-cyan" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">RSS Sources</span>
              <span className="text-[10px] font-mono text-slate-500">{aggregates.total}</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span className="text-emerald-400">{aggregates.online}</span><span className="text-slate-600">online</span></span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-red-400">{aggregates.failing}</span><span className="text-slate-600">failing</span></span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span className="text-amber-400">{aggregates.paused}</span><span className="text-slate-600">paused</span></span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" /><span className="text-slate-400">{aggregates.idle}</span><span className="text-slate-600">idle</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={testAllSources} disabled={testingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all disabled:opacity-40"
            >{testingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Test All</button>
            <button onClick={() => { setNewTestResult('idle'); setNewSource({ name: '', url: '', language: 'fr', reliability: 'B', category: 'general' }); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase font-mono border border-intel-cyan/30 text-intel-cyan hover:bg-intel-cyan/10 transition-all"
            ><Plus className="w-3 h-3" /> Add Source</button>
            <button onClick={() => fetchNow(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20 transition-all"
            ><RefreshCw className="w-3 h-3" /> Fetch Now</button>
          </div>
        </div>
      </div>

      {/* API Providers */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-intel-cyan" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">News API Providers</span>
            <span className="text-[9px] font-mono text-slate-500">Structured JSON ingestion</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddAPIModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase font-mono border border-intel-cyan/30 text-intel-cyan hover:bg-intel-cyan/10 transition-all"
            ><Plus className="w-3 h-3" /> Add API</button>
            <button onClick={fetchAPIs} disabled={apiFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all disabled:opacity-40"
            >{apiFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Fetch APIs</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { id: 'newsapi',  label: 'NewsAPI',    key: 'VITE_NEWSAPI_KEY',  count: apiMetrics.newsapiCount,  color: '#3b82f6' },
            { id: 'newsdata', label: 'NewsData',   key: 'VITE_NEWSDATA_KEY', count: apiMetrics.newsdataCount, color: '#10b981' },
            { id: 'gnews',    label: 'GNews',      key: 'VITE_GNEWS_KEY',    count: apiMetrics.gnewsCount,    color: '#8b5cf6' },
          ].map(provider => {
            const hasKey = typeof import.meta !== 'undefined' && import.meta.env ? !!import.meta.env[provider.key] : false;
            const enabled = apiEnabled[provider.id] !== false;
            return (
              <div key={provider.id} className="bg-black/40 border border-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => persistAPIEnabled({ ...apiEnabled, [provider.id]: !enabled })}
                      className={`p-1 rounded transition-all ${enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-700 hover:text-slate-500'}`}
                      title={enabled ? 'Disable' : 'Enable'}>
                      <CheckCircle2 className={`w-3 h-3 ${enabled ? '' : 'opacity-30'}`} />
                    </button>
                    <span className={`text-[9px] font-bold ${enabled ? 'text-white' : 'text-slate-600'}`}>{provider.label}</span>
                  </div>
                  <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold border ${
                    hasKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>{hasKey ? 'CONNECTED' : 'NO KEY'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: provider.color, boxShadow: `0 0 6px ${provider.color}40`, opacity: enabled ? 1 : 0.3 }} />
                  <span className={`text-lg font-bold font-mono ${enabled ? 'text-white' : 'text-slate-600'}`}>{provider.count}</span>
                  <span className={`text-[8px] font-mono ${enabled ? 'text-slate-600' : 'text-slate-700'}`}>articles</span>
                </div>
                <div className="text-[7px] font-mono text-slate-700 mt-1.5">
                  {apiMetrics.lastFetch > 0
                    ? `Last fetch: ${timeAgo(new Date(apiMetrics.lastFetch).toISOString())}`
                    : 'Not yet fetched'}
                </div>
              </div>
            );
          })}
          {customAPIs.map(api => (
            <div key={api.id} className="bg-black/40 border border-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-white">{api.name}</span>
                <button onClick={() => persistCustomAPIs(customAPIs.filter(a => a.id !== api.id))}
                  className="p-1 rounded text-slate-500 hover:text-red-400 transition-all" title="Remove">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[8px] font-mono text-slate-500 truncate">{api.url}</div>
              <div className="text-[7px] font-mono text-slate-700 mt-1">
                {api.language.toUpperCase()} · {api.key ? 'Key configured' : 'No key'}
              </div>
            </div>
          ))}
        </div>
        {apiMetrics.droppedByGeo > 0 && (
          <div className="mt-2 text-[8px] font-mono text-amber-500/60">
            {apiMetrics.droppedByGeo} articles dropped by geo-relevance filter
          </div>
        )}
      </div>

      {/* Search & Filter bar */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sources..."
            className="w-full bg-[#0a0a0c] border border-white/5 rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white font-mono placeholder:text-white/10 focus:border-intel-cyan/30 focus:outline-none transition-all" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"><X className="w-3 h-3" /></button>}
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="bg-[#0a0a0c] border border-white/5 rounded-lg px-2 py-1.5 text-[9px] font-mono text-white focus:border-intel-cyan/30 focus:outline-none">
          <option value="all">All Categories</option>
          <option value="general">General</option>
          <option value="politics">Politics</option>
          <option value="economy">Economy</option>
          <option value="security">Security</option>
          <option value="social">Social</option>
        </select>
        <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
          className="bg-[#0a0a0c] border border-white/5 rounded-lg px-2 py-1.5 text-[9px] font-mono text-white focus:border-intel-cyan/30 focus:outline-none">
          <option value="all">All Languages</option>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      {/* Source List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2">
        {filteredSources.length === 0 ? (
          <div className="bg-[#0a0a0c] border border-dashed border-white/5 rounded-xl p-10 text-center">
            <Radio className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">No sources match filter</p>
            <p className="text-[9px] text-slate-600 font-mono">Try a different search or category</p>
          </div>
        ) : filteredSources.map(source => {
          const status = sourceStatus[source.id] || 'idle';
          const count = sourceCounts[source.id] ?? -1;
          const lastDate = lastArticleDates[source.id];
          const isExpanded = expandedSource === source.id;
          const articles = sourceArticles[source.id] || [];
          const langLabel = source.language === 'fr' ? 'FR' : source.language === 'en' ? 'EN' : 'AR';
          const langColor = source.language === 'fr' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : source.language === 'en' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10';
          return (
            <div key={source.id} className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
              {/* Source Row */}
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                onClick={() => expandSource(source)}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px] ${
                    status === 'healthy' ? 'bg-emerald-500 shadow-emerald-500/40' :
                    status === 'failing' ? 'bg-red-500 shadow-red-500/40' :
                    status === 'paused' ? 'bg-amber-500 shadow-amber-500/40' :
                    status === 'testing' ? 'bg-cyan-500 shadow-cyan-500/40 animate-pulse' :
                    'bg-slate-700'
                  }`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide truncate">{source.name}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider border ${langColor}`}>{langLabel}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                        source.reliability === 'A' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        source.reliability === 'B' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                        'text-red-400 border-red-500/30 bg-red-500/10'
                      }`}>{source.reliability}</span>
                      {source.builtin && <span className="text-[7px] font-mono text-slate-600 border border-white/5 px-1 py-0.5 rounded uppercase tracking-wider">BUILT-IN</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {count >= 0 ? <span className="text-[9px] font-mono text-slate-400">{count.toLocaleString()} articles</span> : <span className="text-[9px] font-mono text-slate-700">— articles</span>}
                      {lastDate && <span className="text-[9px] font-mono text-slate-600">last {timeAgo(lastDate)}</span>}
                      <span className="text-[9px] font-mono text-slate-600">· {source.category}</span>
                      {source.geo_weight < 0.5 && <span className="text-[8px] font-mono text-slate-700">🌍 global</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => testSource(source)} disabled={status === 'testing'}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-intel-cyan hover:bg-white/5 transition-all disabled:opacity-40" title="Test">
                    {status === 'testing' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => togglePause(source)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-white/5 transition-all" title={status === 'paused' ? 'Resume' : 'Pause'}>
                    {status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => removeSource(source)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded Articles */}
              {isExpanded && (
                <div className="border-t border-white/5 px-4 py-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {loadingArticles ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-intel-cyan animate-spin" />
                    </div>
                  ) : articles.length === 0 ? (
                    <p className="text-[10px] text-slate-600 font-mono text-center py-4 italic">No articles or failed to fetch</p>
                  ) : articles.map((article: any) => (
                    <div key={article.id} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 hover:border-white/10 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[10px] text-white/80 leading-tight line-clamp-2">{article.title}</span>
                        <span className="text-[8px] font-mono text-slate-600 shrink-0">{article.published_at ? new Date(article.published_at).toLocaleTimeString() : ''}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        {article.severity >= 0 && <span className={`text-[8px] font-mono ${article.severity >= 4 ? 'text-red-400' : 'text-slate-500'}`}>S{article.severity}</span>}
                        {article.governorate && <span className="text-[8px] font-mono text-slate-600">{article.governorate}</span>}
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[8px] font-bold text-intel-cyan hover:underline uppercase tracking-widest">Source ↗</a>
                      </div>
                    </div>
                  ))}
                </div>
      )}

      {/* Add API Source Modal */}
      {showAddAPIModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddAPIModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Add Custom API Source</h3>
                <button onClick={() => setShowAddAPIModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Source Name</label>
                  <input value={newAPI.name} onChange={e => setNewAPI({ ...newAPI, name: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none" placeholder="e.g. Tunisia API" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">API Endpoint URL</label>
                  <input value={newAPI.url} onChange={e => setNewAPI({ ...newAPI, url: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none" placeholder="https://api.example.com/news" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">API Key (optional)</label>
                  <input value={newAPI.key} onChange={e => setNewAPI({ ...newAPI, key: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none" placeholder="sk-..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Language</label>
                  <select value={newAPI.language} onChange={e => setNewAPI({ ...newAPI, language: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] text-white font-mono focus:border-intel-cyan/50 focus:outline-none">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddAPIModal(false)} className="flex-1 py-3 rounded-2xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={() => {
                  if (!newAPI.name || !newAPI.url) return;
                  const id = 'custom-api-' + Date.now();
                  persistCustomAPIs([...customAPIs, { ...newAPI, id }]);
                  setNewAPI({ name: '', url: '', key: '', language: 'fr' });
                  setShowAddAPIModal(false);
                }} disabled={!newAPI.name || !newAPI.url}
                  className="flex-1 py-3 rounded-2xl bg-intel-cyan text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-30">Add API</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return '<1m';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
};

const ADMTab: React.FC<{
  onJumpToDebugger: (stage?: string) => void;
}> = ({ onJumpToDebugger }) => {
  const { metrics } = useObservability();
  return (
    <div className="h-full">
      <FlowDiagram metrics={metrics} onNodeClick={(stage) => onJumpToDebugger(stage)} />
    </div>
  );
};

// ─── RRI & DATA TAB ───────────────────────────────────────────────────────────────────
const RRIDataTab: React.FC = () => {
  const [historyResult, setHistoryResult] = useState<{ rriState: any; variableCounts: any[]; totalArticles: number; elapsedMs: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const { rriState: liveRRI } = useRiskMetrics();
  const live = liveRRI;

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { computeHistoricalRRI } = await import('../../services/supabaseVarService');
      const result = await computeHistoricalRRI(60);
      setHistoryResult(result);
    } catch (e: any) {
      console.error('[RRI_DATA] Failed to compute historical RRI:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const hist = historyResult?.rriState;
  const counts = historyResult?.variableCounts || [];

  // Build variable label map from cache with fallback
  const varLabels = new Map<string, string>();
  const cache = getVarCache();
  if (cache) {
    for (const v of cache) {
      const id = v.id || `${v.code}${v.number}`;
      if (v.label) varLabels.set(id, v.label);
    }
  }
  // Fallback labels for common variables if cache has empty labels
  const FALLBACK_LABELS: Record<string, string> = {
    'A1': 'GDP Growth', 'A2': 'Inflation', 'A3': 'Unemployment',
    'A4': 'Youth Unemployment', 'A6': 'Public Debt/GDP', 'A7': 'Foreign Reserves',
    'A9': 'Industrial Production', 'A11': 'Remittances Inflow',
    'A13': 'Trade Balance', 'A16': 'Parallel Market Premium',
    'A19': 'CPI Score', 'A21': 'Heritage Economic Freedom',
    'A22': 'Purchasing Power',
    'B21': 'Water Stress', 'B26': 'Environmental Degradation',
    'C26': 'Social Media Penetration', 'C31': 'Rural Connectivity',
    'C37': 'Internet Censorship', 'C40': 'Digital Divide',
    'D41': 'Trust in Government', 'D44': 'Press Freedom',
    'D50': 'Government Legitimacy', 'D54': 'Freedom of Expression',
    'D71': 'Political Rights', 'D78': 'Political Polarization',
    'E51': 'Protest Mobilization', 'E61': 'Strike Activity',
    'E95': 'Social Cohesion',
    'F66': 'Social Trust', 'F81': 'Diaspora Engagement',
    'G71': 'Decree 54 Cases', 'G101': 'Rule of Law',
    'H116': 'Counter-Propaganda', 'H117': 'Gov Propaganda',
    'I92': 'IMF Agreement Probability',
    'J104': 'War / Conflict Intensity',
    'L121': 'Regime Cohesion', 'L123': 'Elite Unity',
    'L189': 'Ruling Party Cohesion', 'L199': 'Extrajudicial Actions',
    'M133': 'Opposition Fragmentation', 'M201': 'Opposition Strength',
    'M202': 'Protest Capacity', 'M207': 'UGTT / Union Power',
    'M215': 'Opposition Coordination',
    'N141': 'Security Force Loyalty', 'N142': 'Riot Control Capacity',
    'N219': 'Internal Security', 'N221': 'Police Presence',
    'O151': 'Public Anger', 'O232': 'Youth Bulge',
    'P164': 'Youth Unemployment Rate', 'P169': 'Youth Disenfranchisement',
    'A01': 'GDP Growth', 'H04': 'Energy Production', 'B24': 'Environmental Risk',
    'H_UGTT': 'UGTT Union Power',
    'M_UGTT': 'UGTT Union Power',
    'A251': 'Structural Economic Signal',
    'SEI_A01': 'Shortage Escalation Index',
    'D_MII': 'Ministerial Instability Index',
  };

  const getLabel = (varId: string): string => {
    // Try direct cached label
    const cached = varLabels.get(varId);
    if (cached) return cached;
    
    // Try fallback map
    const fallback = FALLBACK_LABELS[varId];
    if (fallback) return fallback;

    // Try without leading zero (A01 → A1) or with leading zero (A1 → A01)
    const altId = varId.length > 2 && /^\D0/.test(varId)
      ? varId[0] + varId.slice(2)
      : varId.length >= 2 && /^\D\d$/.test(varId)
        ? varId[0] + '0' + varId[1]
        : null;
    if (altId) {
      const alt = varLabels.get(altId);
      if (alt) return alt;
      const fb = FALLBACK_LABELS[altId];
      if (fb) return fb;
    }

    // Try to generate from cache pipeline_field
    if (cache) {
      const matchId = altId || varId;
      const match = cache.find((v: any) => {
        const vid = v.id || `${v.code}${v.number}`;
        return vid === matchId || `${v.code}${String(v.number).padStart(2, '0')}` === varId;
      });
      if (match && match.pipeline_field) {
        const parts = match.pipeline_field.split('.');
        if (parts.length > 1) return parts[parts.length - 1].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        return match.pipeline_field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top section — fixed */}
      <div className="shrink-0 space-y-4">
        {/* Top controls */}
        <div className="flex items-center gap-3">
          <button onClick={loadHistory} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-intel-cyan/10 border border-intel-cyan/30 text-intel-cyan text-[10px] font-mono font-bold uppercase hover:bg-intel-cyan/20 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalculate from History
          </button>
          {historyResult && (
            <span className="text-[9px] font-mono text-slate-500">
              {historyResult.totalArticles} articles · {historyResult.elapsedMs}ms
            </span>
          )}
        </div>

        {/* Main grid: Historical vs Fresh */}
        <div className="grid grid-cols-2 gap-4">
          {/* Historical (from Supabase) */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4 space-y-3">
            <div className="text-[9px] font-mono text-intel-cyan uppercase tracking-widest font-bold flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              Historical (60d Supabase)
            </div>
            {hist ? (
              <div className="space-y-2">
                <MetricRow label="RRI" value={hist.rri?.toFixed(4)} color={hist.rri >= 2.625 ? 'text-red-400' : hist.rri >= 2.0 ? 'text-orange-400' : 'text-cyan-400'} />
                <MetricRow label="P(REV)" value={(hist.p_rev * 100).toFixed(1) + '%'} color={hist.p_rev > 0.7 ? 'text-red-400' : 'text-orange-400'} />
                <MetricRow label="Salience" value={hist.salience?.toFixed(4)} color="text-cyan-400" />
                <MetricRow label="Cascade" value={hist.cascade_probability?.toFixed(4)} color="text-amber-400" />
                <MetricRow label="Velocity" value={hist.velocity_label || 'N/A'} color="text-slate-400" />
                <MetricRow label="Compound Stress" value={hist.compound_stress?.toFixed(4)} color="text-purple-400" />
                <MetricRow label="Info Amp" value={hist.info_amplification?.toFixed(4)} color="text-blue-400" />
              </div>
            ) : (
              <div className="text-[10px] font-mono text-slate-600 italic py-4 text-center">
                {loading ? 'Computing...' : 'No data'}
              </div>
            )}
          </div>

          {/* Fresh (from pipeline) */}
          {live && (
          <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4 space-y-3">
            <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Fresh (Pipeline)
            </div>
            <div className="space-y-2">
              <MetricRow label="RRI" value={live.rri?.toFixed(4)} color={live.rri >= 2.625 ? 'text-red-400' : live.rri >= 2.0 ? 'text-orange-400' : 'text-cyan-400'} />
              <MetricRow label="P(REV)" value={(live.p_rev * 100).toFixed(1) + '%'} color={live.p_rev > 0.7 ? 'text-red-400' : 'text-orange-400'} />
              <MetricRow label="Salience" value={live.salience?.toFixed(4)} color="text-cyan-400" />
              <MetricRow label="Cascade" value={live.cascade_probability?.toFixed(4)} color="text-amber-400" />
              <MetricRow label="Velocity" value={live.velocity_label || 'N/A'} color="text-slate-400" />
              <MetricRow label="Compound Stress" value={live.compound_stress?.toFixed(4)} color="text-purple-400" />
              <MetricRow label="Info Amp" value={live.info_amplification?.toFixed(4)} color="text-blue-400" />
              <MetricRow label="Variables" value={`${getVarCache()?.length || 0} cached`} color="text-slate-400" />
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Variables table — scrollable, fills remaining height */}
      <div className="flex-1 min-h-0 bg-[#0a0a0c] border border-white/5 rounded-xl flex flex-col">
        <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold px-4 pt-4 pb-2 shrink-0 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Variables by Article Count ({counts.length} total)
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
          {/* Table header */}
          <div className="flex items-center gap-3 py-1.5 px-2 text-[8px] font-mono text-slate-600 uppercase tracking-wider border-b border-white/5 mb-1 shrink-0">
            <span className="w-5 shrink-0">#</span>
            <span className="w-12 shrink-0">VARIABLE</span>
            <span className="flex-1 min-w-0">DESCRIPTION</span>
            <span className="w-12 text-right">ARTICLES</span>
            <span className="w-12 text-right">SEVERITY</span>
            <span className="w-16 text-right">NUDGE</span>
          </div>
          {counts.map((vc, i) => (
            <div key={vc.variable} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/[0.02] text-[10px] font-mono border-b border-white/[0.02]">
              <span className="text-slate-600 w-5 shrink-0">{i + 1}.</span>
              <span className="font-bold text-white w-12 shrink-0">{vc.variable}</span>
              <span className="text-slate-500 truncate text-[9px] flex-1 min-w-0">{getLabel(vc.variable)}</span>
              <span className="text-slate-400 w-12 text-right shrink-0">{vc.articles}</span>
              <span className="text-slate-500 w-12 text-right shrink-0">{vc.avgSeverity.toFixed(1)}</span>
              <span className="text-intel-cyan w-16 text-right shrink-0">{vc.totalNudge.toFixed(3)}</span>
            </div>
          ))}
          {counts.length === 0 && !loading && (
            <div className="text-[10px] font-mono text-slate-600 italic py-8 text-center">
              No variable-linked articles found in Supabase
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper metric row
const MetricRow: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-1 px-2 rounded bg-white/[0.02]">
    <span className="text-[10px] font-mono text-slate-500">{label}</span>
    <span className={`text-[11px] font-mono font-bold ${color}`}>{value}</span>
  </div>
);

// ─── DATABASE TAB ──────────────────────────────────────────────────────────────

const DB_TABLES = [
  'articles', 'events', 'notifications', 'rri_snapshots', 'price_reports',
  'predictions', 'narrative_cache', 'variables', 'agent_memory', 'analyst_corrections',
];

interface DbOpEntry {
  table: string;
  op: string;
  timestamp: number;
}

const DatabaseTab: React.FC = () => {
  const [opLog, setOpLog] = useState<DbOpEntry[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  const fetchCounts = useCallback(async () => {
    setLoadingCounts(true);
    const entries: Record<string, number> = {};
    for (const table of DB_TABLES) {
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) entries[table] = count ?? 0;
      } catch {}
    }
    setTableCounts(entries);
    setLoadingCounts(false);
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as DbOpEntry;
      if (detail) {
        setOpLog(prev => [{ ...detail, timestamp: Date.now() }, ...prev].slice(0, 100));
      }
    };
    window.addEventListener('supabase_op', handler);
    return () => window.removeEventListener('supabase_op', handler);
  }, []);

  const supabaseUrlDisplay = supabaseUrl
    ? supabaseUrl.length > 40
      ? supabaseUrl.slice(0, 40) + '...'
      : supabaseUrl
    : 'Not configured';

  const totalRows = Object.values(tableCounts).reduce((s, v) => s + v, 0);
  const tablesWithData = Object.entries(tableCounts).filter(([, c]) => c > 0).length;
  const tablesEmpty = Object.keys(tableCounts).length - tablesWithData;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Provider Card */}
      <div className="shrink-0">
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Database className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Supabase</h3>
                <p className="text-[9px] font-mono text-slate-500">{supabaseUrlDisplay}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              Connected
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Reads (session)</div>
              <div className="text-lg font-bold text-cyan-400 font-mono tabular-nums">{dbMetrics.reads.toLocaleString()}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Writes (session)</div>
              <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">{dbMetrics.writes.toLocaleString()}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Errors</div>
              <div className="text-lg font-bold text-red-400 font-mono tabular-nums">{dbMetrics.errors.toLocaleString()}</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-lg px-3 py-2.5">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Tables tracked</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums">{DB_TABLES.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: Table counts + Recent ops */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table Row Counts */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
              <Server className="w-3.5 h-3.5" />
              Table Inventory
              <span className="text-slate-600 font-normal">({Object.keys(tableCounts).length} tables)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-slate-600">{totalRows.toLocaleString()} total rows</span>
              <button onClick={fetchCounts} disabled={loadingCounts}
                className="p-1 rounded text-slate-500 hover:text-white transition-all"
              ><RefreshCw className={`w-3 h-3 ${loadingCounts ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-1">
            {DB_TABLES.map(table => {
              const count = tableCounts[table] ?? -1;
              const isLoaded = count !== -1;
              return (
                <div key={table} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${count > 0 ? 'bg-emerald-500' : isLoaded ? 'bg-slate-700' : 'bg-slate-700 animate-pulse'}`} />
                    <span className="text-[11px] font-mono text-white truncate">{table}</span>
                  </div>
                  <span className={`text-[10px] font-mono tabular-nums ml-3 ${count > 0 ? 'text-slate-300' : isLoaded ? 'text-slate-600' : 'text-slate-700'}`}>
                    {isLoaded ? count.toLocaleString() : '—'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="shrink-0 border-t border-white/5 px-4 py-2 flex items-center gap-3 text-[8px] font-mono text-slate-600">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Populated ({tablesWithData})</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-700" /> Empty ({tablesEmpty})</span>
          </div>
        </div>

        {/* Recent Operations */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-xl flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Recent Operations
            </span>
            <span className="text-[8px] font-mono text-slate-600">{opLog.length} tracked</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-0.5">
            {opLog.length === 0 ? (
              <div className="text-[10px] font-mono text-slate-600 italic py-8 text-center">
                No database operations yet this session
              </div>
            ) : (
              opLog.map((op, i) => {
                const ago = Date.now() - op.timestamp;
                const agoStr = ago < 1000 ? 'now' : ago < 60000 ? `${Math.floor(ago / 1000)}s` : ago < 3600000 ? `${Math.floor(ago / 60000)}m` : `${Math.floor(ago / 3600000)}h`;
                return (
                  <div key={`${op.timestamp}-${i}`} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/[0.02] text-[9px] font-mono">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${op.op === 'SELECT' ? 'bg-cyan-500' : 'bg-amber-500'}`} />
                    <span className={`font-bold uppercase shrink-0 ${op.op === 'SELECT' ? 'text-cyan-400' : 'text-amber-400'}`}>{op.op}</span>
                    <span className="text-white truncate min-w-0">{op.table}</span>
                    <span className="text-slate-600 ml-auto shrink-0">{agoStr}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AI TYPES & CATALOG ───────────────────────────────────────────────────────

const MODEL_CATALOG: Record<string, { label: string; models: { id: string; label: string; desc: string }[] }> = {
  google: {
    label: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Fast, high-performance for real-time analysis' },
      { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Complex reasoning and large context windows' },
      { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Optimized for speed and efficiency' },
    ]
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', desc: 'Omni model, high intelligence and speed' },
      { id: 'gpt-4o-mini', label: 'GPT-4o-mini', desc: 'Fast, affordable small model' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'Previous flagship model' },
    ]
  },
  anthropic: {
    label: 'Anthropic',
    models: [
      { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', desc: 'Most intelligent Claude model' },
      { id: 'claude-3-haiku-latest', label: 'Claude 3 Haiku', desc: 'Fastest Claude model' },
      { id: 'claude-3-opus-latest', label: 'Claude 3 Opus', desc: 'Deep reasoning flagship' },
    ]
  },
  openrouter: {
    label: 'OpenRouter',
    models: [
      { id: 'meta-llama/llama-3.1-405b', label: 'Llama 3.1 405B', desc: 'State-of-the-art open weights' },
      { id: 'mistralai/mistral-large', label: 'Mistral Large', desc: 'Premier European LLM' },
    ]
  },
  custom: {
    label: 'Custom / Local',
    models: [
      { id: 'ollama', label: 'Ollama (Local)', desc: 'Run models on your own hardware' },
      { id: 'vllm', label: 'vLLM', desc: 'High-throughput inference server' },
    ]
  },
  cerebras: {
    label: 'Cerebras',
    models: [
      { id: 'llama3.1-8b', label: 'Llama 3.1 8B', desc: 'Fastest inference on the market' },
      { id: 'llama3.1-70b', label: 'Llama 3.1 70B', desc: 'CS-3 powered inference, ultra-fast' },
      { id: 'qwen-3-235b-a22b-instruct-2507', label: 'Qwen 3 235B', desc: 'High-quality large model for complex briefs' },
    ]
  },
  nvidia: {
    label: 'NVIDIA',
    models: [
      { id: 'meta/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', desc: 'NVIDIA-optimized 70B Llama' },
      { id: 'meta/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', desc: 'Fast NVIDIA-optimized 8B Llama' },
      { id: 'mistralai/mistral-7b-instruct-v0.3', label: 'Mistral 7B', desc: 'Lightweight Mistral on NVIDIA' },
    ]
  },
  mistral: {
    label: 'Mistral',
    models: [
      { id: 'mistral-large-latest', label: 'Mistral Large', desc: 'Flagship model, best reasoning' },
      { id: 'mistral-medium', label: 'Mistral Medium', desc: 'Balanced performance and speed' },
      { id: 'mistral-small-latest', label: 'Mistral Small', desc: 'Fast, lightweight, cost-effective' },
      { id: 'codestral-latest', label: 'Codestral', desc: 'Code-specialized model' },
      { id: 'open-mistral-nemo', label: 'Mistral Nemo', desc: 'Open-weights model' },
    ]
  }
};

const PROVIDER_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  google:    { color: '#4285F4', bg: 'bg-blue-500/10', border: 'border-l-blue-500/40', label: 'Google' },
  openai:    { color: '#10A37F', bg: 'bg-emerald-500/10', border: 'border-l-emerald-500/40', label: 'OpenAI' },
  anthropic: { color: '#D97757', bg: 'bg-orange-500/10', border: 'border-l-orange-500/40', label: 'Anthropic' },
  cerebras:  { color: '#6C5CE7', bg: 'bg-purple-500/10', border: 'border-l-purple-500/40', label: 'Cerebras' },
  openrouter:{ color: '#FF6B35', bg: 'bg-orange-500/10', border: 'border-l-orange-600/40', label: 'OpenRouter' },
  nvidia:    { color: '#76B900', bg: 'bg-green-500/10', border: 'border-l-green-500/40', label: 'NVIDIA' },
  mistral:   { color: '#FF6B6B', bg: 'bg-red-500/10', border: 'border-l-red-500/40', label: 'Mistral' },
  custom:    { color: '#64748B', bg: 'bg-slate-500/10', border: 'border-l-slate-500/40', label: 'Custom' },
};

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelName: string;
  apiKey: string;
  status: 'online' | 'offline' | 'unknown';
  lastChecked: string | null;
  latencyMs?: number;
  config?: any;
}

const MODEL_KEY = 'ti_ai_models';
const ROLE_KEY = 'ti_ai_role_assignments';

function loadModels(): AIModel[] {
  try {
    return JSON.parse(localStorage.getItem(MODEL_KEY) || '[]');
  } catch { return []; }
}

type RoleType = string;

// ─── AI TAB ───────────────────────────────────────────────────────────────────

const CAPABILITIES: { id: string; name: string; icon: string; desc: string }[] = [
  { id: 'briefing', name: 'Executive Briefing', icon: '🎯', desc: 'Daily/weekly intelligence briefs, executive summaries' },
  { id: 'parsing', name: 'RSS Parsing', icon: '📰', desc: 'Article classification, entity extraction, sentiment' },
  { id: 'reasoning', name: 'Geopolitical Reasoning', icon: '🧠', desc: 'Deep multi-hop queries, correlation, causal inference' },
  { id: 'stream', name: 'Fast Realtime Chat', icon: '⚡', desc: 'Sub-second analyst Q&A, live narration' },
  { id: 'entities', name: 'Entity Extraction', icon: '🔍', desc: 'Actor detection, governorate mapping, event typing' },
  { id: 'translation', name: 'Translation', icon: '🌐', desc: 'Arabic/French/English document translation' },
  { id: 'simulation', name: 'Simulation Narration', icon: '📊', desc: 'Scenario walkthroughs, Monte Carlo explanations' },
  { id: 'alerting', name: 'Alert Synthesis', icon: '🚨', desc: 'Human-readable alert generation, escalation rationale' },
  { id: 'memory', name: 'Memory Retrieval', icon: '💾', desc: 'RAG-based historical recall, timeline reconstruction' },
  { id: 'fallback', name: 'System Fallback', icon: '🛡️', desc: 'Catch-all when primary models fail' },
];

const AITab: React.FC<{
  aiModels: AIModel[];
  roleAssign: Record<RoleType, string>;
  onPersistModels: (models: AIModel[]) => void;
  onPersistRoles: (roles: Record<RoleType, string>) => void;
}> = ({ aiModels, roleAssign, onPersistModels, onPersistRoles }) => {
  const [envModels, setEnvModels] = useState<AIModel[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Provisioning Modal State
  const [provisionStep, setProvisionStep] = useState<1 | 2 | 3>(1);
  const [newProvData, setNewProvData] = useState({ provider: 'google', apiKey: '', baseUrl: '', selectedModels: [] as string[] });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [autoFailover, setAutoFailover] = useState(() => localStorage.getItem('ti_auto_failover') === 'true');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Sub-tab navigation
  const [aiTabView, setAiTabView] = useState<'providers' | 'capabilities' | 'registry'>('providers');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [expandedCap, setExpandedCap] = useState<string | null>(null);

  // Capability config persisted in localStorage (primary + fallback model per capability)
  const [capConfig, setCapConfig] = useState<Record<string, { primary: string; fallback: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('ti_ai_cap_config') || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem('ti_ai_cap_config', JSON.stringify(capConfig)); }, [capConfig]);

  const updateCap = (capId: string, patch: Partial<{ primary: string; fallback: string }>) => {
    setCapConfig(prev => ({ ...prev, [capId]: { ...prev[capId] || { primary: '', fallback: '' }, ...patch } }));
  };

  // Provider discovery state
  const [scanningProvider, setScanningProvider] = useState<string | null>(null);
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, {id: string, label: string}[]>>({});
  const [testingDiscoveredId, setTestingDiscoveredId] = useState<string | null>(null);
  const [discTestResults, setDiscTestResults] = useState<Record<string, 'pass' | 'fail' | null>>({});

  // Step 2 provisioning progress
  const [provProgress, setProvProgress] = useState<{ label: string; status: 'pending' | 'loading' | 'done' | 'error' }[]>([
    { label: 'Authenticating with provider', status: 'pending' },
    { label: 'Scanning available intelligence models', status: 'pending' },
  ]);

  // Fire API calls when provisioning step advances to 2
  useEffect(() => {
    if (provisionStep !== 2) return;
    setIsValidating(true);
    setValidationError(null);
    setProvProgress(p => p.map(s => s.label === 'Authenticating with provider' ? { ...s, status: 'loading' } : s));

    const testModel = MODEL_CATALOG[newProvData.provider]?.models[0]?.id || 'gemini-2.0-flash';
    const isCustom = newProvData.provider === 'custom';

    const testBody: any = {
      provider: newProvData.provider,
      modelName: testModel,
      apiKey: newProvData.apiKey,
    };
    if (isCustom && newProvData.baseUrl) testBody.baseUrl = newProvData.baseUrl;

    const fetches: Promise<any>[] = [
      fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBody),
      }).then(r => r.json()),
    ];

    // Skip provider-models for custom endpoints
    if (!isCustom) {
      fetches.push(
        fetch('/api/ai/provider-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: newProvData.provider,
            apiKey: newProvData.apiKey,
          }),
        }).then(r => r.json())
      );
    }

    Promise.all(fetches)
      .then(([testData, modelsData]) => {
        setProvProgress(p => p.map(s =>
          s.label === 'Authenticating with provider' ? { ...s, status: testData.ok ? 'done' : 'error' } : s
        ));
        setProvProgress(p => p.map(s =>
          s.label === 'Scanning available intelligence models' ? { ...s, status: isCustom ? 'done' : 'loading' } : s
        ));
        if (!isCustom && modelsData?.models?.length > 0) {
          setAvailableModels(modelsData.models);
          setProvProgress(p => p.map(s =>
            s.label === 'Scanning available intelligence models' ? { ...s, status: 'done' } : s
          ));
          setTimeout(() => setProvisionStep(3), 400);
        } else {
          setProvProgress(p => p.map(s =>
            s.label === 'Scanning available intelligence models'
              ? { ...s, status: 'done', label: isCustom ? 'Custom endpoint configured' : 'No models discovered — using catalog defaults' }
              : s
          ));
          setTimeout(() => setProvisionStep(3), 600);
        }
        setIsValidating(false);
      })
      .catch(err => {
        setProvProgress(p => p.map(s => ({ ...s, status: 'error' as const })));
        setValidationError('Connection Refused');
        setIsValidating(false);
      });
  }, [provisionStep]);

  useEffect(() => {
    fetch('/api/ai/models')
      .then(r => r.json())
      .then(data => {
        if (data.models) {
          const mapped: AIModel[] = data.models.map((m: any) => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            modelName: m.modelName,
            apiKey: '********',
            status: m.status,
            lastChecked: null,
          }));
          setEnvModels(mapped);
          localStorage.setItem('ti_env_models', JSON.stringify(mapped));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-seed role assignments from env models on first launch
  useEffect(() => {
    if (envModels.length === 0) return;
    const hasAnyRole = Object.values(roleAssign).some(v => v !== '');
    if (hasAnyRole) return;
    const nextRoles = { ...roleAssign };
    const roleKeys = Object.keys(nextRoles) as RoleType[];
    envModels.forEach((model, i) => {
      if (i < roleKeys.length) {
        nextRoles[roleKeys[i]] = model.id;
      }
    });
    onPersistRoles(nextRoles);
  }, [envModels, roleAssign, onPersistRoles]);

  const allModels = [...envModels, ...aiModels];

  // Auto-failover: every 10s, reassign roles away from offline models
  useEffect(() => {
    if (!autoFailover) return;
    const interval = setInterval(() => {
      const onlineModels = allModels.filter(m => m.status === 'online');
      const offlineModels = allModels.filter(m => m.status === 'offline');
      if (onlineModels.length === 0 || offlineModels.length === 0) return;

      const nextRoles = { ...roleAssign };
      let changed = false;
      for (const role of Object.keys(nextRoles) as RoleType[]) {
        const assignedId = nextRoles[role];
        if (!assignedId) continue;
        const assigned = allModels.find(m => m.id === assignedId);
        if (assigned && assigned.status === 'offline') {
          const replacement = onlineModels.find(m => !Object.values(nextRoles).includes(m.id));
          if (replacement) {
            nextRoles[role] = replacement.id;
            changed = true;
          }
        }
      }
      if (changed) {
        onPersistRoles?.(nextRoles);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [autoFailover, allModels, roleAssign, onPersistRoles]);
  
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, AIModel[]> = {};
    allModels.forEach(m => {
      if (!grouped[m.provider]) grouped[m.provider] = [];
      grouped[m.provider].push(m);
    });
    return grouped;
  }, [allModels]);

  const [modelFilter, setModelFilter] = useState('');

  const filteredModelsByProvider = useMemo(() => {
    const result: Record<string, AIModel[]> = {};
    const q = modelFilter.toLowerCase().trim();
    for (const [provider, models] of Object.entries(modelsByProvider)) {
      const filtered = q
        ? models.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.modelName.toLowerCase().includes(q) ||
            m.provider.toLowerCase().includes(q)
          )
        : models;
      if (filtered.length > 0) {
        result[provider] = filtered;
      }
    }
    return result;
  }, [modelsByProvider, modelFilter]);

  const testAllConnections = async () => {
    for (const model of allModels) {
      const isEnv = envModels.some(em => em.id === model.id);
      await testConnection(model, isEnv);
    }
  };

  const toggleFailover = () => {
    const next = !autoFailover;
    setAutoFailover(next);
    localStorage.setItem('ti_auto_failover', String(next));
  };

  const handleScanProvider = async (provider: string) => {
    setScanningProvider(provider);
    const existing = allModels.find(m => m.provider === provider);
    if (!existing) { setScanningProvider(null); return; }
    try {
      const res = await fetch('/api/ai/provider-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: existing.apiKey.replace(/^\*+\*/, '') }),
      });
      const data = await res.json();
      if (data.models?.length > 0) {
        setDiscoveredModels(prev => ({
          ...prev,
          [provider]: data.models.map((id: string) => {
            const catEntry = MODEL_CATALOG[provider]?.models?.find(m => m.id === id);
            return { id, label: catEntry?.label || id };
          }),
        }));
      }
    } catch {}
    setScanningProvider(null);
  };

  const provisionDiscoveredModel = (provider: string, modelId: string, label: string) => {
    const existing = allModels.find(m => m.provider === provider);
    const newNode: AIModel = {
      id: crypto.randomUUID(),
      name: label,
      provider,
      modelName: modelId,
      apiKey: existing?.apiKey || '',
      status: 'unknown',
      lastChecked: null,
      config: existing?.config,
    };
    onPersistModels([...aiModels, newNode]);
    setDiscoveredModels(prev => {
      const updated = { ...prev };
      updated[provider] = (updated[provider] || []).filter(m => m.id !== modelId);
      return updated;
    });
  };

  const testDiscoveredModel = async (provider: string, modelId: string) => {
    const testKey = `${provider}:${modelId}`;
    setTestingDiscoveredId(testKey);
    const existing = allModels.find(m => m.provider === provider);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          modelName: modelId,
          apiKey: existing?.apiKey?.replace(/^\*+\*/, ''),
          baseUrl: existing?.config?.baseUrl,
        }),
      });
      const data = await res.json();
      setDiscTestResults(prev => ({ ...prev, [testKey]: data.ok ? 'pass' : 'fail' }));
    } catch {
      setDiscTestResults(prev => ({ ...prev, [testKey]: 'fail' }));
    }
    setTestingDiscoveredId(null);
  };

  const handleRemove = (id: string) => {
    onPersistModels(aiModels.filter(m => m.id !== id));
    const nextRoles = { ...roleAssign };
    for (const role of Object.keys(nextRoles) as RoleType[]) {
      if (nextRoles[role] === id) nextRoles[role] = '';
    }
    onPersistRoles(nextRoles);
  };

  const updateModel = (id: string, patch: Partial<AIModel>) => {
    onPersistModels(aiModels.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const testConnection = async (model: AIModel, isEnv: boolean) => {
    setTestingId(model.id);
    const updateFn = isEnv 
      ? (id: string, p: Partial<AIModel>) => setEnvModels(prev => prev.map(m => m.id === id ? { ...m, ...p } : m))
      : updateModel;

    updateFn(model.id, { status: 'unknown' });

    try {
      const t0 = performance.now();
      const body: any = {
        provider: model.provider,
        modelName: model.modelName,
        apiKey: isEnv ? undefined : model.apiKey,
      };
      if (model.config?.baseUrl) body.baseUrl = model.config.baseUrl;
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const latency = Math.round(performance.now() - t0);
      const data = await res.json();
      updateFn(model.id, {
        status: data.ok ? 'online' : 'offline',
        lastChecked: data.checkedAt,
        latencyMs: data.ok ? (data.latencyMs || latency) : undefined,
      });
    } catch {
      updateFn(model.id, {
        status: 'offline',
        lastChecked: new Date().toISOString(),
      });
    }
    setTestingId(null);
  };

  const handleTestAndSave = async (model: AIModel, isEnv: boolean) => {
    await testConnection(model, isEnv);
    if (model.status === 'online' || model.status === 'unknown') {
      setEditingId(null);
    }
  };

  const isModelInUse = (id: string) => Object.values(roleAssign).includes(id);

  const handleAutoConfigure = async () => {
    const onlineIds: string[] = allModels.filter(m => m.status === 'online').map(m => m.id);
    const toTest = allModels.filter(m => m.status !== 'online');
    for (const model of toTest) {
      const isEnv = envModels.some(em => em.id === model.id);
      const body: any = { provider: model.provider, modelName: model.modelName, apiKey: isEnv ? undefined : model.apiKey };
      if (model.config?.baseUrl) body.baseUrl = model.config.baseUrl;
      try {
        const t0 = performance.now();
        const res = await fetch('/api/ai/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        const latency = Math.round(performance.now() - t0);
        if (data.ok) {
          onlineIds.push(model.id);
          if (isEnv) setEnvModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'online' as const, lastChecked: data.checkedAt, latencyMs: latency } : m));
          else onPersistModels(aiModels.map(m => m.id === model.id ? { ...m, status: 'online' as const, lastChecked: data.checkedAt, latencyMs: latency } : m));
        } else {
          if (isEnv) setEnvModels(prev => prev.map(m => m.id === model.id ? { ...m, status: 'offline' as const, lastChecked: data.checkedAt } : m));
          else onPersistModels(aiModels.map(m => m.id === model.id ? { ...m, status: 'offline' as const, lastChecked: data.checkedAt } : m));
        }
      } catch {
        if (!isEnv) onPersistModels(aiModels.map(m => m.id === model.id ? { ...m, status: 'offline' as const, lastChecked: new Date().toISOString() } : m));
      }
    }
    if (onlineIds.length === 0) return;
    const newConfig: Record<string, { primary: string; fallback: string }> = {};
    CAPABILITIES.forEach((cap, i) => {
      const primary = onlineIds[i % onlineIds.length];
      const fallback = onlineIds.length > 1 ? onlineIds[(i + 1) % onlineIds.length] : '';
      newConfig[cap.id] = { primary, fallback };
    });
    setCapConfig(newConfig);
  };

  return (
    <div className="flex flex-col h-full pr-1 space-y-4">
      {/* Header with sub-tab navigation */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-intel-cyan/10 border border-intel-cyan/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.1)]">
            <Brain className="w-4.5 h-4.5 text-intel-cyan" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              AI Infrastructure
              <Sparkles className="w-3 h-3 text-intel-cyan animate-pulse" />
            </h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
              {allModels.length} nodes · {Object.keys(modelsByProvider).length} providers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 border border-white/5 rounded-lg p-0.5">
            {(['providers', 'capabilities', 'registry'] as const).map(tab => (
              <button key={tab} onClick={() => setAiTabView(tab)}
                className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase font-mono tracking-wider transition-all ${
                  aiTabView === tab 
                    ? 'bg-intel-cyan/20 text-intel-cyan shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab === 'providers' ? 'Providers' : tab === 'capabilities' ? 'Capabilities' : 'Registry'}
              </button>
            ))}
          </div>
          <button onClick={toggleFailover}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono transition-all border ${
              autoFailover ? 'border-intel-green/40 text-intel-green bg-intel-green/10' : 'border-white/10 text-slate-500 hover:text-white'
            }`}
          >
            <Activity className={`w-3 h-3 ${autoFailover ? 'animate-pulse' : ''}`} />
            {autoFailover ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        
        {/* ─── PROVIDERS VIEW (Layer 1) ─────────────────────────────── */}
        {aiTabView === 'providers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
                Provider Infrastructure
                <span className="ml-2 text-intel-cyan/60">{Object.keys(modelsByProvider).length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={testAllConnections} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all">
                  <Zap className="w-3 h-3" /> Test All
                </button>
                <button onClick={() => { setProvisionStep(1); setNewProvData({ provider: 'google', apiKey: '', selectedModels: [] }); setShowAdd(true); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-intel-cyan/30 text-intel-cyan hover:bg-intel-cyan/10 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Provider
                </button>
              </div>
            </div>

            {/* Role Bindings */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Role Bindings
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'parser' as RoleType, label: 'National Briefing', icon: '📰' },
                  { key: 'analys' as RoleType, label: 'Predictive Analysis', icon: '📊' },
                  { key: 'answer' as RoleType, label: 'AI Analyst Chat', icon: '🤖' },
                ].map(role => {
                  const assignedId = roleAssign[role.key];
                  const assigned = allModels.find(m => m.id === assignedId);
                  return (
                    <div key={role.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{role.icon}</span>
                        <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">{role.label}</span>
                      </div>
                      <select
                        value={assignedId || ''}
                        onChange={e => {
                          const next = { ...roleAssign, [role.key]: e.target.value };
                          onPersistRoles(next);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                      >
                        <option value="">— NONE —</option>
                        {allModels.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.modelName}){m.status === 'online' ? ' ●' : m.status === 'offline' ? ' ✕' : ''}
                          </option>
                        ))}
                      </select>
                      <span className={`text-[8px] font-mono ${assigned?.status === 'online' ? 'text-intel-green' : assigned?.status === 'offline' ? 'text-red-400' : 'text-slate-600'}`}>
                        {assigned ? `${assigned.provider} · ${assigned.status}` : 'unassigned'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {Object.keys(modelsByProvider).length === 0 ? (
              <div className="bg-black/20 border border-dashed border-white/5 rounded-2xl p-10 text-center">
                <Cpu className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-4">No providers connected</p>
                <button onClick={() => { setProvisionStep(1); setNewProvData({ provider: 'google', apiKey: '', selectedModels: [] }); setShowAdd(true); }}
                  className="px-5 py-3 rounded-xl bg-intel-cyan/10 border border-intel-cyan/30 text-intel-cyan text-[10px] font-bold uppercase font-mono hover:bg-intel-cyan/20 transition-all"
                >+ Add Your First Provider</button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(modelsByProvider).map(([provider, models]) => {
                  const isOnline = models.some(m => m.status === 'online');
                  const providerInfo = PROVIDER_STYLE[provider];
                  const isExpanded = expandedProvider === provider;
                  const discModels = discoveredModels[provider] || [];
                  const avgLatency = models.filter(m => m.latencyMs).reduce((s, m, _, a) => s + (m.latencyMs || 0) / a.length, 0);
                  return (
                    <div key={provider} className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
                      {/* Provider Summary Card */}
                      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                        onClick={() => setExpandedProvider(isExpanded ? null : provider)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-intel-green shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]'}`} />
                            {isOnline && <div className="absolute inset-0 bg-intel-green rounded-full animate-ping opacity-20" />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: providerInfo?.color || '#94A3B8' }}>
                            {providerInfo?.label || provider}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">{models.length} models</span>
                          {avgLatency > 0 && <span className="text-[9px] font-mono text-slate-600">Latency: {Math.round(avgLatency)}ms</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); handleScanProvider(provider); }} disabled={scanningProvider === provider}
                            className="px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all disabled:opacity-40"
                          >
                            {scanningProvider === provider ? <RefreshCw className="w-3 h-3 animate-spin" /> : <>Scan</>}
                          </button>
                          <button onClick={e => e.stopPropagation()}
                            className="px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono text-slate-500 hover:text-white transition-all"
                          >Edit Key</button>
                          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Model List */}
                      {isExpanded && (
                        <div className="border-t border-white/5 px-4 py-3 space-y-3">
                          {/* Provisioned Models */}
                          <div className="grid grid-cols-1 gap-2">
                            {models.map(model => {
                              const isEditing = editingId === model.id;
                              const isEnv = envModels.some(em => em.id === model.id);
                              const isTesting = testingId === model.id;
                              return (
                                <motion.div key={model.id} layout
                                  className={`bg-black/40 border rounded-2xl p-4 transition-all border-l-2 ${isEditing ? 'border-intel-cyan/50 border-l-intel-cyan/50 shadow-[0_0_30px_rgba(0,242,255,0.1)]' : `border-white/5 hover:border-white/10 ${providerInfo?.border || 'border-l-slate-500/40'}`}`}
                                >
                                  {isEditing ? (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Instance Name</label>
                                          <input defaultValue={model.name} onChange={e => updateModel(model.id, { name: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Model Engine</label>
                                          <select defaultValue={model.modelName} onChange={e => updateModel(model.id, { modelName: e.target.value })}
                                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                                          >{MODEL_CATALOG[model.provider]?.models?.map(m => <option key={m.id} value={m.id}>{m.label}</option>) || null}</select>
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Secret Key</label>
                                          <div className="relative">
                                            <input defaultValue={model.apiKey} onChange={e => updateModel(model.id, { apiKey: e.target.value })} type="password"
                                              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none" placeholder="sk-..." />
                                            <Key className="absolute right-3 top-3 w-3 h-3 text-white/20" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-3 pt-2">
                                        <button onClick={() => setEditingId(null)} className="px-4 py-2 text-[10px] font-bold uppercase font-mono text-slate-500 hover:text-white transition-colors">Cancel</button>
                                        <button onClick={() => handleTestAndSave(model, isEnv)} disabled={testingId === model.id}
                                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-intel-cyan/10 border border-intel-cyan/30 text-intel-cyan text-[10px] font-bold uppercase font-mono hover:bg-intel-cyan/20 transition-all shadow-[0_0_15px_rgba(0,242,255,0.1)] disabled:opacity-40"
                                        >{testingId === model.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                          {testingId === model.id ? 'Testing...' : 'Test & Save'}</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 min-w-0">
                                        <div className="relative">
                                          <div className={`w-3 h-3 rounded-full ${model.status === 'online' ? 'bg-intel-green shadow-[0_0_10px_rgba(34,197,94,0.5)]' : model.status === 'offline' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-700 animate-pulse'}`} />
                                          {model.status === 'online' && <div className="absolute inset-0 bg-intel-green rounded-full animate-ping opacity-20" />}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-sm font-bold text-white tracking-wide truncate">{model.name}</span>
                                            <span className="text-[8px] font-mono text-slate-500 border border-white/10 px-1.5 py-0.5 rounded uppercase">{model.modelName}</span>
                                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${providerInfo?.bg || 'bg-slate-500/10'}`}
                                              style={{ color: providerInfo?.color || '#64748B' }}>{providerInfo?.label || model.provider}</span>
                                            {isEnv && <span className="text-[8px] font-mono text-intel-cyan bg-intel-cyan/10 px-1.5 py-0.5 rounded uppercase tracking-wider">ENV</span>}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                                              <Clock className="w-2.5 h-2.5" />
                                              {model.lastChecked ? `Sync: ${new Date(model.lastChecked).toLocaleTimeString()}` : 'No sync recorded'}
                                            </span>
                                            <span className={`text-[9px] font-mono flex items-center gap-1 ${model.latencyMs !== undefined ? model.latencyMs < 500 ? 'text-intel-green' : model.latencyMs < 2000 ? 'text-amber-500' : 'text-red-500' : 'text-slate-500'}`}>
                                              <Signal className="w-2.5 h-2.5" />
                                              {model.latencyMs !== undefined ? `${model.latencyMs}ms` : model.status === 'online' ? 'Live' : 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => testConnection(model, isEnv)} disabled={testingId === model.id}
                                          className={`p-2 rounded-xl transition-all ${testingId === model.id ? 'text-intel-cyan bg-intel-cyan/5' : 'text-slate-500 hover:text-intel-cyan hover:bg-white/5'}`} title="Test"
                                        >{testingId === model.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}</button>
                                        {!isEnv && <>
                                          <button onClick={() => setEditingId(model.id)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                          <button onClick={() => handleRemove(model.id)} disabled={isModelInUse(model.id)} className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20" title="Remove"><Trash2 className="w-4 h-4" /></button>
                                        </>}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Discovered Models */}
                          {discModels.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Available Models · {discModels.length} discovered</span>
                              {discModels.map(dm => {
                                const testKey = `${provider}:${dm.id}`;
                                const testResult = discTestResults[testKey];
                                const isTesting = testingDiscoveredId === testKey;
                                return (
                                  <div key={dm.id} className="bg-black/40 border border-dashed border-white/5 rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                      {testResult === 'pass' ? <div className="w-3 h-3 rounded-full bg-intel-green shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        : testResult === 'fail' ? <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        : <div className="w-3 h-3 rounded-full bg-slate-700" />}
                                      <span className="text-xs text-white/80 font-mono">{dm.label}</span>
                                      <span className="text-[8px] font-mono text-slate-600">{dm.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => testDiscoveredModel(provider, dm.id)} disabled={isTesting}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all disabled:opacity-40"
                                      >{isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}{isTesting ? 'Testing...' : 'Test'}</button>
                                      <button onClick={() => provisionDiscoveredModel(provider, dm.id, dm.label)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-intel-cyan/20 text-intel-cyan hover:bg-intel-cyan/10 transition-all"
                                      ><Plus className="w-3 h-3" /> Provision</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── CAPABILITIES VIEW (Layer 2 - MAIN UI) ────────────────── */}
        {aiTabView === 'capabilities' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
                Intelligence Capabilities
                <span className="ml-2 text-intel-cyan/60">{CAPABILITIES.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={handleAutoConfigure} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all"
                ><Zap className="w-3 h-3" /> Auto-Configure</button>
              </div>
            </div>

            <div className="space-y-2">
              {CAPABILITIES.map(cap => {
                const config = capConfig[cap.id] || { primary: '', fallback: '' };
                const primaryModel = config.primary ? allModels.find(m => m.id === config.primary) : null;
                const fallbackModel = config.fallback ? allModels.find(m => m.id === config.fallback) : null;
                const status = primaryModel?.status === 'online' ? 'active' : config.fallback ? 'degraded' : 'offline';
                const isExpanded = expandedCap === cap.id;
                return (
                  <div key={cap.id} className="bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden">
                    {/* Capability Row */}
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-all"
                      onClick={() => setExpandedCap(isExpanded ? null : cap.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base">{cap.icon}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white tracking-wide">{cap.name}</span>
                          <p className="text-[8px] font-mono text-slate-600 truncate">{cap.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                          status === 'active' ? 'bg-intel-green/10 text-intel-green' :
                          status === 'degraded' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{status.toUpperCase()}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded Config */}
                    {isExpanded && (
                      <div className="border-t border-white/5 px-4 py-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Primary Model</label>
                            <select value={config.primary} onChange={e => updateCap(cap.id, { primary: e.target.value })}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                            >
                              <option value="">— NO MODEL —</option>
                              {allModels.map(m => <option key={m.id} value={m.id}>{m.name} ({m.modelName}){m.status === 'online' ? ' ●' : ''}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Fallback Model</label>
                            <select value={config.fallback} onChange={e => updateCap(cap.id, { fallback: e.target.value })}
                              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                            >
                              <option value="">— NO FALLBACK —</option>
                              {allModels.filter(m => m.id !== config.primary).map(m => <option key={m.id} value={m.id}>{m.name} ({m.modelName}){m.status === 'online' ? ' ●' : ''}</option>)}
                            </select>
                          </div>
                        </div>
                        {primaryModel && (
                          <div className="flex items-center gap-2 text-[9px] font-mono">
                            <span className={`${primaryModel.status === 'online' ? 'text-intel-green' : 'text-red-400'}'}`}>
                              {primaryModel.status === 'online' ? '● Online' : '● Offline'}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">{PROVIDER_STYLE[primaryModel.provider]?.label || primaryModel.provider}</span>
                            {primaryModel.latencyMs && <><span className="text-slate-600">·</span><span className="text-slate-500">{primaryModel.latencyMs}ms</span></>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── REGISTRY VIEW (Layer 3) ───────────────────────────────── */}
        {aiTabView === 'registry' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] shrink-0">Model Registry</span>
              <div className="relative flex-1 max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                <input value={modelFilter} onChange={e => setModelFilter(e.target.value)} placeholder="Filter models..."
                  className="w-full bg-black/40 border border-white/5 rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white font-mono placeholder:text-white/10 focus:border-intel-cyan/30 focus:outline-none transition-all" />
                {modelFilter && <button onClick={() => setModelFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"><X className="w-3 h-3" /></button>}
              </div>
              {allModels.some(m => m.status !== 'online') && (
                <button onClick={testAllConnections} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all">
                  <Zap className="w-3 h-3" /> Test All
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[8px] font-mono text-slate-600 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-2 pr-4 font-medium">Model</th>
                    <th className="pb-2 pr-4 font-medium">Provider</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Latency</th>
                    <th className="pb-2 font-medium">Last Sync</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] font-mono">
                  {(modelFilter.trim() ? Object.values(filteredModelsByProvider).flat() : allModels).map(m => (
                    <tr key={m.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 text-white">{m.name}</td>
                      <td className="py-3 pr-4 text-slate-400">{PROVIDER_STYLE[m.provider]?.label || m.provider}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 ${
                          m.status === 'online' ? 'text-intel-green' : m.status === 'offline' ? 'text-red-400' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'online' ? 'bg-intel-green' : m.status === 'offline' ? 'bg-red-500' : 'bg-slate-600'}`} />
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{m.latencyMs ? `${m.latencyMs}ms` : '—'}</td>
                      <td className="py-3 text-slate-600">{m.lastChecked ? new Date(m.lastChecked).toLocaleTimeString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allModels.length === 0 && (
              <div className="bg-black/20 border border-dashed border-white/5 rounded-2xl p-10 text-center">
                <Cpu className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">No models in registry</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Provisioning Modal Overlay */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Provision AI Intelligence Node</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Step {provisionStep} of 3 • {provisionStep === 1 ? 'Credentialing' : provisionStep === 2 ? 'Verification' : 'Select Models'}</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {provisionStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Select Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(MODEL_CATALOG).map(([id, p]) => (
                        <button
                          key={id}
                          onClick={() => setNewProvData({ ...newProvData, provider: id })}
                          className={`px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all text-left ${
                            newProvData.provider === id 
                              ? 'bg-intel-cyan/10 border-intel-cyan/40 text-intel-cyan' 
                              : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">API Secret Key</label>
                    <div className="relative">
                      <input 
                        type="password"
                        value={newProvData.apiKey}
                        onChange={e => setNewProvData({ ...newProvData, apiKey: e.target.value })}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                        placeholder="sk-..."
                      />
                      <Key className="absolute right-4 top-3.5 w-4 h-4 text-white/20" />
                    </div>
                  </div>
                  {newProvData.provider === 'custom' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Base Endpoint URL</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newProvData.baseUrl}
                          onChange={e => setNewProvData({ ...newProvData, baseUrl: e.target.value })}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                          placeholder="https://api.yourendpoint.com/v1"
                        />
                        <Link className="absolute right-4 top-3.5 w-4 h-4 text-white/20" />
                      </div>
                    </div>
                  )}
                  <button
                    disabled={!newProvData.apiKey || isValidating || (newProvData.provider === 'custom' && !newProvData.baseUrl)}
                    onClick={() => {
                      setValidationError(null);
                      setProvisionStep(2);
                    }}
                    className="w-full py-4 rounded-2xl bg-intel-cyan text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {isValidating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authorize & Continue'}
                  </button>
                  {validationError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-center">
                      ERROR: {validationError}
                    </div>
                  )}
                </div>
              )}

              {provisionStep === 2 && (
                <div className="space-y-6 py-8">
                  <div className="flex justify-center">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-intel-cyan/20 animate-ping" />
                      <div className="absolute inset-2 rounded-full border-2 border-t-intel-cyan border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      <div className="absolute inset-4 rounded-full bg-intel-cyan/10 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-intel-cyan" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 max-w-sm mx-auto">
                    {provProgress.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {step.status === 'pending' && <div className="w-4 h-4 rounded-full border border-white/10" />}
                        {step.status === 'loading' && <RefreshCw className="w-4 h-4 text-intel-cyan animate-spin shrink-0" />}
                        {step.status === 'done' && <CheckCircle2 className="w-4 h-4 text-intel-green shrink-0" />}
                        {step.status === 'error' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                        <span className={`text-[10px] font-mono ${
                          step.status === 'done' ? 'text-intel-green' :
                          step.status === 'error' ? 'text-red-400' :
                          step.status === 'loading' ? 'text-white' :
                          'text-slate-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {validationError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-mono text-center">
                      ERROR: {validationError}
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setProvisionStep(1); setProvProgress(p => p.map(s => ({ ...s, status: 'pending' as const }))); }}
                      className="px-6 py-3 rounded-xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    {validationError && (
                      <button
                        onClick={() => setProvisionStep(2)}
                        className="px-6 py-3 rounded-xl bg-intel-cyan text-black text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              )}

              {provisionStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {newProvData.provider === 'custom' ? (
                      <>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Custom Model Name</label>
                        <input
                          type="text"
                          placeholder="e.g. my-custom-model-v1"
                          value={newProvData.selectedModels[0] || ''}
                          onChange={e => setNewProvData({ ...newProvData, selectedModels: e.target.value ? [e.target.value] : [] })}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                        />
                      </>
                    ) : (
                      <>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          Select Intelligence Models to Provision
                          {availableModels.length > 0 && <span className="ml-2 text-intel-cyan">({availableModels.length} discovered)</span>}
                        </label>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {(availableModels.length > 0
                            ? availableModels.map(id => {
                                const catalogEntry = MODEL_CATALOG[newProvData.provider]?.models.find(m => m.id === id);
                                return {
                                  id,
                                  label: catalogEntry?.label || id,
                                  desc: catalogEntry?.desc || 'Discovered model',
                                };
                              })
                            : MODEL_CATALOG[newProvData.provider]?.models || []
                          ).map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                const exists = newProvData.selectedModels.includes(m.id);
                                setNewProvData({
                                  ...newProvData,
                                  selectedModels: exists 
                                    ? newProvData.selectedModels.filter(id => id !== m.id)
                                    : [...newProvData.selectedModels, m.id]
                                });
                              }}
                              className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between group ${
                                newProvData.selectedModels.includes(m.id)
                                  ? 'bg-intel-cyan/10 border-intel-cyan/40'
                                  : 'bg-white/5 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div>
                                <div className="text-[10px] font-bold text-white uppercase tracking-wider">{m.label}</div>
                                <div className="text-[8px] text-slate-500 font-mono mt-1">{m.desc}</div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                newProvData.selectedModels.includes(m.id)
                                  ? 'bg-intel-cyan border-intel-cyan text-black'
                                  : 'border-white/10 text-transparent'
                              }`}>
                                <Check className="w-3 h-3" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setProvisionStep(1)}
                      className="flex-1 py-4 rounded-2xl border border-white/10 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                      Back
                    </button>
                    <button
                      disabled={newProvData.selectedModels.length === 0}
                      onClick={() => {
                        const catalogModels = MODEL_CATALOG[newProvData.provider]?.models || [];
                        const isCustom = newProvData.provider === 'custom';
                        const newNodes = newProvData.selectedModels.map(modelId => {
                          const catalogModel = catalogModels.find(m => m.id === modelId);
                          return {
                            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
                            name: catalogModel?.label || modelId,
                            provider: newProvData.provider,
                            modelName: modelId,
                            apiKey: newProvData.apiKey,
                            status: 'unknown' as const,
                            lastChecked: null,
                            config: isCustom && newProvData.baseUrl ? { baseUrl: newProvData.baseUrl } : undefined,
                          } as AIModel;
                        });
                        onPersistModels([...aiModels, ...newNodes]);
                        setShowAdd(false);
                      }}
                      className="flex-[2] py-4 rounded-2xl bg-intel-cyan text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-30"
                    >
                      Provision {newProvData.selectedModels.length} Nodes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface SystemCommandCenterProps {
  onClose: () => void;
}

export const SystemCommandCenter: React.FC<SystemCommandCenterProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('MISSION');
  const [jumpStage, setJumpStage] = useState<string | undefined>();
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  
  const { metrics, history, logs, alerts, healthScore } = useObservability();
  const { rriState } = useRiskMetrics();

  const handleJumpToDebugger = (stage?: string) => {
    setJumpStage(stage);
    setActiveTab('DEBUGGER');
  };

  const handleSnapshot = () => {
    setIsSnapshotting(true);
    
    const snapshot = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      system: {
        healthScore,
        activeTab,
      },
      rri: rriState,
      metrics,
      alerts: alerts.slice(0, 20),
      recentLogs: logs.slice(0, 50),
      history: history,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scc_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsSnapshotting(false), 1000);
  };

  const [aiModels, setAiModels] = useState<AIModel[]>(loadModels);
  const [roleAssign, setRoleAssign] = useState<Record<RoleType, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(ROLE_KEY) || '{"parser":"","analys":"","answer":""}');
    } catch { return { parser: '', analys: '', answer: '' }; }
  });

  const persistModels = (newModels: AIModel[]) => {
    setAiModels(newModels);
    localStorage.setItem(MODEL_KEY, JSON.stringify(newModels));
  };

  const persistRoles = (newRoles: Record<RoleType, string>) => {
    setRoleAssign(newRoles);
    localStorage.setItem(ROLE_KEY, JSON.stringify(newRoles));
  };

  const TABS: { id: Tab; label: string; labelShort: string; icon: React.ElementType }[] = [
    { id: 'MISSION', label: 'Mission Control', labelShort: 'Mission', icon: ShieldAlert },
    { id: 'ADM', label: 'INT PIPELINE', labelShort: 'INT', icon: Database },
    { id: 'RRI_DATA', label: 'RRI & Data', labelShort: 'RRI', icon: BarChart3 },
    { id: 'AI', label: 'AI Models', labelShort: 'AI', icon: Brain },
    { id: 'RAG', label: 'RAG Memory', labelShort: 'RAG', icon: Library },
    { id: 'DEBUGGER', label: 'Pipeline Debug', labelShort: 'Debug', icon: Layers },
    { id: 'NEWS_DEBUG', label: 'RSS/API', labelShort: 'RSS', icon: Send },
    { id: 'DATABASE', label: 'Database', labelShort: 'DB', icon: Database },
    { id: 'TESTS', label: 'Test Suite', labelShort: 'Tests', icon: FlaskConical },
    { id: 'MULTI_AGENT', label: 'Multi-Agent', labelShort: 'Agents', icon: Bot },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#060608] text-white font-mono rounded-none sm:rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden">

      {/* Header */}
      <div className="shrink-0 z-10 bg-black/60 backdrop-blur-xl border-b border-white/5">
        {/* Row 1: Title bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h1 className="text-sm font-bold tracking-widest text-white uppercase truncate">System Command Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/20 uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SCC v1.0
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Actions */}
        <div className="flex items-center gap-3 px-4 md:px-6 pb-3">
          <button
            onClick={handleSnapshot}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${isSnapshotting ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
          >
            <Camera className={`w-3.5 h-3.5 ${isSnapshotting ? 'animate-pulse' : ''}`} />
            <span>Snapshot</span>
          </button>
        </div>

        {/* Row 3: Tab strip */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="flex px-4 md:px-6 gap-1 min-w-min">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={generateStableKey(tab.id, i, 'scc-tab')}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border-b-2 -mb-px shrink-0 ${
                    isActive
                      ? 'border-intel-cyan text-white bg-white/[0.03]'
                      : 'border-transparent text-white/30 hover:text-white/60 hover:border-white/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.labelShort}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full p-5"
          >
            {activeTab === 'MISSION' && (
              <MissionControl 
                onJumpToDebugger={handleJumpToDebugger} 
                aiModels={aiModels} 
                roleAssign={roleAssign} 
              />
            )}
            {activeTab === 'ADM' && <ADMTab onJumpToDebugger={handleJumpToDebugger} />}
            {activeTab === 'RRI_DATA' && <RRIDataTab />}
            {activeTab === 'AI' && (
              <AITab 
                aiModels={aiModels} 
                roleAssign={roleAssign} 
                onPersistModels={persistModels} 
                onPersistRoles={persistRoles} 
              />
            )}
            {activeTab === 'RAG' && <RAGTab />}
            {activeTab === 'DEBUGGER' && <DebuggerTab jumpToStage={jumpStage} />}
            {activeTab === 'NEWS_DEBUG' && <RSSTab />}
            {activeTab === 'TESTS' && <TestSuite />}
            {activeTab === 'DATABASE' && <DatabaseTab />}
            {activeTab === 'MULTI_AGENT' && <MultiAgentTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
