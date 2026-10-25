import { authedJson } from '@/lib/api';

const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && Boolean(key);

const urlB64 = (s: string) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob((s + pad).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
};

export async function enablePush(): Promise<string | null> {
  if (!pushSupported()) return 'Notifications aren’t available here. On iPhone, add MoneyMate to your Home Screen first.';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'Notifications are blocked. Allow them in your browser settings.';
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(key!) }));
  await authedJson('/api/push-subscribe', { subscription: sub.toJSON() });
  return null;
}

export async function disablePush() {
  if (!('serviceWorker' in navigator)) return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (!sub) return;
  await authedJson('/api/push-subscribe', { subscription: sub.toJSON() }, 'DELETE').catch(() => {});
  await sub.unsubscribe();
}
