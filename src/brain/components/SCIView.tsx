import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Shield, RefreshCw, Radio, BarChart3, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface SCIResult {
  sci: number; classification: string; classification_label: string;
  classification_color: string; source_reliability_base: number;
  corroboration_count: number; source_name: string; source_type: string;
  text_preview?: string;
  components: { source_reliability: number; corroboration: number;
    propagation_velocity: number; freshness: number; contradiction: number; };
}

interface SCIStats {
  total_scored: number; average_sci: number;
  classifications: Record<string, number>; sources_tracked: number;
}

const CLASS_BG: Record<string, string> = {
  fact: 'rgba(34,197,94,0.1)', probable: 'rgba(59,130,246,0.1)',
  rumor: 'rgba(245,158,11,0.1)', coordinated_narrative: 'rgba(168,85,247,0.1)',
  psychological_operation: 'rgba(239,68,68,0.1)', early_weak: 'rgba(100,116,139,0.1)',
};

const SCIView: React.FC = () => {
  const [results, setResults] = useState<SCIResult[]>([]);
  const [stats, setStats] = useState<SCIStats | null>(null);
  const [sources, setSources] = useState<{ source_id: string; reliability: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const base = 'http://localhost:8000';
      const [sr, ss, srcs] = await Promise.all([
        fetch(`${base}/api/sci/score-all`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours: 720 }),
        }).then(r => r.ok ? r.json() : { total: 0, results: [], stats: {} }),
        fetch(`${base}/api/sci/status`).then(r => r.ok ? r.json() : {}),
        fetch(`${base}/api/sci/sources`).then(r => r.ok ? r.json() : []),
      ]);
      setResults(sr.results || []);
      setStats(sr.stats || ss);
      setSources(srcs);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

  const filtered = filter === 'all' ? results : results.filter(r => r.classification === filter);
  const classifications = stats?.classifications || {};

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#040609', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity className="w-6 h-6 animate-spin" style={{ color: '#00f2ff' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#040609', display: 'flex', flexDirection: 'column', padding: '60px 20px 44px', gap: 12, fontFamily: '"IBM Plex Mono",monospace', color: '#e2e8f0', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,180,180,0.28)', paddingBottom: 10, flexShrink: 0 }}>
        <Shield size={18} color="#00f2ff" />
        <span style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(0,200,200,0.6)', fontWeight: 600 }}>SIGNAL CREDIBILITY INDEX</span>
        <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', marginLeft: 'auto' }}>
          {stats?.total_scored || 0} signals · Avg SCI: {((stats?.average_sci ?? 0) * 100).toFixed(0)}%
        </span>
        <button onClick={fetchData} style={{ background: 'rgba(0,190,190,0.07)', border: '1px solid rgba(0,200,200,0.35)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#e2e8f0', cursor: 'pointer' }}>
          <RefreshCw size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />Refresh
        </button>
      </div>

      {/* Classification cards */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'fact', label: 'Fact', icon: CheckCircle, color: '#00f2ff' },
          { id: 'probable', label: 'Probable', icon: BarChart3, color: '#3b82f6' },
          { id: 'rumor', label: 'Rumor', icon: HelpCircle, color: '#d68910' },
          { id: 'coordinated_narrative', label: 'Coord. Narrative', icon: Radio, color: '#a855f7' },
          { id: 'psychological_operation', label: 'PSYOP', icon: AlertTriangle, color: '#ef4444' },
          { id: 'early_weak', label: 'Early Weak', icon: Activity, color: '#64748b' },
        ].map(c => {
          const count = classifications[c.id] || 0;
          return (
            <div key={c.id} onClick={() => setFilter(c.id === filter ? 'all' : c.id)} style={{
              flex: '1 0 140px', cursor: 'pointer', padding: '10px 14px', borderRadius: 10,
              background: c.id === filter ? `${c.color}22` : 'rgba(4,6,9,0.6)',
              border: `1px solid ${c.id === filter ? c.color : 'rgba(0,180,180,0.28)'}`,
              transition: 'all .15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <c.icon size={12} color={c.color} />
                <span style={{ fontSize: 9, color: c.color, fontWeight: 600 }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Results table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontSize: 10, color: 'rgba(148,163,184,0.35)' }}>
            No signals scored. Run analysis to see results.
          </div>
        )}
        {filtered.slice(0, 100).map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8,
            background: CLASS_BG[r.classification] || 'rgba(0,180,180,0.05)',
            border: '1px solid rgba(0,180,180,0.28)',
          }}>
            {/* SCI bar + number */}
            <div style={{ width: 60, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: r.classification_color, textAlign: 'center' }}>
                {(r.sci * 100).toFixed(0)}%
              </div>
              <div style={{ width: '100%', height: 5, background: 'rgba(0,180,180,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${r.sci * 100}%`, height: '100%', background: r.classification_color, borderRadius: 3 }} />
              </div>
            </div>

            {/* Source + text preview + components */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f0' }}>{r.source_name}</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                  color: r.classification_color,
                  background: `${r.classification_color}22`, padding: '1px 5px', borderRadius: 3,
                }}>
                  {r.classification_label}
                </span>
              </div>
              {r.text_preview && (
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, lineHeight: 1.4 }}>
                  {r.text_preview}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, fontSize: 8, color: 'rgba(148,163,184,0.35)', alignItems: 'center' }}>
                <span>Src: {((r.components?.source_reliability ?? 0) * 100).toFixed(0)}%</span>
                <span style={{ width: 1, height: 8, background: 'rgba(0,180,180,0.28)' }} />
                <span>Corrob: {r.corroboration_count}</span>
                <span style={{ width: 1, height: 8, background: 'rgba(0,180,180,0.28)' }} />
                <span>Prop: {((r.components?.propagation_velocity ?? 0) * 100).toFixed(0)}%</span>
                <span style={{ width: 1, height: 8, background: 'rgba(0,180,180,0.28)' }} />
                <span>Fresh: {((r.components?.freshness ?? 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SCIView;
