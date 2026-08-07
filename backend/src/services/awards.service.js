import { prisma } from '../config/db.js';
import { rulesService } from './rules.service.js';

// Awards are derived, never stored. Read from Leaderboard + Evaluation,
// honor HackathonRules.leaderboardVisible, surface as a single payload.
//
// Award shapes:
//   grandPrize        — team with rank=1
//   topInnovation     — team with max sum(Evaluation.innovation)
//   topPresentation   — team with max sum(Evaluation.presentation)
//   domainChampions   — top-ranked team per domain
//
// Returns null fields when no scores exist yet, so the FE can render
// 'Awaiting results' rather than crash.

const TEAM_PROJECTION = {
  id: true, name: true,
  domain: { select: { id: true, name: true } },
  problemStatement: { select: { id: true, title: true } },
  leader: { select: { id: true, fullName: true } },
};

const grandPrize = async () => {
  const top = await prisma.leaderboardEntry.findFirst({
    where: { rank: 1 },
    include: { team: { select: TEAM_PROJECTION } },
  });
  if (!top) return null;
  return { team: top.team, finalScore: top.finalScore };
};

const metricChampion = async (metric) => {
  // Group evaluations by team, sum the metric, take the highest.
  const grouped = await prisma.evaluation.groupBy({
    by: ['teamId'],
    _sum: { [metric]: true },
    orderBy: { _sum: { [metric]: 'desc' } },
    take: 1,
  });
  if (!grouped.length || grouped[0]._sum[metric] == null) return null;
  const { teamId, _sum } = grouped[0];
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: TEAM_PROJECTION });
  return { team, score: _sum[metric] };
};

const domainChampions = async () => {
  // Single query: rank rows joined to team+domain. Iterate, keep first
  // per domain (rows are already ordered by rank asc, nulls last).
  const rows = await prisma.leaderboardEntry.findMany({
    where: { rank: { not: null } },
    orderBy: [{ rank: 'asc' }],
    include: { team: { select: TEAM_PROJECTION } },
  });
  const seen = new Set();
  const champions = [];
  for (const row of rows) {
    const domainId = row.team.domain.id;
    if (seen.has(domainId)) continue;
    seen.add(domainId);
    champions.push({
      domain: row.team.domain,
      team: row.team,
      finalScore: row.finalScore,
      rank: row.rank,
    });
  }
  return champions;
};

export const awardsService = {
  async list() {
    const rules = await rulesService.get();
    if (!rules.leaderboardVisible) {
      return { hidden: true };
    }

    const [grand, innovation, presentation, byDomain] = await Promise.all([
      grandPrize(),
      metricChampion('innovation'),
      metricChampion('presentation'),
      domainChampions(),
    ]);

    return {
      hidden: false,
      grandPrize: grand,
      topInnovation: innovation,
      topPresentation: presentation,
      domainChampions: byDomain,
    };
  },
};
