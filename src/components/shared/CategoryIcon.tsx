import React from 'react';
import {
  UtensilsCrossed, ShoppingBag, Dumbbell, Car, Gamepad2, Zap, Heart, GraduationCap,
  MoreHorizontal, Briefcase, Laptop, TrendingUp, Gift, RotateCcw, Circle, type LucideIcon,
} from 'lucide-react';

// Named imports only: `import * as` bundled all ~1,600 Lucide icons (~600 KB).
const ICONS: Record<string, LucideIcon> = {
  UtensilsCrossed, ShoppingBag, Dumbbell, Car, Gamepad2, Zap, Heart, GraduationCap,
  MoreHorizontal, Briefcase, Laptop, TrendingUp, Gift, RotateCcw,
};

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, color = '#D6BC86', size = 20, className = '' }) => {
  const Icon = ICONS[name] || Circle;
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-xl ${className}`}
      style={{
        backgroundColor: `${color}20`,
        // Pale golds vanish on white; pulling them toward the text colour keeps contrast in both themes
        color: `color-mix(in oklab, ${color} 72%, var(--color-mm-text))`,
        width: size + 18,
        height: size + 18,
      }}
      aria-hidden
    >
      <Icon size={size} color="currentColor" strokeWidth={1.9} />
    </span>
  );
};
