import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg(process.env.DATABASE_URL);

const prisma = new PrismaClient({
  adapter,
});

// Placeholder transparent 1x1 base64 pixel to avoid empty photos
const PLACEHOLDER_PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function main() {
  console.log('--- DATABASE_CLEANUP_INITIALIZED ---');
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

  console.log('--- SEEDING_GLOBAL_CONFIG ---');
  await prisma.globalConfig.create({
    data: {
      id: 'vortex_config',
      lockdownActive: false,
      leaderboardVisible: true,
      leaderboardLimit: 50,
      showMarks: true,
      minTeamMembers: 2,
      maxTeamMembers: 5,
      minFemaleMembers: 1,
      minDomainExperts: 1,
    },
  });

  console.log('--- SEEDING_INSTITUTIONS ---');
  const institutes = await Promise.all([
    { name: 'Institute of Technology, Delhi' },
    { name: 'MIT World Peace University' },
    { name: 'Stanford Engineering' },
    { name: 'BITS Pilani' },
    { name: 'SRM Institute' }
  ].map(data => prisma.institute.create({ data })));

  console.log('--- SEEDING_DOMAINS ---');
  const domains = await Promise.all([
    { name: 'Cybersecurity' },
    { name: 'Artificial Intelligence' },
    { name: 'Blockchain' },
    { name: 'IoT & Robotics' },
    { name: 'FinTech' }
  ].map(data => prisma.domain.create({ data })));

  console.log('--- SEEDING_EVALUATION_CRITERIA ---');
  const criteria = await Promise.all([
    { name: 'Innovation & Novelty', maxMarks: 10 },
    { name: 'Technical Complexity', maxMarks: 10 },
    { name: 'Feasibility & Scalability', maxMarks: 10 },
    { name: 'Impact & Utility', maxMarks: 10 },
    { name: 'Presentation & UI/UX', maxMarks: 10 }
  ].map(data => prisma.evaluationCriteria.create({ data })));

  console.log('--- SEEDING_PROBLEM_STATEMENTS ---');
  const allPS = [];
  const psDescriptions = [
    "Develop a zero-trust architecture for securing IoT devices in smart cities.",
    "Implement an AI-driven predictive maintenance system for autonomous fleets.",
    "Build a decentralized identity platform for cross-border financial transactions.",
    "Optimize real-time supply chain logistics using computer vision and robotics.",
    "Create a privacy-preserving credit scoring model using federated learning."
  ];

  for (const [index, domain] of domains.entries()) {
    for (let i = 1; i <= 3; i++) {
      const ps = await prisma.problemStatement.create({
        data: {
          title: `${domain.name} Challenge ${i}: ${['Alpha', 'Beta', 'Gamma'][i-1]}`,
          description: psDescriptions[index % psDescriptions.length],
          domainId: domain.id
        }
      });
      allPS.push(ps);
    }
  }

  console.log('--- SEEDING_ADMIN_AND_JURY_ACCOUNTS ---');
  await prisma.student.create({
    data: {
      fullName: 'Vortex Admin',
      rollNumber: 'ADM-001',
      email: 'admin@vortex.com',
      password: 'admin123',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
      otpVerified: true,
      photo: PLACEHOLDER_PHOTO
    },
  });

  const jury = await prisma.student.create({
    data: {
      fullName: 'Chief Jury Alpha',
      rollNumber: 'JRY-001',
      email: 'jury@vortex.com',
      password: 'password123',
      role: 'JURY',
      verificationStatus: 'VERIFIED',
      otpVerified: true,
      photo: PLACEHOLDER_PHOTO
    },
  });

  console.log('--- SEEDING_PARTICIPANTS ---');
  const students = [];
  const names = [
    "Alice Vance", "Bob Smith", "Charlie Day", "Diana Prince", "Ethan Hunt", 
    "Fiona Gallager", "George Costanza", "Hannah Abbott", "Ian Wright", "Julia Roberts",
    "Kevin Hart", "Luna Lovegood", "Miles Morales", "Nina Simone", "Oscar Isaac",
    "Peter Parker", "Quinn Fabray", "Riley Reid", "Sarah Connor", "Tony Stark",
    "Uma Thurman", "Victor Stone", "Wanda Maximoff", "Xavier Woods", "Yara Shahidi",
    "Zoe Saldana", "Arthur Morgan", "Billie Eilish", "Cillian Murphy", "David Bowie"
  ];

  for (let i = 0; i < names.length; i++) {
    const inst = institutes[i % institutes.length];
    const dom = domains[i % domains.length];
    const ps = allPS[Math.floor(Math.random() * allPS.length)];
    
    const student = await prisma.student.create({
      data: {
        fullName: names[i],
        rollNumber: `2026-VRTX-${(i + 100).toString()}`,
        email: `${names[i].toLowerCase().replace(' ', '.')}@vortex.com`,
        phone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        password: `password123`,
        summary: `Participant specializing in ${dom.name}. Ready for hackathon participation from ${inst.name}.`,
        role: 'STUDENT',
        gender: i % 3 === 0 ? 'Female' : 'Male', // Increased female ratio slightly for seeding
        instituteId: inst.id,
        domainId: dom.id,
        psId: ps.id,
        verificationStatus: i % 10 === 0 ? 'PENDING' : 'VERIFIED', // Fewer pending for better team formation
        otpVerified: true,
        photo: PLACEHOLDER_PHOTO
      },
    });
    students.push(student);
  }

  console.log('--- SEEDING_TEAMS ---');
  const verifiedStudents = students.filter(s => s.verificationStatus === 'VERIFIED');
  const studentsInTeams = new Set();
  
  const teamNames = ["Shadow", "Vanguard", "Nebula", "Titan", "Phantom", "Rogue"];
  
  for (let i = 0; i < teamNames.length; i++) {
    const ps = allPS[i % allPS.length];
    // Pick a leader who matches the PS domain
    const potentialLeaders = verifiedStudents.filter(s => 
      s.psId === ps.id && 
      s.domainId === ps.domainId && 
      !studentsInTeams.has(s.id)
    );
    
    const leader = potentialLeaders[0] || verifiedStudents.find(s => !studentsInTeams.has(s.id));
    if (!leader) break;

    studentsInTeams.add(leader.id);

    const isFemale = leader.gender === 'Female';
    const isDomainExpert = leader.domainId === ps.domainId;

    const team = await prisma.team.create({
      data: {
        teamName: `${teamNames[i]} Team`,
        psId: ps.id,
        leaderId: leader.id,
        teamStatus: 'FORMING',
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

    // Strategy to fill team correctly:
    // 1. Add another domain expert if possible
    // 2. Add female member if leader isn't female
    // 3. Add more members until 4 or 5
    
    const potentialMates = verifiedStudents.filter(s => 
      s.psId === ps.id && 
      s.id !== leader.id && 
      !studentsInTeams.has(s.id)
    );

    // Sort to prioritize domain experts and females
    potentialMates.sort((a, b) => {
      const aScore = (a.domainId === ps.domainId ? 2 : 0) + (a.gender === 'Female' ? 1 : 0);
      const bScore = (b.domainId === ps.domainId ? 2 : 0) + (b.gender === 'Female' ? 1 : 0);
      return bScore - aScore;
    });

    const matesToAdd = potentialMates.slice(0, 4); // Aim for 5 total if possible
    for (const mate of matesToAdd) {
      studentsInTeams.add(mate.id);
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

    // Final status hardening check
    const updatedTeam = await prisma.team.findUnique({ where: { id: team.id } });
    const isQualified = 
      updatedTeam.memberCount >= 4 && 
      updatedTeam.memberCount <= 5 &&
      updatedTeam.femaleCount >= 1 && 
      updatedTeam.domainSpecificCount >= 2;

    if (isQualified && i < 4) { // Only confirm some to show difference
      await prisma.team.update({
        where: { id: team.id },
        data: { teamStatus: 'CONFIRMED' }
      });
    }

    // Add some join requests
    const requester = verifiedStudents[verifiedStudents.length - 1 - i];
    if (requester && requester.id !== leader.id) {
      await prisma.joinRequest.create({
        data: {
          teamId: team.id,
          studentId: requester.id,
          status: 'PENDING'
        }
      }).catch(() => {}); // Ignore duplicates
    }
  }

  console.log('--- DATABASE_SEEDING_COMPLETE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
