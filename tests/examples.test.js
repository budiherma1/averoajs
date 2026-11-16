// The boilerplate's example domain: the Teacher and Rooms models, SampleController,
// routes/v2, the POST /api/users admin sample and TeacherPolicy. The `minimal` starter
// (npm create averoa -- --starter minimal) removes these files together with this test.
import {
  describe, test, before, after,
} from 'node:test';
import assert from 'node:assert/strict';
import { testApp, fakeMail } from '@averoa/core/testing.js';
import { setTestEnv } from './helpers.js';

setTestEnv({ AUTH_RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_FAILED_MAX: '1000', RATE_LIMIT_ENABLED: 'false' });

const DEMO = { email: 'demo@averoa.test', password: 'password' }; // admin
const MEMBER = { email: 'member@averoa.test', password: 'password' }; // not an admin

let app;
let DB;
let http;
let Gate;
let Users;
let Teacher;
let AuthService;
let mailer;

async function login(credentials) {
  const res = await http('POST', '/api/auth/login', { body: credentials });
  assert.equal(res.status, 200, res.text);
  return res.body.data;
}

/** POST /api/auth/login as the seeded demo user; returns the JWT. */
const loginToken = async () => (await login(DEMO)).token;

let counter = 0;

/** Registers a fresh, unverified user; resolves { email, data, mail }. */
async function register(prefix = 'user') {
  const email = `${prefix}${Date.now().toString(36)}${(counter += 1)}@example.test`;
  const res = await http('POST', '/api/auth/register', { body: { first_name: 'Test', email, password: 'correct horse battery' } });
  assert.equal(res.status, 201, res.text);
  await AuthService.settled(); // the verification mail is sent after the response
  const [mail] = mailer.to(email);
  return { email, data: res.body.data, mail };
}

const tokenFromMail = (mail) => {
  const match = /[?&]token=([A-Za-z0-9_-]+)/.exec(mail.text);
  assert.ok(match, `no token link in mail: ${mail.text}`);
  return match[1];
};

before(async () => {
  mailer = await fakeMail();
  app = await testApp();
  ({ DB, http } = app);
  ({ Gate } = await import('@averoa/utilities'));
  ({ Users, Teacher } = await import('#models'));
  ({ default: AuthService } = await import('#app/Services/AuthService.js'));
});

after(async () => {
  await AuthService?.settled();
  mailer?.restore();
  await app?.close();
});

describe('sample routes', () => {
  test('GET /api answers JSON', async () => {
    const res = await http('GET', '/api');
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Averoa');
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

  test('POST /api/users is for admins only (a fresh self-registered account gets nothing)', async () => {
    const reg = await http('POST', '/api/auth/register', { body: { first_name: 'M', email: `member${Date.now()}@example.test`, password: 'password1' } });
    assert.equal(reg.status, 201, reg.text);
    const res = await http('POST', '/api/users', { token: reg.body.data.token, body: { first_name: 'A', email: 'a@example.com', password: 'password' } });
    assert.equal(res.status, 403, res.text);
    assert.equal(res.body.data, undefined);
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
      assert.deepEqual(Object.keys(user).sort(), ['email', 'first_name', 'id', 'last_name']);
    }
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

describe('EnsureEmailVerified', () => {
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

test('OpenAPI documents the teachers CRUD', async () => {
  const res = await http('GET', '/api/openapi.json');
  assert.equal(res.status, 200, res.text);
  const doc = res.body;
  const list = doc.paths['/api/teachers'].get;
  assert.equal(list.summary, 'List Teacher');
  assert.ok(list.parameters.some((p) => p.name === 'orderBy'));
  assert.ok(list.parameters.some((p) => p.name === '$relations'));
  assert.equal(list.security, undefined, 'reads are public');
  assert.deepEqual(list.responses[200].content['application/json'].schema.properties.data.items, { $ref: '#/components/schemas/Teacher' });

  assert.deepEqual(Object.keys(doc.paths['/api/teachers/{id}']).sort(), ['delete', 'get', 'put']);
  for (const op of [doc.paths['/api/teachers'].post, doc.paths['/api/teachers/{id}'].put, doc.paths['/api/teachers/{id}'].delete]) {
    assert.deepEqual(op.security, [{ bearerAuth: [] }]);
  }
  assert.deepEqual(doc.paths['/api/teachers'].post.requestBody.content['application/json'].schema, { $ref: '#/components/schemas/TeacherCreate' });

  const teacher = doc.components.schemas.Teacher.properties;
  assert.deepEqual(teacher.id, { type: 'integer' });
  assert.deepEqual(teacher.teacher_name, { type: ['string', 'null'] });
  assert.deepEqual(doc.components.schemas.TeacherCreate.required, ['teacher_name', 'type']);
});
