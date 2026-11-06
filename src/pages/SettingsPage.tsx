import React, { useRef, useState } from 'react';
import { Download, Upload, LogOut, LogIn, RefreshCw, Check, ShieldAlert, Trash2, HardDrive } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { CURRENCIES } from '@/lib/defaults';
import { isValidVpa } from '@/lib/upi';
import { enablePush, disablePush, pushSupported } from '@/lib/push';
import { cn } from '@/lib/utils';
import type { UserSettings } from '@/types';
import { Avatar, SyncStatus } from '@/components/layout/SyncStatus';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Button, Field, Input, Page, PageHeader, Segmented, Select, Switch } from '@/components/ui';
import { playSuccess, setSoundEnabled } from '@/lib/sound';

const ACCENTS: { id: NonNullable<UserSettings['accent']>; name: string; light: string; dark: string }[] = [
  { id: 'peacock', name: 'Peacock', light: '#0B6B63', dark: '#4DC0AE' },
  { id: 'gold', name: 'Marigold', light: '#8F5E00', dark: '#F2B847' },
  { id: 'emerald', name: 'Leaf', light: '#1B7547', dark: '#62C995' },
  { id: 'sapphire', name: 'Indigo', light: '#2552A6', dark: '#8DB4F5' },
  { id: 'rose', name: 'Rose', light: '#B0345A', dark: '#F29BB4' },
  { id: 'amethyst', name: 'Plum', light: '#6544B8', dark: '#B9A3F5' },
];

const Section: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-x-8 gap-y-3 py-7 border-t border-mm-line/8 first:border-t-0 first:pt-0">
    <div>
      <h2 className="text-[17px] font-semibold text-mm-text">{title}</h2>
      {description && <p className="text-[13px] text-mm-muted mt-1 leading-relaxed">{description}</p>}
    </div>
    <div className="panel p-5 sm:p-6 space-y-5">{children}</div>
  </section>
);

const Row: React.FC<{ title: string; text?: React.ReactNode; children?: React.ReactNode }> = ({ title, text, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-[15px] font-medium text-mm-text">{title}</p>
      {text && <p className="text-[13px] text-mm-muted mt-0.5 leading-relaxed">{text}</p>}
    </div>
    {children}
  </div>
);

export const SettingsPage: React.FC = () => {
  const app = useApp();
  const { settings, updateSettings, exportData, importData, togglePrivacy, showToast, refreshCloudData, resetData, transactions, enableEncryption, disableEncryption } = app;
  const { user, isConfigured, signOut, exitGuest } = useAuth();
  const [name, setName] = useState(settings.name);
  const [upi, setUpi] = useState(settings.upiId || '');
  const [pushBusy, setPushBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [restore, setRestore] = useState<string | null>(null);
  const [enc, setEnc] = useState<'on' | 'off' | null>(null);
  const [p1, setP1] = useState(''), [p2, setP2] = useState(''), [ack, setAck] = useState(false), [encErr, setEncErr] = useState(''), [encBusy, setEncBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const accent = settings.accent || 'peacock';
  const displayName = settings.name || user?.displayName || 'You';

  const exportJson = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `moneymate-backup-${new Date().toISOString().slice(0, 10)}.json` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Backup downloaded');
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file.text().then(setRestore).catch(() => showToast('Couldn’t read that file', 'error'));
  };

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (settings.pushEnabled) { await disablePush(); updateSettings({ pushEnabled: false }, { silent: true }); }
      else {
        const problem = await enablePush();
        if (problem) showToast(problem, 'error');
        else { updateSettings({ pushEnabled: true }, { silent: true }); showToast('You’ll get a reminder the day before bills are due'); }
      }
    } catch { showToast('Couldn’t change reminders. Try again.', 'error'); }
    setPushBusy(false);
  };

  const submitEnc = async () => {
    setEncErr('');
    if (enc === 'on') {
      if (p1.length < 10) return setEncErr('Use at least 10 characters. A short sentence works well.');
      if (p1 !== p2) return setEncErr('The two passphrases don’t match.');
      if (!ack) return setEncErr('Tick the box to confirm you’ve saved it.');
      setEncBusy(true); await enableEncryption(p1); setEncBusy(false);
    } else {
      setEncBusy(true); const ok = await disableEncryption(p1); setEncBusy(false);
      if (!ok) return setEncErr('That passphrase is wrong.');
    }
    setEnc(null); setP1(''); setP2(''); setAck(false);
  };

  return (
    <Page width="default">
      <PageHeader title="Settings" />

      <Section title="Account" description={user ? 'Your data syncs to your account and is available on every device you sign in on.' : 'Right now everything is stored in this browser only.'}>
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold text-mm-text truncate">{user ? (user.displayName || displayName) : 'On this device'}</p>
            {user?.email && <p className="text-sm text-mm-text2 truncate">{user.email}</p>}
            <SyncStatus className="mt-0.5" />
          </div>
        </div>
        {user ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={RefreshCw} loading={syncing} onClick={async () => { setSyncing(true); await refreshCloudData(); setSyncing(false); }}>Sync now</Button>
            <Button variant="ghost" icon={LogOut} onClick={() => signOut()}>Sign out</Button>
          </div>
        ) : (
          <div className="rounded-xl bg-mm-bg2 p-4 flex gap-3">
            <HardDrive size={18} className="text-mm-text2 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-mm-text2 leading-relaxed">If you clear this browser’s data, it’s gone. {isConfigured ? 'Sign in to back it up and use it on your phone and laptop. What you’ve added here moves to your account.' : 'Export a backup below now and then.'}</p>
              {isConfigured && <Button icon={LogIn} className="mt-3" onClick={exitGuest}>Sign in or create account</Button>}
            </div>
          </div>
        )}
      </Section>

      <Section title="Profile">
        <form className="flex gap-2 items-end" onSubmit={e => { e.preventDefault(); if (name.trim() && name.trim() !== settings.name) updateSettings({ name: name.trim() }); }}>
          <Field label="Your name" htmlFor="s-name" className="flex-1"><Input id="s-name" value={name} onChange={e => setName(e.target.value)} placeholder="What should we call you?" autoComplete="name" /></Field>
          <Button type="submit" variant="secondary" disabled={!name.trim() || name.trim() === settings.name}>Save</Button>
        </form>
      </Section>

      <Section title="Appearance">
        <Row title="Theme">
          <Segmented label="Theme" size="sm" value={settings.theme} onChange={v => updateSettings({ theme: v }, { silent: true })}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Auto' }]} />
        </Row>
        <div>
          <p className="text-[15px] font-medium text-mm-text mb-3">Accent colour</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map(a => (
              <button key={a.id} role="radio" aria-checked={accent === a.id} onClick={() => updateSettings({ accent: a.id }, { silent: true })}
                className={cn('flex flex-col items-center gap-2 py-3 rounded-xl border transition-colors', accent === a.id ? 'border-mm-text/40 bg-mm-bg2' : 'border-mm-line/10 hover:border-mm-line/25')}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${a.light} 50%, ${a.dark} 50%)` }}>
                  {accent === a.id && <Check size={15} strokeWidth={3} className="text-white drop-shadow" />}
                </span>
                <span className="text-[13px] text-mm-text2">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
        <Row title="Hide amounts" text="Masks every balance on screen. Press H anywhere to switch.">
          <Switch checked={Boolean(settings.privacyMode)} onChange={togglePrivacy} label="Hide amounts" />
        </Row>
        <Row title="Payment confirmation" text="A full-screen tick after you save a payment, like a UPI app.">
          <Switch checked={settings.celebrations !== false} onChange={() => updateSettings({ celebrations: settings.celebrations === false }, { silent: true })} label="Payment confirmation" />
        </Row>
        <Row title="Sounds" text="A short chime when money is saved or moved.">
          <Switch checked={settings.sounds !== false} onChange={() => { const on = settings.sounds === false; updateSettings({ sounds: on }, { silent: true }); if (on) { setSoundEnabled(true); playSuccess(); } }} label="Sounds" />
        </Row>
        <Row title="Reduce motion" text="Turns off animations and confetti.">
          <Switch checked={Boolean(settings.reducedMotion)} onChange={() => updateSettings({ reducedMotion: !settings.reducedMotion }, { silent: true })} label="Reduce motion" />
        </Row>
      </Section>

      <Section title="Money" description="Used for amounts, payment requests and QR codes.">
        <Field label="Currency" htmlFor="s-cur" hint="Changes how amounts are shown. Existing numbers aren’t converted.">
          <Select id="s-cur" value={settings.currency} onChange={e => { const c = CURRENCIES.find(x => x.code === e.target.value); if (c) updateSettings({ currency: c.code, currencySymbol: c.symbol }); }}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
          </Select>
        </Field>
        <form className="flex gap-2 items-end" onSubmit={e => { e.preventDefault(); if (isValidVpa(upi)) updateSettings({ upiId: upi.trim() }); }}>
          <Field label="Your UPI ID" htmlFor="s-upi" className="flex-1" error={upi && !isValidVpa(upi) ? 'That doesn’t look like a UPI ID (name@bank)' : undefined}>
            <Input id="s-upi" value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@okhdfcbank" autoCapitalize="none" autoComplete="off" />
          </Field>
          <Button type="submit" variant="secondary" disabled={!isValidVpa(upi) || upi.trim() === settings.upiId}>Save</Button>
        </form>
      </Section>

      <Section title="Reminders">
        <Row title="Bill reminders" text={!user ? 'Needs an account, because reminders are sent from the server.' : pushSupported() ? 'A notification the day before a bill or IOU is due.' : 'Not available in this browser. On iPhone, add MoneyMate to your Home Screen first.'}>
          <Switch checked={Boolean(settings.pushEnabled)} onChange={togglePush} label="Bill reminders" busy={pushBusy} disabled={!user || !pushSupported() || Boolean(settings.encryption?.enabled)} />
        </Row>
        <Row title="Month-end savings nudge" text="In the first days of a month, offer to move last month’s leftover money into a goal.">
          <Switch checked={settings.sweepEnabled !== false} onChange={() => updateSettings({ sweepEnabled: settings.sweepEnabled === false }, { silent: true })} label="Month-end savings nudge" />
        </Row>
      </Section>

      {user && (
        <Section title="Privacy" description="Optional. Your data is encrypted on this device before it’s synced.">
          <Row title="End-to-end encryption" text={settings.encryption?.enabled ? 'On. Only your passphrase can unlock your data.' : 'Off. Data is protected by your account sign-in.'}>
            <Switch checked={Boolean(settings.encryption?.enabled)} onChange={() => setEnc(settings.encryption?.enabled ? 'off' : 'on')} label="End-to-end encryption" />
          </Row>
        </Section>
      )}

      <Section title="Your data" description={`${transactions.length} transaction${transactions.length === 1 ? '' : 's'} recorded.`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="secondary" icon={Download} onClick={exportJson}>Download backup</Button>
          <Button variant="secondary" icon={Upload} onClick={() => fileRef.current?.click()}>Restore from backup</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        </div>
        <p className="text-[13px] text-mm-muted">For a spreadsheet, use Export CSV on the Transactions page.</p>
        <div className="pt-4 border-t border-mm-line/8">
          <Row title="Delete all records" text="Removes every transaction, budget, goal, IOU, account and group. Settings stay.">
            <Button variant="danger" icon={Trash2} onClick={() => setConfirmReset(true)}>Delete</Button>
          </Row>
        </div>
      </Section>

      <Section title="Shortcuts" description="On a computer.">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          {[['Search and commands', '⌘K or Ctrl K'], ['Add expense', 'N'], ['Add income', 'I'], ['Hide amounts', 'H'], ['Search', '/']].map(([l, k]) => (
            <div key={l} className="flex items-center justify-between gap-3">
              <dt className="text-mm-text2">{l}</dt>
              <dd><kbd className="text-xs font-sans font-semibold text-mm-text2 bg-mm-bg2 rounded-md px-2 py-1">{k}</kbd></dd>
            </div>
          ))}
        </dl>
      </Section>

      <p className="text-center text-[13px] text-mm-muted pt-4">MoneyMate 4.1</p>

      <ConfirmDialog isOpen={confirmReset} onClose={() => setConfirmReset(false)} variant="danger" confirmText="Delete everything"
        title="Delete all your records?" message={user ? 'This also deletes them from your account on every device. Download a backup first if you might want them back.' : 'Download a backup first if you might want them back. This can’t be undone.'}
        onConfirm={resetData} />

      <ConfirmDialog isOpen={restore !== null} onClose={() => setRestore(null)} confirmText="Replace with backup"
        title="Restore this backup?" message="Everything currently in MoneyMate is replaced by what’s in the file."
        onConfirm={() => { if (restore && !importData(restore)) showToast('That file isn’t a MoneyMate backup', 'error'); setRestore(null); }} />

      <Dialog open={!!enc} onClose={() => setEnc(null)} title={enc === 'on' ? 'Turn on encryption' : 'Turn off encryption'}
        footer={<Button size="lg" className="w-full" loading={encBusy} onClick={submitEnc}>{enc === 'on' ? 'Encrypt my data' : 'Turn off encryption'}</Button>}>
        <form className="space-y-3 pt-1" onSubmit={e => { e.preventDefault(); submitEnc(); }}>
          {enc === 'on' && (
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-mm-warning/10 text-[13px] text-mm-text2 leading-relaxed">
              <ShieldAlert size={17} className="text-mm-warning shrink-0" />
              <span>Your passphrase never leaves this device and <b className="text-mm-text">can’t be reset</b>. If you lose it, your synced data can’t be recovered. Bill reminders also stop, because the server can no longer read your bills.</span>
            </div>
          )}
          <Field label="Passphrase" htmlFor="e-p1"><Input id="e-p1" type="password" value={p1} onChange={e => setP1(e.target.value)} autoComplete={enc === 'on' ? 'new-password' : 'current-password'} data-autofocus /></Field>
          {enc === 'on' && <Field label="Type it again" htmlFor="e-p2"><Input id="e-p2" type="password" value={p2} onChange={e => setP2(e.target.value)} autoComplete="new-password" /></Field>}
          {enc === 'on' && <label className="flex items-start gap-2.5 text-sm text-mm-text2"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--color-mm-accent)]" />I’ve saved my passphrase somewhere safe</label>}
          {encErr && <p className="text-sm text-mm-negative" role="alert">{encErr}</p>}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Dialog>
    </Page>
  );
};
