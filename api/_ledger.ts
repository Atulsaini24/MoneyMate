import type { Db } from 'mongodb';
import type { VerifiedUser } from './_auth.js';

const MAX_ITEMS = 50_000;
const arr = (v: unknown) => (Array.isArray(v) ? v.slice(0, MAX_ITEMS) : []);

/** Shared by the Vercel function and the Vite dev middleware so both behave identically. */
export async function readLedger(db: Db, user: VerifiedUser) {
  const record = await db.collection('user_ledgers').findOne({ userId: user.uid });
  return {
    exists: Boolean(record),
    transactions: record?.transactions || [],
    budgets: record?.budgets || [],
    goals: record?.goals || [],
    friends: record?.friends || [],
    assets: record?.assets || [],
    groups: record?.groups || [],
    encrypted: record?.encrypted || null,
    settings: record?.settings || null,
    updatedAt: record?.updatedAt || null,
  };
}

export async function writeLedger(db: Db, user: VerifiedUser, payload: any) {
  const now = new Date().toISOString();
  await db.collection('users').updateOne(
    { userId: user.uid },
    {
      $set: { userId: user.uid, email: user.email ?? null, name: user.name || payload?.settings?.name || 'Member', lastActiveAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
  await db.collection('user_ledgers').updateOne(
    { userId: user.uid },
    {
      $set: {
        userId: user.uid,
        transactions: arr(payload?.transactions),
        budgets: arr(payload?.budgets),
        goals: arr(payload?.goals),
        friends: arr(payload?.friends),
        assets: arr(payload?.assets),
        groups: arr(payload?.groups),
        // End-to-end encrypted users send one opaque blob; the server can't read it
        encrypted: payload?.encrypted && typeof payload.encrypted === 'object' ? payload.encrypted : null,
        settings: payload?.settings && typeof payload.settings === 'object' ? payload.settings : null,
        updatedAt: now,
      },
    },
    { upsert: true }
  );
  return now;
}
