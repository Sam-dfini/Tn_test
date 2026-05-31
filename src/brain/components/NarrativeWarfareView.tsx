import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, MessageCircle, Radio, RefreshCw, Flame, AlertTriangle, Star, Shield, Meh, Zap } from 'lucide-react';

interface FrameData {
  id: string; label: string; color: string; category: string;
  polarity: number; count: number; strength: number; share: number;
}

interface SentimentMap {
  [key: string]: number;
}

interface SloganData {
  text: string; count: number;
}

interface SourceAnalysis {
  [key: string]: {
    total_texts: number; top_frame: string | null;
    frame_diversity: number; dominant_frame_share: number;
  };
}

interface NarrativeResult {
  timestamp: string; texts_analyzed: number;
  active_frames: FrameData[]; dominant_frame: string | null;
  sentiment: SentimentMap; dominant_emotion: string;
  trending_slogans: SloganData[];
  source_analysis: SourceAnalysis;
  narrative_convergence: number; polarity_score: number;
  frame_diversity: number;
}

const CAT_COLORS: Record<string, string> = {
  economic: '#00f2ff', political: '#d68910', social: '#a78bfa',
  security: '#3b82f6',
};

const EMOTION_ICONS: Record<string, React.ReactNode> = {
  anger: <Flame size={14} color="#ef4444" />,
  fear: <AlertTriangle size={14} color="#f59e0b" />,
  hope: <Star size={14} color="#22c55e" />,
  defiance: <Shield size={14} color="#3b82f6" />,
  resignation: <Meh size={14} color="#64748b" />,
  surprise: <Zap size={14} color="#a78bfa" />,
};

const NarrativeWarfareView: React.FC = () => {
  const [result, setResult] = useState<NarrativeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameDefs, setFrameDefs] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const fetchData = useCallback(async () => {
    fetch('/api/narrative/frames').then(r => r.ok && r.json().then(setFrameDefs)).catch(() => {});
    try {
      const res = await fetch('/api/narrative/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 720 }),
      });
      if (res.ok) setResult(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData, autoRefresh]);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#040609', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity className={`w-6 h-6 ${prefersReducedMotion ? '' : 'animate-spin'}`} style={{ color: '#00f2ff' }} />
      </div>
    );
  }

  const frames = result?.active_frames || [];
  const sentiment = result?.sentiment || {};
  const slogans = result?.trending_slogans || [];
  const sources = result?.source_analysis || {};
  const topFrames = frames.slice(0, 6);
  const maxStrength = Math.max(...frames.map(f => f.strength), 0.01);

  return (
    <div style={{ width: '100%', height: '100%', background: '#040609', display: 'flex', flexDirection: 'column', padding: '60px 20px 44px', gap: 12, fontFamily: '"IBM Plex Mono",monospace', color: '#e2e8f0', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,180,180,0.28)', paddingBottom: 10, flexShrink: 0 }}>
        <Radio size={18} color="#00f2ff" />
        <span style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(0,200,200,0.6)', fontWeight: 600 }}>NARRATIVE WARFARE ENGINE</span>
        <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', marginLeft: 'auto' }}>
          {result?.texts_analyzed || 0} texts · Conv: {((result?.narrative_convergence ?? 1) * 100).toFixed(0)}%
        </span>
        <button onClick={fetchData} style={{
          background: 'rgba(0,190,190,0.07)', border: '1px solid rgba(0,200,200,0.35)',
          borderRadius: 6, padding: '6px 14px', fontSize: 10, color: '#e2e8f0',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,242,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,242,255,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,190,190,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,200,200,0.35)'; }}
        >
          <RefreshCw size={11} className={prefersReducedMotion ? '' : 'animate-spin'} style={{ animationDuration: '3s' }} />
          Refresh
        </button>
      </div>

      {/* Top row: Frames + Sentiment + Convergence */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Active Frames */}
        <div style={{ flex: 2, background: 'rgba(4,6,9,0.6)', borderRadius: 12, border: '1px solid rgba(0,180,180,0.28)', padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 12 }}>ACTIVE FRAMES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {frames.length === 0 && (
              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', textAlign: 'center', padding: 20, lineHeight: 1.6 }}>
                No text data to analyze.<br />
                Needs Telegram credentials (<span style={{ color: '#00f2ff' }}>TELEGRAM_API_ID</span> + <span style={{ color: '#00f2ff' }}>TELEGRAM_API_HASH</span>)<br />
                or RSS articles in Supabase for the last 24h.
              </div>
            )}
            {topFrames.map(f => (
              <div key={f.id} style={{
                padding: '6px 8px', borderRadius: 6,
                background: 'rgba(0,180,180,0.05)', border: '1px solid transparent',
                transition: 'all 0.15s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,180,180,0.2)'; e.currentTarget.style.background = 'rgba(0,180,180,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'rgba(0,180,180,0.05)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: f.color, fontWeight: 600 }}>{f.label}</span>
                  <span style={{ color: 'rgba(148,163,184,0.35)' }}>{(f.strength * 100).toFixed(0)}% · {f.count} texts</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(0,180,180,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(f.strength / maxStrength) * 100}%`, height: '100%', background: f.color, borderRadius: 3, transition: 'width .5s' }} />
                </div>
              </div>
            ))}
            {frames.length > 6 && (
              <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', textAlign: 'center', marginTop: 4 }}>
                +{frames.length - 6} more frames
              </div>
            )}
          </div>
        </div>

        {/* Sentiment */}
        <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', borderRadius: 12, border: '1px solid rgba(0,180,180,0.28)', padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 12 }}>EMOTIONAL TEMPERATURE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(sentiment).sort(([,a], [,b]) => b - a).slice(0, 5).map(([emo, score]) => (
              <div key={emo} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 4, transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,180,180,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                  {EMOTION_ICONS[emo] || <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b', display: 'block' }} />}
                </span>
                <span style={{ fontSize: 10, color: '#e2e8f0', flex: 1, textTransform: 'uppercase', letterSpacing: 1 }}>{emo}</span>
                <div style={{ width: 60, height: 4, background: 'rgba(0,180,180,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(score as number) * 100}%`, height: '100%', background: '#00f2ff', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', width: 30, textAlign: 'right' }}>
                  {((score as number) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: '#00f2ff', letterSpacing: 1 }}>
            DOMINANT: {result?.dominant_emotion?.toUpperCase()}
          </div>
        </div>

        {/* Convergence */}
        <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', borderRadius: 12, border: '1px solid rgba(0,180,180,0.28)', padding: 16 }}>
          <div style={{ fontSize: 9, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 12 }}>NARRATIVE METRICS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', marginBottom: 4 }}>Convergence</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: (result?.narrative_convergence ?? 0) > 0.7 ? '#00f2ff' : (result?.narrative_convergence ?? 0) > 0.4 ? '#d68910' : '#ef4444' }}>
                {((result?.narrative_convergence ?? 0) * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)' }}>{(result?.narrative_convergence ?? 0) > 0.7 ? 'HIGH (sources aligned)' : (result?.narrative_convergence ?? 0) > 0.4 ? 'MODERATE' : 'LOW (fragmented)'}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', marginBottom: 4 }}>Frame Diversity</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#00f2ff' }}>{result?.frame_diversity || 0}</div>
              <div style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)' }}>active frames</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', marginBottom: 4 }}>Polarity</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: (result?.polarity_score ?? 0) > 0 ? '#00f2ff' : (result?.polarity_score ?? 0) < 0 ? '#ef4444' : '#64748b' }}>
                {result?.polarity_score ?? 0 > 0 ? 'POSITIVE' : result?.polarity_score === 0 ? 'NEUTRAL' : 'NEGATIVE'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Trending slogans + Source analysis */}
      <div style={{ display: 'flex', gap: 16, flex: 1 }}>
        {/* Trending slogans */}
        <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', borderRadius: 12, border: '1px solid rgba(0,180,180,0.28)', padding: 16, overflow: 'auto' }}>
          <div style={{ fontSize: 9, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 12 }}>
            <TrendingUp size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> TRENDING SLOGANS / MEMES
          </div>
          {slogans.length === 0 && (
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', textAlign: 'center', padding: 20 }}>No trending phrases detected yet. Run analysis on Telegram + RSS data.</div>
          )}
          {slogans.slice(0, 12).map((s, i) => {
            const sizes = [12, 11, 10, 10, 9, 9, 9, 8, 8, 8, 8, 8];
            const size = sizes[Math.min(i, sizes.length - 1)];
            return (
              <div key={i} style={{
                display: 'inline-block', margin: '3px',
                padding: '6px 14px', borderRadius: 12,
                background: `rgba(0,242,255,${0.05 + (s.count / Math.max(slogans[0]?.count, 1)) * 0.2})`,
                border: '1px solid rgba(0,242,255,0.25)',
                fontSize: size, color: '#e2e8f0', whiteSpace: 'nowrap',
                cursor: 'default', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,242,255,0.2)'; e.currentTarget.style.borderColor = 'rgba(0,242,255,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `rgba(0,242,255,${0.05 + (s.count / Math.max(slogans[0]?.count, 1)) * 0.2})`; e.currentTarget.style.borderColor = 'rgba(0,242,255,0.25)'; }}
              >
                {s.text}
                <span style={{ color: 'rgba(148,163,184,0.35)', marginLeft: 4, fontSize: 8 }}>×{s.count}</span>
              </div>
            );
          })}
        </div>

        {/* Source analysis */}
        <div style={{ flex: 1, background: 'rgba(4,6,9,0.6)', borderRadius: 12, border: '1px solid rgba(0,180,180,0.28)', padding: 16, overflow: 'auto' }}>
          <div style={{ fontSize: 9, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 12 }}>
            <MessageCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> SOURCE ANALYSIS
          </div>
          {Object.keys(sources).length === 0 && (
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.35)', textAlign: 'center', padding: 20 }}>No source data yet.</div>
          )}
          {Object.entries(sources).map(([src, data]: [string, any]) => {
            const frameObj = frames.find(f => f.id === data.top_frame);
            return (
              <div key={src} style={{
                padding: '10px 12px', marginBottom: 6, background: 'rgba(0,180,180,0.1)',
                borderRadius: 8, border: '1px solid rgba(0,180,180,0.2)',
                transition: 'all 0.15s', cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,180,180,0.4)'; e.currentTarget.style.background = 'rgba(0,180,180,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,180,180,0.2)'; e.currentTarget.style.background = 'rgba(0,180,180,0.1)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: CAT_COLORS[src] || '#64748b', textTransform: 'uppercase' }}>{src}</span>
                  <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)' }}>{data.total_texts} texts</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 9, color: 'rgba(148,163,184,0.35)' }}>
                  <span>Top: <span style={{ color: frameObj?.color || '#64748b' }}>{data.top_frame || 'N/A'}</span></span>
                  <span>Diversity: {data.frame_diversity}</span>
                  <span>Dominance: {(data.dominant_frame_share * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NarrativeWarfareView;
