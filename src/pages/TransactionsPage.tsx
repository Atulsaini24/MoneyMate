import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, ArrowUpDown, Trash2, Edit3, Calendar, CreditCard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
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
  const [showAdd, setShowAdd] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
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

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <div className="px-4 md:px-6 py-5 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#F5F1E8] tracking-tight">Capital Ledger</h1>
            <p className="text-xs text-[#77736D] mt-0.5">Real-time inflows, expenditures, and verified transfers</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Entry</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="glass-card p-3.5 sm:p-4 specular-sheen min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-[#77736D] uppercase tracking-wider mb-1">Total Inflow</p>
            <p className="text-xl sm:text-2xl font-medium text-[#83C9A5] number-display truncate">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="glass-card p-3.5 sm:p-4 specular-sheen min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold text-[#77736D] uppercase tracking-wider mb-1">Total Outflow</p>
            <p className="text-xl sm:text-2xl font-medium text-[#D98282] number-display truncate">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736D]" />
            <input
              type="text"
              placeholder="Search by payee, category, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.14)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showFilters 
                ? 'bg-[#D6BC86]/15 text-[#D6BC86] border-[#D6BC86]/40' 
                : 'border-[rgba(214,188,134,0.14)] hover:bg-white/5 text-[#77736D]'
            }`}
            aria-label="Toggle filters"
          >
            <Filter size={17} />
          </button>
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="p-2.5 rounded-xl border border-[rgba(214,188,134,0.14)] hover:bg-white/5 text-[#77736D] hover:text-[#F5F1E8] transition-colors"
            aria-label="Sort direction"
          >
            <ArrowUpDown size={17} />
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
                      ? 'bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/35' 
                      : 'bg-[#121215] text-[#B6B0A5] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === 'income' 
                      ? 'bg-[#83C9A5]/15 text-[#83C9A5] border border-[#83C9A5]/35' 
                      : 'bg-[#121215] text-[#B6B0A5] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
                  }`}
                >
                  Inflow
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === 'expense' 
                      ? 'bg-[#D98282]/15 text-[#D98282] border border-[#D98282]/35' 
                      : 'bg-[#121215] text-[#B6B0A5] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
                  }`}
                >
                  Outflow
                </button>
              </div>
              <div className="-mx-4 px-4 overflow-x-auto scrollbar-none flex gap-1.5 pb-1">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    !categoryFilter 
                      ? 'bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/30' 
                      : 'bg-[#121215] text-[#77736D] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
                  }`}
                >
                  All Categories
                </button>
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setCategoryFilter(categoryFilter === cat.name ? '' : cat.name)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      categoryFilter === cat.name 
                        ? 'bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/30' 
                        : 'bg-[#121215] text-[#77736D] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
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
              onAction={() => setShowAdd(true)}
            />
          ) : (
            filtered.map((tx, i) => {
              const catInfo = allCategories.find(c => c.name === tx.category);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  className="glass-subtle p-3.5 flex items-center gap-3 group hover:border-[rgba(214,188,134,0.24)] transition-all"
                >
                  <CategoryIcon
                    name={catInfo?.icon || 'Circle'}
                    color={catInfo?.color || '#D6BC86'}
                    size={17}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F5F1E8] truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#77736D]">{tx.category}</span>
                      <span className="text-[10px] text-[#77736D]">•</span>
                      <span className="text-[10px] text-[#77736D]">{formatDate(tx.date)}</span>
                      {tx.paymentMethod && (
                        <>
                          <span className="text-[10px] text-[#77736D] hidden sm:inline">•</span>
                          <span className="text-[10px] text-[#77736D] hidden sm:inline">{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className={`text-sm font-medium number-display ${tx.type === 'income' ? 'text-[#83C9A5]' : 'text-[#F5F1E8]'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditTx(tx); }}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        aria-label="Edit transaction"
                      >
                        <Edit3 size={14} className="text-[#77736D] hover:text-[#F5F1E8]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTxId(tx.id); }}
                        className="p-1.5 rounded-lg hover:bg-[#D98282]/10 transition-colors"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={14} className="text-[#77736D] hover:text-[#D98282]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <AddTransactionSheet isOpen={showAdd} onClose={() => setShowAdd(false)} />
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
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

