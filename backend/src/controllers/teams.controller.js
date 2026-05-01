import { prisma } from '../config/db.js';
import { sendMail } from '../utils/mail.js';

export const getAllTeams = async (req, res, next) => {
  try {
    const { search, psId, status } = req.query;
    const where = {};
    if (status) where.teamStatus = status;
    if (psId) where.psId = psId;
    if (search) {
      where.OR = [
        { teamName: { contains: search, mode: 'insensitive' } },
        { leader: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        problemStatement: true,
        leader: { include: { institute: true, domain: true } },
        members: { 
          include: { 
            student: { 
              include: { institute: true, domain: true, problemStatement: true } 
            } 
          } 
        }
      }
    });
    res.json(teams);
  } catch (err) {
    next(err);
  }
};

// Get compatible teams for an individual (same PS)
export const getCompatibleTeams = async (req, res, next) => {
  try {
    const { psId } = req.query;
    const [teams, config] = await Promise.all([
      prisma.team.findMany({
        where: { 
          psId,
          teamStatus: 'FORMING'
        },
        include: {
          members: { include: { student: true } },
          problemStatement: true,
          leader: true
        }
      }),
      prisma.globalConfig.findUnique({ where: { id: 'vortex_config' } })
    ]);

    const rules = config || { minTeamMembers: 2, maxTeamMembers: 5, minFemaleMembers: 1, minDomainExperts: 1 };

    const enrichedTeams = teams.map(t => {
      const pendingFemale = t.femaleCount < rules.minFemaleMembers;
      const pendingDomainExperts = Math.max(0, rules.minDomainExperts - t.domainSpecificCount);
      const pendingMembers = Math.max(0, rules.minTeamMembers - t.memberCount);
      
      return {
        ...t,
        requirements: {
          pendingFemale,
          pendingDomainExperts,
          pendingMembers,
          summary: `${pendingFemale ? 'Female member pending. ' : ''}${pendingDomainExperts > 0 ? `${pendingDomainExperts} domain experts needed. ` : ''}${pendingMembers > 0 ? `${pendingMembers} more members needed.` : ''}`
        }
      };
    });

    res.json({ count: enrichedTeams.length, teams: enrichedTeams });
  } catch (err) {
    next(err);
  }
};

export const createSquad = async (req, res, next) => {
  try {
    const { teamName, psId, leaderId } = req.body;

    const existingInTeam = await prisma.teamMember.findFirst({ where: { studentId: leaderId } });
    if (existingInTeam) return res.status(400).json({ error: 'ALREADY_ASSIGNED_TO_SQUAD' });

    const existing = await prisma.team.findUnique({ where: { teamName } });
    if (existing) return res.status(400).json({ error: 'DESIGNATION_ALREADY_IN_USE' });

    const ps = await prisma.problemStatement.findUnique({ where: { id: psId } });
    const leader = await prisma.student.findUnique({ where: { id: leaderId } });

    const isFemale = leader.gender?.toLowerCase() === 'female';
    const isDomainExpert = leader.domainId === ps.domainId;

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { 
          teamName, 
          psId, 
          leaderId, 
          teamStatus: 'FORMING',
          memberCount: 1,
          femaleCount: isFemale ? 1 : 0,
          domainSpecificCount: isDomainExpert ? 1 : 0
        }
      });

      await tx.teamMember.create({
        data: { teamId: newTeam.id, studentId: leaderId, role: 'Leader' }
      });

      // Update student role to TEAMLEAD
      await tx.student.update({
        where: { id: leaderId },
        data: { role: 'TEAMLEAD' }
      });

      return newTeam;
    });

    res.status(201).json({ message: 'SQUAD_INITIALIZED', team });
  } catch (err) {
    next(err);
  }
};

export const sendJoinRequest = async (req, res, next) => {
  try {
    const { teamId, studentId } = req.body;
    
    // Check if user already in a team
    const inTeam = await prisma.teamMember.findFirst({ where: { studentId } });
    if (inTeam) return res.status(400).json({ error: 'ALREADY_ASSIGNED_TO_SQUAD' });

    const team = await prisma.team.findUnique({ 
      where: { id: teamId },
      include: { leader: true }
    });

    const request = await prisma.joinRequest.create({
      data: { teamId, studentId },
      include: { student: true }
    });

    await sendMail({
      to: team.leader.email,
      subject: '[VORTEX] SQUAD_ENLISTMENT_REQUEST',
      text: `Operative ${request.student.fullName} has requested to join your squad.\n\nSUMMARY: ${request.student.summary}\nEMAIL: ${request.student.email}`
    });

    res.json({ message: 'ENLISTMENT_REQUEST_TRANSMITTED' });
  } catch (err) {
    next(err);
  }
};

export const handleJoinRequest = async (req, res, next) => {
  try {
    const { requestId, action } = req.body; // ACCEPTED or REJECTED

    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { 
        team: { include: { problemStatement: true } }, 
        student: true 
      }
    });

    if (!request) return res.status(404).json({ error: 'REQUEST_NOT_FOUND' });

    if (action === 'ACCEPTED') {
      const isFemale = request.student.gender?.toLowerCase() === 'female';
      const isDomainExpert = request.student.domainId === request.team.problemStatement.domainId;

      await prisma.$transaction(async (tx) => {
        await tx.teamMember.create({
          data: { 
            teamId: request.teamId, 
            studentId: request.studentId, 
            role: 'Member' 
          }
        });

        await tx.team.update({
          where: { id: request.teamId },
          data: {
            memberCount: { increment: 1 },
            femaleCount: { increment: isFemale ? 1 : 0 },
            domainSpecificCount: { increment: isDomainExpert ? 1 : 0 }
          }
        });

        await tx.joinRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        });

        // Cancel other requests for this student
        await tx.joinRequest.updateMany({
          where: { studentId: request.studentId, status: 'PENDING' },
          data: { status: 'REJECTED' }
        });
      });

      await sendMail({
        to: request.student.email,
        subject: '[VORTEX] SQUAD_ENLISTMENT_CONFIRMED',
        text: `Your request to join ${request.team.teamName} has been ACCEPTED. Squad up at the dashboard.`
      });
    } else {
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });
    }

    res.json({ message: `REQUEST_PROCESSED: ${action}` });
  } catch (err) {
    next(err);
  }
};

export const getTeamRequests = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const requests = await prisma.joinRequest.findMany({
      where: { teamId, status: 'PENDING' },
      include: { student: true }
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

export const getTeamDetails = async (req, res, next) => {
  try {
    const { identifier } = req.params; // ID or Team Name
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { id: identifier },
          { teamName: identifier }
        ]
      },
      include: {
        problemStatement: { include: { domain: true } },
        members: { include: { student: { include: { institute: true, domain: true } } } },
        leader: true,
        evaluations: true
      }
    });

    if (!team) return res.status(404).json({ error: 'SQUAD_NOT_FOUND' });

    res.json(team);
  } catch (err) {
    next(err);
  }
};
