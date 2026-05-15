import React, { useState, useEffect, useCallback } from 'react';
import { Activity, BarChart3, TrendingUp, RefreshCw, Target, Crosshair, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface VarResult {
  label: string; hits: number; misses: number; total: number;
  accuracy: number; brier_score: number; category: string;
}

interface CalibrationResult {
  records: number; evaluated: number; pending: number;
  overall_accuracy: number; total_predictions: number;
  total_hits: number; total_misses: number;
  by_variable: Record<string, VarResult>;
  by_horizon: Record<string, { hits: number; misses: number; total: number; accuracy: number }>;
  calibration_curve: { confidence_bin: string; predicted_avg: number; actual_frequency: number; count: number }[];
  trend: { week: string; hits: number; misses: number; total: number; accuracy: number }[];
  bias: { avg_confidence: number; base_rate: number; bias: number; bias_label: string };
}

const CAT_COLORS: Record<string, string> = {
  fx: '#3b82f6', protest: '#ef4444', rri: '#a855f7', elite: '#f59e0b',
  cascade: '#06b6d4', velocity: '#22c55e', ugtt: '#f97316',
  sei: '#ec4899', rpi: '#14b8a6', etm: '#64748b', mii: '#dc2626', other: '#78716c',
};

const CalibrationDashboard: React.FC = () => {
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVar, setSelectedVar] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/calibration/summary');
      if (res.ok) setResult(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 60000); return () => clearInterval(t); }, [fetchData]);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity className="w-6 h-6 animate-spin" style={{ color: '#a78bfa' }} />
      </div>
    );
  }

  if (!result || result.records === 0) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: '"IBM Plex Mono",monospace', color: '#3a4a5a' }}>
        <Target size={32} opacity={0.3} />
        <div style={{ fontSize: 11, letterSpacing: 2 }}>NO PREDICTION DATA</div>
        <div style={{ fontSize: 9, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
          Predictions are generated during RRI recalculation cycles.  
          Allow the system to run for a few hours to accumulate data.
        </div>
      </div>
    );
  }

  const vars = Object.entries(result.by_variable).sort(([, a], [, b]) => b.total - a.total);
  const maxVarAcc = Math.max(...vars.map(([, v]) => v.accuracy), 0.01);
  const bias = result.bias;

  return (
    <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', flexDirection: 'column', padding: 20, gap: 16, fontFamily: '"IBM Plex Mono",monospace', color: '#c9d1e0', overflow: 'auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, flexShrink: 0 }}>
        <Crosshair size={18} color="#a78bfa" />
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#3a4a5a', fontWeight: 600 }}>CALIBRATION DASHBOARD</span>
        <span style={{ fontSize: 9, color: '#3a4a5a', marginLeft: 'auto' }}>
          {result.evaluated} evaluated · {result.pending} pending · {result.total_predictions} predictions
        </span>
        <button onClick={fetchData} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#c9d1e0', cursor: 'pointer' }}>
          <RefreshCw size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Refresh
        </button>
      </div>

      {/* Top metrics */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 4 }}>OVERALL ACCURACY</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: result.overall_accuracy > 0.7 ? '#22c55e' : result.overall_accuracy > 0.5 ? '#f59e0b' : '#ef4444' }}>
            {(result.overall_accuracy * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: 9, color: '#3a4a5a', marginTop: 4 }}>
            {result.total_hits} hits / {result.total_predictions} total
          </div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 4 }}>CALIBRATION BIAS</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: Math.abs(bias.bias) > 0.1 ? '#ef4444' : Math.abs(bias.bias) > 0.05 ? '#f59e0b' : '#22c55e' }}>
            {bias.bias_label}
          </div>
          <div style={{ fontSize: 9, color: '#3a4a5a', marginTop: 4 }}>
            Avg confidence: {(bias.avg_confidence * 100).toFixed(0)}% · Base rate: {(bias.base_rate * 100).toFixed(0)}%
          </div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 4 }}>BY HORIZON</div>
          {Object.entries(result.by_horizon).map(([h, d]) => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: '#3a4a5a', width: 30 }}>{h}D</span>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${d.accuracy * 100}%`, height: '100%', background: d.accuracy > 0.7 ? '#22c55e' : '#f59e0b', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9, color: '#c9d1e0', width: 30, textAlign: 'right' }}>{(d.accuracy * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main: variables + calibration curve */}
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        {/* Variables table */}
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16, overflow: 'auto' }}>
          <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 8 }}>
            <BarChart3 size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> ACCURACY BY VARIABLE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {vars.map(([id, v]) => {
              const catColor = CAT_COLORS[v.category] || '#64748b';
              const isSelected = selectedVar === id;
              return (
                <div key={id} onClick={() => setSelectedVar(isSelected ? null : id)}
                  style={{
                    cursor: 'pointer', padding: '6px 10px', borderRadius: 6,
                    background: isSelected ? `${catColor}15` : 'transparent',
                    border: `1px solid ${isSelected ? catColor : 'transparent'}`,
                    transition: 'all .15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{v.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: v.accuracy > 0.7 ? '#22c55e' : v.accuracy > 0.5 ? '#f59e0b' : '#ef4444' }}>
                      {(v.accuracy * 100).toFixed(0)}%
                    </span>
                    <span style={{ fontSize: 8, color: '#3a4a5a' }}>{v.hits}/{v.total}</span>
                  </div>
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${(v.accuracy / maxVarAcc) * 100}%`, height: '100%', background: catColor, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calibration curve + trend */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Calibration curve */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
            <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 8 }}>CALIBRATION CURVE</div>
            <div style={{ position: 'relative', height: 120 }}>
              {/* Diagonal reference line */}
              <svg width="100%" height="120" viewBox="0 0 100 100" style={{ position: 'absolute' }}>
                <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
                {result.calibration_curve.filter(c => c.count > 0).map((c, i) => {
                  const x = c.predicted_avg * 100;
                  const y = 100 - c.actual_frequency * 100;
                  const size = Math.max(4, Math.min(12, c.count * 1.5));
                  return (
                    <circle key={i} cx={x} cy={y} r={size / 2}
                      fill={Math.abs(c.predicted_avg - c.actual_frequency) < 0.1 ? '#22c55e' : '#f59e0b'}
                      opacity={0.7} />
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#2a3a4a', marginTop: 4 }}>
              <span>0%</span><span>Predicted Probability</span><span>100%</span>
            </div>
            <div style={{ fontSize: 8, color: '#3a4a5a', marginTop: 4, textAlign: 'center' }}>
              Points close to diagonal = well-calibrated
            </div>
          </div>

          {/* Accuracy trend */}
          {result.trend.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', padding: 16, flex: 1, overflow: 'auto' }}>
              <div style={{ fontSize: 9, color: '#3a4a5a', letterSpacing: 2, marginBottom: 8 }}>
                <TrendingUp size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} /> ACCURACY TREND
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 50 }}>
                {result.trend.slice(-12).map((t, i) => {
                  const hgt = Math.max(4, t.accuracy * 48);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ width: '100%', height: hgt, background: t.accuracy > 0.7 ? '#22c55e' : '#f59e0b', borderRadius: '2px 2px 0 0', opacity: 0.7, minWidth: 8 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 7, color: '#2a3a4a', marginTop: 4, textAlign: 'center' }}>
                Recent accuracy trend (weekly)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalibrationDashboard;
