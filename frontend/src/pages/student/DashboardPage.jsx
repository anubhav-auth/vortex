import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, Mail, ArrowRight, Inbox, Megaphone, ExternalLink,
  Github, Linkedin, IdCard, GraduationCap, Layers, Search, UserPlus, Send,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useBroadcasts } from '../../contexts/BroadcastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';

const ROLE_TONE = { ADMIN: 'warn', JURY: 'cyan', STUDENT: 'live' };

const ProfileTab = ({ user }) => (
  <div className="grid gap-6 md:grid-cols-3">
    <section className="glass-card flat md:col-span-2">
      <div className="mb-4 flex items-center gap-3">
        <User size={16} className="text-accent-cyan" />
        <h2 className="font-sans text-[14px] uppercase tracking-[0.15em]">Profile</h2>
      </div>
      <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
        <Field icon={User} label="Name" value={user.fullName} />
        <Field icon={Mail} label="Email" value={user.email} />
        <Field icon={IdCard} label="Registration #" value={user.registrationNo ?? '-'} />
        <Field icon={GraduationCap} label="Institution" value={user.institution?.name ?? '-'} />
        <Field icon={Layers} label="Domain" value={user.domain?.name ?? '-'} />
        <Field icon={Layers} label="Track" value={user.track ?? '-'} />
        <Field icon={Mail} label="Phone" value={user.phone ?? '-'} />
        <Field icon={Mail} label="Discord" value={user.discordId ?? '-'} />
      </dl>

      {user.bio && (
        <div className="mt-5 border-t border-border-dim pt-4">
          <div className="section-label mb-2">Bio</div>
          <p className="font-mono text-[13px] leading-relaxed text-text-secondary">{user.bio}</p>
        </div>
      )}

      {(user.linkedinUrl || user.githubUrl) && (
        <div className="mt-5 flex items-center gap-3 border-t border-border-dim pt-4">
          {user.linkedinUrl && (
            <a
              href={user.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="ghost-button inline-flex items-center gap-2"
            >
              <Linkedin size={12} /> LinkedIn
            </a>
          )}
          {user.githubUrl && (
            <a
              href={user.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="ghost-button inline-flex items-center gap-2"
            >
              <Github size={12} /> GitHub
            </a>
          )}
        </div>
      )}
    </section>

    <aside className="glass-card flat space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-[4px] border border-border-dim bg-bg-void font-sans text-[16px] font-bold text-accent-cyan">
          {(user.fullName ?? '?').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="font-sans text-[14px] font-bold">{user.fullName}</div>
          <Badge tone={ROLE_TONE[user.role]} dot>{user.role}</Badge>
        </div>
      </div>

      <div className="border-t border-border-dim pt-3">
        <div className="section-label mb-2">Status</div>
        <Badge tone={user.verificationStatus === 'VERIFIED' ? 'live' : 'warn'} dot>
          {titleCase(user.verificationStatus)}
        </Badge>
      </div>

      <div className="space-y-2 border-t border-border-dim pt-3">
        <Link to="/teams" className="glow-button inline-flex w-full items-center justify-center gap-2">
          Team Hub <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  </div>
);

const Field = ({ icon: Icon, label, value }) => (
  <div className="space-y-0.5">
    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">
      <Icon size={11} /> {label}
    </div>
    <div className="font-mono text-[13px] text-text-primary">{value}</div>
  </div>
);

const InboxTab = () => {
  const toast = useToast();
  const invites = useApi(() => api.get('/api/invites/me'), []);
  const requests = useApi(() => api.get('/api/join-requests/me'), []);

  useSocketEvent('invite:received', () => invites.refetch(), [invites.refetch]);

  const accept = async (id) => {
    try {
      await api.post(`/api/invites/${id}/accept`);
      toast.success('Joined the team.');
      invites.refetch();
      requests.refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const decline = async (id) => {
    try {
      await api.post(`/api/invites/${id}/decline`);
      toast.info('Invite declined.');
      invites.refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const cancel = async (id) => {
    try {
      await api.post(`/api/join-requests/${id}/cancel`);
      toast.info('Request cancelled.');
      requests.refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="section-label">Pending invites</h2>
        {invites.loading && <CardSkeleton rows={2} />}
        {invites.data?.invites.length === 0 && (
          <Empty icon={Inbox} title="No pending invites" description="Leaders can send you invites from the Teams page." />
        )}
        {invites.data?.invites.map((inv) => (
          <article key={inv.id} className="glass-card flat space-y-3">
            <div>
              <div className="font-sans text-[15px] font-bold text-text-primary">{inv.team.name}</div>
              <div className="font-mono text-[12px] text-text-secondary">
                {inv.team.domain?.name} · led by {inv.team.leader?.fullName}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-text-dim">{formatRelative(inv.createdAt)}</span>
              <div className="flex gap-2">
                <button className="ghost-button" onClick={() => decline(inv.id)}>Decline</button>
                <button className="glow-button" onClick={() => accept(inv.id)}>Accept</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="section-label">My outgoing requests</h2>
        {requests.loading && <CardSkeleton rows={2} />}
        {requests.data?.requests.length === 0 && (
          <Empty icon={Inbox} title="No outgoing requests" description="Find a team on the Explore tab and request to join." />
        )}
        {requests.data?.requests.map((r) => (
          <article key={r.id} className="glass-card flat flex items-center justify-between gap-3">
            <div>
              <div className="font-sans text-[14px] font-bold">{r.team.name}</div>
              <div className="font-mono text-[12px] text-text-secondary">{r.team.domain?.name}</div>
            </div>
            <button className="ghost-button" onClick={() => cancel(r.id)}>Cancel</button>
          </article>
        ))}
      </section>
    </div>
  );
};

const BroadcastsTab = () => {
  const { latest } = useBroadcasts();
  if (latest.length === 0) {
    return <Empty icon={Megaphone} title="No broadcasts yet" description="Organizer announcements appear here in real time." />;
  }
  return (
    <div className="space-y-3">
      {latest.map((b) => (
        <article key={b.id} className="glass-card flat space-y-2">
          <div className="flex items-center justify-between">
            <Badge tone="cyan" dot>Broadcast</Badge>
            <span className="font-mono text-[11px] text-text-dim">{formatRelative(b.createdAt)}</span>
          </div>
          <p className="font-mono text-[13px] leading-relaxed text-text-primary">{b.message}</p>
          <div className="font-mono text-[11px] text-text-dim">- {b.sender?.fullName}</div>
        </article>
      ))}
    </div>
  );
};

const ExploreTab = ({ user, myTeam }) => {
  const toast = useToast();
  const [memberFilter, setMemberFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const members = useApi(() => api.get('/api/teams/explore/members'), []);
  const teams = useApi(() => api.get('/api/teams'), []);
  const joinable = useApi(() => api.get('/api/teams/joinable'), []);
  const outgoingRequests = useApi(() => api.get('/api/join-requests/me'), []);

  const leaderOwnTeam = myTeam?.leader?.id === user.id ? myTeam : null;
  const pendingInvites = useApi(
    () => leaderOwnTeam
      ? api.get(`/api/teams/${leaderOwnTeam.id}/invites`, { query: { status: 'PENDING' } })
      : Promise.resolve({ invites: [] }),
    [leaderOwnTeam?.id],
  );

  const joinableTeamIds = useMemo(
    () => new Set((joinable.data?.teams ?? []).map((team) => team.id)),
    [joinable.data],
  );

  const pendingRequestTeamIds = useMemo(
    () => new Set((outgoingRequests.data?.requests ?? []).map((request) => request.team.id)),
    [outgoingRequests.data],
  );

  const pendingInviteUserIds = useMemo(
    () => new Set((pendingInvites.data?.invites ?? []).map((invite) => invite.invitee.id)),
    [pendingInvites.data],
  );

  const visibleMembers = useMemo(() => {
    const all = members.data?.users ?? [];
    const needle = memberFilter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((member) =>
      [
        member.fullName,
        member.email,
        member.registrationNo,
        member.institution?.name,
        member.domain?.name,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [members.data, memberFilter]);

  const visibleTeams = useMemo(() => {
    const all = (teams.data?.teams ?? []).filter((team) => team.id !== myTeam?.id);
    const needle = teamFilter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((team) =>
      [team.name, team.domain?.name, team.leader?.fullName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [teams.data, teamFilter, myTeam?.id]);

  const inviteDisabledReason = useMemo(() => {
    if (!leaderOwnTeam && myTeam) return 'Only the creator of a team can send invites.';
    if (!leaderOwnTeam) return 'First create your own team.';
    if (leaderOwnTeam.status === 'FINALIZED') return 'Your team is finalized.';
    if (leaderOwnTeam.status === 'DISQUALIFIED') return 'Your team is disqualified.';
    return null;
  }, [leaderOwnTeam, myTeam]);

  const memberActionState = (member) => {
    if (pendingInviteUserIds.has(member.id)) {
      return { disabled: true, label: 'Invite pending', reason: 'An invite is already pending for this user.' };
    }
    if (member.membership?.team) {
      return {
        disabled: true,
        label: 'Already in a team',
        reason: `${member.fullName} is already in ${member.membership.team.name}.`,
      };
    }
    if (member.verificationStatus !== 'VERIFIED') {
      return {
        disabled: true,
        label: 'Not verified',
        reason: 'This user must be verified before they can join a team.',
      };
    }
    if (inviteDisabledReason) {
      return {
        disabled: true,
        label: myTeam ? 'Invite unavailable' : 'Create team first',
        reason: inviteDisabledReason,
      };
    }
    return { disabled: false, label: 'Send invite', reason: 'Ready to invite.' };
  };

  const sendInvite = async (inviteeId) => {
    if (!leaderOwnTeam) return;
    try {
      await api.post(`/api/teams/${leaderOwnTeam.id}/invites`, { inviteeId });
      toast.success('Invite sent.');
      pendingInvites.refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sendJoinRequest = async (teamId) => {
    try {
      await api.post(`/api/teams/${teamId}/join-requests`);
      toast.success('Join request sent.');
      outgoingRequests.refetch();
      joinable.refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const teamActionState = (team) => {
    if (pendingRequestTeamIds.has(team.id)) {
      return { disabled: true, label: 'Request pending' };
    }
    if (myTeam?.leader?.id === user.id) {
      return { disabled: true, label: 'You already created your own team' };
    }
    if (myTeam) {
      return { disabled: true, label: 'You are already in a team' };
    }
    if (!joinableTeamIds.has(team.id)) {
      return { disabled: true, label: 'Not accepting requests' };
    }
    return { disabled: false, label: 'Send request' };
  };

  return (
    <div className="grid gap-8 xl:grid-cols-2 xl:items-start">
      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-label">Available members</h2>
            <p className="font-mono text-[12px] text-text-secondary">
              Every registered student appears here, even if they already belong to a team.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              className="input-glass pl-9"
              placeholder="Search members..."
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
            />
          </div>
        </div>

        {members.loading || pendingInvites.loading ? <CardSkeleton rows={2} /> : null}
        {!members.loading && visibleMembers.length === 0 && (
          <Empty icon={Users} title="No members found" description="No registered student matched your current member search." />
        )}

        <div className="space-y-4">
          {visibleMembers.map((member) => {
            const action = memberActionState(member);

            return (
              <article key={member.id} className="glass-card flat space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-sans text-[15px] font-bold text-text-primary">{member.fullName}</div>
                    <div className="font-mono text-[12px] text-text-secondary">{member.email}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Badge tone="cyan">{member.domain?.name ?? 'No domain'}</Badge>
                    {member.gender === 'FEMALE' && <Badge tone="live">Female</Badge>}
                    {member.isDomainExpert && <Badge tone="warn">Expert</Badge>}
                    {member.verificationStatus !== 'VERIFIED' && <Badge tone="warn">{titleCase(member.verificationStatus)}</Badge>}
                  </div>
                </div>

                <div className="grid gap-2 font-mono text-[11px] text-text-secondary sm:grid-cols-2">
                  <div>Reg #: {member.registrationNo ?? '-'}</div>
                  <div>Track: {member.track ?? '-'}</div>
                  <div className="sm:col-span-2">Institution: {member.institution?.name ?? '-'}</div>
                </div>

                {member.membership?.team && (
                  <div className="font-mono text-[11px] text-text-secondary">
                    Team: {member.membership.team.name} ({member.membership.team.status})
                  </div>
                )}

                <div className="font-mono text-[11px] text-text-dim">{action.reason}</div>

                <button
                  className="ghost-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={action.disabled}
                  onClick={() => sendInvite(member.id)}
                  title={action.reason}
                >
                  {pendingInvites.loading ? <Spinner size={12} /> : <UserPlus size={12} />}
                  {action.label}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-label">Available teams</h2>
            <p className="font-mono text-[12px] text-text-secondary">
              Browse every other team and send a join request only when you are not already in one.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              className="input-glass pl-9"
              placeholder="Search teams..."
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            />
          </div>
        </div>

        {teams.loading || joinable.loading || outgoingRequests.loading ? <CardSkeleton rows={2} /> : null}
        {!teams.loading && visibleTeams.length === 0 && (
          <Empty icon={Users} title="No other teams visible" description="Your own team is hidden here. No other team matched your search." />
        )}

        <div className="space-y-4">
          {visibleTeams.map((team) => {
            const action = teamActionState(team);
            return (
              <article key={team.id} className="glass-card flat space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-sans text-[15px] font-bold text-text-primary">{team.name}</div>
                    <div className="font-mono text-[12px] text-text-secondary">
                      {team.domain?.name} · led by {team.leader?.fullName}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Badge tone={joinableTeamIds.has(team.id) ? 'cyan' : 'dim'}>{team.status}</Badge>
                    <Badge tone="dim">{team.memberCount} members</Badge>
                  </div>
                </div>

                <div className="font-mono text-[11px] text-text-dim">
                  {action.disabled
                    ? action.label
                    : 'Open for join requests right now.'}
                </div>

                <button
                  className="glow-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={action.disabled}
                  onClick={() => sendJoinRequest(team.id)}
                >
                  {outgoingRequests.loading ? <Spinner size={12} /> : <Send size={12} />}
                  {action.label}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');

  const me = useApi(() => api.get('/api/auth/me'), []);
  const myTeam = useApi(() => api.get('/api/teams/mine'), []);
  const u = me.data?.user ?? user;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        kicker={`Welcome, ${u.fullName.split(' ')[0]}`}
        title="Dashboard"
        description="Your profile, team status, inbox and live announcements."
        actions={
          u.role === 'STUDENT'
            ? <Link to="/teams" className="ghost-button inline-flex items-center gap-2"><Users size={12} /> Team Hub <ExternalLink size={12} /></Link>
            : null
        }
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'profile', label: 'Profile', icon: User },
          ...(u.role === 'STUDENT' ? [{ value: 'explore', label: 'Explore', icon: Search }] : []),
          { value: 'inbox', label: 'Inbox', icon: Inbox },
          { value: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
        ]}
      />

      <div className="fade-in">
        {me.loading
          ? <CardSkeleton rows={4} />
          : tab === 'profile'
            ? <ProfileTab user={u} />
            : tab === 'explore'
              ? <ExploreTab user={u} myTeam={myTeam.data?.team ?? null} />
              : tab === 'inbox'
                ? <InboxTab />
                : <BroadcastsTab />}
      </div>
    </section>
  );
};
