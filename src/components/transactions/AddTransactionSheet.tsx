import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Banknote, QrCode, CreditCard, Landmark, Wallet, CircleEllipsis, type LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, type Transaction } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { suggestCategory } from '@/lib/autoCategory';
import { Dialog } from '@/components/ui/Dialog';
import { Button, Field, IconButton, Input, Segmented, Textarea } from '@/components/ui';
import { BrandTile } from '@/components/shared/MerchantLogo';
import { brandFor, QUICK_MERCHANTS } from '@/lib/merchants';
import { cn, formatCurrency } from '@/lib/utils';

const METHOD_ICON: Record<string, LucideIcon> = { Cash: Banknote, UPI: QrCode, 'Credit Card': CreditCard, 'Debit Card': CreditCard, 'Net Banking': Landmark, Wallet, Other: CircleEllipsis };

type TxType = Transaction['type'];

// toISOString() is UTC: before 5:30am in India it returned *yesterday*.
const localKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TRANSFER = 'Transfer';
const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;

export interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TxType;
  editTransaction?: Transaction | null;
  onDelete?: (id: string) => void;
  /** Values to start a new entry with (e.g. from a scanned receipt). */
  prefill?: Partial<{ type: TxType; amount: number; description: string; category: string; date: string; paymentMethod: string; notes: string }>;
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({ isOpen, onClose, defaultType = 'expense', editTransaction, onDelete, prefill }) => {
  const init: Partial<Transaction> = editTransaction || prefill || {};
  const { addTransaction, updateTransaction, transactions } = useApp();
  // True once the user picks a category, so suggestions never override them
  const [categoryTouched, setCategoryTouched] = useState(Boolean(editTransaction || prefill?.category));
  const [type, setType] = useState<TxType>(init.type || defaultType);
  const [amount, setAmount] = useState(init.amount ? String(init.amount) : '');
  const [description, setDescription] = useState(init.description || '');
  const [category, setCategory] = useState(init.category || ((init.type || defaultType) === 'transfer' ? TRANSFER : ''));
  const [date, setDate] = useState(init.date ? (/^\d{4}-\d{2}-\d{2}$/.test(init.date) ? init.date : localKey(new Date(init.date))) : localKey(new Date()));
  const [paymentMethod, setPaymentMethod] = useState(init.paymentMethod || 'UPI');
  const [notes, setNotes] = useState(init.notes || '');
  const [showNotes, setShowNotes] = useState(Boolean(init.notes));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Your most-used names first, topped up with popular merchants
  const suggestions = useMemo(() => {
    if (type === 'transfer') return [];
    const count = new Map<string, { description: string; category: string; n: number }>();
    for (const t of transactions) {
      if (t.type !== type) continue;
      const k = t.description.trim().toLowerCase();
      const c = count.get(k);
      if (c) c.n++; else count.set(k, { description: t.description.trim(), category: t.category, n: 1 });
    }
    const mine = [...count.values()].sort((a, b) => b.n - a.n).slice(0, 8);
    const extra = type === 'expense' ? QUICK_MERCHANTS.filter(q => !count.has(q.description.toLowerCase())) : [];
    return [...mine, ...extra].slice(0, 10);
  }, [transactions, type]);
  const brand = brandFor(description);
  const pickSuggestion = (q: { description: string; category: string }) => {
    setDescription(q.description);
    if (!categoryTouched && categories.some(c => c.name === q.category)) setCategory(q.category);
    setErrors(x => ({ ...x, description: '', category: '' }));
  };
  const label = type === 'income' ? 'income' : type === 'transfer' ? 'transfer' : 'expense';

  const changeType = (t: TxType) => {
    setType(t);
    setCategory(t === 'transfer' ? TRANSFER : '');
    setCategoryTouched(false);
    if (t !== 'transfer' && description) {
      const guess = suggestCategory(description, t, transactions);
      if (guess && (t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).some(c => c.name === guess)) setCategory(guess);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const n = parseFloat(amount);
    if (!amount || !Number.isFinite(n) || n <= 0) e.amount = 'Enter an amount above zero';
    if (!description.trim()) e.description = 'Add a short description, like “Groceries”';
    if (!category) e.category = 'Choose a category';
    if (!date) e.date = 'Choose a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;
    const data = {
      type, amount: Math.round(parseFloat(amount) * 100) / 100, description: description.trim(), category,
      date: new Date(`${date}T12:00:00`).toISOString(), paymentMethod, notes: notes.trim(),
    };
    if (editTransaction) updateTransaction(editTransaction.id, data);
    else addTransaction(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="lg"
      title={editTransaction ? 'Edit transaction' : prefill ? 'Check the scanned receipt' : `New ${label}`}
      footer={
        <div className="flex items-center gap-2">
          {editTransaction && onDelete && <IconButton label="Delete transaction" icon={Trash2} tone="danger" onClick={() => onDelete(editTransaction.id)} />}
          <Button size="lg" className="flex-1" onClick={() => submit()}>{editTransaction ? 'Save changes' : parseFloat(amount) > 0 ? `Save ${formatCurrency(parseFloat(amount))}` : `Save ${label}`}</Button>
        </div>
      }>
      <form onSubmit={submit} className="space-y-5 pt-1" noValidate>
        <Segmented label="Type" value={type} onChange={changeType} className="w-full"
          options={[{ value: 'expense', label: 'Expense', tone: 'negative' }, { value: 'income', label: 'Income', tone: 'positive' }, { value: 'transfer', label: 'Transfer' }]} />

        <AmountHero value={amount} error={errors.amount} type={type} autoFocus={isDesktop()}
          onChange={v => { setAmount(v); if (errors.amount) setErrors(x => ({ ...x, amount: '' })); }} />

        <Field label={type === 'transfer' ? 'What’s it for' : type === 'income' ? 'From' : 'Spent on'} error={errors.description} htmlFor="tx-desc">
          <div className="relative">
          <AnimatePresence>
            {brand && (
              <motion.span className="absolute left-2 top-1/2 -translate-y-1/2 z-10" initial={{ scale: 0.4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}><BrandTile brand={brand} px={28} className="rounded-lg" /></motion.span>
            )}
          </AnimatePresence>
          <Input id="tx-desc" value={description} autoComplete="off" enterKeyHint="done" className={cn('transition-[padding]', brand && 'pl-11')}
            placeholder={type === 'income' ? 'e.g. Salary, client payment' : type === 'transfer' ? 'e.g. Savings account, credit card bill' : 'e.g. Groceries, Uber, rent'}
            onChange={e => {
              const v = e.target.value;
              setDescription(v);
              if (errors.description) setErrors(x => ({ ...x, description: '' }));
              if (!categoryTouched && type !== 'transfer') {
                const guess = suggestCategory(v, type, transactions);
                if (guess && categories.some(c => c.name === guess)) { setCategory(guess); setErrors(x => ({ ...x, category: '' })); }
              }
            }} />
          </div>
          {suggestions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 sm:-mx-6 sm:px-6 pt-2.5 pb-0.5 snap-x scroll-px-5 sm:scroll-px-6" role="list" aria-label="Quick picks">
              {suggestions.map((q, i) => {
                const b = brandFor(q.description);
                const on = description.trim().toLowerCase() === q.description.toLowerCase();
                return (
                  <motion.button key={q.description} type="button" role="listitem" onClick={() => pickSuggestion(q)}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i, type: 'spring', stiffness: 400, damping: 30 }}
                    whileTap={{ scale: 0.94 }}
                    className={cn('snap-start shrink-0 inline-flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border text-[13px] font-medium transition-colors',
                      on ? 'border-mm-accent bg-mm-accent/[0.08] text-mm-text' : 'border-mm-line/12 bg-mm-card text-mm-text2')}>
                    {b ? <BrandTile brand={b} px={28} className="rounded-full" /> : <span className="w-7 h-7 rounded-full bg-mm-bg2 flex items-center justify-center text-xs font-bold text-mm-text2">{q.description[0]?.toUpperCase()}</span>}
                    {q.description}
                  </motion.button>
                );
              })}
            </div>
          )}
        </Field>

        {type !== 'transfer' && (
          <div>
            <p className="text-[13px] font-medium text-mm-text2 mb-2">Category</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Category">
              {categories.map(cat => {
                const on = category === cat.name;
                return (
                  <button key={cat.name} type="button" role="radio" aria-checked={on}
                    onClick={() => { setCategory(cat.name); setCategoryTouched(true); setErrors(x => ({ ...x, category: '' })); }}
                    className={cn('flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl border transition-colors',
                      on ? 'border-mm-accent bg-mm-accent/[0.07]' : 'border-mm-line/10 hover:border-mm-line/25')}>
                    <CategoryIcon name={cat.icon} color={cat.color} size="sm" />
                    <span className={cn('text-xs leading-tight text-center', on ? 'font-semibold text-mm-text' : 'text-mm-text2')}>{cat.name.replace(' & ', ' & ')}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="text-xs text-mm-negative mt-1.5" role="alert">{errors.category}</p>}
          </div>
        )}

        <div>
          <p className="text-[13px] font-medium text-mm-text2 mb-2">{type === 'income' ? 'Received via' : 'Paid with'}</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap" role="radiogroup" aria-label={type === 'income' ? 'Received via' : 'Paid with'}>
            {PAYMENT_METHODS.map(m => {
              const Icon = METHOD_ICON[m] || CircleEllipsis;
              const on = paymentMethod === m;
              return (
                <button key={m} type="button" role="radio" aria-checked={on} onClick={() => setPaymentMethod(m)}
                  className={cn('relative shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-[13px] font-semibold border transition-colors',
                    on ? 'border-transparent text-mm-on-accent' : 'border-mm-line/12 text-mm-text2 bg-mm-card')}>
                  {on && <motion.span layoutId="pm-on" className="absolute inset-0 rounded-xl bg-mm-accent" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                  <Icon size={16} className="relative" /><span className="relative">{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Date" error={errors.date} htmlFor="tx-date">
          <Input id="tx-date" type="date" value={date} max={localKey(new Date(Date.now() + 366 * 86_400_000))} onChange={e => setDate(e.target.value)} />
        </Field>

        {showNotes ? (
          <Field label="Note" htmlFor="tx-notes">
            <Textarea id="tx-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you want to remember" />
          </Field>
        ) : (
          <button type="button" onClick={() => setShowNotes(true)} className="text-[13px] font-semibold text-mm-accent hover:underline underline-offset-4">+ Add a note</button>
        )}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Dialog>
  );
};

/** The amount as the hero of the sheet: big, centred, and shrinking as it grows. */
const AmountHero: React.FC<{ value: string; onChange: (v: string) => void; error?: string; type: TxType; autoFocus?: boolean }> = ({ value, onChange, error, type, autoFocus }) => {
  const { settings } = useApp();
  const symbol = settings.currencySymbol || '₹';
  const len = Math.max(1, value.length);
  const size = len <= 4 ? 3.25 : len <= 6 ? 2.75 : len <= 8 ? 2.25 : 1.85;
  const tone = type === 'income' ? 'text-mm-positive' : type === 'transfer' ? 'text-mm-accent' : 'text-mm-text';
  return (
    <div className="pt-2 pb-1">
      <label htmlFor="tx-amount" className="block text-center text-[13px] font-medium text-mm-muted mb-1">Amount</label>
      <div className={cn('flex items-baseline justify-center gap-1 font-display font-semibold', tone)} style={{ fontSize: `${size}rem`, transition: 'font-size .2s cubic-bezier(.16,1,.3,1)' }}>
        <span className="opacity-50 text-[0.7em]">{symbol}</span>
        <input id="tx-amount" type="number" inputMode="decimal" step="any" min={0} placeholder="0" value={value} autoFocus={autoFocus} data-autofocus={autoFocus ? '' : undefined}
          onChange={e => onChange(e.target.value.replace(/^0+(?=\d)/, '').slice(0, 11))}
          aria-invalid={Boolean(error)} aria-describedby={error ? 'tx-amount-err' : undefined}
          className="tabular bg-transparent border-none outline-none text-center p-0 m-0 leading-none placeholder:text-mm-text/20 focus:ring-0"
          style={{ width: `${Math.max(1.2, len * 0.62 + 0.3)}em`, fontSize: '1em' }} />
      </div>
      <motion.div className="mx-auto mt-2 h-[2px] rounded-full bg-mm-accent" initial={false} animate={{ width: value ? 96 : 40, opacity: value ? 1 : 0.35 }} />
      {error && <p id="tx-amount-err" className="text-xs text-mm-negative mt-2 text-center" role="alert">{error}</p>}
    </div>
  );
};
