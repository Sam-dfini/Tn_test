import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const EliteNetworkBlock: React.FC<Props> = ({ parameters }) => {
  const actors = parameters?.actors || [];
  return (
    <div className="block-content">
      <div className="block-section-title">Elite Cohesion Network {parameters?.highlight_coalitions ? '• Coalitions' : ''}</div>
      {actors.map((a: any, i: number) => (
        <div key={i} className="block-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`block-dot ${a.posture || 'neutral'}`} />
            <span className="block-row-label">{a.actor_id || a.entity_id || `Actor ${i}`}</span>
          </span>
          <span className={`block-row-value ${a.stress_level > 0.6 ? 'critical' : a.stress_level > 0.3 ? 'warning' : ''}`}>
            {a.stress_level ? `${(a.stress_level * 100).toFixed(0)}%` : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};
