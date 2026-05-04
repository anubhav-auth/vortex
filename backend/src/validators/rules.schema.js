import { z } from 'zod';

const intRange = (min, max) => z.coerce.number().int().min(min).max(max);

// All fields optional — the route is a partial update. Cross-field invariants
// (min<=max) are enforced inside rulesService.update against the merged row.
export const updateRulesSchema = z
  .object({
    minTeamSize:        intRange(1, 50).optional(),
    maxTeamSize:        intRange(1, 50).optional(),
    minFemaleMembers:   intRange(0, 50).optional(),
    minDomainExperts:   intRange(0, 50).optional(),
    registrationOpen:   z.boolean().optional(),
    leaderboardVisible: z.boolean().optional(),
    showMarks:          z.boolean().optional(),
    teamLockdown:       z.boolean().optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: 'No fields to update' });
