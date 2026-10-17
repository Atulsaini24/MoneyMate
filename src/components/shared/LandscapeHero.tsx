import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, Building2 } from 'lucide-react';

interface LandscapeHeroProps {
  quote?: string;
  compact?: boolean;
}

const LANDSCAPE_THEMES = [
  { id: 'penthouse', name: 'Metropolis Penthouse', src: '/assets/moneymate/hero/dashboard-hero.jpg', icon: Building2 },
  { id: 'chalet', name: 'Alpine Chalet', src: '/assets/moneymate/hero/night.jpg', icon: Moon },
];

export const LandscapeHero: React.FC<LandscapeHeroProps> = ({ 
  quote = "True wealth is the ability to fully experience life on your own terms.",
  compact = false 
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    const saved = localStorage.getItem('moneymate_landscape_theme');
    if (saved === 'chalet' || saved === 'night') return 'chalet';
    return 'penthouse';
  });
  const [showPicker, setShowPicker] = useState(false);

  const currentTheme = LANDSCAPE_THEMES.find(t => t.id === selectedThemeId) || LANDSCAPE_THEMES[0];

  const handleSelectTheme = (id: string) => {
    setSelectedThemeId(id);
    localStorage.setItem('moneymate_landscape_theme', id);
    setShowPicker(false);
  };

  const heightClass = compact ? 'h-32' : 'h-36 sm:h-40 md:h-44';

  return (
    <div className={`landscape-container ${heightClass} w-full relative group rounded-2xl border border-[rgba(214,188,134,0.14)] overflow-hidden shadow-lg`}>
      {/* Background Architectural Imagery with Deep Obsidian Mask */}
      <motion.div
        key={currentTheme.id}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${currentTheme.src})`,
          backgroundPosition: 'center 40%',
        }}
      />

      {/* Deep Obsidian Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/65 to-[#0B0B0D]/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0D]/80 via-[#0B0B0D]/40 to-[#0B0B0D]/60 pointer-events-none" />
      
      {/* Atmosphere Switcher Pill */}
      <div className="absolute top-3.5 right-3.5 z-20">
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121215]/85 border border-[rgba(214,188,134,0.16)] text-[11px] font-medium text-[#B6B0A5] hover:text-[#F5F1E8] transition-all backdrop-blur-md active:scale-95"
            title="Switch Background Ambiance"
          >
            <currentTheme.icon size={12} className="text-[#D6BC86]" strokeWidth={1.75} />
            <span className="hidden sm:inline">{currentTheme.name}</span>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[#17171B] border border-[rgba(214,188,134,0.2)] p-1.5 shadow-2xl z-30 space-y-0.5 backdrop-blur-xl"
              >
                <p className="text-[9px] uppercase tracking-wider font-semibold text-[#77736D] px-2.5 py-1">
                  Ambiance Theme
                </p>
                {LANDSCAPE_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      theme.id === currentTheme.id
                        ? 'bg-[rgba(214,188,134,0.15)] text-[#D6BC86] font-semibold'
                        : 'text-[#B6B0A5] hover:bg-[#121215] hover:text-[#F5F1E8]'
                    }`}
                  >
                    <theme.icon size={13} className={theme.id === currentTheme.id ? 'text-[#D6BC86]' : 'text-[#77736D]'} strokeWidth={1.75} />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editorial Quote Pill */}
      <div className="absolute bottom-3.5 left-4 right-4 md:left-6 z-10 max-w-xl">
        <div className="px-4 py-2.5 rounded-xl bg-[#121215]/85 border border-[rgba(214,188,134,0.14)] inline-block backdrop-blur-md">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles size={11} className="text-[#D6BC86]" strokeWidth={1.75} />
            <span className="text-[9px] text-[#D6BC86] uppercase tracking-[0.16em] font-semibold">Editorial Insight</span>
          </div>
          <p className="text-[#F5F1E8] text-xs font-normal italic tracking-tight line-clamp-2 sm:line-clamp-none">
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );
};
