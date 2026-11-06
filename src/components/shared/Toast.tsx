import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CircleCheck, CircleAlert, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const ICON = {
  success: { icon: CircleCheck, cls: 'text-mm-positive' },
  error: { icon: CircleAlert, cls: 'text-mm-negative' },
  info: { icon: Info, cls: 'text-mm-accent' },
};

/** Bottom of the screen: above the phone dock, bottom-right on desktop. */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();
  // Portaled so toasts (and their Undo buttons) stay usable while a dialog makes the page inert
  return createPortal(
    <div className="fixed z-[3000] inset-x-3 bottom-[calc(92px+env(safe-area-inset-bottom))] lg:bottom-6 lg:left-auto lg:right-6 lg:w-[380px] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map(t => {
          const { icon: Icon, cls } = ICON[t.type];
          return (
            <motion.div key={t.id} layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              className="pointer-events-auto flex items-center gap-3 pl-3.5 pr-1.5 py-1.5 min-h-[52px] rounded-2xl bg-mm-text text-mm-bg shadow-[0_16px_40px_-12px_rgb(0_0_0/0.4)]"
              role={t.type === 'error' ? 'alert' : 'status'}>
              {t.type === 'success' ? (
                <motion.svg width="22" height="22" viewBox="0 0 24 24" className={`${cls} shrink-0 brightness-150 dark:brightness-75`} initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} aria-hidden>
                  <motion.circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }} />
                  <motion.path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }} />
                </motion.svg>
              ) : <Icon size={19} className={`${cls} shrink-0 brightness-150 dark:brightness-75`} />}
              <p className="flex-1 min-w-0 text-sm font-medium leading-snug py-2">{t.message}</p>
              {t.action && (
                <button onClick={() => { t.action!.onClick(); removeToast(t.id); }} className="h-9 px-3 rounded-xl text-sm font-bold text-mm-bg hover:bg-mm-bg/10 underline-offset-4 hover:underline">
                  {t.action.label}
                </button>
              )}
              <button onClick={() => removeToast(t.id)} className="w-9 h-9 rounded-xl flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-mm-bg/10" aria-label="Dismiss">
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
};
