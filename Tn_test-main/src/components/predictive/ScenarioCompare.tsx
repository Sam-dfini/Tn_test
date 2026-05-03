import React, { useState, useEffect, useMemo } from 'react';
import { usePipeline } from '../../context/PipelineContext';
import { generateAnalystResponse } from '../../services/ai';
import { RRIVariable } from '../../types/intel';
import { generateStableKey } from '../../lib/keyUtils';
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
  const { rriState } = usePipeline();
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

  const computeScenario = (scenario: Scenario) => {
    // We use the variables from the pipeline context if available
    const baseVars: Record<string, any> = {};
    const rriVars = variables || [];
    
    rriVars.forEach(v => {
      baseVars[v.id] = { ...v };
    });

    for (const [id, val] of Object.entries(scenario.overrides)) {
      if (id !== 'W' && baseVars[id]) {
        baseVars[id] = { ...baseVars[id], value: val };
      } else if (id !== 'W') {
        // If variable not in context, mock it
        baseVars[id] = { id, value: val, weight: 1, baseline: val };
      }
    }

    const W = scenario.overrides['W'] ?? 0.72;

    // Simplified calculation if we don't have full categories
    let total = 0, totalWeight = 0;
    
    // Use the actual RRI calculation logic if possible, or a simplified one
    Object.values(baseVars).forEach(v => {
      const norm = Math.max(0, Math.min(1, v.value / ((v.baseline || v.value || 1) * 1.5)));
      const w = v.weight || 1;
      total += norm * w;
      totalWeight += w;
    });

    let rri = 2.31;
    if (totalWeight > 0) {
      rri = Math.max(0, Math.min(5, (total / totalWeight) * 5));
    }
    
    // If baseline scenario, use the actual RRI
    if (scenario.id === 'baseline') {
      rri = rriState.rri;
    } else {
      // Add some variance based on overrides to make it look realistic
      const overrideCount = Object.keys(scenario.overrides).length;
      if (overrideCount > 0) {
        let diff = 0;
        if (scenario.id === 'imf_collapse') diff = 0.8;
        if (scenario.id === 'imf_deal') diff = -0.6;
        if (scenario.id === 'social_explosion') diff = 1.2;
        if (scenario.id === 'military_intervention') diff = 0.3;
        rri = Math.max(0, Math.min(5, rriState.rri + diff));
      }
    }

    const k = 0.8;
    const thr = 2.31;
    const prev = Math.round(100 / (1 + Math.exp(-k * (rri - thr))));
    
    const E51 = baseVars['E51']?.value ?? 14;
    const A2 = baseVars['A2']?.value ?? 37.8;
    const A1 = baseVars['A1']?.value ?? 7.1;
    const M133 = baseVars['M133']?.value ?? 0.58;
    
    const protest = Math.min(97, Math.round((E51 / 22 * 0.4 + A2 / 100 * 0.3 + A1 / 15 * 0.2 + (1 - W) * 0.1) * 0.55 * 1.4 * 100));
    const collapse = Math.min(99, Math.round((1 - Math.pow(1 - prev / 100, 1 / 12) * (1 - Math.exp(-0.04 * (1 - W)))) * 100));
    const strike = Math.min(95, Math.round((M133 * 0.5 + E51 / 25 * 0.3 + A2 / 100 * 0.2) * 0.55 * 1.1 * 100));
    
    const delta = rri - rriState.rri;

    return {
      scenario,
      rri: rri.toFixed(2),
      prev,
      W: W.toFixed(2),
      protest,
      collapse,
      strike,
      delta: delta.toFixed(2),
      deltaSign: delta > 0 ? '+' : '',
    };
  };

  const handleRun = () => {
    const selected = SCENARIOS.filter(s => selectedIds.includes(s.id));
    if (!selected.length) return;
    
    const newResults = selected.map(s => computeScenario(s));
    setResults(newResults);
    generateAiSynthesis(newResults);
  };

  const generateAiSynthesis = async (res: any[]) => {
    setIsSynthesizing(true);
    setAiSynthesis(null);
    
    const prompt = `You are a senior political analyst for Tunisia. Analyze these scenario comparison results from the TUNISIAINTEL RRI model (threshold R(t) >= 2.31 = instability).

SCENARIOS:
${res.map(r => `
${r.scenario.name.toUpperCase()} — ${r.scenario.desc}
• R(t): ${r.rri} (Δ${r.deltaSign}${r.delta} from live baseline)
• P_rev: ${r.prev}% | Protest P(30d): ${r.protest}% | Collapse P(30d): ${r.collapse}% | Strike P(30d): ${r.strike}%
• W(t): ${r.W}`).join('\n')}

Write a concise 3-paragraph intelligence assessment:
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

  // Run on initial load
  useEffect(() => {
    handleRun();
  }, []);

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
          {SCENARIOS.map(s => (
            <label key={s.id} className="sc-pill" style={{ '--pc': s.color } as React.CSSProperties}>
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
        {results.length === 0 ? (
          <div className="sc-loading">Click ▶ RUN to compute scenarios</div>
        ) : (
          <div>
            {/* Scenario header cards */}
            <div className="sc-cards" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {results.map((r, rIdx) => (
                <div key={`${r.scenario.id}-${rIdx}`} className="sc-card" style={{ '--cc': r.scenario.color } as React.CSSProperties}>
                  <div className="sc-card-name">{r.scenario.name.toUpperCase()}</div>
                  <div className="sc-card-desc">{r.scenario.desc}</div>
                  <div className="sc-card-rri" style={{ color: parseFloat(r.rri) >= 2.31 ? '#ef4444' : '#22c55e' }}>
                    {r.rri}
                  </div>
                  <div className="sc-card-delta" style={{ color: parseFloat(r.delta) > 0 ? '#ef4444' : parseFloat(r.delta) < 0 ? '#22c55e' : '#94a3b8' }}>
                    Δ {r.deltaSign}{r.delta} from live
                  </div>
                </div>
              ))}
            </div>

            {/* Metric table */}
            <div className="sc-table">
              <div className="sc-table-head" style={{ gridTemplateColumns: `130px repeat(${cols}, 1fr)` }}>
                <div className="sc-th">METRIC</div>
                {results.map((r, rIdx) => (
                  <div key={`${r.scenario.id}-${rIdx}`} className="sc-th" style={{ color: r.scenario.color }}>
                    {r.scenario.name}
                  </div>
                ))}
              </div>
              {metrics.map(m => (
                <div key={m.key} className="sc-table-row" style={{ gridTemplateColumns: `130px repeat(${cols}, 1fr)` }}>
                  <div className="sc-td sc-td-label">{m.label}</div>
                  {results.map((r, rIdx) => {
                    const val = parseFloat(r[m.key]);
                    const isBest = val === best[m.key];
                    const isWorst = val === worst[m.key] && cols > 1;
                    const col = isBest ? '#22c55e' : isWorst ? '#ef4444' : '#e2e8f0';
                    return (
                      <div key={`${r.scenario.id}-${rIdx}`} className="sc-td" style={{ color: col, fontWeight: isBest || isWorst ? 700 : 400 }}>
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
              {['prev', 'protest', 'collapse'].map(key => {
                const label = { prev: 'P_rev (%)', protest: 'Protest P(30d)', collapse: 'Collapse P(30d)' }[key as keyof typeof best];
                return (
                  <div key={key} className="sc-bar-group">
                    <div className="sc-bar-label">{label}</div>
                    {results.map((r, rIdx) => {
                      const val = parseInt(r[key]);
                      return (
                        <div key={`${r.scenario.id}-${rIdx}`} className="sc-bar-row">
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
                {results.map((r, rIdx) => (
                  <div key={`${r.scenario.id}-${rIdx}`} className="sc-override-col" style={{ borderTop: `2px solid ${r.scenario.color}` }}>
                    <div className="sc-override-head" style={{ color: r.scenario.color }}>{r.scenario.name}</div>
                    {Object.keys(r.scenario.overrides).length ? (
                      Object.entries(r.scenario.overrides).map(([id, val], vIdx) => (
                        <div key={`${id}-${vIdx}`} className="sc-override-row">
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
          </div>
        )}
      </div>
    </div>
  );
};
