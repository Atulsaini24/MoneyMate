import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, description,
  confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default'
}) => {
  const displayMessage = message || description || '';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overlay-bg absolute inset-0"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="glass-card-elevated p-6 max-w-sm w-full relative z-10 border border-mm-line/18"
          >
            <div className="flex items-start gap-3 mb-4">
              {variant === 'danger' && (
                <div className="p-2 rounded-xl bg-mm-negative/10 border border-mm-negative/20 flex-shrink-0">
                  <AlertTriangle size={18} className="text-mm-negative" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-mm-text">{title}</h3>
                <p className="text-xs text-mm-text2 mt-1 leading-relaxed">{displayMessage}</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 hover:bg-mm-text/5 rounded-lg transition-colors text-mm-muted hover:text-mm-text"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2.5 justify-end pt-2">
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-mm-text2 hover:text-mm-text hover:bg-mm-text/5 transition-colors border border-transparent"
              >
                {cancelText}
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                  variant === 'danger'
                    ? 'bg-mm-negative/15 text-mm-negative border border-mm-negative/30 hover:bg-mm-negative/25'
                    : 'bg-mm-gold text-mm-on-gold hover:bg-mm-gold-light shadow-sm'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

