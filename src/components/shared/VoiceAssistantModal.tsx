import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Volume2, X, Check, Globe, AlertCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseVoiceInput, ParsedVoiceCommand } from '@/lib/voiceParser';
import { PaymentSuccessOverlay } from '@/components/shared/PaymentSuccessOverlay';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Available speech recognition languages
const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'en-US', label: 'English (US)' },
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, settings, showToast } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceCommand | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Initialize and manage recognition instance
  const startListening = () => {
    setErrorMsg('');
    setTranscript('');
    setParsedResult(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

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

        // Real-time parsing of interim or final result
        if (current.trim()) {
          const parsed = parseVoiceInput(current);
          setParsedResult(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMsg(`Microphone error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMsg('Could not activate microphone. Check browser permissions.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setTranscript('');
      setParsedResult(null);
      // Small timeout to allow animation to mount
      const t = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(t);
    } else {
      stopListening();
    }
  }, [isOpen, selectedLang]);

  // Voice confirmation text-to-speech feedback
  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback silently if audio blocked
      }
    }
  };

  const handleConfirmAdd = () => {
    if (!parsedResult || !parsedResult.amount) {
      showToast('Please specify a valid amount', 'error');
      return;
    }

    addTransaction({
      type: parsedResult.type,
      amount: parsedResult.amount,
      description: parsedResult.description,
      category: parsedResult.category,
      paymentMethod: parsedResult.paymentMethod,
      date: new Date().toISOString(),
      notes: `Voice log: "${parsedResult.rawText}"`,
    });

    // Provide friendly audio feedback
    const feedbackText = `${parsedResult.category} entry of ${settings.currencySymbol} ${parsedResult.amount} confirmed.`;
    speakFeedback(feedbackText);

    // Show full-screen green payment success animation
    setShowSuccessOverlay(true);
  };

  const handleSuccessOverlayComplete = () => {
    setShowSuccessOverlay(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-lg bg-[#141418] border border-[#D6BC86]/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
          >
            {/* Ambient gold glow aura */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#D6BC86]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(214,188,134,0.12)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D6BC86]/15 text-[#D6BC86] border border-[#D6BC86]/30">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F1E8] font-serif tracking-tight">
                    MoneyMate Voice AI
                  </h3>
                  <p className="text-[11px] text-[#77736D]">Multilingual Sovereign Ledger Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <div className="relative">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-[#19191E] border border-[rgba(214,188,134,0.2)] text-[#D6BC86] focus:outline-none focus:border-[#D6BC86]/60 cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#77736D] hover:text-[#F5F1E8] hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Microphone Interaction Center */}
            <div className="py-8 flex flex-col items-center justify-center relative">
              {/* Outer pulsing wave rings */}
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.7, 2.2], opacity: [0.6, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                    className="absolute w-24 h-24 rounded-full border border-[#D6BC86]/40 pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.4, 1.8], opacity: [0.7, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.4, ease: 'easeOut' }}
                    className="absolute w-24 h-24 rounded-full border border-[#83C9A5]/40 pointer-events-none"
                  />
                </>
              )}

              {/* Main Glowing Mic Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={isListening ? stopListening : startListening}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#83C9A5] to-[#D6BC86] text-[#0B0B0D] shadow-[#83C9A5]/20 ring-4 ring-[#83C9A5]/30'
                    : 'bg-[#1D1D24] text-[#D6BC86] border border-[#D6BC86]/40 hover:border-[#D6BC86]'
                }`}
              >
                {isListening ? (
                  <Mic size={38} className="animate-pulse" />
                ) : (
                  <MicOff size={34} className="text-[#77736D]" />
                )}
              </motion.button>

              <span className="text-xs font-medium text-[#B6B0A5] mt-4 tracking-wide">
                {isListening ? 'Listening... Speak in Hindi, Punjabi, or English' : 'Tap microphone to speak'}
              </span>

              {/* Language example prompts carousel */}
              <div className="mt-3 px-4 py-2 rounded-xl bg-[#121215] border border-[rgba(214,188,134,0.1)] text-center max-w-sm">
                <span className="text-[11px] text-[#77736D] italic">
                  💡 e.g. "I spent 10$ on tea" or "mai aaj 10$ kharche chai teh ohnu add krde food ch"
                </span>
              </div>
            </div>

            {/* Real-time Spoken Transcript Box */}
            <div className="bg-[#0F0F12] border border-[rgba(214,188,134,0.14)] rounded-2xl p-4 min-h-[72px] flex items-center justify-center text-center">
              {transcript ? (
                <p className="text-sm font-medium text-[#F5F1E8] italic tracking-tight">
                  "{transcript}"
                </p>
              ) : (
                <p className="text-xs text-[#77736D] italic">
                  {isListening ? 'Say your expense or income naturally...' : 'Your spoken words will appear here'}
                </p>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-[#D98282]/10 border border-[#D98282]/30 flex items-center gap-2 text-xs text-[#D98282]">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Parsed Result Preview Card */}
            {parsedResult && parsedResult.amount ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-[#1A1A22] border border-[#D6BC86]/35 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D6BC86]">
                    Detected Transaction
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#83C9A5]/15 text-[#83C9A5] border border-[#83C9A5]/30">
                    {parsedResult.type}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-2xl font-bold text-[#F5F1E8]">
                      {settings.currencySymbol}
                      {parsedResult.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#B6B0A5] font-medium mt-0.5">
                      {parsedResult.description} • {parsedResult.category}
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmAdd}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Check size={15} strokeWidth={2.5} />
                    Confirm
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* Fallback if no speech recognized */}
            {!isSupported && (
              <div className="mt-4 p-3 rounded-xl bg-[#D98282]/15 border border-[#D98282]/30 text-xs text-[#D98282]">
                Your current browser does not support Web Speech Recognition. Please try Google Chrome or Safari.
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Animated Green Payment Success Screen */}
      <PaymentSuccessOverlay
        isOpen={showSuccessOverlay}
        amount={parsedResult?.amount || 0}
        type={parsedResult?.type || 'expense'}
        description={parsedResult?.description || ''}
        currencySymbol={settings.currencySymbol}
        onComplete={handleSuccessOverlayComplete}
      />
    </AnimatePresence>
  );
};
