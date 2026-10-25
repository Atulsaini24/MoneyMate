import type { Transaction } from '@/types';

export interface ParsedEntry {
  /** Stable key so the preview list can track selection */
  key: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO
  paymentMethod: string;
  account?: string;
  raw: string;
  /** Already in the ledger (same amount, day and type) */
  duplicate?: boolean;
}

/** Marks entries that match an existing transaction on the same day with the same amount and type. */
export function markDuplicates(entries: ParsedEntry[], existing: Transaction[]): ParsedEntry[] {
  const seen = new Set(existing.map(t => `${t.type}|${Math.round(t.amount * 100)}|${new Date(t.date).toDateString()}`));
  const batch = new Set<string>();
  return entries.map(e => {
    const k = `${e.type}|${Math.round(e.amount * 100)}|${new Date(e.date).toDateString()}`;
    const duplicate = seen.has(k) || batch.has(`${k}|${e.description}`);
    batch.add(`${k}|${e.description}`);
    return { ...e, duplicate };
  });
}

export const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/** Parses the date formats Indian banks use. Returns an ISO string at local noon, or null. */
export function parseBankDate(text: string, now = new Date()): string | null {
  const at = (y: number, m: number, d: number) => {
    if (y < 100) y += 2000;
    if (m < 0 || m > 11 || d < 1 || d > 31) return null;
    const dt = new Date(y, m, d, 12);
    // Bank SMS never describe the future; a "future" date means we guessed dd/mm the wrong way round
    if (dt.getTime() - now.getTime() > 2 * 86_400_000) return null;
    return dt.toISOString();
  };
  let m: RegExpMatchArray | null;
  if ((m = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})/))) return at(+m[1], +m[2] - 1, +m[3]);
  if ((m = text.match(/\b(\d{1,2})[-\s/]?([A-Za-z]{3,4})[-\s/,]*(\d{2,4})\b/)) && MONTHS[m[2].toLowerCase()] !== undefined)
    return at(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  if ((m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/))) return at(+m[3], +m[2] - 1, +m[1]);
  return null;
}

const STOP = new Set(['upi', 'neft', 'imps', 'rtgs', 'ach', 'nach', 'pos', 'ecom', 'dr', 'cr', 'ref', 'txn', 'vpa', 'mob', 'p2a', 'p2m', 'payment', 'transfer', 'to', 'from', 'bank', 'ltd', 'pvt', 'the', 'a/c']);

/** "swiggy@icici" → "Swiggy", "UPI/431223/AMAZON PAY/..." → "Amazon Pay", "RAHUL KUMAR" → "Rahul Kumar" */
export function cleanMerchant(raw: string): string {
  let s = raw.trim();
  if (/@/.test(s)) s = s.split('@')[0].replace(/[._-]?\d+$/, '').replace(/[._]/g, ' ');
  const parts = s.split(/[\/|*]+/).map(p => p.trim()).filter(Boolean);
  const best = parts.find(p => /[a-z]{3,}/i.test(p) && !STOP.has(p.toLowerCase()) && (p.replace(/\D/g, '').length / p.length) < 0.4) || s;
  return best
    .replace(/\b(pvt|private|ltd|limited|india|technologies|retail)\b\.?/gi, '')
    .replace(/[^A-Za-z0-9&' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, c => c.toUpperCase())
    .slice(0, 40) || 'Bank transaction';
}
