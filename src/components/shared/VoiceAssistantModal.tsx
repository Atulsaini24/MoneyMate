import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, X, Check, AlertCircle, ArrowRight, Wallet, PiggyBank } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseVoiceInput, ParsedVoiceCommand } from '@/lib/voiceParser';
import { PaymentSuccessOverlay } from '@/components/shared/PaymentSuccessOverlay';
import { getCurrentMonth } from '@/lib/utils';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English (US)' },
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, addBudget, settings, showToast } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceCommand | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const lastParsedRef = useRef<ParsedVoiceCommand | null>(null);

  // Keep lastParsedRef updated
  useEffect(() => {
    lastParsedRef.current = parsedResult;
  }, [parsedResult]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Clear timers helper
  const clearTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  // Auto-confirm logic when silence is detected after sentence completion
  const triggerAutoConfirm = (parsed: ParsedVoiceCommand) => {
    clearTimers();
    let timeLeft = 2; // 2 seconds countdown
    setCountdown(timeLeft);

    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);
        executeEntry(parsed);
      } else {
        setCountdown(timeLeft);
      }
    }, 1000);
  };

  const executeEntry = (parsed: ParsedVoiceCommand) => {
    if (!parsed || !parsed.amount) return;

    if (parsed.action === 'add_budget') {
      addBudget({
        category: parsed.category,
        limit: parsed.amount,
        month: getCurrentMonth(),
        alertThreshold: 80,
      });
      showToast(`Budget for ${parsed.category} set to ${settings.currencySymbol}${parsed.amount}`, 'success');
    } else {
      addTransaction({
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        paymentMethod: parsed.paymentMethod,
        date: new Date().toISOString(),
        notes: `Voice log: "${parsed.rawText}"`,
      });
    }

    // Audio confirmation chime
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `${parsed.category} ${parsed.action === 'add_budget' ? 'budget' : 'entry'} of ${settings.currencySymbol} ${parsed.amount} authorized.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Silent fallback
      }
    }

    stopListening();
    setShowSuccessOverlay(true);
  };

  const startListening = () => {
    clearTimers();
    setErrorMsg('');
    setTranscript('');
    setParsedResult(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setIsManualMode(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);

        if (current.trim()) {
          const parsed = parseVoiceInput(current);
          setParsedResult(parsed);

          // If a valid amount is parsed, start the auto-confirm countdown upon pause
          if (parsed.amount && parsed.amount > 0) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              triggerAutoConfirm(parsed);
            }, 1200); // 1.2s pause triggers countdown
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice recognition note:', event.error);
        // Ignore aborted or no-speech events so ugly error messages do not appear
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorMsg(`Microphone: ${event.error}. You can also type below.`);
        }
        if (event.error === 'not-allowed') {
          setIsListening(false);
          setIsManualMode(true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition init error:', err);
      setIsListening(false);
      setIsManualMode(true);
    }
  };

  const stopListening = () => {
    clearTimers();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  // Toggle listening
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle manual keyboard submission fallback
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const parsed = parseVoiceInput(manualInput.trim());
    if (parsed.amount) {
      setParsedResult(parsed);
      executeEntry(parsed);
    } else {
      showToast('Could not detect an amount. E.g. "10$ on tea"', 'error');
    }
  };

  // Handle immediate manual confirmation
  const handleManualConfirm = () => {
    clearTimers();
    if (parsedResult && parsedResult.amount) {
      executeEntry(parsedResult);
    }
  };

  // Modal lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsManualMode(false);
      setTranscript('');
      setManualInput('');
      setParsedResult(null);
      setErrorMsg('');
      const t = setTimeout(() => {
        startListening();
      }, 250);
      return () => clearTimeout(t);
    } else {
      stopListening();
      clearTimers();
    }
  }, [isOpen, selectedLang]);

  const handleSuccessComplete = () => {
    setShowSuccessOverlay(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="overlay-bg absolute inset-0 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative z-10 w-full max-w-md bg-[#141418] border border-[rgba(214,188,134,0.25)] rounded-3xl p-5 md:p-6 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(214,188,134,0.1)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/30">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-[#F5F1E8] font-serif tracking-tight">
                    MoneyMate Voice AI
                  </h3>
                  <p className="text-[10px] text-[#77736D]">Hindi • Punjabi • English</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-[#19191E] border border-[rgba(214,188,134,0.2)] text-[#D6BC86] focus:outline-none focus:border-[#D6BC86]/60 cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-[#77736D] hover:text-[#F5F1E8] hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Microphone Visualizer Center */}
            <div className="py-6 flex flex-col items-center justify-center relative">
              {/* Outer pulsing animated rings */}
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.6, 2], opacity: [0.5, 0.2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                    className="absolute w-20 h-20 rounded-full border border-[#D6BC86]/40 pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1.7], opacity: [0.6, 0.25, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: 0.3, ease: 'easeOut' }}
                    className="absolute w-20 h-20 rounded-full border border-[#83C9A5]/40 pointer-events-none"
                  />
                </>
              )}

              {/* Central Glowing Mic Button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleMicClick}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#83C9A5] to-[#D6BC86] text-[#0B0B0D] shadow-[#83C9A5]/25 ring-4 ring-[#83C9A5]/30'
                    : 'bg-[#1D1D24] text-[#D6BC86] border border-[#D6BC86]/40 hover:border-[#D6BC86]'
                }`}
              >
                {isListening ? (
                  <Mic size={32} className="animate-pulse" />
                ) : (
                  <MicOff size={28} className="text-[#77736D]" />
                )}
              </motion.button>

              <span className="text-xs font-medium text-[#B6B0A5] mt-3 tracking-wide">
                {isListening ? 'Listening... Speak naturally' : 'Tap microphone to speak'}
              </span>

              {/* Examples Chip */}
              <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#101014] border border-[rgba(214,188,134,0.08)] text-center max-w-xs">
                <span className="text-[10px] text-[#77736D] italic">
                  💬 "I spent 10$ on tea" • "10$ kharche chai teh ohnu add krde food ch"
                </span>
              </div>
            </div>

            {/* Live Transcript / Input Display */}
            <div className="bg-[#0F0F12] border border-[rgba(214,188,134,0.12)] rounded-2xl p-3 min-h-[60px] flex items-center justify-center text-center">
              {transcript ? (
                <p className="text-xs md:text-sm font-medium text-[#F5F1E8] italic">
                  "{transcript}"
                </p>
              ) : (
                <p className="text-[11px] text-[#77736D] italic">
                  {isListening ? 'Speak your expense, income, or budget...' : 'Your spoken words will appear here'}
                </p>
              )}
            </div>

            {/* Auto-Confirm Detected Transaction Card */}
            {parsedResult && parsedResult.amount ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3.5 rounded-2xl bg-[#191921] border border-[#D6BC86]/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D6BC86] flex items-center gap-1.5">
                    {parsedResult.action === 'add_budget' ? <PiggyBank size={14} /> : <Wallet size={14} />}
                    {parsedResult.action === 'add_budget' ? 'Budget Detected' : 'Outflow Detected'}
                  </span>
                  {countdown !== null && (
                    <span className="text-[10px] font-bold text-[#83C9A5] animate-pulse">
                      Auto-adding in {countdown}s...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-[#F5F1E8]">
                      {settings.currencySymbol}{parsedResult.amount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#B6B0A5] font-medium">
                      {parsedResult.description} • <span className="text-[#D6BC86]">{parsedResult.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleManualConfirm}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-[11px] font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    Confirm Now
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* Non-intrusive Manual Fallback Text Input */}
            <form onSubmit={handleManualSubmit} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder='Or type e.g. "10$ tea in food"'
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0F0F12] border border-[rgba(214,188,134,0.12)] text-xs text-[#F5F1E8] placeholder:text-[#55524E] focus:outline-none focus:border-[#D6BC86]/50"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-[#1A1A22] border border-[rgba(214,188,134,0.2)] text-[#D6BC86] hover:text-[#F5F1E8] text-xs font-semibold active:scale-95 transition-all"
              >
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Error Message if critical */}
            {errorMsg && (
              <div className="mt-2.5 p-2 rounded-xl bg-[#D98282]/10 border border-[#D98282]/25 flex items-center gap-2 text-[11px] text-[#D98282]">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Full-screen Green Payment Success Animation */}
      <PaymentSuccessOverlay
        isOpen={showSuccessOverlay}
        amount={parsedResult?.amount || 0}
        type={parsedResult?.type || 'expense'}
        description={parsedResult?.description || ''}
        currencySymbol={settings.currencySymbol}
        onComplete={handleSuccessComplete}
      />
    </AnimatePresence>
  );
};
