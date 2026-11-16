// nodemailer SMTP transport options
// (used by Mail in @averoa/utilities, the mail worker and app/Jobs/EmailSubscriberJob.js)
const port = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined;

// MAIL_SECURE=true|false wins. Otherwise implicit TLS is used for MAIL_ENCRYPTION=ssl
// or port 465; MAIL_ENCRYPTION=tls (or empty) means STARTTLS, which nodemailer
// negotiates by itself.
const secure = process.env.MAIL_SECURE
  ? process.env.MAIL_SECURE === 'true'
  : process.env.MAIL_ENCRYPTION === 'ssl' || port === 465;

export default {
  host: process.env.MAIL_HOST,
  port,
  secure,
  auth: process.env.MAIL_USERNAME
    ? { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD }
    : undefined,
};
