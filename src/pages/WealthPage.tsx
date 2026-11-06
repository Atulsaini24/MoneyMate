import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileUp, Trash2, Clock, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/context/AppContext';
import { KINDS, netWorth, netWorthHistory, withNewValue } from '@/lib/wealth';
import { parseCasLines, type Holding } from '@/lib/importers/cams';
import { pdfLines, PdfPasswordError } from '@/lib/importers/pdfStatement';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Button, EmptyState, Field, IconButton, Input, MoneyInput, Page, PageHeader } from '@/components/ui';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { formatCurrency, generateId, cn } from '@/lib/utils';
import { confetti } from '@/lib/fx';
import type { Asset, AssetKind } from '@/types';

const GROUP_COLORS: Record<string, string> = { 'Cash & bank': '#1F8A55', Investments: '#2F7BD8', Retirement: '#8458D4', 'Other assets': '#C99A06', Loans: '#D64545', Cards: '#E0782F' };
const KIND_ICON: Record<AssetKind, string> = {
  bank: 'Landmark', cash: 'Banknote', fd: 'Vault', mutual_fund: 'ChartLine', stocks: 'TrendingUp', epf_ppf: 'PiggyBank', gold: 'Coins',
  property: 'House', crypto: 'Bitcoin', other_asset: 'Gem', home_loan: 'House', car_loan: 'Car', personal_loan: 'Receipt',
  education_loan: 'GraduationCap', credit_card: 'CreditCard', other_liability: 'Receipt',
};
const ago = (iso: string) => { const d = Math.floor((Date.now() - +new Date(iso)) / 86_400_000); return d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; };

export const WealthPage: React.FC = () => {
  const { assets, mutate, showToast } = useApp();
  const [editing, setEditing] = useState<Asset | 'new' | null>(null);
  const [kind, setKind] = useState<AssetKind>('bank');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [cas, setCas] = useState<{ file: File; needPassword: boolean; holdings?: Holding[]; error?: string } | null>(null);
  const [pw, setPw] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmRemove, setConfirmRemove] = useState<Asset | null>(null);

  const nw = netWorth(assets);
  const history = useMemo(() => netWorthHistory(assets), [assets]);
  const first = history[0]?.net;
  const change = history.length > 1 && first ? (nw.net - first) / Math.abs(first) : null;

  const groups = useMemo(() => {
    const m = new Map<string, Asset[]>();
    for (const a of [...assets].sort((x, y) => y.value - x.value)) m.set(KINDS[a.kind].group, [...(m.get(KINDS[a.kind].group) || []), a]);
    return [...m];
  }, [assets]);
  const allocation = groups.filter(([g]) => !['Loans', 'Cards'].includes(g)).map(([g, list]) => ({ g, v: list.reduce((s, a) => s + a.value, 0) }));

  const open = (a: Asset | 'new') => {
    setEditing(a);
    if (a === 'new') { setKind('bank'); setName(''); setValue(''); }
    else { setKind(a.kind); setName(a.name); setValue(String(a.value)); }
  };
  const save = () => {
    const v = parseFloat(value);
    if (!name.trim() || !Number.isFinite(v) || v < 0) return;
    mutate(s => ({
      ...s,
      assets: editing === 'new'
        ? [...s.assets, { id: generateId(), name: name.trim(), kind, value: v, updatedAt: new Date().toISOString(), history: [] }]
        : s.assets.map(a => (a.id === (editing as Asset).id ? { ...withNewValue(a, v), name: name.trim(), kind } : a)),
    }));
    showToast(editing === 'new' ? 'Account added' : 'Balance updated');
    setEditing(null);
  };
  const remove = (id: string) => { mutate(s => ({ ...s, assets: s.assets.filter(a => a.id !== id) })); setEditing(null); showToast('Account removed', 'info'); };

  const readCas = async (file: File, password?: string) => {
    try {
      const holdings = parseCasLines(await pdfLines(file, password));
      setCas({ file, needPassword: false, holdings, error: holdings.length ? undefined : 'No holdings found. Make sure this is a CAMS or KFintech Consolidated Account Statement.' });
    } catch (e) {
      if (e instanceof PdfPasswordError) setCas({ file, needPassword: true, error: password ? 'That password didn’t work. It’s usually your PAN in capitals.' : undefined });
      else setCas({ file, needPassword: false, error: 'Couldn’t read that PDF.' });
    }
  };
  const importCas = () => {
    const h = cas?.holdings || [];
    mutate(s => {
      const next = [...s.assets];
      for (const x of h) {
        const i = next.findIndex(a => a.kind === 'mutual_fund' && a.name === x.name);
        if (i >= 0) next[i] = { ...withNewValue(next[i], x.value), meta: `${x.units} units${x.folio ? ` · folio ${x.folio}` : ''}` };
        else next.push({ id: generateId(), name: x.name, kind: 'mutual_fund', value: x.value, meta: `${x.units} units${x.folio ? ` · folio ${x.folio}` : ''}`, updatedAt: new Date().toISOString(), history: [] });
      }
      return { ...s, assets: next };
    });
    confetti({ count: 90 });
    showToast(`Imported ${h.length} mutual fund${h.length === 1 ? '' : 's'}`);
    setCas(null); setPw('');
  };

  const editingAsset = editing && editing !== 'new' ? editing : null;
  const kinds = Object.keys(KINDS) as AssetKind[];

  return (
    <Page>
      <PageHeader title="Net worth" subtitle="Everything you own minus everything you owe. Update balances now and then to see the trend."
        actions={<>
          <Button variant="secondary" icon={FileUp} onClick={() => fileRef.current?.click()}>Import mutual funds</Button>
          <Button icon={Plus} onClick={() => open('new')}>Add account</Button>
        </>} />
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readCas(f); e.target.value = ''; }} />

      {assets.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Landmark} title="Add your first account" description="Bank accounts, fixed deposits, mutual funds, PF, gold, property, and any loans or card dues. Rough balances are fine."
            action={<><Button icon={Plus} onClick={() => open('new')}>Add account</Button><Button variant="secondary" icon={FileUp} onClick={() => fileRef.current?.click()}>Import CAMS statement</Button></>} />
        </div>
      ) : (
        <>
          <section className="panel p-5 sm:p-7 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6">
            <div className="flex flex-col justify-center">
              <p className="text-[13px] text-mm-muted">Net worth</p>
              <AnimatedNumber value={nw.net} duration={1100} className={cn('block amount text-[2.5rem] sm:text-5xl font-semibold leading-tight mt-1', nw.net < 0 ? 'text-mm-negative' : 'text-mm-text')} />
              {change !== null && (
                <p className={`mt-1.5 text-sm font-medium flex items-center gap-1.5 ${change >= 0 ? 'text-mm-positive' : 'text-mm-negative'}`}>
                  {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {change >= 0 ? '+' : ''}{(change * 100).toFixed(1)}% since {history[0].month}
                </p>
              )}
              <div className="flex gap-8 mt-5">
                <div><p className="text-[13px] text-mm-muted">You own</p><p className="amount text-lg font-semibold text-mm-text">{formatCurrency(nw.assets)}</p></div>
                <div><p className="text-[13px] text-mm-muted">You owe</p><p className="amount text-lg font-semibold text-mm-negative">{formatCurrency(nw.liabilities)}</p></div>
              </div>
              {allocation.length > 0 && nw.assets > 0 && (
                <div className="mt-5">
                  <div className="h-2.5 rounded-full overflow-hidden flex bg-mm-text/8 gap-0.5">
                    {allocation.map(({ g, v }, i) => (
                      <motion.div key={g} style={{ background: GROUP_COLORS[g] }} initial={{ width: 0 }} animate={{ width: `${(v / nw.assets) * 100}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.7 }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                    {allocation.map(({ g, v }) => <span key={g} className="text-[13px] text-mm-text2 flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[g] }} />{g} <span className="text-mm-muted tabular">{Math.round((v / nw.assets) * 100)}%</span></span>)}
                  </div>
                </div>
              )}
            </div>
            <div className="h-56 sm:h-64 sensitive">
              {history.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                    <defs><linearGradient id="nw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-mm-accent)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--color-mm-accent)" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" tick={{ fill: 'var(--color-mm-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="net" name="Net worth" stroke="var(--color-mm-accent)" strokeWidth={2.5} fill="url(#nw)" animationDuration={900} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-2xl bg-mm-bg2 flex items-center justify-center text-center text-sm text-mm-text2 px-8 leading-relaxed">
                  Your trend appears here once you’ve updated a balance in a later month.
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {groups.map(([g, list]) => (
              <section key={g} className="panel p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <h2 className="text-[17px] font-semibold text-mm-text flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-full" style={{ background: GROUP_COLORS[g] }} />{g}</h2>
                  <span className="text-sm font-semibold text-mm-text tabular">{formatCurrency(list.reduce((s, a) => s + a.value, 0))}</span>
                </div>
                <ul className="divide-hairline">
                  {list.map(a => {
                    const stale = Date.now() - +new Date(a.updatedAt) > 30 * 86_400_000;
                    return (
                      <li key={a.id}>
                        <button onClick={() => open(a)} className="w-full flex items-center gap-3 py-3 text-left rounded-xl hover:bg-mm-text/[0.03] -mx-2 px-2 w-[calc(100%+1rem)]">
                          <CategoryIcon name={KIND_ICON[a.kind]} color={GROUP_COLORS[g]} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[15px] font-medium text-mm-text truncate">{a.name}</span>
                            <span className={`text-[13px] flex items-center gap-1 ${stale ? 'text-mm-warning' : 'text-mm-muted'}`}>{stale && <Clock size={12} />}{KINDS[a.kind].label} · updated {ago(a.updatedAt)}</span>
                          </span>
                          <span className={`amount font-semibold ${KINDS[a.kind].liability ? 'text-mm-negative' : 'text-mm-text'}`}>{KINDS[a.kind].liability ? '−' : ''}{formatCurrency(a.value)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add an account' : 'Update balance'} size="lg"
        footer={<div className="flex gap-2">
          {editingAsset && <IconButton label="Remove account" icon={Trash2} tone="danger" onClick={() => setConfirmRemove(editingAsset)} />}
          <Button size="lg" className="flex-1" onClick={save} disabled={!name.trim() || !value || parseFloat(value) < 0}>{editing === 'new' ? 'Add account' : 'Save'}</Button>
        </div>}>
        <form className="space-y-4 pt-1" onSubmit={e => { e.preventDefault(); save(); }}>
          {editing === 'new' && (
            <div>
              <p className="text-[13px] font-medium text-mm-text2 mb-2">Type</p>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5" role="radiogroup" aria-label="Type">
                {kinds.map(k => (
                  <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                    className={cn('flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-xs leading-tight text-center transition-colors',
                      kind === k ? 'border-mm-accent bg-mm-accent/[0.07] text-mm-text font-semibold' : 'border-mm-line/10 text-mm-text2 hover:border-mm-line/25')}>
                    <CategoryIcon name={KIND_ICON[k]} color={GROUP_COLORS[KINDS[k].group]} size="sm" />{KINDS[k].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field label="Name" htmlFor="w-name"><Input id="w-name" value={name} onChange={e => setName(e.target.value)} placeholder={KINDS[kind].liability ? 'e.g. SBI home loan' : 'e.g. HDFC savings'} /></Field>
          <Field label={KINDS[kind].liability ? 'Amount still owed' : 'Current value'} htmlFor="w-val" hint={editingAsset?.meta}>
            <MoneyInput id="w-val" value={value} onChange={e => setValue(e.target.value)} placeholder="0" data-autofocus={editing !== 'new' ? '' : undefined} />
          </Field>
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Dialog>

      <ConfirmDialog isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)} variant="danger" confirmText="Remove"
        title={`Remove ${confirmRemove?.name}?`} message="Its balance history is removed too." onConfirm={() => confirmRemove && remove(confirmRemove.id)} />

      <Dialog open={!!cas} onClose={() => { setCas(null); setPw(''); }} title="Import mutual funds" size="xl"
        description="From a CAMS or KFintech Consolidated Account Statement. The PDF is read on your device and never uploaded."
        footer={cas?.holdings?.length ? <Button size="lg" className="w-full" onClick={importCas}>Import {cas.holdings.length} fund{cas.holdings.length === 1 ? '' : 's'} · {formatCurrency(cas.holdings.reduce((s, h) => s + h.value, 0))}</Button> : undefined}>
        {cas?.needPassword ? (
          <form onSubmit={e => { e.preventDefault(); readCas(cas.file, pw); }} className="space-y-3 pt-1">
            <p className="text-sm text-mm-text2">This statement is password-protected. CAMS and KFintech use your <b className="text-mm-text">PAN in capital letters</b> unless you chose something else.</p>
            <Input autoFocus data-autofocus type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="ABCDE1234F" aria-label="PDF password" />
            {cas.error && <p className="text-sm text-mm-negative" role="alert">{cas.error}</p>}
            <Button type="submit" className="w-full">Unlock</Button>
          </form>
        ) : cas?.error ? (
          <p className="text-sm text-mm-negative py-2" role="alert">{cas.error}</p>
        ) : (
          <ul className="divide-hairline">
            {cas?.holdings?.map(h => (
              <li key={h.name} className="flex items-center gap-3 py-3">
                <CategoryIcon name="ChartLine" color={GROUP_COLORS.Investments} size="sm" />
                <span className="flex-1 min-w-0"><span className="block text-sm font-medium text-mm-text truncate">{h.name}</span><span className="text-[13px] text-mm-muted tabular">{h.units} units</span></span>
                <span className="text-sm font-semibold text-mm-text tabular">{formatCurrency(h.value)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[13px] text-mm-muted mt-4">Get your free statement at camsonline.com, under Statements, then CAS.</p>
      </Dialog>
    </Page>
  );
};
