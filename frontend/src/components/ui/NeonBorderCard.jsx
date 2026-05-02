import { cn } from '../../utils/cn.js';

// Preserved from v1: bg-bg-surface card with a subtle blue gradient
// overlay that fades in on hover. Wraps any children inside a relative
// stacking context.

export const NeonBorderCard = ({ children, className }) => (
  <div
    className={cn(
      'group relative overflow-hidden bg-[#1e293b] rounded-[4px] border border-[#334155]',
      'transition-all duration-300 hover:border-[#475569]',
      className,
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10 h-full w-full">{children}</div>
  </div>
);
