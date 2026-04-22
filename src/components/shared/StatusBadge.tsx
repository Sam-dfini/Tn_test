import React from 'react';

type Status = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' |
              'STABLE' | 'WARNING' | 'ACTIVE' | 'DETAINED' |
              'CONFIRMED' | 'DISPUTED' | 'SURGING' | 'DECLINING' | 'GOOD';

const STATUS_STYLES: Record<string, string> = {
  CRITICAL: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  HIGH:     'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  MEDIUM:   'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  LOW:      'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
  STABLE:   'text-slate-400 border-slate-600 bg-slate-800',
  WARNING:  'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  ACTIVE:   'text-intel-green border-intel-green/30 bg-intel-green/10',
  DETAINED: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  CONFIRMED:'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
  DISPUTED: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  SURGING:  'text-intel-red border-intel-red/30 bg-intel-red/10',
  DECLINING:'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
  GOOD:     'text-intel-green border-intel-green/30 bg-intel-green/10',
};

export const StatusBadge: React.FC<{
  status: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}> = ({ status, pulse = false, size = 'sm' }) => (
  <span className={`font-mono font-bold border rounded uppercase inline-flex items-center justify-center
    ${size === 'sm' ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'}
    ${STATUS_STYLES[status] || STATUS_STYLES.STABLE}
    ${pulse ? 'animate-pulse' : ''}`}>
    {status}
  </span>
);
