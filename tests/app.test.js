// Integration tests: the real app (routes, controllers, models, migrations, seeds),
// started by testApp() from @averoa/core/testing, with an in-memory better-sqlite3
// database (or MySQL / PostgreSQL through AVEROA_TEST_DB_URL, see tests/helpers.js).
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { testApp } from '@averoa/core/testing.js';
import { setTestEnv } from './helpers.js';

setTestEnv();

const DEMO = { email: 'demo@averoa.test', password: 'password' };

let app;
let DB;
let http;

// migrated and seeded; a real server (AVEROA_TEST_DB_URL) is rolled back first
before(async () => {
  app = await testApp();
  ({ DB, http } = app);
});

after(() => app?.close());

describe('web and API basics', () => {
  test('GET / renders the welcome view', async () => {
    const res = await http('GET', '/');
    assert.equal(res.status, 200, res.text);
    assert.match(res.text, /<html/i);
  });

  test('web routes are CSRF protected, /api routes are not', async () => {
    const web = await http('POST', '/', { body: {} });
    assert.equal(web.status, 403, web.text);

    const api = await http('POST', '/api/auth/login', { body: {} });
    assert.notEqual(api.status, 403, api.text);
    assert.equal(api.status, 422, api.text);
  });

});

describe('JWT auth', () => {
  test('protected route answers 401 without a token (and does not hang)', async () => {
    const res = await http('GET', '/api/auth/me');
    assert.equal(res.status, 401, res.text);
    assert.equal(res.body.status, false);
  });

  test('protected route answers 401 with a forged token', async () => {
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.c2lnbmF0dXJlLWZyb20tYW5vdGhlci1zZWNyZXQ';
    const res = await http('GET', '/api/auth/me', { token: forged });
    assert.equal(res.status, 401, res.text);
  });

  test('login validates input and rejects wrong credentials', async () => {
    const missing = await http('POST', '/api/auth/login', { body: { email: DEMO.email } });
    assert.equal(missing.status, 422, missing.text);
    assert.equal(missing.body.data.column, 'password');

    const wrong = await http('POST', '/api/auth/login', { body: { email: DEMO.email, password: 'wrong-password' } });
    assert.equal(wrong.status, 401, wrong.text);

    const unknown = await http('POST', '/api/auth/login', { body: { email: 'nobody@averoa.test', password: 'password' } });
    assert.equal(unknown.status, 401, unknown.text);
  });

  test('login issues a JWT that opens the protected route', async () => {
    const login = await http('POST', '/api/auth/login', { body: DEMO });
    assert.equal(login.status, 200, login.text);
    assert.equal(login.body.data.type, 'Bearer');
    const { token } = login.body.data;
    assert.ok(token);

    const me = await http('GET', '/api/auth/me', { token });
    assert.equal(me.status, 200, me.text);
    assert.equal(me.body.data.email, DEMO.email);
    assert.equal(me.body.data.password, undefined, 'password hash must never be serialized');
  });

  test('passwords are stored as scrypt hashes', async () => {
    const row = await DB('users').where('email', DEMO.email).first();
    assert.match(row.password, /^scrypt\$/);
  });
});
