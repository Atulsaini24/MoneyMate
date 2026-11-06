import React, { useState } from 'react';
import { ICONS } from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

/**
 * A cover photo that shimmers while it loads, fades in sharp, and falls back
 * to a coloured engraved cover (with the goal's icon) if it can't load.
 */
export const Photo: React.FC<{ src: string | null; alt?: string; color: string; icon: string; className?: string; imgClassName?: string; children?: React.ReactNode }> = ({ src, alt = '', color, icon, className, imgClassName, children }) => {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(src ? 'loading' : 'failed');
  const Icon = ICONS[icon] || ICONS.PiggyBank;
  return (
    <div className={cn('relative overflow-hidden isolate', className)}>
      {state !== 'ready' && (
        <div className={cn('absolute inset-0', state === 'loading' && 'sk')}
          style={state === 'failed' ? { background: `radial-gradient(120% 120% at 85% 10%, color-mix(in oklab, ${color} 70%, white) 0%, ${color} 45%, color-mix(in oklab, ${color} 60%, black) 100%)` } : undefined}>
          {state === 'failed' && (
            <>
              <svg aria-hidden className="absolute inset-0 w-full h-full opacity-[0.16]" preserveAspectRatio="none" viewBox="0 0 200 100">
                {Array.from({ length: 14 }, (_, k) => <path key={k} d={`M0 ${50 + k} Q 50 ${10 + k * 4} 100 ${50 - k} T 200 ${50 + k}`} fill="none" stroke="white" strokeWidth="0.5" />)}
              </svg>
              <Icon aria-hidden className="absolute left-4 top-4 text-white/85 drop-shadow" size={34} strokeWidth={1.6} />
            </>
          )}
        </div>
      )}
      {src && state !== 'failed' && (
        <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false}
          onLoad={() => setState('ready')} onError={() => setState('failed')}
          className={cn('absolute inset-0 w-full h-full object-cover transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)]',
            state === 'ready' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md', imgClassName)} />
      )}
      {children}
    </div>
  );
};
