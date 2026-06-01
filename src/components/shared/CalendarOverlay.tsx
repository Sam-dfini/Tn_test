import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { PoliticalCalendar } from '../political/PoliticalCalendar';

interface CalendarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarOverlay: React.FC<CalendarOverlayProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-overlay bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-8 lg:inset-12 z-overlay flex flex-col bg-[#05070a] border border-intel-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-intel-border/40 bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-intel-cyan" />
                <div>
                  <h2 className="text-sm font-bold text-on-surface uppercase tracking-widest">
                    Political & Economic Calendar
                  </h2>
                  <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-0.5">
                    Events, elections, policy releases, economic data
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar content */}
            <div className="flex-1 overflow-y-auto">
              <PoliticalCalendar />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
