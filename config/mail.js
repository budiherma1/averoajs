// nodemailer transport options
// (used by Mail in @averoa/utilities and app/Jobs/EmailSubscriberJob.js)
export default {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined,
  // implicit TLS (port 465); MAIL_ENCRYPTION=tls means STARTTLS,
  // which nodemailer negotiates by itself
  secure: process.env.MAIL_ENCRYPTION === 'ssl' || Number(process.env.MAIL_PORT) === 465,
  auth: process.env.MAIL_USERNAME
    ? { user: process.env.MAIL_USERNAME, pass: process.env.MAIL_PASSWORD }
    : undefined,
};
