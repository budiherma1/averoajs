// The dashboard pages over HTTP: session login with CSRF, the overview, the
// admin-only users list, the profile and password forms, logout.
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { testApp } from '@averoa/core/testing.js';
import { setTestEnv } from './helpers.js';

setTestEnv({ RATE_LIMIT_ENABLED: 'false', LOGIN_RATE_LIMIT_MAX: '1000', LOGIN_RATE_LIMIT_IP_MAX: '1000' });

const DEMO = { email: 'demo@averoa.test', password: 'password' }; // admin
const MEMBER = { email: 'member@averoa.test', password: 'password' }; // not an admin

let app;

before(async () => {
  app = await testApp();
});

after(() => app?.close());

/** A browser: keeps cookies and does not follow redirects. */
function browser() {
  const jar = new Map();
  return async (method, url, form) => {
    const headers = {};
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(new URL(url, app.url), {
      method, headers, body: form ? new URLSearchParams(form) : undefined, redirect: 'manual', signal: AbortSignal.timeout(5000),
    });
    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const eq = pair.indexOf('=');
      jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
    return { status: res.status, location: res.headers.get('location'), text: await res.text() };
  };
}

const csrfOf = (html) => {
  const match = /name="_csrf" value="([^"]+)"/.exec(html);
  assert.ok(match, 'the page has a CSRF field');
  return match[1];
};

/** A browser signed in as `credentials`. */
async function signedIn(credentials) {
  const page = browser();
  const form = await page('GET', '/login');
  assert.equal(form.status, 200, form.text);
  const res = await page('POST', '/login', { ...credentials, _csrf: csrfOf(form.text) });
  assert.equal(res.status, 302, res.text);
  assert.equal(res.location, '/dashboard');
  return page;
}

describe('dashboard', () => {
  test('guests are sent to the login page', async () => {
    const page = browser();
    assert.equal((await page('GET', '/')).location, '/login');
    for (const url of ['/dashboard', '/dashboard/users', '/dashboard/profile']) {
      const res = await page('GET', url);
      assert.equal(res.status, 302, url);
      assert.equal(res.location, '/login', url);
    }
  });

  test('a wrong password shows the form again with 422; a POST without the CSRF token is refused', async () => {
    const page = browser();
    const form = await page('GET', '/login');
    const wrong = await page('POST', '/login', { ...DEMO, password: 'nope', _csrf: csrfOf(form.text) });
    assert.equal(wrong.status, 422);
    assert.match(wrong.text, /Invalid email or password\./);
    assert.match(wrong.text, /value="demo@averoa\.test"/, 'the email is kept');

    const forged = await page('POST', '/login', DEMO);
    assert.equal(forged.status, 403);
  });

  test('an admin sees the numbers and the users list', async () => {
    const page = await signedIn(DEMO);
    assert.equal((await page('GET', '/login')).location, '/dashboard', 'signed-in users skip the login page');
    const home = await page('GET', '/dashboard');
    assert.equal(home.status, 200, home.text);
    assert.match(home.text, /Verified emails/);
    assert.match(home.text, /href="\/dashboard\/users"/);

    const users = await page('GET', '/dashboard/users?q=MEMBER@');
    assert.equal(users.status, 200, users.text);
    assert.match(users.text, /member@averoa\.test/);
    assert.doesNotMatch(users.text, /demo@averoa\.test<\/td>/);
    assert.match(users.text, /1 user\(s\)/);

    const wildcard = await page('GET', '/dashboard/users?q=%25');
    assert.match(wildcard.text, /0 user\(s\)/, '% is searched for literally');
  });

  test('a member gets the welcome page and 403 on the users list', async () => {
    const page = await signedIn(MEMBER);
    const home = await page('GET', '/dashboard');
    assert.match(home.text, /Welcome, Member!/);
    assert.doesNotMatch(home.text, /href="\/dashboard\/users"/);
    const users = await page('GET', '/dashboard/users');
    assert.equal(users.status, 403);
    assert.match(users.text, /This page is for administrators\./);
  });

  test('profile: names are validated and saved', async () => {
    const page = await signedIn(MEMBER);
    const form = await page('GET', '/dashboard/profile');
    const csrf = csrfOf(form.text);

    const invalid = await page('POST', '/dashboard/profile', { first_name: '', last_name: 'X', _csrf: csrf });
    assert.equal(invalid.status, 422);
    assert.match(invalid.text, /is-invalid/);

    const saved = await page('POST', '/dashboard/profile', { first_name: 'Mia', last_name: 'Member', _csrf: csrf });
    assert.equal(saved.location, '/dashboard/profile?status=saved');
    const reloaded = await page('GET', saved.location);
    assert.match(reloaded.text, /Your profile was saved\./);
    assert.match(reloaded.text, /value="Mia"/);
    assert.equal((await app.DB('users').where('email', MEMBER.email).first()).first_name, 'Mia');
  });

  test('password: needs the current one and a valid, confirmed new one; API tokens stop working', async () => {
    const api = await app.http('POST', '/api/auth/login', { body: DEMO });
    assert.equal(api.status, 200, api.text);

    const page = await signedIn(DEMO);
    const csrf = csrfOf((await page('GET', '/dashboard/profile')).text);
    const change = (fields) => page('POST', '/dashboard/password', { _csrf: csrf, ...fields });

    assert.match((await change({ current_password: 'wrong', new_password: 'new password 1', new_password_confirmation: 'new password 1' })).text, /Current password is not correct/);
    assert.match((await change({ current_password: 'password', new_password: 'short', new_password_confirmation: 'short' })).text, /must be 8-128 characters/);
    assert.match((await change({ current_password: 'password', new_password: 'new password 1', new_password_confirmation: 'other' })).text, /does not match/);

    const ok = await change({ current_password: 'password', new_password: 'new password 1', new_password_confirmation: 'new password 1' });
    assert.equal(ok.location, '/dashboard/profile?status=password');
    assert.equal((await page('GET', '/dashboard')).status, 200, 'this session stays signed in');
    assert.equal((await app.http('GET', '/api/auth/me', { token: api.body.data.token })).status, 401, 'old API token revoked');
    assert.equal((await app.http('POST', '/api/auth/refresh', { body: { refresh_token: api.body.data.refresh_token } })).status, 401);
    await signedIn({ email: DEMO.email, password: 'new password 1' });
  });

  test('logout ends the session', async () => {
    const page = await signedIn(MEMBER);
    const csrf = csrfOf((await page('GET', '/dashboard')).text);
    const out = await page('POST', '/logout', { _csrf: csrf });
    assert.equal(out.location, '/login');
    assert.equal((await page('GET', '/dashboard')).location, '/login');
  });
});
