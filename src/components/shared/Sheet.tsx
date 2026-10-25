import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

/** Bottom sheet on phones, centred dialog on larger screens. */
export const Sheet: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ open, onClose, title, children, footer, wide }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="overlay-bg absolute inset-0" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92vh] flex flex-col glass-card-elevated rounded-b-none sm:rounded-[22px]`}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-base font-semibold text-mm-text">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-mm-text/5 text-mm-muted" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="px-5 pb-5 overflow-y-auto">{children}</div>
            {footer && <div className="px-5 py-4 border-t border-mm-line/10 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const inputCls = 'w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/15 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/60 focus:ring-4 focus:ring-mm-gold/10 transition-all';
export const btnPrimary = 'px-4 py-2.5 rounded-xl bg-mm-gold text-mm-on-gold text-sm font-semibold hover:bg-mm-gold-light active:scale-[0.98] transition-all disabled:opacity-50';
export const btnGhost = 'px-4 py-2.5 rounded-xl border border-mm-line/20 text-sm text-mm-text hover:border-mm-gold/50 transition-all';

export const PageHeader: React.FC<{ title: string; subtitle: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
    <div>
      <h1 className="text-2xl md:text-[2rem] font-serif text-mm-text tracking-tight">{title}</h1>
      <p className="text-sm text-mm-text2 mt-1 max-w-xl">{subtitle}</p>
    </div>
    {action}
  </header>
);
