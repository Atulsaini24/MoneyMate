/**
 * Imports bank statement CSV exports. Column names differ by bank, so the
 * header row is detected by meaning (date / narration / debit / credit / amount).
 */
import type { Transaction } from '@/types';
import { suggestCategory } from '@/lib/autoCategory';
import { cleanMerchant, parseBankDate, type ParsedEntry } from './types';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  const delim = (text.split('\n')[0].match(/\t/g)?.length || 0) > (text.split('\n')[0].match(/,/g)?.length || 0) ? '\t' : ',';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell.trim()); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some(c => c)) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some(c => c)) rows.push(row);
  return rows;
}

const has = (h: string, ...words: string[]) => words.some(w => h.includes(w));

interface Columns { date: number; desc: number; debit: number; credit: number; amount: number; drcr: number }

function detectColumns(header: string[]): Columns | null {
  const h = header.map(x => x.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim());
  const find = (pred: (x: string) => boolean) => h.findIndex(pred);
  const cols: Columns = {
    date: find(x => has(x, 'date') && !has(x, 'value date', 'cheque')) ,
    desc: find(x => has(x, 'narration', 'description', 'particular', 'remarks', 'details', 'transaction remarks')),
    debit: find(x => has(x, 'debit', 'withdrawal', 'dr amount', 'paid out')),
    credit: find(x => has(x, 'credit', 'deposit', 'cr amount', 'paid in')),
    amount: find(x => x === 'amount' || x === 'amount inr' || x === 'transaction amount'),
    drcr: find(x => x === 'dr cr' || x === 'type' || x === 'cr dr' || x === 'debit credit'),
  };
  if (cols.date < 0) cols.date = find(x => has(x, 'date'));
  if (cols.date < 0 || cols.desc < 0) return null;
  if (cols.debit < 0 && cols.credit < 0 && cols.amount < 0) return null;
  return cols;
}

const num = (s: string | undefined) => {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export function parseStatement(text: string, history: Transaction[] = [], now = new Date()) {
  const rows = parseCsv(text);
  let headerIdx = -1, cols: Columns | null = null;
  // Banks put account details above the table; look for the header in the first 40 rows
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    cols = detectColumns(rows[i]);
    if (cols) { headerIdx = i; break; }
  }
  if (!cols) {
    return { entries: [] as ParsedEntry[], skipped: rows.length, total: rows.length,
      error: 'Couldn’t find Date, Description and Amount columns. Export the statement as CSV from your bank’s website.' };
  }

  const entries: ParsedEntry[] = [];
  let skipped = 0;
  for (const r of rows.slice(headerIdx + 1)) {
    const date = parseBankDate(r[cols.date] || '', now);
    const narration = r[cols.desc] || '';
    let amount = 0, type: 'expense' | 'income' = 'expense';
    if (cols.debit >= 0 || cols.credit >= 0) {
      const dr = num(r[cols.debit]), cr = num(r[cols.credit]);
      if (dr > 0) { amount = dr; type = 'expense'; } else if (cr > 0) { amount = cr; type = 'income'; }
    } else {
      const v = num(r[cols.amount]);
      const flag = (r[cols.drcr] || '').toLowerCase();
      amount = Math.abs(v);
      type = flag.startsWith('c') || (!flag && v > 0 && /credit|salary|refund/i.test(narration)) ? 'income' : flag.startsWith('d') || v < 0 ? 'expense' : 'expense';
    }
    if (!date || !amount || !narration) { skipped++; continue; }
    const isAtm = /\batm\b|cash wdl|nwd/i.test(narration);
    const description = isAtm ? 'ATM withdrawal' : cleanMerchant(narration);
    entries.push({
      key: `${date}|${amount}|${description}|${entries.length}`,
      type, amount, description, date,
      category: suggestCategory(description, type, history) || suggestCategory(narration, type, history) || 'Others',
      paymentMethod: isAtm ? 'Cash' : /upi/i.test(narration) ? 'UPI' : /pos|card/i.test(narration) ? 'Debit Card' : /neft|imps|rtgs/i.test(narration) ? 'Net Banking' : 'Other',
      raw: narration,
    });
  }
  return { entries, skipped, total: rows.length - headerIdx - 1, error: undefined as string | undefined };
}
