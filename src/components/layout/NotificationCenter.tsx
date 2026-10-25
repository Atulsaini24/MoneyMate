import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { InsightList } from '@/components/dashboard/InsightList';

const SEEN_KEY = 'moneymate:seen-insights';

/** Bell + popover listing alerts. The badge counts unseen warnings only. */
export const NotificationCenter: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { insights } = useInsights();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
  });
  const ref = useRef<HTMLDivElement>(null);

  const important = useMemo(() => insights.filter(i => i.tone === 'alert' || i.tone === 'warn'), [insights]);
  const unseen = important.filter(i => !seen.includes(i.id)).length;

  useEffect(() => {
    if (!open) return;
    const ids = insights.map(i => i.id);
    setSeen(ids);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)); } catch { /* storage full */ }
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, insights]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative ${compact ? 'p-2 rounded-xl bg-mm-bg2 border border-mm-line/12' : 'p-2 rounded-lg hover:bg-mm-bg2'} text-mm-text2 hover:text-mm-text transition-colors`}
        aria-label={unseen ? `Notifications, ${unseen} new` : 'Notifications'}
        aria-expanded={open}
      >
        <Bell size={compact ? 15 : 16} strokeWidth={1.75} />
        {unseen > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-mm-negative text-[10px] font-semibold text-white flex items-center justify-center">
            {unseen}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-full sm:mt-2 sm:w-96 glass-card-elevated p-4 z-50 max-h-[70vh] overflow-y-auto"
            role="dialog" aria-label="Notifications"
          >
            <h2 className="text-sm font-semibold text-mm-text mb-1">Notifications</h2>
            {insights.length ? (
              <InsightList insights={insights} onNavigate={() => setOpen(false)} dense />
            ) : (
              <p className="text-sm text-mm-text2 py-6 text-center">You're all caught up.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
