import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: 'Track Easily',
    description: 'Keep all your income and expenses in one place with real-time categorisation and fluid visual insights.',
    image: '/assets/moneymate/onboarding/track-easily.jpg',
  },
  {
    title: 'Set Budgets',
    description: 'Stay in control with smart monthly limits, auto-updating progress indicators, and timely threshold alerts.',
    image: '/assets/moneymate/onboarding/set-budgets.jpg',
  },
  {
    title: 'Achieve Goals',
    description: 'Turn your aspirations into reality with target milestones, savings tracking, and visual celebrations.',
    image: '/assets/moneymate/onboarding/achieve-goals.jpg',
  },
  {
    title: 'Financial Freedom',
    description: 'Small steps today lead to bigger dreams tomorrow. Manage IOUs, analyse trends, and grow your wealth.',
    image: '/assets/moneymate/onboarding/financial-freedom.jpg',
  },
];

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(s => s - 1);
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="overlay-bg absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="glass-card-elevated max-w-sm w-full relative z-10 overflow-hidden border border-[rgba(214,188,134,0.18)] shadow-2xl bg-[#19191D]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl bg-black/60 hover:bg-white/10 text-[#77736D] hover:text-[#F5F1E8] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Slide Image */}
          <div className="relative h-60 w-full bg-[#0B0B0D] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={slide.image}
                src={slide.image}
                alt={slide.title}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-cover object-top"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19191D] via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Content */}
          <div className="p-6 pt-2 text-center">
            <h3 className="text-lg font-semibold text-[#F5F1E8] font-serif tracking-tight">{slide.title}</h3>
            <p className="text-xs text-[#B6B0A5] mt-2 leading-relaxed h-12">
              {slide.description}
            </p>

            {/* Dots */}
            <div className="flex justify-center items-center gap-1.5 my-4">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'w-6 bg-[#D6BC86]'
                      : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`p-2.5 rounded-xl border border-[rgba(214,188,134,0.14)] transition-colors ${
                  currentSlide === 0
                    ? 'opacity-30 cursor-not-allowed text-[#77736D]'
                    : 'text-[#F5F1E8] hover:bg-white/5 active:scale-95'
                }`}
                aria-label="Previous slide"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={nextSlide}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#D6BC86] hover:bg-[#E9D8AF] text-[#0B0B0D] font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
              >
                {currentSlide === SLIDES.length - 1 ? (
                  <>
                    <span>Enter MoneyMate</span>
                    <Check size={15} strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    <span>Next Feature</span>
                    <ChevronRight size={15} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

