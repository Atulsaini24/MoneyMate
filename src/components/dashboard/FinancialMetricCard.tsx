import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
      color: 'text-[#83C9A5]',
      bg: 'bg-[#83C9A5]/10 border-[#83C9A5]/20 text-[#83C9A5]',
    },
    expense: {
      icon: ArrowUpRight,
      color: 'text-[#D98282]',
      bg: 'bg-[#D98282]/10 border-[#D98282]/20 text-[#D98282]',
    },
    remaining: {
      icon: Wallet,
      color: 'text-[#D6BC86]',
      bg: 'bg-[#D6BC86]/10 border-[#D6BC86]/20 text-[#D6BC86]',
    },
  };

  const cfg = config[type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + delay, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-5 relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-[#B6B0A5] font-semibold uppercase tracking-[0.12em]">{title}</span>
        <div className={`p-1.5 rounded-lg border ${cfg.bg} flex items-center justify-center`}>
          <Icon size={14} strokeWidth={1.75} />
        </div>
      </div>

      <h3 className="text-2xl font-semibold text-[#F5F1E8] number-display tracking-tight mt-1">
        {formatCurrency(amount)}
      </h3>

      <div className="flex items-center gap-1.5 mt-2.5">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
          isPositiveChange 
            ? 'bg-[#83C9A5]/10 border-[#83C9A5]/20 text-[#83C9A5]' 
            : 'bg-[#D98282]/10 border-[#D98282]/20 text-[#D98282]'
        }`}>
          {isPositiveChange ? <TrendingUp size={11} strokeWidth={1.75} /> : <TrendingDown size={11} strokeWidth={1.75} />}
          <span>{change >= 0 ? '+' : ''}{change}%</span>
        </div>
        <span className="text-[10px] text-[#77736D]">vs last month</span>
      </div>
    </motion.div>
  );
};
