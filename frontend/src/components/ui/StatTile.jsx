import { cn } from '../../utils/cn.js';

// Big-number tile. Optional tone + trailing icon. Used on dashboards.

const TONE = {
  cyan: 'text-accent-cyan',
  live: 'text-status-live',
  warn: 'text-status-warn',
  crit: 'text-status-crit',
  default: 'text-text-primary',
};

export const StatTile = ({ label, value, hint, tone = 'default', icon: Icon, className }) => (
  <div className={cn('relative overflow-hidden rounded-[4px] border border-border-dim bg-bg-surface p-5', className)}>
    <div className="flex items-center justify-between">
      <span className="section-label">{label}</span>
      {Icon && <Icon size={16} className="text-text-dim" />}
    </div>
    <div className={cn('mt-3 font-sans text-[32px] font-bold leading-none', TONE[tone])}>
      {value}
    </div>
    {hint && <div className="mt-2 font-mono text-[11px] text-text-dim">{hint}</div>}
  </div>
);
