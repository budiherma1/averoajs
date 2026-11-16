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
    const valid = await PasswordHelper.verify(password, user?.password ?? DUMMY_HASH);
    return user && valid ? user : null;
  }
}

export default new UserRepository();
