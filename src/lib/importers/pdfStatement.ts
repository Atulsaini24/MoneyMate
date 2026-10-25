/**
 * Bank statement PDFs. Text is pulled out with pdf.js (loaded only when needed),
 * rebuilt into lines, then rows are read as: date … narration … amount … balance.
 * Debit vs credit comes from how the running balance moves, which is far more
 * reliable than guessing which column an amount sat in.
 */
import type { Transaction } from '@/types';
import { suggestCategory } from '@/lib/autoCategory';
import { cleanMerchant, parseBankDate, type ParsedEntry } from './types';

const LEAD_DATE = /^(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
const MONEY = /(?<![\d.])(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})|\d+\.\d{2})(?:\s*(Cr|Dr|CR|DR))?(?![\d])/g;

const toNum = (s: string) => parseFloat(s.replace(/,/g, ''));

export function parseStatementLines(lines: string[], history: Transaction[] = [], now = new Date()) {
  // 1. Stitch multi-line narrations onto the row that started with a date
  const rows: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (LEAD_DATE.test(line)) rows.push(line);
    else if (rows.length && !/opening balance|closing balance|page \d|statement of account|^total/i.test(line)) rows[rows.length - 1] += ' ' + line;
  }

  const entries: ParsedEntry[] = [];
  let prevBal: number | null = null, skipped = 0;
  for (const row of rows) {
    const dateText = row.match(LEAD_DATE)![1];
    const date = parseBankDate(dateText, now);
    const money = [...row.matchAll(MONEY)].map(m => ({ v: toNum(m[1]), flag: m[2]?.toLowerCase(), i: m.index! }));
    if (/opening balance|b\/f|brought forward/i.test(row) && money.length) { prevBal = money[money.length - 1].v; continue; }
    if (!date || money.length === 0) { skipped++; continue; }

    const bal = money.length >= 2 ? money[money.length - 1] : null;
    const amt = money.length >= 2 ? money[money.length - 2] : money[0];
    let type: 'expense' | 'income' | null = null;
    if (bal && prevBal !== null) {
      if (Math.abs(prevBal - amt.v - bal.v) < 0.02) type = 'expense';
      else if (Math.abs(prevBal + amt.v - bal.v) < 0.02) type = 'income';
    }
    if (!type && amt.flag) type = amt.flag === 'cr' ? 'income' : 'expense';
    if (!type) type = /\b(cr|credit|salary|refund|interest|neft cr|imps cr|by transfer)\b/i.test(row) ? 'income' : 'expense';
    if (bal) prevBal = bal.v;

    const narration = row.slice(dateText.length, money[0].i)
      .replace(/^\s*(\d{1,2}[-/.](?:\d{1,2}|[A-Za-z]{3})[-/.]\d{2,4})\s*/, '') // value date column
      .replace(/\s+\d{6,}\s*$/, '') // cheque/ref numbers
      .trim();
    if (!narration || !amt.v) { skipped++; continue; }
    const isAtm = /\batm\b|cash wdl|nwd/i.test(narration);
    const description = isAtm ? 'ATM withdrawal' : cleanMerchant(narration);
    entries.push({
      key: `pdf-${entries.length}-${amt.v}`, type, amount: amt.v, description, date: date!,
      category: suggestCategory(description, type, history) || suggestCategory(narration, type, history) || 'Others',
      paymentMethod: isAtm ? 'Cash' : /upi/i.test(narration) ? 'UPI' : /pos|card/i.test(narration) ? 'Debit Card' : /neft|imps|rtgs/i.test(narration) ? 'Net Banking' : 'Other',
      raw: row,
    });
  }
  return { entries, skipped, total: rows.length };
}

export class PdfPasswordError extends Error {}

/** Extracts text lines from a PDF file, page by page. */
export async function pdfLines(file: File, password?: string): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), password }).promise;
  } catch (e: any) {
    if (e?.name === 'PasswordException') throw new PdfPasswordError(e.code === 2 ? 'Wrong password' : 'Password needed');
    throw e;
  }
  const out: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items as any[]) {
      if (!it.str?.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3; // items on the same baseline
      (rows.get(y) || rows.set(y, []).get(y)!).push({ x: it.transform[4], s: it.str });
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, items]) => out.push(items.sort((a, b) => a.x - b.x).map(i => i.s).join(' ')));
  }
  return out;
}
