import { useEffect, useMemo, useState } from 'react';
import {
  Users, Plus, UserPlus, Send, ShieldCheck, AlertTriangle, LogOut,
  UserMinus, Crown, Search, Sparkles, CheckCircle2, XCircle,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { confirm } from '../../components/ui/Confirm.jsx';
import { issueLabel } from '../../utils/format.js';

// ── Status banner derived from rules engine evaluation ─────────────────────
const StatusBanner = ({ status, issues }) => {
  if (status === 'FINALIZED') {
    return (
      <div className="flex items-center gap-3 rounded-[4px] border border-status-live/40 bg-status-live/5 px-4 py-3">
        <ShieldCheck size={16} className="text-status-live" />
        <div className="font-mono text-[12px] text-status-live">Team finalized — no further changes.</div>
      </div>
    );
  }
  if (status === 'QUALIFIED') {
    return (
      <div className="flex items-center gap-3 rounded-[4px] border border-status-live/40 bg-status-live/5 px-4 py-3">
        <CheckCircle2 size={16} className="text-status-live" />
        <div className="font-mono text-[12px] text-status-live">All rules met — leader can finalize.</div>
      </div>
    );
  }
  return (
    <div className="space-y-2 rounded-[4px] border border-status-warn/40 bg-status-warn/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <AlertTriangle size={16} className="text-status-warn" />
        <div className="font-mono text-[12px] text-status-warn">Not yet qualified.</div>
      </div>
      <div className="flex flex-wrap gap-2 pl-7">
        {issues.map((i) => (
          <Badge key={i.code} tone="warn">{issueLabel(i.code)} ({i.have}/{i.need})</Badge>
        ))}
      </div>
    </div>
  );
};

// ── Create-team ───────────────────────────────────────────────────────────
const CreateTeamForm = ({ onCreated }) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [domainId, setDomainId] = useState('');
  const [psId, setPsId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: domData } = useApi(() => api.get('/api/taxonomy/domains'), []);
  const { data: psData } = useApi(
    () => domainId ? api.get('/api/taxonomy/problem-statements', { query: { domainId } }) : Promise.resolve({ problemStatements: [] }),
    [domainId],
  );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { team } = await api.post('/api/teams', { name, domainId, psId: psId || undefined });
      toast.success(`Team "${team.name}" created. You're the leader.`);
      onCreated?.();
    } catch (err) {
      toast.error(err.message);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-4">
      <div className="flex items-center gap-3">
        <Plus size={16} className="text-accent-cyan" />
        <h2 className="font-sans text-[14px] uppercase tracking-[0.15em]">Create a team</h2>
      </div>

      <FormField label="Team name" required hint="Visible to the whole event. 2–60 chars.">
        <input className="input-glass" minLength={2} maxLength={60} required value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Domain" required>
          <select className="select-glass" required value={domainId} onChange={(e) => { setDomainId(e.target.value); setPsId(''); }}>
            <option value="">Select…</option>
            {domData?.domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </FormField>

        <FormField label="Problem statement" hint={!domainId ? 'Pick a domain first' : 'Optional, can be set later by admins.'}>
          <select className="select-glass" disabled={!domainId} value={psId} onChange={(e) => setPsId(e.target.value)}>
            <option value="">— None —</option>
            {psData?.problemStatements?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </FormField>
      </div>

      <button type="submit" disabled={busy} className="glow-button inline-flex items-center gap-2">
        {busy ? <Spinner size={14} /> : <Plus size={14} />}
        {busy ? 'Creating…' : 'Create team'}
      </button>
    </form>
  );
};

// ── Joinable list ─────────────────────────────────────────────────────────
const JoinableList = () => {
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const { data, loading, refetch } = useApi(() => api.get('/api/teams/joinable'), []);

  const teams = useMemo(
    () => (data?.teams ?? []).filter((t) => t.name.toLowerCase().includes(filter.toLowerCase())),
    [data, filter],
  );

  const requestJoin = async (teamId) => {
    try {
      await api.post(`/api/teams/${teamId}/join-requests`);
      toast.success('Join request sent.');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-label">Open teams</h2>
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input className="input-glass !pl-10" placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </div>
      {loading && <CardSkeleton rows={2} />}
      {!loading && teams.length === 0 && (
        <Empty icon={Users} title="No teams to join" description="Either none have been created yet, or your filter excludes them all." />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((t) => (
          <article key={t.id} className="glass-card flat space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-sans text-[15px] font-bold text-text-primary">{t.name}</div>
                <div className="font-mono text-[12px] text-text-secondary">{t.domain?.name} · led by {t.leader?.fullName}</div>
              </div>
              <Badge tone="cyan">{t.memberCount} member{t.memberCount !== 1 && 's'}</Badge>
            </div>
            {t.missing?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {t.missing.map((m) => (
                  <Badge key={m.code} tone="warn">{issueLabel(m.code)}</Badge>
                ))}
              </div>
            )}
            <button className="glow-button inline-flex items-center gap-2" onClick={() => requestJoin(t.id)}>
              <Send size={12} /> Request to join
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};

// ── Invite modal (leader only) ────────────────────────────────────────────
const InviteModal = ({ open, onClose, teamId, onSent }) => {
  const toast = useToast();
  const [registrationNo, setRegistrationNo] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    if (!open) {
      setRegistrationNo('');
      setBusyId('');
    }
  }, [open]);

  const lookup = useApi(
    () => registrationNo.trim()
      ? api.get('/api/teams/explore/members', { query: { search: registrationNo.trim() } })
      : Promise.resolve({ users: [] }),
    [registrationNo],
    { refetchOnFocus: false },
  );

  const candidates = useMemo(() => {
    const needle = registrationNo.trim().toLowerCase();
    if (!needle) return [];
    const users = lookup.data?.users ?? [];
    const exact = users.filter((user) => (user.registrationNo ?? '').toLowerCase() === needle);
    if (exact.length) return exact;
    return users.filter((user) => (user.registrationNo ?? '').toLowerCase().includes(needle));
  }, [lookup.data, registrationNo]);

  const sendInvite = async (inviteeId) => {
    setBusyId(inviteeId);
    try {
      await api.post(`/api/teams/${teamId}/invites`, { inviteeId });
      toast.success('Invite sent.');
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite a member" size="sm">
      <div className="space-y-4">
        <FormField label="Registration ID" required hint="Search by registration number to find the matching candidate.">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              className="input-glass !pl-10"
              required
              value={registrationNo}
              onChange={(e) => setRegistrationNo(e.target.value)}
              placeholder="Registration number..."
            />
          </div>
        </FormField>

        {!registrationNo.trim() && (
          <Empty
            icon={Search}
            title="Search by registration ID"
            description="Enter a registration number and the matching candidate will appear here."
            className="rounded-[4px] border border-border-dim bg-bg-void/40 px-4 py-8"
          />
        )}

        {registrationNo.trim() && lookup.loading && <CardSkeleton rows={1} />}

        {registrationNo.trim() && !lookup.loading && candidates.length === 0 && (
          <Empty
            icon={Users}
            title="No matching candidate"
            description="No student matched that registration number."
            className="rounded-[4px] border border-border-dim bg-bg-void/40 px-4 py-8"
          />
        )}

        <div className="space-y-3">
          {candidates.map((candidate) => {
            const blockedReason = candidate.membership?.team
              ? `${candidate.fullName} is already in ${candidate.membership.team.name}.`
              : candidate.verificationStatus !== 'VERIFIED'
                ? 'This student must be verified before they can be invited.'
                : null;

            return (
              <article key={candidate.id} className="glass-card flat space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-sans text-[14px] font-bold text-text-primary">{candidate.fullName}</div>
                    <div className="font-mono text-[11px] text-text-secondary">{candidate.email}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="cyan">{candidate.domain?.name ?? 'No domain'}</Badge>
                    {blockedReason && <Badge tone="dim">Unavailable</Badge>}
                  </div>
                </div>

                <div className="font-mono text-[11px] text-text-secondary">
                  Reg #: {candidate.registrationNo ?? '-'}
                  {candidate.institution?.name ? ` · ${candidate.institution.name}` : ''}
                </div>

                {blockedReason && (
                  <div className="font-mono text-[11px] text-text-dim">{blockedReason}</div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={Boolean(blockedReason) || busyId === candidate.id}
                    onClick={() => sendInvite(candidate.id)}
                  >
                    {busyId === candidate.id ? <Spinner size={14} /> : <UserPlus size={14} />}
                    {busyId === candidate.id ? 'Sending...' : 'Send invite'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

// ── My team detail (in-team mode) ─────────────────────────────────────────
const MyTeamView = ({ team, evaluation, onMutate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);

  const isLeader = team.leader.id === user.id;
  const isFinalized = team.status === 'FINALIZED';
  const dissolveBlockedReason = team.status === 'FINALIZED'
    ? 'Finalized teams cannot be dissolved.'
    : team.status === 'DISQUALIFIED'
      ? 'Disqualified teams cannot be dissolved.'
      : null;

  const invites  = useApi(() => api.get(`/api/teams/${team.id}/invites`), [team.id]);
  const requests = useApi(() => api.get(`/api/teams/${team.id}/join-requests`), [team.id]);

  const action = async (label, fn) => {
    try { await fn(); toast.success(label); onMutate(); }
    catch (err) { toast.error(err.message); }
  };

  const finalize       = () => action('Team finalized.', () => api.post(`/api/teams/${team.id}/finalize`));
  const cancelInvite   = (id) => action('Invite cancelled.', () => api.post(`/api/invites/${id}/cancel`));
  const approveRequest = (id) => action('Request approved.', () => api.post(`/api/join-requests/${id}/approve`));
  const denyRequest    = (id) => action('Request denied.',   () => api.post(`/api/join-requests/${id}/deny`));

  const requestLeave = async () => {
    const ok = await confirm({
      title: 'Leave the team?',
      message: 'Your leader must approve this. You\'ll stay a member until then.',
      confirmLabel: 'Submit request',
    });
    if (!ok) return;
    action('Leave request submitted.', () => api.post(`/api/teams/${team.id}/leave`, {}));
  };

  const dismissMember = async (memberId, name) => {
    const ok = await confirm({
      title: `Dismiss ${name}?`,
      message: 'They must acknowledge the dismissal before they\'re removed.',
      tone: 'crit', confirmLabel: 'Send dismissal',
    });
    if (!ok) return;
    action('Dismissal sent.', () => api.post(`/api/teams/${team.id}/dismiss`, { targetUserId: memberId }));
  };

  const transferLeader = async (newLeaderId, name) => {
    const ok = await confirm({
      title: `Transfer leadership to ${name}?`,
      message: 'You\'ll become a regular member. The new leader can manage invites and finalization.',
      confirmLabel: 'Transfer',
    });
    if (!ok) return;
    action('Leadership transferred.', () => api.post(`/api/teams/${team.id}/transfer-leadership`, { newLeaderId }));
  };

  const dissolveTeam = async () => {
    if (dissolveBlockedReason) return;
    const ok = await confirm({
      title: `Dissolve ${team.name}?`,
      message: 'This deletes the team, its pending invites, join requests, and roster state. This cannot be undone.',
      tone: 'crit',
      confirmLabel: 'Dissolve team',
    });
    if (!ok) return;
    action('Team dissolved.', () => api.delete(`/api/teams/${team.id}`));
  };

  return (
    <div className="space-y-6">
      <header className="glass-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="kicker mb-1">{team.domain?.name}{team.problemStatement && ` · ${team.problemStatement.title}`}</div>
            <h2 className="font-sans text-[24px] font-bold">{team.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={team.status === 'FINALIZED' ? 'live' : team.status === 'QUALIFIED' ? 'live' : 'warn'} dot>
              {team.status}
            </Badge>
            {isLeader && <Badge tone="cyan"><Crown size={10} className="mr-0.5"/> Leader</Badge>}
            {team.adminOverride && <Badge tone="warn">Admin override</Badge>}
          </div>
        </div>

        <StatusBanner status={team.status} issues={evaluation?.issues ?? []} />

        <div className="grid grid-cols-3 gap-3 border-t border-border-dim pt-4">
          <Stat label="Members" value={`${team.memberCount}`} />
          <Stat label="Female"  value={`${team.femaleCount}`} />
          <Stat label="Experts" value={`${team.domainExpertCount}`} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border-dim pt-4">
          {isLeader && !isFinalized && (
            <button className="glow-button inline-flex items-center gap-2" onClick={finalize} disabled={team.status !== 'QUALIFIED'}>
              <ShieldCheck size={14} /> Finalize team
            </button>
          )}
          {isLeader && !isFinalized && (
            <button className="ghost-button inline-flex items-center gap-2" onClick={() => setInviteOpen(true)}>
              <UserPlus size={12} /> Invite member
            </button>
          )}
          {isLeader && (
            <button
              className="danger-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={dissolveTeam}
              disabled={Boolean(dissolveBlockedReason)}
              title={dissolveBlockedReason ?? 'Dissolve this team'}
            >
              <XCircle size={12} /> Dissolve team
            </button>
          )}
          {!isLeader && !isFinalized && (
            <button className="danger-button inline-flex items-center gap-2" onClick={requestLeave}>
              <LogOut size={12} /> Request to leave
            </button>
          )}
        </div>

        {isLeader && dissolveBlockedReason && (
          <div className="font-mono text-[11px] text-text-dim">{dissolveBlockedReason}</div>
        )}
      </header>

      <section className="space-y-3">
        <h3 className="section-label">Members</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {team.members.map((m) => {
            const isMe = m.user.id === user.id;
            const isThisLeader = m.role === 'LEADER';
            return (
              <article key={m.user.id} className="glass-card flat flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-[4px] border border-border-dim bg-bg-void font-sans text-[13px] font-bold text-accent-cyan">
                    {(m.user.fullName ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-sans text-[14px] font-bold">
                      {m.user.fullName} {isMe && <Badge tone="dim">you</Badge>}
                    </div>
                    <div className="font-mono text-[11px] text-text-secondary">{m.user.email}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={isThisLeader ? 'cyan' : 'dim'}>{m.role}</Badge>
                  {isLeader && !isThisLeader && !isFinalized && (
                    <div className="flex gap-1">
                      <button className="ghost-button text-[10px]" onClick={() => transferLeader(m.user.id, m.user.fullName)}>
                        Make leader
                      </button>
                      <button className="danger-button text-[10px]" onClick={() => dismissMember(m.user.id, m.user.fullName)}>
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {isLeader && !isFinalized && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h3 className="section-label">Pending invites</h3>
            {invites.loading && <CardSkeleton rows={1} />}
            {invites.data?.invites.filter((i) => i.status === 'PENDING').length === 0 && (
              <Empty icon={UserPlus} title="No pending invites" />
            )}
            {invites.data?.invites.filter((i) => i.status === 'PENDING').map((i) => (
              <div key={i.id} className="glass-card flat flex items-center justify-between gap-3">
                <div>
                  <div className="font-sans text-[13px] font-bold">{i.invitee.fullName}</div>
                  <div className="font-mono text-[11px] text-text-secondary">{i.invitee.email}</div>
                </div>
                <button className="ghost-button" onClick={() => cancelInvite(i.id)}>Cancel</button>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="section-label">Join requests</h3>
            {requests.loading && <CardSkeleton rows={1} />}
            {requests.data?.requests.filter((r) => r.status === 'PENDING').length === 0 && (
              <Empty icon={UserMinus} title="No pending requests" />
            )}
            {requests.data?.requests.filter((r) => r.status === 'PENDING').map((r) => (
              <div key={r.id} className="glass-card flat space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-sans text-[13px] font-bold">{r.requester.fullName}</div>
                    <div className="font-mono text-[11px] text-text-secondary">{r.requester.email}</div>
                  </div>
                  <div className="flex gap-1">
                    {r.requester.gender === 'FEMALE' && <Badge tone="cyan">F</Badge>}
                    {r.requester.isDomainExpert && <Badge tone="live">Expert</Badge>}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button className="ghost-button" onClick={() => denyRequest(r.id)}><XCircle size={12}/> Deny</button>
                  <button className="glow-button" onClick={() => approveRequest(r.id)}><CheckCircle2 size={12}/> Approve</button>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} teamId={team.id} onSent={onMutate} />
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div>
    <div className="section-label">{label}</div>
    <div className="font-sans text-[22px] font-bold text-text-primary">{value}</div>
  </div>
);

// ── Page entry ────────────────────────────────────────────────────────────
export const TeamFormationPage = () => {
  const myTeam = useApi(() => api.get('/api/teams/mine'), []);

  // Need full detail (with members) — list is light. Refetch detail when needed.
  const detail = useApi(
    () => myTeam.data?.team ? api.get(`/api/teams/${myTeam.data.team.id}`) : Promise.resolve(null),
    [myTeam.data?.team?.id],
  );
  const evaluation = useApi(
    () => myTeam.data?.team ? api.get(`/api/teams/${myTeam.data.team.id}/evaluation`) : Promise.resolve(null),
    [myTeam.data?.team?.id],
  );

  // Refetch my-team detail when invite/request events touch us.
  useSocketEvent('invite:received', () => { myTeam.refetch(); }, []);

  const refresh = () => {
    myTeam.refetch();
    detail.refetch();
    evaluation.refetch();
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        kicker="Team Hub"
        title="Squad formation"
        description="Create a team, send invites, request to join, transfer leadership, and finalize when ready."
      />

      {myTeam.loading && <CardSkeleton rows={3} />}

      {!myTeam.loading && !myTeam.data?.team && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <CreateTeamForm onCreated={refresh} />
          <JoinableList />
        </div>
      )}

      {detail.data?.team && (
        <MyTeamView
          team={detail.data.team}
          evaluation={evaluation.data}
          onMutate={refresh}
        />
      )}
    </section>
  );
};
