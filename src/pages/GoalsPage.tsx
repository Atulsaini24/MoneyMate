import React, { useState } from 'react';
import { Plus, Target, Pencil, CalendarDays, CircleCheck, Trash2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { SavingsGoal } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { GOAL_COLORS, GOAL_ICONS, goalLook, monthlyNeeded } from '@/lib/goals';
import { CategoryIcon, ICONS } from '@/components/shared/CategoryIcon';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { MoneyCanvas } from '@/components/three/MoneyCanvas';
import { TiltCard } from '@/components/motion';
import { Photo } from '@/components/shared/Photo';
import { goalPhoto } from '@/lib/photos';
import { Badge, Button, Chip, EmptyState, Field, IconButton, Input, MoneyInput, Page, PageHeader, Progress, Segmented, Textarea } from '@/components/ui';

type Form = { id?: string; name: string; target: string; saved: string; date: string; term: SavingsGoal['category']; icon: string; color: string; notes: string };
const blank = (): Form => ({ name: '', target: '', saved: '', date: '', term: 'short-term', icon: 'PiggyBank', color: GOAL_COLORS[0], notes: '' });

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addMoneyToGoal, showToast, mutate } = useApp();
  const [filter, setFilter] = useState<'all' | SavingsGoal['category']>('all');
  const [form, setForm] = useState<Form | null>(null);
  const [money, setMoney] = useState<{ goal: SavingsGoal; mode: 'add' | 'withdraw'; amount: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavingsGoal | null>(null);

  const shown = goals.filter(g => filter === 'all' || g.category === filter)
    .sort((a, b) => Number(a.savedAmount >= a.targetAmount) - Number(b.savedAmount >= b.targetAmount));
  const saved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const target = goals.reduce((s, g) => s + g.targetAmount, 0);

  const openEdit = (g: SavingsGoal) => {
    const look = goalLook(g);
    setForm({ id: g.id, name: g.name, target: String(g.targetAmount), saved: String(g.savedAmount), date: g.targetDate?.slice(0, 10) || '', term: g.category, icon: look.icon, color: look.color, notes: g.notes || '' });
  };
  const t = parseFloat(form?.target || '');
  const canSave = Boolean(form?.name.trim()) && Number.isFinite(t) && t > 0;
  const save = () => {
    if (!form || !canSave) return;
    const data = { name: form.name.trim(), targetAmount: t, savedAmount: Math.max(0, parseFloat(form.saved) || 0), targetDate: form.date || undefined, category: form.term, icon: form.icon, color: form.color, notes: form.notes.trim(), image: undefined };
    if (form.id) updateGoal(form.id, data); else addGoal(data);
    setForm(null);
  };

  const amt = parseFloat(money?.amount || '');
  const applyMoney = () => {
    if (!money || !(amt > 0)) return;
    if (money.mode === 'add') addMoneyToGoal(money.goal.id, amt);
    else {
      const take = Math.min(amt, money.goal.savedAmount);
      const id = money.goal.id;
      mutate(st => ({ ...st, goals: st.goals.map(x => (x.id === id ? { ...x, savedAmount: Math.max(0, x.savedAmount - take) } : x)) }));
      showToast(`Took ${formatCurrency(take)} out of ${money.goal.name}`, 'info');
    }
    setMoney(null);
  };

  return (
    <Page>
      <PageHeader title="Goals" subtitle="Put money aside for the things that matter and see how close you are."
        actions={<Button icon={Plus} onClick={() => setForm(blank())}>New goal</Button>} />

      {goals.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Target} title="No goals yet" description="An emergency fund is a good first one. Three months of expenses gives you room to breathe."
            action={<Button icon={Plus} onClick={() => setForm({ ...blank(), name: 'Emergency fund', icon: 'ShieldCheck', term: 'long-term' })}>Create a goal</Button>} />
        </div>
      ) : (
        <>
          <section className="panel p-5 sm:p-6 mb-5 relative overflow-hidden">
            <MoneyCanvas mode="stack" value={target ? saved / target : 0} maxCoins={10} label={`Coin stack: ${target ? Math.round((saved / target) * 100) : 0}% of all goals saved`}
              className="absolute right-2 top-2 bottom-2 w-24 sm:w-40" />
            <div className="relative flex flex-wrap items-end justify-between gap-3 pr-24 sm:pr-40">
              <div>
                <p className="text-[13px] text-mm-muted">Saved across {goals.length} goal{goals.length === 1 ? '' : 's'}</p>
                <p className="amount text-[2rem] font-semibold text-mm-text leading-tight">{formatCurrency(saved)}</p>
              </div>
              <p className="text-sm text-mm-text2 tabular">of {formatCurrency(target)} · {target ? Math.round((saved / target) * 100) : 0}%</p>
            </div>
            <Progress value={target ? (saved / target) * 100 : 0} className="relative mt-4 h-2.5 mr-24 sm:mr-40" label="All goals progress" />
          </section>

          <Segmented label="Filter goals" value={filter} onChange={setFilter} className="mb-4"
            options={[{ value: 'all', label: 'All' }, { value: 'short-term', label: 'Short term' }, { value: 'long-term', label: 'Long term' }]} />

          {shown.length === 0 ? (
            <div className="panel"><EmptyState compact icon={Target} title="No goals in this group" /></div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {shown.map(g => {
                const look = goalLook(g);
                const pct = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
                const done = g.savedAmount >= g.targetAmount;
                const need = monthlyNeeded(g);
                const overdue = g.targetDate && !done && new Date(g.targetDate) < new Date();
                return (
                  <li key={g.id}><TiltCard max={5} className="h-full rounded-[20px]"><div className="panel overflow-hidden flex flex-col h-full">
                    <Photo src={goalPhoto(g.name, look.icon)} alt="" color={look.color} icon={look.icon} className="h-40 sm:h-44 shrink-0">
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.05)_30%,rgb(0_0_0/0.62))]" />
                      <div className="absolute inset-x-0 bottom-0 p-4 flex items-end gap-3 text-white">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[19px] font-semibold truncate drop-shadow">{g.name}</h3>
                          <p className="text-[13px] text-white/80 flex items-center gap-1.5 mt-0.5">
                            {g.targetDate ? <><CalendarDays size={13} />{new Date(g.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</> : g.category === 'long-term' ? 'Long term' : 'Short term'}
                          </p>
                        </div>
                        <span className="px-2.5 h-7 rounded-full bg-white/18 backdrop-blur-md ring-1 ring-white/25 text-[13px] font-bold tabular flex items-center">{Math.min(100, Math.round(pct))}%</span>
                      </div>
                      <button onClick={() => openEdit(g)} aria-label={`Edit ${g.name}`} title={`Edit ${g.name}`}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/25 backdrop-blur-md ring-1 ring-white/25 text-white flex items-center justify-center hover:bg-black/40 transition-colors">
                        <Pencil size={15} />
                      </button>
                    </Photo>
                    <div className="p-5 pt-4 flex flex-col flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="amount text-2xl font-semibold text-mm-text">{formatCurrency(g.savedAmount)}</span>
                      <span className="text-[13px] text-mm-muted tabular">of {formatCurrency(g.targetAmount)}</span>
                    </div>
                    <Progress value={pct} tone={done ? 'positive' : 'accent'} className="mt-2.5" label={`${g.name} progress`} />
                    <div className="mt-2.5 min-h-[20px] text-[13px]">
                      {done ? <Badge tone="positive"><CircleCheck size={13} /> Reached</Badge>
                        : overdue ? <span className="text-mm-warning">Target date passed · {formatCurrency(g.targetAmount - g.savedAmount)} to go</span>
                        : need ? <span className="text-mm-text2">Save <b className="text-mm-text tabular">{formatCurrency(need)}</b> a month to get there</span>
                        : <span className="text-mm-text2">{formatCurrency(g.targetAmount - g.savedAmount)} to go</span>}
                    </div>
                    <div className="mt-auto pt-4"><div className="flex gap-2 pt-4 border-t border-mm-line/8">
                      <Button size="sm" className="flex-1" icon={Plus} onClick={() => setMoney({ goal: g, mode: 'add', amount: '' })} disabled={done}>Add money</Button>
                      <Button size="sm" variant="secondary" onClick={() => setMoney({ goal: g, mode: 'withdraw', amount: '' })} disabled={g.savedAmount <= 0}>Withdraw</Button>
                    </div></div>
                    </div>
                  </div></TiltCard></li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit goal' : 'New goal'} size="lg"
        footer={
          <div className="flex gap-2">
            {form?.id && <IconButton label="Delete goal" icon={Trash2} tone="danger" onClick={() => { const g = goals.find(x => x.id === form.id); if (g) setConfirmDelete(g); }} />}
            <Button size="lg" className="flex-1" onClick={save} disabled={!canSave}>{form?.id ? 'Save changes' : 'Create goal'}</Button>
          </div>
        }>
        {form && (
          <form className="space-y-5 pt-1" onSubmit={e => { e.preventDefault(); save(); }}>
            <Field label="Name" htmlFor="g-name">
              <Input id="g-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Goa trip, new laptop" data-autofocus />
            </Field>
            <div>
              <p className="text-[13px] font-medium text-mm-text2 mb-2">Icon</p>
              <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Icon">
                {GOAL_ICONS.map(o => {
                  const I = ICONS[o.icon]; const on = form.icon === o.icon;
                  return (
                    <button key={o.icon} type="button" role="radio" aria-checked={on} aria-label={o.label} title={o.label}
                      onClick={() => setForm({ ...form, icon: o.icon, name: form.name || (o.icon === 'ShieldCheck' ? 'Emergency fund' : '') })}
                      className={cn('aspect-square rounded-xl flex items-center justify-center border transition-colors', on ? 'border-transparent' : 'border-mm-line/10 text-mm-text2 hover:border-mm-line/25')}
                      style={on ? { background: `color-mix(in oklab, ${form.color} 16%, transparent)`, color: `color-mix(in oklab, ${form.color} 80%, var(--color-mm-text))`, boxShadow: `inset 0 0 0 2px ${form.color}` } : undefined}>
                      <I size={18} />
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3" role="radiogroup" aria-label="Colour">
                {GOAL_COLORS.map(c => (
                  <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={`Colour ${c}`} onClick={() => setForm({ ...form, color: c })}
                    className={cn('w-7 h-7 rounded-full transition-transform', form.color === c && 'ring-2 ring-offset-2 ring-offset-mm-elevated scale-110')}
                    style={{ background: c, ['--tw-ring-color' as string]: c }} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target" htmlFor="g-target"><MoneyInput id="g-target" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="0" /></Field>
              <Field label="Saved so far" htmlFor="g-saved"><MoneyInput id="g-saved" value={form.saved} onChange={e => setForm({ ...form, saved: e.target.value })} placeholder="0" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target date (optional)" htmlFor="g-date"><Input id="g-date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="Timeframe">
                <Segmented label="Timeframe" value={form.term} onChange={v => setForm({ ...form, term: v })} className="w-full h-11"
                  options={[{ value: 'short-term', label: 'Short' }, { value: 'long-term', label: 'Long' }]} />
              </Field>
            </div>
            <Field label="Note (optional)" htmlFor="g-notes"><Textarea id="g-notes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </form>
        )}
      </Dialog>

      <Dialog open={!!money} onClose={() => setMoney(null)} size="sm"
        title={money?.mode === 'withdraw' ? `Take money out of ${money?.goal.name}` : `Add to ${money?.goal.name}`}
        description={money ? `${formatCurrency(money.goal.savedAmount)} saved of ${formatCurrency(money.goal.targetAmount)}` : undefined}
        footer={<Button size="lg" className="w-full" onClick={applyMoney} disabled={!(amt > 0)}>{money?.mode === 'withdraw' ? 'Withdraw' : 'Add'}{amt > 0 ? ` ${formatCurrency(amt)}` : ''}</Button>}>
        {money && (
          <form onSubmit={e => { e.preventDefault(); applyMoney(); }} className="pt-1">
            <MoneyInput large value={money.amount} onChange={e => setMoney({ ...money, amount: e.target.value })} placeholder="0" aria-label="Amount" data-autofocus />
            {money.mode === 'add' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {[500, 1000, 5000].filter(v => v < money.goal.targetAmount - money.goal.savedAmount).map(v => (
                  <Chip key={v} onClick={() => setMoney({ ...money, amount: String(v) })}>{formatCurrency(v, { reveal: true })}</Chip>
                ))}
                <Chip onClick={() => setMoney({ ...money, amount: String(Math.max(0, money.goal.targetAmount - money.goal.savedAmount)) })}>Everything left</Chip>
              </div>
            )}
          </form>
        )}
      </Dialog>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} variant="danger" confirmText="Delete goal"
        title={`Delete “${confirmDelete?.name}”?`} message="The amount you’ve recorded as saved for it is removed too. This can’t be undone."
        onConfirm={() => { if (confirmDelete) { deleteGoal(confirmDelete.id); setForm(null); } }} />
    </Page>
  );
};
