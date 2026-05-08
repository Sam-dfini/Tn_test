import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { generateAnalystResponse } from '../../services/geminiService';
import { RRIVariable } from '../../types/intel';
import { simulateScenario } from '../../math/rri/engine';
import { motion, AnimatePresence } from 'motion/react';
import { generateStableKey, prepareList } from '../../lib/keyUtils';
import './ScenarioCompare.css';

interface Scenario {
  id: string;
  name: string;
  desc: string;
  color: string;
  overrides: Record<string, number>;
  custom?: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    name: 'Baseline',
    desc: 'Current trajectory — no major shocks',
    color: '#00d4ff',
    overrides: {},
  },
  {
    id: 'imf_collapse',
    name: 'IMF Collapses',
    desc: 'IMF negotiations fail. FX falls to 60 days. Rating cut.',
    color: '#ff2d55',
    overrides: { 'J188': 60, 'A1': 9.5, 'A2': 42.0, 'E51': 18, 'D41': 0.85 },
  },
  {
    id: 'imf_deal',
    name: 'IMF Deal',
    desc: '$2B IMF deal secured. Markets stabilise. Subsidies reform.',
    color: '#2fd158',
    overrides: { 'J188': 115, 'A1': 6.2, 'A2': 35.5, 'E51': 10, 'D41': 0.55 },
  },
  {
    id: 'social_explosion',
    name: 'Social Explosion',
    desc: 'CPG + UGTT + water protests converge. Cross-gov cascade.',
    color: '#ff9f0a',
    overrides: { 'E51': 28, 'N155': 0.45, 'M133': 0.82, 'A2': 45.0, 'A1': 10.2 },
  },
  {
    id: 'military_intervention',
    name: 'Military Backstop',
    desc: 'Armed forces back Saied. Crackdown. Opposition silenced.',
    color: '#bf5af2',
    overrides: { 'W': 0.92, 'N155': 0.88, 'M133': 0.32, 'E51': 8, 'D41': 0.30 },
  },
];

export const ScenarioCompare: React.FC<{ variables?: RRIVariable[] }> = ({ variables }) => {
  const { rriState } = useRiskMetrics();
  const [selectedIds, setSelectedIds] = useState<string[]>(['baseline', 'imf_collapse', 'imf_deal']);
  const [results, setResults] = useState<any[]>([]);
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleToggleScenario = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 3) return prev;
        return [...prev, id];
      }
    });
  };

  const computeScenario = useCallback((scenario: Scenario) => {
    if (!variables) return null;
    
    // Use the robust engine calculation
    const engineState = simulateScenario(variables, scenario.overrides);
    
    // Calculate secondary metrics based on RRI and P_rev
    const rri = isNaN(engineState.rri) ? 0 : engineState.rri;
    const prev = isNaN(engineState.prev) ? 0 : Math.round(engineState.prev * 100);
    
    const W = isNaN(scenario.overrides['W']) ? 0.72 : (scenario.overrides['W'] ?? 0.72);
    
    // Use components of RRI to estimate social dynamics
    const E51 = scenario.overrides['E51'] ?? variables.find(v => v.id === 'E51' || v.id === 'M202')?.value ?? 0.45;
    const A2 = scenario.overrides['A2'] ?? variables.find(v => v.id === 'A2' || v.id === 'A2')?.value ?? 8.5;
    
    // Normalized estimates for UI visualization
    const protest = Math.min(97, Math.round((E51 * 0.4 + (A2 / 15) * 0.3 + (1 - W) * 0.3) * 100));
    const collapse = Math.min(99, Math.round(prev * 1.1 + (1 - W) * 10));
    const strike = Math.min(95, Math.round((E51 * 0.5 + (A2 / 20) * 0.2 + (1 - W) * 0.3) * 100));
    
    const delta = rri - (rriState?.rri || 0);

    return {
      scenario,
      rri: rri.toFixed(2),
      prev,
      W: W.toFixed(2),
      protest: isNaN(protest) ? 0 : protest,
      collapse: isNaN(collapse) ? 0 : collapse,
      strike: isNaN(strike) ? 0 : strike,
      delta: isNaN(delta) ? "0.00" : delta.toFixed(2),
      deltaSign: delta > 0 ? '+' : '',
    };
  }, [variables, rriState.rri]);

  const handleRun = useCallback(() => {
    const selected = SCENARIOS.filter(s => selectedIds.includes(s.id));
    if (!selected.length) return;
    
    const newResults = selected.map(s => computeScenario(s)).filter(Boolean);
    setResults(newResults);
    generateAiSynthesis(newResults as any[]);
  }, [selectedIds, computeScenario]);

  const generateAiSynthesis = async (res: any[]) => {
    if (!res.length) return;
    setIsSynthesizing(true);
    setAiSynthesis(null);
    
    const prompt = `You are a senior political analyst for Tunisia. Analyze these scenario comparison results from the TUNISIAINTEL RRI model (threshold R(t) >= 2.31 = instability).

SCENARIOS:
${res.map(r => `
${r.scenario.name.toUpperCase()} — ${r.scenario.desc}
• R(t): ${r.rri} (Δ${r.deltaSign}${r.delta} from live baseline)
• P_rev: ${r.prev}% | Protest P(30d): ${r.protest}% | Collapse P(30d): ${r.collapse}% | Strike P(30d): ${r.strike}%
• W(t): ${r.W}`).join('\n')}

Based on EQ.1–14 dynamics, write a concise 3-paragraph intelligence assessment:
1. Which scenario poses greatest near-term risk and why
2. Key variable drivers of divergence between scenarios
3. Policy recommendation for the most likely outcome

Direct, analytical, specific. No hedging. Under 200 words.`;

    try {
      const response = await generateAnalystResponse(prompt);
      setAiSynthesis(response);
    } catch (error) {
      console.error("Failed to generate AI synthesis", error);
      setAiSynthesis("AI synthesis unavailable. Please check your connection or API key.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Auto-run on mount or when selection/variables change
  useEffect(() => {
    if (variables && variables.length > 0) {
      handleRun();
    }
  }, [selectedIds, variables, handleRun]);

  const cols = results.length;
  const metrics = [
    { key: 'rri', label: 'R(t) INDEX', fmt: (v: any) => v, better: 'low' },
    { key: 'prev', label: 'P_rev %', fmt: (v: any) => v + '%', better: 'low' },
    { key: 'protest', label: 'PROTEST P(30d)', fmt: (v: any) => v + '%', better: 'low' },
    { key: 'collapse', label: 'COLLAPSE P(30d)', fmt: (v: any) => v + '%', better: 'low' },
    { key: 'strike', label: 'STRIKE P(30d)', fmt: (v: any) => v + '%', better: 'low' },
    { key: 'W', label: 'W(t) SUPPRESSOR', fmt: (v: any) => v, better: 'high' },
  ];

  const best: Record<string, number> = {};
  const worst: Record<string, number> = {};
  
  if (results.length > 0) {
    for (const m of metrics) {
      const vals = results.map(r => parseFloat(r[m.key]));
      best[m.key] = m.better === 'low' ? Math.min(...vals) : Math.max(...vals);
      worst[m.key] = m.better === 'low' ? Math.max(...vals) : Math.min(...vals);
    }
  }

  return (
    <div className="sc-page">
      {/* Header */}
      <div className="sc-page-hdr">
        <div className="sc-page-hdr-left">
          <span className="sc-page-icon">◈</span>
          <span className="sc-page-title">SCENARIO COMPARISON ENGINE</span>
          <span className="sc-page-tag">RRI · EQ.1–14</span>
        </div>
        <div className="sc-page-hdr-right">
          <span className="sc-page-meta">Baseline: R(t)={rriState.rri.toFixed(2)} · P_rev={Math.round(rriState.p_rev * 100)}%</span>
          <button onClick={handleRun} className="sc-run-btn">▶ RUN</button>
        </div>
      </div>

      {/* Selector bar */}
      <div className="sc-selector-bar">
        <span className="sc-selector-label">SELECT UP TO 3:</span>
        <div className="sc-pills">
          {prepareList(SCENARIOS).map((s: any, i: number) => (
            <label key={generateStableKey(s.id, i, 'scen-pill')} className="sc-pill" style={{ '--pc': s.color } as React.CSSProperties}>
              <input 
                type="checkbox" 
                className="sc-pill-check" 
                value={s.id}
                checked={selectedIds.includes(s.id)}
                onChange={() => handleToggleScenario(s.id)}
              />
              <span className="sc-pill-name">{s.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Results area */}
      <div className="sc-page-body">
        <AnimatePresence mode="wait">
          {results.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sc-loading"
            >
              Click ▶ RUN to compute scenarios
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Scenario header cards */}
              <div className="sc-cards" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {prepareList(results).map((r: any, rIdx: number) => (
                  <motion.div 
                    key={generateStableKey(r, rIdx, 'scen-card')} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: rIdx * 0.1 }}
                    className="sc-card" 
                    style={{ '--cc': r.scenario.color } as React.CSSProperties}
                  >
                    <div className="sc-card-name">{r.scenario.name.toUpperCase()}</div>
                    <div className="sc-card-desc">{r.scenario.desc}</div>
                    <div className="sc-card-rri" style={{ color: parseFloat(r.rri) >= 2.31 ? '#ef4444' : '#22c55e' }}>
                      {r.rri}
                    </div>
                    <div className="sc-card-delta" style={{ color: parseFloat(r.delta) > 0 ? '#ef4444' : parseFloat(r.delta) < 0 ? '#22c55e' : '#94a3b8' }}>
                      Δ {r.deltaSign}{r.delta} from live
                    </div>
                  </motion.div>
                ))}
              </div>

            {/* Metric table */}
            <div className="sc-table">
              <div className="sc-table-head" style={{ gridTemplateColumns: `130px repeat(${cols}, 1fr)` }}>
                <div className="sc-th">METRIC</div>
                {prepareList(results).map((r: any, rIdx: number) => (
                  <div key={generateStableKey(r, rIdx, 'th')} className="sc-th" style={{ color: r.scenario.color }}>
                    {r.scenario.name}
                  </div>
                ))}
              </div>
              {prepareList(metrics).map((m: any, mIdx: number) => (
                <div key={generateStableKey(m, mIdx, 'metric-row')} className="sc-table-row" style={{ gridTemplateColumns: `130px repeat(${cols}, 1fr)` }}>
                  <div className="sc-td sc-td-label">{m.label}</div>
                  {prepareList(results).map((r: any, rIdx: number) => {
                    const val = parseFloat(r[m.key]);
                    const isBest = val === best[m.key];
                    const isWorst = val === worst[m.key] && cols > 1;
                    const col = isBest ? '#22c55e' : isWorst ? '#ef4444' : '#e2e8f0';
                    return (
                      <div key={generateStableKey(r, rIdx, 'td')} className="sc-td" style={{ color: col, fontWeight: isBest || isWorst ? 700 : 400 }}>
                        {m.fmt(r[m.key])} {isBest ? '▲' : isWorst ? '▼' : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Bar charts */}
            <div className="sc-bars">
              <div className="sc-bars-title">VISUAL COMPARISON</div>
              {prepareList(['prev', 'protest', 'collapse']).map((key: any, kIdx: number) => {
                const label = { prev: 'P_rev (%)', protest: 'Protest P(30d)', collapse: 'Collapse P(30d)' }[key as keyof typeof best];
                return (
                  <div key={generateStableKey(key, kIdx, 'bar-group')} className="sc-bar-group">
                    <div className="sc-bar-label">{label}</div>
                    {prepareList(results).map((r: any, rIdx: number) => {
                      const val = parseInt(r[key]);
                      return (
                        <div key={generateStableKey(r, rIdx, 'bar-row')} className="sc-bar-row">
                          <div className="sc-bar-name" style={{ color: r.scenario.color }}>{r.scenario.name}</div>
                          <div className="sc-bar-track">
                            <div className="sc-bar-fill" style={{ width: `${val}%`, background: r.scenario.color }}></div>
                          </div>
                          <div className="sc-bar-val" style={{ color: r.scenario.color }}>{val}%</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Variable overrides summary */}
            <div className="sc-overrides">
              <div className="sc-overrides-title">VARIABLE OVERRIDES APPLIED</div>
              <div className="sc-overrides-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {prepareList(results).map((r: any, rIdx: number) => (
                  <div key={generateStableKey(r, rIdx, 'override-card')} className="sc-override-col" style={{ borderTop: `2px solid ${r.scenario.color}` }}>
                    <div className="sc-override-head" style={{ color: r.scenario.color }}>{r.scenario.name}</div>
                    {Object.keys(r.scenario.overrides).length ? (
                      Object.entries(r.scenario.overrides).map(([id, val]: any, vIdx: number) => (
                        <div key={generateStableKey(id, vIdx, 'override-row')} className="sc-override-row">
                          <span className="sc-override-id">{id}</span>
                          <span className="sc-override-val">{val as number}</span>
                        </div>
                      ))
                    ) : (
                      <div className="sc-override-none">Live values unchanged</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footnote */}
            <div className="sc-footnote">
              Computed by re-running EQ.1 with scenario overrides against live variable values.
              Baseline: R(t)={rriState.rri.toFixed(2)} · P_rev={Math.round(rriState.p_rev * 100)}%.
              ▲ best · ▼ worst in comparison.
            </div>

            {/* AI synthesis */}
            <div className="sc-ai-section">
              <div className="sc-ai-title">◈ AI SCENARIO SYNTHESIS</div>
              <div className="sc-ai-body">
                {isSynthesizing ? (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Generating analysis…</span>
                ) : aiSynthesis ? (
                  aiSynthesis.split('\n\n').filter(Boolean).map((p, i) => (
                    <p key={generateStableKey(p, i, 'ai-para')} className="sc-ai-para">{p.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
                  ))
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
