import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Lightweight modal — backdrop click + Escape to dismiss. Renders into
// document.body so it's never clipped by ancestor overflow rules.

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal = ({ open, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={cn(
          'fade-in relative flex w-full max-h-[88vh] flex-col rounded-none border border-white/10 bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)]',
          SIZES[size],
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#050505]">
          <h3 className="font-sans text-[14px] font-black uppercase tracking-[0.2em] text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-none p-2 text-white/40 hover:bg-white hover:text-black transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-4 bg-[#050505]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
