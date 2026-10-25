import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, RotateCcw, Sparkles, Loader2, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { authedJson } from '@/lib/api';
import { runTool, TOOL_LABELS } from '@/lib/askTools';
import { haptic } from '@/lib/fx';

type Block = { type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: any } | { type: 'tool_result'; tool_use_id: string; content: string };
type Msg = { role: 'user' | 'assistant'; content: string | Block[] };

const SUGGESTIONS = [
  'Can I afford a ₹40,000 phone this month?',
  'How much have I spent on food in the last 3 months?',
  'Where could I cut back?',
  'Am I on track for my goals?',
  'What are my biggest purchases this month?',
  'Compare my spending this month with last month',
];
const STORE = 'moneymate:ask';

/** Minimal, safe markdown: bold, bullets, numbered lists, paragraphs. */
function Rich({ text }: { text: string }) {
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') ? <b key={i} className="text-mm-text font-semibold">{p.slice(2, -2)}</b> : <React.Fragment key={i}>{p}</React.Fragment>);
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every(l => /^\s*([-*•]|\d+\.)\s/.test(l))) {
          const ordered = /^\s*\d+\./.test(lines[0]);
          const L = ordered ? 'ol' : 'ul';
          return <L key={i} className={`space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-mm-gold`}>{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s/, ''))}</li>)}</L>;
        }
        return <p key={i}>{lines.map((l, k) => <React.Fragment key={k}>{k > 0 && <br />}{inline(l.replace(/^#+\s*/, ''))}</React.Fragment>)}</p>;
      })}
    </div>
  );
}

const Orb: React.FC<{ size?: number; busy?: boolean }> = ({ size = 32, busy }) => (
  <span className="relative shrink-0 rounded-full" style={{ width: size, height: size }}>
    <motion.span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, var(--color-mm-gold), var(--color-mm-positive), var(--color-mm-gold-light), var(--color-mm-gold))' }}
      animate={{ rotate: 360 }} transition={{ duration: busy ? 1.6 : 8, repeat: Infinity, ease: 'linear' }} />
    <span className="absolute inset-[2px] rounded-full bg-mm-bg flex items-center justify-center"><Sparkles size={size * 0.45} className="text-mm-gold" /></span>
  </span>
);

export const AskPage: React.FC = () => {
  const app = useApp();
  const [messages, setMessages] = useState<Msg[]>(() => { try { return JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch { return []; } });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef(app);
  ledgerRef.current = app;

  useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-40))); } catch { /* full */ } }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, steps]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    haptic(8);
    setInput(''); setError(''); setSteps([]); setBusy(true);
    let convo: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages(convo);
    const context = { today: new Date().toDateString(), currency: app.settings.currency, name: app.settings.name?.split(' ')[0] };
    try {
      for (let turn = 0; turn < 8; turn++) {
        const res = await authedJson<{ content: Block[]; stop_reason: string }>('/api/ask', { messages: convo, context });
        convo = [...convo, { role: 'assistant', content: res.content }];
        setMessages(convo);
        if (res.stop_reason !== 'tool_use') break;
        const results: Block[] = [];
        for (const b of res.content) {
          if (b.type !== 'tool_use') continue;
          setSteps(s => [...s, TOOL_LABELS[b.name] || b.name]);
          const { transactions, budgets, goals, friends, assets, groups, settings } = ledgerRef.current;
          const out = runTool(b.name, b.input, { transactions, budgets, goals, friends, assets, groups, settings });
          results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(out) });
        }
        convo = [...convo, { role: 'user', content: results }];
        setMessages(convo);
      }
    } catch (e: any) {
      setError(e?.message === 'Not signed in' ? 'Ask MoneyMate needs a signed-in account (it’s not available in demo mode).' : e?.message || 'Something went wrong.');
    } finally {
      setBusy(false); setSteps([]);
    }
  };

  // Only show what people care about: their questions and the assistant's prose
  const visible = messages.flatMap((m, i) => {
    if (typeof m.content === 'string') return [{ i, role: m.role, text: m.content }];
    const text = m.content.filter(b => b.type === 'text').map(b => (b as any).text).join('\n\n').trim();
    return text && m.role === 'assistant' ? [{ i, role: m.role, text }] : [];
  });

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col pb-32 lg:pb-6">
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 pt-6">
        {visible.length === 0 ? (
          <div className="pt-6 sm:pt-14 text-center">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }} className="inline-block">
              <Orb size={72} />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="font-serif text-3xl sm:text-4xl text-mm-text mt-6 tracking-tight">
              Ask anything about your money
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-mm-text2 mt-2 max-w-md mx-auto">
              Answers come from your own transactions, budgets and goals. Every number is looked up, never guessed.
            </motion.p>
            <div className="grid sm:grid-cols-2 gap-2.5 mt-8 text-left">
              {SUGGESTIONS.map((s, k) => (
                <motion.button key={s} onClick={() => ask(s)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + k * 0.05 }}
                  className="spotlight glass-subtle px-4 py-3 text-sm text-mm-text2 hover:text-mm-text hover:border-mm-gold/40 transition-colors text-left">
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            <div className="flex justify-end">
              <button onClick={() => { setMessages([]); setError(''); }} className="flex items-center gap-1.5 text-xs text-mm-muted hover:text-mm-text"><RotateCcw size={13} /> New chat</button>
            </div>
            <AnimatePresence initial={false}>
              {visible.map(m => (
                <motion.div key={m.i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
                  {m.role === 'user' ? (
                    <p className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-mm-gold/15 border border-mm-gold/25 text-sm text-mm-text">{m.text}</p>
                  ) : (
                    <>
                      <Orb />
                      <div className="min-w-0 flex-1 text-[15px] leading-relaxed text-mm-text2 pt-1"><Rich text={m.text} /></div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && (
              <div className="flex gap-3">
                <Orb busy />
                <div className="pt-1.5 space-y-1.5">
                  {steps.length === 0 && <p className="text-sm text-mm-muted flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Thinking…</p>}
                  {steps.map((s, k) => (
                    <motion.p key={k} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-mm-muted flex items-center gap-2">
                      {k === steps.length - 1 ? <Loader2 size={14} className="animate-spin text-mm-gold" /> : <Search size={14} className="text-mm-positive" />} {s}…
                    </motion.p>
                  ))}
                </div>
              </div>
            )}
            {error && <p role="alert" className="text-sm text-mm-negative bg-mm-negative/10 rounded-xl p-3">{error}</p>}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); ask(input); }}
        className="sticky bottom-24 lg:bottom-4 z-20 w-full max-w-3xl mx-auto px-4 md:px-6 mt-4">
        <div className="glass-card-elevated liquid-dock flex items-end gap-2 p-2 pl-4 focus-within:border-mm-gold/50">
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={1} aria-label="Ask a question"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder="Ask about your spending, budgets or goals…"
            className="flex-1 resize-none bg-transparent py-2.5 text-sm text-mm-text placeholder:text-mm-muted focus:outline-none focus-visible:outline-none max-h-40" />
          <button type="submit" disabled={!input.trim() || busy} aria-label="Send"
            className="w-10 h-10 rounded-xl bg-mm-gold text-mm-on-gold flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all shrink-0">
            {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.4} />}
          </button>
        </div>
        <p className="text-[11px] text-mm-muted text-center mt-2">Answers can be wrong. Check important numbers before acting on them.</p>
      </form>
    </div>
  );
};
