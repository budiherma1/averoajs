import { randomUUID } from 'node:crypto';
import { DB } from '@averoa/utilities';
import { TokenHelper } from '#helpers';

const TABLE = 'refresh_tokens';

/**
 * Rotating refresh tokens, stored as SHA-256 hashes in `refresh_tokens`.
 * A login starts a family (a random id that is also the `sid` claim of the
 * access tokens); every rotation revokes the presented token and adds the
 * next one to the same family. Every method accepts a transaction as `db`.
 */
class RefreshTokenRepository {
  /** Stores a token of `family` (new family when omitted): { token, family, expiresAt }. */
  async create(userId, ttlSeconds, { family = randomUUID(), db = DB } = {}) {
    const token = TokenHelper.random();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    await db(TABLE).insert({
      user_id: userId,
      family,
      token_hash: TokenHelper.hash(token),
      expires_at: expiresAt,
      created_at: now,
    });
    return { token, family, expiresAt };
  }

  /** The stored row of a plain token (revoked and expired rows included), or undefined. */
  findByToken(token, db = DB) {
    return db(TABLE).where('token_hash', TokenHelper.hash(token)).first();
  }

  /** True when the family still has a live (not revoked, not expired) token of this user. */
  async isFamilyActive(family, userId, db = DB) {
    if (typeof family !== 'string' || family === '') return false;
    const row = await db(TABLE)
      .where({ family, user_id: userId })
      .whereNull('revoked_at')
      .where('expires_at', '>', new Date())
      .first('id');
    return Boolean(row);
  }

  /**
   * Revokes `row` and stores its successor in one transaction. Resolves the new
   * { token, family, expiresAt }, or null when `row` was revoked in the meantime
   * (a concurrent refresh with the same token, handled as reuse by the caller).
   */
  rotate(row, ttlSeconds) {
    return DB.transaction(async (trx) => {
      const revoked = await trx(TABLE)
        .where('id', row.id)
        .whereNull('revoked_at')
        .update({ revoked_at: new Date(), revoked_reason: 'rotated' });
      if (Number(revoked) !== 1) return null;
      return this.create(row.user_id, ttlSeconds, { family: row.family, db: trx });
    });
  }

  /** Revokes every live token of a family. Resolves the number of revoked tokens. */
  revokeFamily(family, reason, db = DB) {
    return db(TABLE)
      .where('family', family)
      .whereNull('revoked_at')
      .update({ revoked_at: new Date(), revoked_reason: reason });
  }

  /** Revokes every live token of a user. Resolves the number of revoked tokens. */
  revokeAllForUser(userId, reason, db = DB) {
    return db(TABLE)
      .where('user_id', userId)
      .whereNull('revoked_at')
      .update({ revoked_at: new Date(), revoked_reason: reason });
  }

  /** Deletes tokens that expired before `before` (default: now). For a scheduled cleanup. */
  deleteExpired(before = new Date(), db = DB) {
    return db(TABLE).where('expires_at', '<', before).delete();
  }
}

export default new RefreshTokenRepository();
