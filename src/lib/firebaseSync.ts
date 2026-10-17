import { db, auth } from '@/lib/firebase';
import { 
  collection, doc, setDoc, deleteDoc, 
  onSnapshot, getDoc 
} from 'firebase/firestore';
import { Transaction, Budget, SavingsGoal, FriendRecord, UserSettings } from '@/types';

export const firebaseSync = {
  // Check if current user is logged in
  getUserId: () => auth?.currentUser?.uid || null,

  // Listen to User Transactions in real-time
  subscribeTransactions: (userId: string, onUpdate: (txs: Transaction[]) => void) => {
    if (!db) return () => {};
    const ref = collection(db, 'users', userId, 'transactions');
    return onSnapshot(ref, (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as Transaction));
      onUpdate(items);
    });
  },

  // Save or update transaction
  saveTransaction: async (userId: string, tx: Transaction) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'users', userId, 'transactions', tx.id), tx);
      console.log('[Firestore] Transaction saved:', tx.id);
    } catch (err) {
      console.error('[Firestore Error] Failed to save transaction:', err);
    }
  },

  // Delete transaction
  deleteTransaction: async (userId: string, txId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
      console.log('[Firestore] Transaction deleted:', txId);
    } catch (err) {
      console.error('[Firestore Error] Failed to delete transaction:', err);
    }
  },

  // Listen to Budgets
  subscribeBudgets: (userId: string, onUpdate: (budgets: Budget[]) => void) => {
    if (!db) return () => {};
    const ref = collection(db, 'users', userId, 'budgets');
    return onSnapshot(ref, (snapshot) => {
      const items: Budget[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as Budget));
      onUpdate(items);
    }, (error) => {
      console.error('[Firestore Error] Budgets subscription failed:', error);
    });
  },

  saveBudget: async (userId: string, budget: Budget) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'users', userId, 'budgets', budget.id), budget);
      console.log('[Firestore] Budget saved:', budget.id, budget.category, budget.limit);
    } catch (err) {
      console.error('[Firestore Error] Failed to save budget:', err);
    }
  },

  deleteBudget: async (userId: string, budgetId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
      console.log('[Firestore] Budget deleted:', budgetId);
    } catch (err) {
      console.error('[Firestore Error] Failed to delete budget:', err);
    }
  },

  // Listen to Goals
  subscribeGoals: (userId: string, onUpdate: (goals: SavingsGoal[]) => void) => {
    if (!db) return () => {};
    const ref = collection(db, 'users', userId, 'goals');
    return onSnapshot(ref, (snapshot) => {
      const items: SavingsGoal[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as SavingsGoal));
      onUpdate(items);
    });
  },

  saveGoal: async (userId: string, goal: SavingsGoal) => {
    if (!db) return;
    await setDoc(doc(db, 'users', userId, 'goals', goal.id), goal);
  },

  deleteGoal: async (userId: string, goalId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
  },

  // Listen to Friends / Debts
  subscribeFriends: (userId: string, onUpdate: (friends: FriendRecord[]) => void) => {
    if (!db) return () => {};
    const ref = collection(db, 'users', userId, 'friends');
    return onSnapshot(ref, (snapshot) => {
      const items: FriendRecord[] = [];
      snapshot.forEach((doc) => items.push(doc.data() as FriendRecord));
      onUpdate(items);
    });
  },

  saveFriend: async (userId: string, friend: FriendRecord) => {
    if (!db) return;
    await setDoc(doc(db, 'users', userId, 'friends', friend.id), friend);
  },

  deleteFriend: async (userId: string, friendId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'users', userId, 'friends', friendId));
  },

  // Save Settings
  saveSettings: async (userId: string, settings: UserSettings) => {
    if (!db) return;
    await setDoc(doc(db, 'users', userId, 'profile', 'settings'), settings);
  },

  getSettings: async (userId: string): Promise<UserSettings | null> => {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'users', userId, 'profile', 'settings'));
    return snap.exists() ? (snap.data() as UserSettings) : null;
  }
};
