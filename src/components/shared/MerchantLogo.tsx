import React from 'react';
import { brandFor, isLight, type Brand } from '@/lib/merchants';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

const SIZES = { sm: { box: 32, glyph: 16, r: 'rounded-[10px]', text: 'text-[15px]' }, md: { box: 40, glyph: 20, r: 'rounded-xl', text: 'text-[18px]' }, lg: { box: 56, glyph: 28, r: 'rounded-2xl', text: 'text-[26px]' }, xl: { box: 72, glyph: 36, r: 'rounded-[22px]', text: 'text-[32px]' } };
export type LogoSize = keyof typeof SIZES;

/** A brand tile: the real mark (or monogram) on the brand's own colour. */
export const BrandTile: React.FC<{ brand: Brand; size?: LogoSize; px?: number; className?: string }> = ({ brand, size = 'md', px, className }) => {
  const s = px ? { box: px, glyph: Math.round(px * 0.5), r: '', text: px < 36 ? 'text-[14px]' : 'text-[18px]' } : SIZES[size];
  const fg = isLight(brand.color) ? '#141414' : '#FFFFFF';
  return (
    <span aria-hidden className={cn('relative inline-flex items-center justify-center shrink-0 overflow-hidden', s.r, className)}
      style={{ width: s.box, height: s.box, backgroundColor: brand.color, color: fg,
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.08), inset 0 1px 0 rgb(255 255 255 / 0.18), 0 6px 14px -8px ' + brand.color }}>
      {/* Soft top light so flat brand colours read as a physical tile */}
      <span className="absolute inset-0 bg-[linear-gradient(160deg,rgb(255_255_255/0.22),transparent_55%)]" />
      {brand.path ? (
        <svg viewBox="0 0 24 24" width={s.glyph} height={s.glyph} className="relative" fill="currentColor"><path d={brand.path} /></svg>
      ) : (
        <span className={cn('relative font-display font-bold leading-none', s.text)}>{brand.letter}</span>
      )}
    </span>
  );
};

/**
 * The best picture for a transaction: the merchant's real logo when we know
 * the brand, otherwise the category glyph.
 */
export const MerchantLogo: React.FC<{ description?: string; icon: string; color: string; size?: LogoSize; className?: string }> = ({ description, icon, color, size = 'md', className }) => {
  const brand = brandFor(description);
  if (brand) return <BrandTile brand={brand} size={size} className={className} />;
  const map = { sm: 'sm', md: 'md', lg: 'lg', xl: 'lg' } as const;
  return <CategoryIcon name={icon} color={color} size={map[size]} className={className} />;
};
