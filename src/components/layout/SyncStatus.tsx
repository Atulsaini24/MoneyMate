import React from 'react';
import { Cloud, CloudOff, HardDrive, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

/** Where the data lives right now, in plain words. */
export function useSyncLabel() {
  const { isCloudSynced, syncStatus } = useApp();
  if (!isCloudSynced) return { label: 'Saved on this device', icon: HardDrive, tone: 'muted' as const };
  if (syncStatus === 'syncing') return { label: 'Saving…', icon: RefreshCw, tone: 'muted' as const, spin: true };
  if (syncStatus === 'offline') return { label: 'Offline, will retry', icon: CloudOff, tone: 'warning' as const };
  return { label: 'Synced to your account', icon: Cloud, tone: 'positive' as const };
}

export const SyncStatus: React.FC<{ className?: string }> = ({ className }) => {
  const s = useSyncLabel();
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', s.tone === 'warning' ? 'text-mm-warning' : s.tone === 'positive' ? 'text-mm-positive' : 'text-mm-muted', className)}>
      <s.icon size={13} className={'spin' in s && s.spin ? 'animate-spin' : ''} aria-hidden />
      {s.label}
    </span>
  );
};

export const Avatar: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 36, className }) => (
  <span className={cn('inline-flex items-center justify-center rounded-full bg-mm-accent/12 text-mm-accent font-semibold shrink-0 font-display', className)}
    style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden>
    {(name.trim()[0] || 'Y').toUpperCase()}
  </span>
);
