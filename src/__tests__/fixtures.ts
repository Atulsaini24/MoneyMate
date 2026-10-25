import type { Transaction } from '@/types';

export const NOW = new Date(2026, 9, 25, 14); // Sun 25 Oct 2026, 2pm local

let n = 0;
export function tx(y: number, m: number, d: number, type: Transaction['type'], amount: number, description: string, category: string): Transaction {
  const date = new Date(y, m, d, 12).toISOString();
  return { id: `t${n++}`, type, amount, description, category, date, createdAt: date };
}

/** Four months of salary, rent, Netflix and frequent food orders, ending 25 Oct 2026. */
export function sampleLedger(): Transaction[] {
  const txs: Transaction[] = [];
  for (const m of [6, 7, 8, 9]) {
    txs.push(tx(2026, m, 1, 'income', 80000, 'Salary', 'Salary'));
    txs.push(tx(2026, m, 5, 'expense', 22000, 'Rent', 'Bills & Utilities'));
    txs.push(tx(2026, m, 12, 'expense', 649, 'Netflix', 'Entertainment'));
    for (let d = 2; d <= 28; d += 3) {
      if (m === 9 && d > 25) continue;
      txs.push(tx(2026, m, d, 'expense', m === 9 ? 900 : 500, 'Swiggy order', 'Food & Dining'));
    }
  }
  txs.push(tx(2026, 9, 20, 'expense', 12000, 'Shoes', 'Shopping'));
  return txs;
}
