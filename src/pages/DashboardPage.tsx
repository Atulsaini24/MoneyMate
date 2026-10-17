import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Plus, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, getGreeting, getCurrentMonth, getMonthYear, percentChange } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import { LandscapeHero } from '@/components/shared/LandscapeHero';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { FinancialMetricCard } from '@/components/dashboard/FinancialMetricCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { SpendingDonutChart } from '@/components/dashboard/SpendingDonutChart';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { SavingsGoalsPreview } from '@/components/dashboard/SavingsGoalsPreview';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { MOTIVATIONAL_QUOTES } from '@/data/seed';

export const DashboardPage: React.FC = () => {
  const { settings, transactions, budgets, getMonthlyIncome, getMonthlyExpenses, getCategorySpending } = useApp();
  const [showAddExpense, setShowAddExpense] = useState(false);

  const currentMonth = getCurrentMonth();
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const income = getMonthlyIncome(currentMonth);
  const expenses = getMonthlyExpenses(currentMonth);
  const remaining = income - expenses;
  const balance = transactions.reduce((sum, t) => {
    if (t.type === 'income') return sum + t.amount;
    if (t.type === 'expense') return sum - t.amount;
    return sum;
  }, 0);

  const prevIncome = getMonthlyIncome(prevMonth);
  const prevExpenses = getMonthlyExpenses(prevMonth);
  const prevRemaining = prevIncome - prevExpenses;

  const incomeChange = prevIncome > 0 ? percentChange(income, prevIncome) : 0;
  const expenseChange = prevExpenses > 0 ? percentChange(expenses, prevExpenses) : 0;
  const remainingChange = prevRemaining > 0 ? percentChange(remaining, prevRemaining) : 0;
  const balanceChange = 0;

  // Spending by category
  const categorySpending = EXPENSE_CATEGORIES.map(cat => ({
    name: cat.name,
    value: getCategorySpending(currentMonth, cat.name),
  })).filter(c => c.value > 0);

  // Budget data
  const budgetData = budgets
    .filter(b => b.month === currentMonth)
    .map(b => ({
      category: b.category,
      spent: getCategorySpending(currentMonth, b.category),
      limit: b.limit,
    }));

  // Sparkline data
  const chartData = [
    { value: 0 }, { value: balance * 0.2 }, { value: balance * 0.5 }, { value: balance * 0.8 }, { value: balance },
  ];

  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      {/* Welcome greeting header */}
      <div className="px-4 md:px-6 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#D6BC86] uppercase tracking-[0.16em] font-semibold block">
              {getGreeting()}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F1E8] tracking-tight">
              {settings.name}
            </h1>
            <p className="text-xs text-[#77736D] mt-0.5 hidden sm:block">
              Real-time wealth intelligence and liquidity positions
            </p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#D6BC86] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase hover:bg-[#E9D8AF] transition-all shadow-sm active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Outflow</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-5 mt-3">
        {/* Compact Landscape Ambiance */}
        <LandscapeHero quote={quote} />

        {/* Financial Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
          <div className="lg:col-span-1">
            <BalanceCard balance={balance} change={balanceChange} chartData={chartData} />
          </div>
          <FinancialMetricCard title="Monthly Inflows" amount={income} change={incomeChange} type="income" delay={0.03} />
          <FinancialMetricCard title="Total Expenditures" amount={expenses} change={expenseChange} type="expense" delay={0.06} />
          <FinancialMetricCard title="Remaining Liquidity" amount={remaining} change={remainingChange} type="remaining" delay={0.09} />
        </div>

        {/* Quick Operations */}
        <QuickActions />

        {/* Analytics & Budget Limits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpendingDonutChart 
            data={categorySpending}
            total={expenses}
          />
          <BudgetOverview 
            budgets={budgetData}
          />
        </div>

        {/* Strategic Savings Goals */}
        <SavingsGoalsPreview />
      </div>

      <AddTransactionSheet isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} />
    </div>
  );
};
