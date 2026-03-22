import 'katex/dist/katex.min.css';
import katex from 'katex';
import React, { useEffect, useRef, useState } from 'react';
import { usePipeline } from '../context/PipelineContext';
import {
  BookOpen, ChevronDown, ChevronRight,
  AlertTriangle, Info, ExternalLink,
  Download, Search, X, Activity,
  BarChart3, Brain, Zap, Globe,
  Shield, TrendingUp, Database
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
    <td className="py-2 px-4 font-mono text-intel-cyan text-[11px] whitespace-nowrap">{symbol}</td>
    <td className="py-2 px-4 text-slate-300 text-[11px]">{description}</td>
    <td className="py-2 px-4 font-mono text-white text-[11px] font-bold whitespace-nowrap">{currentValue}</td>
    <td className="py-2 px-4 text-slate-500 text-[10px]">{unit}</td>
    <td className="py-2 px-4 text-slate-600 text-[10px]">{source}</td>
    <td className="py-2 px-4 text-[10px]">
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
      className="border border-intel-border rounded-2xl overflow-hidden mb-6 scroll-mt-20"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-black/40 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <div className="text-intel-cyan">{icon}</div>
          <span className="text-sm font-bold text-white uppercase tracking-widest">{title}</span>
          {badge && (
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase text-intel-${badgeColor} border-intel-${badgeColor}/30 bg-intel-${badgeColor}/10`}>
              {badge}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-500" />
          : <ChevronRight className="w-4 h-4 text-slate-500" />
        }
      </button>
      {open && (
        <div className="px-6 py-6 bg-black/20 space-y-6">
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
  <div className={`rounded-2xl border p-6 space-y-4 ${
    source === 'extension'
      ? 'border-intel-orange/30 bg-intel-orange/5'
      : 'border-intel-cyan/20 bg-black/30'
  }`}>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${
            source === 'extension'
              ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
              : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
          }`}>
            EQ.{number}
          </span>
          {source === 'extension' && (
            <span className="text-[9px] font-mono text-intel-orange border border-intel-orange/20 px-2 py-0.5 rounded">
              TUNISIAINTEL EXTENSION
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
      {currentOutput && (
        <div className="text-right">
          <div className="text-[9px] font-mono text-slate-500 uppercase">
            Current Output
          </div>
          <div className="text-lg font-bold font-mono text-intel-cyan">
            {currentOutput}
          </div>
        </div>
      )}
    </div>

    <div className="bg-black/50 rounded-xl p-4 border border-white/5 overflow-x-auto">
      <Equation latex={latex} display={true} />
    </div>

    <p className="text-slate-400 text-xs leading-relaxed">
      {description}
    </p>

    {variables.length > 0 && (
      <div className="space-y-2">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Variable Definitions</div>
        <div className="space-y-1">
          {variables.map((v, i) => (
            <div key={i} className="flex items-start space-x-3 text-[11px]">
              <code className="text-intel-cyan font-mono min-w-[100px] shrink-0">{v.symbol}</code>
              <span className="text-slate-400">{v.meaning}</span>
              {v.value && (
                <span className="text-white font-mono ml-auto shrink-0">{v.value}</span>
              )}
              {v.calibrated && (
                <span className="text-[9px] text-intel-orange ml-1 shrink-0">(calibrated)</span>
              )}
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

export const RRIMethodology: React.FC<{
  onClose?: () => void;
  jumpToEquation?: string;
}> = ({ onClose, jumpToEquation }) => {

  const { rriState, data } = usePipeline();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (jumpToEquation) {
      setTimeout(() => {
        const el = document.getElementById(`eq-${jumpToEquation}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [jumpToEquation]);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'equations-paper', label: 'Core Equations (Samir Dni)' },
    { id: 'equations-ext', label: 'Extensions (TUNISIAINTEL)' },
    { id: 'variables', label: 'All 250 Variables' },
    { id: 'montecarlo', label: 'Monte Carlo' },
    { id: 'calibration', label: 'Calibration & Validation' },
    { id: 'performance', label: 'Model Performance' },
    { id: 'limitations', label: 'Limitations' },
    { id: 'bibliography', label: 'Bibliography' },
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-[#020810]/98 backdrop-blur-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-intel-border bg-black/60 shrink-0">
        <div className="flex items-center space-x-4">
          <BookOpen className="w-5 h-5 text-intel-cyan" />
          <div>
            <div className="text-sm font-bold text-white uppercase tracking-widest">
              RRI Methodology
            </div>
            <div className="text-[9px] font-mono text-slate-500">
              Refined Regime Aging Model — Samir Dni (2025) + TUNISIAINTEL Extensions
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-6">
            <div className="text-[9px] font-mono text-slate-500 px-3 py-1 border border-intel-border rounded">
              v2.1 — {rriState.variables_count} Variables — 20 Equations
            </div>
            <div className="text-[9px] font-mono text-intel-cyan px-3 py-1 border border-intel-cyan/30 bg-intel-cyan/10 rounded">
              R(t) = {rriState.rri.toFixed(4)} | P_rev = {(rriState.p_rev * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3 py-1.5 text-[10px] font-mono text-slate-400 border border-intel-border rounded hover:border-intel-cyan/30 hover:text-intel-cyan transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Print / PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <div className="w-56 shrink-0 border-r border-intel-border bg-black/40 overflow-y-auto py-4">
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

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 scroll-smooth" id="methodology-content">
          {/* SECTION 1: OVERVIEW */}
          <div id="overview" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Activity className="w-6 h-6 text-intel-cyan" />
              <h1 className="text-xl font-bold text-white uppercase tracking-widest">Model Overview</h1>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="col-span-2 p-6 rounded-2xl bg-intel-cyan/5 border border-intel-cyan/20">
                <div className="text-[9px] font-mono text-intel-cyan uppercase tracking-widest mb-3">Abstract</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  The Refined Regime Aging Model (RRAM) presents a comprehensive quantitative framework for assessing revolutionary risk in Tunisia. Developed by Samir Dni (2025), the model integrates 250 variables across 24 categories, employing 12 mathematical methods and 14 specific equations to generate a Revolutionary Risk Index R(t) and revolution probability P_rev.
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mt-3">
                  TUNISIAINTEL extends this model with 6 additional equations (EQ.15-20) providing velocity tracking, compound stress detection, regional cascade probability, elite defection dynamics, information amplification, and historical pattern similarity. The extended model produces 7 distinct analytical outputs updated in real-time from news feeds and pipeline document ingestion.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-black/30 border border-intel-border space-y-4">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Model Outputs</div>
                {[
                  { symbol: 'R(t)', name: 'Revolutionary Risk Index', value: rriState.rri.toFixed(4), desc: 'Core composite risk score', paper: true },
                  { symbol: 'P_rev', name: 'Revolution Probability', value: (rriState.p_rev*100).toFixed(1)+'%', desc: 'Logistic probability estimate', paper: true },
                  { symbol: 'S(t)', name: 'Narrative Salience', value: rriState.salience.toFixed(3), desc: 'Propaganda/counter-propaganda dynamics', paper: true },
                  { symbol: 'V(t)', name: 'Velocity Index', value: (rriState.velocity>0?'+':'')+rriState.velocity.toFixed(3), desc: 'Rate of change of R(t)', paper: false },
                  { symbol: 'HPS', name: 'Pattern Similarity', value: (rriState.pattern_similarity*100).toFixed(0)+'%', desc: 'Match to historical crisis states', paper: false },
                  { symbol: 'CS(t)', name: 'Compound Stress', value: rriState.compound_stress.toFixed(3), desc: 'Non-linear interaction bonus', paper: false },
                  { symbol: 'P_cascade', name: 'Cascade Probability', value: (rriState.cascade_probability*100).toFixed(0)+'%', desc: 'Regional protest spread risk', paper: false },
                ].map(o => (
                  <div key={o.symbol} className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <code className="text-intel-cyan font-mono text-[11px] min-w-[60px]">{o.symbol}</code>
                      <div>
                        <div className="text-[11px] text-white">{o.name}</div>
                        <div className="text-[10px] text-slate-600">{o.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold text-white">{o.value}</span>
                      {!o.paper && (
                        <span className="text-[8px] text-intel-orange border border-intel-orange/20 px-1 rounded">EXT</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-black/30 border border-intel-border space-y-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Architecture</div>
                {[
                  { label: 'Total variables', value: '250' },
                  { label: 'Categories', value: '24 (A through X)' },
                  { label: 'Core equations (paper)', value: '14' },
                  { label: 'Extension equations', value: '6' },
                  { label: 'Monte Carlo runs', value: '10,000' },
                  { label: 'Confidence interval', value: `[${rriState.ci_low}% — ${rriState.ci_high}%]` },
                  { label: 'Model confidence', value: (rriState.model_confidence*100).toFixed(0)+'%' },
                  { label: 'Revolution threshold', value: 'R(t) > 2.625' },
                  { label: 'Update frequency', value: 'Real-time (event-driven)' },
                  { label: 'Languages monitored', value: 'Arabic, French, Darija' },
                  { label: 'Data sources', value: 'BCT, INS, IMF, RSF, social media' },
                  { label: 'Base calibration date', value: 'March 2025 (Samir Dni)' },
                  { label: 'Live calibration', value: 'March 2026 (TUNISIAINTEL)' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-[11px]">
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
                description="The fundamental equation governing the RRI. Each of the 250 variables F_ij(t) across 24 categories is multiplied by its dynamic weight w_ij and summed. The noise term epsilon(t) captures unobserved shocks such as assassinations or natural disasters."
                variables={[
                  { symbol: 'F_{ij}(t)', meaning: 'Variable j in category i at time t (250 total)' },
                  { symbol: 'w_{ij}', meaning: 'Weight of variable j in category i (dynamically adjusted)' },
                  { symbol: '\\epsilon(t)', meaning: 'Stochastic shock term — see EQ.13' },
                  { symbol: 'R(t)', meaning: 'Revolutionary Risk Index (current)', value: rriState.rri.toFixed(4) },
                ]}
                currentOutput={rriState.rri.toFixed(4)}
                source="paper"
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
            <p className="text-slate-500 text-xs mb-6">These 6 equations extend the Samir Dni (2025) framework.</p>

            <div id="eq-15" className="scroll-mt-20">
              <EquationCard
                number="15"
                title="Compound Stress Index CS(t)"
                latex={String.raw`CS(t) = \sum_{i} \sum_{j>i} \left[ \alpha_{ij} \cdot B(n_i, \theta) \cdot B(n_j, \theta) \right] \quad \text{where} \quad B(n, \theta) = \frac{\max(0, n - \theta)}{1 - \theta}`}
                description="Captures non-linear interactions when multiple variables breach their thresholds simultaneously. Crisis compounding formalization."
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
                description="Measures the rate of change of R(t) — is the situation deteriorating or improving, and how fast?"
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
          </div>

          {/* SECTION 4: VARIABLES */}
          <div id="variables" className="scroll-mt-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <Database className="w-6 h-6 text-intel-cyan" />
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">All 250 Variables — 24 Categories</h2>
            </div>

            {[
              { code: 'A', name: 'Economic Factors', count: 20, weight: '0.20',
                vars: [
                  { symbol: 'A01', desc: 'Inflation Rate (CPI)', value: '7.1%', unit: '%', source: 'INS', trend: 'up' as const },
                  { symbol: 'A02', desc: 'Youth Unemployment', value: '37.8%', unit: '%', source: 'INS', trend: 'up' as const },
                  { symbol: 'A03', desc: 'GDP Growth Rate', value: '0.4%', unit: '%', source: 'INS/BCT', trend: 'down' as const },
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
                        <th className="pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">ID</th>
                        <th className="pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Variable</th>
                        <th className="pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Current Value</th>
                        <th className="pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Unit</th>
                        <th className="pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Source</th>
                        <th className="pb-2 px-4 text-[9px] font-mono text-slate-500 uppercase">Trend</th>
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
              ].map((ref, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 rounded-xl bg-black/20 border border-intel-border/30">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border shrink-0 mt-0.5 ${
                    ref.type === 'PRIMARY' ? 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10' : 'text-slate-500 border-slate-700 bg-slate-900'
                  }`}>{ref.type}</span>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ref.citation}</p>
                    {ref.url && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-intel-cyan hover:underline flex items-center space-x-1 mt-1">
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
    </div>
  );
};
