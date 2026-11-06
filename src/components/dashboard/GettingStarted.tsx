import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { getCurrentMonth } from '@/lib/utils';
import { cn } from '@/lib/utils';

/** First-run checklist, worked out from what the person has actually done. Hides itself when complete. */
export const GettingStarted: React.FC = () => {
  const { transactions, budgets, goals, settings, updateSettings } = useApp();
  const { openAddSheet } = useUI();
  const navigate = useNavigate();
  const month = getCurrentMonth();
  const steps = [
    { done: transactions.some(t => t.type === 'income'), title: 'Add your income', text: 'So MoneyMate can work out what’s safe to spend each day.', run: () => openAddSheet({ type: 'income' }) },
    { done: transactions.some(t => t.type === 'expense'), title: 'Record a few expenses', text: 'Add them by hand, or paste bank SMS to catch up fast.', run: () => openAddSheet({ type: 'expense' }) },
    { done: budgets.some(b => b.month === month), title: 'Set a budget', text: 'Pick a category you want to keep in check this month.', run: () => navigate('/budgets') },
    { done: goals.length > 0, title: 'Start a savings goal', text: 'A trip, a gadget or an emergency fund.', run: () => navigate('/goals') },
  ];
  const doneCount = steps.filter(s => s.done).length;
  if (settings.onboardingDismissed || doneCount === steps.length) return null;

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="start-title">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 id="start-title" className="text-[17px] font-semibold text-mm-text">Get set up</h2>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="w-28 h-1.5 rounded-full bg-mm-text/8 overflow-hidden">
              <motion.div className="h-full rounded-full bg-mm-positive" initial={{ width: 0 }} animate={{ width: `${(doneCount / steps.length) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
            </div>
            <p className="text-[13px] text-mm-muted">{doneCount} of {steps.length} done</p>
          </div>
        </div>
        <button onClick={() => updateSettings({ onboardingDismissed: true }, { silent: true })} className="text-[13px] font-medium text-mm-muted hover:text-mm-text">Hide</button>
      </div>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {steps.map((s, i) => (
          <li key={s.title}>
            <button onClick={s.run} disabled={s.done}
              className={cn('w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-colors', s.done ? 'bg-mm-bg2/60' : 'bg-mm-bg2 hover:bg-mm-text/[0.07]')}>
              <span className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold',
                s.done ? 'bg-mm-positive text-white' : 'bg-mm-card text-mm-text2 border border-mm-line/15')}>
                {s.done ? <motion.span initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}><Check size={15} strokeWidth={3} /></motion.span> : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className={cn('block text-[15px] font-semibold', s.done ? 'text-mm-muted line-through decoration-1' : 'text-mm-text')}>{s.title}</span>
                {!s.done && <span className="block text-[13px] text-mm-text2 mt-0.5 leading-snug">{s.text}</span>}
              </span>
              {!s.done && <ChevronRight size={17} className="text-mm-muted mt-1 shrink-0" />}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
};
