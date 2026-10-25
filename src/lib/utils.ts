import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Module-level display config so the ~40 existing formatCurrency() call sites
// follow the user's currency and privacy settings without prop drilling.
// AppContext calls setDisplayConfig() whenever settings change.
const displayConfig = { currency: 'INR', locale: 'en-IN', privacy: false };
const formatterCache = new Map<string, Intl.NumberFormat>();

export function setDisplayConfig(next: Partial<typeof displayConfig>) {
  Object.assign(displayConfig, next);
}

function currencyFormatter(compact: boolean) {
  const key = `${displayConfig.locale}|${displayConfig.currency}|${compact}`;
  let f = formatterCache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(displayConfig.locale, {
        style: 'currency',
        currency: displayConfig.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: compact ? 1 : 0,
        ...(compact ? { notation: 'compact' as const } : {}),
      });
    } catch {
      f = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    }
    formatterCache.set(key, f);
  }
  return f;
}

/** Formats money in the user's currency. Masks the digits when privacy mode is on. */
export function formatCurrency(amount: number, opts: { compact?: boolean; reveal?: boolean } = {}): string {
  const text = currencyFormatter(Boolean(opts.compact)).format(Number.isFinite(amount) ? amount : 0);
  if (displayConfig.privacy && !opts.reveal) return text.replace(/[\d.,]+/, '•••••');
  return text;
}

export function isPrivacyMode() {
  return displayConfig.privacy;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getCurrentMonth(): string {
  return monthKey(new Date());
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function dayKey(d: Date): string {
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 90) return '#D98282'; // Negative financial indicator
  if (percentage >= 75) return '#D9B46F'; // Warning indicator
  return '#D6BC86'; // Champagne gold
}
