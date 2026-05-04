import { cn } from '../../utils/cn.js';

// Preserved from v1: bg-bg-surface card with a subtle blue gradient
// overlay that fades in on hover. Wraps any children inside a relative
// stacking context.

export const NeonBorderCard = ({ children, className }) => (
  <div
    className={cn(
      'group relative overflow-hidden bg-black rounded-none border border-white/5',
      'transition-all duration-300 hover:border-white/20',
      className,
    )}
  >
    <div className="absolute inset-0 bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10 h-full w-full">{children}</div>
  </div>
);
