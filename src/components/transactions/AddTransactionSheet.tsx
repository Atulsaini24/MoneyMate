import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Calendar, CreditCard, FileText, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { PaymentSuccessOverlay } from '@/components/shared/PaymentSuccessOverlay';
import { formatCurrency } from '@/lib/utils';
import { suggestCategory } from '@/lib/autoCategory';

// toISOString() is UTC: before 5:30am in India it returned *yesterday*.
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'transfer';
  editTransaction?: any;
  /** Values to start a new entry with (e.g. from a scanned receipt). */
  prefill?: Partial<{ type: 'expense' | 'income' | 'transfer'; amount: number; description: string; category: string; date: string; paymentMethod: string; notes: string }>;
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  isOpen, onClose, defaultType = 'expense', editTransaction, prefill
}) => {
  const init = editTransaction || prefill || {};
  const { addTransaction, updateTransaction, settings, transactions } = useApp();
  // True once the user picks a category themselves, so suggestions never override them
  const [categoryTouched, setCategoryTouched] = useState(Boolean(editTransaction || prefill?.category));
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(init.type || defaultType);
  const [amount, setAmount] = useState<string>(init.amount?.toString() || '');
  const [description, setDescription] = useState(init.description || '');
  const [category, setCategory] = useState(init.category || '');
  const [date, setDate] = useState(init.date ? (/^\d{4}-\d{2}-\d{2}$/.test(init.date) ? init.date : localKey(new Date(init.date))) : todayLocal());
  const [paymentMethod, setPaymentMethod] = useState(init.paymentMethod || 'UPI');
  const [notes, setNotes] = useState(init.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{ amount: number; type: string; description: string } | null>(null);

  // The sheet stays mounted between openings, so re-sync the type each time it
  // opens. Without this, "Add income" from Quick Actions opened as an expense.
  useEffect(() => {
    if (isOpen && !editTransaction && !prefill) setType(defaultType);
  }, [isOpen, defaultType, editTransaction, prefill]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const typeOptions = [
    { value: 'expense' as const, label: 'Expense', color: 'text-mm-negative', bg: 'bg-mm-negative/15', border: 'border-mm-negative/35' },
    { value: 'income' as const, label: 'Income', color: 'text-mm-positive', bg: 'bg-mm-positive/15', border: 'border-mm-positive/35' },
    { value: 'transfer' as const, label: 'Transfer', color: 'text-mm-gold', bg: 'bg-mm-gold/15', border: 'border-mm-gold/35' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!description.trim()) newErrors.description = 'Add a short description';
    if (!category) newErrors.category = 'Select a category';
    if (!date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    const parsedAmount = parseFloat(amount);
    const trimmedDesc = description.trim();
    const curType = type;

    const data = {
      type: curType,
      amount: parsedAmount,
      description: trimmedDesc,
      category,
      date: new Date(`${date}T12:00:00`).toISOString(),
      paymentMethod,
      notes: notes.trim(),
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, data);
    } else {
      addTransaction(data);
    }
    
    // Store submitted transaction details for the success overlay
    setLastSubmitted({
      amount: parsedAmount,
      type: curType,
      description: trimmedDesc,
    });

    // Display the full-screen green payment successful animation
    setShowSuccessOverlay(true);
  };

  const handleAnimationComplete = () => {
    setShowSuccessOverlay(false);
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(todayLocal());
    setPaymentMethod('UPI');
    setNotes('');
    setErrors({});
    setCategoryTouched(false);
    setType(defaultType);
    onClose();
  };

  const handleNumPadPress = (val: string) => {
    if (val === 'backspace') {
      setAmount((prev: string) => prev.slice(0, -1));
    } else if (val === '.' && amount.includes('.')) {
      return;
    } else {
      setAmount((prev: string) => prev + val);
    }
    if (errors.amount) setErrors(e => ({ ...e, amount: '' }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overlay-bg absolute inset-0"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative z-10 w-full max-w-lg md:mx-4"
          >
            <div className="bg-mm-card md:rounded-3xl rounded-t-3xl border border-mm-line/18 max-h-[88vh] overflow-y-auto shadow-2xl pb-16 md:pb-6">
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 md:hidden">
                <div className="w-10 h-1 rounded-full bg-mm-text/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-mm-line/10">
                <button onClick={handleClose} className="p-1.5 hover:bg-mm-text/5 rounded-xl transition-colors text-mm-muted hover:text-mm-text">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-base font-semibold text-mm-text font-serif">
                  {editTransaction ? 'Edit transaction' : prefill ? 'Check scanned receipt' : 'New ' + typeOptions.find(t => t.value === type)?.label.toLowerCase()}
                </h2>
                <div className="w-8" />
              </div>

              {/* Type selector */}
              <div className="px-5 my-4">
                <div className="flex gap-2 p-1.5 rounded-2xl bg-mm-bg2 border border-mm-line/12">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setType(opt.value); setCategory(''); setCategoryTouched(false); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        type === opt.value
                          ? `${opt.bg} ${opt.color} border ${opt.border} shadow-sm`
                          : 'text-mm-muted hover:text-mm-text'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount display */}
              <div className="text-center px-5 mb-3">
                <div className="text-3xl md:text-5xl font-medium text-mm-text number-display tracking-tight flex items-center justify-center gap-1">
                  <span>{settings.currencySymbol || '₹'}</span>
                  <span>{amount || '0'}</span>
                </div>
                <p className="text-xs text-mm-muted mt-1 font-medium">
                  {errors.amount ? <span className="text-mm-negative font-semibold">{errors.amount}</span> : 'Amount'}
                </p>
              </div>

              {/* Numpad - mobile only */}
              <div className="grid grid-cols-3 gap-1.5 px-5 mb-4 md:hidden">
                {['1','2','3','4','5','6','7','8','9','.','0','backspace'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleNumPadPress(val)}
                    aria-label={val === 'backspace' ? 'Delete last digit' : val === '.' ? 'Decimal point' : val}
                    className="h-11 rounded-xl bg-mm-bg2 border border-mm-line/12 text-base font-medium text-mm-text hover:bg-mm-text/5 transition-colors active:scale-95 flex items-center justify-center number-display"
                  >
                    {val === 'backspace' ? '⌫' : val}
                  </button>
                ))}
              </div>

              {/* Desktop amount input */}
              <div className="hidden md:block px-5 mb-5">
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus={typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  aria-label="Amount"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(er => ({...er, amount: ''})); }}
                  className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-mm-text placeholder:text-mm-muted text-lg focus:outline-none focus:border-mm-gold/50 number-display"
                />
              </div>

              {/* Category shortcuts */}
              <div className="px-5 mb-4">
                <div className="flex md:flex-wrap gap-2 overflow-x-auto pb-2.5 pt-1 scrollbar-none -mx-1 px-1">
                  {categories.map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      aria-label={cat.name}
                      aria-pressed={category === cat.name}
                      onClick={() => { setCategory(cat.name); setCategoryTouched(true); if (errors.category) setErrors(e => ({...e, category: ''})); }}
                      className={`flex flex-col items-center gap-1.5 min-w-[62px] py-2 px-1 rounded-xl transition-all flex-shrink-0 ${
                        category === cat.name
                          ? 'bg-mm-gold/15 border border-mm-gold/40 text-mm-gold shadow-sm'
                          : 'bg-mm-bg2 border border-mm-line/10 hover:border-mm-line/22'
                      }`}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                      <span className="text-[10px] text-mm-text2 font-medium whitespace-nowrap">
                        {cat.name.split(' ')[0].replace(/&$/, '')}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-mm-negative font-semibold mt-1">{errors.category}</p>}
              </div>

              {/* Form fields */}
              <div className="px-5 space-y-3 mb-5">
                <div>
                  <input
                    type="text"
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                    aria-label="Description"
                    placeholder="What was it for? e.g. Groceries, Uber"
                    value={description}
                    onChange={e => {
                      const v = e.target.value;
                      setDescription(v);
                      if (errors.description) setErrors(er => ({...er, description: ''}));
                      if (!categoryTouched) {
                        const guess = suggestCategory(v, type, transactions);
                        if (guess && categories.some(c => c.name === guess)) {
                          setCategory(guess);
                          if (errors.category) setErrors(er => ({ ...er, category: '' }));
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50"
                  />
                  {errors.description && <p className="text-xs text-mm-negative font-semibold mt-1">{errors.description}</p>}
                </div>

                <textarea
                  aria-label="Notes" placeholder="Notes (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50 resize-none"
                />

                {/* Date & Payment Method Custom Luxury Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Date Input Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-mm-text2 flex items-center gap-1.5">
                      <Calendar size={13} className="text-mm-gold" />
                      <span>Date</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/18 text-sm font-medium text-mm-text focus:outline-none focus:border-mm-gold/60 transition-colors [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-mm-text2 flex items-center gap-1.5">
                      <CreditCard size={13} className="text-mm-gold" />
                      <span>Paid with</span>
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/18 text-sm font-medium text-mm-text focus:outline-none focus:border-mm-gold/60 transition-colors [color-scheme:dark] cursor-pointer"
                      >
                        {PAYMENT_METHODS.map(m => (
                          <option key={m} value={m} className="bg-mm-card text-mm-text">
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-mm-gold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="px-5 pb-8 pt-2 sticky bottom-0 bg-mm-card border-t border-mm-line/10 z-20">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-3.5 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-semibold text-sm transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  {editTransaction ? 'Save changes' : `Save ${typeOptions.find(t => t.value === type)?.label.toLowerCase()}`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full-screen Green Payment Success Animation */}
      <PaymentSuccessOverlay
        isOpen={showSuccessOverlay}
        amount={lastSubmitted?.amount || 0}
        type={lastSubmitted?.type || type}
        description={lastSubmitted?.description || ''}
        currencySymbol={settings?.currencySymbol || '₹'}
        onComplete={handleAnimationComplete}
      />
    </AnimatePresence>
  );
};

