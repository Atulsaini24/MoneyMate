import React from 'react';

interface MoneyMateLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const MoneyMateLogo: React.FC<MoneyMateLogoProps> = ({
  size = 36,
  showText = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Refined Private Wealth Monogram Squircle */}
      <div
        className="relative flex items-center justify-center rounded-[12px] overflow-hidden flex-shrink-0 transition-all duration-200"
        style={{
          width: size,
          height: size,
          backgroundColor: '#17171B',
          border: '1px solid rgba(214, 188, 134, 0.22)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(233, 216, 175, 0.15)',
        }}
      >
        {/* Subtle top edge champagne light */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-mm-gold-light/40 to-transparent pointer-events-none" />

        {/* Minimalist Geometric Monogram */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[58%] h-[58%] relative z-10"
        >
          {/* Refined intersecting architecture lines in Champagne Gold */}
          <path
            d="M6 24V9L16 19L26 9V24"
            stroke="#D6BC86"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="7" r="1.5" fill="#E9D8AF" />
        </svg>
      </div>

      {/* Brand Typography - Editorial Sans */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 leading-tight">
            <span className="text-[15px] sm:text-[17px] font-bold tracking-tight text-mm-text truncate">
              Money<span className="text-mm-gold font-medium">Mate</span>
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.16em] text-mm-muted font-semibold truncate hidden xs:block">
            Private Wealth
          </span>
        </div>
      )}
    </div>
  );
};
