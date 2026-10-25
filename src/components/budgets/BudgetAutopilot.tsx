import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wand2, Copy, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { suggestBudgets, carryOverBudgets } from '@/lib/autopilot';
import { formatCurrency, generateId } from '@/lib/utils';
import { confetti } from '@/lib/fx';

/** Suggests budgets from recent spending, and carries last month's forward. */
export const BudgetAutopilot: React.FC<{ month: string }> = ({ month }) => {
  const { transactions, budgets, mutate, showToast } = useApp();
  const suggestions = useMemo(() => suggestBudgets(transactions, month, budgets), [transactions, month, budgets]);
  const carry = useMemo(() => carryOverBudgets(month, budgets), [month, budgets]);
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const on = (c: string) => (picked ? picked.has(c) : true);

  if (!suggestions.length && !carry.length) return null;

  const apply = (list: { category: string; limit: number }[]) => {
    mutate(s => ({ ...s, budgets: [...s.budgets, ...list.map(b => ({ id: generateId(), category: b.category, limit: b.limit, month }))] }));
    confetti({ count: 70 });
    showToast(`${list.length} budget${list.length === 1 ? '' : 's'} set for this month`);
    setPicked(null);
  };

  return (
    <AnimatePresence>
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="relative overflow-hidden rounded-[22px] border border-mm-gold/30 p-5"
        style={{ background: 'linear-gradient(120deg, color-mix(in oklab, var(--color-mm-gold) 12%, var(--color-mm-card)), var(--color-mm-card) 60%)' }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-mm-gold/15 text-mm-gold flex items-center justify-center shrink-0"><Wand2 size={18} /></span>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-mm-text">Budget autopilot</h2>
            <p className="text-xs text-mm-text2 mt-0.5">
              {carry.length ? `Carry last month’s ${carry.length} budget${carry.length === 1 ? '' : 's'} forward, or` : 'Based on'} your last 3 months of spending{carry.length ? ', use suggestions below.' : ', here’s a starting point.'}
            </p>
          </div>
          {carry.length > 0 && (
            <button onClick={() => apply(carry)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-mm-line/25 text-xs font-semibold text-mm-text hover:border-mm-gold/60 shrink-0">
              <Copy size={13} /> Copy last month
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
              {suggestions.map(s => (
                <button key={s.category} onClick={() => setPicked(p => { const n = new Set(p ?? suggestions.map(x => x.category)); n.has(s.category) ? n.delete(s.category) : n.add(s.category); return n; })}
                  aria-pressed={on(s.category)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${on(s.category) ? 'border-mm-gold/40 bg-mm-bg2' : 'border-mm-line/10 opacity-50'}`}>
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${on(s.category) ? 'bg-mm-gold text-mm-on-gold' : 'border border-mm-line/40'}`}>{on(s.category) && <Check size={12} strokeWidth={3} />}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-mm-text truncate">{s.category}</span>
                    <span className="block text-[11px] text-mm-muted">You usually spend {formatCurrency(s.average)}</span>
                  </span>
                  <span className="text-sm font-semibold text-mm-text number-display">{formatCurrency(s.limit)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => apply(suggestions.filter(s => on(s.category)))} disabled={!suggestions.some(s => on(s.category))}
              className="mt-3 px-4 py-2 rounded-xl bg-mm-gold text-mm-on-gold text-xs font-semibold hover:bg-mm-gold-light disabled:opacity-40">
              Set {suggestions.filter(s => on(s.category)).length} budgets
            </button>
          </>
        )}
      </motion.section>
    </AnimatePresence>
  );
};
