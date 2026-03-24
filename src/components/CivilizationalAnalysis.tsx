import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot
} from 'recharts';
import { usePipeline } from '../context/PipelineContext';
import {
  TrendingDown, AlertTriangle, RotateCcw,
  Zap, Globe, Users, Shield, Brain,
  ChevronRight, Info, BookOpen
} from 'lucide-react';

export const CivilizationalAnalysis: React.FC = () => {
  const { rriState, data } = usePipeline();
  const [activeViz, setActiveViz] = useState<number | null>(null);

  return (
    <div className="space-y-16 pb-20">

      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <RotateCcw className="w-6 h-6 text-intel-cyan" />
          <h1 className="text-xl font-bold text-white uppercase
            tracking-widest">Civilizational Analysis</h1>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed
          max-w-3xl">
          The RRI model quantifies what civilizational theory
          describes qualitatively. Four independent frameworks —
          from different intellectual traditions, different
          centuries, different methodologies — all converge on
          the same conclusion about Tunisia's current position.
          This page shows where Tunisia sits in each cycle
          and maps the theoretical frameworks onto live data.
        </p>

        {/* Convergence banner */}
        <div className="flex items-center space-x-4 p-4
          rounded-xl bg-intel-red/5 border border-intel-red/20">
          <AlertTriangle className="w-5 h-5 text-intel-red shrink-0" />
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-intel-red uppercase
              tracking-widest">Multi-Model Convergence Signal</div>
            <div className="text-[11px] text-slate-400">
              Dalio Big Cycle · Haupt Civilization Phases ·
              Freedom Cycle · RRI Model (Samir Dni 2025) —
              all four frameworks independently identify Tunisia
              as being in a pre-revolutionary / terminal decline state.
              Current R(t) = {rriState.rri.toFixed(4)} |
              P_rev = {(rriState.p_rev * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          VIZ 1 — REGIME AGING CURVE (Dalio-inspired)
      ============================================================ */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-intel-cyan/10
            border border-intel-cyan/20 flex items-center
            justify-center text-[11px] font-bold text-intel-cyan
            font-mono">01</div>
          <h2 className="text-lg font-bold text-white uppercase
            tracking-widest">The Regime Aging Curve</h2>
          <span className="text-[9px] font-mono text-slate-600
            ml-auto">After Ray Dalio — The Big Cycle (2021)</span>
        </div>

        <RegimeAgingCurve rriState={rriState} />

        {/* Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-black/30
            border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-intel-cyan
              uppercase tracking-widest">Framework</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ray Dalio's Big Cycle describes how empires and nations
              rise and fall in predictable patterns. The arc moves
              from a New Order through Peace, Prosperity, and Bubble,
              then into Bust, Revolutions, and Debt Restructuring
              before a new order emerges. The cycle typically spans
              50-100 years.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tunisia has completed a compressed version of this cycle
              since independence in 1956. The 2011 revolution was the
              peak. The 2021 Saied coup marks the entry into the
              terminal decline phase — printing money, civil unrest,
              and political restructuring are all now active.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-black/30
            border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-intel-cyan
              uppercase tracking-widest">Tunisia Now</div>
            <div className="space-y-2">
              {[
                {
                  label: 'Financial Bust',
                  value: 'ACTIVE',
                  desc: `FX reserves ${data.economy.fx_reserves} days. IMF deadlock. Parallel market +18%.`,
                  color: 'text-intel-red'
                },
                {
                  label: 'Printing Money',
                  value: 'ACTIVE',
                  desc: `BCT monetizing debt. Inflation ${data.economy.inflation}%. TND declining.`,
                  color: 'text-intel-red'
                },
                {
                  label: 'Revolutions',
                  value: 'APPROACHING',
                  desc: `P_rev = ${(rriState.p_rev*100).toFixed(1)}%. ${data.social.protest_events_30d} protests/month.`,
                  color: 'text-intel-orange'
                },
                {
                  label: 'Debt Restructuring',
                  value: 'IMMINENT',
                  desc: `Public debt 81.2% GDP. Q3 2026 deadline.`,
                  color: 'text-intel-orange'
                },
                {
                  label: 'New World Order',
                  value: 'NOT YET',
                  desc: 'Post-Saied transition scenario not yet triggered.',
                  color: 'text-slate-500'
                },
              ].map(item => (
                <div key={item.label} className="flex items-start
                  space-x-3 text-[10px]">
                  <span className={`font-mono font-bold shrink-0
                    w-24 ${item.color}`}>{item.label}</span>
                  <span className={`font-mono font-bold shrink-0
                    w-20 ${item.color}`}>{item.value}</span>
                  <span className="text-slate-600">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-intel-cyan/5
          border border-intel-cyan/20">
          <p className="text-[11px] text-slate-400 leading-relaxed
            italic">
            "The most important thing to understand about the Big Cycle
            is that it is not deterministic — it is probabilistic.
            Nations that recognize their position in the cycle and
            act accordingly can moderate the severity of the decline
            phase. Tunisia's window for a managed transition is
            narrowing as FX reserves decline and political space
            contracts." — Analysis based on Dalio framework,
            applied to Tunisia 2026.
          </p>
        </div>
      </div>

      {/* ============================================================
          VIZ 2 — CIVILIZATION PHASE WHEEL (Haupt-inspired)
      ============================================================ */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-intel-orange/10
            border border-intel-orange/20 flex items-center
            justify-center text-[11px] font-bold text-intel-orange
            font-mono">02</div>
          <h2 className="text-lg font-bold text-white uppercase
            tracking-widest">Civilization Phase Analysis</h2>
          <span className="text-[9px] font-mono text-slate-600
            ml-auto">After Michael Haupt — Cycle of Civilization (2022)</span>
        </div>

        <CivilizationPhaseWheel rriState={rriState} data={data} />

        {/* Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-black/30
            border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-intel-cyan
              uppercase tracking-widest">Framework</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Michael Haupt's Cycle of Civilization identifies seven
              repeating phases through which societies pass:
              Emergence, Stability, Early Growth, Prosperity,
              Overshoot, Hubris, and Totalitarianism — before
              the cycle resets via collapse or renewal.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The framework maps political, economic, and social
              characteristics to each phase. Phase 6 (Totalitarianism)
              is characterized by "dictatorial government, censorship,
              propaganda, and civil uprisings" — a description that
              matches Tunisia's current state with precise accuracy.
              Phase 6 "overlaps with Phase 0: Emergence" — meaning
              the seeds of the next cycle are already being planted
              within the current crisis.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-black/30
            border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-intel-orange
              uppercase tracking-widest">
              Tunisia Phase 6 Evidence
            </div>
            <div className="space-y-2">
              {[
                {
                  characteristic: 'Dictatorial government',
                  evidence: 'New 2022 constitution concentrates all power in presidency'
                },
                {
                  characteristic: 'Censorship',
                  evidence: `Decree 54: ${data.social.decree54_charged} charged. RSF rank 118.`
                },
                {
                  characteristic: 'Propaganda use',
                  evidence: 'TAP state wire frames all opposition as foreign-backed'
                },
                {
                  characteristic: 'Civil uprisings',
                  evidence: `${data.social.protest_events_30d} protest events in 30 days`
                },
                {
                  characteristic: 'Phase 0 seeds',
                  evidence: 'UGTT, NSF, diaspora organizing alternative governance frameworks'
                },
              ].map(item => (
                <div key={item.characteristic}
                  className="space-y-0.5 pb-2 border-b
                  border-intel-border/20 last:border-0">
                  <div className="text-[10px] font-bold
                    text-intel-orange">{item.characteristic}</div>
                  <div className="text-[9px] text-slate-500">
                    {item.evidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-intel-orange/5
          border border-intel-orange/20">
          <p className="text-[11px] text-slate-400 leading-relaxed
            italic">
            "Rotten to the core, the society awaits collapse." —
            Haupt's description of Phase 6. The critical insight
            is that this phase is not the end — it is the necessary
            precondition for Phase 0: Emergence. The UGTT, the
            diaspora network, and the civil society organizations
            currently being repressed are already forming the
            institutional basis for whatever comes next.
          </p>
        </div>
      </div>

      {/* ============================================================
          VIZ 3 — FREEDOM CYCLE
      ============================================================ */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-intel-purple/10
            border border-intel-purple/20 flex items-center
            justify-center text-[11px] font-bold text-intel-purple
            font-mono">03</div>
          <h2 className="text-lg font-bold text-white uppercase
            tracking-widest">The Freedom Cycle</h2>
          <span className="text-[9px] font-mono text-slate-600
            ml-auto">Classical political theory — attributed to Tytler (1770s)</span>
        </div>

        <FreedomCycleDiagram rriState={rriState} data={data} />

        {/* Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-black/30
            border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-intel-cyan
              uppercase tracking-widest">Framework</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The Freedom Cycle describes how societies move from
              Bondage through Faith, Courage, Liberty, Abundance,
              and Selfishness back to Bondage. The cycle is driven
              by the relationship between civic virtue and political
              freedom — when citizens take freedom for granted,
              they lose the vigilance needed to maintain it.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tunisia is not a single point on this wheel — different
              actors are at different nodes simultaneously. This is
              what makes the current moment so volatile: the regime
              is pushing toward Dependence while organized civil
              society is pulling toward Courage. The outcome depends
              on which force reaches critical mass first.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-black/30
            border border-intel-border space-y-3">
            <div className="text-[9px] font-mono text-intel-purple
              uppercase tracking-widest">Actor Positions</div>
            <div className="space-y-3">
              {[
                {
                  actor: 'Saied Regime',
                  node: 'Bondage / Dependence',
                  color: 'text-intel-red',
                  desc: 'Actively constructing dependency through Decree 54, media control, and economic patronage',
                  icon: '👁'
                },
                {
                  actor: 'UGTT',
                  node: 'Courage',
                  color: 'text-intel-orange',
                  desc: 'Strike threats and resistance represent organized institutional courage',
                  icon: '✊'
                },
                {
                  actor: 'Youth (18-35)',
                  node: 'Apathy → Faith',
                  color: 'text-yellow-500',
                  desc: '65% want to emigrate (apathy) but protest generation is emerging (faith)',
                  icon: '⚡'
                },
                {
                  actor: 'Diaspora (1.4M)',
                  node: 'Courage',
                  color: 'text-intel-cyan',
                  desc: 'Paris rallies, international advocacy, remittance-funded opposition',
                  icon: '🌍'
                },
                {
                  actor: 'Business Elite',
                  node: 'Selfishness',
                  color: 'text-slate-400',
                  desc: 'Capital flight (18% parallel premium) without political commitment',
                  icon: '💼'
                },
              ].map(item => (
                <div key={item.actor} className="flex items-start
                  space-x-3">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold
                        text-white">{item.actor}</span>
                      <span className={`text-[9px] font-mono
                        font-bold ${item.color}`}>→ {item.node}</span>
                    </div>
                    <div className="text-[9px] text-slate-600">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-intel-purple/5
          border border-intel-purple/20">
          <p className="text-[11px] text-slate-400 leading-relaxed
            italic">
            The critical insight of the Freedom Cycle applied to Tunisia
            is that revolution requires a critical mass of actors to
            simultaneously move from Apathy to Courage. The UGTT
            general strike — if it occurs — would be the coordination
            mechanism that triggers this mass transition. This is
            precisely why the strike probability (currently 64%) is
            the single most watched variable in the RRI model.
          </p>
        </div>
      </div>

      {/* ============================================================
          VIZ 4 — MULTI-MODEL CONVERGENCE
      ============================================================ */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-intel-red/10
            border border-intel-red/20 flex items-center
            justify-center text-[11px] font-bold text-intel-red
            font-mono">04</div>
          <h2 className="text-lg font-bold text-white uppercase
            tracking-widest">Multi-Model Convergence</h2>
          <span className="text-[9px] font-mono text-slate-600
            ml-auto">Four independent frameworks — one conclusion</span>
        </div>

        <ConvergenceDiagram rriState={rriState} data={data} />

        {/* Explanation */}
        <div className="p-5 rounded-2xl bg-black/30
          border border-intel-border space-y-3">
          <div className="text-[9px] font-mono text-intel-red
            uppercase tracking-widest">Why Convergence Matters</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Each of the four frameworks was developed independently,
            by different researchers, from different intellectual
            traditions, using different methodologies. Dalio draws
            from financial history and macroeconomics. Haupt draws
            from political philosophy and social anthropology.
            The Freedom Cycle draws from classical political theory.
            The RRI model draws from quantitative political science
            and conflict studies.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            When four independent frameworks all identify the same
            country as being in the same critical phase at the same
            time, this convergence is itself a powerful signal.
            It suggests the pattern is real — not an artifact of
            any single methodology or bias.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The RRI model's contribution is to make this convergence
            measurable and trackable in real time. Where Dalio says
            "revolutions approaching" — the RRI says "P_rev = {(rriState.p_rev*100).toFixed(1)}%,
            confidence interval [{rriState.ci_low}%, {rriState.ci_high}%]."
            Where Haupt says "Phase 6: Totalitarianism" — the RRI
            says "D44 (press freedom) = {(0.69*100).toFixed(0)}/100,
            L126 (propaganda use) = {(0.78*100).toFixed(0)}/100."
            The frameworks are not alternatives — they are complementary
            lenses on the same underlying reality.
          </p>
        </div>
      </div>

      {/* Bottom note */}
      <div className="p-5 rounded-2xl bg-intel-card/30
        border border-intel-border/50 flex items-start space-x-4">
        <BookOpen className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-white uppercase
            tracking-widest">Sources</div>
          <div className="text-[10px] text-slate-500 space-y-1">
            <div>Dalio, R. (2021). <em>Principles for Dealing with the Changing World Order.</em> Simon & Schuster.</div>
            <div>Haupt, M. (2022). <em>The Cycle of Civilizations.</em> bit.ly/CycleCiv</div>
            <div>Classical attribution: Tytler, A.F. (c.1770s). <em>The Freedom Cycle.</em></div>
            <div>Samir Dni (2025). <em>Quantitative Assessment of Revolutionary Risk in Tunisia: 2025-2026.</em></div>
            <div>TUNISIAINTEL Extensions (2026). EQ.15-20. rri_variables.json.</div>
          </div>
        </div>
      </div>

    </div>
  );
};

const RegimeAgingCurve: React.FC<{ rriState: any }> = ({ rriState }) => {

  // Historical data points — Tunisia's arc from 1956
  const curveData = [
    { year: '1956', power: 8, label: 'Independence', event: 'New Order — Bourguiba' },
    { year: '1963', power: 22, label: '', event: 'Single party consolidation' },
    { year: '1970', power: 38, label: '', event: 'Peace & Productivity' },
    { year: '1979', power: 58, label: 'Growth', event: 'Economic opening. Oil revenues.' },
    { year: '1987', power: 72, label: 'Ben Ali', event: 'Coup — "Medical coup" Nov 7' },
    { year: '1995', power: 82, label: 'Peak', event: 'Financial bubble. Stability facade.' },
    { year: '2000', power: 88, label: '', event: 'Prosperity. Wealth gap grows.' },
    { year: '2006', power: 80, label: '', event: 'Overshoot. Inequality peaks.' },
    { year: '2008', power: 72, label: '', event: 'Financial Bust begins' },
    { year: '2010', power: 60, label: '', event: 'Bouazizi. Uprising begins.' },
    { year: '2011', power: 45, label: '2011 Rev.', event: 'Ben Ali flees. New order attempt.' },
    { year: '2013', power: 40, label: '', event: 'Political crisis. Assassinations.' },
    { year: '2014', power: 48, label: '', event: 'Democratic transition. Brief recovery.' },
    { year: '2019', power: 42, label: 'Saied', event: 'Saied elected — populist wave' },
    { year: '2021', power: 32, label: '2021 Coup', event: 'July 25 — presidential power grab' },
    { year: '2023', power: 24, label: '', event: 'New constitution. Opposition jailed.' },
    { year: '2026', power: 18, label: 'NOW', event: `R(t)=${rriState.rri.toFixed(2)} P_rev=${(rriState.p_rev*100).toFixed(0)}%` },
    { year: '2027', power: 14, label: '', event: 'Projected — debt crisis trigger' },
    { year: '2029', power: 8, label: '?', event: 'New Order or collapse' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = curveData.find(x => x.year === label);
    return (
      <div className="bg-[#0a0f1a] border border-intel-cyan/30
        rounded-lg p-3 text-[10px] font-mono max-w-[200px]">
        <div className="text-intel-cyan font-bold mb-1">{label}</div>
        <div className="text-white">{d?.event}</div>
      </div>
    );
  };

  return (
    <div className="glass p-6 rounded-2xl border border-intel-border
      space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono text-slate-500 uppercase
          tracking-widest">Tunisia Regime Power Arc 1956-2029</div>
        <div className="flex items-center space-x-4 text-[9px]
          font-mono">
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-0.5 bg-intel-cyan" />
            <span className="text-slate-500">Historical</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-0.5 bg-intel-red/60
              border-dashed border-t border-intel-red" />
            <span className="text-slate-500">Projected</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={curveData}
          margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="declineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff453a" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#ff453a" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year"
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false} tickLine={false}
            interval={2}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />

          {/* Main power curve */}
          <Area
            type="monotone"
            dataKey="power"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#powerGrad)"
            dot={false}
          />

          {/* Key event markers */}
          <ReferenceLine x="2011" stroke="#ff9f0a"
            strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine x="2021" stroke="#ff453a"
            strokeDasharray="4 4" strokeOpacity={0.5} />
          <ReferenceLine x="2026" stroke="#ff453a"
            strokeWidth={2} strokeOpacity={0.8} />

          {/* Phase labels */}
          <ReferenceDot x="1987" y={72} r={4}
            fill="#ff9f0a" stroke="none" />
          <ReferenceDot x="2000" y={88} r={5}
            fill="#ff453a" stroke="none" />
          <ReferenceDot x="2011" y={45} r={4}
            fill="#ff9f0a" stroke="none" />
          <ReferenceDot x="2026" y={18} r={6}
            fill="#ff453a" stroke="#ff453a"
            strokeWidth={2}
            className="animate-pulse"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Phase annotations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { phase: 'Peace & Productivity', period: '1963-1987', color: 'text-intel-cyan' },
          { phase: 'Financial Bubble', period: '1987-2008', color: 'text-intel-orange' },
          { phase: 'Revolutions', period: '2011-2021', color: 'text-intel-red' },
          { phase: 'Debt Restructuring', period: '2021-?', color: 'text-intel-red', active: true },
        ].map(item => (
          <div key={item.phase} className={`p-3 rounded-xl border
            text-center space-y-1 ${item.active
              ? 'border-intel-red/30 bg-intel-red/5'
              : 'border-intel-border/30 bg-black/20'
          }`}>
            <div className={`text-[9px] font-bold ${item.color}
              uppercase`}>{item.phase}</div>
            <div className="text-[8px] font-mono text-slate-600">
              {item.period}
            </div>
            {item.active && (
              <div className="text-[8px] text-intel-red font-mono
                animate-pulse">● ACTIVE</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CivilizationPhaseWheel: React.FC<{
  rriState: any; data: any
}> = ({ rriState, data }) => {
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);

  const phases = [
    {
      id: 0,
      label: '0/7\nEmergence',
      short: 'Emergence',
      color: '#30d158',
      angle: 270,
      active: false,
      emerging: true,
      desc: 'Civil society organizing in new ways. New governance forms slowly emerge.',
      tunisiaEvidence: 'NSF, UGTT, and diaspora beginning to articulate alternative governance visions. Seeds being planted.',
      rriVars: ['M131 (Opposition cohesion)', 'N_DP (Diaspora protests)'],
    },
    {
      id: 1,
      label: '1\nStability',
      short: 'Stability',
      color: '#0a84ff',
      angle: 322,
      active: false,
      desc: 'Egalitarian, ecological and economic harmony. Vigor and virtue.',
      tunisiaEvidence: 'Bourguiba era (1956-1987). Education, women\'s rights, economic development.',
      rriVars: ['Historical reference only'],
    },
    {
      id: 2,
      label: '2\nEarly Growth',
      short: 'Early Growth',
      color: '#30d158',
      angle: 14,
      active: false,
      desc: 'Division of labor, resource allocation, governance solidified.',
      tunisiaEvidence: '1987-1995. Ben Ali early era. Economic opening, tourism growth.',
      rriVars: ['Historical reference only'],
    },
    {
      id: 3,
      label: '3\nProsperity',
      short: 'Prosperity',
      color: '#ffd60a',
      angle: 66,
      active: false,
      desc: 'Long period of peace and prosperity. Unity and patriotism.',
      tunisiaEvidence: '1995-2008. Peak GDP growth. Stability facade. Wealth gap grows silently.',
      rriVars: ['Historical reference only'],
    },
    {
      id: 4,
      label: '4\nOvershoot',
      short: 'Overshoot',
      color: '#ff9f0a',
      angle: 118,
      active: false,
      desc: 'Overuse of resources. Debt and inequality increase.',
      tunisiaEvidence: '2008-2010. Inflation, regional inequality, phosphate sector decline.',
      rriVars: ['A06 (Public debt)', 'A07 (Poverty rate)'],
    },
    {
      id: 5,
      label: '5\nHubris',
      short: 'Hubris',
      color: '#ff6b35',
      angle: 170,
      active: false,
      desc: 'Power concentrated. Standard of living plummets. Decadence.',
      tunisiaEvidence: '2010-2021. Ben Ali fall + transitional chaos + Saied rise.',
      rriVars: ['L121 (Authoritarian index)', 'D42 (Judicial independence)'],
    },
    {
      id: 6,
      label: '6\nTotalitarian',
      short: 'Totalitarianism',
      color: '#ff453a',
      angle: 222,
      active: true,
      desc: 'Dictatorial government, censorship, propaganda, civil uprisings.',
      tunisiaEvidence: `2021-present. Decree 54 (${data.social.decree54_charged} charged). All institutions captured. P_rev=${(rriState.p_rev*100).toFixed(1)}%.`,
      rriVars: ['L126 (Propaganda)', 'D44 (Press freedom)', 'D50 (Institutional trust)'],
    },
  ];

  // SVG wheel
  const CX = 200, CY = 200, R_OUTER = 160, R_INNER = 70;

  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  const SEGMENT_DEG = 360 / 7;

  return (
    <div className="glass p-6 rounded-2xl border border-intel-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8
        items-center">

        {/* SVG Wheel */}
        <div className="flex justify-center">
          <svg width="400" height="400" viewBox="0 0 400 400"
            className="max-w-full">

            {/* Segments */}
            {phases.map((phase, i) => {
              const startDeg = i * SEGMENT_DEG - SEGMENT_DEG / 2;
              const endDeg = startDeg + SEGMENT_DEG;
              const midDeg = (startDeg + endDeg) / 2;
              const isHovered = hoveredPhase === i;
              const isActive = phase.active;
              const isEmerging = phase.emerging;

              const outerR = isHovered ? R_OUTER + 8 : R_OUTER;
              const innerR = R_INNER;

              // Segment path
              const p1 = polarToCartesian(CX, CY, outerR, startDeg);
              const p2 = polarToCartesian(CX, CY, outerR, endDeg);
              const p3 = polarToCartesian(CX, CY, innerR, endDeg);
              const p4 = polarToCartesian(CX, CY, innerR, startDeg);
              const largeArc = SEGMENT_DEG > 180 ? 1 : 0;

              const segPath = `
                M ${p1.x} ${p1.y}
                A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}
                L ${p3.x} ${p3.y}
                A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}
                Z
              `;

              // Label position
              const labelPos = polarToCartesian(CX, CY,
                (outerR + innerR) / 2 + 5, midDeg);

              const lines = phase.label.split('\n');

              return (
                <g key={i}
                  onMouseEnter={() => setHoveredPhase(i)}
                  onMouseLeave={() => setHoveredPhase(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={segPath}
                    fill={phase.color}
                    fillOpacity={
                      isActive ? 0.35 :
                      isEmerging ? 0.2 :
                      isHovered ? 0.2 : 0.08
                    }
                    stroke={phase.color}
                    strokeWidth={isActive ? 2 : isHovered ? 1.5 : 0.5}
                    strokeOpacity={isActive ? 0.8 : isHovered ? 0.6 : 0.3}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {/* Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y - (lines.length > 1 ? 7 : 0)}
                    textAnchor="middle"
                    fill={isActive ? '#ffffff' :
                          isHovered ? phase.color : '#64748b'}
                    fontSize={isActive ? "10" : "9"}
                    fontFamily="monospace"
                    fontWeight={isActive ? "bold" : "normal"}
                    style={{ transition: 'all 0.2s' }}
                  >
                    {lines[0]}
                  </text>
                  {lines[1] && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 9}
                      textAnchor="middle"
                      fill={isActive ? '#ffffff' :
                            isHovered ? phase.color : '#64748b'}
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight={isActive ? "bold" : "normal"}
                    >
                      {lines[1]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center circle */}
            <circle cx={CX} cy={CY} r={R_INNER - 2}
              fill="#020810" stroke="#1e293b" strokeWidth="1" />

            {/* Center text */}
            <text x={CX} y={CY - 14} textAnchor="middle"
              fill="#e2e8f0" fontSize="11" fontFamily="monospace"
              fontWeight="bold">TUNISIA</text>
            <text x={CX} y={CY + 2} textAnchor="middle"
              fill="#ff453a" fontSize="10" fontFamily="monospace"
              fontWeight="bold">PHASE 6</text>
            <text x={CX} y={CY + 16} textAnchor="middle"
              fill="#475569" fontSize="8" fontFamily="monospace">
              2021 → now
            </text>

            {/* Rotation arrow */}
            <path
              d={describeArc(CX, CY, R_OUTER + 18, 30, 300)}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray="4 3"
              markerEnd="url(#arrow)"
            />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6"
                refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z"
                  fill="#1e293b" />
              </marker>
            </defs>

            {/* Active pulse ring */}
            <circle
              cx={CX} cy={CY}
              r={R_OUTER + 4}
              fill="none"
              stroke="#ff453a"
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="3 6"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${CX} ${CY}`}
                to={`360 ${CX} ${CY}`}
                dur="20s"
                repeatCount="indefinite"
              />
            </circle>

          </svg>
        </div>

        {/* Phase detail panel */}
        <div className="space-y-4">
          {(hoveredPhase !== null ? [phases[hoveredPhase]] : [phases[6]]).map(phase => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-5 rounded-2xl border space-y-4 ${
                phase.active
                  ? 'border-intel-red/30 bg-intel-red/5'
                  : phase.emerging
                  ? 'border-intel-green/30 bg-intel-green/5'
                  : 'border-intel-border bg-black/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase">Phase {phase.id}</div>
                  <div className="text-lg font-bold uppercase"
                    style={{ color: phase.color }}>
                    {phase.short}
                  </div>
                </div>
                {phase.active && (
                  <div className="text-[9px] font-mono text-intel-red
                    border border-intel-red/30 px-2 py-1 rounded
                    animate-pulse">
                    ● CURRENT PHASE
                  </div>
                )}
                {phase.emerging && (
                  <div className="text-[9px] font-mono text-intel-green
                    border border-intel-green/30 px-2 py-1 rounded">
                    SEEDS EMERGING
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase">Haupt Definition</div>
                <p className="text-[11px] text-slate-400">
                  {phase.desc}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase">Tunisia Evidence</div>
                <p className="text-[11px]"
                  style={{ color: phase.color }}>
                  {phase.tunisiaEvidence}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase">Key RRI Variables</div>
                <div className="flex flex-wrap gap-1">
                  {phase.rriVars.map(v => (
                    <span key={v} className="text-[8px] font-mono
                      px-2 py-0.5 bg-white/5 text-slate-500
                      border border-slate-800 rounded">{v}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {hoveredPhase === null && (
            <div className="text-[9px] font-mono text-slate-700
              text-center">Hover a segment to explore all phases</div>
          )}
        </div>
      </div>
    </div>
  );
};

const FreedomCycleDiagram: React.FC<{
  rriState: any; data: any
}> = ({ rriState, data }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const nodes = [
    { id: 'bondage', label: 'Bondage', angle: 270, color: '#8B1A1A',
      tunisiaActors: ['Saied regime', 'Security apparatus'],
      desc: 'Government achieves control through fear and censorship',
      rriLink: `Decree 54: ${data.social.decree54_charged} charged`,
      active: true, regime: true },
    { id: 'faith', label: 'Faith', angle: 330, color: '#30d158',
      tunisiaActors: ['UGTT base', 'Youth protest movement'],
      desc: 'Search for unity. Deep moral gatherings.',
      rriLink: `Protest events: ${data.social.protest_events_30d}/month`,
      active: false, emerging: true },
    { id: 'courage', label: 'Courage', angle: 30, color: '#30d158',
      tunisiaActors: ['UGTT leadership', 'Diaspora (Paris rallies)'],
      desc: 'People fight for freedom. Organized resistance.',
      rriLink: `UGTT: ${data.social.ugtt_mobilisation_level} mobilisation`,
      active: false, emerging: true },
    { id: 'liberty', label: 'Liberty', angle: 90, color: '#0a84ff',
      tunisiaActors: ['Post-Ben Ali 2011-2021'],
      desc: 'Prosperity and freedom achieved. Democratic experiment.',
      rriLink: 'Historical: 2011-2021 transition period',
      active: false },
    { id: 'abundance', label: 'Abundance', angle: 150, color: '#ffd60a',
      tunisiaActors: ['Bourguiba era 1970s'],
      desc: 'Focus turns to material things.',
      rriLink: 'Historical: 1970-1990 relative prosperity',
      active: false },
    { id: 'selfishness', label: 'Selfishness', angle: 180, color: '#ff9f0a',
      tunisiaActors: ['Business elite', 'Capital flight actors'],
      desc: '"It\'s all about me and my stuff"',
      rriLink: `Parallel market premium: ${data.economy.parallel_market_premium || 18}%`,
      active: false, partial: true },
    { id: 'complacency', label: 'Complacency', angle: 210, color: '#ff6b35',
      tunisiaActors: ['Silent majority'],
      desc: 'Entitlement and self-absorption.',
      rriLink: 'Arab Barometer: trust in institutions 15%',
      active: false, partial: true },
    { id: 'apathy', label: 'Apathy', angle: 240, color: '#ff453a',
      tunisiaActors: ['Youth (65% want to emigrate)'],
      desc: 'Freedom centralized. Independence controlled.',
      rriLink: `Youth emigration aspiration: 65%`,
      active: true },
    { id: 'dependence', label: 'Dependence', angle: 260, color: '#8B0000',
      tunisiaActors: ['Regime goal', 'Point of no return'],
      desc: 'Government achieves complete control.',
      rriLink: 'Target state the regime is constructing',
      active: true, regime: true, warning: true },
  ];

  const CX = 200, CY = 200, R = 150;

  const getPos = (angle: number, r = R) => ({
    x: CX + r * Math.cos((angle - 90) * Math.PI / 180),
    y: CY + r * Math.sin((angle - 90) * Math.PI / 180),
  });

  return (
    <div className="glass p-6 rounded-2xl border border-intel-border">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8
        items-center">

        {/* SVG Diagram */}
        <div className="flex justify-center">
          <svg width="400" height="400" viewBox="0 0 400 400"
            className="max-w-full">

            {/* Connection arrows */}
            {nodes.map((node, i) => {
              const next = nodes[(i + 1) % nodes.length];
              const from = getPos(node.angle);
              const to = getPos(next.angle);
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return (
                <line key={i}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={node.active || node.partial
                    ? node.color : '#1e293b'}
                  strokeWidth={node.active ? 1.5 : 0.75}
                  strokeDasharray={node.active ? 'none' : '3 3'}
                  strokeOpacity={0.5}
                  markerEnd="url(#arrowSmall)"
                />
              );
            })}

            <defs>
              <marker id="arrowSmall" markerWidth="5" markerHeight="5"
                refX="2.5" refY="2.5" orient="auto">
                <path d="M0,0 L5,2.5 L0,5 Z"
                  fill="#1e293b" />
              </marker>
            </defs>

            {/* Center label */}
            <text x={CX} y={CY - 8} textAnchor="middle"
              fill="#475569" fontSize="9" fontFamily="monospace">
              THE
            </text>
            <text x={CX} y={CY + 6} textAnchor="middle"
              fill="#475569" fontSize="9" fontFamily="monospace">
              FREEDOM
            </text>
            <text x={CX} y={CY + 20} textAnchor="middle"
              fill="#475569" fontSize="9" fontFamily="monospace">
              CYCLE
            </text>

            {/* Nodes */}
            {nodes.map(node => {
              const pos = getPos(node.angle);
              const isHovered = hoveredNode === node.id;
              const r = isHovered ? 32 : 28;

              return (
                <g key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={pos.x} cy={pos.y} r={r}
                    fill={node.color}
                    fillOpacity={
                      node.active ? 0.3 :
                      node.partial ? 0.15 : 0.06
                    }
                    stroke={node.color}
                    strokeWidth={
                      node.warning ? 2.5 :
                      node.active ? 2 :
                      isHovered ? 1.5 : 0.75
                    }
                    strokeOpacity={
                      node.active ? 0.9 : isHovered ? 0.7 : 0.3
                    }
                    style={{ transition: 'all 0.2s' }}
                  />
                  {node.warning && (
                    <circle
                      cx={pos.x} cy={pos.y} r={r + 5}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      strokeDasharray="3 4"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 ${pos.x} ${pos.y}`}
                        to={`360 ${pos.x} ${pos.y}`}
                        dur="4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <text
                    x={pos.x} y={pos.y + 4}
                    textAnchor="middle"
                    fill={node.active ? '#ffffff' :
                          node.partial ? node.color :
                          isHovered ? node.color : '#475569'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight={node.active ? "bold" : "normal"}
                    style={{ transition: 'all 0.2s' }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* "Point of no return" label */}
            {(() => {
              const warningNode = nodes.find(n => n.warning);
              if (!warningNode) return null;
              const pos = getPos(warningNode.angle - 20, R + 30);
              return (
                <text x={pos.x} y={pos.y}
                  textAnchor="middle"
                  fill="#8B0000"
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  POINT OF
                </text>
              );
            })()}
          </svg>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {/* Active nodes summary */}
          <div className="space-y-2">
            <div className="text-[9px] font-mono text-slate-500
              uppercase tracking-widest">Active Positions</div>
            {nodes.filter(n => n.active || n.partial || n.emerging)
              .map(node => (
              <div key={node.id}
                className={`p-3 rounded-xl border text-[10px]
                  space-y-1 ${
                  node.warning
                    ? 'border-intel-red/40 bg-intel-red/8'
                    : node.active
                    ? 'border-orange-900/40 bg-orange-900/5'
                    : node.emerging
                    ? 'border-intel-green/30 bg-intel-green/5'
                    : 'border-intel-border/30 bg-black/20'
                }`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div className="flex items-center
                  justify-between">
                  <span className="font-bold"
                    style={{ color: node.color }}>
                    {node.label}
                  </span>
                  {node.warning && (
                    <span className="text-[8px] font-mono
                      text-intel-red animate-pulse">
                      ⚠ DANGER ZONE
                    </span>
                  )}
                  {node.emerging && (
                    <span className="text-[8px] font-mono
                      text-intel-green">
                      ↑ EMERGING
                    </span>
                  )}
                </div>
                <div className="text-slate-500">
                  {node.tunisiaActors.join(' · ')}
                </div>
                <div className="font-mono"
                  style={{ color: node.color }}>
                  {node.rriLink}
                </div>
              </div>
            ))}
          </div>

          {hoveredNode && (() => {
            const node = nodes.find(n => n.id === hoveredNode);
            if (!node) return null;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl border border-intel-border/50
                  bg-black/40 space-y-2 text-[10px]"
              >
                <div className="font-bold text-white">{node.label}</div>
                <div className="text-slate-500">{node.desc}</div>
              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

const ConvergenceDiagram: React.FC<{
  rriState: any; data: any
}> = ({ rriState, data }) => {

  const frameworks = [
    {
      name: 'Dalio — Big Cycle',
      position: 'Revolutions & Wars Phase',
      signal: 'CRITICAL',
      color: '#ff453a',
      evidence: [
        `Financial Bust: FX ${data.economy.fx_reserves}d reserves`,
        `Printing money: Inflation ${data.economy.inflation}%`,
        'Debt restructuring: 81.2% GDP',
        'Revolution approaching: P_rev rising',
      ],
      icon: '📈',
      reference: 'Dalio (2021) — Big Cycle Stage 5',
    },
    {
      name: 'Haupt — Civilization Cycle',
      position: 'Phase 6: Totalitarianism',
      signal: 'CRITICAL',
      color: '#ff453a',
      evidence: [
        `Decree 54: ${data.social.decree54_charged} censored`,
        'Presidential constitution (2022)',
        `RSF rank 118 (-27 since 2021)`,
        'Opposition systematic dismantling',
      ],
      icon: '🔄',
      reference: 'Haupt (2022) — Phase 6/7',
    },
    {
      name: 'Freedom Cycle',
      position: 'Apathy → Dependence',
      signal: 'HIGH RISK',
      color: '#ff9f0a',
      evidence: [
        '65% youth want to emigrate',
        'Institutional trust at 15%',
        `Civil society suppressed`,
        'UGTT as last resistance node',
      ],
      icon: '🔁',
      reference: 'Classical — Tytler attribution',
    },
    {
      name: 'RRI Model — Samir Dni',
      position: `R(t) = ${rriState.rri.toFixed(4)}`,
      signal: rriState.rri >= 2.625 ? 'THRESHOLD' : 'ELEVATED',
      color: rriState.rri >= 2.625 ? '#ff453a' : '#ff9f0a',
      evidence: [
        `P_rev = ${(rriState.p_rev*100).toFixed(1)}% [${rriState.ci_low}%, ${rriState.ci_high}%]`,
        `V(t) = ${rriState.velocity > 0 ? '+' : ''}${rriState.velocity.toFixed(3)} (${rriState.velocity_label})`,
        `HPS = ${(rriState.pattern_similarity*100).toFixed(0)}% — ${rriState.pattern_label?.slice(0,25)}`,
        `${rriState.threshold_breaches?.length || 0} threshold breaches active`,
      ],
      icon: '📊',
      reference: 'Samir Dni (2025) + TUNISIAINTEL Extensions',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Four framework cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {frameworks.map((fw, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl border space-y-4"
            style={{ borderColor: `${fw.color}30`,
                     backgroundColor: `${fw.color}08` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">{fw.name}</div>
                <div className="text-sm font-bold"
                  style={{ color: fw.color }}>
                  {fw.position}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{fw.icon}</span>
                <span className="text-[8px] font-mono font-bold
                  px-2 py-0.5 rounded border"
                  style={{
                    color: fw.color,
                    borderColor: `${fw.color}40`,
                    backgroundColor: `${fw.color}15`,
                  }}>
                  {fw.signal}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {fw.evidence.map((e, j) => (
                <div key={j} className="flex items-start
                  space-x-2 text-[10px]">
                  <span style={{ color: fw.color }}>→</span>
                  <span className="text-slate-400">{e}</span>
                </div>
              ))}
            </div>

            <div className="text-[8px] font-mono text-slate-700
              border-t border-white/5 pt-2">
              {fw.reference}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Convergence summary */}
      <div className="p-6 rounded-2xl border border-intel-red/30
        bg-intel-red/5 space-y-4">
        <div className="text-[10px] font-mono text-intel-red
          uppercase tracking-widest font-bold">
          ⚠ Convergence Assessment
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 text-center">
            <div className="text-3xl font-bold font-mono
              text-intel-red">4/4</div>
            <div className="text-[9px] font-mono text-slate-500
              uppercase">Frameworks agree</div>
            <div className="text-[9px] text-slate-600">
              Pre-revolutionary / terminal decline state
            </div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-3xl font-bold font-mono
              text-intel-orange">
              {(rriState.p_rev * 100).toFixed(1)}%
            </div>
            <div className="text-[9px] font-mono text-slate-500
              uppercase">Quantified probability</div>
            <div className="text-[9px] text-slate-600">
              RRI model revolution probability
            </div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-3xl font-bold font-mono"
              style={{ color: rriState.velocity > 0.15
                ? '#ff453a' : '#ff9f0a' }}>
              {rriState.velocity_label}
            </div>
            <div className="text-[9px] font-mono text-slate-500
              uppercase">Trajectory</div>
            <div className="text-[9px] text-slate-600">
              V(t) = {rriState.velocity > 0 ? '+' : ''}
              {rriState.velocity.toFixed(3)}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-intel-red/20
          text-[10px] text-slate-500 leading-relaxed">
          Four frameworks from different intellectual traditions,
          methodologies, and centuries all independently identify
          Tunisia as being in the same critical phase.
          This convergence is not coincidence — it reflects the
          genuine structural position of the Tunisian state
          in 2026. The RRI model provides the quantitative
          precision that the theoretical frameworks lack;
          the theoretical frameworks provide the historical
          and civilizational context that the RRI model
          alone cannot supply.
        </div>
      </div>

    </div>
  );
};
