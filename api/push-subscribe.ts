import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './_db.js';
import { verifyRequest, AuthError } from './_auth.js';

/** Stores (POST) or removes (DELETE) a browser push subscription for the signed-in user. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await verifyRequest(req.headers.authorization);
    const col = (await clientPromise).db('moneymate').collection('push_subscriptions');
    const sub = req.body?.subscription;
    if (!sub?.endpoint || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint)) return res.status(400).json({ error: 'Invalid subscription.' });

    if (req.method === 'POST') {
      await col.updateOne(
        { endpoint: sub.endpoint },
        { $set: { userId: user.uid, endpoint: sub.endpoint, keys: sub.keys, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await col.deleteOne({ endpoint: sub.endpoint, userId: user.uid });
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error('[api/push-subscribe]', e);
    return res.status(500).json({ error: 'Could not save notification settings.' });
  }
}
