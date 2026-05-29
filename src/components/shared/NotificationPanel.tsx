import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, X, Check, CheckCheck, Trash2,
  ChevronRight, Zap, Radio, Database,
  AlertTriangle, Settings, Activity,
  Globe, RefreshCw, Signal, FileText
} from 'lucide-react';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { useRSS } from '../../context/RSSContext';
import { useObservability } from '../../context/ObservabilityContext';
import { generateStableKey } from '../../lib/keyUtils';

// ── Type icon map (shape only; color is priority-driven) ────
const TYPE_CONFIG = {
  RRI:      { icon: Zap },
  ALERT:    { icon: AlertTriangle },
  PIPELINE: { icon: Database },
  RSS:      { icon: Radio },
  SHOCK:    { icon: AlertTriangle },
  SOURCE:   { icon: Settings },
  SYSTEM:   { icon: Settings },
};

const PRIORITY_BADGE = {
  CRITICAL: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  HIGH:     'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  MEDIUM:   'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  LOW:      'text-slate-500 border-slate-700 bg-slate-900',
};

const PRIORITY_ICON = {
  CRITICAL: { color: 'text-intel-red', bg: 'bg-intel-red/10', border: 'border-intel-red/20' },
  HIGH:     { color: 'text-intel-orange', bg: 'bg-intel-orange/10', border: 'border-intel-orange/20' },
  MEDIUM:   { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  LOW:      { color: 'text-slate-500', bg: 'bg-slate-700/20', border: 'border-slate-700' },
};

const getTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  if (diff < 0) return 'just now'; // Handle clock drift
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── Single notification item ─────────────────────────────────
const NotificationItem: React.FC<{
  notification: Notification;
  onRead: (id: string) => void;
}> = ({ notification: n, onRead }) => {
  const typeConfig = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
  const priorityConfig = PRIORITY_ICON[n.priority] || PRIORITY_ICON.LOW;
  const Icon = typeConfig.icon;

  const handleClick = () => {
    onRead(n.id);
    if (n.action?.event) {
      window.dispatchEvent(new CustomEvent(
        n.action.event,
        { detail: n.action.detail }
      ));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={handleClick}
      className={`flex items-start space-x-3 px-4 py-3
        border-b border-intel-border/20 cursor-pointer
        transition-all group
        ${!n.read ? 'bg-white/[0.02] hover:bg-white/[0.05]' : 'hover:bg-white/[0.02]'}`}
    >
      {/* Unread dot */}
      <div className="shrink-0 mt-1.5">
        <div className={`w-1.5 h-1.5 rounded-full transition-all ${
          !n.read
            ? n.priority === 'CRITICAL'
              ? 'bg-intel-red animate-pulse'
              : n.priority === 'HIGH'
              ? 'bg-intel-orange'
              : n.priority === 'MEDIUM'
              ? 'bg-yellow-500'
              : 'bg-intel-cyan'
            : 'bg-transparent'
        }`} />
      </div>

      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center
        justify-center shrink-0 ${priorityConfig.bg} border ${priorityConfig.border}`}>
        <Icon className={`w-3.5 h-3.5 ${priorityConfig.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[11px] font-bold leading-snug
            ${!n.read ? 'text-white' : 'text-slate-400'}
            group-hover:text-white transition-colors`}>
            {n.title}
          </span>
          <span className="text-[8px] font-mono text-slate-700
            shrink-0 mt-0.5">
            {getTimeAgo(n.timestamp)}
          </span>
        </div>

        {/* Priority + type badges */}
        <div className="flex items-center space-x-1.5">
          <span className={`text-[7px] font-mono font-bold px-1.5
            py-0.5 rounded border uppercase ${PRIORITY_BADGE[n.priority]}`}>
            {n.priority}
          </span>
          <span className="text-[7px] font-mono text-slate-700
            uppercase">{n.type}</span>
          {n.rriVariable && (
            <span className="text-[7px] font-mono text-slate-700">
              · {n.rriVariable}
            </span>
          )}
        </div>

        {/* Message */}
        <p className={`text-[10px] leading-relaxed
          ${!n.read ? 'text-slate-400' : 'text-slate-600'}
          line-clamp-2 group-hover:line-clamp-none
          transition-all`}>
          {n.message}
        </p>

        {/* Field changes */}
        {n.fieldChanges && n.fieldChanges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {n.fieldChanges.slice(0, 3).map((fc, i) => (
              <span key={generateStableKey(fc, i, 'fc')} className="text-[8px] font-mono
                px-1.5 py-0.5 bg-intel-cyan/5 text-intel-cyan
                border border-intel-cyan/10 rounded">
                {fc.field}: {String(fc.oldValue)} → {String(fc.newValue)}
              </span>
            ))}
          </div>
        )}

        {/* Action link */}
        {n.action && (
          <div className="flex items-center space-x-1 text-[9px]
            font-mono text-intel-cyan opacity-0 group-hover:opacity-100
            transition-all">
            <span>{n.action.label}</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── RSS Ingest Dashboard ──────────────────────────────────────
const RSSDashboard: React.FC = () => {
  const { articles, events, totalArticles, lastFetch, isFetching,
          syncErrors, newArticlesCount, highSeverityToday } = useRSS();
  const { metrics } = useObservability();

  const stats = [
    { icon: Globe, label: 'Active Sources', value: String(metrics.feedCount || 0), color: 'text-intel-cyan' },
    { icon: FileText, label: 'Total Articles', value: String(totalArticles || 0), color: 'text-blue-400' },
    { icon: RefreshCw, label: 'New This Cycle', value: String(newArticlesCount || 0), color: 'text-green-400' },
    { icon: Signal, label: 'Events Tracked', value: String(events?.length || 0), color: 'text-amber-400' },
    { icon: Activity, label: 'Signals Extracted', value: String(metrics.signalCount || 0), color: 'text-purple-400' },
    { icon: Radio, label: 'High Severity Today', value: String(highSeverityToday || 0), color: 'text-intel-red' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel p-3 border border-intel-border/20 rounded-xl text-center">
            <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
            <div className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[7px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-intel-border/20">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-intel-cyan animate-pulse' : 'bg-green-400'}`} />
          <span className="text-[9px] font-mono text-slate-400">
            {isFetching ? 'Ingesting...' : 'Idle'}
          </span>
        </div>
        <span className="text-[8px] font-mono text-slate-600">
          {lastFetch ? `Last fetch: ${new Date(lastFetch).toLocaleTimeString()}` : 'Not yet fetched'}
        </span>
      </div>

      {/* Sync errors */}
      {syncErrors.length > 0 && (
        <div className="px-3 py-2 bg-intel-red/5 rounded-xl border border-intel-red/20">
          <div className="text-[8px] font-bold text-intel-red uppercase tracking-wider mb-1">
            Sync Errors ({syncErrors.length})
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {syncErrors.slice(0, 5).map((err, i) => (
              <div key={i} className="text-[8px] font-mono text-slate-500 truncate">{err}</div>
            ))}
          </div>
        </div>
      )}

      {/* Infra metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-3 py-2 bg-black/40 rounded-xl border border-intel-border/20">
          <div className="text-[7px] text-slate-500 uppercase tracking-wider">Error Rate</div>
          <div className="text-sm font-bold text-intel-red tabular-nums">{(metrics.errorRate * 100).toFixed(1)}%</div>
        </div>
        <div className="px-3 py-2 bg-black/40 rounded-xl border border-intel-border/20">
          <div className="text-[7px] text-slate-500 uppercase tracking-wider">Latency</div>
          <div className="text-sm font-bold text-amber-400 tabular-nums">{metrics.latencyMs}ms</div>
        </div>
      </div>
    </div>
  );
};

// ── System Health Dashboard ───────────────────────────────────
const SystemDashboard: React.FC = () => {
  const { metrics } = useObservability();

  const services = [
    { label: 'Express Server', status: 'online', detail: 'Port 3001', color: 'text-green-400' },
    { label: 'Python Backend', status: 'online', detail: 'Port 8000', color: 'text-green-400' },
    { label: 'Vite HMR', status: 'online', detail: 'Middleware', color: 'text-green-400' },
    { label: 'Supabase', status: 'online', detail: 'Connected', color: 'text-green-400' },
    { label: 'WebSocket', status: 'online', detail: 'Live stream', color: 'text-green-400' },
    { label: 'AI Service', status: 'degraded', detail: 'API key may be invalid', color: 'text-amber-400' },
    { label: 'Sentinel Sat', status: 'standby', detail: 'Triggers on Agri tab', color: 'text-slate-400' },
  ];

  const stats = [
    { label: 'Uptime', value: `${Math.floor((Date.now() - window.performance?.timing?.navigationStart || 0) / 1000)}s`, color: 'text-cyan-400' },
    { label: 'DB Reads', value: String(metrics.dbReadCount || 0), color: 'text-blue-400' },
    { label: 'DB Writes', value: String(metrics.dbWriteCount || 0), color: 'text-orange-400' },
    { label: 'Success Rate', value: `${((1 - (metrics.errorRate || 0)) * 100).toFixed(1)}%`, color: 'text-green-400' },
    { label: 'Total Ops', value: String((metrics.dbReadCount || 0) + (metrics.dbWriteCount || 0)), color: 'text-slate-400' },
    { label: 'Ingestion Rate', value: `${(metrics.ingestionRate || 0).toFixed(1)}/s`, color: 'text-purple-400' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Service status */}
      <div className="space-y-1">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Services</div>
        {services.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-intel-border/20">
            <span className="text-[10px] font-mono text-slate-300">{s.label}</span>
            <div className="flex items-center space-x-2">
              <span className="text-[8px] font-mono text-slate-600">{s.detail}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'online' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className={`text-[8px] font-mono ${s.color}`}>{s.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="glass-panel p-3 border border-intel-border/20 rounded-xl text-center">
            <div className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[7px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main notification panel (exported) ──────────────────────
export const NotificationPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    notifications, unreadCount, criticalCount,
    markAsRead, markAllAsRead, clearAll, clearRead
  } = useNotifications();

  const [activeFilter, setActiveFilter] =
    useState<string>('ALL');

  const filtered = notifications.filter(n =>
    activeFilter === 'ALL' ||
    n.type === activeFilter
  );

  const FILTERS = [
    { id: 'ALL', label: 'All', count: notifications.length },
    { id: 'SHOCK', label: 'Shocks', count: notifications.filter(n => n.type === 'SHOCK').length },
    { id: 'RRI', label: 'RRI', count: notifications.filter(n => n.type === 'RRI').length },
    { id: 'ALERT', label: 'Alert', count: notifications.filter(n => n.type === 'ALERT').length },
    { id: 'PIPELINE', label: 'Pipeline', count: notifications.filter(n => n.type === 'PIPELINE').length },
    { id: 'RSS', label: 'RSS', count: notifications.filter(n => n.type === 'RSS').length },
    { id: 'SYSTEM', label: 'System', count: notifications.filter(n => n.type === 'SYSTEM').length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed sm:absolute top-16 sm:top-full left-2 right-2 sm:left-auto sm:right-0 mt-2
              w-auto sm:w-[550px] max-h-[calc(100vh-80px)] sm:max-h-[750px] 
              bg-[#05070a] border border-intel-border rounded-2xl
              shadow-2xl z-[9999] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between
              px-5 py-4 border-b border-intel-border
              bg-black/40 shrink-0">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-intel-cyan" />
                <div>
                  <div className="text-sm font-bold text-white
                    uppercase tracking-widest">
                    Notifications
                  </div>
                  <div className="text-[9px] font-mono text-slate-600">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : 'All caught up'
                    }
                    {criticalCount > 0 && (
                      <span className="text-intel-red ml-2
                        animate-pulse">
                        {criticalCount} critical
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1.5
                      text-[9px] font-mono text-slate-500
                      hover:text-intel-cyan transition-colors px-2
                      py-1 rounded-lg hover:bg-white/5"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                {notifications.some(n => n.read) && (
                  <button
                    onClick={clearRead}
                    className="flex items-center space-x-1.5
                      text-[9px] font-mono text-slate-600
                      hover:text-intel-red transition-colors px-2
                      py-1 rounded-lg hover:bg-intel-red/5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-500 hover:text-white
                    hover:bg-white/5 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center border-b
              border-intel-border/30 px-2 shrink-0
              overflow-x-auto scrollbar-hide bg-black/20">
              {FILTERS.map((f, i) => (
                <button
                  key={generateStableKey(f, i, 'filter')}
                  onClick={() => setActiveFilter(f.id)}
                  className={`flex items-center space-x-1.5 px-3
                    py-2.5 text-[9px] font-mono uppercase
                    whitespace-nowrap transition-all ${
                    activeFilter === f.id
                      ? 'text-intel-cyan border-b-2 border-intel-cyan'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span className={`text-[7px] px-1 py-0.5
                      rounded ${
                      activeFilter === f.id
                        ? 'bg-intel-cyan/20 text-intel-cyan'
                        : 'bg-white/5 text-slate-700'
                    }`}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Content: RSS dashboard or notification list */}
            <div className="flex-1 overflow-y-auto
              scrollbar-thin scrollbar-thumb-intel-cyan/10">
{activeFilter === 'RSS' ? (
  <RSSDashboard />
) : activeFilter === 'SYSTEM' ? (
  <SystemDashboard />
) : filtered.length === 0 ? (
                <div className="flex flex-col items-center
                  justify-center h-40 space-y-3">
                  <Check className="w-8 h-8 text-slate-700" />
                  <span className="text-[11px] font-mono
                    text-slate-500 uppercase tracking-widest">
                    {activeFilter === 'UNREAD'
                      ? 'No unread notifications'
                      : 'No notifications'}
                  </span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((n, i) => (
                    <NotificationItem
                      key={generateStableKey(n, i, 'notif')}
                      notification={n}
                      onRead={markAsRead}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t
                border-intel-border/20 bg-black/20 shrink-0
                flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-700">
                  {notifications.length} total · last 14 days stored
                </span>
                <button
                  onClick={clearAll}
                  className="text-[9px] font-mono text-slate-700
                    hover:text-intel-red transition-colors
                    flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ── Bell button (used in header) ─────────────────────────────
export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, criticalCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read);
  const highCount = unread.filter(n => n.priority === 'HIGH').length;
  const mediumCount = unread.filter(n => n.priority === 'MEDIUM').length;

  const unreadBadgeClass = criticalCount > 0
    ? 'bg-intel-red animate-pulse'
    : highCount > 0
    ? 'bg-intel-orange'
    : mediumCount > 0
    ? 'bg-yellow-500'
    : 'bg-slate-500';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg border
          transition-all ${
          open
            ? 'bg-intel-cyan/10 border-intel-cyan/40 text-intel-cyan'
            : 'bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/30'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 min-w-[16px]
              h-4 rounded-full flex items-center justify-center
              text-[8px] font-bold font-mono px-0.5 text-white
              ${unreadBadgeClass}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <NotificationPanel
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};
