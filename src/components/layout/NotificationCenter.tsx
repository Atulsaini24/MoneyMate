import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { InsightList } from '@/components/dashboard/InsightList';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui';

const SEEN_KEY = 'moneymate:seen-insights';
const isPhone = () => window.matchMedia('(max-width: 639px)').matches;

/** Bell with a badge for unseen warnings. Popover on desktop, sheet on phones. */
export const NotificationCenter: React.FC<{ compact?: boolean }> = () => {
  const { insights } = useInsights();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
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
    if (phone) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, insights, phone]);

  const body = insights.length
    ? <InsightList insights={insights} onNavigate={() => setOpen(false)} />
    : <EmptyState compact icon={BellOff} title="You’re all caught up" description="Budget warnings, bills due soon and overdue IOUs show up here." />;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setPhone(isPhone()); setOpen(o => !o); }}
        className="relative w-10 h-10 inline-flex items-center justify-center rounded-xl text-mm-text2 hover:text-mm-text hover:bg-mm-text/[0.06] transition-colors"
        aria-label={unseen ? `Notifications, ${unseen} new` : 'Notifications'} aria-expanded={open}>
        <Bell size={19} strokeWidth={1.9} />
        {unseen > 0 && (
          <span className="absolute top-0.5 right-0 min-w-[17px] h-[17px] px-1 rounded-full bg-mm-negative text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-mm-bg tabular">{unseen}</span>
        )}
      </button>
      {phone ? (
        <Dialog open={open} onClose={() => setOpen(false)} title="Notifications">{body}</Dialog>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[400px] max-h-[70vh] overflow-y-auto panel-raised rounded-[20px] border border-mm-line/10 p-4 z-50"
              role="dialog" aria-label="Notifications">
              <h2 className="text-base font-semibold text-mm-text mb-1 px-1">Notifications</h2>
              {body}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
