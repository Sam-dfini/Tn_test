import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const WaterStressBlock: React.FC<Props> = ({ parameters }) => {
  const p = parameters || {};
  return (
    <div className="block-content">
      <div className="block-section-title">Water Scarcity Index</div>
      <div className="block-row">
        <span className="block-row-label">Water Stress</span>
        <span className={`block-row-value ${p.water_stress_index > 0.6 ? 'critical' : p.water_stress_index > 0.3 ? 'warning' : 'safe'}`}>
          {p.water_stress_index ? `${(p.water_stress_index * 100).toFixed(0)}%` : 'N/A'}
        </span>
      </div>
      <div className="block-row">
        <span className="block-row-label">Dam Fill</span>
        <span className="block-row-value">{p.dam_fill_rate ? `${(p.dam_fill_rate * 100).toFixed(0)}%` : 'N/A'}</span>
      </div>
      <div className="block-row">
        <span className="block-row-label">Rainfall Anomaly</span>
        <span className={`block-row-value ${p.rainfall_anomaly < 0 ? 'critical' : ''}`}>{p.rainfall_anomaly?.toFixed(1) ?? 'N/A'}</span>
      </div>
    </div>
  );
};
