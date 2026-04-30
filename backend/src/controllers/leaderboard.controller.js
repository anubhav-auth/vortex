import { prisma } from '../config/db.js';

export const calculateLeaderboard = async (_req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: { teamStatus: 'CONFIRMED' },
      include: { evaluations: true },
    });

    if (teams.length === 0) {
      return res.json({ message: 'No confirmed teams to calculate', leaderboard: [] });
    }

    const results = [];

    for (const team of teams) {
      const r1Eval = team.evaluations.find(e => e.round === 1);
      const r2Eval = team.evaluations.find(e => e.round === 2);
      const gfEval = team.evaluations.find(e => e.round === 3);

      const r1Score = r1Eval ? r1Eval.totalScore : null;
      const r2Score = r2Eval ? r2Eval.totalScore : null;
      const gfScore = gfEval ? gfEval.totalScore : null;

      // Simple weighted average if all rounds are present, or just sum? 
      // Let's go with weighted: 20% R1, 30% R2, 50% GF
      let finalScore = null;
      if (r1Score !== null && r2Score !== null && gfScore !== null) {
        finalScore = (r1Score * 0.2) + (r2Score * 0.3) + (gfScore * 0.5);
      } else if (r1Score !== null && r2Score !== null) {
        finalScore = (r1Score * 0.4) + (r2Score * 0.6);
      } else if (r1Score !== null) {
        finalScore = r1Score;
      }

      await prisma.leaderboard.upsert({
        where: { teamId: team.id },
        update: { r1Score, r2Score, gfScore, finalScore },
        create: { teamId: team.id, r1Score, r2Score, gfScore, finalScore },
      });

      results.push({ teamId: team.id, r1Score, r2Score, gfScore, finalScore });
    }

    // Refresh ranks
    const allLeaderboard = await prisma.leaderboard.findMany({
      where: { finalScore: { not: null } },
      orderBy: { finalScore: 'desc' },
    });

    for (let i = 0; i < allLeaderboard.length; i++) {
      await prisma.leaderboard.update({
        where: { teamId: allLeaderboard[i].teamId },
        data: { rankPosition: i + 1 },
      });
    }

    res.json({
      message: 'Leaderboard calculated',
      teamsCalculated: results.length
    });
  } catch (err) {
    next(err);
  }
};

export const getLeaderboard = async (_req, res, next) => {
  try {
    const config = await prisma.globalConfig.findUnique({ where: { id: 'vortex_config' } });
    
    if (config && !config.leaderboardVisible) {
      return res.status(403).json({ error: 'LEADERBOARD_ENCRYPTED: ACCESS_DENIED' });
    }

    const limit = config?.leaderboardLimit || 100;

    const leaderboard = await prisma.leaderboard.findMany({
      where: { rankPosition: { not: null } },
      orderBy: { rankPosition: 'asc' },
      take: limit,
      include: {
        team: {
          include: {
            problemStatement: { include: { domain: true } },
            leader: true,
          },
        },
      },
    });

    const sanitizedLeaderboard = leaderboard.map(entry => ({
      rank: entry.rankPosition,
      teamName: entry.team.teamName,
      domain: entry.team.problemStatement.domain.name,
      psTitle: entry.team.problemStatement.title,
      // Hide marks if config says so
      totalScore: config?.showMarks ? entry.finalScore : null,
      r1Score: config?.showMarks ? entry.r1Score : null,
      r2Score: config?.showMarks ? entry.r2Score : null,
      gfScore: config?.showMarks ? entry.gfScore : null,
    }));

    res.json({ count: sanitizedLeaderboard.length, leaderboard: sanitizedLeaderboard });
  } catch (err) {
    next(err);
  }
};
