import React, { useState } from 'react';
import { Bell, Lock, Palette, Wallet, ShieldAlert, Check, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { isValidVpa } from '@/lib/upi';
import { enablePush, disablePush, pushSupported } from '@/lib/push';
import { Sheet, inputCls, btnPrimary } from '@/components/shared/Sheet';
import type { UserSettings } from '@/types';

export const ACCENTS: { id: NonNullable<UserSettings['accent']>; name: string; dark: string; light: string }[] = [
  { id: 'gold', name: 'Gold', dark: '#D6BC86', light: '#8F6B2C' },
  { id: 'emerald', name: 'Emerald', dark: '#74D3A4', light: '#1E7A52' },
  { id: 'sapphire', name: 'Sapphire', dark: '#8FB6F2', light: '#2556A8' },
  { id: 'rose', name: 'Rose', dark: '#EE9DB2', light: '#B23A5C' },
  { id: 'amethyst', name: 'Amethyst', dark: '#B9A2F2', light: '#6A46C2' },
];

const Switch: React.FC<{ on: boolean; onChange: () => void; label: string; busy?: boolean }> = ({ on, onChange, label, busy }) => (
  <button role="switch" aria-checked={on} aria-label={label} onClick={onChange} disabled={busy}
    className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${on ? 'bg-mm-gold' : 'bg-mm-elevated border border-mm-line/20'}`}>
    <span className={`block w-5 h-5 rounded-full transition-transform flex items-center justify-center ${on ? 'translate-x-5 bg-mm-bg' : 'bg-mm-muted'}`}>{busy && <Loader2 size={11} className="animate-spin text-mm-gold" />}</span>
  </button>
);

const Row: React.FC<{ icon: React.ElementType; title: string; text: string; children?: React.ReactNode }> = ({ icon: Icon, title, text, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-start gap-3 min-w-0">
      <span className="p-2 rounded-lg bg-mm-gold/15 text-mm-gold shrink-0"><Icon size={17} /></span>
      <div className="min-w-0"><p className="text-sm font-medium text-mm-text">{title}</p><p className="text-xs text-mm-muted">{text}</p></div>
    </div>
    {children}
  </div>
);

export const MoreSettings: React.FC = () => {
  const { settings, updateSettings, enableEncryption, disableEncryption, showToast } = useApp();
  const { user } = useAuth();
  const [upi, setUpi] = useState(settings.upiId || '');
  const [pushBusy, setPushBusy] = useState(false);
  const [enc, setEnc] = useState<'on' | 'off' | null>(null);
  const [p1, setP1] = useState(''), [p2, setP2] = useState(''), [ack, setAck] = useState(false), [err, setErr] = useState('');
  const accent = settings.accent || 'gold';
  const light = settings.theme === 'light';

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (settings.pushEnabled) { await disablePush(); updateSettings({ pushEnabled: false }, { silent: true }); }
      else {
        const problem = await enablePush();
        if (problem) showToast(problem, 'error');
        else { updateSettings({ pushEnabled: true }, { silent: true }); showToast('You’ll get a heads-up the day before bills are due'); }
      }
    } catch { showToast('Couldn’t change notifications. Try again.', 'error'); }
    setPushBusy(false);
  };

  const submitEnc = async () => {
    setErr('');
    if (enc === 'on') {
      if (p1.length < 10) return setErr('Use at least 10 characters. A short sentence works well.');
      if (p1 !== p2) return setErr('The passphrases don’t match.');
      if (!ack) return setErr('Please confirm you understand it can’t be recovered.');
      await enableEncryption(p1);
    } else if (!(await disableEncryption(p1))) return setErr('That passphrase is wrong.');
    setEnc(null); setP1(''); setP2(''); setAck(false);
  };

  return (
    <>
      <div className="glass-card p-6 space-y-6">
        <div>
          <Row icon={Palette} title="Accent colour" text="Changes highlights, buttons and charts across the app." />
          <div className="grid grid-cols-5 gap-2 mt-4">
            {ACCENTS.map(a => (
              <button key={a.id} onClick={() => updateSettings({ accent: a.id }, { silent: true })} aria-pressed={accent === a.id}
                className={`group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${accent === a.id ? 'border-mm-gold bg-mm-gold/8' : 'border-mm-line/12 hover:border-mm-line/30'}`}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${light ? a.light : a.dark}, color-mix(in oklab, ${light ? a.light : a.dark} 55%, #000))` }}>
                  {accent === a.id && <Check size={16} className="text-white drop-shadow" strokeWidth={3} />}
                </span>
                <span className="text-[11px] text-mm-text2">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-5 border-t border-mm-line/10">
          <Row icon={Wallet} title="Your UPI ID" text="Used for payment requests and QR codes in IOUs and Groups." />
          <div className="flex gap-2 mt-3">
            <input className={inputCls} value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@okhdfcbank" autoCapitalize="none" aria-label="UPI ID" />
            <button onClick={() => { updateSettings({ upiId: upi.trim() }); }} disabled={!isValidVpa(upi) || upi.trim() === settings.upiId} className={btnPrimary}>Save</button>
          </div>
        </div>

        <div className="pt-5 border-t border-mm-line/10 space-y-5">
          <Row icon={Bell} title="Bill reminders" text={pushSupported() ? 'A notification the day before a bill or IOU is due.' : 'Needs push keys on the server, or Home Screen install on iPhone.'}>
            <Switch on={!!settings.pushEnabled} onChange={togglePush} label="Bill reminders" busy={pushBusy} />
          </Row>
          <Row icon={Wallet} title="Month-end savings sweep" text="Early each month, offer to move last month’s surplus into a goal.">
            <Switch on={settings.sweepEnabled !== false} onChange={() => updateSettings({ sweepEnabled: settings.sweepEnabled === false }, { silent: true })} label="Savings sweep" />
          </Row>
        </div>

        {user && (
          <div className="pt-5 border-t border-mm-line/10">
            <Row icon={Lock} title="End-to-end encryption" text={settings.encryption?.enabled ? 'On. Only your passphrase can unlock your data.' : 'Encrypt your data on this device before it’s synced.'}>
              <Switch on={!!settings.encryption?.enabled} onChange={() => setEnc(settings.encryption?.enabled ? 'off' : 'on')} label="End-to-end encryption" />
            </Row>
          </div>
        )}
      </div>

      <Sheet open={!!enc} onClose={() => setEnc(null)} title={enc === 'on' ? 'Turn on encryption' : 'Turn off encryption'}
        footer={<button onClick={submitEnc} className={`${btnPrimary} w-full`}>{enc === 'on' ? 'Encrypt my data' : 'Turn off'}</button>}>
        <div className="space-y-3">
          {enc === 'on' && (
            <div className="flex gap-2.5 p-3 rounded-xl bg-mm-warning/10 border border-mm-warning/30 text-xs text-mm-text2 leading-relaxed">
              <ShieldAlert size={16} className="text-mm-warning shrink-0" />
              <span>Your passphrase never leaves this device and <b className="text-mm-text">can’t be reset</b>. Lose it and your synced data is gone for good. Bill reminders by notification also stop, because the server can no longer read your bills.</span>
            </div>
          )}
          <input className={inputCls} type="password" autoFocus value={p1} onChange={e => setP1(e.target.value)} placeholder="Passphrase" aria-label="Passphrase" />
          {enc === 'on' && <input className={inputCls} type="password" value={p2} onChange={e => setP2(e.target.value)} placeholder="Type it again" aria-label="Confirm passphrase" />}
          {enc === 'on' && <label className="flex gap-2 text-sm text-mm-text2"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="accent-[var(--color-mm-gold)]" /> I’ve saved my passphrase somewhere safe</label>}
          {err && <p className="text-sm text-mm-negative">{err}</p>}
        </div>
      </Sheet>
    </>
  );
};
