/** UPI deep links (open GPay, PhonePe, Paytm…) and share helpers. */
export const isValidVpa = (v: string) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(v.trim());

export function upiLink({ vpa, name, amount, note }: { vpa: string; name?: string; amount?: number; note?: string }) {
  const p = new URLSearchParams({ pa: vpa.trim(), cu: 'INR' });
  if (name) p.set('pn', name.slice(0, 40));
  if (amount && amount > 0) p.set('am', amount.toFixed(2));
  if (note) p.set('tn', note.slice(0, 60));
  // URLSearchParams encodes @ as %40; UPI apps accept both, but many expect a raw @
  return `upi://pay?${p.toString().replace(/%40/g, '@')}`;
}

export const whatsappLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export async function qrDataUrl(text: string, dark = '#0B0B0D', light = '#FFFFFF') {
  const QR = await import('qrcode');
  return QR.toDataURL(text, { margin: 1, width: 320, color: { dark, light }, errorCorrectionLevel: 'M' });
}

/** Native share sheet when available, otherwise WhatsApp. */
export async function shareText(text: string) {
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch { return; }
  }
  window.open(whatsappLink(text), '_blank', 'noopener');
}
