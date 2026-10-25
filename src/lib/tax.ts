/**
 * Indian income-tax estimates for salaried individuals, old vs new regime.
 * Slabs as announced in Union Budget 2025 (FY 2025-26 onward). Surcharge for
 * incomes above ₹50 lakh is not modelled. This is an estimate, not tax advice.
 */
import type { Transaction, TaxSection } from '@/types';

export const SECTIONS: Record<TaxSection, { label: string; cap: number | null; hint: string; oldOnly: boolean }> = {
  '80C': { label: '80C · Investments & fees', cap: 150_000, hint: 'PPF, ELSS, EPF, LIC premium, tuition fees, home-loan principal', oldOnly: true },
  '80D': { label: '80D · Health insurance', cap: 25_000, hint: 'Premiums for you and family (₹50,000 more for senior-citizen parents)', oldOnly: true },
  '80CCD1B': { label: '80CCD(1B) · NPS', cap: 50_000, hint: 'Your own NPS contributions, over and above 80C', oldOnly: true },
  '80E': { label: '80E · Education loan interest', cap: null, hint: 'Interest only, no upper limit', oldOnly: true },
  '80G': { label: '80G · Donations', cap: null, hint: 'Eligible donations (50% or 100% depending on the fund)', oldOnly: true },
  'HRA': { label: 'HRA · Rent paid', cap: null, hint: 'Exemption is worked out from salary, HRA received and rent', oldOnly: true },
  '24B': { label: '24(b) · Home-loan interest', cap: 200_000, hint: 'Interest on a self-occupied home loan', oldOnly: true },
};

const DETECT: [RegExp, TaxSection][] = [
  [/\bnps\b|national pension/i, '80CCD1B'],
  [/\b(ppf|elss|tax ?saver|lic\b|life insurance|sukanya|ssy|ulip|tuition|school fee|epf vol|vpf)\b/i, '80C'],
  [/health insurance|mediclaim|star health|niva bupa|care health|hdfc ergo|icici lombard|preventive health|max bupa/i, '80D'],
  [/education loan/i, '80E'],
  [/donation|charity|pm cares|\bngo\b|cry\b|give ?india|akshaya patra/i, '80G'],
  [/home loan interest|housing loan interest/i, '24B'],
  [/^rent\b|house rent|\brent (paid|for)\b|landlord/i, 'HRA'],
];

/** Guess which deduction a transaction belongs to (expenses only). */
export function detectSection(t: Pick<Transaction, 'type' | 'description' | 'category' | 'notes'>): TaxSection | null {
  if (t.type !== 'expense') return null;
  const text = `${t.description} ${t.notes || ''}`;
  for (const [re, sec] of DETECT) if (re.test(text)) return sec;
  return null;
}

/** Indian financial year label for a date: Apr 2026 – Mar 2027 → "2026-27" */
export function fyOf(d: Date) {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}
export function fyRange(fy: string): [Date, Date] {
  const y = Number(fy.slice(0, 4));
  return [new Date(y, 3, 1), new Date(y + 1, 2, 31, 23, 59, 59)];
}

type Slab = [upTo: number, rate: number];
const NEW_SLABS: Slab[] = [[400_000, 0], [800_000, 0.05], [1_200_000, 0.1], [1_600_000, 0.15], [2_000_000, 0.2], [2_400_000, 0.25], [Infinity, 0.3]];
const OLD_SLABS: Slab[] = [[250_000, 0], [500_000, 0.05], [1_000_000, 0.2], [Infinity, 0.3]];

export function slabTax(income: number, slabs: Slab[]) {
  let tax = 0, prev = 0;
  for (const [upTo, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, upTo) - prev) * rate;
    prev = upTo;
  }
  return tax;
}

export interface TaxInputs {
  grossSalary: number;
  otherIncome?: number;
  /** Claimed amounts per section before caps */
  deductions?: Partial<Record<TaxSection, number>>;
  hra?: { basic: number; hraReceived: number; rentPaid: number; metro: boolean };
}

export function hraExemption(h: NonNullable<TaxInputs['hra']>) {
  return Math.max(0, Math.min(h.hraReceived, h.rentPaid - 0.1 * h.basic, (h.metro ? 0.5 : 0.4) * h.basic));
}

export interface RegimeResult { taxable: number; tax: number; deductions: number; effectiveRate: number }

export function newRegime(i: TaxInputs): RegimeResult {
  const gross = i.grossSalary + (i.otherIncome || 0);
  const std = i.grossSalary > 0 ? 75_000 : 0;
  const taxable = Math.max(0, gross - std);
  let tax = slabTax(taxable, NEW_SLABS);
  if (taxable <= 1_200_000) tax = 0; // 87A rebate up to ₹60,000
  else tax = Math.min(tax, taxable - 1_200_000); // marginal relief just above ₹12 lakh
  tax = Math.round(tax * 1.04); // 4% health & education cess
  return { taxable, tax, deductions: std, effectiveRate: gross ? tax / gross : 0 };
}

export function oldRegime(i: TaxInputs): RegimeResult {
  const gross = i.grossSalary + (i.otherIncome || 0);
  const std = i.grossSalary > 0 ? 50_000 : 0;
  let ded = std;
  for (const [sec, amt] of Object.entries(i.deductions || {}) as [TaxSection, number][]) {
    if (sec === 'HRA') continue;
    const cap = SECTIONS[sec].cap;
    ded += sec === '80G' ? amt * 0.5 : cap === null ? amt : Math.min(amt, cap);
  }
  if (i.hra) ded += hraExemption(i.hra);
  const taxable = Math.max(0, gross - ded);
  let tax = slabTax(taxable, OLD_SLABS);
  if (taxable <= 500_000) tax = 0; // 87A rebate up to ₹12,500
  tax = Math.round(tax * 1.04);
  return { taxable, tax, deductions: ded, effectiveRate: gross ? tax / gross : 0 };
}

export function compareRegimes(i: TaxInputs) {
  const n = newRegime(i), o = oldRegime(i);
  return { newRegime: n, oldRegime: o, better: n.tax <= o.tax ? 'new' as const : 'old' as const, saving: Math.abs(n.tax - o.tax) };
}

/** Totals by section for a financial year, using explicit tags first and auto-detection second. */
export function sectionTotals(txs: Transaction[], fy: string) {
  const [from, to] = fyRange(fy);
  const totals: Partial<Record<TaxSection, number>> = {};
  const items: (Transaction & { section: TaxSection; detected: boolean })[] = [];
  for (const t of txs) {
    const d = new Date(t.date);
    if (d < from || d > to) continue;
    if (t.taxSection === 'none') continue;
    const section = t.taxSection || detectSection(t);
    if (!section) continue;
    totals[section] = (totals[section] || 0) + t.amount;
    items.push({ ...t, section, detected: !t.taxSection });
  }
  return { totals, items };
}
