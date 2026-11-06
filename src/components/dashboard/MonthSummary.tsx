import React, { useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useInsights } from '@/lib/useInsights';
import { addMonths, formatCurrency, getCurrentMonth, percentChange } from '@/lib/utils';
import { Dialog } from '@/components/ui/Dialog';
import { Progress } from '@/components/ui';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';

const R = 26, C = 2 * Math.PI * R;

const Change: React.FC<{ now: number; before: number; goodWhenUp: boolean }> = ({ now, before, goodWhenUp }) => {
  if (before <= 0) return <span className="text-xs text-mm-muted">No data last month</span>;
  const c = percentChange(now, before);
  const good = goodWhenUp ? c >= 0 : c <= 0;
  return <span className={`text-xs font-semibold tabular ${c === 0 ? 'text-mm-muted' : good ? 'text-mm-positive' : 'text-mm-negative'}`}>{c > 0 ? '+' : ''}{c}% vs last month</span>;
};

/** Money in, out and left this month, plus the health score. */
export const MonthSummary: React.FC = () => {
  const { getMonthlyIncome, getMonthlyExpenses } = useApp();
  const { health } = useInsights();
  const [open, setOpen] = useState(false);
  const m = getCurrentMonth(), p = addMonths(m, -1);
  const income = getMonthlyIncome(m), spent = getMonthlyExpenses(m);
  const pIncome = getMonthlyIncome(p), pSpent = getMonthlyExpenses(p);
  const left = income - spent;
  const color = !health.hasEnoughData ? 'var(--color-mm-muted)' : health.total >= 65 ? 'var(--color-mm-positive)' : health.total >= 45 ? 'var(--color-mm-warning)' : 'var(--color-mm-negative)';
  const weakest = [...health.factors].sort((a, b) => a.score / a.max - b.score / b.max)[0];

  const rows = [
    { label: 'Money in', value: income, tone: 'text-mm-positive', change: <Change now={income} before={pIncome} goodWhenUp /> },
    { label: 'Money out', value: spent, tone: 'text-mm-text', change: <Change now={spent} before={pSpent} goodWhenUp={false} /> },
    { label: 'Left over', value: left, tone: left >= 0 ? 'text-mm-text' : 'text-mm-negative', change: income > 0 ? <span className="text-xs text-mm-muted tabular">{Math.round((left / income) * 100)}% of income kept</span> : null },
  ];

  return (
    <section aria-labelledby="month-title" className="panel p-5 sm:p-6 flex flex-col">
      <h2 id="month-title" className="text-[17px] font-semibold text-mm-text">{new Date().toLocaleDateString(undefined, { month: 'long' })} so far</h2>
      <dl className="mt-3 divide-hairline">
        {rows.map(r => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-sm text-mm-text2">{r.label}</dt>
            <dd className="text-right">
              <AnimatedNumber value={r.value} className={`block amount text-lg font-semibold ${r.tone}`} />
              {r.change}
            </dd>
          </div>
        ))}
      </dl>
      <button onClick={() => setOpen(true)} className="mt-auto pt-3 -mx-2 px-2 py-2 rounded-xl flex items-center gap-3.5 text-left hover:bg-mm-text/[0.035] transition-colors">
        <span className="relative w-[60px] h-[60px] shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="currentColor" strokeWidth="6" className="text-mm-text/8" />
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="6" strokeLinecap="round" stroke={color} strokeDasharray={C}
              strokeDashoffset={C * (1 - (health.hasEnoughData ? health.total : 0) / 100)} className="mm-ring" style={{ ['--mm-ring-full' as string]: C }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center amount text-lg font-semibold text-mm-text">{health.hasEnoughData ? health.total : '–'}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] text-mm-muted">Financial health</span>
          <span className="block text-[15px] font-semibold" style={{ color }}>{health.grade}</span>
          <span className="block text-xs text-mm-muted truncate">
            {!health.hasEnoughData ? 'Needs a few weeks of entries' : weakest && weakest.score < weakest.max ? `Improve: ${weakest.label.toLowerCase()}` : 'Every area looks good'}
          </span>
        </span>
        <ChevronRight size={18} className="text-mm-muted" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={health.hasEnoughData ? `Health score: ${health.total} of 100` : 'Health score'}
        description={health.hasEnoughData ? 'Four things that make finances resilient. Each is scored from your own entries.' : 'The score becomes reliable after a few weeks of entries. Here’s how it’s worked out.'}>
        <div className="space-y-4 pb-2">
          {health.factors.map(f => (
            <div key={f.id}>
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-semibold text-mm-text">{f.label}</span>
                <span className="text-sm text-mm-muted tabular">{f.score} / {f.max}</span>
              </div>
              <Progress value={(f.score / f.max) * 100} className="mt-2" label={f.label} />
              <p className="text-sm text-mm-text2 mt-2">{f.detail}</p>
              <p className="text-[13px] text-mm-muted mt-1 flex gap-1.5"><Info size={14} className="shrink-0 mt-0.5" />{f.tip}</p>
            </div>
          ))}
        </div>
      </Dialog>
    </section>
  );
};
