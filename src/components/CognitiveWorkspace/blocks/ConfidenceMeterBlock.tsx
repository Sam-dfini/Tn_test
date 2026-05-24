import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const ConfidenceMeterBlock: React.FC<Props> = ({ parameters }) => {
  const p = parameters || {};
  const breakdown = p.uncertainty_breakdown || {};
  const items = [
    { label: 'Overall', value: p.overall_confidence, color: '#10B981' },
    { label: 'Data freshness', value: breakdown.data, color: '#3B82F6' },
    { label: 'Model calibration', value: breakdown.model, color: '#8B5CF6' },
    { label: 'Structural', value: breakdown.structural, color: '#F59E0B' },
    { label: 'Epistemic', value: breakdown.epistemic, color: '#DC2626' },
  ];
  return (
    <div className="block-content">
      <div className="block-section-title">Uncertainty Budget</div>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div className="block-row">
            <span className="block-row-label">{item.label}</span>
            <span className={`block-row-value ${item.value > 0.7 ? 'safe' : ''}`} style={item.value > 0.7 ? { color: item.color } : {}}>
              {(item.value * 100).toFixed(0)}%
            </span>
          </div>
          <div className="block-bar-track">
            <div className="block-bar-fill" style={{ width: `${(item.value * 100).toFixed(0)}%`, background: item.color }} />
          </div>
        </div>
      ))}
      <div className="block-subtitle">RAG chunks: {p.rag_chunks_used || 0}</div>
    </div>
  );
};
