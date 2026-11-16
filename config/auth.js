// Authentication settings (app/Services/AuthService.js, app/Strategies/JwtStrategy.js).
// Durations: seconds (900) or a number with a unit s, m, h, d, w (15m, 30d).
const trimSlash = (url) => String(url).replace(/\/+$/, '');

const appUrl = trimSlash(process.env.APP_URL
  || `${process.env.APP_HOST || 'http://localhost'}:${process.env.APP_PORT || 8888}`);
const frontendUrl = trimSlash(process.env.FRONTEND_URL || appUrl);

export default {
  // access JWT lifetime (TOKEN_EXPIRES_IN is the pre-refresh-token name, still honoured)
  accessTtl: process.env.JWT_ACCESS_TTL || process.env.TOKEN_EXPIRES_IN || '15m',
  // refresh token lifetime; every refresh rotates the token and restarts this window
  refreshTtl: process.env.JWT_REFRESH_TTL || '30d',

  passwordReset: {
    ttl: process.env.PASSWORD_RESET_TTL || '60m',
    // a new link is only sent when the previous one is older than this
    throttle: process.env.PASSWORD_RESET_THROTTLE || '60s',
  },

  emailVerification: {
    ttl: process.env.EMAIL_VERIFICATION_TTL || '24h',
    throttle: process.env.EMAIL_VERIFICATION_THROTTLE || '60s',
  },

  mail: {
    from: process.env.MAIL_FROM_ADDRESS
      ? { name: process.env.MAIL_FROM_NAME || 'AveroaJS', address: process.env.MAIL_FROM_ADDRESS }
      : 'AveroaJS <no-reply@localhost>',
    appName: process.env.MAIL_FROM_NAME || 'AveroaJS',
  },

  // Links put in the emails. They point at your front end, which reads the token
  // from the query string and POSTs it to the API (/api/auth/verify-email,
  // /api/auth/reset-password). Without a front end, verification links can call
  // the API directly: `${appUrl}/api/auth/verify-email?token=...` (GET is supported).
  links: {
    verifyEmail: (token) => `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`,
    resetPassword: (token) => `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`,
  },
};
