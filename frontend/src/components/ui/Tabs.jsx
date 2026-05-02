import { cn } from '../../utils/cn.js';

// Horizontal tab strip. Caller controls active state via `value`.

export const Tabs = ({ value, onChange, items, className }) => (
  <div className={cn('flex flex-wrap gap-1 border-b border-border-dim', className)}>
    {items.map((item) => {
      const active = value === item.value;
      return (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.15em] transition-colors',
            active ? 'text-accent-cyan' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {item.icon && <item.icon size={14} />}
          <span>{item.label}</span>
          {item.badge != null && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              active ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-white/5 text-text-dim',
            )}>
              {item.badge}
            </span>
          )}
          {active && <span className="absolute inset-x-2 -bottom-px h-px bg-accent-cyan" />}
        </button>
      );
    })}
  </div>
);
