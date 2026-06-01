import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Zap, Shield, Radio, TrendingUp, AlertCircle, Database, Globe } from 'lucide-react';
import { Notification } from '../../context/NotificationContext';
import { audioService } from '../../services/audioService';

const ICON_MAP: Record<string, React.ElementType> = {
  RRI: TrendingUp,
  SHOCK: Zap,
  THRESHOLD: Shield,
  SIGNAL: Radio,
  ALERT: AlertTriangle,
  PIPELINE: Database,
  RSS: Radio,
  SOURCE: Globe,
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
    card: 'bg-yellow-500/10 border-yellow-500/30',
    iconBg: 'bg-yellow-500/15 border-yellow-500/25',
    iconColor: 'text-yellow-400',
    title: 'text-yellow-400',
    bar: 'bg-yellow-500/60',
    glow: 'shadow-[0_8px_32px_rgba(255,214,10,0.2)]',
  },
  LOW: {
    card: 'bg-slate-500/10 border-slate-500/30',
    iconBg: 'bg-slate-500/15 border-slate-500/25',
    iconColor: 'text-slate-400',
    title: 'text-slate-400',
    bar: 'bg-slate-500/60',
    glow: 'shadow-[0_8px_32px_rgba(148,163,184,0.15)]',
  },
};

export const NotificationToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [queue, setQueue] = useState<Notification[]>([]);
  const timerRef = useRef<any>(null);
  const toastKey = useRef(0);

  const showNext = useCallback(() => {
    setQueue(prev => {
      if (prev.length > 0) {
        const [next, ...rest] = prev;
        setActiveToast(next);
        toastKey.current++;
        timerRef.current = setTimeout(() => {
          setActiveToast(null);
          setTimeout(() => showNext(), 400);
        }, 10000);
        return rest;
      }
      setActiveToast(null);
      return prev;
    });
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const notification = (e as CustomEvent).detail as Notification;
      audioService.playNotification(notification.priority);

      if (['CRITICAL', 'HIGH', 'MEDIUM'].includes(notification.priority)) {
        if (!activeToast && queue.length === 0) {
          // No toast showing — show immediately
          setActiveToast(notification);
          toastKey.current++;
          timerRef.current = setTimeout(() => {
            setActiveToast(null);
            setTimeout(() => showNext(), 400);
          }, 10000);
        } else {
          // Toast already showing — add to queue (max 5)
          setQueue(prev => {
            if (prev.some(t => t.id === notification.id)) return prev;
            return [...prev, notification].slice(0, 5);
          });
        }
      }
    };

    window.addEventListener('ti:notification:new', handler);
    return () => {
      window.removeEventListener('ti:notification:new', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeToast, queue, showNext]);

  const dismiss = (id: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveToast(null);
    setTimeout(() => showNext(), 400);
  };

  const toast = activeToast;
  const s = toast ? (PRIORITY_STYLES[toast.priority as keyof typeof PRIORITY_STYLES] ?? PRIORITY_STYLES.MEDIUM) : null;
  const Icon = toast ? (ICON_MAP[toast.type] ?? AlertTriangle) : null;

  return (
    <div className="fixed z-toast pointer-events-none
      bottom-4 left-4 right-4 flex flex-col-reverse gap-3
      sm:top-20 sm:bottom-auto sm:right-5 sm:left-auto sm:w-[360px] sm:flex-col">
      <AnimatePresence>
        {toast && s && Icon && (
          <motion.div
            key={toastKey.current}
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
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${s.iconBg}`}>
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
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
            <div className="h-[2px] w-full bg-white/5 mt-3 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 10, ease: 'linear' }}
                className={`h-full rounded-full ${s.bar}`}
              />
            </div>
          </motion.div>
        )}
        {!toast && queue.length > 0 && (
          <div className="text-[9px] font-mono text-slate-500 text-center py-1">
            {queue.length} notification{queue.length > 1 ? 's' : ''} waiting
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
