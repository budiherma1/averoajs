import { createHash, randomBytes } from 'node:crypto';

const UNIT_SECONDS = {
  s: 1, m: 60, h: 3600, d: 86400, w: 604800,
};

/**
 * Random tokens for refresh tokens, password reset and email verification
 * links. Only their SHA-256 hash is stored: the tokens are 256-bit random
 * values, so a fast hash is enough (no brute force is possible) and lookups
 * stay a single indexed query.
 */
class TokenHelper {
  /** URL-safe random token (43 characters for the default 32 bytes). */
  random(bytes = 32) {
    return randomBytes(bytes).toString('base64url');
  }

  /** Hex SHA-256 of a token: the value stored in the database. */
  hash(token) {
    return createHash('sha256').update(String(token)).digest('hex');
  }

  /** True for a string that can be a token from random() (cheap guard before hashing). */
  looksValid(token) {
    return typeof token === 'string' && token.length >= 16 && token.length <= 512;
  }

  /**
   * Duration in seconds from a number of seconds (900, '900') or a number with
   * a unit: s, m, h, d, w ('15m', '7d'). Throws for anything else, so a typo in
   * .env stops the app at startup instead of issuing tokens with a wrong lifetime.
   */
  parseDuration(value, name = 'duration') {
    const text = String(value ?? '').trim();
    const match = /^(\d+)\s*([smhdw]?)$/i.exec(text);
    const seconds = match ? Number(match[1]) * UNIT_SECONDS[(match[2] || 's').toLowerCase()] : NaN;
    if (!Number.isSafeInteger(seconds) || seconds <= 0) {
      throw new Error(`${name} must be a positive number of seconds or a number with a unit s, m, h, d or w (e.g. 900, 15m, 7d); got "${text}"`);
    }
    return seconds;
  }
}

export default new TokenHelper();
