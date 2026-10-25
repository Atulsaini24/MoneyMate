import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Transaction, Budget, SavingsGoal, FriendRecord, FriendPayment, UserSettings, Asset, Group } from '@/types';
import { deriveKey, encryptJson, decryptJson, makeVerifier, checkVerifier, newSalt, rememberKey, recallKey, type EncryptedBlob } from '@/lib/crypto';
import { defaultSettings } from '@/data/seed';
import { generateId, getMonthYear, setDisplayConfig } from '@/lib/utils';
import { cloud } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { confetti, haptic } from '@/lib/fx';

interface LedgerState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  friends: FriendRecord[];
  assets: Asset[];
  groups: Group[];
  settings: UserSettings;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
}

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline';

interface AppContextType extends LedgerState {
  toasts: Toast[];

  // Cloud sync
  isCloudSynced: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  refreshCloudData: () => Promise<void>;

  /** Low-level state update used by feature modules (wealth, groups, tax). */
  mutate: (fn: (s: LedgerState) => LedgerState) => void;

  // End-to-end encryption
  locked: boolean;
  unlock: (passphrase: string) => Promise<boolean>;
  enableEncryption: (passphrase: string) => Promise<void>;
  disableEncryption: (passphrase: string) => Promise<boolean>;

  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>, opts?: { silent?: boolean }) => void;
  addTransactions: (list: Omit<Transaction, 'id' | 'createdAt'>[]) => void;
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
  updateSettings: (s: Partial<UserSettings>, opts?: { silent?: boolean }) => void;
  togglePrivacy: () => void;
  resetData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;

  // Toast
  showToast: (message: string, type?: Toast['type'], action?: Toast['action']) => void;
  removeToast: (id: string) => void;
}

// Each account gets its own cache so two people sharing a device never see
// (or upload) each other's data. Signed-out use has its own "guest" slot.
const LEGACY_KEY = 'moneymate_data';
const cacheKey = (uid: string | null) => `moneymate:v2:${uid || 'guest'}`;

const emptyLedger = (): LedgerState => ({
  transactions: [], budgets: [], goals: [], friends: [], assets: [], groups: [], settings: defaultSettings,
});
export type { LedgerState };

function sanitise(parsed: any, fallbackSettings = defaultSettings): LedgerState {
  return {
    transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
    budgets: Array.isArray(parsed?.budgets) ? parsed.budgets : [],
    goals: Array.isArray(parsed?.goals) ? parsed.goals : [],
    friends: Array.isArray(parsed?.friends) ? parsed.friends : [],
    assets: Array.isArray(parsed?.assets) ? parsed.assets : [],
    groups: Array.isArray(parsed?.groups) ? parsed.groups : [],
    settings: { ...fallbackSettings, ...(parsed?.settings || {}) },
  };
}

function readCache(uid: string | null): LedgerState | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    return raw ? sanitise(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeCache(uid: string | null, state: LedgerState) {
  try {
    // Encrypted accounts keep no readable copy on the device
    if (state.settings.encryption?.enabled) { localStorage.removeItem(cacheKey(uid)); return; }
    localStorage.setItem(cacheKey(uid), JSON.stringify(state));
  } catch (e) {
    console.warn('Could not cache ledger locally', e);
  }
}

const hasData = (s: LedgerState) => s.transactions.length + s.budgets.length + s.goals.length + s.friends.length + s.assets.length + s.groups.length > 0;

const localeForCurrency = (code: string) => (code === 'INR' ? 'en-IN' : navigator.language || 'en-US');

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const [state, setState] = useState<LedgerState>(() => readCache(null) ?? emptyLedger());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Cloud writes are only allowed once this account's cloud copy has been read,
  // otherwise an empty local state could overwrite real data.
  const readyToPush = useRef(false);
  const skipNextPush = useRef(false); // state just came *from* the cloud
  const keyRef = useRef<CryptoKey | null>(null);
  const pendingBlob = useRef<{ blob: EncryptedBlob; settings: UserSettings } | null>(null);
  const [locked, setLocked] = useState(false);

  /** What actually goes to the server: plain, or one encrypted blob plus the unlock metadata. */
  const toPayload = useCallback(async (s: LedgerState) => {
    if (s.settings.encryption?.enabled && keyRef.current) {
      const { encryption, theme, accent, currency, currencySymbol } = s.settings;
      return {
        transactions: [], budgets: [], goals: [], friends: [], assets: [], groups: [],
        settings: { ...defaultSettings, encryption, theme, accent, currency, currencySymbol, name: '' },
        encrypted: await encryptJson(keyRef.current, s),
      };
    }
    return { ...s, encrypted: null };
  }, []);
  const loadedFor = useRef<string | null | undefined>(undefined);

  // Keep formatCurrency() in step with settings. Runs during render on purpose
  // so the very first paint already uses the right currency and privacy mode.
  setDisplayConfig({
    currency: state.settings.currency || 'INR',
    locale: localeForCurrency(state.settings.currency || 'INR'),
    privacy: Boolean(state.settings.privacyMode),
  });

  // ---- Toasts ---------------------------------------------------------------
  const removeToast = useCallback((id: string) => setToasts(ts => ts.filter(t => t.id !== id)), []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success', action?: Toast['action']) => {
    const id = generateId();
    setToasts(ts => [...ts.slice(-2), { id, message, type, action }]);
    setTimeout(() => removeToast(id), action ? 6000 : 3500);
  }, [removeToast]);

  // ---- Load: per-user cache first, then the cloud copy wins ----------------
  const derivedName = user?.displayName?.trim() || (user?.email ? user.email.split('@')[0] : '');

  const loadFromCloud = useCallback(async (uid: string) => {
    setSyncStatus('syncing');
    const remote = await cloud.fetchLedger();
    if (loadedFor.current !== uid) return; // user switched mid-request

    if (!remote) {
      setSyncStatus('offline');
      readyToPush.current = true; // keep working locally; next change retries
      return;
    }

    if (remote.exists && remote.encrypted) {
      const meta = { ...defaultSettings, ...(remote.settings || {}) } as UserSettings;
      keyRef.current = keyRef.current || (await recallKey());
      if (keyRef.current) {
        try {
          const plain = await decryptJson<LedgerState>(keyRef.current, remote.encrypted);
          skipNextPush.current = true;
          setState(sanitise(plain, meta));
          setLocked(false);
        } catch {
          keyRef.current = null;
        }
      }
      if (!keyRef.current) {
        pendingBlob.current = { blob: remote.encrypted, settings: meta };
        setState(s => ({ ...emptyLedger(), settings: { ...s.settings, ...meta } }));
        setLocked(true);
        setSyncStatus('synced');
        return; // stay read-only until unlocked
      }
    } else if (remote.exists) {
      skipNextPush.current = true;
      setState(s => {
        const next = sanitise(remote, s.settings);
        if (!next.settings.name) next.settings.name = derivedName;
        writeCache(uid, next);
        return next;
      });
    } else {
      // First sign-in on this account: adopt any data made before signing in
      // (guest cache, or the pre-v2 shared key), then upload it.
      setState(s => {
        if (hasData(s)) return s;
        try {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            localStorage.removeItem(LEGACY_KEY);
            return sanitise(JSON.parse(legacy), s.settings);
          }
        } catch { /* ignore corrupt legacy data */ }
        const guest = readCache(null);
        return guest && hasData(guest) ? guest : s;
      });
    }
    setLastSyncedAt(remote.updatedAt || new Date().toISOString());
    setSyncStatus('synced');
    readyToPush.current = true;
  }, [derivedName]);

  useEffect(() => {
    if (loadedFor.current === userId) return;
    loadedFor.current = userId;
    readyToPush.current = false;

    const cached = readCache(userId) ?? emptyLedger();
    if (!cached.settings.name && derivedName) cached.settings.name = derivedName;
    setState(cached);

    if (!userId) {
      setSyncStatus('local');
      readyToPush.current = true;
      return;
    }
    loadFromCloud(userId);
  }, [userId, derivedName, loadFromCloud]);

  // ---- Persist: cache immediately, push to cloud debounced -----------------
  useEffect(() => {
    if (loadedFor.current !== userId) return;
    writeCache(userId, state);
    if (!userId || !readyToPush.current) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }

    setSyncStatus('syncing');
    if (locked) return;
    const timer = setTimeout(async () => {
      const ok = await cloud.saveLedger(await toPayload(state));
      setSyncStatus(ok ? 'synced' : 'offline');
      if (ok) setLastSyncedAt(new Date().toISOString());
    }, 600);
    return () => clearTimeout(timer);
  }, [state, userId, locked, toPayload]);

  // Retry when the connection comes back
  useEffect(() => {
    const retry = () => {
      if (userId && syncStatus === 'offline') setState(s => ({ ...s }));
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [userId, syncStatus]);

  const refreshCloudData = useCallback(async () => {
    if (!userId) return;
    await loadFromCloud(userId);
    showToast('Synced with your account', 'info');
  }, [userId, loadFromCloud, showToast]);

  const mutate = useCallback((fn: (s: LedgerState) => LedgerState) => setState(fn), []);

  // ---- Encryption -----------------------------------------------------------
  const unlock = useCallback(async (passphrase: string) => {
    const pending = pendingBlob.current;
    const meta = pending?.settings.encryption;
    if (!pending || !meta) return false;
    const key = await deriveKey(passphrase, meta.salt);
    if (!(await checkVerifier(key, meta.verifier))) return false;
    const plain = await decryptJson<LedgerState>(key, pending.blob);
    keyRef.current = key;
    await rememberKey(key);
    pendingBlob.current = null;
    skipNextPush.current = true;
    setState(sanitise(plain, pending.settings));
    setLocked(false);
    readyToPush.current = true;
    return true;
  }, []);

  const enableEncryption = useCallback(async (passphrase: string) => {
    const salt = newSalt();
    const key = await deriveKey(passphrase, salt);
    keyRef.current = key;
    await rememberKey(key);
    const verifier = await makeVerifier(key);
    setState(s => ({ ...s, settings: { ...s.settings, encryption: { enabled: true, salt, verifier } } }));
    showToast('Encryption is on. Keep your passphrase safe: it can’t be recovered.');
  }, [showToast]);

  const disableEncryption = useCallback(async (passphrase: string) => {
    const meta = state.settings.encryption;
    if (!meta) return true;
    const key = await deriveKey(passphrase, meta.salt);
    if (!(await checkVerifier(key, meta.verifier))) return false;
    keyRef.current = null;
    await rememberKey(null);
    setState(s => ({ ...s, settings: { ...s.settings, encryption: undefined } }));
    showToast('Encryption turned off', 'info');
    return true;
  }, [state.settings.encryption, showToast]);

  // ---- Transactions ---------------------------------------------------------
  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>, opts?: { silent?: boolean }) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    setState(s => ({ ...s, transactions: [newT, ...s.transactions] }));
    haptic(10);
    if (!opts?.silent) showToast(`${t.type === 'income' ? 'Income' : t.type === 'transfer' ? 'Transfer' : 'Expense'} saved`);
  }, [showToast]);

  const addTransactions = useCallback((list: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const now = new Date().toISOString();
    const items = list.map(t => ({ ...t, id: generateId(), createdAt: now }));
    setState(s => ({
      ...s,
      transactions: [...items, ...s.transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    }));
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setState(s => ({ ...s, transactions: s.transactions.map(t => (t.id === id ? { ...t, ...updates } : t)) }));
    showToast('Transaction updated');
  }, [showToast]);

  const deleteTransaction = useCallback((id: string) => {
    let removed: Transaction | undefined;
    let index = 0;
    setState(s => {
      index = s.transactions.findIndex(t => t.id === id);
      removed = s.transactions[index];
      return { ...s, transactions: s.transactions.filter(t => t.id !== id) };
    });
    showToast('Transaction deleted', 'info', {
      label: 'Undo',
      onClick: () => {
        if (!removed) return;
        const item = removed;
        setState(s => {
          const next = [...s.transactions];
          next.splice(Math.min(index, next.length), 0, item);
          return { ...s, transactions: next };
        });
      },
    });
  }, [showToast]);

  const getMonthlyTransactions = useCallback(
    (month: string) => state.transactions.filter(t => getMonthYear(t.date) === month),
    [state.transactions]
  );

  const getMonthlyIncome = useCallback(
    (month: string) => state.transactions.filter(t => t.type === 'income' && getMonthYear(t.date) === month).reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const getMonthlyExpenses = useCallback(
    (month: string) => state.transactions.filter(t => t.type === 'expense' && getMonthYear(t.date) === month).reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  const getCategorySpending = useCallback(
    (month: string, category: string) =>
      state.transactions
        .filter(t => t.type === 'expense' && getMonthYear(t.date) === month && t.category === category)
        .reduce((s, t) => s + t.amount, 0),
    [state.transactions]
  );

  // ---- Budgets --------------------------------------------------------------
  const addBudget = useCallback((b: Omit<Budget, 'id'>) => {
    setState(s => ({ ...s, budgets: [...s.budgets, { ...b, id: generateId() }] }));
    showToast('Budget created');
  }, [showToast]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setState(s => ({ ...s, budgets: s.budgets.map(b => (b.id === id ? { ...b, ...updates } : b)) }));
    showToast('Budget updated');
  }, [showToast]);

  const deleteBudget = useCallback((id: string) => {
    setState(s => ({ ...s, budgets: s.budgets.filter(b => b.id !== id) }));
    showToast('Budget removed', 'info');
  }, [showToast]);

  // ---- Goals ----------------------------------------------------------------
  const addGoal = useCallback((g: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    setState(s => ({ ...s, goals: [...s.goals, { ...g, id: generateId(), createdAt: new Date().toISOString() }] }));
    showToast('Goal created');
  }, [showToast]);

  const updateGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setState(s => ({ ...s, goals: s.goals.map(g => (g.id === id ? { ...g, ...updates } : g)) }));
    showToast('Goal updated');
  }, [showToast]);

  const deleteGoal = useCallback((id: string) => {
    setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }));
    showToast('Goal removed', 'info');
  }, [showToast]);

  const addMoneyToGoal = useCallback((id: string, amount: number) => {
    const goal = state.goals.find(g => g.id === id);
    if (!goal) return;
    const room = Math.max(0, goal.targetAmount - goal.savedAmount);
    const added = Math.min(amount, room);
    setState(s => ({ ...s, goals: s.goals.map(g => (g.id === id ? { ...g, savedAmount: g.savedAmount + added } : g)) }));
    if (added < amount) showToast(`Added ${added.toLocaleString()} — the goal only needed that much`, 'info');
    else if (goal.savedAmount + added >= goal.targetAmount) { showToast(`${goal.name} is fully funded!`); confetti(); haptic([20, 40, 20]); }
    else showToast(`Added to ${goal.name}`);
  }, [state.goals, showToast]);

  // ---- Friends --------------------------------------------------------------
  const addFriend = useCallback((f: Omit<FriendRecord, 'id' | 'payments'>) => {
    setState(s => ({ ...s, friends: [...s.friends, { ...f, id: generateId(), payments: [] }] }));
    showToast('IOU added');
  }, [showToast]);

  const updateFriend = useCallback((id: string, updates: Partial<FriendRecord>) => {
    setState(s => ({ ...s, friends: s.friends.map(f => (f.id === id ? { ...f, ...updates } : f)) }));
    showToast('IOU updated');
  }, [showToast]);

  const deleteFriend = useCallback((id: string) => {
    setState(s => ({ ...s, friends: s.friends.filter(f => f.id !== id) }));
    showToast('IOU deleted', 'info');
  }, [showToast]);

  const addPayment = useCallback((friendId: string, payment: Omit<FriendPayment, 'id'>) => {
    setState(s => ({
      ...s,
      friends: s.friends.map(f => {
        if (f.id !== friendId) return f;
        const payments = [...f.payments, { ...payment, id: generateId() }];
        const paid = payments.reduce((sum, p) => sum + p.amount, 0);
        return { ...f, payments, status: (paid >= f.amount ? 'settled' : 'partially-paid') as FriendRecord['status'] };
      }),
    }));
    showToast('Payment recorded');
  }, [showToast]);

  const settleFriend = useCallback((id: string) => {
    setState(s => ({ ...s, friends: s.friends.map(f => (f.id === id ? { ...f, status: 'settled' as const } : f)) }));
    showToast('Marked as settled');
  }, [showToast]);

  // ---- Settings & data ------------------------------------------------------
  const updateSettings = useCallback((updates: Partial<UserSettings>, opts?: { silent?: boolean }) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
    if (!opts?.silent) showToast('Settings saved');
  }, [showToast]);

  const togglePrivacy = useCallback(() => {
    setState(s => ({ ...s, settings: { ...s.settings, privacyMode: !s.settings.privacyMode } }));
  }, []);

  const resetData = useCallback(() => {
    setState(s => ({ ...emptyLedger(), settings: s.settings }));
    showToast('All records deleted', 'info');
  }, [showToast]);

  const exportData = useCallback(
    () => JSON.stringify({ app: 'MoneyMate', version: 2, exportedAt: new Date().toISOString(), ...state }, null, 2),
    [state]
  );

  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) return false;
      setState(s => sanitise(parsed, s.settings));
      showToast('Backup restored');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }, [showToast]);

  const value = useMemo<AppContextType>(() => ({
    ...state,
    toasts,
    isCloudSynced: Boolean(userId),
    syncStatus,
    lastSyncedAt,
    refreshCloudData,
    mutate, locked, unlock, enableEncryption, disableEncryption,
    addTransaction, addTransactions, updateTransaction, deleteTransaction,
    getMonthlyTransactions, getMonthlyIncome, getMonthlyExpenses, getCategorySpending,
    addBudget, updateBudget, deleteBudget,
    addGoal, updateGoal, deleteGoal, addMoneyToGoal,
    addFriend, updateFriend, deleteFriend, addPayment, settleFriend,
    updateSettings, togglePrivacy, resetData, exportData, importData,
    showToast, removeToast,
  }), [
    state, toasts, userId, syncStatus, lastSyncedAt, refreshCloudData,
    mutate, locked, unlock, enableEncryption, disableEncryption,
    addTransaction, addTransactions, updateTransaction, deleteTransaction,
    getMonthlyTransactions, getMonthlyIncome, getMonthlyExpenses, getCategorySpending,
    addBudget, updateBudget, deleteBudget, addGoal, updateGoal, deleteGoal, addMoneyToGoal,
    addFriend, updateFriend, deleteFriend, addPayment, settleFriend,
    updateSettings, togglePrivacy, resetData, exportData, importData, showToast, removeToast,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
