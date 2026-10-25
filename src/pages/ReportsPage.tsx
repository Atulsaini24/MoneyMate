import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronDown, PieChart as PieIcon, LineChart as LineIcon, Layers } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, getCurrentMonth, getMonthName, percentChange } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import { useSearchParams } from 'react-router-dom';
import { SpendingHeatmap } from '@/components/reports/SpendingHeatmap';
import { SubscriptionsPanel } from '@/components/reports/SubscriptionsPanel';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const LUXE_CHART_COLORS = [
  '#D6BC86', // Champagne Gold
  '#E9D8AF', // Soft Gold Highlight
  '#B6B0A5', // Secondary Warm Slate
  '#83C9A5', // Positive Sage
  '#D98282', // Negative Coral
  '#8E8A83', // Warm Charcoal
  '#D9B46F', // Warning Gold
  '#5C5852', // Deep Taupe
  '#A39E95', // Silver Oyster
];

export const ReportsPage: React.FC = () => {
  const { getCategorySpending, getMonthlyIncome, getMonthlyExpenses } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [params, setParams] = useSearchParams();
  type Tab = 'overview' | 'trends' | 'categories' | 'calendar' | 'subscriptions';
  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'trends', label: 'Trends' }, { id: 'categories', label: 'Categories' },
    { id: 'calendar', label: 'Calendar' }, { id: 'subscriptions', label: 'Subscriptions' },
  ];
  const activeTab: Tab = (TABS.find(t => t.id === params.get('tab'))?.id) || 'overview';
  const monthScoped = activeTab !== 'calendar' && activeTab !== 'subscriptions';
  const setActiveTab = (t: Tab) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true });

  const prevDate = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const income = getMonthlyIncome(selectedMonth);
  const expenses = getMonthlyExpenses(selectedMonth);
  const netCashFlow = income - expenses;
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  const prevIncome = getMonthlyIncome(prevMonth);
  const prevExpenses = getMonthlyExpenses(prevMonth);

  // Category spending
  const categoryData = useMemo(() =>
    EXPENSE_CATEGORIES.map(cat => ({
      name: cat.name,
      value: getCategorySpending(selectedMonth, cat.name),
      color: cat.color,
    })).filter(c => c.value > 0).sort((a, b) => b.value - a.value),
    [selectedMonth, getCategorySpending]
  );

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      data.push({
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        income: getMonthlyIncome(m),
        expenses: getMonthlyExpenses(m),
      });
    }
    return data;
  }, [getMonthlyIncome, getMonthlyExpenses]);

  // Months for selector
  const months: string[] = [];
  for (let i = -6; i <= 0; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="glass-card-elevated px-3 py-2 text-xs border border-mm-line/20 shadow-2xl rounded-xl bg-mm-elevated">
        <p className="text-mm-text font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="number-display font-medium">
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <div className="px-4 md:px-6 py-5 md:py-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-mm-text tracking-tight">
              Analytics
            </h1>
            <p className="text-xs text-mm-muted mt-0.5">Where your money comes from and where it goes</p>
          </div>
          <div className={`relative ${monthScoped ? '' : 'invisible'}`}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="appearance-none px-4 py-2 pr-9 rounded-xl glass-subtle text-xs font-semibold text-mm-text focus:outline-none focus:border-mm-gold/50 [color-scheme:dark] border border-mm-line/18 cursor-pointer shadow-lg bg-mm-bg2"
            >
              {months.map(m => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-mm-muted pointer-events-none" />
          </div>
        </div>

        {/* Tab navigation */}
        <div role="tablist" className="flex gap-1 p-1 rounded-xl glass-subtle w-full sm:w-fit overflow-x-auto scrollbar-none border border-mm-line/14 bg-mm-bg2">
          {TABS.map(({ id: tab, label }) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 py-1.5 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                activeTab === tab
                  ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/35 shadow-sm'
                  : 'text-mm-muted hover:text-mm-text border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        {monthScoped && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 sm:p-5 specular-sheen min-w-0">
            <p className="text-[11px] font-semibold text-mm-muted uppercase tracking-wider mb-1">Total Monthly Income</p>
            <p className="text-xl sm:text-2xl font-medium text-mm-positive number-display truncate">{formatCurrency(income)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="glass-card p-4 sm:p-5 specular-sheen min-w-0">
            <p className="text-[11px] font-semibold text-mm-muted uppercase tracking-wider mb-1">Total Expenses</p>
            <p className="text-xl sm:text-2xl font-medium text-mm-negative number-display truncate">{formatCurrency(expenses)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-4 sm:p-5 specular-sheen min-w-0">
            <p className="text-[11px] font-semibold text-mm-muted uppercase tracking-wider mb-1">Net Savings Accrual</p>
            <p className={`text-xl sm:text-2xl font-medium number-display truncate ${netCashFlow >= 0 ? 'text-mm-gold' : 'text-mm-negative'}`}>
              {formatCurrency(netCashFlow)}
            </p>
          </motion.div>
        </div>
        )}

        {activeTab === 'calendar' && <SpendingHeatmap />}
        {activeTab === 'subscriptions' && <SubscriptionsPanel />}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Savings rate */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card-elevated p-6 specular-sheen">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-mm-muted">Capital Savings Rate</p>
                  <p className="text-4xl font-medium text-mm-gold number-display mt-1">{savingsRate}%</p>
                  <p className="text-xs text-mm-text2 mt-2 font-medium">
                    {savingsRate >= 20 ? 'Optimal wealth accumulation trajectory maintained.' : 'Target at least 25% allocation to investment & high-yield savings.'}
                  </p>
                </div>
                <div className="w-24 h-24 relative flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(214,188,134,0.1)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#D6BC86" strokeWidth="3"
                      strokeDasharray={`${Math.max(0, savingsRate)} ${Math.max(0, 100 - savingsRate)}`} strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Income vs Expenses chart */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-mm-muted mb-5">Income vs Outflow Momentum (Last 6 Months)</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(214,188,134,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#77736D' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#77736D' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" fill="#83C9A5" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#D98282" radius={[4, 4, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'trends' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-mm-muted mb-5">Monthly Expense Trend Trajectory</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(214,188,134,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#77736D' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#77736D' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="expenses" fill="#D6BC86" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-mm-muted mb-5">Category Spending Proportions</h3>
            {categoryData.length === 0 ? (
              <p className="text-sm text-mm-muted text-center py-10">No categorized transaction activity recorded for this period.</p>
            ) : (
              <div className="space-y-4">
                {categoryData.map((cat, i) => {
                  const maxValue = categoryData[0]?.value || 1;
                  const width = Math.round((cat.value / maxValue) * 100);
                  return (
                    <div key={cat.name} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs text-mm-text2 w-24 sm:w-32 truncate font-medium flex-shrink-0">{cat.name}</span>
                      <div className="flex-1 progress-bar">
                        <motion.div
                          className="progress-bar-fill"
                          style={{ backgroundColor: LUXE_CHART_COLORS[i % LUXE_CHART_COLORS.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.7, delay: i * 0.03 }}
                        />
                      </div>
                      <span className="text-xs font-medium text-mm-text number-display w-16 sm:w-20 text-right flex-shrink-0">
                        {formatCurrency(cat.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Comparison with previous month */}
        {monthScoped && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-mm-muted mb-4">Compared with last month</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-mm-bg2 border border-mm-line/12">
              <p className="text-xs text-mm-muted mb-1">Income</p>
              <div className="flex items-center gap-1.5 mt-1">
                {income >= prevIncome ? <TrendingUp size={16} className="text-mm-positive" /> : <TrendingDown size={16} className="text-mm-negative" />}
                <span className={`text-base font-medium number-display ${income >= prevIncome ? 'text-mm-positive' : 'text-mm-negative'}`}>
                  {percentChange(income, prevIncome)}%
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-mm-bg2 border border-mm-line/12">
              <p className="text-xs text-mm-muted mb-1">Spending</p>
              <div className="flex items-center gap-1.5 mt-1">
                {expenses <= prevExpenses ? <TrendingDown size={16} className="text-mm-positive" /> : <TrendingUp size={16} className="text-mm-negative" />}
                <span className={`text-base font-medium number-display ${expenses <= prevExpenses ? 'text-mm-positive' : 'text-mm-negative'}`}>
                  {percentChange(expenses, prevExpenses)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
        )}
      </div>
    </div>
  );
};

