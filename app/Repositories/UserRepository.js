import { DB } from '@averoa/utilities';
import { Users } from '#models';
import { PasswordHelper } from '#helpers';

// Verified against when the email is unknown, so a failed login takes the same
// time whether or not the account exists (no user enumeration by timing).
const DUMMY_HASH = PasswordHelper.hashSync('averoa-timing-equalizer');

class UserRepository {
  /** Active (not soft-deleted) user by primary key, or undefined. */
  findActiveById(id) {
    return Users.query().findById(id).whereNull('deleted_at');
  }

  /** Active user by email, or undefined. */
  findActiveByEmail(email) {
    return Users.query().where('email', String(email).trim().toLowerCase()).whereNull('deleted_at').first();
  }

  /** Returns the user when the email/password pair is valid, otherwise null. */
  async findByCredentials(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') return null;
    const user = await this.findActiveByEmail(email);
    // a user without a password hash (rows from before the password column, or inserted
    // without one) cannot log in; the dummy hash only keeps the timing the same
    const hash = PasswordHelper.isHash(user?.password) ? user.password : DUMMY_HASH;
    const valid = await PasswordHelper.verify(password, hash);
    return user && hash !== DUMMY_HASH && valid ? user : null;
  }

  /**
   * Increments `token_version`: every access token issued before stops working
   * (see JwtStrategy). Accepts a transaction as `db`.
   */
  bumpTokenVersion(id, db = DB) {
    return db(Users.tableName).where('id', id).update({ token_version: db.raw('?? + 1', ['token_version']), updated_at: new Date() });
  }

  /** Stores an already hashed password (PasswordHelper.hash) and invalidates every access token. */
  updatePasswordHash(id, hash, db = DB) {
    return db(Users.tableName).where('id', id).update({
      password: hash,
      token_version: db.raw('?? + 1', ['token_version']),
      updated_at: new Date(),
    });
  }

  /** Sets `email_verified_at` (once). Resolves true when it was not verified before. */
  async markEmailVerified(id, db = DB) {
    const updated = await db(Users.tableName).where('id', id).whereNull('email_verified_at')
      .update({ email_verified_at: new Date(), updated_at: new Date() });
    return Number(updated) === 1;
  }
}

export default new UserRepository();
