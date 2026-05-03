import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass, Rocket, BarChart3, TrendingUp, TrendingDown,
  AlertTriangle, MapPin, Zap, Shield, Target,
  DollarSign, Building2, Users, Globe, ChevronRight,
  Activity, Star, AlertCircle, RefreshCw,
} from 'lucide-react';
import { BusinessInvestigator } from './BusinessInvestigator';
import { EntrepreneurIntelligence } from './EntrepreneurIntelligence';
import { InvestmentIntelligenceReportGenerator } from './InvestmentIntelligenceReportGenerator';
import { usePipeline } from '../context/PipelineContext';
import { BackgroundGrid } from './ProfessionalShared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type MainTab = 'STRATEGIC' | 'ENTREPRENEUR' | 'INVESTMENT';

type Persona =
  | 'NONE'
  | 'INVESTOR'
  | 'ENTREPRENEUR'
  | 'STRATEGIST'
  | 'DIASPORA'
  | 'SME';

// ─── PERSONA CONFIG ──────────────────────────────────────────────────────────

const PERSONAS: {
  id: Persona; label: string; icon: React.ElementType;
  color: string; desc: string; defaultTab: MainTab;
}[] = [
  {
    id: 'INVESTOR', label: 'Investor', icon: DollarSign,
    color: '#00f2ff', desc: 'Capital deployment, ROI, risk-adjusted returns',
    defaultTab: 'INVESTMENT',
  },
  {
    id: 'ENTREPRENEUR', label: 'Entrepreneur', icon: Rocket,
    color: '#f97316', desc: 'Build a business, find gaps, survive launch',
    defaultTab: 'ENTREPRENEUR',
  },
  {
    id: 'STRATEGIST', label: 'Corporate Strategist', icon: Building2,
    color: '#8b5cf6', desc: 'Expansion, market entry, sector intelligence',
    defaultTab: 'STRATEGIC',
  },
  {
    id: 'DIASPORA', label: 'Diaspora Returnee', icon: Globe,
    color: '#10b981', desc: 'Return investment, local market entry, risk awareness',
    defaultTab: 'INVESTMENT',
  },
  {
    id: 'SME', label: 'SME Builder', icon: Users,
    color: '#f59e0b', desc: 'Scale existing business, manage costs, find financing',
    defaultTab: 'ENTREPRENEUR',
  },
];

const TABS: { id: MainTab; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id: 'STRATEGIC', label: 'Strategic Explorer', icon: Compass,
    desc: 'Macro climate, sector matrix, governorate opportunity map',
  },
  {
    id: 'ENTREPRENEUR', label: 'Entrepreneur Engine', icon: Rocket,
    desc: 'Business builder, market gaps, founder toolkit',
  },
  {
    id: 'INVESTMENT', label: 'Investment Report', icon: BarChart3,
    desc: 'Asset classes, ROI heatmap, capital pathways, red flags',
  },
];

// ─── EXECUTIVE STRIP DATA ────────────────────────────────────────────────────

const SECTOR_SCORES = [
  { sector: 'Digital Tech', score: 78, trend: 'up', gov: 'Tunis' },
  { sector: 'Agribusiness', score: 74, trend: 'up', gov: 'Béja / Nabeul' },
  { sector: 'Renewable Energy', score: 71, trend: 'up', gov: 'Tataouine' },
  { sector: 'Logistics', score: 68, trend: 'stable', gov: 'Sousse / Sfax' },
  { sector: 'Tourism', score: 62, trend: 'up', gov: 'Djerba / Hammamet' },
  { sector: 'Light Manufacturing', score: 65, trend: 'stable', gov: 'Monastir / Sfax' },
];

const TOP_ALERTS = [
  { level: 'CRITICAL', text: 'FX reserves at 60d — import cover below threshold' },
  { level: 'HIGH', text: 'UGTT mobilization elevated — labor cost risk rising' },
  { level: 'HIGH', text: 'Black market distortion +48.5% — informal sector pressure' },
];

// ─── EXECUTIVE STRIP ─────────────────────────────────────────────────────────

const ExecutiveStrip: React.FC<{ persona: Persona }> = ({ persona }) => {
  const { data, rriState } = usePipeline();
  const rri = (data as any)?.rri?.rri ?? rriState?.rri ?? 0.46;
  const pRev = (data as any)?.rri?.pRevolution ?? 0.12;
  const fxDays = (data as any)?.economy?.fx_reserves_days ?? 60;

  const bestSector = SECTOR_SCORES[0];
  const opportunityIndex = Math.max(0, Math.min(100, Math.round(
    SECTOR_SCORES.reduce((s, x) => s + x.score, 0) / SECTOR_SCORES.length
  )));
  const riskLevel = rri > 2.5 ? 'CRITICAL' : rri > 1.8 ? 'HIGH' : rri > 1.2 ? 'ELEVATED' : 'MODERATE';
  const riskColor = rri > 2.5 ? 'text-intel-red' : rri > 1.8 ? 'text-intel-orange' : rri > 1.2 ? 'text-yellow-400' : 'text-intel-cyan';

  const kpis = [
    {
      label: 'Best Sector Now',
      value: bestSector.sector,
      sub: bestSector.gov,
      color: 'text-intel-cyan',
      icon: Star,
    },
    {
      label: 'Opportunity Index',
      value: `${opportunityIndex}/100`,
      sub: 'Composite score',
      color: 'text-intel-cyan',
      icon: TrendingUp,
    },
    {
      label: 'Risk Level',
      value: riskLevel,
      sub: `RRI: ${rri.toFixed(2)}`,
      color: riskColor,
      icon: Shield,
    },
    {
      label: 'P(Disruption)',
      value: `${(pRev * 100).toFixed(1)}%`,
      sub: '30-day horizon',
      color: pRev > 0.3 ? 'text-intel-red' : pRev > 0.15 ? 'text-intel-orange' : 'text-intel-cyan',
      icon: AlertCircle,
    },
    {
      label: 'FX Runway',
      value: `${fxDays}d`,
      sub: 'Import cover',
      color: fxDays < 90 ? 'text-intel-red' : 'text-intel-cyan',
      icon: DollarSign,
    },
    {
      label: 'Best Region',
      value: 'Tunis / Nabeul',
      sub: 'Digital + Agri',
      color: 'text-intel-cyan',
      icon: MapPin,
    },
  ];

  return (
    <div className="bg-[#0a0c10] border border-white/5 rounded-2xl overflow-hidden">
      {/* Top row — KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-white/5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="px-4 py-3 space-y-1 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{kpi.label}</span>
                <Icon className={`w-3 h-3 ${kpi.color} opacity-60`} />
              </div>
              <div className={`text-[13px] font-bold font-mono ${kpi.color} truncate`}>{kpi.value}</div>
              <div className="text-[8px] font-mono text-white/20">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Alert strip */}
      <div className="border-t border-white/5 flex items-center gap-0 overflow-x-auto no-scrollbar">
        <div className="px-3 py-2 text-[8px] font-mono text-white/20 uppercase tracking-widest shrink-0 border-r border-white/5">
          Top Alerts
        </div>
        {TOP_ALERTS.map((a, i) => (
          <div key={i} className={`flex items-center gap-2 px-4 py-2 border-r border-white/5 shrink-0 ${i === 0 ? 'animate-pulse' : ''}`}>
            <div className={`w-1 h-1 rounded-full shrink-0 ${a.level === 'CRITICAL' ? 'bg-intel-red' : 'bg-intel-orange'}`} />
            <span className={`text-[9px] font-mono ${a.level === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`}>{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PERSONA SELECTOR ─────────────────────────────────────────────────────────

const PersonaSelector: React.FC<{
  selected: Persona;
  onSelect: (p: Persona, tab: MainTab) => void;
}> = ({ selected, onSelect }) => (
  <div className="space-y-2">
    <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest px-1">I am a…</div>
    <div className="flex items-center gap-2 flex-wrap">
      {PERSONAS.map(p => {
        const Icon = p.icon;
        const isActive = selected === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id, p.defaultTab)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
              isActive
                ? 'border-opacity-60 text-white'
                : 'bg-white/[0.03] border-white/5 text-white/30 hover:text-white/60 hover:border-white/10'
            }`}
            style={isActive ? {
              backgroundColor: `${p.color}18`,
              borderColor: `${p.color}50`,
              color: p.color,
              boxShadow: `0 0 16px ${p.color}20`,
            } : {}}
          >
            <Icon className="w-3 h-3" />
            {p.label}
          </button>
        );
      })}
      {selected !== 'NONE' && (
        <button
          onClick={() => onSelect('NONE', 'STRATEGIC')}
          className="px-2 py-2 text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors uppercase"
        >
          × Clear
        </button>
      )}
    </div>
    {selected !== 'NONE' && (() => {
      const p = PERSONAS.find(x => x.id === selected)!;
      return (
        <div className="text-[9px] font-mono px-1" style={{ color: `${p.color}80` }}>
          → {p.desc}
        </div>
      );
    })()}
  </div>
);

// ─── SECTOR SNAPSHOT (sidebar in header area) ────────────────────────────────

const SectorSnapshot: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
    {SECTOR_SCORES.map((s, i) => (
      <div key={i} className="bg-[#0a0c10] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono text-white/40 uppercase tracking-tighter truncate">{s.sector}</span>
          {s.trend === 'up'
            ? <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
            : <Activity className="w-3 h-3 text-amber-400 shrink-0" />}
        </div>
        <div className={`text-xl font-bold font-mono mb-1 ${s.score >= 70 ? 'text-emerald-400' : s.score >= 60 ? 'text-amber-400' : 'text-intel-orange'}`}>
          {s.score}
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full ${s.score >= 70 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-intel-orange'}`}
            style={{ width: `${s.score}%` }}
          />
        </div>
        <div className="text-[8px] font-mono text-white/20">{s.gov}</div>
      </div>
    ))}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

interface BusinessCommandCenterProps {
  onOpenAI: () => void;
  onOpenPipeline: (tab?: any) => void;
  onGoHome: () => void;
  onOpenReport: () => void;
}

export const BusinessCommandCenter: React.FC<BusinessCommandCenterProps> = ({
  onOpenAI,
  onOpenPipeline,
  onGoHome,
  onOpenReport
}) => {
  const { data } = usePipeline();
  const [activeTab, setActiveTab] = useState<MainTab>('STRATEGIC');
  const [persona, setPersona] = useState<Persona>('NONE');
  const [showPersona, setShowPersona] = useState(true);

  const handlePersonaSelect = (p: Persona, defaultTab: MainTab) => {
    setPersona(p);
    setActiveTab(defaultTab);
  };

  const activePersona = PERSONAS.find(p => p.id === persona);

  return (
    <div className="flex flex-col space-y-5 relative pb-10">
      <BackgroundGrid />

      {/* ── PAGE HEADER ── */}
      <div className="space-y-1 relative z-10">
        <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 uppercase tracking-widest">
          <Zap className="w-3 h-3 text-intel-cyan" />
          <span>ECON-NODE-BCC-01 // STATUS: ACTIVE</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Target className="w-6 h-6 text-intel-cyan" />
              Business & Investment Command Center
            </h1>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mt-1">
              Executive ecosystem hub — See · Decide · Build · Invest
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPersona(!showPersona)}
              className="px-3 py-2 rounded-xl border border-white/5 bg-white/[0.03] text-[9px] font-mono text-white/30 hover:text-white transition-all uppercase"
            >
              {showPersona ? '− Hide Persona' : '+ Who am I?'}
            </button>
          </div>
        </div>
      </div>

      {/* ── PERSONA SELECTOR ── */}
      <AnimatePresence>
        {showPersona && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden relative z-10"
          >
            <PersonaSelector selected={persona} onSelect={handlePersonaSelect} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXECUTIVE DECISION STRIP ── */}
      <div className="relative z-10">
        <ExecutiveStrip persona={persona} />
      </div>

      {/* ── SECTOR SNAPSHOT ── */}
      <div className="relative z-10">
        <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-2">
          Sector Opportunity Scores — Live Assessment
        </div>
        <SectorSnapshot />
      </div>

      {/* ── TAB BAR ── */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const personaColor = activePersona?.color;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-start px-5 py-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-white/[0.06] border-white/15'
                    : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/5'
                }`}
                style={isActive && personaColor ? { borderColor: `${personaColor}30` } : {}}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon
                    className="w-4 h-4 transition-colors"
                    style={{ color: isActive ? (personaColor || '#00f2ff') : 'rgba(255,255,255,0.3)' }}
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest font-mono transition-colors"
                    style={{ color: isActive ? (personaColor || '#ffffff') : 'rgba(255,255,255,0.3)' }}
                  >
                    {tab.label}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-white/20 leading-tight hidden md:block">
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="relative z-10"
        >
          {/* Persona context banner */}
          {activePersona && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-4 text-[10px] font-mono"
              style={{
                backgroundColor: `${activePersona.color}08`,
                borderColor: `${activePersona.color}20`,
                color: `${activePersona.color}`,
              }}
            >
              <activePersona.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold uppercase tracking-widest">{activePersona.label} Mode Active</span>
              <span className="text-white/30 hidden md:block">—</span>
              <span className="text-white/30 hidden md:block">{activePersona.desc}</span>
              <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-40" />
            </div>
          )}

          {/* Strategic Explorer */}
          {activeTab === 'STRATEGIC' && (
            <BusinessInvestigator
              onGoHome={onGoHome}
              onOpenAI={onOpenAI}
              onOpenPipeline={onOpenPipeline}
              onOpenReport={() => setActiveTab('INVESTMENT')}
              context={data}
              inline={true}
            />
          )}

          {/* Entrepreneur Intelligence Engine */}
          {activeTab === 'ENTREPRENEUR' && (
            <EntrepreneurIntelligence />
          )}

          {/* Investment Intelligence Report */}
          {activeTab === 'INVESTMENT' && (
            <InvestmentIntelligenceReportGenerator />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
