import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { useUI } from '@/context/UIContext';
import { RollingNumber } from '@/components/motion';
import { MoneyCanvas } from '@/components/three/MoneyCanvas';
import { Guilloche } from '@/components/ui/Guilloche';
import { formatCurrency } from '@/lib/utils';

/**
 * The one number people act on: how much they can spend today and still
 * cover the bills left this month. Styled like a banknote on purpose.
 */
export const SafeToSpend: React.FC = () => {
  const { forecast } = useInsights();
  const { openAddSheet } = useUI();
  const now = new Date();
  const monthName = now.toLocaleDateString(undefined, { month: 'long' });
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  const income = forecast.income;
  const pct = (n: number) => (income > 0 ? Math.min(100, (n / income) * 100) : 0);
  const spentPct = pct(forecast.spent);
  const billsPct = Math.min(100 - spentPct, pct(forecast.upcomingBills));
  const todayPct = (forecast.dayOfMonth / forecast.totalDays) * 100;
  const ahead = forecast.projectedNet < 0;
  // Share of this month's income not yet spent or set aside for bills: the coin stack's height
  const free = income > 0 ? Math.max(0, Math.min(1, (income - forecast.spent - forecast.upcomingBills) / income)) : 0;

  return (
    <section aria-labelledby="sts-title" className="note-panel p-5 sm:p-7 min-h-[260px] h-full flex flex-col">
      <Guilloche className="guilloche-draw absolute inset-y-0 right-0 w-[85%] h-full text-[var(--color-mm-note-text)] opacity-[0.08] -z-10" />
      <MoneyCanvas mode={income > 0 ? 'stack' : 'coin'} value={free} maxCoins={10}
        label={income > 0 ? `Coin stack: ${Math.round(free * 100)}% of this month’s income is still free` : undefined}
        className="absolute right-0 top-11 w-[36%] h-[112px] sm:top-6 sm:right-4 sm:w-[38%] sm:h-[230px] z-0" />

      {income > 0 ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <h2 id="sts-title" className="text-[15px] font-medium text-[var(--color-mm-note-muted)] font-sans tracking-normal">Safe to spend today</h2>
            <span className="relative z-10 text-[13px] text-[var(--color-mm-note-muted)] text-right">{forecast.daysLeft} day{forecast.daysLeft === 1 ? '' : 's'} left in {monthName}</span>
          </div>
          <RollingNumber text={formatCurrency(Math.round(forecast.safeToSpendDaily))}
            className="relative z-10 amount font-semibold text-[3.25rem] sm:text-[4.25rem] mt-3 text-[var(--color-mm-marigold)] drop-shadow-[0_6px_24px_rgb(245_196_81/0.25)]" />
          <p className="relative z-10 text-[13px] text-[var(--color-mm-note-muted)] mt-2">a day until {monthEnd}</p>

          <div className="relative z-10 mt-auto pt-7">
            <div className="relative h-2.5 rounded-full bg-white/12 flex overflow-hidden" role="img"
              aria-label={`${Math.round(spentPct)}% of income spent, ${Math.round(billsPct)}% set aside for bills`}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${spentPct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className={ahead ? 'bg-[#F08A74]' : 'bg-[var(--color-mm-note-text)]'} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${billsPct}%` }} transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgb(232 241 238 / 0.55) 0 3px, transparent 3px 6px)' }} />
            </div>
            <div className="relative h-0">
              <span className="absolute -top-[15px] w-0.5 h-[18px] bg-[var(--color-mm-marigold)] rounded" style={{ left: `calc(${todayPct}% - 1px)` }} title="Today" />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[13px] text-[var(--color-mm-note-muted)]">
              <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[var(--color-mm-note-text)]" />Spent <b className="font-semibold text-[var(--color-mm-note-text)] tabular">{formatCurrency(forecast.spent)}</b></span>
              {forecast.upcomingBills > 0 && <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-white/50" />Bills due <b className="font-semibold text-[var(--color-mm-note-text)] tabular">{formatCurrency(forecast.upcomingBills)}</b></span>}
              <span className="flex items-center gap-1.5">Income <b className="font-semibold text-[var(--color-mm-note-text)] tabular">{formatCurrency(income)}</b>{forecast.incomeIsEstimate && <span title="Your average over the last 3 months, until this month’s income arrives">(usual)</span>}</span>
            </div>
            <p className={`text-sm font-medium mt-3 ${forecast.projectedNet >= 0 ? 'text-[#8FE0B5]' : 'text-[#F5A18F]'}`}>
              {forecast.projectedNet >= 0
                ? `On pace to save ${formatCurrency(forecast.projectedNet)} by ${monthEnd}`
                : `On pace to overspend by ${formatCurrency(-forecast.projectedNet)} by ${monthEnd}`}
            </p>
          </div>
        </>
      ) : (
        <div className="relative z-10 flex flex-col h-full max-w-[62%] sm:max-w-none">
          <h2 id="sts-title" className="text-[15px] font-medium text-[var(--color-mm-note-muted)] font-sans tracking-normal">Safe to spend today</h2>
          <p className="font-display text-2xl sm:text-[1.75rem] leading-tight font-semibold mt-3 max-w-md">
            Add this month’s income and you’ll see a daily allowance that still covers your bills.
          </p>
          <div className="mt-auto pt-6">
            <button onClick={() => openAddSheet({ type: 'income' })}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[var(--color-mm-marigold)] text-[#2A1C00] text-[15px] font-semibold hover:brightness-105 active:scale-[0.98] transition">
              <Plus size={18} strokeWidth={2.4} /> Add income
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
