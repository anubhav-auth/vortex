import { logger } from './logger.js';

// Stub mailer — logs structured records. Swap for SendGrid/SES/nodemailer
// without touching callers. NEVER inline the password into a non-mail log.

export const sendMail = async ({ to, subject, text }) => {
  logger.info('mail', { to, subject, body: text });
  return { delivered: true };
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
