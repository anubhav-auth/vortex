import { cn } from '../../utils/cn.js';

// Small tonal pill for statuses. Tone maps to our theme colors.
// Use `dot` to render a small status dot at the leading edge.

const TONE = {
  cyan: 'border-accent-cyan/50 text-accent-cyan',
  live: 'border-status-live/50 text-status-live',
  warn: 'border-status-warn/50 text-status-warn',
  crit: 'border-status-crit/50 text-status-crit',
  dim:  'border-border-dim text-text-secondary',
};

const DOT = {
  cyan: 'bg-accent-cyan',
  live: 'bg-status-live',
  warn: 'bg-status-warn',
  crit: 'bg-status-crit',
  dim:  'bg-text-dim',
};

export const Badge = ({ tone = 'dim', dot, children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]',
      TONE[tone],
      className,
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} style={{ animation: 'pulseDot 2s ease-in-out infinite' }} />}
    {children}
  </span>
);
