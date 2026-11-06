import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, RotateCcw, Sparkles, Loader2, Search, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
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
          return <L key={i} className={`space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'} marker:text-mm-accent`}>{lines.map((l, k) => <li key={k}>{inline(l.replace(/^\s*([-*•]|\d+\.)\s/, ''))}</li>)}</L>;
        }
        return <p key={i}>{lines.map((l, k) => <React.Fragment key={k}>{k > 0 && <br />}{inline(l.replace(/^#+\s*/, ''))}</React.Fragment>)}</p>;
      })}
    </div>
  );
}

const Orb: React.FC<{ size?: number; busy?: boolean }> = ({ size = 32, busy }) => (
  <span className={`relative shrink-0 rounded-full bg-mm-note text-[var(--color-mm-marigold)] flex items-center justify-center ${busy ? 'animate-pulse' : ''}`} style={{ width: size, height: size }} aria-hidden>
    <Sparkles size={size * 0.48} />
  </span>
);

export const AskPage: React.FC = () => {
  const app = useApp();
  const { user, exitGuest, isConfigured } = useAuth();
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
      setError(e?.message === 'Not signed in' ? 'Ask MoneyMate needs an account, because questions are answered by an AI service on the server.' : e?.message || 'Something went wrong. Try again.');
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
    <div className="flex flex-col min-h-[calc(100dvh-57px)] lg:min-h-[calc(100dvh-65px)]">
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {visible.length === 0 ? (
          <div className="text-center pt-4 sm:pt-10">
            <span className="inline-flex"><Orb size={60} /></span>
            <h1 className="text-[1.75rem] sm:text-[2.25rem] leading-tight font-semibold text-mm-text mt-5">Ask about your money</h1>
            <p className="text-[15px] text-mm-text2 mt-2 max-w-md mx-auto leading-relaxed">
              Answers come from your own transactions, budgets and goals. Every figure is looked up, not guessed.
            </p>
            {!user ? (
              <div className="panel p-5 mt-8 max-w-md mx-auto text-left">
                <p className="text-[15px] font-semibold text-mm-text">Ask MoneyMate needs an account</p>
                <p className="text-sm text-mm-text2 mt-1 leading-relaxed">
                  {isConfigured
                    ? 'Questions are answered by an AI service on the server, so it only works when you’re signed in. Your data on this device comes with you.'
                    : 'Questions are answered by an AI service on the server. Accounts aren’t turned on for this installation, so it isn’t available here.'}
                </p>
                {isConfigured && <Button icon={LogIn} className="mt-4" onClick={exitGuest}>Sign in</Button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 text-left">
                {SUGGESTIONS.map(q => (
                  <button key={q} onClick={() => ask(q)} className="panel lift px-4 py-3.5 text-[15px] text-mm-text2 hover:text-mm-text hover:border-mm-accent/40 text-left">{q}</button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setMessages([]); setError(''); }}>New chat</Button>
            </div>
            <AnimatePresence initial={false}>
              {visible.map(m => (
                <motion.div key={m.i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
                  {m.role === 'user' ? (
                    <p className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-mm-accent text-mm-on-accent text-[15px]">{m.text}</p>
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
              <div className="flex gap-3" role="status">
                <Orb busy />
                <div className="pt-1.5 space-y-1.5">
                  {steps.length === 0 && <p className="text-sm text-mm-muted flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Thinking…</p>}
                  {steps.map((st, k) => (
                    <p key={k} className="text-sm text-mm-muted flex items-center gap-2">
                      {k === steps.length - 1 ? <Loader2 size={15} className="animate-spin text-mm-accent" /> : <Search size={15} className="text-mm-positive" />} {st}…
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 text-sm text-mm-negative bg-mm-negative/10 rounded-xl p-3.5 max-w-3xl mx-auto">{error}</div>
        )}
      </div>

      {user && (
        <form onSubmit={e => { e.preventDefault(); ask(input); }}
          className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-4 z-20 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-3 bg-gradient-to-t from-mm-bg via-mm-bg to-transparent">
          <div className="flex items-end gap-2 p-1.5 pl-4 rounded-2xl bg-mm-card border border-mm-line/15 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.2)] focus-within:border-mm-accent focus-within:ring-4 focus-within:ring-mm-accent/15 transition">
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={1} aria-label="Ask a question"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              placeholder="Ask about spending, budgets or goals"
              className="flex-1 resize-none bg-transparent py-2.5 text-mm-text placeholder:text-mm-muted focus:outline-none focus-visible:outline-none max-h-40" />
            <button type="submit" disabled={!input.trim() || busy} aria-label="Send"
              className="w-10 h-10 rounded-xl bg-mm-accent text-mm-on-accent flex items-center justify-center disabled:opacity-40 active:scale-95 transition shrink-0">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={19} strokeWidth={2.4} />}
            </button>
          </div>
          <p className="text-xs text-mm-muted text-center mt-2">Answers can be wrong. Check important figures before acting on them.</p>
        </form>
      )}
    </div>
  );
};
