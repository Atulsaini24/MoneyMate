import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, X, Check, ArrowRight, Wallet, PiggyBank, Globe, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseVoiceInput, ParsedVoiceCommand } from '@/lib/voiceParser';
import { PaymentSuccessOverlay } from '@/components/shared/PaymentSuccessOverlay';
import { getCurrentMonth } from '@/lib/utils';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi (हिन्दी / Hinglish)', flag: '🇮🇳' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, addBudget, settings, showToast } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceCommand | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState<number[]>([12, 24, 18, 32, 16]);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(false);

  // Clear timers
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

  // Animate audio waveform bars when listening
  useEffect(() => {
    if (isListening) {
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel([
          Math.floor(Math.random() * 28) + 8,
          Math.floor(Math.random() * 36) + 12,
          Math.floor(Math.random() * 48) + 16,
          Math.floor(Math.random() * 34) + 10,
          Math.floor(Math.random() * 26) + 8,
        ]);
      }, 120);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioLevel([8, 12, 16, 12, 8]);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isListening]);

  // Execute entry
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
        notes: `Voice: "${parsed.rawText}"`,
      });
    }

    // Audio chime feedback
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const text = `${parsed.category} ${parsed.action === 'add_budget' ? 'budget' : 'entry'} of ${settings.currencySymbol} ${parsed.amount} authorized.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }

    stopListening();
    setShowSuccessOverlay(true);
  };

  // Auto-confirm logic with countdown
  const triggerAutoConfirm = (parsed: ParsedVoiceCommand) => {
    clearTimers();
    let timeLeft = 2;
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

  // Start speech recognition instance
  const startListening = () => {
    isManuallyStoppedRef.current = false;
    clearTimers();
    setTranscript('');
    setParsedResult(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser. You can type below!', 'info');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      // continuous=false ensures native end event fires properly on mobile iOS/Android
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript;
          } else {
            interimStr += res[0].transcript;
          }
        }

        const fullText = (finalStr || interimStr).trim();
        if (fullText) {
          setTranscript(fullText);
          const parsed = parseVoiceInput(fullText);
          setParsedResult(parsed);

          if (parsed.amount && parsed.amount > 0) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              triggerAutoConfirm(parsed);
            }, 1000);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.log('[SpeechRecognition] notice:', event.error);
        if (event.error === 'not-allowed') {
          showToast('Please allow microphone permissions to speak', 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If not manually stopped, keep listening active unless auto-confirm is counting down
        if (!isManuallyStoppedRef.current && isOpen && !parsedResult?.amount) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isManuallyStoppedRef.current = true;
    clearTimers();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
  };

  // Toggle mic button
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Manual text input submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const parsed = parseVoiceInput(manualInput.trim());
    if (parsed.amount) {
      setParsedResult(parsed);
      executeEntry(parsed);
    } else {
      showToast('Could not detect amount. E.g. "10$ on tea in food"', 'error');
    }
  };

  // Modal lifecycle
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setManualInput('');
      setParsedResult(null);
      // Wait for user gesture or start if already permitted
      const t = setTimeout(() => {
        startListening();
      }, 200);
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
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop with luxury blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="overlay-bg absolute inset-0 backdrop-blur-xl bg-black/70"
          />

          {/* Modal Container: Bottom sheet on mobile, centered card on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="relative z-10 w-full sm:max-w-md bg-[#121216] border border-[#D6BC86]/25 rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden pb-8 sm:pb-6"
          >
            {/* Top ambient gold accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#D6BC86] to-transparent opacity-80" />

            {/* Mobile drag bar */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D6BC86]/25 to-[#D6BC86]/5 border border-[#D6BC86]/30 flex items-center justify-center text-[#D6BC86]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F1E8] tracking-tight font-serif">
                    MoneyMate Voice AI
                  </h3>
                  <p className="text-[10px] text-[#A39E95]">All Languages • Instant Detection</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Picker */}
                <div className="relative flex items-center">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1 rounded-lg bg-[#18181E] border border-[rgba(214,188,134,0.2)] text-[11px] font-semibold text-[#D6BC86] focus:outline-none focus:border-[#D6BC86]/60 cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 text-[#D6BC86] pointer-events-none" />
                </div>

                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-[#77736D] hover:text-[#F5F1E8] hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hero Mic & Waveform Area */}
            <div className="px-5 pt-6 pb-4 flex flex-col items-center justify-center relative">
              {/* Pulsing visual glow */}
              <div className="relative flex items-center justify-center">
                {isListening && (
                  <motion.div
                    animate={{ scale: [1, 1.4, 1.7], opacity: [0.6, 0.25, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                    className="absolute w-24 h-24 rounded-full bg-[#D6BC86]/20 pointer-events-none"
                  />
                )}

                {/* Main Mic Button */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleMicClick}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl cursor-pointer ${
                    isListening
                      ? 'bg-gradient-to-tr from-[#D6BC86] to-[#E9D8AF] text-[#0B0B0D] shadow-[#D6BC86]/30 ring-4 ring-[#D6BC86]/20'
                      : 'bg-[#18181E] text-[#D6BC86] border border-[#D6BC86]/40 hover:border-[#D6BC86]'
                  }`}
                  aria-label="Toggle Microphone"
                >
                  {isListening ? (
                    <Mic size={32} className="animate-pulse" />
                  ) : (
                    <MicOff size={28} className="text-[#77736D]" />
                  )}
                </motion.button>
              </div>

              {/* Status and Audio Level Waveform */}
              <div className="flex items-center gap-2 mt-4">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isListening ? 'text-[#D6BC86]' : 'text-[#77736D]'}`}>
                  {isListening ? 'Listening Live' : 'Tap Mic to Speak'}
                </span>
                {isListening && (
                  <div className="flex items-center gap-1 h-4">
                    {audioLevel.map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#D6BC86] rounded-full"
                        animate={{ height: `${h}px` }}
                        transition={{ duration: 0.12 }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Spoken Live Transcript Card */}
              <div className="w-full mt-4 p-3.5 rounded-2xl bg-[#0D0D10] border border-white/[0.08] min-h-[64px] flex items-center justify-center text-center">
                {transcript ? (
                  <p className="text-sm font-medium text-[#F5F1E8] tracking-tight italic">
                    "{transcript}"
                  </p>
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-xs text-[#B6B0A5] font-medium">
                      Speak in Hindi, Punjabi, or English
                    </p>
                    <p className="text-[10px] text-[#77736D] italic">
                      e.g. "I spent 10$ on tea" • "10$ kharche chai teh ohnu add krde food ch"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Parsed Result Auto-Card */}
            {parsedResult && parsedResult.amount ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#191922] to-[#141419] border border-[#D6BC86]/40 shadow-lg space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D6BC86] flex items-center gap-1.5">
                    {parsedResult.action === 'add_budget' ? <PiggyBank size={14} /> : <Wallet size={14} />}
                    {parsedResult.action === 'add_budget' ? 'Budget Ready' : 'Outflow Ready'}
                  </span>
                  {countdown !== null && (
                    <span className="text-[11px] font-bold text-[#83C9A5] animate-pulse">
                      Auto-saving in {countdown}s...
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#F5F1E8] number-display">
                      {settings.currencySymbol}{parsedResult.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#B6B0A5] font-medium mt-0.5">
                      {parsedResult.description} • <span className="text-[#D6BC86] font-semibold">{parsedResult.category}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => { clearTimers(); executeEntry(parsedResult); }}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    Confirm
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* Quick Type Fallback Field */}
            <form onSubmit={handleManualSubmit} className="mx-5 flex items-center gap-2">
              <input
                type="text"
                placeholder='Or type e.g. "10$ tea food" / "10$ kharche chai"'
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0D0D10] border border-white/[0.08] text-xs text-[#F5F1E8] placeholder:text-[#66635D] focus:outline-none focus:border-[#D6BC86]/50"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-[#1D1D26] border border-[#D6BC86]/30 text-[#D6BC86] hover:text-[#F5F1E8] active:scale-95 transition-all cursor-pointer"
                title="Send command"
              >
                <ArrowRight size={15} />
              </button>
            </form>
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
