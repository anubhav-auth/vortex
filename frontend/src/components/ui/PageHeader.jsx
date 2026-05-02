import { cn } from '../../utils/cn.js';

// Page title + optional kicker eyebrow + right-side actions slot.

export const PageHeader = ({ kicker, title, description, actions, className }) => (
  <header className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
    <div className="space-y-2">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1 className="font-sans text-[26px] leading-tight md:text-[32px]">{title}</h1>
      {description && (
        <p className="max-w-2xl font-mono text-[13px] leading-relaxed text-text-secondary">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </header>
);
