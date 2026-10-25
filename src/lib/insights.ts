/**
 * MoneyMate insights engine.
 *
 * Pure functions over the user's ledger. Nothing here touches React or storage,
 * so every number shown in the dashboard, notification centre and reports is
 * derived from one place and is easy to unit test.
 */
import type { Transaction, Budget, SavingsGoal, FriendRecord } from '../types';
import { addMonths, dayKey, daysInMonth, formatCurrency, getMonthYear, monthKey } from './utils';

const DAY = 86_400_000;

export interface Ledger {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  friends: FriendRecord[];
}

// ---------------------------------------------------------------------------
// Basic aggregates
// ---------------------------------------------------------------------------

export function totalBalance(txs: Transaction[]): number {
  return txs.reduce((s, t) => (t.type === 'income' ? s + t.amount : t.type === 'expense' ? s - t.amount : s), 0);
}

function sumWhere(txs: Transaction[], type: Transaction['type'], month: string) {
  return txs.filter(t => t.type === type && getMonthYear(t.date) === month).reduce((s, t) => s + t.amount, 0);
}

/** Average monthly income and spend over the N full months before `month`. */
export function trailingAverages(txs: Transaction[], month: string, n = 3) {
  let income = 0, expense = 0, monthsWithData = 0;
  for (let i = 1; i <= n; i++) {
    const m = addMonths(month, -i);
    const inc = sumWhere(txs, 'income', m);
    const exp = sumWhere(txs, 'expense', m);
    if (inc || exp) monthsWithData++;
    income += inc;
    expense += exp;
  }
  const d = monthsWithData || 1;
  return { income: income / d, expense: expense / d, monthsWithData };
}

export function friendRemaining(f: FriendRecord): number {
  if (f.status === 'settled') return 0;
  const paid = (f.payments || []).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, f.amount - paid);
}

// ---------------------------------------------------------------------------
// Balance history (real data for the sparkline)
// ---------------------------------------------------------------------------

/** End-of-day running balance for the last `days` days. */
export function balanceSeries(txs: Transaction[], days = 30): { date: string; value: number }[] {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const start = today.getTime() - (days - 1) * DAY;

  let running = 0;
  const deltas = new Map<string, number>();
  for (const t of txs) {
    const sign = t.type === 'income' ? 1 : t.type === 'expense' ? -1 : 0;
    if (!sign) continue;
    const ts = new Date(t.date).getTime();
    if (ts < start - DAY + 1) running += sign * t.amount;
    else {
      const k = dayKey(new Date(ts));
      deltas.set(k, (deltas.get(k) || 0) + sign * t.amount);
    }
  }

  const out: { date: string; value: number }[] = [];
  for (let i = 0; i < days; i++) {
    const k = dayKey(new Date(start + i * DAY));
    running += deltas.get(k) || 0;
    out.push({ date: k, value: running });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Recurring payments / subscriptions
// ---------------------------------------------------------------------------

export interface RecurringPayment {
  key: string;
  name: string;
  category: string;
  amount: number;
  lastDate: string;
  nextDate: string;
  occurrences: number;
  daysUntil: number;
}

const normalise = (s: string) =>
  s.toLowerCase().replace(/\d{2,}/g, '').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Finds expenses that repeat roughly monthly with a stable amount
 * (same normalised description, at least 2 occurrences 25–35 days apart,
 * amounts within 20% of the median).
 */
export function detectRecurring(txs: Transaction[], now = new Date()): RecurringPayment[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const k = normalise(t.description);
    if (k.length < 3) continue;
    const list = groups.get(k);
    if (list) list.push(t);
    else groups.set(k, [t]);
  }

  const result: RecurringPayment[] = [];
  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    const amounts = sorted.map(t => t.amount).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)];
    if (!sorted.every(t => Math.abs(t.amount - median) <= median * 0.2)) continue;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) gaps.push((+new Date(sorted[i].date) - +new Date(sorted[i - 1].date)) / DAY);
    const monthlyGaps = gaps.filter(g => g >= 25 && g <= 35).length;
    if (monthlyGaps < Math.max(1, gaps.length * 0.6)) continue;

    const last = sorted[sorted.length - 1];
    const next = new Date(last.date);
    next.setMonth(next.getMonth() + 1);
    const daysUntil = Math.round((next.getTime() - now.getTime()) / DAY);
    if (daysUntil < -20) continue; // looks cancelled

    result.push({
      key,
      name: last.description,
      category: last.category,
      amount: median,
      lastDate: last.date,
      nextDate: next.toISOString(),
      occurrences: sorted.length,
      daysUntil,
    });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ---------------------------------------------------------------------------
// Month forecast & safe-to-spend
// ---------------------------------------------------------------------------

export interface MonthForecast {
  month: string;
  income: number;
  incomeIsEstimate: boolean;
  spent: number;
  projectedSpend: number;
  upcomingBills: number;
  daysLeft: number;
  dayOfMonth: number;
  totalDays: number;
  /** What can be spent per remaining day while still covering known bills. */
  safeToSpendDaily: number;
  projectedNet: number;
}

export function monthForecast(txs: Transaction[], now = new Date()): MonthForecast {
  const month = monthKey(now);
  const totalDays = daysInMonth(month);
  const dayOfMonth = now.getDate();
  const daysLeft = totalDays - dayOfMonth + 1; // include today

  const actualIncome = sumWhere(txs, 'income', month);
  const avg = trailingAverages(txs, month);
  // If salary hasn't landed yet this month, fall back to the usual monthly income.
  const incomeIsEstimate = actualIncome < avg.income * 0.5 && avg.monthsWithData > 0;
  const income = incomeIsEstimate ? avg.income : actualIncome;

  const spent = sumWhere(txs, 'expense', month);
  const recurring = detectRecurring(txs, now);
  const upcomingBills = recurring
    .filter(r => r.daysUntil >= 0 && getMonthYear(r.nextDate) === month)
    .reduce((s, r) => s + r.amount, 0);

  // Day-to-day pace leaves out bills already paid this month, so one big rent
  // payment on the 5th isn't extrapolated as if it happened every day.
  const recurringKeys = new Set(recurring.map(r => r.key));
  const billsPaid = txs
    .filter(t => t.type === 'expense' && getMonthYear(t.date) === month && recurringKeys.has(normalise(t.description)))
    .reduce((s, t) => s + t.amount, 0);
  const dailyPace = (spent - billsPaid) / Math.max(1, dayOfMonth);
  const projectedSpend = spent + upcomingBills + dailyPace * (daysLeft - 1);
  const safeToSpendDaily = Math.max(0, (income - spent - upcomingBills) / Math.max(1, daysLeft));

  return {
    month, income, incomeIsEstimate, spent, projectedSpend, upcomingBills,
    daysLeft, dayOfMonth, totalDays, safeToSpendDaily,
    projectedNet: income - projectedSpend,
  };
}

// ---------------------------------------------------------------------------
// Financial health score
// ---------------------------------------------------------------------------

export interface HealthFactor {
  id: 'savings' | 'budgets' | 'cushion' | 'debt';
  label: string;
  score: number;
  max: number;
  detail: string;
  tip: string;
}

export interface HealthScore {
  total: number;
  grade: 'Excellent' | 'Strong' | 'Fair' | 'Needs work' | 'Getting started';
  factors: HealthFactor[];
  hasEnoughData: boolean;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export function healthScore(ledger: Ledger, now = new Date()): HealthScore {
  const { transactions: txs, budgets, friends } = ledger;
  const month = monthKey(now);
  const avg = trailingAverages(txs, month);
  const incomeThis = sumWhere(txs, 'income', month);
  const spendThis = sumWhere(txs, 'expense', month);

  // 1. Savings rate (30): use trailing average when available, else this month.
  const income = avg.monthsWithData ? avg.income : incomeThis;
  const spend = avg.monthsWithData ? avg.expense : spendThis;
  const rate = income > 0 ? (income - spend) / income : 0;
  const savings: HealthFactor = {
    id: 'savings', label: 'Savings rate', max: 30,
    score: Math.round(30 * clamp(rate / 0.2)),
    detail: income > 0 ? `You keep ${Math.round(rate * 100)}% of what you earn` : 'No income recorded yet',
    tip: rate >= 0.2 ? 'Keeping 20% or more is a strong habit.' : 'Aim to keep at least 20% of income each month.',
  };

  // 2. Budget discipline (25): share of this month's budgets on track by pace.
  const fc = monthForecast(txs, now);
  const monthBudgets = budgets.filter(b => b.month === month);
  let onTrack = 0;
  for (const b of monthBudgets) {
    const s = txs.filter(t => t.type === 'expense' && t.category === b.category && getMonthYear(t.date) === month)
      .reduce((a, t) => a + t.amount, 0);
    const projected = (s / Math.max(1, fc.dayOfMonth)) * fc.totalDays;
    if (s <= b.limit && projected <= b.limit * 1.05) onTrack++;
  }
  const budgetsFactor: HealthFactor = {
    id: 'budgets', label: 'Budget discipline', max: 25,
    score: monthBudgets.length ? Math.round(25 * (onTrack / monthBudgets.length)) : 8,
    detail: monthBudgets.length ? `${onTrack} of ${monthBudgets.length} budgets on track` : 'No budgets set this month',
    tip: monthBudgets.length ? 'Budgets on pace to finish under their limit count as on track.' : 'Set a budget for your top two spending categories.',
  };

  // 3. Emergency cushion (25): months of spending covered by current balance.
  const balance = totalBalance(txs);
  const monthlySpend = avg.expense || spendThis || 0;
  const months = monthlySpend > 0 ? balance / monthlySpend : balance > 0 ? 6 : 0;
  const cushion: HealthFactor = {
    id: 'cushion', label: 'Emergency cushion', max: 25,
    score: Math.round(25 * clamp(months / 6)),
    detail: monthlySpend > 0 ? `Balance covers ${Math.max(0, months).toFixed(1)} months of spending` : 'Not enough spending history yet',
    tip: 'Three to six months of expenses set aside protects you from surprises.',
  };

  // 4. Debt load (20): what you owe friends relative to monthly income.
  const owed = friends.filter(f => f.type === 'i-owe').reduce((s, f) => s + friendRemaining(f), 0);
  const debtRatio = income > 0 ? owed / income : owed > 0 ? 1 : 0;
  const debt: HealthFactor = {
    id: 'debt', label: 'Debt load', max: 20,
    score: Math.round(20 * (1 - clamp(debtRatio))),
    detail: owed > 0 ? `You owe ${formatCurrency(owed)} to friends` : 'You owe nothing',
    tip: owed > 0 ? 'Clearing small IOUs first frees up headspace and goodwill.' : 'No outstanding IOUs. Nice.',
  };

  const factors = [savings, budgetsFactor, cushion, debt];
  const total = factors.reduce((s, f) => s + f.score, 0);
  const hasEnoughData = txs.length >= 5;
  const grade: HealthScore['grade'] = !hasEnoughData ? 'Getting started'
    : total >= 80 ? 'Excellent' : total >= 65 ? 'Strong' : total >= 45 ? 'Fair' : 'Needs work';

  return { total, grade, factors, hasEnoughData };
}

// ---------------------------------------------------------------------------
// Insight feed (dashboard + notification centre)
// ---------------------------------------------------------------------------

export interface Insight {
  id: string;
  tone: 'alert' | 'warn' | 'good' | 'info';
  title: string;
  body: string;
  action?: { label: string; to: string };
  /** Higher sorts first. */
  weight: number;
}

const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function buildInsights(ledger: Ledger, now = new Date()): Insight[] {
  const { transactions: txs, budgets, goals, friends } = ledger;
  const out: Insight[] = [];
  const month = monthKey(now);
  const fc = monthForecast(txs, now);

  if (txs.length === 0) {
    out.push({
      id: 'welcome', tone: 'info', weight: 100,
      title: 'Add your first transaction',
      body: 'Your forecast, health score and alerts appear once MoneyMate has a few entries to learn from.',
      action: { label: 'Go to transactions', to: '/transactions' },
    });
    return out;
  }

  // Budgets: over, or on pace to go over
  for (const b of budgets.filter(x => x.month === month)) {
    const spent = txs.filter(t => t.type === 'expense' && t.category === b.category && getMonthYear(t.date) === month)
      .reduce((s, t) => s + t.amount, 0);
    if (spent > b.limit) {
      out.push({
        id: `budget-over-${b.id}`, tone: 'alert', weight: 90,
        title: `${b.category} is over budget`,
        body: `You've spent ${formatCurrency(spent)} of ${formatCurrency(b.limit)}, ${formatCurrency(spent - b.limit)} over with ${fc.daysLeft - 1} days left.`,
        action: { label: 'Review budget', to: '/budgets' },
      });
      continue;
    }
    const pace = spent / Math.max(1, fc.dayOfMonth);
    if (pace > 0 && pace * fc.totalDays > b.limit * 1.05 && fc.dayOfMonth >= 5) {
      const crossDay = Math.ceil(b.limit / pace);
      const crossDate = new Date(now.getFullYear(), now.getMonth(), crossDay);
      out.push({
        id: `budget-pace-${b.id}`, tone: 'warn', weight: 75,
        title: `${b.category} is running hot`,
        body: `At this pace you'll pass your ${formatCurrency(b.limit)} limit around ${fmtDay(crossDate)}. Spending ${formatCurrency((b.limit - spent) / Math.max(1, fc.daysLeft))} a day keeps you under.`,
        action: { label: 'Review budget', to: '/budgets' },
      });
    }
  }

  // Month outlook
  if (fc.income > 0) {
    if (fc.projectedNet < 0) {
      out.push({
        id: 'forecast-negative', tone: 'alert', weight: 85,
        title: 'This month may end in the red',
        body: `Projected spending of ${formatCurrency(fc.projectedSpend)} is ${formatCurrency(-fc.projectedNet)} more than ${fc.incomeIsEstimate ? 'your usual' : 'this month’s'} income.`,
        action: { label: 'See where it goes', to: '/reports' },
      });
    } else if (fc.dayOfMonth > 10) {
      out.push({
        id: 'forecast-positive', tone: 'good', weight: 30,
        title: `On track to save ${formatCurrency(fc.projectedNet)}`,
        body: `That's ${Math.round((fc.projectedNet / fc.income) * 100)}% of income if spending holds its current pace.`,
      });
    }
  }

  // Category spikes vs the 3-month average, pro-rated to today
  const elapsed = fc.dayOfMonth / fc.totalDays;
  const cats = new Set(txs.filter(t => t.type === 'expense').map(t => t.category));
  const budgetFlagged = new Set(out.filter(i => i.id.startsWith('budget-')).map(i => i.title.split(' is ')[0]));
  for (const cat of cats) {
    if (budgetFlagged.has(cat)) continue; // already covered by a budget alert
    const now$ = txs.filter(t => t.type === 'expense' && t.category === cat && getMonthYear(t.date) === month).reduce((s, t) => s + t.amount, 0);
    let prev = 0, n = 0;
    for (let i = 1; i <= 3; i++) {
      const m = addMonths(month, -i);
      const v = txs.filter(t => t.type === 'expense' && t.category === cat && getMonthYear(t.date) === m).reduce((s, t) => s + t.amount, 0);
      if (v > 0) { prev += v; n++; }
    }
    if (n < 2) continue;
    const expected = (prev / n) * elapsed;
    if (expected > 0 && now$ > expected * 1.4 && now$ - expected > 500 && elapsed > 0.25) {
      out.push({
        id: `spike-${cat}`, tone: 'warn', weight: 60,
        title: `${cat} is up ${Math.round((now$ / expected - 1) * 100)}%`,
        body: `${formatCurrency(now$)} so far versus about ${formatCurrency(expected)} by this point in a typical month.`,
        action: { label: 'See transactions', to: `/transactions?search=${encodeURIComponent(cat)}` },
      });
    }
  }

  // Bills due this week
  for (const r of detectRecurring(txs, now).filter(r => r.daysUntil >= 0 && r.daysUntil <= 7)) {
    out.push({
      id: `bill-${r.key}`, tone: 'info', weight: 55 - r.daysUntil,
      title: `${r.name} due ${r.daysUntil === 0 ? 'today' : r.daysUntil === 1 ? 'tomorrow' : `in ${r.daysUntil} days`}`,
      body: `Usually ${formatCurrency(r.amount)}, based on ${r.occurrences} past payments.`,
      action: { label: 'See subscriptions', to: '/reports?tab=subscriptions' },
    });
  }

  // IOUs
  for (const f of friends) {
    const remaining = friendRemaining(f);
    if (!remaining || !f.dueDate) continue;
    const days = Math.round((new Date(f.dueDate).getTime() - now.getTime()) / DAY);
    if (f.type === 'owed-to-me' && days < 0) {
      out.push({
        id: `iou-late-${f.id}`, tone: 'warn', weight: 65,
        title: `${f.name} owes you ${formatCurrency(remaining)}`,
        body: `It was due ${-days} day${days === -1 ? '' : 's'} ago. A friendly nudge usually works.`,
        action: { label: 'Open IOUs', to: '/friends' },
      });
    } else if (f.type === 'i-owe' && days >= 0 && days <= 7) {
      out.push({
        id: `iou-due-${f.id}`, tone: 'warn', weight: 70,
        title: `Pay ${f.name} ${formatCurrency(remaining)}`,
        body: `Due ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`,
        action: { label: 'Open IOUs', to: '/friends' },
      });
    }
  }

  // Goals: what it takes to hit the date
  for (const g of goals) {
    const left = g.targetAmount - g.savedAmount;
    if (left <= 0) {
      out.push({ id: `goal-done-${g.id}`, tone: 'good', weight: 40, title: `${g.name} is fully funded`, body: 'Time to celebrate, or set the next goal.', action: { label: 'Open goals', to: '/goals' } });
      continue;
    }
    if (!g.targetDate) continue;
    const monthsLeft = Math.max(1, (new Date(g.targetDate).getTime() - now.getTime()) / (DAY * 30.44));
    const perMonth = left / monthsLeft;
    const behind = fc.income > 0 && perMonth > Math.max(0, fc.projectedNet);
    out.push({
      id: `goal-pace-${g.id}`, tone: behind ? 'warn' : 'info', weight: behind ? 50 : 20,
      title: `${g.name}: ${formatCurrency(perMonth)} a month`,
      body: behind
        ? `That's more than you're on track to save this month. Consider moving the date or trimming a category.`
        : `Setting that aside monthly reaches ${formatCurrency(g.targetAmount)} by ${new Date(g.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}.`,
      action: { label: 'Open goals', to: '/goals' },
    });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

// ---------------------------------------------------------------------------
// Calendar heatmap
// ---------------------------------------------------------------------------

export function dailySpend(txs: Transaction[], weeks = 18, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Start on a Monday so columns are whole weeks
  const start = new Date(end.getTime() - (weeks * 7 - 1) * DAY);
  const shift = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - shift);

  const totals = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const k = dayKey(new Date(t.date));
    totals.set(k, (totals.get(k) || 0) + t.amount);
  }
  const days: { date: Date; key: string; amount: number; future: boolean }[] = [];
  for (let d = new Date(start); d <= end || days.length % 7 !== 0; d = new Date(d.getTime() + DAY)) {
    const k = dayKey(d);
    days.push({ date: d, key: k, amount: totals.get(k) || 0, future: d > end });
  }
  const values = days.filter(d => d.amount > 0).map(d => d.amount).sort((a, b) => a - b);
  const p90 = values[Math.floor(values.length * 0.9)] || 1;
  return { days, p90 };
}
