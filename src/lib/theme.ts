import { useEffect, useState } from 'react';
import type { UserSettings } from '@/types';

const query = () => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

/** The theme actually on screen: 'system' follows the device and updates live. */
export function useResolvedTheme(theme: UserSettings['theme']): 'light' | 'dark' {
  const [systemDark, setSystemDark] = useState(() => Boolean(query()?.matches));
  useEffect(() => {
    const mq = query();
    if (!mq) return;
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (theme === 'light' || theme === 'dark') return theme;
  return systemDark ? 'dark' : 'light';
}
