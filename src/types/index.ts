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
  /** Legacy picture path from v3; mapped to an icon when shown. */
  image?: string;
  /** Lucide icon name chosen for the goal */
  icon?: string;
  /** Hex colour for the goal's icon tile */
  color?: string;
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
  theme: 'dark' | 'light' | 'system';
  reducedMotion: boolean;
  notifications: boolean;
  /** Masks every amount on screen (handy in public). */
  privacyMode?: boolean;
  /** Your UPI ID, used for payment requests and QR codes */
  upiId?: string;
  accent?: 'peacock' | 'gold' | 'emerald' | 'sapphire' | 'rose' | 'amethyst';
  pushEnabled?: boolean;
  /** Offer to move last month's surplus into a goal */
  sweepEnabled?: boolean;
  lastSweepMonth?: string;
  /** Chime when a payment is saved (default on) */
  sounds?: boolean;
  /** Full-screen confirmation after saving a payment (default on) */
  celebrations?: boolean;
  /** The person closed the Home checklist */
  onboardingDismissed?: boolean;
  /** End-to-end encryption metadata (never the key itself) */
  encryption?: { enabled: boolean; salt: string; verifier: string };
  taxProfile?: { grossSalary: number; otherIncome: number; basic: number; hraReceived: number; metro: boolean; extra: Partial<Record<TaxSection, number>> };
}

export type CategoryInfo = {
  name: string;
  icon: string;
  color: string;
};

// Distinct hues so charts and lists stay readable at a glance, in both themes.
export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#E0782F' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#C2478A' },
  { name: 'Gym & Fitness', icon: 'Dumbbell', color: '#16958A' },
  { name: 'Transport', icon: 'Car', color: '#2F7BD8' },
  { name: 'Entertainment', icon: 'Gamepad2', color: '#8458D4' },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#C99A06' },
  { name: 'Health', icon: 'Heart', color: '#D64545' },
  { name: 'Education', icon: 'GraduationCap', color: '#4B63D2' },
  { name: 'Others', icon: 'MoreHorizontal', color: '#7C8884' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { name: 'Salary', icon: 'Briefcase', color: '#1F8A55' },
  { name: 'Freelance', icon: 'Laptop', color: '#16958A' },
  { name: 'Investment', icon: 'TrendingUp', color: '#2F7BD8' },
  { name: 'Gift', icon: 'Gift', color: '#C2478A' },
  { name: 'Refund', icon: 'RotateCcw', color: '#C99A06' },
  { name: 'Others', icon: 'MoreHorizontal', color: '#7C8884' },
];

export const ALL_CATEGORIES: CategoryInfo[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/** Looks a category up by name; unknown names get a neutral fallback. */
export const categoryInfo = (name: string, type?: Transaction['type']): CategoryInfo =>
  (type === 'income' ? INCOME_CATEGORIES : type === 'expense' ? EXPENSE_CATEGORIES : ALL_CATEGORIES).find(c => c.name === name)
  || ALL_CATEGORIES.find(c => c.name === name)
  || { name, icon: 'Circle', color: '#7C8884' };

export const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'
];
