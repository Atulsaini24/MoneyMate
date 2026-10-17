import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, keyof typeof LucideIcons> = {
  'UtensilsCrossed': 'UtensilsCrossed',
  'ShoppingBag': 'ShoppingBag',
  'Dumbbell': 'Dumbbell',
  'Car': 'Car',
  'Gamepad2': 'Gamepad2',
  'Zap': 'Zap',
  'Heart': 'Heart',
  'GraduationCap': 'GraduationCap',
  'MoreHorizontal': 'MoreHorizontal',
  'Briefcase': 'Briefcase',
  'Laptop': 'Laptop',
  'TrendingUp': 'TrendingUp',
  'Gift': 'Gift',
  'RotateCcw': 'RotateCcw',
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, color = '#D6BC86', size = 20, className = '' }) => {
  const iconName = iconMap[name] || 'Circle';
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Circle;
  
  return (
    <div 
      className={`category-icon ${className}`}
      style={{ backgroundColor: `${color}20` }}
    >
      <IconComponent size={size} color={color} />
    </div>
  );
};
