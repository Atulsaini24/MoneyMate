import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { BudgetAutopilot } from '@/components/budgets/BudgetAutopilot';
import { EXPENSE_CATEGORIES } from '@/types';
import { formatCurrency, getCurrentMonth, getMonthName, getProgressColor } from '@/lib/utils';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getCategorySpending } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState<string | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formThreshold, setFormThreshold] = useState('80');

  const monthBudgets = budgets.filter(b => b.month === selectedMonth);
  const totalAllocated = monthBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + getCategorySpending(selectedMonth, b.category), 0);
  const totalRemaining = totalAllocated - totalSpent;

  const usedCategories = monthBudgets.map(b => b.category);
  const availableCategories = EXPENSE_CATEGORIES.filter(c => !usedCategories.includes(c.name));

  const resetForm = () => {
    setFormCategory('');
    setFormLimit('');
    setFormThreshold('80');
  };

  const handleSaveBudget = () => {
    if (!formCategory || !formLimit || parseFloat(formLimit) <= 0) return;
    
    if (editBudgetId) {
      updateBudget(editBudgetId, {
        category: formCategory,
        limit: parseFloat(formLimit),
        alertThreshold: parseInt(formThreshold),
      });
      setEditBudgetId(null);
    } else {
      addBudget({
        category: formCategory,
        limit: parseFloat(formLimit),
        month: selectedMonth,
        alertThreshold: parseInt(formThreshold),
      });
    }
    resetForm();
    setShowAddBudget(false);
  };

  const handleEdit = (id: string) => {
    const b = budgets.find(b => b.id === id);
    if (!b) return;
    setFormCategory(b.category);
    setFormLimit(b.limit.toString());
    setFormThreshold((b.alertThreshold || 80).toString());
    setEditBudgetId(id);
    setShowAddBudget(true);
  };

  // Month navigation
  const months: string[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <div className="px-4 md:px-6 py-5 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-mm-text tracking-tight">Budgets</h1>
            <p className="text-xs text-mm-muted mt-0.5">Control allocations and disciplined expenditure thresholds</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditBudgetId(null); setShowAddBudget(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-semibold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Set Budget</span>
            <span className="sm:hidden">Set</span>
          </button>
        </div>

        {/* Month selector */}
        <div className="-mx-4 px-4 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 mb-4 scrollbar-none">
          {months.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedMonth === month
                  ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/35 shadow-sm'
                  : 'bg-mm-bg2 text-mm-muted hover:text-mm-text border border-mm-line/10'
              }`}
            >
              {getMonthName(month)}
            </button>
          ))}
        </div>

        <BudgetAutopilot month={selectedMonth} />

        {/* Monthly Budget Overview card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated p-4 sm:p-5 mb-5 specular-sheen"
        >
          <h3 className="text-xs text-mm-text2 font-semibold uppercase tracking-wider mb-2.5">Monthly Budget Summary</h3>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-3">
            <div>
              <p className="text-2xl sm:text-3xl font-medium text-mm-text number-display">
                {formatCurrency(totalAllocated)}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs text-mm-muted number-display">
                {formatCurrency(totalSpent)} spent • {formatCurrency(totalRemaining > 0 ? totalRemaining : 0)} left
              </p>
            </div>
          </div>
          <div className="progress-bar h-2">
            <motion.div
              className="progress-bar-fill"
              style={{ backgroundColor: getProgressColor(totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0) }}
              initial={{ width: 0 }}
              animate={{ width: `${totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-xs text-mm-muted mt-2 number-display">
            {totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% of total budget used
          </p>
        </motion.div>

        {/* Budget cards */}
        {monthBudgets.length === 0 ? (
          <EmptyState
            image="/assets/moneymate/empty/empty-budgets-icon.jpg"
            title="No budgets set for this month"
            description="Create monthly category budgets to keep spending disciplined and receive threshold alerts."
            actionText="Set Category Budget"
            onAction={() => setShowAddBudget(true)}
          />
        ) : (
          <div className="space-y-3">
            {monthBudgets.map((budget, i) => {
              const spent = getCategorySpending(selectedMonth, budget.category);
              const percentage = Math.round((spent / budget.limit) * 100);
              const color = getProgressColor(percentage);
              const catInfo = EXPENSE_CATEGORIES.find(c => c.name === budget.category);
              const isOverBudget = spent > budget.limit;
              const isNearLimit = percentage >= (budget.alertThreshold || 80);

              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="glass-card p-4 hover:border-mm-line/22 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {catInfo && <CategoryIcon name={catInfo.icon} color={catInfo.color} size={17} />}
                      <div>
                        <h4 className="text-sm font-medium text-mm-text">{budget.category}</h4>
                        <p className="text-xs text-mm-muted number-display">
                          {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isOverBudget || isNearLimit) && (
                        <AlertTriangle size={14} className={isOverBudget ? 'text-mm-negative' : 'text-mm-warning'} />
                      )}
                      <span className="text-sm font-semibold number-display" style={{ color }}>
                        {percentage}%
                      </span>
                      <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(budget.id)} className="p-1.5 rounded-lg hover:bg-mm-text/5" aria-label="Edit budget">
                          <Edit3 size={14} className="text-mm-muted hover:text-mm-text" />
                        </button>
                        <button onClick={() => setDeleteBudgetId(budget.id)} className="p-1.5 rounded-lg hover:bg-mm-negative/10" aria-label="Delete budget">
                          <Trash2 size={14} className="text-mm-muted hover:text-mm-negative" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(percentage, 100)}%` }}
                      transition={{ duration: 0.7, delay: i * 0.03 }}
                    />
                  </div>
                  {isOverBudget && (
                    <p className="text-xs text-mm-negative mt-2 number-display">
                      Over budget by {formatCurrency(spent - budget.limit)}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      <Modal
        isOpen={showAddBudget}
        onClose={() => { setShowAddBudget(false); setEditBudgetId(null); resetForm(); }}
        title={editBudgetId ? 'Edit Budget' : 'Add Budget'}
        footer={
          <button
            onClick={handleSaveBudget}
            disabled={!formCategory || !formLimit}
            className="w-full py-3.5 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            {editBudgetId ? 'Update Budget Plan' : 'Confirm Budget Allocation'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-mm-text2 font-medium mb-1.5 block">Category</label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text focus:outline-none focus:border-mm-gold/50 [color-scheme:dark] cursor-pointer"
            >
              <option value="">Select category</option>
              {(editBudgetId ? EXPENSE_CATEGORIES : availableCategories).map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-mm-text2 font-medium mb-1.5 block">Monthly Limit (₹)</label>
            <input
              type="number"
              placeholder="Enter budget limit"
              value={formLimit}
              onChange={e => setFormLimit(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50 number-display"
            />
          </div>
          <div>
            <label className="text-xs text-mm-text2 font-medium mb-1.5 block">Alert Threshold (%)</label>
            <input
              type="number"
              placeholder="80"
              value={formThreshold}
              onChange={e => setFormThreshold(e.target.value)}
              min="50"
              max="100"
              className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50 number-display"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteBudgetId}
        onClose={() => setDeleteBudgetId(null)}
        onConfirm={() => deleteBudgetId && deleteBudget(deleteBudgetId)}
        title="Delete Budget"
        message="Are you sure you want to remove this budget?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

