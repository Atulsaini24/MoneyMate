import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChartColumn, TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApp } from '@/context/AppContext';
import { addMonths, formatAxis, formatCurrency, getCurrentMonth, getMonthName, percentChange, cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, categoryInfo } from '@/types';
import { SpendingHeatmap } from '@/components/reports/SpendingHeatmap';
import { SubscriptionsPanel } from '@/components/reports/SubscriptionsPanel';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { EmptyState, IconButton, Page, PageHeader, Segmented, Stat, Button } from '@/components/ui';

type Tab = 'overview' | 'categories' | 'calendar' | 'subscriptions';
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' }, { value: 'categories', label: 'Categories' },
  { value: 'calendar', label: 'Calendar' }, { value: 'subscriptions', label: 'Bills' },
];

export const ReportsPage: React.FC = () => {
  const { transactions, getCategorySpending, getMonthlyIncome, getMonthlyExpenses } = useApp();
  const [params, setParams] = useSearchParams();
  const tab: Tab = (TABS.find(t => t.value === params.get('tab'))?.value) || 'overview';
  const current = getCurrentMonth();
  const month = /^\d{4}-\d{2}$/.test(params.get('month') || '') ? params.get('month')! : current;
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v === null ? next.delete(k) : next.set(k, v);
    setParams(next, { replace: true });
  };
  const monthScoped = tab === 'overview' || tab === 'categories';
  const prev = addMonths(month, -1);

  const income = getMonthlyIncome(month), spent = getMonthlyExpenses(month);
  const saved = income - spent;
  const rate = income > 0 ? Math.round((saved / income) * 100) : null;

  const trend = useMemo(() => Array.from({ length: 6 }, (_, k) => {
    const m = addMonths(month, k - 5);
    const [y, mo] = m.split('-').map(Number);
    return { month: new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'short' }), Income: getMonthlyIncome(m), Spending: getMonthlyExpenses(m) };
  }), [month, getMonthlyIncome, getMonthlyExpenses]);

  const cats = useMemo(() => EXPENSE_CATEGORIES.map(c => ({ name: c.name, now: getCategorySpending(month, c.name), before: getCategorySpending(prev, c.name) }))
    .filter(c => c.now > 0 || c.before > 0).sort((a, b) => b.now - a.now), [month, prev, getCategorySpending]);
  const maxCat = Math.max(1, ...cats.map(c => c.now));
  const movers = [...cats].filter(c => c.before > 0 || c.now > 0).sort((a, b) => Math.abs(b.now - b.before) - Math.abs(a.now - a.before)).slice(0, 4);

  return (
    <Page>
      <PageHeader title="Analytics" subtitle="Where your money comes from, where it goes, and how that’s changing." />

      {transactions.length === 0 ? (
        <div className="panel"><EmptyState icon={ChartColumn} title="Nothing to analyse yet" description="Charts and trends appear here once you’ve added a few transactions." /></div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              <Segmented label="Report" value={tab} onChange={v => set({ tab: v === 'overview' ? null : v })} options={TABS} />
            </div>
            {monthScoped && (
              <div className="flex items-center gap-1">
                <IconButton label="Previous month" icon={ChevronLeft} onClick={() => set({ month: addMonths(month, -1) })} />
                <span className="text-[15px] font-semibold text-mm-text min-w-[140px] text-center">{getMonthName(month)}</span>
                <IconButton label="Next month" icon={ChevronRight} onClick={() => set({ month: addMonths(month, 1) })} disabled={month >= current} />
              </div>
            )}
          </div>

          {monthScoped && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Stat className="panel p-4" label="Income" value={formatCurrency(income)} tone="positive"
                hint={getMonthlyIncome(prev) > 0 ? `${percentChange(income, getMonthlyIncome(prev))}% vs ${getMonthName(prev).split(' ')[0]}` : undefined} />
              <Stat className="panel p-4" label="Spending" value={formatCurrency(spent)}
                hint={getMonthlyExpenses(prev) > 0 ? `${percentChange(spent, getMonthlyExpenses(prev))}% vs ${getMonthName(prev).split(' ')[0]}` : undefined} />
              <Stat className="panel p-4" label="Saved" value={`${saved < 0 ? '−' : ''}${formatCurrency(Math.abs(saved))}`} tone={saved < 0 ? 'negative' : 'accent'}
                hint={rate !== null ? `${rate}% of income` : undefined} />
            </div>
          )}

          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-4">
              <section className="panel p-5 sm:p-6">
                <h2 className="text-[17px] font-semibold text-mm-text">Income and spending</h2>
                <p className="text-[13px] text-mm-muted mb-4">Six months to {getMonthName(month)}</p>
                <div className="h-64 sensitive">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} barGap={4} margin={{ left: -8, right: 4 }}>
                      <CartesianGrid vertical={false} stroke="var(--color-mm-text)" strokeOpacity={0.07} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-mm-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'var(--color-mm-muted)' }} axisLine={false} tickLine={false} tickFormatter={formatAxis} width={56} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-mm-text)', fillOpacity: 0.04 }} />
                      <Bar dataKey="Income" fill="var(--color-mm-accent)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="Spending" fill="var(--color-mm-chart-2)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-5 text-[13px] text-mm-text2 mt-2">
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-mm-accent" />Income</span>
                  <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-sm bg-mm-chart-2" />Spending</span>
                </div>
              </section>
              <section className="panel p-5 sm:p-6">
                <h2 className="text-[17px] font-semibold text-mm-text">Biggest changes</h2>
                <p className="text-[13px] text-mm-muted mb-2">Compared with {getMonthName(prev).split(' ')[0]}</p>
                {movers.length === 0 ? <p className="text-sm text-mm-text2 py-4">No spending in either month.</p> : (
                  <ul className="divide-hairline">
                    {movers.map(c => {
                      const diff = c.now - c.before; const info = categoryInfo(c.name, 'expense');
                      return (
                        <li key={c.name} className="flex items-center gap-3 py-3">
                          <CategoryIcon name={info.icon} color={info.color} size="sm" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[15px] font-medium text-mm-text truncate">{c.name}</span>
                            <span className="block text-[13px] text-mm-muted tabular">{formatCurrency(c.before)} → {formatCurrency(c.now)}</span>
                          </span>
                          <span className={cn('flex items-center gap-1 text-sm font-semibold tabular', diff > 0 ? 'text-mm-negative' : diff < 0 ? 'text-mm-positive' : 'text-mm-muted')}>
                            {diff > 0 ? <TrendingUp size={15} /> : diff < 0 ? <TrendingDown size={15} /> : null}{diff > 0 ? '+' : diff < 0 ? '−' : ''}{formatCurrency(Math.abs(diff))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => set({ tab: 'categories' })}>All categories</Button>
              </section>
            </div>
          )}

          {tab === 'categories' && (
            <section className="panel p-5 sm:p-6">
              <h2 className="text-[17px] font-semibold text-mm-text mb-4">Spending by category</h2>
              {cats.filter(c => c.now > 0).length === 0 ? <p className="text-sm text-mm-text2 py-6 text-center">No spending recorded in {getMonthName(month)}.</p> : (
                <ul className="space-y-4">
                  {cats.filter(c => c.now > 0).map(c => {
                    const info = categoryInfo(c.name, 'expense');
                    const change = c.before > 0 ? percentChange(c.now, c.before) : null;
                    return (
                      <li key={c.name} className="flex items-center gap-3">
                        <CategoryIcon name={info.icon} color={info.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[15px] font-medium text-mm-text truncate">{c.name}</span>
                            <span className="text-[15px] font-semibold text-mm-text tabular">{formatCurrency(c.now)}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="progress-track flex-1"><div className="progress-fill" style={{ width: `${(c.now / maxCat) * 100}%`, background: info.color }} /></div>
                            <span className="text-xs text-mm-muted tabular w-24 text-right">{spent > 0 ? Math.round((c.now / spent) * 100) : 0}%{change !== null ? ` · ${change > 0 ? '+' : ''}${change}%` : ''}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {tab === 'calendar' && <SpendingHeatmap />}
          {tab === 'subscriptions' && <SubscriptionsPanel />}
        </>
      )}
    </Page>
  );
};
