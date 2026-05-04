import { cn } from '../../utils/cn.js';

// Horizontal tab strip. Caller controls active state via `value`.

export const Tabs = ({ value, onChange, items, className }) => (
  <div className={cn('flex justify-start md:justify-center overflow-x-auto flex-nowrap gap-1 border-b border-white/10 no-scrollbar', className)}>
    {items.map((item) => {
      const active = value === item.value;
      return (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'relative flex items-center gap-2 px-8 py-5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all',
            active ? 'text-white' : 'text-white/40 hover:text-white',
          )}
        >
          {item.icon && <item.icon size={16} />}
          <span>{item.label}</span>
          {item.badge != null && (
            <span className={cn(
              'rounded-none px-1.5 py-0.5 text-[9px] font-black transition-all',
              active ? 'bg-white text-black' : 'bg-white/10 text-white/40',
            )}>
              {item.badge}
            </span>
          )}
          {active && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-white" />}
        </button>
      );
    })}
  </div>
);
