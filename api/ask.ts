import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRequest, AuthError } from './_auth.js';

/**
 * "Ask MoneyMate". A thin, authenticated relay to Claude. The tools below are
 * executed in the user's browser against their own ledger, so the server never
 * needs to read their data and answers are computed, not guessed.
 */
export const TOOLS = [
  {
    name: 'get_overview',
    description: 'Snapshot of the user\'s finances right now: balance, this month\'s income and spending, month-end forecast, safe-to-spend per day, financial health score with factors, budgets with amount spent, savings goals, upcoming bills/subscriptions, net worth, and outstanding IOUs. Call this first for broad questions.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'query_transactions',
    description: 'Find transactions with filters. Returns count, total amount and up to `limit` matching rows (newest first). Use for questions like "how much did I spend on Swiggy since June" or "show my biggest purchases".',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date YYYY-MM-DD (inclusive)' },
        to: { type: 'string', description: 'End date YYYY-MM-DD (inclusive)' },
        type: { type: 'string', enum: ['expense', 'income', 'transfer'] },
        category: { type: 'string', description: 'Exact category name, e.g. "Food & Dining"' },
        search: { type: 'string', description: 'Case-insensitive text matched against description and notes' },
        min_amount: { type: 'number' },
        max_amount: { type: 'number' },
        sort: { type: 'string', enum: ['newest', 'largest'] },
        limit: { type: 'number', description: 'Rows to return, default 15, max 50' },
      },
    },
  },
  {
    name: 'spending_breakdown',
    description: 'Totals grouped by category, month, merchant or weekday for a date range. Use for comparisons and trends.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'YYYY-MM-DD' },
        to: { type: 'string', description: 'YYYY-MM-DD' },
        group_by: { type: 'string', enum: ['category', 'month', 'merchant', 'weekday'] },
        type: { type: 'string', enum: ['expense', 'income'], description: 'Default expense' },
      },
      required: ['group_by'],
    },
  },
];

const system = (ctx: { today?: string; currency?: string; name?: string }) => `You are MoneyMate, a warm, sharp personal-finance assistant inside the MoneyMate app, talking to ${ctx.name || 'the user'}.
Today is ${ctx.today || new Date().toDateString()}. Amounts are in ${ctx.currency || 'INR'}; format rupees Indian-style (₹1,23,456).

Rules:
- Every number you state must come from a tool result. Call tools as many times as needed; never estimate data you could look up.
- Lead with the direct answer in one sentence, then at most a few short supporting points. Use **bold** for key figures. Keep it under 150 words unless asked for detail.
- For "can I afford" questions, use safe-to-spend, upcoming bills and goals, and be honest about trade-offs.
- Give practical, general guidance. Don't recommend specific stocks, funds or insurance products, and mention a professional for tax filing or investment decisions when relevant.
- If data is missing (e.g. no income recorded), say so plainly and suggest what to add.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    await verifyRequest(req.headers.authorization);
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(503).json({ error: 'Ask MoneyMate isn’t set up on this server (ANTHROPIC_API_KEY missing).' });

    const { messages, context } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) return res.status(400).json({ error: 'Invalid conversation.' });
    if (JSON.stringify(messages).length > 300_000) return res.status(413).json({ error: 'Conversation is too long. Start a new chat.' });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-5-5',
        max_tokens: 1200,
        system: system(context || {}),
        tools: TOOLS,
        messages,
      }),
    });
    if (!r.ok) {
      console.error('[api/ask]', r.status, await r.text());
      return res.status(502).json({ error: 'The assistant is unavailable right now. Try again in a moment.' });
    }
    const data = await r.json();
    return res.status(200).json({ content: data.content, stop_reason: data.stop_reason });
  } catch (e: any) {
    if (e instanceof AuthError) return res.status(401).json({ error: e.message });
    console.error('[api/ask]', e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
