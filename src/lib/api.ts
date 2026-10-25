import { auth } from '@/lib/firebase';
import type { Transaction, Budget, SavingsGoal, FriendRecord, UserSettings, Asset, Group } from '@/types';
import type { EncryptedBlob } from '@/lib/crypto';

export interface UserLedgerData {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  friends: FriendRecord[];
  assets?: Asset[];
  groups?: Group[];
  settings?: UserSettings | null;
  encrypted?: EncryptedBlob | null;
}

export interface CloudLedger extends UserLedgerData {
  exists: boolean;
  updatedAt: string | null;
}

/** fetch() that attaches the signed-in user's Firebase ID token. */
async function authedFetch(path: string, init: RequestInit = {}) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Not signed in');
  return fetch(path, {
    ...init,
    headers: { ...(init.headers || {}), 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
}

async function errorMessage(res: Response, fallback: string) {
  try { return (await res.json()).error || fallback; } catch { return fallback; }
}

export async function authedJson<T = any>(path: string, body?: unknown, method = body ? 'POST' : 'GET'): Promise<T> {
  const res = await authedFetch(path, { method, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(await errorMessage(res, 'Request failed.'));
  return res.json();
}

export const cloud = {
  async fetchLedger(): Promise<CloudLedger | null> {
    try {
      const res = await authedFetch('/api/sync');
      if (!res.ok) return null;
      const d = await res.json();
      return {
        exists: Boolean(d.exists ?? (d.transactions?.length || d.budgets?.length || d.goals?.length || d.friends?.length)),
        transactions: d.transactions || [],
        budgets: d.budgets || [],
        goals: d.goals || [],
        friends: d.friends || [],
        assets: d.assets || [],
        groups: d.groups || [],
        encrypted: d.encrypted || null,
        settings: d.settings || null,
        updatedAt: d.updatedAt || null,
      };
    } catch {
      return null;
    }
  },

  async saveLedger(ledger: UserLedgerData): Promise<boolean> {
    try {
      const res = await authedFetch('/api/sync', { method: 'POST', body: JSON.stringify(ledger) });
      return res.ok;
    } catch {
      return false;
    }
  },

  async scanReceipt(file: File) {
    const { data, mediaType } = await fileToBase64(file);
    const res = await authedFetch('/api/scan-receipt', {
      method: 'POST',
      body: JSON.stringify({ image: data, mediaType }),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Receipt could not be read.'));
    return (await res.json()) as {
      merchant: string; amount: number; date: string | null; category: string;
      paymentMethod: string | null; items: { name: string; amount: number }[];
    };
  },
};

/** Downscales large photos before upload so scans are fast on mobile data. */
async function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('That file is not an image the browser can open.');
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { data: dataUrl.split(',')[1], mediaType: 'image/jpeg' };
}
