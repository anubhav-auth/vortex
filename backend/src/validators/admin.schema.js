import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const rejectBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const listStudentsQuerySchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'REVOKED']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});
