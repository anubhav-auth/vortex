import { Resend } from 'resend';
import { logger } from './logger.js';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.MAIL_FROM ?? 'TechExpress <onboarding@resend.dev>';

export const sendMail = async ({ to, subject, text }) => {
  if (!resend) {
    logger.warn('mail.skipped — no RESEND_API_KEY', { to, subject, body: text });
    return { delivered: false, reason: 'no-key' };
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, text });
    logger.info('mail.sent', { to, subject, id: result.data?.id });
    return { delivered: true };
  } catch (err) {
    logger.error('mail.failed', { to, subject, err: err.message });
    return { delivered: false, error: err.message };
  }
};

export const sendVerificationApprovedMail = ({ to, fullName, password }) =>
  sendMail({
    to,
    subject: 'Your Vortex account is verified',
    text:
      `Hi ${fullName},\n\n` +
      `Your registration has been approved by the organizers.\n` +
      `Use the credentials below to log in:\n\n` +
      `  Email:    ${to}\n` +
      `  Password: ${password}\n\n` +
      `Keep this password safe — it is your only credential.\n`,
  });

export const sendVerificationRejectedMail = ({ to, fullName, reason }) =>
  sendMail({
    to,
    subject: 'Vortex registration update',
    text:
      `Hi ${fullName},\n\n` +
      `Your registration was not approved.\n` +
      (reason ? `Reason: ${reason}\n\n` : '\n') +
      `Reach out to the organizers if you believe this is an error.\n`,
  });

export const sendAccessRevokedMail = ({ to, fullName }) =>
  sendMail({
    to,
    subject: 'Vortex access revoked',
    text:
      `Hi ${fullName},\n\n` +
      `Your access to Vortex has been revoked by an organizer.\n` +
      `Contact the team if you have questions.\n`,
  });

export const sendAccessRestoredMail = ({ to, fullName, password }) =>
  sendMail({
    to,
    subject: 'Your Vortex access has been restored',
    text:
      `Hi ${fullName},\n\n` +
      `An organizer restored your access to Vortex.\n` +
      `Use the credentials below to log in again:\n\n` +
      `  Email:    ${to}\n` +
      `  Password: ${password}\n\n` +
      `Your previous revoked password no longer works.\n`,
  });
