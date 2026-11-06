import React, { useMemo, useState } from 'react';
import { Plus, ArrowLeft, Share2, Trash2, X, ArrowRight, Receipt, UsersRound, Handshake } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { balances, settleUp, groupTotal, shareOf, type Settlement } from '@/lib/groups';
import { SettleUpSheet } from '@/components/shared/SettleUp';
import { formatCurrency, formatDate, generateId, cn } from '@/lib/utils';
import { shareText } from '@/lib/upi';
import { confetti, haptic } from '@/lib/fx';
import type { Group } from '@/types';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Button, EmptyState, Field, IconButton, Input, MoneyInput, Page, PageHeader, LinkButton } from '@/components/ui';

const EMOJIS = ['🏖️', '🏠', '🍕', '✈️', '🎉', '🚗', '⛰️', '💼'];
const AVATAR = ['#0B6B63', '#2F7BD8', '#C2478A', '#E0782F', '#8458D4', '#1F8A55', '#C99A06'];

const Avatar: React.FC<{ name: string; i: number; size?: number }> = ({ name, i, size = 30 }) => (
  <span className="rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-mm-card shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.42, background: AVATAR[i % AVATAR.length] }} title={name} aria-hidden>{name[0]?.toUpperCase()}</span>
);

export const GroupsPage: React.FC = () => {
  const { groups, mutate, showToast } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const group = groups.find(g => g.id === openId) || null;
  const update = (id: string, fn: (g: Group) => Group) => mutate(s => ({ ...s, groups: s.groups.map(g => (g.id === id ? fn(g) : g)) }));

  return (
    <Page>
      {group ? (
        <GroupDetail group={group} onBack={() => setOpenId(null)} update={fn => update(group.id, fn)}
          onDelete={() => { mutate(s => ({ ...s, groups: s.groups.filter(g => g.id !== group.id) })); setOpenId(null); showToast('Group deleted', 'info'); }} />
      ) : (
        <>
          <PageHeader title="Groups" subtitle="Trips, flatmates, dinners. Add who paid for what and MoneyMate works out the fewest payments to settle up."
            actions={<Button icon={Plus} onClick={() => setCreating(true)}>New group</Button>} />
          {groups.length === 0 ? (
            <div className="panel">
              <EmptyState icon={UsersRound} title="No groups yet" description="Make one for a trip or your flat, add everyone’s name, and log expenses as they happen."
                action={<Button icon={Plus} onClick={() => setCreating(true)}>Start a group</Button>} />
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {groups.map(g => {
                const mine = balances(g)[g.members[0]] || 0;
                return (
                  <li key={g.id}>
                    <button onClick={() => setOpenId(g.id)} className="w-full panel lift p-5 text-left hover:border-mm-line/20">
                      <div className="flex items-center gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-mm-bg2 flex items-center justify-center text-2xl" aria-hidden>{g.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[17px] font-semibold text-mm-text truncate font-display">{g.name}</p>
                          <p className="text-[13px] text-mm-muted">{g.expenses.filter(e => !e.settlement).length} expenses · {formatCurrency(groupTotal(g))}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">{g.members.map((m, i) => <Avatar key={m} name={m} i={i} />)}</div>
                        <span className={cn('text-sm font-semibold tabular', Math.abs(mine) < 1 ? 'text-mm-muted' : mine > 0 ? 'text-mm-positive' : 'text-mm-negative')}>
                          {Math.abs(mine) < 1 ? 'Settled up' : mine > 0 ? `You get ${formatCurrency(mine)}` : `You owe ${formatCurrency(-mine)}`}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <CreateGroup open={creating} onClose={() => setCreating(false)}
        onCreate={g => { mutate(s => ({ ...s, groups: [g, ...s.groups] })); setCreating(false); setOpenId(g.id); haptic(10); }} />
    </Page>
  );
};

const CreateGroup: React.FC<{ open: boolean; onClose: () => void; onCreate: (g: Group) => void }> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [members, setMembers] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const add = () => {
    const n = draft.trim().replace(/,$/, '');
    if (n && n.toLowerCase() !== 'you' && !members.some(m => m.toLowerCase() === n.toLowerCase())) setMembers([...members, n]);
    setDraft('');
  };
  const pending = draft.trim() ? [draft.trim()] : [];
  const all = [...members, ...pending.filter(p => !members.includes(p))];
  const create = () => {
    onCreate({ id: generateId(), name: name.trim(), emoji, members: ['You', ...all], expenses: [], createdAt: new Date().toISOString() });
    setName(''); setMembers([]); setDraft(''); setEmoji(EMOJIS[0]);
  };
  return (
    <Dialog open={open} onClose={onClose} title="New group"
      footer={<Button size="lg" className="w-full" onClick={create} disabled={!name.trim() || all.length === 0}>Create group</Button>}>
      <div className="space-y-5 pt-1">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Icon">
          {EMOJIS.map(e => <button key={e} type="button" role="radio" aria-checked={emoji === e} onClick={() => setEmoji(e)}
            className={cn('w-11 h-11 rounded-xl text-xl', emoji === e ? 'bg-mm-accent/12 ring-2 ring-mm-accent' : 'bg-mm-bg2')}>{e}</button>)}
        </div>
        <Field label="Group name" htmlFor="gr-name"><Input id="gr-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Goa trip, Flat 302" data-autofocus /></Field>
        <div>
          <p className="text-[13px] font-medium text-mm-text2 mb-2">Who else is in it?</p>
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {members.map((m, i) => (
                <span key={m} className="flex items-center gap-1.5 pl-1 pr-1.5 h-9 rounded-full bg-mm-bg2 text-sm text-mm-text">
                  <Avatar name={m} i={i + 1} size={26} />{m}
                  <button type="button" onClick={() => setMembers(members.filter(x => x !== m))} aria-label={`Remove ${m}`} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-mm-text/10"><X size={14} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} placeholder="Type a name" aria-label="Member name" />
            <Button variant="secondary" onClick={add} disabled={!draft.trim()}>Add</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

const GroupDetail: React.FC<{ group: Group; onBack: () => void; update: (fn: (g: Group) => Group) => void; onDelete: () => void }> = ({ group, onBack, update, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const [settling, setSettling] = useState<Settlement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bal = useMemo(() => balances(group), [group]);
  const plan = useMemo(() => settleUp(group), [group]);
  const you = group.members[0];
  const max = Math.max(1, ...Object.values(bal).map(Math.abs));

  const shareSummary = () => {
    const lines = plan.length ? plan.map(p => `• ${p.from} pays ${p.to} ${formatCurrency(p.amount, { reveal: true })}`) : ['Everyone is settled up.'];
    shareText(`${group.emoji} ${group.name}: ${formatCurrency(groupTotal(group), { reveal: true })} spent\n\nTo settle up:\n${lines.join('\n')}`);
  };
  const record = (p: Settlement) => {
    update(g => ({ ...g, expenses: [...g.expenses, { id: generateId(), description: `${p.from} paid ${p.to}`, amount: p.amount, paidBy: p.from, splitAmong: [p.to], date: new Date().toISOString(), settlement: true }] }));
    if (plan.length === 1) confetti({ count: 100 });
  };

  return (
    <>
      <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} className="-ml-2 mb-4">All groups</Button>
      <header className="flex flex-wrap items-center gap-4 mb-6">
        <span className="w-14 h-14 rounded-2xl bg-mm-card border border-mm-line/10 flex items-center justify-center text-3xl" aria-hidden>{group.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.75rem] sm:text-[2.25rem] leading-tight font-semibold text-mm-text truncate">{group.name}</h1>
          <p className="text-[15px] text-mm-text2">{group.members.length} people · {formatCurrency(groupTotal(group))} spent</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" icon={Share2} onClick={shareSummary} className="flex-1 sm:flex-none">Share</Button>
          <Button icon={Plus} onClick={() => setAdding(true)} className="flex-1 sm:flex-none">Add expense</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 items-start">
        <div className="space-y-4">
          <section className="panel p-5 sm:p-6">
            <h2 className="text-[17px] font-semibold text-mm-text mb-4">Balances</h2>
            <ul className="space-y-3">
              {group.members.map((m, i) => {
                const v = bal[m] || 0;
                return (
                  <li key={m} className="flex items-center gap-3">
                    <Avatar name={m} i={i} />
                    <span className="w-20 text-[15px] text-mm-text truncate">{m}</span>
                    <div className="flex-1 h-2 relative" aria-hidden>
                      <span className="absolute left-1/2 -top-1 -bottom-1 w-px bg-mm-line/20" />
                      <span className={cn('absolute top-0 bottom-0 rounded-full', v >= 0 ? 'bg-mm-positive' : 'bg-mm-negative')}
                        style={{ width: `${(Math.abs(v) / max) * 50}%`, ...(v >= 0 ? { left: '50%' } : { right: '50%' }) }} />
                    </div>
                    <span className={cn('w-24 text-right text-sm font-semibold tabular', Math.abs(v) < 1 ? 'text-mm-muted' : v > 0 ? 'text-mm-positive' : 'text-mm-negative')}>
                      {Math.abs(v) < 1 ? 'Even' : `${v > 0 ? '+' : '−'}${formatCurrency(Math.abs(v))}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="text-[17px] font-semibold text-mm-text">Settle up</h2>
            <p className="text-[13px] text-mm-muted mb-3">{plan.length ? `${plan.length} payment${plan.length === 1 ? '' : 's'} clears everything.` : 'Nobody owes anything.'}</p>
            <ul className="space-y-2">
              {plan.map(p => (
                <li key={`${p.from}-${p.to}`} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-mm-bg2">
                  <span className="text-[15px] text-mm-text">{p.from}</span><ArrowRight size={15} className="text-mm-muted" /><span className="text-[15px] text-mm-text flex-1">{p.to}</span>
                  <span className="text-[15px] font-semibold text-mm-text tabular">{formatCurrency(p.amount)}</span>
                  {(p.from === you || p.to === you)
                    ? <Button size="sm" onClick={() => setSettling(p)}>{p.from === you ? 'Pay' : 'Request'}</Button>
                    : <Button size="sm" variant="secondary" onClick={() => record(p)}>Mark paid</Button>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold text-mm-text mb-1">Activity</h2>
          {group.expenses.length === 0 ? (
            <EmptyState compact icon={Receipt} title="No expenses yet" action={<Button icon={Plus} onClick={() => setAdding(true)}>Add the first one</Button>} />
          ) : (
            <ul className="divide-hairline">
              {[...group.expenses].sort((a, b) => +new Date(b.date) - +new Date(a.date)).map(e => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', e.settlement ? 'bg-mm-positive/10 text-mm-positive' : 'bg-mm-bg2 text-mm-text2')}>
                    {e.settlement ? <Handshake size={18} /> : <Receipt size={18} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium text-mm-text truncate">{e.description}</span>
                    <span className="block text-[13px] text-mm-muted truncate">{e.settlement ? formatDate(e.date) : `${e.paidBy} paid · ${formatDate(e.date)}${e.paidBy !== you && shareOf(e, you) ? ` · your share ${formatCurrency(shareOf(e, you))}` : ''}`}</span>
                  </span>
                  <span className={cn('text-[15px] font-semibold tabular', e.settlement ? 'text-mm-positive' : 'text-mm-text')}>{formatCurrency(e.amount)}</span>
                  <IconButton size="sm" tone="danger" label={`Delete ${e.description}`} icon={Trash2} onClick={() => update(g => ({ ...g, expenses: g.expenses.filter(x => x.id !== e.id) }))} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 pt-4 border-t border-mm-line/8">
            <LinkButton className="text-mm-negative hover:text-mm-negative" onClick={() => setConfirmDelete(true)}>Delete group</LinkButton>
          </div>
        </section>
      </div>

      <AddExpense open={adding} onClose={() => setAdding(false)} group={group}
        onAdd={e => { update(g => ({ ...g, expenses: [...g.expenses, e] })); setAdding(false); haptic(10); }} />

      {settling && (
        <SettleUpSheet open onClose={() => setSettling(null)} direction={settling.from === you ? 'pay' : 'collect'}
          person={settling.from === you ? settling.to : settling.from} amount={settling.amount} note={group.name}
          theirUpi={group.upi?.[settling.to]}
          onSaveTheirUpi={vpa => update(g => ({ ...g, upi: { ...(g.upi || {}), [settling.to]: vpa } }))}
          onMarkPaid={() => record(settling)} />
      )}

      <ConfirmDialog isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} variant="danger" confirmText="Delete group"
        title={`Delete “${group.name}”?`} message="All its expenses and balances are deleted. This can’t be undone." onConfirm={onDelete} />
    </>
  );
};

const AddExpense: React.FC<{ open: boolean; onClose: () => void; group: Group; onAdd: (e: Group['expenses'][number]) => void }> = ({ open, onClose, group, onAdd }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]);
  const [among, setAmong] = useState<string[]>(group.members);
  const amt = parseFloat(amount) || 0;
  const submit = () => {
    if (!desc.trim() || amt <= 0 || !among.length) return;
    onAdd({ id: generateId(), description: desc.trim(), amount: amt, paidBy, splitAmong: among, date: new Date().toISOString() });
    setDesc(''); setAmount(''); setPaidBy(group.members[0]); setAmong(group.members);
  };
  const pill = (on: boolean) => cn('flex items-center gap-1.5 pl-1 pr-3 h-9 rounded-full border text-sm transition-colors', on ? 'border-mm-accent bg-mm-accent/[0.08] text-mm-text font-medium' : 'border-mm-line/12 text-mm-text2');
  return (
    <Dialog open={open} onClose={onClose} title="Add expense"
      footer={<Button size="lg" className="w-full" onClick={submit} disabled={!desc.trim() || amt <= 0 || among.length === 0}>
        Add{amt > 0 && among.length ? ` · ${formatCurrency(amt / among.length, { reveal: true })} each` : ''}
      </Button>}>
      <form className="space-y-5 pt-1" onSubmit={e => { e.preventDefault(); submit(); }}>
        <MoneyInput large value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" aria-label="Amount" data-autofocus />
        <Field label="What was it?" htmlFor="ge-desc"><Input id="ge-desc" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Dinner, cab to airport" /></Field>
        <div>
          <p className="text-[13px] font-medium text-mm-text2 mb-2">Paid by</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Paid by">
            {group.members.map((m, i) => <button key={m} type="button" role="radio" aria-checked={paidBy === m} onClick={() => setPaidBy(m)} className={pill(paidBy === m)}><Avatar name={m} i={i} size={26} />{m}</button>)}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-[13px] font-medium text-mm-text2">Split equally between</p>
            <LinkButton onClick={() => setAmong(among.length === group.members.length ? [] : group.members)}>{among.length === group.members.length ? 'Clear' : 'Everyone'}</LinkButton>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {group.members.map((m, i) => {
              const on = among.includes(m);
              return <button key={m} type="button" role="checkbox" aria-checked={on} onClick={() => setAmong(on ? among.filter(x => x !== m) : [...among, m])} className={pill(on)}><Avatar name={m} i={i} size={26} />{m}</button>;
            })}
          </div>
        </div>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Dialog>
  );
};
