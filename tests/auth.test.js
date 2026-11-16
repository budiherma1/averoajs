// Integration tests of the authentication flows (registration, refresh tokens,
// logout, password reset, email verification) and of the Gate/TeacherPolicy
// authorization, on the real app with an in-memory better-sqlite3 database.
// Mail is recorded by fakeMail() from @averoa/core/testing: nothing is ever sent.
import {
  describe, test, before, after, beforeEach,
} from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { testApp, fakeMail } from '@averoa/core/testing.js';
import { setTestEnv } from './helpers.js';

// high limits: the suite sends many requests from one IP ('rate limits' lowers them)
setTestEnv({ FRONTEND_URL: 'https://app.example.test/', AUTH_RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_FAILED_MAX: '1000', RATE_LIMIT_ENABLED: 'false' });

const DEMO = { email: 'demo@averoa.test', password: 'password' }; // admin
const MEMBER = { email: 'member@averoa.test', password: 'password' }; // not an admin

let app;
let DB;
let http;
let AuthService;
let Gate;
let Users;
let Teacher;
let AuthRateLimit;
let mailer; // fakeMail(): mailer.sent holds every recorded message

/**
 * Waits for the mails sent after the response (AuthService.defer) and returns
 * the new ones (only those to `to` when given).
 */
async function newMail(since, to) {
  await AuthService.settled();
  if (to === undefined) return mailer.sent.slice(since);
  const mine = new Set(mailer.to(to));
  return mailer.sent.slice(since).filter((mail) => mine.has(mail));
}

const tokenFromMail = (mail) => {
  const match = /[?&]token=([A-Za-z0-9_-]+)/.exec(mail.text);
  assert.ok(match, `no token link in mail: ${mail.text}`);
  return match[1];
};

async function login(credentials) {
  const res = await http('POST', '/api/auth/login', { body: credentials });
  assert.equal(res.status, 200, res.text);
  return res.body.data;
}

let counter = 0;
const uniqueEmail = (prefix) => `${prefix}${Date.now().toString(36)}${(counter += 1)}@example.test`;

/** Registers a fresh user; resolves { email, password, data, mail }. */
async function register(prefix = 'user') {
  const email = uniqueEmail(prefix);
  const password = 'correct horse battery';
  const sent = mailer.sent.length;
  const res = await http('POST', '/api/auth/register', { body: { first_name: 'Test', email, password } });
  assert.equal(res.status, 201, res.text);
  const [mail] = await newMail(sent, email);
  return {
    email, password, data: res.body.data, mail,
  };
}

before(async () => {
  const utilities = await import('@averoa/utilities');
  ({ DB, Gate } = utilities);
  ({ Users, Teacher } = await import('#models'));
  ({ default: AuthService } = await import('#app/Services/AuthService.js'));
  ({ default: AuthRateLimit } = await import('#app/Middleware/AuthRateLimitMiddleware.js'));

  mailer = await fakeMail();
  app = await testApp();
  ({ http } = app);
});

after(async () => {
  await AuthService?.settled();
  mailer?.restore();
  await app?.close();
});

describe('login and access tokens', () => {
  test('concurrent registrations with one email create one account', async () => {
    const email = uniqueEmail('race');
    const results = await Promise.all(Array.from({ length: 5 }, () => http('POST', '/api/auth/register', {
      body: { first_name: 'Race', email, password: 'password1' },
    })));
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 422, 422, 422, 422]);
    assert.equal((await DB('users').where('email', email)).length, 1);
    await AuthService.settled();
  });

  test('a user without a password hash cannot log in, not even with the timing dummy password', async () => {
    const email = uniqueEmail('nopass');
    await DB('users').insert({ first_name: 'No', email, password: null });
    for (const password of ['averoa-timing-equalizer', '', 'password']) {
      const res = await http('POST', '/api/auth/login', { body: { email, password } });
      assert.ok([401, 422].includes(res.status), `${password}: ${res.status} ${res.text}`);
    }
  });

  test('login answers an access token and a refresh token', async () => {
    const data = await login(DEMO);
    assert.equal(data.type, 'Bearer');
    assert.equal(data.expires_in, 300, 'TOKEN_EXPIRES_IN=5m is honoured when JWT_ACCESS_TTL is not set');
    assert.equal(data.refresh_expires_in, 30 * 86400);
    assert.match(data.refresh_token, /^[A-Za-z0-9_-]{43}$/);

    const claims = jwt.decode(data.token);
    assert.equal(typeof claims.jti, 'string');
    assert.equal(claims.tv, 0);
    assert.equal(typeof claims.sid, 'string');
    assert.equal(claims.exp - claims.iat, 300);
    assert.notEqual(jwt.decode((await login(DEMO)).token).jti, claims.jti, 'jti is unique');
  });

  test('refresh tokens are stored hashed, never in plain text', async () => {
    const { refresh_token: token } = await login(DEMO);
    const rows = await DB('refresh_tokens').select('token_hash');
    assert.ok(rows.length > 0);
    assert.ok(rows.every((row) => row.token_hash !== token && /^[0-9a-f]{64}$/.test(row.token_hash)));
  });

  test('tokens without a token version or session, or expired ones, are rejected', async () => {
    const user = await DB('users').where('email', DEMO.email).first();
    const { token } = await login(DEMO);
    const { sid } = jwt.decode(token);
    const secret = process.env.TOKEN_SECRET;

    const legacy = jwt.sign({ id: user.id }, secret, { algorithm: 'HS256', expiresIn: 60 });
    assert.equal((await http('GET', '/api/auth/me', { token: legacy })).status, 401);

    const unknownSession = jwt.sign({ id: user.id, tv: 0, sid: 'nope' }, secret, { algorithm: 'HS256', expiresIn: 60 });
    assert.equal((await http('GET', '/api/auth/me', { token: unknownSession })).status, 401);

    const expired = jwt.sign({
      id: user.id, tv: 0, sid, exp: Math.floor(Date.now() / 1000) - 10,
    }, secret, { algorithm: 'HS256' });
    assert.equal((await http('GET', '/api/auth/me', { token: expired })).status, 401);

    const valid = jwt.sign({ id: user.id, tv: 0, sid }, secret, { algorithm: 'HS256', expiresIn: 60 });
    assert.equal((await http('GET', '/api/auth/me', { token: valid })).status, 200);
  });

  test('/me never exposes the password hash or the token version', async () => {
    const { token } = await login(DEMO);
    const me = await http('GET', '/api/auth/me', { token });
    assert.equal(me.status, 200, me.text);
    assert.equal(me.body.data.password, undefined);
    assert.equal(me.body.data.token_version, undefined);
    assert.ok(me.body.data.email_verified_at);
  });
});

describe('POST /api/auth/refresh', () => {
  test('rotates: a new token pair, the old refresh token stops working', async () => {
    const first = await login(MEMBER);
    const res = await http('POST', '/api/auth/refresh', { body: { refresh_token: first.refresh_token } });
    assert.equal(res.status, 200, res.text);
    const second = res.body.data;
    assert.notEqual(second.refresh_token, first.refresh_token);
    assert.notEqual(second.token, first.token);
    assert.equal(jwt.decode(second.token).sid, jwt.decode(first.token).sid, 'same session');
    assert.equal((await http('GET', '/api/auth/me', { token: second.token })).status, 200);

    const third = await http('POST', '/api/auth/refresh', { body: { refresh_token: second.refresh_token } });
    assert.equal(third.status, 200, third.text);
  });

  test('reusing a rotated token revokes the whole session', async () => {
    const first = await login(MEMBER);
    const rotated = await http('POST', '/api/auth/refresh', { body: { refresh_token: first.refresh_token } });
    assert.equal(rotated.status, 200);
    const current = rotated.body.data;

    // the old token comes back (e.g. stolen): reuse detected
    const reuse = await http('POST', '/api/auth/refresh', { body: { refresh_token: first.refresh_token } });
    assert.equal(reuse.status, 401, reuse.text);
    assert.deepEqual(reuse.body, { status: false, message: 'Invalid refresh token' });

    // every token of the session is dead now, including the legitimate latest pair
    const latest = await http('POST', '/api/auth/refresh', { body: { refresh_token: current.refresh_token } });
    assert.equal(latest.status, 401);
    assert.equal((await http('GET', '/api/auth/me', { token: current.token })).status, 401);
    const rows = await DB('refresh_tokens').where('family', jwt.decode(current.token).sid);
    assert.ok(rows.every((row) => row.revoked_at != null));
    assert.ok(rows.some((row) => row.revoked_reason === 'reuse_detected'));

    // other sessions are not affected
    const other = await login(MEMBER);
    assert.equal((await http('GET', '/api/auth/me', { token: other.token })).status, 200);
  });

  test('two concurrent refreshes with the same token: at most one succeeds', async () => {
    const { refresh_token: token } = await login(MEMBER);
    const results = await Promise.all([1, 2].map(() => http('POST', '/api/auth/refresh', { body: { refresh_token: token } })));
    assert.ok(results.filter((r) => r.status === 200).length <= 1);
    assert.ok(results.some((r) => r.status === 401));
  });

  test('missing, unknown and expired refresh tokens', async () => {
    const missing = await http('POST', '/api/auth/refresh', { body: {} });
    assert.equal(missing.status, 422);
    assert.equal(missing.body.data.column, 'refresh_token');

    const numeric = await http('POST', '/api/auth/refresh', { body: { refresh_token: 123 } });
    assert.equal(numeric.status, 422);

    const unknown = await http('POST', '/api/auth/refresh', { body: { refresh_token: 'x'.repeat(43) } });
    assert.equal(unknown.status, 401);

    const { refresh_token: token, token: access } = await login(MEMBER);
    await DB('refresh_tokens').where('family', jwt.decode(access).sid).update({ expires_at: new Date(Date.now() - 1000) });
    const expired = await http('POST', '/api/auth/refresh', { body: { refresh_token: token } });
    assert.equal(expired.status, 401);
    assert.equal((await http('GET', '/api/auth/me', { token: access })).status, 401, 'an expired session ends its access tokens');
  });

  test('a soft-deleted user cannot refresh', async () => {
    const user = await register('deleted');
    await DB('users').where('email', user.email).update({ deleted_at: new Date() });
    const res = await http('POST', '/api/auth/refresh', { body: { refresh_token: user.data.refresh_token } });
    assert.equal(res.status, 401);
  });
});

describe('logout', () => {
  test('POST /api/auth/logout ends the current session only', async () => {
    const a = await login(MEMBER);
    const b = await login(MEMBER);

    const res = await http('POST', '/api/auth/logout', { token: a.token });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);

    assert.equal((await http('GET', '/api/auth/me', { token: a.token })).status, 401, 'access token revoked at once');
    assert.equal((await http('POST', '/api/auth/refresh', { body: { refresh_token: a.refresh_token } })).status, 401);
    assert.equal((await http('GET', '/api/auth/me', { token: b.token })).status, 200, 'other session untouched');
    assert.equal((await http('POST', '/api/auth/logout', { token: a.token })).status, 401);
  });

  test('POST /api/auth/logout-all ends every session and bumps the token version', async () => {
    const user = await register('logoutall');
    const a = user.data;
    const b = await login(user);

    const res = await http('POST', '/api/auth/logout-all', { token: b.token });
    assert.equal(res.status, 200, res.text);

    for (const session of [a, b]) {
      assert.equal((await http('GET', '/api/auth/me', { token: session.token })).status, 401);
      assert.equal((await http('POST', '/api/auth/refresh', { body: { refresh_token: session.refresh_token } })).status, 401);
    }
    const row = await DB('users').where('email', user.email).first();
    assert.equal(row.token_version, 1);

    const fresh = await login(user);
    assert.equal(jwt.decode(fresh.token).tv, 1);
    assert.equal((await http('GET', '/api/auth/me', { token: fresh.token })).status, 200);
  });

  test('logout routes need a token', async () => {
    assert.equal((await http('POST', '/api/auth/logout')).status, 401);
    assert.equal((await http('POST', '/api/auth/logout-all')).status, 401);
  });
});

describe('POST /api/auth/register', () => {
  test('creates an unverified user, signs them in and sends a verification email', async () => {
    const email = uniqueEmail('New.User');
    const sent = mailer.sent.length;
    const res = await http('POST', '/api/auth/register', {
      body: {
        first_name: 'New', last_name: 'User', email: `  ${email.toUpperCase()} `, password: 'correct horse battery',
      },
    });
    assert.equal(res.status, 201, res.text);
    const { user, token, refresh_token: refreshToken } = res.body.data;
    assert.equal(user.email, email.toLowerCase());
    assert.equal(user.email_verified_at, null);
    assert.equal(user.password, undefined);
    assert.equal(user.token_version, undefined);
    assert.ok(refreshToken);
    assert.equal((await http('GET', '/api/auth/me', { token })).status, 200);

    const row = await DB('users').where('email', email.toLowerCase()).first();
    assert.match(row.password, /^scrypt\$/);
    assert.equal(Number(row.is_admin), 0);

    const [mail] = await newMail(sent, email.toLowerCase());
    assert.ok(mail, 'verification email sent');
    assert.equal(mail.to, email.toLowerCase());
    assert.match(mail.subject, /Verify your email address/);
    assert.match(mail.text, /^Hello New,/);
    assert.match(mail.text, /https:\/\/app\.example\.test\/verify-email\?token=/);
    assert.match(mail.html, /<a href="https:\/\/app\.example\.test\/verify-email\?token=[A-Za-z0-9_-]+"/);
    assert.match(mail.html, /Hello New,/);
    const stored = await DB('user_tokens').where({ user_id: row.id, type: 'email_verification' });
    assert.equal(stored.length, 1);
    assert.notEqual(stored[0].token_hash, tokenFromMail(mail), 'only the hash is stored');
  });

  test('validates input', async () => {
    const missing = await http('POST', '/api/auth/register', { body: { email: uniqueEmail('a'), password: 'password1' } });
    assert.equal(missing.status, 422, missing.text);
    assert.equal(missing.body.data.column, 'first_name');

    const badEmail = await http('POST', '/api/auth/register', { body: { first_name: 'A', email: 'nope', password: 'password1' } });
    assert.equal(badEmail.status, 422);
    assert.equal(badEmail.body.data.column, 'email');

    const short = await http('POST', '/api/auth/register', { body: { first_name: 'A', email: uniqueEmail('a'), password: 'short' } });
    assert.equal(short.status, 422);
    assert.equal(short.body.data.column, 'password');

    const numeric = await http('POST', '/api/auth/register', { body: { first_name: 'A', email: uniqueEmail('a'), password: 12345678 } });
    assert.equal(numeric.status, 422, 'a non-string password is never stored');
    assert.equal(numeric.body.data.column, 'password');
  });

  test('rejects an email address that is already registered (any case)', async () => {
    const res = await http('POST', '/api/auth/register', { body: { first_name: 'A', email: 'DEMO@averoa.test', password: 'password1' } });
    assert.equal(res.status, 422, res.text);
    assert.equal(res.body.data.column, 'email');
  });

  test('ignores privileged fields (no mass assignment)', async () => {
    const email = uniqueEmail('sneaky');
    const res = await http('POST', '/api/auth/register', {
      body: {
        first_name: 'S', email, password: 'password1', is_admin: true, email_verified_at: '2020-01-01', token_version: 9, id: 999,
      },
    });
    assert.equal(res.status, 201, res.text);
    const row = await DB('users').where('email', email).first();
    assert.equal(Number(row.is_admin), 0);
    assert.equal(row.email_verified_at, null);
    assert.equal(row.token_version, 0);
    assert.notEqual(row.id, 999);
  });
});

describe('email verification', () => {
  test('GET /api/auth/verify-email verifies once', async () => {
    const user = await register('verify');
    const token = tokenFromMail(user.mail);

    const res = await http('GET', `/api/auth/verify-email?token=${token}`);
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);
    const row = await DB('users').where('email', user.email).first();
    assert.ok(row.email_verified_at);

    const again = await http('GET', `/api/auth/verify-email?token=${token}`);
    assert.equal(again.status, 400, 'single use');
  });

  test('POST /api/auth/verify-email works too', async () => {
    const user = await register('verifypost');
    const res = await http('POST', '/api/auth/verify-email', { body: { token: tokenFromMail(user.mail) } });
    assert.equal(res.status, 200, res.text);
  });

  test('invalid, missing, expired and outdated tokens', async () => {
    assert.equal((await http('GET', '/api/auth/verify-email?token=nope-nope-nope-nope')).status, 400);
    assert.equal((await http('GET', '/api/auth/verify-email')).status, 422);
    assert.equal((await http('POST', '/api/auth/verify-email', { body: { token: ['x'] } })).status, 422);

    const expired = await register('verifyexpired');
    const row = await DB('users').where('email', expired.email).first();
    await DB('user_tokens').where({ user_id: row.id }).update({ expires_at: new Date(Date.now() - 1000) });
    assert.equal((await http('GET', `/api/auth/verify-email?token=${tokenFromMail(expired.mail)}`)).status, 400);

    // the address changed after the link was sent: the link no longer proves anything
    const changed = await register('verifychanged');
    await DB('users').where('email', changed.email).update({ email: uniqueEmail('other') });
    assert.equal((await http('GET', `/api/auth/verify-email?token=${tokenFromMail(changed.mail)}`)).status, 400);
  });

  test('EnsureEmailVerified blocks unverified users until they verify', async () => {
    const user = await register('teacherwriter');
    const body = { teacher_name: 'Grace', type: 1 };

    const blocked = await http('POST', '/api/teachers', { token: user.data.token, body });
    assert.equal(blocked.status, 403, blocked.text);
    assert.deepEqual(blocked.body, { status: false, message: 'Your email address is not verified.', code: 'EMAIL_NOT_VERIFIED' });

    assert.equal((await http('GET', `/api/auth/verify-email?token=${tokenFromMail(user.mail)}`)).status, 200);
    const allowed = await http('POST', '/api/teachers', { token: user.data.token, body });
    assert.equal(allowed.status, 201, allowed.text);
  });

  test('POST /api/auth/resend-verification is throttled and replaces the previous link', async () => {
    const user = await register('resend');
    const { token } = user.data;

    const tooSoon = await http('POST', '/api/auth/resend-verification', { token });
    assert.equal(tooSoon.status, 429, tooSoon.text);
    assert.ok(tooSoon.body.retry_after > 0 && tooSoon.body.retry_after <= 60);

    // pretend the first link is two minutes old
    const row = await DB('users').where('email', user.email).first();
    await DB('user_tokens').where({ user_id: row.id }).update({ created_at: new Date(Date.now() - 120000) });

    const sent = mailer.sent.length;
    const res = await http('POST', '/api/auth/resend-verification', { token });
    assert.equal(res.status, 200, res.text);
    const [mail] = await newMail(sent, user.email);
    assert.ok(mail);

    assert.equal((await http('GET', `/api/auth/verify-email?token=${tokenFromMail(user.mail)}`)).status, 400, 'old link replaced');
    assert.equal((await http('GET', `/api/auth/verify-email?token=${tokenFromMail(mail)}`)).status, 200);

    const verified = await http('POST', '/api/auth/resend-verification', { token });
    assert.equal(verified.status, 200);
    assert.match(verified.body.message, /already verified/);
  });

  test('the Retry-After header is set on 429', async () => {
    const user = await register('retryafter');
    const res = await fetch(`${app.url}/api/auth/resend-verification`, {
      method: 'POST', headers: { authorization: `Bearer ${user.data.token}` },
    });
    assert.equal(res.status, 429);
    assert.match(res.headers.get('retry-after'), /^\d+$/);
  });

  test('resend needs a token', async () => {
    assert.equal((await http('POST', '/api/auth/resend-verification')).status, 401);
  });
});

describe('password reset', () => {
  let user;

  beforeEach(async () => {
    user = await register('reset');
  });

  /** Requests a reset link; resolves the token from the mail. */
  async function requestReset(email) {
    const sent = mailer.sent.length;
    const res = await http('POST', '/api/auth/forgot-password', { body: { email } });
    assert.equal(res.status, 200, res.text);
    const mails = await newMail(sent, email);
    assert.equal(mails.length, 1, 'one reset email');
    assert.match(mails[0].subject, /Reset your password/);
    assert.match(mails[0].text, /https:\/\/app\.example\.test\/reset-password\?token=/);
    return tokenFromMail(mails[0]);
  }

  test('forgot-password answers the same for known and unknown addresses', async () => {
    const sent = mailer.sent.length;
    const known = await http('POST', '/api/auth/forgot-password', { body: { email: user.email } });
    const unknown = await http('POST', '/api/auth/forgot-password', { body: { email: uniqueEmail('nobody') } });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.deepEqual(known.body, unknown.body);
    assert.equal(known.text, unknown.text);

    const mails = (await newMail(sent)).filter((mail) => /Reset your password/.test(mail.subject));
    assert.equal(mails.length, 1, 'only the known address gets a mail');
    assert.equal(mails[0].to, user.email);
  });

  test('forgot-password validates the address format only', async () => {
    assert.equal((await http('POST', '/api/auth/forgot-password', { body: {} })).status, 422);
    assert.equal((await http('POST', '/api/auth/forgot-password', { body: { email: 'not-an-email' } })).status, 422);
    assert.equal((await http('POST', '/api/auth/forgot-password', { body: { email: { $ne: 1 } } })).status, 422);
  });

  test('a second request within the throttle window sends nothing (same answer)', async () => {
    await requestReset(user.email);
    const sent = mailer.sent.length;
    const res = await http('POST', '/api/auth/forgot-password', { body: { email: user.email } });
    assert.equal(res.status, 200);
    assert.equal((await newMail(sent, user.email)).length, 0);
  });

  test('reset-password sets the password and signs the user out everywhere', async () => {
    const session = user.data;
    const token = await requestReset(user.email);

    const res = await http('POST', '/api/auth/reset-password', { body: { token, password: 'a brand new password' } });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);

    assert.equal((await http('GET', '/api/auth/me', { token: session.token })).status, 401, 'access token invalidated');
    assert.equal((await http('POST', '/api/auth/refresh', { body: { refresh_token: session.refresh_token } })).status, 401);

    const old = await http('POST', '/api/auth/login', { body: { email: user.email, password: user.password } });
    assert.equal(old.status, 401);
    await login({ email: user.email, password: 'a brand new password' });

    const again = await http('POST', '/api/auth/reset-password', { body: { token, password: 'yet another password' } });
    assert.equal(again.status, 400, 'single use');
  });

  test('a newer link replaces the previous one', async () => {
    const first = await requestReset(user.email);
    const row = await DB('users').where('email', user.email).first();
    await DB('user_tokens').where({ user_id: row.id, type: 'password_reset' }).update({ created_at: new Date(Date.now() - 120000) });
    const second = await requestReset(user.email);

    assert.equal((await http('POST', '/api/auth/reset-password', { body: { token: first, password: 'password-one' } })).status, 400);
    assert.equal((await http('POST', '/api/auth/reset-password', { body: { token: second, password: 'password-two' } })).status, 200);
  });

  test('invalid, expired and malformed requests', async () => {
    const token = await requestReset(user.email);

    const short = await http('POST', '/api/auth/reset-password', { body: { token, password: 'short' } });
    assert.equal(short.status, 422);
    assert.equal(short.body.data.column, 'password');
    assert.equal((await http('POST', '/api/auth/reset-password', { body: { password: 'long enough' } })).status, 422);
    assert.equal((await http('POST', '/api/auth/reset-password', { body: { token } })).status, 422);
    assert.equal((await http('POST', '/api/auth/reset-password', { body: { token: 'x'.repeat(43), password: 'long enough' } })).status, 400);

    const row = await DB('users').where('email', user.email).first();
    await DB('user_tokens').where({ user_id: row.id, type: 'password_reset' }).update({ expires_at: new Date(Date.now() - 1000) });
    const expired = await http('POST', '/api/auth/reset-password', { body: { token, password: 'long enough' } });
    assert.equal(expired.status, 400);
    assert.equal(expired.body.status, false);
  });

  test('a verification token cannot reset a password', async () => {
    const res = await http('POST', '/api/auth/reset-password', { body: { token: tokenFromMail(user.mail), password: 'long enough' } });
    assert.equal(res.status, 400);
  });
});

describe('authorization: Gate and TeacherPolicy', () => {
  let member;
  let memberId;
  let foreignTeacher;

  before(async () => {
    member = await login(MEMBER);
    memberId = (await DB('users').where('email', MEMBER.email).first()).id;
    foreignTeacher = await DB('teacher').whereNull('deleted_at').whereNot('user_id', memberId).first();
  });

  test('a member cannot update or delete a teacher owned by someone else (403)', async () => {
    const update = await http('PUT', `/api/teachers/${foreignTeacher.id}`, { token: member.token, body: { teacher_name: 'Mallory' } });
    assert.equal(update.status, 403, update.text);
    assert.deepEqual(update.body, { status: false, message: 'This action is unauthorized.' });

    const remove = await http('DELETE', `/api/teachers/${foreignTeacher.id}`, { token: member.token });
    assert.equal(remove.status, 403, remove.text);

    const row = await DB('teacher').where('id', foreignTeacher.id).first();
    assert.equal(row.teacher_name, foreignTeacher.teacher_name);
    assert.equal(row.deleted_at, null);
  });

  test('the authorization check runs before validation', async () => {
    const res = await http('PUT', `/api/teachers/${foreignTeacher.id}`, { token: member.token, body: { type: 99 } });
    assert.equal(res.status, 403, res.text);
  });

  test('unknown or malformed ids answer 404, missing tokens 401', async () => {
    assert.equal((await http('PUT', '/api/teachers/987654', { token: member.token, body: { teacher_name: 'X' } })).status, 404);
    assert.equal((await http('DELETE', '/api/teachers/abc', { token: member.token })).status, 404);
    assert.equal((await http('DELETE', `/api/teachers/${foreignTeacher.id}`)).status, 401);
  });

  test('a member owns what they create and may change only that', async () => {
    const created = await http('POST', '/api/teachers', { token: member.token, body: { teacher_name: 'Own', type: 1, user_id: 1 } });
    assert.equal(created.status, 201, created.text);
    const { id } = created.body.data;
    assert.equal((await DB('teacher').where('id', id).first()).user_id, memberId, 'user_id is forced to the creator');

    const update = await http('PUT', `/api/teachers/${id}`, { token: member.token, body: { teacher_name: 'Own 2', user_id: 1 } });
    assert.equal(update.status, 200, update.text);
    const row = await DB('teacher').where('id', id).first();
    assert.equal(row.teacher_name, 'Own 2');
    assert.equal(row.user_id, memberId, 'a member cannot give the teacher away');

    const remove = await http('DELETE', `/api/teachers/${id}`, { token: member.token });
    assert.equal(remove.status, 200, remove.text);
  });

  test('an admin may change any teacher and its owner', async () => {
    const admin = await login(DEMO);
    const res = await http('PUT', `/api/teachers/${foreignTeacher.id}`, { token: admin.token, body: { user_id: memberId } });
    assert.equal(res.status, 200, res.text);
    assert.equal((await DB('teacher').where('id', foreignTeacher.id).first()).user_id, memberId);
  });

  test('Gate checks with model instances', async () => {
    const memberUser = await Users.query().findOne({ email: MEMBER.email });
    const adminUser = await Users.query().findOne({ email: DEMO.email });
    const own = await Teacher.query().findOne({ user_id: memberUser.id });
    const other = await Teacher.query().whereNot('user_id', memberUser.id).first();

    assert.equal(await Gate.allows(memberUser, 'update', own), true);
    assert.equal(await Gate.allows(memberUser, 'update', other), false);
    assert.equal(await Gate.allows(memberUser, 'changeOwner', Teacher), false);
    assert.equal(await Gate.allows(adminUser, 'delete', other), true);
    assert.equal(await Gate.allows(adminUser, 'admin'), true);
    assert.equal(await Gate.allows(memberUser, 'admin'), false);
    assert.equal(await Gate.allows(null, 'update', own), false);
    await assert.rejects(Gate.authorize(memberUser, 'delete', other), (err) => err.statusCode === 403);
  });
});

describe('rate limits on the public auth endpoints', () => {
  const limits = {};

  before(() => {
    limits.strict = AuthRateLimit.strict.limit;
    limits.failures = AuthRateLimit.failures.limit;
    AuthRateLimit.strict.limit = 3;
    AuthRateLimit.failures.limit = 2;
  });

  beforeEach(() => AuthRateLimit.reset());

  after(() => {
    AuthRateLimit.strict.limit = limits.strict;
    AuthRateLimit.failures.limit = limits.failures;
    AuthRateLimit.reset();
  });

  test('forgot-password: every request counts, then 429 with Retry-After', async () => {
    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push((await http('POST', '/api/auth/forgot-password', { body: { email: uniqueEmail('limit') } })).status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 429]);

    const res = await fetch(`${app.url}/api/auth/forgot-password`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: uniqueEmail('limit') }),
    });
    assert.equal(res.status, 429);
    assert.match(res.headers.get('retry-after'), /^\d+$/);
    const body = await res.json();
    assert.equal(body.status, false);
    assert.equal(body.message, 'Too many requests, please try again later.');
  });

  test('case and trailing-slash variants of a path share its budget', async () => {
    const statuses = [];
    for (const url of ['/api/auth/forgot-password', '/api/auth/Forgot-password', '/api/auth/forgot-password/', '/api/Auth/FORGOT-PASSWORD']) {
      statuses.push((await http('POST', url, { body: { email: uniqueEmail('limit') } })).status);
    }
    assert.deepEqual(statuses, [200, 200, 200, 429]);
  });

  test('endpoints have separate budgets', async () => {
    for (let i = 0; i < 3; i += 1) {
      await http('POST', '/api/auth/forgot-password', { body: { email: uniqueEmail('limit') } });
    }
    assert.equal((await http('POST', '/api/auth/forgot-password', { body: { email: uniqueEmail('limit') } })).status, 429);
    const res = await http('POST', '/api/auth/register', { body: { first_name: 'L', email: uniqueEmail('limit'), password: 'password1' } });
    assert.equal(res.status, 201, res.text);
  });

  test('refresh: only failures count, successful refreshes never do', async () => {
    let { refresh_token: token } = await login(MEMBER);
    for (let i = 0; i < 5; i += 1) {
      const res = await http('POST', '/api/auth/refresh', { body: { refresh_token: token } });
      assert.equal(res.status, 200, res.text);
      token = res.body.data.refresh_token;
    }

    const bad = { refresh_token: 'x'.repeat(43) };
    assert.equal((await http('POST', '/api/auth/refresh', { body: bad })).status, 401);
    assert.equal((await http('POST', '/api/auth/refresh', { body: bad })).status, 401);
    assert.equal((await http('POST', '/api/auth/refresh', { body: bad })).status, 429);
    assert.equal((await http('POST', '/api/auth/refresh', { body: { refresh_token: token } })).status, 429, 'blocked for this IP until the window ends');
  });

  test('reset-password and verify-email: token guessing is limited', async () => {
    const body = { token: 'y'.repeat(43), password: 'long enough' };
    assert.equal((await http('POST', '/api/auth/reset-password', { body })).status, 400);
    assert.equal((await http('POST', '/api/auth/reset-password', { body })).status, 400);
    assert.equal((await http('POST', '/api/auth/reset-password', { body })).status, 429);

    assert.equal((await http('GET', '/api/auth/verify-email?token=zzzzzzzzzzzzzzzzzzzz')).status, 400);
    assert.equal((await http('GET', '/api/auth/verify-email?token=zzzzzzzzzzzzzzzzzzzz')).status, 400);
    assert.equal((await http('GET', '/api/auth/verify-email?token=zzzzzzzzzzzzzzzzzzzz')).status, 429);
  });
});
