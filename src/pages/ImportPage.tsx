import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, FileSpreadsheet, UploadCloud, Check, X, Info, CopyCheck, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseSmsBatch } from '@/lib/importers/sms';
import { parseStatement } from '@/lib/importers/statement';
import { parseStatementLines, pdfLines, PdfPasswordError } from '@/lib/importers/pdfStatement';
import { markDuplicates, type ParsedEntry } from '@/lib/importers/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryInfo } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button, IconButton, Input, LinkButton, Page, PageHeader, Segmented, Textarea } from '@/components/ui';
import { confetti, haptic } from '@/lib/fx';

type Mode = 'sms' | 'csv';

export const ImportPage: React.FC = () => {
  const { transactions, addTransactions, showToast } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('sms');
  const [sms, setSms] = useState('');
  const [csv, setCsv] = useState<{ name: string; text: string; lines?: string[] } | null>(null);
  const [pdfPending, setPdfPending] = useState<{ file: File; error?: string } | null>(null);
  const [pdfPw, setPdfPw] = useState('');
  const [overrides, setOverrides] = useState<Record<string, Partial<ParsedEntry>>>({});
  const [excluded, setExcluded] = useState<Set<string> | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Parse live; keys are stable per input so selections survive re-renders
  const result = useMemo(() => {
    const r = mode === 'sms'
      ? { ...parseSmsBatch(sms, transactions), error: undefined as string | undefined }
      : csv?.lines ? { ...parseStatementLines(csv.lines, transactions), error: undefined as string | undefined }
      : csv ? parseStatement(csv.text, transactions) : { entries: [], skipped: 0, total: 0, error: undefined };
    const entries = markDuplicates(r.entries.map((e, i) => ({ ...e, key: `${mode}-${i}-${e.amount}` })), transactions);
    return { ...r, entries };
  }, [mode, sms, csv, transactions]);

  const entries = result.entries.map(e => ({ ...e, ...overrides[e.key] }));
  const isSelected = (e: ParsedEntry) => (excluded ? !excluded.has(e.key) : !e.duplicate);
  const selected = entries.filter(isSelected);
  const totalOut = selected.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalIn = selected.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);

  const toggle = (key: string) => {
    haptic(6);
    setExcluded(prev => {
      const base = prev ?? new Set(entries.filter(e => e.duplicate).map(e => e.key));
      const next = new Set(base);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const selectAll = (on: boolean) => setExcluded(on ? new Set() : new Set(entries.map(e => e.key)));
  const reset = () => { setOverrides({}); setExcluded(null); };

  const readFile = async (f?: File) => {
    if (!f) return;
    if (/\.pdf$/i.test(f.name)) return readPdf(f);
    if (!/\.(csv|txt|tsv)$/i.test(f.name)) {
      showToast('Export your statement as CSV from your bank’s website, then drop it here.', 'error');
      return;
    }
    reset();
    setCsv({ name: f.name, text: await f.text() });
  };

  const readPdf = async (f: File, password?: string) => {
    reset();
    try {
      const lines = await pdfLines(f, password);
      setPdfPending(null); setPdfPw('');
      setCsv({ name: f.name, text: '', lines });
    } catch (e) {
      if (e instanceof PdfPasswordError) setPdfPending({ file: f, error: password ? 'That password didn’t work.' : undefined });
      else showToast('Couldn’t read that PDF. Try the CSV export instead.', 'error');
    }
  };

  const doImport = () => {
    if (!selected.length) return;
    addTransactions(selected.map(e => ({
      type: e.type, amount: e.amount, description: e.description, category: e.category,
      date: e.date, paymentMethod: e.paymentMethod, notes: e.account ? `Imported · a/c ••${e.account}` : 'Imported',
    })));
    confetti({ count: 120 });
    haptic([15, 30, 15]);
    showToast(`Imported ${selected.length} transaction${selected.length === 1 ? '' : 's'}`);
    setSms(''); setCsv(null); reset();
    navigate('/transactions');
  };

  return (
    <Page width="default">
      <PageHeader title="Import" subtitle="Paste bank SMS or drop a statement. Amounts, dates and shops are read for you, categories are suggested, and anything you’ve already added is skipped." />

      <Segmented label="Import from" value={mode} onChange={m => { setMode(m); reset(); }} className="mb-5"
        options={[{ value: 'sms', label: <span className="flex items-center gap-2"><MessageSquareText size={15} />Bank SMS</span> }, { value: 'csv', label: <span className="flex items-center gap-2"><FileSpreadsheet size={15} />Statement file</span> }]} />

      {mode === 'sms' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4">
          <div className="panel p-2">
            <Textarea value={sms} onChange={e => { setSms(e.target.value); reset(); }} rows={9} aria-label="Bank SMS"
              placeholder={'Paste one or more bank SMS here.\nLeave a blank line between messages.'}
              className="!border-0 !ring-0 min-h-48 resize-y font-mono text-[13px] bg-transparent" />
            <div className="flex items-center justify-between gap-2 px-2.5 pb-1.5 pt-2 border-t border-mm-line/8">
              <span className="text-[13px] text-mm-muted" aria-live="polite">
                {sms.trim() ? `${result.entries.length} transaction${result.entries.length === 1 ? '' : 's'} found${result.skipped ? ` · ${result.skipped} ignored (OTPs, offers, reminders)` : ''}` : 'Nothing pasted yet'}
              </span>
              {sms && <LinkButton onClick={() => { setSms(''); reset(); }}>Clear</LinkButton>}
            </div>
          </div>
          <aside className="panel p-5 text-sm text-mm-text2 space-y-3 leading-relaxed">
            <p className="flex items-center gap-2 font-semibold text-mm-text"><Info size={16} className="text-mm-accent" /> Copying your SMS</p>
            <p><b className="text-mm-text font-medium">Android:</b> in Messages, long-press a bank SMS, select more if you like, then Copy.</p>
            <p><b className="text-mm-text font-medium">iPhone:</b> long-press a message, tap Copy, paste here, and repeat.</p>
            <p className="text-[13px] text-mm-muted">Works with SBI, HDFC, ICICI, Axis, Kotak and most UPI apps.</p>
            <p className="text-[13px] text-mm-muted flex gap-1.5"><Lock size={13} className="shrink-0 mt-0.5" />Read on this device. Nothing is sent anywhere until you import.</p>
          </aside>
        </div>
      ) : (
        <div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.pdf,text/csv,application/pdf" className="hidden" onChange={e => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}
            className={cn('w-full rounded-[20px] border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-colors',
              dragging ? 'border-mm-accent bg-mm-accent/[0.06]' : 'border-mm-line/20 bg-mm-card hover:border-mm-accent/50')}>
            <span className="w-14 h-14 rounded-2xl bg-mm-accent/10 text-mm-accent flex items-center justify-center"><UploadCloud size={26} /></span>
            <span className="text-base font-semibold text-mm-text">{csv ? csv.name : 'Choose or drop a statement'}</span>
            <span className="text-sm text-mm-muted max-w-md leading-relaxed">
              {csv ? `${result.entries.length} transactions found${result.skipped ? `, ${result.skipped} rows skipped` : ''}. Choose another file to replace it.`
                : 'PDF or CSV from net banking (HDFC, SBI, ICICI, Axis and others). Password-protected PDFs work too. Files are read on this device.'}
            </span>
          </button>
          {result.error && <p className="mt-3 text-sm text-mm-negative" role="alert">{result.error}</p>}
          {pdfPending && (
            <form onSubmit={e => { e.preventDefault(); readPdf(pdfPending.file, pdfPw); }} className="mt-4 panel p-4 flex flex-wrap items-center gap-3">
              <p className="text-sm text-mm-text2 flex-1 min-w-48">This PDF has a password. Banks often use your date of birth or customer ID.</p>
              <Input type="password" autoFocus value={pdfPw} onChange={e => setPdfPw(e.target.value)} placeholder="PDF password" aria-label="PDF password" className="!w-48" />
              <Button type="submit">Unlock</Button>
              {pdfPending.error && <p className="w-full text-[13px] text-mm-negative">{pdfPending.error}</p>}
            </form>
          )}
        </div>
      )}

      {entries.length > 0 && (
        <section className="mt-7" aria-label="Review before importing">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h2 className="text-[17px] font-semibold text-mm-text">Check {entries.length} transaction{entries.length === 1 ? '' : 's'}</h2>
            <div className="flex gap-4"><LinkButton onClick={() => selectAll(true)}>Select all</LinkButton><LinkButton className="text-mm-muted" onClick={() => selectAll(false)}>Select none</LinkButton></div>
          </div>
          <ul className="panel px-3 sm:px-4 divide-hairline">
            {entries.map((e, i) => {
              const on = isSelected(e);
              const cats = e.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
              const info = categoryInfo(e.category, e.type);
              return (
                <motion.li key={e.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.02 }}
                  className={cn('flex items-center gap-3 py-3 transition-opacity', !on && 'opacity-45')}>
                  <button onClick={() => toggle(e.key)} role="checkbox" aria-checked={on} aria-label={`Include ${e.description}`}
                    className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors', on ? 'bg-mm-accent text-mm-on-accent' : 'border-2 border-mm-line/25')}>
                    {on && <Check size={14} strokeWidth={3} />}
                  </button>
                  <CategoryIcon name={info.icon} color={info.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <input value={e.description} aria-label="Description"
                      onChange={ev => setOverrides(o => ({ ...o, [e.key]: { ...o[e.key], description: ev.target.value } }))}
                      className="w-full bg-transparent text-[15px] font-medium text-mm-text rounded-md px-1 -mx-1 focus:outline-none focus:bg-mm-bg2 truncate" />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[13px] text-mm-muted">
                      <span>{formatDate(e.date)}</span><span>{e.paymentMethod}</span>{e.account && <span>a/c ••{e.account}</span>}
                      <select value={e.category} aria-label="Category" onChange={ev => setOverrides(o => ({ ...o, [e.key]: { ...o[e.key], category: ev.target.value } }))}
                        className="bg-mm-bg2 rounded-md px-1.5 py-0.5 text-[13px] text-mm-text2 focus:outline-none focus:ring-2 focus:ring-mm-accent/30">
                        {cats.map(c => <option key={c.name}>{c.name}</option>)}
                      </select>
                      {e.duplicate && <span className="inline-flex items-center gap-1 text-mm-warning font-medium"><CopyCheck size={13} /> Already added</span>}
                    </div>
                  </div>
                  <span className={cn('amount font-semibold shrink-0', e.type === 'income' ? 'text-mm-positive' : 'text-mm-text')}>{e.type === 'income' ? '+' : '−'}{formatCurrency(e.amount)}</span>
                </motion.li>
              );
            })}
          </ul>
        </section>
      )}

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed left-0 right-0 lg:left-[256px] bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6 z-30 px-3 pointer-events-none">
            <div className="max-w-2xl mx-auto panel-raised rounded-2xl border border-mm-line/10 pointer-events-auto flex items-center gap-3 p-2.5 pl-4">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-mm-text">{selected.length} selected</p>
                <p className="text-[13px] text-mm-muted tabular truncate">
                  {totalOut > 0 && `−${formatCurrency(totalOut)} out`}{totalOut > 0 && totalIn > 0 && ' · '}{totalIn > 0 && `+${formatCurrency(totalIn)} in`}
                </p>
              </div>
              <IconButton label="Discard" icon={X} onClick={() => { setSms(''); setCsv(null); reset(); }} />
              <Button size="lg" onClick={doImport}>Import {selected.length}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Room so the import bar never covers the last row */}
      {selected.length > 0 && <div className="h-24" aria-hidden />}
    </Page>
  );
};
