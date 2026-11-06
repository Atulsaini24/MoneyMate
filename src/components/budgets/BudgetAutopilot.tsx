import React, { useMemo, useState } from 'react';
import { Wand2, Copy, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { suggestBudgets, carryOverBudgets } from '@/lib/autopilot';
import { formatCurrency, generateId, getMonthName, cn } from '@/lib/utils';
import { Button } from '@/components/ui';

/** Suggests budgets from recent spending, and carries last month's forward. */
export const BudgetAutopilot: React.FC<{ month: string }> = ({ month }) => {
  const { transactions, budgets, mutate, showToast } = useApp();
  const suggestions = useMemo(() => suggestBudgets(transactions, month, budgets), [transactions, month, budgets]);
  const carry = useMemo(() => carryOverBudgets(month, budgets), [month, budgets]);
  const [off, setOff] = useState<Set<string>>(new Set());
  if (!suggestions.length && !carry.length) return null;

  const picked = suggestions.filter(s => !off.has(s.category));
  const apply = (list: { category: string; limit: number }[]) => {
    mutate(s => ({ ...s, budgets: [...s.budgets, ...list.map(b => ({ id: generateId(), category: b.category, limit: b.limit, month, alertThreshold: 80 }))] }));
    showToast(`${list.length} budget${list.length === 1 ? '' : 's'} set for ${getMonthName(month)}`);
    setOff(new Set());
  };

  return (
    <section className="panel p-5 sm:p-6 mb-5" aria-labelledby="autopilot-title">
      <div className="flex flex-wrap items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-mm-accent/10 text-mm-accent flex items-center justify-center shrink-0"><Wand2 size={19} /></span>
        <div className="flex-1 min-w-[200px]">
          <h2 id="autopilot-title" className="text-[17px] font-semibold text-mm-text">Suggested budgets</h2>
          <p className="text-sm text-mm-text2 mt-0.5">
            {suggestions.length ? 'Suggested from what you’ve spent over the last 3 months. Untick any you don’t want.' : 'Use the same limits as last month.'}
          </p>
        </div>
        {carry.length > 0 && <Button variant="secondary" icon={Copy} onClick={() => apply(carry)}>Copy last month ({carry.length})</Button>}
      </div>
      {suggestions.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
            {suggestions.map(s => {
              const on = !off.has(s.category);
              return (
                <button key={s.category} role="checkbox" aria-checked={on}
                  onClick={() => setOff(prev => { const n = new Set(prev); n.has(s.category) ? n.delete(s.category) : n.add(s.category); return n; })}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-colors', on ? 'border-mm-accent/40 bg-mm-accent/[0.05]' : 'border-mm-line/10')}>
                  <span className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0', on ? 'bg-mm-accent text-mm-on-accent' : 'border-2 border-mm-line/25')}>{on && <Check size={13} strokeWidth={3} />}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-mm-text truncate">{s.category}</span>
                    <span className="block text-xs text-mm-muted">Usually {formatCurrency(s.average)}</span>
                  </span>
                  <span className="amount font-semibold text-mm-text">{formatCurrency(s.limit)}</span>
                </button>
              );
            })}
          </div>
          <Button className="mt-4" onClick={() => apply(picked)} disabled={!picked.length}>Set {picked.length} budget{picked.length === 1 ? '' : 's'}</Button>
        </>
      )}
    </section>
  );
};
