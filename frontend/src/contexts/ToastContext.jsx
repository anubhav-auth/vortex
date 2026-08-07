import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

const ToastContext = createContext(null);

let nextId = 1;

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warn:    AlertTriangle,
  info:    Info,
};

const TONE = {
  success: 'border-status-live text-status-live',
  error:   'border-status-crit text-status-crit',
  warn:    'border-status-warn text-status-warn',
  info:    'border-accent-cyan  text-accent-cyan',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback((tone, message, opts = {}) => {
    const id = nextId++;
    const ttl = opts.ttl ?? (tone === 'error' ? 6500 : 4000);
    setToasts((t) => [...t, { id, tone, message, title: opts.title }]);
    timers.current.set(id, setTimeout(() => dismiss(id), ttl));
    return id;
  }, [dismiss]);

  useEffect(() => () => { for (const t of timers.current.values()) clearTimeout(t); }, []);

  const value = {
    success: (msg, opts) => push('success', msg, opts),
    error:   (msg, opts) => push('error',   msg, opts),
    warn:    (msg, opts) => push('warn',    msg, opts),
    info:    (msg, opts) => push('info',    msg, opts),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[1000] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                'fade-in flex items-start gap-3 rounded-[4px] border bg-bg-surface p-3 pr-2 shadow-lg',
                TONE[t.tone],
              )}
              role="status"
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1 text-text-primary">
                {t.title && (
                  <div className="font-sans text-[11px] uppercase tracking-wider text-text-secondary">
                    {t.title}
                  </div>
                )}
                <div className="font-mono text-[13px] leading-snug">{t.message}</div>
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-text-dim hover:text-text-primary hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
};
