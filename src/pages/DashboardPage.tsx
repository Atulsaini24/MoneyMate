import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, ScanLine, Mic } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { getGreeting, getCurrentMonth } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import { Page } from '@/components/ui';
import { TiltCard, Stagger, StaggerItem } from '@/components/motion';
import { SafeToSpend } from '@/components/dashboard/SafeToSpend';
import { MonthSummary } from '@/components/dashboard/MonthSummary';
import { GettingStarted } from '@/components/dashboard/GettingStarted';
import { SpendingDonutChart } from '@/components/dashboard/SpendingDonutChart';
import { BudgetOverview } from '@/components/dashboard/BudgetOverview';
import { SavingsGoalsPreview } from '@/components/dashboard/SavingsGoalsPreview';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { UpcomingBills } from '@/components/dashboard/UpcomingBills';
import { RecapBanner } from '@/components/dashboard/RecapBanner';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SweepPrompt } from '@/components/dashboard/SweepPrompt';

export const DashboardPage: React.FC = () => {
  const { settings, budgets, transactions, getMonthlyExpenses, getCategorySpending } = useApp();
  const { openAddSheet, setScannerOpen, setVoiceOpen } = useUI();
  const month = getCurrentMonth();
  const expenses = getMonthlyExpenses(month);

  const categorySpending = EXPENSE_CATEGORIES.map(cat => ({ name: cat.name, value: getCategorySpending(month, cat.name) })).filter(c => c.value > 0);
  const budgetData = budgets.filter(b => b.month === month).map(b => ({ category: b.category, spent: getCategorySpending(month, b.category), limit: b.limit }));
  const firstName = settings.name?.trim().split(' ')[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const isNew = transactions.length === 0;

  const quick = [
    { label: 'Expense', icon: ArrowUpRight, color: '#D9573B', run: () => openAddSheet({ type: 'expense' }) },
    { label: 'Income', icon: ArrowDownLeft, color: '#1F8A55', run: () => openAddSheet({ type: 'income' }) },
    { label: 'Scan bill', icon: ScanLine, color: '#8458D4', run: () => setScannerOpen(true) },
    { label: 'Say it', icon: Mic, color: '#2F7BD8', run: () => setVoiceOpen(true) },
  ];

  return (
    <Page width="wide">
      <header className="mb-5 sm:mb-7">
        <p className="text-sm text-mm-muted">{today}</p>
        <h1 className="text-[1.75rem] sm:text-[2.25rem] leading-tight font-semibold text-mm-text mt-0.5">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
      </header>

      <Stagger className="space-y-4 sm:space-y-5" stagger={0.09}>
        <StaggerItem className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 sm:gap-5">
          <TiltCard max={4} className="rounded-[24px]"><SafeToSpend /></TiltCard>
          <div className="lg:hidden grid grid-cols-4 gap-1 -mx-1">
            {quick.map((q, i) => (
              <motion.button key={q.label} onClick={q.run} whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 14, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25 + i * 0.05, type: 'spring', stiffness: 420, damping: 24 }}
                className="flex flex-col items-center gap-2 py-1.5 rounded-2xl">
                <span className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(150deg, color-mix(in oklab, ${q.color} 78%, white), ${q.color} 55%, color-mix(in oklab, ${q.color} 80%, black))`, boxShadow: `0 12px 22px -12px ${q.color}, inset 0 1px 0 rgb(255 255 255 / 0.35)` }}>
                  <q.icon size={23} strokeWidth={2.2} />
                </span>
                <span className="text-[12.5px] font-semibold text-mm-text">{q.label}</span>
              </motion.button>
            ))}
          </div>
          <MonthSummary />
        </StaggerItem>

        <StaggerItem><GettingStarted /></StaggerItem>

        {/* A brand-new account sees the checklist only, not a wall of empty panels */}
        {!isNew && (
          <>
            <StaggerItem><RecapBanner /></StaggerItem>
            <StaggerItem className="lg:hidden"><SavingsGoalsPreview /></StaggerItem>
            <StaggerItem className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <InsightsPanel />
              <UpcomingBills />
            </StaggerItem>
            <StaggerItem className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <RecentTransactions />
              <SpendingDonutChart data={categorySpending} total={expenses} />
            </StaggerItem>
            <StaggerItem className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <BudgetOverview budgets={budgetData} />
              <div className="hidden lg:block"><SavingsGoalsPreview /></div>
            </StaggerItem>
          </>
        )}
      </Stagger>
      <SweepPrompt />
    </Page>
  );
};
