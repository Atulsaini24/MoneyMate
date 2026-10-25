import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, ArrowUpDown, Trash2, Edit3, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { formatCurrency, formatDate, dayKey } from '@/lib/utils';
import { useUI } from '@/context/UIContext';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { useSearchParams } from 'react-router-dom';

export const TransactionsPage: React.FC = () => {
  const { transactions, deleteTransaction, getMonthlyIncome, getMonthlyExpenses } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(100);
  // Follow ?search= when the palette or an insight links here while already on this page
  useEffect(() => { setSearch(searchParams.get('search') || ''); }, [searchParams]);
  const { openAddSheet } = useUI();

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (typeFilter) {
      result = result.filter(t => t.type === typeFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDir === 'desc'
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    });

    return result;
  }, [transactions, search, categoryFilter, typeFilter, sortBy, sortDir]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment method', 'Notes'],
      ...filtered.map(t => [dayKey(new Date(t.date)), t.type, t.description, t.category, t.amount, t.paymentMethod || '', t.notes || '']),
    ];
    const blob = new Blob(['\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `moneymate-transactions-${dayKey(new Date())}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  // Day headers ("Today", "Yesterday", "Mon 12 Oct") only make sense when sorted by date
  const todayKey = dayKey(new Date());
  const yesterdayKey = dayKey(new Date(Date.now() - 86_400_000));
  const dayLabel = (k: string, d: Date) =>
    k === todayKey ? 'Today' : k === yesterdayKey ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  const dayNet = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of filtered) {
      const k = dayKey(new Date(t.date));
      m.set(k, (m.get(k) || 0) + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0));
    }
    return m;
  }, [filtered]);
  const visible = filtered.slice(0, limit);

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <div className="px-4 md:px-6 py-5 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-mm-text tracking-tight">Transactions</h1>
            <p className="text-xs text-mm-muted mt-0.5">Everything you've spent and earned</p>
          </div>
          <button
            onClick={() => openAddSheet({ type: 'expense' })}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-semibold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Entry</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="glass-card p-3.5 sm:p-4 specular-sheen min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-mm-muted uppercase tracking-wider mb-1">Money in</p>
            <p className="text-xl sm:text-2xl font-medium text-mm-positive number-display truncate">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="glass-card p-3.5 sm:p-4 specular-sheen min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-mm-muted uppercase tracking-wider mb-1">Money out</p>
            <p className="text-xl sm:text-2xl font-medium text-mm-negative number-display truncate">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative min-w-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mm-muted" />
            <input
              type="text"
              placeholder="Search description, category, notes or amount"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/14 text-xs sm:text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${
              showFilters 
                ? 'bg-mm-gold/15 text-mm-gold border-mm-gold/40' 
                : 'border-mm-line/14 bg-mm-bg2 text-mm-muted'
            }`}
            aria-label="Toggle filters"
          >
            <Filter size={16} />
          </button>
          <button
            onClick={() => setSortBy(b => (b === 'date' ? 'amount' : 'date'))}
            className="px-3 py-2.5 rounded-xl border border-mm-line/14 bg-mm-bg2 text-xs text-mm-text2 hover:text-mm-text transition-colors flex-shrink-0"
            aria-label={`Sorted by ${sortBy}. Switch sort field`}
          >
            {sortBy === 'date' ? 'Date' : 'Amount'}
          </button>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="p-2.5 rounded-xl border border-mm-line/14 bg-mm-bg2 text-mm-muted hover:text-mm-text transition-colors flex-shrink-0 disabled:opacity-40"
            aria-label="Download as CSV"
            title="Download these transactions as CSV"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="p-2.5 rounded-xl border border-mm-line/14 bg-mm-bg2 text-mm-muted hover:text-mm-text transition-colors flex-shrink-0"
            aria-label="Sort direction"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* Filter chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex flex-wrap gap-2 mb-2.5">
                <button
                  onClick={() => setTypeFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !typeFilter 
                      ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/35' 
                      : 'bg-mm-bg2 text-mm-text2 hover:text-mm-text border border-mm-line/10'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === 'income' 
                      ? 'bg-mm-positive/15 text-mm-positive border border-mm-positive/35' 
                      : 'bg-mm-bg2 text-mm-text2 hover:text-mm-text border border-mm-line/10'
                  }`}
                >
                  Inflow
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === 'expense' 
                      ? 'bg-mm-negative/15 text-mm-negative border border-mm-negative/35' 
                      : 'bg-mm-bg2 text-mm-text2 hover:text-mm-text border border-mm-line/10'
                  }`}
                >
                  Outflow
                </button>
              </div>
              <div className="-mx-4 px-4 overflow-x-auto scrollbar-none flex gap-1.5 pb-1">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    !categoryFilter 
                      ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/30' 
                      : 'bg-mm-bg2 text-mm-muted hover:text-mm-text border border-mm-line/10'
                  }`}
                >
                  All Categories
                </button>
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setCategoryFilter(categoryFilter === cat.name ? '' : cat.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      categoryFilter === cat.name 
                        ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/30' 
                        : 'bg-mm-bg2 text-mm-muted hover:text-mm-text border border-mm-line/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState
              image="/assets/moneymate/empty/empty-transactions-icon.jpg"
              title="No transactions found"
              description="Try adjusting your search query, clearing filters, or record a new transaction."
              actionText="Add Transaction"
              onAction={() => openAddSheet({ type: 'expense' })}
            />
          ) : (
            visible.map((tx, i) => {
              const catInfo = allCategories.find(c => c.name === tx.category);
              const k = dayKey(new Date(tx.date));
              const showHeader = sortBy === 'date' && (i === 0 || dayKey(new Date(visible[i - 1].date)) !== k);
              const net = dayNet.get(k) || 0;
              return (
                <React.Fragment key={tx.id}>
                {showHeader && (
                  <div className="flex items-baseline justify-between px-1 pt-3 pb-0.5 first:pt-0">
                    <h2 className="text-xs font-semibold text-mm-text2">{dayLabel(k, new Date(tx.date))}</h2>
                    <span className={`text-xs number-display ${net >= 0 ? 'text-mm-positive' : 'text-mm-muted'}`}>
                      {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net))}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 12) * 0.02, duration: 0.2 }}
                  className="glass-subtle p-3.5 flex items-center gap-3 group hover:border-mm-line/24 transition-all"
                >
                  <CategoryIcon
                    name={catInfo?.icon || 'Circle'}
                    color={catInfo?.color || '#D6BC86'}
                    size={17}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-mm-text truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-mm-muted">{tx.category}</span>
                      {sortBy !== 'date' && <>
                      <span className="text-[10px] text-mm-muted">•</span>
                      <span className="text-[10px] text-mm-muted">{formatDate(tx.date)}</span></>}
                      {tx.paymentMethod && (
                        <>
                          <span className="text-[10px] text-mm-muted hidden sm:inline">•</span>
                          <span className="text-[10px] text-mm-muted hidden sm:inline">{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-sm font-medium number-display ${tx.type === 'income' ? 'text-mm-positive' : 'text-mm-text'}`}>
                      {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '−'}{formatCurrency(tx.amount)}
                    </span>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTx(tx); }}
                        className="p-1.5 rounded-lg hover:bg-mm-text/5 transition-colors"
                        aria-label="Edit transaction"
                      >
                        <Edit3 size={14} className="text-mm-muted hover:text-mm-text" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTxId(tx.id); }}
                        className="p-1.5 rounded-lg hover:bg-mm-negative/10 transition-colors"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={14} className="text-mm-muted hover:text-mm-negative" />
                      </button>
                    </div>
                  </div>
                </motion.div>
                </React.Fragment>
              );
            })
          )}
          {filtered.length > limit && (
            <button onClick={() => setLimit(l => l + 100)} className="w-full py-3 rounded-xl border border-mm-line/14 text-sm text-mm-text2 hover:text-mm-text hover:border-mm-line/25">
              Show more ({filtered.length - limit} remaining)
            </button>
          )}
        </div>
      </div>

      {editTx && (
        <AddTransactionSheet
          isOpen={!!editTx}
          onClose={() => setEditTx(null)}
          editTransaction={editTx}
        />
      )}
      <ConfirmDialog
        isOpen={!!deleteTxId}
        onClose={() => setDeleteTxId(null)}
        onConfirm={() => deleteTxId && deleteTransaction(deleteTxId)}
        title="Delete transaction?"
        message="You can undo this for a few seconds after deleting."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

