import { cn } from '../../utils/cn.js';

// Big-number tile. Optional tone + trailing icon. Used on dashboards.

export const StatTile = ({ label, value, hint, icon: Icon, className }) => (
  <div className={cn('relative overflow-hidden rounded-none border border-white/5 bg-[#050505] p-6 transition-all hover:border-white/20', className)}>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{label}</span>
      {Icon && <Icon size={14} className="text-white/10" />}
    </div>
    <div className="mt-4 font-sans text-[48px] font-black leading-none text-white tracking-tighter">
      {value}
    </div>
    {hint && <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-white/20">{hint}</div>}
  </div>
);
