import React from 'react';
import { TruthClass, TRUTH_COLORS, TRUTH_LABELS } from '../../lib/truthClassification';

interface TruthBadgeProps {
  truthClass: TruthClass;
  size?: 'sm' | 'md';
}

export const TruthBadge: React.FC<TruthBadgeProps> = ({ truthClass, size = 'sm' }) => {
  const color = TRUTH_COLORS[truthClass];
  const label = TRUTH_LABELS[truthClass];
  
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded ${
        size === 'sm' ? 'text-[7px] px-1.5 py-0.5' : 'text-[9px] px-2 py-1'
      }`}
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
      />
      {label}
    </span>
  );
};
