import type { UserSettings } from '@/types';

/** Settings for a brand-new account. Nothing here is sample data. */
export const defaultSettings: UserSettings = {
  name: '',
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  budgetStartDay: 1,
  theme: 'system',
  reducedMotion: false,
  notifications: true,
  privacyMode: false,
  accent: 'peacock',
};

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian rupee' },
  { code: 'USD', symbol: '$', name: 'US dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore dollar' },
] as const;
