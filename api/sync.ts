import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await clientPromise;
    const db = client.db('moneymate');
    const ledgersCol = db.collection('user_ledgers');
    const usersCol = db.collection('users');

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // GET: Retrieve only this specific user's financial ledger
    if (req.method === 'GET') {
      const record = await ledgersCol.findOne({ userId });
      if (!record) {
        return res.status(200).json({
          transactions: [],
          budgets: [],
          goals: [],
          friends: [],
          settings: null
        });
      }
      return res.status(200).json({
        transactions: record.transactions || [],
        budgets: record.budgets || [],
        goals: record.goals || [],
        friends: record.friends || [],
        settings: record.settings || null,
        updatedAt: record.updatedAt || null
      });
    }

    // POST: Save or synchronize this specific user's data + profile info
    if (req.method === 'POST') {
      const payload = req.body || {};

      // 1. Save / Update User Profile Record
      if (payload.userInfo) {
        await usersCol.updateOne(
          { userId },
          { 
            $set: {
              userId,
              email: payload.userInfo.email || null,
              name: payload.userInfo.displayName || payload.userInfo.name || 'Anonymous',
              lastActiveAt: new Date().toISOString()
            },
            $setOnInsert: {
              createdAt: new Date().toISOString()
            }
          },
          { upsert: true }
        );
      }

      // 2. Save / Update User's Isolated Ledger Data
      const updateData = {
        userId,
        transactions: payload.transactions || [],
        budgets: payload.budgets || [],
        goals: payload.goals || [],
        friends: payload.friends || [],
        settings: payload.settings || null,
        updatedAt: new Date().toISOString()
      };

      await ledgersCol.updateOne(
        { userId },
        { $set: updateData },
        { upsert: true }
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Synchronized with MongoDB Atlas' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('MongoDB API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
