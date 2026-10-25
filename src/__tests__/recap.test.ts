import { describe, it, expect } from 'vitest';
import { buildRecap, recapMonthToOffer } from '@/lib/recap';
import { suggestCategory } from '@/lib/autoCategory';
import { NOW, sampleLedger, tx } from './fixtures';

describe('buildRecap', () => {
  const r = buildRecap(sampleLedger(), '2026-09', NOW);

  it('totals a full month', () => {
    expect(r.income).toBe(80000);
    expect(r.spent).toBe(22000 + 649 + 9 * 500);
    expect(r.saved).toBe(r.income - r.spent);
  });

  it('picks the biggest category and most frequent merchant', () => {
    expect(r.topCategory!.name).toBe('Bills & Utilities');
    expect(r.topMerchant).toMatchObject({ name: 'Swiggy order', count: 9 });
    expect(r.biggest!.amount).toBe(22000);
  });

  it('counts no-spend days only up to today in the current month', () => {
    const cur = buildRecap(sampleLedger(), '2026-10', NOW);
    expect(cur.daysElapsed).toBe(25);
    expect(cur.daily).toHaveLength(31);
  });

  it('calls a high saver The Saver', () => {
    expect(r.persona.title).toBe('The Saver');
  });

  it('handles an empty month', () => {
    const e = buildRecap([], '2026-01', NOW);
    expect(e.topCategory).toBeNull();
    expect(e.persona.title).toBe('The Fresh Start');
  });

  it('compares spending with the previous month', () => {
    const c = buildRecap([tx(2026, 7, 2, 'expense', 100, 'a', 'Others'), tx(2026, 8, 2, 'expense', 150, 'a', 'Others')], '2026-09', NOW);
    expect(c.spendChange).toBeCloseTo(0.5);
  });

  it('compares a month in progress with the same days of last month', () => {
    const txs = [
      tx(2026, 8, 10, 'expense', 100, 'a', 'Others'),
      tx(2026, 8, 28, 'expense', 5000, 'late Sept', 'Others'), // after the 25th: must not count
      tx(2026, 9, 10, 'expense', 120, 'a', 'Others'),
    ];
    expect(buildRecap(txs, '2026-10', NOW).spendChange).toBeCloseTo(0.2);
  });
});

describe('recapMonthToOffer', () => {
  it('offers last month during the first week', () => {
    expect(recapMonthToOffer(new Date(2026, 10, 3))).toEqual({ month: '2026-10', complete: true });
  });
  it('offers this month later on', () => {
    expect(recapMonthToOffer(NOW)).toEqual({ month: '2026-10', complete: false });
  });
});

describe('suggestCategory', () => {
  it.each([
    ['Swiggy order', 'expense', 'Food & Dining'], ['Uber trip', 'expense', 'Transport'],
    ['Jio recharge', 'expense', 'Bills & Utilities'], ['Salary October', 'income', 'Salary'],
    ['zz', 'expense', null],
  ])('%s → %s', (d, type, cat) => expect(suggestCategory(d, type as 'expense', [])).toBe(cat));
});
