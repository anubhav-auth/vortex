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
        <div className="overflow-hidden rounded-none border border-white/5 bg-black">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] md:min-w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-4 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Rank</th>
                  <th className="px-4 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Team</th>
                  <th className="hidden px-4 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40 sm:table-cell">Domain</th>
                  <th className="hidden px-4 py-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40 md:table-cell">Problem</th>
                  <th className="px-4 py-4 text-right font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40">R1</th>
                  <th className="px-4 py-4 text-right font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40">R2</th>
                  <th className="px-4 py-4 text-right font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/40">R3</th>
                  <th className="px-4 py-4 text-right font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.team.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-4">
                      <Badge tone={RANK_TONE(e.rank)}>#{e.rank ?? '—'}</Badge>
                    </td>
                    <td className="px-4 py-4 font-sans text-[14px] font-black text-white whitespace-nowrap uppercase tracking-tight">{e.team.name}</td>
                    <td className="hidden px-4 py-4 font-mono text-[12px] text-white/40 sm:table-cell whitespace-nowrap">{e.team.domain.name}</td>
                    <td className="hidden px-4 py-4 font-mono text-[12px] text-white/40 md:table-cell">
                      {e.team.problemStatement?.title ?? '—'}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-[13px] text-white/60">{data.showMarks ? (e.r1Score ?? '—') : '••'}</td>
                    <td className="px-4 py-4 text-right font-mono text-[13px] text-white/60">{data.showMarks ? (e.r2Score ?? '—') : '••'}</td>
                    <td className="px-4 py-4 text-right font-mono text-[13px] text-white/60">{data.showMarks ? (e.r3Score ?? '—') : '••'}</td>
                    <td className="px-4 py-4 text-right font-mono text-[15px] font-black text-white">
                      {data.showMarks ? (e.finalScore ?? '—') : '••'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.showMarks && (
            <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
              Marks hidden by organizers — ranks only
            </div>
          )}
        </div>
      )}
    </section>
  );
};
