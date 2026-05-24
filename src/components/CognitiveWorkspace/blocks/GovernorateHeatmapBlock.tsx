import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const GovernorateHeatmapBlock: React.FC<Props> = ({ parameters }) => {
  const vectors = parameters?.vectors || [];
  return (
    <div className="block-content">
      <div className="block-section-title">{vectors.length} governorates tracked</div>
      {vectors.slice(0, 8).map((v: any, i: number) => (
        <div key={i} className="block-row">
          <span className="block-row-label">{v.gov_id || v.name || `Gov ${i}`}</span>
          <span className={`block-row-value ${(v.stress || 0) > 0.6 ? 'critical' : (v.stress || 0) > 0.3 ? 'warning' : 'safe'}`}>
            {v.stress ? `${(v.stress * 100).toFixed(0)}%` : 'N/A'}
          </span>
        </div>
      ))}
    </div>
  );
};
