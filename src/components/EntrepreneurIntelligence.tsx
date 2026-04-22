/**
 * EntrepreneurIntelligence.tsx
 * Financial Decision Engine for Founders in Unstable Markets
 *
 * GPT framing (correctly implemented):
 * NOT a chatbot. A structured decision companion that:
 *   1. Detects business type → loads risk profile
 *   2. Injects live RRI + macro signals as context
 *   3. Applies decision rules (IF R(t)>2.5 THEN...)
 *   4. Uses Gemini as reasoning layer — not memory layer
 *   5. Guides through 6 phases: Validate→Legal→Finance→Risk→Execute→Adapt
 *
 * Architecture:
 *   Context Layer  → rriState + data (live signals)
 *   Knowledge Layer → BUSINESS_PROFILES + FAILURE_PATTERNS + DECISION_RULES
 *   Reasoning Layer → Gemini (translates rules to natural language)
 *   UI Layer       → 6-phase journey + dynamic alerts
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket, Building2, AlertTriangle, Brain,
  ChevronRight, ChevronDown, Send, Loader2,
  TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, XCircle, Zap, Shield,
  DollarSign, Scale, Target, Clock,
  BarChart2, MapPin, ArrowRight, Info,
  RefreshCw, Lightbulb, BookOpen, Activity,
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';
import { generateAnalystResponse } from '../services/geminiService';

// ── Business profiles ─────────────────────────────────────────────────────

type BusinessType =
  | 'import_export'
  | 'local_services'
  | 'tech_digital'
  | 'manufacturing'
  | 'food_agri'
  | 'retail'
  | 'construction'
  | 'tourism';

interface BusinessProfile {
  id:          BusinessType;
  label:       string;
  icon:        string;
  color:       string;
  description: string;
  fx_sensitivity:     'HIGH' | 'MEDIUM' | 'LOW';
  inflation_sensitivity: 'HIGH' | 'MEDIUM' | 'LOW';
  rri_sensitivity:    'HIGH' | 'MEDIUM' | 'LOW';
  best_govs:   string[];
  risky_govs:  string[];
  legal_form:  string;
  min_capital: number;
  typical_margin_pct: number;
  failure_patterns: string[];
}

const BUSINESS_PROFILES: Record<BusinessType, BusinessProfile> = {
  import_export: {
    id: 'import_export', label: 'Import / Export', icon: '🚢', color: '#ff9f0a',
    description: 'Goods crossing borders — most exposed to FX, customs, and parallel market',
    fx_sensitivity: 'HIGH', inflation_sensitivity: 'HIGH', rri_sensitivity: 'MEDIUM',
    best_govs: ['Sfax', 'Bizerte', 'Tunis', 'Ben Arous'],
    risky_govs: ['Kasserine', 'Gafsa', 'Tataouine'],
    legal_form: 'SARL or SA (≥500k TND capital recommended)',
    min_capital: 1000, typical_margin_pct: 12,
    failure_patterns: ['fx_lock_in', 'fixed_pricing_inflation', 'customs_delay_cash_crunch'],
  },
  local_services: {
    id: 'local_services', label: 'Local Services', icon: '🛍️', color: '#00d4ff',
    description: 'B2C or B2B services — lower FX exposure, high demand sensitivity',
    fx_sensitivity: 'LOW', inflation_sensitivity: 'MEDIUM', rri_sensitivity: 'MEDIUM',
    best_govs: ['Tunis', 'Ariana', 'Sfax', 'Sousse'],
    risky_govs: ['Gafsa', 'Sidi Bouzid', 'Tataouine'],
    legal_form: 'SUARL (solo) or SARL',
    min_capital: 1000, typical_margin_pct: 28,
    failure_patterns: ['purchasing_power_collapse', 'informal_competition', 'late_payment_chains'],
  },
  tech_digital: {
    id: 'tech_digital', label: 'Tech / Digital', icon: '💻', color: '#bf5af2',
    description: 'SaaS, digital services, nearshore — low FX exposure operationally, high talent risk',
    fx_sensitivity: 'LOW', inflation_sensitivity: 'LOW', rri_sensitivity: 'LOW',
    best_govs: ['Tunis', 'Ariana', 'Sfax'],
    risky_govs: ['All interior governorates'],
    legal_form: 'SUARL or SARL + Startup Act label (tax advantages)',
    min_capital: 1000, typical_margin_pct: 42,
    failure_patterns: ['talent_emigration', 'internet_throttling_events', 'fx_client_payment_delays'],
  },
  manufacturing: {
    id: 'manufacturing', label: 'Manufacturing', icon: '🏭', color: '#ffd60a',
    description: 'Physical production — high capital, energy-dependent, labor-intensive',
    fx_sensitivity: 'HIGH', inflation_sensitivity: 'HIGH', rri_sensitivity: 'HIGH',
    best_govs: ['Ben Arous', 'Sfax', 'Bizerte', 'Monastir'],
    risky_govs: ['Kasserine', 'Sidi Bouzid', 'Gafsa'],
    legal_form: 'SARL or SA',
    min_capital: 5000, typical_margin_pct: 18,
    failure_patterns: ['energy_cost_spike', 'labor_dispute_ugtt', 'input_customs_delay'],
  },
  food_agri: {
    id: 'food_agri', label: 'Food & Agriculture', icon: '🌾', color: '#2fd158',
    description: 'Processing, export, or local food — SEI shock exposure, subsidy reform risk',
    fx_sensitivity: 'MEDIUM', inflation_sensitivity: 'HIGH', rri_sensitivity: 'HIGH',
    best_govs: ['Nabeul', 'Sfax', 'Kairouan', 'Beja'],
    risky_govs: ['Gafsa', 'Tataouine', 'Sidi Bouzid'],
    legal_form: 'SARL, agricultural cooperative, or civic company (شركة أهلية)',
    min_capital: 1000, typical_margin_pct: 22,
    failure_patterns: ['subsidy_reform_shock', 'drought_water_shortage', 'sei_anger_demand_collapse'],
  },
  retail: {
    id: 'retail', label: 'Retail / Commerce', icon: '🏪', color: '#ff6b00',
    description: 'Physical or online retail — demand-sensitive, inventory risk',
    fx_sensitivity: 'MEDIUM', inflation_sensitivity: 'HIGH', rri_sensitivity: 'MEDIUM',
    best_govs: ['Tunis', 'Sfax', 'Sousse', 'Nabeul'],
    risky_govs: ['Interior governorates', 'Kasserine'],
    legal_form: 'SUARL or SARL',
    min_capital: 1000, typical_margin_pct: 25,
    failure_patterns: ['purchasing_power_decline', 'parallel_market_undercutting', 'supplier_price_volatility'],
  },
  construction: {
    id: 'construction', label: 'Construction / Real Estate', icon: '🏗️', color: '#6898be',
    description: 'High capital, long cycles, state-contract dependent',
    fx_sensitivity: 'MEDIUM', inflation_sensitivity: 'HIGH', rri_sensitivity: 'HIGH',
    best_govs: ['Tunis', 'Sfax', 'Sousse'],
    risky_govs: ['Kasserine', 'Gafsa', 'Remote governorates'],
    legal_form: 'SARL or SA',
    min_capital: 10000, typical_margin_pct: 20,
    failure_patterns: ['state_payment_delays', 'materials_inflation', 'permit_bureaucracy_stall'],
  },
  tourism: {
    id: 'tourism', label: 'Tourism / Hospitality', icon: '🏖️', color: '#ff453a',
    description: 'Seasonal, FX earner, highly sensitive to political events and W(t)',
    fx_sensitivity: 'HIGH', inflation_sensitivity: 'MEDIUM', rri_sensitivity: 'HIGH',
    best_govs: ['Sousse', 'Monastir', 'Hammamet', 'Djerba'],
    risky_govs: ['Kasserine', 'Gafsa', 'Interior'],
    legal_form: 'SARL or SA + tourism license',
    min_capital: 5000, typical_margin_pct: 30,
    failure_patterns: ['political_event_cancellations', 'rri_spike_tourist_deterrence', 'fx_cost_income_mismatch'],
  },
};

// ── Failure patterns ──────────────────────────────────────────────────────

const FAILURE_PATTERNS: Record<string, { label: string; cause: string; signal: string; prevention: string }> = {
  fx_lock_in: {
    label: 'FX Lock-in Collapse',
    cause: 'Fixed USD/EUR purchase contracts when TND depreciated 15–20%',
    signal: 'Parallel market premium > 15% + falling FX reserves',
    prevention: 'Dynamic pricing clauses + 20–30% capital in EUR/USD buffer',
  },
  fixed_pricing_inflation: {
    label: 'Fixed Pricing Under Inflation',
    cause: 'Margins crushed when inflation hit 7–10% and prices were locked',
    signal: 'Inflation > 6% + UGTT wage pressure',
    prevention: 'Monthly repricing + index-linked supplier contracts',
  },
  customs_delay_cash_crunch: {
    label: 'Customs Delay Cash Crunch',
    cause: 'Goods held 3–8 weeks at port while fixed costs continued',
    signal: 'FX reserves < 90 days + L/C delays reported',
    prevention: 'Maintain 3-month operating reserve + local supplier fallback',
  },
  talent_emigration: {
    label: 'Key Talent Departure',
    cause: 'Engineers left for Europe/Gulf after 18-month build period',
    signal: 'Youth emigration aspiration > 60% + brain drain signals',
    prevention: 'Equity participation + EUR-denominated salary component',
  },
  internet_throttling_events: {
    label: 'Internet Throttling / Disruption',
    cause: '14 documented throttling events since 2023 disrupted SaaS operations',
    signal: 'Press freedom rank declining + political protest cycles',
    prevention: 'Multi-region CDN + offline-capable architecture',
  },
  purchasing_power_collapse: {
    label: 'Purchasing Power Collapse',
    cause: 'Customers stopped buying non-essential services as real wages fell',
    signal: 'Happiness index < 4.5 + youth rage > 8 + UGTT escalation',
    prevention: 'Essential-tier product + flexible payment plans',
  },
  sei_anger_demand_collapse: {
    label: 'SEI Anger → Demand Collapse',
    cause: 'Food/shortage anger turned into general economic boycott signal',
    signal: 'SEI > 0.65 + compound stress > 0.15',
    prevention: 'Agri-linked pricing + local supply chain priority',
  },
  labor_dispute_ugtt: {
    label: 'UGTT Strike Disruption',
    cause: 'Sector-wide strikes halted production for 2–6 weeks',
    signal: 'UGTT mobilisation = HIGH + 847+ strikes/year',
    prevention: 'Above-minimum wages + pre-emptive negotiation protocol',
  },
  state_payment_delays: {
    label: 'State Payment Delays',
    cause: 'Government contracts paid 6–18 months late, killing cash flow',
    signal: 'Fiscal deficit > 10B TND + domestic borrowing > 18B TND',
    prevention: 'Max 30% state-contract dependency + factoring agreement',
  },
};

// ── Decision rules ────────────────────────────────────────────────────────

interface DecisionRule {
  id:        string;
  condition: (rri: number, p_rev: number, inflation: number, fx: number, parallel: number, ugtt: string) => boolean;
  severity:  'CRITICAL' | 'WARNING' | 'ADVISORY';
  title:     string;
  message:   string;
  action:    string;
}

const DECISION_RULES: DecisionRule[] = [
  {
    id: 'critical_rri',
    condition: (rri) => rri >= 2.5,
    severity: 'CRITICAL',
    title: 'RRI Critical Threshold Exceeded',
    message: `R(t) ≥ 2.5 — the model's critical rupture zone. Historical precedent (2011, 2021) shows this level precedes rapid systemic changes. Long-term CAPEX commitments face elevated expropriation, regulatory, and demand-shock risk.`,
    action: 'Defer all long-term fixed investments. Prefer lease-over-buy. Maximum liquidity posture.',
  },
  {
    id: 'fx_pressure',
    condition: (_, __, ___, fx) => fx < 90,
    severity: 'CRITICAL',
    title: 'FX Reserves Below Critical Threshold',
    message: 'Reserves < 90 days import cover. L/C approvals becoming selective. Import-dependent businesses face supply disruption probability within 60–90 days.',
    action: 'Secure 90-day input inventory now. Negotiate payment terms extension with suppliers. Open EUR/USD account immediately.',
  },
  {
    id: 'parallel_market',
    condition: (_, __, ___, ____, parallel) => parallel > 15,
    severity: 'WARNING',
    title: 'Parallel Market Premium Elevated',
    message: `Parallel market +${15}% over official rate. Real import costs are materially higher than accounting models suggest. Pricing models based on official TND/USD are understating true input costs.`,
    action: 'Reprice all import-dependent products using parallel rate + 5% buffer. Immediate margin review.',
  },
  {
    id: 'inflation_squeeze',
    condition: (_, __, inflation) => inflation > 7,
    severity: 'WARNING',
    title: 'Inflation Margin Squeeze',
    message: 'Inflation > 7% — real purchasing power declining monthly. Fixed-price contracts erode 7%+ annually. Consumer discretionary spend under pressure.',
    action: 'Move all supplier contracts to monthly price revision clauses. Build 15% inflation buffer into all quotes.',
  },
  {
    id: 'ugtt_strike_risk',
    condition: (_, __, ___, ____, _____, ugtt) => ugtt === 'HIGH',
    severity: 'WARNING',
    title: 'UGTT Mobilisation at HIGH Level',
    message: '847 strikes recorded in 2025. UGTT mobilisation at HIGH means sector-wide disruption is a near-term operational risk, especially for manufacturing, transport, and education.',
    action: 'Audit supply chain for UGTT-organized sectors. Identify alternative suppliers. Build 3-week buffer stock.',
  },
  {
    id: 'elevated_rri',
    condition: (rri, p_rev) => rri >= 2.0 && rri < 2.5 && p_rev > 0.5,
    severity: 'ADVISORY',
    title: 'Elevated Political Risk — Conservative Mode',
    message: `R(t)=${2.31} with P_rev > 50%. System is in elevated instability. Not yet critical but trajectory matters — velocity is deteriorating.`,
    action: 'Extend runway to 12+ months. Avoid equity fundraising during this window. Prepare scenario plans for R(t) > 2.5.',
  },
];

// ── 6-Phase journey config ────────────────────────────────────────────────

const PHASES = [
  { id: 'validate',  n: 1, label: 'Validate',  icon: Target,    desc: 'Market demand, competition, risk viability' },
  { id: 'legal',     n: 2, label: 'Legal',     icon: Scale,     desc: 'Company structure, registration, compliance' },
  { id: 'financial', n: 3, label: 'Financial', icon: DollarSign,desc: 'Capital, pricing, break-even, FX strategy' },
  { id: 'risk',      n: 4, label: 'Risk',      icon: Shield,    desc: 'RRI-linked threats, failure patterns, hedges' },
  { id: 'execute',   n: 5, label: 'Execute',   icon: Zap,       desc: 'Operational timeline, weekly actions' },
  { id: 'adapt',     n: 6, label: 'Adapt',     icon: RefreshCw, desc: 'Dynamic monitoring, when to pivot' },
];

// ── AI prompt builder ─────────────────────────────────────────────────────

function buildDecisionPrompt(
  phase:   string,
  query:   string,
  bizType: BusinessProfile,
  rri: any, data: any,
  activeRules: DecisionRule[]
): string {
  const econ = (data?.economy ?? {}) as any;
  const soc  = (data?.social  ?? {}) as any;
  const geop = (data?.geopolitical ?? {}) as any;

  const rulesText = activeRules.map(r =>
    `[${r.severity}] ${r.title}: ${r.action}`
  ).join('\n');

  const failureText = bizType.failure_patterns
    .map(id => FAILURE_PATTERNS[id])
    .filter(Boolean)
    .map(f => `• ${f.label}: ${f.prevention}`)
    .join('\n');

  return `You are a Financial Decision Engine for founders in unstable markets.
You are NOT a generic advisor. You are a structured reasoning system that:
1. Applies live macroeconomic signals to business decisions
2. Flags failure patterns before they happen
3. Gives Tunisia-specific, legally grounded guidance
4. Adapts recommendations to the current risk level

═══ BUSINESS CONTEXT ═══
Type: ${bizType.label}
User query: ${query}
Phase: ${phase.toUpperCase()}
Typical margin: ${bizType.typical_margin_pct}%
Legal form: ${bizType.legal_form}
FX sensitivity: ${bizType.fx_sensitivity} | Inflation: ${bizType.inflation_sensitivity} | RRI: ${bizType.rri_sensitivity}

═══ LIVE RISK STATE (TunisiaIntel RRI Engine) ═══
R(t) = ${rri?.rri ?? 2.31} (threshold: 2.31)
P_rev = ${((rri?.p_rev ?? 0.643)*100).toFixed(1)}% (revolution probability)
W(t) = ${rri?.w_t ?? 0.72} (war distraction suppressor)
Velocity = ${rri?.velocity_label ?? 'DETERIORATING'} (V=${rri?.velocity ?? 0.18})
Compound stress = ${((rri?.compound_stress ?? 0.12)*100).toFixed(0)}%
Elite cohesion = ${((rri?.elite_cohesion_dynamics ?? 0.55)*100).toFixed(0)}%
Cascade probability = ${((rri?.cascade_probability ?? 0.18)*100).toFixed(0)}%

═══ MACRO SIGNALS ═══
Inflation: ${econ.inflation ?? 7.1}% | FX reserves: ${econ.fx_reserves ?? 84} days
TND/USD: ${econ.tnd_usd ?? 3.18} | Parallel premium: +${econ.parallel_market_premium ?? 18}%
Youth unemployment: ${econ.youth_unemployment ?? 37.8}% | GDP growth: ${econ.gdp_growth ?? 0.4}%
Public debt: ${econ.public_debt ?? 81.2}% GDP | Informal economy: ${econ.informal_economy_pct ?? 47}%
IMF deal probability: ${geop.imf_deal_probability ?? 31}%
UGTT mobilisation: ${soc.ugtt_mobilisation_level ?? 'HIGH'} | Protests/30d: ${soc.protest_events_30d ?? 23}
Decree 54 charged: ${soc.decree54_charged ?? 67} | Press freedom rank: ${soc.press_freedom_rank ?? 118}

═══ ACTIVE DECISION RULES (auto-triggered from signals) ═══
${rulesText || 'No critical rules triggered.'}

═══ FAILURE PATTERNS FOR THIS BUSINESS TYPE ═══
${failureText}

═══ FINANCE LAW 2026 RELEVANT PROVISIONS ═══
- BCT monetization: 11B TND (inflation pressure)
- SME credit lines: 118M TND available via BTS/BFPME
- Graduate employment incentive: 100→20% over 5 years
- Agricultural debt relief active (Art. 59)
- EV/hybrid tax incentives active (Art. 47)
- 4% special levy on banks/telecom/insurance

═══ RESPONSE REQUIREMENTS ═══
Phase: ${phase}
You must answer the specific query: "${query}"

Structure your response EXACTLY as:

## VERDICT
[1-2 sentences: direct answer — go/no-go/adapt and why, given current signals]

## ${phase.toUpperCase()} ANALYSIS
[4-6 concrete, Tunisia-specific points. Reference actual numbers from the signals above.]

## DECISION RULES APPLIED
[For each active rule, explain how it specifically affects THIS business type]

## FAILURE PATTERN TO WATCH
[Identify the #1 failure risk for this query + specific prevention step]

## IMMEDIATE ACTION
[3 specific actions the founder should take THIS WEEK based on current signals]

## RISK WINDOW
[When does the risk profile change? What signal to watch: if R(t) reaches X, or inflation hits Y, then...]

Be direct. Be specific. Use actual numbers from the live signals. Never be generic.
No disclaimer needed — this is a private intelligence system.`;
}

// ── Alert banner ──────────────────────────────────────────────────────────

const RuleBanner: React.FC<{ rule: DecisionRule }> = ({ rule }) => {
  const [open, setOpen] = useState(false);
  const bg = rule.severity === 'CRITICAL' ? 'rgba(255,45,85,0.08)' : rule.severity === 'WARNING' ? 'rgba(255,159,10,0.08)' : 'rgba(0,212,255,0.06)';
  const bc = rule.severity === 'CRITICAL' ? '#ff2d55' : rule.severity === 'WARNING' ? '#ff9f0a' : '#00d4ff';
  const Icon = rule.severity === 'CRITICAL' ? XCircle : rule.severity === 'WARNING' ? AlertTriangle : Info;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: bg, borderColor: `${bc}33` }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-3 text-left">
        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: bc }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest"
              style={{ color: bc }}>{rule.severity}</span>
            <span className="text-[10px] font-bold text-white truncate">{rule.title}</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed line-clamp-1">{rule.action}</p>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
               : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: `${bc}22` }}>
              <p className="text-[9px] text-slate-400 leading-relaxed pt-2">{rule.message}</p>
              <div className="flex items-start gap-2 pt-1">
                <Zap className="w-3 h-3 shrink-0 mt-0.5" style={{ color: bc }} />
                <p className="text-[9px] font-bold leading-relaxed" style={{ color: bc }}>{rule.action}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Signal bars ───────────────────────────────────────────────────────────

const SignalBar: React.FC<{
  label: string; value: number; max: number;
  color: string; format?: (v: number) => string;
}> = ({ label, value, max, color, format }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-[8px] font-mono text-slate-500 uppercase">{label}</span>
      <span className="text-[9px] font-mono font-bold" style={{ color }}>
        {format ? format(value) : value}
      </span>
    </div>
    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  </div>
);

// ── Response formatter ────────────────────────────────────────────────────

const FormattedResponse: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return (
          <div key={i} className="pt-4 pb-1 first:pt-0">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest"
              style={{ color }}>{line.replace('## ', '')}</div>
            <div className="h-px mt-1" style={{ background: `${color}22` }} />
          </div>
        );
        if (line.match(/^[•\-\*] /)) return (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ background: color }} />
            <span className="text-[10px] text-slate-300 leading-relaxed">{line.replace(/^[•\-\*] /, '')}</span>
          </div>
        );
        if (line.match(/^\d+\./)) return (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="text-[9px] font-mono shrink-0 mt-0.5" style={{ color }}>{line.match(/^\d+/)?.[0]}.</span>
            <span className="text-[10px] text-slate-300 leading-relaxed">{line.replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-[10px] text-slate-300 leading-relaxed">{line}</p>;
      })}
    </div>
  );
};

// ── Phase navigator ───────────────────────────────────────────────────────

const PhaseNav: React.FC<{
  currentPhase: string;
  completedPhases: Set<string>;
  onPhase: (id: string) => void;
  color: string;
}> = ({ currentPhase, completedPhases, onPhase, color }) => (
  <div className="flex items-center gap-1 overflow-x-auto pb-1">
    {PHASES.map((p, i) => {
      const Icon = p.icon;
      const isCurrent   = currentPhase === p.id;
      const isCompleted = completedPhases.has(p.id);
      return (
        <React.Fragment key={p.id}>
          <button onClick={() => onPhase(p.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 text-[9px] font-mono font-bold uppercase"
            style={{
              background: isCurrent ? `${color}18` : isCompleted ? 'rgba(47,209,88,0.08)' : 'transparent',
              border: `1px solid ${isCurrent ? color : isCompleted ? '#2fd158' : 'rgba(255,255,255,0.06)'}`,
              color: isCurrent ? color : isCompleted ? '#2fd158' : '#475569',
            }}>
            {isCompleted && !isCurrent
              ? <CheckCircle className="w-3 h-3" />
              : <Icon className="w-3 h-3" />}
            {p.label}
          </button>
          {i < PHASES.length - 1 && (
            <div className="w-3 h-px bg-slate-800 shrink-0" />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────

export const EntrepreneurIntelligence: React.FC = () => {
  const pipeline = usePipeline();
  const rriState = pipeline.rriState;
  const data     = pipeline.data as any;
  const econ     = (data?.economy ?? {}) as any;
  const soc      = (data?.social  ?? {}) as any;

  const [step,     setStep]     = useState<'select' | 'journey' | 'bi'>('select');
  const [bizType,  setBizType]  = useState<BusinessType | null>(null);
  const [phase,    setPhase]    = useState('validate');
  const [query,    setQuery]    = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Compute active decision rules from live signals
  const activeRules = DECISION_RULES.filter(r =>
    r.condition(
      rriState?.rri ?? 2.31,
      rriState?.p_rev ?? 0.643,
      econ.inflation ?? 7.1,
      econ.fx_reserves ?? 84,
      econ.parallel_market_premium ?? 18,
      soc.ugtt_mobilisation_level ?? 'HIGH'
    )
  );

  const profile = bizType ? BUSINESS_PROFILES[bizType] : null;
  const phaseConfig = PHASES.find(p => p.id === phase)!;

  const submit = useCallback(async () => {
    if (!query.trim() || !profile || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const prompt = buildDecisionPrompt(phase, query, profile, rriState, data, activeRules);
      const result = await generateAnalystResponse(prompt);
      setResponse(result);
      setCompletedPhases(prev => new Set([...prev, phase]));
    } catch {
      setResponse('Intelligence engine unavailable. Check API connection.');
    } finally {
      setLoading(false);
    }
  }, [query, profile, loading, phase, rriState, data, activeRules]);

  const rri = rriState?.rri ?? 2.31;
  const p_rev = (rriState?.p_rev ?? 0.643) * 100;
  const rriColor = rri >= 2.5 ? '#ff2d55' : rri >= 2.0 ? '#ff9f0a' : '#ffd60a';

  // Phase placeholder suggestions
  const phaseSuggestions: Record<string, string> = {
    validate: `e.g. "Is there real demand for ${profile?.label ?? 'this'} in Sfax right now?"`,
    legal:    `e.g. "Should I create a SUARL or SARL for ${profile?.label ?? 'this'}? What are the tax implications?"`,
    financial:`e.g. "How much capital do I need and how should I protect it against FX pressure?"`,
    risk:     `e.g. "What are my biggest risks given current R(t) and how do I hedge them?"`,
    execute:  `e.g. "Give me a realistic 90-day execution plan given current market signals"`,
    adapt:    `e.g. "What signals should trigger me to pivot or pause operations?"`,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-widest">
            Entrepreneur Intelligence Engine
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Decision engine · {step === 'select' ? 'Select profile' : step === 'journey' ? 'Guided Journey' : 'Market Intelligence (BI Mode)'}
          </p>
        </div>
        <div className="flex gap-2">
          {step !== 'select' && (
            <button onClick={() => { setStep('select'); setBizType(null); setResponse(null); setCompletedPhases(new Set()); }}
              className="text-[9px] font-mono text-slate-500 hover:text-white transition-colors">
              ← Change
            </button>
          )}
          <button onClick={() => setStep(step === 'bi' ? 'select' : 'bi')}
            className={`text-[9px] font-mono font-bold px-3 py-1 rounded transition-colors ${
              step === 'bi' ? 'bg-intel-cyan/20 text-intel-cyan' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}>
            {step === 'bi' ? 'BACK TO JOURNEY' : 'ENTER BI MODE'}
          </button>
        </div>
      </div>

      {/* Live signal strip */}
      <div className="flex flex-wrap gap-2">
        {[
          { l: 'R(t)',       v: rri.toFixed(2),             c: rriColor },
          { l: 'P_rev',      v: `${p_rev.toFixed(0)}%`,     c: p_rev > 60 ? '#ff2d55' : '#ff9f0a' },
          { l: 'Inflation',  v: `${econ.inflation ?? 7.1}%`, c: '#ff9f0a' },
          { l: 'FX Cover',   v: `${econ.fx_reserves ?? 84}d`,c: (econ.fx_reserves ?? 84) < 90 ? '#ff2d55' : '#ffd60a' },
          { l: 'Parallel',   v: `+${econ.parallel_market_premium ?? 18}%`, c: '#ff9f0a' },
          { l: 'UGTT',       v: soc.ugtt_mobilisation_level ?? 'HIGH', c: '#ffd60a' },
          { l: 'IMF',        v: `${data?.geopolitical?.imf_deal_probability ?? 31}%`, c: '#6898be' },
          { l: 'Rules',      v: `${activeRules.length} active`, c: activeRules.some(r => r.severity === 'CRITICAL') ? '#ff2d55' : '#ff9f0a' },
        ].map(s => (
          <span key={s.l} className="text-[8px] font-mono px-2 py-1 rounded"
            style={{ background: `${s.c}12`, border: `1px solid ${s.c}28`, color: s.c }}>
            {s.l}: <strong>{s.v}</strong>
          </span>
        ))}
      </div>

      {/* Active rules */}
      {activeRules.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
            Active Decision Rules — from live signals
          </div>
          {activeRules.map(r => <RuleBanner key={r.id} rule={r} />)}
        </div>
      )}

      {/* ── STEP 1: Business type selection, BI mode, or Journey ── */}
      {step === 'bi' ? (
        <div className="glass p-8 rounded-2xl border border-intel-border/50 text-center space-y-4">
          <BarChart2 className="w-12 h-12 text-intel-cyan mx-auto opacity-50" />
          <h3 className="text-xl font-bold text-white">Market Intelligence Dashboard</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Aggregated market overview showing live signals, risk vectors, and structural threats.
          </p>
          <div className="pt-4 text-xs font-mono text-slate-500">
             [ DATA AGGREGATION ACTIVE: Live R(t) + Economic Signals ]
          </div>
        </div>
      ) : step === 'select' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="text-[10px] text-slate-400">
            Select your business type. The engine will load a risk profile, failure patterns, and
            connect live R(t)={rri.toFixed(2)} signals to your specific decisions.
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(BUSINESS_PROFILES).map(p => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setBizType(p.id); setStep('journey'); }}
                className="glass p-4 rounded-2xl border text-left space-y-2 transition-all"
                style={{ borderColor: `${p.color}22` }}
              >
                <div className="text-2xl">{p.icon}</div>
                <div>
                  <div className="text-[11px] font-bold text-white">{p.label}</div>
                  <div className="text-[8px] text-slate-500 leading-snug mt-0.5">{p.description}</div>
                </div>
                <div className="flex gap-1 flex-wrap pt-1">
                  {[
                    { l: 'FX', v: p.fx_sensitivity },
                    { l: 'INF', v: p.inflation_sensitivity },
                    { l: 'RRI', v: p.rri_sensitivity },
                  ].map(s => (
                    <span key={s.l} className="text-[7px] font-mono px-1 py-0.5 rounded"
                      style={{
                        color: s.v === 'HIGH' ? '#ff2d55' : s.v === 'MEDIUM' ? '#ff9f0a' : '#2fd158',
                        border: `1px solid ${s.v === 'HIGH' ? '#ff2d5533' : s.v === 'MEDIUM' ? '#ff9f0a33' : '#2fd15833'}`,
                        background: s.v === 'HIGH' ? '#ff2d5510' : s.v === 'MEDIUM' ? '#ff9f0a10' : '#2fd15810',
                      }}>
                      {s.l}:{s.v[0]}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* ── STEP 2: Journey ── */}
      {step === 'journey' && profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* Business type header */}
          <div className="glass p-4 rounded-2xl border space-y-3"
            style={{ borderColor: `${profile.color}33` }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{profile.icon}</span>
              <div className="flex-1">
                <div className="text-[13px] font-bold text-white">{profile.label}</div>
                <div className="text-[9px] text-slate-500">{profile.description}</div>
              </div>
              <div className="text-right text-[8px] font-mono">
                <div className="text-slate-500">LEGAL FORM</div>
                <div className="text-slate-300">{profile.legal_form.split(' ')[0]}</div>
              </div>
            </div>

            {/* Profile signals */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
              <SignalBar label="FX exposure" value={profile.fx_sensitivity === 'HIGH' ? 85 : profile.fx_sensitivity === 'MEDIUM' ? 50 : 20} max={100}
                color={profile.fx_sensitivity === 'HIGH' ? '#ff2d55' : profile.fx_sensitivity === 'MEDIUM' ? '#ff9f0a' : '#2fd158'}
                format={v => `${v}%`} />
              <SignalBar label="Inflation exposure" value={profile.inflation_sensitivity === 'HIGH' ? 85 : profile.inflation_sensitivity === 'MEDIUM' ? 50 : 20} max={100}
                color={profile.inflation_sensitivity === 'HIGH' ? '#ff2d55' : profile.inflation_sensitivity === 'MEDIUM' ? '#ff9f0a' : '#2fd158'}
                format={v => `${v}%`} />
              <SignalBar label="RRI exposure" value={profile.rri_sensitivity === 'HIGH' ? 85 : profile.rri_sensitivity === 'MEDIUM' ? 50 : 20} max={100}
                color={profile.rri_sensitivity === 'HIGH' ? '#ff2d55' : profile.rri_sensitivity === 'MEDIUM' ? '#ff9f0a' : '#2fd158'}
                format={v => `${v}%`} />
            </div>

            {/* Failure patterns preview */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Watch for:</span>
              {profile.failure_patterns.map(id => (
                <span key={id} className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: '#ff2d5510', color: '#ff2d5588', border: '1px solid #ff2d5522' }}>
                  {FAILURE_PATTERNS[id]?.label ?? id}
                </span>
              ))}
            </div>
          </div>

          {/* Phase navigator */}
          <PhaseNav currentPhase={phase} completedPhases={completedPhases}
            onPhase={(id) => { setPhase(id); setResponse(null); setQuery(''); }}
            color={profile.color} />

          {/* Phase description */}
          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <phaseConfig.icon className="w-3 h-3" />
            <span>Phase {phaseConfig.n}/6 — {phaseConfig.desc}</span>
          </div>

          {/* Query input */}
          <div className="glass rounded-2xl border overflow-hidden"
            style={{ borderColor: `${profile.color}33` }}>
            <div className="p-4 border-b border-white/5">
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2"
                style={{ color: profile.color }}>
                {phaseConfig.label} Question
              </div>
              <textarea
                ref={textRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
                placeholder={phaseSuggestions[phase] ?? 'Ask a specific question…'}
                className="w-full bg-transparent text-[11px] text-slate-200 placeholder-slate-600
                  resize-none outline-none leading-relaxed font-mono"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background: `${profile.color}08` }}>
              <span className="text-[8px] font-mono text-slate-600">
                Ctrl+Enter · Context: R(t)={rri.toFixed(2)} · {activeRules.length} rules active
              </span>
              <button onClick={submit} disabled={!query.trim() || loading}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold
                  transition-all disabled:opacity-40"
                style={{
                  background: `${profile.color}18`,
                  border: `1px solid ${profile.color}44`,
                  color: profile.color,
                }}>
                {loading
                  ? <><Loader2 className="w-3 h-3 animate-spin" /><span>ANALYZING…</span></>
                  : <><Brain className="w-3 h-3" /><span>RUN DECISION ENGINE</span></>}
              </button>
            </div>
          </div>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass p-5 rounded-2xl border space-y-3"
                style={{ borderColor: `${profile.color}22` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: profile.color }} />
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: profile.color }}>
                    Decision Engine Processing
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    `Applying ${activeRules.length} active decision rules…`,
                    `Scanning ${profile.failure_patterns.length} failure patterns for ${profile.label}…`,
                    'Injecting live R(t) + macro signals…',
                    'Generating Tunisia-specific guidance…',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] font-mono text-slate-600">
                      <Activity className="w-3 h-3" /><span>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Response */}
          <AnimatePresence>
            {response && !loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-2xl border space-y-4"
                style={{ borderColor: `${profile.color}22` }}>
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color: profile.color }} />
                    <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: profile.color }}>
                      Decision Analysis · Phase {phaseConfig.n}: {phaseConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-mono text-slate-600">
                    <span>R(t)={rri.toFixed(2)}</span>
                    <span>·</span>
                    <span>{activeRules.length} rules</span>
                    <span>·</span>
                    <span>Live context</span>
                  </div>
                </div>
                <FormattedResponse text={response} color={profile.color} />

                {/* Next phase nudge */}
                {completedPhases.has(phase) && phase !== 'adapt' && (
                  <div className="pt-3 border-t border-white/5">
                    <button onClick={() => {
                      const idx = PHASES.findIndex(p => p.id === phase);
                      if (idx < PHASES.length - 1) {
                        setPhase(PHASES[idx + 1].id);
                        setResponse(null);
                        setQuery('');
                      }
                    }} className="flex items-center gap-2 text-[9px] font-mono transition-colors"
                      style={{ color: profile.color }}>
                      Continue to Phase {phaseConfig.n + 1}: {PHASES[PHASES.findIndex(p => p.id === phase) + 1]?.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}

    </div>
  );
};
