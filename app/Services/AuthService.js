import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { DB, Log, Mail } from '@averoa/utilities';
import { Users } from '#models';
import { PasswordHelper, TokenHelper } from '#helpers';
import {
  UserRepository, RefreshTokenRepository, UserTokenRepository, TOKEN_TYPES,
} from '#repositories';
import { tokenSecret, JWT_ALGORITHM } from '#app/Strategies/JwtStrategy.js';
import authConfig from '../../config/auth.js';

/** Fields a client may send to POST /api/auth/register (never is_admin, token_version, ...). */
const REGISTER_FIELDS = ['first_name', 'last_name', 'email', 'password', 'address'];

const fail = (statusCode, message, extra = {}) => ({
  status: false, message, statusCode, ...extra,
});
const invalidField = (column, message) => ({
  status: false, data: { column, message }, statusCode: 422,
});
const sameEmail = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

const INVALID_REFRESH = 'Invalid refresh token';
const INVALID_RESET = 'This password reset link is invalid or has expired.';
const INVALID_VERIFICATION = 'This verification link is invalid or has expired.';
const FORGOT_MESSAGE = 'If an account exists for that email address, a password reset link has been sent to it.';

/** Durations from config/auth.js, in seconds. Invalid values throw when the app starts. */
function loadSettings(config) {
  return {
    accessTtl: TokenHelper.parseDuration(config.accessTtl, 'JWT_ACCESS_TTL'),
    refreshTtl: TokenHelper.parseDuration(config.refreshTtl, 'JWT_REFRESH_TTL'),
    passwordResetTtl: TokenHelper.parseDuration(config.passwordReset.ttl, 'PASSWORD_RESET_TTL'),
    passwordResetThrottle: TokenHelper.parseDuration(config.passwordReset.throttle, 'PASSWORD_RESET_THROTTLE'),
    verificationTtl: TokenHelper.parseDuration(config.emailVerification.ttl, 'EMAIL_VERIFICATION_TTL'),
    verificationThrottle: TokenHelper.parseDuration(config.emailVerification.throttle, 'EMAIL_VERIFICATION_THROTTLE'),
  };
}

/**
 * Authentication flows used by AuthController, PasswordResetController and
 * EmailVerificationController. Methods resolve `{ status, message?, data?,
 * statusCode? }` like Crud: a failure carries the HTTP status to answer.
 */
class AuthService {
  constructor() {
    this.config = authConfig;
    this.settings = loadSettings(authConfig);
    this.pending = new Set();
  }

  /* ---------------------------------------------------------------------- */
  /* Tokens                                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * Short-lived access JWT. Claims: `id` (user), `tv` (users.token_version),
   * `sid` (refresh token family), `jti` (unique id). JwtStrategy rejects it once
   * the token version changed or the family was revoked.
   */
  signAccessToken(user, family) {
    return jwt.sign(
      { id: user.id, tv: Number(user.token_version ?? 0), sid: family },
      tokenSecret(),
      { algorithm: JWT_ALGORITHM, expiresIn: this.settings.accessTtl, jwtid: randomUUID() },
    );
  }

  /** The token pair returned by login, register and refresh. */
  tokenPair(user, refresh) {
    return {
      token: this.signAccessToken(user, refresh.family),
      type: 'Bearer',
      expires_in: this.settings.accessTtl,
      refresh_token: refresh.token,
      refresh_expires_in: this.settings.refreshTtl,
    };
  }

  /** Starts a new session (refresh token family) for a user. */
  async issueTokens(user) {
    const refresh = await RefreshTokenRepository.create(user.id, this.settings.refreshTtl);
    return this.tokenPair(user, refresh);
  }

  /** POST /api/auth/login */
  async login(email, password) {
    const user = await UserRepository.findByCredentials(email, password);
    if (!user) return fail(401, 'Invalid email or password');
    return { status: true, data: await this.issueTokens(user) };
  }

  /**
   * POST /api/auth/refresh: rotates the refresh token. A token that was already
   * rotated is a sign of theft (the legitimate client and an attacker both hold
   * it), so presenting it again revokes its whole family: every refresh token
   * and access token of that session.
   */
  async refresh(token) {
    if (!TokenHelper.looksValid(token)) return fail(401, INVALID_REFRESH);

    const row = await RefreshTokenRepository.findByToken(token);
    if (!row) return fail(401, INVALID_REFRESH);

    if (row.revoked_at != null) {
      if (row.revoked_reason === 'rotated') await this.reuseDetected(row);
      return fail(401, INVALID_REFRESH);
    }
    if (new Date(row.expires_at).getTime() <= Date.now()) return fail(401, INVALID_REFRESH);

    const user = await UserRepository.findActiveById(row.user_id);
    if (!user) {
      await RefreshTokenRepository.revokeFamily(row.family, 'user_inactive');
      return fail(401, INVALID_REFRESH);
    }

    const next = await RefreshTokenRepository.rotate(row, this.settings.refreshTtl);
    if (!next) {
      // another request rotated this token first
      await this.reuseDetected(row);
      return fail(401, INVALID_REFRESH);
    }
    return { status: true, data: this.tokenPair(user, next) };
  }

  /** @private */
  async reuseDetected(row) {
    const revoked = await RefreshTokenRepository.revokeFamily(row.family, 'reuse_detected');
    Log.warn(`AuthService: refresh token reuse detected for user ${row.user_id}, session ${row.family} revoked (${revoked} token(s))`);
  }

  /** POST /api/auth/logout: revokes the session of the access token (its refresh token family). */
  async logout(claims) {
    if (typeof claims?.sid === 'string') await RefreshTokenRepository.revokeFamily(claims.sid, 'logout');
    return { status: true, message: 'Logged out' };
  }

  /** POST /api/auth/logout-all: every session of the user, on every device. */
  async logoutAll(user) {
    await this.invalidateSessions(user.id, 'logout_all');
    return { status: true, message: 'Logged out from every session' };
  }

  /**
   * Invalidates every access token (token_version + 1) and refresh token of a
   * user. Call it after changing a password or an email address in your own code.
   */
  invalidateSessions(userId, reason = 'logout_all') {
    return DB.transaction(async (trx) => {
      await UserRepository.bumpTokenVersion(userId, trx);
      await RefreshTokenRepository.revokeAllForUser(userId, reason, trx);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Registration and email verification                                     */
  /* ---------------------------------------------------------------------- */

  /** POST /api/auth/register: creates the user, signs them in and sends the verification email. */
  async register(body) {
    const input = {};
    for (const field of REGISTER_FIELDS) {
      const value = body?.[field];
      if (value === undefined || value === null || value === '') continue;
      if (typeof value !== 'string') return invalidField(field, 'must be a string');
      input[field] = field === 'email' ? value.trim().toLowerCase() : value;
    }

    const validation = Users.validation(input, 'create');
    if (validation?.status === false) return { ...validation, statusCode: 422 };
    if (await Users.isDuplicate('email', input.email)) {
      return invalidField('email', ['email is already registered']);
    }

    // $beforeInsert hashes the password and normalizes the email
    const user = await Users.query().insertAndFetch(input);
    this.defer('verification email', () => this.sendVerificationEmail(user));
    return { status: true, data: { user, ...(await this.issueTokens(user)) } };
  }

  /** Creates a verification token and emails the link to the user's current address. */
  async sendVerificationEmail(user) {
    const token = await UserTokenRepository.create(
      user.id,
      TOKEN_TYPES.EMAIL_VERIFICATION,
      user.email,
      this.settings.verificationTtl,
    );
    const url = this.config.links.verifyEmail(token);
    const name = user.first_name || '';
    const minutes = Math.round(this.settings.verificationTtl / 60);
    await this.mail(user.email, `Verify your email address - ${this.config.mail.appName}`, 'emails/verify-email', {
      name, url, minutes, appName: this.config.mail.appName,
    }, `Hello ${name},\n\nPlease confirm your email address by opening this link:\n${url}\n\nThe link expires in ${minutes} minutes. If you did not create an account, no further action is required.\n`);
  }

  /** POST /api/auth/resend-verification (signed in) */
  async resendVerification(user) {
    if (user.email_verified_at != null) return { status: true, message: 'Your email address is already verified.' };

    const type = TOKEN_TYPES.EMAIL_VERIFICATION;
    const retryAfter = await this.throttled(user.id, type, this.settings.verificationThrottle);
    if (retryAfter > 0) {
      return fail(429, 'Please wait before requesting another verification email.', { retry_after: retryAfter });
    }
    this.defer('verification email', () => this.sendVerificationEmail(user));
    return { status: true, message: 'A new verification link has been sent to your email address.' };
  }

  /**
   * GET|POST /api/auth/verify-email: single use; the address must not have changed
   * since the link was sent.
   */
  async verifyEmail(token) {
    const row = await UserTokenRepository.findValid(TOKEN_TYPES.EMAIL_VERIFICATION, token);
    if (!row) return fail(400, INVALID_VERIFICATION);
    const user = await UserRepository.findActiveById(row.user_id);
    if (!user || !sameEmail(user.email, row.email)) return fail(400, INVALID_VERIFICATION);

    const used = await DB.transaction(async (trx) => {
      if (!(await UserTokenRepository.markUsed(row.id, trx))) return false;
      await UserRepository.markEmailVerified(user.id, trx);
      await UserTokenRepository.deleteUnused(user.id, TOKEN_TYPES.EMAIL_VERIFICATION, trx);
      return true;
    });
    if (!used) return fail(400, INVALID_VERIFICATION);
    return { status: true, message: 'Your email address has been verified.' };
  }

  /* ---------------------------------------------------------------------- */
  /* Password reset                                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * POST /api/auth/forgot-password. The answer never depends on the address:
   * the lookup, the token and the email happen after the response was sent, so
   * neither the body nor the timing tells whether an account exists.
   */
  forgotPassword(email) {
    if (typeof email !== 'string' || email.trim() === '') return invalidField('email', 'required');
    const normalized = email.trim().toLowerCase();
    const validation = Users.validation({ email: normalized }, 'update');
    if (validation?.status === false) return { ...validation, statusCode: 422 };
    this.defer('password reset email', () => this.sendPasswordResetLink(normalized));
    return { status: true, message: FORGOT_MESSAGE };
  }

  /** @private */
  async sendPasswordResetLink(email) {
    const user = await UserRepository.findActiveByEmail(email);
    if (!user) return;
    // silently skip while the previous link is recent (the answer is always the same)
    const { passwordResetThrottle, passwordResetTtl } = this.settings;
    const type = TOKEN_TYPES.PASSWORD_RESET;
    if (await this.throttled(user.id, type, passwordResetThrottle) > 0) return;

    const token = await UserTokenRepository.create(
      user.id,
      TOKEN_TYPES.PASSWORD_RESET,
      user.email,
      passwordResetTtl,
    );
    const url = this.config.links.resetPassword(token);
    const name = user.first_name || '';
    const minutes = Math.round(this.settings.passwordResetTtl / 60);
    await this.mail(user.email, `Reset your password - ${this.config.mail.appName}`, 'emails/reset-password', {
      name, url, minutes, appName: this.config.mail.appName,
    }, `Hello ${name},\n\nYou are receiving this email because we received a password reset request for your account.\nOpen this link to choose a new password:\n${url}\n\nThe link expires in ${minutes} minutes. If you did not request a password reset, no further action is required.\n`);
  }

  /**
   * POST /api/auth/reset-password: single use. Sets the new password, then
   * signs the user out everywhere (token_version + 1, refresh tokens revoked).
   */
  async resetPassword(token, password) {
    if (typeof token !== 'string' || token === '') return invalidField('token', 'required');
    if (typeof password !== 'string' || password === '') return invalidField('password', 'required');
    const validation = Users.validation({ password }, 'update');
    if (validation?.status === false) return { ...validation, statusCode: 422 };

    const row = await UserTokenRepository.findValid(TOKEN_TYPES.PASSWORD_RESET, token);
    if (!row) return fail(400, INVALID_RESET);
    const user = await UserRepository.findActiveById(row.user_id);
    if (!user || !sameEmail(user.email, row.email)) return fail(400, INVALID_RESET);

    const hash = await PasswordHelper.hash(password);
    const used = await DB.transaction(async (trx) => {
      if (!(await UserTokenRepository.markUsed(row.id, trx))) return false;
      await UserRepository.updatePasswordHash(user.id, hash, trx);
      await RefreshTokenRepository.revokeAllForUser(user.id, 'password_reset', trx);
      await UserTokenRepository.deleteUnused(user.id, TOKEN_TYPES.PASSWORD_RESET, trx);
      return true;
    });
    if (!used) return fail(400, INVALID_RESET);
    return { status: true, message: 'Your password has been reset. Please sign in with your new password.' };
  }

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                 */
  /* ---------------------------------------------------------------------- */

  /** Seconds to wait before another token of this type may be sent (0 = now). */
  async throttled(userId, type, throttleSeconds) {
    const latest = await UserTokenRepository.latestCreatedAt(userId, type);
    if (!latest) return 0;
    const waitMs = latest.getTime() + throttleSeconds * 1000 - Date.now();
    // clamped: databases without fractional seconds may round created_at up
    return waitMs > 0 ? Math.min(throttleSeconds, Math.ceil(waitMs / 1000)) : 0;
  }

  /** @private */
  mail(to, subject, view, data, text) {
    return Mail.init()
      .from(this.config.mail.from)
      .to(to)
      .subject(subject)
      .html(view, data)
      .text(text)
      .send();
  }

  /**
   * Runs `task` after the current response was sent; failures are logged, never
   * thrown. `settled()` waits for every pending task (tests, graceful shutdown).
   */
  defer(label, task) {
    const promise = new Promise((resolve) => { setImmediate(resolve); })
      .then(task)
      .catch((err) => { Log.error(`AuthService: ${label} failed: ${err?.stack || err}`); })
      .finally(() => { this.pending.delete(promise); });
    this.pending.add(promise);
    return promise;
  }

  async settled() {
    while (this.pending.size) await Promise.all([...this.pending]);
  }
}

export default new AuthService();
