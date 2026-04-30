/**
 * Tactical Mail Service Utility
 * In production, replace with nodemailer / SendGrid / AWS SES
 */

export const sendMail = async ({ to, subject, text }) => {
  console.log(`[MAIL_PROTOCOL_ACTIVE]`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: ${text}`);
  console.log(`[MAIL_SENT_SUCCESS]`);
  return true;
};

export const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
