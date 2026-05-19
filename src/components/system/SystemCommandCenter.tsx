import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Activity, Database, Radio, Zap, Layers, Terminal,
  Trash2, Pause, Play, Filter, AlertTriangle, ArrowRight,
  RefreshCw, ShieldAlert, CheckCircle2, XCircle, Clock,
  Camera, Send, Cpu, FlaskConical, Globe, Users, MapPin,
  FileText, BarChart3, TrendingUp, RotateCcw, Server, AlertCircle,
  Loader2, Wifi, Eye, Brain, Plus, Edit3, Save, Power, PowerOff, Key, Check, Link,
  ChevronDown, Sparkles, TestTube2, Signal, Search
} from 'lucide-react';
import { motion as m } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { pipelineDebugger, DebugLog } from '../../services/debugService';
import { prepareList, generateStableKey } from '../../lib/keyUtils';
import { useObservability } from '../../context/ObservabilityContext';
import { useRSS } from '../../context/RSSContext';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { fetchAllFeeds, ingestionMetrics, fetchRSSFeed, validateRSSSource } from '../../services/rssService';
import { RSS_SOURCES } from '../../config/rssSources';
import { TELEGRAM_CHANNELS, fetchTelegramChannel } from '../../services/telegramService';
import { fetchFromNewsAPI, fetchFromNewsData, fetchFromGNews } from '../../services/newsApiService';
import { FeedColumn } from '../debug/FeedColumn';
import { NewsColumn } from '../debug/NewsColumn';
import { SignalsColumn } from '../debug/SignalsColumn';
import { EventsColumn } from '../debug/EventsColumn';
import { PipelineLogColumn } from '../debug/PipelineLogColumn';
import { getVarCache } from '../../services/pipelineService';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Tab = 'MISSION' | 'DEBUGGER' | 'TESTS' | 'NEWS_DEBUG' | 'ADM' | 'RRI_DATA' | 'AI';

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

  const tickerContent = hasFlowIssues
    ? [...flowIssues, ...flowIssues]
    : [
        {
          key: 'ok',
          status: 'FLOWING' as ConnStatus,
          from: 'ok',
          to: 'ok',
          fromLabel: 'No active flow errors',
          toLabel: '',
          fromStage: 'MISSION',
          toStage: 'MISSION',
          timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        },
      ];

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

      <div className="px-5 py-2 border-t border-white/5 text-[9px] font-mono bg-black/30 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className={hasFlowIssues ? 'text-red-400' : 'text-emerald-400'}>
            ADM Flow Errors:
          </span>
          <span className="text-white/25">(click an item to jump)</span>
        </div>

        <div className="w-full overflow-hidden whitespace-nowrap">
          <div className={`adm-ticker-track ${hasFlowIssues ? 'adm-ticker-run' : ''}`}>
            {tickerContent.map((issue, idx) => {
              const isIssue = issue.status === 'SLOW' || issue.status === 'BLOCKED';
              const tone = issue.status === 'BLOCKED'
                ? 'text-red-300 border-red-500/30 bg-red-500/10'
                : issue.status === 'SLOW'
                  ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                  : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';

              return (
                <button
                  key={`${issue.key}-${idx}`}
                  id={`adm-flow-issue-${idx}`}
                  type="button"
                  onClick={() => isIssue && onNodeClick(issue.toStage)}
                  className={`inline-flex items-center gap-2 px-2 py-1 mr-3 rounded border ${tone} ${isIssue ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}`}
                  title={isIssue ? `Jump to ${issue.toStage}` : 'Pipeline healthy'}
                >
                  <span className="text-white/60">[{issue.timestamp}]</span>
                  <span>{issue.status}</span>
                  <span className="text-white/80">{issue.fromLabel}{issue.toLabel ? ` → ${issue.toLabel}` : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
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

  const getModelForRole = (role: RoleType) => {
    if (!roleAssign) return 'Loading...';
    const assignedId = roleAssign[role];
    if (!assignedId) return 'Not Assigned';
    const model = (aiModels || []).find(m => m.id === assignedId);
    if (!model) return 'Unknown';
    return `${model.provider === 'google' ? 'Gemini' : model.provider.charAt(0).toUpperCase() + model.provider.slice(1)}: ${model.modelName}`;
  };

  const getRoleHealth = (role: RoleType): 'online' | 'offline' | 'standby' => {
    if (!roleAssign) return 'standby';
    const assignedId = roleAssign[role];
    if (!assignedId) return 'standby';
    
    // Check both local custom models and environment-provided models
    const allPossibleModels = [...(aiModels || [])];
    const model = allPossibleModels.find(m => m.id === assignedId);
    
    if (!model) return 'standby';
    return model.status === 'online' ? 'online' : 'offline';
  };

  const serviceChecks = [
    { label: 'RSS Feed', ok: metrics.lastIngestionTime > 0 && (Date.now() - metrics.lastIngestionTime < 600000) },
    { label: 'Supabase DB', ok: metrics.dbWriteCount > 0 || metrics.dbReadCount > 0 },
    { label: 'Signal Engine', ok: metrics.signalCount >= 0 },
    { label: 'National Briefing', health: getRoleHealth('parsing'), detail: getModelForRole('parsing') },
    { label: 'Predictive Analysis', health: getRoleHealth('analysis'), detail: getModelForRole('analysis') },
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

const SourceDebuggerTab: React.FC = () => {
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, 'healthy' | 'warning' | 'failing' | 'idle' | 'testing'>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const allSources = useMemo(() => prepareList([
    ...RSS_SOURCES.map(s => ({ ...s, id: s.id || s.url, group: 'RSS' })),
    ...TELEGRAM_CHANNELS.map(s => ({ ...s, group: 'Telegram' })),
    { id: 'newsapi', name: 'NewsAPI.org', group: 'API', type: 'api', url: 'https://newsapi.org' },
    { id: 'newsdata', name: 'NewsData.io', group: 'API', type: 'api', url: 'https://newsdata.io' },
    { id: 'gnews', name: 'GNews.io', group: 'API', type: 'api', url: 'https://gnews.io' },
  ]), []);

  const testSource = async (source: any) => {
    setStatusMap(prev => ({ ...prev, [source.id]: 'testing' }));
    try {
      if (source.group === 'RSS') {
        const res = await validateRSSSource(source.url);
        // Check if actually has items
        const data = await fetchRSSFeed(source);
        if (res === 'failing') {
          setStatusMap(prev => ({ ...prev, [source.id]: 'failing' }));
        } else if (data.length === 0) {
          // Yellow if no feed
          setStatusMap(prev => ({ ...prev, [source.id]: 'warning' }));
        } else if (res === 'degraded') {
          setStatusMap(prev => ({ ...prev, [source.id]: 'warning' }));
        } else {
          setStatusMap(prev => ({ ...prev, [source.id]: 'healthy' }));
        }
      } else if (source.group === 'Telegram') {
        const data = await fetchTelegramChannel(source, 0);
        if (data.length === 0) {
          setStatusMap(prev => ({ ...prev, [source.id]: 'warning' }));
        } else {
          setStatusMap(prev => ({ ...prev, [source.id]: 'healthy' }));
        }
      } else {
        // API Sources
        let data: any[] = [];
        if (source.id === 'newsapi') data = await fetchFromNewsAPI();
        else if (source.id === 'newsdata') data = await fetchFromNewsData();
        else if (source.id === 'gnews') data = await fetchFromGNews();
        
        if (data.length === 0) {
          setStatusMap(prev => ({ ...prev, [source.id]: 'warning' }));
        } else {
          setStatusMap(prev => ({ ...prev, [source.id]: 'healthy' }));
        }
      }
    } catch {
      // Failed to fetch -> yellow per user request
      setStatusMap(prev => ({ ...prev, [source.id]: 'warning' }));
    }
  };

  const testAll = async () => {
    setIsTestingAll(true);
    // Prioritize RSS sources for testing as requested
    const rss = allSources.filter(s => s.group === 'RSS');
    const others = allSources.filter(s => s.group !== 'RSS');
    
    for (const source of [...rss, ...others]) {
      await testSource(source);
    }
    setIsTestingAll(false);
  };

  const selectSource = async (source: any) => {
    setSelectedSource(source);
    setLoading(true);
    setItems([]);
    try {
      let data: any[] = [];
      if (source.group === 'RSS') {
        data = await fetchRSSFeed(source);
      } else if (source.group === 'Telegram') {
        data = await fetchTelegramChannel(source);
      } else if (source.id === 'newsapi') {
        data = await fetchFromNewsAPI();
      } else if (source.id === 'newsdata') {
        data = await fetchFromNewsData();
      } else if (source.id === 'gnews') {
        data = await fetchFromGNews();
      }
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden">
      {/* List Column */}
      <div className="w-full lg:w-80 flex flex-col bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden shrink-0 h-1/3 lg:h-full">
        <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between sticky top-0 z-10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Data Sources</span>
          <button 
            onClick={testAll}
            disabled={isTestingAll}
            className="flex items-center gap-1.5 px-2 py-1 bg-intel-cyan/10 hover:bg-intel-cyan/20 border border-intel-cyan/30 rounded text-[9px] font-bold text-intel-cyan transition-all disabled:opacity-50"
          >
            {isTestingAll ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Wifi className="w-2.5 h-2.5" />}
            Test All
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {['RSS', 'Telegram', 'API'].map((group: string, groupIndex: number) => (
            <div key={group} className="mb-4">
              <div className="px-2 py-1 text-[8px] font-bold text-white/20 uppercase tracking-tight">{group}</div>
              {prepareList(allSources
                .filter((s: any) => s.group === group)
                .sort((a: any, b: any) => {
                  const statusA = statusMap[a.id] || 'idle';
                  const statusB = statusMap[b.id] || 'idle';
                  
                  // Priority: testing > healthy > idle > warning > failing
                  const scores: Record<string, number> = {
                    testing: 5,
                    healthy: 4,
                    idle: 3,
                    warning: 2,
                    failing: 1
                  };
                  
                  return (scores[statusB] || 0) - (scores[statusA] || 0);
                })).map((source: any, sourceIndex: number) => (
                <div 
                  key={generateStableKey(source.id, sourceIndex, 'source-item')}
                  onClick={() => selectSource(source)}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${selectedSource?.id === source.id ? 'bg-intel-cyan/10 border border-intel-cyan/20' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px] ${
                      statusMap[source.id] === 'healthy' ? 'bg-emerald-500 shadow-emerald-500/40' : 
                      statusMap[source.id] === 'warning' ? 'bg-amber-500 shadow-amber-500/40' :
                      statusMap[source.id] === 'failing' ? 'bg-red-500 shadow-red-500/40' : 
                      'bg-white/10 shadow-transparent'
                    }`} />
                    <span className={`text-[11px] truncate ${selectedSource?.id === source.id ? 'text-white font-bold' : 'text-white/60'}`}>{source.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); testSource(source); }}
                    className="p-1.5 hover:text-white text-white/20 hover:bg-white/5 rounded transition-all"
                    title="Test Source"
                  >
                    <RefreshCw className={`w-3 h-3 ${statusMap[source.id] === 'testing' ? 'animate-spin text-intel-cyan' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Content Column */}
      <div className="flex-1 flex flex-col bg-[#0a0a0c] border border-white/5 rounded-xl overflow-hidden h-2/3 lg:h-full">
        <div className="p-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-intel-cyan" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {selectedSource ? selectedSource.name : 'Select a source'}
              {selectedSource && <span className="ml-2 text-white/30 font-normal">({items.length} items)</span>}
            </span>
          </div>
          {loading && <Loader2 className="w-3.5 h-3.5 text-intel-cyan animate-spin" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {!selectedSource ? (
            <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-4">
              <Eye className="w-12 h-12 opacity-50" />
              <div className="text-xs uppercase tracking-widest font-bold">Waiting for selection…</div>
            </div>
          ) : items.length === 0 && !loading ? (
            <div className="text-center py-20 text-white/30 text-xs italic">No content found or failed to fetch.</div>
          ) : (
            prepareList(items).map((item: any) => (
              <div key={item.id} className="p-3 bg-white/[0.03] border border-white/5 rounded-lg hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xs font-bold text-white/90 leading-tight">{item.title}</h3>
                  <span className="text-[9px] font-mono text-white/30 shrink-0">{item.published_at ? new Date(item.published_at).toLocaleTimeString() : 'N/A'}</span>
                </div>
                {item.summary && <p className="text-[10px] text-white/50 leading-relaxed line-clamp-3">{item.summary}</p>}
                <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-2">
                  <div className="text-[8px] font-mono text-white/20 uppercase">Severity: <span className={item.severity >= 4 ? 'text-red-400' : 'text-intel-cyan'}>{item.severity}</span></div>
                  <div className="text-[8px] font-mono text-white/20 uppercase">Geo: <span className="text-white/40">{item.geo_relevance_score?.toFixed(2) || 'N/A'}</span></div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[8px] font-bold text-intel-cyan hover:underline uppercase tracking-widest">Source ↗</a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
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

type RoleType = 'parsing' | 'analysis' | 'answering';

// ─── AI TAB ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<RoleType, string> = {
  parsing: 'Variable Parsing',
  analysis: 'RRI Analysis',
  answering: 'Question Answering',
};

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
        }
      })
      .catch(() => {});
  }, []);

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
        setRoleAssign(nextRoles);
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

  const filteredModels = useMemo(() => {
    if (!modelFilter.trim()) return allModels;
    const q = modelFilter.toLowerCase();
    return allModels.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.modelName.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q)
    );
  }, [allModels, modelFilter]);

  const testAllConnections = async () => {
    for (const model of allModels) {
      if (model.status === 'online') continue;
      const isEnv = envModels.some(em => em.id === model.id);
      await testConnection(model, isEnv);
    }
  };

  const toggleFailover = () => {
    const next = !autoFailover;
    setAutoFailover(next);
    localStorage.setItem('ti_auto_failover', String(next));
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

  const usedInRole = (id: string): RoleType | null => {
    for (const [role, assigned] of Object.entries(roleAssign)) {
      if (assigned === id) return role as RoleType;
    }
    return null;
  };

  const isModelInUse = (id: string) => Object.values(roleAssign).includes(id);
  const modelForRole = (role: RoleType) => allModels.find(m => m.id === roleAssign[role]);

  return (
    <div className="flex flex-col h-full pr-1 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-intel-cyan/10 border border-intel-cyan/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.1)]">
            <Brain className="w-5 h-5 text-intel-cyan" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              AI Command Matrix
              <Sparkles className="w-3 h-3 text-intel-cyan animate-pulse" />
            </h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">
              {allModels.length} active nodes across {Object.keys(modelsByProvider).length} clusters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFailover}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase font-mono transition-all border ${
              autoFailover
                ? 'border-intel-green/40 text-intel-green bg-intel-green/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                : 'border-white/10 text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoFailover ? 'animate-pulse' : ''}`} />
            {autoFailover ? 'FAILOVER ACTIVE' : 'FAILOVER OFF'}
          </button>
        </div>
      </div>

      {/* Models List - Unified View */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] shrink-0">
              AI Intelligence Nodes
              <span className="ml-2 text-intel-cyan/60">{allModels.length}</span>
            </span>
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
              <input
                value={modelFilter}
                onChange={e => setModelFilter(e.target.value)}
                placeholder="Filter nodes..."
                className="w-full bg-black/40 border border-white/5 rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white font-mono placeholder:text-white/10 focus:border-intel-cyan/30 focus:outline-none transition-all"
              />
              {modelFilter && (
                <button onClick={() => setModelFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {allModels.some(m => m.status !== 'online') && (
              <button
                onClick={testAllConnections}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase font-mono border border-white/5 text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/20 transition-all"
              >
                <Zap className="w-3 h-3" />
                Test All
              </button>
            )}
            <button
              onClick={() => {
                setProvisionStep(1);
                setNewProvData({ provider: 'google', apiKey: '', selectedModels: [] });
                setShowAdd(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase font-mono border border-intel-cyan/30 text-intel-cyan hover:bg-intel-cyan/10 transition-all"
            >
              <Plus className="w-3 h-3" />
              Provision Node
            </button>
          </div>
        </div>

        {filteredModels.length === 0 ? (
          <div className="bg-black/20 border border-dashed border-white/5 rounded-2xl p-10 text-center">
            <Cpu className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              {modelFilter ? 'No nodes match your filter' : 'No active nodes in this cluster'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredModels.map(model => {
              const isEditing = editingId === model.id;
              const isEnv = envModels.some(em => em.id === model.id);
              const isTesting = testingId === model.id;
              const role = usedInRole(model.id);
              
              return (
                <motion.div 
                  key={model.id}
                  layout
                  className={`bg-[#0a0a0c] border rounded-2xl p-4 transition-all border-l-2 ${
                    isEditing
                      ? 'border-intel-cyan/50 border-l-intel-cyan/50 shadow-[0_0_30px_rgba(0,242,255,0.1)]'
                      : `border-white/5 hover:border-white/10 ${PROVIDER_STYLE[model.provider]?.border || 'border-l-slate-500/40'}`
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Instance Name</label>
                          <input 
                            defaultValue={model.name} 
                            onChange={e => updateModel(model.id, { name: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Model Engine</label>
                          <select 
                            defaultValue={model.modelName}
                            onChange={e => updateModel(model.id, { modelName: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                          >
                            {MODEL_CATALOG[model.provider].models.map(m => (
                              <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Secret Key</label>
                          <div className="relative">
                            <input 
                              defaultValue={model.apiKey} 
                              onChange={e => updateModel(model.id, { apiKey: e.target.value })}
                              type="password"
                              className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-intel-cyan/50 focus:outline-none"
                              placeholder="sk-..."
                            />
                            <Key className="absolute right-3 top-3 w-3 h-3 text-white/20" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="px-4 py-2 text-[10px] font-bold uppercase font-mono text-slate-500 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleTestAndSave(model, isEnv)}
                          disabled={testingId === model.id}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-intel-cyan/10 border border-intel-cyan/30 text-intel-cyan text-[10px] font-bold uppercase font-mono hover:bg-intel-cyan/20 transition-all shadow-[0_0_15px_rgba(0,242,255,0.1)] disabled:opacity-40"
                        >
                          {testingId === model.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          {testingId === model.id ? 'Testing...' : 'Test & Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative">
                          <div className={`w-3 h-3 rounded-full ${
                            model.status === 'online' ? 'bg-intel-green shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
                            model.status === 'offline' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                            'bg-slate-700 animate-pulse'
                          }`} />
                          {model.status === 'online' && <div className="absolute inset-0 bg-intel-green rounded-full animate-ping opacity-20" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-bold text-white tracking-wide truncate">{model.name}</span>
                            <span className="text-[8px] font-mono text-slate-500 border border-white/10 px-1.5 py-0.5 rounded uppercase">{model.modelName}</span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${PROVIDER_STYLE[model.provider]?.bg || 'bg-slate-500/10'}`}
                              style={{ color: PROVIDER_STYLE[model.provider]?.color || '#64748B' }}>
                              {PROVIDER_STYLE[model.provider]?.label || model.provider}
                            </span>
                            {isEnv && <span className="text-[8px] font-mono text-intel-cyan bg-intel-cyan/10 px-1.5 py-0.5 rounded uppercase tracking-wider">ENV</span>}
                            {role && <span className="text-[8px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{ROLE_LABELS[role]}</span>}
                          </div>
                          {(() => {
                            const catModels = MODEL_CATALOG[model.provider]?.models;
                            const entry = catModels?.find(m => m.id === model.modelName);
                            return entry?.desc ? (
                              <p className="text-[9px] font-mono text-slate-600 mb-1.5">{entry.desc}</p>
                            ) : null;
                          })()}
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {model.lastChecked ? `Sync: ${new Date(model.lastChecked).toLocaleTimeString()}` : 'No sync recorded'}
                            </span>
                            <span className={`text-[9px] font-mono flex items-center gap-1 ${
                              model.latencyMs !== undefined
                                ? model.latencyMs < 500 ? 'text-intel-green' : model.latencyMs < 2000 ? 'text-amber-500' : 'text-red-500'
                                : 'text-slate-500'
                            }`}>
                              <Signal className="w-2.5 h-2.5" />
                              {model.latencyMs !== undefined ? `${model.latencyMs}ms` : model.status === 'online' ? 'Live' : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => testConnection(model, isEnv)}
                          disabled={testingId === model.id}
                          className={`p-2 rounded-xl transition-all ${testingId === model.id ? 'text-intel-cyan bg-intel-cyan/5' : 'text-slate-500 hover:text-intel-cyan hover:bg-white/5'}`}
                          title="Verify Intelligence Node"
                        >
                          {testingId === model.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        </button>
                        {!isEnv && (
                          <>
                            <button
                              onClick={() => setEditingId(model.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                              title="Recalibrate"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemove(model.id)}
                              disabled={isModelInUse(model.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-20"
                              title={isModelInUse(model.id) ? 'Locked: Active in routing' : 'Decommission'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Assignment Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 pt-4 border-t border-white/5">
        {(Object.keys(ROLE_LABELS) as RoleType[]).map(role => (
          <div key={role} className="bg-[#0a0a0c] border border-white/5 rounded-xl p-3 space-y-2 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-intel-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{ROLE_LABELS[role]}</span>
              {modelForRole(role) && (
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${modelForRole(role)!.status === 'online' ? 'bg-intel-green animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-[8px] font-mono uppercase ${modelForRole(role)!.status === 'online' ? 'text-intel-green' : 'text-red-400'}`}>
                    {modelForRole(role)!.status === 'online' ? 'ACTIVE' : 'OFFLINE'}
                  </span>
                </div>
              )}
            </div>
            <select
              value={roleAssign[role]}
              onChange={e => onPersistRoles({ ...roleAssign, [role]: e.target.value })}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-2 text-[10px] text-white font-mono focus:border-intel-cyan/50 focus:outline-none relative z-10 hover:border-white/20 transition-colors"
            >
              <option value="">— NO MODEL ASSIGNED —</option>
              {allModels.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.modelName})</option>
              ))}
            </select>
          </div>
        ))}
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
      return JSON.parse(localStorage.getItem(ROLE_KEY) || '{"parsing":"","analysis":"","answering":""}');
    } catch { return { parsing: '', analysis: '', answering: '' }; }
  });

  const persistModels = (newModels: AIModel[]) => {
    setAiModels(newModels);
    localStorage.setItem(MODEL_KEY, JSON.stringify(newModels));
  };

  const persistRoles = (newRoles: Record<RoleType, string>) => {
    setRoleAssign(newRoles);
    localStorage.setItem(ROLE_KEY, JSON.stringify(newRoles));
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'MISSION', label: 'Mission Control', icon: ShieldAlert },
    { id: 'ADM', label: 'Intelligence Pipeline (ADM)', icon: Database },
    { id: 'RRI_DATA', label: 'RRI & Data', icon: BarChart3 },
    { id: 'AI', label: 'AI Models', icon: Brain },
    { id: 'DEBUGGER', label: 'Pipeline Debug', icon: Layers },
    { id: 'NEWS_DEBUG', label: 'News Debug', icon: Send },
    { id: 'TESTS', label: 'Test Suite', icon: FlaskConical },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#060608] text-white font-mono rounded-none sm:rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-white/5 bg-black/60 backdrop-blur-xl shrink-0 z-10 gap-3">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h1 className="text-sm font-bold tracking-widest text-white uppercase truncate">System Command Center</h1>
          </div>
          <div className="hidden md:block h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 flex-wrap">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <button
                  key={generateStableKey(tab.id, i, 'scc-tab')}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
          <button
            onClick={handleSnapshot}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${isSnapshotting ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}
          >
            <Camera className={`w-3.5 h-3.5 ${isSnapshotting ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
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
            {activeTab === 'DEBUGGER' && <DebuggerTab jumpToStage={jumpStage} />}
            {activeTab === 'NEWS_DEBUG' && <SourceDebuggerTab />}
            {activeTab === 'TESTS' && <TestSuite />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
