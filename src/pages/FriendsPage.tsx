import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2,
  Calendar, Clock, DollarSign, Edit3, Trash2, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SettleUpSheet } from '@/components/shared/SettleUp';
import { QrCode } from 'lucide-react';
import { FriendRecord } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';

export const FriendsPage: React.FC = () => {
  const { friends, addFriend, updateFriend, deleteFriend, addPayment, settleFriend, mutate } = useApp();
  const [upiFor, setUpiFor] = useState<string | null>(null);
  const upiFriend = friends.find(f => f.id === upiFor);
  const upiRemaining = upiFriend ? Math.max(0, upiFriend.amount - upiFriend.payments.reduce((s, p) => s + p.amount, 0)) : 0;
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
            <div className="p-2 rounded-xl bg-mm-gold/15 text-mm-gold border border-mm-gold/30">
              <Users size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-mm-text tracking-tight">Capital Lending & IOU Ledger</h1>
          </div>
          <p className="text-xs text-mm-muted mt-1">Monitor money lent to associates, shared expenses, and debt settlements</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-semibold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex-shrink-0"
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">Receivable (Lent Out)</span>
            <div className="p-2 rounded-xl bg-mm-gold/15 text-mm-gold border border-mm-gold/25">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-medium text-mm-gold mt-2 number-display truncate">
            {formatCurrency(totalOwedToMe)}
          </p>
          <p className="text-xs text-mm-muted mt-1">
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">Payable (You Borrowed)</span>
            <div className="p-2 rounded-xl bg-mm-negative/15 text-mm-negative border border-mm-negative/25">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-medium text-mm-negative mt-2 number-display truncate">
            {formatCurrency(totalIOwe)}
          </p>
          <p className="text-xs text-mm-muted mt-1">
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">Net Credit Position</span>
            <div className={`p-2 rounded-xl border ${netBalance >= 0 ? 'bg-mm-positive/15 text-mm-positive border-mm-positive/25' : 'bg-mm-negative/15 text-mm-negative border-mm-negative/25'}`}>
              <DollarSign size={16} />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-medium mt-2 number-display truncate ${netBalance >= 0 ? 'text-mm-positive' : 'text-mm-negative'}`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
          </p>
          <p className="text-xs text-mm-muted mt-1">
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
                ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/35 shadow-sm'
                : 'bg-mm-bg2 text-mm-muted hover:text-mm-text border border-mm-line/10'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filter === tab.key ? 'bg-mm-gold/30 text-mm-gold-light' : 'bg-mm-text/5 text-mm-muted'
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
                className="glass-card p-4 transition-all hover:border-mm-line/24"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Avatar + Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-mm-elevated border border-mm-line/20 flex items-center justify-center text-sm font-semibold text-mm-gold flex-shrink-0">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-mm-text truncate">{friend.name}</h3>
                        {/* Type badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          friend.type === 'owed-to-me'
                            ? 'bg-mm-gold/15 text-mm-gold border border-mm-gold/25'
                            : 'bg-mm-negative/15 text-mm-negative border border-mm-negative/25'
                        }`}>
                          {friend.type === 'owed-to-me' ? 'Lent (Owed)' : 'Borrowed (Owe)'}
                        </span>

                        {/* Status badge */}
                        {friend.status === 'settled' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-mm-positive/15 text-mm-positive border border-mm-positive/25 font-medium flex items-center gap-1">
                            <CheckCircle2 size={10} /> Settled
                          </span>
                        ) : overdue ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-mm-warning/15 text-mm-warning border border-mm-warning/25 font-medium flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        ) : null}
                      </div>

                      {friend.description && (
                        <p className="text-xs text-mm-muted mt-0.5 truncate">{friend.description}</p>
                      )}

                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[11px] text-mm-muted flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {formatDate(friend.date)}
                        </span>
                        {friend.dueDate && (
                          <span className={`flex items-center gap-1 ${overdue ? 'text-mm-warning font-medium' : ''}`}>
                            <Clock size={12} /> Due: {formatDate(friend.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amounts */}
                  <div className="flex sm:flex-col justify-between items-baseline sm:items-end sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-mm-line/6 flex-shrink-0">
                    <span className="text-xs sm:hidden text-mm-muted">Total Amount:</span>
                    <div>
                      <p className="text-base font-medium text-mm-text number-display">
                        {formatCurrency(friend.amount)}
                      </p>
                      {friend.status !== 'settled' && totalPaid > 0 && (
                        <p className="text-[11px] text-mm-gold number-display">
                          {formatCurrency(remaining)} remaining
                        </p>
                      )}
                      {friend.status === 'settled' && (
                        <p className="text-[11px] text-mm-positive">Fully settled</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar if partially paid */}
                {friend.status !== 'settled' && (
                  <div className="mt-3 pt-3 border-t border-mm-line/10">
                    <div className="flex items-center justify-between text-[11px] text-mm-muted mb-1.5">
                      <span>Paid: {formatCurrency(totalPaid)}</span>
                      <span className="number-display">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-mm-bg2 rounded-full overflow-hidden border border-mm-line/10">
                      <div
                        className="h-full bg-mm-gold rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-mm-line/6">
                  {/* Payments toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : friend.id)}
                    className="text-xs text-mm-muted hover:text-mm-text flex items-center gap-1 transition-colors"
                  >
                    {friend.payments.length > 0 ? (
                      <>
                        <span>{friend.payments.length} payment{friend.payments.length > 1 ? 's' : ''}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </>
                    ) : (
                      <span className="text-[11px] text-mm-muted">No payments recorded</span>
                    )}
                  </button>

                  {/* Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {friend.status !== 'settled' && (
                      <>
                        <button
                          onClick={() => {
                            setPaymentRecord(friend);
                            setPayAmount(remaining.toString());
                          }}
                          className="px-2.5 py-1 rounded-xl bg-mm-gold/15 border border-mm-gold/30 text-mm-gold hover:bg-mm-gold/25 text-xs font-semibold transition-all shadow-sm"
                        >
                          Record Payment
                        </button>
                        <button
                          onClick={() => setUpiFor(friend.id)}
                          className="px-2.5 py-1 rounded-xl bg-mm-positive/12 border border-mm-positive/30 text-mm-positive hover:bg-mm-positive/20 text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <QrCode size={12} /> {friend.type === 'owed-to-me' ? 'Request' : 'Pay'} via UPI
                        </button>
                        <button
                          onClick={() => settleFriend(friend.id)}
                          className="p-1.5 rounded-lg hover:bg-mm-text/5 text-mm-muted hover:text-mm-positive transition-colors"
                          title="Mark settled"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleOpenEdit(friend)}
                      className="p-1.5 rounded-lg hover:bg-mm-text/5 text-mm-muted hover:text-mm-text transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(friend.id)}
                      className="p-1.5 rounded-lg hover:bg-mm-negative/10 text-mm-muted hover:text-mm-negative transition-colors"
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
                      className="overflow-hidden mt-3 pt-3 border-t border-mm-line/12"
                    >
                      <p className="text-xs font-semibold text-mm-text2 mb-2">Payment History</p>
                      <div className="space-y-1.5">
                        {friend.payments.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex items-center justify-between text-xs p-2 rounded-lg bg-mm-bg2 border border-mm-line/8"
                          >
                            <div>
                              <p className="font-medium text-mm-text number-display">{formatCurrency(p.amount)}</p>
                              {p.notes && <p className="text-[10px] text-mm-muted">{p.notes}</p>}
                            </div>
                            <span className="text-[10px] text-mm-muted">{formatDate(p.date)}</span>
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
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-4 py-3 rounded-xl text-xs font-semibold text-mm-muted hover:text-mm-text border border-mm-line/12 bg-mm-bg2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRecord}
              className="flex-1 py-3 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md"
            >
              {editRecord ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Person Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Alex Johnson"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Record Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType('owed-to-me')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                  formType === 'owed-to-me'
                    ? 'bg-mm-gold/15 border-mm-gold/40 text-mm-gold'
                    : 'border-mm-line/10 text-mm-muted hover:text-mm-text'
                }`}
              >
                I Lent (They owe me)
              </button>
              <button
                type="button"
                onClick={() => setFormType('i-owe')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                  formType === 'i-owe'
                    ? 'bg-mm-negative/15 border-mm-negative/40 text-mm-negative'
                    : 'border-mm-line/10 text-mm-muted hover:text-mm-text'
                }`}
              >
                I Borrowed (I owe them)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Total Capital Amount (₹)</label>
            <input
              type="number"
              step="any"
              required
              min="0.01"
              placeholder="0.00"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50 number-display"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Description / Purpose</label>
            <input
              type="text"
              placeholder="e.g. Dinner split, Concert tickets, Bridge capital"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Due Date (Optional)</label>
            <input
              type="date"
              value={formDueDate}
              onChange={e => setFormDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text focus:outline-none focus:border-mm-gold/50 [color-scheme:dark]"
            />
          </div>
        </form>
      </Modal>

      {upiFriend && (
        <SettleUpSheet
          open={!!upiFriend}
          onClose={() => setUpiFor(null)}
          direction={upiFriend.type === 'owed-to-me' ? 'collect' : 'pay'}
          person={upiFriend.name}
          amount={upiRemaining}
          note={upiFriend.description || 'what we split'}
          theirUpi={upiFriend.upiId}
          onSaveTheirUpi={vpa => mutate(s => ({ ...s, friends: s.friends.map(f => (f.id === upiFriend.id ? { ...f, upiId: vpa } : f)) }))}
          onMarkPaid={() => addPayment(upiFriend.id, { amount: upiRemaining, date: new Date().toISOString(), notes: 'Settled via UPI' })}
        />
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentRecord}
        onClose={() => setPaymentRecord(null)}
        title={`Record Payment — ${paymentRecord?.name}`}
        footer={
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => setPaymentRecord(null)}
              className="px-4 py-3 rounded-xl text-xs font-semibold text-mm-muted hover:text-mm-text border border-mm-line/12 bg-mm-bg2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRecordPayment}
              className="flex-1 py-3 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              Confirm Settlement
            </button>
          </div>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Payment Amount (₹)</label>
            <input
              type="number"
              step="any"
              required
              min="0.01"
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50 number-display"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-mm-text2 mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Bank Transfer, UPI, Cash settlement"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mm-bg2 border border-mm-line/16 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus:border-mm-gold/50"
            />
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

