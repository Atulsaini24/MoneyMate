import { Transaction, Budget, SavingsGoal, FriendRecord, UserSettings } from '@/types';

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

function d(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

export const seedTransactions: Transaction[] = [];
export const seedBudgets: Budget[] = [];
export const seedGoals: SavingsGoal[] = [];
export const seedFriends: FriendRecord[] = [];

export const defaultSettings: UserSettings = {
  name: '',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  budgetStartDay: 1,
  theme: 'dark',
  reducedMotion: false,
  notifications: true,
  privacyMode: false,
};

export const MOTIVATIONAL_QUOTES = [
  "Small steps today, bigger dreams tomorrow.",
  "Better habits lead to a brighter you.",
  "Discipline today, freedom tomorrow.",
  "Every rupee saved is a rupee earned.",
  "Your future self will thank you.",
  "Financial freedom starts with one decision.",
];
