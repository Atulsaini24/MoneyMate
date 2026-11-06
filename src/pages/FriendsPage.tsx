import React, { useState } from 'react';
import { Plus, HandCoins, QrCode, Check, Pencil, Trash2, ChevronDown, CalendarDays } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SettleUpSheet } from '@/components/shared/SettleUp';
import type { FriendRecord } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { friendRemaining } from '@/lib/insights';
import { Avatar } from '@/components/layout/SyncStatus';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Badge, Button, EmptyState, Field, IconButton, Input, Money, MoneyInput, Page, PageHeader, Progress, Segmented, Stat } from '@/components/ui';

type Filter = 'open' | 'owed-to-me' | 'i-owe' | 'settled';
type Form = { id?: string; name: string; type: FriendRecord['type']; amount: string; description: string; dueDate: string };
const todayKey = () => new Date().toISOString().slice(0, 10);

export const FriendsPage: React.FC = () => {
  const { friends, addFriend, updateFriend, deleteFriend, addPayment, settleFriend, mutate } = useApp();
  const [filter, setFilter] = useState<Filter>('open');
  const [form, setForm] = useState<Form | null>(null);
  const [pay, setPay] = useState<{ record: FriendRecord; amount: string; note: string } | null>(null);
  const [upiFor, setUpiFor] = useState<string | null>(null);
  const [del, setDel] = useState<FriendRecord | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const open = friends.filter(f => f.status !== 'settled');
  const owedToMe = open.filter(f => f.type === 'owed-to-me').reduce((s, f) => s + friendRemaining(f), 0);
  const iOwe = open.filter(f => f.type === 'i-owe').reduce((s, f) => s + friendRemaining(f), 0);
  const net = owedToMe - iOwe;
  const list = friends.filter(f => filter === 'settled' ? f.status === 'settled' : f.status !== 'settled' && (filter === 'open' || f.type === filter))
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const upiFriend = friends.find(f => f.id === upiFor);

  const amt = parseFloat(form?.amount || '');
  const canSave = Boolean(form?.name.trim()) && amt > 0;
  const save = () => {
    if (!form || !canSave) return;
    const data = { name: form.name.trim(), type: form.type, amount: amt, description: form.description.trim() || undefined, dueDate: form.dueDate || undefined };
    if (form.id) updateFriend(form.id, data);
    else addFriend({ ...data, date: todayKey(), status: 'outstanding' });
    setForm(null);
  };
  const payAmt = parseFloat(pay?.amount || '');
  const recordPay = () => {
    if (!pay || !(payAmt > 0)) return;
    addPayment(pay.record.id, { amount: Math.min(payAmt, friendRemaining(pay.record)), date: todayKey(), notes: pay.note.trim() || undefined });
    setPay(null);
  };

  return (
    <Page>
      <PageHeader title="IOUs" subtitle="Money you’ve lent or borrowed. For shared trips and bills, use Groups."
        actions={<Button icon={Plus} onClick={() => setForm({ name: '', type: 'owed-to-me', amount: '', description: '', dueDate: '' })}>Add IOU</Button>} />

      {friends.length === 0 ? (
        <div className="panel">
          <EmptyState icon={HandCoins} title="No IOUs yet" description="Lent a friend money for tickets, or borrowed some for rent? Note it here so nobody has to remember."
            action={<Button icon={Plus} onClick={() => setForm({ name: '', type: 'owed-to-me', amount: '', description: '', dueDate: '' })}>Add IOU</Button>} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Stat label="Owed to you" value={<Money value={owedToMe} />} tone="positive" className="panel p-3.5 sm:p-4" />
            <Stat label="You owe" value={<Money value={iOwe} />} tone={iOwe > 0 ? 'negative' : 'default'} className="panel p-3.5 sm:p-4" />
            <Stat label="Overall" value={<Money value={net} signed />} tone={net < 0 ? 'negative' : 'default'} className="panel p-3.5 sm:p-4" />
          </div>

          <div className="overflow-x-auto scrollbar-none -mx-4 px-4 mb-4">
            <Segmented label="Show" value={filter} onChange={setFilter}
              options={[{ value: 'open', label: `Open (${open.length})` }, { value: 'owed-to-me', label: 'Owed to me' }, { value: 'i-owe', label: 'I owe' }, { value: 'settled', label: 'Settled' }]} />
          </div>

          {list.length === 0 ? (
            <div className="panel"><EmptyState compact icon={HandCoins} title={filter === 'settled' ? 'Nothing settled yet' : 'All clear here'} /></div>
          ) : (
            <ul className="space-y-3">
              {list.map(f => {
                const paid = f.payments.reduce((s, p) => s + p.amount, 0);
                const remaining = friendRemaining(f);
                const overdue = f.status !== 'settled' && f.dueDate && f.dueDate < todayKey();
                const theyOwe = f.type === 'owed-to-me';
                const isOpen = expanded === f.id;
                return (
                  <li key={f.id} className="panel p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <Avatar name={f.name} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="text-[15px] font-semibold text-mm-text font-sans tracking-normal">{f.name}</h3>
                          {f.status === 'settled' ? <Badge tone="positive">Settled</Badge> : overdue ? <Badge tone="warning">Overdue</Badge> : null}
                        </div>
                        <p className="text-[13px] text-mm-muted mt-0.5 truncate">
                          {theyOwe ? 'Owes you' : 'You owe'}{f.description ? ` · ${f.description}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('amount text-lg font-semibold', f.status === 'settled' ? 'text-mm-muted' : theyOwe ? 'text-mm-positive' : 'text-mm-negative')}>{formatCurrency(f.status === 'settled' ? f.amount : remaining)}</p>
                        {f.status !== 'settled' && paid > 0 && <p className="text-xs text-mm-muted tabular">of {formatCurrency(f.amount)}</p>}
                      </div>
                    </div>

                    {f.status !== 'settled' && paid > 0 && <Progress value={(paid / f.amount) * 100} tone="positive" className="mt-3" label="Paid back" />}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[13px] text-mm-muted">
                      <span>Added {formatDate(f.date)}</span>
                      {f.dueDate && <span className={cn('flex items-center gap-1', overdue && 'text-mm-warning font-medium')}><CalendarDays size={13} />Due {formatDate(f.dueDate)}</span>}
                      {f.payments.length > 0 && (
                        <button onClick={() => setExpanded(isOpen ? null : f.id)} aria-expanded={isOpen} className="flex items-center gap-1 font-medium text-mm-text2 hover:text-mm-text">
                          {f.payments.length} payment{f.payments.length === 1 ? '' : 's'} <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <ul className="mt-3 rounded-xl bg-mm-bg2 px-3.5 divide-hairline">
                        {f.payments.map(p => (
                          <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                            <span className="text-mm-text2">{formatDate(p.date)}{p.notes ? ` · ${p.notes}` : ''}</span>
                            <span className="font-semibold text-mm-text tabular">{formatCurrency(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-mm-line/8">
                      {f.status !== 'settled' && (
                        <>
                          <Button size="sm" onClick={() => setPay({ record: f, amount: String(remaining), note: '' })}>{theyOwe ? 'They paid' : 'I paid'}</Button>
                          <Button size="sm" variant="secondary" icon={QrCode} onClick={() => setUpiFor(f.id)} aria-label={theyOwe ? 'Request on UPI' : 'Pay on UPI'}>{theyOwe ? 'Request' : 'Pay'}<span className="hidden sm:inline -ml-1"> on UPI</span></Button>
                        </>
                      )}
                      <div className="flex-1" />
                      {f.status !== 'settled' && <IconButton size="sm" label="Mark as settled" icon={Check} onClick={() => settleFriend(f.id)} />}
                      <IconButton size="sm" label="Edit" icon={Pencil} onClick={() => setForm({ id: f.id, name: f.name, type: f.type, amount: String(f.amount), description: f.description || '', dueDate: f.dueDate || '' })} />
                      <IconButton size="sm" label="Delete" icon={Trash2} tone="danger" onClick={() => setDel(f)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit IOU' : 'New IOU'}
        footer={<Button size="lg" className="w-full" onClick={save} disabled={!canSave}>{form?.id ? 'Save changes' : 'Add IOU'}</Button>}>
        {form && (
          <form className="space-y-4 pt-1" onSubmit={e => { e.preventDefault(); save(); }}>
            <Segmented label="Direction" value={form.type} onChange={v => setForm({ ...form, type: v })} className="w-full"
              options={[{ value: 'owed-to-me', label: 'I lent money', tone: 'positive' }, { value: 'i-owe', label: 'I borrowed', tone: 'negative' }]} />
            <Field label="Who" htmlFor="f-name"><Input id="f-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Their name" autoComplete="off" data-autofocus /></Field>
            <Field label="Amount" htmlFor="f-amt"><MoneyInput id="f-amt" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
            <Field label="What for (optional)" htmlFor="f-desc"><Input id="f-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Concert tickets" /></Field>
            <Field label="Due date (optional)" htmlFor="f-due" hint="You’ll get a reminder on Home when it’s due."><Input id="f-due" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field>
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </form>
        )}
      </Dialog>

      <Dialog open={!!pay} onClose={() => setPay(null)} size="sm" title={pay?.record.type === 'owed-to-me' ? `Payment from ${pay?.record.name}` : `Payment to ${pay?.record.name}`}
        description={pay ? `${formatCurrency(friendRemaining(pay.record))} still open` : undefined}
        footer={<Button size="lg" className="w-full" onClick={recordPay} disabled={!(payAmt > 0)}>Record payment</Button>}>
        {pay && (
          <form className="space-y-4 pt-1" onSubmit={e => { e.preventDefault(); recordPay(); }}>
            <MoneyInput large value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} aria-label="Amount" data-autofocus />
            <Field label="Note (optional)" htmlFor="p-note"><Input id="p-note" value={pay.note} onChange={e => setPay({ ...pay, note: e.target.value })} placeholder="e.g. Paid by UPI" /></Field>
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </form>
        )}
      </Dialog>

      {upiFriend && (
        <SettleUpSheet open onClose={() => setUpiFor(null)} direction={upiFriend.type === 'owed-to-me' ? 'collect' : 'pay'}
          person={upiFriend.name} amount={friendRemaining(upiFriend)} note={upiFriend.description || 'what we split'} theirUpi={upiFriend.upiId}
          onSaveTheirUpi={vpa => mutate(s => ({ ...s, friends: s.friends.map(f => (f.id === upiFriend.id ? { ...f, upiId: vpa } : f)) }))}
          onMarkPaid={() => addPayment(upiFriend.id, { amount: friendRemaining(upiFriend), date: todayKey(), notes: 'Settled on UPI' })} />
      )}

      <ConfirmDialog isOpen={!!del} onClose={() => setDel(null)} variant="danger" confirmText="Delete" title={`Delete the IOU with ${del?.name}?`}
        message="Its payment history is deleted too." onConfirm={() => del && deleteFriend(del.id)} />
    </Page>
  );
};
