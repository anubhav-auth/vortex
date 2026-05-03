import { useMemo, useState } from 'react';
import { ShieldCheck, ShieldX, RefreshCw, Search, KeyRound } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';

const STATUS_TONE = { PENDING: 'warn', VERIFIED: 'live', REJECTED: 'crit', REVOKED: 'crit' };

export const AdminVerificationPage = () => {
  const toast = useToast();
  const [tab, setTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [reject, setReject] = useState(null);

  const pending = useApi(() => api.get('/api/admin/verification/pending', { query: { search } }), [search]);
  const all     = useApi(() => api.get('/api/admin/verification/students', { query: { status: tab === 'ALL' ? undefined : tab, search } }), [tab, search]);

  const list = tab === 'PENDING' ? (pending.data?.users ?? []) : (all.data?.users ?? []);
  const loading = tab === 'PENDING' ? pending.loading : all.loading;

  const refresh = () => { pending.refetch(); all.refetch(); };

  const approve = async (u) => {
    try {
      await api.post(`/api/admin/verification/students/${u.id}/approve`);
      toast.success(`Approved ${u.fullName}. 6-digit password emailed.`);
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const revoke = async (u) => {
    const ok = await confirm({
      title: `Revoke ${u.fullName}?`,
      message: 'They will be signed out and unable to log in. Their team membership stays for now.',
      tone: 'crit', confirmLabel: 'Revoke',
    });
    if (!ok) return;
    try {
      await api.post(`/api/admin/verification/students/${u.id}/revoke`);
      toast.success('Access revoked.');
      refresh();
    } catch (e) { toast.error(e.message); }
  };

  const reissue = async (u) => {
    const ok = await confirm({
      title: `Reissue password for ${u.fullName}?`,
      message: 'A fresh 6-digit code will replace their current password and be emailed.',
      confirmLabel: 'Reissue',
    });
    if (!ok) return;
    try {
      await api.post(`/api/admin/verification/students/${u.id}/reissue-password`);
      toast.success('New password emailed.');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader
        kicker="Verification Queue"
        title="Operative review"
        description="Approve or reject self-registered students. Verified accounts receive a 6-digit login password by email."
        actions={
          <div className="relative w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input className="input-glass pl-9" placeholder="Search name / email / reg #" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'PENDING',  label: 'Pending',  badge: pending.data?.users.length },
          { value: 'VERIFIED', label: 'Verified' },
          { value: 'REJECTED', label: 'Rejected' },
          { value: 'REVOKED',  label: 'Revoked'  },
          { value: 'ALL',      label: 'All'      },
        ]}
      />

      {loading && <CardSkeleton rows={4} />}
      {!loading && list.length === 0 && <Empty icon={ShieldCheck} title="Nothing to review" description="Pending registrations show up here." />}

      <div className="overflow-hidden rounded-[4px] border border-border-dim bg-bg-surface">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-dim text-left">
              <Th>Operative</Th>
              <Th>Email</Th>
              <Th>Reg #</Th>
              <Th>Institution</Th>
              <Th>Domain</Th>
              <Th>Match</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-border-dim/60 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-[12px] text-text-primary">{u.fullName}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.email}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.registrationNo ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.institution?.name ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{u.domain?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {u.registryMatch ? (
                    u.registryMatch.matched
                      ? <Badge tone={u.registryMatch.emailMatches === false ? 'warn' : 'live'} dot>{u.registryMatch.emailMatches === false ? 'Email mismatch' : 'Matched'}</Badge>
                      : <Badge tone="warn">No match</Badge>
                  ) : <span className="text-text-dim">—</span>}
                </td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[u.verificationStatus]} dot>{titleCase(u.verificationStatus)}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    {u.verificationStatus === 'PENDING' && (
                      <>
                        <button className="glow-button text-[10px]" onClick={() => approve(u)}>Approve</button>
                        <button className="danger-button text-[10px]" onClick={() => setReject(u)}>Reject</button>
                      </>
                    )}
                    {u.verificationStatus === 'VERIFIED' && (
                      <>
                        <button className="ghost-button text-[10px]" onClick={() => reissue(u)} title="Reissue password"><KeyRound size={10}/></button>
                        <button className="danger-button text-[10px]" onClick={() => revoke(u)}>Revoke</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RejectModal target={reject} onClose={() => setReject(null)} onDone={refresh} />
    </>
  );
};

const Th = ({ children, align }) => (
  <th className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim ${align === 'right' ? 'text-right' : ''}`}>{children}</th>
);

const RejectModal = ({ target, onClose, onDone }) => {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!target) return null;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/admin/verification/students/${target.id}/reject`, { reason: reason.trim() || undefined });
      toast.success('Rejection sent.');
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Reject ${target.fullName}?`} size="sm">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Reason" hint="Optional. Surfaces in the rejection email.">
          <textarea className="input-glass min-h-[100px]" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="danger-button">{busy ? <Spinner size={12}/> : 'Reject'}</button>
        </div>
      </form>
    </Modal>
  );
};
