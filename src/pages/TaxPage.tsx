import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Info, Check, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SECTIONS, compareRegimes, fyOf, sectionTotals } from '@/lib/tax';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { PageHeader, inputCls } from '@/components/shared/Sheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { TaxSection } from '@/types';

const DEFAULT = { grossSalary: 0, otherIncome: 0, basic: 0, hraReceived: 0, metro: true, extra: {} as Partial<Record<TaxSection, number>> };

const Num: React.FC<{ label: string; value: number; onChange: (n: number) => void; hint?: string }> = ({ label, value, onChange, hint }) => (
  <label className="block">
    <span className="text-xs text-mm-text2">{label}</span>
    <input type="number" inputMode="numeric" min={0} value={value || ''} placeholder="0" onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} className={`${inputCls} mt-1.5 number-display`} />
    {hint && <span className="block text-[11px] text-mm-muted mt-1">{hint}</span>}
  </label>
);

export const TaxPage: React.FC = () => {
  const { transactions, settings, updateSettings, mutate } = useApp();
  const currentFy = fyOf(new Date());
  const prevFy = fyOf(new Date(new Date().getFullYear() - 1, new Date().getMonth(), 1));
  const [fy, setFy] = useState(currentFy);
  const p = { ...DEFAULT, ...(settings.taxProfile || {}) };
  const set = (patch: Partial<typeof DEFAULT>) => updateSettings({ taxProfile: { ...p, ...patch } }, { silent: true });

  const { totals, items } = useMemo(() => sectionTotals(transactions, fy), [transactions, fy]);
  const claimed = (s: TaxSection) => (totals[s] || 0) + (p.extra[s] || 0);
  const deductions = Object.fromEntries((Object.keys(SECTIONS) as TaxSection[]).filter(s => s !== 'HRA').map(s => [s, claimed(s)])) as Partial<Record<TaxSection, number>>;
  const rentPaid = claimed('HRA');
  const result = compareRegimes({
    grossSalary: p.grossSalary, otherIncome: p.otherIncome, deductions,
    hra: p.basic && p.hraReceived ? { basic: p.basic, hraReceived: p.hraReceived, rentPaid, metro: p.metro } : undefined,
  });
  const marginal = result.oldRegime.taxable > 1_000_000 ? 0.312 : result.oldRegime.taxable > 500_000 ? 0.208 : 0.052;

  const tag = (id: string, section: TaxSection | 'none') => mutate(s => ({ ...s, transactions: s.transactions.map(t => (t.id === id ? { ...t, taxSection: section } : t)) }));

  return (
    <div className="min-h-screen pb-32 lg:pb-10 px-4 md:px-6 py-5 md:py-6 max-w-6xl mx-auto">
      <PageHeader title="Tax planner" subtitle="See which regime costs you less and how much more you could save, using what you’ve already spent."
        action={
          <div role="tablist" className="flex p-1 rounded-xl bg-mm-bg2 border border-mm-line/12">
            {[currentFy, prevFy].map(f => (
              <button key={f} role="tab" aria-selected={fy === f} onClick={() => setFy(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${fy === f ? 'bg-mm-gold text-mm-on-gold' : 'text-mm-text2'}`}>FY {f}</button>
            ))}
          </div>
        } />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-5">
        {/* Inputs */}
        <section className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-mm-text">Your income</h2>
          <Num label="Annual gross salary (CTC minus employer PF)" value={p.grossSalary} onChange={v => set({ grossSalary: v })} />
          <Num label="Other income (interest, freelance, rent)" value={p.otherIncome} onChange={v => set({ otherIncome: v })} />
          <div className="pt-2 border-t border-mm-line/10">
            <h3 className="text-xs font-semibold text-mm-text mb-3">House rent allowance (optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              <Num label="Basic salary (yearly)" value={p.basic} onChange={v => set({ basic: v })} />
              <Num label="HRA received (yearly)" value={p.hraReceived} onChange={v => set({ hraReceived: v })} />
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-mm-text2">
              <input type="checkbox" checked={p.metro} onChange={e => set({ metro: e.target.checked })} className="accent-[var(--color-mm-gold)]" /> I live in Delhi, Mumbai, Kolkata or Chennai
            </label>
            <p className="text-[11px] text-mm-muted mt-1">Rent paid this year from your transactions: <b className="text-mm-text2">{formatCurrency(rentPaid)}</b></p>
          </div>
        </section>

        {/* Verdict */}
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['new', 'old'] as const).map(k => {
              const r = k === 'new' ? result.newRegime : result.oldRegime;
              const win = result.better === k && p.grossSalary > 0;
              return (
                <motion.div key={k} layout className={`relative rounded-[22px] p-5 border ${win ? 'border-mm-gold/60 bg-mm-gold/[0.07]' : 'border-mm-line/15 bg-mm-card'}`}>
                  {win && <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-mm-gold text-mm-on-gold text-[10px] font-bold flex items-center gap-1"><Crown size={11} /> Lower tax</span>}
                  <p className="text-xs text-mm-text2">{k === 'new' ? 'New regime' : 'Old regime'}</p>
                  <AnimatedNumber value={r.tax} className="block text-2xl sm:text-3xl font-semibold text-mm-text number-display mt-1" />
                  <p className="text-[11px] text-mm-muted mt-1">Taxable {formatCurrency(r.taxable)} · {(r.effectiveRate * 100).toFixed(1)}% effective</p>
                </motion.div>
              );
            })}
          </div>
          {p.grossSalary > 0 ? (
            <p className="text-sm text-mm-text">
              The <b>{result.better} regime</b> saves you <b className="text-mm-positive number-display">{formatCurrency(result.saving)}</b> this year.
            </p>
          ) : <p className="text-sm text-mm-text2">Enter your salary to compare regimes.</p>}

          {/* Section progress */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-mm-text mb-1">Deductions (old regime)</h2>
            <p className="text-xs text-mm-muted mb-4">Found automatically from your transactions. Add anything paid outside MoneyMate, like EPF from salary.</p>
            <div className="space-y-4">
              {(Object.keys(SECTIONS) as TaxSection[]).filter(s => s !== 'HRA').map(s => {
                const c = claimed(s), cap = SECTIONS[s].cap, room = cap ? Math.max(0, cap - c) : 0;
                return (
                  <div key={s}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-mm-text">{SECTIONS[s].label}</span>
                      <span className="text-xs text-mm-muted number-display">{formatCurrency(c)}{cap ? ` / ${formatCurrency(cap)}` : ''}</span>
                    </div>
                    {cap && (
                      <div className="h-1.5 rounded-full bg-mm-text/8 mt-1.5 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-mm-gold" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (c / cap) * 100)}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 mt-1.5">
                      <span className="text-[11px] text-mm-muted">{SECTIONS[s].hint}</span>
                      <input type="number" min={0} placeholder="+ add" value={p.extra[s] || ''} aria-label={`Extra ${s} not in MoneyMate`}
                        onChange={e => set({ extra: { ...p.extra, [s]: Math.max(0, Number(e.target.value) || 0) } })}
                        className="w-24 px-2 py-1 rounded-lg bg-mm-bg2 border border-mm-line/15 text-xs text-mm-text text-right number-display focus:outline-none focus:border-mm-gold/60" />
                    </div>
                    {room > 0 && p.grossSalary > 0 && result.better === 'old' && (
                      <p className="text-[11px] text-mm-positive mt-1">Investing {formatCurrency(room)} more here could save about {formatCurrency(room * marginal)}.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Detected payments */}
      <section className="glass-card p-5 mt-5">
        <h2 className="text-sm font-semibold text-mm-text">Tax-relevant payments in FY {fy}</h2>
        <p className="text-xs text-mm-muted mt-0.5 mb-3">Confirm the ones that count, or remove ones that don’t.</p>
        {items.length === 0 ? (
          <p className="text-sm text-mm-text2 py-4">Nothing found yet. Payments like PPF, LIC, health insurance, NPS and rent are picked up automatically.</p>
        ) : (
          <ul className="divide-y divide-mm-line/8">
            {items.sort((a, b) => +new Date(b.date) - +new Date(a.date)).map(t => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="px-2 py-0.5 rounded-md bg-mm-gold/12 text-mm-gold text-[11px] font-semibold shrink-0 w-16 text-center">{t.section === '80CCD1B' ? '80CCD' : t.section}</span>
                <span className="flex-1 min-w-0"><span className="block text-sm text-mm-text truncate">{t.description}</span><span className="text-[11px] text-mm-muted">{formatDate(t.date)}{t.detected ? ' · detected' : ' · confirmed'}</span></span>
                <span className="text-sm text-mm-text number-display">{formatCurrency(t.amount)}</span>
                {t.detected && <button onClick={() => tag(t.id, t.section)} className="p-1.5 rounded-lg text-mm-positive hover:bg-mm-positive/10" aria-label="Confirm"><Check size={15} /></button>}
                <button onClick={() => tag(t.id, 'none')} className="p-1.5 rounded-lg text-mm-muted hover:text-mm-negative hover:bg-mm-negative/10" aria-label="Not tax-related"><X size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex gap-2 text-xs text-mm-muted mt-5 max-w-3xl leading-relaxed">
        <Info size={14} className="shrink-0 mt-0.5" />
        Estimates use the slabs from Union Budget 2025 for salaried individuals, including the ₹75,000 / ₹50,000 standard deductions, the 87A rebate and 4% cess. Surcharge above ₹50 lakh, capital gains and special cases aren’t covered, and rules change each budget. This isn’t tax advice: check with a chartered accountant before filing.
      </p>
    </div>
  );
};
