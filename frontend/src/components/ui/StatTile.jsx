import { cn } from '../../utils/cn.js';

// Big-number tile. Optional tone + trailing icon. Used on dashboards.

export const StatTile = ({ label, value, hint, icon: Icon, className }) => (
  <div className={cn('relative overflow-hidden rounded-none border border-white/5 bg-[#050505] p-6 transition-all hover:border-white/20', className)}>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</span>
      {Icon && <Icon size={18} className="text-white/20" />}
    </div>
    <div className="mt-4 font-sans text-[36px] font-black leading-none text-white">
      {value}
    </div>
    {hint && <div className="mt-3 font-mono text-[11px] text-white/30">{hint}</div>}
  </div>
);
