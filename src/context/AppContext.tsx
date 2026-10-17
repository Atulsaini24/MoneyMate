import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, Budget, SavingsGoal, FriendRecord, FriendPayment, UserSettings } from '@/types';
import { seedTransactions, seedBudgets, seedGoals, seedFriends, defaultSettings } from '@/data/seed';
import { generateId, getCurrentMonth, getMonthYear } from '@/lib/utils';
import { firebaseSync } from '@/lib/firebaseSync';
import { useAuth } from '@/context/AuthContext';

interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  friends: FriendRecord[];
  settings: UserSettings;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType extends AppState {
  // Cloud sync status
  isCloudSynced: boolean;

  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getMonthlyTransactions: (month: string) => Transaction[];
  getMonthlyIncome: (month: string) => number;
  getMonthlyExpenses: (month: string) => number;
  getCategorySpending: (month: string, category: string) => number;

  // Budgets
  addBudget: (b: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Goals
  addGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, g: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  addMoneyToGoal: (id: string, amount: number) => void;

  // Friends
  addFriend: (f: Omit<FriendRecord, 'id' | 'payments'>) => void;
  updateFriend: (id: string, f: Partial<FriendRecord>) => void;
  deleteFriend: (id: string) => void;
  addPayment: (friendId: string, payment: Omit<FriendPayment, 'id'>) => void;
  settleFriend: (id: string) => void;

  // Settings
  updateSettings: (s: Partial<UserSettings>) => void;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;

  // Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'moneymate_data';

function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...parsed, toasts: [] };
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return {
    transactions: [],
    budgets: [],
    goals: [],
    friends: [],
    settings: defaultSettings,
    toasts: [],
  };
}

function saveState(state: AppState) {
  try {
    const { toasts, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const { user } = useAuth();
  const userId = user?.uid || null;

  // Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId();
    setState(s => ({ ...s, toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) }));
  }, []);

  // Save to localStorage whenever local state changes
  useEffect(() => {
    saveState(state);
  }, [state.transactions, state.budgets, state.goals, state.friends, state.settings]);

  // Real-time synchronization listeners with Firebase Firestore when logged in
  useEffect(() => {
    if (!userId) return;

    // Initial sync of settings from Firestore
    firebaseSync.getSettings(userId).then(cloudSettings => {
      if (cloudSettings) {
        setState(s => ({ ...s, settings: cloudSettings }));
      }
    });

    const unsubTxs = firebaseSync.subscribeTransactions(userId, (cloudTxs) => {
      setState(s => ({ ...s, transactions: cloudTxs }));
    });

    const unsubBudgets = firebaseSync.subscribeBudgets(userId, (cloudBudgets) => {
      setState(s => ({ ...s, budgets: cloudBudgets }));
    });

    const unsubGoals = firebaseSync.subscribeGoals(userId, (cloudGoals) => {
      setState(s => ({ ...s, goals: cloudGoals }));
    });

    const unsubFriends = firebaseSync.subscribeFriends(userId, (cloudFriends) => {
      setState(s => ({ ...s, friends: cloudFriends }));
    });

    return () => {
      unsubTxs();
      unsubBudgets();
      unsubGoals();
      unsubFriends();
    };
  }, [userId]);

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, transactions: [newT, ...s.transactions] }));
    if (userId) firebaseSync.saveTransaction(userId, newT);
    showToast(`${t.type === 'income' ? 'Inflow' : 'Outflow'} recorded successfully!`);
  }, [userId, showToast]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState(s => {
      const updated = s.transactions.map(t => {
        if (t.id === id) {
          const res = { ...t, ...updates };
          if (userId) firebaseSync.saveTransaction(userId, res);
          return res;
        }
        return t;
      });
      return { ...s, transactions: updated };
    });
    showToast('Transaction updated!');
  }, [userId, showToast]);

  const deleteTransaction = useCallback((id: string) => {
    setState(s => ({
      ...s,
      transactions: s.transactions.filter(t => t.id !== id),
    }));
    if (userId) firebaseSync.deleteTransaction(userId, id);
    showToast('Transaction deleted!', 'info');
  }, [userId, showToast]);

  const getMonthlyTransactions = useCallback((month: string) => {
    return state.transactions.filter(t => getMonthYear(t.date) === month);
  }, [state.transactions]);

  const getMonthlyIncome = useCallback((month: string) => {
    return state.transactions
      .filter(t => t.type === 'income' && getMonthYear(t.date) === month)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const getMonthlyExpenses = useCallback((month: string) => {
    return state.transactions
      .filter(t => t.type === 'expense' && getMonthYear(t.date) === month)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const getCategorySpending = useCallback((month: string, category: string) => {
    return state.transactions
      .filter(t => t.type === 'expense' && getMonthYear(t.date) === month && t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  // Budgets
  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    const newB = { ...b, id: generateId() };
    setState(s => ({ ...s, budgets: [...s.budgets, newB] }));
    if (userId) firebaseSync.saveBudget(userId, newB);
    showToast('Budget plan created!');
  }, [userId, showToast]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setState(s => {
      const updated = s.budgets.map(b => {
        if (b.id === id) {
          const res = { ...b, ...updates };
          if (userId) firebaseSync.saveBudget(userId, res);
          return res;
        }
        return b;
      });
      return { ...s, budgets: updated };
    });
    showToast('Budget updated!');
  }, [userId, showToast]);

  const deleteBudget = useCallback((id: string) => {
    setState(s => ({ ...s, budgets: s.budgets.filter(b => b.id !== id) }));
    if (userId) firebaseSync.deleteBudget(userId, id);
    showToast('Budget removed!', 'info');
  }, [userId, showToast]);

  // Goals
  const addGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newG = { ...g, id: generateId(), createdAt: new Date().toISOString() };
    setState(s => ({
      ...s,
      goals: [...s.goals, newG],
    }));
    if (userId) firebaseSync.saveGoal(userId, newG);
    showToast('Capital goal created!');
  }, [userId, showToast]);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setState(s => {
      const updated = s.goals.map(g => {
        if (g.id === id) {
          const res = { ...g, ...updates };
          if (userId) firebaseSync.saveGoal(userId, res);
          return res;
        }
        return g;
      });
      return { ...s, goals: updated };
    });
    showToast('Goal updated!');
  }, [userId, showToast]);

  const deleteGoal = useCallback((id: string) => {
    setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }));
    if (userId) firebaseSync.deleteGoal(userId, id);
    showToast('Goal removed!', 'info');
  }, [userId, showToast]);

  const addMoneyToGoal = useCallback((id: string, amount: number) => {
    setState(s => {
      const updated = s.goals.map(g => {
        if (g.id !== id) return g;
        const newSaved = Math.min(g.savedAmount + amount, g.targetAmount);
        const res = { ...g, savedAmount: newSaved };
        if (userId) firebaseSync.saveGoal(userId, res);
        return res;
      });
      return { ...s, goals: updated };
    });
    showToast('Capital deposited to goal!');
  }, [userId, showToast]);

  // Friends
  const addFriend = useCallback((f: Omit<FriendRecord, 'id' | 'payments'>) => {
    const newF = { ...f, id: generateId(), payments: [] };
    setState(s => ({
      ...s,
      friends: [...s.friends, newF],
    }));
    if (userId) firebaseSync.saveFriend(userId, newF);
    showToast('IOU record added!');
  }, [userId, showToast]);

  const updateFriend = useCallback((id: string, updates: Partial<FriendRecord>) => {
    setState(s => {
      const updated = s.friends.map(f => {
        if (f.id === id) {
          const res = { ...f, ...updates };
          if (userId) firebaseSync.saveFriend(userId, res);
          return res;
        }
        return f;
      });
      return { ...s, friends: updated };
    });
    showToast('Record updated!');
  }, [userId, showToast]);

  const deleteFriend = useCallback((id: string) => {
    setState(s => ({ ...s, friends: s.friends.filter(f => f.id !== id) }));
    if (userId) firebaseSync.deleteFriend(userId, id);
    showToast('Record deleted!', 'info');
  }, [userId, showToast]);

  const addPayment = useCallback((friendId: string, payment: Omit<FriendPayment, 'id'>) => {
    setState(s => {
      const updated = s.friends.map(f => {
        if (f.id !== friendId) return f;
        const newPayment: FriendPayment = { ...payment, id: generateId() };
        const updatedPayments = [...f.payments, newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= f.amount ? 'settled' : 'partially-paid';
        const res = { ...f, payments: updatedPayments, status: newStatus as FriendRecord['status'] };
        if (userId) firebaseSync.saveFriend(userId, res);
        return res;
      });
      return { ...s, friends: updated };
    });
    showToast('Payment recorded!');
  }, [userId, showToast]);

  const settleFriend = useCallback((id: string) => {
    setState(s => {
      const updated = s.friends.map(f => {
        if (f.id !== id) return f;
        const res = { ...f, status: 'settled' as const };
        if (userId) firebaseSync.saveFriend(userId, res);
        return res;
      });
      return { ...s, friends: updated };
    });
    showToast('Marked as settled!');
  }, [userId, showToast]);

  // Settings
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setState(s => {
      const newSettings = { ...s.settings, ...updates };
      if (userId) firebaseSync.saveSettings(userId, newSettings);
      return { ...s, settings: newSettings };
    });
    showToast('Settings updated!');
  }, [userId, showToast]);

  const resetData = useCallback(() => {
    setState({
      transactions: seedTransactions,
      budgets: seedBudgets,
      goals: seedGoals,
      friends: seedFriends,
      settings: defaultSettings,
      toasts: [],
    });
    showToast('Default sample data restored!', 'info');
  }, [showToast]);

  const exportData = useCallback((): string => {
    return JSON.stringify({
      transactions: state.transactions,
      budgets: state.budgets,
      goals: state.goals,
      friends: state.friends,
      settings: state.settings,
    }, null, 2);
  }, [state]);

  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        const nextState = {
          transactions: parsed.transactions || state.transactions,
          budgets: parsed.budgets || state.budgets,
          goals: parsed.goals || state.goals,
          friends: parsed.friends || state.friends,
          settings: parsed.settings || state.settings,
        };
        setState(s => ({ ...s, ...nextState }));
        if (userId) {
          nextState.transactions.forEach((t: Transaction) => firebaseSync.saveTransaction(userId, t));
          nextState.budgets.forEach((b: Budget) => firebaseSync.saveBudget(userId, b));
          nextState.goals.forEach((g: SavingsGoal) => firebaseSync.saveGoal(userId, g));
          nextState.friends.forEach((f: FriendRecord) => firebaseSync.saveFriend(userId, f));
          firebaseSync.saveSettings(userId, nextState.settings);
        }
        showToast('Data backup restored and synchronized!', 'success');
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }, [userId, state, showToast]);

  const value: AppContextType = {
    ...state,
    isCloudSynced: Boolean(userId),
    addTransaction, updateTransaction, deleteTransaction,
    getMonthlyTransactions, getMonthlyIncome, getMonthlyExpenses, getCategorySpending,
    addBudget, updateBudget, deleteBudget,
    addGoal, updateGoal, deleteGoal, addMoneyToGoal,
    addFriend, updateFriend, deleteFriend, addPayment, settleFriend,
    updateSettings, resetData, exportData, importData,
    showToast, removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
