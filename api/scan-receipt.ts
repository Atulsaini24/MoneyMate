import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRequest, AuthError } from './_auth.js';
import { extractReceipt, ReceiptError } from './_receipt.js';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    await verifyRequest(req.headers.authorization);
    const result = await extractReceipt(req.body?.image, req.body?.mediaType);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof AuthError) return res.status(401).json({ error: error.message });
    if (error instanceof ReceiptError) return res.status(error.status).json({ error: error.message });
    console.error('[api/scan-receipt]', error);
    return res.status(500).json({ error: 'Receipt could not be read. Enter it manually instead.' });
  }
}
