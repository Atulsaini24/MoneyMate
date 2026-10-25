import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './_db.js';
import { verifyRequest, AuthError } from './_auth.js';
import { readLedger, writeLedger } from './_ledger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Same-origin only: the app and API share a domain on Vercel, so no CORS headers are sent.
  try {
    const user = await verifyRequest(req.headers.authorization);
    const db = (await clientPromise).db('moneymate');

    if (req.method === 'GET') {
      return res.status(200).json(await readLedger(db, user));
    }
    if (req.method === 'POST') {
      const updatedAt = await writeLedger(db, user, req.body || {});
      return res.status(200).json({ success: true, updatedAt });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    if (error instanceof AuthError) return res.status(401).json({ error: error.message });
    console.error('[api/sync]', error);
    return res.status(500).json({ error: 'Could not reach the database. Try again in a moment.' });
  }
}
