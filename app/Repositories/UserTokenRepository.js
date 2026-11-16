import { DB } from '@averoa/utilities';
import { TokenHelper } from '#helpers';

const TABLE = 'user_tokens';

export const TOKEN_TYPES = Object.freeze({
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
});

/**
 * Single-use tokens sent by email (password reset, email verification),
 * stored as SHA-256 hashes in `user_tokens`. A user has at most one live token
 * of each type: creating one deletes the previous unused ones.
 */
class UserTokenRepository {
  /** Stores a new token for `email`. Resolves the plain token (only ever sent by email). */
  async create(userId, type, email, ttlSeconds, db = DB) {
    const token = TokenHelper.random();
    const now = new Date();
    await db(TABLE).where({ user_id: userId, type }).whereNull('used_at').delete();
    await db(TABLE).insert({
      user_id: userId,
      type,
      token_hash: TokenHelper.hash(token),
      email,
      expires_at: new Date(now.getTime() + ttlSeconds * 1000),
      created_at: now,
    });
    return token;
  }

  /** Creation time of the newest token of this type, or null. */
  async latestCreatedAt(userId, type, db = DB) {
    const row = await db(TABLE).where({ user_id: userId, type }).orderBy('created_at', 'desc').first('created_at');
    return row ? new Date(row.created_at) : null;
  }

  /** The unused, unexpired row of a plain token, or undefined. */
  async findValid(type, token, db = DB) {
    if (!TokenHelper.looksValid(token)) return undefined;
    return db(TABLE)
      .where({ token_hash: TokenHelper.hash(token), type })
      .whereNull('used_at')
      .where('expires_at', '>', new Date())
      .first();
  }

  /** Marks a token used. Resolves true only for the request that used it first. */
  async markUsed(id, db = DB) {
    const updated = await db(TABLE).where('id', id).whereNull('used_at').update({ used_at: new Date() });
    return Number(updated) === 1;
  }

  /** Deletes the unused tokens of this type (e.g. other reset links once the password changed). */
  deleteUnused(userId, type, db = DB) {
    return db(TABLE).where({ user_id: userId, type }).whereNull('used_at').delete();
  }

  /** Deletes tokens that expired before `before` (default: now). For a scheduled cleanup. */
  deleteExpired(before = new Date(), db = DB) {
    return db(TABLE).where('expires_at', '<', before).delete();
  }
}

export default new UserTokenRepository();
