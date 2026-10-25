import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// Animated Luxury Green Payment Success Checkmark (GPay / Apple Pay style)
const AnimatedPaymentCheckmark: React.FC = () => {
  return (
    <div className="relative w-8 h-8 rounded-full bg-mm-positive/15 border border-mm-positive/40 flex items-center justify-center flex-shrink-0 shadow-md shadow-mm-positive/20">
      <motion.div
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-mm-positive/30 pointer-events-none"
      />
      <svg
        className="w-5 h-5 text-mm-positive"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-5 left-4 right-4 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-2.5 sm:max-w-sm sm:w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.92 }}
              transition={{ type: 'spring', damping: 24, stiffness: 350 }}
              className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl flex items-center gap-3.5 shadow-2xl transition-all ${
                isSuccess
                  ? 'bg-mm-elevated/95 border-mm-positive/40'
                  : toast.type === 'error'
                  ? 'bg-mm-elevated/95 border-mm-negative/40'
                  : 'bg-mm-elevated/95 border-mm-line/30'
              }`}
            >
              {isSuccess ? (
                <AnimatedPaymentCheckmark />
              ) : toast.type === 'error' ? (
                <div className="w-8 h-8 rounded-full bg-mm-negative/15 border border-mm-negative/30 flex items-center justify-center flex-shrink-0 text-mm-negative">
                  <AlertCircle size={18} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-mm-gold/15 border border-mm-gold/30 flex items-center justify-center flex-shrink-0 text-mm-gold">
                  <Info size={18} strokeWidth={2.5} />
                </div>
              )}

              <p className="flex-1 min-w-0 text-sm text-mm-text font-medium leading-snug" role="status">
                {toast.message}
              </p>

              {toast.action && (
                <button
                  onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                  className="px-3 py-1.5 rounded-lg bg-mm-gold/15 text-mm-gold text-xs font-semibold hover:bg-mm-gold/25 transition-colors"
                >
                  {toast.action.label}
                </button>
              )}

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-mm-text/10 rounded-lg text-mm-muted hover:text-mm-text transition-colors"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
