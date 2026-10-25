import React, { useEffect, useState } from 'react';
import { Copy, Check, Smartphone, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Sheet, inputCls, btnPrimary, btnGhost } from '@/components/shared/Sheet';
import { upiLink, isValidVpa, qrDataUrl, shareText } from '@/lib/upi';
import { formatCurrency } from '@/lib/utils';
import { haptic } from '@/lib/fx';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 'collect' = they pay you, 'pay' = you pay them */
  direction: 'collect' | 'pay';
  person: string;
  amount: number;
  note: string;
  /** Their UPI ID (for paying them) */
  theirUpi?: string;
  onSaveTheirUpi?: (vpa: string) => void;
  onMarkPaid: () => void;
}

const isMobile = () => /Android|iPhone|iPad/i.test(navigator.userAgent);

export const SettleUpSheet: React.FC<Props> = ({ open, onClose, direction, person, amount, note, theirUpi, onSaveTheirUpi, onMarkPaid }) => {
  const { settings, updateSettings } = useApp();
  const [vpa, setVpa] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const target = direction === 'collect' ? settings.upiId : theirUpi;
  const link = target ? upiLink({ vpa: target, name: direction === 'collect' ? settings.name : person, amount, note }) : '';

  useEffect(() => { setVpa(''); setCopied(false); }, [open]);
  useEffect(() => {
    if (!open || !link) { setQr(null); return; }
    qrDataUrl(link).then(setQr).catch(() => setQr(null));
  }, [open, link]);

  const saveVpa = () => {
    if (!isValidVpa(vpa)) return;
    if (direction === 'collect') updateSettings({ upiId: vpa.trim() }, { silent: true });
    else onSaveTheirUpi?.(vpa.trim());
  };

  const nudge = () => {
    haptic(8);
    const first = person.split(' ')[0];
    shareText(`Hey ${first}! Gentle reminder about ${formatCurrency(amount, { reveal: true })} for ${note}. You can pay me on UPI at ${settings.upiId}.\n\n${link}`);
  };

  return (
    <Sheet open={open} onClose={onClose} title={direction === 'collect' ? `Collect from ${person}` : `Pay ${person}`}
      footer={<button onClick={() => { onMarkPaid(); onClose(); }} className={`${btnGhost} w-full`}>{direction === 'collect' ? `${person.split(' ')[0]} has paid me` : 'I’ve paid'}</button>}>
      <p className="text-center text-sm text-mm-text2">{note}</p>
      <p className="text-center text-4xl font-semibold text-mm-text number-display mt-1 mb-5">{formatCurrency(amount, { reveal: true })}</p>

      {!target ? (
        <div className="space-y-2.5">
          <label className="block text-sm text-mm-text2">
            {direction === 'collect' ? 'Your UPI ID (saved for next time)' : `${person.split(' ')[0]}’s UPI ID`}
            <input className={`${inputCls} mt-1.5`} value={vpa} onChange={e => setVpa(e.target.value)} placeholder="name@okhdfcbank" autoFocus autoCapitalize="none" />
          </label>
          {vpa && !isValidVpa(vpa) && <p className="text-xs text-mm-negative">That doesn’t look like a UPI ID (name@bank).</p>}
          <button onClick={saveVpa} disabled={!isValidVpa(vpa)} className={`${btnPrimary} w-full`}>Continue</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-52 h-52 rounded-2xl bg-white p-2.5 shadow-lg">
            {qr ? <img src={qr} alt={`UPI QR code for ${formatCurrency(amount, { reveal: true })}`} className="w-full h-full" /> : <div className="w-full h-full mm-shimmer rounded-lg" />}
          </div>
          <p className="text-center text-xs text-mm-muted">
            {direction === 'collect' ? `${person.split(' ')[0]} can scan this with any UPI app. The amount is filled in.` : 'Scan with your phone’s UPI app, or tap below on your phone.'}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-mm-text2">
            <span className="font-mono">{target}</span>
            <button onClick={() => { navigator.clipboard?.writeText(target); setCopied(true); haptic(6); }} className="p-1.5 rounded-lg hover:bg-mm-text/5" aria-label="Copy UPI ID">
              {copied ? <Check size={14} className="text-mm-positive" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="grid gap-2">
            {direction === 'pay' && (
              <a href={link} className={`${btnPrimary} flex items-center justify-center gap-2 ${isMobile() ? '' : 'opacity-60 pointer-events-none'}`}>
                <Smartphone size={16} /> {isMobile() ? 'Open UPI app' : 'Open on your phone to pay'}
              </a>
            )}
            {direction === 'collect' && (
              <button onClick={nudge} className={`${btnPrimary} flex items-center justify-center gap-2`}><MessageCircle size={16} /> Send a friendly nudge</button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
};
