import { cn } from '../../utils/cn.js';

// Empty state with title + description + optional CTA. The point is to
// tell the user what to do next, not just say 'no data'.

export const Empty = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', className)}>
    {Icon && (
      <div className="rounded-full border border-border-dim bg-bg-void p-3 text-text-dim">
        <Icon size={20} />
      </div>
    )}
    <div className="max-w-sm space-y-1">
      <div className="font-sans text-[14px] uppercase tracking-[0.15em] text-text-primary">{title}</div>
      {description && (
        <p className="font-mono text-[12px] leading-relaxed text-text-secondary">{description}</p>
      )}
    </div>
    {action && <div className="mt-1">{action}</div>}
  </div>
);
