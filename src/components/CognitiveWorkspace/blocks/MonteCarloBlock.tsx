import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const MonteCarloBlock: React.FC<Props> = ({ parameters }) => {
  const dist = parameters?.outcome_distribution || {};
  const entries = Object.entries(dist).filter(([, v]) => (v as number) > 0).sort(([, a], [, b]) => (b as number) - (a as number));
  return (
    <div className="block-content">
      <div className="block-section-title">Monte Carlo • {parameters?.time_horizon_days || 30}d horizon</div>
      {entries.map(([phase, prob]) => (
        <div key={phase} className="block-row">
          <span className="block-row-label" style={{ textTransform: 'uppercase' }}>{phase}</span>
          <span className="block-row-value info">{((prob as number) * 100).toFixed(0)}%</span>
        </div>
      ))}
      {parameters?.p_revolution_range?.mean && (
        <div className="block-row">
          <span className="block-row-label">P(Rev) mean</span>
          <span className="block-row-value">{(parameters.p_revolution_range.mean * 100).toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};
