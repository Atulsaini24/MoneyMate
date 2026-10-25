import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { formatCurrency, getProgressColor } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { useNavigate } from 'react-router-dom';

interface BudgetOverviewProps {
  budgets: { category: string; spent: number; limit: number }[];
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ budgets }) => {
  const navigate = useNavigate();

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-mm-text">
            Budgets this month
          </h3>
          <p className="text-xs text-mm-text2 mt-0.5">How each category is tracking</p>
        </div>
        <button 
          onClick={() => navigate('/budgets')}
          className="text-xs text-mm-gold font-medium hover:text-mm-gold-light transition-colors"
        >
          Manage
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 my-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-mm-bg2 border border-mm-line/14 flex items-center justify-center text-mm-gold mb-3">
            <span className="text-xs font-serif">₹0</span>
          </div>
          <p className="text-xs font-medium text-mm-text2">No budget envelopes established</p>
          <p className="text-[11px] text-mm-muted mt-0.5">Use Manage to set spending ceilings for this month</p>
        </div>
      ) : (
        <div className="space-y-3.5 my-auto">
          {budgets.slice(0, 5).map((budget) => {
          const percentage = Math.min(Math.round((budget.spent / budget.limit) * 100), 100);
          const color = getProgressColor(percentage);
          const catInfo = EXPENSE_CATEGORIES.find(c => c.name === budget.category);
          const isWarning = percentage >= 75;

          return (
            <div
              key={budget.category}
              className="group cursor-pointer p-1.5 rounded-lg hover:bg-mm-bg2 transition-colors"
              onClick={() => navigate('/budgets')}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {catInfo && (
                    <CategoryIcon name={catInfo.icon} color={catInfo.color} size={13} className="!w-6 !h-6 !rounded-md flex-shrink-0" />
                  )}
                  <span className="text-mm-text font-medium truncate">{budget.category}</span>
                  {isWarning && (
                    <AlertCircle size={12} className="text-mm-warning flex-shrink-0" strokeWidth={2} />
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="text-mm-muted number-display text-[11px] sm:text-xs">
                    {formatCurrency(budget.spent)} <span className="text-[#4A4742]">/</span> {formatCurrency(budget.limit)}
                  </span>
                  <span className="font-semibold number-display text-right w-8 sm:w-10 text-[11px] sm:text-xs" style={{ color }}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ backgroundColor: color, width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
