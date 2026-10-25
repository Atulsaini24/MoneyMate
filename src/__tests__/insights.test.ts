import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  totalBalance, trailingAverages, friendRemaining, balanceSeries, detectRecurring,
  monthForecast, healthScore, buildInsights, dailySpend,
} from '@/lib/insights';
import { setDisplayConfig } from '@/lib/utils';
import { NOW, sampleLedger, tx } from './fixtures';

beforeAll(() => {
  setDisplayConfig({ currency: 'INR', locale: 'en-IN', privacy: false });
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterAll(() => vi.useRealTimers());

const empty = { transactions: [], budgets: [], goals: [], friends: [] };

describe('totals', () => {
  it('adds income, subtracts expenses and ignores transfers', () => {
    expect(totalBalance([
      tx(2026, 9, 1, 'income', 1000, 'a', 'Salary'),
      tx(2026, 9, 2, 'expense', 300, 'b', 'Others'),
      tx(2026, 9, 3, 'transfer', 5000, 'c', 'Others'),
    ])).toBe(700);
  });

  it('averages only months that have data', () => {
    const avg = trailingAverages([tx(2026, 8, 1, 'income', 90000, 's', 'Salary')], '2026-10');
    expect(avg.monthsWithData).toBe(1);
    expect(avg.income).toBe(90000);
  });

  it('subtracts partial payments from IOUs and zeroes settled ones', () => {
    const base = { id: 'f', name: 'A', type: 'i-owe' as const, amount: 2000, date: '', payments: [{ id: 'p', amount: 500, date: '' }] };
    expect(friendRemaining({ ...base, status: 'partially-paid' })).toBe(1500);
    expect(friendRemaining({ ...base, status: 'settled' })).toBe(0);
  });
});

describe('balanceSeries', () => {
  it('ends at the current balance and has one point per day', () => {
    const txs = sampleLedger();
    const s = balanceSeries(txs, 30);
    expect(s).toHaveLength(30);
    expect(s[s.length - 1].value).toBe(totalBalance(txs));
  });
});

describe('detectRecurring', () => {
  it('finds monthly rent and Netflix but not frequent food orders', () => {
    const names = detectRecurring(sampleLedger(), NOW).map(r => r.name);
    expect(names).toContain('Rent');
    expect(names).toContain('Netflix');
    expect(names).not.toContain('Swiggy order');
  });

  it('predicts the next date one month after the last payment', () => {
    const rent = detectRecurring(sampleLedger(), NOW).find(r => r.name === 'Rent')!;
    expect(new Date(rent.nextDate).getDate()).toBe(5);
    expect(rent.daysUntil).toBe(11);
  });

  it('ignores payments whose amount varies a lot', () => {
    const txs = [5, 6, 7].map((m, i) => tx(2026, m, 3, 'expense', [300, 900, 2000][i], 'Electricity', 'Bills & Utilities'));
    expect(detectRecurring(txs, NOW)).toHaveLength(0);
  });

  it('drops subscriptions that look cancelled', () => {
    const txs = [3, 4, 5].map(m => tx(2026, m, 10, 'expense', 199, 'Old app', 'Entertainment'));
    expect(detectRecurring(txs, NOW)).toHaveLength(0);
  });
});

describe('monthForecast', () => {
  const fc = monthForecast(sampleLedger(), NOW);

  it('counts days left including today', () => {
    expect(fc.dayOfMonth).toBe(25);
    expect(fc.daysLeft).toBe(7);
  });

  it('does not extrapolate rent as daily spending', () => {
    // Everyday spending by 25 Oct: 8 food orders × 900 + shoes 12000 (rent and Netflix are bills).
    const everyday = 8 * 900 + 12000;
    expect(fc.projectedSpend).toBeCloseTo(fc.spent + (everyday / 25) * 6, 0);
  });

  it('safe-to-spend is what is left divided by the remaining days', () => {
    expect(fc.safeToSpendDaily).toBeCloseTo((80000 - fc.spent - fc.upcomingBills) / 7, 2);
  });

  it('uses the usual income when salary has not arrived yet', () => {
    const txs = sampleLedger().filter(t => !(t.type === 'income' && t.date.startsWith('2026-10')));
    const f = monthForecast(txs, NOW);
    expect(f.incomeIsEstimate).toBe(true);
    expect(f.income).toBe(80000);
  });

  it('never returns a negative allowance', () => {
    const f = monthForecast([tx(2026, 9, 2, 'expense', 99999, 'Laptop', 'Shopping')], NOW);
    expect(f.safeToSpendDaily).toBe(0);
  });
});

describe('healthScore', () => {
  it('stays within 0–100 and says "Getting started" with no data', () => {
    const h = healthScore(empty, NOW);
    expect(h.total).toBeGreaterThanOrEqual(0);
    expect(h.total).toBeLessThanOrEqual(100);
    expect(h.grade).toBe('Getting started');
  });

  it('factor maxima add up to 100', () => {
    expect(healthScore(empty, NOW).factors.reduce((s, f) => s + f.max, 0)).toBe(100);
  });

  it('rewards a high savings rate', () => {
    const h = healthScore({ ...empty, transactions: sampleLedger() }, NOW);
    expect(h.factors.find(f => f.id === 'savings')!.score).toBe(30);
  });

  it('penalises debt relative to income', () => {
    const txs = sampleLedger();
    const heavy = healthScore({ ...empty, transactions: txs, friends: [
      { id: 'f', name: 'B', type: 'i-owe', amount: 80000, date: '', status: 'outstanding', payments: [] },
    ] }, NOW);
    expect(heavy.factors.find(f => f.id === 'debt')!.score).toBe(0);
  });
});

describe('buildInsights', () => {
  const txs = sampleLedger();
  const ledger = {
    transactions: txs,
    budgets: [{ id: 'b1', category: 'Food & Dining', limit: 4500, month: '2026-10' }],
    goals: [],
    friends: [{ id: 'f1', name: 'Rahul', type: 'owed-to-me' as const, amount: 3000, date: '', dueDate: '2026-10-10', status: 'outstanding' as const, payments: [] }],
  };
  const insights = buildInsights(ledger, NOW);

  it('flags a budget that is already over', () => {
    expect(insights.find(i => i.id === 'budget-over-b1')?.tone).toBe('alert');
  });

  it('does not repeat an over-budget category as a spike', () => {
    expect(insights.some(i => i.id === 'spike-Food & Dining')).toBe(false);
  });

  it('flags overdue money owed to you', () => {
    expect(insights.some(i => i.id === 'iou-late-f1')).toBe(true);
  });

  it('sorts the most urgent first', () => {
    const w = insights.map(i => i.weight);
    expect([...w].sort((a, b) => b - a)).toEqual(w);
  });

  it('shows a welcome card for an empty ledger', () => {
    expect(buildInsights(empty, NOW)[0].id).toBe('welcome');
  });
});

describe('dailySpend', () => {
  it('returns whole weeks starting on Monday', () => {
    const { days } = dailySpend(sampleLedger(), 18, NOW);
    expect(days.length % 7).toBe(0);
    expect(days[0].date.getDay()).toBe(1);
  });
});
