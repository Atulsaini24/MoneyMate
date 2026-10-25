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
    <div className={`landscape-container ${heightClass} w-full relative group rounded-2xl border border-mm-line/14 overflow-hidden shadow-lg`}>
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
      <div className="absolute inset-0 bg-gradient-to-t from-mm-bg via-mm-bg/65 to-mm-bg/30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-mm-bg/80 via-mm-bg/40 to-mm-bg/60 pointer-events-none" />
      
      {/* Atmosphere Switcher Pill */}
      <div className="absolute top-3.5 right-3.5 z-20">
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-mm-bg2/85 border border-mm-line/16 text-[11px] font-medium text-mm-text2 hover:text-mm-text transition-all backdrop-blur-md active:scale-95"
            title="Switch Background Ambiance"
          >
            <currentTheme.icon size={12} className="text-mm-gold" strokeWidth={1.75} />
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
                className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-mm-card border border-mm-line/20 p-1.5 shadow-2xl z-30 space-y-0.5 backdrop-blur-xl"
              >
                <p className="text-[9px] uppercase tracking-wider font-semibold text-mm-muted px-2.5 py-1">
                  Ambiance Theme
                </p>
                {LANDSCAPE_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      theme.id === currentTheme.id
                        ? 'bg-mm-line/15 text-mm-gold font-semibold'
                        : 'text-mm-text2 hover:bg-mm-bg2 hover:text-mm-text'
                    }`}
                  >
                    <theme.icon size={13} className={theme.id === currentTheme.id ? 'text-mm-gold' : 'text-mm-muted'} strokeWidth={1.75} />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Editorial Quote Pill */}
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-3.5 sm:left-4 sm:right-4 md:left-6 z-10 max-w-xl">
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-mm-bg2/90 border border-mm-line/14 inline-block backdrop-blur-md max-w-full">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles size={11} className="text-mm-gold" strokeWidth={1.75} />
            <span className="text-[9px] text-mm-gold uppercase tracking-[0.16em] font-semibold">Editorial Insight</span>
          </div>
          <p className="text-mm-text text-[11px] sm:text-xs font-normal italic tracking-tight line-clamp-2 sm:line-clamp-none leading-snug">
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );
};
