import { Trophy, Award, Sparkles, Presentation, Medal } from 'lucide-react';
import { api, ApiError } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { NeonBorderCard } from '../../components/ui/NeonBorderCard.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';

const AwardCard = ({ icon: Icon, label, accent, team, score, scoreLabel }) => (
  <NeonBorderCard className="h-full">
    <div className="flex h-full flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <Icon size={22} className={accent} />
        <span className={`section-label ${accent}`}>{label}</span>
      </div>
      {team ? (
        <>
          <div className="font-sans text-[20px] font-bold text-text-primary">{team.name}</div>
          <div className="font-mono text-[12px] text-text-secondary">
            {team.domain?.name} · {team.problemStatement?.title ?? '—'}
          </div>
          <div className="mt-auto pt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-text-dim">
            {scoreLabel}: <span className="text-text-primary">{score}</span>
          </div>
        </>
      ) : (
        <div className="font-mono text-[12px] text-text-dim">Awaiting results</div>
      )}
    </div>
  </NeonBorderCard>
);

export const AwardsPage = () => {
  const { data, loading, error } = useApi(() => api.get('/api/awards'), []);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <PageHeader
        kicker="Recognition"
        title="Awards"
        description="Derived from final standings across the three rounds."
      />

      {loading && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:4}).map((_,i)=><CardSkeleton key={i} rows={2}/>)}</div>}

      {error && error instanceof ApiError && error.status === 403 && (
        <Empty icon={Trophy} title="Awards hidden" description="Awards become visible once organizers release the leaderboard." />
      )}

      {error && !(error instanceof ApiError && error.status === 403) && (
        <Empty icon={Trophy} title="Couldn't load" description={error.message} />
      )}

      {data?.awards && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AwardCard
            icon={Trophy} label="Grand Prize" accent="text-status-live"
            team={data.awards.grandPrize?.team} score={data.awards.grandPrize?.finalScore} scoreLabel="Final"
          />
          <AwardCard
            icon={Sparkles} label="Top Innovation" accent="text-accent-cyan"
            team={data.awards.topInnovation?.team} score={data.awards.topInnovation?.score} scoreLabel="Innovation"
          />
          <AwardCard
            icon={Presentation} label="Top Presentation" accent="text-status-warn"
            team={data.awards.topPresentation?.team} score={data.awards.topPresentation?.score} scoreLabel="Presentation"
          />
          {(data.awards.domainChampions ?? []).map((c) => (
            <AwardCard
              key={c.domain.id}
              icon={Medal} label={`${c.domain.name} Champion`} accent="text-text-primary"
              team={c.team} score={c.finalScore} scoreLabel="Final"
            />
          ))}
          {(!data.awards.domainChampions || data.awards.domainChampions.length === 0) && (
            <NeonBorderCard className="h-full">
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <Award size={20} className="text-text-dim" />
                <div className="font-mono text-[12px] text-text-dim">Domain champions not yet decided</div>
              </div>
            </NeonBorderCard>
          )}
        </div>
      )}
    </section>
  );
};
