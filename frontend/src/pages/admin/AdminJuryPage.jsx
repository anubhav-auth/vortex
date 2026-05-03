import { useMemo, useState } from 'react';
import { Gavel, Plus, RefreshCw, Trash2, Repeat } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';

const ROUNDS = ['ROUND_1', 'ROUND_2', 'ROUND_3'];

export const AdminJuryPage = () => {
  const toast = useToast();
  const [round, setRound] = useState('ROUND_1');
  const [open, setOpen] = useState(false);

  const assignments = useApi(() => api.get('/api/admin/jury-assignments', { query: { round } }), [round]);
  const teams       = useApi(() => api.get('/api/teams', { query: { status: 'FINALIZED' } }), []);
  const juries      = useApi(() => api.get('/api/admin/verification/students', { query: { status: 'VERIFIED' } }), []);

  // Backend's verification list is for STUDENT role only; for jury list we
  // need users with role JURY. The current backend only exposes /me-style
  // user reads — we approximate by listing assignments first, but for the
  // CREATE flow we still need a jury picker. Use the seeded jury emails
  // shown in CREDENTIALS.md as a hint and ask admin for an explicit ID.

  const assignedTeamIdsForRound = useMemo(
    () => new Set((assignments.data?.assignments ?? []).map((a) => a.team.id)),
    [assignments.data],
  );

  const remove = async (a) => {
    const ok = await confirm({
      title: `Remove jury for ${a.team.name}?`,
      message: 'Refused if a score has already been submitted for this round.',
      tone: 'crit', confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/jury-assignments/${a.id}`);
      toast.success('Assignment removed.');
      assignments.refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <>
      <PageHeader
        kicker="Jury"
        title="Assignments"
        description="Pre-allocate which jury scores which finalized team for each round. Strictly one jury per (team, round)."
        actions={
          <button className="glow-button inline-flex items-center gap-2" onClick={() => setOpen(true)}>
            <Plus size={12}/> New assignment
          </button>
        }
      />

      <Tabs
        className="mb-4"
        value={round}
        onChange={setRound}
        items={ROUNDS.map((r) => ({
          value: r,
          label: r.replace('_',' '),
          badge: (assignments.data?.assignments ?? []).filter((a) => a.round === r).length || undefined,
        }))}
      />

      {assignments.loading && <CardSkeleton rows={3} />}
      {!assignments.loading && assignments.data?.assignments.length === 0 && (
        <Empty
          icon={Gavel}
          title="No assignments yet"
          description={`Create the first ${round.replace('_',' ').toLowerCase()} assignment from a finalized team.`}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {assignments.data?.assignments.map((a) => (
          <article key={a.id} className="glass-card flat flex items-start justify-between gap-3">
            <div>
              <div className="kicker mb-1">{a.team.domain?.name}</div>
              <div className="font-sans text-[14px] font-bold">{a.team.name}</div>
              <div className="font-mono text-[12px] text-text-secondary">
                Jury: <span className="text-text-primary">{a.jury.fullName}</span>
              </div>
              <div className="font-mono text-[11px] text-text-dim">{a.jury.email}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone="cyan">{a.round.replace('_',' ')}</Badge>
              <button className="danger-button text-[10px]" onClick={() => remove(a)}><Trash2 size={10}/></button>
            </div>
          </article>
        ))}
      </div>

      <AssignmentModal
        open={open}
        round={round}
        teams={(teams.data?.teams ?? []).filter((t) => !assignedTeamIdsForRound.has(t.id))}
        onClose={() => setOpen(false)}
        onDone={assignments.refetch}
      />
    </>
  );
};

const AssignmentModal = ({ open, onClose, onDone, round, teams }) => {
  const toast = useToast();
  const [teamId, setTeamId] = useState('');
  const [juryId, setJuryId] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/admin/jury-assignments', { teamId, round, juryId });
      toast.success('Assignment created.');
      setTeamId(''); setJuryId('');
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign ${round.replace('_',' ')}`} size="md">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Finalized team" required hint={teams.length === 0 ? 'No remaining finalized teams without an assignment for this round.' : undefined}>
          <select className="select-glass" required value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Select a team…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.domain?.name}</option>)}
          </select>
        </FormField>
        <FormField label="Jury user ID" required hint="Paste the jury's user ID. Default seed juries: jury.alpha / bravo / charlie@vortex.local — find their IDs in the audit log or DB.">
          <input className="input-glass" required value={juryId} onChange={(e) => setJuryId(e.target.value)} placeholder="cuid…" />
        </FormField>
        <div className="flex justify-end gap-2">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
            {busy ? <Spinner size={14}/> : <Plus size={14}/>}
            {busy ? 'Saving…' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
