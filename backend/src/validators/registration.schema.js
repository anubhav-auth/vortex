import { z } from 'zod';

const url = z.string().url().max(500).optional().or(z.literal('').transform(() => undefined));

export const registrationSchema = z.object({
  fullName:       z.string().trim().min(2).max(120),
  email:          z.string().email().toLowerCase().trim(),
  registrationNo: z.string().trim().min(1).max(50),
  institutionId:  z.string().cuid(),
  domainId:       z.string().cuid(),
  track:          z.string().trim().min(1).max(80).optional(),
  phone:          z.string().trim().min(7).max(20).optional(),
  discordId:      z.string().trim().max(60).optional(),
  gender:         z.enum(['MALE', 'FEMALE', 'OTHER']),
  profilePicUrl:  url,
  linkedinUrl:    url,
  githubUrl:      url,
  bio:            z.string().trim().max(1000).optional(),
});
