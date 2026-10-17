import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// Animated Luxury Green Payment Success Checkmark (GPay / Apple Pay style)
const AnimatedPaymentCheckmark: React.FC = () => {
  return (
    <div className="relative w-8 h-8 rounded-full bg-[#82D9A3]/15 border border-[#82D9A3]/40 flex items-center justify-center flex-shrink-0 shadow-md shadow-[#82D9A3]/20">
      <motion.div
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-[#82D9A3]/30 pointer-events-none"
      />
      <svg
        className="w-5 h-5 text-[#82D9A3]"
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
    <div className="fixed top-5 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
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
                  ? 'bg-[#121614]/95 border-[#82D9A3]/40 shadow-[#82D9A3]/10'
                  : toast.type === 'error'
                  ? 'bg-[#1B1214]/95 border-[#D98282]/40 shadow-[#D98282]/10'
                  : 'bg-[#141418]/95 border-[rgba(214,188,134,0.3)] shadow-black/80'
              }`}
            >
              {isSuccess ? (
                <AnimatedPaymentCheckmark />
              ) : toast.type === 'error' ? (
                <div className="w-8 h-8 rounded-full bg-[#D98282]/15 border border-[#D98282]/30 flex items-center justify-center flex-shrink-0 text-[#D98282]">
                  <AlertCircle size={18} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#D6BC86]/15 border border-[#D6BC86]/30 flex items-center justify-center flex-shrink-0 text-[#D6BC86]">
                  <Info size={18} strokeWidth={2.5} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  isSuccess ? 'text-[#82D9A3]' : toast.type === 'error' ? 'text-[#D98282]' : 'text-[#D6BC86]'
                }`}>
                  {isSuccess ? 'Payment & Ledger Verified' : toast.type === 'error' ? 'Action Declined' : 'Notification'}
                </p>
                <p className="text-xs sm:text-sm text-[#F5F1E8] font-medium leading-snug mt-0.5 truncate">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded-lg text-[#77736D] hover:text-[#F5F1E8] transition-colors"
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
