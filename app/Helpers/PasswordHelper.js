import {
  scrypt, scryptSync, randomBytes, timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const PREFIX = 'scrypt';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const COST = { N: 16384, r: 8, p: 1 };

const encode = (params, salt, key) => [PREFIX, params.N, params.r, params.p, salt.toString('base64url'), key.toString('base64url')].join('$');

/**
 * Password hashing with node:crypto scrypt (no native dependency).
 * Stored format: scrypt$N$r$p$<salt base64url>$<key base64url>
 */
class PasswordHelper {
  /** True when the value already is a hash produced by this helper. */
  isHash(value) {
    return typeof value === 'string' && value.startsWith(`${PREFIX}$`) && value.split('$').length === 6;
  }

  async hash(plain) {
    const salt = randomBytes(SALT_LENGTH);
    const key = await scryptAsync(String(plain), salt, KEY_LENGTH, COST);
    return encode(COST, salt, key);
  }

  /** Synchronous variant, for seeders (they insert through raw knex and skip model hooks). */
  hashSync(plain) {
    const salt = randomBytes(SALT_LENGTH);
    const key = scryptSync(String(plain), salt, KEY_LENGTH, COST);
    return encode(COST, salt, key);
  }

  /** Constant-time comparison of a plain password with a stored hash. Never throws. */
  async verify(plain, stored) {
    if (typeof plain !== 'string' || !this.isHash(stored)) return false;
    const [, N, r, p, saltB64, keyB64] = stored.split('$');
    const expected = Buffer.from(keyB64, 'base64url');
    if (!expected.length) return false;
    try {
      const actual = await scryptAsync(plain, Buffer.from(saltB64, 'base64url'), expected.length, {
        N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
      });
      return timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
}

export default new PasswordHelper();
