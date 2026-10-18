import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overlay-bg absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          {/* Desktop: centered modal, Mobile: bottom sheet */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className={`relative z-10 w-full ${sizeClasses[size]} max-h-[88vh] md:max-h-[85vh] flex flex-col`}
          >
            <div className="bg-[#17171B] md:rounded-2xl rounded-t-3xl border border-[rgba(214,188,134,0.18)] max-h-[88vh] md:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Drag handle for mobile */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(214,188,134,0.1)] flex-shrink-0">
                <h2 className="text-base font-semibold text-[#F5F1E8] font-serif tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-[#77736D] hover:text-[#F5F1E8]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain">
                {children}
              </div>

              {/* Sticky Footer with bottom safe area */}
              {footer && (
                <div className="px-5 py-3.5 pb-6 sm:pb-3.5 bg-[#17171B] border-t border-[rgba(214,188,134,0.1)] flex-shrink-0 bottom-nav-safe">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
};
