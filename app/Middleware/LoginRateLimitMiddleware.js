import { createHash } from 'node:crypto';
import { rateLimit, ipKeyGenerator } from '@averoa/core';

// Brute-force protection for POST /api/auth/login. Only failed attempts count
// (a successful login gives its attempt back), in two limiters:
//   - per IP + email: LOGIN_RATE_LIMIT_MAX (default 5) failures per window,
//     so one account cannot be guessed at from one address;
//   - per IP: LOGIN_RATE_LIMIT_IP_MAX (default 50) failures per window, so one
//     address cannot try many accounts (credential stuffing).
// The window is LOGIN_RATE_LIMIT_WINDOW_MS (default 900000 = 15 minutes).
// Counters live in the store from RATE_LIMIT_STORE (Redis: shared by every
// instance). The client IP follows TRUST_PROXY.

const positiveInt = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${name} must be a positive integer (got "${value}")`);
  return n;
};

const windowMs = positiveInt('LOGIN_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const message = 'Too many login attempts, please try again later.';

// the email is hashed: bounded key length, no addresses stored in Redis
const emailKey = (req) => createHash('sha256')
  .update(String(req.body?.email ?? '').trim().toLowerCase())
  .digest('hex');

const perAccount = rateLimit({
  name: 'login-account',
  windowMs,
  limit: positiveInt('LOGIN_RATE_LIMIT_MAX', 5),
  skipSuccessfulRequests: true,
  message,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${emailKey(req)}`,
});

const perIp = rateLimit({
  name: 'login-ip',
  windowMs,
  limit: positiveInt('LOGIN_RATE_LIMIT_IP_MAX', 50),
  skipSuccessfulRequests: true,
  message,
});

class LoginRateLimitMiddleware {
  handle(req, res, next) {
    perIp(req, res, (err) => (err ? next(err) : perAccount(req, res, next)));
  }
}

export default new LoginRateLimitMiddleware();
