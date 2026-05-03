import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Users, Mail, ArrowRight, Inbox, Megaphone, ExternalLink,
  Github, Linkedin, IdCard, GraduationCap, Layers,
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
        <Field icon={User}        label="Name"           value={user.fullName} />
        <Field icon={Mail}        label="Email"          value={user.email} />
        <Field icon={IdCard}      label="Registration #" value={user.registrationNo ?? '—'} />
        <Field icon={GraduationCap} label="Institution"  value={user.institution?.name ?? '—'} />
        <Field icon={Layers}      label="Domain"         value={user.domain?.name ?? '—'} />
        <Field icon={Layers}      label="Track"          value={user.track ?? '—'} />
        <Field icon={Mail}        label="Phone"          value={user.phone ?? '—'} />
        <Field icon={Mail}        label="Discord"        value={user.discordId ?? '—'} />
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
            <a href={user.linkedinUrl} target="_blank" rel="noreferrer"
               className="ghost-button inline-flex items-center gap-2">
              <Linkedin size={12} /> LinkedIn
            </a>
          )}
          {user.githubUrl && (
            <a href={user.githubUrl} target="_blank" rel="noreferrer"
               className="ghost-button inline-flex items-center gap-2">
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

  // Real-time invite arrival.
  useSocketEvent('invite:received', () => invites.refetch(), [invites.refetch]);

  const accept = async (id) => {
    try {
      await api.post(`/api/invites/${id}/accept`);
      toast.success('Joined the team.');
      invites.refetch(); requests.refetch();
    } catch (e) { toast.error(e.message); }
  };
  const decline = async (id) => {
    try {
      await api.post(`/api/invites/${id}/decline`);
      toast.info('Invite declined.');
      invites.refetch();
    } catch (e) { toast.error(e.message); }
  };
  const cancel = async (id) => {
    try {
      await api.post(`/api/join-requests/${id}/cancel`);
      toast.info('Request cancelled.');
      requests.refetch();
    } catch (e) { toast.error(e.message); }
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
          <Empty icon={Inbox} title="No outgoing requests" description="Find a team on the Teams page and request to join." />
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
          <div className="font-mono text-[11px] text-text-dim">— {b.sender?.fullName}</div>
        </article>
      ))}
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('profile');

  // Always pull the freshest /me — covers the case where admin tweaks
  // your row while you're logged in.
  const me = useApi(() => api.get('/api/auth/me'), []);
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
          { value: 'profile',    label: 'Profile',    icon: User },
          { value: 'inbox',      label: 'Inbox',      icon: Inbox },
          { value: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
        ]}
      />

      <div className="fade-in">
        {me.loading
          ? <CardSkeleton rows={4} />
          : tab === 'profile'    ? <ProfileTab user={u} />
          : tab === 'inbox'      ? <InboxTab />
          :                        <BroadcastsTab />}
      </div>
    </section>
  );
};
