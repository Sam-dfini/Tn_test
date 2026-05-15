import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, AlertTriangle, Eye, Forward, Activity, RefreshCw, Radio, Users, Clock } from 'lucide-react';

interface TelegramMsg {
  id: number; message_id: number; channel_username: string;
  channel_name: string; channel_category: string; text: string;
  date: string; views: number; forwards: number;
  alerts: string[]; alert_count: number; has_media: boolean;
}

interface Status {
  running: boolean; has_credentials: boolean;
  channels_total: number; channels_active: number;
  channels_failed: number; total_messages: number;
  last_fetch: string | null; recent_errors: string[];
}

const CAT_COLORS: Record<string, string> = {
  activist: '#a855f7', opposition: '#ef4444', protest: '#ff6b35',
  news: '#00f2ff', analyst: '#f59e0b', union: '#22c55e', government: '#3b82f6',
};

const TelegramFeedView: React.FC = () => {
  const [messages, setMessages] = useState<TelegramMsg[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [filter, setFilter] = useState<'all' | 'alert'>('all');
  const [category, setCategory] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [msgRes, statRes] = await Promise.all([
        fetch(`/api/telegram/messages?limit=50${category ? `&category=${category}` : ''}${filter === 'alert' ? '&alert_only=true' : ''}`),
        fetch('/api/telegram/status'),
      ]);
      if (msgRes.ok) setMessages(await msgRes.json());
      if (statRes.ok) setStatus(await statRes.json());
    } catch {}
  }, [filter, category]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t); }, [fetchData]);

  const triggerCollect = async () => {
    await fetch('/api/telegram/collect', { method: 'POST' });
    fetchData();
  };

  const timeAgo = (d: string) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  };

  const truncate = (t: string, n: number) => t.length > n ? t.slice(0, n) + '...' : t;

  return (
    <div style={{ width: '100%', height: '100%', background: '#05070f', display: 'flex', flexDirection: 'column', padding: 20, gap: 16, fontFamily: '"IBM Plex Mono",monospace', color: '#c9d1e0', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12, flexShrink: 0 }}>
        <MessageCircle size={18} color="#30d158" />
        <span style={{ fontSize: 11, letterSpacing: 3, color: '#3a4a5a', fontWeight: 600 }}>TELEGRAM INTELLIGENCE</span>
        {status && (
          <span style={{ fontSize: 9, color: status.has_credentials ? '#30d158' : '#f59e0b', marginLeft: 'auto' }}>
            {status.has_credentials ? `${status.channels_active}/${status.channels_total} CHANNELS` : 'NO CREDENTIALS'}
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#c9d1e0', fontFamily: 'monospace' }}>
          <option value="all">All Messages</option>
          <option value="alert">Alerts Only</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#c9d1e0', fontFamily: 'monospace' }}>
          <option value="">All Categories</option>
          <option value="activist">Activist</option>
          <option value="opposition">Opposition</option>
          <option value="protest">Protest</option>
          <option value="news">News</option>
          <option value="analyst">Analyst</option>
          <option value="union">Union</option>
          <option value="government">Government</option>
        </select>
        <button onClick={triggerCollect} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: '#c9d1e0', cursor: 'pointer', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={12} /> Collect Now
        </button>
      </div>

      {/* Status bar */}
      {status && (
        <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#3a4a5a', flexShrink: 0 }}>
          <span><Users size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{status.channels_active}/{status.channels_total} channels</span>
          <span><Activity size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{status.total_messages} total msgs</span>
          <span><Clock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{status.last_fetch ? timeAgo(status.last_fetch) : 'never'}</span>
        </div>
      )}

      {/* Message list */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontSize: 10, color: '#3a4a5a' }}>
            {status?.has_credentials === false
              ? 'Set TELEGRAM_API_ID + TELEGRAM_API_HASH in .env to enable'
              : 'No messages yet. Click "Collect Now" to fetch.'}
          </div>
        )}
        {messages.map((msg, i) => {
          const catColor = CAT_COLORS[msg.channel_category] || '#64748b';
          return (
            <div key={`${msg.channel_username}-${msg.message_id}`} style={{
              background: msg.alert_count > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
              borderRadius: 8, padding: '10px 14px',
              border: msg.alert_count > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.04)',
              transition: 'all .15s',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 9 }}>
                <span style={{ color: catColor, fontWeight: 600 }}>{msg.channel_name}</span>
                <span style={{ color: '#3a4a5a' }}>@{msg.channel_username}</span>
                <span style={{ color: '#3a4a5a', marginLeft: 'auto' }}>{timeAgo(msg.date)}</span>
              </div>

              {/* Message text */}
              <div style={{ fontSize: 11, lineHeight: 1.5, color: '#e2e8f0', marginBottom: 6, whiteSpace: 'pre-wrap' }}>
                {truncate(msg.text, 300)}
              </div>

              {/* Metadata row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 9, color: '#3a4a5a' }}>
                <span><Eye size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{msg.views}</span>
                <span><Forward size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />{msg.forwards}</span>
                {msg.has_media && <span style={{ color: '#f59e0b' }}>📎 Media</span>}
                {msg.alert_count > 0 && (
                  <span style={{ color: '#ef4444', marginLeft: 'auto' }}>
                    <AlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {msg.alerts.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TelegramFeedView;
