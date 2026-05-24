import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const ProtestSIRBlock: React.FC<Props> = ({ parameters }) => {
  const p = parameters || {};
  return (
    <div className="block-content">
      <div className="block-section-title">Protest Spread Model (SIR)</div>
      <div className="block-row">
        <span className="block-row-label">R0</span>
        <span className={`block-row-value ${p.current_r0 > 1 ? 'critical' : 'safe'}`}>{p.current_r0?.toFixed(2) || 'N/A'}</span>
      </div>
      <div className="block-row">
        <span className="block-row-label">Active Cases</span>
        <span className="block-row-value">{p.current_cases ?? 'N/A'}</span>
      </div>
      <div className="block-subtitle">{p.governorate_vectors?.length || 0} governorates tracked</div>
    </div>
  );
};
