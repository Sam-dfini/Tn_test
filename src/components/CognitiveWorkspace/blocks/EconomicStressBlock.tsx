import React from 'react';

interface Props { parameters?: any; data?: any; confidence?: number; }

export const EconomicStressBlock: React.FC<Props> = ({ parameters }) => {
  const p = parameters || {};
  return (
    <div className="block-content">
      <div className="block-section-title">Economic Stress Indicators</div>
      <div className="block-row">
        <span className="block-row-label">Inflation</span>
        <span className="block-row-value">{p.inflation ? `${p.inflation}%` : 'N/A'}</span>
      </div>
      <div className="block-row">
        <span className="block-row-label">FX Reserves</span>
        <span className="block-row-value">{p.fx_reserves_days ? `${p.fx_reserves_days}d` : 'N/A'}</span>
      </div>
      <div className="block-row">
        <span className="block-row-label">Parallel Market</span>
        <span className={`block-row-value ${p.parallel_market_premium > 15 ? 'critical' : ''}`}>{p.parallel_market_premium ? `${p.parallel_market_premium}%` : 'N/A'}</span>
      </div>
      <div className="block-row">
        <span className="block-row-label">Debt/GDP</span>
        <span className={`block-row-value ${p.debt_to_gdp > 80 ? 'critical' : ''}`}>{p.debt_to_gdp ? `${p.debt_to_gdp}%` : 'N/A'}</span>
      </div>
    </div>
  );
};
