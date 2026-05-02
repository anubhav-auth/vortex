import { Trophy, EyeOff } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useApi } from '../../hooks/useApi.js';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Empty } from '../../components/ui/Empty.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ApiError } from '../../lib/api.js';

const RANK_TONE = (rank) =>
  rank === 1 ? 'live' : rank === 2 ? 'cyan' : rank === 3 ? 'warn' : 'dim';

export const LeaderboardPage = () => {
  const { data, loading, error, refetch } = useApi(() => api.get('/api/leaderboard'), []);

  // Server tells us when a score lands → refetch.
  useSocketEvent('leaderboard:changed', () => refetch(), []);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        kicker="Live Standings"
        title="Leaderboard"
        description="Aggregated across all rounds. Updates in real time as juries submit scores."
      />

      {loading && <CardSkeleton rows={5} />}

      {error && error instanceof ApiError && error.status === 403 && (
        <Empty
          icon={EyeOff}
          title="Leaderboard hidden"
          description="The organizers have disabled the leaderboard. Check back later."
        />
      )}

      {error && !(error instanceof ApiError && error.status === 403) && (
        <Empty icon={EyeOff} title="Couldn't load" description={error.message} />
      )}

      {data && data.entries.length === 0 && (
        <Empty
          icon={Trophy}
          title="No scores yet"
          description="Once juries start submitting evaluations, ranks will appear here."
        />
      )}

      {data && data.entries.length > 0 && (
        <div className="overflow-hidden rounded-[4px] border border-border-dim bg-bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-dim text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">Rank</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">Team</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">Domain</th>
                <th className="hidden px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim md:table-cell">Problem</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">R1</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">R2</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">R3</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-accent-cyan">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr key={e.team.id} className="border-b border-border-dim/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Badge tone={RANK_TONE(e.rank)}>#{e.rank ?? '—'}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-text-primary">{e.team.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">{e.team.domain.name}</td>
                  <td className="hidden px-4 py-3 font-mono text-[12px] text-text-secondary md:table-cell">
                    {e.team.problemStatement?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">{data.showMarks ? (e.r1Score ?? '—') : '••'}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">{data.showMarks ? (e.r2Score ?? '—') : '••'}</td>
                  <td className="px-4 py-3 text-right font-mono text-[13px]">{data.showMarks ? (e.r3Score ?? '—') : '••'}</td>
                  <td className="px-4 py-3 text-right font-mono text-[14px] font-bold text-accent-cyan">
                    {data.showMarks ? (e.finalScore ?? '—') : '••'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.showMarks && (
            <div className="border-t border-border-dim bg-bg-void/50 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">
              Marks hidden by organizers — ranks only
            </div>
          )}
        </div>
      )}
    </section>
  );
};
