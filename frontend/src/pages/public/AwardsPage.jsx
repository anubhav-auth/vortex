import { Trophy, Award, Sparkles, Presentation, Medal } from 'lucide-react';
import { api, ApiError } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';

const AwardCard = ({ icon: Icon, label, team, score, scoreLabel }) => (
  <NeonBorderCard className="h-full">
    <div className="flex h-full flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <div className="border border-white/10 bg-white/5 p-3 text-white">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{label}</span>
      </div>
      {team ? (
        <div className="mt-4 space-y-2">
          <div className="font-sans text-[22px] font-black uppercase tracking-tight text-white leading-tight">{team.name}</div>
          <div className="font-mono text-[12px] text-white/40">
            {team.domain?.name} · {team.problemStatement?.title ?? '—'}
          </div>
          <div className="pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-white/20 border-t border-white/5 mt-6">
            {scoreLabel}: <span className="text-white font-bold">{score}</span>
          </div>
        </div>
      ) : (
        <div className="mt-auto font-mono text-[12px] text-white/20 uppercase tracking-widest">Awaiting results</div>
      )}
    </div>
  </NeonBorderCard>
);

export const AwardsPage = () => {
  const { data, loading, error } = useApi(() => api.get('/api/awards'), []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        kicker="Session Recognition"
        title="Hall of Honors"
        description="Merit-based selection derived from final standings across the three rounds."
      />

      {loading && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i} rows={2}/>)}</div>}

      {error && error instanceof ApiError && error.status === 403 && (
        <Empty icon={Trophy} title="Awards restricted" description="Awards become visible once organizers release the leaderboard." />
      )}

      {error && !(error instanceof ApiError && error.status === 403) && (
        <Empty icon={Trophy} title="Signal Lost" description={error.message} />
      )}

      {data?.awards && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AwardCard
            icon={Trophy} label="Grand Prize"
            team={data.awards.grandPrize?.team} score={data.awards.grandPrize?.finalScore} scoreLabel="Final Score"
          />
          <AwardCard
            icon={Sparkles} label="Top Innovation"
            team={data.awards.topInnovation?.team} score={data.awards.topInnovation?.score} scoreLabel="Innovation Index"
          />
          <AwardCard
            icon={Presentation} label="Top Presentation"
            team={data.awards.topPresentation?.team} score={data.awards.topPresentation?.score} scoreLabel="Presentation Merit"
          />
          {(data.awards.domainChampions ?? []).map((c) => (
            <AwardCard
              key={c.domain.id}
              icon={Medal} label={`${c.domain.name} Champion`}
              team={c.team} score={c.finalScore} scoreLabel="Final Score"
            />
          ))}
          {(!data.awards.domainChampions || data.awards.domainChampions.length === 0) && (
            <NeonBorderCard className="h-full">
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center opacity-40">
                <Award size={32} strokeWidth={1} />
                <div className="font-mono text-[11px] uppercase tracking-[0.3em]">Sector champions pending</div>
              </div>
            </NeonBorderCard>
          )}
        </div>
      )}
    </section>
  );
};
