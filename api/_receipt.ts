/**
 * Reads a receipt photo with Claude's vision model and returns structured fields
 * the add-transaction sheet can prefill. Requires ANTHROPIC_API_KEY on the server.
 */
export class ReceiptError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const CATEGORIES = [
  'Food & Dining', 'Shopping', 'Gym & Fitness', 'Transport', 'Entertainment',
  'Bills & Utilities', 'Health', 'Education', 'Others',
];
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ReceiptResult {
  merchant: string;
  amount: number;
  date: string | null;
  category: string;
  paymentMethod: string | null;
  items: { name: string; amount: number }[];
}

export async function extractReceipt(image: unknown, mediaType: unknown): Promise<ReceiptResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ReceiptError('Receipt scanning is not set up on this server (ANTHROPIC_API_KEY missing).', 503);
  if (typeof image !== 'string' || image.length < 100) throw new ReceiptError('No image was uploaded.');
  if (typeof mediaType !== 'string' || !MEDIA_TYPES.includes(mediaType)) throw new ReceiptError('Use a JPG, PNG or WebP photo.');
  if (image.length > 7_000_000) throw new ReceiptError('That photo is too large. Try a smaller one.');

  const prompt = `Read this receipt and reply with ONLY a JSON object, no prose, no code fences:
{"merchant": string, "amount": number (the final total paid), "date": "YYYY-MM-DD" or null,
 "category": one of ${JSON.stringify(CATEGORIES)},
 "paymentMethod": one of ["Cash","UPI","Credit Card","Debit Card","Net Banking","Wallet"] or null,
 "items": [{"name": string, "amount": number}] (at most 8, the largest lines)}
If the image is not a receipt or bill, reply {"error": "not_a_receipt"}.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });

  if (!response.ok) {
    console.error('[receipt] Anthropic API', response.status, await response.text());
    throw new ReceiptError('The scanning service is unavailable right now. Enter it manually instead.', 502);
  }

  const data = await response.json();
  const text: string = (data.content || []).map((b: any) => (b.type === 'text' ? b.text : '')).join('');
  let parsed: any;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    throw new ReceiptError('Could not read that receipt. Try a sharper, well-lit photo.', 422);
  }
  if (parsed.error) throw new ReceiptError("That doesn't look like a receipt. Try another photo.", 422);

  const amount = Number(parsed.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new ReceiptError('No total was found on that receipt.', 422);

  return {
    merchant: String(parsed.merchant || 'Receipt').slice(0, 80),
    amount: Math.round(amount * 100) / 100,
    date: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
    category: CATEGORIES.includes(parsed.category) ? parsed.category : 'Others',
    paymentMethod: typeof parsed.paymentMethod === 'string' ? parsed.paymentMethod : null,
    items: Array.isArray(parsed.items)
      ? parsed.items.slice(0, 8).map((i: any) => ({ name: String(i.name).slice(0, 60), amount: Number(i.amount) || 0 }))
      : [],
  };
}
