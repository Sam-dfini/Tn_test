import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

const Row: React.FC<{ label: string; value: any; level?: 'critical' | 'warning' | 'safe' | 'info' }> = ({ label, value, level }) => (
  <div className="block-row">
    <span className="block-row-label">{label}</span>
    <span className={`block-row-value ${level || ''}`}>{value ?? 'N/A'}</span>
  </div>
);

export const RRIGaugeBlock: React.FC<Props> = ({ parameters, data }) => {
  const p = parameters || {};
  return (
    <div className="block-content">
      <Row label="Current RRI" value={p.current_rri?.toFixed(2)} level={p.current_rri > 3 ? 'critical' : p.current_rri > 2 ? 'warning' : 'safe'} />
      <Row label="P(Revolution)" value={p.p_revolution ? `${(p.p_revolution * 100).toFixed(1)}%` : 'N/A'} level={p.p_revolution > 0.45 ? 'critical' : undefined} />
      <Row label="State Phase" value={p.state_phase?.toUpperCase()} level={p.state_phase === 'acute_crisis' ? 'critical' : p.state_phase === 'crisis' ? 'critical' : 'warning'} />
      <Row label="Velocity" value={p.velocity?.toFixed(4)} />
      {data?.snapshot_rri && <Row label="Snapshot RRI" value={data.snapshot_rri?.toFixed(2)} />}
    </div>
  );
};
