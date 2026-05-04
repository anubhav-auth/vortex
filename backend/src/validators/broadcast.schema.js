import { z } from 'zod';

export const createBroadcastSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const listBroadcastQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const listAuditQuerySchema = z.object({
  action:     z.string().min(1).max(60).optional(),
  entityType: z.string().min(1).max(60).optional(),
  actorId:    z.string().cuid().optional(),
  since:      z.coerce.date().optional(),
  limit:      z.coerce.number().int().min(1).max(200).optional(),
});
