import { Transaction, Budget, SavingsGoal, FriendRecord, UserSettings } from '@/types';

export interface UserLedgerData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  friends: FriendRecord[];
  settings?: UserSettings | null;
}

export const mongoSync = {
  // Load full user ledger from MongoDB Atlas
  fetchUserLedger: async (userId: string): Promise<UserLedgerData | null> => {
    try {
      const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        console.warn('[MongoDB] Fetch ledger response status:', res.status);
        return null;
      }
      const data = await res.json();
      return {
        transactions: data.transactions || [],
        budgets: data.budgets || [],
        goals: data.goals || [],
        friends: data.friends || [],
        settings: data.settings || null,
      };
    } catch (err) {
      console.error('[MongoDB Error] Failed to fetch ledger:', err);
      return null;
    }
  },

  // Save/Push complete user ledger state to MongoDB Atlas
  saveUserLedger: async (userId: string, ledger: UserLedgerData): Promise<boolean> => {
    try {
      const res = await fetch(`/api/sync?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ledger),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('[MongoDB Error] Save failed:', res.status, text);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[MongoDB Error] Network save error:', err);
      return false;
    }
  },
};
