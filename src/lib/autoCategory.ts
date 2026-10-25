import type { Transaction } from '@/types';

// Common merchants and words → category. Your own history always wins over this list.
const KEYWORDS: [RegExp, string][] = [
  [/swiggy|zomato|restaurant|cafe|coffee|starbucks|chai|pizza|domino|mcdonald|kfc|burger|bigbasket|blinkit|zepto|grocer|dmart|instamart|bakery|lunch|dinner|breakfast/i, 'Food & Dining'],
  [/uber|ola|rapido|metro|petrol|diesel|fuel|parking|toll|irctc|train|flight|indigo|bus|cab|fastag/i, 'Transport'],
  [/amazon|flipkart|myntra|ajio|nykaa|meesho|mall|shoe|clothes|shirt|decathlon|ikea|croma/i, 'Shopping'],
  [/netflix|prime video|hotstar|spotify|movie|pvr|inox|bookmyshow|game|steam|playstation|concert|youtube premium/i, 'Entertainment'],
  [/rent|electricity|bescom|water bill|gas|wifi|broadband|airtel|jio|vodafone|vi recharge|recharge|insurance|emi|maintenance|bill/i, 'Bills & Utilities'],
  [/gym|cult|fitness|yoga|protein|sports/i, 'Gym & Fitness'],
  [/pharmacy|medicine|apollo|doctor|hospital|clinic|1mg|pharmeasy|dental|lab test/i, 'Health'],
  [/course|udemy|coursera|book|tuition|school|college|fees|exam/i, 'Education'],
];
const INCOME_KEYWORDS: [RegExp, string][] = [
  [/salary|payroll|stipend/i, 'Salary'],
  [/freelance|client|invoice|project|upwork|fiverr/i, 'Freelance'],
  [/dividend|interest|mutual fund|stock|sip|zerodha|groww/i, 'Investment'],
  [/refund|cashback|reversal/i, 'Refund'],
  [/gift|birthday|shagun/i, 'Gift'],
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Suggests a category for a description, learning from what the user picked before. */
export function suggestCategory(description: string, type: Transaction['type'], history: Transaction[]): string | null {
  const q = norm(description);
  if (q.length < 3) return null;
  const firstWord = q.split(' ')[0];

  // 1. Exact or first-word match in this user's own past entries (most recent wins)
  const past = history.find(t => t.type === type && (norm(t.description) === q || norm(t.description).split(' ')[0] === firstWord));
  if (past) return past.category;

  // 2. Built-in merchant keywords
  for (const [re, cat] of type === 'income' ? INCOME_KEYWORDS : KEYWORDS) if (re.test(q)) return cat;
  return null;
}
