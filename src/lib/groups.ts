/** Shared-expense maths: who owes whom, and the fewest payments to settle. */
import type { Group, GroupExpense } from '@/types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function shareOf(e: GroupExpense, member: string): number {
  if (e.shares) return e.shares[member] || 0;
  return e.splitAmong.includes(member) ? e.amount / e.splitAmong.length : 0;
}

/** Positive = the group owes this member; negative = they owe the group. */
export function balances(g: Group): Record<string, number> {
  const bal: Record<string, number> = Object.fromEntries(g.members.map(m => [m, 0]));
  for (const e of g.expenses) {
    bal[e.paidBy] = (bal[e.paidBy] || 0) + e.amount;
    for (const m of g.members) bal[m] -= shareOf(e, m);
  }
  for (const m of Object.keys(bal)) bal[m] = round2(bal[m]);
  return bal;
}

export interface Settlement { from: string; to: string; amount: number }

/** Greedy largest-debtor-pays-largest-creditor: at most n−1 payments. */
export function settleUp(g: Group): Settlement[] {
  const bal = balances(g);
  const debtors = Object.entries(bal).filter(([, v]) => v < -0.009).map(([m, v]) => ({ m, v: -v })).sort((a, b) => b.v - a.v);
  const creditors = Object.entries(bal).filter(([, v]) => v > 0.009).map(([m, v]) => ({ m, v })).sort((a, b) => b.v - a.v);
  const out: Settlement[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = round2(Math.min(debtors[i].v, creditors[j].v));
    if (pay > 0) out.push({ from: debtors[i].m, to: creditors[j].m, amount: pay });
    debtors[i].v = round2(debtors[i].v - pay);
    creditors[j].v = round2(creditors[j].v - pay);
    if (debtors[i].v <= 0.009) i++;
    if (creditors[j].v <= 0.009) j++;
  }
  return out;
}

export function groupTotal(g: Group) {
  return g.expenses.filter(e => !e.settlement).reduce((s, e) => s + e.amount, 0);
}
