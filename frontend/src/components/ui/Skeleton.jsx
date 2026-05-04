import { cn } from '../../utils/cn.js';

// Subtle pulsing block for loading states. Use these instead of blank
// areas — keeps perceived performance high and layout stable.

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-none bg-white/[0.03]', className)} />
);

export const CardSkeleton = ({ rows = 3 }) => (
  <div className="space-y-4 rounded-none border border-white/5 bg-[#050505] p-6">
    <Skeleton className="h-4 w-32" />
    <div className="space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
    </div>
    <div className="pt-4 space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full opacity-50" />
      ))}
    </div>
  </div>
);
