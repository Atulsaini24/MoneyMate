import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Calendar, CreditCard, FileText, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { PaymentSuccessOverlay } from '@/components/shared/PaymentSuccessOverlay';
import { formatCurrency } from '@/lib/utils';

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'expense' | 'income' | 'transfer';
  editTransaction?: any;
}

export const AddTransactionSheet: React.FC<AddTransactionSheetProps> = ({
  isOpen, onClose, defaultType = 'expense', editTransaction
}) => {
  const { addTransaction, updateTransaction, settings } = useApp();
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(editTransaction?.type || defaultType);
  const [amount, setAmount] = useState<string>(editTransaction?.amount?.toString() || '');
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [category, setCategory] = useState(editTransaction?.category || '');
  const [date, setDate] = useState(editTransaction?.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(editTransaction?.paymentMethod || 'UPI');
  const [notes, setNotes] = useState(editTransaction?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<{ amount: number; type: string; description: string } | null>(null);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const typeOptions = [
    { value: 'expense' as const, label: 'Outflow', color: 'text-[#D98282]', bg: 'bg-[#D98282]/15', border: 'border-[#D98282]/35' },
    { value: 'income' as const, label: 'Inflow', color: 'text-[#83C9A5]', bg: 'bg-[#83C9A5]/15', border: 'border-[#83C9A5]/35' },
    { value: 'transfer' as const, label: 'Transfer', color: 'text-[#D6BC86]', bg: 'bg-[#D6BC86]/15', border: 'border-[#D6BC86]/35' },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!description.trim()) newErrors.description = 'Description is required';
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
      date: new Date(date).toISOString(),
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
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setNotes('');
    setErrors({});
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
            <div className="bg-[#17171B] md:rounded-3xl rounded-t-3xl border border-[rgba(214,188,134,0.18)] max-h-[88vh] overflow-y-auto shadow-2xl pb-16 md:pb-6">
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 md:hidden">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(214,188,134,0.1)]">
                <button onClick={handleClose} className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-[#77736D] hover:text-[#F5F1E8]">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-base font-semibold text-[#F5F1E8] font-serif">
                  {editTransaction ? 'Edit Ledger Entry' : 'Record ' + typeOptions.find(t => t.value === type)?.label}
                </h2>
                <div className="w-8" />
              </div>

              {/* Type selector */}
              <div className="px-5 my-4">
                <div className="flex gap-2 p-1.5 rounded-2xl bg-[#121215] border border-[rgba(214,188,134,0.12)]">
                  {typeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setType(opt.value); setCategory(''); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                        type === opt.value
                          ? `${opt.bg} ${opt.color} border ${opt.border} shadow-sm`
                          : 'text-[#77736D] hover:text-[#F5F1E8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount display */}
              <div className="text-center px-5 mb-3">
                <div className="text-3xl md:text-5xl font-medium text-[#F5F1E8] number-display tracking-tight flex items-center justify-center gap-1">
                  <span>{settings.currencySymbol || '₹'}</span>
                  <span>{amount || '0'}</span>
                </div>
                <p className="text-xs text-[#77736D] mt-1 font-medium">
                  {errors.amount ? <span className="text-[#D98282] font-semibold">{errors.amount}</span> : 'Enter capital amount'}
                </p>
              </div>

              {/* Numpad - mobile only */}
              <div className="grid grid-cols-3 gap-1.5 px-5 mb-4 md:hidden">
                {['1','2','3','4','5','6','7','8','9','.','0','backspace'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleNumPadPress(val)}
                    className="h-11 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.12)] text-base font-medium text-[#F5F1E8] hover:bg-white/5 transition-colors active:scale-95 flex items-center justify-center number-display"
                  >
                    {val === 'backspace' ? '⌫' : val}
                  </button>
                ))}
              </div>

              {/* Desktop amount input */}
              <div className="hidden md:block px-5 mb-5">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(er => ({...er, amount: ''})); }}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-[#F5F1E8] placeholder:text-[#77736D] text-lg focus:outline-none focus:border-[#D6BC86]/50 number-display"
                />
              </div>

              {/* Category shortcuts */}
              <div className="px-5 mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2.5 pt-1 scrollbar-none -mx-1 px-1">
                  {categories.slice(0, 8).map(cat => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => { setCategory(cat.name); if (errors.category) setErrors(e => ({...e, category: ''})); }}
                      className={`flex flex-col items-center gap-1.5 min-w-[62px] py-2 px-1 rounded-xl transition-all flex-shrink-0 ${
                        category === cat.name
                          ? 'bg-[#D6BC86]/15 border border-[#D6BC86]/40 text-[#D6BC86] shadow-sm'
                          : 'bg-[#121215] border border-[rgba(214,188,134,0.1)] hover:border-[rgba(214,188,134,0.22)]'
                      }`}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                      <span className="text-[10px] text-[#B6B0A5] font-medium whitespace-nowrap">
                        {cat.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.category && <p className="text-xs text-[#D98282] font-semibold mt-1">{errors.category}</p>}
              </div>

              {/* Form fields */}
              <div className="px-5 space-y-3 mb-5">
                <div>
                  <input
                    type="text"
                    placeholder="Description / Counterparty"
                    value={description}
                    onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(er => ({...er, description: ''})); }}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50"
                  />
                  {errors.description && <p className="text-xs text-[#D98282] font-semibold mt-1">{errors.description}</p>}
                </div>

                <textarea
                  placeholder="Private memo / notes (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 resize-none"
                />

                {/* Date & Payment Method Custom Luxury Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Date Input Field */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B6B0A5] flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#D6BC86]" />
                      <span>Transaction Date</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.18)] text-sm font-medium text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/60 transition-colors [color-scheme:dark] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B6B0A5] flex items-center gap-1.5">
                      <CreditCard size={13} className="text-[#D6BC86]" />
                      <span>Payment Channel</span>
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.18)] text-sm font-medium text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/60 transition-colors [color-scheme:dark] cursor-pointer"
                      >
                        {PAYMENT_METHODS.map(m => (
                          <option key={m} value={m} className="bg-[#17171B] text-[#F5F1E8]">
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#D6BC86]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div className="px-5 pb-8 pt-2 sticky bottom-0 bg-[#17171B] border-t border-[rgba(214,188,134,0.1)] z-20">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-3.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  {editTransaction ? 'Confirm Update' : `Authorize ${typeOptions.find(t => t.value === type)?.label}`}
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

