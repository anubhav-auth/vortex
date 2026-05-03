import { Users, ShieldCheck, Trophy, Lock, Unlock, Megaphone, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatTile } from '../../components/ui/StatTile.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

const ROUND_FIELD = { ROUND_1: 'round1State', ROUND_2: 'round2State', ROUND_3: 'round3State' };

export const AdminOverviewPage = () => {
  const pending  = useApi(() => api.get('/api/admin/verification/pending'), []);
  const students = useApi(() => api.get('/api/admin/verification/students'), []);
  const teams    = useApi(() => api.get('/api/teams'), []);
  const rules    = useApi(() => api.get('/api/admin/rules'), []);
  const rounds   = useApi(() => api.get('/api/admin/rounds'), []);

  const verifiedCount  = (students.data?.users ?? []).filter((u) => u.verificationStatus === 'VERIFIED').length;
  const finalizedTeams = (teams.data?.teams ?? []).filter((t) => t.status === 'FINALIZED').length;
  const qualifiedTeams = (teams.data?.teams ?? []).filter((t) => t.status === 'QUALIFIED').length;

  const loading = pending.loading || students.loading || teams.loading || rules.loading || rounds.loading;

  return (
    <>
      <PageHeader
        kicker="Mission Control"
        title="Overview"
        description="Realtime snapshot of registrations, teams and the rules engine."
      />

      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i} rows={1}/>)}</div>}

      {!loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile icon={Users}       label="Registered" value={students.data?.users.length ?? 0} hint={`${pending.data?.users.length ?? 0} awaiting review`} />
            <StatTile icon={ShieldCheck} label="Verified"   value={verifiedCount} tone="live" />
            <StatTile icon={Trophy}      label="Qualified Teams" value={qualifiedTeams} tone="cyan" hint={`${finalizedTeams} finalized`} />
            <StatTile icon={Activity}    label="Total Teams" value={teams.data?.teams.length ?? 0} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <section className="glass-card flat lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-[14px] uppercase tracking-[0.15em]">Round control</h2>
                <Link to="/admin/rounds" className="ghost-button">Manage</Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['ROUND_1','ROUND_2','ROUND_3'].map((r) => {
                  const state = rounds.data?.control?.[ROUND_FIELD[r]] ?? 'LOCKED';
                  const tone = state === 'UNLOCKED' ? 'live' : state === 'CLOSED' ? 'warn' : 'dim';
                  const Icon = state === 'UNLOCKED' ? Unlock : Lock;
                  return (
                    <div key={r} className="rounded-[4px] border border-border-dim bg-bg-void p-4 text-center">
                      <Icon size={18} className="mx-auto mb-2 text-text-dim" />
                      <div className="font-sans text-[12px] uppercase tracking-[0.15em] text-text-secondary">{r.replace('_',' ')}</div>
                      <div className="mt-2"><Badge tone={tone} dot>{state}</Badge></div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass-card flat">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-[14px] uppercase tracking-[0.15em]">Rules</h2>
                <Link to="/admin/rules" className="ghost-button">Edit</Link>
              </div>
              <dl className="space-y-2 font-mono text-[12px]">
                <Line label="Min team size" value={rules.data?.rules?.minTeamSize} />
                <Line label="Max team size" value={rules.data?.rules?.maxTeamSize} />
                <Line label="Min female"    value={rules.data?.rules?.minFemaleMembers} />
                <Line label="Min experts"   value={rules.data?.rules?.minDomainExperts} />
                <Line label="Registration"  value={rules.data?.rules?.registrationOpen ? 'OPEN' : 'CLOSED'} />
                <Line label="Leaderboard"   value={rules.data?.rules?.leaderboardVisible ? 'VISIBLE' : 'HIDDEN'} />
              </dl>
            </section>

            <section className="glass-card flat lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-sans text-[14px] uppercase tracking-[0.15em]">Quick links</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/verification" className="ghost-button inline-flex items-center gap-2"><ShieldCheck size={12}/> Review pending ({pending.data?.users.length ?? 0})</Link>
                <Link to="/admin/teams"        className="ghost-button inline-flex items-center gap-2"><Users size={12}/> Manage teams</Link>
                <Link to="/admin/broadcast"    className="ghost-button inline-flex items-center gap-2"><Megaphone size={12}/> Send broadcast</Link>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
};

const Line = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-text-dim">{label}</span>
    <span className="text-text-primary">{value ?? '—'}</span>
  </div>
);
