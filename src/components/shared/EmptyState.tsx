import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  image?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  image,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 md:p-10 text-center max-w-md mx-auto my-6 border border-mm-line/12"
    >
      {image && (
        <div className="relative w-24 h-24 mx-auto mb-4 rounded-3xl overflow-hidden glass-card-elevated border border-mm-line/22 flex items-center justify-center p-3 shadow-xl">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            loading="lazy"
          />
        </div>
      )}
      <h3 className="text-base font-semibold text-mm-text font-serif tracking-tight">{title}</h3>
      <p className="text-xs text-mm-muted mt-1.5 leading-relaxed">{description}</p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-xl bg-mm-gold hover:bg-mm-gold-light text-mm-on-gold font-medium text-xs tracking-wider uppercase transition-all active:scale-95 shadow-sm"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
};

