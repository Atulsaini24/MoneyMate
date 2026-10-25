import React from 'react';
import { Plus, ScanLine } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { getGreeting, getCurrentMonth, addMonths, percentChange } from '@/lib/utils';
import { useInsights } from '@/lib/useInsights';
import { totalBalance } from '@/lib/insights';
import { EXPENSE_CATEGORIES } from '@/types';
import { FinancialPulse } from '@/components/dashboard/FinancialPulse';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { FinancialMetricCard } from '@/components/dashboard/FinancialMetricCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SpendingDonutChart } from '@/components/dashboard/SpendingDonutChart';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { SavingsGoalsPreview } from '@/components/dashboard/SavingsGoalsPreview';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { UpcomingBills } from '@/components/dashboard/UpcomingBills';
import { RecapBanner } from '@/components/dashboard/RecapBanner';
import { SweepPrompt } from '@/components/dashboard/SweepPrompt';

export const DashboardPage: React.FC = () => {
  const { settings, transactions, budgets, getMonthlyIncome, getMonthlyExpenses, getCategorySpending } = useApp();
  const { openAddSheet, setScannerOpen } = useUI();
  const { series } = useInsights();

  const currentMonth = getCurrentMonth();
  const prevMonth = addMonths(currentMonth, -1);

  const income = getMonthlyIncome(currentMonth);
  const expenses = getMonthlyExpenses(currentMonth);
  const remaining = income - expenses;
  const balance = totalBalance(transactions);

  const prevIncome = getMonthlyIncome(prevMonth);
  const prevExpenses = getMonthlyExpenses(prevMonth);
  const prevRemaining = prevIncome - prevExpenses;

  const incomeChange = prevIncome > 0 ? percentChange(income, prevIncome) : 0;
  const expenseChange = prevExpenses > 0 ? percentChange(expenses, prevExpenses) : 0;
  const remainingChange = prevRemaining > 0 ? percentChange(remaining, prevRemaining) : 0;
  const monthAgo = series[0]?.value ?? 0;
  const balanceChange = monthAgo > 0 ? percentChange(balance, monthAgo) : 0;

  const categorySpending = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.name,
    value: getCategorySpending(currentMonth, cat.name),
  })).filter(c => c.value > 0);

  const budgetData = budgets
    .filter(b => b.month === currentMonth)
    .map(b => ({ category: b.category, spent: getCategorySpending(currentMonth, b.category), limit: b.limit }));

  const firstName = settings.name?.split(' ')[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <div className="px-4 md:px-6 pt-5 pb-1 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-mm-muted">{today}</p>
          <h1 className="text-2xl sm:text-[1.75rem] font-serif text-mm-text tracking-tight mt-0.5 truncate">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setScannerOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-mm-line/25 text-mm-text text-xs font-semibold hover:border-mm-gold/60 transition-colors"
          >
            <ScanLine size={14} /> Scan receipt
          </button>
          <button
            onClick={() => openAddSheet({ type: 'expense' })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mm-gold text-mm-on-gold font-semibold text-xs hover:bg-mm-gold-light transition-colors active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} /> Add expense
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-4 mt-4">
        <FinancialPulse />

        <RecapBanner />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <div className="col-span-2 lg:col-span-1"><BalanceCard balance={balance} change={balanceChange} chartData={series} /></div>
          <FinancialMetricCard title="Income this month" amount={income} change={incomeChange} type="income" delay={0.03} />
          <FinancialMetricCard title="Spent this month" amount={expenses} change={expenseChange} type="expense" delay={0.06} />
          <FinancialMetricCard title="Left this month" amount={remaining} change={remainingChange} type="remaining" delay={0.09} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <InsightsPanel />
          <UpcomingBills />
        </div>

        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpendingDonutChart data={categorySpending} total={expenses} />
          <BudgetOverview budgets={budgetData} />
        </div>

        <SavingsGoalsPreview />
        <SweepPrompt />
      </div>
    </div>
  );
};
