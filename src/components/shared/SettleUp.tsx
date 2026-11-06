import React, { useEffect, useState } from 'react';
import { Copy, Check, Smartphone, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Dialog } from '@/components/ui/Dialog';
import { Button, Field, Input, IconButton, buttonClass } from '@/components/ui';
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
    shareText(`Hey ${person.split(' ')[0]}! Gentle reminder about ${formatCurrency(amount, { reveal: true })} for ${note}. You can pay me on UPI at ${settings.upiId}.\n\n${link}`);
  };

  const first = person.split(' ')[0];
  return (
    <Dialog open={open} onClose={onClose} title={direction === 'collect' ? `Collect from ${person}` : `Pay ${person}`} size="sm"
      footer={<Button variant="secondary" size="lg" className="w-full" onClick={() => { onMarkPaid(); onClose(); }}>{direction === 'collect' ? `${first} has paid me` : 'I’ve paid'}</Button>}>
      <div className="text-center pt-1">
        <p className="text-sm text-mm-text2">{note}</p>
        <p className="amount text-4xl font-semibold text-mm-text mt-1 mb-5">{formatCurrency(amount, { reveal: true })}</p>
      </div>
      {!target ? (
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); saveVpa(); }}>
          <Field label={direction === 'collect' ? 'Your UPI ID (saved for next time)' : `${first}’s UPI ID`} htmlFor="upi-vpa"
            error={vpa && !isValidVpa(vpa) ? 'That doesn’t look like a UPI ID (name@bank)' : undefined}>
            <Input id="upi-vpa" value={vpa} onChange={e => setVpa(e.target.value)} placeholder="name@okhdfcbank" autoCapitalize="none" autoComplete="off" data-autofocus />
          </Field>
          <Button type="submit" className="w-full" disabled={!isValidVpa(vpa)}>Continue</Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-52 h-52 rounded-2xl bg-white p-2.5 border border-mm-line/10">
            {qr ? <img src={qr} alt={`UPI QR code for ${formatCurrency(amount, { reveal: true })}`} className="w-full h-full" /> : <div className="w-full h-full mm-shimmer rounded-lg" />}
          </div>
          <p className="text-center text-[13px] text-mm-muted">
            {direction === 'collect' ? `${first} can scan this with any UPI app. The amount is filled in.` : 'Scan with your phone’s UPI app, or tap below on your phone.'}
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-mm-text2">
            <span className="font-medium">{target}</span>
            <IconButton size="sm" label={copied ? 'Copied' : 'Copy UPI ID'} icon={copied ? Check : Copy} onClick={() => { navigator.clipboard?.writeText(target); setCopied(true); haptic(6); }} />
          </div>
          {direction === 'pay' && (
            isMobile()
              ? <a href={link} className={buttonClass('primary', 'lg', 'w-full')}><Smartphone size={17} /> Open UPI app</a>
              : <p className="text-center text-[13px] text-mm-muted">Open MoneyMate on your phone to pay straight from a UPI app.</p>
          )}
          {direction === 'collect' && <Button size="lg" icon={MessageCircle} className="w-full" onClick={nudge}>Send a reminder</Button>}
        </div>
      )}
    </Dialog>
  );
};
