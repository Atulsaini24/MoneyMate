import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ArrowLeft, Share2, Trash2, X, ArrowRight, Receipt } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { balances, settleUp, groupTotal, shareOf, type Settlement } from '@/lib/groups';
import { Sheet, PageHeader, inputCls, btnPrimary, btnGhost } from '@/components/shared/Sheet';
import { SettleUpSheet } from '@/components/shared/SettleUp';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';
import { shareText } from '@/lib/upi';
import { confetti, haptic } from '@/lib/fx';
import type { Group } from '@/types';

const EMOJIS = ['🏖️', '🏠', '🍕', '✈️', '🎉', '🚗', '⛰️', '💼'];
const AVATAR = ['#D6BC86', '#83C9A5', '#8FB3D9', '#E08C8C', '#B6A3D9', '#E0A88C', '#9CC9C0'];
const Avatar: React.FC<{ name: string; i: number; size?: number }> = ({ name, i, size = 28 }) => (
  <span className="rounded-full flex items-center justify-center font-semibold text-[#0B0B0D] ring-2 ring-mm-card shrink-0"
    style={{ width: size, height: size, fontSize: size * 0.42, background: AVATAR[i % AVATAR.length] }} title={name}>{name[0]?.toUpperCase()}</span>
);

export const GroupsPage: React.FC = () => {
  const { groups, mutate, showToast, settings } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const group = groups.find(g => g.id === openId) || null;

  const update = (id: string, fn: (g: Group) => Group) => mutate(s => ({ ...s, groups: s.groups.map(g => (g.id === id ? fn(g) : g)) }));

  return (
    <div className="min-h-screen pb-32 lg:pb-10 px-4 md:px-6 py-5 md:py-6 max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {group ? (
          <motion.div key="detail" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <GroupDetail group={group} onBack={() => setOpenId(null)} update={fn => update(group.id, fn)}
              onDelete={() => { mutate(s => ({ ...s, groups: s.groups.filter(g => g.id !== group.id) })); setOpenId(null); showToast('Group deleted', 'info'); }} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <PageHeader title="Groups" subtitle="Trips, flatmates and dinners. Add who paid, and MoneyMate works out the fewest payments to settle up."
              action={<button onClick={() => setCreating(true)} className={`${btnPrimary} flex items-center gap-2`}><Plus size={16} /> New group</button>} />
            {groups.length === 0 ? (
              <button onClick={() => setCreating(true)} className="spotlight w-full rounded-[22px] border-2 border-dashed border-mm-line/25 p-12 text-center hover:border-mm-gold/50 transition-colors">
                <span className="text-5xl">🏖️</span>
                <p className="text-base font-medium text-mm-text mt-3">Start your first group</p>
                <p className="text-sm text-mm-muted mt-1">A Goa trip, your flat, Friday dinners…</p>
              </button>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {groups.map((g, k) => {
                  const mine = balances(g)[g.members[0]] || 0;
                  return (
                    <motion.button key={g.id} onClick={() => setOpenId(g.id)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.05 }}
                      whileHover={{ y: -3 }} className="glass-card p-5 text-left">
                      <div className="flex items-center gap-3">
                        <span className="w-12 h-12 rounded-2xl bg-mm-bg2 flex items-center justify-center text-2xl">{g.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-mm-text truncate">{g.name}</p>
                          <p className="text-xs text-mm-muted">{g.expenses.filter(e => !e.settlement).length} expenses · {formatCurrency(groupTotal(g))}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">{g.members.map((m, i) => <Avatar key={m} name={m} i={i} />)}</div>
                        <span className={`text-sm font-medium number-display ${Math.abs(mine) < 1 ? 'text-mm-muted' : mine > 0 ? 'text-mm-positive' : 'text-mm-negative'}`}>
                          {Math.abs(mine) < 1 ? 'All settled' : mine > 0 ? `You get ${formatCurrency(mine)}` : `You owe ${formatCurrency(-mine)}`}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CreateGroup open={creating} onClose={() => setCreating(false)} you={settings.name?.split(' ')[0] || 'You'}
        onCreate={g => { mutate(s => ({ ...s, groups: [g, ...s.groups] })); setCreating(false); setOpenId(g.id); haptic(10); }} />
    </div>
  );
};

const CreateGroup: React.FC<{ open: boolean; onClose: () => void; you: string; onCreate: (g: Group) => void }> = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [members, setMembers] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const add = () => { const n = draft.trim(); if (n && n.toLowerCase() !== 'you' && !members.includes(n)) setMembers([...members, n]); setDraft(''); };
  const create = () => {
    onCreate({ id: generateId(), name: name.trim(), emoji, members: ['You', ...members], expenses: [], createdAt: new Date().toISOString() });
    setName(''); setMembers([]); setEmoji(EMOJIS[0]);
  };
  return (
    <Sheet open={open} onClose={onClose} title="New group" footer={<button onClick={create} disabled={!name.trim() || members.length === 0} className={`${btnPrimary} w-full`}>Create group</button>}>
      <div className="space-y-4">
        <div className="flex gap-1.5">{EMOJIS.map(e => <button key={e} onClick={() => setEmoji(e)} aria-pressed={emoji === e} className={`w-10 h-10 rounded-xl text-xl ${emoji === e ? 'bg-mm-gold/20 ring-2 ring-mm-gold' : 'bg-mm-bg2'}`}>{e}</button>)}</div>
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Group name, e.g. Goa 2026" autoFocus />
        <div>
          <p className="text-xs text-mm-text2 mb-2">Who’s in it besides you?</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {members.map((m, i) => (
              <span key={m} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-mm-bg2 border border-mm-line/15 text-sm text-mm-text">
                <Avatar name={m} i={i + 1} size={22} />{m}
                <button onClick={() => setMembers(members.filter(x => x !== m))} aria-label={`Remove ${m}`}><X size={13} className="text-mm-muted" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={inputCls} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} placeholder="Name, then Enter" />
            <button onClick={add} className={btnGhost}>Add</button>
          </div>
        </div>
      </div>
    </Sheet>
  );
};

const GroupDetail: React.FC<{ group: Group; onBack: () => void; update: (fn: (g: Group) => Group) => void; onDelete: () => void }> = ({ group, onBack, update, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const [settling, setSettling] = useState<Settlement | null>(null);
  const bal = useMemo(() => balances(group), [group]);
  const plan = useMemo(() => settleUp(group), [group]);
  const you = group.members[0];

  const shareSummary = () => {
    const lines = plan.length ? plan.map(p => `• ${p.from} pays ${p.to} ${formatCurrency(p.amount, { reveal: true })}`) : ['Everyone is settled up 🎉'];
    shareText(`${group.emoji} ${group.name}: ${formatCurrency(groupTotal(group), { reveal: true })} spent\n\nTo settle up:\n${lines.join('\n')}\n\nSplit with MoneyMate`);
  };
  const record = (p: Settlement) => {
    update(g => ({ ...g, expenses: [...g.expenses, { id: generateId(), description: `${p.from} paid ${p.to}`, amount: p.amount, paidBy: p.from, splitAmong: [p.to], date: new Date().toISOString(), settlement: true }] }));
    if (plan.length === 1) confetti({ count: 120 });
  };

  return (
    <>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-mm-text2 hover:text-mm-text mb-4"><ArrowLeft size={16} /> All groups</button>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <span className="w-16 h-16 rounded-3xl bg-mm-bg2 flex items-center justify-center text-4xl">{group.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-serif text-mm-text truncate">{group.name}</h1>
          <p className="text-sm text-mm-text2">{group.members.length} people · {formatCurrency(groupTotal(group))} spent</p>
        </div>
        <div className="flex gap-2">
          <button onClick={shareSummary} className={`${btnGhost} flex items-center gap-2`}><Share2 size={15} /> Share</button>
          <button onClick={() => setAdding(true)} className={`${btnPrimary} flex items-center gap-2`}><Plus size={16} /> Add expense</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5">
        <div className="space-y-5">
          <section className="glass-card p-5">
            <h2 className="text-sm font-semibold text-mm-text mb-3">Balances</h2>
            <ul className="space-y-2.5">
              {group.members.map((m, i) => {
                const v = bal[m] || 0, max = Math.max(1, ...Object.values(bal).map(Math.abs));
                return (
                  <li key={m} className="flex items-center gap-3">
                    <Avatar name={m} i={i} />
                    <span className="w-20 text-sm text-mm-text truncate">{m}</span>
                    <div className="flex-1 h-2 relative">
                      <span className="absolute left-1/2 top-0 bottom-0 w-px bg-mm-line/25" />
                      <motion.span className={`absolute top-0 bottom-0 rounded-full ${v >= 0 ? 'bg-mm-positive' : 'bg-mm-negative'}`}
                        initial={{ width: 0 }} animate={{ width: `${(Math.abs(v) / max) * 50}%` }} style={v >= 0 ? { left: '50%' } : { right: '50%' }} />
                    </div>
                    <span className={`w-24 text-right text-sm number-display ${Math.abs(v) < 1 ? 'text-mm-muted' : v > 0 ? 'text-mm-positive' : 'text-mm-negative'}`}>
                      {Math.abs(v) < 1 ? '—' : `${v > 0 ? '+' : '−'}${formatCurrency(Math.abs(v))}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="glass-card p-5">
            <h2 className="text-sm font-semibold text-mm-text">Settle up</h2>
            <p className="text-xs text-mm-muted mb-3">{plan.length ? `${plan.length} payment${plan.length === 1 ? '' : 's'} clears everything.` : 'Nobody owes anything. 🎉'}</p>
            <ul className="space-y-2">
              {plan.map(p => (
                <li key={`${p.from}-${p.to}`} className="flex items-center gap-2 p-3 rounded-xl bg-mm-bg2 border border-mm-line/10">
                  <span className="text-sm text-mm-text">{p.from}</span><ArrowRight size={14} className="text-mm-muted" /><span className="text-sm text-mm-text flex-1">{p.to}</span>
                  <span className="text-sm font-medium text-mm-text number-display">{formatCurrency(p.amount)}</span>
                  {(p.from === you || p.to === you)
                    ? <button onClick={() => setSettling(p)} className="ml-1 px-2.5 py-1 rounded-lg bg-mm-positive/12 text-mm-positive text-xs font-semibold">{p.from === you ? 'Pay' : 'Request'}</button>
                    : <button onClick={() => record(p)} className="ml-1 px-2.5 py-1 rounded-lg bg-mm-text/5 text-mm-text2 text-xs">Mark paid</button>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="glass-card p-5">
          <h2 className="text-sm font-semibold text-mm-text mb-2">Activity</h2>
          {group.expenses.length === 0 ? (
            <button onClick={() => setAdding(true)} className="w-full py-10 text-center text-sm text-mm-muted hover:text-mm-text"><Receipt className="mx-auto mb-2" size={22} />Add the first expense</button>
          ) : (
            <ul className="divide-y divide-mm-line/8">
              {[...group.expenses].sort((a, b) => +new Date(b.date) - +new Date(a.date)).map(e => (
                <li key={e.id} className="flex items-center gap-3 py-3 group">
                  <span className="w-9 h-9 rounded-xl bg-mm-bg2 flex items-center justify-center text-base shrink-0">{e.settlement ? '🤝' : '🧾'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-mm-text truncate">{e.description}</span>
                    <span className="block text-[11px] text-mm-muted">{e.settlement ? formatDate(e.date) : `${e.paidBy} paid · ${formatDate(e.date)}${e.paidBy !== you && shareOf(e, you) ? ` · your share ${formatCurrency(shareOf(e, you))}` : ''}`}</span>
                  </span>
                  <span className={`text-sm number-display ${e.settlement ? 'text-mm-positive' : 'text-mm-text'}`}>{formatCurrency(e.amount)}</span>
                  <button onClick={() => update(g => ({ ...g, expenses: g.expenses.filter(x => x.id !== e.id) }))} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-mm-muted hover:text-mm-negative" aria-label={`Delete ${e.description}`}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={onDelete} className="mt-4 text-xs text-mm-muted hover:text-mm-negative">Delete group</button>
        </section>
      </div>

      <AddExpense open={adding} onClose={() => setAdding(false)} group={group}
        onAdd={e => { update(g => ({ ...g, expenses: [...g.expenses, e] })); setAdding(false); haptic(10); }} />

      {settling && (
        <SettleUpSheet open={!!settling} onClose={() => setSettling(null)}
          direction={settling.from === you ? 'pay' : 'collect'}
          person={settling.from === you ? settling.to : settling.from}
          amount={settling.amount} note={group.name}
          theirUpi={group.upi?.[settling.to]}
          onSaveTheirUpi={vpa => update(g => ({ ...g, upi: { ...(g.upi || {}), [settling.to]: vpa } }))}
          onMarkPaid={() => record(settling)} />
      )}
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
    onAdd({ id: generateId(), description: desc.trim(), amount: amt, paidBy, splitAmong: among, date: new Date().toISOString() });
    setDesc(''); setAmount(''); setPaidBy(group.members[0]); setAmong(group.members);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add expense" footer={<button onClick={submit} disabled={!desc.trim() || amt <= 0 || among.length === 0} className={`${btnPrimary} w-full`}>Add · {among.length ? formatCurrency(amt / among.length) : '—'} each</button>}>
      <div className="space-y-4">
        <input className={`${inputCls} text-3xl font-semibold text-center number-display py-4`} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹0" autoFocus aria-label="Amount" />
        <input className={inputCls} value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was it? e.g. Dinner at Thalassa" aria-label="Description" />
        <div>
          <p className="text-xs text-mm-text2 mb-2">Paid by</p>
          <div className="flex flex-wrap gap-1.5">{group.members.map((m, i) => (
            <button key={m} onClick={() => setPaidBy(m)} aria-pressed={paidBy === m} className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-sm ${paidBy === m ? 'border-mm-gold bg-mm-gold/12 text-mm-text' : 'border-mm-line/15 text-mm-text2'}`}>
              <Avatar name={m} i={i} size={22} />{m}
            </button>
          ))}</div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2"><p className="text-xs text-mm-text2">Split equally between</p>
            <button onClick={() => setAmong(among.length === group.members.length ? [] : group.members)} className="text-xs text-mm-gold">{among.length === group.members.length ? 'None' : 'Everyone'}</button></div>
          <div className="flex flex-wrap gap-1.5">{group.members.map((m, i) => {
            const on = among.includes(m);
            return (
              <button key={m} onClick={() => setAmong(on ? among.filter(x => x !== m) : [...among, m])} aria-pressed={on} className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-sm transition-opacity ${on ? 'border-mm-positive/50 bg-mm-positive/10 text-mm-text' : 'border-mm-line/15 text-mm-muted opacity-60'}`}>
                <Avatar name={m} i={i} size={22} />{m}
              </button>
            );
          })}</div>
        </div>
      </div>
    </Sheet>
  );
};
