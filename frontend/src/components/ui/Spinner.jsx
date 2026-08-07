import { cn } from '../../utils/cn.js';

// Pure CSS spinner — borderless ring rotating. Used inline for inline-load
// and centered for full-area loading.

export const Spinner = ({ size = 16, className }) => (
  <span
    className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    style={{ width: size, height: size }}
    role="status"
    aria-label="Loading"
  />
);

export const FullSpinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-text-secondary">
    <Spinner size={18} />
    <span className="font-mono text-[12px] uppercase tracking-[0.2em]">{label}</span>
  </div>
);
