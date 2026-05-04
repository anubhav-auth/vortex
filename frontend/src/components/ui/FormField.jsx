import { cn } from '../../utils/cn.js';

// Labelled form field with optional inline error and help text. Wraps
// .input-glass / .select-glass / textarea to keep layouts consistent.

export const FormField = ({ label, hint, error, required, children, className }) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-text-secondary">
      {label}
      {required && <span className="text-status-crit">*</span>}
    </span>
    {children}
    {(error || hint) && (
      <span className={cn('font-mono text-[11px]', error ? 'text-status-crit' : 'text-text-dim')}>
        {error ?? hint}
      </span>
    )}
  </label>
);
