import { prisma } from '../config/db.js';
import { sendMail } from '../utils/mail.js';

export const updateGlobalConfig = async (req, res, next) => {
  try {
    const config = await prisma.globalConfig.upsert({
      where: { id: 'vortex_config' },
      update: req.body,
      create: { id: 'vortex_config', ...req.body }
    });
    res.json(config);
  } catch (err) {
    next(err);
  }
};

export const getGlobalConfig = async (req, res, next) => {
  try {
    const config = await prisma.globalConfig.findUnique({
      where: { id: 'vortex_config' }
    });
    res.json(config || {});
  } catch (err) {
    next(err);
  }
};

export const broadcastMail = async (req, res, next) => {
  try {
    const { subject, text, target } = req.body; // target: 'ALL' or 'LEADS'
    
    let emails = [];
    if (target === 'LEADS') {
      const leads = await prisma.student.findMany({
        where: { role: 'TEAMLEAD' },
        select: { email: true }
      });
      emails = leads.map(l => l.email);
    } else {
      const all = await prisma.student.findMany({
        where: { verificationStatus: 'VERIFIED' },
        select: { email: true }
      });
      emails = all.map(a => a.email);
    }

    for (const email of emails) {
      await sendMail({ to: email, subject, text });
    }

    res.json({ message: `BROADCAST_TRANSMITTED: ${emails.length} RECIPIENTS` });
  } catch (err) {
    next(err);
  }
};

export const generateReport = async (req, res, next) => {
  try {
    const studentsWithoutTeam = await prisma.student.findMany({
      where: { 
        role: 'STUDENT',
        verificationStatus: 'VERIFIED',
        teams: { none: {} }
      },
      include: { institute: true, domain: true, problemStatement: true }
    });

    const teams = await prisma.team.findMany({
      include: {
        problemStatement: true,
        leader: true,
        members: { include: { student: true } }
      }
    });

    const report = {
      timestamp: new Date(),
      operatives: {
        totalVerified: await prisma.student.count({ where: { verificationStatus: 'VERIFIED' } }),
        unassigned: studentsWithoutTeam.length,
        unassignedList: studentsWithoutTeam
      },
      squads: {
        total: teams.length,
        qualified: [],
        unqualified: []
      }
    };

    for (const team of teams) {
      const minDomain = team.problemStatement.minDomainMembers;
      const hasFemale = team.femaleCount >= 1;
      const hasMinDomainExperts = team.domainSpecificCount >= minDomain;

      const isQualified = hasFemale && hasMinDomainExperts && team.memberCount >= 2; // Assuming min 2 members total
      
      const teamData = {
        id: team.id,
        name: team.teamName,
        members: team.memberCount,
        femaleCount: team.femaleCount,
        domainExpertCount: team.domainSpecificCount,
        reason: !isQualified ? `${!hasFemale ? 'No female member. ' : ''}${!hasMinDomainExperts ? `Insufficient domain experts (need ${minDomain}).` : ''}` : null
      };

      if (isQualified) {
        report.squads.qualified.push(teamData);
      } else {
        report.squads.unqualified.push(teamData);
      }
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
};
