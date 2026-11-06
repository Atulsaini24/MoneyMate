import {
  House, ArrowLeftRight, PiggyBank, ChartColumn, Target, Landmark, ReceiptIndianRupee,
  HandCoins, UsersRound, Sparkles, Download, Settings, type LucideIcon,
} from 'lucide-react';

export interface NavItem { to: string; label: string; icon: LucideIcon; description: string; ai?: boolean }
export interface NavGroup { title: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Money',
    items: [
      { to: '/', label: 'Home', icon: House, description: 'Today at a glance' },
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, description: 'Everything in and out' },
      { to: '/budgets', label: 'Budgets', icon: PiggyBank, description: 'Monthly limits by category' },
      { to: '/reports', label: 'Analytics', icon: ChartColumn, description: 'Trends, calendar and bills' },
    ],
  },
  {
    title: 'Plan',
    items: [
      { to: '/goals', label: 'Goals', icon: Target, description: 'What you’re saving for' },
      { to: '/wealth', label: 'Net worth', icon: Landmark, description: 'Accounts, investments, loans' },
      { to: '/tax', label: 'Tax planner', icon: ReceiptIndianRupee, description: 'Old vs new regime' },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/friends', label: 'IOUs', icon: HandCoins, description: 'Money lent and borrowed' },
      { to: '/groups', label: 'Groups', icon: UsersRound, description: 'Split trips and bills' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { to: '/ask', label: 'Ask MoneyMate', icon: Sparkles, description: 'Questions about your money', ai: true },
      { to: '/import', label: 'Import', icon: Download, description: 'Bank SMS and statements' },
      { to: '/settings', label: 'Settings', icon: Settings, description: 'Account, look and data' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

export const isActive = (pathname: string, to: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`));

export const titleFor = (pathname: string) => NAV_ITEMS.find(i => isActive(pathname, i.to))?.label || 'MoneyMate';
