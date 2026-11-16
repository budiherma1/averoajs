import { rateLimit, ipKeyGenerator } from '@averoa/core';

// Rate limits for the public authentication endpoints (routes/api.js):
//
//   - AuthRateLimit.strict: register, forgot-password. Every request counts, per
//     client IP and endpoint: AUTH_RATE_LIMIT_MAX (default 10) per window. These endpoints send
//     email or create rows, so they are the cheapest to abuse.
//   - AuthRateLimit.failures: refresh, reset-password, verify-email. Only failed
//     requests (status >= 400) count, per client IP and endpoint: AUTH_RATE_LIMIT_FAILED_MAX
//     (default 20) per window, so clients that refresh normally are never blocked
//     while token guessing is.
//
// The window is AUTH_RATE_LIMIT_WINDOW_MS (default 900000 = 15 minutes). Over the
// limit the answer is 429 with Retry-After and RateLimit headers (core's rate-limit
// error). The client IP follows TRUST_PROXY (req.ip).
//
// Counters live in the store selected by RATE_LIMIT_STORE, like the login limiter:
// with Redis they are shared by every instance. Tokens are 256-bit random values,
// so these limits are about email spam and noise, not about making tokens guessable.
// POST /api/auth/login has its own limiter (LoginRateLimitMiddleware).

const positiveInt = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${name} must be a positive integer (got "${value}")`);
  return n;
};

const windowMs = positiveInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);

// one counter per endpoint: register and forgot-password do not share a budget. The key
// is the matched route, not the raw URL: Express routing ignores case and a trailing
// slash, so /api/auth/Forgot-password/ must count against /api/auth/forgot-password.
const endpointKey = (req) => {
  const route = req.route?.path ?? String(req.path ?? '').split('?')[0];
  const path = `${req.baseUrl ?? ''}${route}`.toLowerCase().replace(/\/+$/, '') || '/';
  return `${req.method} ${path}:${ipKeyGenerator(req.ip ?? req.socket?.remoteAddress ?? 'unknown')}`;
};

class AuthLimiter {
  /**
   * @param {object} options
   * @param {string} options.name          limiter name (key prefix in a shared store)
   * @param {number} options.limit         requests allowed per IP, endpoint and window
   * @param {boolean} [options.failedOnly] count only responses with status >= 400
   */
  constructor({ name, limit, failedOnly = false }) {
    this.name = name;
    this.limit = limit; // read on every request, so it can be changed at runtime (tests)
    this.failedOnly = failedOnly;
    this.middleware = this.build();
    this.handle = (req, res, next) => this.middleware(req, res, next);
  }

  /** @private */
  build() {
    return rateLimit({
      name: this.name,
      windowMs,
      limit: () => this.limit,
      skipSuccessfulRequests: this.failedOnly,
      keyGenerator: endpointKey,
    });
  }

  /** Starts over with empty counters. Only effective with the memory store (tests). */
  reset() {
    this.middleware = this.build();
  }
}

class AuthRateLimitMiddleware {
  constructor() {
    this.strict = new AuthLimiter({ name: 'auth-strict', limit: positiveInt('AUTH_RATE_LIMIT_MAX', 10) });
    this.failures = new AuthLimiter({
      name: 'auth-failures', limit: positiveInt('AUTH_RATE_LIMIT_FAILED_MAX', 20), failedOnly: true,
    });
  }

  /** Middleware name form ('AuthRateLimitMiddleware'): the strict limiter. */
  handle(req, res, next) {
    return this.strict.handle(req, res, next);
  }

  reset() {
    this.strict.reset();
    this.failures.reset();
  }
}

export default new AuthRateLimitMiddleware();
