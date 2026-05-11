import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Zap, Shield, Radio, TrendingUp, AlertCircle } from 'lucide-react';
import { Notification } from '../../context/NotificationContext';
import { audioService } from '../../services/audioService';

const ICON_MAP: Record<string, React.ElementType> = {
  RRI: TrendingUp,
  SHOCK: Zap,
  THRESHOLD: Shield,
  SIGNAL: Radio,
  ALERT: AlertTriangle,
  SYSTEM: AlertCircle,
};

const PRIORITY_STYLES = {
  CRITICAL: {
    card: 'bg-red-500/10 border-red-500/30',
    iconBg: 'bg-red-500/15 border-red-500/25',
    iconColor: 'text-red-400',
    title: 'text-red-400',
    bar: 'bg-red-500/60',
    glow: 'shadow-[0_8px_32px_rgba(255,69,58,0.2)]',
  },
  HIGH: {
    card: 'bg-orange-500/10 border-orange-500/30',
    iconBg: 'bg-orange-500/15 border-orange-500/25',
    iconColor: 'text-orange-400',
    title: 'text-orange-400',
    bar: 'bg-orange-500/60',
    glow: 'shadow-[0_8px_32px_rgba(255,159,10,0.15)]',
  },
  MEDIUM: {
    card: 'bg-white/5 border-white/10',
    iconBg: 'bg-white/10 border-white/10',
    iconColor: 'text-white/70',
    title: 'text-white/90',
    bar: 'bg-white/30',
    glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
  },
};

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const notification = (e as CustomEvent).detail as Notification;
      audioService.playNotification(notification.priority);

      if (['CRITICAL', 'HIGH', 'MEDIUM'].includes(notification.priority)) {
        setToasts(prev => {
          if (prev.some(t => t.id === notification.id)) return prev;
          return [notification, ...prev].slice(0, 3);
        });
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, 10000);
      }
    };

    window.addEventListener('ti:notification:new', handler);
    return () => window.removeEventListener('ti:notification:new', handler);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed z-[10000] pointer-events-none
      bottom-4 left-4 right-4 flex flex-col-reverse gap-3
      sm:top-20 sm:bottom-auto sm:right-5 sm:left-auto sm:w-[360px] sm:flex-col">
      <AnimatePresence>
        {toasts.map(toast => {
          const s = PRIORITY_STYLES[toast.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.MEDIUM;
          const Icon = ICON_MAP[toast.type] ?? AlertTriangle;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className={`
                w-full rounded-2xl border p-4
                backdrop-blur-xl pointer-events-auto
                ${s.card} ${s.glow}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${s.iconBg}`}>
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] font-bold tracking-[0.18em] uppercase font-mono ${s.title}`}>
                      {toast.title || 'Intelligence Signal'}
                    </span>
                    <button
                      onClick={() => dismiss(toast.id)}
                      className="p-1 -mr-1 text-white/25 hover:text-white/70 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-white/60 leading-relaxed font-sans mb-2">
                    {toast.message || 'New intelligence extracted from secure feed.'}
                  </p>

                  {toast.action && (
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent(toast.action!.event, { detail: toast.action!.detail }));
                        dismiss(toast.id);
                      }}
                      className={`
                        text-[9px] font-mono flex items-center gap-1
                        px-2.5 py-1 rounded-md border border-white/10 bg-white/5
                        hover:bg-white/10 transition-colors ${s.iconColor}
                      `}
                    >
                      {toast.action.label} →
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-dismiss progress bar */}
              <div className="h-[2px] w-full bg-white/5 mt-3 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 10, ease: 'linear' }}
                  className={`h-full rounded-full ${s.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
