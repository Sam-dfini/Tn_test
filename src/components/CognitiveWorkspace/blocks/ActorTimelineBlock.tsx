import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const ActorTimelineBlock: React.FC<Props> = ({ parameters }) => {
  const actors = parameters?.actors || [];
  return (
    <div className="block-content">
      <div className="block-section-title">Actor Timeline • {parameters?.time_range_days || 30}d</div>
      {actors.map((a: any, i: number) => (
        <div key={i} className="block-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`block-dot ${a.posture || 'neutral'}`} />
            <span className="block-row-label">{a.actor_id || a.entity_id || `Actor ${i}`}</span>
          </span>
          <span className={`block-row-value ${a.posture === 'aggressive' ? 'critical' : a.posture === 'defensive' ? 'warning' : ''}`}>
            {a.posture?.toUpperCase() || 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};
