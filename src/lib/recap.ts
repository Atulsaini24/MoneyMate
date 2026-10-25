/**
 * Builds the data behind the monthly "Wrapped" story. Pure, so it's easy to test.
 */
import type { Transaction } from '@/types';
import { addMonths, getMonthYear, daysInMonth } from '@/lib/utils';

export interface MonthRecap {
  month: string;
  label: string;           // "October 2026"
  monthName: string;       // "October"
  income: number;
  spent: number;
  saved: number;
  savingsRate: number;     // 0..1, may be negative
  txCount: number;
  spendChange: number | null; // vs the same days of the previous month, fraction
  topCategory: { name: string; amount: number; share: number } | null;
  categories: { name: string; amount: number }[];
  topMerchant: { name: string; count: number; amount: number } | null;
  biggest: { description: string; amount: number; date: string } | null;
  noSpendDays: number;
  daysElapsed: number;
  busiestWeekday: string | null;
  daily: number[];         // spend per day of month
  persona: { title: string; line: string; emoji: string };
}

const PERSONAS: Record<string, { title: string; line: string; emoji: string }> = {
  'Food & Dining': { title: 'The Foodie', line: 'Good meals are an investment in happiness.', emoji: '🍜' },
  'Shopping': { title: 'The Collector', line: 'You know exactly what you like.', emoji: '🛍️' },
  'Transport': { title: 'The Explorer', line: 'Always on the move.', emoji: '🧭' },
  'Entertainment': { title: 'The Fun Seeker', line: 'Life’s too short for boring weekends.', emoji: '🎬' },
  'Bills & Utilities': { title: 'The Steady Hand', line: 'Bills paid, lights on, life sorted.', emoji: '🏠' },
  'Gym & Fitness': { title: 'The Athlete', line: 'Investing in the one body you get.', emoji: '💪' },
  'Health': { title: 'The Caretaker', line: 'Health first, always.', emoji: '🩺' },
  'Education': { title: 'The Learner', line: 'Compounding knowledge, not just money.', emoji: '📚' },
};

const WEEKDAYS = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

export function buildRecap(txs: Transaction[], month: string, now = new Date()): MonthRecap {
  const inMonth = txs.filter(t => getMonthYear(t.date) === month);
  const exp = inMonth.filter(t => t.type === 'expense');
  const income = inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const spent = exp.reduce((s, t) => s + t.amount, 0);

  const byCat = new Map<string, number>();
  for (const t of exp) byCat.set(t.category, (byCat.get(t.category) || 0) + t.amount);
  const categories = [...byCat].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  const top = categories[0];

  const byMerchant = new Map<string, { name: string; count: number; amount: number }>();
  for (const t of exp) {
    const k = t.description.trim().toLowerCase();
    const m = byMerchant.get(k) || { name: t.description.trim(), count: 0, amount: 0 };
    m.count++; m.amount += t.amount;
    byMerchant.set(k, m);
  }
  const topMerchant = [...byMerchant.values()].filter(m => m.count >= 2).sort((a, b) => b.count - a.count || b.amount - a.amount)[0] || null;
  const biggestTx = [...exp].sort((a, b) => b.amount - a.amount)[0];

  const [y, m] = month.split('-').map(Number);
  const total = daysInMonth(month);
  const isCurrent = now.getFullYear() === y && now.getMonth() === m - 1;
  const daysElapsed = isCurrent ? now.getDate() : total;
  // Compare like with like: for a month in progress, only the same days of last month count
  const prevSpent = txs
    .filter(t => t.type === 'expense' && getMonthYear(t.date) === addMonths(month, -1) && new Date(t.date).getDate() <= daysElapsed)
    .reduce((s, t) => s + t.amount, 0);
  const daily = Array.from({ length: total }, () => 0);
  for (const t of exp) daily[new Date(t.date).getDate() - 1] += t.amount;
  const noSpendDays = daily.slice(0, daysElapsed).filter(v => v === 0).length;

  const wk = [0, 0, 0, 0, 0, 0, 0];
  for (const t of exp) wk[new Date(t.date).getDay()] += t.amount;
  const busiest = spent > 0 ? WEEKDAYS[wk.indexOf(Math.max(...wk))] : null;

  const saved = income - spent;
  const savingsRate = income > 0 ? saved / income : 0;
  const persona = savingsRate >= 0.35 && income > 0
    ? { title: 'The Saver', line: 'You kept more than a third of everything you earned.', emoji: '🏆' }
    : top ? PERSONAS[top.name] || { title: 'The All-Rounder', line: 'A little of everything, nothing in excess.', emoji: '✨' }
    : { title: 'The Fresh Start', line: 'A clean slate. Next month is yours.', emoji: '🌱' };

  const date = new Date(y, m - 1, 1);
  return {
    month,
    label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    monthName: date.toLocaleDateString(undefined, { month: 'long' }),
    income, spent, saved, savingsRate,
    txCount: inMonth.length,
    spendChange: prevSpent > 0 ? (spent - prevSpent) / prevSpent : null,
    topCategory: top ? { ...top, share: spent ? top.amount / spent : 0 } : null,
    categories,
    topMerchant,
    biggest: biggestTx ? { description: biggestTx.description, amount: biggestTx.amount, date: biggestTx.date } : null,
    noSpendDays, daysElapsed,
    busiestWeekday: busiest,
    daily,
    persona,
  };
}

/** Which month to offer a recap for: last month during the first week, otherwise this month so far. */
export function recapMonthToOffer(now = new Date()): { month: string; complete: boolean } {
  const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return now.getDate() <= 7 ? { month: addMonths(cur, -1), complete: true } : { month: cur, complete: false };
}
