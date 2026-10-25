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
  /** Income-tax deduction this counts towards (India) */
  taxSection?: TaxSection | 'none';
}

export type TaxSection = '80C' | '80D' | '80CCD1B' | '80E' | '80G' | 'HRA' | '24B';

export type AssetKind =
  | 'bank' | 'cash' | 'fd' | 'mutual_fund' | 'stocks' | 'epf_ppf' | 'gold' | 'property' | 'crypto' | 'other_asset'
  | 'home_loan' | 'car_loan' | 'personal_loan' | 'credit_card' | 'education_loan' | 'other_liability';

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  value: number;
  /** Units, ISIN, folio etc. for imported investments */
  meta?: string;
  updatedAt: string;
  history: { date: string; value: number }[];
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  /** Member display names. "You" is always members[0]. */
  members: string[];
  /** Optional UPI IDs by member name, for one-tap settle up */
  upi?: Record<string, string>;
  expenses: GroupExpense[];
  createdAt: string;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  /** Equal split among these members, or exact shares */
  splitAmong: string[];
  shares?: Record<string, number>;
  date: string;
  /** A settle-up payment rather than a shared cost */
  settlement?: boolean;
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
  /** Their UPI ID, so you can pay them in one tap */
  upiId?: string;
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
  /** Masks every amount on screen (handy in public). */
  privacyMode?: boolean;
  /** Your UPI ID, used for payment requests and QR codes */
  upiId?: string;
  accent?: 'gold' | 'emerald' | 'sapphire' | 'rose' | 'amethyst';
  pushEnabled?: boolean;
  /** Offer to move last month's surplus into a goal */
  sweepEnabled?: boolean;
  lastSweepMonth?: string;
  /** End-to-end encryption metadata (never the key itself) */
  encryption?: { enabled: boolean; salt: string; verifier: string };
  taxProfile?: { grossSalary: number; otherIncome: number; basic: number; hraReceived: number; metro: boolean; extra: Partial<Record<TaxSection, number>> };
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
