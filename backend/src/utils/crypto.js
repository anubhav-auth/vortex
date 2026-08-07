import { randomInt } from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

// Cryptographically secure 6-digit numeric code (100000–999999).
// Used as the temporary login password issued on admin verification.
export const generateSixDigitCode = () => String(randomInt(100000, 1_000_000));

export const hashPassword = (plaintext) => bcrypt.hash(plaintext, env.BCRYPT_ROUNDS);

export const verifyPassword = (plaintext, hash) => bcrypt.compare(plaintext, hash);
