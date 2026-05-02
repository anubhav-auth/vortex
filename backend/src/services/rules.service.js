import { prisma } from '../config/db.js';
import { NotFound } from '../utils/errors.js';

// Read-only accessor for the singleton HackathonRules row. The full engine
// (mutations, recompute-all-teams) lands in the rules+qualification layer.

const RULES_ID = 'rules';

let cached = null;
let cachedAt = 0;
const TTL_MS = 5_000; // brief cache to absorb burst reads on hot paths

export const rulesService = {
  async get(tx) {
    const client = tx ?? prisma;
    if (!tx && cached && Date.now() - cachedAt < TTL_MS) return cached;
    const row = await client.hackathonRules.findUnique({ where: { id: RULES_ID } });
    if (!row) throw NotFound('Hackathon rules not initialized');
    if (!tx) {
      cached = row;
      cachedAt = Date.now();
    }
    return row;
  },

  invalidate() {
    cached = null;
    cachedAt = 0;
  },

  // Pure check — does the team currently meet qualification thresholds?
  qualifies(team, rules) {
    return (
      team.memberCount >= rules.minTeamSize &&
      team.memberCount <= rules.maxTeamSize &&
      team.femaleCount >= rules.minFemaleMembers &&
      team.domainExpertCount >= rules.minDomainExperts
    );
  },

  // Diagnostic — which thresholds is this team failing?
  unmetReasons(team, rules) {
    const reasons = [];
    if (team.memberCount < rules.minTeamSize) {
      reasons.push({ rule: 'minTeamSize', need: rules.minTeamSize, have: team.memberCount });
    }
    if (team.memberCount > rules.maxTeamSize) {
      reasons.push({ rule: 'maxTeamSize', need: rules.maxTeamSize, have: team.memberCount });
    }
    if (team.femaleCount < rules.minFemaleMembers) {
      reasons.push({ rule: 'minFemaleMembers', need: rules.minFemaleMembers, have: team.femaleCount });
    }
    if (team.domainExpertCount < rules.minDomainExperts) {
      reasons.push({ rule: 'minDomainExperts', need: rules.minDomainExperts, have: team.domainExpertCount });
    }
    return reasons;
  },
};
