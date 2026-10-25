import { describe, it, expect } from 'vitest';
import { newRegime, oldRegime, compareRegimes, slabTax, hraExemption, detectSection, fyOf, sectionTotals } from '@/lib/tax';
import { balances, settleUp, groupTotal } from '@/lib/groups';
import { upiLink, isValidVpa } from '@/lib/upi';
import { suggestBudgets, carryOverBudgets, sweepOffer } from '@/lib/autopilot';
import { parseStatementLines } from '@/lib/importers/pdfStatement';
import { parseCasLines } from '@/lib/importers/cams';
import type { Group } from '@/types';
import { NOW, sampleLedger, tx } from './fixtures';

describe('income tax (Budget 2025 slabs)', () => {
  it('new regime: ₹12.75L salary pays nothing (₹75k standard deduction + 87A rebate)', () => {
    expect(newRegime({ grossSalary: 1_275_000 }).tax).toBe(0);
  });

  it('new regime: ₹20L salary', () => {
    // taxable 19,25,000 → 20k + 40k + 60k + 65k(15%? no: 16-19.25L at 20%) …
    const expected = (400_000 * 0.05 + 400_000 * 0.1 + 400_000 * 0.15 + 325_000 * 0.2) * 1.04;
    expect(newRegime({ grossSalary: 2_000_000 }).tax).toBe(Math.round(expected));
  });

  it('new regime: marginal relief just above ₹12 lakh taxable', () => {
    // taxable 12,10,000: slab tax 61,500 but capped at the 10,000 earned above 12L, plus cess
    expect(newRegime({ grossSalary: 1_285_000 }).tax).toBe(Math.round(10_000 * 1.04));
  });

  it('old regime: caps 80C at ₹1.5L and applies the ₹50k standard deduction', () => {
    const r = oldRegime({ grossSalary: 1_000_000, deductions: { '80C': 300_000 } });
    expect(r.deductions).toBe(200_000);
    expect(r.taxable).toBe(800_000);
    expect(r.tax).toBe(Math.round((12_500 + 300_000 * 0.2) * 1.04));
  });

  it('old regime: 87A rebate up to ₹5L taxable', () => {
    expect(oldRegime({ grossSalary: 550_000 }).tax).toBe(0);
  });

  it('picks the cheaper regime', () => {
    const heavy = compareRegimes({ grossSalary: 1_500_000, deductions: { '80C': 150_000, '80D': 25_000, '80CCD1B': 50_000, '24B': 200_000 },
      hra: { basic: 600_000, hraReceived: 240_000, rentPaid: 300_000, metro: true } });
    expect(heavy.better).toBe('old');
    expect(compareRegimes({ grossSalary: 1_000_000 }).better).toBe('new');
  });

  it('HRA exemption is the least of the three rules', () => {
    expect(hraExemption({ basic: 600_000, hraReceived: 240_000, rentPaid: 300_000, metro: true })).toBe(240_000);
    expect(hraExemption({ basic: 600_000, hraReceived: 300_000, rentPaid: 200_000, metro: false })).toBe(140_000);
  });

  it('slab maths', () => {
    expect(slabTax(1_000_000, [[250_000, 0], [500_000, 0.05], [1_000_000, 0.2], [Infinity, 0.3]])).toBe(112_500);
  });

  it('detects deductible payments and the financial year', () => {
    expect(detectSection({ type: 'expense', description: 'LIC premium', category: 'Others' })).toBe('80C');
    expect(detectSection({ type: 'expense', description: 'Star Health renewal', category: 'Health' })).toBe('80D');
    expect(detectSection({ type: 'expense', description: 'NPS contribution', category: 'Others' })).toBe('80CCD1B');
    expect(detectSection({ type: 'expense', description: 'Rent', category: 'Bills & Utilities' })).toBe('HRA');
    expect(detectSection({ type: 'expense', description: 'Swiggy', category: 'Food & Dining' })).toBeNull();
    expect(fyOf(new Date(2026, 2, 31))).toBe('2025-26');
    expect(fyOf(new Date(2026, 3, 1))).toBe('2026-27');
  });

  it('totals sections within the financial year only', () => {
    const txs = [tx(2026, 4, 5, 'expense', 50_000, 'PPF deposit', 'Others'), tx(2026, 1, 5, 'expense', 9_999, 'PPF deposit', 'Others')];
    expect(sectionTotals(txs, '2026-27').totals['80C']).toBe(50_000);
  });
});

describe('group splitting', () => {
  const g: Group = {
    id: 'g', name: 'Goa', emoji: '🏖️', members: ['You', 'Rahul', 'Priya'], createdAt: '',
    expenses: [
      { id: '1', description: 'Villa', amount: 9000, paidBy: 'You', splitAmong: ['You', 'Rahul', 'Priya'], date: '' },
      { id: '2', description: 'Dinner', amount: 3000, paidBy: 'Rahul', splitAmong: ['You', 'Rahul', 'Priya'], date: '' },
      { id: '3', description: 'Scooter', amount: 1200, paidBy: 'Priya', splitAmong: ['Rahul', 'Priya'], date: '' },
    ],
  };

  it('balances sum to zero', () => {
    const b = balances(g);
    expect(Object.values(b).reduce((a, v) => a + v, 0)).toBeCloseTo(0);
    expect(b).toEqual({ You: 5000, Rahul: -1600, Priya: -3400 });
  });

  it('settles in at most n−1 payments that clear every balance', () => {
    const s = settleUp(g);
    expect(s.length).toBeLessThanOrEqual(2);
    expect(s).toEqual([{ from: 'Priya', to: 'You', amount: 3400 }, { from: 'Rahul', to: 'You', amount: 1600 }]);
  });

  it('a recorded settlement clears the debt', () => {
    const paid = { ...g, expenses: [...g.expenses, { id: 's', description: 'Settle', amount: 3400, paidBy: 'Priya', splitAmong: ['You'], date: '', settlement: true }] };
    expect(balances(paid).Priya).toBe(0);
    expect(groupTotal(paid)).toBe(13_200);
  });

  it('handles exact shares', () => {
    const ex: Group = { ...g, expenses: [{ id: 'x', description: 'Gift', amount: 1000, paidBy: 'You', splitAmong: [], shares: { Rahul: 700, Priya: 300 }, date: '' }] };
    expect(balances(ex)).toEqual({ You: 1000, Rahul: -700, Priya: -300 });
  });
});

describe('UPI', () => {
  it('builds a payment link apps understand', () => {
    expect(upiLink({ vpa: 'atul@okicici', name: 'Atul', amount: 1600, note: 'Goa trip' }))
      .toBe('upi://pay?pa=atul@okicici&cu=INR&pn=Atul&am=1600.00&tn=Goa+trip');
  });
  it('validates UPI IDs', () => {
    expect(isValidVpa('atul.saini@okhdfcbank')).toBe(true);
    expect(isValidVpa('9876543210@ybl')).toBe(true);
    expect(isValidVpa('not an id')).toBe(false);
    expect(isValidVpa('a@1bank')).toBe(false);
  });
});

describe('budget autopilot', () => {
  const txs = sampleLedger();
  it('suggests rounded budgets from the 3-month average', () => {
    const s = suggestBudgets(txs, '2026-10', []);
    const food = s.find(x => x.category === 'Food & Dining')!;
    expect(food.average).toBeCloseTo(4500);       // 9 orders × ₹500
    expect(food.limit).toBe(5000);                // 4725 rounded up to 500
    expect(s.find(x => x.category === 'Entertainment')).toBeDefined();
  });
  it('skips categories that already have a budget', () => {
    expect(suggestBudgets(txs, '2026-10', [{ id: 'b', category: 'Food & Dining', limit: 1, month: '2026-10' }]).some(x => x.category === 'Food & Dining')).toBe(false);
  });
  it('carries last month’s budgets forward', () => {
    const b = [{ id: '1', category: 'Food & Dining', limit: 5000, month: '2026-09' }, { id: '2', category: 'Shopping', limit: 3000, month: '2026-09' }, { id: '3', category: 'Shopping', limit: 3000, month: '2026-10' }];
    expect(carryOverBudgets('2026-10', b).map(x => x.category)).toEqual(['Food & Dining']);
  });
  it('offers last month’s surplus once, early in the month', () => {
    expect(sweepOffer(txs, new Date(2026, 10, 3))).toEqual({ month: '2026-10', surplus: 80000 - (22000 + 649 + 8 * 900 + 12000) });
    expect(sweepOffer(txs, new Date(2026, 10, 3), '2026-10')).toBeNull();
    expect(sweepOffer(txs, NOW)).toBeNull();
  });
});

describe('PDF statement rows', () => {
  const lines = [
    'STATEMENT OF ACCOUNT', 'Date Narration Chq/Ref Value Dt Withdrawal Deposit Closing Balance',
    '30/09/26 OPENING BALANCE 1,00,000.00',
    '01/10/26 NEFT CR-INFOSYS LIMITED 01/10/26 85,000.00 1,85,000.00',
    '05/10/26 UPI-LANDLORD SHARMA-landlord@okaxis 05/10/26 22,000.00 1,63,000.00',
    '12/10/26 POS 4321XXXX NETFLIX.COM', 'MUMBAI IN 12/10/26 649.00 1,62,351.00',
    'Page 2 of 3',
    '18/10/26 ATM WDL-NWD-ANDHERI 18/10/26 2,000.00 1,60,351.00',
  ];
  const r = parseStatementLines(lines, [], NOW);

  it('reads every transaction row, including wrapped narrations', () => {
    expect(r.entries).toHaveLength(4);
  });
  it('tells debits from credits using the running balance', () => {
    expect(r.entries.map(e => [e.type, e.amount])).toEqual([['income', 85000], ['expense', 22000], ['expense', 649], ['expense', 2000]]);
  });
  it('cleans merchants and categorises', () => {
    expect(r.entries[2].category).toBe('Entertainment');
    expect(r.entries[3]).toMatchObject({ description: 'ATM withdrawal', paymentMethod: 'Cash' });
  });
  it('uses Cr/Dr markers when there is no balance to compare', () => {
    const e = parseStatementLines(['03 Oct 2026 Refund Amazon 499.00 Cr'], [], NOW).entries[0];
    expect(e.type).toBe('income');
  });
});

describe('CAMS CAS holdings', () => {
  const cas = [
    'Folio No: 1234567/89 PAN: ABCDE1234F',
    'B205 - Axis Bluechip Fund - Direct Growth (Advisor: DIRECT) Registrar : KFINTECH',
    'Opening Unit Balance: 1,000.000',
    'Closing Unit Balance: 1,234.567 NAV on 24-Oct-2026: INR 52.10 Total Cost Value: 50,000.00 Market Value on 24-Oct-2026: INR 64,321.90',
    'P8042 - Parag Parikh Flexi Cap Fund - Direct Plan Growth - ISIN: INF879O01027',
    'Closing Unit Balance: 500.000 NAV on 24-Oct-2026: INR 80.00 Market Value on 24-Oct-2026: INR 40,000.00',
  ];
  it('extracts scheme, units and market value', () => {
    expect(parseCasLines(cas)).toEqual([
      { name: 'Axis Bluechip Fund - Direct Growth', value: 64321.9, units: 1234.567, folio: '1234567/89' },
      { name: 'Parag Parikh Flexi Cap Fund - Direct Plan Growth', value: 40000, units: 500, folio: '1234567/89' },
    ]);
  });
});
