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

export const seedTransactions: Transaction[] = [
  // Current month income
  { id: 't1', type: 'income', amount: 50000, description: 'Monthly Salary', category: 'Salary', date: d(2), paymentMethod: 'Net Banking', notes: '', createdAt: d(2) },
  { id: 't2', type: 'income', amount: 5000, description: 'Freelance Project', category: 'Freelance', date: d(8), paymentMethod: 'UPI', notes: 'Website redesign', createdAt: d(8) },

  // Current month expenses
  { id: 't3', type: 'expense', amount: 2500, description: 'Grocery Store', category: 'Food & Dining', date: d(1), paymentMethod: 'UPI', notes: '', createdAt: d(1) },
  { id: 't4', type: 'expense', amount: 1200, description: 'Swiggy Order', category: 'Food & Dining', date: d(3), paymentMethod: 'UPI', notes: 'Dinner with friends', createdAt: d(3) },
  { id: 't5', type: 'expense', amount: 4750, description: 'Amazon Purchase', category: 'Shopping', date: d(4), paymentMethod: 'Credit Card', notes: 'New headphones', createdAt: d(4) },
  { id: 't6', type: 'expense', amount: 1450, description: 'H&M Clothing', category: 'Shopping', date: d(7), paymentMethod: 'Debit Card', notes: '', createdAt: d(7) },
  { id: 't7', type: 'expense', amount: 2300, description: 'Gym Membership', category: 'Gym & Fitness', date: d(5), paymentMethod: 'UPI', notes: 'Monthly subscription', createdAt: d(5) },
  { id: 't8', type: 'expense', amount: 800, description: 'Uber Ride', category: 'Transport', date: d(2), paymentMethod: 'UPI', notes: '', createdAt: d(2) },
  { id: 't9', type: 'expense', amount: 2000, description: 'Metro Card Recharge', category: 'Transport', date: d(6), paymentMethod: 'UPI', notes: '', createdAt: d(6) },
  { id: 't10', type: 'expense', amount: 999, description: 'Netflix Subscription', category: 'Entertainment', date: d(3), paymentMethod: 'Credit Card', notes: '', createdAt: d(3) },
  { id: 't11', type: 'expense', amount: 2201, description: 'Movie Night', category: 'Entertainment', date: d(9), paymentMethod: 'UPI', notes: 'IMAX tickets + snacks', createdAt: d(9) },
  { id: 't12', type: 'expense', amount: 2500, description: 'Electricity Bill', category: 'Bills & Utilities', date: d(10), paymentMethod: 'Net Banking', notes: '', createdAt: d(10) },
  { id: 't13', type: 'expense', amount: 890, description: 'Pharmacy', category: 'Health', date: d(4), paymentMethod: 'Cash', notes: '', createdAt: d(4) },
  { id: 't14', type: 'expense', amount: 1500, description: 'Books & Courses', category: 'Education', date: d(11), paymentMethod: 'UPI', notes: 'Udemy course', createdAt: d(11) },
  { id: 't15', type: 'expense', amount: 2250, description: 'Miscellaneous', category: 'Others', date: d(6), paymentMethod: 'Cash', notes: '', createdAt: d(6) },
  { id: 't16', type: 'expense', amount: 3000, description: 'Zara Purchase', category: 'Shopping', date: d(12), paymentMethod: 'Credit Card', notes: '', createdAt: d(12) },

  // Last month transactions
  { id: 't17', type: 'income', amount: 50000, description: 'Monthly Salary', category: 'Salary', date: d(35), paymentMethod: 'Net Banking', notes: '', createdAt: d(35) },
  { id: 't18', type: 'expense', amount: 7500, description: 'Groceries & Dining', category: 'Food & Dining', date: d(32), paymentMethod: 'UPI', notes: '', createdAt: d(32) },
  { id: 't19', type: 'expense', amount: 5500, description: 'Online Shopping', category: 'Shopping', date: d(38), paymentMethod: 'Credit Card', notes: '', createdAt: d(38) },
  { id: 't20', type: 'expense', amount: 2000, description: 'Gym', category: 'Gym & Fitness', date: d(40), paymentMethod: 'UPI', notes: '', createdAt: d(40) },
  { id: 't21', type: 'expense', amount: 3000, description: 'Transport', category: 'Transport', date: d(37), paymentMethod: 'UPI', notes: '', createdAt: d(37) },
  { id: 't22', type: 'expense', amount: 2500, description: 'Entertainment', category: 'Entertainment', date: d(33), paymentMethod: 'UPI', notes: '', createdAt: d(33) },
  { id: 't23', type: 'expense', amount: 4500, description: 'Bills', category: 'Bills & Utilities', date: d(36), paymentMethod: 'Net Banking', notes: '', createdAt: d(36) },
  { id: 't24', type: 'expense', amount: 2000, description: 'Others', category: 'Others', date: d(34), paymentMethod: 'Cash', notes: '', createdAt: d(34) },
];

export const seedBudgets: Budget[] = [
  { id: 'b1', category: 'Food & Dining', limit: 12000, month: currentMonth, alertThreshold: 80 },
  { id: 'b2', category: 'Shopping', limit: 10000, month: currentMonth, alertThreshold: 80 },
  { id: 'b3', category: 'Gym & Fitness', limit: 5000, month: currentMonth, alertThreshold: 80 },
  { id: 'b4', category: 'Transport', limit: 5000, month: currentMonth, alertThreshold: 80 },
  { id: 'b5', category: 'Entertainment', limit: 5000, month: currentMonth, alertThreshold: 80 },
  { id: 'b6', category: 'Bills & Utilities', limit: 8000, month: currentMonth, alertThreshold: 80 },
];

export const seedGoals: SavingsGoal[] = [
  { id: 'g1', name: 'New iPhone', targetAmount: 40000, savedAmount: 12000, targetDate: '2027-03-01', category: 'short-term', image: '/assets/moneymate/goals/iphone.jpg', notes: 'iPhone 16 Pro Max', createdAt: d(60) },
  { id: 'g2', name: 'Europe Trip', targetAmount: 150000, savedAmount: 25000, targetDate: '2027-12-01', category: 'long-term', image: '/assets/moneymate/goals/europe-trip.jpg', notes: 'Paris, Rome, Barcelona', createdAt: d(90) },
  { id: 'g3', name: 'Emergency Fund', targetAmount: 100000, savedAmount: 20000, category: 'long-term', image: '/assets/moneymate/goals/emergency-fund.jpg', notes: '6 months expenses', createdAt: d(120) },
  { id: 'g4', name: 'New Car', targetAmount: 1000000, savedAmount: 120000, targetDate: '2028-06-01', category: 'long-term', image: '/assets/moneymate/goals/new-car.jpg', notes: 'Down payment', createdAt: d(150) },
];

export const seedFriends: FriendRecord[] = [
  {
    id: 'f1', name: 'Rahul Sharma', type: 'owed-to-me', amount: 5000,
    date: d(15), description: 'Dinner split', dueDate: d(-15),
    status: 'outstanding', payments: []
  },
  {
    id: 'f2', name: 'Priya Patel', type: 'owed-to-me', amount: 3000,
    date: d(20), description: 'Movie tickets', status: 'partially-paid',
    payments: [{ id: 'fp1', amount: 1000, date: d(10), notes: 'Partial payment' }]
  },
  {
    id: 'f3', name: 'Vikram Singh', type: 'i-owe', amount: 2500,
    date: d(10), description: 'Lunch treat', status: 'outstanding', payments: []
  },
  {
    id: 'f4', name: 'Sneha Gupta', type: 'i-owe', amount: 1500,
    date: d(25), description: 'Cab sharing', status: 'outstanding', payments: []
  },
];

export const defaultSettings: UserSettings = {
  name: 'Atul',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  budgetStartDay: 1,
  theme: 'dark',
  reducedMotion: false,
  notifications: true,
};

export const MOTIVATIONAL_QUOTES = [
  "Small steps today, bigger dreams tomorrow.",
  "Better habits lead to a brighter you.",
  "Discipline today, freedom tomorrow.",
  "Every rupee saved is a rupee earned.",
  "Your future self will thank you.",
  "Financial freedom starts with one decision.",
];
