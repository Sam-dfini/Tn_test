import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const MigrationFlowBlock: React.FC<Props> = ({ parameters }) => {
  const p = parameters || {};
  return (
    <div className="block-content">
      <div className="block-section-title">Migration Pressure</div>
      <div className="block-row">
        <span className="block-row-label">Pressure Index</span>
        <span className={`block-row-value ${p.migration_pressure_index > 0.6 ? 'critical' : p.migration_pressure_index > 0.3 ? 'warning' : 'safe'}`}>
          {p.migration_pressure_index ? `${(p.migration_pressure_index * 100).toFixed(0)}%` : 'N/A'}
        </span>
      </div>
      <div className="block-row">
        <span className="block-row-label">Interceptions</span>
        <span className="block-row-value">{p.coast_guard_interceptions ?? 'N/A'}</span>
      </div>
      <div className="block-row">
        <span className="block-row-label">EU Readmission</span>
        <span className="block-row-value">{p.eu_readmission_rate ? `${(p.eu_readmission_rate * 100).toFixed(0)}%` : 'N/A'}</span>
      </div>
    </div>
  );
};
