import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, X, Check, CheckCheck, Trash2,
  ChevronRight, Zap, Radio, Database,
  AlertTriangle, Settings
} from 'lucide-react';
import { useNotifications, Notification } from '../context/NotificationContext';

// ── Type icon map ────────────────────────────────────────────
const TYPE_CONFIG = {
  RRI:      { icon: Zap,           color: 'text-intel-red',    bg: 'bg-intel-red/10',    border: 'border-intel-red/20'    },
  ALERT:    { icon: AlertTriangle, color: 'text-intel-orange', bg: 'bg-intel-orange/10', border: 'border-intel-orange/20' },
  PIPELINE: { icon: Database,      color: 'text-intel-cyan',   bg: 'bg-intel-cyan/10',   border: 'border-intel-cyan/20'   },
  RSS:      { icon: Radio,         color: 'text-intel-green',  bg: 'bg-intel-green/10',  border: 'border-intel-green/20'  },
  SOURCE:   { icon: Settings,      color: 'text-slate-400',    bg: 'bg-white/5',          border: 'border-slate-700'       },
  SYSTEM:   { icon: Settings,      color: 'text-slate-400',    bg: 'bg-white/5',          border: 'border-slate-700'       },
};

const PRIORITY_BADGE = {
  CRITICAL: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  HIGH:     'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  MEDIUM:   'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  LOW:      'text-slate-500 border-slate-700 bg-slate-900',
};

const getTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
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
  const config = TYPE_CONFIG[n.type];
  const Icon = config.icon;

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
              : 'bg-intel-cyan'
            : 'bg-transparent'
        }`} />
      </div>

      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center
        justify-center shrink-0 ${config.bg} border ${config.border}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
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
              <span key={i} className="text-[8px] font-mono
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
    (activeFilter === 'UNREAD' && !n.read) ||
    n.type === activeFilter
  );

  const FILTERS = [
    { id: 'ALL', label: 'All', count: notifications.length },
    { id: 'UNREAD', label: 'Unread', count: unreadCount },
    { id: 'RRI', label: 'RRI', count: notifications.filter(n => n.type === 'RRI').length },
    { id: 'ALERT', label: 'Alert', count: notifications.filter(n => n.type === 'ALERT').length },
    { id: 'PIPELINE', label: 'Pipeline', count: notifications.filter(n => n.type === 'PIPELINE').length },
    { id: 'RSS', label: 'RSS', count: notifications.filter(n => n.type === 'RSS').length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[150]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2
              w-[400px] max-h-[600px] bg-[#05070a]
              border border-intel-border rounded-2xl
              shadow-2xl z-[200] flex flex-col overflow-hidden"
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
              {FILTERS.map(f => (
                <button
                  key={f.id}
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

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto
              scrollbar-thin scrollbar-thumb-intel-cyan/10">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center
                  justify-center h-40 space-y-3">
                  <Check className="w-8 h-8 text-slate-800" />
                  <span className="text-[11px] font-mono
                    text-slate-700 uppercase tracking-widest">
                    {activeFilter === 'UNREAD'
                      ? 'No unread notifications'
                      : 'No notifications'}
                  </span>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map(n => (
                    <NotificationItem
                      key={n.id}
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
                  {notifications.length} total · max 100 stored
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
  const { unreadCount, criticalCount } = useNotifications();
  const [open, setOpen] = useState(false);

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
              ${criticalCount > 0
                ? 'bg-intel-red animate-pulse'
                : 'bg-intel-orange'
              }`}
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
