// Integration tests: the real app (routes, controllers, models, migrations, seeds)
// on top of @averoa/core's createApp(), with an in-memory better-sqlite3 database.
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import path from 'node:path';
import { APP_ROOT, setTestEnv, client } from './helpers.js';

setTestEnv();

const DEMO = { email: 'demo@averoa.test', password: 'password' };

let server;
let DB;
let http;

/** POST /api/auth/login as the seeded demo user; returns the JWT. */
async function loginToken() {
  const res = await http('POST', '/api/auth/login', { body: DEMO });
  assert.equal(res.status, 200, res.text);
  return res.body.data.token;
}

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
});

describe('sample routes', () => {
  test('GET /api answers JSON', async () => {
    const res = await http('GET', '/api');
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Averoa');
  });

  test('GET / renders the welcome view', async () => {
    const res = await http('GET', '/');
    assert.equal(res.status, 200, res.text);
    assert.match(res.text, /<html/i);
  });

  test('web routes are CSRF protected, /api routes are not', async () => {
    const web = await http('POST', '/teacher', { body: {} });
    assert.equal(web.status, 403, web.text);

    const api = await http('POST', '/api/auth/login', { body: {} });
    assert.notEqual(api.status, 403, api.text);
    assert.equal(api.status, 422, api.text);
  });

  test('GET /users renders first names only, no emails or addresses', async () => {
    const res = await http('GET', '/users');
    assert.equal(res.status, 200, res.text);
    assert.match(res.text, /<li>Demo<\/li>/);
    assert.doesNotMatch(res.text, /@/);
  });

  test('GET /api/v2/teachers lists seeded teachers', async () => {
    const res = await http('GET', '/api/v2/teachers');
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);
    assert.ok(res.body.data.length > 0);
  });

  test('POST /api/users needs a JWT', async () => {
    const res = await http('POST', '/api/users', { body: { first_name: 'A', email: 'a@example.com', password: 'password' } });
    assert.equal(res.status, 401, res.text);
    assert.equal(res.body.status, false);
    assert.equal(res.body.data, undefined, 'no user data without a token');
  });

  test('POST /api/users validates the body and never returns password hashes', async () => {
    const token = await loginToken();
    const invalid = await http('POST', '/api/users', { token, body: { first_name: 'A', email: 'not-an-email', password: 'password' } });
    assert.equal(invalid.status, 422, invalid.text);
    assert.equal(invalid.body.data.column, 'email');

    const ok = await http('POST', '/api/users', { token, body: { first_name: 'A', email: 'a@example.com', password: 'password' } });
    assert.equal(ok.status, 200, ok.text);
    assert.ok(ok.body.data.length > 0);
    for (const user of ok.body.data) {
      assert.equal(user.password, undefined);
      assert.equal(user.otp, undefined);
    }
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

describe('Teacher CRUD', () => {
  let id;
  let token;

  before(async () => {
    token = await loginToken();
  });

  test('writes without a JWT answer 401 and change nothing', async () => {
    const [{ count: countBefore }] = await DB('teacher').count({ count: '*' });
    const body = { teacher_name: 'Mallory', type: 1 };

    const create = await http('POST', '/api/teachers', { body });
    assert.equal(create.status, 401, create.text);
    const [{ count: countAfter }] = await DB('teacher').count({ count: '*' });
    assert.equal(Number(countAfter), Number(countBefore), 'nothing inserted');

    const existing = await DB('teacher').whereNull('deleted_at').first();
    const update = await http('PUT', `/api/teachers/${existing.id}`, { body });
    assert.equal(update.status, 401, update.text);
    const forged = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.c2lnbmF0dXJlLWZyb20tYW5vdGhlci1zZWNyZXQ';
    const remove = await http('DELETE', `/api/teachers/${existing.id}`, { token: forged });
    assert.equal(remove.status, 401, remove.text);

    const row = await DB('teacher').where('id', existing.id).first();
    assert.equal(row.teacher_name, existing.teacher_name, 'not updated');
    assert.equal(row.deleted_at, null, 'not deleted');
  });

  test('reads stay public', async () => {
    const res = await http('GET', '/api/teachers?limit=1');
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);
  });

  test('invalid filters answer 400', async () => {
    const res = await http('GET', `/api/teachers?${new URLSearchParams({ 'teacher_name:nope': 'x' })}`);
    assert.equal(res.status, 400, res.text);
    assert.equal(res.body.status, false);
  });

  test('create validates input with 422', async () => {
    const missing = await http('POST', '/api/teachers', { token, body: { type: 1 } });
    assert.equal(missing.status, 422, missing.text);
    assert.equal(missing.body.status, false);
    assert.equal(missing.body.data.column, 'teacher_name');

    const badType = await http('POST', '/api/teachers', { token, body: { teacher_name: 'Ada', type: 'abc' } });
    assert.equal(badType.status, 422, badType.text);
    assert.equal(badType.body.data.column, 'type');
  });

  test('create', async () => {
    const res = await http('POST', '/api/teachers', {
      token,
      body: {
        teacher_name: 'Ada Lovelace', type: 2, address: 'London', saldo: 150000, teacher_class: '7',
      },
    });
    assert.equal(res.status, 201, res.text);
    assert.equal(res.body.status, true);
    id = res.body.data.id;
    assert.ok(id);
  });

  test('list', async () => {
    const res = await http('GET', `/api/teachers?${new URLSearchParams({ 'id:eq': id })}`);
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);
    assert.equal(Number(res.body.metadata.item_total), 1);
    assert.equal(res.body.data[0].teacher_name, 'Ada Lovelace');
  });

  test('get', async () => {
    const res = await http('GET', `/api/teachers/${id}`);
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.data.id, id);
    assert.equal(res.body.data.teacher_name, 'Ada Lovelace');
  });

  test('get unknown id answers 404', async () => {
    const res = await http('GET', '/api/teachers/987654');
    assert.equal(res.status, 404, res.text);
    assert.equal(res.body.status, false);
  });

  test('update', async () => {
    const res = await http('PUT', `/api/teachers/${id}`, { token, body: { teacher_name: 'Ada King' } });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);

    const updated = await http('GET', `/api/teachers/${id}`);
    assert.equal(updated.body.data.teacher_name, 'Ada King');
    assert.equal(updated.body.data.type, 2);
  });

  test('update validates input with 422', async () => {
    const res = await http('PUT', `/api/teachers/${id}`, { token, body: { type: 9 } });
    assert.equal(res.status, 422, res.text);
    assert.equal(res.body.data.column, 'type');
  });

  test('delete is a soft delete and hides the row', async () => {
    const res = await http('DELETE', `/api/teachers/${id}`, { token });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.status, true);

    const row = await DB('teacher').where('id', id).first();
    assert.ok(row, 'row is kept');
    assert.ok(row.deleted_at, 'deleted_at is set');

    const list = await http('GET', `/api/teachers?${new URLSearchParams({ 'id:eq': id })}`);
    assert.equal(list.status, 200, list.text);
    assert.equal(list.body.data.length, 0);
    assert.equal(Number(list.body.metadata.item_total), 0);

    const all = await http('GET', '/api/teachers?limit=0');
    assert.ok(!all.body.data.some((t) => t.id === id));

    const get = await http('GET', `/api/teachers/${id}`);
    assert.equal(get.status, 404, get.text);

    const again = await http('DELETE', `/api/teachers/${id}`, { token });
    assert.equal(again.status, 404, again.text);
  });
});
