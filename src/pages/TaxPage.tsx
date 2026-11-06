import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Check, X, ReceiptIndianRupee } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SECTIONS, compareRegimes, fyOf, sectionTotals } from '@/lib/tax';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { Badge, IconButton, Input, MoneyInput, Page, PageHeader, Segmented, Switch, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { TaxSection } from '@/types';

const DEFAULT = { grossSalary: 0, otherIncome: 0, basic: 0, hraReceived: 0, metro: true, extra: {} as Partial<Record<TaxSection, number>> };

const Num: React.FC<{ label: string; value: number; onChange: (n: number) => void; hint?: string }> = ({ label, value, onChange, hint }) => (
  <label className="block">
    <span className="block text-[13px] font-medium text-mm-text2 mb-1.5">{label}</span>
    <MoneyInput value={value || ''} placeholder="0" onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))} />
    {hint && <span className="block text-xs text-mm-muted mt-1.5">{hint}</span>}
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

  const sections = (Object.keys(SECTIONS) as TaxSection[]).filter(x => x !== 'HRA');

  return (
    <Page>
      <PageHeader title="Tax planner" subtitle="Compare the old and new regimes using your salary and the tax-saving payments you’ve already made."
        actions={<Segmented label="Financial year" value={fy} onChange={setFy} options={[{ value: currentFy, label: `FY ${currentFy}` }, { value: prevFy, label: `FY ${prevFy}` }]} />} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 items-start">
        <section className="panel p-5 sm:p-6 space-y-4">
          <h2 className="text-[17px] font-semibold text-mm-text">Your income</h2>
          <Num label="Yearly gross salary" hint="CTC minus the employer’s PF contribution" value={p.grossSalary} onChange={v => set({ grossSalary: v })} />
          <Num label="Other income" hint="Interest, freelance work, rent received" value={p.otherIncome} onChange={v => set({ otherIncome: v })} />
          <div className="pt-4 border-t border-mm-line/8 space-y-4">
            <h3 className="text-[15px] font-semibold text-mm-text">House rent allowance <span className="font-normal text-mm-muted">(optional)</span></h3>
            <div className="grid grid-cols-2 gap-3">
              <Num label="Basic salary, yearly" value={p.basic} onChange={v => set({ basic: v })} />
              <Num label="HRA received, yearly" value={p.hraReceived} onChange={v => set({ hraReceived: v })} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-mm-text2">I live in Delhi, Mumbai, Kolkata or Chennai</span>
              <Switch checked={p.metro} onChange={() => set({ metro: !p.metro })} label="Metro city" />
            </div>
            <p className="text-[13px] text-mm-muted">Rent found in your transactions this year: <b className="text-mm-text tabular">{formatCurrency(rentPaid)}</b></p>
          </div>
        </section>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(['new', 'old'] as const).map(k => {
              const r = k === 'new' ? result.newRegime : result.oldRegime;
              const win = result.better === k && p.grossSalary > 0;
              return (
                <motion.div key={k} layout className={cn('panel p-4 sm:p-5', win && 'border-mm-accent/50 bg-mm-accent/[0.05]')}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-mm-text2">{k === 'new' ? 'New regime' : 'Old regime'}</p>
                    {win && <Badge tone="accent">Lower</Badge>}
                  </div>
                  <AnimatedNumber value={r.tax} className="block amount text-2xl sm:text-[2rem] font-semibold text-mm-text mt-1" />
                  <p className="text-xs text-mm-muted mt-1 tabular">{(r.effectiveRate * 100).toFixed(1)}% of income · taxable {formatCurrency(r.taxable)}</p>
                </motion.div>
              );
            })}
          </div>
          <p className="text-[15px] text-mm-text2 px-1">
            {p.grossSalary > 0
              ? result.saving > 0 ? <>The <b className="text-mm-text">{result.better} regime</b> saves you <b className="text-mm-positive tabular">{formatCurrency(result.saving)}</b> this year.</> : <>Both regimes come out the same.</>
              : 'Enter your salary to compare the two regimes.'}
          </p>

          <section className="panel p-5 sm:p-6">
            <h2 className="text-[17px] font-semibold text-mm-text">Deductions</h2>
            <p className="text-[13px] text-mm-muted mt-0.5 mb-5">Old regime only. Found in your transactions; add anything paid outside MoneyMate, like EPF deducted from salary.</p>
            <div className="space-y-5">
              {sections.map(sec => {
                const c = claimed(sec), cap = SECTIONS[sec].cap, room = cap ? Math.max(0, cap - c) : 0;
                return (
                  <div key={sec}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-medium text-mm-text">{SECTIONS[sec].label}</span>
                      <span className="text-[13px] text-mm-muted tabular">{formatCurrency(c)}{cap ? ` of ${formatCurrency(cap)}` : ''}</span>
                    </div>
                    {cap && <div className="progress-track mt-2"><div className="progress-fill bg-mm-accent" style={{ width: `${Math.min(100, (c / cap) * 100)}%` }} /></div>}
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <span className="text-[13px] text-mm-muted">{SECTIONS[sec].hint}</span>
                      <Input type="number" inputMode="numeric" min={0} placeholder="Add" value={p.extra[sec] || ''} aria-label={`Extra ${SECTIONS[sec].label} paid outside MoneyMate`}
                        onChange={e => set({ extra: { ...p.extra, [sec]: Math.max(0, Number(e.target.value) || 0) } })} className="!w-28 !h-9 text-right tabular sm:text-sm" />
                    </div>
                    {room > 0 && p.grossSalary > 0 && result.better === 'old' && (
                      <p className="text-[13px] text-mm-positive mt-1.5">Putting {formatCurrency(room)} more here could save about {formatCurrency(room * marginal)}.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <section className="panel p-5 sm:p-6 mt-4">
        <h2 className="text-[17px] font-semibold text-mm-text">Tax-related payments in FY {fy}</h2>
        <p className="text-[13px] text-mm-muted mt-0.5 mb-2">Confirm the ones that count, or remove ones that don’t.</p>
        {items.length === 0 ? (
          <EmptyState compact icon={ReceiptIndianRupee} title="None found yet" description="PPF, LIC, health insurance, NPS and rent payments are picked up automatically from your transactions." />
        ) : (
          <ul className="divide-hairline">
            {[...items].sort((a, b) => +new Date(b.date) - +new Date(a.date)).map(t => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <Badge tone="accent" className="w-16 justify-center shrink-0">{t.section === '80CCD1B' ? '80CCD' : t.section}</Badge>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium text-mm-text truncate">{t.description}</span>
                  <span className="text-[13px] text-mm-muted">{formatDate(t.date)} · {t.detected ? 'found automatically' : 'confirmed'}</span>
                </span>
                <span className="text-[15px] font-semibold text-mm-text tabular">{formatCurrency(t.amount)}</span>
                {t.detected && <IconButton size="sm" label="Confirm" icon={Check} tone="accent" onClick={() => tag(t.id, t.section)} />}
                <IconButton size="sm" label="Not tax-related" icon={X} tone="danger" onClick={() => tag(t.id, 'none')} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex gap-2 text-[13px] text-mm-muted mt-5 max-w-3xl leading-relaxed">
        <Info size={15} className="shrink-0 mt-0.5" />
        Estimates use the Union Budget 2025 slabs for salaried individuals: the ₹75,000 and ₹50,000 standard deductions, the section 87A rebate and 4% cess. Surcharge above ₹50 lakh, capital gains and special cases aren’t covered, and rules change with each budget. This isn’t tax advice; check with a chartered accountant before filing.
      </p>
    </Page>
  );
};
