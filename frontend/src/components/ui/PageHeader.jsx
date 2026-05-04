import { cn } from '../../utils/cn.js';

// Page title + optional kicker eyebrow + right-side actions slot.

export const PageHeader = ({ kicker, title, description, actions, className }) => (
  <header className={cn('mb-12 flex flex-col gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end md:justify-between', className)}>
    <div className="space-y-2 flex-1 min-w-0">
      {kicker && (
        <div className="kicker mb-2 inline-flex items-center gap-2 border border-white/20 px-3 py-1 uppercase tracking-[0.2em] text-[10px] text-white/60">
          <span className="h-1.5 w-1.5 bg-white" />
          {kicker}
        </div>
      )}
      <h1 className="font-sans text-[32px] font-black leading-tight tracking-tight text-white md:text-[42px] uppercase">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl font-mono text-[13px] leading-relaxed text-white/40">{description}</p>
      )}
    </div>
    {actions && <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">{actions}</div>}
  </header>
);
