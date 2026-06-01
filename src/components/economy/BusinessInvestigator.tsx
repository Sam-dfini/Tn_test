/**
 * BusinessInvestigator.tsx
 * Economic Intelligence & Decision Engine
 *
 * NOT a dashboard. A decision engine.
 * Answers three questions:
 *   1. Should I start / invest / expand?
 *   2. Where exactly and how?
 *   3. How do I survive if things go wrong?
 *
 * Three user modes:
 *   ENTREPRENEUR  — 0→1, find market gaps, build business plan
 *   OPERATOR      — scale/expand, location engine, risk-adjusted routing
 *   DISTRESSED    — diagnose failure, restructure, reposition
 *
 * AI advisor wired to live pipeline context (RRI, economy, social).
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket, Building2, AlertCircle, Brain,
  MapPin, TrendingUp, TrendingDown, DollarSign,
  Zap, Shield, ChevronRight, Send, Loader2,
  ArrowLeft, BarChart2, Activity, Target,
  CheckCircle, XCircle, Clock, Users,
  LayoutGrid, FileText, Search, Download,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
} from 'recharts';
import { ModePageLayout } from '../modes/ModePageLayout';
import { generateAnalystResponse } from '../../services/geminiService';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { EntrepreneurIntelligence } from '../economy/EntrepreneurIntelligence';

// ── Props ──────────────────────────────────────────────────────────────────

interface BusinessInvestigatorProps {
  onOpenAI: () => void;
  onOpenPipeline: (tab?: string) => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  context: any;
  inline?: boolean;
}

// ── User mode ──────────────────────────────────────────────────────────────

type UserMode = 'select' | 'entrepreneur' | 'operator' | 'distressed';

interface UserModeConfig {
  id:        UserMode;
  label:     string;
  sublabel:  string;
  icon:      React.ElementType;
  color:     string;
  question:  string;
  placeholder: string;
}

const MODES: UserModeConfig[] = [
  {
    id:       'entrepreneur',
    label:    'Entrepreneur',
    sublabel: 'Start or validate a business idea',
    icon:     Rocket,
    color:    '#00d4ff',
    question: 'What do you want to build?',
    placeholder: 'e.g. "I want to open a carpentry workshop in Sfax" or "bakery in Tunis" or "import electronics"',
  },
  {
    id:       'operator',
    label:    'Company / Operator',
    sublabel: 'Scale, expand, or optimize operations',
    icon:     Building2,
    color:    '#bf5af2',
    question: 'What are you trying to do?',
    placeholder: 'e.g. "Open a second warehouse, should it be Sfax or Sousse?" or "Expand agri-export to EU"',
  },
  {
    id:       'distressed',
    label:    'Distressed Business',
    sublabel: 'Diagnose failure and find a path forward',
    icon:     AlertCircle,
    color:    '#ff9f0a',
    question: 'Describe what\'s going wrong',
    placeholder: 'e.g. "My textile factory is losing money despite full orders" or "Restaurant revenue down 40% since Q3"',
  },
];

// ── Governorate risk data ──────────────────────────────────────────────────

const GOVERNORATE_DATA = [
  { id: 'tunis',        name: 'Tunis',         risk: 0.52, market: 0.92, infra: 0.95, labor: 0.85, note: 'Highest market access, highest competition' },
  { id: 'sfax',         name: 'Sfax',          risk: 0.48, market: 0.78, infra: 0.82, labor: 0.80, note: 'Industrial hub, strong SME ecosystem' },
  { id: 'sousse',       name: 'Sousse',        risk: 0.44, market: 0.72, infra: 0.78, labor: 0.75, note: 'Tourism + light manufacturing balance' },
  { id: 'monastir',     name: 'Monastir',      risk: 0.38, market: 0.65, infra: 0.75, labor: 0.72, note: 'Textile corridor, port access' },
  { id: 'nabeul',       name: 'Nabeul',        risk: 0.35, market: 0.68, infra: 0.72, labor: 0.70, note: 'Ceramics, agri-tourism, lower risk' },
  { id: 'bizerte',      name: 'Bizerte',       risk: 0.42, market: 0.60, infra: 0.78, labor: 0.68, note: 'Port city, chemical industry' },
  { id: 'ariana',       name: 'Ariana',        risk: 0.50, market: 0.82, infra: 0.88, labor: 0.82, note: 'Tunis suburb, tech/services growth' },
  { id: 'ben_arous',    name: 'Ben Arous',     risk: 0.48, market: 0.80, infra: 0.85, labor: 0.80, note: 'Industrial zone, logistics access' },
  { id: 'beja',         name: 'Béja',          risk: 0.55, market: 0.40, infra: 0.50, labor: 0.55, note: 'Agri belt, limited market' },
  { id: 'jendouba',     name: 'Jendouba',      risk: 0.68, market: 0.30, infra: 0.42, labor: 0.45, note: 'High protest risk, border area' },
  { id: 'kasserine',    name: 'Kasserine',     risk: 0.82, market: 0.28, infra: 0.35, labor: 0.38, note: '⚠ High instability, CPG corridor' },
  { id: 'sidi_bouzid',  name: 'Sidi Bouzid',   risk: 0.78, market: 0.30, infra: 0.38, labor: 0.40, note: '⚠ Revolution origin, chronic unrest' },
  { id: 'gafsa',        name: 'Gafsa',         risk: 0.88, market: 0.32, infra: 0.40, labor: 0.42, note: '⚠ CPG crisis, maximum protest zone' },
  { id: 'gabes',        name: 'Gabès',         risk: 0.62, market: 0.45, infra: 0.55, labor: 0.52, note: 'Chemical industry, water stress' },
  { id: 'medenine',     name: 'Médenine',      risk: 0.58, market: 0.42, infra: 0.48, labor: 0.48, note: 'Border trade, migration pressure' },
  { id: 'tataouine',    name: 'Tataouine',     risk: 0.72, market: 0.25, infra: 0.30, labor: 0.35, note: '⚠ Remote, high instability' },
];

// ── Sector data ────────────────────────────────────────────────────────────

const SECTOR_DATA = [
  {
    id: 'food', label: 'Food & Agri', icon: '🌾',
    entry_cost: 35, margin: 22, risk: 45, demand: 88,
    rri_sensitivity: 'HIGH',
    opportunity: 'Food processing, olive oil export, organic certification',
    threat: 'Subsidy reform, fuel costs, import competition',
    best_govs: ['Nabeul', 'Sfax', 'Monastir'],
    avoid_govs: ['Kasserine', 'Gafsa'],
  },
  {
    id: 'tech', label: 'Tech / Digital', icon: '💻',
    entry_cost: 15, margin: 42, risk: 25, demand: 72,
    rri_sensitivity: 'LOW',
    opportunity: 'Nearshore services, fintech, edtech, e-commerce',
    threat: 'Internet throttling, talent emigration, FX controls',
    best_govs: ['Tunis', 'Ariana', 'Sfax'],
    avoid_govs: ['Gafsa', 'Tataouine'],
  },
  {
    id: 'manufacturing', label: 'Manufacturing', icon: '🏭',
    entry_cost: 65, margin: 18, risk: 55, demand: 68,
    rri_sensitivity: 'HIGH',
    opportunity: 'Automotive parts, textiles, electronics assembly',
    threat: 'Energy costs, STEG reliability, labor disputes',
    best_govs: ['Ben Arous', 'Sfax', 'Bizerte'],
    avoid_govs: ['Kasserine', 'Sidi Bouzid'],
  },
  {
    id: 'services', label: 'Services / Retail', icon: '🛍️',
    entry_cost: 20, margin: 28, risk: 38, demand: 80,
    rri_sensitivity: 'MEDIUM',
    opportunity: 'Healthcare services, logistics, education, professional services',
    threat: 'Purchasing power decline, informal competition',
    best_govs: ['Tunis', 'Sousse', 'Sfax'],
    avoid_govs: ['Tataouine', 'Gafsa'],
  },
  {
    id: 'construction', label: 'Construction / Real Estate', icon: '🏗️',
    entry_cost: 80, margin: 25, risk: 62, demand: 55,
    rri_sensitivity: 'MEDIUM',
    opportunity: 'Social housing contracts, state projects, diaspora demand',
    threat: 'Payment delays, permitting corruption, credit freeze',
    best_govs: ['Tunis', 'Sfax', 'Sousse'],
    avoid_govs: ['Gafsa', 'Kasserine'],
  },
  {
    id: 'tourism', label: 'Tourism / Hospitality', icon: '🏖️',
    entry_cost: 55, margin: 30, risk: 50, demand: 65,
    rri_sensitivity: 'HIGH',
    opportunity: 'Eco-tourism, med-tourism, off-season diversification',
    threat: 'Political events, regional instability, FX volatility',
    best_govs: ['Sousse', 'Monastir', 'Djerba'],
    avoid_govs: ['Kasserine', 'Gafsa', 'Tataouine'],
  },
];

// ── Location recommendation engine ────────────────────────────────────────

function recommendLocations(
  sector:    string,
  rriState:  any,
  avoidHigh: boolean = true
) {
  const sectorDef = SECTOR_DATA.find(s => s.id === sector);
  const p_rev = (rriState?.p_rev ?? 0.643);
  const riskPenalty = p_rev * 0.3; // higher P_rev makes risky govs worse

  return GOVERNORATE_DATA
    .map(g => {
      const compositeScore = (
        (1 - g.risk) * 0.35 +
        g.market     * 0.30 +
        g.infra      * 0.20 +
        g.labor      * 0.15
      ) - riskPenalty * g.risk;

      const inBestList  = sectorDef?.best_govs.includes(g.name) ?? false;
      const inAvoidList = sectorDef?.avoid_govs.includes(g.name) ?? false;

      return {
        ...g,
        score: Math.max(0, Math.min(1,
          compositeScore + (inBestList ? 0.08 : 0) - (inAvoidList ? 0.15 : 0)
        )),
        recommended: inBestList && !inAvoidList,
        flagged:     inAvoidList || g.risk > 0.72,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

// ── AI prompt builders ─────────────────────────────────────────────────────

function buildEntrepreneurPrompt(query: string, econ: any, social: any, rri: any): string {
  return `You are TunisiaIntel's Economic Decision Engine — a hybrid of Bloomberg Terminal precision, McKinsey strategy, and field intelligence.

USER WANTS TO: ${query}

LIVE CONTEXT (from RRI engine):
- Revolution probability P_rev: ${((rri?.p_rev ?? 0.643) * 100).toFixed(1)}%
- R(t) index: ${rri?.rri ?? 2.31} / 5.0 (threshold 2.31)
- Inflation: ${econ?.inflation ?? 7.1}%
- FX reserves: ${econ?.fx_reserves ?? 84} days import cover
- Youth unemployment: ${econ?.youth_unemployment ?? 37.8}%
- Protest events (30d): ${social?.protest_events_30d ?? 23}
- UGTT mobilisation: ${social?.ugtt_mobilisation_level ?? 'HIGH'}
- Social cohesion: ${social?.social_cohesion ?? 'LOW'}
- IMF deal probability: ${rri?.imf_deal_probability ?? 31}%
- Informal economy: ${econ?.informal_economy_pct ?? 47}%

YOUR TASK: Give a DECISION, not a description. Structure your response as:

## VERDICT
One sentence: Should they do this or not, and why. Be direct.

## MARKET OPPORTUNITY
- Market size and gaps in this sector right now
- Who is already doing this (competition density)
- What segment is UNDERSERVED (be specific)

## LOCATION RECOMMENDATION
- Best 2-3 governorates and why (factoring in risk + demand + logistics)
- Which governorates to avoid and why

## COST STRUCTURE (realistic, not optimistic)
- Startup capital required (TND range)
- Monthly fixed costs
- Key variable costs
- Break-even timeline

## RISK MATRIX
- What kills this business (rank top 3 threats)
- How each risk maps to current P_rev=${((rri?.p_rev ?? 0.643) * 100).toFixed(1)}%
- Which risks are RRI-linked (protest, shortage, policy shock)

## SURVIVAL TACTICS
- How to protect against the top risk
- Which supply chain / customer segment is most resilient
- One counterintuitive insight about this sector in 2026 Tunisia

## GO / NO-GO SCORE
Score 0-100 and justify in 2 sentences. 70+ = go. 50-69 = proceed with conditions. <50 = no.

Be direct, analytical, specific. No generic advice. Reference real Tunisian market conditions.`;
}

function buildOperatorPrompt(query: string, econ: any, social: any, rri: any): string {
  return `You are TunisiaIntel's Operations Intelligence Engine. A company or experienced operator needs strategic guidance.

OPERATOR CHALLENGE: ${query}

LIVE CONTEXT:
- R(t)=${rri?.rri ?? 2.31}, P_rev=${((rri?.p_rev ?? 0.643) * 100).toFixed(1)}%, W(t)=${rri?.w_t ?? 0.72}
- Velocity: ${rri?.velocity_label ?? 'DETERIORATING'}
- Compound stress: ${((rri?.compound_stress ?? 0.12) * 100).toFixed(0)}%
- FX reserves: ${econ?.fx_reserves ?? 84}d | Inflation: ${econ?.inflation ?? 7.1}%
- UGTT: ${social?.ugtt_mobilisation_level ?? 'HIGH'} | Protests: ${social?.protest_events_30d ?? 23}/30d

TASK: Strategic decision support. Structure:

## STRATEGIC ASSESSMENT
What is the real problem/opportunity? (Beyond what they stated)

## LOCATION INTELLIGENCE
If location is relevant:
- Best vs worst governorates for this operation
- Logistics/infrastructure comparison
- Labor market differences
- Risk-adjusted recommendation

## OPERATIONAL RISKS (RRI-linked)
- Which RRI variables threaten this operation most
- Timeline of risk (immediate / 3-6 months / structural)
- Mitigation options

## CAPITAL ALLOCATION
- Where to deploy capital for maximum ROI at current risk level
- What to defer given P_rev=${((rri?.p_rev ?? 0.643) * 100).toFixed(1)}%

## COMPETITIVE DYNAMICS
- How current instability affects competitors (your relative advantage)
- Which market positions are being vacated by distressed operators

## DECISION MATRIX
Present 2-3 options with:
- Expected outcome
- Required capital
- Risk exposure
- Recommended choice

Be strategic, specific, actionable. Assume the operator knows their business.`;
}

function buildDistressedPrompt(query: string, econ: any, social: any, rri: any): string {
  return `You are TunisiaIntel's Business Recovery Engine. A business is in distress.

DISTRESS DESCRIPTION: ${query}

MACRO CONTEXT:
- Inflation: ${econ?.inflation ?? 7.1}% | FX reserves: ${econ?.fx_reserves ?? 84}d
- Youth unemployment: ${econ?.youth_unemployment ?? 37.8}% (labor market context)
- UGTT: ${social?.ugtt_mobilisation_level ?? 'HIGH'} | P_rev: ${((rri?.p_rev ?? 0.643) * 100).toFixed(1)}%
- Social cohesion: ${social?.social_cohesion ?? 'LOW'} | Informal economy: ${econ?.informal_economy_pct ?? 47}%

DIAGNOSTIC TASK:

## ROOT CAUSE DIAGNOSIS
What is ACTUALLY killing this business? Rank:
1. Demand problem (market gone)?
2. Cost problem (margins crushed)?
3. Positioning problem (wrong segment)?
4. Operational problem (efficiency)?
5. External shock (RRI-linked, macro)?
Be specific about which one is primary.

## CASH FLOW EMERGENCY (First 30 days)
- What to cut immediately (no strategic value, high cost)
- What to protect at all costs
- Receivables acceleration options
- Supplier negotiation leverage

## REPOSITIONING OPTIONS
Given current market conditions:
- Which adjacent segment has demand right now?
- What does this business have that others don't?
- Which customer segment is GROWING despite the crisis?

## STRUCTURAL FIXES (60-180 days)
- Cost structure changes
- Revenue diversification
- Partnership or acquisition logic

## MACRO TAILWINDS TO USE
From current RRI context:
- Which macro conditions actually HELP this business type?
- Which government programs / crisis responses create opportunity?

## PROGNOSIS
Honest assessment: survive / transform / close. And why.
Give a % survival probability if nothing changes vs if they implement your top recommendation.

Do not sugarcoat. Distressed operators need truth, not encouragement.`;
}

// ── AI Advisor component ───────────────────────────────────────────────────

const AIAdvisor: React.FC<{
  mode:    UserModeConfig;
  econ:    any;
  social:  any;
  rri:     any;
  rriState:any;
}> = ({ mode, econ, social, rri, rriState }) => {
  const [query,     setQuery]     = useState('');
  const [response,  setResponse]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      let prompt = '';
      if (mode.id === 'entrepreneur') prompt = buildEntrepreneurPrompt(query, econ, social, rriState);
      if (mode.id === 'operator')     prompt = buildOperatorPrompt(query, econ, social, rriState);
      if (mode.id === 'distressed')   prompt = buildDistressedPrompt(query, econ, social, rriState);
      const result = await generateAnalystResponse(prompt);
      setResponse(result);
    } catch (e) {
      setError('Intelligence node unavailable. Check API connection.');
    } finally {
      setLoading(false);
    }
  }, [query, loading, mode, econ, social, rriState]);

  // Format markdown-like response
  const formatResponse = (text: string) => {
    return text.split('\n').map((line, i) => {
      const lineKey = `${mode.id}-line-${i}-${line.substring(0, 20)}`;
      if (line.startsWith('## ')) {
        return (
          <div key={lineKey} className="mt-5 mb-2">
            <div className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: mode.color }}>
              {line.replace('## ', '')}
            </div>
            <div className="h-px mt-1" style={{ background: `${mode.color}22` }} />
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={lineKey} className="flex items-start space-x-2 py-0.5">
            <div className="w-1 h-1 rounded-full mt-2 shrink-0"
              style={{ background: mode.color }} />
            <span className="text-[10px] text-slate-400 leading-relaxed">
              {line.replace(/^[-•]\s/, '')}
            </span>
          </div>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <div key={lineKey} className="flex items-start space-x-2 py-0.5">
            <span className="text-[9px] font-mono shrink-0" style={{ color: mode.color }}>
              {line.match(/^\d+/)?.[0]}.
            </span>
            <span className="text-[10px] text-slate-400 leading-relaxed">
              {line.replace(/^\d+\.\s*/, '')}
            </span>
          </div>
        );
      }
      if (line.trim() === '') return <div key={lineKey} className="h-1" />;
      return (
        <p key={lineKey} className="text-[10px] text-slate-300 leading-relaxed py-0.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Query input */}
      <div className="glass rounded-2xl border overflow-hidden"
        style={{ borderColor: `${mode.color}33` }}>
        <div className="p-4 border-b" style={{ borderColor: `${mode.color}15` }}>
          <div className="text-[9px] font-mono uppercase tracking-widest mb-2"
            style={{ color: mode.color }}>
            {mode.question}
          </div>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
            }}
            placeholder={mode.placeholder}
            className="w-full bg-transparent text-[11px] text-slate-200 placeholder-slate-600
              resize-none outline-none focus:ring-1 focus:ring-intel-cyan/30 leading-relaxed font-mono"
            rows={3}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2"
          style={{ background: `${mode.color}08` }}>
          <span className="text-[8px] font-mono text-slate-600">
            Ctrl+Enter to submit · Context: P_rev={(((rriState?.p_rev ?? 0.643)*100).toFixed(0))}% · RRI={(rriState?.rri ?? 2.31).toFixed(2)}
          </span>
          <button
            onClick={submit}
            disabled={!query.trim() || loading}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-[10px]
              font-mono font-bold transition-all disabled:opacity-40"
            style={{
              background: `${mode.color}18`,
              border: `1px solid ${mode.color}44`,
              color: mode.color,
            }}
          >
            {loading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /><span>ANALYZING…</span></>
            ) : (
              <><Send className="w-3 h-3" /><span>RUN ANALYSIS</span></>
            )}
          </button>
        </div>
      </div>

      {/* Response */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass p-6 rounded-2xl border space-y-3"
            style={{ borderColor: `${mode.color}22` }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: mode.color }} />
              <span className="text-[9px] font-mono" style={{ color: mode.color }}>
                INTELLIGENCE ENGINE PROCESSING
              </span>
            </div>
            <div className="space-y-2">
              {['Scanning sector data…', 'Cross-referencing RRI variables…',
                'Running location algorithm…', 'Generating decision output…'].map((s, i) => (
                <div key={i} className="flex items-center space-x-2 text-[9px] font-mono text-slate-600">
                  <Clock className="w-3 h-3" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-4 rounded-2xl border border-intel-red/30 bg-intel-red/5"
          >
            <div className="flex items-center space-x-2 text-[10px] font-mono text-intel-red">
              <XCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {response && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-2xl border space-y-2"
            style={{ borderColor: `${mode.color}22` }}
          >
            <div className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: `${mode.color}15` }}>
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4" style={{ color: mode.color }} />
                <span className="text-[9px] font-mono uppercase tracking-widest"
                  style={{ color: mode.color }}>
                  Intelligence Analysis
                </span>
              </div>
              <span className="text-[8px] font-mono text-slate-600">
                RRI-linked · Live context
              </span>
            </div>
            <div className="space-y-1">
              {formatResponse(response)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Location Engine ────────────────────────────────────────────────────────

const LocationEngine: React.FC<{ rriState: any }> = ({ rriState }) => {
  const [sector, setSector] = useState<string>('food');
  const recommendations = recommendLocations(sector, rriState);
  const riskColor = (r: number) => r > 0.70 ? '#ff2d55' : r > 0.50 ? '#ff9f0a' : '#2fd158';

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <MapPin className="w-4 h-4 text-intel-cyan" />
        <h3 className="text-[11px] font-bold text-on-surface uppercase tracking-widest">
          Smart Location Engine
        </h3>
      </div>
      <p className="text-[9px] text-slate-500">
        Composite score = (1−risk)×0.35 + market×0.30 + infra×0.20 + labor×0.15,
        penalized by live P_rev={(((rriState?.p_rev ?? 0.643)*100).toFixed(0))}%.
      </p>

      {/* Sector selector */}
      <div className="flex flex-wrap gap-2">
        {SECTOR_DATA.map(s => (
          <button
            key={s.id}
            onClick={() => setSector(s.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[9px]
              font-mono font-bold transition-all"
            style={{
              background: sector === s.id ? 'rgba(0,212,255,0.12)' : 'transparent',
              border: `1px solid ${sector === s.id ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
              color: sector === s.id ? '#00d4ff' : '#475569',
            }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Rankings */}
      <div className="space-y-2">
        {recommendations.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass p-3 rounded-xl border"
            style={{
              borderColor: g.flagged ? '#ff2d5522' : g.recommended ? '#00d4ff22' : '#ffffff08',
              background:  g.flagged ? 'rgba(255,45,85,0.04)' : g.recommended ? 'rgba(0,212,255,0.04)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-[10px] font-mono text-slate-600 w-4 shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[11px] font-bold text-on-surface">{g.name}</span>
                  {g.recommended && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: '#00d4ff18', color: '#00d4ff', border: '1px solid #00d4ff33' }}>
                      RECOMMENDED
                    </span>
                  )}
                  {g.flagged && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: '#ff2d5518', color: '#ff2d55', border: '1px solid #ff2d5533' }}>
                      AVOID
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mb-1">
                  {[
                    { l: 'RISK',   v: g.risk,   invert: true },
                    { l: 'MARKET', v: g.market,  invert: false },
                    { l: 'INFRA',  v: g.infra,   invert: false },
                  ].map(m => (
                    <div key={m.l} className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-slate-600">{m.l}</span>
                      <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${m.v * 100}%`,
                            background: m.invert ? riskColor(m.v) : '#00d4ff',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[8px] text-slate-500">{g.note}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-bold font-mono"
                  style={{ color: g.flagged ? '#ff2d55' : g.recommended ? '#00d4ff' : '#94a3b8' }}>
                  {Math.round(g.score * 100)}
                </div>
                <div className="text-[9px] font-mono text-slate-600">SCORE</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ── Sector deep dive ───────────────────────────────────────────────────────

const SectorDive: React.FC<{ rriState: any; econ: any }> = ({ rriState, econ }) => {
  const [selected, setSelected] = useState<string>('food');
  const sector = SECTOR_DATA.find(s => s.id === selected)!;
  const p_rev  = (rriState?.p_rev ?? 0.643) * 100;

  const radarData = [
    { subject: 'Demand',    A: sector.demand },
    { subject: 'Margin',    A: sector.margin * 2.5 },
    { subject: 'Safety',    A: 100 - sector.risk },
    { subject: 'Entry',     A: 100 - sector.entry_cost },
    { subject: 'Resilience', A: sector.rri_sensitivity === 'LOW' ? 85 : sector.rri_sensitivity === 'MEDIUM' ? 55 : 30 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-3">
        <LayoutGrid className="w-4 h-4 text-intel-purple" />
        <h3 className="text-[11px] font-bold text-on-surface uppercase tracking-widest">
          Sector Intelligence
        </h3>
      </div>

      {/* Selector */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {SECTOR_DATA.map(s => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
            style={{
              background: selected === s.id ? 'rgba(191,90,242,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selected === s.id ? 'rgba(191,90,242,0.4)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <span className="text-lg">{s.icon}</span>
            <span className="text-[8px] font-mono text-center"
              style={{ color: selected === s.id ? '#bf5af2' : '#475569' }}>
              {s.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Sector detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {/* Radar */}
          <div className="glass p-4 rounded-2xl border border-intel-border/40 space-y-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase">
              {sector.label} — Profile
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1c3654" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#475569', fontFamily: 'monospace' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name={sector.label} dataKey="A" stroke="#bf5af2"
                    fill="#bf5af2" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'Entry Cost', v: `${sector.entry_cost}k TND`, c: sector.entry_cost > 50 ? '#ff9f0a' : '#2fd158' },
                { l: 'Avg Margin', v: `${sector.margin}%`, c: sector.margin > 25 ? '#2fd158' : '#ffd60a' },
                { l: 'Market Demand', v: `${sector.demand}%`, c: sector.demand > 70 ? '#2fd158' : '#ffd60a' },
                { l: 'RRI Sensitivity', v: sector.rri_sensitivity, c: sector.rri_sensitivity === 'HIGH' ? '#ff2d55' : sector.rri_sensitivity === 'MEDIUM' ? '#ffd60a' : '#2fd158' },
              ].map(m => (
                <div key={m.l} className="bg-black/30 p-2 rounded-lg border border-white/5">
                  <div className="text-[9px] font-mono text-slate-600 mb-0.5">{m.l}</div>
                  <div className="text-[11px] font-bold font-mono" style={{ color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis */}
          <div className="space-y-3">
            {/* RRI impact */}
            <div className="glass p-4 rounded-2xl border space-y-2"
              style={{ borderColor: sector.rri_sensitivity === 'HIGH' ? '#ff2d5522' : '#ffffff08' }}>
              <div className="text-[9px] font-mono text-slate-500 uppercase">
                RRI Exposure @ P_rev={p_rev.toFixed(0)}%
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {sector.rri_sensitivity === 'HIGH'
                  ? `This sector is directly exposed to political instability. At current P_rev=${p_rev.toFixed(0)}%, supply chain disruptions, customer spending contraction, and regulatory shocks each add ~15-25% revenue risk. Protest events (currently ${rriState?.sir_infected ? 'elevated' : '23/month'}) directly affect operations.`
                  : sector.rri_sensitivity === 'MEDIUM'
                  ? `Moderate RRI exposure. Main channel is indirect — through purchasing power decline and supplier cost inflation. At current inflation ${econ?.inflation ?? 7.1}%, margin compression is the primary risk.`
                  : `Low direct RRI sensitivity. Digital infrastructure is the main risk vector — internet throttling events (14 documented since 2023) and talent emigration (3,500 engineers/year) affect this sector more than street protests.`
                }
              </p>
            </div>

            {/* Opportunity */}
            <div className="glass p-4 rounded-2xl border border-intel-cyan/10 space-y-2">
              <div className="flex items-center space-x-2">
                <Target className="w-3 h-3 text-intel-cyan" />
                <div className="text-[9px] font-mono text-intel-cyan uppercase">Opportunity</div>
              </div>
              <p className="text-[10px] text-slate-400">{sector.opportunity}</p>
            </div>

            {/* Threat */}
            <div className="glass p-4 rounded-2xl border border-intel-red/10 space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-3 h-3 text-intel-red" />
                <div className="text-[9px] font-mono text-intel-red uppercase">Key Threats</div>
              </div>
              <p className="text-[10px] text-slate-400">{sector.threat}</p>
            </div>

            {/* Best locations */}
            <div className="glass p-4 rounded-2xl border border-intel-border/30 space-y-2">
              <div className="text-[9px] font-mono text-slate-500 uppercase">Best Locations</div>
              <div className="flex flex-wrap gap-2">
                {sector.best_govs.map(g => (
                  <span key={g} className="text-[9px] font-mono px-2 py-0.5 rounded"
                    style={{ background: '#00d4ff10', color: '#00d4ff', border: '1px solid #00d4ff22' }}>
                    {g}
                  </span>
                ))}
              </div>
              <div className="text-[9px] font-mono text-slate-500 uppercase mt-2">Avoid</div>
              <div className="flex flex-wrap gap-2">
                {sector.avoid_govs.map(g => (
                  <span key={g} className="text-[9px] font-mono px-2 py-0.5 rounded"
                    style={{ background: '#ff2d5510', color: '#ff2d55', border: '1px solid #ff2d5522' }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ── Market Overview ────────────────────────────────────────────────────────

const MarketOverview: React.FC<{ econ: any; social: any; rriState: any }> = ({
  econ, social, rriState,
}) => {
  const p_rev = ((rriState?.p_rev ?? 0.643) * 100).toFixed(1);
  const clim_score = Math.max(0, 100
    - (econ?.inflation ?? 7.1) * 3
    - (rriState?.p_rev ?? 0.643) * 40
    - (100 - (econ?.fx_reserves ?? 84)) * 0.2
    + (econ?.gdp_growth ?? 0.4) * 5
  ).toFixed(0);

  const indicators = [
    { label: 'Business Climate', value: `${clim_score}/100`, color: parseInt(clim_score) > 50 ? '#2fd158' : '#ff9f0a', desc: 'Composite: macro + risk + ease of entry' },
    { label: 'Inflation', value: `${econ?.inflation ?? 7.1}%`, color: '#ff9f0a', desc: 'CPI official. Real estimated +2-3pts from informal' },
    { label: 'FX Reserves', value: `${econ?.fx_reserves ?? 84}d`, color: (econ?.fx_reserves ?? 84) < 90 ? '#ff2d55' : '#2fd158', desc: '<90d = critical. Affects import-dependent businesses' },
    { label: 'Youth Unemployment', value: `${econ?.youth_unemployment ?? 37.8}%`, color: '#ffd60a', desc: 'Large informal labor pool. Also = large unmet demand' },
    { label: 'Informal Economy', value: `${econ?.informal_economy_pct ?? 47}%`, color: '#6898be', desc: 'Competitive pressure from unregistered operators' },
    { label: 'P_rev', value: `${p_rev}%`, color: parseFloat(p_rev) > 60 ? '#ff2d55' : '#ffd60a', desc: 'Political risk. At >60%: conservative capital deployment' },
  ];

  const sectorChart = SECTOR_DATA.map(s => ({
    name: s.label.split(' ')[0],
    demand: s.demand,
    risk: s.risk,
    margin: s.margin,
  }));

  return (
    <div className="space-y-6">
      {/* Key indicators */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {indicators.map(ind => (
          <div key={ind.label}
            className="glass p-4 rounded-2xl border border-intel-border/40 space-y-1">
            <div className="text-[8px] font-mono text-slate-500 uppercase">{ind.label}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: ind.color }}>
              {ind.value}
            </div>
            <div className="text-[8px] text-slate-600 leading-snug">{ind.desc}</div>
          </div>
        ))}
      </div>

      {/* Sector comparison bar */}
      <div className="glass p-5 rounded-2xl border border-intel-border/40 space-y-3">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
          Sector Comparison — Demand vs Risk
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorChart} barSize={16} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c3654" vertical={false} />
              <XAxis dataKey="name" stroke="#1c3654" fontSize={8}
                tickLine={false} axisLine={false}
                tick={{ fontFamily: 'monospace', fill: '#475569' }} />
              <YAxis stroke="#1c3654" fontSize={8} tickLine={false} axisLine={false}
                tick={{ fontFamily: 'monospace', fill: '#475569' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#000', border: '1px solid #1c3654', borderRadius: 8, fontFamily: 'monospace', fontSize: 10 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="demand" name="Demand %" fill="#00d4ff" opacity={0.8} radius={[3,3,0,0]} />
              <Bar dataKey="risk"   name="Risk %"   fill="#ff2d55" opacity={0.6} radius={[3,3,0,0]} />
              <Bar dataKey="margin" name="Margin %"  fill="#2fd158" opacity={0.7} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-[8px] font-mono text-slate-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background:'#00d4ff'}}/>Demand</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background:'#ff2d55'}}/>Risk</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background:'#2fd158'}}/>Margin</span>
        </div>
      </div>

      {/* Real-time alerts */}
      <div className="glass p-5 rounded-2xl border border-intel-orange/15 space-y-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-intel-orange" />
          <div className="text-[9px] font-mono text-intel-orange uppercase tracking-widest">
            Real-Time Business Environment Signals
          </div>
        </div>
        <div className="space-y-2">
          {[
            {
              signal: 'UGTT Strike Risk',
              level: social?.ugtt_mobilisation_level ?? 'HIGH',
              color: '#ff9f0a',
              impact: 'Manufacturing, transport, public sector — expect disruption windows',
            },
            {
              signal: 'FX Availability',
              level: (econ?.fx_reserves ?? 84) < 90 ? 'CRITICAL' : 'WATCH',
              color: (econ?.fx_reserves ?? 84) < 90 ? '#ff2d55' : '#ffd60a',
              impact: `${econ?.fx_reserves ?? 84}d cover. Import-dependent businesses face L/C delays`,
            },
            {
              signal: 'Protest Density',
              level: (social?.protest_events_30d ?? 23) > 20 ? 'ELEVATED' : 'NORMAL',
              color: (social?.protest_events_30d ?? 23) > 20 ? '#ff9f0a' : '#2fd158',
              impact: `${social?.protest_events_30d ?? 23} events/30d. Interior governorates most affected`,
            },
            {
              signal: 'Subsidy Reform Pressure',
              level: 'ACTIVE',
              color: '#ffd60a',
              impact: 'IMF conditions require energy/food subsidy cuts — pricing risk for all sectors',
            },
          ].map((s, i) => (
            <div key={i} className="flex items-start space-x-3 p-2 rounded-lg"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ background: s.color }} />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-bold font-mono" style={{ color: s.color }}>
                    {s.signal}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 rounded"
                    style={{ background: `${s.color}18`, color: s.color }}>
                    {s.level}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">{s.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

import { exportToPDF } from '../../utils/pdfGenerator';

export const BusinessInvestigator: React.FC<BusinessInvestigatorProps> = ({
  onGoHome, context, inline = false
}) => {
  const { rriState, fullData: data } = useRiskMetrics();
  const econ   = data?.economy  ?? context?.economy  ?? {};
  const social = data?.social   ?? context?.social   ?? {};
  const rri    = data?.rri      ?? context?.rri      ?? {};

  const [userMode,   setUserMode]   = useState<UserMode>('select');
  const [activeView, setActiveView] = useState<'modes' | 'engine'>('engine');
  const [innerTab,   setInnerTab]   = useState<'advisor' | 'location' | 'sectors' | 'overview' | 'engine'>('advisor');
  const [isExporting, setIsExporting] = useState(false);

  const activeMode = MODES.find(m => m.id === userMode);

  const MAIN_TABS = [
    { id: 'modes',  label: 'Strategic Explorer', icon: LayoutGrid },
    { id: 'engine', label: 'Decision Engine',    icon: Rocket },
  ] as const;

  const INNER_TABS = [
    { id: 'advisor',  label: 'AI Advisor',       icon: Brain },
    { id: 'engine',   label: 'Decision Engine',  icon: Rocket },
    { id: 'location', label: 'Location Engine',  icon: MapPin },
    { id: 'sectors',  label: 'Sector Intel',     icon: LayoutGrid },
    { id: 'overview', label: 'Market Overview',  icon: BarChart2 },
  ] as const;

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportToPDF('business-investigator-dossier', `Dossier-${userMode}-${new Date().toISOString().slice(0,10)}.pdf`);
    setIsExporting(false);
  };

  const content = (
    <div className={`flex-1 overflow-y-auto ${inline ? 'h-full bg-[#0a0c10]' : ''}`} id="business-investigator-dossier">
      <div className={`mx-auto ${inline ? 'px-2 py-4 max-w-full' : 'max-w-5xl px-4 py-6'} space-y-6`}>

        {/* Back to home */}
        {!inline && (
          <div className="flex items-center justify-between">
            <button onClick={onGoHome}
              className="flex items-center space-x-2 text-[9px] font-mono text-slate-600
                hover:text-slate-400 transition-colors pdf-export-ignore">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK</span>
            </button>

            {userMode !== 'select' && (
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors text-[9px] font-mono uppercase tracking-widest pdf-export-ignore"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? 'Generating PDF...' : 'Export Dossier'}</span>
              </button>
            )}
          </div>
        )}

        {inline && userMode !== 'select' && (
          <div className="flex justify-end mb-4">
             <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors text-[9px] font-mono uppercase tracking-widest pdf-export-ignore"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? 'Generating PDF...' : 'Export Dossier'}</span>
              </button>
          </div>
        )}

        {/* ── TOP LEVEL TABS ── */}
          <div className="flex gap-4 border-b border-white/5 mb-8">
            {MAIN_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveView(tab.id); if (tab.id === 'modes') setUserMode('select'); }}
                className={`pb-4 px-2 text-xs font-mono font-bold transition-all relative ${
                  activeView === tab.id ? 'text-intel-cyan' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label.toUpperCase()}</span>
                </div>
                {activeView === tab.id && (
                  <motion.div layoutId="mainTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-intel-cyan" />
                )}
              </button>
            ))}
          </div>

          {/* ── MODE SELECTION / DECISION ENGINE ── */}
          {activeView === 'engine' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <EntrepreneurIntelligence />
            </div>
          ) : userMode === 'select' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-on-surface uppercase tracking-widest">
                  Economic Intelligence Engine
                </h1>
                <p className="text-[11px] text-slate-500 mt-1">
                  Decisions, not dashboards. Select your context.
                </p>
              </div>

              {/* Live context strip */}
              <div className="flex flex-wrap gap-3 text-[9px] font-mono">
                {[
                  { l: 'P_rev', v: `${(((rriState?.p_rev ?? 0.643))*100).toFixed(0)}%`, c: '#ff2d55' },
                  { l: 'Inflation', v: `${econ?.inflation ?? 7.1}%`, c: '#ff9f0a' },
                  { l: 'FX', v: `${econ?.fx_reserves ?? 84}d`, c: (econ?.fx_reserves ?? 84) < 90 ? '#ff2d55' : '#ffd60a' },
                  { l: 'UGTT', v: social?.ugtt_mobilisation_level ?? 'HIGH', c: '#ffd60a' },
                  { l: 'Protests', v: `${social?.protest_events_30d ?? 23}/30d`, c: '#6898be' },
                ].map(m => (
                  <span key={m.l} className="flex items-center gap-1.5 px-2 py-1 rounded"
                    style={{ background: `${m.c}10`, border: `1px solid ${m.c}22`, color: m.c }}>
                    {m.l}: <strong>{m.v}</strong>
                  </span>
                ))}
              </div>

              {/* Mode cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MODES.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <motion.button
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUserMode(mode.id)}
                      className="glass p-6 rounded-2xl border text-left space-y-4
                        transition-all group"
                      style={{ borderColor: `${mode.color}22` }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${mode.color}15`, border: `1px solid ${mode.color}33` }}>
                        <Icon className="w-5 h-5" style={{ color: mode.color }} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-on-surface mb-1">
                          {mode.label}
                        </div>
                        <div className="text-[10px] text-slate-500">{mode.sublabel}</div>
                      </div>
                      <div className="flex items-center text-[9px] font-mono"
                        style={{ color: mode.color }}>
                        <span>ENTER</span>
                        <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Market overview is always visible */}
              <div className="pt-4 border-t border-white/5">
                <MarketOverview econ={econ} social={social} rriState={rriState} />
              </div>
            </motion.div>
          ) : activeMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              {/* Mode header */}
              <div className="flex items-center space-x-3">
                <button onClick={() => setUserMode('select')}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <ArrowLeft className="w-4 h-4 text-slate-500" />
                </button>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${activeMode.color}15`, border: `1px solid ${activeMode.color}33` }}>
                  <activeMode.icon className="w-4 h-4" style={{ color: activeMode.color }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-on-surface">{activeMode.label}</h2>
                  <div className="text-[9px] text-slate-600">{activeMode.sublabel}</div>
                </div>
              </div>

              {/* Inner tabs */}
              <div className="flex gap-2 border-b border-white/5 pb-1">
                {INNER_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = innerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setInnerTab(tab.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 text-[9px]
                        font-mono font-bold transition-all rounded-lg"
                      style={{
                        color: isActive ? activeMode.color : '#475569',
                        background: isActive ? `${activeMode.color}10` : 'transparent',
                        border: isActive ? `1px solid ${activeMode.color}30` : '1px solid transparent',
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {innerTab === 'engine' && (
                  <motion.div key="engine"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <EntrepreneurIntelligence />
                  </motion.div>
                )}
                {innerTab === 'advisor' && (
                  <motion.div key="advisor"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AIAdvisor
                      mode={activeMode} econ={econ} social={social}
                      rri={rri} rriState={rriState} />
                  </motion.div>
                )}
                {innerTab === 'location' && (
                  <motion.div key="location"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LocationEngine rriState={rriState} />
                  </motion.div>
                )}
                {innerTab === 'sectors' && (
                  <motion.div key="sectors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SectorDive rriState={rriState} econ={econ} />
                  </motion.div>
                )}
                {innerTab === 'overview' && (
                  <motion.div key="overview"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <MarketOverview econ={econ} social={social} rriState={rriState} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}

        </div>
      </div>
  );

  if (inline) {
    return content;
  }

  return (
    <ModePageLayout>
      {content}
    </ModePageLayout>
  );
};
