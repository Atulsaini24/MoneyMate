import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import { useInsights } from '@/lib/useInsights';
import { useUI } from '@/context/UIContext';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { formatCurrency } from '@/lib/utils';

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

const gradeColor = (score: number, enough: boolean) =>
  !enough ? 'var(--color-mm-muted)' : score >= 65 ? 'var(--color-mm-positive)' : score >= 45 ? 'var(--color-mm-gold)' : 'var(--color-mm-negative)';

/**
 * The dashboard's lead card: a health score you can unpack, next to the one
 * number people actually act on — how much they can spend today.
 */
export const FinancialPulse: React.FC = () => {
  const { health, forecast } = useInsights();
  const { openAddSheet } = useUI();
  const [open, setOpen] = useState(false);
  const color = gradeColor(health.total, health.hasEnoughData);

  const income = forecast.income;
  const pct = (n: number) => (income > 0 ? Math.min(100, (n / income) * 100) : 0);
  const spentPct = pct(forecast.spent);
  const billsPct = Math.min(100 - spentPct, pct(forecast.upcomingBills));
  const todayPct = (forecast.dayOfMonth / forecast.totalDays) * 100;
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <section
      aria-label="Financial pulse"
      className="relative overflow-hidden rounded-[22px] border border-mm-line/18"
    >
      {/* Brand photography sits behind the numbers instead of beside them */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: 'url(/assets/moneymate/hero/dashboard-hero.jpg)', backgroundPosition: 'center 35%' }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-mm-bg via-mm-bg/90 to-mm-bg/70" aria-hidden />

      <div className="relative grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 md:gap-0 p-5 sm:p-6">
        {/* Health score */}
        <div className="flex items-center gap-5 md:pr-6 md:border-r md:border-mm-line/12">
          <div className="relative w-[118px] h-[118px] shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-mm-text/8" />
              <circle
                cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="8" strokeLinecap="round"
                stroke={color}
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - health.total / 100)}
                className="mm-ring"
                style={{ ['--mm-ring-full' as string]: CIRC, transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedNumber value={health.total} format={n => String(n)} className="font-serif text-4xl text-mm-text leading-none number-display" />
              <span className="text-[10px] text-mm-muted mt-1">of 100</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-mm-text2">Financial health</p>
            <p className="text-xl font-semibold mt-0.5" style={{ color }}>{health.grade}</p>
            <p className="text-xs text-mm-muted mt-1 leading-relaxed">
              {!health.hasEnoughData
                ? 'Add a few weeks of transactions for a reliable score.'
                : health.factors.every(f => f.score === f.max)
                ? 'Every area is in great shape.'
                : `Weakest area: ${[...health.factors].sort((a, b) => a.score / a.max - b.score / b.max)[0].label.toLowerCase()}.`}
            </p>
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-mm-gold hover:text-mm-gold-light"
            >
              {open ? 'Hide breakdown' : 'See breakdown'}
              <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Safe to spend */}
        <div className="md:pl-6 flex flex-col justify-center">
          {income > 0 ? (
            <>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <p className="text-xs text-mm-text2">Safe to spend today</p>
                <p className="text-[11px] text-mm-muted">{forecast.daysLeft} days left in the month</p>
              </div>
              <AnimatedNumber
                value={forecast.safeToSpendDaily}
                className="block text-4xl sm:text-[2.75rem] font-semibold tracking-tight text-mm-text number-display mt-1 leading-tight"
              />

              {/* Where this month's income is going */}
              <div className="mt-4">
                <div className="relative h-2.5 rounded-full bg-mm-text/8 overflow-hidden flex" role="img"
                  aria-label={`Spent ${Math.round(spentPct)}% of income, ${Math.round(billsPct)}% reserved for bills`}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${spentPct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className={spentPct > todayPct + 10 ? 'bg-mm-negative' : 'bg-mm-gold'} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${billsPct}%` }} transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-mm-gold/35" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 3px, rgba(0,0,0,.18) 3px 6px)' }} />
                  <span className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-mm-text/70 rounded" style={{ left: `${todayPct}%` }} title="Today" />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-mm-muted">
                  <span><i className="inline-block w-2 h-2 rounded-full bg-mm-gold mr-1.5 align-middle" />Spent {formatCurrency(forecast.spent)}</span>
                  {forecast.upcomingBills > 0 && <span><i className="inline-block w-2 h-2 rounded-full bg-mm-gold/40 mr-1.5 align-middle" />Bills due {formatCurrency(forecast.upcomingBills)}</span>}
                  <span className="ml-auto">
                    Income {formatCurrency(income)}{forecast.incomeIsEstimate && <span title="Based on your average of the last 3 months"> (usual)</span>}
                  </span>
                </div>
              </div>

              <p className={`text-xs mt-3 ${forecast.projectedNet >= 0 ? 'text-mm-positive' : 'text-mm-negative'}`}>
                {forecast.projectedNet >= 0
                  ? `On pace to save ${formatCurrency(forecast.projectedNet)} by ${monthEnd}.`
                  : `On pace to overspend by ${formatCurrency(-forecast.projectedNet)} by ${monthEnd}.`}
              </p>
            </>
          ) : (
            <div>
              <p className="text-xs text-mm-text2">Safe to spend today</p>
              <p className="text-sm text-mm-text mt-2 leading-relaxed max-w-sm">
                Add this month’s income and MoneyMate will work out a daily spending allowance that still covers your bills.
              </p>
              <button onClick={() => openAddSheet({ type: 'income' })}
                className="mt-3 px-4 py-2 rounded-xl bg-mm-gold text-mm-on-gold text-xs font-semibold hover:bg-mm-gold-light">
                Add income
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 px-5 sm:px-6 pb-5 sm:pb-6">
              {health.factors.map(f => (
                <div key={f.id} className="rounded-xl bg-mm-bg2/80 border border-mm-line/10 p-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-mm-text">{f.label}</span>
                    <span className="text-xs text-mm-muted number-display">{f.score}/{f.max}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-mm-text/8 mt-2 overflow-hidden">
                    <div className="h-full rounded-full bg-mm-gold" style={{ width: `${(f.score / f.max) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-mm-text2 mt-2 leading-snug">{f.detail}</p>
                  <p className="text-[11px] text-mm-muted mt-1 leading-snug flex gap-1"><Info size={11} className="shrink-0 mt-0.5" />{f.tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
