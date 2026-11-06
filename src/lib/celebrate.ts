/**
 * The full-screen "done" moment (like a UPI app after you pay). Anything can
 * call `celebrate()`; <PaymentSuccess /> listens and plays it.
 *
 * Returns false when the screen is turned off in Settings, so callers can fall
 * back to a toast.
 */
import { useEffect, useState } from 'react';

export type CelebrationKind = 'paid' | 'received' | 'transferred' | 'saved' | 'settled';

export interface Celebration {
  id: number;
  kind: CelebrationKind;
  amount: number;
  /** Who or what: "Swiggy", "Goa trip", "Rahul" */
  title: string;
  /** Second line, e.g. "Food & Dining · UPI" */
  detail?: string;
  /** Merchant text for the brand logo */
  merchant?: string;
  /** Category icon/colour when there is no brand */
  icon?: string;
  color?: string;
  /** Goal fully funded, salary landed: adds confetti */
  milestone?: boolean;
}

let enabled = true;
let seq = 0;
const listeners = new Set<(c: Celebration) => void>();

export function setCelebrationsEnabled(on: boolean) { enabled = on; }

export function celebrate(c: Omit<Celebration, 'id'>): boolean {
  if (!enabled || listeners.size === 0) return false;
  const full = { ...c, id: ++seq };
  listeners.forEach(fn => fn(full));
  return true;
}

export function useCelebration() {
  const [current, setCurrent] = useState<Celebration | null>(null);
  useEffect(() => {
    const on = (c: Celebration) => setCurrent(c);
    listeners.add(on);
    return () => { listeners.delete(on); };
  }, []);
  return [current, () => setCurrent(null)] as const;
}
