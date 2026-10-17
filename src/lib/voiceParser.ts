// Multilingual Natural Language Parsing for MoneyMate Voice Assistant
// Supports English, Hindi, Punjabi, Hinglish, and mixed phrasing

export interface ParsedVoiceCommand {
  action: 'add_transaction' | 'check_balance' | 'unknown';
  type: 'expense' | 'income' | 'transfer';
  amount?: number;
  description: string;
  category: string;
  paymentMethod: string;
  rawText: string;
  languageDetected?: string;
  confidence: number;
}

// Category keyword mappings across English, Hindi, Punjabi, Hinglish
const CATEGORY_MAP: Record<string, string[]> = {
  'Food & Dining': [
    'tea', 'chai', 'cha', 'coffee', 'food', 'khana', 'lunch', 'dinner', 'breakfast',
    'snack', 'snacks', 'swiggy', 'zomato', 'restaurant', 'dhaba', 'pizza', 'burger',
    'roti', 'sabzi', 'grocery', 'groceries', 'rashan', 'fruits', 'fal', 'milk', 'doodh',
    'paneer', 'nashta', 'rasoi', 'hotel', 'biryani', 'momo', 'momos', 'samosa', 'maggi',
    'cafe', 'drinks', 'water', 'sharbat'
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
    'bill', 'electricity', 'bijli', 'water bill', 'pani', 'wifi', 'internet', 'recharge',
    'phone bill', 'gas', 'cylinder', 'rent', 'kamre ka kiraya', 'kiraya', 'maintenance',
    'broadband', 'utility', 'light bill'
  ],
  'Entertainment': [
    'movie', 'cinema', 'theatre', 'netflix', 'hotstar', 'prime', 'spotify', 'game',
    'gaming', 'steam', 'concert', 'match', 'outing', 'party', 'club', 'pub', 'fun'
  ],
  'Gym & Fitness': [
    'gym', 'workout', 'fitness', 'protein', 'creatine', 'supplement', 'supplements',
    'trainer', 'yoga', 'exercise', 'sports'
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
};

// Words for numbers in Hindi / Punjabi / English
const WORD_TO_NUMBER: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
  'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
  'lakh': 100000, 'lac': 100000, 'crore': 10000000,
  // Hindi/Punjabi phonetics
  'ek': 1, 'ikk': 1, 'do': 2, 'teen': 3, 'tinn': 3, 'char': 4, 'paanch': 5, 'panj': 5,
  'che': 6, 'chhe': 6, 'saat': 7, 'sat': 7, 'aath': 8, 'ath': 8, 'nau': 9, 'das': 10,
  'pandrah': 15, 'pandran': 15, 'bees': 20, 'veeh': 20, 'pachees': 25, 'pachhi': 25,
  'tees': 30, 'tee': 30, 'chaalis': 40, 'chali': 40, 'pachaas': 50, 'panjah': 50,
  'sau': 100, 'hazaar': 1000, 'hazar': 1000,
};

export function parseVoiceInput(text: string): ParsedVoiceCommand {
  const clean = text.toLowerCase().trim();
  
  // 1. Detect Intent: Income vs Expense vs Transfer
  const isIncome = /\b(received|got|earned|credited|aaye|aaya|mili|mile|labhe|kamaye|income|salary)\b/i.test(clean);
  const type: 'expense' | 'income' | 'transfer' = isIncome ? 'income' : 'expense';

  // 2. Extract Amount
  // Matches "$10", "10$", "10 dollars", "₹500", "500 rs", "500 rupaye", "500 rupeye", "500 rkhe", "10"
  let amount: number | undefined;

  const numPattern = /(?:[\$₹£€]|rs\.?|inr|rupees|rupaye|dollars?)?\s*(\d+(?:\.\d+)?)\s*(?:[\$₹£€]|rs\.?|inr|rupees|rupaye|dollars?|bucks)?/i;
  const match = clean.match(numPattern);

  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      amount = val;
    }
  }

  // Fallback: check phonetic number words
  if (!amount) {
    const words = clean.split(/\s+/);
    for (const w of words) {
      if (WORD_TO_NUMBER[w] !== undefined && WORD_TO_NUMBER[w] > 0) {
        amount = WORD_TO_NUMBER[w];
        break;
      }
    }
  }

  // 3. Match Category
  let category = type === 'income' ? 'Salary' : 'Food & Dining';
  let matchedKeyword = '';

  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords) {
      // Look for whole-word or substring match
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(clean)) {
        category = cat;
        matchedKeyword = kw;
        break;
      }
    }
    if (matchedKeyword) break;
  }

  // 4. Extract Description
  // Generate a clean description from the spoken sentence
  let description = '';
  if (matchedKeyword) {
    // Capitalize matched item (e.g. "Chai", "Coffee", "Uber")
    description = matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
  } else {
    // Fallback: strip numbers and common filler words to find subject
    const filtered = clean
      .replace(/(?:[\$₹£€]|rs\.?|inr|rupees|rupaye|dollars?)\s*\d+(?:\.\d+)?/gi, '')
      .replace(/\d+(?:\.\d+)?/g, '')
      .replace(/\b(i|spent|spend|on|add|this|in|to|mai|aaj|kharche|teh|ohnu|krde|ch|ka|ke|liye|me|diya|mera|mere)\b/gi, '')
      .trim();
    description = filtered ? filtered.slice(0, 30) : (type === 'income' ? 'Income' : 'General Outflow');
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  // 5. Payment Method Detection
  let paymentMethod = 'UPI';
  if (/\b(cash|nakad|rokar)\b/i.test(clean)) {
    paymentMethod = 'Cash';
  } else if (/\b(credit|card)\b/i.test(clean)) {
    paymentMethod = 'Credit Card';
  } else if (/\b(net banking|bank|transfer)\b/i.test(clean)) {
    paymentMethod = 'Net Banking';
  }

  return {
    action: amount ? 'add_transaction' : 'unknown',
    type,
    amount,
    description: description || 'Spoken Ledger Entry',
    category,
    paymentMethod,
    rawText: text,
    confidence: amount ? 0.95 : 0.4,
  };
}
