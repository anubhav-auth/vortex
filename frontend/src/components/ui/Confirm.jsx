import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { Spinner } from './Spinner.jsx';

// Promise-based confirm. Returns true if the user confirms, false otherwise.
//
//   const ok = await confirm({ title: 'Delete?', message: '...', tone: 'crit' })
//
// Mounted by <ConfirmHost /> at app root. Falls back to native window.confirm
// if no host is mounted (so this never breaks tests / SSR shells).

let resolverRef = null;
let triggerRef  = null;

export const confirm = (opts) => {
  if (!triggerRef) return Promise.resolve(window.confirm(opts.message ?? opts.title ?? 'Are you sure?'));
  return new Promise((resolve) => {
    resolverRef = resolve;
    triggerRef(opts);
  });
};

export const ConfirmHost = () => {
  const [opts, setOpts] = useState(null);
  const [busy, setBusy] = useState(false);

  triggerRef = (next) => { setOpts(next); setBusy(false); };

  const close = (result) => {
    setOpts(null);
    setBusy(false);
    if (resolverRef) { resolverRef(result); resolverRef = null; }
  };

  if (!opts) return null;

  const tone = opts.tone === 'crit' ? 'danger-button' : 'glow-button';

  return (
    <Modal
      open
      onClose={() => close(false)}
      title={opts.title ?? 'Confirm'}
      size="sm"
      footer={
        <>
          <button className="ghost-button" onClick={() => close(false)}>{opts.cancelLabel ?? 'Cancel'}</button>
          <button
            className={tone}
            disabled={busy}
            onClick={() => { setBusy(true); close(true); }}
          >
            {busy ? <Spinner size={14} /> : (opts.confirmLabel ?? 'Confirm')}
          </button>
        </>
      }
    >
      <p className="font-mono text-[13px] leading-relaxed text-text-secondary">
        {opts.message}
      </p>
    </Modal>
  );
};
