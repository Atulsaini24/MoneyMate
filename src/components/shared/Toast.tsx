import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  const iconMap = {
    success: <CheckCircle size={18} className="text-mm-positive" />,
    error: <AlertCircle size={18} className="text-mm-negative" />,
    info: <Info size={18} className="text-mm-mint" />,
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="glass-card-elevated flex items-center gap-3 px-4 py-3 pr-3"
          >
            {iconMap[toast.type]}
            <p className="text-sm text-mm-text flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Close notification"
            >
              <X size={14} className="text-mm-muted" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
