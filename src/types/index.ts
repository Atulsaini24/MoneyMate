export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  category: string;
  date: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string; // YYYY-MM
  alertThreshold?: number; // percentage
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate?: string;
  category: 'short-term' | 'long-term';
  image?: string;
  notes?: string;
  createdAt: string;
}

export interface FriendRecord {
  id: string;
  name: string;
  type: 'owed-to-me' | 'i-owe';
  amount: number;
  date: string;
  description?: string;
  dueDate?: string;
  status: 'outstanding' | 'partially-paid' | 'settled';
  payments: FriendPayment[];
}

export interface FriendPayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UserSettings {
  name: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  budgetStartDay: number;
  theme: 'dark' | 'light';
  reducedMotion: boolean;
  notifications: boolean;
}

export type CategoryInfo = {
  name: string;
  icon: string;
  color: string;
};

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#D6BC86' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#B6B0A5' },
  { name: 'Gym & Fitness', icon: 'Dumbbell', color: '#D98282' },
  { name: 'Transport', icon: 'Car', color: '#D9B46F' },
  { name: 'Entertainment', icon: 'Gamepad2', color: '#E9D8AF' },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#8E8A83' },
  { name: 'Health', icon: 'Heart', color: '#D98282' },
  { name: 'Education', icon: 'GraduationCap', color: '#A39E95' },
  { name: 'Others', icon: 'MoreHorizontal', color: '#77736D' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { name: 'Salary', icon: 'Briefcase', color: '#83C9A5' },
  { name: 'Freelance', icon: 'Laptop', color: '#D6BC86' },
  { name: 'Investment', icon: 'TrendingUp', color: '#E9D8AF' },
  { name: 'Gift', icon: 'Gift', color: '#D9B46F' },
  { name: 'Refund', icon: 'RotateCcw', color: '#83C9A5' },
  { name: 'Others', icon: 'MoreHorizontal', color: '#77736D' },
];

export const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'
];
