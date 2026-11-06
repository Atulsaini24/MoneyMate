import React from 'react';
import { motion } from 'framer-motion';
import { categoryInfo, type Transaction } from '@/types';
import { MerchantLogo } from '@/components/shared/MerchantLogo';
import { formatCurrency, cn } from '@/lib/utils';

const shortDay = (iso: string) => {
  const d = new Date(iso), now = new Date();
  const k = (x: Date) => x.toDateString();
  if (k(d) === k(now)) return 'Today';
  if (k(d) === k(new Date(now.getTime() - 86_400_000))) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
};

/** One transaction as a tappable row. Used on Home and in Transactions. */
export const TransactionRow: React.FC<{ tx: Transaction; onClick?: () => void; showDate?: boolean; trailing?: React.ReactNode; index?: number }> = ({ tx, onClick, showDate, trailing, index = 0 }) => {
  const cat = tx.type === 'transfer' ? { icon: 'ArrowLeftRight', color: '#7C8884' } : categoryInfo(tx.category, tx.type);
  const sign = tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '−';
  const meta = [tx.type === 'transfer' ? 'Transfer' : tx.category, showDate ? shortDay(tx.date) : null, tx.paymentMethod].filter(Boolean).join(' · ');
  const Tag = onClick ? 'button' : 'div';
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30, delay: Math.min(index, 14) * 0.03 }}>
    <Tag {...(onClick ? { type: 'button' as const, onClick, 'aria-label': `${tx.description}, ${sign}${formatCurrency(tx.amount)}. Edit` } : {})}
      className={cn('group/row w-full flex items-center gap-3 py-2.5 text-left', onClick && 'rounded-xl -mx-2 px-2 w-[calc(100%+1rem)] hover:bg-mm-text/[0.035] active:bg-mm-text/[0.06] active:scale-[0.99] transition-[background-color,transform]')}>
      <span className="transition-transform duration-300 group-hover/row:scale-110 group-hover/row:-rotate-6"><MerchantLogo description={tx.description} icon={cat.icon} color={cat.color} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-medium text-mm-text truncate">{tx.description}</span>
        <span className="block text-[13px] text-mm-muted truncate">{meta}</span>
      </span>
      <span className={cn('amount text-[15px] font-semibold shrink-0', tx.type === 'income' ? 'text-mm-positive' : 'text-mm-text')}>
        {sign}{formatCurrency(tx.amount)}
      </span>
      {trailing}
    </Tag>
    </motion.div>
  );
};
