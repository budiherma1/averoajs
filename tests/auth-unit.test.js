// Unit tests of the authentication helpers (no database, no HTTP).
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { setTestEnv } from './helpers.js';

setTestEnv();

let TokenHelper;
let EnsureEmailVerified;

before(async () => {
  ({ TokenHelper } = await import('#helpers'));
  ({ default: EnsureEmailVerified } = await import('#app/Middleware/EnsureEmailVerified.js'));
});

describe('TokenHelper', () => {
  test('random tokens are URL-safe and unique', () => {
    const a = TokenHelper.random();
    assert.match(a, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(a, TokenHelper.random());
    assert.equal(TokenHelper.random(16).length, 22);
  });

  test('hash is a stable hex SHA-256', () => {
    assert.equal(TokenHelper.hash('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(TokenHelper.hash('abc'), TokenHelper.hash('abc'));
  });

  test('looksValid guards the input type and length', () => {
    assert.equal(TokenHelper.looksValid(TokenHelper.random()), true);
    assert.equal(TokenHelper.looksValid('short'), false);
    assert.equal(TokenHelper.looksValid(['x'.repeat(43)]), false);
    assert.equal(TokenHelper.looksValid('x'.repeat(513)), false);
  });

  test('parseDuration accepts seconds and s/m/h/d/w units', () => {
    assert.equal(TokenHelper.parseDuration(900), 900);
    assert.equal(TokenHelper.parseDuration('900'), 900);
    assert.equal(TokenHelper.parseDuration('45s'), 45);
    assert.equal(TokenHelper.parseDuration('15m'), 900);
    assert.equal(TokenHelper.parseDuration('2h'), 7200);
    assert.equal(TokenHelper.parseDuration('30d'), 2592000);
    assert.equal(TokenHelper.parseDuration('1w'), 604800);
    assert.equal(TokenHelper.parseDuration(' 7D '), 604800);
  });

  test('parseDuration rejects anything else with the setting name', () => {
    for (const bad of ['', '0', '-5m', '1.5h', '2 days', 'abc', undefined, null]) {
      assert.throws(() => TokenHelper.parseDuration(bad, 'JWT_ACCESS_TTL'), /JWT_ACCESS_TTL/, String(bad));
    }
  });
});

describe('EnsureEmailVerified', () => {
  const run = (user) => {
    const res = {
      statusCode: 200,
      body: undefined,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    let nextCalled = false;
    EnsureEmailVerified.handle({ user }, res, () => { nextCalled = true; });
    return { res, nextCalled };
  };

  test('401 without a user, 403 when unverified, next() when verified', () => {
    assert.equal(run(undefined).res.statusCode, 401);
    const unverified = run({ id: 1, email_verified_at: null });
    assert.equal(unverified.res.statusCode, 403);
    assert.equal(unverified.res.body.code, 'EMAIL_NOT_VERIFIED');
    assert.equal(unverified.nextCalled, false);
    assert.equal(run({ id: 1, email_verified_at: new Date() }).nextCalled, true);
  });
});
