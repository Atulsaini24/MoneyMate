import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';

interface FinancialMetricCardProps {
  title: string;
  amount: number;
  change: number;
  type: 'income' | 'expense' | 'remaining';
  delay?: number;
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  title, amount, change, type, delay = 0
}) => {
  const isPositiveChange = type === 'expense' ? change <= 0 : change >= 0;

  const config = {
    income: {
      icon: ArrowDownLeft,
      color: 'text-mm-positive',
      bg: 'bg-mm-positive/10 border-mm-positive/20 text-mm-positive',
    },
    expense: {
      icon: ArrowUpRight,
      color: 'text-mm-negative',
      bg: 'bg-mm-negative/10 border-mm-negative/20 text-mm-negative',
    },
    remaining: {
      icon: Wallet,
      color: 'text-mm-gold',
      bg: 'bg-mm-gold/10 border-mm-gold/20 text-mm-gold',
    },
  };

  const cfg = config[type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + delay, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-4 sm:p-5 relative overflow-hidden group min-w-0"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-mm-text2 font-medium truncate">{title}</span>
        <div className={`p-1.5 rounded-lg border ${cfg.bg} flex items-center justify-center`}>
          <Icon size={14} strokeWidth={1.75} />
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold truncate text-mm-text number-display tracking-tight mt-1">
        <AnimatedNumber value={amount} />
      </h3>

      <div className="flex items-center gap-1.5 mt-2.5">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
          isPositiveChange 
            ? 'bg-mm-positive/10 border-mm-positive/20 text-mm-positive' 
            : 'bg-mm-negative/10 border-mm-negative/20 text-mm-negative'
        }`}>
          {isPositiveChange ? <TrendingUp size={11} strokeWidth={1.75} /> : <TrendingDown size={11} strokeWidth={1.75} />}
          <span>{change >= 0 ? '+' : ''}{change}%</span>
        </div>
        <span className="text-[10px] text-mm-muted">vs last month</span>
      </div>
    </motion.div>
  );
};
