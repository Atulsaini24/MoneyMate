import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, FileSpreadsheet, UploadCloud, Check, Sparkles, X, Info, CopyCheck, Wand2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseSmsBatch } from '@/lib/importers/sms';
import { parseStatement } from '@/lib/importers/statement';
import { parseStatementLines, pdfLines, PdfPasswordError } from '@/lib/importers/pdfStatement';
import { markDuplicates, type ParsedEntry } from '@/lib/importers/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { formatCurrency, formatDate } from '@/lib/utils';
import { confetti, haptic } from '@/lib/fx';

const SAMPLE = `Dear UPI user A/C X1234 debited by 250.00 on date 24Oct26 trf to SWIGGY Refno 429812345678. If not u? call 1800111109. -SBI

Rs.1,499.00 spent on HDFC Bank Card x4321 at AMAZON on 2026-10-23:12:01:22. Avl Lmt: Rs.85,000.00

Your A/c XX5678 is credited with Rs 85,000.00 on 01-Oct-26 by NEFT from INFOSYS LTD. Avl Bal Rs 1,20,000.00

Sent Rs.380.00 From HDFC Bank A/C *1234 To UBER INDIA On 22/10/26 Ref 429876543210

Your OTP for transaction of Rs 500 is 123456. Do not share.`;

type Mode = 'sms' | 'csv';
const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

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
    <div className="min-h-screen pb-40 lg:pb-28">
      <div className="px-4 md:px-6 py-5 md:py-6 max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-[2rem] font-serif text-mm-text tracking-tight">Import transactions</h1>
          <p className="text-sm text-mm-text2 mt-1 max-w-xl">
            Paste bank SMS or drop a statement. MoneyMate reads amounts, dates and merchants, picks categories, and skips anything you’ve already added.
          </p>
        </header>

        {/* Mode switch */}
        <div role="tablist" className="relative inline-flex p-1 rounded-2xl bg-mm-bg2 border border-mm-line/12 mb-5">
          {([['sms', 'Paste SMS', MessageSquareText], ['csv', 'Bank statement', FileSpreadsheet]] as const).map(([id, label, Icon]) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => { setMode(id); reset(); }}
              className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === id ? 'text-mm-on-gold' : 'text-mm-text2 hover:text-mm-text'}`}>
              {mode === id && <motion.span layoutId="import-tab" className="absolute inset-0 -z-10 rounded-xl bg-mm-gold" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mode === 'sms' ? (
            <motion.div key="sms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid lg:grid-cols-[1fr_280px] gap-4">
              <div className="glass-card p-1.5">
                <textarea
                  value={sms}
                  onChange={e => { setSms(e.target.value); reset(); }}
                  placeholder={'Paste one or more bank SMS here.\nSeparate messages with a blank line.'}
                  rows={8}
                  aria-label="Bank SMS"
                  className="w-full resize-y min-h-44 bg-transparent p-4 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none leading-relaxed font-mono"
                />
                <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-mm-line/8">
                  <span className="text-xs text-mm-muted" aria-live="polite">
                    {sms.trim() ? `${result.entries.length} found${result.skipped ? ` · ${result.skipped} ignored (OTP, offers, reminders)` : ''}` : 'Nothing pasted yet'}
                  </span>
                  <button onClick={() => { setSms(SAMPLE); reset(); }} className="flex items-center gap-1.5 text-xs font-medium text-mm-gold hover:text-mm-gold-light">
                    <Wand2 size={13} /> Try sample messages
                  </button>
                </div>
              </div>
              <aside className="glass-card p-4 text-sm text-mm-text2 space-y-2.5">
                <p className="flex items-center gap-2 font-medium text-mm-text"><Info size={15} className="text-mm-gold" /> Getting your SMS</p>
                <p><b className="text-mm-text font-medium">Android:</b> open Messages, long-press each bank SMS, then Copy. Several at once works too.</p>
                <p><b className="text-mm-text font-medium">iPhone:</b> long-press a message, tap Copy, paste here and repeat.</p>
                <p className="text-xs text-mm-muted">Works with SBI, HDFC, ICICI, Axis, Kotak and most UPI apps. Messages stay on your device until you import.</p>
              </aside>
            </motion.div>
          ) : (
            <motion.div key="csv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.pdf,text/csv,application/pdf" className="hidden" onChange={e => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
              <button
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); }}
                className={`spotlight w-full rounded-[22px] border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-all ${
                  dragging ? 'border-mm-gold bg-mm-gold/8 scale-[1.01]' : 'border-mm-line/25 bg-mm-bg2/60 hover:border-mm-gold/50'
                }`}
              >
                <motion.span animate={dragging ? { y: -6, scale: 1.08 } : { y: 0, scale: 1 }} className="w-14 h-14 rounded-2xl bg-mm-gold/12 text-mm-gold flex items-center justify-center">
                  <UploadCloud size={26} />
                </motion.span>
                <span className="text-base font-medium text-mm-text">{csv ? csv.name : 'Drop your statement PDF or CSV here'}</span>
                <span className="text-sm text-mm-muted max-w-md">
                  {csv ? `${result.entries.length} transactions found${result.skipped ? `, ${result.skipped} rows skipped` : ''}. Choose another file to replace it.`
                    : 'PDF or CSV from net banking (HDFC, SBI, ICICI, Axis and others). Password-protected PDFs work too. Files are read on your device.'}
                </span>
              </button>
              {result.error && <p className="mt-3 text-sm text-mm-negative">{result.error}</p>}
              {pdfPending && (
                <form onSubmit={e => { e.preventDefault(); readPdf(pdfPending.file, pdfPw); }} className="mt-4 glass-card p-4 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-mm-text2 flex-1 min-w-48">This PDF is password-protected. Banks often use your date of birth or customer ID.</p>
                  <input type="password" autoFocus value={pdfPw} onChange={e => setPdfPw(e.target.value)} placeholder="PDF password" aria-label="PDF password"
                    className="px-3 py-2 rounded-xl bg-mm-bg2 border border-mm-line/15 text-sm text-mm-text focus:outline-none focus:border-mm-gold/60" />
                  <button className="px-4 py-2 rounded-xl bg-mm-gold text-mm-on-gold text-sm font-semibold">Unlock</button>
                  {pdfPending.error && <p className="w-full text-xs text-mm-negative">{pdfPending.error}</p>}
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview */}
        {entries.length > 0 && (
          <section className="mt-7" aria-label="Review before importing">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-mm-text flex items-center gap-2"><Sparkles size={15} className="text-mm-gold" /> Review {entries.length} transactions</h2>
              <div className="flex gap-3 text-xs">
                <button onClick={() => selectAll(true)} className="text-mm-gold hover:text-mm-gold-light">Select all</button>
                <button onClick={() => selectAll(false)} className="text-mm-muted hover:text-mm-text">Clear</button>
              </div>
            </div>
            <ul className="space-y-2">
              {entries.map((e, i) => {
                const on = isSelected(e);
                const cats = e.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                const info = allCats.find(c => c.name === e.category);
                return (
                  <motion.li key={e.key}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 14) * 0.035, ease: [0.16, 1, 0.3, 1] }}
                    className={`glass-subtle flex items-center gap-3 p-3 transition-opacity ${on ? '' : 'opacity-50'}`}>
                    <button onClick={() => toggle(e.key)} role="checkbox" aria-checked={on} aria-label={`Include ${e.description}`}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${on ? 'bg-mm-gold border-mm-gold text-mm-on-gold' : 'border-mm-line/40'}`}>
                      {on && <Check size={13} strokeWidth={3} />}
                    </button>
                    <CategoryIcon name={info?.icon || 'Circle'} color={info?.color || '#D6BC86'} size={15} />
                    <div className="flex-1 min-w-0">
                      <input value={e.description}
                        onChange={ev => setOverrides(o => ({ ...o, [e.key]: { ...o[e.key], description: ev.target.value } }))}
                        aria-label="Description"
                        className="w-full bg-transparent text-sm text-mm-text focus:outline-none focus:bg-mm-bg2 rounded px-1 -mx-1 truncate" />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-[11px] text-mm-muted">
                        <span>{formatDate(e.date)}</span>
                        <span>{e.paymentMethod}</span>
                        {e.account && <span>a/c ••{e.account}</span>}
                        <select value={e.category} aria-label="Category"
                          onChange={ev => setOverrides(o => ({ ...o, [e.key]: { ...o[e.key], category: ev.target.value } }))}
                          className="bg-mm-bg2 border border-mm-line/15 rounded-md px-1.5 py-0.5 text-[11px] text-mm-text2 focus:outline-none">
                          {cats.map(c => <option key={c.name}>{c.name}</option>)}
                        </select>
                        {e.duplicate && <span className="inline-flex items-center gap-1 text-mm-warning"><CopyCheck size={11} /> Already added</span>}
                      </div>
                    </div>
                    <span className={`text-sm font-medium number-display shrink-0 ${e.type === 'income' ? 'text-mm-positive' : 'text-mm-text'}`}>
                      {e.type === 'income' ? '+' : '−'}{formatCurrency(e.amount)}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* Sticky import bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="fixed left-0 right-0 lg:left-[240px] bottom-24 lg:bottom-6 z-30 px-4 pointer-events-none">
            <div className="max-w-3xl mx-auto glass-card-elevated liquid-dock pointer-events-auto flex items-center gap-4 p-3 pl-5">
              <div className="flex-1 min-w-0 text-sm">
                <p className="text-mm-text font-medium">{selected.length} selected</p>
                <p className="text-xs text-mm-muted number-display truncate">
                  {totalOut > 0 && `−${formatCurrency(totalOut)} out`}{totalOut > 0 && totalIn > 0 && ' · '}{totalIn > 0 && `+${formatCurrency(totalIn)} in`}
                </p>
              </div>
              <button onClick={() => { setSms(''); setCsv(null); reset(); }} className="p-2.5 rounded-xl text-mm-muted hover:text-mm-text hover:bg-mm-text/5" aria-label="Discard">
                <X size={18} />
              </button>
              <button onClick={doImport} className="px-5 py-2.5 rounded-xl bg-mm-gold text-mm-on-gold text-sm font-semibold hover:bg-mm-gold-light active:scale-95 transition-all">
                Import {selected.length}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
