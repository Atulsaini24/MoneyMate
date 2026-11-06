import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/ui';

/*
 * One dialog for the whole app: a bottom sheet on phones, a centred panel on
 * larger screens. Portaled to <body>, closes on Escape (top-most only), locks
 * page scroll while open and returns focus to whatever opened it.
 */

const stack: string[] = [];
let locks = 0;

// While any dialog is open the page behind it is scroll-locked and inert, so
// screen readers and the Tab key stay inside the dialog.
function lockScroll() {
  if (locks++ === 0) {
    const w = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (w > 0) document.body.style.paddingRight = `${w}px`;
    document.getElementById('root')?.setAttribute('inert', '');
  }
}
function unlockScroll() {
  if (--locks <= 0) {
    locks = 0;
    document.body.style.overflow = ''; document.body.style.paddingRight = '';
    document.getElementById('root')?.removeAttribute('inert');
  }
}

const useIsPhone = () => {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
};

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Hide the title row (for custom headers); the title is still announced. */
  bare?: boolean;
  className?: string;
}

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-2xl' };

export const Dialog: React.FC<DialogProps> = ({ open, onClose, title, description, children, footer, size = 'md', bare, className }) => {
  const id = useId();
  const phone = useIsPhone();
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const startDrag = (e: React.PointerEvent) => { if (phone) drag.start(e); };
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    stack.push(id);
    lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab' && stack[stack.length - 1] === id && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    // Focus the first field marked autoFocus, otherwise the panel itself
    const t = setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], [autofocus]');
      (target || panelRef.current)?.focus({ preventScroll: true });
    }, 30);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      unlockScroll();
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, id]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
          <motion.div className="overlay-bg absolute inset-0" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={phone ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={phone ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={phone ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={phone ? { type: 'spring', stiffness: 420, damping: 40 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            drag={phone ? 'y' : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose(); }}
            className={cn(
              'relative w-full flex flex-col bg-mm-elevated outline-none',
              'rounded-t-[26px] sm:rounded-[22px] max-h-[92dvh] sm:max-h-[86vh]',
              'shadow-[0_-12px_40px_-12px_rgb(0_0_0/0.25)] sm:shadow-[0_30px_80px_-24px_rgb(0_0_0/0.45)]',
              'border border-mm-line/10',
              widths[size], className,
            )}>
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 cursor-grab touch-none" aria-hidden onPointerDown={startDrag}><span className="w-10 h-1.5 rounded-full bg-mm-text/15" /></div>
            {bare ? (
              <h2 id={`${id}-t`} className="sr-only">{title}</h2>
            ) : (
              <div className="flex items-start gap-3 px-5 sm:px-6 pt-3 sm:pt-5 pb-3" onPointerDown={startDrag}>
                <div className="flex-1 min-w-0">
                  <h2 id={`${id}-t`} className="text-lg font-semibold text-mm-text leading-snug">{title}</h2>
                  {description && <p className="text-sm text-mm-text2 mt-1 leading-relaxed">{description}</p>}
                </div>
                <IconButton label="Close" icon={X} size="sm" onClick={onClose} className="-mr-1.5 -mt-0.5" />
              </div>
            )}
            {children && (
              <div className={cn('flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6', footer ? 'pb-4' : 'pb-6 safe-bottom', bare && 'pt-1')}>
                {children}
              </div>
            )}
            {footer && (
              <div className="px-5 sm:px-6 pt-3 safe-bottom sm:pb-5 border-t border-mm-line/8 bg-mm-elevated rounded-b-[22px]">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

/** Two-button footer: secondary on the left, primary filling the rest. */
export const DialogActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 [&>*:last-child]:flex-1">{children}</div>
);

export const ConfirmDialog: React.FC<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message?: string; description?: string;
  confirmText?: string; cancelText?: string; variant?: 'danger' | 'default';
}> = ({ isOpen, onClose, onConfirm, title, message, description, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default' }) => (
  <Dialog open={isOpen} onClose={onClose} size="sm" bare title={title}
    footer={
      <DialogActions>
        <Button variant="secondary" size="lg" onClick={onClose}>{cancelText}</Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} size="lg" data-autofocus
          className={variant === 'danger' ? 'bg-mm-negative text-white hover:bg-mm-negative hover:brightness-110' : ''}
          onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </DialogActions>
    }>
    <div className="pt-4 sm:pt-6 pb-1 flex gap-3.5">
      {variant === 'danger' && (
        <span className="w-10 h-10 rounded-xl bg-mm-negative/10 text-mm-negative flex items-center justify-center shrink-0"><TriangleAlert size={19} /></span>
      )}
      <div>
        <p className="text-[17px] font-semibold text-mm-text font-display">{title}</p>
        {(message || description) && <p className="text-sm text-mm-text2 mt-1 leading-relaxed">{message || description}</p>}
      </div>
    </div>
  </Dialog>
);
