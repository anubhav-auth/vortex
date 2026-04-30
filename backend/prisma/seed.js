import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- MISSION_DATA_PURGE_INITIALIZED ---');
  await prisma.scoreEntry.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.evaluationCriteria.deleteMany({});
  await prisma.joinRequest.deleteMany({});
  await prisma.leaderboard.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.problemStatement.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.domain.deleteMany({});
  await prisma.institute.deleteMany({});
  await prisma.globalConfig.deleteMany({});

  console.log('--- SEEDING_GLOBAL_PROTOCOLS ---');
  await prisma.globalConfig.create({
    data: {
      id: 'vortex_config',
      lockdownActive: false,
      leaderboardVisible: true,
      leaderboardLimit: 50,
      showMarks: true,
    },
  });

  console.log('--- SEEDING_TACTICAL_STATIONS (INSTITUTES) ---');
  const institutes = await Promise.all([
    { name: 'Institute of Technology, Delhi' },
    { name: 'MIT World Peace University' },
    { name: 'Stanford Engineering' },
    { name: 'BITS Pilani' },
    { name: 'SRM Institute' }
  ].map(data => prisma.institute.create({ data })));

  console.log('--- SEEDING_EVALUATION_CRITERIA ---');
  const criteria = await Promise.all([
    { name: 'Innovation & Originality', maxMarks: 30 },
    { name: 'Technical Complexity', maxMarks: 40 },
    { name: 'UI/UX & Accessibility', maxMarks: 20 },
    { name: 'Presentation Skills', maxMarks: 10 }
  ].map(data => prisma.evaluationCriteria.create({ data })));

  console.log('--- SEEDING_DOMAINS ---');
  const domains = await Promise.all([
    { name: 'Cybersecurity', minMembersDefault: 2 },
    { name: 'Artificial Intelligence', minMembersDefault: 2 },
    { name: 'Blockchain', minMembersDefault: 1 },
    { name: 'IoT & Robotics', minMembersDefault: 2 },
    { name: 'FinTech', minMembersDefault: 1 }
  ].map(data => prisma.domain.create({ data })));

  console.log('--- SEEDING_PROBLEM_STATEMENTS ---');
  const allPS = [];
  for (const domain of domains) {
    for (let i = 1; i <= 3; i++) {
      const ps = await prisma.problemStatement.create({
        data: {
          title: `${domain.name} Challenge ${i}`,
          description: `This is a complex challenge in the field of ${domain.name}. Level ${i}.`,
          domainId: domain.id,
          minDomainMembers: domain.minMembersDefault
        }
      });
      allPS.push(ps);
    }
  }

  console.log('--- SEEDING_COMMAND_PERSONNEL ---');
  await prisma.student.create({
    data: {
      fullName: 'Vortex Admin',
      email: 'admin@vortex.com',
      password: 'password123',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
      otpVerified: true,
    },
  });

  const jury = await prisma.student.create({
    data: {
      fullName: 'Jury Member 1',
      email: 'jury@vortex.com',
      password: 'password123',
      role: 'JURY',
      verificationStatus: 'VERIFIED',
      otpVerified: true,
    },
  });

  console.log('--- SEEDING_OPERATIVES (STUDENTS) ---');
  const students = [];
  for (let i = 1; i <= 60; i++) {
    const inst = institutes[i % institutes.length];
    const dom = domains[i % domains.length];
    const ps = allPS[Math.floor(Math.random() * allPS.length)];
    
    const student = await prisma.student.create({
      data: {
        fullName: `Student ${i}`,
        email: `student${i}@example.com`,
        password: `pass${i}`,
        summary: `I am a student from ${inst.name} specializing in ${dom.name}. I want to solve ${ps.title}.`,
        role: 'STUDENT',
        gender: i % 3 === 0 ? 'Female' : 'Male',
        instituteId: inst.id,
        domainId: dom.id,
        psId: ps.id,
        verificationStatus: i % 10 === 0 ? 'PENDING' : 'VERIFIED',
        otpVerified: true,
      },
    });
    students.push(student);
  }

  console.log('--- SEEDING_SQUADS (TEAMS) ---');
  const verifiedStudents = students.filter(s => s.verificationStatus === 'VERIFIED');
  
  for (let i = 0; i < 8; i++) {
    const leader = verifiedStudents[i * 5];
    const ps = allPS.find(p => p.id === leader.psId);

    const isFemale = leader.gender === 'Female';
    const isDomainExpert = leader.domainId === ps.domainId;

    const team = await prisma.team.create({
      data: {
        teamName: `Team ${i + 1} - ${ps.title.split(' ')[0]} Warriors`,
        psId: ps.id,
        leaderId: leader.id,
        teamStatus: i < 3 ? 'CONFIRMED' : 'FORMING',
        memberCount: 1,
        femaleCount: isFemale ? 1 : 0,
        domainSpecificCount: isDomainExpert ? 1 : 0
      },
    });

    await prisma.teamMember.create({
      data: { teamId: team.id, studentId: leader.id, role: 'Leader' },
    });

    await prisma.student.update({
      where: { id: leader.id },
      data: { role: 'TEAMLEAD' }
    });

    if (i < 3) {
        const mates = verifiedStudents.slice(i * 5 + 1, i * 5 + 3);
        for (const mate of mates) {
            const mIsFemale = mate.gender === 'Female';
            const mIsDomainExpert = mate.domainId === ps.domainId;

            await prisma.teamMember.create({
                data: { teamId: team.id, studentId: mate.id, role: 'Member' }
            });

            await prisma.team.update({
                where: { id: team.id },
                data: {
                    memberCount: { increment: 1 },
                    femaleCount: { increment: mIsFemale ? 1 : 0 },
                    domainSpecificCount: { increment: mIsDomainExpert ? 1 : 0 }
                }
            });
        }

        const totalScore = 70 + (i * 5);
        await prisma.evaluation.create({
            data: {
                teamId: team.id,
                round: 1,
                juryId: jury.id,
                feedback: 'Great performance!',
                totalScore,
                scores: {
                    create: criteria.map(c => ({
                        criteriaId: c.id,
                        marks: (c.maxMarks * (totalScore / 100))
                    }))
                }
            }
        });

        await prisma.leaderboard.create({
            data: {
                teamId: team.id,
                r1Score: totalScore,
                finalScore: totalScore,
                rankPosition: 3 - i
            }
        });
    } else {
        const mate = verifiedStudents[i * 5 + 1];
        if (mate) {
            const mIsFemale = mate.gender === 'Female';
            const mIsDomainExpert = mate.domainId === ps.domainId;

            await prisma.teamMember.create({
                data: { teamId: team.id, studentId: mate.id, role: 'Member' }
            });

            await prisma.team.update({
                where: { id: team.id },
                data: {
                    memberCount: { increment: 1 },
                    femaleCount: { increment: mIsFemale ? 1 : 0 },
                    domainSpecificCount: { increment: mIsDomainExpert ? 1 : 0 }
                }
            });
        }

        const requester = verifiedStudents[i * 5 + 2];
        if (requester) {
            await prisma.joinRequest.create({
                data: {
                    teamId: team.id,
                    studentId: requester.id,
                    status: 'PENDING'
                }
            });
        }
    }
  }

  console.log('--- MISSION_READY: DATABASE_SYNC_COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
