import React from 'react';
import {
  UtensilsCrossed, ShoppingBag, Dumbbell, Car, Gamepad2, Zap, Heart, GraduationCap, MoreHorizontal, Briefcase,
  Laptop, TrendingUp, Gift, RotateCcw, Circle, Smartphone, Plane, House, ShieldCheck, Bike, Camera, Gem, Baby,
  PawPrint, Sofa, Music, Mountain, PiggyBank, Target, HeartPulse, Building2, Wallet, Landmark, Banknote, CreditCard,
  Coins, ChartLine, Vault, Bitcoin, Receipt, ArrowLeftRight, HandCoins, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Named imports only: `import * as` would bundle every Lucide icon.
export const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed, ShoppingBag, Dumbbell, Car, Gamepad2, Zap, Heart, GraduationCap, MoreHorizontal, Briefcase,
  Laptop, TrendingUp, Gift, RotateCcw, Circle, Smartphone, Plane, House, ShieldCheck, Bike, Camera, Gem, Baby,
  PawPrint, Sofa, Music, Mountain, PiggyBank, Target, HeartPulse, Building2, Wallet, Landmark, Banknote, CreditCard,
  Coins, ChartLine, Vault, Bitcoin, Receipt, ArrowLeftRight, HandCoins,
};

const sizes = { sm: { box: 32, icon: 15, r: 'rounded-[10px]' }, md: { box: 40, icon: 18, r: 'rounded-xl' }, lg: { box: 48, icon: 22, r: 'rounded-[14px]' } };

/** A tinted tile with a Lucide icon. `size` may be a preset or a raw icon size (legacy). */
export const CategoryIcon: React.FC<{ name: string; color?: string; size?: number | keyof typeof sizes; className?: string }> = ({ name, color = '#7C8884', size = 'md', className }) => {
  const Icon = ICONS[name] || Circle;
  const preset = typeof size === 'string' ? sizes[size] : { box: size + 20, icon: size, r: 'rounded-xl' };
  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0', preset.r, className)}
      style={{
        width: preset.box, height: preset.box,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
        // Pull the hue towards the text colour so it keeps contrast in both themes
        color: `color-mix(in oklab, ${color} 78%, var(--color-mm-text))`,
      }}
      aria-hidden
    >
      <Icon size={preset.icon} strokeWidth={2} />
    </span>
  );
};
