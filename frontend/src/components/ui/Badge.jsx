import { cn } from '../../utils/cn.js';

// Small tonal pill for statuses. Tone maps to our theme colors.
// Use `dot` to render a small status dot at the leading edge.

const TONE = {
  cyan: 'border-white text-white bg-white/10',
  live: 'border-white text-white',
  warn: 'border-white/40 text-white/60',
  crit: 'border-white bg-white text-black',
  dim:  'border-white/10 text-white/40',
};

const DOT = {
  cyan: 'bg-white',
  live: 'bg-white',
  warn: 'bg-white/40',
  crit: 'bg-black',
  dim:  'bg-white/20',
};

export const Badge = ({ tone = 'dim', dot, children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em]',
      TONE[tone],
      className,
    )}
  >
    {dot && <span className={cn('h-1.5 w-1.5 rounded-none', DOT[tone])} />}
    {children}
  </span>
);
