import type { MonthRecap } from '@/lib/recap';
import { formatCurrency } from '@/lib/utils';

const W = 1080, H = 1350;
const SERIF = `'Playfair Display', Georgia, serif`;
const SANS = `Inter, -apple-system, 'Segoe UI', sans-serif`;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws the shareable recap image. Amounts are left out unless asked for. */
export async function renderShareCard(r: MonthRecap, { withAmounts }: { withAmounts: boolean }): Promise<Blob> {
  await document.fonts?.ready;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  const money = (n: number) => formatCurrency(n, { reveal: true });

  // Background: obsidian with warm light
  ctx.fillStyle = '#0B0B0D';
  ctx.fillRect(0, 0, W, H);
  const glow = (x: number, y: number, rad: number, col: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(11,11,13,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  glow(180, 120, 760, 'rgba(214,188,134,0.28)');
  glow(980, 1250, 700, 'rgba(131,201,165,0.12)');

  // Hairline frame
  ctx.strokeStyle = 'rgba(214,188,134,0.35)'; ctx.lineWidth = 2;
  roundRect(ctx, 40, 40, W - 80, H - 80, 44); ctx.stroke();

  // Monogram + wordmark
  ctx.save(); ctx.translate(100, 100);
  ctx.fillStyle = '#17171B'; roundRect(ctx, 0, 0, 72, 72, 18); ctx.fill();
  ctx.strokeStyle = '#D6BC86'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(16, 54); ctx.lineTo(16, 22); ctx.lineTo(36, 42); ctx.lineTo(56, 22); ctx.lineTo(56, 54); ctx.stroke();
  ctx.fillStyle = '#E9D8AF'; ctx.beginPath(); ctx.arc(36, 15, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#F5F1E8'; ctx.font = `700 34px ${SANS}`; ctx.fillText('MoneyMate', 192, 148);

  // Title
  ctx.fillStyle = '#B6B0A5'; ctx.font = `400 36px ${SANS}`;
  ctx.fillText(`My ${r.label}`, 100, 285);
  ctx.font = `600 ${r.persona.title.length > 14 ? 92 : 110}px ${SERIF}`;
  const tg = ctx.createLinearGradient(100, 0, 900, 0);
  tg.addColorStop(0, '#E9D8AF'); tg.addColorStop(0.5, '#D6BC86'); tg.addColorStop(1, '#F5E7C4');
  ctx.fillStyle = tg;
  ctx.fillText(r.persona.title, 100, 410);
  ctx.font = `120px ${SANS}`;
  ctx.fillText(r.persona.emoji, W - 250, 420);
  ctx.fillStyle = '#B6B0A5'; ctx.font = `400 32px ${SANS}`;
  ctx.fillText(r.persona.line.length > 52 ? r.persona.line.slice(0, 50) + '…' : r.persona.line, 100, 470);

  // Stat tiles
  const tiles: [string, string][] = [
    ['Savings rate', `${Math.max(0, Math.round(r.savingsRate * 100))}%`],
    ['No-spend days', String(r.noSpendDays)],
    ['Top category', r.topCategory ? r.topCategory.name : '—'],
    [r.spendChange === null ? 'Transactions' : 'vs last month', r.spendChange === null ? String(r.txCount) : `${r.spendChange <= 0 ? '↓' : '↑'} ${Math.abs(Math.round(r.spendChange * 100))}%`],
  ];
  if (withAmounts) tiles.splice(0, 0, ['Spent', money(r.spent)], ['Kept', money(Math.max(0, r.saved))]);
  const cols = 2, tw = (W - 200 - 30) / cols, th = 170;
  tiles.forEach(([label, value], k) => {
    const x = 100 + (k % cols) * (tw + 30), y = 540 + Math.floor(k / cols) * (th + 26);
    ctx.fillStyle = 'rgba(245,241,232,0.05)'; roundRect(ctx, x, y, tw, th, 28); ctx.fill();
    ctx.strokeStyle = 'rgba(214,188,134,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#B6B0A5'; ctx.font = `400 28px ${SANS}`; ctx.fillText(label, x + 32, y + 56);
    ctx.fillStyle = label.startsWith('vs') ? (r.spendChange! <= 0 ? '#83C9A5' : '#E08C8C') : '#F5F1E8';
    let size = 58; ctx.font = `600 ${size}px ${SANS}`;
    while (ctx.measureText(value).width > tw - 64 && size > 30) { size -= 4; ctx.font = `600 ${size}px ${SANS}`; }
    ctx.fillText(value, x + 32, y + 128);
  });

  // Rhythm strip
  const top = withAmounts ? 1150 : 970, max = Math.max(1, ...r.daily);
  const bw = (W - 200) / r.daily.length;
  r.daily.forEach((v, d) => {
    const h = d >= r.daysElapsed ? 6 : v === 0 ? 10 : 14 + 90 * (v / max);
    ctx.fillStyle = d >= r.daysElapsed ? 'rgba(255,255,255,0.08)' : v === 0 ? '#83C9A5' : `rgba(214,188,134,${0.35 + 0.65 * (v / max)})`;
    roundRect(ctx, 100 + d * bw + 3, top + 110 - h, bw - 6, h, 4); ctx.fill();
  });
  if (!withAmounts) {
    ctx.fillStyle = '#77736D'; ctx.font = `400 26px ${SANS}`;
    ctx.fillText('Daily spending, green = no-spend day', 100, top + 160);
  }

  ctx.fillStyle = '#77736D'; ctx.font = `400 26px ${SANS}`;
  ctx.fillText('Made with MoneyMate', 100, H - 90);

  return new Promise(res => c.toBlob(b => res(b!), 'image/png'));
}
