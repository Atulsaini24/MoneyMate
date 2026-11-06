import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, PiggyBank, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BudgetAutopilot } from '@/components/budgets/BudgetAutopilot';
import { EXPENSE_CATEGORIES, categoryInfo, type Budget } from '@/types';
import { addMonths, formatCurrency, getCurrentMonth, getMonthName, daysInMonth } from '@/lib/utils';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Button, EmptyState, Field, IconButton, MoneyInput, Page, PageHeader, Progress, Select } from '@/components/ui';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getCategorySpending } = useApp();
  const current = getCurrentMonth();
  const [month, setMonth] = useState(current);
  const [form, setForm] = useState<{ id?: string; category: string; limit: string; threshold: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Budget | null>(null);

  const list = budgets.filter(b => b.month === month)
    .map(b => ({ ...b, spent: getCategorySpending(month, b.category) }))
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
  const total = list.reduce((s, b) => s + b.limit, 0);
  const spent = list.reduce((s, b) => s + b.spent, 0);
  const isCurrent = month === current;
  const isPast = month < current;
  const daysLeft = isCurrent ? daysInMonth(month) - new Date().getDate() + 1 : 0;
  const elapsedPct = isCurrent ? ((new Date().getDate() - 1) / daysInMonth(month)) * 100 : isPast ? 100 : 0;

  const used = new Set(list.map(b => b.category));
  const available = EXPENSE_CATEGORIES.filter(c => !used.has(c.name) || c.name === (form?.id ? budgets.find(b => b.id === form.id)?.category : ''));
  const limit = parseFloat(form?.limit || '');
  const canSave = Boolean(form?.category) && Number.isFinite(limit) && limit > 0;

  const save = () => {
    if (!form || !canSave) return;
    const data = { category: form.category, limit, alertThreshold: parseInt(form.threshold) };
    if (form.id) updateBudget(form.id, data); else addBudget({ ...data, month });
    setForm(null);
  };

  return (
    <Page>
      <PageHeader title="Budgets" subtitle="Set a monthly limit for each category. MoneyMate warns you before you cross it."
        actions={<Button icon={Plus} onClick={() => setForm({ category: available[0]?.name || '', limit: '', threshold: '80' })} disabled={!available.length}>Add budget</Button>} />

      <div className="flex items-center gap-2 mb-5">
        <IconButton label="Previous month" icon={ChevronLeft} onClick={() => setMonth(m => addMonths(m, -1))} />
        <h2 className="text-lg font-semibold text-mm-text min-w-[150px] text-center">{getMonthName(month)}</h2>
        <IconButton label="Next month" icon={ChevronRight} onClick={() => setMonth(m => addMonths(m, 1))} />
        {!isCurrent && <Button variant="ghost" size="sm" onClick={() => setMonth(current)}>This month</Button>}
      </div>

      {!isPast && <BudgetAutopilot month={month} />}

      {list.length > 0 && (
        <section className="panel p-5 sm:p-6 mb-5" aria-label="Month total">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[13px] text-mm-muted">{spent > total ? 'Over your total budget by' : 'Left to spend'}</p>
              <p className={`amount text-[2rem] font-semibold leading-tight ${spent > total ? 'text-mm-negative' : 'text-mm-text'}`}>{formatCurrency(Math.abs(total - spent))}</p>
            </div>
            <p className="text-sm text-mm-text2 tabular">{formatCurrency(spent)} spent of {formatCurrency(total)}</p>
          </div>
          <div className="relative mt-4">
            <Progress value={total ? (spent / total) * 100 : 0} tone="auto" label="Total budget used" className="h-2.5" />
            {isCurrent && <span className="absolute -top-1 h-[18px] w-0.5 rounded bg-mm-text/40" style={{ left: `${elapsedPct}%` }} title="Where you’d be at an even pace" />}
          </div>
          {isCurrent && <p className="text-[13px] text-mm-muted mt-2.5">{daysLeft} day{daysLeft === 1 ? '' : 's'} left. The marker shows an even pace through the month.</p>}
        </section>
      )}

      {list.length === 0 ? (
        <div className="panel">
          <EmptyState icon={PiggyBank} title={`No budgets for ${getMonthName(month)}`}
            description="Start with the categories where money tends to slip away, like food delivery or shopping."
            action={<Button icon={Plus} onClick={() => setForm({ category: available[0]?.name || '', limit: '', threshold: '80' })}>Add budget</Button>} />
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map(b => {
            const cat = categoryInfo(b.category, 'expense');
            const pct = (b.spent / b.limit) * 100;
            const left = b.limit - b.spent;
            const warn = pct >= (b.alertThreshold || 80);
            return (
              <li key={b.id}>
                <button onClick={() => setForm({ id: b.id, category: b.category, limit: String(b.limit), threshold: String(b.alertThreshold || 80) })}
                  className="w-full panel lift p-4 sm:p-5 text-left hover:border-mm-line/20">
                  <div className="flex items-center gap-3">
                    <CategoryIcon name={cat.icon} color={cat.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-mm-text truncate">{b.category}</p>
                      <p className="text-[13px] text-mm-muted tabular">{formatCurrency(b.spent)} of {formatCurrency(b.limit)}</p>
                    </div>
                    <span className={`amount text-lg font-semibold ${left < 0 ? 'text-mm-negative' : warn ? 'text-mm-warning' : 'text-mm-text'}`}>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} tone="auto" className="mt-3.5" label={`${b.category} budget used`} />
                  <p className={`text-[13px] mt-2.5 ${left < 0 ? 'text-mm-negative font-medium' : 'text-mm-text2'}`}>
                    {left < 0 ? `Over by ${formatCurrency(-left)}`
                      : isCurrent ? `${formatCurrency(left)} left · about ${formatCurrency(left / Math.max(1, daysLeft))} a day`
                      : `${formatCurrency(left)} ${isPast ? 'unspent' : 'available'}`}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.category} budget` : `New budget for ${getMonthName(month)}`}
        footer={
          <div className="flex gap-2">
            {form?.id && <IconButton label="Delete budget" icon={Trash2} tone="danger" onClick={() => { const b = budgets.find(x => x.id === form.id); if (b) setConfirmDelete(b); }} />}
            <Button size="lg" className="flex-1" onClick={save} disabled={!canSave}>{form?.id ? 'Save changes' : 'Add budget'}</Button>
          </div>
        }>
        {form && (
          <form className="space-y-4 pt-1" onSubmit={e => { e.preventDefault(); save(); }}>
            <Field label="Category" htmlFor="b-cat">
              <Select id="b-cat" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={Boolean(form.id)}>
                {(form.id ? EXPENSE_CATEGORIES : available).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Monthly limit" htmlFor="b-limit" hint={form.category ? `You spent ${formatCurrency(getCategorySpending(addMonths(month, -1), form.category))} on this last month.` : undefined}>
              <MoneyInput id="b-limit" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} placeholder="0" data-autofocus />
            </Field>
            <Field label="Warn me at" htmlFor="b-thr">
              <Select id="b-thr" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })}>
                {[50, 60, 70, 80, 90, 100].map(v => <option key={v} value={v}>{v}% of the limit</option>)}
              </Select>
            </Field>
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </form>
        )}
      </Dialog>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} variant="danger" confirmText="Delete"
        title={`Delete the ${confirmDelete?.category} budget?`} message="Your transactions aren’t affected."
        onConfirm={() => { if (confirmDelete) { deleteBudget(confirmDelete.id); setForm(null); } }} />
    </Page>
  );
};
