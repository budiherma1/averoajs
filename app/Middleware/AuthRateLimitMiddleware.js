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
// limit the answer is 429 { status: false, message } with a Retry-After header.
// The client IP follows TRUST_PROXY (req.ip).
//
// Counters live in the memory of this process: with several instances each one
// counts on its own. Put a shared limiter (Redis, the reverse proxy) in front when
// you scale out. Tokens are 256-bit random values, so these limits are about
// email spam and noise, not about making the tokens guessable.

const positiveInt = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${name} must be a positive integer (got "${value}")`);
  return n;
};

const MESSAGE = 'Too many requests, please try again later.';
const PRUNE_EVERY = 1000;

/** Fixed-window counter per key, in memory. */
export class MemoryRateLimiter {
  /**
   * @param {object} options
   * @param {string} options.name            prefix of the keys (one counter set per limiter)
   * @param {number} options.windowMs        window length
   * @param {number} options.limit           requests allowed per key and window
   * @param {boolean} [options.failedOnly]   count only responses with status >= 400
   * @param {(req) => string} [options.key]  key of a request (default: the client IP)
   */
  constructor({
    name, windowMs, limit, failedOnly = false, key = (req) => req.ip ?? req.socket?.remoteAddress ?? 'unknown',
  }) {
    this.name = name;
    this.windowMs = windowMs;
    this.limit = limit;
    this.failedOnly = failedOnly;
    this.key = key;
    this.hits = new Map();
    this.calls = 0;
    this.handle = this.handle.bind(this);
  }

  /** @private live entry of a key (a new one when the window is over) */
  entry(key, now) {
    let entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + this.windowMs };
      this.hits.set(key, entry);
    }
    return entry;
  }

  /** @private drops finished windows, so the map stays bounded by the active clients */
  prune(now) {
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }

  handle(req, res, next) {
    const now = Date.now();
    this.calls += 1;
    if (this.calls % PRUNE_EVERY === 0) this.prune(now);

    // one counter per endpoint: register and forgot-password do not share a budget
    const path = String(req.originalUrl ?? req.url ?? '').split('?')[0];
    const key = `${this.name}:${req.method} ${path}:${this.key(req)}`;
    const entry = this.entry(key, now);
    if (entry.count >= this.limit) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ status: false, message: MESSAGE });
    }

    if (!this.failedOnly) {
      entry.count += 1;
    } else {
      res.on('finish', () => {
        if (res.statusCode < 400) return;
        this.entry(key, Date.now()).count += 1;
      });
    }
    return next();
  }

  /** Forgets every counter (tests). */
  reset() {
    this.hits.clear();
  }
}

const windowMs = positiveInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);

class AuthRateLimitMiddleware {
  constructor() {
    this.strict = new MemoryRateLimiter({
      name: 'auth-strict', windowMs, limit: positiveInt('AUTH_RATE_LIMIT_MAX', 10),
    });
    this.failures = new MemoryRateLimiter({
      name: 'auth-failures', windowMs, limit: positiveInt('AUTH_RATE_LIMIT_FAILED_MAX', 20), failedOnly: true,
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
