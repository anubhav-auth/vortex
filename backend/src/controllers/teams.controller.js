import { prisma } from '../config/db.js';

// Helper — recompute team counts after any member change
const recomputeTeamCounts = async (teamId) => {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: { student: true },
  });

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { problemStatement: true },
  });

  const memberCount         = members.length;
  const femaleCount         = members.filter(m => m.student.gender === 'Female').length;
  const domainSpecificCount = members.filter(
    m => m.student.domainId === team.problemStatement.domainId
  ).length;

  await prisma.team.update({
    where: { id: teamId },
    data: { memberCount, femaleCount, domainSpecificCount },
  });
};

export const createTeam = async (req, res, next) => {
  try {
    const { teamName, psId, leaderId } = req.body;

    // Leader must be Verified
    const leader = await prisma.student.findUnique({ where: { id: leaderId } });
    if (!leader) return res.status(404).json({ error: 'Leader not found' });
    if (leader.verificationStatus !== 'Verified') {
      return res.status(400).json({ error: 'Leader must be a Verified student' });
    }

    // Leader can only lead one team
    const existingTeam = await prisma.team.findUnique({ where: { leaderId } });
    if (existingTeam) return res.status(400).json({ error: 'Student is already a team leader' });

    // PS must exist
    const ps = await prisma.problemStatement.findUnique({ where: { id: psId } });
    if (!ps) return res.status(404).json({ error: 'Problem statement not found' });

    // Create team + add leader as TeamMember in a transaction
    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { teamName, psId, leaderId },
      });

      await tx.teamMember.create({
        data: { teamId: newTeam.id, studentId: leaderId, role: 'Leader' },
      });

      return newTeam;
    });

    await recomputeTeamCounts(team.id);

    const updated = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: { include: { student: true } },
        problemStatement: { include: { domain: true } },
        leader: true,
      },
    });

    res.status(201).json({ message: 'Team created successfully', team: updated });
  } catch (err) {
    next(err);
  }
};



export const addMember = async (req, res, next) => {
    try {
      const { id: teamId } = req.params;
      const { studentId } = req.body;
  
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ error: 'Team not found' });
      if (team.teamStatus === 'Confirmed') {
        return res.status(400).json({ error: 'Cannot modify a confirmed team' });
      }
  
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) return res.status(404).json({ error: 'Student not found' });
      if (student.verificationStatus !== 'Verified') {
        return res.status(400).json({ error: 'Student must be Verified to join a team' });
      }
  
      // Check duplicate
      const existing = await prisma.teamMember.findUnique({
        where: { teamId_studentId: { teamId, studentId } },
      });
      if (existing) return res.status(400).json({ error: 'Student is already in this team' });
  
      await prisma.teamMember.create({
        data: { teamId, studentId, role: 'Member' },
      });
  
      await recomputeTeamCounts(teamId);
  
      const updated = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: { include: { student: true } } },
      });
  
      res.json({ message: 'Member added successfully', team: updated });
    } catch (err) {
      next(err);
    }
  };
  
  export const removeMember = async (req, res, next) => {
    try {
      const { id: teamId, studentId } = req.params;
  
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ error: 'Team not found' });
      if (team.teamStatus === 'Confirmed') {
        return res.status(400).json({ error: 'Cannot modify a confirmed team' });
      }
  
      // Cannot remove the leader
      if (team.leaderId === studentId) {
        return res.status(400).json({ error: 'Cannot remove the team leader' });
      }
  
      const member = await prisma.teamMember.findUnique({
        where: { teamId_studentId: { teamId, studentId } },
      });
      if (!member) return res.status(404).json({ error: 'Member not found in this team' });
  
      await prisma.teamMember.delete({
        where: { teamId_studentId: { teamId, studentId } },
      });
  
      await recomputeTeamCounts(teamId);
  
      const updated = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: { include: { student: true } } },
      });
  
      res.json({ message: 'Member removed successfully', team: updated });
    } catch (err) {
      next(err);
    }
  };
  
  export const getTeam = async (req, res, next) => {
    try {
      const team = await prisma.team.findUnique({
        where: { id: req.params.id },
        include: {
          members: { include: { student: true } },
          problemStatement: { include: { domain: true } },
          leader: true,
        },
      });
      if (!team) return res.status(404).json({ error: 'Team not found' });
      res.json(team);
    } catch (err) {
      next(err);
    }
  };


  export const validateTeam = async (req, res, next) => {
    try {
      const team = await prisma.team.findUnique({
        where: { id: req.params.id },
        include: {
          members: { include: { student: true } },
          problemStatement: true,
        },
      });
      if (!team) return res.status(404).json({ error: 'Team not found' });
  
      const memberCount         = team.members.length;
      const femaleCount         = team.members.filter(m => m.student.gender === 'Female').length;
      const psDomainId          = team.problemStatement.domainId;
      const minDomainMembers    = team.problemStatement.minDomainMembers;
      const domainSpecificCount = team.members.filter(
        m => m.student.domainId === psDomainId
      ).length;
  
      const errors = [];
      if (memberCount < 4 || memberCount > 5) {
        errors.push(`Team must have 4-5 members (currently ${memberCount})`);
      }
      if (femaleCount < 1) {
        errors.push('Team must have at least 1 female member');
      }
      if (domainSpecificCount < minDomainMembers) {
        errors.push(`Team must have at least ${minDomainMembers} members from PS domain (currently ${domainSpecificCount})`);
      }
  
      res.json({
        valid: errors.length === 0,
        memberCount,
        femaleCount,
        domainSpecificCount,
        minDomainMembers,
        errors,
      });
    } catch (err) {
      next(err);
    }
  };
  
  export const confirmTeam = async (req, res, next) => {
    try {
      const { id: teamId } = req.params;
  
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: { include: { student: true } },
          problemStatement: true,
        },
      });
      if (!team) return res.status(404).json({ error: 'Team not found' });
      if (team.teamStatus === 'Confirmed') {
        return res.status(400).json({ error: 'Team is already confirmed' });
      }
  
      // Run same validation logic inline
      const memberCount         = team.members.length;
      const femaleCount         = team.members.filter(m => m.student.gender === 'Female').length;
      const psDomainId          = team.problemStatement.domainId;
      const minDomainMembers    = team.problemStatement.minDomainMembers;
      const domainSpecificCount = team.members.filter(
        m => m.student.domainId === psDomainId
      ).length;
  
      const errors = [];
      if (memberCount < 4 || memberCount > 5) errors.push(`Team must have 4-5 members (currently ${memberCount})`);
      if (femaleCount < 1) errors.push('Team must have at least 1 female member');
      if (domainSpecificCount < minDomainMembers) errors.push(`Need at least ${minDomainMembers} members from PS domain`);
  
      if (errors.length > 0) {
        await prisma.team.update({
          where: { id: teamId },
          data: { teamStatus: 'Disqualified' },
        });
        return res.status(400).json({ error: 'Team is invalid and has been disqualified', errors });
      }
  
      const confirmed = await prisma.team.update({
        where: { id: teamId },
        data: { teamStatus: 'Confirmed' },
      });
  
      res.json({ message: 'Team confirmed successfully', team: confirmed });
    } catch (err) {
      next(err);
    }
  };