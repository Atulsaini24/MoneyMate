import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Pencil } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useUI } from '@/context/UIContext';
import { parseVoiceInput, type ParsedVoiceCommand } from '@/lib/voiceParser';
import { formatCurrency, getCurrentMonth, cn } from '@/lib/utils';
import { categoryInfo } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button, Input, Select } from '@/components/ui';
import { CategoryIcon } from '@/components/shared/CategoryIcon';

const LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi / Hinglish' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'en-US', label: 'English (US)' },
];
const LANG_KEY = 'moneymate:voice-lang';

const getRecognition = () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

/**
 * Say or type something like "450 on groceries" or "got 30000 salary".
 * Nothing is saved until you confirm.
 */
export const VoiceAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addTransaction, addBudget } = useApp();
  const { openAddSheet } = useUI();
  const supported = typeof window !== 'undefined' && Boolean(getRecognition());
  const [lang, setLang] = useState(() => { try { return localStorage.getItem(LANG_KEY) || 'en-IN'; } catch { return 'en-IN'; } });
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedVoiceCommand | null>(null);
  const [error, setError] = useState('');
  const recRef = useRef<any>(null);

  const stop = useCallback(() => {
    const r = recRef.current;
    recRef.current = null;
    if (r) { r.onresult = r.onerror = r.onend = null; try { r.abort(); } catch { /* already stopped */ } }
    setListening(false);
  }, []);

  const update = (value: string) => {
    setText(value);
    setParsed(value.trim() ? parseVoiceInput(value.trim()) : null);
  };

  const start = useCallback(() => {
    const SR = getRecognition();
    if (!SR) return;
    stop();
    setError('');
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let out = '';
        for (let i = 0; i < e.results.length; i++) out += e.results[i][0].transcript;
        update(out.trim());
      };
      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Microphone access is blocked. Allow it in your browser settings, or type below.');
        else if (e.error === 'no-speech') setError('Didn’t catch that. Tap the mic and try again.');
        else if (e.error !== 'aborted') setError('Voice input stopped. Tap the mic to try again, or type below.');
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Couldn’t start the microphone. Type below instead.');
    }
  }, [lang, stop]);

  useEffect(() => {
    if (!isOpen) { stop(); return; }
    setText(''); setParsed(null); setError('');
    if (supported) { const t = setTimeout(start, 250); return () => clearTimeout(t); }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stop(), [stop]);

  const changeLang = (code: string) => {
    setLang(code);
    try { localStorage.setItem(LANG_KEY, code); } catch { /* private mode */ }
  };

  const ready = Boolean(parsed?.amount && parsed.amount > 0);
  const isBudget = parsed?.action === 'add_budget';
  const cat = parsed ? categoryInfo(parsed.category, parsed.type) : null;

  const save = () => {
    if (!parsed?.amount) return;
    stop();
    if (isBudget) {
      addBudget({ category: parsed.category, limit: parsed.amount, month: getCurrentMonth(), alertThreshold: 80 });
    } else {
      addTransaction({
        type: parsed.type, amount: parsed.amount, description: parsed.description, category: parsed.category,
        paymentMethod: parsed.paymentMethod, date: new Date().toISOString(), notes: `Said: “${parsed.rawText}”`,
      });
    }
    onClose();
  };

  const editFirst = () => {
    if (!parsed) return;
    stop();
    onClose();
    setTimeout(() => openAddSheet({ prefill: { type: parsed.type, amount: parsed.amount, description: parsed.description, category: parsed.category, paymentMethod: parsed.paymentMethod } }), 150);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Add by voice"
      description="Say it the way you’d text a friend: “450 on groceries”, “got 30000 salary”, “budget 5000 for food”."
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" icon={Pencil} onClick={editFirst} disabled={!ready || isBudget}>Edit</Button>
          <Button size="lg" className="flex-1" onClick={save} disabled={!ready}>
            {!ready ? 'Waiting for an amount' : isBudget ? `Set ${formatCurrency(parsed!.amount!, { reveal: true })} budget` : `Save ${formatCurrency(parsed!.amount!, { reveal: true })}`}
          </Button>
        </div>
      }>
      <div className="flex flex-col items-center pt-2 pb-1">
        {supported ? (
          <>
            <button onClick={listening ? stop : start} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Start listening'}
              className={cn('relative isolate w-20 h-20 rounded-full flex items-center justify-center transition-colors',
                listening ? 'bg-mm-accent text-mm-on-accent mm-listening' : 'bg-mm-bg2 text-mm-text2 hover:text-mm-text')}>
              {listening ? <Mic size={30} /> : <MicOff size={28} />}
            </button>
            <p className="text-sm text-mm-muted mt-3" aria-live="polite">{listening ? 'Listening…' : 'Tap the mic to speak'}</p>
            <div className="w-48 mt-3">
              <Select aria-label="Language" value={lang} onChange={e => { changeLang(e.target.value); }} className="h-9 sm:text-[13px]">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </Select>
            </div>
          </>
        ) : (
          <p className="text-sm text-mm-text2 text-center bg-mm-bg2 rounded-xl p-3.5">This browser doesn’t support voice input. Chrome, Edge and Safari do. You can type it instead.</p>
        )}
      </div>

      {error && <p className="text-sm text-mm-negative text-center mt-2" role="alert">{error}</p>}

      <div className="mt-5">
        <label htmlFor="voice-text" className="block text-[13px] font-medium text-mm-text2 mb-1.5">{supported ? 'What I heard (you can fix it)' : 'Type it'}</label>
        <Input id="voice-text" value={text} onChange={e => update(e.target.value)} placeholder="e.g. 250 auto to office" autoComplete="off"
          onKeyDown={e => { if (e.key === 'Enter' && ready) save(); }} />
      </div>

      {parsed && (
        <div className={cn('mt-4 rounded-2xl p-4 border', ready ? 'border-mm-accent/30 bg-mm-accent/[0.05]' : 'border-mm-line/10 bg-mm-bg2')}>
          {ready && cat ? (
            <div className="flex items-center gap-3">
              <CategoryIcon name={cat.icon} color={cat.color} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-mm-text truncate">{isBudget ? `Budget for ${parsed.category}` : parsed.description}</p>
                <p className="text-[13px] text-mm-muted">{isBudget ? 'This month' : `${parsed.type === 'income' ? 'Income' : parsed.type === 'transfer' ? 'Transfer' : 'Expense'} · ${parsed.category} · ${parsed.paymentMethod} · today`}</p>
              </div>
              <span className={cn('amount text-lg font-semibold', parsed.type === 'income' && !isBudget ? 'text-mm-positive' : 'text-mm-text')}>{formatCurrency(parsed.amount!, { reveal: true })}</span>
            </div>
          ) : (
            <p className="text-sm text-mm-text2">No amount yet. Include a number, like “<b className="text-mm-text">300</b> for lunch”.</p>
          )}
        </div>
      )}
    </Dialog>
  );
};
