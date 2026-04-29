import { prisma } from '../config/db.js';

export const getAwards = async (_req, res, next) => {
  try {
    // Fetch full leaderboard with team + PS + domain info
    const leaderboard = await prisma.leaderboard.findMany({
      where: { finalScore: { not: null } },
      orderBy: { rankPosition: 'asc' },
      include: {
        team: {
          include: {
            problemStatement: {
              include: { domain: true },
            },
            leader: true,
          },
        },
      },
    });

    if (leaderboard.length === 0) {
      return res.json({ message: 'No awards yet — leaderboard is empty', awards: {} });
    }

    // --- Grand Prize: Rank 1 team ---
    const grandPrize = leaderboard.find(e => e.rankPosition === 1) ?? null;

    // --- Domain Excellence: top team per domain by finalScore ---
    const domainMap = {};
    for (const entry of leaderboard) {
      const domainName = entry.team.problemStatement.domain.name;
      if (!domainMap[domainName]) {
        domainMap[domainName] = entry; // leaderboard is already sorted desc by finalScore
      }
    }
    const domainExcellence = Object.entries(domainMap).map(([domain, entry]) => ({
      domain,
      team: entry.team.teamName,
      finalScore: entry.finalScore,
    }));

    // --- Innovation Award: highest R1 score ---
    const innovationWinner = leaderboard
      .filter(e => e.r1Score !== null)
      .sort((a, b) => b.r1Score - a.r1Score)[0] ?? null;

    // --- Best Presentation: highest GF score ---
    const bestPresentation = leaderboard
      .filter(e => e.gfScore !== null)
      .sort((a, b) => b.gfScore - a.gfScore)[0] ?? null;

    res.json({
      awards: {
        grandPrize: grandPrize
          ? { team: grandPrize.team.teamName, finalScore: grandPrize.finalScore }
          : null,

        domainExcellence,

        innovationAward: innovationWinner
          ? { team: innovationWinner.team.teamName, r1Score: innovationWinner.r1Score }
          : null,

        bestPresentation: bestPresentation
          ? { team: bestPresentation.team.teamName, gfScore: bestPresentation.gfScore }
          : null,

        // Requires separate voting system — out of scope for MVP
        mostAdaptive: null,
        peoplesChoice: null,
      },
    });
  } catch (err) {
    next(err);
  }
};
