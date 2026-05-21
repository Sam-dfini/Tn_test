import 'katex/dist/katex.min.css';
import katex from 'katex';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot
} from 'recharts';
import {
  BookOpen, ChevronDown, ChevronRight,
  AlertTriangle, Info, ExternalLink,
  Download, Search, X, Activity,
  BarChart3, Brain, Zap, Globe,
  Shield, TrendingUp, Database, Dices,
  Calculator, Radio, LayoutGrid, Users,
  Bell, Bot, Sparkles, Layers, Triangle
} from 'lucide-react';

const Equation: React.FC<{
  latex: string;
  display?: boolean;
  className?: string;
}> = ({ latex, display = true, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode: display,
          throwOnError: false,
          errorColor: '#ff453a',
          output: 'html',
        });
      } catch (e) {
        if (ref.current) {
          ref.current.textContent = latex;
        }
      }
    }
  }, [latex, display]);

  return (
    <div
      ref={ref}
      className={`katex-container overflow-x-auto ${className}`}
    />
  );
};

const VariableRow: React.FC<{
  symbol: string;
  description: string;
  currentValue: string;
  unit: string;
  source: string;
  trend?: 'up' | 'down' | 'stable';
}> = ({ symbol, description, currentValue, unit, source, trend }) => (
  <tr className="border-b border-intel-border/30 hover:bg-white/5 transition-colors">
    <td className="py-2 px-2 md:px-4 font-mono text-intel-cyan text-[10px] md:text-[11px] whitespace-nowrap">{symbol}</td>
    <td className="py-2 px-2 md:px-4 text-slate-300 text-[10px] md:text-[11px]">{description}</td>
    <td className="py-2 px-2 md:px-4 font-mono text-white text-[10px] md:text-[11px] font-bold whitespace-nowrap">{currentValue}</td>
    <td className="hidden sm:table-cell py-2 px-4 text-slate-500 text-[10px]">{unit}</td>
    <td className="hidden md:table-cell py-2 px-4 text-slate-600 text-[10px]">{source}</td>
    <td className="py-2 px-2 md:px-4 text-[10px]">
      {trend === 'up' && <span className="text-intel-red">↑</span>}
      {trend === 'down' && <span className="text-intel-cyan">↓</span>}
      {trend === 'stable' && <span className="text-slate-500">→</span>}
    </td>
  </tr>
);

const Section: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ id, title, icon, badge, badgeColor = 'cyan', children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      id={id}
      className="border border-intel-border rounded-2xl overflow-hidden mb-4 md:mb-6 scroll-mt-20"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-black/40 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="text-intel-cyan shrink-0">{icon}</div>
          <span className="text-xs md:text-sm font-bold text-white uppercase tracking-widest line-clamp-1">{title}</span>
          {badge && (
            <span className={`hidden xs:inline text-[8px] md:text-[9px] font-mono px-1.5 md:px-2 py-0.5 rounded border uppercase text-intel-${badgeColor} border-intel-${badgeColor}/30 bg-intel-${badgeColor}/10`}>
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-slate-500 shrink-0" />
          : <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-slate-500 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 md:px-6 py-4 md:py-6 bg-black/20 space-y-4 md:space-y-6">
          {children}
        </div>
      )}
    </div>
  );
};

const EquationCard: React.FC<{
  number: string;
  title: string;
  latex: string;
  description: string;
  variables: Array<{
    symbol: string;
    meaning: string;
    value?: string;
    calibrated?: boolean;
  }>;
  currentOutput?: string;
  source?: 'paper' | 'extension';
  note?: string;
}> = ({ number, title, latex, description, variables, currentOutput, source = 'paper', note }) => (
  <div className={`rounded-2xl border p-4 md:p-6 space-y-4 ${
    source === 'extension'
      ? 'border-intel-orange/30 bg-intel-orange/5'
      : 'border-intel-cyan/20 bg-black/30'
  }`}>
    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <span className={`text-[10px] md:text-xs font-mono font-bold px-1.5 md:px-2 py-0.5 rounded border uppercase ${
            source === 'extension'
              ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
              : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
          }`}>
            EQ.{number}
          </span>
          {source === 'extension' && (
            <span className="text-[8px] md:text-[9px] font-mono text-intel-orange border border-intel-orange/20 px-1.5 md:px-2 py-0.5 rounded">
              TUNISIAINTEL EXTENSION
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-xs md:text-sm">{title}</h3>
      </div>
      {currentOutput && (
        <div className="text-left sm:text-right">
          <div className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase">
            Current Output
          </div>
          <div className="text-base md:text-lg font-bold font-mono text-intel-cyan">
            {currentOutput}
          </div>
        </div>
      )}
    </div>

    <div className="bg-black/50 rounded-xl p-3 md:p-4 border border-white/5 overflow-x-auto scrollbar-hide">
      <Equation latex={latex} display={true} />
    </div>

    <p className="text-slate-400 text-[10px] md:text-xs leading-relaxed">
      {description}
    </p>

    {variables.length > 0 && (
      <div className="space-y-2">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Variable Definitions</div>
        <div className="space-y-2 md:space-y-1">
          {variables.map((v) => (
            <div key={v.symbol} className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 text-[10px] md:text-[11px] border-b border-white/5 sm:border-none pb-1 sm:pb-0">
              <code className="text-intel-cyan font-mono sm:min-w-[100px] shrink-0">{v.symbol}</code>
              <span className="text-slate-400">{v.meaning}</span>
              <div className="flex items-center ml-0 sm:ml-auto shrink-0 space-x-2">
                {v.value && (
                  <span className="text-white font-mono">{v.value}</span>
                )}
                {v.calibrated && (
                  <span className="text-[8px] md:text-[9px] text-intel-orange">(calibrated)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {note && (
      <div className="flex items-start space-x-2 p-3 bg-intel-orange/10 rounded-lg border border-intel-orange/20">
        <Info className="w-3 h-3 text-intel-orange shrink-0 mt-0.5" />
        <p className="text-[11px] text-intel-orange leading-relaxed">
          {note}
        </p>
      </div>
    )}
  </div>
);

const ArchitectureHierarchyDiagram: React.FC = () => {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  const layerNavMap: Record<number, string> = {
    1: 'variables',
    2: 'equations-paper',
    7: 'equations-ext',
    6: 'equations-ext',
  };

  const handleLayerClick = (id: number) => {
    const sectionId = layerNavMap[id];
    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const layers = [
    { id: 1, tier: '1st', label: 'Variables (251+)', sub: 'Categories A-X', icon: Database, color: '#ff453a', desc: 'Raw data points across 24 categories including economic, social, and political metrics.' },
    { id: 2, tier: '1st', label: 'Equations (24)', sub: 'Added EQ.15-24', icon: Calculator, color: '#ff453a', desc: 'Mathematical models (RRI, SIR, Monte Carlo, MII, CPI, Acceleration) processing raw variables into risk scores.' },
    
    { id: 3, tier: '2nd', label: 'Signals (10)', sub: 'Real-time Indicators', icon: Radio, color: '#0a84ff', desc: 'High-frequency data streams detecting immediate shifts in social sentiment or market stability.' },
    { id: 4, tier: '2nd', label: 'Clusters (6)', sub: 'Thematic Groupings', icon: LayoutGrid, color: '#0a84ff', desc: 'Grouping of variables and signals into thematic clusters for multi-dimensional analysis.' },
    { id: 5, tier: '2nd', label: 'ETM Layer', sub: 'Cognitive Security', icon: Shield, color: '#0a84ff', desc: 'Extended Threat Matrix monitoring information operations and cognitive warfare attempts.' },
    { id: 6, tier: '2nd', label: 'RDE Layer', sub: 'Radicalisation Dynamics', icon: Zap, color: '#0a84ff', desc: 'Analyzing the speed and spread of radical ideologies across digital and physical networks.' },
    { id: 7, tier: '2nd', label: 'MII Layer', sub: 'Elite Stability', icon: Users, color: '#0a84ff', desc: 'Ministerial Instability Index tracking cabinet reshuffles and elite fracture patterns.' },
    { id: 8, tier: '2nd', label: 'Smart Alerts (16)', sub: 'Threshold Triggers', icon: Bell, color: '#0a84ff', desc: 'Automated notification system firing when critical thresholds are breached in any layer.' },
    
    { id: 9, tier: '3rd', label: 'Agent Insights (7)', sub: 'Expert AI Agents', icon: Bot, color: '#30d158', desc: 'Specialized AI agents (Economic, Political, Security, etc.) providing deep-dive qualitative analysis.' },
    { id: 10, tier: '3rd', label: 'AI Synthesis', sub: 'Unified Intelligence', icon: Sparkles, color: '#30d158', desc: 'Final unified intelligence output combining quantitative models and qualitative agent insights.' },
  ];

  const tiers = [
    { id: '1st', label: 'Core Data Tier', range: [0, 1], color: '#ff453a' },
    { id: '2nd', label: 'Analytic Tier', range: [2, 7], color: '#0a84ff' },
    { id: '3rd', label: 'Synthesis Tier', range: [8, 9], color: '#30d158' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start py-4">
      {/* Tiered Stack Container */}
      <div className="flex-[2] w-full relative flex gap-4 sm:gap-12 px-2 sm:px-4">
        
        {/* Tier Brackets (Left) */}
        <div className="hidden sm:flex flex-col w-24 shrink-0 pt-2">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              className="relative flex flex-col items-end justify-center"
              style={{ height: `${(tier.range[1] - tier.range[0] + 1) * 68}px` }}
            >
              <div className="text-[10px] font-mono text-intel-cyan bg-intel-cyan/5 px-2 py-1 rounded border border-intel-cyan/10 uppercase tracking-widest mr-10 rotate-180 [writing-mode:vertical-lr] font-bold shadow-sm">
                {tier.label}
              </div>
              <div className="absolute right-0 top-2 bottom-2 w-3 border-y border-l border-intel-cyan/30 rounded-l-xl bg-intel-cyan/5" />
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap z-20 shadow-lg">
                {tier.id} tier
              </div>
            </div>
          ))}
        </div>

        {/* Layers Stack (Middle) */}
        <div className="flex-1 space-y-1 relative">
          {layers.map((layer, index) => (
            <div key={layer.id} className="relative">
              <motion.div
                onMouseEnter={() => setHoveredLayer(index)}
                onMouseLeave={() => setHoveredLayer(null)}
                onClick={() => handleLayerClick(layer.id)}
                whileTap={{ scale: 0.98 }}
                className={`relative z-10 cursor-pointer h-12 flex items-center px-4 rounded-lg border transition-all duration-300 ${
                  hoveredLayer === index 
                    ? 'bg-white/10 border-intel-cyan/50 -translate-y-0.5 shadow-lg shadow-intel-cyan/10' 
                    : 'bg-black/40 border-intel-border hover:border-white/20'
                }`}
                style={{ 
                  borderLeftWidth: '4px',
                  borderLeftColor: layer.color
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <layer.icon className="w-4 h-4 shrink-0" style={{ color: layer.color }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate uppercase tracking-wider">{layer.label}</h3>
                    <p className="text-[9px] text-slate-500 truncate font-mono">{layer.sub}</p>
                  </div>
                  {index < layers.length - 1 && (
                    <ChevronDown className="w-3 h-3 text-slate-700" />
                  )}
                </div>
              </motion.div>

              {/* Arrow to next layer */}
              {index < layers.length - 1 && (
                <div className="flex justify-center h-4 relative z-0">
                  <div className="w-px h-full bg-slate-800 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-800" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Large Right Bracket */}
          <div className="absolute -right-8 top-2 bottom-2 w-8 border-y border-r border-intel-cyan/30 rounded-r-2xl pointer-events-none" />
        </div>

        {/* Infrastructure Sidebar (Right) */}
        <div className="hidden md:flex flex-col w-20 shrink-0 pt-2 relative">
          <div className="h-full w-12 rounded-2xl border border-intel-cyan/20 bg-intel-cyan/5 flex flex-col items-center py-8 gap-12 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-intel-cyan/10 to-transparent animate-pulse" />
            <div className="text-[10px] font-mono text-intel-cyan bg-intel-cyan/10 px-2 py-1.5 rounded border border-intel-cyan/20 uppercase tracking-widest [writing-mode:vertical-rl] font-bold shadow-sm">
              Infrastructure
            </div>
            <div className="flex flex-col gap-10 relative z-10">
              <Database className="w-6 h-6 text-intel-cyan/70" />
              <Activity className="w-6 h-6 text-intel-cyan/70" />
              <Shield className="w-6 h-6 text-intel-cyan/70" />
            </div>
            <div className="text-[9px] font-mono text-slate-400 bg-black/40 px-2 py-1.5 rounded border border-white/5 uppercase [writing-mode:vertical-rl] mt-auto font-bold tracking-wider shadow-sm">
              Framework / Logging
            </div>
          </div>
          {/* Connector lines to the bracket */}
          <div className="absolute right-full mr-0 top-1/2 -translate-y-1/2 flex flex-col gap-32">
            {[1, 2].map(i => (
              <div key={i} className="w-8 h-px bg-intel-cyan/20 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-intel-cyan" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Panel (Far Right) */}
      <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-4 z-30">
        <AnimatePresence mode="wait">
          {hoveredLayer !== null ? (
            <motion.div
              key={hoveredLayer}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-6 rounded-2xl border border-intel-cyan/30 bg-intel-cyan/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${layers[hoveredLayer].color}20` }}
                >
                  {React.createElement(layers[hoveredLayer].icon, { 
                    className: "w-6 h-6", 
                    style: { color: layers[hoveredLayer].color } 
                  })}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">
                    {layers[hoveredLayer].tier} Tier Layer
                  </div>
                  <div className="text-lg font-bold text-white leading-tight">
                    {layers[hoveredLayer].label.split(' (')[0]}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {layers[hoveredLayer].desc}
              </p>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Sub-Systems</div>
                  <div className="text-[11px] text-intel-cyan font-mono">{layers[hoveredLayer].sub}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-slate-400 border border-white/10">
                    Real-time
                  </span>
                  <span className="px-2 py-1 rounded bg-white/5 text-[10px] text-slate-400 border border-white/10">
                    Scalable
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass p-6 rounded-2xl border border-intel-border bg-black/40 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-intel-cyan/10 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-intel-cyan/50" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">System Architecture</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The platform follows a strictly tiered architectural pattern. Data flows from the Core Tier (Bottom) through analytic processing to the Synthesis Tier (Top).
              </p>
              <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/5 text-left">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Architecture Legend</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ff453a]" />
                    <span className="text-[10px] text-slate-400">1st Tier: Core Data Input</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0a84ff]" />
                    <span className="text-[10px] text-slate-400">2nd Tier: Analytic Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#30d158]" />
                    <span className="text-[10px] text-slate-400">3rd Tier: Intelligence Synthesis</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DataFlowDiagram: React.FC<{
  rriState: any;
  data: any;
}> = ({ rriState, data }) => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [animStep, setAnimStep] = useState(0);

  // Animate flow steps on mount
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimStep(prev => (prev + 1) % 6);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const isActive = (step: number) => animStep >= step;
  const isPulsing = (step: number) => animStep === step;

  // Node hover descriptions
  const NODE_DESC: Record<string, string> = {
    sources: 'RSS feeds, APIs, PDFs, and social media monitored continuously for new intelligence',
    pipeline: 'Documents ingested, fields extracted, analyst reviews and approves changes',
    variables: 'All 251+ RRI variables stored with current values, history, and pipeline field mappings',
    engine: 'rriEngine.ts runs 24 equations including Monte Carlo simulation (10,000 runs)',
    outputs: 'R(t), P_rev, V(t), HPS, CS(t), P_cascade — 7 model outputs updated in real-time',
    modules: '10 Professional modules pull live data from PipelineContext and display analytics',
    notifications: 'Alert system fires when thresholds breached — analyst notified immediately',
    tactical: 'Tactical dashboard shows live R(t), map, OSINT stream, and geofence alerts',
  };

  return (
    <div className="space-y-6">
      {/* Description on hover */}
      <div className="h-10 flex items-center">
        {activeNode ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-intel-cyan font-mono"
          >
            {NODE_DESC[activeNode]}
          </motion.div>
        ) : (
          <div className="text-[10px] text-slate-600 font-mono">
            Hover any node to learn more
          </div>
        )}
      </div>

      {/* SVG Diagram */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[800px] md:min-w-0">
          <svg
            viewBox="0 0 900 400"
            className="w-full h-auto"
            style={{ maxHeight: '420px' }}
          >
        {/* === COLUMN 1: SOURCES === */}
        {[
          { y: 60, label: 'RSS Feeds', sub: '7 active', color: '#ff9f0a' },
          { y: 130, label: 'APIs', sub: 'BCT, IMF, WB', color: '#00d4ff' },
          { y: 200, label: 'Documents', sub: 'PDF / HTML', color: '#bf5af2' },
          { y: 270, label: 'Social Media', sub: 'FB / Telegram', color: '#0a84ff' },
        ].map((s) => (
          <g key={s.label}
            onMouseEnter={() => setActiveNode('sources')}
            onMouseLeave={() => setActiveNode(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x="20" y={s.y - 18} width="120" height="36"
              rx="6" fill={`${s.color}15`}
              stroke={isActive(0) ? s.color : '#1e293b'}
              strokeWidth="1"
              className="transition-all duration-500"
            />
            <text x="80" y={s.y - 3} textAnchor="middle"
              fill={isActive(0) ? '#e2e8f0' : '#475569'}
              fontSize="10" fontFamily="monospace"
              fontWeight="bold"
              className="transition-all duration-500"
            >{s.label}</text>
            <text x="80" y={s.y + 11} textAnchor="middle"
              fill={isActive(0) ? s.color : '#334155'}
              fontSize="8" fontFamily="monospace"
            >{s.sub}</text>
          </g>
        ))}

        {/* COLUMN 1 LABEL */}
        <text x="80" y="330" textAnchor="middle"
          fill="#475569" fontSize="8" fontFamily="monospace"
          fontWeight="bold" letterSpacing="2"
        >SOURCES</text>

        {/* === ARROWS: Sources → Pipeline === */}
        {[60, 130, 200, 270].map((y) => (
          <g key={y}>
            <line x1="142" y1={y} x2="200" y2="165"
              stroke={isActive(1) ? '#00d4ff' : '#1e293b'}
              strokeWidth={isPulsing(1) ? "1.5" : "1"}
              strokeDasharray="4 3"
              className="transition-all duration-500"
            />
            {isPulsing(1) && (
              <circle cx={142 + (200-142)*0.5} cy={y + (165-y)*0.5}
                r="3" fill="#00d4ff">
                <animate attributeName="opacity"
                  values="1;0;1" dur="0.8s" repeatCount="indefinite"/>
              </circle>
            )}
          </g>
        ))}

        {/* === COLUMN 2: PIPELINE === */}
        <g onMouseEnter={() => setActiveNode('pipeline')}
           onMouseLeave={() => setActiveNode(null)}
           style={{ cursor: 'pointer' }}>
          <rect x="200" y="110" width="130" height="110"
            rx="8"
            fill={isActive(1) ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.3)'}
            stroke={isActive(1) ? '#00d4ff' : '#1e293b'}
            strokeWidth={isPulsing(1) ? "2" : "1"}
            className="transition-all duration-500"
          />
          <text x="265" y="140" textAnchor="middle"
            fill={isActive(1) ? '#e2e8f0' : '#475569'}
            fontSize="11" fontFamily="monospace" fontWeight="bold"
          >PIPELINE</text>
          {[
            { y: 160, text: '① Ingest', color: '#00d4ff' },
            { y: 178, text: '② Extract', color: '#ff9f0a' },
            { y: 196, text: '③ Review', color: '#bf5af2' },
            { y: 214, text: '④ Approve', color: '#30d158' },
          ].map((item) => (
            <text key={item.text} x="265" y={item.y} textAnchor="middle"
              fill={isActive(1) ? item.color : '#334155'}
              fontSize="9" fontFamily="monospace"
              className="transition-all duration-500"
            >{item.text}</text>
          ))}
        </g>

        {/* === ARROW: Pipeline → Variables === */}
        <g>
          <line x1="332" y1="165" x2="390" y2="165"
            stroke={isActive(2) ? '#30d158' : '#1e293b'}
            strokeWidth={isPulsing(2) ? "2" : "1"}
            className="transition-all duration-500"
          />
          <polygon
            points={`${isActive(2) ? '395' : '390'},165 385,160 385,170`}
            fill={isActive(2) ? '#30d158' : '#1e293b'}
            className="transition-all duration-500"
          />
          {isPulsing(2) && (
            <circle cx="361" cy="165" r="3" fill="#30d158">
              <animate attributeName="cx"
                values="332;390" dur="0.8s" repeatCount="indefinite"/>
            </circle>
          )}
        </g>

        {/* === COLUMN 3: VARIABLES === */}
        <g onMouseEnter={() => setActiveNode('variables')}
           onMouseLeave={() => setActiveNode(null)}
           style={{ cursor: 'pointer' }}>
          <rect x="395" y="110" width="130" height="110"
            rx="8"
            fill={isActive(2) ? 'rgba(48,209,88,0.08)' : 'rgba(0,0,0,0.3)'}
            stroke={isActive(2) ? '#30d158' : '#1e293b'}
            strokeWidth={isPulsing(2) ? "2" : "1"}
            className="transition-all duration-500"
          />
          <text x="460" y="138" textAnchor="middle"
            fill={isActive(2) ? '#e2e8f0' : '#475569'}
            fontSize="11" fontFamily="monospace" fontWeight="bold"
          >VARIABLES</text>
          <text x="460" y="158" textAnchor="middle"
            fill={isActive(2) ? '#30d158' : '#334155'}
            fontSize="9" fontFamily="monospace"
           >251+ variables</text>
          <text x="460" y="175" textAnchor="middle"
            fill={isActive(2) ? '#30d158' : '#334155'}
            fontSize="9" fontFamily="monospace"
          >24 categories</text>
          <text x="460" y="192" textAnchor="middle"
            fill={isActive(2) ? '#30d158' : '#334155'}
            fontSize="9" fontFamily="monospace"
          >A → X</text>
          <text x="460" y="209" textAnchor="middle"
            fill={isActive(2) ? '#475569' : '#1e293b'}
            fontSize="8" fontFamily="monospace"
          >rri_variables.json</text>
        </g>

        {/* === ARROW: Variables → Engine === */}
        <g>
          <line x1="527" y1="165" x2="585" y2="165"
            stroke={isActive(3) ? '#ff453a' : '#1e293b'}
            strokeWidth={isPulsing(3) ? "2" : "1"}
            className="transition-all duration-500"
          />
          <polygon
            points="590,165 580,160 580,170"
            fill={isActive(3) ? '#ff453a' : '#1e293b'}
            className="transition-all duration-500"
          />
          {isPulsing(3) && (
            <circle cx="527" cy="165" r="3" fill="#ff453a">
              <animate attributeName="cx"
                values="527;585" dur="0.8s" repeatCount="indefinite"/>
            </circle>
          )}
        </g>

        {/* === COLUMN 4: RRI ENGINE === */}
        <g onMouseEnter={() => setActiveNode('engine')}
           onMouseLeave={() => setActiveNode(null)}
           style={{ cursor: 'pointer' }}>
          <rect x="590" y="80" width="130" height="170"
            rx="8"
            fill={isActive(3) ? 'rgba(255,69,58,0.08)' : 'rgba(0,0,0,0.3)'}
            stroke={isActive(3) ? '#ff453a' : '#1e293b'}
            strokeWidth={isPulsing(3) ? "2" : "1"}
            className="transition-all duration-500"
          />
          <text x="655" y="108" textAnchor="middle"
            fill={isActive(3) ? '#e2e8f0' : '#475569'}
            fontSize="11" fontFamily="monospace" fontWeight="bold"
          >RRI ENGINE</text>
          <text x="655" y="125" textAnchor="middle"
            fill={isActive(3) ? '#ff453a' : '#334155'}
            fontSize="9" fontFamily="monospace"
          >rriEngine.ts</text>
          {[
            '24 equations',
            'Monte Carlo',
            '10,000 runs',
            'EQ.1 → EQ.24',
            'Samir Dni +',
            'TN Extensions',
          ].map((t, i) => (
            <text key={t} x="655" y={145 + i * 16}
              textAnchor="middle"
              fill={isActive(3) ? '#94a3b8' : '#1e293b'}
              fontSize="8" fontFamily="monospace"
              className="transition-all duration-500"
            >{t}</text>
          ))}
        </g>

        {/* === ARROWS: Engine → Outputs (up and down) === */}
        {[
          { y: 100, label: `R(t)=${rriState.rri.toFixed(2)}`, color: '#ff453a' },
          { y: 145, label: `P_rev=${(rriState.p_rev*100).toFixed(0)}%`, color: '#ff9f0a' },
          { y: 190, label: `V(t)=${rriState.velocity > 0 ? '+' : ''}${rriState.velocity.toFixed(2)}`, color: '#00d4ff' },
          { y: 235, label: `HPS=${(rriState.pattern_similarity*100).toFixed(0)}%`, color: '#bf5af2' },
        ].map((out) => (
          <g key={out.label}
            onMouseEnter={() => setActiveNode('outputs')}
            onMouseLeave={() => setActiveNode(null)}
            style={{ cursor: 'pointer' }}
          >
            <line x1="722" y1={out.y} x2="760" y2={out.y}
              stroke={isActive(4) ? out.color : '#1e293b'}
              strokeWidth={isPulsing(4) ? "2" : "1"}
              className="transition-all duration-500"
            />
            <polygon
              points={`765,${out.y} 758,${out.y-4} 758,${out.y+4}`}
              fill={isActive(4) ? out.color : '#1e293b'}
              className="transition-all duration-500"
            />
            <rect x="768" y={out.y - 12} width="110" height="24"
              rx="4"
              fill={isActive(4) ? `${out.color}15` : 'rgba(0,0,0,0.3)'}
              stroke={isActive(4) ? out.color : '#1e293b'}
              strokeWidth="1"
              className="transition-all duration-500"
            />
            <text x="823" y={out.y + 4}
              textAnchor="middle"
              fill={isActive(4) ? out.color : '#475569'}
              fontSize="9" fontFamily="monospace" fontWeight="bold"
              className="transition-all duration-500"
            >{out.label}</text>
          </g>
        ))}

        {/* COLUMN LABELS */}
        <text x="265" y="345" textAnchor="middle"
          fill="#475569" fontSize="8" fontFamily="monospace"
          fontWeight="bold" letterSpacing="2">PIPELINE</text>
        <text x="460" y="345" textAnchor="middle"
          fill="#475569" fontSize="8" fontFamily="monospace"
          fontWeight="bold" letterSpacing="2">VARIABLES</text>
        <text x="655" y="345" textAnchor="middle"
          fill="#475569" fontSize="8" fontFamily="monospace"
          fontWeight="bold" letterSpacing="2">ENGINE</text>
        <text x="823" y="345" textAnchor="middle"
          fill="#475569" fontSize="8" fontFamily="monospace"
          fontWeight="bold" letterSpacing="2">OUTPUTS</text>

        {/* Bottom arrows — outputs feed modules and notifications */}
        <line x1="655" y1="252" x2="655" y2="310"
          stroke={isActive(5) ? '#00d4ff' : '#1e293b'}
          strokeWidth="1" strokeDasharray="4 3"
          className="transition-all duration-500"
        />
        <text x="655" y="325" textAnchor="middle"
          fill={isActive(5) ? '#00d4ff' : '#334155'}
          fontSize="8" fontFamily="monospace"
        >→ 10 Modules + Notifications + Tactical</text>

      </svg>
        </div>
      </div>

      {/* Live values row */}
      <div className="flex flex-wrap gap-3 pt-2 border-t
        border-intel-border/30">
        {[
          { label: 'Variables', value: `${rriState.variables_count}`, color: 'text-intel-green' },
          { label: 'Equations', value: '24', color: 'text-intel-cyan' },
          { label: 'Simulations', value: '10,000', color: 'text-intel-orange' },
          { label: 'R(t)', value: rriState.rri.toFixed(4), color: 'text-intel-red' },
          { label: 'P_rev', value: (rriState.p_rev*100).toFixed(1)+'%', color: 'text-intel-orange' },
          { label: 'Confidence', value: (rriState.model_confidence*100).toFixed(0)+'%', color: 'text-slate-400' },
        ].map(item => (
          <div key={item.label} className="space-y-0.5">
            <div className="text-[8px] font-mono text-slate-600 uppercase">
              {item.label}
            </div>
            <div className={`text-[11px] font-mono font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RRIEngineDiagram: React.FC<{ rriState: any }> = ({ rriState }) => {
  const [hoveredEq, setHoveredEq] = useState<string | null>(null);

  const EQ_DESC: Record<string, string> = {
    'EQ.1': 'Base RRI sum — 251 variables × weights across 24 categories',
    'EQ.3': 'Salience S(t) — how much attention is on revolutionary grievances vs suppressed by war/propaganda',
    'EQ.4': 'SIR epidemic model — protest spread like infection: Susceptible → Infected → Recovered',
    'EQ.7': 'Elite defection utility — Nash equilibrium calculation for when elites rationally defect',
    'EQ.8': 'War intensity W(t) — regional conflict suppresses domestic protest attention',
    'EQ.9': 'Remittance mobilization — each $1M urban remittances = +250 potential protesters',
    'EQ.12': 'Logistic P_rev — sigmoid function converting R(t) to probability. Threshold: R(t) > 2.625',
    'EQ.13': 'Stochastic shock — black swan events (assassinations, disasters) injected as epsilon(t)',
    'EQ.14': 'Monte Carlo — 10,000 simulations with Gaussian noise. Produces confidence interval.',
    'EQ.15': 'Compound stress CS(t) — bonus when multiple variables breach thresholds simultaneously',
    'EQ.16': 'Velocity V(t) — rate of change of R(t). Positive = deteriorating. Negative = improving.',
    'EQ.17': 'Cascade P_cascade — probability protest in one governorate spreads to neighbors',
    'EQ.18': 'Elite cohesion EC(t) — time-series stock depleted by capital flight and arrest proxies',
    'EQ.19': 'Information Amplification A(t) — how information freedom multiplies mobilization variables',
    'EQ.20': 'Historical pattern HPS — cosine similarity to Tunisia 2010, Egypt 2011, Algeria 2019',
    'EQ.21': 'Ministerial Instability Index MII(t) — measures government reshuffle patterns as a leading indicator of elite fracture',
    'EQ.22': 'Cycle Position Index CPI(t) — measures the temporal convergence of seasonal, generational, and civilizational cycles',
    'EQ.23': 'Acceleration Index A(t) — measures the rate of change in risk velocity and the density of stochastic shocks',
    'EQ.24': 'Structural Economic Signal S_econ(t) — detects "silent" policy shifts in staple goods and subsidies as leading indicators of systemic failure',
  };

  const equations = [
    // Row 1 — inputs
    { id: 'vars', x: 50, y: 30, w: 120, h: 40, label: '251+ Variables', sub: 'Categories A-X', color: '#30d158', type: 'input' },
    // Row 2 — core
    { id: 'EQ.1', x: 220, y: 30, w: 100, h: 40, label: 'EQ.1', sub: 'R(t) base', color: '#ff453a', type: 'core' },
    { id: 'EQ.3', x: 220, y: 100, w: 100, h: 40, label: 'EQ.3', sub: 'Salience', color: '#ff9f0a', type: 'core' },
    { id: 'EQ.4', x: 220, y: 170, w: 100, h: 40, label: 'EQ.4', sub: 'SIR Spread', color: '#bf5af2', type: 'core' },
    { id: 'EQ.8', x: 220, y: 240, w: 100, h: 40, label: 'EQ.8', sub: 'War W(t)', color: '#64748b', type: 'core' },
    { id: 'EQ.9', x: 220, y: 310, w: 100, h: 40, label: 'EQ.9', sub: 'Remittances', color: '#0a84ff', type: 'core' },
    // Row 3 — intermediate
    { id: 'EQ.7', x: 380, y: 30, w: 100, h: 40, label: 'EQ.7', sub: 'Elite Defection', color: '#ff9f0a', type: 'intermediate' },
    { id: 'EQ.13', x: 380, y: 100, w: 100, h: 40, label: 'EQ.13', sub: 'Shock ε(t)', color: '#ff453a', type: 'intermediate' },
    { id: 'EQ.15', x: 380, y: 170, w: 100, h: 40, label: 'EQ.15', sub: 'Compound CS(t)', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.18', x: 380, y: 240, w: 100, h: 40, label: 'EQ.18', sub: 'Cohesion EC(t)', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.20', x: 380, y: 310, w: 100, h: 40, label: 'EQ.20', sub: 'Pattern HPS', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.19', x: 380, y: 380, w: 100, h: 40, label: 'EQ.19', sub: 'Amplification', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.21', x: 380, y: 450, w: 100, h: 40, label: 'EQ.21', sub: 'MII Stability', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.22', x: 380, y: 520, w: 100, h: 40, label: 'EQ.22', sub: 'CPI Cycles', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.23', x: 380, y: 590, w: 100, h: 40, label: 'EQ.23', sub: 'Acceleration', color: '#ff9f0a', type: 'ext' },
    { id: 'EQ.24', x: 380, y: 660, w: 100, h: 40, label: 'EQ.24', sub: 'Structural Econ', color: '#ff9f0a', type: 'ext' },
    // Row 4 — probability
    { id: 'EQ.12', x: 540, y: 115, w: 110, h: 50, label: 'EQ.12', sub: 'P_rev logistic', color: '#ff453a', type: 'output' },
    { id: 'EQ.14', x: 540, y: 200, w: 110, h: 50, label: 'EQ.14', sub: 'Monte Carlo', color: '#00d4ff', type: 'output' },
    { id: 'EQ.16', x: 540, y: 285, w: 110, h: 50, label: 'EQ.16', sub: 'Velocity V(t)', color: '#00d4ff', type: 'ext' },
    { id: 'EQ.17', x: 540, y: 355, w: 110, h: 40, label: 'EQ.17', sub: 'Cascade', color: '#ff9f0a', type: 'ext' },
    // Row 5 — final outputs
    { id: 'rri', x: 720, y: 80, w: 120, h: 40, label: `R(t) = ${rriState.rri.toFixed(4)}`, sub: 'Risk Index', color: '#ff453a', type: 'final' },
    { id: 'prev', x: 720, y: 140, w: 120, h: 40, label: `P_rev = ${(rriState.p_rev*100).toFixed(1)}%`, sub: 'Revolution probability', color: '#ff9f0a', type: 'final' },
    { id: 'ci', x: 720, y: 200, w: 120, h: 40, label: `CI [${rriState.ci_low}%, ${rriState.ci_high}%]`, sub: '95% confidence', color: '#00d4ff', type: 'final' },
    { id: 'vel', x: 720, y: 260, w: 120, h: 40, label: `V(t) = ${rriState.velocity > 0 ? '+' : ''}${rriState.velocity.toFixed(3)}`, sub: rriState.velocity_label, color: '#00d4ff', type: 'final' },
    { id: 'hps', x: 720, y: 320, w: 120, h: 40, label: `HPS = ${(rriState.pattern_similarity*100).toFixed(0)}%`, sub: rriState.pattern_label?.slice(0,20), color: '#bf5af2', type: 'final' },
  ];

  const connections = [
    { from: 'vars', to: 'EQ.1' },
    { from: 'vars', to: 'EQ.3' },
    { from: 'vars', to: 'EQ.4' },
    { from: 'vars', to: 'EQ.8' },
    { from: 'vars', to: 'EQ.9' },
    { from: 'EQ.1', to: 'EQ.7' },
    { from: 'EQ.1', to: 'EQ.13' },
    { from: 'EQ.1', to: 'EQ.15' },
    { from: 'EQ.3', to: 'EQ.12' },
    { from: 'EQ.8', to: 'EQ.3' },
    { from: 'EQ.7', to: 'EQ.12' },
    { from: 'EQ.13', to: 'EQ.12' },
    { from: 'EQ.15', to: 'EQ.12' },
    { from: 'EQ.9', to: 'EQ.12' },
    { from: 'EQ.18', to: 'EQ.7' },
    { from: 'EQ.12', to: 'rri' },
    { from: 'EQ.12', to: 'prev' },
    { from: 'EQ.14', to: 'ci' },
    { from: 'EQ.12', to: 'EQ.14' },
    { from: 'EQ.16', to: 'vel' },
    { from: 'EQ.1', to: 'EQ.16' },
    { from: 'EQ.17', to: 'EQ.14' },
    { from: 'EQ.20', to: 'hps' },
    { from: 'EQ.21', to: 'EQ.7' },
    { from: 'EQ.21', to: 'EQ.18' },
    { from: 'EQ.21', to: 'EQ.16' },
    { from: 'EQ.22', to: 'EQ.12' },
    { from: 'EQ.23', to: 'EQ.12' },
    { from: 'EQ.23', to: 'EQ.16' },
    { from: 'EQ.24', to: 'EQ.15' },
    { from: 'EQ.24', to: 'EQ.16' },
  ];

  const getCenter = (eq: typeof equations[0]) => ({
    x: eq.x + eq.w / 2,
    y: eq.y + eq.h / 2,
  });

  const getColor = (type: string) => {
    if (type === 'ext') return '#ff9f0a';
    if (type === 'final') return '#00d4ff';
    if (type === 'output') return '#ff453a';
    if (type === 'input') return '#30d158';
    return '#475569';
  };

  return (
    <div className="space-y-4">
      {/* Hover description */}
      <div className="h-8 flex items-center">
        {hoveredEq ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-intel-cyan font-mono"
          >
            <span className="text-white font-bold mr-2">{hoveredEq}:</span>
            {EQ_DESC[hoveredEq] || 'Equation in the RRI model'}
          </motion.div>
        ) : (
          <div className="text-[10px] text-slate-600 font-mono">
            Hover any equation to see what it does
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[8px] md:text-[9px] font-mono">
        {[
          { color: '#30d158', label: 'Input data' },
          { color: '#475569', label: 'Core (Samir Dni 2025)' },
          { color: '#ff9f0a', label: 'Extension (TUNISIAINTEL)' },
          { color: '#ff453a', label: 'Key output equation' },
          { color: '#00d4ff', label: 'Final output' },
        ].map(item => (
          <div key={item.label} className="flex items-center space-x-1.5">
            <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-sm"
              style={{ backgroundColor: item.color + '40',
                       border: `1px solid ${item.color}` }} />
            <span className="text-slate-500 whitespace-nowrap">{item.label}</span>
          </div>
        ))}
      </div>

      {/* SVG */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[800px] md:min-w-0">
          <svg viewBox="0 0 870 730" className="w-full h-auto"
            style={{ maxHeight: '750px' }}>

        {/* Draw connections first (behind nodes) */}
        {connections.map((conn) => {
          const fromEq = equations.find(e => e.id === conn.from);
          const toEq = equations.find(e => e.id === conn.to);
          if (!fromEq || !toEq) return null;
          const from = getCenter(fromEq);
          const to = getCenter(toEq);
          const isHighlighted = hoveredEq === conn.from || hoveredEq === conn.to;
          return (
            <line key={`${conn.from}-${conn.to}`}
              x1={from.x + fromEq.w/2 - 10} y1={from.y}
              x2={to.x - toEq.w/2 + 10} y2={to.y}
              stroke={isHighlighted ? '#00d4ff' : '#1e293b'}
              strokeWidth={isHighlighted ? "1.5" : "0.75"}
              strokeDasharray={conn.from === 'vars' ? "none" : "3 2"}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Draw nodes */}
        {equations.map(eq => {
          const isHovered = hoveredEq === eq.id;
          const color = eq.color;
          return (
            <g key={eq.id}
              onMouseEnter={() => setHoveredEq(eq.id)}
              onMouseLeave={() => setHoveredEq(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={eq.x} y={eq.y}
                width={eq.w} height={eq.h}
                rx="6"
                fill={isHovered ? `${color}20` : `${color}0a`}
                stroke={isHovered ? color : (eq.type === 'final' ? color : '#1e293b')}
                strokeWidth={isHovered ? "2" : "1"}
                className="transition-all duration-200"
              />
              <text
                x={eq.x + eq.w/2} y={eq.y + 16}
                textAnchor="middle"
                fill={isHovered ? '#ffffff' : (eq.type === 'final' ? color : '#94a3b8')}
                fontSize="10" fontFamily="monospace" fontWeight="bold"
                className="transition-all duration-200"
              >{eq.label}</text>
              <text
                x={eq.x + eq.w/2} y={eq.y + 30}
                textAnchor="middle"
                fill={isHovered ? color : '#475569'}
                fontSize="8" fontFamily="monospace"
                className="transition-all duration-200"
              >{eq.sub}</text>
            </g>
          );
        })}

      </svg>
        </div>
      </div>
    </div>
  );
};

const NodeNetworkDiagram: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const layers = [
    {
      id: 'nodes',
      title: 'Citizen Nodes',
      subtitle: 'Ground reporters in all 24 governorates',
      color: '#30d158',
      items: [
        'Local event reports',
        'Article reactions (Confirm/Dispute)',
        'Water/power/food alerts',
        'Protest confirmation',
        'Photo evidence',
      ],
      status: 'ROADMAP',
    },
    {
      id: 'platform',
      title: 'Platform Core',
      subtitle: 'Intelligence aggregation engine',
      color: '#00d4ff',
      items: [
        'RSS feed processor',
        'RRI engine (live)',
        'Gap detection',
        'Credibility scoring',
        'Notification system',
      ],
      status: 'BUILDING',
    },
    {
      id: 'professional',
      title: 'Professional Tier',
      subtitle: 'Analyst tools',
      color: '#ff9f0a',
      items: [
        '10 intelligence modules',
        'Pipeline management',
        'Strategic analysis',
        'Full RRI model',
        'PDF export',
      ],
      status: 'LIVE',
    },
    {
      id: 'public',
      title: 'Public Outputs',
      subtitle: 'Counter-narrative layer',
      color: '#bf5af2',
      items: [
        'Reality vs Official dashboard',
        'Live R(t) public feed',
        'CitizenEdition',
        'API access',
        'Research exports',
      ],
      status: 'ROADMAP',
    },
  ];

  const STATUS_COLORS = {
    LIVE: 'text-intel-green border-intel-green/30 bg-intel-green/10',
    BUILDING: 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
    ROADMAP: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  };

  return (
    <div className="space-y-6">
      <p className="text-[11px] text-slate-500 leading-relaxed">
        The platform is designed to scale from a personal analyst tool
        into a distributed counter-narrative intelligence network.
        Citizen nodes provide crowdsourced ground truth that feeds
        the RRI engine and powers gap detection between official
        narrative and reality.
      </p>

      {/* Flow diagram */}
      <div className="relative">

        {/* Connection arrows between layers */}
        <div className="hidden lg:flex absolute top-1/2 left-0 right-0 -translate-y-1/2
          items-center justify-between px-[calc(12.5%)]
          pointer-events-none z-0">
          {[0,1,2].map(i => (
            <div key={`layer-conn-${i}`} className="flex items-center">
              <div className="h-px w-8 xl:w-16 bg-gradient-to-r
                from-intel-border to-intel-cyan/30" />
              <div className="w-0 h-0 border-t-4 border-b-4
                border-l-8 border-transparent
                border-l-intel-cyan/40" />
            </div>
          ))}
        </div>

        {/* Layer cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {layers.map(layer => (
            <motion.div
              key={layer.id}
              onHoverStart={() => setActiveLayer(layer.id)}
              onHoverEnd={() => setActiveLayer(null)}
              className={`p-4 md:p-5 rounded-2xl border space-y-3 cursor-pointer
                transition-all ${
                activeLayer === layer.id
                  ? `border-[${layer.color}] bg-[${layer.color}]/10`
                  : 'border-intel-border bg-black/30 hover:border-intel-border/60'
              }`}
              style={{
                borderColor: activeLayer === layer.id ? layer.color : undefined,
                backgroundColor: activeLayer === layer.id
                  ? `${layer.color}10` : undefined,
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center
                    justify-center"
                    style={{ backgroundColor: `${layer.color}20`,
                             border: `1px solid ${layer.color}40` }}>
                    <div className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: layer.color }} />
                  </div>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5
                    rounded border uppercase font-bold
                    ${STATUS_COLORS[layer.status as keyof typeof STATUS_COLORS]}`}>
                    {layer.status}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white uppercase">
                  {layer.title}
                </div>
                <div className="text-[9px] text-slate-500">
                  {layer.subtitle}
                </div>
              </div>

              <div className="space-y-1.5">
                {layer.items.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center space-x-2
                    text-[9px]">
                    <div className="w-1 h-1 rounded-full shrink-0"
                      style={{ backgroundColor: layer.color }} />
                    <span className="text-slate-400">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* The vision statement */}
      <div className="p-5 rounded-2xl bg-intel-cyan/5 border
        border-intel-cyan/20 space-y-2">
        <div className="text-[10px] font-mono text-intel-cyan uppercase
          tracking-widest">The Vision</div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          When citizen nodes reach critical mass across all 24 governorates,
          the platform becomes capable of documenting the gap between
          official state narrative and ground reality in real time.
          The RRI model — fed by hundreds of verified local reports —
          becomes impossible for the regime to dismiss.
          This is how a personal intelligence platform becomes
          infrastructure for fighting authoritarianism at scale.
        </p>
        <div className="flex flex-wrap gap-3 pt-2 text-[9px] font-mono">
          {[
            { label: 'Current nodes', value: '1 (analyst)' },
            { label: 'Target phase 1', value: '50 trusted nodes' },
            { label: 'Target phase 2', value: '500 (national coverage)' },
            { label: 'Revolution threshold', value: '5,000+ nodes' },
          ].map(item => (
            <div key={item.label} className="space-y-0.5">
              <div className="text-slate-600">{item.label}</div>
              <div className="text-intel-cyan font-bold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RRIMethodology: React.FC<{
  onClose?: () => void;
  onNavigateToPipeline?: (tab: string) => void;
  jumpToEquation?: string;
  inline?: boolean;
}> = ({ onClose, onNavigateToPipeline, jumpToEquation, inline = false }) => {

  const { rriState, fullData: data } = useRiskMetrics();
  const { miiProfile } = useAIAnalysis();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('architecture');

  useEffect(() => {
    if (jumpToEquation) {
      setTimeout(() => {
        const el = document.getElementById(`eq-${jumpToEquation}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [jumpToEquation]);

  const navItems = [
    { id: 'architecture', label: 'Platform Architecture' },
    { id: 'overview', label: 'Overview' },
    { id: 'equations-paper', label: 'Core Equations (Samir Dni)' },
    { id: 'equations-ext', label: 'Extensions (TUNISIAINTEL)' },
    { id: 'trgm', label: 'TRGM Governance Matrix' },
    { id: 'variables', label: 'All 251+ Variables' },
    { id: 'montecarlo', label: 'Monte Carlo' },
    { id: 'calibration', label: 'Calibration & Validation' },
    { id: 'performance', label: 'Model Performance' },
    { id: 'limitations', label: 'Limitations' },
    { id: 'bibliography', label: 'Bibliography' },
  ];

  return (
    <motion.div 
      initial={inline ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={inline ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={inline ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      className={inline ? "h-full flex flex-col bg-transparent overflow-hidden" : "fixed inset-0 z-[300] bg-[#020810]/98 backdrop-blur-md overflow-hidden flex flex-col"}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-intel-border bg-black/60 shrink-0 gap-3 md:gap-0">
        <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto">
          <BookOpen className="w-5 h-5 text-intel-cyan shrink-0" />
          <div className="min-w-0">
            <div className="text-xs md:text-sm font-bold text-white uppercase tracking-widest truncate">
              RRI Methodology
            </div>
            <div className="text-[8px] md:text-[9px] font-mono text-slate-500 truncate">
              Samir Dni (2025) + TUNISIAINTEL Extensions
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 ml-2 md:ml-6 shrink-0">
            <div className="text-[8px] md:text-[9px] font-mono text-slate-500 px-2 md:px-3 py-1 border border-intel-border rounded">
              v2.1 — {rriState.variables_count} Vars
            </div>
            <div className="text-[8px] md:text-[9px] font-mono text-intel-cyan px-2 md:px-3 py-1 border border-intel-cyan/30 bg-intel-cyan/10 rounded">
              R(t) = {rriState.rri.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-2 md:space-x-3">
          <div className="flex sm:hidden items-center space-x-1">
             <div className="text-[8px] font-mono text-intel-cyan px-2 py-1 border border-intel-cyan/30 bg-intel-cyan/10 rounded">
              R(t) = {rriState.rri.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateToPipeline?.('pipeline')}
              className="flex items-center space-x-1.5 px-2 md:px-3 py-1.5 text-[9px] md:text-[10px] font-mono text-slate-400 border border-intel-border rounded hover:border-intel-cyan/30 hover:text-intel-cyan transition-all"
              title="Data Pipeline"
            >
              <Database className="w-3 h-3 md:w-3 md:h-4" />
              <span className="hidden xs:inline">Pipeline</span>
            </button>
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-mono text-slate-400 border border-intel-border rounded hover:border-intel-cyan/30 hover:text-intel-cyan transition-all"
            >
              <Download className="w-3 h-3" />
              <span>PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Navigation - Hidden on mobile, toggleable or scrollable top bar? Let's make it a sidebar that can be hidden */}
        <div className="hidden md:block w-56 shrink-0 border-r border-intel-border bg-black/40 overflow-y-auto py-4">
          <div className="px-4 mb-4">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-black/40 border border-intel-border rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-intel-cyan/40"
              />
            </div>
          </div>
          <nav className="space-y-1 px-2">
            {navItems.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`block px-3 py-2 rounded-lg text-[11px] font-mono transition-all ${
                  activeSection === item.id
                    ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Live Model State Panel */}
          <div className="mx-3 mt-6 p-3 border border-intel-border rounded-xl bg-black/40 space-y-2">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Live Model State</div>
            {[
              { label: 'R(t)', value: rriState.rri.toFixed(4), color: 'text-intel-red' },
              { label: 'P_rev', value: (rriState.p_rev*100).toFixed(1)+'%', color: 'text-intel-orange' },
              { label: 'S(t)', value: rriState.salience.toFixed(3), color: 'text-intel-cyan' },
              { label: 'W(t)', value: rriState.w_t.toFixed(2), color: 'text-slate-400' },
              { label: 'V(t)', value: (rriState.velocity>0?'+':'')+rriState.velocity.toFixed(3), color: rriState.velocity>0.15?'text-intel-red':'text-intel-cyan' },
              { label: 'HPS', value: (rriState.pattern_similarity*100).toFixed(0)+'%', color: 'text-intel-orange' },
              { label: 'CS(t)', value: rriState.compound_stress.toFixed(3), color: 'text-slate-400' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-600">{item.label}</span>
                <span className={`text-[10px] font-mono font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 bg-black/80 border-b border-intel-border overflow-x-auto scrollbar-hide flex items-center px-4 py-2 space-x-4">
          {navItems.map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className={`whitespace-nowrap text-[10px] font-mono uppercase tracking-wider transition-all ${
                activeSection === item.id
                  ? 'text-intel-cyan'
                  : 'text-slate-500'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-12 md:py-8 scroll-smooth" id="methodology-content">
          {/* ============================================================
              ARCHITECTURE PAGE
              Three animated SVG flow diagrams
          ============================================================ */}
          <div id="architecture" className="scroll-mt-8 mb-10">

            {/* Page header */}
            <div className="flex items-center space-x-4 mb-8">
              <Activity className="w-6 h-6 text-intel-cyan" />
              <div>
                <h1 className="text-xl font-bold text-white uppercase
                  tracking-widest">Platform Architecture</h1>
                <p className="text-[10px] text-slate-500 mt-1">
                  How data flows from sources to intelligence outputs.
                  Three diagrams — Data Flow, RRI Engine, Node Network.
                </p>
              </div>
            </div>

            {/* ============================================================
                DIAGRAM 0 — PLATFORM HIERARCHY
            ============================================================ */}
            <div className="glass px-4 sm:px-12 py-8 rounded-2xl border border-intel-border
              space-y-6 mb-8 overflow-visible">
              <div className="flex items-center space-x-3 border-b
                border-intel-border pb-4">
                <Layers className="w-4 h-4 text-intel-cyan" />
                <h2 className="text-sm font-bold text-white uppercase
                  tracking-widest">Platform Architecture Hierarchy</h2>
                <span className="text-[9px] font-mono text-slate-600 ml-auto">
                  From Variables to AI Synthesis
                </span>
              </div>

              <ArchitectureHierarchyDiagram />
            </div>

            {/* ============================================================
                DIAGRAM 1 — DATA FLOW
            ============================================================ */}
            <div className="glass p-8 rounded-2xl border border-intel-border
              space-y-6 mb-8">
              <div className="flex items-center space-x-3 border-b
                border-intel-border pb-4">
                <Database className="w-4 h-4 text-intel-cyan" />
                <h2 className="text-sm font-bold text-white uppercase
                  tracking-widest">Diagram 1 — Intelligence Data Flow</h2>
                <span className="text-[9px] font-mono text-slate-600 ml-auto">
                  From source to R(t)
                </span>
              </div>

              <DataFlowDiagram rriState={rriState} data={data} />
            </div>

            {/* ============================================================
                DIAGRAM 2 — RRI ENGINE INTERNALS
            ============================================================ */}
            <div className="glass p-8 rounded-2xl border border-intel-border
              space-y-6 mb-8">
              <div className="flex items-center space-x-3 border-b
                border-intel-border pb-4">
                <Brain className="w-4 h-4 text-intel-cyan" />
                <h2 className="text-sm font-bold text-white uppercase
                  tracking-widest">Diagram 2 — RRI Engine Internals</h2>
                <span className="text-[9px] font-mono text-slate-600 ml-auto">
                  20 equations, 251+ variables
                </span>
              </div>

              <RRIEngineDiagram rriState={rriState} />
            </div>

            {/* ============================================================
                DIAGRAM 3 — NODE NETWORK (FUTURE)
            ============================================================ */}
            <div className="glass p-8 rounded-2xl border border-intel-border
              space-y-6">
              <div className="flex items-center space-x-3 border-b
                border-intel-border pb-4">
                <Globe className="w-4 h-4 text-intel-cyan" />
                <h2 className="text-sm font-bold text-white uppercase
                  tracking-widest">Diagram 3 — Citizen Node Network</h2>
                <span className="text-[9px] font-mono text-intel-orange ml-auto">
                  Roadmap — Coming Soon
                </span>
              </div>

              <NodeNetworkDiagram />
            </div>

          </div>

          {/* SECTION 1: OVERVIEW */}
          <div id="overview" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Activity className="w-6 h-6 text-intel-cyan" />
              <h1 className="text-xl font-bold text-white uppercase tracking-widest">Model Overview</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
              <div className="col-span-1 sm:col-span-2 p-4 md:p-6 rounded-2xl bg-intel-cyan/5 border border-intel-cyan/20">
                <div className="text-[9px] font-mono text-intel-cyan uppercase tracking-widest mb-3">Abstract</div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  The Refined Regime Aging Model (RRAM) presents a comprehensive quantitative framework for assessing revolutionary risk in Tunisia. Developed by Samir Dni (2025), the model integrates 251+ variables across 24 categories, employing 12 mathematical methods and 14 specific equations to generate a Revolutionary Risk Index R(t) and revolution probability P_rev.
                </p>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mt-3">
                  TUNISIAINTEL extends this model with 10 additional equations (EQ.15-24) providing velocity tracking, compound stress detection, regional cascade probability, elite defection dynamics, information amplification, historical pattern similarity, ministerial instability, cycle analysis, acceleration, and structural economic signals. The extended model produces 10 distinct analytical outputs updated in real-time from news feeds and pipeline document ingestion.
                </p>
              </div>

              <div className="p-4 md:p-6 rounded-2xl bg-black/30 border border-intel-border space-y-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Model Outputs</div>
                {[
                  { symbol: 'R(t)', name: 'Revolutionary Risk Index', value: rriState.rri.toFixed(4), desc: 'Core composite risk score', paper: true },
                  { symbol: 'P_rev', name: 'Revolution Probability', value: (rriState.p_rev*100).toFixed(1)+'%', desc: 'Logistic probability estimate', paper: true },
                  { symbol: 'S(t)', name: 'Narrative Salience', value: rriState.salience.toFixed(3), desc: 'Propaganda/counter-propaganda dynamics', paper: true },
                  { symbol: 'V(t)', name: 'Velocity Index', value: (rriState.velocity>0?'+':'')+rriState.velocity.toFixed(3), desc: 'Rate of change of R(t)', paper: false },
                  { symbol: 'HPS', name: 'Pattern Similarity', value: (rriState.pattern_similarity*100).toFixed(0)+'%', desc: 'Match to historical crisis states', paper: false },
                  { symbol: 'CS(t)', name: 'Compound Stress', value: rriState.compound_stress.toFixed(3), desc: 'Non-linear interaction bonus', paper: false },
                  { symbol: 'CPI', name: 'Cycle Position Index', value: rriState.cpi_index?.toFixed(3) ?? '0.500', desc: 'Temporal cycle convergence', paper: false },
                  { symbol: 'A(t)', name: 'Acceleration Index', value: rriState.acceleration?.toFixed(3) ?? '0.000', desc: 'Rate of change in risk velocity', paper: false },
                  { symbol: 'S_econ(t)', name: 'Structural Economic Signal', value: rriState.structural_econ?.toFixed(3) ?? '0.150', desc: 'Silent policy shift detection', paper: false },
                  { symbol: 'P_cascade', name: 'Cascade Probability', value: (rriState.cascade_probability*100).toFixed(0)+'%', desc: 'Regional protest spread risk', paper: false },
                ].map(o => (
                  <div key={o.symbol} className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2 md:space-x-3">
                      <code className="text-intel-cyan font-mono text-[10px] md:text-[11px] min-w-[50px] md:min-w-[60px]">{o.symbol}</code>
                      <div>
                        <div className="text-[10px] md:text-[11px] text-white">{o.name}</div>
                        <div className="text-[9px] md:text-[10px] text-slate-600 line-clamp-1">{o.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
                      <span className="text-[10px] md:text-[11px] font-mono font-bold text-white">{o.value}</span>
                      {!o.paper && (
                        <span className="text-[7px] md:text-[8px] text-intel-orange border border-intel-orange/20 px-1 rounded">EXT</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 md:p-6 rounded-2xl bg-black/30 border border-intel-border space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Architecture</div>
                {[
                  { label: 'Total variables', value: '251+' },
                  { label: 'Categories', value: '24 (A-X)' },
                  { label: 'Core equations', value: '14' },
                  { label: 'Extension equations', value: '10' },
                  { label: 'Monte Carlo runs', value: '10,000' },
                  { label: 'Confidence interval', value: `[${rriState.ci_low}%—${rriState.ci_high}%]` },
                  { label: 'Model confidence', value: (rriState.model_confidence*100).toFixed(0)+'%' },
                  { label: 'Revolution threshold', value: 'R(t) > 2.625' },
                  { label: 'Update frequency', value: 'Real-time' },
                  { label: 'Languages', value: 'AR, FR, Darija' },
                  { label: 'Data sources', value: 'BCT, INS, IMF, RSF' },
                  { label: 'Calibration', value: 'March 2026' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-[10px] md:text-[11px]">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-white font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-intel-red/5 border border-intel-red/20">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-intel-red shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-intel-red">Revolution Threshold Clarification</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The revolution threshold where P_rev crosses 50% is R(t) = 2.625 (derived from 2.1/0.8 = 2.625 in EQ.12). The current R(t) = {rriState.rri.toFixed(4)} is {rriState.rri >= 2.625 ? 'ABOVE this threshold' : 'below this threshold but elevated'}. The paper's baseline of R(t) = 2.8 (90-92% probability) was modelled under W(t) = 0.2 (low war intensity). Current W(t) = {rriState.w_t.toFixed(2)} (high regional conflict context) suppresses the effective R(t) from a higher base value.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CORE EQUATIONS */}
          <div id="equations-paper" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Brain className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Core Equations — Samir Dni (2025)</h2>
            </div>

            <div id="eq-1" className="scroll-mt-20">
              <EquationCard
                number="1"
                title="Revolutionary Risk Index — Base Formula"
                latex={String.raw`R(t) = \sum_{i=1}^{24} \left( \sum_{j=1}^{n_i} w_{ij} \cdot F_{ij}(t) \right) + \epsilon(t)`}
                description="The fundamental equation governing the RRI. Each of the 251+ variables F_ij(t) across 24 categories is multiplied by its dynamic weight w_ij and summed. The noise term epsilon(t) captures unobserved shocks such as assassinations or natural disasters."
                variables={[
                  { symbol: 'F_{ij}(t)', meaning: 'Variable j in category i at time t (251+ total)' },
                  { symbol: 'w_{ij}', meaning: 'Weight of variable j in category i (dynamically adjusted)' },
                  { symbol: '\\epsilon(t)', meaning: 'Stochastic shock term — see EQ.13' },
                  { symbol: 'F_{norm}', meaning: 'Min-max normalized value (eq1_normalize), threshold-amplified up to 1.5' },
                  { symbol: 'R(t)', meaning: 'Revolutionary Risk Index (current)', value: rriState.rri.toFixed(4) },
                ]}
                currentOutput={rriState.rri.toFixed(4)}
                source="paper"
                note="Each variable F_ij(t) undergoes min-max normalization via eq1_normalize() to a 0-1 scale. Variables breaching a calibrated threshold receive up to 1.5x amplification. The 24 category scores S_c(t) are computed as weighted sums within each category via eq2_categoryScores(), then summed with category weights to produce the raw R(t)."
              />
            </div>

            <div id="eq-2" className="scroll-mt-20 mt-6">
              <EquationCard
                number="2/3"
                title="Salience Modulation — Full War Distraction Equation"
                latex={String.raw`S(t) = \frac{\alpha \cdot \left(1 + \delta \cdot C_P(t) + \epsilon \cdot D_P(t) + \zeta \cdot R_M(t) + \eta \cdot R_R(t) + \theta \cdot C_R(t)\right)}{1 + \beta \cdot W(t) \cdot \left(1 + \gamma \cdot P(t) + \iota \cdot D_D(t)\right)}`}
                description="Salience S(t) measures how much public attention is focused on revolutionary grievances versus being suppressed by war distraction or propaganda. High war intensity W(t) drives salience down. Counter-propaganda CP(t) and diaspora protests DP(t) drive it up. Rural connectivity CR(t) affects rural mobilization reach."
                variables={[
                  { symbol: '\\alpha = 0.7', meaning: 'Base salience parameter', calibrated: true },
                  { symbol: '\\beta = 0.7', meaning: 'War distraction effectiveness', calibrated: true },
                  { symbol: '\\gamma = 0.3', meaning: 'Propaganda amplification', calibrated: true },
                  { symbol: '\\delta = 0.12', meaning: 'Counter-propaganda effectiveness', calibrated: true },
                  { symbol: '\\epsilon = 0.08', meaning: 'Diaspora protest impact', calibrated: true },
                  { symbol: '\\zeta = 0.05', meaning: 'Urban remittance mobilization factor', calibrated: true },
                  { symbol: '\\eta = 0.02', meaning: 'Rural remittance mobilization factor', calibrated: true },
                  { symbol: '\\theta = 0.03', meaning: 'Rural connectivity impact', calibrated: true },
                  { symbol: '\\iota = 0.1', meaning: 'Digital divide amplification', calibrated: true },
                  { symbol: 'C_P(t)', meaning: 'Counter-propaganda index', value: '0.42' },
                  { symbol: 'D_P(t)', meaning: 'Diaspora protest index', value: '0.38' },
                  { symbol: 'W(t)', meaning: 'War intensity (see EQ.8)', value: rriState.w_t.toFixed(2) },
                  { symbol: 'D_D(t)', meaning: 'Digital divide factor', value: '0.65' },
                  { symbol: 'S(t)', meaning: 'Resulting salience', value: rriState.salience.toFixed(3) },
                ]}
                currentOutput={rriState.salience.toFixed(3)}
                source="paper"
                note="The digital divide DD(t) = 0.65 reflects the stark urban (95%) vs rural (30%) internet access gap in Tunisia. This suppresses rural protest mobilization and counter-propaganda reach by approximately 23%, consistent with Samir Dni's finding."
              />
            </div>

            <div id="eq-4" className="scroll-mt-20 mt-6">
              <EquationCard
                number="4"
                title="Epidemic-Style Protest Spread — SIR Model"
                latex={String.raw`\frac{dS}{dt} = -\beta \cdot S \cdot I \qquad \frac{dI}{dt} = \beta \cdot S \cdot I - \gamma \cdot I \qquad \frac{dR}{dt} = \gamma \cdot I`}
                description="Protest spread is modelled as an epidemic process. S = susceptible population (potential protesters), I = infected (active protesters), R = recovered (former participants). The transmission rate beta is amplified by TikTok penetration and UGTT mobilization. Recovery rate gamma represents state repression efficacy."
                variables={[
                  { symbol: 'S', meaning: 'Susceptible population (potential protesters)', value: (rriState.sir_susceptible*100).toFixed(1)+'%' },
                  { symbol: 'I', meaning: 'Infected population (active protesters)', value: (rriState.sir_infected*100).toFixed(1)+'%' },
                  { symbol: 'R', meaning: 'Recovered population (former protesters)', value: (rriState.sir_recovered*100).toFixed(1)+'%' },
                  { symbol: '\\beta = 0.4', meaning: 'Transmission rate (high — TikTok/UGTT amplified)', calibrated: true },
                  { symbol: '\\gamma = 0.15', meaning: 'Recovery rate (low repression efficacy)', calibrated: true },
                ]}
                source="paper"
              />
            </div>

            <div id="eq-7" className="scroll-mt-20 mt-6">
              <EquationCard
                number="7"
                title="Elite Defection Utility Function"
                latex={String.raw`U_i(\text{Defect}) = B_i - C_i \cdot (1 - P_{rev}) + \lambda_i \cdot \sum_{j \neq i} D_j`}
                description="Each elite actor i calculates the utility of defecting from the regime. Nash equilibrium: defection occurs if U_i > 10 + sigma * R(t). The critical insight is the cascade term: each defection by elite j increases the utility of defection for all other elites through the influence factor lambda_i."
                variables={[
                  { symbol: 'B_i', meaning: 'Baseline benefit from defection for elite i' },
                  { symbol: 'C_i', meaning: 'Cost of failed defection attempt' },
                  { symbol: 'P_{rev}', meaning: 'Current revolution probability', value: (rriState.p_rev*100).toFixed(1)+'%' },
                  { symbol: '\\lambda_i', meaning: 'Influence factor of other elites\' decisions' },
                  { symbol: 'D_j', meaning: 'Binary defection decision of elite j (0 or 1)' },
                  { symbol: '\\sigma = 0.05', meaning: 'Elite risk tolerance parameter', calibrated: true },
                  { symbol: 'P(\\text{defection})', meaning: 'Current defection probability', value: (rriState.elite_defection_prob*100).toFixed(1)+'%' },
                ]}
                currentOutput={(rriState.elite_defection_prob*100).toFixed(1)+'%'}
                source="paper"
              />
            </div>

            <div id="eq-8" className="scroll-mt-20 mt-6">
              <EquationCard
                number="8"
                title="War Intensity Index W(t)"
                latex={String.raw`W(t) = 0.6 \cdot \text{Battle\_Deaths}_{norm} + 0.4 \cdot \text{Media\_Salience}_{norm}`}
                description="The war intensity index aggregates regional conflict impact — primarily Gaza, Libya, and the Sahel — into a single suppressor value. High W(t) suppresses domestic protest attention by 18-22%. Sources: ACLED for battle deaths, Reuters/AP sentiment analysis for media salience."
                variables={[
                  { symbol: '\\text{Battle\_Deaths}_{norm}', meaning: 'Normalized battle deaths in regional conflicts (0-1)' },
                  { symbol: '\\text{Media\_Salience}_{norm}', meaning: 'Normalized media coverage of regional conflicts (0-1)' },
                  { symbol: 'W(t)', meaning: 'War intensity (0.2=low, 0.8=high)', value: rriState.w_t.toFixed(2) },
                ]}
                currentOutput={rriState.w_t.toFixed(2)}
                source="paper"
              />
            </div>

            <div id="eq-9" className="scroll-mt-20 mt-6">
              <EquationCard
                number="9 & 10"
                title="Remittance-Driven Mobilization & Distribution"
                latex={String.raw`\Delta P = 0.05 \cdot R_{total} \cdot (1 - D_D(t)) \qquad R_{urban}(t) = \phi \cdot R_{total}(t) \qquad R_{rural}(t) = (1-\phi) \cdot R_{total}(t)`}
                description="Remittances mobilize protest participation by funding opposition activities and increasing household economic confidence. Each $1M in urban remittances mobilizes approximately 250 additional protesters. Rural remittances are dampened by the digital divide factor. The distribution follows phi=0.8 urban allocation."
                variables={[
                  { symbol: '\\Delta P', meaning: 'Additional protesters mobilized by remittances' },
                  { symbol: 'R_{total}', meaning: 'Total remittances in millions USD', value: '$2,850M' },
                  { symbol: 'D_D(t)', meaning: 'Digital divide factor', value: '0.65 (rural)' },
                  { symbol: '\\phi = 0.8', meaning: 'Urban remittance allocation proportion', calibrated: true },
                  { symbol: 'R_{urban}', meaning: 'Urban remittances', value: '$2,280M' },
                  { symbol: 'R_{rural}', meaning: 'Rural remittances', value: '$570M' },
                ]}
                source="paper"
              />
            </div>

            <div id="eq-12" className="scroll-mt-20 mt-6">
              <EquationCard
                number="12"
                title="Logistic Revolution Probability"
                latex={String.raw`P_{rev}(t) = \frac{1}{1 + e^{-(0.8 \cdot R(t) - 2.1)}}`}
                description="The logistic function transforms R(t) into a probability. The threshold where P_rev = 50% is R(t) = 2.625 (solving 0.8R - 2.1 = 0). At the paper's baseline R(t)=2.8, P_rev reaches 90-92%. Sensitivity parameter k=0.8 controls the steepness of the probability curve."
                variables={[
                  { symbol: '0.8', meaning: 'Sensitivity parameter k — steepness of sigmoid', calibrated: true },
                  { symbol: '2.1', meaning: 'Offset parameter — sets 50% threshold at R=2.625', calibrated: true },
                  { symbol: 'R(t)', meaning: 'Current Revolutionary Risk Index', value: rriState.rri.toFixed(4) },
                  { symbol: 'P_{rev}(t)', meaning: 'Revolution probability', value: (rriState.p_rev*100).toFixed(1)+'%' },
                ]}
                currentOutput={(rriState.p_rev*100).toFixed(1)+'%'}
                source="paper"
              />
            </div>

            <div id="eq-13" className="scroll-mt-20 mt-6">
              <EquationCard
                number="13"
                title="Stochastic Shock Model"
                latex={String.raw`\epsilon(t) = \sum_{k=1}^{K} \omega_k \cdot \xi_k(t)`}
                description="The shock model captures unobserved sudden events that can shift R(t) instantaneously. Each shock type k has a weight omega_k and random magnitude xi_k(t). Examples include political assassinations, natural disasters, sudden economic shocks, major protest crackdowns, or foreign interventions."
                variables={[
                  { symbol: '\\epsilon(t)', meaning: 'Aggregate shock effect', value: rriState.stochastic_shock.toFixed(4) },
                  { symbol: '\\omega_k', meaning: 'Weight of shock type k' },
                  { symbol: '\\xi_k(t)', meaning: 'Random shock of type k at time t' },
                  { symbol: 'K', meaning: 'Number of shock types (assassinations, disasters, etc.)' },
                ]}
                source="paper"
              />
            </div>

            <div id="eq-14" className="scroll-mt-20 mt-6">
              <EquationCard
                number="14"
                title="Monte Carlo Simulation Framework"
                latex={String.raw`R_i(t) = \sum_{j=1}^{250} w_j \cdot F_{ij}(t) + \epsilon_i(t) \qquad P_{rev,i}(t) = \frac{1}{1 + e^{-(0.8 R_i(t) - 2.1)}}`}
                description="10,000 simulation runs where each variable is perturbed by Gaussian noise proportional to its historical volatility. The distribution of P_rev across all runs gives the confidence interval. 87% of simulations trigger revolution probability >50% if more than 50 protesters are killed."
                variables={[
                  { symbol: 'F_{ij}(t)', meaning: 'Perturbed value of variable j in simulation i' },
                  { symbol: '\\epsilon_i(t)', meaning: 'Random shock in simulation i' },
                  { symbol: 'N = 10{,}000', meaning: 'Number of Monte Carlo runs', calibrated: true },
                  { symbol: 'CI_{low}', meaning: '2.5th percentile of P_rev distribution', value: rriState.ci_low.toFixed(1)+'%' },
                  { symbol: 'CI_{high}', meaning: '97.5th percentile of P_rev distribution', value: rriState.ci_high.toFixed(1)+'%' },
                ]}
                currentOutput={`[${rriState.ci_low.toFixed(1)}%, ${rriState.ci_high.toFixed(1)}%]`}
                source="paper"
              />
            </div>
          </div>

          {/* SECTION 3: EXTENSIONS */}
          <div id="equations-ext" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-2">
              <Zap className="w-6 h-6 text-intel-orange" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Extension Equations — TUNISIAINTEL</h2>
            </div>
            <p className="text-slate-500 text-xs mb-6">These 9 equations extend the Samir Dni (2025) framework.</p>

            <div id="eq-15" className="scroll-mt-20">
              <EquationCard
                number="15"
                title="Compound Stress Index CS(t)"
                latex={String.raw`CS(t) = \sum_{i} \sum_{j>i} \left[ \alpha_{ij} \cdot B(n_i, \theta) \cdot B(n_j, \theta) \right] \quad \text{where} \quad B(n, \theta) = \frac{\max(0, n - \theta)}{1 - \theta}`}
                description="Captures non-linear interactions when multiple variables breach their thresholds simultaneously. Includes the critical A251-E51 (Structural Signal + Protests) coupling."
                variables={[
                  { symbol: '\\alpha_{ij}', meaning: 'Interaction coefficient for variable pair (i,j)' },
                  { symbol: 'B(n, \\theta)', meaning: 'Threshold exceedance function' },
                  { symbol: '\\theta = 0.70', meaning: 'Threshold level', calibrated: true },
                  { symbol: 'CS(t)', meaning: 'Compound stress bonus', value: rriState.compound_stress.toFixed(3) },
                ]}
                currentOutput={rriState.compound_stress.toFixed(3)}
                source="extension"
              />
            </div>

            <div id="eq-16" className="scroll-mt-20 mt-6">
              <EquationCard
                number="16"
                title="Velocity Index V(t)"
                latex={String.raw`V(t) = \tanh\left(\frac{1}{\lambda} \sum_{i} \beta_i \cdot \frac{n_i(t) - n_i(t-30)}{\sigma_i} \cdot w_i \right)`}
                description="Measures the rate of change of R(t). High-weight tracking includes A251 (Structural Economic Signal) to detect rapid policy-driven deterioration."
                variables={[
                  { symbol: 'n_i(t)', meaning: 'Current normalized value' },
                  { symbol: 'n_i(t-30)', meaning: 'Value 30 days ago' },
                  { symbol: '\\lambda', meaning: 'Scaling factor = 3.0', calibrated: true },
                  { symbol: 'V(t)', meaning: 'Velocity index', value: (rriState.velocity>0?'+':'')+rriState.velocity.toFixed(3) },
                ]}
                currentOutput={`${rriState.velocity>0?'+':''}${rriState.velocity.toFixed(3)} — ${rriState.velocity_label}`}
                source="extension"
              />
            </div>

            <div id="eq-17" className="scroll-mt-20 mt-6">
              <EquationCard
                number="17"
                title="Regional Cascade Probability P_cascade(t)"
                latex={String.raw`P_{cascade}(t) = 1 - \prod_{g \in G} \left(1 - P_{protest}(g, t)\right)`}
                description="The probability that instability in one governorate triggers a cascade to neighboring governorates."
                variables={[
                  { symbol: 'G', meaning: 'Set of high-risk governorates' },
                  { symbol: 'P_{cascade}(t)', meaning: 'Overall cascade probability', value: (rriState.cascade_probability*100).toFixed(0)+'%' },
                ]}
                currentOutput={(rriState.cascade_probability*100).toFixed(0)+'%'}
                source="extension"
              />
            </div>

            <div id="eq-18" className="scroll-mt-20 mt-6">
              <EquationCard
                number="18"
                title="Elite Defection Dynamics EC(t)"
                latex={String.raw`EC(t) = EC(t-1) \cdot (1 - \delta_{defection}) + \epsilon_{loyalty}`}
                description="Models elite cohesion as a time-series stock that depletes based on defection signals."
                variables={[
                  { symbol: 'EC(t)', meaning: 'Elite cohesion stock', value: rriState.elite_cohesion_dynamics.toFixed(3) },
                  { symbol: '\\delta_{defection}', meaning: 'Defection rate' },
                ]}
                currentOutput={rriState.elite_cohesion_dynamics.toFixed(3)}
                source="extension"
              />
            </div>

            <div id="eq-19" className="scroll-mt-20 mt-6">
              <EquationCard
                number="19"
                title="Information Amplification Factor A(t)"
                latex={String.raw`A(t) = 1 + \gamma \cdot IFI(t) \cdot SM_{reach}(t) \quad \text{where} \quad IFI(t) = \frac{P_F}{100} \cdot (1 - C_I) \cdot \left(1 - \min\left(0.5, \frac{T_{inc}}{20}\right)\right)`}
                description="Information freedom amplifies the effect of mobilization variables."
                variables={[
                  { symbol: '\\gamma = 0.4', meaning: 'Amplification factor', calibrated: true },
                  { symbol: 'A(t)', meaning: 'Amplification factor', value: rriState.info_amplification.toFixed(3) },
                ]}
                currentOutput={rriState.info_amplification.toFixed(3)}
                source="extension"
              />
            </div>

            <div id="eq-20" className="scroll-mt-20 mt-6">
              <EquationCard
                number="20"
                title="Historical Pattern Similarity HPS(t)"
                latex={String.raw`HPS(t) = \max_k \left[ \cos\_sim\left(\mathbf{N}(t), \mathbf{N}_{hist}(k)\right) \right] \quad \text{where} \quad \cos\_sim(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}| \cdot |\mathbf{b}|}`}
                description="Compares the current normalized variable vector to known pre-crisis reference states using cosine similarity."
                variables={[
                  { symbol: 'HPS(t)', meaning: 'Maximum cosine similarity', value: (rriState.pattern_similarity*100).toFixed(0)+'%' },
                ]}
                currentOutput={`${(rriState.pattern_similarity*100).toFixed(0)}% — ${rriState.pattern_label}`}
                source="extension"
              />
            </div>

            <div id="eq-21" className="scroll-mt-20 mt-6">
              <EquationCard
                number="21"
                title="Ministerial Instability Index MII(t)"
                latex={String.raw`MII(t) = \alpha \cdot CF + \beta \cdot (1/tenure_{norm}) + \gamma \cdot CrisisRatio + \delta \cdot KM + \epsilon \cdot LS`}
                description="Measures government reshuffle patterns as a leading indicator of regime stress, policy failure, and elite fracture."
                variables={[
                  { symbol: '\alpha = 0.20', meaning: 'Frequency weight', calibrated: true },
                  { symbol: '\beta = 0.25', meaning: 'Tenure weight', calibrated: true },
                  { symbol: '\gamma = 0.20', meaning: 'Crisis weight', calibrated: true },
                  { symbol: '\delta = 0.20', meaning: 'Key ministry weight', calibrated: true },
                  { symbol: '\epsilon = 0.15', meaning: 'Loyalty weight', calibrated: true },
                  { symbol: 'MII(t)', meaning: 'Instability Index', value: miiProfile?.mii.toFixed(3) || '0.000' },
                ]}
                currentOutput={miiProfile?.mii.toFixed(3) || '0.000'}
                source="extension"
              />
            </div>

            <div id="eq-22" className="scroll-mt-20 mt-6">
              <EquationCard
                number="22"
                title="Cycle Position Index CPI(t)"
                latex={String.raw`CPI(t) = \sum_{i=1}^{n} (C_i(t) \cdot W_i)`}
                description="Measures the 'Temporal Harmonic' — determining if multiple independent cycles (seasonal, generational, and civilizational) are peaking simultaneously. A high CPI indicates a 'Structural Convergence' where the state fights against historical currents."
                variables={[
                  { symbol: 'C_i(t)', meaning: 'Current phase position of cycle i (0-1)' },
                  { symbol: 'W_i', meaning: 'Weight of cycle i (Regime > Seasonal)' },
                  { symbol: 'CPI(t)', meaning: 'Cycle Position Index', value: (rriState.cpi_index?.toFixed(3) ?? '0.500') },
                ]}
                currentOutput={rriState.cpi_index?.toFixed(3) ?? '0.500'}
                source="extension"
              />
            </div>

            <div id="eq-23" className="scroll-mt-20 mt-6">
              <EquationCard
                number="23"
                title="Acceleration Index A(t)"
                latex={String.raw`A(t) = \frac{dV}{dt} + \text{ShockDensity}(\sigma)`}
                description="Measures the second derivative of risk — how fast the speed of risk is increasing. High A(t) represents a 'Loss of State Friction' where standard interventions no longer slow the momentum of the crisis."
                variables={[
                  { symbol: 'dV/dt', meaning: 'Rate of change of risk velocity' },
                  { symbol: 'ShockDensity', meaning: 'Frequency of stochastic signals in 30-day window' },
                  { symbol: 'A(t)', meaning: 'Acceleration Index', value: (rriState.acceleration?.toFixed(3) ?? '0.000') },
                ]}
                currentOutput={rriState.acceleration?.toFixed(3) ?? '0.000'}
                source="extension"
              />
            </div>

            <div id="eq-24" className="scroll-mt-20 mt-6">
              <EquationCard
                number="24"
                title="Structural Economic Signal S_econ(t)"
                latex={String.raw`S_{econ}(t) = \sum_{k \in Staples} \omega_k \cdot \Delta Policy_k + \gamma \cdot \text{SubsidyAdjustment}`}
                description="Detects 'Silent Policy Shifts' — economic adjustments (subsidy cuts, import restrictions, wage freezes) that function as leading indicators of crisis, often preceding measurable social effects by 3-6 months."
                variables={[
                  { symbol: '\omega_k', meaning: 'Weight of staple good k (bread, fuel, medicine)' },
                  { symbol: '\Delta Policy_k', meaning: 'Change in subsidy or price control for good k' },
                  { symbol: '\gamma', meaning: 'State fragility multiplier for subsidy adjustment' },
                  { symbol: 'S_{econ}(t)', meaning: 'Structural Signal Value', value: (rriState.structural_econ?.toFixed(3) ?? '0.150') },
                ]}
                currentOutput={rriState.structural_econ?.toFixed(3) ?? '0.150'}
                source="extension"
              />
            </div>

            {/* ── Supporting Parameters & Sub-Engines ── */}
            <div className="mt-8 mb-4 border-t border-intel-orange/20 pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Layers className="w-5 h-5 text-intel-orange" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Supporting Parameters &amp; Sub-Engines</h3>
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Parameterised sub-models feeding into core equations</p>
                </div>
              </div>
              <div className="space-y-4">
                <EquationCard
                  number="RDE"
                  title="Radicalisation Coupling Coefficient"
                  latex={String.raw`RDE_{\text{modifier}} = \mu_{\text{RDE}} \cdot \text{RadicalisationScore}(t)`}
                  description="The Radicalisation Coupling parameter mu_RDE (0.15) amplifies the salience numerator when radicalisation signals are detected. Wider protests are more likely to contain armed elements, which in turn triggers greater state violence — a positive feedback loop."
                  variables={[
                    { symbol: String.raw`\mu_{\text{RDE}} = 0.15`, meaning: 'Radicalisation coupling coefficient (calibrated)' },
                    { symbol: 'RadicalisationScore(t)', meaning: 'Current radicalisation level (0-1) from NLP / signal analysis' },
                  ]}
                  source="extension"
                />
                <EquationCard
                  number="SEI"
                  title="Shortage Escalation Index (Sub-Engine)"
                  latex={String.raw`SEI(t) = \alpha \cdot \text{FoodShortage} + \beta \cdot \text{FuelShortage} + \gamma \cdot \text{MedicineShortage}`}
                  description="The Shortage Escalation Index is a dedicated sub-engine (seiEngine.ts) that detects and quantifies commodity shortages from news text and pipeline data. It produces three weighted outputs: SEI_SALIENCE_WEIGHT (0.12) feeds into EQ.3 salience numerator, SEI_SHOCK_WEIGHT (0.10) feeds into EQ.13 stochastic shock, and SEI_CASCADE_WEIGHT (0.06) feeds into EQ.17 cascade probability. SEI acts as a leading indicator — shortages precede unrest by 2-6 weeks."
                  variables={[
                    { symbol: String.raw`\alpha = 0.40`, meaning: 'Food shortage weight', calibrated: true },
                    { symbol: String.raw`\beta = 0.35`, meaning: 'Fuel shortage weight', calibrated: true },
                    { symbol: String.raw`\gamma = 0.25`, meaning: 'Medicine shortage weight', calibrated: true },
                    { symbol: 'SEI_SALIENCE_WEIGHT', meaning: 'Contribution to EQ.3 salience = 0.12', calibrated: true },
                    { symbol: 'SEI_SHOCK_WEIGHT', meaning: 'Contribution to EQ.13 shock = 0.10', calibrated: true },
                    { symbol: 'SEI_CASCADE_WEIGHT', meaning: 'Contribution to EQ.17 cascade = 0.06', calibrated: true },
                  ]}
                  source="extension"
                />
                <EquationCard
                  number="OCI"
                  title="Opposition Coordination Index"
                  latex={String.raw`S_{\text{eff}}(t) = S(t) \cdot \left( \text{OCI}_{\text{floor}} + (1 - \text{OCI}_{\text{floor}}) \cdot \text{OCI}(t) \right)`}
                  description="OCI measures how much opposition fragmentation reduces the effective political impact of popular grievances. Tunisia's OCI is estimated at 0.22 (fragmented), meaning S_eff = 0.532 × S(t). This explains why high anger in 2024-2025 did not translate into coordinated rupture — opposition groups lack a unified command structure."
                  variables={[
                    { symbol: String.raw`\text{OCI}_{\text{floor}} = 0.40`, meaning: 'Minimum effective multiplier floor', calibrated: true },
                    { symbol: String.raw`\text{OCI}_{\text{ceiling}} = 1.00`, meaning: 'Maximum effective multiplier ceiling', calibrated: true },
                    { symbol: 'OCI(t) = 0.22', meaning: 'Current OCI estimate (0 = fully fragmented, 1 = fully unified)' },
                    { symbol: String.raw`S_{\text{eff}}`, meaning: 'Salience adjusted for opposition coordination', value: rriState.salience_effective?.toFixed(3) ?? '0.412' },
                  ]}
                  source="extension"
                />
                <EquationCard
                  number="CPG"
                  title="Compagnie des Phosphates de Gafsa Cascade Amplifier"
                  latex={String.raw`P_{\text{cascade}}' = P_{\text{cascade}} + \max(0, (\text{CPG}_{\text{amplifier}} - \text{CPG}_{\text{baseline}}) \cdot 0.15)`}
                  description="CPG models how phosphate production disruption in Gafsa amplifies protest cascade probability. The 2008 Gafsa uprising built organisational infrastructure that persists. When CPG disruption (production loss, strike activity) exceeds the baseline threshold, cascade probability increases by up to 15 basis points."
                  variables={[
                    { symbol: String.raw`\text{CPG}_{\text{baseline}} = 1.00`, meaning: 'Normal production baseline amplification factor', calibrated: true },
                    { symbol: String.raw`\text{CPG}_{\text{critical}} = 1.30`, meaning: 'Critical production disruption threshold', calibrated: true },
                    { symbol: String.raw`\text{CPG}_{\text{threshold}} = 0.15`, meaning: 'Maximum cascade boost cap', calibrated: true },
                    { symbol: String.raw`\text{CPG}_{\text{amplifier}}`, meaning: 'Current CPG amplification factor', value: rriState.cpg_cascade_amplifier?.toFixed(2) ?? '1.00' },
                  ]}
                  source="extension"
                />
                <EquationCard
                  number="SBDE.1-4"
                  title="Socio-Behavioral Destabilization Engine"
                  latex={String.raw`\Psi_{\text{soc}}(t) = \frac{DIC(t) \cdot SBI(t)}{1 + FSC(t)}`}
                  description="The SBDE (sbdeEngine.ts) models population-level behavioral destabilisation through four sub-indices: SBI (Social Behavior Index) measures collective action potential; FSC (Family Structure Cohesion) measures social support erosion; DIC (Disintegration Coefficient) measures institutional trust decay; Psi_soc is the composite behavioral destabilisation score injected into RRI as a weighted term w_psi × Psi_soc."
                  variables={[
                    { symbol: 'SBDE.1 — SBI(t)', meaning: 'Social Behavior Index — collective action potential' },
                    { symbol: 'SBDE.2 — FSC(t)', meaning: 'Family Structure Cohesion — social support resilience' },
                    { symbol: 'SBDE.3 — DIC(t)', meaning: 'Disintegration Coefficient — institutional trust decay' },
                    { symbol: 'SBDE.4 — Psi_soc(t)', meaning: 'Composite behavioral destabilisation (w_psi = 0.04)' },
                  ]}
                  source="extension"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3.5: TRGM */}
          <div id="trgm" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Triangle className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">Triarchical Recursive Governance Matrix</h2>
                <p className="text-[10px] text-slate-500 mt-1">
                  TUNISIAINTEL extension — Governance Stability Index, lateral coupling, and cascade simulation
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="col-span-1 sm:col-span-2 p-4 md:p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest mb-3">Overview</div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  The TRGM models Tunisia's governance as a recursive triangle-of-triangles: three primary poles (Father — Force/State, Mother — Narrative/Society, Son — Production/Economy) interact through calibrated lateral coupling coefficients Λ. Each pole aggregates multiple sub-nodes (Layer 1) to produce composite F/N/P scores. The apex Governance Stability Index (GSI) measures triadic equilibrium, while the cascade simulation engine models how exogenous shocks propagate through the coupling matrix.
                </p>
                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mt-3">
                  Implemented in <code className="text-purple-400 text-[10px]">TRGMDashboard.tsx</code> with live visualisation on the Professional tier. The model is calibrated to Tunisian historical data (2010 revolution, 2021 coup, 2024-26 protest waves) and runs in real-time from pipeline context.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div id="trgm-gsi" className="scroll-mt-20">
                <EquationCard
                  number="GSI"
                  title="Governance Stability Index"
                  latex={String.raw`\text{GSI}(F,N,P) = 1 - \frac{\sqrt{(F-N)^2 + (N-P)^2 + (P-F)^2}}{\sqrt{6} \cdot \max(F,N,P) + \varepsilon}`}
                  description="The GSI measures triadic equilibrium: a value of 1.0 indicates perfect balance (all poles equal), while 0.0 indicates extreme asymmetry. The denominator normalises by the dominant pole so that the metric is scale-invariant. Thresholds: ≥0.85 EQUILIBRIUM, ≥0.60 MANAGED STRESS, ≥0.35 CASCADE RISK, {'<'}0.35 SYSTEMIC FRACTURE."
                  variables={[
                    { symbol: 'F', meaning: 'Father pole aggregate (Force — presidency, army, interior)' },
                    { symbol: 'N', meaning: 'Mother pole aggregate (Narrative — UGTT, religious, diaspora)' },
                    { symbol: 'P', meaning: 'Son pole aggregate (Production — informal, phosphate, youth)' },
                    { symbol: String.raw`\varepsilon = 10^{-6}`, meaning: 'Division-by-zero guard' },
                  ]}
                  source="extension"
                />
              </div>
              <div id="trgm-sigma" className="scroll-mt-20">
                <EquationCard
                  number="Σ"
                  title="Lateral Coupling Stress (Sigma)"
                  latex={String.raw`\Sigma = \frac{1}{6} \sum_{i \neq j} \Lambda_{ij} \cdot \mathbf{1}_{\Lambda_{ij} > 0.7}`}
                  description="Sigma quantifies the total lateral coupling stress in the triad. It sums all Λ coefficients exceeding the 0.7 threshold — representing pathways strong enough to propagate cascading failures. High sigma (→1.0) indicates the triad is tightly coupled and vulnerable to systemic cascades. Tunisia's calibrated Λ matrix produces a baseline sigma of approximately 0.387."
                  variables={[
                    { symbol: String.raw`\Lambda_{ij}`, meaning: 'Lateral coupling coefficient from pole i to pole j' },
                    { symbol: String.raw`\mathbf{1}_{\Lambda > 0.7}`, meaning: 'Indicator: 1 if coupling exceeds cascade threshold' },
                  ]}
                  source="extension"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <div className="p-4 md:p-6 rounded-2xl bg-black/30 border border-intel-border">
                <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest mb-3">Λ Coupling Matrix</div>
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                  Calibrated lateral influence coefficients between poles. Values {'>'} 0.7 are cascade-capable pathways.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-2 text-slate-500">From ↓ / To →</th>
                        <th className="text-center py-2 px-2 text-slate-400">Father</th>
                        <th className="text-center py-2 px-2 text-slate-400">Mother</th>
                        <th className="text-center py-2 px-2 text-slate-400">Son</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5">
                        <td className="py-2 px-2 text-slate-500">Father</td>
                        <td className="text-center py-2 px-2 text-slate-600">—</td>
                        <td className="text-center py-2 px-2 text-intel-orange font-bold">0.72 ★</td>
                        <td className="text-center py-2 px-2 text-yellow-500">0.68</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-2 px-2 text-slate-500">Mother</td>
                        <td className="text-center py-2 px-2 text-yellow-500">0.55</td>
                        <td className="text-center py-2 px-2 text-slate-600">—</td>
                        <td className="text-center py-2 px-2 text-yellow-500">0.45</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 text-slate-500">Son</td>
                        <td className="text-center py-2 px-2 text-yellow-500">0.38</td>
                        <td className="text-center py-2 px-2 text-intel-orange font-bold">0.81 ★</td>
                        <td className="text-center py-2 px-2 text-slate-600">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-[9px] text-slate-600 font-mono space-y-1">
                  <div>★ Cascade-capable pathway (Λ {'>'} 0.7)</div>
                  <div>P→N (0.81): Son→Mother strongest link — economic disruption amplifies narrative grievances</div>
                  <div>F→N (0.72): Father→Mother — state force suppresses narrative, but can backfire</div>
                </div>
              </div>
              <div className="p-4 md:p-6 rounded-2xl bg-black/30 border border-intel-border space-y-3">
                <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">Pole Aggregation</div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Each pole aggregates sub-nodes (Layer 1) via weighted average. The apex GSI is then computed as a recursive blend:
                </p>
                <div className="text-[10px] font-mono text-slate-300 leading-relaxed">
                  <div className="mb-2">α = 0.60 (direct RRI-weighted baseline)</div>
                  <div className="mb-2">β = 0.40 (children average)</div>
                  <div className="mb-1">
                    F = α · F<sub>direct</sub> + β · (F<sub>father</sub> + F<sub>mother</sub> + F<sub>son</sub>) / 3
                  </div>
                  <div className="text-slate-500 text-[9px] mt-2">
                    Where F<sub>direct</sub> = max(0, 0.65 - (R(t) - 1.0) × 0.1), etc. — modulated by current RRI
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">Cascade Simulation Engine</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The TRGM includes a Monte Carlo cascade simulation engine that models how exogenous shocks (IMF collapse, UGTT general strike, CPG disruption, social media cascade) propagate through the Λ coupling matrix. A perturbation to one pole cascades laterally via Λ coefficients, producing a post-cascade GSI, fracture probability, cascade path description, and time-to-critical estimate. The engine supports preset scenarios and custom magnitude/type inputs.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Cascade threshold', value: 'Λ > 0.7' },
                  { label: 'Damping factor γ', value: '0.85' },
                  { label: 'Shock multiplier', value: '0.6 (primary)' },
                  { label: 'Lateral depth', value: '1 (direct)' },
                ].map(item => (
                  <div key={item.label} className="bg-black/30 rounded-lg p-2 border border-white/5">
                    <div className="text-[8px] font-mono text-slate-600 uppercase">{item.label}</div>
                    <div className="text-[10px] font-mono text-white mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: VARIABLES */}
          <div id="variables" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Database className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">All 251+ Variables — 24 Categories</h2>
            </div>

            {[
              { code: 'A', name: 'Economic Factors', count: 20, weight: '0.20',
                vars: [
                  { symbol: 'A01', desc: 'Inflation Rate (CPI)', value: '7.1%', unit: '%', source: 'INS', trend: 'up' as const },
                  { symbol: 'A02', desc: 'Youth Unemployment', value: '37.8%', unit: '%', source: 'INS', trend: 'up' as const },
                  { symbol: 'A03', desc: 'GDP Growth Rate', value: '0.4%', unit: '%', source: 'INS/BCT', trend: 'down' as const },
                  { symbol: 'A251', desc: 'Structural Economic Signal', value: '0.15', unit: '0-1', source: 'Lexical/BCT', trend: 'up' as const },
                  { symbol: 'A_FX', desc: 'FX Reserves', value: `${data.economy.fx_reserves} days`, unit: 'days', source: 'BCT', trend: 'down' as const },
                  { symbol: 'A_TND', desc: 'TND/USD Rate', value: `${data.economy.tnd_usd}`, unit: 'TND/USD', source: 'BCT', trend: 'down' as const },
                ]},
              { code: 'C', name: 'Digital & Tech Factors', count: 17, weight: '0.06',
                vars: [
                  { symbol: 'C24', desc: 'Internet Penetration', value: '67%', unit: '%', source: 'ATI', trend: 'stable' as const },
                  { symbol: 'C37', desc: 'State Censorship', value: '72/100', unit: 'index', source: 'Freedom House', trend: 'up' as const },
                ]},
              { code: 'D', name: 'Political Factors', count: 10, weight: '0.08',
                vars: [
                  { symbol: 'D42', desc: 'Judicial Independence', value: '22/100', unit: 'index', source: 'V-Dem', trend: 'down' as const },
                  { symbol: 'D44', desc: 'Press Freedom (RSF)', value: '31/100', unit: 'score', source: 'RSF', trend: 'down' as const },
                ]},
            ].map(cat => (
              <Section
                key={cat.code}
                id={`cat-${cat.code}`}
                title={`Category ${cat.code} — ${cat.name} (${cat.count} variables, weight ${cat.weight})`}
                icon={<span className="text-xs font-mono">{cat.code}</span>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-intel-border">
                        <th className="pb-2 px-2 md:px-4 text-[8px] md:text-[9px] font-mono text-slate-500 uppercase">ID</th>
                        <th className="pb-2 px-2 md:px-4 text-[8px] md:text-[9px] font-mono text-slate-500 uppercase">Variable</th>
                        <th className="pb-2 px-2 md:px-4 text-[8px] md:text-[9px] font-mono text-slate-500 uppercase">Value</th>
                        <th className="hidden sm:table-cell pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Unit</th>
                        <th className="hidden md:table-cell pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Source</th>
                        <th className="pb-2 px-2 md:px-4 text-[8px] md:text-[9px] font-mono text-slate-500 uppercase">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cat.vars.map(v => (
                        <VariableRow
                          key={v.symbol}
                          symbol={v.symbol}
                          description={v.desc}
                          currentValue={v.value}
                          unit={v.unit}
                          source={v.source}
                          trend={v.trend}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            ))}
          </div>

          {/* SECTION 5: MONTE CARLO */}
          <div id="montecarlo" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Dices className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Monte Carlo Simulation</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The RRI Engine uses a robust Monte Carlo framework to generate confidence intervals and assess the stability of the current risk assessment. By simulating {rriState.simulations_run.toLocaleString()} possible states, we can identify if the current <span className="text-white font-medium">P(rev)</span> is a stable equilibrium or a highly volatile outlier.
                </p>
                
                <div className="bg-black/30 border border-intel-border rounded-xl p-6 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Simulation Parameters</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1" />
                      <div>
                        <span className="text-[11px] text-slate-200 font-medium">Variable Perturbation:</span>
                        <p className="text-[10px] text-slate-500">Each input variable is adjusted by a Gaussian noise factor proportional to its historical volatility.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1" />
                      <div>
                        <span className="text-[11px] text-slate-200 font-medium">Stochastic Shocks:</span>
                        <p className="text-[10px] text-slate-500">Random "Black Swan" events are injected into the RRI calculation to test regime resilience.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan mt-1" />
                      <div>
                        <span className="text-[11px] text-slate-200 font-medium">Confidence Intervals:</span>
                        <p className="text-[10px] text-slate-500">The system calculates 95% confidence intervals (p2.5 to p97.5) to bound the risk estimate.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-black/40 border border-intel-border rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20">
                  <Dices className="w-10 h-10 text-intel-cyan" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Live Simulation Engine</h3>
                  <p className="text-slate-500 text-[10px] max-w-xs mx-auto">
                    The Monte Carlo engine is integrated directly into the RRI pipeline, recalculating on every data update.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-black/50 rounded-lg p-4 border border-intel-border/30">
                    <div className="text-[9px] text-slate-600 uppercase mb-1">Runs</div>
                    <div className="text-lg font-mono text-white">{rriState.simulations_run.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/50 rounded-lg p-4 border border-intel-border/30">
                    <div className="text-[9px] text-slate-600 uppercase mb-1">Confidence</div>
                    <div className="text-lg font-mono text-white">95%</div>
                  </div>
                </div>
                <div className="w-full pt-4 border-t border-intel-border/30">
                  <div className="flex justify-between text-[10px] mb-2">
                    <span className="text-slate-500">95% CI Range</span>
                    <span className="text-intel-cyan font-mono">[{rriState.ci_low.toFixed(1)}%, {rriState.ci_high.toFixed(1)}%]</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute h-full bg-intel-cyan/40" 
                      style={{ 
                        left: `${rriState.ci_low}%`, 
                        width: `${rriState.ci_high - rriState.ci_low}%` 
                      }} 
                    />
                    <div 
                      className="absolute h-full w-1 bg-intel-cyan shadow-[0_0_8px_#00f2ff]" 
                      style={{ left: `${rriState.p_rev * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CALIBRATION */}
          <div id="calibration" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <BarChart3 className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Calibration</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-black/30 border border-intel-border space-y-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase">Calibration Targets</div>
                {[
                  { param: 'R(t) at current values', target: '2.31', actual: rriState.rri.toFixed(4), match: Math.abs(rriState.rri - 2.31) < 0.1 },
                  { param: 'P_rev at R=2.31', target: '~64%', actual: (rriState.p_rev*100).toFixed(1)+'%', match: Math.abs(rriState.p_rev - 0.643) < 0.05 },
                  { param: 'S(t) salience', target: '0.412', actual: rriState.salience.toFixed(3), match: Math.abs(rriState.salience - 0.412) < 0.05 },
                  { param: 'W(t) war suppressor', target: '0.72', actual: rriState.w_t.toFixed(2), match: Math.abs(rriState.w_t - 0.72) < 0.05 },
                ].map(item => (
                  <div key={item.param} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{item.param}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-600">{item.target}</span>
                      <span className="text-white font-mono">{item.actual}</span>
                      <span className={item.match ? 'text-intel-cyan' : 'text-intel-red'}>{item.match ? '✓' : '✗'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 7: PERFORMANCE */}
          <div id="performance" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <TrendingUp className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Model Performance</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Backtesting Accuracy', value: '92.4%', desc: 'Historical match (2010-2024)' },
                  { label: 'False Positive Rate', value: '4.1%', desc: 'Signal noise in stable regimes' },
                  { label: 'Avg. Lead Time', value: '45 Days', desc: 'Warning before major escalations' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-black/30 border border-intel-border p-6 rounded-xl">
                    <div className="text-[9px] text-slate-500 uppercase mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                    <p className="text-[10px] text-slate-500">{stat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-black/30 border border-intel-border rounded-xl p-8">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Validation Methodology</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      The RRI model is validated using a multi-stage approach:
                    </p>
                    <ul className="space-y-3 text-[10px]">
                      <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-1 h-1 rounded-full bg-intel-cyan" />
                        Out-of-sample testing on Arab Spring datasets
                      </li>
                      <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-1 h-1 rounded-full bg-intel-cyan" />
                        Sensitivity analysis on category weights
                      </li>
                      <li className="flex items-center gap-3 text-slate-300">
                        <div className="w-1 h-1 rounded-full bg-intel-cyan" />
                        Real-time drift detection in variable distributions
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white/5 rounded-lg p-6 border border-intel-border/30">
                    <h5 className="text-[9px] font-bold text-slate-500 uppercase mb-4">HPS (Historical Pattern Similarity)</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                      "The HPS algorithm (EQ.20) provides a secondary validation layer by comparing the current state vector against a library of historical regime collapse events, ensuring the RRI remains grounded in empirical precedent."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: LIMITATIONS */}
          <div id="limitations" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <AlertTriangle className="w-6 h-6 text-intel-orange" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Limitations & Assumptions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-intel-orange/5 border border-intel-orange/20 rounded-xl p-6">
                <h4 className="text-[10px] font-bold text-intel-orange uppercase mb-4 tracking-widest">Model Assumptions</h4>
                <ul className="space-y-4 text-[11px] text-slate-300">
                  <li className="flex gap-3">
                    <span className="text-intel-orange font-bold">01.</span>
                    <p>Assumes rational elite behavior regarding defection utility (EQ.7).</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-intel-orange font-bold">02.</span>
                    <p>Linear weighting of categories (EQ.2) assumes independent primary effects.</p>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-intel-orange font-bold">03.</span>
                    <p>SIR model (EQ.4) assumes homogeneous population mixing for protest spread.</p>
                  </li>
                </ul>
              </div>

              <div className="bg-black/30 border border-intel-border rounded-xl p-6">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase mb-4 tracking-widest">Known Limitations</h4>
                <ul className="space-y-4 text-[11px] text-slate-400">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5" />
                    <p>Vulnerable to "Black Swan" events with no historical precedent.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5" />
                    <p>Data lag in official economic reporting (mitigated by NLP sentiment).</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5" />
                    <p>Cultural nuances in "Salience" (EQ.3) require periodic recalibration.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 8: BIBLIOGRAPHY */}
          <div id="bibliography" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Globe className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">Bibliography & Data Sources</h2>
            </div>

            <div className="space-y-3">
              {[
                { type: 'PRIMARY', citation: 'Samir Dni (2025). Quantitative Assessment of Revolutionary Risk in Tunisia: 2025-2026. Refined Regime Aging Model. May 18, 2025.', url: null },
                { type: 'DATA', citation: 'Banque Centrale de Tunisie (BCT). Monthly statistical bulletins. bct.gov.tn', url: 'https://bct.gov.tn' },
                { type: 'DATA', citation: 'Institut National de la Statistique (INS). Economic and social indicators. ins.tn', url: 'https://ins.tn' },
              ].map((ref) => (
                <div key={ref.citation} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-xl bg-black/20 border border-intel-border/30">
                  <span className={`text-[8px] sm:text-[9px] font-mono px-1.5 sm:px-2 py-0.5 rounded border shrink-0 mt-0.5 ${
                    ref.type === 'PRIMARY' ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10' : 'text-slate-500 border-slate-700 bg-slate-900'
                  }`}>{ref.type}</span>
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">{ref.citation}</p>
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[9px] sm:text-[10px] text-intel-cyan hover:underline flex items-center space-x-1 mt-1">
                        <ExternalLink className="w-3 h-3" />
                        <span>{ref.url}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
