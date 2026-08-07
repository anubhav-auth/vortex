import { prisma } from '../config/db.js';
import { NotFound, BadRequest, Forbidden } from '../utils/errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// RULES + QUALIFICATION ENGINE
//
// Single source of truth for:
//   - reading & updating the HackathonRules singleton
//   - evaluating whether a team qualifies
//   - flipping team.status between FORMING and QUALIFIED
//
// Status discipline:
//   FORMING ↔ QUALIFIED  ← the engine only ever toggles between these
//   FINALIZED            ← terminal, NEVER touched by the engine
//   DISQUALIFIED         ← terminal, NEVER touched by the engine
//   adminOverride=true   ← engine refuses to demote (override is sticky)
//
// Integration: every mutating service (membership add/remove/recount,
// admin force-add/force-remove, rules update, recomputeAll) calls
// `recomputeTeamStatus(tx, teamId)` as the LAST step inside its own
// transaction. No other code computes qualification.
// ─────────────────────────────────────────────────────────────────────────────

const RULES_ID = 'rules';

// Issue codes — machine-readable, stable across the API. Frontend strings
// are derived from these, never hardcoded server-side.
export const ISSUE_CODES = {
  MIN_TEAM_SIZE_NOT_MET:      'MIN_TEAM_SIZE_NOT_MET',
  MAX_TEAM_SIZE_EXCEEDED:     'MAX_TEAM_SIZE_EXCEEDED',
  MIN_FEMALE_MEMBERS_NOT_MET: 'MIN_FEMALE_MEMBERS_NOT_MET',
  MIN_DOMAIN_EXPERTS_NOT_MET: 'MIN_DOMAIN_EXPERTS_NOT_MET',
};

let cached = null;
let cachedAt = 0;
const TTL_MS = 5_000;

const invalidateCache = () => {
  cached = null;
  cachedAt = 0;
};

export const rulesService = {
  ISSUE_CODES,

  // ── read ────────────────────────────────────────────────────────────────
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

  invalidate: invalidateCache,

  /**
   * Throws Forbidden if the global team-lockdown switch is on. Called by
   * every team-mutation path BEFORE doing any work, inside its own txn so
   * an admin flipping the switch mid-flight blocks in-progress writes.
   *
   * Admin override paths (teamAdmin.service) intentionally do NOT call
   * this — when locked, only admins can move things.
   */
  async assertTeamMutationsAllowed(tx) {
    const rules = await this.get(tx);
    if (rules.teamLockdown) {
      throw Forbidden('Teams are locked by an organizer. No changes allowed.');
    }
  },

  // ── pure evaluation ─────────────────────────────────────────────────────
  /**
   * Pure function: given a team snapshot (must include memberCount,
   * femaleCount, domainExpertCount) and the current rules, returns
   * { isQualified, issues: [{ code, need, have }, ...] }.
   *
   * Side-effect-free. Safe to call from controllers for "preview" responses.
   */
  evaluateTeam(team, rules) {
    const issues = [];

    if (team.memberCount < rules.minTeamSize) {
      issues.push({
        code: ISSUE_CODES.MIN_TEAM_SIZE_NOT_MET,
        need: rules.minTeamSize,
        have: team.memberCount,
      });
    }
    if (team.memberCount > rules.maxTeamSize) {
      issues.push({
        code: ISSUE_CODES.MAX_TEAM_SIZE_EXCEEDED,
        need: rules.maxTeamSize,
        have: team.memberCount,
      });
    }
    if (team.femaleCount < rules.minFemaleMembers) {
      issues.push({
        code: ISSUE_CODES.MIN_FEMALE_MEMBERS_NOT_MET,
        need: rules.minFemaleMembers,
        have: team.femaleCount,
      });
    }
    if (team.domainExpertCount < rules.minDomainExperts) {
      issues.push({
        code: ISSUE_CODES.MIN_DOMAIN_EXPERTS_NOT_MET,
        need: rules.minDomainExperts,
        have: team.domainExpertCount,
      });
    }

    return { isQualified: issues.length === 0, issues };
  },

  // ── legacy aliases (kept so nothing else breaks) ────────────────────────
  qualifies(team, rules) {
    return this.evaluateTeam(team, rules).isQualified;
  },
  unmetReasons(team, rules) {
    return this.evaluateTeam(team, rules).issues;
  },

  // ── status recomputation (THE integration point) ────────────────────────
  /**
   * Recompute one team's qualification status. MUST be called inside a
   * caller-supplied transaction so the read-then-write is consistent
   * with the mutation that triggered it.
   *
   *   - FINALIZED / DISQUALIFIED → no-op (terminal)
   *   - adminOverride === true   → no-op (sticky)
   *   - otherwise                → flip between FORMING and QUALIFIED
   *                                based on evaluateTeam()
   *
   * Returns { teamId, status, isQualified, issues } so callers can audit
   * or surface the result.
   */
  async recomputeTeamStatus(tx, teamId) {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        status: true,
        adminOverride: true,
        memberCount: true,
        femaleCount: true,
        domainExpertCount: true,
      },
    });
    if (!team) throw NotFound('Team not found');

    if (team.status === 'FINALIZED' || team.status === 'DISQUALIFIED') {
      return { teamId, status: team.status, skipped: 'TERMINAL_STATUS' };
    }
    if (team.adminOverride) {
      return { teamId, status: team.status, skipped: 'ADMIN_OVERRIDE' };
    }

    const rules = await this.get(tx);
    const { isQualified, issues } = this.evaluateTeam(team, rules);
    const desired = isQualified ? 'QUALIFIED' : 'FORMING';

    if (desired === team.status) {
      return { teamId, status: team.status, isQualified, issues, changed: false };
    }

    await tx.team.update({
      where: { id: teamId },
      data: { status: desired },
    });

    return { teamId, status: desired, isQualified, issues, changed: true };
  },

  // ── mutating: update rules ──────────────────────────────────────────────
  /**
   * Update the rules singleton. Validates internal consistency
   * (min ≤ max, non-negative). Invalidates cache. Triggers a full
   * recompute so existing teams reflect the new thresholds.
   *
   * Returns { rules, recompute: { evaluated, qualified, forming, skipped } }.
   */
  async update(patch, actorId) {
    if (
      patch.minTeamSize != null &&
      patch.maxTeamSize != null &&
      patch.minTeamSize > patch.maxTeamSize
    ) {
      throw BadRequest('minTeamSize cannot exceed maxTeamSize');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.hackathonRules.findUnique({ where: { id: RULES_ID } });
      if (!current) throw NotFound('Hackathon rules not initialized');

      // Re-check with merged values to catch partial-patch inconsistencies.
      const merged = { ...current, ...patch };
      if (merged.minTeamSize > merged.maxTeamSize) {
        throw BadRequest('minTeamSize cannot exceed maxTeamSize');
      }
      if (merged.minFemaleMembers > merged.maxTeamSize) {
        throw BadRequest('minFemaleMembers cannot exceed maxTeamSize');
      }
      if (merged.minDomainExperts > merged.maxTeamSize) {
        throw BadRequest('minDomainExperts cannot exceed maxTeamSize');
      }

      return tx.hackathonRules.update({
        where: { id: RULES_ID },
        data: { ...patch, updatedById: actorId ?? null },
      });
    });

    invalidateCache();
    const recompute = await this.recomputeAll();
    return { rules: updated, recompute };
  },

  /**
   * Bulk recompute every non-terminal team. Used after rules update or
   * by the admin "recompute all" endpoint. Each team is processed in its
   * own short transaction so a single failure doesn't roll back the rest.
   *
   * Returns aggregate counts.
   */
  async recomputeAll() {
    const teams = await prisma.team.findMany({
      where: { status: { in: ['FORMING', 'QUALIFIED'] } },
      select: { id: true },
    });

    const summary = { evaluated: 0, qualified: 0, forming: 0, skipped: 0, errors: 0 };

    for (const { id } of teams) {
      try {
        const result = await prisma.$transaction((tx) => this.recomputeTeamStatus(tx, id));
        summary.evaluated += 1;
        if (result.skipped) summary.skipped += 1;
        else if (result.status === 'QUALIFIED') summary.qualified += 1;
        else if (result.status === 'FORMING') summary.forming += 1;
      } catch {
        summary.errors += 1;
      }
    }

    return summary;
  },
};
