import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { Notification } from '../../context/NotificationContext';
import { audioService } from '../../services/audioService';

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const notification = (e as CustomEvent).detail as Notification;
      
      // Play sound for all notifications regardless of toast visibility
      audioService.playNotification(notification.priority);

      // Show toasts for CRITICAL, HIGH, and MEDIUM
      if (['CRITICAL', 'HIGH', 'MEDIUM'].includes(notification.priority)) {
        setToasts(prev => {
          // Prevent duplicates by ID
          if (prev.some(t => t.id === notification.id)) return prev;
          return [notification, ...prev].slice(0, 3);
        });
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, 10000);
      }
    };

    window.addEventListener('ti:notification:new', handler);
    return () => window.removeEventListener('ti:notification:new', handler);
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-4 sm:top-20 right-0 sm:right-6 left-0 sm:left-auto z-[10000] space-y-3
      pointer-events-none px-4 sm:px-0 flex flex-col items-center sm:items-end">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, x: 0, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full sm:w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border p-4
              shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto backdrop-blur-xl ${
              toast.priority === 'CRITICAL'
                ? 'bg-red-500/15 border-red-500/40 shadow-red-500/10'
                : toast.priority === 'HIGH'
                ? 'bg-orange-500/15 border-orange-500/40 shadow-orange-500/5'
                : 'bg-white/5 border-white/10 shadow-black/20'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 rounded-xl flex items-center
                justify-center shrink-0 border shadow-inner ${
                toast.priority === 'CRITICAL'
                  ? 'bg-red-500/20 border-red-500/30'
                  : toast.priority === 'HIGH'
                  ? 'bg-orange-500/20 border-orange-500/30'
                  : 'bg-white/10 border-white/10'
              }`}>
                {toast.type === 'RRI'
                  ? <Zap className={`w-5 h-5 ${
                      toast.priority === 'CRITICAL' ? 'text-red-400' : 
                      toast.priority === 'HIGH' ? 'text-orange-400' : 'text-white/80'
                    }`} />
                  : <AlertTriangle className={`w-5 h-5 ${
                      toast.priority === 'CRITICAL' ? 'text-red-400' : 
                      toast.priority === 'HIGH' ? 'text-orange-400' : 'text-white/80'
                    }`} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
                    toast.priority === 'CRITICAL'
                      ? 'text-red-400'
                      : toast.priority === 'HIGH'
                      ? 'text-orange-400'
                      : 'text-white/90'
                  }`}>{toast.title || 'Intelligence Signal'}</span>
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="p-1 -mr-1 text-white/30
                      hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed font-sans mb-3">
                  {toast.message || 'New intelligence extracted from secure feed.'}
                </p>
                {toast.action && (
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent(
                        toast.action!.event,
                        { detail: toast.action!.detail }
                      ));
                      dismiss(toast.id);
                    }}
                    className={`text-[9px] font-mono mt-1 flex items-center gap-1
                      px-2 py-0.5 rounded border border-white/10 bg-white/5 hover:bg-white/10 transition-colors ${
                      toast.priority === 'CRITICAL'
                        ? 'text-red-400'
                        : toast.priority === 'HIGH'
                        ? 'text-orange-400'
                        : 'text-white/60'
                    }`}
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="h-[1px] w-full bg-white/5 mt-3 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 10, ease: 'linear' }}
                className={`h-full ${
                  toast.priority === 'CRITICAL'
                    ? 'bg-red-500/50'
                    : toast.priority === 'HIGH'
                    ? 'bg-orange-500/50'
                    : 'bg-white/30'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
