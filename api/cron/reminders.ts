import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import clientPromise from '../_db.js';
import { detectRecurring, friendRemaining } from '../../src/lib/insights.js';

/**
 * Daily at 09:00 IST (see vercel.json). Sends a push for bills and IOUs due
 * tomorrow. End-to-end encrypted ledgers can't be read here, so they're skipped.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { VITE_VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject } = process.env;
  if (!pub || !priv) return res.status(503).json({ error: 'VAPID keys not configured' });
  webpush.setVapidDetails(subject || 'mailto:hello@moneymate.app', pub, priv);

  const db = (await clientPromise).db('moneymate');
  const subs = await db.collection('push_subscriptions').find({}).toArray();
  const byUser = new Map<string, any[]>();
  for (const s of subs) byUser.set(s.userId, [...(byUser.get(s.userId) || []), s]);

  const now = new Date();
  let sent = 0, removed = 0;
  for (const [userId, list] of byUser) {
    const ledger = await db.collection('user_ledgers').findOne({ userId });
    if (!ledger || ledger.encrypted || ledger.settings?.pushEnabled === false) continue;

    const notes: { title: string; body: string; url: string }[] = [];
    for (const r of detectRecurring(ledger.transactions || [], now).filter(r => r.daysUntil === 1)) {
      notes.push({ title: `${r.name} is due tomorrow`, body: `Usually ₹${Math.round(r.amount).toLocaleString('en-IN')}. Make sure there’s enough in your account.`, url: '/reports?tab=subscriptions' });
    }
    for (const f of ledger.friends || []) {
      if (!f.dueDate || !friendRemaining(f)) continue;
      const days = Math.round((new Date(f.dueDate).getTime() - now.getTime()) / 86_400_000);
      if (days === 1) notes.push({
        title: f.type === 'i-owe' ? `Pay ${f.name} tomorrow` : `${f.name} owes you, due tomorrow`,
        body: `₹${Math.round(friendRemaining(f)).toLocaleString('en-IN')} outstanding.`, url: '/friends',
      });
    }
    if (!notes.length) continue;
    const payload = notes.length === 1 ? notes[0] : { title: `${notes.length} payments due tomorrow`, body: notes.map(n => n.title).join(' · '), url: '/' };

    for (const s of list) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 60 * 60 * 12 });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) { await db.collection('push_subscriptions').deleteOne({ endpoint: s.endpoint }); removed++; }
        else console.error('[cron/reminders]', e?.statusCode, e?.body);
      }
    }
  }
  return res.status(200).json({ users: byUser.size, sent, removed });
}
