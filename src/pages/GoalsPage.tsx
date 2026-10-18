import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Target, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SavingsGoal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { LandscapeHero } from '@/components/shared/LandscapeHero';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';

const GOAL_IMAGE_PRESETS = [
  { id: 'iphone', name: 'New iPhone', image: '/assets/moneymate/goals/iphone.jpg' },
  { id: 'europe-trip', name: 'Europe Trip', image: '/assets/moneymate/goals/europe-trip.jpg' },
  { id: 'emergency-fund', name: 'Emergency Fund', image: '/assets/moneymate/goals/emergency-fund.jpg' },
  { id: 'new-car', name: 'New Car', image: '/assets/moneymate/goals/new-car.jpg' },
  { id: 'dream-house', name: 'Dream House', image: '/assets/moneymate/goals/dream-house.jpg' },
  { id: 'education', name: 'Education', image: '/assets/moneymate/goals/education.jpg' },
  { id: 'bike', name: 'Bike', image: '/assets/moneymate/goals/bike.jpg' },
  { id: 'laptop', name: 'Laptop', image: '/assets/moneymate/goals/laptop.jpg' },
  { id: 'camera', name: 'Camera', image: '/assets/moneymate/goals/camera.jpg' },
  { id: 'gaming-setup', name: 'Gaming Setup', image: '/assets/moneymate/goals/gaming-setup.jpg' },
  { id: 'travel-world', name: 'Travel World', image: '/assets/moneymate/goals/travel-world.jpg' },
  { id: 'custom-goal', name: 'Custom Goal', image: '/assets/moneymate/goals/custom-goal.jpg' },
];

const goalImgMap: Record<string, string> = {
  'New iPhone': '/assets/moneymate/goals/iphone.jpg',
  'Europe Trip': '/assets/moneymate/goals/europe-trip.jpg',
  'Emergency Fund': '/assets/moneymate/goals/emergency-fund.jpg',
  'New Car': '/assets/moneymate/goals/new-car.jpg',
  'Dream House': '/assets/moneymate/goals/dream-house.jpg',
  'Education': '/assets/moneymate/goals/education.jpg',
  'Bike': '/assets/moneymate/goals/bike.jpg',
  'Laptop': '/assets/moneymate/goals/laptop.jpg',
  'Camera': '/assets/moneymate/goals/camera.jpg',
  'Gaming Setup': '/assets/moneymate/goals/gaming-setup.jpg',
  'Travel World': '/assets/moneymate/goals/travel-world.jpg',
  'Custom Goal': '/assets/moneymate/goals/custom-goal.jpg',
};

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addMoneyToGoal } = useApp();
  const [filter, setFilter] = useState<'all' | 'short-term' | 'long-term'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [addMoneyGoalId, setAddMoneyGoalId] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Form
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formSaved, setFormSaved] = useState('0');
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState<'short-term' | 'long-term'>('short-term');
  const [formImage, setFormImage] = useState<string>('/assets/moneymate/goals/iphone.jpg');
  const [formNotes, setFormNotes] = useState('');

  const filtered = goals.filter(g => filter === 'all' || g.category === filter);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const resetForm = () => {
    setFormName(''); setFormTarget(''); setFormSaved('0');
    setFormDate(''); setFormCategory('short-term'); setFormNotes('');
    setFormImage('/assets/moneymate/goals/iphone.jpg');
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditGoal(goal);
    setFormName(goal.name);
    setFormTarget(goal.targetAmount.toString());
    setFormSaved(goal.savedAmount.toString());
    setFormDate(goal.targetDate || '');
    setFormCategory(goal.category);
    setFormImage(goal.image || goalImgMap[goal.name] || '/assets/moneymate/goals/custom-goal.jpg');
    setFormNotes(goal.notes || '');
    setShowCreate(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formTarget || parseFloat(formTarget) <= 0) return;
    const data = {
      name: formName.trim(),
      targetAmount: parseFloat(formTarget),
      savedAmount: parseFloat(formSaved) || 0,
      targetDate: formDate || undefined,
      category: formCategory,
      image: formImage,
      notes: formNotes,
    };

    if (editGoal) {
      updateGoal(editGoal.id, data);
      setEditGoal(null);
    } else {
      addGoal(data);
    }

    resetForm();
    setShowCreate(false);
  };

  const handleAddMoney = () => {
    if (!addMoneyGoalId || !addMoneyAmount) return;
    const amt = parseFloat(addMoneyAmount);
    if (amt > 0) {
      addMoneyToGoal(addMoneyGoalId, amt);
      const targetGoal = goals.find(g => g.id === addMoneyGoalId);
      if (targetGoal && (targetGoal.savedAmount + amt >= targetGoal.targetAmount)) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      setAddMoneyAmount('');
      setAddMoneyGoalId(null);
    }
  };

  return (
    <div className="min-h-screen pb-32 lg:pb-8">
      <div className="px-4 md:px-6 pt-4 space-y-4">
        {/* Landscape hero */}
        <LandscapeHero quote="Set goals, reach milestones, build your future." />

        {/* Header with Add Goal Button */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#F5F1E8] tracking-tight">Savings & Capital Goals</h1>
            <p className="text-xs text-[#77736D] mt-0.5">Track your asset acquisition targets and wealth milestones</p>
          </div>
          <button
            onClick={() => { resetForm(); setEditGoal(null); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Create Goal</span>
            <span className="sm:hidden">Goal</span>
          </button>
        </div>

        {/* Total overview */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated p-4 sm:p-5 mb-5 specular-sheen"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#77736D] uppercase tracking-wider font-semibold mb-1">Total Capital Accumulated</p>
              <p className="text-xl sm:text-2xl font-medium text-[#D6BC86] number-display">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#77736D] uppercase tracking-wider font-semibold mb-1">Target Total</p>
              <p className="text-base sm:text-lg font-medium text-[#B6B0A5] number-display">{formatCurrency(totalTarget)}</p>
            </div>
          </div>
          <div className="progress-bar h-2">
            <motion.div
              className="progress-bar-fill bg-[#D6BC86]"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-xs text-[#77736D] mt-2 font-medium number-display">{overallProgress}% of aggregate target reached</p>
        </motion.div>

        {/* Filter tabs */}
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {(['all', 'short-term', 'long-term'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                filter === f
                  ? 'bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/35 shadow-sm'
                  : 'bg-[#121215] text-[#77736D] hover:text-[#F5F1E8] border border-[rgba(214,188,134,0.1)]'
              }`}
            >
              {f === 'all' ? 'All Goals' : f === 'short-term' ? 'Short Term' : 'Long Term'}
            </button>
          ))}
        </div>

        {/* Goal Cards */}
        {filtered.length === 0 ? (
          <EmptyState
            image="/assets/moneymate/empty/empty-goals-icon.jpg"
            title="No savings goals yet"
            description="Set a savings goal to achieve your dreams and track milestone progress."
            actionText="Create Your First Goal"
            onAction={() => { resetForm(); setEditGoal(null); setShowCreate(true); }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((goal, i) => {
              const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
              const isComplete = goal.savedAmount >= goal.targetAmount;
              const imageSrc = goal.image || goalImgMap[goal.name];

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className={`glass-card p-5 hover:border-[rgba(214,188,134,0.25)] transition-all group relative overflow-hidden specular-sheen ${isComplete ? 'ring-1 ring-[#D6BC86]/40' : ''}`}
                >
                  {isComplete && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#83C9A5]/15 text-[10px] font-semibold text-[#83C9A5] border border-[#83C9A5]/30">
                      ✓ Achieved
                    </div>
                  )}
                  <div className="flex gap-4">
                    {/* Goal Real Image Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[rgba(214,188,134,0.2)] shadow-md flex-shrink-0 bg-[#0B0B0D] group-hover:scale-105 transition-transform">
                      {imageSrc ? (
                        <img src={imageSrc} alt={goal.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#121215] flex items-center justify-center text-xl text-[#D6BC86]">
                          🎯
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-[#F5F1E8] truncate">{goal.name}</h4>
                      <p className="text-sm text-[#B6B0A5] number-display mt-0.5">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                      {goal.targetDate && (
                        <p className="text-[10px] text-[#77736D] mt-0.5">
                          Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#77736D] number-display">{formatCurrency(goal.savedAmount)} saved</span>
                      <span className="text-xs font-semibold text-[#D6BC86] number-display">{progress}%</span>
                    </div>
                    <div className="progress-bar h-1.5">
                      <motion.div
                        className={`progress-bar-fill ${isComplete ? 'bg-[#83C9A5]' : 'bg-[#D6BC86]'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.7, delay: 0.05 + i * 0.03 }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => { setAddMoneyGoalId(goal.id); setAddMoneyAmount(''); }}
                      className="flex-1 py-2 rounded-xl bg-[#D6BC86]/15 border border-[#D6BC86]/25 text-[#D6BC86] text-xs font-semibold hover:bg-[#D6BC86]/25 transition-all shadow-sm"
                    >
                      + Deposit Capital
                    </button>
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-2 rounded-xl hover:bg-white/5 text-[#77736D] hover:text-[#F5F1E8] transition-colors"
                      title="Edit Goal"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteGoalId(goal.id)}
                      className="p-2 rounded-xl hover:bg-white/5 text-[#77736D] hover:text-[#D98282] transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setEditGoal(null); }}
        title={editGoal ? 'Edit Goal' : 'Create Savings Goal'}
        footer={
          <button
            onClick={handleSave}
            disabled={!formName.trim() || !formTarget}
            className="w-full py-3.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            {editGoal ? 'Update Goal' : 'Confirm Goal Creation'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#B6B0A5] font-medium mb-1.5 block">Goal Name</label>
            <input
              type="text"
              placeholder="e.g., New iPhone, Dream Vacation"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50"
            />
          </div>

          {/* Goal Artwork Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#B6B0A5] font-medium flex items-center gap-1.5">
                <ImageIcon size={14} className="text-[#D6BC86]" />
                <span>Select Goal Artwork</span>
              </label>
              <span className="text-[10px] text-[#77736D] font-mono">
                {GOAL_IMAGE_PRESETS.find(p => p.image === formImage)?.name || 'Custom'}
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none -mx-1 px-1">
              {GOAL_IMAGE_PRESETS.map(preset => {
                const isSelected = formImage === preset.image;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormImage(preset.image);
                      if (!formName) setFormName(preset.name);
                    }}
                    className={`relative rounded-xl overflow-hidden w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 border-2 transition-all group ${
                      isSelected
                        ? 'border-[#D6BC86] ring-2 ring-[#D6BC86]/40 shadow-lg scale-95'
                        : 'border-[rgba(214,188,134,0.14)] opacity-70 hover:opacity-100 hover:border-[rgba(214,188,134,0.3)]'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] text-[#F5F1E8] font-medium truncate w-full text-center">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#D6BC86] text-[#0B0B0D] flex items-center justify-center text-[10px] font-bold shadow">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#B6B0A5] font-medium mb-1.5 block">Target Amount (₹)</label>
              <input
                type="number"
                placeholder="40000"
                value={formTarget}
                onChange={e => setFormTarget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 number-display"
              />
            </div>
            <div>
              <label className="text-xs text-[#B6B0A5] font-medium mb-1.5 block">Already Saved (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={formSaved}
                onChange={e => setFormSaved(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 number-display"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#B6B0A5] font-medium mb-1.5 block">Target Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 [color-scheme:dark] cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-[#B6B0A5] font-medium mb-1.5 block">Category</label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] focus:outline-none focus:border-[#D6BC86]/50 [color-scheme:dark] cursor-pointer"
              >
                <option value="short-term">Short Term</option>
                <option value="long-term">Long Term</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#B6B0A5] font-medium mb-1.5 block">Notes (optional)</label>
            <textarea
              placeholder="Add strategic notes or allocation plans..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-sm text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Add Money Modal */}
      <Modal isOpen={!!addMoneyGoalId} onClose={() => setAddMoneyGoalId(null)} title="Deposit Capital to Goal" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#B6B0A5] font-medium mb-2 block">Deposit Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter amount"
              value={addMoneyAmount}
              onChange={e => setAddMoneyAmount(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.16)] text-lg text-[#F5F1E8] placeholder:text-[#77736D] focus:outline-none focus:border-[#D6BC86]/50 number-display"
            />
          </div>
          <button
            onClick={handleAddMoney}
            disabled={!addMoneyAmount || parseFloat(addMoneyAmount) <= 0}
            className="w-full py-3 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs uppercase tracking-wider disabled:opacity-40 transition-all shadow-sm active:scale-[0.98]"
          >
            Confirm Deposit
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={() => deleteGoalId && deleteGoal(deleteGoalId)}
        title="Delete Goal"
        message="Are you sure you want to delete this savings goal? Stored progress will be removed."
        confirmText="Delete"
        variant="danger"
      />

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="glass-card-elevated p-8 text-center border border-[#D6BC86]/40 shadow-2xl bg-[#19191D]"
            >
              <Sparkles size={48} className="text-[#D6BC86] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-[#F5F1E8] font-serif">🎉 Goal Achieved!</h2>
              <p className="text-[#B6B0A5] mt-1 text-xs">Congratulations on reaching your wealth target!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

