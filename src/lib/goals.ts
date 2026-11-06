import type { SavingsGoal } from '@/types';

export const GOAL_ICONS: { icon: string; label: string }[] = [
  { icon: 'ShieldCheck', label: 'Emergency fund' },
  { icon: 'Plane', label: 'Travel' },
  { icon: 'House', label: 'Home' },
  { icon: 'Car', label: 'Car' },
  { icon: 'Bike', label: 'Bike' },
  { icon: 'Smartphone', label: 'Phone' },
  { icon: 'Laptop', label: 'Laptop' },
  { icon: 'Camera', label: 'Camera' },
  { icon: 'Gamepad2', label: 'Gaming' },
  { icon: 'GraduationCap', label: 'Education' },
  { icon: 'Gem', label: 'Wedding' },
  { icon: 'Baby', label: 'Family' },
  { icon: 'HeartPulse', label: 'Health' },
  { icon: 'Gift', label: 'Gift' },
  { icon: 'Sofa', label: 'Furniture' },
  { icon: 'PiggyBank', label: 'Savings' },
];

export const GOAL_COLORS = ['#0B6B63', '#2F7BD8', '#C2478A', '#E0782F', '#8458D4', '#1F8A55', '#C99A06', '#D64545'];

// Goals made in v3 stored a picture path; show a matching icon instead.
const LEGACY: Record<string, string> = {
  iphone: 'Smartphone', 'europe-trip': 'Plane', 'travel-world': 'Plane', 'emergency-fund': 'ShieldCheck', 'new-car': 'Car',
  'dream-house': 'House', education: 'GraduationCap', bike: 'Bike', laptop: 'Laptop', camera: 'Camera', 'gaming-setup': 'Gamepad2',
};

export function goalLook(g: Pick<SavingsGoal, 'icon' | 'color' | 'image' | 'name' | 'id'>) {
  const legacy = g.image?.match(/goals\/([\w-]+)\./)?.[1];
  const icon = g.icon || (legacy && LEGACY[legacy]) || 'Target';
  const seed = [...(g.id || g.name)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { icon, color: g.color || GOAL_COLORS[seed % GOAL_COLORS.length] };
}

/** Monthly amount needed to hit the target by its date, or null without a date. */
export function monthlyNeeded(g: SavingsGoal, now = new Date()): number | null {
  if (!g.targetDate) return null;
  const left = g.targetAmount - g.savedAmount;
  if (left <= 0) return 0;
  const end = new Date(g.targetDate);
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()) + (end.getDate() >= now.getDate() ? 0 : -1);
  return months <= 0 ? left : left / (months + 1);
}
