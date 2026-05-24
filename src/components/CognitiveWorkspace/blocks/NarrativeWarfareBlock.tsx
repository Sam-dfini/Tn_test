import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const NarrativeWarfareBlock: React.FC<Props> = ({ parameters }) => {
  const narratives = parameters?.active_narratives || [];
  return (
    <div className="block-content">
      <div className="block-section-title">Narrative State: {parameters?.narrative_state || 'unknown'}</div>
      {narratives.map((n: any, i: number) => (
        <div key={i} className="block-row">
          <span className="block-row-label">{n.title || n.text || `Narrative ${i + 1}`}</span>
        </div>
      ))}
    </div>
  );
};
