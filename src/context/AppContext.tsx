import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, Budget, SavingsGoal, FriendRecord, FriendPayment, UserSettings } from '@/types';
import { defaultSettings } from '@/data/seed';
import { generateId, getCurrentMonth, getMonthYear } from '@/lib/utils';
import { mongoSync } from '@/lib/mongoSync';
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
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        friends: Array.isArray(parsed.friends) ? parsed.friends : [],
        settings: parsed.settings ? { ...defaultSettings, ...parsed.settings } : defaultSettings,
        toasts: [],
      };
    }
  } catch (e) {
    console.error('Failed to load local state:', e);
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
    console.error('Failed to save state to localStorage:', e);
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const { user } = useAuth();
  const userId = user?.uid || null;
  const isInitialLoaded = useRef(false);

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

  // MongoDB Atlas Real-time synchronization
  useEffect(() => {
    if (!userId) {
      isInitialLoaded.current = true;
      return;
    }

    isInitialLoaded.current = false;

    // Automatically derive display name from Google Auth or email prefix
    const derivedName = user?.displayName?.trim() || 
      (user?.email ? user.email.split('@')[0] : 'Investor');

    // Fetch complete ledger from MongoDB Atlas and safely merge with local cache
    mongoSync.fetchUserLedger(userId).then(cloudData => {
      if (cloudData) {
        console.log('[MongoDB] Loaded cloud ledger for user:', userId, {
          txCount: cloudData.transactions?.length || 0,
        });

        setState(s => {
          // Merge transactions by ID: cloud takes priority, local items with new IDs are preserved
          const txMap = new Map<string, Transaction>();
          s.transactions.forEach(t => txMap.set(t.id, t));
          (cloudData.transactions || []).forEach(t => txMap.set(t.id, t));
          const mergedTransactions = Array.from(txMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          // Merge budgets by ID
          const budgetMap = new Map<string, Budget>();
          s.budgets.forEach(b => budgetMap.set(b.id, b));
          (cloudData.budgets || []).forEach(b => budgetMap.set(b.id, b));

          // Merge goals by ID
          const goalMap = new Map<string, SavingsGoal>();
          s.goals.forEach(g => goalMap.set(g.id, g));
          (cloudData.goals || []).forEach(g => goalMap.set(g.id, g));

          // Merge friends by ID
          const friendMap = new Map<string, FriendRecord>();
          s.friends.forEach(f => friendMap.set(f.id, f));
          (cloudData.friends || []).forEach(f => friendMap.set(f.id, f));

          return {
            ...s,
            transactions: mergedTransactions,
            budgets: Array.from(budgetMap.values()),
            goals: Array.from(goalMap.values()),
            friends: Array.from(friendMap.values()),
            settings: {
              ...(cloudData.settings || s.settings),
              name: cloudData.settings?.name && cloudData.settings.name !== 'Atul' && cloudData.settings.name !== 'Investor'
                ? cloudData.settings.name 
                : derivedName,
            },
          };
        });
      } else {
        // If no cloud data found, initialize settings with their name
        setState(s => ({
          ...s,
          settings: {
            ...s.settings,
            name: s.settings?.name && s.settings.name !== 'Investor' ? s.settings.name : derivedName,
          }
        }));
      }

      isInitialLoaded.current = true;
    }).catch(err => {
      console.error('[MongoDB Error] Initial ledger sync error:', err);
      isInitialLoaded.current = true;
    });
  }, [userId, user?.displayName, user?.email]);

  // Push updates to MongoDB Atlas automatically whenever data changes (guarded by isInitialLoaded)
  useEffect(() => {
    if (!userId || !isInitialLoaded.current) return;
    const timer = setTimeout(() => {
      mongoSync.saveUserLedger(userId, {
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals,
        friends: state.friends,
        settings: state.settings,
        userInfo: {
          email: user?.email || null,
          displayName: user?.displayName || state.settings?.name || 'Investor'
        }
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [userId, user?.email, user?.displayName, state.transactions, state.budgets, state.goals, state.friends, state.settings]);

  // Transactions
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, transactions: [newT, ...s.transactions] }));
    showToast(`${t.type === 'income' ? 'Inflow' : 'Outflow'} recorded successfully!`);
  }, [showToast]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState(s => {
      const updated = s.transactions.map(t => {
        if (t.id === id) {
          return { ...t, ...updates };
        }
        return t;
      });
      return { ...s, transactions: updated };
    });
    showToast('Transaction updated!');
  }, [showToast]);

  const deleteTransaction = useCallback((id: string) => {
    setState(s => ({
      ...s,
      transactions: s.transactions.filter(t => t.id !== id),
    }));
    showToast('Transaction deleted!', 'info');
  }, [showToast]);

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
    showToast('Budget plan created!');
  }, [showToast]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setState(s => {
      const updated = s.budgets.map(b => {
        if (b.id === id) {
          return { ...b, ...updates };
        }
        return b;
      });
      return { ...s, budgets: updated };
    });
    showToast('Budget updated!');
  }, [showToast]);

  const deleteBudget = useCallback((id: string) => {
    setState(s => ({ ...s, budgets: s.budgets.filter(b => b.id !== id) }));
    showToast('Budget removed!', 'info');
  }, [showToast]);

  // Goals
  const addGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const newG = { ...g, id: generateId(), createdAt: new Date().toISOString() };
    setState(s => ({
      ...s,
      goals: [...s.goals, newG],
    }));
    showToast('Capital goal created!');
  }, [showToast]);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setState(s => {
      const updated = s.goals.map(g => {
        if (g.id === id) {
          return { ...g, ...updates };
        }
        return g;
      });
      return { ...s, goals: updated };
    });
    showToast('Goal updated!');
  }, [showToast]);

  const deleteGoal = useCallback((id: string) => {
    setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }));
    showToast('Goal removed!', 'info');
  }, [showToast]);

  const addMoneyToGoal = useCallback((id: string, amount: number) => {
    setState(s => {
      const updated = s.goals.map(g => {
        if (g.id !== id) return g;
        const newSaved = Math.min(g.savedAmount + amount, g.targetAmount);
        return { ...g, savedAmount: newSaved };
      });
      return { ...s, goals: updated };
    });
    showToast('Capital deposited to goal!');
  }, [showToast]);

  // Friends
  const addFriend = useCallback((f: Omit<FriendRecord, 'id' | 'payments'>) => {
    const newF = { ...f, id: generateId(), payments: [] };
    setState(s => ({
      ...s,
      friends: [...s.friends, newF],
    }));
    showToast('IOU record added!');
  }, [showToast]);

  const updateFriend = useCallback((id: string, updates: Partial<FriendRecord>) => {
    setState(s => {
      const updated = s.friends.map(f => {
        if (f.id === id) {
          return { ...f, ...updates };
        }
        return f;
      });
      return { ...s, friends: updated };
    });
    showToast('Record updated!');
  }, [showToast]);

  const deleteFriend = useCallback((id: string) => {
    setState(s => ({ ...s, friends: s.friends.filter(f => f.id !== id) }));
    showToast('Record deleted!', 'info');
  }, [showToast]);

  const addPayment = useCallback((friendId: string, payment: Omit<FriendPayment, 'id'>) => {
    setState(s => {
      const updated = s.friends.map(f => {
        if (f.id !== friendId) return f;
        const newPayment: FriendPayment = { ...payment, id: generateId() };
        const updatedPayments = [...f.payments, newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const newStatus = totalPaid >= f.amount ? 'settled' : 'partially-paid';
        return { ...f, payments: updatedPayments, status: newStatus as FriendRecord['status'] };
      });
      return { ...s, friends: updated };
    });
    showToast('Payment recorded!');
  }, [showToast]);

  const settleFriend = useCallback((id: string) => {
    setState(s => {
      const updated = s.friends.map(f => {
        if (f.id !== id) return f;
        return { ...f, status: 'settled' as const };
      });
      return { ...s, friends: updated };
    });
    showToast('Marked as settled!');
  }, [showToast]);

  // Settings
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setState(s => {
      const newSettings = { ...s.settings, ...updates };
      return { ...s, settings: newSettings };
    });
    showToast('Settings updated!');
  }, [showToast]);

  const resetData = useCallback(() => {
    const emptyState: AppState = {
      transactions: [],
      budgets: [],
      goals: [],
      friends: [],
      settings: state.settings,
      toasts: [],
    };
    setState(emptyState);
    if (userId) {
      mongoSync.saveUserLedger(userId, {
        transactions: [],
        budgets: [],
        goals: [],
        friends: [],
        settings: state.settings,
      });
    }
    showToast('Ledger wiped clean! 0 records remaining.', 'info');
  }, [userId, state.settings, showToast]);

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
          mongoSync.saveUserLedger(userId, {
            ...nextState,
            userInfo: {
              email: user?.email || null,
              displayName: user?.displayName || nextState.settings?.name || 'Investor'
            }
          });
        }
        showToast('Data backup restored and synchronized!', 'success');
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }, [userId, state, user, showToast]);

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
