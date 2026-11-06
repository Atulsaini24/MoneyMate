import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Download, SearchX, ArrowLeftRight, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from '@/types';
import { formatCurrency, dayKey, getMonthName, getMonthYear } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/transactions/AddTransactionSheet';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { Button, EmptyState, IconButton, Input, Money, Page, PageHeader, Segmented, Select, Stat } from '@/components/ui';

type TypeFilter = 'all' | 'expense' | 'income' | 'transfer';
type Sort = 'newest' | 'oldest' | 'largest' | 'smallest';

export const TransactionsPage: React.FC = () => {
  const { transactions, deleteTransaction } = useApp();
  const { openAddSheet } = useUI();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [type, setType] = useState<TypeFilter>('all');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [limit, setLimit] = useState(60);

  // Follow ?search= when the palette or an insight links here
  useEffect(() => { setSearch(params.get('search') || ''); }, [params]);
  useEffect(() => { setLimit(60); }, [search, type, category, month, sort]);

  const months = useMemo(() => [...new Set(transactions.map(t => getMonthYear(t.date)))].sort().reverse(), [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = transactions.filter(t =>
      (type === 'all' || t.type === type) &&
      (!category || t.category === category) &&
      (!month || getMonthYear(t.date) === month) &&
      (!q || `${t.description} ${t.category} ${t.notes || ''} ${t.paymentMethod || ''} ${t.amount}`.toLowerCase().includes(q)));
    const byDate = (a: Transaction, b: Transaction) => +new Date(b.date) - +new Date(a.date) || +new Date(b.createdAt) - +new Date(a.createdAt);
    return list.sort(sort === 'newest' ? byDate : sort === 'oldest' ? (a, b) => -byDate(a, b) : sort === 'largest' ? (a, b) => b.amount - a.amount : (a, b) => a.amount - b.amount);
  }, [transactions, search, type, category, month, sort]);

  const totalIn = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const filtering = Boolean(search || type !== 'all' || category || month);
  const clearAll = () => { setSearch(''); setType('all'); setCategory(''); setMonth(''); if (params.get('search')) setParams({}, { replace: true }); };

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment method', 'Notes'],
      ...filtered.map(t => [dayKey(new Date(t.date)), t.type, t.description, t.category, t.amount, t.paymentMethod || '', t.notes || ''])];
    const blob = new Blob(['\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `moneymate-transactions-${dayKey(new Date())}.csv` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const byDate = sort === 'newest' || sort === 'oldest';
  const todayK = dayKey(new Date()), yestK = dayKey(new Date(Date.now() - 86_400_000));
  const dayLabel = (k: string, d: Date) => k === todayK ? 'Today' : k === yestK ? 'Yesterday'
    : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  const dayNet = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of filtered) {
      const k = dayKey(new Date(t.date));
      m.set(k, (m.get(k) || 0) + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0));
    }
    return m;
  }, [filtered]);
  const visible = filtered.slice(0, limit);

  const groups: { key: string; date: Date; items: Transaction[] }[] = [];
  for (const t of visible) {
    const k = byDate ? dayKey(new Date(t.date)) : 'all';
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(t); else groups.push({ key: k, date: new Date(t.date), items: [t] });
  }

  return (
    <Page>
      <PageHeader title="Transactions" subtitle={`${transactions.length} recorded`}
        actions={<>
          <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!filtered.length} className="hidden sm:inline-flex">Export CSV</Button>
        </>} />

      {transactions.length === 0 ? (
        <div className="panel">
          <EmptyState icon={ArrowLeftRight} title="No transactions yet" description="Add your first expense or income, or import bank SMS and statements to fill this in quickly."
            action={<><Button icon={Plus} onClick={() => openAddSheet({ type: 'expense' })}>Add expense</Button><Button variant="secondary" onClick={() => openAddSheet({ type: 'income' })}>Add income</Button></>} />
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mm-muted pointer-events-none" />
              <Input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description, category, note or amount" aria-label="Search transactions" className="pl-10" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="Type" size="sm" value={type} onChange={v => { setType(v); setCategory(''); }}
                options={[{ value: 'all', label: 'All' }, { value: 'expense', label: 'Out' }, { value: 'income', label: 'In' }, { value: 'transfer', label: 'Transfers' }]} />
              <div className="flex-1 sm:hidden" />
              <IconButton label="Export CSV" icon={Download} onClick={exportCsv} disabled={!filtered.length} className="sm:hidden" />
              <div className="flex gap-2 w-[calc(100%+2rem)] overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:w-auto sm:flex-1">
                <Select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)} className="h-9 w-auto pr-9 sm:text-[13px] rounded-full sm:rounded-xl sm:w-48">
                  <option value="">All categories</option>
                  {(type !== 'income' && type !== 'transfer') && <optgroup label="Spending">{EXPENSE_CATEGORIES.map(c => <option key={`e-${c.name}`} value={c.name}>{c.name}</option>)}</optgroup>}
                  {(type === 'all' || type === 'income') && <optgroup label="Income">{INCOME_CATEGORIES.filter(c => c.name !== 'Others' || type === 'income').map(c => <option key={`i-${c.name}`} value={c.name}>{c.name}</option>)}</optgroup>}
                </Select>
                <Select aria-label="Month" value={month} onChange={e => setMonth(e.target.value)} className="h-9 w-auto pr-9 sm:text-[13px] rounded-full sm:rounded-xl sm:w-44">
                  <option value="">All time</option>
                  {months.map(m => <option key={m} value={m}>{getMonthName(m)}</option>)}
                </Select>
                <Select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value as Sort)} className="h-9 w-auto pr-9 sm:text-[13px] rounded-full sm:rounded-xl sm:w-32">
                  <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="largest">Largest</option><option value="smallest">Smallest</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="Money in" value={<Money value={totalIn} />} tone="positive" className="panel p-3.5 sm:p-4" />
            <Stat label="Money out" value={<Money value={totalOut} />} className="panel p-3.5 sm:p-4" />
            <Stat label="Net" value={<Money value={totalIn - totalOut} />} tone={totalIn - totalOut < 0 ? 'negative' : 'default'} className="panel p-3.5 sm:p-4" />
          </div>

          {filtered.length === 0 ? (
            <div className="panel">
              <EmptyState icon={SearchX} title="Nothing matches" description="Try a different search or clear the filters." action={<Button variant="secondary" icon={X} onClick={clearAll}>Clear filters</Button>} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="panel px-4 sm:px-5 py-1">
              {groups.map(g => (
                <section key={g.key} className="py-2 border-t border-mm-line/8 first:border-t-0">
                  {byDate && (
                    <div className="flex items-baseline justify-between pt-2 pb-1">
                      <h2 className="text-[13px] font-semibold text-mm-text2 font-sans tracking-normal">{dayLabel(g.key, g.date)}</h2>
                      <span className={`text-[13px] tabular ${(dayNet.get(g.key) || 0) >= 0 ? 'text-mm-positive' : 'text-mm-muted'}`}>
                        {(dayNet.get(g.key) || 0) >= 0 ? '+' : '−'}{formatCurrency(Math.abs(dayNet.get(g.key) || 0))}
                      </span>
                    </div>
                  )}
                  <div className="divide-hairline">
                    {g.items.map(t => <TransactionRow key={t.id} tx={t} showDate={!byDate} onClick={() => setEdit(t)} index={visible.indexOf(t)} />)}
                  </div>
                </section>
              ))}
              </div>
              {filtered.length > limit && (
                <Button variant="secondary" className="w-full" onClick={() => setLimit(l => l + 100)}>Show more ({filtered.length - limit} left)</Button>
              )}
              {filtering && <p className="text-center text-[13px] text-mm-muted">Showing {filtered.length} of {transactions.length}. <button className="font-semibold text-mm-accent" onClick={clearAll}>Clear filters</button></p>}
            </div>
          )}
        </>
      )}

      {edit && <AddTransactionSheet key={edit.id} isOpen onClose={() => setEdit(null)} editTransaction={edit} onDelete={id => { deleteTransaction(id); setEdit(null); }} />}
    </Page>
  );
};
