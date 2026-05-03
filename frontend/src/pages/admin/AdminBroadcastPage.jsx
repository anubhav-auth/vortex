import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { formatRelative } from '../../utils/format.js';

export const AdminBroadcastPage = () => {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const history = useApi(() => api.get('/api/broadcast', { query: { limit: 50 } }), []);

  // Live update history when our send (or any other admin's) lands.
  useSocketEvent('broadcast:new', () => history.refetch(), [history.refetch]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/admin/broadcast', { message: message.trim() });
      toast.success('Broadcast sent.');
      setMessage('');
      history.refetch();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        kicker="Broadcast"
        title="Global announcements"
        description="Push a real-time message to every connected user. Appears as a toast and on their dashboard feed."
      />

      <form onSubmit={submit} className="glass-card flat mb-6 space-y-4">
        <FormField label="Message" required hint={`${message.length} / 2000`}>
          <textarea
            required maxLength={2000} minLength={1}
            className="input-glass min-h-[140px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Round 1 begins in 10 minutes…"
          />
        </FormField>
        <div className="flex justify-end">
          <button type="submit" disabled={busy || !message.trim()} className="glow-button inline-flex items-center gap-2">
            {busy ? <Spinner size={14}/> : <Send size={14}/>}
            {busy ? 'Sending…' : 'Broadcast now'}
          </button>
        </div>
      </form>

      <h2 className="section-label mb-3">Recent broadcasts</h2>
      {history.loading && <CardSkeleton rows={2}/>}
      {!history.loading && history.data?.broadcasts.length === 0 && (
        <Empty icon={Megaphone} title="No broadcasts yet" />
      )}
      <div className="space-y-2">
        {history.data?.broadcasts.map((b) => (
          <article key={b.id} className="glass-card flat space-y-1.5">
            <div className="flex items-center justify-between">
              <Badge tone="cyan" dot>Sent</Badge>
              <span className="font-mono text-[11px] text-text-dim">{formatRelative(b.createdAt)} · {b.sender?.fullName}</span>
            </div>
            <p className="font-mono text-[13px] leading-relaxed text-text-primary whitespace-pre-wrap">{b.message}</p>
          </article>
        ))}
      </div>
    </>
  );
};
