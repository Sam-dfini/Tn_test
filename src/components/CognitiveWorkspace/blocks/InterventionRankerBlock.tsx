import React from 'react';

interface RankedIntervention {
  rank: number;
  intervention_id: string;
  intervention_name: string;
  category: string;
  efficiency_score: number;
  p_revolution_delta: number;
  rri_delta: number;
  political_cost: number;
  economic_cost: number;
  social_cost: number;
  time_to_effect_days: number;
  reversibility: number;
  actor_support: string[];
  actor_opposition: string[];
  veto_risk: boolean;
  veto_actor?: string;
  historical_success_rate: number;
  confidence: number;
  warning?: string;
  requires_imf_approval?: boolean;
  requires_ugtt_consent?: boolean;
}

interface Props {
  parameters?: {
    target_outcome?: string;
    ranked_interventions?: RankedIntervention[];
    top_recommendation?: string;
    recommendation_narrative?: string;
    baseline_p_revolution?: number;
    baseline_rri?: number;
    recommendation_confidence?: number;
  };
  data?: any;
  confidence?: number;
}

const CATEGORY_COLOR: Record<string, string> = {
  economic: '#F59E0B',
  diplomatic: '#3B82F6',
  security: '#EF4444',
  informational: '#8B5CF6',
  political: '#10B981',
  social: '#06B6D4',
};

const CostBar: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', width: 30, letterSpacing: '0.05em' }}>{label}</span>
    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
      <div style={{ width: `${Math.round(value * 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
    <span style={{ fontSize: 8, color, fontWeight: 'bold', width: 24, textAlign: 'right' }}>
      {Math.round(value * 100)}
    </span>
  </div>
);

export const InterventionRankerBlock: React.FC<Props> = ({ parameters }) => {
  const p = parameters || {};
  const ranked = p.ranked_interventions || [];

  if (ranked.length === 0) {
    return (
      <div className="block-content">
        <div className="block-section-title">Intervention Efficiency Ranker</div>
        <div className="block-subtitle">No interventions ranked. Submit a query with intent "what should we do" to activate.</div>
      </div>
    );
  }

  const top = ranked[0];

  return (
    <div className="block-content" style={{ gap: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <div className="block-section-title" style={{ marginBottom: 0 }}>
          {p.target_outcome?.replace(/_/g, ' ').toUpperCase() || 'INTERVENTION ANALYSIS'}
        </div>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>
          baseline P(rev): {p.baseline_p_revolution != null ? `${(p.baseline_p_revolution * 100).toFixed(1)}%` : 'N/A'}
        </span>
      </div>

      {/* Recommendation narrative */}
      {p.recommendation_narrative && (
        <div style={{ padding: '6px 8px', background: 'rgba(16,185,129,0.06)', borderLeft: '2px solid #10B981', borderRadius: 3, marginBottom: 4 }}>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0, fontFamily: 'Georgia, serif' }}>
            {p.recommendation_narrative}
          </p>
        </div>
      )}

      {/* Ranked list */}
      {ranked.slice(0, 4).map((intv, i) => {
        const catColor = CATEGORY_COLOR[intv.category] || '#9CA3AF';
        const isTop = i === 0;
        const deltaGood = intv.p_revolution_delta < 0;

        return (
          <div key={intv.intervention_id} style={{
            padding: '6px 8px',
            background: isTop ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.015)',
            border: `1px solid ${isTop ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 4,
          }}>
            {/* Row 1: rank + name + category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 9, fontWeight: 'bold',
                color: isTop ? '#10B981' : 'rgba(255,255,255,0.3)',
                width: 14, textAlign: 'center',
              }}>
                {isTop ? '★' : `#${intv.rank}`}
              </span>
              <span style={{ flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: isTop ? 'bold' : 'normal', lineHeight: 1.3 }}>
                {intv.intervention_name}
              </span>
              <span style={{ fontSize: 7, padding: '1px 5px', background: `${catColor}22`, border: `1px solid ${catColor}55`, borderRadius: 2, color: catColor, letterSpacing: '0.1em' }}>
                {intv.category.toUpperCase()}
              </span>
            </div>

            {/* Row 2: key metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginBottom: 4 }}>
              <div style={{ fontSize: 8, textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>EFFICIENCY</div>
                <div style={{ color: intv.efficiency_score > 0.5 ? '#10B981' : '#F59E0B', fontWeight: 'bold' }}>
                  {intv.efficiency_score.toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: 8, textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>ΔP(rev)</div>
                <div style={{ color: deltaGood ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                  {intv.p_revolution_delta > 0 ? '+' : ''}{(intv.p_revolution_delta * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ fontSize: 8, textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>TIME</div>
                <div style={{ color: 'rgba(255,255,255,0.6)' }}>{intv.time_to_effect_days}d</div>
              </div>
              <div style={{ fontSize: 8, textAlign: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>HIST.</div>
                <div style={{ color: intv.historical_success_rate > 0.65 ? '#10B981' : '#F59E0B' }}>
                  {Math.round(intv.historical_success_rate * 100)}%
                </div>
              </div>
            </div>

            {/* Row 3: cost bars */}
            <CostBar value={intv.political_cost} color="#EF4444" label="POL" />
            <CostBar value={intv.economic_cost} color="#F59E0B" label="ECON" />
            <CostBar value={intv.social_cost} color="#A78BFA" label="SOC" />

            {/* Row 4: actor stances + flags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
              {intv.actor_support.map(a => (
                <span key={a} style={{ fontSize: 7, padding: '1px 4px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 2, color: '#10B981' }}>
                  +{a}
                </span>
              ))}
              {intv.actor_opposition.map(a => (
                <span key={a} style={{ fontSize: 7, padding: '1px 4px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 2, color: '#EF4444' }}>
                  −{a}
                </span>
              ))}
              {intv.veto_risk && (
                <span style={{ fontSize: 7, padding: '1px 5px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.5)', borderRadius: 2, color: '#DC2626', fontWeight: 'bold' }}>
                  VETO: {intv.veto_actor}
                </span>
              )}
              {intv.warning && (
                <span style={{ fontSize: 7, padding: '1px 5px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 2, color: '#F59E0B' }}>
                  ⚠ WARNING
                </span>
              )}
              {intv.requires_imf_approval && (
                <span style={{ fontSize: 7, padding: '1px 5px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 2, color: '#3B82F6' }}>
                  IMF APPROVAL
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
