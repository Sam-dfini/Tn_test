import React from 'react';

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

interface Props {
  session?: Session;
  run?: Run;
  selectedActor?: string | null;
}

const FeedSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title, children,
}) => (
  <div>
    <div className="feed-section-title">{title}</div>
    {children}
  </div>
);

export const IntelligenceFeed: React.FC<Props> = ({
  session, run, selectedActor,
}) => (
  <div className="intelligence-feed">
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

    {selectedActor && session?.positions && (
      <FeedSection title={`${selectedActor} POSITION`}>
        {(() => {
          const pos = session.positions.find(p => p.entity_id === selectedActor);
          if (!pos) return <div className="feed-card" style={{ fontSize: 9, color: '#6B7280' }}>No position data</div>;
          return (
            <div className="actor-position-card">
              <div className="actor-position-header">
                <span className="actor-position-stance">{pos.stance || 'ANALYZING'}</span>
                <span className="actor-position-confidence">
                  {pos.confidence ? `${(pos.confidence * 100).toFixed(0)}%` : ''}
                </span>
              </div>
              {pos.reasoning && (
                <div className="actor-position-reasoning">{pos.reasoning}</div>
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

    {(!session || !run) && (
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
  </div>
);
