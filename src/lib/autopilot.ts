/** Budget suggestions and month-end savings sweeps. */
import type { Transaction, Budget } from '@/types';
import { addMonths, getMonthYear } from '@/lib/utils';

export interface BudgetSuggestion { category: string; average: number; limit: number; months: number }

const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;

/** For categories without a budget this month: 3-month average + 5% headroom, rounded to a tidy number. */
export function suggestBudgets(txs: Transaction[], month: string, existing: Budget[]): BudgetSuggestion[] {
  const have = new Set(existing.filter(b => b.month === month).map(b => b.category));
  const totals = new Map<string, number[]>();
  for (let k = 1; k <= 3; k++) {
    const m = addMonths(month, -k);
    const byCat = new Map<string, number>();
    for (const t of txs) if (t.type === 'expense' && getMonthYear(t.date) === m) byCat.set(t.category, (byCat.get(t.category) || 0) + t.amount);
    for (const [c, v] of byCat) totals.set(c, [...(totals.get(c) || []), v]);
  }
  const out: BudgetSuggestion[] = [];
  for (const [category, vals] of totals) {
    if (have.has(category)) continue;
    const average = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (average < 500) continue;
    out.push({ category, average, months: vals.length, limit: roundUp(average * 1.05, average > 10_000 ? 1000 : 500) });
  }
  return out.sort((a, b) => b.average - a.average);
}

/** Budgets from last month that haven't been set up this month yet. */
export function carryOverBudgets(month: string, existing: Budget[]) {
  const prev = existing.filter(b => b.month === addMonths(month, -1));
  const have = new Set(existing.filter(b => b.month === month).map(b => b.category));
  return prev.filter(b => !have.has(b.category));
}

/** Last month's surplus, offered once at the start of a new month. */
export function sweepOffer(txs: Transaction[], now: Date, lastSweepMonth?: string) {
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = addMonths(cur, -1);
  if (lastSweepMonth === prev || now.getDate() > 10) return null;
  const sum = (type: string) => txs.filter(t => t.type === type && getMonthYear(t.date) === prev).reduce((s, t) => s + t.amount, 0);
  const surplus = sum('income') - sum('expense');
  return surplus >= 500 ? { month: prev, surplus } : null;
}
