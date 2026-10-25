/**
 * Parses Indian bank transaction SMS (SBI, HDFC, ICICI, Axis, Kotak, etc.)
 * into ledger entries. Promotional, OTP, reminder and balance-only messages are skipped.
 */
import type { Transaction } from '@/types';
import { suggestCategory } from '@/lib/autoCategory';
import { cleanMerchant, parseBankDate, type ParsedEntry } from './types';

const SKIP = /\b(otp|one[\s-]?time password|will be debited|is due|due date|min(imum)? (amount )?due|request(ed)? (money|rs|inr)|collect request|offer|pre-?approved|apply now|win |congratulations|emi of rs.*due)\b/i;
const DEBIT = /\b(debited|spent|sent|paid|withdrawn|purchase(d)?|debit|transferred|txn of)\b/i;
const CREDIT = /\b(credited|received|deposited|refund(ed)?|reversed|cashback of)\b/i;
const AMOUNT = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/gi;
const HAS_AMOUNT = /(?:rs\.?|inr|₹)\s*[\d,]+/i;

function firstAmount(text: string): number | null {
  for (const m of text.matchAll(AMOUNT)) {
    const before = text.slice(Math.max(0, (m.index ?? 0) - 18), m.index).toLowerCase();
    if (/(bal|balance|lmt|limit|avl|available)[\s.:]*$/.test(before)) continue;
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (n > 0) return n;
  }
  // SBI and others often skip the currency: "debited by 250.00", "credited with 85000"
  const bare = text.match(/\b(?:debited|credited|spent|paid|sent|received)\s+(?:by|with|for|of)?\s*([\d,]+(?:\.\d{1,2})?)\b/i);
  const n = bare ? parseFloat(bare[1].replace(/,/g, '')) : 0;
  return n > 0 ? n : null;
}

function merchantFor(text: string, type: 'expense' | 'income'): string | null {
  // "by NEFT from INFOSYS" — the rail (NEFT/UPI) is not the counterparty
  text = text.replace(/\b(by|via|through|thru)\s+(neft|imps|rtgs|upi|nach|ach|transfer|net ?banking)\b/gi, ' ');
  const end = String.raw`(?=\s+(?:on|ref|via|upi|using|for|avl|dated|thru|through|not you|-\s)|[.;,](?=\s|$)|\(|\s*$)`;
  const patterns = type === 'expense'
    ? [
        new RegExp(String.raw`;\s*([A-Za-z][\w .&'@-]{1,40}?)\s+credited`, 'i'),
        new RegExp(String.raw`\b(?:to|at|towards|trf to)\s+(?:vpa\s+|a\/c\s+)?([A-Za-z0-9][\w .&'@/-]{1,40}?)${end}`, 'i'),
        new RegExp(String.raw`\binfo[:\s-]+([\w .&'@/-]{2,40}?)${end}`, 'i'),
      ]
    : [
        new RegExp(String.raw`\b(?:from|by)\s+(?:vpa\s+|a\/c\s+)?([A-Za-z0-9][\w .&'@/-]{1,40}?)${end}`, 'i'),
        new RegExp(String.raw`\binfo[:\s-]+([\w .&'@/-]{2,40}?)${end}`, 'i'),
      ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m && !/^(your|a\/c|ac|account|card|xx|\*)/i.test(m[1].trim())) return cleanMerchant(m[1]);
  }
  return null;
}

function methodFor(text: string): string {
  if (/\bupi\b|vpa|@[a-z]+/i.test(text)) return 'UPI';
  if (/credit card|\bcc\b/i.test(text)) return 'Credit Card';
  if (/debit card|\bcard\b/i.test(text)) return 'Debit Card';
  if (/\batm\b|withdrawn|cash/i.test(text)) return 'Cash';
  if (/neft|imps|rtgs|net ?banking/i.test(text)) return 'Net Banking';
  if (/wallet|paytm|phonepe wallet|amazon pay balance/i.test(text)) return 'Wallet';
  return 'Other';
}

/** Splits pasted text into individual messages: by blank lines, or by line when each line is its own SMS. */
export function splitMessages(input: string): string[] {
  const blocks = input.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.flatMap(b => {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    const each = lines.length > 1 && lines.every(l => HAS_AMOUNT.test(l) && (DEBIT.test(l) || CREDIT.test(l)));
    return each ? lines : [lines.join(' ')];
  });
}

export function parseSms(text: string, history: Transaction[] = [], now = new Date()): ParsedEntry | null {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t || SKIP.test(t)) return null;
  const d = t.search(DEBIT), c = t.search(CREDIT);
  if (d < 0 && c < 0) return null;
  // Whichever verb comes first describes *your* account ("debited ...; NETFLIX credited")
  const type: 'expense' | 'income' = d >= 0 && (c < 0 || d < c) ? 'expense' : 'income';
  const amount = firstAmount(t);
  if (!amount) return null;
  if (!/(rs\.?|inr|₹|a\/c|acct|account|card|upi|bank)/i.test(t)) return null; // not a bank message

  const isAtm = /\batm\b|cash withdraw/i.test(t);
  const description = isAtm ? 'ATM withdrawal' : merchantFor(t, type) || (type === 'income' ? 'Money received' : 'Bank payment');
  const account = t.match(/(?:a\/c|acct|account|card)\s*(?:no\.?)?\s*(?:ending\s*(?:with\s*)?)?[x*]*\s*(\d{3,4})\b/i)?.[1];
  const date = parseBankDate(t, now) || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).toISOString();
  const category = suggestCategory(description, type, history)
    || (type === 'income' ? (/refund|revers|cashback/i.test(t) ? 'Refund' : 'Others') : isAtm ? 'Others' : 'Others');

  return {
    key: `${date}|${amount}|${description}|${Math.random().toString(36).slice(2, 7)}`,
    type, amount, description, category, date,
    paymentMethod: isAtm ? 'Cash' : methodFor(t),
    account, raw: t,
  };
}

export function parseSmsBatch(input: string, history: Transaction[] = [], now = new Date()) {
  const messages = splitMessages(input);
  const entries: ParsedEntry[] = [];
  let skipped = 0;
  for (const m of messages) {
    const e = parseSms(m, history, now);
    if (e) entries.push(e); else skipped++;
  }
  return { entries, skipped, total: messages.length };
}
