import React from 'react';

/** The app mark: a banknote-green tile with a lowercase "m" and a marigold coin. */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 32, className }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
    <rect width="32" height="32" rx="9" fill="#0F3A36" />
    <path d="M8.5 22.5v-7.25a3.75 3.75 0 0 1 7.5 0v7.25M16 15.25a3.75 3.75 0 0 1 7.5 0v7.25" fill="none" stroke="#E8F1EE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="23.6" cy="8.6" r="2.6" fill="#F5C451" />
  </svg>
);

export const MoneyMateLogo: React.FC<{ size?: number; showText?: boolean; className?: string }> = ({ size = 32, showText = true, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark size={size} />
    {showText && <span className="font-display text-[19px] font-semibold tracking-[-0.02em] text-mm-text">MoneyMate</span>}
  </span>
);
