import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Calendar, Clock, DollarSign, Edit3, Trash2, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { FriendRecord } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';

export const FriendsPage: React.FC = () => {
  const { friends, addFriend, updateFriend, deleteFriend, addPayment, settleFriend } = useApp();
  const [filter, setFilter] = useState<'all' | 'owed-to-me' | 'i-owe' | 'settled'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRecord, setEditRecord] = useState<FriendRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<FriendRecord | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'owed-to-me' | 'i-owe'>('owed-to-me');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormType('owed-to-me');
    setFormAmount('');
    setFormDesc('');
    setFormDueDate('');
    setEditRecord(null);
  };

  const handleOpenEdit = (f: FriendRecord) => {
    setEditRecord(f);
    setFormName(f.name);
    setFormType(f.type);
    setFormAmount(f.amount.toString());
    setFormDesc(f.description || '');
    setFormDueDate(f.dueDate || '');
    setShowAddModal(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmount);
    if (!formName.trim() || isNaN(amountVal) || amountVal <= 0) return;

    if (editRecord) {
      updateFriend(editRecord.id, {
        name: formName.trim(),
        type: formType,
        amount: amountVal,
        description: formDesc.trim() || undefined,
        dueDate: formDueDate || undefined,
      });
    } else {
      addFriend({
        name: formName.trim(),
        type: formType,
        amount: amountVal,
        date: new Date().toISOString().split('T')[0],
        description: formDesc.trim() || undefined,
        dueDate: formDueDate || undefined,
        status: 'outstanding',
      });
    }

    resetForm();
    setShowAddModal(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRecord) return;
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    addPayment(paymentRecord.id, {
      amount: amountVal,
      date: new Date().toISOString().split('T')[0],
      notes: payNotes.trim() || 'Repayment',
    });

    setPaymentRecord(null);
    setPayAmount('');
    setPayNotes('');
  };

  // Calculations
  const totalOwedToMe = friends
    .filter(f => f.type === 'owed-to-me' && f.status !== 'settled')
    .reduce((sum, f) => {
      const paid = f.payments.reduce((pSum, p) => pSum + p.amount, 0);
      return sum + Math.max(0, f.amount - paid);
    }, 0);

  const totalIOwe = friends
    .filter(f => f.type === 'i-owe' && f.status !== 'settled')
    .reduce((sum, f) => {
      const paid = f.payments.reduce((pSum, p) => pSum + p.amount, 0);
      return sum + Math.max(0, f.amount - paid);
    }, 0);

  const netBalance = totalOwedToMe - totalIOwe;

  // Filtered records
  const filteredFriends = friends.filter(f => {
    if (filter === 'settled') return f.status === 'settled';
    if (filter === 'owed-to-me') return f.type === 'owed-to-me' && f.status !== 'settled';
    if (filter === 'i-owe') return f.type === 'i-owe' && f.status !== 'settled';
    return true;
  });

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-8 px-4 md:px-6 pt-5 md:pt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/30">
              <Users size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[#F5F1E8] tracking-tight">Capital Lending & IOU Ledger</h1>
          </div>
          <p className="text-xs text-[#77736D] mt-1">Monitor money lent to associates, shared expenses, and debt settlements</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex-shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span className="hidden sm:inline">Add Record</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 sm:p-5 relative overflow-hidden specular-sheen min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736D]">Receivable (Lent Out)</span>
            <div className="p-2 rounded-xl bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/25">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-medium text-[#D6BC86] mt-2 number-display truncate">
            {formatCurrency(totalOwedToMe)}
          </p>
          <p className="text-xs text-[#77736D] mt-1">
            {friends.filter(f => f.type === 'owed-to-me' && f.status !== 'settled').length} active associates
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="glass-card p-4 sm:p-5 relative overflow-hidden specular-sheen min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736D]">Payable (You Borrowed)</span>
            <div className="p-2 rounded-xl bg-[#D98282]/15 text-[#D98282] border border-[#D98282]/25">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-medium text-[#D98282] mt-2 number-display truncate">
            {formatCurrency(totalIOwe)}
          </p>
          <p className="text-xs text-[#77736D] mt-1">
            {friends.filter(f => f.type === 'i-owe' && f.status !== 'settled').length} liabilities pending
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card p-4 sm:p-5 relative overflow-hidden specular-sheen min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#77736D]">Net Credit Position</span>
            <div className={`p-2 rounded-xl border ${netBalance >= 0 ? 'bg-[#83C9A5]/15 text-[#83C9A5] border-[#83C9A5]/25' : 'bg-[#D98282]/15 text-[#D98282] border-[#D98282]/25'}`}>
              <DollarSign size={16} />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-medium mt-2 number-display truncate ${netBalance >= 0 ? 'text-[#83C9A5]' : 'text-[#D98282]'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </p>
          <p className="text-xs text-[#77736D] mt-1">
            {netBalance >= 0 ? 'Net capital surplus with associates' : 'Net liabilities exceed receivables'}
          </p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="-mx-4 px-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: 'All Records', count: friends.length },
          { key: 'owed-to-me', label: 'Owed to Me', count: friends.filter(f => f.type === 'owed-to-me' && f.status !== 'settled').length },
          { key: 'i-owe', label: 'I Owe', count: friends.filter(f => f.type === 'i-owe' && f.status !== 'settled').length },
          { key: 'settled', label: 'Settled', count: friends.filter(f => f.status === 'settled').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 flex-shrink-0 ${
              filter === tab.key
                ? 'bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/35 shadow-sm'
                : 'bg-[#121215] text-[#77736D] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filter === tab.key ? 'bg-[#D6BC86]/30 text-[#E9D8AF]' : 'bg-white/5 text-[#77736D]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {filteredFriends.length === 0 ? (
          <EmptyState
            image="/assets/moneymate/empty/empty-friends-icon.jpg"
            title={filter === 'settled' ? 'No settled debts' : 'No records found'}
            description={
              filter === 'settled'
                ? 'No debts have been marked as settled yet.'
                : 'Track loans with friends, shared bills, or personal IOUs easily.'
            }
            actionText="Add Friend Record"
            onAction={() => { resetForm(); setShowAddModal(true); }}
          />
        ) : (
          filteredFriends.map(friend => {
            const totalPaid = friend.payments.reduce((s, p) => s + p.amount, 0);
            const remaining = Math.max(0, friend.amount - totalPaid);
            const progress = Math.min(100, Math.round((totalPaid / friend.amount) * 100));
            const overdue = friend.status !== 'settled' && isOverdue(friend.dueDate);
            const isExpanded = expandedId === friend.id;

            return (
              <motion.div
                key={friend.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 transition-all hover:border-[rgba(214,188,134,0.24)]"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Avatar + Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#19191D] border border-[rgba(214,188,134,0.2)] flex items-center justify-center text-sm font-semibold text-[#D6BC86] flex-shrink-0">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-[#F5F1E8] truncate">{friend.name}</h3>
                        {/* Type badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          friend.type === 'owed-to-me'
                            ? 'bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/25'
                            : 'bg-[#D98282]/15 text-[#D98282] border border-[#D98282]/25'
                        }`}>
                          {friend.type === 'owed-to-me' ? 'Lent (Owed to you)' : 'Borrowed (You owe)'}
                        </span>

                        {/* Status badge */}
                        {friend.status === 'settled' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#83C9A5]/15 text-[#83C9A5] border border-[#83C9A5]/25 font-medium flex items-center gap-1">
                            <CheckCircle2 size={10} /> Settled
                          </span>
                        ) : overdue ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9B46F]/15 text-[#D9B46F] border border-[#D9B46F]/25 font-medium flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        ) : null}
                      </div>

                      {friend.description && (
                        <p className="text-xs text-[#77736D] mt-0.5 truncate">{friend.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-[#77736D]">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(friend.date)}
                        </span>
                        {friend.dueDate && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-[#D9B46F] font-medium' : ''}`}>
                            <Clock size={12} /> Due: {formatDate(friend.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts & Quick Actions */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-medium text-[#F5F1E8] number-display">
                      {formatCurrency(friend.amount)}
                    </p>
                    {friend.status !== 'settled' && totalPaid > 0 && (
                      <p className="text-[11px] text-[#D6BC86] number-display">
                        {formatCurrency(remaining)} remaining
                      </p>
                    )}
                    {friend.status === 'settled' && (
                      <p className="text-[11px] text-[#83C9A5]">Fully settled</p>
                    )}
                  </div>
                </div>

                {/* Progress bar if partially paid */}
                {friend.status !== 'settled' && (
                  <div className="mt-3 pt-3 border-t border-[rgba(214,188,134,0.1)]">
                    <div className="flex items-center justify-between text-[11px] text-[#77736D] mb-1.5">
                      <span>Paid: {formatCurrency(totalPaid)}</span>
                      <span className="number-display">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#121215] rounded-full overflow-hidden border border-[rgba(214,188,134,0.1)]">
                      <div
                        className="h-full bg-[#D6BC86] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-[rgba(214,188,134,0.06)]">
                  {/* Payments toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : friend.id)}
                    className="text-xs text-[#77736D] hover:text-[#F5F1E8] flex items-center gap-1 transition-colors"
                  >
                    {friend.payments.length > 0 ? (
                      <>
                        <span>{friend.payments.length} payment{friend.payments.length > 1 ? 's' : ''}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </>
                    ) : (
                      <span className="text-[11px] text-[#77736D]">No payments recorded</span>
                    )}
                  </button>

                  {/* Buttons */}
                  <div className="flex items-center gap-1.5">
                    {friend.status !== 'settled' && (
                      <>
                        <button
                          onClick={() => {
                            setPaymentRecord(friend);
                            setPayAmount(remaining.toString());
                          }}
                          className="px-3 py-1 rounded-xl bg-[#D6BC86]/15 border border-[#D6BC86]/30 text-[#D6BC86] hover:bg-[#D6BC86]/25 text-xs font-semibold transition-all shadow-sm"
                        >
                          Record Payment
                        </button>
                        <button
                          onClick={() => settleFriend(friend.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-[#77736D] hover:text-[#83C9A5] transition-colors"
                          title="Mark settled"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleOpenEdit(friend)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[#77736D] hover:text-[#F5F1E8] transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(friend.id)}
                      className="p-1.5 rounded-lg hover:bg-[#D98282]/10 text-[#77736D] hover:text-[#D98282] transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded Payment History */}
                <AnimatePresence>
                  {isExpanded && friend.payments.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 pt-3 border-t border-[rgba(214,188,134,0.12)]"
                    >
                      <p className="text-xs font-semibold text-[#B6B0A5] mb-2">Payment History</p>
                      <div className="space-y-1.5">
                        {friend.payments.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#121215] border border-[rgba(214,188,134,0.08)]"
                          >
                            <div>
                              <p className="font-medium text-[#F5F1E8] number-display">{formatCurrency(p.amount)}</p>
                              {p.notes && <p className="text-[10px] text-[#77736D]">{p.notes}</p>}
                            </div>
                            <span className="text-[10px] text-[#77736D]">{formatDate(p.date)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add / Edit Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title={editRecord ? 'Edit Friend Record' : 'Add Friend / IOU'}
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Person Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Alex Johnson"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Record Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType('owed-to-me')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                  formType === 'owed-to-me'
                    ? 'bg-[#D6BC86]/15 border-[#D6BC86]/40 text-[#D6BC86]'
                    : 'border-[rgba(214,188,134,0.1)] text-[#77736D] hover:text-[#F5F1E8]'
                }`}
              >
                I Lent (They owe me)
              </button>
              <button
                type="button"
                onClick={() => setFormType('i-owe')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                  formType === 'i-owe'
                    ? 'bg-[#D98282]/15 border-[#D98282]/40 text-[#D98282]'
                    : 'border-[rgba(214,188,134,0.1)] text-[#77736D] hover:text-[#F5F1E8]'
                }`}
              >
                I Borrowed (I owe them)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Total Capital Amount (₹)</label>
            <input
              type="number"
              step="any"
              required
              min="0.01"
              placeholder="0.00"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 number-display"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Description / Purpose</label>
            <input
              type="text"
              placeholder="e.g. Dinner split, Concert tickets, Bridge capital"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Due Date (Optional)</label>
            <input
              type="date"
              value={formDueDate}
              onChange={e => setFormDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 [color-scheme:dark]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#77736D] hover:text-[#F5F1E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              {editRecord ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentRecord}
        onClose={() => setPaymentRecord(null)}
        title={`Record Payment — ${paymentRecord?.name}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Payment Amount (₹)</label>
            <input
              type="number"
              step="any"
              required
              min="0.01"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 number-display"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#B6B0A5] mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Bank Transfer, UPI, Cash settlement"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentRecord(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#77736D] hover:text-[#F5F1E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              Confirm Settlement
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteFriend(deleteId);
            setDeleteId(null);
          }
        }}
        title="Delete Record"
        description="Are you sure you want to delete this friend record? All associated payment history will be permanently removed."
        variant="danger"
      />
    </div>
  );
};

