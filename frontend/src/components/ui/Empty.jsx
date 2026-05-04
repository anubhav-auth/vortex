import { cn } from '../../utils/cn.js';

// Empty state with title + description + optional CTA. The point is to
// tell the user what to do next, not just say 'no data'.

export const Empty = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center gap-4 px-6 py-20 text-center border border-white/5 bg-black/40', className)}>
    {Icon && (
      <div className="border border-white/10 bg-white/5 p-4 text-white">
        <Icon size={24} strokeWidth={1.5} />
      </div>
    )}
    <div className="max-w-sm space-y-2">
      <div className="font-sans text-[15px] font-black uppercase tracking-[0.2em] text-white">{title}</div>
      {description && (
        <p className="font-mono text-[12px] leading-relaxed text-white/40">{description}</p>
      )}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);
