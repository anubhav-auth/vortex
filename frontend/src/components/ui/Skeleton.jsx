import { cn } from '../../utils/cn.js';

// Subtle pulsing block for loading states. Use these instead of blank
// areas — keeps perceived performance high and layout stable.

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-[4px] bg-white/5', className)} />
);

export const CardSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3 rounded-[4px] border border-border-dim bg-bg-surface p-5">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-5 w-3/4" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-3 w-full" />
    ))}
  </div>
);
