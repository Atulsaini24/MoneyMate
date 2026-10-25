/** Executes Ask MoneyMate's tools locally against the user's ledger. */
import type { LedgerState } from '@/context/AppContext';
import { buildInsights, detectRecurring, friendRemaining, healthScore, monthForecast, totalBalance } from '@/lib/insights';
import { netWorth } from '@/lib/wealth';
import { getMonthYear, monthKey } from '@/lib/utils';

const day = (iso: string) => iso.slice(0, 10);
const inRange = (iso: string, from?: string, to?: string) => {
  const d = new Date(iso), k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return (!from || k >= from) && (!to || k <= to);
};
const r0 = (n: number) => Math.round(n);

export const TOOL_LABELS: Record<string, string> = {
  get_overview: 'Reading your overview',
  query_transactions: 'Searching your transactions',
  spending_breakdown: 'Adding up your spending',
};

export function runTool(name: string, input: any, s: LedgerState): unknown {
  const txs = s.transactions;
  if (name === 'get_overview') {
    const month = monthKey(new Date());
    const fc = monthForecast(txs);
    const h = healthScore({ transactions: txs, budgets: s.budgets, goals: s.goals, friends: s.friends });
    const nw = netWorth(s.assets);
    return {
      balance_from_transactions: r0(totalBalance(txs)),
      this_month: { income: r0(fc.income), income_is_estimate: fc.incomeIsEstimate, spent: r0(fc.spent), projected_spend: r0(fc.projectedSpend), projected_savings: r0(fc.projectedNet), safe_to_spend_per_day: r0(fc.safeToSpendDaily), days_left: fc.daysLeft },
      health_score: { total: h.total, grade: h.grade, factors: h.factors.map(f => ({ name: f.label, score: `${f.score}/${f.max}`, detail: f.detail })) },
      budgets: s.budgets.filter(b => b.month === month).map(b => ({
        category: b.category, limit: b.limit,
        spent: r0(txs.filter(t => t.type === 'expense' && t.category === b.category && getMonthYear(t.date) === month).reduce((a, t) => a + t.amount, 0)),
      })),
      goals: s.goals.map(g => ({ name: g.name, target: g.targetAmount, saved: g.savedAmount, target_date: g.targetDate?.slice(0, 10) })),
      upcoming_bills: detectRecurring(txs).filter(r => r.daysUntil >= -3).slice(0, 10).map(r => ({ name: r.name, amount: r0(r.amount), due_in_days: r.daysUntil })),
      net_worth: s.assets.length ? { assets: r0(nw.assets), liabilities: r0(nw.liabilities), net: r0(nw.net) } : 'No accounts added on the Wealth page',
      ious: s.friends.filter(f => friendRemaining(f) > 0).map(f => ({ name: f.name, direction: f.type === 'i-owe' ? 'user owes them' : 'they owe user', amount: r0(friendRemaining(f)), due: f.dueDate?.slice(0, 10) })),
      alerts: buildInsights({ transactions: txs, budgets: s.budgets, goals: s.goals, friends: s.friends }).slice(0, 6).map(i => i.title),
      transactions_on_record: txs.length,
      earliest_transaction: txs.length ? day(txs.reduce((m, t) => (t.date < m ? t.date : m), txs[0].date)) : null,
    };
  }

  if (name === 'query_transactions') {
    const q = (input.search || '').toLowerCase();
    let rows = txs.filter(t =>
      inRange(t.date, input.from, input.to) &&
      (!input.type || t.type === input.type) &&
      (!input.category || t.category.toLowerCase() === String(input.category).toLowerCase()) &&
      (!q || `${t.description} ${t.notes || ''}`.toLowerCase().includes(q)) &&
      (input.min_amount == null || t.amount >= input.min_amount) &&
      (input.max_amount == null || t.amount <= input.max_amount));
    const total = rows.reduce((a, t) => a + (t.type === 'income' ? t.amount : t.type === 'expense' ? t.amount : 0), 0);
    rows = [...rows].sort((a, b) => (input.sort === 'largest' ? b.amount - a.amount : +new Date(b.date) - +new Date(a.date)));
    const limit = Math.min(50, Math.max(1, input.limit || 15));
    return {
      count: rows.length, total: r0(total),
      transactions: rows.slice(0, limit).map(t => ({ date: day(t.date), description: t.description, category: t.category, type: t.type, amount: t.amount })),
      truncated: rows.length > limit,
    };
  }

  if (name === 'spending_breakdown') {
    const type = input.type || 'expense';
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const map = new Map<string, { total: number; count: number }>();
    for (const t of txs) {
      if (t.type !== type || !inRange(t.date, input.from, input.to)) continue;
      const d = new Date(t.date);
      const k = input.group_by === 'month' ? getMonthYear(t.date)
        : input.group_by === 'merchant' ? t.description.trim()
        : input.group_by === 'weekday' ? weekdays[d.getDay()] : t.category;
      const v = map.get(k) || { total: 0, count: 0 };
      v.total += t.amount; v.count++;
      map.set(k, v);
    }
    const rows = [...map].map(([key, v]) => ({ key, total: r0(v.total), count: v.count }));
    rows.sort((a, b) => (input.group_by === 'month' ? a.key.localeCompare(b.key) : b.total - a.total));
    return { group_by: input.group_by, type, rows: rows.slice(0, 40), grand_total: r0(rows.reduce((a, r) => a + r.total, 0)) };
  }
  return { error: `Unknown tool ${name}` };
}
