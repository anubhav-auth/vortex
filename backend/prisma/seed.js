import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

// ─────────────────────────────────────────────────────────────────────────────
// Idempotent seed.
//
// Every write is an upsert keyed on a stable natural identifier (email, name,
// registrationNo) or on a fixed singleton id. Running this script twice is
// safe and converges to the same state.
//
// What it seeds:
//   - HackathonRules singleton (id="rules")
//   - RoundControl singleton (id="round_control") — all rounds LOCKED
//   - Admin user (env-driven credentials, dev defaults)
//   - 3 Jury users (deterministic dev passwords)
//   - 5 Institutions, 5 Domains, 10 ProblemStatements
//   - 8 sample CollegeRegistry rows (so admin verification flow is testable)
//
// What it does NOT seed:
//   - Students (registration is the user-facing flow)
//   - Teams, evaluations, leaderboard (downstream of student/jury actions)
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const log = (msg) => console.log(`[seed] ${msg}`);

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? 'admin@vortex.local';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? 'change-me-on-first-login';

const JURY_DEFAULT_PASSWORD = process.env.JURY_SEED_PASSWORD ?? 'jury-dev-only';

// ── singletons ──────────────────────────────────────────────────────────────

const seedRules = async () => {
  const rules = await prisma.hackathonRules.upsert({
    where: { id: 'rules' },
    update: {}, // never overwrite admin's hand-tuned values
    create: {
      id: 'rules',
      minTeamSize: 3,
      maxTeamSize: 5,
      minFemaleMembers: 1,
      minDomainExperts: 1,
      registrationOpen: true,
      leaderboardVisible: false,
      showMarks: false,
    },
  });
  log(`HackathonRules ready (id=${rules.id})`);
};

const seedRoundControl = async () => {
  const rc = await prisma.roundControl.upsert({
    where: { id: 'round_control' },
    update: {},
    create: {
      id: 'round_control',
      round1State: 'LOCKED',
      round2State: 'LOCKED',
      round3State: 'LOCKED',
    },
  });
  log(`RoundControl ready (id=${rc.id})`);
};

// ── taxonomy ────────────────────────────────────────────────────────────────

const INSTITUTIONS = [
  'Institute of Technology, Delhi',
  'MIT World Peace University',
  'BITS Pilani',
  'SRM Institute',
  'IIIT Hyderabad',
];

const DOMAINS = [
  'Cybersecurity',
  'Artificial Intelligence',
  'Blockchain',
  'IoT & Robotics',
  'FinTech',
];

const PROBLEM_STATEMENTS = [
  ['Cybersecurity',           'Zero-trust architecture for smart cities',
                              'Design and prototype a zero-trust framework for IoT devices in municipal networks.'],
  ['Cybersecurity',           'Phishing-resistant SSO for student portals',
                              'Build a passkey-based SSO with attested device binding.'],
  ['Artificial Intelligence', 'Predictive maintenance for autonomous fleets',
                              'Use telemetry to predict component failures with quantified uncertainty.'],
  ['Artificial Intelligence', 'On-device speech-to-action assistant',
                              'Latency-bounded NLU for low-power edge devices.'],
  ['Blockchain',              'Decentralized identity for cross-border KYC',
                              'A privacy-preserving DID system with selective disclosure.'],
  ['Blockchain',              'Programmable carbon credits',
                              'Tokenize carbon offsets with verifiable retirement events.'],
  ['IoT & Robotics',          'Real-time supply-chain optimization with CV',
                              'Computer-vision-driven warehouse routing under congestion.'],
  ['IoT & Robotics',          'Disaster-response micro-drone swarm',
                              'Autonomous coordination for search-and-locate in GPS-denied zones.'],
  ['FinTech',                 'Privacy-preserving credit scoring',
                              'Federated learning across lenders with differential privacy.'],
  ['FinTech',                 'Real-time fraud detection at POS',
                              'Sub-100ms decisioning with explainable reason codes.'],
];

const seedTaxonomy = async () => {
  for (const name of INSTITUTIONS) {
    await prisma.institution.upsert({ where: { name }, update: {}, create: { name } });
  }
  log(`Institutions: ${INSTITUTIONS.length} ensured`);

  for (const name of DOMAINS) {
    await prisma.domain.upsert({ where: { name }, update: {}, create: { name } });
  }
  log(`Domains: ${DOMAINS.length} ensured`);

  // ProblemStatement has no natural unique key → look up by (title, domainId)
  // and create only if absent. Safe to re-run.
  const domainByName = Object.fromEntries(
    (await prisma.domain.findMany()).map((d) => [d.name, d.id]),
  );

  for (const [domainName, title, description] of PROBLEM_STATEMENTS) {
    const domainId = domainByName[domainName];
    if (!domainId) continue;
    const existing = await prisma.problemStatement.findFirst({
      where: { title, domainId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.problemStatement.create({ data: { title, description, domainId } });
    }
  }
  log(`ProblemStatements: ${PROBLEM_STATEMENTS.length} ensured`);
};

// ── users ──────────────────────────────────────────────────────────────────

const upsertPrivilegedUser = async ({ email, fullName, role, password }) => {
  const passwordHash = await bcrypt.hash(password, ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: {}, // do not reset password on re-seed; admin can rotate via API
    create: {
      email,
      fullName,
      role,
      verificationStatus: 'VERIFIED',
      passwordHash,
      passwordIssuedAt: new Date(),
    },
    select: { id: true, email: true, role: true },
  });
};

const seedAdmin = async () => {
  const admin = await upsertPrivilegedUser({
    email: ADMIN_EMAIL,
    fullName: 'Vortex Admin',
    role: 'ADMIN',
    password: ADMIN_PASSWORD,
  });
  log(`Admin ready (${admin.email})`);
  if (ADMIN_PASSWORD === 'change-me-on-first-login') {
    log('  ⚠ using default admin password — set ADMIN_SEED_PASSWORD in .env');
  }
};

const JURY_SPECS = [
  { email: 'jury.alpha@vortex.local',  fullName: 'Jury Alpha'  },
  { email: 'jury.bravo@vortex.local',  fullName: 'Jury Bravo'  },
  { email: 'jury.charlie@vortex.local',fullName: 'Jury Charlie'},
];

const seedJuries = async () => {
  for (const spec of JURY_SPECS) {
    await upsertPrivilegedUser({
      ...spec,
      role: 'JURY',
      password: JURY_DEFAULT_PASSWORD,
    });
  }
  log(`Juries: ${JURY_SPECS.length} ensured (default password: ${JURY_DEFAULT_PASSWORD})`);
};

// ── registry ────────────────────────────────────────────────────────────────

const REGISTRY_SAMPLES = [
  ['2026-VRTX-100', 'Alice Vance',     'alice.vance@vortex.local',     'BITS Pilani'],
  ['2026-VRTX-101', 'Bob Smith',       'bob.smith@vortex.local',       'BITS Pilani'],
  ['2026-VRTX-102', 'Carla Mendes',    'carla.mendes@vortex.local',    'IIIT Hyderabad'],
  ['2026-VRTX-103', 'Devraj Patil',    'devraj.patil@vortex.local',    'IIIT Hyderabad'],
  ['2026-VRTX-104', 'Esha Nair',       'esha.nair@vortex.local',       'MIT World Peace University'],
  ['2026-VRTX-105', 'Farhan Iqbal',    'farhan.iqbal@vortex.local',    'MIT World Peace University'],
  ['2026-VRTX-106', 'Gita Roy',        'gita.roy@vortex.local',        'SRM Institute'],
  ['2026-VRTX-107', 'Hari Menon',      'hari.menon@vortex.local',      'Institute of Technology, Delhi'],
];

const seedRegistry = async () => {
  const instByName = Object.fromEntries(
    (await prisma.institution.findMany()).map((i) => [i.name, i.id]),
  );

  for (const [registrationNo, fullName, email, institutionName] of REGISTRY_SAMPLES) {
    const institutionId = instByName[institutionName];
    if (!institutionId) continue;
    await prisma.collegeRegistry.upsert({
      where: { registrationNo },
      update: { fullName, email, institutionId },
      create: { registrationNo, fullName, email, institutionId },
    });
  }
  log(`CollegeRegistry: ${REGISTRY_SAMPLES.length} ensured`);
};

// ── orchestration ──────────────────────────────────────────────────────────

const main = async () => {
  log('start');
  await seedRules();
  await seedRoundControl();
  await seedTaxonomy();
  await seedAdmin();
  await seedJuries();
  await seedRegistry();
  log('done');
};

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
