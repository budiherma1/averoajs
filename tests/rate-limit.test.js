// Rate limiting: the global /api limiter from @averoa/core and the login
// brute-force limiter (LoginRateLimitMiddleware). TRUST_PROXY=1 lets each test
// act as its own client IP through X-Forwarded-For.
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { APP_ROOT, setTestEnv, client } from './helpers.js';

setTestEnv({
  TRUST_PROXY: '1',
  LOGIN_RATE_LIMIT_MAX: '5',
  LOGIN_RATE_LIMIT_IP_MAX: '8',
  LOGIN_RATE_LIMIT_WINDOW_MS: '900000',
});

const DEMO = { email: 'demo@averoa.test', password: 'password' };

let server;
let DB;
let http;

before(async () => {
  const { createApp } = await import('@averoa/core');
  ({ DB } = await import('@averoa/utilities'));
  const { app } = await createApp();
  await DB.migrate.latest({ directory: path.join(APP_ROOT, 'database/migrations'), loadExtensions: ['.js'] });
  await DB.seed.run({ directory: path.join(APP_ROOT, 'database/seeds'), loadExtensions: ['.js'] });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  http = client(`http://127.0.0.1:${server.address().port}`);
});

after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => { server.close(resolve); });
  }
  await DB?.destroy();
  const utilities = await import('@averoa/utilities');
  await utilities.closeQueue?.();
  // the shared Redis client (SESSION_STORE / RATE_LIMIT_STORE=redis) keeps the process alive
  const core = await import('@averoa/core');
  await core.closeRedis?.();
});

/** POST /api/auth/login from client `ip`; returns { status, body, headers }. */
async function login(ip, credentials) {
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(credentials),
    signal: AbortSignal.timeout(5000),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = undefined; }
  return { status: res.status, body, headers: res.headers };
}

describe('login brute-force protection', () => {
  test('429 after 5 failed attempts for the same IP and email, even with the right password', async () => {
    const ip = '198.51.100.1';
    for (let i = 0; i < 5; i += 1) {
      const res = await login(ip, { email: DEMO.email, password: `wrong-${i}` });
      assert.equal(res.status, 401, `attempt ${i + 1}`);
    }
    const limited = await login(ip, { email: DEMO.email, password: 'wrong-again' });
    assert.equal(limited.status, 429);
    assert.match(limited.headers.get('content-type'), /application\/json/);
    assert.ok(Number(limited.headers.get('retry-after')) > 0, 'Retry-After is set');
    assert.equal(limited.body.status, false);
    assert.equal(limited.body.message, 'Too many login attempts, please try again later.');
    assert.equal(limited.body.code, 'ERATELIMIT');
    assert.equal(limited.body.data, undefined, 'no token');

    const blocked = await login(ip, DEMO);
    assert.equal(blocked.status, 429, 'the right password does not help while blocked');
  });

  test('the counter is per IP and email: another account or another IP is not blocked', async () => {
    const ip = '198.51.100.2';
    for (let i = 0; i < 6; i += 1) await login(ip, { email: 'victim@averoa.test', password: 'guess' });
    assert.equal((await login(ip, { email: 'victim@averoa.test', password: 'guess' })).status, 429);

    // same IP, the real user's own account
    assert.equal((await login(ip, DEMO)).status, 200);
    // the same email from another IP
    assert.equal((await login('198.51.100.3', { email: 'victim@averoa.test', password: 'guess' })).status, 401);
  });

  test('email case and surrounding spaces do not reset the counter', async () => {
    const ip = '198.51.100.4';
    const variants = ['case@averoa.test', 'CASE@averoa.test', ' Case@Averoa.test ', 'case@AVEROA.TEST', 'case@averoa.test'];
    for (const email of variants) assert.equal((await login(ip, { email, password: 'x' })).status, 401);
    assert.equal((await login(ip, { email: 'Case@averoa.test', password: 'x' })).status, 429);
  });

  test('successful logins are not counted', async () => {
    const ip = '198.51.100.5';
    for (let i = 0; i < 4; i += 1) assert.equal((await login(ip, { email: DEMO.email, password: 'nope' })).status, 401);
    for (let i = 0; i < 5; i += 1) assert.equal((await login(ip, DEMO)).status, 200, `success ${i + 1}`);
    assert.equal((await login(ip, { email: DEMO.email, password: 'nope' })).status, 401, '5th failure');
    assert.equal((await login(ip, { email: DEMO.email, password: 'nope' })).status, 429, '6th failure');
  });

  test('one IP cannot try many accounts (LOGIN_RATE_LIMIT_IP_MAX failures per IP)', async () => {
    const ip = '198.51.100.6';
    for (let i = 0; i < 8; i += 1) {
      assert.equal((await login(ip, { email: `user${i}@averoa.test`, password: 'x' })).status, 401, `account ${i}`);
    }
    const limited = await login(ip, { email: 'user99@averoa.test', password: 'x' });
    assert.equal(limited.status, 429);
    assert.equal(limited.body.code, 'ERATELIMIT');
  });
});

describe('global API limiter', () => {
  test('API responses carry the standard RateLimit headers', async () => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api`, { headers: { 'x-forwarded-for': '198.51.100.7' } });
    assert.equal(res.status, 200);
    assert.match(res.headers.get('ratelimit-policy'), /q=100; w=60/);
    assert.match(res.headers.get('ratelimit'), /r=99/);
  });

  test('web pages are not limited by the API limiter', async () => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('ratelimit'), null);
    assert.equal((await http('GET', '/')).status, 200);
  });
});
