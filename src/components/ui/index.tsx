import React, { forwardRef, useId } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

/* ------------------------------------------------------------------ buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'btn-shine bg-mm-accent text-mm-on-accent hover:bg-mm-accent-2 shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-8px_color-mix(in_oklab,var(--color-mm-accent)_80%,transparent)]',
  secondary: 'bg-mm-card text-mm-text border border-mm-line/12 hover:border-mm-line/25 hover:bg-mm-bg2/60',
  ghost: 'text-mm-text2 hover:text-mm-text hover:bg-mm-text/[0.05]',
  quiet: 'bg-mm-bg2 text-mm-text hover:bg-mm-text/[0.08]',
  danger: 'bg-mm-negative/10 text-mm-negative hover:bg-mm-negative/15',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-[10px]',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
};

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none select-none',
    variants[variant], sizes[size], className,
  );

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ElementType;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, type = 'button', disabled, ...rest }, ref) => (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...rest}>
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export const IconButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: React.ElementType; size?: 'sm' | 'md'; tone?: 'default' | 'danger' | 'accent' }>(
  ({ label, icon: Icon, size = 'md', tone = 'default', className, type = 'button', ...rest }, ref) => (
    <button ref={ref} type={type} aria-label={label} title={label}
      className={cn(
        'inline-flex items-center justify-center shrink-0 rounded-xl transition-colors disabled:opacity-40',
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10',
        tone === 'danger' ? 'text-mm-muted hover:text-mm-negative hover:bg-mm-negative/10'
          : tone === 'accent' ? 'text-mm-accent hover:bg-mm-accent/10'
          : 'text-mm-text2 hover:text-mm-text hover:bg-mm-text/[0.06]',
        className,
      )} {...rest}>
      <Icon size={size === 'sm' ? 16 : 18} strokeWidth={1.9} aria-hidden />
    </button>
  ),
);
IconButton.displayName = 'IconButton';

/* ------------------------------------------------------------------- fields */

export const inputClass = 'w-full h-11 px-3.5 rounded-xl bg-mm-card border border-mm-line/15 text-mm-text placeholder:text-mm-muted/80 transition-[border-color,box-shadow] focus:outline-none focus:border-mm-accent focus:ring-4 focus:ring-mm-accent/15 disabled:opacity-60';

export const Field: React.FC<{ label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string; htmlFor?: string }> = ({ label, hint, error, children, className, htmlFor }) => (
  <div className={cn('block', className)}>
    <label htmlFor={htmlFor} className="block text-[13px] font-medium text-mm-text2 mb-1.5">{label}</label>
    {children}
    {error ? <p className="text-xs text-mm-negative mt-1.5" role="alert">{error}</p>
      : hint ? <p className="text-xs text-mm-muted mt-1.5 leading-relaxed">{hint}</p> : null}
  </div>
);

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn(inputClass, className)} {...rest} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn(inputClass, 'h-auto py-2.5 resize-none leading-relaxed', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...rest }, ref) => (
  <div className="relative">
    <select ref={ref} className={cn(inputClass, 'appearance-none pr-9 cursor-pointer', className)} {...rest}>{children}</select>
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mm-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
  </div>
));
Select.displayName = 'Select';

/** Number input with the user's currency symbol in front. */
export const MoneyInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { large?: boolean }>(({ className, large, ...rest }, ref) => {
  const { settings } = useApp();
  const symbol = settings.currencySymbol || '₹';
  return (
    <div className="relative">
      <span className={cn('pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mm-muted', large ? 'text-xl font-display' : 'text-sm')}>{symbol}</span>
      <input ref={ref} type="number" inputMode="decimal" step="any" min={0}
        className={cn(inputClass, 'tabular', large ? 'h-14 text-2xl font-display font-semibold' : '', className)}
        style={{ paddingLeft: `${(large ? 1.6 : 1.35) + symbol.length * (large ? 0.75 : 0.55)}rem` }}
        {...rest} />
    </div>
  );
});
MoneyInput.displayName = 'MoneyInput';

/* ------------------------------------------------------------- toggles */

export function Segmented<T extends string>({ value, onChange, options, label, size = 'md', className }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; tone?: 'positive' | 'negative' }[]; label: string; size?: 'sm' | 'md'; className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex p-1 rounded-xl bg-mm-bg2 gap-1', className)}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 rounded-[9px] font-semibold transition-colors whitespace-nowrap',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-[13px]',
              on ? 'text-mm-text' : 'text-mm-muted hover:text-mm-text',
              on && o.tone === 'positive' && 'text-mm-positive',
              on && o.tone === 'negative' && 'text-mm-negative',
            )}>
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[9px] bg-mm-card shadow-[0_1px_3px_rgb(0_0_0/0.1)]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const Switch: React.FC<{ checked: boolean; onChange: () => void; label: string; disabled?: boolean; busy?: boolean }> = ({ checked, onChange, label, disabled, busy }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} disabled={disabled || busy}
    className={cn('relative w-11 h-[26px] rounded-full shrink-0 transition-colors disabled:opacity-50', checked ? 'bg-mm-accent' : 'bg-mm-text/15')}>
    <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }}
      className={cn('absolute top-[3px] w-5 h-5 rounded-full bg-white shadow flex items-center justify-center', checked ? 'left-[21px]' : 'left-[3px]')}>
      {busy && <Loader2 size={11} className="animate-spin text-mm-accent" />}
    </motion.span>
  </button>
);

export const Chip: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({ active, className, children, type = 'button', ...rest }) => (
  <button type={type} aria-pressed={active}
    className={cn('inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors shrink-0',
      active ? 'bg-mm-text text-mm-bg border-mm-text' : 'bg-mm-card text-mm-text2 border-mm-line/12 hover:border-mm-line/25 hover:text-mm-text', className)}
    {...rest}>{children}</button>
);

/* ----------------------------------------------------------- page layout */

/** Page container. Its direct children rise into place one after another. */
export const Page: React.FC<{ children: React.ReactNode; className?: string; width?: 'narrow' | 'default' | 'wide' }> = ({ children, className, width = 'default' }) => (
  <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    className={cn('mx-auto w-full px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 pb-dock', width === 'narrow' ? 'max-w-3xl' : width === 'wide' ? 'max-w-7xl' : 'max-w-6xl', className)}>
    {React.Children.map(children, child => child == null || child === false ? child : (
      <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 28 } } }}>{child}</motion.div>
    ))}
  </motion.div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; /** @deprecated use actions */ action?: React.ReactNode }> = ({ title, subtitle, actions, action }) => (
  <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-6 sm:mb-8">
    <div className="min-w-0">
      <h1 className="text-[1.75rem] sm:text-[2.25rem] leading-[1.1] font-semibold text-mm-text" aria-label={title}>
        {title.split(' ').map((w, i) => (
          <motion.span key={i} aria-hidden className="inline-block mr-[0.25em] last:mr-0" initial={{ opacity: 0, y: '0.4em', filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}>{w}</motion.span>
        ))}
      </h1>
      {subtitle && <p className="text-[15px] text-mm-text2 mt-1.5 max-w-xl leading-relaxed">{subtitle}</p>}
    </div>
    {(actions || action) && <div className="flex flex-wrap items-center gap-2">{actions || action}</div>}
  </header>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string; id?: string }> = ({ title, subtitle, action, className, id }) => (
  <div className={cn('flex items-end justify-between gap-3 mb-3', className)}>
    <div className="min-w-0">
      <h2 id={id} className="text-[17px] font-semibold text-mm-text">{title}</h2>
      {subtitle && <p className="text-[13px] text-mm-muted mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/** Text link styled as an action (for "See all", "Manage"). */
export const LinkButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, type = 'button', ...rest }) => (
  <button type={type} className={cn('text-[13px] font-semibold text-mm-accent hover:text-mm-accent-2 hover:underline underline-offset-4 shrink-0', className)} {...rest} />
);

export const EmptyState: React.FC<{ icon: React.ElementType; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string; compact?: boolean }> = ({ icon: Icon, title, description, action, className, compact }) => (
  <div className={cn('flex flex-col items-center text-center', compact ? 'py-8 px-4' : 'py-14 px-6', className)}>
    <motion.span initial={{ scale: 0.6, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
      className="w-12 h-12 rounded-2xl bg-mm-accent/10 text-mm-accent flex items-center justify-center mb-4 float"><Icon size={22} strokeWidth={1.8} /></motion.span>
    <h3 className="text-base font-semibold text-mm-text">{title}</h3>
    {description && <p className="text-sm text-mm-text2 mt-1.5 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
);

export const Progress: React.FC<{ value: number; tone?: 'accent' | 'positive' | 'warning' | 'negative' | 'auto'; className?: string; label?: string }> = ({ value, tone = 'accent', className, label }) => {
  const v = Math.max(0, Math.min(100, value));
  const t = tone === 'auto' ? (value >= 100 ? 'negative' : value >= 80 ? 'warning' : 'accent') : tone;
  const bg = { accent: 'bg-mm-accent', positive: 'bg-mm-positive', warning: 'bg-mm-warning', negative: 'bg-mm-negative' }[t];
  return (
    <div className={cn('progress-track', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div className={cn('h-full rounded-[inherit]', bg)} initial={{ width: 0 }} animate={{ width: `${v}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.15 }} />
    </div>
  );
};

export const Badge: React.FC<{ tone?: 'neutral' | 'positive' | 'negative' | 'warning' | 'accent'; children: React.ReactNode; className?: string }> = ({ tone = 'neutral', children, className }) => (
  <span className={cn('inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-semibold whitespace-nowrap', {
    neutral: 'bg-mm-text/[0.06] text-mm-text2',
    positive: 'bg-mm-positive/12 text-mm-positive',
    negative: 'bg-mm-negative/12 text-mm-negative',
    warning: 'bg-mm-warning/14 text-mm-warning',
    accent: 'bg-mm-accent/12 text-mm-accent',
  }[tone], className)}>{children}</span>
);

/** Money that shortens to ₹1.2L on phones when it's large, full figure from sm up. */
export const Money: React.FC<{ value: number; signed?: boolean; className?: string }> = ({ value, signed, className }) => {
  const sign = signed ? (value < 0 ? '−' : value > 0 ? '+' : '') : value < 0 ? '−' : '';
  const v = Math.abs(value);
  const full = formatCurrency(v);
  if (v < 100000) return <span className={className}>{sign}{full}</span>;
  return (
    <span className={className}>
      <span className="sm:hidden">{sign}{formatCurrency(v, { compact: true })}</span>
      <span className="hidden sm:inline">{sign}{full}</span>
    </span>
  );
};

/** A labelled figure. */
export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'default' | 'positive' | 'negative' | 'accent'; className?: string; large?: boolean }> = ({ label, value, hint, tone = 'default', className, large }) => (
  <div className={cn('min-w-0', className)}>
    <p className="text-[13px] text-mm-muted">{label}</p>
    <p className={cn('amount font-semibold truncate mt-0.5', large ? 'text-[1.75rem] sm:text-[2rem]' : 'text-lg sm:text-[1.375rem]', {
      default: 'text-mm-text', positive: 'text-mm-positive', negative: 'text-mm-negative', accent: 'text-mm-accent',
    }[tone])}>{value}</p>
    {hint && <p className="text-xs text-mm-muted mt-0.5">{hint}</p>}
  </div>
);
