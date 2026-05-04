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
            <StatTile icon={ShieldCheck} label="Verified"   value={verifiedCount} />
            <StatTile icon={Trophy}      label="Qualified Teams" value={qualifiedTeams} hint={`${finalizedTeams} finalized`} />
            <StatTile icon={Activity}    label="Total Teams" value={teams.data?.teams.length ?? 0} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <section className="glass-card flat lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-sans text-[14px] font-black uppercase tracking-[0.2em] text-white">Round control</h2>
                <Link to="/admin/rounds" className="ghost-button">Manage</Link>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {['ROUND_1','ROUND_2','ROUND_3'].map((r) => {
                  const state = rounds.data?.control?.[ROUND_FIELD[r]] ?? 'LOCKED';
                  const tone = state === 'UNLOCKED' ? 'live' : state === 'CLOSED' ? 'warn' : 'dim';
                  const Icon = state === 'UNLOCKED' ? Unlock : Lock;
                  return (
                    <div key={r} className="rounded-none border border-white/5 bg-black p-6 text-center transition-all hover:border-white/20">
                      <Icon size={20} className="mx-auto mb-3 text-white/40" />
                      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">{r.replace('_',' ')}</div>
                      <div className="mt-4"><Badge tone={tone}>{state}</Badge></div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass-card flat">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-sans text-[14px] font-black uppercase tracking-[0.2em] text-white">Rules engine</h2>
                <Link to="/admin/rules" className="ghost-button">Edit</Link>
              </div>
              <dl className="space-y-3 font-mono text-[12px]">
                <Line label="Min team size" value={rules.data?.rules?.minTeamSize} />
                <Line label="Max team size" value={rules.data?.rules?.maxTeamSize} />
                <Line label="Min female"    value={rules.data?.rules?.minFemaleMembers} />
                <Line label="Min experts"   value={rules.data?.rules?.minDomainExperts} />
                <Line label="Registration"  value={rules.data?.rules?.registrationOpen ? 'OPEN' : 'CLOSED'} />
                <Line label="Leaderboard"   value={rules.data?.rules?.leaderboardVisible ? 'VISIBLE' : 'HIDDEN'} />
              </dl>
            </section>

            <section className="glass-card flat lg:col-span-3">
              <div className="mb-6">
                <h2 className="font-sans text-[14px] font-black uppercase tracking-[0.2em] text-white">Tactical actions</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/admin/verification" className="ghost-button inline-flex items-center gap-3 py-3 px-6">
                  <ShieldCheck size={14}/> 
                  <span>Review pending ({pending.data?.users.length ?? 0})</span>
                </Link>
                <Link to="/admin/teams" className="ghost-button inline-flex items-center gap-3 py-3 px-6">
                  <Users size={14}/> 
                  <span>Manage squads</span>
                </Link>
                <Link to="/admin/broadcast" className="ghost-button inline-flex items-center gap-3 py-3 px-6">
                  <Megaphone size={14}/> 
                  <span>Signal broadcast</span>
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
};

const Line = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
    <span className="text-white/40 uppercase text-[10px] tracking-wider">{label}</span>
    <span className="text-white font-bold">{value ?? '—'}</span>
  </div>
);
