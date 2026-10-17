// Multilingual Natural Language Parsing for MoneyMate Voice Assistant
// Robust category, intent, and amount detection across English, Hindi, Punjabi, and mixed Hinglish/Punglish

export interface ParsedVoiceCommand {
  action: 'add_transaction' | 'add_budget' | 'unknown';
  type: 'expense' | 'income' | 'transfer';
  amount?: number;
  description: string;
  category: string;
  paymentMethod: string;
  rawText: string;
  confidence: number;
}

// Category keyword mappings prioritized with specific words first
// Notice Gym & Fitness keywords: 'protien', 'protein', 'gym', 'creatine', 'workout'
const CATEGORY_MAP: Record<string, string[]> = {
  'Gym & Fitness': [
    'protien', 'protein', 'gym', 'workout', 'fitness', 'creatine', 'bcaa', 'supplement',
    'supplements', 'whey', 'dumble', 'dumbbell', 'trainer', 'yoga', 'exercise', 'sports'
  ],
  'Shopping': [
    'shopping', 'clothes', 'kapde', 'kapre', 'shoes', 'joota', 'amazon', 'flipkart',
    'myntra', 'zara', 'h&m', 'jeans', 'shirt', 'tshirt', 'watch', 'ghadi', 'dress',
    'buy', 'bought', 'kharida', 'khareeda', 'purchase', 'bag', 'phone', 'laptop', 'gadget'
  ],
  'Transport': [
    'uber', 'ola', 'rapido', 'auto', 'taxi', 'cab', 'bus', 'train', 'metro',
    'petrol', 'diesel', 'fuel', 'tel', 'ticket', 'flight', 'fare', 'kiraya',
    'travel', 'scooter', 'bike', 'car', 'parking', 'toll'
  ],
  'Bills & Utilities': [
    'electricity', 'bijli', 'water bill', 'pani bill', 'wifi', 'internet', 'recharge',
    'phone bill', 'gas', 'cylinder', 'rent', 'kamre ka kiraya', 'maintenance',
    'broadband', 'utility', 'light bill', 'bill'
  ],
  'Entertainment': [
    'movie', 'cinema', 'theatre', 'netflix', 'hotstar', 'prime', 'spotify', 'game',
    'gaming', 'steam', 'concert', 'match', 'outing', 'party', 'club', 'pub', 'fun'
  ],
  'Health': [
    'doctor', 'hospital', 'medicine', 'medicines', 'dawai', 'dawakhana', 'clinic',
    'checkup', 'test', 'medical', 'pharma', 'pharmacy', 'injection', 'chemist'
  ],
  'Education': [
    'books', 'kitab', 'course', 'udemy', 'coursera', 'fees', 'school', 'college',
    'tuition', 'exam', 'class', 'stationery', 'pen', 'copy'
  ],
  'Salary': [
    'salary', 'tankhwah', 'vetan', 'paycheck', 'stipend', 'wages'
  ],
  'Freelance': [
    'freelance', 'client', 'gig', 'project', 'contract'
  ],
  'Investment': [
    'stocks', 'share', 'shares', 'mutual fund', 'crypto', 'bitcoin', 'dividend', 'interest', 'byaj'
  ],
  'Food & Dining': [
    'tea', 'chai', 'cha', 'chah', 'coffee', 'food', 'khana', 'lunch',
    'dinner', 'breakfast', 'snack', 'snacks', 'swiggy', 'zomato', 'restaurant',
    'dhaba', 'pizza', 'burger', 'roti', 'sabzi', 'grocery', 'groceries', 'rashan',
    'fruits', 'fal', 'milk', 'doodh', 'paneer', 'nashta', 'rasoi', 'hotel', 'biryani',
    'momo', 'momos', 'samosa', 'maggi', 'cafe', 'drinks', 'water', 'sharbat'
  ],
};

// Numbers in English / Hindi / Punjabi phonetics
const WORD_TO_NUMBER: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
  'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
  'lakh': 100000, 'lac': 100000, 'crore': 10000000,
  // Hindi/Punjabi phonetics
  'ek': 1, 'ikk': 1, 'ik': 1, 'do': 2, 'teen': 3, 'tinn': 3, 'tin': 3, 'char': 4,
  'paanch': 5, 'panj': 5, 'che': 6, 'chhe': 6, 'saat': 7, 'sat': 7, 'aath': 8, 'ath': 8,
  'nau': 9, 'das': 10, 'dass': 10, 'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14,
  'pandrah': 15, 'pandran': 15, 'solah': 16, 'satrah': 17, 'atharah': 18, 'unnis': 19,
  'bees': 20, 'veeh': 20, 'vi': 20, 'pachees': 25, 'pachhi': 25, 'tees': 30, 'tee': 30,
  'chaalis': 40, 'chali': 40, 'pachaas': 50, 'panjah': 50, 'sau': 100, 'so': 100,
  'hazaar': 1000, 'hazar': 1000
};

export function parseVoiceInput(text: string): ParsedVoiceCommand {
  const clean = text.toLowerCase().trim();

  // 1. Check for Explicit Budget Setting Command:
  // e.g. "set budget 5000 for food", "add budget 1000 for shopping", "food ka budget 5000 rkho"
  // Note: If user says "ohnu gym ch add krde" or "add krde gym ch", that's transaction adding, not budget limit setting!
  const isBudgetCommand = /\b(budget limit|set budget|monthly budget|budget set|limit set)\b/i.test(clean) ||
    (/\bbudget\b/i.test(clean) && !/\b(kharche|spent|spend|paid|kharcha|diye|diya|ch kharche|teh)\b/i.test(clean));

  // 2. Detect Intent: Income vs Expense vs Transfer
  const isIncome = /\b(received|got|earned|credited|aaye|aaya|mili|mile|labhe|kamaye|income|salary|tankhwah)\b/i.test(clean);
  const type: 'expense' | 'income' | 'transfer' = isIncome ? 'income' : 'expense';

  // 3. Extract Amount
  // Matches "1000", "1000 ruppee", "1000 rs", "$10", "10$", "10 dollars", "₹500", "500 rupaye"
  let amount: number | undefined;

  const numPattern = /(?:[\$₹£€]|rs\.?|inr|rupees?|ruppee|rupaye|dollars?)?\s*(\d+(?:\.\d+)?)\s*(?:[\$₹£€]|rs\.?|inr|rupees?|ruppee|rupaye|dollars?|bucks)?/i;
  const match = clean.match(numPattern);

  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      amount = val;
    }
  }

  // Fallback: search phonetic number words
  if (!amount) {
    const words = clean.split(/[\s,]+/);
    for (const w of words) {
      if (WORD_TO_NUMBER[w] !== undefined && WORD_TO_NUMBER[w] > 0) {
        amount = WORD_TO_NUMBER[w];
        break;
      }
    }
  }

  // 4. Match Category - Check for explicit user destination first!
  // e.g. "gym ch add krde", "add in food", "food me add", "add krde gym ch"
  let category = type === 'income' ? 'Salary' : 'Others';
  let matchedKeyword = '';

  // Check explicit category names in the prompt first
  const explicitCategories: Record<string, string[]> = {
    'Gym & Fitness': ['gym', 'fitness', 'workout'],
    'Food & Dining': ['food', 'dining', 'khana'],
    'Shopping': ['shopping', 'clothes'],
    'Transport': ['transport', 'travel'],
    'Bills & Utilities': ['bill', 'utility', 'bills'],
    'Entertainment': ['entertainment', 'movie'],
    'Health': ['health', 'medical'],
    'Education': ['education', 'study'],
    'Investment': ['investment', 'stocks'],
  };

  for (const [catName, keywords] of Object.entries(explicitCategories)) {
    for (const kw of keywords) {
      // Look for "gym ch", "in gym", "to gym", "gym me", "gym"
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(clean)) {
        category = catName;
        matchedKeyword = kw;
        break;
      }
    }
    if (matchedKeyword) break;
  }

  // If no explicit category name mentioned, search the detailed item keywords (e.g. protien, chai, burger)
  if (!matchedKeyword) {
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(clean)) {
          category = cat;
          matchedKeyword = kw;
          break;
        }
      }
      if (matchedKeyword) break;
    }
  }

  // If still unmatched, default reasonably
  if (!matchedKeyword) {
    category = type === 'income' ? 'Salary' : 'Food & Dining';
  }

  // 5. Extract Description
  let description = '';
  if (matchedKeyword) {
    // If the keyword matched was 'gym', but user also said 'protien', extract item cleanly
    if (/\b(protien|protein)\b/i.test(clean)) {
      description = 'Protein';
    } else if (/\b(chai|tea)\b/i.test(clean)) {
      description = 'Tea';
    } else {
      description = matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
    }
  } else {
    // Strip common filler words
    const filtered = clean
      .replace(/(?:[\$₹£€]|rs\.?|inr|rupees?|ruppee|rupaye|dollars?)\s*\d+(?:\.\d+)?/gi, '')
      .replace(/\d+(?:\.\d+)?/g, '')
      .replace(/\b(i|spent|spend|on|add|this|in|to|mai|mane|me|aaj|kharche|kharcha|hai|teh|ohnu|krde|ch|ka|ke|liye|diya|diye|mera|mere|nu)\b/gi, '')
      .trim();
    description = filtered ? filtered.slice(0, 30) : (type === 'income' ? 'Income' : 'General Outflow');
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // 6. Payment Method Detection
  let paymentMethod = 'UPI';
  if (/\b(cash|nakad|rokar)\b/i.test(clean)) {
    paymentMethod = 'Cash';
  } else if (/\b(credit|card)\b/i.test(clean)) {
    paymentMethod = 'Credit Card';
  } else if (/\b(net banking|bank|transfer)\b/i.test(clean)) {
    paymentMethod = 'Net Banking';
  }

  return {
    action: isBudgetCommand ? 'add_budget' : (amount ? 'add_transaction' : 'unknown'),
    type,
    amount,
    description: description || 'Voice Entry',
    category,
    paymentMethod,
    rawText: text,
    confidence: amount ? 0.95 : 0.4,
  };
}
