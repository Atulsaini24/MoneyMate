import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentSuccessOverlayProps {
  isOpen: boolean;
  amount: number | string;
  type?: 'expense' | 'income' | 'transfer' | string;
  description?: string;
  currencySymbol?: string;
  onComplete: () => void;
}

export const PaymentSuccessOverlay: React.FC<PaymentSuccessOverlayProps> = ({
  isOpen,
  amount,
  type = 'expense',
  description,
  currencySymbol = '₹',
  onComplete,
}) => {
  // Format current date and time matching the user's reference (e.g., "04:44 pm on 3 Nov 2025")
  const formattedDateTime = React.useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = String(hours % 12 || 12).padStart(2, '0');
    const timeStr = `${hour12}:${minutes} ${ampm}`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    return `${timeStr} on ${dateStr}`;
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    // Play a gentle audio chime if AudioContext is available
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.46);
      }
    } catch {
      // Audio not supported or blocked by browser policy, silent fallback
    }

    // Auto-dismiss after 2.3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2300);

    return () => clearTimeout(timer);
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="payment-success-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-[#15803d] text-white px-6 select-none overflow-hidden"
          onClick={onComplete}
        >
          {/* Subtle radiating ambient ripple rings */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: [0.8, 1.8, 2.2], opacity: [0.6, 0.25, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
            className="absolute w-52 h-52 rounded-full border border-white/30 pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0.4 }}
            animate={{ scale: [0.8, 1.5, 1.9], opacity: [0.5, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.35, ease: 'easeOut' }}
            className="absolute w-40 h-40 rounded-full border border-white/20 pointer-events-none"
          />

          {/* Central Animated Checkmark Circle */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 18,
              delay: 0.08,
            }}
            className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center shadow-2xl mb-7"
          >
            {/* SVG Checkmark with path drawing animation */}
            <svg
              className="w-16 h-16 md:w-20 md:h-20 text-[#15803d]"
              viewBox="0 0 52 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M14 27 L23 36 L38 18"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.22,
                  ease: 'easeOut',
                }}
              />
            </svg>
          </motion.div>

          {/* Title Text */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-center"
          >
            {type === 'income' ? 'Income Credited' : type === 'transfer' ? 'Transfer Successful' : 'Payment successful'}
          </motion.h2>

          {/* Amount Badge */}
          {amount && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.42, duration: 0.3 }}
              className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight"
            >
              {currencySymbol}{Number(amount).toLocaleString()}
            </motion.div>
          )}

          {/* Description if present */}
          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.48, duration: 0.3 }}
              className="mt-1 text-sm md:text-base text-white/90 font-medium max-w-xs text-center truncate"
            >
              {description}
            </motion.p>
          )}

          {/* Timestamp */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.54, duration: 0.3 }}
            className="text-xs md:text-sm text-white/80 font-medium mt-3"
          >
            {formattedDateTime}
          </motion.p>

          {/* Subtle tap to dismiss hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 text-[11px] uppercase tracking-widest text-white/70"
          >
            Tap anywhere to dismiss
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
