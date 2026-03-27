import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { Notification } from '../context/NotificationContext';

export const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const notification = (e as CustomEvent).detail as Notification;
      // Only show toasts for CRITICAL and HIGH
      if (['CRITICAL', 'HIGH'].includes(notification.priority)) {
        setToasts(prev => [notification, ...prev].slice(0, 3));
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, 8000);
      }
    };

    window.addEventListener('ti:notification:new', handler);
    return () => window.removeEventListener('ti:notification:new', handler);
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-20 sm:top-24 right-0 sm:right-6 left-0 sm:left-auto z-[9999] space-y-3
      pointer-events-none px-4 sm:px-0 flex flex-col items-center sm:items-end">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full sm:w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border p-4
              shadow-2xl pointer-events-auto ${
              toast.priority === 'CRITICAL'
                ? 'bg-intel-red/10 border-intel-red/40'
                : 'bg-intel-orange/10 border-intel-orange/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center
                justify-center shrink-0 ${
                toast.priority === 'CRITICAL'
                  ? 'bg-intel-red/20'
                  : 'bg-intel-orange/20'
              }`}>
                {toast.type === 'RRI'
                  ? <Zap className={`w-4 h-4 ${toast.priority === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`} />
                  : <AlertTriangle className={`w-4 h-4 ${toast.priority === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`} />
                }
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${
                    toast.priority === 'CRITICAL'
                      ? 'text-intel-red'
                      : 'text-intel-orange'
                  }`}>{toast.title}</span>
                  <button
                    onClick={() => dismiss(toast.id)}
                    className="p-0.5 text-slate-600
                      hover:text-white transition-colors ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  {toast.message}
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
                    className={`text-[9px] font-mono mt-1
                      hover:underline ${
                      toast.priority === 'CRITICAL'
                        ? 'text-intel-red'
                        : 'text-intel-orange'
                    }`}
                  >
                    {toast.action.label} →
                  </button>
                )}
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
              className={`h-0.5 mt-3 rounded-full ${
                toast.priority === 'CRITICAL'
                  ? 'bg-intel-red/50'
                  : 'bg-intel-orange/50'
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
