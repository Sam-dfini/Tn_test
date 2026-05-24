import React, { useState, useEffect } from 'react';

const CHAIN_LABELS: Record<string, string> = {
  'CHAIN-01': 'Food Subsidy → Social Unrest',
  'CHAIN-02': 'IMF Pressure → Fiscal Crisis',
  'CHAIN-03': 'Drought → Agricultural Collapse',
  'CHAIN-04': 'Protest Amplification → Regime Threat',
  'CHAIN-06': 'UGTT Strike → Economic Disruption',
  'CHAIN-09': 'Narrative Convergence → Mobilization',
  'CHAIN-11': 'Elite Fracture → Regime Instability',
};

const CHAIN_COLORS: Record<string, string> = {
  'CHAIN-01': '#F59E0B',
  'CHAIN-02': '#EF4444',
  'CHAIN-03': '#8B5CF6',
  'CHAIN-04': '#3B82F6',
  'CHAIN-06': '#10B981',
  'CHAIN-09': '#F97316',
  'CHAIN-11': '#DC2626',
};

interface Position {
  entity_id: string;
  stance?: string;
  confidence?: number;
  reasoning?: string;
}

interface Session {
  activated_chain_ids?: string[];
  positions?: Position[];
  historical_analogue?: string;
  analogue_similarity?: number;
}

interface Run {
  status?: string;
  scenario_name?: string;
  outcome_distribution?: Record<string, number>;
  p_revolution_range?: { mean?: number };
  ugtt_strike_probability?: number;
}

interface PostureData {
  actor_id: string;
  posture?: string;
  stress_level?: number;
  reasoning?: string;
}

interface Props {
  snapshot: any;
  session: SessionData | null;
  run: any;
  selectedActor?: string | null;
  onClose?: () => void;
}

const FeedSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title, children,
}) => (
  <div>
    <div className="feed-section-title">{title}</div>
    {children}
  </div>
);

const POSTURE_COLORS: Record<string, string> = {
  passive: '#4A5568',
  defensive: '#D97706',
  aggressive: '#DC2626',
  negotiating: '#2563EB',
  collapsing: '#7C3AED',
};

const GAME_THEORY_OPTIONS: Record<string, { strategy: string; payoff: string; risk: string }[]> = {
  aggressive: [
    { strategy: 'Escalate — general strike / mass protest', payoff: 'Max leverage against regime, but depletes strike fund', risk: 'High' },
    { strategy: 'Selective pressure — targeted sectoral strikes', payoff: 'Sustained pressure without exhausting base', risk: 'Medium' },
    { strategy: 'Negotiate — enter conditional dialogue', payoff: 'Wins concessions if regime is vulnerable', risk: 'Medium' },
    { strategy: 'Defect — unilateral concession', payoff: 'Short-term stability, long-term credibility loss', risk: 'Low' },
  ],
  defensive: [
    { strategy: 'Hold — maintain current position', payoff: 'Preserves optionality, avoids overcommitment', risk: 'Low' },
    { strategy: 'Concede — partial policy adjustment', payoff: 'Reduces immediate pressure, may embolden opponents', risk: 'Medium' },
    { strategy: 'Consolidate — shore up coalition allies', payoff: 'Strengthens bargaining position', risk: 'Low' },
    { strategy: 'Preempt — announce reform before demand', payoff: 'Controls narrative, splits opposition', risk: 'Medium' },
  ],
  negotiating: [
    { strategy: 'Engage — open formal negotiations', payoff: 'Potential win-win if双方 have aligned incentives', risk: 'Low' },
    { strategy: 'Delay — extend talks, gather intelligence', payoff: 'Improves information asymmetry', risk: 'Low' },
    { strategy: 'Linkage — connect issues across domains', payoff: 'Creates larger bargaining surface for trade-offs', risk: 'Medium' },
    { strategy: 'Walk away — suspend talks', payoff: 'Signals strength if outside option is credible', risk: 'High' },
  ],
  passive: [
    { strategy: 'Monitor — observe without intervening', payoff: 'Conserves resources, maintains neutrality', risk: 'Low' },
    { strategy: 'Signal — subtle posture shift', payoff: 'Tests reactions without commitment', risk: 'Low' },
    { strategy: 'Align — join emerging coalition', payoff: 'Gains influence if coalition wins', risk: 'Medium' },
    { strategy: 'Preempt — act before forced', payoff: 'Controls timing but may provoke', risk: 'High' },
  ],
  collapsing: [
    { strategy: 'Surrender — accept terms', payoff: 'Stops losses, may retain remnant influence', risk: 'Low' },
    { strategy: 'Last stand — maximal resistance', payoff: 'Low probability of reversal, high legacy cost', risk: 'High' },
    { strategy: 'Fission — break into factions', payoff: 'Preserves partial influence via splinter', risk: 'High' },
    { strategy: 'External appeal — call intl. intervention', payoff: 'Introduces new actor, changes game', risk: 'Medium' },
  ],
  analyzing: [
    { strategy: 'Gather intelligence — expand monitoring', payoff: 'Reduces uncertainty', risk: 'Low' },
    { strategy: 'Scenario plan — model outcomes', payoff: 'Prepares response playbook', risk: 'Low' },
    { strategy: 'Stakeholder map — identify allies/opponents', payoff: 'Clarifies coalition landscape', risk: 'Low' },
    { strategy: 'Red team — simulate adversary moves', payoff: 'Anticipates counter-strategies', risk: 'Low' },
  ],
};

function generateBriefing(actorId: string, posture: string, reasoning: string): string {
  const options = GAME_THEORY_OPTIONS[posture] || GAME_THEORY_OPTIONS.analyzing;
  const rec = options[0];
  return `${actorId} is currently ${posture.toUpperCase()} based on: ${reasoning}

Game theory analysis suggests ${actorId}'s optimal strategy is to "${rec.strategy.toLowerCase()}". This carries ${rec.risk.toLowerCase()} risk with a payoff of: ${rec.payoff.toLowerCase()}.

Alternative moves:
${options.slice(1).map((o, i) => `  ${i + 1}. ${o.strategy} (${o.risk} risk) — ${o.payoff}`).join('\n')}

The equilibrium outcome depends on how counterparties (PRES, UGTT, ARM) respond to ${actorId}'s chosen signal. Current RRI conditions favor a ${posture === 'aggressive' ? 'hawkish' : posture === 'passive' ? 'dovish' : 'mixed'} strategy.`;
}

export const IntelligenceFeed: React.FC<Props> = ({
  snapshot, session, run, selectedActor, onClose,
}) => {
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  useEffect(() => {
    setBriefingText(null);
    setBriefingLoading(false);
  }, [selectedActor]);

  const fallbackPosture = selectedActor && snapshot?.actor_postures?.find(p => p.actor_id === selectedActor);

  const handleGenerateBriefing = () => {
    if (!selectedActor || !fallbackPosture) return;
    setBriefingLoading(true);
    setBriefingText(null);
    setTimeout(() => {
      const posture = fallbackPosture.posture || 'analyzing';
      const reasoning = fallbackPosture.reasoning || 'No contextual data available';
      setBriefingText(generateBriefing(selectedActor, posture, reasoning));
      setBriefingLoading(false);
    }, 800);
  };

  return (
  <div className="intelligence-feed">
    <div className="feed-close-bar">
      <span className="feed-close-title">
        {selectedActor ? `${selectedActor} INTELLIGENCE` : 'INTELLIGENCE FEED'}
      </span>
      <button className="feed-close-btn" onClick={onClose}>
        ◀ CLOSE
      </button>
    </div>
    <div className="feed-inner">
    {session?.activated_chain_ids && session.activated_chain_ids.length > 0 && (
      <FeedSection title="ACTIVE CHAINS">
        {session.activated_chain_ids.map(chainId => (
          <div
            key={chainId}
            className="chain-card"
            style={{ borderLeftColor: CHAIN_COLORS[chainId] || '#6B7280' }}
          >
            <span style={{ color: CHAIN_COLORS[chainId] || '#6B7280', fontSize: 10, fontWeight: 'bold' }}>
              {chainId}
            </span>
            <span className="chain-card-name">{CHAIN_LABELS[chainId] || chainId}</span>
          </div>
        ))}
      </FeedSection>
    )}

    {selectedActor && (session?.positions || fallbackPosture) && (
      <FeedSection title={`${selectedActor} POSITION`}>
        {(() => {
          const pos = session?.positions?.find(p => p.entity_id === selectedActor) ?? fallbackPosture;
          if (!pos) return <div className="feed-card" style={{ fontSize: 9, color: '#6B7280' }}>No position data</div>;
          const stance = (pos as any).stance ?? (pos as PostureData).posture ?? 'ANALYZING';
          const confidence = (pos as any).confidence;
          return (
            <div className="actor-position-card">
              <div className="actor-position-header">
                <span className="actor-position-stance" style={{ color: POSTURE_COLORS[stance] || '#6B7280' }}>
                  {stance.toUpperCase()}
                </span>
                <span className="actor-position-confidence">
                  {confidence ? `${(confidence * 100).toFixed(0)}%` : ''}
                </span>
              </div>
              {(pos as any).reasoning && (
                <div className="actor-position-reasoning">{(pos as any).reasoning}</div>
              )}
              {'stress_level' in pos && (
                <div className="stress-bar" style={{ marginTop: 8 }}>
                  <div className="stress-fill" style={{
                    width: `${((pos as PostureData).stress_level ?? 0) * 100}%`,
                    background: POSTURE_COLORS[stance] || '#4A5568',
                  }} />
                </div>
              )}

              <button
                className="ai-briefing-btn"
                onClick={handleGenerateBriefing}
                disabled={briefingLoading}
              >
                {briefingLoading ? 'GENERATING...' : 'GENERATE AI BRIEFING'}
              </button>

              {briefingText && (
                <div className="briefing-box">
                  {briefingText}
                </div>
              )}

              {briefingText && handleGenerateBriefing && (
                <div className="game-theory-section">
                  <div className="game-theory-header">GAME THEORY OPTIONS</div>
                  {(() => {
                    const posture = (pos as PostureData).posture || 'analyzing';
                    const options = GAME_THEORY_OPTIONS[posture] || GAME_THEORY_OPTIONS.analyzing;
                    return options.map((opt, i) => (
                      <div key={i} className="game-theory-option">
                        <span className="game-theory-risk-dot" style={{
                          background: opt.risk === 'High' ? '#DC2626' : opt.risk === 'Medium' ? '#F59E0B' : '#10B981',
                        }} />
                        <div style={{ flex: 1 }}>
                          <div className="game-theory-strategy">{opt.strategy}</div>
                          <div className="game-theory-payoff">{opt.payoff}</div>
                        </div>
                        <span className="game-theory-risk">{opt.risk}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          );
        })()}
      </FeedSection>
    )}

    {run && run.status === 'complete' && (
      <FeedSection title="SIMULATION OUTPUT">
        <div className="simulation-card">
          <div className="simulation-scenario">{run.scenario_name}</div>
          <div className="simulation-prob">
            P(Rev): {((run.p_revolution_range?.mean ?? 0) * 100).toFixed(0)}%
            {' · '}
            UGTT Strike: {((run.ugtt_strike_probability ?? 0) * 100).toFixed(0)}%
          </div>
          {run.outcome_distribution && (
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Object.entries(run.outcome_distribution)
                .filter(([, v]) => (v as number) > 0)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([phase, prob]) => (
                  <span key={phase} style={{
                    fontSize: 8,
                    padding: '1px 4px',
                    borderRadius: 2,
                    background: 'rgba(124,58,237,0.15)',
                    color: '#A78BFA',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {phase}: {((prob as number) * 100).toFixed(0)}%
                  </span>
                ))}
            </div>
          )}
        </div>
      </FeedSection>
    )}

    {session?.historical_analogue && (
      <FeedSection title="HISTORICAL ANALOGUE">
        <div className="analogue-badge">
          <div className="analogue-event">{session.historical_analogue}</div>
          <div className="analogue-similarity">
            {((session.analogue_similarity ?? 0) * 100).toFixed(0)}% similarity
          </div>
        </div>
      </FeedSection>
    )}

    {!session && !run && !selectedActor && (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, color: '#4B5563', fontSize: 10,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
          ?
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
          Select an actor to view their position, or run a simulation
        </div>
      </div>
    )}
    </div>{/* .feed-inner */}
  </div>
  );
};
