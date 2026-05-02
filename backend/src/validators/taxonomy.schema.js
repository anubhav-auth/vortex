import { z } from 'zod';

const cuid = z.string().cuid();
const name = z.string().trim().min(1).max(120);

export const idParamSchema = z.object({ id: cuid });

// Institutions / Domains share { name }
export const namedCreateSchema = z.object({ name });
export const namedUpdateSchema = z.object({ name });

// Problem statements
export const psListQuerySchema = z.object({ domainId: cuid.optional() });

export const psCreateSchema = z.object({
  title:       z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  domainId:    cuid,
});

export const psUpdateSchema = z
  .object({
    title:       z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(4000).optional(),
    domainId:    cuid.optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: 'No fields to update' });
