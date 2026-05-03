import { prisma } from '../config/db.js';
import { Conflict, NotFound, Forbidden } from '../utils/errors.js';
import { generateSixDigitCode, hashPassword } from '../utils/crypto.js';

// Sole owner of User table writes related to the verification lifecycle.
// Controllers must NOT touch prisma.user directly for these flows.

const PUBLIC_USER_FIELDS = {
  id: true,
  role: true,
  fullName: true,
  email: true,
  registrationNo: true,
  phone: true,
  discordId: true,
  gender: true,
  profilePicUrl: true,
  linkedinUrl: true,
  githubUrl: true,
  bio: true,
  isDomainExpert: true,
  track: true,
  verificationStatus: true,
  passwordIssuedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  institution: { select: { id: true, name: true } },
  domain: { select: { id: true, name: true } },
};

export const userService = {
  publicFields: PUBLIC_USER_FIELDS,

  async createPendingStudent(data) {
    // Surface uniqueness conflicts as 409 with field hints so the UI can
    // mark the offending input. The DB constraint is still authoritative.
    const conflict = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.registrationNo ? [{ registrationNo: data.registrationNo }] : []),
        ],
      },
      select: { email: true, registrationNo: true },
    });
    if (conflict) {
      const field = conflict.email === data.email ? 'email' : 'registrationNo';
      throw Conflict(`A user with this ${field} already exists`, { field });
    }

    return prisma.user.create({
      data: {
        ...data,
        role: 'STUDENT',
        verificationStatus: 'PENDING',
        passwordHash: null,
      },
      select: PUBLIC_USER_FIELDS,
    });
  },

  // Approve a PENDING student: generate a 6-digit code, hash it, store it.
  // Returns { user, plaintextPassword } so the caller can email the password.
  // The plaintext NEVER persists past this function's return value.
  async approveStudent(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, verificationStatus: true, fullName: true, email: true },
    });
    if (!user) throw NotFound('User not found');
    if (user.role !== 'STUDENT') throw Forbidden('Only student accounts can be verified');
    if (user.verificationStatus === 'VERIFIED') {
      throw Conflict('User is already verified');
    }
    if (user.verificationStatus === 'REVOKED') {
      throw Conflict('Cannot verify a revoked account');
    }

    const plaintextPassword = generateSixDigitCode();
    const passwordHash = await hashPassword(plaintextPassword);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'VERIFIED',
        passwordHash,
        passwordIssuedAt: new Date(),
      },
      select: PUBLIC_USER_FIELDS,
    });

    return { user: updated, plaintextPassword };
  },

  async rejectStudent(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, verificationStatus: true, fullName: true, email: true },
    });
    if (!user) throw NotFound('User not found');
    if (user.role !== 'STUDENT') throw Forbidden('Only student accounts can be rejected');
    if (user.verificationStatus === 'VERIFIED') {
      throw Conflict('Cannot reject an already-verified user — use revoke instead');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: 'REJECTED' },
      select: PUBLIC_USER_FIELDS,
    });
    return { user: updated, snapshot: user };
  },

  async revokeStudent(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, verificationStatus: true, fullName: true, email: true },
    });
    if (!user) throw NotFound('User not found');
    if (user.role !== 'STUDENT') throw Forbidden('Only student accounts can be revoked');
    if (user.verificationStatus !== 'VERIFIED') {
      throw Conflict('Only VERIFIED users can be revoked');
    }

    // Wipe credentials on revoke. The user row stays for audit/history.
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'REVOKED',
        passwordHash: null,
        passwordIssuedAt: null,
      },
      select: PUBLIC_USER_FIELDS,
    });
    return { user: updated, snapshot: user };
  },

  async restoreRevokedStudent(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, verificationStatus: true, fullName: true, email: true },
    });
    if (!user) throw NotFound('User not found');
    if (user.role !== 'STUDENT') throw Forbidden('Only student accounts can be restored');
    if (user.verificationStatus !== 'REVOKED') {
      throw Conflict('Only REVOKED users can be restored');
    }

    const plaintextPassword = generateSixDigitCode();
    const passwordHash = await hashPassword(plaintextPassword);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'VERIFIED',
        passwordHash,
        passwordIssuedAt: new Date(),
      },
      select: PUBLIC_USER_FIELDS,
    });

    return { user: updated, plaintextPassword, snapshot: user };
  },

  // Issue a fresh 6-digit code for an already-VERIFIED user (lost-password).
  async reissuePassword(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, verificationStatus: true, fullName: true, email: true },
    });
    if (!user) throw NotFound('User not found');
    if (user.verificationStatus !== 'VERIFIED') {
      throw Forbidden('Cannot reissue password for a non-verified account');
    }

    const plaintextPassword = generateSixDigitCode();
    const passwordHash = await hashPassword(plaintextPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordIssuedAt: new Date() },
    });
    return { user, plaintextPassword };
  },

  // Auth lookup — returns the row including the hash. ONLY the auth controller
  // should call this; everywhere else uses findById which strips secrets.
  findForAuth(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        email: true,
        fullName: true,
        passwordHash: true,
        verificationStatus: true,
      },
    });
  },

  findById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_FIELDS,
    });
  },

  recordLogin(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
      select: { id: true },
    });
  },

  listPending({ search } = {}) {
    return prisma.user.findMany({
      where: {
        role: 'STUDENT',
        verificationStatus: 'PENDING',
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { registrationNo: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: PUBLIC_USER_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
  },

  listStudents({ status, search } = {}) {
    return prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(status && { verificationStatus: status }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { registrationNo: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: PUBLIC_USER_FIELDS,
      orderBy: { createdAt: 'desc' },
    });
  },
};
