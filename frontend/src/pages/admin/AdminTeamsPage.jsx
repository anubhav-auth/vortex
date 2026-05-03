import { useMemo, useState } from 'react';
import { Users, Search, Trash2, RefreshCw, ShieldCheck, UserMinus, UserPlus, Settings } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';
import { issueLabel } from '../../utils/format.js';

const STATUS_TONE = { FORMING: 'warn', QUALIFIED: 'live', FINALIZED: 'cyan', DISQUALIFIED: 'crit' };

export const AdminTeamsPage = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [active, setActive] = useState(null);

  const teams = useApi(
    () => api.get('/api/teams', { query: { search, status: status || undefined } }),
    [search, status],
  );

  const refresh = () => teams.refetch();

  return (
    <>
      <PageHeader
        kicker="Teams"
        title="Squad management"
        description="Inspect every team, surface unmet rules, and force-resolve deadlocks (force add/remove, force finalize, disband)."
        actions={
          <div className="flex items-center gap-2">
            <select className="select-glass !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="FORMING">Forming</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="FINALIZED">Finalized</option>
              <option value="DISQUALIFIED">Disqualified</option>
            </select>
            <div className="relative w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input className="input-glass pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        }
      />

      {teams.loading && <CardSkeleton rows={4} />}
      {!teams.loading && teams.data?.teams.length === 0 && (
        <Empty icon={Users} title="No teams" description="Once students start creating teams they'll appear here." />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {teams.data?.teams.map((t) => (
          <article key={t.id} className="glass-card flat space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="kicker mb-1">{t.domain?.name}{t.problemStatement && ` · ${t.problemStatement.title}`}</div>
                <div className="font-sans text-[15px] font-bold">{t.name}</div>
                <div className="font-mono text-[12px] text-text-secondary">Leader: {t.leader?.fullName}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={STATUS_TONE[t.status]} dot>{t.status}</Badge>
                {t.adminOverride && <Badge tone="warn">Override</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-border-dim pt-3 font-mono text-[11px]">
              <span className="text-text-dim">{t.memberCount} members</span>
              <span className="text-text-dim">·</span>
              <span className="text-text-dim">{t.femaleCount} F</span>
              <span className="text-text-dim">·</span>
              <span className="text-text-dim">{t.domainExpertCount} experts</span>
            </div>
            <div className="flex justify-end">
              <button className="ghost-button" onClick={() => setActive(t)}>
                <Settings size={12} /> Manage
              </button>
            </div>
          </article>
        ))}
      </div>

      <ManageModal team={active} onClose={() => setActive(null)} onDone={refresh} />
    </>
  );
};

const ManageModal = ({ team, onClose, onDone }) => {
  const toast = useToast();
  const evaluation = useApi(
    () => team ? api.get(`/api/teams/${team.id}/evaluation`) : Promise.resolve(null),
    [team?.id],
  );
  const [forceAddId, setForceAddId] = useState('');
  const [forceRemoveId, setForceRemoveId] = useState('');

  if (!team) return null;

  const action = async (label, fn) => {
    try { await fn(); toast.success(label); onDone(); onClose(); }
    catch (err) { toast.error(err.message); }
  };

  const forceFinalize = async () => {
    const ok = await confirm({
      title: `Force-finalize ${team.name}?`,
      message: 'Bypasses qualification rules. Sets adminOverride and freezes the roster.',
      confirmLabel: 'Finalize',
    });
    if (!ok) return;
    action('Team force-finalized.', () => api.post(`/api/admin/teams/${team.id}/force-finalize`));
  };

  const disband = async () => {
    const ok = await confirm({
      title: `Disband ${team.name}?`,
      message: 'Cascade-deletes the team, members, invites, requests, and evaluations. Irreversible.',
      tone: 'crit', confirmLabel: 'Disband',
    });
    if (!ok) return;
    action('Team disbanded.', () => api.delete(`/api/admin/teams/${team.id}`));
  };

  return (
    <Modal open onClose={onClose} title={`Manage ${team.name}`} size="lg">
      <div className="space-y-4">
        <div className="rounded-[4px] border border-border-dim bg-bg-void p-4">
          <div className="flex items-center justify-between">
            <Badge tone={STATUS_TONE[team.status]} dot>{team.status}</Badge>
            <div className="font-mono text-[11px] text-text-dim">
              {team.memberCount}/{team.femaleCount}F/{team.domainExpertCount} experts
            </div>
          </div>
          {evaluation.data?.issues?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {evaluation.data.issues.map((i) => (
                <Badge key={i.code} tone="warn">{issueLabel(i.code)} ({i.have}/{i.need})</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card flat space-y-3">
            <h3 className="section-label">Force add member</h3>
            <FormField label="User ID" hint="Bypasses team-full / status guards. Unique constraints still apply.">
              <input className="input-glass" value={forceAddId} onChange={(e) => setForceAddId(e.target.value)} />
            </FormField>
            <button
              className="ghost-button inline-flex items-center gap-2"
              disabled={!forceAddId}
              onClick={() => action('Member added.', () => api.post(`/api/admin/teams/${team.id}/force-add`, { userId: forceAddId.trim() }))}
            >
              <UserPlus size={12}/> Force add
            </button>
          </div>

          <div className="glass-card flat space-y-3">
            <h3 className="section-label">Force remove member</h3>
            <FormField label="User ID" hint="Refused for the team leader (use disband instead).">
              <input className="input-glass" value={forceRemoveId} onChange={(e) => setForceRemoveId(e.target.value)} />
            </FormField>
            <button
              className="ghost-button inline-flex items-center gap-2"
              disabled={!forceRemoveId}
              onClick={() => action('Member removed.', () => api.post(`/api/admin/teams/${team.id}/force-remove`, { userId: forceRemoveId.trim() }))}
            >
              <UserMinus size={12}/> Force remove
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border-dim pt-4">
          <button className="ghost-button inline-flex items-center gap-2"
                  onClick={() => action('Counters recounted.', () => api.post(`/api/admin/teams/${team.id}/recount`))}>
            <RefreshCw size={12}/> Recount counters
          </button>
          <button className="glow-button inline-flex items-center gap-2" onClick={forceFinalize}
                  disabled={team.status === 'FINALIZED'}>
            <ShieldCheck size={12}/> Force finalize
          </button>
          <button className="danger-button inline-flex items-center gap-2" onClick={disband}>
            <Trash2 size={12}/> Disband
          </button>
        </div>
      </div>
    </Modal>
  );
};
