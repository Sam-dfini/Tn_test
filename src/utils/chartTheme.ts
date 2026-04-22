export const CHART_THEME = {
  grid: { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' },
  axis: { 
    tick: { fill: '#64748b', fontSize: 10 }, 
    axisLine: false, 
    tickLine: false 
  },
  tooltip: {
    contentStyle: {
      background: '#0a0f1a',
      border: '1px solid #1e293b',
      borderRadius: '8px',
      fontSize: 11,
      color: '#e2e8f0'
    }
  },
  colors: {
    primary: '#00d4ff',   // intel-cyan
    danger: '#ff453a',    // intel-red
    warning: '#ff9f0a',   // intel-orange
    success: '#30d158',   // intel-green
    muted: '#475569',     // slate-600
  }
};
