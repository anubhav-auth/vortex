import { z } from 'zod';

const registryRow = z.object({
  registrationNo: z.string().trim().min(1).max(50),
  fullName:       z.string().trim().min(2).max(120),
  email:          z.string().email().toLowerCase().trim(),
  institutionId:  z.string().cuid(),
});

export const bulkUploadSchema = z.object({
  rows: z.array(registryRow).min(1).max(5000),
});

export const registryIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const listRegistryQuerySchema = z.object({
  institutionId: z.string().cuid().optional(),
  search:        z.string().trim().min(1).max(120).optional(),
});
