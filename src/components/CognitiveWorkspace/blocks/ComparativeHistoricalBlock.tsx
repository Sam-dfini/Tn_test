import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const ComparativeHistoricalBlock: React.FC<Props> = ({ parameters }) => {
  const dims = parameters?.dimensions || [];
  return (
    <div className="block-content">
      <div className="block-section-title">Reference: {parameters?.reference_case_id || 'TUN_2011_REVOLUTION'}</div>
      {dims.map((d: string, i: number) => (
        <div key={i} className="block-row">
          <span className="block-row-label">{d.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
};
