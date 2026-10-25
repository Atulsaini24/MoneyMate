import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileUp, Trash2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/context/AppContext';
import { KINDS, netWorth, netWorthHistory, withNewValue } from '@/lib/wealth';
import { parseCasLines, type Holding } from '@/lib/importers/cams';
import { pdfLines, PdfPasswordError } from '@/lib/importers/pdfStatement';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { Sheet, PageHeader, inputCls, btnPrimary, btnGhost } from '@/components/shared/Sheet';
import { formatCurrency, generateId } from '@/lib/utils';
import { confetti } from '@/lib/fx';
import type { Asset, AssetKind } from '@/types';

const GROUP_COLORS: Record<string, string> = { 'Cash & bank': '#83C9A5', Investments: '#D6BC86', Retirement: '#8FB3D9', 'Other assets': '#B6A3D9', Loans: '#E08C8C', Cards: '#E0A88C' };
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

  return (
    <div className="min-h-screen pb-32 lg:pb-10 px-4 md:px-6 py-5 md:py-6 max-w-6xl mx-auto">
      <PageHeader title="Wealth" subtitle="Everything you own minus everything you owe. Update balances now and then and watch the line climb."
        action={<div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className={`${btnGhost} flex items-center gap-2`}><FileUp size={15} /> Import mutual funds</button>
          <button onClick={() => open('new')} className={`${btnPrimary} flex items-center gap-2`}><Plus size={16} /> Add account</button>
        </div>} />
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readCas(f); e.target.value = ''; }} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[22px] border border-mm-line/18 p-6 sm:p-7 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6"
        style={{ background: 'radial-gradient(120% 120% at 0% 0%, color-mix(in oklab, var(--color-mm-gold) 14%, transparent), transparent 60%), var(--color-mm-card)' }}>
        <div className="flex flex-col justify-center">
          <p className="text-xs text-mm-text2">Net worth</p>
          <AnimatedNumber value={nw.net} duration={1300} className="block text-[2.6rem] sm:text-5xl font-semibold tracking-tight mm-gold-text number-display leading-tight mt-1" />
          {change !== null && (
            <p className={`mt-2 text-sm flex items-center gap-1.5 ${change >= 0 ? 'text-mm-positive' : 'text-mm-negative'}`}>
              {change >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />} {change >= 0 ? '+' : ''}{(change * 100).toFixed(1)}% since {history[0].month}
            </p>
          )}
          <div className="flex gap-6 mt-5 text-sm">
            <div><p className="text-xs text-mm-muted">Assets</p><p className="text-mm-text number-display">{formatCurrency(nw.assets)}</p></div>
            <div><p className="text-xs text-mm-muted">Liabilities</p><p className="text-mm-negative number-display">{formatCurrency(nw.liabilities)}</p></div>
          </div>
          {allocation.length > 0 && (
            <div className="mt-5">
              <div className="h-2.5 rounded-full overflow-hidden flex bg-mm-text/8">
                {allocation.map(({ g, v }, i) => (
                  <motion.div key={g} style={{ background: GROUP_COLORS[g] }} initial={{ width: 0 }} animate={{ width: `${(v / nw.assets) * 100}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {allocation.map(({ g, v }) => <span key={g} className="text-[11px] text-mm-muted flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[g] }} />{g} {Math.round((v / nw.assets) * 100)}%</span>)}
              </div>
            </div>
          )}
        </div>
        <div className="h-52 sm:h-60 sensitive">
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
                <defs><linearGradient id="nw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D6BC86" stopOpacity={0.45} /><stop offset="100%" stopColor="#D6BC86" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" tick={{ fill: '#8C877E', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={['dataMin - 10000', 'dataMax + 10000']} />
                <Tooltip formatter={v => formatCurrency(Number(v))} contentStyle={{ background: '#17171B', border: '1px solid rgba(214,188,134,.25)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="net" stroke="#D6BC86" strokeWidth={2.5} fill="url(#nw)" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-2xl border border-dashed border-mm-line/25 flex items-center justify-center text-center text-sm text-mm-muted px-6">
              {assets.length ? 'Your net worth trend appears here after you update balances in a later month.' : 'Add your bank accounts, investments and loans to see your net worth.'}
            </div>
          )}
        </div>
      </section>

      {/* Accounts */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        {groups.map(([g, list]) => (
          <section key={g} className="glass-card p-4">
            <div className="flex items-baseline justify-between px-1 mb-2">
              <h2 className="text-sm font-semibold text-mm-text flex items-center gap-2"><i className="w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[g] }} />{g}</h2>
              <span className="text-xs text-mm-muted number-display">{formatCurrency(list.reduce((s, a) => s + a.value, 0))}</span>
            </div>
            <ul>
              {list.map(a => {
                const stale = Date.now() - +new Date(a.updatedAt) > 30 * 86_400_000;
                return (
                  <li key={a.id}>
                    <button onClick={() => open(a)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-mm-text/[0.04] text-left">
                      <span className="w-9 h-9 rounded-xl bg-mm-bg2 flex items-center justify-center text-lg shrink-0">{KINDS[a.kind].emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-mm-text truncate">{a.name}</span>
                        <span className={`block text-[11px] ${stale ? 'text-mm-warning' : 'text-mm-muted'} flex items-center gap-1`}>{stale && <Clock size={10} />}{KINDS[a.kind].label} · updated {ago(a.updatedAt)}</span>
                      </span>
                      <span className={`text-sm number-display ${KINDS[a.kind].liability ? 'text-mm-negative' : 'text-mm-text'}`}>{KINDS[a.kind].liability ? '−' : ''}{formatCurrency(a.value)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {/* Add / edit */}
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add an account' : 'Update balance'}
        footer={<div className="flex gap-2">
          {editing && editing !== 'new' && <button onClick={() => remove(editing.id)} className="p-2.5 rounded-xl text-mm-negative hover:bg-mm-negative/10" aria-label="Delete account"><Trash2 size={18} /></button>}
          <button onClick={save} disabled={!name.trim() || !value} className={`${btnPrimary} flex-1`}>{editing === 'new' ? 'Add account' : 'Save'}</button>
        </div>}>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-mm-text2 mb-2">Type</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(KINDS) as AssetKind[]).map(k => (
                <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] leading-tight text-center transition-colors ${kind === k ? 'border-mm-gold bg-mm-gold/10 text-mm-text' : 'border-mm-line/12 text-mm-muted hover:text-mm-text'}`}>
                  <span className="text-lg">{KINDS[k].emoji}</span>{KINDS[k].label}
                </button>
              ))}
            </div>
          </div>
          <label className="block"><span className="text-xs text-mm-text2">Name</span>
            <input className={`${inputCls} mt-1.5`} value={name} onChange={e => setName(e.target.value)} placeholder={KINDS[kind].liability ? 'e.g. SBI home loan' : 'e.g. HDFC savings'} /></label>
          <label className="block"><span className="text-xs text-mm-text2">{KINDS[kind].liability ? 'Amount outstanding' : 'Current value'}</span>
            <input className={`${inputCls} mt-1.5 number-display`} inputMode="decimal" type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0" /></label>
          {editing && editing !== 'new' && editing.meta && <p className="text-xs text-mm-muted">{editing.meta}</p>}
        </div>
      </Sheet>

      {/* CAMS import */}
      <Sheet open={!!cas} onClose={() => { setCas(null); setPw(''); }} title="Import mutual funds" wide
        footer={cas?.holdings?.length ? <button onClick={importCas} className={`${btnPrimary} w-full`}>Import {cas.holdings.length} funds · {formatCurrency(cas.holdings.reduce((s, h) => s + h.value, 0))}</button> : undefined}>
        {cas?.needPassword ? (
          <form onSubmit={e => { e.preventDefault(); readCas(cas.file, pw); }} className="space-y-3">
            <p className="text-sm text-mm-text2">This statement is password-protected. CAMS and KFintech use your <b className="text-mm-text">PAN in capital letters</b> unless you chose something else.</p>
            <input className={inputCls} autoFocus type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="ABCDE1234F" />
            {cas.error && <p className="text-sm text-mm-negative">{cas.error}</p>}
            <button className={`${btnPrimary} w-full`}>Unlock</button>
          </form>
        ) : cas?.error ? (
          <p className="text-sm text-mm-negative">{cas.error}</p>
        ) : (
          <ul className="divide-y divide-mm-line/8">
            {cas?.holdings?.map(h => (
              <li key={h.name} className="flex items-center gap-3 py-2.5">
                <span className="text-lg">📈</span>
                <span className="flex-1 min-w-0"><span className="block text-sm text-mm-text truncate">{h.name}</span><span className="text-[11px] text-mm-muted">{h.units} units</span></span>
                <span className="text-sm text-mm-text number-display">{formatCurrency(h.value)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-mm-muted mt-4">Get your free statement at camsonline.com → Statements → CAS. The PDF is read on your device and never uploaded.</p>
      </Sheet>
    </div>
  );
};
